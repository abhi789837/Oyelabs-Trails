/**
 * Oyelearn v5 Phase 6: motivation, done respectfully.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh motivation)      # a private build (never the shared dist/)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/v5-motivation.ts
 *   bash scripts/e2e/snapshot-build.sh --remove motivation
 *
 * 1. Seeds through the API: the superadmin, two learners on the v5 design with plans of quiz
 *    lessons, video lock in warn mode, and a weekly goal high enough that the week isn't met yet.
 * 2. First-run welcome: shows on Today, 3 steps, closes; doesn't come back on reload; replays from
 *    `/learn?welcome=1` and Escape closes it (the query goes away).
 * 3. A lesson finished (through the lesson API) shows "+N XP" and a celebration on the next
 *    navigation, which Skip closes. With celebrations off: the XP chip, no celebration. With
 *    reduced motion on: a static badge, no confetti canvas.
 * 4. The bell: an admin reminder shows as a new notification and opening the list clears the count.
 *    A learner reminder goes out once ("run now" twice: 1, then 0).
 * 5. Team board: off by default; the super admin turns it on from Reports; an opted-in learner sees
 *    the board in "Your progress" (first names + XP, "(you)"). The weekly goal changes there too.
 * 6. Weekly recap: "run now" queues it and the sender delivers it to a local test SMTP server
 *    (smtp-server, started here): HTML + text, the learner's address from MAIL_DOMAIN.
 * 7. Weekly summit: with a half-hour goal the week is met and Today celebrates it once.
 * 8. axe (WCAG 2.2 AA tags) at 390 and 1440, light and dark (Today with the top bar, the progress
 *    panel and the bell list, the welcome): 0 serious/critical. No sideways scroll.
 *    Screenshots go to %TEMP%/claude/e2e-shots-v5-motivation.
 *
 * Throwaway DATA_DIR, port 8826 (E2E_PORT), SMTP on 8827 (E2E_SMTP_PORT), the mock AI.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import { chromium, type APIRequestContext, type Browser, type BrowserContext, type Page } from "playwright";
import { SMTPServer } from "smtp-server";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.E2E_PORT ?? 8826);
const SMTP_PORT = Number(process.env.E2E_SMTP_PORT ?? 8827);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const SHOTS = path.join(os.tmpdir(), "claude", "e2e-shots-v5-motivation");
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

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true, timeout: WAIT }).catch((e: Error) => note(`screenshot ${name} failed: ${e.message.split("\n")[0]}`));
}

async function axe(page: Page, label: string): Promise<void> {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const bad = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  ok(
    bad.length === 0,
    `axe ${label}: ${result.violations.length} violations, ${bad.length} serious/critical${bad.length ? ` (${bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`).join("; ")})` : ""}`,
  );
}

// ---------------------------------------------------------------------------
// A local SMTP server that keeps what it receives
// ---------------------------------------------------------------------------

interface Received {
  from: string;
  to: string[];
  raw: string;
}
const inbox: Received[] = [];
const smtp = new SMTPServer({
  authOptional: true,
  disabledCommands: ["STARTTLS", "AUTH"],
  logger: false,
  onData(stream, session, callback) {
    const chunks: Buffer[] = [];
    stream.on("data", (c: Buffer) => chunks.push(c));
    stream.on("end", () => {
      inbox.push({ from: session.envelope.mailFrom ? session.envelope.mailFrom.address : "", to: session.envelope.rcptTo.map((r) => r.address), raw: Buffer.concat(chunks).toString("utf8") });
      callback();
    });
  },
});

// ---------------------------------------------------------------------------
// The app server
// ---------------------------------------------------------------------------

let server: ChildProcess | null = null;

function stopServer(): void {
  smtp.close(() => undefined);
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
      SMTP_URL: `smtp://127.0.0.1:${SMTP_PORT}`,
      MAIL_FROM: "Oyelearn <learning@oyelabs.test>",
      MAIL_DOMAIN: "oyelabs.test",
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
type Storage = Awaited<ReturnType<BrowserContext["storageState"]>>;

async function newContext(browser: Browser, storage: Storage, width: number, theme: Theme, extra: { reducedMotion?: "reduce" | "no-preference" } = {}): Promise<BrowserContext> {
  const ctx = await browser.newContext({ storageState: storage, viewport: { width, height: width < 768 ? 844 : 900 }, colorScheme: theme, ...extra });
  await ctx.addInitScript((t) => {
    window.localStorage.setItem("oyelabs-ui", JSON.stringify({ state: { theme: t, sidebarCollapsed: false }, version: 0 }));
  }, theme);
  return ctx;
}

async function openToday(page: Page, query = ""): Promise<void> {
  await page.goto(`${BASE}/learn${query}`, { waitUntil: "networkidle", timeout: WAIT });
  // CSS locators, not roles: while the welcome is open the page behind it is aria-hidden.
  await page.locator("h1", { hasText: "Today" }).waitFor({ timeout: WAIT });
  await page.getByTestId("v5-topbar-motivation").waitFor({ timeout: WAIT });
}

/** Clicks a main nav link (client-side navigation) and waits for the URL. */
async function nav(page: Page, name: string, pathname: string): Promise<void> {
  await page.getByRole("navigation", { name: "Main" }).filter({ visible: true }).first().getByRole("link", { name, exact: true }).click({ timeout: WAIT });
  await page.waitForURL((u) => u.pathname === pathname, { timeout: WAIT });
}

interface Quiz {
  id: string;
  prompt: string;
  options: string[];
  correctIndices?: number[];
  correctIndex?: number;
}
interface ServedTopic {
  id: string;
  quiz?: Quiz[];
  codeChallenge?: unknown;
}

async function main(): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  await new Promise<void>((resolve, reject) => {
    smtp.once("error", reject);
    smtp.listen(SMTP_PORT, "127.0.0.1", () => resolve());
  });
  console.log(`smtp:       127.0.0.1:${SMTP_PORT}`);
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v5motivation-"));
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: !HEADED });

  try {
    // -----------------------------------------------------------------------
    step("1. seed through the API");
    const adminCtx = await browser.newContext();
    const admin = adminCtx.request;
    await sendJson(admin, "post", "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
    await sendJson(admin, "post", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });
    await sendJson(admin, "put", "/api/me/ui", { v5: true });
    await sendJson(admin, "put", "/api/admin/video-settings", { lockMode: "warn" });

    const module = await getJson<{ topics: ServedTopic[] }>(admin, "/api/content/modules/frontend/fe-js-core");
    const quizTopics = module.topics.filter((t) => (t.quiz?.length ?? 0) > 0 && !t.codeChallenge).map((t) => t.id);
    ok(quizTopics.length >= 3, `three quiz lessons to finish (${quizTopics.slice(0, 3).join(", ")})`);
    const keyed = new Map(module.topics.map((t) => [t.id, t.quiz ?? []]));

    async function makeLearner(username: string, displayName: string) {
      const created = await sendJson<{ user: { id: string }; temporaryPassword: string }>(admin, "post", "/api/admin/users", {
        username,
        displayName,
        profile: { roleTitle: "Frontend Engineer", yearsExperience: 1, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
        issueAssessment: false,
      });
      await sendJson(admin, "put", `/api/admin/users/${created.user.id}/plan`, { topicIds: quizTopics.slice(0, 4) });
      const ctx = await browser.newContext();
      await sendJson(ctx.request, "post", "/api/auth/login", { username, password: created.temporaryPassword });
      await sendJson(ctx.request, "post", "/api/auth/change-password", { currentPassword: created.temporaryPassword, newPassword: LEARNER_NEW });
      await sendJson(ctx.request, "put", "/api/me/ui", { v5: true });
      return { id: created.user.id, ctx, request: ctx.request };
    }
    const tara = await makeLearner("tara.motivation", "Tara Motivation");
    const rahul = await makeLearner("rahul.board", "Rahul Board");
    // A goal the seeded week won't reach, so the weekly summit doesn't fire until step 7.
    await sendJson(tara.request, "put", "/api/v5/motivation/prefs", { weeklyGoalHours: 10 });
    const storage = await tara.ctx.storageState();

    /** Finishes one quiz lesson through the lesson API, the way the player does. */
    async function finishLesson(request: APIRequestContext, topicId: string): Promise<boolean> {
      await sendJson(request, "put", `/api/v5/lessons/${encodeURIComponent(topicId)}/state`, { stepDone: { watch: true, read: true } });
      const served = (await getJson<{ topics: ServedTopic[] }>(request, "/api/content/modules/frontend/fe-js-core")).topics.find((t) => t.id === topicId)?.quiz ?? [];
      const key = keyed.get(topicId) ?? [];
      const answers = Object.fromEntries(
        served.map((q) => {
          const k = key.find((x) => x.id === q.id) ?? key.find((x) => x.prompt === q.prompt);
          return [q.id, k?.correctIndices ?? (k?.correctIndex !== undefined ? [k.correctIndex] : [0])];
        }),
      );
      const attempt = await sendJson<{ passed: boolean }>(request, "post", `/api/topics/${encodeURIComponent(topicId)}/attempt`, { kind: "quiz", answers });
      const done = await sendJson<{ justCompleted: boolean }>(request, "put", `/api/v5/lessons/${encodeURIComponent(topicId)}/state`, { stepDone: { check: true } });
      return attempt.passed && done.justCompleted;
    }

    // -----------------------------------------------------------------------
    step("2. first-run welcome: once, skippable, replayable");
    {
      const ctx = await newContext(browser, storage, 1440, "light");
      const page = await ctx.newPage();
      await openToday(page);
      const dialog = page.getByRole("dialog");
      ok(await dialog.getByRole("heading", { name: "Here's your plan" }).waitFor({ timeout: WAIT }).then(() => true, () => false), "the welcome opens on Today");
      await axe(page, "welcome 1440 light");
      await shot(page, "welcome-1440-light");
      await page.getByTestId("welcome-next").click();
      ok(await dialog.getByRole("heading", { name: "Here's how lessons work" }).isVisible(), "step 2: how lessons work");
      await page.getByTestId("welcome-next").click();
      ok(await dialog.getByRole("heading", { name: "Here's Ask Oye" }).isVisible(), "step 3: Ask Oye");
      await page.getByRole("button", { name: "Start learning" }).click();
      ok(await dialog.waitFor({ state: "hidden", timeout: WAIT }).then(() => true, () => false), "Start learning closes it");
      const prefs = await poll("welcomeDoneAt saved", WAIT, async () => {
        const s = await getJson<{ prefs: { welcomeDoneAt: number | null } }>(tara.request, "/api/v5/motivation");
        return s.prefs.welcomeDoneAt ? s.prefs : null;
      }).catch(() => null);
      ok(prefs?.welcomeDoneAt, "welcomeDoneAt is saved");

      await openToday(page);
      await page.waitForTimeout(1200);
      ok((await page.getByRole("dialog").count()) === 0, "it doesn't come back on reload");

      await openToday(page, "?welcome=1");
      ok(await dialog.getByRole("heading", { name: "Here's your plan" }).waitFor({ timeout: WAIT }).then(() => true, () => false), "/learn?welcome=1 replays it");
      await page.keyboard.press("Escape");
      ok(await dialog.waitFor({ state: "hidden", timeout: WAIT }).then(() => true, () => false), "Escape skips it");
      await page.waitForURL((u) => !u.searchParams.has("welcome"), { timeout: WAIT }).catch(() => undefined);
      ok(!new URL(page.url()).searchParams.has("welcome"), "the ?welcome=1 goes away");
      await ctx.close();
    }

    // -----------------------------------------------------------------------
    step("3. a finished lesson: +XP and a celebration; off; reduced motion");
    {
      const ctx = await newContext(browser, storage, 1440, "light");
      const page = await ctx.newPage();
      await openToday(page);
      await page.waitForTimeout(1700); // past the host's read throttle
      ok(await finishLesson(tara.request, quizTopics[0]), `lesson ${quizTopics[0]} finished through the API`);
      await nav(page, "My plan", "/learn/plan");
      const moment = page.getByRole("status").filter({ hasText: "Lesson done" });
      ok(await moment.first().waitFor({ timeout: WAIT }).then(() => true, () => false), "a 'Lesson done' celebration shows");
      ok(await page.getByTestId("xp-gained").isVisible().catch(() => false), `the top bar says ${await page.getByTestId("xp-gained").innerText().catch(() => "(gone)")}`);
      await shot(page, "celebration-lesson-1440");
      const t0 = Date.now();
      await moment.first().getByRole("button", { name: "Skip" }).click({ timeout: 2000 }).catch(() => note("it closed on its own before the click"));
      await moment.first().waitFor({ state: "hidden", timeout: 3000 }).catch(() => undefined);
      ok((await moment.count()) === 0 && Date.now() - t0 < 2500, `Skip closes it (${Date.now() - t0} ms)`);
      const xpText = await page.getByTestId("v5-xp-button").innerText();
      ok(/\d+ XP/.test(xpText) && !/^0 XP/.test(xpText.trim()), `XP in the top bar (${xpText.trim()})`);
      await ctx.close();
    }
    {
      await sendJson(tara.request, "put", "/api/v5/me/settings", { celebrations: false });
      const ctx = await newContext(browser, storage, 1440, "light");
      const page = await ctx.newPage();
      await openToday(page);
      await page.waitForTimeout(1700);
      ok(await finishLesson(tara.request, quizTopics[1]), `lesson ${quizTopics[1]} finished`);
      await nav(page, "My plan", "/learn/plan");
      ok(await page.getByTestId("xp-gained").waitFor({ timeout: WAIT }).then(() => true, () => false), "celebrations off: the XP chip still shows");
      await page.waitForTimeout(800);
      ok((await page.getByRole("status").filter({ hasText: "Lesson done" }).count()) === 0, "celebrations off: no celebration");
      await ctx.close();
    }
    {
      await sendJson(tara.request, "put", "/api/v5/me/settings", { celebrations: true, reducedMotion: "on" });
      const ctx = await newContext(browser, storage, 390, "light");
      const page = await ctx.newPage();
      await openToday(page);
      await page.waitForTimeout(1700);
      ok(await finishLesson(tara.request, quizTopics[2]), `lesson ${quizTopics[2]} finished`);
      await nav(page, "My plan", "/learn/plan");
      const badge = page.getByTestId("celebration-static");
      ok(await badge.waitFor({ timeout: WAIT }).then(() => true, () => false), "reduced motion: a static badge");
      ok((await page.locator("canvas").count()) === 0, "reduced motion: no confetti canvas");
      await shot(page, "celebration-static-390");
      await page.keyboard.press("Escape");
      ok(await badge.waitFor({ state: "hidden", timeout: 1500 }).then(() => true, () => false), "Escape closes the badge");
      await ctx.close();
      await sendJson(tara.request, "put", "/api/v5/me/settings", { reducedMotion: "system" });
    }

    // -----------------------------------------------------------------------
    step("4. the bell, and reminders at most once a day");
    {
      await sendJson(admin, "post", "/api/admin/v5/people/nudge", { userIds: [tara.id] });
      const ctx = await newContext(browser, storage, 1440, "light");
      const page = await ctx.newPage();
      await openToday(page);
      const bell = page.getByTestId("v5-bell");
      const label = await bell.getAttribute("aria-label");
      ok(/new/.test(label ?? ""), `the bell shows new notifications (${label})`);
      await bell.click();
      const list = page.getByTestId("v5-notification-list");
      ok(await list.getByText("Your plan is waiting for you").waitFor({ timeout: WAIT }).then(() => true, () => false), "the admin's reminder is in the list");
      await axe(page, "bell open 1440 light");
      await shot(page, "bell-1440-light");
      await page.keyboard.press("Escape");
      await poll("the count to clear", WAIT, async () => ((await bell.getAttribute("aria-label")) === "Notifications" ? true : null)).catch(() => undefined);
      ok((await bell.getAttribute("aria-label")) === "Notifications", "opening the list clears the count");
      await ctx.close();

      // A learner reminder at "now" (UTC) for Rahul, who hasn't learned today.
      const nowUtc = new Date();
      const minutes = Math.max(0, nowUtc.getUTCHours() * 60 + nowUtc.getUTCMinutes() - 1);
      const hhmm = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
      await sendJson(rahul.request, "put", "/api/v5/me/settings", { reminderTime: hhmm });
      await sendJson(rahul.request, "put", "/api/v5/motivation/prefs", { timeZone: "UTC" });
      const first = await sendJson<{ reminders: number }>(admin, "post", "/api/admin/motivation/run", {});
      const second = await sendJson<{ reminders: number }>(admin, "post", "/api/admin/motivation/run", {});
      ok(first.reminders === 1 && second.reminders === 0, `reminders: first run ${first.reminders}, second run ${second.reminders}`);
      const rahulNotes = await getJson<{ notifications: { kind: string; title: string }[] }>(rahul.request, "/api/me/notifications");
      ok(rahulNotes.notifications.filter((n) => n.kind === "v5.reminder").length === 1, `Rahul has one reminder ("${rahulNotes.notifications.find((n) => n.kind === "v5.reminder")?.title}")`);
    }

    // -----------------------------------------------------------------------
    step("5. team board: off by default, turned on by the super admin, opt-in");
    {
      const off = await getJson<{ enabled: boolean }>(tara.request, "/api/v5/leaderboard");
      ok(off.enabled === false, "no team board by default");
      await sendJson(rahul.request, "put", "/api/v5/motivation/prefs", { leaderboardOptIn: true });
      await finishLesson(rahul.request, quizTopics[0]);

      const adminStorage = await adminCtx.storageState();
      const actx = await newContext(browser, adminStorage, 1440, "light");
      const apage = await actx.newPage();
      await apage.goto(`${BASE}/admin/reports`, { waitUntil: "networkidle", timeout: WAIT });
      const toggle = apage.getByTestId("leaderboard-toggle");
      await toggle.waitFor({ timeout: WAIT });
      await poll("the toggle to read its state", WAIT, async () => ((await toggle.isEnabled()) ? true : null));
      ok((await toggle.innerText()).includes("off"), "Reports shows 'Team boards: off'");
      await toggle.click();
      await poll("the board to be on", WAIT, async () => ((await toggle.innerText()).includes("on") ? true : null)).catch(() => undefined);
      ok((await getJson<{ leaderboards: boolean }>(admin, "/api/admin/motivation")).leaderboards, "the super admin turned team boards on");
      await shot(apage, "admin-reports-team-boards");
      await actx.close();

      const ctx = await newContext(browser, storage, 1440, "light");
      const page = await ctx.newPage();
      await openToday(page);
      await page.getByTestId("v5-xp-button").click();
      const sheet = page.getByRole("dialog", { name: "Your progress" });
      await sheet.waitFor({ timeout: WAIT });
      const board = sheet.getByTestId("team-board");
      await board.waitFor({ timeout: WAIT });
      ok(await board.getByText("Rahul").isVisible(), "the board shows Rahul (opted in), by first name");
      ok((await board.getByText("(you)").count()) === 0, "Tara isn't on it before joining");
      await board.getByTestId("board-opt-in").click();
      ok(await board.getByText("(you)").waitFor({ timeout: WAIT }).then(() => true, () => false), "after joining, Tara is on the board");
      ok(!/#\s?\d|\b1st\b|\brank/i.test(await board.innerText()), "no rank numbers");
      await sheet.getByTestId("weekly-goal-select").selectOption("8");
      const saved = await poll("the goal to save", WAIT, async () => {
        const s = await getJson<{ prefs: { weeklyGoalHours: number | null } }>(tara.request, "/api/v5/motivation");
        return s.prefs.weeklyGoalHours === 8 ? true : null;
      }).catch(() => false);
      ok(saved, "the weekly goal is set to 8 hours from the panel");
      await page.waitForTimeout(500);
      await axe(page, "progress panel 1440 light");
      await shot(page, "progress-panel-1440-light");
      await ctx.close();
    }

    // -----------------------------------------------------------------------
    step("6. weekly recap: queued and delivered over SMTP");
    {
      const before = inbox.length;
      const run = await sendJson<{ recaps: number; email: { sent: number; failed: number; skipped: number } }>(admin, "post", "/api/admin/motivation/run", { recaps: true });
      ok(run.recaps >= 2, `recaps queued for both learners (${run.recaps})`);
      ok(run.email.sent >= 2 && run.email.failed === 0, `the sender delivered them (sent ${run.email.sent}, failed ${run.email.failed}, skipped ${run.email.skipped})`);
      const mail = await poll("the recap at the SMTP server", WAIT, async () => inbox.slice(before).find((m) => m.to.includes("tara.motivation@oyelabs.test") && /week/i.test(m.raw)) ?? null).catch(() => null);
      ok(mail, "Tara's recap arrived at tara.motivation@oyelabs.test");
      if (mail) {
        ok(/multipart\/alternative/i.test(mail.raw) && /text\/html/i.test(mail.raw) && /text\/plain/i.test(mail.raw), "it has an HTML and a text part");
        ok(mail.from === "learning@oyelabs.test", `from ${mail.from}`);
        ok(/Open Today/.test(mail.raw), "it links to Today");
        // Rebrand P6: the shared layout. Decode the HTML part (quoted-printable or base64) before looking.
        const htmlPart = /Content-Type: text\/html[^]*?\r?\n\r?\n([^]*?)\r?\n--/i.exec(mail.raw);
        const base64 = htmlPart ? /Content-Type: text\/html[^]*?Content-Transfer-Encoding: base64/i.test(mail.raw.slice(htmlPart.index, htmlPart.index + 300)) : false;
        const body = htmlPart?.[1] ?? mail.raw;
        const utf8 = base64
          ? Buffer.from(body.replace(/\s+/g, ""), "base64").toString("utf8")
          : Buffer.from(body.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_m, hex: string) => String.fromCharCode(parseInt(hex, 16))), "latin1").toString("utf8");
        ok(utf8.includes(`${BASE}/brand/email/email-header-light@600w.png`), "the HTML has the brand header image, absolute on the public origin");
        ok(utf8.includes(`${BASE}/brand/email/email-header-dark@600w.png`) && /prefers-color-scheme:\s*dark/.test(utf8), "and its dark variant for dark-mode clients");
        ok(utf8.includes(`${BASE}/brand/email/oyelearn-mark-light@64w.png`) && utf8.includes("Oyelearn · by Oyelabs"), "the footer has the mark and 'Oyelearn · by Oyelabs'");
        ok(/<html lang="en"/.test(utf8) && (utf8.match(/<img\b[^>]*\balt="/g) ?? []).length === (utf8.match(/<img\b/g) ?? []).length, "lang set and every image has alt text");
        const header = await fetch(`${BASE}/brand/email/email-header-light@600w.png`);
        ok(header.status === 200 && header.headers.get("content-type") === "image/png" && header.headers.get("cross-origin-resource-policy") === "cross-origin", `the header image is served (${header.status}, ${header.headers.get("content-type")}, CORP ${header.headers.get("cross-origin-resource-policy")})`);
      }
      const again = await sendJson<{ recaps: number }>(admin, "post", "/api/admin/motivation/run", { recaps: true });
      ok(again.recaps === 0, `a second run the same week queues none (${again.recaps})`);
      const settings = await getJson<{ email: { configured: boolean; sent: number } }>(admin, "/api/admin/motivation");
      ok(settings.email.configured && settings.email.sent >= 2, `admin settings: email set up, ${settings.email.sent} sent`);
    }

    // -----------------------------------------------------------------------
    step("7. weekly summit on Today, once");
    {
      // Half an hour: the three lessons finished above meet it.
      await sendJson(tara.request, "put", "/api/v5/motivation/prefs", { weeklyGoalHours: 0.5 });
      const ctx = await newContext(browser, storage, 1440, "light");
      const page = await ctx.newPage();
      await openToday(page);
      const summit = page.getByRole("status").filter({ hasText: "Weekly goal reached" });
      ok(await summit.first().waitFor({ timeout: WAIT }).then(() => true, () => false), "the weekly summit celebration shows when the week is met");
      await shot(page, "celebration-summit-1440");
      await page.keyboard.press("Escape");
      await summit.first().waitFor({ state: "hidden", timeout: 3000 }).catch(() => undefined);
      await openToday(page);
      await page.waitForTimeout(1500);
      ok((await summit.count()) === 0, "it doesn't repeat on the next visit");
      await ctx.close();
      await sendJson(tara.request, "put", "/api/v5/motivation/prefs", { weeklyGoalHours: 10 });
    }

    // -----------------------------------------------------------------------
    step("8. axe, layout and screenshots: 390 and 1440, light and dark");
    for (const width of [390, 1440]) {
      for (const theme of ["light", "dark"] as const) {
        const c = await newContext(browser, storage, width, theme);
        const p = await c.newPage();
        await openToday(p);
        await p.waitForTimeout(700);
        const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        ok(overflow <= 1, `${width} ${theme}: no horizontal scroll (${overflow}px)`);
        const box = await p.getByTestId("v5-topbar-motivation").boundingBox();
        ok(box && box.y < 56 && box.x + box.width <= width, `${width} ${theme}: the XP and bell sit in the top bar`);
        await axe(p, `today ${width} ${theme}`);
        await shot(p, `today-${width}-${theme}`);
        await p.getByTestId("v5-xp-button").click();
        await p.getByRole("dialog", { name: "Your progress" }).getByTestId("team-board").waitFor({ timeout: WAIT });
        await p.waitForTimeout(500); // the sheet's slide-in settles before the screenshot
        await axe(p, `progress panel ${width} ${theme}`);
        await shot(p, `progress-${width}-${theme}`);
        await p.keyboard.press("Escape");
        await p.getByRole("dialog", { name: "Your progress" }).waitFor({ state: "hidden", timeout: WAIT });
        await p.getByTestId("v5-bell").click();
        await p.getByRole("dialog", { name: "Notifications" }).waitFor({ timeout: WAIT });
        await axe(p, `bell ${width} ${theme}`);
        await p.keyboard.press("Escape");
        await openToday(p, "?welcome=1");
        await p.getByRole("dialog").getByRole("heading", { name: "Here's your plan" }).waitFor({ timeout: WAIT });
        await axe(p, `welcome ${width} ${theme}`);
        await shot(p, `welcome-${width}-${theme}`);
        await c.close();
      }
    }
    console.log(`  screenshots: ${SHOTS}`);

    await adminCtx.close();
    await tara.ctx.close();
    await rahul.ctx.close();
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
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
