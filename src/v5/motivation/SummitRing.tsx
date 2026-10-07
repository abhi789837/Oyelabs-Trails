import { m } from "motion/react";

import { MARK_COLOURS, MARK_DOT, MARK_OUTER, MARK_OUTER_WIDTH, MARK_VIEWBOX, RING_RADIUS } from "@/components/brand/brandAssets";
import { RING_START_DEG } from "@/components/brand/ringGeometry";
import { usePrefersReducedMotion } from "@/v5/design/hooks";

/**
 * The weekly summit, as the brand guideline draws it (PDF p12, "Celebration"): the mark's amber
 * ring completes for a moment while the dot pops, then the ring opens again for the next level.
 * About 1.6 s, once. Under reduced motion (the OS, or Me → Settings) it is the still mark.
 *
 * Drawn from the kit's own geometry (src/components/brand/brandAssets): the outer ring paths
 * verbatim, and the inner ring as a circle of the same radius whose dash runs from the mark's own
 * start point, so the resting frames are the mark itself.
 */

const C = 2 * Math.PI * RING_RADIUS;
/** The mark's inner arc: from its start (about 64°) clockwise to its end (about 316°), 70% of the circle. */
const OPEN = (252 / 360) * C;
const OPEN_DASH = `${OPEN} ${C}`;
const CLOSED_DASH = `${C} ${C}`;
/** The mark keeps the kit's own amber (#F59E0B), as the logo files do. */
const AMBER = MARK_COLOURS.light.inner;

export function SummitRing({ size = 72, still = false }: { size?: number; still?: boolean }) {
  const reduce = usePrefersReducedMotion();
  const animate = !still && !reduce;
  return (
    <svg viewBox={MARK_VIEWBOX} width={size} height={size} aria-hidden="true" focusable="false" className="text-primary" data-testid="summit-ring">
      {MARK_OUTER.map((d) => (
        <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth={MARK_OUTER_WIDTH} />
      ))}
      <m.circle
        cx="100"
        cy="100"
        r={RING_RADIUS}
        fill="none"
        stroke={AMBER}
        strokeWidth="20"
        strokeLinecap="round"
        transform={`rotate(${RING_START_DEG} 100 100)`}
        initial={false}
        strokeDasharray={OPEN_DASH}
        animate={animate ? { strokeDasharray: [OPEN_DASH, CLOSED_DASH, CLOSED_DASH, OPEN_DASH] } : undefined}
        transition={{ duration: 1.6, times: [0, 0.3, 0.65, 1], ease: "easeInOut" }}
      />
      <m.circle
        cx={MARK_DOT.cx}
        cy={MARK_DOT.cy}
        r={MARK_DOT.r}
        fill={AMBER}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        initial={false}
        animate={animate ? { scale: [1, 1.9, 0, 0, 1], opacity: [1, 1, 0, 0, 1] } : undefined}
        transition={{ duration: 1.6, times: [0, 0.2, 0.32, 0.7, 1], ease: "easeOut" }}
      />
    </svg>
  );
}
