import { Check, Mountain } from "lucide-react";
import { m } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { cn } from "../cn";
import type { PlanLane } from "@shared/weeklyPlan";

import { transitions } from "../motion";
import { buildTrail, type TrailStop } from "../trail";
import { LANE_CLASSES, v5LaneColor } from "./LaneChip";

export interface WaypointProps {
  title: string;
  meta?: string;
  lane?: PlanLane;
  done: boolean;
  here?: boolean;
  onSelect?: () => void;
  size?: number;
}

/** The marker on its own: a filled tick when done, a ringed dot for "you are here", a lane dot otherwise. */
export function Waypoint({ title, meta, lane = "must_know", done, here, onSelect, size = 28 }: WaypointProps) {
  const label = `${title}${meta ? `, ${meta}` : ""}${done ? ", done" : here ? ", you are here" : ""}`;
  const marker = (
    <span
      className={cn(
        "relative grid place-items-center rounded-full border-2 transition-transform duration-120",
        done ? "border-success bg-success text-on-success" : here ? "border-brand bg-surface-1" : "border-line-2 bg-surface-1",
      )}
      style={{ width: size, height: size }}
    >
      {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : <span className={cn("size-2.5 rounded-full", LANE_CLASSES[lane].dot)} aria-hidden="true" />}
      {here && !done ? <span className="absolute -inset-1.5 rounded-full border-2 border-brand/40 motion-safe:animate-waypoint-pulse" aria-hidden="true" /> : null}
    </span>
  );
  if (!onSelect) return <span aria-hidden="true">{marker}</span>;
  return (
    <button type="button" onClick={onSelect} aria-label={label} className="rounded-full hover:scale-105">
      {marker}
    </button>
  );
}

export interface TrailProps {
  stops: readonly TrailStop[];
  /** Accessible name of the list: "This week's trail". */
  label: string;
  startLabel?: ReactNode;
  summitLabel?: ReactNode;
  compact?: boolean;
  onSelect?: (stop: TrailStop) => void;
  className?: string;
}

/**
 * The trail: one continuous path from trailhead to summit, waypoints in plan order, the walked
 * part drawn over the same path. The stops are also an ordered list, so a screen reader gets the
 * plan without the drawing.
 */
export function Trail({ stops, label, startLabel = "Start", summitLabel = "Summit", compact, onSelect, className }: TrailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geometry = useMemo(() => (width > 0 ? buildTrail(stops, { width, compact }) : null), [stops, width, compact]);

  return (
    <div ref={ref} className={cn("relative w-full", className)} style={{ height: geometry?.height ?? 240 }}>
      {geometry ? (
        <>
          <svg className="absolute inset-0" width={geometry.width} height={geometry.height} aria-hidden="true" data-testid="v5-trail-path">
            <path d={geometry.d} fill="none" className="stroke-line-2" strokeWidth={3} strokeDasharray="2 7" strokeLinecap="round" />
            {geometry.progressD ? (
              <m.path
                d={geometry.progressD}
                fill="none"
                stroke={geometry.summitReached ? "rgb(var(--v5-success))" : v5LaneColor("must_know")}
                strokeWidth={4}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={transitions.story}
              />
            ) : null}
          </svg>
          <ol aria-label={label} className="absolute inset-0">
            {geometry.waypoints.map((wp) => {
              const stop = wp.kind === "item" ? stops[wp.itemIndex] : null;
              const here = wp.kind === "item" && wp.itemIndex === geometry.hereIndex;
              return (
                <li
                  key={wp.id}
                  className="absolute"
                  style={{ left: 0, top: 0, transform: `translate(${wp.point.x}px, ${wp.point.y}px)` }}
                  aria-current={here ? "step" : undefined}
                >
                  <span className="absolute -translate-x-1/2 -translate-y-1/2">
                    {stop ? (
                      <Waypoint title={stop.title} meta={stop.meta} lane={stop.lane} done={stop.done} here={here} onSelect={onSelect ? () => onSelect(stop) : undefined} />
                    ) : (
                      <span
                        className={cn(
                          "grid size-9 place-items-center rounded-full border-2",
                          wp.kind === "end" && wp.done ? "border-success bg-success text-on-success" : "border-line-2 bg-surface-1 text-fg-2",
                        )}
                        aria-hidden="true"
                      >
                        {wp.kind === "end" ? <Mountain className="size-4" /> : <span className="size-2 rounded-full bg-fg-3" />}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn("absolute -translate-y-1/2", wp.label.side === "left" ? "text-right" : "text-left")}
                    style={{ left: wp.label.left - wp.point.x, width: wp.label.width }}
                  >
                    {stop ? (
                      <>
                        <span className={cn("block font-display font-semibold leading-snug text-fg-1", compact ? "text-small" : "text-body")}>{stop.title}</span>
                        {stop.meta ? <span className="block font-mono text-caption text-fg-2">{stop.meta}</span> : null}
                        {here ? <span className="block text-caption font-semibold text-brand-fg">You are here</span> : null}
                        {stop.done ? <span className="sr-only">Done</span> : null}
                      </>
                    ) : (
                      <span className="block font-display text-small font-semibold text-fg-2">{wp.kind === "start" ? startLabel : summitLabel}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      ) : null}
    </div>
  );
}
