import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { skillEdgeInputSchema, skillEdgeKeySchema } from "../../../../shared/skillGraph";
import { requireSuperadmin, staffOnly } from "../../auth/guards";
import { addSkillEdge, deleteSkillEdge, getSkillGraph, updateSkillEdge } from "../../catalog/graph";
import { writeAudit } from "../../lib/audit";
import { parseOrThrow } from "../../lib/errors";

/**
 * v4.3 skill graph admin: which skills come before which.
 *
 * Like the rest of the catalog, any staff member reads it and only the superadmin changes it, since
 * one department's graph orders every learner's path in that department. Every change is checked
 * for loops on the server; a loop is a 409 whose message names the skills in it.
 */
export async function registerAdminSkillGraphRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  app.get("/api/admin/skill-graph", async (request) => {
    const { departmentId } = parseOrThrow(z.object({ departmentId: z.string().min(1).max(40).optional() }), request.query);
    return getSkillGraph(app.db, departmentId);
  });

  app.post("/api/admin/skill-graph/edges", async (request) => {
    const actor = requireSuperadmin(request);
    const body = parseOrThrow(skillEdgeInputSchema, request.body);
    const edge = addSkillEdge(app.db, body, actor.id);
    writeAudit(app.db, { actorId: actor.id, action: "skill_edge.created", targetType: "skill_edge", targetId: `${edge.from}->${edge.to}`, details: { type: edge.type } });
    return { edge };
  });

  app.put("/api/admin/skill-graph/edges", async (request) => {
    const actor = requireSuperadmin(request);
    const body = parseOrThrow(skillEdgeInputSchema, request.body);
    const edge = updateSkillEdge(app.db, body, actor.id);
    writeAudit(app.db, { actorId: actor.id, action: "skill_edge.updated", targetType: "skill_edge", targetId: `${edge.from}->${edge.to}`, details: { type: edge.type } });
    return { edge };
  });

  app.delete("/api/admin/skill-graph/edges", async (request) => {
    const actor = requireSuperadmin(request);
    const { from, to } = parseOrThrow(skillEdgeKeySchema, request.query);
    const edge = deleteSkillEdge(app.db, from, to);
    writeAudit(app.db, { actorId: actor.id, action: "skill_edge.deleted", targetType: "skill_edge", targetId: `${from}->${to}`, details: { type: edge.type } });
    return { edge };
  });
}
