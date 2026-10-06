import type { LessonStep, TodayTrailStop } from "@shared/today";
import type { PlanLane } from "@shared/weeklyPlan";

/** Plain-word helpers for Today. Pure; tested in format.test.ts. */

/** "45 min", "1 h", "2 h 5 min". */
export function minutesLabel(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h} h` : `${h} h ${rest} min`;
}

/** Hours with at most one decimal: "0", "2.5", "15". */
export function hoursLabel(minutes: number): string {
  const h = Math.round((Math.max(0, minutes) / 60) * 10) / 10;
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
}

/** "5:07", "1:02:03". */
export function clockLabel(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export const STEP_LABELS: Record<LessonStep, string> = { watch: "Watch", read: "Read", do: "Do", check: "Check" };

/** "Watch, from 5:07" / "Do". */
export function stepLine(step: LessonStep | null, positionSec: number | null): string | null {
  if (!step) return null;
  if (step === "watch" && positionSec && positionSec >= 5) return `Watch, from ${clockLabel(positionSec)}`;
  return STEP_LABELS[step];
}

/** "Good morning" by the viewer's local hour. */
export function greeting(hour: number): string {
  if (hour < 5) return "Hello";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * The mini trail shows a window, not the whole week: the last 2 done stops and the next 4, so the
 * "you are here" marker is always on screen and the trail stays short on a phone.
 */
export function trailWindow(stops: readonly TodayTrailStop[], before = 2, after = 4): { stops: TodayTrailStop[]; hiddenBefore: number; hiddenAfter: number } {
  const here = stops.findIndex((s) => !s.done);
  const pivot = here === -1 ? stops.length : here;
  const start = Math.max(0, pivot - before);
  const end = Math.min(stops.length, pivot + after);
  return { stops: stops.slice(start, end), hiddenBefore: start, hiddenAfter: stops.length - end };
}

/** "3 Oct" in the viewer's locale-neutral short form. */
export function shortDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** "Oct 5 – Oct 11" for a plan week (dates are UTC yyyy-mm-dd). */
export function weekRange(startDate: string, endDate: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  const a = new Date(`${startDate}T00:00:00Z`).toLocaleDateString("en-GB", opts);
  const b = new Date(`${endDate}T00:00:00Z`).toLocaleDateString("en-GB", opts);
  return `${a} – ${b}`;
}

/*
 * The lane's name and v5 lane colours, for the stripe and the chip. The labels match `LANE_META`
 * (the design system's LaneChip); they are spelled out here so the hero, which is in the first
 * download, doesn't pull the lane icon set in with it.
 */
export const HERO_LANE: Record<PlanLane, { label: string; stripe: string; chip: string }> = {
  do_now: { label: "Do it now", stripe: "bg-lane-now", chip: "bg-lane-now-soft text-lane-now-fg" },
  must_know: { label: "Must know", stripe: "bg-lane-must", chip: "bg-lane-must-soft text-lane-must-fg" },
  medium: { label: "Medium", stripe: "bg-lane-medium", chip: "bg-lane-medium-soft text-lane-medium-fg" },
  low: { label: "Low", stripe: "bg-lane-low", chip: "bg-lane-low-soft text-lane-low-fg" },
};

/**
 * The design system's primary large button (`buttonVariants({ variant: "primary", size: "lg" })`),
 * as plain classes. The hero is in the first download, and the Button module would bring cva and
 * Radix Slot with it; `format.test.ts` checks these stay the same as the real thing.
 */
export const PRIMARY_LG =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition-[background-color,color,box-shadow,transform] duration-120 ease-enter active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 bg-brand text-on-brand shadow-e1 hover:bg-brand/90 h-12 px-6 text-body";
