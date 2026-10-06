import type { Db } from "../../db";
import { awardXp } from "../xp/repo";

/**
 * The "review session" XP (20 XP for a session of at least 5 cards, docs/v5/PLAN.md), through the
 * Today group's `awardXp`. The ref is the session id, so the unique (user_id, kind, ref_id) index
 * makes a retried rating, or the 6th card of the same session, pay nothing more.
 */
export function awardReviewSessionXp(db: Db, userId: string, sessionId: string, at: number): boolean {
  return awardXp(db, userId, "review_session", sessionId, { at }).awarded;
}
