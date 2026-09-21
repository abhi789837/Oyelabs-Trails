import { useMemo } from "react";

import { contourPaths } from "@/lib/contours";
import { cn } from "@/lib/utils";

interface ContoursProps {
  className?: string;
  /** Changes the shape of the terrain; same seed, same map. */
  seed?: number;
  rings?: number;
}

/** Topographic contour lines behind hero areas. Purely decorative, low opacity. */
export function Contours({ className, seed = 1, rings = 11 }: ContoursProps) {
  const paths = useMemo(() => contourPaths({ cx: 760, cy: 150, rings, seed, spacing: 38, firstRadius: 34 }), [seed, rings]);

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
