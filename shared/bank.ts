import { z } from "zod";

import { sandboxLanguageSchema } from "./catalog";
import { taskSchema } from "./tasks";

/**
 * The question bank (v4 Phase 5): the reason an assessment costs nothing to build.
 *
 * Items are written once, validated once (every coding item's reference solution passes its hidden
 * tests in the sandbox, and its starter code does not), and then assembled into assessments by
 * plain code. Three types: `coding` (engineering), `task` (PM/BD hands-on) and `mcq` (everyone).
 */

export const BANK_ITEM_TYPES = ["coding", "mcq", "task"] as const;
export const bankItemTypeSchema = z.enum(BANK_ITEM_TYPES);
export type BankItemType = z.infer<typeof bankItemTypeSchema>;

export const bankStatusSchema = z.enum(["draft", "active", "retired"]);
export type BankStatus = z.infer<typeof bankStatusSchema>;

/**
 * How a coding item is run.
 *
 * - `function`: the learner completes a named function; each test is `{ args, expected }`, compared
 *   as JSON (key order ignored). JavaScript, TypeScript, Python and PHP.
 * - `program`: the learner's code is a whole program; each test is `{ stdin, expected }` compared on
 *   trimmed stdout ("make the output match"). Any language; how Java and Dart items are written.
 * - `sql`: each test is `{ setup, expected }`: the setup SQL runs first, then the learner's query,
 *   and the rows (as JSON objects) are compared. SQLite.
 */
export const codingModeSchema = z.enum(["function", "program", "sql"]);
export type CodingMode = z.infer<typeof codingModeSchema>;

export const functionTestSchema = z.object({ args: z.array(z.unknown()), expected: z.unknown() });
export const programTestSchema = z.object({ stdin: z.string().max(20_000).default(""), expected: z.string().max(20_000) });
export const sqlTestSchema = z.object({ setup: z.string().max(20_000), expected: z.array(z.record(z.string(), z.unknown())) });

export type FunctionTest = z.infer<typeof functionTestSchema>;
export type ProgramTest = z.infer<typeof programTestSchema>;
export type SqlTest = z.infer<typeof sqlTestSchema>;
export type CodeTest = FunctionTest | ProgramTest | SqlTest;

const md = (max: number) => z.string().trim().min(1).max(max);

export const codingSpecSchema = z.object({
  language: sandboxLanguageSchema,
  mode: codingModeSchema,
  /** Required for `function` mode. */
  functionName: z.string().regex(/^[A-Za-z_$][\w$]*$/).nullable().default(null),
  starterCode: z.string().max(8000),
  referenceSolution: z.string().max(12_000),
  /** Shown to the learner and run by Run. 1–3 is plenty. */
  sampleTests: z.array(z.unknown()).min(1).max(5),
  /** Graded on Submit. Never sent to the browser. */
  hiddenTests: z.array(z.unknown()).min(3).max(12),
});
export type CodingSpec = z.infer<typeof codingSpecSchema>;

export const mcqSpecSchema = z.object({
  options: z.array(md(400)).min(3).max(6),
  correctIndex: z.number().int().min(0),
  explanation: md(1200),
  /** Code the learner can run before answering (same 3-run counter). Optional. */
  snippet: z.string().max(4000).nullable().default(null),
  snippetLanguage: sandboxLanguageSchema.nullable().default(null),
});
export type McqSpec = z.infer<typeof mcqSpecSchema>;

/** One bank item as it lives in a seed file and in the `question_bank` table. */
export const bankItemSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]{2,90}$/),
    departmentId: z.string().min(1),
    skillId: z.string().min(1),
    trackId: z.string().nullable().default(null),
    stackId: z.string().nullable().default(null),
    type: bankItemTypeSchema,
    difficulty: z.number().int().min(1).max(5),
    estMinutes: z.number().min(0.5).max(6),
    prompt: md(4000),
    coding: codingSpecSchema.nullable().default(null),
    mcq: mcqSpecSchema.nullable().default(null),
    task: taskSchema.nullable().default(null),
  })
  .superRefine((item, ctx) => {
    if (item.type === "coding" && !item.coding) ctx.addIssue({ code: "custom", message: "coding item needs `coding`" });
    if (item.type === "mcq" && !item.mcq) ctx.addIssue({ code: "custom", message: "mcq item needs `mcq`" });
    if (item.type === "task" && !item.task) ctx.addIssue({ code: "custom", message: "task item needs `task`" });
    if (item.coding?.mode === "function" && !item.coding.functionName) ctx.addIssue({ code: "custom", message: "function mode needs functionName" });
    if (item.mcq && item.mcq.correctIndex >= item.mcq.options.length) ctx.addIssue({ code: "custom", message: "correctIndex out of range" });
  });
export type BankItem = z.infer<typeof bankItemSchema>;

/** Parses each test of a coding item according to its mode. Throws on the first bad test. */
export function parseTests(mode: CodingMode, tests: readonly unknown[]): CodeTest[] {
  const schema = mode === "function" ? functionTestSchema : mode === "program" ? programTestSchema : sqlTestSchema;
  return tests.map((t) => schema.parse(t));
}

// ---------------------------------------------------------------------------
// Admin views
// ---------------------------------------------------------------------------

export interface BankItemRow extends BankItem {
  status: BankStatus;
  source: "seed" | "generated" | "admin";
  timesUsed: number;
  /** Mean score 0..1 over everyone who answered it, or null before anyone has. */
  meanScore: number | null;
  /** Point-biserial-style: how well the item separates strong from weak sittings. Null below 10 uses. */
  discrimination: number | null;
  retiredReason: string | null;
  validatedAt: number | null;
  updatedAt: number;
}

export const AUTO_RETIRE_MIN_USES = 20;
export const AUTO_RETIRE_TOO_HARD = 0.05;
export const AUTO_RETIRE_TOO_EASY = 0.95;

/** Below this many active items per skill and type, the assembler asks for a gap-fill job. */
export const BANK_MIN_PER_SKILL = { coding: 6, task: 6, mcq: 3 } as const;
