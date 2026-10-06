/**
 * Oyelearn v5 Phase 9.2: screenshots of every main screen for the heuristic UX review
 * (docs/v5/UX_REVIEW.md), plus the three click counts.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh p9ux)
 *   E2E_APP_DIR="$APP" E2E_SHOTS_TAG=before npx tsx scripts/e2e/v5-review-shots.ts
 *   bash scripts/e2e/snapshot-build.sh --remove p9ux
 *
 * Writes docs/v5/shots/review/<tag>/<screen>-<width>-<theme>.jpg (tag "before" or "after").
 * Every screen at 390 and 1440, light and dark; the theme is written before each load and checked
 * on <html>. `E2E_ONLY=learner,lesson,assessment,admin,clicks` runs a part; `E2E_SCREENS=today,plan`
 * only those screens; `E2E_THEMES=light` only one theme.
 *
 * Seeded through the API and a few direct DB rows: a new learner (plan, nothing done), a mid-plan
 * learner (a lesson done, a wrong answer so Review has cards, a note, XP, a reminder in the bell),
 * a learner who takes the test (mock AI), and admin work for the inbox (review requests, a stuck
 * learner, a reported problem, an unpublished course). Port 8842, throwaway DATA_DIR, mock AI.
 * Helpers copied from v5-mobile-learner.ts / v5-mobile-admin.ts / v5-assessment.ts on purpose.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import { chromium, type APIRequestContext, type Browser, type BrowserContext, type Locator, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.E2E_PORT ?? 8842);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER_PW = "Waypoint-Lantern-5824-Zk!";
const TAG = process.env.E2E_SHOTS_TAG ?? "before";
const SHOTS = path.join(REPO, "docs", "v5", "shots", "review", TAG);
const WAIT = 20_000;
const JOB_TIMEOUT_MS = 6 * 60_000;
const HEADED = process.env.E2E_HEADED === "1";
const DAY = 86_400_000;
const CODE_TOPIC = "js-call-stack";
const QUIZ_TOPIC = "js-closures";
const PLAN = ["js-execution-context", CODE_TOPIC, QUIZ_TOPIC, "js-hoisting", "js-scope-chain", "js-let-const-tdz"];
const COURSE = encodeURIComponent("module:frontend:fe-js-core");
const ONLY = new Set((process.env.E2E_ONLY ?? "").split(",").map((s) => s.trim()).filter(Boolean));
const runs = (part: string) => ONLY.size === 0 || ONLY.has(part);
const SCREENS = new Set((process.env.E2E_SCREENS ?? "").split(",").map((s) => s.trim()).filter(Boolean));
const wants = (name: string) => SCREENS.size === 0 || SCREENS.has(name);
type Theme = "light" | "dark";
const THEMES: Theme[] = process.env.E2E_THEMES === "light" ? ["light"] : process.env.E2E_THEMES === "dark" ? ["dark"] : ["light", "dark"];
const WIDTHS = [390, 1440] as const;

const failures: string[] = [];
const notes: string[] = [];
const taken: string[] = [];
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

async function seen(locator: Locator, timeoutMs = WAIT): Promise<boolean> {
  return locator
    .first()
    .waitFor({ state: "visible", timeout: timeoutMs })
    .then(() => true)
    .catch(() => false);
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
      PISTON_URL: process.env.PISTON_URL ?? "http://127.0.0.1:2000",
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
// Seed
// ---------------------------------------------------------------------------

interface QuizQ {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  correctIndices?: number[];
}

function moduleQuiz(topicId: string): QuizQ[] {
  const mod = JSON.parse(fs.readFileSync(path.join(APP, "server", "content", "frontend", "fe-js-core.json"), "utf8")) as { topics: { id: string; quiz?: QuizQ[] }[] };
  return mod.topics.find((t) => t.id === topicId)?.quiz ?? [];
}

const rightAnswers = (quiz: QuizQ[]) => Object.fromEntries(quiz.map((q) => [q.id, q.correctIndices && q.correctIndices.length > 0 ? q.correctIndices : [q.correctIndex]]));

interface Seeded {
  admin: APIRequestContext;
  adminCtx: BrowserContext;
  adminStorage: string;
  /** Learner storage by key. */
  storage: Record<"fresh" | "mid" | "done390" | "done1440" | "test", string>;
  ids: Record<string, string>;
  courseId: string;
  reviewIds: string[];
  assessmentId: string | null;
}

const PROFILE = { roleTitle: "Frontend Engineer", yearsExperience: 1, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] };

async function makeLearner(browser: Browser, admin: APIRequestContext, dataDir: string, username: string, displayName: string, plan: string[] | null): Promise<{ id: string; storage: string; request: APIRequestContext; ctx: BrowserContext }> {
  const created = await call<{ user: { id: string }; temporaryPassword: string }>(admin, "post", "/api/admin/users", { username, displayName, profile: PROFILE, issueAssessment: false });
  if (plan) await call(admin, "put", `/api/admin/users/${created.user.id}/plan`, { topicIds: plan });
  const ctx = await browser.newContext();
  await call(ctx.request, "post", "/api/auth/login", { username, password: created.temporaryPassword });
  await call(ctx.request, "post", "/api/auth/change-password", { currentPassword: created.temporaryPassword, newPassword: LEARNER_PW });
  await call(ctx.request, "put", "/api/me/ui", { v5: true });
  await call(ctx.request, "put", "/api/v5/motivation/prefs", { welcomeDone: true });
  const storage = path.join(dataDir, `${username}.json`);
  await ctx.storageState({ path: storage });
  return { id: created.user.id, storage, request: ctx.request, ctx };
}

async function seed(browser: Browser, dataDir: string): Promise<Seeded> {
  step("seed: admin, three learners, a test, inbox work");
  const adminCtx = await browser.newContext();
  const admin = adminCtx.request;
  await call(admin, "post", "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
  await call(admin, "post", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });
  await call(admin, "put", "/api/me/ui", { v5: true });
  await call(admin, "put", "/api/v5/motivation/prefs", { welcomeDone: true }).catch(() => undefined);
  await call(admin, "put", "/api/admin/video-settings", { lockMode: "warn" });
  const adminStorage = path.join(dataDir, "admin.json");
  await adminCtx.storageState({ path: adminStorage });

  const fresh = await makeLearner(browser, admin, dataDir, "nina.new", "Nina New", PLAN);
  const mid = await makeLearner(browser, admin, dataDir, "asha.mid", "Asha Mehta", PLAN);
  const done390 = await makeLearner(browser, admin, dataDir, "dev.done", "Dev Done", [QUIZ_TOPIC, "js-hoisting"]);
  const done1440 = await makeLearner(browser, admin, dataDir, "dina.done", "Dina Done", [QUIZ_TOPIC, "js-hoisting"]);

  // Mid-plan: the first lesson passed, a wrong answer on Closures (Review cards), a note, steps done.
  const ec = moduleQuiz("js-execution-context");
  if (ec.length) await call(mid.request, "post", "/api/topics/js-execution-context/attempt", { kind: "quiz", answers: rightAnswers(ec) }).catch((e: Error) => note(`seed: execution context attempt: ${e.message}`));
  const closures = moduleQuiz(QUIZ_TOPIC);
  const answers = rightAnswers(closures);
  const first = closures[0]!;
  answers[first.id] = [first.options.findIndex((_, i) => !(answers[first.id] ?? []).includes(i))];
  await call(mid.request, "post", `/api/topics/${QUIZ_TOPIC}/attempt`, { kind: "quiz", answers });
  await call(mid.request, "post", `/api/v5/lessons/${QUIZ_TOPIC}/notes`, { body: "Closures keep the outer scope alive after the function returns." });
  await call(mid.request, "put", `/api/v5/lessons/${CODE_TOPIC}/state`, { step: "read", stepDone: { watch: true, read: true } });
  await call(mid.request, "put", `/api/v5/lessons/${QUIZ_TOPIC}/state`, { step: "read", stepDone: { watch: true, read: true } });
  for (const l of [done390, done1440]) await call(l.request, "put", `/api/v5/lessons/${QUIZ_TOPIC}/state`, { step: "do", stepDone: { watch: true, read: true, do: true } }).catch(() => undefined);
  await call(admin, "post", "/api/admin/v5/people/nudge", { userIds: [mid.id] }).catch((e: Error) => note(`seed: nudge: ${e.message}`));
  for (const l of [fresh, mid, done390, done1440]) await l.ctx.close();

  // The test learner.
  const test = await makeLearner(browser, admin, dataDir, "sam.test", "Sam Okafor", null);
  await test.ctx.close();
  let assessmentId: string | null = null;
  if (runs("assessment")) {
    await call(admin, "put", `/api/admin/users/${test.id}/setup`, {
      departmentId: "engineering",
      priorities: [
        { skillId: "eng-javascript", slider: 5 },
        { skillId: "ss-standup-updates", slider: 5 },
        { skillId: "ss-workplace-writing", slider: 4 },
      ],
    });
    const issued = await call<{ assessmentId: string }>(admin, "post", `/api/admin/users/${test.id}/assessments`, {});
    assessmentId = issued.assessmentId;
    await poll("the test to be written", JOB_TIMEOUT_MS, async () => {
      const { assessments } = await call<{ assessments: { id: string; status: string }[] }>(admin, "get", `/api/admin/users/${test.id}/assessments`);
      const a = assessments.find((x) => x.id === issued.assessmentId);
      if (a?.status === "failed") throw new Error("assessment generation failed");
      if (a?.status === "awaiting_approval") await call(admin, "post", `/api/admin/assessments/${a.id}/approve`, {}).catch(() => undefined);
      return a?.status === "ready" ? a : null;
    }, 1500);
  }

  // Inbox work for the admin.
  await call(admin, "post", "/api/admin/users", { username: "sana.iqbal", displayName: "Sana Iqbal", profile: PROFILE, issueAssessment: false });
  const { users } = await call<{ users: { id: string; username: string }[] }>(admin, "get", "/api/admin/users");
  const stuckId = users.find((u) => u.username === "sana.iqbal")!.id;
  const course = (await call<{ course: { id: string } }>(admin, "post", "/api/admin/courses", { title: "How we ship", summary: "Our release steps.", accent: "glacier", audience: "everyone", published: false })).course;
  const withSection = (await call<{ course: { sections: { id: string }[] } }>(admin, "post", `/api/admin/courses/${course.id}/sections`, { title: "Basics", summary: "" })).course;
  await call(admin, "post", `/api/admin/courses/sections/${withSection.sections[0]!.id}/topics`, { title: "Release day", body: "We ship on **Tuesdays**.\n\n- Tag the build\n- Tell the team", links: [], estMinutes: 10 });
  const db = new Database(path.join(dataDir, "oyelearn.db"));
  const reviewIds: string[] = [];
  try {
    db.pragma("busy_timeout = 5000");
    const now = Date.now();
    for (let i = 0; i < 4; i++) {
      const id = `e2e-review-${i}-${now.toString(36)}`;
      reviewIds.push(id);
      db.prepare("INSERT INTO review_requests (id, user_id, source, ref_id, status, learner_note, created_at) VALUES (?, ?, 'assessment_item', ?, 'open', 'I think my answer was right', ?)").run(id, mid.id, `e2e-missing-item-${i}`, now - (3 + i) * DAY);
    }
    db.prepare("INSERT INTO learning_plans (id, user_id, version, source, topic_ids, published_at) VALUES (?, ?, 1, 'admin', ?, ?)").run(`e2e-plan-${stuckId}`, stuckId, JSON.stringify(["js-execution-context", "js-call-stack", "js-hoisting"]), now - 20 * DAY);
    db.prepare("INSERT INTO topic_progress (user_id, topic_id, status, attempts, completed_at, updated_at) VALUES (?, 'js-execution-context', 'completed', 1, ?, ?)").run(stuckId, now - 10 * DAY, now - 10 * DAY);
    db.prepare("INSERT INTO problem_reports (id, user_id, topic_id, step, message, status, created_at) VALUES (?, ?, 'js-call-stack', 'watch', 'The video stops halfway.', 'open', ?)").run(`e2e-problem-${now}`, mid.id, now - DAY);
  } finally {
    db.close();
  }

  return {
    admin,
    adminCtx,
    adminStorage,
    storage: { fresh: fresh.storage, mid: mid.storage, done390: done390.storage, done1440: done1440.storage, test: test.storage },
    ids: { fresh: fresh.id, mid: mid.id, test: test.id, stuck: stuckId },
    courseId: course.id,
    reviewIds,
    assessmentId,
  };
}

// ---------------------------------------------------------------------------
// Page helpers
// ---------------------------------------------------------------------------

async function openAs(browser: Browser, storage: string | null, width: number, theme: Theme, extra: { permissions?: string[] } = {}): Promise<Page> {
  const ctx = await browser.newContext({
    ...(storage ? { storageState: storage } : {}),
    viewport: { width, height: width < 768 ? 844 : 900 },
    colorScheme: theme,
    ...(width < 768 ? { isMobile: true, hasTouch: true } : {}),
    ...(extra.permissions ? { permissions: extra.permissions } : {}),
  });
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

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: WAIT }).catch(() => undefined);
  await page.waitForTimeout(500);
}

async function go(page: Page, url: string, heading: string | RegExp = /./): Promise<void> {
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: WAIT });
  await page.getByRole("heading", { level: 1, name: heading }).first().waitFor({ timeout: WAIT });
  await settle(page);
}

async function openLesson(page: Page, topicId: string, query = ""): Promise<void> {
  await page.goto(`${BASE}/learn/lesson/${topicId}${query}`, { waitUntil: "domcontentloaded", timeout: WAIT });
  await page.getByTestId("v5-lesson").waitFor({ timeout: WAIT });
  await settle(page);
}

async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate((t) => document.documentElement.classList.toggle("dark", t === "dark"), theme);
  await page.waitForTimeout(200);
}

async function shot(page: Page, name: string, width: number, theme: Theme, fullPage = true): Promise<void> {
  const dark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  if (dark !== (theme === "dark")) {
    ok(false, `${name}-${width}-${theme}: <html> is ${dark ? "dark" : "light"}`);
    return;
  }
  fs.mkdirSync(SHOTS, { recursive: true });
  const file = path.join(SHOTS, `${name}-${width}-${theme}.jpg`);
  await page
    .screenshot({ path: file, fullPage, type: "jpeg", quality: 72, animations: "disabled", timeout: WAIT })
    .then(() => taken.push(path.relative(REPO, file).replace(/\\/g, "/")))
    .catch((e: Error) => note(`screenshot ${name} failed: ${e.message.split("\n")[0]}`));
}

interface Screen {
  name: string;
  who: keyof Seeded["storage"] | "admin" | "anon";
  open: (page: Page, width: number) => Promise<void>;
  fullPage?: boolean;
}

/** Each screen in a fresh context per width and theme, so nothing carries over. */
async function shootAll(browser: Browser, s: Seeded, screens: Screen[]): Promise<void> {
  for (const screen of screens) {
    if (!wants(screen.name)) continue;
    for (const width of WIDTHS) {
      for (const theme of THEMES) {
        const storage = screen.who === "admin" ? s.adminStorage : screen.who === "anon" ? null : s.storage[screen.who];
        const page = await openAs(browser, storage, width, theme, { permissions: ["clipboard-read", "clipboard-write"] });
        try {
          await screen.open(page, width);
          await page.waitForTimeout(300);
          await shot(page, screen.name, width, theme, screen.fullPage ?? true);
        } catch (error) {
          ok(false, `${screen.name} ${width} ${theme}: opens (${(error as Error).message.split("\n")[0]})`);
        } finally {
          await page.context().close();
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Learner screens
// ---------------------------------------------------------------------------

function learnerScreens(): Screen[] {
  return [
    { name: "today-new", who: "fresh", open: (p) => go(p, "/learn", "Today") },
    { name: "today-mid", who: "mid", open: (p) => go(p, "/learn", "Today") },
    { name: "plan-trail", who: "mid", open: (p) => go(p, "/learn/plan", "My plan") },
    {
      name: "plan-list",
      who: "mid",
      open: async (p) => {
        await go(p, "/learn/plan", "My plan");
        await p.getByRole("button", { name: "List", exact: true }).click();
        await p.getByTestId("week-lanes").waitFor({ timeout: WAIT });
      },
    },
    { name: "library", who: "mid", open: (p) => go(p, "/learn/library", "Library") },
    { name: "course", who: "mid", open: (p) => go(p, `/learn/library/${COURSE}`) },
    { name: "review-due", who: "mid", open: (p) => go(p, "/learn/review", "Review") },
    {
      name: "review-card",
      who: "mid",
      open: async (p) => {
        await go(p, "/learn/review", "Review");
        await p.getByRole("button", { name: /^Start (due now|mixed practice)$/ }).first().click();
        await p.getByTestId("review-card").waitFor({ timeout: WAIT });
        await p.getByRole("button", { name: "Show answer" }).click();
        await p.getByTestId("review-answer").waitFor({ timeout: WAIT });
      },
    },
    { name: "review-empty", who: "fresh", open: (p) => go(p, "/learn/review", "Review") },
    {
      name: "review-offline",
      who: "mid",
      open: async (p) => {
        await go(p, "/learn/review", "Review");
        // Give the background "save one session for offline" a moment, then drop the network.
        await p.waitForTimeout(1500);
        await p.context().setOffline(true);
        await p.evaluate(() => window.dispatchEvent(new Event("offline")));
        // Leave and come back through the app, so Review loads with no server.
        await p.getByRole("link", { name: /^Today/ }).first().click();
        await p.waitForTimeout(500);
        await p.getByRole("link", { name: /^Review/ }).first().click();
        await p.getByTestId("review-offline").waitFor({ timeout: WAIT }).catch(() => undefined);
        await p.waitForTimeout(800);
      },
    },
    { name: "me-progress", who: "mid", open: (p) => go(p, "/learn/me") },
    { name: "me-notes", who: "mid", open: (p) => go(p, "/learn/me?tab=notes") },
    { name: "me-settings", who: "mid", open: (p) => go(p, "/learn/me?tab=settings") },
    {
      name: "welcome",
      who: "fresh",
      fullPage: false,
      open: async (p) => {
        await p.goto(`${BASE}/learn?welcome=1`, { waitUntil: "domcontentloaded", timeout: WAIT });
        await p.getByRole("dialog").getByRole("heading", { name: "Here's your plan" }).waitFor({ timeout: WAIT });
        await settle(p);
      },
    },
    {
      name: "bell",
      who: "mid",
      fullPage: false,
      open: async (p) => {
        await go(p, "/learn", "Today");
        await p.getByTestId("v5-bell").click();
        await p.getByTestId("v5-notification-list").waitFor({ timeout: WAIT });
        await p.waitForTimeout(400);
      },
    },
    {
      name: "error-boundary",
      who: "mid",
      open: async (p) => {
        // A broken answer from the server makes Today throw while rendering.
        await p.route("**/api/v5/today", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ firstName: "Asha" }) }));
        await p.goto(`${BASE}/learn`, { waitUntil: "domcontentloaded", timeout: WAIT });
        await p.getByRole("heading", { level: 1, name: "Something went wrong on this page." }).waitFor({ timeout: WAIT });
        await settle(p);
      },
    },
  ];
}

function lessonScreens(): Screen[] {
  return [
    { name: "lesson-watch", who: "mid", open: (p) => openLesson(p, CODE_TOPIC, "?step=watch") },
    { name: "lesson-read", who: "mid", open: (p) => openLesson(p, CODE_TOPIC, "?step=read") },
    { name: "lesson-do", who: "mid", open: (p) => openLesson(p, CODE_TOPIC, "?step=do") },
    {
      name: "lesson-do-code",
      who: "mid",
      open: async (p, width) => {
        await openLesson(p, CODE_TOPIC, "?step=do");
        if (width < 768) await p.getByRole("tab", { name: /^Code/ }).click();
        await p.waitForTimeout(400);
      },
    },
    { name: "lesson-check", who: "mid", open: (p) => openLesson(p, QUIZ_TOPIC, "?step=check") },
  ];
}

/** Clicks the right options on the Check step, matching option text (they are shuffled). */
async function passCheck(page: Page, admin: APIRequestContext, learner: APIRequestContext): Promise<void> {
  type Q = { id: string; prompt: string; options: string[]; correctIndices?: number[]; correctIndex?: number };
  const keyed = (await call<{ topics: { id: string; quiz?: Q[] }[] }>(admin, "get", "/api/content/modules/frontend/fe-js-core")).topics.find((t) => t.id === QUIZ_TOPIC)?.quiz ?? [];
  const served = (await call<{ topics: { id: string; quiz?: Q[] }[] }>(learner, "get", "/api/content/modules/frontend/fe-js-core")).topics.find((t) => t.id === QUIZ_TOPIC)?.quiz ?? [];
  const fieldsets = page.getByTestId("v5-lesson").locator("form fieldset");
  for (let i = 0; i < served.length; i++) {
    const q = served[i]!;
    const k = keyed.find((x) => x.id === q.id) ?? keyed.find((x) => x.prompt === q.prompt);
    const right = k?.correctIndices?.length ? k.correctIndices : [k?.correctIndex ?? 0];
    for (const oi of right) {
      const text = (k?.options[oi] ?? q.options[oi] ?? "").replace(/[`*]/g, "").slice(0, 40);
      await fieldsets.nth(i).locator("label").filter({ hasText: text }).first().click();
    }
  }
  await page.getByRole("button", { name: "Send my answers" }).click();
}

/** Quick check and lesson complete: they change state, so each width uses its own learner. */
async function lessonFlows(browser: Browser, s: Seeded): Promise<void> {
  for (const width of WIDTHS) {
    const key = width < 768 ? "done390" : "done1440";
    if (wants("quick-check")) {
      step(`quick check at ${width}`);
      const page = await openAs(browser, s.storage.fresh, width, "light");
      try {
        // The fresh learner hasn't watched Closures, so Next on Watch pops the quick check.
        await openLesson(page, QUIZ_TOPIC, "?step=watch");
        const next = page.getByTestId("v5-lesson").getByRole("button", { name: /^Next$/ }).last();
        await poll("Next enabled", WAIT, async () => ((await next.isEnabled()) ? true : null));
        await next.click();
        const quick = page.getByRole("dialog", { name: "Quick check" });
        await quick.getByTestId("quick-check").waitFor({ timeout: WAIT });
        await page.waitForTimeout(400);
        for (const theme of THEMES) {
          await setTheme(page, theme);
          await shot(page, "quick-check", width, theme, false);
        }
        await setTheme(page, "light");
        for (const group of await quick.locator("fieldset").all()) await group.locator("label").first().click();
        await quick.getByRole("button", { name: "Check my answers" }).click();
        await quick.getByText(/^(Right\.|Not quite\.)$/).first().waitFor({ timeout: WAIT });
        await page.waitForTimeout(300);
        for (const theme of THEMES) {
          await setTheme(page, theme);
          await shot(page, "quick-check-result", width, theme, false);
        }
      } catch (error) {
        ok(false, `quick check ${width}: ${(error as Error).message.split("\n")[0]}`);
      } finally {
        await page.context().close();
      }
    }
    if (wants("lesson-complete")) {
      step(`lesson complete at ${width}`);
      const page = await openAs(browser, s.storage[key], width, "light");
      try {
        await openLesson(page, QUIZ_TOPIC, "?step=check");
        await passCheck(page, s.admin, page.context().request);
        await page.getByText("Lesson finished").first().waitFor({ timeout: WAIT });
        await page.waitForTimeout(600);
        await shot(page, "lesson-complete-celebration", width, "light", false);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(2500);
        for (const theme of THEMES) {
          await setTheme(page, theme);
          await shot(page, "lesson-complete", width, theme);
        }
      } catch (error) {
        ok(false, `lesson complete ${width}: ${(error as Error).message.split("\n")[0]}`);
      } finally {
        await page.context().close();
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Assessment: pre-flight, the sheet, results, certificate and verify
// ---------------------------------------------------------------------------

async function shootBoth(page: Page, name: string, fullPage = true): Promise<void> {
  // CDP emulation every time: once the sheet is in (emulated) fullscreen, setViewportSize no
  // longer changes the layout, and a CDP override would otherwise stick at the last width.
  const cdp = await page.context().newCDPSession(page);
  // Widest first: after a phone-width pass the fullscreen sheet keeps its phone layout.
  for (const width of [...WIDTHS].sort((a, b) => b - a)) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 }).catch(() => undefined);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width, height: width < 768 ? 844 : 900, deviceScaleFactor: 1, mobile: width < 768 });
    await page.waitForTimeout(300);
    for (const theme of THEMES) {
      await setTheme(page, theme);
      await shot(page, name, width, theme, fullPage);
    }
  }
  await setTheme(page, "light");
  await cdp.send("Emulation.clearDeviceMetricsOverride").catch(() => undefined);
  await page.setViewportSize({ width: 1440, height: 900 }).catch(() => undefined);
  await cdp.detach().catch(() => undefined);
}

async function ensureFullscreen(page: Page): Promise<void> {
  const gate = page.getByRole("button", { name: "Return to fullscreen" });
  if (await gate.isVisible().catch(() => false)) {
    await gate.click();
    await page.waitForTimeout(500);
  }
  const real = await page.evaluate(() => document.fullscreenElement !== null);
  if (!real && (await gate.isVisible().catch(() => false))) {
    await page.evaluate(() => {
      Object.defineProperty(Document.prototype, "fullscreenElement", { configurable: true, get: () => document.documentElement });
      document.dispatchEvent(new Event("fullscreenchange"));
    });
  }
  await gate.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => undefined);
}

async function assessmentFlow(browser: Browser, s: Seeded, dataDir: string): Promise<void> {
  if (!s.assessmentId) return;
  const ctx = await browser.newContext({ storageState: s.storage.test, viewport: { width: 1440, height: 900 }, permissions: ["camera", "microphone"], acceptDownloads: true });
  await ctx.addInitScript(() => {
    try {
      window.localStorage.setItem("oyelabs-ui", JSON.stringify({ state: { theme: "light", sidebarCollapsed: false }, version: 0 }));
    } catch {
      // ignore
    }
  });
  const page = await ctx.newPage();
  page.on("pageerror", (error) => note(`[pageerror assessment] ${error.message}`));
  try {
    step("assessment: pre-flight");
    await page.goto(`${BASE}/assessment`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await page.getByRole("heading", { name: "Before you start" }).waitFor({ timeout: WAIT });
    await settle(page);
    await shootBoth(page, "assessment-preflight");

    step("assessment: the sheet");
    await call(ctx.request, "post", `/api/assessment/${s.assessmentId}/consent`, { agreed: true, permissions: { camera: true, microphone: true, fullscreen: true, tabMonitoring: true } });
    await call(ctx.request, "post", `/api/assessment/${s.assessmentId}/start`, {});
    await page.goto(`${BASE}/assessment`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await page.waitForSelector("text=/Question \\d+ of \\d+|Return to fullscreen/", { timeout: 30_000 });
    await ensureFullscreen(page);
    await page.getByText(/^Question \d+ of \d+/).first().waitFor({ timeout: WAIT });
    const radios = page.locator("article").first().locator('input[type="radio"]');
    if ((await radios.count()) > 0) await radios.first().check();
    await page.waitForTimeout(1200);
    await shootBoth(page, "assessment-sheet", false);

    step("assessment: hand in, wait for marking");
    await page.getByRole("button", { name: "Finish", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Hand in your answers?" });
    await dialog.waitFor({ timeout: WAIT });
    await shootBoth(page, "assessment-handin", false);
    await dialog.getByRole("button", { name: "Hand in my answers" }).click();
    await page.getByText(/Your answers are handed in|marking your answers/).first().waitFor({ timeout: 30_000 });
    await shootBoth(page, "assessment-waiting");
    await poll("the test to be marked", JOB_TIMEOUT_MS, async () => {
      const { assessments } = await call<{ assessments: { id: string; status: string }[] }>(s.admin, "get", `/api/admin/users/${s.ids.test}/assessments`);
      const a = assessments.find((x) => x.id === s.assessmentId);
      if (a?.status === "failed") throw new Error("evaluation failed");
      return a?.status === "completed" ? true : null;
    }, 2000);

    step("assessment: results");
    await page.goto(`${BASE}/assessment`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await page.getByRole("heading", { name: "Look back at your answers" }).waitFor({ timeout: 60_000 });
    await settle(page);
    await shootBoth(page, "assessment-results");

    step("certificate and verify");
    const db = new Database(path.join(dataDir, "oyelearn.db"));
    try {
      const at = Date.now();
      db.prepare(
        "insert into learner_goals (id, user_id, type, original_text, outcome, skill_ids, target_level, slider, position, status, achieved_at, source, created_at, updated_at) values (?, ?, 'text', ?, ?, ?, 3, 4, 99, 'achieved', ?, 'admin', ?, ?)",
      ).run("e2e-goal-1", s.ids.test, "Give a clear stand-up update", "Give a clear stand-up update", JSON.stringify(["ss-standup-updates"]), at, at, at);
    } finally {
      db.close();
    }
    const mine = await call<{ certificates: { id: string; kind: string }[] }>(ctx.request, "get", "/api/v5/certificates");
    const cert = mine.certificates.find((c) => c.kind === "goal");
    if (!cert) throw new Error("no certificate was issued");
    await page.goto(`${BASE}/learn/certificate/${cert.id}`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await page.getByRole("heading", { level: 1, name: "Give a clear stand-up update" }).waitFor({ timeout: WAIT });
    await page.waitForTimeout(2500);
    await shootBoth(page, "certificate");
    const anon = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await anon.newPage();
    await p.goto(`${BASE}/verify/${cert.id}`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await p.getByRole("heading", { name: "This certificate is valid" }).waitFor({ timeout: WAIT });
    await settle(p);
    await shootBoth(p, "verify");
    await anon.close();
  } catch (error) {
    ok(false, `assessment flow: ${(error as Error).message.split("\n")[0]}`);
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// Admin screens
// ---------------------------------------------------------------------------

const EMPTY_INBOX = JSON.stringify({ groups: [], total: 0, generatedAt: Date.now() });

function adminScreens(s: Seeded): Screen[] {
  return [
    { name: "admin-inbox", who: "admin", open: (p) => go(p, "/admin", "Needs your attention") },
    {
      name: "admin-inbox-empty",
      who: "admin",
      open: async (p) => {
        await p.route("**/api/admin/v5/inbox", (route) => route.fulfill({ status: 200, contentType: "application/json", body: EMPTY_INBOX }));
        await go(p, "/admin", "Needs your attention");
      },
    },
    { name: "admin-overview", who: "admin", open: (p) => go(p, "/admin/overview") },
    { name: "admin-people", who: "admin", open: (p) => go(p, "/admin/people") },
    {
      name: "admin-people-sheet",
      who: "admin",
      open: async (p) => {
        // On a phone the sheet is modal, so the page behind it (and its h1) is hidden from roles.
        await p.goto(`${BASE}/admin/people?person=${s.ids.mid}`, { waitUntil: "domcontentloaded", timeout: WAIT });
        await p.getByRole("dialog").first().waitFor({ timeout: WAIT });
        await p.getByRole("dialog").first().getByRole("heading", { name: "Recent activity" }).waitFor({ timeout: WAIT }).catch(() => undefined);
        await settle(p);
      },
    },
    {
      name: "admin-onboard",
      who: "admin",
      open: async (p) => {
        await go(p, "/admin/onboard");
        await p.getByRole("radiogroup", { name: "Department" }).waitFor({ timeout: WAIT });
      },
    },
    {
      name: "admin-onboard-suggested",
      who: "admin",
      open: async (p) => {
        await go(p, "/admin/onboard");
        await p.getByRole("radiogroup", { name: "Department" }).waitFor({ timeout: WAIT });
        await p.getByLabel("Full name").fill("Priya Sharma");
        await p.getByLabel("Describe them in one line").fill("Frontend dev, 2 yrs React, weak on Git, we want her doing backend + AI-driven work");
        await p.getByRole("button", { name: "Suggest", exact: true }).click();
        const card = p.getByRole("region", { name: /^Here's the plan/ });
        await card.waitFor({ timeout: 60_000 });
        await poll("the test preview", 30_000, async () => ((await card.innerText()).includes("Working it out") ? null : true), 300).catch(() => undefined);
        await settle(p);
      },
    },
    { name: "admin-library", who: "admin", open: (p) => go(p, "/admin/library") },
    {
      name: "admin-editor",
      who: "admin",
      open: async (p) => {
        await go(p, `/admin/library/${s.courseId}/edit`);
        await p.getByRole("textbox", { name: "Lesson content" }).waitFor({ timeout: WAIT });
      },
    },
    { name: "admin-reports", who: "admin", open: (p) => go(p, "/admin/reports") },
  ];
}

// ---------------------------------------------------------------------------
// Click counts
// ---------------------------------------------------------------------------

async function clickCounts(browser: Browser, s: Seeded): Promise<void> {
  let clicks = 0;
  const click = async (l: Locator) => {
    clicks += 1;
    await l.click({ timeout: WAIT });
  };

  step("click count: learner, opening the app → inside the next step");
  {
    const page = await openAs(browser, s.storage.fresh, 1440, "light");
    try {
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: WAIT });
      await page.waitForURL((u) => u.pathname === "/learn", { timeout: WAIT });
      await page.getByTestId("today-continue").waitFor({ timeout: WAIT });
      clicks = 0;
      await click(page.getByTestId("today-continue"));
      await page.getByTestId("v5-lesson").waitFor({ timeout: WAIT });
      ok(clicks <= 1, `learner: / → inside the next step in ${clicks} click(s) (target ≤ 1; landed on ${new URL(page.url()).pathname})`);
      console.log(`CLICKS learner ${clicks}`);
    } finally {
      await page.context().close();
    }
  }

  step("click count: admin, onboard + send a test (typing not counted)");
  {
    const page = await openAs(browser, s.adminStorage, 1440, "light");
    try {
      await go(page, "/admin", "Needs your attention");
      clicks = 0;
      await click(page.getByRole("link", { name: "Onboard", exact: true }).first());
      await page.getByRole("radiogroup", { name: "Department" }).waitFor({ timeout: WAIT });
      await page.getByLabel("Full name").fill("Ravi Kumar");
      // The same description as the baseline (v5-admin.ts). A vaguer one can raise a "Pick one"
      // question first, which is one more click by design (error prevention).
      await page.getByLabel("Describe them in one line").fill("Frontend dev, 2 yrs React, weak on Git, we want him doing backend + AI-driven work");
      await click(page.getByRole("button", { name: "Suggest", exact: true }));
      const card = page.getByRole("region", { name: /^Here's the plan/ });
      await card.waitFor({ timeout: 60_000 });
      await poll("the test preview", 30_000, async () => ((await card.innerText()).includes("Working it out") ? null : true), 300);
      await click(card.getByRole("button", { name: "Looks good — send the test" }));
      await page.getByRole("status").filter({ hasText: "Account created for Ravi Kumar" }).waitFor({ timeout: 60_000 });
      ok(clicks <= 3, `admin: onboard + send in ${clicks} click(s) (target ≤ 3)`);
      console.log(`CLICKS onboard ${clicks}`);
    } finally {
      await page.context().close();
    }
  }

  step("click count: admin, approve a review request");
  {
    const page = await openAs(browser, s.adminStorage, 1440, "light");
    try {
      await go(page, "/admin", "Needs your attention");
      const reviews = page.getByRole("region", { name: /Asked to check an answer again/ });
      await reviews.waitFor({ timeout: WAIT });
      clicks = 0;
      await click(reviews.getByRole("button", { name: /^Give full marks/ }).first());
      await page.getByText("Full marks given").first().waitFor({ timeout: WAIT });
      ok(clicks === 1, `admin: approve a review request in ${clicks} click(s) (target 1)`);
      console.log(`CLICKS approve ${clicks}`);
    } finally {
      await page.context().close();
    }
  }
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v5review-"));
  await startServer(dataDir);
  const browser = await chromium.launch({
    headless: !HEADED,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
  });
  try {
    const s = await seed(browser, dataDir);
    try {
      if (runs("learner")) await shootAll(browser, s, learnerScreens());
      if (runs("lesson")) {
        await shootAll(browser, s, lessonScreens());
        await lessonFlows(browser, s);
      }
      if (runs("admin")) await shootAll(browser, s, adminScreens(s));
      if (runs("assessment")) await assessmentFlow(browser, s, dataDir);
      if (runs("clicks")) await clickCounts(browser, s);
    } finally {
      await s.adminCtx.close();
    }
  } finally {
    await browser.close();
    stopServer();
  }
  console.log("");
  console.log(`${taken.length} screenshots in ${SHOTS}`);
  if (notes.length) console.log(`${notes.length} note(s)`);
  if (failures.length) {
    console.log(`\u001b[31m${failures.length} failure(s)\u001b[0m`);
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("\u001b[32mall shots taken\u001b[0m");
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
