import { asc, eq } from "drizzle-orm";

import { matchBundles, type BundleInput, type SkillBundle } from "../../../shared/bundles";
import { skillUsableBy, type Catalog, type Department } from "../../../shared/catalog";
import { getCatalog } from "../catalog/repo";
import type { Db } from "../db";
import * as schema from "../db/schema";
import { badRequest, conflict, notFound } from "../lib/errors";
import { now } from "../lib/ids";

/**
 * v4.4 Phase 1: skill groups (bundles). Seeded rows, then the admins' own: `ensureBundleSeed` only
 * inserts ids that are missing, so an admin's edit (or delete — see `deletedSeedKey`) survives every
 * deploy. Skill ids are checked when a bundle is used, not when it is seeded, so a group can name
 * the soft skills before their seed lands; unknown ids are simply not offered.
 */

/** The backend progression: HTTP → Node runtime → Express → REST → SQL → auth → deploy. */
const BACKEND_PROGRESSION = ["eng-http", "eng-node-runtime", "eng-express", "eng-rest-api-design", "eng-sql", "eng-auth-sessions-jwt", "eng-paas-deploy"];

/** The ten soft skills (Phase 2 seeds them in the `soft` area department; ids fixed in PLAN.md). */
export const SOFT_SKILL_IDS = [
  "ss-spoken-english",
  "ss-workplace-writing",
  "ss-explain-simply",
  "ss-standup-updates",
  "ss-client-team-communication",
  "ss-listening-questions",
  "ss-presenting-demoing",
  "ss-ownership-time",
  "ss-feedback",
  "ss-teamwork",
];

const SOFT_PHRASES = ["soft skills", "soft skill", "communication", "communication skills", "people skills"];

export const SEED_BUNDLES: Omit<SkillBundle, "updatedAt" | "updatedBy">[] = [
  {
    id: "eng-fullstack-from-frontend",
    name: "Full-stack developer",
    departmentId: "engineering",
    fromTrackIds: ["frontend"],
    phrases: ["full stack", "full-stack", "fullstack", "backend"],
    // The backend progression plus the pieces that join a frontend to it (CORS) and ship it whole.
    skillIds: [...BACKEND_PROGRESSION.slice(0, 6), "eng-cors", "eng-paas-deploy", "eng-fullstack-delivery"],
    targetLevel: 3,
    active: true,
  },
  {
    id: "eng-backend-from-any",
    name: "Backend developer",
    departmentId: "engineering",
    fromTrackIds: [],
    phrases: ["backend", "back end", "back-end"],
    skillIds: BACKEND_PROGRESSION,
    targetLevel: 3,
    active: true,
  },
  {
    id: "soft-skills-engineer",
    name: "Soft skills for engineers",
    departmentId: "engineering",
    fromTrackIds: [],
    phrases: SOFT_PHRASES,
    skillIds: SOFT_SKILL_IDS,
    targetLevel: 3,
    active: true,
  },
  {
    id: "soft-skills-client",
    name: "Soft skills with clients (PM)",
    departmentId: "pm",
    fromTrackIds: [],
    phrases: SOFT_PHRASES,
    skillIds: SOFT_SKILL_IDS,
    targetLevel: 3,
    active: true,
  },
  {
    id: "soft-skills-client-bd",
    name: "Soft skills with clients (BD)",
    departmentId: "bd",
    fromTrackIds: [],
    phrases: SOFT_PHRASES,
    skillIds: SOFT_SKILL_IDS,
    targetLevel: 3,
    active: true,
  },
  {
    id: "spoken-english",
    name: "Spoken English",
    departmentId: null,
    fromTrackIds: [],
    phrases: ["english", "spoken english", "speaking", "fluency"],
    skillIds: ["ss-spoken-english", "ss-standup-updates"],
    targetLevel: 3,
    active: true,
  },
  {
    id: "ai-driven-dev",
    name: "AI-driven development",
    departmentId: "engineering",
    fromTrackIds: [],
    phrases: ["ai-driven", "ai driven", "claude code", "ai coding"],
    // The AI-driven progression of the skill graph: prompting → Claude Code → context files and
    // reusable skills → reviewing the output.
    skillIds: ["eng-ai-prompting-for-code", "eng-ai-claude-code", "eng-ai-context-files", "eng-ai-reusable-skills", "eng-ai-reviewing-diffs", "eng-ai-antipatterns"],
    targetLevel: 3,
    active: true,
  },
];

/** `app_meta` key listing seed bundle ids an admin deleted, so the seed does not bring them back. */
export const deletedSeedKey = "bundles.deleted_seed_ids";

function deletedSeedIds(db: Db): string[] {
  const row = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, deletedSeedKey)).get();
  try {
    return row ? (JSON.parse(row.value) as string[]) : [];
  } catch {
    return [];
  }
}

/** Boot: inserts seed bundles whose id is missing (never updates). After the catalog and outcome seeds. */
export function ensureBundleSeed(db: Db): void {
  const at = now();
  const deleted = new Set(deletedSeedIds(db));
  db.transaction((tx) => {
    for (const b of SEED_BUNDLES) {
      if (deleted.has(b.id)) continue;
      tx.insert(schema.skillBundles)
        .values({ ...b, updatedBy: null, updatedAt: at })
        .onConflictDoNothing()
        .run();
    }
  });
}

type BundleRow = typeof schema.skillBundles.$inferSelect;
const toBundle = (r: BundleRow): SkillBundle => ({
  id: r.id,
  name: r.name,
  departmentId: r.departmentId,
  fromTrackIds: r.fromTrackIds,
  phrases: r.phrases,
  skillIds: r.skillIds,
  targetLevel: r.targetLevel,
  active: r.active,
  updatedBy: r.updatedBy,
  updatedAt: r.updatedAt,
});

export function listBundles(db: Db): SkillBundle[] {
  return db.select().from(schema.skillBundles).orderBy(asc(schema.skillBundles.name)).all().map(toBundle);
}

export function getBundle(db: Db, id: string): SkillBundle | null {
  const row = db.select().from(schema.skillBundles).where(eq(schema.skillBundles.id, id)).get();
  return row ? toBundle(row) : null;
}

/**
 * The bundle's skills a learner in `departmentId` can use, in bundle order: known, active, and from
 * their department or an area department (soft skills).
 */
export function usableBundleSkills(catalog: Pick<Catalog, "skills" | "departments">, bundle: Pick<SkillBundle, "skillIds">, departmentId: string): string[] {
  const byId = new Map(catalog.skills.map((s) => [s.id, s]));
  return bundle.skillIds.filter((id) => {
    const skill = byId.get(id);
    return skill != null && skill.status === "active" && skillUsableBy(skill, departmentId, catalog.departments);
  });
}

/** The matching bundles for a phrase (best first), only those with at least one usable skill. */
export function matchBundlesFor(db: Db, catalog: Pick<Catalog, "skills" | "departments">, text: string, departmentId: string, currentTrackId: string | null, bundles = listBundles(db)): SkillBundle[] {
  return matchBundles(bundles, text, departmentId, currentTrackId).filter((b) => usableBundleSkills(catalog, b, departmentId).length > 0);
}

/** Admin save: every skill must exist and be usable by the bundle's department (any, when null). */
function validateBundle(db: Db, input: BundleInput): BundleInput {
  const catalog = getCatalog(db, { includeArchived: true });
  const departments: Department[] = catalog.departments;
  if (input.departmentId && !departments.some((d) => d.id === input.departmentId)) throw badRequest("Pick a department.", { departmentId: "Unknown department" });
  const tracks = new Set(catalog.tracks.filter((t) => !input.departmentId || t.departmentId === input.departmentId).map((t) => t.id));
  const badTrack = input.fromTrackIds.find((id) => !tracks.has(id));
  if (badTrack) throw badRequest("A role in 'Applies when their current role is' is not in this department.", { fromTrackIds: `Unknown role ${badTrack}` });
  const byId = new Map(catalog.skills.map((s) => [s.id, s]));
  for (const id of input.skillIds) {
    const skill = byId.get(id);
    if (!skill) throw badRequest("A skill in this group is not in the catalog.", { skillIds: `Unknown skill ${id}` });
    if (input.departmentId && !skillUsableBy(skill, input.departmentId, departments)) {
      throw badRequest("A skill in this group belongs to another department.", { skillIds: `${skill.name} is not usable in this department` });
    }
  }
  return { ...input, skillIds: [...new Set(input.skillIds)], fromTrackIds: [...new Set(input.fromTrackIds)] };
}

function slugFor(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 56) || "group"
  );
}

export function createBundle(db: Db, raw: BundleInput, actorId: string): SkillBundle {
  const input = validateBundle(db, raw);
  let id = input.id ?? slugFor(input.name);
  if (input.id && getBundle(db, id)) throw conflict("A skill group with that id already exists.");
  for (let n = 2; getBundle(db, id); n += 1) id = `${slugFor(input.name)}-${n}`;
  const { id: _ignored, ...rest } = input;
  void _ignored;
  db.insert(schema.skillBundles)
    .values({ id, ...rest, updatedBy: actorId, updatedAt: now() })
    .run();
  return getBundle(db, id)!;
}

export function updateBundle(db: Db, id: string, raw: BundleInput, actorId: string): SkillBundle {
  if (!getBundle(db, id)) throw notFound("No such skill group.");
  const { id: _ignored, ...rest } = validateBundle(db, raw);
  void _ignored;
  db.update(schema.skillBundles)
    .set({ ...rest, updatedBy: actorId, updatedAt: now() })
    .where(eq(schema.skillBundles.id, id))
    .run();
  return getBundle(db, id)!;
}

export function deleteBundle(db: Db, id: string): void {
  if (!getBundle(db, id)) throw notFound("No such skill group.");
  db.transaction((tx) => {
    tx.delete(schema.skillBundles).where(eq(schema.skillBundles.id, id)).run();
    if (SEED_BUNDLES.some((b) => b.id === id)) {
      const ids = [...new Set([...deletedSeedIds(db), id])];
      tx.insert(schema.appMeta)
        .values({ key: deletedSeedKey, value: JSON.stringify(ids), updatedAt: now() })
        .onConflictDoUpdate({ target: schema.appMeta.key, set: { value: JSON.stringify(ids), updatedAt: now() } })
        .run();
    }
  });
}
