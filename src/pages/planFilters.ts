import type { ChallengeTypeValue, ModuleMeta, TopicMeta, TopicProgressValue, TrackMeta } from "@shared/content";
import type { TopicLevelValue } from "@shared/enums";

/**
 * The plan's list view, as data.
 *
 * Kept free of React and of the stores on purpose: with ~300 topics behind a plan, the filter
 * combination that produces "nothing" is the one worth testing, and that test should not need a
 * DOM, a fetch or a signed-in learner. `PlanPage` renders what this returns and owns nothing else
 * about which rows survive.
 *
 * The trail view is untouched by any of this — it is the same camps-and-waypoints list it always
 * was. Filtering belongs to the list view, where hiding a row does not break a path.
 */

export type PlanTopicStatus = TopicProgressValue["status"];

/** One row of the list view: the topic plus the context a flat list has to carry itself. */
export interface PlanRow {
  topic: TopicMeta;
  module: ModuleMeta;
  track: TrackMeta;
  status: PlanTopicStatus;
  /** Position in the plan, 1-based. The order the plan says to work in, kept visible when filtered. */
  position: number;
}

export interface PlanFilters {
  /** Matched against the topic title and its camp name, case-insensitively. */
  query: string;
  status: PlanTopicStatus | "all";
  level: TopicLevelValue | "all";
  moduleId: string | "all";
  challengeType: ChallengeTypeValue | "all";
  /** True narrows to milestones. There is no "hide milestones" — nobody wants that. */
  milestonesOnly: boolean;
}

export const EMPTY_PLAN_FILTERS: PlanFilters = {
  query: "",
  status: "all",
  level: "all",
  moduleId: "all",
  challengeType: "all",
  milestonesOnly: false,
};

/** How many filters are doing something, for the "Clear (3)" affordance. */
export function activeFilterCount(filters: PlanFilters): number {
  let count = 0;
  if (filters.query.trim() !== "") count += 1;
  if (filters.status !== "all") count += 1;
  if (filters.level !== "all") count += 1;
  if (filters.moduleId !== "all") count += 1;
  if (filters.challengeType !== "all") count += 1;
  if (filters.milestonesOnly) count += 1;
  return count;
}

export function hasActiveFilters(filters: PlanFilters): boolean {
  return activeFilterCount(filters) > 0;
}

export function filterPlanRows(rows: readonly PlanRow[], filters: PlanFilters): PlanRow[] {
  const query = filters.query.trim().toLowerCase();

  return rows.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.level !== "all" && row.topic.level !== filters.level) return false;
    if (filters.moduleId !== "all" && row.module.id !== filters.moduleId) return false;
    if (filters.challengeType !== "all" && row.topic.challengeType !== filters.challengeType) return false;
    if (filters.milestonesOnly && !row.topic.isMilestone) return false;
    if (query !== "") {
      const haystack = `${row.topic.title} ${row.module.name} ${row.track.name}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/**
 * The camps present in the rows, in plan order, for the module filter's options.
 *
 * Built from the rows rather than from the whole curriculum so the dropdown can only ever offer a
 * camp the learner has actually been assigned — a plan page must not leak the shape of the
 * curriculum behind it (brief §12).
 */
export function planModuleOptions(rows: readonly PlanRow[]): { id: string; name: string; count: number }[] {
  const byId = new Map<string, { id: string; name: string; count: number }>();
  for (const row of rows) {
    const existing = byId.get(row.module.id);
    if (existing) existing.count += 1;
    else byId.set(row.module.id, { id: row.module.id, name: row.module.name, count: 1 });
  }
  return [...byId.values()];
}

/** The levels present in the rows, hardest last. A filter that can only return nothing is noise. */
export function planLevelOptions(rows: readonly PlanRow[]): TopicLevelValue[] {
  const order: TopicLevelValue[] = ["beginner", "intermediate", "advanced", "expert"];
  const present = new Set(rows.map((row) => row.topic.level));
  return order.filter((level) => present.has(level));
}
