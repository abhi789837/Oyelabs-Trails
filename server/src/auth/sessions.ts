import crypto from "node:crypto";

import { eq, lt } from "drizzle-orm";

import { SESSION_ABSOLUTE_MS, SESSION_SLIDING_MS } from "../../../shared/auth";
import { schema, type Db } from "../db";
import { now } from "../lib/ids";

export interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: number;
  absoluteExpiresAt: number;
}

/**
 * The cookie carries a random 256-bit token; the database stores only its SHA-256. A leaked
 * database backup therefore contains no usable session tokens. SHA-256 is right here (rather than
 * argon2): the token is already high-entropy, so there is nothing to brute-force, and session
 * lookup happens on every request.
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export interface CreateSessionInput {
  userId: string;
  ip?: string | undefined;
  userAgent?: string | undefined;
}

/** Returns the raw token to put in the cookie. It is never stored or logged. */
export function createSession(db: Db, input: CreateSessionInput): { token: string; expiresAt: number } {
  const token = crypto.randomBytes(32).toString("base64url");
  const created = now();
  const expiresAt = created + SESSION_SLIDING_MS;

  db.insert(schema.sessions)
    .values({
      id: hashToken(token),
      userId: input.userId,
      createdAt: created,
      expiresAt,
      absoluteExpiresAt: created + SESSION_ABSOLUTE_MS,
      lastSeenAt: created,
      ip: input.ip ?? null,
      userAgent: input.userAgent?.slice(0, 400) ?? null,
    })
    .run();

  return { token, expiresAt };
}

/**
 * Looks up a session and slides its expiry forward, never past the absolute cap.
 *
 * Returns null for an unknown, expired or past-cap token, and deletes the row in the latter two
 * cases so expired sessions do not accumulate.
 */
export function touchSession(db: Db, token: string | undefined): SessionRecord | null {
  if (!token) return null;
  const id = hashToken(token);
  const row = db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).get();
  if (!row) return null;

  const current = now();
  if (row.expiresAt <= current || row.absoluteExpiresAt <= current) {
    db.delete(schema.sessions).where(eq(schema.sessions.id, id)).run();
    return null;
  }

  const nextExpiry = Math.min(current + SESSION_SLIDING_MS, row.absoluteExpiresAt);
  // Only write when the expiry actually moves by more than a minute, so a burst of requests
  // (the assessment heartbeat, the admin SSE feed) does not write on every single one.
  if (nextExpiry - row.expiresAt > 60_000) {
    db.update(schema.sessions)
      .set({ expiresAt: nextExpiry, lastSeenAt: current })
      .where(eq(schema.sessions.id, id))
      .run();
  }

  return { id: row.id, userId: row.userId, expiresAt: nextExpiry, absoluteExpiresAt: row.absoluteExpiresAt };
}

export function deleteSession(db: Db, token: string | undefined): void {
  if (!token) return;
  db.delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token))).run();
}

/** Used on password change and by the admin's "sign out everywhere" action. */
export function revokeUserSessions(db: Db, userId: string, exceptToken?: string): number {
  const keep = exceptToken ? hashToken(exceptToken) : null;
  const rows = db.select({ id: schema.sessions.id }).from(schema.sessions).where(eq(schema.sessions.userId, userId)).all();
  let removed = 0;
  for (const row of rows) {
    if (keep && row.id === keep) continue;
    db.delete(schema.sessions).where(eq(schema.sessions.id, row.id)).run();
    removed += 1;
  }
  return removed;
}

/**
 * Housekeeping, called on boot. `expiresAt` is always clamped to `absoluteExpiresAt` when it is
 * slid forward, so it alone is enough to identify a dead session.
 */
export function purgeExpiredSessions(db: Db): number {
  const result = db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, now())).run();
  return result.changes ?? 0;
}
