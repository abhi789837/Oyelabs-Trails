import type {
  Course,
  ReorderRequest,
  UpsertCourseRequest,
  UpsertCourseTopicRequest,
  UpsertSectionRequest,
} from "@shared/courses";

import { api } from "@/api/client";

/**
 * Course authoring.
 *
 * Every mutation returns the whole course. A course is tens of rows, not thousands, and handing the
 * new state back means the editor never reconstructs it locally — which is where a list that
 * disagrees with the server about its own order comes from.
 */
export const coursesApi = {
  list: (signal?: AbortSignal) => api.get<{ courses: Course[] }>("/api/admin/courses", signal),
  get: (courseId: string, signal?: AbortSignal) =>
    api.get<{ course: Course }>(`/api/admin/courses/${courseId}`, signal),

  create: (body: UpsertCourseRequest) => api.post<{ course: Course }>("/api/admin/courses", body),
  update: (courseId: string, body: UpsertCourseRequest) =>
    api.put<{ course: Course }>(`/api/admin/courses/${courseId}`, body),
  remove: (courseId: string) => api.del<{ ok: true }>(`/api/admin/courses/${courseId}`),

  addSection: (courseId: string, body: UpsertSectionRequest) =>
    api.post<{ course: Course }>(`/api/admin/courses/${courseId}/sections`, body),
  updateSection: (sectionId: string, body: UpsertSectionRequest) =>
    api.put<{ course: Course }>(`/api/admin/courses/sections/${sectionId}`, body),
  removeSection: (sectionId: string) => api.del<{ course: Course }>(`/api/admin/courses/sections/${sectionId}`),

  addTopic: (sectionId: string, body: UpsertCourseTopicRequest) =>
    api.post<{ course: Course }>(`/api/admin/courses/sections/${sectionId}/topics`, body),
  updateTopic: (topicId: string, body: UpsertCourseTopicRequest) =>
    api.put<{ course: Course }>(`/api/admin/courses/topics/${topicId}`, body),
  removeTopic: (topicId: string) => api.del<{ course: Course }>(`/api/admin/courses/topics/${topicId}`),

  orderSections: (courseId: string, body: ReorderRequest) =>
    api.post<{ course: Course }>(`/api/admin/courses/${courseId}/sections/order`, body),
  orderTopics: (sectionId: string, body: ReorderRequest) =>
    api.post<{ course: Course }>(`/api/admin/courses/sections/${sectionId}/topics/order`, body),

  getAssignees: (courseId: string) => api.get<{ userIds: string[] }>(`/api/admin/courses/${courseId}/assignees`),
  setAssignees: (courseId: string, userIds: string[]) =>
    api.put<{ assigned: number }>(`/api/admin/courses/${courseId}/assignees`, { userIds }),

  progress: (courseId: string, signal?: AbortSignal) =>
    api.get<{
      topicCount: number;
      learners: { id: string; displayName: string; username: string; completedCount: number }[];
    }>(`/api/admin/courses/${courseId}/progress`, signal),
};
