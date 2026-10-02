import { describe, expect, it } from "vitest";

import { planAssessmentMix, sliderToPriority, sortPriorities, type MixSkill } from "./setup";

const skill = (id: string, slider: number): MixSkill => ({ skillId: id, skillName: id, slider });
const basics = [skill("basics-js", 0), skill("basics-git", 0)];

describe("slider mapping", () => {
  it("maps Critical and High to high, Medium to medium, Low and Optional to low", () => {
    expect([5, 4, 3, 2, 1].map(sliderToPriority)).toEqual(["high", "high", "medium", "low", "low"]);
  });

  it("sorts by slider and keeps selection order for ties", () => {
    const sorted = sortPriorities([
      { id: "a", slider: 3, position: 0 },
      { id: "b", slider: 5, position: 1 },
      { id: "c", slider: 3, position: 2 },
      { id: "d", slider: 5, position: 3 },
    ]);
    expect(sorted.map((s) => s.id)).toEqual(["b", "d", "a", "c"]);
  });
});

describe("planAssessmentMix", () => {
  it("gives 25 questions, 18 hands-on and 7 multiple choice", () => {
    const mix = planAssessmentMix([skill("aws", 5), skill("react", 4), skill("sql", 3), skill("git", 2)], basics);
    expect(mix.total).toBe(25);
    expect(mix.handsOn).toBe(18);
    expect(mix.mcq).toBe(7);
  });

  it("puts about 60% on Critical/High, 25% on the rest and 15% on basics, focus first", () => {
    const mix = planAssessmentMix([skill("aws", 5), skill("react", 4), skill("sql", 3), skill("git", 2)], basics);
    const sum = (group: string) => mix.lines.filter((l) => l.group === group).reduce((s, l) => s + l.count, 0);
    expect(sum("focus")).toBe(15);
    expect(sum("other")).toBe(6);
    expect(sum("basics")).toBe(4);
    expect(mix.lines[0].skillId).toBe("aws");
    expect(mix.lines.findIndex((l) => l.group === "basics")).toBeGreaterThan(mix.lines.findIndex((l) => l.group === "other"));
  });

  it("gives a Critical skill at least as many questions as a High one", () => {
    const mix = planAssessmentMix([skill("react", 4), skill("aws", 5)], basics);
    const count = (id: string) => mix.lines.find((l) => l.skillId === id)!.count;
    expect(count("aws")).toBeGreaterThanOrEqual(count("react"));
  });

  it("hands an empty group's share to the next one", () => {
    const mix = planAssessmentMix([skill("aws", 5), skill("react", 5), skill("node", 4)], basics);
    expect(mix.lines.filter((l) => l.group === "focus").reduce((s, l) => s + l.count, 0)).toBe(21);
    expect(mix.total).toBe(25);
  });

  it("never puts more than 8 questions on one skill while others can take them", () => {
    const mix = planAssessmentMix([skill("aws", 5)], [...basics, skill("basics-sql", 0)]);
    expect(mix.lines.find((l) => l.skillId === "aws")!.count).toBe(8);
    expect(mix.total).toBe(25);
  });

  it("asks every listed skill at least once", () => {
    const many = Array.from({ length: 12 }, (_, i) => skill(`s${i}`, (i % 5) + 1));
    const mix = planAssessmentMix(many, basics);
    for (const s of many) expect(mix.lines.some((l) => l.skillId === s.skillId)).toBe(true);
    expect(mix.total).toBe(25);
  });

  it("still builds a full test with no priorities at all", () => {
    const mix = planAssessmentMix([], basics);
    expect(mix.total).toBe(25);
    expect(mix.lines.every((l) => l.group === "basics")).toBe(true);
  });
});
