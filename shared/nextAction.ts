import type { AssessmentStatus, UserStatus } from "./enums";
import type { PathStatus } from "./builder";

/**
 * v4.3 Phase 6: the learner page's top bar. One status line, the next thing the admin should do, and
 * at most one primary button for it.
 *
 * Pure: the server gathers the facts from the database (`GET /api/admin/users/:userId/next-action`)
 * and this decides. The rules run in order and the first match wins, so the order *is* the policy:
 * an account that cannot sign in comes before everything, the assessment before the path, and goal
 * suggestions before a rebuild (adding a goal changes the path, so rebuilding first would be wasted).
 */

export interface NextActionFacts {
  role: "learner" | "admin" | "superadmin";
  status: UserStatus;
  /** Never signed in with their own password yet. */
  mustChangePassword: boolean;
  /** At least one active goal or skill priority. */
  hasGoals: boolean;
  /** The latest assessment (highest attempt). */
  assessment: { status: AssessmentStatus } | null;
  /** When the latest evaluation was written, if any. */
  evaluationAt: number | null;
  /** The current learning path. `createdAt` is when the build started, i.e. when it read its inputs. */
  path: { status: PathStatus; createdAt: number; needsReview: number } | null;
  /** The latest change to the setup or an active goal (`learner_priorities` / `learner_goals`). */
  setupChangedAt: number | null;
  /** The latest admin edit to the skill graph (seeded edges do not count). */
  graphChangedAt: number | null;
  openSuggestions: number;
  /** The active week, if one exists. Dates are `yyyy-mm-dd`. */
  week: { weekNumber: number; endDate: string } | null;
  /** `yyyy-mm-dd`, UTC. Passed in so the function stays pure. */
  today: string;
  /** v4.4 P6: the learner's display name, for the status line ("waiting for Rahul"). */
  name?: string;
  /** v4.4 P6: spoken answers on the latest test that no machine could mark (they need a person). */
  speakToListen?: number;
  /** v4.4 P6: the learner's "please check this again" requests still open. */
  openReviews?: number;
  /** v4.4 P6: new courses being made for this learner, and those waiting for setup (and why). */
  courses?: { creating: number; waitingSetup: number; problem: string | null };
}

/** What the primary button does. The page maps each to an existing API call or tab. */
export type NextActionButton =
  | { action: "enable"; label: string }
  | { action: "assign"; label: string }
  | { action: "invite"; label: string }
  | { action: "build"; label: string }
  | { action: "week"; label: string }
  | { action: "advance-week"; label: string }
  /** v4.4 P6: go to another admin page (e.g. connect the web search). */
  | { action: "link"; label: string; to: string }
  | { action: "open"; label: string; tab: "setup" | "assessment" | "path"; anchor?: string };

export type NextActionTone = "todo" | "waiting" | "done" | "blocked";

export interface NextAction {
  /** Stable id for tests and the e2e scripts. */
  kind:
    | "staff"
    | "enable"
    | "set-goals"
    | "assign"
    | "writing"
    | "approve"
    | "reassign"
    | "invite"
    | "waiting"
    | "taking"
    | "evaluating"
    | "review-evaluation"
    | "build"
    | "build-failed"
    | "review-courses"
    | "suggestions"
    | "rebuild"
    | "publish-week"
    | "next-week"
    | "on-track"
    | "listen"
    | "reviews"
    | "courses-creating"
    | "courses-waiting";
  /** One line: the state and what comes next. */
  title: string;
  tone: NextActionTone;
  button: NextActionButton | null;
}

const BUSY: readonly PathStatus[] = ["analysing", "researching", "writing", "reviewing"];

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Where an admin connects the AI and the web search (both are on the AI settings page). */
export const CONNECT_SETUP_ROUTE = "/admin/ai";
/** About how long one new course takes to make, for the status line. */
export const MINUTES_PER_NEW_COURSE = 3;

/** Why the path is out of date, or null when it is not. Exported for the tests. */
export function staleReason(facts: Pick<NextActionFacts, "path" | "setupChangedAt" | "graphChangedAt" | "evaluationAt">): string | null {
  const path = facts.path;
  if (!path) return null;
  if (facts.evaluationAt !== null && facts.evaluationAt > path.createdAt) return "a newer evaluation";
  if (facts.setupChangedAt !== null && facts.setupChangedAt > path.createdAt) return "their goals changed";
  if (facts.graphChangedAt !== null && facts.graphChangedAt > path.createdAt) return "the skill graph changed";
  return null;
}

export function nextAction(facts: NextActionFacts): NextAction {
  if (facts.role !== "learner") return { kind: "staff", title: "Staff account: nothing to assign.", tone: "done", button: null };
  const who = facts.name?.trim().split(/\s+/)[0] || "them";

  if (facts.status !== "active") {
    return {
      kind: "enable",
      title: facts.status === "archived" ? "Archived. They cannot sign in." : "Disabled. They cannot sign in.",
      tone: "blocked",
      button: { action: "enable", label: facts.status === "archived" ? "Restore account" : "Enable account" },
    };
  }

  if (!facts.hasGoals) {
    return {
      kind: "set-goals",
      title: "No goals yet. Say what they should be able to do.",
      tone: "todo",
      button: { action: "open", label: "Set goals", tab: "setup" },
    };
  }

  const assessment = facts.assessment;
  if (!assessment) {
    return { kind: "assign", title: "Plan ready · send the test", tone: "todo", button: { action: "assign", label: "Send the test" } };
  }

  switch (assessment.status) {
    case "generating":
      return { kind: "writing", title: "Writing the test · about a minute", tone: "waiting", button: null };
    case "awaiting_approval":
      return {
        kind: "approve",
        title: "Test written · check it before it goes out",
        tone: "todo",
        button: { action: "open", label: "Check the test", tab: "assessment" },
      };
    case "failed":
    case "terminated":
      return {
        kind: "reassign",
        title: assessment.status === "failed" ? "We couldn't make the test. Send a new one." : "The test ended early. Send a new one.",
        tone: "todo",
        button: { action: "assign", label: "Send a new test" },
      };
    case "ready":
      return facts.mustChangePassword
        ? { kind: "invite", title: `Test sent · waiting for ${who} to sign in`, tone: "waiting", button: { action: "invite", label: "New invite" } }
        : { kind: "waiting", title: `Test sent · waiting for ${who}`, tone: "waiting", button: null };
    case "in_progress":
      return { kind: "taking", title: "Taking the test now", tone: "waiting", button: null };
    case "submitted":
    case "evaluating":
      if (facts.speakToListen) return listen(facts.speakToListen);
      return { kind: "evaluating", title: "Test done · marking the answers", tone: "waiting", button: null };
    case "completed":
      break;
  }

  // v4.4 P6: answers waiting for a person come before the path, which reads their marks.
  if (facts.speakToListen) return listen(facts.speakToListen);
  if (facts.openReviews) {
    return {
      kind: "reviews",
      title: `${who === "them" ? "They" : who} asked us to check ${plural(facts.openReviews, "answer")} again`,
      tone: "todo",
      button: { action: "open", label: "Check the answers", tab: "assessment", anchor: "review-requests" },
    };
  }

  const path = facts.path;
  if (!path) {
    return { kind: "build", title: "Test done · plan ready", tone: "todo", button: { action: "build", label: "Build the path" } };
  }
  if (BUSY.includes(path.status)) {
    return {
      kind: "review-evaluation",
      title: "Test done · building the path",
      tone: "todo",
      button: { action: "open", label: "See the results", tab: "assessment" },
    };
  }
  if (path.status === "failed" || path.status === "budget_reached") {
    return {
      kind: "build-failed",
      title: path.status === "failed" ? "The path build failed." : "The path build stopped at its budget.",
      tone: "blocked",
      button: { action: "build", label: "Rebuild path" },
    };
  }

  // v4.4 P6: missing courses are being made, or wait for the AI or the web search to be connected.
  const courses = facts.courses;
  if (courses && courses.waitingSetup > 0) {
    const what = courses.problem ?? "the setup isn't finished";
    return {
      kind: "courses-waiting",
      title: `${plural(courses.waitingSetup, "new course")} waiting: ${what}. We'll finish them on our own after.`,
      tone: "blocked",
      button: { action: "link", label: "Connect it", to: CONNECT_SETUP_ROUTE },
    };
  }
  if (courses && courses.creating > 0) {
    return {
      kind: "courses-creating",
      title: `${plural(courses.creating, "new course")} being created (about ${courses.creating * MINUTES_PER_NEW_COURSE} min)`,
      tone: "waiting",
      button: null,
    };
  }

  if (facts.openSuggestions > 0) {
    return {
      kind: "suggestions",
      title: `Review ${plural(facts.openSuggestions, "suggested goal")}.`,
      tone: "todo",
      button: { action: "open", label: "Review suggestions", tab: "setup", anchor: "suggested-next-heading" },
    };
  }

  const stale = staleReason(facts);
  if (stale) {
    return { kind: "rebuild", title: `The path needs a rebuild: ${stale}.`, tone: "todo", button: { action: "build", label: "Rebuild the path" } };
  }

  if (path.needsReview > 0) {
    return {
      kind: "review-courses",
      title: `${plural(path.needsReview, "generated course")} ${path.needsReview === 1 ? "needs" : "need"} review before they can open ${path.needsReview === 1 ? "it" : "them"}.`,
      tone: "todo",
      button: { action: "open", label: "Review courses", tab: "path" },
    };
  }

  if (!facts.week) {
    return { kind: "publish-week", title: "Path ready. Publish this week's plan.", tone: "todo", button: { action: "week", label: "Publish week" } };
  }

  if (facts.week.endDate < facts.today) {
    return {
      kind: "next-week",
      title: `Week ${facts.week.weekNumber} has ended.`,
      tone: "todo",
      button: { action: "advance-week", label: "Start next week" },
    };
  }

  return { kind: "on-track", title: `On track. Week ${facts.week.weekNumber} in progress.`, tone: "done", button: null };
}

function listen(n: number): NextAction {
  return {
    kind: "listen",
    title: `Needs a listen: ${plural(n, "spoken answer")}`,
    tone: "todo",
    button: { action: "open", label: "Listen and mark", tab: "assessment", anchor: "needs-listen" },
  };
}
