import { eq } from "drizzle-orm";

import { schema, type Db } from "../db";

/**
 * v4.5: who may see a published course. The one rule the library, `mayOpenCourse`, the weekly-plan
 * candidates and the path builder all use once builders A and D wire it in (PLAN.md §3.4):
 *
 *   assigned to the learner (`course_assignments`)                     → yes
 *   a department rule for the learner's department (`course_department_rules`) → yes
 *   audience `everyone`, and
 *     the course has `course_departments` rows → the learner's department is one of them
 *     it has none → legacy `courses.department_id` is null or equals it
 *   anything else                                                      → no
 *
 * Unpublished courses are never visible here (staff preview uses the admin routes).
 */
export interface VisibilityCourse {
  id: string;
  published: boolean;
  audience: "everyone" | "assigned";
  departmentId: string | null;
}

export interface LearnerVisibilityFacts {
  departmentId: string;
  assignedCourseIds: ReadonlySet<string>;
  ruleCourseIds: ReadonlySet<string>;
  /** courseId → its `course_departments` ids (absent = no rows = all departments). */
  courseDepartments: ReadonlyMap<string, ReadonlySet<string>>;
}

/** Pure, so it is tested without a database. */
export function isCourseVisible(course: VisibilityCourse, facts: LearnerVisibilityFacts): boolean {
  if (!course.published) return false;
  if (facts.assignedCourseIds.has(course.id) || facts.ruleCourseIds.has(course.id)) return true;
  if (course.audience !== "everyone") return false;
  const depts = facts.courseDepartments.get(course.id);
  if (depts && depts.size > 0) return depts.has(facts.departmentId);
  return course.departmentId == null || course.departmentId === facts.departmentId;
}

/** Reads the facts for one learner. Department defaults to "engineering", as `coursesFor` does. */
export function learnerVisibilityFacts(db: Db, userId: string): LearnerVisibilityFacts {
  const departmentId =
    db.select({ d: schema.learnerProfiles.departmentId }).from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).get()?.d ?? "engineering";
  const assignedCourseIds = new Set(
    db.select({ c: schema.courseAssignments.courseId }).from(schema.courseAssignments).where(eq(schema.courseAssignments.userId, userId)).all().map((r) => r.c),
  );
  const ruleCourseIds = new Set(
    db
      .select({ c: schema.courseDepartmentRules.courseId })
      .from(schema.courseDepartmentRules)
      .where(eq(schema.courseDepartmentRules.departmentId, departmentId))
      .all()
      .map((r) => r.c),
  );
  const courseDepartments = new Map<string, Set<string>>();
  for (const row of db.select().from(schema.courseDepartments).all()) {
    const set = courseDepartments.get(row.courseId) ?? new Set<string>();
    set.add(row.departmentId);
    courseDepartments.set(row.courseId, set);
  }
  return { departmentId, assignedCourseIds, ruleCourseIds, courseDepartments };
}
