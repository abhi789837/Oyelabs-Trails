import { desc, eq, inArray } from "drizzle-orm";

import type { V4Result } from "../../../../shared/assessmentV4";
import type { SkillLevelView } from "../../../../shared/me";
import { schema, type Db } from "../../db";

/**
 * The learner's skill levels (0–5) from their latest evaluation: the v4.3 mastery list (measured
 * and inferred) when present, else the measured levels. Older evaluations have none.
 */
export function skillLevels(db: Db, userId: string): SkillLevelView[] {
  const assessment = db
    .select({ id: schema.assessments.id })
    .from(schema.assessments)
    .where(eq(schema.assessments.userId, userId))
    .orderBy(desc(schema.assessments.attemptNo))
    .get();
  if (!assessment) return [];
  const row = db
    .select({ result: schema.evaluations.result })
    .from(schema.evaluations)
    .where(eq(schema.evaluations.assessmentId, assessment.id))
    .orderBy(desc(schema.evaluations.createdAt))
    .get();
  const result = row?.result as Partial<V4Result> | undefined;
  if (!result || result.format !== "v4") return [];
  if (result.mastery?.length) {
    return result.mastery.map((m) => ({ skillId: m.skillId, name: m.skillName, level: Math.max(0, Math.min(5, m.level)), source: m.source }));
  }
  return (result.skills ?? [])
    .filter((s) => s.level != null)
    .map((s) => ({ skillId: s.skillId, name: s.skillName, level: Math.max(0, Math.min(5, s.level ?? 0)), source: "measured" as const }));
}

export function levelMap(levels: readonly SkillLevelView[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of levels) out[l.skillId] = l.level;
  return out;
}

export function skillNames(db: Db, ids: readonly string[]): Map<string, string> {
  if (ids.length === 0) return new Map();
  return new Map(
    db
      .select({ id: schema.skills.id, name: schema.skills.name })
      .from(schema.skills)
      .where(inArray(schema.skills.id, [...new Set(ids)]))
      .all()
      .map((r) => [r.id, r.name]),
  );
}
