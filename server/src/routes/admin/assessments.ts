import { desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  issueAssessmentRequestSchema,
  type AssessmentSummary,
  type Blueprint,
  type CriticVerdict,
  type GenerationLogResponse,
  type ItemKey,
  type ItemPayload,
  type PoolItem,
} from "../../../../shared/assessment";
import { approveAssessment } from "../../assessment/approval";
import { generationLogFor } from "../../assessment/generationLog";
import { requireSuperadmin, superadminOnly } from "../../auth/guards";
import { schema } from "../../db";
import { enqueue } from "../../jobs/queue";
import { writeAudit } from "../../lib/audit";
import { badRequest, conflict, notFound, parseOrThrow } from "../../lib/errors";
import { newId, now } from "../../lib/ids";

const userParams = z.object({ id: z.string().min(1).max(64) });
const assessmentParams = z.object({ assessmentId: z.string().min(1).max(64) });

export function summarise(
  row: typeof schema.assessments.$inferSelect,
  itemCounts: Record<string, number>,
): AssessmentSummary {
  return {
    id: row.id,
    userId: row.userId,
    attemptNo: row.attemptNo,
    status: row.status,
    createdAt: row.createdAt,
    startedAt: row.startedAt,
    deadlineAt: row.deadlineAt,
    submittedAt: row.submittedAt,
    terminatedReason: row.terminatedReason,
    hardWarnings: row.hardWarnings,
    softWarnings: row.softWarnings,
    awaitingApprovalSince: row.awaitingApprovalSince,
    approvedAt: row.approvedAt,
    approvedBy: row.approvedBy,
    blueprint: (row.blueprint as Blueprint | null) ?? null,
    itemCounts,
  };
}

export function countItems(app: FastifyInstance, assessmentId: string): Record<string, number> {
  const rows = app.db
    .select({ status: schema.assessmentItems.status })
    .from(schema.assessmentItems)
    .where(eq(schema.assessmentItems.assessmentId, assessmentId))
    .all();

  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
  return counts;
}

export async function registerAdminAssessmentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", superadminOnly);

  /**
   * Issues an assessment (brief §9.2). Creating the row and queueing the job is all this does —
   * generation is minutes of AI calls and belongs to the worker, not to a request.
   */
  app.post("/api/admin/users/:id/assessments", async (request, reply) => {
    const actor = requireSuperadmin(request);
    const { id } = parseOrThrow(userParams, request.params);
    const body = parseOrThrow(issueAssessmentRequestSchema, request.body ?? {});

    const user = app.db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    if (!user) throw notFound("No such person.");
    if (user.role !== "learner") throw badRequest("Only learners take placement assessments.");

    const latest = app.db
      .select()
      .from(schema.assessments)
      .where(eq(schema.assessments.userId, id))
      .orderBy(desc(schema.assessments.attemptNo))
      .get();

    // Re-issuing while one is live would leave the learner with two open tests. One waiting on
    // approval is live too — it is minutes away from being released.
    if (
      latest &&
      ["generating", "awaiting_approval", "ready", "in_progress", "submitted", "evaluating"].includes(latest.status)
    ) {
      throw conflict(`This person already has an assessment that is ${latest.status.replace("_", " ")}.`);
    }

    if (!app.ai.isConfigured()) {
      throw badRequest("No AI credential is set up yet. Add one under Admin → AI connection first.");
    }

    const assessmentId = newId();
    app.db
      .insert(schema.assessments)
      .values({
        id: assessmentId,
        userId: id,
        attemptNo: (latest?.attemptNo ?? 0) + 1,
        status: "generating",
        config: body.timeLimitMinutes ? { timeLimitMinutes: body.timeLimitMinutes } : {},
        hardWarnings: 0,
        softWarnings: 0,
        createdBy: actor.id,
        createdAt: now(),
      })
      .run();

    const jobId = enqueue(app.db, { type: "assessment.blueprint", payload: { assessmentId } });

    writeAudit(app.db, {
      actorId: actor.id,
      action: "assessment.issued",
      targetType: "assessment",
      targetId: assessmentId,
      details: { userId: id, attemptNo: (latest?.attemptNo ?? 0) + 1 },
    });

    reply.status(202);
    return { assessmentId, jobId, status: "generating" };
  });

  app.get("/api/admin/users/:id/assessments", async (request) => {
    const { id } = parseOrThrow(userParams, request.params);
    const rows = app.db
      .select()
      .from(schema.assessments)
      .where(eq(schema.assessments.userId, id))
      .orderBy(desc(schema.assessments.attemptNo))
      .all();
    return { assessments: rows.map((row) => summarise(row, countItems(app, row.id))) };
  });

  /**
   * The generation log (brief §13): what the blueprint job did, line by line.
   *
   * Generation is minutes of provider calls, so an admin who has just issued an assessment gets
   * to watch rather than guess. Lines arrive live over the admin SSE feed; this route is what
   * makes the run readable after a reload and long after it has finished.
   *
   * Superadmin-only like everything in this plugin, and the lines themselves carry no key — see
   * `server/src/assessment/generationLog.ts` for what is allowed into one.
   */
  app.get("/api/admin/assessments/:assessmentId/generation-log", async (request) => {
    const { assessmentId } = parseOrThrow(assessmentParams, request.params);

    const assessment = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
    if (!assessment) throw notFound("No such assessment.");

    const lines = generationLogFor(app.db, assessmentId);
    const response: GenerationLogResponse = {
      status: assessment.status,
      // The first line of a complete run is seq 1; anything higher means the cap dropped the start.
      truncated: lines.length > 0 && lines[0].seq > 1,
      lines,
    };
    return response;
  });

  /**
   * The pool preview (brief §17 P4): every item with its key, rationale and critic verdict,
   * including the dropped ones and why. This is a superadmin-only route — the same data would be
   * the answer key if a learner could reach it.
   */
  app.get("/api/admin/assessments/:assessmentId/pool", async (request) => {
    const { assessmentId } = parseOrThrow(assessmentParams, request.params);

    const assessment = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
    if (!assessment) throw notFound("No such assessment.");

    const items = app.db
      .select()
      .from(schema.assessmentItems)
      .where(eq(schema.assessmentItems.assessmentId, assessmentId))
      .all();

    const pool: PoolItem[] = items.map((row) => ({
      id: row.id,
      area: row.area,
      difficulty: row.difficulty as PoolItem["difficulty"],
      kind: row.kind,
      status: row.status,
      topicIds: row.topicIds,
      payload: row.payload as ItemPayload,
      key: row.key as ItemKey,
      criticVerdict: (row.criticVerdict as CriticVerdict | null) ?? null,
      dropReason: row.dropReason,
    }));

    return { assessment: summarise(assessment, countItems(app, assessmentId)), pool };
  });

  /**
   * The full evaluation, for the admin (brief §13).
   *
   * This is the unabridged version: the summary written for the manager, the evidence behind each
   * area judgement, where the onboarding notes turned out to be wrong, the integrity assessment,
   * and any warnings the server raised while validating the proposed plan. The learner's own view
   * (`/api/me/evaluation`) is a strict subset.
   */
  app.get("/api/admin/assessments/:assessmentId/evaluation", async (request) => {
    const { assessmentId } = parseOrThrow(assessmentParams, request.params);

    const assessment = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
    if (!assessment) throw notFound("No such assessment.");

    const row = app.db
      .select()
      .from(schema.evaluations)
      .where(eq(schema.evaluations.assessmentId, assessmentId))
      .orderBy(desc(schema.evaluations.createdAt))
      .get();

    return {
      evaluation: row ? { result: row.result, model: row.model, createdAt: row.createdAt } : null,
      assessment: summarise(assessment, countItems(app, assessmentId)),
    };
  });

  /**
   * Every item the learner was actually served, with their answer and the key.
   *
   * Separate from the pool preview: that one shows what was generated, this one shows what
   * happened, including the adaptive path through each area.
   */
  app.get("/api/admin/assessments/:assessmentId/answers", async (request) => {
    const { assessmentId } = parseOrThrow(assessmentParams, request.params);
    const assessment = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
    if (!assessment) throw notFound("No such assessment.");

    const served = app.db
      .select()
      .from(schema.assessmentItems)
      .where(eq(schema.assessmentItems.assessmentId, assessmentId))
      .all()
      .filter((item) => item.status !== "pool" && item.status !== "dropped")
      .sort((a, b) => (a.servedAt ?? 0) - (b.servedAt ?? 0));

    return {
      items: served.map((item) => ({
        id: item.id,
        area: item.area,
        kind: item.kind,
        difficulty: item.difficulty,
        status: item.status,
        topicIds: item.topicIds,
        payload: item.payload,
        key: item.key,
        response: item.response,
        autoScore: item.autoScore,
        aiScore: item.aiScore,
        aiFeedback: item.aiFeedback,
        timeMs: item.timeMs,
      })),
      /** The staircase per area, for the level-over-items chart in §13. */
      selector: (assessment.config as { selector?: unknown } | null)?.selector ?? null,
    };
  });

  /**
   * Approves a generated assessment and releases it to the learner.
   *
   * The gate exists so a human can read what a model wrote before anyone is graded on it. It is
   * not a blocker: `autoApproveDue` in the sweeper releases anything still waiting after
   * `AUTO_APPROVE_AFTER_MS`, and records that nobody looked.
   *
   * Approving something that is not waiting is a conflict rather than a quiet success — a second
   * click after the deadline already released it should say so, not imply the admin reviewed it.
   */
  app.post("/api/admin/assessments/:assessmentId/approve", async (request) => {
    const actor = requireSuperadmin(request);
    const { assessmentId } = parseOrThrow(assessmentParams, request.params);

    const assessment = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
    if (!assessment) throw notFound("No such assessment.");

    if (assessment.status !== "awaiting_approval") {
      throw conflict(
        assessment.status === "ready" && assessment.approvedAt !== null
          ? assessment.approvedBy === null
            ? "This one was already released automatically — nobody approved it in time."
            : "This assessment has already been approved."
          : `This assessment is ${assessment.status.replace("_", " ")}, so there is nothing to approve.`,
      );
    }

    approveAssessment(app.db, assessment, { kind: "human", actorId: actor.id });

    const updated = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;
    return { assessment: summarise(updated, countItems(app, assessmentId)) };
  });

  /** Cancels a generating, waiting or ready assessment, so a bad profile can be corrected and re-issued. */
  app.delete("/api/admin/assessments/:assessmentId", async (request) => {
    const actor = requireSuperadmin(request);
    const { assessmentId } = parseOrThrow(assessmentParams, request.params);

    const assessment = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
    if (!assessment) throw notFound("No such assessment.");
    if (!["generating", "awaiting_approval", "ready", "failed"].includes(assessment.status)) {
      throw badRequest("Only an assessment that has not been started can be cancelled.");
    }

    app.db.delete(schema.assessments).where(eq(schema.assessments.id, assessmentId)).run();
    writeAudit(app.db, {
      actorId: actor.id,
      action: "assessment.cancelled",
      targetType: "assessment",
      targetId: assessmentId,
      details: { userId: assessment.userId, status: assessment.status },
    });
    return { ok: true };
  });
}
