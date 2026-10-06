import { describe, expect, test } from "vitest";

import { audienceLine, filterPeople, samePeople, withAssignee } from "./library/audience";
import { courseUpdate } from "./library/editor/courseOps";

describe("who gets a course", () => {
  test("the line says who sees it now", () => {
    expect(audienceLine(false, "everyone", 0)).toBe("Draft: nobody sees it yet.");
    expect(audienceLine(false, "assigned", 3)).toBe("Draft: nobody sees it yet. Make it live and 3 people will.");
    expect(audienceLine(true, "everyone", 5)).toBe("Live for everyone.");
    expect(audienceLine(true, "assigned", 1)).toBe("Live for 1 person.");
    expect(audienceLine(true, "assigned", 3)).toBe("Live for 3 people.");
    expect(audienceLine(true, "assigned", 0)).toMatch(/nobody sees it yet/);
  });

  test("search matches name, username or department, every word", () => {
    const list = [
      { id: "a", displayName: "Asha Rao", username: "asha", department: "Engineering" },
      { id: "b", displayName: "Ben Cole", username: "ben", department: "Sales" },
      { id: "c", displayName: "Cara Lee", username: "cara", department: null },
    ];
    expect(filterPeople(list, "").map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(filterPeople(list, "sales").map((p) => p.id)).toEqual(["b"]);
    expect(filterPeople(list, "rao eng").map((p) => p.id)).toEqual(["a"]);
    expect(filterPeople(list, "CARA").map((p) => p.id)).toEqual(["c"]);
    expect(filterPeople(list, "nobody")).toEqual([]);
  });

  test("adding a person keeps everyone already there", () => {
    expect(withAssignee(["a", "b"], "c")).toEqual(["a", "b", "c"]);
    expect(withAssignee([], "c")).toEqual(["c"]);
    expect(withAssignee(["a", "c"], "c")).toBeNull();
  });

  test("same people in any order", () => {
    expect(samePeople(["a", "b"], ["b", "a"])).toBe(true);
    expect(samePeople(["a"], ["a", "b"])).toBe(false);
    expect(samePeople(["a", "b"], ["a", "c"])).toBe(false);
  });

  test("the course update keeps every other field", () => {
    const course = { id: "x", title: "T", summary: "S", accent: "glacier", audience: "everyone", published: false, position: 0, createdAt: 0, updatedAt: 0, level: "beginner", departmentId: "eng", sections: [] } as const;
    expect(courseUpdate({ ...course, sections: [] }, { audience: "assigned" })).toEqual({ title: "T", summary: "S", accent: "glacier", audience: "assigned", published: false, level: "beginner", departmentId: "eng" });
    expect(courseUpdate({ ...course, sections: [] }, { published: true }).published).toBe(true);
  });
});
