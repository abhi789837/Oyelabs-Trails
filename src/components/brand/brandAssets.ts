/**
 * The Oyelearn brand kit v1.0, as data (docs/branding/DECISIONS.md, "Step 0.1").
 *
 * Pure: the brand components and their tests share it. The logo files in `public/brand/` are the
 * kit's own SVGs, copied unchanged; nothing here re-types the wordmark or redraws the mark. The
 * mark's path data below is the kit's `11-code/OyelearnMark.tsx`, verbatim.
 */

export type LogoVariant = "primary" | "endorsed" | "tagline";
/** A fixed logo colourway, one per kit file. */
export type LogoTheme = "light" | "dark" | "on-blue" | "white" | "black";
/** `auto` follows the nearest `.dark` (the app sets it from the saved theme or prefers-color-scheme). */
export type BrandTheme = "auto" | LogoTheme;

/** The PDF's minimum sizes (p5): the logo 96 px wide, the mark 16 px. Below 96 px wide, the mark. */
export const LOGO_MIN_WIDTH = 96;
export const MARK_MIN_SIZE = 16;

/** Each lockup's viewBox (the kit files are 812 units wide). */
export const LOGO_VIEWBOX: Record<LogoVariant, { w: number; h: number }> = {
  primary: { w: 812, h: 190.8 },
  endorsed: { w: 812, h: 222.8 },
  tagline: { w: 812, h: 222.8 },
};

/** The ring's height inside every lockup file: the mark (182 units) scaled by 0.7967. */
export const LOGO_RING_HEIGHT = 145;

const FILE_BASE: Record<LogoVariant, string> = {
  primary: "oyelearn",
  endorsed: "oyelearn-by-oyelabs",
  tagline: "oyelearn-tagline",
};

export function logoSrc(variant: LogoVariant, theme: LogoTheme): string {
  return `/brand/logo/${FILE_BASE[variant]}-${theme}.svg`;
}

export function markSrc(theme: LogoTheme): string {
  return `/brand/mark/oyelearn-mark-${theme}.svg`;
}

/** Rendered width for a rendered height. */
export function logoWidth(variant: LogoVariant, height: number): number {
  const box = LOGO_VIEWBOX[variant];
  return (box.w / box.h) * height;
}

/** True when the lockup would be narrower than the 96 px minimum, so the mark is used instead. */
export function logoFallsBackToMark(variant: LogoVariant, height: number): boolean {
  return logoWidth(variant, height) < LOGO_MIN_WIDTH;
}

/** Clear space on every side: half the ring's rendered height (PDF p5). */
export function logoClearSpace(variant: LogoVariant, height: number): number {
  return (0.5 * height * LOGO_RING_HEIGHT) / LOGO_VIEWBOX[variant].h;
}

/** The mark's clear space: the ring is the whole mark, so half its size. */
export function markClearSpace(size: number): number {
  return size / 2;
}

// ---------------------------------------------------------------------------
// The mark (kit 11-code/OyelearnMark.tsx)
// ---------------------------------------------------------------------------

export const MARK_VIEWBOX = "9.0 9.0 182.0 182.0";
/** The outer ring (Oyelabs): two arcs with the family's two breaks. */
export const MARK_OUTER = ["M149.25 163.04A80 80 0 1 1 137.56 29.36", "M161.28 48.58A80 80 0 0 1 169.28 140.00"] as const;
export const MARK_OUTER_WIDTH = 22;
/** The inner ring (progress): about 75% drawn, rounded ends. */
export const MARK_INNER = "M121.48 144.04A49 49 0 1 1 135.25 65.96";
export const MARK_INNER_WIDTH = 20;
/** The dot (you are here). */
export const MARK_DOT = { cx: 146.6, cy: 84.86, r: 12.4 } as const;

/**
 * The kit's colourways for the mark: the outer ring and the inner ring + dot. One-colour versions
 * (`white`, `black`) draw everything in one colour. Values are CSS colours that read the global
 * tokens (src/index.css), so they match the kit hexes: brand-600 #2067D3, brand-400 (Sky) #5F93E3,
 * accent-500 (Amber) #F59E0B, brand-950 (Night Navy) #0B2347.
 */
export const MARK_COLOURS: Record<LogoTheme, { outer: string; inner: string }> = {
  light: { outer: "rgb(var(--brand-600))", inner: "rgb(var(--accent-500))" },
  dark: { outer: "rgb(var(--brand-400))", inner: "rgb(var(--accent-500))" },
  "on-blue": { outer: "#fff", inner: "rgb(var(--accent-500))" },
  white: { outer: "#fff", inner: "#fff" },
  black: { outer: "rgb(var(--brand-950))", inner: "rgb(var(--brand-950))" },
};

// ---------------------------------------------------------------------------
// ProgressRing geometry
// ---------------------------------------------------------------------------

const CENTRE = 100;
export const RING_RADIUS = 49;
/** Where the mark's inner arc starts (its first point, 121.48 144.04): about 64°, clockwise from 3 o'clock. */
export const RING_START_DEG = (Math.atan2(144.04 - CENTRE, 121.48 - CENTRE) * 180) / Math.PI;
/** "Never fully closed": 100% draws 92% of the circle and shows a check instead. */
export const RING_MAX_FRACTION = 0.92;
/** The dot sits just ahead of the arc's end, as in the mark. */
export const RING_DOT_LEAD_DEG = 20;

export interface RingGeometry {
  /** 0–100, rounded and clamped. */
  value: number;
  /** Length of the drawn arc, in viewBox units (the circle's circumference is 2π·49). */
  arcLength: number;
  circumference: number;
  /** Rotation that puts the arc's start where the mark's starts. */
  startDeg: number;
  dot: { cx: number; cy: number };
  complete: boolean;
}

export function progressRingGeometry(raw: number): RingGeometry {
  const value = Number.isFinite(raw) ? Math.round(Math.min(100, Math.max(0, raw))) : 0;
  const circumference = 2 * Math.PI * RING_RADIUS;
  const fraction = (value / 100) * RING_MAX_FRACTION;
  const arcLength = fraction * circumference;
  const sweep = fraction * 360;
  // At 0 the dot sits where the ring will start; at 100 it sits on the tip (ahead of it, it would
  // touch the start and close the ring); otherwise just ahead of the tip.
  const dotDeg = RING_START_DEG + sweep + (value > 0 && value < 100 ? RING_DOT_LEAD_DEG : 0);
  const rad = (dotDeg * Math.PI) / 180;
  const dot = { cx: round(CENTRE + RING_RADIUS * Math.cos(rad)), cy: round(CENTRE + RING_RADIUS * Math.sin(rad)) };
  return { value, arcLength: round(arcLength), circumference: round(circumference), startDeg: round(RING_START_DEG), dot, complete: value === 100 };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** A tiny class joiner, so the brand components don't pull tailwind-merge into every route. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
