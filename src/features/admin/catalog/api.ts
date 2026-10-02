import type {
  Catalog,
  Department,
  DepartmentInput,
  JobTrack,
  Skill,
  SkillInput,
  StackInput,
  StackOption,
  TrackInput,
} from "@shared/catalog";

import { api } from "@/api/client";

/** The four reorderable catalog tables, as the server names them. */
export type CatalogTable = "departments" | "tracks" | "stacks" | "skills";

/**
 * Departments, job tracks, stacks/tools and skills.
 *
 * Reads are for any staff member; every mutation except a skill request is the superadmin's, and
 * the server says so with a 403 rather than this module guessing.
 */
export const catalogApi = {
  get: (options: { includeArchived?: boolean; departmentId?: string } = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (options.includeArchived) params.set("includeArchived", "1");
    if (options.departmentId) params.set("departmentId", options.departmentId);
    const qs = params.toString();
    return api.get<Catalog>(`/api/admin/catalog${qs ? `?${qs}` : ""}`, signal);
  },

  createDepartment: (body: Partial<DepartmentInput> & { name: string }) =>
    api.post<{ department: Department }>("/api/admin/departments", body),
  updateDepartment: (id: string, body: Partial<DepartmentInput>) =>
    api.put<{ department: Department }>(`/api/admin/departments/${id}`, body),
  archiveDepartment: (id: string, archived: boolean) =>
    api.post<{ ok: true }>(`/api/admin/departments/${id}/archive`, { archived }),

  createTrack: (body: Partial<TrackInput> & { departmentId: string; name: string }) =>
    api.post<{ track: JobTrack }>("/api/admin/tracks", body),
  updateTrack: (id: string, body: Partial<Omit<TrackInput, "id" | "departmentId">>) =>
    api.put<{ track: JobTrack }>(`/api/admin/tracks/${id}`, body),
  archiveTrack: (id: string, archived: boolean) => api.post<{ ok: true }>(`/api/admin/tracks/${id}/archive`, { archived }),

  createStack: (body: Partial<StackInput> & { departmentId: string; name: string; kind: StackInput["kind"] }) =>
    api.post<{ stack: StackOption }>("/api/admin/stacks", body),
  updateStack: (id: string, body: Partial<Omit<StackInput, "id" | "departmentId">>) =>
    api.put<{ stack: StackOption }>(`/api/admin/stacks/${id}`, body),
  archiveStack: (id: string, archived: boolean) => api.post<{ ok: true }>(`/api/admin/stacks/${id}/archive`, { archived }),

  createSkill: (body: Partial<SkillInput> & { departmentId: string; name: string }) =>
    api.post<{ skill: Skill }>("/api/admin/skills", body),
  updateSkill: (id: string, body: Partial<Omit<SkillInput, "id" | "departmentId">>) =>
    api.put<{ skill: Skill }>(`/api/admin/skills/${id}`, body),
  /** `active` approves a pending request or restores an archived skill. */
  setSkillStatus: (id: string, status: "active" | "archived") =>
    api.post<{ skill: Skill }>(`/api/admin/skills/${id}/status`, { status }),
  /** Any staff member. A superadmin's own request lands active. */
  requestSkill: (departmentId: string, name: string) =>
    api.post<{ skill: Skill }>("/api/admin/skills/requests", { departmentId, name }),

  reorder: (table: CatalogTable, ids: string[]) => api.post<{ ok: true }>(`/api/admin/catalog/reorder/${table}`, { ids }),
};
