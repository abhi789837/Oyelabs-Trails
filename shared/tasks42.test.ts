import { describe, expect, test } from "vitest";

import { checkTask, combineFormScore, formCheckWeight, gradeTask, taskResponseSchema, taskSchema, toLearnerTask, type CategorizeTask, type FormTask, type RoleplayTask } from "./tasks";
import { estimateSeconds, sizeProblems } from "./timing";

const classify = taskSchema.parse({
  kind: "categorize",
  prompt: "Classify each client request.",
  mode: "classify-request",
  categories: [
    { id: "bug-warranty", label: "Bug under warranty" },
    { id: "change-request", label: "Change request" },
    { id: "clarification", label: "Clarification" },
  ],
  items: [
    { id: "a", text: "Checkout crashes since launch last week.", explanation: "Live, in scope, in warranty." },
    { id: "b", text: "Make the login use OTP instead of passwords.", explanation: "Changes agreed behaviour." },
    { id: "c", text: "Why does the report show yesterday's data?", explanation: "Works as agreed." },
    { id: "d", text: "Add a second currency to invoices.", explanation: "Changes agreed behaviour." },
  ],
  answer: { a: "bug-warranty", b: "change-request", c: "clarification", d: "change-request" },
}) as CategorizeTask;

const form = taskSchema.parse({
  kind: "form",
  variant: "status",
  prompt: "Write this week's status from the board export.",
  context: "| Item | Status |\n|---|---|\n| Login | Done |\n| Payments | Blocked |",
  templateId: "status-report",
  fields: [
    { id: "rag", label: "RAG status", input: "select", options: ["Red", "Amber", "Green"], required: true },
    { id: "done", label: "Items done", input: "number", required: true },
    { id: "summary", label: "Summary", input: "textarea", required: true },
  ],
  checks: [
    { fieldId: "rag", expected: "Amber" },
    { fieldId: "done", expected: 1 },
  ],
  rubric: [
    { label: "Names the blocker and its owner", points: 2 },
    { label: "Clear next step", points: 2 },
  ],
  sampleAnswer: { rag: "Amber", done: "1", summary: "Login shipped. Payments blocked on the gateway keys (client, Friday)." },
}) as FormTask;

const roleplay = taskSchema.parse({
  kind: "roleplay",
  scenarioId: "delayed-release",
  personaId: "anxious-founder",
  maxTurns: 3,
  brief: "Tell the client the release slips a week and agree a new date.",
  rubric: [
    { label: "Empathy", points: 2 },
    { label: "Clear next step", points: 2 },
  ],
}) as RoleplayTask;

describe("categorize", () => {
  test("scores the share in the right category and explains the misses", () => {
    expect(gradeTask(classify, { kind: "categorize", picks: { a: "bug-warranty", b: "change-request", c: "clarification", d: "change-request" } }).score).toBe(1);
    const half = gradeTask(classify, { kind: "categorize", picks: { a: "bug-warranty", b: "clarification", c: "clarification" } });
    expect(half.score).toBe(0.5);
    expect(half.detail[1]).toMatch(/Change request \(you chose Clarification\)/);
    expect(half.detail[3]).toMatch(/no pick/);
    expect(gradeTask(classify, { kind: "categorize", picks: {} }).score).toBe(0);
  });

  test("toLearnerTask strips the answer and the explanations", () => {
    const learner = toLearnerTask(classify);
    expect(JSON.stringify(learner)).not.toMatch(/answer|explanation|in warranty/);
    expect(learner.kind === "categorize" && learner.items).toHaveLength(4);
  });

  test("checkTask: answers must name real items and categories, and classify-request uses decision-tool ids", () => {
    expect(checkTask(classify)).toEqual([]);
    expect(checkTask({ ...classify, answer: { ...classify.answer, a: "nope" } })).toContain("categorize: a answers an unknown category nope");
    const { d: _d, ...missing } = classify.answer;
    void _d;
    expect(checkTask({ ...classify, answer: missing })).toContain("categorize: no answer for d");
    expect(checkTask({ ...classify, categories: [...classify.categories, { id: "urgent", label: "Urgent" }] })).toContain("categorize: urgent is not a decision-tool classification");
    expect(checkTask({ ...classify, mode: "gap-analysis" }).some((p) => /gap-analysis/.test(p))).toBe(true);
    expect(checkTask({ ...classify, answer: { a: "clarification", b: "clarification", c: "clarification", d: "clarification" } })).toContain("categorize: every item is in the same category");
  });
});

describe("form", () => {
  test("checks are graded by code; the overall score waits for the rubric", () => {
    const right = gradeTask(form, { kind: "form", values: { rag: "amber", done: " 1 ", summary: "x" } });
    expect(right.score).toBeNull();
    expect(right.checks).toEqual({ score: 1, weight: 0.333 });
    const wrong = gradeTask(form, { kind: "form", values: { rag: "Red", done: "1" } });
    expect(wrong.checks?.score).toBe(0.5);
    expect(wrong.detail).toContain("RAG status: expected Amber");
    expect(gradeTask(form, null).score).toBe(0);
  });

  test("mixed weighting: checks.length / (checks.length + rubric points)", () => {
    expect(formCheckWeight(form)).toBeCloseTo(2 / 6);
    expect(combineFormScore(form, 1, 0)).toBe(0.333);
    expect(combineFormScore(form, 0.5, 1)).toBe(0.833);
    expect(combineFormScore({ ...form, checks: [] }, null, 0.75)).toBe(0.75);
  });

  test("toLearnerTask strips the expected values and the sample answer", () => {
    const learner = toLearnerTask(form);
    expect(learner.kind).toBe("form");
    expect(JSON.stringify(learner)).not.toMatch(/sampleAnswer|expected|gateway keys/);
    expect(learner.kind === "form" && learner.checks).toEqual([{ fieldId: "rag" }, { fieldId: "done" }]);
  });

  test("checkTask: checks on real fields, a sample that passes them, select answers among the options", () => {
    expect(checkTask(form)).toEqual([]);
    expect(checkTask({ ...form, checks: [{ fieldId: "ghost", expected: "x" }] })).toContain("form: check on unknown field ghost");
    expect(checkTask({ ...form, sampleAnswer: { ...form.sampleAnswer, rag: "Red" } }).some((p) => /sample answer fails/.test(p))).toBe(true);
    expect(checkTask({ ...form, checks: [{ fieldId: "rag", expected: "Purple" }] })).toContain("form: rag expects an answer that is not an option");
    expect(checkTask({ ...form, checks: [{ fieldId: "summary", expected: "x" }] }).some((p) => /free text/.test(p))).toBe(true);
    expect(checkTask({ ...form, sampleAnswer: { rag: "Amber", done: "1" } })).toContain("form: no sample answer for summary");
  });
});

describe("roleplay", () => {
  test("schema and response only: graded by the model", () => {
    expect(gradeTask(roleplay, { kind: "roleplay", sessionId: "s1", transcript: [{ role: "pm", text: "Hi" }] }).score).toBeNull();
    expect(taskResponseSchema.safeParse({ kind: "roleplay", sessionId: "s", transcript: [{ role: "bot", text: "x" }] }).success).toBe(false);
    expect(toLearnerTask(roleplay)).toMatchObject({ kind: "roleplay", brief: roleplay.brief, rubric: [{ label: "Empathy", points: 2 }, { label: "Clear next step", points: 2 }] });
    expect(taskSchema.safeParse({ ...roleplay, maxTurns: 9 }).success).toBe(false);
  });
});

describe("timing", () => {
  const item = (task: unknown) => ({ type: "task" as const, prompt: "Short prompt.", coding: null, mcq: null, task: task as never });

  test("categorize ~8 s per item, form ~20 s per field, roleplay ~25 s per turn", () => {
    const four = estimateSeconds(item(classify));
    const two = estimateSeconds(item({ ...classify, items: classify.items.slice(0, 2) }));
    expect(four - two).toBeGreaterThanOrEqual(16);
    const fields3 = estimateSeconds(item(form));
    const fields2 = estimateSeconds(item({ ...form, fields: form.fields.slice(0, 2) }));
    expect(fields3 - fields2).toBeGreaterThanOrEqual(20);
    expect(estimateSeconds(item({ ...roleplay, maxTurns: 3 })) - estimateSeconds(item({ ...roleplay, maxTurns: 2 }))).toBe(25);
  });

  test("size limits per kind", () => {
    const many = { ...classify, items: Array.from({ length: 7 }, (_, i) => ({ id: `i${i}`, text: "A request.", explanation: "" })) };
    expect(sizeProblems(item(many)).some((p) => /categorises 7/.test(p))).toBe(true);
    expect(sizeProblems(item({ ...form, fields: [...form.fields, { id: "x", label: "X", input: "text", required: false }] })).some((p) => /4 fields/.test(p))).toBe(true);
    expect(sizeProblems(item({ ...form, context: "word ".repeat(120) })).some((p) => /context is 120 words/.test(p))).toBe(true);
    expect(sizeProblems(item({ ...roleplay, maxTurns: 5 })).some((p) => /5 turns/.test(p))).toBe(true);
    expect(sizeProblems(item(form))).toEqual([]);
  });
});
