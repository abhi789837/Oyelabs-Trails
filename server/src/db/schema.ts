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
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
  updatedAt: integer("updated_at").notNull(),
  updatedBy: text("updated_by"),
});

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
  updatedAt: integer("updated_at").notNull(),
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
