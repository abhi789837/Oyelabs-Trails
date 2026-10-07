import { and, asc, desc, eq, inArray } from "drizzle-orm";

import {
  EMPTY_PRIORITIES,
  GOAL_ITEM_PREFIX,
  NEW_COURSE_ITEM_PREFIX,
  addedCoursesLine,
  setupNeededMessage,
  isLegacyResearchNotice,
  type CreatingState,
  type LearnerPriorities,
  type PartType,
  type LearningPathView,
  type PathItemView,
  type PathStatus,
  type ScoredGap,
  type SkillGapView,
} from "../../../shared/builder";
import { problemLine } from "../../../shared/connection";
import { naturalReason } from "../../../shared/pathReasons";
import { schema, type Db } from "../db";
import { newId, now } from "../lib/ids";
import type { ContentStore } from "../content/store";
import { listSkillPriorities, listSkip, replaceSkipByNames, writeLegacyTargets } from "../setup/repo";
import { learnerGoalViews } from "../goals/repo";
import { sliderToPriority } from "../../../shared/setup";
import type { BuiltCourse, BuiltTopic } from "./pipeline";
import { isLevelBandedCamp, levelsFrom } from "./priorityPath";

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

/**
 * v4: `mustHave` and `skip` are projections of the slider and skip tables — the single source — so
 * the weekly plan and gap scoring read what the admin set on the Setup screen, not a stale column.
 */
function projectedMustHave(db: Db, userId: string): LearnerPriorities["mustHave"] {
  return listSkillPriorities(db, userId).map((p) => ({ skill: p.skillName, weight: sliderToPriority(p.slider) }));
}

export function getPriorities(db: Db, userId: string): LearnerPriorities {
  const row = db.select().from(schema.learnerPriorities).where(eq(schema.learnerPriorities.userId, userId)).get();
  const mustHave = projectedMustHave(db, userId);
  const skip = listSkip(db, userId).map((s) => s.skillName);
  if (!row) return { ...EMPTY_PRIORITIES, mustHave, skip };
  return {
    targetRole: row.targetRole,
    mustHave,
    skip,
    deadlineWeeks: row.deadlineWeeks,
    courseCap: row.courseCap,
    autoPublish: row.autoPublish,
    hoursPerWeek: row.hoursPerWeek,
    daysPerWeek: row.daysPerWeek,
    weekStartsMonday: row.weekStartsMonday,
  };
}

export function setPriorities(db: Db, userId: string, priorities: LearnerPriorities, actorId: string): void {
  /* Only rewrite the slider rows when the v3 caller actually changed the list: round-tripping the
     three-way projection would flatten Critical to High and Optional to Low. */
  const currentMust = projectedMustHave(db, userId);
  const currentSkip = listSkip(db, userId).map((s) => s.skillName);
  const mustChanged = JSON.stringify(currentMust) !== JSON.stringify(priorities.mustHave);
  const skipChanged = JSON.stringify(currentSkip) !== JSON.stringify(priorities.skip);
  if (mustChanged) {
    writeLegacyTargets(db, userId, priorities.mustHave.map((m) => ({ skill: m.skill, priority: m.weight })), skipChanged ? priorities.skip : null, actorId);
  } else if (skipChanged) {
    replaceSkipByNames(db, userId, priorities.skip, actorId);
  }
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
    partType?: PartType;
    /** The admin target this serves, and where its course starts. */
    targetSkill?: string | null;
    startLevel?: "beginner" | "intermediate" | "advanced" | null;
    /** v4: a curriculum module attached instead of a course, and the catalog skill served. */
    moduleId?: string | null;
    skillId?: string | null;
  },
): void {
  db.insert(schema.pathItems).values({ id: newId(), ...input }).run();
}

/** The current path for a learner, or the newest one while a run is still going. */
export function currentPath(db: Db, userId: string, content?: ContentStore): LearningPathView | null {
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

  const completedTopics = new Set(
    db
      .select({ topicId: schema.topicProgress.topicId })
      .from(schema.topicProgress)
      .where(and(eq(schema.topicProgress.userId, userId), eq(schema.topicProgress.status, "completed")))
      .all()
      .map((r) => r.topicId),
  );

  const goals = new Map(
    items.some((item) => item.moduleId?.startsWith(GOAL_ITEM_PREFIX)) ? learnerGoalViews(db, userId).map((g) => [g.id, g] as const) : [],
  );

  const waitingProblems: string[] = [];
  let failedCourses = 0;
  const rawViews: PathItemView[] = items.map((item) => {
    // v4.4: a course still being made. Never openable, and never shows a held course's title.
    if (item.moduleId?.startsWith(NEW_COURSE_ITEM_PREFIX)) {
      const info = creatingInfo(db, item.moduleId.slice(NEW_COURSE_ITEM_PREFIX.length));
      if (info.state === "waiting_setup") waitingProblems.push(info.problem ?? problemLine("search", "not_set_up"));
      if (info.state === "failed") failedCourses += 1;
      return {
        id: item.id,
        courseId: null,
        courseTitle: info.skill ?? item.targetSkill ?? "New course",
        position: item.position,
        source: item.source,
        reason: item.reason,
        topicCount: 0,
        completedCount: 0,
        available: false,
        partNumber: item.partNumber,
        partType: item.partType,
        targetSkill: item.targetSkill,
        startLevel: item.startLevel,
        moduleId: null,
        skillId: item.skillId,
        href: null,
        creating: info.state,
        problem: info.state === "waiting_setup" || info.state === "failed" ? info.problem : null,
        retryJobId: info.state === "failed" ? info.jobId : null,
      };
    }
    // v4.3: a goal's capstone. Done once the goal is achieved (passing the capstone does that).
    if (item.moduleId?.startsWith(GOAL_ITEM_PREFIX)) {
      const goalId = item.moduleId.slice(GOAL_ITEM_PREFIX.length);
      const goal = goals.get(goalId);
      const achieved = goal?.status === "achieved";
      return {
        id: item.id,
        courseId: null,
        courseTitle: `Capstone: ${goal?.capstone?.title ?? goal?.outcome ?? "practice"}`,
        position: item.position,
        source: item.source,
        reason: item.reason,
        topicCount: 1,
        completedCount: achieved ? 1 : 0,
        available: Boolean(goal),
        partNumber: item.partNumber,
        partType: item.partType,
        targetSkill: item.targetSkill,
        startLevel: item.startLevel,
        moduleId: null,
        skillId: item.skillId,
        href: goal ? `/goals/${goalId}` : null,
        goalId,
        goalAchieved: achieved,
      };
    }
    if (item.moduleId) {
      const found = content?.manifest.flatMap((track) => track.modules.map((m) => ({ track, m }))).find(({ m }) => m.id === item.moduleId);
      // v4.2: a level-banded camp counts only the topics from where this course starts.
      const levels = item.startLevel && found && isLevelBandedCamp(found.m.id) ? new Set<string>(levelsFrom(item.startLevel)) : null;
      const topicIds = found?.m.topics.filter((t) => !levels || levels.has(t.level)).map((t) => t.id) ?? [];
      return {
        id: item.id,
        courseId: null,
        courseTitle: found?.m.name ?? item.moduleId,
        position: item.position,
        source: item.source,
        reason: item.reason,
        topicCount: topicIds.length,
        completedCount: topicIds.filter((id) => completedTopics.has(id)).length,
        available: Boolean(found?.m.available ?? true),
        partNumber: item.partNumber,
        partType: item.partType,
        targetSkill: item.targetSkill,
        startLevel: item.startLevel,
        moduleId: item.moduleId,
        skillId: item.skillId,
        href: found ? `/track/${found.track.id}/module/${found.m.id}` : null,
      };
    }
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
      moduleId: null,
      skillId: item.skillId,
      href: item.courseId ? `/courses/${item.courseId}` : null,
      // v4.5 Phase 4 (D): the "Oyelabs" badge on the path.
      ...(course?.oyelabs ? { oyelabs: true as const } : {}),
    };
  });

  // v4.5 P0: reasons read naturally (older stored ones rewritten), and each course appears once.
  const views = onePerCourse(rawViews.map((view) => ({ ...view, reason: naturalReason(view.reason) })));
  const setupNeeded = waitingProblems.length > 0 ? setupNeededMessage(waitingProblems[0], waitingProblems.length) : null;
  const added = addedCourses(db, items);
  const learner = added.length > 0 ? db.select({ displayName: schema.users.displayName }).from(schema.users).where(eq(schema.users.id, userId)).get() : undefined;
  return {
    id: row.id,
    status: row.status,
    progressNote: row.progressNote,
    failureReason: row.failureReason,
    // v4.5.1: a pre-v4.4 "no research provider" notice is never shown (the re-check rebuilds that path).
    notice: setupNeeded ?? (isLegacyResearchNotice(row.notice) ? null : row.notice),
    setupNeeded,
    added,
    addedLine: added.length > 0 ? addedCoursesLine(learner?.displayName ?? "them", added.map((course) => course.title)) : null,
    failedCourses,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    items: views,
  };
}

/** What makes two path items the same course: the course, the module, the course being made, the goal. */
function sameCourseKey(item: PathItemView): string {
  if (item.goalId) return `goal:${item.goalId}`;
  if (item.courseId) return `course:${item.courseId}`;
  if (item.moduleId) return `module:${item.moduleId}`;
  if (item.creating) return `new:${(item.skillId ?? item.courseTitle).toLowerCase()}`;
  return `title:${item.courseTitle.trim().toLowerCase()}`;
}

/**
 * v4.5 P0: a course appears once on the path. A later mention of a course already scheduled (a
 * "learn first" for a second goal) is dropped, and the item it was for says "Needs: <course>
 * (earlier in your path)" instead. Exported for the tests.
 *
 * v4.5 P5: **a part never disappears.** A curriculum module often serves several parts (Business
 * Development maps most of its skills onto `bd-beginner` / `bd-intermediate`, so Part 2 and later
 * can be nothing but repeats of Part 1's modules). When every item of a part is a repeat, the
 * part's first item stays, in its place, so the path keeps Part 1 → Part 2 → the rest.
 * Repeats inside a part that has an item of its own are still dropped.
 */
export function onePerCourse(views: readonly PathItemView[]): PathItemView[] {
  const keys = views.map(sameCourseKey);
  const seen = new Set<string>();
  const repeat = keys.map((key) => {
    const again = seen.has(key);
    seen.add(key);
    return again;
  });
  const covered = new Set(views.filter((_, i) => !repeat[i]).map((view) => view.partNumber));
  const keepAnyway = new Set<number>();
  views.forEach((view, i) => {
    if (!repeat[i] || view.partNumber === null || covered.has(view.partNumber)) return;
    covered.add(view.partNumber);
    keepAnyway.add(i);
  });

  const first = new Map<string, PathItemView>();
  const kept: PathItemView[] = [];
  const pending: { title: string; itemId: string; targetSkill: string | null; index: number }[] = [];
  for (const [i, view] of views.entries()) {
    const key = keys[i];
    const earlier = first.get(key);
    if (keepAnyway.has(i)) {
      kept.push({ ...view });
      continue;
    }
    if (earlier) {
      // A repeat inside the same goal is simply dropped; for another goal it becomes a "Needs".
      if (earlier.targetSkill !== view.targetSkill) pending.push({ title: earlier.courseTitle, itemId: earlier.id, targetSkill: view.targetSkill, index: kept.length });
      continue;
    }
    const copy = { ...view };
    first.set(key, copy);
    kept.push(copy);
  }
  for (const need of pending) {
    // The item it was a "learn first" for: the next one serving the same goal, else the one before.
    const sameGoal = (item: PathItemView) => item.targetSkill === need.targetSkill && item.id !== need.itemId;
    const target = kept.slice(need.index).find(sameGoal) ?? [...kept.slice(0, need.index)].reverse().find(sameGoal);
    if (!target) continue;
    const needs = target.needs ?? [];
    if (!needs.some((n) => n.itemId === need.itemId)) target.needs = [...needs, { title: need.title, itemId: need.itemId }];
  }
  return kept;
}

/** New courses made for this path and published, in path order. */
function addedCourses(db: Db, items: readonly { courseId: string | null; source: string }[]): { courseId: string; title: string }[] {
  const ids = [...new Set(items.filter((item) => item.source === "generated" && item.courseId).map((item) => item.courseId!))];
  if (ids.length === 0) return [];
  const rows = db
    .select({ id: schema.courses.id, title: schema.courses.title })
    .from(schema.courses)
    .innerJoin(schema.generatedCourses, eq(schema.generatedCourses.courseId, schema.courses.id))
    .where(and(inArray(schema.courses.id, ids), eq(schema.courses.published, true)))
    .all();
  return ids
    .map((id) => rows.find((row) => row.id === id))
    .filter((row): row is { id: string; title: string } => Boolean(row))
    .map((row) => ({ courseId: row.id, title: row.title }));
}

/** The `course.generate` jobs still to finish (queued, running or waiting for setup). */
export const ACTIVE_JOB_STATUSES = ["queued", "running", "waiting_setup"] as const;

export interface CourseJobPayload {
  mode?: "generate" | "fix";
  key: string;
  skill: string;
  skillId?: string | null;
  caseId?: string | null;
  userId: string;
  departmentId?: string | null;
  reason?: string;
  targetRole?: string;
  level?: number;
  courseId?: string;
}

/** The `course.generate` jobs for a course key, newest first, in any status. */
export function courseJobs(db: Db, key: string) {
  return db
    .select()
    .from(schema.jobs)
    .where(eq(schema.jobs.type, "course.generate"))
    .orderBy(desc(schema.jobs.createdAt))
    .all()
    .filter((job) => (job.payload as CourseJobPayload | null)?.key === key);
}

/** The auto-course key a generated course was made for (stored with its review), if any. */
export function autoKeyOf(reviewDetail: unknown): string | null {
  const key = (reviewDetail as { autoKey?: unknown } | null)?.autoKey;
  return typeof key === "string" ? key : null;
}

/**
 * Where a course being made for this key is. A job still to finish wins; then a course held for a
 * look; then a job that gave up.
 */
export function creatingInfo(db: Db, key: string): { state: CreatingState; skill: string | null; problem: string | null; jobId: string | null } {
  const jobs = courseJobs(db, key);
  const active = jobs.find((job) => (ACTIVE_JOB_STATUSES as readonly string[]).includes(job.status));
  const skill = (jobs[0]?.payload as CourseJobPayload | undefined)?.skill ?? null;
  if (active) {
    return active.status === "waiting_setup"
      ? { state: "waiting_setup", skill, problem: active.lastError, jobId: active.id }
      : { state: "working", skill, problem: null, jobId: active.id };
  }
  const held = db
    .select({ reviewDetail: schema.generatedCourses.reviewDetail, skill: schema.generatedCourses.skill })
    .from(schema.generatedCourses)
    .where(inArray(schema.generatedCourses.status, ["needs_review", "pending_review"]))
    .all()
    .find((row) => autoKeyOf(row.reviewDetail) === key);
  if (held) return { state: "held", skill: skill ?? held.skill, problem: null, jobId: null };
  // v4.5: the newest job gave up (5 tries): its plain reason, and its id for the admin's Retry.
  const failed = jobs.find((job) => job.status === "failed");
  if (failed) return { state: "failed", skill, problem: failed.lastError, jobId: failed.id };
  return { state: jobs.length > 0 ? "failed" : "working", skill, problem: null, jobId: null };
}

// ---------------------------------------------------------------------------
// Turning a built course into a real one
// ---------------------------------------------------------------------------

export interface PersistInput {
  built: BuiltCourse;
  skill: string;
  userId: string;
  autoPublish: boolean;
  /** v4: the id the model calls were attributed to while writing. */
  courseId?: string;
  /** v4.4: stored with the review so the course can be found again (duplicates, Fix automatically). */
  extraDetail?: Record<string, unknown>;
  departmentId?: string | null;
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
  const courseId = input.courseId ?? newId();

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
        .values({ id: topicId, sectionId, courseId, title: topic.title, ...topicContent(topic), estMinutes: topic.estMinutes, position: topicIndex })
        .run();
      writeTopicSources(db, courseId, topicId, topic, timestamp);
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
      reviewDetail: input.extraDetail ? { ...built.review, ...input.extraDetail } : built.review,
      promptVersion: built.promptVersion,
      departmentId: input.departmentId ?? null,
      createdAt: timestamp,
    })
    .run();

  return { courseId, status };
}

/** The stored fields of one written lesson (everything but its place in the course). */
export function topicContent(topic: BuiltTopic) {
  return {
    body: renderBody(topic.written.summary, topic.written.keyConcepts),
    videoId: topic.written.videoId,
    videoTitle: topic.videoTitle,
    links: topic.written.references.map((reference) => ({ label: reference.label, url: reference.url })),
    practice: topic.written.practice,
    test: topic.written.test,
  };
}

/** Records every link one lesson cites. Per topic, so the weekly check knows which lesson to flag. */
export function writeTopicSources(db: Db, courseId: string, topicId: string, topic: BuiltTopic, timestamp: number): void {
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
