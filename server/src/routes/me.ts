import type { FastifyInstance } from "fastify";

import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { EvaluationResult, MyEvaluation } from "../../../shared/assessment";
import type { ManifestResponse, ProgressResponse } from "../../../shared/content";
import { markInProgressRequestSchema } from "../../../shared/content";
import type { NotificationsResponse } from "../../../shared/notifications";
import { requireActiveUser } from "../auth/guards";
import { filterManifest } from "../content/filter";
import { schema } from "../db";
import { notFound, parseOrThrow } from "../lib/errors";
import { listNotifications, markAllRead, unreadCount } from "../lib/notify";
import { allowedTopicIdsFor, latestPublishedPlan } from "../plans/repo";
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
