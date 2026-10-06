/**
 * The motivation API other screens call (docs/v5/DECISIONS.md, Phase 6). Deliberately tiny and
 * import-free, so any screen can use it without adding to its first download.
 *
 *   import { celebrate } from "@/v5/motivation/celebrate";
 *   celebrate("lesson", { ref: topicId, detail: "+30 XP" });
 *
 * The `MotivationHost` (mounted once in V5App) shows it: at most 2 s, skippable, a static badge
 * under reduced motion, nothing when the learner turned celebrations off. A call made before the
 * host has loaded waits for it. `ref` stops a second moment for the same win (the host also
 * notices new XP awards on its own and would otherwise celebrate the same lesson again).
 */

import type { CelebrationKind } from "@shared/motivation";

export type { CelebrationKind };

export interface CelebrateOptions {
  /** What was won: the topic id, `skillId:level`, the certificate id, the ISO week. */
  ref?: string;
  /** Overrides the default title ("Lesson done"). */
  title?: string;
  /** One short line under the title ("+30 XP · 3 lessons left this week"). */
  detail?: string;
  /** Celebrate only once per browser for this key (e.g. "summit:2026-W41"). */
  once?: string;
}

export type MotivationCommand =
  | { type: "celebrate"; kind: CelebrationKind; options: CelebrateOptions }
  | { type: "refresh" }
  | { type: "open-progress" };

type Listener = (command: MotivationCommand) => void;

let listener: Listener | null = null;
const pending: MotivationCommand[] = [];

function send(command: MotivationCommand): void {
  if (listener) listener(command);
  else if (pending.length < 5) pending.push(command);
}

/** Show a celebration for a real win. Safe to call from anywhere, any time. */
export function celebrate(kind: CelebrationKind, options: CelebrateOptions = {}): void {
  send({ type: "celebrate", kind, options });
}

/** The hook form, for screens that prefer it. Returns the same stable function. */
export function useCelebrate(): typeof celebrate {
  return celebrate;
}

/** Ask the host to re-read XP and notifications now (after an action that awards XP). */
export function refreshMotivation(): void {
  send({ type: "refresh" });
}

/** Open the "Your progress" panel (weekly goal, team board). */
export function openProgress(): void {
  send({ type: "open-progress" });
}

/** For the host only. Returns the unsubscribe. */
export function subscribeMotivation(next: Listener): () => void {
  listener = next;
  while (pending.length) next(pending.shift()!);
  return () => {
    if (listener === next) listener = null;
  };
}
