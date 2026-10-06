import { z } from "zod";

/**
 * v5 Review (Phase 4): FSRS flashcards, mixed practice and "Fix my mistakes".
 *
 * Cards are only ever made from things the learner has already met (a quiz item they got wrong, a
 * key point of a lesson they finished, a glossary term they practised), so Review never teaches
 * anything new. Scheduling runs on the server (`server/src/v5/review/scheduler.ts`, ts-fsrs, desired
 * retention 0.9). This file holds the API shapes and the pure session rules, shared by both sides.
 */

export const REVIEW_SOURCES = ["quiz_item", "glossary", "mistake", "topic_point"] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];

export const SESSION_KINDS = ["due", "mixed", "mistakes"] as const;
export type SessionKind = (typeof SESSION_KINDS)[number];

/** A session is about five minutes: cards are added until their estimated time reaches this. */
export const SESSION_BUDGET_SEC = 300;
/** Never more cards than this in one session, however quick they are. */
export const SESSION_MAX_CARDS = 30;
/** A session of at least this many rated cards earns the "review session" XP. */
export const REVIEW_XP_MIN_CARDS = 5;
export const REVIEW_SESSION_XP = 20;
export const DESIRED_RETENTION = 0.9;

export const sessionQuerySchema = z.object({ kind: z.enum(SESSION_KINDS).default("due") });

export const rateRequestSchema = z.object({
  rating: z.number().int().min(1).max(4),
  /** The session the card was served in, so the XP for a 5-card session is awarded once. */
  sessionId: z.string().min(1).max(64).optional(),
});
export type RateRequest = z.infer<typeof rateRequestSchema>;

export type CardState = "new" | "learning" | "review" | "relearning";

export type ReviewCardFront =
  | { kind: "text"; prompt: string; context?: string }
  | { kind: "choice"; prompt: string; options: string[]; multi: boolean; context?: string };

export interface ReviewCardBack {
  /** The answer in words. For a choice card: the right option(s). */
  answer: string;
  explanation?: string;
  correctIndices?: number[];
  /** Mistake cards: what the learner chose when they got it wrong. */
  yourIndices?: number[];
}

export interface ReviewCardView {
  id: string;
  source: ReviewSource;
  topicId: string | null;
  topicTitle: string | null;
  front: ReviewCardFront;
  back: ReviewCardBack;
  state: CardState;
  due: number;
  estSeconds: number;
  /** "10 min", "3 days": when the card comes back for each rating (1 Again … 4 Easy). */
  intervals: Record<"1" | "2" | "3" | "4", string>;
}

export interface ReviewSession {
  id: string;
  kind: SessionKind;
  cards: ReviewCardView[];
  estSeconds: number;
  /** Cards that were eligible before the five-minute cap. */
  available: number;
  generatedAt: number;
}

export interface ReviewSummary {
  dueCount: number;
  mistakesCount: number;
  totalCards: number;
  reviewedToday: number;
}

export interface RateResponse {
  card: { id: string; due: number; state: CardState };
  /** When it comes back, in words ("3 days"). */
  nextIn: string;
  dueCount: number;
  /** XP given by this rating (the session reaching five cards); 0 otherwise. */
  xpAwarded: number;
  ratedInSession: number;
}

// ---------------------------------------------------------------------------
// Pure rules: time estimates, interleaving, the five-minute cap
// ---------------------------------------------------------------------------

const words = (s: string | undefined) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0);

/**
 * Seconds a card is likely to take: reading the front, thinking, reading the back and rating.
 * About 4 words a second for reading, plus a fixed think-and-rate cost. Clamped to 8–60 s.
 */
export function estimateCardSeconds(front: ReviewCardFront, back: ReviewCardBack): number {
  let read = words(front.prompt) + words(front.context) + words(back.answer) + words(back.explanation);
  let think = 6;
  if (front.kind === "choice") {
    read += front.options.reduce((n, o) => n + words(o), 0);
    think += 2 * front.options.length;
  }
  return Math.max(8, Math.min(60, Math.round(think + read / 4)));
}

export interface SessionCandidate {
  id: string;
  source: ReviewSource;
  topicId: string | null;
  due: number;
  estSeconds: number;
  suspended?: boolean;
}

/**
 * Round-robin across groups (topics), keeping each group's own order, so two cards from the same
 * topic only sit next to each other when nothing else is left. That's interleaving: retrieval gets
 * harder, and that's what makes it stick.
 */
export function interleave<T>(items: readonly T[], keyOf: (item: T) => string): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  const queues = [...groups.values()];
  const out: T[] = [];
  let last: string | null = null;
  while (out.length < items.length) {
    // Prefer the longest remaining group that isn't the one we just took from.
    let pick = -1;
    for (let i = 0; i < queues.length; i++) {
      if (queues[i].length === 0) continue;
      const key = keyOf(queues[i][0]);
      if (key === last && queues.some((q, j) => j !== i && q.length > 0)) continue;
      if (pick === -1 || queues[i].length > queues[pick].length) pick = i;
    }
    const item = queues[pick].shift()!;
    last = keyOf(item);
    out.push(item);
  }
  return out;
}

/** Keeps cards in order until the time budget is used up. Always at least one card. */
export function capByTime<T extends { estSeconds: number }>(items: readonly T[], budgetSec = SESSION_BUDGET_SEC, maxCards = SESSION_MAX_CARDS): T[] {
  const out: T[] = [];
  let used = 0;
  for (const item of items) {
    if (out.length >= maxCards) break;
    if (out.length > 0 && used + item.estSeconds > budgetSec) break;
    out.push(item);
    used += item.estSeconds;
  }
  return out;
}

const topicKey = (c: SessionCandidate) => c.topicId ?? `none:${c.source}`;

/**
 * Picks a session's cards.
 * - `due`: what is due now, most overdue first.
 * - `mixed`: due cards first, then the cards coming up soonest, interleaved across topics. Only
 *   cards the learner already has (so only topics they've met): interleaving never mixes in new ground.
 * - `mistakes`: mistake cards, due ones first, then the rest, interleaved across topics.
 */
export function composeSession(cards: readonly SessionCandidate[], kind: SessionKind, now: number, budgetSec = SESSION_BUDGET_SEC): SessionCandidate[] {
  const live = cards.filter((c) => !c.suspended);
  const byDue = (a: SessionCandidate, b: SessionCandidate) => a.due - b.due || a.id.localeCompare(b.id);
  if (kind === "due") return capByTime(live.filter((c) => c.due <= now).sort(byDue), budgetSec);
  const pool = kind === "mistakes" ? live.filter((c) => c.source === "mistake") : live;
  const ordered = [...pool].sort(byDue);
  // Choose which cards first (due, then soonest), then interleave only the chosen ones.
  return interleave(capByTime(ordered, budgetSec), topicKey);
}

/** "10 min", "3 days", "2 months": how long until a card comes back. */
export function intervalWords(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "now";
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} ${d === 1 ? "day" : "days"}`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo} ${mo === 1 ? "month" : "months"}`;
  const y = Math.round(d / 365);
  return `${y} ${y === 1 ? "year" : "years"}`;
}

export function stateName(state: number): CardState {
  return (["new", "learning", "review", "relearning"] as const)[state] ?? "new";
}
