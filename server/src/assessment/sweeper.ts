import { eq, inArray, lt, and } from "drizzle-orm";

import { schema, type Db } from "../db";
import { enqueue } from "../jobs/queue";
import { now } from "../lib/ids";
import { autoApproveDue } from "./approval";
import { checkHeartbeats } from "./integrity";

/**
 * The minute sweeper (brief §11.1, §10.2).
 *
 * Three things only a server-side clock can notice:
 *
 * - **An expired deadline.** A learner who closes the tab never submits, so nothing would ever
 *   queue their evaluation.
 * - **A missing heartbeat.** A client that stops reporting cannot report that it stopped.
 * - **An approval nobody gave.** An assessment waiting on a superadmin who never looked should
 *   still reach the learner; the deadline is the only thing that will say so.
 *
 * All three are deliberately outside the job queue: they are cheap, must run on a fixed cadence,
 * and queueing them would mean a queue backlog delays the very checks that notice a stuck test.
 */
export interface SweeperDeps {
  db: Db;
  log?: (message: string) => void;
}

export function sweepOnce(deps: SweeperDeps): { expired: number; missedHeartbeats: number; autoApproved: number } {
  const { db } = deps;

  const expired = db
    .select()
    .from(schema.assessments)
    .where(and(eq(schema.assessments.status, "in_progress"), lt(schema.assessments.deadlineAt, now())))
    .all();

  for (const assessment of expired) {
    db.update(schema.assessments)
      .set({ status: "submitted", submittedAt: now(), terminatedReason: "The time limit was reached." })
      .where(eq(schema.assessments.id, assessment.id))
      .run();
    enqueue(db, { type: "assessment.evaluate", payload: { assessmentId: assessment.id, reason: "deadline" } });
    deps.log?.(`assessment ${assessment.id} hit its deadline and was submitted`);
  }

  const missedHeartbeats = checkHeartbeats(db);
  if (missedHeartbeats > 0) deps.log?.(`${missedHeartbeats} assessment(s) missed a heartbeat`);

  const autoApproved = autoApproveDue(db, deps.log);

  return { expired: expired.length, missedHeartbeats, autoApproved };
}

/**
 * Also catches assessments that were submitted but whose evaluation job vanished — a process
 * killed between the status update and the enqueue, say. Without this they would sit in
 * "submitted" forever and the learner would watch a spinner that never ends.
 */
export function requeueOrphanedEvaluations(db: Db): number {
  const stuck = db
    .select()
    .from(schema.assessments)
    .where(inArray(schema.assessments.status, ["submitted", "terminated"]))
    .all();

  let requeued = 0;
  for (const assessment of stuck) {
    const hasEvaluation = db
      .select({ id: schema.evaluations.id })
      .from(schema.evaluations)
      .where(eq(schema.evaluations.assessmentId, assessment.id))
      .get();
    if (hasEvaluation) continue;

    const hasJob = db
      .select()
      .from(schema.jobs)
      .all()
      .some(
        (job) =>
          job.type === "assessment.evaluate" &&
          (job.payload as { assessmentId?: string }).assessmentId === assessment.id &&
          job.status !== "failed",
      );
    if (hasJob) continue;

    enqueue(db, { type: "assessment.evaluate", payload: { assessmentId: assessment.id, reason: "requeued" } });
    requeued += 1;
  }

  return requeued;
}
