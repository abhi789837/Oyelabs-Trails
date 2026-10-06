import { halveXp } from "../../../../shared/lesson";
import { stepRef, xpFor, type XpKind } from "../../../../shared/xp";
import { schema, type Db } from "../../db";
import { newId, now } from "../../lib/ids";
import { awardXpSafely } from "../xp/repo";

/**
 * The lesson player's XP calls, in one place (docs/v5/DECISIONS.md, Phase 3).
 *
 * Everything goes through the Today agent's `awardXp` (idempotent on user + kind + ref), except one
 * case it doesn't support yet: a Do step finished after the learner traded XP to see the solution
 * early earns half. Until `awardXp` takes an amount, that one award is written here with the same
 * idempotency rule (insert, do nothing on conflict) and the same kind and ref, so a later full award
 * of the same step can never be added on top.
 */
export interface LessonAward {
  kind: XpKind;
  xp: number;
}

export function awardStep(db: Db, userId: string, topicId: string, step: "watch" | "read" | "do" | "check", options: { halved?: boolean } = {}): LessonAward | null {
  const refId = stepRef(topicId, step);
  if (options.halved) {
    const xp = halveXp(xpFor("step_completed"));
    try {
      const res = db
        .insert(schema.xpEvents)
        .values({ id: newId(), userId, kind: "step_completed", refId, xp, createdAt: now() })
        .onConflictDoNothing()
        .run();
      return res.changes > 0 ? { kind: "step_completed", xp } : null;
    } catch {
      return null;
    }
  }
  const res = awardXpSafely(db, userId, "step_completed", refId);
  return res.awarded ? { kind: "step_completed", xp: res.xp } : null;
}

export function awardLessonComplete(db: Db, userId: string, topicId: string): LessonAward | null {
  const res = awardXpSafely(db, userId, "lesson_completed", topicId);
  return res.awarded ? { kind: "lesson_completed", xp: res.xp } : null;
}

export function awardQuickCheck(db: Db, userId: string, topicId: string): LessonAward | null {
  const res = awardXpSafely(db, userId, "quick_check_passed", topicId);
  return res.awarded ? { kind: "quick_check_passed", xp: res.xp } : null;
}
