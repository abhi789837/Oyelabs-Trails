/**
 * v5 Phase 9.2: the client error log (`POST /api/client-errors`). Shared by the route-level error
 * boundary (which sends) and the server (which validates, limits and logs). No zod here, so the
 * client part stays tiny.
 */

export const CLIENT_ERROR_MAX = {
  route: 300,
  message: 1000,
  stack: 4000,
} as const;

/** Fixed windows. Per user (signed in) and per IP (everyone). */
export const CLIENT_ERROR_LIMITS = {
  windowMs: 10 * 60_000,
  perUser: 10,
  perIp: 30,
} as const;

/** How many reports the server keeps in memory for staff to read (newest first). */
export const CLIENT_ERROR_KEEP = 200;

export interface ClientErrorReport {
  route: string;
  message: string;
  stack?: string;
}

export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

/**
 * Builds the body the boundary sends: the route without the query (it can hold ids and search
 * text), the message, and the stack cut to its first part.
 */
export function clientErrorReport(error: unknown, pathname: string): ClientErrorReport {
  const route = truncate(pathname.split("?")[0]!.split("#")[0]! || "/", CLIENT_ERROR_MAX.route);
  const message = truncate(
    error instanceof Error ? `${error.name}: ${error.message}` : typeof error === "string" ? error : "Unknown error",
    CLIENT_ERROR_MAX.message,
  );
  const stack = error instanceof Error && typeof error.stack === "string" ? truncate(error.stack, CLIENT_ERROR_MAX.stack) : undefined;
  return stack ? { route, message, stack } : { route, message };
}
