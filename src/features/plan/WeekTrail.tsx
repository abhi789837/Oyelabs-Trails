import { useMemo, useState, type CSSProperties } from "react";
import { Check, Clock, Lock, Mountain, Signpost } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";

import { LANE_ORDER, type PlanLane, type WeekItemView, type WeekView } from "@shared/weeklyPlan";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useElementWidth } from "@/hooks/useElementWidth";
import { useIsNarrow } from "@/hooks/useMediaQuery";
import type { Point } from "@/lib/geometry";
import { cn, formatMinutes, formatMinutesCompact } from "@/lib/utils";
import { LANE_META, laneColor, summitColor } from "./laneMeta";
import { WeekItemDetail } from "./WeekItemDetail";

/**
 * The week as a trail.
 *
 * A sibling of `components/trail/TrailMap`, not a reuse of it, and deliberately so. That component
 * draws the *curriculum* — a module's topics in trail order, coloured by progress — and it is used on
 * two other pages that must not change. This one draws a **week**: the order is the lanes' order
 * rather than the curriculum's, the colour says which lane rather than which status, the markers open
 * a card rather than navigating, and there is a "you are here" marker walking along it. Sharing one
 * component would have meant a prop for each of those differences and a worse version of both maps.
 *
 * What it does share is the visual language, down to the switchback curve and the faint graticule, so
 * that a learner who has seen a module page recognises this immediately.
 *
 * Motion: the path draws itself once on mount (`pathLength`, ~1.2s), the markers pop in behind it on a
 * stagger, and the learner marker pulses. Everything animates transform, opacity or `pathLength`
 * only. Under `prefers-reduced-motion` the final state is rendered straight away.
 */

const NARROW = 640;

/** Vertical S-curve between two points, so the trail swings like a switchback. */
function segment(a: Point, b: Point): string {
  const dy = (b.y - a.y) * 0.55;
  return `C${a.x.toFixed(1)},${(a.y + dy).toFixed(1)} ${b.x.toFixed(1)},${(b.y - dy).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}

interface WeekTrailProps {
  week: WeekView;
  /** Called when the learner opens an item, so the page can scroll or track. */
  onOpen?: (item: WeekItemView) => void;
}

export function WeekTrail({ week, onOpen }: WeekTrailProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const narrow = width > 0 ? width < NARROW : false;

  /**
   * The order along the path: lane by lane, and within a lane the order the plan gave.
   *
   * Must know comes second, immediately after the red lane, because its items unblock the red ones —
   * so on the map they sit as small camps just past the first climb, which is where somebody would
   * want to find them.
   */
  const items = useMemo(
    () =>
      LANE_ORDER.flatMap((lane) =>
        week.items.filter((item) => item.lane === lane).sort((a, b) => a.position - b.position),
      ),
    [week.items],
  );

  const gap = narrow ? 116 : 118;
  const top = 40;
  const n = items.length;

  /* On a phone the path runs down the left edge and the labels sit to its right, so the swing has to
     be wide enough to read as a switchback and narrow enough to leave the titles room. 24 to 60 gives
     a 36px swing against an 82px label gutter — under that the trail looked like a straight line with
     dots on it, which is a list, not a map. */
  const narrowX = (i: number) => (i % 2 === 0 ? 24 : 60);

  // 0 is the trailhead, 1..n the waypoints, n+1 the summit.
  const points: Point[] = useMemo(() => {
    const value: Point[] = [{ x: narrow ? 30 : width / 2, y: top }];
    for (let i = 0; i < n; i++) {
      value.push({
        x: narrow ? narrowX(i) : width * (i % 2 === 0 ? 0.36 : 0.64),
        y: top + (i + 1) * gap,
      });
    }
    value.push({ x: narrow ? 34 : width / 2, y: top + (n + 1) * gap });
    return value;
  }, [n, narrow, width, gap]);

  const height = points[n + 1].y + 88;

  /** Which stretches of the path are behind them. A stretch fills when both its ends are done. */
  const reached = [true, ...items.map((item) => item.status === "done"), week.status === "completed"];

  /** The first unfinished waypoint — where the learner marker stands. */
  const hereIndex = items.findIndex((item) => item.status !== "done");

  const fullPath =
    points.length > 1
      ? `M${points[0].x},${points[0].y} ` + points.slice(1).map((p, i) => segment(points[i], p)).join(" ")
      : "";

  const walked = points
    .slice(1)
    .map((p, i) => (reached[i] && reached[i + 1] ? `M${points[i].x},${points[i].y} ${segment(points[i], p)}` : null))
    .filter((d): d is string => d !== null);

  const doneCount = items.filter((item) => item.status === "done").length;
  const maskId = `week-trail-${week.id}`;

  return (
    <div
      ref={ref}
      className="relative w-full"
      style={{
        height: width ? height : 320,
        // The same faint map graticule the module trail uses.
        backgroundImage:
          "linear-gradient(rgb(var(--foreground) / 0.035) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--foreground) / 0.035) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
      }}
    >
      {width > 0 && (
        <>
          <svg width={width} height={height} className="absolute inset-0" aria-hidden="true">
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
                {/* The page's one big motion moment: the route draws itself. */}
                <motion.path
                  d={fullPath}
                  fill="none"
                  stroke="white"
                  strokeWidth={30}
                  strokeLinecap="round"
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                />
              </mask>
            </defs>
            <g mask={`url(#${maskId})`}>
              {/* The unwalked route: a wide soft bed with a dashed centre line. */}
              <path d={fullPath} fill="none" stroke="rgb(var(--foreground) / 0.07)" strokeWidth={narrow ? 10 : 14} strokeLinecap="round" />
              <path
                d={fullPath}
                fill="none"
                stroke="rgb(var(--basalt) / 0.75)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray="0.5 8"
              />
              {/* Walked stretches fill solid, in the brand blue. */}
              {walked.map((d, i) => (
                <path key={i} d={d} fill="none" stroke="rgb(var(--primary))" strokeWidth={3.5} strokeLinecap="round" />
              ))}
            </g>
          </svg>

          <Trailhead point={points[0]} narrow={narrow} width={width} weekNumber={week.weekNumber} count={items.length} />

          <ol className="contents">
            {items.map((item, i) => (
              <Waypoint
                key={item.id}
                item={item}
                index={i}
                point={points[i + 1]}
                side={narrow ? "right" : i % 2 === 0 ? "left" : "right"}
                width={width}
                narrow={narrow}
                here={i === hereIndex}
                onOpen={onOpen}
              />
            ))}
          </ol>

          <Summit
            point={points[n + 1]}
            narrow={narrow}
            width={width}
            weekNumber={week.weekNumber}
            minutes={week.plannedMinutes}
            reached={doneCount === items.length && items.length > 0}
          />
        </>
      )}
    </div>
  );
}

function Trailhead({
  point,
  narrow,
  width,
  weekNumber,
  count,
}: {
  point: Point;
  narrow: boolean;
  width: number;
  weekNumber: number;
  count: number;
}) {
  const labelLeft = narrow ? 82 : point.x + 34;
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border-2 border-foreground/70 bg-background text-foreground"
        style={{ left: point.x, top: point.y }}
      >
        <Signpost className="h-4 w-4" />
      </span>
      <div aria-hidden="true" className="absolute -translate-y-1/2" style={{ left: labelLeft, top: point.y, width: width - labelLeft }}>
        <p className="font-display font-semibold">Week {weekNumber} trailhead</p>
        <p className="font-mono text-xs text-muted-foreground">
          {count} waypoint{count === 1 ? "" : "s"}
        </p>
      </div>
    </>
  );
}

function Summit({
  point,
  narrow,
  width,
  weekNumber,
  minutes,
  reached,
}: {
  point: Point;
  narrow: boolean;
  width: number;
  weekNumber: number;
  minutes: number;
  reached: boolean;
}) {
  const labelLeft = narrow ? 82 : point.x + 38;
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "absolute z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full",
          reached ? "bg-summit text-summit-foreground" : "border-2 border-dashed border-basalt bg-background text-muted-foreground",
        )}
        style={{ left: point.x, top: point.y }}
      >
        {reached ? <Mountain className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
      </span>
      <div aria-hidden="true" className="absolute -translate-y-1/2" style={{ left: labelLeft, top: point.y, width: width - labelLeft }}>
        <p className="font-display font-semibold" style={reached ? { color: summitColor() } : undefined}>
          Week {weekNumber} summit
        </p>
        <p className="font-mono text-xs text-muted-foreground">{formatMinutes(minutes)}</p>
      </div>
    </>
  );
}

/**
 * One waypoint: a marker on the path and a label beside it.
 *
 * The marker is the button. Clicking it opens the item's card — a popover on a desktop, a bottom sheet
 * on a phone — rather than navigating, because the reason an item is in the week is the thing worth
 * seeing before deciding to start it, and a trail map whose every dot is a link is a list with extra
 * steps. "Start" inside the card is the link.
 */
function Waypoint({
  item,
  index,
  point,
  side,
  width,
  narrow,
  here,
  onOpen,
}: {
  item: WeekItemView;
  index: number;
  point: Point;
  side: "left" | "right";
  width: number;
  narrow: boolean;
  here: boolean;
  onOpen?: (item: WeekItemView) => void;
}) {
  const [open, setOpen] = useState(false);
  const isNarrow = useIsNarrow();
  const reduceMotion = useReducedMotion();
  const meta = LANE_META[item.lane];

  /* Must-know items are small square "camps", everything else a round waypoint — the same shape
     language the module trail uses for a camp, and it reads at a glance as "a stop, not a climb". */
  const camp = item.lane === "must_know";
  const size = camp ? 28 : item.lane === "do_now" ? 38 : 32;

  const labelGap = narrow ? 82 : size / 2 + 20;
  const labelStyle: CSSProperties =
    side === "left"
      ? { right: width - point.x + labelGap, top: point.y, width: Math.max(80, point.x - labelGap - 4) }
      : { left: narrow ? labelGap : point.x + labelGap, top: point.y, width: Math.max(80, width - (narrow ? labelGap : point.x + labelGap) - 4) };

  const done = item.status === "done";

  const marker = (
    <motion.button
      type="button"
      aria-label={`${item.title} — ${meta.label}, ${formatMinutesCompact(item.minutes)}${done ? ", done" : ""}`}
      aria-expanded={open}
      onClick={() => {
        setOpen(true);
        onOpen?.(item);
      }}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: reduceMotion ? 0 : 0.35 + index * 0.05, type: "spring", stiffness: 420, damping: 26 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center font-mono text-[11px] font-semibold",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trailmark",
        camp ? "rounded-md" : "rounded-full",
        done ? "bg-summit text-summit-foreground" : meta.solid,
        // The red lane gets a ring so it reads as the start of the climb even before the colour does.
        item.lane === "do_now" && !done && "ring-2 ring-offset-2 ring-offset-background",
        item.lane === "do_now" && !done && meta.ring,
      )}
      style={{ left: point.x, top: point.y, width: size, height: size }}
    >
      {here && !done && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 -z-10 animate-waypoint-pulse",
            camp ? "rounded-md" : "rounded-full",
            meta.dot,
          )}
        />
      )}
      {done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : <span aria-hidden="true">{index + 1}</span>}
    </motion.button>
  );

  const label = (
    <motion.div
      aria-hidden="true"
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : 0.4 + index * 0.05, duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn("absolute -translate-y-1/2", side === "left" ? "text-right" : "text-left")}
      style={labelStyle}
    >
      <p className={cn("font-display text-sm font-semibold leading-snug sm:text-base", done && "text-muted-foreground line-through decoration-summit/60")}>
        {item.title}
      </p>
      <div className={cn("mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-mono text-[11px] text-muted-foreground", side === "left" && "justify-end")}>
        <span className={cn("inline-flex items-center gap-1.5", meta.text)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
          {meta.label}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatMinutesCompact(item.minutes)}
        </span>
      </div>
      {here && !done && <p className="mt-1 font-mono text-[11px] font-medium text-trailmark-strong">You are here</p>}
    </motion.div>
  );

  // A bottom sheet on a phone, a popover on a desktop. Two components rather than one restyled: see
  // `useMediaQuery` for why both are not mounted at once.
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
        <PopoverContent side={side === "left" ? "right" : "left"} align="center" className="w-80 p-4">
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
