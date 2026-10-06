import type { FastifyInstance, FastifyRequest } from "fastify";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

import {
  LESSON_STEPS,
  lessonHref,
  whyChip,
  type TodayHero,
  type TodayResponse,
  type TodayUpNextItem,
  type TodayWeek,
  type TodayWin,
} from "../../../../shared/today";
import { LANE_ORDER, planLaneSchema, type WeekItemView, type WeekView } from "../../../../shared/weeklyPlan";
import { WIN_KINDS, XP_LABELS, type WinKind } from "../../../../shared/xp";
import { requireActiveUser } from "../../auth/guards";
import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import { ensureWeek } from "../../plans/weekly/generate";
import { activeWeek, weekView } from "../../plans/weekly/repo";
import { listForLearner } from "../announcements/repo";
import { refreshStreak } from "../streak/repo";
import { recentXp, syncMilestoneXp, xpTotals } from "../xp/repo";

/**
 * `GET /api/v5/today`: everything the Today screen shows, in one call.
 *
 * The resume point and the review count belong to other areas (Lesson: `lesson_state`; Review:
 * the FSRS cards). They're read through those areas' own endpoints, in-process with
 * `app.inject` and the caller's cookie, so their rules (what's allowed, what's due) stay theirs.
 * A missing endpoint (404) or any failure reads as "nothing to resume" / "nothing due".
 */

const resumeSchema = z.object({
  topicId: z.string().min(1).max(120),
  title: z.string().max(300).optional().nullable(),
  step: z.enum(LESSON_STEPS).optional().nullable(),
  positionSec: z.number().min(0).optional().nullable(),
  minutesLeft: z.number().min(0).optional().nullable(),
  lane: planLaneSchema.optional().nullable(),
});
export type ResumeInput = z.infer<typeof resumeSchema>;

const reviewSchema = z.object({ dueCount: z.number().int().min(0) });

async function readSibling(app: FastifyInstance, request: FastifyRequest, url: string): Promise<{ status: number; body: unknown } | null> {
  try {
    const res = await app.inject({ method: "GET", url, headers: request.headers.cookie ? { cookie: request.headers.cookie } : {} });
    let body: unknown = null;
    try {
      body = res.body ? JSON.parse(res.body) : null;
    } catch {
      body = null;
    }
    return { status: res.statusCode, body };
  } catch {
    return null;
  }
}

async function readResume(app: FastifyInstance, request: FastifyRequest): Promise<ResumeInput | null> {
  const res = await readSibling(app, request, "/api/v5/lessons/resume");
  if (!res || res.status !== 200 || res.body === null) return null;
  // Accept the bare object or `{ resume: … }`.
  const candidate = typeof res.body === "object" && res.body !== null && "resume" in res.body ? (res.body as { resume: unknown }).resume : res.body;
  const parsed = resumeSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

async function readReview(app: FastifyInstance, request: FastifyRequest): Promise<{ dueCount: number } | null> {
  const res = await readSibling(app, request, "/api/v5/review/summary");
  if (!res) return null;
  if (res.status === 404) return { dueCount: 0 };
  if (res.status !== 200) return null;
  const parsed = reviewSchema.safeParse(res.body);
  return parsed.success ? { dueCount: parsed.data.dueCount } : null;
}

/** Pending items in lane order (Do it now first), then plan position. */
function pendingInOrder(week: WeekView | null): WeekItemView[] {
  if (!week) return [];
  const rank = new Map(LANE_ORDER.map((lane, i) => [lane, i] as const));
  return week.items
    .filter((item) => item.status === "pending")
    .sort((a, b) => (rank.get(a.lane) ?? 9) - (rank.get(b.lane) ?? 9) || a.position - b.position);
}

function hrefFor(item: WeekItemView): string {
  if (item.topicId) return lessonHref(item.topicId);
  return item.courseId ? `/learn/library/${encodeURIComponent(item.courseId)}` : "/learn/plan";
}

function trackNameFor(content: ContentStore, topicId: string | null): string | null {
  if (!topicId) return null;
  const location = content.topicIndex.get(topicId);
  if (!location) return null;
  return content.manifest.find((t) => t.id === location.trackId)?.name ?? null;
}

function contextFor(content: ContentStore, topicId: string): string | null {
  const location = content.topicIndex.get(topicId);
  if (!location) return null;
  const track = content.manifest.find((t) => t.id === location.trackId);
  const module = track?.modules.find((m) => m.id === location.moduleId);
  return `${module?.name ?? location.moduleId} · ${track?.name ?? location.trackId}`;
}

function buildWeek(week: WeekView | null): TodayWeek | null {
  if (!week || week.items.length === 0) return null;
  const rank = new Map(LANE_ORDER.map((lane, i) => [lane, i] as const));
  const ordered = [...week.items].sort((a, b) => (rank.get(a.lane) ?? 9) - (rank.get(b.lane) ?? 9) || a.position - b.position);
  // The trail shows done items first (the walked part), then what's left in the order to do it.
  const stops = [...ordered.filter((i) => i.status === "done"), ...ordered.filter((i) => i.status !== "done")].map((item) => ({
    id: item.id,
    title: item.title,
    lane: item.lane,
    minutes: item.minutes,
    done: item.status === "done",
    href: hrefFor(item),
  }));
  return {
    weekNumber: week.weekNumber,
    startDate: week.startDate,
    endDate: week.endDate,
    stops,
    doneCount: stops.filter((s) => s.done).length,
    totalCount: stops.length,
  };
}

function winsFor(db: Db, userId: string): TodayWin[] {
  const events = recentXp(db, userId, 5, WIN_KINDS);
  if (events.length === 0) return [];
  const ids = (kind: WinKind) => events.filter((e) => e.kind === kind).map((e) => e.refId);
  const goalIds = ids("case_passed");
  const certIds = ids("certificate");
  const skillIds = [...new Set(ids("skill_level_up").map((ref) => ref.split(":")[0]))];
  const goals = new Map(
    goalIds.length
      ? db.select({ id: schema.learnerGoals.id, outcome: schema.learnerGoals.outcome }).from(schema.learnerGoals).where(inArray(schema.learnerGoals.id, goalIds)).all().map((g) => [g.id, g.outcome] as const)
      : [],
  );
  const certs = new Map(
    certIds.length
      ? db
          .select({ id: schema.certificates.id, title: schema.certificates.title, trackId: schema.certificates.trackId })
          .from(schema.certificates)
          .where(inArray(schema.certificates.id, certIds))
          .all()
          .map((c) => [c.id, c.title || c.trackId] as const)
      : [],
  );
  const skills = new Map(
    skillIds.length ? db.select({ id: schema.skills.id, name: schema.skills.name }).from(schema.skills).where(inArray(schema.skills.id, skillIds)).all().map((s) => [s.id, s.name] as const) : [],
  );
  return events.map((e) => {
    const kind = e.kind as WinKind;
    if (kind === "certificate") return { kind, title: certs.get(e.refId) ?? "Certificate", label: XP_LABELS[kind], xp: e.xp, at: e.createdAt, href: `/learn/certificate/${encodeURIComponent(e.refId)}` };
    if (kind === "case_passed") return { kind, title: goals.get(e.refId) ?? "A practical case", label: XP_LABELS[kind], xp: e.xp, at: e.createdAt, href: `/goals/${encodeURIComponent(e.refId)}` };
    const [skillId, level] = e.refId.split(":");
    const name = skills.get(skillId) ?? skillId;
    return { kind, title: `${name}, now level ${level} of 5`, label: XP_LABELS[kind], xp: e.xp, at: e.createdAt, href: "/learn/me" };
  });
}

/**
 * The big Continue: an unfinished lesson at its exact step and second, or else the first thing
 * still to do in this week's plan. Exported for tests.
 */
export function heroFrom(content: ContentStore, resume: ResumeInput | null, week: WeekView | null): TodayHero | null {
  if (resume) {
    const fromWeek = week?.items.find((i) => i.topicId === resume.topicId) ?? null;
    const title = resume.title ?? content.topicIndex.get(resume.topicId)?.meta.title ?? fromWeek?.title ?? "Your lesson";
    const step = resume.step ?? null;
    return {
      kind: "resume",
      topicId: resume.topicId,
      title,
      step,
      positionSec: resume.positionSec ?? null,
      minutesLeft: resume.minutesLeft ?? null,
      lane: resume.lane ?? fromWeek?.lane ?? null,
      context: contextFor(content, resume.topicId),
      // The second only matters on Watch; other steps open at their top.
      href: lessonHref(resume.topicId, { step, t: step === null || step === "watch" ? (resume.positionSec ?? null) : null }),
    };
  }
  const first = pendingInOrder(week)[0];
  if (!first) return null;
  return {
    kind: "plan",
    topicId: first.topicId,
    title: first.title,
    step: first.topicId ? "watch" : null,
    positionSec: null,
    minutesLeft: first.minutes,
    lane: first.lane,
    context: first.context,
    href: first.topicId ? lessonHref(first.topicId, { step: "watch" }) : hrefFor(first),
  };
}

export async function registerV5TodayRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v5/today", async (request): Promise<TodayResponse> => {
    const user = requireActiveUser(request);
    const siblings = Promise.all([readResume(app, request), readReview(app, request)]);

    try {
      await ensureWeek({ db: app.db, content: app.content, ai: app.ai, log: (m) => app.log.info(m) }, user.id);
    } catch (error) {
      request.log.warn({ err: error }, "today: could not prepare the week");
    }
    const row = activeWeek(app.db, user.id);
    const week = row ? weekView(app.db, app.content, user.id, row) : null;

    syncMilestoneXp(app.db, user.id);
    const { state, goal } = refreshStreak(app.db, app.content, user.id);
    const [resume, review] = await siblings;

    const pending = pendingInOrder(week);
    const hero = heroFrom(app.content, resume, week);

    const upNext: TodayUpNextItem[] = pending
      .filter((item) => !hero || item.topicId === null || item.topicId !== hero.topicId)
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.title,
        href: hrefFor(item),
        minutes: item.minutes,
        lane: item.lane,
        why: whyChip(item.lane, item.topicId ? trackNameFor(app.content, item.topicId) : item.context),
        reason: item.reason,
      }));

    const display = app.db.select({ name: schema.users.displayName }).from(schema.users).where(eq(schema.users.id, user.id)).get()?.name ?? user.displayName;

    return {
      firstName: display.trim().split(/\s+/)[0] ?? "",
      hero,
      week: buildWeek(week),
      goal,
      streak: { current: state.current, best: state.best, freezesLeft: state.freezesLeft, history: state.history.slice(-8) },
      upNext,
      review,
      wins: winsFor(app.db, user.id),
      announcements: listForLearner(app.db, user.id),
      xp: xpTotals(app.db, user.id),
    };
  });
}
