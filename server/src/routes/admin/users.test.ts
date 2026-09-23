import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { schema } from "../../db";
import {
  adminSession,
  as,
  createTestApp,
  login,
  onboardLearner,
  sampleProfile,
  type Session,
  type TestContext,
} from "../../test/harness";

let ctx: TestContext;
let admin: Session;

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
});

afterEach(async () => {
  await ctx.close();
});

describe("onboarding", () => {
  test("creates a learner with a generated temporary password and the profile", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/users",
      ...as(admin),
      payload: { username: "Priya.M", displayName: "Priya M", profile: sampleProfile, issueAssessment: false },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user.username).toBe("priya.m"); // normalised to lowercase
    expect(body.user.role).toBe("learner");
    expect(body.user.mustChangePassword).toBe(true);
    expect(body.temporaryPassword).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);

    const profile = ctx.db.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, body.user.id)).get();
    expect(profile?.adminNotes).toBe(sampleProfile.adminNotes);
    expect(profile?.claimedSkills).toEqual(sampleProfile.claimedSkills);
    expect(profile?.targetTracks).toEqual(["frontend"]);
  });

  test("the temporary password actually works and forces a change", async () => {
    const learner = await onboardLearner(ctx, admin);
    const session = await login(ctx, learner.username, learner.temporaryPassword);
    expect(session.user.mustChangePassword).toBe(true);

    const blocked = await ctx.app.inject({ method: "GET", url: "/api/auth/me", ...as(session) });
    expect(blocked.json().user.role).toBe("learner");
  });

  test("rejects a duplicate username", async () => {
    await onboardLearner(ctx, admin, "dupe.user");
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/users",
      ...as(admin),
      payload: { username: "dupe.user", displayName: "Other", profile: sampleProfile, issueAssessment: false },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.fields.username).toBeDefined();
  });

  test("rejects an admin-chosen password that fails the policy", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/users",
      ...as(admin),
      payload: {
        username: "weak.user",
        displayName: "Weak",
        password: "password123",
        profile: sampleProfile,
        issueAssessment: false,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.fields.password).toMatch(/common password/i);
  });

  test("rejects an invalid profile with per-field messages", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/users",
      ...as(admin),
      payload: {
        username: "bad.profile",
        displayName: "Bad",
        profile: { ...sampleProfile, targetTracks: ["not-a-track"] },
        issueAssessment: false,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(Object.keys(res.json().error.fields).join()).toMatch(/targetTracks/);
  });

  test("writes an audit entry that does not contain the password or the notes", async () => {
    const learner = await onboardLearner(ctx, admin);
    const entry = ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.targetId, learner.id)).get();
    expect(entry?.action).toBe("user.onboarded");
    const serialised = JSON.stringify(entry);
    expect(serialised).not.toContain(learner.temporaryPassword);
    expect(serialised).not.toContain(sampleProfile.adminNotes);
  });
});

describe("learner access", () => {
  test("a learner gets 403 on every registered /api/admin route", async () => {
    const learner = await onboardLearner(ctx, admin);
    const session = await login(ctx, learner.username, learner.temporaryPassword);
    // Get past must_change_password so the 403 proves the role guard, not the password guard.
    const changed = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/change-password",
      ...as(session),
      payload: { currentPassword: learner.temporaryPassword, newPassword: "learner-picked-pw-5521" },
    });
    expect(changed.statusCode).toBe(200);
    const active: Session = { cookie: changed.cookies[0].value, user: changed.json().user };

    const adminRoutes = ctx.app.routeTable.filter((r) => r.url.startsWith("/api/admin"));
    expect(adminRoutes.length).toBeGreaterThan(5);

    for (const route of adminRoutes) {
      const url = route.url.replace(/:[a-zA-Z]+/g, admin.user.id);
      const res = await ctx.app.inject({ method: route.method as "GET", url, ...as(active), payload: {} });
      expect(
        res.statusCode,
        `${route.method} ${url} should be forbidden for a learner but returned ${res.statusCode}`,
      ).toBe(403);
      expect(res.json().error.code).toBe("forbidden");
    }
  });

  test("an anonymous request to an admin route is 401, not 403", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/users" });
    expect(res.statusCode).toBe(401);
  });

  test("a learner cannot read another learner's detail through the admin route", async () => {
    const one = await onboardLearner(ctx, admin, "learner.a");
    const two = await onboardLearner(ctx, admin, "learner.b");
    const session = await login(ctx, one.username, one.temporaryPassword);

    const res = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${two.id}`, ...as(session) });
    expect(res.statusCode).toBe(403);
    expect(res.body).not.toContain(sampleProfile.adminNotes);
  });
});

describe("account actions", () => {
  test("reset-password issues a new temporary password and revokes sessions", async () => {
    const learner = await onboardLearner(ctx, admin);
    const session = await login(ctx, learner.username, learner.temporaryPassword);
    expect(ctx.db.select().from(schema.sessions).all().length).toBe(2); // admin + learner

    const res = await ctx.app.inject({ method: "POST", url: `/api/admin/users/${learner.id}/reset-password`, ...as(admin), payload: {} });
    expect(res.statusCode).toBe(200);
    const next = res.json().temporaryPassword as string;
    expect(next).not.toBe(learner.temporaryPassword);

    const dead = await ctx.app.inject({ method: "GET", url: "/api/auth/me", ...as(session) });
    expect(dead.json().user).toBeNull();

    await expect(login(ctx, learner.username, learner.temporaryPassword)).rejects.toThrow();
    const relogin = await login(ctx, learner.username, next);
    expect(relogin.user.mustChangePassword).toBe(true);
  });

  test("disabling an account revokes its sessions and blocks login", async () => {
    const learner = await onboardLearner(ctx, admin);
    const session = await login(ctx, learner.username, learner.temporaryPassword);

    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${learner.id}/status`,
      ...as(admin),
      payload: { status: "disabled" },
    });
    expect(res.statusCode).toBe(200);

    const dead = await ctx.app.inject({ method: "GET", url: "/api/auth/me", ...as(session) });
    expect(dead.json().user).toBeNull();
    await expect(login(ctx, learner.username, learner.temporaryPassword)).rejects.toThrow();
  });

  test("an admin cannot disable their own account", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${admin.user.id}/status`,
      ...as(admin),
      payload: { status: "disabled" },
    });
    expect(res.statusCode).toBe(400);
  });

  test("revoke-sessions keeps the admin's own session alive", async () => {
    const res = await ctx.app.inject({ method: "POST", url: `/api/admin/users/${admin.user.id}/revoke-sessions`, ...as(admin), payload: {} });
    expect(res.statusCode).toBe(200);
    const still = await ctx.app.inject({ method: "GET", url: "/api/auth/me", ...as(admin) });
    expect(still.json().user.id).toBe(admin.user.id);
  });

  test("updating a profile round-trips and is validated", async () => {
    const learner = await onboardLearner(ctx, admin);
    const updated = { ...sampleProfile, adminNotes: "Rewrote the notes after a 1:1.", yearsExperience: 3 };

    const res = await ctx.app.inject({
      method: "PUT",
      url: `/api/admin/users/${learner.id}/profile`,
      ...as(admin),
      payload: { profile: updated },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().profile.adminNotes).toBe(updated.adminNotes);

    const detail = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${learner.id}`, ...as(admin) });
    expect(detail.json().profile.yearsExperience).toBe(3);
  });

  test("acting on an unknown user is 404", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/users/01JZZZZZZZZZZZZZZZZZZZZZZZ", ...as(admin) });
    expect(res.statusCode).toBe(404);
  });
});

describe("people list", () => {
  test("lists the admin and every learner with plan and assessment columns", async () => {
    await onboardLearner(ctx, admin, "list.a");
    await onboardLearner(ctx, admin, "list.b");

    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/users", ...as(admin) });
    expect(res.statusCode).toBe(200);
    const users = res.json().users;
    expect(users).toHaveLength(3);

    const learner = users.find((u: { username: string }) => u.username === "list.a");
    expect(learner.assessmentStatus).toBeNull();
    expect(learner.planTopicCount).toBe(0);
    expect(learner.roleTitle).toBe(sampleProfile.roleTitle);
  });

  test("the list never includes password hashes", async () => {
    await onboardLearner(ctx, admin);
    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/users", ...as(admin) });
    expect(res.body).not.toContain("$argon2id$");
    expect(res.body).not.toContain("passwordHash");
  });
});
