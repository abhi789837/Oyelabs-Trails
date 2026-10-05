import { z } from "zod";

/**
 * Departments, job tracks, stacks/tools and the skill catalog (v4 Phase 2).
 *
 * All of these are rows, not enums, so a department added next year (Design, QA, HR) needs data and
 * no code. The only behaviour a department carries is `assessmentFormat`: `coding` serves code
 * problems, `tasks` serves the PM/BD task types.
 */

export const LEVEL_BANDS = ["beginner", "intermediate", "advanced", "expert"] as const;
export const levelBandSchema = z.enum(LEVEL_BANDS);
export type LevelBand = z.infer<typeof levelBandSchema>;

/** `expert` is shown as "Super advanced" everywhere a person reads it. */
export const LEVEL_BAND_LABELS: Record<LevelBand, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Super advanced",
};

export const assessmentFormatSchema = z.enum(["coding", "tasks"]);
export type AssessmentFormat = z.infer<typeof assessmentFormatSchema>;

export const SANDBOX_LANGUAGES = ["javascript", "typescript", "python", "php", "sql", "java", "dart", "html"] as const;
export const sandboxLanguageSchema = z.enum(SANDBOX_LANGUAGES);
export type SandboxLanguage = z.infer<typeof sandboxLanguageSchema>;

export const skillStatusSchema = z.enum(["active", "pending", "archived"]);
export type SkillStatus = z.infer<typeof skillStatusSchema>;

export interface Department {
  id: string;
  name: string;
  slug: string;
  icon: string;
  colour: string;
  assessmentFormat: AssessmentFormat;
  practiceNoun: string;
  position: number;
  archived: boolean;
  /**
   * v4.4: "role" = a department people are hired into; "area" = a cross-department skill area (Soft
   * skills). An area is never a learner's own department; its skills are usable by everyone.
   */
  kind: DepartmentKind;
}

export const DEPARTMENT_KINDS = ["role", "area"] as const;
export type DepartmentKind = (typeof DEPARTMENT_KINDS)[number];

export interface JobTrack {
  id: string;
  departmentId: string;
  name: string;
  description: string;
  position: number;
  archived: boolean;
}

export interface StackOption {
  id: string;
  departmentId: string;
  name: string;
  kind: "stack" | "tool";
  language: SandboxLanguage | null;
  aliases: string[];
  position: number;
  archived: boolean;
}

export interface Skill {
  id: string;
  departmentId: string;
  name: string;
  area: string;
  aliases: string[];
  tags: string[];
  levelMin: LevelBand;
  levelMax: LevelBand;
  trackIds: string[];
  prerequisites: string[];
  stackIds: string[];
  language: SandboxLanguage | null;
  contentModules: string[];
  isAiSkill: boolean;
  /** v4.1: pre-selected on the Setup screen for a new learner in this department (1-5), or null. */
  defaultSlider: number | null;
  status: SkillStatus;
  requestedBy: string | null;
  position: number;
}

export interface Catalog {
  departments: Department[];
  tracks: JobTrack[];
  stacks: StackOption[];
  skills: Skill[];
}

// ---------------------------------------------------------------------------
// Admin mutations
// ---------------------------------------------------------------------------

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(48)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Lowercase letters, digits and dashes");

export const departmentInputSchema = z.object({
  id: slugSchema.optional(),
  name: z.string().trim().min(2).max(60),
  icon: z.string().trim().min(1).max(40).default("users"),
  colour: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "A hex colour like #2067D3")
    .default("#2067D3"),
  assessmentFormat: assessmentFormatSchema.default("tasks"),
  practiceNoun: z.string().trim().min(2).max(40).default("Task workspace"),
});
export type DepartmentInput = z.infer<typeof departmentInputSchema>;

export const trackInputSchema = z.object({
  id: slugSchema.optional(),
  departmentId: z.string().min(1),
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(240).default(""),
});
export type TrackInput = z.infer<typeof trackInputSchema>;

export const stackInputSchema = z.object({
  id: slugSchema.optional(),
  departmentId: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  kind: z.enum(["stack", "tool"]),
  language: sandboxLanguageSchema.nullable().default(null),
  aliases: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});
export type StackInput = z.infer<typeof stackInputSchema>;

export const skillInputSchema = z.object({
  id: slugSchema.optional(),
  departmentId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  area: z.string().trim().min(2).max(60).default("General"),
  aliases: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  levelMin: levelBandSchema.default("beginner"),
  levelMax: levelBandSchema.default("expert"),
  trackIds: z.array(z.string()).max(30).default([]),
  prerequisites: z.array(z.string()).max(20).default([]),
  stackIds: z.array(z.string()).max(30).default([]),
  language: sandboxLanguageSchema.nullable().default(null),
  contentModules: z.array(z.string()).max(30).default([]),
  isAiSkill: z.boolean().default(false),
});
export type SkillInput = z.infer<typeof skillInputSchema>;

export const skillRequestSchema = z.object({
  departmentId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
});

export const reorderSchema = z.object({ ids: z.array(z.string().min(1)).min(1).max(500) });

// ---------------------------------------------------------------------------
// Search — shared by the picker and the server's free-text matching
// ---------------------------------------------------------------------------

export function normaliseSkillText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .trim();
}

/**
 * Ranks skills for a query. Exact name or alias first, then prefix, then word containment, then tag.
 * Returns the skills that match at all, best first, ties in catalog order.
 */
export function searchSkills(skills: readonly Skill[], query: string): Skill[] {
  const q = normaliseSkillText(query);
  if (!q) return [...skills];
  const words = q.split(" ");
  const scored: { skill: Skill; score: number; index: number }[] = [];
  skills.forEach((skill, index) => {
    const names = [skill.name, ...skill.aliases].map(normaliseSkillText);
    const tags = skill.tags.map(normaliseSkillText);
    let score = 0;
    if (names.some((n) => n === q)) score = 100;
    else if (names.some((n) => n.startsWith(q))) score = 80;
    else if (names.some((n) => words.every((w) => n.includes(w)))) score = 60;
    else if (words.every((w) => [...names, ...tags, normaliseSkillText(skill.area)].some((t) => t.includes(w)))) score = 40;
    if (score > 0) scored.push({ skill, score, index });
  });
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).map((entry) => entry.skill);
}

// ---------------------------------------------------------------------------
// v4.4: area departments (Soft skills) — skills usable across departments
// ---------------------------------------------------------------------------

/**
 * Ids of the area departments known to every process without a DB read. The soft-skills area is
 * seeded with id `soft`; any department row with `kind: "area"` also counts when it is passed in.
 */
export const KNOWN_AREA_DEPARTMENT_IDS: readonly string[] = ["soft"];

/**
 * True when a department is an area (its skills are usable by every department). Accepts the row
 * (preferred: honours the admin-set `kind`) or a bare id (falls back to the known ids, plus any
 * departments passed as `departments`).
 */
export function isAreaDepartment(departmentOrId: Pick<Department, "id" | "kind"> | string | null | undefined, departments?: readonly Pick<Department, "id" | "kind">[]): boolean {
  if (departmentOrId == null) return false;
  if (typeof departmentOrId !== "string") return departmentOrId.kind === "area";
  const row = departments?.find((d) => d.id === departmentOrId);
  if (row) return row.kind === "area";
  return KNOWN_AREA_DEPARTMENT_IDS.includes(departmentOrId);
}

/**
 * Can a learner in `departmentId` have this skill as a goal, test probe, path step or picker item?
 * Yes when the skill is from their department or from an area department (soft skills).
 */
export function skillUsableBy(skill: Pick<Skill, "departmentId">, departmentId: string, departments?: readonly Pick<Department, "id" | "kind">[]): boolean {
  return skill.departmentId === departmentId || isAreaDepartment(skill.departmentId, departments);
}

/** The skills a learner in `departmentId` may use: their own department's, then every area's. */
export function usableSkills(skills: readonly Skill[], departmentId: string, departments?: readonly Pick<Department, "id" | "kind">[]): Skill[] {
  const own = skills.filter((s) => s.departmentId === departmentId);
  const area = skills.filter((s) => s.departmentId !== departmentId && isAreaDepartment(s.departmentId, departments));
  return [...own, ...area];
}

/** The single best catalog match for a free-text skill name, or null. Used by migrations. */
export function matchSkillByText(skills: readonly Skill[], text: string): Skill | null {
  const q = normaliseSkillText(text);
  if (!q) return null;
  const exact = skills.find((s) => [s.name, ...s.aliases].some((n) => normaliseSkillText(n) === q));
  return exact ?? null;
}

/**
 * Which department a *content trail* belongs to. Every trail before v4 is engineering; the PM and
 * BD trails arrive in Phase 7. Unknown trails default to engineering rather than vanishing.
 */
const TRAIL_DEPARTMENT: Record<string, string> = { pm: "pm", bd: "bd", soft: "soft" };
export function trailDepartment(trailId: string): string {
  return TRAIL_DEPARTMENT[trailId] ?? "engineering";
}

/**
 * The learner's "track basics": fundamentals of their own track, in their own stack only.
 *
 * About 15% of an assessment, always asked. A React learner is never asked Vue basics, because a
 * stack-specific skill is only eligible when it shares a stack with the learner (stack-agnostic
 * fundamentals — Git, HTTP, SQL basics — always are).
 */
export function trackBasics(catalog: Pick<Catalog, "skills">, departmentId: string, trackId: string | null, stackIds: readonly string[], limit = 3): Skill[] {
  const ownStack = (skill: Skill) => skill.stackIds.length === 0 || skill.stackIds.some((id) => stackIds.includes(id));
  const eligible = catalog.skills.filter(
    (skill) =>
      skill.departmentId === departmentId &&
      skill.status === "active" &&
      !skill.isAiSkill &&
      skill.levelMin === "beginner" &&
      ownStack(skill) &&
      (trackId == null || skill.trackIds.includes(trackId)),
  );
  // Stack-specific fundamentals first when the learner has a stack: "React fundamentals" says more
  // about a React developer than "Git basics" does.
  const ranked = [...eligible].sort(
    (a, b) => Number(b.stackIds.length > 0 && stackIds.length > 0) - Number(a.stackIds.length > 0 && stackIds.length > 0) || a.position - b.position,
  );
  return ranked.slice(0, limit);
}
