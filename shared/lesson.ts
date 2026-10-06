import { z } from "zod";

import { LESSON_STEP_IDS, NOTE_BODY_MAX, PROBLEM_MESSAGE_MAX, TUTOR_CODE_MAX, TUTOR_QUESTION_MAX } from "./lessonCore";

/**
 * v5 lesson player: the request schemas (zod) for the lesson API. Everything else, the rules both
 * sides share, lives in the zod-free `./lessonCore` and is re-exported here, so server code keeps
 * importing `@shared/lesson`. Client code that ships in the lesson's first download imports values
 * from `@shared/lessonCore` instead (type imports from here are fine: they are erased).
 */
export * from "./lessonCore";

export const lessonStepSchema = z.enum(LESSON_STEP_IDS);

export const tutorAskSchema = z.object({
  question: z.string().trim().min(2).max(TUTOR_QUESTION_MAX),
  step: lessonStepSchema,
  code: z.string().max(TUTOR_CODE_MAX).optional(),
});

export type TutorAskRequest = z.infer<typeof tutorAskSchema>;

export const tutorRatingSchema = z.object({ rating: z.union([z.literal(-1), z.literal(0), z.literal(1)]) });

export const lessonStatePutSchema = z.object({
  step: lessonStepSchema.optional(),
  stepDone: z.object({ watch: z.boolean(), read: z.boolean(), do: z.boolean(), check: z.boolean() }).partial().optional(),
  videoId: z.string().max(32).nullable().optional(),
  positionSec: z.number().min(0).max(24 * 3600).nullable().optional(),
  /** Non-code Do step: the learner asked to see the worked answer early (halves the step's XP). */
  solutionTraded: z.boolean().optional(),
  /** Non-code Do step: checks run (client-graded practice). */
  doAttempts: z.number().int().min(0).max(100).optional(),
});

export type LessonStatePut = z.infer<typeof lessonStatePutSchema>;

export const quickCheckAnswerSchema = z.object({
  answers: z.record(z.string().max(80), z.array(z.number().int().min(0).max(32)).max(32)),
});

export const runRequestSchema = z.discriminatedUnion("mode", [
  /** "Try it" on the Read step: run a script, return what it printed. */
  z.object({ mode: z.literal("snippet"), code: z.string().max(20_000) }),
  /** "Run" on the Do step: the visible checks only; never recorded as an attempt. */
  z.object({ mode: z.literal("checks"), code: z.string().max(100_000) }),
]);

export type RunRequest = z.infer<typeof runRequestSchema>;

export const solutionRequestSchema = z.object({ trade: z.boolean().default(false) });

export const noteCreateSchema = z.object({
  body: z.string().trim().min(1).max(NOTE_BODY_MAX),
  videoId: z.string().max(32).nullable().optional(),
  atSec: z.number().min(0).max(24 * 3600).nullable().optional(),
});

export const noteUpdateSchema = z.object({ body: z.string().trim().min(1).max(NOTE_BODY_MAX) });

export const problemCreateSchema = z.object({
  step: lessonStepSchema.nullable().optional(),
  message: z.string().trim().min(3).max(PROBLEM_MESSAGE_MAX),
});
