import { emailConfigFromEnv } from "../email/sender";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  mergeSettings,
  noteHref,
  searchNotes,
  settingsFrom,
  updateSettingsSchema,
  type CourseDetail,
  type LibraryResponse,
  type MeProfile,
  type NoteView,
  type Settings,
} from "../../../../shared/me";
import { isoWeekKey, mondayOf } from "../../../../shared/streak";
import { requireActiveUser } from "../../auth/guards";
import { schema, type Db } from "../../db";
import { notFound, parseOrThrow } from "../../lib/errors";
import { now } from "../../lib/ids";
import { refreshStreak } from "../streak/repo";
import { xpTotals } from "../xp/repo";
import { courseDetailFor, libraryFor } from "./library";
import { skillLevels } from "./levels";
import { verifyUrlFor } from "../../../../shared/certificates";
import { syncCertificates } from "../certificates/repo";

/**
 * v5 Me and Library (Phase 4):
 * - GET/PUT /api/v5/me/settings: a validated subset of `user_prefs.data`, merged (other keys kept)
 * - GET /api/v5/me/notes?q=: the learner's lesson notes across every lesson, newest first
 * - GET /api/v5/me/profile: skill levels, cases passed, certificates, XP by week, the weekly streak
 * - GET /api/v5/me/library, GET /api/v5/me/library/:id: the catalogue and one course page
 */

function readPrefs(db: Db, userId: string): Record<string, unknown> {
  return db.select().from(schema.userPrefs).where(eq(schema.userPrefs.userId, userId)).get()?.data ?? {};
}

const XP_WEEKS = 8;
const WEEK_MS = 7 * 86_400_000;

function xpByWeek(db: Db, userId: string, at: number): { week: string; xp: number }[] {
  const start = mondayOf(at) - (XP_WEEKS - 1) * WEEK_MS;
  const rows = db
    .select({ xp: schema.xpEvents.xp, createdAt: schema.xpEvents.createdAt })
    .from(schema.xpEvents)
    .where(and(eq(schema.xpEvents.userId, userId), gte(schema.xpEvents.createdAt, start)))
    .all();
  const weeks = Array.from({ length: XP_WEEKS }, (_, i) => ({ week: isoWeekKey(start + i * WEEK_MS), xp: 0 }));
  const index = new Map(weeks.map((w, i) => [w.week, i]));
  for (const r of rows) {
    const i = index.get(isoWeekKey(r.createdAt));
    if (i !== undefined) weeks[i].xp += r.xp;
  }
  return weeks;
}

export async function registerV5MeRoutes(app: FastifyInstance): Promise<void> {
  // `emailEnabled`: mail is set up on the server. Without it the email options are hidden.
  app.get("/api/v5/me/settings", async (request): Promise<{ settings: Settings; emailEnabled: boolean }> => {
    const user = requireActiveUser(request);
    return { settings: settingsFrom(readPrefs(app.db, user.id)), emailEnabled: emailConfigFromEnv().ok };
  });

  app.put("/api/v5/me/settings", async (request): Promise<{ settings: Settings; emailEnabled: boolean }> => {
    const user = requireActiveUser(request);
    const change = parseOrThrow(updateSettingsSchema, request.body ?? {}, "Some settings weren't valid. Check the times use the 18:30 style.");
    const data = mergeSettings(readPrefs(app.db, user.id), change);
    const at = now();
    app.db
      .insert(schema.userPrefs)
      .values({ userId: user.id, data, updatedAt: at })
      .onConflictDoUpdate({ target: schema.userPrefs.userId, set: { data, updatedAt: at } })
      .run();
    return { settings: settingsFrom(data), emailEnabled: emailConfigFromEnv().ok };
  });

  app.get("/api/v5/me/notes", async (request): Promise<{ notes: NoteView[] }> => {
    const user = requireActiveUser(request);
    const { q } = parseOrThrow(z.object({ q: z.string().max(200).optional() }), request.query ?? {});
    const rows = app.db
      .select()
      .from(schema.lessonNotes)
      .where(eq(schema.lessonNotes.userId, user.id))
      .orderBy(desc(schema.lessonNotes.updatedAt))
      .limit(500)
      .all();
    const notes = rows.map((n) => ({
      id: n.id,
      topicId: n.topicId,
      topicTitle: app.content.topicIndex.get(n.topicId)?.meta.title ?? "A lesson",
      body: n.body,
      videoId: n.videoId,
      atSec: n.atSec,
      updatedAt: n.updatedAt,
      href: noteHref(n.topicId, n.videoId, n.atSec),
    }));
    return { notes: q ? searchNotes(notes, q) : notes };
  });

  app.get("/api/v5/me/profile", async (request): Promise<MeProfile> => {
    const user = requireActiveUser(request);
    const at = now();
    const displayName = app.db.select({ n: schema.users.displayName }).from(schema.users).where(eq(schema.users.id, user.id)).get()?.n ?? "";

    const goals = app.db
      .select()
      .from(schema.learnerGoals)
      .where(and(eq(schema.learnerGoals.userId, user.id), eq(schema.learnerGoals.type, "case"), eq(schema.learnerGoals.status, "achieved")))
      .all();
    const outcomes = new Map(app.db.select().from(schema.practicalOutcomes).all().map((o) => [o.id, o]));
    const cases = goals.map((g) => {
      const o = g.caseId ? outcomes.get(g.caseId) : undefined;
      return { id: g.id, title: o?.title ?? g.outcome, statement: o?.statement ?? g.outcome, achievedAt: g.achievedAt };
    });

    // P5: issue certificates for anything newly complete, so the list below is current.
    syncCertificates(app.db, app.content, user);
    const certificates = app.db
      .select()
      .from(schema.certificates)
      .where(and(eq(schema.certificates.userId, user.id), isNull(schema.certificates.revokedAt)))
      .orderBy(desc(schema.certificates.issuedAt))
      .all()
      .map((c) => ({
        id: c.id,
        kind: c.kind,
        title: c.title || app.content.manifest.find((t) => t.id === c.trackId)?.name || c.trackId,
        holderName: c.learnerName,
        issuedAt: c.issuedAt,
        trackId: c.trackId,
        topicCount: c.topicIds.length,
        averageScore: c.averageScore,
        verifyUrl: verifyUrlFor(app.env.publicOrigin, c.id),
      }));

    let streak: MeProfile["streak"] = null;
    try {
      const { state } = refreshStreak(app.db, app.content, user.id, at);
      streak = { current: state.current, best: state.best, freezesLeft: state.freezesLeft, history: state.history };
    } catch (error) {
      request.log.warn({ err: error }, "me: streak read failed");
    }

    return {
      displayName,
      skills: skillLevels(app.db, user.id).sort((a, b) => b.level - a.level || a.name.localeCompare(b.name)),
      cases,
      certificates,
      xp: { ...xpTotals(app.db, user.id, at), weeks: xpByWeek(app.db, user.id, at) },
      streak,
    };
  });

  app.get("/api/v5/me/library", async (request): Promise<LibraryResponse> => {
    const user = requireActiveUser(request);
    return libraryFor(app.db, app.content, user);
  });

  app.get("/api/v5/me/library/:id", async (request): Promise<{ course: CourseDetail }> => {
    const user = requireActiveUser(request);
    const { id } = parseOrThrow(z.object({ id: z.string().min(1).max(200) }), request.params, "Unknown course.");
    const course = courseDetailFor(app.db, app.content, user, id);
    if (!course) throw notFound("We couldn't find that course in your library.");
    return { course };
  });
}
