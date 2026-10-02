import { describe, expect, it } from "vitest";

import type { Catalog, Skill } from "@shared/catalog";
import type { LearnerSetup } from "@shared/setup";

import {
  addPriority,
  toUnderstandRequest,
  understandingKey,
  understandingReady,
  canMove,
  changeDepartment,
  findSkillToAdd,
  focusNames,
  hoursPerDayHint,
  initialSetupState,
  listNames,
  movePriority,
  pickableSkills,
  pickerGroups,
  pickPriority,
  pickSkip,
  previewMix,
  removePriority,
  sameSetup,
  setSlider,
  sortedRows,
  toSaveRequest,
  type PriorityRow,
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
    { id: "engineering", name: "Engineering", slug: "engineering", icon: "code", colour: "#000000", assessmentFormat: "coding", practiceNoun: "Sandbox", position: 0, archived: false },
    { id: "pm", name: "Product", slug: "pm", icon: "box", colour: "#000000", assessmentFormat: "tasks", practiceNoun: "Task workspace", position: 1, archived: false },
  ],
  tracks: [
    { id: "backend", departmentId: "engineering", name: "Backend", description: "", position: 0, archived: false },
    { id: "pm-core", departmentId: "pm", name: "Core PM", description: "", position: 0, archived: false },
  ],
  stacks: [
    { id: "node", departmentId: "engineering", name: "Node", kind: "stack", language: "javascript", aliases: [], position: 0, archived: false },
    { id: "jira", departmentId: "pm", name: "Jira", kind: "tool", language: null, aliases: [], position: 0, archived: false },
  ],
  skills: [
    skill("aws", { name: "AWS", area: "Cloud", aliases: ["amazon web services"], trackIds: ["backend"], levelMin: "intermediate" }),
    skill("docker", { name: "Docker", area: "Cloud", tags: ["containers"], trackIds: ["backend"], levelMin: "intermediate" }),
    skill("git", { name: "Git basics", area: "Tools", trackIds: ["backend"] }),
    skill("react", { name: "React", area: "Frontend", levelMin: "intermediate" }),
    skill("old", { name: "Old thing", status: "archived" }),
    skill("req", { name: "Requested", status: "pending", area: "Requested" }),
    skill("roadmaps", { name: "Roadmaps", departmentId: "pm", area: "Strategy" }),
  ],
};

const rows = (...entries: [string, 1 | 2 | 3 | 4 | 5][]): PriorityRow[] =>
  entries.map(([skillId, slider], position) => ({ skillId, slider, position }));

describe("priority rows", () => {
  it("sorts by slider, ties in selection order", () => {
    const sorted = sortedRows(rows(["a", 3], ["b", 5], ["c", 3], ["d", 5]));
    expect(sorted.map((r) => r.skillId)).toEqual(["b", "d", "a", "c"]);
  });

  it("adds at Medium after the last pick, and never twice", () => {
    const once = addPriority(rows(["a", 5]), "b");
    expect(once).toEqual([
      { skillId: "a", slider: 5, position: 0 },
      { skillId: "b", slider: 3, position: 1 },
    ]);
    expect(addPriority(once, "b")).toHaveLength(2);
  });

  it("re-sorts when a slider changes", () => {
    const next = setSlider(rows(["a", 3], ["b", 3]), "b", 5);
    expect(sortedRows(next).map((r) => r.skillId)).toEqual(["b", "a"]);
  });

  it("moves only within a tie", () => {
    const list = rows(["a", 5], ["b", 3], ["c", 3], ["d", 1]);
    expect(canMove(list, "b", -1)).toBe(false); // above it is a Critical
    expect(canMove(list, "b", 1)).toBe(true);
    expect(canMove(list, "c", 1)).toBe(false); // below it is an Optional
    const moved = movePriority(list, "c", -1);
    expect(sortedRows(moved).map((r) => r.skillId)).toEqual(["a", "c", "b", "d"]);
    // A refused move changes nothing.
    expect(sortedRows(movePriority(list, "a", 1)).map((r) => r.skillId)).toEqual(["a", "b", "c", "d"]);
  });

  it("removes a row", () => {
    expect(removePriority(rows(["a", 3], ["b", 3]), "a").map((r) => r.skillId)).toEqual(["b"]);
  });
});

describe("state", () => {
  const saved: LearnerSetup = {
    departmentId: "engineering",
    trackId: "backend",
    stackIds: ["node"],
    experienceBand: "3-5",
    level: 3,
    priorities: [
      { skillId: "docker", skillName: "Docker", slider: 3, position: 1 },
      { skillId: "aws", skillName: "AWS", slider: 5, position: 0 },
    ],
    skip: [{ skillId: "react", skillName: "React" }],
    hoursPerWeek: 12,
    advanced: { weekStartsMonday: true, deadlineWeeks: 8, courseCap: 3, autoPublish: false },
  };

  it("round-trips a saved setup into a request in display order", () => {
    const state = initialSetupState(saved, "engineering");
    expect(state.levelTouched).toBe(true);
    const request = toSaveRequest(state, true);
    expect(request.priorities).toEqual([
      { skillId: "aws", slider: 5 },
      { skillId: "docker", slider: 3 },
    ]);
    expect(request.skip).toEqual(["react"]);
    expect(request.assign).toBe(true);
    expect(sameSetup(state, initialSetupState(saved, "engineering"))).toBe(true);
  });

  it("starts empty for a new learner, at 15 hours", () => {
    const state = initialSetupState(null, "pm");
    expect(state.departmentId).toBe("pm");
    expect(toSaveRequest(state, false).hoursPerWeek).toBe(15);
  });

  it("keeps a skill in one list only", () => {
    let state = initialSetupState(saved, "engineering");
    state = pickSkip(state, "aws");
    expect(state.priorities.map((p) => p.skillId)).toEqual(["docker"]);
    expect(state.skip).toEqual(["react", "aws"]);
    state = pickPriority(state, "react");
    expect(state.skip).toEqual(["aws"]);
    expect(state.priorities.find((p) => p.skillId === "react")?.slider).toBe(3);
  });

  it("drops picks from another department when the department changes", () => {
    const state = changeDepartment(initialSetupState(saved, "engineering"), catalog, "pm");
    expect(state).toMatchObject({ departmentId: "pm", trackId: null, stackIds: [], priorities: [], skip: [] });
  });
});

describe("picker", () => {
  it("offers active and pending skills of the department only", () => {
    expect(pickableSkills(catalog, "engineering").map((s) => s.id)).toEqual(["aws", "docker", "git", "react", "req"]);
  });

  it("leads with the track's suggestions when unfiltered", () => {
    const groups = pickerGroups(pickableSkills(catalog, "engineering"), "", { id: "backend", name: "Backend" });
    expect(groups[0]).toMatchObject({ heading: "Suggested for Backend" });
    expect(groups[0].skills.map((s) => s.id)).toEqual(["aws", "docker", "git"]);
    expect(groups.slice(1).map((g) => g.heading)).toEqual(["Cloud", "Tools", "Frontend", "Requested"]);
  });

  it("searches aliases and tags, without the suggested group", () => {
    const groups = pickerGroups(pickableSkills(catalog, "engineering"), "containers", { id: "backend", name: "Backend" });
    expect(groups.map((g) => g.heading)).toEqual(["Cloud"]);
    expect(groups[0].skills.map((s) => s.id)).toEqual(["docker"]);
    expect(pickerGroups(pickableSkills(catalog, "engineering"), "amazon web", null)[0].skills[0].id).toBe("aws");
  });

  it("resolves ?add= by id, then name, then best match", () => {
    const skills = pickableSkills(catalog, "engineering");
    expect(findSkillToAdd(skills, "docker")?.id).toBe("docker");
    expect(findSkillToAdd(skills, "Amazon Web Services")?.id).toBe("aws");
    expect(findSkillToAdd(skills, "git")?.id).toBe("git");
    expect(findSkillToAdd(skills, "  ")).toBeNull();
    expect(findSkillToAdd(skills, "cobol")).toBeNull();
  });
});

describe("summary", () => {
  it("rounds hours per day to the nearest half hour", () => {
    expect(hoursPerDayHint(15)).toBe("≈ 3 h/day");
    expect(hoursPerDayHint(12)).toBe("≈ 2.5 h/day");
    expect(hoursPerDayHint(1)).toBe("≈ 0.5 h/day");
    expect(hoursPerDayHint(null)).toBeNull();
    expect(hoursPerDayHint(0)).toBeNull();
  });

  it("previews the same 25-question mix the server plans", () => {
    const state = initialSetupState(null, "engineering");
    const withPicks = pickPriority(pickPriority({ ...state, trackId: "backend" }, "aws", 5), "docker", 4);
    const mix = previewMix(withPicks, catalog);
    expect(mix.total).toBe(25);
    expect(mix.handsOn + mix.mcq).toBe(25);
    expect(mix.lines.find((l) => l.skillId === "git")?.group).toBe("basics");
    expect(focusNames(withPicks, catalog)).toEqual(["AWS", "Docker"]);
  });

  it("lists names compactly", () => {
    expect(listNames([])).toBe("");
    expect(listNames(["AWS"])).toBe("AWS");
    expect(listNames(["AWS", "Docker"])).toBe("AWS and Docker");
    expect(listNames(["A", "B", "C", "D", "E"])).toBe("A, B, C and 2 more");
  });
});

describe("understanding", () => {
  const base = initialSetupState(null, "engineering");

  it("waits for a track or a priority", () => {
    expect(understandingReady(base)).toBe(false);
    expect(understandingReady({ ...base, trackId: "frontend" })).toBe(true);
    expect(understandingReady({ ...base, priorities: [{ skillId: "react", slider: 4, position: 0 }] })).toBe(true);
  });

  it("sends the description trimmed and leaves out hours and settings", () => {
    const request = toUnderstandRequest({ ...base, trackId: "frontend", description: "  Weak on Excel.  " });
    expect(request.description).toBe("Weak on Excel.");
    expect(request).not.toHaveProperty("hoursPerWeek");
    expect(request).not.toHaveProperty("advanced");
  });

  it("changes key with the description but not with hours", () => {
    const key = understandingKey(base);
    expect(understandingKey({ ...base, hoursPerWeek: 30 })).toBe(key);
    expect(understandingKey({ ...base, description: "x" })).not.toBe(key);
  });

  it("round-trips the description and defaults personalisation", () => {
    const state = initialSetupState(
      { ...(initialSetupState(null, "engineering") as unknown as LearnerSetup), priorities: [], skip: [], description: "Joined last week.", advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false } as LearnerSetup["advanced"] },
      "engineering",
    );
    expect(state.description).toBe("Joined last week.");
    expect(state.advanced.personalisation).toBe("balanced");
  });
});
