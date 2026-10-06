import type { Course } from "@shared/courses";
import type { CourseDetail } from "@shared/me";
import { formatOf, outcomeLine } from "@shared/meCore";

import { courseLessonHref } from "@/v5/learner/lesson/lessonLinks";

/**
 * "Preview as learner" (`/learn/library/:courseId?preview=1`, staff only): the course page drawn
 * from the admin copy of the course (`GET /api/admin/courses/:id`), so a draft or an assigned-only
 * course can be checked before anyone sees it. Learner-only parts (progress, recommendation, your
 * skill levels) are empty: a preview has no learner.
 */
export function previewCourseDetail(course: Course): CourseDetail {
  const lessons = course.sections.flatMap((s) => s.topics);
  const words = lessons.reduce((n, l) => n + (l.body.trim() ? l.body.trim().split(/\s+/).length : 0), 0);
  const level = course.level ?? null;
  const outcomes = [...new Set(course.sections.map((s) => outcomeLine(s.title, level)).filter(Boolean))].slice(0, 6);
  return {
    id: course.id,
    kind: "course",
    title: course.title,
    summary: course.summary,
    outcomes,
    department: null,
    skills: [],
    level,
    minutes: lessons.reduce((n, l) => n + l.estMinutes, 0),
    lessonCount: lessons.length,
    format: formatOf(lessons.filter((l) => l.videoId).length, lessons.length, words),
    recommended: false,
    recommendedWhy: null,
    doneCount: 0,
    nextLessonHref: lessons[0] ? courseLessonHref(course.id, lessons[0].id, true) : null,
    prerequisites: [],
    syllabus: course.sections.map((s) => ({
      id: s.id,
      title: s.title,
      lessons: s.topics.map((l) => ({ id: l.id, title: l.title, minutes: l.estMinutes, done: false, href: courseLessonHref(course.id, l.id, true), hasVideo: Boolean(l.videoId) })),
    })),
    sourcesVerifiedAt: null,
    sourceCount: 0,
  };
}
