/**
 * Pure helpers behind the progress components (ring, bar, skill meter, streak, XP). Tested in
 * `progress.test.ts`; no React here.
 */

/** 0–100, rounded; NaN and negatives become 0, anything over becomes 100. */
export function clampPct(value: number, max = 100): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.round(Math.min(100, Math.max(0, (value / max) * 100)));
}

/** Stroke geometry for an SVG ring of `size` px with a `stroke` px line. */
export function ringGeometry(size: number, stroke: number, pct: number) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clampPct(pct) / 100);
  return { radius, circumference, offset, center: size / 2 };
}

/** Skill levels are 0–5. Half steps are allowed in data; the meter rounds to the nearest half. */
export const SKILL_MAX = 5;

export const SKILL_LABELS = ["Not started", "Aware", "Learning", "Working", "Strong", "Expert"] as const;

export function clampSkill(level: number): number {
  if (!Number.isFinite(level)) return 0;
  return Math.round(Math.min(SKILL_MAX, Math.max(0, level)) * 2) / 2;
}

export function skillLabel(level: number): string {
  return SKILL_LABELS[Math.floor(clampSkill(level))];
}

/** Each of the 5 segments: "full", "half" or "empty". */
export function skillSegments(level: number): ("full" | "half" | "empty")[] {
  const l = clampSkill(level);
  return Array.from({ length: SKILL_MAX }, (_, i) => (l >= i + 1 ? "full" : l >= i + 0.5 ? "half" : "empty"));
}

export interface StreakWeek {
  /** ISO week, "2026-W40". */
  week: string;
  met: boolean;
  frozen?: boolean;
}

/** The last `count` weeks for the flame strip, oldest first, padded with empty weeks. */
export function lastWeeks(history: readonly StreakWeek[], count = 8): (StreakWeek | null)[] {
  const tail = history.slice(-count);
  return [...Array.from({ length: count - tail.length }, () => null), ...tail];
}

/** "1,250 XP"; locale grouping, never a decimal. */
export function formatXp(xp: number): string {
  return `${Math.max(0, Math.round(xp)).toLocaleString("en-US")} XP`;
}

/** Steps for a number ticker from `from` to `to`; `frames` values ending exactly on `to`. */
export function tickerFrames(from: number, to: number, frames = 12): number[] {
  if (frames <= 1 || from === to) return [to];
  return Array.from({ length: frames }, (_, i) => {
    const t = (i + 1) / frames;
    const eased = 1 - Math.pow(1 - t, 3);
    return i === frames - 1 ? to : Math.round(from + (to - from) * eased);
  });
}

/** "12 min left", "1 h 5 min left", "Less than a minute left". */
export function timeLeftLabel(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 60) return "Less than a minute left";
  const minutes = Math.round(seconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min left`;
  return m === 0 ? `${h} h left` : `${h} h ${m} min left`;
}
