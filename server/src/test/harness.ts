import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { FastifyInstance, InjectOptions } from "fastify";

import { SESSION_COOKIE } from "../../../shared/auth";
import type { LearnerProfile } from "../../../shared/profile";
import { buildApp } from "../app";
import { seedSuperadmin } from "../auth/seed";
import { openDb, type Db } from "../db";
import { loadEnv, type Env } from "../env";

export interface TestContext {
  app: FastifyInstance;
  db: Db;
  env: Env;
  close: () => Promise<void>;
}

/**
 * Builds a fully wired app against a fresh in-memory database with migrations applied.
 *
 * Each call gets its own throwaway data directory, because `loadEnv` writes a dev master key and
 * session secret there; sharing one would let tests leak state into each other.
 */
export async function createTestApp(overrides: Partial<NodeJS.ProcessEnv> = {}): Promise<TestContext> {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "trails-test-"));
  const env = loadEnv({
    NODE_ENV: "test",
    DATA_DIR: dataDir,
    // Point the SPA lookup at a directory that will not exist, so tests exercise the API-only path.
    CLIENT_DIST: path.join(dataDir, "no-dist"),
    ...overrides,
  } as NodeJS.ProcessEnv);

  const { db, sqlite } = openDb(env, { file: ":memory:" });
  const app = await buildApp({ env, db, logger: false });
  await app.ready();

  return {
    app,
    db,
    env,
    close: async () => {
      await app.close();
      sqlite.close();
      fs.rmSync(dataDir, { recursive: true, force: true });
    },
  };
}

export const ADMIN_PASSWORD = "seeded-admin-pw-2026";

/** Creates the superadmin the same way boot does, with a known password. */
export async function seedAdmin(ctx: TestContext, password = ADMIN_PASSWORD): Promise<void> {
  await seedSuperadmin(ctx.db, { ...ctx.env, superadminPassword: password });
}

export interface Session {
  cookie: string;
  user: { id: string; username: string; role: string; mustChangePassword: boolean };
}

/** Logs in and returns the raw session cookie value, for use as `cookies` in later injections. */
export async function login(ctx: TestContext, username: string, password: string): Promise<Session> {
  const res = await ctx.app.inject({ method: "POST", url: "/api/auth/login", payload: { username, password } });
  if (res.statusCode !== 200) {
    throw new Error(`login failed for ${username}: ${res.statusCode} ${res.body}`);
  }
  const cookie = res.cookies.find((c) => c.name === SESSION_COOKIE)?.value;
  if (!cookie) throw new Error("login succeeded but set no session cookie");
  return { cookie, user: res.json().user };
}

/** `as(session)` spreads into an inject call to authenticate it. */
export function as(session: Session): Pick<InjectOptions, "cookies"> {
  return { cookies: { [SESSION_COOKIE]: session.cookie } };
}

export const sampleProfile: LearnerProfile = {
  roleTitle: "Frontend Engineer",
  yearsExperience: 2,
  adminNotes: "Strong with React basics, shaky on async JavaScript. Has shipped two internal dashboards.",
  claimedSkills: [
    { area: "React", level: 3 },
    { area: "JavaScript", level: 2, note: "Struggles with promises" },
  ],
  targetTracks: ["frontend"],
};

/**
 * Signs in the admin, onboards a learner, and returns the learner's id and temporary password.
 * Most admin tests need exactly this much setup.
 */
export async function onboardLearner(
  ctx: TestContext,
  adminSession: Session,
  username = "learner.one",
): Promise<{ id: string; username: string; temporaryPassword: string }> {
  const res = await ctx.app.inject({
    method: "POST",
    url: "/api/admin/users",
    ...as(adminSession),
    payload: { username, displayName: "Learner One", profile: sampleProfile, issueAssessment: false },
  });
  if (res.statusCode !== 201) throw new Error(`onboarding failed: ${res.statusCode} ${res.body}`);
  const body = res.json();
  return { id: body.user.id, username: body.user.username, temporaryPassword: body.temporaryPassword };
}

/** Signs the admin in past the forced password change, which every admin action requires. */
export async function adminSession(ctx: TestContext): Promise<Session> {
  await seedAdmin(ctx);
  const first = await login(ctx, ctx.env.superadminUsername, ADMIN_PASSWORD);
  const res = await ctx.app.inject({
    method: "POST",
    url: "/api/auth/change-password",
    ...as(first),
    payload: { currentPassword: ADMIN_PASSWORD, newPassword: "chosen-console-pw-8842" },
  });
  if (res.statusCode !== 200) throw new Error(`admin password change failed: ${res.statusCode} ${res.body}`);
  const cookie = res.cookies.find((c) => c.name === SESSION_COOKIE)?.value;
  if (!cookie) throw new Error("password change did not rotate the session cookie");
  return { cookie, user: res.json().user };
}
