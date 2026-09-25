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

const TREND_DAYS = 7;

/**
 * Seven daily buckets, oldest first, for the overview's sparklines.
 *
 * Bucketed on **local** midnight rather than UTC, because the admin reading the chart reads "today"
 * as their own day. `Date.setHours(0,0,0,0)` is the only expression here that handles a DST
 * transition correctly; subtracting a fixed 86,400,000 would drift by an hour twice a year and put
 * two events in the wrong column.
 *
 * A bucket with nothing in it is `0`, not absent — a sparkline with a gap reads as missing data,
 * and a quiet Sunday is not missing data.
 */
function dayStarts(reference: number): number[] {
  const midnight = new Date(reference);
  midnight.setHours(0, 0, 0, 0);
  const starts: number[] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(midnight);
    d.setDate(d.getDate() - i);
    starts.push(d.getTime());
  }
  return starts;
}

function bucket(starts: number[], timestamps: (number | null)[]): number[] {
  const counts = new Array<number>(starts.length).fill(0);
  const firstStart = starts[0];
  for (const ts of timestamps) {
    if (ts === null || ts < firstStart) continue;
    // Walk back from the newest bucket: the rows that matter are usually recent.
    for (let i = starts.length - 1; i >= 0; i -= 1) {
      if (ts >= starts[i]) {
        counts[i] += 1;
        break;
      }
    }
  }
  return counts;
}

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

    /* The sparkline series. Every number below is counted from a real timestamp column — there is
       no smoothing, no interpolation and no synthetic series, because a made-up trend on an admin
       dashboard is worse than no trend at all. */
    const starts = dayStarts(now());
    const windowStart = starts[0];
    const recentCalls = app.db
      .select({ createdAt: schema.aiCalls.createdAt, ok: schema.aiCalls.ok })
      .from(schema.aiCalls)
      .where(gte(schema.aiCalls.createdAt, windowStart))
      .all();
    const eventsInWindow = app.db
      .select({ createdAt: schema.integrityEvents.createdAt })
      .from(schema.integrityEvents)
      .where(gte(schema.integrityEvents.createdAt, windowStart))
      .all();

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
      trend7d: {
        /** Local midnights, oldest first. The client formats them; the server does not guess a locale. */
        days: starts,
        onboarded: bucket(starts, learners.map((u) => u.createdAt)),
        submitted: bucket(starts, assessments.map((a) => a.submittedAt)),
        events: bucket(starts, eventsInWindow.map((e) => e.createdAt)),
        aiCalls: bucket(starts, recentCalls.map((c) => c.createdAt)),
        aiFailures: bucket(starts, recentCalls.filter((c) => !c.ok).map((c) => c.createdAt)),
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
