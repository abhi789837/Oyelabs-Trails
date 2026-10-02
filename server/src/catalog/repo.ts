import { asc, eq, inArray } from "drizzle-orm";

import type {
  Catalog,
  Department,
  DepartmentInput,
  JobTrack,
  SandboxLanguage,
  Skill,
  SkillInput,
  StackInput,
  StackOption,
  TrackInput,
} from "../../../shared/catalog";
import { normaliseSkillText } from "../../../shared/catalog";
import type { Db } from "../db";
import * as schema from "../db/schema";
import { conflict, notFound } from "../lib/errors";
import { now } from "../lib/ids";
import { SEED_DEPARTMENTS, SEED_SKILLS, SEED_STACKS, SEED_TRACKS } from "./seed";

/**
 * Inserts every seed row that is not already present, by id.
 *
 * Never updates: once a row exists it belongs to the admins, and a deploy must not undo a rename or
 * un-archive something. New seed rows (a skill added in a later release) do arrive. Idempotent and
 * cheap — a few hundred `INSERT OR IGNORE`s in one transaction.
 */
export function ensureCatalogSeed(db: Db): void {
  const at = now();
  db.transaction((tx) => {
    for (const d of SEED_DEPARTMENTS) {
      tx.insert(schema.departments)
        .values({ ...d, createdAt: at })
        .onConflictDoNothing()
        .run();
    }
    for (const t of SEED_TRACKS) {
      tx.insert(schema.tracks)
        .values({ ...t, createdAt: at })
        .onConflictDoNothing()
        .run();
    }
    for (const s of SEED_STACKS) {
      tx.insert(schema.stacks)
        .values({ ...s, language: s.language ?? null, createdAt: at })
        .onConflictDoNothing()
        .run();
    }
    SEED_SKILLS.forEach((s, position) => {
      tx.insert(schema.skills)
        .values({
          ...s,
          language: s.language ?? null,
          isAiSkill: s.isAiSkill ?? false,
          defaultSlider: s.defaultSlider ?? null,
          status: "active",
          position,
          createdAt: at,
          updatedAt: at,
        })
        .onConflictDoNothing()
        .run();
    });
  });
}

type DepartmentRow = typeof schema.departments.$inferSelect;
type TrackRow = typeof schema.tracks.$inferSelect;
type StackRow = typeof schema.stacks.$inferSelect;
type SkillRow = typeof schema.skills.$inferSelect;

const toDepartment = (r: DepartmentRow): Department => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  icon: r.icon,
  colour: r.colour,
  assessmentFormat: r.assessmentFormat,
  practiceNoun: r.practiceNoun,
  position: r.position,
  archived: r.archivedAt != null,
});

const toTrack = (r: TrackRow): JobTrack => ({
  id: r.id,
  departmentId: r.departmentId,
  name: r.name,
  description: r.description,
  position: r.position,
  archived: r.archivedAt != null,
});

const toStack = (r: StackRow): StackOption => ({
  id: r.id,
  departmentId: r.departmentId,
  name: r.name,
  kind: r.kind,
  language: (r.language as SandboxLanguage | null) ?? null,
  aliases: r.aliases,
  position: r.position,
  archived: r.archivedAt != null,
});

export const toSkill = (r: SkillRow): Skill => ({
  id: r.id,
  departmentId: r.departmentId,
  name: r.name,
  area: r.area,
  aliases: r.aliases,
  tags: r.tags,
  levelMin: r.levelMin,
  levelMax: r.levelMax,
  trackIds: r.trackIds,
  prerequisites: r.prerequisites,
  stackIds: r.stackIds,
  language: (r.language as SandboxLanguage | null) ?? null,
  contentModules: r.contentModules,
  isAiSkill: r.isAiSkill,
  defaultSlider: r.defaultSlider ?? null,
  status: r.status,
  requestedBy: r.requestedBy,
  position: r.position,
});

export interface CatalogOptions {
  /** Archived rows are hidden from pickers but shown on the departments admin page. */
  includeArchived?: boolean;
  departmentId?: string;
}

export function getCatalog(db: Db, options: CatalogOptions = {}): Catalog {
  const keep = <T extends { archived: boolean; departmentId?: string; id: string }>(row: T, dept: string) =>
    (options.includeArchived || !row.archived) && (!options.departmentId || dept === options.departmentId);

  const departments = db
    .select()
    .from(schema.departments)
    .orderBy(asc(schema.departments.position), asc(schema.departments.name))
    .all()
    .map(toDepartment)
    .filter((d) => keep(d, d.id));
  const tracks = db
    .select()
    .from(schema.tracks)
    .orderBy(asc(schema.tracks.position))
    .all()
    .map(toTrack)
    .filter((t) => keep(t, t.departmentId));
  const stacks = db
    .select()
    .from(schema.stacks)
    .orderBy(asc(schema.stacks.position))
    .all()
    .map(toStack)
    .filter((s) => keep(s, s.departmentId));
  const skills = db
    .select()
    .from(schema.skills)
    .orderBy(asc(schema.skills.position), asc(schema.skills.name))
    .all()
    .map(toSkill)
    .filter((s) => (options.includeArchived || s.status !== "archived") && (!options.departmentId || s.departmentId === options.departmentId));
  return { departments, tracks, stacks, skills };
}

export function getDepartment(db: Db, id: string): Department | null {
  const row = db.select().from(schema.departments).where(eq(schema.departments.id, id)).get();
  return row ? toDepartment(row) : null;
}

export function getSkillsByIds(db: Db, ids: readonly string[]): Skill[] {
  if (ids.length === 0) return [];
  return db.select().from(schema.skills).where(inArray(schema.skills.id, [...ids])).all().map(toSkill);
}

export function getSkill(db: Db, id: string): Skill | null {
  const row = db.select().from(schema.skills).where(eq(schema.skills.id, id)).get();
  return row ? toSkill(row) : null;
}

/** A unique, readable id from a name: "Writing user stories" in pm → "pm-writing-user-stories". */
export function slugId(prefix: string, name: string, taken: (id: string) => boolean): string {
  const base = `${prefix}-${normaliseSkillText(name).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`.slice(0, 60) || prefix;
  let id = base;
  for (let n = 2; taken(id); n += 1) id = `${base}-${n}`;
  return id;
}

const SKILL_PREFIX: Record<string, string> = { engineering: "eng", pm: "pm", bd: "bd" };
const skillPrefix = (departmentId: string) => SKILL_PREFIX[departmentId] ?? departmentId;

function nextPosition(rows: { position: number }[]): number {
  return rows.reduce((max, r) => Math.max(max, r.position + 1), 0);
}

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

export function createDepartment(db: Db, input: DepartmentInput): Department {
  const id = input.id ?? slugId("dept", input.name, (x) => getDepartment(db, x) != null).replace(/^dept-/, "");
  if (getDepartment(db, id)) throw conflict("A department with that id already exists.");
  const position = nextPosition(db.select().from(schema.departments).all());
  db.insert(schema.departments)
    .values({ id, name: input.name, slug: id, icon: input.icon, colour: input.colour, assessmentFormat: input.assessmentFormat, practiceNoun: input.practiceNoun, position, createdAt: now() })
    .run();
  return getDepartment(db, id)!;
}

export function updateDepartment(db: Db, id: string, input: Partial<DepartmentInput>): Department {
  if (!getDepartment(db, id)) throw notFound("No such department.");
  const { id: _ignored, ...rest } = input;
  void _ignored;
  if (Object.keys(rest).length > 0) db.update(schema.departments).set(rest).where(eq(schema.departments.id, id)).run();
  return getDepartment(db, id)!;
}

export function setDepartmentArchived(db: Db, id: string, archived: boolean): void {
  if (!getDepartment(db, id)) throw notFound("No such department.");
  db.update(schema.departments).set({ archivedAt: archived ? now() : null }).where(eq(schema.departments.id, id)).run();
}

// ---------------------------------------------------------------------------
// Tracks, stacks, skills
// ---------------------------------------------------------------------------

export function createTrack(db: Db, input: TrackInput): JobTrack {
  if (!getDepartment(db, input.departmentId)) throw notFound("No such department.");
  const id = input.id ?? slugId(input.departmentId, input.name, (x) => db.select().from(schema.tracks).where(eq(schema.tracks.id, x)).get() != null);
  if (db.select().from(schema.tracks).where(eq(schema.tracks.id, id)).get()) throw conflict("A track with that id already exists.");
  const siblings = db.select().from(schema.tracks).where(eq(schema.tracks.departmentId, input.departmentId)).all();
  db.insert(schema.tracks)
    .values({ id, departmentId: input.departmentId, name: input.name, description: input.description, position: nextPosition(siblings), createdAt: now() })
    .run();
  return toTrack(db.select().from(schema.tracks).where(eq(schema.tracks.id, id)).get()!);
}

export function updateTrack(db: Db, id: string, input: Partial<Omit<TrackInput, "id" | "departmentId">>): JobTrack {
  const row = db.select().from(schema.tracks).where(eq(schema.tracks.id, id)).get();
  if (!row) throw notFound("No such track.");
  if (Object.keys(input).length > 0) db.update(schema.tracks).set(input).where(eq(schema.tracks.id, id)).run();
  return toTrack(db.select().from(schema.tracks).where(eq(schema.tracks.id, id)).get()!);
}

export function setTrackArchived(db: Db, id: string, archived: boolean): void {
  const row = db.select().from(schema.tracks).where(eq(schema.tracks.id, id)).get();
  if (!row) throw notFound("No such track.");
  db.update(schema.tracks).set({ archivedAt: archived ? now() : null }).where(eq(schema.tracks.id, id)).run();
}

export function createStack(db: Db, input: StackInput): StackOption {
  if (!getDepartment(db, input.departmentId)) throw notFound("No such department.");
  const id = input.id ?? slugId(input.kind, input.name, (x) => db.select().from(schema.stacks).where(eq(schema.stacks.id, x)).get() != null);
  const siblings = db.select().from(schema.stacks).where(eq(schema.stacks.departmentId, input.departmentId)).all();
  db.insert(schema.stacks)
    .values({ id, departmentId: input.departmentId, name: input.name, kind: input.kind, language: input.language, aliases: input.aliases, position: nextPosition(siblings), createdAt: now() })
    .run();
  return toStack(db.select().from(schema.stacks).where(eq(schema.stacks.id, id)).get()!);
}

export function updateStack(db: Db, id: string, input: Partial<Omit<StackInput, "id" | "departmentId">>): StackOption {
  const row = db.select().from(schema.stacks).where(eq(schema.stacks.id, id)).get();
  if (!row) throw notFound("No such stack or tool.");
  if (Object.keys(input).length > 0) db.update(schema.stacks).set(input).where(eq(schema.stacks.id, id)).run();
  return toStack(db.select().from(schema.stacks).where(eq(schema.stacks.id, id)).get()!);
}

export function setStackArchived(db: Db, id: string, archived: boolean): void {
  if (!db.select().from(schema.stacks).where(eq(schema.stacks.id, id)).get()) throw notFound("No such stack or tool.");
  db.update(schema.stacks).set({ archivedAt: archived ? now() : null }).where(eq(schema.stacks.id, id)).run();
}

export function createSkill(db: Db, input: SkillInput, options: { status?: "active" | "pending"; requestedBy?: string | null } = {}): Skill {
  if (!getDepartment(db, input.departmentId)) throw notFound("No such department.");
  const id = input.id ?? slugId(skillPrefix(input.departmentId), input.name, (x) => getSkill(db, x) != null);
  if (getSkill(db, id)) throw conflict("A skill with that id already exists.");
  const duplicate = db
    .select()
    .from(schema.skills)
    .where(eq(schema.skills.departmentId, input.departmentId))
    .all()
    .find((s) => normaliseSkillText(s.name) === normaliseSkillText(input.name));
  if (duplicate) throw conflict(`"${duplicate.name}" is already in the catalog.`);
  const at = now();
  const position = nextPosition(db.select({ position: schema.skills.position }).from(schema.skills).all());
  db.insert(schema.skills)
    .values({ ...input, id, status: options.status ?? "active", requestedBy: options.requestedBy ?? null, position, createdAt: at, updatedAt: at })
    .run();
  return getSkill(db, id)!;
}

export function updateSkill(db: Db, id: string, input: Partial<Omit<SkillInput, "id" | "departmentId">>): Skill {
  if (!getSkill(db, id)) throw notFound("No such skill.");
  db.update(schema.skills).set({ ...input, updatedAt: now() }).where(eq(schema.skills.id, id)).run();
  return getSkill(db, id)!;
}

export function setSkillStatus(db: Db, id: string, status: "active" | "archived"): Skill {
  if (!getSkill(db, id)) throw notFound("No such skill.");
  db.update(schema.skills).set({ status, updatedAt: now() }).where(eq(schema.skills.id, id)).run();
  return getSkill(db, id)!;
}

/** Positions follow the order given. Ids not in the table are ignored. */
export function reorder(db: Db, table: "departments" | "tracks" | "stacks" | "skills", ids: readonly string[]): void {
  db.transaction((tx) => {
    ids.forEach((id, position) => {
      const t = schema[table];
      tx.update(t).set({ position }).where(eq(t.id, id)).run();
    });
  });
}

/**
 * The department a person belongs to. A learner with no recorded department is an engineer — that
 * is what every account before v4 was, and the 0013 migration says so for every profile it saw.
 */
export function departmentForUser(db: Db, userId: string): Department | null {
  const profile = db
    .select({ departmentId: schema.learnerProfiles.departmentId })
    .from(schema.learnerProfiles)
    .where(eq(schema.learnerProfiles.userId, userId))
    .get();
  const user = db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, userId)).get();
  const id = profile?.departmentId ?? (user?.role === "learner" ? "engineering" : null);
  return id ? getDepartment(db, id) : null;
}
