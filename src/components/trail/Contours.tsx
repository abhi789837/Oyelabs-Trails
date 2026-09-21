import { useMemo } from "react";

import { cn } from "@/lib/utils";

interface ContoursProps {
  className?: string;
  /** Changes the shape of the terrain; same seed, same map. */
  seed?: number;
  rings?: number;
}

/**
 * Topographic contour lines, drawn as nested wobbly rings around one peak.
 * Purely decorative: sits behind hero areas at low opacity.
 */
export function Contours({ className, seed = 1, rings = 11 }: ContoursProps) {
  const paths = useMemo(() => {
    const cx = 760;
    const cy = 150;
    return Array.from({ length: rings }, (_, ring) => {
      const radius = 34 + ring * 38;
      const wobble = 0.12 + ring * 0.012;
      const points: string[] = [];
      const steps = 96;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const noise =
          Math.sin(3 * t + seed) * 0.5 + Math.sin(5 * t + seed * 1.7 + ring * 0.15) * 0.3 + Math.sin(2 * t + seed * 0.3) * 0.2;
        const r = radius * (1 + wobble * noise);
        points.push(`${(cx + r * Math.cos(t) * 1.55).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`);
      }
      return `M${points.join("L")}Z`;
    });
  }, [seed, rings]);

  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      viewBox="0 0 1000 320"
      preserveAspectRatio="xMidYMid slice"
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={i % 4 === 3 ? 1.4 : 0.8}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
