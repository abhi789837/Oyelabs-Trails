import { describe, expect, test } from "vitest";

import { assignRequest, courseSizeLine, withPicked } from "./courseAssign";

describe("Add a course: pure parts", () => {
  test("builds the request for each target", () => {
    const ids = { userId: "u1", departmentId: "pm" };
    expect(assignRequest("c1", "most_important", "learner", ids, true)).toEqual({ courseId: "c1", priority: "most_important", target: { kind: "learner", userId: "u1" } });
    expect(assignRequest("c1", "important", "department", ids, true).target).toEqual({ kind: "department", departmentId: "pm" });
    expect(assignRequest("c1", "important", "department_everyone", ids, true).target).toEqual({ kind: "department_everyone", departmentId: "pm", required: true });
  });

  test("size line and picked list", () => {
    expect(courseSizeLine({ lessons: 1, estMinutes: 0 })).toBe("1 lesson");
    expect(courseSizeLine({ lessons: 6, estMinutes: 45 })).toBe("6 lessons, about 45 min");
    expect(courseSizeLine({ lessons: 6, estMinutes: 180 })).toBe("6 lessons, about 3 h");
    const a = { courseId: "a", title: "A", oyelabs: true, priority: "important" as const, reason: null };
    expect(withPicked([a], { ...a, priority: "most_important" })).toEqual([{ ...a, priority: "most_important" }]);
    expect(withPicked([a], { ...a, courseId: "b" })).toHaveLength(2);
  });
});
