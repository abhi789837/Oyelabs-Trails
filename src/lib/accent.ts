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
  /** Filled button in the accent color. */
  solid: string;
}

export const accentClasses: Record<AccentToken, AccentClasses> = {
  trailmark: {
    bg: "bg-trailmark",
    soft: "bg-trailmark/10",
    text: "text-trailmark-strong",
    border: "border-trailmark",
    fg: "text-trailmark-foreground",
    decoration: "decoration-trailmark",
    solid: "bg-trailmark text-trailmark-foreground hover:bg-trailmark/85",
  },
  summit: {
    bg: "bg-summit",
    soft: "bg-summit/10",
    text: "text-summit-strong",
    border: "border-summit",
    fg: "text-summit-foreground",
    decoration: "decoration-summit",
    solid: "bg-summit text-summit-foreground hover:bg-summit/90",
  },
  ridge: {
    bg: "bg-ridge",
    soft: "bg-ridge/10",
    text: "text-ridge-strong",
    border: "border-ridge",
    fg: "text-ridge-foreground",
    decoration: "decoration-ridge",
    solid: "bg-ridge text-ridge-foreground hover:bg-ridge/90",
  },
  glacier: {
    bg: "bg-glacier",
    soft: "bg-glacier/10",
    text: "text-glacier-strong",
    border: "border-glacier",
    fg: "text-glacier-foreground",
    decoration: "decoration-glacier",
    solid: "bg-glacier text-glacier-foreground hover:bg-glacier/90",
  },
  basalt: {
    bg: "bg-basalt",
    soft: "bg-basalt/10",
    text: "text-basalt-strong",
    border: "border-basalt",
    fg: "text-basalt-foreground",
    decoration: "decoration-basalt",
    solid: "bg-basalt text-basalt-foreground hover:bg-basalt/90",
  },
  canyon: {
    bg: "bg-canyon",
    soft: "bg-canyon/10",
    text: "text-canyon-strong",
    border: "border-canyon",
    fg: "text-canyon-foreground",
    decoration: "decoration-canyon",
    solid: "bg-canyon text-canyon-foreground hover:bg-canyon/90",
  },
  alpenglow: {
    bg: "bg-alpenglow",
    soft: "bg-alpenglow/10",
    text: "text-alpenglow-strong",
    border: "border-alpenglow",
    fg: "text-alpenglow-foreground",
    decoration: "decoration-alpenglow",
    solid: "bg-alpenglow text-alpenglow-foreground hover:bg-alpenglow/90",
  },
  lichen: {
    bg: "bg-lichen",
    soft: "bg-lichen/10",
    text: "text-lichen-strong",
    border: "border-lichen",
    fg: "text-lichen-foreground",
    decoration: "decoration-lichen",
    solid: "bg-lichen text-lichen-foreground hover:bg-lichen/90",
  },
};

/** CSS color for inline SVG strokes/fills, e.g. accentColor("summit", 0.4). */
export function accentColor(token: AccentToken | "foreground" | "border", alpha = 1): string {
  return alpha === 1 ? `rgb(var(--${token}))` : `rgb(var(--${token}) / ${alpha})`;
}
