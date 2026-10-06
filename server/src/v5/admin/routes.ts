import { eq, inArray } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { INBOX_GROUPS } from "../../../../shared/adminInbox";
import { parseRange } from "../../../../shared/reports";
import { requireStaff, staffOnly } from "../../auth/guards";
import { schema } from "../../db";
import { writeAudit } from "../../lib/audit";
import { badRequest, notFound, parseOrThrow } from "../../lib/errors";
import { now } from "../../lib/ids";
import { notify } from "../../lib/notify";
import { learnerSignals } from "./activity";
import { buildInbox, readDismissed, writeDismissed } from "./inbox";
import { buildLibrary } from "./library";
import { buildOverview, buildReport } from "./metrics";
import { personActivity } from "./people";
import { getVersion, listVersions, restoreVersion, snapshotCourse } from "./versions";
import { maybeQueueWeeklyReport, setWeeklyEmail } from "./weeklyEmail";

const courseParams = z.object({ courseId: z.string().min(1).max(64) });
const versionParams = courseParams.extend({ version: z.coerce.number().int().min(1).max(1_000_000) });
const dismissKeySchema = z
  .string()
  .min(3)
  .max(140)
  .refine((key) => INBOX_GROUPS.some((g) => key.startsWith(`${g}:`)), "That isn't an inbox item.");

/**
 * v5 Phase 7: the admin console's own endpoints, all under `/api/admin/v5`. Everything else the
 * v5 admin screens do goes through the endpoints the old screens already use (approve a test,
 * decide a review, fix a course, save a lesson), so there is one rule for each action.
 */
export async function registerV5AdminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  // -------------------------------------------------------------------------
  // Inbox
  // -------------------------------------------------------------------------

  app.get("/api/admin/v5/inbox", async (request) => {
    const actor = requireStaff(request);
    maybeQueueWeeklyReport(app.db, app.content);
    return buildInbox({ db: app.db, content: app.content, env: app.env, usingMockProvider: app.usingMockProvider }, actor);
  });

  /** "Mark as checked". Undo sends the same key to `/undismiss`. */
  app.post("/api/admin/v5/inbox/dismiss", async (request) => {
    const actor = requireStaff(request);
    const { key } = parseOrThrow(z.object({ key: dismissKeySchema }), request.body);
    const at = now();
    writeDismissed(app.db, { ...readDismissed(app.db), [key]: at }, at);
    writeAudit(app.db, { actorId: actor.id, action: "inbox.dismissed", targetType: "inbox", targetId: key });
    return { ok: true };
  });

  app.post("/api/admin/v5/inbox/undismiss", async (request) => {
    const actor = requireStaff(request);
    const { key } = parseOrThrow(z.object({ key: dismissKeySchema }), request.body);
    const map = readDismissed(app.db);
    delete map[key];
    writeDismissed(app.db, map, now());
    writeAudit(app.db, { actorId: actor.id, action: "inbox.undismissed", targetType: "inbox", targetId: key });
    return { ok: true };
  });

  // -------------------------------------------------------------------------
  // People
  // -------------------------------------------------------------------------

  /** Per-learner signals the People table adds to `/api/admin/users`: last activity and stuck. */
  app.get("/api/admin/v5/people", async () => {
    const people: Record<string, { lastActivityAt: number | null; stuck: boolean; idleDays: number | null }> = {};
    for (const s of learnerSignals(app.db, now())) people[s.userId] = { lastActivityAt: s.lastActivityAt, stuck: s.stuck, idleDays: s.idleDays };
    return { people };
  });

  app.get("/api/admin/v5/people/:userId/activity", async (request) => {
    const { userId } = parseOrThrow(z.object({ userId: z.string().min(1).max(64) }), request.params);
    const activity = personActivity(app.db, app.content, userId);
    if (!activity) throw notFound("We couldn't find that person.");
    return activity;
  });

  /** A friendly reminder in their notifications. Learners only; staff are skipped. */
  app.post("/api/admin/v5/people/nudge", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request) => {
    const actor = requireStaff(request);
    const { userIds } = parseOrThrow(z.object({ userIds: z.array(z.string().min(1).max(64)).min(1).max(200) }), request.body);
    const targets = app.db
      .select({ id: schema.users.id, role: schema.users.role, status: schema.users.status })
      .from(schema.users)
      .where(inArray(schema.users.id, userIds))
      .all()
      .filter((u) => u.role === "learner" && u.status === "active");
    if (targets.length === 0) throw badRequest("Reminders go to active learners only.");
    for (const t of targets) {
      notify(app.db, {
        recipientId: t.id,
        kind: "admin.nudge",
        title: "Your plan is waiting for you",
        body: "Pick up where you left off. Even 15 minutes this week helps.",
        link: "/learn",
      });
      writeAudit(app.db, { actorId: actor.id, action: "learner.nudged", targetType: "user", targetId: t.id });
    }
    return { sent: targets.length };
  });

  // -------------------------------------------------------------------------
  // Overview and reports
  // -------------------------------------------------------------------------

  app.get("/api/admin/v5/overview", async () => buildOverview(app.db, app.content));

  app.get("/api/admin/v5/reports", async (request) => {
    const query = parseOrThrow(z.object({ from: z.string().max(10).optional(), to: z.string().max(10).optional(), days: z.string().max(4).optional() }), request.query);
    maybeQueueWeeklyReport(app.db, app.content);
    return buildReport(app.db, app.content, parseRange(query, now()));
  });

  app.put("/api/admin/v5/reports/weekly-email", async (request) => {
    const actor = requireStaff(request);
    const { on } = parseOrThrow(z.object({ on: z.boolean() }), request.body);
    setWeeklyEmail(app.db, on, actor.id);
    writeAudit(app.db, { actorId: actor.id, action: "reports.weekly_email", details: { on } });
    const queued = on ? maybeQueueWeeklyReport(app.db, app.content) : false;
    return { on, queued };
  });

  // -------------------------------------------------------------------------
  // Library and version history
  // -------------------------------------------------------------------------

  app.get("/api/admin/v5/library", async () => buildLibrary(app.db));

  app.get("/api/admin/v5/courses/:courseId/versions", async (request) => {
    const { courseId } = parseOrThrow(courseParams, request.params);
    const exists = app.db.select({ id: schema.courses.id }).from(schema.courses).where(eq(schema.courses.id, courseId)).get();
    if (!exists) throw notFound("We couldn't find that course.");
    return { versions: listVersions(app.db, courseId) };
  });

  app.get("/api/admin/v5/courses/:courseId/versions/:version", async (request) => {
    const { courseId, version } = parseOrThrow(versionParams, request.params);
    const course = getVersion(app.db, courseId, version);
    if (!course) throw notFound("That version isn't there any more.");
    return { version, course };
  });

  /** Called by the editor after every save. Returns the latest version (new or unchanged). */
  app.post("/api/admin/v5/courses/:courseId/versions", async (request) => {
    const actor = requireStaff(request);
    const { courseId } = parseOrThrow(courseParams, request.params);
    const { note } = parseOrThrow(z.object({ note: z.string().trim().max(200).optional() }), request.body ?? {});
    const result = snapshotCourse(app.db, courseId, actor.id, note ?? null);
    if (!result) throw notFound("We couldn't find that course.");
    return result;
  });

  app.post("/api/admin/v5/courses/:courseId/versions/:version/restore", async (request) => {
    const actor = requireStaff(request);
    const { courseId, version } = parseOrThrow(versionParams, request.params);
    const result = restoreVersion(app.db, courseId, version, actor.id);
    if (!result) throw notFound("That version isn't there any more.");
    writeAudit(app.db, { actorId: actor.id, action: "course.version_restored", targetType: "course", targetId: courseId, details: { from: version, to: result.version } });
    return result;
  });
}
