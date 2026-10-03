import { and, eq } from "drizzle-orm";

import {
  cycleIfAdded,
  edgeKey,
  type SkillEdge,
  type SkillEdgeInput,
  type SkillEdgeRow,
  type SkillGraphResponse,
} from "../../../shared/skillGraph";
import type { Db } from "../db";
import * as schema from "../db/schema";
import { badRequest, conflict, notFound } from "../lib/errors";
import { now } from "../lib/ids";
import { SEED_SKILL_EDGES } from "./seed/edges";

/**
 * v4.3 skill graph storage (`skill_edges`): the boot seed and the admin edits.
 *
 * The graph stays acyclic. The seed skips any edge that would close a loop (with a warning), and an
 * admin edit that would is refused with a 409 that names the loop.
 */

/** Which seed edges have ever been written, so an edge an admin deleted is not put back at boot. */
const SEEDED_KEY = "skill_edges.seeded";

export interface SeedSkillRef {
  id: string;
  prerequisites: readonly string[];
}

/**
 * The seed edge list: every catalog `prerequisites` entry as a `prerequisite` edge, then the
 * research progressions. Pure. Drops (with a warning) self-loops, unknown ids, duplicates and any
 * edge that would close a cycle with the ones kept before it. Catalog entries win over progressions.
 */
export function buildSeedEdges(skills: readonly SeedSkillRef[], progressions: readonly SkillEdge[] = SEED_SKILL_EDGES): { edges: SkillEdge[]; warnings: string[] } {
  const known = new Set(skills.map((s) => s.id));
  const candidates: SkillEdge[] = [
    ...skills.flatMap((s) => s.prerequisites.map((from): SkillEdge => ({ from, to: s.id, type: "prerequisite" }))),
    ...progressions,
  ];
  const edges: SkillEdge[] = [];
  const seen = new Set<string>();
  const warnings: string[] = [];
  for (const edge of candidates) {
    const key = edgeKey(edge);
    if (seen.has(key)) continue;
    const unknown = [edge.from, edge.to].filter((id) => !known.has(id));
    if (unknown.length > 0) {
      warnings.push(`skill graph seed: ${key} names unknown skill ${unknown.join(", ")}; skipped`);
      continue;
    }
    const cycle = cycleIfAdded(edges, edge);
    if (cycle) {
      warnings.push(`skill graph seed: ${key} would create the cycle ${cycle.join(" → ")}; skipped`);
      continue;
    }
    seen.add(key);
    edges.push(edge);
  }
  return { edges, warnings };
}

function readSeeded(db: Db): Set<string> {
  const row = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, SEEDED_KEY)).get();
  if (!row) return new Set();
  try {
    const parsed = JSON.parse(row.value) as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

/**
 * Inserts seed edges that have never been seeded before. Idempotent.
 *
 * - An edge with `updatedBy` set belongs to an admin and is never touched.
 * - A seeded edge (`updatedBy` null) follows a type change in the seed.
 * - An edge seeded once and since deleted by an admin stays deleted.
 * - An edge that would close a cycle with what is already in the table (say an admin added the
 *   reverse) is skipped with a warning, and tried again next boot.
 *
 * Reads the skills from the database rather than the seed file, so prerequisites an admin set on
 * a skill, and skills added through the admin, are seeded too.
 */
export function ensureSkillEdgesSeed(db: Db, warn: (message: string) => void = (m) => console.warn(`[oyelearn] ${m}`)): void {
  const skills = db.select({ id: schema.skills.id, prerequisites: schema.skills.prerequisites }).from(schema.skills).all();
  const { edges: seed, warnings } = buildSeedEdges(skills);
  warnings.forEach(warn);

  const at = now();
  db.transaction((tx) => {
    const rows = tx.select().from(schema.skillEdges).all();
    const current: SkillEdge[] = rows.map((r) => ({ from: r.fromSkill, to: r.toSkill, type: r.type }));
    const byKey = new Map(rows.map((r) => [edgeKey({ from: r.fromSkill, to: r.toSkill }), r]));
    const seeded = readSeeded(db);
    let changed = false;

    for (const edge of seed) {
      const key = edgeKey(edge);
      const existing = byKey.get(key);
      if (existing) {
        if (existing.updatedBy == null && existing.type !== edge.type) {
          tx.update(schema.skillEdges)
            .set({ type: edge.type, updatedAt: at })
            .where(and(eq(schema.skillEdges.fromSkill, edge.from), eq(schema.skillEdges.toSkill, edge.to)))
            .run();
        }
        if (!seeded.has(key)) {
          seeded.add(key);
          changed = true;
        }
        continue;
      }
      if (seeded.has(key)) continue; // deleted by an admin
      const cycle = cycleIfAdded(current, edge);
      if (cycle) {
        warn(`skill graph seed: ${key} would create the cycle ${cycle.join(" → ")} with the edited graph; skipped`);
        continue;
      }
      tx.insert(schema.skillEdges).values({ fromSkill: edge.from, toSkill: edge.to, type: edge.type, updatedBy: null, updatedAt: at }).run();
      current.push(edge);
      seeded.add(key);
      changed = true;
    }

    if (changed) {
      const value = JSON.stringify([...seeded].sort());
      tx.insert(schema.appMeta)
        .values({ key: SEEDED_KEY, value, updatedAt: at })
        .onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: at } })
        .run();
    }
  });
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

const toRow = (r: typeof schema.skillEdges.$inferSelect): SkillEdgeRow => ({
  from: r.fromSkill,
  to: r.toSkill,
  type: r.type,
  updatedBy: r.updatedBy,
  updatedAt: r.updatedAt,
});

/** Every edge, for the path builder. */
export function getSkillEdges(db: Db): SkillEdge[] {
  return db
    .select()
    .from(schema.skillEdges)
    .all()
    .map((r) => ({ from: r.fromSkill, to: r.toSkill, type: r.type }));
}

/**
 * The edges touching one department (either end in it), with the names of every skill involved,
 * plus the rest of the department's skills so the editor can offer them. Archived skills are
 * included when an edge still names them, so nothing on the list is nameless.
 */
export function getSkillGraph(db: Db, departmentId?: string): SkillGraphResponse {
  const skills = db
    .select({ id: schema.skills.id, name: schema.skills.name, area: schema.skills.area, departmentId: schema.skills.departmentId, status: schema.skills.status, position: schema.skills.position })
    .from(schema.skills)
    .all()
    .sort((a, b) => a.position - b.position);
  const inDept = new Set(skills.filter((s) => !departmentId || s.departmentId === departmentId).map((s) => s.id));
  const edges = db
    .select()
    .from(schema.skillEdges)
    .all()
    .map(toRow)
    .filter((e) => inDept.has(e.from) || inDept.has(e.to))
    .sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
  const named = new Set(edges.flatMap((e) => [e.from, e.to]));
  return {
    edges,
    skills: skills
      .filter((s) => (inDept.has(s.id) && s.status !== "archived") || named.has(s.id))
      .map(({ id, name, area, departmentId: dept }) => ({ id, name, area, departmentId: dept })),
  };
}

// ---------------------------------------------------------------------------
// Admin edits
// ---------------------------------------------------------------------------

function skillNames(db: Db): Map<string, string> {
  return new Map(db.select({ id: schema.skills.id, name: schema.skills.name }).from(schema.skills).all().map((s) => [s.id, s.name]));
}

function findEdge(db: Db, from: string, to: string) {
  return db
    .select()
    .from(schema.skillEdges)
    .where(and(eq(schema.skillEdges.fromSkill, from), eq(schema.skillEdges.toSkill, to)))
    .get();
}

function assertSkillsExist(names: Map<string, string>, edge: { from: string; to: string }): void {
  const unknown = [edge.from, edge.to].filter((id) => !names.has(id));
  if (unknown.length > 0) throw badRequest(`No such skill: ${unknown.join(", ")}.`, { [unknown[0] === edge.from ? "from" : "to"]: "No such skill." });
  if (edge.from === edge.to) throw badRequest("A skill cannot come before itself.", { to: "Pick a different skill." });
}

/** "That link would make a loop: A → B → C → A." Names, not ids, so an admin can act on it. */
function cycleMessage(names: Map<string, string>, cycle: string[]): string {
  return `That link would make a loop: ${cycle.map((id) => names.get(id) ?? id).join(" → ")}. Remove one of those links first.`;
}

export function addSkillEdge(db: Db, input: SkillEdgeInput, actorId: string): SkillEdgeRow {
  const names = skillNames(db);
  assertSkillsExist(names, input);
  if (findEdge(db, input.from, input.to)) throw conflict(`${names.get(input.from)} → ${names.get(input.to)} is already in the graph.`);
  const cycle = cycleIfAdded(getSkillEdges(db), { from: input.from, to: input.to, type: input.type });
  if (cycle) throw conflict(cycleMessage(names, cycle), { to: "Would make a loop." });
  const at = now();
  db.insert(schema.skillEdges).values({ fromSkill: input.from, toSkill: input.to, type: input.type, updatedBy: actorId, updatedAt: at }).run();
  return toRow(findEdge(db, input.from, input.to)!);
}

/** Changes an edge's type. The ends cannot change: that is a delete and an add. */
export function updateSkillEdge(db: Db, input: SkillEdgeInput, actorId: string): SkillEdgeRow {
  const existing = findEdge(db, input.from, input.to);
  if (!existing) throw notFound("That link is not in the graph.");
  // Same ends, so the acyclicity cannot change; checked anyway in case the table was edited by hand.
  const others = getSkillEdges(db).filter((e) => edgeKey(e) !== edgeKey(input));
  const cycle = cycleIfAdded(others, { from: input.from, to: input.to, type: input.type });
  if (cycle) throw conflict(cycleMessage(skillNames(db), cycle));
  db.update(schema.skillEdges)
    .set({ type: input.type, updatedBy: actorId, updatedAt: now() })
    .where(and(eq(schema.skillEdges.fromSkill, input.from), eq(schema.skillEdges.toSkill, input.to)))
    .run();
  return toRow(findEdge(db, input.from, input.to)!);
}

/** Returns the deleted edge, so the client can offer an Undo that re-adds it. */
export function deleteSkillEdge(db: Db, from: string, to: string): SkillEdgeRow {
  const existing = findEdge(db, from, to);
  if (!existing) throw notFound("That link is not in the graph.");
  db.delete(schema.skillEdges)
    .where(and(eq(schema.skillEdges.fromSkill, from), eq(schema.skillEdges.toSkill, to)))
    .run();
  return toRow(existing);
}
