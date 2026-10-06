import { and, eq, inArray } from "drizzle-orm";

import {
  formatOf,
  moduleItemId,
  outcomeLine,
  parseModuleItemId,
  prerequisiteViews,
  recommendation,
  type CourseDetail,
  type LibraryItem,
  type LibraryLevel,
  type LibraryResponse,
  type RecommendSignals,
} from "../../../../shared/me";
import type { ContentStore } from "../../content/store";
import { filterManifest } from "../../content/filter";
import { currentPath } from "../../builder/repo";
import { coursesFor, mayOpenCourse } from "../../courses/repo";
import { schema, type Db } from "../../db";
import { allowedTopicIdsFor } from "../../plans/repo";
import { levelMap, skillLevels, skillNames } from "./levels";
import { plainTitle } from "../../../../shared/plainTitle";

type User = Parameters<typeof allowedTopicIdsFor>[1];

/**
 * The v5 library: curriculum modules the learner may open, plus admin-written and generated
 * courses they can see (v4.4 library courses included: those are published, `everyone` courses).
 */

const lessonHref = (topicId: string) => `/learn/lesson/${encodeURIComponent(topicId)}`;
const courseLessonHref = (courseId: string, topicId: string) => `/learn/lesson/${encodeURIComponent(topicId)}?course=${encodeURIComponent(courseId)}`;

interface ModuleStats {
  videos: number;
  words: number;
}
const statsMemo = new WeakMap<ContentStore, Map<string, ModuleStats>>();

/** Videos and reading per module, read once per content store (modules are big files). */
function moduleStats(content: ContentStore, trackId: string, moduleId: string): ModuleStats {
  let map = statsMemo.get(content);
  if (!map) {
    map = new Map();
    statsMemo.set(content, map);
  }
  const key = `${trackId}/${moduleId}`;
  const hit = map.get(key);
  if (hit) return hit;
  const mod = content.getModule(trackId, moduleId);
  const stats: ModuleStats = { videos: 0, words: 0 };
  for (const topic of mod?.topics ?? []) {
    if (topic.video?.videoId) stats.videos += 1;
    const text = [topic.summary, ...(topic.sections ?? []).map((s) => s.body)].join(" ");
    stats.words += text.split(/\s+/).filter(Boolean).length;
  }
  map.set(key, stats);
  return stats;
}

function modeLevel(levels: readonly (LibraryLevel | null | undefined)[]): LibraryLevel | null {
  const counts = new Map<LibraryLevel, number>();
  for (const l of levels) if (l) counts.set(l, (counts.get(l) ?? 0) + 1);
  let best: LibraryLevel | null = null;
  for (const [l, n] of counts) if (best === null || n > counts.get(best)!) best = l;
  return best;
}

interface Catalogue {
  skillsByModule: Map<string, { id: string; name: string; departmentId: string; prerequisites: string[] }[]>;
  skillById: Map<string, { id: string; name: string; departmentId: string; prerequisites: string[] }>;
  departments: Map<string, string>;
}

function catalogue(db: Db): Catalogue {
  const skills = db
    .select({ id: schema.skills.id, name: schema.skills.name, departmentId: schema.skills.departmentId, prerequisites: schema.skills.prerequisites, contentModules: schema.skills.contentModules })
    .from(schema.skills)
    .where(eq(schema.skills.status, "active"))
    .all();
  const skillsByModule = new Map<string, Catalogue["skillsByModule"] extends Map<string, infer V> ? V : never>();
  const skillById = new Map<string, { id: string; name: string; departmentId: string; prerequisites: string[] }>();
  for (const s of skills) {
    const entry = { id: s.id, name: s.name, departmentId: s.departmentId, prerequisites: s.prerequisites };
    skillById.set(s.id, entry);
    for (const m of s.contentModules) {
      const list = skillsByModule.get(m) ?? [];
      list.push(entry);
      skillsByModule.set(m, list);
    }
  }
  const departments = new Map(db.select({ id: schema.departments.id, name: schema.departments.name }).from(schema.departments).all().map((d) => [d.id, d.name]));
  return { skillsByModule, skillById, departments };
}

function signalsFor(db: Db, content: ContentStore, userId: string, levels: Record<string, number>): RecommendSignals {
  const path = currentPath(db, userId, content);
  const pathCourseIds = new Set<string>();
  const pathModuleIds = new Set<string>();
  for (const item of path?.items ?? []) {
    if (item.courseId) pathCourseIds.add(item.courseId);
    if (item.moduleId) pathModuleIds.add(item.moduleId);
  }
  const goalSkills = new Map<string, string>();
  const targets: Record<string, number> = {};
  const goals = db
    .select()
    .from(schema.learnerGoals)
    .where(and(eq(schema.learnerGoals.userId, userId), eq(schema.learnerGoals.status, "active")))
    .all();
  for (const g of goals) {
    for (const id of g.skillIds) {
      if (!goalSkills.has(id)) goalSkills.set(id, g.outcome);
      targets[id] = Math.max(targets[id] ?? 0, g.targetLevel);
    }
  }
  const priorities = db
    .select()
    .from(schema.learnerSkillPriorities)
    .where(eq(schema.learnerSkillPriorities.userId, userId))
    .all();
  for (const p of priorities) if (p.slider >= 3 && !goalSkills.has(p.skillId)) goalSkills.set(p.skillId, "");
  return { pathCourseIds, pathModuleIds, goalSkills, levels, targets };
}

function completedTopics(db: Db, userId: string): Set<string> {
  return new Set(
    db
      .select({ topicId: schema.topicProgress.topicId })
      .from(schema.topicProgress)
      .where(and(eq(schema.topicProgress.userId, userId), eq(schema.topicProgress.status, "completed")))
      .all()
      .map((r) => r.topicId),
  );
}

function learnerDepartment(db: Db, userId: string): string | null {
  return db.select({ d: schema.learnerProfiles.departmentId }).from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).get()?.d ?? null;
}

function moduleItems(db: Db, content: ContentStore, user: User, cat: Catalogue, done: Set<string>, fallbackDept: string | null): LibraryItem[] {
  const allowed = allowedTopicIdsFor(db, user);
  const items: LibraryItem[] = [];
  for (const track of filterManifest(content.manifest, allowed)) {
    for (const mod of track.modules) {
      if (!mod.available || mod.topics.length === 0) continue;
      const stats = moduleStats(content, track.id, mod.id);
      const skills = cat.skillsByModule.get(mod.id) ?? [];
      const level = modeLevel(mod.topics.map((t) => t.level));
      const milestonesFirst = [...mod.topics].sort((a, b) => Number(Boolean(b.isMilestone)) - Number(Boolean(a.isMilestone)));
      const deptId = skills[0]?.departmentId ?? fallbackDept;
      const next = mod.topics.find((t) => !done.has(t.id)) ?? mod.topics[0];
      items.push({
        id: moduleItemId(track.id, mod.id),
        kind: "module",
        title: mod.name,
        summary: mod.description,
        outcomes: milestonesFirst.slice(0, 3).map((t) => outcomeLine(t.title, t.level)),
        department: deptId ? { id: deptId, name: cat.departments.get(deptId) ?? deptId } : null,
        skills: skills.map((s) => ({ id: s.id, name: s.name })),
        level,
        minutes: mod.topics.reduce((s, t) => s + t.estMinutes, 0),
        lessonCount: mod.topics.length,
        format: formatOf(stats.videos, mod.topics.length, stats.words),
        recommended: false,
        recommendedWhy: null,
        doneCount: mod.topics.filter((t) => done.has(t.id)).length,
        nextLessonHref: next ? lessonHref(next.id) : null,
      });
    }
  }
  return items;
}

function courseItems(db: Db, userId: string, cat: Catalogue, courseIds?: string[]): LibraryItem[] {
  let cards = coursesFor(db, userId);
  if (courseIds) cards = cards.filter((c) => courseIds.includes(c.id));
  if (cards.length === 0) return [];
  const ids = cards.map((c) => c.id);
  const rows = db.select().from(schema.courses).where(inArray(schema.courses.id, ids)).all();
  const byId = new Map(rows.map((r) => [r.id, r]));
  const generated = new Map(
    db.select().from(schema.generatedCourses).where(inArray(schema.generatedCourses.courseId, ids)).all().map((g) => [g.courseId, g]),
  );
  const courseSkills = db.select().from(schema.courseSkills).where(inArray(schema.courseSkills.courseId, ids)).all();
  const sections = db.select().from(schema.courseSections).where(inArray(schema.courseSections.courseId, ids)).all();
  const topics = db
    .select({ id: schema.courseTopics.id, courseId: schema.courseTopics.courseId, sectionId: schema.courseTopics.sectionId, title: schema.courseTopics.title, body: schema.courseTopics.body, videoId: schema.courseTopics.videoId, position: schema.courseTopics.position })
    .from(schema.courseTopics)
    .where(inArray(schema.courseTopics.courseId, ids))
    .all();
  const done = new Set(
    db
      .select({ topicId: schema.courseProgress.topicId })
      .from(schema.courseProgress)
      .where(and(eq(schema.courseProgress.userId, userId), inArray(schema.courseProgress.courseId, ids)))
      .all()
      .map((r) => r.topicId),
  );

  return cards.map((card) => {
    const row = byId.get(card.id)!;
    const gen = generated.get(card.id);
    const level = (row.level ?? null) as LibraryLevel | null;
    const skillIds = courseSkills.filter((s) => s.courseId === card.id).map((s) => s.skillId);
    const skills = skillIds.map((id) => ({ id, name: cat.skillById.get(id)?.name ?? (gen?.skill && skillIds.length === 1 ? gen.skill : id) }));
    if (skills.length === 0 && gen?.skill) skills.push({ id: `name:${gen.skill}`, name: gen.skill });
    const secOrder = new Map(sections.filter((s) => s.courseId === card.id).map((s) => [s.id, s.position]));
    const lessons = topics
      .filter((t) => t.courseId === card.id)
      .sort((a, b) => (secOrder.get(a.sectionId) ?? 0) - (secOrder.get(b.sectionId) ?? 0) || a.position - b.position);
    const words = lessons.reduce((n, t) => n + t.body.split(/\s+/).filter(Boolean).length, 0);
    const deptId = gen?.departmentId ?? row.departmentId ?? null;
    const sectionTitles = sections
      .filter((s) => s.courseId === card.id)
      .sort((a, b) => a.position - b.position)
      .map((s) => s.title);
    const next = lessons.find((t) => !done.has(t.id)) ?? lessons[0];
    return {
      id: card.id,
      kind: "course" as const,
      title: card.title,
      summary: card.summary,
      outcomes: (sectionTitles.length ? sectionTitles : lessons.map((l) => l.title)).slice(0, 3).map((t) => outcomeLine(t, level)),
      department: deptId ? { id: deptId, name: cat.departments.get(deptId) ?? deptId } : null,
      skills,
      level,
      minutes: card.estMinutes,
      lessonCount: card.topicCount,
      format: formatOf(lessons.filter((l) => l.videoId).length, lessons.length, words),
      recommended: false,
      recommendedWhy: null,
      doneCount: card.completedCount,
      nextLessonHref: next ? courseLessonHref(card.id, next.id) : null,
    };
  });
}

export function libraryFor(db: Db, content: ContentStore, user: User): LibraryResponse {
  const cat = catalogue(db);
  const levels = levelMap(skillLevels(db, user.id));
  const signals = signalsFor(db, content, user.id, levels);
  const dept = learnerDepartment(db, user.id);
  const items = [...moduleItems(db, content, user, cat, completedTopics(db, user.id), dept), ...courseItems(db, user.id, cat)].map((item) => {
    const why = recommendation(item, signals);
    return { ...item, recommended: why !== null, recommendedWhy: why };
  });
  const used = new Map<string, string>();
  for (const item of items) if (item.department) used.set(item.department.id, item.department.name);
  return { items, departments: [...used].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)) };
}

export function courseDetailFor(db: Db, content: ContentStore, user: User, id: string): CourseDetail | null {
  const cat = catalogue(db);
  const levelList = skillLevels(db, user.id);
  const levels = levelMap(levelList);
  const signals = signalsFor(db, content, user.id, levels);
  const names = new Map<string, string>([...cat.skillById].map(([k, v]) => [k, v.name]));
  for (const l of levelList) if (!names.has(l.skillId)) names.set(l.skillId, l.name);
  const withRec = (item: LibraryItem) => {
    const why = recommendation(item, signals);
    return { ...item, recommended: why !== null, recommendedWhy: why };
  };
  const prereqsOf = (skillIds: string[]) => {
    const own = new Set(skillIds);
    const ids = skillIds.flatMap((s) => cat.skillById.get(s)?.prerequisites ?? []).filter((p) => !own.has(p));
    for (const p of ids) if (!names.has(p)) names.set(p, skillNames(db, [p]).get(p) ?? p);
    return prerequisiteViews(ids, names, levels);
  };

  const mod = parseModuleItemId(id);
  if (mod) {
    const done = completedTopics(db, user.id);
    const item = moduleItems(db, content, user, cat, done, learnerDepartment(db, user.id)).find((i) => i.id === id);
    if (!item) return null;
    const meta = content.manifest.find((t) => t.id === mod.trackId)?.modules.find((m) => m.id === mod.moduleId);
    const allowed = allowedTopicIdsFor(db, user);
    const topics = (meta?.topics ?? []).filter((t) => allowed === null || allowed.has(t.id));
    const full = content.getModule(mod.trackId, mod.moduleId);
    const hasVideo = new Map((full?.topics ?? []).map((t) => [t.id, Boolean(t.video?.videoId)]));
    return {
      ...withRec(item),
      prerequisites: prereqsOf(item.skills.map((s) => s.id)),
      syllabus: [
        {
          id: mod.moduleId,
          title: item.title,
          lessons: topics.map((t) => ({ id: t.id, title: plainTitle(t.title), minutes: t.estMinutes, done: done.has(t.id), href: lessonHref(t.id), hasVideo: hasVideo.get(t.id) ?? false })),
        },
      ],
      sourcesVerifiedAt: null,
      sourceCount: full ? full.topics.reduce((n, t) => n + (t.webRefs?.length ?? 0), 0) : 0,
    };
  }

  if (!mayOpenCourse(db, user.id, id)) return null;
  const item = courseItems(db, user.id, cat, [id])[0];
  if (!item) return null;
  const sections = db.select().from(schema.courseSections).where(eq(schema.courseSections.courseId, id)).all().sort((a, b) => a.position - b.position);
  const lessons = db.select().from(schema.courseTopics).where(eq(schema.courseTopics.courseId, id)).all().sort((a, b) => a.position - b.position);
  const done = new Set(
    db
      .select({ topicId: schema.courseProgress.topicId })
      .from(schema.courseProgress)
      .where(and(eq(schema.courseProgress.userId, user.id), eq(schema.courseProgress.courseId, id)))
      .all()
      .map((r) => r.topicId),
  );
  const sources = db.select({ verifiedAt: schema.courseSources.verifiedAt }).from(schema.courseSources).where(eq(schema.courseSources.courseId, id)).all();
  const verified = sources.map((s) => s.verifiedAt).filter((v): v is number => typeof v === "number");
  return {
    ...withRec(item),
    prerequisites: prereqsOf(item.skills.map((s) => s.id).filter((s) => !s.startsWith("name:"))),
    syllabus: sections.map((s) => ({
      id: s.id,
      title: s.title,
      lessons: lessons
        .filter((l) => l.sectionId === s.id)
        .map((l) => ({ id: l.id, title: l.title, minutes: l.estMinutes, done: done.has(l.id), href: courseLessonHref(id, l.id), hasVideo: Boolean(l.videoId) })),
    })),
    sourcesVerifiedAt: verified.length ? Math.max(...verified) : null,
    sourceCount: sources.length,
  };
}
