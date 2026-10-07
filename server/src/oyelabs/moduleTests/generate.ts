import { and, eq, gte, inArray, sql } from "drizzle-orm";

import {
  citationLabel,
  MODULE_TEST_MIN_SOURCE_CHARS,
  MODULE_TEST_SCENARIO_SHARE,
  MODULE_TEST_SIZE,
  moduleTestSummaryLine,
  type ModuleCitation,
  type ModuleItemKind,
  type ModulePassage,
  type ModuleTestSourceSummary,
  type ModuleTestStatus,
} from "../../../../shared/moduleTests";
import { GATE_LIMITS, type TestItemGates, type TestItemPayload, type TopicGroundingContent } from "../../../../shared/topicTests";
import { priceFor, TASK_DEFAULTS } from "../../../../shared/aiRouting";
import { AiNotConfiguredError, type AiService } from "../../ai/service";
import { schema, type Db } from "../../db";
import { JobDeferredError } from "../../jobs/queue";
import { newId, now } from "../../lib/ids";
import { keyIsLongest, runGates, type GateCandidate } from "../../topicTests/gates";
import { writeItems } from "../../topicTests/generate";
import { citationProblem } from "../../topicTests/grounding";
import { sha256 } from "../extract/passages";
import { dropOrphanTexts, moduleContext, queueStaleSources, syncInlineSources, textRows, type ModuleContext, type TextRow } from "./sources";

/**
 * Writing a module's test from its own material (v4.5 Phase 3, PLAN §4.3).
 *
 * 1. Gather: every source has an up-to-date `course_module_texts` row (else queue the reading and
 *    defer). The module's `content_hash` = sha256 over the sorted per-source hashes.
 * 2. Idempotent: nothing to do when `content_hash == generated_hash` (unless an admin asked).
 * 3. Grounding: the passages (each headed with its citation label, "Process.pdf, page 2") become a
 *    v4.3 `topic_grounding` row keyed by the module's managed lesson, capped so the writer's input
 *    stays inside the cost target.
 * 4. Write with Sonnet 5.5 (`module_test_write`), the system prompt + module passages being the
 *    cached prefix; run the v4.3 gates with the module tasks (Haiku); regenerate what fails, at most
 *    twice; drop the rest.
 * 5. Auto-save: items go live as `active`, status `ready` with "8 questions created from …". No
 *    approval step. Regeneration retires (never deletes) the previous generation's items, so past
 *    attempts still read; admin-written and admin-edited items stay.
 */

export const MODULE_TASKS = ["module_test_write", "module_test_relevance", "module_test_answer"] as const;
/** Bumped when the way items are written changes, so every module counts as changed once. */
export const MODULE_GENERATOR_VERSION = 1;
/** Passage characters sent to the writer and the checkers (about 5k words read; see estimateModuleCostUsd). */
export const MODULE_PROMPT_MAX_CHARS = 20_000;
/** The description is shared by every module of a course, so only a little of it is used. */
const DESCRIPTION_MAX_CHARS = 1200;
const DEFER_MS = 20_000;

/** What a module test item stores in `topic_test_items.item` (the v4.3 payload plus where it came from). */
export interface ModuleItemPayload extends TestItemPayload {
  moduleKind: ModuleItemKind;
  moduleOrigin: "generated" | "admin";
  moduleCitation: ModuleCitation | null;
  generation: number;
}

export interface ModuleTestDeps {
  db: Db;
  ai: AiService;
  log?: (message: string) => void;
}

type TestRow = typeof schema.courseModuleTests.$inferSelect;

export function getTestRow(db: Db, sectionId: string): TestRow | undefined {
  return db.select().from(schema.courseModuleTests).where(eq(schema.courseModuleTests.sectionId, sectionId)).get();
}

export function ensureTestRow(db: Db, ctx: ModuleContext): TestRow {
  const existing = getTestRow(db, ctx.section.id);
  if (existing && existing.topicId === ctx.topic.id) return existing;
  const at = now();
  db.insert(schema.courseModuleTests)
    .values({ sectionId: ctx.section.id, courseId: ctx.course.id, topicId: ctx.topic.id, updatedAt: at })
    .onConflictDoUpdate({ target: schema.courseModuleTests.sectionId, set: { courseId: ctx.course.id, topicId: ctx.topic.id, updatedAt: at } })
    .run();
  return getTestRow(db, ctx.section.id)!;
}

export function setTestRow(db: Db, sectionId: string, patch: Partial<Omit<TestRow, "sectionId">>): void {
  db.update(schema.courseModuleTests).set({ ...patch, updatedAt: now() }).where(eq(schema.courseModuleTests.sectionId, sectionId)).run();
}

// ---------------------------------------------------------------------------
// Hashes, passages and the source summary
// ---------------------------------------------------------------------------

/** sha256 over the sorted hashes of the sources that gave text. */
export function moduleContentHash(rows: readonly TextRow[]): string {
  const parts = rows
    .filter((r) => r.status === "done" && r.passages.length > 0)
    .map((r) => `${r.sourceKind}:${r.sourceId}:${r.contentHash ?? ""}`)
    .sort();
  return sha256(JSON.stringify({ v: MODULE_GENERATOR_VERSION, parts }));
}

const KIND_ORDER = { doc: 0, doc_link: 0, video: 1, note: 2, description: 3 } as const;

/**
 * The passages the writer sees, at most `MODULE_PROMPT_MAX_CHARS`: taken round-robin across
 * sources so a long PDF cannot crowd out the notes or a video. The description comes last and short.
 */
export function selectPassages(rows: readonly TextRow[], maxChars = MODULE_PROMPT_MAX_CHARS): ModulePassage[] {
  const sources = rows
    .filter((r) => r.status === "done" && r.passages.length > 0)
    .sort((a, b) => KIND_ORDER[a.sourceKind] - KIND_ORDER[b.sourceKind] || a.title.localeCompare(b.title) || a.sourceId.localeCompare(b.sourceId));
  const queues = sources.map((r) => {
    let budget = r.sourceKind === "description" ? DESCRIPTION_MAX_CHARS : Infinity;
    return r.passages.filter((p) => {
      if (budget <= 0) return false;
      budget -= p.text.length;
      return true;
    });
  });
  const picked: ModulePassage[] = [];
  let used = 0;
  for (let round = 0; queues.some((q) => q.length > round); round++) {
    for (const queue of queues) {
      const passage = queue[round];
      if (!passage) continue;
      if (used + passage.text.length > maxChars) continue;
      picked.push(passage);
      used += passage.text.length;
    }
  }
  // Reading order: by source, then by passage number.
  const order = new Map(sources.map((s, i) => [s.sourceId + s.sourceKind, i]));
  const num = (id: string) => Number(id.split(".").pop() ?? 0);
  return picked.sort((a, b) => (order.get(a.sourceId + a.sourceKind) ?? 0) - (order.get(b.sourceId + b.sourceKind) ?? 0) || num(a.id) - num(b.id));
}

export function sourceSummary(rows: readonly TextRow[], used: readonly ModulePassage[]): ModuleTestSourceSummary {
  const usedSources = new Set(used.map((p) => `${p.sourceKind}:${p.sourceId}`));
  const has = (r: TextRow) => usedSources.has(`${r.sourceKind}:${r.sourceId}`);
  return {
    docs: rows.filter((r) => (r.sourceKind === "doc" || r.sourceKind === "doc_link") && has(r)).length,
    videos: rows.filter((r) => r.sourceKind === "video" && has(r)).length,
    notes: rows.some((r) => r.sourceKind === "note" && has(r)),
    skipped: rows
      .filter((r) => (r.status === "failed" || r.status === "skipped") && r.sourceKind !== "description" && r.sourceKind !== "note")
      .slice(0, 80)
      .map((r) => ({ title: r.title.slice(0, 200), reason: (r.error ?? "We couldn't read it.").slice(0, 300) })),
  };
}

/** Code material: a good share of passages are code blocks or code-like lines. Then items are hands-on. */
export function looksLikeCode(passages: readonly ModulePassage[]): boolean {
  if (passages.length === 0) return false;
  const codeLike = passages.filter((p) => /```/.test(p.text) || p.text.split("\n").filter((l) => /[;{}]\s*$|=>|^\s*(const|let|import|def|function|class|return|SELECT|git|npm|docker)\b/.test(l)).length >= 3);
  return codeLike.length / passages.length >= 0.25;
}

export function buildGrounding(ctx: ModuleContext, passages: readonly ModulePassage[], code: boolean, hash: string): TopicGroundingContent {
  const level = ctx.course.level ?? "intermediate";
  return {
    version: 1,
    topicId: ctx.topic.id,
    title: `${ctx.course.title}: ${ctx.section.title}`,
    level,
    passages: passages.map((p) => ({ id: p.id, source: "section", heading: citationLabel(p), text: p.text })),
    objectives: [
      { id: "scn", text: "Decide what to do at Oyelabs in a situation this module covers", source: "derived" },
      { id: "rec", text: "Explain a rule, step or idea the module states", source: "derived" },
      ...(code ? [{ id: "hands", text: "Do a hands-on task with the code or commands the module shows", source: "derived" as const }] : []),
    ],
    videos: [],
    passagesHash: hash,
  };
}

function storeGrounding(db: Db, grounding: TopicGroundingContent, hash: string): void {
  const at = now();
  const content = grounding as unknown as Record<string, unknown>;
  db.insert(schema.topicGrounding)
    .values({ topicId: grounding.topicId, content, hash, updatedAt: at })
    .onConflictDoUpdate({ target: schema.topicGrounding.topicId, set: { content, hash, updatedAt: at } })
    .run();
}

// ---------------------------------------------------------------------------
// The prompt
// ---------------------------------------------------------------------------

export const MODULE_WRITE_SYSTEM = `You write a short test for ONE module of Oyelabs' internal course. Oyelabs is a software agency
that builds white-label apps for clients. The test checks that a new team member can act on the
module's material at work.
You may use ONLY the module material below. Never test anything it does not say.
Item mix:
- Most items are SCENARIOS (objectiveId "scn"): a short, realistic work situation at Oyelabs ("A client
  emails on Friday asking…", "You are about to hand over…") and the question "What should you do?" or
  "What happens next?". The right answer is what the material says to do.
- A few check UNDERSTANDING (objectiveId "rec"): a rule, step, number or reason the material states.
- If the material is code or commands and objective "hands" is offered, write HANDS-ON items
  (objectiveId "hands"): a small task with the code or commands shown ("Which command…", "What does this
  return…", "Which change fixes…").
Rules (Haladyna item-writing guidelines):
- Every item cites the passage it comes from: passageId plus an EXACT quote copied verbatim from that
  passage (8-40 words) that supports the correct answer.
- 3-5 options. Exactly one correct option, unless the item clearly says "Select ALL that apply".
- No trick wording, no double negatives, no "all of the above" / "none of the above". If a negative is
  unavoidable write it in capitals (NOT).
- Options are of similar length; the correct one must NOT be the longest. Vary which position is correct.
- Each wrong option is a mistake a new team member could really make. Give it in one line in
  "misconception" ("" for the correct option).
- Bands: recall = understand a stated idea; apply = act on it in a situation; harder_apply = combine
  two ideas or spot a pitfall the material warns about.
- Keep the question under 60 words and each option under 15 words. Plain English.
- The explanation says why the key is right, in the material's terms.
Return JSON only.`;

function passageBlock(grounding: TopicGroundingContent): string {
  return grounding.passages.map((p) => `<passage id="${p.id}" heading="${p.heading.replace(/"/g, "'")}">\n${p.text}\n</passage>`).join("\n");
}

/** The cached prefix: the rules plus this module's material (identical across rounds and regenerations). */
export function moduleSystem(grounding: TopicGroundingContent): string {
  return `${MODULE_WRITE_SYSTEM}\n\nModule material (the ONLY source you may use):\n${passageBlock(grounding)}`;
}

export function modulePrompt(grounding: TopicGroundingContent, count: number, round: number, avoid: string[], code: boolean): string {
  const scenario = Math.max(1, Math.round(count * MODULE_TEST_SCENARIO_SHARE));
  const handsOn = code ? Math.max(1, Math.round(count * 0.4)) : 0;
  const mix = code
    ? `about ${handsOn} hands-on ("hands"), ${Math.max(1, count - handsOn - 1)} scenarios ("scn") and the rest understanding ("rec")`
    : `about ${scenario} scenarios ("scn") and the rest understanding ("rec")`;
  return [
    `Module: ${grounding.title}`,
    `Level: ${grounding.level}`,
    `Round: ${round}`,
    `Write exactly ${count} items: ${mix}.`,
    "",
    "Objectives (tag each item with one objectiveId):",
    ...grounding.objectives.map((o) => `<objective id="${o.id}">${o.text}</objective>`),
    ...(avoid.length ? ["", "Do not repeat or paraphrase these existing questions:", ...avoid.slice(0, 20).map((a) => `- ${a.slice(0, 200)}`)] : []),
  ].join("\n");
}

function kindOf(payload: TestItemPayload, code: boolean): ModuleItemKind {
  if (payload.objectiveId === "hands") return code ? "hands_on" : "scenario";
  if (payload.objectiveId === "rec") return "recall";
  if (payload.objectiveId === "scn") return "scenario";
  return payload.band === "recall" ? "recall" : code ? "hands_on" : "scenario";
}

export function moduleCitationFor(passages: readonly ModulePassage[], citation: { passageId: string; quote: string } | null | undefined): ModuleCitation | null {
  if (!citation) return null;
  const p = passages.find((x) => x.id === citation.passageId);
  if (!p) return null;
  return { passageId: p.id, quote: citation.quote.slice(0, 600), sourceKind: p.sourceKind, sourceId: p.sourceId, sourceTitle: p.sourceTitle, locator: p.locator };
}

// ---------------------------------------------------------------------------
// Items in the database
// ---------------------------------------------------------------------------

export type ItemRow = typeof schema.topicTestItems.$inferSelect;

export function moduleItems(db: Db, topicId: string, statuses?: ("active" | "flagged" | "retired" | "draft")[]): ItemRow[] {
  return db
    .select()
    .from(schema.topicTestItems)
    .where(statuses ? and(eq(schema.topicTestItems.topicId, topicId), inArray(schema.topicTestItems.status, statuses)) : eq(schema.topicTestItems.topicId, topicId))
    .all()
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

export function itemPayload(row: Pick<ItemRow, "item">): ModuleItemPayload {
  return row.item as unknown as ModuleItemPayload;
}

/** Admin-written and admin-edited items are the admin's: regeneration never retires them. */
export function isAdminOwned(row: ItemRow): boolean {
  const p = itemPayload(row);
  return p.moduleOrigin === "admin" || Boolean(p.editedAt);
}

export function insertItem(db: Db, topicId: string, payload: ModuleItemPayload, gates: TestItemGates | null, groundingHash: string | null): string {
  const id = `mt_${newId()}`;
  const at = now();
  db.insert(schema.topicTestItems)
    .values({
      id,
      topicId,
      origin: payload.moduleOrigin === "admin" ? "static" : "generated",
      sourceId: null,
      status: "active",
      item: payload as unknown as Record<string, unknown>,
      gates: gates as unknown as Record<string, unknown> | null,
      groundingHash,
      createdAt: at,
      updatedAt: at,
    })
    .run();
  return id;
}

export function retireItem(db: Db, id: string, reason: string): void {
  db.update(schema.topicTestItems).set({ status: "retired", retiredReason: reason.slice(0, 500), updatedAt: now() }).where(eq(schema.topicTestItems.id, id)).run();
}

export function activeItemCount(db: Db, topicId: string): number {
  return (
    db
      .select({ n: sql<number>`count(*)` })
      .from(schema.topicTestItems)
      .where(and(eq(schema.topicTestItems.topicId, topicId), eq(schema.topicTestItems.status, "active")))
      .get()?.n ?? 0
  );
}

/** Recomputes the summary line after an admin edit (count of live items). */
export function refreshSummary(db: Db, sectionId: string): void {
  const row = getTestRow(db, sectionId);
  if (!row) return;
  const count = activeItemCount(db, row.topicId);
  const sources = row.sourceSummary ?? { docs: 0, videos: 0, notes: false, skipped: [] };
  if (count > 0 && (row.status === "ready" || row.status === "needs_content" || row.status === "empty" || row.status === "failed")) {
    setTestRow(db, sectionId, { status: count >= MODULE_TEST_SIZE.min || row.status === "ready" ? "ready" : row.status, itemCount: count, summary: moduleTestSummaryLine(count, sources) });
  } else setTestRow(db, sectionId, { itemCount: count });
}

// ---------------------------------------------------------------------------
// Cost
// ---------------------------------------------------------------------------

function spentMicros(db: Db, courseId: string, since: number): { micros: number; model: string | null } {
  const rows = db
    .select({ cost: schema.aiCalls.costMicros, model: schema.aiCalls.model, task: schema.aiCalls.task })
    .from(schema.aiCalls)
    .where(and(eq(schema.aiCalls.courseId, courseId), gte(schema.aiCalls.createdAt, since), inArray(schema.aiCalls.task, [...MODULE_TASKS])))
    .all();
  return { micros: rows.reduce((n, r) => n + (r.cost ?? 0), 0), model: rows.find((r) => r.task === "module_test_write")?.model ?? null };
}

/**
 * Estimated cost of one module's generation at default prices (DECISIONS: "Phase 3 (C)"): one
 * Sonnet write over the material (the prefix is cached across rounds), three Haiku checks.
 */
export function estimateModuleCostUsd(passageChars: number, items = MODULE_TEST_SIZE.target + 1): number {
  const tokens = (chars: number) => chars / 4;
  const material = tokens(Math.min(passageChars, MODULE_PROMPT_MAX_CHARS));
  const usd = (model: string, input: number, output: number) => {
    const price = priceFor(model) ?? { input: 0, output: 0 };
    return (input * price.input + output * price.output) / 1_000_000;
  };
  const sonnet = TASK_DEFAULTS.module_test_write.model;
  const haiku = TASK_DEFAULTS.module_test_relevance.model;
  const write = usd(sonnet, 700 + material + 250, items * 230);
  const relevance = usd(haiku, 350 + material + items * 160, items * 90);
  const answerWith = usd(haiku, 120 + material + items * 120, items * 25);
  const answerWithout = usd(haiku, 120 + items * 120, items * 25);
  return Math.round((write + relevance + answerWith + answerWithout) * 10_000) / 10_000;
}

// ---------------------------------------------------------------------------
// Generate
// ---------------------------------------------------------------------------

export type GenerateReason = "publish" | "changed" | "admin";

export interface GenerateResult {
  status: ModuleTestStatus | "unchanged" | "deferred" | "missing";
  added: number;
  dropped: number;
  retired: number;
}

const NEEDS_CONTENT =
  "There isn't enough here to write questions from yet. Add a doc, some notes, or a video we can read (an upload, or a YouTube video with captions). Then save the course.";

/**
 * One module's generation. Throws `JobDeferredError` while its sources are still being read, so the
 * job comes back later without spending an attempt.
 */
export async function generateModuleTest(deps: ModuleTestDeps, sectionId: string, reason: GenerateReason): Promise<GenerateResult> {
  const { db } = deps;
  const ctx = moduleContext(db, sectionId);
  if (!ctx) return { status: "missing", added: 0, dropped: 0, retired: 0 };
  const testRow = ensureTestRow(db, ctx);

  // 1. Gather.
  syncInlineSources(db, ctx);
  dropOrphanTexts(db, ctx);
  const waiting = queueStaleSources(db, ctx);
  if (waiting > 0) {
    setTestRow(db, sectionId, { status: "gathering", error: null });
    throw new JobDeferredError(DEFER_MS, `Reading ${waiting} source${waiting === 1 ? "" : "s"} of this module first.`);
  }
  const rows = textRows(db, sectionId);
  const contentHash = moduleContentHash(rows);
  const live = activeItemCount(db, ctx.topic.id);
  if (reason !== "admin" && testRow.generatedHash === contentHash && (testRow.status === "ready" || (testRow.status === "needs_content" && live === 0))) {
    setTestRow(db, sectionId, { contentHash });
    return { status: "unchanged", added: 0, dropped: 0, retired: 0 };
  }

  // 2. Material.
  const passages = selectPassages(rows);
  const summary = sourceSummary(rows, passages);
  const chars = passages.reduce((n, p) => n + p.text.length, 0);
  if (chars < MODULE_TEST_MIN_SOURCE_CHARS) {
    const retired = retireGenerated(db, ctx.topic.id, null, "the module's material changed");
    const left = activeItemCount(db, ctx.topic.id);
    setTestRow(db, sectionId, {
      status: left > 0 ? "ready" : "needs_content",
      summary: left > 0 ? moduleTestSummaryLine(left, summary) : NEEDS_CONTENT,
      sourceSummary: summary,
      contentHash,
      generatedHash: contentHash,
      itemCount: left,
      error: null,
    });
    return { status: left > 0 ? "ready" : "needs_content", added: 0, dropped: 0, retired };
  }

  const code = looksLikeCode(passages);
  const grounding = buildGrounding(ctx, passages, code, contentHash);
  storeGrounding(db, grounding, contentHash);
  setTestRow(db, sectionId, { status: "generating", contentHash, sourceSummary: summary, error: null });

  // 3. Write + gates.
  const started = now();
  const generation = testRow.generation + 1;
  const keptOwned = moduleItems(db, ctx.topic.id, ["active"]).filter(isAdminOwned);
  const need = Math.max(0, MODULE_TEST_SIZE.target - keptOwned.length);
  const meta = { courseId: ctx.course.id };
  const accepted: { payload: ModuleItemPayload; gates: TestItemGates }[] = [];
  let dropped = 0;
  try {
    const avoid = keptOwned.map((r) => itemPayload(r).prompt);
    for (let round = 1; round <= 1 + GATE_LIMITS.maxRegenerations && accepted.length < need; round++) {
      const ask = Math.min(MODULE_TEST_SIZE.max, need - accepted.length + 1);
      const written = await writeItems(
        deps.ai,
        grounding,
        { count: ask, round, avoid: [...avoid, ...accepted.map((a) => a.payload.prompt)] },
        {
          purpose: "module_test_write",
          task: "module_test_write",
          system: moduleSystem(grounding),
          user: modulePrompt(grounding, ask, round, [...avoid, ...accepted.map((a) => a.payload.prompt)], code),
          schemaName: "module_test_items",
          meta,
        },
      );
      dropped += written.malformed;
      const candidates: GateCandidate[] = written.payloads.map((payload, i) => ({ key: `g${generation}r${round}c${i}`, origin: "generated", payload }));
      const outcomes = await runGates({ ai: deps.ai }, grounding, candidates, {
        purpose: "module_test_check",
        relevanceTask: "module_test_relevance",
        answerTask: "module_test_answer",
        relevanceSchemaName: "module_test_relevance",
        answerSchemaName: "module_test_answer",
        meta,
      });
      for (const candidate of candidates) {
        const outcome = outcomes.get(candidate.key)!;
        if (!outcome.gates.passed || accepted.length >= need) {
          dropped += 1;
          continue;
        }
        const total = accepted.length + keptOwned.length;
        const longest = accepted.filter((a) => keyIsLongest(a.payload)).length + keptOwned.filter((r) => keyIsLongest(itemPayload(r))).length;
        if (keyIsLongest(candidate.payload) && longest + 1 > Math.floor((total + 1) * GATE_LIMITS.maxLongestKeyedShare)) {
          dropped += 1;
          continue;
        }
        const moduleCitation = moduleCitationFor(passages, candidate.payload.citation);
        if (!moduleCitation || citationProblem(grounding, candidate.payload.citation)) {
          dropped += 1;
          continue;
        }
        accepted.push({
          payload: { ...candidate.payload, moduleKind: kindOf(candidate.payload, code), moduleOrigin: "generated", moduleCitation, generation },
          gates: { ...outcome.gates, testLevel: { ok: true } },
        });
      }
    }
  } catch (error) {
    const plain =
      error instanceof AiNotConfiguredError
        ? "AI isn't connected yet, so we couldn't write the questions. Connect it under Admin → AI connection, then press Regenerate."
        : "We couldn't write the questions this time. We'll try again; you can also press Regenerate.";
    const spent = spentMicros(db, ctx.course.id, started);
    setTestRow(db, sectionId, { status: live > 0 ? "ready" : "failed", error: plain, costMicros: testRow.costMicros + spent.micros, ...(live > 0 ? {} : { summary: plain }) });
    throw error;
  }

  // 4. Save: new items live, the previous generation retired (past attempts still read them).
  let retired = 0;
  db.transaction(() => {
    for (const a of accepted) insertItem(db, ctx.topic.id, a.payload, a.gates, contentHash);
    retired = retireGenerated(db, ctx.topic.id, accepted.length > 0 ? null : grounding, `replaced by generation ${generation}`, generation);
  });
  const count = activeItemCount(db, ctx.topic.id);
  const spent = spentMicros(db, ctx.course.id, started);
  const status: ModuleTestStatus = count >= MODULE_TEST_SIZE.min ? "ready" : "needs_content";
  setTestRow(db, sectionId, {
    status,
    summary:
      status === "ready"
        ? moduleTestSummaryLine(count, summary)
        : count > 0
          ? `Only ${count} question${count === 1 ? "" : "s"} passed our checks. Add more detail to the docs or notes, then press Regenerate.`
          : NEEDS_CONTENT,
    itemCount: count,
    generation,
    generatedHash: contentHash,
    contentHash,
    costMicros: spent.micros,
    model: spent.model,
    generatedAt: now(),
    error: null,
  });
  deps.log?.(`oyelabs.module_test.generate ${sectionId}: ${accepted.length} added, ${dropped} dropped, ${retired} retired, $${(spent.micros / 1e6).toFixed(4)}`);
  return { status, added: accepted.length, dropped, retired };
}

/**
 * Retires generated items of earlier generations that the admin doesn't own. With `grounding`, only
 * those whose quote is no longer in the material (used when the new round produced nothing, so
 * learners keep a test). Returns how many were retired.
 */
function retireGenerated(db: Db, topicId: string, grounding: TopicGroundingContent | null, reason: string, keepGeneration?: number): number {
  let n = 0;
  for (const row of moduleItems(db, topicId, ["active", "flagged"])) {
    if (isAdminOwned(row)) continue;
    const p = itemPayload(row);
    if (keepGeneration !== undefined && p.generation === keepGeneration) continue;
    if (grounding && !citationProblem(grounding, p.citation)) continue;
    retireItem(db, row.id, reason);
    n += 1;
  }
  return n;
}

export { moduleContext };
