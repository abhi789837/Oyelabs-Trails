import type { Transition, Variants } from "motion/react";

/**
 * Motion tokens.
 *
 * Components take their timing from here instead of hand-writing a duration, so the whole app
 * can be slowed down, sped up or flattened from one file. Three durations is deliberately few:
 * a fourth one always turns out to be someone guessing.
 *
 * Everything here animates **transform and opacity only**. Those are the two properties the
 * compositor can handle without a layout or paint pass, so a list of 200 rows animating in does
 * not stall the main thread. Never add `height`, `width`, `top` or `margin` to a variant below.
 *
 * Reduced motion is handled once, by `<MotionConfig reducedMotion="user">` in `App.tsx`, which
 * drops transform animations and keeps opacity. CSS keyframes are outside motion's reach and are
 * flattened by the `prefers-reduced-motion` block in `index.css` instead.
 */

export const duration = {
  /** Hover, press, colour. Fast enough to read as "immediate". */
  fast: 0.12,
  /** The default. Something small entering or leaving. */
  base: 0.2,
  /** A panel, a sheet, a route. Long enough to follow with the eye. */
  slow: 0.32,
} as const;

type Bezier = [number, number, number, number];

export const easing = {
  /** Decelerate. The default for anything arriving. */
  out: [0.2, 0.8, 0.2, 1] as Bezier,
  /** Accelerate. For anything leaving — it should get out of the way. */
  in: [0.4, 0, 1, 1] as Bezier,
  /** Symmetric. For something moving between two on-screen positions. */
  inOut: [0.4, 0, 0.2, 1] as Bezier,
} as const;

/**
 * The house spring. Used for press feedback and for marks that pop in (a checkmark, a toggle).
 * Slightly over-damped, so it settles without a visible wobble.
 */
export const spring: Transition = { type: "spring", stiffness: 380, damping: 30 };

export const transition = {
  fast: { duration: duration.fast, ease: easing.out },
  base: { duration: duration.base, ease: easing.out },
  slow: { duration: duration.slow, ease: easing.out },
  exit: { duration: duration.fast, ease: easing.in },
} satisfies Record<string, Transition>;

/** Press feedback. Pair with `whileTap` on anything clickable. */
export const press = { scale: 0.97 } as const;

/** The standard enter: a short rise with the fade, never a slide from off-screen. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transition.base },
  exit: { opacity: 0, y: -4, transition: transition.exit },
};

/** For something that appears in place rather than arriving from somewhere: a badge, a result. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: spring },
  exit: { opacity: 0, scale: 0.98, transition: transition.exit },
};

/** Inline validation text. Rises out of the field it belongs to, and leaves quickly. */
export const fieldMessage: Variants = {
  hidden: { opacity: 0, y: -4 },
  visible: { opacity: 1, y: 0, transition: transition.fast },
  exit: { opacity: 0, y: -4, transition: transition.exit },
};

/**
 * A list container whose children run `fadeUp` one after another.
 *
 * Keep `children` inside 0.03–0.05s. Past that a ten-row list takes longer to appear than it
 * takes to read, which is how a stagger stops being polish and starts being latency.
 */
export function stagger(children = 0.04, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: children, delayChildren } },
    exit: { transition: { staggerChildren: children / 2, staggerDirection: -1 } },
  };
}
