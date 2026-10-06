import { emailConfigFromEnv } from "../email/sender";
import { and, eq, gte, isNotNull, lt } from "drizzle-orm";

import {
  bucketByDay,
  dayStarts,
  dollarsFromMicros,
  hoursFromMinutes,
  inRange,
  isoDay,
  percent,
  rangeForDays,
  skillLevelUps,
  testOutcomes,
  uniquePairs,
  WEEKLY_REPORT_LAST_META_KEY,
  WEEKLY_REPORT_META_KEY,
  type CohortRow,
  type DepartmentRow,
  type EvaluationSkills,
  type OverviewResponse,
  type ReportRange,
  type ReportsResponse,
} from "../../../../shared/reports";
import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import { learnerSignals, planInfoByUser } from "./activity";

const DAY_MS = 86_400_000;

/** Every learning action from `from` on: who and when (the same tables as `lastActivityByUser`). */
export function activityEvents(db: Db, from: number, to = Number.MAX_SAFE_INTEGER): { userId: string; at: number }[] {
  const out: { userId: string; at: number }[] = [];
  const push = (rows: { userId: string; at: number | null }[]) => {
    for (const r of rows) if (r.at !== null && r.at >= from && r.at < to) out.push({ userId: r.userId, at: r.at });
  };
  push(db.select({ userId: schema.topicProgress.userId, at: schema.topicProgress.updatedAt }).from(schema.topicProgress).where(gte(schema.topicProgress.updatedAt, from)).all());
  push(db.select({ userId: schema.courseProgress.userId, at: schema.courseProgress.completedAt }).from(schema.courseProgress).where(gte(schema.courseProgress.completedAt, from)).all());
  push(db.select({ userId: schema.videoProgress.userId, at: schema.videoProgress.updatedAt }).from(schema.videoProgress).where(gte(schema.videoProgress.updatedAt, from)).all());
  push(db.select({ userId: schema.topicAttempts.userId, at: schema.topicAttempts.createdAt }).from(schema.topicAttempts).where(gte(schema.topicAttempts.createdAt, from)).all());
  push(db.select({ userId: schema.lessonState.userId, at: schema.lessonState.updatedAt }).from(schema.lessonState).where(gte(schema.lessonState.updatedAt, from)).all());
  push(db.select({ userId: schema.reviewLogs.userId, at: schema.reviewLogs.reviewedAt }).from(schema.reviewLogs).where(gte(schema.reviewLogs.reviewedAt, from)).all());
  return out;
}

/**
 * Lessons finished in the range, with the minutes each is meant to take. Hours learned are
 * estimated from these (the lesson's own estimate), so a lesson left open in a tab doesn't count
 * for hours and a finished one always does.
 */
export function lessonsDone(db: Db, content: ContentStore, range: ReportRange): { userId: string; at: number; minutes: number }[] {
  const out: { userId: string; at: number; minutes: number }[] = [];
  for (const r of db
    .select({ userId: schema.topicProgress.userId, topicId: schema.topicProgress.topicId, at: schema.topicProgress.completedAt })
    .from(schema.topicProgress)
    .where(and(eq(schema.topicProgress.status, "completed"), gte(schema.topicProgress.completedAt, range.from), lt(schema.topicProgress.completedAt, range.to)))
    .all()) {
    if (r.at === null) continue;
    out.push({ userId: r.userId, at: r.at, minutes: content.getTopic(r.topicId)?.topic.estMinutes ?? 15 });
  }
  for (const r of db
    .select({ userId: schema.courseProgress.userId, at: schema.courseProgress.completedAt, minutes: schema.courseTopics.estMinutes })
    .from(schema.courseProgress)
    .innerJoin(schema.courseTopics, eq(schema.courseTopics.id, schema.courseProgress.topicId))
    .where(and(gte(schema.courseProgress.completedAt, range.from), lt(schema.courseProgress.completedAt, range.to)))
    .all()) {
    out.push({ userId: r.userId, at: r.at, minutes: r.minutes });
  }
  return out;
}

/** Every evaluation with its learner and skill levels (v4 results; older shapes have no skills). */
export function evaluationSkills(db: Db): EvaluationSkills[] {
  return db
    .select({ userId: schema.assessments.userId, at: schema.evaluations.createdAt, result: schema.evaluations.result })
    .from(schema.evaluations)
    .innerJoin(schema.assessments, eq(schema.assessments.id, schema.evaluations.assessmentId))
    .all()
    .map((r) => {
      const skills = (r.result as { skills?: unknown } | null)?.skills;
      return {
        userId: r.userId,
        at: r.at,
        skills: Array.isArray(skills)
          ? (skills as { skillId?: unknown; skillName?: unknown; level?: unknown }[])
              .filter((s) => typeof s.skillId === "string")
              .map((s) => ({ skillId: s.skillId as string, skillName: typeof s.skillName === "string" ? s.skillName : undefined, level: typeof s.level === "number" ? s.level : null }))
          : [],
      };
    });
}

/** Practical cases passed: achieved case goals and `case_passed` awards, each pair counted once. */
export function casePairs(db: Db): { userId: string; ref: string; at: number }[] {
  const goals = db
    .select({ userId: schema.learnerGoals.userId, caseId: schema.learnerGoals.caseId, id: schema.learnerGoals.id, at: schema.learnerGoals.achievedAt })
    .from(schema.learnerGoals)
    .where(and(eq(schema.learnerGoals.type, "case"), eq(schema.learnerGoals.status, "achieved"), isNotNull(schema.learnerGoals.achievedAt)))
    .all()
    .map((g) => ({ userId: g.userId, ref: g.caseId ?? g.id, at: g.at! }));
  const xp = db
    .select({ userId: schema.xpEvents.userId, ref: schema.xpEvents.refId, at: schema.xpEvents.createdAt })
    .from(schema.xpEvents)
    .where(eq(schema.xpEvents.kind, "case_passed"))
    .all();
  return [...goals, ...xp];
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y!, m! - 1, 1).toLocaleString("en-GB", { month: "short", year: "numeric" });
}

export function buildOverview(db: Db, content: ContentStore, now = Date.now()): OverviewResponse {
  const week = rangeForDays(7, now);
  const before: ReportRange = { from: week.from - 7 * DAY_MS, to: week.from };
  const events = activityEvents(db, before.from);
  const learners = (r: ReportRange) => new Set(events.filter((e) => inRange(e.at, r)).map((e) => e.userId)).size;
  const hours = (r: ReportRange) => hoursFromMinutes(lessonsDone(db, content, r).reduce((s, l) => s + l.minutes, 0));
  const evals = evaluationSkills(db);
  const cases = casePairs(db);

  const signals = learnerSignals(db, now);
  const activeIds = new Set(events.filter((e) => inRange(e.at, week)).map((e) => e.userId));
  const done = (s: (typeof signals)[number]) => (s.planTopicCount ? (s.planCompleted / s.planTopicCount) * 100 : 0);

  // Cohorts: the month they joined, the last six months that have anyone.
  const byMonth = new Map<string, number[]>();
  for (const s of signals) {
    if (s.status === "archived") continue;
    const key = isoDay(s.createdAt).slice(0, 7);
    byMonth.set(key, [...(byMonth.get(key) ?? []), done(s)]);
  }
  const cohorts: CohortRow[] = [...byMonth.keys()]
    .sort()
    .slice(-6)
    .map((key) => {
      const list = byMonth.get(key)!;
      return { cohort: key, label: monthLabel(key), learners: list.length, averageDone: Math.round(list.reduce((a, b) => a + b, 0) / list.length) };
    });

  const departments: DepartmentRow[] = db
    .select()
    .from(schema.departments)
    .all()
    .filter((d) => d.kind !== "area" && d.archivedAt === null)
    .sort((a, b) => a.position - b.position)
    .map((d) => {
      const mine = signals.filter((s) => s.departmentId === d.id && s.status !== "archived");
      return {
        id: d.id,
        name: d.name,
        learners: mine.length,
        activeThisWeek: mine.filter((s) => activeIds.has(s.userId)).length,
        averageDone: mine.length ? Math.round(mine.reduce((a, s) => a + done(s), 0) / mine.length) : 0,
        stuck: mine.filter((s) => s.stuck).length,
      };
    });

  const known = new Set(departments.map((d) => d.id));
  const loose = signals.filter((s) => s.status !== "archived" && (s.departmentId === null || !known.has(s.departmentId)));
  if (loose.length) {
    departments.push({
      id: "",
      name: "No department",
      learners: loose.length,
      activeThisWeek: loose.filter((s) => activeIds.has(s.userId)).length,
      averageDone: Math.round(loose.reduce((a, s) => a + done(s), 0) / loose.length),
      stuck: loose.filter((s) => s.stuck).length,
    });
  }

  return {
    tiles: [
      { id: "active", label: "Active learners this week", value: learners(week), previous: learners(before), href: "/admin/people?view=active" },
      { id: "hours", label: "Hours learned this week", value: hours(week), previous: hours(before), href: "/admin/reports?days=7#time" },
      { id: "skills", label: "Skills levelled up", value: skillLevelUps(evals, week).count, previous: skillLevelUps(evals, before).count, href: "/admin/reports?days=7#skills" },
      { id: "cases", label: "Practical cases passed", value: uniquePairs(cases, week), previous: uniquePairs(cases, before), href: "/admin/reports?days=7#skills" },
    ],
    cohorts,
    departments,
    generatedAt: now,
  };
}

function metaValue(db: Db, key: string): string | null {
  return db.select().from(schema.appMeta).where(eq(schema.appMeta.key, key)).get()?.value ?? null;
}

export function weeklyEmailState(db: Db): { on: boolean; lastQueuedAt: number | null } {
  const last = Number(metaValue(db, WEEKLY_REPORT_LAST_META_KEY));
  return { on: metaValue(db, WEEKLY_REPORT_META_KEY) === "on", lastQueuedAt: Number.isFinite(last) && last > 0 ? last : null };
}

export function buildReport(db: Db, content: ContentStore, range: ReportRange): ReportsResponse {
  const starts = dayStarts(range);
  const lessons = lessonsDone(db, content, range);
  const plans = planInfoByUser(db);
  const withPlan = [...plans.values()].filter((p) => p.topicIds.length > 0);
  const evals = evaluationSkills(db);
  const ups = skillLevelUps(evals, range);
  const events = activityEvents(db, range.from, range.to);

  const attempts = db
    .select({ passed: schema.topicAttempts.passed, score: schema.topicAttempts.score })
    .from(schema.topicAttempts)
    .where(and(gte(schema.topicAttempts.createdAt, range.from), lt(schema.topicAttempts.createdAt, range.to)))
    .all();
  const placement = evals.filter((e) => inRange(e.at, range));
  const placementScores = db
    .select({ result: schema.evaluations.result, at: schema.evaluations.createdAt })
    .from(schema.evaluations)
    .where(and(gte(schema.evaluations.createdAt, range.from), lt(schema.evaluations.createdAt, range.to)))
    .all()
    .map((r) => (r.result as { rawScore?: unknown } | null)?.rawScore)
    .filter((v): v is number => typeof v === "number");

  const calls = db
    .select({ at: schema.aiCalls.createdAt, cost: schema.aiCalls.costMicros, ok: schema.aiCalls.ok })
    .from(schema.aiCalls)
    .where(and(gte(schema.aiCalls.createdAt, range.from), lt(schema.aiCalls.createdAt, range.to)))
    .all();
  const micros = calls.reduce((s, c) => s + c.cost, 0);

  return {
    range,
    days: starts.map(isoDay),
    completion: {
      lessonsDone: lessons.length,
      perDay: bucketByDay(starts, lessons),
      learnersWithPlan: withPlan.length,
      averagePlanDone: withPlan.length ? Math.round(withPlan.reduce((s, p) => s + percent(p.completed, p.topicIds.length), 0) / withPlan.length) : 0,
      plansFinished: withPlan.filter((p) => p.completed >= p.topicIds.length).length,
    },
    time: {
      hours: hoursFromMinutes(lessons.reduce((s, l) => s + l.minutes, 0)),
      perDay: bucketByDay(starts, lessons.map((l) => ({ at: l.at, value: l.minutes }))).map(hoursFromMinutes),
      activeLearners: new Set(events.map((e) => e.userId)).size,
    },
    skills: { levelUps: ups.count, learners: ups.learners, bySkill: ups.bySkill.slice(0, 10), casesPassed: uniquePairs(casePairs(db), range) },
    tests: {
      topic: testOutcomes(attempts),
      placement: {
        finished: placement.length,
        averageScore: placementScores.length ? Math.round(placementScores.reduce((a, b) => a + b, 0) / placementScores.length) : 0,
      },
    },
    ai: {
      dollars: dollarsFromMicros(micros),
      calls: calls.length,
      failed: calls.filter((c) => !c.ok).length,
      perDay: bucketByDay(starts, calls.map((c) => ({ at: c.at, value: c.cost }))).map(dollarsFromMicros),
    },
    weeklyEmail: { ...weeklyEmailState(db), available: emailConfigFromEnv().ok },
  };
}
