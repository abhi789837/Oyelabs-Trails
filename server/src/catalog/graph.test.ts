import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { findCycle, validateGraph, type SkillGraphResponse } from "../../../shared/skillGraph";
import { schema } from "../db";
import { adminSession, as, type Session, type TestContext, createTestApp } from "../test/harness";
import { buildSeedEdges, ensureSkillEdgesSeed, getSkillEdges } from "./graph";
import { SEED_SKILLS } from "./seed";
import { SEED_SKILL_EDGES } from "./seed/edges";

describe("seed skill graph (pure)", () => {
  const ids = SEED_SKILLS.map((s) => s.id);

  it("names only real catalog skills in the progressions", () => {
    const known = new Set(ids);
    const unknown = SEED_SKILL_EDGES.flatMap((e) => [e.from, e.to]).filter((id) => !known.has(id));
    expect(unknown).toEqual([]);
  });

  it("keeps every catalog prerequisite and every progression, with no warnings", () => {
    const { edges, warnings } = buildSeedEdges(SEED_SKILLS);
    expect(warnings).toEqual([]);
    const prereqCount = new Set(SEED_SKILLS.flatMap((s) => s.prerequisites.map((p) => `${p}->${s.id}`))).size;
    expect(edges.length).toBeGreaterThanOrEqual(prereqCount + SEED_SKILL_EDGES.length - 5);
    expect(validateGraph(edges, ids)).toEqual({ ok: true, issues: [] });
  });

  it("is acyclic per department and never crosses departments", () => {
    const { edges } = buildSeedEdges(SEED_SKILLS);
    const deptOf = new Map(SEED_SKILLS.map((s) => [s.id, s.departmentId]));
    for (const dept of ["engineering", "pm", "bd"]) {
      const own = edges.filter((e) => deptOf.get(e.from) === dept);
      expect(own.length).toBeGreaterThan(0);
      expect(findCycle(own)).toBeNull();
    }
    expect(edges.filter((e) => deptOf.get(e.from) !== deptOf.get(e.to))).toEqual([]);
  });

  it("drops unknown ids and cycle-closing edges with a warning", () => {
    const { edges, warnings } = buildSeedEdges(
      [
        { id: "a", prerequisites: [] },
        { id: "b", prerequisites: ["a", "ghost"] },
      ],
      [{ from: "b", to: "a", type: "recommended" }],
    );
    expect(edges).toEqual([{ from: "a", to: "b", type: "prerequisite" }]);
    expect(warnings).toHaveLength(2);
    expect(warnings.join(" ")).toMatch(/ghost/);
    expect(warnings.join(" ")).toMatch(/cycle/);
  });
});

describe("skill graph in the database", () => {
  let ctx: TestContext;
  let admin: Session;

  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await adminSession(ctx);
  });
  afterEach(async () => {
    await ctx.close();
  });

  it("is seeded at boot and the seed is idempotent", () => {
    const before = getSkillEdges(ctx.db);
    expect(before.length).toBeGreaterThan(300);
    expect(findCycle(before)).toBeNull();
    ensureSkillEdgesSeed(ctx.db, () => undefined);
    expect(getSkillEdges(ctx.db)).toHaveLength(before.length);
  });

  it("never overwrites an admin-edited edge or re-adds one an admin deleted", async () => {
    const put = await ctx.app.inject({ method: "PUT", url: "/api/admin/skill-graph/edges", ...as(admin), payload: { from: "eng-javascript", to: "eng-typescript", type: "recommended" } });
    expect(put.statusCode).toBe(200);
    expect(put.json().edge.updatedBy).toBe(admin.user.id);
    const del = await ctx.app.inject({ method: "DELETE", url: "/api/admin/skill-graph/edges?from=eng-git&to=eng-github-flow", ...as(admin) });
    expect(del.statusCode).toBe(200);

    ensureSkillEdgesSeed(ctx.db, () => undefined);

    const edited = ctx.db
      .select()
      .from(schema.skillEdges)
      .where(and(eq(schema.skillEdges.fromSkill, "eng-javascript"), eq(schema.skillEdges.toSkill, "eng-typescript")))
      .get();
    expect(edited?.type).toBe("recommended");
    expect(getSkillEdges(ctx.db).some((e) => e.from === "eng-git" && e.to === "eng-github-flow")).toBe(false);
  });

  it("serves a department's edges with skill names", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/skill-graph?departmentId=pm", ...as(admin) });
    expect(res.statusCode).toBe(200);
    const body = res.json() as SkillGraphResponse;
    expect(body.edges.some((e) => e.from === "pm-agency-sdlc" && e.to === "pm-proc-custom")).toBe(true);
    const named = new Set(body.skills.map((s) => s.id));
    for (const e of body.edges) {
      expect(named.has(e.from)).toBe(true);
      expect(named.has(e.to)).toBe(true);
    }
    expect(body.skills.every((s) => s.departmentId === "pm")).toBe(true);
  });

  it("adds an edge, refuses duplicates, self-loops and unknown skills", async () => {
    const add = (payload: object) => ctx.app.inject({ method: "POST", url: "/api/admin/skill-graph/edges", ...as(admin), payload });
    const ok = await add({ from: "eng-html", to: "eng-tailwind", type: "recommended" });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().edge).toMatchObject({ from: "eng-html", to: "eng-tailwind", type: "recommended", updatedBy: admin.user.id });
    expect((await add({ from: "eng-html", to: "eng-tailwind" })).statusCode).toBe(409);
    expect((await add({ from: "eng-html", to: "eng-html" })).statusCode).toBe(400);
    expect((await add({ from: "eng-html", to: "eng-nope" })).statusCode).toBe(400);
  });

  it("refuses an edge that would make a loop, naming the loop", async () => {
    const res = await ctx.app.inject({ method: "POST", url: "/api/admin/skill-graph/edges", ...as(admin), payload: { from: "eng-react-hooks", to: "eng-javascript" } });
    expect(res.statusCode).toBe(409);
    const message = res.json().error.message as string;
    expect(message).toMatch(/loop/);
    expect(message).toContain("React hooks → JavaScript fundamentals");
  });

  it("is read-only for a learner and 404s a missing edge", async () => {
    const missing = await ctx.app.inject({ method: "DELETE", url: "/api/admin/skill-graph/edges?from=eng-html&to=eng-go", ...as(admin) });
    expect(missing.statusCode).toBe(404);
    const anon = await ctx.app.inject({ method: "GET", url: "/api/admin/skill-graph" });
    expect(anon.statusCode).toBe(401);
  });
});
