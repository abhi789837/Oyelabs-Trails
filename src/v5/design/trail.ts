import { computeTrail, estimateLabelHeight, type TrailGeometry } from "@/features/plan/trailGeometry";
import type { PlanLane } from "@shared/weeklyPlan";

/**
 * The v5 Trail's data shape, mapped onto the v4.3 pure geometry (`features/plan/trailGeometry`).
 *
 * The geometry is reused, not copied: the one-continuous-path rule (exactly one `M`, progress is a
 * prefix of the same path, positions from item order only) lives there and is tested there.
 * `trail.test.ts` checks that this adapter keeps it.
 */

export interface TrailStop {
  id: string;
  title: string;
  /** Short meta line: "Must know · 45 min". */
  meta?: string;
  /** Colours the marker and the stretch leading into it. Defaults to "must_know". */
  lane?: PlanLane;
  done: boolean;
}

export interface BuildTrailOptions {
  width: number;
  compact?: boolean;
  /** Extra short lines under the current stop ("You are here"). */
  hereLines?: number;
}

export function buildTrail(stops: readonly TrailStop[], { width, compact = false, hereLines = 1 }: BuildTrailOptions): TrailGeometry {
  const hereIndex = stops.findIndex((s) => !s.done);
  return computeTrail({
    width,
    compact,
    items: stops.map((stop, i) => ({
      id: stop.id,
      tone: stop.lane ?? "must_know",
      done: stop.done,
      labelHeight: (labelWidth: number) =>
        estimateLabelHeight({ title: stop.title, meta: stop.meta, extraLines: i === hereIndex ? hereLines : 0, compact }, labelWidth),
    })),
  });
}

/** Counts `M` commands; the trail must have exactly one. */
export function moveCount(d: string): number {
  return (d.match(/M/g) ?? []).length;
}
