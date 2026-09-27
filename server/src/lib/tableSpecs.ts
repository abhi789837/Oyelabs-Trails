import {
  aiPurposeSchema,
  assessmentStatusSchema,
  providerIdSchema,
  roleSchema,
  severitySchema,
  userStatusSchema,
} from "../../../shared/enums";
import { schema } from "../db";
import { defineTableSpec } from "./tableQuery";

/**
 * The whitelists themselves: every column any table in the admin console is allowed to filter or
 * sort by, written out once.
 *
 * These are allow-lists, not deny-lists, and the difference is the whole point. A column added to
 * `db/schema.ts` tomorrow is invisible to the query layer until someone writes it down here and
 * decides what may be done with it. That is why `users.password_hash`, `users.locked_until`,
 * `audit_log.details` and `assessments.blueprint` are absent: not because they are hidden, but
 * because nobody ever granted them, and the gate defaults to no.
 *
 * Two further rules these specs follow:
 *
 * - **`sortable: false` where sorting would scan.** Sorting is on by default, and switched off on
 *   the unbounded tables (`audit_log`, `ai_calls`, `integrity_events`, `assessments`) for columns
 *   with no index in `db/schema.ts` to lean on. Otherwise clicking a column header is a full scan
 *   of a table that only grows, triggered by a single click. The small, bounded tables — `users`
 *   above all — sort on anything, because scanning a few hundred rows costs nothing.
 * - **Searchable means short and human.** The global `q` box runs `LIKE '%…%'` across every
 *   searchable field, so a long free-text column would make the cheapest interaction the most
 *   expensive one.
 */

/**
 * `/api/admin/users` — the People table.
 *
 * `passwordHash`, `failedLogins` and `lockedUntil` are deliberately not here. The first must never
 * be queryable at all; the other two would let the table be used to probe which accounts are
 * currently locked out, which is a detail of the login rate limiter and not a property of a person.
 */
export const usersTableSpec = defineTableSpec({
  name: "people",
  fields: {
    id: { column: schema.users.id, type: "string", sortable: true },
    username: { column: schema.users.username, type: "string", searchable: true },
    displayName: { column: schema.users.displayName, type: "string", searchable: true },
    role: { column: schema.users.role, type: "enum", values: roleSchema.options },
    status: { column: schema.users.status, type: "enum", values: userStatusSchema.options },
    mustChangePassword: { column: schema.users.mustChangePassword, type: "boolean" },
    createdAt: { column: schema.users.createdAt, type: "date" },
    lastLoginAt: { column: schema.users.lastLoginAt, type: "date" },
  },
  defaultSort: [{ field: "createdAt", dir: "desc" }],
});

/**
 * `/api/admin/audit` — the audit log. Unbounded and append-only, so this one is always paged on
 * the server.
 *
 * `details` is a JSON blob whose contents vary per action and can carry a username, an IP or a
 * reason. Filtering on it would mean `LIKE` over serialised JSON — slow, and a way to fish for
 * values the columns do not expose. Read it on the row, do not query it.
 */
export const auditTableSpec = defineTableSpec({
  name: "audit log",
  fields: {
    id: { column: schema.auditLog.id, type: "string", sortable: true },
    actorId: { column: schema.auditLog.actorId, type: "string", sortable: false },
    action: { column: schema.auditLog.action, type: "string", searchable: true, sortable: false },
    targetType: { column: schema.auditLog.targetType, type: "string", sortable: false },
    targetId: { column: schema.auditLog.targetId, type: "string", searchable: true, sortable: false },
    createdAt: { column: schema.auditLog.createdAt, type: "date" },
  },
  defaultSort: [{ field: "createdAt", dir: "desc" }],
  maxPageSize: 100,
});

/**
 * `/api/admin/ai/calls` — provider usage. Also unbounded; one assessment generation writes a
 * dozen rows.
 *
 * `error` is searchable because "show me every call that failed with a 429" is the question this
 * table exists to answer. It is provider text, never learner text — the AI layer redacts before
 * it stores.
 */
export const aiCallsTableSpec = defineTableSpec({
  name: "AI calls",
  fields: {
    id: { column: schema.aiCalls.id, type: "string", sortable: true },
    provider: { column: schema.aiCalls.provider, type: "enum", values: providerIdSchema.options, sortable: false },
    model: { column: schema.aiCalls.model, type: "string", searchable: true, sortable: false },
    purpose: { column: schema.aiCalls.purpose, type: "enum", values: aiPurposeSchema.options },
    subjectUserId: { column: schema.aiCalls.subjectUserId, type: "string" },
    assessmentId: { column: schema.aiCalls.assessmentId, type: "string", sortable: false },
    inputTokens: { column: schema.aiCalls.inputTokens, type: "number", sortable: false },
    outputTokens: { column: schema.aiCalls.outputTokens, type: "number", sortable: false },
    latencyMs: { column: schema.aiCalls.latencyMs, type: "number", sortable: false },
    ok: { column: schema.aiCalls.ok, type: "boolean", sortable: false },
    error: { column: schema.aiCalls.error, type: "string", searchable: true, sortable: false },
    createdAt: { column: schema.aiCalls.createdAt, type: "date" },
  },
  defaultSort: [{ field: "createdAt", dir: "desc" }],
  maxPageSize: 100,
});

/**
 * `/api/admin/assessments/:id/integrity` and the global feed — proctoring events.
 *
 * `snapshotPath` is a path on the server's disk. It is not a field anyone filters by, and making
 * it one would turn the table into a way to enumerate the filesystem layout.
 */
export const integrityEventsTableSpec = defineTableSpec({
  name: "integrity events",
  fields: {
    id: { column: schema.integrityEvents.id, type: "string", sortable: true },
    assessmentId: { column: schema.integrityEvents.assessmentId, type: "string" },
    userId: { column: schema.integrityEvents.userId, type: "string", sortable: false },
    type: { column: schema.integrityEvents.type, type: "string", searchable: true, sortable: false },
    severity: { column: schema.integrityEvents.severity, type: "enum", values: severitySchema.options, sortable: false },
    counted: { column: schema.integrityEvents.counted, type: "boolean", sortable: false },
    createdAt: { column: schema.integrityEvents.createdAt, type: "date" },
  },
  defaultSort: [{ field: "createdAt", dir: "desc" }],
  maxPageSize: 100,
});

/**
 * `/api/admin/users/:id/attempts` — one learner's topic attempts, which grow without bound as
 * they work through a plan.
 *
 * `code` and `answers` hold what the learner actually submitted. They belong on the detail panel,
 * not in a `WHERE` clause: searching them would be slow and would make one learner's submitted
 * source discoverable by guessing substrings.
 *
 * Every column sorts here, unlike the other unbounded tables, because the route always scopes this
 * one to a single learner first — `topic_attempts_user_topic_idx` narrows it to that learner's
 * rows before any ordering happens, and that is a handful of rows, not a table.
 */
export const topicAttemptsTableSpec = defineTableSpec({
  name: "topic attempts",
  fields: {
    id: { column: schema.topicAttempts.id, type: "string", sortable: true },
    userId: { column: schema.topicAttempts.userId, type: "string" },
    topicId: { column: schema.topicAttempts.topicId, type: "string", searchable: true },
    kind: { column: schema.topicAttempts.kind, type: "enum", values: ["quiz", "code"] },
    score: { column: schema.topicAttempts.score, type: "number" },
    passed: { column: schema.topicAttempts.passed, type: "boolean" },
    createdAt: { column: schema.topicAttempts.createdAt, type: "date" },
  },
  defaultSort: [{ field: "createdAt", dir: "desc" }],
  maxPageSize: 100,
});

/**
 * `/api/admin/assessments` — one row per assessment attempt.
 *
 * Bounded in practice: an attempt or two per learner, so the columns here sort freely even where
 * no index covers them. The counts and timestamps are marked non-sortable anyway, because sorting
 * a list of assessments by `softWarnings` is not a question anyone asks — filtering on it is.
 */
export const assessmentsTableSpec = defineTableSpec({
  name: "assessments",
  fields: {
    id: { column: schema.assessments.id, type: "string", sortable: true },
    userId: { column: schema.assessments.userId, type: "string" },
    attemptNo: { column: schema.assessments.attemptNo, type: "number", sortable: false },
    status: { column: schema.assessments.status, type: "enum", values: assessmentStatusSchema.options },
    hardWarnings: { column: schema.assessments.hardWarnings, type: "number", sortable: false },
    softWarnings: { column: schema.assessments.softWarnings, type: "number", sortable: false },
    startedAt: { column: schema.assessments.startedAt, type: "date", sortable: false },
    submittedAt: { column: schema.assessments.submittedAt, type: "date", sortable: false },
    createdAt: { column: schema.assessments.createdAt, type: "date" },
  },
  defaultSort: [{ field: "createdAt", dir: "desc" }],
  maxPageSize: 100,
});
