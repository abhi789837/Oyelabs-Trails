import type { PlanLane, WeekItemView, WeekView } from "./weeklyPlan";

/**
 * The weekly plan's pure helpers, without zod (`./weeklyPlan` re-exports all of these).
 *
 * The v5 learner pages import from here so their first download doesn't carry zod (about 26 KB
 * gzipped): Phase 9 found My plan, Library, the course page and Me over the 200 KB budget for that
 * reason alone. Server code keeps importing `./weeklyPlan`.
 */

const DAY_MS = 86_400_000;

/** Display order. Must-know is second on purpose — see the file comment. */
export const LANE_ORDER = ["do_now", "must_know", "medium", "low"] as const satisfies readonly PlanLane[];

export function itemsInLane(week: WeekView, lane: PlanLane): WeekItemView[] {
  return week.items.filter((item) => item.lane === lane).sort((a, b) => a.position - b.position);
}

export function doneCount(items: readonly WeekItemView[]): number {
  return items.filter((item) => item.status === "done").length;
}

/**
 * The gate on planning the next week early.
 *
 * Red and Must-know only. Low is skippable by design, and Medium is "as much as fits" — making
 * either of them block the next week would turn optional work into homework.
 */
export function isWeekComplete(items: readonly WeekItemView[]): boolean {
  const blocking = items.filter((item) => item.lane === "do_now" || item.lane === "must_know");
  if (blocking.length === 0) return items.length > 0 && items.every((item) => item.status !== "pending");
  return blocking.every((item) => item.status === "done");
}

/** `yyyy-mm-dd` in UTC. One timezone for stored dates, so a week's boundary never drifts. */
export function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function fromIsoDate(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`);
}

/** "Sep 29 – Oct 5". The date range in the header. */
export function formatRange(startDate: string, endDate: string): string {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  const start = new Date(fromIsoDate(startDate)).toLocaleDateString("en-GB", options);
  const end = new Date(fromIsoDate(endDate)).toLocaleDateString("en-GB", options);
  return `${start} – ${end}`;
}

/** Whether a week's seven days are up. */
export function weekHasEnded(endDate: string, nowMs: number): boolean {
  return nowMs > fromIsoDate(endDate) + DAY_MS;
}
