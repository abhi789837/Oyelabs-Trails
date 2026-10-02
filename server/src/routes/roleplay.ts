import type { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  finishRoleplaySchema,
  publicPersona,
  publicScenario,
  roleplayCapSchema,
  roleplayTurnSchema,
  ROLEPLAY_PERSONAS,
  ROLEPLAY_SCENARIOS,
  standardRubric,
  startRoleplaySchema,
  type RoleplayCatalog,
  type RoleplaySessionView,
  type RoleplayUsage,
} from "../../../shared/roleplay";
import { requireActiveUser, requireSuperadmin, staffOnly } from "../auth/guards";
import { writeAudit } from "../lib/audit";
import { parseOrThrow } from "../lib/errors";
import { finishSession, loadOwned, roleplayUsage, setCapMicros, startSession, takeTurn, toView, withinCap, type RoleplayDeps } from "../roleplay/engine";

const idParams = z.object({ id: z.string().min(1).max(64) });

/**
 * v4.2 client role-play. Every session route is owner-only: a session id belonging to someone else
 * is a 404, whoever asks. Rate limits are per client and sized for a person typing.
 */
export async function registerRoleplayRoutes(app: FastifyInstance): Promise<void> {
  const deps = (): RoleplayDeps => ({ db: app.db, ai: app.ai, log: (m) => app.log.warn(m) });

  app.get("/api/roleplay/catalog", async (request): Promise<RoleplayCatalog> => {
    requireActiveUser(request);
    return {
      personas: ROLEPLAY_PERSONAS.map(publicPersona),
      scenarios: ROLEPLAY_SCENARIOS.map(publicScenario),
      rubric: standardRubric(true),
      aiAvailable: app.ai.isConfigured(),
      withinCap: withinCap(app.db),
    };
  });

  app.post("/api/roleplay/sessions", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request): Promise<{ session: RoleplaySessionView }> => {
    const user = requireActiveUser(request);
    const body = parseOrThrow(startRoleplaySchema, request.body, "That conversation request is not valid.");
    return { session: startSession(deps(), user.id, body) };
  });

  app.get("/api/roleplay/sessions/:id", async (request): Promise<{ session: RoleplaySessionView }> => {
    const user = requireActiveUser(request);
    const { id } = parseOrThrow(idParams, request.params);
    return { session: toView(loadOwned(app.db, user.id, id)) };
  });

  app.post("/api/roleplay/sessions/:id/turns", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (request): Promise<{ session: RoleplaySessionView }> => {
    const user = requireActiveUser(request);
    const { id } = parseOrThrow(idParams, request.params);
    const { message } = parseOrThrow(roleplayTurnSchema, request.body, "Messages are 1 to 600 characters.");
    return { session: await takeTurn(deps(), user.id, id, message) };
  });

  app.post("/api/roleplay/sessions/:id/finish", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request): Promise<{ session: RoleplaySessionView }> => {
    const user = requireActiveUser(request);
    const { id } = parseOrThrow(idParams, request.params);
    const { followUpEmail } = parseOrThrow(finishRoleplaySchema, request.body ?? {}, "The follow-up email is too long.");
    return { session: await finishSession(deps(), user.id, id, followUpEmail) };
  });
}

/** Admin: this month's role-play usage and the cap. Staff read; the superadmin changes the cap. */
export async function registerAdminRoleplayRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  app.get("/api/admin/roleplay/usage", async (): Promise<RoleplayUsage> => roleplayUsage(app.db));

  app.put("/api/admin/roleplay/cap", async (request): Promise<RoleplayUsage> => {
    const actor = requireSuperadmin(request);
    const { capUsd } = parseOrThrow(roleplayCapSchema, request.body);
    setCapMicros(app.db, capUsd * 1_000_000);
    writeAudit(app.db, { actorId: actor.id, action: "roleplay.cap_updated", details: { capUsd } });
    return roleplayUsage(app.db);
  });
}
