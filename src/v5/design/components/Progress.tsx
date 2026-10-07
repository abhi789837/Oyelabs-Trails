import { m } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "../cn";

import { transitions } from "../motion";
import { clampPct } from "../progress";

/**
 * `progress` (amber, the default) is the learner's own progress: lessons done, the week, reading.
 * `brand` is for work the app is doing (an upload); the others are for status.
 */
export type ProgressTone = "progress" | "brand" | "success" | "warning" | "danger";

const FILL: Record<ProgressTone, string> = {
  progress: "bg-progress",
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

// The goal ring is the brand's own ProgressRing (src/components/brand/ProgressRing): the mark's blue
// outer ring with the amber arc and the "you are here" dot. It lives in its own file so routes that
// only show a bar don't carry it.

export interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: ProgressTone;
  label: string;
  /** Show "3 of 8" style text above the bar. */
  showValue?: boolean | ReactNode;
  size?: "sm" | "md";
  className?: string;
}

/**
 * A bar in the brand's dot motif: the fill, a small gap, and the "you are here" dot just ahead of
 * it (the mark's inner ring and dot, unrolled). No dot at 0 or 100%.
 */
export function ProgressBar({ value, max = 100, tone = "progress", label, showValue, size = "md", className }: ProgressBarProps) {
  const pct = clampPct(value, max);
  const dot = pct > 0 && pct < 100;
  const d = size === "sm" ? 6 : 10;
  const gap = size === "sm" ? 3 : 4;
  return (
    <div className={cn("w-full", className)}>
      {showValue ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-small">
          <span className="text-fg-2">{label}</span>
          <span className="font-medium tabular-nums text-fg-1">{showValue === true ? `${pct}%` : showValue}</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className={cn("relative overflow-hidden rounded-full bg-sunken", size === "sm" ? "h-1.5" : "h-2.5")}
      >
        {/* The fill stops a small gap short of the value; the dot's right edge sits on it. */}
        <m.div
          className={cn("h-full origin-left rounded-full", FILL[tone])}
          style={{ width: dot ? `calc(${pct}% - ${d + gap}px)` : "100%" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: dot ? 1 : pct / 100 }}
          transition={transitions.calm}
        />
        {dot ? (
          <m.span
            aria-hidden="true"
            data-progress-dot=""
            className={cn("absolute inset-y-0 rounded-full", FILL[tone])}
            style={{ left: `max(0px, ${pct}% - ${d}px)`, width: d }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...transitions.calm, delay: 0.2 }}
          />
        ) : null}
      </div>
    </div>
  );
}
