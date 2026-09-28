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
  mcq: 75,
  multi: 90,
  predict_output: 120,
  find_bug: 120,
  // Trimmed with the overall budget: at the old 600s a single code item was a fifth of the whole
  // sitting, which is not a proportion any one question should own.
  code: 360,
  explain: 180,
};

/**
 * The longest a sitting may run, end to end — **this is the number that matters.**
 *
 * The deadline a learner actually sees is `timeLimitMinutes + EXPLAIN_BUDGET_MIN`, because the
 * written section has its own budget on the end. Capping only the first of those is how a "60
 * minute" assessment came to show a 75-minute clock. Everything below is derived from this, so
 * changing it here changes the real ceiling.
 */
export const MAX_TOTAL_MIN = 30;
/** Explain items get their own budget at the end of the test (§9.4). */
export const EXPLAIN_BUDGET_MIN = 6;
/** What is left for the adaptive section once the written budget is reserved. */
export const MAX_TIME_LIMIT_MIN = MAX_TOTAL_MIN - EXPLAIN_BUDGET_MIN;
export const DEFAULT_TIME_LIMIT_MIN = MAX_TIME_LIMIT_MIN;
/** Below this there is not enough room for a staircase to settle in any area. */
export const MIN_TIME_LIMIT_MIN = 10;
/**
 * How long a generated assessment waits for the superadmin before it is released anyway.
 *
 * Review is a gate, not a bottleneck: if nobody looks within this window the sweeper approves it
 * so a learner is never blocked by an admin who is on leave. Auto-approval is recorded distinctly
 * from a human one — "nobody looked at this" is a different fact from "someone read it and said
 * yes". Change it here; nothing else hard-codes five minutes.
 */
export const AUTO_APPROVE_AFTER_MS = 5 * 60_000;
/* Resized for the 30-minute ceiling. At ~80 seconds an item, 24 minutes of adaptive testing is
   roughly 18 items; the range leaves the blueprint room either side of that. */
export const MIN_ITEM_TARGET = 12;
export const MAX_ITEM_TARGET = 20;

/**
 * How many modules one blueprint area may name. Exported because the mock fixture has to respect
 * it too: it once spread every module across its areas, which silently began failing validation
 * the moment the curriculum grew past 48 modules.
 */
export const MAX_AREA_MODULES = 8;

export const blueprintAreaSchema = z.object({
  name: z.string().trim().min(2).max(60),
  /** Module ids from the digest. Validated server-side; unknown ids are dropped. */
  moduleIds: z.array(z.string().min(1).max(80)).min(1).max(MAX_AREA_MODULES),
  /** What the admin's notes suggest this person's level is, before testing. */
  hypothesisLevel: skillLevelSchema,
  rationale: z.string().trim().min(10).max(600),
});
export type BlueprintArea = z.infer<typeof blueprintAreaSchema>;

export const blueprintSchema = z.object({
  /* Fewer areas than before. With 12–20 items, nine areas would leave two items each — not enough
     for an adaptive staircase to reverse even once, which makes the level it reports a guess. */
  areas: z.array(blueprintAreaSchema).min(3).max(6),
  timeLimitMinutes: z.number().int().min(MIN_TIME_LIMIT_MIN).max(MAX_TIME_LIMIT_MIN),
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

/**
 * The same batch, accepted element by element.
 *
 * `z.array(generatedItemSchema)` is all-or-nothing: one item missing its `rationale` fails the
 * parse and throws away the nineteen good ones beside it. That is what it did on a live
 * deployment — a whole generation lost to a single field — even though this pipeline is built
 * around dropping the items it cannot use and keeping the rest.
 *
 * So the envelope is parsed with this, and each element is then checked against
 * `generatedItemSchema` on its own (`splitItemBatch`). `itemBatchSchema` remains the contract:
 * it is what the model is *asked* for, and nothing but the prose in the prompt would otherwise
 * tell it that a `rationale` is required at all. This is only what we are willing to receive.
 */
export const looseItemBatchSchema = z.object({ items: z.array(z.unknown()).min(1).max(30) });
export type LooseItemBatch = z.infer<typeof looseItemBatchSchema>;

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
  /** What this sitting is for, when a learner holds several. Null on anything issued without one. */
  label: z.string().nullable(),
  status: assessmentStatusSchema,
  createdAt: z.number(),
  startedAt: z.number().nullable(),
  deadlineAt: z.number().nullable(),
  submittedAt: z.number().nullable(),
  terminatedReason: z.string().nullable(),
  hardWarnings: z.number(),
  softWarnings: z.number(),
  /** When generation finished and the approval clock started. */
  awaitingApprovalSince: z.number().nullable(),
  approvedAt: z.number().nullable(),
  /**
   * The superadmin who approved it. Null *with* `approvedAt` set means nobody did: the deadline
   * released it. The UI says which, because they are not the same assurance.
   */
  approvedBy: z.string().nullable(),
  blueprint: z.custom<Blueprint | null>(),
  /** Counts by item status, so the admin can see a pool at a glance. */
  itemCounts: z.record(z.string(), z.number()),
});
export type AssessmentSummary = z.infer<typeof assessmentSummarySchema>;

export const issueAssessmentRequestSchema = z.object({
  /** Overrides the blueprint's own suggestion. */
  timeLimitMinutes: z.number().int().min(MIN_TIME_LIMIT_MIN).max(MAX_TIME_LIMIT_MIN).optional(),
  /**
   * What this sitting is for, when someone holds more than one at a time.
   *
   * Optional, because most people only ever have one and "Attempt 2" says everything there is to
   * say about it. It earns its place the moment a second one exists alongside the first.
   */
  label: z.string().trim().min(2).max(60).optional(),
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

// ---------------------------------------------------------------------------
// Taking the test (brief §9.5)
// ---------------------------------------------------------------------------

/**
 * What the learner agreed to be monitored by.
 *
 * Bumped whenever the wording of the consent screen changes in a way that changes what is being
 * agreed to. A stored consent at an older version does not count and the learner is asked again —
 * the only honest behaviour when the thing they said yes to has changed.
 */
export const CONSENT_POLICY_VERSION = "2026-09-proctoring-v1";

/**
 * Which permissions were actually granted, as facts rather than promises.
 *
 * The client sets these from the real state — `getUserMedia` resolved with a live track, the
 * fullscreen request succeeded — not from a checkbox. A record saying camera was granted when it
 * was not is worse than no record, because it is evidence of something that did not happen.
 */
export const consentPermissionsSchema = z.object({
  camera: z.boolean(),
  microphone: z.boolean(),
  fullscreen: z.boolean(),
  tabMonitoring: z.boolean(),
});
export type ConsentPermissions = z.infer<typeof consentPermissionsSchema>;

/**
 * The consent payload. **One schema, imported by both sides**, so the field names cannot drift —
 * which is how this route came to be broken in the first place.
 *
 * `permissions` and `policyVersion` are optional so that a client which predates them still
 * consents successfully; the record then simply says less. `agreed` is not optional, and it must
 * be exactly `true` rather than merely truthy.
 */
export const consentRequestSchema = z.object({
  agreed: z.literal(true, { error: "Consent is required before the assessment can start." }),
  permissions: consentPermissionsSchema.optional(),
  policyVersion: z.string().trim().max(60).optional(),
});
export type ConsentRequest = z.infer<typeof consentRequestSchema>;

/**
 * The start payload.
 *
 * Empty in the ordinary flow, because consent was recorded by the call before it. `consent` is
 * accepted inline so a single call also works — belt and braces against exactly the failure this
 * schema's history is about: a client that forgets to consent first cannot silently produce a 400.
 */
export const startRequestSchema = z.object({
  consent: consentRequestSchema.optional(),
});
export type StartRequest = z.infer<typeof startRequestSchema>;

/** What the pre-flight screen needs to know before it asks again. */
export const consentStatusSchema = z.object({
  recorded: z.boolean(),
  /** Null when nothing is recorded, or when the record predates version tracking. */
  policyVersion: z.string().nullable(),
  recordedAt: z.number().nullable(),
  /** True when a record exists but is out of date, so the learner is asked again. */
  stale: z.boolean(),
});
export type ConsentStatus = z.infer<typeof consentStatusSchema>;

export const startResponseSchema = z.object({
  deadlineAt: z.number(),
  config: z.object({
    timeLimitMinutes: z.number(),
    hardLimit: z.number(),
    areas: z.array(z.string()),
  }),
});
export type StartResponse = z.infer<typeof startResponseSchema>;

/** One item as the learner sees it. Nothing here reveals the answer. */
export interface ServedItem {
  id: string;
  kind: z.infer<typeof itemKindSchema>;
  payload: ItemPayload;
  /** Absolute epoch ms by which this item must be answered, including its grace period. */
  expiresAt: number;
}

export interface NextItemResponse {
  item: ServedItem | null;
  done: boolean;
  /** Where they are, for a progress strip. Never their score. */
  progress: { answered: number; target: number; section: "adaptive" | "written" };
  deadlineAt: number;
  hardWarnings: number;
}

export const answerRequestSchema = z.object({
  /** mcq, multi, find_bug: original option indices, not shuffled positions. */
  selected: z.array(z.number().int().min(0).max(10)).max(10).optional(),
  /** predict_output and explain. */
  text: z.string().max(8000).optional(),
  /** code */
  code: z.string().max(40_000).optional(),
});
export type AnswerRequest = z.infer<typeof answerRequestSchema>;

export const heartbeatRequestSchema = z.object({
  visible: z.boolean(),
  fullscreen: z.boolean(),
  faceState: z.enum(["one", "none", "multiple", "unknown"]),
  cameraLive: z.boolean(),
});
export type HeartbeatRequest = z.infer<typeof heartbeatRequestSchema>;

export const integrityEventRequestSchema = z.object({
  type: z.string().trim().min(2).max(60),
  severity: z.enum(["soft", "hard"]),
  clientTs: z.number().int().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});
export type IntegrityEventRequest = z.infer<typeof integrityEventRequestSchema>;

export const integrityEventResponseSchema = z.object({
  counted: z.boolean(),
  escalated: z.boolean(),
  hardWarnings: z.number(),
  hardLimit: z.number(),
  terminated: z.boolean(),
  /** How long the client may pause the item timer for this warning. */
  pauseMs: z.number(),
});
export type IntegrityEventResponse = z.infer<typeof integrityEventResponseSchema>;

/** The learner's own view of an assessment, for the funnel in §12. */
export interface MyAssessment {
  id: string;
  status: z.infer<typeof assessmentStatusSchema>;
  attemptNo: number;
  /** What this one is for, when several are open. Null falls back to the attempt number. */
  label: string | null;
  consentAt: number | null;
  deadlineAt: number | null;
  hardWarnings: number;
  hardLimit: number;
  timeLimitMinutes: number;
}

// ---------------------------------------------------------------------------
// Evaluation (brief §11.1)
// ---------------------------------------------------------------------------

export const confidenceSchema = z.enum(["low", "medium", "high"]);

export const evaluationAreaSchema = z.object({
  area: z.string().trim().min(2).max(80),
  level: skillLevelSchema,
  confidence: confidenceSchema,
  /** Item ids, so a claim can be traced back to what they actually answered. */
  evidence: z.array(z.string().max(64)).max(12),
  strengths: z.array(z.string().trim().min(3).max(300)).max(6),
  gaps: z.array(z.string().trim().min(3).max(300)).max(6),
});
export type EvaluationArea = z.infer<typeof evaluationAreaSchema>;

export const evaluationPlanSchema = z.object({
  /** Ordered. Validated server-side: unknown ids are dropped and the rest sorted into trail order. */
  topicIds: z.array(z.string().min(1).max(120)).min(1).max(400),
  skipRationale: z.array(z.object({ moduleId: z.string().max(80), reason: z.string().trim().min(5).max(400) })).max(40),
  milestones: z.array(z.string().min(1).max(120)).max(40),
  estimatedHours: z.number().min(1).max(2000),
  rationale: z.string().trim().min(20).max(4000),
});

export const evaluationResultSchema = z.object({
  /** For the admin, not the learner. */
  summary: z.string().trim().min(50).max(4000),
  overallLevel: skillLevelSchema,
  areas: z.array(evaluationAreaSchema).min(1).max(12),
  notesVsReality: z.string().trim().min(20).max(3000),
  integrity: z.object({
    assessment: z.enum(["clean", "minor_concerns", "serious_concerns"]),
    explanation: z.string().trim().min(10).max(2000),
  }),
  plan: evaluationPlanSchema,
  /** Written for the learner: strengths and focus areas, no integrity detail, no admin notes. */
  learnerSummary: z.string().trim().min(50).max(2500),
});
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

export const explainGradeSchema = z.object({
  grades: z
    .array(
      z.object({
        itemId: z.string().min(1).max(64),
        /** Which rubric points the answer hit, by index. */
        pointsHit: z.array(z.number().int().min(0).max(10)).max(10),
        score: z.number().min(0).max(1),
        feedback: z.string().trim().min(5).max(600),
      }),
    )
    .min(1)
    .max(12),
});
export type ExplainGrades = z.infer<typeof explainGradeSchema>;

/** The learner's own view of their evaluation, stripped of everything §12 says to withhold. */
export interface MyEvaluation {
  overallLevel: SkillLevelValue;
  learnerSummary: string;
  areas: { area: string; level: SkillLevelValue; strengths: string[]; gaps: string[] }[];
  estimatedHours: number;
}

type SkillLevelValue = z.infer<typeof skillLevelSchema>;

// ---------------------------------------------------------------------------
// Watching a generation run (brief §13)
// ---------------------------------------------------------------------------

/** Which part of the `assessment.blueprint` job a line came from. */
export const generationStageSchema = z.enum(["start", "blueprint", "items", "critic", "explain", "verify", "finish"]);
export type GenerationStage = z.infer<typeof generationStageSchema>;

export const generationLevelSchema = z.enum(["info", "warn", "error"]);
export type GenerationLevel = z.infer<typeof generationLevelSchema>;

/**
 * One line of the generation log.
 *
 * `message` is the only free text here, and it is built from fixed phrases and redacted before it
 * is stored — never from an item's options, key, rationale or solution. See
 * `server/src/assessment/generationLog.ts` for what is allowed into one and why.
 */
export interface GenerationLogLine {
  assessmentId: string;
  /** Per assessment, from 1. The ordering key: several lines can share a millisecond. */
  seq: number;
  stage: GenerationStage;
  level: GenerationLevel;
  message: string;
  /** Present on a line that reports a finished provider call. */
  inputTokens: number | null;
  outputTokens: number | null;
  elapsedMs: number | null;
  at: number;
}

export interface GenerationLogResponse {
  status: z.infer<typeof assessmentStatusSchema>;
  /** True when the oldest lines were dropped to keep one run bounded. */
  truncated: boolean;
  lines: GenerationLogLine[];
}
