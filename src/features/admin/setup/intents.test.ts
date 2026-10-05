import { describe, expect, test } from "vitest";

import type { OnboardSuggestion } from "@shared/goals";

import { answerUnsure, intentsCurrent, openUnsure, toSaveRequest } from "./helpers";
import { stateFromSuggestion } from "./suggestion";

const LINE = "frontend engineer with 1 year of experience, and also learn quantum basket weaving";

const suggestion: OnboardSuggestion = {
  departmentId: "engineering",
  trackId: "frontend",
  stackIds: [],
  experienceBand: "1-2",
  level: 2,
  hoursPerWeek: 15,
  deadlineWeeks: 8,
  goals: [],
  extras: [],
  source: "rules",
  intents: [{ id: "i1", phrase: "frontend engineer with 1 year of experience", type: "current_role", statement: "Frontend, 1–2 years", skillIds: ["eng-html"], targetLevel: 2, slider: 0, trackId: "frontend", years: 1 }],
  unsure: [
    {
      phrase: "learn quantum basket weaving",
      options: [
        { label: "Unit testing", skillIds: ["eng-unit-testing"] },
        { label: "Leave it out", skillIds: [], leaveOut: true },
      ],
    },
  ],
};

describe("intents on the Setup state (v4.4)", () => {
  test("a suggestion with an open question blocks Save, and the request carries it", () => {
    const state = stateFromSuggestion(suggestion, LINE, "engineering");
    expect(state.advanced.deadlineWeeks).toBe(8);
    expect(openUnsure(state)).toBe(1);
    const body = toSaveRequest(state, true);
    expect(body.intents).toHaveLength(1);
    expect(body.unsure).toHaveLength(1);
  });

  test("picking an option answers it: a new intent and a goal that quotes the phrase", () => {
    const state = answerUnsure(stateFromSuggestion(suggestion, LINE, "engineering"), 0, suggestion.unsure[0]!.options[0]!);
    expect(openUnsure(state)).toBe(0);
    expect(state.intents?.map((i) => i.id)).toEqual(["i1", "i2"]);
    expect(state.goals).toHaveLength(1);
    expect(state.goals[0]).toMatchObject({ type: "text", originalText: "learn quantum basket weaving", skillIds: ["eng-unit-testing"], intentId: "i2" });
    expect(toSaveRequest(state, false).goals?.[0]?.intentId).toBe("i2");
  });

  test("Leave it out answers it without a goal", () => {
    const state = answerUnsure(stateFromSuggestion(suggestion, LINE, "engineering"), 0, suggestion.unsure[0]!.options[1]!);
    expect(openUnsure(state)).toBe(0);
    expect(state.goals).toHaveLength(0);
    expect(state.intents?.at(-1)?.status).toBe("left_out");
  });

  test("editing the description sets the intents aside: nothing blocks and none are sent", () => {
    const state = { ...stateFromSuggestion(suggestion, LINE, "engineering"), description: "something else entirely" };
    expect(intentsCurrent(state)).toBe(false);
    expect(openUnsure(state)).toBe(0);
    expect(toSaveRequest(state, false).intents).toBeUndefined();
  });
});
