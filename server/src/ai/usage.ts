import { and, gte, inArray, isNotNull, sql } from "drizzle-orm";

import type { UsageReport } from "../../../shared/aiRouting";
import type { Db } from "../db";
import * as schema from "../db/schema";
import { now } from "../lib/ids";
import { budgetStatus } from "./router";

const usd = (micros: number) => Math.round(micros) / 1_000_000;

/**
 * Admin → AI usage: spend per day, per task and per learner, and the two averages that matter —
 * per assessment and per generated course — over a window.
 */
export function usageReport(db: Db, days = 30): UsageReport {
  const since = now() - days * 86_400_000;
  const calls = schema.aiCalls;

  const daily = db
    .select({ day: sql<string>`strftime('%Y-%m-%d', ${calls.createdAt} / 1000, 'unixepoch', 'localtime')`, micros: sql<number>`sum(${calls.costMicros})`, n: sql<number>`count(*)` })
    .from(calls)
    .where(gte(calls.createdAt, since))
    .groupBy(sql`1`)
    .orderBy(sql`1`)
    .all();

  const byTask = db
    .select({
      task: sql<string>`coalesce(${calls.task}, ${calls.purpose})`,
      n: sql<number>`count(*)`,
      micros: sql<number>`sum(${calls.costMicros})`,
      input: sql<number>`sum(${calls.inputTokens})`,
      output: sql<number>`sum(${calls.outputTokens})`,
      cacheRead: sql<number>`sum(${calls.cacheReadTokens})`,
    })
    .from(calls)
    .where(gte(calls.createdAt, since))
    .groupBy(sql`1`)
    .orderBy(sql`3 desc`)
    .all();

  const byLearnerRows = db
    .select({ userId: calls.subjectUserId, micros: sql<number>`sum(${calls.costMicros})`, n: sql<number>`count(*)` })
    .from(calls)
    .where(and(gte(calls.createdAt, since), isNotNull(calls.subjectUserId)))
    .groupBy(calls.subjectUserId)
    .orderBy(sql`2 desc`)
    .limit(20)
    .all();
  const names = new Map(
    byLearnerRows.length
      ? db
          .select({ id: schema.users.id, name: schema.users.displayName })
          .from(schema.users)
          .where(inArray(schema.users.id, byLearnerRows.map((r) => r.userId!)))
          .all()
          .map((u) => [u.id, u.name])
      : [],
  );

  const assessments = db.select({ id: schema.assessments.id }).from(schema.assessments).where(gte(schema.assessments.createdAt, since)).all();
  const assessmentMicros =
    db.select({ m: sql<number>`coalesce(sum(${calls.costMicros}), 0)` }).from(calls).where(and(gte(calls.createdAt, since), isNotNull(calls.assessmentId))).get()?.m ?? 0;

  const courses = db.select({ id: schema.generatedCourses.courseId }).from(schema.generatedCourses).where(gte(schema.generatedCourses.createdAt, since)).all();
  const courseMicros =
    db.select({ m: sql<number>`coalesce(sum(${calls.costMicros}), 0)` }).from(calls).where(and(gte(calls.createdAt, since), isNotNull(calls.courseId))).get()?.m ?? 0;

  const total = daily.reduce((s, d) => s + (d.micros ?? 0), 0);
  return {
    budget: budgetStatus(db),
    days: daily.map((d) => ({ day: d.day, usd: usd(d.micros ?? 0), calls: d.n })),
    byTask: byTask.map((t) => ({ task: t.task, calls: t.n, usd: usd(t.micros ?? 0), inputTokens: t.input ?? 0, outputTokens: t.output ?? 0, cacheReadTokens: t.cacheRead ?? 0 })),
    byLearner: byLearnerRows.map((r) => ({ userId: r.userId!, displayName: names.get(r.userId!) ?? "(deleted)", usd: usd(r.micros ?? 0), calls: r.n })),
    perAssessment: { count: assessments.length, avgUsd: assessments.length ? usd(assessmentMicros) / assessments.length : 0 },
    perCourse: { count: courses.length, avgUsd: courses.length ? usd(courseMicros) / courses.length : 0 },
    totalUsd: usd(total),
  };
}
