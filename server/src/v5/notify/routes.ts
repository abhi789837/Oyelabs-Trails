import { and, asc, eq, gt } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { LeaderboardResponse, MotivationAdminSettings, MotivationPrefs, MotivationSummary } from "../../../../shared/motivation";
import { requireActiveUser, requireStaff, requireSuperadmin } from "../../auth/guards";
import { schema } from "../../db";
import { writeAudit } from "../../lib/audit";
import { parseOrThrow } from "../../lib/errors";
import { unreadCount } from "../../lib/notify";
import { emailConfigFromEnv, outboxCounts } from "../email/sender";
import { leaderboardFor, leaderboardsOn, setLeaderboards } from "../leaderboard/repo";
import { defaultGoalMinutesFor } from "../streak/repo";
import { xpTotals } from "../xp/repo";
import { applyPrefsPatch, motivationPrefsFrom, motivationPrefsPatchSchema, readPrefs } from "./prefs";
import { motivationTick, type TickResult } from "./scheduler";

/**
 * v5 Phase 6 routes.
 * - GET /api/v5/motivation?since=ms: the learner shell's host (XP, new awards, unread count, prefs,
 *   whether the team board is on). Cheap: one aggregate, one indexed range read, one count.
 * - PUT /api/v5/motivation/prefs: weeklyGoalHours, leaderboardOptIn, welcomeDone, timeZone.
 * - GET /api/v5/leaderboard: the opt-in team board (or `{enabled: false}`).
 * - GET /api/admin/motivation (staff): board on/off and email delivery state.
 * - PUT /api/admin/motivation/leaderboards {on} (super admin, audited).
 * - POST /api/admin/motivation/run {recaps?} (super admin): run the tick now.
 */

/** New awards are looked for at most this far back, whatever `since` says. */
const EVENTS_WINDOW_MS = 15 * 60 * 1000;

export async function registerV5MotivationRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v5/motivation", async (request): Promise<MotivationSummary> => {
    const user = requireActiveUser(request);
    const { since } = parseOrThrow(z.object({ since: z.coerce.number().int().nonnegative().optional() }), request.query ?? {});
    const at = Date.now();
    const events =
      since === undefined
        ? []
        : app.db
            .select({ kind: schema.xpEvents.kind, refId: schema.xpEvents.refId, xp: schema.xpEvents.xp, createdAt: schema.xpEvents.createdAt })
            .from(schema.xpEvents)
            .where(and(eq(schema.xpEvents.userId, user.id), gt(schema.xpEvents.createdAt, Math.max(since, at - EVENTS_WINDOW_MS))))
            .orderBy(asc(schema.xpEvents.createdAt))
            .limit(20)
            .all();
    return {
      serverTime: at,
      xp: xpTotals(app.db, user.id, at),
      events,
      unread: unreadCount(app.db, user.id),
      prefs: motivationPrefsFrom(readPrefs(app.db, user.id)),
      leaderboards: leaderboardsOn(app.db),
      defaultGoalMinutes: defaultGoalMinutesFor(app.db, user.id),
    };
  });

  app.put("/api/v5/motivation/prefs", async (request): Promise<{ prefs: MotivationPrefs }> => {
    const user = requireActiveUser(request);
    const patch = parseOrThrow(motivationPrefsPatchSchema, request.body ?? {}, "That setting wasn't valid. Pick a weekly goal between half an hour and 40 hours.");
    return { prefs: applyPrefsPatch(app.db, user.id, patch) };
  });

  app.get("/api/v5/leaderboard", async (request): Promise<LeaderboardResponse> => {
    const user = requireActiveUser(request);
    return leaderboardFor(app.db, user.id);
  });

  app.get("/api/admin/motivation", async (request): Promise<MotivationAdminSettings> => {
    requireStaff(request);
    const config = emailConfigFromEnv();
    const counts = outboxCounts(app.db, Date.now() - 30 * 86_400_000);
    return { leaderboards: leaderboardsOn(app.db), email: { configured: config.ok, reason: config.ok ? null : config.reason, ...counts } };
  });

  app.put("/api/admin/motivation/leaderboards", async (request): Promise<{ leaderboards: boolean }> => {
    const actor = requireSuperadmin(request);
    const { on } = parseOrThrow(z.object({ on: z.boolean() }).strict(), request.body ?? {});
    const before = leaderboardsOn(app.db);
    setLeaderboards(app.db, on);
    if (before !== on) writeAudit(app.db, { actorId: actor.id, action: "motivation.leaderboards", targetType: "app_meta", targetId: "motivation.leaderboards", details: { on } });
    return { leaderboards: on };
  });

  app.post("/api/admin/motivation/run", async (request): Promise<TickResult> => {
    const actor = requireSuperadmin(request);
    const { recaps } = parseOrThrow(z.object({ recaps: z.boolean().optional() }).strict(), request.body ?? {});
    const result = await motivationTick({ db: app.db, content: app.content, appUrl: app.env.publicOrigin, forceRecaps: recaps === true });
    writeAudit(app.db, { actorId: actor.id, action: "motivation.run", details: { forceRecaps: recaps === true, ...result } });
    return result;
  });
}
