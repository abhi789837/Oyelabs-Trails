import { eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";

import {
  changePasswordRequestSchema,
  loginRequestSchema,
  LOGIN_LOCK_MS,
  LOGIN_MAX_FAILURES,
  SESSION_COOKIE,
  type MeResponse,
  type SessionUser,
} from "../../../shared/auth";
import { checkPasswordPolicy, hashPassword, verifyPassword } from "../auth/password";
import { requireUser } from "../auth/guards";
import { createSession, deleteSession, revokeUserSessions } from "../auth/sessions";
import { schema } from "../db";
import type { Env } from "../env";
import { writeAudit } from "../lib/audit";
import { badRequest, locked, parseOrThrow, unauthenticated } from "../lib/errors";
import { now } from "../lib/ids";

function cookieOptions(env: Env, maxAgeMs: number) {
  return {
    httpOnly: true,
    // Lax, not Strict: a link from a chat message into the app should not land on the login page.
    // It is still safe against CSRF for the POSTs here, which Lax does not send cross-site.
    sameSite: "lax" as const,
    secure: env.isProduction,
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

function setSessionCookie(reply: FastifyReply, env: Env, token: string, expiresAt: number): void {
  reply.setCookie(SESSION_COOKIE, token, cookieOptions(env, Math.max(0, expiresAt - now())));
}

function clearSessionCookie(reply: FastifyReply, env: Env): void {
  reply.clearCookie(SESSION_COOKIE, { path: "/", httpOnly: true, sameSite: "lax", secure: env.isProduction });
}

function toSessionUser(row: typeof schema.users.$inferSelect): SessionUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    role: row.role,
    status: row.status,
    mustChangePassword: row.mustChangePassword,
    lastLoginAt: row.lastLoginAt,
  };
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  const env = app.env;

  app.get("/api/auth/me", async (request): Promise<MeResponse> => ({ user: request.currentUser }));

  app.post(
    "/api/auth/login",
    {
      config: {
        // Per-IP ceiling. The per-account lock below is what actually stops a targeted attack;
        // this stops one host spraying many usernames.
        rateLimit: { max: 20, timeWindow: "1 minute" },
      },
    },
    async (request, reply) => {
      const parsed = loginRequestSchema.safeParse(request.body);
      // A malformed body must look exactly like a wrong password, or the endpoint becomes a
      // username validator.
      if (!parsed.success) throw unauthenticated("Invalid username or password.");
      const { username, password } = parsed.data;

      const row = app.db.select().from(schema.users).where(eq(schema.users.username, username)).get();
      const current = now();

      if (row?.lockedUntil && row.lockedUntil > current) {
        const minutes = Math.ceil((row.lockedUntil - current) / 60_000);
        throw locked(`Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
      }

      // Always run a verification, even for an unknown username, so the response time does not
      // reveal whether the account exists.
      const dummyHash = "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$0000000000000000000000000000000000000000000";
      const ok = await verifyPassword(row?.passwordHash ?? dummyHash, password);

      if (!row || !ok || row.status !== "active") {
        if (row) {
          const failed = row.failedLogins + 1;
          const lockedUntil = failed >= LOGIN_MAX_FAILURES ? current + LOGIN_LOCK_MS : null;
          app.db
            .update(schema.users)
            .set({ failedLogins: lockedUntil ? 0 : failed, lockedUntil })
            .where(eq(schema.users.id, row.id))
            .run();
          if (lockedUntil) {
            writeAudit(app.db, {
              actorId: null,
              action: "auth.locked",
              targetType: "user",
              targetId: row.id,
              details: { failures: failed, ip: request.ip },
            });
          }
        }
        throw unauthenticated("Invalid username or password.");
      }

      // Rotate: any session id issued before this login is discarded (brief §6).
      revokeUserSessions(app.db, row.id);
      const session = createSession(app.db, { userId: row.id, ip: request.ip, userAgent: request.headers["user-agent"] });
      app.db
        .update(schema.users)
        .set({ failedLogins: 0, lockedUntil: null, lastLoginAt: current })
        .where(eq(schema.users.id, row.id))
        .run();

      setSessionCookie(reply, env, session.token, session.expiresAt);
      writeAudit(app.db, { actorId: row.id, action: "auth.login", targetType: "user", targetId: row.id, details: { ip: request.ip } });

      return { user: toSessionUser({ ...row, lastLoginAt: current }) } satisfies MeResponse;
    },
  );

  app.post("/api/auth/logout", async (request, reply) => {
    const user = request.currentUser;
    deleteSession(app.db, request.sessionToken ?? undefined);
    clearSessionCookie(reply, env);
    if (user) writeAudit(app.db, { actorId: user.id, action: "auth.logout", targetType: "user", targetId: user.id });
    return { ok: true };
  });

  app.post(
    "/api/auth/change-password",
    { config: { rateLimit: { max: 10, timeWindow: "5 minutes" } } },
    async (request, reply) => {
      // requireUser, not requireActiveUser: this is the one route a must-change-password account
      // is allowed to reach.
      const user = requireUser(request);
      const { currentPassword, newPassword } = parseOrThrow(changePasswordRequestSchema, request.body);

      const row = app.db.select().from(schema.users).where(eq(schema.users.id, user.id)).get();
      if (!row) throw unauthenticated();

      if (!(await verifyPassword(row.passwordHash, currentPassword))) {
        throw badRequest("That is not your current password.", { currentPassword: "Incorrect password." });
      }
      if (currentPassword === newPassword) {
        throw badRequest("Choose a password you have not used here before.", {
          newPassword: "The new password must be different.",
        });
      }
      const problem = checkPasswordPolicy(newPassword, row.username);
      if (problem) throw badRequest(problem.message, { newPassword: problem.message });

      app.db
        .update(schema.users)
        .set({ passwordHash: await hashPassword(newPassword), mustChangePassword: false })
        .where(eq(schema.users.id, row.id))
        .run();

      // Rotate the session id and drop every other session: a password change should sign out
      // anyone else who had the old one.
      revokeUserSessions(app.db, row.id);
      const session = createSession(app.db, { userId: row.id, ip: request.ip, userAgent: request.headers["user-agent"] });
      setSessionCookie(reply, env, session.token, session.expiresAt);

      writeAudit(app.db, { actorId: row.id, action: "auth.password_changed", targetType: "user", targetId: row.id });

      return { user: toSessionUser({ ...row, mustChangePassword: false }) } satisfies MeResponse;
    },
  );
}
