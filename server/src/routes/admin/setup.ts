import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { trackBasics } from "../../../../shared/catalog";
import { planAssessmentMix, saveSetupRequestSchema, setupSchema, sortPriorities, type LearnerSetup } from "../../../../shared/setup";
import { understandSetup } from "../../assessment/personalise/understand";
import { issueAssessment } from "../../assessment/issue";
import { requireStaff, staffOnly } from "../../auth/guards";
import { getCatalog } from "../../catalog/repo";
import type { Db } from "../../db";
import { schema } from "../../db";
import { writeAudit } from "../../lib/audit";
import { forbidden, notFound, parseOrThrow } from "../../lib/errors";
import { getSetup, saveSetup, setupSkills } from "../../setup/repo";

const userParams = z.object({ userId: z.string().min(1).max(64) });

/** The assessment the Setup screen promises in its summary card, from the same function the assembler uses. */
export function previewMix(db: Db, setup: LearnerSetup) {
  const catalog = getCatalog(db, { departmentId: setup.departmentId });
  const basics = trackBasics(catalog, setup.departmentId, setup.trackId, setup.stackIds).map((s) => ({ skillId: s.id, skillName: s.name, slider: 0 }));
  return planAssessmentMix(setup.priorities, basics);
}

/**
 * The single Setup endpoint (v4 Phase 3): department, track, stacks, experience, level, the
 * slider priorities, the skip list, hours and the advanced settings — read and written as one.
 * Replaces the pair of `/targets` and `/priorities` saves that used to overwrite each other.
 */
export async function registerAdminSetupRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  const loadLearner = (userId: string, actor: { id: string; role: string }) => {
    const user = app.db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
    if (!user) throw notFound("No such person.");
    if (user.role !== "learner" && actor.role !== "superadmin" && actor.id !== user.id) throw forbidden();
    return user;
  };

  /**
   * v4.1: "How the AI understood this" — reads the Setup form as it is now (saved or not) and returns
   * the intent bullets and the planned split. One small Haiku call, cached by the form's content, so
   * pressing Save & assign afterwards does not pay for it again. `force` = Regenerate understanding.
   */
  app.post("/api/admin/setup/understand", async (request) => {
    requireStaff(request);
    const body = parseOrThrow(setupSchema.extend({ force: z.boolean().default(false), userId: z.string().max(64).optional() }), request.body);
    const catalog = getCatalog(app.db, { departmentId: body.departmentId, includeArchived: true });
    const byId = new Map(catalog.skills.map((s) => [s.id, s]));
    const priorities = sortPriorities(
      body.priorities.filter((p) => byId.has(p.skillId)).map((p, position) => ({ skillId: p.skillId, skillName: byId.get(p.skillId)!.name, slider: p.slider, position })),
    );
    const skip = body.skip.filter((id) => byId.has(id)).map((id) => ({ skillId: id, skillName: byId.get(id)!.name }));
    const { understanding } = await understandSetup(
      { db: app.db, ai: app.ai },
      { setup: { departmentId: body.departmentId, trackId: body.trackId, stackIds: body.stackIds, experienceBand: body.experienceBand, level: body.level, priorities, skip }, description: body.description ?? "" },
      { force: body.force, userId: body.userId },
    );
    return { understanding, aiAvailable: app.ai.isConfigured() };
  });

  app.get("/api/admin/users/:userId/setup", async (request) => {
    const actor = requireStaff(request);
    const { userId } = parseOrThrow(userParams, request.params);
    loadLearner(userId, actor);
    const setup = getSetup(app.db, userId);
    return { setup, skills: setupSkills(app.db, setup), mix: previewMix(app.db, setup) };
  });

  app.put("/api/admin/users/:userId/setup", async (request) => {
    const actor = requireStaff(request);
    const { userId } = parseOrThrow(userParams, request.params);
    loadLearner(userId, actor);
    const body = parseOrThrow(saveSetupRequestSchema, request.body);
    const { assign, ...input } = body;

    const setup = saveSetup(app.db, userId, input, actor.id);
    writeAudit(app.db, {
      actorId: actor.id,
      action: "learner.setup_saved",
      targetType: "user",
      targetId: userId,
      details: {
        departmentId: setup.departmentId,
        trackId: setup.trackId,
        priorities: setup.priorities.length,
        skip: setup.skip.length,
        hoursPerWeek: setup.hoursPerWeek,
      },
    });

    const issued = assign ? issueAssessment(app, { userId, actorId: actor.id }) : null;
    return { setup, skills: setupSkills(app.db, setup), mix: previewMix(app.db, setup), issued };
  });
}
