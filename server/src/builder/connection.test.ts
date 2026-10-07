import { describe, expect, test } from "vitest";

import type { PathItemView } from "../../../shared/builder";
import { classifyStatus, classifyThrown, ProviderError } from "./providers";
import { onePerCourse } from "./repo";
import { watchSearch } from "./connection";

describe("v4.5 P0: provider errors in plain states (each provider's documented codes)", () => {
  test("HTTP statuses", () => {
    expect(classifyStatus(401, "Unauthorized: missing or invalid API key.")).toBe("key_rejected");
    expect(classifyStatus(403, '{"message":"Unauthorized."}')).toBe("key_rejected");
    expect(classifyStatus(403, '{"error":{"errors":[{"reason":"quotaExceeded"}]}}')).toBe("quota");
    expect(classifyStatus(400, '{"error":{"message":"API key not valid. Please pass a valid API key."}}')).toBe("key_rejected");
    expect(classifyStatus(400, '{"message":"Not enough credits"}')).toBe("quota");
    expect(classifyStatus(432, "plan limit")).toBe("quota");
    expect(classifyStatus(433, "")).toBe("quota");
    expect(classifyStatus(402, "")).toBe("quota");
    expect(classifyStatus(429, "Rate limit exceeded")).toBe("temporary");
    expect(classifyStatus(500, "")).toBe("temporary");
    expect(classifyStatus(503, "")).toBe("temporary");
  });

  test("thrown network errors mean our server can't reach it", () => {
    const dns = Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND" } });
    expect(classifyThrown(dns, "search").state).toBe("unreachable");
    expect(classifyThrown(Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" }), "search").state).toBe("unreachable");
    expect(classifyThrown(new Error("something odd"), "search").state).toBe("temporary");
    const known = new ProviderError("quota", "search", "x", 432);
    expect(classifyThrown(known, "search")).toBe(known);
  });

  test("a job's search problem is only reported when no search worked", async () => {
    let fail = true;
    const watched = watchSearch({
      id: "tavily",
      search: async () => {
        if (fail) throw new ProviderError("key_rejected", "search", "bad key", 401);
        return [];
      },
    });
    await expect(watched.client.search("a", 1)).rejects.toThrow();
    expect(watched.problem()?.state).toBe("key_rejected");
    fail = false;
    await watched.client.search("b", 1);
    expect(watched.problem()).toBeNull();
  });
});

const view = (id: string, over: Partial<PathItemView>): PathItemView => ({
  id,
  courseId: null,
  courseTitle: id,
  position: 0,
  source: "unlock",
  reason: "",
  topicCount: 3,
  completedCount: 0,
  available: true,
  partNumber: 1,
  partType: null,
  targetSkill: null,
  startLevel: "beginner",
  ...over,
});

describe("v4.5 P0: a course appears once on the path", () => {
  test("React Fundamentals as a main course and again as a learn-first for Forms in React", () => {
    const items = [
      view("a", { moduleId: "fe-react-fundamentals", courseTitle: "React Fundamentals", targetSkill: "React Fundamentals" }),
      view("b", { moduleId: "fe-js-core", courseTitle: "JavaScript Core", targetSkill: "React Fundamentals" }),
      view("c", { moduleId: "fe-react-fundamentals", courseTitle: "React Fundamentals", targetSkill: "Forms in React" }),
      view("d", { moduleId: "fe-react-forms", courseTitle: "Forms in React", targetSkill: "Forms in React" }),
    ];
    const out = onePerCourse(items);
    expect(out.map((i) => i.id)).toEqual(["a", "b", "d"]);
    expect(out.find((i) => i.id === "d")!.needs).toEqual([{ title: "React Fundamentals", itemId: "a" }]);
    expect(out.find((i) => i.id === "a")!.needs).toBeUndefined();
  });

  test("the same course by id, or the same course being made, is also one item", () => {
    const out = onePerCourse([
      view("x", { courseId: "c1", courseTitle: "Code review", targetSkill: "A" }),
      view("y", { courseId: "c1", courseTitle: "Code review", targetSkill: "B" }),
      view("z", { courseId: "c2", courseTitle: "Pull requests", targetSkill: "B" }),
      view("n1", { creating: "working", skillId: "eng-x", courseTitle: "X", targetSkill: "B" }),
      view("n2", { creating: "working", skillId: "eng-x", courseTitle: "X", targetSkill: "B" }),
    ]);
    expect(out.map((i) => i.id)).toEqual(["x", "z", "n1"]);
    expect(out.find((i) => i.id === "z")!.needs).toEqual([{ title: "Code review", itemId: "x" }]);
  });

  test("v4.5 P5: a part made only of repeats keeps its first item (Business Development)", () => {
    // BD maps most skills onto bd-beginner / bd-intermediate, so later parts can only repeat Part 1's modules.
    const out = onePerCourse([
      view("p1a", { moduleId: "bd-beginner", courseTitle: "BD Foundations", targetSkill: "Cold email", partNumber: 1 }),
      view("p1b", { moduleId: "bd-intermediate", courseTitle: "Winning Deals", targetSkill: "Running discovery calls", partNumber: 1 }),
      view("p1c", { moduleId: "bd-beginner", courseTitle: "BD Foundations", targetSkill: "Running discovery calls", partNumber: 1 }),
      view("p2", { moduleId: "bd-beginner", courseTitle: "BD Foundations", targetSkill: null, partNumber: 2, partType: "ai_dev" }),
      view("p3a", { moduleId: "bd-intermediate", courseTitle: "Winning Deals", targetSkill: "Objection handling", partNumber: 3 }),
      view("p3b", { moduleId: "bd-beginner", courseTitle: "BD Foundations", targetSkill: "Objection handling", partNumber: 3 }),
    ]);
    // Inside Part 1 the repeat still goes; Parts 2 and 3 each keep their first item, in order.
    expect(out.map((i) => i.id)).toEqual(["p1a", "p1b", "p2", "p3a"]);
    expect(out.map((i) => i.partNumber)).toEqual([1, 1, 2, 3]);
    expect(out.findIndex((i) => i.partNumber === 2)).toBeGreaterThan(0);
    // A part with an item of its own still drops its repeats.
    const mixed = onePerCourse([
      view("a", { courseId: "c1", partNumber: 1, targetSkill: "A" }),
      view("b", { courseId: "c1", partNumber: 2, targetSkill: "B" }),
      view("c", { courseId: "c2", partNumber: 2, targetSkill: "B" }),
    ]);
    expect(mixed.map((i) => i.id)).toEqual(["a", "c"]);
  });

  test("a path with no repeats is unchanged", () => {
    const items = [view("a", { courseId: "1" }), view("b", { courseId: "2" })];
    expect(onePerCourse(items)).toEqual(items);
  });
});
