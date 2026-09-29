import { WEIGHT_VALUE, type LearnerPriorities, type ScoredGap, type SkillWeight } from "../../../../shared/builder";
import {
  DO_NOW_TARGET_ITEMS,
  LANE_KEYS,
  MUST_KNOW_MINUTES,
  SUMMARY_MAX_WORDS,
  clampSummary,
  doNowCeiling,
  laneMinutes,
  type PlanLane,
  type WeeklyPlanDraft,
  type WeeklyPlanItem,
  type WeeklyPlanLanes,
} from "../../../../shared/weeklyPlan";
import { isSkipped, matchesFor, skillsRelated } from "./matching";
import type { BuildWeekInput, Candidate } from "./types";

/**
 * Building one week.
 *
 * Pure: plain data in, a validated draft out, no model and no database. That matters because this
 * function decides what a person does for the next seven days, and a decision like that should be
 * arguable in a test rather than only observable in production.
 *
 * The order of operations *is* the policy, so it is worth reading in order:
 *
 * 1. **Carried-over work first.** An item the learner did not finish keeps its lane. Red stays red.
 * 2. **Then the admin, in their order.** High-weight must-haves fill Do it now, Medium fills
 *    Medium, Low fills Low. The admin's list is honoured as given — the AI never reorders it.
 * 3. **Then what the assessment found**, into Medium or Low by how badly it is missing.
 * 4. **Then prerequisites**, pulled *out* of trail order into Must know, because the lessons that
 *    unblock the red lane are the ones worth doing first even though nothing flagged them.
 * 5. **Then filler**, in trail order, until the budget is used.
 *
 * Every hard rule in the brief is applied by `enforce` afterwards, on this output and equally on a
 * model's. This function tries to produce a good week; `enforce` guarantees a legal one.
 */

/** Must know is a checklist. A quarter of the week is generous for one. */
const MUST_KNOW_SHARE = 0.25;
const MUST_KNOW_MAX_ITEMS = 6;

/** How many prerequisites one item may drag in. More than two stops being a prerequisite list. */
const PREREQS_PER_ITEM = 2;

/** How far back in a module to look for a prerequisite. Beyond this it is a different subject. */
const PREREQ_LOOKBACK = 6;

/** Titles offered as "coming up next week". */
const PREVIEW_SIZE = { min: 3, max: 5 } as const;

interface Selection {
  candidate: Candidate;
  lane: PlanLane;
  reason: string;
  source: WeeklyPlanItem["source"];
  dependsOn: string[];
  pinned: boolean;
}

/**
 * Which lane a gap's lessons belong in.
 *
 * The admin's weight decides it outright when they set one. A gap only the assessment found lands in
 * Medium when it is badly missed and Low when it is not — never in Do it now, because "the model
 * thinks this is urgent" is not the same claim as "the person who hired them says this is urgent",
 * and the red lane is for the second one.
 */
export function laneForGap(gap: ScoredGap): PlanLane {
  if (gap.source === "ai_detected") return gap.severity >= 0.6 ? "medium" : "low";
  if (gap.weight >= WEIGHT_VALUE.high) return "do_now";
  if (gap.weight >= WEIGHT_VALUE.medium) return "medium";
  return "low";
}

/**
 * The one-line "Why", built rather than generated.
 *
 * "Admin: DevOps · High · you missed 4 of 5 deployment questions" — the admin's decision and the
 * evidence for it, in the order that matters. Built from the stored evidence so it costs nothing and
 * cannot drift from what actually happened.
 */
export function whyLine(gap: ScoredGap, priorities: LearnerPriorities): string {
  /* Matched on the skill, not on "is this an admin gap". An earlier version short-circuited with
     `|| gap.source !== "ai_detected"`, which made `find` return the *first* must-have for every admin
     gap — so a week with Deployment (High) at the top labelled its Testing and GraphQL items "High"
     too, and the lane colours and the words disagreed on the same screen. */
  const listed = priorities.mustHave.find((entry) => skillsRelated(entry.skill, gap.skill));
  const parts: string[] = [];

  if (gap.source === "ai_detected") {
    parts.push("From your assessment");
  } else {
    const weight = listed?.weight ?? weightName(gap.weight);
    parts.push(`Admin: ${gap.skill}`, weight.charAt(0).toUpperCase() + weight.slice(1));
  }

  const { asked, missed } = gap.evidence;
  if (asked > 0) parts.push(`you missed ${missed} of ${asked} ${gap.skill.toLowerCase()} questions`);
  else if (gap.source !== "ai_detected") parts.push("not covered by the assessment");
  else parts.push(gap.evidence.summary);

  return parts.join(" · ").slice(0, 300);
}

/** The nearest weight name to a stored multiplier, for a gap whose must-have entry has been renamed. */
function weightName(weight: number): SkillWeight {
  if (weight >= WEIGHT_VALUE.high) return "high";
  if (weight >= WEIGHT_VALUE.medium) return "medium";
  return "low";
}

/** "Needed before Multi-Stage Builds" — what a Must-know item is doing there. */
function prerequisiteReason(dependentTitle: string): string {
  return `Needed before ${dependentTitle}`;
}

export function buildWeek(input: BuildWeekInput): WeeklyPlanDraft {
  const { budgetMinutes, priorities, gaps, carryOver, pinned } = input;

  const pool = input.candidates.filter((c) => !c.done && !isSkipped(c, priorities.skip));
  const byKey = new Map(pool.map((c) => [c.key, c] as const));

  const used = new Set<string>();
  const selections: Selection[] = [];
  const pinnedKeys = new Set(pinned);

  let spent = 0;
  const ceiling = budgetMinutes;
  const doNowCap = doNowCeiling(budgetMinutes);
  const mustKnowCap = Math.round(budgetMinutes * MUST_KNOW_SHARE);

  const laneSpend = (lane: PlanLane) =>
    selections.filter((s) => s.lane === lane).reduce((sum, s) => sum + s.candidate.minutes, 0);

  /** Adds one selection if it is new and there is room. Returns whether it went in. */
  const take = (
    candidate: Candidate,
    lane: PlanLane,
    reason: string,
    source: WeeklyPlanItem["source"],
    options: { ignoreBudget?: boolean; laneCap?: number; pinned?: boolean } = {},
  ): boolean => {
    if (used.has(candidate.key)) return false;
    if (!options.ignoreBudget && spent + candidate.minutes > ceiling) return false;
    if (options.laneCap !== undefined && laneSpend(lane) + candidate.minutes > options.laneCap) return false;

    used.add(candidate.key);
    selections.push({ candidate, lane, reason, source, dependsOn: [], pinned: options.pinned ?? false });
    spent += candidate.minutes;
    return true;
  };

  // --- 1. Carried over ------------------------------------------------------
  /* Unfinished work comes back before anything new is considered, and it keeps the lane it had.
     Demoting a red item because the week is now busier would quietly tell the learner it stopped
     mattering — and it is the same item that blocked them last week. */
  for (const carried of carryOver) {
    const candidate = byKey.get(carried.key);
    if (!candidate) continue;
    take(candidate, carried.pinned ? "do_now" : carried.lane, carried.reason, carried.source, {
      ignoreBudget: true,
      pinned: carried.pinned,
    });
  }

  // --- 2. Pinned by an admin ------------------------------------------------
  for (const key of pinnedKeys) {
    const candidate = byKey.get(key);
    if (!candidate) continue;
    take(candidate, "do_now", "Pinned by your administrator for this week", "admin_priority", {
      ignoreBudget: true,
      pinned: true,
    });
  }

  // --- 2b. Parts 1 and 2 of the learning path -------------------------------
  /* Before any detected gap. Part 1 strengthens the track they work in every day and Part 2 is
     building with AI in their own stack; everything else on the path is a specific gap that stands
     on those two. Putting them in the red lane is not a weighting — it is the order the path is in.

     Taken in path order and capped by the same red-lane share as anything else, so a long Part 1
     cannot swallow the whole week. What does not fit this week carries into the next one. */
  const pathLessons = pool
    .filter((c) => c.partNumber !== undefined && c.partNumber <= 2 && !used.has(c.key))
    .sort((a, b) => (a.partNumber ?? 0) - (b.partNumber ?? 0) || a.order - b.order);

  for (const candidate of pathLessons) {
    const reason =
      candidate.partType === "track"
        ? "Part 1 of your path: the ground your own track stands on"
        : "Part 2 of your path: building with AI in your stack";
    take(candidate, "do_now", reason, "admin_priority", { laneCap: doNowCap });
  }

  // --- 3. The admin's list, then the assessment's findings ------------------
  /* `gaps` arrives ordered by `sortGaps`: admin-listed before AI-detected, then by score. That
     order is followed exactly — it is the admin's decision, and re-sorting it here is precisely the
     thing they would be right to be annoyed by. */
  const actionable = gaps.filter((gap) => !gap.skipped);

  for (const gap of actionable) {
    const lane = laneForGap(gap);
    const reason = whyLine(gap, priorities);
    const matches = matchesFor(gap.skill, pool).filter((m) => !used.has(m.candidate.key));
    if (matches.length === 0) continue;

    /* How many lessons one gap may claim, and how large the red lane may get in total.
    
       Two per gap rather than four, with a hard cap of four items across the lane: with two High
       must-haves, a per-gap quota of four let the first one take the whole lane and the second get
       nothing, and the brief asks for two to four items *in the lane*. Two each means both of the
       admin's top priorities are actually represented in the week they were marked High for. */
    const perGap = lane === "do_now" ? 2 : lane === "medium" ? 3 : 2;
    const laneItemCap = lane === "do_now" ? DO_NOW_TARGET_ITEMS.max : Infinity;

    let taken = 0;
    for (const match of matches) {
      if (taken >= perGap) break;
      if (selections.filter((s) => s.lane === lane).length >= laneItemCap) break;
      if (take(match.candidate, lane, reason, gap.source === "ai_detected" ? "ai_gap" : "admin_priority", {
        laneCap: lane === "do_now" ? doNowCap : undefined,
      })) {
        taken += 1;
      }
    }
  }

  // --- 4. Prerequisites, into Must know ------------------------------------
  /* The one place trail order is deliberately broken. If the red lane says "async Express work" and
     the learner has not done "how promises are scheduled", the second is the useful thing to do on
     Monday morning even though nothing flagged it — so it is lifted out of its position in the trail
     and put in front. */
  const needsPrereqs = selections.filter((s) => s.lane === "do_now" || s.lane === "medium");
  for (const dependent of needsPrereqs) {
    const earlier = pool
      .filter(
        (c) =>
          c.groupId === dependent.candidate.groupId &&
          c.order < dependent.candidate.order &&
          dependent.candidate.order - c.order <= PREREQ_LOOKBACK &&
          c.minutes <= MUST_KNOW_MINUTES.max &&
          !used.has(c.key),
      )
      .sort((a, b) => b.order - a.order)
      .slice(0, PREREQS_PER_ITEM);

    for (const prereq of earlier) {
      if (selections.filter((s) => s.lane === "must_know").length >= MUST_KNOW_MAX_ITEMS) break;
      if (take(prereq, "must_know", prerequisiteReason(dependent.candidate.title), "prerequisite", { laneCap: mustKnowCap })) {
        dependent.dependsOn.push(prereq.key);
      }
    }
  }

  /* Nothing depended on anything — a learner whose red lane is the first thing in its module, or
     whose week is all course lessons. The role's own baseline is the honest fallback: the earliest
     short lessons in the trails their week already touches. */
  if (!selections.some((s) => s.lane === "must_know")) {
    const touched = new Set(selections.map((s) => s.candidate.groupId));
    const baseline = pool
      .filter(
        (c) =>
          !used.has(c.key) &&
          c.minutes <= MUST_KNOW_MINUTES.max &&
          (c.level === null || c.level === "beginner" || c.level === "intermediate") &&
          (touched.size === 0 || touched.has(c.groupId)),
      )
      .sort((a, b) => a.order - b.order)
      .slice(0, 3);
    for (const candidate of baseline) {
      take(candidate, "must_know", "Baseline knowledge for your role", "prerequisite", { laneCap: mustKnowCap });
    }
  }

  // --- 5. Filler, in trail order -------------------------------------------
  /* Whatever is left of the budget goes to the next lessons on the trail, in the low lane where the
     learner is free to skip them. Filling the red lane with "the next thing in the list" would be
     dishonest about what red means. */
  for (const candidate of [...pool].sort((a, b) => a.order - b.order)) {
    if (spent >= ceiling) break;
    take(candidate, "low", "Next on your trail, if the week goes well", "ai_gap");
  }

  // --- 6. Shape it ---------------------------------------------------------
  const lanes = toLanes(selections);
  const preview = previewTitles(pool, used);

  return {
    weekNumber: input.weekNumber,
    startDate: input.startDate,
    endDate: input.endDate,
    summary: templateSummary(input, lanes),
    weeklyBudgetMinutes: budgetMinutes,
    lanes,
    nextWeekPreview: preview,
    roadmapNarrative: "",
  };
}

/** Selections grouped into the four lanes, each in the order they were chosen. */
function toLanes(selections: readonly Selection[]): WeeklyPlanLanes {
  const lanes: WeeklyPlanLanes = { doNow: [], mustKnow: [], medium: [], low: [] };
  for (const selection of selections) {
    lanes[LANE_KEYS[selection.lane]].push({
      topicId: selection.candidate.topicId,
      courseId: selection.candidate.courseId,
      lessonId: selection.candidate.lessonId,
      minutes: selection.candidate.minutes,
      reason: selection.reason,
      source: selection.source,
      dependsOn: selection.dependsOn,
    });
  }
  return lanes;
}

function previewTitles(pool: readonly Candidate[], used: ReadonlySet<string>): string[] {
  return [...pool]
    .filter((c) => !used.has(c.key))
    .sort((a, b) => a.order - b.order)
    .slice(0, PREVIEW_SIZE.max)
    .map((c) => c.title);
}

/**
 * The three sentences, without a model.
 *
 * Templated on purpose. The AI writes a better one when it is configured, but this page must render
 * a useful week on a server with no credential at all — and a plan whose summary is missing reads as
 * broken in a way a plainly-worded one does not.
 */
export function templateSummary(input: BuildWeekInput, lanes: WeeklyPlanLanes): string {
  const red = lanes.doNow.length;
  const total = lanes.doNow.length + lanes.mustKnow.length + lanes.medium.length + lanes.low.length;
  const hours = Math.round((laneMinutes(lanes.doNow) + laneMinutes(lanes.mustKnow) + laneMinutes(lanes.medium) + laneMinutes(lanes.low)) / 60);

  const strong = input.strengths.slice(0, 2).join(" and ");
  const first = strong ? `You are already solid on ${strong}.` : "This is your first week on the trail.";

  const focus = input.gaps.filter((g) => !g.skipped).slice(0, 2).map((g) => g.skill.toLowerCase());
  const second = focus.length
    ? `This week is about ${focus.join(" and ")} — ${red || "a few"} thing${red === 1 ? "" : "s"} to clear first, then the rest as time allows.`
    : `This week is ${total} short lessons, in the order we suggest.`;

  const third = `By Sunday you should have ${total} lesson${total === 1 ? "" : "s"} and about ${hours} hour${hours === 1 ? "" : "s"} behind you.`;

  return clampSummary(`${first} ${second} ${third}`, SUMMARY_MAX_WORDS);
}
