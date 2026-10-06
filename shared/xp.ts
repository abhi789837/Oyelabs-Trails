/**
 * v5 XP (docs/v5/PLAN.md, "XP rules"). One table, used by the server to award and by the client
 * to explain. Every award is a row in `xp_events`, unique on (user, kind, ref), so awarding the
 * same thing twice gives nothing the second time.
 */

export const XP_KINDS = [
  "step_completed",
  "quick_check_passed",
  "lesson_completed",
  "topic_test_passed",
  "review_session",
  "case_passed",
  "skill_level_up",
  "certificate",
] as const;
export type XpKind = (typeof XP_KINDS)[number];

export const XP_TABLE: Record<XpKind, number> = {
  step_completed: 10,
  quick_check_passed: 15,
  lesson_completed: 30,
  topic_test_passed: 50,
  review_session: 20,
  case_passed: 150,
  skill_level_up: 75,
  certificate: 200,
};

/** Plain words for a learner: "Practical case passed". */
export const XP_LABELS: Record<XpKind, string> = {
  step_completed: "Step done",
  quick_check_passed: "Quick check passed",
  lesson_completed: "Lesson finished",
  topic_test_passed: "Topic test passed",
  review_session: "Review session",
  case_passed: "Practical case passed",
  skill_level_up: "Skill level up",
  certificate: "Certificate earned",
};

/** A review session earns XP only with at least this many cards. */
export const REVIEW_SESSION_MIN_CARDS = 5;

/** The kinds that count as "Recent wins" on Today: real milestones, not every step. */
export const WIN_KINDS = ["case_passed", "skill_level_up", "certificate"] as const satisfies readonly XpKind[];
export type WinKind = (typeof WIN_KINDS)[number];

export function isXpKind(value: string): value is XpKind {
  return (XP_KINDS as readonly string[]).includes(value);
}

export function xpFor(kind: XpKind): number {
  return XP_TABLE[kind];
}

// Ref ids. One shape per kind, so two callers can't award the same thing under two names.

/** A lesson step: "<topicId>:<step>". */
export const stepRef = (topicId: string, step: "watch" | "read" | "do" | "check") => `${topicId}:${step}`;
/** A skill reaching a level: "<skillId>:<level>". Each level is awarded once. */
export const levelUpRef = (skillId: string, level: number) => `${skillId}:${Math.round(level)}`;
/** A review session: "<yyyy-mm-dd>" (one award per day) or the session id the caller has. */
export const reviewSessionRef = (dayOrSessionId: string) => dayOrSessionId;

export interface XpEventView {
  kind: XpKind;
  refId: string;
  xp: number;
  createdAt: number;
  label: string;
}

/** `GET /api/v5/me/xp`. */
export interface MyXpResponse {
  total: number;
  /** XP earned in the current ISO week (UTC, Monday to Sunday). */
  thisWeek: number;
  /** Newest first, at most 10. */
  recent: XpEventView[];
}
