import { desc, eq, inArray } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import type { PlanResponse, PlanSummary } from "../../../../shared/plans";
import { publishPlanRequestSchema } from "../../../../shared/plans";
import { requireSuperadmin, superadminOnly } from "../../auth/guards";
import { schema } from "../../db";
import { writeAudit } from "../../lib/audit";
import { badRequest, notFound, parseOrThrow } from "../../lib/errors";
import { pagedQuery } from "../../lib/pagedRoute";
import { auditTableSpec } from "../../lib/tableSpecs";
import { latestPublishedPlan, planHistory, publishPlan, type PublishedPlan } from "../../plans/repo";
import { getProgress } from "../../progress/repo";

function toSummary(plan: PublishedPlan): PlanSummary {
  return {
    id: plan.id,
    version: plan.version,
    source: plan.source,
    assessmentId: plan.assessmentId,
    topicIds: plan.topicIds,
    publishedAt: plan.publishedAt,
  };
}

export async function registerAdminPlanRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", superadminOnly);

  app.get("/api/admin/users/:id/plan", async (request): Promise<PlanResponse> => {
    const { id } = request.params as { id: string };
    const user = app.db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, id)).get();
    if (!user) throw notFound("No such person.");

    const current = latestPublishedPlan(app.db, id);
    return { plan: current ? toSummary(current) : null, history: planHistory(app.db, id).map(toSummary) };
  });

  /**
   * Publishes a plan the admin assembled by hand. This exists before the AI does, so content
   * gating is testable on its own (brief §17 P2), and it stays afterwards as the editor from
   * §11.2.
   *
   * Progress is deliberately untouched: a topic removed from a plan keeps its completion, so
   * re-adding it later does not ask the learner to redo work.
   */
  app.put("/api/admin/users/:id/plan", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = request.params as { id: string };
    const body = parseOrThrow(publishPlanRequestSchema, request.body);

    const user = app.db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    if (!user) throw notFound("No such person.");
    if (user.role === "superadmin") throw badRequest("A super admin already sees the whole curriculum.");

    const unknown = body.topicIds.filter((topicId) => !app.content.hasTopic(topicId));
    if (unknown.length > 0) {
      throw badRequest(
        `${unknown.length} of those topics don't exist: ${unknown.slice(0, 5).join(", ")}${unknown.length > 5 ? "…" : ""}`,
        { topicIds: "Some topic ids are not in the curriculum." },
      );
    }

    const previous = latestPublishedPlan(app.db, id);
    const plan = publishPlan(app.db, app.content, {
      userId: id,
      topicIds: body.topicIds,
      source: "admin",
      rationale: body.note ? { note: body.note } : null,
      publishedBy: actor.id,
    });

    const added = plan.topicIds.filter((t) => !previous?.topicIds.includes(t)).length;
    const removed = (previous?.topicIds ?? []).filter((t) => !plan.topicIds.includes(t)).length;

    writeAudit(app.db, {
      actorId: actor.id,
      action: "plan.published",
      targetType: "user",
      targetId: id,
      details: { version: plan.version, topics: plan.topicIds.length, added, removed, source: "admin" },
    });

    return { plan: toSummary(plan) };
  });

  /**
   * The admin's view of someone's progress, including topics no longer in their plan — removing a
   * topic must not erase the evidence that they did it.
   */
  app.get("/api/admin/users/:id/progress", async (request) => {
    const { id } = request.params as { id: string };
    const user = app.db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, id)).get();
    if (!user) throw notFound("No such person.");
    return { progress: getProgress(app.db, id) };
  });

  /**
   * Every challenge attempt this person has made (brief §13, the Progress tab).
   *
   * Carries the submitted quiz answers and code, not just the score: "they passed on the third
   * try" is a far weaker signal than what they actually wrote. Capped at 200 because the tab
   * renders all of them at once, and someone grinding a code challenge can produce a lot of rows.
   */
  app.get("/api/admin/users/:id/attempts", async (request) => {
    const { id } = request.params as { id: string };
    const user = app.db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, id)).get();
    if (!user) throw notFound("No such person.");

    const rows = app.db
      .select()
      .from(schema.topicAttempts)
      .where(eq(schema.topicAttempts.userId, id))
      .orderBy(desc(schema.topicAttempts.createdAt))
      .limit(200)
      .all();

    return {
      attempts: rows.map((row) => ({
        id: row.id,
        topicId: row.topicId,
        kind: row.kind,
        score: row.score,
        passed: row.passed,
        answers: row.answers ?? null,
        code: row.code,
        createdAt: row.createdAt,
      })),
    };
  });

  /**
   * The audit log (brief §13, last bullet).
   *
   * Newest first and capped, because this is a "what happened recently" screen rather than an
   * archive. `details` is returned as stored — `writeAudit` is the place that keeps secrets out of
   * it, so nothing has to be redacted on the way out.
   */
  app.get("/api/admin/audit", async (request) => {
    /* Server-paged through `auditTableSpec`. The log grows without bound — every approval, every
       status change, every credential touch — so "the newest 200" stopped being an answer to
       "what happened to this account in March". */
    const { meta, apply } = pagedQuery(app.db, auditTableSpec, schema.auditLog, request.query);
    const rows = apply(app.db.select().from(schema.auditLog).$dynamic()).all();

    const actorIds = [...new Set(rows.map((row) => row.actorId).filter((value): value is string => value !== null))];
    const actors = actorIds.length
      ? app.db
          .select({
            id: schema.users.id,
            username: schema.users.username,
            displayName: schema.users.displayName,
          })
          .from(schema.users)
          .where(inArray(schema.users.id, actorIds))
          .all()
      : [];
    const byId = new Map(actors.map((actor) => [actor.id, actor]));

    return {
      meta,
      entries: rows.map((row) => {
        const actor = row.actorId ? byId.get(row.actorId) : undefined;
        return {
          id: row.id,
          actorId: row.actorId,
          // Null for a deleted account, so the entry survives the person it was about.
          actorUsername: actor?.username ?? null,
          actorName: actor?.displayName ?? null,
          action: row.action,
          targetType: row.targetType,
          targetId: row.targetId,
          details: row.details ?? null,
          createdAt: row.createdAt,
        };
      }),
    };
  });
}
