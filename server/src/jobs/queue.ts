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
  // v4.5 P0: a new course is minutes of provider calls; a provider blip deserves a longer pause
  // (30 s, 1, 2, 4 min) than a quick job (5, 10, 20 s).
  const base = job.type === "course.generate" ? 30_000 : 5_000;
  const backoff = base * 2 ** (job.attempts - 1);

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

/**
 * v4.4: thrown by a handler that cannot run yet (an evaluation waiting for a transcription). The
 * worker puts the job back for `delayMs` without counting an attempt; it is not a failure.
 */
export class JobDeferredError extends Error {
  constructor(
    readonly delayMs: number,
    message = "Waiting for something else to finish first.",
  ) {
    super(message);
    this.name = "JobDeferredError";
  }
}

/** Puts a claimed job back in the queue for later without counting it as an attempt. */
export function deferJob(db: Db, id: string, delayMs: number): void {
  db.update(schema.jobs)
    .set({ status: "queued", lockedAt: null, runAfter: now() + delayMs, attempts: sql`max(${schema.jobs.attempts} - 1, 0)` })
    .where(eq(schema.jobs.id, id))
    .run();
}

/**
 * v4.4: thrown by a handler that cannot start until something is set up (the AI or the web search
 * for `course.generate`). The worker parks the job in `waiting_setup` with this plain message; it
 * never runs again until `wakeWaitingJobs` puts it back in the queue.
 */
export class JobWaitingSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobWaitingSetupError";
  }
}

/** Parks a claimed job until setup is fixed, without counting an attempt. */
export function parkJob(db: Db, id: string, reason: string): void {
  db.update(schema.jobs)
    .set({ status: "waiting_setup", lockedAt: null, lastError: reason.slice(0, 2000), attempts: sql`max(${schema.jobs.attempts} - 1, 0)` })
    .where(eq(schema.jobs.id, id))
    .run();
}

/** Puts every job of this type that waits for setup back in the queue. Returns how many. */
export function wakeWaitingJobs(db: Db, type: JobType): number {
  const result = db
    .update(schema.jobs)
    .set({ status: "queued", runAfter: now(), lastError: null })
    .where(and(eq(schema.jobs.type, type), eq(schema.jobs.status, "waiting_setup")))
    .run();
  return result.changes ?? 0;
}

/** v4.5 P0: how many tries a new course gets before it shows "Failed: … Retry". */
export const COURSE_JOB_MAX_ATTEMPTS = 5;

/**
 * v4.5 P0: the admin's Retry on a failed job: back in the queue now, with a fresh set of tries.
 * Returns false when the job isn't failed (already running again, or done).
 */
export function retryJob(db: Db, id: string): boolean {
  const result = db
    .update(schema.jobs)
    .set({ status: "queued", attempts: 0, runAfter: now(), lastError: null, lockedAt: null, finishedAt: null })
    .where(and(eq(schema.jobs.id, id), eq(schema.jobs.status, "failed")))
    .run();
  return (result.changes ?? 0) > 0;
}
