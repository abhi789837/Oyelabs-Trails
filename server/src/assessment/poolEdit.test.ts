import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { schema } from "../db";
import { SAMPLE_LEARNERS } from "../dev/sampleProfiles";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };
let assessmentId: string;

/**
 * The admin's edit pass over a generated pool (drop / put back).
 *
 * The generator and the critic already remove what can be judged mechanically. This exists for what
 * they cannot: a question that is fair but tests the wrong thing for this person, or one that leaks
 * the answer to another. Three properties are worth pinning, because each of them is a way this
 * could quietly become something it should not be:
 *
 *   1. It is reversible, and it never deletes — the pool stays a complete record of what the
 *      generator produced, which is what makes it useful for telling a weak model from a strict critic.
 *   2. It stops the moment a learner has started. Past that the items are part of their attempt.
 *   3. An admin can only put back what an admin dropped. Restoring a critic's rejection would be an
 *      override of a different decision, not an edit.
 */
beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin, SAMPLE_LEARNERS[0].username);

  await ctx.app.inject({
    method: "PUT",
    url: `/api/admin/users/${learner.id}/profile`,
    ...as(admin),
    payload: { profile: SAMPLE_LEARNERS[0].profile },
  });
  const issued = await ctx.app.inject({
    method: "POST",
    url: `/api/admin/users/${learner.id}/assessments`,
    ...as(admin),
    payload: {},
  });
  assessmentId = issued.json().assessmentId;
  await ctx.drainJobs();
});

function poolItems() {
  return ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, assessmentId)).all();
}

function firstKept() {
  const item = poolItems().find((i) => i.status === "pool");
  if (!item) throw new Error("the fixture generated no kept items");
  return item;
}

function drop(itemId: string, restore = false) {
  return ctx.app.inject({
    method: "POST",
    url: `/api/admin/assessments/${assessmentId}/items/${itemId}/drop`,
    ...as(admin),
    payload: { restore },
  });
}

describe("editing the pool before release", () => {
  test("dropping marks the item rather than deleting the row", async () => {
    const before = poolItems().length;
    const item = firstKept();

    expect((await drop(item.id)).statusCode).toBe(200);

    const after = poolItems();
    expect(after).toHaveLength(before);
    expect(after.find((i) => i.id === item.id)!.status).toBe("dropped");
  });

  test("a dropped item can be put back", async () => {
    const item = firstKept();
    await drop(item.id);

    expect((await drop(item.id, true)).statusCode).toBe(200);
    expect(poolItems().find((i) => i.id === item.id)!.status).toBe("pool");
  });

  test("an item the generator's own checks dropped cannot be restored", async () => {
    // Stand in for a critic rejection: a drop reason that is not the admin's constant.
    const item = firstKept();
    ctx.db
      .update(schema.assessmentItems)
      .set({ status: "dropped", dropReason: "critic: the stated answer is wrong" })
      .where(eq(schema.assessmentItems.id, item.id))
      .run();

    const res = await drop(item.id, true);
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/generator's own checks/i);
    expect(poolItems().find((i) => i.id === item.id)!.status).toBe("dropped");
  });

  test("the audit entry records the item, not its content", async () => {
    const item = firstKept();
    await drop(item.id);

    const entry = ctx.db.select().from(schema.auditLog).all().find((row) => row.action === "assessment.item_dropped");
    expect(entry).toBeDefined();
    // The pool page *is* the answer key; the audit log is not, and must not become one.
    const details = JSON.stringify(entry!.details);
    expect(details).toContain(item.id);
    expect(details).not.toContain(JSON.stringify(item.payload).slice(2, 40));
  });

  test("the pool is closed once the learner has started", async () => {
    const item = firstKept();
    ctx.db
      .update(schema.assessments)
      .set({ status: "in_progress" })
      .where(eq(schema.assessments.id, assessmentId))
      .run();

    const res = await drop(item.id);
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/before the learner starts/i);
    expect(poolItems().find((i) => i.id === item.id)!.status).toBe("pool");
  });

  test("a learner cannot edit their own pool", async () => {
    const item = firstKept();
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/assessments/${assessmentId}/items/${item.id}/drop`,
      ...as(learner.session),
      payload: {},
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(poolItems().find((i) => i.id === item.id)!.status).toBe("pool");
  });

  test("an item id from another assessment is a 404, not a cross-pool edit", async () => {
    const other = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${learner.id}/assessments`,
      ...as(admin),
      payload: { label: "Second" },
    });
    await ctx.drainJobs();
    const otherId: string = other.json().assessmentId;
    const otherItem = ctx.db
      .select()
      .from(schema.assessmentItems)
      .where(eq(schema.assessmentItems.assessmentId, otherId))
      .all()[0];
    expect(otherItem).toBeDefined();

    const res = await drop(otherItem.id);
    expect(res.statusCode).toBe(404);
  });
});
