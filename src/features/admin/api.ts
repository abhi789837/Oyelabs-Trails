import type { AssessmentSummary } from "@shared/assessment";
import type {
  BulkUserAction,
  BulkUserResult,
  DeleteUserResponse,
  LearnerDetail,
  ListUsersResponse,
  OnboardLearnerRequest,
  OnboardLearnerResponse,
  ResetPasswordResponse,
  UserSummary,
} from "@shared/admin";
import type { LearnerProfile } from "@shared/profile";
import type { UserStatus } from "@shared/enums";

import { api } from "@/api/client";
import type { IssuedAssessment } from "./setup/api";

export const adminApi = {
  listUsers: (signal?: AbortSignal) => api.get<ListUsersResponse>("/api/admin/users", signal),

  getUser: (id: string, signal?: AbortSignal) => api.get<LearnerDetail>(`/api/admin/users/${id}`, signal),

  onboard: (body: OnboardLearnerRequest) => api.post<OnboardLearnerResponse>("/api/admin/users", body),

  updateProfile: (id: string, profile: LearnerProfile) =>
    api.put<{ profile: LearnerProfile }>(`/api/admin/users/${id}/profile`, { profile }),

  resetPassword: (id: string, password?: string) =>
    api.post<ResetPasswordResponse>(`/api/admin/users/${id}/reset-password`, password ? { password } : {}),

  setStatus: (id: string, status: UserStatus) =>
    api.post<{ user: UserSummary }>(`/api/admin/users/${id}/status`, { status }),

  revokeSessions: (id: string) => api.post<{ removed: number }>(`/api/admin/users/${id}/revoke-sessions`),

  /**
   * Deletes a person and everything personal to them. Super admin only, and there is no undo.
   *
   * `confirmUsername` must match exactly — the server checks it as well as the dialog, because a
   * confirmation that only exists in the client is a confirmation that only exists for people using
   * the client.
   */
  deleteUser: (id: string, confirmUsername: string, reason?: string) =>
    api.del<DeleteUserResponse>(`/api/admin/users/${id}`, { confirmUsername, ...(reason ? { reason } : {}) }),

  /** v4 bulk actions: one result per id, so one refusal never stops the rest. */
  bulkUsers: (body: BulkUserAction) => api.post<{ results: BulkUserResult[] }>("/api/admin/users/bulk", body),

  /** Superadmin: queue a path rebuild for every active learner. Progress is kept. */
  rebuildAllPaths: () => api.post<{ queued: number }>("/api/admin/paths/rebuild-all"),

  getAssessmentSettings: (signal?: AbortSignal) =>
    api.get<{ minFinishMinutes: number | null }>("/api/admin/assessment-settings", signal),

  saveAssessmentSettings: (minFinishMinutes: number | null) =>
    api.put<{ minFinishMinutes: number | null }>("/api/admin/assessment-settings", { minFinishMinutes }),

  /** Their whole record as a JSON file. Offered before a deletion, and available on its own. */
  exportUserUrl: (id: string) => `/api/admin/users/${id}/export`,

  /** Releases a generated assessment to the learner before its auto-approval deadline. */
  approveAssessment: (assessmentId: string) =>
    api.post<{ assessment: AssessmentSummary }>(`/api/admin/assessments/${assessmentId}/approve`),

  /**
   * Issues one. `label` only matters when the learner will hold several at a time; `timeLimitMinutes`
   * overrides what the blueprint would have chosen.
   */
  issueAssessment: (userId: string, body: { label?: string; timeLimitMinutes?: number } = {}) =>
    api.post<IssuedAssessment>(`/api/admin/users/${userId}/assessments`, body),

  /** Cancels one that has not been started. The server refuses anything further along. */
  deleteAssessment: (assessmentId: string) => api.del<{ ok: true }>(`/api/admin/assessments/${assessmentId}`),

  /** Drops an item from the pool before release, or puts an admin-dropped one back. */
  setPoolItemDropped: (assessmentId: string, itemId: string, dropped: boolean) =>
    api.post<{ ok: true }>(`/api/admin/assessments/${assessmentId}/items/${itemId}/drop`, { restore: !dropped }),
};
