import { ASSIGNMENT_PRIORITY_LABELS, type AssignmentPriority } from "../../../../shared/oyelabsCourses";
import { DO_NOW_TARGET_ITEMS, MUST_KNOW_MINUTES, type PlanLane, type WeeklyPlanItem } from "../../../../shared/weeklyPlan";
import type { Candidate } from "../../plans/weekly/types";

/**
 * v4.5 Phase 4: courses an admin added, in the weekly plan (PLAN.md §4.4). Pure; called by
 * `plans/weekly/builder.ts` at two points of `buildWeek`:
 *
 *   before the path   "Required for everyone in this department" courses go to Do it now in the
 *                     learner's first weeks (`REQUIRED_WEEKS`), in module order. Most important
 *                     courses follow, into Do it now too.
 *   after the path    Important → Medium, Nice to have → Low.
 *
 * Progression is respected the way v4.3 does it: a course's lessons are taken strictly in order
 * (when one doesn't fit, the rest wait for next week rather than skipping ahead), and when a course
 * skill has an unmet prerequisite in the skill graph, those lessons come first, in Must know, and
 * the course's lesson lists them in `dependsOn`.
 *
 * Lanes: Important goes to Medium rather than Must know (PLAN.md said Must know): Must know is the
 * short-prerequisite checklist, and `enforce` moves anything over 45 minutes out of it anyway.
 */

/** "In their first weeks": weeks 1 and 2 of the learner's plan. */
export const REQUIRED_WEEKS = 2;

export const PRIORITY_LANE: Record<AssignmentPriority, PlanLane> = { most_important: "do_now", important: "medium", nice_to_have: "low" };

/** Lessons of one course a single week may take, by priority. Required courses take what fits. */
const PER_COURSE: Record<AssignmentPriority, number> = { most_important: 2, important: 2, nice_to_have: 1 };

export function assignmentReason(candidate: Pick<Candidate, "required" | "assignedPriority">, early: boolean): string {
  if (candidate.required && early) return "Required for everyone in your department";
  return `Added by your administrator: ${ASSIGNMENT_PRIORITY_LABELS[candidate.assignedPriority ?? "important"]}`;
}

export interface WeekRulesApi {
  weekNumber: number;
  doNowCap: number;
  mustKnowCap: number;
  take: (candidate: Candidate, lane: PlanLane, reason: string, source: WeeklyPlanItem["source"], options?: { laneCap?: number }) => boolean;
  used: (key: string) => boolean;
  /** Items already in a lane. */
  laneItems: (lane: PlanLane) => number;
  /** Records that `dependentKey` needs `prereqKey` first (both already taken). */
  dependOn: (dependentKey: string, prereqKey: string) => void;
}

/** Unfinished lessons of each assigned course, in course order, by course. */
function byCourse(pool: readonly Candidate[], keep: (c: Candidate) => boolean): Candidate[][] {
  const groups = new Map<string, Candidate[]>();
  for (const c of pool) {
    if (!c.courseId || !keep(c)) continue;
    groups.set(c.courseId, [...(groups.get(c.courseId) ?? []), c]);
  }
  const rank = (c: Candidate) => (c.required ? 0 : 1) * 10 + ["most_important", "important", "nice_to_have"].indexOf(c.assignedPriority ?? "nice_to_have");
  return [...groups.values()].map((list) => [...list].sort((a, b) => a.order - b.order)).sort((a, b) => rank(a[0]!) - rank(b[0]!) || a[0]!.order - b[0]!.order);
}

/**
 * Takes a course's next lessons in order into `lane`, its prerequisites first. Stops at the first
 * lesson that does not fit, so nothing is ever done out of order.
 */
function takeInOrder(pool: readonly Candidate[], lessons: readonly Candidate[], lane: PlanLane, reason: string, limit: number, api: WeekRulesApi, laneCap?: number, itemCap = Infinity): number {
  const byKey = new Map(pool.map((c) => [c.key, c] as const));
  let taken = 0;
  let prereqsDone = false;
  for (const lesson of lessons) {
    if (taken >= limit || api.laneItems(lane) >= itemCap) break;
    if (api.used(lesson.key)) continue;
    const needs: string[] = [];
    if (!prereqsDone) {
      prereqsDone = true;
      for (const key of lesson.prereqKeys ?? []) {
        const prereq = byKey.get(key);
        if (!prereq || prereq.done) continue;
        if (api.used(key)) {
          needs.push(key);
          continue;
        }
        const short = prereq.minutes <= MUST_KNOW_MINUTES.max;
        const placed = short ? api.take(prereq, "must_know", `Needed before ${lesson.title}`, "prerequisite", { laneCap: api.mustKnowCap }) : api.take(prereq, lane, `Needed before ${lesson.title}`, "prerequisite", { laneCap });
        if (placed) needs.push(key);
        // A prerequisite that fits nowhere this week holds the course back: it comes first.
        else return taken;
      }
    }
    if (!api.take(lesson, lane, reason, "admin_priority", { laneCap })) break;
    for (const key of needs) api.dependOn(lesson.key, key);
    taken += 1;
  }
  return taken;
}

/** Before the path: required courses in the first weeks, then Most important ones. */
export function assignedFirst(pool: readonly Candidate[], api: WeekRulesApi): void {
  const early = api.weekNumber <= REQUIRED_WEEKS;
  for (const lessons of byCourse(pool, (c) => (early && c.required === true) || c.assignedPriority === "most_important")) {
    const first = lessons[0]!;
    const required = early && first.required === true;
    const reason = assignmentReason(first, early);
    if (required) takeInOrder(pool, lessons, "do_now", reason, Infinity, api, api.doNowCap);
    else takeInOrder(pool, lessons, "do_now", reason, PER_COURSE.most_important, api, api.doNowCap, DO_NOW_TARGET_ITEMS.max);
  }
}

/** After the path: Important → Medium, Nice to have → Low. */
export function assignedRest(pool: readonly Candidate[], api: WeekRulesApi): void {
  const early = api.weekNumber <= REQUIRED_WEEKS;
  for (const lessons of byCourse(pool, (c) => c.assignedPriority === "important" || c.assignedPriority === "nice_to_have")) {
    const first = lessons[0]!;
    if (early && first.required) continue;
    const priority = first.assignedPriority!;
    takeInOrder(pool, lessons, PRIORITY_LANE[priority], assignmentReason(first, early), PER_COURSE[priority], api);
  }
}
