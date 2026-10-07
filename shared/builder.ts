import { z } from "zod";

import { afterFixWords, CONNECT_AI_LINE, problemLine, stateOfLine } from "./connection";

import {
  DEFAULT_DAYS_PER_WEEK,
  DEFAULT_HOURS_PER_WEEK,
  MAX_DAYS_PER_WEEK,
  MAX_HOURS_PER_WEEK,
  MIN_DAYS_PER_WEEK,
  MIN_HOURS_PER_WEEK,
} from "./weeklyPlan";

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
  /**
   * How much of their week this person actually has, and over how many days.
   *
   * The weekly plan is built to fit these two numbers, which is the whole reason "My plan" can say
   * "14 h 30 min" instead of "190 h 50 min". The admin sets them at onboarding because only the
   * admin knows whether this hire is on training full-time or fitting it around delivery.
   */
  hoursPerWeek: z.number().int().min(MIN_HOURS_PER_WEEK).max(MAX_HOURS_PER_WEEK).default(DEFAULT_HOURS_PER_WEEK),
  daysPerWeek: z.number().int().min(MIN_DAYS_PER_WEEK).max(MAX_DAYS_PER_WEEK).default(DEFAULT_DAYS_PER_WEEK),
  /** Off: a week starts the day it is generated. On: it starts on the Monday of that week. */
  weekStartsMonday: z.boolean().default(false),
});
export type LearnerPriorities = z.infer<typeof learnerPrioritiesSchema>;

export const EMPTY_PRIORITIES: LearnerPriorities = {
  targetRole: "",
  mustHave: [],
  skip: [],
  deadlineWeeks: null,
  courseCap: 5,
  autoPublish: false,
  hoursPerWeek: DEFAULT_HOURS_PER_WEEK,
  daysPerWeek: DEFAULT_DAYS_PER_WEEK,
  weekStartsMonday: false,
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
// v4.4 (Phase 5): courses made automatically
// ---------------------------------------------------------------------------

/** `app_meta` key: publish a new course that passes its quality check. Absent = on. */
export const AUTO_PUBLISH_KEY = "builder.auto_publish";
/** How many times "Fix automatically" may rewrite a course before a person has to edit it. */
export const MAX_FIX_ATTEMPTS = 2;

/** What each check means, in words an admin reads in one line. Weakest first wins. */
const REVIEW_REASON: Record<(typeof REVIEW_CRITERIA)[number], string> = {
  accuracy: "Some facts may be wrong",
  depth: "The lessons are too thin",
  gapCoverage: "It doesn't teach what the learner is missing",
  linkQuality: "Some of its sources are weak",
  testQuality: "The quiz questions are too easy or unclear",
  noFiller: "It has too much filler",
};

/** One plain line saying why a course failed its quality check. */
export function plainReviewReason(review: CourseReview): string {
  const weakest = [...REVIEW_CRITERIA].sort((a, b) => review[a] - review[b])[0];
  const lessons = review.weakTopics.length;
  const where = lessons > 0 ? ` in ${lessons} lesson${lessons === 1 ? "" : "s"}` : "";
  return `${REVIEW_REASON[weakest]}${where}.`;
}

/**
 * The admin's notice when new courses reach the library for one learner, e.g. "We added 3 new
 * courses to the library for Rahul: A, B, C. They're also available to everyone now."
 */
export function coursesAddedMessage(learnerName: string, titles: readonly string[]): string {
  const n = titles.length;
  const head = `We added ${n} new course${n === 1 ? "" : "s"} to the library for ${learnerName}: ${titles.join(", ")}.`;
  return `${head} ${n === 1 ? "It's" : "They're"} also available to everyone now.`;
}

/**
 * The notice shown while a new course waits (v4.5: worded per state). v4.5.1: only the AI can block
 * a new course now; with no working AI credential the notice says exactly what to do.
 */
export function setupNeededMessage(problem: string, count = 1): string {
  const what = count === 1 ? "the course" : `${count} courses`;
  const head = `We couldn't create ${what} because ${problem}.`;
  if (problem.trim().replace(/\.$/, "") === problemLine("ai", "not_set_up")) return `${head} ${CONNECT_AI_LINE}. We'll finish automatically after that.`;
  return `${head} We'll finish automatically ${afterFixWords(stateOfLine(problem))}.`;
}

/**
 * v4.5.1: the path notice stored by builds before v4.4 ("3 targets still need a generated course.
 * No research provider is set up. Add one under Admin → AI connection."). It is never shown any
 * more: the re-check builds those paths again, and the live notice comes from the jobs.
 */
export function isLegacyResearchNotice(notice: string | null | undefined): boolean {
  if (!notice) return false;
  return /still needs? a generated course|no research provider|the web search isn't (?:connected|set up)|no api key for (?:tavily|brave|serper)/i.test(notice);
}

/** v4.5 P0: the path banner once new courses are made: "We added 1 new course for Priyanka: <title>". */
export function addedCoursesLine(learnerName: string, titles: readonly string[]): string {
  const first = learnerName.trim().split(/\s+/)[0] || learnerName;
  const n = titles.length;
  return `We added ${n} new course${n === 1 ? "" : "s"} for ${first}: ${titles.join(", ")}`;
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

/**
 * What kind of step an item is. v4.2: the learner's own track, AI-driven development, everything
 * else. v4.3 adds a missing-link refresher (`prerequisite`) and a goal's `capstone`.
 */
export const partTypeSchema = z.enum(["track", "ai_dev", "general", "prerequisite", "capstone"]);
export type PartType = z.infer<typeof partTypeSchema>;

export const PART_LABELS: Record<PartType, string> = {
  track: "Strengthen your track",
  ai_dev: "Building with AI",
  general: "Next",
  prerequisite: "Missing link",
  capstone: "Capstone",
};

/**
 * v4.3: a capstone path item has no course or module; `path_items.module_id` holds this prefix and
 * the goal id instead (no column was added for it), and the view links it to `/goals/:goalId`.
 */
export const GOAL_ITEM_PREFIX = "goal:";

/**
 * v4.4: a path item whose course is still being made. `path_items.module_id` holds this prefix and
 * the course key ("skill:<id>", "case:<id>" or "name:<skill>") until the course is ready, then the
 * item gets its `course_id`.
 */
export const NEW_COURSE_ITEM_PREFIX = "newcourse:";

/** True for a `module_id` that is a marker (capstone or a course being made), not a real module. */
export function isMarkerModuleId(moduleId: string | null | undefined): boolean {
  return Boolean(moduleId && (moduleId.startsWith(GOAL_ITEM_PREFIX) || moduleId.startsWith(NEW_COURSE_ITEM_PREFIX)));
}

/** Where a course being made is: working, waiting for setup, held for a look, or it could not be made. */
export type CreatingState = "working" | "waiting_setup" | "held" | "failed";

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
  /** Null on a path built before parts existed. Those render as the flat list they were. */
  partNumber: number | null;
  partType: PartType | null;
  /**
   * The admin target this item serves.
   *
   * The path tab groups by this: a course for a target, and the refreshers that target depends on,
   * under one heading in the admin's own order. Null on an older path and on a standalone suggestion.
   */
  targetSkill: string | null;
  /** Where the course starts. The only thing the assessment decides about a target. */
  startLevel: "beginner" | "intermediate" | "advanced" | null;
  /**
   * v4: a curriculum module attached in place of a course (from the skill catalog, no model call).
   * `courseTitle` then holds the module's name and `href` opens it.
   */
  moduleId?: string | null;
  skillId?: string | null;
  href?: string | null;
  /** v4.3: set on a capstone item: the goal it proves, and whether it is achieved. */
  goalId?: string | null;
  goalAchieved?: boolean;
  /** v4.4: set while this item's course is still being made (see `NEW_COURSE_ITEM_PREFIX`). */
  creating?: CreatingState | null;
  /** v4.5: why it waits (`waiting_setup`) or why it failed (`failed`), one plain clause. */
  problem?: string | null;
  /** v4.5: the failed job behind a `failed` item, for the admin's Retry. */
  retryJobId?: string | null;
  /**
   * v4.5: what this item builds on that is already scheduled earlier in the path. A course appears
   * once; a second mention becomes "Needs: React Fundamentals (earlier in your path)" here.
   */
  needs?: { title: string; itemId: string }[];
  /** v4.5 Phase 4: an Oyelabs course (the company's own material). Drives the "Oyelabs" badge. */
  oyelabs?: true;
}

export interface LearningPathView {
  id: string;
  status: PathStatus;
  progressNote: string;
  failureReason: string | null;
  /**
   * Something worth telling the admin about a run that *worked*.
   *
   * Distinct from `failureReason`, because conflating them is what put a "check the research
   * provider" banner next to a "nothing needed a course" message on the same screen.
   */
  notice: string | null;
  /** v4.4: set while a new course waits for the AI or web search to be connected (one plain line). */
  setupNeeded?: string | null;
  /** v4.5: new courses made for this path and published ("We added 1 new course for …"). */
  added?: { courseId: string; title: string }[];
  /** v4.5: the banner for `added`, already worded with the learner's first name. */
  addedLine?: string | null;
  /** v4.5: new courses for this path that failed 5 times ("Failed: …" with Retry). */
  failedCourses?: number;
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
