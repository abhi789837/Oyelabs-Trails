import { describe, expect, it } from "vitest";

import type { ModuleMeta, TopicMeta, TrackMeta } from "@shared/content";

import {
  activeFilterCount,
  EMPTY_PLAN_FILTERS,
  filterPlanRows,
  hasActiveFilters,
  planLevelOptions,
  planModuleOptions,
  type PlanRow,
} from "./planFilters";

const track = { id: "frontend", name: "Frontend", tagline: "", accentToken: "trailmark", modules: [] } as unknown as TrackMeta;

function topic(partial: Partial<TopicMeta> & { id: string }): TopicMeta {
  return {
    moduleId: "js-core",
    trackId: "frontend",
    title: partial.id,
    level: "intermediate",
    estMinutes: 30,
    challengeType: "quiz",
    challengeSize: 8,
    ...partial,
  } as TopicMeta;
}

function module_(id: string, name: string): ModuleMeta {
  return { id, trackId: "frontend", name, description: "", topics: [], available: true } as ModuleMeta;
}

const core = module_("js-core", "JavaScript Core");
const hooks = module_("react-hooks", "React Hooks");

const rows: PlanRow[] = [
  { topic: topic({ id: "a", title: "Closures", level: "advanced" }), module: core, track, status: "completed", position: 1 },
  { topic: topic({ id: "b", title: "Hoisting", level: "beginner", challengeType: "code" }), module: core, track, status: "in-progress", position: 2 },
  {
    topic: topic({ id: "c", title: "useEffect deep dive", level: "expert", moduleId: "react-hooks", isMilestone: true }),
    module: hooks,
    track,
    status: "not-started",
    position: 3,
  },
];

const ids = (result: PlanRow[]) => result.map((row) => row.topic.id);

describe("filterPlanRows", () => {
  it("returns every row when nothing is filtered", () => {
    expect(ids(filterPlanRows(rows, EMPTY_PLAN_FILTERS))).toEqual(["a", "b", "c"]);
  });

  it("filters by status", () => {
    expect(ids(filterPlanRows(rows, { ...EMPTY_PLAN_FILTERS, status: "in-progress" }))).toEqual(["b"]);
  });

  it("filters by level, module, challenge type and milestone", () => {
    expect(ids(filterPlanRows(rows, { ...EMPTY_PLAN_FILTERS, level: "expert" }))).toEqual(["c"]);
    expect(ids(filterPlanRows(rows, { ...EMPTY_PLAN_FILTERS, moduleId: "js-core" }))).toEqual(["a", "b"]);
    expect(ids(filterPlanRows(rows, { ...EMPTY_PLAN_FILTERS, challengeType: "code" }))).toEqual(["b"]);
    expect(ids(filterPlanRows(rows, { ...EMPTY_PLAN_FILTERS, milestonesOnly: true }))).toEqual(["c"]);
  });

  it("matches the query against the topic title, its camp and its trail, case-insensitively", () => {
    expect(ids(filterPlanRows(rows, { ...EMPTY_PLAN_FILTERS, query: "  CLOS " }))).toEqual(["a"]);
    expect(ids(filterPlanRows(rows, { ...EMPTY_PLAN_FILTERS, query: "react hooks" }))).toEqual(["c"]);
    expect(ids(filterPlanRows(rows, { ...EMPTY_PLAN_FILTERS, query: "frontend" }))).toEqual(["a", "b", "c"]);
  });

  it("combines filters with AND, so an impossible combination returns nothing", () => {
    const result = filterPlanRows(rows, { ...EMPTY_PLAN_FILTERS, status: "completed", level: "expert" });
    expect(result).toEqual([]);
  });

  it("keeps plan order rather than re-sorting", () => {
    expect(filterPlanRows(rows, EMPTY_PLAN_FILTERS).map((row) => row.position)).toEqual([1, 2, 3]);
  });
});

describe("activeFilterCount", () => {
  it("is zero for the empty filters, and whitespace is not a query", () => {
    expect(activeFilterCount(EMPTY_PLAN_FILTERS)).toBe(0);
    expect(hasActiveFilters({ ...EMPTY_PLAN_FILTERS, query: "   " })).toBe(false);
  });

  it("counts each dimension once", () => {
    expect(
      activeFilterCount({
        query: "x",
        status: "completed",
        level: "expert",
        moduleId: "js-core",
        challengeType: "code",
        milestonesOnly: true,
      }),
    ).toBe(6);
  });
});

describe("option builders", () => {
  it("offers only the camps present in the plan, in plan order, with counts", () => {
    expect(planModuleOptions(rows)).toEqual([
      { id: "js-core", name: "JavaScript Core", count: 2 },
      { id: "react-hooks", name: "React Hooks", count: 1 },
    ]);
  });

  it("offers only the levels present, easiest first", () => {
    expect(planLevelOptions(rows)).toEqual(["beginner", "advanced", "expert"]);
  });

  it("offers nothing for an empty plan", () => {
    expect(planModuleOptions([])).toEqual([]);
    expect(planLevelOptions([])).toEqual([]);
  });
});
