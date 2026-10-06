/**
 * After a deploy, an open tab still points at the previous build's file names. When it lazy-loads a
 * screen whose old file is gone, the import fails. One automatic reload fixes that (the new
 * index.html names the new files). The guard stops a loop: at most one automatic reload per
 * `GUARD_MS`, remembered in sessionStorage (per tab). Offline, never: a reload can't help there.
 */

export const RELOAD_KEY = "oyelearn-chunk-reload-at";
export const GUARD_MS = 30_000;

const CHUNK_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /Unable to preload CSS/i,
  /Loading (CSS )?chunk [\w-]+ failed/i,
  /ChunkLoadError/i,
];

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const name = typeof error === "object" && error !== null && "name" in error ? String((error as { name: unknown }).name) : "";
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : typeof error === "object" && error !== null && "message" in error ? String((error as { message: unknown }).message) : "";
  return CHUNK_PATTERNS.some((re) => re.test(name) || re.test(message));
}

export interface ReloadStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * True when this chunk error should reload the page now; it then records the time. False when a
 * reload already happened within the guard window (show the error screen instead) or when offline.
 */
export function claimChunkReload(store: ReloadStore | null, now: number, online: boolean): boolean {
  if (!online) return false;
  try {
    const last = Number(store?.getItem(RELOAD_KEY) ?? "0");
    if (Number.isFinite(last) && last > 0 && now - last < GUARD_MS) return false;
    store?.setItem(RELOAD_KEY, String(now));
    return Boolean(store);
  } catch {
    // Storage blocked: without a guard we can't promise no loop, so don't reload automatically.
    return false;
  }
}

function sessionStore(): ReloadStore | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Reloads once if `error` is a stale-chunk failure. Returns true when a reload was started. */
export function reloadForChunkError(error: unknown): boolean {
  if (typeof window === "undefined" || !isChunkLoadError(error)) return false;
  if (!claimChunkReload(sessionStore(), Date.now(), navigator.onLine !== false)) return false;
  window.location.reload();
  return true;
}
