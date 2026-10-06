import { z } from "zod";

export { formatOf, lengthBucket, linkedInAddUrl, outcomeLine, searchNotes } from "./meCore";

/**
 * v5 Me and Library (Phase 4): settings, notes, the profile page, and the library catalogue.
 * Settings live in `user_prefs.data` next to keys other features own (uiV5, autoplayNext, ...);
 * PUT merges, it never replaces the blob.
 */

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 18:30.");

export const THEMES = ["system", "light", "dark"] as const;
export const REDUCED_MOTION = ["system", "on", "off"] as const;

export const settingsSchema = z.object({
  theme: z.enum(THEMES),
  /** "HH:MM" local time for the daily nudge, or null for no reminder. */
  reminderTime: hhmm.nullable(),
  /** No nudges between these times (local). Null = none. */
  quietHours: z.object({ from: hhmm, to: hhmm }).nullable(),
  captions: z.boolean(),
  /** Stored as the existing `autoplayNext` key the lesson player already reads. */
  autoplayNext: z.boolean(),
  reducedMotion: z.enum(REDUCED_MOTION),
  celebrations: z.boolean(),
  weeklyEmail: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;

export const updateSettingsSchema = settingsSchema.partial().strict();
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  reminderTime: null,
  quietHours: null,
  captions: false,
  autoplayNext: true,
  reducedMotion: "system",
  celebrations: true,
  weeklyEmail: true,
};

/** Reads settings out of the prefs blob; anything missing or malformed falls back to the default. */
export function settingsFrom(data: Record<string, unknown>): Settings {
  const out = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  const shape = settingsSchema.shape as Record<string, z.ZodTypeAny>;
  for (const key of Object.keys(shape)) {
    if (!(key in data)) continue;
    const parsed = shape[key].safeParse(data[key]);
    if (parsed.success) out[key] = parsed.data;
  }
  return out as Settings;
}

/** Merges a validated change into the blob, keeping every other key (uiV5, welcomeDoneAt, ...). */
export function mergeSettings(data: Record<string, unknown>, change: UpdateSettings): Record<string, unknown> {
  const next = { ...data };
  for (const [key, value] of Object.entries(change)) if (value !== undefined) next[key] = value;
  return next;
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export interface NoteView {
  id: string;
  topicId: string;
  topicTitle: string;
  body: string;
  videoId: string | null;
  atSec: number | null;
  updatedAt: number;
  /** The lesson at that moment: `/learn/lesson/:topicId?step=watch&video=…&t=…`. */
  href: string;
}

export function noteHref(topicId: string, videoId: string | null, atSec: number | null): string {
  const base = `/learn/lesson/${encodeURIComponent(topicId)}`;
  if (atSec == null) return base;
  const params = new URLSearchParams({ step: "watch", t: String(Math.max(0, Math.floor(atSec))) });
  if (videoId) params.set("video", videoId);
  return `${base}?${params.toString()}`;
}


// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface SkillLevelView {
  skillId: string;
  name: string;
  level: number;
  source: "measured" | "inferred";
}

export interface CaseView {
  id: string;
  title: string;
  statement: string;
  achievedAt: number | null;
}

export interface CertificateView {
  id: string;
  kind: "track" | "course" | "goal";
  title: string;
  holderName: string;
  issuedAt: number;
  trackId: string;
  topicCount: number;
  averageScore: number | null;
}

export interface MeProfile {
  displayName: string;
  skills: SkillLevelView[];
  cases: CaseView[];
  certificates: CertificateView[];
  xp: { total: number; thisWeek: number; weeks: { week: string; xp: number }[] };
  streak: { current: number; best: number; freezesLeft: number; history: { week: string; met: boolean; frozen: boolean }[] } | null;
}


// ---------------------------------------------------------------------------
// Library
// ---------------------------------------------------------------------------

export type LibraryFormat = "video" | "reading" | "mixed";
export type LibraryLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type LengthBucket = "short" | "medium" | "long";

export interface LibraryItem {
  /** A course id, or `module:<trackId>:<moduleId>` for a curriculum module. */
  id: string;
  kind: "module" | "course";
  title: string;
  summary: string;
  /** "You'll be able to…" lines. */
  outcomes: string[];
  department: { id: string; name: string } | null;
  skills: { id: string; name: string }[];
  level: LibraryLevel | null;
  minutes: number;
  lessonCount: number;
  format: LibraryFormat;
  /** True when it's on the learner's path or teaches a skill their goals need. */
  recommended: boolean;
  recommendedWhy: string | null;
  doneCount: number;
  /** Where Start / Continue goes: the first unfinished lesson. */
  nextLessonHref: string | null;
}

export interface LibraryResponse {
  items: LibraryItem[];
  departments: { id: string; name: string }[];
}

export interface PrerequisiteView {
  skillId: string;
  name: string;
  /** The learner's level, 0–5, or null when not measured. */
  level: number | null;
  /** True when the level is at least `HAVE_LEVEL`. */
  have: boolean;
}

export interface SyllabusLesson {
  id: string;
  title: string;
  minutes: number;
  done: boolean;
  href: string;
  hasVideo: boolean;
}

export interface CourseDetail extends LibraryItem {
  prerequisites: PrerequisiteView[];
  syllabus: { id: string; title: string; lessons: SyllabusLesson[] }[];
  /** Newest time any of the course's sources was checked; null when none. */
  sourcesVerifiedAt: number | null;
  sourceCount: number;
}

/** A prerequisite counts as "you have it" from this level up. */
export const HAVE_LEVEL = 2;

export function prerequisiteViews(prereqIds: readonly string[], names: ReadonlyMap<string, string>, levels: Readonly<Record<string, number>>): PrerequisiteView[] {
  return [...new Set(prereqIds)].map((skillId) => {
    const level = Object.prototype.hasOwnProperty.call(levels, skillId) ? levels[skillId] : null;
    return { skillId, name: names.get(skillId) ?? skillId, level, have: level !== null && level >= HAVE_LEVEL };
  });
}

export interface RecommendSignals {
  /** Course ids and module ids on the learner's path. */
  pathCourseIds: ReadonlySet<string>;
  pathModuleIds: ReadonlySet<string>;
  /** Skill ids the learner's goals or priorities ask for, with the goal's words. */
  goalSkills: ReadonlyMap<string, string>;
  /** Their current level per skill. */
  levels: Readonly<Record<string, number>>;
  /** The level their goals aim for, per skill (default 3). */
  targets?: Readonly<Record<string, number>>;
}

/**
 * Why (or whether) to badge an item "Recommended for you": on your path wins; otherwise it teaches
 * a skill your goals need that you aren't yet at the level for. Finished items are never badged.
 */
export function recommendation(item: Pick<LibraryItem, "id" | "kind" | "skills" | "lessonCount" | "doneCount">, signals: RecommendSignals): string | null {
  if (item.lessonCount > 0 && item.doneCount >= item.lessonCount) return null;
  const moduleId = item.kind === "module" ? item.id.split(":")[2] : null;
  if ((item.kind === "course" && signals.pathCourseIds.has(item.id)) || (moduleId && signals.pathModuleIds.has(moduleId))) return "On your path";
  for (const skill of item.skills) {
    const goal = signals.goalSkills.get(skill.id);
    if (goal === undefined) continue;
    const level = signals.levels[skill.id] ?? 0;
    const target = signals.targets?.[skill.id] ?? 3;
    if (level < target) return goal ? `Helps with your goal: ${goal}` : `Builds ${skill.name}, a skill you're working on`;
  }
  return null;
}




export const moduleItemId = (trackId: string, moduleId: string) => `module:${trackId}:${moduleId}`;
export function parseModuleItemId(id: string): { trackId: string; moduleId: string } | null {
  const m = /^module:([a-z0-9-]+):([a-z0-9-]+)$/.exec(id);
  return m ? { trackId: m[1], moduleId: m[2] } : null;
}
