import { CircleAlert, Flag, KeyRound, Mountain, Sparkle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { PlanLane } from "@shared/weeklyPlan";

/**
 * What each lane looks like and what it is called.
 *
 * One file so the trail and the list cannot drift: a marker on the map and a chip in the list are the
 * same claim about the same item, and the moment the red on one is a different red from the red on the
 * other, the page stops being one thing.
 *
 * ## The colours
 *
 * Do it now is `destructive`, Medium is `warning` (the trail's amber), Low is `basalt` (the muted
 * grey). Must know takes `primary`, the brand navy — the brief offers "blue or grey" for Low and
 * "brand navy/blue" for Must know, which would have been the same colour twice, so Low takes the grey
 * and Must know the navy. That also matches what they mean: Must know is a deliberate, branded part
 * of the plan, Low is the part the learner may ignore.
 *
 * Colours arrive as small dots and chips rather than filled blocks. Four lanes of solid colour on one
 * page is a traffic light, not a plan.
 */

export interface LaneMeta {
  lane: PlanLane;
  /** The heading. */
  label: string;
  /** One line under it, in the list view. */
  hint: string;
  icon: LucideIcon;
  /** The raw CSS variable behind this lane, for SVG strokes and fills. */
  cssVar: string;
  /** Text, border, background and dot classes. Spelled out: Tailwind needs whole class names. */
  text: string;
  border: string;
  soft: string;
  dot: string;
  /** A filled marker on the trail. */
  solid: string;
  ring: string;
  /** Collapsible, and collapsed by default on a small screen. */
  collapsible: boolean;
}

export const LANE_META: Record<PlanLane, LaneMeta> = {
  do_now: {
    lane: "do_now",
    label: "Do it now",
    hint: "Blocking work. Clear these first.",
    icon: CircleAlert,
    cssVar: "--destructive",
    text: "text-destructive",
    border: "border-destructive/40",
    soft: "bg-destructive/[0.07]",
    dot: "bg-destructive",
    solid: "bg-destructive text-destructive-foreground",
    ring: "ring-destructive/50",
    collapsible: false,
  },
  must_know: {
    lane: "must_know",
    label: "Must know",
    hint: "Short essentials the work above depends on.",
    icon: KeyRound,
    cssVar: "--primary",
    text: "text-primary-strong",
    border: "border-primary/40",
    soft: "bg-primary/[0.07]",
    dot: "bg-primary",
    solid: "bg-primary text-primary-foreground",
    ring: "ring-primary/50",
    collapsible: true,
  },
  medium: {
    lane: "medium",
    label: "Good to know",
    hint: "Worth doing this week if the time is there.",
    icon: Sparkle,
    cssVar: "--trailmark",
    text: "text-warning-strong",
    border: "border-warning/40",
    soft: "bg-warning/[0.07]",
    dot: "bg-warning",
    solid: "bg-warning text-warning-foreground",
    ring: "ring-warning/50",
    collapsible: true,
  },
  low: {
    lane: "low",
    label: "Extra",
    hint: "Nice to have. Skip these without guilt.",
    icon: Flag,
    cssVar: "--basalt",
    text: "text-basalt-strong",
    border: "border-basalt/40",
    soft: "bg-basalt/[0.07]",
    dot: "bg-basalt",
    solid: "bg-basalt text-basalt-foreground",
    ring: "ring-basalt/50",
    collapsible: true,
  },
};

/** A CSS colour for an SVG stroke or fill: `laneColor("do_now", 0.2)`. */
export function laneColor(lane: PlanLane, alpha = 1): string {
  const { cssVar } = LANE_META[lane];
  return alpha === 1 ? `rgb(var(${cssVar}))` : `rgb(var(${cssVar}) / ${alpha})`;
}

/** The summit at the end of the week. Green, like every other summit in this product. */
export const SUMMIT = { icon: Mountain, cssVar: "--summit" } as const;

export function summitColor(alpha = 1): string {
  return alpha === 1 ? "rgb(var(--summit))" : `rgb(var(--summit) / ${alpha})`;
}

/** Why an item is here, in the fewest words that are still true. */
export const SOURCE_LABEL = {
  admin_priority: "Set by your administrator",
  ai_gap: "From your assessment",
  prerequisite: "Groundwork",
} as const;
