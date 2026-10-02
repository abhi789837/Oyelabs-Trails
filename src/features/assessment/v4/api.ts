import type { ItemResponseV4, RunResponse, Sheet, SheetItem } from "@shared/assessmentV4";

import { api } from "@/api/client";

/** The v4 sheet routes (server/src/routes/assessmentV4.ts). Start and Finish stay in `assessmentApi`. */
export const sheetApi = {
  sheet: (id: string, signal?: AbortSignal) => api.get<Sheet>(`/api/assessment/${id}/sheet`, signal),

  saveDraft: (id: string, itemId: string, body: { response?: ItemResponseV4 | null; flagged?: boolean; elapsedMs?: number }) =>
    api.put<{ ok: true }>(`/api/assessment/${id}/items/${itemId}/draft`, body),

  run: (id: string, itemId: string, code: string) => api.post<RunResponse>(`/api/assessment/${id}/items/${itemId}/run`, { code }),

  submitItem: (id: string, itemId: string, response: ItemResponseV4) =>
    api.post<{ item: SheetItem }>(`/api/assessment/${id}/items/${itemId}/submit`, { response }),
};
