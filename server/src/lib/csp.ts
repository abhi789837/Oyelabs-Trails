import crypto from "node:crypto";
import fs from "node:fs";

/**
 * Content Security Policy for the production server (brief §15).
 *
 * Each relaxation below is here for a specific feature, not for convenience:
 *
 * - `'wasm-unsafe-eval'` — MediaPipe's face and object detectors are WebAssembly. Without it the
 *   proctor engine cannot start. It permits WASM compilation only, not `eval` of JavaScript.
 * - `worker-src blob:` — the code-challenge runner builds its Worker from a Blob URL, and
 *   MediaPipe spawns its own workers.
 * - `style-src 'unsafe-inline'` — React and Framer Motion set element `style` attributes, which
 *   this directive governs. There is no practical way to hash those.
 * - `frame-src https:` — reference previews frame arbitrary documentation sites, and the set
 *   changes whenever content is authored. The brief explicitly allows this rather than deriving a
 *   ~130-host list from embeds.generated.ts on every build. A framed document cannot reach into
 *   this page, so the exposure is that a reference URL could load an unexpected site — which the
 *   content quality gate already checks.
 * - The `index.html` theme bootstrap stays inline (it must run before first paint to avoid a
 *   light/dark flash), so it is allowed by its SHA-256 hash rather than by `'unsafe-inline'`.
 */
export interface CspOptions {
  /** Absolute path to the built index.html, so its inline scripts can be hashed. */
  indexHtmlPath?: string | undefined;
}

function inlineScriptHashes(indexHtmlPath: string | undefined): string[] {
  if (!indexHtmlPath || !fs.existsSync(indexHtmlPath)) return [];
  const html = fs.readFileSync(indexHtmlPath, "utf8");
  const hashes: string[] = [];
  for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    const body = match[1];
    if (!body.trim()) continue;
    hashes.push(`'sha256-${crypto.createHash("sha256").update(body, "utf8").digest("base64")}'`);
  }
  return hashes;
}

export function buildCsp({ indexHtmlPath }: CspOptions = {}): Record<string, string[]> {
  const scriptHashes = inlineScriptHashes(indexHtmlPath);

  return {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'wasm-unsafe-eval'", ...scriptHashes],
    "style-src": ["'self'", "'unsafe-inline'"],
    "font-src": ["'self'", "data:"],
    // YouTube thumbnails, canvas snapshots (blob:) and inlined SVGs (data:).
    "img-src": ["'self'", "data:", "blob:", "https://i.ytimg.com", "https://img.youtube.com"],
    "media-src": ["'self'", "blob:"],
    "connect-src": ["'self'"],
    "worker-src": ["'self'", "blob:"],
    "child-src": ["'self'", "blob:"],
    "frame-src": ["https:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": [],
  };
}
