import { clientErrorReport } from "@shared/clientErrors";

/**
 * Sends a crash caught by the route error boundary to `POST /api/client-errors` (Phase 9.2).
 * Fire and forget: it never throws, never retries, and sends the same message only once per page
 * load, at most MAX_PER_LOAD times, so a render loop can't flood the server (which limits too).
 */
const MAX_PER_LOAD = 5;
const sent = new Set<string>();

export const clientErrorLogDeps: { fetch: (input: string, init: RequestInit) => Promise<unknown> } = {
  fetch: (input, init) => fetch(input, init),
};

export function logClientError(error: unknown, pathname: string): boolean {
  try {
    const body = clientErrorReport(error, pathname);
    const key = `${body.route} ${body.message}`;
    if (sent.has(key) || sent.size >= MAX_PER_LOAD) return false;
    sent.add(key);
    void clientErrorLogDeps
      .fetch("/api/client-errors", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      .catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

/** For tests. */
export function resetClientErrorLog(): void {
  sent.clear();
}
