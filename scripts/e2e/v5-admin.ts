/**
 * Oyelearn v5 Phase 7: the admin console, through the real UI.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh admin)     # a private built copy (never the shared dist/)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/v5-admin.ts
 *   bash scripts/e2e/snapshot-build.sh --remove admin
 *
 * 1. The inbox: "Give full marks" on a review request takes 1 click and the request is decided.
 * 2. Onboard + send the test from the inbox: ≤ 3 clicks after typing (counted like v43-clicks).
 * 3. People: a row opens the side sheet and the URL keeps ?person=id.
 * 4. ⌘K / Ctrl+K finds a person by name and opens them.
 * 5. The block editor: edit a lesson, save, and a new version appears in Version history.
 * 6. Reports: Download CSV gives a file with the summary and the day rows.
 * 7. axe (WCAG 2.2 AA + best practice): 0 serious/critical at 768 and 1440 in light and dark on every
 *    v5 admin route, plus the inbox and the people sheet at 390.
 * Screenshots: %TEMP%/claude/e2e-shots-v5-admin.
 *
 * Throwaway DATA_DIR under %TEMP%, port 8824, the deterministic mock AI (NODE_ENV=development).
 * Exits non-zero when any assertion fails, and always stops its server.
 * Helpers are copied from v5-foundation.ts on purpose, so no script's changes can break another.
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
const PORT = Number(process.env.E2E_PORT ?? 8824);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const HEADED = process.env.E2E_HEADED === "1";
const WAIT = 20_000;
const SHOTS = path.join(os.tmpdir(), "claude", "e2e-shots-v5-admin");
const DAY = 86_400_000;

const failures: string[] = [];
function ok(cond: unknown, message: string): boolean {
  console.log(`    ${cond ? "\u001b[32mok\u001b[0m  " : "\u001b[31mFAIL\u001b[0m"} ${message}`);
  if (!cond) failures.push(message);
  return Boolean(cond);
}
function step(message: string): void {
  console.log(`  - ${message}`);
}

let clicks = 0;
async function click(locator: Locator): Promise<void> {
  clicks += 1;
  await locator.click({ timeout: WAIT });
}
async function counted<T>(fn: () => Promise<T>): Promise<{ result: T; clicks: number }> {
  const start = clicks;
  const result = await fn();
  return { result, clicks: clicks - start };
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
  reviewId: string;
  courseId: string;
}

async function seed(admin: APIRequestContext, dataDir: string): Promise<Seeded> {
  await sendJson(admin, "post", "/api/admin/users", { username: "rahul.verma", displayName: "Rahul Verma", profile: PROFILE, issueAssessment: false });
  await sendJson(admin, "post", "/api/admin/users", { username: "sana.iqbal", displayName: "Sana Iqbal", profile: PROFILE, issueAssessment: false });
  const { users } = await getJson<{ users: { id: string; username: string }[] }>(admin, "/api/admin/users");
  const rahulId = users.find((u) => u.username === "rahul.verma")!.id;
  const stuckId = users.find((u) => u.username === "sana.iqbal")!.id;

  const course = (await sendJson<{ course: { id: string } }>(admin, "post", "/api/admin/courses", { title: "How we ship", summary: "Our release steps.", accent: "glacier", audience: "everyone", published: false })).course;
  const withSection = (await sendJson<{ course: { sections: { id: string }[] } }>(admin, "post", `/api/admin/courses/${course.id}/sections`, { title: "Basics", summary: "" })).course;
  await sendJson(admin, "post", `/api/admin/courses/sections/${withSection.sections[0]!.id}/topics`, { title: "Release day", body: "We ship on **Tuesdays**.\n\n- Tag the build\n- Tell the team", links: [], estMinutes: 10 });

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
    return { rahulId, stuckId, reviewId, courseId: course.id };
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// axe and screenshots
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

async function shot(page: Page, name: string): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true }).catch(() => undefined);
}

async function visit(page: Page, route: string): Promise<void> {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: WAIT });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: WAIT });
  await settle(page);
}

// ---------------------------------------------------------------------------
// Journeys
// ---------------------------------------------------------------------------

async function inboxJourney(page: Page, admin: APIRequestContext, s: Seeded): Promise<void> {
  step("inbox: give full marks in one click");
  await visit(page, "/admin");
  ok(await page.getByRole("heading", { level: 1, name: "Needs your attention" }).isVisible(), "the inbox is the admin home");
  const reviews = page.getByRole("region", { name: /Asked to check an answer again/ });
  ok(await reviews.isVisible().catch(() => false), "review requests are grouped");
  ok(await page.getByRole("region", { name: /Learners who are stuck/ }).isVisible().catch(() => false), "the stuck learner is in the inbox");
  ok(await page.getByRole("region", { name: /Problems learners reported/ }).isVisible().catch(() => false), "the reported problem is in the inbox");
  await shot(page, "inbox-1440-light");
  const run = await counted(async () => {
    await click(reviews.getByRole("button", { name: /^Give full marks/ }).first());
    await page.getByText("Full marks given").first().waitFor({ timeout: WAIT });
  });
  ok(run.clicks === 1, `approving a review request took ${run.clicks} click(s) (target 1)`);
  const decided = await poll("the decision", WAIT, async () => {
    const { requests } = await getJson<{ requests: { id: string; status: string }[] }>(admin, "/api/admin/review-requests?status=all");
    const r = requests.find((x) => x.id === s.reviewId);
    return r && r.status !== "open" ? r.status : null;
  });
  ok(decided === "overridden", `the review request is now "${decided}"`);
  ok(!(await reviews.isVisible().catch(() => false)), "the item left the inbox (the group is gone)");

  step("inbox: mark a stuck learner as checked, then Undo");
  const stuck = page.getByRole("region", { name: /Learners who are stuck/ });
  await stuck.getByRole("button", { name: /^Mark as checked/ }).first().click({ timeout: WAIT });
  ok(!(await stuck.isVisible().catch(() => false)), "it leaves the list at once");
  await page.getByRole("button", { name: "Undo" }).first().click({ timeout: WAIT });
  await stuck.waitFor({ state: "visible", timeout: WAIT });
  ok(true, "Undo puts it back");
}

async function onboardJourney(page: Page, admin: APIRequestContext): Promise<number> {
  step("onboard someone and send the test from the inbox");
  await visit(page, "/admin");
  const run = await counted(async () => {
    await click(page.getByRole("link", { name: "Onboard", exact: true }).first());
    await page.getByRole("radiogroup", { name: "Department" }).waitFor({ timeout: WAIT });
    await page.getByLabel("Full name").fill("Priya Sharma");
    await page.getByLabel("Describe them in one line").fill("Frontend dev, 2 yrs React, weak on Git, we want her doing backend + AI-driven work");
    await click(page.getByRole("button", { name: "Suggest", exact: true }));
    const card = page.getByRole("region", { name: /^Here's the plan/ });
    await card.waitFor({ timeout: 60_000 });
    await poll("the test preview", 30_000, async () => ((await card.innerText()).includes("Working it out") ? null : true), 300);
    await shot(page, "onboard-plan-1440-light");
    await click(card.getByRole("button", { name: "Looks good — send the test" }));
    await page.getByRole("status").filter({ hasText: "Account created for Priya Sharma" }).waitFor({ timeout: 60_000 });
  });
  ok(run.clicks <= 3, `onboard + send took ${run.clicks} click(s) from the inbox, typing not counted (target ≤ 3)`);
  const { users } = await getJson<{ users: { username: string; assessmentStatus: string | null }[] }>(admin, "/api/admin/users");
  const priya = users.find((u) => u.username.startsWith("priya"));
  ok(priya && priya.assessmentStatus !== null, `Priya's test was sent (status ${priya?.assessmentStatus ?? "none"})`);
  return run.clicks;
}

async function peopleJourney(page: Page, s: Seeded): Promise<void> {
  step("people: a row opens the side sheet");
  await visit(page, "/admin/people");
  await page.getByRole("cell", { name: /Rahul Verma/ }).first().click({ timeout: WAIT });
  const sheet = page.getByRole("dialog", { name: "Rahul Verma" });
  await sheet.waitFor({ timeout: WAIT });
  ok(new URL(page.url()).searchParams.get("person") === s.rahulId, "the URL keeps ?person=id");
  ok(await page.getByRole("table").first().isVisible(), "the list stays visible beside the sheet");
  await sheet.getByRole("heading", { name: "Recent activity" }).waitFor({ timeout: WAIT });
  ok(await sheet.getByRole("link", { name: /Open full page/ }).isVisible(), "the full page is one click away");
  await shot(page, "people-sheet-1440-light");
  await page.keyboard.press("Escape");
}

async function paletteJourney(page: Page, s: Seeded): Promise<void> {
  step("Ctrl+K finds a person");
  await visit(page, "/admin");
  await page.keyboard.press("Control+K");
  const input = page.getByPlaceholder(/Type a name/);
  await input.waitFor({ timeout: WAIT });
  await input.fill("Rahul");
  const option = page.getByRole("option", { name: /Rahul Verma/ });
  await option.waitFor({ timeout: WAIT });
  ok(true, "the palette lists Rahul Verma");
  await shot(page, "palette-1440-light");
  // The person is the best match, so Enter picks them.
  await poll("Rahul to be the highlighted match", WAIT, async () => ((await option.getAttribute("aria-selected")) === "true" ? true : null), 200).catch(() => undefined);
  await page.keyboard.press("Enter");
  const landed = await poll("People with his sheet", WAIT, async () => {
    const u = new URL(page.url());
    return u.pathname === "/admin/people" && u.searchParams.get("person") === s.rahulId ? true : null;
  }).catch(() => false);
  ok(landed, `Enter opens his side sheet on People (at ${page.url()})`);
  await page.getByRole("dialog", { name: "Rahul Verma" }).waitFor({ timeout: WAIT });
}

async function editorJourney(page: Page, admin: APIRequestContext, s: Seeded): Promise<void> {
  step("edit a course block and see a new version");
  await visit(page, `/admin/library/${s.courseId}/edit`);
  const editor = page.getByRole("textbox", { name: "Lesson content" });
  await editor.waitFor({ timeout: WAIT });
  ok((await editor.innerText()).includes("Tuesdays"), "the lesson text loaded into the editor");
  await editor.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Ask in #releases if you are unsure.");
  await page.getByRole("button", { name: "Add Quick check" }).or(page.getByRole("button", { name: "Quick check", exact: true })).first().click({ timeout: WAIT });
  const quiz = page.getByRole("region", { name: "Quick check" });
  await quiz.getByLabel("Question").fill("Which day do we ship?");
  await quiz.getByRole("textbox", { name: "Answer 1", exact: true }).fill("Monday");
  await quiz.getByRole("textbox", { name: "Answer 2", exact: true }).fill("Tuesday");
  await quiz.getByRole("checkbox", { name: "Answer 1 is right" }).uncheck();
  await quiz.getByRole("checkbox", { name: "Answer 2 is right" }).check();
  await shot(page, "editor-1440-light");
  const save = page.getByRole("button", { name: "Save", exact: true });
  await poll("Save to be ready", WAIT, async () => ((await save.isEnabled()) ? true : null), 200);
  await save.click({ timeout: WAIT });
  await page.getByText(/Saved\. This is version \d+/).first().waitFor({ timeout: WAIT });
  const course = await getJson<{ course: { sections: { topics: { body: string }[] }[] } }>(admin, `/api/admin/courses/${s.courseId}`);
  const body = course.course.sections[0]!.topics[0]!.body;
  ok(body.includes("Ask in #releases") && body.includes("```quiz") && body.includes("Which day do we ship?"), `the saved lesson has the new text and the quick check${body.includes("```quiz") ? "" : ` (saved: ${JSON.stringify(body)})`}`);
  const { versions } = await getJson<{ versions: { version: number }[] }>(admin, `/api/admin/v5/courses/${s.courseId}/versions`);
  ok(versions.length >= 1, `the course has ${versions.length} version(s)`);
  await page.getByRole("button", { name: "Version history" }).click();
  const history = page.getByRole("dialog", { name: "Version history" });
  await history.getByText(`Version ${versions[0]!.version}`, { exact: true }).waitFor({ timeout: WAIT });
  ok(true, `Version history shows version ${versions[0]!.version}`);
  await shot(page, "editor-history-1440-light");
  await page.keyboard.press("Escape");
}

async function reportsJourney(page: Page): Promise<void> {
  step("export a report CSV");
  await visit(page, "/admin/reports");
  await page.getByRole("heading", { name: "Lessons finished" }).first().waitFor({ timeout: WAIT });
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: WAIT }), page.getByRole("button", { name: "Download CSV" }).click()]);
  const file = await download.path();
  const text = file ? fs.readFileSync(file, "utf8") : "";
  ok(download.suggestedFilename().startsWith("oyelearn-report-") && download.suggestedFilename().endsWith(".csv"), `the file is ${download.suggestedFilename()}`);
  ok(text.startsWith("Measure,Value") && text.includes("Day,Lessons finished,Hours learned,AI cost (USD)"), "it has the summary and the day rows");
  await shot(page, "reports-1440-light");
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function axeSweep(browser: Browser, storage: string, s: Seeded): Promise<void> {
  const routes = [
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
  for (const width of [768, 1440] as const) {
    for (const theme of ["light", "dark"] as const) {
      step(`axe at ${width} ${theme}`);
      const ctx = await browser.newContext({ storageState: storage, viewport: { width, height: 900 }, colorScheme: theme });
      const page = await ctx.newPage();
      for (const route of routes) {
        await visit(page, route);
        if (route.includes("person=")) await page.getByRole("dialog").first().waitFor({ timeout: WAIT }).catch(() => undefined);
        await axe(page, `${route} ${width} ${theme}`);
        if (width === 1440 && theme === "dark") await shot(page, `${route.replace(/[/?=]+/g, "_").replace(/^_/, "") || "admin"}-1440-dark`);
      }
      await ctx.close();
    }
  }
  step("axe on the open dialogs: the palette and a new announcement");
  {
    const ctx = await browser.newContext({ storageState: storage, viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await visit(page, "/admin/announcements?new=1");
    await page.getByRole("dialog", { name: "Write an announcement" }).waitFor({ timeout: WAIT });
    await page.getByRole("radio", { name: "Some departments" }).check();
    await axe(page, "announcement dialog 1440 light");
    await shot(page, "announcement-dialog-1440-light");
    await visit(page, "/admin");
    await page.keyboard.press("Control+K");
    await page.getByPlaceholder(/Type a name/).waitFor({ timeout: WAIT });
    await axe(page, "palette 1440 light");
    await ctx.close();
  }
  step("axe at 390 (phone): inbox and people lookup");
  for (const theme of ["light", "dark"] as const) {
    const ctx = await browser.newContext({ storageState: storage, viewport: { width: 390, height: 844 }, colorScheme: theme, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await visit(page, "/admin");
    await axe(page, `/admin 390 ${theme}`);
    await shot(page, `inbox-390-${theme}`);
    await visit(page, `/admin/people?person=${s.rahulId}`);
    await page.getByRole("dialog").first().waitFor({ timeout: WAIT }).catch(() => undefined);
    await axe(page, `/admin/people?person 390 ${theme}`);
    await shot(page, `people-sheet-390-${theme}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(overflow <= 1, `no sideways scroll on the phone (${overflow}px)`);
    await ctx.close();
  }
}

async function main(): Promise<void> {
  fs.rmSync(SHOTS, { recursive: true, force: true });
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v5admin-"));
  console.log(`app: ${APP}`);
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: !HEADED });
  let context: BrowserContext | null = null;
  try {
    context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    const page = await context.newPage();
    await signIn(page, SUPER_USER, SUPER_INITIAL, SUPER_NEW);
    await sendJson(page.request, "put", "/api/me/ui", { v5: true });
    const s = await seed(page.request, dataDir);
    const storage = path.join(dataDir, "admin-state.json");
    await context.storageState({ path: storage });

    await inboxJourney(page, page.request, s);
    const onboardClicks = await onboardJourney(page, page.request);
    await peopleJourney(page, s);
    await paletteJourney(page, s);
    await editorJourney(page, page.request, s);
    await reportsJourney(page);
    await visit(page, "/admin/overview");
    await shot(page, "overview-1440-light");

    await axeSweep(browser, storage, s);
    console.log(`\nClick counts: give full marks 1 (baseline 2) · onboard + send ${onboardClicks} (baseline 3)`);
  } finally {
    await context?.close().catch(() => undefined);
    await browser.close();
    stopServer();
  }
  console.log(`screenshots: ${SHOTS}`);
  console.log(failures.length ? `\n${failures.length} failure(s):\n - ${failures.join("\n - ")}` : "\nall checks passed");
  process.exit(failures.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
