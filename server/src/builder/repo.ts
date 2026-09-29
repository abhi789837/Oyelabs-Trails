import { and, asc, desc, eq } from "drizzle-orm";

import {
  EMPTY_PRIORITIES,
  type LearnerPriorities,
  type LearningPathView,
  type PathItemView,
  type PathStatus,
  type ScoredGap,
  type SkillGapView,
} from "../../../shared/builder";
import { schema, type Db } from "../db";
import { newId, now } from "../lib/ids";
import type { BuiltCourse } from "./pipeline";

/** The statuses a generated course can hold. Mirrors the column's own union. */
type GeneratedStatus = "draft" | "pending_review" | "published" | "rejected" | "needs_review";

/**
 * Storing what the builder produced.
 *
 * The one thing worth stating up front: a generated course is **a row in `courses`**, not a
 * parallel kind of object. It is rendered by the same page, edited by the same editor, and ticked
 * off with the same progress table. `generated_courses` only records what is true *about* it —
 * which gap it answers, how it scored, and whether it has been promoted.
 */

// ---------------------------------------------------------------------------
// Priorities
// ---------------------------------------------------------------------------

export function getPriorities(db: Db, userId: string): LearnerPriorities {
  const row = db.select().from(schema.learnerPriorities).where(eq(schema.learnerPriorities.userId, userId)).get();
  if (!row) return EMPTY_PRIORITIES;
  return {
    targetRole: row.targetRole,
    mustHave: row.mustHave ?? [],
    skip: row.skip ?? [],
    deadlineWeeks: row.deadlineWeeks,
    courseCap: row.courseCap,
    autoPublish: row.autoPublish,
    hoursPerWeek: row.hoursPerWeek,
    daysPerWeek: row.daysPerWeek,
    weekStartsMonday: row.weekStartsMonday,
  };
}

export function setPriorities(db: Db, userId: string, priorities: LearnerPriorities, actorId: string): void {
  const values = {
    targetRole: priorities.targetRole,
    mustHave: priorities.mustHave,
    skip: priorities.skip,
    deadlineWeeks: priorities.deadlineWeeks,
    courseCap: priorities.courseCap,
    autoPublish: priorities.autoPublish,
    hoursPerWeek: priorities.hoursPerWeek,
    daysPerWeek: priorities.daysPerWeek,
    weekStartsMonday: priorities.weekStartsMonday,
    updatedBy: actorId,
    updatedAt: now(),
  };
  const existing = db
    .select({ userId: schema.learnerPriorities.userId })
    .from(schema.learnerPriorities)
    .where(eq(schema.learnerPriorities.userId, userId))
    .get();

  if (existing) {
    db.update(schema.learnerPriorities).set(values).where(eq(schema.learnerPriorities.userId, userId)).run();
  } else {
    db.insert(schema.learnerPriorities).values({ userId, ...values }).run();
  }
}

// ---------------------------------------------------------------------------
// Gaps
// ---------------------------------------------------------------------------

/**
 * Replaces this learner's gap map.
 *
 * Wholesale rather than merged: a gap map is a reading of one assessment at one moment, and half of
 * an old reading mixed with half of a new one describes nobody. The rows are re-created, so an id
 * is not stable across runs — nothing points at a gap except the path built from it, and that is
 * rebuilt at the same time.
 */
export function replaceGaps(db: Db, userId: string, assessmentId: string | null, gaps: ScoredGap[]): Map<string, string> {
  db.delete(schema.skillGaps).where(eq(schema.skillGaps.userId, userId)).run();

  const ids = new Map<string, string>();
  const timestamp = now();
  for (const gap of gaps) {
    const id = newId();
    ids.set(gap.skill, id);
    db.insert(schema.skillGaps)
      .values({
        id,
        userId,
        assessmentId,
        skill: gap.skill,
        severity: gap.severity,
        evidence: gap.evidence,
        source: gap.source,
        priorityScore: gap.priorityScore,
        skipped: gap.skipped,
        createdAt: timestamp,
      })
      .run();
  }
  return ids;
}

export function listGaps(db: Db, userId: string): SkillGapView[] {
  return db
    .select()
    .from(schema.skillGaps)
    .where(eq(schema.skillGaps.userId, userId))
    .orderBy(desc(schema.skillGaps.priorityScore))
    .all()
    .map((row) => ({
      id: row.id,
      skill: row.skill,
      severity: row.severity,
      source: row.source,
      priorityScore: row.priorityScore,
      skipped: row.skipped,
      evidence: row.evidence,
    }));
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

export function startPath(db: Db, userId: string, assessmentId: string | null): string {
  const id = newId();
  db.insert(schema.learningPaths)
    .values({ id, userId, assessmentId, status: "analysing", current: false, createdAt: now() })
    .run();
  return id;
}

export function setPathStatus(
  db: Db,
  pathId: string,
  patch: {
    status?: PathStatus;
    progressNote?: string;
    /** Something worth telling the admin about a run that worked. See the column comment. */
    notice?: string | null;
    failureReason?: string | null;
    tokensUsed?: number;
    searchCalls?: number;
  },
): void {
  db.update(schema.learningPaths).set(patch).where(eq(schema.learningPaths.id, pathId)).run();
}

/**
 * Marks a finished path as the current one, and demotes the previous.
 *
 * Two steps in one function on purpose: a moment where a learner has two current paths, or none,
 * is a moment where the dashboard shows either the wrong path or an empty one.
 */
export function makeCurrent(db: Db, userId: string, pathId: string): void {
  db.update(schema.learningPaths)
    .set({ current: false })
    .where(eq(schema.learningPaths.userId, userId))
    .run();
  db.update(schema.learningPaths)
    .set({ current: true, status: "ready", completedAt: now(), progressNote: "" })
    .where(eq(schema.learningPaths.id, pathId))
    .run();
}

export function addPathItem(
  db: Db,
  input: {
    pathId: string;
    courseId: string | null;
    gapId: string | null;
    position: number;
    source: "unlock" | "reuse" | "generated";
    reason: string;
    /** Which part of the path this is. Absent on a path built before parts existed. */
    partNumber?: number;
    partType?: "track" | "ai_dev" | "general";
    /** The admin target this serves, and where its course starts. */
    targetSkill?: string | null;
    startLevel?: "beginner" | "intermediate" | "advanced" | null;
  },
): void {
  db.insert(schema.pathItems).values({ id: newId(), ...input }).run();
}

/** The current path for a learner, or the newest one while a run is still going. */
export function currentPath(db: Db, userId: string): LearningPathView | null {
  const row =
    db
      .select()
      .from(schema.learningPaths)
      .where(and(eq(schema.learningPaths.userId, userId), eq(schema.learningPaths.current, true)))
      .get() ??
    db
      .select()
      .from(schema.learningPaths)
      .where(eq(schema.learningPaths.userId, userId))
      .orderBy(desc(schema.learningPaths.createdAt))
      .get();
  if (!row) return null;

  const items = db
    .select()
    .from(schema.pathItems)
    .where(eq(schema.pathItems.pathId, row.id))
    .orderBy(asc(schema.pathItems.position))
    .all();

  const views: PathItemView[] = items.map((item) => {
    const course = item.courseId
      ? db.select().from(schema.courses).where(eq(schema.courses.id, item.courseId)).get()
      : undefined;

    const topics = item.courseId
      ? db
          .select({ id: schema.courseTopics.id })
          .from(schema.courseTopics)
          .where(eq(schema.courseTopics.courseId, item.courseId))
          .all()
      : [];

    const done = item.courseId
      ? db
          .select({ topicId: schema.courseProgress.topicId })
          .from(schema.courseProgress)
          .where(and(eq(schema.courseProgress.userId, userId), eq(schema.courseProgress.courseId, item.courseId)))
          .all()
      : [];

    return {
      id: item.id,
      courseId: item.courseId,
      courseTitle: course?.title ?? "(removed)",
      position: item.position,
      source: item.source,
      reason: item.reason,
      topicCount: topics.length,
      completedCount: done.length,
      // A generated course sitting in review is on the path but not yet openable. Saying so beats
      // a link that 404s, and beats hiding it — the learner can see what is coming.
      available: Boolean(course?.published),
      partNumber: item.partNumber,
      partType: item.partType,
      targetSkill: item.targetSkill,
      startLevel: item.startLevel,
    };
  });

  return {
    id: row.id,
    status: row.status,
    progressNote: row.progressNote,
    failureReason: row.failureReason,
    notice: row.notice,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    items: views,
  };
}

// ---------------------------------------------------------------------------
// Turning a built course into a real one
// ---------------------------------------------------------------------------

export interface PersistInput {
  built: BuiltCourse;
  skill: string;
  userId: string;
  autoPublish: boolean;
}

/**
 * Writes a generated course into the ordinary course tables.
 *
 * Publishing is the interesting decision. A course only goes straight to `published` when the admin
 * asked for that *and* the review passed — the two conditions are separate, because auto-publish is
 * a statement about trust in the process, not an instruction to ship something the process itself
 * judged inadequate.
 */
export function persistCourse(db: Db, input: PersistInput): { courseId: string; status: GeneratedStatus } {
  const { built, skill, userId, autoPublish } = input;
  const timestamp = now();
  const courseId = newId();

  const published = autoPublish && built.passed;
  const status: GeneratedStatus = published ? "published" : built.passed ? "pending_review" : "needs_review";

  db.insert(schema.courses)
    .values({
      id: courseId,
      title: built.plan.title,
      summary: built.plan.summary,
      accent: "ridge",
      // Generated courses are for the person they were built for, never the whole company —
      // promotion to the catalogue is a separate, deliberate act by an admin.
      audience: "assigned",
      published,
      origin: "generated",
      position: 0,
      createdBy: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();

  db.insert(schema.courseAssignments)
    .values({ courseId, userId, assignedBy: null, assignedAt: timestamp })
    .run();

  built.sections.forEach((section, sectionIndex) => {
    const sectionId = newId();
    db.insert(schema.courseSections)
      .values({ id: sectionId, courseId, title: section.title, summary: section.summary, position: sectionIndex })
      .run();

    section.topics.forEach((topic, topicIndex) => {
      const topicId = newId();
      db.insert(schema.courseTopics)
        .values({
          id: topicId,
          sectionId,
          courseId,
          title: topic.title,
          body: renderBody(topic.written.summary, topic.written.keyConcepts),
          videoId: topic.written.videoId,
          videoTitle: topic.videoTitle,
          links: topic.written.references.map((reference) => ({ label: reference.label, url: reference.url })),
          practice: topic.written.practice,
          test: topic.written.test,
          estMinutes: topic.estMinutes,
          position: topicIndex,
        })
        .run();

      // Recorded per topic so the weekly check knows which lesson to flag, not just which course.
      for (const reference of topic.written.references) {
        const source = topic.sources.find((candidate) => candidate.url === reference.url);
        db.insert(schema.courseSources)
          .values({
            id: newId(),
            courseId,
            topicId,
            url: reference.url,
            kind: "article",
            title: reference.label,
            httpStatus: source?.httpStatus ?? 200,
            verifiedAt: timestamp,
          })
          .run();
      }
      if (topic.written.videoId) {
        db.insert(schema.courseSources)
          .values({
            id: newId(),
            courseId,
            topicId,
            url: `https://www.youtube.com/watch?v=${topic.written.videoId}`,
            kind: "video",
            title: topic.videoTitle ?? "",
            httpStatus: 200,
            verifiedAt: timestamp,
          })
          .run();
      }
    });
  });

  db.insert(schema.generatedCourses)
    .values({
      courseId,
      skill,
      userId,
      scope: "learner",
      status,
      reviewScore: built.score,
      reviewDetail: built.review,
      promptVersion: built.promptVersion,
      createdAt: timestamp,
    })
    .run();

  return { courseId, status };
}

/**
 * The lesson body, as the existing renderer expects it.
 *
 * Key concepts are folded into the prose rather than stored separately, because `RichText` is what
 * renders a course lesson and adding a second field would mean a second renderer. A bullet list at
 * the end is the shape a reader expects anyway.
 */
function renderBody(summary: string, keyConcepts: string[]): string {
  if (keyConcepts.length === 0) return summary;
  return `${summary}\n\nKey concepts:\n${keyConcepts.map((concept) => `- ${concept}`).join("\n")}`;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export function auditStep(
  db: Db,
  input: {
    pathId: string | null;
    courseId?: string | null;
    step: string;
    promptVersion?: string;
    model?: string;
    detail: unknown;
    inputTokens?: number;
    outputTokens?: number;
    actorId?: string | null;
  },
): void {
  db.insert(schema.aiAuditLog)
    .values({
      id: newId(),
      pathId: input.pathId,
      courseId: input.courseId ?? null,
      step: input.step,
      promptVersion: input.promptVersion ?? "",
      model: input.model ?? "",
      detail: input.detail,
      inputTokens: input.inputTokens ?? 0,
      outputTokens: input.outputTokens ?? 0,
      actorId: input.actorId ?? null,
      createdAt: now(),
    })
    .run();
}
