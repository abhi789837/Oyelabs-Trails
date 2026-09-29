import { describe, expect, test } from "vitest";

import type { ScoredGap } from "../../../shared/builder";
import type { LearnerTarget } from "../../../shared/targets";
import {
  assertSpine,
  buildSpine,
  fitPrerequisites,
  matchesTarget,
  PREREQ_TIME_SHARE,
  startLevelFor,
  type BuildSpineInput,
} from "./priorityPath";

/**
 * The admin's targets are the spine.
 *
 * These tests exist because of a specific failure: a learner whose admin had set two High targets —
 * "AI driven development" and "Full stack multi-agent AI development" — got a path of seven things
 * the model had noticed instead, and neither target appeared. The admin had made a decision and the
 * system had treated it as a hint.
 *
 * Each test below is one sentence of the rule that replaced it.
 */

function target(skill: string, priority: LearnerTarget["priority"] = "high", position = 0): LearnerTarget {
  return { skill, priority, position, targetDate: null };
}

function gap(skill: string, partial: Partial<ScoredGap> = {}): ScoredGap {
  return {
    skill,
    severity: 0.8,
    roleRelevance: 1,
    weight: 0.5,
    source: "ai_detected",
    priorityScore: 0.8,
    evidence: { summary: `Missed most of the ${skill} questions.`, itemIds: ["i1"], missed: 4, asked: 5 },
    skipped: false,
    ...partial,
  };
}

function input(partial: Partial<BuildSpineInput> = {}): BuildSpineInput {
  return { targets: [], gaps: [], skip: [], ...partial };
}

describe("every target gets a place, in the admin's order", () => {
  test("the two High targets come first, in the order they were written", () => {
    // The exact case that was broken.
    const path = buildSpine(
      input({
        targets: [target("AI driven development", "high", 0), target("Full stack multi-agent AI development", "high", 1)],
        gaps: [gap("AI-code review"), gap("Prompting"), gap("Linux"), gap("Closures"), gap("REST"), gap("Hoisting"), gap("Vue lifecycle")],
      }),
    );

    expect(path.targets.map((plan) => plan.target.skill)).toEqual([
      "AI driven development",
      "Full stack multi-agent AI development",
    ]);
  });

  test("a High target the learner scored well on still gets a place", () => {
    /* The rule that is easy to get wrong. An admin who writes down that somebody must learn
       multi-agent development has not asked whether they already can — they have said it is part of
       the job. The assessment answers where to start, never whether to start. */
    const path = buildSpine(
      input({
        targets: [target("Docker deployment")],
        gaps: [],
        areaLevels: [{ area: "Docker deployment", level: 5 }],
      }),
    );

    expect(path.targets).toHaveLength(1);
    expect(path.targets[0].startLevel).toBe("advanced");
  });

  test("priorities never interleave", () => {
    const path = buildSpine(
      input({
        targets: [target("Low one", "low", 0), target("High one", "high", 0), target("Medium one", "medium", 0)],
      }),
    );
    expect(path.targets.map((plan) => plan.priority)).toEqual(["high", "medium", "low"]);
  });

  test("a detected gap never ranks above a target", () => {
    const path = buildSpine(
      input({
        targets: [target("Docker deployment", "low")],
        gaps: [gap("Closures", { severity: 1, priorityScore: 1 })],
      }),
    );
    // Even a Low target outranks the most severe thing the model found.
    expect(path.targets[0].target.skill).toBe("Docker deployment");
    expect(path.alsoSuggested.map((g) => g.skill)).toContain("Closures");
  });

  test("a skipped skill is never a target, a prerequisite or a suggestion", () => {
    const path = buildSpine(
      input({
        targets: [target("Vue"), target("Docker deployment")],
        gaps: [gap("Vue lifecycle"), gap("Closures")],
        skip: ["Vue"],
      }),
    );

    expect(path.targets.map((p) => p.target.skill)).toEqual(["Docker deployment"]);
    expect(path.alsoSuggested.map((g) => g.skill)).not.toContain("Vue lifecycle");
  });
});

describe("the assessment decides where a target starts, not whether", () => {
  test("no measurement means it starts at the beginning", () => {
    expect(startLevelFor(null)).toBe("beginner");
  });

  test("the three bands are coarse on purpose", () => {
    // The difference between 3.4 and 3.6 is noise, and pretending otherwise would start the same
    // person in different places on different days.
    expect(startLevelFor(0)).toBe("beginner");
    expect(startLevelFor(1)).toBe("beginner");
    expect(startLevelFor(2)).toBe("intermediate");
    expect(startLevelFor(3)).toBe("intermediate");
    expect(startLevelFor(4)).toBe("advanced");
    expect(startLevelFor(5)).toBe("advanced");
  });

  test("a matching gap sets the level from its severity", () => {
    const path = buildSpine(input({ targets: [target("Docker")], gaps: [gap("Docker deployment", { severity: 1 })] }));
    expect(path.targets[0].assessedLevel).toBe(0);
    expect(path.targets[0].startLevel).toBe("beginner");
  });

  test("an evaluation area beats a gap's severity when both exist", () => {
    // The area level is a direct measurement; severity is an inference from one.
    const path = buildSpine(
      input({
        targets: [target("Docker")],
        gaps: [gap("Docker deployment", { severity: 1 })],
        areaLevels: [{ area: "Docker", level: 4 }],
      }),
    );
    expect(path.targets[0].assessedLevel).toBe(4);
  });

  test("the matched gap is kept as the target's evidence", () => {
    const path = buildSpine(input({ targets: [target("Docker")], gaps: [gap("Docker deployment")] }));
    expect(path.targets[0].evidence?.evidence.summary).toContain("Docker deployment");
  });
});

describe("prerequisites attach under the target they unblock", () => {
  test("a foundational gap becomes groundwork, not a separate item", () => {
    const path = buildSpine(
      input({
        targets: [target("Full stack multi-agent AI development")],
        gaps: [gap("JavaScript closures"), gap("Linux command line")],
      }),
    );

    expect(path.targets[0].prerequisites.map((g) => g.skill)).toEqual(["JavaScript closures", "Linux command line"]);
    expect(path.alsoSuggested).toHaveLength(0);
  });

  test("a foundational gap the target does not depend on is a suggestion", () => {
    /* The bug the third condition exists for: "foundational" alone attached JavaScript closures as
       groundwork for a Docker deployment course. Foundational, yes — and nothing to do with it. */
    const path = buildSpine(input({ targets: [target("Docker deployment")], gaps: [gap("JavaScript closures")] }));
    expect(path.targets[0].prerequisites).toHaveLength(0);
    expect(path.alsoSuggested.map((g) => g.skill)).toEqual(["JavaScript closures"]);
  });

  test("the learner's stack widens what counts as groundwork", () => {
    // "Closures" underpins a React target whether or not the target's own name says JavaScript.
    const path = buildSpine(
      input({ targets: [target("Component performance")], gaps: [gap("JavaScript closures")], stack: "React + Next.js" }),
    );
    expect(path.targets[0].prerequisites.map((g) => g.skill)).toEqual(["JavaScript closures"]);
  });

  test("an adjacent subject is a suggestion, not groundwork", () => {
    /* "Closures" before an agent-building course is groundwork. "REST APIs" beside it is a separate
       subject, and belongs where the admin can promote it rather than being smuggled in. */
    const path = buildSpine(input({ targets: [target("Multi-agent AI")], gaps: [gap("REST API design")] }));
    expect(path.targets[0].prerequisites).toHaveLength(0);
    expect(path.alsoSuggested.map((g) => g.skill)).toEqual(["REST API design"]);
  });

  test("something they can already do is not a refresher", () => {
    const path = buildSpine(input({ targets: [target("Multi-agent AI")], gaps: [gap("Closures", { severity: 0.1 })] }));
    expect(path.targets[0].prerequisites).toHaveLength(0);
  });

  test("a gap is claimed once, so it cannot appear three times down the page", () => {
    const path = buildSpine(
      input({ targets: [target("AI agents", "high", 0), target("AI workflows", "high", 1)], gaps: [gap("Closures")] }),
    );
    const total = path.targets.reduce((n, p) => n + p.prerequisites.length, 0) + path.alsoSuggested.length;
    expect(total).toBe(1);
  });

  test("refreshers are capped at a fifth of the week, across all targets", () => {
    // Three targets each pulling a 45-minute refresher is over two hours — most of a day of
    // groundwork on a fifteen-hour week before anything the admin asked for has begun.
    const path = buildSpine(
      input({
        targets: [target("AI agents", "high", 0), target("React performance", "high", 1), target("Docker deployment", "high", 2)],
        gaps: [gap("JavaScript closures"), gap("Linux shell"), gap("Git basics"), gap("Async programming")],
        stack: "React + Node",
      }),
    );

    const kept = fitPrerequisites(path, 900, () => 45);
    expect(kept.length * 45).toBeLessThanOrEqual(900 * PREREQ_TIME_SHARE);
  });

  test("the first target's groundwork is the groundwork that survives the cap", () => {
    const path = buildSpine(
      input({
        targets: [target("AI agent workflows", "high", 0), target("Docker deployment", "high", 1)],
        gaps: [gap("JavaScript closures"), gap("Linux shell")],
      }),
    );
    // Only room for one.
    const kept = fitPrerequisites(path, 200, () => 40);
    expect(kept).toHaveLength(1);
    expect(path.targets[0].prerequisites).toContainEqual(kept[0]);
  });
});

describe("the spine is checked, not just intended", () => {
  test("a well-formed path has nothing to report", () => {
    const spineInput = input({
      targets: [target("A", "high", 0), target("B", "medium", 0)],
      gaps: [gap("Closures")],
    });
    expect(assertSpine(buildSpine(spineInput), spineInput)).toEqual([]);
  });

  test("it catches a missing target", () => {
    const spineInput = input({ targets: [target("A"), target("B", "high", 1)] });
    const path = buildSpine(spineInput);
    const broken = { ...path, targets: path.targets.slice(0, 1) };
    expect(assertSpine(broken, spineInput).join(" ")).toMatch(/2 targets were set and 1/);
  });

  test("it catches a reordering", () => {
    const spineInput = input({ targets: [target("A", "high", 0), target("B", "high", 1)] });
    const path = buildSpine(spineInput);
    const broken = { ...path, targets: [path.targets[1], path.targets[0]] };
    expect(assertSpine(broken, spineInput).join(" ")).toMatch(/should be "A"/);
  });

  test("it catches a lower priority sorted above a higher one", () => {
    const spineInput = input({ targets: [target("A", "high", 0), target("B", "low", 0)] });
    const path = buildSpine(spineInput);
    const broken = { ...path, targets: [path.targets[1], path.targets[0]] };
    expect(assertSpine(broken, spineInput).join(" ")).toMatch(/lower priority target is ordered above/);
  });

  test("it catches a suggestion that duplicates a target", () => {
    const spineInput = input({ targets: [target("Docker")] });
    const path = buildSpine(spineInput);
    const broken = { ...path, alsoSuggested: [gap("Docker deployment")] };
    expect(assertSpine(broken, spineInput).join(" ")).toMatch(/suggested separately/);
  });
});

describe("matching a gap to a target", () => {
  test("is loose enough for the words an admin and a model each use", () => {
    expect(matchesTarget("Docker deployment on shared hosting", "Docker")).toBe(true);
    expect(matchesTarget("Docker", "Docker deployment")).toBe(true);
  });

  test("but not so loose that short names collide", () => {
    expect(matchesTarget("Go", "Django")).toBe(false);
  });

  test("is not confused by case or spacing", () => {
    expect(matchesTarget("  AI   Driven Development ", "ai driven development")).toBe(true);
  });
});

describe("with no targets at all", () => {
  test("every finding becomes a suggestion rather than vanishing", () => {
    // The pre-targets world, and the honest answer for a learner nobody has set priorities for.
    const path = buildSpine(input({ gaps: [gap("Closures"), gap("REST")] }));
    expect(path.targets).toHaveLength(0);
    expect(path.alsoSuggested).toHaveLength(2);
  });
});
