import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { BulkOnboardResult } from "../../../../shared/bulkOnboard";
import type { OnboardSuggestion } from "../../../../shared/goals";
import { schema } from "../../db";
import { activeLearner, adminSession, as, createTestApp, login, type Session, type TestContext } from "../../test/harness";

let ctx: TestContext;
let admin: Session;

beforeEach(async () => {
  // The default mock provider answers Suggest, as quick onboarding uses it.
  ctx = await createTestApp();
  admin = await adminSession(ctx);
});
afterEach(async () => {
  await ctx.close();
});

async function suggest(description: string, departmentId = "engineering"): Promise<OnboardSuggestion> {
  const res = await ctx.app.inject({ method: "POST", url: "/api/admin/onboard/suggest", ...as(admin), payload: { departmentId, description } });
  expect(res.statusCode).toBe(200);
  return res.json().suggestion as OnboardSuggestion;
}

function setupFrom(s: OnboardSuggestion, description: string) {
  return {
    departmentId: s.departmentId,
    trackId: s.trackId,
    stackIds: s.stackIds,
    experienceBand: s.experienceBand,
    level: s.level,
    hoursPerWeek: s.hoursPerWeek,
    description,
    goals: s.goals,
  };
}

const bulk = (rows: unknown[]) => ctx.app.inject({ method: "POST", url: "/api/admin/onboard/bulk", ...as(admin), payload: { rows } });

describe("POST /api/admin/onboard/bulk", () => {
  test("each row is created, set up and assigned on its own; duplicates are rejected per row", async () => {
    await activeLearner(ctx, admin, "taken.user");
    const line = "Frontend dev, 2 yrs React, weak on Git, we want him doing backend + AI-driven work";
    const s = await suggest(line);
    const setup = setupFrom(s, line);

    const res = await bulk([
      { username: "priya.sharma", displayName: "Priya Sharma", setup },
      { username: "taken.user", displayName: "Someone Else", setup },
      { username: "priya.sharma", displayName: "Priya Again", setup },
      { username: "bad.track", displayName: "Bad Track", setup: { ...setup, trackId: "no-such-track" } },
      { username: "x", displayName: "Too Short", setup },
      { username: "ravi.kumar", displayName: "Ravi Kumar", setup },
    ]);
    expect(res.statusCode).toBe(200);
    const results = res.json().results as BulkOnboardResult[];
    expect(results.map((r) => r.ok)).toEqual([true, false, false, false, false, true]);
    expect(results[1]).toMatchObject({ field: "username", error: expect.stringMatching(/taken/) });
    expect(results[2]).toMatchObject({ field: "username", error: expect.stringMatching(/twice/) });
    expect(results[3]).toMatchObject({ field: "trackId" });
    expect(results[4]).toMatchObject({ field: "username" });

    // A failed setup leaves no account behind.
    expect(ctx.db.select().from(schema.users).where(eq(schema.users.username, "bad.track")).get()).toBeUndefined();

    for (const r of [results[0]!, results[5]!]) {
      expect(r.temporaryPassword).toMatch(/.{10,}/);
      expect(r.issued?.assessmentId).toBeTruthy();
      const goals = ctx.db.select().from(schema.learnerGoals).where(eq(schema.learnerGoals.userId, r.userId!)).all();
      expect(goals.length).toBe(s.goals.length);
      const assessments = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.userId, r.userId!)).all();
      expect(assessments).toHaveLength(1);
      const user = ctx.db.select().from(schema.users).where(eq(schema.users.id, r.userId!)).get()!;
      expect(user).toMatchObject({ role: "learner", mustChangePassword: true });
    }
    // The generated password signs them in.
    const session = await login(ctx, "priya.sharma", results[0]!.temporaryPassword!);
    expect(session.user.mustChangePassword).toBe(true);
    // The description became their profile notes.
    const profile = ctx.db.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, results[0]!.userId!)).get();
    expect(profile?.adminNotes).toBe(line);
  });

  test("rows across departments", async () => {
    const pm = await suggest("New PM from client services, never ran a sprint", "pm");
    const res = await bulk([{ username: "anna.lee", displayName: "Anna Lee", setup: setupFrom(pm, "New PM") }]);
    const [r] = res.json().results as BulkOnboardResult[];
    expect(r).toMatchObject({ ok: true });
    expect(ctx.db.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, r!.userId!)).get()?.departmentId).toBe("pm");
  });

  test("the list is capped and must not be empty", async () => {
    expect((await bulk([])).statusCode).toBe(400);
    expect((await bulk(Array.from({ length: 51 }, (_, i) => ({ username: `u${i}.x`, displayName: "U", setup: { departmentId: "engineering" } })))).statusCode).toBe(400);
  });

  test("learners cannot call it", async () => {
    const learner = await activeLearner(ctx, admin, "plain.learner");
    const res = await ctx.app.inject({ method: "POST", url: "/api/admin/onboard/bulk", ...as(learner.session), payload: { rows: [] } });
    expect(res.statusCode).toBe(403);
  });
});

describe("POST /api/admin/onboard/suggest-batch", () => {
  test("one Suggest per row, in order; a bad row gets its own error", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/onboard/suggest-batch",
      ...as(admin),
      payload: {
        rows: [
          { departmentId: "engineering", description: "Frontend dev, 2 yrs React, weak on Git, we want him doing backend + AI-driven work", name: "Priya" },
          { departmentId: "nope", description: "Something" },
          { departmentId: "engineering", description: "x" },
          { departmentId: "pm", description: "New PM from client services, never ran a sprint" },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    const results = res.json().results as { index: number; suggestion?: OnboardSuggestion; error?: string }[];
    expect(results.map((r) => r.index)).toEqual([0, 1, 2, 3]);
    expect(results[0]!.suggestion?.goals.length).toBeGreaterThan(0);
    expect(results[1]!.error).toBeTruthy();
    expect(results[2]!.error).toBeTruthy();
    expect(results[3]!.suggestion?.departmentId).toBe("pm");
  });
});

describe("mapLimited", () => {
  test("keeps order and never exceeds the limit", async () => {
    const { mapLimited } = await import("./onboardBulk");
    let inFlight = 0;
    let peak = 0;
    const out = await mapLimited([5, 1, 4, 2, 3], 2, async (n) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, n));
      inFlight -= 1;
      return n * 10;
    });
    expect(out).toEqual([50, 10, 40, 20, 30]);
    expect(peak).toBe(2);
    expect(await mapLimited([], 3, async () => 1)).toEqual([]);
  });
});
