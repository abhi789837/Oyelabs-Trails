import { Flame, Snowflake } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "../cn";

import { usePrefersReducedMotion } from "../hooks";
import { durationMs } from "../motion";
import { clampSkill, formatXp, lastWeeks, skillLabel, skillSegments, tickerFrames, type StreakWeek } from "../progress";

// ---------------------------------------------------------------------------
// StatTile
// ---------------------------------------------------------------------------

export interface StatTileProps {
  label: string;
  value: ReactNode;
  /** One line of context: "2 more than last week". */
  detail?: ReactNode;
  icon?: ReactNode;
  trend?: "up" | "down" | "flat";
  className?: string;
}

/** A single number with its label. The label comes first for screen readers (dt/dd). */
export function StatTile({ label, value, detail, icon, trend, className }: StatTileProps) {
  return (
    <dl className={cn("flex min-w-0 flex-col gap-1 rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad) shadow-e1", className)}>
      <dt className="flex items-center gap-2 text-small text-fg-2">
        {icon ? <span className="text-fg-2 [&_svg]:size-4" aria-hidden="true">{icon}</span> : null}
        {label}
      </dt>
      <dd className="font-display text-h2 font-semibold tabular-nums text-fg-1">{value}</dd>
      {detail ? (
        <dd
          className={cn(
            "text-small",
            trend === "up" && "text-success-fg",
            trend === "down" && "text-danger-fg",
            (!trend || trend === "flat") && "text-fg-2",
          )}
        >
          {detail}
        </dd>
      ) : null}
    </dl>
  );
}

// ---------------------------------------------------------------------------
// SkillMeter (0–5)
// ---------------------------------------------------------------------------

export function SkillMeter({ level, label, target, className }: { level: number; label: string; target?: number; className?: string }) {
  const value = clampSkill(level);
  const segments = skillSegments(value);
  const t = target === undefined ? undefined : clampSkill(target);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2 text-small">
        <span className="font-medium text-fg-1">{label}</span>
        <span className="text-fg-2">
          {skillLabel(value)} · {value} of 5{t !== undefined ? `, aim ${t}` : ""}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={value}
        aria-valuetext={`${skillLabel(value)}, level ${value} of 5`}
        className="flex gap-1"
      >
        {segments.map((state, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              "relative h-2 flex-1 overflow-hidden rounded-full bg-sunken",
              t !== undefined && i + 1 <= t && state === "empty" && "outline outline-1 -outline-offset-1 outline-line-2",
            )}
          >
            {state !== "empty" ? <span className={cn("absolute inset-y-0 left-0 rounded-full bg-brand", state === "full" ? "w-full" : "w-1/2")} /> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StreakFlame (weekly)
// ---------------------------------------------------------------------------

export interface StreakFlameProps {
  /** Weeks in a row the weekly goal was met. */
  current: number;
  best?: number;
  freezesLeft?: number;
  history?: readonly StreakWeek[];
  className?: string;
}

/** A weekly streak (never daily: we don't punish a weekend). Frozen weeks show a snowflake. */
export function StreakFlame({ current, best, freezesLeft, history = [], className }: StreakFlameProps) {
  const weeks = lastWeeks(history, 8);
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-3">
        <span className={cn("grid size-11 place-items-center rounded-full", current > 0 ? "bg-warning-soft text-warning-fg" : "bg-sunken text-fg-3")} aria-hidden="true">
          <Flame className="size-6" />
        </span>
        <div>
          <p className="font-display text-h3 font-semibold tabular-nums text-fg-1">
            {current} {current === 1 ? "week" : "weeks"}
          </p>
          <p className="text-small text-fg-2">
            {best !== undefined ? `Best ${best}` : "Weekly streak"}
            {freezesLeft !== undefined ? ` · ${freezesLeft} ${freezesLeft === 1 ? "freeze" : "freezes"} left` : ""}
          </p>
        </div>
      </div>
      <ol className="flex gap-1.5" aria-label="The last 8 weeks">
        {weeks.map((w, i) => (
          <li
            key={w?.week ?? `empty-${i}`}
            className={cn(
              "grid h-7 flex-1 place-items-center rounded-md text-caption",
              !w && "bg-sunken",
              w?.met && "bg-warning text-on-warning",
              w?.frozen && "bg-info-soft text-info-fg",
              w && !w.met && !w.frozen && "border border-dashed border-line-2",
            )}
          >
            {w?.frozen ? <Snowflake className="size-3.5" aria-hidden="true" /> : w?.met ? <Flame className="size-3.5" aria-hidden="true" /> : null}
            <span className="sr-only">{w ? `${w.week}: ${w.frozen ? "frozen" : w.met ? "goal met" : "missed"}` : "no data"}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// XPCounter
// ---------------------------------------------------------------------------

/** Total XP. When `value` rises it ticks up over ~500 ms (instantly with reduced motion). */
export function XPCounter({ value, gained, className }: { value: number; gained?: number; className?: string }) {
  const reduce = usePrefersReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduce || value <= from.current) {
      setShown(value);
      from.current = value;
      return;
    }
    const frames = tickerFrames(from.current, value, 12);
    let i = 0;
    const id = window.setInterval(() => {
      setShown(frames[i]);
      i += 1;
      if (i >= frames.length) window.clearInterval(id);
    }, durationMs.story / frames.length);
    from.current = value;
    return () => window.clearInterval(id);
  }, [value, reduce]);
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-display text-h3 font-semibold tabular-nums text-fg-1" aria-hidden="true">
        {formatXp(shown)}
      </span>
      <span className="sr-only">{formatXp(value)}</span>
      {gained ? (
        <span className="rounded-full bg-success-soft px-2 py-0.5 text-caption font-semibold text-success-fg" aria-live="polite">
          +{gained} XP
        </span>
      ) : null}
    </span>
  );
}
