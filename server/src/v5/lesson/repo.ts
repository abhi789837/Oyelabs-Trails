import { and, desc, eq } from "drizzle-orm";

import {
  DO_MAX_ATTEMPTS,
  EMPTY_STEP_DONE,
  LESSON_STEP_IDS,
  availableSteps,
  lessonComplete,
  mergeDone,
  minutesLeft,
  resumeStep,
  videosCleared,
  type LessonFacts,
  type LessonResume,
  type LessonStatePut,
  type LessonStatePutResponse,
  type LessonStateView,
  type LessonStepId,
  type StepDone,
  type XpAward,
} from "../../../../shared/lesson";
import type { SessionUser } from "../../../../shared/auth";
import { isStaff } from "../../../../shared/enums";
import type { ContentStore, AuthoredTopic } from "../../content/store";
import { schema, type Db } from "../../db";
import { now } from "../../lib/ids";
import { allowedTopicIdsFor } from "../../plans/repo";
import { activeWeek } from "../../plans/weekly/repo";
import { topicVideosView } from "../../videos/repo";
import { awardLessonComplete, awardStep } from "./xp";

type Row = typeof schema.lessonState.$inferSelect;

/**
 * `lesson_state.step_done` is a JSON column. Besides the four step flags it carries one extra key,
 * `solution`, set when the learner traded XP to see a Do solution before their third check (see
 * DECISIONS "Schema requests"). Read tolerantly: anything missing is false.
 */
interface StoredDone extends StepDone {
  solution?: boolean;
}

function readDone(raw: unknown): StoredDone {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    watch: r.watch === true,
    read: r.read === true,
    do: r.do === true,
    check: r.check === true,
    ...(r.solution === true ? { solution: true } : {}),
  };
}

export function getRow(db: Db, userId: string, topicId: string): Row | null {
  return (
    db
      .select()
      .from(schema.lessonState)
      .where(and(eq(schema.lessonState.userId, userId), eq(schema.lessonState.topicId, topicId)))
      .get() ?? null
  );
}

export function lessonFacts(db: Db, userId: string, topicId: string, solutionTraded = false): LessonFacts {
  const attempts = db
    .select({ kind: schema.topicAttempts.kind, passed: schema.topicAttempts.passed })
    .from(schema.topicAttempts)
    .where(and(eq(schema.topicAttempts.userId, userId), eq(schema.topicAttempts.topicId, topicId)))
    .all();
  const progress = db
    .select({ status: schema.topicProgress.status })
    .from(schema.topicProgress)
    .where(and(eq(schema.topicProgress.userId, userId), eq(schema.topicProgress.topicId, topicId)))
    .get();
  const code = attempts.filter((a) => a.kind === "code");
  return {
    codeAttempts: code.length,
    codePassed: code.some((a) => a.passed),
    quizPassed: attempts.some((a) => a.kind === "quiz" && a.passed) || progress?.status === "completed",
    solutionTraded,
  };
}

export function toView(topic: AuthoredTopic, row: Row | null, facts: LessonFacts): LessonStateView {
  const available = availableSteps(topic);
  const done = row ? readDone(row.stepDone) : { ...EMPTY_STEP_DONE };
  const stepDone: StepDone = { watch: done.watch, read: done.read, do: done.do, check: done.check };
  const saved = row?.step && available.includes(row.step) ? row.step : resumeStep(available, stepDone);
  return {
    topicId: topic.id,
    step: saved,
    stepDone,
    videoId: row?.videoId ?? null,
    positionSec: row?.positionSec ?? null,
    available,
    complete: lessonComplete(available, stepDone),
    minutesLeft: minutesLeft(topic.estMinutes, available, stepDone),
    facts,
    updatedAt: row?.updatedAt ?? null,
  };
}

/**
 * Which of the claimed steps the server agrees are done. The learner's word is enough for Read and
 * for hands-on practice (graded in the browser, formative). Watch, a coding Do and Check are checked
 * against the server's own records, so XP can't be had by sending `true`.
 */
export function verifyClaims(
  db: Db,
  content: ContentStore,
  user: SessionUser,
  topic: AuthoredTopic,
  claim: Partial<StepDone>,
  facts: LessonFacts,
): Partial<StepDone> {
  const available = availableSteps(topic);
  const staff = isStaff(user.role);
  const out: Partial<StepDone> = {};
  for (const step of LESSON_STEP_IDS) {
    if (!claim[step] || !available.includes(step)) continue;
    if (staff) {
      out[step] = true;
      continue;
    }
    switch (step) {
      case "watch":
        out.watch = videosCleared(topicVideosView(db, content, user, topic));
        break;
      case "read":
        out.read = true;
        break;
      case "do":
        out.do = topic.challengeType === "code" && topic.codeChallenge ? facts.codePassed || facts.codeAttempts >= DO_MAX_ATTEMPTS : true;
        break;
      case "check":
        out.check = facts.quizPassed;
        break;
    }
  }
  return out;
}

function upsert(db: Db, userId: string, topicId: string, values: { step: LessonStepId; stepDone: StoredDone; videoId: string | null; positionSec: number | null }): Row {
  const at = now();
  db.insert(schema.lessonState)
    .values({ userId, topicId, ...values, updatedAt: at })
    .onConflictDoUpdate({
      target: [schema.lessonState.userId, schema.lessonState.topicId],
      set: { ...values, updatedAt: at },
    })
    .run();
  return getRow(db, userId, topicId)!;
}

export function saveState(db: Db, content: ContentStore, user: SessionUser, topic: AuthoredTopic, body: LessonStatePut): LessonStatePutResponse {
  const row = getRow(db, user.id, topic.id);
  const before = row ? readDone(row.stepDone) : { ...EMPTY_STEP_DONE };
  const available = availableSteps(topic);
  const traded = Boolean(before.solution || body.solutionTraded);
  const facts = lessonFacts(db, user.id, topic.id, traded);

  const verified = verifyClaims(db, content, user, topic, body.stepDone ?? {}, facts);
  const merged = mergeDone(before, verified);
  const step = body.step && available.includes(body.step) ? body.step : row?.step && available.includes(row.step) ? row.step : resumeStep(available, merged);

  const saved = upsert(db, user.id, topic.id, {
    step,
    stepDone: { ...merged, ...(traded ? { solution: true } : {}) },
    videoId: body.videoId !== undefined ? body.videoId : (row?.videoId ?? null),
    positionSec: body.positionSec !== undefined ? body.positionSec : (row?.positionSec ?? null),
  });

  const awarded: XpAward[] = [];
  for (const s of LESSON_STEP_IDS) {
    if (merged[s] && !before[s]) {
      const award = awardStep(db, user.id, topic.id, s, { halved: s === "do" && traded });
      if (award) awarded.push(award);
    }
  }
  const wasComplete = lessonComplete(available, before);
  const nowComplete = lessonComplete(available, merged);
  if (nowComplete && !wasComplete) {
    const award = awardLessonComplete(db, user.id, topic.id);
    if (award) awarded.push(award);
  }
  return { state: toView(topic, saved, facts), awarded, justCompleted: nowComplete && !wasComplete };
}

/** Marks that the learner traded XP to see the solution early. */
export function markSolutionTraded(db: Db, userId: string, topic: AuthoredTopic): void {
  const row = getRow(db, userId, topic.id);
  const done = row ? readDone(row.stepDone) : { ...EMPTY_STEP_DONE };
  if (done.solution) return;
  const available = availableSteps(topic);
  upsert(db, userId, topic.id, {
    step: row?.step && available.includes(row.step) ? row.step : resumeStep(available, done),
    stepDone: { ...done, solution: true },
    videoId: row?.videoId ?? null,
    positionSec: row?.positionSec ?? null,
  });
}

export function solutionWasTraded(db: Db, userId: string, topicId: string): boolean {
  const row = getRow(db, userId, topicId);
  return row ? Boolean(readDone(row.stepDone).solution) : false;
}

/**
 * The lesson to continue: the most recently touched one that isn't finished, in the learner's plan,
 * and still in the curriculum. Null when there's none.
 */
export function resumeFor(db: Db, content: ContentStore, user: SessionUser): LessonResume | null {
  const rows = db
    .select()
    .from(schema.lessonState)
    .where(eq(schema.lessonState.userId, user.id))
    .orderBy(desc(schema.lessonState.updatedAt))
    .limit(25)
    .all();
  if (!rows.length) return null;
  const allowed = allowedTopicIdsFor(db, user);
  for (const row of rows) {
    if (allowed !== null && !allowed.has(row.topicId)) continue;
    const found = content.getTopic(row.topicId);
    if (!found) continue;
    const view = toView(found.topic, row, lessonFacts(db, user.id, row.topicId));
    if (view.complete) continue;
    return {
      topicId: found.topic.id,
      title: found.topic.title,
      step: view.step,
      positionSec: view.step === "watch" ? view.positionSec : null,
      minutesLeft: view.minutesLeft,
      lane: laneOf(db, user.id, found.topic.id),
    };
  }
  return null;
}

function laneOf(db: Db, userId: string, topicId: string): LessonResume["lane"] {
  const week = activeWeek(db, userId);
  if (!week) return null;
  const item = db
    .select({ lane: schema.weeklyPlanItems.lane })
    .from(schema.weeklyPlanItems)
    .where(and(eq(schema.weeklyPlanItems.planId, week.id), eq(schema.weeklyPlanItems.topicId, topicId)))
    .get();
  return item?.lane ?? null;
}
