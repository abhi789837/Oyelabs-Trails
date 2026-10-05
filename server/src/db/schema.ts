/**
 * Drizzle schema for Oyelearn v3 (brief §5).
 *
 * Conventions:
 * - Ids are ULID strings (lexicographically sortable, so `order by id` is chronological).
 * - Timestamps are integer epoch milliseconds, never Date objects, so they serialise to JSON
 *   unchanged on both sides of the wire.
 * - JSON columns are `text({ mode: "json" })` with a `$type<>()` for Drizzle. The value is also
 *   validated with the matching zod schema on read and write in the repository layer, because
 *   `$type` is a compile-time assertion, not a runtime guarantee.
 */
import { sql } from "drizzle-orm";
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import type { AiPurpose, AssessmentStatus, CredentialStatus, ItemKind, ItemStatus, JobStatus, JobType, PlanSource, ProviderId, Role, Severity, TopicStatus, UserStatus, AttemptKind } from "../../../shared/enums";
import type { GenerationLevel, GenerationStage } from "../../../shared/assessment";
import type { ClaimedSkill } from "../../../shared/profile";

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    /** Always stored lowercase. */
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<Role>().notNull(),
    status: text("status").$type<UserStatus>().notNull().default("active"),
    mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull().default(true),
    /** Failed-login counter and lock, for the §6 rate limit. Reset on a successful login. */
    failedLogins: integer("failed_logins").notNull().default(0),
    lockedUntil: integer("locked_until"),
    createdBy: text("created_by"),
    createdAt: integer("created_at").notNull(),
    lastLoginAt: integer("last_login_at"),
  },
  (t) => [uniqueIndex("users_username_idx").on(t.username), index("users_role_idx").on(t.role)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    /** sha256 of the random 32-byte token. The raw token only ever lives in the cookie. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull(),
    /** Sliding: pushed forward on use, but never past `absoluteExpiresAt`. */
    expiresAt: integer("expires_at").notNull(),
    absoluteExpiresAt: integer("absolute_expires_at").notNull(),
    lastSeenAt: integer("last_seen_at").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)],
);

export const learnerProfiles = sqliteTable("learner_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  roleTitle: text("role_title"),
  yearsExperience: integer("years_experience"),
  /** Free-text admin notes. The single most important input to the assessment blueprint. */
  adminNotes: text("admin_notes").notNull().default(""),
  claimedSkills: text("claimed_skills", { mode: "json" }).$type<ClaimedSkill[]>().notNull(),
  targetTracks: text("target_tracks", { mode: "json" }).$type<string[]>().notNull(),
  /**
   * The track this person is actually on, and the stack they are actually on it with.
   *
   * `target_tracks` above is which *curriculum trails* to draw content from — a content question.
   * These two are a statement about their job, and they are what makes everything downstream
   * specific: the assessment's first section is the fundamentals of *this* stack, and "AI-driven
   * development" is only a useful course when it can say "prompting for a Laravel controller with
   * validation" rather than "prompting for code".
   *
   * Nullable because every account that predates this column has no answer, and guessing one from
   * `target_tracks` would put a value the admin never chose in front of the assessment generator.
   */
  track: text("track"),
  stack: text("stack"),
  /** The admin's read of their level, 1–5, before any testing. The blueprint's starting hypothesis. */
  selfLevel: integer("self_level"),
  /** v4. Null only for staff accounts; every learner is migrated to `engineering`. */
  departmentId: text("department_id"),
  /** v4 job track id (`tracks.id`). Supersedes `track` above, which is kept for one release. */
  trackId: text("track_id"),
  /** v4: stacks or tools picked on the Setup screen (`stacks.id`). */
  stackIds: text("stack_ids", { mode: "json" }).$type<string[]>().notNull().default([]),
  /** v4: `0`, `1-2`, `3-5`, `6+`. */
  experienceBand: text("experience_band"),
  updatedAt: integer("updated_at").notNull(),
  updatedBy: text("updated_by"),
});

/**
 * What this learner is being trained *for*, in the admin's own order.
 *
 * Replaces `learner_priorities.must_have`, which held the same weights as unordered JSON. The
 * missing piece was rank *within* a weight: "Docker deployment" and "Testing with Jest" can both be
 * High and still not be equally urgent, and a `{skill, weight}[]` could not say so — every reader
 * re-sorted by weight and threw the admin's ordering away.
 *
 * A row per target rather than a JSON column, because these are now joined against (which gaps
 * answer which target), counted (the question budget) and reordered individually.
 */
export const learnerTargets = sqliteTable(
  "learner_targets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skill: text("skill").notNull(),
    priority: text("priority").$type<"high" | "medium" | "low">().notNull(),
    /** Rank within the priority. Drag-to-reorder writes this. */
    position: integer("position").notNull().default(0),
    /** `yyyy-mm-dd`, optional. Most targets are "soon" rather than "by the 14th". */
    targetDate: text("target_date"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("learner_targets_user_idx").on(t.userId, t.priority, t.position)],
);

// ---------------------------------------------------------------------------
// AI configuration and audit
// ---------------------------------------------------------------------------

export const aiCredentials = sqliteTable(
  "ai_credentials",
  {
    id: text("id").primaryKey(),
    provider: text("provider").$type<ProviderId>().notNull(),
    label: text("label").notNull(),
    /** AES-256-GCM. The plaintext never leaves the server after it is saved. */
    secretCiphertext: text("secret_ciphertext").notNull(),
    secretIv: text("secret_iv").notNull(),
    secretTag: text("secret_tag").notNull(),
    /** Last 4 characters, e.g. "…a9F2". The only part ever returned to the client. */
    secretHint: text("secret_hint").notNull(),
    status: text("status").$type<CredentialStatus>().notNull().default("unverified"),
    lastVerifiedAt: integer("last_verified_at"),
    lastError: text("last_error"),
    /** Required for claude-cli and codex-cli: the admin accepted the shared-use policy (§8.1). */
    sharedUseAcknowledged: integer("shared_use_acknowledged", { mode: "boolean" }).notNull().default(false),
    createdBy: text("created_by"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("ai_credentials_provider_idx").on(t.provider)],
);

/** Single row, id = "singleton". */
export const aiSettings = sqliteTable("ai_settings", {
  id: text("id").primaryKey(),
  activeCredentialId: text("active_credential_id").references(() => aiCredentials.id, { onDelete: "set null" }),
  modelGeneration: text("model_generation"),
  modelEvaluation: text("model_evaluation"),
  modelCritic: text("model_critic"),
  monthlyBudgetNote: text("monthly_budget_note"),
  /** v4: the monthly AI budget. 80% warns the superadmin; 100% pauses non-urgent jobs. Null = none. */
  monthlyBudgetUsd: real("monthly_budget_usd"),
  /** v4: model ids the active credential can use, from the provider's models API. */
  availableModels: text("available_models", { mode: "json" }).$type<string[]>(),
  modelsFetchedAt: integer("models_fetched_at"),
  updatedAt: integer("updated_at").notNull(),
});

/** v4: the admin's model and output cap per task type. Absent rows use `TASK_DEFAULTS`. */
export const aiTaskRoutes = sqliteTable("ai_task_routes", {
  task: text("task").primaryKey(),
  model: text("model"),
  maxTokens: integer("max_tokens"),
  updatedBy: text("updated_by"),
  updatedAt: integer("updated_at").notNull(),
});

/** v4: a Message Batches API submission, polled by a job until it ends. */
export const aiBatches = sqliteTable("ai_batches", {
  id: text("id").primaryKey(),
  providerBatchId: text("provider_batch_id").notNull(),
  task: text("task").notNull(),
  model: text("model").notNull(),
  status: text("status").$type<"submitted" | "ended" | "failed">().notNull().default("submitted"),
  /** Whatever the completion handler needs to finish the work: the skill, the type, ... */
  context: text("context", { mode: "json" }).$type<unknown>().notNull(),
  requestCount: integer("request_count").notNull(),
  createdAt: integer("created_at").notNull(),
  endedAt: integer("ended_at"),
});

export const aiCalls = sqliteTable(
  "ai_calls",
  {
    id: text("id").primaryKey(),
    credentialId: text("credential_id"),
    provider: text("provider").$type<ProviderId>().notNull(),
    model: text("model").notNull(),
    purpose: text("purpose").$type<AiPurpose>().notNull(),
    /** Who the call was about, so usage can be attributed per learner (§8.1). */
    subjectUserId: text("subject_user_id"),
    assessmentId: text("assessment_id"),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    latencyMs: integer("latency_ms").notNull().default(0),
    /** v4: the router task type; null on calls logged before v4. */
    task: text("task"),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    /** v4: cost in micro-dollars at list price (batch discount applied). */
    costMicros: integer("cost_micros").notNull().default(0),
    courseId: text("course_id"),
    batch: integer("batch", { mode: "boolean" }).notNull().default(false),
    ok: integer("ok", { mode: "boolean" }).notNull(),
    error: text("error"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("ai_calls_subject_idx").on(t.subjectUserId),
    index("ai_calls_created_idx").on(t.createdAt),
    index("ai_calls_purpose_idx").on(t.purpose),
  ],
);

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------

export const assessments = sqliteTable(
  "assessments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    attemptNo: integer("attempt_no").notNull().default(1),
    /**
     * What this sitting is *for*, when a learner has more than one open at a time — "Frontend
     * placement", "Company process". Null on every assessment issued before labels existed, and on
     * any issued without one, where the UI falls back to the attempt number.
     */
    label: text("label"),
    status: text("status").$type<AssessmentStatus>().notNull(),
    blueprint: text("blueprint", { mode: "json" }).$type<unknown>(),
    config: text("config", { mode: "json" }).$type<unknown>(),
    startedAt: integer("started_at"),
    /** Server-authoritative. Extended by warning pauses, capped per §10.3. */
    deadlineAt: integer("deadline_at"),
    submittedAt: integer("submitted_at"),
    terminatedReason: text("terminated_reason"),
    hardWarnings: integer("hard_warnings").notNull().default(0),
    softWarnings: integer("soft_warnings").notNull().default(0),
    consentAt: integer("consent_at"),
    /** When generation finished and the assessment began waiting for review; the auto-approval
     * deadline is measured from here, not from `created_at`. */
    awaitingApprovalSince: integer("awaiting_approval_since"),
    approvedAt: integer("approved_at"),
    /** The superadmin who approved it, or null when the deadline did — see AUTO_APPROVE_AFTER_MS. */
    approvedBy: text("approved_by"),
    /** Set when the last heartbeat arrived, so the server can raise a "heartbeat missing" event. */
    lastHeartbeatAt: integer("last_heartbeat_at"),
    createdBy: text("created_by"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("assessments_user_idx").on(t.userId),
    index("assessments_status_idx").on(t.status),
    uniqueIndex("assessments_user_attempt_idx").on(t.userId, t.attemptNo),
  ],
);

export const assessmentItems = sqliteTable(
  "assessment_items",
  {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    area: text("area").notNull(),
    difficulty: integer("difficulty").notNull(),
    kind: text("kind").$type<ItemKind>().notNull(),
    /** 1–3 real topic ids from the manifest. Validated at generation time; unknown ids drop the item. */
    topicIds: text("topic_ids", { mode: "json" }).$type<string[]>().notNull(),
    /** What the learner sees. */
    payload: text("payload", { mode: "json" }).$type<unknown>().notNull(),
    /** Server-only: correct indices, expected output, hidden tests, rubric, rationale. */
    key: text("key", { mode: "json" }).$type<unknown>().notNull(),
    criticVerdict: text("critic_verdict", { mode: "json" }).$type<unknown>(),
    status: text("status").$type<ItemStatus>().notNull().default("pool"),
    /** Why a dropped item was dropped, for the admin pool preview. */
    dropReason: text("drop_reason"),
    servedAt: integer("served_at"),
    answeredAt: integer("answered_at"),
    timeMs: integer("time_ms"),
    response: text("response", { mode: "json" }).$type<unknown>(),
    /** 0..1, or null for items graded later (explain). */
    autoScore: integer("auto_score"),
    aiScore: integer("ai_score"),
    aiFeedback: text("ai_feedback"),
    /** v4: the bank item this was copied from, for stats and "never seen before". */
    bankItemId: text("bank_item_id"),
    /** v4: order on the sheet, 0-based. */
    position: integer("position"),
    /** v4: Run presses counted by the server. The third one submits the item. */
    runsUsed: integer("runs_used").notNull().default(0),
    flagged: integer("flagged", { mode: "boolean" }).notNull().default(false),
    /** v4: the learner's latest unsubmitted answer or code, autosaved. */
    draft: text("draft", { mode: "json" }).$type<unknown>(),
    /** v4: set when the item is submitted (explicitly, by the third run, or at the deadline). */
    lockedAt: integer("locked_at"),
    /** v4: 0..1 with partial credit; null until graded (a written task waits for its rubric). */
    score: real("score"),
    /** v4.1: estimated seconds for this item, and the time the learner actually spent on it. */
    estSeconds: integer("est_seconds"),
    activeMs: integer("active_ms").notNull().default(0),
    /** v4.1: where it came from: reused from the bank, generated for this learner, or the fallback. */
    origin: text("origin").$type<"bank" | "generated" | "fallback">(),
    /**
     * v4.4 scoring (shared/scoring.ts): the grader's 0..1 before the verdict, kept so a re-score or a
     * switch between `full` and `partial` modes never needs the grader again.
     */
    rawScore: real("raw_score"),
    /** v4.4: "did the answer do the job". Null until graded. */
    verdict: text("verdict").$type<"full" | "not_yet">(),
    /** v4.4: one plain line, e.g. which edge tests failed on an otherwise full answer. */
    verdictNote: text("verdict_note"),
    /** v4.4: every earlier score, pushed by `scoring.rescore` before it recomputes. */
    scoreHistory: text("score_history", { mode: "json" }).$type<{ score: number | null; mode: string; at: number }[]>(),
    /** v4.4: the learner asked for a review (see `review_requests`), and how it ended. */
    reviewStatus: text("review_status").$type<"requested" | "upheld" | "overridden">(),
    reviewNote: text("review_note"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: integer("reviewed_at"),
  },
  (t) => [
    index("assessment_items_assessment_idx").on(t.assessmentId),
    index("assessment_items_pool_idx").on(t.assessmentId, t.status, t.area, t.difficulty),
  ],
);

export const integrityEvents = sqliteTable(
  "integrity_events",
  {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    type: text("type").notNull(),
    severity: text("severity").$type<Severity>().notNull(),
    /** False when the cooldown or escalation rules decided not to count it. */
    counted: integer("counted", { mode: "boolean" }).notNull().default(false),
    details: text("details", { mode: "json" }).$type<unknown>(),
    /** Relative to DATA_DIR/snapshots. Null once retention has deleted the file. */
    snapshotPath: text("snapshot_path"),
    clientTs: integer("client_ts"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("integrity_events_assessment_idx").on(t.assessmentId),
    index("integrity_events_created_idx").on(t.createdAt),
  ],
);

export const evaluations = sqliteTable(
  "evaluations",
  {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    result: text("result", { mode: "json" }).$type<unknown>().notNull(),
    model: text("model").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("evaluations_assessment_idx").on(t.assessmentId)],
);

// ---------------------------------------------------------------------------
// Plans and progress
// ---------------------------------------------------------------------------

export const learningPlans = sqliteTable(
  "learning_plans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    source: text("source").$type<PlanSource>().notNull(),
    assessmentId: text("assessment_id"),
    /** Ordered topic ids. This is the learner's entire visible curriculum. */
    topicIds: text("topic_ids", { mode: "json" }).$type<string[]>().notNull(),
    rationale: text("rationale", { mode: "json" }).$type<unknown>(),
    publishedAt: integer("published_at"),
    publishedBy: text("published_by"),
  },
  (t) => [
    index("learning_plans_user_idx").on(t.userId),
    uniqueIndex("learning_plans_user_version_idx").on(t.userId, t.version),
  ],
);

export const topicProgress = sqliteTable(
  "topic_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topicId: text("topic_id").notNull(),
    status: text("status").$type<TopicStatus>().notNull(),
    bestScore: integer("best_score"),
    attempts: integer("attempts").notNull().default(0),
    completedAt: integer("completed_at"),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.topicId] }), index("topic_progress_user_idx").on(t.userId)],
);

export const topicAttempts = sqliteTable(
  "topic_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topicId: text("topic_id").notNull(),
    kind: text("kind").$type<AttemptKind>().notNull(),
    score: integer("score").notNull(),
    passed: integer("passed", { mode: "boolean" }).notNull(),
    /** Quiz: the chosen original option indices per question. */
    answers: text("answers", { mode: "json" }).$type<unknown>(),
    /** Code: the submitted source, so the admin can read what they wrote. */
    code: text("code"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("topic_attempts_user_topic_idx").on(t.userId, t.topicId)],
);

export const certificates = sqliteTable(
  "certificates",
  {
    /** The deterministic OYL-XX-XXXX-XXXX id, so /verify/:id is a direct lookup. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trackId: text("track_id").notNull(),
    learnerName: text("learner_name").notNull(),
    topicIds: text("topic_ids", { mode: "json" }).$type<string[]>().notNull(),
    planId: text("plan_id"),
    averageScore: integer("average_score"),
    issuedAt: integer("issued_at").notNull(),
  },
  (t) => [index("certificates_user_idx").on(t.userId)],
);

// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    link: text("link"),
    readAt: integer("read_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("notifications_recipient_idx").on(t.recipientId, t.readAt)],
);

export const jobs = sqliteTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    type: text("type").$type<JobType>().notNull(),
    payload: text("payload", { mode: "json" }).$type<unknown>().notNull(),
    status: text("status").$type<JobStatus>().notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    runAfter: integer("run_after").notNull(),
    lockedAt: integer("locked_at"),
    lastError: text("last_error"),
    createdAt: integer("created_at").notNull(),
    finishedAt: integer("finished_at"),
  },
  (t) => [index("jobs_claim_idx").on(t.status, t.runAfter)],
);

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    details: text("details", { mode: "json" }).$type<unknown>(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt), index("audit_log_target_idx").on(t.targetType, t.targetId)],
);

// ---------------------------------------------------------------------------
// Generation log
// ---------------------------------------------------------------------------

/**
 * What the blueprint job did, line by line (brief §13).
 *
 * Stored rather than only streamed: a generation takes several minutes and a dozen or more
 * provider calls, so the admin who started it will reload the page, and the reason an assessment
 * came out thin is worth reading long afterwards. Kept bounded per assessment — see
 * MAX_GENERATION_LOG_LINES — so a run that keeps failing and retrying cannot grow the table.
 *
 * Every line is redacted and assembled from fixed phrases. Nothing an item says goes in here.
 */
export const generationLog = sqliteTable(
  "generation_log",
  {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    /** Per assessment, from 1. Ordering key: several lines can land in the same millisecond. */
    seq: integer("seq").notNull(),
    stage: text("stage").$type<GenerationStage>().notNull(),
    level: text("level").$type<GenerationLevel>().notNull().default("info"),
    message: text("message").notNull(),
    /** Only on a line that reports a finished provider call, from the same numbers as `ai_calls`. */
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    elapsedMs: integer("elapsed_ms"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("generation_log_assessment_idx").on(t.assessmentId, t.seq)],
);

// ---------------------------------------------------------------------------
// Admin-authored courses (§ "add courses manually")
// ---------------------------------------------------------------------------

/**
 * A course written by an admin rather than generated: an internal process, a runbook, an
 * onboarding walkthrough.
 *
 * Deliberately **not** folded into the curriculum tracks. A track is a trail with levels, adaptive
 * assessment coverage and challenges that gate progress; `TrackIdValue` is a closed enum for that
 * reason, and widening it so a company process could pretend to be one would make every accent
 * lookup, every registry entry and every certificate calculation take a value they were not written
 * for. These are their own shape, shown in their own place, and honest about being different.
 */
export const courses = sqliteTable(
  "courses",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    /** One line under the title. */
    summary: text("summary").notNull().default(""),
    /** An accent token name, for the card. Validated against the same list the trails use. */
    accent: text("accent").notNull().default("glacier"),
    /**
     * `everyone` is the reason this feature exists — "one internal process I want everyone to
     * learn". `assigned` keeps it to people it has been added to, for a course that is not for the
     * whole company.
     */
    audience: text("audience").$type<"everyone" | "assigned">().notNull().default("everyone"),
    /** Unpublished courses are the author's draft and are invisible to learners. */
    published: integer("published", { mode: "boolean" }).notNull().default(false),
    /** A `generated` course carries a `generated_courses` row saying what it answers and how it scored. */
    origin: text("origin").$type<"manual" | "generated">().notNull().default("manual"),
    /** v4. Null on courses that predate levels; shown as "Super advanced" for `expert`. */
    level: text("level").$type<"beginner" | "intermediate" | "advanced" | "expert">(),
    /** v4. Null = every department may see it. */
    departmentId: text("department_id"),
    position: integer("position").notNull().default(0),
    createdBy: text("created_by"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("courses_published_idx").on(t.published, t.position)],
);

/** A section within a course — the equivalent of a camp, without the trail. */
export const courseSections = sqliteTable(
  "course_sections",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("course_sections_course_idx").on(t.courseId, t.position)],
);

/**
 * One lesson: some prose, optionally a video, optionally some links.
 *
 * No quiz and no code challenge — that was the explicit scope. Completion is therefore
 * self-reported, which is why these are counted separately from plan progress everywhere: a
 * certificate that mixed "passed a graded challenge" with "ticked a box" would mean less than the
 * one that exists today.
 */
export const courseTopics = sqliteTable(
  "course_topics",
  {
    id: text("id").primaryKey(),
    sectionId: text("section_id")
      .notNull()
      .references(() => courseSections.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    /** Markdown-ish prose, rendered through the same `RichText` the curriculum uses. */
    body: text("body").notNull().default(""),
    /** A YouTube id, extracted from whatever URL was pasted. Null when there is no video. */
    videoId: text("video_id"),
    videoTitle: text("video_title"),
    /** `[{ label, url }]`. Plain links; nothing is fetched or embedded server-side. */
    links: text("links", { mode: "json" }).$type<{ label: string; url: string }[]>().notNull().default([]),
    /**
     * A hands-on task with acceptance criteria. Null on a read-only lesson.
     *
     * Optional rather than required, so the hand-written courses that predate the builder keep
     * working unchanged - and so an author can add one if they want, which is why this lives on
     * the shared topic rather than on a parallel "generated topic" table.
     */
    practice: text("practice", { mode: "json" }).$type<unknown>(),
    /**
     * A graded test. Null means the lesson is finished by the learner saying so, which is how
     * every course worked before the builder existed; present means it is finished by passing.
     */
    test: text("test", { mode: "json" }).$type<unknown>(),
    estMinutes: integer("est_minutes").notNull().default(10),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("course_topics_section_idx").on(t.sectionId, t.position), index("course_topics_course_idx").on(t.courseId)],
);

/**
 * Who a course is for, when its audience is `assigned`.
 *
 * Absent for an `everyone` course: storing a row per learner for a company-wide course would have
 * to be backfilled every time somebody joins, and the first person onboarded after that would
 * quietly not have it.
 */
export const courseAssignments = sqliteTable(
  "course_assignments",
  {
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedBy: text("assigned_by"),
    assignedAt: integer("assigned_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.userId] })],
);

/** A learner ticking a lesson off. One row per person per topic; deleting it is "not done". */
export const courseProgress = sqliteTable(
  "course_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => courseTopics.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    completedAt: integer("completed_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.topicId] }), index("course_progress_course_idx").on(t.userId, t.courseId)],
);

// ---------------------------------------------------------------------------
// AI course builder (docs/ai-course-builder.md)
// ---------------------------------------------------------------------------

/**
 * What the admin said this learner is *for*, set during onboarding.
 *
 * One row per learner, replaced wholesale when edited. It is the half of the gap map that does not
 * come from the test: the assessment can show that someone cannot deploy anything, but only a
 * person knows that this hire was brought in to do Laravel and that DevOps is the thing that
 * matters most this quarter.
 */
export const learnerPriorities = sqliteTable("learner_priorities", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Free text: "Backend Engineer - Laravel", "DevOps". Used as context, never matched on. */
  targetRole: text("target_role").notNull().default(""),
  /** One entry per must-have skill; weight is high, medium or low. */
  mustHave: text("must_have", { mode: "json" })
    .$type<{ skill: string; weight: "high" | "medium" | "low" }[]>()
    .notNull()
    .default([]),
  /** Skills to leave alone. Still recorded as gaps; simply never turned into a course. */
  skip: text("skip", { mode: "json" }).$type<string[]>().notNull().default([]),
  deadlineWeeks: integer("deadline_weeks"),
  /** How many courses one run may generate. Guards both the learner's time and the AI bill. */
  courseCap: integer("course_cap").notNull().default(5),
  /** Off by default: a generated course is a draft until somebody has looked at it. */
  autoPublish: integer("auto_publish", { mode: "boolean" }).notNull().default(false),
  /**
   * The weekly budget. `weekly_plans` is built to fit it, within 10%.
   *
   * These two are why "My plan" can show one week of roughly fifteen hours rather than the whole
   * library. Only the admin knows whether somebody is training full-time or fitting it around
   * delivery, so it is set at onboarding rather than guessed from the plan's size.
   */
  hoursPerWeek: integer("hours_per_week").notNull().default(15),
  daysPerWeek: integer("days_per_week").notNull().default(5),
  /** On: a week starts on the Monday of the week it is generated in, for team-aligned cohorts. */
  weekStartsMonday: integer("week_starts_monday", { mode: "boolean" }).notNull().default(false),
  /** v4.1: how much of an assessment the AI writes fresh. `balanced` reuses up to ~40% from the bank. */
  personalisation: text("personalisation").$type<"high" | "balanced" | "low">().notNull().default("balanced"),
  /** v4.1: the AI's reading of the admin's setup + description, and the hash of the input it read. */
  understanding: text("understanding", { mode: "json" }).$type<unknown>(),
  understandingHash: text("understanding_hash"),
  /** v4.3: add suggested next goals without the admin's click (Advanced; off by default). */
  autoAddSuggestions: integer("auto_add_suggestions", { mode: "boolean" }).notNull().default(false),
  /** v4.4: the admin's one-line description of this person, which the intents were read from. */
  description: text("description").notNull().default(""),
  /**
   * v4.4: the saved `Intent[]` (shared/intents.ts) plus how each Unsure phrase was resolved. Kept so
   * every goal can be traced back to the exact words it came from, and re-shown on edit.
   */
  intents: text("intents", { mode: "json" }).$type<unknown>(),
  /**
   * v4.4: per-learner override of the global `builder.auto_publish` setting (default on). Null =
   * follow the global setting. A separate column rather than reusing `auto_publish`, whose
   * NOT NULL false default cannot express "no override".
   */
  autoPublishOverride: text("auto_publish_override").$type<"on" | "off">(),
  updatedBy: text("updated_by"),
  updatedAt: integer("updated_at").notNull(),
});

/**
 * One thing this learner cannot yet do, and how sure we are.
 *
 * Evidence is kept rather than only the score, because the learner is shown *why* a course was
 * added to their path, and "you missed 4 of 5 questions on server deployment" is a reason where
 * "severity 0.8" is a number.
 */
export const skillGaps = sqliteTable(
  "skill_gaps",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Null for a gap that came only from the admin's priorities, before any assessment. */
    assessmentId: text("assessment_id").references(() => assessments.id, { onDelete: "set null" }),
    skill: text("skill").notNull(),
    /** 0-1. How badly this is missing, from the items that touched it. */
    severity: real("severity").notNull(),
    /** Which items were missed and why, in words. Shown to the learner. */
    evidence: text("evidence", { mode: "json" })
      .$type<{ summary: string; itemIds: string[]; missed: number; asked: number }>()
      .notNull(),
    /** admin_priority, ai_detected, or both when the two agreed. */
    source: text("source").$type<"admin_priority" | "ai_detected" | "both">().notNull(),
    priorityScore: real("priority_score").notNull(),
    /** True when the admin's skip list covers it: recorded, deliberately not taught. */
    skipped: integer("skipped", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("skill_gaps_user_idx").on(t.userId, t.priorityScore),
    index("skill_gaps_assessment_idx").on(t.assessmentId),
  ],
);

/** One run of the builder for one learner. Re-running supersedes rather than edits. */
export const learningPaths = sqliteTable(
  "learning_paths",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assessmentId: text("assessment_id").references(() => assessments.id, { onDelete: "set null" }),
    status: text("status")
      .$type<"analysing" | "researching" | "writing" | "reviewing" | "ready" | "failed" | "budget_reached">()
      .notNull(),
    /** What the UI shows while it works: "Writing module 2 of 4". Plain, already-safe text. */
    progressNote: text("progress_note").notNull().default(""),
    failureReason: text("failure_reason"),
    /**
     * Something the admin should know about a run that nonetheless *worked*.
     *
     * Separate from `failure_reason`, because conflating the two is what put "No course could be
     * matched or generated. Check the research provider" and "Nothing was added — no gap needed a
     * course" on the same screen: one banner read from a failed status, the other from an empty
     * list, and both were true at once. A run with no research provider now succeeds, assigns every
     * catalog course it matched, and says here which targets are still waiting.
     */
    notice: text("notice"),
    /** Superseded when a newer run finishes. Only one path is current per learner. */
    current: integer("current", { mode: "boolean" }).notNull().default(false),
    tokensUsed: integer("tokens_used").notNull().default(0),
    searchCalls: integer("search_calls").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    completedAt: integer("completed_at"),
  },
  (t) => [index("learning_paths_user_idx").on(t.userId, t.current)],
);

/** One course on a path, in order, with the reason it is there. */
export const pathItems = sqliteTable(
  "path_items",
  {
    id: text("id").primaryKey(),
    pathId: text("path_id")
      .notNull()
      .references(() => learningPaths.id, { onDelete: "cascade" }),
    courseId: text("course_id").references(() => courses.id, { onDelete: "cascade" }),
    gapId: text("gap_id").references(() => skillGaps.id, { onDelete: "set null" }),
    position: integer("position").notNull(),
    /** How this course got here: an existing one, one built earlier, or one built just now. */
    source: text("source").$type<"unlock" | "reuse" | "generated">().notNull(),
    /**
     * Which part of the path this is, and what kind.
     *
     * Part 1 is always the learner's own track and part 2 always AI-driven development for their
     * stack; 3 onward is everything else by priority. Stored rather than derived from `position`,
     * because the *kind* is not recoverable from the order — and it is what puts parts 1 and 2 into
     * week one's "Do it now" lane.
     *
     * Nullable for every path built before parts existed. Those render as a flat list, which is
     * what they were.
     */
    partNumber: integer("part_number"),
    /** v4.3 adds "prerequisite" (a missing link) and "capstone". Plain text, so no migration. */
    partType: text("part_type").$type<"track" | "ai_dev" | "general" | "prerequisite" | "capstone">(),
    /**
     * The admin target this item serves, by name.
     *
     * The spine is the admin's target list, so the path tab groups by it — a course *for* a target,
     * and the refreshers that target depends on, under one heading. By name rather than by
     * `learner_targets.id` on purpose: a target can be renamed or re-added and the path should still
     * show what it was built for, rather than losing its grouping to a foreign key that moved.
     */
    targetSkill: text("target_skill"),
    /** Where the course starts, from the assessment. The only thing it decides about a target. */
    startLevel: text("start_level").$type<"beginner" | "intermediate" | "advanced">(),
    /**
     * v4: a curriculum module (content trail camp) that teaches this skill, attached with no model
     * call from the skill catalog's `content_modules`. Set instead of `course_id` for those items.
     */
    moduleId: text("module_id"),
    /** v4: the catalog skill this item serves, when known. */
    skillId: text("skill_id"),
    /** "You missed 4 of 5 questions on server deployment; DevOps is marked High priority." */
    reason: text("reason").notNull(),
  },
  (t) => [index("path_items_path_idx").on(t.pathId, t.position)],
);

/**
 * The AI-built half of a course.
 *
 * A generated course is a row in `courses` like any other - same editor, same renderer, same
 * progress. This table is what is true *about* it: which gap it answers, how the review scored it,
 * and whether it belongs to one learner or has been promoted to the catalogue.
 */
export const generatedCourses = sqliteTable(
  "generated_courses",
  {
    courseId: text("course_id")
      .primaryKey()
      .references(() => courses.id, { onDelete: "cascade" }),
    skill: text("skill").notNull(),
    /** Who it was built for. Null once promoted: a catalogue course belongs to nobody. */
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    scope: text("scope").$type<"learner" | "global">().notNull().default("learner"),
    status: text("status")
      .$type<"draft" | "pending_review" | "published" | "rejected" | "needs_review">()
      .notNull(),
    /** 1-5 overall from the review pass; null while it is still being written. */
    reviewScore: real("review_score"),
    reviewDetail: text("review_detail", { mode: "json" }).$type<unknown>(),
    promptVersion: text("prompt_version").notNull().default(""),
    approvedBy: text("approved_by"),
    approvedAt: integer("approved_at"),
    createdAt: integer("created_at").notNull(),
    /**
     * v4.4: visible to every learner (the shared library), not only the one it was built for. The
     * existing `skill` column is the skill it teaches; no separate skill id is stored.
     */
    library: integer("library", { mode: "boolean" }).notNull().default(false),
    /** v4.4: the department it was built for, so the library can be filtered. Null = any. */
    departmentId: text("department_id"),
    /** v4.4: one plain line saying why the review failed, shown under "Needs a look". */
    reviewReason: text("review_reason"),
    /** v4.4: how many times "Fix automatically" regenerated the failed parts. */
    fixAttempts: integer("fix_attempts").notNull().default(0),
  },
  (t) => [
    index("generated_courses_skill_idx").on(t.skill, t.scope),
    index("generated_courses_status_idx").on(t.status),
  ],
);

/**
 * Every URL a generated course cites, and what happened when it was last fetched.
 *
 * Separate from the topic that cites it so the weekly link check has one place to walk, and so a
 * link that dies can be found without opening every course.
 */
export const courseSources = sqliteTable(
  "course_sources",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    topicId: text("topic_id").references(() => courseTopics.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    kind: text("kind").$type<"article" | "docs" | "video">().notNull(),
    title: text("title").notNull().default(""),
    httpStatus: integer("http_status"),
    verifiedAt: integer("verified_at"),
    /** Set by the weekly check when a link stops resolving. */
    deadSince: integer("dead_since"),
  },
  (t) => [index("course_sources_course_idx").on(t.courseId), index("course_sources_dead_idx").on(t.deadSince)],
);

/**
 * Every decision the builder made, for the admin who has to answer "why is this course here".
 *
 * Deliberately not the audit log: that one is about people doing things. This is about the model
 * doing things, it is far chattier, and mixing them would drown the human trail.
 */
export const aiAuditLog = sqliteTable(
  "ai_audit_log",
  {
    id: text("id").primaryKey(),
    pathId: text("path_id").references(() => learningPaths.id, { onDelete: "cascade" }),
    courseId: text("course_id").references(() => courses.id, { onDelete: "set null" }),
    /** gap_analysis, match, plan, search, verify, write, review or promote. */
    step: text("step").notNull(),
    promptVersion: text("prompt_version").notNull().default(""),
    model: text("model").notNull().default(""),
    /** Counts and scores - never a prompt body and never a learner's answers. */
    detail: text("detail", { mode: "json" }).$type<unknown>(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    actorId: text("actor_id"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("ai_audit_path_idx").on(t.pathId, t.createdAt)],
);

/**
 * Keys for the outside world the course builder reaches into: a web search provider and YouTube.
 *
 * A single row, like `ai_settings`. Both secrets are sealed with the same AES-256-GCM box as the AI
 * credential and are never returned from a route — only the last four characters, the same
 * affordance that lets an admin tell two keys apart without either being readable.
 *
 * Separate from `ai_settings` rather than four more columns on it, because these answer a different
 * question. `ai_settings` is "which model writes"; this is "where the facts come from", and it is
 * the half that decides whether a course cites real pages or invented ones.
 */
export const researchSettings = sqliteTable("research_settings", {
  id: text("id").primaryKey(),
  /** Null until a provider is chosen. Generation refuses to run while it is null. */
  provider: text("provider").$type<"tavily" | "brave" | "serper">(),
  searchCiphertext: text("search_ciphertext"),
  searchIv: text("search_iv"),
  searchTag: text("search_tag"),
  searchHint: text("search_hint"),
  youtubeCiphertext: text("youtube_ciphertext"),
  youtubeIv: text("youtube_iv"),
  youtubeTag: text("youtube_tag"),
  youtubeHint: text("youtube_hint"),
  /**
   * The ceiling for one generation run.
   *
   * Per run rather than per month: a runaway loop is the failure worth stopping, and it announces
   * itself inside a single run. A monthly cap would let one bad run burn the month's budget before
   * anything noticed.
   */
  budgetTokens: integer("budget_tokens").notNull().default(400_000),
  budgetSearches: integer("budget_searches").notNull().default(60),
  updatedBy: text("updated_by"),
  updatedAt: integer("updated_at").notNull(),
});

/**
 * What a learner agreed to before being monitored, as a record rather than a flag.
 *
 * `assessments.consent_at` stays as the denormalised timestamp every other query already reads.
 * This is the evidence behind it: which permissions were actually granted, which version of the
 * wording they saw, and where from. India's DPDP Act asks for consent to employee monitoring to be
 * demonstrable, and a boolean does not demonstrate anything.
 *
 * One row per attempt. Each attempt is its own `assessments` row, so a retake asks again —
 * consenting once in March should not silently cover a re-test in September.
 */
export const assessmentConsents = sqliteTable(
  "assessment_consents",
  {
    assessmentId: text("assessment_id")
      .primaryKey()
      .references(() => assessments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Null on a record written by a client that predates permission reporting. */
    permissions: text("permissions", { mode: "json" }).$type<{
      camera: boolean;
      microphone: boolean;
      fullscreen: boolean;
      tabMonitoring: boolean;
    } | null>(),
    /** Compared against `CONSENT_POLICY_VERSION`; an older one is re-asked. */
    policyVersion: text("policy_version"),
    /** From `X-Forwarded-For` behind the proxy. Evidence of where the consent came from. */
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("assessment_consents_user_idx").on(t.userId)],
);

// ---------------------------------------------------------------------------
// The weekly plan (one week of the library, prioritised)
// ---------------------------------------------------------------------------

/**
 * One week of work for one learner.
 *
 * Separate from `learning_plans` on purpose, and layered on top of it rather than replacing it.
 * `learning_plans` answers "what is this person allowed to see" — two hundred lessons, unlocked,
 * browsable in the library. This answers "what are they doing between Monday and Sunday", which is
 * a different question with a much shorter answer.
 *
 * Weeks are append-only in the same way plans are: `week_number` climbs, the previous week is
 * marked `completed` or `superseded`, and its rows stay. "Week 1 · 11/12 done" is only answerable
 * because nothing is edited in place.
 */
export const weeklyPlans = sqliteTable(
  "weekly_plans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** 1-based, per learner. Shown as "Week 3" and used to order history. */
    weekNumber: integer("week_number").notNull(),
    /** `yyyy-mm-dd`, UTC, inclusive. Stored as text so a week's boundary cannot drift with a clock. */
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    /** `hours_per_week * 60` at the moment of generation, so a later budget change is visible. */
    budgetMinutes: integer("budget_minutes").notNull(),
    /** Three sentences, about sixty words. The 450-word version lives in `roadmap_narrative`. */
    summary: text("summary").notNull().default(""),
    /** The whole-journey story that used to be the entire page. Collapsed by default in the UI. */
    roadmapNarrative: text("roadmap_narrative").notNull().default(""),
    /** 3-5 titles. A preview only: nothing is scheduled from it. */
    nextWeekPreview: text("next_week_preview", { mode: "json" }).$type<string[]>().notNull().default([]),
    /**
     * `completed` — the week ran its course: it ended, or the learner advanced past it. It stays in
     * history, with however much of it got done.
     * `superseded` — it was *reshaped* while it was still running, and a newer row covers the same
     * days. It never appears in history, because it never happened.
     */
    status: text("status").$type<"active" | "completed" | "superseded">().notNull().default("active"),
    /** Whether a model shaped the lanes or the deterministic builder did it alone. */
    source: text("source").$type<"ai" | "rules" | "admin">().notNull().default("rules"),
    /** Null when the week was generated by the system rather than by an admin pressing a button. */
    generatedBy: text("generated_by"),
    createdAt: integer("created_at").notNull(),
    completedAt: integer("completed_at"),
  },
  (t) => [
    index("weekly_plans_user_idx").on(t.userId, t.weekNumber),
    /* One week 3 per learner — but a reshaped week leaves its replaced row behind, so the constraint
       has to skip those. Without the predicate, an admin moving two items on a Wednesday fails on a
       unique violation, which is how this index was first written and how it was found out. */
    uniqueIndex("weekly_plans_user_week_idx")
      .on(t.userId, t.weekNumber)
      .where(sql`status <> 'superseded'`),
  ],
);

/**
 * One lesson in one week, in one lane.
 *
 * `status` is reconciled from `topic_progress` / `course_progress` on every read rather than being
 * the source of truth — a learner who completes a topic from the library has completed it, and the
 * week must agree without being told. What this table owns is the part progress cannot know:
 * which lane it was put in, why, what it waits on, and how many weeks it has been carried.
 */
export const weeklyPlanItems = sqliteTable(
  "weekly_plan_items",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id")
      .notNull()
      .references(() => weeklyPlans.id, { onDelete: "cascade" }),
    /** A curriculum topic id. Exactly one of this and `lesson_id` is set. */
    topicId: text("topic_id"),
    courseId: text("course_id").references(() => courses.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").references(() => courseTopics.id, { onDelete: "cascade" }),
    lane: text("lane").$type<"do_now" | "must_know" | "medium" | "low">().notNull(),
    position: integer("position").notNull().default(0),
    /** As planned. Kept rather than re-read, so a week's arithmetic still adds up if content changes. */
    minutes: integer("minutes").notNull(),
    /** "Admin: DevOps · High · you missed 4 of 5 deployment questions". Shown to the learner. */
    reason: text("reason").notNull().default(""),
    source: text("source").$type<"admin_priority" | "ai_gap" | "prerequisite">().notNull(),
    /** Item keys (topic or lesson ids) that live in Must know and unblock this one. */
    dependsOn: text("depends_on", { mode: "json" }).$type<string[]>().notNull().default([]),
    status: text("status").$type<"pending" | "done" | "skipped">().notNull().default("pending"),
    /** The week this item first appeared in, when it has been carried forward. */
    carriedFrom: text("carried_from"),
    /** Weeks in a row this has been carried without being done. Two, and the admin hears about it. */
    skipCount: integer("skip_count").notNull().default(0),
    /** An admin forced this into Do it now. Survives regeneration. */
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    completedAt: integer("completed_at"),
  },
  (t) => [
    index("weekly_plan_items_plan_idx").on(t.planId, t.lane, t.position),
    index("weekly_plan_items_topic_idx").on(t.topicId),
    uniqueIndex("weekly_plan_items_plan_topic_idx").on(t.planId, t.topicId),
    uniqueIndex("weekly_plan_items_plan_lesson_idx").on(t.planId, t.lessonId),
  ],
);

// ---------------------------------------------------------------------------
// v4: departments, job tracks, stacks/tools and the skill catalog
// ---------------------------------------------------------------------------

/**
 * Engineering, Project Management, Business Development — and whatever is added next (Design, QA,
 * HR) without a code change. `assessment_format` is what makes a department behave differently:
 * `coding` serves code problems, `tasks` serves the written/rank/calculate task types.
 */
export const departments = sqliteTable("departments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  icon: text("icon").notNull().default("users"),
  colour: text("colour").notNull().default("#2067D3"),
  assessmentFormat: text("assessment_format").$type<"coding" | "tasks">().notNull().default("tasks"),
  /** What "Practice" is called for this department: "Code", "Task workspace". */
  practiceNoun: text("practice_noun").notNull().default("Task workspace"),
  position: integer("position").notNull().default(0),
  archivedAt: integer("archived_at"),
  createdAt: integer("created_at").notNull(),
  /**
   * v4.4: a `role` department is something a person is hired into; an `area` department ("Soft
   * skills") is never chosen as a learner's department, but its skills are usable by learners in
   * any department (`skillUsableBy` in shared/catalog.ts).
   */
  kind: text("kind").$type<"role" | "area">().notNull().default("role"),
});

/**
 * A job track inside a department ("Frontend", "Agile Delivery PM").
 *
 * Not the content trails in `TRACK_IDS`: those say what curriculum exists, these say what somebody
 * was hired to do. Engineering's ids match the old `learner_profiles.track` values on purpose.
 */
export const tracks = sqliteTable(
  "tracks",
  {
    id: text("id").primaryKey(),
    departmentId: text("department_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    position: integer("position").notNull().default(0),
    archivedAt: integer("archived_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("tracks_department_idx").on(t.departmentId, t.position)],
);

/** Engineering stacks and languages, PM and BD tools. */
export const stacks = sqliteTable(
  "stacks",
  {
    id: text("id").primaryKey(),
    departmentId: text("department_id").notNull(),
    name: text("name").notNull(),
    kind: text("kind").$type<"stack" | "tool">().notNull(),
    /** Sandbox language for an engineering stack's coding questions. */
    language: text("language"),
    aliases: text("aliases", { mode: "json" }).$type<string[]>().notNull().default([]),
    position: integer("position").notNull().default(0),
    archivedAt: integer("archived_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("stacks_department_idx").on(t.departmentId, t.position)],
);

export const skills = sqliteTable(
  "skills",
  {
    id: text("id").primaryKey(),
    departmentId: text("department_id").notNull(),
    name: text("name").notNull(),
    /** The picker's group header. */
    area: text("area").notNull().default("General"),
    aliases: text("aliases", { mode: "json" }).$type<string[]>().notNull().default([]),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
    levelMin: text("level_min").$type<"beginner" | "intermediate" | "advanced" | "expert">().notNull().default("beginner"),
    levelMax: text("level_max").$type<"beginner" | "intermediate" | "advanced" | "expert">().notNull().default("expert"),
    /** Tracks this skill is typical for: the picker pre-suggests it there. */
    trackIds: text("track_ids", { mode: "json" }).$type<string[]>().notNull().default([]),
    prerequisites: text("prerequisites", { mode: "json" }).$type<string[]>().notNull().default([]),
    /** Engineering: the stacks it belongs to, for "own stack only". Empty = stack-agnostic. */
    stackIds: text("stack_ids", { mode: "json" }).$type<string[]>().notNull().default([]),
    language: text("language"),
    /** Content-trail module ids that teach it, for course matching. */
    contentModules: text("content_modules", { mode: "json" }).$type<string[]>().notNull().default([]),
    /** Part 2 of a path: "AI-driven work for your role". */
    isAiSkill: integer("is_ai_skill", { mode: "boolean" }).notNull().default(false),
    /** v4.1: the slider the Setup screen pre-selects for a new learner in this department. */
    defaultSlider: integer("default_slider"),
    /** `pending` is a request waiting for the superadmin. Pending skills can still be prioritised. */
    status: text("status").$type<"active" | "pending" | "archived">().notNull().default("active"),
    requestedBy: text("requested_by"),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("skills_department_idx").on(t.departmentId, t.status, t.area)],
);

/** Which skills a course teaches. Many-to-many: a Laravel testing course is Laravel and testing. */
export const courseSkills = sqliteTable(
  "course_skills",
  {
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    skillId: text("skill_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.skillId] }), index("course_skills_skill_idx").on(t.skillId)],
);

// ---------------------------------------------------------------------------
// v4: the admin's priorities, as slider rows, and the skip list
// ---------------------------------------------------------------------------

/**
 * One prioritised skill per row: the spine of the learner's path.
 *
 * `slider` is the admin's 5-stop scale (1 Optional · 2 Low · 3 Medium · 4 High · 5 Critical).
 * `position` is selection order, which breaks ties between equal sliders. Replaces
 * `learner_targets` and `learner_priorities.must_have`; both are migrated in once at boot and
 * then left untouched for one release.
 */
export const learnerSkillPriorities = sqliteTable(
  "learner_skill_priorities",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: text("skill_id").notNull(),
    /** Denormalised so the path keeps its heading if a skill is later renamed or archived. */
    skillName: text("skill_name").notNull(),
    slider: integer("slider").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.skillId] }), index("learner_skill_priorities_user_idx").on(t.userId, t.slider)],
);

/** Skills that are never tested and never taught for this learner. */
export const learnerSkip = sqliteTable(
  "learner_skip",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: text("skill_id").notNull(),
    skillName: text("skill_name").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.skillId] })],
);

/** Small key/value facts about the database itself: which one-time data migrations have run. */
export const appMeta = sqliteTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// ---------------------------------------------------------------------------
// v4: the question bank
// ---------------------------------------------------------------------------

/**
 * Reusable assessment items. An assessment is assembled from these by code, with no model call.
 * Engineering items are coding/mcq; PM and BD items are task/mcq. See shared/bank.ts.
 */
export const questionBank = sqliteTable(
  "question_bank",
  {
    id: text("id").primaryKey(),
    departmentId: text("department_id").notNull(),
    skillId: text("skill_id").notNull(),
    trackId: text("track_id"),
    stackId: text("stack_id"),
    /** Sandbox language for coding items (and for an MCQ's runnable snippet). */
    language: text("language"),
    type: text("type").$type<"coding" | "mcq" | "task">().notNull(),
    difficulty: integer("difficulty").notNull(),
    prompt: text("prompt").notNull(),
    /** Coding: mode, functionName, starter code, reference solution, sample and hidden tests. */
    coding: text("coding", { mode: "json" }).$type<unknown>(),
    /** MCQ: options, the answer, the explanation, an optional runnable snippet. */
    mcq: text("mcq", { mode: "json" }).$type<unknown>(),
    /** Task: the full task including its rubric or answer. */
    task: text("task", { mode: "json" }).$type<unknown>(),
    estMinutes: real("est_minutes").notNull().default(2),
    timesUsed: integer("times_used").notNull().default(0),
    timesScored: integer("times_scored").notNull().default(0),
    scoreSum: real("score_sum").notNull().default(0),
    discrimination: real("discrimination"),
    /** v4.1: context themes ("international clients", "Laravel", "Keka timesheets") for personalised reuse. */
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
    /** v4.1: deterministic time estimate (shared/timing.ts) and the measured median, in seconds. */
    estSeconds: integer("est_seconds"),
    medianSeconds: integer("median_seconds"),
    /** v4.1: median time above 1.5x the estimate; shortened before it is served again. */
    flaggedSlow: integer("flagged_slow", { mode: "boolean" }).notNull().default(false),
    /** v4.2: handbook entries this item cites, with the version it was last checked against. */
    handbookRefs: text("handbook_refs", { mode: "json" }).$type<{ id: string; kind: string; version: number }[]>().notNull().default([]),
    status: text("status").$type<"draft" | "active" | "retired">().notNull().default("draft"),
    retiredReason: text("retired_reason"),
    source: text("source").$type<"seed" | "generated" | "admin">().notNull().default("seed"),
    validatedAt: integer("validated_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    index("question_bank_pick_idx").on(t.departmentId, t.status, t.skillId, t.type, t.difficulty),
  ],
);

// ---------------------------------------------------------------------------
// v4.1: Oyelabs SOP blocks — company procedures an admin writes into a topic
// ---------------------------------------------------------------------------

/** One filled `[Oyelabs SOP – admin to fill]` block, keyed by the topic and the block's position. */
export const sopEntries = sqliteTable(
  "sop_entries",
  {
    topicId: text("topic_id").notNull(),
    blockIndex: integer("block_index").notNull(),
    body: text("body").notNull(),
    updatedBy: text("updated_by").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.topicId, t.blockIndex] })],
);

// ---------------------------------------------------------------------------
// v4.2: the Oyelabs Process Handbook (shared/handbook.ts)
// ---------------------------------------------------------------------------

/**
 * One handbook entry (term, stage, rule or template). Seeded from `server/handbook/*.json`; the
 * seed only rewrites a row nobody has edited (`updated_by` null), so an admin's edit always wins.
 */
export const handbookEntries = sqliteTable(
  "handbook_entries",
  {
    kind: text("kind").$type<"term" | "stage" | "rule" | "template">().notNull(),
    id: text("id").notNull(),
    data: text("data", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    version: integer("version").notNull().default(1),
    /** Hash of the seed entry this row was last written from; null for an admin-created entry. */
    seedHash: text("seed_hash"),
    updatedAt: integer("updated_at").notNull(),
    /** Null = untouched seed. */
    updatedBy: text("updated_by"),
    /** Templates: the admin's replacement file under DATA_DIR/handbook/, and its content type. */
    uploadName: text("upload_name"),
    uploadType: text("upload_type"),
  },
  (t) => [primaryKey({ columns: [t.kind, t.id] })],
);

/** A learner's Leitner box for one glossary term. */
export const handbookFlashcards = sqliteTable(
  "handbook_flashcards",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    termId: text("term_id").notNull(),
    box: integer("box").notNull().default(1),
    dueAt: integer("due_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.termId] })],
);

// ---------------------------------------------------------------------------
// v4.2: the AI client role-play (shared/roleplay.ts)
// ---------------------------------------------------------------------------

/**
 * One role-play conversation. `transcript` is the authoritative record; an assessment response
 * only points at it. `cost_micros` sums the model calls this session made (replies and scoring).
 */
export const roleplaySessions = sqliteTable(
  "roleplay_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scenarioId: text("scenario_id").notNull(),
    personaId: text("persona_id").notNull(),
    context: text("context").$type<"practice" | "assessment">().notNull(),
    assessmentId: text("assessment_id"),
    itemId: text("item_id"),
    mode: text("mode").$type<"ai" | "scripted">().notNull(),
    transcript: text("transcript", { mode: "json" }).$type<{ role: "pm" | "client"; text: string }[]>().notNull(),
    turns: integer("turns").notNull().default(0),
    maxTurns: integer("max_turns").notNull(),
    status: text("status").$type<"active" | "finished" | "scored">().notNull(),
    followUpEmail: text("follow_up_email"),
    score: text("score", { mode: "json" }).$type<Record<string, unknown>>(),
    costMicros: integer("cost_micros").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    finishedAt: integer("finished_at"),
  },
  (t) => [
    index("roleplay_sessions_user_idx").on(t.userId, t.createdAt),
    index("roleplay_sessions_created_idx").on(t.createdAt),
    uniqueIndex("roleplay_sessions_item_idx").on(t.assessmentId, t.itemId),
  ],
);

// ---------------------------------------------------------------------------
// v4.3: goals and practical outcomes (shared/goals.ts)
// ---------------------------------------------------------------------------

/**
 * The department's library of practical outcomes ("Resolve a merge conflict and open a clean PR").
 * Seeded from server/src/goals/seed/; an admin may edit. `capstone` is the practice task that
 * proves the outcome, and passing it marks a goal achieved.
 */
export const practicalOutcomes = sqliteTable(
  "practical_outcomes",
  {
    id: text("id").primaryKey(),
    departmentId: text("department_id").notNull(),
    title: text("title").notNull(),
    /** The "can do" statement: "Can resolve a merge conflict and open a clean pull request." */
    statement: text("statement").notNull(),
    skillIds: text("skill_ids", { mode: "json" }).$type<string[]>().notNull(),
    /** 1-5, on the same scale as mastery. */
    level: integer("level").notNull(),
    aliases: text("aliases", { mode: "json" }).$type<string[]>().notNull(),
    capstone: text("capstone", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    status: text("status").$type<"active" | "archived">().notNull().default("active"),
    position: integer("position").notNull().default(0),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("practical_outcomes_dept_idx").on(t.departmentId, t.position)],
);

/**
 * One "What should they be able to do?" entry: a catalog skill, a practical case, or a free-text
 * goal the AI interpreted. The skill priorities (learner_skill_priorities) are derived from these.
 */
export const learnerGoals = sqliteTable(
  "learner_goals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<"skill" | "case" | "text">().notNull(),
    /** What the admin picked or typed. */
    originalText: text("original_text").notNull(),
    outcome: text("outcome").notNull(),
    skillIds: text("skill_ids", { mode: "json" }).$type<string[]>().notNull(),
    targetLevel: integer("target_level").notNull(),
    caseId: text("case_id"),
    slider: integer("slider").notNull(),
    position: integer("position").notNull().default(0),
    status: text("status").$type<"active" | "achieved">().notNull().default("active"),
    achievedAt: integer("achieved_at"),
    source: text("source").$type<"admin" | "suggested" | "auto">().notNull().default("admin"),
    /** v4.4: the `Intent.id` this goal was built from, so a goal's origin phrase can be shown. */
    intentId: text("intent_id"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("learner_goals_user_idx").on(t.userId, t.position)],
);

/** "Suggested next" goals: added or dismissed by the admin, or auto-added when they allow it. */
export const goalSuggestions = sqliteTable(
  "goal_suggestions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"next-level" | "gap" | "progression">().notNull(),
    title: text("title").notNull(),
    outcome: text("outcome").notNull(),
    skillIds: text("skill_ids", { mode: "json" }).$type<string[]>().notNull(),
    targetLevel: integer("target_level").notNull(),
    caseId: text("case_id"),
    reason: text("reason").notNull(),
    status: text("status").$type<"open" | "added" | "dismissed">().notNull().default("open"),
    createdAt: integer("created_at").notNull(),
    decidedAt: integer("decided_at"),
  },
  (t) => [index("goal_suggestions_user_idx").on(t.userId, t.status)],
);

// ---------------------------------------------------------------------------
// v4.3: the skill graph (shared/skillGraph.ts)
// ---------------------------------------------------------------------------

/** from_skill must be learned before (prerequisite), or helps before (recommended), to_skill. */
export const skillEdges = sqliteTable(
  "skill_edges",
  {
    fromSkill: text("from_skill").notNull(),
    toSkill: text("to_skill").notNull(),
    type: text("type").$type<"prerequisite" | "recommended">().notNull(),
    /** Null = seeded; otherwise the admin who added or edited it. */
    updatedBy: text("updated_by"),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.fromSkill, t.toSkill] }), index("skill_edges_to_idx").on(t.toSkill)],
);

// ---------------------------------------------------------------------------
// v4.3: video watch tracking (shared/video.ts)
// ---------------------------------------------------------------------------

/**
 * One learner's progress on one video of one topic. `ranges` are the merged [start, end] second
 * intervals actually played, so seeking ahead never counts; `watchedSeconds` is their total.
 */
export const videoProgress = sqliteTable(
  "video_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topicId: text("topic_id").notNull(),
    videoId: text("video_id").notNull(),
    ranges: text("ranges", { mode: "json" }).$type<[number, number][]>().notNull(),
    watchedSeconds: real("watched_seconds").notNull().default(0),
    lastPosition: real("last_position").notNull().default(0),
    durationSeconds: real("duration_seconds"),
    completedAt: integer("completed_at"),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.topicId, t.videoId] }), index("video_progress_user_topic_idx").on(t.userId, t.topicId)],
);

/** Video durations: from the YouTube Data API when a key is set, else as the player reports them. */
export const videoMeta = sqliteTable("video_meta", {
  videoId: text("video_id").primaryKey(),
  durationSeconds: real("duration_seconds").notNull(),
  source: text("source").$type<"data-api" | "player">().notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/** Small per-user preferences that must follow the learner across devices (autoplay next). */
export const userPrefs = sqliteTable("user_prefs", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  data: text("data", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// ---------------------------------------------------------------------------
// v4.3: grounded, calibrated topic tests (shared/topicTests.ts)
// ---------------------------------------------------------------------------

/**
 * What a topic teaches, as numbered passages the question writer may cite: the summary, sections,
 * key points and notes, plus each video's transcript status ("not used for questions" when none).
 */
export const topicGrounding = sqliteTable("topic_grounding", {
  topicId: text("topic_id").primaryKey(),
  content: text("content", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  hash: text("hash").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/**
 * One test item for a topic. `origin` static = imported from the content file's quiz; generated =
 * written by the grounded generator. Only `active` items are served. The counters drive calibration.
 */
export const topicTestItems = sqliteTable(
  "topic_test_items",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id").notNull(),
    origin: text("origin").$type<"static" | "generated">().notNull(),
    /** Static items: the quiz question id in the content file. */
    sourceId: text("source_id"),
    status: text("status").$type<"active" | "flagged" | "retired" | "draft">().notNull(),
    item: text("item", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    gates: text("gates", { mode: "json" }).$type<Record<string, unknown>>(),
    groundingHash: text("grounding_hash"),
    attempts: integer("attempts").notNull().default(0),
    passes: integer("passes").notNull().default(0),
    /** Attempts by learners in the top band for this topic, and how many of those got it wrong. */
    strongAttempts: integer("strong_attempts").notNull().default(0),
    strongFails: integer("strong_fails").notNull().default(0),
    flagReason: text("flag_reason"),
    retiredReason: text("retired_reason"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("topic_test_items_topic_idx").on(t.topicId, t.status), uniqueIndex("topic_test_items_source_idx").on(t.topicId, t.sourceId)],
);

// ---------------------------------------------------------------------------
// v4.4: bundles, Speak recordings and score reviews
// ---------------------------------------------------------------------------

/**
 * A named set of skills that one phrase in an admin's description stands for ("move to the full
 * stack" means the backend progression). A table rather than code so admins can edit phrases and
 * skills; seeded rows have `updatedBy` null. The skill graph still decides the final order.
 */
export const skillBundles = sqliteTable("skill_bundles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  /** Null = usable in any department. */
  departmentId: text("department_id"),
  /** [] = any current track; ["frontend"] = only when the learner's current role is frontend. */
  fromTrackIds: text("from_track_ids", { mode: "json" }).$type<string[]>().notNull().default([]),
  /** Lower-case trigger phrases matched against the description. */
  phrases: text("phrases", { mode: "json" }).$type<string[]>().notNull().default([]),
  /** Ordered catalog skill ids. */
  skillIds: text("skill_ids", { mode: "json" }).$type<string[]>().notNull().default([]),
  targetLevel: integer("target_level").notNull().default(3),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  updatedBy: text("updated_by"),
  updatedAt: integer("updated_at").notNull(),
});

/**
 * One spoken answer to a Speak item (an assessment item or topic practice). The audio itself is an
 * AES-256-GCM file under `DATA_DIR/audio` (`encPath` is relative to it), never a blob in SQLite,
 * and is deleted after `audio.retention_days`; the transcript and metrics are kept.
 */
export const audioRecordings = sqliteTable(
  "audio_recordings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assessmentId: text("assessment_id"),
    itemId: text("item_id"),
    /** Set for topic practice instead of an assessment item. */
    topicId: text("topic_id"),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull(),
    durationSec: real("duration_sec"),
    encPath: text("enc_path").notNull(),
    transcript: text("transcript"),
    /** Word timings from the transcriber: [{ w, start, end }]. */
    words: text("words", { mode: "json" }).$type<{ w: string; start: number; end: number }[]>(),
    /** Derived from the word timings. */
    metrics: text("metrics", { mode: "json" }).$type<{ wpm: number; pauses: number; longestPauseSec: number; fillers: number }>(),
    sttStatus: text("stt_status").$type<"pending" | "done" | "failed" | "unavailable">().notNull().default("pending"),
    sttError: text("stt_error"),
    createdAt: integer("created_at").notNull(),
    /** Set by the retention job when the audio file is removed. */
    audioDeletedAt: integer("audio_deleted_at"),
  },
  (t) => [
    index("audio_recordings_user_idx").on(t.userId),
    index("audio_recordings_item_idx").on(t.assessmentId, t.itemId),
    index("audio_recordings_created_idx").on(t.createdAt),
  ],
);

/**
 * A learner asking for one graded answer to be looked at again. An override counts as a pass, goes
 * in the audit log and feeds calibration. `refId` is an assessment item id or a topic test item id,
 * depending on `source`.
 */
export const reviewRequests = sqliteTable(
  "review_requests",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: text("source").$type<"assessment_item" | "topic_item">().notNull(),
    refId: text("ref_id").notNull(),
    /** The topic attempt it came from, for `topic_item` reviews. */
    attemptId: text("attempt_id"),
    status: text("status").$type<"open" | "upheld" | "overridden">().notNull().default("open"),
    learnerNote: text("learner_note").notNull().default(""),
    createdAt: integer("created_at").notNull(),
    resolvedBy: text("resolved_by"),
    resolvedAt: integer("resolved_at"),
    /** The admin's one-line answer, shown to the learner. */
    resolution: text("resolution"),
  },
  (t) => [index("review_requests_status_idx").on(t.status, t.createdAt), index("review_requests_user_idx").on(t.userId)],
);
