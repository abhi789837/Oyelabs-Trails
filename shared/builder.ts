import { z } from "zod";

/**
 * The AI course builder's contracts — the shapes the model must return, and the shapes the UI
 * reads.
 *
 * Every model reply is validated against one of these before anything is stored. That is the whole
 * defence: a course is assembled from several generations, and one un-validated step would put
 * invented structure into a table the renderer trusts.
 *
 * See `docs/ai-course-builder.md` for how the pieces fit together.
 */

// ---------------------------------------------------------------------------
// Priorities — what the admin set at onboarding
// ---------------------------------------------------------------------------

export const skillWeightSchema = z.enum(["high", "medium", "low"]);
export type SkillWeight = z.infer<typeof skillWeightSchema>;

/**
 * What one weight is worth when scoring.
 *
 * A skill the AI found but the admin never mentioned sits at 0.5 — below a Medium, above a Low.
 * The reasoning: the test is good evidence that something is missing, but the admin is the only
 * one who knows whether it matters for the job this person was hired to do.
 */
export const WEIGHT_VALUE: Record<SkillWeight, number> = { high: 1, medium: 0.6, low: 0.3 };
export const AI_ONLY_WEIGHT = 0.5;

/** Below this a match is not a match, and the builder writes a new course instead. */
export const MATCH_CONFIDENCE_THRESHOLD = 0.75;

/** A generated course must reach this overall, with no single criterion below `MIN_CRITERION`. */
export const REVIEW_PASS_SCORE = 4;
export const MIN_CRITERION = 3;

/** How many times one failing topic is rewritten before the course is flagged for a human. */
export const MAX_TOPIC_RETRIES = 2;

export const mustHaveSkillSchema = z.object({
  skill: z.string().trim().min(2).max(80),
  weight: skillWeightSchema,
});
export type MustHaveSkill = z.infer<typeof mustHaveSkillSchema>;

export const learnerPrioritiesSchema = z.object({
  targetRole: z.string().trim().max(120).default(""),
  mustHave: z.array(mustHaveSkillSchema).max(20).default([]),
  skip: z.array(z.string().trim().min(2).max(80)).max(20).default([]),
  deadlineWeeks: z.number().int().min(1).max(104).nullable().default(null),
  courseCap: z.number().int().min(1).max(20).default(5),
  autoPublish: z.boolean().default(false),
});
export type LearnerPriorities = z.infer<typeof learnerPrioritiesSchema>;

export const EMPTY_PRIORITIES: LearnerPriorities = {
  targetRole: "",
  mustHave: [],
  skip: [],
  deadlineWeeks: null,
  courseCap: 5,
  autoPublish: false,
};

// ---------------------------------------------------------------------------
// Gap analysis
// ---------------------------------------------------------------------------

export const gapSourceSchema = z.enum(["admin_priority", "ai_detected", "both"]);
export type GapSource = z.infer<typeof gapSourceSchema>;

export const gapEvidenceSchema = z.object({
  /** One plain sentence, shown to the learner. No jargon, no scores. */
  summary: z.string().trim().min(10).max(400),
  itemIds: z.array(z.string().max(64)).max(40).default([]),
  missed: z.number().int().min(0).default(0),
  asked: z.number().int().min(0).default(0),
});
export type GapEvidence = z.infer<typeof gapEvidenceSchema>;

/** What the model returns when asked to read an assessment for gaps. */
export const detectedGapSchema = z.object({
  skill: z.string().trim().min(2).max(80),
  severity: z.number().min(0).max(1),
  /** 0-1: how much this skill matters for the stated target role. */
  roleRelevance: z.number().min(0).max(1),
  evidence: gapEvidenceSchema,
});
export type DetectedGap = z.infer<typeof detectedGapSchema>;

export const gapAnalysisSchema = z.object({
  gaps: z.array(detectedGapSchema).min(1).max(20),
});
export type GapAnalysis = z.infer<typeof gapAnalysisSchema>;

/** A scored, ordered gap — what the path is built from. */
export interface ScoredGap {
  skill: string;
  severity: number;
  roleRelevance: number;
  weight: number;
  source: GapSource;
  priorityScore: number;
  evidence: GapEvidence;
  /** On the admin's skip list: recorded as a gap, never turned into a course. */
  skipped: boolean;
}

// ---------------------------------------------------------------------------
// Matching an existing course
// ---------------------------------------------------------------------------

export const courseMatchSchema = z.object({
  /** The id of the best candidate, or null when none of them covers the skill. */
  courseId: z.string().max(64).nullable(),
  confidence: z.number().min(0).max(1),
  reason: z.string().trim().max(400).default(""),
});
export type CourseMatch = z.infer<typeof courseMatchSchema>;

// ---------------------------------------------------------------------------
// Generating a course
// ---------------------------------------------------------------------------

/** Step one: an outline, and the searches that should back each topic. */
export const coursePlanSchema = z.object({
  title: z.string().trim().min(4).max(120),
  summary: z.string().trim().min(20).max(400),
  sections: z
    .array(
      z.object({
        title: z.string().trim().min(3).max(120),
        summary: z.string().trim().max(400).default(""),
        topics: z
          .array(
            z.object({
              title: z.string().trim().min(3).max(160),
              /** What the learner should be able to do afterwards. Anchors the test questions. */
              objective: z.string().trim().min(10).max(300),
              /** What to search the web for. The model never supplies URLs — only queries. */
              searchQueries: z.array(z.string().trim().min(3).max(120)).min(1).max(4),
              videoQuery: z.string().trim().min(3).max(120),
              estMinutes: z.number().int().min(3).max(120).default(15),
            }),
          )
          .min(1)
          .max(8),
      }),
    )
    .min(1)
    .max(6),
});
export type CoursePlan = z.infer<typeof coursePlanSchema>;

export const practiceTaskSchema = z.object({
  task: z.string().trim().min(20).max(2000),
  acceptanceCriteria: z.array(z.string().trim().min(5).max(300)).min(1).max(8),
  hint: z.string().trim().max(600).default(""),
});
export type PracticeTask = z.infer<typeof practiceTaskSchema>;

export const courseTestQuestionSchema = z.object({
  id: z.string().trim().min(1).max(40),
  kind: z.enum(["mcq", "multi", "scenario"]),
  prompt: z.string().trim().min(10).max(2000),
  options: z.array(z.string().trim().min(1).max(500)).min(2).max(8),
  /** Always a list, even for a single-answer question — one grading path, not two. */
  correctIndices: z.array(z.number().int().min(0).max(7)).min(1).max(8),
  explanation: z.string().trim().min(10).max(1200),
  /** Ties the question back to the topic objective it is testing. */
  objective: z.string().trim().max(300).default(""),
});
export type CourseTestQuestion = z.infer<typeof courseTestQuestionSchema>;

export const courseTestSchema = z.object({
  questions: z.array(courseTestQuestionSchema).min(10).max(20),
  /** Percent. Matches the curriculum's own bar so "passed" means one thing across the app. */
  passScore: z.number().int().min(50).max(100).default(80),
});
export type CourseTest = z.infer<typeof courseTestSchema>;

/**
 * Step four: one written topic.
 *
 * `references` and `videoId` may only name sources the server verified and handed to the model.
 * The write prompt says so, and `assertCitesOnlyVerified` proves it before anything is stored —
 * because a prompt is an instruction and a check is a guarantee.
 */
export const writtenTopicSchema = z.object({
  summary: z.string().trim().min(80).max(4000),
  keyConcepts: z.array(z.string().trim().min(3).max(200)).min(2).max(10),
  references: z
    .array(
      z.object({
        url: z.string().trim().url().max(500),
        label: z.string().trim().min(3).max(160),
        /** One line on why this one is worth reading, rather than a bare list of links. */
        why: z.string().trim().min(10).max(300),
      }),
    )
    .min(3)
    .max(6),
  videoId: z.string().trim().max(20).nullable(),
  practice: practiceTaskSchema,
  test: courseTestSchema,
});
export type WrittenTopic = z.infer<typeof writtenTopicSchema>;

/** Step five: the rubric. Each criterion 1-5; see `REVIEW_PASS_SCORE`. */
export const reviewSchema = z.object({
  accuracy: z.number().min(1).max(5),
  depth: z.number().min(1).max(5),
  gapCoverage: z.number().min(1).max(5),
  linkQuality: z.number().min(1).max(5),
  testQuality: z.number().min(1).max(5),
  noFiller: z.number().min(1).max(5),
  notes: z.string().trim().max(2000).default(""),
  /** Titles of topics the reviewer wants rewritten. Empty when the course passed as written. */
  weakTopics: z.array(z.string().trim().max(160)).max(20).default([]),
});
export type CourseReview = z.infer<typeof reviewSchema>;

export const REVIEW_CRITERIA = [
  "accuracy",
  "depth",
  "gapCoverage",
  "linkQuality",
  "testQuality",
  "noFiller",
] as const satisfies readonly (keyof CourseReview)[];

/** The mean of the six criteria — the number compared against `REVIEW_PASS_SCORE`. */
export function reviewScore(review: CourseReview): number {
  const total = REVIEW_CRITERIA.reduce((sum, key) => sum + review[key], 0);
  return total / REVIEW_CRITERIA.length;
}

/**
 * Whether a course may be released.
 *
 * Both halves matter. A mean of 4.2 with `linkQuality: 2` is a course whose links do not work, and
 * averaging that away would ship exactly the failure this pipeline exists to prevent.
 */
export function reviewPasses(review: CourseReview): boolean {
  if (REVIEW_CRITERIA.some((key) => review[key] < MIN_CRITERION)) return false;
  return reviewScore(review) >= REVIEW_PASS_SCORE;
}

// ---------------------------------------------------------------------------
// What the UI reads
// ---------------------------------------------------------------------------

export const pathStatusSchema = z.enum([
  "analysing",
  "researching",
  "writing",
  "reviewing",
  "ready",
  "failed",
  "budget_reached",
]);
export type PathStatus = z.infer<typeof pathStatusSchema>;

export const pathItemSourceSchema = z.enum(["unlock", "reuse", "generated"]);
export type PathItemSource = z.infer<typeof pathItemSourceSchema>;

export interface PathItemView {
  id: string;
  courseId: string | null;
  courseTitle: string;
  position: number;
  source: PathItemSource;
  reason: string;
  topicCount: number;
  completedCount: number;
  /** False while a generated course is still a draft — the learner cannot open it yet. */
  available: boolean;
}

export interface LearningPathView {
  id: string;
  status: PathStatus;
  progressNote: string;
  failureReason: string | null;
  createdAt: number;
  completedAt: number | null;
  items: PathItemView[];
}

export interface SkillGapView {
  id: string;
  skill: string;
  severity: number;
  source: GapSource;
  priorityScore: number;
  skipped: boolean;
  evidence: GapEvidence;
}

/** The statuses where the builder is still working, so the UI knows to keep polling. */
export const BUSY_PATH_STATUSES = ["analysing", "researching", "writing", "reviewing"] as const;

export function isPathBusy(status: PathStatus): boolean {
  return (BUSY_PATH_STATUSES as readonly string[]).includes(status);
}
