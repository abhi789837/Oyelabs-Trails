/**
 * Which built files the service worker precaches (docs/v5/DECISIONS.md, "Phase 8 — app-wide").
 *
 * Pure, so vite.config.ts's build plugin and the unit test share it. The rule:
 *
 * - the app shell (`index.html`, served for every navigation while offline);
 * - every JS file the entry, the v5 frame and the Review screen need at start-up (their static
 *   imports, followed all the way down), plus the few lazy pieces the frame mounts on every
 *   screen (the toaster, the motivation host);
 * - all CSS, and the woff2 fonts (every browser that can install a PWA reads woff2, so the woff
 *   and ttf copies are skipped);
 * - the icons and the manifest.
 *
 * Everything else under /assets is cached the first time it's used (cache-first: the names are
 * content-hashed), so the precache stays small (about 1 MB, not the 20 MB of Monaco, PDF and
 * chart code). API responses are never in this list.
 */

export interface BuiltChunk {
  fileName: string;
  /** Source path of the module this chunk is for (lazy routes and the entry have one). */
  facadeModuleId?: string | null;
  isEntry?: boolean;
  /** Static imports (other chunk file names). */
  imports: readonly string[];
}

/** Source files whose chunks (and static imports) must work offline. Matched by path suffix. */
export const OFFLINE_ROOTS = [
  "src/v5/app/V5App.tsx",
  "src/v5/learner/review/ReviewPage.tsx",
  "src/v5/motivation/MotivationHost.tsx",
  "src/v5/motivation/HostImpl.tsx",
  "src/components/overlays/Toaster.tsx",
] as const;

/**
 * Files from `public/` worth having offline: the brand kit v1.0 icons and the manifest. index.html
 * links them with `?v=2` (cache-busting the previous logo); the worker matches precached files by
 * path, so the query doesn't matter offline.
 */
export const PUBLIC_PRECACHE = [
  "/site.webmanifest",
  "/favicon.svg",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
] as const;

const norm = (p: string) => p.replace(/\\/g, "/");

/** The JS chunks the offline roots need: the entry plus each root, with their static imports. */
export function offlineChunks(chunks: readonly BuiltChunk[], roots: readonly string[] = OFFLINE_ROOTS): string[] {
  const byName = new Map(chunks.map((c) => [c.fileName, c]));
  const out = new Set<string>();
  const visit = (name: string) => {
    if (out.has(name)) return;
    const chunk = byName.get(name);
    if (!chunk) return;
    out.add(name);
    for (const dep of chunk.imports) visit(dep);
  };
  for (const c of chunks) {
    const id = c.facadeModuleId ? norm(c.facadeModuleId) : "";
    if (c.isEntry || roots.some((r) => id.endsWith(r))) visit(c.fileName);
  }
  return [...out].sort();
}

/** True for CSS and woff2 fonts (precached whole). */
export function isPrecachedAsset(fileName: string): boolean {
  return /\.(css|woff2)$/i.test(fileName);
}

/** The full precache list, as absolute URLs, sorted so the version hash is stable. */
export function precacheList(chunks: readonly BuiltChunk[], assetFiles: readonly string[]): string[] {
  const urls = new Set<string>(["/index.html", ...PUBLIC_PRECACHE]);
  for (const f of offlineChunks(chunks)) urls.add(`/${norm(f)}`);
  for (const f of assetFiles) if (isPrecachedAsset(f)) urls.add(`/${norm(f)}`);
  return [...urls].sort();
}

/** A short, stable version id for a list plus the shell's own hash (index.html has no hash in its name). */
export function precacheVersion(urls: readonly string[], indexHtml: string): string {
  // FNV-1a, 32-bit: enough to tell two builds apart; no crypto needed in the browser or the test.
  let h = 0x811c9dc5;
  const feed = (s: string) => {
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  };
  for (const u of urls) feed(`${u}\n`);
  feed(indexHtml);
  return h.toString(36);
}
