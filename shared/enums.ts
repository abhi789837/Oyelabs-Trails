import { z } from "zod";

/** Roles. There is no self-signup: the superadmin creates every learner. */
export const roleSchema = z.enum(["superadmin", "learner"]);
export type Role = z.infer<typeof roleSchema>;

export const userStatusSchema = z.enum(["active", "disabled"]);
export type UserStatus = z.infer<typeof userStatusSchema>;

export const providerIdSchema = z.enum(["anthropic-api", "openai-api", "claude-cli", "codex-cli", "mock"]);
export type ProviderId = z.infer<typeof providerIdSchema>;

/** Providers an admin may select in production. `mock` is dev/test only (see server/src/ai). */
export const selectableProviderIds = ["anthropic-api", "openai-api", "claude-cli", "codex-cli"] as const;

export const credentialStatusSchema = z.enum(["unverified", "verified", "failed"]);
export type CredentialStatus = z.infer<typeof credentialStatusSchema>;

export const aiPurposeSchema = z.enum(["blueprint", "item_critic", "evaluation", "verify"]);
export type AiPurpose = z.infer<typeof aiPurposeSchema>;

export const assessmentStatusSchema = z.enum([
  "generating",
  "ready",
  "in_progress",
  "submitted",
  "evaluating",
  "completed",
  "terminated",
  "failed",
]);
export type AssessmentStatus = z.infer<typeof assessmentStatusSchema>;

export const itemKindSchema = z.enum(["mcq", "multi", "predict_output", "find_bug", "code", "explain"]);
export type ItemKind = z.infer<typeof itemKindSchema>;

export const itemStatusSchema = z.enum(["pool", "served", "answered", "skipped", "dropped"]);
export type ItemStatus = z.infer<typeof itemStatusSchema>;

export const severitySchema = z.enum(["soft", "hard"]);
export type Severity = z.infer<typeof severitySchema>;

export const planSourceSchema = z.enum(["ai", "admin"]);
export type PlanSource = z.infer<typeof planSourceSchema>;

export const topicStatusSchema = z.enum(["not-started", "in-progress", "completed"]);
export type TopicStatus = z.infer<typeof topicStatusSchema>;

export const attemptKindSchema = z.enum(["quiz", "code"]);
export type AttemptKind = z.infer<typeof attemptKindSchema>;

export const jobStatusSchema = z.enum(["queued", "running", "done", "failed"]);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const jobTypeSchema = z.enum(["credential.verify", "assessment.blueprint", "assessment.evaluate"]);
export type JobType = z.infer<typeof jobTypeSchema>;

/**
 * Curriculum track ids. These mirror `TrackId` in src/types/curriculum.ts, which stays the
 * canonical definition for content authors. `shared/__tests__/enums.test.ts` asserts the two
 * lists match, so adding a track in one place without the other fails the test run rather than
 * drifting silently. Adding a track means editing both, plus registry.ts and track-meta.ts.
 */
export const TRACK_IDS = ["frontend", "backend", "fullstack", "ai-driven", "php", "mobile", "devops"] as const;
export const trackIdSchema = z.enum(TRACK_IDS);
export type TrackIdValue = (typeof TRACK_IDS)[number];

export const TOPIC_LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;
export const topicLevelSchema = z.enum(TOPIC_LEVELS);
export type TopicLevelValue = (typeof TOPIC_LEVELS)[number];

/** 1..5 skill level. 5 is "can teach it" (brief §9.1). */
export const skillLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
export type SkillLevel = z.infer<typeof skillLevelSchema>;
