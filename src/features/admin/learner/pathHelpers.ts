import { isPathBusy, type LearningPathView, type PathItemView, type SkillGapView } from "@shared/builder";
import type { PriorityEntry } from "@shared/setup";

/**
 * Pure helpers for the results-only Path tab: grouping the path under the admin's priorities,
 * naming each course's state, and keeping reasons short.
 */

/** Same loose match the builder uses, so the tab groups exactly the way the path was built. */
export function matchesSkill(a: string, b: string): boolean {
  const left = a.trim().toLowerCase().replace(/\s+/g, " ");
  const right = b.trim().toLowerCase().replace(/\s+/g, " ");
  if (left === right) return true;
  const shorter = left.length <= right.length ? left : right;
  if (shorter.length < 3) return false;
  return left.includes(right) || right.includes(left);
}

/** At most `max` words, with an ellipsis when anything was cut. Never cuts mid-word. */
export function truncateWords(text: string, max = 20): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= max) return words.join(" ");
  return `${words.slice(0, max).join(" ").replace(/[,;:.!?-]+$/, "")}…`;
}

export type CourseState = "matched" | "module" | "reused" | "generated" | "generating" | "needs_review" | "waiting_setup" | "not_made";

export const COURSE_STATE_LABELS: Record<CourseState, string> = {
  matched: "matched",
  module: "Matched · curriculum module",
  reused: "reused",
  generated: "generated",
  generating: "generating",
  needs_review: "needs review",
  waiting_setup: "blocked",
  not_made: "failed",
};

/** v4: a curriculum module attached in place of a course. It has no course id, and that is fine. */
export function isModuleItem(item: Pick<PathItemView, "moduleId">): boolean {
  return Boolean(item.moduleId);
}

/**
 * What happened to one course. An unpublished generated course is still being written while the
 * run is busy, and waiting for a human once it has stopped. A curriculum module is always a match:
 * it was attached from the skill catalog, so it is never generating, removed or failed.
 */
export function courseState(item: Pick<PathItemView, "source" | "available" | "moduleId" | "creating">, pathBusy: boolean): CourseState {
  // v4.4: a course still being made in the background (`course.generate`).
  if (item.creating === "working") return "generating";
  if (item.creating === "held") return "needs_review";
  if (item.creating === "waiting_setup") return "waiting_setup";
  if (item.creating === "failed") return "not_made";
  if (isModuleItem(item)) return "module";
  if (item.source === "unlock") return "matched";
  if (item.source === "reuse") return "reused";
  if (item.available) return "generated";
  return pathBusy ? "generating" : "needs_review";
}

export interface PriorityGroup {
  priority: PriorityEntry;
  /** The course built for it, then the "Must know first" refreshers, in the builder's order. */
  course: PathItemView | null;
  refreshers: PathItemView[];
  gap: SkillGapView | null;
}

export interface GroupedPath {
  groups: PriorityGroup[];
  /** Courses that serve no current priority: an older path, or a priority since removed. */
  others: PathItemView[];
  /** What the assessment found that nobody asked for and nobody skipped. */
  suggestions: SkillGapView[];
}

export function groupPath(
  path: LearningPathView | null,
  priorities: readonly PriorityEntry[],
  gaps: readonly SkillGapView[],
  skipNames: readonly string[] = [],
): GroupedPath {
  const items = [...(path?.items ?? [])].sort((a, b) => a.position - b.position);
  const claimed = new Set<string>();

  const groups = priorities.map((priority) => {
    const mine = items.filter((item) => item.targetSkill !== null && matchesSkill(item.targetSkill, priority.skillName) && !claimed.has(item.id));
    mine.forEach((item) => claimed.add(item.id));
    const [course = null, ...refreshers] = mine;
    return {
      priority,
      course,
      refreshers,
      gap: gaps.find((gap) => matchesSkill(gap.skill, priority.skillName)) ?? null,
    };
  });

  const others = items.filter((item) => !claimed.has(item.id));
  const suggestions = gaps.filter(
    (gap) =>
      !gap.skipped &&
      !priorities.some((p) => matchesSkill(gap.skill, p.skillName)) &&
      !skipNames.some((name) => matchesSkill(gap.skill, name)),
  );
  return { groups, others, suggestions };
}

/** The assessed level, 0–5, or null when no question measured it. */
export function assessedLevel(gap: SkillGapView | null): number | null {
  if (!gap || gap.evidence.asked === 0) return null;
  return Math.max(0, Math.min(5, Math.round((1 - gap.severity) * 5)));
}

/** "5 courses · 1 generating". The counts the status line shows after "Path built Oct 2". */
export function pathCounts(path: LearningPathView): { courses: number; generating: number; needsReview: number } {
  const busy = isPathBusy(path.status);
  let generating = 0;
  let needsReview = 0;
  for (const item of path.items) {
    const state = courseState(item, busy);
    if (state === "generating") generating += 1;
    if (state === "needs_review") needsReview += 1;
  }
  return { courses: path.items.length, generating, needsReview };
}
