import type { LearnerPriorities } from "../../../../shared/builder";
import {
  LANE_KEYS,
  LANE_ORDER,
  MUST_KNOW_MINUTES,
  budgetCeiling,
  clampSummary,
  doNowCeiling,
  draftMinutes,
  itemKey,
  laneMinutes,
  type PlanLane,
  type WeeklyPlanDraft,
  type WeeklyPlanItem,
  type WeeklyPlanLanes,
} from "../../../../shared/weeklyPlan";
import { isSkipped } from "./matching";
import type { Candidate } from "./types";

/**
 * The rules, applied in code rather than asked for in a prompt.
 *
 * Both halves of this system produce drafts — the deterministic builder and the model — and both are
 * run through this. That is the point. The builder is careful and the prompt is explicit, but a
 * prompt is a request and neither is a guarantee: the model will occasionally put the same lesson in
 * two lanes, invent a duration, schedule something the learner cannot open, or write ninety words
 * when it was asked for sixty. Each of those is repaired here, in the order that does least damage.
 *
 * Nothing here rejects a draft. A week with one illegal item should lose the item, not the week.
 */

export interface EnforceInput {
  draft: WeeklyPlanDraft;
  candidates: readonly Candidate[];
  priorities: LearnerPriorities;
  /** Carried-over and admin-pinned keys. Trimmed last, and exempt from the red-lane share. */
  protectedKeys?: readonly string[];
}

export interface EnforceResult {
  draft: WeeklyPlanDraft;
  /** What had to be changed. Logged, and asserted on in tests. */
  adjustments: string[];
}

export function enforce({ draft, candidates, priorities, protectedKeys = [] }: EnforceInput): EnforceResult {
  const adjustments: string[] = [];
  const byKey = new Map(candidates.map((c) => [c.key, c] as const));
  const shielded = new Set(protectedKeys);

  const lanes: WeeklyPlanLanes = { doNow: [], mustKnow: [], medium: [], low: [] };
  const seen = new Set<string>();

  // --- Only real, unlocked, unfinished, un-skipped lessons -----------------
  /* Lane order decides which copy of a duplicate survives, so a lesson the model listed twice stays
     in the more urgent of the two lanes rather than whichever it happened to write first. */
  for (const lane of LANE_ORDER) {
    for (const item of draft.lanes[LANE_KEYS[lane]]) {
      const key = itemKey(item);
      const candidate = byKey.get(key);

      if (!candidate) {
        adjustments.push(`dropped ${key || "an item with no id"}: not in this learner's unlocked set`);
        continue;
      }
      if (candidate.done) {
        adjustments.push(`dropped ${key}: already completed`);
        continue;
      }
      if (isSkipped(candidate, priorities.skip)) {
        adjustments.push(`dropped ${key}: on the skip list`);
        continue;
      }
      if (seen.has(key)) {
        adjustments.push(`dropped the duplicate of ${key} in ${lane}`);
        continue;
      }
      seen.add(key);

      /* The duration is the library's, never the draft's. A model that guesses 10 minutes for a
         90-minute topic does not shorten the topic — it breaks the one number the whole page is
         built on. */
      if (item.minutes !== candidate.minutes) {
        adjustments.push(`corrected ${key} to ${candidate.minutes} min (draft said ${item.minutes})`);
      }

      /* A long lesson is not a checklist item. It is still needed, so it moves to Medium rather than
         being dropped — Must know exists to be short enough to clear before real work starts. */
      let placed: PlanLane = lane;
      if (lane === "must_know" && candidate.minutes > MUST_KNOW_MINUTES.max) {
        placed = "medium";
        adjustments.push(`moved ${key} out of Must know: ${candidate.minutes} min is over the ${MUST_KNOW_MINUTES.max} min limit`);
      }

      lanes[LANE_KEYS[placed]].push({ ...item, minutes: candidate.minutes, topicId: candidate.topicId, courseId: candidate.courseId, lessonId: candidate.lessonId });
    }
  }

  // --- The admin's High must-haves come before anything else ---------------
  /* Within each lane, an item that is there because a person said so sorts above one that is there
     because a model inferred it. Stable, so the order the builder chose survives within each group. */
  for (const lane of LANE_ORDER) {
    const rank = (item: WeeklyPlanItem) => (item.source === "admin_priority" ? 0 : item.source === "prerequisite" ? 1 : 2);
    lanes[LANE_KEYS[lane]] = stableSort(lanes[LANE_KEYS[lane]], (a, b) => rank(a) - rank(b));
  }

  // --- Do it now is at most half the week ---------------------------------
  /* "At most about half" — with one exception, and it matters. A single item is allowed to be the
     whole week. The cap exists so the red lane cannot crowd out the other three; when it holds one
     lesson there is nothing to crowd out, and demoting somebody's one genuinely blocking task to
     Medium because their week is short would invert the meaning of both lanes. */
  const doNowCap = doNowCeiling(draft.weeklyBudgetMinutes);
  while (laneMinutes(lanes.doNow) > doNowCap && lanes.doNow.length > 1) {
    const index = lastIndexWhere(lanes.doNow, (item) => !shielded.has(itemKey(item)));
    if (index === -1) break; // Everything left is carried or pinned. It stays; the budget trim follows.
    const [moved] = lanes.doNow.splice(index, 1);
    lanes.medium.unshift(moved);
    adjustments.push(`moved ${itemKey(moved)} from Do it now to Medium: the red lane was over ${doNowCap} min`);
  }

  // --- The total fits the budget, within 10% ------------------------------
  /* Trimmed from the bottom up: Low first, then Medium, then Must know, and only then the red lane —
     and within each, the items nobody explicitly asked for before the ones they did. */
  const ceiling = budgetCeiling(draft.weeklyBudgetMinutes);
  const trimOrder: PlanLane[] = ["low", "medium", "must_know", "do_now"];
  for (const lane of trimOrder) {
    while (draftMinutes(lanes) > ceiling && lanes[LANE_KEYS[lane]].length > 0) {
      const list = lanes[LANE_KEYS[lane]];
      const index = lastIndexWhere(list, (item) => !shielded.has(itemKey(item)));
      const target = index === -1 ? list.length - 1 : index;
      const [dropped] = list.splice(target, 1);
      adjustments.push(`dropped ${itemKey(dropped)} from ${lane}: over the ${ceiling} min ceiling`);
    }
    if (draftMinutes(lanes) <= ceiling) break;
  }

  // --- Dependencies point at Must know, or at nothing --------------------
  /* "Needs: …" is only meaningful if the thing it names is in the week. A reference to a lesson that
     was trimmed, or that the model invented, is removed rather than shown as a dead link. */
  const mustKnowKeys = new Set(lanes.mustKnow.map(itemKey));
  for (const lane of LANE_ORDER) {
    lanes[LANE_KEYS[lane]] = lanes[LANE_KEYS[lane]].map((item) => {
      const kept = item.dependsOn.filter((key) => mustKnowKeys.has(key) && key !== itemKey(item));
      if (kept.length !== item.dependsOn.length) {
        adjustments.push(`cleared ${item.dependsOn.length - kept.length} dangling dependency on ${itemKey(item)}`);
      }
      return { ...item, dependsOn: kept };
    });
  }

  // --- Sixty words -------------------------------------------------------
  const summary = clampSummary(draft.summary);
  if (summary !== draft.summary.trim().replace(/\s+/g, " ")) {
    adjustments.push("shortened the summary to the sixty-word cap");
  }

  return { draft: { ...draft, summary, lanes }, adjustments };
}

/** `Array.prototype.sort` is stable in every engine we target, but saying so is cheaper than trusting it. */
function stableSort<T>(list: readonly T[], compare: (a: T, b: T) => number): T[] {
  return list
    .map((value, index) => ({ value, index }))
    .sort((a, b) => compare(a.value, b.value) || a.index - b.index)
    .map((entry) => entry.value);
}

function lastIndexWhere<T>(list: readonly T[], predicate: (value: T) => boolean): number {
  for (let i = list.length - 1; i >= 0; i--) if (predicate(list[i])) return i;
  return -1;
}
