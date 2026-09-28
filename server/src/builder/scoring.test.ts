import { describe, expect, test } from "vitest";

import { EMPTY_PRIORITIES, type DetectedGap, type LearnerPriorities } from "../../../shared/builder";
import { actionableGaps, normaliseSkill, priorityScore, reasonFor, scoreGaps } from "./scoring";

/**
 * Priority scoring.
 *
 * This is the part of the builder that decides what a person spends the next month learning, so it
 * is worth more tests than the code has lines. The cases below are the arguments, not the
 * arithmetic: which of two gaps should come first, and why.
 */

const gap = (overrides: Partial<DetectedGap> = {}): DetectedGap => ({
  skill: "Server deployment",
  severity: 0.8,
  roleRelevance: 1,
  evidence: { summary: "You missed 4 of 5 questions on server deployment.", itemIds: ["a"], missed: 4, asked: 5 },
  ...overrides,
});

const priorities = (overrides: Partial<LearnerPriorities> = {}): LearnerPriorities => ({
  ...EMPTY_PRIORITIES,
  ...overrides,
});

describe("priorityScore", () => {
  test("multiplies the three inputs", () => {
    expect(priorityScore(0.5, 1, 0.6)).toBeCloseTo(0.3);
  });

  test("any input at zero sinks it", () => {
    // Multiplying rather than adding is the whole point: a skill irrelevant to the role must not
    // climb the list by being very badly missed.
    expect(priorityScore(1, 0, 1)).toBe(0);
    expect(priorityScore(0, 1, 1)).toBe(0);
  });

  test("out-of-range and non-finite inputs are clamped rather than trusted", () => {
    // These come from a model. A severity of 5 would otherwise outrank everything forever.
    expect(priorityScore(5, 1, 1)).toBe(1);
    expect(priorityScore(-1, 1, 1)).toBe(0);
    expect(priorityScore(Number.NaN, 1, 1)).toBe(0);
  });
});

describe("scoreGaps", () => {
  test("a gap the admin listed is marked as agreed by both", () => {
    const [scored] = scoreGaps([gap({ skill: "Server deployment" })], priorities({
      mustHave: [{ skill: "server deployment", weight: "high" }],
    }));
    expect(scored.source).toBe("both");
    expect(scored.weight).toBe(1);
  });

  test("a gap the admin did not mention still counts, at the AI-only weight", () => {
    const [scored] = scoreGaps([gap()], priorities());
    expect(scored.source).toBe("ai_detected");
    expect(scored.weight).toBe(0.5);
  });

  test("an admin skill the test never covered is still a gap, and says why", () => {
    const scored = scoreGaps([], priorities({ mustHave: [{ skill: "Kubernetes", weight: "high" }] }));
    expect(scored).toHaveLength(1);
    expect(scored[0].source).toBe("admin_priority");
    // Severity 0.5 because we genuinely do not know — claiming 1.0 would be inventing evidence.
    expect(scored[0].severity).toBe(0.5);
    expect(scored[0].evidence.asked).toBe(0);
    expect(scored[0].evidence.summary).toMatch(/did not cover it/i);
  });

  test("a must-have always outranks an AI-only gap, even when the numbers disagree", () => {
    /* The case this rule exists for. The AI gap scores 0.50 and the must-have 0.36, so pure
       arithmetic would put the admin's own decision second. */
    const scored = scoreGaps(
      [
        gap({ skill: "Obscure library", severity: 1, roleRelevance: 1 }),
        gap({ skill: "Laravel queues", severity: 0.6, roleRelevance: 1 }),
      ],
      priorities({ mustHave: [{ skill: "Laravel queues", weight: "medium" }] }),
    );
    expect(scored.map((entry) => entry.skill)).toEqual(["Laravel queues", "Obscure library"]);
    expect(scored[0].priorityScore).toBeLessThan(scored[1].priorityScore);
  });

  test("within a source, higher scores come first", () => {
    const scored = scoreGaps(
      [gap({ skill: "Low", severity: 0.2 }), gap({ skill: "High", severity: 0.9 })],
      priorities(),
    );
    expect(scored.map((entry) => entry.skill)).toEqual(["High", "Low"]);
  });

  test("the order is stable when scores tie", () => {
    const scored = scoreGaps([gap({ skill: "Zebra" }), gap({ skill: "Alpha" })], priorities());
    expect(scored.map((entry) => entry.skill)).toEqual(["Alpha", "Zebra"]);
  });

  test("matching is loose enough for the way admins actually write skills", () => {
    const [scored] = scoreGaps([gap({ skill: "DevOps deployment on shared hosting" })], priorities({
      mustHave: [{ skill: "DevOps", weight: "high" }],
    }));
    expect(scored.source).toBe("both");
  });

  test("but not so loose that a short word swallows a longer one", () => {
    const scored = scoreGaps([gap({ skill: "Django" })], priorities({ mustHave: [{ skill: "Go", weight: "high" }] }));
    // Two separate gaps, not one match: Django stays AI-detected, and "Go" becomes an unmatched
    // must-have. Anything else would teach Django because somebody wrote "Go".
    expect(scored.find((entry) => entry.skill === "Django")!.source).toBe("ai_detected");
    expect(scored.find((entry) => entry.skill === "Go")!.source).toBe("admin_priority");
  });

  test("a skipped skill is recorded as a gap, not discarded", () => {
    // "We know you are weak here and chose not to teach it" is a different statement from
    // "we never looked", and the gap map has to be able to say the first one.
    const scored = scoreGaps([gap({ skill: "Kubernetes" })], priorities({ skip: ["kubernetes"] }));
    expect(scored).toHaveLength(1);
    expect(scored[0].skipped).toBe(true);
  });
});

describe("actionableGaps", () => {
  test("drops the skipped ones and applies the cap", () => {
    const scored = scoreGaps(
      [gap({ skill: "A", severity: 0.9 }), gap({ skill: "B", severity: 0.8 }), gap({ skill: "C", severity: 0.7 })],
      priorities({ skip: ["B"] }),
    );
    expect(actionableGaps(scored, 5).map((entry) => entry.skill)).toEqual(["A", "C"]);
    expect(actionableGaps(scored, 1).map((entry) => entry.skill)).toEqual(["A"]);
  });

  test("a cap of zero produces nothing rather than everything", () => {
    expect(actionableGaps(scoreGaps([gap()], priorities()), 0)).toEqual([]);
  });
});

describe("reasonFor", () => {
  test("leads with the evidence, in the learner's words", () => {
    const [scored] = scoreGaps([gap()], priorities());
    expect(reasonFor(scored, priorities())).toContain("You missed 4 of 5 questions");
  });

  test("mentions the admin's weight only when they actually set one", () => {
    const withWeight = priorities({ mustHave: [{ skill: "Server deployment", weight: "high" }] });
    const [scored] = scoreGaps([gap()], withWeight);
    expect(reasonFor(scored, withWeight)).toMatch(/marked Server deployment as a high priority/i);

    const [plain] = scoreGaps([gap()], priorities());
    // Saying an admin prioritised it when nobody did would be putting words in their mouth.
    expect(reasonFor(plain, priorities())).not.toMatch(/administrator marked/i);
  });
});

describe("normaliseSkill", () => {
  test("folds case and collapses whitespace", () => {
    expect(normaliseSkill("  Laravel   Queues ")).toBe("laravel queues");
  });
});
