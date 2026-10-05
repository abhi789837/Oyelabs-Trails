import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { SESSION_COOKIE } from "../../../shared/auth";
import { effectiveUiV5, parseUiOverride, uiV5PrefFrom } from "../../../shared/ui";
import { schema } from "../db";
import { activeLearner, adminSession, as, createTestApp, login, type Session, type TestContext } from "../test/harness";

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

async function me(session: Session) {
  const res = await ctx.app.inject({ method: "GET", url: "/api/auth/me", ...as(session) });
  expect(res.statusCode).toBe(200);
  return res.json();
}

async function setMine(session: Session, v5: boolean | null) {
  return ctx.app.inject({ method: "PUT", url: "/api/me/ui", ...as(session), payload: { v5 } });
}

async function setGlobal(session: Session, v5Default: "on" | "off") {
  return ctx.app.inject({ method: "PUT", url: "/api/admin/settings/ui", ...as(session), payload: { v5Default } });
}

async function staffAdminSession(username: string): Promise<Session> {
  const created = await ctx.app.inject({
    method: "POST",
    url: "/api/admin/users",
    ...as(admin),
    payload: {
      username,
      displayName: "A Lead",
      role: "admin",
      profile: { roleTitle: null, yearsExperience: null, adminNotes: "", claimedSkills: [], targetTracks: [] },
      issueAssessment: false,
    },
  });
  const temporary: string = created.json().temporaryPassword;
  const first = await login(ctx, username, temporary);
  const changed = await ctx.app.inject({
    method: "POST",
    url: "/api/auth/change-password",
    ...as(first),
    payload: { currentPassword: temporary, newPassword: "camp-ridge-settled-4417" },
  });
  const cookie = changed.cookies.find((c) => c.name === SESSION_COOKIE)!.value;
  return { cookie, user: changed.json().user };
}

describe("effectiveUiV5 (pure)", () => {
  test("the user's choice wins; no choice follows the global default", () => {
    expect(effectiveUiV5(null, "off")).toBe(false);
    expect(effectiveUiV5(undefined, "on")).toBe(true);
    expect(effectiveUiV5(true, "off")).toBe(true);
    expect(effectiveUiV5(false, "on")).toBe(false);
    expect(effectiveUiV5(null, null)).toBe(false);
  });

  test("only booleans count as a stored choice; only v5/old count as an override", () => {
    expect(uiV5PrefFrom({ uiV5: "yes" })).toBeNull();
    expect(uiV5PrefFrom({ uiV5: false })).toBe(false);
    expect(uiV5PrefFrom(null)).toBeNull();
    expect(parseUiOverride("v5")).toBe("v5");
    expect(parseUiOverride("old")).toBe("old");
    expect(parseUiOverride("new")).toBeNull();
  });
});

describe("the ui_v5 flag", () => {
  test("defaults to off", async () => {
    expect((await me(learner.session)).ui).toEqual({ v5: false });
    expect((await me(admin)).ui).toEqual({ v5: false });
    const settings = await ctx.app.inject({ method: "GET", url: "/api/admin/settings/ui", ...as(admin) });
    expect(settings.json()).toEqual({ v5Default: "off" });
  });

  test("/api/auth/me omits ui when nobody is signed in", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/api/auth/me" });
    expect(res.json().user).toBeNull();
    expect(res.json()).not.toHaveProperty("ui");
  });

  test("the user's own choice turns it on, and null hands it back to the default", async () => {
    const on = await setMine(learner.session, true);
    expect(on.statusCode).toBe(200);
    expect(on.json()).toEqual({ v5Pref: true, v5: true });
    expect((await me(learner.session)).ui).toEqual({ v5: true });

    await setMine(learner.session, null);
    expect((await me(learner.session)).ui).toEqual({ v5: false });
  });

  test("global on, but the user said no: they keep the old design", async () => {
    expect((await setGlobal(admin, "on")).statusCode).toBe(200);
    expect((await me(learner.session)).ui).toEqual({ v5: true });
    await setMine(learner.session, false);
    expect((await me(learner.session)).ui).toEqual({ v5: false });
  });

  test("keeps the other preferences in the shared blob", async () => {
    await ctx.app.inject({ method: "PUT", url: "/api/me/prefs", ...as(learner.session), payload: { autoplayNext: false } });
    await setMine(learner.session, true);
    const prefs = await ctx.app.inject({ method: "GET", url: "/api/me/prefs", ...as(learner.session) });
    expect(prefs.json().autoplayNext).toBe(false);
    // And the other way round: saving autoplay does not drop the design choice.
    await ctx.app.inject({ method: "PUT", url: "/api/me/prefs", ...as(learner.session), payload: { autoplayNext: true } });
    expect((await me(learner.session)).ui).toEqual({ v5: true });
  });

  test("each change is audited with from and to", async () => {
    await setMine(learner.session, true);
    await setMine(learner.session, false);
    const rows = ctx.db
      .select()
      .from(schema.auditLog)
      .where(and(eq(schema.auditLog.action, "ui.v5_toggle"), eq(schema.auditLog.targetId, learner.id)))
      .all()
      .map((row) => row.details);
    expect(rows).toEqual(expect.arrayContaining([{ from: null, to: true }, { from: true, to: false }]));
    expect(rows).toHaveLength(2);

    await setGlobal(admin, "on");
    const global = ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "ui.v5_default")).all();
    expect(global.map((row) => row.details)).toEqual([{ from: "off", to: "on" }]);
  });

  test("only the superadmin changes the global default", async () => {
    expect((await setGlobal(learner.session, "on")).statusCode).toBe(403);
    const lead = await staffAdminSession("dept.lead");
    expect((await setGlobal(lead, "on")).statusCode).toBe(403);
    // A department lead can still read it.
    expect((await ctx.app.inject({ method: "GET", url: "/api/admin/settings/ui", ...as(lead) })).statusCode).toBe(200);
    expect((await me(learner.session)).ui).toEqual({ v5: false });
  });

  test("rejects a malformed body and needs a session", async () => {
    expect((await ctx.app.inject({ method: "PUT", url: "/api/me/ui", ...as(learner.session), payload: { v5: "yes" } })).statusCode).toBe(400);
    expect((await ctx.app.inject({ method: "PUT", url: "/api/me/ui", payload: { v5: true } })).statusCode).toBe(401);
    expect((await setGlobal(admin, "maybe" as "on")).statusCode).toBe(400);
  });
});
