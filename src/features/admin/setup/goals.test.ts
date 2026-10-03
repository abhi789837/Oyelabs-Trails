import { describe, expect, it } from "vitest";

import { addCaseGoal, addSkillGoal, addSuggestedGoal, canMoveGoal, derivePriorityRows, dropSkillGoals, interpretationLine, moveGoal, rowsFromSaved, searchCases, sortedGoals, toGoalInputs, updateGoal } from "./goals";
import { initialSetupState, pickSkip, toSaveRequest, withGoals } from "./helpers";

const kase = { id: "c1", title: "Resolve a merge conflict", statement: "Can resolve a merge conflict.", skillIds: ["git", "prs"], level: 2, aliases: ["merge"], capstoneTitle: "x" };

describe("goal rows", () => {
  it("derive priorities like the server: highest slider per skill, goal order then skill order", () => {
    let rows = addCaseGoal([], kase, 3);
    rows = addSkillGoal(rows, "docker", 4);
    rows = addSkillGoal(rows, "git", 5);
    expect(derivePriorityRows(rows).map((p) => [p.skillId, p.slider])).toEqual([
      ["git", 5],
      ["docker", 4],
      ["prs", 3],
    ]);
    expect(derivePriorityRows(rows, ["git"]).map((p) => p.skillId)).toEqual(["docker", "prs"]);
  });

  it("never adds the same skill or case twice", () => {
    let rows = addSkillGoal([], "git");
    rows = addSkillGoal(rows, "git", 5);
    rows = addCaseGoal(rows, kase);
    rows = addCaseGoal(rows, kase);
    rows = addSuggestedGoal(rows, { type: "case", originalText: kase.title, outcome: kase.statement, skillIds: kase.skillIds, targetLevel: 2, caseId: "c1", slider: 3, reason: "" });
    expect(rows).toHaveLength(2);
  });

  it("sorts and moves within a tie only", () => {
    let rows = addSkillGoal([], "a", 3);
    rows = addSkillGoal(rows, "b", 3);
    rows = addSkillGoal(rows, "c", 5);
    expect(sortedGoals(rows).map((r) => r.skillIds[0])).toEqual(["c", "a", "b"]);
    const b = rows.find((r) => r.skillIds[0] === "b")!;
    expect(canMoveGoal(rows, b.key, -1)).toBe(true);
    expect(canMoveGoal(rows, rows.find((r) => r.skillIds[0] === "a")!.key, -1)).toBe(false);
    expect(sortedGoals(moveGoal(rows, b.key, -1)).map((r) => r.skillIds[0])).toEqual(["c", "b", "a"]);
    expect(sortedGoals(updateGoal(rows, b.key, { slider: 5 })).map((r) => r.skillIds[0])).toEqual(["b", "c", "a"]);
  });

  it("skipping a skill drops only its own skill goal", () => {
    const rows = addCaseGoal(addSkillGoal([], "git"), kase);
    expect(dropSkillGoals(rows, "git").map((r) => r.type)).toEqual(["case"]);
    const state = pickSkip(withGoals(initialSetupState(null, "engineering"), rows), "git");
    expect(state.priorities.map((p) => p.skillId)).toEqual(["prs"]);
  });

  it("starts from saved goals, or from the priorities when none were saved", () => {
    const fromPriorities = rowsFromSaved([], [{ skillId: "x", skillName: "X", slider: 2, position: 0 }, { skillId: "y", skillName: "Y", slider: 5, position: 1 }], 2);
    expect(fromPriorities.map((r) => [r.skillIds[0], r.slider, r.targetLevel])).toEqual([
      ["y", 5, 3],
      ["x", 2, 3],
    ]);
    const saved = rowsFromSaved([{ id: "g1", type: "text", originalText: "ship it", outcome: "Can ship it.", skillIds: ["z"], targetLevel: 4, caseId: null, slider: 4, position: 0, status: "achieved", achievedAt: 1, source: "admin" }], [], null);
    expect(saved[0]).toMatchObject({ key: "g1", id: "g1", status: "achieved" });
    expect(toGoalInputs(saved)[0]).toEqual({ id: "g1", type: "text", originalText: "ship it", outcome: "Can ship it.", skillIds: ["z"], targetLevel: 4, caseId: null, slider: 4 });
  });

  it("sends goals with the setup", () => {
    const state = withGoals(initialSetupState(null, "engineering"), addSkillGoal([], "git", 5));
    const request = toSaveRequest(state, true);
    expect(request.goals).toHaveLength(1);
    expect(request.priorities).toEqual([{ skillId: "git", slider: 5 }]);
  });

  it("reads like the brief under a chip", () => {
    expect(interpretationLine(["dbg", "lar", "logs"], 3, new Map([["dbg", "Debugging"], ["lar", "Laravel"], ["logs", "logs"]]))).toBe("→ Debugging, Laravel, logs · Intermediate");
  });

  it("searches cases by title, alias and words", () => {
    expect(searchCases([kase], "merge").map((c) => c.id)).toEqual(["c1"]);
    expect(searchCases([kase], "conflict resolve").map((c) => c.id)).toEqual(["c1"]);
    expect(searchCases([kase], "docker")).toEqual([]);
  });
});
