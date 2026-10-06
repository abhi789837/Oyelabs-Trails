/**
 * GET requests started before the code that reads them has loaded (v5 Phase 9 performance).
 *
 * On the v5 design, the route's main queries start at start-up: from the inline script in
 * index.html, or from `src/v5/app/routePrefetch.ts` (`bootPrefetch` in `routePlan.ts`). Both keep
 * them on `globalThis.__oyelearnPrefetch`. When the page then calls `api.get` with the same path,
 * `apiFetch` takes the response from here instead of asking again.
 *
 * - Each prefetched response is used once, then forgotten, so a later reload or retry always goes
 *   to the network.
 * - Only fresh ones are used (started within `MAX_AGE_MS`); a stale one is dropped.
 * - Nothing is ever put here while the old UI is in use (the prefetch only runs on the v5 guess),
 *   so `apiFetch` behaves exactly as before for it.
 */

const MAX_AGE_MS = 15_000;

interface Entry {
  response: Promise<Response>;
  at: number;
}

function store(): Record<string, Entry> {
  const g = globalThis as unknown as { __oyelearnPrefetch?: Record<string, Entry> };
  return g.__oyelearnPrefetch ?? (g.__oyelearnPrefetch = {});
}

/** A failed prefetch must not show up as an unhandled rejection; whoever awaits still gets the error. */
function quiet<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => undefined);
  return promise;
}

/** Starts a same-origin GET now, unless a fresh one for the path is already waiting. */
export function startPrefetch(path: string): Entry {
  const entries = store();
  let entry = entries[path];
  if (!entry || Date.now() - entry.at >= MAX_AGE_MS) {
    entry = { response: quiet(fetch(path, { method: "GET", credentials: "same-origin" })), at: Date.now() };
    entries[path] = entry;
  }
  return entry;
}

/** `startPrefetch`, plus a copy of the response for the caller to read (the page gets the original). */
export function prefetchGet(path: string): Promise<Response> {
  return quiet(startPrefetch(path).response.then((r) => r.clone()));
}

/** The prefetched response for this path, once; null when there's none or it's stale. */
export function takePrefetched(path: string): Promise<Response> | null {
  const entries = store();
  const entry = entries[path];
  if (!entry) return null;
  delete entries[path];
  if (Date.now() - entry.at >= MAX_AGE_MS) return null;
  return entry.response;
}

/** Tests only. */
export function clearPrefetched(): void {
  const entries = store();
  for (const key of Object.keys(entries)) delete entries[key];
}
