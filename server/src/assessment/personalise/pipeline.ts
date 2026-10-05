import { and, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";

import { bankItemSchema, codingSpecSchema, mcqSpecSchema, type BankItem } from "../../../../shared/bank";
import type { Catalog } from "../../../../shared/catalog";
import { outcomeTaskVariant, REUSE_RATIO, type Personalisation, type Slot, type Understanding } from "../../../../shared/personalise";
import { estimateSeconds, sizeProblems, SIZE_LIMITS, SLOT_FLOOR_SEC, TOTAL_MAX_SEC, TOTAL_MIN_SEC, type TimingConstants } from "../../../../shared/timing";
import { isSoftSkillId } from "../../../../shared/softSkills";
import { checkTask, taskSchema } from "../../../../shared/tasks";
import { getOutcome } from "../../goals/outcomes";
import { AiBudgetPausedError } from "../../ai/router";
import type { AiService } from "../../ai/service";
import { activeItems, citedRefs, seenItemIds, toColumns } from "../../bank/repo";
import { balanceTiming, timingConstants, type BalancePick } from "../../bank/timing";
import { validateBankItem } from "../../bank/validate";
import type { Db } from "../../db";
import * as schema from "../../db/schema";
import { newId, now } from "../../lib/ids";
import { runSnippet, SandboxUnavailableError, type PolyglotDeps } from "../../sandbox/polyglot";
import {
  allowsRoleplay,
  ASSESSMENT_ROLEPLAY_TURNS,
  compactEntry,
  decisionAnswersSchema,
  groundingProblems,
  isProcessSkill,
  loadHandbookIndex,
  mergePicks,
  pickEntries,
  roleplayScenarioFor,
  versionsOf,
  type HandbookIndex,
} from "./grounding";
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
        /** v4.2: handbook entries the item depends on, `kind:id`. Required for process skills. */
        handbookRefs: z.array(z.string().max(80)).max(8).default([]),
        /** v4.2: classify-request items only: item id → the request's facts (decision-tool answers). */
        facts: z.record(z.string().max(40), decisionAnswersSchema).nullable().default(null),
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
  1-2 sampleTests, 3-5 hiddenTests incl. an edge case; mark every test "tier": "core" (the job itself;
  at least 2 core) or "edge" (a boundary case: empty input, zero, huge values); no randomness, clocks or network;
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
  a title, columns, <= 10 rows with "issue" on the problem ones, and up to 3 questions), categorize
  (mode "classify-request" with category ids from bug|bug-warranty|bug-support|enhancement|change-request|
  new-feature|clarification, or "gap-analysis" with ootb|configuration|customisation|new-feature, or
  "generic"; 2-7 categories {id,label}; 4-5 items (max ${SIZE_LIMITS.categorizeItems}) {id,text <= 12 words,explanation}; "answer"
  maps every item id to a category id, using at least 2 categories), form (variant cr|mom|status|template;
  "context" <= ${SIZE_LIMITS.formContextWords} words: the client email, transcript lines or a markdown pipe table; templateId null;
  2 fields (max ${SIZE_LIMITS.formFields}, only with a very short context) {id,label,input text|textarea|number|select|date,
  options for select,required}; each field takes ~20 s, so keep the context near 50 words;
  "checks" [{fieldId,expected}] only on number/select/text fields with one right answer (e.g. the RAG
  status or a total); 1-3 rubric {label,points 1-3,description}; "sampleAnswer" for every field that
  passes every check); write may set variant "email" or "explain";
  speak (an answer said out loud): {kind "speak", title <= 10 words, prompt <= 60 words (the
  situation and what to say), audience team|client|manager|interview, prepSec 20, maxSec 60-90,
  lookFor 2-5 short lines a good answer covers, writtenFallback (the same task in writing: "Write
  what you would say ..."), explanation (what a strong answer does)}; it must be sayable in 60-90 s;
- soft-skill slots ("soft": true) are everyday work situations in the person's context: speak
  (a stand-up update, explaining a 2-day delay to a client, introducing yourself and your last
  project), write (an email or chat message; "rewrite for tone": put the blunt or messy original in
  "sourceText" (<= 60 words) and ask for a rewrite that keeps the facts; "explain simply": variant
  "explain"), rank ("put this update in order": 4-6 parts of an update or a day's tasks) or scenario
  (2-3 steps of a feedback, teamwork or listening situation). Plain words, no trick answers;
- tags: 1-4 short context tags (e.g. "international clients", "Laravel").
Handbook grounding (slots with "grounded": true, and any item about a process or a term):
- "handbook" is the company's process handbook: ground truth. Use its definitions, Oyelabs meanings
  and rule statements, never your own; an entry with status "to-confirm" is the industry standard.
- set "handbookRefs" to the refs ("kind:id", from "handbook" only, 1-4) the item's answer depends on;
  the slot's "refs" are the most relevant. A grounded item without valid refs is rejected.
- categorize "classify-request": also set "facts", mapping every item id to the decision tool's
  answers {worksAsSpecified yes|no, inScope yes|no, warranty not-live|yes|no, changeKind
  change|improve|neither, brandNew yes|no} (only the questions that apply). The keyed answer must
  be what the decision tool gives: works as specified = no and in scope = yes → bug (warranty
  not-live), bug-warranty (yes) or bug-support (no); otherwise changeKind change → change-request,
  improve → enhancement, neither → new-feature (brandNew yes) or clarification (no). Code recomputes
  it and rejects a mismatch. "facts" is null for every other item.
- roleplay (subtype "roleplay"): task {kind "roleplay", prompt <= 25 words, scenarioId and personaId
  exactly as the slot gives them, maxTurns ${ASSESSMENT_ROLEPLAY_TURNS.min}-${ASSESSMENT_ROLEPLAY_TURNS.max}, brief <= 30 words (what to achieve), 2-4 rubric
  {label,points 1-3,description}, followUp false}. Keep it inside the slot's seconds (~25 s a reply).
- outcome slots (with "outcome"): the item tests the practical goal itself as a task of the same kind
  as outcome.model (its capstone, shortened). Write a new situation in the person's context (other
  names, files and values), not a copy, and keep it inside the slot's seconds. terminal: {kind
  "terminal", title, prompt, cwd, intro (what the terminal shows first), files (<= 3, e.g. a file with
  conflict markers), steps 1-4 {id, goal, accept: 1-6 JS regex sources tested against the command
  with whitespace collapsed, output}, fileChecks [{path, mustContain, mustNotContain}], explanation};
  an empty answer must not pass.
Only the field for the slot's type is non-null. Return {"items":[...]} for the slots given.`;

/** v4.2: what a slot carries for handbook grounding: its suggested refs and role-play scenario. */
interface SlotGrounding {
  grounded: boolean;
  refs: string[];
  roleplay: { scenarioId: string; personaId: string } | null;
}

/** v4.3: what an outcome slot carries: its case and the capstone, shortened, as the model. */
export interface OutcomeModel {
  title: string;
  model: Record<string, unknown>;
}

function slotLine(slot: Slot, language: string | null, grounding?: SlotGrounding, outcome?: OutcomeModel) {
  return {
    slot: slot.index,
    skill: slot.skillName,
    type: slot.type,
    subtype: slot.subtype,
    difficulty: slot.difficulty,
    seconds: slot.targetSec,
    ...(slot.type === "coding" || slot.subtype === "mcq-code" ? { language: language ?? "javascript" } : {}),
    hint: slot.hint || undefined,
    ...(isSoftSkillId(slot.skillId) ? { soft: true } : {}),
    ...(grounding?.grounded ? { grounded: true } : {}),
    ...(grounding?.refs.length ? { refs: grounding.refs } : {}),
    ...(grounding?.roleplay ? grounding.roleplay : {}),
    ...(outcome ? { outcome: { caseId: slot.outcomeCaseId, title: outcome.title, model: outcome.model } } : {}),
  };
}

/** v4.3: the case and shortened capstone behind every outcome slot of a sheet. */
export function outcomeModels(db: Db, slots: readonly Slot[]): Map<string, OutcomeModel> {
  const out = new Map<string, OutcomeModel>();
  for (const slot of slots) {
    if (!slot.outcomeCaseId || out.has(slot.outcomeCaseId)) continue;
    const outcome = getOutcome(db, slot.outcomeCaseId);
    if (outcome?.capstone.kind === "task") out.set(slot.outcomeCaseId, { title: outcome.title, model: outcomeTaskVariant(outcome.capstone.task) });
  }
  return out;
}

/**
 * v4.3: the fallback for an outcome slot nothing else filled: the case's capstone, shortened. A
 * case goal is always tested as a task, with or without a model. Not stored in the bank.
 */
export function outcomeFallbackItem(slot: Slot, outcome: OutcomeModel, departmentId: string): BankItem | null {
  const prompt = String(outcome.model.prompt ?? outcome.title);
  const parsed = bankItemSchema.safeParse({
    id: `outcome-${slot.outcomeCaseId}-${slot.index}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 90),
    departmentId,
    skillId: slot.skillId,
    type: "task",
    difficulty: Math.min(5, Math.max(1, slot.difficulty)),
    estMinutes: Math.max(0.5, Math.min(6, slot.targetSec / 60)),
    prompt,
    task: outcome.model,
    tags: ["outcome"],
  });
  if (!parsed.success || !parsed.data.task || checkTask(parsed.data.task).length > 0) return null;
  return parsed.data;
}

type SkillLookup = ReadonlyMap<string, Catalog["skills"][number]>;

/** The grounding of one slot: process skills get handbook refs; role-play slots get a scenario. */
function groundingFor(slot: Slot, skills: SkillLookup, index: HandbookIndex): SlotGrounding {
  const skill = skills.get(slot.skillId);
  const grounded = isProcessSkill(skill);
  const roleplay = slot.subtype === "roleplay" && allowsRoleplay(slot.skillId) ? roleplayScenarioFor(slot.index, slot.hint) : null;
  const refs = skill && (grounded || roleplay) ? pickEntries(index, { skill, hint: slot.hint, subtype: slot.subtype, scenarioTermIds: roleplay?.termIds }) : [];
  return { grounded, refs, roleplay: roleplay ? { scenarioId: roleplay.scenarioId, personaId: roleplay.personaId } : null };
}

/** The user message of one generation call: the context, the slots and (when needed) the handbook. */
function generationUser(context: unknown, group: readonly Slot[], skills: SkillLookup, index: HandbookIndex, outcomes: ReadonlyMap<string, OutcomeModel> = new Map()) {
  const groundings = group.map((s) => groundingFor(s, skills, index));
  const refs = mergePicks(groundings.map((g) => g.refs));
  return JSON.stringify({
    context,
    ...(refs.length ? { handbook: refs.map((ref) => compactEntry(index.get(ref)!)) } : {}),
    slots: group.map((s, i) =>
      slotLine(s, skills.get(s.skillId)?.language ?? null, { ...groundings[i], refs: groundings[i].refs.filter((r) => refs.includes(r)) }, s.outcomeCaseId ? outcomes.get(s.outcomeCaseId) : undefined),
    ),
  });
}

/** The generated item as a bank item, with its handbook refs. */
function candidateItem(slot: Slot, candidate: Generated, departmentId: string, tags: string[]) {
  return bankItemSchema.safeParse({
    id: `gen-${slot.skillId}-${newId().toLowerCase()}`.slice(0, 90),
    departmentId,
    skillId: slot.skillId,
    type: slot.type,
    difficulty: Math.min(5, Math.max(1, slot.difficulty)),
    estMinutes: Math.max(0.5, Math.min(6, slot.targetSec / 60)),
    prompt: candidate.prompt,
    coding: slot.type === "coding" ? candidate.coding : null,
    mcq: slot.type === "mcq" ? candidate.mcq : null,
    task: slot.type === "task" ? candidate.task : null,
    tags,
    ...(candidate.handbookRefs.length ? { handbookRefs: [...new Set(candidate.handbookRefs)] } : {}),
  });
}

/** Stores a validated generated item in the bank, citing its handbook entries at their current versions. */
function storeGenerated(db: Db, item: BankItem, versions: Map<string, number>, at: number): void {
  db.insert(schema.questionBank)
    .values({ ...toColumns(item), handbookRefs: citedRefs(item.handbookRefs, versions), status: "active", source: "generated", validatedAt: at, createdAt: at, updatedAt: at })
    .onConflictDoNothing()
    .run();
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
  grounding?: { index: HandbookIndex; processSkill: boolean },
): Promise<string[]> {
  const problems = [...sizeProblems(item)];
  if (slot.outcomeCaseId && (item.task as { kind?: string } | null)?.kind !== slot.subtype) problems.push(`the outcome task must be a ${slot.subtype} task`);
  if (grounding) {
    problems.push(...groundingProblems({ skillId: slot.skillId, processSkill: grounding.processSkill, refs: item.handbookRefs ?? [], index: grounding.index, task: item.task, facts: candidate.facts }));
  }
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
  const handbook = loadHandbookIndex(db);

  const understanding = await understand(deps, userId, { assessmentId });
  const slots = understanding.slots;
  const outcomes = outcomeModels(db, slots);
  const seen = seenItemIds(db, userId);
  // v4.4: soft-skill items live under the "soft" area department; the sheet's own skills bring them in.
  const pool = activeItems(db, setup.departmentId, slots.map((s) => s.skillId)).filter((i) => !seen.has(i.id) && !setup.skip.some((s) => s.skillId === i.skillId));
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
  // An outcome slot is never filled from the bank here: it follows its case's capstone.
  const ranked = slots
    .filter((slot) => !slot.outcomeCaseId)
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
  if (!canGenerate) report.fallbackReason = "No AI credential is set up, so this test was built from the question library only.";
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
          user: generationUser(contextOf(profile, understanding.themes), group, skillsById, handbook, outcomes),
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
        const parsed = candidateItem(slot, candidate, setup.departmentId, [...new Set([...candidate.tags, ...understanding.themes.slice(0, 2)])].slice(0, 6));
        if (!parsed.success) {
          failed.push(slot);
          const issue = parsed.error.issues[0];
          report.rejected.push({ slot: slot.index, reason: `shape: ${issue?.path.join(".") === "handbookRefs" || issue?.path[0] === "handbookRefs" ? "handbook refs must be kind:id" : (issue?.message ?? "invalid")}` });
          continue;
        }
        const problems = await validateCandidate(deps, slot, candidate, parsed.data, constants, { index: handbook, processSkill: isProcessSkill(skillsById.get(slot.skillId)) });
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

  // 5. Whatever is still open comes from the bank (relaxing limits only as a last resort). An
  //    outcome slot takes its case's shortened capstone first, so the goal is still tested as a task.
  for (const slot of slots) {
    if (chosen.has(slot.index)) continue;
    const model = slot.outcomeCaseId ? outcomes.get(slot.outcomeCaseId) : undefined;
    const fromCapstone = model ? outcomeFallbackItem(slot, model, setup.departmentId) : null;
    if (fromCapstone) {
      chosen.set(slot.index, { item: fromCapstone, origin: "fallback", bankItemId: null });
      report.fromBankAfterFailures += 1;
      continue;
    }
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

  // Validated new items join the bank for everyone, citing the handbook versions they were checked against.
  const at = now();
  const versions = versionsOf(handbook);
  for (const item of newItems) storeGenerated(db, item, versions, at);

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
  const skillsById = new Map(catalog.skills.map((s) => [s.id, s]));
  const handbook = loadHandbookIndex(deps.db);
  const result = await deps.ai.generateJson({
    purpose: "item_generate",
    task: "item_generate",
    system: GENERATE_SYSTEM,
    user: generationUser(contextOf(profile, understanding.themes), [slot], skillsById, handbook, outcomeModels(deps.db, [slot])),
    schema: generatedSchema,
    schemaName: "assessment_items",
    maxOutputTokens: 1500,
    meta: { subjectUserId: userId, assessmentId },
  });
  const candidate = result.data.items.find((i) => i.slot === slot.index) ?? result.data.items[0];
  if (!candidate) return { item: null, problems: ["nothing returned"] };
  const parsed = candidateItem(slot, candidate, setup.departmentId, candidate.tags);
  if (!parsed.success) return { item: null, problems: [parsed.error.issues[0]?.message ?? "invalid"] };
  const problems = await validateCandidate(deps, { ...slot, index: candidate.slot }, candidate, parsed.data, constants, { index: handbook, processSkill: isProcessSkill(skillsById.get(slot.skillId)) });
  if (!problems.length && parsed.data.type === "mcq" && !candidate.answerIsOutput) {
    const disputed = await checkTextMcqs(deps, [{ slot: candidate.slot, item: parsed.data }], { assessmentId, userId }).catch(() => new Map([[candidate.slot, "could not be checked"]]));
    if (disputed.size) problems.push(...disputed.values());
  }
  if (problems.length) return { item: null, problems };
  storeGenerated(deps.db, parsed.data, versionsOf(handbook), now());
  return { item: parsed.data, problems: [] };
}

/** A different bank item for the same slot, not already on this sheet and not seen before. */
export function swapCandidate(db: Db, userId: string, departmentId: string, slot: Slot, exclude: ReadonlySet<string>): BankItem | null {
  const constants = timingConstants(db);
  const seen = seenItemIds(db, userId);
  const pool = activeItems(db, departmentId, [slot.skillId]).filter((i) => !seen.has(i.id) && !exclude.has(i.id));
  return bestFor(slot, pool, new Set(), [], constants) ?? bestFor(slot, pool, new Set(), [], constants, true);
}
