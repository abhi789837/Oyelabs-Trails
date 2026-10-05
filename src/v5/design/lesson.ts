/**
 * Pure rules behind the lesson components (stepper, hint ladder, flashcard ratings). No React.
 */

export type LessonStep = "watch" | "read" | "do" | "check";

export const LESSON_STEPS: readonly { id: LessonStep; label: string }[] = [
  { id: "watch", label: "Watch" },
  { id: "read", label: "Read" },
  { id: "do", label: "Do" },
  { id: "check", label: "Check" },
];

export type StepState = "done" | "current" | "todo" | "locked";

/**
 * Each step's state. A step is reachable once every earlier *present* step is done (steps a topic
 * doesn't have are simply absent from `available`). The current step is always reachable.
 */
export function stepStates(current: LessonStep, done: Partial<Record<LessonStep, boolean>>, available: readonly LessonStep[] = ["watch", "read", "do", "check"]): Record<LessonStep, StepState | "absent"> {
  const out = { watch: "absent", read: "absent", do: "absent", check: "absent" } as Record<LessonStep, StepState | "absent">;
  let blocked = false;
  for (const { id } of LESSON_STEPS) {
    if (!available.includes(id)) continue;
    if (id === current) out[id] = done[id] ? "done" : "current";
    else if (done[id]) out[id] = "done";
    else out[id] = blocked ? "locked" : "todo";
    if (!done[id]) blocked = true;
  }
  return out;
}

/** The next present step after `current`, or null on the last one. */
export function nextStep(current: LessonStep, available: readonly LessonStep[] = ["watch", "read", "do", "check"]): LessonStep | null {
  const order = LESSON_STEPS.map((s) => s.id).filter((id) => available.includes(id));
  const i = order.indexOf(current);
  return i === -1 || i === order.length - 1 ? null : order[i + 1];
}

// ---------------------------------------------------------------------------
// Hint ladder
// ---------------------------------------------------------------------------

export type HintLevel = "nudge" | "concept" | "partial";
export const HINT_LEVELS: readonly HintLevel[] = ["nudge", "concept", "partial"];
export const HINT_LABELS: Record<HintLevel, string> = { nudge: "A nudge", concept: "The idea behind it", partial: "Part of the code" };

/**
 * The solution unlocks only after every hint has been opened **and** at least `minAttempts` checks
 * were run, so the ladder is climbed rather than skipped.
 */
export function solutionUnlocked(revealed: number, attempts: number, minAttempts = 2): boolean {
  return revealed >= HINT_LEVELS.length && attempts >= minAttempts;
}

/** The next hint to reveal, or null when all are open. */
export function nextHint(revealed: number): HintLevel | null {
  return revealed >= HINT_LEVELS.length ? null : HINT_LEVELS[Math.max(0, revealed)];
}

// ---------------------------------------------------------------------------
// Flashcard ratings (FSRS 1–4)
// ---------------------------------------------------------------------------

export type Rating = 1 | 2 | 3 | 4;
export const RATINGS: readonly { rating: Rating; label: string; key: string; hint: string }[] = [
  { rating: 1, label: "Again", key: "1", hint: "I didn't know it" },
  { rating: 2, label: "Hard", key: "2", hint: "I got it, slowly" },
  { rating: 3, label: "Good", key: "3", hint: "I knew it" },
  { rating: 4, label: "Easy", key: "4", hint: "Too easy" },
];

/** Maps a key press to a rating when the card is flipped; null otherwise. */
export function ratingForKey(key: string, flipped: boolean): Rating | null {
  if (!flipped) return null;
  const found = RATINGS.find((r) => r.key === key);
  return found ? found.rating : null;
}

/** "Again" in 10 min, "Good" in 3 days: interval labels for the buttons. */
export function intervalLabel(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "now";
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} ${d === 1 ? "day" : "days"}`;
  const mo = Math.round(d / 30);
  return `${mo} ${mo === 1 ? "month" : "months"}`;
}

/** "4:05", "1:02:09" for video times. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
