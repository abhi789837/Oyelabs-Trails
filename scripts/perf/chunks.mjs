/**
 * Which built JS files a route downloads before it can render, read from `dist/`.
 *
 * Follows the entry script in dist/index.html (plus its modulepreloads) and then each named lazy
 * chunk, through **static** imports only. Dynamic `import()` targets are what code splitting
 * deferred, so they are not part of the route's initial cost. Used by `.size-limit.js` and by
 * `check-heavy.mjs`. No vite manifest needed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DIST = process.env.SIZE_DIST ? path.resolve(process.env.SIZE_DIST) : path.join(REPO, "dist");
const ASSETS = path.join(DIST, "assets");

function rel(file) {
  return path.relative(REPO, file).split(path.sep).join("/");
}

/** dist/assets/<name>-<hash>.js for a chunk named after its source file, or null. */
export function chunkFile(name) {
  if (!fs.existsSync(ASSETS)) return null;
  const hit = fs.readdirSync(ASSETS).find((f) => f.endsWith(".js") && f.replace(/-[\w-]{8}\.js$/, "") === name);
  return hit ? path.join(ASSETS, hit) : null;
}

const STATIC_IMPORT = /(?:^|[;\s}])import\s*(?:[\w*{}\s,$]+from\s*)?["'](\.\/[^"']+\.js)["']/g;

/** The file and everything it statically imports, transitively. */
export function staticGraph(file, seen = new Set()) {
  if (!file || seen.has(file)) return seen;
  seen.add(file);
  const code = fs.readFileSync(file, "utf8");
  for (const m of code.matchAll(STATIC_IMPORT)) staticGraph(path.join(path.dirname(file), m[1]), seen);
  return seen;
}

/** The entry module and its preloads from dist/index.html. */
export function entryFiles() {
  const html = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
  const srcs = [...html.matchAll(/<script[^>]+type="module"[^>]+src="\/([^"]+)"/g), ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="\/([^"]+)"/g)].map((m) => path.join(DIST, m[1]));
  const all = new Set();
  for (const s of srcs) staticGraph(s, all);
  return all;
}

/** Entry + the named lazy chunks (and their static imports). Missing chunks are reported. */
export function routeFiles(chunkNames) {
  const all = entryFiles();
  const missing = [];
  for (const name of chunkNames) {
    const f = chunkFile(name);
    if (!f) missing.push(name);
    else staticGraph(f, all);
  }
  return { files: [...all].map(rel), missing };
}

/** The v5 learner landing (/learn): App → V5App → the learner shell → Today. */
export const LEARNER_CHUNKS = ["V5App", "TodayPage"];
/** The living style guide's own first load (sections are separate lazy chunks). */
export const DESIGN_CHUNKS = ["V5App", "DesignPage"];

/** Libraries that must never be in a learner's first download. */
export const HEAVY = /editor\.api|MonacoEditor|monaco|recharts|tiptap|prosemirror|confetti|generateCertificatePdf|react-pdf|mediapipe|vision_wasm|exceljs|sheetGrid/i;
