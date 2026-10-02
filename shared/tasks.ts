import { z } from "zod";

import { evaluateSheet, functionsIn, parseRef } from "./sheet";

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

export const TASK_KINDS = ["write", "rank", "calculate", "scenario", "spot", "excel", "allocate", "sim"] as const;
export const taskKindSchema = z.enum(TASK_KINDS);
export type TaskKind = z.infer<typeof taskKindSchema>;

export const TASK_KIND_LABELS: Record<TaskKind, string> = {
  write: "Write",
  rank: "Rank",
  calculate: "Calculate",
  scenario: "Scenario",
  spot: "Spot the issue",
  excel: "Spreadsheet",
  allocate: "Allocate people",
  sim: "Screen check",
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
  /**
   * v4.1: `email` (a client or internal email: structure, tone, a clear ask) or `explain` (a tech
   * term or dev update for a client: correct, simple, no jargon). Shapes the rubric grader's lens.
   */
  variant: z.enum(["general", "email", "explain"]).optional(),
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
  /**
   * v4.1: how the answer follows from the table, so it can be recomputed in code — arithmetic over
   * numbers and `T[row][col]` (0-based, data rows only), e.g. `T[0][2]*T[0][3] + T[1][2]*T[1][3]`.
   */
  expression: z.string().max(300).nullable().optional(),
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

const cellRefSchema = z.string().regex(/^[A-H](1[0-2]|[1-9])$/, "a cell like B3 (A–H, rows 1–12)");

/**
 * v4.1: a small spreadsheet. The learner fills the `editable` cells (values or formulas); checks
 * compare the evaluated values, and can require a formula or particular functions. `solution`
 * holds a correct entry per editable cell so the task can be validated before it is served.
 * RAG status is a formula that yields "Red" / "Amber" / "Green"; the grid colours those cells.
 */
export const excelTaskSchema = z.object({
  kind: z.literal("excel"),
  prompt: text(1500),
  grid: z.array(z.array(z.string().max(120)).max(8)).min(2).max(12),
  editable: z.array(cellRefSchema).min(1).max(10),
  checks: z
    .array(
      z.object({
        cell: cellRefSchema,
        expected: z.union([z.number(), z.string().max(40)]),
        tolerance: z.number().min(0).default(0.01),
        requireFormula: z.boolean().default(false),
        functions: z.array(z.string().max(20)).max(4).default([]),
      }),
    )
    .min(1)
    .max(10),
  solution: z.record(z.string(), z.string().max(200)),
  explanation: z.string().max(1500).default(""),
});

/** v4.1: give each person hours on each project without over-allocating anyone or under-staffing a project. */
export const allocateTaskSchema = z.object({
  kind: z.literal("allocate"),
  prompt: text(1500),
  people: z.array(z.object({ id: text(20), name: text(40), capacity: z.number().min(0).max(80), note: z.string().max(80).default("") })).min(2).max(6),
  projects: z.array(z.object({ id: text(20), name: text(60), need: z.number().min(0).max(200) })).min(1).max(4),
  /** Allowed over-staffing of a project, as a share of its need (0.1 = up to 10% over). */
  slack: z.number().min(0).max(0.5).default(0.1),
  /** Pairs that must stay at 0 (on leave, wrong skill). */
  blocked: z.array(z.object({ person: text(20), project: text(20) })).max(10).default([]),
  explanation: z.string().max(1500).default(""),
});

/**
 * v4.1: a simulated screen — a Keka timesheet approval list, Keka PSA allocation, a Teams meeting,
 * a GitHub pull request — with rows to flag and/or questions to answer. No real logins.
 */
export const simTaskSchema = z.object({
  kind: z.literal("sim"),
  app: z.enum(["keka-timesheets", "keka-psa", "teams", "github-pr", "outlook", "generic"]),
  prompt: text(1500),
  title: text(120),
  columns: z.array(text(40)).min(1).max(6),
  rows: z.array(z.object({ id: text(20), cells: z.array(z.string().max(120)).max(6), issue: z.string().max(200).nullable().default(null) })).max(12),
  questions: z
    .array(z.object({ id: text(20), question: text(300), options: z.array(text(160)).min(2).max(5), correctIndex: z.number().int().min(0), explanation: z.string().max(400).default("") }))
    .max(3)
    .default([]),
});

export const taskSchema = z.discriminatedUnion("kind", [writeTaskSchema, rankTaskSchema, calculateTaskSchema, scenarioTaskSchema, spotTaskSchema, excelTaskSchema, allocateTaskSchema, simTaskSchema]);
export type Task = z.infer<typeof taskSchema>;
export type WriteTask = z.infer<typeof writeTaskSchema>;
export type RankTask = z.infer<typeof rankTaskSchema>;
export type CalculateTask = z.infer<typeof calculateTaskSchema>;
export type ScenarioTask = z.infer<typeof scenarioTaskSchema>;
export type SpotTask = z.infer<typeof spotTaskSchema>;
export type ExcelTask = z.infer<typeof excelTaskSchema>;
export type AllocateTask = z.infer<typeof allocateTaskSchema>;
export type SimTask = z.infer<typeof simTaskSchema>;

// ---------------------------------------------------------------------------
// What the learner sees in an assessment (answers removed)
// ---------------------------------------------------------------------------

export type LearnerTask =
  | Omit<WriteTask, "rubric" | "sampleAnswer"> & { rubric: { label: string }[] }
  | Omit<RankTask, "correctOrder" | "explanation">
  | (Omit<CalculateTask, "fields" | "explanation"> & { fields: { id: string; label: string; unit: string }[] })
  | (Omit<ScenarioTask, "steps"> & { steps: { id: string; question: string; options: string[] }[] })
  | (Omit<SpotTask, "segments"> & { segments: { id: string; text: string }[] })
  | (Omit<ExcelTask, "checks" | "solution" | "explanation"> & { checks: { cell: string }[] })
  | Omit<AllocateTask, "explanation">
  | (Omit<SimTask, "rows" | "questions"> & { rows: { id: string; cells: string[] }[]; questions: { id: string; question: string; options: string[] }[] });

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
    case "excel":
      return { kind: "excel", prompt: task.prompt, grid: task.grid, editable: task.editable, checks: task.checks.map((c) => ({ cell: c.cell })) };
    case "allocate":
      return { kind: "allocate", prompt: task.prompt, people: task.people, projects: task.projects, slack: task.slack, blocked: task.blocked };
    case "sim":
      return {
        kind: "sim",
        app: task.app,
        prompt: task.prompt,
        title: task.title,
        columns: task.columns,
        rows: task.rows.map((r) => ({ id: r.id, cells: r.cells })),
        questions: task.questions.map((q) => ({ id: q.id, question: q.question, options: q.options })),
      };
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
  z.object({ kind: z.literal("excel"), cells: z.record(z.string().max(4), z.string().max(300)) }),
  z.object({ kind: z.literal("allocate"), hours: z.record(z.string().max(45), z.number().min(0).max(200)) }),
  z.object({ kind: z.literal("sim"), flagged: z.array(z.string().max(20)).max(12), answers: z.record(z.string().max(20), z.number().int().min(0).max(10)) }),
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
    case "excel":
      return gradeExcel(task, (response as Extract<TaskResponse, { kind: "excel" }>).cells);
    case "allocate":
      return gradeAllocate(task, (response as Extract<TaskResponse, { kind: "allocate" }>).hours);
    case "sim": {
      const r = response as Extract<TaskResponse, { kind: "sim" }>;
      const parts: number[] = [];
      const detail: string[] = [];
      const issues = task.rows.filter((row) => row.issue);
      if (issues.length) {
        const flagged = new Set(r.flagged);
        const found = issues.filter((row) => flagged.has(row.id)).length;
        const wrong = [...flagged].filter((id) => !issues.some((row) => row.id === id)).length;
        const precision = flagged.size ? found / (found + wrong) : 0;
        const recall = found / issues.length;
        parts.push(precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0);
        detail.push(`Flagged ${found} of ${issues.length} problem rows${wrong ? `, ${wrong} that were fine` : ""}`);
      }
      task.questions.forEach((q, i) => {
        const ok = r.answers[q.id] === q.correctIndex;
        parts.push(ok ? 1 : 0);
        detail.push(`Question ${i + 1}: ${ok ? "correct" : q.explanation || "not the best answer"}`);
      });
      return { score: parts.length ? round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0, detail };
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
  if (task.kind === "excel") {
    for (const ref of task.editable) if (!(ref in task.solution)) problems.push(`excel: no solution for ${ref}`);
    for (const check of task.checks) if (!task.editable.includes(check.cell) && !isFormulaCell(task.grid, check.cell)) problems.push(`excel: check ${check.cell} is neither editable nor a formula`);
    const solved = gradeExcel(task, task.solution);
    if (solved.score !== 1) problems.push(`excel: the solution fails its own checks (${solved.detail.filter((d) => !d.endsWith("correct")).join("; ").slice(0, 160)})`);
    if (gradeExcel(task, {}).score === 1) problems.push("excel: an empty answer already passes");
  }
  if (task.kind === "allocate") {
    const capacity = task.people.reduce((s, p) => s + p.capacity, 0);
    const need = task.projects.reduce((s, p) => s + p.need, 0);
    if (capacity < need) problems.push("allocate: the team cannot cover the projects");
    const ids = new Set(task.people.map((p) => p.id));
    if (task.blocked.some((b) => !ids.has(b.person) || !task.projects.some((p) => p.id === b.project))) problems.push("allocate: blocked pair refers to an unknown id");
  }
  if (task.kind === "sim") {
    if (task.rows.length === 0 && task.questions.length === 0) problems.push("sim: nothing to do");
    if (task.rows.some((r) => r.cells.length !== task.columns.length)) problems.push("sim: a row has the wrong number of cells");
    if (task.rows.filter((r) => r.issue).length > task.rows.length / 2) problems.push("sim: more than half the rows are flagged");
    task.questions.forEach((q) => {
      if (q.correctIndex >= q.options.length) problems.push(`sim: question ${q.id} correctIndex out of range`);
    });
  }
  if (task.kind === "calculate") {
    for (const field of task.fields) {
      if (!field.expression) continue;
      const value = evaluateExpression(field.expression, task.table?.rows ?? []);
      if (value === null) problems.push(`calculate: ${field.id} expression does not evaluate`);
      else if (Math.abs(value - field.answer) > field.tolerance + 1e-9) problems.push(`calculate: ${field.id} answer ${field.answer} but the table gives ${Math.round(value * 1000) / 1000}`);
    }
  }
  return problems;
}

/** A table cell as a number: "$1,200" → 1200, "85%" → 85. Null when it is not numeric. */
export function cellNumber(raw: string | undefined): number | null {
  if (raw == null) return null;
  const cleaned = raw.replace(/[$€£₹,%\s]/g, "");
  if (cleaned === "" || !/^-?\d*\.?\d+(e-?\d+)?$/i.test(cleaned)) return null;
  return Number(cleaned);
}

/**
 * Evaluates `+ - * / ( )`, numbers and `T[r][c]` over a table. A tiny recursive-descent parser —
 * never `eval`. Null on any syntax error, missing cell or non-finite result.
 */
export function evaluateExpression(expression: string, rows: readonly (readonly string[])[]): number | null {
  const tokens = expression.match(/T\[\s*\d+\s*\]\[\s*\d+\s*\]|\d*\.?\d+|[-+*/()]/g);
  if (!tokens || tokens.join("").replace(/\s/g, "") !== expression.replace(/\s/g, "")) return null;
  let i = 0;
  const peek = () => tokens[i];
  const factor = (): number | null => {
    const t = tokens[i++];
    if (t === undefined) return null;
    if (t === "-") {
      const v = factor();
      return v === null ? null : -v;
    }
    if (t === "(") {
      const v = expr();
      if (tokens[i++] !== ")") return null;
      return v;
    }
    const cell = /^T\[\s*(\d+)\s*\]\[\s*(\d+)\s*\]$/.exec(t);
    if (cell) return cellNumber(rows[Number(cell[1])]?.[Number(cell[2])]);
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };
  const term = (): number | null => {
    let v = factor();
    while (v !== null && (peek() === "*" || peek() === "/")) {
      const op = tokens[i++];
      const r = factor();
      if (r === null) return null;
      v = op === "*" ? v * r : v / r;
    }
    return v;
  };
  const expr = (): number | null => {
    let v = term();
    while (v !== null && (peek() === "+" || peek() === "-")) {
      const op = tokens[i++];
      const r = term();
      if (r === null) return null;
      v = op === "+" ? v + r : v - r;
    }
    return v;
  };
  const value = expr();
  return value !== null && i === tokens.length && Number.isFinite(value) ? value : null;
}

// ---------------------------------------------------------------------------
// v4.1 graders
// ---------------------------------------------------------------------------

function isFormulaCell(grid: string[][], ref: string): boolean {
  const at = parseRef(ref);
  return Boolean(at && (grid[at.row]?.[at.col] ?? "").startsWith("="));
}

/** Puts the learner's entries into their editable cells only, evaluates, and checks each target. */
export function gradeExcel(task: ExcelTask, cells: Record<string, string>): TaskGrade {
  const grid = task.grid.map((row) => [...row]);
  const width = Math.max(...grid.map((r) => r.length));
  for (const row of grid) while (row.length < width) row.push("");
  for (const ref of task.editable) {
    const at = parseRef(ref);
    if (!at) continue;
    while (grid.length <= at.row) grid.push(Array.from({ length: width }, () => ""));
    while (grid[at.row].length <= at.col) grid[at.row].push("");
    grid[at.row][at.col] = (cells[ref] ?? cells[ref.toLowerCase()] ?? "").trim();
  }
  const { values } = evaluateSheet(grid);
  let right = 0;
  const detail = task.checks.map((check) => {
    const at = parseRef(check.cell)!;
    const raw = grid[at.row]?.[at.col] ?? "";
    const value = values[at.row]?.[at.col] ?? null;
    let ok =
      typeof check.expected === "number"
        ? typeof value === "number" && Math.abs(value - check.expected) <= check.tolerance + 1e-9
        : String(value ?? "").trim().toLowerCase() === check.expected.trim().toLowerCase();
    if (ok && check.requireFormula && !raw.startsWith("=")) ok = false;
    if (ok && check.functions.length) {
      const used = functionsIn(raw);
      ok = check.functions.every((f) => used.includes(f.toUpperCase()));
    }
    if (ok) right += 1;
    return `${check.cell}: ${ok ? "correct" : `expected ${check.expected}${check.requireFormula ? " from a formula" : ""}${check.functions.length ? ` using ${check.functions.join(", ")}` : ""}`}`;
  });
  return { score: round(right / task.checks.length), detail };
}

/** Each person within capacity, each project covered (up to `slack` over), blocked pairs at zero. */
export function gradeAllocate(task: AllocateTask, hours: Record<string, number>): TaskGrade {
  const h = (person: string, project: string) => Number(hours[`${person}:${project}`] ?? 0) || 0;
  const detail: string[] = [];
  let ok = 0;
  let total = 0;
  for (const person of task.people) {
    total += 1;
    const sum = task.projects.reduce((s, p) => s + h(person.id, p.id), 0);
    const blocked = task.blocked.filter((b) => b.person === person.id).some((b) => h(person.id, b.project) > 0);
    const fine = sum <= person.capacity + 1e-9 && !blocked;
    if (fine) ok += 1;
    detail.push(`${person.name}: ${sum}/${person.capacity} h${blocked ? " — on a project they cannot work on" : sum > person.capacity ? " — over-allocated" : ""}`);
  }
  for (const project of task.projects) {
    total += 1;
    const sum = task.people.reduce((s, p) => s + h(p.id, project.id), 0);
    const fine = sum >= project.need - 1e-9 && sum <= project.need * (1 + task.slack) + 1e-9;
    if (fine) ok += 1;
    detail.push(`${project.name}: ${sum}/${project.need} h${sum < project.need ? " — under-staffed" : sum > project.need * (1 + task.slack) ? " — over-staffed" : ""}`);
  }
  return { score: round(ok / total), detail };
}
