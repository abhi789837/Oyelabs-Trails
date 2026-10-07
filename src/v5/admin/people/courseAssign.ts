import type {
  AssignCourseRequest,
  AssignCourseResponse,
  AssignmentPriority,
  CourseSearchHit,
  LearnerCoursesView,
  PickedCourse,
} from "@shared/oyelabsCourses";

import { api } from "@/api/client";

/**
 * v4.5 Phase 4: "Add a course" (People sheet, old learner page, onboarding summary). The API calls
 * and the pure parts, shared by every place the picker shows.
 */
export const courseAssignApi = {
  search: (query: { q: string; userId?: string; departmentId?: string }, signal?: AbortSignal) => {
    const params = new URLSearchParams({ q: query.q, limit: "30" });
    if (query.userId) params.set("userId", query.userId);
    if (query.departmentId) params.set("departmentId", query.departmentId);
    return api.get<{ courses: CourseSearchHit[] }>(`/api/admin/oyelabs/search?${params.toString()}`, signal);
  },
  learner: (userId: string, signal?: AbortSignal) => api.get<LearnerCoursesView>(`/api/admin/oyelabs/learners/${encodeURIComponent(userId)}`, signal),
  assign: (body: AssignCourseRequest) => api.post<AssignCourseResponse>("/api/admin/oyelabs/assignments", body),
};

/** Who an "Add a course" adds it for. */
export type AddTarget = "learner" | "department" | "department_everyone";

export function assignRequest(courseId: string, priority: AssignmentPriority, target: AddTarget, ids: { userId: string; departmentId: string }, required: boolean): AssignCourseRequest {
  if (target === "learner") return { courseId, priority, target: { kind: "learner", userId: ids.userId } };
  if (target === "department") return { courseId, priority, target: { kind: "department", departmentId: ids.departmentId } };
  return { courseId, priority, target: { kind: "department_everyone", departmentId: ids.departmentId, required } };
}

/** "6 lessons, about 2 h" — the course's size in one line. */
export function courseSizeLine(hit: Pick<CourseSearchHit, "lessons" | "estMinutes">): string {
  const lessons = `${hit.lessons} ${hit.lessons === 1 ? "lesson" : "lessons"}`;
  if (hit.estMinutes <= 0) return lessons;
  const time = hit.estMinutes < 90 ? `${hit.estMinutes} min` : `${Math.round(hit.estMinutes / 60)} h`;
  return `${lessons}, about ${time}`;
}

/** Adds or replaces one picked course (by id) in the onboarding summary's list. */
export function withPicked(list: readonly PickedCourse[], pick: PickedCourse): PickedCourse[] {
  return list.some((p) => p.courseId === pick.courseId) ? list.map((p) => (p.courseId === pick.courseId ? pick : p)) : [...list, pick];
}

/**
 * Gives a newly onboarded learner the courses picked on the summary card. Run after the account
 * and setup are saved. Returns what failed, so the caller can say so without undoing the rest.
 */
export async function assignPicked(userId: string, picked: readonly PickedCourse[]): Promise<{ added: number; failed: string[] }> {
  let added = 0;
  const failed: string[] = [];
  for (const pick of picked) {
    try {
      await courseAssignApi.assign({ courseId: pick.courseId, priority: pick.priority, target: { kind: "learner", userId } });
      added += 1;
    } catch {
      failed.push(pick.title);
    }
  }
  return { added, failed };
}
