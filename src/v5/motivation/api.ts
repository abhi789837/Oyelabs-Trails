import { api } from "@/api/client";
import type { LeaderboardResponse, MotivationAdminSettings, MotivationPrefs, MotivationSummary } from "@shared/motivation";
import type { NotificationsResponse } from "@shared/notifications";

export interface MotivationPrefsPatch {
  weeklyGoalHours?: number | null;
  leaderboardOptIn?: boolean;
  welcomeDone?: boolean;
  timeZone?: string;
}

export const motivationApi = {
  summary: (since: number | null, signal?: AbortSignal) => api.get<MotivationSummary>(`/api/v5/motivation${since !== null ? `?since=${since}` : ""}`, signal),
  savePrefs: (patch: MotivationPrefsPatch) => api.put<{ prefs: MotivationPrefs }>("/api/v5/motivation/prefs", patch),
  leaderboard: (signal?: AbortSignal) => api.get<LeaderboardResponse>("/api/v5/leaderboard", signal),
  notifications: (signal?: AbortSignal) => api.get<NotificationsResponse>("/api/me/notifications?limit=20", signal),
  markRead: () => api.post<{ ok: true }>("/api/me/notifications/read"),
  adminSettings: (signal?: AbortSignal) => api.get<MotivationAdminSettings>("/api/admin/motivation", signal),
  setLeaderboards: (on: boolean) => api.put<{ leaderboards: boolean }>("/api/admin/motivation/leaderboards", { on }),
};
