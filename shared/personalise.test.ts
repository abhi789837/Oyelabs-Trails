import { describe, expect, test } from "vitest";

import { EMPHASIS_SHIFT_MAX, shiftTowardEmphasis } from "./personalise";
import type { MixLine } from "./setup";

const line = (skillId: string, handsOn: number, mcq = 1, group: MixLine["group"] = "focus"): MixLine => ({ skillId, skillName: skillId, group, count: handsOn + mcq, handsOn, mcq });
const ask = (skillId: string, n: number) => Array.from({ length: n }, () => ({ skillId, kind: "handsOn" as const, subtype: "write" as const, difficulty: 2, hint: "" }));

describe("leaning the split toward the description", () => {
  const lines = [line("meetings", 2), line("excel", 2), line("client", 3), line("keka", 2, 1, "other"), line("teams", 2, 1, "other"), line("theory", 2, 0, "other")];
  const total = (ls: MixLine[]) => ls.reduce((s, l) => s + l.handsOn, 0);

  test("stressed skills gain a slot each from the lowest-priority skills", () => {
    const proposed = [...ask("meetings", 4), ...ask("excel", 3), ...ask("client", 3), ...ask("keka", 1), ...ask("teams", 1), ...ask("theory", 1)];
    const out = shiftTowardEmphasis(lines, proposed);
    const by = new Map(out.map((l) => [l.skillId, l.handsOn]));
    expect(by.get("meetings")).toBe(3);
    expect(by.get("excel")).toBe(3);
    expect(by.get("theory")).toBe(1);
    expect(by.get("teams")).toBe(1);
    expect(total(out)).toBe(total(lines));
    expect(out.every((l) => l.handsOn >= 1)).toBe(true);
  });

  test("never moves more than the cap, and follows the sliders when nothing is stressed", () => {
    const greedy = shiftTowardEmphasis(lines, [...ask("meetings", 9), ...ask("excel", 9), ...ask("client", 9), ...ask("keka", 9)]);
    const gained = greedy.reduce((s, l, i) => s + Math.max(0, l.handsOn - lines[i].handsOn), 0);
    expect(gained).toBeLessThanOrEqual(EMPHASIS_SHIFT_MAX);
    expect(shiftTowardEmphasis(lines, lines.flatMap((l) => ask(l.skillId, l.handsOn)))).toEqual(lines);
  });
});
