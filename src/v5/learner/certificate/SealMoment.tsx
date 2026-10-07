import { m, useReducedMotion } from "motion/react";

import { MARK_DOT, MARK_INNER, MARK_INNER_WIDTH, MARK_OUTER, MARK_OUTER_WIDTH, MARK_VIEWBOX, RING_RADIUS } from "@/components/brand/brandAssets";
import { RING_START_DEG } from "@/components/brand/ringGeometry";
import { usePrefersReducedMotion } from "@/v5/design/hooks";

/**
 * The summit moment on a new certificate (brand guidelines p12, "Celebration"): the amber ring
 * closes for a moment, the dot pops, then the ring opens again ("learning never closes"). About
 * 1.6 s, once. Under reduced motion (the system's, or the learner's own setting) it is the still
 * mark. Decorative: the page's heading says what happened.
 */
export function SealMoment({ size = 72, play }: { size?: number; play: boolean }) {
  const systemReduce = usePrefersReducedMotion();
  const motionReduce = useReducedMotion();
  const still = !play || systemReduce || Boolean(motionReduce);
  const circumference = 2 * Math.PI * RING_RADIUS;

  return (
    <svg viewBox={MARK_VIEWBOX} width={size} height={size} aria-hidden="true" focusable="false" className="shrink-0 text-primary" data-brand="seal-moment" data-playing={still ? undefined : "true"}>
      {MARK_OUTER.map((d) => (
        <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth={MARK_OUTER_WIDTH} />
      ))}
      {still ? (
        <>
          <path d={MARK_INNER} fill="none" stroke="rgb(var(--v5-progress))" strokeWidth={MARK_INNER_WIDTH} strokeLinecap="round" />
          <circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} fill="rgb(var(--v5-progress))" />
        </>
      ) : (
        <>
          {/* The inner ring as a circle from the mark's start: the mark's 70% → closed → 70% again. */}
          <m.circle
            cx={100}
            cy={100}
            r={RING_RADIUS}
            fill="none"
            stroke="rgb(var(--v5-progress))"
            strokeWidth={MARK_INNER_WIDTH}
            strokeLinecap="round"
            transform={`rotate(${RING_START_DEG} 100 100)`}
            initial={{ strokeDasharray: `${circumference * 0.7} ${circumference}` }}
            animate={{ strokeDasharray: [`${circumference * 0.7} ${circumference}`, `${circumference} ${circumference}`, `${circumference} ${circumference}`, `${circumference * 0.7} ${circumference}`] }}
            transition={{ duration: 1.6, times: [0, 0.35, 0.65, 1], ease: "easeInOut" }}
          />
          <m.circle
            cx={MARK_DOT.cx}
            cy={MARK_DOT.cy}
            r={MARK_DOT.r}
            fill="rgb(var(--v5-progress))"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: [1, 1, 1.9, 0.6, 1], opacity: [1, 1, 0.9, 0.4, 1] }}
            transition={{ duration: 1.6, times: [0, 0.3, 0.45, 0.6, 1], ease: "easeOut" }}
          />
        </>
      )}
    </svg>
  );
}
