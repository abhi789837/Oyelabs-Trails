import { motion, useReducedMotion } from "framer-motion";

import { useElementWidth } from "@/hooks/useElementWidth";
import { accentColor } from "@/lib/accent";
import { smoothPath, type Point } from "@/lib/geometry";
import { levelElevation } from "@/lib/track-meta";
import type { TopicProgress } from "@/store/progressStore";
import type { Track } from "@/types/curriculum";

interface ElevationProfileProps {
  track: Track;
  progress: Record<string, TopicProgress>;
  height?: number;
  /** Draw the line in once on mount. */
  animate?: boolean;
}

/**
 * A trail's difficulty as terrain: each topic is a point whose height comes from its
 * level, trending upward toward the final summit. Markers use the roadmap's states.
 */
export function ElevationProfile({ track, progress, height = 84, animate = true }: ElevationProfileProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const n = track.topics.length;
  const padX = 10;
  const padTop = 12;
  const padBottom = 10;

  const points: Point[] = track.topics.map((topic, i) => {
    const t = n === 1 ? 0 : i / (n - 1);
    const level = (levelElevation[topic.level] - 1) / 2; // 0..1
    const lift = 0.55 * level + 0.45 * t;
    return {
      x: padX + t * Math.max(width - padX * 2, 0),
      y: padTop + (1 - lift) * (height - padTop - padBottom),
    };
  });

  const line = smoothPath(points, 0.9);
  const area = points.length ? `${line} L${points.at(-1)!.x},${height} L${points[0].x},${height} Z` : "";
  const stroke = accentColor(track.accentToken);
  const shouldAnimate = animate && !reduceMotion;

  return (
    <div ref={ref} className="relative w-full" style={{ height }} aria-hidden="true">
      {width > 0 && (
        <svg width={width} height={height} className="absolute inset-0 overflow-visible">
          <motion.path
            d={area}
            fill={accentColor(track.accentToken, 0.1)}
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.path
            d={line}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            initial={shouldAnimate ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
          {track.topics.map((topic, i) => {
            const status = progress[topic.id]?.status ?? "not-started";
            const r = topic.isMilestone ? 5.5 : 4;
            const { x, y } = points[i];
            if (status === "completed") return <circle key={topic.id} cx={x} cy={y} r={r} fill={accentColor("summit")} />;
            if (status === "in-progress") return <circle key={topic.id} cx={x} cy={y} r={r} fill={accentColor("trailmark")} />;
            return (
              <circle
                key={topic.id}
                cx={x}
                cy={y}
                r={r - 0.75}
                fill="rgb(var(--background))"
                stroke={accentColor("basalt")}
                strokeWidth={1.5}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}
