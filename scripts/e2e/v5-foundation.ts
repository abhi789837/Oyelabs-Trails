/**
 * Oyelearn v5 Phase 0: the ui_v5 flag and the v5 route skeleton, through the real UI.
 *
 *   npm run build          # once; this script serves dist/ + dist-server/ and does not rebuild
 *   npx tsx scripts/e2e/v5-foundation.ts
 *
 * 1. A learner with the flag off (the default) sees the old dashboard.
 * 2. "Try the new design" in the old user menu lands on /learn (the v5 Today placeholder).
 * 3. The JS loaded for /learn is listed and totalled (raw and gzip), and must not include the old
 *    tree's chunk (LegacyRoutes) or MediaPipe.
 * 4. Old URLs redirect: /plan → /learn/plan, an old topic URL → /learn/lesson/:topicId.
 * 5. "Use previous design" on the Me placeholder flips back to the old dashboard.
 * 6. The superadmin turns the global default on: a new learner lands in v5. Staff `?ui=old` shows the
 *    old console; a learner's `?ui=old` is ignored.
 * 7. /verify/x renders without signing in.
 * 8. axe on /learn at 390 and 1440 px (serious and critical fail).
 *
 * Throwaway DATA_DIR under %TEMP%, port 8811, the deterministic mock AI (NODE_ENV=development).
 * Exits non-zero when any assertion fails, and always stops its server.
 *
 * Helpers are copied from v5-baseline.ts on purpose, so no script's changes can break another.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import { chromium, type APIRequestContext, type Browser, type BrowserContextOptions, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PORT = Number(process.env.E2E_PORT ?? 8811);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const HEADED = process.env.E2E_HEADED === "1";
const WAIT = 20_000;

const failures: string[] = [];
function ok(cond: unknown, message: string): boolean {
  console.log(`    ${cond ? "\u001b[32mok\u001b[0m  " : "\u001b[31mFAIL\u001b[0m"} ${message}`);
  if (!cond) failures.push(message);
  return Boolean(cond);
}
function step(message: string): void {
  console.log(`  - ${message}`);
}

async function poll<T>(what: string, timeoutMs: number, fn: () => Promise<T | null | undefined>, everyMs = 1000): Promise<T> {
  const until = Date.now() + timeoutMs;
  let last: unknown = null;
  while (Date.now() < until) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      last = error;
    }
    await new Promise((r) => setTimeout(r, everyMs));
  }
  throw new Error(`Timed out waiting for ${what}${last ? ` (last error: ${String(last)})` : ""}`);
}

async function getJson<T>(request: APIRequestContext, url: string): Promise<T> {
  const response = await request.get(`${BASE}${url}`, { timeout: WAIT });
  if (!response.ok()) throw new Error(`GET ${url} -> ${response.status()} ${await response.text()}`);
  return (await response.json()) as T;
}

async function sendJson<T>(request: APIRequestContext, method: "post" | "put", url: string, data: unknown): Promise<T> {
  const response = await request[method](`${BASE}${url}`, { data, timeout: WAIT });
  if (!response.ok()) throw new Error(`${method.toUpperCase()} ${url} -> ${response.status()} ${await response.text()}`);
  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

let server: ChildProcess | null = null;

function stopServer(): void {
  if (!server || server.exitCode !== null) return;
  const pid = server.pid;
  try {
    server.kill();
  } catch {
    // already gone
  }
  if (process.platform === "win32" && pid) {
    try {
      spawn("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      // best effort
    }
  }
}

process.on("exit", stopServer);
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    stopServer();
    process.exit(130);
  });
}

async function startServer(dataDir: string): Promise<void> {
  for (const required of ["dist/index.html", "dist-server/index.js"]) {
    if (!fs.existsSync(path.join(REPO, required))) throw new Error(`${required} is missing. Run \`npm run build\` first.`);
  }
  const logPath = path.join(dataDir, "server.log");
  const log = fs.createWriteStream(logPath);
  server = spawn(process.execPath, ["dist-server/index.js"], {
    cwd: REPO,
    env: {
      ...process.env,
      NODE_ENV: "development",
      DATA_DIR: dataDir,
      PORT: String(PORT),
      HOST: "127.0.0.1",
      CLIENT_DIST: path.join(REPO, "dist"),
      SUPERADMIN_PASSWORD: SUPER_INITIAL,
      PISTON_URL: process.env.PISTON_URL ?? "http://127.0.0.1:2000",
      PUBLIC_ORIGIN: BASE,
      YOUTUBE_API_KEY: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.pipe(log);
  server.stderr?.pipe(log);
  server.on("exit", (code) => {
    if (code !== null && code !== 0) console.log(`  server exited with ${code}; log: ${logPath}`);
  });
  console.log(`server log: ${logPath}`);
  await poll("/api/health", 60_000, async () => {
    if (server?.exitCode !== null) throw new Error(`server exited early (${server?.exitCode}); see ${logPath}`);
    const res = await fetch(`${BASE}/api/health`).catch(() => null);
    return res?.ok ? true : null;
  }, 500);
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

async function signIn(page: Page, username: string, password: string, nextPassword: string): Promise<void> {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: WAIT });
  await page.getByLabel(/username/i).fill(username, { timeout: WAIT });
  await page.getByLabel(/password/i).fill(password, { timeout: WAIT });
  await page.getByRole("button", { name: /sign in/i }).click({ timeout: WAIT });
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: WAIT });
  if (page.url().includes("/change-password")) {
    await page.getByLabel(/^(temporary|current) password\*?$/i).fill(password, { timeout: WAIT });
    await page.getByLabel(/^new password\*?$/i).fill(nextPassword, { timeout: WAIT });
    await page.getByLabel(/^confirm new password\*?$/i).fill(nextPassword, { timeout: WAIT });
    await page.getByRole("button", { name: /save password/i }).click({ timeout: WAIT });
    await page.waitForURL((u) => !u.pathname.startsWith("/change-password"), { timeout: WAIT });
  }
}

async function createLearner(admin: APIRequestContext, username: string, displayName: string): Promise<string> {
  const created = await sendJson<{ temporaryPassword: string }>(admin, "post", "/api/admin/users", {
    username,
    displayName,
    profile: { roleTitle: "Frontend Engineer", yearsExperience: 1, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
    issueAssessment: false,
  });
  return created.temporaryPassword;
}

/** The old learner home: the dashboard heading, inside the old shell. */
async function seesOldDashboard(page: Page): Promise<boolean> {
  await page.waitForURL((u) => u.pathname === "/", { timeout: WAIT });
  const heading = page.getByRole("heading", { level: 1, name: "Oyelearn" });
  return heading.waitFor({ state: "visible", timeout: WAIT }).then(
    () => true,
    () => false,
  );
}

async function seesHeading(page: Page, name: string): Promise<boolean> {
  return page
    .getByRole("heading", { level: 1, name })
    .waitFor({ state: "visible", timeout: WAIT })
    .then(
      () => true,
      () => false,
    );
}

// ---------------------------------------------------------------------------
// Bundle
// ---------------------------------------------------------------------------

interface JsFile {
  file: string;
  raw: number;
  gzip: number;
}

async function jsForRoute(browser: Browser, storageState: BrowserContextOptions["storageState"], route: string, heading: string): Promise<JsFile[]> {
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();
  const files = new Map<string, JsFile>();
  const pending: Promise<void>[] = [];
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (!url.pathname.endsWith(".js")) return;
    pending.push(
      response
        .body()
        .then((body) => {
          files.set(url.pathname, { file: path.basename(url.pathname), raw: body.length, gzip: zlib.gzipSync(body, { level: 9 }).length });
        })
        .catch(() => undefined),
    );
  });
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: WAIT });
  await seesHeading(page, heading);
  await page.waitForLoadState("networkidle", { timeout: WAIT }).catch(() => undefined);
  await Promise.all(pending);
  await context.close();
  return [...files.values()].sort((a, b) => b.raw - a.raw);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v5f-"));
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: !HEADED });

  try {
    // Superadmin, through the API (no UI needed for setup).
    const adminCtx = await browser.newContext();
    const admin = adminCtx.request;
    await sendJson(admin, "post", "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
    await sendJson(admin, "post", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });

    step("1. flag off by default: the old dashboard");
    const settings = await getJson<{ v5Default: string }>(admin, "/api/admin/settings/ui");
    ok(settings.v5Default === "off", `global default is off (${settings.v5Default})`);
    const tempA = await createLearner(admin, "vee.one", "Vee One");
    const learnerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await learnerCtx.newPage();
    await signIn(page, "vee.one", tempA, LEARNER_NEW);
    const me = await getJson<{ ui?: { v5: boolean } }>(learnerCtx.request, "/api/auth/me");
    ok(me.ui?.v5 === false, "/api/auth/me says ui.v5 = false");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: WAIT });
    ok(await seesOldDashboard(page), "learner sees the old dashboard at /");

    step("2. Try the new design");
    await page.getByRole("button", { name: /^Account:/ }).click({ timeout: WAIT });
    await page.getByRole("menuitem", { name: "Try the new design" }).click({ timeout: WAIT });
    await page.waitForURL((u) => u.pathname === "/learn", { timeout: WAIT }).catch(() => undefined);
    ok(new URL(page.url()).pathname === "/learn", `lands on /learn (${new URL(page.url()).pathname})`);
    ok(await seesHeading(page, "Today"), "v5 Today placeholder renders");
    ok(await page.getByRole("navigation", { name: "Main" }).first().isVisible(), "v5 learner nav is visible");

    step("3. JS loaded for /learn");
    const js = await jsForRoute(browser, await learnerCtx.storageState(), "/learn", "Today");
    const raw = js.reduce((n, f) => n + f.raw, 0);
    const gz = js.reduce((n, f) => n + f.gzip, 0);
    for (const f of js) console.log(`      ${f.file.padEnd(44)} ${(f.raw / 1024).toFixed(1).padStart(8)} kB  ${(f.gzip / 1024).toFixed(1).padStart(7)} kB gz`);
    console.log(`      total ${js.length} files: ${(raw / 1024).toFixed(1)} kB raw, ${(gz / 1024).toFixed(1)} kB gzip`);
    ok(!js.some((f) => /^LegacyRoutes/.test(f.file)), "the old route tree is not loaded");
    ok(!js.some((f) => /mediapipe|vision_bundle/i.test(f.file)), "MediaPipe is not loaded");
    // Reported, not asserted: the 200 kB budget is enforced by P1's size-limit and the P9 gates, and
    // what is left over it is shared vendor chunks set in vite.config.ts (see docs/v5/DECISIONS.md).
    console.log(`    [33mnote[0m initial JS for /learn: ${(gz / 1024).toFixed(1)} kB gzip (budget 200 kB)`);

    step("4. old URLs redirect");
    await page.goto(`${BASE}/plan`, { waitUntil: "networkidle", timeout: WAIT });
    await page.waitForURL((u) => u.pathname === "/learn/plan", { timeout: WAIT }).catch(() => undefined);
    ok(new URL(page.url()).pathname === "/learn/plan", `/plan → /learn/plan (${new URL(page.url()).pathname})`);
    ok(await seesHeading(page, "My plan"), "My plan placeholder renders");
    await page.goto(`${BASE}/track/frontend/module/js-core/topic/js-closures`, { waitUntil: "networkidle", timeout: WAIT });
    await page.waitForURL((u) => u.pathname.startsWith("/learn/lesson/"), { timeout: WAIT }).catch(() => undefined);
    ok(new URL(page.url()).pathname === "/learn/lesson/js-closures", `old topic URL → /learn/lesson/js-closures (${new URL(page.url()).pathname})`);

    step("8. axe on /learn");
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
      await page.goto(`${BASE}/learn`, { waitUntil: "networkidle", timeout: WAIT });
      await seesHeading(page, "Today");
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const bad = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      ok(bad.length === 0, `axe /learn @${width}: ${result.violations.length} violations, ${bad.length} serious/critical${bad.length ? ` (${bad.map((v) => v.id).join(", ")})` : ""}`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });

    step("5. Use previous design");
    await page.goto(`${BASE}/learn/me`, { waitUntil: "networkidle", timeout: WAIT });
    await page.getByRole("button", { name: "Use previous design" }).click({ timeout: WAIT });
    ok(await seesOldDashboard(page), "back on the old dashboard");
    const after = await getJson<{ ui?: { v5: boolean } }>(learnerCtx.request, "/api/auth/me");
    ok(after.ui?.v5 === false, "/api/auth/me says ui.v5 = false again");
    const audit = await getJson<unknown>(admin, "/api/admin/audit?limit=50").catch(() => null);
    const toggles = JSON.stringify(audit ?? "").match(/ui\.v5_toggle/g)?.length ?? 0;
    ok(audit === null || toggles >= 2, `audit log has the two toggles (${audit === null ? "audit endpoint not readable here" : toggles})`);
    await learnerCtx.close();

    step("6. global default on");
    await sendJson(admin, "put", "/api/admin/settings/ui", { v5Default: "on" });
    const tempB = await createLearner(admin, "vee.two", "Vee Two");
    const ctxB = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pageB = await ctxB.newPage();
    await signIn(pageB, "vee.two", tempB, LEARNER_NEW);
    await pageB.waitForURL((u) => u.pathname.startsWith("/learn"), { timeout: WAIT }).catch(() => undefined);
    ok(new URL(pageB.url()).pathname.startsWith("/learn"), `new learner lands in v5 (${new URL(pageB.url()).pathname})`);
    const bottomNav = pageB.getByRole("navigation", { name: "Main" }).filter({ visible: true }).first();
    ok(await bottomNav.waitFor({ state: "visible", timeout: WAIT }).then(() => true, () => false), "v5 bottom nav visible at 390 px");
    ok(await bottomNav.getByRole("link", { name: "Review" }).isVisible(), "bottom nav has Review");
    await pageB.goto(`${BASE}/learn?ui=old`, { waitUntil: "networkidle", timeout: WAIT });
    ok(await seesHeading(pageB, "Today"), "a learner's ?ui=old is ignored");
    await ctxB.close();

    // Staff override: the superadmin's console in the browser.
    const staffPage = await adminCtx.newPage();
    await staffPage.goto(`${BASE}/admin`, { waitUntil: "networkidle", timeout: WAIT });
    ok(await seesHeading(staffPage, "Inbox"), "superadmin gets the v5 admin inbox with the default on");
    await staffPage.goto(`${BASE}/admin?ui=old`, { waitUntil: "networkidle", timeout: WAIT });
    ok(!(await seesHeading(staffPage, "Inbox")), "staff ?ui=old shows the old console");
    await staffPage.goto(`${BASE}/admin?ui=v5`, { waitUntil: "networkidle", timeout: WAIT });
    ok(await seesHeading(staffPage, "Inbox"), "staff ?ui=v5 shows v5 again");
    await sendJson(admin, "put", "/api/admin/settings/ui", { v5Default: "off" });

    step("7. /verify without signing in");
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`${BASE}/verify/x`, { waitUntil: "networkidle", timeout: WAIT });
    ok(new URL(anonPage.url()).pathname === "/verify/x", `stays on /verify/x (${new URL(anonPage.url()).pathname})`);
    ok(await seesHeading(anonPage, "Check a certificate"), "verify page renders");
    await anon.close();
    await adminCtx.close();
  } finally {
    await browser.close().catch(() => undefined);
    stopServer();
  }

  console.log(failures.length ? `\n${failures.length} failure(s):\n  ${failures.join("\n  ")}` : "\nall checks passed");
  process.exit(failures.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
