import { and, desc, eq } from "drizzle-orm";

import type { V4Result } from "../../../shared/assessmentV4";
import type { PathCoverage } from "../../../shared/pathView";
import { schema, type Db } from "../db";

/**
 * v4.5 P0: what the latest test measured per skill, and which goals came after it, so a path row
 * never says "not assessed": a goal is either measured, still being marked, or added after the test.
 */
export function pathCoverage(db: Db, userId: string): PathCoverage {
  const assessment = db
    .select({ id: schema.assessments.id, createdAt: schema.assessments.createdAt })
    .from(schema.assessments)
    .where(eq(schema.assessments.userId, userId))
    .orderBy(desc(schema.assessments.attemptNo))
    .get();
  if (!assessment) return { assessedAt: null, levels: {}, addedAfterTest: [] };

  const evaluation = db
    .select({ result: schema.evaluations.result })
    .from(schema.evaluations)
    .where(eq(schema.evaluations.assessmentId, assessment.id))
    .orderBy(desc(schema.evaluations.createdAt))
    .get();
  const levels: Record<string, number | null> = {};
  const result = evaluation?.result as Partial<V4Result> | undefined;
  for (const skill of result?.skills ?? []) {
    if (skill.asked > 0) levels[skill.skillId] = skill.level;
  }

  // A skill counts as added after the test when every active goal that asks for it is newer.
  const goals = db
    .select({ skillIds: schema.learnerGoals.skillIds, createdAt: schema.learnerGoals.createdAt })
    .from(schema.learnerGoals)
    .where(and(eq(schema.learnerGoals.userId, userId), eq(schema.learnerGoals.status, "active")))
    .all();
  const oldest = new Map<string, number>();
  for (const goal of goals) {
    for (const skillId of goal.skillIds) oldest.set(skillId, Math.min(oldest.get(skillId) ?? Infinity, goal.createdAt));
  }
  const addedAfterTest = [...oldest].filter(([skillId, at]) => at > assessment.createdAt && !(skillId in levels)).map(([skillId]) => skillId);
  return { assessedAt: assessment.createdAt, levels, addedAfterTest };
}
