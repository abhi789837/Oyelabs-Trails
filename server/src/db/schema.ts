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
