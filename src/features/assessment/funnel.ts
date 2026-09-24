import type { MyAssessment } from "@shared/assessment";
import type { AssessmentStatus, Role } from "@shared/enums";

/**
 * What a pending placement assessment should say, wherever the learner is standing.
 *
 * Pure on purpose. The funnel used to be decided inside `PlanPage`, which meant a learner who
 * already had a plan — and so never opened `/plan` — could work through their trail for days
 * without ever being told an assessment was waiting that decides what they get assigned. The
 * decision now lives here, is rendered by the shell on every learner route, and is testable
 * without a DOM.
 */

/**
 * The statuses that mean this person is mid-funnel: something has been issued to them and their
 * plan is not settled until it is finished. `/plan` gates on exactly this set, so it is shared
 * rather than written out twice.
 */
export const PENDING_ASSESSMENT_STATUSES = [
  "generating",
  "awaiting_approval",
  "ready",
  "in_progress",
  "submitted",
  "evaluating",
] as const satisfies readonly AssessmentStatus[];

/**
 * The subset of those that the *server* moves on its own, with nothing for the learner to do.
 * Worth re-checking on a timer: "being prepared" should become "waiting for you" without a
 * reload. `ready` and `in_progress` only change when the learner acts, so they are not here.
 */
export const TRANSIENT_ASSESSMENT_STATUSES = [
  "generating",
  "awaiting_approval",
  "submitted",
  "evaluating",
] as const satisfies readonly AssessmentStatus[];

export function isPendingAssessment(assessment: { status: AssessmentStatus } | null | undefined): boolean {
  if (!assessment) return false;
  return (PENDING_ASSESSMENT_STATUSES as readonly AssessmentStatus[]).includes(assessment.status);
}

export function isTransientAssessment(assessment: { status: AssessmentStatus } | null | undefined): boolean {
  if (!assessment) return false;
  return (TRANSIENT_ASSESSMENT_STATUSES as readonly AssessmentStatus[]).includes(assessment.status);
}

/**
 * `urgent` — a clock is already running on them.
 * `waiting` — a waypoint they have to cross before the trail continues.
 * `quiet`  — we are working; they are only being kept informed.
 */
export type AssessmentBannerTone = "urgent" | "waiting" | "quiet";

export interface AssessmentBannerCopy {
  status: AssessmentStatus;
  tone: AssessmentBannerTone;
  title: string;
  body: string;
  /** Null would mean "nothing to click"; in practice every state offers at least a status link. */
  action: { label: string; to: string } | null;
  /**
   * `ready` and `in_progress` are a gate, not a notification, so they cannot be put away. The
   * states where the learner genuinely has nothing to do can be.
   */
  dismissible: boolean;
}

/** Enough of `MyAssessment` to write the copy; the whole object is accepted too. */
type Describable = Pick<MyAssessment, "status" | "timeLimitMinutes">;

/**
 * What the learner should be told, or null when there is nothing to say.
 *
 * Returns null for anyone who is not a learner: a superadmin is not in the funnel, and the one
 * they would see is whatever row happens to exist against their own account.
 *
 * `generating` and `awaiting_approval` deliberately read identically. Whether a human is still
 * reading the assessment or a deadline is quietly running out is not the learner's business, and
 * `AssessmentPage` already collapses the two into one waiting screen.
 */
export function describeAssessmentBanner(
  assessment: Describable | null | undefined,
  role: Role,
): AssessmentBannerCopy | null {
  if (role !== "learner") return null;
  if (!isPendingAssessment(assessment) || !assessment) return null;

  const minutes = assessment.timeLimitMinutes;

  switch (assessment.status) {
    case "ready":
      return {
        status: "ready",
        tone: "waiting",
        title: "Your placement assessment is waiting",
        body: `It decides what you get assigned. You get ${minutes} minutes, you are monitored throughout, and it cannot be paused once it begins — find a quiet hour before you start.`,
        action: { label: "Start the assessment", to: "/assessment" },
        dismissible: false,
      };

    case "in_progress":
      return {
        status: "in_progress",
        tone: "urgent",
        title: "Your placement assessment is still open",
        body: "You started it and have not submitted. The clock is still running, and the time you spend away from it counts against you.",
        action: { label: "Resume the assessment", to: "/assessment" },
        dismissible: false,
      };

    case "generating":
    case "awaiting_approval":
      return {
        status: assessment.status,
        tone: "quiet",
        title: "Your placement assessment is being prepared",
        body: "Nothing for you to do yet. It will appear here the moment it is ready, and it decides what you get assigned — so anything you work on before then may change.",
        action: { label: "Check progress", to: "/assessment" },
        dismissible: true,
      };

    case "submitted":
      return {
        status: "submitted",
        tone: "quiet",
        title: "Your assessment is in for marking",
        body: "You have submitted it. Your plan is built from the result, so it will change once marking is done.",
        action: { label: "Check progress", to: "/assessment" },
        dismissible: true,
      };

    case "evaluating":
      return {
        status: "evaluating",
        tone: "quiet",
        title: "Your assessment is being marked",
        body: "Marking is under way. Your plan is built from the result, so it will change when it finishes.",
        action: { label: "Check progress", to: "/assessment" },
        dismissible: true,
      };

    default:
      return null;
  }
}
