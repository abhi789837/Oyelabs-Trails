import { createEmptyCard, fsrs, generatorParameters, State, type Card, type Grade, type ReviewLog } from "ts-fsrs";
import { z } from "zod";

import { DESIRED_RETENTION, stateName, type CardState } from "../../../../shared/review";

/**
 * The FSRS wrapper (ts-fsrs, FSRS-6). Scheduling runs on the server so the clock can be trusted.
 * Fuzz is on, so cards rated together don't all come back on the same day.
 *
 * Cards are stored as JSON with dates as epoch milliseconds (`StoredCard`); `due` is also lifted
 * into its own column for the (user_id, due) index.
 */

export const scheduler = fsrs(generatorParameters({ request_retention: DESIRED_RETENTION, enable_fuzz: true }));

export const storedCardSchema = z.object({
  due: z.number(),
  stability: z.number(),
  difficulty: z.number(),
  elapsed_days: z.number().default(0),
  scheduled_days: z.number(),
  learning_steps: z.number().default(0),
  reps: z.number().int(),
  lapses: z.number().int(),
  state: z.number().int().min(0).max(3),
  last_review: z.number().nullable().optional(),
});
export type StoredCard = z.infer<typeof storedCardSchema>;

export interface StoredLog {
  rating: number;
  state: number;
  due: number;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  learning_steps: number;
  review: number;
  sessionId?: string;
}

export function toStored(card: Card): StoredCard {
  return {
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.getTime() : null,
  };
}

export function fromStored(raw: unknown): Card {
  const s = storedCardSchema.parse(raw);
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsed_days,
    scheduled_days: s.scheduled_days,
    learning_steps: s.learning_steps,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state as State,
    ...(s.last_review != null ? { last_review: new Date(s.last_review) } : {}),
  };
}

function logToStored(log: ReviewLog, sessionId?: string): StoredLog {
  return {
    rating: log.rating,
    state: log.state,
    due: log.due.getTime(),
    stability: log.stability,
    difficulty: log.difficulty,
    scheduled_days: log.scheduled_days,
    learning_steps: log.learning_steps,
    review: log.review.getTime(),
    ...(sessionId ? { sessionId } : {}),
  };
}

export function newCard(at: number): StoredCard {
  return toStored(createEmptyCard(new Date(at)));
}

/**
 * A card that already has history in another scheduler (the handbook's Leitner boxes), placed
 * into FSRS at roughly the same point: box 1 is a new card; box n > 1 is a review card whose
 * stability is the box's interval in days, due when the box said it was.
 */
export function cardFromLeitner(box: number, dueAt: number, intervalDays: number): StoredCard {
  if (box <= 1) return { ...newCard(dueAt), due: dueAt };
  const day = 86_400_000;
  return {
    due: dueAt,
    stability: Math.max(1, intervalDays),
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: intervalDays,
    learning_steps: 0,
    reps: box - 1,
    lapses: 0,
    state: State.Review,
    last_review: dueAt - intervalDays * day,
  };
}

/** Applies a rating (1 Again, 2 Hard, 3 Good, 4 Easy). */
export function rate(stored: unknown, rating: 1 | 2 | 3 | 4, at: number, sessionId?: string): { card: StoredCard; log: StoredLog } {
  const { card, log } = scheduler.next(fromStored(stored), new Date(at), rating as Grade);
  return { card: toStored(card), log: logToStored(log, sessionId) };
}

/** When the card would come back for each rating, as ms from `at`. */
export function previewIntervals(stored: unknown, at: number): Record<"1" | "2" | "3" | "4", number> {
  const preview = scheduler.repeat(fromStored(stored), new Date(at));
  const of = (g: Grade) => preview[g].card.due.getTime() - at;
  return { "1": of(1), "2": of(2), "3": of(3), "4": of(4) };
}

export function cardState(stored: unknown): CardState {
  const parsed = storedCardSchema.safeParse(stored);
  return parsed.success ? stateName(parsed.data.state) : "new";
}

export function retrievability(stored: unknown, at: number): number {
  return scheduler.get_retrievability(fromStored(stored), new Date(at), false);
}
