import type { SkillEdgeInput, SkillEdgeRow, SkillGraphResponse } from "@shared/skillGraph";

import { api } from "@/api/client";

/** v4.3 skill graph. Any staff member reads; only the superadmin changes it (the server enforces). */
export const skillGraphApi = {
  get: (departmentId: string | null, signal?: AbortSignal) =>
    api.get<SkillGraphResponse>(`/api/admin/skill-graph${departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : ""}`, signal),
  add: (edge: SkillEdgeInput) => api.post<{ edge: SkillEdgeRow }>("/api/admin/skill-graph/edges", edge),
  setType: (edge: SkillEdgeInput) => api.put<{ edge: SkillEdgeRow }>("/api/admin/skill-graph/edges", edge),
  remove: (from: string, to: string) =>
    api.del<{ edge: SkillEdgeRow }>(`/api/admin/skill-graph/edges?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
};
