import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { parsePath } from "@/features/plan/trailGeometry";

import { cn } from "./cn";
import { contrastRatio, parseChannels, toHex } from "./contrast";
import { DENSITIES, MIN_TARGET_PX, densityAttr, densityPx, parseDensity } from "./density";
import { HINT_LEVELS, formatClock, intervalLabel, nextHint, nextStep, ratingForKey, solutionUnlocked, stepStates } from "./lesson";
import { CELEBRATION_MAX_MS, clampCelebrationMs, cubicBezier, duration, durationMs, easing, motionConfigFor, shouldReduceMotion, springs } from "./motion";
import { clampPct, clampSkill, formatXp, lastWeeks, ringGeometry, skillLabel, skillSegments, tickerFrames, timeLeftLabel } from "./progress";
import { buildTrail, moveCount, type TrailStop } from "./trail";

const here = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(here, "tokens.css"), "utf8");
const cssVar = (name: string) => {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`--${name} missing`);
  return m[1].trim();
};
const px = (rem: string) => Number.parseFloat(rem) * 16;

describe("motion tokens", () => {
  test("the four durations are 120/200/320/500 ms and match tokens.css", () => {
    expect(Object.values(durationMs)).toEqual([120, 200, 320, 500]);
    expect(cssVar("v5-dur-1")).toBe("120ms");
    expect(cssVar("v5-dur-2")).toBe("200ms");
    expect(cssVar("v5-dur-3")).toBe("320ms");
    expect(cssVar("v5-dur-4")).toBe("500ms");
    expect(duration.calm).toBeCloseTo(0.32);
  });

  test("easing curves match tokens.css", () => {
    expect(cssVar("v5-ease-out")).toBe(cubicBezier("out"));
    expect(cssVar("v5-ease-in")).toBe(cubicBezier("in"));
    expect(cssVar("v5-ease-in-out")).toBe(cubicBezier("inOut"));
    expect(cssVar("v5-ease-emphasis")).toBe(cubicBezier("emphasis"));
    for (const curve of Object.values(easing)) {
      expect(curve[0]).toBeGreaterThanOrEqual(0);
      expect(curve[0]).toBeLessThanOrEqual(1);
      expect(curve[2]).toBeGreaterThanOrEqual(0);
      expect(curve[2]).toBeLessThanOrEqual(1);
    }
  });

  test("springs are over-damped enough not to wobble (damping ratio ≥ 0.7)", () => {
    for (const s of Object.values(springs)) {
      const mass = "mass" in s ? s.mass : 1;
      expect(s.damping / (2 * Math.sqrt(s.stiffness * mass))).toBeGreaterThanOrEqual(0.7);
    }
  });

  test("reduced-motion preference maps to MotionConfig and to a yes/no", () => {
    expect(motionConfigFor("on")).toBe("always");
    expect(motionConfigFor("off")).toBe("never");
    expect(motionConfigFor("system")).toBe("user");
    expect(motionConfigFor(null)).toBe("user");
    expect(shouldReduceMotion("system", true)).toBe(true);
    expect(shouldReduceMotion("system", false)).toBe(false);
    expect(shouldReduceMotion("off", true)).toBe(false);
    expect(shouldReduceMotion("on", false)).toBe(true);
  });

  test("celebrations never run past 2 s", () => {
    expect(clampCelebrationMs(5000)).toBe(CELEBRATION_MAX_MS);
    expect(clampCelebrationMs(1500)).toBe(1500);
    expect(clampCelebrationMs(Number.NaN)).toBe(CELEBRATION_MAX_MS);
    expect(clampCelebrationMs(-1)).toBe(CELEBRATION_MAX_MS);
  });
});

describe("density", () => {
  test("px values mirror tokens.css", () => {
    const compactStart = css.indexOf('[data-ui="v5"][data-density="compact"]');
    const comfortable = css.slice(css.indexOf("--v5-control-h"), compactStart);
    const compact = css.slice(compactStart);
    const read = (src: string, name: string) => px(src.match(new RegExp(`--v5-${name}:\\s*([^;]+);`))![1]);
    for (const [src, d] of [
      [comfortable, densityPx.comfortable],
      [compact, densityPx.compact],
    ] as const) {
      expect(read(src, "control-h")).toBe(d.control);
      expect(read(src, "row-h")).toBe(d.row);
      expect(read(src, "card-pad")).toBe(d.cardPad);
      expect(read(src, "gap")).toBe(d.gap);
    }
  });

  test("every density keeps controls at or above the 24 px target size", () => {
    for (const d of DENSITIES) expect(densityPx[d].control).toBeGreaterThanOrEqual(MIN_TARGET_PX);
  });

  test("spacing sits on the 4 px grid", () => {
    for (const d of DENSITIES) for (const v of [densityPx[d].control, densityPx[d].row, densityPx[d].cardPad]) expect(v % 4).toBe(0);
  });

  test("parses and spreads", () => {
    expect(parseDensity("compact")).toBe("compact");
    expect(parseDensity("tiny")).toBe("comfortable");
    expect(parseDensity(undefined, "compact")).toBe("compact");
    expect(densityAttr("compact")).toEqual({ "data-density": "compact" });
  });
});

describe("trail (reusing features/plan/trailGeometry)", () => {
  const stops: TrailStop[] = [
    { id: "a", title: "Closures", meta: "Must know · 20 min", lane: "must_know", done: true },
    { id: "b", title: "The event loop, from the call stack to microtasks", lane: "do_now", done: false },
    { id: "c", title: "Promises", lane: "medium", done: true },
    { id: "d", title: "Async/await", lane: "low", done: false },
  ];

  test.each([390, 1200])("one continuous path at %i px: exactly one M", (width) => {
    const g = buildTrail(stops, { width });
    expect(moveCount(g.d)).toBe(1);
    expect(parsePath(g.d).filter((c) => c.op === "C")).toHaveLength(stops.length + 1);
    expect(g.mode).toBe(width >= 768 ? "desktop" : "mobile");
  });

  test("progress is a prefix of the trail up to the furthest done stop, even with gaps", () => {
    const g = buildTrail(stops, { width: 1000 });
    expect(g.furthestDoneIndex).toBe(2);
    expect(moveCount(g.progressD)).toBe(1);
    expect(g.d.startsWith(g.progressD)).toBe(true);
    expect(g.hereIndex).toBe(1);
    expect(g.summitReached).toBe(false);
  });

  test("all done reaches the summit; none done draws no progress", () => {
    expect(buildTrail(stops.map((s) => ({ ...s, done: true })), { width: 800 }).summitReached).toBe(true);
    expect(buildTrail(stops.map((s) => ({ ...s, done: false })), { width: 800 }).progressD).toBe("");
  });

  test("tones default to Must know", () => {
    const g = buildTrail([{ id: "x", title: "X", done: false }], { width: 600 });
    expect(g.segments[0].tone).toBe("must_know");
  });
});

describe("progress helpers", () => {
  test("clampPct", () => {
    expect(clampPct(3, 8)).toBe(38);
    expect(clampPct(-5)).toBe(0);
    expect(clampPct(150)).toBe(100);
    expect(clampPct(Number.NaN)).toBe(0);
    expect(clampPct(1, 0)).toBe(0);
  });

  test("ringGeometry", () => {
    const r = ringGeometry(96, 8, 50);
    expect(r.radius).toBe(44);
    expect(r.offset).toBeCloseTo(r.circumference / 2);
    expect(ringGeometry(96, 8, 100).offset).toBeCloseTo(0);
  });

  test("skill meter", () => {
    expect(clampSkill(7)).toBe(5);
    expect(clampSkill(2.3)).toBe(2.5);
    expect(skillLabel(0)).toBe("Not started");
    expect(skillLabel(5)).toBe("Expert");
    expect(skillSegments(2.5)).toEqual(["full", "full", "half", "empty", "empty"]);
  });

  test("streak weeks pad on the left, oldest first", () => {
    const w = lastWeeks([{ week: "2026-W39", met: true }, { week: "2026-W40", met: false, frozen: true }], 4);
    expect(w).toHaveLength(4);
    expect(w[0]).toBeNull();
    expect(w[3]?.week).toBe("2026-W40");
  });

  test("XP formatting and the ticker", () => {
    expect(formatXp(1250)).toBe("1,250 XP");
    expect(formatXp(-3)).toBe("0 XP");
    const frames = tickerFrames(100, 250, 10);
    expect(frames).toHaveLength(10);
    expect(frames.at(-1)).toBe(250);
    expect([...frames].sort((a, b) => a - b)).toEqual(frames);
    expect(tickerFrames(5, 5)).toEqual([5]);
  });

  test("time left", () => {
    expect(timeLeftLabel(30)).toBe("Less than a minute left");
    expect(timeLeftLabel(12 * 60)).toBe("12 min left");
    expect(timeLeftLabel(65 * 60)).toBe("1 h 5 min left");
    expect(timeLeftLabel(120 * 60)).toBe("2 h left");
  });
});

describe("lesson rules", () => {
  test("steps unlock in order; absent steps are skipped", () => {
    expect(stepStates("watch", {})).toEqual({ watch: "current", read: "locked", do: "locked", check: "locked" });
    expect(stepStates("read", { watch: true })).toEqual({ watch: "done", read: "current", do: "locked", check: "locked" });
    expect(stepStates("read", { watch: true }, ["watch", "read", "check"])).toEqual({ watch: "done", read: "current", do: "absent", check: "locked" });
    expect(stepStates("check", { watch: true, read: true, do: true, check: true }).check).toBe("done");
    expect(nextStep("read", ["watch", "read", "check"])).toBe("check");
    expect(nextStep("check")).toBeNull();
  });

  test("the solution needs every hint and two checks", () => {
    expect(HINT_LEVELS).toEqual(["nudge", "concept", "partial"]);
    expect(nextHint(0)).toBe("nudge");
    expect(nextHint(3)).toBeNull();
    expect(solutionUnlocked(3, 1)).toBe(false);
    expect(solutionUnlocked(2, 5)).toBe(false);
    expect(solutionUnlocked(3, 2)).toBe(true);
  });

  test("flashcard keys rate only once flipped", () => {
    expect(ratingForKey("3", false)).toBeNull();
    expect(ratingForKey("3", true)).toBe(3);
    expect(ratingForKey("5", true)).toBeNull();
    expect(intervalLabel(10 * 60_000)).toBe("10 min");
    expect(intervalLabel(3 * 86_400_000)).toBe("3 days");
    expect(intervalLabel(0)).toBe("now");
  });

  test("clock", () => {
    expect(formatClock(245)).toBe("4:05");
    expect(formatClock(3729)).toBe("1:02:09");
  });
});

describe("contrast helpers", () => {
  test("parse, ratio, hex", () => {
    expect(parseChannels("32 103 211")).toEqual([32, 103, 211]);
    expect(parseChannels("rgb(32, 103, 211)")).toEqual([32, 103, 211]);
    expect(parseChannels("nope")).toBeNull();
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21);
    expect(toHex([32, 103, 211])).toBe("#2067D3");
  });
});

describe("cn (tailwind-merge with the v5 theme)", () => {
  test("a v5 font size does not swallow a v5 text colour", () => {
    expect(cn("bg-brand text-on-brand", "text-small")).toBe("bg-brand text-on-brand text-small");
    expect(cn("text-caption", "text-body")).toBe("text-body");
  });
  test("v5 shadows and radii merge with each other", () => {
    expect(cn("shadow-e1", "shadow-e2")).toBe("shadow-e2");
    expect(cn("rounded-card", "rounded-control")).toBe("rounded-control");
  });
});
