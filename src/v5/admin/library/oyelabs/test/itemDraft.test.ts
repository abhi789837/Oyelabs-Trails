import { describe, expect, test } from "vitest";

import { moduleTestItemInputSchema } from "@shared/moduleTests";

import { draftProblems, draftToInput, emptyDraft } from "./itemDraft";

describe("module test item draft", () => {
  test("an empty draft says what to fill in", () => {
    expect(draftProblems(emptyDraft())).toEqual({ prompt: expect.any(String), options: "Write at least 3 answers.", correct: "Tick the right answer." });
  });

  test("empty answer boxes are dropped and the ticks follow their answers", () => {
    const draft = { kind: "scenario" as const, prompt: "A client asks for a new screen mid-sprint. What do you do?", options: ["Start it now", "", "Write a change request", "Ignore it"], correct: [2], explanation: "" };
    expect(draftProblems(draft)).toEqual({});
    const input = draftToInput(draft);
    expect(input.options).toEqual(["Start it now", "Write a change request", "Ignore it"]);
    expect(input.correctIndices).toEqual([1]);
    expect(moduleTestItemInputSchema.safeParse(input).success).toBe(true);
  });

  test("every answer ticked, or two the same, is refused", () => {
    expect(draftProblems({ ...emptyDraft(), prompt: "Which of these is right?", options: ["A", "B", "C"], correct: [0, 1, 2] }).correct).toMatch(/wrong/);
    expect(draftProblems({ ...emptyDraft(), prompt: "Which of these is right?", options: ["A", "a", "C"], correct: [0] }).options).toMatch(/same/);
  });
});
