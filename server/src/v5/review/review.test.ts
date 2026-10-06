import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { REVIEW_SESSION_XP, SESSION_BUDGET_SEC } from "../../../../shared/review";
import { correctIndicesOf } from "../../content/filter";
import { schema } from "../../db";
import { activeLearner, adminSession, as, createTestApp, publishPlanFor, type Session, type TestContext } from "../../test/harness";
import { setVideoLockMode } from "../../videos/repo";
import { HANDBOOK_MIGRATION_KEY, migrateHandbookFlashcards, syncAll } from "./cards";
import { cardFromLeitner, fromStored, newCard, previewIntervals, rate } from "./scheduler";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };

const QUIZ_TOPIC = "js-closures";

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
  setVideoLockMode(ctx.db, "warn");
  await publishPlanFor(ctx, admin, learner.id, [QUIZ_TOPIC]);
});

afterEach(async () => {
  await ctx.close();
});

const get = (url: string, session = learner.session) => ctx.app.inject({ method: "GET", url, ...as(session) });
const post = (url: string, payload: unknown, session = learner.session) => ctx.app.inject({ method: "POST", url, payload: payload as object, ...as(session) });

/** All right except the first question, which gets a wrong option. */
async function oneWrongAttempt() {
  const quiz = ctx.content.getTopic(QUIZ_TOPIC)!.topic.quiz!;
  const answers = Object.fromEntries(quiz.map((q) => [q.id, correctIndicesOf(q)]));
  const first = quiz[0];
  const right = correctIndicesOf(first);
  answers[first.id] = [first.options.findIndex((_, i) => !right.includes(i))];
  const res = await post(`/api/topics/${QUIZ_TOPIC}/attempt`, { kind: "quiz", answers });
  expect(res.statusCode).toBe(200);
  return { quiz, first };
}

describe("FSRS scheduler wrapper", () => {
  test("a new card rated Good is scheduled later than one rated Again, and the log carries the session", () => {
    const at = Date.UTC(2026, 9, 1, 9);
    const card = newCard(at);
    const again = rate(card, 1, at, "s1");
    const good = rate(card, 3, at, "s1");
    expect(good.card.due).toBeGreaterThan(again.card.due);
    expect(again.log.sessionId).toBe("s1");
    expect(good.card.reps).toBe(1);
  });

  test("intervals grow with the rating and the stored card round-trips", () => {
    const at = Date.UTC(2026, 9, 1, 9);
    const i = previewIntervals(newCard(at), at);
    expect(i["1"]).toBeLessThanOrEqual(i["2"]);
    expect(i["2"]).toBeLessThanOrEqual(i["3"]);
    expect(i["3"]).toBeLessThan(i["4"]);
    const stored = rate(newCard(at), 4, at).card;
    expect(fromStored(stored).due.getTime()).toBe(stored.due);
  });

  test("a Leitner box becomes a review card with the box's interval as stability", () => {
    const due = Date.UTC(2026, 9, 10);
    const c = cardFromLeitner(4, due, 7);
    expect(c.state).toBe(2);
    expect(c.stability).toBe(7);
    expect(c.due).toBe(due);
    expect(cardFromLeitner(1, due, 0).state).toBe(0);
  });
});

describe("review routes", () => {
  test("summary starts empty and is learner-only", async () => {
    const res = await get("/api/v5/review/summary");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ dueCount: 0, mistakesCount: 0, totalCards: 0 });
    const anon = await ctx.app.inject({ method: "GET", url: "/api/v5/review/summary" });
    expect(anon.statusCode).toBe(401);
  });

  test("a wrong quiz answer becomes a mistake card with the right answer on the back", async () => {
    const { first } = await oneWrongAttempt();
    const session = await get("/api/v5/review/session?kind=mistakes");
    expect(session.statusCode).toBe(200);
    const body = session.json();
    expect(body.cards).toHaveLength(1);
    const card = body.cards[0];
    expect(card.source).toBe("mistake");
    expect(card.front.prompt).toBe(first.prompt);
    expect(card.back.correctIndices).toEqual(correctIndicesOf(first));
    expect(card.topicTitle).toBeTruthy();
    expect(card.intervals["3"]).toMatch(/min|day|h/);
  });

  test("hooks are idempotent: a second wrong attempt on the same item adds no duplicate", async () => {
    await oneWrongAttempt();
    await oneWrongAttempt();
    syncAll(ctx.db, ctx.content, learner.id, true);
    const rows = ctx.db.select().from(schema.reviewCards).where(and(eq(schema.reviewCards.userId, learner.id), eq(schema.reviewCards.source, "mistake"))).all();
    expect(rows).toHaveLength(1);
  });

  test("passing the topic adds key-point cards; rating a due card drops the due count", async () => {
    await oneWrongAttempt(); // 1 wrong of many still passes the 80% line for this topic
    const summary = (await get("/api/v5/review/summary")).json();
    expect(summary.dueCount).toBeGreaterThan(1);
    const points = ctx.db.select().from(schema.reviewCards).where(eq(schema.reviewCards.source, "topic_point")).all();
    expect(points.length).toBeGreaterThan(0);
    expect(points.length).toBeLessThanOrEqual(3);
    // Each key point asks with its own heading (the lesson's title for the summary), not a stock question (R2).
    for (const p of points) expect((p.front as { prompt: string }).prompt).not.toMatch(/main idea/i);

    const session = (await get("/api/v5/review/session?kind=due")).json();
    const rated = await post(`/api/v5/review/cards/${session.cards[0].id}/rate`, { rating: 3, sessionId: session.id });
    expect(rated.statusCode).toBe(200);
    expect(rated.json().dueCount).toBe(summary.dueCount - 1);
    const logs = ctx.db.select().from(schema.reviewLogs).where(eq(schema.reviewLogs.userId, learner.id)).all();
    expect(logs).toHaveLength(1);
  });

  test("a session is capped at about five minutes", async () => {
    // Plenty of due cards.
    const at = Date.now() - 1000;
    for (let i = 0; i < 80; i++) {
      ctx.db
        .insert(schema.reviewCards)
        .values({
          id: `c${i}`,
          userId: learner.id,
          source: "topic_point",
          refId: `t${i % 7}:p${i}`,
          topicId: `t${i % 7}`,
          front: { kind: "text", prompt: "What is the main idea of this lesson in a few words?" },
          back: { answer: "A reasonably long answer that takes a few seconds to read and compare with what you said." },
          fsrs: { ...newCard(at), due: at } as unknown as Record<string, unknown>,
          due: at,
          createdAt: at,
          updatedAt: at,
        })
        .run();
    }
    const body = (await get("/api/v5/review/session?kind=mixed")).json();
    expect(body.estSeconds).toBeLessThanOrEqual(SESSION_BUDGET_SEC);
    expect(body.cards.length).toBeGreaterThan(5);
    expect(body.available).toBe(80);
    // Interleaved: no two neighbours from the same topic.
    for (let i = 1; i < body.cards.length; i++) expect(body.cards[i].topicId).not.toBe(body.cards[i - 1].topicId);
  });

  test("five ratings in one session award the review XP once", async () => {
    const at = Date.now() - 1000;
    for (let i = 0; i < 6; i++) {
      ctx.db
        .insert(schema.reviewCards)
        .values({ id: `x${i}`, userId: learner.id, source: "topic_point", refId: `x:${i}`, topicId: null, front: { kind: "text", prompt: "Q" }, back: { answer: "A" }, fsrs: { ...newCard(at), due: at } as unknown as Record<string, unknown>, due: at, createdAt: at, updatedAt: at })
        .run();
    }
    const session = (await get("/api/v5/review/session?kind=due")).json();
    const gains: number[] = [];
    for (const card of session.cards.slice(0, 6)) gains.push((await post(`/api/v5/review/cards/${card.id}/rate`, { rating: 3, sessionId: session.id })).json().xpAwarded);
    expect(gains.filter((g) => g > 0)).toEqual([REVIEW_SESSION_XP]);
    expect(gains[4]).toBe(REVIEW_SESSION_XP);
  });

  test("rating someone else's card is a 404, and a bad rating is a 400", async () => {
    const other = await activeLearner(ctx, admin, "learner.two");
    await oneWrongAttempt();
    const card = (await get("/api/v5/review/session?kind=mistakes")).json().cards[0];
    expect((await post(`/api/v5/review/cards/${card.id}/rate`, { rating: 3 }, other.session)).statusCode).toBe(404);
    expect((await post(`/api/v5/review/cards/${card.id}/rate`, { rating: 7 })).statusCode).toBe(400);
  });
});

describe("handbook flashcards bridge", () => {
  test("Leitner rows become glossary cards once, keeping their schedule, and ratings keep the box in step", async () => {
    const term = ctx.db.select().from(schema.handbookEntries).where(eq(schema.handbookEntries.kind, "term")).get();
    expect(term).toBeTruthy();
    const due = Date.now() - 60_000;
    ctx.db.insert(schema.handbookFlashcards).values({ userId: learner.id, termId: term!.id, box: 3, dueAt: due }).run();
    ctx.db.delete(schema.appMeta).where(eq(schema.appMeta.key, HANDBOOK_MIGRATION_KEY)).run();

    const first = migrateHandbookFlashcards(ctx.db, ctx.content);
    expect(first.migrated).toBe(1);
    expect(migrateHandbookFlashcards(ctx.db, ctx.content).skipped).toBe(true);

    const card = ctx.db.select().from(schema.reviewCards).where(and(eq(schema.reviewCards.userId, learner.id), eq(schema.reviewCards.source, "glossary"))).get()!;
    expect(card.due).toBe(due);
    expect((card.fsrs as { stability: number }).stability).toBe(3);

    await post(`/api/v5/review/cards/${card.id}/rate`, { rating: 1 });
    const box = ctx.db.select().from(schema.handbookFlashcards).where(eq(schema.handbookFlashcards.userId, learner.id)).get()!;
    expect(box.box).toBe(1);
  });
});
