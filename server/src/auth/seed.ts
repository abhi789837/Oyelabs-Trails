import crypto from "node:crypto";

import { eq } from "drizzle-orm";

import { schema, type Db } from "../db";
import type { Env } from "../env";
import { writeAudit } from "../lib/audit";
import { newId, now } from "../lib/ids";
import { generatePassword, hashPassword } from "./password";

export interface SeedResult {
  created: boolean;
  username: string;
  /** Set only when the password was generated here, so the caller can print it exactly once. */
  generatedPassword?: string;
}

/**
 * Creates the first superadmin if none exists (brief §6). There is no self-signup, so without
 * this the app would have no way in.
 *
 * `must_change_password` is always true, including when SUPERADMIN_PASSWORD was supplied: that
 * value lives in an env file or a compose file, which is not somewhere a long-lived credential
 * should stay.
 */
export async function seedSuperadmin(db: Db, env: Env): Promise<SeedResult> {
  const existing = db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, "superadmin")).get();
  if (existing) return { created: false, username: env.superadminUsername };

  const username = env.superadminUsername;
  const taken = db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.username, username)).get();
  if (taken) {
    throw new Error(
      `Cannot seed the superadmin: the username "${username}" already belongs to a non-superadmin account. Set SUPERADMIN_USERNAME to something else.`,
    );
  }

  const generated = env.superadminPassword ? undefined : generatePassword((n) => crypto.randomBytes(n), 20);
  const password = env.superadminPassword ?? generated;
  if (!password) throw new Error("Could not determine a superadmin password.");

  const id = newId();
  db.insert(schema.users)
    .values({
      id,
      username,
      displayName: "Super Admin",
      passwordHash: await hashPassword(password),
      role: "superadmin",
      status: "active",
      mustChangePassword: true,
      createdBy: null,
      createdAt: now(),
    })
    .run();

  writeAudit(db, { actorId: null, action: "superadmin.seeded", targetType: "user", targetId: id, details: { username } });

  return { created: true, username, ...(generated ? { generatedPassword: generated } : {}) };
}

/**
 * Prints the generated password once, at boot, framed so it is obvious in a container log.
 * It is never written to a file and never appears again.
 */
export function announceSeed(result: SeedResult, log: (message: string) => void): void {
  if (!result.created) return;
  if (!result.generatedPassword) {
    log(`Created the superadmin "${result.username}". Sign in with SUPERADMIN_PASSWORD; you will be asked to change it.`);
    return;
  }
  const line = "=".repeat(64);
  log(
    [
      "",
      line,
      "  FIRST BOOT: superadmin account created",
      `  username: ${result.username}`,
      `  password: ${result.generatedPassword}`,
      "",
      "  This password is shown once and is not stored anywhere else.",
      "  You will be required to change it at first login.",
      line,
      "",
    ].join("\n"),
  );
}
