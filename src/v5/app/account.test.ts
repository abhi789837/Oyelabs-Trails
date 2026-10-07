import { describe, expect, it } from "vitest";

import type { LearnerGoalView } from "@shared/goals";

import { capstoneHref } from "@/v5/learner/me/MoreCards";

import { CHANGE_PASSWORD_PATH, PRACTICE_LINKS, roleLabel } from "./account";
import { initials } from "./UserMenu";

function goal(capstone: LearnerGoalView["capstone"]): LearnerGoalView {
  return { id: "g 1", outcome: "Ship a feature", skillIds: [], skillNames: [], targetLevel: 3, status: "active", achievedAt: null, capstone };
}

describe("account menu (docs/v5/PARITY.md)", () => {
  it("names the role in plain words", () => {
    expect(roleLabel("learner")).toBe("Learner");
    expect(roleLabel("admin")).toBe("Admin");
    expect(roleLabel("superadmin")).toBe("Superadmin");
    expect(roleLabel(undefined)).toBe("Learner");
  });

  it("draws initials from the display name", () => {
    expect(initials("Priya Sharma")).toBe("PS");
    expect(initials("Priya Anne Sharma")).toBe("PS");
    expect(initials("priya")).toBe("PR");
    expect(initials("  ")).toBe("?");
  });

  it("points at the existing change-password screen and every previous-design practice page", () => {
    expect(CHANGE_PASSWORD_PATH).toBe("/change-password");
    expect(PRACTICE_LINKS.map((l) => l.to)).toEqual(["/glossary", "/glossary/practice", "/tools/classify", "/practice/roleplay"]);
  });

  it("sends a topic capstone to the v5 lesson and a task capstone to its page", () => {
    expect(capstoneHref(goal({ kind: "topic", title: "Closures", topicId: "js-closures" }))).toBe("/learn/lesson/js-closures");
    expect(capstoneHref(goal({ kind: "task", title: "Build it", topicId: null }))).toBe("/goals/g%201");
    expect(capstoneHref(goal(null))).toBeNull();
  });
});
