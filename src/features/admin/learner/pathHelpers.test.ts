import { describe, expect, it } from "vitest";

import type { LearningPathView, PathItemView, SkillGapView } from "@shared/builder";
import type { PriorityEntry } from "@shared/setup";

import { assessedLevel, courseState, groupPath, matchesSkill, pathCounts, truncateWords } from "./pathHelpers";

function item(id: string, overrides: Partial<PathItemView> = {}): PathItemView {
  return {
    id,
    courseId: `c-${id}`,
    courseTitle: id,
    position: 0,
    source: "unlock",
    reason: "",
    topicCount: 4,
    completedCount: 0,
    available: true,
    partNumber: null,
    partType: null,
    targetSkill: null,
    startLevel: null,
    ...overrides,
  };
}

function gap(skill: string, overrides: Partial<SkillGapView> = {}): SkillGapView {
  return {
    id: `g-${skill}`,
    skill,
    severity: 0.6,
    source: "ai_detected",
    priorityScore: 0.5,
    skipped: false,
    evidence: { summary: "Missed most of the questions on this.", itemIds: [], missed: 3, asked: 4 },
    ...overrides,
  };
}

function path(items: PathItemView[], overrides: Partial<LearningPathView> = {}): LearningPathView {
  return {
    id: "p",
    status: "ready",
    progressNote: "",
    failureReason: null,
    notice: null,
    createdAt: 0,
    completedAt: 1,
    items,
    ...overrides,
  };
}

const priorities: PriorityEntry[] = [
  { skillId: "aws", skillName: "AWS", slider: 5, position: 0 },
  { skillId: "docker", skillName: "Docker", slider: 4, position: 1 },
];

describe("truncateWords", () => {
  it("keeps short text whole and cuts long text at a word", () => {
    expect(truncateWords("  short reason  ")).toBe("short reason");
    const long = Array.from({ length: 25 }, (_, i) => `w${i}`).join(" ");
    expect(truncateWords(long)).toBe(`${Array.from({ length: 20 }, (_, i) => `w${i}`).join(" ")}…`);
    expect(truncateWords("one, two, three, four", 2)).toBe("one, two…");
    expect(truncateWords("")).toBe("");
  });
});

describe("courseState", () => {
  it("names every source", () => {
    expect(courseState({ source: "unlock", available: true }, false)).toBe("matched");
    expect(courseState({ source: "reuse", available: true }, false)).toBe("reused");
    expect(courseState({ source: "generated", available: true }, false)).toBe("generated");
    expect(courseState({ source: "generated", available: false }, true)).toBe("generating");
    expect(courseState({ source: "generated", available: false }, false)).toBe("needs_review");
  });
});

describe("groupPath", () => {
  it("puts each course and its refreshers under the priority it serves", () => {
    const grouped = groupPath(
      path([
        item("aws-course", { targetSkill: "AWS", position: 0 }),
        item("linux", { targetSkill: "AWS", position: 1 }),
        item("orphan", { position: 2 }),
      ]),
      priorities,
      [gap("AWS"), gap("Kafka"), gap("React", { skipped: true }), gap("Vue")],
      ["Vue"],
    );
    expect(grouped.groups[0].course?.id).toBe("aws-course");
    expect(grouped.groups[0].refreshers.map((r) => r.id)).toEqual(["linux"]);
    expect(grouped.groups[0].gap?.skill).toBe("AWS");
    // Docker has no course: the row still exists, so the tab can say why.
    expect(grouped.groups[1]).toMatchObject({ course: null, refreshers: [], gap: null });
    expect(grouped.others.map((o) => o.id)).toEqual(["orphan"]);
    expect(grouped.suggestions.map((s) => s.skill)).toEqual(["Kafka"]);
  });

  it("handles no path at all", () => {
    const grouped = groupPath(null, priorities, []);
    expect(grouped.groups).toHaveLength(2);
    expect(grouped.others).toEqual([]);
  });

  it("matches loosely, like the builder", () => {
    expect(matchesSkill("AWS Lambda", "aws lambda")).toBe(true);
    expect(matchesSkill("Docker", "Docker Compose")).toBe(true);
    expect(matchesSkill("Go", "Google Ads")).toBe(false);
  });
});

describe("levels and counts", () => {
  it("reports an assessed level only when something was asked", () => {
    expect(assessedLevel(gap("AWS", { severity: 0.4 }))).toBe(3);
    expect(assessedLevel(gap("AWS", { evidence: { summary: "Not covered by the test.", itemIds: [], missed: 0, asked: 0 } }))).toBeNull();
    expect(assessedLevel(null)).toBeNull();
  });

  it("counts generating and needs-review courses", () => {
    const items = [item("a"), item("b", { source: "generated", available: false })];
    expect(pathCounts(path(items))).toEqual({ courses: 2, generating: 0, needsReview: 1 });
    expect(pathCounts(path(items, { status: "writing" }))).toEqual({ courses: 2, generating: 1, needsReview: 0 });
  });
});
