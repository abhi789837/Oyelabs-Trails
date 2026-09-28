import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { DEFAULT_HOURS_PER_WEEK, budgetCeiling, wordCount, type WeekResponse } from "../../../shared/weeklyPlan";
import { schema } from "../db";
import {
  activeLearner,
  adminSession,
  as,
  createTestApp,
  publishPlanFor,
  type Session,
  type TestContext,
} from "../test/harness";

/**
 * The weekly plan over the wire.
 *
 * `builder.test.ts` covers the rules; this covers the parts only a running app can be wrong about:
 * that the week is generated on first read, that it fits the budget the admin set, that completing a
 * lesson from anywhere in the app is reflected in it, that the next week is gated on the blocking
 * lanes, and that a learner cannot reach anybody else's week.
 */

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };
/** The first fifty topics of the real curriculum. Enough to overflow any sane weekly budget. */
let libraryTopicIds: string[];

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
  libraryTopicIds = ctx.content.orderedTopicIds.slice(0, 50);
  await publishPlanFor(ctx, admin, learner.id, libraryTopicIds);
});

async function getWeek(session = learner.session): Promise<WeekResponse> {
  const res = await ctx.app.inject({ method: "GET", url: "/api/me/week", ...as(session) });
  expect(res.statusCode).toBe(200);
  return res.json() as WeekResponse;
}

async function setPriorities(patch: Record<string, unknown>): Promise<void> {
  const res = await ctx.app.inject({
    method: "PUT",
    url: `/api/admin/users/${learner.id}/priorities`,
    ...as(admin),
    payload: { targetRole: "Backend Engineer", mustHave: [], skip: [], courseCap: 5, autoPublish: false, ...patch },
  });
  expect(res.statusCode).toBe(200);
}

/** Marks a curriculum topic completed the way passing a challenge does. */
function completeTopic(topicId: string): void {
  ctx.db
    .insert(schema.topicProgress)
    .values({
      userId: learner.id,
      topicId,
      status: "completed",
      bestScore: 100,
      attempts: 1,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: [schema.topicProgress.userId, schema.topicProgress.topicId],
      set: { status: "completed", completedAt: Date.now(), updatedAt: Date.now() },
    })
    .run();
}

describe("the first read builds the week", () => {
  test("a learner with a 50-lesson library gets one week, not fifty lessons", () => {
    /* The behaviour being replaced: the page showed the whole library at once. */
    return getWeek().then((body) => {
      expect(body.week).not.toBeNull();
      expect(body.week!.weekNumber).toBe(1);
      expect(body.week!.items.length).toBeGreaterThan(0);
      expect(body.week!.items.length).toBeLessThan(libraryTopicIds.length);
    });
  });

  test("the week fits the default fifteen-hour budget", async () => {
    const { week } = await getWeek();
    expect(week!.budgetMinutes).toBe(DEFAULT_HOURS_PER_WEEK * 60);
    expect(week!.plannedMinutes).toBeLessThanOrEqual(budgetCeiling(week!.budgetMinutes));
  });

  test("the whole library is still reported as unlocked", async () => {
    // The point of the redesign: narrow the week, not the library.
    const { week } = await getWeek();
    expect(week!.libraryLessonCount).toBe(libraryTopicIds.length);
  });

  test("every lesson is still reachable through the manifest", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/api/me/manifest", ...as(learner.session) });
    expect(res.json().planTopicIds).toHaveLength(libraryTopicIds.length);
  });

  test("the summary is short", async () => {
    const { week } = await getWeek();
    expect(wordCount(week!.summary)).toBeLessThanOrEqual(60);
    expect(week!.summary.length).toBeGreaterThan(10);
  });

  test("reading twice does not build two weeks", async () => {
    await getWeek();
    await getWeek();
    const rows = ctx.db.select().from(schema.weeklyPlans).where(eq(schema.weeklyPlans.userId, learner.id)).all();
    expect(rows).toHaveLength(1);
  });

  test("every item carries a reason and a link", async () => {
    const { week } = await getWeek();
    for (const item of week!.items) {
      expect(item.reason.length).toBeGreaterThan(2);
      expect(item.href).toMatch(/^\/(track|courses)\//);
      expect(item.title.length).toBeGreaterThan(1);
    }
  });

  test("no item appears in two lanes", async () => {
    const { week } = await getWeek();
    const keys = week!.items.map((item) => item.topicId ?? item.lessonId);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("the admin's hours-per-week is what the week is built to", () => {
  test("four hours gives a four-hour week", async () => {
    await setPriorities({ hoursPerWeek: 4 });
    const { week } = await getWeek();
    expect(week!.budgetMinutes).toBe(240);
    expect(week!.plannedMinutes).toBeLessThanOrEqual(budgetCeiling(240));
  });

  test("a High must-have reaches the red lane", async () => {
    await setPriorities({ mustHave: [{ skill: "JavaScript", weight: "high" }], hoursPerWeek: 15 });
    const { week } = await getWeek();
    const red = week!.items.filter((item) => item.lane === "do_now");
    expect(red.length).toBeGreaterThan(0);
    expect(red.some((item) => /admin/i.test(item.reason))).toBe(true);
  });

  test("a skipped skill is not scheduled", async () => {
    await setPriorities({ skip: ["JavaScript"], hoursPerWeek: 15 });
    const { week } = await getWeek();
    for (const item of week!.items) {
      expect(`${item.title} ${item.context}`.toLowerCase()).not.toContain("javascript");
    }
  });
});

describe("progress made anywhere shows up in the week", () => {
  test("passing a topic marks its item done without the week being told", async () => {
    const { week } = await getWeek();
    const target = week!.items[0]!;
    completeTopic(target.topicId!);

    const after = await getWeek();
    expect(after.week!.items.find((item) => item.id === target.id)?.status).toBe("done");
  });

  test("the week is not complete while a red or must-know item is pending", async () => {
    await setPriorities({ mustHave: [{ skill: "JavaScript", weight: "high" }] });
    const { week } = await getWeek();
    expect(week!.readyForNextWeek).toBe(false);
  });

  test("clearing the blocking lanes makes it ready, without needing Low", async () => {
    /* Low is skippable by design. Gating the next week on it would turn optional work into homework. */
    const { week } = await getWeek();
    for (const item of week!.items) {
      if (item.lane === "do_now" || item.lane === "must_know") completeTopic(item.topicId!);
    }
    const after = await getWeek();
    expect(after.week!.readyForNextWeek).toBe(true);
    expect(after.week!.items.some((item) => item.lane === "low" && item.status === "pending")).toBe(true);
  });
});

describe("planning the next week", () => {
  test("is refused while the blocking work is outstanding", async () => {
    await getWeek();
    const res = await ctx.app.inject({ method: "POST", url: "/api/me/week/next", ...as(learner.session), payload: {} });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/Do it now/i);
  });

  test("advances the number and retires the old week", async () => {
    const { week } = await getWeek();
    for (const item of week!.items) {
      if (item.lane === "do_now" || item.lane === "must_know") completeTopic(item.topicId!);
    }

    const res = await ctx.app.inject({ method: "POST", url: "/api/me/week/next", ...as(learner.session), payload: {} });
    expect(res.statusCode).toBe(200);
    const body = res.json() as WeekResponse;
    expect(body.week!.weekNumber).toBe(2);

    const previous = ctx.db.select().from(schema.weeklyPlans).where(eq(schema.weeklyPlans.id, week!.id)).get()!;
    expect(previous.status).not.toBe("active");
    expect(body.history.map((entry) => entry.weekNumber)).toEqual([2, 1]);
  });

  test("unfinished work comes back, and says it was carried", async () => {
    const { week } = await getWeek();
    const blocking = week!.items.filter((item) => item.lane === "do_now" || item.lane === "must_know");
    const leftover = week!.items.find((item) => item.lane === "low" || item.lane === "medium");
    for (const item of blocking) completeTopic(item.topicId!);

    const res = await ctx.app.inject({ method: "POST", url: "/api/me/week/next", ...as(learner.session), payload: {} });
    const body = res.json() as WeekResponse;

    if (leftover) {
      const again = body.week!.items.find((item) => item.topicId === leftover.topicId);
      expect(again).toBeDefined();
      expect(again!.carried).toBe(true);
      expect(again!.skipCount).toBe(1);
    }
  });

  test("a finished lesson is not carried forward", async () => {
    const { week } = await getWeek();
    for (const item of week!.items) completeTopic(item.topicId!);
    const done = week!.items.map((item) => item.topicId);

    const res = await ctx.app.inject({ method: "POST", url: "/api/me/week/next", ...as(learner.session), payload: {} });
    const body = res.json() as WeekResponse;
    for (const item of body.week!.items) expect(done).not.toContain(item.topicId);
  });
});

describe("the admin's overrides", () => {
  test("an item can be moved between lanes, and the move is audited", async () => {
    const { week } = await getWeek();
    const low = week!.items.find((item) => item.lane === "low")!;

    const res = await ctx.app.inject({
      method: "PATCH",
      url: `/api/admin/users/${learner.id}/week/items/${low.id}`,
      ...as(admin),
      payload: { lane: "do_now" },
    });
    expect(res.statusCode).toBe(200);
    expect((res.json() as WeekResponse).week!.items.find((item) => item.id === low.id)?.lane).toBe("do_now");

    const audit = ctx.db.select().from(schema.auditLog).all();
    expect(audit.some((entry) => entry.action === "week.item.moved")).toBe(true);
  });

  test("pinning forces an item into Do it now and survives a regeneration", async () => {
    const { week } = await getWeek();
    const low = week!.items.find((item) => item.lane === "low")!;

    await ctx.app.inject({
      method: "PATCH",
      url: `/api/admin/users/${learner.id}/week/items/${low.id}`,
      ...as(admin),
      payload: { pinned: true },
    });

    const regenerated = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${learner.id}/week/regenerate`,
      ...as(admin),
      payload: { rulesOnly: true },
    });
    expect(regenerated.statusCode).toBe(200);

    const body = regenerated.json() as WeekResponse;
    const again = body.week!.items.find((item) => item.topicId === low.topicId);
    expect(again?.lane).toBe("do_now");
    expect(again?.pinned).toBe(true);
  });

  test("reshaping keeps the week number; advancing raises it", async () => {
    await getWeek();

    const reshaped = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${learner.id}/week/regenerate`,
      ...as(admin),
      payload: { rulesOnly: true },
    });
    expect((reshaped.json() as WeekResponse).week!.weekNumber).toBe(1);

    const advanced = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${learner.id}/week/regenerate`,
      ...as(admin),
      payload: { rulesOnly: true, advance: true },
    });
    expect((advanced.json() as WeekResponse).week!.weekNumber).toBe(2);
  });

  test("changing hours-per-week and regenerating resizes the week", async () => {
    const before = await getWeek();
    await setPriorities({ hoursPerWeek: 3 });

    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${learner.id}/week/regenerate`,
      ...as(admin),
      payload: { rulesOnly: true },
    });
    const after = (res.json() as WeekResponse).week!;
    expect(after.budgetMinutes).toBe(180);
    expect(after.plannedMinutes).toBeLessThan(before.week!.plannedMinutes);
  });
});

describe("whose week it is", () => {
  test("a learner sees only their own", async () => {
    const other = await activeLearner(ctx, admin, "arjun.mehta");
    await publishPlanFor(ctx, admin, other.id, libraryTopicIds.slice(0, 10));

    const mine = await getWeek();
    const theirs = await getWeek(other.session);
    expect(mine.week!.id).not.toBe(theirs.week!.id);
  });

  test("a learner cannot read the admin view of anybody's week", async () => {
    const res = await ctx.app.inject({
      method: "GET",
      url: `/api/admin/users/${learner.id}/week`,
      ...as(learner.session),
    });
    expect(res.statusCode).toBe(403);
  });

  test("a learner cannot move an item in their own week", async () => {
    const { week } = await getWeek();
    const res = await ctx.app.inject({
      method: "PATCH",
      url: `/api/admin/users/${learner.id}/week/items/${week!.items[0]!.id}`,
      ...as(learner.session),
      payload: { lane: "do_now" },
    });
    expect(res.statusCode).toBe(403);
  });

  test("an admin cannot move an item that belongs to a different week", async () => {
    const other = await activeLearner(ctx, admin, "arjun.mehta");
    await publishPlanFor(ctx, admin, other.id, libraryTopicIds.slice(0, 10));
    const theirs = await getWeek(other.session);
    await getWeek();

    const res = await ctx.app.inject({
      method: "PATCH",
      url: `/api/admin/users/${learner.id}/week/items/${theirs.week!.items[0]!.id}`,
      ...as(admin),
      payload: { lane: "do_now" },
    });
    expect(res.statusCode).toBe(404);
  });

  test("no session is a 401", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/api/me/week" });
    expect(res.statusCode).toBe(401);
  });
});

describe("a learner with nothing unlocked", () => {
  test("gets a plain reason rather than an empty week", async () => {
    const fresh = await activeLearner(ctx, admin, "nikita.rao");
    const body = await getWeek(fresh.session);
    expect(body.week).toBeNull();
    expect(body.reason).toMatch(/nothing is unlocked/i);
  });
});
