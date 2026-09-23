import { and, eq, isNotNull, lt } from "drizzle-orm";

import { AUTO_APPROVE_AFTER_MS } from "../../../shared/assessment";
import { schema, type Db } from "../db";
import { writeAudit } from "../lib/audit";
import { now } from "../lib/ids";
import { notify } from "../lib/notify";

/**
 * The approval gate between generation and the learner.
 *
 * Generation lands in `awaiting_approval` so the superadmin can read what the model wrote before
 * anyone sits the test. Review is a gate, not a bottleneck: after `AUTO_APPROVE_AFTER_MS` the
 * sweeper releases it anyway, because an admin on leave must not stall a new starter.
 *
 * Human and automatic approval share this one writer so they cannot drift apart, and they are
 * recorded distinctly — a null `approvedBy` means nobody read it, which is a materially weaker
 * assurance than a name and deserves to be visible rather than inferred.
 */
export type Approver = { kind: "human"; actorId: string } | { kind: "auto" };

export interface ApprovalResult {
  approvedAt: number;
  /** How long it sat waiting, for the audit entry. */
  waitedMs: number | null;
}

export function approveAssessment(
  db: Db,
  assessment: typeof schema.assessments.$inferSelect,
  approver: Approver,
): ApprovalResult {
  const approvedAt = now();
  const automatic = approver.kind === "auto";
  const waitedMs = assessment.awaitingApprovalSince === null ? null : approvedAt - assessment.awaitingApprovalSince;

  db.update(schema.assessments)
    .set({
      status: "ready",
      approvedAt,
      approvedBy: automatic ? null : approver.actorId,
    })
    .where(eq(schema.assessments.id, assessment.id))
    .run();

  // Two action names rather than one with a flag: "who approved this?" is the question the audit
  // log is searched for, and a filter on the action string should answer it.
  writeAudit(db, {
    actorId: automatic ? null : approver.actorId,
    action: automatic ? "assessment.auto_approved" : "assessment.approved",
    targetType: "assessment",
    targetId: assessment.id,
    details: {
      userId: assessment.userId,
      attemptNo: assessment.attemptNo,
      waitedMs,
      ...(automatic ? { afterMs: AUTO_APPROVE_AFTER_MS, reviewed: false } : { reviewed: true }),
    },
  });

  notifyLearnerAndAdmins(db, assessment, automatic);

  return { approvedAt, waitedMs };
}

/**
 * Releases everything past its deadline. Called from the minute sweeper rather than from its own
 * timer: one clock for everything only a server-side clock can notice.
 */
export function autoApproveDue(db: Db, log?: (message: string) => void): number {
  const cutoff = now() - AUTO_APPROVE_AFTER_MS;

  const due = db
    .select()
    .from(schema.assessments)
    .where(
      and(
        eq(schema.assessments.status, "awaiting_approval"),
        isNotNull(schema.assessments.awaitingApprovalSince),
        lt(schema.assessments.awaitingApprovalSince, cutoff),
      ),
    )
    .all();

  for (const assessment of due) {
    approveAssessment(db, assessment, { kind: "auto" });
    log?.(`assessment ${assessment.id} was approved automatically: nobody reviewed it in time`);
  }

  return due.length;
}

function notifyLearnerAndAdmins(
  db: Db,
  assessment: typeof schema.assessments.$inferSelect,
  automatic: boolean,
): void {
  notify(db, {
    recipientId: assessment.userId,
    kind: "assessment.ready",
    title: "Your placement assessment is ready",
    body: "It takes about an hour and it is monitored, so find a quiet slot before you start.",
    link: "/assessment",
  });

  // Only the automatic path notifies admins. A superadmin who just clicked approve does not need
  // to be told what they did; a release nobody looked at is worth surfacing.
  if (!automatic) return;

  const user = db.select().from(schema.users).where(eq(schema.users.id, assessment.userId)).get();
  const minutes = Math.round(AUTO_APPROVE_AFTER_MS / 60_000);
  for (const admin of db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, "superadmin")).all()) {
    notify(db, {
      recipientId: admin.id,
      kind: "assessment.auto_approved",
      title: `${user?.displayName ?? "A learner"}'s assessment went out unreviewed`,
      body: `Nobody approved it within ${minutes} minutes, so it was released automatically. The pool is still worth a look.`,
      link: `/admin/assessments/${assessment.id}`,
    });
  }
}
