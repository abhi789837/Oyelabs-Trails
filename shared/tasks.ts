import { z } from "zod";

import { CLASSIFICATIONS, OUTCOMES } from "./decision";
import { evaluateSheet, functionsIn, parseRef } from "./sheet";
import { SPEAK_AUDIENCES } from "./softSkills";

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

export const TASK_KINDS = ["write", "rank", "calculate", "scenario", "spot", "excel", "allocate", "sim", "categorize", "form", "roleplay", "terminal", "speak"] as const;
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
  categorize: "Categorise",
  form: "Fill the form",
  roleplay: "Client conversation",
  terminal: "Terminal",
  speak: "Speak",
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
  /**
   * v4.4: a message the learner rewrites ("rewrite this for the client, keep the facts"), shown
   * above the answer box. Absent for every other write task.
   */
  sourceText: z.string().trim().min(1).max(1500).optional(),
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
  /**
   * v4.4: other orders that are equally right (e.g. two independent steps either way round). Each
   * lists every item id once. Any of them gets full marks.
   */
  acceptOrders: z.array(z.array(text(40)).min(3).max(8)).max(6).optional(),
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
  blocked: z.array(z.object({ person: text(20), project: text(20), reason: text(80).optional() })).max(10).default([]),
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

// ---------------------------------------------------------------------------
// v4.2 simulations: categorise, fill a form, role-play a client conversation
// ---------------------------------------------------------------------------

export const CATEGORIZE_MODES = ["classify-request", "gap-analysis", "generic"] as const;
export type CategorizeMode = (typeof CATEGORIZE_MODES)[number];

/** The four buckets of a white-label gap analysis, in the order they are offered. */
export const GAP_CATEGORIES = [
  { id: "ootb", label: "Out of the box" },
  { id: "configuration", label: "Configuration" },
  { id: "customisation", label: "Customisation" },
  { id: "new-feature", label: "New feature" },
] as const;

/** Category labels for a classify-request task, from the decision tool's outcomes. */
export const CLASSIFY_CATEGORIES = CLASSIFICATIONS.map((id) => ({ id, label: OUTCOMES[id].label }));

/**
 * v4.2: put each item in a category. Classify-the-request uses the decision tool's
 * classifications as categories (a subset is fine); gap analysis uses `GAP_CATEGORIES`. Graded by code.
 */
export const categorizeTaskSchema = z.object({
  kind: z.literal("categorize"),
  prompt: text(1500),
  mode: z.enum(CATEGORIZE_MODES).default("generic"),
  categories: z.array(z.object({ id: text(40), label: text(80) })).min(2).max(7),
  items: z.array(z.object({ id: text(40), text: text(400), explanation: z.string().max(600).default("") })).min(2).max(20),
  /** item id → category id. */
  answer: z.record(z.string(), z.string()),
});

export const FORM_VARIANTS = ["cr", "mom", "status", "template"] as const;
export type FormVariant = (typeof FORM_VARIANTS)[number];
export const FORM_INPUTS = ["text", "textarea", "number", "select", "date"] as const;

export const formFieldSchema = z.object({
  id: text(40),
  label: text(120),
  input: z.enum(FORM_INPUTS),
  options: z.array(text(80)).min(2).max(10).optional(),
  placeholder: z.string().max(160).optional(),
  required: z.boolean().default(true),
});
export type FormField = z.infer<typeof formFieldSchema>;

/** A rubric dimension scored by a model; `points` is its weight (against a form's code checks). */
export const pointsRubricSchema = z.object({
  label: text(120),
  points: z.number().int().min(1).max(5),
  /** What a full-marks answer does. For the grader and review mode, never shown during an assessment. */
  description: z.string().max(400).optional(),
});
export type PointsRubric = z.infer<typeof pointsRubricSchema>;

/**
 * v4.2: complete a document (a change request, minutes, a status report, a handbook template) from
 * the context: a client email, a transcript, a board export. Exact parts (a RAG status, a number, a
 * classification) are `checks`, graded by code; the rest is the rubric, graded by a model.
 */
export const formTaskSchema = z.object({
  kind: z.literal("form"),
  variant: z.enum(FORM_VARIANTS),
  prompt: text(1500),
  /** What the learner works from. Markdown, including pipe tables for a board export. */
  context: z.string().max(1500).default(""),
  /** A handbook template id; the learner can download the blank template. */
  templateId: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(60)
    .nullable()
    .default(null),
  fields: z.array(formFieldSchema).min(1).max(12),
  checks: z
    .array(z.object({ fieldId: text(40), expected: z.union([z.number(), z.string().trim().min(1).max(120)]), tolerance: z.number().min(0).optional() }))
    .max(12)
    .default([]),
  rubric: z.array(pointsRubricSchema).min(1).max(6),
  sampleAnswer: z.record(z.string(), z.string().max(2000)),
});

/**
 * v4.2: a short conversation with an AI client. The engine, the personas and each scenario's hidden
 * concern live in `shared/roleplay.ts`; the task only points at them. Graded by a model.
 */
export const roleplayTaskSchema = z.object({
  kind: z.literal("roleplay"),
  /** Optional framing above the conversation; `brief` says what to achieve. */
  prompt: z.string().max(1500).default(""),
  scenarioId: text(60),
  personaId: text(60),
  maxTurns: z.number().int().min(2).max(8),
  /** What the learner must achieve in the conversation. */
  brief: text(800),
  rubric: z.array(pointsRubricSchema).min(1).max(6),
  /** Ask for the follow-up email after the conversation. */
  followUp: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// v4.3: a simulated terminal (docs/v4.3/PLAN.md, D3)
// ---------------------------------------------------------------------------

/** Pass mark for a terminal task: met units / total units. */
export const TERMINAL_PASS = 0.8;
export const TERMINAL_UNKNOWN = "command not handled in this exercise";

/**
 * v4.3: Git, shell, Docker and deploy outcomes, practised in a scripted fake shell. There is no real
 * shell: each step lists the regular expressions a correct command matches and what the terminal
 * prints when it does. Optional files (a file with conflict markers, a Dockerfile) are edited in a
 * small editor and checked by `fileChecks`. Graded by code (`gradeTerminal`).
 */
export const terminalTaskSchema = z.object({
  kind: z.literal("terminal"),
  title: text(120),
  prompt: text(1500),
  /** Shown in the prompt line, e.g. "~/shop-api (feature/cart)". */
  cwd: text(80),
  /** What the terminal shows first, e.g. `git status` output. */
  intro: z.string().max(2000),
  files: z.array(z.object({ path: text(120), content: z.string().max(4000) })).max(3).default([]),
  steps: z
    .array(
      z.object({
        id: text(40),
        /** Shown to the learner only as a hint after a wrong command. */
        goal: text(200),
        /** Regular-expression sources, tested against the command with whitespace collapsed and trimmed. Case-sensitive. */
        accept: z.array(text(300)).min(1).max(6),
        /** Printed when the command is accepted. */
        output: z.string().max(1500),
      }),
    )
    .min(1)
    .max(10),
  fileChecks: z
    .array(
      z.object({
        path: text(120),
        mustContain: z.array(z.string().min(1).max(200)).max(10).default([]),
        mustNotContain: z.array(z.string().min(1).max(200)).max(10).default([]),
      }),
    )
    .max(6)
    .default([]),
  explanation: z.string().max(1500),
});

// ---------------------------------------------------------------------------
// v4.4: Speak (docs/v4.4/PLAN.md, "Speak")
// ---------------------------------------------------------------------------

/** Seconds to get ready before the recording starts (skippable with "I'm ready"). */
export const SPEAK_PREP_SEC = 20;

/**
 * v4.4: answer out loud: a stand-up update, explaining a delay to a client, introducing yourself.
 * The recording is transcribed on the server and graded by a model for whether it does the job and
 * how easily a listener follows it (never accent). `writtenFallback` is the same task in writing, for
 * a learner with no microphone or one who said no to it.
 */
export const speakTaskSchema = z.object({
  kind: z.literal("speak"),
  title: text(120),
  prompt: text(600),
  audience: z.enum(SPEAK_AUDIENCES),
  prepSec: z.literal(SPEAK_PREP_SEC),
  maxSec: z.number().int().min(60).max(90),
  /** What a good answer covers, 2–5 plain lines. Shown to the learner and the grader. */
  lookFor: z.array(text(200)).min(2).max(5),
  writtenFallback: text(1500),
  explanation: text(1500),
});

export const taskSchema = z.discriminatedUnion("kind", [
  writeTaskSchema,
  rankTaskSchema,
  calculateTaskSchema,
  scenarioTaskSchema,
  spotTaskSchema,
  excelTaskSchema,
  allocateTaskSchema,
  simTaskSchema,
  categorizeTaskSchema,
  formTaskSchema,
  roleplayTaskSchema,
  terminalTaskSchema,
  speakTaskSchema,
]);
export type Task = z.infer<typeof taskSchema>;
export type WriteTask = z.infer<typeof writeTaskSchema>;
export type RankTask = z.infer<typeof rankTaskSchema>;
export type CalculateTask = z.infer<typeof calculateTaskSchema>;
export type ScenarioTask = z.infer<typeof scenarioTaskSchema>;
export type SpotTask = z.infer<typeof spotTaskSchema>;
export type ExcelTask = z.infer<typeof excelTaskSchema>;
export type AllocateTask = z.infer<typeof allocateTaskSchema>;
export type SimTask = z.infer<typeof simTaskSchema>;
export type CategorizeTask = z.infer<typeof categorizeTaskSchema>;
export type FormTask = z.infer<typeof formTaskSchema>;
export type RoleplayTask = z.infer<typeof roleplayTaskSchema>;
export type TerminalTask = z.infer<typeof terminalTaskSchema>;
export type SpeakTask = z.infer<typeof speakTaskSchema>;

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
  | (Omit<SimTask, "rows" | "questions"> & { rows: { id: string; cells: string[] }[]; questions: { id: string; question: string; options: string[] }[] })
  | (Omit<CategorizeTask, "items" | "answer"> & { items: { id: string; text: string }[] })
  | (Omit<FormTask, "checks" | "sampleAnswer" | "rubric"> & { checks: { fieldId: string }[]; rubric: { label: string; points: number }[] })
  | (Omit<RoleplayTask, "rubric"> & { rubric: { label: string; points: number }[] })
  /**
   * The terminal keeps its steps: the fake shell answers each command in the browser, so it needs
   * the patterns and outputs. What the file checks look for, and the explanation, stay hidden.
   */
  | (Omit<TerminalTask, "fileChecks" | "explanation"> & { fileChecks: { path: string }[] })
  /** v4.4: everything but the explanation; `lookFor` is shown like a write task's criteria. */
  | Omit<SpeakTask, "explanation">;

/** Deterministic shuffle so a rank task never starts in its answer order. */
function rotate<T>(items: readonly T[], seed: number): T[] {
  if (items.length < 2) return [...items];
  const k = (seed % (items.length - 1)) + 1;
  return [...items.slice(k), ...items.slice(0, k)];
}

export function toLearnerTask(task: Task, seed = 1): LearnerTask {
  switch (task.kind) {
    case "write":
      return { kind: "write", prompt: task.prompt, context: task.context, ...(task.sourceText ? { sourceText: task.sourceText } : {}), wordLimit: task.wordLimit, ...(task.variant && task.variant !== "general" ? { variant: task.variant } : {}), rubric: task.rubric.map((c) => ({ label: c.label })) };
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
    case "categorize":
      return { kind: "categorize", prompt: task.prompt, mode: task.mode, categories: task.categories, items: task.items.map((i) => ({ id: i.id, text: i.text })) };
    case "form":
      return {
        kind: "form",
        variant: task.variant,
        prompt: task.prompt,
        context: task.context,
        templateId: task.templateId,
        fields: task.fields,
        // Which fields are checked exactly is not a secret; what they should say is.
        checks: task.checks.map((c) => ({ fieldId: c.fieldId })),
        rubric: task.rubric.map((r) => ({ label: r.label, points: r.points })),
      };
    case "roleplay":
      // The scenario's hidden concern is in shared/roleplay.ts, never in the task.
      return {
        kind: "roleplay",
        prompt: task.prompt,
        scenarioId: task.scenarioId,
        personaId: task.personaId,
        maxTurns: task.maxTurns,
        brief: task.brief,
        followUp: task.followUp,
        rubric: task.rubric.map((r) => ({ label: r.label, points: r.points })),
      };
    case "terminal":
      return {
        kind: "terminal",
        title: task.title,
        prompt: task.prompt,
        cwd: task.cwd,
        intro: task.intro,
        files: task.files,
        steps: task.steps,
        fileChecks: task.fileChecks.map((c) => ({ path: c.path })),
      };
    case "speak":
      return {
        kind: "speak",
        title: task.title,
        prompt: task.prompt,
        audience: task.audience,
        prepSec: task.prepSec,
        maxSec: task.maxSec,
        lookFor: task.lookFor,
        writtenFallback: task.writtenFallback,
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
  z.object({ kind: z.literal("categorize"), picks: z.record(z.string().max(40), z.string().max(40)) }),
  z.object({ kind: z.literal("form"), values: z.record(z.string().max(40), z.string().max(4000)) }),
  z.object({
    kind: z.literal("roleplay"),
    sessionId: z.string().max(80),
    transcript: z.array(z.object({ role: z.enum(["pm", "client"]), text: z.string().max(2000) })).max(20),
    followUpEmail: z.string().max(4000).optional(),
  }),
  z.object({
    kind: z.literal("terminal"),
    commands: z.array(z.string().max(300)).max(40),
    /** Edited file contents by path; a file left out keeps the task's starting content. */
    files: z.record(z.string().max(120), z.string().max(4000)).default({}),
  }),
  /**
   * v4.4: a recording (uploaded first, to POST /api/recordings) or, with no microphone, the typed
   * answer to `writtenFallback`. `reRecorded`: the learner used their one re-record.
   */
  z.object({
    kind: z.literal("speak"),
    recordingId: z.string().min(1).max(64).optional(),
    durationSec: z.number().min(0).max(600).optional(),
    fallbackText: z.string().max(4000).optional(),
    usedFallback: z.boolean().default(false),
    reRecorded: z.boolean().default(false),
  }),
]);
export type TaskResponse = z.infer<typeof taskResponseSchema>;

export interface TaskGrade {
  /** 0..1. Null for `write`, `form` and `roleplay`, whose score (or part of it) comes from a model. */
  score: number | null;
  /** Per-part detail for the result screen. */
  detail: string[];
  /**
   * A `form`'s code-checked part: its score and its share of the final score, which the rubric
   * grader combines with `combineFormScore`. Absent when the form has no checks.
   */
  checks?: { score: number; weight: number };
}

/** Kinds whose final score needs a model (a rubric or a conversation). */
export const AI_GRADED_KINDS: readonly TaskKind[] = ["write", "form", "roleplay", "speak"];

/** v4.4: whether a Speak response holds an answer: a recording, or typed text when the mic was not used. */
export function speakAnswered(response: Extract<TaskResponse, { kind: "speak" }> | null | undefined): boolean {
  if (!response) return false;
  if (response.usedFallback) return Boolean(response.fallbackText?.trim());
  return Boolean(response.recordingId);
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
  // A Speak item with nothing recorded or typed is simply unanswered: 0, nothing to wait for.
  if (!response || response.kind !== task.kind) return { score: AI_GRADED_KINDS.includes(task.kind) && task.kind !== "form" && task.kind !== "speak" ? null : 0, detail: ["No answer"] };
  switch (task.kind) {
    case "write":
    case "roleplay":
      return { score: null, detail: [] };
    case "speak":
      return speakAnswered(response as Extract<TaskResponse, { kind: "speak" }>) ? { score: null, detail: [] } : { score: 0, detail: ["No answer"] };
    case "categorize":
      return gradeCategorize(task, (response as Extract<TaskResponse, { kind: "categorize" }>).picks);
    case "form":
      return gradeFormChecks(task, (response as Extract<TaskResponse, { kind: "form" }>).values);
    case "terminal": {
      const r = response as Extract<TaskResponse, { kind: "terminal" }>;
      return gradeTerminal(task, r.commands, r.files);
    }
    case "rank": {
      const order = (response as Extract<TaskResponse, { kind: "rank" }>).order;
      // v4.4: an equally valid order from the key is fully right.
      const accepted = (task.acceptOrders ?? []).some((key) => key.length === order.length && key.every((id, i) => order[i] === id));
      if (accepted) return { score: 1, detail: ["An accepted order."] };
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
    for (const alt of task.acceptOrders ?? []) {
      if (alt.length !== ids.length || new Set(alt).size !== alt.length || !alt.every((id) => ids.includes(id))) problems.push("rank: each accepted order must list every item once");
    }
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
  if (task.kind === "categorize") problems.push(...checkCategorize(task));
  if (task.kind === "terminal") problems.push(...checkTerminal(task));
  if (task.kind === "form") problems.push(...checkForm(task));
  if (task.kind === "speak") {
    const lines = task.lookFor.map((l) => l.toLowerCase());
    if (new Set(lines).size !== lines.length) problems.push("speak: duplicate lookFor lines");
  }
  if (task.kind === "write" && task.sourceText && task.context && task.sourceText.trim() === task.context.trim()) problems.push("write: sourceText repeats the context");
  if (task.kind === "roleplay") {
    const labels = task.rubric.map((r) => r.label.toLowerCase());
    if (new Set(labels).size !== labels.length) problems.push("roleplay: duplicate rubric labels");
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

// ---------------------------------------------------------------------------
// v4.2 graders
// ---------------------------------------------------------------------------

/** Each item in its category; the score is the share right. */
export function gradeCategorize(task: CategorizeTask, picks: Record<string, string>): TaskGrade {
  const label = new Map(task.categories.map((c) => [c.id, c.label]));
  let right = 0;
  const detail = task.items.map((item) => {
    const expected = task.answer[item.id];
    const picked = picks[item.id];
    const ok = picked !== undefined && picked === expected;
    if (ok) right += 1;
    const short = item.text.length > 60 ? `${item.text.slice(0, 57)}…` : item.text;
    return `${short}: ${ok ? "correct" : `${label.get(expected) ?? expected}${picked ? ` (you chose ${label.get(picked) ?? picked})` : " (no pick)"}`}`;
  });
  return { score: round(right / task.items.length), detail };
}

/** Lower-case, single-spaced, without trailing punctuation: "Amber." matches "amber". */
function normaliseAnswer(value: string): string {
  return value.trim().replace(/\s+/g, " ").replace(/[.!]+$/, "").toLowerCase();
}

/** Whether one form value meets one exact check. Numbers accept "12,000", "$12k" does not. */
export function formCheckPasses(check: FormTask["checks"][number], value: string | undefined): boolean {
  if (value === undefined || value.trim() === "") return false;
  if (typeof check.expected === "number") {
    const n = cellNumber(value);
    return n !== null && Math.abs(n - check.expected) <= (check.tolerance ?? 0) + 1e-9;
  }
  return normaliseAnswer(value) === normaliseAnswer(check.expected);
}

/** The checks' share of a form's final score: one point per check against the rubric's points. */
export function formCheckWeight(task: Pick<FormTask, "checks" | "rubric">): number {
  const points = task.rubric.reduce((s, r) => s + r.points, 0);
  return task.checks.length ? task.checks.length / (task.checks.length + points) : 0;
}

/**
 * The code-checked part of a form. The overall score stays null: the rubric part needs a model.
 * `checks` carries the part's score and weight for `combineFormScore`.
 */
export function gradeFormChecks(task: FormTask, values: Record<string, string>): TaskGrade {
  const label = new Map(task.fields.map((f) => [f.id, f.label]));
  let right = 0;
  const detail = task.checks.map((check) => {
    const ok = formCheckPasses(check, values[check.fieldId]);
    if (ok) right += 1;
    return `${label.get(check.fieldId) ?? check.fieldId}: ${ok ? "correct" : `expected ${check.expected}`}`;
  });
  return {
    score: null,
    detail,
    ...(task.checks.length ? { checks: { score: round(right / task.checks.length), weight: round(formCheckWeight(task)) } } : {}),
  };
}

/** The final form score: checks weighted by their share, the rubric by the rest. */
export function combineFormScore(task: Pick<FormTask, "checks" | "rubric">, checkScore: number | null, rubricScore: number): number {
  const w = formCheckWeight(task);
  return round(w * (checkScore ?? 0) + (1 - w) * rubricScore);
}

function checkCategorize(task: CategorizeTask): string[] {
  const problems: string[] = [];
  const categoryIds = task.categories.map((c) => c.id);
  const itemIds = task.items.map((i) => i.id);
  if (new Set(categoryIds).size !== categoryIds.length) problems.push("categorize: duplicate category ids");
  if (new Set(itemIds).size !== itemIds.length) problems.push("categorize: duplicate item ids");
  for (const id of itemIds) {
    const answer = task.answer[id];
    if (answer === undefined) problems.push(`categorize: no answer for ${id}`);
    else if (!categoryIds.includes(answer)) problems.push(`categorize: ${id} answers an unknown category ${answer}`);
  }
  for (const key of Object.keys(task.answer)) if (!itemIds.includes(key)) problems.push(`categorize: answer for unknown item ${key}`);
  if (task.mode === "classify-request") {
    const known = new Set<string>(CLASSIFICATIONS);
    for (const id of categoryIds) if (!known.has(id)) problems.push(`categorize: ${id} is not a decision-tool classification`);
  }
  if (task.mode === "gap-analysis") {
    const known = new Set<string>(GAP_CATEGORIES.map((c) => c.id));
    for (const id of categoryIds) if (!known.has(id)) problems.push(`categorize: ${id} is not a gap-analysis category`);
  }
  if (task.items.length >= 3 && new Set(Object.values(task.answer)).size < 2) problems.push("categorize: every item is in the same category");
  return problems;
}

function checkForm(task: FormTask): string[] {
  const problems: string[] = [];
  const fields = new Map(task.fields.map((f) => [f.id, f]));
  if (fields.size !== task.fields.length) problems.push("form: duplicate field ids");
  for (const field of task.fields) {
    if (field.input === "select" && !field.options?.length) problems.push(`form: select ${field.id} has no options`);
    if (field.input !== "select" && field.options?.length) problems.push(`form: ${field.id} has options but is not a select`);
    if (field.required && !(task.sampleAnswer[field.id] ?? "").trim()) problems.push(`form: no sample answer for ${field.id}`);
  }
  const checked = new Set<string>();
  for (const check of task.checks) {
    const field = fields.get(check.fieldId);
    if (!field) {
      problems.push(`form: check on unknown field ${check.fieldId}`);
      continue;
    }
    if (checked.has(check.fieldId)) problems.push(`form: two checks on ${check.fieldId}`);
    checked.add(check.fieldId);
    if (field.input === "textarea") problems.push(`form: ${check.fieldId} is free text, so it cannot be checked exactly`);
    if (field.input === "number" && typeof check.expected !== "number") problems.push(`form: ${check.fieldId} is a number but expects text`);
    if (field.input === "select" && !field.options?.some((o) => normaliseAnswer(o) === normaliseAnswer(String(check.expected)))) problems.push(`form: ${check.fieldId} expects an answer that is not an option`);
  }
  for (const key of Object.keys(task.sampleAnswer)) if (!fields.has(key)) problems.push(`form: sample answer for unknown field ${key}`);
  const sample = gradeFormChecks(task, task.sampleAnswer);
  if (sample.checks && sample.checks.score !== 1) problems.push(`form: the sample answer fails its own checks (${sample.detail.filter((d) => !d.endsWith("correct")).join("; ").slice(0, 160)})`);
  return problems;
}

// ---------------------------------------------------------------------------
// v4.3: the terminal
// ---------------------------------------------------------------------------

/** What a pattern is tested against: trimmed, with runs of whitespace collapsed to one space. */
export function normaliseCommand(command: string): string {
  return command.trim().replace(/\s+/g, " ");
}

const regexCache = new Map<string, RegExp | null>();
function compilePattern(source: string): RegExp | null {
  if (!regexCache.has(source)) {
    let re: RegExp | null = null;
    try {
      re = new RegExp(source);
    } catch {
      re = null;
    }
    if (regexCache.size > 500) regexCache.clear();
    regexCache.set(source, re);
  }
  return regexCache.get(source) ?? null;
}

/** Whether a command satisfies one step (any of its patterns). An invalid pattern never matches. */
export function commandMatches(step: { accept: readonly string[] }, command: string): boolean {
  const normalised = normaliseCommand(command);
  if (!normalised) return false;
  return step.accept.some((source) => compilePattern(source)?.test(normalised) ?? false);
}

export interface TerminalRun {
  /** One entry per command, in order: the step it met (null for a wrong one) and what to print. */
  lines: { command: string; stepId: string | null; output: string }[];
  /** Steps met, in order. */
  met: string[];
  /** The next step to do, or null when every step is met. */
  nextStepId: string | null;
}

/**
 * Plays commands through the script, exactly as the grader does: the next unmet step is met by the
 * first later command matching one of its patterns, so steps are met strictly in order and wrong
 * commands in between cost nothing. Anything else prints TERMINAL_UNKNOWN. The browser terminal uses
 * this too, so what the learner sees is what is graded.
 */
export function runTerminal(task: { steps: readonly { id: string; accept: readonly string[]; output: string }[] }, commands: readonly string[]): TerminalRun {
  const lines: TerminalRun["lines"] = [];
  const met: string[] = [];
  let at = 0;
  for (const command of commands) {
    const step = task.steps[at];
    if (step && commandMatches(step, command)) {
      met.push(step.id);
      lines.push({ command, stepId: step.id, output: step.output });
      at += 1;
    } else {
      lines.push({ command, stepId: null, output: TERMINAL_UNKNOWN });
    }
  }
  return { lines, met, nextStepId: task.steps[at]?.id ?? null };
}

/** One file check: every `mustContain` present and no `mustNotContain` present. */
export function fileCheckPasses(check: { mustContain: readonly string[]; mustNotContain: readonly string[] }, content: string): boolean {
  return check.mustContain.every((s) => content.includes(s)) && !check.mustNotContain.some((s) => content.includes(s));
}

/**
 * Steps met (in order) plus file checks passed, over all of them; passes at TERMINAL_PASS. A file
 * the learner did not touch keeps the task's starting content.
 */
export function gradeTerminal(task: TerminalTask, commands: readonly string[], files: Record<string, string> = {}): TaskGrade {
  const run = runTerminal(task, commands);
  const met = new Set(run.met);
  const detail: string[] = task.steps.map((step, i) => `Step ${i + 1}: ${met.has(step.id) ? "done" : `not done (${step.goal})`}`);
  let units = run.met.length;
  for (const check of task.fileChecks) {
    const content = files[check.path] ?? task.files.find((f) => f.path === check.path)?.content ?? "";
    const ok = fileCheckPasses(check, content);
    if (ok) units += 1;
    detail.push(`${check.path}: ${ok ? "correct" : "not right yet"}`);
  }
  const wrong = run.lines.filter((l) => l.stepId === null).length;
  if (wrong) detail.push(`${wrong} command${wrong === 1 ? "" : "s"} not needed`);
  const total = task.steps.length + task.fileChecks.length;
  return { score: round(total ? units / total : 0), detail };
}

function checkTerminal(task: TerminalTask): string[] {
  const problems: string[] = [];
  const ids = task.steps.map((s) => s.id);
  if (new Set(ids).size !== ids.length) problems.push("terminal: duplicate step ids");
  for (const step of task.steps) {
    for (const source of step.accept) if (!compilePattern(source)) problems.push(`terminal: step ${step.id} has an invalid pattern ${source.slice(0, 60)}`);
  }
  const paths = task.files.map((f) => f.path);
  if (new Set(paths).size !== paths.length) problems.push("terminal: duplicate file paths");
  for (const check of task.fileChecks) {
    if (!paths.includes(check.path)) problems.push(`terminal: file check on unknown file ${check.path}`);
    if (check.mustContain.length === 0 && check.mustNotContain.length === 0) problems.push(`terminal: the check on ${check.path} checks nothing`);
  }
  if ((gradeTerminal(task, [], {}).score ?? 0) >= TERMINAL_PASS) problems.push("terminal: an empty answer already passes");
  return problems;
}
