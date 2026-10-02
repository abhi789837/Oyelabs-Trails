import type { BankItem, BankItemRow, BankItemType, BankStatus } from "@shared/bank";

import { api } from "@/api/client";

export interface BankListParams {
  departmentId?: string;
  skillId?: string;
  type?: BankItemType;
  status?: BankStatus;
  difficulty?: number;
  q?: string;
  limit: number;
  offset: number;
}

export interface BankListResponse {
  items: BankItemRow[];
  total: number;
  /** Per status, for the whole department (not the filtered set). */
  counts: Partial<Record<BankStatus, number>>;
}

export type CoverageCounts = Record<BankItemType, number>;

/** `/api/admin/question-bank/*` (v4 Phase 5). Any staff member. */
export const bankApi = {
  list: (params: BankListParams, signal?: AbortSignal) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "" && value !== null) search.set(key, String(value));
    }
    return api.get<BankListResponse>(`/api/admin/question-bank?${search.toString()}`, signal);
  },
  coverage: (departmentId: string, signal?: AbortSignal) =>
    api.get<{ coverage: Record<string, CoverageCounts> }>(
      `/api/admin/question-bank/coverage?departmentId=${encodeURIComponent(departmentId)}`,
      signal,
    ),
  get: (id: string) => api.get<{ item: BankItemRow }>(`/api/admin/question-bank/${encodeURIComponent(id)}`),
  save: (item: BankItem) =>
    api.put<{ item: BankItemRow; problems: string[] }>(`/api/admin/question-bank/${encodeURIComponent(item.id)}`, item),
  setStatus: (id: string, status: "active" | "retired", reason?: string) =>
    api.post<{ item: BankItemRow }>(`/api/admin/question-bank/${encodeURIComponent(id)}/status`, { status, reason }),
  fill: (departmentId: string, skillId: string, type: BankItemType) =>
    api.post<{ queued: number }>("/api/admin/question-bank/fill", { departmentId, skillId, type }),
  recompute: () => api.post<{ updated: number; retired: string[] }>("/api/admin/question-bank/recompute"),
};
