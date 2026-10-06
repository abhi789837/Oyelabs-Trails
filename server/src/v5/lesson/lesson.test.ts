import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { and, eq } from "drizzle-orm";

import type { LessonStatePutResponse, LessonStateView, ProblemListResponse, TutorAnswerResponse, TutorQualityReport, TutorStatus } from "../../../../shared/lesson";
import { correctIndicesOf } from "../../content/filter";
import { schema } from "../../db";
import { activeLearner, adminSession, as, createTestApp, publishPlanFor, type Session, type TestContext } from "../../test/harness";
import { buildPassages } from "../../topicTests/grounding";
import { writeMeta } from "./meta";
import { quickCheckQuestions } from "./routes";

/** A quiz topic with three videos, and a coding topic with one video. */
const QUIZ_TOPIC = "lv-api-exceptions";
const CODE_TOPIC = "js-call-stack";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };

async function boot(options: { noAi?: boolean } = {}) {
  ctx = await createTestApp({}, options);
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
  await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC, CODE_TOPIC]);
}

afterEach(async () => {
  await ctx?.close();
});

const req = (method: "GET" | "PUT" | "POST" | "PATCH" | "DELETE", url: string, payload?: unknown, session: Session = learner.session) =>
  ctx.app.inject({ method, url, ...as(session), ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }) });

async function put(topicId: string, payload: unknown): Promise<LessonStatePutResponse> {
  const res = await req("PUT", `/api/v5/lessons/${topicId}/state`, payload);
  expect(res.statusCode).toBe(200);
  return res.json();
}

/** The v4.3 video lock also guards code submissions; warn mode lets tests submit straight away. */
async function warnMode() {
  await ctx.app.inject({ method: "PUT", url: "/api/admin/video-settings", ...as(admin), payload: { lockMode: "warn" } });
}

function xpRows(kind?: string) {
  const rows = ctx.db.select().from(schema.xpEvents).where(eq(schema.xpEvents.userId, learner.id)).all();
  return kind ? rows.filter((r) => r.kind === kind) : rows;
}

describe("lesson state", () => {
  beforeEach(() => boot());

  test("a new lesson starts on its first step with nothing done", async () => {
    const res = await req("GET", `/api/v5/lessons/${QUIZ_TOPIC}/state`);
    expect(res.statusCode).toBe(200);
    const view: LessonStateView = res.json();
    expect(view).toMatchObject({ step: "watch", stepDone: { watch: false, read: false, do: false, check: false }, complete: false });
    expect(view.available).toEqual(["watch", "read", "check"]);
    const code: LessonStateView = (await req("GET", `/api/v5/lessons/${CODE_TOPIC}/state`)).json();
    expect(code.available).toEqual(["watch", "read", "do"]);
  });

  test("a topic outside the plan is a 404", async () => {
    expect((await req("GET", "/api/v5/lessons/js-closures/state")).statusCode).toBe(404);
  });

  test("autosave keeps the step, video and position, and Read pays XP once", async () => {
    const first = await put(QUIZ_TOPIC, { step: "read", videoId: "oFzfX2c-IIg", positionSec: 42.5, stepDone: { read: true } });
    expect(first.state).toMatchObject({ step: "read", videoId: "oFzfX2c-IIg", positionSec: 42.5 });
    expect(first.state.stepDone.read).toBe(true);
    expect(first.awarded).toEqual([{ kind: "step_completed", xp: 10 }]);
    const again = await put(QUIZ_TOPIC, { stepDone: { read: true } });
    expect(again.awarded).toEqual([]);
    expect(again.state.videoId).toBe("oFzfX2c-IIg");
    expect(xpRows("step_completed")).toHaveLength(1);
  });

  test("Watch isn't accepted while the videos are locked, and is in warn mode", async () => {
    const locked = await put(QUIZ_TOPIC, { stepDone: { watch: true } });
    expect(locked.state.stepDone.watch).toBe(false);
    expect(locked.awarded).toEqual([]);
    await ctx.app.inject({ method: "PUT", url: "/api/admin/video-settings", ...as(admin), payload: { lockMode: "warn" } });
    const warn = await put(QUIZ_TOPIC, { stepDone: { watch: true } });
    expect(warn.state.stepDone.watch).toBe(true);
  });

  test("Check needs a passed test; then the lesson completes with its XP", async () => {
    await ctx.app.inject({ method: "PUT", url: "/api/admin/video-settings", ...as(admin), payload: { lockMode: "warn" } });
    await put(QUIZ_TOPIC, { stepDone: { watch: true, read: true } });
    const early = await put(QUIZ_TOPIC, { stepDone: { check: true } });
    expect(early.state.stepDone.check).toBe(false);

    const quiz = ctx.content.getTopic(QUIZ_TOPIC)!.topic.quiz!;
    const attempt = await req("POST", `/api/topics/${QUIZ_TOPIC}/attempt`, { kind: "quiz", answers: Object.fromEntries(quiz.map((q) => [q.id, correctIndicesOf(q)])) });
    expect(attempt.json().passed).toBe(true);

    const done = await put(QUIZ_TOPIC, { stepDone: { check: true } });
    expect(done.state.complete).toBe(true);
    expect(done.justCompleted).toBe(true);
    expect(done.awarded).toEqual(expect.arrayContaining([{ kind: "step_completed", xp: 10 }, { kind: "lesson_completed", xp: 30 }]));
    expect((await put(QUIZ_TOPIC, { stepDone: { check: true } })).justCompleted).toBe(false);
  });

  test("a coding Do step counts after three checks, and the solution waits for them", async () => {
    await warnMode();
    const early = await put(CODE_TOPIC, { stepDone: { do: true } });
    expect(early.state.stepDone.do).toBe(false);
    const blocked = await req("POST", `/api/v5/lessons/${CODE_TOPIC}/solution`, { trade: false });
    expect(blocked.statusCode).toBe(409);
    expect(blocked.json().error.message).toMatch(/half the points/);

    for (let i = 0; i < 3; i++) {
      const res = await req("POST", `/api/topics/${CODE_TOPIC}/attempt`, { kind: "code", code: "function flattenDeep(input) { return []; }" });
      expect(res.statusCode).toBe(200);
    }
    const after = await put(CODE_TOPIC, { stepDone: { do: true } });
    expect(after.state.stepDone.do).toBe(true);
    expect(after.state.facts.codeAttempts).toBe(3);

    // The mock's solution fails the real tests, so nothing unchecked is ever shown.
    const solution = await req("POST", `/api/v5/lessons/${CODE_TOPIC}/solution`, { trade: false });
    expect(solution.statusCode).toBe(200);
    expect(solution.json()).toMatchObject({ code: null, traded: false });
    expect(solution.json().message).toMatch(/checked solution/);
  });

  test("a checked, cached solution can be traded for early, which halves the Do step's XP", async () => {
    await warnMode();
    const topic = ctx.content.getTopic(CODE_TOPIC)!.topic;
    const { challengeHash } = await import("./solution");
    writeMeta(ctx.db, `lesson.solution:${CODE_TOPIC}`, JSON.stringify({ hash: challengeHash(topic), code: "function flattenDeep(){}", explanation: "Use your own stack.", at: Date.now() }));
    const traded = await req("POST", `/api/v5/lessons/${CODE_TOPIC}/solution`, { trade: true });
    expect(traded.json()).toMatchObject({ code: "function flattenDeep(){}", traded: true });
    for (let i = 0; i < 3; i++) await req("POST", `/api/topics/${CODE_TOPIC}/attempt`, { kind: "code", code: "function flattenDeep() { return []; }" });
    const done = await put(CODE_TOPIC, { stepDone: { do: true } });
    expect(done.awarded).toContainEqual({ kind: "step_completed", xp: 5 });
    expect(done.state.facts.solutionTraded).toBe(true);
  });

  test("run: a snippet's console output comes back; checks run only the visible ones and record nothing", async () => {
    const snippet = (await req("POST", `/api/v5/lessons/${CODE_TOPIC}/run`, { mode: "snippet", code: "console.log('depth', 1 + 1, [1]); console.error('oops');" })).json();
    expect(snippet).toEqual({ stdout: "depth 2 [1]", stderr: "Error: oops", timedOut: false });
    const broken = (await req("POST", `/api/v5/lessons/${CODE_TOPIC}/run`, { mode: "snippet", code: "throw new Error('bad')" })).json();
    expect(broken.stderr).toMatch(/bad/);
    const checks = (await req("POST", `/api/v5/lessons/${CODE_TOPIC}/run`, { mode: "checks", code: "function checkFlatten() { return []; }" })).json();
    const total = ctx.content.getTopic(CODE_TOPIC)!.topic.codeChallenge!.testCases.length;
    expect(checks.total).toBeLessThan(total);
    expect(checks.results[0]).toMatchObject({ passed: false, isEdgeCase: false });
    expect(ctx.db.select().from(schema.topicAttempts).all()).toHaveLength(0);
    expect((await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/run`, { mode: "checks", code: "x" })).statusCode).toBe(400);
  });

  test("resume returns the latest unfinished lesson with its step, position and time left", async () => {
    expect((await req("GET", "/api/v5/lessons/resume")).json()).toBeNull();
    await put(CODE_TOPIC, { step: "read" });
    await put(QUIZ_TOPIC, { step: "watch", videoId: "eTOScyTCkiY", positionSec: 61 });
    const resume = (await req("GET", "/api/v5/lessons/resume")).json();
    expect(resume).toMatchObject({ topicId: QUIZ_TOPIC, step: "watch", positionSec: 61, lane: null });
    expect(resume.title).toBe(ctx.content.getTopic(QUIZ_TOPIC)!.topic.title);
    expect(resume.minutesLeft).toBeGreaterThan(0);
  });

  test("resume skips a lesson whose topic is already completed (Phase 9.2)", async () => {
    await put(CODE_TOPIC, { step: "read" });
    await put(QUIZ_TOPIC, { step: "read" });
    const now = Date.now();
    ctx.db.insert(schema.topicProgress).values({ userId: learner.id, topicId: QUIZ_TOPIC, status: "completed", attempts: 1, completedAt: now, updatedAt: now }).run();
    const resume = (await req("GET", "/api/v5/lessons/resume")).json();
    expect(resume).toMatchObject({ topicId: CODE_TOPIC, step: "read" });
  });

  test("quick check: one or two of the topic's questions, keys never sent, XP once on a pass", async () => {
    const got = (await req("GET", `/api/v5/lessons/${QUIZ_TOPIC}/quick-check`)).json();
    expect(got.questions.length).toBeGreaterThanOrEqual(1);
    expect(got.questions.length).toBeLessThanOrEqual(2);
    expect(JSON.stringify(got)).not.toMatch(/correctInd|explanation/);
    const topic = ctx.content.getTopic(QUIZ_TOPIC)!.topic;
    const picked = quickCheckQuestions(topic, learner.id);
    expect(picked.map((q) => q.id)).toEqual(got.questions.map((q: { id: string }) => q.id));

    const wrong = (await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/quick-check`, { answers: {} })).json();
    expect(wrong.passed).toBe(false);
    expect(wrong.results[0].explanation.length).toBeGreaterThan(0);
    const right = (await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/quick-check`, { answers: Object.fromEntries(picked.map((q) => [q.id, correctIndicesOf(q)])) })).json();
    expect(right).toMatchObject({ passed: true, awarded: [{ kind: "quick_check_passed", xp: 15 }] });
    const again = (await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/quick-check`, { answers: Object.fromEntries(picked.map((q) => [q.id, correctIndicesOf(q)])) })).json();
    expect(again.awarded).toEqual([]);
    // Not a test attempt.
    expect(ctx.db.select().from(schema.topicAttempts).where(eq(schema.topicAttempts.userId, learner.id)).all()).toHaveLength(0);
  });
});

describe("notes", () => {
  beforeEach(() => boot());

  test("create, list in time order, edit, delete; nobody else can touch them", async () => {
    const a = await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/notes`, { body: "Later moment", videoId: "oFzfX2c-IIg", atSec: 120 });
    expect(a.statusCode).toBe(200);
    await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/notes`, { body: "Early moment", videoId: "oFzfX2c-IIg", atSec: 12 });
    await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/notes`, { body: "No time" });
    const list = (await req("GET", `/api/v5/lessons/${QUIZ_TOPIC}/notes`)).json().notes;
    expect(list.map((n: { body: string }) => n.body)).toEqual(["Early moment", "Later moment", "No time"]);

    const id = a.json().note.id;
    const edited = await req("PATCH", `/api/v5/notes/${id}`, { body: "Edited" });
    expect(edited.json().note.body).toBe("Edited");

    const other = await activeLearner(ctx, admin, "second-learner");
    expect((await req("PATCH", `/api/v5/notes/${id}`, { body: "Mine now" }, other.session)).statusCode).toBe(404);
    expect((await req("DELETE", `/api/v5/notes/${id}`, undefined, other.session)).statusCode).toBe(404);

    expect((await req("DELETE", `/api/v5/notes/${id}`)).statusCode).toBe(200);
    expect((await req("GET", `/api/v5/lessons/${QUIZ_TOPIC}/notes`)).json().notes).toHaveLength(2);
    expect((await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/notes`, { body: "   " })).statusCode).toBe(400);
  });
});

describe("problem reports", () => {
  beforeEach(() => boot());

  test("a report notifies staff, lists for admins only, and can be resolved", async () => {
    const res = await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/problems`, { step: "watch", message: "The second video won't play." });
    expect(res.statusCode).toBe(200);
    const notes = ctx.db.select().from(schema.notifications).where(eq(schema.notifications.kind, "lesson.problem_reported")).all();
    expect(notes.length).toBeGreaterThan(0);
    expect(notes[0].title).toMatch(/Watch step/);

    expect((await req("GET", "/api/admin/v5/problems")).statusCode).toBe(403);
    const list: ProblemListResponse = (await req("GET", "/api/admin/v5/problems", undefined, admin)).json();
    expect(list.openCount).toBe(1);
    expect(list.problems[0]).toMatchObject({ topicId: QUIZ_TOPIC, step: "watch", status: "open", message: "The second video won't play." });
    expect(list.problems[0].reporter.id).toBe(learner.id);

    expect((await req("POST", `/api/admin/v5/problems/${list.problems[0].id}/resolve`)).statusCode).toBe(403);
    const resolved = await req("POST", `/api/admin/v5/problems/${list.problems[0].id}/resolve`, undefined, admin);
    expect(resolved.json().problem.status).toBe("resolved");
    expect((await req("GET", "/api/admin/v5/problems", undefined, admin)).json().openCount).toBe(0);
    expect((await req("GET", "/api/admin/v5/problems?status=resolved", undefined, admin)).json().problems).toHaveLength(1);
  });
});

describe("Ask Oye", () => {
  test("answers grounded in the lesson, with a citation that checks out", async () => {
    await boot();
    const status: TutorStatus = (await req("GET", `/api/v5/lessons/${QUIZ_TOPIC}/tutor`)).json();
    expect(status).toMatchObject({ available: true, reason: null, cap: 30, usedToday: 0, left: 30 });

    const res = await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/tutor`, { question: "Why would I throw a custom exception?", step: "read" });
    expect(res.statusCode).toBe(200);
    const body: TutorAnswerResponse = res.json();
    expect(body.left).toBe(29);
    expect(body.message.citations).toHaveLength(1);
    const passages = buildPassages(ctx.content.getTopic(QUIZ_TOPIC)!.topic);
    const cited = passages.find((p) => p.id === body.message.citations[0].passageId)!;
    expect(cited).toBeTruthy();
    expect(cited.text.replace(/\s+/g, " ")).toContain(body.message.citations[0].quote);
    expect(body.message.citations[0].heading).toBe(cited.heading);

    // The lesson text is the cached system prompt, the question is the user prompt.
    const usage = ctx.db.select().from(schema.aiCalls).all().filter((u) => u.task === "tutor_answer");
    expect(usage).toHaveLength(1);
  });

  test("refuses on the Check step and while an assessment is in progress", async () => {
    await boot();
    const check = await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/tutor`, { question: "What's the answer to question 3?", step: "check" });
    expect(check.statusCode).toBe(403);
    expect(check.json().error.message).toMatch(/off during tests/);

    const at = Date.now();
    ctx.db.insert(schema.assessments).values({ id: "a-live", userId: learner.id, status: "in_progress", createdAt: at, updatedAt: at } as typeof schema.assessments.$inferInsert).run();
    const during = await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/tutor`, { question: "Explain this please", step: "read" });
    expect(during.statusCode).toBe(403);
    expect((await req("GET", `/api/v5/lessons/${QUIZ_TOPIC}/tutor`)).json().reason).toMatch(/off during tests/);
    expect(ctx.db.select().from(schema.tutorMessages).all()).toHaveLength(0);
  });

  test("the daily cap counts today's questions and comes from app_meta", async () => {
    await boot();
    writeMeta(ctx.db, "tutor.daily_cap", "2");
    for (let i = 0; i < 2; i++) {
      expect((await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/tutor`, { question: `Question ${i}`, step: "watch" })).statusCode).toBe(200);
    }
    const capped = await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/tutor`, { question: "One more", step: "watch" });
    expect(capped.statusCode).toBe(429);
    expect(capped.json().error.message).toMatch(/back tomorrow/);
    // Yesterday's questions don't count.
    ctx.db.update(schema.tutorMessages).set({ createdAt: Date.now() - 2 * 24 * 3600 * 1000 }).run();
    expect((await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/tutor`, { question: "Fresh day", step: "watch" })).statusCode).toBe(200);
  });

  test("ratings are stored and the admin quality report lists unhelpful answers", async () => {
    await boot();
    const asked: TutorAnswerResponse = (await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/tutor`, { question: "What is an exception?", step: "read" })).json();
    const rated = await req("POST", `/api/v5/tutor/messages/${asked.message.id}/rating`, { rating: -1 });
    expect(rated.json().message.rating).toBe(-1);
    const row = ctx.db.select().from(schema.tutorMessages).where(and(eq(schema.tutorMessages.id, asked.message.id))).get();
    expect(row?.rating).toBe(-1);

    expect((await req("GET", "/api/admin/v5/tutor-quality")).statusCode).toBe(403);
    const report: TutorQualityReport = (await req("GET", "/api/admin/v5/tutor-quality", undefined, admin)).json();
    expect(report).toMatchObject({ total: 1, helpful: 0, unhelpful: 1, unrated: 0, last7Days: 1 });
    expect(report.unhelpfulAnswers[0]).toMatchObject({ question: "What is an exception?", topicId: QUIZ_TOPIC });
  });

  test("without an AI service it says it isn't set up yet", async () => {
    await boot({ noAi: true });
    const status: TutorStatus = (await req("GET", `/api/v5/lessons/${QUIZ_TOPIC}/tutor`)).json();
    expect(status.available).toBe(false);
    expect(status.reason).toMatch(/isn't set up yet/);
    const res = await req("POST", `/api/v5/lessons/${QUIZ_TOPIC}/tutor`, { question: "Hello there", step: "read" });
    expect(res.statusCode).toBe(503);
  });
});
