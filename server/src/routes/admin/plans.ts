import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import type { PlanResponse, PlanSummary } from "../../../../shared/plans";
import { publishPlanRequestSchema } from "../../../../shared/plans";
import { requireSuperadmin, superadminOnly } from "../../auth/guards";
import { schema } from "../../db";
import { writeAudit } from "../../lib/audit";
import { badRequest, notFound, parseOrThrow } from "../../lib/errors";
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
}
