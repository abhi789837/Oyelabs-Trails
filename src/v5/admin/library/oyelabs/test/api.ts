import type { ModuleTestItemInput, ModuleTestItemView, ModuleTestView } from "@shared/moduleTests";

import { api } from "@/api/client";

/** v4.5 Phase 3 (builder C): the admin module-test calls (server/src/oyelabs/moduleTests/routes.ts). */
const base = (sectionId: string) => `/api/admin/oyelabs/modules/${encodeURIComponent(sectionId)}/test`;

export const moduleTestApi = {
  get: (sectionId: string, signal?: AbortSignal) => api.get<ModuleTestView>(base(sectionId), signal),
  regenerate: (sectionId: string) => api.post<ModuleTestView>(`${base(sectionId)}/regenerate`),
  add: (sectionId: string, input: ModuleTestItemInput) => api.post<{ item: ModuleTestItemView; test: ModuleTestView }>(`${base(sectionId)}/items`, input),
  edit: (sectionId: string, itemId: string, input: ModuleTestItemInput) =>
    api.put<{ item: ModuleTestItemView; test: ModuleTestView }>(`${base(sectionId)}/items/${encodeURIComponent(itemId)}`, input),
  remove: (sectionId: string, itemId: string) => api.del<{ test: ModuleTestView }>(`${base(sectionId)}/items/${encodeURIComponent(itemId)}`),
};
