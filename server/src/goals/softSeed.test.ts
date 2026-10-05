import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { setupSchema } from "../../../shared/setup";
import { SOFT_SKILL_IDS } from "../../../shared/softSkills";
import { getCatalog } from "../catalog/repo";
import { saveSetup } from "../setup/repo";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";
import { ensureOutcomeSeed, listOutcomes, listUsableOutcomes } from "./outcomes";
import SOFT_OUTCOMES from "./seed/soft";

let ctx: TestContext;
let admin: Session;

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
});

afterEach(async () => {
  await ctx?.close();
});

describe("v4.4 soft skills area", () => {
  test("the catalog has the soft area with its ten skills", () => {
    const catalog = getCatalog(ctx.db);
    const soft = catalog.departments.find((d) => d.id === "soft");
    expect(soft).toMatchObject({ name: "Soft skills", kind: "area", assessmentFormat: "tasks" });
    expect(catalog.skills.filter((s) => s.departmentId === "soft").map((s) => s.id)).toEqual([...SOFT_SKILL_IDS]);
    for (const s of catalog.skills.filter((x) => x.departmentId === "soft")) {
      expect(s.isAiSkill, s.id).toBe(false);
      expect(s.defaultSlider, s.id).toBeNull();
      for (const m of s.contentModules) expect(ctx.content.getModule("soft", m)?.topics.length ?? 0, `${s.id} -> ${m}`).toBeGreaterThan(0);
    }
  });

  test("an area is never a learner's own department", async () => {
    const learner = await activeLearner(ctx, admin);
    expect(() =>
      saveSetup(ctx.db, learner.id, setupSchema.parse({ departmentId: "soft" }), "admin"),
    ).toThrow(/department they work in/);
  });

  test("every soft case is valid, its capstone topics exist, and it is offered to every role department", async () => {
    const report = ensureOutcomeSeed(ctx.db, SOFT_OUTCOMES, { topicExists: (id) => ctx.content.hasTopic(id), log: () => {} });
    expect(report.skipped).toEqual([]);
    expect(SOFT_OUTCOMES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(SOFT_OUTCOMES.map((o) => o.level))).toEqual(new Set([1, 2, 3, 4, 5]));
    for (const o of SOFT_OUTCOMES) for (const id of o.skillIds) expect(SOFT_SKILL_IDS as readonly string[], o.id).toContain(id);

    const soft = listOutcomes(ctx.db, "soft").map((o) => o.id);
    expect(soft.length).toBe(SOFT_OUTCOMES.length);
    for (const dept of ["engineering", "pm", "bd"]) {
      const usable = listUsableOutcomes(ctx.db, dept);
      expect(usable.filter((o) => o.departmentId === "soft").map((o) => o.id), dept).toEqual(soft);
      // The department's own cases come first.
      const firstSoft = usable.findIndex((o) => o.departmentId === "soft");
      expect(usable.slice(firstSoft).every((o) => o.departmentId === "soft"), dept).toBe(true);
    }
    expect(listUsableOutcomes(ctx.db, "soft").map((o) => o.id)).toEqual(soft);

    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/outcomes?departmentId=engineering&q=stand-up%20update", ...as(admin) });
    expect(res.statusCode).toBe(200);
    expect(res.json().outcomes[0].id).toBe("ss-standup-60s");
  });
});
