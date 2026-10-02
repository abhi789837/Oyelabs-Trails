import { describe, expect, it } from "vitest";

import type { LearnerTask, Task } from "@shared/tasks";

import { describeFeedback, describeShortfalls, expectedTaskAnswer, formatItemScore, summariseTaskResponse } from "./v4Helpers";

describe("formatItemScore", () => {
  it("shows a percentage, rounded and clamped", () => {
    expect(formatItemScore(0.756, "submitted")).toBe("76%");
    expect(formatItemScore(0, "submitted")).toBe("0%");
    expect(formatItemScore(1.2, "submitted")).toBe("100%");
  });

  it("says pending for a submitted item with no grade, and not submitted otherwise", () => {
    expect(formatItemScore(null, "submitted")).toBe("pending");
    expect(formatItemScore(null, "answered")).toBe("not submitted");
  });
});

describe("describeFeedback", () => {
  it("is empty without feedback", () => {
    expect(describeFeedback(null)).toEqual([]);
    expect(describeFeedback("  ")).toEqual([]);
  });

  it("keeps rubric text as it is", () => {
    expect(describeFeedback("Clear and specific.")).toEqual(["Clear and specific."]);
  });

  it("reads the auto-grader's JSON", () => {
    expect(describeFeedback(JSON.stringify({ passed: 2, total: 5, compileError: null, timedOut: true }))).toEqual([
      "2 of 5 hidden tests passed.",
      "The run timed out.",
    ]);
    expect(describeFeedback(JSON.stringify({ unknown: true }))).toEqual(["Answered \"I don't know yet\"."]);
    expect(describeFeedback(JSON.stringify({ unknown: false }))).toEqual(["No answer was submitted."]);
    expect(describeFeedback(JSON.stringify({ lines: ["Step 1 right", "Step 2 wrong"] }))).toEqual(["Step 1 right", "Step 2 wrong"]);
  });

  it("falls back to the raw string for JSON it does not know", () => {
    expect(describeFeedback('{"other":1}')).toEqual(['{"other":1}']);
  });
});

describe("summariseTaskResponse", () => {
  const rank: LearnerTask = {
    kind: "rank",
    prompt: "Order these",
    items: [
      { id: "a", label: "Alpha" },
      { id: "b", label: "Beta" },
      { id: "c", label: "Gamma" },
    ],
  };

  it("counts words for a written answer", () => {
    const write = { kind: "write", prompt: "p", context: "", wordLimit: 100, rubric: [{ label: "x" }] } as LearnerTask;
    expect(summariseTaskResponse(write, { kind: "write", text: "one two  three" })).toEqual(["3 words written."]);
  });

  it("lists a ranking by label", () => {
    expect(summariseTaskResponse(rank, { kind: "rank", order: ["b", "a", "zz"] })).toEqual(["1. Beta", "2. Alpha", "3. zz"]);
  });

  it("shows blanks and units for a calculation", () => {
    const calc: LearnerTask = {
      kind: "calculate",
      prompt: "p",
      table: null,
      fields: [
        { id: "x", label: "CPI", unit: "" },
        { id: "y", label: "Cost", unit: "USD" },
      ],
    };
    expect(summariseTaskResponse(calc, { kind: "calculate", values: { y: 12 } })).toEqual(["CPI: blank", "Cost: 12 USD"]);
  });

  it("returns nothing when the response kind does not match the task", () => {
    expect(summariseTaskResponse(rank, { kind: "calculate", values: {} })).toEqual([]);
  });
});

describe("expectedTaskAnswer", () => {
  it("gives the correct order for a rank task", () => {
    const task: Task = {
      kind: "rank",
      prompt: "p",
      items: [
        { id: "a", label: "Alpha" },
        { id: "b", label: "Beta" },
        { id: "c", label: "Gamma" },
      ],
      correctOrder: ["c", "a", "b"],
      explanation: "",
    };
    expect(expectedTaskAnswer(task)).toEqual(["1. Gamma", "2. Alpha", "3. Beta"]);
  });
});

describe("describeShortfalls", () => {
  it("names skills the result knows and falls back to the id", () => {
    const result = { skills: [{ skillId: "aws", skillName: "AWS" }] } as never;
    expect(
      describeShortfalls(
        [
          { skillId: "aws", type: "coding", missing: 2 },
          { skillId: "k8s", type: "mcq", missing: 1 },
        ],
        result,
      ),
    ).toEqual(["AWS · coding · 2 missing", "k8s · mcq · 1 missing"]);
  });
});
