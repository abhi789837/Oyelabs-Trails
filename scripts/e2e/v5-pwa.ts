/**
 * Oyelearn v5 Phase 8: the installable PWA and offline Review, end to end.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh p8app)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/v5-pwa.ts
 *   bash scripts/e2e/snapshot-build.sh --remove p8app
 *
 * 1. The manifest is valid (name, short_name, start_url /learn, scope /, standalone, theme, 192/512
 *    icons and a maskable one, all reachable PNGs); /sw.js and the manifest are sent no-cache.
 * 2. In a real browser the service worker registers and controls /learn/review, and Chrome reports
 *    no installability errors (CDP Page.getInstallabilityErrors).
 * 3. The worker never caches /api (only the offline copy of /api/auth/me).
 * 4. Offline (context.setOffline): /learn/review reloads from the cache, shows the offline banner,
 *    starts the saved session and rates a card; the rating waits in the queue.
 * 5. Back online: the rating syncs and the server agrees (one more review_logs row, queue empty).
 * 6. The old UI still works under the worker (flag off → the old dashboard at /).
 * 7. Signing out deletes the offline data (IndexedDB and the /api/auth/me copy).
 * Port 8833, throwaway DATA_DIR, mock AI.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import { chromium, type APIRequestContext, type Browser, type Locator, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.E2E_PORT ?? 8833);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER = "learner.pwa";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const WAIT = 20_000;
const HEADED = process.env.E2E_HEADED === "1";
const PLAN = ["js-closures", "js-hoisting", "js-scope-chain"];
const QUIZ_TOPIC = "js-closures";

const failures: string[] = [];
function ok(cond: unknown, message: string): boolean {
  console.log(`    ${cond ? "\u001b[32mok\u001b[0m  " : "\u001b[31mFAIL\u001b[0m"} ${message}`);
  if (!cond) failures.push(message);
  return Boolean(cond);
}
function note(message: string): void {
  console.log(`    \u001b[33mnote\u001b[0m ${message}`);
}
function visible(locator: Locator): Promise<boolean> {
  return locator.waitFor({ state: "visible", timeout: WAIT }).then(
    () => true,
    () => false,
  );
}
function step(message: string): void {
  console.log(`  - ${message}`);
}

async function poll<T>(what: string, timeoutMs: number, fn: () => Promise<T | null | undefined>, everyMs = 300): Promise<T> {
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

async function call<T>(request: APIRequestContext, method: "get" | "post" | "put", url: string, data?: unknown): Promise<T> {
  const response = await request[method](`${BASE}${url}`, { ...(data === undefined ? {} : { data }), timeout: WAIT });
  if (!response.ok()) throw new Error(`${method.toUpperCase()} ${url} -> ${response.status()} ${await response.text()}`);
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
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
    // ignore
  }
  if (process.platform === "win32" && pid) {
    try {
      spawn("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      // ignore
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
  for (const required of ["dist/index.html", "dist/sw.js", "dist-server/index.js"]) {
    if (!fs.existsSync(path.join(APP, required))) throw new Error(`${required} is missing in ${APP}. Build a snapshot first (see the top of this file).`);
  }
  const logPath = path.join(dataDir, "server.log");
  const log = fs.createWriteStream(logPath);
  console.log(`serving:  ${APP}`);
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
  server.stdout?.pipe(log);
  server.stderr?.pipe(log);
  console.log(`server log: ${logPath}`);
  await poll("/api/health", 60_000, async () => {
    if (server?.exitCode !== null) throw new Error(`server exited early (${server?.exitCode}); see ${logPath}`);
    const res = await fetch(`${BASE}/api/health`).catch(() => null);
    return res?.ok ? true : null;
  });
}

// ---------------------------------------------------------------------------
// Seed: a v5 learner with review cards (one wrong test answer)
// ---------------------------------------------------------------------------

interface QuizQ {
  id: string;
  options: string[];
  correctIndex: number;
  correctIndices?: number[];
}

async function seed(browser: Browser, dataDir: string): Promise<{ storage: string; userId: string }> {
  step("seed: a v5 learner with a plan and one wrong test answer");
  const adminCtx = await browser.newContext();
  await call(adminCtx.request, "post", "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
  await call(adminCtx.request, "post", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });
  const created = await call<{ user: { id: string }; temporaryPassword: string }>(adminCtx.request, "post", "/api/admin/users", {
    username: LEARNER,
    displayName: "Nina Offline",
    profile: { roleTitle: "Frontend Engineer", yearsExperience: 1, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
    issueAssessment: false,
  });
  await call(adminCtx.request, "put", `/api/admin/users/${created.user.id}/plan`, { topicIds: PLAN });
  await call(adminCtx.request, "put", "/api/admin/video-settings", { lockMode: "warn" });
  await adminCtx.close();

  const ctx = await browser.newContext();
  await call(ctx.request, "post", "/api/auth/login", { username: LEARNER, password: created.temporaryPassword });
  await call(ctx.request, "post", "/api/auth/change-password", { currentPassword: created.temporaryPassword, newPassword: LEARNER_NEW });
  await call(ctx.request, "put", "/api/me/ui", { v5: true });
  await call(ctx.request, "put", "/api/v5/motivation/prefs", { welcomeDone: true });
  const mod = JSON.parse(fs.readFileSync(path.join(APP, "server", "content", "frontend", "fe-js-core.json"), "utf8")) as { topics: { id: string; quiz?: QuizQ[] }[] };
  const quiz = mod.topics.find((t) => t.id === QUIZ_TOPIC)!.quiz!;
  const answers: Record<string, number[]> = {};
  for (const q of quiz) answers[q.id] = q.correctIndices && q.correctIndices.length > 1 ? q.correctIndices : [q.correctIndex];
  const first = quiz[0];
  const right = answers[first.id];
  answers[first.id] = [first.options.findIndex((_, i) => !right.includes(i))];
  answers[quiz[1].id] = [quiz[1].options.findIndex((_, i) => i !== quiz[1].correctIndex)];
  await call(ctx.request, "post", `/api/topics/${QUIZ_TOPIC}/attempt`, { kind: "quiz", answers });
  const summary = await call<{ totalCards: number; dueCount: number }>(ctx.request, "get", "/api/v5/review/summary");
  ok(summary.totalCards >= 1, `the learner has review cards (${summary.totalCards}, ${summary.dueCount} due)`);
  const storage = path.join(dataDir, "learner.json");
  await ctx.storageState({ path: storage });
  await ctx.close();
  return { storage, userId: created.user.id };
}

function reviewLogCount(dataDir: string, userId: string): number {
  const db = new Database(path.join(dataDir, "oyelearn.db"), { readonly: true });
  try {
    return (db.prepare("select count(*) as n from review_logs where user_id = ?").get(userId) as { n: number }).n;
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// Browser-side probes
// ---------------------------------------------------------------------------

const IDB_READ = `(async (key) => {
  const db = await new Promise((res) => { const r = indexedDB.open("oyelearn-offline", 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains("kv")) r.result.createObjectStore("kv"); }; r.onsuccess = () => res(r.result); r.onerror = () => res(null); });
  if (!db) return null;
  try {
    return await new Promise((res) => { const tx = db.transaction("kv", "readonly"); const g = tx.objectStore("kv").get(key); g.onsuccess = () => res(g.result ?? null); g.onerror = () => res(null); });
  } finally { db.close(); }
})`;

async function idbGet<T>(page: Page, key: string): Promise<T | null> {
  return page.evaluate(`${IDB_READ}(${JSON.stringify(key)})`) as Promise<T | null>;
}

async function idbExists(page: Page): Promise<boolean> {
  return page.evaluate(async () => {
    const dbs = (await (indexedDB as unknown as { databases?: () => Promise<{ name?: string }[]> }).databases?.()) ?? [];
    return dbs.some((d) => d.name === "oyelearn-offline");
  });
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

async function manifestChecks(): Promise<void> {
  step("1. the manifest and the worker's headers");
  const html = await (await fetch(`${BASE}/learn`)).text();
  ok(/<link rel="manifest" href="\/site\.webmanifest"/.test(html), "index.html links the manifest");
  const res = await fetch(`${BASE}/site.webmanifest`);
  ok(res.ok, "the manifest is served");
  ok((res.headers.get("cache-control") ?? "").includes("no-cache"), `the manifest is revalidated (${res.headers.get("cache-control")})`);
  ok(/manifest\+json|application\/json/.test(res.headers.get("content-type") ?? ""), `manifest content type (${res.headers.get("content-type")})`);
  const m = (await res.json()) as Record<string, unknown> & { icons: { src: string; sizes: string; type: string; purpose?: string }[] };
  ok(m.name === "Oyelearn" && m.short_name === "Oyelearn", "name and short_name");
  ok(m.start_url === "/learn" && m.scope === "/", `start_url /learn and scope / (${String(m.start_url)}, ${String(m.scope)})`);
  ok(m.display === "standalone", "display standalone");
  ok(String(m.theme_color).toUpperCase() === "#2067D3", "theme #2067D3");
  const any192 = m.icons.find((i) => i.sizes === "192x192" && (i.purpose ?? "any").includes("any"));
  const any512 = m.icons.find((i) => i.sizes === "512x512" && (i.purpose ?? "any").includes("any"));
  const maskable = m.icons.find((i) => (i.purpose ?? "").includes("maskable"));
  ok(any192 && any512 && maskable, "192 and 512 icons, plus a maskable one");
  for (const icon of m.icons) {
    const r = await fetch(`${BASE}${icon.src}`);
    const buf = Buffer.from(await r.arrayBuffer());
    const [w, h] = [buf.readUInt32BE(16), buf.readUInt32BE(20)];
    ok(r.ok && buf.subarray(1, 4).toString() === "PNG" && `${w}x${h}` === icon.sizes, `${icon.src} is a ${icon.sizes} PNG (${w}x${h})`);
  }
  const sw = await fetch(`${BASE}/sw.js`);
  ok(sw.ok && /javascript/.test(sw.headers.get("content-type") ?? ""), `/sw.js is served as JavaScript (${sw.headers.get("content-type")})`);
  ok((sw.headers.get("cache-control") ?? "").includes("no-cache"), `/sw.js is sent no-cache (${sw.headers.get("cache-control")})`);
  const body = await sw.text();
  const list = JSON.parse(/PRECACHE_URLS = (\[[\s\S]*?\]);/.exec(body)?.[1] ?? "[]") as string[];
  ok(list.includes("/index.html") && !list.some((u) => u.startsWith("/api")), `the precache has the shell and no /api URL (${list.length} files)`);
  ok(!list.some((u) => /Monaco|editor\.api|ts\.worker|react-pdf/i.test(u) && u.endsWith(".js")), "heavy libraries are not precached");
}

async function main(): Promise<void> {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v5pwa-"));
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: !HEADED });
  try {
    await manifestChecks();
    const { storage, userId } = await seed(browser, dataDir);

    step("2. the worker registers and controls the page; Chrome sees no installability errors");
    const ctx = await browser.newContext({ storageState: storage, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => note(`[pageerror] ${e.message}`));
    const apiSeenByWorker: string[] = [];
    ctx.on("request", (r) => {
      if (r.serviceWorker() && new URL(r.url()).pathname.startsWith("/api/")) apiSeenByWorker.push(new URL(r.url()).pathname);
    });
    await page.goto(`${BASE}/learn/review`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await page.getByRole("heading", { level: 1, name: "Review" }).waitFor({ timeout: WAIT });
    const controlled = await poll("the worker to control the page", WAIT, () => page.evaluate(() => Boolean(navigator.serviceWorker.controller)).then((v) => v || null)).catch(() => false);
    ok(controlled, "the service worker controls /learn/review after the first visit (no reload needed)");
    const cdp = await ctx.newCDPSession(page);
    const inst = (await cdp.send("Page.getInstallabilityErrors")) as { installabilityErrors: { errorId: string }[] };
    ok(inst.installabilityErrors.length === 0, `installable: no installability errors (${inst.installabilityErrors.map((e) => e.errorId).join(", ") || "none"})`);
    const appManifest = (await cdp.send("Page.getAppManifest")) as { errors: { message: string; critical: number }[] };
    ok(appManifest.errors.filter((e) => e.critical).length === 0, `the manifest parses without critical errors (${appManifest.errors.map((e) => e.message).join("; ") || "none"})`);

    const saved = await poll("the session to be saved for offline use", WAIT, () => idbGet<{ userId: string; session: { cards: unknown[] } }>(page, `review-session:${userId}`)).catch(() => null);
    ok(saved && saved.userId === userId && saved.session.cards.length > 0, `a review session is saved on the device for this user (${saved?.session.cards.length ?? 0} cards)`);
    await poll("the offline sign-in copy", WAIT, () => page.evaluate(async () => Boolean(await caches.match("/api/auth/me", { cacheName: "oyelearn-session" }))).then((v) => v || null)).catch(() => undefined);
    const caches = await page.evaluate(async () => {
      const out: Record<string, string[]> = {};
      for (const name of await caches.keys()) out[name] = (await (await caches.open(name)).keys()).map((r) => new URL(r.url).pathname);
      return out;
    });
    const cachedApi = Object.values(caches).flat().filter((p) => p.startsWith("/api/"));
    ok(cachedApi.includes("/api/auth/me"), "the sign-in check is kept for offline start-up");
    ok(cachedApi.every((p) => p === "/api/auth/me"), `no /api response is cached except the sign-in check (${cachedApi.join(", ") || "none"})`);

    step("3. a new version waits for the learner: a calm prompt, no surprise reload");
    const swFile = path.join(APP, "dist", "sw.js");
    const original = fs.readFileSync(swFile, "utf8");
    try {
      fs.writeFileSync(swFile, `${original}
// e2e update ${Date.now()}
`);
      const marker = await page.evaluate(() => {
        (window as unknown as { __e2eMarker: number }).__e2eMarker = 42;
        return navigator.serviceWorker.getRegistration().then((r) => r?.update()).then(() => true);
      });
      ok(marker, "the page looked for an update");
      const prompt = page.getByTestId("sw-update");
      ok(await visible(prompt), "\"A new version is ready\" shows");
      ok(((await prompt.textContent()) ?? "").includes("A new version is ready."), "with plain words and a Reload button");
      await page.waitForTimeout(1500);
      ok((await page.evaluate(() => (window as unknown as { __e2eMarker?: number }).__e2eMarker)) === 42, "nothing reloads by itself");
      await Promise.all([page.waitForEvent("load", { timeout: WAIT }), prompt.getByRole("button", { name: "Reload" }).click()]);
      await page.getByRole("heading", { level: 1, name: "Review" }).waitFor({ timeout: WAIT });
      ok((await page.evaluate(() => (window as unknown as { __e2eMarker?: number }).__e2eMarker)) === undefined, "Reload switches to the new version and reloads once");
      ok(await poll("the new worker to control the page", WAIT, () => page.evaluate(() => Boolean(navigator.serviceWorker.controller)).then((v) => v || null)).catch(() => false), "the new worker is in control");
    } finally {
      fs.writeFileSync(swFile, original);
    }
    await poll("the session to be saved again", WAIT, () => idbGet<{ session: { cards: unknown[] } }>(page, `review-session:${userId}`)).catch(() => null);

    step("4. offline: reload /learn/review, rate a card");
    const before = reviewLogCount(dataDir, userId);
    await ctx.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded", timeout: WAIT });
    await page.getByRole("heading", { level: 1, name: "Review" }).waitFor({ timeout: WAIT });
    const banner = page.getByTestId("review-offline");
    ok(await visible(banner), "the offline banner shows");
    ok(((await banner.textContent()) ?? "").includes("You're offline. Your ratings will sync when you're back."), "with the plain words");
    await page.getByRole("button", { name: "Start review" }).click({ timeout: WAIT });
    const card = page.getByTestId("review-card");
    await card.waitFor({ timeout: WAIT });
    await page.keyboard.press("Space");
    await page.getByTestId("review-answer").waitFor({ timeout: WAIT });
    await page.keyboard.press("3");
    ok(await visible(page.getByText(/Saved on this device/).first()), "the rating is saved on the device");
    const queued = await idbGet<unknown[]>(page, `review-queue:${userId}`);
    ok(Array.isArray(queued) && queued.length === 1, `one rating waits in the queue (${Array.isArray(queued) ? queued.length : "none"})`);
    ok(reviewLogCount(dataDir, userId) === before, "the server has not seen it yet");

    step("5. back online: the rating syncs and the server agrees");
    await ctx.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    const after = await poll("the server to record the rating", WAIT, async () => {
      const n = reviewLogCount(dataDir, userId);
      return n > before ? n : null;
    }).catch(() => before);
    ok(after === before + 1, `the server has exactly one new review (${before} → ${after})`);
    const left = await poll("the queue to empty", WAIT, async () => {
      const q = await idbGet<unknown[]>(page, `review-queue:${userId}`);
      return Array.isArray(q) && q.length === 0 ? true : null;
    }).catch(() => false);
    ok(left, "the queue is empty");
    ok(await banner.waitFor({ state: "hidden", timeout: WAIT }).then(() => true, () => false), "the banner goes away");

    step("6. the old UI under the worker");
    await call(page.request, "put", "/api/me/ui", { v5: false });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: WAIT });
    ok(await visible(page.getByRole("heading", { level: 1, name: "Oyelearn" })), "the old dashboard still loads at / with the worker installed");
    ok(await page.evaluate(() => document.documentElement.dataset.ui !== "v5"), "and it has no v5 scope");
    await call(page.request, "put", "/api/me/ui", { v5: true });

    step("7. signing out deletes the offline data");
    await page.goto(`${BASE}/learn/review`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await page.getByRole("heading", { level: 1, name: "Review" }).waitFor({ timeout: WAIT });
    ok(await idbExists(page), "offline data exists before signing out");
    await page.evaluate(() => fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }));
    const wiped = await poll("the offline data to be deleted", WAIT, async () => ((await idbExists(page)) ? null : true)).catch(() => false);
    ok(wiped, "the IndexedDB data is deleted");
    const session = await page.evaluate(async () => (await caches.keys()).includes("oyelearn-session"));
    ok(!session, "the offline sign-in copy is deleted");
    ok(!apiSeenByWorker.some((p) => p !== "/api/auth/me"), `the worker fetched no /api URL other than /api/auth/me (${[...new Set(apiSeenByWorker)].join(", ")})`);
    await ctx.close();
  } finally {
    await browser.close();
    stopServer();
  }

  console.log("");
  if (failures.length) {
    console.log(`\u001b[31m${failures.length} failure(s)\u001b[0m`);
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("\u001b[32mall checks passed\u001b[0m");
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
