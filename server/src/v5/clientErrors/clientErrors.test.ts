import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { CLIENT_ERROR_LIMITS, CLIENT_ERROR_MAX, clientErrorReport, truncate } from "../../../../shared/clientErrors";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../../test/harness";
import { clientErrorStore } from "./routes";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; session: Session };
let now: number;
const originalNow = clientErrorStore.now;

beforeEach(async () => {
  clientErrorStore.reset();
  now = Date.UTC(2026, 9, 6, 9, 0, 0);
  clientErrorStore.now = () => now;
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
});

afterEach(async () => {
  clientErrorStore.now = originalNow;
  clientErrorStore.reset();
  await ctx?.close();
});

const report = (payload: unknown, session?: Session, ip = "10.0.0.1") =>
  ctx.app.inject({ method: "POST", url: "/api/client-errors", ...(session ? as(session) : {}), payload: payload as Record<string, unknown>, remoteAddress: ip });

describe("POST /api/client-errors", () => {
  test("stores a signed-in report with the user, truncating long fields", async () => {
    const res = await report({ route: "/learn/plan", message: "TypeError: x is undefined", stack: "s".repeat(CLIENT_ERROR_MAX.stack + 500) }, learner.session);
    expect(res.statusCode).toBe(204);
    const [entry] = clientErrorStore.recent;
    expect(entry).toMatchObject({ userId: learner.id, route: "/learn/plan", message: "TypeError: x is undefined" });
    expect(entry!.stack!.length).toBe(CLIENT_ERROR_MAX.stack);
  });

  test("accepts a signed-out report (the public certificate check) without a user", async () => {
    const res = await report({ route: "/verify/OYL-1", message: "Error: boom" });
    expect(res.statusCode).toBe(204);
    expect(clientErrorStore.recent[0]).toMatchObject({ userId: null, route: "/verify/OYL-1", stack: null });
  });

  test("refuses bad input with a 400 and stores nothing", async () => {
    expect((await report({ route: "", message: "x" }, learner.session)).statusCode).toBe(400);
    expect((await report({ route: "/learn", message: "x", extra: 1 }, learner.session)).statusCode).toBe(400);
    expect((await report({ route: "/learn" }, learner.session)).statusCode).toBe(400);
    expect(clientErrorStore.recent).toHaveLength(0);
  });

  test("limits each user per window, then lets them in again", async () => {
    for (let i = 0; i < CLIENT_ERROR_LIMITS.perUser; i++) {
      expect((await report({ route: "/learn", message: `Error ${i}` }, learner.session, `10.0.1.${i}`)).statusCode).toBe(204);
    }
    const blocked = await report({ route: "/learn", message: "one more" }, learner.session, "10.0.2.1");
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json().error.code).toBe("rate_limited");
    now += CLIENT_ERROR_LIMITS.windowMs;
    expect((await report({ route: "/learn", message: "later" }, learner.session, "10.0.2.1")).statusCode).toBe(204);
  });

  test("limits each IP per window, signed in or not", async () => {
    for (let i = 0; i < CLIENT_ERROR_LIMITS.perIp; i++) {
      expect((await report({ route: "/verify/x", message: `Error ${i}` }, undefined, "10.9.9.9")).statusCode).toBe(204);
    }
    expect((await report({ route: "/verify/x", message: "over" }, undefined, "10.9.9.9")).statusCode).toBe(429);
    // Another address still gets through.
    expect((await report({ route: "/verify/x", message: "other" }, undefined, "10.9.9.10")).statusCode).toBe(204);
  });

  test("keeps only the newest reports in memory, and staff can read them", async () => {
    for (let i = 0; i < 3; i++) await report({ route: "/learn", message: `Error ${i}` }, undefined, `10.3.0.${i}`);
    const forLearner = await ctx.app.inject({ method: "GET", url: "/api/admin/v5/client-errors", ...as(learner.session) });
    expect(forLearner.statusCode).toBe(403);
    const forStaff = await ctx.app.inject({ method: "GET", url: "/api/admin/v5/client-errors", ...as(admin) });
    expect(forStaff.statusCode).toBe(200);
    expect(forStaff.json().errors.map((e: { message: string }) => e.message)).toEqual(["Error 2", "Error 1", "Error 0"]);
  });
});

describe("clientErrorReport", () => {
  test("drops the query and hash from the route and names the error", () => {
    const r = clientErrorReport(new TypeError("bad"), "/learn/library?q=secret#x");
    expect(r.route).toBe("/learn/library");
    expect(r.message).toBe("TypeError: bad");
    expect(r.stack).toContain("bad");
  });

  test("copes with things that are not errors", () => {
    expect(clientErrorReport("plain", "/")).toEqual({ route: "/", message: "plain" });
    expect(clientErrorReport({ odd: true }, "")).toEqual({ route: "/", message: "Unknown error" });
  });

  test("truncate keeps short strings and marks cut ones", () => {
    expect(truncate("abc", 5)).toBe("abc");
    expect(truncate("abcdef", 4)).toBe("abc…");
  });
});
