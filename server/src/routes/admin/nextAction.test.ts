import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { NextAction } from "../../../../shared/nextAction";
import { schema } from "../../db";
import { newId } from "../../lib/ids";
import { adminSession, as, createTestApp, onboardLearner, type Session, type TestContext } from "../../test/harness";

let ctx: TestContext;
let admin: Session;

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
});
afterEach(async () => {
  await ctx.close();
});

async function next(userId: string): Promise<NextAction> {
  const res = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${userId}/next-action`, ...as(admin) });
  expect(res.statusCode).toBe(200);
  return res.json().action as NextAction;
}

const SETUP = {
  departmentId: "engineering",
  goals: [{ type: "skill", originalText: "Git", outcome: "Can use Git.", skillIds: ["eng-git"], targetLevel: 3, caseId: null, slider: 5 }],
};

describe("GET /api/admin/users/:userId/next-action", () => {
  test("walks a learner from onboarding to on-track, from DB state", async () => {
    const { id } = await onboardLearner(ctx, admin, "walk.through");
    expect((await next(id)).kind).toBe("set-goals");

    const saved = await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${id}/setup`, ...as(admin), payload: SETUP });
    expect(saved.statusCode).toBe(200);
    expect(await next(id)).toMatchObject({ kind: "assign", button: { action: "assign" } });

    const issued = await ctx.app.inject({ method: "POST", url: `/api/admin/users/${id}/assessments`, ...as(admin), payload: {} });
    expect(issued.statusCode).toBeLessThan(300);
    const assessmentId = (issued.json() as { assessmentId: string }).assessmentId;
    const status = (s: string) => ctx.db.update(schema.assessments).set({ status: s as never }).where(eq(schema.assessments.id, assessmentId)).run();

    expect(["writing", "approve", "invite"]).toContain((await next(id)).kind);
    status("ready");
    expect((await next(id)).kind).toBe("invite"); // never signed in
    ctx.db.update(schema.users).set({ mustChangePassword: false }).where(eq(schema.users.id, id)).run();
    expect((await next(id)).kind).toBe("waiting");
    status("evaluating");
    expect((await next(id)).kind).toBe("evaluating");

    status("completed");
    const t0 = Date.now();
    ctx.db.insert(schema.evaluations).values({ id: newId(), assessmentId, result: {}, model: "mock", createdAt: t0 }).run();
    expect((await next(id)).kind).toBe("build");

    const pathId = newId();
    ctx.db.insert(schema.learningPaths).values({ id: pathId, userId: id, assessmentId, status: "writing", current: true, createdAt: t0 + 10 }).run();
    expect((await next(id)).kind).toBe("review-evaluation");
    ctx.db.update(schema.learningPaths).set({ status: "ready", completedAt: t0 + 20 }).where(eq(schema.learningPaths.id, pathId)).run();
    expect((await next(id)).kind).toBe("publish-week");
    // The goals change after the build: the path is out of date.
    ctx.db.update(schema.learnerPriorities).set({ updatedAt: t0 + 100 }).where(eq(schema.learnerPriorities.userId, id)).run();
    expect(await next(id)).toMatchObject({ kind: "rebuild", title: "Path needs a rebuild: their goals changed." });
    // So does an admin edit to the skill graph.
    ctx.db.update(schema.learnerPriorities).set({ updatedAt: t0 }).where(eq(schema.learnerPriorities.userId, id)).run();
    ctx.db.update(schema.learnerGoals).set({ updatedAt: t0 }).where(eq(schema.learnerGoals.userId, id)).run();
    ctx.db.insert(schema.skillEdges).values({ fromSkill: "eng-git", toSkill: "eng-github-flow-x", type: "recommended", updatedBy: admin.user.id, updatedAt: t0 + 200 }).run();
    expect((await next(id)).title).toContain("skill graph");
  });

  test("a path built after the last change is not stale; the week comes next, then on-track", async () => {
    const { id } = await onboardLearner(ctx, admin, "fresh.path");
    await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${id}/setup`, ...as(admin), payload: SETUP });
    const assessmentId = newId();
    const later = Date.now() + 60_000;
    ctx.db.insert(schema.assessments).values({ id: assessmentId, userId: id, status: "completed", createdAt: later }).run();
    ctx.db.insert(schema.evaluations).values({ id: newId(), assessmentId, result: {}, model: "mock", createdAt: later }).run();
    ctx.db.insert(schema.learningPaths).values({ id: newId(), userId: id, assessmentId, status: "ready", current: true, createdAt: later + 1 }).run();
    expect((await next(id)).kind).toBe("publish-week");

    ctx.db
      .insert(schema.goalSuggestions)
      .values({ id: newId(), userId: id, kind: "gap", title: "Async JS", outcome: "Can use promises.", skillIds: ["eng-git"], targetLevel: 2, reason: "gap", createdAt: later })
      .run();
    expect(await next(id)).toMatchObject({ kind: "suggestions", title: "Review 1 suggested goal." });
    ctx.db.update(schema.goalSuggestions).set({ status: "dismissed" }).where(eq(schema.goalSuggestions.userId, id)).run();

    const end = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
    ctx.db.insert(schema.weeklyPlans).values({ id: newId(), userId: id, weekNumber: 1, startDate: "2026-01-01", endDate: end, budgetMinutes: 900, createdAt: later }).run();
    expect(await next(id)).toMatchObject({ kind: "on-track", button: null });
  });

  test("a disabled learner is asked to be enabled first; unknown ids 404", async () => {
    const { id } = await onboardLearner(ctx, admin, "off.line");
    ctx.db.update(schema.users).set({ status: "disabled" }).where(eq(schema.users.id, id)).run();
    expect((await next(id)).kind).toBe("enable");
    const res = await ctx.app.inject({ method: "GET", url: `/api/admin/users/nobody/next-action`, ...as(admin) });
    expect(res.statusCode).toBe(404);
  });
});
