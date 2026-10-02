import type { TermCategory } from "@shared/handbook";
import { handbookApi, type DueCard, type FlashcardResult } from "./api";

/**
 * A flashcard sitting: the queue the server returned (due cards first, then new terms), one card
 * at a time. Pure state plus two thin API calls, so the whole flow is tested with a mocked fetch.
 */

export interface QueueCard extends DueCard {
  isNew: boolean;
}

export interface FlashcardState {
  queue: QueueCard[];
  /** Index into `queue` of the card on screen. */
  index: number;
  flipped: boolean;
  dueLeft: number;
  newLeft: number;
  reviewed: number;
  /** Cards answered "again" come back once at the end of the sitting. */
  requeued: string[];
}

/**
 * Which cards in the queue are new terms. The response lists due cards first, then new terms, and
 * does not flag them; a new term has no Leitner box yet (box 0), or is stamped "due now" (box 1 and
 * the latest `dueAt` in the list, since every due card fell due before the request). At most
 * `newCount` cards are new, taken from the end.
 */
export function markNew(cards: DueCard[], newCount: number): QueueCard[] {
  // The server flags new terms (`isNew`); the guess below is only for a response without the flag.
  if (cards.every((c) => typeof c.isNew === "boolean")) return cards.map((c) => ({ ...c, isNew: c.isNew === true }));
  const latest = cards.reduce((max, c) => Math.max(max, c.dueAt), -Infinity);
  let budget = newCount;
  const flags = new Array<boolean>(cards.length).fill(false);
  for (let i = cards.length - 1; i >= 0 && budget > 0; i--) {
    const c = cards[i];
    if (c.box < 1 || (c.box === 1 && c.dueAt === latest)) {
      flags[i] = true;
      budget--;
    } else break;
  }
  return cards.map((c, i) => ({ ...c, isNew: flags[i] }));
}

export const isNewCard = (card: QueueCard) => card.isNew;

export function initialState(cards: DueCard[], newCount: number): FlashcardState {
  const queue = markNew(cards, newCount);
  return {
    queue,
    index: 0,
    flipped: false,
    dueLeft: queue.filter((c) => !c.isNew).length,
    newLeft: newCount,
    reviewed: 0,
    requeued: [],
  };
}

export function currentCard(state: FlashcardState): QueueCard | null {
  return state.queue[state.index] ?? null;
}

export function isFinished(state: FlashcardState): boolean {
  return state.index >= state.queue.length;
}

export function flip(state: FlashcardState): FlashcardState {
  return isFinished(state) ? state : { ...state, flipped: !state.flipped };
}

/** Moves past the current card after a review. Only a flipped card can be graded. */
export function advance(state: FlashcardState, result: FlashcardResult): FlashcardState {
  const card = currentCard(state);
  if (!card || !state.flipped) return state;
  const repeat = state.requeued.includes(card.termId);
  const requeueNow = result === "again" && !repeat;
  let dueLeft = state.dueLeft;
  let newLeft = state.newLeft;
  if (!repeat && isNewCard(card)) newLeft -= 1;
  else dueLeft -= 1;
  // Seen again before the sitting ends, now as a due card (box 1).
  if (requeueNow) dueLeft += 1;
  return {
    ...state,
    queue: requeueNow ? [...state.queue, { ...card, box: 1, isNew: false }] : state.queue,
    requeued: requeueNow ? [...state.requeued, card.termId] : state.requeued,
    index: state.index + 1,
    flipped: false,
    reviewed: state.reviewed + 1,
    dueLeft: Math.max(0, dueLeft),
    newLeft: Math.max(0, newLeft),
  };
}

/** "12 due · 30 new" */
export function progressLine(state: Pick<FlashcardState, "dueLeft" | "newLeft">): string {
  return `${state.dueLeft} due · ${state.newLeft} new`;
}

export async function loadDeck(options: { category?: TermCategory; limit?: number } = {}, signal?: AbortSignal): Promise<FlashcardState> {
  const { cards, newCount } = await handbookApi.dueFlashcards(options, signal);
  return initialState(cards, newCount);
}

export function submitReview(termId: string, result: FlashcardResult) {
  return handbookApi.reviewFlashcard(termId, result);
}
