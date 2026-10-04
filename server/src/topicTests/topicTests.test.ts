import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { TestItemPayload, TopicGroundingContent } from "../../../shared/topicTests";
import { CALIBRATION } from "../../../shared/topicTests";
import { correctIndicesOf } from "../content/filter";
import { schema } from "../db";
import { activeLearner, adminSession, as, createTestApp, publishPlanFor, type Session, type TestContext } from "../test/harness";
import { setVideoLockMode } from "../videos/repo";
import { calibrateAttempt } from "./calibrate";
import { emptyCounts, estimateCost, fillTopic, getRun, recheckTopic } from "./engine";
import { codeGates, formatProblems, runGates, type GateCandidate } from "./gates";
import { buildGrounding, citationProblem } from "./grounding";
import { activeCount, ensureTopicTests, payloadOf, resetTopicTestMemo, servedIdOf, topicRows } from "./repo";

let ctx: TestContext;
let admin: Session;

const QUIZ_TOPIC = "js-closures";
const QUIZ_MODULE = { trackId: "frontend", moduleId: "fe-js-core" };

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  setVideoLockMode(ctx.db, "warn");
});

afterEach(async () => {
  await ctx.close();
});

const topic = () => ctx.content.getTopic(QUIZ_TOPIC)!.topic;

/** A small hand-made grounding, so each gate can be tested against text we control. */
const grounding: TopicGroundingContent = {
  version: 1,
  topicId: "t-demo",
  title: "Closures",
  level: "intermediate",
  passages: [
    { id: "sum.p1", source: "summary", heading: "Summary", text: "A closure is a function bundled together with references to its surrounding lexical environment." },
    { id: "s1.p1", source: "section", heading: "Loops", text: "Using let in a for loop creates a fresh binding for every iteration of the loop body." },
  ],
  objectives: [{ id: "o1", text: "Explain closures", source: "derived" }],
  videos: [],
  passagesHash: "h",
};

function item(overrides: Partial<TestItemPayload> = {}): TestItemPayload {
  return {
    prompt: "Mock check: which phrasing describes what the topic teaches here?",
    options: [
      "a function bundled together with references to its surrounding lexical environment",
      "a frozen copy of every outer variable, taken at the moment the function first runs",
      "a hidden global object that keeps values alive between separate calls of any function",
    ],
    correctIndex: 0,
    explanation: "The summary defines it exactly like this.",
    citation: { passageId: "sum.p1", quote: "a function bundled together with references to its surrounding lexical environment" },
    objectiveId: "o1",
    band: "recall",
    distractorRationales: [null, "Thinks closures snapshot values", "Confuses closures with globals"],
    ...overrides,
  };
}

async function gate(payload: TestItemPayload, origin: "static" | "generated" = "generated") {
  const candidates: GateCandidate[] = [{ key: "x", origin, payload }];
  const outcomes = await runGates({ ai: ctx.ai }, grounding, candidates);
  return outcomes.get("x")!.gates;
}

describe("grounding", () => {
  test("numbered passages, derived objectives, and videos never used for questions", () => {
    const g = buildGrounding(topic());
    expect(g.passages.length).toBeGreaterThan(0);
    expect(g.passages[0].id).toBe("sum.p1");
    expect(g.objectives.length).toBeGreaterThan(0);
    expect(g.videos.length).toBeGreaterThan(0);
    expect(g.videos.every((v) => v.transcript === "none" && v.usedForQuestions === false)).toBe(true);
  });

  test("section paragraphs get stable s<n>.p<m> ids", () => {
    const g = buildGrounding({ ...topic(), sections: [{ heading: "Pitfalls", body: "First paragraph here.\n\nSecond [[term:sow|statement of work]] paragraph." }] });
    const ids = g.passages.map((p) => p.id);
    expect(ids).toContain("s1.p1");
    expect(ids).toContain("s1.p2");
    expect(g.passages.find((p) => p.id === "s1.p2")!.text).toContain("statement of work");
  });

  test("citation check: exact whitespace-normalised substring of the cited passage of this topic", () => {
    expect(citationProblem(grounding, { passageId: "sum.p1", quote: "bundled   together with\nreferences" })).toBeNull();
    expect(citationProblem(grounding, { passageId: "sum.p1", quote: "a fresh binding for every iteration" })).toMatch(/not in passage/);
    expect(citationProblem(grounding, { passageId: "s9.p9", quote: "a fresh binding for every iteration" })).toMatch(/not in this topic/);
  });
});

describe("quality gates", () => {
  test("a grounded, answerable, non-trivial item passes every gate", async () => {
    const gates = await gate(item());
    expect(gates.failures).toEqual([]);
    expect(gates.passed).toBe(true);
  });

  test("rejects an off-topic item: the quote is not in the topic", async () => {
    const gates = await gate(item({ citation: { passageId: "sum.p1", quote: "React reconciliation diffs the virtual DOM tree" } }));
    expect(gates.passed).toBe(false);
    expect(gates.relevanceCode.ok).toBe(false);
    expect(gates.hard).toBe(true);
  });

  test("rejects an unanswerable item: the blind answer from the content does not reach the key", async () => {
    const gates = await gate(
      item({
        options: ["it is always faster than a class", "it is always slower than a class", "it uses no memory at all"],
        distractorRationales: [null, "Assumes closures are slow", "Assumes closures are free"],
      }),
    );
    expect(gates.passed).toBe(false);
    expect(gates.answerable.ok).toBe(false);
  });

  test("rejects a broken answer key", async () => {
    const gates = await gate(item({ correctIndex: 1, distractorRationales: ["Defines closures", null, "Confuses closures with globals"] }));
    expect(gates.passed).toBe(false);
    expect(gates.answerable.ok).toBe(false);
  });

  test("rejects a trivial item answerable without the content", async () => {
    const gates = await gate(
      item({
        prompt: "Which is a function bundled together with references to its surrounding lexical environment?",
        options: [
          "a function bundled together with references to its surrounding lexical environment",
          "an object pool that recycles allocations whenever the garbage collector runs late",
          "a scheduler queue that defers callbacks until the current call stack has emptied",
        ],
        distractorRationales: [null, "Confuses closures with memory pooling", "Confuses closures with the event loop"],
      }),
    );
    expect(gates.passed).toBe(false);
    expect(gates.notTrivial.ok).toBe(false);
    expect(gates.notTrivial.detail).toMatch(/without the content/);
    expect(gates.answerable.ok).toBe(true);
  });

  test('rejects "all of the above", and never spends AI calls on it', async () => {
    const before = ctx.db.select().from(schema.aiCalls).all().length;
    const gates = await gate(item({ options: [...item().options.slice(0, 2), "All of the above"] }));
    expect(gates.passed).toBe(false);
    expect(gates.format.ok).toBe(false);
    expect(ctx.db.select().from(schema.aiCalls).all().length).toBe(before);
  });

  test("format rules: option count, duplicates, single-select key, double negatives, missing rationales", () => {
    expect(formatProblems(item({ options: ["a function bundled", "b thing"] }))).toContain("2 options (needs 3–5)");
    expect(formatProblems(item({ options: ["same", "Same", "other"] }))).toContain("duplicate options");
    expect(formatProblems(item({ correctIndex: 7 }))).toContain("the key points at no option");
    expect(formatProblems(item({ prompt: "Which of these is not a closure that does not leak?" })).join()).toMatch(/negative/);
    const noRationale = codeGates(grounding, { key: "y", origin: "generated", payload: item({ distractorRationales: [null, "", "x"] }) });
    expect(noRationale.distractors.ok).toBe(false);
  });

  test("the key may not be the longest option by more than 30%", () => {
    const gates = codeGates(grounding, {
      key: "z",
      origin: "generated",
      payload: item({ options: [item().options[0], "a copy", "a global"] }),
    });
    expect(gates.notTrivial.ok).toBe(false);
  });
});

describe("static import, serving and generation", () => {
  test("the static import is idempotent, keyed by topic and source id", () => {
    const quiz = topic().quiz!;
    ensureTopicTests(ctx.db, topic());
    resetTopicTestMemo(ctx.db);
    ctx.db.update(schema.topicGrounding).set({ hash: "stale" }).where(eq(schema.topicGrounding.topicId, QUIZ_TOPIC)).run();
    ensureTopicTests(ctx.db, topic());
    const rows = topicRows(ctx.db, QUIZ_TOPIC);
    expect(rows).toHaveLength(quiz.length);
    expect(rows.every((r) => r.origin === "static" && r.status === "active")).toBe(true);
    expect(rows.map(servedIdOf)).toEqual(quiz.map((q) => q.id));
  });

  test("only active items are served, in the same shape", async () => {
    const learner = await activeLearner(ctx, admin);
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC]);
    ensureTopicTests(ctx.db, topic());
    const retired = topicRows(ctx.db, QUIZ_TOPIC)[0];
    ctx.db.update(schema.topicTestItems).set({ status: "retired" }).where(eq(schema.topicTestItems.id, retired.id)).run();

    const res = await ctx.app.inject({ method: "GET", url: `/api/content/modules/${QUIZ_MODULE.trackId}/${QUIZ_MODULE.moduleId}`, ...as(learner.session) });
    const served = res.json().topics.find((t: { id: string }) => t.id === QUIZ_TOPIC);
    expect(served.quiz).toHaveLength(topic().quiz!.length - 1);
    expect(served.quiz.map((q: { id: string }) => q.id)).not.toContain(retired.sourceId);
    expect(res.body).not.toContain("correctIndices");
    expect(Object.keys(served.quiz[0]).sort()).toEqual(["id", "multi", "options", "prompt"]);
  });

  test("generation keeps only gate-passing items, each with a valid citation", async () => {
    const t = topic();
    const g = ensureTopicTests(ctx.db, t);
    const result = await fillTopic({ db: ctx.db, ai: ctx.ai, content: ctx.content, sandbox: ctx.app.sandbox }, t, 6);
    expect(result.added).toBe(6);
    // The mock writes an "all of the above" item and an off-topic citation in round 1.
    expect(result.dropped).toBeGreaterThanOrEqual(2);
    const generated = topicRows(ctx.db, QUIZ_TOPIC, ["active"]).filter((r) => r.origin === "generated");
    expect(generated).toHaveLength(6);
    for (const row of generated) {
      const payload = payloadOf(row);
      expect(citationProblem(g, payload.citation)).toBeNull();
      expect(formatProblems(payload)).toEqual([]);
      expect(payload.objectiveId).toBeTruthy();
      expect(payload.band).toBeTruthy();
      expect((row.gates as { passed: boolean }).passed).toBe(true);
    }
  });
});

describe("grading and calibration", () => {
  let learner: { id: string; username: string; session: Session };
  beforeEach(async () => {
    learner = await activeLearner(ctx, admin);
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC]);
  });

  const allCorrect = () => Object.fromEntries(topic().quiz!.map((q) => [q.id, correctIndicesOf(q)]));
  const submit = (answers: Record<string, number[]>, session = learner.session) =>
    ctx.app.inject({ method: "POST", url: `/api/topics/${QUIZ_TOPIC}/attempt`, ...as(session), payload: { kind: "quiz", answers } });

  test("grades against stored items and counts each learner's first exposure only", async () => {
    const first = await submit(allCorrect());
    expect(first.json().passed).toBe(true);
    let rows = topicRows(ctx.db, QUIZ_TOPIC);
    expect(rows.every((r) => r.attempts === 1 && r.passes === 1)).toBe(true);
    // Every other item right, so every attempt is "strong".
    expect(rows.every((r) => r.strongAttempts === 1 && r.strongFails === 0)).toBe(true);

    await submit(allCorrect());
    rows = topicRows(ctx.db, QUIZ_TOPIC);
    expect(rows.every((r) => r.attempts === 1)).toBe(true);
  });

  test("staff attempts never count", async () => {
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC]);
    await submit(allCorrect(), admin);
    expect(topicRows(ctx.db, QUIZ_TOPIC).every((r) => r.attempts === 0)).toBe(true);
  });

  test("an admin's edit to the key is what grading uses, and the result names the cited section", async () => {
    ensureTopicTests(ctx.db, topic());
    const row = topicRows(ctx.db, QUIZ_TOPIC)[0];
    const payload = payloadOf(row);
    ctx.db
      .update(schema.topicTestItems)
      .set({ item: { ...payload, citation: { passageId: "sum.p1", quote: "x".repeat(10) } } as unknown as Record<string, unknown> })
      .where(eq(schema.topicTestItems.id, row.id))
      .run();
    const res = await submit(allCorrect());
    const entry = res.json().perQuestion.find((q: { id: string }) => q.id === row.sourceId);
    expect(entry.source).toBe("Summary");
  });

  test("flags and auto-retires after 20 attempts; too-easy items are flagged but kept", () => {
    const t = topic();
    ensureTopicTests(ctx.db, t);
    const [hard, easy, strongFail, ...rest] = topicRows(ctx.db, QUIZ_TOPIC);
    ctx.db.update(schema.topicTestItems).set({ attempts: 19, passes: 0 }).where(eq(schema.topicTestItems.id, hard.id)).run();
    ctx.db.update(schema.topicTestItems).set({ attempts: 19, passes: 19 }).where(eq(schema.topicTestItems.id, easy.id)).run();
    ctx.db.update(schema.topicTestItems).set({ attempts: 8, passes: 6, strongAttempts: 4, strongFails: 2 }).where(eq(schema.topicTestItems.id, strongFail.id)).run();

    const results = [
      { rowId: hard.id, servedId: servedIdOf(hard), correct: false },
      { rowId: easy.id, servedId: servedIdOf(easy), correct: true },
      { rowId: strongFail.id, servedId: servedIdOf(strongFail), correct: false },
      ...rest.map((r) => ({ rowId: r.id, servedId: servedIdOf(r), correct: true })),
    ];
    calibrateAttempt(ctx.db, t, results);

    const byId = new Map(topicRows(ctx.db, QUIZ_TOPIC).map((r) => [r.id, r]));
    expect(byId.get(hard.id)!.status).toBe("retired");
    expect(byId.get(hard.id)!.retiredReason).toMatch(/auto-retired after 20 attempts/);
    expect(byId.get(easy.id)!.status).toBe("active");
    expect(byId.get(easy.id)!.flagReason).toBe("review (too easy)");
    // 8 of 10 others right is below the strong band, so this one is not a strong attempt...
    expect(byId.get(strongFail.id)!.strongAttempts).toBe(4);
    expect(byId.get(strongFail.id)!.status).toBe("active");
    expect(CALIBRATION.autoRetireAfter).toBe(20);
  });

  test("strong learners failing flags an item", () => {
    const t = topic();
    ensureTopicTests(ctx.db, t);
    const [target, ...rest] = topicRows(ctx.db, QUIZ_TOPIC);
    ctx.db.update(schema.topicTestItems).set({ attempts: 8, passes: 6, strongAttempts: 4, strongFails: 2 }).where(eq(schema.topicTestItems.id, target.id)).run();
    calibrateAttempt(ctx.db, t, [
      { rowId: target.id, servedId: servedIdOf(target), correct: false },
      ...rest.map((r) => ({ rowId: r.id, servedId: servedIdOf(r), correct: true })),
    ]);
    const row = topicRows(ctx.db, QUIZ_TOPIC).find((r) => r.id === target.id)!;
    expect(row.strongAttempts).toBe(5);
    expect(row.flagReason).toMatch(/strong learners fail \(3 of 5\)/);
    expect(row.status).toBe("active");
  });

  test("never retires below the minimum: queues a replacement first, then retires once it lands", async () => {
    const t = topic();
    ensureTopicTests(ctx.db, t);
    const rows = topicRows(ctx.db, QUIZ_TOPIC);
    // Leave exactly the minimum (5) active.
    for (const r of rows.slice(5)) ctx.db.update(schema.topicTestItems).set({ status: "retired" }).where(eq(schema.topicTestItems.id, r.id)).run();
    const [hard, ...others] = rows.slice(0, 5);
    ctx.db.update(schema.topicTestItems).set({ attempts: 19, passes: 0 }).where(eq(schema.topicTestItems.id, hard.id)).run();
    calibrateAttempt(ctx.db, t, [
      { rowId: hard.id, servedId: servedIdOf(hard), correct: false },
      ...others.map((r) => ({ rowId: r.id, servedId: servedIdOf(r), correct: true })),
    ]);
    expect(topicRows(ctx.db, QUIZ_TOPIC).find((r) => r.id === hard.id)!.status).toBe("active");
    expect(topicRows(ctx.db, QUIZ_TOPIC).find((r) => r.id === hard.id)!.flagReason).toMatch(/retire pending/);
    const queued = ctx.db.select().from(schema.jobs).where(eq(schema.jobs.type, "topic_tests.fill")).all();
    expect(queued).toHaveLength(1);

    await ctx.drainJobs();
    expect(topicRows(ctx.db, QUIZ_TOPIC).find((r) => r.id === hard.id)!.status).toBe("retired");
    expect(activeCount(ctx.db, QUIZ_TOPIC)).toBeGreaterThanOrEqual(5);
  });

  test("existing learners' progress is untouched by the import, retirement and re-check", async () => {
    await submit(allCorrect());
    const before = ctx.db.select().from(schema.topicProgress).where(eq(schema.topicProgress.userId, learner.id)).all();
    expect(before[0].status).toBe("completed");

    resetTopicTestMemo(ctx.db);
    ctx.db.update(schema.topicGrounding).set({ hash: "stale" }).run();
    ensureTopicTests(ctx.db, topic());
    const run = await ctx.app.inject({ method: "POST", url: "/api/admin/topic-tests/recheck", ...as(admin), payload: { kind: "topic", id: QUIZ_TOPIC } });
    expect(run.statusCode).toBe(200);
    await ctx.drainJobs();

    const after = ctx.db.select().from(schema.topicProgress).where(eq(schema.topicProgress.userId, learner.id)).all();
    expect(after).toEqual(before);
  });
});

describe("re-check job", () => {
  test("checks every active item, retires failures, regenerates to target and reports counts", async () => {
    const t = topic();
    ensureTopicTests(ctx.db, t);
    const staticCount = t.quiz!.length;
    const res = await ctx.app.inject({ method: "POST", url: "/api/admin/topic-tests/recheck", ...as(admin), payload: { kind: "module", id: QUIZ_MODULE.moduleId } });
    expect(res.statusCode).toBe(200);
    const topics = res.json().run.topicIds.length;
    await ctx.drainJobs();

    const run = getRun(ctx.db)!;
    expect(run.status).toBe("done");
    expect(run.cursor).toBe(topics);
    expect(run.counts.topics).toBe(topics);
    expect(run.counts.checked).toBeGreaterThanOrEqual(staticCount);
    expect(run.counts.retired + run.counts.keptBelowMinimum).toBeGreaterThan(0);
    expect(run.counts.regenerated).toBeGreaterThan(0);

    // The closures topic is back at its target, every live generated item cites its own text.
    const g = ensureTopicTests(ctx.db, t);
    const active = topicRows(ctx.db, QUIZ_TOPIC, ["active"]);
    expect(active.length).toBeGreaterThanOrEqual(5);
    for (const row of active.filter((r) => r.origin === "generated")) expect(citationProblem(g, payloadOf(row).citation)).toBeNull();
    // Every checked item has its gate results recorded.
    const checked = ctx.db.select().from(schema.topicTestItems).where(and(eq(schema.topicTestItems.topicId, QUIZ_TOPIC), eq(schema.topicTestItems.origin, "static"))).all();
    expect(checked.every((r) => r.gates !== null)).toBe(true);

    const summary = await ctx.app.inject({ method: "GET", url: "/api/admin/topic-tests/summary", ...as(admin) });
    expect(summary.json().run.status).toBe("done");
    expect(summary.json().estimate.totalUsd).toBeGreaterThan(0);
  });

  test("D9: every active item cites its passage: generated always, static once the re-check reaches them", async () => {
    const t = topic();
    const g = ensureTopicTests(ctx.db, t);
    const learner = await activeLearner(ctx, admin);
    await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC]);
    const answerAll = async () => {
      const served = await ctx.app.inject({ method: "GET", url: `/api/content/modules/${QUIZ_MODULE.trackId}/${QUIZ_MODULE.moduleId}`, ...as(learner.session) });
      const quiz = served.json().topics.find((x: { id: string }) => x.id === QUIZ_TOPIC).quiz as { id: string }[];
      const res = await ctx.app.inject({ method: "POST", url: `/api/topics/${QUIZ_TOPIC}/attempt`, ...as(learner.session), payload: { kind: "quiz", answers: Object.fromEntries(quiz.map((q) => [q.id, [0]])) } });
      return { quiz, perQuestion: res.json().perQuestion as { id: string; source?: string; sourcePending?: boolean }[] };
    };

    // Before the re-check: the imported static items are active, cite nothing, and say so.
    const before = topicRows(ctx.db, QUIZ_TOPIC, ["active"]);
    expect(before.length).toBe(t.quiz!.length);
    expect(before.every((r) => r.origin === "static" && !payloadOf(r).citation && r.gates === null)).toBe(true);
    const first = await answerAll();
    expect(first.perQuestion.every((q) => q.sourcePending === true && q.source === undefined)).toBe(true);

    // The re-check (mock AI) for this one topic.
    await ctx.app.inject({ method: "POST", url: "/api/admin/topic-tests/recheck", ...as(admin), payload: { kind: "topic", id: QUIZ_TOPIC } });
    await ctx.drainJobs();
    expect(getRun(ctx.db)!.status).toBe("done");

    // After: every active item, static or generated, has a citation that code verifies against this
    // topic's own passages, and has passed the gates.
    const after = topicRows(ctx.db, QUIZ_TOPIC, ["active"]);
    expect(after.length).toBeGreaterThanOrEqual(5);
    for (const row of after) {
      expect(citationProblem(g, payloadOf(row).citation)).toBeNull();
      expect((row.gates as { passed: boolean }).passed).toBe(true);
    }
    // And the learner sees "From: <section>" on every served question, never "awaiting re-check".
    const headings = new Set(g.passages.map((p) => p.heading));
    const second = await answerAll();
    expect(second.quiz.length).toBe(after.length);
    for (const q of second.perQuestion) {
      expect(q.sourcePending).toBeUndefined();
      expect(headings.has(q.source!)).toBe(true);
    }
  });

  test("D9: a failing item with no supporting passage is withdrawn (flagged), never kept live to hold the minimum", async () => {
    const t = topic();
    ensureTopicTests(ctx.db, t);
    // The writer returns nothing, so no replacement can land and every failure would be "kept".
    const ai = new Proxy(ctx.ai, {
      get(target, prop, receiver) {
        if (prop !== "generateJson") return Reflect.get(target, prop, receiver);
        return (req: { task?: string }) =>
          req.task === "topic_test_write" ? Promise.resolve({ data: { items: [] }, usage: null }) : target.generateJson(req as never);
      },
    });
    const counts = emptyCounts();
    await recheckTopic({ db: ctx.db, ai, content: ctx.content, sandbox: ctx.app.sandbox }, t, counts);
    const g = ensureTopicTests(ctx.db, t);
    const rows = topicRows(ctx.db, QUIZ_TOPIC);
    const active = rows.filter((r) => r.status === "active");
    for (const row of active) expect(citationProblem(g, payloadOf(row).citation)).toBeNull();
    const withdrawn = rows.filter((r) => r.status === "flagged");
    expect(counts.withdrawnUncited).toBe(withdrawn.length);
    for (const row of withdrawn) {
      expect(citationProblem(g, payloadOf(row).citation)).not.toBeNull();
      expect(row.flagReason).toMatch(/no passage of this topic supports it/);
    }
    // The mock checker supports none of this topic's hand-written static items: half are retired down
    // to the minimum, the rest are withdrawn rather than kept live.
    expect(counts.keptBelowMinimum).toBe(0);
    expect(withdrawn.length).toBeGreaterThan(0);
  });

  test("stops at the budget cap and can resume", async () => {
    ctx.db.insert(schema.appMeta).values({ key: "topic_tests.recheck.budget_usd", value: "1", updatedAt: Date.now() }).run();
    const res = await ctx.app.inject({ method: "POST", url: "/api/admin/topic-tests/recheck", ...as(admin), payload: { kind: "topic", id: QUIZ_TOPIC } });
    const startedAt = res.json().run.startedAt;
    // Pretend the run already spent $2 on topic-test calls.
    ctx.db
      .insert(schema.aiCalls)
      .values({ id: "spent", provider: "mock", model: "claude-haiku-4-5-20251001", purpose: "topic_test_check", task: "topic_test_answer", inputTokens: 0, outputTokens: 0, costMicros: 2_000_000, latencyMs: 1, ok: true, createdAt: startedAt + 1 } as typeof schema.aiCalls.$inferInsert)
      .run();
    await ctx.drainJobs();
    expect(getRun(ctx.db)!.status).toBe("paused_budget");
    expect(getRun(ctx.db)!.cursor).toBe(0);
  });

  test("the run endpoint is superadmin only and learners cannot reach any of it", async () => {
    const learner = await activeLearner(ctx, admin);
    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/topic-tests/summary", ...as(learner.session) });
    expect(res.statusCode).toBe(403);
  });

  test("the full-run estimate is priced from the pricing table", () => {
    const estimate = estimateCost(900, 8800, 0.5);
    expect(estimate.checkUsd).toBeGreaterThan(0);
    expect(estimate.generateUsd).toBeGreaterThan(0);
    expect(estimate.totalUsd).toBeCloseTo(estimate.checkUsd + estimate.generateUsd, 1);
  });
});
