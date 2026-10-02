import { and, asc, eq, isNull, lt, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import { parseTests, type BankItem, type CodeTest, type CodingSpec } from "../../../shared/bank";
import { trackBasics, type SandboxLanguage } from "../../../shared/catalog";
import {
  levelFrom,
  RUN_LIMIT,
  V4_MAX_MINUTES,
  V4_TARGET_MINUTES,
  type ItemResponseV4,
  type RunResponse,
  type SampleTest,
  type Sheet,
  type SheetItem,
  type SkillResult,
  type V4Result,
} from "../../../shared/assessmentV4";
import { planAssessmentMix, sliderToPriority, type AssessmentMix, type MixGroup } from "../../../shared/setup";
import { gradeTask, toLearnerTask, type Task } from "../../../shared/tasks";
import { assemble } from "../bank/assemble";
import { activeItems, seenItemIds } from "../bank/repo";
import { getCatalog } from "../catalog/repo";
import type { Db } from "../db";
import { schema } from "../db";
import { enqueue } from "../jobs/queue";
import { conflict } from "../lib/errors";
import { newId, now } from "../lib/ids";
import { runSnippet, runTests, SandboxUnavailableError, type PolyglotDeps } from "../sandbox/polyglot";
import { getSetup } from "../setup/repo";

/**
 * The v4 assessment (Phase 4): assembled from the bank at issue time, served as one sheet, timed by
 * one clock, graded by code. See `shared/assessmentV4.ts` for the learner contract.
 */

export interface V4Config {
  format: "v4";
  departmentId: string;
  assessmentFormat: "coding" | "tasks";
  mix: AssessmentMix;
  minFinishMinutes: number | null;
  maxMinutes: number;
  /** Skills the assembler could not fill, for the gap-fill job and the admin view. */
  shortfalls: { skillId: string; type: string; missing: number }[];
}

interface ItemKeyV4 {
  v4: true;
  bankItemId: string;
  type: BankItem["type"];
  coding?: { language: SandboxLanguage; mode: CodingSpec["mode"]; functionName: string | null; hiddenTests: unknown[]; sampleTests: unknown[] };
  mcq?: { correctIndex: number; explanation: string; snippetLanguage: SandboxLanguage | null };
  task?: Task;
  /** Where the skill sat in the mix, for the report. */
  group: MixGroup | "filler";
  skillName: string;
}

type ItemRow = typeof schema.assessmentItems.$inferSelect;
type AssessmentRow = typeof schema.assessments.$inferSelect;

export function isV4(assessment: Pick<AssessmentRow, "config">): boolean {
  return (assessment.config as { format?: string } | null)?.format === "v4";
}

export function configOf(assessment: Pick<AssessmentRow, "config">): V4Config {
  return assessment.config as V4Config;
}

const browserLanguage = (language: SandboxLanguage | null) => language === "javascript" || language === "typescript";

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const MIN_FINISH_KEY = "assessment.min_finish_minutes";

/** "Minimum time before Finish": off (null) by default. A global admin setting. */
export function getMinFinishMinutes(db: Db): number | null {
  const row = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, MIN_FINISH_KEY)).get();
  const value = row ? Number(row.value) : NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function setMinFinishMinutes(db: Db, minutes: number | null): void {
  const value = minutes && minutes > 0 ? String(Math.min(minutes, V4_MAX_MINUTES - 5)) : "0";
  db.insert(schema.appMeta)
    .values({ key: MIN_FINISH_KEY, value, updatedAt: now() })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: now() } })
    .run();
}

// ---------------------------------------------------------------------------
// Assembly at issue time
// ---------------------------------------------------------------------------

/**
 * Builds the sheet from the bank and stores it. Deterministic, no model, immediate — so the
 * assessment is `ready` the moment it is issued and there is nothing to approve.
 */
export function assembleInto(db: Db, assessmentId: string, userId: string): V4Config {
  const setup = getSetup(db, userId);
  const catalog = getCatalog(db, { departmentId: setup.departmentId, includeArchived: true });
  const department = catalog.departments.find((d) => d.id === setup.departmentId);
  const skills = new Map(catalog.skills.map((s) => [s.id, s]));
  const basics = trackBasics(catalog, setup.departmentId, setup.trackId, setup.stackIds).map((s) => ({ skillId: s.id, skillName: s.name, slider: 0 }));
  const mix = planAssessmentMix(setup.priorities, basics);
  const format = department?.assessmentFormat ?? "coding";

  const result = assemble({
    format,
    mix,
    pool: activeItems(db, setup.departmentId),
    stackIds: setup.stackIds,
    skip: setup.skip.map((s) => s.skillId),
    seen: seenItemIds(db, userId),
    level: setup.level,
    experienceBand: setup.experienceBand,
    seed: assessmentId,
  });
  if (result.items.length === 0) {
    throw conflict("The question bank has no items for this department yet. Seed or approve some under Admin → Question bank.");
  }

  const at = now();
  db.transaction((tx) => {
    result.items.forEach(({ item, skillId, group }, position) => {
      const skillName = skills.get(skillId)?.name ?? skills.get(item.skillId)?.name ?? skillId;
      const { payload, key } = splitItem(item, skillId, skillName, group, `${assessmentId}:${position}`);
      tx.insert(schema.assessmentItems)
        .values({
          id: newId(),
          assessmentId,
          area: skillId,
          difficulty: item.difficulty,
          kind: item.type === "coding" ? "code" : item.type === "mcq" ? "mcq" : "task",
          topicIds: [],
          payload,
          key,
          status: "served",
          servedAt: at,
          bankItemId: item.id,
          position,
        })
        .run();
      tx.update(schema.questionBank)
        .set({ timesUsed: sql`${schema.questionBank.timesUsed} + 1` })
        .where(eq(schema.questionBank.id, item.id))
        .run();
    });
  });

  return {
    format: "v4",
    departmentId: setup.departmentId,
    assessmentFormat: format,
    mix,
    minFinishMinutes: getMinFinishMinutes(db),
    maxMinutes: V4_MAX_MINUTES,
    shortfalls: result.shortfalls,
  };
}

/** Same seed → same shuffle; MCQ options are shuffled so position never gives the answer away. */
function shuffleOrder(length: number, seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const order = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i -= 1) {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
    const j = h % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function splitItem(item: BankItem, skillId: string, skillName: string, group: MixGroup | "filler", seed: string) {
  const base = { type: item.type, skillId, skillName, prompt: item.prompt };
  if (item.type === "coding" && item.coding) {
    const c = item.coding;
    return {
      payload: {
        ...base,
        language: c.language,
        mode: c.mode,
        functionName: c.functionName,
        starterCode: c.starterCode,
        sampleTests: c.sampleTests as SampleTest[],
        runsOn: browserLanguage(c.language) && c.mode === "function" ? "browser" : "server",
      },
      key: {
        v4: true,
        bankItemId: item.id,
        type: item.type,
        coding: { language: c.language, mode: c.mode, functionName: c.functionName, hiddenTests: c.hiddenTests, sampleTests: c.sampleTests },
        group,
        skillName,
      } satisfies ItemKeyV4,
    };
  }
  if (item.type === "mcq" && item.mcq) {
    const m = item.mcq;
    const order = shuffleOrder(m.options.length, seed);
    return {
      payload: {
        ...base,
        options: order.map((i) => m.options[i]),
        snippet: m.snippet,
        snippetLanguage: m.snippetLanguage,
        runsOn: m.snippet ? (browserLanguage(m.snippetLanguage) ? "browser" : "server") : null,
      },
      key: {
        v4: true,
        bankItemId: item.id,
        type: item.type,
        mcq: { correctIndex: order.indexOf(m.correctIndex), explanation: m.explanation, snippetLanguage: m.snippetLanguage },
        group,
        skillName,
      } satisfies ItemKeyV4,
    };
  }
  const task = item.task!;
  return {
    payload: { ...base, task: toLearnerTask(task, seed.length + item.difficulty) },
    key: { v4: true, bankItemId: item.id, type: item.type, task, group, skillName } satisfies ItemKeyV4,
  };
}

// ---------------------------------------------------------------------------
// The sheet
// ---------------------------------------------------------------------------

export function itemsOf(db: Db, assessmentId: string): ItemRow[] {
  return db
    .select()
    .from(schema.assessmentItems)
    .where(eq(schema.assessmentItems.assessmentId, assessmentId))
    .orderBy(asc(schema.assessmentItems.position))
    .all();
}

function stateOf(item: ItemRow): SheetItem["state"] {
  if (item.lockedAt) return "submitted";
  return item.draft ? "answered" : "unanswered";
}

export function toSheetItem(item: ItemRow): SheetItem {
  const payload = item.payload as Record<string, unknown>;
  return {
    ...(payload as object),
    id: item.id,
    position: item.position ?? 0,
    state: stateOf(item),
    flagged: item.flagged,
    runsUsed: item.runsUsed,
    draft: (item.draft as ItemResponseV4 | null) ?? null,
  } as SheetItem;
}

export function buildSheet(db: Db, assessment: AssessmentRow): Sheet {
  const config = configOf(assessment);
  const minFinishAt = config.minFinishMinutes && assessment.startedAt ? assessment.startedAt + config.minFinishMinutes * 60_000 : null;
  return {
    assessmentId: assessment.id,
    status: assessment.status,
    startedAt: assessment.startedAt,
    deadlineAt: assessment.deadlineAt,
    minFinishAt,
    serverNow: now(),
    targetMinutes: V4_TARGET_MINUTES,
    maxMinutes: config.maxMinutes ?? V4_MAX_MINUTES,
    items: itemsOf(db, assessment.id).map(toSheetItem),
  };
}

// ---------------------------------------------------------------------------
// Answering
// ---------------------------------------------------------------------------

export function saveDraft(db: Db, item: ItemRow, patch: { response?: ItemResponseV4 | null; flagged?: boolean }): void {
  if (item.lockedAt && patch.response !== undefined) throw conflict("This question has already been submitted.");
  db.update(schema.assessmentItems)
    .set({
      ...(patch.response !== undefined ? { draft: patch.response } : {}),
      ...(patch.flagged !== undefined ? { flagged: patch.flagged } : {}),
    })
    .where(eq(schema.assessmentItems.id, item.id))
    .run();
}

/**
 * One Run press. The counter lives here, not in the browser: the third run submits the item with
 * the code it ran, and a fourth is refused whatever the client says. The increment is a single
 * conditional UPDATE, so two presses racing cannot both be the third.
 */
export async function runItem(app: { db: Db } & PolyglotDeps, item: ItemRow, code: string): Promise<RunResponse> {
  const key = item.key as ItemKeyV4;
  if (item.lockedAt) throw conflict("This question has already been submitted.");
  const runnable = key.type === "coding" || (key.type === "mcq" && (item.payload as { snippet?: string | null }).snippet);
  if (!runnable) throw conflict("This question has nothing to run.");

  const counted = app.db
    .update(schema.assessmentItems)
    .set({ runsUsed: sql`${schema.assessmentItems.runsUsed} + 1`, ...(key.type === "coding" ? { draft: { code } } : {}) })
    .where(and(eq(schema.assessmentItems.id, item.id), lt(schema.assessmentItems.runsUsed, RUN_LIMIT), isNull(schema.assessmentItems.lockedAt)))
    .run();
  if (counted.changes === 0) throw conflict("No runs left for this question.");

  const runsUsed = item.runsUsed + 1;
  const response: RunResponse = { runsUsed, runsLeft: RUN_LIMIT - runsUsed, autoSubmitted: false, runsOn: "server" };

  if (key.type === "coding" && key.coding) {
    const c = key.coding;
    response.runsOn = browserLanguage(c.language) && c.mode === "function" ? "browser" : "server";
    if (response.runsOn === "server") {
      try {
        response.result = await runTests(app, { language: c.language, mode: c.mode, functionName: c.functionName, code, tests: parseTests(c.mode, c.sampleTests) });
      } catch (error) {
        if (!(error instanceof SandboxUnavailableError)) throw error;
        response.result = { outcomes: [], passedCount: 0, total: c.sampleTests.length, compileError: error.message, timedOut: false };
      }
    }
    if (runsUsed >= RUN_LIMIT) {
      await submitItem(app, { ...item, runsUsed, draft: { code } }, { code });
      response.autoSubmitted = true;
    }
  } else if (key.type === "mcq") {
    const language = key.mcq?.snippetLanguage ?? null;
    response.runsOn = browserLanguage(language) ? "browser" : "server";
    if (response.runsOn === "server" && language) {
      try {
        response.output = await runSnippet(app, language, code);
      } catch (error) {
        if (!(error instanceof SandboxUnavailableError)) throw error;
        response.output = { stdout: "", stderr: error.message, timedOut: false };
      }
    }
  }
  return response;
}

/** Grades one response. `null` = a written answer waiting for its rubric. */
export async function gradeResponse(deps: PolyglotDeps, key: ItemKeyV4, response: ItemResponseV4 | null): Promise<{ score: number | null; detail: unknown }> {
  if (!response || "unknown" in response) return { score: 0, detail: { unknown: Boolean(response) } };
  if (key.type === "coding" && key.coding && "code" in response) {
    const c = key.coding;
    try {
      const result = await runTests(deps, { language: c.language, mode: c.mode, functionName: c.functionName, code: response.code, tests: parseTests(c.mode, c.hiddenTests) as CodeTest[] });
      const score = result.total ? result.passedCount / result.total : 0;
      return { score, detail: { passed: result.passedCount, total: result.total, compileError: result.compileError ?? null, timedOut: result.timedOut } };
    } catch (error) {
      if (error instanceof SandboxUnavailableError) return { score: null, detail: { runnerUnavailable: error.message } };
      throw error;
    }
  }
  if (key.type === "mcq" && key.mcq && "choice" in response) return { score: response.choice === key.mcq.correctIndex ? 1 : 0, detail: null };
  if (key.type === "task" && key.task && "task" in response) {
    const graded = gradeTask(key.task, response.task);
    return { score: graded.score, detail: { lines: graded.detail } };
  }
  return { score: 0, detail: { mismatched: true } };
}

/** Locks an item with this response and grades it. Idempotent: a locked item is left alone. */
export async function submitItem(app: { db: Db } & PolyglotDeps, item: ItemRow, response: ItemResponseV4 | null): Promise<void> {
  const locked = app.db
    .update(schema.assessmentItems)
    .set({ lockedAt: now(), draft: response, response, status: "answered", answeredAt: now() })
    .where(and(eq(schema.assessmentItems.id, item.id), isNull(schema.assessmentItems.lockedAt)))
    .run();
  if (locked.changes === 0) return;

  const key = item.key as ItemKeyV4;
  const { score, detail } = await gradeResponse(app, key, response);
  app.db
    .update(schema.assessmentItems)
    .set({ score, autoScore: score == null ? null : Math.round(score), aiFeedback: detail ? JSON.stringify(detail).slice(0, 2000) : null })
    .where(eq(schema.assessmentItems.id, item.id))
    .run();
  if (score != null && item.bankItemId) {
    app.db
      .update(schema.questionBank)
      .set({ timesScored: sql`${schema.questionBank.timesScored} + 1`, scoreSum: sql`${schema.questionBank.scoreSum} + ${score}` })
      .where(eq(schema.questionBank.id, item.bankItemId))
      .run();
  }
}

/** Submits every item still open, with whatever draft it has. The deadline and Finish both end here. */
export async function finalizeItems(app: { db: Db } & PolyglotDeps, assessmentId: string): Promise<void> {
  for (const item of itemsOf(app.db, assessmentId)) {
    if (item.lockedAt) continue;
    await submitItem(app, item, (item.draft as ItemResponseV4 | null) ?? null);
  }
}

export function finishV4(db: Db, assessment: AssessmentRow, reason: "submitted" | "deadline" | "terminated"): void {
  if (!["in_progress", "ready"].includes(assessment.status)) return;
  db.update(schema.assessments)
    .set({
      status: reason === "terminated" ? "terminated" : "submitted",
      submittedAt: now(),
      ...(reason === "deadline" ? { terminatedReason: "The time limit was reached." } : {}),
    })
    .where(eq(schema.assessments.id, assessment.id))
    .run();
  enqueue(db, { type: "assessment.evaluate", payload: { assessmentId: assessment.id, reason } });
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

/** The report by skill. Pure over the graded rows, so the admin view can recompute it. */
export function computeResult(items: readonly ItemRow[], priorities: readonly { skillId: string; slider: number }[]): V4Result {
  const bySkill = new Map<string, ItemRow[]>();
  for (const item of items) {
    const list = bySkill.get(item.area) ?? [];
    list.push(item);
    bySkill.set(item.area, list);
  }
  const sliders = new Map(priorities.map((p) => [p.skillId, p.slider]));

  const skills: SkillResult[] = [...bySkill.entries()].map(([skillId, rows]) => {
    const key = rows[0].key as ItemKeyV4;
    const graded = rows.filter((r) => r.score != null);
    const weight = graded.reduce((sum, r) => sum + r.difficulty, 0);
    const score = graded.length ? graded.reduce((sum, r) => sum + (r.score ?? 0) * r.difficulty, 0) / weight : null;
    const avgDifficulty = graded.length ? weight / graded.length : 0;
    const slider = sliders.get(skillId) ?? null;
    return {
      skillId,
      skillName: key.skillName,
      group: key.group,
      slider,
      priority: slider == null ? null : sliderToPriority(slider),
      asked: rows.length,
      unknown: rows.filter((r) => r.response && typeof r.response === "object" && "unknown" in (r.response as object)).length,
      score: score == null ? null : Math.round(score * 1000) / 1000,
      level: score == null ? null : levelFrom(score, avgDifficulty),
    };
  });

  const order = { focus: 0, other: 1, basics: 2, filler: 3 } as const;
  skills.sort((a, b) => order[a.group] - order[b.group] || (b.slider ?? 0) - (a.slider ?? 0));

  const graded = items.filter((i) => i.score != null);
  return {
    format: "v4",
    skills,
    strengths: skills.filter((s) => (s.level ?? 0) >= 4).map((s) => s.skillName),
    focusFirst: skills
      .filter((s) => s.priority === "high")
      .sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || (b.slider ?? 0) - (a.slider ?? 0))
      .slice(0, 3)
      .map((s) => s.skillName),
    rawScore: graded.length ? Math.round((graded.reduce((sum, i) => sum + (i.score ?? 0), 0) / graded.length) * 100) : 0,
    pendingWritten: items.filter((i) => i.lockedAt && i.score == null).length,
    answered: items.filter((i) => i.response && !(typeof i.response === "object" && "unknown" in (i.response as object))).length,
    total: items.length,
  };
}

export function keyOf(item: ItemRow): ItemKeyV4 {
  return item.key as ItemKeyV4;
}

export type { ItemKeyV4 };

/** Guard for routes: an app with the pieces the runner needs. */
export function runnerDeps(app: FastifyInstance): { db: Db } & PolyglotDeps {
  return { db: app.db, sandbox: app.sandbox, piston: app.piston };
}
