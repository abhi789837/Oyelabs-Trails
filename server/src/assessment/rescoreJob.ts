import { and, asc, eq, gt, inArray, isNotNull } from "drizzle-orm";

import type { RescoreReport, ScoringMode } from "../../../shared/scoring";
import { schema, type Db } from "../db";
import { enqueue } from "../jobs/queue";
import type { Job } from "../jobs/queue";
import { now } from "../lib/ids";
import { applyVerdict, getScoringMode, recomputeEvaluation } from "./scoring";

/**
 * v4.4 Phase 4: job `scoring.rescore`. Recomputes every graded assessment answer with the current
 * scoring mode from what is stored (raw score, test tiers, the AI grader's `met`), with no new grader
 * calls. Each old score goes into `score_history` first. Resumable: progress is saved in `app_meta`
 * after each batch, so a crash or restart continues where it stopped. Then every touched result is
 * recomputed, and the counts are written to `scoring.rescore.report`.
 *
 * Topic attempts are not re-scored: a code attempt stores only its pass and percentage, not which
 * tests failed, and re-running learner code in bulk is not worth it. New attempts use the new rule.
 */

export const RESCORE_REPORT_KEY = "scoring.rescore.report";
export const RESCORE_PROGRESS_KEY = "scoring.rescore.progress";
export const RESCORE_LAST_MODE_KEY = "scoring.rescore.last_mode";
export const RESCORE_BOOT_KEY = "scoring.rescore.boot_v44";
const BATCH = 200;

interface Progress {
  cursor: string;
  items: number;
  changed: number;
  assessments: string[];
  mode: ScoringMode;
  startedAt: number;
}

function readMeta<T>(db: Db, key: string): T | null {
  const row = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, key)).get();
  if (!row) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return row.value as unknown as T;
  }
}

function writeMeta(db: Db, key: string, value: unknown): void {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  db.insert(schema.appMeta)
    .values({ key, value: text, updatedAt: now() })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value: text, updatedAt: now() } })
    .run();
}

function deleteMeta(db: Db, key: string): void {
  db.delete(schema.appMeta).where(eq(schema.appMeta.key, key)).run();
}

export function getRescoreReport(db: Db): RescoreReport | null {
  return readMeta<RescoreReport>(db, RESCORE_REPORT_KEY);
}

export function rescoreRunning(db: Db): boolean {
  return (
    db
      .select({ id: schema.jobs.id })
      .from(schema.jobs)
      .where(and(eq(schema.jobs.type, "scoring.rescore"), inArray(schema.jobs.status, ["queued", "running"])))
      .get() != null
  );
}

/** Queues a re-score unless one is already waiting or running. Returns whether it queued one. */
export function queueRescore(db: Db, reason: string): boolean {
  if (rescoreRunning(db)) return false;
  enqueue(db, { type: "scoring.rescore", payload: { reason } });
  return true;
}

/** Boot: queue one re-score after the v4.4 migration, once (guarded by an app_meta key). */
export function ensureBootRescore(db: Db): boolean {
  if (readMeta(db, RESCORE_BOOT_KEY) != null) return false;
  writeMeta(db, RESCORE_BOOT_KEY, String(now()));
  return queueRescore(db, "after the v4.4 update");
}

/** Runs the whole re-score (in batches, saving progress). Exported for tests. */
export function runRescore(db: Db, options: { batchSize?: number; maxBatches?: number } = {}): RescoreReport | null {
  const mode = getScoringMode(db);
  let progress = readMeta<Progress>(db, RESCORE_PROGRESS_KEY);
  // A saved run for another mode is stale: the setting changed mid-run, so start again.
  if (!progress || progress.mode !== mode) progress = { cursor: "", items: 0, changed: 0, assessments: [], mode, startedAt: now() };
  const historyMode = (readMeta<string>(db, RESCORE_LAST_MODE_KEY) as string | null) ?? "full";
  const touched = new Set(progress.assessments);
  const size = options.batchSize ?? BATCH;
  let batches = 0;

  for (;;) {
    const rows = db
      .select()
      .from(schema.assessmentItems)
      .where(and(gt(schema.assessmentItems.id, progress.cursor), isNotNull(schema.assessmentItems.lockedAt)))
      .orderBy(asc(schema.assessmentItems.id))
      .limit(size)
      .all();
    if (rows.length === 0) break;
    db.transaction(() => {
      const at = now();
      for (const row of rows) {
        if (row.score == null && row.rawScore == null) continue; // still waiting for a grader
        const history = [...(row.scoreHistory ?? []), { score: row.score, mode: row.verdict ? historyMode : "legacy", at }];
        db.update(schema.assessmentItems).set({ scoreHistory: history }).where(eq(schema.assessmentItems.id, row.id)).run();
        const applied = applyVerdict(db, { ...row, scoreHistory: history }, mode);
        progress!.items += 1;
        if (applied.changed) progress!.changed += 1;
        touched.add(row.assessmentId);
      }
      progress!.cursor = rows[rows.length - 1].id;
      progress!.assessments = [...touched];
      writeMeta(db, RESCORE_PROGRESS_KEY, progress);
    });
    batches += 1;
    if (options.maxBatches && batches >= options.maxBatches) return null; // tests: stop mid-run
  }

  let resultsChanged = 0;
  for (const assessmentId of touched) {
    if (recomputeEvaluation(db, assessmentId, "rescore").changed) resultsChanged += 1;
  }
  const report: RescoreReport = { items: progress.items, changed: progress.changed, resultsChanged, topicAttempts: 0, topicChanged: 0, mode, at: now() };
  writeMeta(db, RESCORE_REPORT_KEY, report);
  writeMeta(db, RESCORE_LAST_MODE_KEY, mode);
  deleteMeta(db, RESCORE_PROGRESS_KEY);
  return report;
}

export function rescoreHandler(deps: { db: Db; log?: (message: string) => void }) {
  return async (_job: Job): Promise<void> => {
    const report = runRescore(deps.db);
    if (report) deps.log?.(`re-score (${report.mode}): ${report.items} answers, ${report.changed} changed, ${report.resultsChanged} results changed`);
  };
}
