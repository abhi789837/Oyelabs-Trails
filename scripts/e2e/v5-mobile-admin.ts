/**
 * Oyelearn v5 Phase 8 (admin): tablet and phone, plus the polish (optimistic actions, Undo).
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh p8admin)     # a private built copy (never the shared dist/)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/v5-mobile-admin.ts
 *   bash scripts/e2e/snapshot-build.sh --remove p8admin
 *
 * 1. Every admin screen (v5 screens and older pages in the v5 frame) at 768 and 1024 light, and at
 *    1440 dark: axe (WCAG 2.2 AA + best practice) 0 serious/critical, no page-level sideways scroll,
 *    every main destination reachable from the nav.
 * 2. Phone (390, light and dark): the inbox and people lookup pass axe and never scroll sideways;
 *    every other admin screen at least never scrolls sideways.
 * 3. Phone: approve from the inbox ("Give full marks") in place, and the request is decided.
 * 4. Phone: search People, open someone as a card, and the full-height sheet shows the status line
 *    with the next action.
 * 5. Undo a destructive action: archive someone from People, press Undo, and they stay active.
 * Screenshots: %TEMP%/claude/e2e-shots-v5-mobile-admin.
 *
 * Throwaway DATA_DIR under %TEMP%, port 8831, the deterministic mock AI (NODE_ENV=development).
 * Exits non-zero when any assertion fails, and always stops its server.
 * Helpers are copied from v5-admin.ts on purpose, so no script's changes can break another.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import Database from "better-sqlite3";
import { chromium, type APIRequestContext, type Browser, type BrowserContext, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.E2E_PORT ?? 8831);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const HEADED = process.env.E2E_HEADED === "1";
const WAIT = 20_000;
const SHOTS = path.join(os.tmpdir(), "claude", "e2e-shots-v5-mobile-admin");
const DAY = 86_400_000;
/** Only the sweep (no journeys), for a quick look at layouts. */
const SWEEP_ONLY = process.env.E2E_SWEEP_ONLY === "1";

const failures: string[] = [];
function ok(cond: unknown, message: string): boolean {
  console.log(`    ${cond ? "\u001b[32mok\u001b[0m  " : "\u001b[31mFAIL\u001b[0m"} ${message}`);
  if (!cond) failures.push(message);
  return Boolean(cond);
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
    if (!fs.existsSync(path.join(APP, required))) throw new Error(`${path.join(APP, required)} is missing. Build first (see the top of this file).`);
  }
  const logPath = path.join(dataDir, "server.log");
  const log = fs.createWriteStream(logPath);
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
  server.on("exit", (code) => {
    if (code !== null && code !== 0) console.log(`  server exited with ${code}; log: ${logPath}`);
  });
  console.log(`server log: ${logPath}`);
  await poll(
    "/api/health",
    60_000,
    async () => {
      if (server?.exitCode !== null) throw new Error(`server exited early (${server?.exitCode}); see ${logPath}`);
      const res = await fetch(`${BASE}/api/health`).catch(() => null);
      return res?.ok ? true : null;
    },
    500,
  );
}

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

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

const PROFILE = { roleTitle: "Frontend Engineer", yearsExperience: 2, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] };

interface Seeded {
  rahulId: string;
  stuckId: string;
  tempId: string;
  reviewIds: string[];
  courseId: string;
}

async function seed(admin: APIRequestContext, dataDir: string): Promise<Seeded> {
  await sendJson(admin, "post", "/api/admin/users", { username: "rahul.verma", displayName: "Rahul Verma", profile: PROFILE, issueAssessment: false });
  await sendJson(admin, "post", "/api/admin/users", { username: "sana.iqbal", displayName: "Sana Iqbal", profile: PROFILE, issueAssessment: false });
  await sendJson(admin, "post", "/api/admin/users", { username: "tomas.reyes", displayName: "Tomas Reyes", profile: PROFILE, issueAssessment: false });
  const { users } = await getJson<{ users: { id: string; username: string }[] }>(admin, "/api/admin/users");
  const rahulId = users.find((u) => u.username === "rahul.verma")!.id;
  const stuckId = users.find((u) => u.username === "sana.iqbal")!.id;
  const tempId = users.find((u) => u.username === "tomas.reyes")!.id;

  const course = (await sendJson<{ course: { id: string } }>(admin, "post", "/api/admin/courses", { title: "How we ship", summary: "Our release steps.", accent: "glacier", audience: "everyone", published: false })).course;
  const withSection = (await sendJson<{ course: { sections: { id: string }[] } }>(admin, "post", `/api/admin/courses/${course.id}/sections`, { title: "Basics", summary: "" })).course;
  await sendJson(admin, "post", `/api/admin/courses/sections/${withSection.sections[0]!.id}/topics`, { title: "Release day", body: "We ship on **Tuesdays**.\n\n- Tag the build\n- Tell the team", links: [], estMinutes: 10 });

  // Things that would normally take a test and a week to happen, written straight into the database.
  const db = new Database(path.join(dataDir, "oyelearn.db"));
  try {
    db.pragma("busy_timeout = 5000");
    const now = Date.now();
    const reviewIds = [0, 1].map((i) => `e2e-review-${i}-${now.toString(36)}`);
    for (const [i, id] of reviewIds.entries()) {
      db.prepare("INSERT INTO review_requests (id, user_id, source, ref_id, status, learner_note, created_at) VALUES (?, ?, 'assessment_item', ?, 'open', 'I think my answer was right', ?)").run(id, rahulId, `e2e-missing-item-${i}`, now - (3 + i) * DAY);
    }
    db.prepare("INSERT INTO learning_plans (id, user_id, version, source, topic_ids, published_at) VALUES (?, ?, 1, 'admin', ?, ?)").run(`e2e-plan-${stuckId}`, stuckId, JSON.stringify(["js-execution-context", "js-call-stack", "js-hoisting"]), now - 20 * DAY);
    db.prepare("INSERT INTO topic_progress (user_id, topic_id, status, attempts, completed_at, updated_at) VALUES (?, 'js-execution-context', 'completed', 1, ?, ?)").run(stuckId, now - 10 * DAY, now - 10 * DAY);
    db.prepare("INSERT INTO problem_reports (id, user_id, topic_id, step, message, status, created_at) VALUES (?, ?, 'js-call-stack', 'watch', 'The video stops halfway.', 'open', ?)").run(`e2e-problem-${now}`, stuckId, now - DAY);
    return { rahulId, stuckId, tempId, reviewIds, courseId: course.id };
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// axe, sideways scroll and screenshots
// ---------------------------------------------------------------------------

interface AxeRow {
  label: string;
  serious: number;
  critical: number;
  other: number;
  rules: string[];
}
const axeRows: AxeRow[] = [];

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: WAIT }).catch(() => undefined);
  await page.waitForTimeout(400);
}

async function axe(page: Page, label: string): Promise<void> {
  await settle(page);
  await page.evaluate(`document.querySelectorAll("iframe").forEach((f) => { try { if (new URL(f.src, location.href).origin !== location.origin) f.remove(); } catch { f.remove(); } })`);
  const result = await Promise.race([
    new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).exclude("iframe").analyze(),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("axe timed out after 90 s")), 90_000)),
  ]);
  const row: AxeRow = { label, serious: 0, critical: 0, other: 0, rules: [] };
  for (const v of result.violations) {
    if (v.impact === "serious") row.serious += v.nodes.length;
    else if (v.impact === "critical") row.critical += v.nodes.length;
    else row.other += v.nodes.length;
    row.rules.push(`${v.id} (${v.impact}, ${v.nodes.length}: ${v.nodes[0]?.target.join(" ") ?? ""})`);
  }
  axeRows.push(row);
  ok(row.serious + row.critical === 0, `axe ${label}: ${row.critical} critical, ${row.serious} serious${row.rules.length ? ` — ${row.rules.join("; ")}` : ""}`);
}

/** The page itself never scrolls sideways; wide things scroll inside their own box. */
async function noSidewaysScroll(page: Page, label: string): Promise<void> {
  const r = await page.evaluate(() => {
    const doc = document.documentElement;
    const over = doc.scrollWidth - doc.clientWidth;
    // The widest element poking out of the viewport, to make a failure easy to find.
    let culprit = "";
    if (over > 1) {
      let worst = 0;
      for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
        const right = el.getBoundingClientRect().right;
        if (right > doc.clientWidth + 1 && right > worst) {
          let clipped = false;
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const s = getComputedStyle(p);
            if (s.overflowX !== "visible" || s.position === "fixed") {
              clipped = true;
              break;
            }
          }
          if (!clipped) {
            worst = right;
            culprit = `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}.${String(el.className).slice(0, 80)} (right ${Math.round(right)})`;
          }
        }
      }
    }
    return { over, culprit };
  });
  ok(r.over <= 1, `no sideways page scroll: ${label} (${r.over}px${r.culprit ? `; ${r.culprit}` : ""})`);
}

async function shot(page: Page, name: string): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true }).catch(() => undefined);
}

async function visit(page: Page, route: string): Promise<void> {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: WAIT });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: WAIT });
  await settle(page);
}

/**
 * A browser context at one size and theme. The signed-in storage carries the app's saved theme,
 * which wins over the system colour scheme, so the theme is written before every page load.
 */
async function newCtx(browser: Browser, storage: string, o: { width: number; height: number; theme?: "light" | "dark"; phone?: boolean }): Promise<BrowserContext> {
  const theme = o.theme ?? "light";
  const ctx = await browser.newContext({ storageState: storage, viewport: { width: o.width, height: o.height }, colorScheme: theme, ...(o.phone ? { isMobile: true, hasTouch: true } : {}) });
  await ctx.addInitScript((t) => {
    try {
      window.localStorage.setItem("oyelabs-ui", JSON.stringify({ state: { theme: t, sidebarCollapsed: false }, version: 0 }));
    } catch {
      // ignore
    }
  }, theme);
  return ctx;
}

async function checkTheme(page: Page, theme: "light" | "dark", label: string): Promise<void> {
  const dark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  ok(dark === (theme === "dark"), `the page is in ${theme} mode: ${label}`);
}

function slug(route: string): string {
  return route.replace(/[/?=&]+/g, "_").replace(/^_/, "") || "admin";
}

// ---------------------------------------------------------------------------
// Sweep
// ---------------------------------------------------------------------------

function v5Routes(s: Seeded): string[] {
  return [
    "/admin",
    "/admin/overview",
    "/admin/people",
    `/admin/people?person=${s.rahulId}`,
    "/admin/onboard",
    "/admin/library",
    `/admin/library/${s.courseId}/edit`,
    "/admin/reports",
    "/admin/announcements",
    "/admin/problems",
    "/admin/tutor-answers",
  ];
}

/** Older pages shown unchanged inside the v5 frame. */
function olderRoutes(s: Seeded): string[] {
  return [`/admin/people/${s.rahulId}`, "/admin/departments", "/admin/reviews", "/admin/question-bank", "/admin/ai-usage", "/admin/audit", "/admin/courses"];
}

const MAIN_NAV = ["Inbox", "People", "Onboard", "Library", "Overview", "Reports"];

async function navReachable(page: Page, label: string): Promise<void> {
  const missing: string[] = [];
  for (const name of MAIN_NAV) {
    const link = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: new RegExp(`^${name}`) });
    let visible = false;
    for (const l of await link.all()) if (await l.isVisible()) visible = true;
    if (!visible) {
      // A "More" menu counts, if it shows the page once opened.
      const more = page.getByRole("button", { name: /^More/ }).first();
      if (await more.isVisible().catch(() => false)) {
        await more.click();
        const inMenu = page.getByRole("menuitem", { name: new RegExp(`^${name}`) }).or(page.getByRole("link", { name: new RegExp(`^${name}`) }));
        for (const l of await inMenu.all()) if (await l.isVisible()) visible = true;
        await page.keyboard.press("Escape");
      }
    }
    if (!visible) missing.push(name);
  }
  ok(missing.length === 0, `every main page is in the nav: ${label}${missing.length ? ` (missing ${missing.join(", ")})` : ""}`);
}

async function sweep(browser: Browser, storage: string, s: Seeded): Promise<void> {
  const all = [...v5Routes(s), ...olderRoutes(s)];
  const sizes: { width: number; height: number; theme: "light" | "dark" }[] = [
    { width: 768, height: 1024, theme: "light" },
    { width: 1024, height: 768, theme: "light" },
    { width: 1440, height: 900, theme: "dark" },
  ];
  for (const size of sizes) {
    step(`every admin screen at ${size.width} ${size.theme}`);
    const ctx = await newCtx(browser, storage, size);
    const page = await ctx.newPage();
    let themeChecked = false;
    for (const route of all) {
      await visit(page, route);
      if (route.includes("person=")) await page.getByRole("dialog").first().waitFor({ timeout: WAIT }).catch(() => undefined);
      const label = `${route} ${size.width} ${size.theme}`;
      if (!themeChecked) {
        await checkTheme(page, size.theme, label);
        themeChecked = true;
      }
      await noSidewaysScroll(page, label);
      await axe(page, label);
      await shot(page, `${slug(route)}-${size.width}-${size.theme}`);
      if (route === "/admin") await navReachable(page, `${size.width}`);
    }
    await ctx.close();
  }

  for (const theme of ["light", "dark"] as const) {
    step(`phone (390 ${theme}): inbox and people lookup pass axe; nothing scrolls sideways`);
    const ctx = await newCtx(browser, storage, { width: 390, height: 844, theme, phone: true });
    const page = await ctx.newPage();
    for (const route of ["/admin", "/admin/people", `/admin/people?person=${s.rahulId}`]) {
      await visit(page, route);
      if (route === "/admin") await checkTheme(page, theme, `${route} 390`);
      if (route.includes("person=")) await page.getByRole("dialog").first().waitFor({ timeout: WAIT }).catch(() => undefined);
      const label = `${route} 390 ${theme}`;
      await noSidewaysScroll(page, label);
      await axe(page, label);
      await shot(page, `${slug(route)}-390-${theme}`);
    }
    if (theme === "light") {
      for (const route of all.filter((r) => !["/admin", "/admin/people"].includes(r) && !r.includes("person="))) {
        await visit(page, route);
        await noSidewaysScroll(page, `${route} 390 light`);
        await shot(page, `${slug(route)}-390-light`);
      }
    }
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// Journeys
// ---------------------------------------------------------------------------

async function phoneInbox(browser: Browser, storage: string, admin: APIRequestContext, s: Seeded): Promise<void> {
  step("phone: approve from the inbox in place");
  const ctx = await newCtx(browser, storage, { width: 390, height: 844, phone: true });
  const page = await ctx.newPage();
  await visit(page, "/admin");
  const reviews = page.getByRole("region", { name: /Asked to check an answer again/ });
  await reviews.waitFor({ timeout: WAIT });
  const before = await reviews.getByRole("listitem").count();
  await reviews.getByRole("button", { name: /^Give full marks/ }).first().tap({ timeout: WAIT });
  await page.getByText("Full marks given").first().waitFor({ timeout: WAIT });
  ok(true, "the toast confirms it");
  const after = await reviews.getByRole("listitem").count().catch(() => 0);
  ok(after === before - 1, `the item left the list at once (${before} → ${after})`);
  ok(new URL(page.url()).pathname === "/admin", "the admin stayed on the inbox");
  const decided = await poll("the decision", WAIT, async () => {
    const { requests } = await getJson<{ requests: { id: string; status: string }[] }>(admin, "/api/admin/review-requests?status=all");
    return requests.filter((r) => s.reviewIds.includes(r.id) && r.status !== "open").length === 1 ? true : null;
  }).catch(() => false);
  ok(decided, "the server has the decision");
  await shot(page, "phone-inbox-after-approve");
  await ctx.close();
}

async function phonePeople(browser: Browser, storage: string, s: Seeded): Promise<void> {
  step("phone: search People, open a card, see the status line and the next action");
  const ctx = await newCtx(browser, storage, { width: 390, height: 844, phone: true });
  const page = await ctx.newPage();
  await visit(page, "/admin/people");
  ok(!(await page.getByRole("table").first().isVisible().catch(() => false)), "a card list, not the wide table");
  await page.getByRole("searchbox").or(page.getByPlaceholder(/Search name/)).first().fill("rahul");
  const card = page.getByRole("button", { name: /Rahul Verma/ }).first();
  await card.waitFor({ timeout: WAIT });
  const narrowed = await poll("the list to narrow", WAIT, async () => ((await page.getByRole("button", { name: /Sana Iqbal/ }).isVisible().catch(() => false)) ? null : true), 200).catch(() => false);
  ok(narrowed, "search narrows the list");
  await card.tap({ timeout: WAIT });
  const sheet = page.getByRole("dialog", { name: "Rahul Verma" });
  await sheet.waitFor({ timeout: WAIT });
  ok(new URL(page.url()).searchParams.get("person") === s.rahulId, "the URL keeps ?person=id");
  const box = await sheet.boundingBox();
  ok(box && box.height >= 844 - 2 && box.width >= 390 - 2, `the sheet is full height on the phone (${box ? `${Math.round(box.width)}×${Math.round(box.height)}` : "none"})`);
  const status = sheet.getByRole("status").first();
  await status.waitFor({ timeout: WAIT }).catch(() => undefined);
  ok(await status.isVisible().catch(() => false), `the status line is there ("${(await status.innerText().catch(() => "")).replace(/\s+/g, " ").trim()}")`);
  const nextButton = status.getByRole("button").first();
  ok(await nextButton.isVisible().catch(() => false), `the next action has its button ("${await nextButton.innerText().catch(() => "")}")`);
  await page.waitForTimeout(400); // the slide-in
  await noSidewaysScroll(page, "people sheet 390 after search");
  await shot(page, "phone-people-sheet");
  await page.getByRole("button", { name: "Close" }).first().tap();
  await sheet.waitFor({ state: "hidden", timeout: WAIT });
  ok(true, "Close returns to the list");

  step("phone: every page is reachable from Menu");
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Menu" }).tap();
  const menu = page.getByRole("dialog", { name: "All pages" });
  await menu.waitFor({ timeout: WAIT });
  for (const name of ["Overview", "Reports", "Announcements", "Problems reported", "Tutor answers", "Departments"]) {
    ok(await menu.getByRole("link", { name, exact: true }).isVisible().catch(() => false), `Menu lists ${name}`);
  }
  await axe(page, "phone Menu 390 light");
  await shot(page, "phone-menu");
  await menu.getByRole("link", { name: "Reports", exact: true }).tap();
  await page.getByRole("heading", { level: 1, name: "Reports" }).waitFor({ timeout: WAIT });
  ok(await menu.waitFor({ state: "hidden", timeout: 5000 }).then(() => true, () => false), "following a link closes the menu");
  await ctx.close();
}

async function undoArchive(browser: Browser, storage: string, admin: APIRequestContext, s: Seeded): Promise<void> {
  step("undo a destructive action: archive someone, then Undo");
  const ctx = await newCtx(browser, storage, { width: 1024, height: 768 });
  const page = await ctx.newPage();
  await visit(page, "/admin/people");
  const row = page.getByRole("row", { name: /Tomas Reyes/ });
  await row.waitFor({ timeout: WAIT });
  await row.getByRole("checkbox").click();
  await page.getByRole("region", { name: /1 person selected/ }).getByRole("button", { name: "Archive" }).click({ timeout: WAIT });
  await page.getByText(/^Archived 1/).first().waitFor({ timeout: WAIT });
  const badge = await row.getByText("Archived").isVisible().catch(() => false);
  ok(badge, "the row shows Archived at once (optimistic)");
  await shot(page, "undo-archive-toast-1024");
  await page.getByRole("button", { name: "Undo" }).first().click({ timeout: WAIT });
  await poll("the row to be back", WAIT, async () => ((await row.getByText("Archived").isVisible().catch(() => false)) ? null : true)).catch(() => undefined);
  ok(!(await row.getByText("Archived").isVisible().catch(() => false)), "Undo puts the row back");
  // Past the Undo window: the server must still have them active.
  await page.waitForTimeout(8_000);
  const { users } = await getJson<{ users: { id: string; status: string }[] }>(admin, "/api/admin/users");
  const status = users.find((u) => u.id === s.tempId)?.status;
  ok(status === "active", `after Undo they're still active on the server (${status})`);

  step("without Undo, the archive goes through");
  await row.getByRole("checkbox").click();
  await page.getByRole("region", { name: /1 person selected/ }).getByRole("button", { name: "Archive" }).click({ timeout: WAIT });
  await page.getByText(/^Archived 1/).first().waitFor({ timeout: WAIT });
  const archived = await poll("the archive on the server", 20_000, async () => {
    const r = await getJson<{ users: { id: string; status: string }[] }>(admin, "/api/admin/users");
    return r.users.find((u) => u.id === s.tempId)?.status === "archived" ? true : null;
  }).catch(() => false);
  ok(archived, "it is archived once the Undo window closes");
  await sendJson(admin, "post", "/api/admin/users/bulk", { ids: [s.tempId], action: "restore" }).catch(() => undefined);
  await ctx.close();
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  fs.rmSync(SHOTS, { recursive: true, force: true });
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v5mobileadmin-"));
  console.log(`app: ${APP}`);
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: !HEADED });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await signIn(page, SUPER_USER, SUPER_INITIAL, SUPER_NEW);
    await sendJson(page.request, "put", "/api/me/ui", { v5: true });
    const s = await seed(page.request, dataDir);
    const storage = path.join(dataDir, "admin-state.json");
    await context.storageState({ path: storage });

    if (!SWEEP_ONLY) {
      await phoneInbox(browser, storage, page.request, s);
      await phonePeople(browser, storage, s);
      await undoArchive(browser, storage, page.request, s);
    }
    await sweep(browser, storage, s);
    await context.close();
  } finally {
    await browser.close();
    stopServer();
  }
  const worst = axeRows.filter((r) => r.serious + r.critical > 0);
  console.log(`\naxe: ${axeRows.length} checks, ${worst.length} with serious/critical issues`);
  console.log(`screenshots: ${SHOTS}`);
  console.log(failures.length ? `\n${failures.length} failure(s):\n - ${failures.join("\n - ")}` : "\nall checks passed");
  process.exit(failures.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
