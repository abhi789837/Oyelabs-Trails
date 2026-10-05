import { m } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "../cn";

import { transitions } from "../motion";
import { clampPct, ringGeometry } from "../progress";

export type ProgressTone = "brand" | "success" | "warning" | "danger";

const STROKE: Record<ProgressTone, string> = {
  brand: "stroke-brand",
  success: "stroke-success",
  warning: "stroke-warning",
  danger: "stroke-danger",
};
const FILL: Record<ProgressTone, string> = {
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  tone?: ProgressTone;
  /** What is being measured, read by screen readers: "Weekly goal". */
  label: string;
  /** Centre content; defaults to the percentage. */
  children?: ReactNode;
  className?: string;
}

/** A goal ring. The track is a 3:1-visible line; the fill animates once on mount (story duration). */
export function ProgressRing({ value, max = 100, size = 96, stroke = 8, tone = "brand", label, children, className }: ProgressRingProps) {
  const pct = clampPct(value, max);
  const { radius, circumference, offset, center } = ringGeometry(size, stroke, pct);
  return (
    <div
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={stroke} className="stroke-sunken" />
        <m.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={STROKE[tone]}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={transitions.story}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-center font-display text-h4 font-semibold tabular-nums text-fg-1">
        {children ?? `${pct}%`}
      </span>
    </div>
  );
}

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

export function ProgressBar({ value, max = 100, tone = "brand", label, showValue, size = "md", className }: ProgressBarProps) {
  const pct = clampPct(value, max);
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
        className={cn("overflow-hidden rounded-full bg-sunken", size === "sm" ? "h-1.5" : "h-2.5")}
      >
        <m.div
          className={cn("h-full origin-left rounded-full", FILL[tone])}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          transition={transitions.calm}
        />
      </div>
    </div>
  );
}
