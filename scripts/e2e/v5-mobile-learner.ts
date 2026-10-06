/**
 * Oyelearn v5 Phase 8 (learner): the learner screens on a phone, end to end.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh p8learner)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/v5-mobile-learner.ts
 *   bash scripts/e2e/snapshot-build.sh --remove p8learner
 *
 * Seeds through the API (superadmin → a v5 learner with a three-topic plan, the welcome marked
 * done, one wrong answer on the Closures test so Review has cards, a note, and the coding lesson's
 * Watch and Read steps done), then checks in a real browser:
 * - Coding Do step at 390: Task / Code / Checks tabs, the "Best on a bigger screen" hint, "Send to
 *   my email" (sent, then the once-an-hour limit), and the "Email isn't set up yet" fallback with
 *   "Copy the link".
 * - The lesson at 390: the step header stays on screen while scrolling, Next sits in the thumb zone
 *   above the bottom nav, and Ask Oye opens as a bottom sheet.
 * - Review: a rating moves to the next card before the server answers, and a failed rating comes
 *   back with a plain error.
 * - Loading and error states: each screen's skeleton, and "Try again" after a failed load.
 * - Every screen (Today, My plan, Library, course page, Review + session, Me + notes + settings,
 *   lesson Watch / Read / Do / Check) at 390 light, 390 dark and 1440 light: axe (WCAG 2.2 AA tags)
 *   0 serious/critical, no sideways scroll; at 390 also no target under 24 px, no text under 12 px,
 *   and the bottom nav never covers the end of the page.
 * Screenshots: %TEMP%/claude/e2e-shots-v5-mobile. Port 8830, throwaway DATA_DIR, mock AI.
 * Helpers are copied from v5-learner-pages.ts / v5-lesson.ts on purpose (no imports across scripts).
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import { chromium, type APIRequestContext, type Browser, type Locator, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.E2E_PORT ?? 8830);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER = "learner.p8";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const SHOTS = path.join(os.tmpdir(), "claude", "e2e-shots-v5-mobile");
const WAIT = 20_000;
const HEADED = process.env.E2E_HEADED === "1";
const CODE_TOPIC = "js-call-stack";
const QUIZ_TOPIC = "js-closures";
const PLAN = [CODE_TOPIC, QUIZ_TOPIC, "js-hoisting"];
const AUDIT = process.env.E2E_AUDIT === "1";
/** `E2E_ONLY=sweep,review` runs only those parts (debugging); all of them by default. */
const ONLY = new Set((process.env.E2E_ONLY ?? "").split(",").map((s) => s.trim()).filter(Boolean));
const runs = (part: string) => ONLY.size === 0 || ONLY.has(part);

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

async function poll<T>(what: string, timeoutMs: number, fn: () => Promise<T | null | undefined>, everyMs = 250): Promise<T> {
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

/** Waits for the locator to be visible (`isVisible()` doesn't wait, whatever its timeout says). */
async function seen(locator: Locator, timeoutMs = WAIT): Promise<boolean> {
  return locator
    .first()
    .waitFor({ state: "visible", timeout: timeoutMs })
    .then(() => true)
    .catch(() => false);
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
      // Email "set up" (nothing listens there, so the sender marks the row failed later; the
      // learner-facing request only queues it). The not-set-up path is covered by a stubbed answer.
      SMTP_URL: "smtp://127.0.0.1:2599",
      MAIL_FROM: "Oyelearn <learn@example.test>",
      MAIL_DOMAIN: "example.test",
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
  options: string[];
  correctIndex: number;
  correctIndices?: number[];
}

function closuresQuiz(): QuizQ[] {
  const mod = JSON.parse(fs.readFileSync(path.join(APP, "server", "content", "frontend", "fe-js-core.json"), "utf8")) as { topics: { id: string; quiz?: QuizQ[] }[] };
  return mod.topics.find((t) => t.id === QUIZ_TOPIC)!.quiz!;
}

async function seed(browser: Browser, dataDir: string): Promise<string> {
  step("seed: superadmin, a v5 learner with a plan, the welcome done, review cards, a note, steps done");
  const adminCtx = await browser.newContext();
  await call(adminCtx.request, "post", "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
  await call(adminCtx.request, "post", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });
  const created = await call<{ user: { id: string }; temporaryPassword: string }>(adminCtx.request, "post", "/api/admin/users", {
    username: LEARNER,
    displayName: "Asha Learner",
    profile: { roleTitle: "Frontend Engineer", yearsExperience: 1, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
    issueAssessment: false,
  });
  await call(adminCtx.request, "put", `/api/admin/users/${created.user.id}/plan`, { topicIds: PLAN });
  await call(adminCtx.request, "put", "/api/admin/video-settings", { lockMode: "warn" });
  await adminCtx.close();

  const ctx = await browser.newContext();
  const r = ctx.request;
  await call(r, "post", "/api/auth/login", { username: LEARNER, password: created.temporaryPassword });
  await call(r, "post", "/api/auth/change-password", { currentPassword: created.temporaryPassword, newPassword: LEARNER_NEW });
  await call(r, "put", "/api/me/ui", { v5: true });
  // The P6 first-run welcome would cover Today; v5-motivation.ts tests it.
  await call(r, "put", "/api/v5/motivation/prefs", { welcomeDone: true });

  const quiz = closuresQuiz();
  const answers: Record<string, number[]> = {};
  for (const q of quiz) answers[q.id] = q.correctIndices && q.correctIndices.length > 1 ? q.correctIndices : [q.correctIndex];
  const first = quiz[0];
  const right = answers[first.id];
  answers[first.id] = [first.options.findIndex((_, i) => !right.includes(i))];
  await call(r, "post", `/api/topics/${QUIZ_TOPIC}/attempt`, { kind: "quiz", answers });

  await call(r, "post", `/api/v5/lessons/${QUIZ_TOPIC}/notes`, { body: "Closures keep the outer scope alive after the function returns." });
  for (const topicId of [CODE_TOPIC, QUIZ_TOPIC]) {
    const res = await call<{ state: { stepDone: Record<string, boolean> } }>(r, "put", `/api/v5/lessons/${topicId}/state`, { step: "read", stepDone: { watch: true, read: true } });
    ok(res.state.stepDone.watch && res.state.stepDone.read, `seed: ${topicId} Watch and Read are done`);
  }
  const summary = await call<{ dueCount: number }>(r, "get", "/api/v5/review/summary");
  ok(summary.dueCount >= 2, `seed: review cards are due (${summary.dueCount})`);

  const storage = path.join(dataDir, "learner.json");
  await ctx.storageState({ path: storage });
  await ctx.close();
  return storage;
}

// ---------------------------------------------------------------------------
// Page helpers
// ---------------------------------------------------------------------------

type Theme = "light" | "dark";

async function openAs(browser: Browser, storage: string, width: number, theme: Theme): Promise<Page> {
  const ctx = await browser.newContext({
    storageState: storage,
    viewport: { width, height: width < 768 ? 844 : 900 },
    colorScheme: theme,
    hasTouch: width < 768,
    permissions: ["clipboard-read", "clipboard-write"],
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
  await page.waitForTimeout(400);
}

async function go(page: Page, url: string, heading: string | RegExp): Promise<void> {
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: WAIT });
  await page.getByRole("heading", { level: 1, name: heading }).first().waitFor({ timeout: WAIT });
  await settle(page);
}

async function openLesson(page: Page, topicId: string, query = ""): Promise<void> {
  await page.goto(`${BASE}/learn/lesson/${topicId}${query}`, { waitUntil: "domcontentloaded", timeout: WAIT });
  await page.getByTestId("v5-lesson").waitFor({ timeout: WAIT });
  await settle(page);
}

async function axe(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    // The YouTube player is a third-party frame we can't change.
    .exclude("iframe")
    .analyze();
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

async function sidewaysScroll(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

interface PhoneAudit {
  smallTargets: string[];
  under44: number;
  tinyText: string[];
  covered: string | null;
}

/**
 * Phone checks the axe rules don't make: interactive targets (24 px minimum, 44 px preferred; inline
 * links inside running text are exempt, as in WCAG 2.5.8), visible text under 12 px, and whether the
 * fixed bottom nav covers the end of the page once it's scrolled to the bottom.
 */
async function phoneAudit(page: Page): Promise<PhoneAudit> {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(250);
  // A source string, not a function: tsx adds a `__name` helper to inner functions, which the page lacks.
  return page.evaluate(`(() => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const s = getComputedStyle(el);
      return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.01;
    };
    const name = (el) => {
      const label = el.getAttribute("aria-label") ?? (el.textContent ?? "").trim().replace(/\s+/g, " ");
      return \`\${el.tagName.toLowerCase()}\${el.id ? \`#\${el.id}\` : ""} "\${label.slice(0, 40)}"\`;
    };
    const inline = (el) => {
      if (el.tagName !== "A") return false;
      const parent = el.parentElement;
      if (!parent) return false;
      const text = (parent.textContent ?? "").trim();
      const own = (el.textContent ?? "").trim();
      return getComputedStyle(el).display === "inline" && text.length > own.length + 10;
    };
    // Only the screen's own content (main) and its dialogs; the shell around it is the app group's.
    const scope = (el) => Boolean(el.closest('main, [role="dialog"]'));
    const targets = Array.from(document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="tab"], [role="switch"], [role="button"], [tabindex]:not([tabindex="-1"])'));
    const smallTargets = [];
    let under44 = 0;
    for (const el of targets) {
      if (!scope(el) || !visible(el) || el.closest('[aria-hidden="true"]') || el.closest(".sr-only")) continue;
      if (el.matches("pre, [role='log'], textarea, [role='region']")) continue;
      if (inline(el)) continue;
      // The hit area: a control inside its <label>, or a stretched link (::after over its card).
      let hit = el;
      if (el.tagName === "INPUT" && el.closest("label")) hit = el.closest("label");
      else if (getComputedStyle(el, "::after").position === "absolute") {
        for (let p = el.parentElement; p; p = p.parentElement) {
          if (getComputedStyle(p).position !== "static") { hit = p; break; }
        }
      }
      const r = hit.getBoundingClientRect();
      if (r.width < 24 || r.height < 24) smallTargets.push(\`\${name(el)} \${Math.round(r.width)}x\${Math.round(r.height)}\`);
      else if (r.width < 44 || r.height < 44) under44 += 1;
    }
    const tinyText = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || seen.has(el) || !(n.textContent ?? "").trim()) continue;
      seen.add(el);
      if (!scope(el) || !visible(el) || el.closest('[aria-hidden="true"], .sr-only, script, style, iframe')) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 12) tinyText.push(\`\${name(el)} \${size}px\`);
    }
    let covered = null;
    const nav = Array.from(document.querySelectorAll('nav[aria-label="Main"]')).find((n) => visible(n) && getComputedStyle(n).position === "fixed");
    const main = document.querySelector("main");
    if (nav && main) {
      const navTop = nav.getBoundingClientRect().top;
      let maxBottom = 0;
      let last = null;
      for (const el of Array.from(main.querySelectorAll("*"))) {
        if (!visible(el) || el.children.length > 0 || getComputedStyle(el).position === "fixed") continue;
        if (el.closest('[aria-hidden="true"]') || el.closest('[data-sticky-bar]')) continue;
        const b = el.getBoundingClientRect().bottom;
        if (b > maxBottom) {
          maxBottom = b;
          last = el;
        }
      }
      if (last && maxBottom > navTop + 1) covered = \`\${name(last)} ends at \${Math.round(maxBottom)}, the nav starts at \${Math.round(navTop)}\`;
    }
    return { smallTargets, under44, tinyText, covered };
  })()`) as Promise<PhoneAudit>;
}

// ---------------------------------------------------------------------------
// Flows at 390
// ---------------------------------------------------------------------------

async function codeDoFlow(browser: Browser, storage: string): Promise<void> {
  step("Coding Do step at 390: tabs, the bigger-screen hint, send to my email");
  const page = await openAs(browser, storage, 390, "light");
  try {
    await openLesson(page, CODE_TOPIC, "?step=do");
    const tabs = page.getByRole("tablist", { name: "Coding practice" });
    ok(await seen(tabs, WAIT), "the Do step shows tabs on a phone");
    for (const label of ["Task", "Code", "Checks"]) ok(await tabs.getByRole("tab", { name: new RegExp(`^${label}`) }).isVisible().catch(() => false), `a "${label}" tab`);
    await tabs.getByRole("tab", { name: /^Code/ }).click();
    ok(await seen(page.getByRole("textbox").first(), WAIT), "the Code tab shows the editor");
    await tabs.getByRole("tab", { name: /^Checks/ }).click();
    ok(await seen(page.getByRole("button", { name: "Check", exact: true }), WAIT), "the Checks tab has Check");
    await tabs.getByRole("tab", { name: /^Task/ }).click();
    ok(await seen(page.getByText("Best on a bigger screen"), WAIT), 'the gentle "Best on a bigger screen" hint shows');

    const send = page.getByRole("button", { name: "Send to my email to continue on laptop" });
    // The button waits for the settings answer (emailEnabled), so wait for it.
    ok(await seen(send, WAIT), "the send-to-email button shows");
    const [response] = await Promise.all([page.waitForResponse((r) => r.url().includes("/send-to-email"), { timeout: WAIT }), send.click()]);
    const body = (await response.json().catch(() => ({}))) as { status?: string; link?: string };
    ok(body.status === "sent", `the server queues the email (${response.status()} ${body.status})`);
    ok(body.link?.endsWith(`/learn/lesson/${CODE_TOPIC}?step=do`), `with a deep link to this step (${body.link})`);
    ok(await seen(page.getByText("Sent. Open it on your laptop to keep going."), WAIT), "the learner sees the plain success line");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("tablist", { name: "Coding practice" }).waitFor({ timeout: WAIT });
    await page.getByRole("button", { name: "Send to my email to continue on laptop" }).click();
    ok(await seen(page.getByText(/already sent/i), WAIT), "a second send within the hour is refused in plain words");

    // Email not set up: the server's answer is stubbed (this server has SMTP set).
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.route("**/send-to-email", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "not_set_up", link: `${BASE}/learn/lesson/${CODE_TOPIC}?step=do` }) }),
    );
    await page.getByRole("button", { name: "Send to my email to continue on laptop" }).click();
    ok(await seen(page.getByText("Email isn't set up yet. Copy the link instead"), WAIT), "without email: the plain fallback line");
    const copy = page.getByRole("button", { name: /Copy the link/ });
    ok(await copy.isVisible().catch(() => false), "and a Copy the link button");
    await copy.click();
    ok(await seen(page.getByText("Link copied"), WAIT), "copying says so");
    const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
    ok(clip.endsWith(`/learn/lesson/${CODE_TOPIC}?step=do`), `the clipboard has the deep link (${clip})`);
    await page.unroute("**/send-to-email");

    // No mail on the server at all: no email button, just "Copy the link" (settings stubbed).
    await page.route("**/api/v5/me/settings", async (route) => {
      const real = await route.fetch();
      const json = (await real.json()) as Record<string, unknown>;
      await route.fulfill({ response: real, json: { ...json, emailEnabled: false } });
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("tablist", { name: "Coding practice" }).waitFor({ timeout: WAIT });
    ok(await seen(page.getByRole("button", { name: "Copy the link" }), WAIT), "without mail: Copy the link is offered straight away");
    ok((await page.getByRole("button", { name: "Send to my email to continue on laptop" }).count()) === 0, "and there is no email button");
    await page.unroute("**/api/v5/me/settings");
  } finally {
    await page.context().close();
  }
}

async function lessonPhoneFlow(browser: Browser, storage: string): Promise<void> {
  step("Lesson at 390: sticky step header, Next in the thumb zone, Ask Oye as a bottom sheet");
  const page = await openAs(browser, storage, 390, "light");
  try {
    await openLesson(page, CODE_TOPIC, "?step=read");
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(300);
    const nav = await page.getByRole("navigation", { name: "Lesson steps" }).boundingBox();
    ok(nav !== null && nav.y >= 0 && nav.y < 200, `the step header stays on screen while scrolling (top ${nav ? Math.round(nav.y) : "none"})`);
    const next = page.getByTestId("lesson-next-bar");
    const box = await next.boundingBox();
    const navBox = await page.locator('nav[aria-label="Main"]').last().boundingBox();
    ok(box !== null && box.y > 844 * 0.6 && box.y + box.height <= 844, `Next is in the thumb zone (y ${box ? Math.round(box.y) : "none"})`);
    ok(box !== null && navBox !== null && box.y + box.height <= navBox.y + 1, "and sits above the bottom nav");

    await page.getByRole("button", { name: "Ask Oye" }).first().click();
    const sheet = page.getByRole("dialog", { name: "Ask Oye" });
    await sheet.waitFor({ timeout: WAIT });
    await page.waitForTimeout(500);
    const s = await sheet.boundingBox();
    ok(s !== null && Math.abs(s.y + s.height - 844) <= 2 && s.width >= 380 && s.y > 40, `Ask Oye is a bottom sheet (${s ? `${Math.round(s.y)}..${Math.round(s.y + s.height)}, ${Math.round(s.width)} wide` : "none"})`);
    await shot(page, "tutor-390-light");
    await page.keyboard.press("Escape");
  } finally {
    await page.context().close();
  }
}

async function reviewOptimisticFlow(browser: Browser, storage: string): Promise<void> {
  step("Review at 390: a rating moves on at once; a failed one comes back");
  const page = await openAs(browser, storage, 390, "light");
  try {
    await go(page, "/learn/review", "Review");
    await page.getByRole("button", { name: /^Start (due now|mixed practice)$/ }).first().click();
    const card = page.getByTestId("review-card");
    await card.waitFor({ timeout: WAIT });
    const position = () => page.getByText(/^Card \d+ of \d+$/).first().textContent();
    ok((await position())?.startsWith("Card 1 of"), "the session starts on card 1");

    let release: () => void = () => undefined;
    const held = new Promise<void>((r) => (release = r));
    await page.route("**/api/v5/review/cards/*/rate", async (route) => {
      await held;
      await route.continue();
    });
    await page.getByRole("button", { name: "Show answer" }).click();
    const started = Date.now();
    await page.getByRole("button", { name: /^Good:/ }).click();
    const moved = await poll("card 2", 3000, async () => ((await position())?.startsWith("Card 2 of") ? true : null)).catch(() => false);
    ok(moved, `the next card shows before the server answers (${Date.now() - started} ms)`);
    release();
    await page.waitForTimeout(500);
    await page.unroute("**/api/v5/review/cards/*/rate");

    await page.route("**/api/v5/review/cards/*/rate", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { code: "INTERNAL", message: "boom" } }) }));
    await page.getByRole("button", { name: "Show answer" }).click();
    await page.getByRole("button", { name: /^Good:/ }).click();
    const back = await poll("roll back to card 2", WAIT, async () => ((await position())?.startsWith("Card 2 of") && (await page.getByText(/didn't save/).first().isVisible()) ? true : null)).catch(() => false);
    ok(back, "a failed rating puts the card back and says it didn't save");
    await page.unroute("**/api/v5/review/cards/*/rate");
    await shot(page, "review-rollback-390-light");
  } finally {
    await page.context().close();
  }
}

/** Each screen: its skeleton while loading, and "Try again" after a failed load. */
async function statesFlow(browser: Browser, storage: string): Promise<void> {
  step("Loading skeletons and error states with Try again");
  const page = await openAs(browser, storage, 390, "light");
  const screens: { url: string; api: string; skeleton: RegExp; heading: string | RegExp }[] = [
    { url: "/learn", api: "**/api/v5/today", skeleton: /^Loading Today$/, heading: "Today" },
    { url: "/learn/plan", api: "**/api/me/week", skeleton: /^Loading your plan$/, heading: "My plan" },
    { url: "/learn/library", api: "**/api/v5/me/library", skeleton: /^Loading the library$/, heading: "Library" },
    { url: `/learn/library/${encodeURIComponent("module:frontend:fe-js-core")}`, api: "**/api/v5/me/library/*", skeleton: /^Loading the course$/, heading: /./ },
    { url: "/learn/review", api: "**/api/v5/review/summary", skeleton: /^Loading your review deck$/, heading: "Review" },
    { url: "/learn/me", api: "**/api/v5/me/profile", skeleton: /^Loading your progress$/, heading: /./ },
    { url: `/learn/lesson/${CODE_TOPIC}`, api: `**/api/v5/lessons/${CODE_TOPIC}/state`, skeleton: /^Loading the lesson$/, heading: /./ },
  ];
  try {
    for (const s of screens) {
      let release: () => void = () => undefined;
      const held = new Promise<void>((r) => (release = r));
      await page.route(s.api, async (route) => {
        if (route.request().method() !== "GET") return route.continue();
        await held;
        await route.continue().catch(() => undefined);
      });
      await page.goto(`${BASE}${s.url}`, { waitUntil: "domcontentloaded", timeout: WAIT });
      ok(await seen(page.getByRole("status", { name: s.skeleton }).first(), 5000), `${s.url}: a skeleton shows while loading`);
      release();
      await page.unroute(s.api);

      await page.route(s.api, (route) => (route.request().method() === "GET" ? route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "UNAVAILABLE", message: "Down" } }) }) : route.continue()));
      await page.goto(`${BASE}${s.url}`, { waitUntil: "domcontentloaded", timeout: WAIT });
      const retry = page.getByRole("button", { name: "Try again" }).first();
      ok(await seen(retry), `${s.url}: a failed load offers Try again`);
      await page.unroute(s.api);
      await retry.click().catch(() => undefined);
      const recovered = await retry
        .waitFor({ state: "hidden", timeout: WAIT })
        .then(() => seen(page.getByRole("heading", { level: 1, name: s.heading })))
        .catch(() => false);
      ok(recovered, `${s.url}: Try again loads it`);
    }
  } finally {
    await page.context().close();
  }
}

// ---------------------------------------------------------------------------
// The sweep: every screen at 390 light/dark and 1440 light
// ---------------------------------------------------------------------------

interface Target {
  name: string;
  open: (page: Page) => Promise<void>;
  lesson?: boolean;
}

const TARGETS: Target[] = [
  { name: "today", open: (p) => go(p, "/learn", "Today") },
  { name: "plan", open: (p) => go(p, "/learn/plan", "My plan") },
  {
    name: "plan-list",
    open: async (p) => {
      await go(p, "/learn/plan", "My plan");
      await p.getByRole("button", { name: "List", exact: true }).click();
      await p.getByTestId("week-lanes").waitFor({ timeout: WAIT });
    },
  },
  { name: "library", open: (p) => go(p, "/learn/library", "Library") },
  {
    name: "library-filters",
    open: async (p) => {
      await go(p, "/learn/library", "Library");
      await p.getByRole("button", { name: /^Filters/ }).click();
    },
  },
  { name: "course", open: (p) => go(p, `/learn/library/${encodeURIComponent("module:frontend:fe-js-core")}`, /./) },
  { name: "review", open: (p) => go(p, "/learn/review", "Review") },
  {
    name: "review-session",
    open: async (p) => {
      await go(p, "/learn/review", "Review");
      await p.getByRole("button", { name: /^Start (mixed practice|due now)$/ }).first().click();
      await p.getByTestId("review-card").waitFor({ timeout: WAIT });
      await p.getByRole("button", { name: "Show answer" }).click();
      await p.getByTestId("review-answer").waitFor({ timeout: WAIT });
    },
  },
  { name: "me", open: (p) => go(p, "/learn/me", /./) },
  { name: "me-notes", open: (p) => go(p, "/learn/me?tab=notes", /./) },
  { name: "me-settings", open: (p) => go(p, "/learn/me?tab=settings", /./) },
  { name: "lesson-watch", lesson: true, open: (p) => openLesson(p, CODE_TOPIC, "?step=watch") },
  { name: "lesson-read", lesson: true, open: (p) => openLesson(p, CODE_TOPIC, "?step=read") },
  { name: "lesson-do", lesson: true, open: (p) => openLesson(p, CODE_TOPIC, "?step=do") },
  {
    name: "lesson-do-code",
    lesson: true,
    open: async (p) => {
      await openLesson(p, CODE_TOPIC, "?step=do");
      const tab = p.getByRole("tab", { name: /^Code/ });
      if (await tab.isVisible().catch(() => false)) await tab.click();
    },
  },
  { name: "lesson-check", lesson: true, open: (p) => openLesson(p, QUIZ_TOPIC, "?step=check") },
];

async function sweep(browser: Browser, storage: string): Promise<void> {
  for (const [width, theme] of [
    [390, "light"],
    [390, "dark"],
    [1440, "light"],
  ] as const) {
    step(`every screen at ${width} ${theme}`);
    const page = await openAs(browser, storage, width, theme);
    try {
      for (const target of TARGETS) {
        const label = `${target.name} ${width} ${theme}`;
        try {
          await target.open(page);
        } catch (error) {
          ok(false, `${label}: opens (${(error as Error).message.split("\n")[0]})`);
          continue;
        }
        await page.waitForTimeout(300);
        const scroll = await sidewaysScroll(page);
        ok(scroll <= 1, `${label}: no sideways scroll (${scroll}px)`);
        await axe(page, label);
        if (width < 768) {
          const audit = await phoneAudit(page);
          ok(audit.smallTargets.length === 0, `${label}: every target is at least 24 px${audit.smallTargets.length ? ` (${audit.smallTargets.slice(0, 5).join("; ")})` : ""}`);
          ok(audit.tinyText.length === 0, `${label}: no text under 12 px${audit.tinyText.length ? ` (${audit.tinyText.slice(0, 5).join("; ")})` : ""}`);
          ok(audit.covered === null, `${label}: the bottom nav doesn't cover the page${audit.covered ? ` (${audit.covered})` : ""}`);
          if (AUDIT && audit.under44) note(`${label}: ${audit.under44} targets between 24 and 44 px`);
        }
        await shot(page, `${target.name}-${width}-${theme}`);
      }
    } finally {
      await page.context().close();
    }
  }
}

async function main(): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v5m-"));
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: !HEADED });
  try {
    const storage = await seed(browser, dataDir);
    if (runs("do")) await codeDoFlow(browser, storage);
    if (runs("lesson")) await lessonPhoneFlow(browser, storage);
    if (runs("review")) await reviewOptimisticFlow(browser, storage);
    if (runs("states")) await statesFlow(browser, storage);
    if (runs("sweep")) await sweep(browser, storage);
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
