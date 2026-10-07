import { and, asc, eq, inArray } from "drizzle-orm";

import {
  ASSIGNMENT_PRIORITIES,
  ASSIGNMENT_PRIORITY_LABELS,
  type AssignCourseRequest,
  type AssignCourseResponse,
  type AssignmentPriority,
  type CourseAssignmentsView,
  type CourseSearchHit,
  type LearnerCoursesView,
} from "../../../../shared/oyelabsCourses";
import { schema, type Db } from "../../db";
import { badRequest, notFound } from "../../lib/errors";
import { now } from "../../lib/ids";

/**
 * v4.5 Phase 4: adding a course to people (PLAN.md §4.4).
 *
 *   learner              one `course_assignments` row (source `admin`) with the priority;
 *   department           one row per learner in it *now* (source `department`);
 *   department_everyone  a `course_department_rules` row, read lazily, so people who join later
 *                        have it too (no backfill), with an optional `required`.
 *
 * Adding again updates the priority, never duplicates a row, and never removes anything.
 */

const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

/** The more important of two priorities (null = none set). */
export function higherPriority(a: AssignmentPriority | null | undefined, b: AssignmentPriority | null | undefined): AssignmentPriority | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return ASSIGNMENT_PRIORITIES.indexOf(a) <= ASSIGNMENT_PRIORITIES.indexOf(b) ? a : b;
}

function courseOrThrow(db: Db, courseId: string) {
  const course = db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).get();
  if (!course) throw notFound("We couldn't find that course. It may have been deleted.");
  return course;
}

function departmentOrThrow(db: Db, departmentId: string) {
  const department = db.select().from(schema.departments).where(eq(schema.departments.id, departmentId)).get();
  if (!department) throw notFound("We couldn't find that department.");
  return department;
}

/** Active learners whose department is this one. */
export function learnersIn(db: Db, departmentId: string): string[] {
  return db
    .select({ id: schema.users.id })
    .from(schema.users)
    .innerJoin(schema.learnerProfiles, eq(schema.learnerProfiles.userId, schema.users.id))
    .where(and(eq(schema.users.role, "learner"), eq(schema.learnerProfiles.departmentId, departmentId)))
    .all()
    .map((row) => row.id);
}

/** Inserts or re-prioritises one learner's row. An `admin` row is never turned into a `department` one. */
function upsertAssignment(db: Db, courseId: string, userId: string, priority: AssignmentPriority, source: "admin" | "department", actorId: string | null): "added" | "updated" | "same" {
  const existing = db
    .select()
    .from(schema.courseAssignments)
    .where(and(eq(schema.courseAssignments.courseId, courseId), eq(schema.courseAssignments.userId, userId)))
    .get();
  if (!existing) {
    db.insert(schema.courseAssignments).values({ courseId, userId, assignedBy: actorId, assignedAt: now(), priority, source }).run();
    return "added";
  }
  const nextSource = existing.source === "admin" || source === "admin" ? "admin" : existing.source === "path" ? "path" : source;
  if (existing.priority === priority && existing.source === nextSource) return "same";
  db.update(schema.courseAssignments)
    .set({ priority, source: nextSource })
    .where(and(eq(schema.courseAssignments.courseId, courseId), eq(schema.courseAssignments.userId, userId)))
    .run();
  return "updated";
}

/** Who was affected, so the caller can refresh their week. */
export interface AssignResult extends AssignCourseResponse {
  userIds: string[];
}

export function assignCourse(db: Db, actorId: string | null, request: AssignCourseRequest): AssignResult {
  const course = courseOrThrow(db, request.courseId);
  const label = ASSIGNMENT_PRIORITY_LABELS[request.priority];
  const live = course.published ? "" : " They'll see it once you make it live.";
  const { target } = request;

  if (target.kind === "learner") {
    const user = db.select().from(schema.users).where(eq(schema.users.id, target.userId)).get();
    if (!user) throw notFound("We couldn't find that person.");
    if (user.role !== "learner") throw badRequest("Courses can only be added to learners.");
    const result = db.transaction(() => upsertAssignment(db, course.id, user.id, request.priority, "admin", actorId));
    const message =
      result === "added"
        ? `Added "${course.title}" for ${user.displayName} as ${label}.${live}`
        : result === "updated"
          ? `${user.displayName} already had "${course.title}". It's ${label} now.`
          : `${user.displayName} already has "${course.title}" as ${label}.`;
    return { added: result === "added" ? 1 : 0, updated: result === "updated" ? 1 : 0, message, userIds: [user.id] };
  }

  const department = departmentOrThrow(db, target.departmentId);

  if (target.kind === "department") {
    const ids = learnersIn(db, department.id);
    let added = 0;
    let updated = 0;
    db.transaction(() => {
      for (const userId of ids) {
        const result = upsertAssignment(db, course.id, userId, request.priority, "department", actorId);
        if (result === "added") added += 1;
        else if (result === "updated") updated += 1;
      }
    });
    const message =
      ids.length === 0
        ? `Nobody is in ${department.name} yet, so nobody got "${course.title}". Use "Everyone in ${department.name}" to include people who join later.`
        : `Added "${course.title}" for ${people(ids.length)} in ${department.name} as ${label}.${live}`;
    return { added, updated, message, userIds: ids };
  }

  const required = target.required;
  const row = { priority: request.priority, required, createdBy: actorId, createdAt: now() };
  db.insert(schema.courseDepartmentRules)
    .values({ courseId: course.id, departmentId: department.id, ...row })
    .onConflictDoUpdate({ target: [schema.courseDepartmentRules.courseId, schema.courseDepartmentRules.departmentId], set: { priority: row.priority, required: row.required } })
    .run();
  const message = required
    ? `"${course.title}" is now required for everyone in ${department.name}, including people who join later. New people get it in Do it now in their first weeks.${live}`
    : `Everyone in ${department.name} gets "${course.title}" as ${label}, including people who join later.${live}`;
  return { added: 0, updated: 0, message, userIds: learnersIn(db, department.id) };
}

export function courseAssignmentsView(db: Db, courseId: string): CourseAssignmentsView {
  courseOrThrow(db, courseId);
  const learners = db
    .select({
      userId: schema.courseAssignments.userId,
      displayName: schema.users.displayName,
      priority: schema.courseAssignments.priority,
      source: schema.courseAssignments.source,
      assignedAt: schema.courseAssignments.assignedAt,
    })
    .from(schema.courseAssignments)
    .innerJoin(schema.users, eq(schema.users.id, schema.courseAssignments.userId))
    .where(eq(schema.courseAssignments.courseId, courseId))
    .orderBy(asc(schema.users.displayName))
    .all();
  const rules = db
    .select({
      departmentId: schema.courseDepartmentRules.departmentId,
      departmentName: schema.departments.name,
      priority: schema.courseDepartmentRules.priority,
      required: schema.courseDepartmentRules.required,
      createdAt: schema.courseDepartmentRules.createdAt,
    })
    .from(schema.courseDepartmentRules)
    .leftJoin(schema.departments, eq(schema.departments.id, schema.courseDepartmentRules.departmentId))
    .where(eq(schema.courseDepartmentRules.courseId, courseId))
    .all()
    .map((r) => ({ ...r, departmentName: r.departmentName ?? r.departmentId }));
  return { courseId, learners, rules };
}

export function removeLearner(db: Db, courseId: string, userId: string): boolean {
  courseOrThrow(db, courseId);
  const res = db.delete(schema.courseAssignments).where(and(eq(schema.courseAssignments.courseId, courseId), eq(schema.courseAssignments.userId, userId))).run();
  return res.changes > 0;
}

/**
 * Stops a department having the course: the standing rule, and the rows that "assign to this
 * department now" made for the people in it. Rows added for one person by name stay.
 */
export function removeDepartment(db: Db, courseId: string, departmentId: string): { rule: boolean; learners: number } {
  courseOrThrow(db, courseId);
  return db.transaction(() => {
    const rule = db.delete(schema.courseDepartmentRules).where(and(eq(schema.courseDepartmentRules.courseId, courseId), eq(schema.courseDepartmentRules.departmentId, departmentId))).run().changes > 0;
    const ids = learnersIn(db, departmentId);
    const learners = ids.length
      ? db
          .delete(schema.courseAssignments)
          .where(and(eq(schema.courseAssignments.courseId, courseId), eq(schema.courseAssignments.source, "department"), inArray(schema.courseAssignments.userId, ids)))
          .run().changes
      : 0;
    return { rule, learners };
  });
}

// ---------------------------------------------------------------------------
// Search ("Add a course") and one learner's courses
// ---------------------------------------------------------------------------

export function learnerCourses(db: Db, userId: string): LearnerCoursesView {
  const user = db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) throw notFound("We couldn't find that person.");
  const departmentId = db.select({ d: schema.learnerProfiles.departmentId }).from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).get()?.d ?? "engineering";
  const departmentName = db.select({ name: schema.departments.name }).from(schema.departments).where(eq(schema.departments.id, departmentId)).get()?.name ?? departmentId;
  const assigned = db
    .select({ courseId: schema.courseAssignments.courseId, priority: schema.courseAssignments.priority, source: schema.courseAssignments.source })
    .from(schema.courseAssignments)
    .where(eq(schema.courseAssignments.userId, userId))
    .all();
  const rules = db
    .select({ courseId: schema.courseDepartmentRules.courseId, priority: schema.courseDepartmentRules.priority, required: schema.courseDepartmentRules.required })
    .from(schema.courseDepartmentRules)
    .where(eq(schema.courseDepartmentRules.departmentId, departmentId))
    .all();
  return { userId, departmentId, departmentName, assigned, rules };
}

/**
 * Courses an admin can add: hand-written and Oyelabs ones (generated courses belong to paths).
 * Every typed word must appear in the title or description. Oyelabs courses first, then the
 * library order. With `departmentId`, only courses that department may see.
 */
export function searchCourses(db: Db, query: { q: string; departmentId?: string; userId?: string; limit: number }): CourseSearchHit[] {
  const words = query.q.toLowerCase().split(/\s+/).filter(Boolean);
  const rows = db
    .select({
      id: schema.courses.id,
      title: schema.courses.title,
      summary: schema.courses.summary,
      oyelabs: schema.courses.oyelabs,
      level: schema.courses.level,
      published: schema.courses.published,
      origin: schema.courses.origin,
      departmentId: schema.courses.departmentId,
      position: schema.courses.position,
    })
    .from(schema.courses)
    .orderBy(asc(schema.courses.position), asc(schema.courses.title))
    .all()
    .filter((c) => c.origin !== "generated")
    .filter((c) => words.every((w) => `${c.title} ${c.summary}`.toLowerCase().includes(w)));

  let visible = rows;
  if (query.departmentId) {
    const depts = new Map<string, Set<string>>();
    for (const r of db.select().from(schema.courseDepartments).all()) depts.set(r.courseId, (depts.get(r.courseId) ?? new Set()).add(r.departmentId));
    visible = rows.filter((c) => {
      const set = depts.get(c.id);
      if (set && set.size > 0) return set.has(query.departmentId!);
      return c.departmentId == null || c.departmentId === query.departmentId;
    });
  }
  const top = [...visible]
    .sort((a, b) => Number(b.oyelabs) - Number(a.oyelabs) || Number(b.published) - Number(a.published) || a.position - b.position || a.title.localeCompare(b.title))
    .slice(0, query.limit);
  if (top.length === 0) return [];

  const ids = top.map((c) => c.id);
  const lessons = new Map<string, { count: number; minutes: number }>();
  for (const t of db.select({ courseId: schema.courseTopics.courseId, est: schema.courseTopics.estMinutes }).from(schema.courseTopics).where(inArray(schema.courseTopics.courseId, ids)).all()) {
    const cur = lessons.get(t.courseId) ?? { count: 0, minutes: 0 };
    lessons.set(t.courseId, { count: cur.count + 1, minutes: cur.minutes + t.est });
  }
  const assigned = new Map<string, AssignmentPriority | null>();
  if (query.userId) {
    const mine = learnerCourses(db, query.userId);
    for (const r of mine.rules) assigned.set(r.courseId, r.priority);
    for (const a of mine.assigned) assigned.set(a.courseId, higherPriority(a.priority, assigned.get(a.courseId)));
  }
  return top.map((c) => ({
    courseId: c.id,
    title: c.title,
    summary: c.summary,
    oyelabs: c.oyelabs,
    level: c.level,
    lessons: lessons.get(c.id)?.count ?? 0,
    estMinutes: lessons.get(c.id)?.minutes ?? 0,
    published: c.published,
    ...(query.userId ? { assigned: assigned.has(c.id) ? { priority: assigned.get(c.id) ?? null } : null } : {}),
  }));
}
