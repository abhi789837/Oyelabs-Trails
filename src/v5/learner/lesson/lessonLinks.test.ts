import { describe, expect, test } from "vitest";

import { planNextTopicId } from "./lessonLinks";

describe("planNextTopicId", () => {
  const plan = ["a", "b", "c", "d"];
  const none = () => false;

  test("the next topic in plan order, not in track order", () => {
    expect(planNextTopicId(plan, "b", none)).toBe("c");
  });

  test("skips topics already done", () => {
    expect(planNextTopicId(plan, "a", (id) => id === "b" || id === "c")).toBe("d");
  });

  test("wraps to an earlier topic left undone", () => {
    expect(planNextTopicId(plan, "d", (id) => id !== "b")).toBe("b");
  });

  test("the Phase 9.1 report's case: finishing js-closures goes to the plan's unfinished js-call-stack", () => {
    const week = ["js-call-stack", "js-hoisting", "js-scope-chain", "js-closures"];
    const completed = new Set(["js-hoisting", "js-scope-chain", "js-closures"]);
    expect(planNextTopicId(week, "js-closures", (id) => completed.has(id))).toBe("js-call-stack");
  });

  test("null when everything else is done; undefined when the topic isn't in the plan", () => {
    expect(planNextTopicId(plan, "d", (id) => id !== "d")).toBeNull();
    expect(planNextTopicId(plan, "x", none)).toBeUndefined();
    expect(planNextTopicId([], "x", none)).toBeUndefined();
  });
});
