import { z } from "zod";

/**
 * Hands-on task types for the departments that do not write code (v4 Phase 7).
 *
 * They take the place of coding problems in PM/BD assessments (18 hands-on + 7 MCQ) and of the code
 * challenge in course practice. Four of the five are graded by code; only `write` needs a model,
 * and only for its rubric (Haiku, short JSON). `spot` uses a model only for the optional one-line
 * explanation, never for the score of the spans.
 *
 * Each schema is the *full* task, answers included. `toLearnerTask` strips the answers for an
 * assessment; course practice is formative and shows them after a check.
 */

export const TASK_KINDS = ["write", "rank", "calculate", "scenario", "spot"] as const;
export const taskKindSchema = z.enum(TASK_KINDS);
export type TaskKind = z.infer<typeof taskKindSchema>;

export const TASK_KIND_LABELS: Record<TaskKind, string> = {
  write: "Write",
  rank: "Rank",
  calculate: "Calculate",
  scenario: "Scenario",
  spot: "Spot the issue",
};

const text = (max: number) => z.string().trim().min(1).max(max);

export const rubricCriterionSchema = z.object({
  id: text(40),
  label: text(80),
  /** What a full-marks answer does for this criterion. Shown to the grader, not the learner. */
  description: text(400),
  weight: z.number().min(0.5).max(3).default(1),
});
export type RubricCriterion = z.infer<typeof rubricCriterionSchema>;

export const writeTaskSchema = z.object({
  kind: z.literal("write"),
  prompt: text(1500),
  /** Optional context the learner is responding to: a client email, a ticket, a call transcript. */
  context: z.string().max(3000).default(""),
  wordLimit: z.number().int().min(20).max(600),
  rubric: z.array(rubricCriterionSchema).min(2).max(6),
  /** A strong answer, for practice feedback and for calibrating the grader. */
  sampleAnswer: z.string().max(4000).default(""),
});

export const rankTaskSchema = z.object({
  kind: z.literal("rank"),
  prompt: text(1500),
  items: z.array(z.object({ id: text(40), label: text(240) })).min(3).max(8),
  /** Item ids, first = top. */
  correctOrder: z.array(text(40)).min(3).max(8),
  explanation: z.string().max(1500).default(""),
});

export const calculateFieldSchema = z.object({
  id: text(40),
  label: text(120),
  unit: z.string().max(16).default(""),
  answer: z.number(),
  /** Absolute tolerance. Ratios like CPI use 0.01; money uses 1. */
  tolerance: z.number().min(0).default(0.01),
});

export const calculateTaskSchema = z.object({
  kind: z.literal("calculate"),
  prompt: text(1500),
  /** Data the learner calculates from, rendered as a table. */
  table: z
    .object({ columns: z.array(text(60)).min(1).max(8), rows: z.array(z.array(z.string().max(80))).min(1).max(20) })
    .nullable()
    .default(null),
  fields: z.array(calculateFieldSchema).min(1).max(5),
  explanation: z.string().max(1500).default(""),
});

export const scenarioTaskSchema = z.object({
  kind: z.literal("scenario"),
  prompt: text(2500),
  /** 2–3 linked decisions. Each later step assumes the case so far, not the learner's earlier pick. */
  steps: z
    .array(
      z.object({
        id: text(40),
        question: text(600),
        options: z.array(text(300)).min(3).max(5),
        correctIndex: z.number().int().min(0),
        explanation: z.string().max(800).default(""),
      }),
    )
    .min(2)
    .max(3),
});

export const spotTaskSchema = z.object({
  kind: z.literal("spot"),
  prompt: text(800),
  /**
   * The flawed document split into segments (sentences or lines). The learner marks segments; a
   * segment is the unit of grading, so the answer never depends on exact character offsets.
   */
  segments: z.array(z.object({ id: text(40), text: text(600), issue: z.string().max(300).nullable().default(null) })).min(4).max(30),
  /** Ask for a one-line explanation of the most serious issue. Graded by a short model check. */
  askExplanation: z.boolean().default(false),
});

export const taskSchema = z.discriminatedUnion("kind", [writeTaskSchema, rankTaskSchema, calculateTaskSchema, scenarioTaskSchema, spotTaskSchema]);
export type Task = z.infer<typeof taskSchema>;
export type WriteTask = z.infer<typeof writeTaskSchema>;
export type RankTask = z.infer<typeof rankTaskSchema>;
export type CalculateTask = z.infer<typeof calculateTaskSchema>;
export type ScenarioTask = z.infer<typeof scenarioTaskSchema>;
export type SpotTask = z.infer<typeof spotTaskSchema>;

// ---------------------------------------------------------------------------
// What the learner sees in an assessment (answers removed)
// ---------------------------------------------------------------------------

export type LearnerTask =
  | Omit<WriteTask, "rubric" | "sampleAnswer"> & { rubric: { label: string }[] }
  | Omit<RankTask, "correctOrder" | "explanation">
  | (Omit<CalculateTask, "fields" | "explanation"> & { fields: { id: string; label: string; unit: string }[] })
  | (Omit<ScenarioTask, "steps"> & { steps: { id: string; question: string; options: string[] }[] })
  | (Omit<SpotTask, "segments"> & { segments: { id: string; text: string }[] });

/** Deterministic shuffle so a rank task never starts in its answer order. */
function rotate<T>(items: readonly T[], seed: number): T[] {
  if (items.length < 2) return [...items];
  const k = (seed % (items.length - 1)) + 1;
  return [...items.slice(k), ...items.slice(0, k)];
}

export function toLearnerTask(task: Task, seed = 1): LearnerTask {
  switch (task.kind) {
    case "write":
      return { kind: "write", prompt: task.prompt, context: task.context, wordLimit: task.wordLimit, rubric: task.rubric.map((c) => ({ label: c.label })) };
    case "rank":
      return { kind: "rank", prompt: task.prompt, items: rotate(task.items, seed) };
    case "calculate":
      return { kind: "calculate", prompt: task.prompt, table: task.table, fields: task.fields.map((f) => ({ id: f.id, label: f.label, unit: f.unit })) };
    case "scenario":
      return { kind: "scenario", prompt: task.prompt, steps: task.steps.map((s) => ({ id: s.id, question: s.question, options: s.options })) };
    case "spot":
      return { kind: "spot", prompt: task.prompt, askExplanation: task.askExplanation, segments: task.segments.map((s) => ({ id: s.id, text: s.text })) };
  }
}

// ---------------------------------------------------------------------------
// Responses and code grading
// ---------------------------------------------------------------------------

export const taskResponseSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("write"), text: z.string().max(8000) }),
  z.object({ kind: z.literal("rank"), order: z.array(z.string().max(40)).max(8) }),
  z.object({ kind: z.literal("calculate"), values: z.record(z.string(), z.number().nullable()) }),
  z.object({ kind: z.literal("scenario"), choices: z.record(z.string(), z.number().int().min(0).max(10)) }),
  z.object({ kind: z.literal("spot"), marked: z.array(z.string().max(40)).max(30), explanation: z.string().max(600).default("") }),
]);
export type TaskResponse = z.infer<typeof taskResponseSchema>;

export interface TaskGrade {
  /** 0..1. Null for a `write` task, whose score comes from the rubric grader. */
  score: number | null;
  /** Per-part detail for the result screen. */
  detail: string[];
}

export function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

/**
 * Grades everything that can be graded by code.
 *
 * - rank: the share of items in exactly the right place, plus half credit for one place off. A
 *   learner who swaps two neighbours gets most of the marks, which matches how wrong that is.
 * - calculate: each field right within tolerance; the score is the share right.
 * - scenario: each step right; share right.
 * - spot: precision and recall over the flawed segments, as F1. Marking everything scores poorly,
 *   which is the point: "find the issues" is not "highlight the document".
 */
export function gradeTask(task: Task, response: TaskResponse | null): TaskGrade {
  if (!response || response.kind !== task.kind) return { score: task.kind === "write" ? null : 0, detail: ["No answer"] };
  switch (task.kind) {
    case "write":
      return { score: null, detail: [] };
    case "rank": {
      const order = (response as Extract<TaskResponse, { kind: "rank" }>).order;
      let points = 0;
      const detail: string[] = [];
      task.correctOrder.forEach((id, index) => {
        const at = order.indexOf(id);
        if (at === index) points += 1;
        else if (at >= 0 && Math.abs(at - index) === 1) points += 0.5;
        const label = task.items.find((item) => item.id === id)?.label ?? id;
        detail.push(`${index + 1}. ${label}${at === index ? "" : at >= 0 ? ` (you put it ${at + 1})` : " (missing)"}`);
      });
      return { score: round(points / task.correctOrder.length), detail };
    }
    case "calculate": {
      const values = (response as Extract<TaskResponse, { kind: "calculate" }>).values;
      let right = 0;
      const detail = task.fields.map((field) => {
        const value = values[field.id];
        const ok = typeof value === "number" && Number.isFinite(value) && Math.abs(value - field.answer) <= field.tolerance + 1e-9;
        if (ok) right += 1;
        return `${field.label}: ${ok ? "correct" : `expected ${field.answer}${field.unit ? ` ${field.unit}` : ""}`}`;
      });
      return { score: round(right / task.fields.length), detail };
    }
    case "scenario": {
      const choices = (response as Extract<TaskResponse, { kind: "scenario" }>).choices;
      let right = 0;
      const detail = task.steps.map((step, index) => {
        const ok = choices[step.id] === step.correctIndex;
        if (ok) right += 1;
        return `Decision ${index + 1}: ${ok ? "correct" : step.explanation || "not the best call"}`;
      });
      return { score: round(right / task.steps.length), detail };
    }
    case "spot": {
      const marked = new Set((response as Extract<TaskResponse, { kind: "spot" }>).marked);
      const issues = task.segments.filter((s) => s.issue);
      const found = issues.filter((s) => marked.has(s.id)).length;
      const falsePositives = [...marked].filter((id) => !issues.some((s) => s.id === id)).length;
      const precision = marked.size ? found / (found + falsePositives) : 0;
      const recall = issues.length ? found / issues.length : 1;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
      return {
        score: round(f1),
        detail: [`Found ${found} of ${issues.length} issues`, ...(falsePositives ? [`${falsePositives} marked that were fine`] : [])],
      };
    }
  }
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Validation beyond the schema: answers must refer to things that exist. Returns problems. */
export function checkTask(task: Task): string[] {
  const problems: string[] = [];
  if (task.kind === "rank") {
    const ids = task.items.map((i) => i.id);
    if (new Set(ids).size !== ids.length) problems.push("rank: duplicate item ids");
    if (task.correctOrder.length !== ids.length || !task.correctOrder.every((id) => ids.includes(id))) problems.push("rank: correctOrder must list every item once");
  }
  if (task.kind === "scenario") {
    task.steps.forEach((step) => {
      if (step.correctIndex >= step.options.length) problems.push(`scenario: step ${step.id} correctIndex out of range`);
    });
  }
  if (task.kind === "spot") {
    const issues = task.segments.filter((s) => s.issue).length;
    if (issues < 1) problems.push("spot: needs at least one flawed segment");
    if (issues > task.segments.length / 2) problems.push("spot: more than half the segments are flawed");
  }
  if (task.kind === "calculate" && new Set(task.fields.map((f) => f.id)).size !== task.fields.length) problems.push("calculate: duplicate field ids");
  return problems;
}
