import {
  biggestCelebration,
  celebrationFor,
  XP_KIND_CELEBRATION,
  type CelebrationKind,
  type MotivationXpEvent,
} from "@shared/motivation";

/** Pure helpers for the motivation host (tested in motivation.test.ts). */

export interface PendingCelebration {
  kind: CelebrationKind;
  title: string;
  detail?: string;
  durationMs: number;
  confetti: boolean;
  /** Dedupe key: `${kind}:${ref}`, or a unique id when there is no ref. */
  key: string;
}

export function celebrationKey(kind: CelebrationKind, ref: string | undefined): string | null {
  return ref ? `${kind}:${ref}` : null;
}

export function toPending(kind: CelebrationKind, options: { ref?: string; title?: string; detail?: string }, fallbackKey: string): PendingCelebration {
  const spec = celebrationFor(kind);
  return {
    kind,
    title: options.title ?? spec.title,
    detail: options.detail,
    durationMs: spec.durationMs,
    confetti: spec.confetti,
    key: celebrationKey(kind, options.ref) ?? fallbackKey,
  };
}

export interface Digest {
  /** XP awarded in these events that the host hadn't seen yet. */
  gained: number;
  /** The one moment to show for them (the biggest), or null. */
  celebration: PendingCelebration | null;
}

/**
 * Turns newly seen XP awards into a "+N XP" amount and at most one celebration. `seen` (event
 * identity) and `celebrated` (celebration keys already shown, including explicit `celebrate()`
 * calls) are updated in place, so the same award never counts twice.
 */
export function digestEvents(
  events: readonly MotivationXpEvent[],
  seen: Set<string>,
  celebrated: Set<string>,
  /** Kinds another screen shows itself right now (the lesson player's own "Lesson finished"). */
  suppress: ReadonlySet<CelebrationKind> = new Set(),
): Digest {
  let gained = 0;
  const wins: { kind: CelebrationKind; ref: string; xp: number }[] = [];
  for (const e of events) {
    const id = `${e.kind}:${e.refId}`;
    if (seen.has(id)) continue;
    seen.add(id);
    gained += e.xp;
    const kind = XP_KIND_CELEBRATION[e.kind];
    if (!kind || celebrated.has(`${kind}:${e.refId}`)) continue;
    if (suppress.has(kind)) celebrated.add(`${kind}:${e.refId}`);
    else wins.push({ kind, ref: e.refId, xp: e.xp });
  }
  const best = biggestCelebration(wins.map((w) => w.kind));
  if (!best) return { gained, celebration: null };
  const win = wins.find((w) => w.kind === best)!;
  for (const w of wins) celebrated.add(`${w.kind}:${w.ref}`);
  return { gained, celebration: toPending(best, { ref: win.ref, detail: gained > 0 ? `+${gained} XP` : undefined }, `${best}:${win.ref}`) };
}

// ---------------------------------------------------------------------------
// "Once per browser" keys (the weekly summit), stored defensively
// ---------------------------------------------------------------------------

const ONCE_KEY = "oyelearn.v5.celebrated";

export function readOnce(): string[] {
  try {
    const raw = window.localStorage.getItem(ONCE_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((k): k is string => typeof k === "string") : [];
  } catch {
    return [];
  }
}

/** True the first time a key is claimed; false after (or when storage is unavailable and it was claimed this session). */
const sessionOnce = new Set<string>();
export function claimOnce(key: string): boolean {
  if (sessionOnce.has(key)) return false;
  const list = readOnce();
  if (list.includes(key)) return false;
  sessionOnce.add(key);
  try {
    window.localStorage.setItem(ONCE_KEY, JSON.stringify([...list, key].slice(-30)));
  } catch {
    // private window: the session set still stops a repeat
  }
  return true;
}

// ---------------------------------------------------------------------------
// Weekly goal and streak words
// ---------------------------------------------------------------------------

/** The choices offered for the weekly goal. null = no hours goal (3 steps a week counts). */
export const GOAL_CHOICES: readonly (number | null)[] = [null, 1, 2, 3, 4, 5, 6, 8, 10];

export function goalLabel(hours: number | null): string {
  if (hours === null) return "No hours goal (3 steps a week)";
  return `${hours} ${hours === 1 ? "hour" : "hours"} a week`;
}

/** "Freeze used" when the last finished week was saved by a freeze (history is oldest first). */
export function freezeNotice(history: readonly { week: string; met: boolean; frozen: boolean }[], currentWeek: string): string | null {
  const past = history.filter((w) => w.week < currentWeek);
  const last = past.at(-1);
  if (!last?.frozen) return null;
  return "Freeze used — your streak is safe.";
}

/** "2 min ago", "3 h ago", "Mon 4 Oct". */
export function timeAgo(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return "Just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
