import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { MockProvider } from "../../ai/adapters/mock";
import { getCatalog } from "../../catalog/repo";
import { schema } from "../../db";
import { activeLearner, adminSession, as, createTestApp } from "../../test/harness";
import { TOTAL_MAX_SEC, TOTAL_MIN_SEC } from "../../../../shared/timing";
import { initialSetupState, toSaveRequest, withDepartmentDefaults } from "../../../../src/features/admin/setup/helpers";

/**
 * v4.2: a PM onboarded the way the Setup screen does it — the department's default sliders as the
 * screen prefills them from the catalog seed, plus a free-text description — gets a sheet that
 * tests what the description says (classifying requests, white-label work) inside the time window.
 */

const DESCRIPTION = "handles white-label clients, confuses CRs and enhancements";

type Key = { task?: { kind: string; mode?: string; categories?: { id: string }[] } } | null;
const taskOf = (key: unknown) => (key as Key)?.task ?? null;

describe("v4.2 PM onboarding with the default priorities", () => {
  test("the process academy is prefilled Critical (templates High), and the sheet classifies requests and covers white-label work in 26-32 minutes", async () => {
    const ctx = await createTestApp({}, { provider: new MockProvider() });
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin);

    // What the Setup screen prefills when the admin picks Project Management.
    const catalog = getCatalog(ctx.db, { departmentId: "pm" });
    const state = withDepartmentDefaults({ ...initialSetupState(null, "pm"), trackId: "pm-agile", experienceBand: "3-5", level: 3, description: DESCRIPTION }, catalog);
    const sliders = new Map(state.priorities.map((p) => [p.skillId, p.slider]));
    for (const id of ["pm-proc-custom", "pm-proc-whitelabel", "pm-proc-terms", "pm-proc-meetings"]) expect(sliders.get(id), id).toBe(5);
    expect(sliders.get("pm-proc-templates")).toBe(4);
    expect(sliders.get("pm-client-management")).toBe(4);
    expect(sliders.get("pm-client-meetings")).toBe(3);
    expect(sliders.get("pm-email-etiquette")).toBe(3);
    expect(sliders.get("pm-ai-for-pms")).toBe(3);

    const res = await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learner.id}/setup`, ...as(admin), payload: toSaveRequest(state, true) });
    expect(res.statusCode).toBe(200);
    const id = res.json().issued.assessmentId as string;
    await ctx.drainJobs();

    const assessment = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, id)).get()!;
    expect(assessment.status).toBe("ready");
    const items = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, id)).all();
    expect(items).toHaveLength(25);

    // At least one "classify this request" item.
    const classify = items.filter((i) => {
      const task = taskOf(i.key);
      return task?.kind === "categorize" && (task.mode === "classify-request" || (task.categories ?? []).some((c) => c.id === "change-request"));
    });
    expect(classify.length).toBeGreaterThan(0);

    // At least one white-label item: on the white-label skill, or about white-label work.
    const whiteLabel = items.filter((i) => i.area === "pm-proc-whitelabel" || /white[- ]label/i.test(JSON.stringify([i.payload, i.key])));
    expect(whiteLabel.length).toBeGreaterThan(0);

    const total = items.reduce((s, i) => s + (i.estSeconds ?? 0), 0);
    expect(total).toBeGreaterThanOrEqual(TOTAL_MIN_SEC);
    expect(total).toBeLessThanOrEqual(TOTAL_MAX_SEC);
    await ctx.close();
  }, 180_000);
});
