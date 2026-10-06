import type { InboxResponse } from "@shared/adminInbox";
import type { Course } from "@shared/courses";
import type { ProblemListResponse, ProblemReportView, TutorQualityReport } from "@shared/lesson";
import type { OverviewResponse, ReportsResponse } from "@shared/reports";
import type { AdminAnnouncementView, AnnouncementInput, AnnouncementPatch } from "@shared/today";

import { api } from "@/api/client";

/**
 * Everything the v5 admin screens call. The v5-only endpoints live under `/api/admin/v5`
 * (server/src/v5/admin/routes.ts); actions reuse the endpoints the old screens use, so an action
 * behaves the same from either design.
 */

export interface PersonSignal {
  lastActivityAt: number | null;
  stuck: boolean;
  idleDays: number | null;
}

export interface PersonActivity {
  events: { at: number; kind: string; text: string }[];
  plan: { topicCount: number; completed: number; nextTopic: string | null; goals: string[]; pathStatus: string | null };
}

export type LibraryStatus = "live" | "creating" | "needs-look" | "draft" | "not-used";

export interface LibraryCourse {
  id: string;
  title: string;
  summary: string;
  status: LibraryStatus;
  generated: boolean;
  reason: string | null;
  lessons: number;
  level: string | null;
  departmentId: string | null;
  updatedAt: number;
  sources: { total: number; broken: number; lastVerifiedAt: number | null };
  versions: number;
}

export interface VersionMeta {
  version: number;
  createdAt: number;
  createdBy: string | null;
  createdByName: string | null;
  note: string | null;
  lessons: number;
}

export const v5AdminApi = {
  inbox: (signal?: AbortSignal) => api.get<InboxResponse>("/api/admin/v5/inbox", signal),
  dismiss: (key: string) => api.post<{ ok: true }>("/api/admin/v5/inbox/dismiss", { key }),
  undismiss: (key: string) => api.post<{ ok: true }>("/api/admin/v5/inbox/undismiss", { key }),

  people: (signal?: AbortSignal) => api.get<{ people: Record<string, PersonSignal> }>("/api/admin/v5/people", signal),
  activity: (userId: string, signal?: AbortSignal) => api.get<PersonActivity>(`/api/admin/v5/people/${encodeURIComponent(userId)}/activity`, signal),
  nudge: (userIds: string[]) => api.post<{ sent: number }>("/api/admin/v5/people/nudge", { userIds }),

  overview: (signal?: AbortSignal) => api.get<OverviewResponse>("/api/admin/v5/overview", signal),
  reports: (query: string, signal?: AbortSignal) => api.get<ReportsResponse>(`/api/admin/v5/reports${query ? `?${query}` : ""}`, signal),
  setWeeklyEmail: (on: boolean) => api.put<{ on: boolean; queued: boolean }>("/api/admin/v5/reports/weekly-email", { on }),

  library: (signal?: AbortSignal) => api.get<{ courses: LibraryCourse[]; creating: number }>("/api/admin/v5/library", signal),
  versions: (courseId: string, signal?: AbortSignal) => api.get<{ versions: VersionMeta[] }>(`/api/admin/v5/courses/${courseId}/versions`, signal),
  version: (courseId: string, version: number, signal?: AbortSignal) => api.get<{ version: number; course: Course }>(`/api/admin/v5/courses/${courseId}/versions/${version}`, signal),
  snapshot: (courseId: string, note?: string) => api.post<{ version: number; created: boolean }>(`/api/admin/v5/courses/${courseId}/versions`, note ? { note } : {}),
  restore: (courseId: string, version: number) => api.post<{ version: number; removedLessons: number }>(`/api/admin/v5/courses/${courseId}/versions/${version}/restore`, {}),

  // Existing endpoints the inbox actions reuse.
  approveTest: (assessmentId: string) => api.post(`/api/admin/assessments/${assessmentId}/approve`),
  sendTest: (userId: string) => api.post(`/api/admin/users/${userId}/assessments`, {}),
  fullMarks: (reviewId: string) => api.post(`/api/admin/review-requests/${reviewId}/decision`, { decision: "override", note: "" }),
  fixCourse: (courseId: string) => api.post(`/api/admin/generated-courses/${courseId}/fix`),
  publishCourse: (courseId: string) => api.post(`/api/admin/generated-courses/${courseId}/decision`, { decision: "approve" }),

  // Built by the Lesson group (P3).
  problems: (status: "open" | "resolved" | "all", signal?: AbortSignal) => api.get<ProblemListResponse>(`/api/admin/v5/problems?status=${status}`, signal),
  resolveProblem: (id: string) => api.post<{ problem: ProblemReportView }>(`/api/admin/v5/problems/${id}/resolve`),
  tutorQuality: (signal?: AbortSignal) => api.get<TutorQualityReport>("/api/admin/v5/tutor-quality", signal),

  // Built by the Today group (P2).
  announcements: (signal?: AbortSignal) => api.get<{ announcements: AdminAnnouncementView[] }>("/api/admin/announcements", signal),
  createAnnouncement: (input: AnnouncementInput) => api.post<{ announcement: AdminAnnouncementView }>("/api/admin/announcements", input),
  updateAnnouncement: (id: string, patch: AnnouncementPatch) => api.put<{ announcement: AdminAnnouncementView }>(`/api/admin/announcements/${id}`, patch),
  deleteAnnouncement: (id: string) => api.del<{ ok: true }>(`/api/admin/announcements/${id}`),
};
