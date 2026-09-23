import { desc, eq, gte, inArray } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { getSettings, listCredentials } from "../../ai/credentials";
import { usageByPurpose } from "../../ai/service";
import { requireSuperadmin, superadminOnly } from "../../auth/guards";
import { schema } from "../../db";
import { listNotifications, markAllRead, unreadCount } from "../../lib/notify";
import { parseOrThrow } from "../../lib/errors";
import { now } from "../../lib/ids";

/**
 * The admin overview (brief §13, first bullet) and the notification bell.
 *
 * One request rather than six: this is the landing screen, and six round trips would make it feel
 * slower than the rest of the console for no benefit.
 */
export async function registerAdminOverviewRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", superadminOnly);

  app.get("/api/admin/overview", async () => {
    const users = app.db.select().from(schema.users).all();
    const learners = users.filter((u) => u.role === "learner");

    const assessments = app.db.select().from(schema.assessments).all();
    const sevenDaysAgo = now() - 7 * 24 * 60 * 60 * 1000;

    const recentEvents = app.db
      .select()
      .from(schema.integrityEvents)
      .where(gte(schema.integrityEvents.createdAt, sevenDaysAgo))
      .orderBy(desc(schema.integrityEvents.createdAt))
      .limit(15)
      .all();

    const eventUserIds = [...new Set(recentEvents.map((e) => e.userId))];
    const eventUsers = eventUserIds.length
      ? app.db.select().from(schema.users).where(inArray(schema.users.id, eventUserIds)).all()
      : [];
    const nameById = new Map(eventUsers.map((u) => [u.id, u.displayName]));

    const credentials = listCredentials(app.db);
    const settings = getSettings(app.db);
    const active = credentials.find((c) => c.id === settings.activeCredentialId) ?? null;

    const jobs = app.db.select().from(schema.jobs).all();

    return {
      people: {
        learners: learners.length,
        active: learners.filter((u) => u.status === "active").length,
        awaitingFirstSignIn: learners.filter((u) => u.mustChangePassword).length,
        disabled: learners.filter((u) => u.status === "disabled").length,
      },
      assessments: {
        inProgress: assessments.filter((a) => a.status === "in_progress").length,
        generating: assessments.filter((a) => a.status === "generating").length,
        // The only count here that is waiting on the admin personally, so the page leads with it.
        awaitingApproval: assessments.filter((a) => a.status === "awaiting_approval").length,
        awaitingEvaluation: assessments.filter((a) => ["submitted", "evaluating"].includes(a.status)).length,
        completed: assessments.filter((a) => a.status === "completed").length,
        // Anything a human should look at: terminated, failed, or carrying warnings.
        flagged: assessments.filter((a) => a.status === "terminated" || a.status === "failed" || a.hardWarnings > 0).length,
      },
      plans: {
        published: app.db.select().from(schema.learningPlans).all().length,
        learnersWithoutPlan: learners.filter(
          (u) => !app.db.select().from(schema.learningPlans).where(eq(schema.learningPlans.userId, u.id)).get(),
        ).length,
      },
      ai: {
        configured: Boolean(settings.activeCredentialId),
        provider: active?.provider ?? null,
        label: active?.label ?? null,
        status: active?.status ?? null,
        lastError: active?.lastError ?? null,
        usingMock: app.usingMockProvider,
        usage7d: usageByPurpose(app.db, sevenDaysAgo),
      },
      jobs: {
        queued: jobs.filter((j) => j.status === "queued").length,
        running: jobs.filter((j) => j.status === "running").length,
        failed: jobs.filter((j) => j.status === "failed").length,
      },
      recentEvents: recentEvents.map((event) => ({
        id: event.id,
        assessmentId: event.assessmentId,
        userId: event.userId,
        displayName: nameById.get(event.userId) ?? "Unknown",
        type: event.type,
        severity: event.severity,
        counted: event.counted,
        snapshotPath: event.snapshotPath,
        createdAt: event.createdAt,
      })),
    };
  });

  app.get("/api/admin/notifications", async (request) => {
    const actor = requireSuperadmin(request);
    const { limit } = parseOrThrow(
      z.object({ limit: z.coerce.number().int().min(1).max(100).default(30) }),
      request.query,
    );
    return { notifications: listNotifications(app.db, actor.id, limit), unread: unreadCount(app.db, actor.id) };
  });

  app.post("/api/admin/notifications/read", async (request) => {
    const actor = requireSuperadmin(request);
    markAllRead(app.db, actor.id);
    return { ok: true };
  });
}
