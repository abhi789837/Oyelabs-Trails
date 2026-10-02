import { describe, expect, test } from "vitest";

import type { BankItem } from "../../../shared/bank";
import { planAssessmentMix, type MixSkill } from "../../../shared/setup";
import { assemble, difficultyOrder } from "./assemble";

function item(id: string, skillId: string, type: BankItem["type"], difficulty = 2, stackId: string | null = null): BankItem {
  return { id, departmentId: "engineering", skillId, trackId: null, stackId, type, difficulty, estMinutes: 1.5, prompt: id, coding: null, mcq: null, task: null };
}

/** Plenty of items per skill: 6 coding and 3 mcq at each difficulty 1–4. */
function stock(skillId: string, stackId: string | null = null): BankItem[] {
  const out: BankItem[] = [];
  for (let d = 1; d <= 4; d += 1) {
    for (let i = 0; i < 6; i += 1) out.push(item(`${skillId}-c${d}${i}`, skillId, "coding", d, stackId));
    for (let i = 0; i < 3; i += 1) out.push(item(`${skillId}-m${d}${i}`, skillId, "mcq", d, stackId));
  }
  return out;
}

const s = (skillId: string, slider: number): MixSkill => ({ skillId, skillName: skillId, slider });

function run(partial: Partial<Parameters<typeof assemble>[0]> = {}) {
  const mix = planAssessmentMix([s("aws", 5), s("react", 4), s("sql", 3), s("git", 2)], [s("js-basics", 0), s("vue-basics", 0)]);
  const pool = [...stock("aws"), ...stock("react", "stack-react"), ...stock("sql"), ...stock("git"), ...stock("js-basics"), ...stock("vue-basics", "stack-vue")];
  return assemble({ format: "coding", mix, pool, stackIds: ["stack-react"], skip: [], seen: new Set(), level: 3, experienceBand: "3-5", seed: "learner-1", ...partial });
}

describe("assemble", () => {
  test("25 items: 18 hands-on and 7 multiple choice", () => {
    const { items } = run();
    expect(items).toHaveLength(25);
    expect(items.filter((i) => i.item.type === "coding")).toHaveLength(18);
    expect(items.filter((i) => i.item.type === "mcq")).toHaveLength(7);
  });

  test("Critical/High skills are asked first and get about 60%", () => {
    const { items } = run();
    expect(items[0].skillId).toBe("aws");
    const focus = items.filter((i) => i.group === "focus").length;
    expect(focus).toBe(15);
    const firstOther = items.findIndex((i) => i.group !== "focus");
    expect(items.slice(firstOther).every((i) => i.group !== "focus")).toBe(true);
  });

  test("own stack only: a Vue item is never served to a React learner", () => {
    const { items } = run();
    expect(items.some((i) => i.item.stackId === "stack-vue")).toBe(false);
  });

  test("never repeats an item, and avoids ones seen before", () => {
    const first = run();
    const seen = new Set(first.items.map((i) => i.item.id));
    const second = run({ seen, seed: "learner-1-attempt-2" });
    expect(new Set(second.items.map((i) => i.item.id)).size).toBe(25);
    expect(second.items.filter((i) => seen.has(i.item.id))).toHaveLength(0);
  });

  test("a beginner starts easy; others start easy-medium", () => {
    expect(difficultyOrder(1, "0")[0]).toBe(1);
    expect(difficultyOrder(3, "3-5")[0]).toBe(2);
    const beginner = run({ level: 1, experienceBand: "0" });
    expect(beginner.items.filter((i) => i.item.difficulty === 1).length).toBeGreaterThan(15);
  });

  test("a skipped skill is never tested, not even as filler", () => {
    const { items } = run({ skip: ["sql"] });
    expect(items.some((i) => i.item.skillId === "sql")).toBe(false);
  });

  test("a thin skill reports a shortfall and the questions go elsewhere", () => {
    const mix = planAssessmentMix([s("aws", 5), s("react", 4)], [s("js-basics", 0)]);
    const pool = [...stock("aws").filter((i) => i.type === "mcq").slice(0, 2), ...stock("react", "stack-react"), ...stock("js-basics")];
    const result = assemble({ format: "coding", mix, pool, stackIds: ["stack-react"], skip: [], seen: new Set(), level: 3, experienceBand: "1-2", seed: "x" });
    expect(result.items).toHaveLength(25);
    expect(result.shortfalls.some((sf) => sf.skillId === "aws" && sf.type === "coding")).toBe(true);
  });

  test("is deterministic for the same seed", () => {
    expect(run().items.map((i) => i.item.id)).toEqual(run().items.map((i) => i.item.id));
  });
});
