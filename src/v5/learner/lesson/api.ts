import type {
  LessonNote,
  LessonStatePut,
  LessonStatePutResponse,
  LessonStateView,
  LessonStepId,
  QuickCheckResponse,
  QuickCheckResult,
  RunChecksResponse,
  RunSnippetResponse,
  SolutionResponse,
  TutorAnswerResponse,
  TutorMessageView,
  TutorStatus,
} from "@shared/lesson";

import { api } from "@/api/client";

const base = (topicId: string) => `/api/v5/lessons/${encodeURIComponent(topicId)}`;

/** The v5 lesson API (server/src/v5/{lesson,notes,tutor,problems}). */
export const lessonApi = {
  state: (topicId: string, signal?: AbortSignal) => api.get<LessonStateView>(`${base(topicId)}/state`, signal),
  save: (topicId: string, body: LessonStatePut) => api.put<LessonStatePutResponse>(`${base(topicId)}/state`, body),
  quickCheck: (topicId: string, signal?: AbortSignal) => api.get<QuickCheckResponse>(`${base(topicId)}/quick-check`, signal),
  answerQuickCheck: (topicId: string, answers: Record<string, number[]>) => api.post<QuickCheckResult>(`${base(topicId)}/quick-check`, { answers }),
  runSnippet: (topicId: string, code: string) => api.post<RunSnippetResponse>(`${base(topicId)}/run`, { mode: "snippet", code }),
  runChecks: (topicId: string, code: string) => api.post<RunChecksResponse>(`${base(topicId)}/run`, { mode: "checks", code }),
  solution: (topicId: string, trade: boolean) => api.post<SolutionResponse>(`${base(topicId)}/solution`, { trade }),
  notes: (topicId: string, signal?: AbortSignal) => api.get<{ notes: LessonNote[] }>(`${base(topicId)}/notes`, signal),
  addNote: (topicId: string, body: { body: string; videoId?: string | null; atSec?: number | null }) => api.post<{ note: LessonNote }>(`${base(topicId)}/notes`, body),
  editNote: (noteId: string, body: string) => api.patch<{ note: LessonNote }>(`/api/v5/notes/${encodeURIComponent(noteId)}`, { body }),
  deleteNote: (noteId: string) => api.del<{ ok: true }>(`/api/v5/notes/${encodeURIComponent(noteId)}`),
  report: (topicId: string, step: LessonStepId | null, message: string) => api.post<{ id: string }>(`${base(topicId)}/problems`, { step, message }),
  tutor: (topicId: string, signal?: AbortSignal) => api.get<TutorStatus>(`${base(topicId)}/tutor`, signal),
  ask: (topicId: string, body: { question: string; step: LessonStepId; code?: string }) => api.post<TutorAnswerResponse>(`${base(topicId)}/tutor`, body),
  rate: (messageId: string, rating: -1 | 0 | 1) => api.post<{ message: TutorMessageView }>(`/api/v5/tutor/messages/${encodeURIComponent(messageId)}/rating`, { rating }),
};

/** A last save while the page is going away; `keepalive` lets it outlive the page. */
export function saveOnExit(topicId: string, body: LessonStatePut): void {
  try {
    void fetch(`${base(topicId)}/state`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // The page is closing.
  }
}
