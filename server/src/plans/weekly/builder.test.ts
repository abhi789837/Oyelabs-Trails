import { describe, expect, test } from "vitest";

import { EMPTY_PRIORITIES, type LearnerPriorities, type ScoredGap } from "../../../../shared/builder";
import {
  BUDGET_TOLERANCE,
  DO_NOW_SHARE,
  MUST_KNOW_MINUTES,
  budgetCeiling,
  draftMinutes,
  flattenLanes,
  itemKey,
  laneMinutes,
  wordCount,
} from "../../../../shared/weeklyPlan";
import { buildWeek, laneForGap, whyLine } from "./builder";
import { enforce } from "./enforce";
import { matchScore, skillTokens } from "./matching";
import type { BuildWeekInput, Candidate } from "./types";

/**
 * The weekly builder.
 *
 * This is the function that decides what somebody does for the next seven days, so the tests are
 * written as the rules themselves rather than as coverage: the budget is respected, the admin's order
 * wins, the skip list holds, prerequisites land in Must know, nothing appears twice, and unfinished
 * work comes back. Each of those is a promise the brief makes to an admin, and each one is cheap to
 * break by accident.
 */

let seq = 0;

function candidate(partial: Partial<Candidate> & { title: string }): Candidate {
  const order = partial.order ?? seq++;
  const key = partial.key ?? `topic-${partial.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const defaults: Candidate = {
    key,
    topicId: partial.lessonId ? null : key,
    courseId: null,
    lessonId: null,
    title: partial.title,
    context: "A Module · A Track",
    haystack: `${partial.title} ${partial.context ?? "A Module A Track"}`.toLowerCase(),
    level: "intermediate",
    minutes: 30,
    order,
    groupId: "mod-a",
    done: false,
    href: `/x/${key}`,
  };
  return { ...defaults, ...partial, key, order };
}

function gap(partial: Partial<ScoredGap> & { skill: string }): ScoredGap {
  return {
    severity: 0.8,
    roleRelevance: 1,
    weight: 1,
    source: "both",
    priorityScore: 0.8,
    evidence: { summary: "You struggled with this.", itemIds: [], missed: 4, asked: 5 },
    skipped: false,
    ...partial,
  };
}

function input(partial: Partial<BuildWeekInput> = {}): BuildWeekInput {
  return {
    weekNumber: 1,
    startDate: "2026-09-28",
    endDate: "2026-10-04",
    budgetMinutes: 900, // 15 h
    priorities: EMPTY_PRIORITIES,
    gaps: [],
    candidates: [],
    carryOver: [],
    pinned: [],
    strengths: [],
    ...partial,
  };
}

function priorities(partial: Partial<LearnerPriorities>): LearnerPriorities {
  return { ...EMPTY_PRIORITIES, ...partial };
}

/** Every key in the draft, lane by lane. */
function keys(draft: ReturnType<typeof buildWeek>): string[] {
  return flattenLanes(draft.lanes).map(({ item }) => itemKey(item));
}

function lane(draft: ReturnType<typeof buildWeek>, key: string): string | undefined {
  return flattenLanes(draft.lanes).find((entry) => itemKey(entry.item) === key)?.lane;
}

// ---------------------------------------------------------------------------

describe("the week fits the learner's time", () => {
  test("a fifteen-hour budget does not produce a hundred and ninety hours", () => {
    /* The bug this whole feature exists to fix: the page said "0 of 204 lessons, 190 h 50 min". */
    const candidates = Array.from({ length: 204 }, (_, i) =>
      candidate({ title: `Lesson ${i}`, key: `t${i}`, order: i, minutes: 56 }),
    );
    const draft = buildWeek(input({ candidates, budgetMinutes: 900 }));

    expect(draftMinutes(draft.lanes)).toBeLessThanOrEqual(900);
    expect(flattenLanes(draft.lanes).length).toBeLessThan(204);
  });

  test("the total lands inside the budget plus ten percent", () => {
    const candidates = Array.from({ length: 40 }, (_, i) =>
      candidate({ title: `Lesson ${i}`, key: `t${i}`, order: i, minutes: 45 }),
    );
    const draft = buildWeek(input({ candidates, budgetMinutes: 600 }));
    expect(draftMinutes(draft.lanes)).toBeLessThanOrEqual(budgetCeiling(600));
  });

  test("a small library gives a small week rather than a padded one", () => {
    const candidates = [candidate({ title: "Only thing", minutes: 20 })];
    const draft = buildWeek(input({ candidates, budgetMinutes: 900 }));
    expect(keys(draft)).toEqual(["topic-only-thing"]);
    expect(draftMinutes(draft.lanes)).toBe(20);
  });

  test("enforce trims an over-budget draft from the bottom lane up", () => {
    const candidates = [
      candidate({ title: "Kubernetes Pods", key: "red", order: 5, minutes: 200, haystack: "kubernetes pods" }),
      candidate({ title: "Filler One", key: "f1", order: 6, minutes: 200 }),
      candidate({ title: "Filler Two", key: "f2", order: 7, minutes: 200 }),
    ];
    const draft = buildWeek(
      input({
        candidates,
        budgetMinutes: 900,
        priorities: priorities({ mustHave: [{ skill: "Kubernetes", weight: "high" }] }),
        gaps: [gap({ skill: "Kubernetes" })],
      }),
    );
    expect(lane(draft, "red")).toBe("do_now");
    expect(draft.lanes.low.length).toBeGreaterThan(0);

    /* Tighten the budget after the fact — the shape an admin dropping somebody from 15 h to 4 h
       produces, and the shape a model that ignored the budget produces. */
    const tightened = { ...draft, weeklyBudgetMinutes: 220 };
    const { draft: fixed } = enforce({ draft: tightened, candidates, priorities: EMPTY_PRIORITIES });

    expect(draftMinutes(fixed.lanes)).toBeLessThanOrEqual(budgetCeiling(220));
    expect(fixed.lanes.low).toHaveLength(0);
    expect(fixed.lanes.doNow.map(itemKey)).toEqual(["red"]);
  });
});

describe("the admin's order comes first", () => {
  test("a High must-have with a gap lands in Do it now", () => {
    const candidates = [
      candidate({ title: "Docker Multi-Stage Builds", key: "docker", order: 10 }),
      candidate({ title: "CSS Grid Deep Dive", key: "grid", order: 11 }),
    ];
    const draft = buildWeek(
      input({
        candidates,
        priorities: priorities({ mustHave: [{ skill: "Docker", weight: "high" }] }),
        gaps: [gap({ skill: "Docker", weight: 1, source: "both" })],
      }),
    );
    expect(lane(draft, "docker")).toBe("do_now");
  });

  test("a Medium must-have lands in Medium, not in Do it now", () => {
    const candidates = [candidate({ title: "Redis for Caching", key: "redis" })];
    const draft = buildWeek(
      input({
        candidates,
        priorities: priorities({ mustHave: [{ skill: "Redis", weight: "medium" }] }),
        gaps: [gap({ skill: "Redis", weight: 0.6, source: "both" })],
      }),
    );
    expect(lane(draft, "redis")).toBe("medium");
  });

  test("a gap only the assessment found never reaches the red lane", () => {
    /* "The model thinks this is urgent" is a weaker claim than "the person who hired them says so",
       and the red lane is for the second one. */
    expect(laneForGap(gap({ skill: "Anything", source: "ai_detected", severity: 0.95, weight: 0.5 }))).toBe("medium");
    expect(laneForGap(gap({ skill: "Anything", source: "ai_detected", severity: 0.2, weight: 0.5 }))).toBe("low");
  });

  test("Do it now takes at most half the week", () => {
    const candidates = Array.from({ length: 8 }, (_, i) =>
      candidate({ title: `Docker lesson ${i}`, key: `d${i}`, order: i, minutes: 120, haystack: `docker lesson ${i}` }),
    );
    const draft = buildWeek(
      input({
        candidates,
        budgetMinutes: 600,
        priorities: priorities({ mustHave: [{ skill: "Docker", weight: "high" }] }),
        gaps: [gap({ skill: "Docker" })],
      }),
    );
    expect(laneMinutes(draft.lanes.doNow)).toBeLessThanOrEqual(600 * DO_NOW_SHARE);
  });

  test("an admin item sorts above an inferred one within a lane", () => {
    const candidates = [
      candidate({ title: "Inferred thing", key: "inferred", order: 1, haystack: "observability logging" }),
      candidate({ title: "Asked-for thing", key: "asked", order: 2, haystack: "kubernetes pods" }),
    ];
    const draft = buildWeek(
      input({
        candidates,
        priorities: priorities({ mustHave: [{ skill: "Kubernetes", weight: "medium" }] }),
        gaps: [
          gap({ skill: "observability", source: "ai_detected", weight: 0.5, severity: 0.9 }),
          gap({ skill: "Kubernetes", source: "both", weight: 0.6 }),
        ],
      }),
    );
    const { draft: sorted } = enforce({ draft, candidates, priorities: EMPTY_PRIORITIES });
    const medium = sorted.lanes.medium.map(itemKey);
    expect(medium.indexOf("asked")).toBeLessThan(medium.indexOf("inferred"));
  });
});

describe("the skip list is respected", () => {
  test("a skipped skill's lessons are not scheduled at all, not even as filler", () => {
    /* The interesting half. A skipped *gap* was already filtered; a skipped lesson turning up as
       filler is the failure that would make "don't teach them Docker" quietly untrue. */
    const candidates = [
      candidate({ title: "Writing Dockerfiles", key: "dockerfiles", order: 1, haystack: "writing dockerfiles docker" }),
      candidate({ title: "Semantic HTML", key: "html", order: 2, haystack: "semantic html" }),
    ];
    const draft = buildWeek(input({ candidates, priorities: priorities({ skip: ["Docker"] }) }));
    expect(keys(draft)).toEqual(["html"]);
  });

  test("enforce drops a skipped item a model tried to add back", () => {
    const candidates = [candidate({ title: "Writing Dockerfiles", key: "dockerfiles", haystack: "writing dockerfiles docker" })];
    const draft = buildWeek(input({ candidates }));
    expect(keys(draft)).toContain("dockerfiles");

    const { draft: fixed, adjustments } = enforce({
      draft,
      candidates,
      priorities: priorities({ skip: ["Docker"] }),
    });
    expect(keys(fixed)).toEqual([]);
    expect(adjustments.join(" ")).toMatch(/skip list/);
  });
});

describe("prerequisites land in Must know", () => {
  test("an earlier lesson in the same module is lifted out of trail order", () => {
    const promises = candidate({ title: "How Promises Are Scheduled", key: "promises", order: 1, minutes: 25 });
    const express = candidate({
      title: "Async Express Handlers",
      key: "express",
      order: 5,
      minutes: 40,
      haystack: "async express handlers express",
    });
    const draft = buildWeek(
      input({
        candidates: [promises, express],
        priorities: priorities({ mustHave: [{ skill: "Express", weight: "high" }] }),
        gaps: [gap({ skill: "Express" })],
      }),
    );

    expect(lane(draft, "express")).toBe("do_now");
    expect(lane(draft, "promises")).toBe("must_know");
  });

  test("the dependent item names what it waits on, and the prerequisite does not point back", () => {
    const draft = buildWeek(
      input({
        candidates: [
          candidate({ title: "Promises", key: "promises", order: 1, minutes: 25 }),
          candidate({ title: "Async Express", key: "express", order: 4, minutes: 40, haystack: "async express" }),
        ],
        priorities: priorities({ mustHave: [{ skill: "Express", weight: "high" }] }),
        gaps: [gap({ skill: "Express" })],
      }),
    );
    expect(draft.lanes.doNow[0]?.dependsOn).toContain("promises");
    expect(draft.lanes.mustKnow[0]?.dependsOn).toEqual([]);
  });

  test("a long lesson is not a Must-know item", () => {
    const long = candidate({ title: "Long Foundation", key: "long", order: 1, minutes: MUST_KNOW_MINUTES.max + 30 });
    const target = candidate({ title: "Async Express", key: "express", order: 4, haystack: "async express" });
    const draft = buildWeek(
      input({
        candidates: [long, target],
        priorities: priorities({ mustHave: [{ skill: "Express", weight: "high" }] }),
        gaps: [gap({ skill: "Express" })],
      }),
    );
    expect(lane(draft, "long")).not.toBe("must_know");
  });

  test("enforce moves an over-long Must-know item to Medium rather than dropping it", () => {
    const candidates = [candidate({ title: "Big Thing", key: "big", minutes: 90 })];
    const draft = buildWeek(input({ candidates }));
    const forced = { ...draft, lanes: { doNow: [], mustKnow: [flattenLanes(draft.lanes)[0]!.item], medium: [], low: [] } };
    const { draft: fixed, adjustments } = enforce({ draft: forced, candidates, priorities: EMPTY_PRIORITIES });

    expect(fixed.lanes.mustKnow).toHaveLength(0);
    expect(fixed.lanes.medium.map(itemKey)).toEqual(["big"]);
    expect(adjustments.join(" ")).toMatch(/out of Must know/);
  });

  test("a week with no prerequisites falls back to baseline lessons", () => {
    /* A red lane that is the first thing in its module. Leaving Must know empty would be honest but
       useless; the trail's own earliest short lessons are the baseline. */
    const first = candidate({ title: "Kubernetes Pods", key: "k8s", order: 0, haystack: "kubernetes pods" });
    const later = candidate({ title: "Later Short Thing", key: "later", order: 1, minutes: 20 });
    const draft = buildWeek(
      input({
        candidates: [first, later],
        priorities: priorities({ mustHave: [{ skill: "Kubernetes", weight: "high" }] }),
        gaps: [gap({ skill: "Kubernetes" })],
      }),
    );
    expect(draft.lanes.mustKnow.length).toBeGreaterThan(0);
  });
});

describe("no item appears in more than one lane", () => {
  test("the builder never repeats a lesson", () => {
    const candidates = [
      candidate({ title: "Docker Images", key: "images", order: 1, haystack: "docker images" }),
      candidate({ title: "Docker Compose", key: "compose", order: 2, haystack: "docker compose" }),
    ];
    const draft = buildWeek(
      input({
        candidates,
        priorities: priorities({ mustHave: [{ skill: "Docker", weight: "high" }] }),
        // Two gaps that both match the same lessons.
        gaps: [gap({ skill: "Docker" }), gap({ skill: "Docker Compose", source: "ai_detected", weight: 0.5 })],
      }),
    );
    const all = keys(draft);
    expect(new Set(all).size).toBe(all.length);
  });

  test("enforce keeps the more urgent copy of a duplicate", () => {
    const candidates = [candidate({ title: "Thing", key: "thing" })];
    const draft = buildWeek(input({ candidates }));
    const item = flattenLanes(draft.lanes)[0]!.item;
    const doubled = { ...draft, lanes: { doNow: [item], mustKnow: [], medium: [], low: [item] } };

    const { draft: fixed, adjustments } = enforce({ draft: doubled, candidates, priorities: EMPTY_PRIORITIES });
    expect(fixed.lanes.doNow.map(itemKey)).toEqual(["thing"]);
    expect(fixed.lanes.low).toHaveLength(0);
    expect(adjustments.join(" ")).toMatch(/duplicate/);
  });
});

describe("carry-over into the next week", () => {
  test("an unfinished red item comes back red", () => {
    const candidates = [
      candidate({ title: "Unfinished Red", key: "red", order: 9 }),
      candidate({ title: "Something New", key: "new", order: 1 }),
    ];
    const draft = buildWeek(
      input({
        weekNumber: 2,
        candidates,
        carryOver: [
          {
            key: "red",
            lane: "do_now",
            reason: "Admin: DevOps · High",
            source: "admin_priority",
            carriedFrom: "week-1",
            skipCount: 1,
            pinned: false,
          },
        ],
      }),
    );
    expect(lane(draft, "red")).toBe("do_now");
    expect(draft.lanes.doNow[0]?.reason).toBe("Admin: DevOps · High");
  });

  test("carried work is kept even when the week is already full", () => {
    const candidates = [
      candidate({ title: "Carried", key: "carried", order: 50, minutes: 120 }),
      ...Array.from({ length: 10 }, (_, i) => candidate({ title: `Filler ${i}`, key: `f${i}`, order: i, minutes: 60 })),
    ];
    const draft = buildWeek(
      input({
        weekNumber: 3,
        budgetMinutes: 180,
        candidates,
        carryOver: [
          { key: "carried", lane: "do_now", reason: "Still outstanding", source: "admin_priority", carriedFrom: "w2", skipCount: 2, pinned: false },
        ],
      }),
    );
    const { draft: fixed } = enforce({
      draft,
      candidates,
      priorities: EMPTY_PRIORITIES,
      protectedKeys: ["carried"],
    });
    expect(keys(fixed)).toContain("carried");
    expect(draftMinutes(fixed.lanes)).toBeLessThanOrEqual(budgetCeiling(180));
  });

  test("an item completed since last week is not carried back in", () => {
    const candidates = [candidate({ title: "Done Already", key: "done", done: true })];
    const draft = buildWeek(
      input({
        candidates,
        carryOver: [
          { key: "done", lane: "do_now", reason: "was outstanding", source: "admin_priority", carriedFrom: "w1", skipCount: 1, pinned: false },
        ],
      }),
    );
    expect(keys(draft)).not.toContain("done");
  });

  test("a pinned item is forced into Do it now whatever lane it came from", () => {
    const candidates = [candidate({ title: "Pinned Thing", key: "pinned", order: 30 })];
    const draft = buildWeek(input({ candidates, pinned: ["pinned"] }));
    expect(lane(draft, "pinned")).toBe("do_now");
  });
});

describe("what the learner reads", () => {
  test("the summary is three sentences and about sixty words", () => {
    const candidates = Array.from({ length: 12 }, (_, i) => candidate({ title: `Lesson ${i}`, key: `t${i}`, order: i }));
    const draft = buildWeek(
      input({
        candidates,
        strengths: ["JavaScript", "CSS"],
        gaps: [gap({ skill: "Deployment" }), gap({ skill: "Testing" })],
      }),
    );
    expect(wordCount(draft.summary)).toBeLessThanOrEqual(60);
    expect(draft.summary.split(/[.!?]/).filter((s) => s.trim()).length).toBeLessThanOrEqual(4);
  });

  test("the why line names the admin, the weight and the evidence", () => {
    const line = whyLine(
      gap({ skill: "Deployment", source: "both", evidence: { summary: "x", itemIds: [], missed: 4, asked: 5 } }),
      priorities({ mustHave: [{ skill: "Deployment", weight: "high" }] }),
    );
    expect(line).toContain("Admin: Deployment");
    expect(line).toContain("High");
    expect(line).toContain("missed 4 of 5");
  });

  test("a preview of next week names things that are not in this one", () => {
    const candidates = Array.from({ length: 30 }, (_, i) =>
      candidate({ title: `Lesson ${i}`, key: `t${i}`, order: i, minutes: 60 }),
    );
    const draft = buildWeek(input({ candidates, budgetMinutes: 300 }));
    const scheduled = new Set(keys(draft));
    const titles = new Set(
      candidates.filter((c) => scheduled.has(c.key)).map((c) => c.title),
    );
    expect(draft.nextWeekPreview.length).toBeGreaterThan(0);
    for (const title of draft.nextWeekPreview) expect(titles.has(title)).toBe(false);
  });

  test("a budget of fifteen hours comes out between twelve and eighteen", () => {
    /* The number the brief asks for by name. 204 lessons at a realistic spread of durations. */
    const candidates = Array.from({ length: 204 }, (_, i) =>
      candidate({ title: `Lesson ${i}`, key: `t${i}`, order: i, minutes: [25, 40, 55, 70][i % 4] }),
    );
    const draft = buildWeek(input({ candidates, budgetMinutes: 15 * 60 }));
    const hours = draftMinutes(draft.lanes) / 60;
    expect(hours).toBeGreaterThanOrEqual(12);
    expect(hours).toBeLessThanOrEqual(15 * (1 + BUDGET_TOLERANCE));
    expect(flattenLanes(draft.lanes).length).toBeGreaterThanOrEqual(8);
  });
});

describe("only unlocked, unfinished lessons", () => {
  test("a completed lesson is never scheduled", () => {
    const candidates = [
      candidate({ title: "Already Done", key: "done", order: 1, done: true }),
      candidate({ title: "Still To Do", key: "todo", order: 2 }),
    ];
    const draft = buildWeek(input({ candidates }));
    expect(keys(draft)).toEqual(["todo"]);
  });

  test("enforce drops an id that is not in the library", () => {
    const candidates = [candidate({ title: "Real", key: "real" })];
    const draft = buildWeek(input({ candidates }));
    const invented = {
      ...draft,
      lanes: {
        ...draft.lanes,
        doNow: [{ topicId: "made-up-by-a-model", courseId: null, lessonId: null, minutes: 30, reason: "x", source: "ai_gap" as const, dependsOn: [] }],
      },
    };
    const { draft: fixed, adjustments } = enforce({ draft: invented, candidates, priorities: EMPTY_PRIORITIES });
    expect(fixed.lanes.doNow).toHaveLength(0);
    expect(adjustments.join(" ")).toMatch(/not in this learner's unlocked set/);
  });

  test("enforce corrects a duration the draft got wrong", () => {
    const candidates = [candidate({ title: "Ninety Minutes", key: "ninety", minutes: 90 })];
    const draft = buildWeek(input({ candidates }));
    const lied = {
      ...draft,
      lanes: { doNow: [{ ...flattenLanes(draft.lanes)[0]!.item, minutes: 5 }], mustKnow: [], medium: [], low: [] },
    };
    const { draft: fixed, adjustments } = enforce({ draft: lied, candidates, priorities: EMPTY_PRIORITIES });
    expect(fixed.lanes.doNow[0]?.minutes).toBe(90);
    expect(adjustments.join(" ")).toMatch(/corrected/);
  });

  test("enforce clears a dependency on something that is not in Must know", () => {
    const candidates = [
      candidate({ title: "Thing", key: "thing", order: 1 }),
      candidate({ title: "Other Thing", key: "other", order: 2 }),
    ];
    const draft = buildWeek(input({ candidates }));
    const dangling = {
      ...draft,
      lanes: {
        doNow: [{ ...flattenLanes(draft.lanes)[0]!.item, dependsOn: ["nothing-here"] }],
        mustKnow: [],
        medium: [],
        low: [],
      },
    };
    const { draft: fixed, adjustments } = enforce({ draft: dangling, candidates, priorities: EMPTY_PRIORITIES });
    expect(fixed.lanes.doNow[0]?.dependsOn).toEqual([]);
    expect(adjustments.join(" ")).toMatch(/dangling dependency/);
  });
});

describe("skill matching", () => {
  test("words that match everything are dropped", () => {
    expect(skillTokens("Advanced JavaScript fundamentals")).toEqual(["javascript"]);
  });

  test("short real names survive", () => {
    expect(skillTokens("CI/CD with Go")).toEqual(["ci", "cd", "go"]);
  });

  test("the whole phrase is a full match; partial coverage is not", () => {
    expect(matchScore("cache invalidation", "cache invalidation strategies")).toBe(1);
    // A lesson that covers two of the three words is two thirds of an answer, and says so.
    expect(matchScore("cache invalidation in redis", "cache invalidation strategies")).toBeCloseTo(2 / 3);
  });

  test("a lesson whose module carries half the skill still matches", () => {
    /* The reason the haystack is title + module + track rather than the title alone. */
    expect(matchScore("cache invalidation", "invalidation strategies · nosql & caching · backend")).toBe(1);
  });

  test("a plural matches its singular", () => {
    expect(matchScore("database indexes", "index and query performance for databases")).toBe(1);
  });

  test("an unrelated lesson does not match", () => {
    expect(matchScore("Laravel Eloquent", "Semantic HTML and document structure")).toBe(0);
  });
});

describe("the learning path's first two parts", () => {
  test("fill the red lane before any detected gap", () => {
    /* Part 1 strengthens the track they work in every day and Part 2 is building with AI in their
       own stack. Everything else on the path is a specific gap standing on those two, so putting
       them first is the order the path is in rather than a weighting applied on top of it. */
    const candidates = [
      candidate({ title: "Backend foundations lesson", key: "p1", order: 1_000_000, partNumber: 1, partType: "track", lessonId: "p1", courseId: "c1" }),
      candidate({ title: "Prompting for Laravel", key: "p2", order: 1_000_001, partNumber: 2, partType: "ai_dev", lessonId: "p2", courseId: "c2" }),
      candidate({ title: "Kubernetes Pods", key: "k8s", order: 5, haystack: "kubernetes pods" }),
    ];

    const draft = buildWeek(
      input({
        candidates,
        priorities: priorities({ mustHave: [{ skill: "Kubernetes", weight: "high" }] }),
        gaps: [gap({ skill: "Kubernetes" })],
      }),
    );

    expect(draft.lanes.doNow.map(itemKey).slice(0, 2)).toEqual(["p1", "p2"]);
  });

  test("are ordered part 1 before part 2", () => {
    const candidates = [
      candidate({ title: "AI lesson", key: "p2", order: 1_000_000, partNumber: 2, partType: "ai_dev", lessonId: "p2", courseId: "c2" }),
      candidate({ title: "Track lesson", key: "p1", order: 1_000_001, partNumber: 1, partType: "track", lessonId: "p1", courseId: "c1" }),
    ];
    const draft = buildWeek(input({ candidates }));
    expect(draft.lanes.doNow.map(itemKey)).toEqual(["p1", "p2"]);
  });

  test("part 3 and beyond are not forced into the red lane", () => {
    // Those are ordinary gaps and take their turn with everything else.
    const candidates = [
      candidate({ title: "Later part lesson", key: "p3", order: 1_000_000, partNumber: 3, partType: "general", lessonId: "p3", courseId: "c3" }),
    ];
    const draft = buildWeek(input({ candidates }));
    expect(draft.lanes.doNow.map(itemKey)).not.toContain("p3");
  });

  test("a long part 1 cannot swallow the whole week", () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      candidate({
        title: `Part 1 lesson ${i}`,
        key: `p1-${i}`,
        order: 1_000_000 + i,
        minutes: 90,
        partNumber: 1,
        partType: "track",
        lessonId: `p1-${i}`,
        courseId: "c1",
      }),
    );
    const draft = buildWeek(input({ candidates, budgetMinutes: 600 }));
    expect(laneMinutes(draft.lanes.doNow)).toBeLessThanOrEqual(600 * DO_NOW_SHARE);
  });
});
