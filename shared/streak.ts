/**
 * v5 weekly streak (docs/v5/PLAN.md, "Weekly streak"). Pure: no clock, no database.
 *
 * - Weeks are ISO weeks in UTC, keyed "YYYY-Www" (Monday to Sunday).
 * - A week is "met" when the hours logged reach the weekly goal, or, when there is no goal, when
 *   at least 3 steps were done.
 * - Each calendar month brings 1 freeze. It doesn't carry over. A missed week spends it
 *   automatically, so the streak survives one bad week a month. A freeze is never spent on a
 *   streak of 0 (there is nothing to keep).
 * - The current week is still running: if it's met it counts now; if not, it isn't a miss yet.
 *
 * The whole streak is recomputed from the per-week record each time, so it can't drift and a
 * late-arriving completion (a passed test graded tonight) fixes last week on the next read.
 */

export const STEPS_RULE_MIN = 3;
export const FREEZES_PER_MONTH = 1;
/** How many weeks of history are stored and returned. */
export const STREAK_HISTORY_WEEKS = 26;
/** The furthest back a recompute walks. Older weeks can't change today's streak in practice. */
export const STREAK_MAX_WEEKS = 260;

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

export interface StreakWeekRecord {
  week: string;
  met: boolean;
  frozen: boolean;
}

export interface StreakState {
  current: number;
  best: number;
  lastMetWeek: string | null;
  freezesLeft: number;
  /** "YYYY-MM": the month the `freezesLeft` allowance belongs to. */
  freezeMonth: string;
  /** Oldest first. Finished weeks, plus the current week once it's met. */
  history: StreakWeekRecord[];
  /** Whether the current (running) week already meets the goal. */
  metThisWeek: boolean;
}

// ---------------------------------------------------------------------------
// ISO week keys
// ---------------------------------------------------------------------------

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/** The Monday 00:00 UTC of the ISO week containing `ms`. */
export function mondayOf(ms: number): number {
  const midnight = Math.floor(ms / DAY_MS) * DAY_MS;
  const dow = new Date(midnight).getUTCDay(); // 0 = Sunday
  return midnight - ((dow + 6) % 7) * DAY_MS;
}

/** "2026-W41". The ISO year is the year of the week's Thursday, so 29 Dec 2025 is "2026-W01". */
export function isoWeekKey(ms: number): string {
  const thursday = mondayOf(ms) + 3 * DAY_MS;
  const year = new Date(thursday).getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1);
  const week = Math.floor((thursday - jan1) / WEEK_MS) + 1;
  return `${year}-W${pad(week)}`;
}

const KEY = /^(\d{4})-W(\d{2})$/;

export function isWeekKey(value: string): boolean {
  const m = KEY.exec(value);
  if (!m) return false;
  return isoWeekKey(weekKeyToMonday(value)) === value;
}

/** Monday 00:00 UTC of a week key. */
export function weekKeyToMonday(key: string): number {
  const m = KEY.exec(key);
  if (!m) throw new Error(`Not a week key: ${key}`);
  const year = Number(m[1]);
  const week = Number(m[2]);
  // Week 1 is the week with 4 January in it.
  const week1Monday = mondayOf(Date.UTC(year, 0, 4));
  return week1Monday + (week - 1) * WEEK_MS;
}

export function addWeeks(key: string, n: number): string {
  return isoWeekKey(weekKeyToMonday(key) + n * WEEK_MS);
}

/** Weeks from `a` to `b` (positive when b is later). */
export function weeksBetween(a: string, b: string): number {
  return Math.round((weekKeyToMonday(b) - weekKeyToMonday(a)) / WEEK_MS);
}

/** The month a week belongs to, by its Thursday (the ISO rule), as "YYYY-MM". */
export function monthOfWeek(key: string): string {
  const thursday = new Date(weekKeyToMonday(key) + 3 * DAY_MS);
  return `${thursday.getUTCFullYear()}-${pad(thursday.getUTCMonth() + 1)}`;
}

// ---------------------------------------------------------------------------
// The "met" rule
// ---------------------------------------------------------------------------

export interface WeekActivity {
  minutes: number;
  steps: number;
}

/** Hours reach the goal; with no goal, 3 or more steps. */
export function isWeekMet(activity: WeekActivity, goalMinutes: number | null): boolean {
  if (goalMinutes !== null && goalMinutes > 0) return activity.minutes >= goalMinutes;
  return activity.steps >= STEPS_RULE_MIN;
}

// ---------------------------------------------------------------------------
// The streak
// ---------------------------------------------------------------------------

export interface ComputeStreakInput {
  /** The first week that counts, usually the week the account was created. */
  firstWeek: string;
  /** The week that is running now. */
  currentWeek: string;
  /** Which weeks met the goal. */
  isMet: (week: string) => boolean;
}

export function computeStreak({ firstWeek, currentWeek, isMet }: ComputeStreakInput): StreakState {
  let start = firstWeek;
  if (weeksBetween(start, currentWeek) < 0) start = currentWeek;
  if (weeksBetween(start, currentWeek) > STREAK_MAX_WEEKS) start = addWeeks(currentWeek, -STREAK_MAX_WEEKS);

  let current = 0;
  let best = 0;
  let lastMetWeek: string | null = null;
  let freezeMonth = monthOfWeek(start);
  let freezesLeft = FREEZES_PER_MONTH;
  let metThisWeek = false;
  const history: StreakWeekRecord[] = [];

  for (let week = start; ; week = addWeeks(week, 1)) {
    const month = monthOfWeek(week);
    if (month !== freezeMonth) {
      freezeMonth = month;
      freezesLeft = FREEZES_PER_MONTH;
    }
    const isCurrent = week === currentWeek;
    if (isMet(week)) {
      current += 1;
      best = Math.max(best, current);
      lastMetWeek = week;
      history.push({ week, met: true, frozen: false });
      if (isCurrent) metThisWeek = true;
    } else if (!isCurrent) {
      if (current > 0 && freezesLeft > 0) {
        freezesLeft -= 1;
        history.push({ week, met: false, frozen: true });
      } else {
        current = 0;
        history.push({ week, met: false, frozen: false });
      }
    }
    if (isCurrent) break;
  }

  return { current, best, lastMetWeek, freezesLeft, freezeMonth, history: history.slice(-STREAK_HISTORY_WEEKS), metThisWeek };
}
