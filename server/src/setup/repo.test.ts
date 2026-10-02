import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { schema } from "../db";
import { getPriorities, setPriorities } from "../builder/repo";
import { now } from "../lib/ids";
import { activeLearner, adminSession, createTestApp, type Session, type TestContext } from "../test/harness";
import { listTargets, setTargets } from "../targets/repo";
import { getSetup, listSkillPriorities, listSkip, migrateLegacyPriorities, saveSetup } from "./repo";

/**
 * The slider table is the one source of truth; every v3 reader is a projection of it. The
 * migration is the test that matters most — it carries live admins' priorities across.
 */

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
});

const base = {
  departmentId: "engineering",
  trackId: "backend",
  stackIds: ["stack-laravel"],
  experienceBand: "1-2" as const,
  level: 2 as const,
  priorities: [] as { skillId: string; slider: 1 | 2 | 3 | 4 | 5 }[],
  skip: [] as string[],
  hoursPerWeek: 12,
  advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false, personalisation: "balanced" as const },
};

function anySkills(n: number, departmentId = "engineering"): string[] {
  return ctx.db
    .select({ id: schema.skills.id })
    .from(schema.skills)
    .where(eq(schema.skills.departmentId, departmentId))
    .all()
    .slice(0, n)
    .map((r) => r.id);
}

describe("saving the setup", () => {
  test("sorts by slider, keeping pick order for ties", () => {
    const [a, b, c, d] = anySkills(4);
    saveSetup(ctx.db, learner.id, { ...base, priorities: [{ skillId: a, slider: 3 }, { skillId: b, slider: 5 }, { skillId: c, slider: 3 }, { skillId: d, slider: 5 }] }, admin.user.id);
    expect(listSkillPriorities(ctx.db, learner.id).map((p) => p.skillId)).toEqual([b, d, a, c]);
  });

  test("a skipped skill is never also a priority", () => {
    const [a, b] = anySkills(2);
    saveSetup(ctx.db, learner.id, { ...base, priorities: [{ skillId: a, slider: 5 }, { skillId: b, slider: 4 }], skip: [a] }, admin.user.id);
    expect(listSkillPriorities(ctx.db, learner.id).map((p) => p.skillId)).toEqual([b]);
    expect(listSkip(ctx.db, learner.id).map((s) => s.skillId)).toEqual([a]);
  });

  test("refuses a skill from another department", () => {
    const [pmSkill] = anySkills(1, "pm");
    expect(() => saveSetup(ctx.db, learner.id, { ...base, priorities: [{ skillId: pmSkill, slider: 4 }] }, admin.user.id)).toThrow();
  });

  test("round-trips department, track, stacks, hours and advanced settings", () => {
    saveSetup(ctx.db, learner.id, { ...base, advanced: { ...base.advanced, courseCap: 2, autoPublish: true } }, admin.user.id);
    const setup = getSetup(ctx.db, learner.id);
    expect(setup).toMatchObject({ departmentId: "engineering", trackId: "backend", stackIds: ["stack-laravel"], hoursPerWeek: 12, level: 2 });
    expect(setup.advanced).toMatchObject({ courseCap: 2, autoPublish: true });
  });

  test("v3 readers see the sliders: Critical/High → high, Medium → medium, Low/Optional → low", () => {
    const [a, b, c, d] = anySkills(4);
    saveSetup(ctx.db, learner.id, { ...base, priorities: [{ skillId: a, slider: 1 }, { skillId: b, slider: 5 }, { skillId: c, slider: 3 }, { skillId: d, slider: 4 }] }, admin.user.id);
    expect(listTargets(ctx.db, learner.id).map((t) => t.priority)).toEqual(["high", "high", "medium", "low"]);
    expect(getPriorities(ctx.db, learner.id).mustHave.map((m) => m.weight)).toEqual(["high", "high", "medium", "low"]);
  });

  test("an unrelated v3 settings save does not flatten Critical to High", () => {
    const [a] = anySkills(1);
    saveSetup(ctx.db, learner.id, { ...base, priorities: [{ skillId: a, slider: 5 }] }, admin.user.id);
    setPriorities(ctx.db, learner.id, { ...getPriorities(ctx.db, learner.id), courseCap: 3 }, admin.user.id);
    expect(listSkillPriorities(ctx.db, learner.id)[0].slider).toBe(5);
  });

  test("the v3 /targets writer still lands in the slider table, matching catalog names", () => {
    setTargets(ctx.db, learner.id, [{ skill: "Docker", priority: "high", position: 0, targetDate: null }]);
    const [entry] = listSkillPriorities(ctx.db, learner.id);
    expect(entry.slider).toBe(4);
    expect(ctx.db.select().from(schema.skills).where(eq(schema.skills.id, entry.skillId)).get()!.area).not.toBe("Custom");
  });
});

describe("the one-time migration", () => {
  function resetMarker() {
    ctx.db.delete(schema.appMeta).run();
  }

  test("carries learner_targets across in order, creating custom skills for unknown names", () => {
    const at = now();
    for (const [i, t] of [
      { skill: "Laravel REST APIs (internal flavour)", priority: "high" as const },
      { skill: "Docker", priority: "high" as const },
      { skill: "Testing with Jest", priority: "medium" as const },
    ].entries()) {
      ctx.db.insert(schema.learnerTargets).values({ id: `t${i}`, userId: learner.id, skill: t.skill, priority: t.priority, position: i, createdAt: at }).run();
    }
    resetMarker();
    expect(migrateLegacyPriorities(ctx.db)).toBe(1);
    const rows = listSkillPriorities(ctx.db, learner.id);
    expect(rows.map((r) => r.slider)).toEqual([4, 4, 3]);
    expect(rows[0].skillName).toBe("Laravel REST APIs (internal flavour)");
  });

  test("falls back to must_have and the old skip list when there are no targets", () => {
    ctx.db
      .insert(schema.learnerPriorities)
      .values({ userId: learner.id, mustHave: [{ skill: "Docker", weight: "low" }], skip: ["Vue"], updatedAt: now() })
      .onConflictDoUpdate({ target: schema.learnerPriorities.userId, set: { mustHave: [{ skill: "Docker", weight: "low" }], skip: ["Vue"] } })
      .run();
    resetMarker();
    migrateLegacyPriorities(ctx.db);
    expect(listSkillPriorities(ctx.db, learner.id).map((r) => r.slider)).toEqual([2]);
    expect(listSkip(ctx.db, learner.id)).toHaveLength(1);
  });

  test("runs once per database", () => {
    ctx.db.insert(schema.learnerTargets).values({ id: "t1", userId: learner.id, skill: "Docker", priority: "high", position: 0, createdAt: now() }).run();
    resetMarker();
    migrateLegacyPriorities(ctx.db);
    saveSetup(ctx.db, learner.id, { ...base, priorities: [] }, admin.user.id);
    expect(migrateLegacyPriorities(ctx.db)).toBe(0);
    expect(listSkillPriorities(ctx.db, learner.id)).toHaveLength(0);
  });
});
