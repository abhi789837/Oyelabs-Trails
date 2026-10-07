/**
 * WCAG 2.x contrast, for the token test and the /design swatches (one implementation, so the page
 * shows exactly the numbers the test enforces).
 */

export type Rgb = readonly [number, number, number];

/** "32 103 211" or "rgb(32, 103, 211)" → [32, 103, 211]; null if it isn't three channels. */
export function parseChannels(value: string): Rgb | null {
  const nums = value.replace(/rgba?\(|\)/g, " ").split(/[\s,/]+/).filter(Boolean).map(Number);
  if (nums.length < 3 || nums.slice(0, 3).some((n) => !Number.isFinite(n))) return null;
  return [nums[0], nums[1], nums[2]];
}

export function luminance([r, g, b]: Rgb): number {
  const c = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastNeed = "text" | "ui" | "none";

/** 4.5:1 for text, 3:1 for large text and UI marks (focus ring, fills that carry meaning). */
export const CONTRAST_MIN: Record<ContrastNeed, number> = { text: 4.5, ui: 3, none: 0 };

export function passes(ratio: number, need: ContrastNeed): boolean {
  return ratio >= CONTRAST_MIN[need];
}

export function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/**
 * Every pair the v5 components render, with what it has to clear. The test checks these in light
 * and dark; the /design page shows the same list.
 */
export interface TokenPair {
  fg: string;
  on: string;
  need: Exclude<ContrastNeed, "none">;
  note: string;
}

const SEMANTIC = ["brand", "progress", "success", "warning", "danger", "info", "neutral"] as const;
const LANES = ["lane-now", "lane-must", "lane-medium", "lane-low"] as const;
const SURFACES = ["surface-0", "surface-1", "surface-2", "surface-3", "sunken"] as const;

export const TOKEN_PAIRS: readonly TokenPair[] = [
  ...SURFACES.flatMap((on) => [
    { fg: "fg-1", on, need: "text" as const, note: "body text" },
    { fg: "fg-2", on, need: "text" as const, note: "secondary text" },
    { fg: "fg-3", on, need: "text" as const, note: "placeholder and tertiary text" },
  ]),
  ...(["surface-0", "surface-1", "surface-2", "surface-3"] as const).flatMap((on) => [
    { fg: "focus", on, need: "ui" as const, note: "the focus ring" },
    { fg: "line-2", on, need: "ui" as const, note: "an input's border" },
  ]),
  ...[...SEMANTIC, ...LANES].flatMap((k) => [
    { fg: `on-${k}`, on: k, need: "text" as const, note: `${k} filled (button, chip)` },
    { fg: `${k}-fg`, on: "surface-0", need: "text" as const, note: `${k} as text on the page` },
    { fg: `${k}-fg`, on: "surface-1", need: "text" as const, note: `${k} as text on a card` },
    { fg: `${k}-fg`, on: `${k}-soft`, need: "text" as const, note: `${k} text on its tint (badge)` },
    { fg: "fg-1", on: `${k}-soft`, need: "text" as const, note: `body text on a ${k} tint (callout)` },
    { fg: k, on: "surface-1", need: "ui" as const, note: `${k} as a mark (progress, dot)` },
    { fg: k, on: "surface-0", need: "ui" as const, note: `${k} as a mark on the page` },
    { fg: k, on: "sunken", need: "ui" as const, note: `${k} fill against a progress track` },
  ]),
];
