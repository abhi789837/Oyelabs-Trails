import type {
  RecheckRun,
  RecheckScope,
  TestItemEdit,
  TestItemListResponse,
  TestItemOrigin,
  TestItemRow,
  TestItemsSummary,
  TestItemStatus,
} from "@shared/topicTests";

import { api } from "@/api/client";

export interface TestItemListParams {
  topicId?: string;
  moduleId?: string;
  trackId?: string;
  status?: TestItemStatus;
  origin?: TestItemOrigin;
  flagged?: "1";
  q?: string;
  limit: number;
  offset: number;
}

/** `/api/admin/topic-tests/*` (v4.3 Phase 5). Re-check and budget are superadmin only. */
export const testItemsApi = {
  list: (params: TestItemListParams, signal?: AbortSignal) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") search.set(key, String(value));
    }
    return api.get<TestItemListResponse>(`/api/admin/topic-tests/items?${search.toString()}`, signal);
  },
  summary: (signal?: AbortSignal) => api.get<TestItemsSummary>("/api/admin/topic-tests/summary", signal),
  retire: (id: string, reason?: string) => api.post<{ item: TestItemRow }>(`/api/admin/topic-tests/items/${encodeURIComponent(id)}/retire`, { reason }),
  restore: (id: string) => api.post<{ item: TestItemRow }>(`/api/admin/topic-tests/items/${encodeURIComponent(id)}/restore`),
  edit: (id: string, body: TestItemEdit) => api.put<{ item: TestItemRow }>(`/api/admin/topic-tests/items/${encodeURIComponent(id)}`, body),
  regenerate: (id: string) => api.post<{ queued: boolean }>(`/api/admin/topic-tests/items/${encodeURIComponent(id)}/regenerate`),
  recheck: (scope: RecheckScope) => api.post<{ run: RecheckRun }>("/api/admin/topic-tests/recheck", scope),
  cancel: () => api.post<{ run: RecheckRun | null }>("/api/admin/topic-tests/recheck/cancel"),
  resume: () => api.post<{ run: RecheckRun | null }>("/api/admin/topic-tests/recheck/resume"),
  setBudget: (budgetUsd: number) => api.put<{ budgetUsd: number }>("/api/admin/topic-tests/budget", { budgetUsd }),
};
