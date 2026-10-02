import { and, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";

import { bankItemSchema, codingSpecSchema, mcqSpecSchema, type BankItem } from "../../../../shared/bank";
import { REUSE_RATIO, type Personalisation, type Slot, type Understanding } from "../../../../shared/personalise";
import { estimateSeconds, sizeProblems, SIZE_LIMITS, SLOT_FLOOR_SEC, TOTAL_MAX_SEC, TOTAL_MIN_SEC, type TimingConstants } from "../../../../shared/timing";
import { taskSchema } from "../../../../shared/tasks";
import { AiBudgetPausedError } from "../../ai/router";
import type { AiService } from "../../ai/service";
import { activeItems, seenItemIds, toColumns } from "../../bank/repo";
import { balanceTiming, timingConstants, type BalancePick } from "../../bank/timing";
import { validateBankItem } from "../../bank/validate";
import type { Db } from "../../db";
import * as schema from "../../db/schema";
import { newId, now } from "../../lib/ids";
import { runSnippet, SandboxUnavailableError, type PolyglotDeps } from "../../sandbox/polyglot";
import { profileFor, understand, type ProfileInput } from "./understand";

/**
 * The personalised assessment pipeline (v4.1 §1b), run as the `assessment.personalise` job so the
 * learner never waits on it:
 *
 *   understand (Haiku, cached by input hash)
 *   → reuse fitting bank items, up to the personalisation level's share
 *   → write the rest in 2–3 batched Sonnet calls, in the learner's own context
 *   → validate every item (tests, snippet output, a Haiku check for text MCQs, keys, size, time)
 *   → regenerate failures at most twice, then fill from the bank
 *   → balance the total to 26–32 minutes, store, and add the new items to the bank for everyone.
 */

export interface PersonaliseDeps extends PolyglotDeps {
  db: Db;
  ai: AiService;
  log?: (message: string) => void;
}

export interface PersonaliseReport {
  level: Personalisation;
  understandingSource: Understanding["source"];
  intent: string[];
  themes: string[];
  reused: number;
  generated: number;
  fromBankAfterFailures: number;
  regenerations: number;
  rejected: { slot: number; reason: string }[];
  estSeconds: number;
  /** Set when generation could not run (no credential, budget, provider down); bank-only then. */
  fallbackReason: string | null;
  costMicros: number;
}

// ---------------------------------------------------------------------------
// Generation contract
// ---------------------------------------------------------------------------

const generatedSchema = z.object({
  items: z
    .array(
      z.object({
        slot: z.number().int().min(0).max(40),
        prompt: z.string().min(5).max(1200),
        coding: codingSpecSchema.nullable(),
        mcq: mcqSpecSchema.nullable(),
        task: taskSchema.nullable(),
        /** For an output-prediction MCQ: the correct option is exactly what the snippet prints. */
        answerIsOutput: z.boolean().default(false),
        tags: z.array(z.string().max(40)).max(6).default([]),
      }),
    )
    .max(20),
});
type Generated = z.infer<typeof generatedSchema>["items"][number];

export const GENERATE_SYSTEM = `You write short assessment items for one employee of a software agency, as JSON.
Each item fills one slot: keep its skill, type, subtype and difficulty. Set it in the person's own
context (their stack, tools and the scenario hint). Items are small and practical, never tricky.

Hard limits (items over them are rejected):
- question text <= ${SIZE_LIMITS.promptWords} words; code goes in fields, not the prompt;
- coding: starterCode <= ${SIZE_LIMITS.starterLines} lines and the learner changes <= ${SIZE_LIMITS.changedLines} lines;
  referenceSolution passes every test, starterCode fails at least one hidden test;
  mode "function" (javascript/typescript/python/php): tests {"args":[...],"expected":...} plain JSON;
  mode "program" (java/dart): tests {"stdin":"...","expected":"stdout"}; class Main for java;
  mode "sql" (SQLite): tests {"setup":"CREATE...;INSERT...;","expected":[{row}]}, always ORDER BY;
  1-2 sampleTests, 3-5 hiddenTests incl. an edge case; no randomness, clocks or network;
- mcq: exactly 4 options of <= ${SIZE_LIMITS.optionWords} words, one correctIndex, an explanation; never refer to positions.
  "mcq-code": put <= ${SIZE_LIMITS.snippetLines} lines in snippet + snippetLanguage. If the question asks what the code
  prints, set answerIsOutput true and make the correct option exactly the printed output with lines
  joined by single spaces;
- task: one of write (wordLimit <= ${SIZE_LIMITS.writeWords}, 3-4 rubric criteria, sampleAnswer), rank (<= ${SIZE_LIMITS.rankItems} items,
  correctOrder lists every id once), calculate (a small table, each field with answer, tolerance and
  an "expression" over T[row][col] data cells that reproduces the answer), scenario (2-3 steps), spot
  (6-10 segments, at least one and at most half flawed, each flawed one with "issue"),
  excel (grid <= 12 rows x 8 cols of strings, editable cells A1-H12 <= ${SIZE_LIMITS.excelCells}, checks with expected
  values and optional requireFormula/functions, and a "solution" formula or value for every editable
  cell; functions: SUM, AVERAGE, IF, COUNTIF(S), SUMIF(S), XLOOKUP, VLOOKUP, MATCH, NETWORKDAYS),
  allocate (2-6 people with capacity hours, 1-4 projects with need hours, optional blocked pairs;
  must be feasible), sim (a simulated screen: app keka-timesheets|keka-psa|teams|github-pr|outlook,
  a title, columns, <= 10 rows with "issue" on the problem ones, and up to 3 questions); write may set
  variant "email" or "explain";
- tags: 1-4 short context tags (e.g. "international clients", "Laravel").
Only the field for the slot's type is non-null. Return {"items":[...]} for the slots given.`;

function slotLine(slot: Slot, language: string | null) {
  return {
    slot: slot.index,
    skill: slot.skillName,
    type: slot.type,
    subtype: slot.subtype,
    difficulty: slot.difficulty,
    seconds: slot.targetSec,
    ...(slot.type === "coding" || slot.subtype === "mcq-code" ? { language: language ?? "javascript" } : {}),
    hint: slot.hint || undefined,
  };
}

function contextOf(profile: ProfileInput, themes: string[]) {
  return {
    department: profile.department,
    track: profile.track,
    stack: profile.stacks,
    level: profile.level,
    themes,
    about: profile.description.slice(0, 400),
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const normalise = (text: string) => text.replace(/\s+/g, " ").trim().toLowerCase();

const checkSchema = z.object({
  results: z.array(z.object({ slot: z.number().int(), correctIndex: z.number().int().min(-1).max(5), ambiguous: z.boolean() })),
});

export const CHECK_SYSTEM = `You check multiple-choice questions. For each, answer independently: which option
index (0-based) is correct, or -1 if none is; and whether more than one option could be argued
correct or the question is unclear (ambiguous: true). Return JSON {"results":[...]}.`;

async function validateCandidate(
  deps: PersonaliseDeps,
  slot: Slot,
  candidate: Generated,
  item: BankItem,
  constants: TimingConstants,
): Promise<string[]> {
  const problems = [...sizeProblems(item)];
  if (item.mcq && item.mcq.options.length !== 4) problems.push("an MCQ needs exactly 4 options");
  const seconds = estimateSeconds(item, constants);
  if (seconds > slot.targetSec * 1.15) problems.push(`estimated ${seconds}s, slot allows ${slot.targetSec}s`);
  if (problems.length) return problems;
  problems.push(...(await validateBankItem(deps, item).catch((error: unknown) => [`could not run: ${String(error)}`])));
  if (item.mcq?.snippet && item.mcq.snippetLanguage && candidate.answerIsOutput) {
    try {
      const out = await runSnippet(deps, item.mcq.snippetLanguage, item.mcq.snippet);
      if (normalise(out.stdout) !== normalise(item.mcq.options[item.mcq.correctIndex])) problems.push("the keyed answer is not what the snippet prints");
    } catch (error) {
      if (!(error instanceof SandboxUnavailableError)) throw error;
      problems.push("the snippet could not be run to check the key");
    }
  }
  return problems;
}

/** One Haiku call for every text MCQ in the round. Items the checker disputes are rejected. */
async function checkTextMcqs(deps: PersonaliseDeps, items: { slot: number; item: BankItem }[], meta: { assessmentId: string; userId: string }): Promise<Map<number, string>> {
  const rejected = new Map<number, string>();
  if (items.length === 0) return rejected;
  const result = await deps.ai.generateJson({
    purpose: "item_check",
    task: "item_check",
    system: CHECK_SYSTEM,
    user: JSON.stringify(items.map(({ slot, item }) => ({ slot, question: item.prompt, options: item.mcq!.options }))),
    schema: checkSchema,
    schemaName: "mcq_check",
    meta: { subjectUserId: meta.userId, assessmentId: meta.assessmentId },
  });
  for (const { slot, item } of items) {
    const verdict = result.data.results.find((r) => r.slot === slot);
    if (!verdict) rejected.set(slot, "not checked");
    else if (verdict.ambiguous) rejected.set(slot, "ambiguous");
    else if (verdict.correctIndex !== item.mcq!.correctIndex) rejected.set(slot, "the checker disagrees with the key");
  }
  return rejected;
}

// ---------------------------------------------------------------------------
// Reuse
// ---------------------------------------------------------------------------

function subtypeOf(item: BankItem): Slot["subtype"] {
  if (item.type === "coding") return "code";
  if (item.type === "mcq") return item.mcq?.snippet ? "mcq-code" : "mcq-text";
  return (item.task?.kind ?? "scenario") as Slot["subtype"];
}

/** A reused bank item must take at least this share of its slot's target time. */
const REUSE_MIN_SHARE = 0.7;

function fitScore(slot: Slot, item: BankItem, themes: readonly string[], constants: TimingConstants): number | null {
  if (item.skillId !== slot.skillId || item.type !== slot.type) return null;
  if (sizeProblems(item).length > 0) return null;
  const seconds = estimateSeconds(item, constants);
  if (seconds > slot.targetSec * 1.15) return null;
  // Generated items are never swapped by the balancer, so a reused item must carry most of its
  // slot's time or the sheet cannot reach 26 minutes (short PM bank items left it near 23).
  // Only the relaxed last-resort fallback takes shorter ones.
  if (seconds < Math.max(SLOT_FLOOR_SEC[slot.type === "mcq" ? "mcq" : "handsOn"], slot.targetSec * REUSE_MIN_SHARE)) return null;
  let score = 10 - Math.abs(item.difficulty - slot.difficulty) * 3;
  if (subtypeOf(item) === slot.subtype) score += 4;
  const haystack = `${(item.tags ?? []).join(" ")} ${item.prompt}`.toLowerCase();
  for (const theme of themes) if (haystack.includes(theme.toLowerCase())) score += 3;
  if (slot.hint && slot.hint.split(/\s+/).some((w) => w.length > 4 && haystack.includes(w.toLowerCase()))) score += 1;
  return score;
}

/** Best unused bank item for a slot, or null. `relaxed` drops the size/time filters (last resort). */
function bestFor(slot: Slot, pool: readonly BankItem[], used: Set<string>, themes: readonly string[], constants: TimingConstants, relaxed = false): BankItem | null {
  let best: { item: BankItem; score: number } | null = null;
  for (const item of pool) {
    if (used.has(item.id)) continue;
    const score = relaxed ? (item.skillId === slot.skillId && item.type === slot.type ? 5 - Math.abs(item.difficulty - slot.difficulty) : null) : fitScore(slot, item, themes, constants);
    if (score === null) continue;
    if (!best || score > best.score) best = { item, score };
  }
  return best?.item ?? null;
}

// ---------------------------------------------------------------------------
// The pipeline
// ---------------------------------------------------------------------------

export async function personalise(deps: PersonaliseDeps, assessmentId: string, userId: string): Promise<{ picks: (BalancePick & { skillName: string })[]; report: PersonaliseReport }> {
  const { db } = deps;
  const constants = timingConstants(db);
  const { profile, setup, catalog } = profileFor(db, userId);
  const level = (db.select({ p: schema.learnerPriorities.personalisation }).from(schema.learnerPriorities).where(eq(schema.learnerPriorities.userId, userId)).get()?.p ?? "balanced") as Personalisation;
  const skillsById = new Map(catalog.skills.map((s) => [s.id, s]));

  const understanding = await understand(deps, userId, { assessmentId });
  const slots = understanding.slots;
  const seen = seenItemIds(db, userId);
  const pool = activeItems(db, setup.departmentId).filter((i) => !seen.has(i.id) && !setup.skip.some((s) => s.skillId === i.skillId));
  const used = new Set<string>();

  const report: PersonaliseReport = {
    level,
    understandingSource: understanding.source,
    intent: understanding.intent,
    themes: understanding.themes,
    reused: 0,
    generated: 0,
    fromBankAfterFailures: 0,
    regenerations: 0,
    rejected: [],
    estSeconds: 0,
    fallbackReason: null,
    costMicros: 0,
  };

  const chosen = new Map<number, { item: BankItem; origin: "bank" | "generated" | "fallback"; bankItemId: string | null; filler?: boolean }>();

  // 1. Reuse: the best-fitting bank items, up to the level's share, strongest matches first.
  const reuseCap = Math.round(slots.length * REUSE_RATIO[level]);
  const ranked = slots
    .map((slot) => {
      const item = bestFor(slot, pool, new Set(), understanding.themes, constants);
      return { slot, item, score: item ? (fitScore(slot, item, understanding.themes, constants) ?? 0) : -1 };
    })
    .filter((r) => r.item)
    .sort((a, b) => b.score - a.score);
  for (const { slot } of ranked) {
    if (chosen.size >= reuseCap) break;
    const item = bestFor(slot, pool, used, understanding.themes, constants);
    if (!item) continue;
    used.add(item.id);
    chosen.set(slot.index, { item, origin: "bank", bankItemId: item.id });
    report.reused += 1;
  }

  // 2–4. Generate the rest, validate, retry twice.
  let open = slots.filter((s) => !chosen.has(s.index));
  const canGenerate = deps.ai.isConfigured();
  if (!canGenerate) report.fallbackReason = "No AI credential is set up, so this assessment was built from the question bank only.";
  const newItems: BankItem[] = [];

  for (let round = 0; canGenerate && open.length > 0 && round < 3; round += 1) {
    if (round > 0) report.regenerations += open.length;
    // 2–3 calls: hands-on code, hands-on tasks, MCQs (a retry round sends whatever is left in one).
    const groups = round === 0 ? [open.filter((s) => s.type === "coding"), open.filter((s) => s.type === "task"), open.filter((s) => s.type === "mcq")].filter((g) => g.length) : [open];
    const failed: Slot[] = [];
    for (const group of groups) {
      let produced: Generated[] = [];
      try {
        const result = await deps.ai.generateJson({
          purpose: "item_generate",
          task: "item_generate",
          system: GENERATE_SYSTEM,
          user: JSON.stringify({ context: contextOf(profile, understanding.themes), slots: group.map((s) => slotLine(s, skillsById.get(s.skillId)?.language ?? null)) }),
          schema: generatedSchema,
          schemaName: "assessment_items",
          meta: { subjectUserId: userId, assessmentId },
        });
        produced = result.data.items;
      } catch (error) {
        report.fallbackReason =
          error instanceof AiBudgetPausedError
            ? "The monthly AI budget is used up, so the rest came from the question bank."
            : `Generation failed (${error instanceof Error ? error.message.slice(0, 120) : "provider error"}), so the rest came from the question bank.`;
        failed.push(...group);
        break;
      }

      const textMcqs: { slot: number; item: BankItem }[] = [];
      const passed: { slot: Slot; item: BankItem; candidate: Generated }[] = [];
      for (const slot of group) {
        const candidate = produced.find((p) => p.slot === slot.index);
        if (!candidate) {
          failed.push(slot);
          report.rejected.push({ slot: slot.index, reason: "not returned" });
          continue;
        }
        const parsed = bankItemSchema.safeParse({
          id: `gen-${slot.skillId}-${newId().toLowerCase()}`.slice(0, 90),
          departmentId: setup.departmentId,
          skillId: slot.skillId,
          type: slot.type,
          difficulty: Math.min(5, Math.max(1, slot.difficulty)),
          estMinutes: Math.max(0.5, Math.min(6, slot.targetSec / 60)),
          prompt: candidate.prompt,
          coding: slot.type === "coding" ? candidate.coding : null,
          mcq: slot.type === "mcq" ? candidate.mcq : null,
          task: slot.type === "task" ? candidate.task : null,
          tags: [...new Set([...candidate.tags, ...understanding.themes.slice(0, 2)])].slice(0, 6),
        });
        if (!parsed.success) {
          failed.push(slot);
          report.rejected.push({ slot: slot.index, reason: `shape: ${parsed.error.issues[0]?.message ?? "invalid"}` });
          continue;
        }
        const problems = await validateCandidate(deps, slot, candidate, parsed.data, constants);
        if (problems.length) {
          failed.push(slot);
          report.rejected.push({ slot: slot.index, reason: problems.join("; ").slice(0, 200) });
          continue;
        }
        if (parsed.data.type === "mcq" && !candidate.answerIsOutput) textMcqs.push({ slot: slot.index, item: parsed.data });
        passed.push({ slot, item: parsed.data, candidate });
      }

      let disputed = new Map<number, string>();
      try {
        disputed = await checkTextMcqs(deps, textMcqs, { assessmentId, userId });
      } catch {
        for (const t of textMcqs) disputed.set(t.slot, "could not be checked");
      }
      for (const { slot, item } of passed) {
        const why = disputed.get(slot.index);
        if (why) {
          failed.push(slot);
          report.rejected.push({ slot: slot.index, reason: why });
          continue;
        }
        chosen.set(slot.index, { item, origin: "generated", bankItemId: item.id });
        newItems.push(item);
        report.generated += 1;
      }
    }
    open = failed;
    if (report.fallbackReason) break;
  }

  // 5. Whatever is still open comes from the bank (relaxing limits only as a last resort).
  for (const slot of slots) {
    if (chosen.has(slot.index)) continue;
    let item = bestFor(slot, pool, used, understanding.themes, constants) ?? bestFor(slot, pool, used, understanding.themes, constants, true);
    let filler = false;
    if (!item) {
      // Nothing left for this skill: like the bank assembler, fill with the same type from another
      // skill rather than issue a sheet short of its 25 questions.
      item = pool.filter((i) => !used.has(i.id) && i.type === slot.type && sizeProblems(i).length === 0).sort((a, b) => Math.abs(a.difficulty - slot.difficulty) - Math.abs(b.difficulty - slot.difficulty))[0] ?? null;
      filler = true;
    }
    if (!item) continue;
    used.add(item.id);
    chosen.set(slot.index, { item, origin: "fallback", bankItemId: item.id, filler });
    report.fromBankAfterFailures += 1;
  }

  // Validated new items join the bank for everyone.
  const at = now();
  for (const item of newItems) {
    db.insert(schema.questionBank)
      .values({ ...toColumns(item), status: "active", source: "generated", validatedAt: at, createdAt: at, updatedAt: at })
      .onConflictDoNothing()
      .run();
  }

  // 6. Balance to 26–32 minutes, swapping only bank picks.
  const ordered = slots
    .filter((s) => chosen.has(s.index))
    .map((slot) => {
      const c = chosen.get(slot.index)!;
      return c.filler
        ? { item: c.item, skillId: c.item.skillId, skillName: skillsById.get(c.item.skillId)?.name ?? c.item.skillId, group: "filler" as const, origin: c.origin, swappable: true, bankItemId: c.bankItemId }
        : { item: c.item, skillId: slot.skillId, skillName: slot.skillName, group: slot.group, origin: c.origin, swappable: c.origin !== "generated", bankItemId: c.bankItemId };
    });
  const balanced = balanceTiming(ordered, pool.filter((i) => !used.has(i.id)), constants);
  report.estSeconds = balanced.reduce((s, p) => s + estimateSeconds(p.item, constants), 0);
  report.costMicros =
    db
      .select({ m: sql<number>`coalesce(sum(${schema.aiCalls.costMicros}), 0)` })
      .from(schema.aiCalls)
      .where(and(eq(schema.aiCalls.assessmentId, assessmentId), isNotNull(schema.aiCalls.costMicros)))
      .get()?.m ?? 0;
  deps.log?.(
    `personalised ${assessmentId}: ${report.reused} reused, ${report.generated} generated, ${report.fromBankAfterFailures} from bank after failures, est ${Math.round(report.estSeconds / 60)} min, $${(report.costMicros / 1e6).toFixed(4)}`,
  );
  return { picks: balanced, report };
}

export function inTimeWindow(seconds: number): boolean {
  return seconds >= TOTAL_MIN_SEC && seconds <= TOTAL_MAX_SEC;
}

/**
 * One slot, one small call: the admin's "Regenerate" on a single item. Validated exactly like a
 * full run; returns null when the model's attempt does not pass (the caller keeps the old item).
 */
export async function generateOne(deps: PersonaliseDeps, assessmentId: string, userId: string, slot: Slot): Promise<{ item: BankItem | null; problems: string[] }> {
  const constants = timingConstants(deps.db);
  const { profile, setup, catalog } = profileFor(deps.db, userId);
  const understanding = await understand(deps, userId, { assessmentId });
  const language = catalog.skills.find((s) => s.id === slot.skillId)?.language ?? null;
  const result = await deps.ai.generateJson({
    purpose: "item_generate",
    task: "item_generate",
    system: GENERATE_SYSTEM,
    user: JSON.stringify({ context: contextOf(profile, understanding.themes), slots: [slotLine(slot, language)] }),
    schema: generatedSchema,
    schemaName: "assessment_items",
    maxOutputTokens: 1500,
    meta: { subjectUserId: userId, assessmentId },
  });
  const candidate = result.data.items.find((i) => i.slot === slot.index) ?? result.data.items[0];
  if (!candidate) return { item: null, problems: ["nothing returned"] };
  const parsed = bankItemSchema.safeParse({
    id: `gen-${slot.skillId}-${newId().toLowerCase()}`.slice(0, 90),
    departmentId: setup.departmentId,
    skillId: slot.skillId,
    type: slot.type,
    difficulty: slot.difficulty,
    estMinutes: Math.max(0.5, slot.targetSec / 60),
    prompt: candidate.prompt,
    coding: slot.type === "coding" ? candidate.coding : null,
    mcq: slot.type === "mcq" ? candidate.mcq : null,
    task: slot.type === "task" ? candidate.task : null,
    tags: candidate.tags,
  });
  if (!parsed.success) return { item: null, problems: [parsed.error.issues[0]?.message ?? "invalid"] };
  const problems = await validateCandidate(deps, { ...slot, index: candidate.slot }, candidate, parsed.data, constants);
  if (!problems.length && parsed.data.type === "mcq" && !candidate.answerIsOutput) {
    const disputed = await checkTextMcqs(deps, [{ slot: candidate.slot, item: parsed.data }], { assessmentId, userId }).catch(() => new Map([[candidate.slot, "could not be checked"]]));
    if (disputed.size) problems.push(...disputed.values());
  }
  if (problems.length) return { item: null, problems };
  const at = now();
  deps.db.insert(schema.questionBank).values({ ...toColumns(parsed.data), status: "active", source: "generated", validatedAt: at, createdAt: at, updatedAt: at }).onConflictDoNothing().run();
  return { item: parsed.data, problems: [] };
}

/** A different bank item for the same slot, not already on this sheet and not seen before. */
export function swapCandidate(db: Db, userId: string, departmentId: string, slot: Slot, exclude: ReadonlySet<string>): BankItem | null {
  const constants = timingConstants(db);
  const seen = seenItemIds(db, userId);
  const pool = activeItems(db, departmentId).filter((i) => !seen.has(i.id) && !exclude.has(i.id));
  return bestFor(slot, pool, new Set(), [], constants) ?? bestFor(slot, pool, new Set(), [], constants, true);
}
