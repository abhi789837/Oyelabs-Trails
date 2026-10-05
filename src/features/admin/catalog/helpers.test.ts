import { describe, expect, it } from "vitest";

import type { Catalog, Skill } from "@shared/catalog";

import {
  departmentName,
  departmentOptions,
  filterSkills,
  groupByArea,
  levelBandLabel,
  moveId,
  splitList,
} from "./helpers";

function skill(id: string, overrides: Partial<Skill> = {}): Skill {
  return {
    id,
    departmentId: "engineering",
    name: id,
    area: "General",
    aliases: [],
    tags: [],
    levelMin: "beginner",
    levelMax: "expert",
    trackIds: [],
    prerequisites: [],
    stackIds: [],
    language: null,
    contentModules: [],
    isAiSkill: false,
    status: "active",
    requestedBy: null,
    position: 0,
    ...overrides,
  };
}

const catalog: Catalog = {
  departments: [
    { id: "engineering", name: "Engineering", slug: "engineering", icon: "code", colour: "#2067D3", assessmentFormat: "coding", practiceNoun: "Code", position: 0, archived: false, kind: "role" },
    { id: "pm", name: "Product", slug: "pm", icon: "users", colour: "#2067D3", assessmentFormat: "tasks", practiceNoun: "Task workspace", position: 1, archived: true, kind: "role" },
  ],
  tracks: [],
  stacks: [],
  skills: [],
};

describe("departmentName", () => {
  it("names a known department, says 'All departments' for null and falls back to the id", () => {
    expect(departmentName(catalog, "engineering")).toBe("Engineering");
    expect(departmentName(catalog, null)).toBe("All departments");
    expect(departmentName(catalog, "bd")).toBe("bd");
    expect(departmentName(null, "engineering")).toBe("engineering");
  });
});

describe("departmentOptions", () => {
  it("leaves archived departments out", () => {
    expect(departmentOptions(catalog)).toEqual([{ value: "engineering", label: "Engineering" }]);
    expect(departmentOptions(null)).toEqual([]);
  });
});

describe("levelBandLabel", () => {
  it("shows expert as Super advanced and collapses a single-level band", () => {
    expect(levelBandLabel({ levelMin: "beginner", levelMax: "expert" })).toBe("Beginner – Super advanced");
    expect(levelBandLabel({ levelMin: "advanced", levelMax: "advanced" })).toBe("Advanced");
  });
});

describe("moveId", () => {
  it("swaps neighbours and refuses moves off either end", () => {
    expect(moveId(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveId(["a", "b", "c"], 0, 2)).toEqual(["c", "b", "a"]);
    expect(moveId(["a", "b"], 0, -1)).toBeNull();
    expect(moveId(["a", "b"], 1, 1)).toBeNull();
    expect(moveId([], 0, 1)).toBeNull();
  });
});

describe("filterSkills and groupByArea", () => {
  const skills = [
    skill("react", { area: "Frontend", trackIds: ["frontend"] }),
    skill("sql", { area: "Data", trackIds: ["backend"] }),
    skill("vue", { area: "Frontend", status: "archived" }),
    skill("graphql", { area: "Requested", status: "pending" }),
  ];

  it("filters by status and track, never showing pending requests", () => {
    expect(filterSkills(skills, { query: "", trackId: null, status: "active" }).map((s) => s.id)).toEqual(["react", "sql"]);
    expect(filterSkills(skills, { query: "", trackId: "backend", status: "active" }).map((s) => s.id)).toEqual(["sql"]);
    expect(filterSkills(skills, { query: "", trackId: null, status: "archived" }).map((s) => s.id)).toEqual(["vue"]);
    expect(filterSkills(skills, { query: "rea", trackId: null, status: "active" }).map((s) => s.id)).toEqual(["react"]);
  });

  it("groups by area in first-seen order", () => {
    const groups = groupByArea([skills[0], skills[1], skill("css", { area: "Frontend" })]);
    expect(groups.map((g) => [g.area, g.skills.map((s) => s.id)])).toEqual([
      ["Frontend", ["react", "css"]],
      ["Data", ["sql"]],
    ]);
  });
});

describe("splitList", () => {
  it("trims, drops blanks and de-duplicates", () => {
    expect(splitList(" node, nodejs ,, node ")).toEqual(["node", "nodejs"]);
    expect(splitList("")).toEqual([]);
  });
});
