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

  test("a path with no repeats is unchanged", () => {
    const items = [view("a", { courseId: "1" }), view("b", { courseId: "2" })];
    expect(onePerCourse(items)).toEqual(items);
  });
});
