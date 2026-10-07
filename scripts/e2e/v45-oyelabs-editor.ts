/**
 * Oyelearn v4.5 Phase 1: "Add an Oyelabs course", through the real UI.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh p45a)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/v45-oyelabs-editor.ts
 *   bash scripts/e2e/snapshot-build.sh --remove p45a
 *
 * 1. Admin -> Library -> "Add Oyelabs course": Project Management, title, level, 2 modules with notes.
 * 2. Autosave: "Saved hh:mm" appears, and a reload brings everything back.
 * 3. Save & publish: live with 2 modules; the admin library shows the Oyelabs badge.
 * 4. A PM learner sees it in their library with the badge; an Engineering learner doesn't.
 * 5. Edit (rename module 1) -> a new version; the PM learner's progress on module 1 is kept.
 * 6. axe (WCAG 2.2 AA + best practice): 0 serious/critical on the editor at 390 and 1440.
 * Throwaway DATA_DIR under %TEMP%, port 8845, mock AI. Exits non-zero when any check fails.
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
const PORT = Number(process.env.E2E_PORT ?? 8845);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const HEADED = process.env.E2E_HEADED === "1";
const WAIT = 20_000;
const SHOTS = path.join(os.tmpdir(), "claude", "e2e-shots-v45-oyelabs-editor");

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

/**
 * A signed-in context at one size and theme. The storage state carries the app's saved theme
 * (localStorage `oyelabs-ui`), which wins over Playwright's colorScheme, so the theme is written
 * before every page load (as in v5-mobile-admin.ts). Before Phase 9.1 the "dark" passes here ran in
 * light.
 */
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
// Journey
// ---------------------------------------------------------------------------

interface CourseView {
  id: string;
  published: boolean;
  version: number;
  modules: { id: string; topicId: string; title: string }[];
}

async function newLearner(admin: APIRequestContext, username: string, displayName: string): Promise<{ id: string; password: string }> {
  const r = await sendJson<{ user: { id: string }; temporaryPassword: string }>(admin, "post", "/api/admin/users", {
    username,
    displayName,
    profile: { roleTitle: "Project coordinator", yearsExperience: 1, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
    issueAssessment: false,
  });
  return { id: r.user.id, password: r.temporaryPassword };
}

function sql(dataDir: string, fn: (db: Database.Database) => void): void {
  const db = new Database(path.join(dataDir, "oyelearn.db"));
  try {
    db.pragma("busy_timeout = 5000");
    fn(db);
  } finally {
    db.close();
  }
}

async function learnerSees(browser: Browser, username: string, password: string, title: string): Promise<{ card: boolean; badge: boolean }> {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  try {
    const page = await ctx.newPage();
    await signIn(page, username, password, "Trail-Head-4471-Lq!");
    await sendJson(page.request, "put", "/api/me/ui", { v5: true });
    await visit(page, "/learn/library");
    const card = page.getByTestId("library-card").filter({ hasText: title });
    const visible = (await card.count()) > 0;
    const badge = visible ? await card.first().getByTestId("oyelabs-badge").isVisible() : false;
    await shot(page, `learner-${username}`);
    return { card: visible, badge };
  } finally {
    await ctx.close();
  }
}

async function main(): Promise<void> {
  fs.rmSync(SHOTS, { recursive: true, force: true });
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v45a-"));
  console.log(`app: ${APP}`);
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: !HEADED });
  let context: BrowserContext | null = null;
  try {
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await signIn(page, SUPER_USER, SUPER_INITIAL, SUPER_NEW);
    await sendJson(page.request, "put", "/api/me/ui", { v5: true });
    const pm = await newLearner(page.request, "pm.learner", "Meera Joshi");
    const eng = await newLearner(page.request, "eng.learner", "Arjun Rao");
    sql(dataDir, (db) => {
      db.prepare("UPDATE learner_profiles SET department_id = 'pm' WHERE user_id = ?").run(pm.id);
      db.prepare("UPDATE learner_profiles SET department_id = 'engineering' WHERE user_id = ?").run(eng.id);
    });
    const storage = path.join(dataDir, "admin-state.json");
    await context.storageState({ path: storage });

    step("Library → Add Oyelabs course");
    await visit(page, "/admin/library");
    await page.getByRole("link", { name: "Add Oyelabs course" }).click({ timeout: WAIT });
    await page.waitForURL(/\/admin\/library\/oyelabs\/new/, { timeout: WAIT });
    await page.getByRole("heading", { level: 1, name: "Add an Oyelabs course" }).waitFor({ timeout: WAIT });
    ok(true, "the editor opens on one page");

    step("departments, title, level, two modules with notes");
    await page.getByRole("group", { name: "Who it's for" }).getByRole("button", { name: "Project Management" }).click({ timeout: WAIT });
    ok((await page.getByRole("button", { name: "All departments" }).getAttribute("aria-pressed")) === "false", "picking a department turns off All departments");
    await page.getByLabel("Title", { exact: true }).fill("White-label delivery");
    await page.getByLabel(/Short description/).fill("How we deliver white-label projects for agency partners.");
    await page.getByRole("radio", { name: "Intermediate" }).check({ timeout: WAIT });
    const modules = page.getByTestId("oyelabs-module");
    await modules.nth(0).getByLabel("Module title").fill("Kick-off");
    await modules.nth(0).getByRole("textbox", { name: /Notes/ }).click();
    await page.keyboard.type("Agree the scope and the handover date in the first call.");
    await page.getByRole("button", { name: "Add module" }).click();
    await modules.nth(1).getByLabel("Module title").fill("Handover");
    await modules.nth(1).getByRole("textbox", { name: /Notes/ }).click();
    await page.keyboard.type("Hand over the repository and the credentials list.");
    ok((await modules.count()) === 2, "two modules on the page");

    step("autosave, then reload");
    const status = page.getByTestId("autosave-status");
    await poll("autosave", WAIT, async () => ((await status.textContent())?.startsWith("Saved") ? true : null));
    ok(/\?draft=/.test(page.url()), `the draft is in the address (${page.url()})`);
    await shot(page, "editor-new-1440");
    await axe(page, "editor (new) 1440");
    await page.reload({ waitUntil: "domcontentloaded" });
    const title = page.getByLabel("Title", { exact: true });
    await title.waitFor({ timeout: WAIT });
    await poll("restored title", WAIT, async () => ((await title.inputValue()) === "White-label delivery" ? true : null));
    ok((await modules.count()) === 2, "both modules came back after the reload");
    ok((await modules.nth(1).getByLabel("Module title").inputValue()) === "Handover", "module 2's title came back");
    await poll("restored notes", WAIT, async () => (((await modules.nth(0).getByRole("textbox", { name: /Notes/ }).textContent()) ?? "").includes("Agree the scope") ? true : null));
    ok(true, "module 1's notes came back");
    ok(await page.getByRole("radio", { name: "Intermediate" }).isChecked(), "the level came back");

    step("Save & publish");
    await page.getByRole("button", { name: "Save & publish" }).click();
    await page.waitForURL(/\/admin\/library\/[^/]+\/oyelabs$/, { timeout: WAIT });
    const courseId = decodeURIComponent(new URL(page.url()).pathname.split("/")[3]!);
    const v1 = await getJson<CourseView>(page.request, `/api/admin/oyelabs/courses/${courseId}`);
    ok(v1.published && v1.modules.length === 2 && v1.version === 1, `published with 2 modules, version ${v1.version}`);
    await visit(page, "/admin/library");
    const adminCard = page.locator("li").filter({ hasText: "White-label delivery" }).first();
    ok(await adminCard.getByText("Oyelabs", { exact: true }).isVisible(), "the admin library card has the Oyelabs badge");

    step("learners: PM sees it with the badge, Engineering doesn't");
    const pmSees = await learnerSees(browser, "pm.learner", pm.password, "White-label delivery");
    ok(pmSees.card && pmSees.badge, `the PM learner sees it with the badge (card ${pmSees.card}, badge ${pmSees.badge})`);
    const engSees = await learnerSees(browser, "eng.learner", eng.password, "White-label delivery");
    ok(!engSees.card, "the Engineering learner doesn't see it");

    step("edit: a new version, progress kept");
    const topic1 = v1.modules[0]!.topicId;
    sql(dataDir, (db) => {
      db.prepare("INSERT INTO course_progress (user_id, topic_id, course_id, completed_at) VALUES (?, ?, ?, ?)").run(pm.id, topic1, courseId, Date.now());
    });
    await page.locator('a[aria-label="Edit White-label delivery"]').click({ timeout: WAIT });
    await page.waitForURL(/\/oyelabs$/, { timeout: WAIT });
    await modules.nth(0).getByLabel("Module title").fill("Kick-off call");
    await page.getByRole("button", { name: "Save & publish" }).click();
    const v2 = await poll("version 2", WAIT, async () => {
      const v = await getJson<CourseView>(page.request, `/api/admin/oyelabs/courses/${courseId}`);
      return v.version === 2 ? v : null;
    });
    ok(v2.modules[0]!.title === "Kick-off call", "the edit is saved");
    ok(v2.modules.map((m) => m.topicId).join() === v1.modules.map((m) => m.topicId).join(), "module lessons keep their ids");
    let kept = 0;
    sql(dataDir, (db) => {
      kept = (db.prepare("SELECT COUNT(*) AS n FROM course_progress WHERE user_id = ? AND topic_id = ?").get(pm.id, topic1) as { n: number }).n;
    });
    ok(kept === 1, "the PM learner's progress on module 1 is kept");

    step("axe on the editor at 390 and 1440");
    await page.mouse.move(0, 0);
    await settle(page);
    await shot(page, "editor-edit-1440");
    await axe(page, "editor (edit) 1440");
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: storage });
    try {
      const m = await mobile.newPage();
      await visit(m, `/admin/library/${courseId}/oyelabs`);
      await m.getByLabel("Title", { exact: true }).waitFor({ timeout: WAIT });
      await shot(m, "editor-edit-390");
      await axe(m, "editor (edit) 390");
      const overflow = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(overflow <= 1, `no sideways scrolling at 390 (${overflow}px)`);
      await visit(m, "/admin/library/oyelabs/new");
      await m.getByLabel("Title", { exact: true }).waitFor({ timeout: WAIT });
      await axe(m, "editor (new) 390");
    } finally {
      await mobile.close();
    }
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
