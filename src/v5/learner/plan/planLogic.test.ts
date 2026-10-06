import { describe, expect, test } from "vitest";

import { computeTrail } from "@/features/plan/trailGeometry";
import type { PathItemView } from "@shared/builder";
import type { WeekItemView, WeekView } from "@shared/weeklyPlan";

import { currentMilestone, nextStep, planOrder, v5Href, weekStats } from "./planLogic";

const item = (over: Partial<WeekItemView>): WeekItemView => ({
  id: over.id ?? "i",
  lane: "medium",
  position: 0,
  topicId: null,
  courseId: null,
  lessonId: null,
  title: "T",
  context: "",
  level: null,
  minutes: 30,
  reason: "",
  source: "ai_gap",
  status: "pending",
  href: "/x",
  dependsOn: [],
  pinned: false,
  carried: false,
  skipCount: 0,
  ...over,
});

const week = (items: WeekItemView[]): WeekView => ({
  id: "w",
  weekNumber: 3,
  startDate: "2026-10-05",
  endDate: "2026-10-11",
  status: "active" as WeekView["status"],
  source: "rules" as WeekView["source"],
  summary: "",
  roadmapNarrative: "",
  nextWeekPreview: [],
  budgetMinutes: 300,
  plannedMinutes: 120,
  items,
  libraryLessonCount: 10,
  readyForNextWeek: false,
  generatedAt: 0,
});

describe("plan order and next step", () => {
  const items = [
    item({ id: "low", lane: "low" }),
    item({ id: "must2", lane: "must_know", position: 2 }),
    item({ id: "now", lane: "do_now", status: "done" }),
    item({ id: "must1", lane: "must_know", position: 1 }),
  ];

  test("lane by lane, then position", () => {
    expect(planOrder(items).map((i) => i.id)).toEqual(["now", "must1", "must2", "low"]);
  });

  test("next step is the first unfinished in that order; stats count done", () => {
    expect(nextStep(week(items))?.id).toBe("must1");
    expect(weekStats(week(items))).toEqual({ done: 1, total: 4, pct: 25 });
    expect(nextStep(week([item({ status: "done" })]))).toBeNull();
  });
});

describe("v5 links", () => {
  test("topics and course lessons open the lesson player", () => {
    expect(v5Href(item({ topicId: "js-closures" }))).toBe("/learn/lesson/js-closures");
    expect(v5Href(item({ courseId: "c1", lessonId: "l1" }))).toBe("/learn/lesson/l1?course=c1");
    expect(v5Href(item({ courseId: "c1" }))).toBe("/learn/library/c1");
  });
});

describe("the trail is one continuous path", () => {
  test("exactly one M, and the walked part is a prefix of it", () => {
    for (const width of [390, 1200]) {
      const g = computeTrail({
        width,
        items: planOrder([item({ id: "a", lane: "do_now", status: "done" }), item({ id: "b", lane: "must_know" }), item({ id: "c", lane: "low" })]).map((i) => ({ id: i.id, tone: i.lane, done: i.status === "done", labelHeight: 40 })),
      });
      expect((g.d.match(/M/g) ?? []).length).toBe(1);
      expect((g.progressD.match(/M/g) ?? []).length).toBe(1);
      expect(g.d.startsWith(g.progressD.split(" C")[0])).toBe(true);
      expect(g.hereIndex).toBe(1);
    }
  });
});

describe("current milestone", () => {
  const ms = (over: Partial<PathItemView>): PathItemView =>
    ({ id: over.id ?? "m", courseId: null, courseTitle: "", position: 0, source: "gap", reason: "", topicCount: 4, completedCount: 0, available: true, partNumber: 1, partType: "track", targetSkill: null, startLevel: null, ...over }) as PathItemView;

  test("the week's first open item's milestone, else the first unfinished one", () => {
    const milestones = [ms({ id: "a", completedCount: 4 }), ms({ id: "b", courseId: "c2" }), ms({ id: "c", moduleId: "fe-js-core" })];
    expect(currentMilestone(milestones, week([item({ href: "/track/frontend/module/fe-js-core/topic/x" })]))).toBe(2);
    expect(currentMilestone(milestones, null)).toBe(1);
  });
});
