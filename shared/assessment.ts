import { z } from "zod";

import { assessmentStatusSchema, itemKindSchema, itemStatusSchema, skillLevelSchema } from "./enums";

/**
 * The placement assessment (brief §9).
 *
 * Three groups of types live here:
 *  - what the AI is asked to produce (blueprint, item batches, critic verdicts),
 *  - what the server stores (payload and key, split so the key never leaves),
 *  - what the learner and the admin see.
 */

// ---------------------------------------------------------------------------
// Difficulty and areas
// ---------------------------------------------------------------------------

export const difficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
export type Difficulty = z.infer<typeof difficultySchema>;

/** Per-item time budgets (brief §9.3). Generous enough to think, short enough to look things up. */
export const TIME_LIMIT_SEC: Record<z.infer<typeof itemKindSchema>, number> = {
  mcq: 90,
  multi: 120,
  predict_output: 150,
  find_bug: 150,
  code: 600,
  explain: 300,
};

export const DEFAULT_TIME_LIMIT_MIN = 60;
/** Explain items get their own budget at the end of the test (§9.4). */
export const EXPLAIN_BUDGET_MIN = 15;
export const MIN_ITEM_TARGET = 25;
export const MAX_ITEM_TARGET = 40;

export const blueprintAreaSchema = z.object({
  name: z.string().trim().min(2).max(60),
  /** Module ids from the digest. Validated server-side; unknown ids are dropped. */
  moduleIds: z.array(z.string().min(1).max(80)).min(1).max(8),
  /** What the admin's notes suggest this person's level is, before testing. */
  hypothesisLevel: skillLevelSchema,
  rationale: z.string().trim().min(10).max(600),
});
export type BlueprintArea = z.infer<typeof blueprintAreaSchema>;

export const blueprintSchema = z.object({
  areas: z.array(blueprintAreaSchema).min(5).max(9),
  timeLimitMinutes: z.number().int().min(20).max(120),
  targetItemCount: z.number().int().min(MIN_ITEM_TARGET).max(MAX_ITEM_TARGET),
  summary: z.string().trim().min(20).max(1500),
});
export type Blueprint = z.infer<typeof blueprintSchema>;

// ---------------------------------------------------------------------------
// Generated items
// ---------------------------------------------------------------------------

export const generatedTestCaseSchema = z.object({
  args: z.array(z.unknown()).max(10),
  expected: z.unknown(),
  description: z.string().trim().min(3).max(200),
});

export const rubricPointSchema = z.object({
  point: z.string().trim().min(5).max(300),
  weight: z.number().min(0.05).max(1),
});

/**
 * One generated item, as the model returns it.
 *
 * Deliberately flat rather than a discriminated union: models handle a single object shape far
 * more reliably, and the per-kind requirements are checked in `validateGeneratedItem`, which can
 * give a far better message than a union mismatch would.
 */
export const generatedItemSchema = z.object({
  kind: itemKindSchema,
  difficulty: difficultySchema,
  /** 1–3 real topic ids. Items tagged with unknown ids are dropped. */
  topicIds: z.array(z.string().min(1).max(120)).min(1).max(3),
  prompt: z.string().trim().min(10).max(4000),
  /** mcq, multi and find_bug. */
  options: z.array(z.string().trim().min(1).max(500)).min(3).max(6).optional(),
  correctIndices: z.array(z.number().int().min(0).max(5)).min(1).max(5).optional(),
  /** predict_output. Compared after trimming and collapsing whitespace. */
  expectedOutput: z.string().max(2000).optional(),
  /** code */
  language: z.string().trim().max(30).optional(),
  starterCode: z.string().max(6000).optional(),
  functionName: z.string().trim().max(80).optional(),
  referenceSolution: z.string().max(8000).optional(),
  visibleTests: z.array(generatedTestCaseSchema).max(6).optional(),
  hiddenTests: z.array(generatedTestCaseSchema).max(8).optional(),
  /** explain */
  rubric: z.array(rubricPointSchema).min(2).max(6).optional(),
  maxChars: z.number().int().min(200).max(4000).optional(),
  /** What a correct answer demonstrates. Shown to the admin, never to the learner. */
  rationale: z.string().trim().min(10).max(800),
});
export type GeneratedItem = z.infer<typeof generatedItemSchema>;

export const itemBatchSchema = z.object({ items: z.array(generatedItemSchema).min(1).max(30) });
export type ItemBatch = z.infer<typeof itemBatchSchema>;

// ---------------------------------------------------------------------------
// Critic
// ---------------------------------------------------------------------------

export const criticVerdictSchema = z.object({
  /** Index into the batch the critic was given. */
  index: z.number().int().min(0).max(200),
  /** The critic's own answer, worked out independently. */
  answer: z.string().trim().max(2000),
  /** Whether that matches the keyed answer. */
  agreesWithKey: z.boolean(),
  /** Ambiguity, option-position references, a leaked answer, or trivia. Empty means clean. */
  issues: z.array(z.string().trim().min(3).max(300)).max(6),
  verdict: z.enum(["keep", "drop"]),
});
export type CriticVerdict = z.infer<typeof criticVerdictSchema>;

export const criticBatchSchema = z.object({ verdicts: z.array(criticVerdictSchema).min(1).max(200) });

// ---------------------------------------------------------------------------
// Stored payload and key
// ---------------------------------------------------------------------------

/** What the learner is sent. Contains nothing that could reveal the answer. */
export interface ItemPayload {
  prompt: string;
  options?: string[];
  language?: string;
  starterCode?: string;
  functionName?: string;
  visibleTests?: { args: unknown[]; expected: unknown; description: string }[];
  maxChars?: number;
  timeLimitSec: number;
}

/** Server only. Never serialised into a learner response. */
export interface ItemKey {
  correctIndices?: number[];
  expectedOutput?: string;
  hiddenTests?: { args: unknown[]; expected: unknown; description: string }[];
  referenceSolution?: string;
  rubric?: { point: string; weight: number }[];
  rationale: string;
}

// ---------------------------------------------------------------------------
// Admin views
// ---------------------------------------------------------------------------

export const poolItemSchema = z.object({
  id: z.string(),
  area: z.string(),
  difficulty: difficultySchema,
  kind: itemKindSchema,
  status: itemStatusSchema,
  topicIds: z.array(z.string()),
  payload: z.custom<ItemPayload>(),
  key: z.custom<ItemKey>(),
  criticVerdict: z.custom<CriticVerdict | null>(),
  dropReason: z.string().nullable(),
});
export type PoolItem = z.infer<typeof poolItemSchema>;

export const assessmentSummarySchema = z.object({
  id: z.string(),
  userId: z.string(),
  attemptNo: z.number(),
  status: assessmentStatusSchema,
  createdAt: z.number(),
  startedAt: z.number().nullable(),
  deadlineAt: z.number().nullable(),
  submittedAt: z.number().nullable(),
  terminatedReason: z.string().nullable(),
  hardWarnings: z.number(),
  softWarnings: z.number(),
  blueprint: z.custom<Blueprint | null>(),
  /** Counts by item status, so the admin can see a pool at a glance. */
  itemCounts: z.record(z.string(), z.number()),
});
export type AssessmentSummary = z.infer<typeof assessmentSummarySchema>;

export const issueAssessmentRequestSchema = z.object({
  /** Overrides the blueprint's own suggestion. */
  timeLimitMinutes: z.number().int().min(20).max(120).optional(),
});
export type IssueAssessmentRequest = z.infer<typeof issueAssessmentRequestSchema>;

/** Status the learner polls while a blueprint or an evaluation is running (§8.3). */
export const assessmentStatusResponseSchema = z.object({
  status: assessmentStatusSchema,
  /** Present while generating or evaluating, so the UI can say something truthful. */
  message: z.string().nullable(),
  failureReason: z.string().nullable(),
});
export type AssessmentStatusResponse = z.infer<typeof assessmentStatusResponseSchema>;
