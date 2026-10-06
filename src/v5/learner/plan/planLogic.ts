import type { PartType, PathItemView } from "@shared/builder";
import type { PlanItemSource, WeekItemView, WeekView } from "@shared/weeklyPlan";
import { LANE_ORDER } from "@shared/weeklyPlanCore";

/** Pure helpers for the v5 My plan screen. Tested in planLogic.test.ts. */

/** Trail order: lane by lane (Do it now → Must know → Good to know → Extra), then the plan's own order. */
export function planOrder(items: readonly WeekItemView[]): WeekItemView[] {
  return LANE_ORDER.flatMap((lane) => items.filter((item) => item.lane === lane).sort((a, b) => a.position - b.position));
}

/** Where an item opens in v5: the lesson player, for curriculum topics and course lessons alike. */
export function v5Href(item: Pick<WeekItemView, "topicId" | "courseId" | "lessonId" | "href">): string {
  if (item.topicId) return `/learn/lesson/${encodeURIComponent(item.topicId)}`;
  if (item.courseId && item.lessonId) return `/learn/lesson/${encodeURIComponent(item.lessonId)}?course=${encodeURIComponent(item.courseId)}`;
  if (item.courseId) return `/learn/library/${encodeURIComponent(item.courseId)}`;
  return item.href;
}

/** The "why" chip: a short label for where the item came from. */
export const WHY_LABELS: Record<PlanItemSource, string> = {
  admin_priority: "Your admin's priority",
  ai_gap: "From your test results",
  prerequisite: "Needed first",
};

/** The first unfinished item, highest lane first: "your next step". */
/**
 * The card's next step: the lesson the learner is part-way through when it's open this week (the
 * same one Today's Continue resumes, Phase 9.2), else the first open stop in plan order.
 */
export function nextStep(week: WeekView, resumeTopicId: string | null = null): WeekItemView | null {
  const open = planOrder(week.items).filter((item) => item.status !== "done");
  return (resumeTopicId ? open.find((item) => item.topicId === resumeTopicId) : undefined) ?? open[0] ?? null;
}

export function weekStats(week: WeekView): { done: number; total: number; pct: number } {
  const done = week.items.filter((i) => i.status === "done").length;
  const total = week.items.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function sortMilestones(items: readonly PathItemView[]): PathItemView[] {
  return [...items].sort((a, b) => (a.partNumber ?? 0) - (b.partNumber ?? 0) || a.position - b.position);
}

export const milestoneDone = (m: Pick<PathItemView, "topicCount" | "completedCount">) => m.topicCount > 0 && m.completedCount >= m.topicCount;

const moduleOfHref = (href: string) => /\/module\/([^/]+)/.exec(href)?.[1] ?? null;

/** Which milestone this week is working toward: its first unfinished item's milestone. */
export function currentMilestone(milestones: readonly PathItemView[], week: WeekView | null): number {
  if (week) {
    const matchFor = (item: WeekItemView) =>
      milestones.findIndex((m) => (m.courseId !== null && m.courseId === item.courseId) || (m.moduleId != null && m.moduleId === moduleOfHref(item.href)));
    const open = week.items.filter((i) => i.status !== "done").map(matchFor).filter((i) => i >= 0);
    if (open.length) return Math.min(...open);
  }
  const firstOpen = milestones.findIndex((m) => !milestoneDone(m));
  return firstOpen >= 0 ? firstOpen : Math.max(0, milestones.length - 1);
}

export const PART_TONE: Record<PartType, "must_know" | "medium" | "low" | "do_now"> = {
  track: "must_know",
  prerequisite: "do_now",
  ai_dev: "medium",
  general: "low",
  capstone: "must_know",
};

export type PlanView = "trail" | "list";
const VIEW_KEY = "oyelearn.v5.plan.view";

export function readView(): PlanView {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "trail";
  } catch {
    return "trail";
  }
}

export function saveView(view: PlanView): void {
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch {
    // Private mode: the choice just isn't remembered.
  }
}
