/**
 * Oyelearn v5 Phase 3: the lesson player, through the real UI.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh lesson)      # a private build (never the shared dist/)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/v5-lesson.ts
 *   bash scripts/e2e/snapshot-build.sh --remove lesson
 *
 * 1. A learner on the new design opens a coding lesson (js-call-stack). Watch: the playlist shows,
 *    N adds a note at the current moment, the note is listed. Next.
 * 2. Read: key takeaways, a runnable code block ("Try it" → Run → output). Ask Oye answers with a
 *    citation that jumps to the passage. Mark as read. Next.
 * 3. Do: the hint ladder opens a nudge; Check with wrong code shows per-check feedback (main and extra
 *    checks); Check with a correct solution passes; the lesson completes with a celebration; "Next
 *    lesson" opens js-hoisting.
 * 4. Watch → Next pops the quick check; it is answered and explained. Read → reload lands on the
 *    same step (resume). The resume API returns the step and a saved position.
 * 5. Check: a wrong attempt shows "Not yet" with an explanation per question; a right one passes and
 *    the lesson completes. Ask Oye is off on this step.
 * 6. Report a problem → the admin list has it.
 * 7. axe (WCAG 2.2 AA) on the lesson at 390 and 1440, light and dark: 0 serious/critical.
 *
 * The content is a throwaway copy with one extra section on js-call-stack holding a ```js block (the
 * real curriculum has almost no fenced JavaScript yet). Throwaway DATA_DIR, port 8822, the mock AI.
 * Screenshots go to %TEMP%/claude/e2e-shots-v5-lesson. Exits non-zero when any check fails.
 *
 * Helpers are copied from v5-foundation.ts on purpose, so no script's changes can break another.
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
const PORT = Number(process.env.E2E_PORT ?? 8822);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const HEADED = process.env.E2E_HEADED === "1";
const WAIT = 20_000;
const SHOTS = path.join(process.env.TEMP ?? os.tmpdir(), "claude", "e2e-shots-v5-lesson");
const CODE_TOPIC = "js-call-stack";
const QUIZ_TOPIC = "js-hoisting";

const failures: string[] = [];
function ok(cond: unknown, message: string): boolean {
  console.log(`    ${cond ? "\u001b[32mok\u001b[0m  " : "\u001b[31mFAIL\u001b[0m"} ${message}`);
  if (!cond) failures.push(message);
  return Boolean(cond);
}
function step(message: string): void {
  console.log(`  - ${message}`);
}
function note(message: string): void {
  console.log(`    \u001b[33mnote\u001b[0m ${message}`);
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

async function shot(page: Page, name: string): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true, timeout: WAIT }).catch((e: Error) => note(`screenshot ${name} failed: ${e.message.split("\n")[0]}`));
}

// ---------------------------------------------------------------------------
// Content fixture and server
// ---------------------------------------------------------------------------

/** A copy of the curriculum with one runnable JavaScript block added to js-call-stack. */
function contentFixture(dir: string): string {
  const out = path.join(dir, "content");
  fs.cpSync(path.join(APP, "server", "content"), out, { recursive: true });
  const file = path.join(out, "frontend", "fe-js-core.json");
  const mod = JSON.parse(fs.readFileSync(file, "utf8")) as { topics: { id: string; sections?: { heading: string; body: string }[] }[] };
  const topic = mod.topics.find((t) => t.id === CODE_TOPIC)!;
  topic.sections = [
    ...(topic.sections ?? []),
    {
      heading: "See the stack for yourself",
      body: "Tip: run this and change the number to watch the depth grow.\n\n```js\nfunction depth(n) {\n  return n === 0 ? 0 : 1 + depth(n - 1);\n}\nconsole.log('depth', depth(100));\n```",
    },
  ];
  fs.writeFileSync(file, JSON.stringify(mod));
  return out;
}

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

async function startServer(dataDir: string, contentDir: string): Promise<void> {
  for (const required of ["dist/index.html", "dist-server/index.js"]) {
    if (!fs.existsSync(path.join(APP, required))) throw new Error(`${required} is missing in ${APP}. Build it first (scripts/e2e/snapshot-build.sh).`);
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
      SERVER_CONTENT_DIR: contentDir,
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
    90_000,
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
// Lesson helpers
// ---------------------------------------------------------------------------

async function openLesson(page: Page, topicId: string, query = ""): Promise<void> {
  await page.goto(`${BASE}/learn/lesson/${topicId}${query}`, { waitUntil: "domcontentloaded", timeout: WAIT });
  await page.getByTestId("v5-lesson").waitFor({ timeout: WAIT });
}

async function currentStep(page: Page): Promise<string | null> {
  return page.getByRole("navigation", { name: "Lesson steps" }).locator('[aria-current="step"]').innerText({ timeout: WAIT }).catch(() => null);
}

/** The bottom Next button (the header has one too); waits until it's enabled. */
async function next(page: Page): Promise<boolean> {
  const button = page.getByTestId("v5-lesson").getByRole("button", { name: /^Next$/ }).last();
  const enabled = await poll("Next to be enabled", WAIT, async () => ((await button.isEnabled()) ? true : null)).catch(() => false);
  if (!enabled) return false;
  await button.click({ timeout: WAIT });
  return true;
}

async function axeCheck(page: Page, label: string): Promise<void> {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    // The YouTube player is a third-party frame we can't change.
    .exclude("iframe")
    .analyze();
  const bad = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  ok(bad.length === 0, `axe ${label}: ${result.violations.length} violations, ${bad.length} serious/critical${bad.length ? ` (${bad.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`).join("; ")})` : ""}`);
}

const SOLUTION_BODY = `  if (!Array.isArray(input)) throw new TypeError("flattenDeep needs an array");
  const out = [];
  const stack = [[input, 0]];
  while (stack.length) {
    const top = stack[stack.length - 1];
    const arr = top[0];
    const i = top[1];
    if (i >= arr.length) {
      stack.pop();
      continue;
    }
    top[1] = i + 1;
    const value = arr[i];
    if (Array.isArray(value)) stack.push([value, 0]);
    else out.push(value);
  }
  return out;`;

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v5lesson-"));
  const contentDir = contentFixture(dataDir);
  await startServer(dataDir, contentDir);
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser: Browser = await chromium.launch({ headless: !HEADED });
  let learnerCtx: BrowserContext | null = null;
  try {
    const adminCtx = await browser.newContext();
    const admin = adminCtx.request;
    await sendJson(admin, "post", "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
    await sendJson(admin, "post", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });
    // The v4.3 lock would hold Next until every video is watched; warn mode lets the run move on.
    await sendJson(admin, "put", "/api/admin/video-settings", { lockMode: "warn" });

    const created = await sendJson<{ temporaryPassword: string; user: { id: string } }>(admin, "post", "/api/admin/users", {
      username: "lena.lesson",
      displayName: "Lena Lesson",
      profile: { roleTitle: "Frontend Engineer", yearsExperience: 1, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
      issueAssessment: false,
    });
    await sendJson(admin, "put", `/api/admin/users/${created.user.id}/plan`, { topicIds: [CODE_TOPIC, QUIZ_TOPIC] });

    learnerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await learnerCtx.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await signIn(page, "lena.lesson", created.temporaryPassword, LEARNER_NEW);
    await sendJson(learnerCtx.request, "put", "/api/me/ui", { v5: true });

    // -----------------------------------------------------------------------
    step("1. Watch: playlist, a note with N");
    await openLesson(page, CODE_TOPIC);
    ok(await page.getByRole("heading", { level: 1, name: /Call Stack/ }).isVisible(), "the lesson title is the page heading");
    ok((await currentStep(page))?.includes("Watch"), `starts on Watch (${await currentStep(page)})`);
    const playlist = page.getByRole("region", { name: "Videos in this lesson" });
    ok(await playlist.waitFor({ timeout: WAIT }).then(() => true, () => false), "the playlist sidebar is visible");
    ok((await playlist.getByRole("listitem").count()) >= 1, "the playlist lists the lesson's videos");
    await page.getByRole("heading", { level: 1 }).click();
    await page.keyboard.press("n");
    const noteBox = page.getByLabel(/^Note at \d+:\d\d$/);
    ok(await noteBox.waitFor({ timeout: WAIT }).then(() => true, () => false), "N opens a note at the current moment");
    await noteBox.fill("Remember: the stack is finite");
    await noteBox.press("Enter");
    const notes = page.getByRole("list", { name: "Your notes on this lesson" });
    ok(await notes.getByText("Remember: the stack is finite").waitFor({ timeout: WAIT }).then(() => true, () => false), "the note is listed with its time");
    ok((await notes.getByRole("button", { name: /^Play from / }).count()) === 1, "the note's time is a button that seeks the video");
    await page.keyboard.press("?");
    ok(await page.getByRole("dialog", { name: "Keyboard shortcuts" }).waitFor({ timeout: WAIT }).then(() => true, () => false), "? shows the shortcuts");
    await page.keyboard.press("Escape");
    await shot(page, "watch-1440-light");
    ok(await next(page), "Next is enabled once the videos are cleared (warn mode)");

    // -----------------------------------------------------------------------
    step("2. Read: takeaways, runnable block, Ask Oye with a citation");
    await poll("the Read step", WAIT, async () => ((await currentStep(page))?.includes("Read") ? true : null));
    // The Read step's code loads on demand (P8 budget), so wait for it rather than checking at once.
    ok(await page.getByRole("region", { name: "Key takeaways" }).waitFor({ timeout: WAIT }).then(() => true, () => false), "key takeaways are shown first");
    ok(await page.getByRole("progressbar", { name: /How much of this article/ }).isVisible(), "a reading progress bar is shown");
    ok(await page.getByText(/\d+ min read/).first().isVisible(), "the reading time is shown");
    await page.getByRole("button", { name: "Try it" }).first().click({ timeout: WAIT });
    await page.getByRole("button", { name: "Run", exact: true }).first().click({ timeout: WAIT });
    const output = page.getByTestId("tryit-output");
    const printed = await output.getByText("depth 100").waitFor({ timeout: WAIT }).then(() => true, () => false);
    if (!printed) note(`playground regions: ${await page.getByRole("region", { name: "Playground" }).count()}, output: ${await output.innerText().catch(() => "(none)")}`);
    ok(printed, "the runnable block runs and prints its output");

    await page.getByRole("button", { name: "Ask Oye" }).click();
    const tutor = page.getByRole("dialog", { name: "Ask Oye" });
    await tutor.waitFor({ timeout: WAIT });
    await tutor.getByLabel("Your question").fill("Why does deep recursion crash?");
    await tutor.getByLabel("Your question").press("Enter");
    const answer = tutor.getByTestId("tutor-answer").last();
    ok(await answer.waitFor({ timeout: WAIT }).then(() => true, () => false), "Ask Oye answers");
    const cite = answer.getByRole("button", { name: /^From the lesson/ });
    ok((await cite.count()) >= 1, "the answer cites a passage of the lesson");
    ok((await answer.getByRole("button", { name: "Helpful", exact: true }).count()) === 1, "every answer has thumbs up and down");
    await answer.getByRole("button", { name: "Not helpful" }).click();
    await shot(page, "tutor-1440-light");
    await cite.first().click();
    ok(await poll("the cited passage to get focus", WAIT, async () => ((await page.evaluate(() => document.activeElement?.getAttribute("data-passage") ?? null)) ? true : null)).then(() => true, () => false), "the citation jumps to the passage");
    await page.keyboard.press("Escape").catch(() => undefined);
    if (await tutor.isVisible().catch(() => false)) await tutor.getByRole("button", { name: "Close Ask Oye" }).click().catch(() => undefined);
    const quality = await getJson<{ unhelpful: number }>(admin, "/api/admin/v5/tutor-quality");
    ok(quality.unhelpful === 1, `the 👎 reached the admin quality report (${quality.unhelpful})`);

    await page.getByRole("button", { name: "Mark as read" }).click().catch(() => undefined);
    await shot(page, "read-1440-light");
    ok(await next(page), "Next after reading");

    // -----------------------------------------------------------------------
    step("3. Do: hints, per-check feedback, pass, celebration, next lesson");
    await poll("the Do step", WAIT, async () => ((await currentStep(page))?.includes("Do") ? true : null));
    await page.getByRole("button", { name: "Show a nudge" }).click({ timeout: WAIT });
    ok(await page.getByRole("region", { name: "Hints" }).getByText(/Start with one check/).isVisible(), "the hint ladder opens a nudge");
    ok(await page.getByRole("button", { name: /Show the idea behind it/ }).isVisible(), "the next rung is the idea behind it");
    const editor = page.locator("textarea").first();
    await editor.fill((await editor.inputValue()).replace("  // Your code here", "  return [];"));
    await page.getByRole("button", { name: "Check", exact: true }).click();
    const feedback = page.getByRole("region", { name: "Feedback" });
    ok(await feedback.waitFor({ timeout: 60_000 }).then(() => true, () => false), "Check shows feedback");
    ok(/Not yet|Nearly there/.test(await feedback.innerText()), "a wrong answer is 'Not yet' or 'Nearly there'");
    ok(await page.getByTestId("checks-main-checks").isVisible(), "main checks are listed one by one");
    ok(await page.getByTestId("checks-extra-checks").isVisible(), "extra checks are listed separately");
    ok((await page.getByTestId("checks-main-checks").getByText("Expected").count()) >= 1, "a failed check shows what was expected");
    await shot(page, "do-1440-light");
    await editor.fill((await editor.inputValue()).replace("  return [];", SOLUTION_BODY));
    await page.getByRole("button", { name: "Check", exact: true }).click();
    ok(await poll("a pass", 60_000, async () => (/That works/.test(await feedback.innerText()) ? true : null)).then(() => true, () => false), "the right solution passes");
    const celebration = page.getByText("Lesson finished").first();
    ok(await celebration.waitFor({ timeout: WAIT }).then(() => true, () => false), "a small celebration when the lesson is finished");
    await page.keyboard.press("Escape");
    const nextLesson = page.getByRole("link", { name: /Next lesson/ });
    await nextLesson.waitFor({ timeout: WAIT });
    await nextLesson.click();
    await page.waitForURL((u) => u.pathname === `/learn/lesson/${QUIZ_TOPIC}`, { timeout: WAIT });
    ok(new URL(page.url()).pathname === `/learn/lesson/${QUIZ_TOPIC}`, "Next lesson opens the next topic in the plan");

    // -----------------------------------------------------------------------
    step("4. Quick check after the video; resume");
    await page.getByTestId("v5-lesson").waitFor({ timeout: WAIT });
    ok(await next(page), "Next on Watch");
    const quick = page.getByRole("dialog", { name: "Quick check" });
    ok(await quick.waitFor({ timeout: WAIT }).then(() => true, () => false), "the quick check pops in at the end of Watch");
    await quick.getByTestId("quick-check").waitFor({ timeout: WAIT });
    for (const group of await quick.locator("fieldset").all()) await group.locator("label").first().click();
    await quick.getByRole("button", { name: "Check my answers" }).click();
    ok(await quick.getByText(/^(Right\.|Not quite\.)$/).first().waitFor({ timeout: WAIT }).then(() => true, () => false), "the quick check explains its answers");
    await shot(page, "quickcheck-1440-light");
    await quick.getByRole("button", { name: "Continue" }).click();
    await poll("the Read step", WAIT, async () => ((await currentStep(page))?.includes("Read") ? true : null));
    await sendJson(learnerCtx.request, "put", `/api/v5/lessons/${QUIZ_TOPIC}/state`, { videoId: "Fnlnw8uY6jo", positionSec: 42 });
    await page.waitForTimeout(500);
    await openLesson(page, QUIZ_TOPIC);
    ok((await currentStep(page))?.includes("Read"), `reopening the lesson resumes on the same step (${await currentStep(page)})`);
    const resume = await getJson<{ topicId: string; step: string; positionSec: number | null } | null>(learnerCtx.request, "/api/v5/lessons/resume");
    ok(resume?.topicId === QUIZ_TOPIC && resume.step === "read", `GET /api/v5/lessons/resume → ${resume?.topicId} ${resume?.step}`);
    const state = await getJson<{ videoId: string | null; positionSec: number | null }>(learnerCtx.request, `/api/v5/lessons/${QUIZ_TOPIC}/state`);
    ok(state.videoId === "Fnlnw8uY6jo" && state.positionSec === 42, `the video position is kept (${state.videoId} @ ${state.positionSec})`);

    // -----------------------------------------------------------------------
    step("5. Check: Not yet with explanations, then a pass");
    await page.getByRole("button", { name: "Mark as read" }).click().catch(() => undefined);
    ok(await next(page), "Next after reading");
    await poll("the Check step", WAIT, async () => ((await currentStep(page))?.includes("Check") ? true : null));
    await page.getByRole("button", { name: "Ask Oye" }).click();
    ok(await page.getByRole("dialog", { name: "Ask Oye" }).getByText(/off during tests/).waitFor({ timeout: WAIT }).then(() => true, () => false), "Ask Oye is off on the Check step");
    await page.getByRole("button", { name: "Close Ask Oye" }).click().catch(() => undefined);

    const fieldsets = page.getByTestId("v5-lesson").locator("form fieldset");
    const count = await fieldsets.count();
    for (let i = 0; i < count; i++) await fieldsets.nth(i).locator("label").first().click();
    await page.getByRole("button", { name: "Send my answers" }).click();
    const verdict = page.getByTestId("v5-lesson").getByRole("status").filter({ hasText: /right/ }).first();
    await verdict.waitFor({ timeout: WAIT });
    const firstTry = await verdict.innerText();
    ok(/Not yet|Passed/.test(firstTry), `the test result says Passed or Not yet (${firstTry.split("\n")[0]})`);
    ok((await page.getByText("Why", { exact: true }).count()) === count, "every answer is explained afterwards");
    await shot(page, "check-1440-light");
    if (/Not yet/.test(firstTry)) {
      // The superadmin's copy of the module carries the answer key; the learner's has the same ids.
      type Q = { id: string; prompt: string; options: string[]; correctIndices?: number[] };
      const keyed = (await getJson<{ topics: { id: string; quiz?: Q[] }[] }>(admin, "/api/content/modules/frontend/fe-js-core")).topics.find((t) => t.id === QUIZ_TOPIC)?.quiz ?? [];
      const learnerQuiz = (await getJson<{ topics: { id: string; quiz?: Q[] }[] }>(learnerCtx.request, "/api/content/modules/frontend/fe-js-core")).topics.find((t) => t.id === QUIZ_TOPIC)?.quiz ?? [];
      const answers = Object.fromEntries(learnerQuiz.map((q) => [q.id, (keyed.find((k) => k.id === q.id) ?? keyed.find((k) => k.prompt === q.prompt))?.correctIndices ?? [0]]));
      ok(learnerQuiz.length === count, `the learner's served test matches the page (${learnerQuiz.length} questions)`);
      // Answer through the UI: options are shuffled, so pick by their text.
      await page.getByRole("button", { name: "Try again" }).click();
      for (let i = 0; i < learnerQuiz.length; i++) {
        const q = learnerQuiz[i];
        const fs1 = fieldsets.nth(i);
        for (const oi of answers[q.id] ?? []) {
          await fs1.locator("label").filter({ hasText: q.options[oi].replace(/[`*]/g, "").slice(0, 40) }).first().click();
        }
      }
      await page.getByRole("button", { name: "Send my answers" }).click();
      await poll("the second result", WAIT, async () => (/Passed/.test(await page.getByTestId("v5-lesson").getByRole("status").filter({ hasText: /right/ }).first().innerText()) ? true : null)).catch(() => undefined);
    }
    const final = await page.getByTestId("v5-lesson").getByRole("status").filter({ hasText: /right/ }).first().innerText();
    ok(/Passed/.test(final), `the test passes (${final.split("\n")[0]})`);
    ok(await page.getByText("Lesson finished").first().waitFor({ timeout: WAIT }).then(() => true, () => false), "the second lesson completes too");
    await page.keyboard.press("Escape");

    // -----------------------------------------------------------------------
    step("6. Report a problem");
    await page.getByRole("button", { name: "Report a problem" }).click();
    const report = page.getByRole("dialog", { name: "Report a problem with this step" });
    await report.getByLabel("What's wrong?").fill("Question 3 has two right answers.");
    await report.getByRole("button", { name: "Send the report" }).click();
    await report.waitFor({ state: "hidden", timeout: WAIT }).catch(() => undefined);
    const problems = await getJson<{ openCount: number; problems: { topicId: string; step: string; message: string }[] }>(admin, "/api/admin/v5/problems");
    ok(problems.openCount === 1 && problems.problems[0]?.topicId === QUIZ_TOPIC && problems.problems[0]?.step === "check", `the admin sees the report (${problems.openCount} open)`);

    // -----------------------------------------------------------------------
    step("7. axe at 390 and 1440, light and dark; focus mode");
    const storage = await learnerCtx.storageState();
    for (const width of [390, 1440]) {
      for (const theme of ["light", "dark"] as const) {
        const ctx = await browser.newContext({ storageState: storage, viewport: { width, height: width < 768 ? 844 : 900 }, colorScheme: theme });
        await ctx.addInitScript((t) => {
          try {
            window.localStorage.setItem("oyelabs-ui", JSON.stringify({ state: { theme: t, sidebarCollapsed: false }, version: 0 }));
          } catch {
            // ignore
          }
        }, theme);
        const p = await ctx.newPage();
        for (const [topicId, stepName] of [
          [CODE_TOPIC, "watch"],
          [CODE_TOPIC, "read"],
          [CODE_TOPIC, "do"],
          [QUIZ_TOPIC, "check"],
        ] as const) {
          await openLesson(p, topicId, `?step=${stepName}`);
          await p.waitForLoadState("networkidle", { timeout: WAIT }).catch(() => undefined);
          await p.waitForTimeout(400);
          // The saved theme (oyelabs-ui) wins over colorScheme, so check the page really is in this theme.
          const dark = await p.evaluate(() => document.documentElement.classList.contains("dark"));
          ok(dark === (theme === "dark"), `${stepName} @${width} ${theme}: the page is in ${theme} mode`);
          await axeCheck(p, `${topicId} ${stepName} @${width} ${theme}`);
          const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          ok(overflow <= 1, `no sideways scroll on ${stepName} @${width} ${theme} (${overflow}px)`);
          await shot(p, `${stepName}-${width}-${theme}`);
        }
        if (width === 1440 && theme === "light") {
          await p.getByRole("heading", { level: 1 }).click();
          await p.keyboard.press("f");
          ok((await p.getByTestId("v5-lesson").getAttribute("data-focus-mode")) === "on", "F turns focus mode on");
          ok(!(await p.getByRole("navigation", { name: "Main" }).first().isVisible().catch(() => false)) || (await p.evaluate(() => {
            const nav = document.querySelector('nav[aria-label="Main"]');
            const lesson = document.querySelector('[data-testid="v5-lesson"]');
            if (!nav || !lesson) return true;
            const r = nav.getBoundingClientRect();
            const top = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(20, r.height / 2));
            return lesson.contains(top);
          })), "focus mode covers the navigation");
          await p.keyboard.press("f");
          ok((await p.getByTestId("v5-lesson").getAttribute("data-focus-mode")) === "off", "F again turns it off");
        }
        await ctx.close();
      }
    }

    ok(errors.length === 0, `no page errors (${errors.slice(0, 3).join(" | ")})`);
    await adminCtx.close();
  } finally {
    await learnerCtx?.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
    stopServer();
  }
  console.log(`screenshots: ${SHOTS}`);
  console.log(failures.length ? `\n${failures.length} failure(s):\n  ${failures.join("\n  ")}` : "\nall checks passed");
  process.exit(failures.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
