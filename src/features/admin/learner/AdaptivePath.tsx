import { accentColor } from "@/lib/accent";

export interface AdaptiveStep {
  /** The difficulty of the item that was served, 1..5. */
  difficulty: number;
  /** Null when the item was skipped or is still awaiting a rubric grade. */
  correct: boolean | null;
}

const WIDTH = 216;
const HEIGHT = 84;
const PAD_X = 14;
const PAD_Y = 12;

function yFor(difficulty: number): number {
  const clamped = Math.min(5, Math.max(1, difficulty));
  return PAD_Y + ((5 - clamped) / 4) * (HEIGHT - PAD_Y * 2);
}

/**
 * The staircase one area walked: the difficulty of each item in the order it was served, with the
 * outcome on each marker.
 *
 * Inline SVG rather than a chart library, like `ElevationProfile` — five gridlines and at most six
 * points is not worth a dependency, and the point of the picture is the *shape*: a line that
 * climbs and stays high reads differently from one that saws between two levels, which is exactly
 * what a reversal-heavy estimate looks like.
 */
export function AdaptivePath({ area, steps }: { area: string; steps: AdaptiveStep[] }) {
  if (steps.length === 0) {
    return (
      <div className="rounded-md border px-3 py-2">
        <p className="text-sm font-medium">{area}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">No items served.</p>
      </div>
    );
  }

  const step = steps.length === 1 ? 0 : (WIDTH - PAD_X * 2) / (steps.length - 1);
  const points = steps.map((entry, i) => ({ x: PAD_X + i * step, y: yFor(entry.difficulty) }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  const label = `${area}: difficulty ${steps
    .map((entry) => `${entry.difficulty} ${entry.correct === null ? "unscored" : entry.correct ? "correct" : "incorrect"}`)
    .join(", then ")}.`;

  const last = steps[steps.length - 1];

  return (
    <div className="rounded-md border px-3 py-2">
      <p className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-medium">{area}</span>
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular">
          {steps.length} item{steps.length === 1 ? "" : "s"} · ended at {last.difficulty}
        </span>
      </p>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-1 w-full"
        style={{ maxWidth: WIDTH }}
        role="img"
        aria-label={label}
      >
        {[1, 2, 3, 4, 5].map((level) => (
          <g key={level}>
            <line
              x1={PAD_X - 6}
              x2={WIDTH - PAD_X + 6}
              y1={yFor(level)}
              y2={yFor(level)}
              stroke={accentColor("basalt", level === 3 ? 0.28 : 0.14)}
              strokeWidth={1}
            />
            <text x={0} y={yFor(level) + 3} className="fill-current font-mono text-[7px] text-muted-foreground">
              {level}
            </text>
          </g>
        ))}

        <path d={line} fill="none" stroke={accentColor("trailmark", 0.75)} strokeWidth={1.75} strokeLinecap="round" />

        {points.map((point, i) => {
          const outcome = steps[i].correct;
          return (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r={3.5}
              fill={
                outcome === null
                  ? "rgb(var(--background))"
                  : outcome
                    ? accentColor("summit")
                    : "rgb(var(--destructive))"
              }
              stroke={outcome === null ? accentColor("basalt") : "rgb(var(--background))"}
              strokeWidth={1.25}
            />
          );
        })}
      </svg>
    </div>
  );
}
