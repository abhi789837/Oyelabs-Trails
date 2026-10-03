import { z } from "zod";

/**
 * v4.3: the skill graph. Which skills come before which.
 *
 * An edge `{ from, to }` reads "learn `from` before `to`". There are two kinds:
 * - `prerequisite`: hard. The path never schedules `to` before `from` unless the learner has
 *   already mastered `from`.
 * - `recommended`: soft. It is used for "what comes next" suggestions and the graph view, never to
 *   block anything.
 *
 * The whole graph (both kinds) must stay acyclic. A loop in "learn A before B" has no valid order,
 * and the layered graph view needs a DAG too. Seeds and admin edits are checked with `findCycle`
 * before they are written.
 *
 * Everything here is pure: no DB and no catalog lookups. The server seeds and validates with it,
 * `shared/pathOrder.ts` orders paths with it, and the admin page draws with it.
 */

export const SKILL_EDGE_TYPES = ["prerequisite", "recommended"] as const;
export const skillEdgeTypeSchema = z.enum(SKILL_EDGE_TYPES);
export type SkillEdgeType = z.infer<typeof skillEdgeTypeSchema>;

export interface SkillEdge {
  from: string;
  to: string;
  type: SkillEdgeType;
}

const skillIdSchema = z.string().trim().min(1).max(80);

/** One edge as an admin sends it. Self-loops are rejected here; unknown ids and cycles need the graph. */
export const skillEdgeInputSchema = z
  .object({ from: skillIdSchema, to: skillIdSchema, type: skillEdgeTypeSchema.default("prerequisite") })
  .refine((edge) => edge.from !== edge.to, { message: "A skill cannot come before itself.", path: ["to"] });
export type SkillEdgeInput = z.infer<typeof skillEdgeInputSchema>;

export const skillEdgeKeySchema = z.object({ from: skillIdSchema, to: skillIdSchema });

/** An edge as the admin API returns it. */
export interface SkillEdgeRow extends SkillEdge {
  /** Null = from the seed; otherwise the admin who added or last changed it. */
  updatedBy: string | null;
  updatedAt: number;
}

export interface SkillGraphResponse {
  edges: SkillEdgeRow[];
  skills: { id: string; name: string; area: string; departmentId: string }[];
}

export const edgeKey = (edge: { from: string; to: string }): string => `${edge.from}->${edge.to}`;

// ---------------------------------------------------------------------------
// Adjacency
// ---------------------------------------------------------------------------

type EdgeFilter = SkillEdgeType | "any";

const keep = (edge: SkillEdge, type: EdgeFilter) => type === "any" || edge.type === type;

function adjacency(edges: readonly SkillEdge[], direction: "out" | "in", type: EdgeFilter): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const edge of edges) {
    if (!keep(edge, type)) continue;
    const [key, value] = direction === "out" ? [edge.from, edge.to] : [edge.to, edge.from];
    const list = map.get(key);
    if (list) {
      if (!list.includes(value)) list.push(value);
    } else map.set(key, [value]);
  }
  return map;
}

/** The skills `skillId` directly needs (one hop, prerequisite edges unless told otherwise). */
export function immediatePrerequisites(edges: readonly SkillEdge[], skillId: string, type: EdgeFilter = "prerequisite"): string[] {
  return edges.filter((e) => e.to === skillId && keep(e, type)).map((e) => e.from);
}

/** The skills that directly build on `skillId` (one hop). */
export function dependentsOf(edges: readonly SkillEdge[], skillId: string, type: EdgeFilter = "prerequisite"): string[] {
  return edges.filter((e) => e.from === skillId && keep(e, type)).map((e) => e.to);
}

function closure(start: readonly string[], next: Map<string, string[]>): Set<string> {
  const seen = new Set<string>();
  const stack = [...start];
  while (stack.length > 0) {
    const id = stack.pop()!;
    for (const n of next.get(id) ?? []) {
      if (!seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return seen;
}

/** Every skill any of `skillIds` needs, at any depth. Excludes the starting skills unless one needs another. */
export function ancestorsClosure(edges: readonly SkillEdge[], skillIds: readonly string[], type: EdgeFilter = "prerequisite"): Set<string> {
  return closure(skillIds, adjacency(edges, "in", type));
}

/** Every skill that builds on any of `skillIds`, at any depth. */
export function descendantsClosure(edges: readonly SkillEdge[], skillIds: readonly string[], type: EdgeFilter = "prerequisite"): Set<string> {
  return closure(skillIds, adjacency(edges, "out", type));
}

/** All prerequisites of one skill, at any depth (the set, unordered). */
export function prerequisitesOf(edges: readonly SkillEdge[], skillId: string, type: EdgeFilter = "prerequisite"): string[] {
  return [...ancestorsClosure(edges, [skillId], type)];
}

/**
 * The prerequisites of `skillId` up to `depth` hops, in a valid learning order (the earliest first),
 * excluding the skill itself. `depth` = Infinity walks the whole chain. Ties keep id order, so the
 * result is deterministic.
 */
export function prerequisiteChain(edges: readonly SkillEdge[], skillId: string, depth = Number.POSITIVE_INFINITY, type: EdgeFilter = "prerequisite"): string[] {
  const parents = adjacency(edges, "in", type);
  const distance = new Map<string, number>();
  let frontier = [skillId];
  for (let d = 1; d <= depth && frontier.length > 0; d += 1) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const p of parents.get(id) ?? []) {
        if (p === skillId || distance.has(p)) continue;
        distance.set(p, d);
        next.push(p);
      }
    }
    frontier = next;
  }
  const chosen = new Set(distance.keys());
  const sub = edges.filter((e) => keep(e, type) && chosen.has(e.from) && chosen.has(e.to));
  return topologicalOrder([...chosen].sort(), sub);
}

// ---------------------------------------------------------------------------
// Cycles and validation
// ---------------------------------------------------------------------------

/**
 * A cycle in the graph as a closed path (`[a, b, c, a]`), or null when the graph is acyclic.
 * Both edge kinds count. Deterministic: nodes and neighbours are visited in id order.
 */
export function findCycle(edges: readonly SkillEdge[]): string[] | null {
  const out = adjacency(edges, "out", "any");
  for (const list of out.values()) list.sort();
  const nodes = [...new Set(edges.flatMap((e) => [e.from, e.to]))].sort();
  const state = new Map<string, 1 | 2>(); // 1 = on the stack, 2 = done
  const stack: string[] = [];

  // Iterative DFS, so a long chain cannot overflow the call stack.
  for (const root of nodes) {
    if (state.has(root)) continue;
    const work: { id: string; index: number }[] = [{ id: root, index: 0 }];
    state.set(root, 1);
    stack.push(root);
    while (work.length > 0) {
      const top = work[work.length - 1];
      const next = (out.get(top.id) ?? [])[top.index];
      if (next === undefined) {
        state.set(top.id, 2);
        stack.pop();
        work.pop();
        continue;
      }
      top.index += 1;
      const seen = state.get(next);
      if (seen === 1) return [...stack.slice(stack.indexOf(next)), next];
      if (seen === undefined) {
        state.set(next, 1);
        stack.push(next);
        work.push({ id: next, index: 0 });
      }
    }
  }
  return null;
}

/** The cycle adding `edge` would close, or null when it is safe. */
export function cycleIfAdded(edges: readonly SkillEdge[], edge: SkillEdge): string[] | null {
  if (edge.from === edge.to) return [edge.from, edge.from];
  // A path to → … → from already exists exactly when the new edge closes a loop.
  const reach = descendantsClosure(edges, [edge.to], "any");
  if (!reach.has(edge.from)) return null;
  return findCycle([...edges.filter((e) => edgeKey(e) !== edgeKey(edge)), edge]);
}

export type GraphIssue =
  | { kind: "unknown-skill"; edge: SkillEdge; skillId: string }
  | { kind: "self-loop"; edge: SkillEdge }
  | { kind: "duplicate"; edge: SkillEdge }
  | { kind: "cycle"; path: string[] };

/**
 * Everything wrong with a set of edges against the known skill ids. Duplicates are by
 * (from, to) regardless of type, matching the table's primary key; the reverse pair is a cycle, not
 * a duplicate.
 */
export function validateGraph(edges: readonly SkillEdge[], skillIds: Iterable<string>): { ok: boolean; issues: GraphIssue[] } {
  const known = new Set(skillIds);
  const issues: GraphIssue[] = [];
  const seen = new Set<string>();
  const clean: SkillEdge[] = [];
  for (const edge of edges) {
    let bad = false;
    for (const id of [edge.from, edge.to]) {
      if (!known.has(id)) {
        issues.push({ kind: "unknown-skill", edge, skillId: id });
        bad = true;
      }
    }
    if (edge.from === edge.to) {
      issues.push({ kind: "self-loop", edge });
      bad = true;
    }
    const key = edgeKey(edge);
    if (seen.has(key)) {
      issues.push({ kind: "duplicate", edge });
      bad = true;
    }
    seen.add(key);
    if (!bad) clean.push(edge);
  }
  const cycle = findCycle(clean);
  if (cycle) issues.push({ kind: "cycle", path: cycle });
  return { ok: issues.length === 0, issues };
}

// ---------------------------------------------------------------------------
// Orders and layers
// ---------------------------------------------------------------------------

/**
 * Kahn's algorithm over `nodes`, using only edges between them. Ties go to the order `nodes` was
 * given in. Nodes caught in a cycle are appended at the end in input order rather than dropped.
 */
export function topologicalOrder(nodes: readonly string[], edges: readonly SkillEdge[]): string[] {
  const index = new Map(nodes.map((id, i) => [id, i]));
  const indegree = new Map(nodes.map((id) => [id, 0]));
  const out = new Map<string, string[]>();
  for (const e of edges) {
    if (!index.has(e.from) || !index.has(e.to) || e.from === e.to) continue;
    const list = out.get(e.from) ?? [];
    if (list.includes(e.to)) continue;
    list.push(e.to);
    out.set(e.from, list);
    indegree.set(e.to, indegree.get(e.to)! + 1);
  }
  const ready = nodes.filter((id) => indegree.get(id) === 0);
  const order: string[] = [];
  while (ready.length > 0) {
    ready.sort((a, b) => index.get(a)! - index.get(b)!);
    const id = ready.shift()!;
    order.push(id);
    for (const n of out.get(id) ?? []) {
      indegree.set(n, indegree.get(n)! - 1);
      if (indegree.get(n) === 0) ready.push(n);
    }
  }
  if (order.length < nodes.length) order.push(...nodes.filter((id) => !order.includes(id)));
  return order;
}

/**
 * Columns for a left-to-right drawing: each node sits one layer after its deepest predecessor
 * (longest path from a source). Edges between `nodes` only, both kinds.
 */
export function topologicalLayers(nodes: readonly string[], edges: readonly SkillEdge[]): string[][] {
  const set = new Set(nodes);
  const inner = edges.filter((e) => set.has(e.from) && set.has(e.to));
  const order = topologicalOrder(nodes, inner);
  const layer = new Map<string, number>();
  for (const id of order) {
    const preds = inner.filter((e) => e.to === id).map((e) => layer.get(e.from) ?? -1);
    layer.set(id, preds.length === 0 ? 0 : Math.max(...preds) + 1);
  }
  const layers: string[][] = [];
  for (const id of order) {
    const l = layer.get(id)!;
    (layers[l] ??= []).push(id);
  }
  return layers.filter(Boolean);
}
