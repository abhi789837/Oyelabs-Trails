import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

/**
 * The design tokens, checked against WCAG rather than asserted in a comment.
 *
 * `docs/PROGRESS.md` and the token block in `index.css` both claim specific contrast ratios —
 * "brand-600 on paper 4.91:1", "each -strong clears 4.5:1 on its theme's background (checked, not
 * guessed)". They were checked, once, by hand. This is what keeps them true: the numbers are
 * recomputed from the stylesheet on every test run, so a token nudged for aesthetic reasons fails
 * here instead of shipping.
 *
 * It parses `index.css` rather than importing a duplicate palette, because a second copy of the
 * colours would be the thing that drifts. Every pair below is a combination the UI actually
 * renders — a ratio between two colours that never touch would pass or fail for no reason.
 *
 * ## What the thresholds mean
 *
 * - **4.5:1** — WCAG AA for body text (1.4.3). Applied to every foreground-on-background pair.
 * - **3:1** — WCAG AA for large text and, separately, for a focus indicator or a UI component's
 *   boundary (1.4.11). Applied to the ring and to the accent fills that carry meaning as a mark
 *   rather than as text.
 *
 * Deliberately **not** checked: `--border` and `--input` against the background. A hairline that
 * separates two regions is decoration under 1.4.11, not a component boundary, and holding it to
 * 3:1 would force a border dark enough to read as a rule drawn through the page.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(here, "..", "index.css"), "utf8");

type Rgb = [number, number, number];

/**
 * Pulls one theme's `--token: R G B` declarations out of a CSS block.
 *
 * `:root` and `.dark` are matched by their opening line and read to the closing brace at the same
 * indentation. The dark block only *overrides* — anything it does not name is inherited from
 * `:root`, which is exactly how the cascade behaves at runtime, so the dark map is layered on the
 * light one rather than read on its own.
 */
function readBlock(selector: string): Map<string, string> {
  const start = css.indexOf(`\n  ${selector} {`);
  if (start === -1) throw new Error(`No "${selector}" block in index.css`);
  const end = css.indexOf("\n  }", start);
  const body = css.slice(start, end);

  const tokens = new Map<string, string>();
  for (const match of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

const light = readBlock(":root");
const dark = new Map([...light, ...readBlock(".dark")]);

/** Resolves a token to RGB, following one `var(--other)` indirection (`--primary` is one). */
function rgb(tokens: Map<string, string>, name: string): Rgb {
  const seen = new Set<string>();
  let value = tokens.get(name);
  let key = name;
  while (value?.startsWith("var(")) {
    if (seen.has(key)) throw new Error(`Cycle resolving --${name}`);
    seen.add(key);
    key = value.slice(6, -1); // var(--x) -> x
    value = tokens.get(key);
  }
  if (!value) throw new Error(`No token --${name}`);
  const parts = value.split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`--${name} is "${value}", not three RGB channels`);
  }
  return parts as Rgb;
}

/** WCAG 2.1 relative luminance. The 0.03928 branch is the sRGB transfer curve's linear toe. */
function luminance([r, g, b]: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Text pairs: 4.5:1. `on` is the surface the foreground sits on. */
const TEXT: { fg: string; on: string; note: string }[] = [
  { fg: "foreground", on: "background", note: "body text" },
  { fg: "foreground", on: "surface", note: "body text on a card" },
  { fg: "foreground", on: "surface-sunken", note: "body text on a sunken panel" },
  { fg: "muted-foreground", on: "background", note: "secondary text" },
  { fg: "muted-foreground", on: "surface", note: "secondary text on a card" },
  { fg: "muted-foreground", on: "surface-sunken", note: "secondary text on a sunken panel" },
  { fg: "primary-strong", on: "background", note: "a link" },
  { fg: "destructive", on: "background", note: "an error message" },
  { fg: "editor-foreground", on: "editor", note: "code in the editor" },
  { fg: "popover-foreground", on: "popover", note: "a tooltip" },
  // Every accent's text-safe shade, on the page. These are the ones index.css claims were checked.
  ...["trailmark", "summit", "ridge", "glacier", "basalt", "canyon", "alpenglow", "lichen"].map((accent) => ({
    fg: `${accent}-strong`,
    on: "background",
    note: `${accent} as text`,
  })),
  // And each accent's own foreground on its fill — a filled badge or button.
  ...["trailmark", "summit", "ridge", "glacier", "basalt", "canyon", "alpenglow", "lichen"].map((accent) => ({
    fg: `${accent}-foreground`,
    on: accent,
    note: `${accent} filled`,
  })),
  { fg: "primary-foreground", on: "primary", note: "the primary button" },
];

/** Non-text pairs: 3:1 under 1.4.11. */
const UI: { fg: string; on: string; note: string }[] = [
  { fg: "ring", on: "background", note: "the focus ring" },
  { fg: "ring", on: "surface", note: "the focus ring on a card" },
  { fg: "ring", on: "surface-sunken", note: "the focus ring on a sunken panel" },
];

describe.each([
  ["light", light],
  ["dark", dark],
])("%s theme", (themeName, tokens) => {
  test.each(TEXT)("$fg on $on clears 4.5:1 — $note", ({ fg, on }) => {
    const value = ratio(rgb(tokens, fg), rgb(tokens, on));
    expect(
      value,
      `--${fg} on --${on} is ${value.toFixed(2)}:1 in the ${themeName} theme, below the 4.5:1 AA threshold for text`,
    ).toBeGreaterThanOrEqual(4.5);
  });

  test.each(UI)("$fg on $on clears 3:1 — $note", ({ fg, on }) => {
    const value = ratio(rgb(tokens, fg), rgb(tokens, on));
    expect(
      value,
      `--${fg} on --${on} is ${value.toFixed(2)}:1 in the ${themeName} theme, below the 3:1 threshold for a focus indicator`,
    ).toBeGreaterThanOrEqual(3);
  });
});

describe("the numbers index.css states", () => {
  /* The token block names four ratios explicitly. If one of them is edited without re-measuring,
     the comment becomes a lie that nothing else would catch — these pin the exact claims. */
  test.each([
    ["brand-600 on paper", "brand-600", "paper", light, 4.91],
    ["white on brand-600", "primary-foreground", "brand-600", light, 5.33],
    ["brand-700 on paper", "brand-700", "paper", light, 6.39],
    ["brand-400 on the dark background", "brand-400", "background", dark, 5.89],
  ])("%s is %s:1", (_label, fg, on, tokens, expected) => {
    expect(ratio(rgb(tokens as Map<string, string>, fg as string), rgb(tokens as Map<string, string>, on as string))).toBeCloseTo(
      expected as number,
      1,
    );
  });
});
