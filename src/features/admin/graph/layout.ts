import { topologicalLayers, type SkillEdge } from "@shared/skillGraph";

/**
 * The read-only graph view's geometry: a selected skill's neighbourhood (what it needs and what
 * builds on it, up to `depth` hops each way), in topological layers drawn as columns.
 */

export const NODE_W = 176;
export const NODE_H = 40;
const COL_GAP = 64;
const ROW_GAP = 14;
const PAD = 8;

/** The focus skill, its ancestors and its descendants within `depth` hops (both edge kinds). */
export function neighbourhood(edges: readonly SkillEdge[], focus: string, depth: number): string[] {
  const seen = new Set([focus]);
  for (const direction of ["up", "down"] as const) {
    let frontier = [focus];
    for (let d = 0; d < depth && frontier.length > 0; d += 1) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const e of edges) {
          const n = direction === "up" ? (e.to === id ? e.from : null) : e.from === id ? e.to : null;
          if (n && !seen.has(n)) {
            seen.add(n);
            next.push(n);
          }
        }
      }
      frontier = next;
    }
  }
  return [...seen].sort();
}

export interface LaidOutNode {
  id: string;
  x: number;
  y: number;
}

export interface LaidOutEdge extends SkillEdge {
  path: string;
}

export interface GraphLayout {
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
  width: number;
  height: number;
}

/**
 * Columns are topological layers. Inside a column, nodes are sorted by the mean row of their
 * predecessors (one barycentre pass), which removes most crossings in graphs this small.
 */
export function layoutGraph(nodeIds: readonly string[], allEdges: readonly SkillEdge[]): GraphLayout {
  const set = new Set(nodeIds);
  const edges = allEdges.filter((e) => set.has(e.from) && set.has(e.to));
  const layers = topologicalLayers(nodeIds, edges);
  const row = new Map<string, number>();
  layers.forEach((layer, index) => {
    if (index > 0) {
      const score = (id: string) => {
        const preds = edges.filter((e) => e.to === id && row.has(e.from)).map((e) => row.get(e.from)!);
        return preds.length ? preds.reduce((a, b) => a + b, 0) / preds.length : Number.POSITIVE_INFINITY;
      };
      layer.sort((a, b) => score(a) - score(b) || a.localeCompare(b));
    }
    layer.forEach((id, i) => row.set(id, i));
  });
  const tallest = Math.max(1, ...layers.map((l) => l.length));
  const height = PAD * 2 + tallest * NODE_H + (tallest - 1) * ROW_GAP;
  const nodes: LaidOutNode[] = layers.flatMap((layer, col) => {
    const columnHeight = layer.length * NODE_H + (layer.length - 1) * ROW_GAP;
    const top = (height - columnHeight) / 2;
    return layer.map((id, i) => ({ id, x: PAD + col * (NODE_W + COL_GAP), y: top + i * (NODE_H + ROW_GAP) }));
  });
  const at = new Map(nodes.map((n) => [n.id, n]));
  const laidEdges: LaidOutEdge[] = edges.map((e) => {
    const a = at.get(e.from)!;
    const b = at.get(e.to)!;
    const x1 = a.x + NODE_W;
    const y1 = a.y + NODE_H / 2;
    const x2 = b.x;
    const y2 = b.y + NODE_H / 2;
    const bend = Math.max(24, (x2 - x1) / 2);
    return { ...e, path: `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}` };
  });
  return { nodes, edges: laidEdges, width: PAD * 2 + layers.length * NODE_W + Math.max(0, layers.length - 1) * COL_GAP, height };
}
