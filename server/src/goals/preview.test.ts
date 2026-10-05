import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test } from "vitest";

import type { OnboardSuggestion } from "../../../shared/goals";
import type { OnboardPreview } from "../../../shared/onboardPreview";
import { schema } from "../db";
import { adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";

/**
 * v4.4 Phase 6: the onboarding preview for the reference case. Plain bullets of what the test will
 * check (spoken English included), the first steps from the real path order, and the skills with
 * no course yet.
 */

const REFERENCE = "frontend engineer with 1 year of experience and also want him to move to the full stack and also improve the soft skills";

let ctx: TestContext;
let admin: Session;

afterEach(async () => {
  await ctx?.close();
});

async function setUp() {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
}

async function suggest(): Promise<OnboardSuggestion> {
  const res = await ctx.app.inject({ method: "POST", url: "/api/admin/onboard/suggest", ...as(admin), payload: { departmentId: "engineering", description: REFERENCE } });
  expect(res.statusCode).toBe(200);
  return res.json().suggestion as OnboardSuggestion;
}

async function preview(s: OnboardSuggestion, extra: Record<string, unknown> = {}): Promise<OnboardPreview> {
  const res = await ctx.app.inject({
    method: "POST",
    url: "/api/admin/onboard/preview",
    ...as(admin),
    payload: {
      departmentId: s.departmentId,
      trackId: s.trackId,
      stackIds: s.stackIds,
      experienceBand: s.experienceBand,
      level: s.level,
      hoursPerWeek: s.hoursPerWeek,
      description: REFERENCE,
      goals: s.goals,
      intents: s.intents,
      unsure: s.unsure,
      ...extra,
    },
  });
  expect(res.statusCode, res.body).toBe(200);
  return res.json().preview as OnboardPreview;
}

describe("POST /api/admin/onboard/preview (reference case)", () => {
  test("returns what the test checks, the first steps and the new courses, in plain words", async () => {
    await setUp();
    const s = await suggest();
    const p = await preview(s);

    expect(p.testChecks[0]).toBe("Frontend basics used every day");
    expect(p.testChecks).toContain("The first steps of backend work");
    const spoken = p.testChecks.find((c) => c.startsWith("Spoken English"));
    expect(spoken).toMatch(/^Spoken English \(2 short recordings\)(, | and )work emails/);
    expect(p.minutes).toBeGreaterThanOrEqual(26);
    expect(p.minutes).toBeLessThanOrEqual(34);

    expect(p.firstSteps.slice(0, 3)).toEqual(["Frontend gaps", "Backend basics", "Speaking & writing at work"]);
    expect(Array.isArray(p.newCourses)).toBe(true);
    // Plain words only: no ids, no numbers-as-priorities.
    for (const line of [...p.testChecks, ...p.firstSteps]) expect(line).not.toMatch(/eng-|ss-|slider|slot/i);
  });

  test("a skill no course covers is listed as a new course", async () => {
    await setUp();
    ctx.app.db.update(schema.skills).set({ contentModules: [] }).where(eq(schema.skills.id, "ss-spoken-english")).run();
    const p = await preview(await suggest());
    expect(p.newCourses).toContain("Spoken English at work");
  });

  test("steps run one part at a time; the checks step names the skills before their kinds", async () => {
    await setUp();
    const s = await suggest();
    const checks = await preview(s, { step: "checks" });
    expect(checks.testChecks).toContain("Speaking and writing at work");
    expect(checks.firstSteps).toEqual([]);
    expect(checks.minutes).toBeUndefined();
    const test2 = await preview(s, { step: "test" });
    expect(test2.minutes).toBeGreaterThan(0);
    expect(test2.firstSteps).toEqual([]);
    const path = await preview(s, { step: "path" });
    expect(path.testChecks).toEqual([]);
    expect(path.firstSteps[0]).toBe("Frontend gaps");
  });

  test("a lower priority for the soft skills moves them out of the main checks but keeps one", async () => {
    await setUp();
    const s = await suggest();
    const goals = s.goals.map((g) => ({ ...g, slider: g.skillIds.some((id) => id.startsWith("ss-")) ? 2 : g.slider }));
    const p = await preview(s, { goals });
    expect(p.testChecks.some((c) => /Spoken English|Speaking at work|Work emails|team situations/.test(c))).toBe(true);
  });

  test("learners cannot call it", async () => {
    await setUp();
    const res = await ctx.app.inject({ method: "POST", url: "/api/admin/onboard/preview", payload: { departmentId: "engineering" } });
    expect([401, 403]).toContain(res.statusCode);
  });
});
