/**
 * Density modes. Comfortable is the learner default; compact is for admin tables and dense lists.
 *
 * Set `data-density` on any element (or on <html> through `useV5Root({ density })`) and every
 * v5 component below it picks up the sizes from tokens.css: `h-(--v5-control-h)`, `h-(--v5-row-h)`, `p-(--v5-card-pad)`,
 * `gap-(--v5-gap)`. The px values here mirror the stylesheet for code that needs a number (virtualised
 * row heights); `density.test.ts` keeps them in step.
 */

export type Density = "comfortable" | "compact";

export const DENSITIES: readonly Density[] = ["comfortable", "compact"];

export const densityPx: Record<Density, { control: number; row: number; cardPad: number; gap: number }> = {
  comfortable: { control: 40, row: 48, cardPad: 20, gap: 16 },
  compact: { control: 32, row: 36, cardPad: 12, gap: 10 },
};

/** WCAG 2.2 (2.5.8) minimum target size. Every density keeps controls above it. */
export const MIN_TARGET_PX = 24;

export function parseDensity(value: unknown, fallback: Density = "comfortable"): Density {
  return value === "comfortable" || value === "compact" ? value : fallback;
}

/** The attribute to spread on a container: `<div {...densityAttr("compact")}>`. */
export function densityAttr(density: Density): { "data-density": Density } {
  return { "data-density": density };
}
