import fs from "node:fs";
import path from "node:path";

import { and, eq, inArray } from "drizzle-orm";

import type { DeletionCounts, UserExport } from "../../../shared/admin";
import { schema, type Db } from "../db";
import type { Env } from "../env";

/**
 * Removing a person from the platform, permanently.
 *
 * ## What survives, and why
 *
 * **A course promoted to the global catalogue stays.** It stopped being this learner's the moment
 * somebody saved it to the library: other people have it assigned, it is cited in other plans, and
 * deleting it because the person it was first written for has left would silently break their week.
 * The link to the learner is cut (`generated_courses.user_id` is nulled by its own `set null`), so
 * nothing about them remains on it.
 *
 * **A learner-scoped generated course goes.** It was written for one person, nobody else can open
 * it, and it is full of their gap evidence.
 *
 * **The audit trail stays, anonymised.** Rows where the deleted account was the *actor* keep the
 * action and the timestamp and lose the id — "an account that no longer exists disabled this
 * learner in March" is still a true and useful sentence. A new row records the deletion itself.
 *
 * ## Why so much of this is explicit
 *
 * Most of these tables cascade from `users` already, and `foreign_keys = ON` is set per connection
 * in `db/index.ts`. The deletes below are still written out, for three reasons: the counts are
 * wanted for the confirmation and the audit row, the two `generated_courses` cases are a policy
 * decision rather than a cascade, and the snapshot *files* are on disk where no foreign key
 * reaches. A cascade that silently changes shape when a table is added is also exactly the kind of
 * thing that turns a delete into a half-delete.
 */

export interface DeleteUserResult {
  counts: DeletionCounts;
  /** Snapshot files that could not be removed. Reported rather than swallowed. */
  fileErrors: string[];
}

/**
 * Deletes one user and everything personal to them, in a single transaction.
 *
 * The caller has already checked who is allowed to do this. Snapshot files are removed **after** the
 * transaction commits: a filesystem unlink cannot be rolled back, so doing it inside would mean a
 * failed transaction had already destroyed the images.
 */
export function deleteUserCompletely(db: Db, env: Env, userId: string): DeleteUserResult {
  const assessmentIds = db
    .select({ id: schema.assessments.id })
    .from(schema.assessments)
    .where(eq(schema.assessments.userId, userId))
    .all()
    .map((row) => row.id);

  const snapshotPaths = db
    .select({ snapshotPath: schema.integrityEvents.snapshotPath })
    .from(schema.integrityEvents)
    .where(eq(schema.integrityEvents.userId, userId))
    .all()
    .map((row) => row.snapshotPath)
    .filter((value): value is string => value !== null);

  const counts = db.transaction((tx) => {
    const count = (rows: { changes: number }) => rows.changes;

    /* By assessment *and* by user. `integrity_events.user_id` is `notNull` but carries no foreign
       key, so it is the one column holding a person's id that no cascade would ever reach. Today
       every event hangs off one of their assessments and the first delete covers it; the second
       makes "nothing personal remains" true of a row that arrived by any other route. */
    const integrityEvents =
      (assessmentIds.length
        ? count(tx.delete(schema.integrityEvents).where(inArray(schema.integrityEvents.assessmentId, assessmentIds)).run())
        : 0) + count(tx.delete(schema.integrityEvents).where(eq(schema.integrityEvents.userId, userId)).run());

    /* Generated courses, in two halves. The global ones are detached and kept; the learner-scoped
       ones are deleted along with the `courses` row they own, which takes their sections, topics and
       sources with it by cascade. */
    const generated = tx
      .select({ courseId: schema.generatedCourses.courseId, scope: schema.generatedCourses.scope })
      .from(schema.generatedCourses)
      .where(eq(schema.generatedCourses.userId, userId))
      .all();

    const learnerOwned = generated.filter((row) => row.scope === "learner").map((row) => row.courseId);
    const keptGlobalCourses = generated.length - learnerOwned.length;

    if (keptGlobalCourses > 0) {
      tx.update(schema.generatedCourses)
        .set({ userId: null })
        .where(and(eq(schema.generatedCourses.userId, userId), eq(schema.generatedCourses.scope, "global")))
        .run();
    }
    const generatedCourses = learnerOwned.length
      ? count(tx.delete(schema.courses).where(inArray(schema.courses.id, learnerOwned)).run())
      : 0;

    const result: DeletionCounts = {
      sessions: count(tx.delete(schema.sessions).where(eq(schema.sessions.userId, userId)).run()),
      assessments: assessmentIds.length,
      integrityEvents,
      snapshots: snapshotPaths.length,
      plans: count(tx.delete(schema.learningPlans).where(eq(schema.learningPlans.userId, userId)).run()),
      weeks: count(tx.delete(schema.weeklyPlans).where(eq(schema.weeklyPlans.userId, userId)).run()),
      progress: count(tx.delete(schema.topicProgress).where(eq(schema.topicProgress.userId, userId)).run()),
      attempts: count(tx.delete(schema.topicAttempts).where(eq(schema.topicAttempts.userId, userId)).run()),
      certificates: count(tx.delete(schema.certificates).where(eq(schema.certificates.userId, userId)).run()),
      notifications: count(tx.delete(schema.notifications).where(eq(schema.notifications.recipientId, userId)).run()),
      generatedCourses,
      keptGlobalCourses,
    };

    // The rest, explicitly, in dependency order. Each also cascades; saying so twice is cheap.
    tx.delete(schema.assessmentConsents).where(eq(schema.assessmentConsents.userId, userId)).run();
    if (assessmentIds.length) {
      tx.delete(schema.assessments).where(eq(schema.assessments.userId, userId)).run();
    }
    tx.delete(schema.courseProgress).where(eq(schema.courseProgress.userId, userId)).run();
    tx.delete(schema.courseAssignments).where(eq(schema.courseAssignments.userId, userId)).run();
    tx.delete(schema.skillGaps).where(eq(schema.skillGaps.userId, userId)).run();
    tx.delete(schema.learningPaths).where(eq(schema.learningPaths.userId, userId)).run();
    tx.delete(schema.learnerPriorities).where(eq(schema.learnerPriorities.userId, userId)).run();
    tx.delete(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).run();

    /* The audit trail survives the account. Actions this person *took* keep their shape and lose
       their author, because "somebody who no longer has an account disabled this learner" is still
       worth knowing, and rewriting history is not the alternative on offer. */
    tx.update(schema.auditLog).set({ actorId: null }).where(eq(schema.auditLog.actorId, userId)).run();

    tx.delete(schema.users).where(eq(schema.users.id, userId)).run();
    return result;
  });

  const fileErrors = removeSnapshots(env, snapshotPaths);
  return { counts, fileErrors };
}

/**
 * Unlinks the proctoring images.
 *
 * Every path is resolved and checked to be inside the snapshots directory before anything is
 * removed. The values come from our own rows, but a delete that walks a path out of a database
 * column is worth one `startsWith` — the cost is nothing and the failure mode is unbounded.
 */
function removeSnapshots(env: Env, relativePaths: readonly string[]): string[] {
  const errors: string[] = [];
  const root = path.resolve(env.snapshotsDir);

  for (const relative of relativePaths) {
    const target = path.resolve(root, relative);
    if (target !== root && !target.startsWith(root + path.sep)) {
      errors.push(`refused to delete ${relative}: outside the snapshots directory`);
      continue;
    }
    try {
      fs.rmSync(target, { force: true });
    } catch (error) {
      errors.push(`${relative}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return errors;
}

/**
 * Everything the platform holds about one person, as a plain object.
 *
 * Offered before a deletion and downloadable on its own. Proctoring *events* are included — what was
 * flagged, when, how severe — but the snapshot images are not: a JSON file carrying webcam frames of
 * somebody is a thing that then exists in a downloads folder, and the events say what happened
 * without it.
 *
 * The password hash, session tokens and consent IP addresses are not in it either. None of them is
 * information *about* the person in any useful sense, and all three are worth less on a disk.
 */
export function exportUser(db: Db, userId: string, exportedBy: string): UserExport | null {
  const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) return null;

  const assessments = db.select().from(schema.assessments).where(eq(schema.assessments.userId, userId)).all();
  const assessmentIds = assessments.map((row) => row.id);

  const evaluations = assessmentIds.length
    ? db.select().from(schema.evaluations).where(inArray(schema.evaluations.assessmentId, assessmentIds)).all()
    : [];

  const integrity = assessmentIds.length
    ? db
        .select({
          assessmentId: schema.integrityEvents.assessmentId,
          type: schema.integrityEvents.type,
          severity: schema.integrityEvents.severity,
          createdAt: schema.integrityEvents.createdAt,
          details: schema.integrityEvents.details,
        })
        .from(schema.integrityEvents)
        .where(inArray(schema.integrityEvents.assessmentId, assessmentIds))
        .all()
    : [];

  const weeks = db.select().from(schema.weeklyPlans).where(eq(schema.weeklyPlans.userId, userId)).all();
  const weekItems = weeks.length
    ? db
        .select()
        .from(schema.weeklyPlanItems)
        .where(
          inArray(
            schema.weeklyPlanItems.planId,
            weeks.map((week) => week.id),
          ),
        )
        .all()
    : [];

  return {
    exportedAt: Date.now(),
    exportedBy,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    profile: db.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).get() ?? null,
    priorities: db.select().from(schema.learnerPriorities).where(eq(schema.learnerPriorities.userId, userId)).get() ?? null,
    targets: [],
    // The stored pool carries the answer key, so only what was asked and how it went comes out.
    assessments: assessments.map((row) => ({
      id: row.id,
      attemptNo: row.attemptNo,
      label: row.label,
      status: row.status,
      createdAt: row.createdAt,
      startedAt: row.startedAt,
      submittedAt: row.submittedAt,
      hardWarnings: row.hardWarnings,
      softWarnings: row.softWarnings,
      terminatedReason: row.terminatedReason,
    })),
    evaluations: evaluations.map((row) => ({ assessmentId: row.assessmentId, result: row.result, createdAt: row.createdAt })),
    integrity,
    plans: db.select().from(schema.learningPlans).where(eq(schema.learningPlans.userId, userId)).all(),
    weeks: weeks.map((week) => ({ ...week, items: weekItems.filter((item) => item.planId === week.id) })),
    progress: db.select().from(schema.topicProgress).where(eq(schema.topicProgress.userId, userId)).all(),
    attempts: db.select().from(schema.topicAttempts).where(eq(schema.topicAttempts.userId, userId)).all(),
    certificates: db.select().from(schema.certificates).where(eq(schema.certificates.userId, userId)).all(),
    courseProgress: db.select().from(schema.courseProgress).where(eq(schema.courseProgress.userId, userId)).all(),
    generatedCourses: db.select().from(schema.generatedCourses).where(eq(schema.generatedCourses.userId, userId)).all(),
  };
}
