/**
 * Oyelearn v5 Phase 2: the learner home, Today (`/learn`).
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh today)        # a private build (other agents rebuild dist/)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/v5-today.ts
 *   bash scripts/e2e/snapshot-build.sh --remove today
 *
 * Without E2E_APP_DIR it serves this checkout's dist/ + dist-server/ (run `npm run build` first).
 *
 * 1. Seeds through the API: the superadmin, a learner on the v5 design with a published plan, a
 *    pinned announcement for everyone, and an unfinished lesson (Lesson's autosave, when present).
 * 2. A learner with a plan sees: the hero with Continue, the trail, the goal ring, the streak, Up
 *    next with "why" chips, the daily review card and the pinned announcement. `GET /api/v5/today`
 *    is timed.
 * 3. Continue lands inside the lesson route at the right step, in 1 click from /learn.
 * 4. Loading (skeleton) and error (Try again) states.
 * 5. axe (WCAG 2.2 AA tags) at 390 and 1440, light and dark: 0 serious/critical. No horizontal scroll.
 *    Screenshots go to %TEMP%/claude/e2e-shots-v5-today.
 *
 * Throwaway DATA_DIR, port 8821 (E2E_PORT), the deterministic mock AI. Exits non-zero on failure.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import { chromium, type APIRequestContext, type Browser, type BrowserContext, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.E2E_PORT ?? 8821);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const SHOTS = path.join(os.tmpdir(), "claude", "e2e-shots-v5-today");
const HEADED = process.env.E2E_HEADED === "1";
const WAIT = 20_000;

const failures: string[] = [];
function ok(cond: unknown, message: string): boolean {
  console.log(`    ${cond ? "\u001b[32mok\u001b[0m  " : "\u001b[31mFAIL\u001b[0m"} ${message}`);
  if (!cond) failures.push(message);
  return Boolean(cond);
}
function note(message: string): void {
  console.log(`    \u001b[33mnote\u001b[0m ${message}`);
}
function step(message: string): void {
  console.log(`  - ${message}`);
}

async function poll<T>(what: string, timeoutMs: number, fn: () => Promise<T | null | undefined>, everyMs = 500): Promise<T> {
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
  const response = await request.get(`${BASE}${url}`);
  if (!response.ok()) throw new Error(`GET ${url} -> ${response.status()} ${await response.text()}`);
  return (await response.json()) as T;
}

async function sendJson<T>(request: APIRequestContext, method: "post" | "put", url: string, data: unknown): Promise<T> {
  const response = await request[method](`${BASE}${url}`, { data });
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
  for (const required of ["dist/index.html", "dist-server/index.js"]) {
    if (!fs.existsSync(path.join(APP, required))) throw new Error(`${path.join(APP, required)} is missing. Build first.`);
  }
  const logPath = path.join(dataDir, "server.log");
  const log = fs.createWriteStream(logPath);
  console.log(`serving:    ${APP}`);
  console.log(`server log: ${logPath}`);
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
      PISTON_URL: process.env.PISTON_URL ?? "http://127.0.0.1:2000",
      PUBLIC_ORIGIN: BASE,
      YOUTUBE_API_KEY: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.pipe(log);
  server.stderr?.pipe(log);
  await poll("/api/health", 60_000, async () => {
    if (server?.exitCode !== null) throw new Error(`server exited early (${server?.exitCode}); see ${logPath}`);
    const res = await fetch(`${BASE}/api/health`).catch(() => null);
    return res?.ok ? true : null;
  });
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

type Theme = "light" | "dark";

async function newLearnerContext(browser: Browser, storage: Awaited<ReturnType<BrowserContext["storageState"]>>, width: number, theme: Theme): Promise<BrowserContext> {
  const ctx = await browser.newContext({ storageState: storage, viewport: { width, height: width < 768 ? 844 : 900 }, colorScheme: theme });
  await ctx.addInitScript((t) => {
    window.localStorage.setItem("oyelabs-ui", JSON.stringify({ state: { theme: t, sidebarCollapsed: false }, version: 0 }));
  }, theme);
  return ctx;
}

async function openToday(page: Page): Promise<void> {
  await page.goto(`${BASE}/learn`, { waitUntil: "networkidle", timeout: WAIT });
  await page.getByRole("heading", { level: 1, name: "Today" }).waitFor({ timeout: WAIT });
  await page.getByTestId("today-continue").waitFor({ timeout: WAIT });
  await page.getByRole("heading", { name: "Up next" }).waitFor({ timeout: WAIT });
}

interface TodayBody {
  hero: { kind: string; topicId: string | null; step: string | null; href: string; title: string } | null;
  upNext: { title: string; why: string }[];
  review: { dueCount: number } | null;
  announcements: { title: string }[];
  goal: { goalMinutes: number | null };
}

async function main(): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v5today-"));
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: !HEADED });

  try {
    step("1. seed through the API");
    const adminCtx = await browser.newContext();
    const admin = adminCtx.request;
    await sendJson(admin, "post", "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
    await sendJson(admin, "post", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });

    const created = await sendJson<{ user: { id: string }; temporaryPassword: string }>(admin, "post", "/api/admin/users", {
      username: "tara.today",
      displayName: "Tara Today",
      profile: { roleTitle: "Backend Engineer", yearsExperience: 1, adminNotes: "", claimedSkills: [], targetTracks: ["backend"] },
      issueAssessment: false,
    });
    const manifest = await getJson<{ tracks: { id: string; modules: { available: boolean; topics: { id: string }[] }[] }[] }>(admin, "/api/me/manifest");
    const topicIds = manifest.tracks
      .flatMap((t) => t.modules.filter((m) => m.available))
      .flatMap((m) => m.topics.map((t) => t.id))
      .slice(0, 24);
    await sendJson(admin, "put", `/api/admin/users/${created.user.id}/plan`, { topicIds });
    await sendJson(admin, "post", "/api/admin/announcements", {
      title: "Lunch and learn on Friday",
      body: "Bring a question about the week's lessons. We meet at 1 pm.",
      audience: { all: true },
      pinned: true,
    });

    const learnerSeed = await browser.newContext();
    const lr = learnerSeed.request;
    await sendJson(lr, "post", "/api/auth/login", { username: "tara.today", password: created.temporaryPassword });
    await sendJson(lr, "post", "/api/auth/change-password", { currentPassword: created.temporaryPassword, newPassword: LEARNER_NEW });
    await sendJson(lr, "put", "/api/me/ui", { v5: true });
    // The P6 first-run welcome would cover Today; v5-motivation.ts tests it.
    await sendJson(lr, "put", "/api/v5/motivation/prefs", { welcomeDone: true });
    const week = await getJson<{ week: { items: { topicId: string | null; status: string }[] } | null }>(lr, "/api/me/week");
    ok(week.week && week.week.items.length > 0, `the learner has a week (${week.week?.items.length ?? 0} items)`);

    // An unfinished lesson, through the Lesson area's autosave, if it's there.
    const resumeTopic = week.week?.items.find((i) => i.topicId)?.topicId ?? topicIds[0];
    const saved = await lr.put(`${BASE}/api/v5/lessons/${encodeURIComponent(resumeTopic)}/state`, { data: { step: "read" } });
    if (saved.ok()) note(`lesson state saved for ${resumeTopic} (step read)`);
    else note(`no lesson autosave yet (${saved.status()}); the hero falls back to the plan`);
    const storage = await learnerSeed.storageState();

    step("2. Today shows the whole answer at a glance");
    const started = Date.now();
    const body = await getJson<TodayBody>(lr, "/api/v5/today");
    const firstMs = Date.now() - started;
    const timings: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      const t0 = Date.now();
      await getJson<TodayBody>(lr, "/api/v5/today");
      timings.push(Date.now() - t0);
    }
    timings.sort((a, b) => a - b);
    note(`GET /api/v5/today: first ${firstMs} ms, median of 5 warm ${timings[2]} ms (round trip on localhost)`);
    ok(timings[2] < 100, `warm /api/v5/today under 100 ms (${timings[2]} ms)`);
    ok(body.hero !== null, `the API returns a hero (${body.hero?.kind}: ${body.hero?.title})`);
    if (saved.ok()) ok(body.hero?.kind === "resume" && body.hero.step === "read", `hero resumes the saved lesson at Read (${body.hero?.kind}, ${body.hero?.step})`);

    const ctx = await newLearnerContext(browser, storage, 1440, "light");
    const page = await ctx.newPage();
    await openToday(page);
    ok(await page.getByTestId("today-continue").isVisible(), "hero with Continue");
    ok(await page.getByRole("heading", { name: new RegExp(body.hero!.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).first().isVisible(), "hero names the lesson");
    ok(await page.getByTestId("v5-trail-path").first().isVisible(), "this week's mini trail is drawn");
    ok(await page.getByRole("progressbar", { name: /^Weekly goal/ }).isVisible(), "weekly goal ring");
    ok(await page.getByText("Weekly streak", { exact: true }).isVisible(), "weekly streak");
    const upNext = page.getByRole("list", { name: "Up next" }).getByRole("listitem");
    const upCount = await upNext.count();
    ok(upCount >= 1 && upCount <= 3, `Up next has 1–3 items (${upCount})`);
    const chips = await upNext.allInnerTexts();
    ok(chips.every((t) => /(Do it now|Must know|Good to know|Extra)/.test(t)), `every Up next item has a why chip (${body.upNext.map((i) => i.why).join(" | ")})`);
    if (body.review) ok(await page.getByRole("heading", { name: "Daily review" }).isVisible(), `daily review card (${body.review.dueCount} due)`);
    else note("Review isn't available on this build: no review card");
    ok(await page.getByRole("heading", { name: "Pinned by your admin" }).isVisible(), "pinned section");
    ok(await page.getByText("Lunch and learn on Friday").isVisible(), "the announcement is shown");
    ok(await page.getByTestId("today-xp").isVisible(), "XP counter");

    step("3. Continue lands inside the lesson at the right step (1 click)");
    let clicks = 0;
    await page.getByTestId("today-continue").click();
    clicks += 1;
    await page.waitForURL((u) => u.pathname.startsWith("/learn/lesson/"), { timeout: WAIT }).catch(() => undefined);
    const landed = new URL(page.url());
    const expected = new URL(body.hero!.href, BASE);
    ok(landed.pathname === expected.pathname, `lesson route ${landed.pathname}`);
    ok(landed.searchParams.get("step") === expected.searchParams.get("step"), `at step ${landed.searchParams.get("step")} (expected ${expected.searchParams.get("step")})`);
    ok(clicks === 1, `${clicks} click from /learn`);
    await page.close();

    step("4. loading and error states");
    const slow = await ctx.newPage();
    await slow.route("**/api/v5/today", async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await slow.goto(`${BASE}/learn`, { timeout: WAIT });
    ok(await slow.getByTestId("today-skeleton").waitFor({ timeout: WAIT }).then(() => true).catch(() => false), "a layout-shaped skeleton while it loads");
    await slow.getByTestId("today-continue").waitFor({ timeout: WAIT });
    await slow.close();

    const failing = await ctx.newPage();
    await failing.route("**/api/v5/today", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { code: "INTERNAL", message: "Something went wrong." } }) }));
    await failing.goto(`${BASE}/learn`, { timeout: WAIT });
    ok(await failing.getByText("We couldn't load Today").waitFor({ timeout: WAIT }).then(() => true).catch(() => false), "a plain error state");
    await failing.unroute("**/api/v5/today");
    await failing.getByRole("button", { name: "Try again" }).click({ timeout: WAIT });
    ok(await failing.getByTestId("today-continue").waitFor({ timeout: WAIT }).then(() => true).catch(() => false), "Try again recovers");
    await failing.close();
    await ctx.close();

    step("5. axe, layout and screenshots: 390 and 1440, light and dark");
    for (const width of [390, 1440]) {
      for (const theme of ["light", "dark"] as const) {
        const c = await newLearnerContext(browser, storage, width, theme);
        const p = await c.newPage();
        await openToday(p);
        await p.waitForTimeout(700); // the one entrance and the ring fill settle
        const isDark = await p.evaluate(() => document.documentElement.classList.contains("dark"));
        ok(isDark === (theme === "dark"), `${width} ${theme}: theme applied`);
        const scope = await p.evaluate(() => document.documentElement.getAttribute("data-ui"));
        ok(scope === "v5", `${width} ${theme}: v5 scope on <html>`);
        const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        ok(overflow <= 1, `${width} ${theme}: no horizontal scroll (${overflow}px)`);
        const result = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        const bad = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        ok(
          bad.length === 0,
          `axe ${width} ${theme}: ${result.violations.length} violations, ${bad.length} serious/critical${bad.length ? ` (${bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`).join("; ")})` : ""}`,
        );
        const file = path.join(SHOTS, `today-${width}-${theme}.png`);
        await p.screenshot({ path: file, fullPage: true });
        await c.close();
      }
    }
    console.log(`  screenshots: ${SHOTS}`);

    step("6. reduced motion: the page still renders fully");
    const rm = await browser.newContext({ storageState: storage, viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const rp = await rm.newPage();
    await openToday(rp);
    const opacity = await rp.getByTestId("today-continue").evaluate((el) => getComputedStyle(el.closest("section")!.parentElement!).opacity);
    ok(Number(opacity) > 0.99 || opacity === "1", `content visible under reduced motion (opacity ${opacity})`);
    await rm.close();
    await adminCtx.close();
    await learnerSeed.close();
  } finally {
    await browser.close();
    stopServer();
  }

  if (failures.length) {
    console.log(`\n${failures.length} check(s) failed:`);
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("\nall checks passed");
}

main().catch((error: unknown) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
