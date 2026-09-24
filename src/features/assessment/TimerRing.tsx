import { cn } from "@/lib/utils";

/**
 * The time left on the current question, as a ring around the clock.
 *
 * Deliberately plain. It is a `stroke-dashoffset` on one SVG circle with a one-second linear
 * transition — no motion library, no per-frame work, nothing for the compositor to do while
 * MediaPipe is using the CPU for something that actually matters. The runner's rule is functional
 * transitions only, and a timer that visibly empties is functional: it is the difference between
 * reading a number and feeling the clock.
 *
 * The number inside is the truth; the ring is the glance. It is not announced on every tick — a
 * live region that fires once a second would make the page unusable with a screen reader — so the
 * remaining time is given once, in words, by the label beside it.
 */

const SIZE = 56;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export interface TimerRingProps {
  secondsLeft: number;
  /** What the ring is a fraction of. Zero or less renders an empty ring rather than dividing by it. */
  totalSeconds: number;
  className?: string;
}

export function TimerRing({ secondsLeft, totalSeconds, className }: TimerRingProps) {
  const fraction = totalSeconds > 0 ? Math.max(0, Math.min(1, secondsLeft / totalSeconds)) : 0;
  // Under a minute is the point where someone should look up, so that is where the colour changes.
  const tone = secondsLeft <= 0 ? "text-destructive" : secondsLeft <= 60 ? "text-destructive" : secondsLeft <= 180 ? "text-trailmark" : "text-summit";

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-foreground/10"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          className={cn("transition-[stroke-dashoffset,stroke] duration-1000 ease-linear", tone)}
          stroke="currentColor"
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-mono text-xs tabular",
          secondsLeft <= 60 && "text-destructive",
        )}
        aria-hidden="true"
      >
        {formatClock(secondsLeft)}
      </span>
    </div>
  );
}

export function formatClock(seconds: number): string {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}
