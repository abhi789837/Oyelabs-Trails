import { LEVEL_BAND_LABELS, searchSkills, type Catalog, type Skill } from "@shared/catalog";

/**
 * Pure catalog helpers, kept apart from the hook so they can be tested without a React tree.
 */

export interface Option {
  value: string;
  label: string;
}

/** The value a "for every department" row carries in an enum filter, since a null cannot be one. */
export const ALL_DEPARTMENTS = "__all";

/** A department's name, or the id itself when the catalog has not loaded or the row is unknown. */
export function departmentName(catalog: Catalog | null, id: string | null | undefined): string {
  if (!id) return "All departments";
  return catalog?.departments.find((d) => d.id === id)?.name ?? id;
}

/** Live departments as filter options, in the catalog's own order. */
export function departmentOptions(catalog: Catalog | null): Option[] {
  return (catalog?.departments ?? []).filter((d) => !d.archived).map((d) => ({ value: d.id, label: d.name }));
}

/** "Beginner – Super advanced", or one label when the band is a single level. */
export function levelBandLabel(skill: Pick<Skill, "levelMin" | "levelMax">): string {
  const min = LEVEL_BAND_LABELS[skill.levelMin];
  const max = LEVEL_BAND_LABELS[skill.levelMax];
  return min === max ? min : `${min} – ${max}`;
}

/**
 * Moves the item at `index` by `delta` and returns the new order, or null when the move would
 * leave the list. Mirrors the course editor's up/down buttons.
 */
export function moveId(ids: readonly string[], index: number, delta: number): string[] | null {
  const target = index + delta;
  if (index < 0 || index >= ids.length || target < 0 || target >= ids.length) return null;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export interface SkillFilter {
  query: string;
  trackId: string | null;
  status: "active" | "archived";
}

/**
 * The skills a department's Skills tab shows. A search ranks by `searchSkills`; with no search the
 * catalog order is kept, which is also the order reordering acts on. Pending skills belong to the
 * Requests tab, not here.
 */
export function filterSkills(skills: readonly Skill[], filter: SkillFilter): Skill[] {
  const scoped = skills.filter(
    (s) => s.status === filter.status && (!filter.trackId || s.trackIds.includes(filter.trackId)),
  );
  return searchSkills(scoped, filter.query);
}

/** Skills grouped by `area`, groups in first-seen order so a ranked search keeps its best group first. */
export function groupByArea(skills: readonly Skill[]): { area: string; skills: Skill[] }[] {
  const groups = new Map<string, Skill[]>();
  for (const skill of skills) {
    const area = skill.area || "General";
    const list = groups.get(area);
    if (list) list.push(skill);
    else groups.set(area, [skill]);
  }
  return [...groups].map(([area, list]) => ({ area, skills: list }));
}

/** Splits a comma-separated field into trimmed, non-empty, de-duplicated entries. */
export function splitList(value: string): string[] {
  return [...new Set(value.split(",").map((part) => part.trim()).filter(Boolean))];
}
