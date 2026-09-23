import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { LOGIN_MAX_FAILURES, SESSION_COOKIE } from "../../../shared/auth";
import { schema } from "../db";
import { ADMIN_PASSWORD, adminSession, as, createTestApp, login, seedAdmin, type TestContext } from "../test/harness";

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestApp();
});

afterEach(async () => {
  await ctx.close();
});

describe("seeding", () => {
  test("creates exactly one superadmin, and is idempotent", async () => {
    await seedAdmin(ctx);
    await seedAdmin(ctx);
    const admins = ctx.db.select().from(schema.users).where(eq(schema.users.role, "superadmin")).all();
    expect(admins).toHaveLength(1);
    expect(admins[0].mustChangePassword).toBe(true);
  });

  test("never stores the password in plain text", async () => {
    await seedAdmin(ctx);
    const admin = ctx.db.select().from(schema.users).get()!;
    expect(admin.passwordHash).not.toContain(ADMIN_PASSWORD);
    expect(admin.passwordHash.startsWith("$argon2id$")).toBe(true);
  });
});

describe("login", () => {
  beforeEach(async () => {
    await seedAdmin(ctx);
  });

  test("succeeds with the right password and sets an httpOnly session cookie", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: ctx.env.superadminUsername, password: ADMIN_PASSWORD },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.role).toBe("superadmin");
    expect(res.json().user.mustChangePassword).toBe(true);

    const cookie = res.cookies.find((c) => c.name === SESSION_COOKIE);
    expect(cookie).toBeDefined();
    expect(cookie!.httpOnly).toBe(true);
    expect(cookie!.sameSite?.toLowerCase()).toBe("lax");
    expect(cookie!.path).toBe("/");
  });

  test("the cookie value is not what is stored in the database", async () => {
    const session = await login(ctx, ctx.env.superadminUsername, ADMIN_PASSWORD);
    const rows = ctx.db.select().from(schema.sessions).all();
    expect(rows).toHaveLength(1);
    // The database holds a SHA-256 of the token, so a leaked dump contains no usable session.
    expect(rows[0].id).not.toBe(session.cookie);
    expect(rows[0].id).toHaveLength(64);
  });

  test("a username that does not exist and a wrong password give the same response", async () => {
    const wrongUser = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: "nobody.here", password: "some-long-password" },
    });
    const wrongPassword = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: ctx.env.superadminUsername, password: "some-long-password" },
    });
    expect(wrongUser.statusCode).toBe(401);
    expect(wrongPassword.statusCode).toBe(401);
    expect(wrongUser.json()).toEqual(wrongPassword.json());
    expect(wrongPassword.json().error.message).toBe("Invalid username or password.");
  });

  test("a malformed body is rejected like a wrong password, not as a validation error", async () => {
    const res = await ctx.app.inject({ method: "POST", url: "/api/auth/login", payload: { username: "x" } });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("unauthenticated");
  });

  test(`locks the account after ${LOGIN_MAX_FAILURES} failures and rejects the correct password while locked`, async () => {
    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { username: ctx.env.superadminUsername, password: `wrong-${i}-aaaaaaaa` },
      });
      expect(res.statusCode).toBe(401);
    }

    const locked = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: ctx.env.superadminUsername, password: ADMIN_PASSWORD },
    });
    expect(locked.statusCode).toBe(423);
    expect(locked.json().error.code).toBe("locked");
  });

  test("the lock clears once lockedUntil has passed", async () => {
    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) {
      await ctx.app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { username: ctx.env.superadminUsername, password: `wrong-${i}-aaaaaaaa` },
      });
    }
    ctx.db.update(schema.users).set({ lockedUntil: Date.now() - 1000 }).run();

    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: ctx.env.superadminUsername, password: ADMIN_PASSWORD },
    });
    expect(res.statusCode).toBe(200);
    expect(ctx.db.select().from(schema.users).get()!.failedLogins).toBe(0);
  });

  test("a disabled account cannot log in", async () => {
    ctx.db.update(schema.users).set({ status: "disabled" }).run();
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: ctx.env.superadminUsername, password: ADMIN_PASSWORD },
    });
    expect(res.statusCode).toBe(401);
  });

  test("logging in again discards the previous session", async () => {
    const first = await login(ctx, ctx.env.superadminUsername, ADMIN_PASSWORD);
    const second = await login(ctx, ctx.env.superadminUsername, ADMIN_PASSWORD);
    expect(second.cookie).not.toBe(first.cookie);

    const stale = await ctx.app.inject({ method: "GET", url: "/api/auth/me", ...as(first) });
    expect(stale.json().user).toBeNull();
    const fresh = await ctx.app.inject({ method: "GET", url: "/api/auth/me", ...as(second) });
    expect(fresh.json().user.username).toBe(ctx.env.superadminUsername);
  });
});

describe("me and logout", () => {
  test("returns null without a session rather than 401", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/api/auth/me" });
    expect(res.statusCode).toBe(200);
    expect(res.json().user).toBeNull();
  });

  test("logout removes the session row and the cookie", async () => {
    await seedAdmin(ctx);
    const session = await login(ctx, ctx.env.superadminUsername, ADMIN_PASSWORD);

    const res = await ctx.app.inject({ method: "POST", url: "/api/auth/logout", ...as(session) });
    expect(res.statusCode).toBe(200);
    expect(ctx.db.select().from(schema.sessions).all()).toHaveLength(0);

    const after = await ctx.app.inject({ method: "GET", url: "/api/auth/me", ...as(session) });
    expect(after.json().user).toBeNull();
  });
});

describe("forced password change", () => {
  beforeEach(async () => {
    await seedAdmin(ctx);
  });

  test("a must-change-password account is blocked from other routes but can reach change-password", async () => {
    const session = await login(ctx, ctx.env.superadminUsername, ADMIN_PASSWORD);

    const blocked = await ctx.app.inject({ method: "GET", url: "/api/admin/users", ...as(session) });
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json().error.code).toBe("password_change_required");

    const allowed = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/change-password",
      ...as(session),
      payload: { currentPassword: ADMIN_PASSWORD, newPassword: "a-much-better-passphrase-99" },
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json().user.mustChangePassword).toBe(false);
  });

  test("rejects the wrong current password", async () => {
    const session = await login(ctx, ctx.env.superadminUsername, ADMIN_PASSWORD);
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/change-password",
      ...as(session),
      payload: { currentPassword: "not-my-password", newPassword: "a-much-better-passphrase-99" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.fields.currentPassword).toBeDefined();
  });

  test("enforces the password policy on the new password", async () => {
    const session = await login(ctx, ctx.env.superadminUsername, ADMIN_PASSWORD);

    const tooShort = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/change-password",
      ...as(session),
      payload: { currentPassword: ADMIN_PASSWORD, newPassword: "short" },
    });
    expect(tooShort.statusCode).toBe(400);

    const tooCommon = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/change-password",
      ...as(session),
      payload: { currentPassword: ADMIN_PASSWORD, newPassword: "password1234" },
    });
    expect(tooCommon.statusCode).toBe(400);
    expect(tooCommon.json().error.fields.newPassword).toMatch(/common password/i);
  });

  test("rotates the session and signs out every other session", async () => {
    const one = await login(ctx, ctx.env.superadminUsername, ADMIN_PASSWORD);

    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/change-password",
      ...as(one),
      payload: { currentPassword: ADMIN_PASSWORD, newPassword: "a-much-better-passphrase-99" },
    });
    const rotated = res.cookies.find((c) => c.name === SESSION_COOKIE)!.value;
    expect(rotated).not.toBe(one.cookie);

    // The old cookie is dead, the new one works, and only one session row survives.
    const old = await ctx.app.inject({ method: "GET", url: "/api/auth/me", ...as(one) });
    expect(old.json().user).toBeNull();
    expect(ctx.db.select().from(schema.sessions).all()).toHaveLength(1);
  });

  test("the new password is the one that works afterwards", async () => {
    const session = await adminSession(ctx);
    expect(session.user.mustChangePassword).toBe(false);

    await expect(login(ctx, ctx.env.superadminUsername, ADMIN_PASSWORD)).rejects.toThrow();
    const relogin = await login(ctx, ctx.env.superadminUsername, "chosen-console-pw-8842");
    expect(relogin.user.role).toBe("superadmin");
  });
});
