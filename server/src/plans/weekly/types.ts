import type { ScoredGap } from "../../../../shared/builder";
import type { LearnerPriorities, PartType } from "../../../../shared/builder";
import type { PlanLane, PlanItemSource } from "../../../../shared/weeklyPlan";
import type { TopicLevelValue } from "../../../../shared/enums";

/**
 * What the weekly builder works from.
 *
 * Deliberately not a database row anywhere in here. The builder decides what a person spends the
 * next week learning, which makes it the part most worth being able to argue with in a test — so it
 * takes plain data, returns plain data, and never knows whether a candidate came from the
 * curriculum, a hand-written course or a generated one.
 */

/** One lesson the learner could be given this week. Both kinds of lesson reduce to this. */
export interface Candidate {
  /** Stable identity within a week: the topic id, or the course lesson id. */
  key: string;
  topicId: string | null;
  courseId: string | null;
  lessonId: string | null;
  title: string;
  /** "JavaScript Core · Frontend", or the course title. Shown under the title. */
  context: string;
  /**
   * Lowercased text a skill is matched against: the title, its module and track, and the course
   * name where there is one. Built by the caller so the matcher stays pure text work.
   */
  haystack: string;
  /** Null for a course lesson, which has no curriculum level. */
  level: TopicLevelValue | null;
  minutes: number;
  /** Curriculum trail order. Earlier means more foundational — this is what finds prerequisites. */
  order: number;
  /** Module id, or course id. Prerequisites are only looked for within one group. */
  groupId: string;
  /** Already finished. Kept in the list so "what is left in this module" stays answerable. */
  done: boolean;
  /** Where the learner goes to do it. */
  href: string;
  /**
   * The part of the learning path this lesson's course belongs to, if any.
   *
   * Parts 1 and 2 — strengthen your track, and building with AI for your stack — are the ground the
   * rest stands on, so they fill week one's red lane before any detected gap is considered. Null for
   * a curriculum topic, and for a course that is not on the path.
   */
  partNumber?: number;
  partType?: PartType;
  /**
   * v4.3: where its path item sits on the path (`path_items.position`), so the week can follow the
   * path order exactly, and the skill that item serves (`path_items.target_skill`). A missing-link
   * refresher (`partType` "prerequisite") names the skill it unblocks there.
   */
  pathPosition?: number;
  pathTarget?: string | null;
}

/** An item the previous week did not finish. */
export interface CarriedItem {
  key: string;
  lane: PlanLane;
  reason: string;
  source: PlanItemSource;
  /** The week it first appeared in, so a third carry is distinguishable from a first. */
  carriedFrom: string;
  skipCount: number;
  pinned: boolean;
}

export interface BuildWeekInput {
  weekNumber: number;
  startDate: string;
  endDate: string;
  /** `hoursPerWeek * 60`. The week fits inside this, within `BUDGET_TOLERANCE`. */
  budgetMinutes: number;
  priorities: LearnerPriorities;
  /** Ordered by `sortGaps`: admin-listed first, then by score. The order is honoured as given. */
  gaps: ScoredGap[];
  candidates: Candidate[];
  carryOver: CarriedItem[];
  /** Item keys an admin pinned to Do it now. Survive regeneration. */
  pinned: string[];
  /** What the learner is already good at, for the first sentence of the summary. */
  strengths: string[];
}
