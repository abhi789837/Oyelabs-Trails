import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { CLIENT_ERROR_KEEP, CLIENT_ERROR_LIMITS, CLIENT_ERROR_MAX, truncate } from "../../../../shared/clientErrors";
import { ERROR_CODES } from "../../../../shared/api";
import { requireStaff } from "../../auth/guards";
import { HttpError, parseOrThrow } from "../../lib/errors";

const body = z
  .object({
    route: z.string().min(1).max(CLIENT_ERROR_MAX.route * 2),
    message: z.string().min(1).max(CLIENT_ERROR_MAX.message * 4),
    stack: z.string().max(CLIENT_ERROR_MAX.stack * 4).nullish(),
  })
  .strict();

export interface StoredClientError {
  at: number;
  userId: string | null;
  ip: string;
  route: string;
  message: string;
  stack: string | null;
  userAgent: string | null;
}

/**
 * The log and its limits live in memory. There is no table (that would need a migration, see
 * DECISIONS "Phase 9.2"); every accepted report is also written to the server log, which is where
 * it is kept. The in-memory copy is capped at CLIENT_ERROR_KEEP and is for a quick look by staff.
 */
export const clientErrorStore = {
  recent: [] as StoredClientError[],
  windows: new Map<string, { start: number; count: number }>(),
  now: () => Date.now(),
  reset() {
    this.recent = [];
    this.windows.clear();
  },
};

/** True when this key still has room in its fixed window (and counts the hit). */
function take(key: string, max: number, now: number): boolean {
  const w = clientErrorStore.windows.get(key);
  if (!w || now - w.start >= CLIENT_ERROR_LIMITS.windowMs) {
    clientErrorStore.windows.set(key, { start: now, count: 1 });
    if (clientErrorStore.windows.size > 5000) {
      for (const [k, v] of clientErrorStore.windows) if (now - v.start >= CLIENT_ERROR_LIMITS.windowMs) clientErrorStore.windows.delete(k);
    }
    return true;
  }
  if (w.count >= max) return false;
  w.count += 1;
  return true;
}

const tooMany = () => new HttpError(429, ERROR_CODES.RATE_LIMITED, "Too many error reports. They will be accepted again in a few minutes.");

/**
 * `POST /api/client-errors` (v5 Phase 9.2): the route error boundary reports a crash here. Open to
 * signed-out pages too (the public certificate check), limited per IP and, when signed in, per
 * user. `GET /api/admin/v5/client-errors` shows staff the newest ones.
 */
export async function registerClientErrorRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/client-errors", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request, reply) => {
    const input = parseOrThrow(body, request.body ?? {}, "That error report was not valid.");
    const now = clientErrorStore.now();
    const user = request.currentUser;
    if (!take(`ip:${request.ip}`, CLIENT_ERROR_LIMITS.perIp, now)) throw tooMany();
    if (user && !take(`user:${user.id}`, CLIENT_ERROR_LIMITS.perUser, now)) throw tooMany();

    const entry: StoredClientError = {
      at: now,
      userId: user?.id ?? null,
      ip: request.ip,
      route: truncate(input.route, CLIENT_ERROR_MAX.route),
      message: truncate(input.message, CLIENT_ERROR_MAX.message),
      stack: input.stack ? truncate(input.stack, CLIENT_ERROR_MAX.stack) : null,
      userAgent: typeof request.headers["user-agent"] === "string" ? truncate(request.headers["user-agent"], 300) : null,
    };
    clientErrorStore.recent.unshift(entry);
    if (clientErrorStore.recent.length > CLIENT_ERROR_KEEP) clientErrorStore.recent.length = CLIENT_ERROR_KEEP;
    request.log.warn({ clientError: entry }, "client error");
    return reply.status(204).send();
  });

  app.get("/api/admin/v5/client-errors", async (request) => {
    requireStaff(request);
    return { errors: clientErrorStore.recent.slice(0, 50) };
  });
}
