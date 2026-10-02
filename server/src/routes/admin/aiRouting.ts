import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { aiTaskSchema, budgetSchema, updateRouteSchema } from "../../../../shared/aiRouting";
import { budgetStatus, listRoutes, setBudget, setRoute } from "../../ai/router";
import { usageReport } from "../../ai/usage";
import { requireSuperadmin, staffOnly } from "../../auth/guards";
import { schema } from "../../db";
import { writeAudit } from "../../lib/audit";
import { parseOrThrow } from "../../lib/errors";

/**
 * v4 Phase 6: model per task type, the monthly budget, and the usage page. Every admin can read
 * usage; only the superadmin changes routing or the budget, as with the credential itself.
 */
export async function registerAdminAiRoutingRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  app.get("/api/admin/ai/usage", async (request) => {
    const { days } = parseOrThrow(z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }), request.query);
    return usageReport(app.db, days);
  });

  app.get("/api/admin/ai/routes", async () => {
    const settings = app.db.select({ models: schema.aiSettings.availableModels, fetchedAt: schema.aiSettings.modelsFetchedAt }).from(schema.aiSettings).get();
    return { routes: listRoutes(app.db), availableModels: settings?.models ?? [], modelsFetchedAt: settings?.fetchedAt ?? null, budget: budgetStatus(app.db) };
  });

  app.put("/api/admin/ai/routes/:task", async (request) => {
    const actor = requireSuperadmin(request);
    const { task } = parseOrThrow(z.object({ task: aiTaskSchema }), request.params);
    const body = parseOrThrow(updateRouteSchema, request.body);
    setRoute(app.db, task, body, actor.id);
    writeAudit(app.db, { actorId: actor.id, action: "ai.route_updated", targetType: "ai_task", targetId: task, details: body });
    return { routes: listRoutes(app.db) };
  });

  app.post("/api/admin/ai/models/refresh", async (request) => {
    requireSuperadmin(request);
    const ids = await app.ai.refreshModels();
    return { availableModels: ids ?? [], refreshed: ids != null };
  });

  app.put("/api/admin/ai/budget", async (request) => {
    const actor = requireSuperadmin(request);
    const body = parseOrThrow(budgetSchema, request.body);
    setBudget(app.db, body.monthlyBudgetUsd);
    writeAudit(app.db, { actorId: actor.id, action: "ai.budget_updated", details: body });
    return { budget: budgetStatus(app.db) };
  });
}
