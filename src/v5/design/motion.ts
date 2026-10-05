import type { Transition } from "motion/react";

/**
 * v5 motion tokens, for Motion (`motion/react`) and for CSS.
 *
 * The same numbers live in `tokens.css` as `--v5-dur-*` and `--v5-ease-*`; `motion.test.ts`
 * parses the stylesheet and fails if the two drift.
 *
 * Four durations:
 * - `instant` (120 ms) hover, press, colour;
 * - `quick` (200 ms) something small entering or leaving;
 * - `calm` (320 ms) a panel, a sheet, a route;
 * - `story` (500 ms) a progress ring filling, a celebration's first beat. Never on a loop.
 *
 * Animate transform and opacity only. Reduced motion: `V5MotionProvider` passes the learner's
 * preference to `<MotionConfig>`; CSS is flattened by the media query and `data-motion="reduce"`.
 */

export const durationMs = { instant: 120, quick: 200, calm: 320, story: 500 } as const;
export type DurationName = keyof typeof durationMs;

/** Seconds, which is what Motion takes. */
export const duration = {
  instant: durationMs.instant / 1000,
  quick: durationMs.quick / 1000,
  calm: durationMs.calm / 1000,
  story: durationMs.story / 1000,
} as const;

export type Bezier = readonly [number, number, number, number];

export const easing = {
  /** Decelerate: anything arriving. */
  out: [0.2, 0.8, 0.2, 1],
  /** Accelerate: anything leaving. */
  in: [0.4, 0, 1, 1],
  /** Between two on-screen positions. */
  inOut: [0.4, 0, 0.2, 1],
  /** A small overshoot, for a tick or a badge landing. */
  emphasis: [0.3, 1.3, 0.5, 1],
} as const satisfies Record<string, Bezier>;

export type EasingName = keyof typeof easing;

/** The CSS form of an easing token. */
export function cubicBezier(name: EasingName): string {
  return `cubic-bezier(${easing[name].join(", ")})`;
}

/** Spring presets. All are slightly over-damped so they settle without a visible wobble. */
export const springs = {
  /** Press feedback, toggles. */
  snappy: { type: "spring", stiffness: 520, damping: 34, mass: 0.8 },
  /** The default for marks that pop in. */
  gentle: { type: "spring", stiffness: 300, damping: 30 },
  /** Sheets and panels following a finger or arriving from an edge. */
  sheet: { type: "spring", stiffness: 260, damping: 32 },
} as const satisfies Record<string, Transition>;

export const transitions = {
  instant: { duration: duration.instant, ease: easing.out },
  quick: { duration: duration.quick, ease: easing.out },
  calm: { duration: duration.calm, ease: easing.out },
  story: { duration: duration.story, ease: easing.inOut },
  exit: { duration: duration.instant, ease: easing.in },
} satisfies Record<string, Transition>;

/** The learner's stored preference (`user_prefs.data.reducedMotion`). */
export type ReducedMotionPref = "system" | "on" | "off";

/** What `<MotionConfig reducedMotion>` should be for a preference. */
export function motionConfigFor(pref: ReducedMotionPref | null | undefined): "user" | "always" | "never" {
  if (pref === "on") return "always";
  if (pref === "off") return "never";
  return "user";
}

/**
 * Whether motion should be reduced right now, given the preference and the OS setting.
 * Used by code Motion does not reach (canvas confetti, scroll, number tickers).
 */
export function shouldReduceMotion(pref: ReducedMotionPref | null | undefined, systemPrefersReduced: boolean): boolean {
  if (pref === "on") return true;
  if (pref === "off") return false;
  return systemPrefersReduced;
}

/** Celebrations are capped at 2 s, whatever a caller asks for. */
export const CELEBRATION_MAX_MS = 2000;

export function clampCelebrationMs(ms: number): number {
  if (!Number.isFinite(ms) || ms <= 0) return CELEBRATION_MAX_MS;
  return Math.min(CELEBRATION_MAX_MS, Math.round(ms));
}
