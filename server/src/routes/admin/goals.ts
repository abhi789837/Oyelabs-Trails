import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { goalInterpretRequestSchema, onboardSuggestRequestSchema, saveGoalsRequestSchema } from "../../../../shared/goals";
import { requireStaff, staffOnly } from "../../auth/guards";
import { schema } from "../../db";
import { listOutcomes, searchOutcomes, toOutcomeOption } from "../../goals/outcomes";
import { achieveGoal, addSuggestion, capstoneSummaries, dismissSuggestion, listGoals, listSuggestions, restoreSuggestion, saveGoals } from "../../goals/repo";
import { interpretGoal, suggestOnboarding } from "../../goals/suggest";
import { writeAudit } from "../../lib/audit";
import { forbidden, notFound, parseOrThrow } from "../../lib/errors";
import { departmentOf, getSetup } from "../../setup/repo";

const userParams = z.object({ userId: z.string().min(1).max(64) });
const suggestionParams = userParams.extend({ id: z.string().min(1).max(64) });
const goalParams = userParams.extend({ goalId: z.string().min(1).max(64) });

/**
 * v4.3 goals for admins: the case library, quick onboarding's Suggest, the free-text reading, a
 * learner's goals and their "Suggested next" (Add / Dismiss).
 */
export async function registerAdminGoalRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  const loadLearner = (userId: string, actor: { id: string; role: string }) => {
    const user = app.db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
    if (!user) throw notFound("No such person.");
    if (user.role !== "learner" && actor.role !== "superadmin" && actor.id !== user.id) throw forbidden();
    return user;
  };

  /** The department's practical cases for the goal box's picker, best match first. */
  app.get("/api/admin/outcomes", async (request) => {
    requireStaff(request);
    const query = parseOrThrow(z.object({ departmentId: z.string().min(1).max(48), q: z.string().max(120).default("") }), request.query);
    return { outcomes: searchOutcomes(listOutcomes(app.db, query.departmentId), query.q).map(toOutcomeOption) };
  });

  /** Quick onboarding: one line in, the whole setup pre-filled out. One Haiku call, rules without AI. */
  app.post("/api/admin/onboard/suggest", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request) => {
    requireStaff(request);
    const body = parseOrThrow(onboardSuggestRequestSchema, request.body);
    const suggestion = await suggestOnboarding({ db: app.db, ai: app.ai }, body);
    return { suggestion, aiAvailable: app.ai.isConfigured() };
  });

  /** A free-text goal read into an outcome, skills and a level, for the admin to accept or edit. */
  app.post("/api/admin/goals/interpret", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request) => {
    requireStaff(request);
    const body = parseOrThrow(goalInterpretRequestSchema.extend({ userId: z.string().max(64).optional() }), request.body);
    return interpretGoal({ db: app.db, ai: app.ai }, body, { userId: body.userId });
  });

  app.get("/api/admin/users/:userId/goals", async (request) => {
    const actor = requireStaff(request);
    const { userId } = parseOrThrow(userParams, request.params);
    loadLearner(userId, actor);
    return { goals: listGoals(app.db, userId), suggestions: listSuggestions(app.db, userId), capstones: capstoneSummaries(app.db, userId) };
  });

  /** Replaces the goals and re-derives the priorities from them. */
  app.put("/api/admin/users/:userId/goals", async (request) => {
    const actor = requireStaff(request);
    const { userId } = parseOrThrow(userParams, request.params);
    loadLearner(userId, actor);
    const body = parseOrThrow(saveGoalsRequestSchema, request.body);
    const goals = saveGoals(app.db, userId, body.goals, { departmentId: departmentOf(app.db, userId) });
    writeAudit(app.db, { actorId: actor.id, action: "learner.goals_saved", targetType: "user", targetId: userId, details: { goals: goals.length } });
    return { goals, setup: getSetup(app.db, userId) };
  });

  /** An admin's own judgement that a goal is met (a written or role-play capstone, say). */
  app.post("/api/admin/users/:userId/goals/:goalId/achieve", async (request) => {
    const actor = requireStaff(request);
    const { userId, goalId } = parseOrThrow(goalParams, request.params);
    loadLearner(userId, actor);
    achieveGoal(app.db, userId, goalId);
    writeAudit(app.db, { actorId: actor.id, action: "learner.goal_achieved", targetType: "user", targetId: userId, details: { goalId } });
    return { goals: listGoals(app.db, userId), suggestions: listSuggestions(app.db, userId), capstones: capstoneSummaries(app.db, userId) };
  });

  app.get("/api/admin/users/:userId/goal-suggestions", async (request) => {
    const actor = requireStaff(request);
    const { userId } = parseOrThrow(userParams, request.params);
    loadLearner(userId, actor);
    return { suggestions: listSuggestions(app.db, userId) };
  });

  app.post("/api/admin/users/:userId/goal-suggestions/:id/add", async (request) => {
    const actor = requireStaff(request);
    const { userId, id } = parseOrThrow(suggestionParams, request.params);
    loadLearner(userId, actor);
    const goal = addSuggestion(app.db, userId, id);
    writeAudit(app.db, { actorId: actor.id, action: "learner.goal_suggestion_added", targetType: "user", targetId: userId, details: { suggestionId: id, goalId: goal.id } });
    return { goal, goals: listGoals(app.db, userId), suggestions: listSuggestions(app.db, userId) };
  });

  app.post("/api/admin/users/:userId/goal-suggestions/:id/dismiss", async (request) => {
    const actor = requireStaff(request);
    const { userId, id } = parseOrThrow(suggestionParams, request.params);
    loadLearner(userId, actor);
    dismissSuggestion(app.db, userId, id);
    return { suggestions: listSuggestions(app.db, userId) };
  });

  /** v4.3 P6: Undo of a dismiss. */
  app.post("/api/admin/users/:userId/goal-suggestions/:id/restore", async (request) => {
    const actor = requireStaff(request);
    const { userId, id } = parseOrThrow(suggestionParams, request.params);
    loadLearner(userId, actor);
    restoreSuggestion(app.db, userId, id);
    return { suggestions: listSuggestions(app.db, userId) };
  });
}
