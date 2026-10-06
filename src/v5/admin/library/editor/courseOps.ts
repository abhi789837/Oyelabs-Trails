import type { Course, UpsertCourseRequest } from "@shared/courses";

/** The course without one lesson (shown at once while the server removes it). */
export function withoutTopic(course: Course, topicId: string): Course {
  return { ...course, sections: course.sections.map((sec) => ({ ...sec, topics: sec.topics.filter((t) => t.id !== topicId) })) };
}

/** The full update body for a course, with some fields changed (the update route replaces them all). */
export function courseUpdate(course: Course, patch: Partial<Pick<Course, "audience" | "published">>): UpsertCourseRequest {
  return {
    title: course.title,
    summary: course.summary,
    accent: course.accent,
    audience: patch.audience ?? course.audience,
    published: patch.published ?? course.published,
    level: course.level,
    departmentId: course.departmentId,
  };
}
