import { describe, expect, test } from "vitest";

import type { Catalog, Skill } from "@shared/catalog";

import { draftProblem, emptyDraft, groupSkills, scopeLine, toInput, withDepartment } from "./helpers";

const skill = (id: string, departmentId: string): Skill =>
  ({ id, departmentId, name: id, area: "A", aliases: [], tags: [], levelMin: "beginner", levelMax: "expert", trackIds: [], prerequisites: [], stackIds: [], language: null, contentModules: [], isAiSkill: false, defaultSlider: null, status: "active", requestedBy: null, position: 0 }) as Skill;

const catalog: Catalog = {
  departments: [
    { id: "engineering", name: "Engineering", slug: "engineering", icon: "code", colour: "#000000", assessmentFormat: "coding", practiceNoun: "Code", position: 0, archived: false, kind: "role" },
    { id: "pm", name: "Product", slug: "pm", icon: "box", colour: "#000000", assessmentFormat: "tasks", practiceNoun: "Task workspace", position: 1, archived: false, kind: "role" },
    { id: "soft", name: "Soft skills", slug: "soft", icon: "chat", colour: "#000000", assessmentFormat: "tasks", practiceNoun: "Task workspace", position: 2, archived: false, kind: "area" },
  ],
  tracks: [
    { id: "frontend", departmentId: "engineering", name: "Frontend", description: "", position: 0, archived: false },
    { id: "pm-delivery", departmentId: "pm", name: "Delivery", description: "", position: 0, archived: false },
  ],
  stacks: [],
  skills: [skill("eng-git", "engineering"), skill("pm-sprints", "pm"), skill("ss-teamwork", "soft")],
};

describe("skill group drafts", () => {
  test("a group's skills: its department's plus the soft skills; any department sees everything", () => {
    expect(groupSkills(catalog, "pm").map((s) => s.id)).toEqual(["pm-sprints", "ss-teamwork"]);
    expect(groupSkills(catalog, null)).toHaveLength(3);
  });

  test("changing the department drops roles and skills that no longer fit", () => {
    const draft = { ...emptyDraft("engineering"), fromTrackIds: ["frontend"], skillIds: ["eng-git", "ss-teamwork"] };
    expect(withDepartment(draft, catalog, "pm")).toMatchObject({ departmentId: "pm", fromTrackIds: [], skillIds: ["ss-teamwork"] });
  });

  test("plain reasons it cannot be saved yet", () => {
    expect(draftProblem(emptyDraft(null))).toBe("Give the group a name.");
    expect(draftProblem({ ...emptyDraft(null), name: "English" })).toBe("Add at least one phrase that means this group.");
    expect(draftProblem({ ...emptyDraft(null), name: "English", phrases: ["english"] })).toBe("Pick at least one skill.");
    expect(draftProblem({ ...emptyDraft(null), name: "English", phrases: ["english"], skillIds: ["ss-teamwork"] })).toBeNull();
  });

  test("the request lower-cases phrases; the scope line reads plainly", () => {
    expect(toInput({ ...emptyDraft(null), name: " English ", phrases: ["Spoken English", " "], skillIds: ["ss-teamwork"] })).toMatchObject({ name: "English", phrases: ["spoken english"] });
    expect(scopeLine({ departmentId: "engineering", fromTrackIds: ["frontend"] }, catalog)).toBe("Engineering, when their current role is Frontend");
    expect(scopeLine({ departmentId: null, fromTrackIds: [] }, catalog)).toBe("Any department");
  });
});
