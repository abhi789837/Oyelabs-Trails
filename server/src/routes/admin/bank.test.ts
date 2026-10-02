import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { schema } from "../../db";
import { recomputeBankStats } from "../../bank/stats";
import { adminSession, as, createTestApp, type Session, type TestContext } from "../../test/harness";

let ctx: TestContext;
let admin: Session;

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
});

const example = "eng-js-closures-example-c1";

describe("question bank admin", () => {
  test("the validated seed is live at boot and filterable", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/question-bank?departmentId=engineering&type=coding&limit=5", ...as(admin) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBeGreaterThan(100);
    expect(body.counts.active).toBeGreaterThan(100);
  });

  test("an edit that breaks the reference solution drops the item to draft, and approving it is refused", async () => {
    const item = (await ctx.app.inject({ method: "GET", url: `/api/admin/question-bank/${example}`, ...as(admin) })).json().item;
    const broken = { ...item, coding: { ...item.coding, referenceSolution: item.coding.starterCode } };
    const saved = await ctx.app.inject({ method: "PUT", url: `/api/admin/question-bank/${example}`, ...as(admin), payload: broken });
    expect(saved.json().item.status).toBe("draft");
    expect(saved.json().problems.length).toBeGreaterThan(0);
    const approve = await ctx.app.inject({ method: "POST", url: `/api/admin/question-bank/${example}/status`, ...as(admin), payload: { status: "active" } });
    expect(approve.statusCode).toBe(409);
  });

  test("retire and restore", async () => {
    const retire = await ctx.app.inject({ method: "POST", url: `/api/admin/question-bank/${example}/status`, ...as(admin), payload: { status: "retired", reason: "duplicate" } });
    expect(retire.json().item).toMatchObject({ status: "retired", retiredReason: "duplicate" });
    const restore = await ctx.app.inject({ method: "POST", url: `/api/admin/question-bank/${example}/status`, ...as(admin), payload: { status: "active" } });
    expect(restore.json().item.status).toBe("active");
  });

  test("items that almost everyone passes are retired automatically", () => {
    ctx.db.update(schema.questionBank).set({ timesScored: 25, scoreSum: 24.5 }).where(eq(schema.questionBank.id, example)).run();
    const result = recomputeBankStats(ctx.db);
    expect(result.retired).toContain(example);
    expect(ctx.db.select().from(schema.questionBank).where(eq(schema.questionBank.id, example)).get()!.retiredReason).toMatch(/almost everyone passes/);
  });

  test("a gap fill only inserts what validates", async () => {
    const before = ctx.db.select().from(schema.questionBank).where(eq(schema.questionBank.skillId, "eng-go")).all().length;
    await ctx.app.inject({ method: "POST", url: "/api/admin/question-bank/fill", ...as(admin), payload: { departmentId: "engineering", skillId: "eng-go", type: "coding" } });
    await ctx.drainJobs();
    // The mock provider writes schema-shaped but meaningless items: none of them may go live.
    const after = ctx.db.select().from(schema.questionBank).where(eq(schema.questionBank.skillId, "eng-go")).all();
    expect(after.filter((r) => r.status === "active")).toHaveLength(before);
  });
});
