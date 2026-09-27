import { useId, useMemo } from "react";

import { cn } from "@/lib/utils";

/**
 * A seven-point sparkline, hand-drawn in SVG.
 *
 * No chart library. A sparkline is a polyline and a fill, and pulling in a charting package to draw
 * one would add ~90 KB, a second theming system and a palette of its own — every colour in here is
 * a design token, so dark mode is a variable swap like everything else.
 *
 * `currentColor` is what actually carries the colour: the caller sets `text-summit` or
 * `text-trailmark` and the stroke, the fill gradient and the last dot all follow. That is why there
 * is no `color` prop.
 *
 * ## Honesty rules
 *
 * - A flat series is drawn flat, down the middle, not scaled up into a dramatic shape. `max === min`
 *   is the common case on a quiet week and it should look quiet.
 * - The baseline is **zero**, not the minimum. Scaling 4→5 to the full height would read as a 25%
 *   day-on-day jump becoming a cliff.
 * - The graphic is `aria-hidden`; the accessible content is the sentence in the `sr-only` span,
 *   because "a line that rises" is not information a screen reader can use.
 */
export interface SparklineProps {
  /** Oldest first. Fewer than two points draws nothing. */
  values: readonly number[];
  /** What one point is, for the screen-reader sentence: "calls", "events". */
  noun: string;
  /** Labels the series in that sentence: "AI calls over the last seven days". */
  label: string;
  className?: string;
  height?: number;
  /** Draws the filled area under the line. Off for a series that is mostly zero. */
  area?: boolean;
}

const WIDTH = 100;

export function Sparkline({ values, noun, label, className, height = 28, area = true }: SparklineProps) {
  const gradientId = useId();

  const geometry = useMemo(() => {
    if (values.length < 2) return null;
    const max = Math.max(...values);
    // Zero baseline, and a flat line sits mid-height rather than being stretched to fill.
    const top = 2;
    const bottom = height - 2;
    const span = bottom - top;
    const y = (v: number) => (max === 0 ? top + span / 2 : bottom - (v / max) * span);
    const x = (i: number) => (i / (values.length - 1)) * WIDTH;
    const points = values.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`);
    return {
      line: `M${points.join("L")}`,
      fill: `M${points.join("L")}L${WIDTH},${bottom}L0,${bottom}Z`,
      lastX: x(values.length - 1),
      lastY: y(values[values.length - 1]),
      max,
    };
  }, [values, height]);

  const total = values.reduce((sum, v) => sum + v, 0);
  const latest = values.length > 0 ? values[values.length - 1] : 0;

  return (
    <div className={cn("relative", className)}>
      {geometry && (
        <svg
          viewBox={`0 0 ${WIDTH} ${height}`}
          preserveAspectRatio="none"
          className="block w-full overflow-visible"
          style={{ height }}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {area && <path d={geometry.fill} fill={`url(#${gradientId})`} />}
          <path
            d={geometry.line}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* The newest point, so "where are we now" does not need counting across. */}
          <circle cx={geometry.lastX} cy={geometry.lastY} r="2" fill="currentColor" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      <span className="sr-only">
        {label}: {total} {noun} over the last {values.length} days, {latest} today.
      </span>
    </div>
  );
}

/**
 * A horizontal bar for one row of a comparison — AI calls per purpose, plans per level.
 *
 * Separate from `Sparkline` because it answers a different question: a sparkline is "how has this
 * moved", a bar is "how does this compare". Sharing one component between them would need a `kind`
 * prop and would end up as two components inside one file anyway.
 */
export function MiniBar({
  value,
  max,
  className,
  tone = "brand",
}: {
  value: number;
  max: number;
  className?: string;
  tone?: "brand" | "summit" | "trailmark" | "danger";
}) {
  const pct = max <= 0 ? 0 : Math.max(value > 0 ? 2 : 0, Math.round((value / max) * 100));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-foreground/10", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
          tone === "brand" && "bg-primary",
          tone === "summit" && "bg-summit",
          tone === "trailmark" && "bg-trailmark",
          tone === "danger" && "bg-destructive",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
