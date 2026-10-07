import { useMemo, useState } from "react";
import { Check, ChevronDown, Flag, Mountain } from "lucide-react";
import { m } from "motion/react";

import { computeTrail, estimateLabelHeight, type TrailGeometry, type TrailWaypoint } from "@/features/plan/trailGeometry";
import { useElementWidth } from "@/hooks/useElementWidth";
import { LANE_META } from "@/features/plan/laneMeta";
import { LANE_CLASSES, v5LaneColor } from "@/v5/design/components/LaneChip";
import { cn } from "@/v5/design/cn";
import { usePrefersReducedMotion } from "@/v5/design/hooks";
import { transitions } from "@/v5/design/motion";
import type { LearningPathView, PartType, PathItemView } from "@shared/builder";
import type { PlanLane, WeekItemView, WeekView } from "@shared/weeklyPlan";

import { formatMinutes } from "../me/page";
import { PART_TONE, currentMilestone, milestoneDone, planOrder, sortMilestones } from "./planLogic";
import { plainTitle } from "@shared/plainTitle";
import { laterGroupLabel, laterLabel, needsLine, splitPath } from "@shared/pathView";
import { OYELABS_BADGE_TEXT as OYELABS_BADGE } from "@shared/oyelabsCore";

/**
 * The v5 trails, drawn from the v4.3 pure geometry (`features/plan/trailGeometry`). Same rule as
 * before: the route is ONE `<path>` with one `M` (`data-testid="week-trail-path"` /
 * `"overview-trail-path"`), and the walked part is a prefix of that same path, drawn over it.
 * Lane colours come from the v5 lane tokens. The walked part is amber (progress, brand kit p6) and
 * "You are here" is the mark's amber dot, sitting just ahead of the current stop.
 */

const toneColor = (tone: string, alpha = 1) =>
  tone === "summit" ? (alpha === 1 ? "rgb(var(--v5-success))" : `rgb(var(--v5-success) / ${alpha})`) : v5LaneColor(tone as PlanLane, alpha);

function Endpoint({ waypoint, title, hint, end, done }: { waypoint: TrailWaypoint; title: string; hint?: string; end?: boolean; done?: boolean }) {
  return (
    <div aria-hidden="true">
      <span
        className={cn(
          "absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2",
          end && done ? "border-success bg-success text-on-success" : "border-line-2 bg-surface-1 text-fg-2",
        )}
        style={{ left: waypoint.point.x, top: waypoint.point.y }}
      >
        {end ? <Mountain className="size-4" /> : <Flag className="size-4" />}
      </span>
      <span
        className={cn("absolute -translate-y-1/2", waypoint.label.side === "left" ? "text-right" : "text-left")}
        style={{ left: waypoint.label.left, top: waypoint.point.y, width: waypoint.label.width }}
      >
        <span className="block font-display text-small font-semibold text-fg-1">{title}</span>
        {hint ? <span className="block text-caption text-fg-2">{hint}</span> : null}
      </span>
    </div>
  );
}

/**
 * "You are here": the mark's amber dot, just ahead of the current stop (where the mark's dot sits
 * ahead of its inner ring), with a soft pulse that reduced motion stills.
 */
export function HereDot() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-2 grid size-3.5 place-items-center">
      <span className="absolute inset-0 rounded-full bg-progress/40 motion-safe:animate-waypoint-pulse" />
      <span className="relative size-3.5 rounded-full border-2 border-surface-0 bg-progress" />
    </span>
  );
}

function TrailSvg({ geometry, testId, progressTestId, compact }: { geometry: TrailGeometry; testId: string; progressTestId: string; compact?: boolean }) {
  const reduce = usePrefersReducedMotion();
  return (
    <svg width={geometry.width} height={geometry.height} className="absolute inset-0" aria-hidden="true">
      <path d={geometry.d} fill="none" className="stroke-sunken" strokeWidth={compact ? 10 : 14} strokeLinecap="round" />
      {geometry.segments.map((segment) => (
        <path key={segment.index} d={segment.d} fill="none" stroke={toneColor(segment.tone, 0.35)} strokeWidth={compact ? 5 : 7} strokeLinecap="butt" />
      ))}
      <path data-testid={testId} d={geometry.d} fill="none" className="stroke-line-2" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="4 7" />
      {geometry.progressD ? (
        <m.path
          data-testid={progressTestId}
          d={geometry.progressD}
          fill="none"
          stroke="rgb(var(--v5-progress))"
          strokeWidth={4}
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={transitions.story}
        />
      ) : null}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// This week
// ---------------------------------------------------------------------------

/**
 * `hereId`: the lesson the learner is part-way through (Phase 9.2). When it's an open stop this week,
 * "You are here" marks it, so the trail, the card above it and Today all name the same lesson.
 */
export function WeekTrail({ week, selectedId, onSelect, hereId = null }: { week: WeekView; selectedId: string | null; onSelect: (item: WeekItemView) => void; hereId?: string | null }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const items = useMemo(() => planOrder(week.items), [week.items]);
  const resumedIndex = hereId ? items.findIndex((i) => i.id === hereId && i.status !== "done") : -1;
  const geometry = useMemo(() => {
    if (width <= 0) return null;
    const firstOpen = resumedIndex >= 0 ? resumedIndex : items.findIndex((i) => i.status !== "done");
    return computeTrail({
      width,
      startLabelHeight: 44,
      endLabelHeight: 56,
      items: items.map((item, i) => ({
        id: item.id,
        tone: item.lane,
        done: item.status === "done",
        labelHeight: (w: number) => estimateLabelHeight({ title: plainTitle(item.title), meta: `${LANE_META[item.lane].label}   ${formatMinutes(item.minutes)}`, extraLines: i === firstOpen ? 1 : 0 }, w),
      })),
    });
  }, [items, width, resumedIndex]);

  return (
    <div ref={ref} className="relative w-full" style={{ height: geometry?.height ?? 320 }} data-testid="week-trail">
      {geometry ? (
        <>
          <TrailSvg geometry={geometry} testId="week-trail-path" progressTestId="week-trail-progress" />
          <Endpoint waypoint={geometry.waypoints[0]} title="Start of the week" hint={`${items.length} stops`} />
          <ol aria-label="This week's trail, in the order we suggest">
            {items.map((item, i) => {
              const wp = geometry.waypoints[i + 1];
              const here = i === (resumedIndex >= 0 ? resumedIndex : geometry.hereIndex);
              const done = item.status === "done";
              const lane = LANE_CLASSES[item.lane];
              return (
                <li key={item.id} aria-current={here ? "step" : undefined}>
                  <button
                    type="button"
                    data-testid="week-trail-waypoint"
                    aria-expanded={selectedId === item.id}
                    aria-controls="week-item-detail"
                    aria-label={`${i + 1}. ${plainTitle(item.title)}, ${LANE_META[item.lane].label}, ${formatMinutes(item.minutes)}${done ? ", done" : here ? ", you are here" : ""}`}
                    onClick={() => onSelect(item)}
                    className={cn(
                      "absolute z-10 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center font-mono text-caption font-semibold transition-transform duration-120 hover:scale-105",
                      item.lane === "must_know" ? "rounded-md" : "rounded-full",
                      done ? "bg-success text-on-success" : lane.solid,
                      "ring-2 ring-surface-0 ring-offset-0",
                      selectedId === item.id && "outline-2 outline-offset-2 outline-focus",
                    )}
                    style={{ left: wp.point.x, top: wp.point.y }}
                  >
                    {here && !done ? <HereDot /> : null}
                    {done ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : <span aria-hidden="true">{i + 1}</span>}
                  </button>
                  <span
                    aria-hidden="true"
                    className={cn("absolute -translate-y-1/2", wp.label.side === "left" ? "text-right" : "text-left")}
                    style={{ left: wp.label.left, top: wp.point.y, width: wp.label.width }}
                  >
                    <span className={cn("block font-display text-body font-semibold leading-snug", done ? "text-fg-2" : "text-fg-1")}>{plainTitle(item.title)}</span>
                    <span className="block text-caption text-fg-2">
                      <span className={lane.fg}>{LANE_META[item.lane].label}</span>
                      {"   "}
                      {formatMinutes(item.minutes)}
                    </span>
                    {here && !done ? <span className="block text-caption font-semibold text-progress-fg">You are here</span> : null}
                  </span>
                </li>
              );
            })}
          </ol>
          <Endpoint waypoint={geometry.waypoints[geometry.waypoints.length - 1]} title={geometry.summitReached ? "Week done" : `End of week ${week.weekNumber}`} end done={geometry.summitReached} />
        </>
      ) : null}
    </div>
  );
}

export function LaneLegend({ week }: { week: WeekView }) {
  const lanes = (["do_now", "must_know", "medium", "low"] as const).filter((l) => week.items.some((i) => i.lane === l));
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption text-fg-2" aria-label="Lanes">
      {lanes.map((lane) => (
        <li key={lane} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2.5 shrink-0", lane === "must_know" ? "rounded-[2px]" : "rounded-full", LANE_CLASSES[lane].dot)} aria-hidden="true" />
          {LANE_META[lane].label} <span className="tabular-nums">{week.items.filter((i) => i.lane === lane).length}</span>
        </li>
      ))}
      <li className="inline-flex items-center gap-1.5">
        <span className="h-1 w-4 shrink-0 rounded-full bg-progress" aria-hidden="true" /> Walked
      </li>
    </ul>
  );
}

// ---------------------------------------------------------------------------
// The whole route
// ---------------------------------------------------------------------------

export function OverviewTrail({ path, week }: { path: LearningPathView; week: WeekView | null }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const all = useMemo(() => sortMilestones(path.items), [path.items]);
  /* v4.5: a long path (48 courses) draws its first weeks; the rest fold under "Later (N more)",
     grouped by goal. The weekly plan still pulls from the whole path in order. */
  const split = useMemo(() => splitPath(all, currentMilestone(all, week) + 3), [all, week]);
  const milestones = split.first;
  const geometry = useMemo(() => {
    if (width <= 0) return null;
    return computeTrail({
      width,
      compact: true,
      startLabelHeight: 36,
      endLabelHeight: 36,
      items: milestones.map((ms) => ({
        id: ms.id,
        tone: PART_TONE[(ms.partType ?? "general") as PartType],
        done: milestoneDone(ms),
        labelHeight: (w: number) => estimateLabelHeight({ title: ms.courseTitle, meta: `${ms.completedCount}/${ms.topicCount} lessons`, compact: true, extraLines: ms.reason ? Math.min(3, Math.ceil((ms.reason.length * 6.2) / Math.max(40, w))) : 0 }, w),
      })),
    });
  }, [milestones, width]);
  const current = currentMilestone(milestones, week);

  return (
    <>
    <div ref={ref} className="relative w-full" style={{ height: geometry?.height ?? 240 }}>
      {geometry ? (
        <>
          <TrailSvg geometry={geometry} testId="overview-trail-path" progressTestId="overview-trail-progress" compact />
          <Endpoint waypoint={geometry.waypoints[0]} title="Start" hint={`${milestones.length} milestones`} />
          <ol aria-label="Your whole route, milestone by milestone">
            {milestones.map((ms, i) => (
              <Milestone key={ms.id} item={ms} waypoint={geometry.waypoints[i + 1]} current={i === current} weekNumber={week?.weekNumber ?? null} />
            ))}
          </ol>
          <Endpoint
            waypoint={geometry.waypoints[geometry.waypoints.length - 1]}
            title={split.laterCount > 0 ? laterLabel(split.laterCount) : "Summit"}
            end={split.laterCount === 0}
            done={geometry.summitReached && split.laterCount === 0}
          />
        </>
      ) : null}
    </div>
    {split.laterCount > 0 ? <LaterSteps split={split} /> : null}
    </>
  );
}

/** v4.5: the rest of a long path, collapsed, one group per goal. */
function LaterSteps({ split }: { split: ReturnType<typeof splitPath> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-card border border-line-1 bg-surface-1" data-testid="path-later">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-small font-semibold text-fg-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      >
        <ChevronDown className={cn("size-4 transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden="true" />
        {laterLabel(split.laterCount)}
      </button>
      {open ? (
        <div className="divide-y divide-line-1 border-t border-line-1">
          {split.later.map((group) => (
            <section key={group.goal ?? "other"} className="px-4 py-3" aria-label={laterGroupLabel(group.goal)}>
              <h3 className="text-caption font-semibold text-fg-2">{laterGroupLabel(group.goal)}</h3>
              <ul className="mt-1 space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.id} className="text-small text-fg-1">
                    {item.courseTitle}
                    <span className="text-caption text-fg-2">{` · ${item.completedCount}/${item.topicCount} lessons`}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Milestone({ item, waypoint, current, weekNumber }: { item: PathItemView; waypoint: TrailWaypoint; current: boolean; weekNumber: number | null }) {
  const done = milestoneDone(item);
  const tone = PART_TONE[(item.partType ?? "general") as PartType];
  return (
    <li aria-current={current ? "step" : undefined}>
      <span
        aria-hidden="true"
        className={cn(
          "absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2",
          done ? "border-success bg-success text-on-success" : current ? "border-progress bg-surface-1" : "border-line-2 bg-surface-1",
        )}
        style={{ left: waypoint.point.x, top: waypoint.point.y }}
      >
        {done ? <Check className="size-3.5" strokeWidth={3} /> : <span className={cn("size-2.5 rounded-full", LANE_CLASSES[tone].dot)} />}
        {current && !done ? <HereDot /> : null}
      </span>
      <span className={cn("absolute -translate-y-1/2", waypoint.label.side === "left" ? "text-right" : "text-left")} style={{ left: waypoint.label.left, top: waypoint.point.y, width: waypoint.label.width }}>
        <span className="block font-display text-small font-semibold leading-snug text-fg-1">
          {item.courseTitle}
          {item.oyelabs ? <span className="ml-1.5 inline-block rounded-full border border-line-2 px-1.5 align-middle font-sans text-caption font-medium text-fg-2">{OYELABS_BADGE}</span> : null}
        </span>
        <span className="block text-caption text-fg-2">
          {item.completedCount}/{item.topicCount} lessons{done ? ", done" : ""}
          {current && weekNumber !== null ? <span className="font-semibold text-progress-fg">{` · Week ${weekNumber} is here`}</span> : null}
        </span>
        {needsLine(item) ? <span className="block text-caption text-fg-2">{needsLine(item)}</span> : null}
        {item.reason ? <span className="block text-caption text-fg-2">{item.reason}</span> : null}
      </span>
    </li>
  );
}
