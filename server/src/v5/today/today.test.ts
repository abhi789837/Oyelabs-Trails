import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { isoWeekKey } from "../../../../shared/streak";
import type { AdminAnnouncementView, AnnouncementView, TodayResponse } from "../../../../shared/today";
import type { MyXpResponse } from "../../../../shared/xp";
import type { WeekResponse } from "../../../../shared/weeklyPlan";
import { schema } from "../../db";
import { newId } from "../../lib/ids";
import { activeWeek, weekView } from "../../plans/weekly/repo";
import { recordAttempt } from "../../progress/repo";
import { activeLearner, adminSession, as, createTestApp, publishPlanFor, type Session, type TestContext } from "../../test/harness";
import { refreshStreak } from "../streak/repo";
import { awardXp, levelUpsFrom, syncMilestoneXp } from "../xp/repo";
import { heroFrom } from "./routes";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
});

afterEach(async () => {
  await ctx.close();
});

async function today(session = learner.session): Promise<TodayResponse> {
  const res = await ctx.app.inject({ method: "GET", url: "/api/v5/today", ...as(session) });
  expect(res.statusCode, res.body).toBe(200);
  return res.json() as TodayResponse;
}

function setPref(key: string, value: unknown) {
  const data = { [key]: value };
  ctx.db
    .insert(schema.userPrefs)
    .values({ userId: learner.id, data, updatedAt: Date.now() })
    .onConflictDoUpdate({ target: schema.userPrefs.userId, set: { data, updatedAt: Date.now() } })
    .run();
}

describe("GET /api/v5/today", () => {
  test("needs a signed-in learner", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/api/v5/today" });
    expect(res.statusCode).toBe(401);
  });

  test("a learner with no plan gets an empty but complete page", async () => {
    const body = await today();
    expect(body.hero).toBeNull();
    expect(body.week).toBeNull();
    expect(body.upNext).toEqual([]);
    expect(body.streak).toMatchObject({ current: 0, freezesLeft: 1 });
    expect(body.xp).toEqual({ total: 0, thisWeek: 0 });
    expect(body.firstName).toBe("Learner");
    // No Review endpoint yet (or nothing due) reads as 0, never an error.
    expect(body.review === null || typeof body.review.dueCount === "number").toBe(true);
  });

  test("a learner with a plan: hero, trail, ring, up next with why chips — fast", async () => {
    await publishPlanFor(ctx, admin, learner.id, ctx.content.orderedTopicIds.slice(0, 30));
    await today(); // first read builds the week
    const started = performance.now();
    const body = await today();
    const ms = performance.now() - started;

    expect(body.hero?.kind).toBe("plan");
    expect(body.hero?.href).toMatch(/^\/learn\/lesson\/[^?]+\?step=watch$/);
    expect(body.week?.stops.length).toBeGreaterThan(0);
    expect(body.week?.doneCount).toBe(0);
    expect(body.goal.goalMinutes).toBeGreaterThan(0);
    expect(body.goal.week).toBe(isoWeekKey(Date.now()));
    expect(body.upNext.length).toBeGreaterThan(0);
    expect(body.upNext.length).toBeLessThanOrEqual(3);
    for (const item of body.upNext) {
      expect(item.why).toMatch(/^(Do it now|Must know|Good to know|Extra)( for .+)?$/);
      expect(item.href.startsWith("/learn/")).toBe(true);
      expect(item.id).not.toBe(body.week?.stops.find((s) => s.href === body.hero?.href)?.id);
    }
    // The hero's lesson is not repeated in Up next.
    expect(body.upNext.some((i) => body.hero?.topicId && i.href.includes(encodeURIComponent(body.hero.topicId)))).toBe(false);
    expect(ms).toBeLessThan(400); // budget is 100 ms in production; the test machine and inject add slack
  });

  test("completing work moves the trail, the ring and the streak", async () => {
    await publishPlanFor(ctx, admin, learner.id, ctx.content.orderedTopicIds.slice(0, 30));
    setPref("weeklyGoalHours", 1);
    const week = (await ctx.app.inject({ method: "GET", url: "/api/me/week", ...as(learner.session) })).json() as WeekResponse;
    const topicIds = week.week!.items.map((i) => i.topicId).filter((id): id is string => id !== null).slice(0, 3);
    for (const topicId of topicIds) recordAttempt(ctx.db, { userId: learner.id, topicId, kind: "quiz", score: 100, passed: true });

    const body = await today();
    expect(body.week?.doneCount).toBe(topicIds.length);
    expect(body.week?.stops.slice(0, topicIds.length).every((s) => s.done)).toBe(true);
    expect(body.goal.goalMinutes).toBe(60);
    expect(body.goal.steps).toBe(topicIds.length);
    expect(body.goal.loggedMinutes).toBeGreaterThan(0);
    const met = body.goal.loggedMinutes >= 60;
    expect(body.goal.met).toBe(met);
    expect(body.streak.current).toBe(met ? 1 : 0);
    // Each passed topic test is worth 50 XP, once.
    expect(body.xp.total).toBe(50 * topicIds.length);

    const stored = ctx.db.select().from(schema.weeklyStreaks).where(eq(schema.weeklyStreaks.userId, learner.id)).get();
    expect(stored?.current).toBe(body.streak.current);
  });

  test("no goal at all: 3 steps meet the week", async () => {
    ctx.db.delete(schema.learnerPriorities).where(eq(schema.learnerPriorities.userId, learner.id)).run();
    for (const step of ["watch", "read", "do"]) awardXp(ctx.db, learner.id, "step_completed", `t1:${step}`);
    const read = refreshStreak(ctx.db, ctx.content, learner.id);
    expect(read.goal.goalMinutes).toBeNull();
    expect(read.goal.steps).toBe(3);
    expect(read.goal.met).toBe(true);
    expect(read.state.current).toBe(1);
  });

  test("recent wins come from real milestones only", async () => {
    const goalId = newId();
    const at = Date.now();
    ctx.db
      .insert(schema.learnerGoals)
      .values({
        id: goalId,
        userId: learner.id,
        type: "case",
        originalText: "Ship a REST API",
        outcome: "Can ship a small REST API",
        skillIds: [],
        targetLevel: 3,
        slider: 50,
        status: "achieved",
        achievedAt: at,
        createdAt: at,
        updatedAt: at,
      })
      .run();
    ctx.db
      .insert(schema.certificates)
      .values({ id: "OYL-TE-0001-0001", userId: learner.id, trackId: "backend", learnerName: "Learner One", topicIds: [], issuedAt: at + 1, kind: "track", refId: "backend", title: "Backend" })
      .run();
    awardXp(ctx.db, learner.id, "step_completed", "t1:watch");

    const body = await today();
    expect(body.wins.map((w) => w.kind).sort()).toEqual(["case_passed", "certificate"]);
    expect(body.wins.find((w) => w.kind === "certificate")).toMatchObject({ title: "Backend", label: "Certificate earned", xp: 200, href: "/learn/certificate/OYL-TE-0001-0001" });
    expect(body.wins.find((w) => w.kind === "case_passed")).toMatchObject({ title: "Can ship a small REST API", xp: 150 });
    expect(body.xp.total).toBe(150 + 200 + 10);
  });

  test("the hero resumes at the exact step and second", async () => {
    await publishPlanFor(ctx, admin, learner.id, ctx.content.orderedTopicIds.slice(0, 10));
    await today();
    const row = activeWeek(ctx.db, learner.id)!;
    const week = weekView(ctx.db, ctx.content, learner.id, row);
    const topicId = ctx.content.orderedTopicIds[0];

    const watching = heroFrom(ctx.content, { topicId, step: "watch", positionSec: 312.4, minutesLeft: 9, lane: null }, week);
    expect(watching).toMatchObject({ kind: "resume", topicId, step: "watch", minutesLeft: 9 });
    expect(watching?.href).toBe(`/learn/lesson/${topicId}?step=watch&t=312`);
    expect(watching?.title).toBe(ctx.content.topicIndex.get(topicId)?.meta.title);

    const doing = heroFrom(ctx.content, { topicId, step: "do", positionSec: 312, minutesLeft: null, lane: "must_know" }, week);
    expect(doing?.href).toBe(`/learn/lesson/${topicId}?step=do`);
    expect(doing?.lane).toBe("must_know");

    expect(heroFrom(ctx.content, null, null)).toBeNull();
    expect(heroFrom(ctx.content, null, week)?.kind).toBe("plan");
  });
});

describe("XP", () => {
  test("awards are idempotent and the totals add up", async () => {
    expect(awardXp(ctx.db, learner.id, "lesson_completed", "js-closures")).toEqual({ awarded: true, xp: 30 });
    expect(awardXp(ctx.db, learner.id, "lesson_completed", "js-closures")).toEqual({ awarded: false, xp: 30 });
    awardXp(ctx.db, learner.id, "review_session", "2020-01-01", { at: Date.UTC(2020, 0, 1) });

    const res = await ctx.app.inject({ method: "GET", url: "/api/v5/me/xp", ...as(learner.session) });
    expect(res.statusCode).toBe(200);
    const body = res.json() as MyXpResponse;
    expect(body.total).toBe(50);
    expect(body.thisWeek).toBe(30);
    expect(body.recent[0]).toMatchObject({ kind: "lesson_completed", xp: 30, label: "Lesson finished" });
  });

  test("a passed topic test is awarded by the attempt itself, a failed one isn't", () => {
    const [a, b] = ctx.content.orderedTopicIds;
    recordAttempt(ctx.db, { userId: learner.id, topicId: a, kind: "quiz", score: 40, passed: false });
    recordAttempt(ctx.db, { userId: learner.id, topicId: b, kind: "quiz", score: 90, passed: true });
    recordAttempt(ctx.db, { userId: learner.id, topicId: b, kind: "quiz", score: 100, passed: true });
    const rows = ctx.db.select().from(schema.xpEvents).where(and(eq(schema.xpEvents.userId, learner.id), eq(schema.xpEvents.kind, "topic_test_passed"))).all();
    expect(rows.map((r) => r.refId)).toEqual([b]);
    expect(syncMilestoneXp(ctx.db, learner.id)).toBe(0);
  });

  test("skill level ups: the first test is the starting point, each new level counts once", () => {
    const evals = [
      { createdAt: 1, result: { format: "v4", skills: [{ skillId: "sql", level: 2 }, { skillId: "http", level: 1 }] } },
      { createdAt: 2, result: { format: "v4", mastery: [{ skillId: "sql", level: 4, source: "measured" }, { skillId: "http", level: 3, source: "inferred" }] } },
      { createdAt: 3, result: { format: "v4", mastery: [{ skillId: "sql", level: 3, source: "measured" }] } },
    ];
    expect(levelUpsFrom(evals).map((c) => c.refId)).toEqual(["sql:3", "sql:4"]);
    expect(levelUpsFrom([])).toEqual([]);
  });

  test("needs sign-in", async () => {
    expect((await ctx.app.inject({ method: "GET", url: "/api/v5/me/xp" })).statusCode).toBe(401);
  });
});

describe("announcements", () => {
  async function create(payload: Record<string, unknown>, session = admin) {
    return ctx.app.inject({ method: "POST", url: "/api/admin/announcements", ...as(session), payload });
  }
  async function mine(): Promise<AnnouncementView[]> {
    const res = await ctx.app.inject({ method: "GET", url: "/api/v5/announcements", ...as(learner.session) });
    expect(res.statusCode).toBe(200);
    return res.json().announcements;
  }

  test("learners see what's live and meant for them, pinned first", async () => {
    const dept = ctx.db.select({ d: schema.learnerProfiles.departmentId }).from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, learner.id)).get()?.d;
    expect((await create({ title: "Everyone", body: "Hello all", audience: { all: true }, pinned: false })).statusCode).toBe(201);
    expect((await create({ title: "Just you", body: "Hi", audience: { userIds: [learner.id] } })).statusCode).toBe(201);
    expect((await create({ title: "Other team", body: "Not you", audience: { departmentIds: ["nobody-dept"] } })).statusCode).toBe(201);
    expect((await create({ title: "Old news", body: "Gone", audience: { all: true }, expiresAt: Date.now() - 1000 })).statusCode).toBe(201);
    if (dept) expect((await create({ title: "Your team", body: "Team", audience: { departmentIds: [dept] } })).statusCode).toBe(201);

    const list = await mine();
    const titles = list.map((a) => a.title);
    expect(titles).toContain("Everyone");
    expect(titles).toContain("Just you");
    expect(titles).not.toContain("Other team");
    expect(titles).not.toContain("Old news");
    if (dept) expect(titles).toContain("Your team");
    expect(list[list.length - 1].title).toBe("Everyone"); // the only unpinned one sorts last
    expect(list[0].author).toBeTruthy();

    expect((await today()).announcements.map((a) => a.title)).toEqual(titles);
  });

  test("admin CRUD with validation and audit", async () => {
    const bad = await create({ title: "", body: "x", audience: {} });
    expect(bad.statusCode).toBe(400);

    const created = (await create({ title: "Lunch and learn", body: "Friday at 1", audience: { all: true } })).json().announcement as AdminAnnouncementView;
    expect(created).toMatchObject({ title: "Lunch and learn", pinned: true, expired: false, audience: { all: true } });

    const list = await ctx.app.inject({ method: "GET", url: "/api/admin/announcements", ...as(admin) });
    expect(list.json().announcements).toHaveLength(1);

    const updated = await ctx.app.inject({ method: "PUT", url: `/api/admin/announcements/${created.id}`, ...as(admin), payload: { title: "Lunch and learn, moved", pinned: false } });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().announcement).toMatchObject({ title: "Lunch and learn, moved", pinned: false, body: "Friday at 1" });
    expect((await ctx.app.inject({ method: "PUT", url: `/api/admin/announcements/${created.id}`, ...as(admin), payload: {} })).statusCode).toBe(400);
    expect((await ctx.app.inject({ method: "PUT", url: "/api/admin/announcements/nope", ...as(admin), payload: { pinned: true } })).statusCode).toBe(404);

    const removed = await ctx.app.inject({ method: "DELETE", url: `/api/admin/announcements/${created.id}`, ...as(admin) });
    expect(removed.statusCode).toBe(200);
    expect((await ctx.app.inject({ method: "DELETE", url: `/api/admin/announcements/${created.id}`, ...as(admin) })).statusCode).toBe(404);

    const audit = ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.targetId, created.id)).all().map((r) => r.action).sort();
    expect(audit).toEqual(["announcement.create", "announcement.delete", "announcement.update"]);
  });

  test("learners can't manage announcements", async () => {
    expect((await create({ title: "x", body: "y", audience: { all: true } }, learner.session)).statusCode).toBe(403);
    expect((await ctx.app.inject({ method: "GET", url: "/api/admin/announcements", ...as(learner.session) })).statusCode).toBe(403);
    expect((await ctx.app.inject({ method: "DELETE", url: "/api/admin/announcements/x", ...as(learner.session) })).statusCode).toBe(403);
  });
});
