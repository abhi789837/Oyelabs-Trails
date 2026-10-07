import { describe, expect, test } from "vitest";

import type { PathItemView } from "./builder";
import { coverageView, laterGroupLabel, laterLabel, needsLine, splitPath } from "./pathView";

const item = (n: number, targetSkill: string | null): PathItemView => ({
  id: `i${n}`,
  courseId: `c${n}`,
  courseTitle: `Course ${n}`,
  position: n,
  source: "unlock",
  reason: "",
  topicCount: 4,
  completedCount: 0,
  available: true,
  partNumber: 1,
  partType: null,
  targetSkill,
  startLevel: "beginner",
});

describe("v4.5 P0: a long path", () => {
  test("48 courses: the first 8 in order, the other 40 under 'Later (40 more)', grouped by goal", () => {
    const goals = ["Forms in React", "Backend", "Spoken English"];
    const items = Array.from({ length: 48 }, (_, n) => item(n, goals[n % 3]));
    const split = splitPath(items);
    expect(split.first.map((i) => i.id)).toEqual(items.slice(0, 8).map((i) => i.id));
    expect(split.laterCount).toBe(40);
    expect(laterLabel(split.laterCount)).toBe("Later (40 more)");
    expect(split.later.map((g) => g.goal)).toEqual(["Spoken English", "Forms in React", "Backend"]);
    expect(split.later.reduce((n, g) => n + g.items.length, 0)).toBe(40);
    // Order inside a goal is the path's order.
    expect(split.later[0].items.map((i) => i.position)).toEqual([...split.later[0].items.map((i) => i.position)].sort((a, b) => a - b));
  });

  test("the current step stays in view; a short path has nothing later", () => {
    const items = Array.from({ length: 20 }, (_, n) => item(n, null));
    expect(splitPath(items, 14).first).toHaveLength(14);
    expect(splitPath(items, 2).first).toHaveLength(8);
    expect(splitPath(items.slice(0, 6)).laterCount).toBe(0);
    expect(laterGroupLabel(null)).toBe("Other steps");
    expect(laterGroupLabel("Forms in React")).toBe("For your goal: forms in React");
  });
});

describe("v4.5 P0: a course appears once", () => {
  test("Needs: … (earlier in your path)", () => {
    expect(needsLine({ needs: [{ title: "React Fundamentals", itemId: "i1" }] })).toBe("Needs: React Fundamentals (earlier in your path)");
    expect(needsLine({ needs: [] })).toBeNull();
    expect(needsLine({})).toBeNull();
  });
});

describe("v4.5 P0: never 'not assessed'", () => {
  const coverage = { assessedAt: 1000, levels: { "eng-react": 2, "eng-forms": null }, addedAfterTest: ["eng-redux"] };
  test("measured, added after the test, still being marked, or no test yet", () => {
    expect(coverageView("eng-react", coverage, "beginner")).toEqual({ kind: "level", level: 2 });
    expect(coverageView("eng-redux", coverage, "beginner")).toEqual({ kind: "added", text: "Added after the test · starts at Beginner" });
    expect(coverageView("eng-forms", coverage, "intermediate")).toEqual({ kind: "unmeasured", text: "Still being marked · starts at Intermediate" });
    expect(coverageView("eng-x", { assessedAt: null, levels: {}, addedAfterTest: [] }, null)).toEqual({ kind: "unmeasured", text: "No test yet · starts at Beginner" });
    expect(coverageView("eng-x", null, null, 3)).toEqual({ kind: "level", level: 3 });
  });
});
