import { describe, expect, it } from "vitest";

import { ENGLISH_LEVEL_DESCRIPTORS, ENGLISH_LEVELS, englishLevelFor, englishLevelSummary, isSoftSkillId, SOFT_SKILL_IDS, skillLevelForEnglish } from "./softSkills";

describe("englishLevelFor", () => {
  it("maps 0–5 to the plan's English levels", () => {
    expect([0, 1, 2, 3, 4, 5].map(englishLevelFor)).toEqual(["below A2", "A2", "B1", "B2", "C1", "C1"]);
  });

  it("rounds fractions and clamps out-of-range or bad input", () => {
    expect(englishLevelFor(2.4)).toBe("B1");
    expect(englishLevelFor(2.6)).toBe("B2");
    expect(englishLevelFor(-3)).toBe("below A2");
    expect(englishLevelFor(9)).toBe("C1");
    expect(englishLevelFor(Number.NaN)).toBe("below A2");
  });

  it("inverts for targets", () => {
    for (const level of ENGLISH_LEVELS) expect(englishLevelFor(skillLevelForEnglish(level))).toBe(level);
  });
});

describe("English level descriptors", () => {
  it("has a plain one-line summary for every level", () => {
    for (const level of ENGLISH_LEVELS) {
      const d = ENGLISH_LEVEL_DESCRIPTORS[level];
      expect(d.level).toBe(level);
      expect(d.summary.split(/\s+/).length).toBeLessThanOrEqual(20);
      for (const text of [d.summary, d.range, d.accuracy, d.fluency, d.interaction, d.coherence, d.clarity]) expect(text.length).toBeGreaterThan(10);
    }
    expect(englishLevelSummary(2)).toBe("Can get the main point across in familiar work situations, with some pauses.");
  });

  it("never names the framework or judges accent as a fault", () => {
    const all = JSON.stringify(ENGLISH_LEVEL_DESCRIPTORS);
    expect(all).not.toMatch(/CEFR/);
    expect(all).not.toMatch(/native/i);
  });
});

describe("soft skill ids", () => {
  it("lists the ten fixed ids", () => {
    expect(SOFT_SKILL_IDS).toHaveLength(10);
    expect(isSoftSkillId("ss-feedback")).toBe(true);
    expect(isSoftSkillId("pm-feedback")).toBe(false);
  });
});
