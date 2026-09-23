import { and, eq, lte, sql } from "drizzle-orm";

import type { JobType } from "../../../shared/enums";
import { schema, type Db } from "../db";
import { newId, now } from "../lib/ids";

export interface Job {
  id: string;
  type: JobType;
  payload: unknown;
  attempts: number;
  maxAttempts: number;
}

export interface EnqueueOptions {
  type: JobType;
  payload: unknown;
  /** Delay before the job becomes eligible. */
  delayMs?: number;
  maxAttempts?: number;
}

export function enqueue(db: Db, options: EnqueueOptions): string {
  const id = newId();
  db.insert(schema.jobs)
    .values({
      id,
      type: options.type,
      payload: options.payload,
      status: "queued",
      attempts: 0,
      maxAttempts: options.maxAttempts ?? 3,
      runAfter: now() + (options.delayMs ?? 0),
      createdAt: now(),
    })
    .run();
  return id;
}

/**
 * Claims the next eligible job.
 *
 * The claim is a single conditional UPDATE: SQLite serialises writes, so two workers cannot both
 * win the same row. `better-sqlite3` is synchronous, which makes this genuinely atomic without a
 * transaction block.
 */
export function claimNext(db: Db): Job | null {
  const candidate = db
    .select()
    .from(schema.jobs)
    .where(and(eq(schema.jobs.status, "queued"), lte(schema.jobs.runAfter, now())))
    .orderBy(schema.jobs.runAfter, schema.jobs.id)
    .limit(1)
    .get();
  if (!candidate) return null;

  const claimed = db
    .update(schema.jobs)
    .set({ status: "running", lockedAt: now(), attempts: candidate.attempts + 1 })
    .where(and(eq(schema.jobs.id, candidate.id), eq(schema.jobs.status, "queued")))
    .run();

  // Another worker got there first.
  if ((claimed.changes ?? 0) === 0) return null;

  return {
    id: candidate.id,
    type: candidate.type,
    payload: candidate.payload,
    attempts: candidate.attempts + 1,
    maxAttempts: candidate.maxAttempts,
  };
}

export function completeJob(db: Db, id: string): void {
  db.update(schema.jobs).set({ status: "done", finishedAt: now(), lastError: null }).where(eq(schema.jobs.id, id)).run();
}

/**
 * Records a failure. Retries with exponential backoff until `maxAttempts`, then marks the job
 * failed so the reason stays visible rather than the job quietly disappearing.
 */
export function failJob(db: Db, job: Job, error: string): { willRetry: boolean } {
  const willRetry = job.attempts < job.maxAttempts;
  const backoff = 5_000 * 2 ** (job.attempts - 1);

  db.update(schema.jobs)
    .set({
      status: willRetry ? "queued" : "failed",
      lastError: error.slice(0, 2000),
      lockedAt: null,
      runAfter: willRetry ? now() + backoff : now(),
      ...(willRetry ? {} : { finishedAt: now() }),
    })
    .where(eq(schema.jobs.id, job.id))
    .run();

  return { willRetry };
}

/**
 * On boot, any job still marked `running` belongs to a process that died. Requeueing them is
 * what makes "survives restarts" true (brief §2 D10).
 */
export function requeueStaleJobs(db: Db, olderThanMs = 15 * 60 * 1000): number {
  const cutoff = now() - olderThanMs;
  const result = db
    .update(schema.jobs)
    .set({ status: "queued", lockedAt: null, runAfter: now() })
    .where(and(eq(schema.jobs.status, "running"), lte(schema.jobs.lockedAt, cutoff)))
    .run();
  return result.changes ?? 0;
}

/** Requeues every running job regardless of age. Used at startup, where age is irrelevant. */
export function requeueAllRunning(db: Db): number {
  const result = db
    .update(schema.jobs)
    .set({ status: "queued", lockedAt: null, runAfter: now() })
    .where(eq(schema.jobs.status, "running"))
    .run();
  return result.changes ?? 0;
}

export function getJob(db: Db, id: string) {
  return db.select().from(schema.jobs).where(eq(schema.jobs.id, id)).get() ?? null;
}

export function countByStatus(db: Db) {
  return db
    .select({ status: schema.jobs.status, count: sql<number>`count(*)` })
    .from(schema.jobs)
    .groupBy(schema.jobs.status)
    .all();
}
