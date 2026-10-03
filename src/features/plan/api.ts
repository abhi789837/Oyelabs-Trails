import type { MoveItemRequest, PlanLane, WeekResponse, WeekView } from "@shared/weeklyPlan";

import { api } from "@/api/client";

/**
 * The weekly plan's API.
 *
 * `mine()` generates the week when there isn't one, server-side, so the client never has to ask for a
 * plan to be built — it asks for the plan and gets one. That keeps the loading state honest: the
 * skeleton is covering a request, not a request plus a decision about whether to make a second one.
 */
export const weekApi = {
  mine: (signal?: AbortSignal) => api.get<WeekResponse>("/api/me/week", signal),

  /** "Plan my next week now." Refused with a 400 while the blocking lanes are outstanding. */
  planNext: () => api.post<WeekResponse>("/api/me/week/next"),

  /** One past week, read-only, for the small trail under "Past weeks". */
  byId: (weekId: string, signal?: AbortSignal) =>
    api.get<{ week: WeekView }>(`/api/me/week/${encodeURIComponent(weekId)}`, signal),
};

/** The admin's overrides. Every one of them is written to the audit log server-side. */
export const adminWeekApi = {
  get: (userId: string, signal?: AbortSignal) =>
    api.get<WeekResponse>(`/api/admin/users/${userId}/week`, signal),

  regenerate: (userId: string, options: { rulesOnly?: boolean; advance?: boolean } = {}) =>
    api.post<WeekResponse>(`/api/admin/users/${userId}/week/regenerate`, {
      rulesOnly: options.rulesOnly ?? false,
      advance: options.advance ?? false,
    }),

  moveItem: (userId: string, itemId: string, patch: MoveItemRequest) =>
    api.patch<WeekResponse>(`/api/admin/users/${userId}/week/items/${itemId}`, patch),

  pin: (userId: string, itemId: string, pinned: boolean) =>
    api.patch<WeekResponse>(`/api/admin/users/${userId}/week/items/${itemId}`, { pinned }),

  setLane: (userId: string, itemId: string, lane: PlanLane) =>
    api.patch<WeekResponse>(`/api/admin/users/${userId}/week/items/${itemId}`, { lane }),
};
