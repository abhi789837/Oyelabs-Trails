import { MARK_OUTER, MARK_OUTER_WIDTH, MARK_VIEWBOX, RING_RADIUS, cx } from "./brandAssets";

export interface BrandLoaderProps {
  /** Pixel size (square). */
  size?: number;
  /** Announced to screen readers ("Loading" by default). Shown visibly with `showLabel`. */
  label?: string;
  showLabel?: boolean;
  className?: string;
}

/**
 * The kit's loader (10-motion/loader.svg), inline: the blue outer ring holds still while the amber
 * ring draws, spins and releases, never closing. The animation lives in src/index.css
 * (`.brand-loader-*`) and stops for reduced motion (the OS setting or v5's own), leaving a still
 * three-quarter ring.
 *
 * For full-page loading and auth redirects. Content keeps its skeletons.
 */
export function BrandLoader({ size = 48, label = "Loading", showLabel = false, className }: BrandLoaderProps) {
  return (
    <span role="status" className={cx("inline-flex flex-col items-center gap-3", className)} data-brand="loader">
      <svg viewBox={MARK_VIEWBOX} width={size} height={size} aria-hidden="true" focusable="false" className="text-primary">
        {MARK_OUTER.map((d) => (
          <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth={MARK_OUTER_WIDTH} />
        ))}
        <g className="brand-loader-spin">
          <circle className="brand-loader-arc" cx="100" cy="100" r={RING_RADIUS} fill="none" stroke="rgb(var(--accent-500))" strokeWidth="20" strokeLinecap="round" />
        </g>
      </svg>
      <span className={showLabel ? "text-sm text-muted-foreground" : "sr-only"}>{label}</span>
    </span>
  );
}
