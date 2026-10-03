import { describe, expect, it } from "vitest";

import { estimateMastery, goalsToTargets, orderPath, type GoalForPath } from "../../../shared/pathOrder";
import { ancestorsClosure } from "../../../shared/skillGraph";
import { buildSeedEdges } from "../catalog/graph";
import { SEED_SKILLS } from "../catalog/seed";
import { assertPathOrder, partForRank } from "./goalPath";
import type { PlannedItem } from "./v4Parts";

/**
 * v4.3 Phase 2c on the real seeded skill graph (catalog prerequisites plus the research
 * progressions): random goal sets never schedule a skill before a prerequisite, parts never go
 * backwards, critically weak skills are boosted and mastered goal skills are skipped.
 */

const { edges } = buildSeedEdges(SEED_SKILLS);
const prereq = edges.filter((e) => e.type === "prerequisite");

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const asItems = (steps: ReturnType<typeof orderPath>["steps"]): PlannedItem[] =>
  steps.map((s) => ({
    gap: { skill: s.skillId, severity: 1, roleRelevance: 1, weight: 1, source: "admin_priority", priorityScore: 1, evidence: { summary: "", itemIds: [], missed: 0, asked: 0 }, skipped: false },
    partNumber: partForRank(s.rank),
    partType: "general",
    startLevel: "beginner",
    targetSkill: null,
    skillId: s.skillId,
  }));

describe("random goal sets on the real seeded graph", () => {
  for (const department of ["engineering", "pm", "bd"]) {
    it(`never schedules a skill before its prerequisites (${department})`, () => {
      const ids = SEED_SKILLS.filter((s) => s.departmentId === department).map((s) => s.id);
      for (let seed = 1; seed <= 40; seed += 1) {
        const rand = rng(seed * 7919 + department.length);
        const goals: GoalForPath[] = Array.from({ length: 1 + Math.floor(rand() * 5) }, (_, adminOrder) => ({
          skillIds: Array.from({ length: 1 + Math.floor(rand() * 3) }, () => ids[Math.floor(rand() * ids.length)]),
          slider: 1 + Math.floor(rand() * 5),
          adminOrder,
          goalLevel: 1 + Math.floor(rand() * 5),
        }));
        const measured = ids.filter(() => rand() < 0.3).map((skillId) => ({ skillId, level: Math.floor(rand() * 6) }));
        const { levels } = estimateMastery(measured, edges);
        const result = orderPath({ targets: goalsToTargets(goals, edges), mastery: levels, edges, criticallyWeak: measured.filter((m) => m.level <= 1 && rand() < 0.5).map((m) => m.skillId) });
        expect(result.warnings).toEqual([]);

        const at = new Map(result.steps.map((s, i) => [s.skillId, i]));
        for (const [id, i] of at) for (const before of ancestorsClosure(prereq, [id])) if (at.has(before)) expect(at.get(before)!).toBeLessThan(i);
        // The same check the run stores on the path: prerequisites first, parts never backwards.
        expect(assertPathOrder(asItems(result.steps), edges, result)).toEqual([]);
      }
    });
  }
});

describe("rules on real skills", () => {
  const git: GoalForPath = { skillIds: ["eng-git", "eng-github-flow"], slider: 4, adminOrder: 0, goalLevel: 3, label: "Git" };
  const ai: GoalForPath = { skillIds: ["eng-ai-prompting-for-code", "eng-ai-reusable-skills"], slider: 2, adminOrder: 1, goalLevel: 3, label: "AI" };

  it("boosts a critically weak skill ahead of equal-ranked work, and only the earliest weak link", () => {
    const mastery = { "eng-git": 1, "eng-ai-prompting-for-code": 0, "eng-ai-context-files": 0, "eng-ai-reusable-skills": 0 };
    const plain = orderPath({ targets: goalsToTargets([git, ai], edges), mastery, edges });
    expect(plain.steps.map((s) => s.skillId).indexOf("eng-ai-prompting-for-code")).toBeGreaterThan(plain.steps.map((s) => s.skillId).indexOf("eng-github-flow"));

    const flagged = ["eng-ai-prompting-for-code", "eng-ai-context-files", "eng-ai-reusable-skills"];
    const boosted = orderPath({ targets: goalsToTargets([git, ai], edges), mastery, edges, criticallyWeak: flagged });
    const step = (id: string) => boosted.steps.find((s) => s.skillId === id)!;
    expect(step("eng-ai-prompting-for-code")).toMatchObject({ kind: "must-have", priority: "High" });
    // High rank, boosted: it now comes before the Low-priority goal's chain and right after Git basics.
    expect(boosted.steps.map((s) => s.skillId).indexOf("eng-ai-prompting-for-code")).toBeLessThan(boosted.steps.map((s) => s.skillId).indexOf("eng-ai-context-files"));
    expect(step("eng-ai-context-files").kind).toBe("target");
    expect(step("eng-ai-reusable-skills").priority).toBe("Low");
  });

  it("skips a mastered goal skill and offers the advanced course while it is below 5/5", () => {
    const result = orderPath({ targets: goalsToTargets([git], edges), mastery: { "eng-git": 4, "eng-github-flow": 5 }, edges });
    expect(result.steps.some((s) => s.kind !== "continuation")).toBe(false);
    const result2 = orderPath({ targets: goalsToTargets([git], edges), mastery: { "eng-git": 4, "eng-github-flow": 1 }, edges });
    expect(result2.steps.map((s) => s.skillId)).toEqual(["eng-github-flow"]);
    expect(result2.skipped).toEqual([expect.objectContaining({ skillId: "eng-git", optionalAdvanced: true })]);
  });

  it("infers a prerequisite from a measured skill at 3/5 or more, never from a low one", () => {
    const { levels, estimates } = estimateMastery([{ skillId: "eng-express", level: 4 }, { skillId: "eng-js-async", level: 1 }], edges);
    expect(levels["eng-node-runtime"]).toBe(3); // Express needs Node
    expect(levels["eng-http"]).toBe(3);
    expect(levels["eng-js-event-loop"]).toBe(3); // via Node → async → event loop: implied by Express at 4
    expect(levels["eng-js-async"]).toBe(1); // measured wins
    expect(estimates.find((e) => e.skillId === "eng-node-runtime")?.source).toBe("inferred");
    const low = estimateMastery([{ skillId: "eng-js-async", level: 1 }], edges);
    expect(low.levels["eng-js-event-loop"]).toBeUndefined();
  });

  it("assertPathOrder catches a skill before its prerequisite and parts going backwards", () => {
    const result = orderPath({ targets: goalsToTargets([git], edges), mastery: {}, edges });
    const items = asItems(result.steps);
    expect(assertPathOrder([...items].reverse(), edges)).toContain("eng-github-flow is scheduled before its prerequisite eng-git");
    const backwards = items.map((item, i) => ({ ...item, partNumber: i === 0 ? 2 : 1 }));
    expect(assertPathOrder(backwards, edges)).toContain("Parts are out of order");
  });
});
