import { describe, expect, it } from "vitest";

import type { SkillEdge } from "@shared/skillGraph";

import { NODE_W, layoutGraph, neighbourhood } from "./layout";

const p = (from: string, to: string): SkillEdge => ({ from, to, type: "prerequisite" });
const edges = [p("a", "b"), p("b", "c"), p("c", "d"), p("x", "y")];

describe("graph view layout", () => {
  it("scopes to the focus skill's ancestors and descendants, by depth", () => {
    expect(neighbourhood(edges, "b", 1)).toEqual(["a", "b", "c"]);
    expect(neighbourhood(edges, "b", 5)).toEqual(["a", "b", "c", "d"]);
    expect(neighbourhood(edges, "x", 0)).toEqual(["x"]);
  });

  it("puts each layer in its own column, left to right", () => {
    const layout = layoutGraph(["a", "b", "c"], edges);
    const x = Object.fromEntries(layout.nodes.map((n) => [n.id, n.x]));
    expect(x.a).toBeLessThan(x.b);
    expect(x.b).toBeLessThan(x.c);
    expect(layout.width).toBeGreaterThanOrEqual(3 * NODE_W);
    expect(layout.edges).toHaveLength(2);
    expect(layout.edges[0].path.startsWith("M ")).toBe(true);
  });
});
