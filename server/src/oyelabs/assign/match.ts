import { and, asc, eq, inArray } from "drizzle-orm";

import { oyelabsCourseReason } from "../../../../shared/oyelabsCourses";
import { schema, type Db } from "../../db";
import type { AiService } from "../../ai/service";
import { cosine, courseEmbeddingText, LOCAL_EMBED_MODEL, localEmbed, localEmbedder, resolveEmbedder, storedEmbeddings, words, type Embedder } from "./embed";

/**
 * v4.5 Phase 4: which Oyelabs course fits a skill or a description (PLAN.md §4.4).
 *
 * The company's own course is preferred over anything generic, so this runs before the library,
 * the catalogue match and course generation in the path builder. Two signals, strongest first:
 *   1. the course's own skills (`course_skills`) include the skill: always a fit;
 *   2. the course's embedding is close to the skill name + aliases (or a phrase of the
 *      description). Thresholds are per embedder, because cosines are not comparable across them
 *      (`MATCH_THRESHOLDS`, calibrated on our own course texts).
 * A false match costs more than a miss here: it means no course is made for a real gap. So the
 * embedding thresholds are strict, and the course's skills are the main signal.
 */

export const MATCH_THRESHOLDS: Record<string, { skill: number; phrase: number }> = {
  [LOCAL_EMBED_MODEL]: { skill: 0.45, phrase: 0.4 },
  "text-embedding-3-small": { skill: 0.6, phrase: 0.5 },
};
const thresholdsFor = (model: string) => MATCH_THRESHOLDS[model] ?? MATCH_THRESHOLDS[LOCAL_EMBED_MODEL]!;

export interface OyelabsCourseRow {
  id: string;
  title: string;
  summary: string;
  skillIds: string[];
}

export interface OyelabsMatch {
  courseId: string;
  title: string;
  summary: string;
  /** "Added because it's Oyelabs' own process for white-label projects." */
  reason: string;
  via: "skill" | "embedding";
  score: number;
}

/**
 * Published Oyelabs courses a department may see: no `course_departments` rows (all departments),
 * or one of them is this department, or an "everyone in this department" rule names it.
 * `departmentId` null = every published Oyelabs course.
 */
export function oyelabsCoursesFor(db: Db, departmentId: string | null): OyelabsCourseRow[] {
  const courses = db
    .select({ id: schema.courses.id, title: schema.courses.title, summary: schema.courses.summary })
    .from(schema.courses)
    .where(and(eq(schema.courses.oyelabs, true), eq(schema.courses.published, true)))
    .orderBy(asc(schema.courses.position), asc(schema.courses.createdAt))
    .all();
  if (courses.length === 0) return [];
  const ids = courses.map((c) => c.id);
  const depts = new Map<string, Set<string>>();
  for (const row of db.select().from(schema.courseDepartments).where(inArray(schema.courseDepartments.courseId, ids)).all()) {
    depts.set(row.courseId, (depts.get(row.courseId) ?? new Set()).add(row.departmentId));
  }
  const ruled = new Set(
    departmentId
      ? db
          .select({ c: schema.courseDepartmentRules.courseId })
          .from(schema.courseDepartmentRules)
          .where(eq(schema.courseDepartmentRules.departmentId, departmentId))
          .all()
          .map((r) => r.c)
      : [],
  );
  const skills = new Map<string, string[]>();
  for (const row of db.select().from(schema.courseSkills).where(inArray(schema.courseSkills.courseId, ids)).all()) {
    skills.set(row.courseId, [...(skills.get(row.courseId) ?? []), row.skillId]);
  }
  return courses
    .filter((c) => {
      if (departmentId === null || ruled.has(c.id)) return true;
      const set = depts.get(c.id);
      return !set || set.size === 0 || set.has(departmentId);
    })
    .map((c) => ({ ...c, skillIds: skills.get(c.id) ?? [] }));
}

const toMatch = (course: OyelabsCourseRow, via: OyelabsMatch["via"], score: number): OyelabsMatch => ({
  courseId: course.id,
  title: course.title,
  summary: course.summary,
  reason: oyelabsCourseReason(course),
  via,
  score: Math.round(score * 1000) / 1000,
});

/** Course vectors to compare a query with, per embedder: the stored one when its model matches, else local. */
async function scorer(db: Db, courses: readonly OyelabsCourseRow[], embedder: Embedder) {
  const stored = storedEmbeddings(
    db,
    courses.map((c) => c.id),
  );
  const local = new Map<string, Float32Array>();
  const localFor = (id: string) => {
    let v = local.get(id);
    if (!v) {
      const s = stored.get(id);
      v = s && s.model === LOCAL_EMBED_MODEL ? s.vector : localEmbed(courseEmbeddingText(db, id) ?? "");
      local.set(id, v);
    }
    return v;
  };
  /** Max cosine of any query text against each course, with the model it was measured in. */
  return async (queries: readonly string[]): Promise<Map<string, { score: number; model: string }>> => {
    const out = new Map<string, { score: number; model: string }>();
    if (queries.length === 0) return out;
    const localQ = queries.map((q) => localEmbed(q));
    let remoteQ: Float32Array[] | null = null;
    if (embedder.model !== LOCAL_EMBED_MODEL && courses.some((c) => stored.get(c.id)?.model === embedder.model)) {
      try {
        remoteQ = await embedder.embed(queries);
      } catch {
        remoteQ = null; // The local comparison below still answers.
      }
    }
    for (const course of courses) {
      const s = stored.get(course.id);
      if (remoteQ && s && s.model === embedder.model && s.vector.length === remoteQ[0]?.length) {
        out.set(course.id, { score: Math.max(...remoteQ.map((q) => cosine(q, s.vector))), model: embedder.model });
      } else {
        const v = localFor(course.id);
        out.set(course.id, { score: Math.max(...localQ.map((q) => cosine(q, v))), model: LOCAL_EMBED_MODEL });
      }
    }
    return out;
  };
}

export interface SkillQuery {
  skillId?: string | null;
  name: string;
  aliases?: readonly string[];
}

/**
 * The Oyelabs course for one skill on a learner's path, or null. Called by the path builder before
 * anything generic; nothing is generated when this returns a course.
 */
export async function oyelabsCourseFor(
  db: Db,
  skill: SkillQuery,
  options: { departmentId: string | null; embedder?: Embedder; exclude?: ReadonlySet<string> },
): Promise<OyelabsMatch | null> {
  const courses = oyelabsCoursesFor(db, options.departmentId).filter((c) => !options.exclude?.has(c.id));
  if (courses.length === 0) return null;
  if (skill.skillId) {
    const tagged = courses.find((c) => c.skillIds.includes(skill.skillId!));
    if (tagged) return toMatch(tagged, "skill", 1);
  }
  const aliases = skill.aliases ?? [];
  if (!skill.skillId || aliases.length === 0) {
    const row = skill.skillId ? db.select({ aliases: schema.skills.aliases }).from(schema.skills).where(eq(schema.skills.id, skill.skillId)).get() : undefined;
    if (row) return oyelabsCourseFor(db, { ...skill, skillId: null, aliases: row.aliases }, options);
  }
  const queries = [skill.name, ...aliases].filter((q) => words(q).length > 0);
  const scores = await (await scorer(db, courses, options.embedder ?? localEmbedder))(queries);
  let best: OyelabsMatch | null = null;
  for (const course of courses) {
    const s = scores.get(course.id);
    if (!s || s.score < thresholdsFor(s.model).skill) continue;
    if (!best || s.score > best.score) best = toMatch(course, "embedding", s.score);
  }
  return best;
}

/**
 * The phrases of a description worth matching on their own: "Frontend dev, 2 yrs React, handles
 * white-label clients" → three phrases. One long sentence dilutes every phrase in it.
 */
export function descriptionPhrases(description: string): string[] {
  return [
    ...new Set(
      description
        .split(/[,;.!?\n]|\s(?:and|but|plus|also|who|that|which|we want(?: (?:him|her|them))?)\s/i)
        .map((p) => p.trim())
        .filter((p) => words(p).some((w) => w.length >= 4)),
    ),
  ].slice(0, 20);
}

export interface SuggestInput {
  description: string;
  departmentId: string | null;
  /** Skills the setup already names (goals, priorities): a course tagged with one is a fit. */
  skillIds?: readonly string[];
  limit?: number;
}

/**
 * Oyelabs courses that fit a learner description, best first, each with a plain reason. Used by the
 * onboarding preview (local embedder, synchronous callers pass nothing) and `POST …/suggest`.
 */
export async function suggestOyelabsCourses(db: Db, input: SuggestInput, embedder: Embedder = localEmbedder): Promise<OyelabsMatch[]> {
  const courses = oyelabsCoursesFor(db, input.departmentId);
  if (courses.length === 0) return [];
  const scores = await (await scorer(db, courses, embedder))(descriptionPhrases(input.description));
  return rankSuggestions(courses, scores, input);
}

/**
 * The same, synchronously, for the onboarding preview (which is synchronous and must not wait on a
 * network embedder): the local embedder only.
 */
export function suggestOyelabsCoursesSync(db: Db, input: SuggestInput): OyelabsMatch[] {
  const courses = oyelabsCoursesFor(db, input.departmentId);
  if (courses.length === 0) return [];
  const phrases = descriptionPhrases(input.description).map((p) => localEmbed(p));
  const stored = storedEmbeddings(
    db,
    courses.map((c) => c.id),
  );
  const scores = new Map<string, { score: number; model: string }>();
  for (const course of courses) {
    const s = stored.get(course.id);
    const v = s && s.model === LOCAL_EMBED_MODEL ? s.vector : localEmbed(courseEmbeddingText(db, course.id) ?? "");
    scores.set(course.id, { score: phrases.length ? Math.max(...phrases.map((q) => cosine(q, v))) : 0, model: LOCAL_EMBED_MODEL });
  }
  return rankSuggestions(courses, scores, input);
}

/** A described phrase is the stronger signal (the admin said it about this person); a shared skill also counts. */
function rankSuggestions(courses: readonly OyelabsCourseRow[], scores: ReadonlyMap<string, { score: number; model: string }>, input: SuggestInput): OyelabsMatch[] {
  const wanted = new Set(input.skillIds ?? []);
  const out: OyelabsMatch[] = [];
  for (const course of courses) {
    const tagged = Math.min(course.skillIds.filter((id) => wanted.has(id)).length, 3);
    const s = scores.get(course.id);
    const close = s && s.score >= thresholdsFor(s.model).phrase ? s.score : 0;
    if (tagged === 0 && close === 0) continue;
    if (close > 0) out.push(toMatch(course, "embedding", 0.5 + close / 2 + tagged * 0.01));
    else out.push(toMatch(course, "skill", 0.5 + tagged * 0.05));
  }
  return out.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, input.limit ?? 3);
}

/**
 * v4.5 Phase 4: the path builder's one call (`builder/run.ts`, before curriculum modules, the
 * library and generation). Returns the Oyelabs course for this skill, already given to the learner
 * (`course_assignments`, source `path`, never overwriting an admin's row), or null.
 */
export async function oyelabsCourseForPath(
  db: Db,
  ai: Pick<AiService, "embedTexts">,
  input: { skillId: string | null; skill: string; departmentId: string | null; userId: string },
): Promise<OyelabsMatch | null> {
  const match = await oyelabsCourseFor(db, { skillId: input.skillId, name: input.skill }, { departmentId: input.departmentId, embedder: resolveEmbedder(db, ai) });
  if (!match) return null;
  db.insert(schema.courseAssignments).values({ courseId: match.courseId, userId: input.userId, assignedBy: null, assignedAt: Date.now(), source: "path" }).onConflictDoNothing().run();
  return match;
}

/**
 * Synchronous "does an Oyelabs course cover this skill?" for the onboarding preview: the course's
 * skills, then the local embedder against the skill name and aliases (the same thresholds as the
 * path builder's local comparison).
 */
export function oyelabsCoversSkillSync(db: Db, courses: readonly OyelabsCourseRow[], skill: SkillQuery): boolean {
  if (courses.length === 0) return false;
  if (skill.skillId && courses.some((c) => c.skillIds.includes(skill.skillId!))) return true;
  const queries = [skill.name, ...(skill.aliases ?? [])].filter((q) => words(q).length > 0).map((q) => localEmbed(q));
  if (queries.length === 0) return false;
  const stored = storedEmbeddings(
    db,
    courses.map((c) => c.id),
  );
  const { skill: threshold } = thresholdsFor(LOCAL_EMBED_MODEL);
  return courses.some((c) => {
    const s = stored.get(c.id);
    const v = s && s.model === LOCAL_EMBED_MODEL ? s.vector : localEmbed(courseEmbeddingText(db, c.id) ?? "");
    return queries.some((q) => cosine(q, v) >= threshold);
  });
}
