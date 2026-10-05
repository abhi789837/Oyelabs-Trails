import { describe, expect, it } from "vitest";

import type { Catalog, Skill } from "@shared/catalog";

import { changeDepartmentWithDefaults, initialSetupState, pickPriority, pickSkip, withDepartmentDefaults } from "./helpers";

function skill(id: string, departmentId: string, defaultSlider: number | null, extra: Partial<Skill> = {}): Skill {
  return {
    id,
    departmentId,
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
    defaultSlider,
    status: "active",
    requestedBy: null,
    position: 0,
    ...extra,
  };
}

const catalog = {
  departments: [
    { id: "engineering", name: "Engineering", slug: "engineering", icon: "code", colour: "#000000", assessmentFormat: "coding", practiceNoun: "Sandbox", position: 0, archived: false, kind: "role" },
    { id: "pm", name: "Project Management", slug: "pm", icon: "box", colour: "#000000", assessmentFormat: "tasks", practiceNoun: "Task workspace", position: 1, archived: false, kind: "role" },
  ],
  tracks: [],
  stacks: [],
  skills: [
    skill("aws", "engineering", null),
    skill("pm-theory", "pm", 2),
    skill("pm-excel", "pm", 4),
    skill("pm-client", "pm", 5),
    skill("pm-teams", "pm", 3),
    skill("pm-email", "pm", 5),
    skill("pm-extra", "pm", null),
    skill("pm-pending", "pm", 5, { status: "pending" }),
  ],
} as unknown as Catalog;

describe("department default priorities", () => {
  it("fills an empty list highest first, catalog order within a level, and marks it", () => {
    const state = withDepartmentDefaults(initialSetupState(null, "pm"), catalog);
    expect(state.priorities.map((p) => [p.skillId, p.slider])).toEqual([
      ["pm-client", 5],
      ["pm-email", 5],
      ["pm-excel", 4],
      ["pm-teams", 3],
      ["pm-theory", 2],
    ]);
    expect(state.priorities.map((p) => p.position)).toEqual([0, 1, 2, 3, 4]);
    expect(state.prefilledFrom).toBe("pm");
  });

  it("never overwrites an existing pick", () => {
    const picked = pickPriority(initialSetupState(null, "pm"), "pm-extra", 1);
    expect(withDepartmentDefaults(picked, catalog)).toBe(picked);
  });

  it("leaves out skipped skills", () => {
    const state = withDepartmentDefaults(pickSkip(initialSetupState(null, "pm"), "pm-client"), catalog);
    expect(state.priorities.map((p) => p.skillId)).not.toContain("pm-client");
  });

  it("does nothing for a department without defaults", () => {
    const state = initialSetupState(null, "engineering");
    expect(withDepartmentDefaults(state, catalog)).toBe(state);
  });

  it("prefills on switching to a department when nothing is picked there", () => {
    const state = changeDepartmentWithDefaults(initialSetupState(null, "engineering"), catalog, "pm");
    expect(state.departmentId).toBe("pm");
    expect(state.priorities).toHaveLength(5);
  });

  it("picking the department already selected changes nothing", () => {
    const state = initialSetupState(null, "pm");
    expect(changeDepartmentWithDefaults(state, catalog, "pm")).toBe(state);
  });

  it("switching away drops the defaults and their note", () => {
    const pm = withDepartmentDefaults(initialSetupState(null, "pm"), catalog);
    const eng = changeDepartmentWithDefaults(pm, catalog, "engineering");
    expect(eng.priorities).toEqual([]);
    expect(eng.prefilledFrom).toBeNull();
  });
});
