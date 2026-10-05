import { and, desc, eq, isNotNull } from "drizzle-orm";

import type { ItemResponseV4, V4Result } from "../../../shared/assessmentV4";
import {
  DEFAULT_SCORING_MODE,
  scoreFor,
  scoringModeSchema,
  tierOf,
  verdictFor,
  verdictValue,
  type ScoringMode,
  type TieredOutcome,
  type Verdict,
  type VerdictInput,
} from "../../../shared/scoring";
import { analyseEvaluation } from "../builder/goalPath";
import { schema, type Db } from "../db";
import { newId, now } from "../lib/ids";
import { getSetup } from "../setup/repo";
import { computeResult, itemsOf, keyOf } from "./v4";

/**
 * v4.4 Phase 4: the verdict layer for assessment items. Every grader writes its 0..1 (`raw_score`)
 * and, for AI graders, `met` + reason + tip in `ai_feedback` (JSON). This module turns that into the
 * stored `score` (0/1 in full mode, raw in partial mode), `verdict` and `verdict_note`. It reads only
 * stored data, so the re-score job and admin reviews never call a grader again.
 */

export const SCORING_MODE_KEY = "scoring.mode";

type ItemRow = typeof schema.assessmentItems.$inferSelect;

export function getScoringMode(db: Db): ScoringMode {
  const row = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, SCORING_MODE_KEY)).get();
  const parsed = scoringModeSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : DEFAULT_SCORING_MODE;
}

export function setScoringMode(db: Db, mode: ScoringMode): void {
  db.insert(schema.appMeta)
    .values({ key: SCORING_MODE_KEY, value: mode, updatedAt: now() })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value: mode, updatedAt: now() } })
    .run();
}

/** `ai_feedback` as an object when it is JSON, else null (old rubric feedback was plain text). */
export function feedbackJson(item: Pick<ItemRow, "aiFeedback">): Record<string, unknown> | null {
  if (!item.aiFeedback) return null;
  try {
    const parsed: unknown = JSON.parse(item.aiFeedback);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** The grader's 0..1: `raw_score`, or the score of a row graded before v4.4 (which was raw). */
export function rawOf(item: Pick<ItemRow, "rawScore" | "score" | "verdict">): number | null {
  if (item.rawScore != null) return item.rawScore;
  // A row with a verdict but no raw score had its score written by the verdict layer: not raw.
  return item.verdict ? null : item.score;
}

function isUnanswered(response: unknown): boolean {
  return !response || (typeof response === "object" && "unknown" in (response as object));
}

/** Builds the verdict input from a stored row. Null = still waiting for a grader. */
export function verdictInputFor(item: ItemRow): VerdictInput | null {
  const response = item.response as ItemResponseV4 | null;
  if (isUnanswered(response)) return { kind: "unanswered" };
  const key = keyOf(item);
  const detail = feedbackJson(item);
  const raw = rawOf(item);

  if (key.type === "coding") {
    if (!response || !("code" in response)) return { kind: "unanswered" };
    if (raw == null || (detail && typeof detail.runnerUnavailable === "string")) return null;
    const tests = Array.isArray(detail?.tests) ? (detail!.tests as { passed?: unknown; tier?: unknown }[]) : null;
    let outcomes: TieredOutcome[];
    if (tests) {
      outcomes = tests.map((t) => ({ passed: t.passed === true, tier: t.tier === "edge" ? "edge" : "core" }));
    } else {
      // Graded before tiers were stored: only the totals are known, so every test counts as core.
      const total = typeof detail?.total === "number" ? detail.total : 1;
      const passed = typeof detail?.passed === "number" ? detail.passed : Math.round(raw * total);
      outcomes = Array.from({ length: Math.max(1, total) }, (_, i) => ({ passed: i < passed, tier: "core" as const }));
    }
    return { kind: "code", outcomes, compileError: typeof detail?.compileError === "string" ? detail.compileError : null };
  }

  if (key.type === "mcq") {
    if (!response || !("choice" in response) || !key.mcq) return { kind: "unanswered" };
    return { kind: "mcq", correct: response.choice === key.mcq.correctIndex };
  }

  if (key.type === "task" && key.task) {
    const taskResponse = response && "task" in response ? response.task : null;
    const met = typeof detail?.met === "boolean" ? detail.met : null;
    const tip = typeof detail?.tip === "string" ? detail.tip : null;
    const checkScore = typeof detail?.checkScore === "number" ? detail.checkScore : null;
    // Old AI-graded rows: the rubric part alone (`ai_score`, 0..100) decides, normalised.
    const legacyRaw = met == null && item.aiScore != null && key.task.kind === "form" ? item.aiScore / 100 : raw;
    return { kind: "task", task: key.task, response: taskResponse, raw: legacyRaw, met, tip, checkScore };
  }
  return { kind: "unanswered" };
}

export interface AppliedVerdict {
  verdict: Verdict | null;
  score: number | null;
  before: number | null;
  changed: boolean;
}

/**
 * Computes and stores the verdict and score for one row. An item an admin overrode stays full.
 * `row` may carry fresher values than the database (the grader's result before it is written).
 */
export function applyVerdict(db: Db, row: ItemRow, mode: ScoringMode): AppliedVerdict {
  const input = verdictInputFor(row);
  const raw = input?.kind === "unanswered" ? (rawOf(row) ?? 0) : rawOf(row);
  let verdict = input ? verdictFor(input) : null;
  if (row.reviewStatus === "overridden") verdict = { full: true, score: 1, ...(verdict?.note ? { note: verdict.note } : {}) };
  let score = scoreFor(mode, verdict, raw);
  if (row.reviewStatus === "overridden") score = 1;
  db.update(schema.assessmentItems)
    .set({
      rawScore: raw,
      score,
      autoScore: score == null ? null : Math.round(score),
      verdict: verdictValue(verdict),
      verdictNote: verdict?.note?.slice(0, 500) ?? null,
      aiFeedback: row.aiFeedback,
    })
    .where(eq(schema.assessmentItems.id, row.id))
    .run();
  return { verdict, score, before: row.score, changed: (row.score ?? null) !== (score ?? null) };
}

/** Adds one graded answer to its bank item's stats, by the stored (verdict) score. */
export function countBankScore(db: Db, bankItemId: string | null, score: number | null, timesDelta = 1): void {
  if (score == null || !bankItemId) return;
  const row = db.select({ timesScored: schema.questionBank.timesScored, scoreSum: schema.questionBank.scoreSum }).from(schema.questionBank).where(eq(schema.questionBank.id, bankItemId)).get();
  if (!row) return;
  db.update(schema.questionBank)
    .set({ timesScored: row.timesScored + timesDelta, scoreSum: row.scoreSum + score })
    .where(eq(schema.questionBank.id, bankItemId))
    .run();
}

/** The code runner's outcomes as tiered entries for the stored detail. */
export function tieredTests(tests: readonly unknown[], outcomes: readonly { index: number; passed: boolean }[]): { passed: boolean; tier: "core" | "edge" }[] {
  return tests.map((test, index) => ({ passed: outcomes.find((o) => o.index === index)?.passed ?? false, tier: tierOf(test) }));
}

// ---------------------------------------------------------------------------
// Re-computing a learner's result after a score changed
// ---------------------------------------------------------------------------

function skillsKey(result: Pick<V4Result, "skills">): string {
  return JSON.stringify(result.skills.map((s) => [s.skillId, s.level]).sort());
}

function scoresKey(result: Pick<V4Result, "skills" | "rawScore">): string {
  return JSON.stringify([result.rawScore, result.skills.map((s) => [s.skillId, s.score, s.level]).sort()]);
}

/**
 * Recomputes the evaluation of a finished v4 assessment from its stored item scores. When a skill
 * level changed on the learner's latest assessment, a new evaluation row is written, which marks
 * their path as out of date ("a newer evaluation"); otherwise the latest row is updated in place.
 * Returns whether anything in the result changed, and whether a level did.
 */
export function recomputeEvaluation(db: Db, assessmentId: string, model: string): { changed: boolean; levelsChanged: boolean } {
  const assessment = db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
  if (!assessment) return { changed: false, levelsChanged: false };
  const latest = db.select().from(schema.evaluations).where(eq(schema.evaluations.assessmentId, assessmentId)).orderBy(desc(schema.evaluations.createdAt)).get();
  if (!latest || (latest.result as { format?: string }).format !== "v4") return { changed: false, levelsChanged: false };
  const old = latest.result as V4Result;
  const setup = getSetup(db, assessment.userId);
  const base = computeResult(itemsOf(db, assessmentId), setup.priorities);
  let analysis: ReturnType<typeof analyseEvaluation> | null = null;
  try {
    analysis = analyseEvaluation(db, assessment.userId, base);
  } catch {
    analysis = null;
  }
  const next: V4Result = {
    ...old,
    ...base,
    ...(analysis ? { mastery: analysis.mastery, missingLinks: analysis.missingLinks, metGoals: analysis.metGoals } : {}),
  };
  const changed = scoresKey(old) !== scoresKey(next);
  const levelsChanged = skillsKey(old) !== skillsKey(next);
  if (!changed) return { changed, levelsChanged };
  const newest = db
    .select({ id: schema.assessments.id })
    .from(schema.assessments)
    .where(and(eq(schema.assessments.userId, assessment.userId), isNotNull(schema.assessments.submittedAt)))
    .orderBy(desc(schema.assessments.attemptNo))
    .get();
  if (levelsChanged && newest?.id === assessmentId) {
    db.insert(schema.evaluations).values({ id: newId(), assessmentId, result: next, model, createdAt: now() }).run();
  } else {
    db.update(schema.evaluations).set({ result: next }).where(eq(schema.evaluations.id, latest.id)).run();
  }
  return { changed, levelsChanged };
}
