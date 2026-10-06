import { and, desc, eq } from "drizzle-orm";

import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import { topicTitle } from "./inbox";
import { planInfoByUser } from "./activity";

export interface ActivityEvent {
  at: number;
  kind: "lesson" | "course-lesson" | "test" | "placement" | "review" | "win" | "sign-in" | "joined";
  text: string;
}

export interface PersonActivity {
  events: ActivityEvent[];
  plan: {
    topicCount: number;
    completed: number;
    nextTopic: string | null;
    goals: string[];
    pathStatus: string | null;
  };
}

const WIN_TEXT: Record<string, string> = {
  case_passed: "Passed a practical case",
  skill_level_up: "Levelled up a skill",
  certificate: "Earned a certificate",
};

/** The side sheet's timeline (newest first, at most `limit`) and the plan summary. */
export function personActivity(db: Db, content: ContentStore, userId: string, limit = 20): PersonActivity | null {
  const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) return null;
  const events: ActivityEvent[] = [];

  for (const r of db
    .select({ topicId: schema.topicProgress.topicId, at: schema.topicProgress.completedAt })
    .from(schema.topicProgress)
    .where(and(eq(schema.topicProgress.userId, userId), eq(schema.topicProgress.status, "completed")))
    .orderBy(desc(schema.topicProgress.completedAt))
    .limit(limit)
    .all()) {
    if (r.at !== null) events.push({ at: r.at, kind: "lesson", text: `Finished ${topicTitle(db, content, r.topicId)}` });
  }
  for (const r of db
    .select({ at: schema.courseProgress.completedAt, title: schema.courseTopics.title })
    .from(schema.courseProgress)
    .innerJoin(schema.courseTopics, eq(schema.courseTopics.id, schema.courseProgress.topicId))
    .where(eq(schema.courseProgress.userId, userId))
    .orderBy(desc(schema.courseProgress.completedAt))
    .limit(limit)
    .all()) {
    events.push({ at: r.at, kind: "course-lesson", text: `Finished ${r.title}` });
  }
  for (const r of db
    .select({ topicId: schema.topicAttempts.topicId, at: schema.topicAttempts.createdAt, passed: schema.topicAttempts.passed, score: schema.topicAttempts.score })
    .from(schema.topicAttempts)
    .where(eq(schema.topicAttempts.userId, userId))
    .orderBy(desc(schema.topicAttempts.createdAt))
    .limit(limit)
    .all()) {
    events.push({ at: r.at, kind: "test", text: `${r.passed ? "Passed" : "Tried"} the test on ${topicTitle(db, content, r.topicId)} (${r.score}%)` });
  }
  for (const r of db
    .select({ at: schema.assessments.submittedAt, status: schema.assessments.status })
    .from(schema.assessments)
    .where(eq(schema.assessments.userId, userId))
    .all()) {
    if (r.at !== null) events.push({ at: r.at, kind: "placement", text: r.status === "terminated" ? "Their test ended early" : "Finished their test" });
  }
  for (const r of db.select().from(schema.reviewRequests).where(eq(schema.reviewRequests.userId, userId)).orderBy(desc(schema.reviewRequests.createdAt)).limit(limit).all()) {
    events.push({ at: r.createdAt, kind: "review", text: "Asked us to check an answer again" });
  }
  for (const r of db.select().from(schema.xpEvents).where(eq(schema.xpEvents.userId, userId)).orderBy(desc(schema.xpEvents.createdAt)).limit(limit * 3).all()) {
    const text = WIN_TEXT[r.kind];
    if (text) events.push({ at: r.createdAt, kind: "win", text });
  }
  if (user.lastLoginAt) events.push({ at: user.lastLoginAt, kind: "sign-in", text: "Last signed in" });
  events.push({ at: user.createdAt, kind: "joined", text: "Joined Oyelearn" });
  events.sort((a, b) => b.at - a.at);

  const plan = planInfoByUser(db).get(userId);
  const done = new Set(
    db
      .select({ topicId: schema.topicProgress.topicId })
      .from(schema.topicProgress)
      .where(and(eq(schema.topicProgress.userId, userId), eq(schema.topicProgress.status, "completed")))
      .all()
      .map((r) => r.topicId),
  );
  const next = plan?.topicIds.find((id) => !done.has(id)) ?? null;
  const goals = db
    .select({ outcome: schema.learnerGoals.outcome })
    .from(schema.learnerGoals)
    .where(and(eq(schema.learnerGoals.userId, userId), eq(schema.learnerGoals.status, "active")))
    .orderBy(schema.learnerGoals.position)
    .limit(6)
    .all()
    .map((g) => g.outcome);
  const path = db
    .select({ status: schema.learningPaths.status })
    .from(schema.learningPaths)
    .where(and(eq(schema.learningPaths.userId, userId), eq(schema.learningPaths.current, true)))
    .get();

  return {
    events: events.slice(0, limit),
    plan: {
      topicCount: plan?.topicIds.length ?? 0,
      completed: plan?.completed ?? 0,
      nextTopic: next ? topicTitle(db, content, next) : null,
      goals,
      pathStatus: path?.status ?? null,
    },
  };
}
