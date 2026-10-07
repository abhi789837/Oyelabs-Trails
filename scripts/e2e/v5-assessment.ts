/**
 * Oyelearn v5 Phase 5: the test, the results and certificates, end to end.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh assessment)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/v5-assessment.ts
 *   bash scripts/e2e/snapshot-build.sh --remove assessment
 *
 * Seeds through the API (superadmin → a learner on the v5 design with priorities JavaScript,
 * stand-up updates and workplace writing → a v4 test written by the mock AI), then in a real
 * browser:
 * 1. Pre-flight shows in the v5 frame; consent and start go through the API (Chromium's fake camera
 *    has no face, as in v44-reference-case.ts).
 * 2. The sheet: "Question N of M", the autosave line ("All answers saved" after an answer), a flag
 *    that shows on the navigator chip and in the "Flagged" filter, the Run counter (3 → 2) on a
 *    coding question, a Speak question answered with "Type your answer instead", a written answer,
 *    plain proctoring words ("Camera", "Stay on this tab"), no sideways scroll at 390.
 * 3. Finish → "Hand in my answers" → the waiting screen; the mock marks it.
 * 4. Results: the story ("You're strong at…" / "We'll start with…"), skill levels, every question
 *    reviewable, "Request review" on a Not-yet one → "Review requested" (server agrees), and
 *    "Your plan is ready" → the animation → /learn/plan.
 * 5. A goal is marked achieved in the throwaway DB → a certificate is issued by the server; the
 *    certificate page shows the server's picture; the PDF downloads (%PDF); the image is the 2× A4
 *    PNG (3508 × 2480); /verify/:id opens logged out ("valid"), and says "revoked" after an admin
 *    revokes it (rebrand Phase 5).
 * 6. axe (WCAG 2.2 AA tags): no serious or critical violations on the sheet, results, certificate
 *    and verify pages at 390 and 1440, light and dark.
 * Screenshots: %TEMP%/claude/e2e-shots-v5-assessment. Port 8825, throwaway DATA_DIR, mock AI.
 *
 * Answering helpers are copied from v44-reference-case.ts on purpose (no script can break another).
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import Database from "better-sqlite3";
import { chromium, type APIRequestContext, type Browser, type BrowserContext, type Locator, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.E2E_PORT ?? 8825);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER = "learner.p5";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const SHOTS = path.join(os.tmpdir(), "claude", "e2e-shots-v5-assessment");
const WAIT = 20_000;
const JOB_TIMEOUT_MS = Number(process.env.E2E_JOB_TIMEOUT_MS ?? 6 * 60_000);
const HEADED = process.env.E2E_HEADED === "1";

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
// Page helpers
// ---------------------------------------------------------------------------

async function themed(ctx: BrowserContext, theme: "light" | "dark"): Promise<void> {
  await ctx.addInitScript((t) => {
    try {
      window.localStorage.setItem("oyelabs-ui", JSON.stringify({ state: { theme: t, sidebarCollapsed: false }, version: 0 }));
    } catch {
      // ignore
    }
  }, theme);
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

/** Resize; in real fullscreen the window can't be resized, so emulate the viewport through CDP instead. */
async function setWidth(page: Page, width: number): Promise<void> {
  const height = width < 768 ? 844 : 900;
  try {
    await page.setViewportSize({ width, height });
  } catch {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  }
  await page.waitForTimeout(300);
}

async function noSideways(page: Page, label: string): Promise<void> {
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(scroll <= 1, `${label}: no sideways scroll (${scroll}px)`);
}

async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true, animations: "disabled", timeout: WAIT }).catch((e: Error) => note(`screenshot ${name} failed: ${e.message.split("\n")[0]}`));
}

/** From v44-reference-case.ts: the Fullscreen API isn't there headless, so shim it once if needed. */
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
  await gate.waitFor({ state: "hidden", timeout: 10_000 });
}

const chip = (page: Page, index: number) => page.getByRole("navigation", { name: "Questions" }).first().getByRole("button", { name: new RegExp(`^Question ${index + 1}:`) });
const article = (page: Page): Locator => page.locator("article").first();

async function goTo(page: Page, index: number, total: number): Promise<void> {
  await chip(page, index).click();
  await page.getByText(new RegExp(`^Question ${index + 1} of ${total}(\\D|$)`)).waitFor({ timeout: WAIT });
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

interface SheetItemLite {
  id: string;
  type: "coding" | "mcq" | "task";
  skillId: string;
  task?: { kind: string };
  runsOn?: string;
}
interface AdminItemLite extends SheetItemLite {
  answer: { correctIndex?: number } | null;
  verdict: "full" | "not_yet" | null;
}
const kindOf = (i: SheetItemLite) => (i.type === "task" ? (i.task?.kind ?? "task") : i.type);

interface Seeded {
  admin: APIRequestContext;
  adminCtx: BrowserContext;
  userId: string;
  assessmentId: string;
  storage: string;
  keyed: Map<string, AdminItemLite>;
}

async function seed(browser: Browser, dataDir: string): Promise<Seeded> {
  step("seed: superadmin, a v5 learner with priorities, a v4 test from the mock AI");
  const adminCtx = await browser.newContext();
  const admin = adminCtx.request;
  await call(admin, "post", "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
  await call(admin, "post", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });
  const created = await call<{ user: { id: string }; temporaryPassword: string }>(admin, "post", "/api/admin/users", {
    username: LEARNER,
    displayName: "Asha Learner",
    profile: { roleTitle: "Frontend Engineer", yearsExperience: 1, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
    issueAssessment: false,
  });
  const userId = created.user.id;
  await call(admin, "put", `/api/admin/users/${userId}/setup`, {
    departmentId: "engineering",
    priorities: [
      { skillId: "eng-javascript", slider: 5 },
      { skillId: "ss-standup-updates", slider: 5 },
      { skillId: "ss-workplace-writing", slider: 4 },
    ],
  });

  const learnerCtx = await browser.newContext();
  await call(learnerCtx.request, "post", "/api/auth/login", { username: LEARNER, password: created.temporaryPassword });
  await call(learnerCtx.request, "post", "/api/auth/change-password", { currentPassword: created.temporaryPassword, newPassword: LEARNER_NEW });
  await call(learnerCtx.request, "put", "/api/me/ui", { v5: true });
  const storage = path.join(dataDir, "learner.json");
  await learnerCtx.storageState({ path: storage });
  await learnerCtx.close();

  const issued = await call<{ assessmentId: string }>(admin, "post", `/api/admin/users/${userId}/assessments`, {});
  const started = Date.now();
  await poll("the test to be written", JOB_TIMEOUT_MS, async () => {
    const { assessments } = await call<{ assessments: { id: string; status: string }[] }>(admin, "get", `/api/admin/users/${userId}/assessments`);
    const a = assessments.find((x) => x.id === issued.assessmentId);
    if (a?.status === "failed") throw new Error("assessment generation failed");
    if (a?.status === "awaiting_approval") await call(admin, "post", `/api/admin/assessments/${a.id}/approve`, {}).catch(() => undefined);
    return a?.status === "ready" ? a : null;
  }, 1500);
  note(`the test was ready ${Math.round((Date.now() - started) / 1000)} s after it was issued`);
  const detail = await call<{ items: AdminItemLite[] }>(admin, "get", `/api/admin/assessments/${issued.assessmentId}/v4`);
  const mix = new Map<string, number>();
  for (const i of detail.items) mix.set(kindOf(i), (mix.get(kindOf(i)) ?? 0) + 1);
  note(`test mix: ${[...mix].map(([k, n]) => `${k}×${n}`).join(", ")}`);
  return { admin, adminCtx, userId, assessmentId: issued.assessmentId, storage, keyed: new Map(detail.items.map((i) => [i.id, i])) };
}

// ---------------------------------------------------------------------------
// 1-3. The test
// ---------------------------------------------------------------------------

async function takeTest(browser: Browser, s: Seeded): Promise<void> {
  const ctx = await browser.newContext({ storageState: s.storage, viewport: { width: 1440, height: 900 }, permissions: ["camera", "microphone"] });
  const page = await ctx.newPage();
  page.on("pageerror", (error) => note(`[pageerror sheet] ${error.message}`));
  try {
    step("pre-flight in the v5 frame");
    await page.goto(`${BASE}/assessment`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await page.getByRole("heading", { name: "Before you start" }).waitFor({ timeout: WAIT });
    ok(await page.evaluate(() => document.documentElement.dataset.ui === "v5"), "the pre-flight is inside the v5 scope");
    ok(await page.getByRole("img", { name: "Oyelearn" }).first().isVisible().catch(() => false), "the Oyelearn logo frames the pre-flight");
    await shot(page, "01-preflight-1440");
    const permissions = { camera: true, microphone: true, fullscreen: true, tabMonitoring: true };
    await call(ctx.request, "post", `/api/assessment/${s.assessmentId}/consent`, { agreed: true, permissions });
    await call(ctx.request, "post", `/api/assessment/${s.assessmentId}/start`, {});
    note("consent and start sent through the API with the learner's session (the fake camera shows no face)");

    await page.goto(`${BASE}/assessment`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await page.waitForSelector("text=/Question \\d+ of \\d+|Return to fullscreen/", { timeout: 30_000 });
    await ensureFullscreen(page);
    await page.getByText(/^Question \d+ of \d+/).first().waitFor({ timeout: WAIT });
    const sheet = (await call<{ items: SheetItemLite[] }>(ctx.request, "get", `/api/assessment/${s.assessmentId}/sheet`)).items;
    const total = sheet.length;
    await goTo(page, 0, total);

    step("the sheet: proctoring words, autosave, navigator, flag");
    const status = page.getByRole("list", { name: "Test status" });
    const statusText = (await status.innerText()).replace(/\s+/g, " ");
    ok(/Stay on this tab/.test(statusText) && /camera/i.test(statusText), `proctoring status in plain words: "${statusText}"`);
    ok(!/detect|violation|suspicious|cheat/i.test(statusText), "no scary words in the status");
    const autosave = page.getByTestId("autosave");
    ok(/save/i.test((await autosave.innerText()) ?? ""), `the autosave line shows before anything is typed ("${await autosave.innerText()}")`);
    ok(await page.getByText(/No timer per question/).isVisible().catch(() => false), "no per-question timer, said plainly");
    ok(await page.getByLabel(/^Time: .* so far, the test ends at /).isVisible().catch(() => false), "one overall clock");

    const plan: string[] = [];
    let mcqWrong: string | null = null;
    let codingDone = false;
    let speakDone = false;
    let writeDone = false;
    for (const [index, item] of sheet.entries()) {
      const kind = kindOf(item);
      if (kind === "mcq") {
        const key = s.keyed.get(item.id)?.answer?.correctIndex;
        if (typeof key !== "number") continue;
        await goTo(page, index, total);
        const radios = article(page).locator('input[type="radio"]');
        const n = await radios.count();
        // The first MCQ wrong on purpose (a Not yet to ask a review for), the rest right.
        const wrong = mcqWrong === null;
        await radios.nth(wrong ? (key + 1) % n : key).check();
        if (wrong) mcqWrong = item.id;
        plan.push(`Q${index + 1} mcq ${wrong ? "wrong" : "right"}`);
        if (index === sheet.findIndex((i) => kindOf(i) === "mcq")) {
          await poll("autosave says saved", WAIT, async () => /All answers saved/.test(await autosave.innerText()), 200).catch(() => null);
          ok(/All answers saved/.test(await autosave.innerText()), `after an answer the autosave line says "${await autosave.innerText()}"`);
          await page.getByRole("button", { name: "Flag for later" }).click();
          await poll("flag on chip", WAIT, async () => /flagged/.test((await chip(page, index).getAttribute("aria-label")) ?? ""), 200).catch(() => null);
          ok(/answered, flagged/.test((await chip(page, index).getAttribute("aria-label")) ?? ""), `the navigator chip says "${await chip(page, index).getAttribute("aria-label")}"`);
          const nav = page.getByRole("navigation", { name: "Questions" }).first();
          await nav.getByRole("button", { name: "Flagged", exact: true }).click();
          const shown = await nav.getByRole("button", { name: /^Question \d+:/ }).count();
          ok(shown === 1, `the Flagged filter shows just the flagged question (${shown})`);
          await shot(page, "02-sheet-flagged-1440");
          await nav.getByRole("button", { name: "All", exact: true }).click();
        }
        continue;
      }
      if (kind === "coding" && !codingDone) {
        await goTo(page, index, total);
        const runs = article(page).getByText(/^Runs left: \d/);
        await runs.waitFor({ timeout: WAIT });
        const before = await runs.innerText();
        await article(page).getByRole("button", { name: /^Run$/ }).click();
        await poll("runs counter", WAIT, async () => /Runs left: 2/.test(await runs.innerText()), 300).catch(() => null);
        ok(/Runs left: 3/.test(before) && /Runs left: 2/.test(await runs.innerText()), `the Run counter counts (${before} → ${await runs.innerText()})`);
        codingDone = true;
        plan.push(`Q${index + 1} coding: one run`);
        await shot(page, "03-sheet-coding-1440");
        continue;
      }
      if (kind === "speak" && !speakDone) {
        await goTo(page, index, total);
        const box = article(page);
        await box.getByRole("button", { name: "Type your answer instead" }).click();
        await box.getByLabel("Your answer, typed").fill(
          "Hi everyone. Yesterday I finished the signup form and fixed two bugs in the cart page. Today I am wiring the order history screen to the new API. " +
            "One blocker: the staging payment keys are not working, so I will ask the backend team for new ones right after this.",
        );
        speakDone = true;
        plan.push(`Q${index + 1} speak: typed instead`);
        await shot(page, "04-sheet-speak-typed-1440");
        continue;
      }
      if (kind === "write" && !writeDone) {
        await goTo(page, index, total);
        await article(page).locator("textarea").first().fill("Hi Sam,\n\nThanks for your patience. The fix is in testing and I will send you an update by 5 pm today with the new date.\n\nBest regards,\nAsha");
        writeDone = true;
        plan.push(`Q${index + 1} write`);
      }
    }
    note(`answers: ${plan.join("; ")}`);
    ok(mcqWrong !== null, "at least one multiple-choice question was answered");
    if (!codingDone) note("the test had no coding question, so the Run counter wasn't exercised here");
    ok(speakDone, "a Speak question was answered with the typed fallback");

    step("axe and layout on the sheet at 1440 and 390, light and dark");
    await goTo(page, 0, total);
    await axe(page, "sheet 1440 light");
    await noSideways(page, "sheet 1440");
    await setWidth(page, 390);
    await noSideways(page, "sheet 390");
    ok(await page.getByRole("button", { name: "Questions" }).isVisible().catch(() => false), "at 390 the navigator opens from a Questions button");
    await axe(page, "sheet 390 light");
    await shot(page, "05-sheet-390-light");
    await page.getByRole("button", { name: "Questions" }).click();
    await page.getByRole("dialog", { name: "Questions" }).waitFor({ timeout: WAIT });
    await axe(page, "sheet 390 navigator sheet");
    await shot(page, "06-sheet-390-navigator");
    await page.keyboard.press("Escape");
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(200);
    await axe(page, "sheet 390 dark");
    await shot(page, "07-sheet-390-dark");
    await setWidth(page, 1440);
    await axe(page, "sheet 1440 dark");
    await shot(page, "08-sheet-1440-dark");
    await page.evaluate(() => document.documentElement.classList.remove("dark"));

    const saved = await poll("drafts saved", WAIT, async () => {
      const items = (await call<{ items: { id: string; draft: unknown }[] }>(ctx.request, "get", `/api/assessment/${s.assessmentId}/sheet`)).items;
      return items.filter((i) => i.draft !== null).length >= plan.length - (codingDone ? 1 : 0) ? items : null;
    }).catch(() => null);
    ok(saved !== null, "server: the answers given in the UI were autosaved");

    step("Finish → hand in → waiting");
    await page.getByRole("button", { name: "Finish", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Hand in your answers?" });
    await dialog.waitFor({ timeout: WAIT });
    ok(/flagged to come back to/.test(await dialog.innerText()), "the hand-in dialog mentions the flagged question");
    await shot(page, "09-finish-dialog");
    await dialog.getByRole("button", { name: "Hand in my answers" }).click();
    await page.getByText(/Your answers are handed in|marking your answers/).first().waitFor({ timeout: 30_000 });
    await shot(page, "10-waiting");
    await poll("the test to be marked", JOB_TIMEOUT_MS, async () => {
      const { assessments } = await call<{ assessments: { id: string; status: string }[] }>(s.admin, "get", `/api/admin/users/${s.userId}/assessments`);
      const a = assessments.find((x) => x.id === s.assessmentId);
      if (a?.status === "failed") throw new Error("evaluation failed");
      return a?.status === "completed" ? true : null;
    }, 2000);
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// 4. Results
// ---------------------------------------------------------------------------

async function results(browser: Browser, s: Seeded): Promise<void> {
  const ctx = await browser.newContext({ storageState: s.storage, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (error) => note(`[pageerror results] ${error.message}`));
  try {
    step("results: story, levels, answers, Request review");
    await page.goto(`${BASE}/assessment`, { waitUntil: "domcontentloaded", timeout: WAIT });
    const h1 = page.getByRole("heading", { level: 1 });
    await page.getByRole("heading", { name: "Look back at your answers" }).waitFor({ timeout: 60_000 });
    const story = `${await h1.innerText()} ${await page.locator("#results-title + p").innerText()}`;
    ok(/^(You're strong at .+\.|You've made a solid start\.)/.test(story), `the story opens kindly: "${story}"`);
    ok(/We'll start with .+|Your plan builds on/.test(story), "and says where the plan starts");
    ok((await page.getByRole("meter").count()) >= 1, `skill levels are shown (${await page.getByRole("meter").count()} meters)`);
    const rows = page.getByRole("list", { name: "Your answers" }).locator(":scope > li");
    const count = await rows.count();
    ok(count >= 3, `every question is listed to look back over (${count})`);
    await shot(page, "11-results-1440");

    await page.getByRole("button", { name: "Not yet only", exact: true }).click();
    const first = rows.first();
    await first.getByRole("button").first().click();
    ok(await first.getByText("Why", { exact: true }).isVisible().catch(() => false), "an answer shows why");
    const request = first.getByRole("button", { name: "Request review" });
    if (await request.isVisible().catch(() => false)) {
      await request.click();
      const dlg = page.getByRole("dialog");
      await dlg.waitFor({ timeout: WAIT });
      await axe(page, "request review dialog");
      await dlg.getByRole("textbox").fill("I think my answer covers this too.");
      await dlg.getByRole("button", { name: "Send the request" }).click();
      await first.getByText(/Review requested/).waitFor({ timeout: WAIT });
      ok(true, "Request review → Review requested");
      const mine = await call<{ requests: { source: string; status: string }[] }>(ctx.request, "get", "/api/review-requests");
      ok(mine.requests.some((r) => r.source === "assessment_item" && r.status === "open"), "server: an open review request for the assessment item");
    } else {
      ok(false, "a Not-yet answer offers Request review");
    }
    await shot(page, "12-results-review-requested");
    await page.getByRole("button", { name: "All", exact: true }).click();

    for (const width of [390, 1440]) {
      for (const theme of ["light", "dark"] as const) {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
        await page.evaluate((t) => document.documentElement.classList.toggle("dark", t === "dark"), theme);
        await page.waitForTimeout(250);
        await noSideways(page, `results ${width} ${theme}`);
        await axe(page, `results ${width} ${theme}`);
        await shot(page, `13-results-${width}-${theme}`);
      }
    }
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await page.setViewportSize({ width: 1440, height: 900 });

    step('"Your plan is ready" → animation → /learn/plan');
    await page.getByRole("button", { name: "Your plan is ready" }).first().click();
    const anim = await page.getByTestId("plan-ready-animation").isVisible({ timeout: 2000 }).catch(() => false);
    ok(anim, "the plan-ready animation plays");
    await page.waitForURL(/\/learn\/plan/, { timeout: WAIT });
    ok(new URL(page.url()).pathname === "/learn/plan", "and opens /learn/plan");
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// 5. Certificates
// ---------------------------------------------------------------------------

function pngSize(file: string): { width: number; height: number } {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

async function certificates(browser: Browser, s: Seeded, dataDir: string): Promise<void> {
  step("certificate: a goal is achieved in the throwaway DB; the server issues it");
  const db = new Database(path.join(dataDir, "oyelearn.db"));
  try {
    const at = Date.now();
    db.prepare(
      "insert into learner_goals (id, user_id, type, original_text, outcome, skill_ids, target_level, slider, position, status, achieved_at, source, created_at, updated_at) values (?, ?, 'text', ?, ?, ?, 3, 4, 99, 'achieved', ?, 'admin', ?, ?)",
    ).run("e2e-goal-1", s.userId, "Give a clear stand-up update", "Give a clear stand-up update", JSON.stringify(["ss-standup-updates"]), at, at, at);
  } finally {
    db.close();
  }
  const ctx = await browser.newContext({ storageState: s.storage, viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on("pageerror", (error) => note(`[pageerror certificate] ${error.message}`));
  let certId = "";
  try {
    const mine = await call<{ certificates: { id: string; title: string; kind: string }[]; newlyIssued: string[] }>(ctx.request, "get", "/api/v5/certificates");
    const cert = mine.certificates.find((c) => c.kind === "goal");
    ok(cert && mine.newlyIssued.includes(cert.id), `the server issued a goal certificate (${cert?.id})`);
    const again = await call<{ certificates: unknown[]; newlyIssued: string[] }>(ctx.request, "get", "/api/v5/certificates");
    ok(again.newlyIssued.length === 0 && again.certificates.length === mine.certificates.length, "issuing is idempotent");
    certId = cert!.id;

    await page.goto(`${BASE}/learn/certificate/${certId}`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await page.getByRole("heading", { level: 1, name: "Give a clear stand-up update" }).waitFor({ timeout: WAIT });
    // Rebrand Phase 5: the certificate is the server's PNG, drawn from the kit's template.
    const art = page.getByRole("img", { name: /Certificate of completion: Asha Learner has reached the goal Give a clear stand-up update/ });
    ok(await art.isVisible(), "the certificate picture names the holder and the goal");
    const natural = await poll("certificate picture loaded", WAIT, async () => ((await art.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)) || null), 200).catch(() => 0);
    ok(natural === 3508, `the picture is the server's 2× PNG (${natural} px wide)`);
    await page.waitForTimeout(2300); // let the celebration finish
    await shot(page, "14-certificate-1440");

    const pdfDl = page.waitForEvent("download", { timeout: 60_000 });
    await page.getByRole("link", { name: "Download PDF" }).click();
    const pdf = await pdfDl;
    const pdfPath = path.join(dataDir, pdf.suggestedFilename());
    await pdf.saveAs(pdfPath);
    const head = fs.readFileSync(pdfPath).subarray(0, 5).toString();
    ok(head === "%PDF-" && fs.statSync(pdfPath).size > 5000, `the PDF downloads (${pdf.suggestedFilename()}, ${fs.statSync(pdfPath).size} bytes)`);

    const pngDl = page.waitForEvent("download", { timeout: 60_000 });
    await page.getByRole("link", { name: "Download image" }).click();
    const png = await pngDl;
    const pngPath = path.join(dataDir, png.suggestedFilename());
    await png.saveAs(pngPath);
    const size = pngSize(pngPath);
    ok(size.width === 3508 && size.height === 2480, `the image is the 2× A4 PNG, 3508 × 2480 (${size.width} × ${size.height})`);
    fs.copyFileSync(pngPath, path.join(SHOTS, "15-share-image.png"));

    for (const width of [390, 1440]) {
      for (const theme of ["light", "dark"] as const) {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
        await page.evaluate((t) => document.documentElement.classList.toggle("dark", t === "dark"), theme);
        await page.waitForTimeout(250);
        await noSideways(page, `certificate ${width} ${theme}`);
        await axe(page, `certificate ${width} ${theme}`);
        await shot(page, `16-certificate-${width}-${theme}`);
      }
    }
  } finally {
    await ctx.close();
  }

  step("/verify/:id logged out: valid, then revoked after a revoke");
  for (const width of [390, 1440]) {
    for (const theme of ["light", "dark"] as const) {
      const anon = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, colorScheme: theme });
      await themed(anon, theme);
      const p = await anon.newPage();
      try {
        await p.goto(`${BASE}/verify/${certId}`, { waitUntil: "domcontentloaded", timeout: WAIT });
        await p.getByRole("heading", { name: "This certificate is valid" }).waitFor({ timeout: WAIT });
        if (width === 1440 && theme === "light") {
          ok(p.url().includes(`/verify/${certId}`), "the check page opens without signing in");
          ok(await p.getByText("Asha Learner").isVisible(), "it shows the holder");
          ok(await p.getByText("Give a clear stand-up update").isVisible(), "and what it's for");
        }
        await noSideways(p, `verify ${width} ${theme}`);
        await axe(p, `verify ${width} ${theme}`);
        await shot(p, `17-verify-${width}-${theme}`);
      } finally {
        await anon.close();
      }
    }
  }
  await call(s.admin, "post", `/api/admin/v5/certificates/${certId}/revoke`, { note: "e2e" });
  const anon = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await anon.newPage();
  try {
    await p.goto(`${BASE}/verify/${certId}`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await p.getByRole("heading", { name: "This certificate was revoked" }).waitFor({ timeout: WAIT });
    ok(true, "after a revoke the check page says it was revoked");
    await shot(p, "18-verify-withdrawn");
    await p.goto(`${BASE}/verify/OYL-0000-0000`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await p.getByRole("heading", { name: "Certificate not found" }).waitFor({ timeout: WAIT });
    ok(true, "an unknown code says it can't be found");
  } finally {
    await anon.close();
  }
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v5a-"));
  await startServer(dataDir);
  const browser = await chromium.launch({
    headless: !HEADED,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
  });
  try {
    const seeded = await seed(browser, dataDir);
    try {
      await takeTest(browser, seeded);
      await results(browser, seeded);
      await certificates(browser, seeded, dataDir);
    } finally {
      await seeded.adminCtx.close();
    }
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
