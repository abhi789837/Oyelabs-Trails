import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { createContext, useContext, type ReactNode } from "react";

import { motionConfigFor, type ReducedMotionPref } from "./motion";

/** The learner's reduced-motion preference for this subtree (V5App sets it app-wide). */
const MotionPrefContext = createContext<ReducedMotionPref>("system");

/** The reduced-motion preference in force here ("system" defers to the OS). */
export function useMotionPref(): ReducedMotionPref {
  return useContext(MotionPrefContext);
}

/**
 * Motion for v5. `LazyMotion` + `domAnimation` keeps Motion's share of the bundle small: v5
 * components use `m.*`, not `motion.*`, so the full feature set is never pulled in.
 * `reducedMotion` follows the learner's preference ("system" defers to the OS). Left out (or null),
 * it inherits the nearest provider's, so a screen's own provider keeps the app-wide setting.
 */
export function V5MotionProvider({ children, reducedMotion }: { children: ReactNode; reducedMotion?: ReducedMotionPref | null }) {
  const inherited = useContext(MotionPrefContext);
  const pref = reducedMotion ?? inherited;
  return (
    <MotionPrefContext.Provider value={pref}>
      <LazyMotion features={domAnimation}>
        <MotionConfig reducedMotion={motionConfigFor(pref)}>{children}</MotionConfig>
      </LazyMotion>
    </MotionPrefContext.Provider>
  );
}
