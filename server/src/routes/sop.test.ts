import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { activeLearner, adminSession, as, createTestApp, publishPlanFor, type Session, type TestContext } from "../test/harness";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };

/** The first shipped topic that has SOP blocks (the v4.1 agency PM courses have several). */
function sopTopic(): { id: string; blocks: number } {
  for (const id of ctx.app.content.orderedTopicIds) {
    const sop = ctx.app.content.getTopic(id)?.topic.sop;
    if (sop?.length) return { id, blocks: sop.length };
  }
  throw new Error("No shipped topic has SOP blocks");
}

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
});

afterEach(async () => {
  await ctx.close();
});

describe("Oyelabs SOP blocks", () => {
  test("a learner sees the blocks to fill, then what an admin wrote", async () => {
    const topic = sopTopic();
    await publishPlanFor(ctx, admin, learner.id, [topic.id]);

    const before = await ctx.app.inject({ method: "GET", url: `/api/content/topics/${topic.id}/sop`, ...as(learner.session) });
    expect(before.statusCode).toBe(200);
    expect(before.json().blocks).toHaveLength(topic.blocks);
    expect(before.json().blocks[0].body).toBeNull();

    const save = await ctx.app.inject({ method: "PUT", url: `/api/admin/sop/${topic.id}/0`, payload: { body: "Submit by Friday 6 pm." }, ...as(admin) });
    expect(save.statusCode).toBe(200);

    const after = await ctx.app.inject({ method: "GET", url: `/api/content/topics/${topic.id}/sop`, ...as(learner.session) });
    expect(after.json().blocks[0].body).toBe("Submit by Friday 6 pm.");

    const list = await ctx.app.inject({ method: "GET", url: "/api/admin/sop", ...as(admin) });
    const row = list.json().rows.find((r: { topicId: string; index: number }) => r.topicId === topic.id && r.index === 0);
    expect(row.body).toBe("Submit by Friday 6 pm.");

    // An empty save clears the block back to "admin to fill".
    await ctx.app.inject({ method: "PUT", url: `/api/admin/sop/${topic.id}/0`, payload: { body: "  " }, ...as(admin) });
    const cleared = await ctx.app.inject({ method: "GET", url: `/api/content/topics/${topic.id}/sop`, ...as(learner.session) });
    expect(cleared.json().blocks[0].body).toBeNull();
  });

  test("learners cannot write, and cannot read a topic outside their plan", async () => {
    const topic = sopTopic();
    const write = await ctx.app.inject({ method: "PUT", url: `/api/admin/sop/${topic.id}/0`, payload: { body: "x" }, ...as(learner.session) });
    expect(write.statusCode).toBe(403);
    const read = await ctx.app.inject({ method: "GET", url: `/api/content/topics/${topic.id}/sop`, ...as(learner.session) });
    expect(read.statusCode).toBe(404);
  });

  test("an unknown block is a 404", async () => {
    const topic = sopTopic();
    const res = await ctx.app.inject({ method: "PUT", url: `/api/admin/sop/${topic.id}/19`, payload: { body: "x" }, ...as(admin) });
    expect(res.statusCode).toBe(404);
  });
});
