import { describe, expect, test } from "vitest";

import type { Catalog } from "@shared/catalog";
import type { Intent } from "@shared/intents";

import { initialSetupState, withGoals, type SetupState } from "./helpers";
import { currentRoleLine, planTitle, previewKey, setWantedPriority, wantedItems } from "./planSummary";
import { elapsedLabel, stepStates } from "./suggestSteps";

const intents: Intent[] = [
  { id: "i1", phrase: "frontend engineer with 1 year of experience", type: "current_role", statement: "Frontend engineer", skillIds: [], targetLevel: 2, slider: 0, trackId: "frontend", years: 1 },
  { id: "i2", phrase: "move to the full stack", type: "move_role", statement: "Become a full-stack developer.", skillIds: ["eng-node-runtime"], targetLevel: 3, slider: 4 },
  { id: "i3", phrase: "improve the soft skills", type: "improve_area", statement: "Better soft skills, including spoken English", skillIds: ["ss-spoken-english"], targetLevel: 3, slider: 3 },
];

function state(): SetupState {
  const base = initialSetupState(null, "engineering");
  return withGoals({ ...base, trackId: "frontend", intents, unsure: [], description: "x", intentsFor: "x" }, [
    { key: "g1", position: 0, type: "text", originalText: "move to the full stack", outcome: "Can work across the stack.", skillIds: ["eng-node-runtime"], targetLevel: 3, caseId: null, slider: 4, intentId: "i2" },
    { key: "g2", position: 1, type: "text", originalText: "improve the soft skills", outcome: "Better soft skills.", skillIds: ["ss-spoken-english"], targetLevel: 3, caseId: null, slider: 3, intentId: "i3" },
  ]);
}

const catalog = {
  tracks: [{ id: "frontend", departmentId: "engineering", name: "Frontend" }],
  departments: [{ id: "engineering", name: "Engineering", assessmentFormat: "coding" }],
} as unknown as Pick<Catalog, "tracks" | "departments">;

describe("the plan card", () => {
  test("the title uses the first name, never a pronoun", () => {
    expect(planTitle("Rahul Verma")).toBe("Here's the plan for Rahul");
    expect(planTitle("  ")).toBe("Here's the plan");
  });

  test("what they do now: role and years", () => {
    expect(currentRoleLine(state(), catalog)).toBe("Frontend engineer · about 1 year");
  });

  test("what you want: most important first, one line per intent", () => {
    expect(wantedItems(state()).map((w) => [w.statement, w.slider])).toEqual([
      ["Become a full-stack developer", 4],
      ["Better soft skills, including spoken English", 3],
    ]);
  });

  test("the drop-down sets the goals' priority and changes what the preview reads", () => {
    const s = state();
    const soft = wantedItems(s)[1]!;
    const next = setWantedPriority(s, soft, "most");
    expect(next.goals.find((g) => g.key === "g2")!.slider).toBe(5);
    expect(next.intents!.find((i) => i.id === "i3")!.slider).toBe(5);
    expect(next.priorities.find((p) => p.skillId === "ss-spoken-english")!.slider).toBe(5);
    expect(previewKey(next)).not.toBe(previewKey(s));
    expect(wantedItems(next)[0]!.key).toBe("i3");
    expect(setWantedPriority(s, soft, "nice").goals.find((g) => g.key === "g2")!.slider).toBe(2);
    expect(setWantedPriority(s, soft, "important").goals.find((g) => g.key === "g2")!.slider).toBe(3);
  });
});

describe("the Suggest steps", () => {
  test("tick in order", () => {
    expect(stepStates(4, 0)).toEqual(["working", "waiting", "waiting", "waiting"]);
    expect(stepStates(4, 2)).toEqual(["done", "done", "working", "waiting"]);
    expect(stepStates(4, 4)).toEqual(["done", "done", "done", "done"]);
  });

  test("show the time only after 10 seconds", () => {
    expect(elapsedLabel(9_999)).toBeNull();
    expect(elapsedLabel(12_400)).toBe("Still working: 12 seconds so far");
    expect(elapsedLabel(75_000)).toBe("Still working: 1 min 15 s so far");
  });
});
