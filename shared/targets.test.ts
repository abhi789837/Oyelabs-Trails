import { describe, expect, test } from "vitest";

import {
  PRIORITY_BUDGET,
  orderedTargets,
  rankTargets,
  splitBudget,
  type LearnerTarget,
} from "./targets";

/**
 * The priority budget and the ordering.
 *
 * These are the two things the whole assessment redesign rests on: the admin said what matters most,
 * and the test has to spend its questions accordingly. Both are pure arithmetic over a small list,
 * so they are cheap to pin down exactly — and expensive to get quietly wrong, because the symptom is
 * an assessment that felt fine and measured the wrong thing.
 */

function target(skill: string, priority: LearnerTarget["priority"], position = 0): LearnerTarget {
  return { skill, priority, position, targetDate: null };
}

describe("ordering", () => {
  test("High comes before Medium comes before Low", () => {
    const targets = [target("c", "low"), target("a", "high"), target("b", "medium")];
    expect(orderedTargets(targets).map((t) => t.skill)).toEqual(["a", "b", "c"]);
  });

  test("position breaks ties within a priority", () => {
    /* The reason `position` exists. Two High targets are not equally urgent, and dragging one above
       the other has to mean something downstream. */
    const targets = [target("second", "high", 1), target("first", "high", 0)];
    expect(orderedTargets(targets).map((t) => t.skill)).toEqual(["first", "second"]);
  });

  test("the order is stable when priority and position both tie", () => {
    const targets = [target("b", "high", 0), target("a", "high", 0)];
    expect(orderedTargets(targets).map((t) => t.skill)).toEqual(["a", "b"]);
  });

  test("rankTargets returns indices into the original array", () => {
    const targets = [target("low", "low"), target("high", "high")];
    expect(rankTargets(targets)).toEqual([1, 0]);
  });
});

describe("the question budget", () => {
  test("High takes about half when all three priorities are present", () => {
    const targets = [target("h", "high"), target("m", "medium"), target("l", "low")];
    const counts = splitBudget(targets, 20);

    expect(counts.reduce((a, b) => a + b, 0)).toBe(20);
    // Each gets its floor of 1, then the remaining 17 split 50/30/20.
    expect(counts[0]).toBeGreaterThan(counts[1]);
    expect(counts[1]).toBeGreaterThan(counts[2]);
    expect(counts[0] / 20).toBeGreaterThan(0.4);
  });

  test("a priority with nothing in it gives its share away", () => {
    /* An admin who listed only High targets should get a whole assessment about them, not half of
       one with the other half quietly unspent. */
    const targets = [target("a", "high"), target("b", "high")];
    const counts = splitBudget(targets, 20);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(20);
    expect(counts.every((n) => n >= 9)).toBe(true);
  });

  test("every listed target gets at least one question", () => {
    // A Low target's 0.2 share of a small budget rounds to zero, and "we asked you nothing about the
    // thing we wrote down" is worse than one question.
    const targets = [target("h", "high"), target("m", "medium"), target("l1", "low"), target("l2", "low")];
    const counts = splitBudget(targets, 6);
    expect(counts.every((n) => n >= 1)).toBe(true);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(6);
  });

  test("a budget smaller than the target list goes to the highest priorities", () => {
    const targets = [target("l", "low"), target("h", "high"), target("m", "medium")];
    const counts = splitBudget(targets, 2);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(2);
    expect(counts[1]).toBe(1); // high
    expect(counts[2]).toBe(1); // medium
    expect(counts[0]).toBe(0); // low misses out
  });

  test("within a priority the first by position gets the extra question", () => {
    const targets = [target("first", "high", 0), target("second", "high", 1)];
    const counts = splitBudget(targets, 5);
    expect(counts[0]).toBeGreaterThanOrEqual(counts[1]);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(5);
  });

  test("no targets means no questions, not a crash", () => {
    expect(splitBudget([], 20)).toEqual([]);
  });

  test("a zero budget spends nothing", () => {
    expect(splitBudget([target("a", "high")], 0)).toEqual([0]);
  });

  test("the shares are the ones the brief names", () => {
    expect(PRIORITY_BUDGET.high).toBe(0.5);
    expect(PRIORITY_BUDGET.medium).toBe(0.3);
    expect(PRIORITY_BUDGET.low).toBe(0.2);
  });
});
