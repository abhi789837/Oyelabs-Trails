import { describe, expect, test } from "vitest";

import { taskSchema, type FormTask } from "../../../shared/tasks";
import { MockProvider } from "../ai/adapters/mock";
import type { GenerateJsonRequest, GenerateJsonResult } from "../ai/types";
import { createTestApp } from "../test/harness";
import { gradeForm } from "./evaluateV4";

/** Answers the rubric call with fixed criterion scores, and records what the grader was sent. */
class ScriptedProvider extends MockProvider {
  rubricCalls: GenerateJsonRequest<unknown>[] = [];
  constructor(private readonly scores: Record<string, number>) {
    super();
  }
  override async generateJson<T>(request: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>> {
    if (request.schemaName !== "rubric_grade") return super.generateJson(request);
    this.rubricCalls.push(request as GenerateJsonRequest<unknown>);
    const data = { criteria: Object.entries(this.scores).map(([id, score]) => ({ id, score })), feedback: "Name the owner of the blocker." };
    return { data: request.schema.parse(data), usage: { input: 300, output: 60 }, latencyMs: 1, model: "claude-haiku-4-5-20251001" };
  }
}

const form = taskSchema.parse({
  kind: "form",
  variant: "status",
  prompt: "Write this week's status from the board export.",
  context: "| Item | Status |\n|---|---|\n| Login | Done |\n| Payments | Blocked |",
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
    { label: "Names the blocker and its owner", points: 2, description: "Payments, blocked on gateway keys from the client." },
    { label: "Clear next step", points: 2 },
  ],
  sampleAnswer: { rag: "Amber", done: "1", summary: "Login shipped. Payments blocked on gateway keys (client, Friday)." },
}) as FormTask;

const meta = { subjectUserId: "u1", assessmentId: "a1" };

describe("gradeForm", () => {
  test("weights the code checks by count and the rubric by its points", async () => {
    // r1 full marks (3/3 × 2 pts), r2 1/3 × 2 pts → rubric 8/12 = 0.667. Checks: 1 of 2 right.
    const provider = new ScriptedProvider({ r1: 3, r2: 1 });
    const ctx = await createTestApp({}, { provider });
    const graded = await gradeForm(ctx.ai, form, { rag: "Amber", done: "3", summary: "Payments blocked." }, meta);
    expect(graded).not.toBeNull();
    expect(graded!.checkScore).toBe(0.5);
    expect(graded!.rubricScore).toBe(0.667);
    // weight = 2 / (2 + 4) → 1/3 × 0.5 + 2/3 × 0.667 = 0.611
    expect(graded!.score).toBe(0.611);
    expect(graded!.lines).toContain("Items done: expected 1");
    expect(graded!.feedback).toMatch(/owner/);
    // Same AI task as written grading, with the checked fields marked and the rubric in it.
    expect(provider.rubricCalls).toHaveLength(1);
    expect(provider.rubricCalls[0].task).toBe("grade_written");
    expect(provider.rubricCalls[0].user).toMatch(/RAG status \[checked\]: Amber/);
    expect(provider.rubricCalls[0].user).toMatch(/r1 \(Names the blocker and its owner, 2 points\)/);
    await ctx.close();
  }, 60_000);

  test("a blank form scores 0 without a model call", async () => {
    const provider = new ScriptedProvider({ r1: 3, r2: 3 });
    const ctx = await createTestApp({}, { provider });
    const graded = await gradeForm(ctx.ai, form, { rag: "", summary: "  " }, meta);
    expect(graded?.score).toBe(0);
    expect(provider.rubricCalls).toHaveLength(0);
    await ctx.close();
  }, 60_000);

  test("without an AI credential it returns null, like a written answer (left for a person)", async () => {
    const ctx = await createTestApp({}, { noAi: true });
    expect(await gradeForm(ctx.ai, form, { rag: "Amber" }, meta)).toBeNull();
    await ctx.close();
  }, 60_000);
});
