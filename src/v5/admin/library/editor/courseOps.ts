import type { Course } from "@shared/courses";

/** The course without one lesson (shown at once while the server removes it). */
export function withoutTopic(course: Course, topicId: string): Course {
  return { ...course, sections: course.sections.map((sec) => ({ ...sec, topics: sec.topics.filter((t) => t.id !== topicId) })) };
}
