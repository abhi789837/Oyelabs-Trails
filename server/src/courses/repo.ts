import { and, asc, eq, inArray } from "drizzle-orm";

import type { Course, CourseCard, CourseSection, CourseTopic } from "../../../shared/courses";
import type { AccentTokenValue } from "../../../shared/content";
import { schema, type Db } from "../db";

/**
 * Reading and writing admin-authored courses.
 *
 * Three tables assembled into one nested shape, because that is the only shape either the editor or
 * the learner ever wants: a course is small — tens of lessons, not hundreds — so it is read whole
 * rather than paged, and the alternative is three round trips and stitching on the client.
 */

function toTopic(row: typeof schema.courseTopics.$inferSelect): CourseTopic {
  return {
    id: row.id,
    sectionId: row.sectionId,
    courseId: row.courseId,
    title: row.title,
    body: row.body,
    videoId: row.videoId,
    videoTitle: row.videoTitle,
    links: row.links ?? [],
    estMinutes: row.estMinutes,
    position: row.position,
  };
}

/** One course, with its sections and lessons in author order. */
export function getCourse(db: Db, courseId: string): Course | null {
  const row = db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).get();
  if (!row) return null;

  const sections = db
    .select()
    .from(schema.courseSections)
    .where(eq(schema.courseSections.courseId, courseId))
    .orderBy(asc(schema.courseSections.position))
    .all();

  const topics = db
    .select()
    .from(schema.courseTopics)
    .where(eq(schema.courseTopics.courseId, courseId))
    .orderBy(asc(schema.courseTopics.position))
    .all();

  const bySection = new Map<string, CourseTopic[]>();
  for (const topic of topics) {
    const list = bySection.get(topic.sectionId) ?? [];
    list.push(toTopic(topic));
    bySection.set(topic.sectionId, list);
  }

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    accent: row.accent as AccentTokenValue,
    audience: row.audience,
    published: row.published,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    sections: sections.map<CourseSection>((section) => ({
      id: section.id,
      courseId: section.courseId,
      title: section.title,
      summary: section.summary,
      position: section.position,
      topics: bySection.get(section.id) ?? [],
    })),
  };
}

/** Every course, for the authoring list. Drafts included — this is the author's own view. */
export function listCourses(db: Db): Course[] {
  return db
    .select({ id: schema.courses.id })
    .from(schema.courses)
    .orderBy(asc(schema.courses.position))
    .all()
    .map((row) => getCourse(db, row.id))
    .filter((course): course is Course => course !== null);
}

/**
 * The courses one learner should see, with their own progress counted in.
 *
 * An `everyone` course is visible to every active learner without a row anywhere. That is
 * deliberate: writing one assignment row per learner would have to be backfilled on every
 * onboarding, and the first person hired after a course was published would quietly not have it.
 */
export function coursesFor(db: Db, userId: string): CourseCard[] {
  const published = db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.published, true))
    .orderBy(asc(schema.courses.position))
    .all();
  if (published.length === 0) return [];

  const assignedIds = new Set(
    db
      .select({ courseId: schema.courseAssignments.courseId })
      .from(schema.courseAssignments)
      .where(eq(schema.courseAssignments.userId, userId))
      .all()
      .map((row) => row.courseId),
  );

  const visible = published.filter((course) => course.audience === "everyone" || assignedIds.has(course.id));
  if (visible.length === 0) return [];

  const courseIds = visible.map((c) => c.id);
  const topics = db
    .select({ courseId: schema.courseTopics.courseId, estMinutes: schema.courseTopics.estMinutes })
    .from(schema.courseTopics)
    .where(inArray(schema.courseTopics.courseId, courseIds))
    .all();

  const done = db
    .select({ courseId: schema.courseProgress.courseId })
    .from(schema.courseProgress)
    .where(and(eq(schema.courseProgress.userId, userId), inArray(schema.courseProgress.courseId, courseIds)))
    .all();

  const counts = new Map<string, { topics: number; minutes: number }>();
  for (const topic of topics) {
    const entry = counts.get(topic.courseId) ?? { topics: 0, minutes: 0 };
    entry.topics += 1;
    entry.minutes += topic.estMinutes;
    counts.set(topic.courseId, entry);
  }

  const completed = new Map<string, number>();
  for (const row of done) completed.set(row.courseId, (completed.get(row.courseId) ?? 0) + 1);

  return visible.map((course) => ({
    id: course.id,
    title: course.title,
    summary: course.summary,
    accent: course.accent as AccentTokenValue,
    topicCount: counts.get(course.id)?.topics ?? 0,
    completedCount: completed.get(course.id) ?? 0,
    estMinutes: counts.get(course.id)?.minutes ?? 0,
  }));
}

/** Whether this learner may open this course. The same rule `coursesFor` filters by. */
export function mayOpenCourse(db: Db, userId: string, courseId: string): boolean {
  const course = db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).get();
  if (!course || !course.published) return false;
  if (course.audience === "everyone") return true;
  return (
    db
      .select({ courseId: schema.courseAssignments.courseId })
      .from(schema.courseAssignments)
      .where(and(eq(schema.courseAssignments.courseId, courseId), eq(schema.courseAssignments.userId, userId)))
      .get() !== undefined
  );
}

/** Which of a course's lessons this learner has ticked off. */
export function completedTopicIds(db: Db, userId: string, courseId: string): string[] {
  return db
    .select({ topicId: schema.courseProgress.topicId })
    .from(schema.courseProgress)
    .where(and(eq(schema.courseProgress.userId, userId), eq(schema.courseProgress.courseId, courseId)))
    .all()
    .map((row) => row.topicId);
}

/**
 * Renumbers a course's sections, or a section's lessons, to match the order given.
 *
 * Ids not in the list keep their relative order **after** the ones that are, rather than being
 * dropped to position 0 — a reorder that arrives while someone else is adding a lesson should move
 * what it was asked to move and leave the rest alone.
 */
export function applyOrder(db: Db, table: "sections" | "topics", parentId: string, ids: string[]): void {
  const rows =
    table === "sections"
      ? db
          .select({ id: schema.courseSections.id })
          .from(schema.courseSections)
          .where(eq(schema.courseSections.courseId, parentId))
          .orderBy(asc(schema.courseSections.position))
          .all()
      : db
          .select({ id: schema.courseTopics.id })
          .from(schema.courseTopics)
          .where(eq(schema.courseTopics.sectionId, parentId))
          .orderBy(asc(schema.courseTopics.position))
          .all();

  const known = new Set(rows.map((r) => r.id));
  const ordered = [...ids.filter((id) => known.has(id))];
  for (const row of rows) if (!ordered.includes(row.id)) ordered.push(row.id);

  ordered.forEach((id, index) => {
    if (table === "sections") {
      db.update(schema.courseSections).set({ position: index }).where(eq(schema.courseSections.id, id)).run();
    } else {
      db.update(schema.courseTopics).set({ position: index }).where(eq(schema.courseTopics.id, id)).run();
    }
  });
}

/** The next position at the end of a list, so a new item lands last rather than first. */
export function nextPosition(db: Db, table: "courses" | "sections" | "topics", parentId?: string): number {
  if (table === "courses") {
    return db.select({ id: schema.courses.id }).from(schema.courses).all().length;
  }
  if (table === "sections") {
    return db
      .select({ id: schema.courseSections.id })
      .from(schema.courseSections)
      .where(eq(schema.courseSections.courseId, parentId!))
      .all().length;
  }
  return db
    .select({ id: schema.courseTopics.id })
    .from(schema.courseTopics)
    .where(eq(schema.courseTopics.sectionId, parentId!))
    .all().length;
}
