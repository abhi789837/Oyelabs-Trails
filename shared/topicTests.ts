import { z } from "zod";

/**
 * v4.3 Phase 5: topic tests that match the course and stay fair.
 *
 * A topic's test is a set of rows in `topic_test_items`: the static quiz questions imported from the
 * content file (`origin: "static"`) plus items written by the grounded generator (`origin:
 * "generated"`). Only `active` items are served. Every generated item cites the topic passage it
 * was built from (grounded generation, Lewis et al. 2020; see docs/v4.3/RESEARCH.md §5) and has
 * passed the quality gates in server/src/topicTests/gates.ts before a learner sees it.
 */

export const TEST_ITEM_STATUSES = ["active", "flagged", "retired", "draft"] as const;
export const testItemStatusSchema = z.enum(TEST_ITEM_STATUSES);
export type TestItemStatus = z.infer<typeof testItemStatusSchema>;

export const TEST_ITEM_ORIGINS = ["static", "generated"] as const;
export type TestItemOrigin = (typeof TEST_ITEM_ORIGINS)[number];

/** Difficulty bands for generated items: ≈50% recall/understand, 40% apply, 10% harder apply. */
export const TEST_ITEM_BANDS = ["recall", "apply", "harder_apply"] as const;
export const testItemBandSchema = z.enum(TEST_ITEM_BANDS);
export type TestItemBand = z.infer<typeof testItemBandSchema>;
export const BAND_MIX: Record<TestItemBand, number> = { recall: 0.5, apply: 0.4, harder_apply: 0.1 };

export interface TestItemCitation {
  passageId: string;
  /** An exact (whitespace-normalised) substring of the cited passage. */
  quote: string;
}

/** What `topic_test_items.item` holds. */
export interface TestItemPayload {
  prompt: string;
  options: string[];
  correctIndex: number;
  /** Present only for multi-select (two or more correct). */
  correctIndices?: number[];
  explanation: string;
  isEdgeCaseOrInterviewQuestion?: boolean;
  citation?: TestItemCitation | null;
  objectiveId?: string | null;
  band?: TestItemBand | null;
  /** One misconception per option index; null for a keyed option. Written by the writer (generated) or the checker (static). */
  distractorRationales?: (string | null)[];
  /** Static items: the content file's question order, so the test reads in authored order. */
  order?: number;
  /** Static items: hash of the source question, so a content edit updates the row. */
  sourceHash?: string;
  /** Set when an admin edited it; a later content edit then leaves it alone. */
  editedAt?: number;
}

// ---------------------------------------------------------------------------
// Grounding (topic_grounding.content)
// ---------------------------------------------------------------------------

export interface GroundingPassage {
  /** `sum.p1` for summary paragraphs, `s2.p3` for section 2 paragraph 3 (1-based, stable while the content is). */
  id: string;
  source: "summary" | "section";
  /** The heading a learner sees above this text ("Summary" for the summary). */
  heading: string;
  text: string;
}

export interface GroundingObjective {
  id: string;
  text: string;
  source: "explicit" | "derived";
}

export interface GroundingVideo {
  videoId: string;
  title: string;
  channel: string;
  /** No approved transcript method exists (RESEARCH §4), so this is always "none". */
  transcript: "none";
  /** Always false: the generator never claims to test video content it never saw. */
  usedForQuestions: false;
  /** Shown to admins. */
  note: string;
}

export interface TopicGroundingContent {
  version: 1;
  topicId: string;
  title: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  passages: GroundingPassage[];
  objectives: GroundingObjective[];
  videos: GroundingVideo[];
  /** Hash of the passages alone; generated items record it as `groundingHash`. */
  passagesHash: string;
}

// ---------------------------------------------------------------------------
// Sizes and thresholds
// ---------------------------------------------------------------------------

/**
 * Test size per topic, following the content standard (brief §6) and the v4.1 timing rules: an MCQ
 * slot is 20–50 s (shared/timing.ts), so 10 items is about 8 minutes and 5 is about 4.
 */
export const TEST_SIZE = { beginner: 5, default: 10, min: 5, max: 12 } as const;

export function targetItemCount(level: string, staticCount: number): number {
  if (staticCount > 0) return Math.max(TEST_SIZE.min, Math.min(TEST_SIZE.max, staticCount));
  return level === "beginner" ? TEST_SIZE.beginner : TEST_SIZE.default;
}

/** Never retire below this many active items; regenerate first. */
export function minimumActiveCount(target: number): number {
  return Math.min(TEST_SIZE.min, target);
}

/**
 * Calibration (classical test theory; RESEARCH §5). Counted on a learner's first exposure to an item
 * only, and never for staff, so retries after reading the explanations do not inflate pass rates.
 */
export const CALIBRATION = {
  /** "Strong" = this attempt scored at least this share on the *other* items of the topic. */
  strongRestShare: 0.9,
  /** Flag when more than this share fail, once there are enough attempts to mean anything. */
  hardFailRate: 0.9,
  minAttemptsToFlag: 10,
  /** Flag when at least this share of strong learners fail, given enough strong attempts. */
  strongFailShare: 0.5,
  minStrongAttempts: 5,
  /** A flagged item is retired automatically at this many attempts (if the topic keeps its minimum). */
  autoRetireAfter: 20,
  /** 100% pass after this many attempts → "review (too easy)", kept live. */
  tooEasyAfter: 20,
} as const;

/** Gate thresholds (Haladyna, Downing & Rodriguez 2002; RESEARCH §5). */
export const GATE_LIMITS = {
  minOptions: 3,
  maxOptions: 5,
  /** Per item: the key may not be the strictly longest option by more than this ratio. */
  longestKeyRatio: 1.3,
  /** Per test: at most this share of items may have the longest option keyed. */
  maxLongestKeyedShare: 0.4,
  /** Answering without the content, correct with at least this confidence (0–100) = trivial. */
  trivialConfidence: 90,
  /** Regeneration rounds after the first write. */
  maxRegenerations: 2,
} as const;

// ---------------------------------------------------------------------------
// Gate results (topic_test_items.gates)
// ---------------------------------------------------------------------------

export interface GateCheck {
  ok: boolean;
  /** Skipped checks are recorded rather than silently passed. */
  skipped?: boolean;
  detail?: string;
}

export interface TestItemGates {
  checkedAt: number;
  passed: boolean;
  /** Format/key/relevance failures are hard; soft ones may be kept to hold the minimum count. */
  hard: boolean;
  failures: string[];
  relevanceCode: GateCheck;
  relevanceAi: GateCheck;
  answerable: GateCheck;
  notTrivial: GateCheck;
  format: GateCheck;
  distractors: GateCheck;
  size: GateCheck;
  testLevel?: GateCheck;
}

// ---------------------------------------------------------------------------
// Admin API
// ---------------------------------------------------------------------------

export interface TestItemRow {
  id: string;
  /** The id a learner's answers use: the content question id for static items. */
  servedId: string;
  topicId: string;
  topicTitle: string;
  moduleId: string;
  trackId: string;
  origin: TestItemOrigin;
  status: TestItemStatus;
  item: TestItemPayload;
  gates: TestItemGates | null;
  attempts: number;
  passes: number;
  passRate: number | null;
  strongAttempts: number;
  strongFails: number;
  flagReason: string | null;
  retiredReason: string | null;
  citedPassage: GroundingPassage | null;
  createdAt: number;
  updatedAt: number;
}

export interface TestItemListResponse {
  items: TestItemRow[];
  total: number;
  counts: Partial<Record<TestItemStatus, number>>;
}

export const testItemListQuerySchema = z.object({
  topicId: z.string().max(120).optional(),
  moduleId: z.string().max(80).optional(),
  trackId: z.string().max(40).optional(),
  status: testItemStatusSchema.optional(),
  origin: z.enum(TEST_ITEM_ORIGINS).optional(),
  flagged: z.enum(["1", "0"]).optional(),
  q: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type TestItemListQuery = z.infer<typeof testItemListQuerySchema>;

export const testItemEditSchema = z.object({
  prompt: z.string().trim().min(5).max(2000),
  options: z.array(z.string().trim().min(1).max(500)).min(2).max(8),
  correctIndices: z.array(z.number().int().min(0).max(7)).min(1).max(7),
  explanation: z.string().trim().min(1).max(3000),
});
export type TestItemEdit = z.infer<typeof testItemEditSchema>;

export const recheckScopeSchema = z.object({
  kind: z.enum(["topic", "module", "track", "all"]),
  id: z.string().max(120).optional(),
});
export type RecheckScope = z.infer<typeof recheckScopeSchema>;

export interface RecheckCounts {
  topics: number;
  checked: number;
  retired: number;
  regenerated: number;
  dropped: number;
  /** Kept active although they failed, because retiring them would leave too few. */
  keptBelowMinimum: number;
  /**
   * Failed with no passage of the topic supporting them, where retiring would leave too few: set to
   * `flagged` (not served) rather than kept live, so every active item cites its passage (D9).
   * Optional: runs stored before D9 do not have it.
   */
  withdrawnUncited?: number;
  codeChecked: number;
  codeFailed: number;
  errors: number;
}

export interface RecheckRun {
  runId: string;
  scope: RecheckScope;
  status: "running" | "done" | "paused_budget" | "cancelled" | "failed";
  topicIds: string[];
  cursor: number;
  startedAt: number;
  finishedAt: number | null;
  budgetUsd: number;
  spentUsd: number;
  counts: RecheckCounts;
  lastError: string | null;
}

export interface CostEstimate {
  topics: number;
  items: number;
  assumedFailShare: number;
  checkUsd: number;
  generateUsd: number;
  totalUsd: number;
  basis: string;
}

export interface TestItemsSummary {
  counts: Partial<Record<TestItemStatus, number>>;
  byOrigin: Partial<Record<TestItemOrigin, number>>;
  flagged: number;
  run: RecheckRun | null;
  budgetUsd: number;
  estimate: CostEstimate;
}
