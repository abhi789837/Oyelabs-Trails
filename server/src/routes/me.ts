import type { FastifyInstance } from "fastify";

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { EvaluationResult, MyEvaluation } from "../../../shared/assessment";
import type { ManifestResponse, ProgressResponse } from "../../../shared/content";
import { markInProgressRequestSchema } from "../../../shared/content";
import type { NotificationsResponse } from "../../../shared/notifications";
import type { WeekResponse } from "../../../shared/weeklyPlan";
import { isWeekComplete } from "../../../shared/weeklyPlan";
import { requireActiveUser } from "../auth/guards";
import { filterManifest } from "../content/filter";
import { currentPath } from "../builder/repo";
import { completedTopicIds, coursesFor, getCourse, mayOpenCourse } from "../courses/repo";
import { schema } from "../db";
import { badRequest, notFound, parseOrThrow } from "../lib/errors";
import { now } from "../lib/ids";
import { listNotifications, markAllRead, unreadCount } from "../lib/notify";
import { allowedTopicIdsFor, latestPublishedPlan } from "../plans/repo";
import { generateWeek, ensureWeek } from "../plans/weekly/generate";
import { activeWeek, weekHistory, weekView } from "../plans/weekly/repo";
import { getProgress, markInProgress } from "../progress/repo";

export async function registerMeRoutes(app: FastifyInstance): Promise<void> {
  /**
   * The table of contents this person is allowed to navigate.
   *
   * Everything in the UI that used to read the bundled manifest — sidebar, trail maps, search,
   * dashboard, prev/next — now reads this, so pruning here is what makes the whole app honest
   * about a learner's plan (brief §7.3).
   */
  app.get("/api/me/manifest", async (request): Promise<ManifestResponse> => {
    const user = requireActiveUser(request);
    const plan = user.role === "superadmin" ? null : latestPublishedPlan(app.db, user.id);
    const allowed = allowedTopicIdsFor(app.db, user);

    return {
      tracks: filterManifest(app.content.manifest, allowed),
      unfiltered: allowed === null,
      planTopicIds: plan?.topicIds ?? [],
      planVersion: plan?.version ?? null,
    };
  });

  // -------------------------------------------------------------------------
  // Admin-authored courses
  // -------------------------------------------------------------------------

  /**
   * The courses this learner should see.
   *
   * Separate from the manifest, and separate from plan progress, because they are a different kind
   * of thing: there is no challenge to pass, so completion is the learner's word. Mixing that into
   * the plan percentage would quietly change what that number means.
   */
  app.get("/api/me/courses", async (request) => {
    const user = requireActiveUser(request);
    return { courses: coursesFor(app.db, user.id) };
  });

  /**
   * The learner's own path: what was added, in what order, and why.
   *
   * The reason on each item is the point. A course that appears without explanation reads as the
   * platform deciding things about you; the same course with "you missed 4 of 5 questions on server
   * deployment" reads as a consequence of something you did, which is what it is.
   */
  app.get("/api/me/path", async (request) => {
    const user = requireActiveUser(request);
    return { path: currentPath(app.db, user.id) };
  });

  app.get("/api/me/courses/:courseId", async (request) => {
    const user = requireActiveUser(request);
    const { courseId } = parseOrThrow(z.object({ courseId: z.string().min(1).max(64) }), request.params);

    // An unpublished or unassigned course is a 404 rather than a 403: whether a draft exists is
    // not something a learner needs to be able to probe for.
    if (!mayOpenCourse(app.db, user.id, courseId)) throw notFound("No such course.");

    const course = getCourse(app.db, courseId);
    if (!course) throw notFound("No such course.");
    return { course, completedTopicIds: completedTopicIds(app.db, user.id, courseId) };
  });

  /** Ticking a lesson off, or un-ticking it. Idempotent in both directions. */
  app.post("/api/me/courses/topics/:topicId/complete", async (request) => {
    const user = requireActiveUser(request);
    const { topicId } = parseOrThrow(z.object({ topicId: z.string().min(1).max(64) }), request.params);
    const { done } = parseOrThrow(z.object({ done: z.boolean().default(true) }), request.body ?? {});

    const topic = app.db.select().from(schema.courseTopics).where(eq(schema.courseTopics.id, topicId)).get();
    if (!topic) throw notFound("No such lesson.");
    if (!mayOpenCourse(app.db, user.id, topic.courseId)) throw notFound("No such lesson.");

    if (done) {
      app.db
        .insert(schema.courseProgress)
        .values({ userId: user.id, topicId, courseId: topic.courseId, completedAt: now() })
        .onConflictDoNothing()
        .run();
    } else {
      app.db
        .delete(schema.courseProgress)
        .where(and(eq(schema.courseProgress.userId, user.id), eq(schema.courseProgress.topicId, topicId)))
        .run();
    }

    return { completedTopicIds: completedTopicIds(app.db, user.id, topic.courseId) };
  });

  app.get("/api/me/progress", async (request): Promise<ProgressResponse> => {
    const user = requireActiveUser(request);
    return { progress: getProgress(app.db, user.id) };
  });

  /** Opening a topic marks it started. Ignored for a topic that is not assigned. */
  app.post("/api/me/progress/start", async (request) => {
    const user = requireActiveUser(request);
    const { topicId } = parseOrThrow(markInProgressRequestSchema, request.body);

    const allowed = allowedTopicIdsFor(app.db, user);
    if (allowed !== null && !allowed.has(topicId)) throw notFound("That waypoint isn't part of your plan.");
    if (!app.content.hasTopic(topicId)) throw notFound("That waypoint doesn't exist.");

    markInProgress(app.db, user.id, topicId);
    return { ok: true };
  });

  /**
   * The learner's own view of their evaluation (brief §12).
   *
   * Deliberately narrow: strengths, focus areas and the summary written *for them*. It carries no
   * integrity detail and never quotes the manager's notes — both are in the admin's view only.
   */
  app.get("/api/me/evaluation", async (request): Promise<{ evaluation: MyEvaluation | null }> => {
    const user = requireActiveUser(request);

    const assessment = app.db
      .select()
      .from(schema.assessments)
      .where(eq(schema.assessments.userId, user.id))
      .orderBy(desc(schema.assessments.attemptNo))
      .get();
    if (!assessment) return { evaluation: null };

    const row = app.db
      .select()
      .from(schema.evaluations)
      .where(eq(schema.evaluations.assessmentId, assessment.id))
      .orderBy(desc(schema.evaluations.createdAt))
      .get();
    if (!row) return { evaluation: null };

    const result = row.result as EvaluationResult;
    return {
      evaluation: {
        overallLevel: result.overallLevel,
        learnerSummary: result.learnerSummary,
        areas: result.areas.map((area) => ({
          area: area.area,
          level: area.level,
          strengths: area.strengths,
          gaps: area.gaps,
        })),
        estimatedHours: result.plan.estimatedHours,
      },
    };
  });

  /**
   * My notifications, for the bell in the app shell.
   *
   * `notify()` already writes rows addressed to learners — "your placement assessment is ready",
   * "your learning plan is ready", "your assessment was ended" — but until now the only way to
   * read a notification was `/api/admin/notifications`, which a learner cannot call. So the shell
   * reads this instead, for both roles: it is the same table, scoped to whoever is asking, which
   * keeps one notification centre in one place rather than one per role.
   */
  app.get("/api/me/notifications", async (request): Promise<NotificationsResponse> => {
    const user = requireActiveUser(request);
    const { limit } = parseOrThrow(
      z.object({ limit: z.coerce.number().int().min(1).max(100).default(30) }),
      request.query,
    );
    return { notifications: listNotifications(app.db, user.id, limit), unread: unreadCount(app.db, user.id) };
  });

  app.post("/api/me/notifications/read", async (request) => {
    const user = requireActiveUser(request);
    markAllRead(app.db, user.id);
    return { ok: true };
  });

  // -------------------------------------------------------------------------
  // This week
  // -------------------------------------------------------------------------

  /**
   * The learner's current week.
   *
   * Generated here on the first read of a new week rather than by a scheduled job. There is no cron in
   * this deployment, and adding one would mean somebody's Monday depended on a worker having woken up;
   * generating on the visit means the week is always there when they look, and is never generated for
   * a learner who is not looking. It is also how the existing 204-lesson plans become weekly ones
   * without a migration script having to guess at anybody's priorities.
   */
  app.get("/api/me/week", async (request): Promise<WeekResponse> => {
    const user = requireActiveUser(request);

    const generated = await ensureWeek({ db: app.db, content: app.content, ai: app.ai, log: (m) => app.log.info(m) }, user.id);
    const row = activeWeek(app.db, user.id);
    if (!row) {
      return { week: null, history: weekHistory(app.db, user.id), reason: generated?.reason ?? null };
    }

    return { week: weekView(app.db, app.content, user.id, row), history: weekHistory(app.db, user.id), reason: null };
  });

  /**
   * "Plan my next week now."
   *
   * Gated on the red and Must-know lanes being clear, and deliberately not on Medium or Low: those are
   * "as much as fits" and "skip if you like", and making either of them a gate would turn optional work
   * into homework. The week rolls over on its own after seven days regardless; this is for somebody who
   * finished on Thursday and wants the next one.
   */
  app.post("/api/me/week/next", async (request): Promise<WeekResponse> => {
    const user = requireActiveUser(request);

    const row = activeWeek(app.db, user.id);
    if (row) {
      const view = weekView(app.db, app.content, user.id, row);
      if (!isWeekComplete(view.items)) {
        throw badRequest("Finish this week's Do it now and Must know items first, and the next week will be ready.");
      }
    }

    const result = await generateWeek(
      { db: app.db, content: app.content, ai: app.ai, log: (m) => app.log.info(m) },
      { userId: user.id, advance: true },
    );
    const next = activeWeek(app.db, user.id);
    return {
      week: next ? weekView(app.db, app.content, user.id, next) : null,
      history: weekHistory(app.db, user.id),
      reason: result.reason,
    };
  });

  /** The learner's own plan. The admin's view of someone else's plan lives under /api/admin. */
  app.get("/api/me/plan", async (request) => {
    const user = requireActiveUser(request);
    const plan = latestPublishedPlan(app.db, user.id);
    if (!plan) return { plan: null };
    return {
      plan: {
        version: plan.version,
        source: plan.source,
        publishedAt: plan.publishedAt,
        topicIds: plan.topicIds,
        rationale: plan.rationale,
      },
    };
  });
}
