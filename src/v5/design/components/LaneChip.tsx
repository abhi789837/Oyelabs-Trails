import { LANE_META } from "@/features/plan/laneMeta";
import { cn } from "../cn";
import type { PlanLane } from "@shared/weeklyPlan";

/**
 * v5 lane classes. Labels, hints and icons come from the v4.3 `LANE_META` so the two designs
 * name lanes identically; colours are the v5 lane tokens.
 */
export const LANE_CLASSES: Record<PlanLane, { soft: string; fg: string; dot: string; solid: string; stroke: string; cssVar: string }> = {
  do_now: { soft: "bg-lane-now-soft", fg: "text-lane-now-fg", dot: "bg-lane-now", solid: "bg-lane-now text-on-lane-now", stroke: "stroke-lane-now", cssVar: "--v5-lane-now" },
  must_know: { soft: "bg-lane-must-soft", fg: "text-lane-must-fg", dot: "bg-lane-must", solid: "bg-lane-must text-on-lane-must", stroke: "stroke-lane-must", cssVar: "--v5-lane-must" },
  medium: { soft: "bg-lane-medium-soft", fg: "text-lane-medium-fg", dot: "bg-lane-medium", solid: "bg-lane-medium text-on-lane-medium", stroke: "stroke-lane-medium", cssVar: "--v5-lane-medium" },
  low: { soft: "bg-lane-low-soft", fg: "text-lane-low-fg", dot: "bg-lane-low", solid: "bg-lane-low text-on-lane-low", stroke: "stroke-lane-low", cssVar: "--v5-lane-low" },
};

export const LANES: readonly PlanLane[] = ["do_now", "must_know", "medium", "low"];

/** A CSS colour for an SVG stroke or fill. */
export function v5LaneColor(lane: PlanLane, alpha = 1): string {
  const v = LANE_CLASSES[lane].cssVar;
  return alpha === 1 ? `rgb(var(${v}))` : `rgb(var(${v}) / ${alpha})`;
}

export function LaneChip({ lane, size = "md", showIcon = true, className }: { lane: PlanLane; size?: "sm" | "md"; showIcon?: boolean; className?: string }) {
  const meta = LANE_META[lane];
  const cls = LANE_CLASSES[lane];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-caption" : "px-2.5 py-1 text-small",
        cls.soft,
        cls.fg,
        className,
      )}
    >
      {showIcon ? <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden="true" /> : null}
      {meta.label}
    </span>
  );
}
