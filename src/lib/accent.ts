import type { AccentToken } from "@/types/curriculum";

/**
 * Tailwind needs complete class names at build time, so each accent's classes are
 * spelled out here rather than built with string interpolation.
 */
export interface AccentClasses {
  bg: string;
  soft: string;
  text: string;
  border: string;
  fg: string;
  decoration: string;
}

export const accentClasses: Record<AccentToken, AccentClasses> = {
  trailmark: {
    bg: "bg-trailmark",
    soft: "bg-trailmark/10",
    text: "text-trailmark-strong",
    border: "border-trailmark",
    fg: "text-trailmark-foreground",
    decoration: "decoration-trailmark",
  },
  summit: {
    bg: "bg-summit",
    soft: "bg-summit/10",
    text: "text-summit-strong",
    border: "border-summit",
    fg: "text-summit-foreground",
    decoration: "decoration-summit",
  },
  ridge: {
    bg: "bg-ridge",
    soft: "bg-ridge/10",
    text: "text-ridge-strong",
    border: "border-ridge",
    fg: "text-ridge-foreground",
    decoration: "decoration-ridge",
  },
  glacier: {
    bg: "bg-glacier",
    soft: "bg-glacier/10",
    text: "text-glacier-strong",
    border: "border-glacier",
    fg: "text-glacier-foreground",
    decoration: "decoration-glacier",
  },
  basalt: {
    bg: "bg-basalt",
    soft: "bg-basalt/10",
    text: "text-basalt-strong",
    border: "border-basalt",
    fg: "text-basalt-foreground",
    decoration: "decoration-basalt",
  },
};

/** CSS color for inline SVG strokes/fills, e.g. accentColor("summit", 0.4). */
export function accentColor(token: AccentToken | "foreground" | "border", alpha = 1): string {
  return alpha === 1 ? `rgb(var(--${token}))` : `rgb(var(--${token}) / ${alpha})`;
}
