/**
 * Development helper: set a temporary password on a local account.
 *
 *   npm run dev:password -- admin
 *   npm run dev:password -- admin --password "my own choice"
 *
 * The superadmin's first-boot password is printed once and stored nowhere, so a development
 * database that outlives the terminal it was created in has no way back in. This is that way back
 * in. It also clears the failed-login lock and revokes existing sessions, which is what an admin
 * reset does, and leaves `must_change_password` set so the app asks for a real password at sign-in.
 *
 * Refuses to run in production: a superadmin password reset there belongs in an audited flow, not
 * in a script that prints credentials to stdout.
 */
import crypto from "node:crypto";

import { eq } from "drizzle-orm";

import { generatePassword, hashPassword } from "../auth/password";
import { openDb, schema } from "../db";
import { loadEnv } from "../env";
import { writeAudit } from "../lib/audit";

async function main(): Promise<void> {
  const env = loadEnv();
  if (env.isProduction) {
    console.error("dev:password refuses to run with NODE_ENV=production.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const username = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase() ?? env.superadminUsername;
  const flagIndex = args.indexOf("--password");
  const chosen = flagIndex >= 0 ? args[flagIndex + 1] : undefined;

  const { db, sqlite } = openDb(env);

  const user = db.select().from(schema.users).where(eq(schema.users.username, username)).get();
  if (!user) {
    const known = db.select({ username: schema.users.username, role: schema.users.role }).from(schema.users).all();
    console.error(`No account named "${username}".`);
    if (known.length) console.error(`Accounts on this database: ${known.map((u) => `${u.username} (${u.role})`).join(", ")}`);
    else console.error("This database has no accounts at all — start the server once to seed the superadmin.");
    sqlite.close();
    process.exit(1);
  }

  const password = chosen ?? generatePassword((n) => crypto.randomBytes(n), 16);

  db.update(schema.users)
    .set({
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
      failedLogins: 0,
      lockedUntil: null,
    })
    .where(eq(schema.users.id, user.id))
    .run();

  // A password reset that leaves old sessions alive is not a reset.
  db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id)).run();

  writeAudit(db, { actorId: null, action: "dev.password_reset", targetType: "user", targetId: user.id, details: { username } });

  sqlite.close();

  const line = "=".repeat(64);
  console.log(
    ["", line, `  Temporary password set for "${username}" (${user.role})`, "", `  username: ${username}`, `  password: ${password}`, "", "  You will be asked to change it at sign-in.", line, ""].join("\n"),
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
