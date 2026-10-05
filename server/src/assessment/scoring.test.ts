import { and, desc, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { Sheet, V4Result } from "../../../shared/assessmentV4";
import { verdictFor } from "../../../shared/scoring";
import { taskSchema, type WriteTask } from "../../../shared/tasks";
import { gradeCode } from "../content/grade";
import type { AuthoredCodeChallenge } from "../content/store";
import { schema } from "../db";
import { QUIZ_PASS_THRESHOLD } from "../../../shared/content";
import { correctIndicesOf } from "../content/filter";
import { activeLearner, adminSession, as, createTestApp, publishPlanFor, type Session, type TestContext } from "../test/harness";
import { setVideoLockMode } from "../videos/repo";
import { gradeWritten, RUBRIC_SYSTEM, FULL_MARKS_RULE } from "./evaluateV4";
import { runRescore, RESCORE_PROGRESS_KEY } from "./rescoreJob";
import { applyVerdict, getScoringMode } from "./scoring";

/**
 * v4.4 Phase 4: full marks when the answer is good. The verdict layer, the AI judge (mock), code
 * test tiers, review requests with an admin override, the partial-credit setting and the re-score.
 */

let ctx: TestContext;
let admin: Session;
let learner: { id: string; session: Session };

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
});

afterEach(async () => {
  await ctx.close();
});

const setup = {
  departmentId: "engineering",
  trackId: "frontend",
  stackIds: ["stack-react"],
  experienceBand: "1-2",
  level: 2,
  priorities: [
    { skillId: "eng-react-hooks", slider: 4 },
    { skillId: "eng-typescript", slider: 5 },
  ],
  skip: [],
  hoursPerWeek: 15,
  advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false },
};

/** Assigns, sits and finishes a v4 assessment: every MCQ answered with option 0, the rest blank. */
async function sitAssessment(): Promise<string> {
  const res = await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learner.id}/setup`, ...as(admin), payload: { ...setup, assign: true } });
  expect(res.statusCode).toBe(200);
  const id = res.json().issued.assessmentId as string;
  await ctx.drainJobs();
  await ctx.app.inject({ method: "POST", url: `/api/assessment/${id}/consent`, ...as(learner.session), payload: { agreed: true } });
  await ctx.app.inject({ method: "POST", url: `/api/assessment/${id}/start`, ...as(learner.session), payload: {} });
  const sheet = (await ctx.app.inject({ method: "GET", url: `/api/assessment/${id}/sheet`, ...as(learner.session) })).json() as Sheet;
  for (const item of sheet.items.filter((i) => i.type === "mcq")) {
    await ctx.app.inject({ method: "PUT", url: `/api/assessment/${id}/items/${item.id}/draft`, ...as(learner.session), payload: { response: { choice: 0 } } });
  }
  expect((await ctx.app.inject({ method: "POST", url: `/api/assessment/${id}/submit`, ...as(learner.session), payload: {} })).statusCode).toBe(200);
  await ctx.drainJobs();
  return id;
}

const items = (id: string) => ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, id)).all();
const latestResult = (id: string) =>
  ctx.db.select().from(schema.evaluations).where(eq(schema.evaluations.assessmentId, id)).orderBy(desc(schema.evaluations.createdAt)).get()!.result as V4Result;

describe("the AI judge", () => {
  const task = taskSchema.parse({
    kind: "write",
    variant: "email",
    prompt: "Email the client: we need the payment API keys before Friday's release.",
    wordLimit: 120,
    rubric: [
      { id: "ask", label: "Clear ask", description: "Asks the client to send the payment API keys." },
      { id: "deadline", label: "Deadline", description: "Gives a date: Thursday, so Friday's release holds." },
      { id: "tone", label: "Polite tone", description: "Polite and professional greeting." },
    ],
    sampleAnswer: "Hi Sam, we need the payment API keys to finish checkout. Could you send them by Thursday so Friday's release holds? Thanks.",
  }) as WriteTask;
  const meta = { subjectUserId: "u1", assessmentId: "a1" };

  test("the prompt says the full-marks rule word for word and gives a borderline anchor", () => {
    expect(RUBRIC_SYSTEM).toContain(FULL_MARKS_RULE);
    expect(FULL_MARKS_RULE).toBe(
      "If the answer does the job well, give full marks; don't deduct for style differences, alternative valid approaches, or minor slips that don't affect the result.",
    );
    expect(RUBRIC_SYSTEM).toMatch(/Borderline, met: true/);
    expect(RUBRIC_SYSTEM).toMatch(/"observations"[\s\S]*"met"[\s\S]*"reason"[\s\S]*"tip"/);
  });

  test("a good answer in different words (a style difference) gets full marks", async () => {
    // Different order, wording and tone from the sample; it still has the ask and the date.
    const text = "Thursday works best for us: please share those payment keys by then. Release is Friday. Cheers, Priya";
    const graded = (await gradeWritten(ctx.ai, task, text, meta))!;
    expect(graded.met).toBe(true);
    expect(graded.reason).toBeTruthy();
    expect(verdictFor({ kind: "task", task, response: { kind: "write", text }, raw: graded.score, met: graded.met, tip: graded.tip })!.full).toBe(true);
  });

  test("an answer that misses the job gets Not yet, with a reason and a tip", async () => {
    const text = "ok will do, thanks a lot mate";
    const graded = (await gradeWritten(ctx.ai, task, text, meta))!;
    expect(graded.met).toBe(false);
    expect(graded.tip).toBeTruthy();
    expect(verdictFor({ kind: "task", task, response: { kind: "write", text }, raw: graded.score, met: graded.met })!.full).toBe(false);
  });
});

describe("code test tiers", () => {
  const challenge: AuthoredCodeChallenge = {
    instructions: "Return the sum of the list.",
    starterCode: "function sum(xs) {}",
    functionName: "sum",
    testCases: [
      { args: [[1, 2]], expected: 3, description: "adds two numbers" },
      { args: [[5, 5, 5]], expected: 15, description: "adds three numbers" },
      { args: [[0.1, 0.2]], expected: 0.3, description: "adds decimals" },
      { args: [[]], expected: 0, description: "an empty list sums to zero", isEdgeCase: true },
    ],
  };
  // Right for every real list, but reduce() with no start value throws on an empty one.
  const code = "function sum(xs) { return xs.reduce((a, b) => a + b); }";

  test("passing the core tests but failing an edge test gets full marks and a note", async () => {
    const result = await gradeCode(challenge, code, ctx.app.sandbox, "full");
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.notes?.[0]).toMatch(/Edge case not handled yet|hidden edge case/);
    // 0.1 + 0.2 compares within tolerance, so it is a pass, not a wrong answer.
    expect(result.results[2].passed).toBe(true);
  });

  test("partial mode keeps the old bar: every test must pass", async () => {
    const result = await gradeCode(challenge, code, ctx.app.sandbox, "partial");
    expect(result.passed).toBe(false);
    expect(result.score).toBe(75);
  });

  test("a wrong answer is Not yet in full mode too", async () => {
    const result = await gradeCode(challenge, "function sum(xs) { return xs.length; }", ctx.app.sandbox, "full");
    expect(result.passed).toBe(false);
    expect(result.notes).toBeUndefined();
  });

  test("a stored assessment coding answer: core passed, edge failed → full marks, the note is stored", async () => {
    const id = await sitAssessment();
    const coding = items(id).find((i) => (i.key as { type: string }).type === "coding")!;
    const detail = { passed: 3, total: 4, compileError: null, timedOut: false, tests: [{ passed: true, tier: "core" }, { passed: true, tier: "core" }, { passed: true, tier: "core" }, { passed: false, tier: "edge" }] };
    const row = { ...coding, response: { code: "// solution" }, rawScore: 0.75, score: null, verdict: null, aiFeedback: JSON.stringify(detail) };
    const applied = applyVerdict(ctx.db, row, "full");
    expect(applied.verdict).toMatchObject({ full: true, score: 1 });
    const stored = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, coding.id)).get()!;
    expect(stored).toMatchObject({ verdict: "full", score: 1, rawScore: 0.75 });
    expect(stored.verdictNote).toMatch(/Missed an edge case/);
    // Partial mode keeps the fraction.
    applyVerdict(ctx.db, { ...stored }, "partial");
    expect(ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, coding.id)).get()!.score).toBe(0.75);
  }, 120_000);
});

describe("verdicts in a finished assessment", () => {
  test("every graded answer is Full marks or Not yet, scored 0 or 1, with the raw score kept", async () => {
    const id = await sitAssessment();
    const graded = items(id).filter((i) => i.score != null);
    expect(graded.length).toBeGreaterThan(0);
    for (const item of graded) {
      expect([0, 1]).toContain(item.score);
      expect(item.verdict).toBe(item.score === 1 ? "full" : "not_yet");
      expect(item.rawScore).not.toBeNull();
    }
    // Levels still come from the full / not-yet pattern.
    expect(latestResult(id).skills.every((s) => s.level == null || (s.level >= 0 && s.level <= 5))).toBe(true);
  }, 120_000);
});

describe("review requests", () => {
  test("a learner asks once, an admin gives full marks: the item, result, audit, stats and learner are updated", async () => {
    const id = await sitAssessment();
    const notYet = items(id).find((i) => (i.key as { type: string }).type === "mcq" && i.verdict === "not_yet")!;
    expect(notYet).toBeTruthy();
    const full = items(id).find((i) => i.verdict === "full");
    const before = latestResult(id);
    const bankBefore = ctx.db.select().from(schema.questionBank).where(eq(schema.questionBank.id, notYet.bankItemId!)).get()!;

    const ask = (refId: string, session = learner.session) =>
      ctx.app.inject({ method: "POST", url: "/api/review-requests", ...as(session), payload: { source: "assessment_item", refId, note: "I think B is also right." } });
    expect((await ask(notYet.id)).statusCode).toBe(200);
    expect((await ask(notYet.id)).statusCode).toBe(409); // one open request per item
    if (full) expect((await ask(full.id)).statusCode).toBe(409); // only Not-yet answers
    const other = await activeLearner(ctx, admin, "learner.two");
    expect((await ask(notYet.id, other.session)).statusCode).toBe(404); // only your own

    const mine = (await ctx.app.inject({ method: "GET", url: "/api/review-requests", ...as(learner.session) })).json();
    expect(mine.requests[0]).toMatchObject({ refId: notYet.id, status: "open" });

    const list = (await ctx.app.inject({ method: "GET", url: "/api/admin/review-requests", ...as(admin) })).json();
    expect(list.requests).toHaveLength(1);
    const view = list.requests[0];
    expect(view.question).toBeTruthy();
    expect(view.answer).toBeTruthy();
    expect(view.reason).toMatch(/Not the right option/);
    expect(view.learnerNote).toBe("I think B is also right.");
    // Learners cannot see the admin list or decide.
    expect((await ctx.app.inject({ method: "GET", url: "/api/admin/review-requests", ...as(learner.session) })).statusCode).toBe(403);

    const decided = await ctx.app.inject({ method: "POST", url: `/api/admin/review-requests/${view.id}/decision`, ...as(admin), payload: { decision: "override", note: "Both readings are fair." } });
    expect(decided.statusCode).toBe(200);
    expect((await ctx.app.inject({ method: "POST", url: `/api/admin/review-requests/${view.id}/decision`, ...as(admin), payload: { decision: "uphold" } })).statusCode).toBe(409);

    const item = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, notYet.id)).get()!;
    expect(item).toMatchObject({ verdict: "full", score: 1, reviewStatus: "overridden", reviewNote: "Both readings are fair." });
    expect(latestResult(id).rawScore).toBeGreaterThan(before.rawScore);
    const audit = ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "review.overridden")).all();
    expect(audit).toHaveLength(1);
    expect(audit[0].targetId).toBe(notYet.id);
    const bankAfter = ctx.db.select().from(schema.questionBank).where(eq(schema.questionBank.id, notYet.bankItemId!)).get()!;
    expect(bankAfter.scoreSum).toBeCloseTo(bankBefore.scoreSum + 1);
    const told = ctx.db.select().from(schema.notifications).where(and(eq(schema.notifications.recipientId, learner.id), eq(schema.notifications.kind, "review.overridden"))).all();
    expect(told).toHaveLength(1);
    expect(told[0].title).toBe("Your answer now has full marks");

    // A re-score keeps the override.
    runRescore(ctx.db);
    expect(ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, notYet.id)).get()!.score).toBe(1);
  }, 120_000);

  test("Keep \"Not yet\" leaves the score and tells the learner", async () => {
    const id = await sitAssessment();
    const notYet = items(id).find((i) => i.verdict === "not_yet" && (i.key as { type: string }).type === "mcq")!;
    await ctx.app.inject({ method: "POST", url: "/api/review-requests", ...as(learner.session), payload: { source: "assessment_item", refId: notYet.id } });
    const view = (await ctx.app.inject({ method: "GET", url: "/api/admin/review-requests", ...as(admin) })).json().requests[0];
    await ctx.app.inject({ method: "POST", url: `/api/admin/review-requests/${view.id}/decision`, ...as(admin), payload: { decision: "uphold", note: "Option A misses the cleanup." } });
    const item = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, notYet.id)).get()!;
    expect(item).toMatchObject({ verdict: "not_yet", score: 0, reviewStatus: "upheld" });
    const told = ctx.db.select().from(schema.notifications).where(and(eq(schema.notifications.recipientId, learner.id), eq(schema.notifications.kind, "review.upheld"))).get()!;
    expect(told.body).toMatch(/misses the cleanup/);
  }, 120_000);
});

describe("the scoring setting and the re-score", () => {
  test("partial mode keeps fractions; the re-score keeps history and reports counts", async () => {
    const id = await sitAssessment();
    expect(getScoringMode(ctx.db)).toBe("full");
    // A coding answer with partial credit: half its tests passed.
    const coding = items(id).find((i) => (i.key as { type: string }).type === "coding")!;
    ctx.db
      .update(schema.assessmentItems)
      .set({ response: { code: "// half" }, rawScore: 0.5, score: 0, verdict: "not_yet", aiFeedback: JSON.stringify({ passed: 2, total: 4, tests: [{ passed: true, tier: "core" }, { passed: true, tier: "core" }, { passed: false, tier: "core" }, { passed: false, tier: "core" }] }) })
      .where(eq(schema.assessmentItems.id, coding.id))
      .run();

    // Only a superadmin may change it; plain words come back.
    const put = await ctx.app.inject({ method: "PUT", url: "/api/admin/settings/scoring", ...as(admin), payload: { mode: "partial" } });
    expect(put.statusCode).toBe(200);
    expect(put.json().label).toBe("Partial credit");
    expect((await ctx.app.inject({ method: "GET", url: "/api/admin/settings/scoring", ...as(learner.session) })).statusCode).toBe(403);
    await ctx.drainJobs(); // changing the setting queued `scoring.rescore`

    const after = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, coding.id)).get()!;
    expect(after.score).toBe(0.5);
    expect(after.verdict).toBe("not_yet");
    expect(after.scoreHistory).toEqual([{ score: 0, mode: "full", at: expect.any(Number) }]);
    const report = (await ctx.app.inject({ method: "GET", url: "/api/admin/scoring/rescore", ...as(admin) })).json().report;
    expect(report.mode).toBe("partial");
    expect(report.items).toBeGreaterThan(0);
    expect(report.changed).toBeGreaterThanOrEqual(1);
    expect(report.resultsChanged).toBe(1);
    expect(ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "scoring.mode_changed")).all()).toHaveLength(1);

    // Back to full marks: the history grows, the fraction becomes 0 again.
    await ctx.app.inject({ method: "PUT", url: "/api/admin/settings/scoring", ...as(admin), payload: { mode: "full" } });
    await ctx.drainJobs();
    const again = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, coding.id)).get()!;
    expect(again.score).toBe(0);
    expect(again.scoreHistory?.map((h) => [h.score, h.mode])).toEqual([
      [0, "full"],
      [0.5, "partial"],
    ]);
  }, 120_000);

  test("the re-score is resumable: a stopped run continues from its saved place", async () => {
    const id = await sitAssessment();
    const total = items(id).filter((i) => i.score != null || i.rawScore != null).length;
    expect(runRescore(ctx.db, { batchSize: 5, maxBatches: 1 })).toBeNull();
    expect(ctx.db.select().from(schema.appMeta).where(eq(schema.appMeta.key, RESCORE_PROGRESS_KEY)).get()).toBeTruthy();
    const report = runRescore(ctx.db, { batchSize: 5 })!;
    expect(report.items).toBe(total);
    // Each answer got exactly one history entry, even across the restart.
    expect(items(id).every((i) => (i.score == null && i.rawScore == null) || i.scoreHistory?.length === 1)).toBe(true);
    expect(ctx.db.select().from(schema.appMeta).where(eq(schema.appMeta.key, RESCORE_PROGRESS_KEY)).get()).toBeUndefined();
  }, 120_000);
});

describe("review requests on a topic test", () => {
  test("overriding a wrong quiz answer counts it as a pass, re-grades the attempt and completes the topic", async () => {
    const QUIZ_TOPIC = "js-closures";
    setVideoLockMode(ctx.db, "warn");
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC]);
    const quiz = ctx.content.getTopic(QUIZ_TOPIC)!.topic.quiz!;
    const n = quiz.length;
    // The fewest wrong answers that fail, such that one fewer would pass.
    let wrong = 1;
    while (Math.round(((n - wrong) / n) * 100) >= QUIZ_PASS_THRESHOLD) wrong += 1;
    expect(Math.round(((n - wrong + 1) / n) * 100)).toBeGreaterThanOrEqual(QUIZ_PASS_THRESHOLD);
    const answers = Object.fromEntries(
      quiz.map((q, i) => {
        const key = correctIndicesOf(q);
        return [q.id, i < wrong ? [q.options.findIndex((_, o) => !key.includes(o))] : key];
      }),
    );
    const res = (await ctx.app.inject({ method: "POST", url: `/api/topics/${QUIZ_TOPIC}/attempt`, ...as(learner.session), payload: { kind: "quiz", answers } })).json();
    expect(res.passed).toBe(false);
    const missed = res.perQuestion.find((q: { correct: boolean }) => !q.correct);
    expect(missed.itemId).toBeTruthy();
    expect(res.attemptId).toBeTruthy();
    const right = res.perQuestion.find((q: { correct: boolean }) => q.correct);
    const ask = (refId: string) =>
      ctx.app.inject({ method: "POST", url: "/api/review-requests", ...as(learner.session), payload: { source: "topic_item", refId, attemptId: res.attemptId } });
    expect((await ask(right.itemId)).statusCode).toBe(409);
    expect((await ask(missed.itemId)).statusCode).toBe(200);

    const itemBefore = ctx.db.select().from(schema.topicTestItems).where(eq(schema.topicTestItems.id, missed.itemId)).get()!;
    const view = (await ctx.app.inject({ method: "GET", url: `/api/admin/review-requests?userId=${learner.id}`, ...as(admin) })).json().requests[0];
    expect(view.where).toMatch(/Topic test/);
    expect(view.reason).toMatch(/The right answer/);
    const decided = (await ctx.app.inject({ method: "POST", url: `/api/admin/review-requests/${view.id}/decision`, ...as(admin), payload: { decision: "override" } })).json();
    expect(decided.topicCompleted).toBe(true);

    const itemAfter = ctx.db.select().from(schema.topicTestItems).where(eq(schema.topicTestItems.id, missed.itemId)).get()!;
    expect(itemAfter.passes).toBe(itemBefore.passes + 1);
    const progress = (await ctx.app.inject({ method: "GET", url: "/api/me/progress", ...as(learner.session) })).json();
    expect(progress.progress[QUIZ_TOPIC].status).toBe("completed");
    expect(ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "review.overridden")).all()).toHaveLength(1);
  }, 120_000);
});
