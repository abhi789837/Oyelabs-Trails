import type {
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
};
