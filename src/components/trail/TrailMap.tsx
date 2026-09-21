import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock, Mountain, Signpost } from "lucide-react";
import { Link } from "react-router-dom";

import { statusLabels } from "@/components/trail/StatusDot";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useElementWidth } from "@/hooks/useElementWidth";
import { accentClasses, accentColor } from "@/lib/accent";
import type { Point } from "@/lib/geometry";
import { levelLabels } from "@/lib/track-meta";
import { cn, formatMinutes, formatMinutesCompact } from "@/lib/utils";
import type { TopicProgress, TopicStatus } from "@/store/progressStore";
import type { Topic, Track } from "@/types/curriculum-v1";

interface TrailMapProps {
  track: Track;
  progress: Record<string, TopicProgress>;
  totalMinutes: number;
  isComplete: boolean;
}

const NARROW = 640;

/** Vertical S-curve between two points, so the trail swings like a switchback. */
function segment(a: Point, b: Point): string {
  const dy = (b.y - a.y) * 0.55;
  return `C${a.x.toFixed(1)},${(a.y + dy).toFixed(1)} ${b.x.toFixed(1)},${(b.y - dy).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}

export function TrailMap({ track, progress, totalMinutes, isComplete }: TrailMapProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const narrow = width < NARROW;
  const n = track.topics.length;
  const gap = narrow ? 118 : 150;
  const top = 44;

  // Point 0 is the trailhead, 1..n the topics, n+1 the summit.
  const points: Point[] = [
    { x: narrow ? 28 : width / 2, y: top },
    ...track.topics.map((_, i) => ({
      x: narrow ? (i % 2 === 0 ? 22 : 36) : width * (i % 2 === 0 ? 0.38 : 0.62),
      y: top + (i + 1) * gap,
    })),
    { x: narrow ? 29 : width / 2, y: top + (n + 1) * gap },
  ];
  const height = points[n + 1].y + 96;

  const statuses: TopicStatus[] = track.topics.map((t) => progress[t.id]?.status ?? "not-started");
  const reached = [true, ...statuses.map((s) => s === "completed"), isComplete];

  const fullPath = `M${points[0].x},${points[0].y} ` + points.slice(1).map((p, i) => segment(points[i], p)).join(" ");
  const hikedSegments = points
    .slice(1)
    .map((p, i) => (reached[i] && reached[i + 1] ? `M${points[i].x},${points[i].y} ${segment(points[i], p)}` : null))
    .filter((d): d is string => d !== null);

  const accent = track.accentToken;
  const maskId = `trail-draw-${track.id}`;
  const animateDraw = !reduceMotion;

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
                {/* The one motion moment on this page: the trail draws itself in. */}
                <motion.path
                  d={fullPath}
                  fill="none"
                  stroke="white"
                  strokeWidth={28}
                  strokeLinecap="round"
                  initial={animateDraw ? { pathLength: 0 } : false}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                />
              </mask>
            </defs>
            <g mask={`url(#${maskId})`}>
              {/* Worn corridor, dotted unexplored trail, then solid where you've hiked. */}
              <path d={fullPath} fill="none" stroke={accentColor(accent, 0.13)} strokeWidth={narrow ? 10 : 14} strokeLinecap="round" />
              <path
                d={fullPath}
                fill="none"
                stroke={accentColor("basalt", 0.9)}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray="0.5 8"
              />
              {hikedSegments.map((d, i) => (
                <path key={i} d={d} fill="none" stroke={accentColor(accent)} strokeWidth={3} strokeLinecap="round" />
              ))}
            </g>
          </svg>

          <TrailEndpoint
            kind="trailhead"
            point={points[0]}
            narrow={narrow}
            width={width}
            title="Trailhead"
            detail={`${n} topics, ${formatMinutes(totalMinutes)}`}
            to={`/track/${track.id}/topic/${track.topics[0].id}`}
          />

          <ol className="contents">
            {track.topics.map((topic, i) => (
              <Waypoint
                key={topic.id}
                topic={topic}
                index={i}
                point={points[i + 1]}
                side={narrow ? "right" : i % 2 === 0 ? "left" : "right"}
                width={width}
                narrow={narrow}
                status={statuses[i]}
                score={progress[topic.id]?.bestScore}
              />
            ))}
          </ol>

          <TrailEndpoint
            kind="summit"
            point={points[n + 1]}
            narrow={narrow}
            width={width}
            title={isComplete ? "Summit reached" : "Summit"}
            detail={isComplete ? "Your certificate is ready" : `Certificate unlocks after all ${n} topics`}
            to={`/report/${track.id}`}
            complete={isComplete}
            accentBg={accentClasses[accent].solid}
          />
        </>
      )}
    </div>
  );
}

interface WaypointProps {
  topic: Topic;
  index: number;
  point: Point;
  side: "left" | "right";
  width: number;
  narrow: boolean;
  status: TopicStatus;
  score?: number;
}

function Waypoint({ topic, index, point, side, width, narrow, status, score }: WaypointProps) {
  const size = topic.isMilestone ? 42 : 30;
  const href = `/track/${topic.trackId}/topic/${topic.id}`;
  const labelGap = narrow ? 64 : size / 2 + 20;
  const labelStyle: React.CSSProperties =
    side === "left"
      ? { right: width - point.x + labelGap, top: point.y, width: point.x - labelGap - 4 }
      : narrow
        ? { left: labelGap, top: point.y, width: width - labelGap }
        : { left: point.x + labelGap, top: point.y, width: width - point.x - labelGap - 4 };
  const ariaLabel = `${index + 1}. ${topic.title}, ${statusLabels[status].toLowerCase()}${
    topic.isMilestone ? ", milestone" : ""
  }`;

  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={href}
            aria-label={ariaLabel}
            className={cn(
              "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-mono text-xs font-medium transition-[box-shadow,background-color] hover:ring-4 hover:ring-foreground/10",
              status === "not-started" && "border-2 border-basalt bg-background text-muted-foreground",
              status === "in-progress" && "bg-trailmark text-trailmark-foreground",
              status === "completed" && "bg-summit text-summit-foreground",
              topic.isMilestone && "ring-2 ring-foreground/15 ring-offset-2 ring-offset-background",
            )}
            style={{ left: point.x, top: point.y, width: size, height: size }}
          >
            {status === "in-progress" && (
              <span aria-hidden="true" className="absolute inset-0 -z-10 animate-waypoint-pulse rounded-full bg-trailmark" />
            )}
            {status === "completed" ? (
              <Check className={topic.isMilestone ? "h-5 w-5" : "h-4 w-4"} strokeWidth={3} aria-hidden="true" />
            ) : (
              <span aria-hidden="true">{index + 1}</span>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side={side === "left" && !narrow ? "right" : "top"}>
          <span className="block font-medium">{topic.title}</span>
          <span className="mt-0.5 block opacity-80">
            {levelLabels[topic.level]}, {formatMinutes(topic.estMinutes)}
          </span>
        </TooltipContent>
      </Tooltip>

      {/* Visual label; the marker link above carries the accessible name. */}
      <div
        aria-hidden="true"
        className={cn("absolute -translate-y-1/2", side === "left" ? "text-right" : "text-left")}
        style={labelStyle}
      >
        <Link to={href} tabIndex={-1} className="font-display text-base font-semibold leading-snug hover:underline sm:text-lg">
          {topic.title}
        </Link>
        <div
          className={cn(
            "mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-xs text-muted-foreground",
            side === "left" && "justify-end",
          )}
        >
          <span>{levelLabels[topic.level]}</span>
          <span>{formatMinutesCompact(topic.estMinutes)}</span>
          {topic.isMilestone && <span className="text-foreground">Milestone</span>}
          {status === "completed" && score !== undefined && <span className="text-summit-strong">Best {score}%</span>}
        </div>
      </div>
    </li>
  );
}

interface TrailEndpointProps {
  kind: "trailhead" | "summit";
  point: Point;
  narrow: boolean;
  width: number;
  title: string;
  detail: string;
  to: string;
  complete?: boolean;
  accentBg?: string;
}

function TrailEndpoint({ kind, point, narrow, width, title, detail, to, complete, accentBg }: TrailEndpointProps) {
  const size = kind === "summit" ? 48 : 36;
  const Icon = kind === "trailhead" ? Signpost : complete ? Mountain : Lock;
  const labelLeft = narrow ? 64 : point.x + size / 2 + 16;

  return (
    <>
      <Link
        to={to}
        aria-label={`${title}: ${detail}`}
        className={cn(
          "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center",
          kind === "trailhead" && "rounded-md border-2 border-foreground/70 bg-background text-foreground",
          kind === "summit" && "rounded-full",
          kind === "summit" && (complete ? accentBg : "border-2 border-dashed border-basalt bg-background text-muted-foreground"),
        )}
        style={{ left: point.x, top: point.y, width: size, height: size }}
      >
        <Icon className={kind === "summit" ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" />
      </Link>
      <div aria-hidden="true" className="absolute -translate-y-1/2" style={{ left: labelLeft, top: point.y, width: width - labelLeft }}>
        <p className="font-display font-semibold">{title}</p>
        <p className="font-mono text-xs text-muted-foreground">{detail}</p>
      </div>
    </>
  );
}
