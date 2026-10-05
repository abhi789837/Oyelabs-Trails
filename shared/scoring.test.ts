import { describe, expect, test } from "vitest";

import { checkTask, gradeTask, taskSchema, type Task } from "./tasks";
import { looselyEqual, MET_THRESHOLD, parseLooseNumber, rankOrderAccepted, scoreFor, tierOf, verdictFor } from "./scoring";

describe("looselyEqual", () => {
  test.each([
    ["  hello   world \n", "hello world", true],
    ["a\tb\r\nc", "a b c", true],
    ["Hello", "hello", false],
    ["1,000", 1000, true],
    [1000, "1,000", true],
    ["2.50", 2.5, true],
    ["2.50", "2.5", true],
    ["Total: 2.50 USD", "Total: 2.5 USD", true],
    ["Total: 2.51 USD", "Total: 2.5 USD", false],
    ["1,5", 1.5, false],
    [0.1 + 0.2, 0.3, true],
    [1e-12, 0, true],
    [1, 1.0001, false],
    [true, "true", false],
    [null, 0, false],
    [null, null, true],
    [{ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 }, true],
    [[1, 2], [2, 1], false],
    [{ a: 1 }, { a: 1, b: undefined }, false],
    [[{ name: " Ada ", total: "1,200" }], [{ total: 1200, name: "Ada" }], true],
    ["", "   ", true],
  ])("looselyEqual(%j, %j) = %s", (a, b, expected) => {
    expect(looselyEqual(a, b)).toBe(expected);
  });

  test("parseLooseNumber reads common formats and refuses the rest", () => {
    expect(parseLooseNumber("-1,234.50")).toBe(-1234.5);
    expect(parseLooseNumber(".5")).toBe(0.5);
    expect(parseLooseNumber("1e3")).toBe(1000);
    expect(parseLooseNumber("12,34")).toBeNull();
    expect(parseLooseNumber("abc")).toBeNull();
    expect(parseLooseNumber("")).toBeNull();
  });
});

describe("verdictFor", () => {
  test("MCQ: correct is full, wrong is not yet", () => {
    expect(verdictFor({ kind: "mcq", correct: true })).toEqual({ full: true, score: 1 });
    expect(verdictFor({ kind: "mcq", correct: false })).toEqual({ full: false, score: 0 });
    expect(verdictFor({ kind: "unanswered" })).toEqual({ full: false, score: 0 });
  });

  test("code: all core tests pass gives full marks; a failed edge test is a note, not a deduction", () => {
    const v = verdictFor({
      kind: "code",
      outcomes: [
        { passed: true, tier: "core" },
        { passed: true, tier: "core" },
        { passed: false, tier: "edge", label: "an empty list" },
      ],
    })!;
    expect(v.full).toBe(true);
    expect(v.score).toBe(1);
    expect(v.note).toMatch(/edge case: an empty list/);
  });

  test("code: a failed core test, a compile error or no tests is not yet", () => {
    expect(verdictFor({ kind: "code", outcomes: [{ passed: false, tier: "core" }, { passed: true, tier: "edge" }] })!.full).toBe(false);
    expect(verdictFor({ kind: "code", outcomes: [{ passed: true, tier: "core" }], compileError: "SyntaxError" })!.full).toBe(false);
    expect(verdictFor({ kind: "code", outcomes: [] })!.full).toBe(false);
  });

  test("code: a key with only edge tests counts every test", () => {
    expect(verdictFor({ kind: "code", outcomes: [{ passed: true, tier: "edge" }, { passed: false, tier: "edge" }] })!.full).toBe(false);
    expect(verdictFor({ kind: "code", outcomes: [{ passed: true, tier: "edge" }] })!.full).toBe(true);
  });

  test("tierOf: bank `tier`, content `isEdgeCase`, untiered = core", () => {
    expect(tierOf({ args: [], expected: 1, tier: "edge" })).toBe("edge");
    expect(tierOf({ args: [], expected: 1, isEdgeCase: true })).toBe("edge");
    expect(tierOf({ args: [], expected: 1 })).toBe("core");
    expect(tierOf(null)).toBe("core");
  });

  const calc = taskSchema.parse({
    kind: "calculate",
    prompt: "Work out the totals.",
    table: { columns: ["a"], rows: [["1"]] },
    fields: [
      { id: "x", label: "X", answer: 10, tolerance: 0.5 },
      { id: "y", label: "Y", answer: 20, tolerance: 0 },
    ],
  } as unknown) as Task;

  test("calculate: every field within tolerance is full; one wrong field is not yet", () => {
    const right = { kind: "calculate" as const, values: { x: 10.4, y: 20 } };
    const half = { kind: "calculate" as const, values: { x: 10, y: 21 } };
    expect(verdictFor({ kind: "task", task: calc, response: right, raw: gradeTask(calc, right).score })!.full).toBe(true);
    expect(verdictFor({ kind: "task", task: calc, response: half, raw: gradeTask(calc, half).score })!.full).toBe(false);
  });

  test("AI-graded tasks follow the grader's met; a pending one has no verdict yet", () => {
    const write = { kind: "write" } as const;
    const answer = { kind: "write" as const, text: "Hi" };
    expect(verdictFor({ kind: "task", task: write, response: answer, raw: 0.55, met: true, tip: "Lead with the ask." })).toEqual({ full: true, score: 1, note: "Lead with the ask." });
    expect(verdictFor({ kind: "task", task: write, response: answer, raw: 0.9, met: false })!.full).toBe(false);
    expect(verdictFor({ kind: "task", task: write, response: answer, raw: null })).toBeNull();
    // Old rows without `met`: the normalised rubric score decides at 0.7.
    expect(verdictFor({ kind: "task", task: write, response: answer, raw: 0.72 })!.full).toBe(true);
    expect(verdictFor({ kind: "task", task: write, response: answer, raw: 0.6 })!.full).toBe(false);
    // A kind added later (speak) that reports `met` is handled the same way.
    expect(verdictFor({ kind: "task", task: { kind: "speak" }, response: { kind: "speak" }, raw: 0.4, met: true })!.full).toBe(true);
  });

  test("form: met, but the exact checks must hold too", () => {
    const form = { kind: "form" } as const;
    const answer = { kind: "form" as const, values: {} };
    expect(verdictFor({ kind: "task", task: form, response: answer, raw: 0.9, met: true, checkScore: 1 })!.full).toBe(true);
    expect(verdictFor({ kind: "task", task: form, response: answer, raw: 0.9, met: true, checkScore: 0.5 })!.full).toBe(false);
  });

  test("other deterministic kinds pass at MET_THRESHOLD", () => {
    const scenario = { kind: "scenario" } as const;
    const answer = { kind: "scenario" as const, choices: {} };
    expect(verdictFor({ kind: "task", task: scenario, response: answer, raw: MET_THRESHOLD })!.full).toBe(true);
    expect(verdictFor({ kind: "task", task: scenario, response: answer, raw: 0.79 })!.full).toBe(false);
  });
});

describe("rank acceptOrders", () => {
  const rank = taskSchema.parse({
    kind: "rank",
    prompt: "Order the release steps.",
    items: [
      { id: "a", label: "Freeze" },
      { id: "b", label: "Tag" },
      { id: "c", label: "Notes" },
      { id: "d", label: "Deploy" },
    ],
    correctOrder: ["a", "b", "c", "d"],
    // Tagging and writing notes are independent: either order is right.
    acceptOrders: [["a", "c", "b", "d"]],
  }) as Extract<Task, { kind: "rank" }>;

  test("the key's order and an accepted order both get full marks; others do not", () => {
    const exact = { kind: "rank" as const, order: ["a", "b", "c", "d"] };
    const alt = { kind: "rank" as const, order: ["a", "c", "b", "d"] };
    const wrong = { kind: "rank" as const, order: ["d", "c", "b", "a"] };
    for (const response of [exact, alt]) {
      expect(gradeTask(rank, response).score).toBe(1);
      expect(verdictFor({ kind: "task", task: rank, response, raw: gradeTask(rank, response).score })!.full).toBe(true);
    }
    expect(verdictFor({ kind: "task", task: rank, response: wrong, raw: gradeTask(rank, wrong).score })!.full).toBe(false);
    expect(rankOrderAccepted(rank, ["a", "b", "d", "c"])).toBe(false);
  });

  test("checkTask rejects an accepted order that is not a full permutation", () => {
    expect(checkTask(rank)).toEqual([]);
    expect(checkTask({ ...rank, acceptOrders: [["a", "b", "c", "x"]] })).toContain("rank: each accepted order must list every item once");
  });
});

describe("scoreFor", () => {
  test("full mode stores 0/1; partial mode keeps the fraction", () => {
    const v = verdictFor({ kind: "code", outcomes: [{ passed: true, tier: "core" }, { passed: false, tier: "edge" }] });
    expect(scoreFor("full", v, 0.5)).toBe(1);
    expect(scoreFor("partial", v, 0.5)).toBe(0.5);
    expect(scoreFor("full", null, null)).toBeNull();
  });
});
