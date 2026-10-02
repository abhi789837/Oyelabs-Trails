import { and, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import { schema } from "../db";
import { enqueue } from "../jobs/queue";
import { writeAudit } from "../lib/audit";
import { badRequest, conflict, notFound } from "../lib/errors";
import { newId, now } from "../lib/ids";
import { queueBankFill } from "../bank/fill";
import { assembleInto } from "./v4";

export interface IssueInput {
  userId: string;
  actorId: string;
  label?: string | null;
  timeLimitMinutes?: number | null;
  /**
   * `v4` (default): assembled from the question bank right now — no model call, `ready` at once.
   * `legacy`: the v3 generated, adaptive assessment, kept for one release.
   */
  format?: "v4" | "legacy";
}

export interface IssueResult {
  assessmentId: string;
  jobId: string | null;
  status: "generating" | "ready";
  /** v4: skills the bank could not fill, already queued for a one-off gap fill. */
  shortfalls?: { skillId: string; type: string; missing: number }[];
}

/**
 * Issues an assessment: one row in `generating` and the job that builds it.
 *
 * Shared by the assessments route and the Setup screen's "Save & assign", which must issue in the
 * same transaction-of-intent as the save so the assessment is built from what was just saved.
 */
export function issueAssessment(app: FastifyInstance, input: IssueInput): IssueResult {
  const user = app.db.select().from(schema.users).where(eq(schema.users.id, input.userId)).get();
  if (!user) throw notFound("No such person.");
  if (user.role !== "learner") throw badRequest("Only learners take placement assessments.");

  const latest = app.db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.userId, input.userId))
    .orderBy(desc(schema.assessments.attemptNo))
    .get();

  /* A learner may hold several open assessments, but not sit two at once: `in_progress` means a
     clock is running and a proctor is watching. */
  const inProgress = app.db
    .select({ id: schema.assessments.id })
    .from(schema.assessments)
    .where(and(eq(schema.assessments.userId, input.userId), eq(schema.assessments.status, "in_progress")))
    .get();
  if (inProgress) {
    throw conflict("This person is sitting an assessment right now. Wait for it to finish, or end it from the live board.");
  }

  const assessmentId = newId();
  const attemptNo = (latest?.attemptNo ?? 0) + 1;

  if ((input.format ?? "v4") === "v4") {
    app.db
      .insert(schema.assessments)
      .values({
        id: assessmentId,
        userId: input.userId,
        attemptNo,
        label: input.label ?? null,
        status: "generating",
        config: { format: "v4" },
        hardWarnings: 0,
        softWarnings: 0,
        createdBy: input.actorId,
        createdAt: now(),
      })
      .run();
    let config;
    try {
      config = assembleInto(app.db, assessmentId, input.userId);
    } catch (error) {
      app.db.delete(schema.assessments).where(eq(schema.assessments.id, assessmentId)).run();
      throw error;
    }
    // Deterministic and reviewed once as bank items, so there is no per-sitting approval gate.
    app.db.update(schema.assessments).set({ status: "ready", config, approvedAt: now() }).where(eq(schema.assessments.id, assessmentId)).run();
    if (config.shortfalls.length > 0) queueBankFill(app.db, config.departmentId, config.shortfalls);
    writeAudit(app.db, {
      actorId: input.actorId,
      action: "assessment.issued",
      targetType: "assessment",
      targetId: assessmentId,
      details: { userId: input.userId, attemptNo, label: input.label ?? null, format: "v4", shortfalls: config.shortfalls.length },
    });
    return { assessmentId, jobId: null, status: "ready", shortfalls: config.shortfalls };
  }

  app.db
    .insert(schema.assessments)
    .values({
      id: assessmentId,
      userId: input.userId,
      attemptNo,
      label: input.label ?? null,
      status: "generating",
      config: input.timeLimitMinutes ? { timeLimitMinutes: input.timeLimitMinutes } : {},
      hardWarnings: 0,
      softWarnings: 0,
      createdBy: input.actorId,
      createdAt: now(),
    })
    .run();

  const jobId = enqueue(app.db, { type: "assessment.blueprint", payload: { assessmentId } });

  writeAudit(app.db, {
    actorId: input.actorId,
    action: "assessment.issued",
    targetType: "assessment",
    targetId: assessmentId,
    details: { userId: input.userId, attemptNo, label: input.label ?? null },
  });

  return { assessmentId, jobId, status: "generating" };
}
