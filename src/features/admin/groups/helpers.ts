import type { BundleInput, SkillBundle } from "@shared/bundles";
import { skillUsableBy, type Catalog, type Skill } from "@shared/catalog";

/**
 * Skill groups (v4.4): the pure parts of the admin page, so the draft rules are tested without a
 * React tree. In code a skill group is a "bundle"; the admin never reads that word.
 */

export interface GroupDraft {
  /** Null for a new group. */
  id: string | null;
  name: string;
  departmentId: string | null;
  fromTrackIds: string[];
  phrases: string[];
  skillIds: string[];
  targetLevel: number;
  active: boolean;
}

export function emptyDraft(departmentId: string | null): GroupDraft {
  return { id: null, name: "", departmentId, fromTrackIds: [], phrases: [], skillIds: [], targetLevel: 3, active: true };
}

export function draftFrom(bundle: SkillBundle): GroupDraft {
  return {
    id: bundle.id,
    name: bundle.name,
    departmentId: bundle.departmentId,
    fromTrackIds: [...bundle.fromTrackIds],
    phrases: [...bundle.phrases],
    skillIds: [...bundle.skillIds],
    targetLevel: bundle.targetLevel,
    active: bundle.active,
  };
}

/** The request body (the server checks the skills again). */
export function toInput(draft: GroupDraft): BundleInput {
  return {
    name: draft.name.trim(),
    departmentId: draft.departmentId,
    fromTrackIds: draft.fromTrackIds,
    phrases: draft.phrases.map((p) => p.trim().toLowerCase()).filter(Boolean),
    skillIds: draft.skillIds,
    targetLevel: draft.targetLevel,
    active: draft.active,
  };
}

/** What stops a save, in plain words; null when the draft can be saved. */
export function draftProblem(draft: GroupDraft): string | null {
  if (draft.name.trim().length < 2) return "Give the group a name.";
  if (draft.phrases.filter((p) => p.trim().length >= 2).length === 0) return "Add at least one phrase that means this group.";
  if (draft.skillIds.length === 0) return "Pick at least one skill.";
  if (draft.skillIds.length > 12) return "A group can have at most 12 skills.";
  return null;
}

/**
 * Skills the group can use: its department's and the soft skills (an area every department can
 * use); for a group that applies to any department, every live skill.
 */
export function groupSkills(catalog: Catalog | null, departmentId: string | null): Skill[] {
  const live = (catalog?.skills ?? []).filter((s) => s.status === "active");
  if (!departmentId) return live;
  return [...live.filter((s) => s.departmentId === departmentId), ...live.filter((s) => s.departmentId !== departmentId && skillUsableBy(s, departmentId, catalog?.departments))];
}

/** Changing the department drops the roles and skills that no longer fit. */
export function withDepartment(draft: GroupDraft, catalog: Catalog | null, departmentId: string | null): GroupDraft {
  const usable = new Set(groupSkills(catalog, departmentId).map((s) => s.id));
  const tracks = new Set((catalog?.tracks ?? []).filter((t) => !departmentId || t.departmentId === departmentId).map((t) => t.id));
  return { ...draft, departmentId, fromTrackIds: draft.fromTrackIds.filter((id) => tracks.has(id)), skillIds: draft.skillIds.filter((id) => usable.has(id)) };
}

/** "Engineering · when their current role is Frontend": the line under a group's name. */
export function scopeLine(bundle: Pick<SkillBundle, "departmentId" | "fromTrackIds">, catalog: Catalog | null): string {
  const department = bundle.departmentId ? (catalog?.departments.find((d) => d.id === bundle.departmentId)?.name ?? bundle.departmentId) : "Any department";
  if (bundle.fromTrackIds.length === 0) return department;
  const names = bundle.fromTrackIds.map((id) => catalog?.tracks.find((t) => t.id === id)?.name ?? id);
  return `${department}, when their current role is ${names.join(" or ")}`;
}
