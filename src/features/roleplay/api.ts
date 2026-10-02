import { api } from "@/api/client";
import type { RoleplayCatalog, RoleplaySessionView, RoleplayUsage } from "@shared/roleplay";

/**
 * v4.2 client role-play. The catalogue (personas, scenarios, rubric) comes from the server, which
 * strips each hidden concern: the browser never imports the persona data itself.
 */
export const roleplayApi = {
  catalog: (signal?: AbortSignal) => api.get<RoleplayCatalog>("/api/roleplay/catalog", signal),

  start: (body: { scenarioId: string; personaId?: string; maxTurns?: number; context: "practice" | "assessment"; assessmentId?: string; itemId?: string }) =>
    api.post<{ session: RoleplaySessionView }>("/api/roleplay/sessions", body),

  get: (id: string, signal?: AbortSignal) => api.get<{ session: RoleplaySessionView }>(`/api/roleplay/sessions/${encodeURIComponent(id)}`, signal),

  turn: (id: string, message: string) => api.post<{ session: RoleplaySessionView }>(`/api/roleplay/sessions/${encodeURIComponent(id)}/turns`, { message }),

  finish: (id: string, followUpEmail?: string) =>
    api.post<{ session: RoleplaySessionView }>(`/api/roleplay/sessions/${encodeURIComponent(id)}/finish`, followUpEmail ? { followUpEmail } : {}),

  usage: (signal?: AbortSignal) => api.get<RoleplayUsage>("/api/admin/roleplay/usage", signal),

  setCap: (capUsd: number) => api.put<RoleplayUsage>("/api/admin/roleplay/cap", { capUsd }),
};
