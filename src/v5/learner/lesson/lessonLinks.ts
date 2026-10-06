/**
 * Pure helpers for the lesson player's URLs: where a lesson resumes, and how a library course's
 * lessons link to each other (`/learn/lesson/:id?course=<courseId>`, plus `&preview=1` for staff
 * previewing a course as a learner would see it).
 */

export interface ResumePoint {
  videoId: string | null;
  seconds: number | null;
}

/**
 * Where Watch starts. `video` (from a note link) picks the video; `t` the moment. A `video` other
 * than the saved one starts that video from the top unless `t` says otherwise.
 */
export function resumePoint(url: { video: string | null; t: string | null }, saved: { videoId: string | null; positionSec: number | null }): ResumePoint {
  const video = url.video && /^[\w-]{6,20}$/.test(url.video) ? url.video : null;
  const t = url.t !== null && url.t.trim() !== "" ? Number(url.t) : Number.NaN;
  const urlSeconds = Number.isFinite(t) && t >= 0 ? t : null;
  if (video) return { videoId: video, seconds: urlSeconds ?? (video === saved.videoId ? saved.positionSec : null) };
  return { videoId: saved.videoId, seconds: urlSeconds ?? saved.positionSec };
}

export function courseLessonHref(courseId: string, topicId: string, preview = false): string {
  return `/learn/lesson/${encodeURIComponent(topicId)}?course=${encodeURIComponent(courseId)}${preview ? "&preview=1" : ""}`;
}

export function coursePageHref(courseId: string, preview = false): string {
  return `/learn/library/${encodeURIComponent(courseId)}${preview ? "?preview=1" : ""}`;
}

export interface CourseShape<L extends { id: string } = { id: string; title: string }> {
  sections: { id: string; title: string; topics: L[] }[];
}

export interface CourseLessonNav<L> {
  lesson: L;
  sectionTitle: string;
  /** 1-based position across the whole course. */
  number: number;
  total: number;
  prev: L | null;
  next: L | null;
}

/** Finds a lesson in a course (sections and lessons in order) with its neighbours; null if absent. */
export function courseLessonNav<L extends { id: string }>(course: CourseShape<L>, topicId: string): CourseLessonNav<L> | null {
  const flat = course.sections.flatMap((s) => s.topics.map((t) => ({ t, section: s.title })));
  const i = flat.findIndex((x) => x.t.id === topicId);
  if (i < 0) return null;
  return {
    lesson: flat[i].t,
    sectionTitle: flat[i].section,
    number: i + 1,
    total: flat.length,
    prev: i > 0 ? flat[i - 1].t : null,
    next: i < flat.length - 1 ? flat[i + 1].t : null,
  };
}
