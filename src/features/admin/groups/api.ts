import type { BundleInput, SkillBundle } from "@shared/bundles";

import { api } from "@/api/client";

/** v4.4 skill groups (`/api/admin/bundles`). */
export const groupsApi = {
  list: (signal?: AbortSignal) => api.get<{ bundles: SkillBundle[] }>("/api/admin/bundles", signal),
  create: (body: BundleInput) => api.post<{ bundle: SkillBundle; bundles: SkillBundle[] }>("/api/admin/bundles", body),
  update: (id: string, body: BundleInput) => api.put<{ bundle: SkillBundle; bundles: SkillBundle[] }>(`/api/admin/bundles/${encodeURIComponent(id)}`, body),
  remove: (id: string) => api.del<{ bundles: SkillBundle[] }>(`/api/admin/bundles/${encodeURIComponent(id)}`),
};
