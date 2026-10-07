import { z } from "zod";

import type { ModuleTestStatus } from "./moduleTests";
import type { DocLinkKind, DurationSource, LinkProblem, LinkStatus, PlayerKind, TrackingMode, VideoSourceKind } from "./videoSources";

/**
 * v4.5: "Add an Oyelabs course" (docs/v4.5/PLAN.md).
 *
 * An Oyelabs course is a normal `courses` row with `oyelabs = true` and a few extra rows:
 *   - modules are `course_sections`; each module owns exactly one managed lesson
 *     (`course_topics.kind = 'module'`) that carries its playlist, docs, notes and module test;
 *   - videos are `course_videos`, docs are `course_docs`, files are `media_uploads`;
 *   - departments are `course_departments` (none = all departments);
 *   - skills are `course_skills`;
 *   - versions are `content_versions` (entity "course"), as for every course.
 * So the library, paths, weekly plans, certificates and progress treat it like any course.
 *
 * This file is the editor ↔ API contract (builder A) and the assignment contract (builder D).
 */

// ---------------------------------------------------------------------------
// Fixed lists
// ---------------------------------------------------------------------------

/** Same values as `courses.level`; `expert` is shown as "Super advanced". */
export const OYELABS_LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;
export const oyelabsLevelSchema = z.enum(OYELABS_LEVELS);
export type OyelabsLevel = z.infer<typeof oyelabsLevelSchema>;
export const OYELABS_LEVEL_LABELS: Record<OyelabsLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Super advanced",
};

/** The badge text on cards, the lesson header and the certificate. Learner bundles use `OYELABS_BADGE_TEXT` (oyelabsCore.ts, zod-free). */
export const OYELABS_BADGE = "Oyelabs";

/** Assignment priority (Phase 4). Maps onto the week lanes: most_important → do_now first weeks. */
export const ASSIGNMENT_PRIORITIES = ["most_important", "important", "nice_to_have"] as const;
export const assignmentPrioritySchema = z.enum(ASSIGNMENT_PRIORITIES);
export type AssignmentPriority = z.infer<typeof assignmentPrioritySchema>;
export const ASSIGNMENT_PRIORITY_LABELS: Record<AssignmentPriority, string> = {
  most_important: "Most important",
  important: "Important",
  nice_to_have: "Nice to have",
};

/** How a `course_assignments` row got there. */
export const ASSIGNMENT_SOURCES = ["admin", "department", "path"] as const;
export type AssignmentSource = (typeof ASSIGNMENT_SOURCES)[number];

/** `course_topics.kind`. `module` = the one managed lesson of an Oyelabs module. */
export const COURSE_TOPIC_KINDS = ["lesson", "module"] as const;
export type CourseTopicKind = (typeof COURSE_TOPIC_KINDS)[number];

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------

/** Docs: PDF/DOCX/PPTX/XLSX/TXT/MD up to 50 MB (brief Phase 1). */
export const DOC_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;
/** Videos uploaded to Oyelearn. Streamed to disk, never buffered. Caddy/nginx limits are sized to this. */
export const VIDEO_UPLOAD_MAX_BYTES = 1024 * 1024 * 1024;

export const DOC_UPLOAD_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  md: "text/markdown",
} as const;
export type DocUploadExt = keyof typeof DOC_UPLOAD_TYPES;

/** Browser-playable as is; anything else (mov, mkv, avi, …) is transcoded to MP4 (H.264/AAC). */
export const VIDEO_PLAYABLE_MIMES = ["video/mp4", "video/webm"] as const;
export const VIDEO_UPLOAD_EXTENSIONS = ["mp4", "webm", "mov", "m4v", "mkv", "avi"] as const;

export const UPLOAD_KINDS = ["doc", "video"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];
export const TRANSCODE_STATUSES = ["none", "pending", "running", "done", "failed"] as const;
export type TranscodeStatus = (typeof TRANSCODE_STATUSES)[number];

export interface UploadView {
  id: string;
  kind: UploadKind;
  name: string;
  mime: string;
  bytes: number;
  transcode: TranscodeStatus;
  durationSeconds: number | null;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Editor input (Save & publish / Save as draft)
// ---------------------------------------------------------------------------

const id = z.string().min(1).max(64);

/**
 * One video in a module. Exactly one of `url` (a pasted link) and `uploadId`. `id` is present for a
 * video that already exists, so its learners' progress is kept when the course is edited.
 */
export const moduleVideoInputSchema = z
  .object({
    id: id.optional(),
    url: z.string().trim().min(4).max(2000).optional(),
    uploadId: id.optional(),
    /** Overrides the title the resolver found. */
    title: z.string().trim().max(200).optional(),
    /** Admin-entered length for an embed we cannot measure (estimated tracking). */
    durationSeconds: z.number().int().min(1).max(86_400).nullable().optional(),
  })
  .refine((v) => Boolean(v.url) !== Boolean(v.uploadId), { message: "Paste a link or upload a file." });
export type ModuleVideoInput = z.infer<typeof moduleVideoInputSchema>;

/** One document: an upload or a link. Same `id` rule as videos. */
export const moduleDocInputSchema = z
  .object({
    id: id.optional(),
    url: z.string().trim().min(4).max(2000).optional(),
    uploadId: id.optional(),
    title: z.string().trim().max(200).optional(),
  })
  .refine((v) => Boolean(v.url) !== Boolean(v.uploadId), { message: "Upload a file or paste a link." });
export type ModuleDocInput = z.infer<typeof moduleDocInputSchema>;

/** Tiptap JSON (`editor.getJSON()`). Kept small; rendered read-only for learners. */
export const notesDocSchema = z.object({ type: z.literal("doc"), content: z.array(z.unknown()).max(2000) });
export type NotesDoc = z.infer<typeof notesDocSchema>;

export const oyelabsModuleInputSchema = z.object({
  /** `course_sections.id` of an existing module; absent for a new one. */
  id: id.optional(),
  title: z.string().trim().min(2, "Give each module a title of at least 2 letters.").max(120, "Keep module titles under 120 letters."),
  videos: z.array(moduleVideoInputSchema).max(40),
  docs: z.array(moduleDocInputSchema).max(40),
  notes: notesDocSchema.nullable(),
});
export type OyelabsModuleInput = z.infer<typeof oyelabsModuleInputSchema>;

export const oyelabsCourseInputSchema = z.object({
  title: z.string().trim().min(2, "Give the course a title of at least 2 letters.").max(120, "Keep the title under 120 letters."),
  /** `courses.summary`. */
  description: z.string().trim().max(400, "Keep the description under 400 letters."),
  level: oyelabsLevelSchema,
  /** Empty = all departments. */
  departmentIds: z.array(id).max(50),
  skillIds: z.array(id).max(20, "Pick 20 skills at most."),
  modules: z.array(oyelabsModuleInputSchema).min(1, "Add at least one module.").max(30, "A course can have 30 modules at most."),
});
export type OyelabsCourseInput = z.infer<typeof oyelabsCourseInputSchema>;

export const saveOyelabsCourseRequestSchema = z.object({
  course: oyelabsCourseInputSchema,
  /** `publish`: live in the chosen departments' library, module tests queued. `draft`: saved, invisible. */
  action: z.enum(["publish", "draft"]),
  /** The autosave draft this save came from; deleted once saved. */
  draftId: id.optional(),
  /** Optional note on the version ("Added the Q3 rates sheet"). */
  note: z.string().trim().max(200).optional(),
});
export type SaveOyelabsCourseRequest = z.infer<typeof saveOyelabsCourseRequestSchema>;

export interface SaveOyelabsCourseResponse {
  courseId: string;
  /** The `content_versions` version this save created (or the latest, when nothing changed). */
  version: number;
  published: boolean;
  /** Modules whose test was queued for (re)generation because their material changed. */
  regenerating: string[];
}

// ---------------------------------------------------------------------------
// Autosave drafts
// ---------------------------------------------------------------------------

/**
 * Whatever the editor holds, saved every few seconds. Deliberately loose (half-typed titles, a
 * module with no title yet): it is validated with `oyelabsCourseInputSchema` only on Save.
 */
export const oyelabsDraftDataSchema = z.object({
  title: z.string().max(120).default(""),
  description: z.string().max(400).default(""),
  level: oyelabsLevelSchema.nullable().default(null),
  departmentIds: z.array(id).max(50).default([]),
  skillIds: z.array(id).max(20).default([]),
  modules: z
    .array(
      z.object({
        id: id.optional(),
        /** Client-side key for a module that has no id yet (drag/drop). */
        key: z.string().max(64).optional(),
        title: z.string().max(120).default(""),
        videos: z.array(z.object({ id: id.optional(), url: z.string().max(2000).optional(), uploadId: id.optional(), title: z.string().max(200).optional(), durationSeconds: z.number().int().min(1).max(86_400).nullable().optional() })).max(40).default([]),
        docs: z.array(z.object({ id: id.optional(), url: z.string().max(2000).optional(), uploadId: id.optional(), title: z.string().max(200).optional() })).max(40).default([]),
        notes: notesDocSchema.nullable().default(null),
      }),
    )
    .max(30)
    .default([]),
});
export type OyelabsDraftData = z.infer<typeof oyelabsDraftDataSchema>;

export const putOyelabsDraftRequestSchema = z.object({
  /** The live course this draft edits; null for a brand-new course. */
  courseId: id.nullable(),
  data: oyelabsDraftDataSchema,
});
export type PutOyelabsDraftRequest = z.infer<typeof putOyelabsDraftRequestSchema>;

export interface OyelabsDraftView {
  id: string;
  courseId: string | null;
  data: OyelabsDraftData;
  updatedAt: number;
}

/** One reason a draft can't be saved yet, in plain words. `path` points at the field ("modules.1.title"). */
export interface OyelabsSaveProblem {
  path: string;
  message: string;
}

/**
 * Everything that stops a draft from being saved, in the order the page shows it. Used by the
 * editor before Save (so the admin sees every problem at once) and by the server for its message.
 */
export function oyelabsSaveProblems(data: OyelabsDraftData): OyelabsSaveProblem[] {
  const problems: OyelabsSaveProblem[] = [];
  if (data.title.trim().length < 2) problems.push({ path: "title", message: "Give the course a title of at least 2 letters." });
  if (data.description.trim().length > 400) problems.push({ path: "description", message: "Keep the description under 400 letters." });
  if (!data.level) problems.push({ path: "level", message: "Pick a level." });
  if (data.modules.length === 0) problems.push({ path: "modules", message: "Add at least one module." });
  data.modules.forEach((m, i) => {
    const name = `Module ${i + 1}`;
    if (m.title.trim().length < 2) problems.push({ path: `modules.${i}.title`, message: `${name} needs a title of at least 2 letters.` });
    m.videos.forEach((v, j) => {
      if (Boolean(v.url?.trim()) === Boolean(v.uploadId)) problems.push({ path: `modules.${i}.videos.${j}`, message: `${name}, video ${j + 1}: paste a link or upload a file.` });
    });
    m.docs.forEach((d, j) => {
      if (Boolean(d.url?.trim()) === Boolean(d.uploadId)) problems.push({ path: `modules.${i}.docs.${j}`, message: `${name}, document ${j + 1}: upload a file or paste a link.` });
    });
  });
  return problems;
}

/** The draft as a save request's `course`, or the problems that stop it. Pure; the editor and tests use it. */
export function draftToCourseInput(data: OyelabsDraftData): { ok: true; input: OyelabsCourseInput } | { ok: false; problems: OyelabsSaveProblem[] } {
  const problems = oyelabsSaveProblems(data);
  if (problems.length) return { ok: false, problems };
  const optionalTitle = (t: string | undefined) => (t && t.trim() ? { title: t.trim() } : {});
  const candidate = {
    title: data.title.trim(),
    description: data.description.trim(),
    level: data.level,
    departmentIds: [...new Set(data.departmentIds)],
    skillIds: [...new Set(data.skillIds)],
    modules: data.modules.map((m) => ({
      ...(m.id ? { id: m.id } : {}),
      title: m.title.trim(),
      videos: m.videos.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        ...(v.uploadId ? { uploadId: v.uploadId } : { url: v.url!.trim() }),
        ...optionalTitle(v.title),
        ...(v.durationSeconds != null ? { durationSeconds: v.durationSeconds } : {}),
      })),
      docs: m.docs.map((d) => ({ ...(d.id ? { id: d.id } : {}), ...(d.uploadId ? { uploadId: d.uploadId } : { url: d.url!.trim() }), ...optionalTitle(d.title) })),
      notes: m.notes,
    })),
  };
  const parsed = oyelabsCourseInputSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, problems: parsed.error.issues.map((issue) => ({ path: issue.path.map(String).join("."), message: plainIssue(issue.message) })) };
  }
  return { ok: true, input: parsed.data };
}

/** zod's own wording ("String must contain…") is not for people; our custom messages are kept. */
function plainIssue(message: string): string {
  return /^(String|Array|Number|Invalid|Expected|Required)/.test(message) ? "Something on the page isn't filled in right. Check the highlighted part." : message;
}

/** What the editor starts from when it opens a saved course. */
export function draftFromCourseView(view: OyelabsCourseView): OyelabsDraftData {
  return {
    title: view.title,
    description: view.description,
    level: view.level,
    departmentIds: [...view.departmentIds],
    skillIds: [...view.skillIds],
    modules: view.modules.map((m) => ({
      id: m.id,
      key: m.id,
      title: m.title,
      videos: m.videos.map((v) => ({
        id: v.id,
        ...(v.uploadId ? { uploadId: v.uploadId } : { url: v.input ?? "" }),
        ...(v.titleLocked && v.title ? { title: v.title } : {}),
        ...(v.durationSource === "admin" && v.durationSeconds != null ? { durationSeconds: Math.max(1, Math.round(v.durationSeconds)) } : {}),
      })),
      docs: m.docs.map((d) => ({ id: d.id, ...(d.uploadId ? { uploadId: d.uploadId } : { url: d.url ?? "" }), ...(d.titleLocked && d.title ? { title: d.title } : {}) })),
      notes: m.notes,
    })),
  };
}

// ---------------------------------------------------------------------------
// What the editor reads back
// ---------------------------------------------------------------------------

export interface OyelabsVideoView {
  id: string;
  position: number;
  input: string | null;
  uploadId: string | null;
  kind: VideoSourceKind;
  playerKind: PlayerKind;
  tracking: TrackingMode;
  title: string;
  /** v4.5 A (additive): the admin typed the title, so the editor sends it back on Save. */
  titleLocked?: boolean;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  /** v4.5 A (additive): `admin` = typed in the editor, so the editor sends it back on Save. */
  durationSource?: DurationSource | null;
  status: LinkStatus;
  problem: LinkProblem | null;
  lastCheckedAt: number | null;
}

export interface OyelabsDocView {
  id: string;
  position: number;
  source: "upload" | "link";
  uploadId: string | null;
  url: string | null;
  linkKind: DocLinkKind | null;
  title: string;
  /** v4.5 A (additive): the admin typed the title. */
  titleLocked?: boolean;
  mime: string | null;
  bytes: number | null;
  status: LinkStatus;
  problem: LinkProblem | null;
  /** Text gathering for the module test: pending/done/failed/skipped. */
  textStatus: "pending" | "done" | "failed" | "skipped";
}

export interface OyelabsModuleView {
  id: string;
  /** The managed lesson (`course_topics.id`, kind module). */
  topicId: string;
  position: number;
  title: string;
  videos: OyelabsVideoView[];
  docs: OyelabsDocView[];
  notes: NotesDoc | null;
  test: { status: ModuleTestStatus; summary: string; items: number; stale: boolean };
}

export interface OyelabsCourseView {
  id: string;
  title: string;
  description: string;
  level: OyelabsLevel;
  departmentIds: string[];
  skillIds: string[];
  published: boolean;
  /** Latest `content_versions` version, 0 before the first save. */
  version: number;
  modules: OyelabsModuleView[];
  /** An autosave draft newer than the saved course, if one exists. */
  draft: { id: string; updatedAt: number } | null;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Skill suggestions
// ---------------------------------------------------------------------------

export const suggestSkillsRequestSchema = z.object({
  title: z.string().trim().max(120),
  description: z.string().trim().max(400),
  moduleTitles: z.array(z.string().trim().max(120)).max(30),
  departmentIds: z.array(id).max(50),
});
export type SuggestSkillsRequest = z.infer<typeof suggestSkillsRequestSchema>;

export interface SuggestSkillsResponse {
  skills: { skillId: string; name: string; reason: string }[];
}

// ---------------------------------------------------------------------------
// Phase 4: assignments
// ---------------------------------------------------------------------------

/**
 * `learner`: one person. `department`: everyone in it *now* (expanded into per-learner rows).
 * `department_everyone`: a standing rule, also covering people who join later
 * (`course_department_rules`; read lazily, never backfilled).
 */
export const assignmentTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("learner"), userId: id }),
  z.object({ kind: z.literal("department"), departmentId: id }),
  z.object({ kind: z.literal("department_everyone"), departmentId: id, required: z.boolean().default(false) }),
]);
export type AssignmentTarget = z.infer<typeof assignmentTargetSchema>;

export const assignCourseRequestSchema = z.object({
  courseId: id,
  target: assignmentTargetSchema,
  priority: assignmentPrioritySchema,
});
export type AssignCourseRequest = z.infer<typeof assignCourseRequestSchema>;

export interface CourseAssignmentsView {
  courseId: string;
  learners: { userId: string; displayName: string; priority: AssignmentPriority | null; source: AssignmentSource; assignedAt: number }[];
  rules: { departmentId: string; departmentName: string; priority: AssignmentPriority; required: boolean; createdAt: number }[];
}

/** Course search for "Add a course" (learner page, onboarding summary). Includes Oyelabs courses. */
export const courseSearchQuerySchema = z.object({
  q: z.string().trim().max(120).default(""),
  departmentId: id.optional(),
  /** Phase 4 (additive): mark what this learner already has (`assigned`). */
  userId: id.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export interface CourseSearchHit {
  courseId: string;
  title: string;
  summary: string;
  oyelabs: boolean;
  level: OyelabsLevel | null;
  lessons: number;
  estMinutes: number;
  /** Phase 4 (additive): a draft can be added, but nobody sees it until it is live. */
  published?: boolean;
  /** Phase 4 (additive): the learner in `userId` already has it, at this priority (null = no priority set). */
  assigned?: { priority: AssignmentPriority | null } | null;
}

/** Onboarding: Oyelabs courses that fit a learner description, with a plain reason each. */
export const suggestCoursesRequestSchema = z.object({
  description: z.string().trim().max(2000),
  departmentId: id.nullable(),
  skillIds: z.array(id).max(50).default([]),
});
export interface SuggestCoursesResponse {
  courses: { courseId: string; title: string; reason: string; score: number }[];
}

/** Phase 4: what one learner already has, for the "Add a course" dialog (`GET …/learners/:userId`). */
export interface LearnerCoursesView {
  userId: string;
  departmentId: string;
  departmentName: string;
  /** Their own `course_assignments` rows. */
  assigned: { courseId: string; priority: AssignmentPriority | null; source: AssignmentSource }[];
  /** "Everyone in this department" rules covering their department. */
  rules: { courseId: string; priority: AssignmentPriority; required: boolean }[];
}

export interface AssignCourseResponse {
  /** Learners who got a new `course_assignments` row (0 for a rule). */
  added: number;
  /** Learners whose existing row got the new priority. */
  updated: number;
  /** One plain sentence for the toast. */
  message: string;
}

/** What the onboarding summary sends with the setup: a course picked there, and how important it is. */
export interface PickedCourse {
  courseId: string;
  title: string;
  oyelabs: boolean;
  priority: AssignmentPriority;
  /** Suggested by us (with this plain reason), or picked by the admin (null). */
  reason: string | null;
}

/** Old `PriorityChoice` values of the onboarding card ↔ assignment priorities. */
export const PRIORITY_FOR_CHOICE = { most: "most_important", important: "important", nice: "nice_to_have" } as const satisfies Record<string, AssignmentPriority>;

/** The plain "why" for an Oyelabs course: lives in the zod-free core so learner pages stay light. */
export { oyelabsCourseReason } from "./oyelabsCore";
