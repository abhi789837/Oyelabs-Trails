import { and, asc, eq, inArray } from "drizzle-orm";

import type { EvaluationResult } from "../../../../shared/assessment";
import { isMarkerModuleId, type PartType } from "../../../../shared/builder";
import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import type { AssignmentPriority } from "../../../../shared/oyelabsCourses";
import { higherPriority } from "../../oyelabs/assign/repo";
import { isCourseVisible, learnerVisibilityFacts } from "../../oyelabs/visibility";
import { latestPublishedPlan } from "../repo";
import type { Candidate } from "./types";

/**
 * Everything this learner could be given this week, from both places lessons live.
 *
 * The **library** is the published plan's topics plus every course they can open. The weekly plan
 * only ever schedules from this set, which is the rule that keeps the two layers honest: the week can
 * be narrow without the library shrinking, and it can never schedule something the learner would hit
 * a 404 on.
 *
 * Course lessons sit in the same list as curriculum topics rather than in a parallel one. They are
 * both "a thing to do this week" and the plan should be able to say "do this internal-process lesson
 * before that Express topic" without caring which table each came from.
 */

/** Course lessons sort after every curriculum topic, so trail order stays meaningful. */
const COURSE_ORDER_BASE = 1_000_000;

export interface LibraryInput {
  db: Db;
  content: ContentStore;
  userId: string;
}

export interface Library {
  candidates: Candidate[];
  /** Everything unlocked, done or not — the "204 lessons unlocked in your library" number. */
  lessonCount: number;
}

/**
 * Which part of the current path each course and each curriculum module belongs to. v4 attaches
 * catalog modules to the path directly, so a module's topics are Part 1 or 2 just like a course's
 * lessons — and the weekly builder puts Parts 1 and 2 in "Do it now".
 */
function currentPathParts(db: Db, userId: string) {
  const rows = currentPathRows(db, userId);
  const byModule = new Map<string, PathPlace>();
  for (const row of rows) {
    if (!row.moduleId || isMarkerModuleId(row.moduleId)) continue;
    const existing = byModule.get(row.moduleId);
    // A module serving two parts counts as the earlier one.
    if (!existing || (row.partNumber ?? 99) < (existing.partNumber ?? 99)) byModule.set(row.moduleId, placeOf(row));
  }
  return byModule;
}

type PathRow = ReturnType<typeof currentPathRows>[number];
interface PathPlace {
  partNumber: number | null;
  partType: PartType | null;
  position: number;
  targetSkill: string | null;
}

const placeOf = (row: PathRow): PathPlace => ({ partNumber: row.partNumber, partType: row.partType, position: row.position, targetSkill: row.targetSkill });

function currentPathRows(db: Db, userId: string) {
  return db
    .select({
      courseId: schema.pathItems.courseId,
      moduleId: schema.pathItems.moduleId,
      partNumber: schema.pathItems.partNumber,
      partType: schema.pathItems.partType,
      position: schema.pathItems.position,
      targetSkill: schema.pathItems.targetSkill,
    })
    .from(schema.pathItems)
    .innerJoin(schema.learningPaths, eq(schema.learningPaths.id, schema.pathItems.pathId))
    .where(and(eq(schema.learningPaths.userId, userId), eq(schema.learningPaths.current, true)))
    .all();
}

/** The candidate fields for a lesson whose module or course is on the path. */
function pathFields(place: PathPlace | undefined): Pick<Candidate, "partNumber" | "partType" | "pathPosition" | "pathTarget"> {
  if (!place || place.partNumber == null) return {};
  return { partNumber: place.partNumber, partType: place.partType ?? undefined, pathPosition: place.position, pathTarget: place.targetSkill };
}

export function gatherLibrary({ db, content, userId }: LibraryInput): Library {
  const candidates: Candidate[] = [];
  const partByModule = currentPathParts(db, userId);

  // --- Curriculum topics from the published plan ---------------------------
  const plan = latestPublishedPlan(db, userId);
  const planTopicIds = plan?.topicIds ?? [];

  const progress = db
    .select({ topicId: schema.topicProgress.topicId, status: schema.topicProgress.status })
    .from(schema.topicProgress)
    .where(eq(schema.topicProgress.userId, userId))
    .all();
  const completedTopics = new Set(progress.filter((row) => row.status === "completed").map((row) => row.topicId));

  const trackNames = new Map(content.manifest.map((track) => [track.id, track.name] as const));
  const moduleNames = new Map(
    content.manifest.flatMap((track) => track.modules.map((module) => [module.id, module.name] as const)),
  );

  for (const topicId of planTopicIds) {
    const location = content.topicIndex.get(topicId);
    if (!location) continue; // A plan can outlive a topic; the library simply does not list it.

    const moduleName = moduleNames.get(location.moduleId) ?? location.moduleId;
    const trackName = trackNames.get(location.trackId) ?? location.trackId;

    candidates.push({
      key: topicId,
      topicId,
      courseId: null,
      lessonId: null,
      title: location.meta.title,
      context: `${moduleName} · ${trackName}`,
      haystack: `${location.meta.title} ${moduleName} ${trackName}`.toLowerCase(),
      level: location.meta.level,
      minutes: location.meta.estMinutes,
      order: location.order,
      groupId: location.moduleId,
      done: completedTopics.has(topicId),
      href: `/track/${location.trackId}/module/${location.moduleId}/topic/${topicId}`,
      ...pathFields(partByModule.get(location.moduleId)),
    });
  }

  // --- Lessons from every course this learner can open ---------------------
  const published = db
    .select({
      id: schema.courses.id,
      title: schema.courses.title,
      audience: schema.courses.audience,
      position: schema.courses.position,
      published: schema.courses.published,
      departmentId: schema.courses.departmentId,
    })
    .from(schema.courses)
    .where(eq(schema.courses.published, true))
    .orderBy(asc(schema.courses.position))
    .all();

  if (published.length > 0) {
    /* v4.5: the one visibility rule (assignment, department rule, or an everyone-course in the
       learner's department), so a week never schedules a course the library would hide. */
    const facts = learnerVisibilityFacts(db, userId);
    const visible = published.filter((course) => isCourseVisible(course, facts));
    const assignment = assignmentFacts(db, userId, facts.departmentId);

    if (visible.length > 0) {
      const courseIds = visible.map((course) => course.id);
      const lessons = db
        .select({
          id: schema.courseTopics.id,
          courseId: schema.courseTopics.courseId,
          title: schema.courseTopics.title,
          estMinutes: schema.courseTopics.estMinutes,
          position: schema.courseTopics.position,
          sectionId: schema.courseTopics.sectionId,
        })
        .from(schema.courseTopics)
        .where(inArray(schema.courseTopics.courseId, courseIds))
        .all();

      const sections = db
        .select({ id: schema.courseSections.id, title: schema.courseSections.title, position: schema.courseSections.position })
        .from(schema.courseSections)
        .where(inArray(schema.courseSections.courseId, courseIds))
        .all();
      const sectionById = new Map(sections.map((section) => [section.id, section] as const));

      const doneLessons = new Set(
        db
          .select({ topicId: schema.courseProgress.topicId })
          .from(schema.courseProgress)
          .where(and(eq(schema.courseProgress.userId, userId), inArray(schema.courseProgress.courseId, courseIds)))
          .all()
          .map((row) => row.topicId),
      );

      const courseById = new Map(visible.map((course) => [course.id, course] as const));

      /* Which part of the learning path each course belongs to. Read once here rather than per
         lesson: the weekly builder uses it to put Parts 1 and 2 in the red lane, and a join per
         lesson would be the same answer a hundred times. */
      const partByCourse = new Map<string, PathPlace>();
      for (const row of currentPathRows(db, userId)) {
        if (row.courseId && !partByCourse.has(row.courseId)) partByCourse.set(row.courseId, placeOf(row));
      }

      /* Ordered the way the course reads: by course position, then section, then lesson. The absolute
         number does not matter — only that "earlier" means "earlier in the course", because that is
         what the prerequisite search relies on. */
      const ordered = [...lessons].sort((a, b) => {
        const ca = courseById.get(a.courseId)?.position ?? 0;
        const cb = courseById.get(b.courseId)?.position ?? 0;
        if (ca !== cb) return ca - cb;
        const sa = sectionById.get(a.sectionId)?.position ?? 0;
        const sb = sectionById.get(b.sectionId)?.position ?? 0;
        if (sa !== sb) return sa - sb;
        return a.position - b.position;
      });

      const courseStart = candidates.length;
      ordered.forEach((lesson, index) => {
        const course = courseById.get(lesson.courseId);
        const sectionTitle = sectionById.get(lesson.sectionId)?.title ?? "";
        const part = partByCourse.get(lesson.courseId);
        const priority = assignment.priority.get(lesson.courseId);
        candidates.push({
          key: lesson.id,
          topicId: null,
          courseId: lesson.courseId,
          lessonId: lesson.id,
          title: lesson.title,
          context: course?.title ?? "Course",
          haystack: `${lesson.title} ${sectionTitle} ${course?.title ?? ""}`.toLowerCase(),
          level: null,
          minutes: lesson.estMinutes,
          order: COURSE_ORDER_BASE + index,
          groupId: lesson.courseId,
          done: doneLessons.has(lesson.id),
          href: `/courses/${lesson.courseId}`,
          ...pathFields(part),
          ...(priority ? { assignedPriority: priority } : {}),
          ...(assignment.required.has(lesson.courseId) ? { required: true } : {}),
        });
      });
      // v4.5: prerequisites from the skill graph for the courses an admin added (weekRules.ts).
      attachPrerequisites(db, candidates, candidates.slice(courseStart), [...assignment.priority.keys(), ...assignment.required]);
    }
  }

  return { candidates, lessonCount: candidates.length };
}

/**
 * What the learner is already good at, for the first sentence of the summary.
 *
 * Read off the evaluation's own area levels rather than inferred from progress: "solid on JavaScript"
 * should mean the assessment said so, not that they ticked some boxes.
 */
export function strengthsFor(db: Db, userId: string): string[] {
  const assessment = db
    .select({ id: schema.assessments.id })
    .from(schema.assessments)
    .where(eq(schema.assessments.userId, userId))
    .orderBy(schema.assessments.attemptNo)
    .all()
    .at(-1);
  if (!assessment) return [];

  const row = db.select().from(schema.evaluations).where(eq(schema.evaluations.assessmentId, assessment.id)).get();
  if (!row) return [];

  // v4 results carry their own strengths, by skill.
  if ((row.result as { format?: string }).format === "v4") return ((row.result as { strengths?: string[] }).strengths ?? []).slice(0, 3);
  const result = row.result as EvaluationResult;
  return result.areas
    .filter((area) => area.level >= 4)
    .map((area) => area.area)
    .slice(0, 3);
}

/**
 * v4.5: each course's priority for this learner (their assignment, or a rule for their department,
 * whichever is more important) and which courses are required for everyone in their department.
 */
function assignmentFacts(db: Db, userId: string, departmentId: string) {
  const priority = new Map<string, AssignmentPriority>();
  const required = new Set<string>();
  for (const rule of db.select().from(schema.courseDepartmentRules).where(eq(schema.courseDepartmentRules.departmentId, departmentId)).all()) {
    priority.set(rule.courseId, rule.priority);
    if (rule.required) required.add(rule.courseId);
  }
  for (const row of db.select().from(schema.courseAssignments).where(eq(schema.courseAssignments.userId, userId)).all()) {
    const p = higherPriority(row.priority, priority.get(row.courseId));
    if (p) priority.set(row.courseId, p);
  }
  return { priority, required };
}

/** How many unfinished lessons one prerequisite skill may put in front of a course. */
const PREREQ_LESSONS_PER_SKILL = 2;

/**
 * v4.5: for each course an admin added, the unfinished lessons that teach a prerequisite of one of
 * its skills (`skill_edges`, type `prerequisite`): lessons of other courses tagged with that skill,
 * and curriculum topics in the skill's content modules. A prerequisite counts as unmet while any of
 * those lessons is unfinished; the first few are stored on the course's lessons as `prereqKeys`.
 */
function attachPrerequisites(db: Db, all: Candidate[], courseLessons: Candidate[], courseIds: readonly string[]): void {
  const ids = [...new Set(courseIds)];
  if (ids.length === 0) return;
  const courseSkills = db.select().from(schema.courseSkills).where(inArray(schema.courseSkills.courseId, ids)).all();
  if (courseSkills.length === 0) return;
  const edges = db
    .select({ from: schema.skillEdges.fromSkill, to: schema.skillEdges.toSkill })
    .from(schema.skillEdges)
    .where(and(eq(schema.skillEdges.type, "prerequisite"), inArray(schema.skillEdges.toSkill, [...new Set(courseSkills.map((r) => r.skillId))])))
    .all();
  if (edges.length === 0) return;
  const prereqSkills = [...new Set(edges.map((e) => e.from))];

  // Who teaches each prerequisite skill: courses tagged with it, curriculum modules listed on it.
  const teachingCourses = new Map<string, Set<string>>();
  for (const row of db.select().from(schema.courseSkills).where(inArray(schema.courseSkills.skillId, prereqSkills)).all()) {
    teachingCourses.set(row.skillId, (teachingCourses.get(row.skillId) ?? new Set()).add(row.courseId));
  }
  const modules = new Map(
    db
      .select({ id: schema.skills.id, modules: schema.skills.contentModules })
      .from(schema.skills)
      .where(inArray(schema.skills.id, prereqSkills))
      .all()
      .map((r) => [r.id, new Set(r.modules)] as const),
  );
  const lessonsFor = (skillId: string, notCourse: string) =>
    all
      .filter((c) => (c.courseId ? c.courseId !== notCourse && teachingCourses.get(skillId)?.has(c.courseId) : modules.get(skillId)?.has(c.groupId)))
      .sort((a, b) => a.order - b.order);

  for (const courseId of ids) {
    const skills = new Set(courseSkills.filter((r) => r.courseId === courseId).map((r) => r.skillId));
    const keys: string[] = [];
    for (const edge of edges.filter((e) => skills.has(e.to))) {
      const lessons = lessonsFor(edge.from, courseId);
      if (lessons.length === 0 || lessons.every((c) => c.done)) continue;
      for (const c of lessons.filter((l) => !l.done).slice(0, PREREQ_LESSONS_PER_SKILL)) if (!keys.includes(c.key)) keys.push(c.key);
    }
    if (keys.length === 0) continue;
    for (const lesson of courseLessons) if (lesson.courseId === courseId) lesson.prereqKeys = keys;
  }
}
