import crypto from "node:crypto";
import fs from "node:fs";

/**
 * Content Security Policy for the production server (brief §15).
 *
 * Each relaxation below is here for a specific feature, not for convenience:
 *
 * - `'wasm-unsafe-eval'` — MediaPipe's face and object detectors are WebAssembly. Without it the
 *   proctor engine cannot start. It permits WASM compilation only, not `eval` of JavaScript.
 * - `worker-src blob:` — MediaPipe spawns its own workers.
 * - `frame-src 'self'` — the isolated code runner (`/runner.html`, below). Production is https, where
 *   `https:` already covers it; `'self'` keeps it working on a plain-http origin too.
 * - There is deliberately **no `'unsafe-eval'`** here. Learner code runs only inside `/runner.html`,
 *   which gets its own policy from `buildRunnerCsp`.
 * - `style-src 'unsafe-inline'` — React and Framer Motion set element `style` attributes, which
 *   this directive governs. There is no practical way to hash those.
 * - `frame-src https:` — reference previews frame arbitrary documentation sites, and the set
 *   changes whenever content is authored. The brief explicitly allows this rather than deriving a
 *   ~130-host list from embeds.generated.ts on every build. A framed document cannot reach into
 *   this page, so the exposure is that a reference URL could load an unexpected site — which the
 *   content quality gate already checks.
 * - `script-src https://www.youtube.com` — v4.3: the YouTube IFrame Player API (`/iframe_api`, which
 *   loads its widget script from the same host), so the topic playlist can track watching.
 * - v4.5 Oyelabs module videos (server/src/oyelabs/media):
 *   - `script-src https://player.vimeo.com`: the Vimeo Player SDK, so Vimeo entries track exactly.
 *   - `img-src`: the thumbnail hosts the resolver stores (Vimeo, Loom, Drive and its
 *     googleusercontent redirect, Box). Thumbnails are images only; no script runs from them.
 *   - `media-src https:`: the HTML5 player plays direct files and Dropbox raw links from any
 *     CDN/bucket an admin pastes (S3, R2, CloudFront, …); uploads are `'self'`.
 *   - `connect-src https:`: hls.js (lazy, only for `.m3u8`) fetches the playlist and segments with
 *     XHR from the same unknown CDNs. It is a connect permission, not a script one.
 *   - Drive, OneDrive/SharePoint, Box and Loom embeds are iframes: `frame-src https:` (above).
 * - The `index.html` theme bootstrap stays inline (it must run before first paint to avoid a
 *   light/dark flash), so it is allowed by its SHA-256 hash rather than by `'unsafe-inline'`.
 */
export interface CspOptions {
  /** Absolute path to the built index.html, so its inline scripts can be hashed. */
  indexHtmlPath?: string | undefined;
}

/** CRLF and lone CR become LF, as the HTML parser does before a browser hashes the script. */
export function normaliseNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

function inlineScriptHashes(indexHtmlPath: string | undefined): string[] {
  if (!indexHtmlPath || !fs.existsSync(indexHtmlPath)) return [];
  const html = fs.readFileSync(indexHtmlPath, "utf8");
  const hashes: string[] = [];
  for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    // Browsers normalise line breaks to LF before hashing an inline script, so a CRLF file (a build
    // from a Windows checkout with core.autocrlf) must be hashed the same way or the script is blocked.
    const body = normaliseNewlines(match[1]);
    if (!body.trim()) continue;
    hashes.push(`'sha256-${crypto.createHash("sha256").update(body, "utf8").digest("base64")}'`);
  }
  return hashes;
}

export function buildCsp({ indexHtmlPath }: CspOptions = {}): Record<string, string[]> {
  const scriptHashes = inlineScriptHashes(indexHtmlPath);

  return {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'wasm-unsafe-eval'", "https://www.youtube.com", "https://player.vimeo.com", ...scriptHashes],
    "style-src": ["'self'", "'unsafe-inline'"],
    "font-src": ["'self'", "data:"],
    // YouTube thumbnails, canvas snapshots (blob:) and inlined SVGs (data:).
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://i.ytimg.com",
      "https://img.youtube.com",
      "https://i.vimeocdn.com",
      "https://cdn.loom.com",
      "https://drive.google.com",
      "https://*.googleusercontent.com",
      "https://*.boxcdn.net",
    ],
    "media-src": ["'self'", "blob:", "https:"],
    "connect-src": ["'self'", "https:"],
    "worker-src": ["'self'", "blob:"],
    "child-src": ["'self'", "blob:"],
    "frame-src": ["'self'", "https:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": [],
  };
}

/** The isolated code runner page (src/lib/sandboxRunner.ts, public/runner.html). */
export const RUNNER_PAGE_PATH = "/runner.html";

/**
 * The runner page's own policy, sent instead of the app's (helmet's header is replaced for this one
 * path). It is the only place `'unsafe-eval'` is allowed, and it is safe there because:
 *
 * - the page is only ever loaded in `<iframe sandbox="allow-scripts">` (no `allow-same-origin`), so
 *   it runs with an opaque origin: no cookies, no same-origin API access, no access to the app page;
 * - `default-src 'none'` leaves it no network at all (no fetch, XHR, WebSocket, images, imports), so
 *   code run there can't send anything anywhere; `form-action 'none'`, `base-uri 'none'`;
 * - its one inline script is allowed by hash, and its worker only from `blob:`;
 * - `frame-ancestors 'self'`: no other site can frame it.
 */
export function buildRunnerCsp({ runnerHtmlPath }: { runnerHtmlPath?: string | undefined } = {}): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'none'"],
    "script-src": [...inlineScriptHashes(runnerHtmlPath), "'unsafe-eval'"],
    "worker-src": ["blob:"],
    "base-uri": ["'none'"],
    "form-action": ["'none'"],
    "frame-ancestors": ["'self'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(" "))
    .join("; ");
}
