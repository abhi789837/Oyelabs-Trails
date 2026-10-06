/**
 * Lighthouse (mobile profile) on the main v5 routes, against a private snapshot server it starts
 * itself, with a seeded staff login. Phase 9.1; numbers go to docs/v5/QUALITY.md.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh p9q)
 *   E2E_APP_DIR="$APP" node scripts/perf/lighthouse-v5.mjs
 *   bash scripts/e2e/snapshot-build.sh --remove p9q
 *
 * - Starts dist-server/index.js from E2E_APP_DIR on port 8842 (LH_PORT) with a throwaway DATA_DIR
 *   and the mock AI.
 * - Production runs behind Caddy (Caddyfile.example: `encode zstd gzip`, a year's immutable cache on
 *   hashed /assets). The Node server itself doesn't compress, so by default Lighthouse measures
 *   through a small local proxy on port 8942 that does the same (gzip for text types, the same
 *   cache header). LH_PROXY=0 measures the bare Node server instead.
 * - LH_PROXY=h2 (Phase 9 performance): the same proxy over TLS with HTTP/2, as Caddy serves it in
 *   production (automatic HTTPS, so h2). It uses a throwaway self-signed certificate made with
 *   `openssl` and starts Chrome with --ignore-certificate-errors. Lantern (Lighthouse's simulator)
 *   models HTTP/1.1 as 6 connections per origin, which an app split into many small lazy chunks
 *   pays for; under h2 it models one multiplexed connection, like production.
 * - Seeds a staff user (role admin) on the new design, welcome done, with a three-lesson plan, and
 *   signs in through the API. The session cookie goes to Lighthouse as an extra header, as in
 *   scripts/perf/lhci.mjs.
 * - Runs Lighthouse 12 (the `lighthouse` package that @lhci/cli installs) in Playwright's Chromium:
 *   the default config, which is the mobile profile (Moto G Power emulation, simulated slow 4G and
 *   4x CPU slowdown). LH_RUNS runs per route (default 3); the median by performance score is kept.
 * - Routes: /learn, /learn/lesson/js-closures, /learn/review, /admin (LH_PATHS to change them).
 * - Prints a table (performance, accessibility, best practices, LCP, TBT, CLS, FCP) against the
 *   budgets (perf >= 90, a11y >= 90, LCP < 2.5 s), and for each route the largest requests, the
 *   render-blocking requests and the unused JavaScript. Full JSON reports and a summary.json go to
 *   %TEMP%/claude/lighthouse-v5 (LH_OUT). INP needs a real interaction, so a navigation run reports
 *   Total Blocking Time as its lab stand-in.
 * Exits 1 when a budget fails (LH_NO_FAIL=1 to always exit 0).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import http2 from "node:http2";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import { chromium } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.LH_PORT ?? 8842);
const SERVER = `http://127.0.0.1:${PORT}`;
/** "caddy" (default): measure through a local proxy that does what Caddyfile.example does in production. */
const PROXY_MODE = process.env.LH_PROXY ?? "caddy";
const PROXY = PROXY_MODE !== "0";
const H2 = PROXY_MODE === "h2";
const PROXY_PORT = PORT + 100;
const BASE = PROXY ? `${H2 ? "https" : "http"}://127.0.0.1:${PROXY_PORT}` : SERVER;
const RUNS = Number(process.env.LH_RUNS ?? 3);
const OUT = path.resolve(process.env.LH_OUT ?? path.join(process.env.TEMP ?? os.tmpdir(), "claude", "lighthouse-v5"));
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const STAFF_PASSWORD = "Summit-Lantern-4417-Qx!";
const PATHS = (process.env.LH_PATHS ?? "/learn,/learn/lesson/js-closures,/learn/review,/admin").split(",").map((p) => p.trim());
const BUDGET = { performance: 0.9, accessibility: 0.9, lcpMs: 2500 };

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

let server = null;
function stopServer() {
  if (!server || server.exitCode !== null) return;
  const pid = server.pid;
  try {
    server.kill();
  } catch {
    // ignore
  }
  if (process.platform === "win32" && pid) spawn("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
}
process.on("exit", stopServer);

async function startServer(dataDir) {
  for (const required of ["dist/index.html", "dist-server/index.js"]) {
    if (!fs.existsSync(path.join(APP, required))) throw new Error(`${required} is missing in ${APP}. Build a snapshot first (scripts/e2e/snapshot-build.sh).`);
  }
  const log = fs.createWriteStream(path.join(dataDir, "server.log"));
  server = spawn(process.execPath, ["dist-server/index.js"], {
    cwd: APP,
    env: {
      ...process.env,
      NODE_ENV: "development",
      DATA_DIR: dataDir,
      PORT: String(PORT),
      HOST: "127.0.0.1",
      CLIENT_DIST: path.join(APP, "dist"),
      SUPERADMIN_PASSWORD: SUPER_INITIAL,
      PUBLIC_ORIGIN: BASE,
      YOUTUBE_API_KEY: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.pipe(log);
  server.stderr.pipe(log);
  const until = Date.now() + 90_000;
  while (Date.now() < until) {
    if (server.exitCode !== null) throw new Error(`server exited early; see ${path.join(dataDir, "server.log")}`);
    const res = await fetch(`${SERVER}/api/health`).catch(() => null);
    if (res?.ok) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("the server didn't start");
}

// ---------------------------------------------------------------------------
// A production-like proxy (what Caddyfile.example does): gzip text, immutable hashed assets
// ---------------------------------------------------------------------------

const COMPRESSIBLE = /^(text\/|application\/(javascript|json|manifest\+json|xml)|image\/svg\+xml)/;
const HASHED = /^\/assets\/.+[.-][0-9a-zA-Z_-]{8,}\.(js|css|woff2?|ttf|svg|png|jpg)$/;

/** HTTP/2 forbids connection-specific headers, and its pseudo-headers (":path") aren't HTTP/1.1 ones. */
const HOP_BY_HOP = new Set(["connection", "keep-alive", "transfer-encoding", "upgrade", "proxy-connection"]);

function selfSignedCert(dir) {
  const key = path.join(dir, "lh-key.pem");
  const cert = path.join(dir, "lh-cert.pem");
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", key, "-out", cert, "-days", "2", "-subj", "/CN=127.0.0.1"], { stdio: "ignore" });
  return { key: fs.readFileSync(key), cert: fs.readFileSync(cert) };
}

function startProxy(dataDir) {
  const handler = (req, res) => {
    const forward = Object.fromEntries(Object.entries(req.headers).filter(([k]) => !k.startsWith(":") && !HOP_BY_HOP.has(k)));
    if (H2) forward.host = `127.0.0.1:${PORT}`;
    const upstream = http.request(`${SERVER}${req.url}`, { method: req.method, headers: { ...forward, "accept-encoding": "identity" } }, (up) => {
      const headers = Object.fromEntries(Object.entries(up.headers).filter(([k]) => !(H2 && HOP_BY_HOP.has(k))));
      const type = String(headers["content-type"] ?? "");
      const gzip = /\bgzip\b/.test(String(req.headers["accept-encoding"] ?? "")) && COMPRESSIBLE.test(type) && !type.includes("event-stream") && up.statusCode !== 204 && up.statusCode !== 304;
      if (HASHED.test(new URL(req.url ?? "/", SERVER).pathname)) headers["cache-control"] = "public, max-age=31536000, immutable";
      if (gzip) {
        delete headers["content-length"];
        headers["content-encoding"] = "gzip";
        headers.vary = headers.vary ? `${headers.vary}, Accept-Encoding` : "Accept-Encoding";
        res.writeHead(up.statusCode ?? 502, headers);
        up.pipe(zlib.createGzip({ level: 6 })).pipe(res);
      } else {
        res.writeHead(up.statusCode ?? 502, headers);
        up.pipe(res);
      }
    });
    upstream.on("error", () => {
      res.writeHead(502);
      res.end();
    });
    req.pipe(upstream);
  };
  const proxy = H2 ? http2.createSecureServer({ ...selfSignedCert(dataDir), allowHTTP1: true }, handler) : http.createServer(handler);
  return new Promise((resolve) => proxy.listen(PROXY_PORT, "127.0.0.1", () => resolve(proxy)));
}

// ---------------------------------------------------------------------------
// A tiny cookie-keeping client for seeding
// ---------------------------------------------------------------------------

function client() {
  const jar = new Map();
  return {
    cookie: () => [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
    async call(method, url, body) {
      const res = await fetch(`${H2 ? SERVER : BASE}${url}`, {
        method,
        headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), cookie: this.cookie() },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      for (const c of res.headers.getSetCookie()) {
        const [pair] = c.split(";");
        const i = pair.indexOf("=");
        jar.set(pair.slice(0, i), pair.slice(i + 1));
      }
      const text = await res.text();
      if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${text.slice(0, 200)}`);
      return text ? JSON.parse(text) : {};
    },
  };
}

async function seed() {
  const admin = client();
  await admin.call("POST", "/api/auth/login", { username: "admin", password: SUPER_INITIAL });
  await admin.call("POST", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });
  await admin.call("PUT", "/api/admin/video-settings", { lockMode: "warn" });
  const created = await admin.call("POST", "/api/admin/users", {
    username: "lena.staff",
    displayName: "Lena Staff",
    role: "admin",
    profile: { roleTitle: "Engineering Manager", yearsExperience: 6, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
    issueAssessment: false,
  });
  await admin.call("PUT", `/api/admin/users/${created.user.id}/plan`, { topicIds: ["js-closures", "js-hoisting", "js-call-stack"] });

  const staff = client();
  await staff.call("POST", "/api/auth/login", { username: "lena.staff", password: created.temporaryPassword });
  await staff.call("POST", "/api/auth/change-password", { currentPassword: created.temporaryPassword, newPassword: STAFF_PASSWORD });
  await staff.call("PUT", "/api/me/ui", { v5: true });
  await staff.call("PUT", "/api/v5/motivation/prefs", { welcomeDone: true });
  const me = await staff.call("GET", "/api/auth/me");
  if (!me?.ui?.v5) throw new Error("the staff user isn't on the new design");
  // Warm the server (week plan, content caches) so the first measured run isn't a cold start.
  await staff.call("GET", "/api/v5/today").catch(() => undefined);
  return staff.cookie();
}

// ---------------------------------------------------------------------------
// Lighthouse
// ---------------------------------------------------------------------------

const kb = (bytes) => `${Math.round((bytes ?? 0) / 1024)} KB`;
const short = (url) => {
  try {
    const u = new URL(url);
    return u.origin === BASE ? u.pathname : `${u.host}${u.pathname}`.slice(0, 80);
  } catch {
    return String(url).slice(0, 80);
  }
};

function summarise(lhr) {
  const a = lhr.audits;
  const items = (id) => a[id]?.details?.items ?? [];
  const requests = items("network-requests")
    .filter((r) => r.resourceType !== "Document" || true)
    .sort((x, y) => (y.transferSize ?? 0) - (x.transferSize ?? 0))
    .slice(0, 6)
    .map((r) => `${short(r.url)} ${kb(r.transferSize)}`);
  return {
    url: lhr.finalDisplayedUrl ?? lhr.finalUrl,
    performance: lhr.categories.performance?.score ?? null,
    accessibility: lhr.categories.accessibility?.score ?? null,
    bestPractices: lhr.categories["best-practices"]?.score ?? null,
    lcpMs: a["largest-contentful-paint"]?.numericValue ?? null,
    fcpMs: a["first-contentful-paint"]?.numericValue ?? null,
    tbtMs: a["total-blocking-time"]?.numericValue ?? null,
    cls: a["cumulative-layout-shift"]?.numericValue ?? null,
    speedIndexMs: a["speed-index"]?.numericValue ?? null,
    lcpElement: items("largest-contentful-paint-element")[0]?.items?.[0]?.node?.snippet ?? items("largest-contentful-paint-element")[0]?.node?.snippet ?? null,
    lcpPhases: (items("largest-contentful-paint-element")[1]?.items ?? []).map((p) => `${p.phase} ${Math.round(p.timing)} ms`),
    totalTransfer: kb(a["total-byte-weight"]?.numericValue),
    largest: requests,
    renderBlocking: items("render-blocking-resources").map((r) => `${short(r.url)} (${Math.round(r.wastedMs ?? 0)} ms)`),
    unusedJs: items("unused-javascript").slice(0, 6).map((r) => `${short(r.url)} ${kb(r.wastedBytes)} of ${kb(r.totalBytes)} unused`),
    bootup: items("bootup-time").slice(0, 4).map((r) => `${short(r.url)} ${Math.round(r.total)} ms`),
    failedA11y: Object.values(a)
      .filter((x) => lhr.categories.accessibility?.auditRefs.some((r) => r.id === x.id && r.weight > 0) && x.score !== null && x.score < 1)
      .map((x) => x.id),
    failedBestPractices: Object.values(a)
      .filter((x) => lhr.categories["best-practices"]?.auditRefs.some((r) => r.id === x.id && r.weight > 0) && x.score !== null && x.score < 1)
      .map((x) => x.id),
    runWarnings: lhr.runWarnings ?? [],
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-lh-v5-"));
  console.log(`serving ${APP} on ${BASE} (data ${dataDir})`);
  await startServer(dataDir);
  const proxy = PROXY ? await startProxy(dataDir) : null;
  console.log(PROXY ? `measuring through the production-like proxy at ${BASE} (${H2 ? "TLS + HTTP/2, " : ""}gzip, immutable assets)` : "measuring the bare Node server (no compression)");
  const cookie = await seed();
  const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu", ...(H2 ? ["--ignore-certificate-errors"] : [])] });
  const results = [];
  try {
    for (const p of PATHS) {
      const runs = [];
      for (let i = 0, tries = 0; runs.length < RUNS && tries < RUNS + 3; i++, tries++) {
        const result = await lighthouse(`${BASE}${p}`, {
          port: chrome.port,
          output: "json",
          logLevel: "error",
          extraHeaders: { Cookie: cookie },
          onlyCategories: ["performance", "accessibility", "best-practices"],
        });
        if (!result?.lhr) throw new Error(`no report for ${p}`);
        if (result.lhr.runtimeError) {
          console.log(`  ${p} run ${i + 1}: Lighthouse error ${result.lhr.runtimeError.code}; run again`);
          continue;
        }
        const s = summarise(result.lhr);
        runs.push({ s, json: result.report });
        console.log(`  ${p} run ${i + 1}: perf ${Math.round((s.performance ?? 0) * 100)}, LCP ${Math.round(s.lcpMs ?? 0)} ms, TBT ${Math.round(s.tbtMs ?? 0)} ms${s.url.includes("/login") ? " (redirected to login!)" : ""}`);
      }
      runs.sort((x, y) => (x.s.performance ?? 0) - (y.s.performance ?? 0));
      const median = runs[Math.floor(runs.length / 2)];
      const slug = p.replace(/[^\w]+/g, "_").replace(/^_|_$/g, "") || "root";
      fs.writeFileSync(path.join(OUT, `${slug}.report.json`), Array.isArray(median.json) ? median.json[0] : median.json);
      results.push({ path: p, ...median.s, perfRuns: runs.map((r) => Math.round((r.s.performance ?? 0) * 100)) });
    }
  } finally {
    await Promise.resolve(chrome.kill()).catch(() => undefined); // Windows: taskkill can race the exiting tree
    proxy?.close();
    stopServer();
  }
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify({ mode: PROXY ? `caddy-like proxy (${H2 ? "h2, " : ""}gzip)` : "bare node", results }, null, 2));

  const pct = (v) => (v === null ? "n/a" : String(Math.round(v * 100)));
  console.log("\nroute | perf | a11y | best practices | LCP | TBT | CLS | FCP");
  let failed = false;
  for (const r of results) {
    const bad = [];
    if ((r.performance ?? 0) < BUDGET.performance) bad.push("perf");
    if ((r.accessibility ?? 0) < BUDGET.accessibility) bad.push("a11y");
    if ((r.lcpMs ?? Infinity) >= BUDGET.lcpMs) bad.push("LCP");
    if (bad.length) failed = true;
    console.log(`${r.path} | ${pct(r.performance)} (${r.perfRuns.join("/")}) | ${pct(r.accessibility)} | ${pct(r.bestPractices)} | ${((r.lcpMs ?? 0) / 1000).toFixed(2)} s | ${Math.round(r.tbtMs ?? 0)} ms | ${(r.cls ?? 0).toFixed(3)} | ${((r.fcpMs ?? 0) / 1000).toFixed(2)} s${bad.length ? `  OVER BUDGET: ${bad.join(", ")}` : ""}`);
  }
  for (const r of results) {
    console.log(`\n${r.path}  (final URL ${short(r.url)}, ${r.totalTransfer} transferred)`);
    console.log(`  LCP element: ${r.lcpElement ?? "n/a"}${r.lcpPhases.length ? ` [${r.lcpPhases.join(", ")}]` : ""}`);
    console.log(`  largest requests: ${r.largest.join("; ")}`);
    console.log(`  render-blocking: ${r.renderBlocking.join("; ") || "none"}`);
    console.log(`  unused JS: ${r.unusedJs.join("; ") || "none"}`);
    console.log(`  script time: ${r.bootup.join("; ")}`);
    if (r.failedA11y.length) console.log(`  accessibility audits below 1: ${r.failedA11y.join(", ")}`);
    if (r.failedBestPractices.length) console.log(`  best-practice audits below 1: ${r.failedBestPractices.join(", ")}`);
    if (r.runWarnings.length) console.log(`  warnings: ${r.runWarnings.join(" | ").slice(0, 300)}`);
  }
  console.log(`\nreports: ${OUT}`);
  process.exit(failed && process.env.LH_NO_FAIL !== "1" ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
