import { and, desc, eq, max } from "drizzle-orm";

import { isStuck, type StuckFacts } from "../../../../shared/adminInbox";
import { schema, type Db } from "../../db";

/**
 * v5 Phase 7: "when did this person last learn anything", read from every table a learning action
 * writes to. One grouped query per table, so the whole roster costs a handful of queries.
 *
 * Signing in is deliberately not activity: someone who opens the app and closes it again is the
 * person the stuck rule is for.
 */
export function lastActivityByUser(db: Db): Map<string, number> {
  const out = new Map<string, number>();
  const take = (rows: { userId: string; at: number | null }[]) => {
    for (const r of rows) {
      if (r.at === null) continue;
      const prev = out.get(r.userId);
      if (prev === undefined || r.at > prev) out.set(r.userId, r.at);
    }
  };
  take(db.select({ userId: schema.topicProgress.userId, at: max(schema.topicProgress.updatedAt) }).from(schema.topicProgress).groupBy(schema.topicProgress.userId).all());
  take(db.select({ userId: schema.courseProgress.userId, at: max(schema.courseProgress.completedAt) }).from(schema.courseProgress).groupBy(schema.courseProgress.userId).all());
  take(db.select({ userId: schema.videoProgress.userId, at: max(schema.videoProgress.updatedAt) }).from(schema.videoProgress).groupBy(schema.videoProgress.userId).all());
  take(db.select({ userId: schema.topicAttempts.userId, at: max(schema.topicAttempts.createdAt) }).from(schema.topicAttempts).groupBy(schema.topicAttempts.userId).all());
  take(db.select({ userId: schema.lessonState.userId, at: max(schema.lessonState.updatedAt) }).from(schema.lessonState).groupBy(schema.lessonState.userId).all());
  take(db.select({ userId: schema.reviewLogs.userId, at: max(schema.reviewLogs.reviewedAt) }).from(schema.reviewLogs).groupBy(schema.reviewLogs.userId).all());
  take(db.select({ userId: schema.assessments.userId, at: max(schema.assessments.submittedAt) }).from(schema.assessments).groupBy(schema.assessments.userId).all());
  return out;
}

export interface PlanInfo {
  topicIds: string[];
  completed: number;
  startedAt: number | null;
}

/** Each learner's latest plan, how much of it is done, and when it reached them. */
export function planInfoByUser(db: Db): Map<string, PlanInfo> {
  const plans = db
    .select({ userId: schema.learningPlans.userId, version: schema.learningPlans.version, topicIds: schema.learningPlans.topicIds, publishedAt: schema.learningPlans.publishedAt })
    .from(schema.learningPlans)
    .all();
  const latest = new Map<string, (typeof plans)[number]>();
  for (const p of plans) {
    const cur = latest.get(p.userId);
    if (!cur || p.version > cur.version) latest.set(p.userId, p);
  }
  const done = new Map<string, Set<string>>();
  for (const row of db.select({ userId: schema.topicProgress.userId, topicId: schema.topicProgress.topicId }).from(schema.topicProgress).where(eq(schema.topicProgress.status, "completed")).all()) {
    const set = done.get(row.userId) ?? new Set<string>();
    set.add(row.topicId);
    done.set(row.userId, set);
  }
  const paths = db
    .select({ userId: schema.learningPaths.userId, completedAt: schema.learningPaths.completedAt })
    .from(schema.learningPaths)
    .where(and(eq(schema.learningPaths.current, true), eq(schema.learningPaths.status, "ready")))
    .all();
  const pathAt = new Map(paths.map((p) => [p.userId, p.completedAt]));

  const out = new Map<string, PlanInfo>();
  for (const [userId, p] of latest) {
    const ids = p.topicIds ?? [];
    const mine = done.get(userId);
    const started = [p.publishedAt, pathAt.get(userId) ?? null].filter((v): v is number => typeof v === "number");
    out.set(userId, { topicIds: ids, completed: mine ? ids.filter((id) => mine.has(id)).length : 0, startedAt: started.length ? Math.max(...started) : null });
  }
  return out;
}

export interface LearnerSignal {
  userId: string;
  displayName: string;
  status: string;
  departmentId: string | null;
  createdAt: number;
  lastActivityAt: number | null;
  planTopicCount: number;
  planCompleted: number;
  stuck: boolean;
  /** Days without activity (from the plan start when they never started). */
  idleDays: number | null;
}

/** Every learner with the facts the inbox, People and the overview share. */
export function learnerSignals(db: Db, now: number): LearnerSignal[] {
  const activity = lastActivityByUser(db);
  const plans = planInfoByUser(db);
  const profiles = new Map(db.select({ userId: schema.learnerProfiles.userId, departmentId: schema.learnerProfiles.departmentId }).from(schema.learnerProfiles).all().map((p) => [p.userId, p.departmentId]));
  const users = db.select().from(schema.users).where(eq(schema.users.role, "learner")).orderBy(desc(schema.users.createdAt)).all();
  return users.map((u) => {
    const plan = plans.get(u.id);
    const last = activity.get(u.id) ?? null;
    const facts: StuckFacts = {
      role: u.role,
      status: u.status,
      hasPlan: Boolean(plan && plan.topicIds.length > 0),
      planDone: Boolean(plan && plan.topicIds.length > 0 && plan.completed >= plan.topicIds.length),
      planStartedAt: plan?.startedAt ?? null,
      lastActivityAt: last,
    };
    const since = last ?? plan?.startedAt ?? null;
    return {
      userId: u.id,
      displayName: u.displayName,
      status: u.status,
      departmentId: profiles.get(u.id) ?? null,
      createdAt: u.createdAt,
      lastActivityAt: last,
      planTopicCount: plan?.topicIds.length ?? 0,
      planCompleted: plan?.completed ?? 0,
      stuck: isStuck(facts, now),
      idleDays: since === null ? null : Math.max(0, Math.floor((now - since) / 86_400_000)),
    };
  });
}
