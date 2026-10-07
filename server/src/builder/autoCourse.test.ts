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
import { ProviderError, type SearchClient, type VideoClient } from "./providers";
import { recheckBlocked } from "./connection";
import { bankItemSchema } from "../../../shared/bank";
import { testStatusLabel, type NextAction, type NextActionFacts } from "../../../shared/nextAction";
import { evaluateV4 } from "../assessment/evaluateV4";
import { itemsOf, storeItems, submitItem } from "../assessment/v4";
import { newId } from "../lib/ids";
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
/** v4.5.1: what the AI proposes in AI-only mode: two real pages and one that doesn't exist. */
const BOGUS_URL = "https://docs.example-invented.dev/code-review/made-up-page";
const PROPOSED = [URLS[0], URLS[1], BOGUS_URL];
const fetcher = {
  fetchUrl: vi.fn(async (url: string) =>
    url === BOGUS_URL
      ? { status: 404, headers: new Headers({ "content-type": "text/html" }), text: async () => "Not found" }
      : {
          status: 200,
          headers: new Headers({ "content-type": "text/html" }),
          text: async () => '<html><head><title>Real page</title><meta name="description" content="How to review a change well."></head><body>content</body></html>',
        },
  ),
};

const connected = (): ResearchClientsResult => ({ ok: true, provider: "tavily", search, video, videos: true });
const notConnected = (): ResearchClientsResult => ({ ok: false, state: "not_set_up", reason: "the web search isn't set up", detail: "No search service is picked." });

/**
 * A model stub for the course calls; anything else goes to the test app's mock. `reviews` are used
 * in turn. v4.5.1: `options.webSearch` gives it a built-in web search (mode 2); without it the
 * builder asks it to propose official docs (mode 3). `options.configured: false` = no AI credential.
 */
function aiStub(ctx: TestContext, reviews: { score: number; weak?: string[] }[] = [{ score: 5 }], options: { webSearch?: boolean; configured?: boolean } = {}) {
  let reviewCall = 0;
  const calls: string[] = [];
  const searches: string[] = [];
  let configured = options.configured ?? true;
  const generateJson = vi.fn(async (request: { purpose: string; user: string }) => {
    calls.push(request.purpose);
    const usage = { input: 100, output: 50 };
    const reply = (data: unknown) => ({ data, usage, latencyMs: 1, model: "stub" });
    if (request.purpose === "course_match") return reply({ courseId: null, confidence: 0, reason: "" });
    if (request.purpose === "course_research") {
      return reply({ results: PROPOSED.map((url, i) => ({ url, title: `Official page ${i}`, snippet: "What a good review looks like." })) });
    }
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
  /* Mode 2: the provider's web search tool, answered as the adapter hands it back (URL and title,
     no snippet: the page's own description is read when the link is checked). */
  const webSearch = vi.fn(async (query: string) => {
    searches.push(query);
    return URLS.map((url, i) => ({ url, title: `Search result ${i}`, snippet: "", publishedAt: null }));
  });
  const ai = {
    generateJson,
    isConfigured: () => configured,
    webSearchAvailable: () => Boolean(options.webSearch),
    ...(options.webSearch ? { webSearch } : {}),
  } as unknown as AiService;
  return { ai, calls, searches, setConfigured: (on: boolean) => void (configured = on) };
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

describe("v4.5.1: no search service, only the AI credential", () => {
  test("mode 3 (AI-only): the course is made from the AI's own knowledge, citing only proposed links our server opened", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai, calls } = aiStub(ctx);
    const rahul = await learner(ctx, admin, "Rahul");
    fetcher.fetchUrl.mockClear();
    const outcome = await build(ctx, rahul.id, ai, notConnected);
    expect(outcome.status).toBe("ready");
    expect(outcome.waitingForResearch ?? 0).toBe(0);
    expect(courseJobs(ctx)[0]).toMatchObject({ status: "queued", lastError: null });

    // Never "not set up" while the AI works: no banner, no blocked item.
    const before = await myPath(ctx, rahul.session);
    expect(before.setupNeeded ?? null).toBeNull();
    expect(before.notice ?? null).toBeNull();
    expect(codeReviewItem(before)).toMatchObject({ creating: "working" });

    await worker(ctx, ai, notConnected).drain();
    expect(courseJobs(ctx)[0]).toMatchObject({ status: "done", lastError: null });
    expect(calls).toContain("course_research");
    const [row] = generated(ctx);
    expect(row).toMatchObject({ status: "published", library: true });

    // Every proposal was opened; the one that doesn't exist was dropped and is cited nowhere.
    const fetched = fetcher.fetchUrl.mock.calls.map(([url]) => url);
    expect(fetched).toContain(BOGUS_URL);
    const sources = ctx.db.select().from(schema.courseSources).where(eq(schema.courseSources.courseId, row.courseId)).all().map((source) => source.url);
    expect(sources).toEqual(expect.arrayContaining([URLS[0], URLS[1]]));
    expect(sources).not.toContain(BOGUS_URL);

    const after = await myPath(ctx, rahul.session);
    expect(after.setupNeeded ?? null).toBeNull();
    expect(codeReviewItem(after)).toMatchObject({ courseId: row.courseId, available: true });
    await ctx.close();
  }, 120_000);

  test("mode 2 (the AI's web search): sources come from its search tool and are still opened by our server", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai, calls, searches } = aiStub(ctx, [{ score: 5 }], { webSearch: true });
    const rahul = await learner(ctx, admin, "Rahul");
    fetcher.fetchUrl.mockClear();
    await build(ctx, rahul.id, ai, notConnected);
    await worker(ctx, ai, notConnected).drain();
    expect(courseJobs(ctx)[0]).toMatchObject({ status: "done", lastError: null });
    expect(searches).toEqual(["how to review a pull request"]);
    // The search answered, so nothing was proposed from memory.
    expect(calls).not.toContain("course_research");
    const fetched = fetcher.fetchUrl.mock.calls.map(([url]) => url);
    expect(fetched).toEqual(expect.arrayContaining(URLS));
    const [row] = generated(ctx);
    expect(row).toMatchObject({ status: "published", library: true });
    const sources = ctx.db.select().from(schema.courseSources).where(eq(schema.courseSources.courseId, row.courseId)).all();
    expect(sources.length).toBeGreaterThan(0);
    await ctx.close();
  }, 120_000);

  test("a failing web search falls back to the AI's own knowledge for the rest of the course", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const stub = aiStub(ctx, [{ score: 5 }], { webSearch: true });
    (stub.ai as unknown as { webSearch: () => Promise<never> }).webSearch = vi.fn(async () => {
      throw new Error("web search is not enabled for this organization");
    });
    const rahul = await learner(ctx, admin, "Rahul");
    await build(ctx, rahul.id, stub.ai, notConnected);
    await worker(ctx, stub.ai, notConnected).drain();
    expect(courseJobs(ctx)[0]).toMatchObject({ status: "done", lastError: null });
    expect(stub.calls).toContain("course_research");
    expect(generated(ctx)[0]).toMatchObject({ status: "published" });
    await ctx.close();
  }, 120_000);

  test("only a missing AI credential blocks, says exactly that, and the course is made once one works", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const stub = aiStub(ctx, [{ score: 5 }], { configured: false });
    const rahul = await learner(ctx, admin, "Rahul");
    const outcome = await build(ctx, rahul.id, stub.ai, notConnected);
    expect(outcome.waitingForResearch).toBe(1);
    expect(courseJobs(ctx)[0]).toMatchObject({ status: "waiting_setup", lastError: "the AI isn't connected" });

    const gaps = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${rahul.id}/gaps`, ...as(admin) });
    const path = gaps.json().path as LearningPathView;
    expect(path.setupNeeded).toBe(
      "We couldn't create the course because the AI isn't connected. Connect an AI credential under Admin → AI connection. We'll finish automatically after that.",
    );
    expect(path.notice).toBe(path.setupNeeded);
    const page = await ctx.app.inject({ method: "GET", url: "/api/admin/generated-courses", ...as(admin) });
    expect(page.json().waitingSetup).toEqual({ count: 1, problem: "the AI isn't connected" });

    // The worker parks it again while there is no AI, and the re-check leaves it.
    ctx.db.update(schema.jobs).set({ status: "queued" }).run();
    await worker(ctx, stub.ai, notConnected).drain();
    expect(courseJobs(ctx)[0]).toMatchObject({ status: "waiting_setup", lastError: "the AI isn't connected", attempts: 0 });
    expect(await recheckBlocked({ db: ctx.db, env: ctx.env, ai: stub.ai, clients: notConnected })).toBe(0);

    // An AI credential arrives: the re-check wakes it and it is made with no search service.
    stub.setConfigured(true);
    expect(await recheckBlocked({ db: ctx.db, env: ctx.env, ai: stub.ai, clients: notConnected })).toBe(1);
    await worker(ctx, stub.ai, notConnected).drain();
    expect(courseJobs(ctx)[0].status).toBe("done");
    const after = await myPath(ctx, rahul.session);
    expect(after.setupNeeded ?? null).toBeNull();
    expect(codeReviewItem(after).available).toBe(true);
    await ctx.close();
  }, 120_000);

  test("jobs blocked by older builds on the web search are woken by the re-check and succeed; the banners clear", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai } = aiStub(ctx);
    const rahul = await learner(ctx, admin, "Rahul");
    await build(ctx, rahul.id, ai, notConnected);
    // What production has: parked by the old rule, with the old line.
    ctx.db.update(schema.jobs).set({ status: "waiting_setup", lastError: "the web search isn't set up" }).where(eq(schema.jobs.type, "course.generate")).run();
    expect((await myPath(ctx, rahul.session)).setupNeeded).toContain("the web search isn't set up");

    expect(await recheckBlocked({ db: ctx.db, env: ctx.env, ai, clients: notConnected })).toBe(1);
    await worker(ctx, ai, notConnected).drain();
    expect(courseJobs(ctx)[0]).toMatchObject({ status: "done", lastError: null });
    const after = await myPath(ctx, rahul.session);
    expect(after.setupNeeded ?? null).toBeNull();
    expect(after.notice ?? null).toBeNull();
    const next = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${rahul.id}/next-action`, ...as(admin) });
    expect(next.json().facts.courses).toMatchObject({ waitingSetup: 0 });
    expect(next.json().action.kind).not.toBe("courses-waiting");
    expect(await recheckBlocked({ db: ctx.db, env: ctx.env, ai, clients: notConnected })).toBe(0);
    await ctx.close();
  }, 120_000);

  test("a path built before v4.4 with 'No research provider is set up' stops showing it and is built again", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai } = aiStub(ctx);
    const rahul = await learner(ctx, admin, "Rahul");
    const outcome = await build(ctx, rahul.id, ai, notConnected);
    ctx.db.delete(schema.jobs).run();
    const legacy = "3 targets still need a generated course. No research provider is set up. Add one under Admin → AI connection.";
    ctx.db.update(schema.learningPaths).set({ notice: legacy }).where(eq(schema.learningPaths.id, outcome.pathId)).run();

    // Never shown again, even before the re-check runs.
    expect((await myPath(ctx, rahul.session)).notice ?? null).toBeNull();

    await recheckBlocked({ db: ctx.db, env: ctx.env, ai, clients: notConnected });
    const builds = ctx.db.select().from(schema.jobs).where(eq(schema.jobs.type, "path.build")).all();
    expect(builds).toHaveLength(1);
    expect(builds[0].payload).toMatchObject({ userId: rahul.id });
    expect(ctx.db.select().from(schema.learningPaths).where(eq(schema.learningPaths.id, outcome.pathId)).get()!.notice).toBeNull();
    // Once only.
    await recheckBlocked({ db: ctx.db, env: ctx.env, ai, clients: notConnected });
    expect(ctx.db.select().from(schema.jobs).where(eq(schema.jobs.type, "path.build")).all()).toHaveLength(1);
    await ctx.close();
  }, 120_000);

  test("course needs updating: a library course that covers the skill is reused (never a near-copy), with no search service", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai, calls } = aiStub(ctx);
    const at = Date.now();
    ctx.db.insert(schema.courses).values({ id: "lib-2", title: "Code reviews for engineers", summary: "", audience: "everyone", published: true, origin: "generated", createdAt: at, updatedAt: at }).run();
    ctx.db.insert(schema.generatedCourses).values({ courseId: "lib-2", skill: "Code reviews", status: "published", scope: "global", library: true, departmentId: "engineering", createdAt: at }).run();
    const rahul = await learner(ctx, admin, "Rahul");
    const outcome = await build(ctx, rahul.id, ai, notConnected);
    expect(outcome.creating ?? 0).toBe(0);
    expect(courseJobs(ctx)).toHaveLength(0);
    expect(calls).not.toContain("course_plan");
    expect(calls).not.toContain("course_research");
    expect(codeReviewItem(await myPath(ctx, rahul.session))).toMatchObject({ courseId: "lib-2", source: "reuse" });
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
    expect(setupNeededMessage("the AI isn't connected", 2)).toBe(
      "We couldn't create 2 courses because the AI isn't connected. Connect an AI credential under Admin → AI connection. We'll finish automatically after that.",
    );
    expect(setupNeededMessage("the AI key was rejected")).toBe("We couldn't create the course because the AI key was rejected. We'll finish automatically after the key is fixed.");
  });

  test("names that say the same thing count as the same course", () => {
    expect(nameSimilarity("Node.js & Express Basics", "Node.js and Express")).toBeGreaterThanOrEqual(0.6);
    expect(nameSimilarity("Code review", "Code reviews")).toBe(1);
    expect(nameSimilarity("SQL joins", "SQL indexes")).toBeLessThan(0.6);
    expect(nameSimilarity("Writing clear work emails", "Spoken English")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// v4.5 Phase 0: "web search isn't connected" when it is
// ---------------------------------------------------------------------------

/** A search service that always fails the same way, as the real one does with a bad key or no network. */
function failingSearch(state: "key_rejected" | "quota" | "unreachable" | "temporary"): () => ResearchClientsResult {
  const client: SearchClient = {
    id: "tavily",
    search: vi.fn(async () => {
      throw new ProviderError(state, "search", `fake ${state}`, state === "key_rejected" ? 401 : state === "quota" ? 432 : null);
    }),
  };
  return () => ({ ok: true, provider: "tavily", search: client, video, videos: true });
}

/** Tavily's real endpoint, answered by a stub: checks the auth header and returns `count` results. */
function stubTavily(count: number, status = 200) {
  const seen: { url: string; auth: string | null; body: string }[] = [];
  const realFetch = globalThis.fetch;
  vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith("https://api.tavily.com/")) return realFetch(input as never, init);
    const headers = new Headers(init?.headers);
    seen.push({ url, auth: headers.get("authorization"), body: String(init?.body ?? "") });
    if (status !== 200) return new Response(JSON.stringify({ detail: { error: "Unauthorized: missing or invalid API key." } }), { status });
    const results = URLS.concat(URLS)
      .slice(0, count)
      .map((u, i) => ({ url: `${u}?r=${i}`, title: `Result ${i}`, content: "A page that exists.", published_date: "2025-02-01" }));
    return new Response(JSON.stringify({ results }), { status: 200, headers: { "content-type": "application/json" } });
  });
  return seen;
}

describe("v4.5 P0: the root cause — a saved search key without a YouTube key", () => {
  test("is enough: the web app and the worker read the same saved settings, and the course is made", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai } = aiStub(ctx);
    const seen = stubTavily(5);
    try {
      // Exactly what production has: Tavily picked and its key saved, no YouTube key.
      const saved = await ctx.app.inject({ method: "PUT", url: "/api/admin/research", ...as(admin), payload: { provider: "tavily", searchKey: "tvly-prod-like-key" } });
      expect(saved.json().settings).toMatchObject({ configured: true, videosConfigured: false });

      const priyanka = await learner(ctx, admin, "Priyanka");
      // The path builder and the worker both read the saved settings (no `clients` override here).
      const outcome = await runBuilder({ userId: priyanka.id, assessmentId: null, evaluation: EVAL, adminNotes: "" }, { db: ctx.db, env: ctx.env, ai, content: ctx.content });
      expect(outcome.waitingForResearch ?? 0).toBe(0);
      expect(courseJobs(ctx)[0].status).toBe("queued");

      const realWorker = new JobWorker({ db: ctx.db, handlers: { "course.generate": courseGenerateHandler({ db: ctx.db, env: ctx.env, ai, research: fetcher }) } });
      await realWorker.drain();
      expect(courseJobs(ctx)[0]).toMatchObject({ status: "done", lastError: null });
      expect(generated(ctx)[0]).toMatchObject({ status: "published", library: true });
      // Tavily is called with the documented Bearer header, never with the key in the body.
      expect(seen.length).toBeGreaterThan(0);
      expect(seen.every((call) => call.auth === "Bearer tvly-prod-like-key" && !call.body.includes("tvly-prod-like-key"))).toBe(true);

      // The banner says what was added, with her first name.
      const gaps = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${priyanka.id}/gaps`, ...as(admin) });
      expect((gaps.json().path as LearningPathView).addedLine).toBe(`We added 1 new course for Priyanka: ${COURSE_TITLE}`);
    } finally {
      vi.unstubAllGlobals();
    }
    await ctx.close();
  }, 120_000);

  test("a Tavily key saved without picking the service is recognised; another key without a service is refused in plain words", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const tvly = await ctx.app.inject({ method: "PUT", url: "/api/admin/research", ...as(admin), payload: { searchKey: "tvly-no-provider" } });
    expect(tvly.statusCode).toBe(200);
    expect(tvly.json().settings).toMatchObject({ configured: true, effectiveProvider: "tavily" });
    const other = await ctx.app.inject({ method: "PUT", url: "/api/admin/research", ...as(admin), payload: { provider: null, searchKey: "brave-or-serper-key" } });
    expect(other.statusCode).toBe(400);
    expect(other.json().error.message).toBe("Pick which search service this key is for (Tavily, Brave Search or Serper), then save again.");
    await ctx.close();
  }, 60_000);
});

describe("v4.5.1: a saved search service that fails never blocks a course", () => {
  test("a rejected key: the course is researched with the AI instead, and the AI page says the key needs a look", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai, calls } = aiStub(ctx);
    const rahul = await learner(ctx, admin, "Rahul");
    await build(ctx, rahul.id, ai);
    await worker(ctx, ai, failingSearch("key_rejected")).drain();
    expect(courseJobs(ctx)[0]).toMatchObject({ status: "done", lastError: null });
    expect(calls).toContain("course_research");
    expect(generated(ctx)[0]).toMatchObject({ status: "published", library: true });
    const path = await myPath(ctx, rahul.session);
    expect(path.setupNeeded ?? null).toBeNull();
    const read = await ctx.app.inject({ method: "GET", url: "/api/admin/research", ...as(admin) });
    expect(read.json().settings.lastCheck).toMatchObject({ state: "key_rejected" });
    expect(read.json().settings.lastCheck.message).toBe(
      "Tavily rejected the key. Check it was copied in full and is a Tavily key, then save it again. Until then, new courses are researched with the AI connection instead.",
    );
    await ctx.close();
  }, 120_000);

  test("a used-up quota: the course is still made", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai } = aiStub(ctx);
    const rahul = await learner(ctx, admin, "Rahul");
    await build(ctx, rahul.id, ai);
    await worker(ctx, ai, failingSearch("quota")).drain();
    expect(courseJobs(ctx)[0]).toMatchObject({ status: "done", lastError: null });
    expect((await myPath(ctx, rahul.session)).setupNeeded ?? null).toBeNull();
    await ctx.close();
  }, 120_000);

  test("a course nothing can back is retried with backoff, fails after 5 tries with 'Failed: …', and Retry puts it back", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const { ai } = aiStub(ctx);
    const rahul = await learner(ctx, admin, "Rahul");
    await build(ctx, rahul.id, ai);
    // Every link check fails (the server is offline): no lesson has a source, so nothing is written.
    const offline = { fetchUrl: vi.fn(async () => Promise.reject(new Error("fetch failed"))) };
    const flaky = new JobWorker({ db: ctx.db, handlers: { "course.generate": courseGenerateHandler({ db: ctx.db, env: ctx.env, ai, clients: failingSearch("unreachable"), research: offline }) } });
    const [queued] = courseJobs(ctx);
    expect(queued.maxAttempts).toBe(5);
    const line = "No lesson could be backed by a source that actually resolved. Nothing was written.";

    const delays: number[] = [];
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      ctx.db.update(schema.jobs).set({ runAfter: 0 }).where(eq(schema.jobs.id, queued.id)).run();
      const before = Date.now();
      await flaky.drain();
      const job = courseJobs(ctx)[0];
      expect(job.attempts).toBe(attempt);
      expect(job.lastError).toBe(line);
      if (attempt < 5) {
        expect(job.status).toBe("queued");
        delays.push(job.runAfter - before);
      } else {
        expect(job.status).toBe("failed");
      }
    }
    // Backoff grows: 30 s, 1 min, 2 min, 4 min.
    expect(delays[0]).toBeGreaterThanOrEqual(29_000);
    expect(delays[3]).toBeGreaterThan(delays[0] * 7);

    const path = await myPath(ctx, rahul.session);
    expect(codeReviewItem(path)).toMatchObject({ creating: "failed", problem: line, retryJobId: queued.id });
    expect(path.failedCourses).toBe(1);
    const next = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${rahul.id}/next-action`, ...as(admin) });
    expect(next.json().facts.courses).toMatchObject({ failed: 1, failedProblem: line });

    const retry = await ctx.app.inject({ method: "POST", url: `/api/admin/course-jobs/${queued.id}/retry`, ...as(admin) });
    expect(retry.statusCode).toBe(202);
    expect(courseJobs(ctx)[0]).toMatchObject({ status: "queued", attempts: 0, lastError: null });
    const twice = await ctx.app.inject({ method: "POST", url: `/api/admin/course-jobs/${queued.id}/retry`, ...as(admin) });
    expect(twice.statusCode).toBe(409);
    await worker(ctx, ai).drain();
    expect(courseJobs(ctx)[0].status).toBe("done");
    await ctx.close();
  }, 120_000);
});

describe("v4.5 P0: Test", () => {
  test("Test runs a real search from the server and says what happened in plain words", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const notSet = await ctx.app.inject({ method: "POST", url: "/api/admin/research/test", ...as(admin) });
    expect(notSet.json().check).toMatchObject({ state: "not_set_up", message: "Not set up: No search service is picked and no key is saved." });

    await ctx.app.inject({ method: "PUT", url: "/api/admin/research", ...as(admin), payload: { provider: "tavily", searchKey: "tvly-good" } });
    stubTavily(5);
    try {
      const ok = await ctx.app.inject({ method: "POST", url: "/api/admin/research/test", ...as(admin) });
      expect(ok.statusCode).toBe(200);
      expect(ok.json().check).toMatchObject({ state: "ready", results: 5, videos: "missing" });
      expect(ok.json().check.message).toBe("Connected ✓ — test search returned 5 results. No YouTube key is saved, so new lessons won't have a video.");
      // Kept for the page and the inbox.
      const read = await ctx.app.inject({ method: "GET", url: "/api/admin/research", ...as(admin) });
      expect(read.json().settings.lastCheck).toMatchObject({ state: "ready", results: 5 });
    } finally {
      vi.unstubAllGlobals();
    }
    stubTavily(0, 401);
    try {
      const bad = await ctx.app.inject({ method: "POST", url: "/api/admin/research/test", ...as(admin) });
      expect(bad.json().check).toMatchObject({ state: "key_rejected" });
      expect(bad.json().check.message).toBe("Tavily rejected the key. Check it was copied in full and is a Tavily key, then save it again.");
    } finally {
      vi.unstubAllGlobals();
    }
    await ctx.close();
  }, 60_000);
});

describe("v4.5 P0: after an assessment, missing courses are queued with no admin click", () => {
  test("evaluation → path build → a course.generate job for the missing course; the status line says Test done", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const priyanka = await learner(ctx, admin, "Priyanka");
    ctx.db.update(schema.users).set({ displayName: "Priyanka Patel" }).where(eq(schema.users.id, priyanka.id)).run();
    const assessmentId = newId();
    ctx.db
      .insert(schema.assessments)
      .values({
        id: assessmentId,
        userId: priyanka.id,
        status: "in_progress",
        attemptNo: 1,
        createdAt: Date.now(),
        startedAt: Date.now() - 60_000,
        deadlineAt: Date.now() + 3_600_000,
        config: { format: "v4", departmentId: "engineering", assessmentFormat: "coding" },
      } as typeof schema.assessments.$inferInsert)
      .run();
    const mcq = (n: number) =>
      bankItemSchema.parse({
        id: `m-${n}-${newId().toLowerCase()}`,
        departmentId: "engineering",
        skillId: "eng-code-review",
        type: "mcq",
        difficulty: 2,
        estMinutes: 1,
        prompt: `What should a review comment do ${n}?`,
        mcq: { options: ["Say what and why", "Just say no", "Rewrite the code"], correctIndex: 0, explanation: "Say what and why." },
        tags: [],
      });
    storeItems(ctx.db, assessmentId, [1, 2].map((n) => ({ item: mcq(n), skillId: "eng-code-review", skillName: "Code review", group: "focus" as const, origin: "bank" as const, bankItemId: null })));
    for (const row of itemsOf(ctx.db, assessmentId)) {
      const key = (row.key as { mcq: { correctIndex: number } }).mcq.correctIndex;
      await submitItem({ db: ctx.db, sandbox: null as never, piston: null }, row, { choice: (key + 1) % 3 });
    }
    ctx.db.update(schema.assessments).set({ status: "submitted", submittedAt: Date.now() }).where(eq(schema.assessments.id, assessmentId)).run();
    await evaluateV4({ db: ctx.db, ai: ctx.ai, content: ctx.content, sandbox: null as never, piston: null }, assessmentId);

    // No admin click: the evaluation queued the path build, which asked for the missing course.
    await ctx.drainJobs();
    const jobs = courseJobs(ctx).filter((job) => (job.payload as { userId?: string }).userId === priyanka.id);
    expect(jobs).toHaveLength(1);
    expect((jobs[0].payload as { skillId?: string }).skillId).toBe("eng-code-review");

    /* v4.5.1: no search service is saved in the harness, but the AI works, so nothing is blocked:
       the course is being made (the harness's link check is offline, so this one is retried). The
       header and the bar agree with the path banner. */
    const next = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${priyanka.id}/next-action`, ...as(admin) });
    const { action, facts } = next.json() as { action: NextAction; facts: NextActionFacts };
    expect(action.kind).toBe("courses-creating");
    expect(facts.courses).toMatchObject({ waitingSetup: 0, creating: 1 });
    expect(testStatusLabel(facts.assessment?.status ?? null, facts.courses)).not.toContain("blocked");
    const gaps = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${priyanka.id}/gaps`, ...as(admin) });
    const path = gaps.json().path as LearningPathView;
    expect(path.setupNeeded ?? null).toBeNull();
    // The coverage rule: the goal was measured by the test, so the row is never "not assessed".
    expect(gaps.json().coverage.levels).toHaveProperty("eng-code-review");
    await ctx.close();
  }, 120_000);
});
