import { motion, useReducedMotion } from "framer-motion";

import type { TrackMeta } from "@/content";
import { useElementWidth } from "@/hooks/useElementWidth";
import { summarizeModule } from "@/hooks/useTrackProgress";
import { accentColor } from "@/lib/accent";
import { smoothPath, type Point } from "@/lib/geometry";
import { levelElevation } from "@/lib/track-meta";
import type { TopicProgress } from "@/store/progressStore";

interface ElevationProfileProps {
  track: TrackMeta;
  progress: Record<string, TopicProgress>;
  height?: number;
  /** Draw the line in once on mount. */
  animate?: boolean;
}

/**
 * A trail's difficulty as terrain: each camp (module) is a point whose height comes from its
 * topics' average level, trending upward toward the summit. Markers use the roadmap states.
 */
export function ElevationProfile({ track, progress, height = 84, animate = true }: ElevationProfileProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const camps = track.modules;
  const n = camps.length;
  const padX = 10;
  const padTop = 12;
  const padBottom = 10;

  const points: Point[] = camps.map((module, i) => {
    const t = n === 1 ? 0 : i / (n - 1);
    const levels = module.topics.map((topic) => levelElevation[topic.level]);
    const avg = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 2;
    const level = (avg - 1) / 3; // 0..1 across beginner..expert
    const lift = 0.55 * level + 0.45 * t;
    return {
      x: padX + t * Math.max(width - padX * 2, 0),
      y: padTop + (1 - lift) * (height - padTop - padBottom),
    };
  });

  const line = smoothPath(points, 0.9);
  const area = points.length ? `${line} L${points.at(-1)!.x},${height} L${points[0].x},${height} Z` : "";
  const shouldAnimate = animate && !reduceMotion;

  return (
    <div ref={ref} className="relative w-full" style={{ height }} aria-hidden="true">
      {width > 0 && n > 0 && (
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
            stroke={accentColor(track.accentToken)}
            strokeWidth={2}
            strokeLinecap="round"
            initial={shouldAnimate ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
          {camps.map((module, i) => {
            const s = summarizeModule(module, progress);
            const { x, y } = points[i];
            const size = 8;
            const common = { x: x - size / 2, y: y - size / 2, width: size, height: size, rx: 2 };
            if (!module.available) {
              return <rect key={module.id} {...common} fill="rgb(var(--background))" stroke={accentColor("basalt", 0.6)} strokeDasharray="2 2" />;
            }
            if (s.isComplete) return <rect key={module.id} {...common} fill={accentColor("summit")} />;
            if (s.started) return <rect key={module.id} {...common} fill={accentColor("trailmark")} />;
            return <rect key={module.id} {...common} fill="rgb(var(--background))" stroke={accentColor("basalt")} strokeWidth={1.5} />;
          })}
        </svg>
      )}
    </div>
  );
}
