import { eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { ERROR_CODES } from "../../../shared/api";
import { SESSION_COOKIE, type SessionUser } from "../../../shared/auth";
import { schema } from "../db";
import { HttpError, forbidden, unauthenticated } from "../lib/errors";
import { touchSession } from "./sessions";

declare module "fastify" {
  interface FastifyRequest {
    /** Set by the auth hook on every request. Null when there is no valid session. */
    currentUser: SessionUser | null;
    sessionToken: string | null;
  }
}

/**
 * Resolves the session once per request so handlers can read `request.currentUser` instead of
 * each doing its own lookup. It deliberately rejects nothing — `/api/health` and the login route
 * are public — and leaves that to the guards below.
 *
 * The user row is re-read every request rather than cached in the session, so disabling an
 * account or changing a role takes effect on the next request instead of at the next login.
 */
export function registerAuthContext(app: FastifyInstance): void {
  app.decorateRequest("currentUser", null);
  app.decorateRequest("sessionToken", null);

  app.addHook("onRequest", async (request) => {
    const token = request.cookies[SESSION_COOKIE];
    const session = touchSession(app.db, token);
    if (!session) return;

    const row = app.db.select().from(schema.users).where(eq(schema.users.id, session.userId)).get();
    if (!row || row.status !== "active") return;

    request.sessionToken = token ?? null;
    request.currentUser = {
      id: row.id,
      username: row.username,
      displayName: row.displayName,
      role: row.role,
      status: row.status,
      mustChangePassword: row.mustChangePassword,
      lastLoginAt: row.lastLoginAt,
    };
  });
}

export function requireUser(request: FastifyRequest): SessionUser {
  if (!request.currentUser) throw unauthenticated();
  return request.currentUser;
}

/**
 * Everything outside `/api/auth/*` is closed until a forced password change is done, so a
 * temporary password cannot be used to browse content or start an assessment.
 */
export function requireActiveUser(request: FastifyRequest): SessionUser {
  const user = requireUser(request);
  if (user.mustChangePassword) {
    throw new HttpError(403, ERROR_CODES.PASSWORD_CHANGE_REQUIRED, "Change your password before continuing.");
  }
  return user;
}

export function requireSuperadmin(request: FastifyRequest): SessionUser {
  const user = requireActiveUser(request);
  if (user.role !== "superadmin") throw forbidden();
  return user;
}

// preHandler forms, for `app.addHook("preHandler", superadminOnly)` inside a route plugin.
export async function userOnly(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  requireActiveUser(request);
}

export async function superadminOnly(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  requireSuperadmin(request);
}
