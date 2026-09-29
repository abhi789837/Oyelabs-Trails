import { describe, expect, test } from "vitest";

import type { EvaluationResult } from "../../../shared/assessment";
import { EMPTY_PRIORITIES, type ScoredGap } from "../../../shared/builder";
import { assertPartOrder, planParts, type PartsInput } from "./parts";

/**
 * The order of the parts.
 *
 * A flat list ordered by gap score is a reasonable answer to "what is missing" and a poor answer to
 * "what should I do": it opens wherever the biggest number is, which for a backend engineer with a
 * Docker gap is Docker, before anything has shored up the backend work they do every day.
 *
 * So Part 1 and Part 2 are fixed, and these tests are what "fixed" means.
 */

function gap(skill: string, partial: Partial<ScoredGap> = {}): ScoredGap {
  return {
    skill,
    severity: 0.8,
    roleRelevance: 1,
    weight: 1,
    source: "ai_detected",
    priorityScore: 0.8,
    evidence: { summary: `Struggled with ${skill}.`, itemIds: [], missed: 3, asked: 5 },
    skipped: false,
    ...partial,
  };
}

function input(partial: Partial<PartsInput> = {}): PartsInput {
  return {
    track: "backend",
    stack: "PHP + Laravel",
    gaps: [],
    priorities: EMPTY_PRIORITIES,
    evaluation: null,
    courseCap: 6,
    ...partial,
  };
}

describe("the first two parts are fixed", () => {
  test("Part 1 is the learner's own track, whatever the biggest gap was", () => {
    const parts = planParts(input({ gaps: [gap("Docker deployment", { severity: 1, priorityScore: 1 })] }));

    expect(parts[0].type).toBe("track");
    expect(parts[0].partNumber).toBe(1);
    expect(parts[0].gap.skill).toContain("Backend");
  });

  test("Part 2 is AI-driven development, named for their stack", () => {
    const parts = planParts(input({ stack: "PHP + Laravel" }));

    expect(parts[1].type).toBe("ai_dev");
    expect(parts[1].gap.skill).toBe("AI-driven development with PHP + Laravel");
    /* The whole reason the stack is a required field. "Prompting for code" is a course nobody
       needs; "prompting for a Laravel controller" is one somebody does. */
    expect(parts[1].gap.evidence.summary).toContain("PHP + Laravel");
  });

  test("both appear even when the assessment found nothing to hang them on", () => {
    // Part 2 especially: no placement test measures how somebody works with AI.
    const parts = planParts(input({ gaps: [] }));
    expect(parts.map((p) => p.type)).toEqual(["track", "ai_dev"]);
  });

  test("with no stack recorded, Part 2 falls back to the track rather than going generic", () => {
    const parts = planParts(input({ stack: null, track: "mobile" }));
    expect(parts[1].gap.skill).toBe("AI-driven development with Mobile");
  });

  test("Part 1 names the weak areas the evaluation actually found", () => {
    const evaluation = {
      areas: [
        { area: "SQL", level: 5, confidence: "high", evidence: [], strengths: [], gaps: [] },
        { area: "Error handling", level: 2, confidence: "high", evidence: [], strengths: [], gaps: [] },
        { area: "API design", level: 3, confidence: "medium", evidence: [], strengths: [], gaps: [] },
      ],
    } as unknown as EvaluationResult;

    const parts = planParts(input({ evaluation }));
    expect(parts[0].gap.evidence.summary).toContain("Error handling");
    expect(parts[0].gap.evidence.summary).not.toContain("SQL"); // level 5 is not a weak link
  });
});

describe("everything else comes after", () => {
  test("the rest keep the order they arrived in", () => {
    const parts = planParts(
      input({
        gaps: [gap("Kubernetes", { source: "admin_priority" }), gap("GraphQL"), gap("Message queues")],
      }),
    );

    expect(parts.slice(2).map((p) => p.gap.skill)).toEqual(["Kubernetes", "GraphQL", "Message queues"]);
    expect(parts.slice(2).every((p) => p.type === "general")).toBe(true);
  });

  test("a gap Part 1 already covers is not repeated later", () => {
    /* Otherwise the learner gets a Laravel course in Part 4 that Part 1 just taught them, which
       reads as the platform not knowing what it already gave them. */
    const parts = planParts(input({ gaps: [gap("Laravel Eloquent"), gap("Kubernetes")] }));
    const laterSkills = parts.slice(2).map((p) => p.gap.skill);
    expect(laterSkills).not.toContain("Laravel Eloquent");
    expect(laterSkills).toContain("Kubernetes");
  });

  test("a skipped gap is never a part", () => {
    const parts = planParts(input({ gaps: [gap("Vue", { skipped: true }), gap("Kubernetes")] }));
    expect(parts.map((p) => p.gap.skill)).not.toContain("Vue");
  });

  test("the course cap counts the fixed parts, not just the rest", () => {
    const parts = planParts(input({ courseCap: 3, gaps: [gap("A"), gap("B"), gap("C"), gap("D")] }));
    expect(parts).toHaveLength(3);
    expect(parts.map((p) => p.type)).toEqual(["track", "ai_dev", "general"]);
  });

  test("a cap below two still gives both fixed parts", () => {
    // They are the ground the rest stands on. A cap is a budget for the rest, not a reason to skip
    // the foundations and teach somebody Kubernetes instead.
    const parts = planParts(input({ courseCap: 1, gaps: [gap("Kubernetes")] }));
    expect(parts.map((p) => p.type)).toEqual(["track", "ai_dev"]);
  });

  test("part numbers are contiguous from one", () => {
    const parts = planParts(input({ gaps: [gap("A"), gap("B")] }));
    expect(parts.map((p) => p.partNumber)).toEqual([1, 2, 3, 4]);
  });
});

describe("the order is checked, not just intended", () => {
  test("a well-formed plan has nothing to report", () => {
    expect(assertPartOrder(planParts(input({ gaps: [gap("Kubernetes")] })))).toEqual([]);
  });

  test("it catches a general part in first place", () => {
    const parts = planParts(input({ gaps: [gap("Kubernetes")] }));
    const broken = [{ ...parts[2], partNumber: 1 }, ...parts.slice(0, 2)];
    expect(assertPartOrder(broken).join(" ")).toMatch(/Part 1 is not the learner's own track/);
  });

  test("it catches the two fixed parts being swapped", () => {
    const parts = planParts(input());
    const swapped = [
      { ...parts[1], partNumber: 1 },
      { ...parts[0], partNumber: 2 },
    ];
    expect(assertPartOrder(swapped).join(" ")).toMatch(/Part 1 is not the learner's own track/);
  });

  test("it catches a gap in the numbering", () => {
    const parts = planParts(input({ gaps: [gap("Kubernetes")] }));
    const broken = [parts[0], parts[1], { ...parts[2], partNumber: 9 }];
    expect(assertPartOrder(broken).join(" ")).toMatch(/out of sequence/);
  });

  test("an empty plan is not an error", () => {
    expect(assertPartOrder([])).toEqual([]);
  });
});

describe("tracks other than backend", () => {
  test("a frontend learner gets frontend foundations", () => {
    const parts = planParts(input({ track: "frontend", stack: "React + Next.js", gaps: [] }));
    expect(parts[0].gap.skill).toContain("Frontend");
    expect(parts[0].gap.skill).toMatch(/state management|rendering|accessibility|testing/);
    expect(parts[1].gap.skill).toBe("AI-driven development with React + Next.js");
  });

  test("a track that was never set still produces both parts", () => {
    const parts = planParts(input({ track: null, stack: null, gaps: [] }));
    expect(parts).toHaveLength(2);
    expect(parts[0].type).toBe("track");
  });
});
