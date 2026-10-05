import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { ReactNode } from "react";

import { motionConfigFor, type ReducedMotionPref } from "./motion";

/**
 * Motion for v5. `LazyMotion` + `domAnimation` keeps Motion's share of the bundle small: v5
 * components use `m.*`, not `motion.*`, so the full feature set is never pulled in.
 * `reducedMotion` follows the learner's preference ("system" defers to the OS).
 */
export function V5MotionProvider({ children, reducedMotion = "system" }: { children: ReactNode; reducedMotion?: ReducedMotionPref | null }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion={motionConfigFor(reducedMotion)}>{children}</MotionConfig>
    </LazyMotion>
  );
}
