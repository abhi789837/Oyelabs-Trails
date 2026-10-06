import { and, eq, gte, lte, sql } from "drizzle-orm";

import {
  REVIEW_SESSION_XP,
  REVIEW_XP_MIN_CARDS,
  composeSession,
  estimateCardSeconds,
  intervalWords,
  type RateResponse,
  type ReviewCardBack,
  type ReviewCardFront,
  type ReviewCardView,
  type ReviewSession,
  type ReviewSource,
  type ReviewSummary,
  type SessionKind,
} from "../../../../shared/review";
import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import { notFound } from "../../lib/errors";
import { newId, now } from "../../lib/ids";
import { nextBox, type FlashcardResult } from "../../routes/handbook";
import { cardState, previewIntervals, rate } from "./scheduler";
import { awardReviewSessionXp } from "./xp";

type CardRow = typeof schema.reviewCards.$inferSelect;

function startOfDay(at: number): number {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dueCount(db: Db, userId: string, at = now()): number {
  const t = schema.reviewCards;
  return (
    db
      .select({ n: sql<number>`count(*)` })
      .from(t)
      .where(and(eq(t.userId, userId), eq(t.suspended, false), lte(t.due, at)))
      .get()?.n ?? 0
  );
}

export function reviewSummary(db: Db, userId: string, at = now()): ReviewSummary {
  const t = schema.reviewCards;
  const counts = db
    .select({ source: t.source, n: sql<number>`count(*)` })
    .from(t)
    .where(and(eq(t.userId, userId), eq(t.suspended, false)))
    .groupBy(t.source)
    .all();
  const reviewedToday =
    db
      .select({ n: sql<number>`count(*)` })
      .from(schema.reviewLogs)
      .where(and(eq(schema.reviewLogs.userId, userId), gte(schema.reviewLogs.reviewedAt, startOfDay(at))))
      .get()?.n ?? 0;
  return {
    dueCount: dueCount(db, userId, at),
    mistakesCount: counts.find((c) => c.source === "mistake")?.n ?? 0,
    totalCards: counts.reduce((sum, c) => sum + c.n, 0),
    reviewedToday,
  };
}

function view(row: CardRow, content: ContentStore, at: number): ReviewCardView {
  const front = row.front as unknown as ReviewCardFront;
  const back = row.back as unknown as ReviewCardBack;
  const ms = previewIntervals(row.fsrs, at);
  return {
    id: row.id,
    source: row.source as ReviewSource,
    topicId: row.topicId,
    topicTitle: row.topicId ? (content.topicIndex.get(row.topicId)?.meta.title ?? null) : null,
    front,
    back,
    state: cardState(row.fsrs),
    due: row.due,
    estSeconds: estimateCardSeconds(front, back),
    intervals: { "1": intervalWords(ms["1"]), "2": intervalWords(ms["2"]), "3": intervalWords(ms["3"]), "4": intervalWords(ms["4"]) },
  };
}

/**
 * A self-contained session (everything the client needs to run it offline later: fronts, backs,
 * interval labels). About five minutes long, by estimated seconds per card.
 */
export function buildSession(db: Db, content: ContentStore, userId: string, kind: SessionKind, at = now()): ReviewSession {
  const rows = db
    .select()
    .from(schema.reviewCards)
    .where(and(eq(schema.reviewCards.userId, userId), eq(schema.reviewCards.suspended, false)))
    .all();
  const views = new Map(rows.map((r) => [r.id, r]));
  const candidates = rows.map((r) => ({
    id: r.id,
    source: r.source as ReviewSource,
    topicId: r.topicId,
    due: r.due,
    estSeconds: estimateCardSeconds(r.front as unknown as ReviewCardFront, r.back as unknown as ReviewCardBack),
  }));
  const eligible =
    kind === "due" ? candidates.filter((c) => c.due <= at).length : kind === "mistakes" ? candidates.filter((c) => c.source === "mistake").length : candidates.length;
  const picked = composeSession(candidates, kind, at);
  const cards = picked.map((c) => view(views.get(c.id)!, content, at));
  return { id: newId(), kind, cards, estSeconds: cards.reduce((s, c) => s + c.estSeconds, 0), available: eligible, generatedAt: at };
}

const LEITNER_FOR: Record<1 | 2 | 3 | 4, FlashcardResult> = { 1: "again", 2: "good", 3: "good", 4: "easy" };

export function rateCard(db: Db, userId: string, cardId: string, rating: 1 | 2 | 3 | 4, sessionId: string | undefined, at = now()): RateResponse {
  const t = schema.reviewCards;
  const row = db.select().from(t).where(and(eq(t.id, cardId), eq(t.userId, userId))).get();
  if (!row) throw notFound("That card isn't in your review deck.");

  const { card, log } = rate(row.fsrs, rating, at, sessionId);
  let xpAwarded = 0;
  let ratedInSession = 0;
  db.transaction(() => {
    db.update(t)
      .set({ fsrs: card as unknown as Record<string, unknown>, due: card.due, updatedAt: at })
      .where(eq(t.id, row.id))
      .run();
    db.insert(schema.reviewLogs)
      .values({ id: newId(), userId, cardId: row.id, rating, review: log as unknown as Record<string, unknown>, reviewedAt: at })
      .run();

    // Bridge: keep the old design's handbook box in step, so switching back shows the same deck.
    if (row.source === "glossary") {
      const h = schema.handbookFlashcards;
      const current = db.select().from(h).where(and(eq(h.userId, userId), eq(h.termId, row.refId))).get();
      if (current) {
        const next = nextBox(current.box, LEITNER_FOR[rating], at);
        db.update(h).set(next).where(and(eq(h.userId, userId), eq(h.termId, row.refId))).run();
      }
    }

    if (sessionId) {
      ratedInSession =
        db
          .select({ n: sql<number>`count(distinct ${schema.reviewLogs.cardId})` })
          .from(schema.reviewLogs)
          .where(and(eq(schema.reviewLogs.userId, userId), sql`json_extract(${schema.reviewLogs.review}, '$.sessionId') = ${sessionId}`))
          .get()?.n ?? 0;
      if (ratedInSession >= REVIEW_XP_MIN_CARDS && awardReviewSessionXp(db, userId, sessionId, at)) xpAwarded = REVIEW_SESSION_XP;
    }
  });

  return {
    card: { id: row.id, due: card.due, state: cardState(card) },
    nextIn: intervalWords(card.due - at),
    dueCount: dueCount(db, userId, at),
    xpAwarded,
    ratedInSession,
  };
}
