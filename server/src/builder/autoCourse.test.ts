import { and, eq } from "drizzle-orm";
import { describe, expect, test, vi } from "vitest";

import type { SkillResult, V4Result } from "../../../shared/assessmentV4";
import { coursesAddedMessage, plainReviewReason, setupNeededMessage, type LearningPathView } from "../../../shared/builder";
import type { GoalInput } from "../../../shared/goals";
import type { AiService } from "../ai/service";
import { schema } from "../db";
import { JobWorker } from "../jobs/worker";
import { activeLearner, adminSession, as, createTestApp, type TestContext } from "../test/harness";
import { courseGenerateHandler, nameSimilarity, setGlobalAutoPublish, type ResearchClientsResult } from "./autoCourse";
import type { SearchClient, VideoClient } from "./providers";
import { runBuilder } from "./run";

/**
 * v4.4 Phase 5, end to end: a skill no catalog course covers gets a course made, checked and put in
 * the shared library without an admin's click; a failed one is held with a plain reason and fixed
 * automatically; nothing is made twice; and with the web search unset the work waits and finishes
 * by itself once the settings are saved.
 *
 * The AI, the search provider, YouTube and the link fetcher are stubbed (as in pipeline.test.ts);
 * the database, the job queue, the routes and the path builder are the real ones.
 */

const URLS = [
  "https://google.github.io/eng-practices/review/reviewer/",
  "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews",
  "https://martinfowler.com/bliki/CodeReview.html",
];
const COURSE_TITLE = "Code review that helps the team";
const LESSON = "Reviewing a pull request well";

const search: SearchClient = {
  id: "tavily",
  search: vi.fn(async (query: string) => URLS.map((url, i) => ({ url, title: `Result ${i} for ${query}`, snippet: "A page that exists.", publishedAt: "2025-02-01T00:00:00.000Z" }))),
};
const video: VideoClient = {
  search: vi.fn(async () => [
    { videoId: "dQw4w9WgXcQ", title: "How to review code", channel: "A real channel", durationSeconds: 900, viewCount: 120_000, subscriberCount: 250_000, embeddable: true, publishedAt: new Date().toISOString() },
  ]),
  lookup: vi.fn(async () => null),
};
const fetcher = { fetchUrl: vi.fn(async () => ({ status: 200, headers: new Headers({ "content-type": "text/html" }), text: async () => "<html><head><title>Real page</title></head><body>content</body></html>" })) };

const connected = (): ResearchClientsResult => ({ ok: true, search, video });
const notConnected = (): ResearchClientsResult => ({ ok: false, reason: "No research provider is set up." });

/** A model stub for the course calls; anything else goes to the test app's mock. `reviews` are used in turn. */
function aiStub(ctx: TestContext, reviews: { score: number; weak?: string[] }[] = [{ score: 5 }]) {
  let reviewCall = 0;
  const calls: string[] = [];
  const generateJson = vi.fn(async (request: { purpose: string; user: string }) => {
    calls.push(request.purpose);
    const usage = { input: 100, output: 50 };
    const reply = (data: unknown) => ({ data, usage, latencyMs: 1, model: "stub" });
    if (request.purpose === "course_match") return reply({ courseId: null, confidence: 0, reason: "" });
    if (request.purpose === "course_plan") {
      return reply({
        title: COURSE_TITLE,
        summary: "Reading a change, leaving useful comments and approving with confidence.",
        sections: [
          {
            title: "Reviewing",
            summary: "What to look for and how to say it.",
            topics: [{ title: LESSON, objective: "Review a small pull request and leave clear comments.", searchQueries: ["how to review a pull request"], videoQuery: "code review", estMinutes: 20 }],
          },
        ],
      });
    }
    if (request.purpose === "course_write") {
      const listed = URLS.filter((url) => request.user.includes(url)).slice(0, 3);
      return reply({
        summary: "x".repeat(200),
        keyConcepts: ["small changes", "clear comments", "approve with confidence"],
        references: listed.map((url) => ({ url, label: "A source", why: "It explains how good reviews work." })),
        videoId: "dQw4w9WgXcQ",
        practice: { task: "Review a teammate's small pull request.", acceptanceCriteria: ["Every comment says what and why", "You approve or ask for changes"], hint: "Start with the description." },
        test: {
          questions: Array.from({ length: 10 }, (_, i) => ({
            id: `q${i}`,
            kind: "mcq" as const,
            prompt: `A question about code review number ${i}`,
            options: ["Ask why", "Approve", "Ignore", "Rewrite it"],
            correctIndices: [0],
            explanation: "Asking why keeps the review useful.",
            objective: "Leave clear comments.",
          })),
          passScore: 80,
        },
      });
    }
    if (request.purpose === "course_review") {
      const next = reviews[Math.min(reviewCall, reviews.length - 1)];
      reviewCall += 1;
      const s = next.score;
      return reply({ accuracy: s, depth: s, gapCoverage: s, linkQuality: s, testQuality: s, noFiller: s, notes: "", weakTopics: next.weak ?? [] });
    }
    return ctx.ai.generateJson(request as Parameters<AiService["generateJson"]>[0]);
  });
  return { ai: { generateJson, isConfigured: () => true } as unknown as AiService, calls };
}

const goal = (skillIds: string[], slider = 5): GoalInput => ({ type: "text", originalText: "Review code", outcome: "Can review code at work.", skillIds, targetLevel: 3, caseId: null, slider });

async function learner(ctx: TestContext, admin: Awaited<ReturnType<typeof adminSession>>, name: string, skillIds = ["eng-code-review"]) {
  const created = await activeLearner(ctx, admin, `auto.${name.toLowerCase()}.${Math.random().toString(36).slice(2, 7)}`);
  ctx.db.update(schema.users).set({ displayName: name }).where(eq(schema.users.id, created.id)).run();
  const res = await ctx.app.inject({
    method: "PUT",
    url: `/api/admin/users/${created.id}/setup`,
    ...as(admin),
    payload: {
      departmentId: "engineering", trackId: "frontend", stackIds: ["stack-react"], experienceBand: "1-2", level: 2,
      priorities: [], skip: [], hoursPerWeek: 15, goals: [goal(skillIds)],
      advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false, personalisation: "balanced", autoAddSuggestions: false },
      assign: false,
    },
  });
  expect(res.statusCode).toBe(200);
  return created;
}

const skill = (skillId: string, level: number): SkillResult => ({ skillId, skillName: skillId, group: "focus", slider: null, priority: null, asked: 3, unknown: 0, score: level / 5, level });
const evaluation = (skills: SkillResult[]): V4Result => ({ format: "v4", skills, strengths: [], focusFirst: [], rawScore: 40, pendingWritten: 0, answered: skills.length, total: skills.length });
const EVAL = evaluation([skill("eng-code-review", 1), skill("eng-github-flow", 4), skill("eng-git", 4)]);

async function build(ctx: TestContext, userId: string, ai: AiService, clients = connected) {
  return runBuilder({ userId, assessmentId: null, evaluation: EVAL, adminNotes: "" }, { db: ctx.db, env: ctx.env, ai, content: ctx.content, clients });
}

function worker(ctx: TestContext, ai: AiService, clients = connected) {
  return new JobWorker({ db: ctx.db, handlers: { "course.generate": courseGenerateHandler({ db: ctx.db, env: ctx.env, ai, clients, research: fetcher }) } });
}

const courseJobs = (ctx: TestContext) => ctx.db.select().from(schema.jobs).where(eq(schema.jobs.type, "course.generate")).all();
const generated = (ctx: TestContext) => ctx.db.select().from(schema.generatedCourses).all();

async function myPath(ctx: TestContext, session: { cookie: string }): Promise<LearningPathView> {
  const res = await ctx.app.inject({ method: "GET", url: "/api/me/path", ...as(session as never) });
  expect(res.statusCode).toBe(200);
  return res.json().path;
}

/** Stores research keys, so the routes (which read the real settings) see the web search as connected. */
async function connectResearch(ctx: TestContext, admin: Awaited<ReturnType<typeof adminSession>>) {
  const res = await ctx.app.inject({ method: "PUT", url: "/api/admin/research", ...as(admin), payload: { provider: "tavily", searchKey: "tvly-test-1234", youtubeKey: "yt-test-5678" } });
  expect(res.statusCode).toBe(200);
}

const codeReviewItem = (path: LearningPathView) => path.items.find((i) => i.skillId === "eng-code-review")!;

describe("a course no catalog course covers is made and published to the library", () => {
  test("passes, is published for everyone, assigned to every waiting learner, and reused without a new job", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai, calls } = aiStub(ctx);
    const rahul = await learner(ctx, admin, "Rahul");
    const priya = await learner(ctx, admin, "Priya");

    // Both learners need it before the course exists: one job, shared.
    const first = await build(ctx, rahul.id, ai);
    expect(first.creating).toBe(1);
    await build(ctx, priya.id, ai);
    expect(courseJobs(ctx)).toHaveLength(1);
    expect(codeReviewItem(await myPath(ctx, rahul.session))).toMatchObject({ creating: "working", available: false, href: null, courseTitle: "Code review" });

    await worker(ctx, ai).drain();
    expect(courseJobs(ctx)[0].lastError).toBeNull();
    expect(courseJobs(ctx)[0].status).toBe("done");

    const [row] = generated(ctx);
    expect(row).toMatchObject({ status: "published", library: true, scope: "global", departmentId: "engineering", skill: "Code review" });
    const course = ctx.db.select().from(schema.courses).where(eq(schema.courses.id, row.courseId)).get()!;
    expect(course).toMatchObject({ published: true, audience: "everyone", departmentId: null, title: COURSE_TITLE });

    for (const person of [rahul, priya]) {
      const item = codeReviewItem(await myPath(ctx, person.session));
      expect(item).toMatchObject({ courseId: row.courseId, available: true, href: `/courses/${row.courseId}`, source: "generated" });
      expect(item.creating ?? null).toBeNull();
      const assigned = ctx.db.select().from(schema.courseAssignments).where(and(eq(schema.courseAssignments.courseId, row.courseId), eq(schema.courseAssignments.userId, person.id))).get();
      expect(assigned).toBeDefined();
      const courses = await ctx.app.inject({ method: "GET", url: "/api/me/courses", ...as(person.session) });
      expect(courses.json().courses.map((c: { id: string }) => c.id)).toContain(row.courseId);
    }

    // Its sources are in the shared resources list.
    const resources = await ctx.app.inject({ method: "GET", url: "/api/me/resources", ...as(priya.session) });
    expect(resources.json().resources.map((r: { url: string }) => r.url)).toEqual(expect.arrayContaining(URLS.slice(0, 2)));

    // The admin hears about it in plain words, once per learner.
    const notes = ctx.db.select().from(schema.notifications).where(eq(schema.notifications.kind, "courses.added")).all();
    const bodies = [...new Set(notes.map((n) => n.body))].sort();
    expect(bodies).toEqual([
      `We added 1 new course to the library for Priya: ${COURSE_TITLE}. It's also available to everyone now.`,
      `We added 1 new course to the library for Rahul: ${COURSE_TITLE}. It's also available to everyone now.`,
    ]);

    // A third learner later needs the same skill: reused from the library, no job, no AI writing.
    const planCalls = calls.filter((c) => c === "course_plan").length;
    const sam = await learner(ctx, admin, "Sam");
    const later = await build(ctx, sam.id, ai);
    expect(later.reused).toBeGreaterThanOrEqual(1);
    expect(courseJobs(ctx)).toHaveLength(1);
    expect(generated(ctx)).toHaveLength(1);
    expect(calls.filter((c) => c === "course_plan").length).toBe(planCalls);
    expect(codeReviewItem(await myPath(ctx, sam.session))).toMatchObject({ courseId: row.courseId, source: "reuse", available: true });
    await ctx.close();
  }, 120_000);

  test("no duplicate is made when an equivalent course is already in the library", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai, calls } = aiStub(ctx);
    const at = Date.now();
    ctx.db.insert(schema.courses).values({ id: "lib-1", title: "Code reviews for engineers", summary: "", audience: "everyone", published: true, origin: "generated", createdAt: at, updatedAt: at }).run();
    ctx.db.insert(schema.generatedCourses).values({ courseId: "lib-1", skill: "Code reviews", status: "published", scope: "global", library: true, departmentId: "engineering", createdAt: at }).run();

    const rahul = await learner(ctx, admin, "Rahul");
    const outcome = await build(ctx, rahul.id, ai);
    expect(outcome.creating ?? 0).toBe(0);
    expect(courseJobs(ctx)).toHaveLength(0);
    expect(calls).not.toContain("course_plan");
    expect(codeReviewItem(await myPath(ctx, rahul.session))).toMatchObject({ courseId: "lib-1", source: "reuse" });
    await ctx.close();
  }, 60_000);
});

describe("a course that fails the quality check", () => {
  test("is held from learners, shows under Needs a look with a plain reason, and Fix automatically publishes it", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai } = aiStub(ctx, [{ score: 2, weak: [LESSON] }, { score: 5 }]);
    await connectResearch(ctx, admin);
    const rahul = await learner(ctx, admin, "Rahul");
    await build(ctx, rahul.id, ai);
    await worker(ctx, ai).drain();

    const [row] = generated(ctx);
    expect(row.status).toBe("needs_review");
    expect(row.library).toBe(false);
    expect(row.reviewReason).toBe("Some facts may be wrong in 1 lesson.");
    expect(row.reviewReason).toBe(plainReviewReason({ accuracy: 2, depth: 2, gapCoverage: 2, linkQuality: 2, testQuality: 2, noFiller: 2, notes: "", weakTopics: [LESSON] }));

    // Not visible to the learner: not in their courses, not openable, not even its title on the path.
    const courses = await ctx.app.inject({ method: "GET", url: "/api/me/courses", ...as(rahul.session) });
    expect(courses.json().courses).toEqual([]);
    const open = await ctx.app.inject({ method: "GET", url: `/api/me/courses/${row.courseId}`, ...as(rahul.session) });
    expect(open.statusCode).toBe(404);
    expect(codeReviewItem(await myPath(ctx, rahul.session))).toMatchObject({ creating: "held", courseId: null, href: null, courseTitle: "Code review" });

    // The admin's list carries the reason; the staff were told in plain words.
    const list = await ctx.app.inject({ method: "GET", url: "/api/admin/generated-courses", ...as(admin) });
    expect(list.json().courses[0]).toMatchObject({ status: "needs_review", reviewReason: "Some facts may be wrong in 1 lesson.", fixAttempts: 0 });
    const held = ctx.db.select().from(schema.notifications).where(eq(schema.notifications.kind, "course.needs_review")).all();
    expect(held[0].body).toContain("didn't pass the quality check: Some facts may be wrong in 1 lesson.");

    // Fix automatically: rewrites the flagged lesson, checks again, publishes on a pass.
    const fix = await ctx.app.inject({ method: "POST", url: `/api/admin/generated-courses/${row.courseId}/fix`, ...as(admin) });
    expect(fix.statusCode).toBe(202);
    expect(fix.json().waitingSetup).toBeNull();
    await worker(ctx, ai).drain();

    const fixed = generated(ctx)[0];
    expect(fixed).toMatchObject({ status: "published", library: true, fixAttempts: 1, reviewReason: null });
    expect(codeReviewItem(await myPath(ctx, rahul.session))).toMatchObject({ courseId: row.courseId, available: true });
    const added = ctx.db.select().from(schema.notifications).where(eq(schema.notifications.kind, "courses.added")).all();
    expect(added[0].body).toBe(`We added 1 new course to the library for Rahul: ${COURSE_TITLE}. It's also available to everyone now.`);

    // A published course cannot be "fixed" again.
    const again = await ctx.app.inject({ method: "POST", url: `/api/admin/generated-courses/${row.courseId}/fix`, ...as(admin) });
    expect(again.statusCode).toBe(400);
    await ctx.close();
  }, 120_000);

  test("Fix automatically stops after two tries", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai } = aiStub(ctx, [{ score: 2 }]);
    await connectResearch(ctx, admin);
    const rahul = await learner(ctx, admin, "Rahul");
    await build(ctx, rahul.id, ai);
    await worker(ctx, ai).drain();
    const courseId = generated(ctx)[0].courseId;
    for (let i = 0; i < 2; i += 1) {
      expect((await ctx.app.inject({ method: "POST", url: `/api/admin/generated-courses/${courseId}/fix`, ...as(admin) })).statusCode).toBe(202);
      await worker(ctx, ai).drain();
    }
    expect(generated(ctx)[0]).toMatchObject({ status: "needs_review", fixAttempts: 2 });
    const third = await ctx.app.inject({ method: "POST", url: `/api/admin/generated-courses/${courseId}/fix`, ...as(admin) });
    expect(third.statusCode).toBe(400);
    expect(third.json().error.message).toBe("We already tried to fix this course 2 times. Edit it to finish it by hand.");
    await ctx.close();
  }, 120_000);
});

describe("when the web search isn't connected", () => {
  test("the course waits in waiting_setup and is made as soon as the settings are saved", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai } = aiStub(ctx);
    const rahul = await learner(ctx, admin, "Rahul");
    const outcome = await build(ctx, rahul.id, ai, notConnected);
    expect(outcome.status).toBe("ready");
    expect(outcome.waitingForResearch).toBe(1);

    const [job] = courseJobs(ctx);
    expect(job.status).toBe("waiting_setup");
    expect(job.lastError).toBe("the web search isn't connected");

    // The admin's learner page says so in plain words.
    const gaps = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${rahul.id}/gaps`, ...as(admin) });
    const path = gaps.json().path as LearningPathView;
    expect(path.setupNeeded).toBe("We couldn't create the course because the web search isn't connected. We'll finish automatically after it's set up.");
    expect(path.setupNeeded).toBe(setupNeededMessage("the web search isn't connected"));
    expect(path.notice).toBe(path.setupNeeded);
    expect(codeReviewItem(path)).toMatchObject({ creating: "waiting_setup" });
    const page = await ctx.app.inject({ method: "GET", url: "/api/admin/generated-courses", ...as(admin) });
    expect(page.json().waitingSetup).toEqual({ count: 1, problem: "the web search isn't connected" });

    // The worker never claims it while it waits.
    expect(await worker(ctx, ai, notConnected).drain()).toBe(0);

    // Saving the research settings wakes it; it runs with no rebuild.
    const saved = await ctx.app.inject({ method: "PUT", url: "/api/admin/research", ...as(admin), payload: { provider: "tavily", searchKey: "tvly-test-1234", youtubeKey: "yt-test-5678" } });
    expect(saved.statusCode).toBe(200);
    expect(courseJobs(ctx)[0].status).toBe("queued");
    await worker(ctx, ai).drain();

    expect(courseJobs(ctx)[0].status).toBe("done");
    expect(generated(ctx)[0]).toMatchObject({ status: "published", library: true });
    const after = await myPath(ctx, rahul.session);
    expect(after.setupNeeded ?? null).toBeNull();
    expect(codeReviewItem(after).available).toBe(true);
    await ctx.close();
  }, 120_000);

  test("a woken job that still lacks setup goes back to waiting", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai } = aiStub(ctx);
    const rahul = await learner(ctx, admin, "Rahul");
    await build(ctx, rahul.id, ai, notConnected);
    ctx.db.update(schema.jobs).set({ status: "queued" }).run();
    await worker(ctx, ai, notConnected).drain();
    expect(courseJobs(ctx)[0]).toMatchObject({ status: "waiting_setup", lastError: "the web search isn't connected", attempts: 0 });
    await ctx.close();
  }, 60_000);
});

describe("auto-publish", () => {
  test("is on by default; a learner's override off holds a passing course until it is approved", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const settings = await ctx.app.inject({ method: "GET", url: "/api/admin/builder/settings", ...as(admin) });
    expect(settings.json()).toEqual({ autoPublish: true });

    const { ai } = aiStub(ctx);
    const rahul = await learner(ctx, admin, "Rahul");
    ctx.db.update(schema.learnerPriorities).set({ autoPublishOverride: "off" }).where(eq(schema.learnerPriorities.userId, rahul.id)).run();
    await build(ctx, rahul.id, ai);
    await worker(ctx, ai).drain();
    const [row] = generated(ctx);
    expect(row).toMatchObject({ status: "pending_review", library: false });
    expect(codeReviewItem(await myPath(ctx, rahul.session))).toMatchObject({ creating: "held", available: false });

    const approve = await ctx.app.inject({ method: "POST", url: `/api/admin/generated-courses/${row.courseId}/decision`, ...as(admin), payload: { decision: "approve" } });
    expect(approve.statusCode).toBe(200);
    expect(generated(ctx)[0]).toMatchObject({ status: "published", library: true });
    expect(codeReviewItem(await myPath(ctx, rahul.session))).toMatchObject({ courseId: row.courseId, available: true });
    await ctx.close();
  }, 120_000);

  test("the global setting can be turned off", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const put = await ctx.app.inject({ method: "PUT", url: "/api/admin/builder/settings", ...as(admin), payload: { autoPublish: false } });
    expect(put.json()).toEqual({ autoPublish: false });
    setGlobalAutoPublish(ctx.db, true);
    const get = await ctx.app.inject({ method: "GET", url: "/api/admin/builder/settings", ...as(admin) });
    expect(get.json()).toEqual({ autoPublish: true });
    await ctx.close();
  }, 60_000);
});

describe("the reference case's soft skills", () => {
  test("soft-skill path items use the soft-skill content modules; nothing is generated", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai, calls } = aiStub(ctx);
    const soft = ["ss-spoken-english", "ss-workplace-writing", "ss-standup-updates"];
    const rahul = await learner(ctx, admin, "Rahul", soft);
    const outcome = await runBuilder(
      { userId: rahul.id, assessmentId: null, evaluation: evaluation(soft.map((id) => skill(id, 1))), adminNotes: "" },
      { db: ctx.db, env: ctx.env, ai, content: ctx.content, clients: connected },
    );
    const items = ctx.db.select().from(schema.pathItems).where(eq(schema.pathItems.pathId, outcome.pathId)).all();
    for (const id of soft) {
      const mine = items.filter((i) => i.skillId === id);
      expect(mine.length).toBeGreaterThan(0);
      expect(mine.every((i) => i.moduleId === id.replace(/^ss-/, "soft-"))).toBe(true);
    }
    expect(courseJobs(ctx)).toHaveLength(0);
    expect(calls).not.toContain("course_plan");
    await ctx.close();
  }, 60_000);
});

describe("plain words", () => {
  test("the notice for several courses", () => {
    expect(coursesAddedMessage("Rahul", ["Spoken English for Developers", "Node.js & Express Basics", "Writing Clear Work Emails"])).toBe(
      "We added 3 new courses to the library for Rahul: Spoken English for Developers, Node.js & Express Basics, Writing Clear Work Emails. They're also available to everyone now.",
    );
    expect(setupNeededMessage("the AI isn't connected", 2)).toBe("We couldn't create 2 courses because the AI isn't connected. We'll finish automatically after it's set up.");
  });

  test("names that say the same thing count as the same course", () => {
    expect(nameSimilarity("Node.js & Express Basics", "Node.js and Express")).toBeGreaterThanOrEqual(0.6);
    expect(nameSimilarity("Code review", "Code reviews")).toBe(1);
    expect(nameSimilarity("SQL joins", "SQL indexes")).toBeLessThan(0.6);
    expect(nameSimilarity("Writing clear work emails", "Spoken English")).toBe(0);
  });
});
