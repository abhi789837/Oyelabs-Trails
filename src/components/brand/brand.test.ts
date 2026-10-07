import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import {
  LOGO_MIN_WIDTH,
  LOGO_VIEWBOX,
  MARK_DOT,
  MARK_INNER,
  MARK_OUTER,
  logoClearSpace,
  logoFallsBackToMark,
  logoSrc,
  logoWidth,
  markSrc,
  type LogoTheme,
  type LogoVariant,
} from "./brandAssets";
import { RING_MAX_FRACTION, progressRingGeometry } from "./ringGeometry";
import { BrandBand } from "./BrandBand";
import { BrandLoader } from "./BrandLoader";
import { Logo } from "./Logo";
import { Mark } from "./Mark";
import { ProgressRing } from "./ProgressRing";
import { RingDevice } from "./RingDevice";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const kit = path.join(root, "Oyelearn-Brand-Kit");
const publicDir = path.join(root, "public");

const VARIANTS: LogoVariant[] = ["primary", "endorsed", "tagline"];
const THEMES: LogoTheme[] = ["light", "dark", "on-blue", "white", "black"];
const html = (el: ReturnType<typeof createElement>) => renderToStaticMarkup(el);

describe("brand assets", () => {
  test.each(VARIANTS.flatMap((v) => THEMES.map((t) => [v, t] as const)))("%s/%s is the kit's file, unchanged", (variant, theme) => {
    const served = path.join(publicDir, logoSrc(variant, theme));
    const folder = variant === "primary" ? "primary" : variant;
    const original = path.join(kit, "01-logo", folder, path.basename(served));
    expect(fs.readFileSync(served, "utf8")).toBe(fs.readFileSync(original, "utf8"));
    // The viewBox the component reserves space with matches the file.
    const box = LOGO_VIEWBOX[variant];
    expect(fs.readFileSync(served, "utf8")).toContain(`viewBox="0 0 ${box.w.toFixed(1)} ${box.h.toFixed(1)}"`);
  });

  test.each(THEMES)("mark/%s is the kit's file", (theme) => {
    const served = path.join(publicDir, markSrc(theme));
    expect(fs.readFileSync(served, "utf8")).toBe(fs.readFileSync(path.join(kit, "02-mark", path.basename(served)), "utf8"));
  });

  test("the inline mark uses the kit's own path data (OyelearnMark.tsx)", () => {
    const source = fs.readFileSync(path.join(kit, "11-code", "OyelearnMark.tsx"), "utf8");
    for (const d of [...MARK_OUTER, MARK_INNER]) expect(source).toContain(d);
    expect(source).toContain(`r="${MARK_DOT.r}"`);
  });

  test("the old logo kit is gone from public/brand", () => {
    const files = fs.readdirSync(path.join(publicDir, "brand"), { recursive: true }).map(String);
    expect(files.filter((f) => /horizontal|stacked|mono-white|-mode\.svg/.test(f))).toEqual([]);
  });
});

describe("logo rules", () => {
  test("below 96 px wide the logo falls back to the mark", () => {
    const edge = (LOGO_MIN_WIDTH * LOGO_VIEWBOX.primary.h) / LOGO_VIEWBOX.primary.w;
    expect(logoFallsBackToMark("primary", edge - 0.1)).toBe(true);
    expect(logoFallsBackToMark("primary", edge + 0.1)).toBe(false);
    expect(logoWidth("primary", 24)).toBeGreaterThan(96);
    expect(html(createElement(Logo, { size: 20 }))).toContain('data-brand="mark"');
    expect(html(createElement(Logo, { size: 24 }))).toContain('data-brand="logo"');
  });

  test("clear space is half the ring's height", () => {
    // The ring is 145 of the primary file's 190.8 units.
    expect(logoClearSpace("primary", 190.8)).toBeCloseTo(72.5, 1);
    expect(html(createElement(Logo, { size: 32 }))).toContain(`padding:${Math.round(logoClearSpace("primary", 32))}px`);
    expect(html(createElement(Logo, { size: 32, clearSpace: false }))).not.toContain("padding");
  });

  test("auto renders the light and the dark file, each shown only in its theme", () => {
    const out = html(createElement(Logo, { size: 32 }));
    expect(out).toContain('src="/brand/logo/oyelearn-light.svg"');
    expect(out).toContain('src="/brand/logo/oyelearn-dark.svg"');
    expect(out).toContain("brand-only-light");
    expect(out).toContain("brand-only-dark");
    expect(out.match(/alt="Oyelearn"/g)).toHaveLength(2);
  });

  test("a fixed theme renders one file, and never a second O or typed wordmark", () => {
    const out = html(createElement(Logo, { variant: "endorsed", theme: "on-blue", size: 40 }));
    expect(out).toContain('src="/brand/logo/oyelearn-by-oyelabs-on-blue.svg"');
    expect(out.match(/<img/g)).toHaveLength(1);
    expect(out).not.toMatch(/>\s*O?yelearn\s*</);
  });

  test("decorative logos are hidden from assistive tech", () => {
    const out = html(createElement(Logo, { size: 32, decorative: true }));
    expect(out).toContain('alt=""');
    expect(out).toContain('aria-hidden="true"');
  });

  test("width and height reserve the right box", () => {
    const out = html(createElement(Logo, { size: 30, theme: "light" }));
    expect(out).toContain(`width="${Math.round(logoWidth("primary", 30))}"`);
    expect(out).toContain('height="30"');
  });
});

describe("Mark", () => {
  test("never renders below 16 px", () => {
    expect(html(createElement(Mark, { size: 8 }))).toContain('width="16"');
  });

  test("auto: the outer ring is currentColor, the inner ring and dot amber", () => {
    const out = html(createElement(Mark, { size: 32 }));
    expect(out.match(/stroke="currentColor"/g)).toHaveLength(2);
    expect(out).toContain("rgb(var(--accent-500))");
    expect(out).toContain('role="img"');
    expect(out).toContain('aria-label="Oyelearn"');
  });

  test("one-colour white draws every part white", () => {
    const out = html(createElement(Mark, { size: 32, theme: "white" }));
    expect(out).not.toContain("accent-500");
    expect(out.match(/#fff/g)).toHaveLength(4);
  });
});

describe("BrandLoader", () => {
  test("is a status with an accessible label and the kit's animated ring", () => {
    const out = html(createElement(BrandLoader, { label: "Signing you in" }));
    expect(out).toContain('role="status"');
    expect(out).toContain("Signing you in");
    expect(out).toContain("brand-loader-spin");
    expect(out).toContain("brand-loader-arc");
  });

  test("its animation stops for reduced motion (src/index.css)", () => {
    const css = fs.readFileSync(path.join(root, "src", "index.css"), "utf8");
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*:root:not\(\[data-reduced-motion="off"\]\) \.brand-loader-spin,[^}]*animation: none/);
    expect(css).toContain('[data-motion="reduce"] .brand-loader-spin');
  });
});

describe("ProgressRing", () => {
  test("clamps and rounds the value", () => {
    expect(progressRingGeometry(-5).value).toBe(0);
    expect(progressRingGeometry(140).value).toBe(100);
    expect(progressRingGeometry(Number.NaN).value).toBe(0);
    expect(progressRingGeometry(33.4).value).toBe(33);
  });

  test("never closes: 100% draws 92% of the circle", () => {
    const full = progressRingGeometry(100);
    expect(full.arcLength / full.circumference).toBeCloseTo(RING_MAX_FRACTION, 2);
    expect(full.complete).toBe(true);
    expect(progressRingGeometry(50).arcLength).toBeCloseTo(full.arcLength / 2, 1);
  });

  test("the dot stays on the ring and moves with the value", () => {
    for (const v of [0, 10, 50, 99, 100]) {
      const { dot } = progressRingGeometry(v);
      expect(Math.hypot(dot.cx - 100, dot.cy - 100)).toBeCloseTo(49, 1);
    }
    expect(progressRingGeometry(10).dot).not.toEqual(progressRingGeometry(60).dot);
  });

  test("renders an accessible progressbar, with a check only at 100%", () => {
    const half = html(createElement(ProgressRing, { value: 40, label: "Course progress" }));
    expect(half).toContain('role="progressbar"');
    expect(half).toContain('aria-valuenow="40"');
    expect(half).toContain('aria-label="Course progress"');
    expect(half).not.toContain("data-complete");
    const done = html(createElement(ProgressRing, { value: 100 }));
    expect(done).toContain('data-complete="true"');
    expect(done).toContain('aria-valuetext="Complete"');
    expect(done).toContain("M82 101l12 12 24-26");
  });

  test("at 0 there is no arc, only the dot", () => {
    const out = html(createElement(ProgressRing, { value: 0 }));
    expect(out).not.toContain("stroke-dasharray");
    expect(out).toContain('r="12.4"');
  });
});

describe("RingDevice and BrandBand", () => {
  test("the ring device is decorative and one colour", () => {
    const out = html(createElement(RingDevice, { className: "text-white" }));
    expect(out).toContain('aria-hidden="true"');
    expect(out).not.toContain("accent-500");
  });

  test("the band carries the on-blue logo, and the dark one for dark mode", () => {
    const out = html(createElement(BrandBand));
    expect(out).toContain("/brand/logo/oyelearn-on-blue.svg");
    expect(out).toContain("/brand/logo/oyelearn-dark.svg");
    expect(out).toContain("bg-oyelabs-blue");
  });
});
