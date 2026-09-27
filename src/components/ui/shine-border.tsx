import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * A card wrapper whose 1px border carries a slowly travelling highlight.
 *
 * The mechanics are the usual conic-gradient trick, written out rather than installed: the outer
 * element is a hairline of `bg-border` with 1px of padding, a square conic gradient spins inside
 * it, and the inner surface covers everything except that hairline. So the "beam" is only ever a
 * 1px ring — it cannot wash over the content, and it costs one composited rotation.
 *
 * Reduced motion is handled twice on purpose. `useReducedMotion()` drops the `animate` prop
 * entirely, and even if it did not, the root `<MotionConfig reducedMotion="user">` would discard a
 * transform animation. What stays is the gradient at its resting angle: a static highlight on one
 * corner, which is the point of the border rather than an accident of stopping mid-way.
 */
export interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Seconds for one full revolution. Long: this sits under a form somebody is reading. */
  duration?: number;
  /** Classes for the inner surface — padding, background, anything the content needs. */
  innerClassName?: string;
  children: React.ReactNode;
}

/** Token colours only, so the beam re-themes with everything else. */
const SHEEN =
  "conic-gradient(from 0turn, transparent 0turn, var(--color-primary) 0.04turn, var(--color-trailmark) 0.09turn, transparent 0.17turn, transparent 1turn)";

export function ShineBorder({ duration = 9, className, innerClassName, children, ...props }: ShineBorderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-border p-px", className)} {...props}>
      <motion.span
        aria-hidden="true"
        /* The light theme needs more of it: the same beam over a pale hairline reads as almost
           nothing, while on dark it is already the brightest thing on the card's edge. */
        className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[220%] opacity-90 dark:opacity-100"
        style={{ x: "-50%", y: "-50%", background: SHEEN }}
        {...(reduceMotion
          ? {}
          : { animate: { rotate: 360 }, transition: { duration, ease: "linear", repeat: Infinity } })}
      />
      <div className={cn("relative rounded-[inherit] bg-surface", innerClassName)}>{children}</div>
    </div>
  );
}
