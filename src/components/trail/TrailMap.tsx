import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock, Mountain, Signpost } from "lucide-react";
import { Link } from "react-router-dom";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useElementWidth } from "@/hooks/useElementWidth";
import { accentClasses, accentColor } from "@/lib/accent";
import type { Point } from "@/lib/geometry";
import { cn } from "@/lib/utils";
import type { AccentToken } from "@/types/curriculum";

export type WaypointStatus = "not-started" | "in-progress" | "completed" | "locked";

export interface TrailWaypoint {
  id: string;
  href?: string;
  title: string;
  ariaLabel: string;
  status: WaypointStatus;
  /** Topics are round waypoints; modules are square "camps". */
  shape: "waypoint" | "camp";
  large?: boolean;
  /** Shown inside the marker when not completed, e.g. the sequence number. */
  label: ReactNode;
  meta: ReactNode[];
  /** Optional extra content under the meta line (e.g. a module's progress bar). */
  extra?: ReactNode;
  tooltip: ReactNode;
}

export interface TrailEndpoint {
  title: string;
  detail: string;
  href: string;
  /** The summit is unlocked (track or module finished). */
  complete?: boolean;
}

interface TrailMapProps {
  accent: AccentToken;
  waypoints: TrailWaypoint[];
  start: TrailEndpoint;
  end: TrailEndpoint;
  /** Distinguishes the SVG mask id when several maps are on screen. */
  mapId: string;
}

const NARROW = 640;

/** Vertical S-curve between two points, so the trail swings like a switchback. */
function segment(a: Point, b: Point): string {
  const dy = (b.y - a.y) * 0.55;
  return `C${a.x.toFixed(1)},${(a.y + dy).toFixed(1)} ${b.x.toFixed(1)},${(b.y - dy).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}

export function TrailMap({ accent, waypoints, start, end, mapId }: TrailMapProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const narrow = width < NARROW;
  const n = waypoints.length;
  const hasExtras = waypoints.some((w) => w.extra);
  const gap = narrow ? (hasExtras ? 142 : 118) : hasExtras ? 168 : 150;
  const top = 44;

  // Point 0 is the trailhead, 1..n the waypoints, n+1 the summit.
  const points: Point[] = [
    { x: narrow ? 28 : width / 2, y: top },
    ...waypoints.map((_, i) => ({
      x: narrow ? (i % 2 === 0 ? 22 : 36) : width * (i % 2 === 0 ? 0.38 : 0.62),
      y: top + (i + 1) * gap,
    })),
    { x: narrow ? 29 : width / 2, y: top + (n + 1) * gap },
  ];
  const height = points[n + 1].y + 96;

  const reached = [true, ...waypoints.map((w) => w.status === "completed"), Boolean(end.complete)];
  const fullPath = `M${points[0].x},${points[0].y} ` + points.slice(1).map((p, i) => segment(points[i], p)).join(" ");
  const hikedSegments = points
    .slice(1)
    .map((p, i) => (reached[i] && reached[i + 1] ? `M${points[i].x},${points[i].y} ${segment(points[i], p)}` : null))
    .filter((d): d is string => d !== null);
  const maskId = `trail-draw-${mapId}`;

  return (
    <div
      ref={ref}
      className="relative w-full"
      style={{
        height: width ? height : undefined,
        // A faint map graticule behind the trail.
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
                {/* The one motion moment on the page: the trail draws itself in. */}
                <motion.path
                  d={fullPath}
                  fill="none"
                  stroke="white"
                  strokeWidth={28}
                  strokeLinecap="round"
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                />
              </mask>
            </defs>
            <g mask={`url(#${maskId})`}>
              <path d={fullPath} fill="none" stroke={accentColor(accent, 0.13)} strokeWidth={narrow ? 10 : 14} strokeLinecap="round" />
              <path d={fullPath} fill="none" stroke={accentColor("basalt", 0.9)} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="0.5 8" />
              {hikedSegments.map((d, i) => (
                <path key={i} d={d} fill="none" stroke={accentColor(accent)} strokeWidth={3} strokeLinecap="round" />
              ))}
            </g>
          </svg>

          <Endpoint kind="trailhead" endpoint={start} point={points[0]} narrow={narrow} width={width} accent={accent} />
          <ol className="contents">
            {waypoints.map((w, i) => (
              <Waypoint
                key={w.id}
                waypoint={w}
                point={points[i + 1]}
                side={narrow ? "right" : i % 2 === 0 ? "left" : "right"}
                width={width}
                narrow={narrow}
              />
            ))}
          </ol>
          <Endpoint kind="summit" endpoint={end} point={points[n + 1]} narrow={narrow} width={width} accent={accent} />
        </>
      )}
    </div>
  );
}

function Waypoint({
  waypoint: w,
  point,
  side,
  width,
  narrow,
}: {
  waypoint: TrailWaypoint;
  point: Point;
  side: "left" | "right";
  width: number;
  narrow: boolean;
}) {
  const size = w.shape === "camp" ? (w.large ? 46 : 40) : w.large ? 42 : 30;
  const labelGap = narrow ? 64 : size / 2 + 20;
  const labelStyle: CSSProperties =
    side === "left"
      ? { right: width - point.x + labelGap, top: point.y, width: point.x - labelGap - 4 }
      : narrow
        ? { left: labelGap, top: point.y, width: width - labelGap }
        : { left: point.x + labelGap, top: point.y, width: width - point.x - labelGap - 4 };

  const markerClass = cn(
    "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center font-mono text-xs font-medium transition-[box-shadow,background-color]",
    w.shape === "camp" ? "rounded-md" : "rounded-full",
    w.status === "not-started" && "border-2 border-basalt bg-background text-muted-foreground",
    w.status === "in-progress" && "bg-trailmark text-trailmark-foreground",
    w.status === "completed" && "bg-summit text-summit-foreground",
    w.status === "locked" && "border-2 border-dashed border-basalt/70 bg-background text-muted-foreground",
    w.large && "ring-2 ring-foreground/15 ring-offset-2 ring-offset-background",
    w.href && "hover:ring-4 hover:ring-foreground/10",
  );
  const markerInner = (
    <>
      {w.status === "in-progress" && (
        <span
          aria-hidden="true"
          className={cn("absolute inset-0 -z-10 animate-waypoint-pulse bg-trailmark", w.shape === "camp" ? "rounded-md" : "rounded-full")}
        />
      )}
      {w.status === "completed" ? (
        <Check className={w.large ? "h-5 w-5" : "h-4 w-4"} strokeWidth={3} aria-hidden="true" />
      ) : w.status === "locked" ? (
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <span aria-hidden="true">{w.label}</span>
      )}
    </>
  );
  const markerStyle = { left: point.x, top: point.y, width: size, height: size };

  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          {w.href ? (
            <Link to={w.href} aria-label={w.ariaLabel} className={markerClass} style={markerStyle}>
              {markerInner}
            </Link>
          ) : (
            <span role="img" tabIndex={0} aria-label={w.ariaLabel} className={markerClass} style={markerStyle}>
              {markerInner}
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent side={side === "left" && !narrow ? "right" : "top"}>{w.tooltip}</TooltipContent>
      </Tooltip>

      {/* Visual label; the marker above carries the accessible name. */}
      <div aria-hidden="true" className={cn("absolute -translate-y-1/2", side === "left" ? "text-right" : "text-left")} style={labelStyle}>
        {w.href ? (
          <Link to={w.href} tabIndex={-1} className="font-display text-base font-semibold leading-snug hover:underline sm:text-lg">
            {w.title}
          </Link>
        ) : (
          <span className="font-display text-base font-semibold leading-snug text-muted-foreground sm:text-lg">{w.title}</span>
        )}
        <div className={cn("mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-xs text-muted-foreground", side === "left" && "justify-end")}>
          {w.meta.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
        {w.extra && <div className={cn("mt-2", side === "left" && "flex justify-end")}>{w.extra}</div>}
      </div>
    </li>
  );
}

function Endpoint({
  kind,
  endpoint,
  point,
  narrow,
  width,
  accent,
}: {
  kind: "trailhead" | "summit";
  endpoint: TrailEndpoint;
  point: Point;
  narrow: boolean;
  width: number;
  accent: AccentToken;
}) {
  const size = kind === "summit" ? 48 : 36;
  const Icon = kind === "trailhead" ? Signpost : endpoint.complete ? Mountain : Lock;
  const labelLeft = narrow ? 64 : point.x + size / 2 + 16;

  return (
    <>
      <Link
        to={endpoint.href}
        aria-label={`${endpoint.title}: ${endpoint.detail}`}
        className={cn(
          "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center",
          kind === "trailhead" && "rounded-md border-2 border-foreground/70 bg-background text-foreground",
          kind === "summit" && "rounded-full",
          kind === "summit" &&
            (endpoint.complete ? accentClasses[accent].solid : "border-2 border-dashed border-basalt bg-background text-muted-foreground"),
        )}
        style={{ left: point.x, top: point.y, width: size, height: size }}
      >
        <Icon className={kind === "summit" ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" />
      </Link>
      <div aria-hidden="true" className="absolute -translate-y-1/2" style={{ left: labelLeft, top: point.y, width: width - labelLeft }}>
        <p className="font-display font-semibold">{endpoint.title}</p>
        <p className="font-mono text-xs text-muted-foreground">{endpoint.detail}</p>
      </div>
    </>
  );
}

