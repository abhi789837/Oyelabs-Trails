import { z } from "zod";

/** Roles. There is no self-signup: the superadmin creates every learner. */
/**
 * Three roles, and the line between the first two is deliberately narrow.
 *
 * `admin` manages people: onboarding, assessments, plans, progress, the live board. `superadmin`
 * is that plus the two things that are not about any one learner — the shared AI credential, which
 * everyone's generation runs through, and the admin accounts themselves. Keeping those with one
 * person means a department lead cannot change what every other department's assessments are
 * generated with, or grant themselves more than they were given.
 */
export const roleSchema = z.enum(["superadmin", "admin", "learner"]);

/** Roles that see the admin console at all. */
export const staffRoles = ["superadmin", "admin"] as const;

/**
 * "Does this person run the console?" — as opposed to "are they *the* superadmin".
 *
 * Worth a named function rather than `role !== "learner"`, because the two questions were the same
 * one until the `admin` role existed and every call site that conflated them had to be revisited.
 * A future fourth role gets checked here instead of in thirty places.
 */
export function isStaff(role: Role): boolean {
  return role === "superadmin" || role === "admin";
}
export type Role = z.infer<typeof roleSchema>;

/**
 * Three states, and the difference between the last two is the point.
 *
 * `disabled` is a suspension: they cannot sign in, everything is kept, and they are still on the
 * People list because you are expected to let them back in. `archived` is "they have left the
 * programme": hidden from the active list, progress frozen, data kept, restorable. Conflating them
 * meant an admin had one word — "disable" — for both a week off and a departure, and the list grew
 * a tail of accounts nobody could tell apart.
 *
 * Deletion is not a status. It removes the row.
 */
export const userStatusSchema = z.enum(["active", "disabled", "archived"]);
export type UserStatus = z.infer<typeof userStatusSchema>;

/** Statuses that appear on the People list by default. `archived` is behind its own filter. */
export const LISTED_USER_STATUSES = ["active", "disabled"] as const;

export function isArchived(status: UserStatus): boolean {
  return status === "archived";
}

export const providerIdSchema = z.enum(["anthropic-api", "openai-api", "claude-cli", "codex-cli", "mock"]);
export type ProviderId = z.infer<typeof providerIdSchema>;

/** Providers an admin may select in production. `mock` is dev/test only (see server/src/ai). */
export const selectableProviderIds = ["anthropic-api", "openai-api", "claude-cli", "codex-cli"] as const;

export const credentialStatusSchema = z.enum(["unverified", "verified", "failed"]);
export type CredentialStatus = z.infer<typeof credentialStatusSchema>;

export const aiPurposeSchema = z.enum([
  "blueprint",
  "item_critic",
  "evaluation",
  "verify",
  // The course builder's four calls. Separate purposes rather than one "builder", so the usage
  // table can answer "what is the writing costing?" — which is the expensive one by an order of
  // magnitude and the one worth tuning a model for.
  "gap_analysis",
  "course_match",
  "course_plan",
  "course_write",
  "course_review",
  /** Shaping one learner's week into the four lanes. Cheap and frequent, unlike the four above. */
  "week_plan",
  /** v4: writing items for a thin skill in the question bank. */
  "bank_fill",
  /** v4: rubric-grading a written PM/BD task. */
  "grade_written",
  /** v4.1: reading the admin's setup and description into a 25-slot plan. */
  "assessment_plan",
  /** v4.1: writing personalised items for one assessment. */
  "item_generate",
  /** v4.1: checking a generated text MCQ has exactly one right answer. */
  "item_check",
  /** v4.2: the AI client's reply in a role-play conversation. */
  "roleplay",
  /** v4.2: scoring a finished role-play against its rubric. */
  "roleplay_score",
]);
export type AiPurpose = z.infer<typeof aiPurposeSchema>;

/**
 * The assessment lifecycle, in order. `awaiting_approval` is the review gate: generation lands
 * there rather than in `ready`, and the assessment only reaches the learner once the superadmin
 * approves it or the auto-approval deadline passes (`AUTO_APPROVE_AFTER_MS` in shared/assessment).
 * Anything that enumerates "live" statuses must include it, or a waiting assessment reads as absent.
 */
export const assessmentStatusSchema = z.enum([
  "generating",
  "awaiting_approval",
  "ready",
  "in_progress",
  "submitted",
  "evaluating",
  "completed",
  "terminated",
  "failed",
]);
export type AssessmentStatus = z.infer<typeof assessmentStatusSchema>;

export const itemKindSchema = z.enum(["mcq", "multi", "predict_output", "find_bug", "code", "explain", "task"]);
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

export const jobTypeSchema = z.enum([
  "credential.verify",
  "assessment.blueprint",
  "assessment.evaluate",
  /** The AI course builder: gap analysis, matching and generation for one learner. */
  "path.build",
  /** The weekly re-check of every link a generated course cites. */
  "links.check",
  /**
   * Letting a model improve a week that was already built and served.
   *
   * A job rather than part of the request, because it is a provider call: `GET /api/me/week` used to
   * make one inline and the learner's page sat on its skeleton for minutes.
   */
  "week.refine",
  /** v4: generate, validate and add bank items for a skill the bank is thin on. Once, for everyone. */
  "bank.fill",
  /** v4: checks a Message Batches submission and finishes it when it ends. */
  "ai.batch.poll",
  /** v4.1: writes a learner's personalised assessment after "Save & assign". */
  "assessment.personalise",
  /** v4.1: weekly calibration of the timing formula from real answer times. */
  "timing.calibrate",
  /** v4.2: re-checks one bank item against a handbook entry that changed. */
  "bank.revalidate",
]);
export type JobType = z.infer<typeof jobTypeSchema>;

/**
 * Curriculum track ids. These mirror `TrackId` in src/types/curriculum.ts, which stays the
 * canonical definition for content authors. `shared/__tests__/enums.test.ts` asserts the two
 * lists match, so adding a track in one place without the other fails the test run rather than
 * drifting silently. Adding a track means editing both, plus registry.ts and track-meta.ts.
 */
export const TRACK_IDS = ["frontend", "backend", "fullstack", "ai-driven", "php", "mobile", "devops", "pm", "bd"] as const;
export const trackIdSchema = z.enum(TRACK_IDS);
export type TrackIdValue = (typeof TRACK_IDS)[number];

export const TOPIC_LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;
export const topicLevelSchema = z.enum(TOPIC_LEVELS);
export type TopicLevelValue = (typeof TOPIC_LEVELS)[number];

/** 1..5 skill level. 5 is "can teach it" (brief §9.1). */
export const skillLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
export type SkillLevel = z.infer<typeof skillLevelSchema>;
