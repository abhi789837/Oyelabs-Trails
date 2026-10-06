/**
 * Oyelearn v5 Phase 9.1: the two main journeys end to end, with the click-count targets.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh p9q)        # a private build (never the shared dist/)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/v5-journeys.ts
 *   bash scripts/e2e/snapshot-build.sh --remove p9q
 *
 * Learner (on the new design; plan js-call-stack, js-hoisting, js-scope-chain; js-call-stack was opened
 * once before, so Today's Continue resumes it):
 *   open the app ("/") → Today → Continue lands inside the next step (counted) → Watch → Read with a
 *   runnable "Try it" block → Do with a hint and Check (wrong, then right) → Next lesson → Watch with
 *   the quick check → Read → the topic test on the Check step → Next lesson opens the third topic.
 *   The quick check only exists on lessons with a quiz, so it is met on the second lesson.
 * Admin (the superadmin on the new design):
 *   inbox "Give full marks" (counted) → onboard someone and send the test (counted, typing not
 *   counted) → People side sheet → edit a course block in the editor and save → Reports CSV download.
 *
 * Every mouse click inside a counted stretch goes through `click()`; typing and waiting are not
 * counted (the same rule as docs/v5/BASELINE.md). The three counts are printed at the end and, with
 * E2E_WRITE_CLICKS=1, also written to %TEMP%/claude/v5-journeys-clicks.json for docs/v5/QUALITY.md.
 *
 * Port 8840, throwaway DATA_DIR, the deterministic mock AI (NODE_ENV=development). The content is a
 * throwaway copy with one ```js block on js-call-stack (as in v5-lesson.ts). Screenshots go to
 * %TEMP%/claude/e2e-shots-v5-journeys. Exits non-zero when any check fails, and always stops its
 * server. Helpers are copied from v5-lesson.ts and v5-admin.ts on purpose: no script imports another.
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
const PORT = Number(process.env.E2E_PORT ?? 8840);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const HEADED = process.env.E2E_HEADED === "1";
const WAIT = 20_000;
const DAY = 86_400_000;
const SHOTS = path.join(process.env.TEMP ?? os.tmpdir(), "claude", "e2e-shots-v5-journeys");
const CODE_TOPIC = "js-call-stack";
/**
 * Two lessons cover every step kind (a code Do, then a quiz Check); a third means there's a next lesson
 * after the test. "Next lesson" follows the track's order (call stack → hoisting → scope chain).
 */
const PLAN = [CODE_TOPIC, "js-hoisting", "js-scope-chain"];
const ONLY = process.env.E2E_ONLY ?? "";

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

// ---------------------------------------------------------------------------
// Click counting
// ---------------------------------------------------------------------------

let clicks = 0;
const clickLog: string[] = [];
async function click(locator: Locator, what: string): Promise<void> {
  clicks += 1;
  clickLog.push(what);
  await locator.click({ timeout: WAIT });
}
async function counted<T>(fn: () => Promise<T>): Promise<{ result: T; clicks: number; what: string[] }> {
  const start = clicks;
  const from = clickLog.length;
  const result = await fn();
  return { result, clicks: clicks - start, what: clickLog.slice(from) };
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

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

async function shot(page: Page, name: string): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true, timeout: WAIT }).catch((e: Error) => note(`screenshot ${name} failed: ${e.message.split("\n")[0]}`));
}

const visible = (locator: Locator, timeout = WAIT): Promise<boolean> => locator.waitFor({ timeout }).then(
  () => true,
  () => false,
);

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
// Lesson helpers (from v5-lesson.ts)
// ---------------------------------------------------------------------------

async function currentStep(page: Page): Promise<string | null> {
  return page.getByRole("navigation", { name: "Lesson steps" }).locator('[aria-current="step"]').innerText({ timeout: WAIT }).catch(() => null);
}

async function onStep(page: Page, name: "Watch" | "Read" | "Do" | "Check"): Promise<boolean> {
  return poll(`the ${name} step`, WAIT, async () => ((await currentStep(page))?.includes(name) ? true : null)).then(
    () => true,
    () => false,
  );
}

/** The bottom Next button (the header has one too); waits until it's enabled. */
async function next(page: Page): Promise<boolean> {
  const button = page.getByTestId("v5-lesson").getByRole("button", { name: /^Next$/ }).last();
  const enabled = await poll("Next to be enabled", WAIT, async () => ((await button.isEnabled()) ? true : null)).catch(() => false);
  if (!enabled) return false;
  await button.click({ timeout: WAIT });
  return true;
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
// Learner journey
// ---------------------------------------------------------------------------

interface Counts {
  learnerOpenToStep: number | null;
  learnerWhat: string[];
  onboardAfterTyping: number | null;
  onboardFromInbox: number | null;
  onboardWhat: string[];
  approve: number | null;
  approveWhat: string[];
}
const counts: Counts = { learnerOpenToStep: null, learnerWhat: [], onboardAfterTyping: null, onboardFromInbox: null, onboardWhat: [], approve: null, approveWhat: [] };

async function learnerJourney(browser: Browser, admin: APIRequestContext): Promise<void> {
  step("learner: seed a learner with a three-lesson plan who has opened the first lesson");
  const created = await call<{ temporaryPassword: string; user: { id: string } }>(admin, "post", "/api/admin/users", {
    username: "jo.journey",
    displayName: "Jo Journey",
    profile: { roleTitle: "Frontend Engineer", yearsExperience: 1, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
    issueAssessment: false,
  });
  await call(admin, "put", `/api/admin/users/${created.user.id}/plan`, { topicIds: PLAN });

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await signIn(page, "jo.journey", created.temporaryPassword, LEARNER_NEW);
    await call(ctx.request, "put", "/api/me/ui", { v5: true });
    await call(ctx.request, "put", "/api/v5/motivation/prefs", { welcomeDone: true });
    // This week's plan may put another lesson first, so the learner "started" the code lesson before:
    // Continue then resumes it (Today prefers an unfinished lesson). Without this, the journey can't
    // reach a Do step through "Next lesson", which follows the track order.
    await call(ctx.request, "put", `/api/v5/lessons/${CODE_TOPIC}/state`, { step: "watch" });

    // -----------------------------------------------------------------------
    step("learner: open the app → Today → Continue lands inside the next step");
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await page.waitForURL((u) => u.pathname === "/learn", { timeout: WAIT }).catch(() => undefined);
    ok(new URL(page.url()).pathname === "/learn", `opening the app lands on Today (${new URL(page.url()).pathname})`);
    const continueLink = page.getByTestId("today-continue");
    const hero = (await call<{ hero: { href: string } | null }>(ctx.request, "get", "/api/v5/today")).hero;
    ok(await visible(continueLink), "Today shows the Continue hero");
    const open = await counted(async () => {
      await click(continueLink, "Today: Continue");
      await page.getByTestId("v5-lesson").waitFor({ timeout: WAIT });
    });
    counts.learnerOpenToStep = open.clicks;
    counts.learnerWhat = open.what;
    const landed = new URL(page.url());
    ok(landed.pathname === new URL(hero?.href ?? "/", BASE).pathname, `Continue opens the lesson Today names (${landed.pathname}; hero ${hero?.href})`);
    ok((await currentStep(page))?.includes("Watch"), `…inside its first step, Watch (${(await currentStep(page))?.split("\n")[0]})`);
    ok(open.clicks === 1, `open the app → inside the next step took ${open.clicks} click(s) (target 1)`);
    await shot(page, "learner-0-continue");
    // -----------------------------------------------------------------------
    // The lessons, in the order this week's plan gives them. Each step is handled as it comes, so the
    // journey doesn't depend on which lesson the plan puts first.
    const seen = { tryIt: false, doHint: false, doChecked: false, quickCheck: false, topicTest: false, nextAfterTest: false };
    type Q = { id: string; prompt: string; options: string[]; correctIndex?: number; correctIndices?: number[] };
    const keyedModule = (await call<{ topics: { id: string; quiz?: Q[] }[] }>(admin, "get", "/api/content/modules/frontend/fe-js-core")).topics;
    const servedModule = (await call<{ topics: { id: string; quiz?: Q[] }[] }>(ctx.request, "get", "/api/content/modules/frontend/fe-js-core")).topics;
    const visited: string[] = [];
    for (let lesson = 1; lesson <= PLAN.length; lesson++) {
      const topicId = new URL(page.url()).pathname.split("/").pop() ?? "";
      visited.push(topicId);
      step(`learner: lesson ${lesson}, ${topicId}`);
      await page.getByTestId("v5-lesson").waitFor({ timeout: WAIT });
      let finishedWithTest = false;
      let finished = false;
      for (let guard = 0; guard < 8 && !finished; guard++) {
        const current = (await currentStep(page)) ?? "";
        if (current.includes("Watch")) {
          ok(await visible(page.getByRole("region", { name: "Videos in this lesson" })), `${topicId} Watch: the lesson's videos are listed`);
          ok(await next(page), `${topicId} Watch: Next (warn mode)`);
          const quick = page.getByRole("dialog", { name: "Quick check" });
          if (await visible(quick, 4000)) {
            await quick.getByTestId("quick-check").waitFor({ timeout: WAIT });
            for (const group of await quick.locator("fieldset").all()) await group.locator("label").first().click();
            await quick.getByRole("button", { name: "Check my answers" }).click();
            ok(await visible(quick.getByText(/^(Right\.|Not quite\.)$/).first()), `${topicId} Watch: the quick check pops in after the video and explains its answers`);
            seen.quickCheck = true;
            await shot(page, `learner-${lesson}-quick-check`);
            await quick.getByRole("button", { name: "Continue" }).click();
          }
          ok(await onStep(page, "Read"), `${topicId}: on to Read`);
          continue;
        }
        if (current.includes("Read")) {
          ok(await visible(page.getByRole("region", { name: "Key takeaways" })), `${topicId} Read: key takeaways first`);
          if (topicId === CODE_TOPIC) {
            await page.getByRole("button", { name: "Try it" }).first().click({ timeout: WAIT });
            await page.getByRole("button", { name: "Run", exact: true }).first().click({ timeout: WAIT });
            ok(await visible(page.getByTestId("tryit-output").getByText("depth 100")), `${topicId} Read: "Try it" runs the block and prints its output`);
            seen.tryIt = true;
            await shot(page, `learner-${lesson}-read-tryit`);
          }
          await page.getByRole("button", { name: "Mark as read" }).click({ timeout: WAIT }).catch(() => undefined);
          ok(await next(page), `${topicId} Read: Next after reading`);
          await poll("the step to change", WAIT, async () => (!((await currentStep(page)) ?? "Read").includes("Read") ? true : null)).catch(() => undefined);
          continue;
        }
        if (current.includes("Do")) {
          await page.getByRole("button", { name: "Show a nudge" }).click({ timeout: WAIT });
          ok(await visible(page.getByRole("region", { name: "Hints" }).getByText(/Start with one check/)), `${topicId} Do: the hint ladder opens a nudge`);
          seen.doHint = true;
          const editor = page.locator("textarea").first();
          await editor.fill((await editor.inputValue()).replace("  // Your code here", "  return [];"));
          await page.getByRole("button", { name: "Check", exact: true }).click();
          const feedback = page.getByRole("region", { name: "Feedback" });
          ok(await visible(feedback, 60_000), `${topicId} Do: Check shows feedback`);
          ok(/Not yet|Nearly there/.test(await feedback.innerText().catch(() => "")), `${topicId} Do: a wrong answer is "Not yet" or "Nearly there"`);
          await shot(page, `learner-${lesson}-do-feedback`);
          await editor.fill((await editor.inputValue()).replace("  return [];", SOLUTION_BODY));
          await page.getByRole("button", { name: "Check", exact: true }).click();
          ok(await poll("a pass", 60_000, async () => (/That works/.test(await feedback.innerText()) ? true : null)).then(() => true, () => false), `${topicId} Do: the right solution passes`);
          seen.doChecked = true;
          finished = true;
          break;
        }
        if (current.includes("Check")) {
          const keyed = keyedModule.find((t) => t.id === topicId)?.quiz ?? [];
          const served = servedModule.find((t) => t.id === topicId)?.quiz ?? [];
          const fieldsets = page.getByTestId("v5-lesson").locator("form fieldset");
          await fieldsets.first().waitFor({ timeout: WAIT });
          ok((await fieldsets.count()) === served.length, `${topicId} Check: the topic test shows the served questions (${served.length})`);
          for (let i = 0; i < served.length; i++) {
            const q = served[i];
            const key = keyed.find((k) => k.id === q.id) ?? keyed.find((k) => k.prompt === q.prompt);
            const right = key?.correctIndices?.length ? key.correctIndices : [key?.correctIndex ?? 0];
            // Options are shown in a seeded order, so pick them by their text.
            for (const oi of right) await fieldsets.nth(i).locator("label").filter({ hasText: q.options[oi].replace(/[`*]/g, "").slice(0, 40) }).first().click();
          }
          await page.getByRole("button", { name: "Send my answers" }).click();
          const verdict = page.getByTestId("v5-lesson").getByRole("status").filter({ hasText: /right/ }).first();
          await verdict.waitFor({ timeout: WAIT }).catch(() => undefined);
          const result = await verdict.innerText().catch(() => "");
          ok(/Passed/.test(result), `${topicId} Check: the topic test passes (${result.split("\n")[0]})`);
          seen.topicTest = true;
          finishedWithTest = true;
          await shot(page, `learner-${lesson}-check-passed`);
          finished = true;
          break;
        }
        ok(false, `${topicId}: an unknown step "${current}"`);
        break;
      }
      ok(await visible(page.getByText("Lesson finished").first()), `${topicId}: the lesson is finished`);
      await page.keyboard.press("Escape");
      const nextLesson = page.getByRole("link", { name: /Next lesson/ });
      if (!(await visible(nextLesson))) {
        ok(false, `${topicId}: Next lesson is offered`);
        break;
      }
      const from = new URL(page.url()).pathname;
      const fromTitle = await page.getByRole("heading", { level: 1 }).first().innerText().catch(() => "");
      await nextLesson.click();
      await page.waitForURL((u) => u.pathname !== from && u.pathname.startsWith("/learn/lesson/"), { timeout: WAIT }).catch(() => undefined);
      const to = new URL(page.url()).pathname;
      ok(to !== from && to.startsWith("/learn/lesson/"), `${topicId}: Next lesson opens the next lesson (${to})`);
      // The player is reused across lessons: wait for the new lesson's title before reading its stepper.
      await poll("the next lesson to render", WAIT, async () => ((await page.getByRole("heading", { level: 1 }).first().innerText().catch(() => fromTitle)) !== fromTitle ? true : null)).catch(() => undefined);
      await page.waitForLoadState("networkidle", { timeout: WAIT }).catch(() => undefined);
      if (finishedWithTest) seen.nextAfterTest = true;
      if (seen.tryIt && seen.doChecked && seen.quickCheck && seen.topicTest && seen.nextAfterTest) {
        await page.getByTestId("v5-lesson").waitFor({ timeout: WAIT }).catch(() => undefined);
        await shot(page, `learner-${lesson + 1}-next-lesson`);
        break;
      }
    }
    note(`lessons in order: ${visited.join(" → ")}`);
    ok(seen.quickCheck, "the journey met the Watch quick check");
    ok(seen.tryIt, 'the journey ran a Read "Try it" block');
    ok(seen.doHint && seen.doChecked, "the journey used a Do hint and Check");
    ok(seen.topicTest, "the journey passed a topic test on the Check step");
    ok(seen.nextAfterTest, "after a topic test, Next lesson opened the next lesson");

    const progress = await call<{ progress?: Record<string, { status: string }> } | Record<string, unknown>>(ctx.request, "get", "/api/me/progress").catch(() => null);
    if (progress) note(`progress after the journey: ${JSON.stringify(progress).slice(0, 160)}`);
    ok(errors.length === 0, `no page errors (${errors.slice(0, 3).join(" | ")})`);
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// Admin journey (from v5-admin.ts)
// ---------------------------------------------------------------------------

const PROFILE = { roleTitle: "Frontend Engineer", yearsExperience: 2, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] };

interface Seeded {
  rahulId: string;
  reviewId: string;
  courseId: string;
}

async function seedAdmin(admin: APIRequestContext, dataDir: string): Promise<Seeded> {
  await call(admin, "post", "/api/admin/users", { username: "rahul.verma", displayName: "Rahul Verma", profile: PROFILE, issueAssessment: false });
  await call(admin, "post", "/api/admin/users", { username: "sana.iqbal", displayName: "Sana Iqbal", profile: PROFILE, issueAssessment: false });
  const { users } = await call<{ users: { id: string; username: string }[] }>(admin, "get", "/api/admin/users");
  const rahulId = users.find((u) => u.username === "rahul.verma")!.id;
  const stuckId = users.find((u) => u.username === "sana.iqbal")!.id;
  const course = (await call<{ course: { id: string } }>(admin, "post", "/api/admin/courses", { title: "How we ship", summary: "Our release steps.", accent: "glacier", audience: "everyone", published: false })).course;
  const withSection = (await call<{ course: { sections: { id: string }[] } }>(admin, "post", `/api/admin/courses/${course.id}/sections`, { title: "Basics", summary: "" })).course;
  await call(admin, "post", `/api/admin/courses/sections/${withSection.sections[0]!.id}/topics`, { title: "Release day", body: "We ship on **Tuesdays**.\n\n- Tag the build\n- Tell the team", links: [], estMinutes: 10 });

  // Things that would normally take a test and a week to happen, written straight into the database.
  const db = new Database(path.join(dataDir, "oyelearn.db"));
  try {
    db.pragma("busy_timeout = 5000");
    const reviewId = `e2e-review-${Date.now().toString(36)}`;
    const now = Date.now();
    db.prepare("INSERT INTO review_requests (id, user_id, source, ref_id, status, learner_note, created_at) VALUES (?, ?, 'assessment_item', 'e2e-missing-item', 'open', 'I think my answer was right', ?)").run(reviewId, rahulId, now - 3 * DAY);
    db.prepare("INSERT INTO learning_plans (id, user_id, version, source, topic_ids, published_at) VALUES (?, ?, 1, 'admin', ?, ?)").run(`e2e-plan-${stuckId}`, stuckId, JSON.stringify(["js-execution-context", "js-call-stack", "js-hoisting"]), now - 20 * DAY);
    db.prepare("INSERT INTO topic_progress (user_id, topic_id, status, attempts, completed_at, updated_at) VALUES (?, 'js-execution-context', 'completed', 1, ?, ?)").run(stuckId, now - 10 * DAY, now - 10 * DAY);
    db.prepare("INSERT INTO problem_reports (id, user_id, topic_id, step, message, status, created_at) VALUES (?, ?, 'js-call-stack', 'watch', 'The video stops halfway.', 'open', ?)").run(`e2e-problem-${now}`, stuckId, now - DAY);
    return { rahulId, reviewId, courseId: course.id };
  } finally {
    db.close();
  }
}

async function visit(page: Page, route: string): Promise<void> {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: WAIT });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: WAIT });
  await page.waitForLoadState("networkidle", { timeout: WAIT }).catch(() => undefined);
  await page.waitForTimeout(300);
}

async function adminJourney(page: Page, admin: APIRequestContext, s: Seeded): Promise<void> {
  // -------------------------------------------------------------------------
  step("admin: approve a review request from the inbox");
  await visit(page, "/admin");
  ok(await page.getByRole("heading", { level: 1, name: "Needs your attention" }).isVisible(), "the inbox is the admin home");
  const reviews = page.getByRole("region", { name: /Asked to check an answer again/ });
  ok(await reviews.isVisible().catch(() => false), "the review request is in the inbox");
  await shot(page, "admin-01-inbox");
  const approve = await counted(async () => {
    await click(reviews.getByRole("button", { name: /^Give full marks/ }).first(), "Inbox: Give full marks");
    await page.getByText("Full marks given").first().waitFor({ timeout: WAIT });
  });
  counts.approve = approve.clicks;
  counts.approveWhat = approve.what;
  ok(approve.clicks === 1, `approving a review request took ${approve.clicks} click(s) (target 1)`);
  const decided = await poll("the decision", WAIT, async () => {
    const { requests } = await call<{ requests: { id: string; status: string }[] }>(admin, "get", "/api/admin/review-requests?status=all");
    const r = requests.find((x) => x.id === s.reviewId);
    return r && r.status !== "open" ? r.status : null;
  }).catch(() => null);
  ok(decided === "overridden", `the server has the decision ("${decided}")`);

  // -------------------------------------------------------------------------
  step("admin: onboard someone and send the test (typing not counted)");
  await visit(page, "/admin");
  let afterTyping = 0;
  const onboard = await counted(async () => {
    await click(page.getByRole("link", { name: "Onboard", exact: true }).first(), "Inbox nav: Onboard");
    await page.getByRole("radiogroup", { name: "Department" }).waitFor({ timeout: WAIT });
    await page.getByLabel("Full name").fill("Priya Sharma");
    await page.getByLabel("Describe them in one line").fill("Frontend dev, 2 yrs React, weak on Git, we want her doing backend + AI-driven work");
    const typed = clicks;
    await click(page.getByRole("button", { name: "Suggest", exact: true }), "Onboard: Suggest");
    const card = page.getByRole("region", { name: /^Here's the plan/ });
    await card.waitFor({ timeout: 60_000 });
    await poll("the test preview", 30_000, async () => ((await card.innerText()).includes("Working it out") ? null : true), 300);
    await shot(page, "admin-02-onboard-plan");
    await click(card.getByRole("button", { name: "Looks good — send the test" }), "Onboard: Looks good — send the test");
    await page.getByRole("status").filter({ hasText: "Account created for Priya Sharma" }).waitFor({ timeout: 60_000 });
    afterTyping = clicks - typed;
  });
  counts.onboardFromInbox = onboard.clicks;
  counts.onboardAfterTyping = afterTyping;
  counts.onboardWhat = onboard.what;
  ok(afterTyping <= 3, `onboard + send took ${afterTyping} click(s) after typing (target ≤ 3); ${onboard.clicks} from the inbox`);
  const { users } = await call<{ users: { username: string; assessmentStatus: string | null }[] }>(admin, "get", "/api/admin/users");
  const priya = users.find((u) => u.username.startsWith("priya"));
  ok(priya && priya.assessmentStatus !== null, `Priya's test was sent (status ${priya?.assessmentStatus ?? "none"})`);

  // -------------------------------------------------------------------------
  step("admin: People → the side sheet");
  await visit(page, "/admin/people");
  await page.getByRole("cell", { name: /Rahul Verma/ }).first().click({ timeout: WAIT });
  const sheet = page.getByRole("dialog", { name: "Rahul Verma" });
  ok(await visible(sheet), "a row opens the side sheet");
  ok(new URL(page.url()).searchParams.get("person") === s.rahulId, "the URL keeps ?person=id");
  ok(await visible(sheet.getByRole("heading", { name: "Recent activity" })), "the sheet shows recent activity");
  ok(await sheet.getByRole("link", { name: /Open full page/ }).isVisible().catch(() => false), "the full page is one click away");
  await shot(page, "admin-03-people-sheet");
  await page.keyboard.press("Escape");

  // -------------------------------------------------------------------------
  step("admin: edit a course block in the editor and save");
  await visit(page, `/admin/library/${s.courseId}/edit`);
  const editor = page.getByRole("textbox", { name: "Lesson content" });
  await editor.waitFor({ timeout: WAIT });
  ok((await editor.innerText()).includes("Tuesdays"), "the lesson text loaded into the editor");
  await editor.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Ask in #releases if you are unsure.");
  const save = page.getByRole("button", { name: "Save", exact: true });
  await poll("Save to be ready", WAIT, async () => ((await save.isEnabled()) ? true : null), 200).catch(() => undefined);
  await save.click({ timeout: WAIT });
  ok(await visible(page.getByText(/Saved\. This is version \d+/).first()), "the editor says it saved a new version");
  const course = await call<{ course: { sections: { topics: { body: string }[] }[] } }>(admin, "get", `/api/admin/courses/${s.courseId}`);
  ok(course.course.sections[0]!.topics[0]!.body.includes("Ask in #releases"), "the server has the edited block");
  await shot(page, "admin-04-editor-saved");

  // -------------------------------------------------------------------------
  step("admin: export a report CSV");
  await visit(page, "/admin/reports");
  await page.getByRole("heading", { name: "Lessons finished" }).first().waitFor({ timeout: WAIT });
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: WAIT }), page.getByRole("button", { name: "Download CSV" }).click()]);
  const file = await download.path().catch(() => null);
  const text = file ? fs.readFileSync(file, "utf8") : "";
  ok(/^oyelearn-report-.*\.csv$/.test(download.suggestedFilename()), `the download is ${download.suggestedFilename()}`);
  ok(text.startsWith("Measure,Value") && text.includes("Day,Lessons finished,Hours learned,AI cost (USD)"), `the CSV has the summary and the day rows (${text.split("\n").length} lines)`);
  await shot(page, "admin-05-reports");
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  fs.rmSync(SHOTS, { recursive: true, force: true });
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v5journeys-"));
  await startServer(dataDir, contentFixture(dataDir));
  const browser = await chromium.launch({ headless: !HEADED });
  let adminCtx: BrowserContext | null = null;
  try {
    adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    const page = await adminCtx.newPage();
    page.on("pageerror", (e) => note(`[pageerror admin] ${e.message.split("\n")[0]}`));
    await signIn(page, SUPER_USER, SUPER_INITIAL, SUPER_NEW);
    await call(page.request, "put", "/api/me/ui", { v5: true });
    await call(page.request, "put", "/api/v5/motivation/prefs", { welcomeDone: true }).catch(() => undefined);
    // The v4.3 lock would hold Next until every video is watched; warn mode lets the run move on.
    await call(page.request, "put", "/api/admin/video-settings", { lockMode: "warn" });

    if (ONLY !== "admin") await learnerJourney(browser, page.request);
    if (ONLY !== "learner") {
      const s = await seedAdmin(page.request, dataDir);
      await adminJourney(page, page.request, s);
    }
  } finally {
    await adminCtx?.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
    stopServer();
  }

  console.log("\nClick counts (typing and waiting not counted):");
  console.log(`  learner: open the app → inside the next step: ${counts.learnerOpenToStep ?? "n/a"} (target 1, baseline 1) [${counts.learnerWhat.join(" → ")}]`);
  console.log(`  admin: onboard + send the test: ${counts.onboardAfterTyping ?? "n/a"} after typing (target ≤ 3), ${counts.onboardFromInbox ?? "n/a"} from the inbox (baseline 3) [${counts.onboardWhat.join(" → ")}]`);
  console.log(`  admin: approve a review request: ${counts.approve ?? "n/a"} (target 1, baseline 2) [${counts.approveWhat.join(" → ")}]`);
  if (process.env.E2E_WRITE_CLICKS === "1") {
    const out = path.join(process.env.TEMP ?? os.tmpdir(), "claude", "v5-journeys-clicks.json");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(counts, null, 2));
    console.log(`  written to ${out}`);
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
