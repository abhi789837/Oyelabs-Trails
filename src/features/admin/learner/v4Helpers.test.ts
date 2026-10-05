import { describe, expect, it } from "vitest";

import type { LearnerTask, Task } from "@shared/tasks";

import {
  assessmentHeadline,
  canReplace,
  describeFeedback,
  describeShortfalls,
  expectedTaskAnswer,
  formatItemScore,
  personalisationCounts,
  summariseTaskResponse,
  type PersonaliseReport,
} from "./v4Helpers";

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

describe("v4.1 admin lines", () => {
  it("reads like the header the admin scans", () => {
    expect(assessmentHeadline({ status: "ready", items: 25, estSeconds: 29 * 60, costMicros: 31_000 })).toBe(
      "Assessment ready · 25 items · est. 29 min · AI cost $0.03",
    );
    expect(assessmentHeadline({ status: "generating", items: 0, estSeconds: 0, costMicros: 0 })).toBe("Writing the assessment…");
    expect(assessmentHeadline({ status: "completed", items: 1, estSeconds: 0, costMicros: undefined })).toBe("Completed · 1 item");
  });

  it("counts reuse and fallbacks", () => {
    const report: PersonaliseReport = {
      level: "balanced",
      understandingSource: "ai",
      intent: [],
      themes: [],
      reused: 10,
      generated: 13,
      fromBankAfterFailures: 2,
      regenerations: 1,
      rejected: [],
      estSeconds: 1740,
      fallbackReason: null,
      costMicros: 30_000,
    };
    expect(personalisationCounts(report)).toBe("13 written for them · 10 reused from the library · 2 from the library after failed checks");
    expect(personalisationCounts({ ...report, fromBankAfterFailures: 0 })).toBe("13 written for them · 10 reused from the library");
  });

  it("offers Swap and Regenerate only on open questions of an open sheet", () => {
    expect(canReplace("ready", { state: "unanswered" })).toBe(true);
    expect(canReplace("in_progress", { state: "answered" })).toBe(true);
    expect(canReplace("in_progress", { state: "submitted" })).toBe(false);
    expect(canReplace("completed", { state: "unanswered" })).toBe(false);
  });
});
