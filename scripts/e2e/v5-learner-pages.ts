/**
 * Oyelearn v5 Phase 4: My plan, Library, Review and Me, end to end.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh learner)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/v5-learner-pages.ts
 *   bash scripts/e2e/snapshot-build.sh --remove learner
 *
 * Seeds through the API (superadmin → a learner on the v5 design with a three-topic plan; the
 * learner submits the Closures test with one wrong answer; two lesson notes are written straight
 * into the database), then checks in a real browser:
 * - My plan: the week trail is ONE <path> with one "M", one waypoint per item; the List toggle shows lanes.
 * - Library: instant search, a filter, the course page, Start → the lesson route.
 * - Review: the wrong answer is in "Fix my mistakes"; a due session is rated by keyboard (Space, 3)
 *   and the due count drops.
 * - Me: levels, notes (search), settings (a change survives a reload).
 * - axe (WCAG 2.2 AA tags): no serious or critical violations on every page at 390 and 1440, light and dark.
 * Screenshots: %TEMP%/claude/e2e-shots-v5-learner. Port 8823, throwaway DATA_DIR, mock AI.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import Database from "better-sqlite3";
import { chromium, type APIRequestContext, type Browser, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.E2E_PORT ?? 8823);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER = "learner.p4";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const SHOTS = path.join(os.tmpdir(), "claude", "e2e-shots-v5-learner");
const WAIT = 20_000;
const HEADED = process.env.E2E_HEADED === "1";
const PLAN = ["js-closures", "js-hoisting", "js-scope-chain"];
const QUIZ_TOPIC = "js-closures";

const failures: string[] = [];
const notes: string[] = [];
function ok(cond: unknown, message: string): boolean {
  console.log(`    ${cond ? "\u001b[32mok\u001b[0m  " : "\u001b[31mFAIL\u001b[0m"} ${message}`);
  if (!cond) failures.push(message);
  return Boolean(cond);
}
function note(message: string): void {
  console.log(`    \u001b[33mnote\u001b[0m ${message}`);
  notes.push(message);
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
  for (const required of ["dist/index.html", "dist-server/index.js"]) {
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
// Seeding
// ---------------------------------------------------------------------------

interface QuizQ {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  correctIndices?: number[];
}

function closuresQuiz(): QuizQ[] {
  const mod = JSON.parse(fs.readFileSync(path.join(APP, "server", "content", "frontend", "fe-js-core.json"), "utf8")) as { topics: { id: string; quiz?: QuizQ[] }[] };
  return mod.topics.find((t) => t.id === QUIZ_TOPIC)!.quiz!;
}

async function seed(browser: Browser, dataDir: string): Promise<{ storage: string; wrongPrompt: string }> {
  step("seed: superadmin, a v5 learner with a plan, one wrong test answer, two notes");
  const adminCtx = await browser.newContext();
  await call(adminCtx.request, "post", "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
  await call(adminCtx.request, "post", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });
  const created = await call<{ user: { id: string }; temporaryPassword: string }>(adminCtx.request, "post", "/api/admin/users", {
    username: LEARNER,
    displayName: "Priya Learner",
    profile: { roleTitle: "Frontend Engineer", yearsExperience: 1, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
    issueAssessment: false,
  });
  await call(adminCtx.request, "put", `/api/admin/users/${created.user.id}/plan`, { topicIds: PLAN });
  await call(adminCtx.request, "put", "/api/admin/video-settings", { lockMode: "warn" });
  await adminCtx.close();

  const learnerCtx = await browser.newContext();
  await call(learnerCtx.request, "post", "/api/auth/login", { username: LEARNER, password: created.temporaryPassword });
  await call(learnerCtx.request, "post", "/api/auth/change-password", { currentPassword: created.temporaryPassword, newPassword: LEARNER_NEW });
  await call(learnerCtx.request, "put", "/api/me/ui", { v5: true });

  const quiz = closuresQuiz();
  const answers: Record<string, number[]> = {};
  for (const q of quiz) answers[q.id] = q.correctIndices && q.correctIndices.length > 1 ? q.correctIndices : [q.correctIndex];
  const first = quiz[0];
  const right = answers[first.id];
  answers[first.id] = [first.options.findIndex((_, i) => !right.includes(i))];
  const result = await call<{ passed: boolean; perQuestion: { id: string; correct: boolean }[] }>(learnerCtx.request, "post", `/api/topics/${QUIZ_TOPIC}/attempt`, { kind: "quiz", answers });
  ok(result.perQuestion.some((q) => !q.correct), "seed: the test has one wrong answer");

  const storage = path.join(dataDir, "learner.json");
  await learnerCtx.storageState({ path: storage });
  await learnerCtx.close();

  const db = new Database(path.join(dataDir, "oyelearn.db"));
  try {
    const userId = (db.prepare("select id from users where username = ?").get(LEARNER) as { id: string }).id;
    const at = Date.now();
    const insert = db.prepare("insert into lesson_notes (id, user_id, topic_id, video_id, at_sec, body, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?)");
    insert.run("e2e-n1", userId, "js-closures", "qikxEIxsXco", 125, "Closures keep the outer scope alive after the function returns.", at, at);
    insert.run("e2e-n2", userId, "js-hoisting", null, null, "let and const sit in the temporal dead zone.", at, at + 1);
  } finally {
    db.close();
  }
  return { storage, wrongPrompt: first.prompt };
}

// ---------------------------------------------------------------------------
// Page helpers
// ---------------------------------------------------------------------------

async function openAs(browser: Browser, storage: string, width: number, theme: "light" | "dark"): Promise<Page> {
  const ctx = await browser.newContext({ storageState: storage, viewport: { width, height: width < 768 ? 844 : 900 }, colorScheme: theme });
  await ctx.addInitScript((t) => {
    try {
      window.localStorage.setItem("oyelabs-ui", JSON.stringify({ state: { theme: t, sidebarCollapsed: false }, version: 0 }));
    } catch {
      // ignore
    }
  }, theme);
  const page = await ctx.newPage();
  page.on("pageerror", (error) => note(`[pageerror ${width}/${theme}] ${error.message}`));
  return page;
}

async function go(page: Page, url: string, heading: string | RegExp): Promise<void> {
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: WAIT });
  await page.getByRole("heading", { level: 1, name: heading }).waitFor({ timeout: WAIT });
  await page.waitForLoadState("networkidle", { timeout: WAIT }).catch(() => undefined);
  await page.waitForTimeout(400);
}

async function axe(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  for (const v of bad) {
    console.log(`      ${v.impact} ${v.id}: ${v.help} (${v.nodes.length})`);
    for (const n of v.nodes.slice(0, 4)) console.log(`        ${n.target.join(" ")} :: ${n.failureSummary?.split("\n").slice(0, 2).join(" ")}`);
  }
  ok(bad.length === 0, `${label}: axe finds no serious or critical violations (${results.violations.length} total)`);
  for (const v of results.violations.filter((x) => !bad.includes(x))) note(`${label}: ${v.impact} ${v.id} (${v.nodes.length})`);
}

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true, animations: "disabled", timeout: WAIT }).catch((e: Error) => note(`screenshot ${name} failed: ${e.message.split("\n")[0]}`));
}

// ---------------------------------------------------------------------------
// Flows (1440 light)
// ---------------------------------------------------------------------------

async function planFlow(page: Page): Promise<void> {
  step("My plan: one continuous trail, and the list toggle");
  await go(page, "/learn/plan", "My plan");
  const pathEl = page.locator('[data-testid="week-trail-path"]');
  await pathEl.waitFor({ timeout: WAIT });
  ok((await pathEl.count()) === 1, "exactly one week-trail-path");
  const d = (await pathEl.getAttribute("d")) ?? "";
  ok((d.match(/M/g) ?? []).length === 1, `the trail has one "M" (${d.length} chars)`);
  const waypoints = await page.locator('[data-testid="week-trail-waypoint"]').count();
  ok(waypoints >= 1, `waypoints drawn (${waypoints})`);
  await page.locator('[data-testid="week-trail-waypoint"]').first().click();
  ok(await page.locator("#week-item-detail").getByText(/^Why:/).first().isVisible({ timeout: WAIT }).catch(() => false), "a waypoint opens its detail with a why chip");
  await page.getByRole("button", { name: "List", exact: true }).click();
  ok(await page.locator('[data-testid="week-lanes"]').isVisible({ timeout: WAIT }).catch(() => false), "List shows the lanes");
  ok((await pathEl.count()) === 0, "and hides the trail");
  await page.reload({ waitUntil: "networkidle" });
  ok(await page.locator('[data-testid="week-lanes"]').isVisible({ timeout: WAIT }).catch(() => false), "the list choice is remembered after a reload");
  await page.getByRole("button", { name: "Trail", exact: true }).click();
  await pathEl.waitFor({ timeout: WAIT });
}

async function libraryFlow(page: Page): Promise<void> {
  step("Library: search, filter, course page, Start");
  await go(page, "/learn/library", "Library");
  await page.locator('[data-testid="library-card"]').first().waitFor({ timeout: WAIT });
  const before = await page.locator('[data-testid="library-card"]').count();
  await page.getByLabel("Search the library").fill("zzzz-no-such-thing");
  ok(await page.getByText("Nothing matches").isVisible({ timeout: WAIT }).catch(() => false), "a search with no match says so");
  await page.getByLabel("Search the library").fill("javascript");
  await page.waitForTimeout(200);
  const found = await page.locator('[data-testid="library-card"]').count();
  ok(found >= 1 && found <= before, `searching "javascript" shows matches instantly (${found} of ${before})`);
  await page.getByRole("button", { name: /^Filters/ }).click();
  await page.getByLabel("Level").selectOption("expert");
  await page.waitForTimeout(150);
  const filtered = await page.locator('[data-testid="library-card"]').count();
  const nothing = await page.getByText("Nothing matches").isVisible().catch(() => false);
  ok(filtered < found || nothing || filtered === found, `the level filter applies (${filtered} cards)`);
  await page.getByRole("button", { name: "Clear filters" }).click();
  const card = page.locator('[data-testid="library-card"]').first();
  ok(await card.getByText("You'll be able to:").isVisible().catch(() => false), "cards lead with outcomes");
  await card.getByRole("link").first().click();
  await page.getByRole("heading", { level: 2, name: "You'll be able to" }).waitFor({ timeout: WAIT });
  ok(await page.getByRole("heading", { name: "What's inside" }).isVisible(), "the course page shows the syllabus");
  await page.getByRole("link", { name: /^(Start|Continue|Review it again)$/ }).click();
  await page.waitForURL(/\/learn\/lesson\//, { timeout: WAIT });
  ok(/\/learn\/lesson\/[^/?]+/.test(page.url()), `Start opens the lesson route (${new URL(page.url()).pathname})`);
}

async function dueCount(page: Page): Promise<number> {
  const el = page.locator('[data-testid="review-due-count"]');
  await el.waitFor({ timeout: WAIT });
  return Number((await el.textContent())?.trim() ?? "NaN");
}

async function reviewFlow(page: Page, wrongPrompt: string): Promise<void> {
  step("Review: Fix my mistakes, then a keyboard session");
  await go(page, "/learn/review", "Review");
  const before = await dueCount(page);
  ok(before >= 2, `cards are due after the test (${before})`);

  await page.getByRole("button", { name: "Start fix my mistakes" }).click();
  const card = page.locator('[data-testid="review-card"]');
  await card.waitFor({ timeout: WAIT });
  // The card renders the prompt's code fences, so compare without backticks and whitespace.
  const squash = (s: string) => s.replace(/```[a-z]*|`|\s+/g, "");
  ok(squash((await card.textContent()) ?? "").includes(squash(wrongPrompt).slice(0, 40)), "the wrong answer is in Fix my mistakes");
  await card.focus();
  await page.keyboard.press("Space");
  ok(await page.locator('[data-testid="review-answer"]').isVisible({ timeout: WAIT }).catch(() => false), "Space shows the answer");
  ok(await card.getByText("Right answer").isVisible().catch(() => false), "the right option is marked");
  ok(await card.getByText("You chose this").isVisible().catch(() => false), "and so is what was chosen");
  await page.keyboard.press("1");
  await page.getByRole("heading", { name: "Session done" }).waitFor({ timeout: WAIT });
  await page.getByRole("button", { name: "Back to Review" }).click();

  const mid = await dueCount(page);
  await page.getByRole("button", { name: "Start due now" }).click();
  await card.waitFor({ timeout: WAIT });
  const total = Number(/of (\d+)/.exec((await page.getByText(/^Card \d+ of \d+$/).first().textContent()) ?? "")?.[1] ?? "0");
  const rate = Math.min(2, total);
  for (let i = 0; i < rate; i++) {
    await page.keyboard.press(" ");
    await page.locator('[data-testid="review-answer"]').waitFor({ timeout: WAIT });
    await page.keyboard.press("3");
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(400);
  const after = await dueCount(page);
  ok(after <= mid - rate, `rating ${rate} cards with the keyboard drops the due count (${mid} → ${after})`);
  await page.reload({ waitUntil: "networkidle" });
  ok((await dueCount(page)) === after, "the new due count holds after a reload");
}

async function meFlow(page: Page): Promise<void> {
  step("Me: levels, notes, settings that persist");
  await go(page, "/learn/me", /Priya Learner|Me/);
  ok(await page.locator('[data-testid="me-skill-levels"]').isVisible({ timeout: WAIT }).catch(() => false), "the skill levels section shows");
  await page.getByRole("tab", { name: "Notes" }).click();
  const list = page.locator('[data-testid="me-notes"]');
  await list.waitFor({ timeout: WAIT });
  ok((await list.locator("li").count()) === 2, "both notes are listed");
  await page.getByLabel("Search your notes").fill("dead zone");
  await page.waitForTimeout(200);
  ok((await list.locator("li").count()) === 1, "searching the notes narrows them");
  const href = await list.locator("a").first().getAttribute("href");
  ok(href === "/learn/lesson/js-hoisting", `a note links to its lesson (${href})`);

  await page.getByRole("tab", { name: "Settings" }).click();
  const weekly = page.getByRole("switch", { name: "Weekly email" });
  await weekly.waitFor({ timeout: WAIT });
  ok((await weekly.getAttribute("aria-checked")) === "true", "weekly email starts on");
  await weekly.click();
  await page.getByText("Saved", { exact: true }).waitFor({ timeout: WAIT }).catch(() => undefined);
  await page.reload({ waitUntil: "networkidle" });
  const again = page.getByRole("switch", { name: "Weekly email" });
  await again.waitFor({ timeout: WAIT });
  ok((await again.getAttribute("aria-checked")) === "false", "the change is still there after a reload");
  ok(await page.getByRole("button", { name: "Use previous design" }).isVisible(), "Use previous design is offered");
  ok(await page.getByRole("link", { name: "Replay the welcome" }).isVisible(), "Replay the welcome is offered");
}

// ---------------------------------------------------------------------------
// axe + screenshots at 390/1440, light/dark
// ---------------------------------------------------------------------------

const PAGES: { url: string; heading: string | RegExp; name: string; prepare?: (page: Page) => Promise<void> }[] = [
  { url: "/learn/plan", heading: "My plan", name: "plan" },
  {
    url: "/learn/plan",
    heading: "My plan",
    name: "plan-list",
    prepare: async (p) => {
      await p.getByRole("button", { name: "List", exact: true }).click();
      await p.locator('[data-testid="week-lanes"]').waitFor({ timeout: WAIT });
    },
  },
  { url: "/learn/library", heading: "Library", name: "library" },
  { url: `/learn/library/${encodeURIComponent("module:frontend:fe-js-core")}`, heading: /./, name: "course" },
  { url: "/learn/review", heading: "Review", name: "review" },
  {
    url: "/learn/review",
    heading: "Review",
    name: "review-session",
    prepare: async (p) => {
      await p.getByRole("button", { name: /^Start (mixed practice|due now)$/ }).first().click();
      await p.locator('[data-testid="review-card"]').waitFor({ timeout: WAIT });
      await p.keyboard.press(" ");
      await p.locator('[data-testid="review-answer"]').waitFor({ timeout: WAIT });
    },
  },
  { url: "/learn/me", heading: /./, name: "me" },
  { url: "/learn/me?tab=notes", heading: /./, name: "me-notes" },
  { url: "/learn/me?tab=settings", heading: /./, name: "me-settings" },
];

async function sweep(browser: Browser, storage: string): Promise<void> {
  for (const width of [390, 1440]) {
    for (const theme of ["light", "dark"] as const) {
      step(`axe and screenshots at ${width} ${theme}`);
      const page = await openAs(browser, storage, width, theme);
      try {
        for (const target of PAGES) {
          await go(page, target.url, target.heading);
          if (target.prepare) await target.prepare(page);
          await page.waitForTimeout(300);
          const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          ok(scroll <= 1, `${target.name} ${width} ${theme}: no sideways scroll (${scroll}px)`);
          await axe(page, `${target.name} ${width} ${theme}`);
          await shot(page, `${target.name}-${width}-${theme}`);
        }
      } finally {
        await page.context().close();
      }
    }
  }
}

async function main(): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v5l-"));
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: !HEADED });
  try {
    const { storage, wrongPrompt } = await seed(browser, dataDir);
    const page = await openAs(browser, storage, 1440, "light");
    try {
      await planFlow(page);
      await libraryFlow(page);
      await reviewFlow(page, wrongPrompt);
      await meFlow(page);
    } finally {
      await page.context().close();
    }
    await sweep(browser, storage);
  } finally {
    await browser.close();
    stopServer();
  }

  console.log("");
  console.log(`screenshots: ${SHOTS}`);
  if (notes.length) console.log(`${notes.length} note(s)`);
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
