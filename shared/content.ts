import { z } from "zod";

import { topicLevelSchema, trackIdSchema, type TopicLevelValue, type TrackIdValue } from "./enums";

/**
 * The curriculum as the *client* sees it.
 *
 * From v3 the server owns the content (brief §7): it filters modules and topics to the caller's
 * published plan and strips every answer key before responding. These types describe what comes
 * back over the wire; the authoring types in src/types/curriculum.ts stay the source of truth for
 * what content authors write.
 */

// ---------------------------------------------------------------------------
// Manifest (the always-loaded table of contents)
// ---------------------------------------------------------------------------

export const challengeTypeSchema = z.enum(["quiz", "code"]);
export type ChallengeTypeValue = z.infer<typeof challengeTypeSchema>;

export const accentTokenSchema = z.enum(["trailmark", "summit", "ridge", "glacier", "basalt", "canyon", "alpenglow", "lichen"]);
export type AccentTokenValue = z.infer<typeof accentTokenSchema>;

export const resourceKindSchema = z.enum(["docs", "article", "interview-prep", "spec", "repo"]);

export const topicResourceSchema = z.object({
  label: z.string(),
  url: z.string(),
  kind: resourceKindSchema,
});
export type TopicResourceValue = z.infer<typeof topicResourceSchema>;

export interface TopicMeta {
  id: string;
  moduleId: string;
  trackId: TrackIdValue;
  title: string;
  level: TopicLevelValue;
  estMinutes: number;
  isMilestone?: boolean;
  challengeType: ChallengeTypeValue;
  /** Quiz question count or code test count (visible + hidden). */
  challengeSize: number;
}

export interface ModuleMeta {
  id: string;
  trackId: TrackIdValue;
  name: string;
  description: string;
  refs?: TopicResourceValue[];
  topics: TopicMeta[];
  /** False while a module listed in the registry has not been written yet. */
  available: boolean;
}

export interface TrackMeta {
  id: TrackIdValue;
  name: string;
  tagline: string;
  accentToken: AccentTokenValue;
  modules: ModuleMeta[];
}

export const manifestResponseSchema = z.object({
  tracks: z.array(z.custom<TrackMeta>()),
  /** True when the caller sees the whole curriculum (superadmin) rather than a plan. */
  unfiltered: z.boolean(),
  /** Ordered plan topic ids, empty for an unfiltered view. */
  planTopicIds: z.array(z.string()),
  planVersion: z.number().nullable(),
});
export type ManifestResponse = z.infer<typeof manifestResponseSchema>;

// ---------------------------------------------------------------------------
// Served module content
// ---------------------------------------------------------------------------

export interface ServedVideo {
  title: string;
  channel: string;
  url: string;
  videoId: string;
  startSeconds?: number;
  chapterLabel?: string;
  durationLabel?: string;
}

/**
 * A quiz question without its answer. `correctIndices` and `explanation` are absent for a learner
 * until they submit an attempt, and present for a superadmin, who is allowed to see everything.
 */
export interface ServedQuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** True when two or more options are correct; grading is all-or-nothing. */
  multi: boolean;
  correctIndices?: number[];
  explanation?: string;
  isEdgeCaseOrInterviewQuestion?: boolean;
}

export interface ServedTestCase {
  args: unknown[];
  expected: unknown;
  description: string;
  isEdgeCase?: boolean;
}

export interface ServedCodeChallenge {
  instructions: string;
  starterCode: string;
  functionName: string;
  /** The tests the learner can run in the browser for fast feedback. */
  visibleTests: ServedTestCase[];
  /** How many more run on the server at submit time. Shown so the count is not a surprise. */
  hiddenTestCount: number;
}

export interface ServedTopic {
  id: string;
  moduleId: string;
  trackId: TrackIdValue;
  title: string;
  summary: string;
  level: TopicLevelValue;
  estMinutes: number;
  isMilestone?: boolean;
  webRefs: TopicResourceValue[];
  video: ServedVideo;
  alternateVideos?: ServedVideo[];
  challengeType: ChallengeTypeValue;
  quiz?: ServedQuizQuestion[];
  codeChallenge?: ServedCodeChallenge;
}

export interface ServedModule {
  id: string;
  trackId: TrackIdValue;
  name: string;
  description: string;
  refs?: TopicResourceValue[];
  topics: ServedTopic[];
}

export const servedModuleParamsSchema = z.object({
  trackId: trackIdSchema,
  moduleId: z.string().min(1).max(80),
});

// ---------------------------------------------------------------------------
// Attempts
// ---------------------------------------------------------------------------

/** Quizzes pass at 80%; code challenges only pass when every test passes. Enforced server-side. */
export const QUIZ_PASS_THRESHOLD = 80;

/**
 * Answers are sent as *original* option indices, not the shuffled positions the learner saw.
 * The client keeps its seeded shuffle for display and maps back before sending, so the server
 * never has to know about the shuffle.
 */
export const quizAttemptRequestSchema = z.object({
  kind: z.literal("quiz"),
  answers: z.record(z.string(), z.array(z.number().int().min(0).max(32))),
});

export const codeAttemptRequestSchema = z.object({
  kind: z.literal("code"),
  code: z.string().max(100_000),
});

export const attemptRequestSchema = z.discriminatedUnion("kind", [quizAttemptRequestSchema, codeAttemptRequestSchema]);
export type AttemptRequest = z.infer<typeof attemptRequestSchema>;

export interface QuizQuestionResult {
  id: string;
  correct: boolean;
  correctIndices: number[];
  explanation: string;
}

export interface QuizAttemptResult {
  kind: "quiz";
  score: number;
  passed: boolean;
  correctCount: number;
  total: number;
  perQuestion: QuizQuestionResult[];
}

export interface CodeTestResult {
  description: string;
  passed: boolean;
  hidden: boolean;
  isEdgeCase?: boolean;
  /** Only ever populated for visible tests — a hidden test never reveals its data. */
  expected?: string;
  actual?: string;
  error?: string;
}

export interface CodeAttemptResult {
  kind: "code";
  score: number;
  passed: boolean;
  passedCount: number;
  total: number;
  results: CodeTestResult[];
  compileError?: string;
  timedOut?: boolean;
}

export type AttemptResult = QuizAttemptResult | CodeAttemptResult;

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export const topicProgressSchema = z.object({
  status: z.enum(["not-started", "in-progress", "completed"]),
  bestScore: z.number().nullable(),
  attempts: z.number(),
  completedAt: z.number().nullable(),
});
export type TopicProgressValue = z.infer<typeof topicProgressSchema>;

export const progressResponseSchema = z.object({
  progress: z.record(z.string(), topicProgressSchema),
});
export type ProgressResponse = z.infer<typeof progressResponseSchema>;

export const markInProgressRequestSchema = z.object({ topicId: z.string().min(1).max(120) });

export { topicLevelSchema, trackIdSchema };
