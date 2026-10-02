import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { SEED_DEPARTMENTS, SEED_SKILLS, SEED_STACKS, SEED_TRACKS } from "./index";
import type { SkillLevelBand } from "./types";

const LEVELS: SkillLevelBand[] = ["beginner", "intermediate", "advanced", "expert"];
const SKILL_PREFIX: Record<string, string> = { engineering: "eng-", pm: "pm-", bd: "bd-" };
const STACK_PREFIX: Record<string, string> = { engineering: "stack-", pm: "pm-tool-", bd: "bd-tool-" };
const ENGINEERING_TRACK_IDS = ["frontend", "backend", "fullstack", "mobile", "devops", "ai-ml"];
const MIN_SKILLS: Record<string, number> = { engineering: 160, pm: 60, bd: 60 };
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const registrySource = readFileSync(new URL("../../../../src/content/registry.ts", import.meta.url), "utf8");
const REGISTRY_MODULE_IDS = new Set([...registrySource.matchAll(/\{\s*id:\s*"([^"]+)",\s*name:\s*"[^"]*",\s*idPrefix:/g)].map((m) => m[1]!));

const deptOf = <T extends { id: string; departmentId: string }>(rows: T[]) => new Map(rows.map((r) => [r.id, r.departmentId]));
const tracks = deptOf(SEED_TRACKS);
const stacks = deptOf(SEED_STACKS);
const skills = deptOf(SEED_SKILLS);

describe("catalog seed", () => {
  it("parses the curriculum registry", () => {
    expect(REGISTRY_MODULE_IDS.size).toBeGreaterThan(50);
    expect(REGISTRY_MODULE_IDS.has("fe-js-core")).toBe(true);
  });

  it("has unique ids across every table", () => {
    const all = [...SEED_DEPARTMENTS, ...SEED_TRACKS, ...SEED_STACKS, ...SEED_SKILLS].map((r) => r.id);
    const dupes = all.filter((id, i) => all.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it("defines the three departments", () => {
    expect(SEED_DEPARTMENTS.map((d) => d.id)).toEqual(["engineering", "pm", "bd"]);
    const eng = SEED_DEPARTMENTS.find((d) => d.id === "engineering")!;
    expect(eng.assessmentFormat).toBe("coding");
    expect(eng.colour).toBe("#2067D3");
    for (const d of SEED_DEPARTMENTS.filter((x) => x.id !== "engineering")) {
      expect(d.assessmentFormat).toBe("tasks");
      expect(d.practiceNoun).toBe("Task workspace");
    }
    expect(new Set(SEED_DEPARTMENTS.map((d) => d.colour.toLowerCase())).size).toBe(3);
  });

  it("prefixes tracks and stacks by department", () => {
    expect(SEED_TRACKS.filter((t) => t.departmentId === "engineering").map((t) => t.id)).toEqual(ENGINEERING_TRACK_IDS);
    for (const t of SEED_TRACKS) {
      expect(SKILL_PREFIX[t.departmentId], t.id).toBeDefined();
      if (t.departmentId !== "engineering") expect(t.id.startsWith(`${t.departmentId}-`), t.id).toBe(true);
    }
    for (const s of SEED_STACKS) {
      expect(s.id.startsWith(STACK_PREFIX[s.departmentId]!), s.id).toBe(true);
      expect(s.kind, s.id).toBe(s.departmentId === "engineering" ? "stack" : "tool");
    }
  });

  it("gives every skill a valid, prefixed kebab-case id and coherent fields", () => {
    for (const s of SEED_SKILLS) {
      expect(SKILL_PREFIX[s.departmentId], s.id).toBeDefined();
      expect(s.id.startsWith(SKILL_PREFIX[s.departmentId]!), s.id).toBe(true);
      expect(KEBAB.test(s.id), s.id).toBe(true);
      expect(LEVELS.indexOf(s.levelMin), s.id).toBeGreaterThanOrEqual(0);
      expect(LEVELS.indexOf(s.levelMin), s.id).toBeLessThanOrEqual(LEVELS.indexOf(s.levelMax));
      expect(s.trackIds.length, s.id).toBeGreaterThan(0);
      for (const tag of s.tags) expect(tag, s.id).toBe(tag.toLowerCase());
      expect(new Set(s.trackIds).size, s.id).toBe(s.trackIds.length);
      expect(new Set(s.prerequisites).size, s.id).toBe(s.prerequisites.length);
      expect(s.prerequisites, s.id).not.toContain(s.id);
    }
  });

  it("only references rows of the same department", () => {
    for (const s of SEED_SKILLS) {
      expect(SEED_DEPARTMENTS.some((d) => d.id === s.departmentId), s.id).toBe(true);
      for (const t of s.trackIds) expect(tracks.get(t), `${s.id} -> track ${t}`).toBe(s.departmentId);
      for (const st of s.stackIds) expect(stacks.get(st), `${s.id} -> stack ${st}`).toBe(s.departmentId);
      for (const p of s.prerequisites) expect(skills.get(p), `${s.id} -> prereq ${p}`).toBe(s.departmentId);
    }
    for (const t of SEED_TRACKS) expect(SEED_DEPARTMENTS.some((d) => d.id === t.departmentId), t.id).toBe(true);
  });

  it("has no prerequisite cycles", () => {
    const byId = new Map(SEED_SKILLS.map((s) => [s.id, s]));
    const state = new Map<string, "visiting" | "done">();
    const visit = (id: string, path: string[]) => {
      if (state.get(id) === "done") return;
      if (state.get(id) === "visiting") throw new Error(`cycle: ${[...path, id].join(" -> ")}`);
      state.set(id, "visiting");
      for (const p of byId.get(id)?.prerequisites ?? []) visit(p, [...path, id]);
      state.set(id, "done");
    };
    for (const s of SEED_SKILLS) expect(() => visit(s.id, [])).not.toThrow();
  });

  it("maps content modules to real ids", () => {
    const pmBd = (dept: string, level: SkillLevelBand) => `${dept}-${level}`;
    for (const s of SEED_SKILLS) {
      if (s.departmentId === "engineering") {
        for (const m of s.contentModules) expect(REGISTRY_MODULE_IDS.has(m), `${s.id} -> ${m}`).toBe(true);
      } else {
        // AI-for-your-role skills point at the department's dedicated AI camp.
        // v4.1 agency PM skills have their own camps (`pma-*`); the rest follow the level ladder.
        if (s.contentModules.some((m) => m.startsWith("pma-")) || s.id === "pm-foundations-theory") continue;
        expect(s.contentModules, s.id).toEqual([s.isAiSkill ? `${s.departmentId}-ai` : pmBd(s.departmentId, s.levelMin)]);
      }
    }
  });

  it("meets the per-department minimums", () => {
    for (const d of SEED_DEPARTMENTS) {
      const own = SEED_SKILLS.filter((s) => s.departmentId === d.id);
      expect(own.length, d.id).toBeGreaterThanOrEqual(MIN_SKILLS[d.id]!);
      expect(own.some((s) => s.isAiSkill), d.id).toBe(true);
    }
  });

  it("gives every track at least 8 typical skills", () => {
    for (const t of SEED_TRACKS) {
      const n = SEED_SKILLS.filter((s) => s.trackIds.includes(t.id)).length;
      expect(n, t.id).toBeGreaterThanOrEqual(8);
    }
  });
});
