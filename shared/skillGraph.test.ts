import { describe, expect, it } from "vitest";

import {
  ancestorsClosure,
  cycleIfAdded,
  dependentsOf,
  descendantsClosure,
  findCycle,
  immediatePrerequisites,
  prerequisiteChain,
  prerequisitesOf,
  skillEdgeInputSchema,
  topologicalLayers,
  topologicalOrder,
  validateGraph,
  type SkillEdge,
} from "./skillGraph";

const p = (from: string, to: string): SkillEdge => ({ from, to, type: "prerequisite" });
const r = (from: string, to: string): SkillEdge => ({ from, to, type: "recommended" });

// js → ts → generics; js → node → express; http → express; express ⇢ prisma (recommended)
const graph: SkillEdge[] = [p("js", "ts"), p("ts", "generics"), p("js", "node"), p("node", "express"), p("http", "express"), r("express", "prisma")];

describe("skill graph traversal", () => {
  it("finds one-hop prerequisites and dependents", () => {
    expect(immediatePrerequisites(graph, "express").sort()).toEqual(["http", "node"]);
    expect(dependentsOf(graph, "js").sort()).toEqual(["node", "ts"]);
    expect(dependentsOf(graph, "express")).toEqual([]);
    expect(dependentsOf(graph, "express", "any")).toEqual(["prisma"]);
  });

  it("walks the whole prerequisite chain, not one hop", () => {
    expect(prerequisitesOf(graph, "express").sort()).toEqual(["http", "js", "node"]);
    expect([...ancestorsClosure(graph, ["generics", "express"])].sort()).toEqual(["http", "js", "node", "ts"]);
    expect([...descendantsClosure(graph, ["js"])].sort()).toEqual(["express", "generics", "node", "ts"]);
    expect([...descendantsClosure(graph, ["js"], "any")].sort()).toEqual(["express", "generics", "node", "prisma", "ts"]);
  });

  it("orders a prerequisite chain earliest first and honours depth", () => {
    const chain = prerequisiteChain(graph, "express");
    expect(chain.indexOf("js")).toBeLessThan(chain.indexOf("node"));
    expect(chain.sort()).toEqual(["http", "js", "node"]);
    expect(prerequisiteChain(graph, "express", 1).sort()).toEqual(["http", "node"]);
    expect(prerequisiteChain(graph, "js")).toEqual([]);
  });
});

describe("cycles and validation", () => {
  it("returns null for a DAG and the closed path for a cycle", () => {
    expect(findCycle(graph)).toBeNull();
    const cycle = findCycle([...graph, p("express", "js")]);
    expect(cycle).not.toBeNull();
    expect(cycle![0]).toBe(cycle![cycle!.length - 1]);
    expect(new Set(cycle)).toEqual(new Set(["js", "node", "express"]));
  });

  it("counts recommended edges as part of a cycle", () => {
    expect(findCycle([p("a", "b"), r("b", "a")])).toEqual(["a", "b", "a"]);
  });

  it("says which cycle a new edge would close", () => {
    const loop = cycleIfAdded(graph, p("generics", "js"));
    expect(loop).not.toBeNull();
    expect(new Set(loop)).toEqual(new Set(["generics", "js", "ts"]));
    expect(cycleIfAdded(graph, p("http", "generics"))).toBeNull();
    expect(cycleIfAdded(graph, p("js", "js"))).toEqual(["js", "js"]);
  });

  it("reports unknown ids, self-loops, duplicates and cycles", () => {
    const ids = ["a", "b", "c"];
    const result = validateGraph([p("a", "b"), p("a", "b"), p("a", "zz"), p("c", "c"), p("b", "c"), r("c", "a")], ids);
    expect(result.ok).toBe(false);
    const kinds = result.issues.map((i) => i.kind).sort();
    expect(kinds).toEqual(["cycle", "duplicate", "self-loop", "unknown-skill"]);
    expect(validateGraph(graph, ["js", "ts", "generics", "node", "express", "http", "prisma"]).ok).toBe(true);
  });

  it("rejects a self-loop at the input schema", () => {
    expect(skillEdgeInputSchema.safeParse({ from: "a", to: "a" }).success).toBe(false);
    expect(skillEdgeInputSchema.parse({ from: "a", to: "b" }).type).toBe("prerequisite");
  });
});

describe("orders and layers", () => {
  it("never puts a node before its predecessor", () => {
    const nodes = ["express", "prisma", "node", "http", "generics", "ts", "js"];
    const order = topologicalOrder(nodes, graph);
    for (const e of graph) expect(order.indexOf(e.from)).toBeLessThan(order.indexOf(e.to));
  });

  it("layers by longest path from a source", () => {
    const layers = topologicalLayers(["js", "ts", "generics", "node", "express", "http", "prisma"], graph);
    expect(layers[0].sort()).toEqual(["http", "js"]);
    expect(layers[1].sort()).toEqual(["node", "ts"]);
    expect(layers[2].sort()).toEqual(["express", "generics"]);
    expect(layers[3]).toEqual(["prisma"]);
  });

  it("keeps nodes caught in a cycle instead of dropping them", () => {
    expect(topologicalOrder(["a", "b"], [p("a", "b"), p("b", "a")]).sort()).toEqual(["a", "b"]);
  });
});
