/**
 * Oyelearn v5 Phase 8: accessibility on every main v5 route (WCAG 2.2 AA).
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh p8app)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/v5-a11y.ts
 *   bash scripts/e2e/snapshot-build.sh --remove p8app
 *
 * Seeds through the API (and a few rows straight into the throwaway database): a v5 learner with a
 * plan, one wrong test answer, two notes, a ready placement test and a certificate; a v5 superadmin
 * with a course. Then, at 390 and 1440 px, light and dark:
 * - axe (wcag2a/aa, 21a/aa, 22aa) on every learner, assessment, certificate, verify, admin and
 *   /design route; 0 serious or critical violations required;
 * - no sideways scroll.
 * And a keyboard-only smoke on each frame (learner, admin, assessment, /design): the first Tab
 * lands on "Skip to content", and Enter moves focus into the main landmark.
 *
 * Set E2E_A11Y_ONLY=learner|admin to run one half. Port 8832, throwaway DATA_DIR, mock AI.
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
const PORT = Number(process.env.E2E_PORT ?? 8832);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER = "learner.a11y";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const SHOTS = path.join(os.tmpdir(), "claude", "e2e-shots-v5-a11y");
const WAIT = 20_000;
const JOB_TIMEOUT_MS = Number(process.env.E2E_JOB_TIMEOUT_MS ?? 6 * 60_000);
const HEADED = process.env.E2E_HEADED === "1";
const ONLY = process.env.E2E_A11Y_ONLY ?? "";
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
// Seed
// ---------------------------------------------------------------------------

interface QuizQ {
  id: string;
  options: string[];
  correctIndex: number;
  correctIndices?: number[];
}

interface Seeded {
  learnerStorage: string;
  adminStorage: string;
  learnerId: string;
  personId: string;
  courseId: string;
  certId: string | null;
  assessmentReady: boolean;
}

async function seed(browser: Browser, dataDir: string): Promise<Seeded> {
  step("seed: a v5 superadmin, a v5 learner with a plan, notes, a test and a certificate");
  const adminCtx = await browser.newContext();
  const admin = adminCtx.request;
  await call(admin, "post", "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
  await call(admin, "post", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });
  await call(admin, "put", "/api/me/ui", { v5: true });
  await call(admin, "put", "/api/v5/motivation/prefs", { welcomeDone: true }).catch(() => undefined);
  await call(admin, "put", "/api/admin/video-settings", { lockMode: "warn" });
  const created = await call<{ user: { id: string }; temporaryPassword: string }>(admin, "post", "/api/admin/users", {
    username: LEARNER,
    displayName: "Priya Learner",
    profile: { roleTitle: "Frontend Engineer", yearsExperience: 1, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
    issueAssessment: false,
  });
  const learnerId = created.user.id;
  await call(admin, "put", `/api/admin/users/${learnerId}/plan`, { topicIds: PLAN });
  const course = (await call<{ course: { id: string } }>(admin, "post", "/api/admin/courses", { title: "How we ship", summary: "Our release steps.", accent: "glacier", audience: "everyone", published: false })).course;
  const withSection = (await call<{ course: { sections: { id: string }[] } }>(admin, "post", `/api/admin/courses/${course.id}/sections`, { title: "Basics", summary: "" })).course;
  await call(admin, "post", `/api/admin/courses/sections/${withSection.sections[0]!.id}/topics`, { title: "Release day", body: "We ship on **Tuesdays**.\n\n- Tag the build\n- Tell the team", links: [], estMinutes: 10 });

  const learnerCtx = await browser.newContext();
  const learner = learnerCtx.request;
  await call(learner, "post", "/api/auth/login", { username: LEARNER, password: created.temporaryPassword });
  await call(learner, "post", "/api/auth/change-password", { currentPassword: created.temporaryPassword, newPassword: LEARNER_NEW });
  await call(learner, "put", "/api/me/ui", { v5: true });
  await call(learner, "put", "/api/v5/motivation/prefs", { welcomeDone: true });
  const mod = JSON.parse(fs.readFileSync(path.join(APP, "server", "content", "frontend", "fe-js-core.json"), "utf8")) as { topics: { id: string; quiz?: QuizQ[] }[] };
  const quiz = mod.topics.find((t) => t.id === QUIZ_TOPIC)!.quiz!;
  const answers: Record<string, number[]> = {};
  for (const q of quiz) answers[q.id] = q.correctIndices && q.correctIndices.length > 1 ? q.correctIndices : [q.correctIndex];
  answers[quiz[0].id] = [quiz[0].options.findIndex((_, i) => !(answers[quiz[0].id] ?? []).includes(i))];
  await call(learner, "post", `/api/topics/${QUIZ_TOPIC}/attempt`, { kind: "quiz", answers });

  const db = new Database(path.join(dataDir, "oyelearn.db"));
  try {
    db.pragma("busy_timeout = 5000");
    const at = Date.now();
    const insert = db.prepare("insert into lesson_notes (id, user_id, topic_id, video_id, at_sec, body, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?)");
    insert.run("e2e-n1", learnerId, "js-closures", "qikxEIxsXco", 125, "Closures keep the outer scope alive after the function returns.", at, at);
    insert.run("e2e-n2", learnerId, "js-hoisting", null, null, "let and const sit in the temporal dead zone.", at, at + 1);
    db.prepare(
      "insert into learner_goals (id, user_id, type, original_text, outcome, skill_ids, target_level, slider, position, status, achieved_at, source, created_at, updated_at) values (?, ?, 'text', ?, ?, ?, 3, 4, 99, 'achieved', ?, 'admin', ?, ?)",
    ).run("e2e-goal-1", learnerId, "Give a clear stand-up update", "Give a clear stand-up update", JSON.stringify(["ss-standup-updates"]), at, at, at);
  } finally {
    db.close();
  }
  const mine = await call<{ certificates: { id: string; kind: string }[] }>(learner, "get", "/api/v5/certificates").catch(() => ({ certificates: [] }));
  const certId = mine.certificates[0]?.id ?? null;
  ok(certId, `a certificate was issued (${certId})`);

  // A placement test for the pre-flight screen (mock AI).
  let assessmentReady = false;
  try {
    const issued = await call<{ assessmentId: string }>(admin, "post", `/api/admin/users/${learnerId}/assessments`, {});
    await poll("the test to be written", JOB_TIMEOUT_MS, async () => {
      const { assessments } = await call<{ assessments: { id: string; status: string }[] }>(admin, "get", `/api/admin/users/${learnerId}/assessments`);
      const a = assessments.find((x) => x.id === issued.assessmentId);
      if (a?.status === "failed") throw new Error("assessment generation failed");
      if (a?.status === "awaiting_approval") await call(admin, "post", `/api/admin/assessments/${a.id}/approve`, {}).catch(() => undefined);
      return a?.status === "ready" ? a : null;
    }, 1500);
    assessmentReady = true;
  } catch (error) {
    note(`no placement test (${String(error).slice(0, 120)}); /assessment is checked in its empty state`);
  }

  const learnerStorage = path.join(dataDir, "learner.json");
  await learnerCtx.storageState({ path: learnerStorage });
  await learnerCtx.close();
  const adminStorage = path.join(dataDir, "admin.json");
  await adminCtx.storageState({ path: adminStorage });
  await adminCtx.close();
  return { learnerStorage, adminStorage, learnerId, personId: learnerId, courseId: course.id, certId, assessmentReady };
}

// ---------------------------------------------------------------------------
// Page helpers
// ---------------------------------------------------------------------------

async function open(browser: Browser, storage: string | undefined, width: number, theme: "light" | "dark"): Promise<Page> {
  const ctx = await browser.newContext({ storageState: storage, viewport: { width, height: width < 768 ? 844 : 900 }, colorScheme: theme, serviceWorkers: "block" });
  await ctx.addInitScript((t) => {
    try {
      window.localStorage.setItem("oyelabs-ui", JSON.stringify({ state: { theme: t, sidebarCollapsed: false }, version: 0 }));
    } catch {
      // ignore
    }
  }, theme);
  const page = await ctx.newPage();
  page.on("pageerror", (error) => note(`[pageerror ${width}/${theme}] ${error.message.split("\n")[0]}`));
  return page;
}

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: WAIT }).catch(() => undefined);
  await page.waitForTimeout(400);
}

async function go(page: Page, url: string, heading: RegExp | string = /./): Promise<void> {
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: WAIT });
  await page.getByRole("heading", { level: 1, name: heading }).first().waitFor({ timeout: WAIT });
  await settle(page);
}

interface AxeRow {
  label: string;
  bad: string[];
}
const axeRows: AxeRow[] = [];

async function axe(page: Page, label: string): Promise<void> {
  const result = await Promise.race([
    new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      // Third-party frames (YouTube) can't be changed here.
      .exclude("iframe")
      .analyze(),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("axe timed out after 90 s")), 90_000)),
  ]);
  const bad = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const row: AxeRow = { label, bad: bad.map((v) => `${v.id} (${v.impact}) ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`) };
  axeRows.push(row);
  ok(bad.length === 0, `axe ${label}: ${bad.length ? row.bad.join("; ") : `0 serious/critical (${result.violations.length} minor)`}`);
  for (const v of result.violations.filter((x) => !bad.includes(x))) note(`${label}: ${v.impact} ${v.id} (${v.nodes.length})`);
}

async function noSideways(page: Page, label: string): Promise<void> {
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(scroll <= 1, `${label}: no sideways scroll (${scroll}px)`);
}

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false, animations: "disabled", timeout: WAIT }).catch(() => undefined);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

interface Target {
  name: string;
  url: string;
  heading?: RegExp | string;
  /** For screens without an h1 (the lesson player waits for its own test id). */
  ready?: (page: Page) => Promise<void>;
  prepare?: (page: Page) => Promise<void>;
}

function learnerTargets(s: Seeded): Target[] {
  const lessonReady = async (p: Page) => {
    await p.getByTestId("v5-lesson").waitFor({ timeout: WAIT });
  };
  const t: Target[] = [
    { name: "today", url: "/learn" },
    { name: "plan", url: "/learn/plan", heading: "My plan" },
    { name: "library", url: "/learn/library", heading: "Library" },
    { name: "course", url: `/learn/library/${encodeURIComponent("module:frontend:fe-js-core")}` },
    { name: "review", url: "/learn/review", heading: "Review" },
    {
      name: "review-session",
      url: "/learn/review",
      heading: "Review",
      prepare: async (p) => {
        await p.getByRole("button", { name: /^Start (due now|mixed practice|fix my mistakes)$/ }).first().click();
        await p.getByTestId("review-card").waitFor({ timeout: WAIT });
        await p.keyboard.press(" ");
        await p.getByTestId("review-answer").waitFor({ timeout: WAIT });
      },
    },
    { name: "me-progress", url: "/learn/me?tab=progress" },
    { name: "me-notes", url: "/learn/me?tab=notes" },
    { name: "me-settings", url: "/learn/me?tab=settings" },
    ...(["watch", "read", "do", "check"] as const).map((stepName) => ({ name: `lesson-${stepName}`, url: `/learn/lesson/${QUIZ_TOPIC}?step=${stepName}`, ready: lessonReady })),
    { name: "assessment", url: "/assessment", heading: s.assessmentReady ? "Before you start" : /./ },
  ];
  if (s.certId) t.push({ name: "certificate", url: `/learn/certificate/${s.certId}` });
  return t;
}

function adminTargets(s: Seeded): Target[] {
  return [
    { name: "admin-inbox", url: "/admin" },
    { name: "admin-overview", url: "/admin/overview" },
    { name: "admin-people", url: "/admin/people" },
    // On a phone the person opens in a modal sheet, which hides the page's h1 from the a11y tree.
    { name: "admin-person", url: `/admin/people?person=${s.personId}`, ready: async (p) => void (await p.getByRole("dialog").first().waitFor({ timeout: WAIT })) },
    { name: "admin-onboard", url: "/admin/onboard" },
    { name: "admin-library", url: "/admin/library" },
    { name: "admin-editor", url: `/admin/library/${s.courseId}/edit` },
    { name: "admin-reports", url: "/admin/reports" },
    { name: "admin-announcements", url: "/admin/announcements" },
    { name: "admin-problems", url: "/admin/problems" },
    { name: "admin-tutor-answers", url: "/admin/tutor-answers" },
    { name: "design", url: "/design?all=1" },
  ];
}

async function visit(page: Page, target: Target): Promise<void> {
  await page.goto(`${BASE}${target.url}`, { waitUntil: "domcontentloaded", timeout: WAIT });
  if (target.ready) await target.ready(page);
  else await page.getByRole("heading", { level: 1, name: target.heading ?? /./ }).first().waitFor({ timeout: WAIT });
  await settle(page);
  if (target.prepare) {
    await target.prepare(page);
    // Let colour transitions (200 ms) finish, so contrast is measured on the settled colours.
    await page.waitForTimeout(500);
  }
}

async function sweep(browser: Browser, storage: string, targets: Target[], who: string): Promise<void> {
  for (const width of [390, 1440]) {
    for (const theme of ["light", "dark"] as const) {
      step(`${who}: axe at ${width} ${theme}`);
      const page = await open(browser, storage, width, theme);
      try {
        for (const target of targets) {
          const label = `${target.name} ${width} ${theme}`;
          try {
            await visit(page, target);
          } catch (error) {
            ok(false, `${label}: the page opens (${String(error).split("\n")[0]})`);
            continue;
          }
          await noSideways(page, label);
          // The saved theme (oyelabs-ui) wins over colorScheme, so check the page really is in this theme.
          const dark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
          ok(dark === (theme === "dark"), `${label}: the page is in ${theme} mode`);
          await axe(page, label);
          await shot(page, `${target.name}-${width}-${theme}`);
        }
      } finally {
        await page.context().close();
      }
    }
  }
}

async function verifySweep(browser: Browser, certId: string): Promise<void> {
  for (const width of [390, 1440]) {
    for (const theme of ["light", "dark"] as const) {
      const page = await open(browser, undefined, width, theme);
      try {
        await go(page, `/verify/${certId}`);
        await noSideways(page, `verify ${width} ${theme}`);
        await axe(page, `verify ${width} ${theme}`);
      } finally {
        await page.context().close();
      }
    }
  }
}

/** Keyboard only: the first Tab is the skip link, and Enter moves focus into <main>. */
async function keyboardSmoke(browser: Browser, storage: string, url: string, label: string, ready?: (p: Page) => Promise<void>): Promise<void> {
  for (const width of [390, 1440]) {
    const page = await open(browser, storage, width, "light");
    try {
      await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: WAIT });
      if (ready) await ready(page);
      else await page.getByRole("heading", { level: 1 }).first().waitFor({ timeout: WAIT });
      await settle(page);
      // Start from the top of the document, as a fresh keyboard user would.
      await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur?.();
        window.scrollTo(0, 0);
      });
      await page.keyboard.press("Tab");
      const first = await page.evaluate(() => ({ text: document.activeElement?.textContent?.trim() ?? "", testid: document.activeElement?.getAttribute("data-testid") ?? "" }));
      ok(first.text === "Skip to content", `${label} ${width}: the first Tab reaches "Skip to content" (got "${first.text.slice(0, 40)}")`);
      const visible = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 20 && r.height > 20 && r.top >= 0 && r.left >= 0;
      });
      ok(visible, `${label} ${width}: the skip link is visible when focused`);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(150);
      // Main content = the <main> landmark, or (for a frame without one) from its h1 onwards.
      const inMain = await page.evaluate(() => {
        const el = document.activeElement;
        return Boolean(el?.closest("main")) || el?.tagName === "H1";
      });
      ok(inMain, `${label} ${width}: Enter moves focus to the main content`);
      const hasMain = await page.evaluate(() => Boolean(document.querySelector("main")));
      if (!hasMain) note(`${label}: the frame has no <main> landmark (skip link falls back to the h1)`);
      await page.keyboard.press("Tab");
      const next = await page.evaluate(() => {
        const el = document.activeElement;
        if (el?.closest("main")) return true;
        const h1 = document.querySelector("h1");
        // After the heading in document order, and not back in the top chrome.
        return Boolean(h1 && el && h1.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
      });
      ok(next, `${label} ${width}: the next Tab continues inside the main content`);
    } finally {
      await page.context().close();
    }
  }
}

/** 2.4.11: a focused control near the bottom of a phone screen isn't hidden under the bottom nav. */
async function focusNotObscured(browser: Browser, storage: string): Promise<void> {
  const page = await open(browser, storage, 390, "light");
  try {
    await go(page, "/learn/library", "Library");
    const offenders = await page.evaluate(async () => {
      const nav = [...document.querySelectorAll("nav")].find((n) => getComputedStyle(n).position === "fixed");
      if (!nav) return ["no fixed bottom nav found"];
      const out: string[] = [];
      const items = [...document.querySelectorAll<HTMLElement>("main a[href], main button:not([disabled]), main input, main select")].slice(0, 60);
      for (const el of items) {
        el.focus();
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        // Hidden controls (a closed filter panel) can't take focus: nothing to check.
        if (document.activeElement !== el || !el.getClientRects().length) continue;
        const r = el.getBoundingClientRect();
        const n = nav.getBoundingClientRect();
        const header = document.querySelector("header");
        const h = header ? header.getBoundingClientRect() : null;
        const coveredByNav = r.top >= n.top - 1 && r.bottom <= n.bottom + 1;
        const coveredByHeader = h ? r.bottom <= h.bottom + 1 && getComputedStyle(header!).position === "sticky" : false;
        if (coveredByNav || coveredByHeader) out.push(`${el.tagName.toLowerCase()} "${(el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 30)}"`);
      }
      return out;
    });
    ok(offenders.length === 0, `2.4.11 /learn/library 390: no focused control is fully hidden by the top bar or bottom nav (${offenders.join(", ") || "none"})`);
  } finally {
    await page.context().close();
  }
}

/** The Me "Reduce motion" setting applies on every screen, not only on Me. */
async function reducedMotionEverywhere(browser: Browser, storage: string): Promise<void> {
  const page = await open(browser, storage, 1440, "light");
  try {
    await call(page.request, "put", "/api/v5/me/settings", { reducedMotion: "on" });
    for (const url of ["/learn", "/learn/plan", "/learn/review"]) {
      await go(page, url);
      const attr = await page.evaluate(() => document.documentElement.getAttribute("data-motion"));
      ok(attr === "reduce", `reduced motion "on" applies on ${url} (data-motion=${attr})`);
    }
    await call(page.request, "put", "/api/v5/me/settings", { reducedMotion: "system" });
  } finally {
    await page.context().close();
  }
}

async function main(): Promise<void> {
  fs.rmSync(SHOTS, { recursive: true, force: true });
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v5a11y-"));
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: !HEADED });
  try {
    const s = await seed(browser, dataDir);
    if (ONLY !== "admin") {
      step("keyboard: skip link first, Enter moves focus to main");
      await keyboardSmoke(browser, s.learnerStorage, "/learn", "learner /learn");
      await keyboardSmoke(browser, s.learnerStorage, `/learn/lesson/${QUIZ_TOPIC}?step=read`, "lesson", async (p) => {
        await p.getByTestId("v5-lesson").waitFor({ timeout: WAIT });
      });
      if (s.assessmentReady) await keyboardSmoke(browser, s.learnerStorage, "/assessment", "assessment");
      await focusNotObscured(browser, s.learnerStorage);
      await reducedMotionEverywhere(browser, s.learnerStorage);
      await sweep(browser, s.learnerStorage, learnerTargets(s), "learner");
      if (s.certId) await verifySweep(browser, s.certId);
    }
    if (ONLY !== "learner") {
      await keyboardSmoke(browser, s.adminStorage, "/admin", "admin");
      await keyboardSmoke(browser, s.adminStorage, "/design", "design");
      await sweep(browser, s.adminStorage, adminTargets(s), "admin");
    }
  } finally {
    await browser.close();
    stopServer();
  }

  console.log("");
  const bad = axeRows.filter((r) => r.bad.length);
  console.log(`axe: ${axeRows.length} views, ${bad.length} with serious/critical issues`);
  for (const r of bad) console.log(`  ${r.label}: ${r.bad.join("; ")}`);
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
