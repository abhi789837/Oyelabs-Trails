import type {
  OyelabsCourseView,
  OyelabsDraftData,
  OyelabsDraftView,
  SaveOyelabsCourseRequest,
  SaveOyelabsCourseResponse,
  SuggestSkillsRequest,
  SuggestSkillsResponse,
} from "@shared/oyelabsCourses";

import { api } from "@/api/client";

/**
 * v4.5 Phase 1: the Oyelabs editor's calls (server/src/oyelabs/editor/routes.ts). Kept here rather
 * than in `src/v5/admin/api.ts`, which another phase owns.
 */
export const oyelabsApi = {
  myNewDrafts: (signal?: AbortSignal) => api.get<{ drafts: { id: string; title: string; updatedAt: number }[] }>("/api/admin/oyelabs/drafts", signal),
  createDraft: (courseId: string | null) => api.post<OyelabsDraftView>("/api/admin/oyelabs/drafts", { courseId }),
  getDraft: (draftId: string, signal?: AbortSignal) => api.get<OyelabsDraftView>(`/api/admin/oyelabs/drafts/${encodeURIComponent(draftId)}`, signal),
  putDraft: (draftId: string, courseId: string | null, data: OyelabsDraftData) => api.put<OyelabsDraftView>(`/api/admin/oyelabs/drafts/${encodeURIComponent(draftId)}`, { courseId, data }),
  deleteDraft: (draftId: string) => api.del<{ ok: true }>(`/api/admin/oyelabs/drafts/${encodeURIComponent(draftId)}`),

  course: (courseId: string, signal?: AbortSignal) => api.get<OyelabsCourseView>(`/api/admin/oyelabs/courses/${encodeURIComponent(courseId)}`, signal),
  create: (body: SaveOyelabsCourseRequest) => api.post<SaveOyelabsCourseResponse>("/api/admin/oyelabs/courses", body),
  update: (courseId: string, body: SaveOyelabsCourseRequest) => api.put<SaveOyelabsCourseResponse>(`/api/admin/oyelabs/courses/${encodeURIComponent(courseId)}`, body),

  suggestSkills: (body: SuggestSkillsRequest) => api.post<SuggestSkillsResponse>("/api/admin/oyelabs/skills/suggest", body),

  /** The shared version-history routes; restoring an Oyelabs version answers with a draft id. */
  restore: (courseId: string, version: number) => api.post<{ version: number; removedLessons: number; draftId?: string }>(`/api/admin/v5/courses/${encodeURIComponent(courseId)}/versions/${version}/restore`, {}),
};
