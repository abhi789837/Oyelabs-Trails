import { useMemo, useState } from "react";
import { Check, Clock, Lock, Mountain, Signpost } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";

import { LANE_ORDER, fromIsoDate, type PlanLane, type WeekItemView, type WeekView } from "@shared/weeklyPlan";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useElementWidth } from "@/hooks/useElementWidth";
import { useIsNarrow } from "@/hooks/useMediaQuery";
import { cn, formatMinutes, formatMinutesCompact } from "@/lib/utils";
import { LANE_META, laneColor, summitColor } from "./laneMeta";
import { computeTrail, estimateLabelHeight, type TrailGeometry, type TrailWaypoint } from "./trailGeometry";
import { WeekItemDetail } from "./WeekItemDetail";

/**
 * The week as a trail.
 *
 * A sibling of `components/trail/TrailMap`, not a reuse of it: that one draws a module's topics in
 * curriculum order and navigates; this one draws a **week** in plan order (Do it now → Must know →
 * Medium → Low), colours by lane, and opens a card per waypoint.
 *
 * All of the geometry lives in `trailGeometry.ts` and is unit-tested there. This component only
 * measures its width (ResizeObserver, via `useElementWidth`) and draws what comes back:
 *
 * 1. a soft bed under the whole route,
 * 2. thin lane-coloured bands, one per stretch, so a lane boundary is visible on the line itself,
 * 3. **the trail**: one `<path>` with one `M` (`data-testid="week-trail-path"`), dashed,
 * 4. the walked part in solid brand blue, from the trailhead to the furthest completed item.
 *
 * Motion: the walked part draws itself once (`pathLength`), and the "you are here" marker pulses.
 * Under `prefers-reduced-motion` both are off and the final state renders straight away.
 *
 * `compact` is the read-only version used for past weeks: smaller, no popovers, the markers are not
 * buttons, and a visually hidden list carries the content for assistive technology.
 */

export interface NextWeekLink {
  label: string;
  /** An in-page anchor (`#week-heading`) or a route. */
  href?: string;
  onClick?: () => void;
}

interface WeekTrailProps {
  week: WeekView;
  /** Called when the learner opens an item, so the page can scroll or track. */
  onOpen?: (item: WeekItemView) => void;
  /** Read-only and smaller, for past weeks. */
  compact?: boolean;
  /** Shown under the summit when the following week exists. Otherwise "Week N+1 starts …". */
  next?: NextWeekLink | null;
}

/** The order along the path: lane by lane, and within a lane the order the plan gave. */
export function planOrder(items: readonly WeekItemView[]): WeekItemView[] {
  return LANE_ORDER.flatMap((lane) => items.filter((item) => item.lane === lane).sort((a, b) => a.position - b.position));
}

const DAY_MS = 86_400_000;

function nextWeekStarts(endDate: string): string {
  return new Date(fromIsoDate(endDate) + DAY_MS).toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "UTC" });
}

function toneColor(tone: string, alpha = 1): string {
  if (tone === "summit") return summitColor(alpha);
  return laneColor(tone as PlanLane, alpha);
}

export function WeekTrail({ week, onOpen, compact = false, next }: WeekTrailProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const reduceMotion = useReducedMotion();

  const items = useMemo(() => planOrder(week.items), [week.items]);

  const geometry: TrailGeometry | null = useMemo(() => {
    if (width <= 0) return null;
    const firstOpen = items.findIndex((item) => item.status !== "done");
    return computeTrail({
      width,
      compact,
      startLabelHeight: compact ? 36 : 44,
      endLabelHeight: compact ? 40 : 64,
      items: items.map((item, i) => ({
        id: item.id,
        tone: item.lane,
        done: item.status === "done",
        labelHeight: (labelWidth: number) =>
          estimateLabelHeight(
            {
              title: item.title,
              meta: `${LANE_META[item.lane].label}   ${formatMinutesCompact(item.minutes)}`,
              extraLines: !compact && i === firstOpen ? 1 : 0,
              compact,
            },
            labelWidth,
          ),
      })),
    });
  }, [items, width, compact]);

  const ids = `week-trail-${week.id}${compact ? "-c" : ""}`;
  const walkedTitle = `${items.filter((item) => item.status === "done").length} of ${items.length} done`;

  return (
    <div
      ref={ref}
      className="relative w-full"
      style={{
        height: geometry ? geometry.height : compact ? 200 : 320,
        // The same faint map graticule the module trail uses.
        backgroundImage:
          "linear-gradient(rgb(var(--foreground) / 0.035) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--foreground) / 0.035) 1px, transparent 1px)",
        backgroundSize: compact ? "40px 40px" : "56px 56px",
      }}
    >
      {geometry && (
        <>
          <svg width={geometry.width} height={geometry.height} className="absolute inset-0" aria-hidden="true">
            {/* 1. The bed. */}
            <path d={geometry.d} fill="none" stroke="rgb(var(--foreground) / 0.06)" strokeWidth={compact ? 9 : 14} strokeLinecap="round" />
            {/* 2. Lane bands, one per stretch, leading into the waypoint whose lane they carry. */}
            {geometry.segments.map((segment) => (
              <path
                key={segment.index}
                d={segment.d}
                fill="none"
                stroke={toneColor(segment.tone, 0.3)}
                strokeWidth={compact ? 5 : 8}
                strokeLinecap="butt"
              />
            ))}
            {/* 3. The trail: one continuous path, dashed where it is still ahead. */}
            <path
              data-testid="week-trail-path"
              d={geometry.d}
              fill="none"
              stroke="rgb(var(--basalt) / 0.85)"
              strokeWidth={compact ? 1.75 : 2.25}
              strokeLinecap="round"
              strokeDasharray={compact ? "4 5" : "6 7"}
            />
            {/* 4. Walked: solid brand blue to the furthest completed item. */}
            {geometry.progressD && (
              <motion.path
                data-testid="week-trail-progress"
                d={geometry.progressD}
                fill="none"
                stroke="rgb(var(--primary))"
                strokeWidth={compact ? 3 : 4}
                strokeLinecap="round"
                initial={reduceMotion || compact ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
              />
            )}
          </svg>

          <Trailhead waypoint={geometry.waypoints[0]} weekNumber={week.weekNumber} count={items.length} compact={compact} />

          {compact ? (
            <>
              <ol className="sr-only" aria-label={`Week ${week.weekNumber}: ${walkedTitle}`}>
                {items.map((item) => (
                  <li key={item.id}>
                    {item.title}, {LANE_META[item.lane].label}, {item.status === "done" ? "done" : item.status === "skipped" ? "skipped" : "not done"}
                  </li>
                ))}
              </ol>
              {items.map((item, i) => (
                <CompactWaypoint key={item.id} item={item} index={i} waypoint={geometry.waypoints[i + 1]} />
              ))}
            </>
          ) : (
            <ol aria-label={`Week ${week.weekNumber} trail, ${walkedTitle}`} id={ids} className="contents">
              {items.map((item, i) => (
                <Waypoint
                  key={item.id}
                  item={item}
                  index={i}
                  waypoint={geometry.waypoints[i + 1]}
                  here={i === geometry.hereIndex}
                  onOpen={onOpen}
                />
              ))}
            </ol>
          )}

          <Summit
            waypoint={geometry.waypoints[geometry.waypoints.length - 1]}
            weekNumber={week.weekNumber}
            minutes={week.plannedMinutes}
            reached={geometry.summitReached}
            compact={compact}
            next={next}
            nextStarts={nextWeekStarts(week.endDate)}
          />
        </>
      )}
    </div>
  );
}

function labelStyle(waypoint: TrailWaypoint) {
  return { left: waypoint.label.left, top: waypoint.point.y, width: waypoint.label.width };
}

function Trailhead({ waypoint, weekNumber, count, compact }: { waypoint: TrailWaypoint; weekNumber: number; count: number; compact: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border-2 border-foreground/70 bg-background text-foreground",
          compact ? "h-7 w-7" : "h-9 w-9",
        )}
        style={{ left: waypoint.point.x, top: waypoint.point.y }}
      >
        <Signpost className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </span>
      <div aria-hidden="true" className="absolute -translate-y-1/2" style={labelStyle(waypoint)}>
        <p className={cn("font-display font-semibold", compact && "text-sm")}>Week {weekNumber} start</p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {count} waypoint{count === 1 ? "" : "s"}
        </p>
      </div>
    </>
  );
}

function Summit({
  waypoint,
  weekNumber,
  minutes,
  reached,
  compact,
  next,
  nextStarts,
}: {
  waypoint: TrailWaypoint;
  weekNumber: number;
  minutes: number;
  reached: boolean;
  compact: boolean;
  next?: NextWeekLink | null;
  nextStarts: string;
}) {
  const linkClass =
    "inline-flex items-center rounded-sm font-mono text-[11px] font-medium text-primary-strong underline decoration-dotted underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trailmark";

  return (
    <>
      <span
        aria-hidden="true"
        data-summit-reached={reached ? "true" : "false"}
        className={cn(
          "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full",
          compact ? "h-9 w-9" : "h-12 w-12",
          reached ? "bg-summit text-summit-foreground" : "border-2 border-dashed border-basalt bg-background text-muted-foreground",
        )}
        style={{ left: waypoint.point.x, top: waypoint.point.y }}
      >
        {reached ? <Mountain className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
      </span>
      <div className="absolute -translate-y-1/2" style={labelStyle(waypoint)}>
        <p
          aria-hidden="true"
          className={cn("font-display font-semibold", compact && "text-sm")}
          style={reached ? { color: summitColor() } : undefined}
        >
          Week {weekNumber} summit{reached ? " reached" : ""}
        </p>
        {!compact && <p aria-hidden="true" className="font-mono text-[11px] text-muted-foreground">{formatMinutes(minutes)}</p>}
        {next ? (
          next.href ? (
            next.href.startsWith("#") ? (
              <a href={next.href} className={linkClass}>
                {next.label}
              </a>
            ) : (
              <Link to={next.href} className={linkClass}>
                {next.label}
              </Link>
            )
          ) : (
            <button type="button" onClick={next.onClick} className={linkClass}>
              {next.label}
            </button>
          )
        ) : (
          !compact && <p className="font-mono text-[11px] text-muted-foreground">Week {weekNumber + 1} starts {nextStarts}</p>
        )}
      </div>
    </>
  );
}

/** The label beside a marker. The same for both sizes; hidden from assistive technology. */
function WaypointLabel({ item, waypoint, here, compact }: { item: WeekItemView; waypoint: TrailWaypoint; here: boolean; compact: boolean }) {
  const meta = LANE_META[item.lane];
  const done = item.status === "done";
  const left = waypoint.label.side === "left";
  return (
    <div aria-hidden="true" className={cn("absolute -translate-y-1/2", left ? "text-right" : "text-left")} style={labelStyle(waypoint)}>
      <p
        className={cn(
          "font-display font-semibold leading-snug",
          compact ? "text-[13px]" : "text-base",
          done && "text-muted-foreground line-through decoration-summit/60",
        )}
      >
        {item.title}
      </p>
      <div className={cn("mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-mono text-[11px] text-muted-foreground", left && "justify-end")}>
        <span className={cn("inline-flex items-center gap-1.5", meta.text)}>
          <span className={cn("h-1.5 w-1.5", item.lane === "must_know" ? "rounded-[1px]" : "rounded-full", meta.dot)} />
          {meta.label}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatMinutesCompact(item.minutes)}
        </span>
      </div>
      {here && !done && <p className="mt-0.5 font-mono text-[11px] font-medium text-trailmark-strong">You are here</p>}
    </div>
  );
}

function markerSize(lane: PlanLane, compact: boolean): number {
  const base = lane === "must_know" ? 28 : lane === "do_now" ? 38 : 32;
  return compact ? Math.round(base * 0.7) : base;
}

function CompactWaypoint({ item, index, waypoint }: { item: WeekItemView; index: number; waypoint: TrailWaypoint }) {
  const meta = LANE_META[item.lane];
  const done = item.status === "done";
  const size = markerSize(item.lane, true);
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center font-mono text-[10px] font-semibold",
          item.lane === "must_know" ? "rounded-[4px]" : "rounded-full",
          done ? "bg-summit text-summit-foreground" : meta.solid,
          done && "ring-2 ring-offset-1 ring-offset-background",
          done && meta.ring,
        )}
        style={{ left: waypoint.point.x, top: waypoint.point.y, width: size, height: size }}
      >
        {done ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
      </span>
      <WaypointLabel item={item} waypoint={waypoint} here={false} compact />
    </>
  );
}

/**
 * One waypoint: a marker on the path and a label beside it.
 *
 * The marker is the button. Clicking it opens the item's card — a popover on a desktop, a bottom sheet
 * on a phone — rather than navigating, because the reason an item is in the week is the thing worth
 * seeing before deciding to start it. "Start" inside the card is the link.
 */
function Waypoint({
  item,
  index,
  waypoint,
  here,
  onOpen,
}: {
  item: WeekItemView;
  index: number;
  waypoint: TrailWaypoint;
  here: boolean;
  onOpen?: (item: WeekItemView) => void;
}) {
  const [open, setOpen] = useState(false);
  const isNarrow = useIsNarrow();
  const reduceMotion = useReducedMotion();
  const meta = LANE_META[item.lane];

  /* Must-know items are small square "camps", everything else a round waypoint — the same shape
     language the module trail uses for a camp. Done items keep a ring in their lane colour so the
     lane still shows once the marker turns green. */
  const camp = item.lane === "must_know";
  const size = markerSize(item.lane, false);
  const done = item.status === "done";

  const marker = (
    <motion.button
      type="button"
      data-testid="week-trail-waypoint"
      aria-label={`${index + 1}. ${item.title} — ${meta.label}, ${formatMinutesCompact(item.minutes)}${done ? ", done" : here ? ", you are here" : ""}`}
      aria-expanded={open}
      onClick={() => {
        setOpen(true);
        onOpen?.(item);
      }}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: reduceMotion ? 0 : 0.3 + index * 0.04, type: "spring", stiffness: 420, damping: 26 }}
      whileHover={reduceMotion ? undefined : { scale: 1.08 }}
      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
      className={cn(
        "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center font-mono text-[11px] font-semibold",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-trailmark",
        camp ? "rounded-md" : "rounded-full",
        done ? "bg-summit text-summit-foreground" : meta.solid,
        "ring-2 ring-offset-2 ring-offset-background",
        meta.ring,
      )}
      style={{ left: waypoint.point.x, top: waypoint.point.y, width: size, height: size }}
    >
      {here && !done && !reduceMotion && (
        <span aria-hidden="true" className={cn("absolute inset-0 -z-10 animate-waypoint-pulse", camp ? "rounded-md" : "rounded-full", meta.dot)} />
      )}
      {done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : <span aria-hidden="true">{index + 1}</span>}
    </motion.button>
  );

  const label = <WaypointLabel item={item} waypoint={waypoint} here={here} compact={false} />;

  // A bottom sheet on a phone, a popover on a desktop. See `useMediaQuery` for why both are not mounted at once.
  if (isNarrow) {
    return (
      <li>
        {marker}
        {label}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" closeLabel={`Close ${item.title}`} className="p-5">
            <SheetTitle className="pr-8">{item.title}</SheetTitle>
            <WeekItemDetail item={item} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </li>
    );
  }

  return (
    <li>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{marker}</PopoverTrigger>
        <PopoverContent side={waypoint.label.side === "left" ? "right" : "left"} align="center" className="w-80 p-4">
          <p className="font-display font-semibold leading-snug">{item.title}</p>
          <WeekItemDetail item={item} onNavigate={() => setOpen(false)} />
        </PopoverContent>
      </Popover>
      {label}
    </li>
  );
}

/** The legend. Four dots and four words — enough to read the colours without a key per marker. */
export function LaneLegend({ week }: { week: WeekView }) {
  const present = LANE_ORDER.filter((lane) => week.items.some((item) => item.lane === lane));
  if (present.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {present.map((lane: PlanLane) => {
        const meta = LANE_META[lane];
        const count = week.items.filter((item) => item.lane === lane).length;
        return (
          <li key={lane} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <span className={cn("h-2 w-2 shrink-0", lane === "must_know" ? "rounded-[2px]" : "rounded-full", meta.dot)} aria-hidden="true" />
            {meta.label}
            <span className="tabular">{count}</span>
          </li>
        );
      })}
      <li className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
        <span className="h-1 w-4 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        Walked
      </li>
    </ul>
  );
}

/** Kept out of the trail so the map has no `Start` buttons competing with its markers. */
export function TrailStartButton({ item }: { item: WeekItemView }) {
  return (
    <Button asChild size="sm" variant="outline">
      <Link to={item.href}>{item.status === "done" ? "Revisit" : "Start"}</Link>
    </Button>
  );
}

export { laneColor };
