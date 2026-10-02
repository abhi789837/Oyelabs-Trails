import { describe, expect, test } from "vitest";

import type { ScoredGap } from "../../../shared/builder";
import { sortPriorities, type PriorityEntry } from "../../../shared/setup";
import { targetsFromPriorities } from "../setup/repo";
import { assertSpine, buildSpine } from "./priorityPath";

/**
 * The v4 priority rule, end to end from the Setup screen's sliders to the path spine:
 * slider order is the spine; Critical outranks High even when picked later; every Critical/High
 * gets a place regardless of the score; AI gaps never rank above a priority; skipped is never taught.
 */

const entry = (skillName: string, slider: PriorityEntry["slider"], position: number): PriorityEntry => ({
  skillId: skillName.toLowerCase().replace(/\s+/g, "-"),
  skillName,
  slider,
  position,
});

const gap = (skill: string, severity = 0.8): ScoredGap => ({
  skill,
  severity,
  roleRelevance: 1,
  weight: 0.5,
  source: "ai_detected",
  priorityScore: severity,
  evidence: { summary: `Missed ${skill}`, itemIds: ["i1"], missed: 4, asked: 5 },
  skipped: false,
});

function spineFrom(entries: PriorityEntry[], gaps: ScoredGap[] = [], skip: string[] = []) {
  return buildSpine({ targets: targetsFromPriorities(sortPriorities(entries)), gaps, skip });
}

describe("v4 priority rule", () => {
  test("slider order is the spine: Critical before High even when picked later", () => {
    const entries = [entry("React hooks", 4, 0), entry("Docker", 2, 1), entry("AWS core", 5, 2), entry("SQL joins", 3, 3)];
    const path = spineFrom(entries);
    expect(path.targets.map((t) => t.target.skill)).toEqual(["AWS core", "React hooks", "SQL joins", "Docker"]);
    expect(assertSpine(path, { targets: targetsFromPriorities(sortPriorities(entries)), gaps: [], skip: [] })).toEqual([]);
  });

  test("ties keep the order the admin picked them in", () => {
    const path = spineFrom([entry("Git", 4, 0), entry("Linux shell", 4, 1), entry("Kubernetes", 4, 2)]);
    expect(path.targets.map((t) => t.target.skill)).toEqual(["Git", "Linux shell", "Kubernetes"]);
  });

  test("every Critical and High priority keeps its place even with a perfect score", () => {
    const path = spineFrom([entry("AWS core", 5, 0), entry("React hooks", 4, 1)], [gap("AWS core", 0)]);
    expect(path.targets.map((t) => t.target.skill)).toEqual(["AWS core", "React hooks"]);
    expect(path.targets.every((t) => t.priority === "high")).toBe(true);
  });

  test("an AI-found gap never ranks above an admin priority, Optional included", () => {
    const path = spineFrom([entry("Figma handoff", 1, 0)], [gap("Event loop", 1)]);
    expect(path.targets.map((t) => t.target.skill)).toEqual(["Figma handoff"]);
    expect(path.alsoSuggested.map((g) => g.skill)).toContain("Event loop");
  });

  test("a skipped skill is never taught, even if it was also a gap", () => {
    const path = spineFrom([entry("Vue", 4, 0), entry("React hooks", 4, 1)], [gap("Vue")], ["Vue"]);
    expect(path.targets.map((t) => t.target.skill)).toEqual(["React hooks"]);
    expect(path.alsoSuggested.some((g) => g.skill === "Vue")).toBe(false);
  });
});
