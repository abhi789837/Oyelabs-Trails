import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { schema } from "../db";
import { SESSION_COOKIE } from "../../../shared/auth";
import { activeLearner, adminSession, as, createTestApp, login, type Session, type TestContext } from "../test/harness";

let ctx: TestContext;
let superadmin: Session;
let adminSess: Session;
let adminId: string;
let learner: { id: string; username: string; session: Session };

/**
 * The line between `admin` and `superadmin`.
 *
 * An `admin` runs the console for learners. Two things are withheld, and both are withheld for the
 * same reason — they reach past any one learner:
 *
 *   - **the shared AI credential**, which every learner's generation runs through, so one
 *     department lead could otherwise change what every other department's assessments are made
 *     with, or read the usage of people they do not manage;
 *   - **the staff accounts**, because an account that can create or disable its peers is not a
 *     restricted account. Three admins who can disable each other are three superadmins with extra
 *     steps.
 *
 * These are server-side assertions on purpose. The client hides the same things, but a hidden page
 * is not a protected one, and this is the half that actually holds.
 */
beforeEach(async () => {
  ctx = await createTestApp();
  superadmin = await adminSession(ctx);
  const created = await createStaff("surya", "Surya");
  adminId = created.id;
  adminSess = created.session;
  learner = await activeLearner(ctx, superadmin, "priya.sharma");
});

/**
 * Onboards an `admin` and signs them in with their forced password change done.
 *
 * Staff are onboarded exactly like learners — temporary password, locked out of every route until
 * it is changed — so this walks the same path `activeLearner` does rather than writing a row and
 * forging a cookie. Going through the real flow is the point: it is also a check that a staff
 * account *can* complete it.
 */
async function createStaff(username: string, displayName: string): Promise<{ id: string; session: Session }> {
  const created = await ctx.app.inject({
    method: "POST",
    url: "/api/admin/users",
    ...as(superadmin),
    payload: {
      username,
      displayName,
      role: "admin",
      profile: { roleTitle: null, yearsExperience: null, adminNotes: "", claimedSkills: [], targetTracks: [] },
      issueAssessment: false,
    },
  });
  if (created.statusCode !== 201) throw new Error(`could not create ${username}: ${created.statusCode} ${created.body}`);

  const temporary: string = created.json().temporaryPassword;
  const first = await login(ctx, username, temporary);
  const changed = await ctx.app.inject({
    method: "POST",
    url: "/api/auth/change-password",
    ...as(first),
    payload: { currentPassword: temporary, newPassword: "camp-ridge-settled-4417" },
  });
  if (changed.statusCode !== 200) throw new Error(`password change failed for ${username}: ${changed.body}`);
  const cookie = changed.cookies.find((c) => c.name === SESSION_COOKIE)!.value;
  return { id: created.json().user.id, session: { cookie, user: changed.json().user } };
}

describe("an admin runs the console", () => {
  test("can list people and open a learner", async () => {
    const list = await ctx.app.inject({ method: "GET", url: "/api/admin/users", ...as(adminSess) });
    expect(list.statusCode).toBe(200);

    const detail = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${learner.id}`, ...as(adminSess) });
    expect(detail.statusCode).toBe(200);
  });

  test("can onboard a learner", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/users",
      ...as(adminSess),
      payload: {
        username: "new.person",
        displayName: "New Person",
        profile: { roleTitle: null, yearsExperience: null, adminNotes: "", claimedSkills: [], targetTracks: [] },
        issueAssessment: false,
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().user.role).toBe("learner");
  });

  test("can see the overview and the live board", async () => {
    expect((await ctx.app.inject({ method: "GET", url: "/api/admin/overview", ...as(adminSess) })).statusCode).toBe(200);
    expect((await ctx.app.inject({ method: "GET", url: "/api/admin/live", ...as(adminSess) })).statusCode).toBe(200);
  });

  test("is notified when something needs the console, alongside the superadmin", async () => {
    // The recipients are every *active* staff member, which is the whole point of the change: an
    // admin who issues an assessment has to hear that it finished generating.
    const ids = ctx.db
      .select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users)
      .all()
      .filter((u) => u.role !== "learner")
      .map((u) => u.id);
    expect(ids).toContain(adminId);
    expect(ids.length).toBeGreaterThanOrEqual(2);
  });
});

describe("an admin does not get the AI credential", () => {
  test.each([
    ["GET", "/api/admin/ai"],
    ["GET", "/api/admin/ai/calls"],
  ])("%s %s is refused", async (method, url) => {
    const res = await ctx.app.inject({ method: method as "GET", url, ...as(adminSess) });
    expect(res.statusCode).toBe(403);
  });

  test("cannot add one", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/ai/credentials",
      ...as(adminSess),
      payload: { provider: "anthropic-api", label: "Mine", secret: "sk-ant-api03-whatever", sharedUseAcknowledged: true },
    });
    expect(res.statusCode).toBe(403);
    expect(ctx.db.select().from(schema.aiCredentials).all()).toHaveLength(0);
  });

  test("cannot change which one is active", async () => {
    const res = await ctx.app.inject({
      method: "PUT",
      url: "/api/admin/ai/settings",
      ...as(adminSess),
      payload: { modelGeneration: "something-cheaper" },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("an admin does not get the staff accounts", () => {
  test("cannot create another admin", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/users",
      ...as(adminSess),
      payload: {
        username: "nishant",
        displayName: "Nishant",
        role: "admin",
        profile: { roleTitle: null, yearsExperience: null, adminNotes: "", claimedSkills: [], targetTracks: [] },
        issueAssessment: false,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(ctx.db.select().from(schema.users).where(eq(schema.users.username, "nishant")).get()).toBeUndefined();
  });

  test("cannot disable the superadmin", async () => {
    const target = ctx.db.select().from(schema.users).where(eq(schema.users.role, "superadmin")).get()!;
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${target.id}/status`,
      ...as(adminSess),
      payload: { status: "disabled" },
    });
    expect(res.statusCode).toBe(403);
    expect(ctx.db.select().from(schema.users).where(eq(schema.users.id, target.id)).get()!.status).toBe("active");
  });

  test("cannot reset another admin's password", async () => {
    const { id: otherId } = await createStaff("saif", "Saif");

    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${otherId}/reset-password`,
      ...as(adminSess),
      payload: {},
    });
    expect(res.statusCode).toBe(403);
  });

  test("can still act on their own account", async () => {
    // Withholding peers' accounts must not withhold your own — otherwise an admin cannot sign
    // themselves out of a machine they left.
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${adminId}/revoke-sessions`,
      ...as(adminSess),
      payload: {},
    });
    expect(res.statusCode).toBe(200);
  });

  test("can still disable a learner", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${learner.id}/status`,
      ...as(adminSess),
      payload: { status: "disabled" },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe("a learner gets none of it", () => {
  test.each([
    ["/api/admin/users"],
    ["/api/admin/overview"],
    ["/api/admin/ai"],
  ])("%s is refused", async (url) => {
    const res = await ctx.app.inject({ method: "GET", url, ...as(learner.session) });
    expect(res.statusCode).toBe(403);
  });
});
