import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { QUIZ_PASS_THRESHOLD } from "../../../shared/content";
import { correctIndicesOf, visibleTestCount } from "../content/filter";
import {
  activeLearner,
  adminSession,
  as,
  createTestApp,
  publishPlanFor,
  type Session,
  type TestContext,
} from "../test/harness";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };

/** A real quiz topic and a real code topic, so these tests run against shipped content. */
const QUIZ_TOPIC = "js-closures";
const QUIZ_MODULE = { trackId: "frontend", moduleId: "fe-js-core" };
const CODE_TOPIC = "js-debounce-throttle";
const CODE_MODULE = { trackId: "frontend", moduleId: "fe-js-advanced" };

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
});

afterEach(async () => {
  await ctx.close();
});

describe("no answer keys reach a learner", () => {
  beforeEach(async () => {
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC, CODE_TOPIC]);
  });

  test("a quiz module response contains no correct answers or explanations", async () => {
    const res = await ctx.app.inject({
      method: "GET",
      url: `/api/content/modules/${QUIZ_MODULE.trackId}/${QUIZ_MODULE.moduleId}`,
      ...as(learner.session),
    });
    expect(res.statusCode).toBe(200);

    // Checked against the raw body, not the parsed object: a key nested anywhere at all would
    // still show up here.
    expect(res.body).not.toContain("correctIndex");
    expect(res.body).not.toContain("correctIndices");
    expect(res.body).not.toContain("explanation");
    expect(res.body).not.toContain("isEdgeCaseOrInterviewQuestion");

    const topic = res.json().topics.find((t: { id: string }) => t.id === QUIZ_TOPIC);
    expect(topic.quiz.length).toBeGreaterThan(5);
    for (const question of topic.quiz) {
      expect(Object.keys(question).sort()).toEqual(["id", "multi", "options", "prompt"]);
    }
  });

  test("the real explanations exist in the source content, so the check above is meaningful", () => {
    const authored = ctx.content.getTopic(QUIZ_TOPIC)!;
    expect(authored.topic.quiz!.length).toBeGreaterThan(5);
    expect(authored.topic.quiz!.every((q) => q.explanation.length > 10)).toBe(true);
  });

  test("a code challenge exposes only the visible tests, and says how many are hidden", async () => {
    const res = await ctx.app.inject({
      method: "GET",
      url: `/api/content/modules/${CODE_MODULE.trackId}/${CODE_MODULE.moduleId}`,
      ...as(learner.session),
    });
    const topic = res.json().topics.find((t: { id: string }) => t.id === CODE_TOPIC);
    const authored = ctx.content.getTopic(CODE_TOPIC)!.topic.codeChallenge!;
    const expectedVisible = visibleTestCount(authored.testCases.length);

    expect(topic.codeChallenge.visibleTests).toHaveLength(expectedVisible);
    expect(topic.codeChallenge.hiddenTestCount).toBe(authored.testCases.length - expectedVisible);
    expect(res.body).not.toContain("testCases");

    // A hidden test's description must not leak either — it often describes the edge case.
    const hidden = authored.testCases.slice(expectedVisible);
    for (const test of hidden) {
      expect(res.body).not.toContain(test.description);
    }
  });

  test("a superadmin gets the keys and every test", async () => {
    const res = await ctx.app.inject({
      method: "GET",
      url: `/api/content/modules/${CODE_MODULE.trackId}/${CODE_MODULE.moduleId}`,
      ...as(admin),
    });
    const topic = res.json().topics.find((t: { id: string }) => t.id === CODE_TOPIC);
    const authored = ctx.content.getTopic(CODE_TOPIC)!.topic.codeChallenge!;
    expect(topic.codeChallenge.visibleTests).toHaveLength(authored.testCases.length);
    expect(topic.codeChallenge.hiddenTestCount).toBe(0);

    const quizRes = await ctx.app.inject({
      method: "GET",
      url: `/api/content/modules/${QUIZ_MODULE.trackId}/${QUIZ_MODULE.moduleId}`,
      ...as(admin),
    });
    const quizTopic = quizRes.json().topics.find((t: { id: string }) => t.id === QUIZ_TOPIC);
    expect(quizTopic.quiz[0].correctIndices).toBeDefined();
    expect(quizTopic.quiz[0].explanation).toBeTruthy();
  });
});

describe("plan gating", () => {
  test("a learner with no plan sees nothing at all", async () => {
    const manifest = await ctx.app.inject({ method: "GET", url: "/api/me/manifest", ...as(learner.session) });
    expect(manifest.json().tracks).toEqual([]);
    expect(manifest.json().unfiltered).toBe(false);

    const mod = await ctx.app.inject({
      method: "GET",
      url: `/api/content/modules/${QUIZ_MODULE.trackId}/${QUIZ_MODULE.moduleId}`,
      ...as(learner.session),
    });
    expect(mod.statusCode).toBe(404);
  });

  test("the manifest is pruned to the plan: topics, modules and tracks", async () => {
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC]);
    const res = await ctx.app.inject({ method: "GET", url: "/api/me/manifest", ...as(learner.session) });
    const tracks = res.json().tracks;

    expect(tracks).toHaveLength(1);
    expect(tracks[0].id).toBe("frontend");
    expect(tracks[0].modules).toHaveLength(1);
    expect(tracks[0].modules[0].id).toBe(QUIZ_MODULE.moduleId);
    expect(tracks[0].modules[0].topics.map((t: { id: string }) => t.id)).toEqual([QUIZ_TOPIC]);
    expect(res.json().planTopicIds).toEqual([QUIZ_TOPIC]);
    expect(res.json().planVersion).toBe(1);
  });

  test("a module in the plan returns only the assigned topics, not its siblings", async () => {
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC]);
    const res = await ctx.app.inject({
      method: "GET",
      url: `/api/content/modules/${QUIZ_MODULE.trackId}/${QUIZ_MODULE.moduleId}`,
      ...as(learner.session),
    });
    const ids = res.json().topics.map((t: { id: string }) => t.id);
    expect(ids).toEqual([QUIZ_TOPIC]);
    // The real module has many more topics; none of them may come back.
    expect(ctx.content.getModule(QUIZ_MODULE.trackId, QUIZ_MODULE.moduleId)!.topics.length).toBeGreaterThan(5);
  });

  test("a module with no assigned topics is 404, not 403, so it cannot be enumerated", async () => {
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC]);
    const res = await ctx.app.inject({
      method: "GET",
      url: "/api/content/modules/backend/be-node-core",
      ...as(learner.session),
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("not_found");
  });

  test("a superadmin sees the whole curriculum", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/api/me/manifest", ...as(admin) });
    expect(res.json().unfiltered).toBe(true);
    expect(res.json().tracks).toHaveLength(ctx.content.manifest.length);
  });

  test("a plan is stored in curriculum order regardless of the order it was submitted in", async () => {
    const module = ctx.content.getModule(QUIZ_MODULE.trackId, QUIZ_MODULE.moduleId)!;
    const inOrder = module.topics.slice(0, 4).map((t) => t.id);
    await publishPlanFor(ctx, admin, learner.id, [...inOrder].reverse());

    const res = await ctx.app.inject({ method: "GET", url: "/api/me/plan", ...as(learner.session) });
    expect(res.json().plan.topicIds).toEqual(inOrder);
  });

  test("publishing a plan with unknown topic ids is rejected rather than silently trimmed", async () => {
    const res = await ctx.app.inject({
      method: "PUT",
      url: `/api/admin/users/${learner.id}/plan`,
      ...as(admin),
      payload: { topicIds: [QUIZ_TOPIC, "not-a-real-topic"] },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/don't exist/);
  });

  test("publishing appends a version instead of mutating the last one", async () => {
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC]);
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC, CODE_TOPIC]);

    const res = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${learner.id}/plan`, ...as(admin) });
    expect(res.json().plan.version).toBe(2);
    expect(res.json().history).toHaveLength(2);
    expect(res.json().history[1].topicIds).toEqual([QUIZ_TOPIC]);
  });
});

describe("server-side quiz grading", () => {
  beforeEach(async () => {
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC]);
  });

  const allCorrect = () => {
    const quiz = ctx.content.getTopic(QUIZ_TOPIC)!.topic.quiz!;
    return Object.fromEntries(quiz.map((q) => [q.id, correctIndicesOf(q)]));
  };

  test("a perfect attempt scores 100 and completes the topic", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/topics/${QUIZ_TOPIC}/attempt`,
      ...as(learner.session),
      payload: { kind: "quiz", answers: allCorrect() },
    });
    expect(res.statusCode).toBe(200);
    const result = res.json();
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.perQuestion.every((q: { correct: boolean }) => q.correct)).toBe(true);

    const progress = await ctx.app.inject({ method: "GET", url: "/api/me/progress", ...as(learner.session) });
    expect(progress.json().progress[QUIZ_TOPIC].status).toBe("completed");
    expect(progress.json().progress[QUIZ_TOPIC].bestScore).toBe(100);
  });

  test("the result carries the key back, so the learner can learn from it — but only after submitting", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/topics/${QUIZ_TOPIC}/attempt`,
      ...as(learner.session),
      payload: { kind: "quiz", answers: allCorrect() },
    });
    const first = res.json().perQuestion[0];
    expect(first.correctIndices.length).toBeGreaterThan(0);
    expect(first.explanation).toBeTruthy();
  });

  test("an empty attempt scores 0 and does not complete the topic", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/topics/${QUIZ_TOPIC}/attempt`,
      ...as(learner.session),
      payload: { kind: "quiz", answers: {} },
    });
    expect(res.json().score).toBe(0);
    expect(res.json().passed).toBe(false);

    const progress = await ctx.app.inject({ method: "GET", url: "/api/me/progress", ...as(learner.session) });
    expect(progress.json().progress[QUIZ_TOPIC].status).toBe("in-progress");
    expect(progress.json().progress[QUIZ_TOPIC].attempts).toBe(1);
  });

  test(`the ${QUIZ_PASS_THRESHOLD}% threshold is enforced on the server, on both sides of the line`, async () => {
    const quiz = ctx.content.getTopic(QUIZ_TOPIC)!.topic.quiz!;

    const spoil = (count: number) => {
      const answers = allCorrect();
      for (let i = 0; i < count; i++) {
        const question = quiz[i];
        const correct = correctIndicesOf(question);
        const wrong = question.options.map((_, index) => index).find((index) => !correct.includes(index));
        answers[question.id] = [wrong!];
      }
      return answers;
    };

    const submit = async (answers: Record<string, number[]>) => {
      const res = await ctx.app.inject({
        method: "POST",
        url: `/api/topics/${QUIZ_TOPIC}/attempt`,
        ...as(learner.session),
        payload: { kind: "quiz", answers },
      });
      return res.json() as { score: number; passed: boolean };
    };

    // The largest number of wrong answers that still scores at or above the threshold, and one more.
    const atLimit = Math.floor((quiz.length * (100 - QUIZ_PASS_THRESHOLD)) / 100);

    const passing = await submit(spoil(atLimit));
    expect(passing.score).toBeGreaterThanOrEqual(QUIZ_PASS_THRESHOLD);
    expect(passing.passed).toBe(true);

    const failing = await submit(spoil(atLimit + 1));
    expect(failing.score).toBeLessThan(QUIZ_PASS_THRESHOLD);
    expect(failing.passed).toBe(false);
  });

  test("a multi-select question is all-or-nothing", async () => {
    const quiz = ctx.content.getTopic(QUIZ_TOPIC)!.topic.quiz!;
    const multi = quiz.find((q) => (q.correctIndices?.length ?? 0) > 1);
    expect(multi, "this topic should have a multi-select question").toBeDefined();

    const answers = allCorrect();
    answers[multi!.id] = correctIndicesOf(multi!).slice(0, -1); // one short
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/topics/${QUIZ_TOPIC}/attempt`,
      ...as(learner.session),
      payload: { kind: "quiz", answers },
    });
    const graded = res.json().perQuestion.find((q: { id: string }) => q.id === multi!.id);
    expect(graded.correct).toBe(false);
  });

  test("a later failed retry never un-completes a topic", async () => {
    await ctx.app.inject({
      method: "POST",
      url: `/api/topics/${QUIZ_TOPIC}/attempt`,
      ...as(learner.session),
      payload: { kind: "quiz", answers: allCorrect() },
    });
    await ctx.app.inject({
      method: "POST",
      url: `/api/topics/${QUIZ_TOPIC}/attempt`,
      ...as(learner.session),
      payload: { kind: "quiz", answers: {} },
    });

    const progress = await ctx.app.inject({ method: "GET", url: "/api/me/progress", ...as(learner.session) });
    const entry = progress.json().progress[QUIZ_TOPIC];
    expect(entry.status).toBe("completed");
    expect(entry.bestScore).toBe(100);
    expect(entry.attempts).toBe(2);
  });

  test("an unassigned topic cannot be attempted", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/topics/js-event-loop/attempt",
      ...as(learner.session),
      payload: { kind: "quiz", answers: {} },
    });
    expect(res.statusCode).toBe(404);
  });

  test("submitting code to a quiz topic is rejected", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/topics/${QUIZ_TOPIC}/attempt`,
      ...as(learner.session),
      payload: { kind: "code", code: "function x() {}" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("server-side code grading", () => {
  beforeEach(async () => {
    await publishPlanFor(ctx, admin, learner.id, [CODE_TOPIC]);
  });

  test("the untouched starter code fails, and hidden results carry no data", async () => {
    const challenge = ctx.content.getTopic(CODE_TOPIC)!.topic.codeChallenge!;
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/topics/${CODE_TOPIC}/attempt`,
      ...as(learner.session),
      payload: { kind: "code", code: challenge.starterCode },
    });

    const result = res.json();
    expect(result.passed).toBe(false);
    expect(result.total).toBe(challenge.testCases.length);

    const hidden = result.results.filter((r: { hidden: boolean }) => r.hidden);
    expect(hidden.length).toBeGreaterThan(0);
    for (const entry of hidden) {
      expect(entry.expected).toBeUndefined();
      expect(entry.actual).toBeUndefined();
      expect(entry.error).toBeUndefined();
      expect(entry.description).toMatch(/^Hidden test \d+$/);
    }
  });

  test("the reference solution passes every test, including the hidden ones", async () => {
    const solution = await import("node:fs").then((fs) =>
      fs.readFileSync(`content-tests/solutions/${CODE_TOPIC}.js`, "utf8"),
    );
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/topics/${CODE_TOPIC}/attempt`,
      ...as(learner.session),
      payload: { kind: "code", code: solution },
    });

    const result = res.json();
    expect(result.passed).toBe(true);
    expect(result.passedCount).toBe(result.total);
    expect(result.score).toBe(100);

    const progress = await ctx.app.inject({ method: "GET", url: "/api/me/progress", ...as(learner.session) });
    expect(progress.json().progress[CODE_TOPIC].status).toBe("completed");
  });

  test("passing only the visible tests is not a pass", async () => {
    const challenge = ctx.content.getTopic(CODE_TOPIC)!.topic.codeChallenge!;
    const visible = visibleTestCount(challenge.testCases.length);
    expect(challenge.testCases.length).toBeGreaterThan(visible);

    // A "solution" that hard-codes the visible answers: exactly what hidden tests exist to catch.
    const cheat = `
      const answers = ${JSON.stringify(challenge.testCases.slice(0, visible).map((t) => ({ args: t.args, expected: t.expected })))};
      function ${challenge.functionName}(...args) {
        const key = JSON.stringify(args);
        const hit = answers.find((a) => JSON.stringify(a.args) === key);
        return hit ? hit.expected : null;
      }
    `;
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/topics/${CODE_TOPIC}/attempt`,
      ...as(learner.session),
      payload: { kind: "code", code: cheat },
    });

    const result = res.json();
    expect(result.passed).toBe(false);
    expect(result.results.filter((r: { hidden: boolean; passed: boolean }) => !r.hidden && r.passed).length).toBe(visible);
  });

  test("a syntax error is reported without a 500", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/topics/${CODE_TOPIC}/attempt`,
      ...as(learner.session),
      payload: { kind: "code", code: "function ( {" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().compileError).toBeTruthy();
    expect(res.json().passed).toBe(false);
  });
});

describe("progress", () => {
  test("opening a topic marks it started, and only if it is assigned", async () => {
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC]);

    const ok = await ctx.app.inject({
      method: "POST",
      url: "/api/me/progress/start",
      ...as(learner.session),
      payload: { topicId: QUIZ_TOPIC },
    });
    expect(ok.statusCode).toBe(200);

    const blocked = await ctx.app.inject({
      method: "POST",
      url: "/api/me/progress/start",
      ...as(learner.session),
      payload: { topicId: CODE_TOPIC },
    });
    expect(blocked.statusCode).toBe(404);

    const progress = await ctx.app.inject({ method: "GET", url: "/api/me/progress", ...as(learner.session) });
    expect(Object.keys(progress.json().progress)).toEqual([QUIZ_TOPIC]);
  });

  test("progress survives a topic being removed from the plan", async () => {
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC, CODE_TOPIC]);
    const quiz = ctx.content.getTopic(QUIZ_TOPIC)!.topic.quiz!;
    await ctx.app.inject({
      method: "POST",
      url: `/api/topics/${QUIZ_TOPIC}/attempt`,
      ...as(learner.session),
      payload: { kind: "quiz", answers: Object.fromEntries(quiz.map((q) => [q.id, correctIndicesOf(q)])) },
    });

    await publishPlanFor(ctx, admin, learner.id, [CODE_TOPIC]);

    const admins = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${learner.id}/progress`, ...as(admin) });
    expect(admins.json().progress[QUIZ_TOPIC].status).toBe("completed");
  });

  test("one learner's progress is never visible to another", async () => {
    const other = await activeLearner(ctx, admin, "learner.two");
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC]);
    await publishPlanFor(ctx, admin, other.id, [QUIZ_TOPIC]);

    await ctx.app.inject({
      method: "POST",
      url: "/api/me/progress/start",
      ...as(learner.session),
      payload: { topicId: QUIZ_TOPIC },
    });

    const theirs = await ctx.app.inject({ method: "GET", url: "/api/me/progress", ...as(other.session) });
    expect(theirs.json().progress).toEqual({});
  });
});
