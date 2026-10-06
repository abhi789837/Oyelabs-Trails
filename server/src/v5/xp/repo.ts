import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";

import { isoWeekKey, mondayOf } from "../../../../shared/streak";
import { XP_LABELS, isXpKind, levelUpRef, xpFor, type MyXpResponse, type XpEventView, type XpKind } from "../../../../shared/xp";
import { schema, type Db } from "../../db";
import { newId, now } from "../../lib/ids";

/**
 * v5 XP awards (docs/v5/PLAN.md, "XP rules"; amounts in shared/xp.ts).
 *
 * `awardXp` is the only writer. It is idempotent through the unique (user_id, kind, ref_id) index:
 * the second award of the same thing inserts nothing and returns `awarded: false`. Callers never
 * need to check first, and a retried request can't double-count.
 *
 * Milestones that already happen elsewhere in the server (a topic test passed, a practical case
 * passed, a skill level going up after a test, a certificate) are awarded two ways: a one-line hook
 * where the event happens, and `syncMilestoneXp`, which reads the same facts back from their own
 * tables. The sync makes XP correct for history from before v5 and for any path that doesn't call
 * the hook (an admin marking a goal achieved, a certificate issued by another phase).
 */

export interface AwardResult {
  awarded: boolean;
  xp: number;
}

export interface AwardOptions {
  /** When it happened (epoch ms). Defaults to now. */
  at?: number;
  /**
   * A different amount than the table's, for a reduced award (the lesson player's half XP after
   * seeing a solution early). Rounded, never negative. The unique key is still (user, kind, ref),
   * so a reduced award can't be topped up by a later full one.
   */
  xp?: number;
}

export function awardXp(db: Db, userId: string, kind: XpKind, refId: string, options: AwardOptions = {}): AwardResult {
  const xp = options.xp === undefined ? xpFor(kind) : Math.max(0, Math.round(options.xp));
  const result = db
    .insert(schema.xpEvents)
    .values({ id: newId(), userId, kind, refId, xp, createdAt: options.at ?? now() })
    .onConflictDoNothing()
    .run();
  return { awarded: result.changes > 0, xp };
}

/** The same as `awardXp`, but never throws: for hooks inside flows where XP must not break the main action. */
export function awardXpSafely(db: Db, userId: string, kind: XpKind, refId: string, options: AwardOptions = {}): AwardResult {
  try {
    return awardXp(db, userId, kind, refId, options);
  } catch {
    return { awarded: false, xp: 0 };
  }
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export function xpTotals(db: Db, userId: string, nowMs = now()): { total: number; thisWeek: number } {
  const since = mondayOf(nowMs);
  const row = db
    .select({
      total: sql<number>`coalesce(sum(${schema.xpEvents.xp}), 0)`,
      thisWeek: sql<number>`coalesce(sum(case when ${schema.xpEvents.createdAt} >= ${since} then ${schema.xpEvents.xp} else 0 end), 0)`,
    })
    .from(schema.xpEvents)
    .where(eq(schema.xpEvents.userId, userId))
    .get();
  return { total: Number(row?.total ?? 0), thisWeek: Number(row?.thisWeek ?? 0) };
}

export function recentXp(db: Db, userId: string, limit = 10, kinds?: readonly XpKind[]): XpEventView[] {
  const where = kinds?.length
    ? and(eq(schema.xpEvents.userId, userId), inArray(schema.xpEvents.kind, kinds as XpKind[]))
    : eq(schema.xpEvents.userId, userId);
  return db
    .select()
    .from(schema.xpEvents)
    .where(where)
    .orderBy(desc(schema.xpEvents.createdAt))
    .limit(limit)
    .all()
    .filter((row) => isXpKind(row.kind))
    .map((row) => ({ kind: row.kind as XpKind, refId: row.refId, xp: row.xp, createdAt: row.createdAt, label: XP_LABELS[row.kind as XpKind] }));
}

export function myXp(db: Db, userId: string, nowMs = now()): MyXpResponse {
  return { ...xpTotals(db, userId, nowMs), recent: recentXp(db, userId, 10) };
}

/** XP per ISO week from step awards only: the "3 steps" streak rule counts these. */
export function stepCountsByWeek(db: Db, userId: string, sinceMs: number): Map<string, number> {
  const rows = db
    .select({ createdAt: schema.xpEvents.createdAt })
    .from(schema.xpEvents)
    .where(and(eq(schema.xpEvents.userId, userId), eq(schema.xpEvents.kind, "step_completed"), gte(schema.xpEvents.createdAt, sinceMs)))
    .all();
  const out = new Map<string, number>();
  for (const row of rows) {
    const key = isoWeekKey(row.createdAt);
    out.set(key, (out.get(key) ?? 0) + 1);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Milestone sync
// ---------------------------------------------------------------------------

interface Candidate {
  kind: XpKind;
  refId: string;
  at: number;
}

/** Skill levels from one stored evaluation result: v4 mastery when present, else the v4 skill table. */
export function levelsFromEvaluation(result: unknown): Map<string, number> {
  const out = new Map<string, number>();
  if (!result || typeof result !== "object") return out;
  const r = result as { mastery?: unknown; skills?: unknown };
  const take = (list: unknown, onlyMeasured: boolean) => {
    if (!Array.isArray(list)) return;
    for (const entry of list) {
      if (!entry || typeof entry !== "object") continue;
      const e = entry as { skillId?: unknown; level?: unknown; source?: unknown };
      if (typeof e.skillId !== "string" || typeof e.level !== "number" || !Number.isFinite(e.level)) continue;
      if (onlyMeasured && e.source !== undefined && e.source !== "measured") continue;
      out.set(e.skillId, Math.max(out.get(e.skillId) ?? 0, Math.round(e.level)));
    }
  };
  if (Array.isArray(r.mastery) && r.mastery.length > 0) take(r.mastery, true);
  else take(r.skills, false);
  return out;
}

/**
 * Level ups across a learner's evaluations, oldest first. The first evaluation is the starting
 * point (a placement isn't a "level up"); after that, each new highest level of a skill counts once.
 */
export function levelUpsFrom(evaluations: readonly { result: unknown; createdAt: number }[]): Candidate[] {
  const best = new Map<string, number>();
  const out: Candidate[] = [];
  evaluations.forEach((evaluation, index) => {
    for (const [skillId, level] of levelsFromEvaluation(evaluation.result)) {
      const before = best.get(skillId);
      if (index > 0 && level > (before ?? 0)) {
        for (let l = (before ?? 0) + 1; l <= level; l += 1) out.push({ kind: "skill_level_up", refId: levelUpRef(skillId, l), at: evaluation.createdAt });
      }
      if (before === undefined || level > before) best.set(skillId, level);
    }
  });
  return out;
}

/**
 * Awards XP for milestones recorded in their own tables. Cheap: four indexed per-user reads, and
 * the inserts are `on conflict do nothing`. Called by Today and `/api/v5/me/xp` before reading,
 * and by the nightly streak pass.
 */
export function syncMilestoneXp(db: Db, userId: string): number {
  const candidates: Candidate[] = [];

  // Topic tests passed: the first passing attempt per topic.
  const passed = db
    .select({ topicId: schema.topicAttempts.topicId, at: sql<number>`min(${schema.topicAttempts.createdAt})` })
    .from(schema.topicAttempts)
    .where(and(eq(schema.topicAttempts.userId, userId), eq(schema.topicAttempts.passed, true)))
    .groupBy(schema.topicAttempts.topicId)
    .all();
  for (const row of passed) candidates.push({ kind: "topic_test_passed", refId: row.topicId, at: Number(row.at) });

  // Practical cases: an achieved goal is one whose capstone was passed (or that the admin signed off).
  const goals = db
    .select({ id: schema.learnerGoals.id, achievedAt: schema.learnerGoals.achievedAt })
    .from(schema.learnerGoals)
    .where(and(eq(schema.learnerGoals.userId, userId), eq(schema.learnerGoals.status, "achieved")))
    .all();
  for (const goal of goals) candidates.push({ kind: "case_passed", refId: goal.id, at: goal.achievedAt ?? now() });

  // Certificates that haven't been revoked.
  const certs = db
    .select({ id: schema.certificates.id, issuedAt: schema.certificates.issuedAt })
    .from(schema.certificates)
    .where(and(eq(schema.certificates.userId, userId), isNull(schema.certificates.revokedAt)))
    .all();
  for (const cert of certs) candidates.push({ kind: "certificate", refId: cert.id, at: cert.issuedAt });

  // Skill level ups between evaluations.
  const evaluations = db
    .select({ result: schema.evaluations.result, createdAt: schema.evaluations.createdAt })
    .from(schema.evaluations)
    .innerJoin(schema.assessments, eq(schema.assessments.id, schema.evaluations.assessmentId))
    .where(eq(schema.assessments.userId, userId))
    .orderBy(schema.evaluations.createdAt)
    .all();
  candidates.push(...levelUpsFrom(evaluations));

  if (candidates.length === 0) return 0;
  // Read first, write only what's missing: most reads have nothing new, and then nothing is written.
  const have = new Set(
    db
      .select({ kind: schema.xpEvents.kind, refId: schema.xpEvents.refId })
      .from(schema.xpEvents)
      .where(and(eq(schema.xpEvents.userId, userId), inArray(schema.xpEvents.kind, ["topic_test_passed", "case_passed", "certificate", "skill_level_up"])))
      .all()
      .map((row) => `${row.kind}\u0000${row.refId}`),
  );
  const missing = candidates.filter((c) => !have.has(`${c.kind}\u0000${c.refId}`));
  if (missing.length === 0) return 0;
  let awarded = 0;
  db.transaction((tx) => {
    for (const c of missing) {
      const result = tx
        .insert(schema.xpEvents)
        .values({ id: newId(), userId, kind: c.kind, refId: c.refId, xp: xpFor(c.kind), createdAt: c.at })
        .onConflictDoNothing()
        .run();
      awarded += result.changes;
    }
  });
  return awarded;
}
