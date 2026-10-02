import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { schema } from "../../db";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../../test/harness";

let ctx: TestContext;
let admin: Session;

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
});

const bulk = (payload: Record<string, unknown>) => ctx.app.inject({ method: "POST", url: "/api/admin/users/bulk", ...as(admin), payload });

describe("bulk user actions", () => {
  test("archive several people at once, and every one is signed out", async () => {
    const a = await activeLearner(ctx, admin, "bulk.a");
    const b = await activeLearner(ctx, admin, "bulk.b");
    const res = await bulk({ ids: [a.id, b.id], action: "archive" });
    expect(res.json().results.every((r: { ok: boolean }) => r.ok)).toBe(true);
    for (const id of [a.id, b.id]) {
      expect(ctx.db.select().from(schema.users).where(eq(schema.users.id, id)).get()!.status).toBe("archived");
      expect(ctx.db.select().from(schema.sessions).where(eq(schema.sessions.userId, id)).all()).toHaveLength(0);
    }
  });

  test("reactivating also revokes old sessions", async () => {
    const a = await activeLearner(ctx, admin, "bulk.c");
    await bulk({ ids: [a.id], action: "activate" });
    expect(ctx.db.select().from(schema.sessions).where(eq(schema.sessions.userId, a.id)).all()).toHaveLength(0);
  });

  test("your own account is skipped, the rest still happen", async () => {
    const a = await activeLearner(ctx, admin, "bulk.d");
    const res = await bulk({ ids: [admin.user.id, a.id], action: "disable" });
    const results = res.json().results as { id: string; ok: boolean; error?: string }[];
    expect(results.find((r) => r.id === admin.user.id)).toMatchObject({ ok: false });
    expect(results.find((r) => r.id === a.id)).toMatchObject({ ok: true });
  });

  test("bulk delete needs the typed confirmation, and then removes everyone", async () => {
    const a = await activeLearner(ctx, admin, "bulk.e");
    const b = await activeLearner(ctx, admin, "bulk.f");
    expect((await bulk({ ids: [a.id, b.id], action: "delete", confirm: "delete" })).statusCode).toBe(400);
    expect(ctx.db.select().from(schema.users).where(eq(schema.users.id, a.id)).get()).toBeDefined();
    const ok = await bulk({ ids: [a.id, b.id], action: "delete", confirm: "delete 2" });
    expect(ok.json().results.every((r: { ok: boolean }) => r.ok)).toBe(true);
    expect(ctx.db.select().from(schema.users).where(eq(schema.users.id, a.id)).get()).toBeUndefined();
  });
});
