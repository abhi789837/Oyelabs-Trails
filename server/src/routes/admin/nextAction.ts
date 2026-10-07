import { and, count, desc, eq, inArray, isNotNull, isNull, like, max } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { NEW_COURSE_ITEM_PREFIX } from "../../../../shared/builder";
import { nextAction, type NextAction, type NextActionFacts } from "../../../../shared/nextAction";
import { creatingInfo } from "../../builder/repo";
import { requireStaff, staffOnly } from "../../auth/guards";
import { schema, type Db } from "../../db";
import { notFound, parseOrThrow } from "../../lib/errors";
import { activeWeek } from "../../plans/weekly/repo";
import { speakToListen } from "../../assessment/markByHand";

const userParams = z.object({ userId: z.string().min(1).max(64) });

/**
 * The facts `nextAction` decides from, read straight from the database. Each is one small indexed
 * query, so the learner page can ask after every action without loading every tab's data.
 */
export function nextActionFacts(db: Db, userId: string, nowMs = Date.now()): NextActionFacts | null {
  const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) return null;

  const goals = db
    .select({ n: count(), at: max(schema.learnerGoals.updatedAt) })
    .from(schema.learnerGoals)
    .where(and(eq(schema.learnerGoals.userId, userId), eq(schema.learnerGoals.status, "active")))
    .get();
  const priorities = db.select({ n: count() }).from(schema.learnerSkillPriorities).where(eq(schema.learnerSkillPriorities.userId, userId)).get();
  const settings = db.select({ at: schema.learnerPriorities.updatedAt }).from(schema.learnerPriorities).where(eq(schema.learnerPriorities.userId, userId)).get();

  const assessment = db
    .select({ id: schema.assessments.id, status: schema.assessments.status })
    .from(schema.assessments)
    .where(eq(schema.assessments.userId, userId))
    .orderBy(desc(schema.assessments.attemptNo))
    .get();

  const evaluation = db
    .select({ at: max(schema.evaluations.createdAt) })
    .from(schema.evaluations)
    .innerJoin(schema.assessments, eq(schema.assessments.id, schema.evaluations.assessmentId))
    .where(eq(schema.assessments.userId, userId))
    .get();

  const path =
    db
      .select()
      .from(schema.learningPaths)
      .where(and(eq(schema.learningPaths.userId, userId), eq(schema.learningPaths.current, true)))
      .get() ??
    db.select().from(schema.learningPaths).where(eq(schema.learningPaths.userId, userId)).orderBy(desc(schema.learningPaths.createdAt)).get();

  /* "Needs review" exactly as the Path tab counts it: a generated course (no module) that the
     learner cannot open yet because it is not published. */
  let needsReview = 0;
  if (path) {
    const generated = db
      .select({ courseId: schema.pathItems.courseId })
      .from(schema.pathItems)
      .where(and(eq(schema.pathItems.pathId, path.id), eq(schema.pathItems.source, "generated"), isNull(schema.pathItems.moduleId), isNotNull(schema.pathItems.courseId)))
      .all()
      .map((r) => r.courseId!);
    if (generated.length) {
      needsReview = db
        .select({ id: schema.generatedCourses.courseId, status: schema.generatedCourses.status })
        .from(schema.generatedCourses)
        .where(inArray(schema.generatedCourses.courseId, generated))
        .all()
        .filter((r) => r.status !== "published").length;
    }
  }

  const graph = db.select({ at: max(schema.skillEdges.updatedAt) }).from(schema.skillEdges).where(isNotNull(schema.skillEdges.updatedBy)).get();
  const suggestions = db
    .select({ n: count() })
    .from(schema.goalSuggestions)
    .where(and(eq(schema.goalSuggestions.userId, userId), eq(schema.goalSuggestions.status, "open")))
    .get();
  const week = activeWeek(db, userId);

  // v4.4 P6: what waits for a person, and the new courses being made for this learner.
  const reviews = db
    .select({ n: count() })
    .from(schema.reviewRequests)
    .where(and(eq(schema.reviewRequests.userId, userId), eq(schema.reviewRequests.status, "open")))
    .get();
  const courses = pathCourseFacts(db, path?.id ?? null);

  const changed = [goals?.at ?? null, settings?.at ?? null].filter((v): v is number => typeof v === "number");

  return {
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    hasGoals: (goals?.n ?? 0) > 0 || (priorities?.n ?? 0) > 0,
    assessment: assessment ? { status: assessment.status } : null,
    evaluationAt: evaluation?.at ?? null,
    path: path ? { status: path.status, createdAt: path.createdAt, needsReview } : null,
    setupChangedAt: changed.length ? Math.max(...changed) : null,
    graphChangedAt: graph?.at ?? null,
    openSuggestions: suggestions?.n ?? 0,
    week: week ? { weekNumber: week.weekNumber, endDate: week.endDate } : null,
    today: new Date(nowMs).toISOString().slice(0, 10),
    name: user.displayName,
    speakToListen: assessment ? speakToListen(db, assessment.id) : 0,
    openReviews: reviews?.n ?? 0,
    courses,
  };
}

/**
 * v4.5 P0: the new courses on this path, counted the way the path banners count them (one per
 * course being made, whoever's job it is), so the status line and the banners always agree.
 */
export function pathCourseFacts(db: Db, pathId: string | null): NonNullable<NextActionFacts["courses"]> {
  const facts = { creating: 0, waitingSetup: 0, problem: null as string | null, failed: 0, failedProblem: null as string | null };
  if (!pathId) return facts;
  const keys = new Set(
    db
      .select({ moduleId: schema.pathItems.moduleId })
      .from(schema.pathItems)
      .where(and(eq(schema.pathItems.pathId, pathId), like(schema.pathItems.moduleId, `${NEW_COURSE_ITEM_PREFIX}%`)))
      .all()
      .map((row) => row.moduleId!.slice(NEW_COURSE_ITEM_PREFIX.length)),
  );
  for (const key of keys) {
    const info = creatingInfo(db, key);
    if (info.state === "working") facts.creating += 1;
    else if (info.state === "waiting_setup") {
      facts.waitingSetup += 1;
      facts.problem ??= info.problem;
    } else if (info.state === "failed") {
      facts.failed += 1;
      facts.failedProblem ??= info.problem;
    }
  }
  return facts;
}

/** v4.3 Phase 6: the learner page's top bar — the next action, computed from DB state. */
export async function registerAdminNextActionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  app.get("/api/admin/users/:userId/next-action", async (request): Promise<{ action: NextAction; facts: NextActionFacts }> => {
    requireStaff(request);
    const { userId } = parseOrThrow(userParams, request.params);
    const facts = nextActionFacts(app.db, userId);
    if (!facts) throw notFound("No such person.");
    return { action: nextAction(facts), facts };
  });
}
