import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { InboxResponse } from "../../../../shared/adminInbox";
import type { Course } from "../../../../shared/courses";
import type { OverviewResponse, ReportsResponse } from "../../../../shared/reports";
import { schema } from "../../db";
import { newId } from "../../lib/ids";
import { activeLearner, adminSession, as, createTestApp, onboardLearner, type Session, type TestContext } from "../../test/harness";
import { maybeQueueWeeklyReport } from "./weeklyEmail";

let ctx: TestContext;
let admin: Session;
const DAY = 86_400_000;

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
});
afterEach(async () => {
  await ctx.close();
});

async function inbox(): Promise<InboxResponse> {
  const res = await ctx.app.inject({ method: "GET", url: "/api/admin/v5/inbox", ...as(admin) });
  expect(res.statusCode).toBe(200);
  return res.json() as InboxResponse;
}

function itemIds(r: InboxResponse): string[] {
  return r.groups.flatMap((g) => g.items.map((i) => i.id));
}

function topicIds(n: number): string[] {
  return ctx.content.orderedTopicIds.slice(0, n);
}

/** A learner with a published plan and, optionally, some learning `daysAgo`. */
function seedPlan(userId: string, opts: { publishedDaysAgo: number; activityDaysAgo?: number }): void {
  const t = Date.now();
  ctx.db.insert(schema.learningPlans).values({ id: newId(), userId, version: 1, source: "admin", topicIds: topicIds(3), publishedAt: t - opts.publishedDaysAgo * DAY }).run();
  if (opts.activityDaysAgo !== undefined) {
    const at = t - opts.activityDaysAgo * DAY;
    ctx.db.insert(schema.topicProgress).values({ userId, topicId: topicIds(1)[0]!, status: "completed", attempts: 1, completedAt: at, updatedAt: at }).run();
  }
}

describe("GET /api/admin/v5/inbox", () => {
  test("is staff only", async () => {
    const learner = await activeLearner(ctx, admin, "only.learner");
    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/v5/inbox", ...as(learner.session) });
    expect(res.statusCode).toBe(403);
  });

  test("groups review requests, problems, stuck learners and setup; actions reuse existing endpoints", async () => {
    const { id: rahul } = await onboardLearner(ctx, admin, "rahul.v");
    const { id: asha } = await onboardLearner(ctx, admin, "asha.k");
    const reviewId = newId();
    ctx.db.insert(schema.reviewRequests).values({ id: reviewId, userId: rahul, source: "assessment_item", refId: "gone-item", status: "open", learnerNote: "I think this is right", createdAt: Date.now() - 1000 }).run();
    ctx.db.insert(schema.problemReports).values({ id: "p1", userId: asha, topicId: topicIds(1)[0]!, step: "watch", message: "The video doesn't play", status: "open", createdAt: Date.now() }).run();
    seedPlan(asha, { publishedDaysAgo: 20, activityDaysAgo: 9 }); // stuck
    seedPlan(rahul, { publishedDaysAgo: 2 }); // plan is new: not stuck yet

    const first = await inbox();
    const groups = first.groups.map((g) => g.id);
    expect(groups).toEqual(["reviews", "problems", "stuck", "setup"]);
    expect(first.total).toBe(first.groups.reduce((n, g) => n + g.total, 0));
    const review = first.groups.find((g) => g.id === "reviews")!.items[0]!;
    expect(review.action).toMatchObject({ kind: "full-marks", label: "Give full marks", reviewId });
    const stuck = first.groups.find((g) => g.id === "stuck")!.items;
    expect(stuck).toHaveLength(1);
    expect(stuck[0]).toMatchObject({ userId: asha, action: { kind: "nudge" }, secondary: { kind: "dismiss", key: `stuck:${asha}` } });
    expect(stuck[0]!.title).toContain("9 days");
    expect(first.groups.find((g) => g.id === "setup")!.items.map((i) => i.id)).toContain("setup:research");

    // "Give full marks" goes through the existing review decision endpoint and the item leaves.
    const decided = await ctx.app.inject({ method: "POST", url: `/api/admin/review-requests/${reviewId}/decision`, ...as(admin), payload: { decision: "override" } });
    expect(decided.statusCode).toBe(200);
    // "Mark as checked" hides the stuck learner; Undo brings them back.
    expect((await ctx.app.inject({ method: "POST", url: "/api/admin/v5/inbox/dismiss", ...as(admin), payload: { key: `stuck:${asha}` } })).statusCode).toBe(200);
    let ids = itemIds(await inbox());
    expect(ids).not.toContain(`reviews:${reviewId}`);
    expect(ids).not.toContain(`stuck:${asha}`);
    expect((await ctx.app.inject({ method: "POST", url: "/api/admin/v5/inbox/undismiss", ...as(admin), payload: { key: `stuck:${asha}` } })).statusCode).toBe(200);
    ids = itemIds(await inbox());
    expect(ids).toContain(`stuck:${asha}`);

    // A key that isn't an inbox item is refused.
    const bad = await ctx.app.inject({ method: "POST", url: "/api/admin/v5/inbox/dismiss", ...as(admin), payload: { key: "anything:else" } });
    expect(bad.statusCode).toBe(400);
  });

  test("a test waiting for approval offers Send the test; a generated course offers Fix automatically", async () => {
    const { id } = await onboardLearner(ctx, admin, "tess.t");
    const assessmentId = newId();
    ctx.db.insert(schema.assessments).values({ id: assessmentId, userId: id, status: "awaiting_approval", awaitingApprovalSince: Date.now(), createdAt: Date.now() }).run();
    const courseId = newId();
    ctx.db.insert(schema.courses).values({ id: courseId, title: "Docker basics", createdAt: Date.now(), updatedAt: Date.now(), origin: "generated" }).run();
    ctx.db.insert(schema.generatedCourses).values({ courseId, skill: "Docker", status: "needs_review", reviewReason: "Two lessons are too short.", createdAt: Date.now() }).run();

    const r = await inbox();
    const test = r.groups.find((g) => g.id === "tests")!.items[0]!;
    expect(test.action).toMatchObject({ kind: "approve-test", assessmentId });
    const course = r.groups.find((g) => g.id === "courses")!.items[0]!;
    expect(course).toMatchObject({ detail: "Two lessons are too short.", action: { kind: "fix-course", courseId }, secondary: { href: `/admin/library/${courseId}/edit` } });
  });
});

describe("people", () => {
  test("signals, the activity timeline and reminders", async () => {
    const learner = await activeLearner(ctx, admin, "nina.n");
    seedPlan(learner.id, { publishedDaysAgo: 30, activityDaysAgo: 12 });
    const signals = (await ctx.app.inject({ method: "GET", url: "/api/admin/v5/people", ...as(admin) })).json() as { people: Record<string, { stuck: boolean; idleDays: number }> };
    expect(signals.people[learner.id]).toMatchObject({ stuck: true, idleDays: 12 });

    const activity = await ctx.app.inject({ method: "GET", url: `/api/admin/v5/people/${learner.id}/activity`, ...as(admin) });
    expect(activity.statusCode).toBe(200);
    const body = activity.json() as { events: { kind: string; text: string }[]; plan: { topicCount: number; completed: number; nextTopic: string | null } };
    expect(body.plan).toMatchObject({ topicCount: 3, completed: 1 });
    expect(body.plan.nextTopic).toBeTruthy();
    expect(body.events.map((e) => e.kind)).toContain("lesson");
    expect(body.events.map((e) => e.kind)).toContain("joined");

    const nudged = await ctx.app.inject({ method: "POST", url: "/api/admin/v5/people/nudge", ...as(admin), payload: { userIds: [learner.id, admin.user.id] } });
    expect(nudged.json()).toEqual({ sent: 1 });
    const notes = ctx.db.select().from(schema.notifications).where(eq(schema.notifications.recipientId, learner.id)).all();
    expect(notes.map((n) => n.kind)).toContain("admin.nudge");

    expect((await ctx.app.inject({ method: "GET", url: "/api/admin/v5/people/nope/activity", ...as(admin) })).statusCode).toBe(404);
  });
});

describe("overview and reports", () => {
  test("tiles, departments and the report numbers come from the tables", async () => {
    const learner = await activeLearner(ctx, admin, "omar.o");
    seedPlan(learner.id, { publishedDaysAgo: 10, activityDaysAgo: 1 });
    ctx.db.update(schema.learnerProfiles).set({ departmentId: "engineering" }).where(eq(schema.learnerProfiles.userId, learner.id)).run();
    const t = Date.now();
    ctx.db.insert(schema.topicAttempts).values({ id: newId(), userId: learner.id, topicId: topicIds(1)[0]!, kind: "quiz", score: 90, passed: true, createdAt: t - 1000 }).run();
    ctx.db.insert(schema.topicAttempts).values({ id: newId(), userId: learner.id, topicId: topicIds(1)[0]!, kind: "quiz", score: 50, passed: false, createdAt: t - 2000 }).run();
    ctx.db.insert(schema.aiCalls).values({ id: newId(), provider: "anthropic-api", model: "x", purpose: "evaluation", costMicros: 1_250_000, ok: true, createdAt: t - 500 }).run();
    // Two evaluations a week apart: one skill went up.
    const a1 = newId();
    const a2 = newId();
    ctx.db.insert(schema.assessments).values({ id: a1, userId: learner.id, attemptNo: 1, status: "completed", createdAt: t - 20 * DAY }).run();
    ctx.db.insert(schema.assessments).values({ id: a2, userId: learner.id, attemptNo: 2, status: "completed", createdAt: t - 2 * DAY }).run();
    ctx.db.insert(schema.evaluations).values({ id: newId(), assessmentId: a1, model: "m", result: { skills: [{ skillId: "git", skillName: "Git", level: 1 }] }, createdAt: t - 20 * DAY }).run();
    ctx.db.insert(schema.evaluations).values({ id: newId(), assessmentId: a2, model: "m", result: { skills: [{ skillId: "git", skillName: "Git", level: 3 }], rawScore: 70 }, createdAt: t - 2 * DAY }).run();

    const overview = (await ctx.app.inject({ method: "GET", url: "/api/admin/v5/overview", ...as(admin) })).json() as OverviewResponse;
    const tile = (id: string) => overview.tiles.find((x) => x.id === id)!;
    expect(tile("active").value).toBe(1);
    expect(tile("skills").value).toBe(1);
    expect(tile("hours").value).toBeGreaterThan(0);
    expect(overview.cohorts.length).toBeGreaterThan(0);
    expect(overview.departments.find((d) => d.id === "engineering")).toMatchObject({ learners: 1, activeThisWeek: 1, averageDone: 33, stuck: 0 });

    const report = (await ctx.app.inject({ method: "GET", url: "/api/admin/v5/reports?days=7", ...as(admin) })).json() as ReportsResponse;
    expect(report.days).toHaveLength(7);
    expect(report.completion.lessonsDone).toBe(1);
    expect(report.tests.topic).toEqual({ attempts: 2, passed: 1, passRate: 50, averageScore: 70 });
    expect(report.tests.placement).toEqual({ finished: 1, averageScore: 70 });
    expect(report.skills).toMatchObject({ levelUps: 1, bySkill: [{ skill: "Git", count: 1 }] });
    expect(report.ai).toMatchObject({ dollars: 1.25, calls: 1, failed: 0 });
    expect(report.ai.perDay.reduce((a, b) => a + b, 0)).toBeCloseTo(1.25);
  });

  test("the weekly email is queued once a week into email_outbox", async () => {
    const res = await ctx.app.inject({ method: "PUT", url: "/api/admin/v5/reports/weekly-email", ...as(admin), payload: { on: true } });
    expect(res.json()).toEqual({ on: true, queued: true });
    expect(maybeQueueWeeklyReport(ctx.db, ctx.content)).toBe(false);
    expect(maybeQueueWeeklyReport(ctx.db, ctx.content, Date.now() + 8 * DAY)).toBe(true);
    const mail = ctx.db.select().from(schema.emailOutbox).all();
    expect(mail).toHaveLength(2);
    expect(mail[0]).toMatchObject({ toUserId: admin.user.id, kind: "admin.weekly_report", status: "queued", subject: "Your weekly Oyelearn report" });
    await ctx.app.inject({ method: "PUT", url: "/api/admin/v5/reports/weekly-email", ...as(admin), payload: { on: false } });
    expect(maybeQueueWeeklyReport(ctx.db, ctx.content, Date.now() + 30 * DAY)).toBe(false);
  });
});

describe("course versions", () => {
  async function makeCourse(): Promise<Course> {
    const created = await ctx.app.inject({ method: "POST", url: "/api/admin/courses", ...as(admin), payload: { title: "How we ship" } });
    const course = created.json().course as Course;
    const sec = await ctx.app.inject({ method: "POST", url: `/api/admin/courses/${course.id}/sections`, ...as(admin), payload: { title: "Basics" } });
    const sectionId = (sec.json().course as Course).sections[0]!.id;
    const topic = await ctx.app.inject({ method: "POST", url: `/api/admin/courses/sections/${sectionId}/topics`, ...as(admin), payload: { title: "Release day", body: "First draft." } });
    return topic.json().course as Course;
  }
  const snap = (courseId: string) => ctx.app.inject({ method: "POST", url: `/api/admin/v5/courses/${courseId}/versions`, ...as(admin), payload: {} });

  test("snapshots on save (no duplicates), lists, previews and restores, keeping lesson ids", async () => {
    const course = await makeCourse();
    const topic = course.sections[0]!.topics[0]!;
    expect((await snap(course.id)).json()).toEqual({ version: 1, created: true });
    expect((await snap(course.id)).json()).toEqual({ version: 1, created: false });

    await ctx.app.inject({ method: "PUT", url: `/api/admin/courses/topics/${topic.id}`, ...as(admin), payload: { title: "Release day", body: "Second draft." } });
    // A lesson added after version 1 is removed by the restore.
    await ctx.app.inject({ method: "POST", url: `/api/admin/courses/sections/${topic.sectionId}/topics`, ...as(admin), payload: { title: "Hotfixes" } });
    expect((await snap(course.id)).json()).toEqual({ version: 2, created: true });

    const list = (await ctx.app.inject({ method: "GET", url: `/api/admin/v5/courses/${course.id}/versions`, ...as(admin) })).json() as { versions: { version: number; lessons: number }[] };
    expect(list.versions.map((v) => [v.version, v.lessons])).toEqual([
      [2, 2],
      [1, 1],
    ]);
    const preview = (await ctx.app.inject({ method: "GET", url: `/api/admin/v5/courses/${course.id}/versions/1`, ...as(admin) })).json() as { course: Course };
    expect(preview.course.sections[0]!.topics[0]!.body).toBe("First draft.");

    const restored = await ctx.app.inject({ method: "POST", url: `/api/admin/v5/courses/${course.id}/versions/1/restore`, ...as(admin), payload: {} });
    expect(restored.json()).toEqual({ version: 3, removedLessons: 1 });
    const now = (await ctx.app.inject({ method: "GET", url: `/api/admin/courses/${course.id}`, ...as(admin) })).json().course as Course;
    expect(now.sections[0]!.topics.map((t) => [t.id, t.body])).toEqual([[topic.id, "First draft."]]);
    // And the restore can itself be undone by restoring version 2.
    await ctx.app.inject({ method: "POST", url: `/api/admin/v5/courses/${course.id}/versions/2/restore`, ...as(admin), payload: {} });
    const back = (await ctx.app.inject({ method: "GET", url: `/api/admin/courses/${course.id}`, ...as(admin) })).json().course as Course;
    expect(back.sections[0]!.topics.map((t) => t.body)).toEqual(["Second draft.", ""]);

    expect((await ctx.app.inject({ method: "POST", url: `/api/admin/v5/courses/${course.id}/versions/99/restore`, ...as(admin), payload: {} })).statusCode).toBe(404);
  });

  test("the library lists status, lessons and link health", async () => {
    const course = await makeCourse();
    ctx.db.insert(schema.courseSources).values({ id: newId(), courseId: course.id, url: "https://x.test/a", kind: "docs", verifiedAt: 1000, deadSince: 2000 }).run();
    ctx.db.insert(schema.courseSources).values({ id: newId(), courseId: course.id, url: "https://x.test/b", kind: "docs", verifiedAt: 5000 }).run();
    const lib = (await ctx.app.inject({ method: "GET", url: "/api/admin/v5/library", ...as(admin) })).json() as { courses: { id: string; status: string; lessons: number; sources: unknown }[] };
    expect(lib.courses.find((c) => c.id === course.id)).toMatchObject({ status: "draft", lessons: 1, sources: { total: 2, broken: 1, lastVerifiedAt: 5000 } });
  });
});
