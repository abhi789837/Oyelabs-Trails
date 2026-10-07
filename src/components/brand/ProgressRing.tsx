import { MARK_OUTER, MARK_OUTER_WIDTH, MARK_VIEWBOX, RING_RADIUS, cx } from "./brandAssets";
import { progressRingGeometry } from "./ringGeometry";

export interface ProgressRingProps {
  /** 0–100. */
  value: number;
  /** Pixel size (square). */
  size?: number;
  /** The accessible name, e.g. "React course progress". */
  label?: string;
  className?: string;
}

/**
 * Progress in the brand's own shape: the blue outer ring of the mark, and an amber inner arc that
 * fills to `value` with the dot just ahead of its tip. Never fully closed: 100% draws 92% of the
 * circle and shows a check. The amber is the `progress` token (v5) or `trailmark` (the old UI),
 * which clear 3:1 against light surfaces.
 */
export function ProgressRing({ value, size = 48, label = "Progress", className }: ProgressRingProps) {
  const g = progressRingGeometry(value);
  const amber = "rgb(var(--v5-progress, var(--trailmark)))";
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={g.value}
      aria-valuetext={g.complete ? "Complete" : `${g.value}%`}
      className={cx("inline-flex shrink-0", className)}
      data-brand="progress-ring"
      data-complete={g.complete || undefined}
    >
      <svg viewBox={MARK_VIEWBOX} width={size} height={size} aria-hidden="true" focusable="false" className="text-primary">
        {MARK_OUTER.map((d) => (
          <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth={MARK_OUTER_WIDTH} />
        ))}
        {g.arcLength > 0 ? (
          <circle
            cx="100"
            cy="100"
            r={RING_RADIUS}
            fill="none"
            stroke={amber}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={`${g.arcLength} ${g.circumference}`}
            transform={`rotate(${g.startDeg} 100 100)`}
          />
        ) : null}
        <circle cx={g.dot.cx} cy={g.dot.cy} r="12.4" fill={amber} />
        {g.complete ? (
          <path d="M82 101l12 12 24-26" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
      </svg>
    </span>
  );
}
