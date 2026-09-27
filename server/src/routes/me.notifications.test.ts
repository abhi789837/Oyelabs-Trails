import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { notify } from "../lib/notify";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";

/**
 * The shell's notification bell reads `/api/me/notifications`.
 *
 * It exists because `notify()` writes rows addressed to *learners* — "your placement assessment is
 * ready", "your learning plan is ready" — and the only reader before this was
 * `/api/admin/notifications`, which is superadmin-only. These tests pin the two properties that
 * matter: a learner can read their own, and nobody can read anyone else's.
 */
let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
});

afterEach(async () => {
  await ctx.close();
});

describe("GET /api/me/notifications", () => {
  test("a learner reads the rows addressed to them, newest first", async () => {
    notify(ctx.app.db, {
      recipientId: learner.id,
      kind: "assessment.ready",
      title: "Your placement assessment is ready",
      body: "It takes about an hour.",
      link: "/assessment",
    });
    // `notify()` stamps with `Date.now()`, so two rows written in the same millisecond tie and the
    // order is whatever SQLite returns. A couple of milliseconds apart is what makes "newest
    // first" an actual assertion rather than a coin toss.
    await new Promise((resolve) => setTimeout(resolve, 2));
    notify(ctx.app.db, {
      recipientId: learner.id,
      kind: "plan.published",
      title: "Your learning plan is ready",
      body: "24 topics.",
      link: "/plan",
    });

    const res = await ctx.app.inject({ method: "GET", url: "/api/me/notifications", ...as(learner.session) });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.unread).toBe(2);
    expect(body.notifications.map((n: { kind: string }) => n.kind)).toEqual([
      "plan.published",
      "assessment.ready",
    ]);
  });

  test("one learner never sees another's", async () => {
    const other = await activeLearner(ctx, admin, "someone.else");
    notify(ctx.app.db, {
      recipientId: other.id,
      kind: "plan.published",
      title: "Not for you",
      body: "",
      link: null,
    });

    const res = await ctx.app.inject({ method: "GET", url: "/api/me/notifications", ...as(learner.session) });
    expect(res.json().notifications).toEqual([]);
    expect(res.json().unread).toBe(0);
  });

  test("signed out is unauthenticated, not empty", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/api/me/notifications" });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /api/me/notifications/read", () => {
  test("clears the unread count without removing the rows", async () => {
    notify(ctx.app.db, { recipientId: learner.id, kind: "plan.published", title: "One", body: "" });
    notify(ctx.app.db, { recipientId: learner.id, kind: "evaluation.ready", title: "Two", body: "" });

    const marked = await ctx.app.inject({
      method: "POST",
      url: "/api/me/notifications/read",
      ...as(learner.session),
    });
    expect(marked.statusCode).toBe(200);

    const after = (
      await ctx.app.inject({ method: "GET", url: "/api/me/notifications", ...as(learner.session) })
    ).json();
    expect(after.unread).toBe(0);
    expect(after.notifications).toHaveLength(2);
    expect(after.notifications.every((n: { readAt: number | null }) => n.readAt !== null)).toBe(true);
  });
});
