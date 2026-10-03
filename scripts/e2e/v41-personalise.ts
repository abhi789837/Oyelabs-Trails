/**
 * Oyelearn v4.1 end-to-end check: AI-personalised assessments, one PM pass and one Engineering pass.
 *
 *   npm run build          # once; this script serves dist/ + dist-server/ and does not rebuild
 *   npx tsx scripts/e2e/v41-personalise.ts           # both passes
 *   npx tsx scripts/e2e/v41-personalise.ts pm        # one pass (pm | eng)
 *
 * PM: superadmin onboards a PM through the real Setup UI with a free-text description, checks the
 * department's default sliders were prefilled, raises two to Critical, reads the "How the AI
 * understood this" panel, assigns, and checks the personalised sheet (26–32 min, weighted to the
 * description). The learner then answers an Excel task, an email and an explain-it task through the
 * real UI and hands in; the superadmin checks the path order (diagnostic refresh first, Critical
 * client/Excel skills in Part 1, PM theory last).
 *
 * Engineering: a PHP/Laravel description; the understanding and the generated items must carry it.
 *
 * Needs a Piston at http://127.0.0.1:2000 (override with PISTON_URL) for the PHP items. Uses a
 * throwaway DATA_DIR under %TEMP%, port 8799 and the deterministic mock AI provider
 * (NODE_ENV=development), whose v4.1 stand-ins are description-aware (server/src/ai/adapters/
 * mockPersonalise.ts). Screenshots go to %TEMP%/claude/e2e-shots-v41 (override with E2E_SHOTS).
 * Set E2E_HEADED=1 to watch. Exits non-zero when any assertion fails, and always stops its server.
 *
 * Helpers are copied from v4-departments.ts on purpose, so neither script's changes can break the other.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type APIRequestContext, type Browser, type BrowserContext, type Locator, type Page } from "playwright";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PORT = Number(process.env.E2E_PORT ?? 8799);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const SHOTS = process.env.E2E_SHOTS ?? path.join(os.tmpdir(), "claude", "e2e-shots-v41");
const HEADED = process.env.E2E_HEADED === "1";
const JOB_TIMEOUT_MS = Number(process.env.E2E_JOB_TIMEOUT_MS ?? 6 * 60_000);

const SLIDER_LABEL: Record<number, string> = { 1: "Optional", 2: "Low", 3: "Medium", 4: "High", 5: "Critical" };

const PM_DESCRIPTION = "Handles 3 overseas clients, weak on client calls and Excel";
const ENG_DESCRIPTION = "Laravel API developer, building payment webhooks for a UK client";

/**
 * What the PM department pre-selects for a new learner. v4.2 (server/src/catalog/seed/pmProcess.ts
 * and pmAgency.ts): the process academy is Critical (templates High); client management drops to
 * High, meetings and email to Medium; AI for PMs is Medium.
 */
const PM_DEFAULTS: { name: string; slider: number }[] = [
  { name: "Custom project lifecycle", slider: 5 },
  { name: "White-label project lifecycle", slider: 5 },
  { name: "Project terminology mastery", slider: 5 },
  { name: "Handling every client meeting", slider: 5 },
  { name: "Process templates in practice", slider: 4 },
  { name: "Client management", slider: 4 },
  { name: "Client update meetings & presenting", slider: 3 },
  { name: "Email etiquette & professional writing", slider: 3 },
  { name: "Excel for PMs", slider: 4 },
  { name: "Agency resource management", slider: 4 },
  { name: "Tech terms in plain language", slider: 4 },
  { name: "The SDLC in an agency", slider: 4 },
  { name: "Microsoft Teams for PMs", slider: 3 },
  { name: "Word & PowerPoint for PMs", slider: 3 },
  { name: "Keka for PMs", slider: 3 },
  { name: "Git & GitHub for PMs", slider: 3 },
  { name: "AI for PMs (Copilot & Claude)", slider: 3 },
  { name: "PM foundations and advanced theory", slider: 2 },
];
/**
 * The description's skills, raised to Critical and moved to the top of Critical. v4.2 made email
 * Medium and put the process academy first, so the admin raises email too (it was a v4.1 Critical
 * default) and moves these above the process courses, as an admin who wrote this description would.
 */
const PM_CRITICAL = ["Client update meetings & presenting", "Email etiquette & professional writing", "Excel for PMs"];
/** The skills the description is about: client calls (meetings), email to clients, Excel. */
const PM_STRESSED = ["Client update meetings & presenting", "Email etiquette & professional writing", "Excel for PMs"];

const ENG_SKILLS: { name: string; slider: 5 | 4 | 3 }[] = [
  { name: "Laravel APIs & API resources", slider: 5 },
  { name: "Laravel queues, events & scheduling", slider: 4 },
];

// ---------------------------------------------------------------------------
// Assertions and logging
// ---------------------------------------------------------------------------

class Checks {
  failures: string[] = [];
  notes: string[] = [];
  facts: string[] = [];
  constructor(readonly name: string) {}
  ok(cond: unknown, message: string): boolean {
    if (cond) {
      console.log(`    \u001b[32mok\u001b[0m   ${message}`);
      return true;
    }
    console.log(`    \u001b[31mFAIL\u001b[0m ${message}`);
    this.failures.push(message);
    return false;
  }
  note(message: string): void {
    console.log(`    \u001b[33mnote\u001b[0m ${message}`);
    this.notes.push(message);
  }
  fact(message: string): void {
    console.log(`    \u001b[36mfact\u001b[0m ${message}`);
    this.facts.push(message);
  }
}

function step(message: string): void {
  console.log(`  - ${message}`);
}

async function shot(page: Page, pass: string, name: string): Promise<void> {
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOTS, `${pass}-${name}.png`), fullPage: true }).catch(() => undefined);
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sameSkill(a: string | null | undefined, b: string): boolean {
  if (!a) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return norm(a) === norm(b) || norm(a).includes(norm(b)) || norm(b).includes(norm(a));
}

async function poll<T>(what: string, timeoutMs: number, fn: () => Promise<T | null | undefined>, everyMs = 2000): Promise<T> {
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
  const response = await request.get(`${BASE}${url}`);
  if (!response.ok()) throw new Error(`GET ${url} -> ${response.status()} ${await response.text()}`);
  return (await response.json()) as T;
}

async function sendJson<T>(request: APIRequestContext, method: "post" | "put", url: string, data: unknown): Promise<T> {
  const response = await request[method](`${BASE}${url}`, { data });
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
    if (!fs.existsSync(path.join(REPO, required))) throw new Error(`${required} is missing. Run \`npm run build\` first.`);
  }
  const logPath = path.join(dataDir, "server.log");
  const log = fs.createWriteStream(logPath);
  server = spawn(process.execPath, ["dist-server/index.js"], {
    cwd: REPO,
    env: {
      ...process.env,
      NODE_ENV: "development",
      DATA_DIR: dataDir,
      PORT: String(PORT),
      HOST: "127.0.0.1",
      CLIENT_DIST: path.join(REPO, "dist"),
      SUPERADMIN_PASSWORD: SUPER_INITIAL,
      PISTON_URL: process.env.PISTON_URL ?? "http://127.0.0.1:2000",
      PUBLIC_ORIGIN: BASE,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.pipe(log);
  server.stderr?.pipe(log);
  server.on("exit", (code) => {
    if (code !== null && code !== 0) console.log(`  server exited with ${code}; log: ${logPath}`);
  });
  console.log(`server log: ${logPath}`);
  await poll("/api/health", 60_000, async () => {
    if (server?.exitCode !== null) throw new Error(`server exited early (${server?.exitCode}); see ${logPath}`);
    const res = await fetch(`${BASE}/api/health`).catch(() => null);
    return res?.ok ? true : null;
  }, 500);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function signIn(page: Page, username: string, password: string, nextPassword: string): Promise<void> {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20_000 });
  if (page.url().includes("/change-password")) {
    await page.getByLabel(/^(temporary|current) password\*?$/i).fill(password);
    await page.getByLabel(/^new password\*?$/i).fill(nextPassword);
    await page.getByLabel(/^confirm new password\*?$/i).fill(nextPassword);
    await page.getByRole("button", { name: /save password/i }).click();
    await page.waitForURL((u) => !u.pathname.startsWith("/change-password"), { timeout: 20_000 });
  }
}

// ---------------------------------------------------------------------------
// Onboarding through the Setup UI
// ---------------------------------------------------------------------------

interface OnboardSpec {
  key: "pm" | "eng";
  department: string;
  track: RegExp;
  stack: string;
  experience: RegExp;
  description: string;
}

async function openOnboarding(admin: Page, spec: OnboardSpec, username: string): Promise<void> {
  await admin.goto(`${BASE}/admin/onboard`, { waitUntil: "networkidle" });
  await admin.getByRole("heading", { name: "Onboard a learner" }).waitFor();
  await admin.getByRole("radiogroup", { name: "Department" }).waitFor({ timeout: 20_000 });
  await admin.getByLabel(/^username/i).fill(username);
  await admin.getByLabel(/^full name/i).fill(`E2E v4.1 ${spec.department}`);
  await admin.getByRole("radiogroup", { name: "Department" }).getByRole("radio", { name: spec.department, exact: true }).click();
  // v4.3: onboarding opens on quick onboarding; "Edit details" opens the full Setup form this script drives.
  await admin.getByRole("button", { name: "Edit details" }).click();
  await admin.getByRole("radiogroup", { name: "Track" }).getByRole("radio", { name: spec.track }).click();
  await admin.getByRole("button", { name: /Choose (stacks|tools)/ }).click();
  await admin.getByRole("option", { name: spec.stack, exact: true }).click();
  await admin.keyboard.press("Escape");
  await admin.getByRole("radiogroup", { name: "Experience (years)" }).getByRole("radio", { name: spec.experience }).click();
  await admin.getByLabel("About this person and what you want").fill(spec.description);
}

const sliderOf = (admin: Page, skill: string) => admin.getByRole("slider", { name: `${skill} priority`, exact: true });

async function sliderValue(admin: Page, skill: string): Promise<string | null> {
  const thumb = sliderOf(admin, skill);
  if ((await thumb.count()) === 0) return null;
  return thumb.getAttribute("aria-valuetext");
}

/** Moves a skill to the top of its slider level with its "Move up" button. */
async function moveToTop(admin: Page, skill: string, level: string): Promise<void> {
  const up = admin.getByRole("button", { name: `Move ${skill} up within ${level}`, exact: true });
  for (let guard = 0; guard < 40 && (await up.isEnabled()); guard += 1) await up.click();
}

async function raiseSlider(admin: Page, skill: string, from: number, to: number): Promise<void> {
  for (let i = from; i < to; i += 1) {
    const thumb = sliderOf(admin, skill);
    await thumb.focus();
    await thumb.press("ArrowRight");
  }
}

/** The desktop "How the AI understood this" panel, once it shows a reading that passes `ready`. */
async function readUnderstanding(admin: Page, ready: (text: string) => boolean): Promise<string> {
  const panel = admin.getByRole("region", { name: "How the AI understood this" }).filter({ visible: true }).first();
  return poll("the understanding panel", 60_000, async () => {
    if ((await panel.getAttribute("aria-busy")) === "true") return null;
    const text = (await panel.innerText()).replace(/\s+/g, " ");
    return ready(text) ? text : null;
  }, 500);
}

async function createAndAssign(admin: Page, spec: OnboardSpec, username: string, c: Checks): Promise<{ userId: string; tempPassword: string; assessmentId: string }> {
  await admin.getByRole("button", { name: "Create & assign assessment" }).click();
  const notice = admin.getByRole("status").filter({ hasText: "Account created for" });
  await notice.waitFor({ timeout: 30_000 });
  const message = (await notice.locator("pre").textContent()) ?? "";
  const tempPassword = /Temporary password: (\S+)/.exec(message)?.[1] ?? "";
  c.ok(tempPassword.length >= 8, "temporary password captured from the notice");
  await shot(admin, spec.key, "03-onboard-created");

  const { users } = await getJson<{ users: { id: string; username: string }[] }>(admin.request, "/api/admin/users");
  const user = users.find((u) => u.username === username);
  if (!user) throw new Error(`created user ${username} not found in /api/admin/users`);

  const { setup } = await getJson<{ setup: { description: string } }>(admin.request, `/api/admin/users/${user.id}/setup`);
  c.ok(setup.description === spec.description, "the description was saved with the setup");

  step("wait for the personalisation job");
  const assessment = await poll("assessment ready", JOB_TIMEOUT_MS, async () => {
    const { assessments } = await getJson<{ assessments: { id: string; status: string }[] }>(admin.request, `/api/admin/users/${user.id}/assessments`);
    if (assessments[0]?.status === "failed") throw new Error("assessment generation failed");
    return assessments[0]?.status === "ready" ? assessments[0] : null;
  }, 2000);
  c.ok(true, `assessment ${assessment.id} is ready`);
  return { userId: user.id, tempPassword, assessmentId: assessment.id };
}

// ---------------------------------------------------------------------------
// The admin's view of the sheet
// ---------------------------------------------------------------------------

interface LearnerTaskLite {
  kind: string;
  variant?: string;
  grid?: string[][];
  editable?: string[];
}

interface V4AdminItemLite {
  id: string;
  position: number;
  type: "coding" | "mcq" | "task";
  skillName: string;
  prompt: string;
  origin: "bank" | "generated" | "fallback" | null;
  estSeconds?: number;
  language?: string;
  snippetLanguage?: string | null;
  task?: LearnerTaskLite;
}

interface PersonalisationReport {
  level: string;
  understandingSource: "ai" | "rules";
  intent: string[];
  themes: string[];
  reused: number;
  generated: number;
  fromBankAfterFailures: number;
  estSeconds: number;
  fallbackReason: string | null;
}

interface V4Detail {
  config: { personalisation?: PersonalisationReport };
  items: V4AdminItemLite[];
}

const kindOf = (i: V4AdminItemLite) => (i.task ? `${i.task.kind}${i.task.variant ? `/${i.task.variant}` : ""}` : i.type === "mcq" ? "mcq" : i.type);

async function adminDetail(admin: Page, assessmentId: string): Promise<V4Detail> {
  return getJson<V4Detail>(admin.request, `/api/admin/assessments/${assessmentId}/v4`);
}

function describeMix(items: V4AdminItemLite[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.skillName, (counts.get(item.skillName) ?? 0) + 1);
  return counts;
}

/** Opens the learner's Assessment tab and the question list; returns how many "generated" badges show. */
async function adminQuestionList(admin: Page, userId: string, pass: string): Promise<number> {
  await admin.goto(`${BASE}/admin/people/${userId}?tab=assessment`, { waitUntil: "networkidle" });
  const toggle = admin.getByRole("button", { name: /^Show all \d+ questions and answers$/ });
  await toggle.waitFor({ timeout: 20_000 });
  await shot(admin, pass, "04-admin-assessment-tab");
  await toggle.click();
  const list = admin.locator("ol[id^='v4-questions-']");
  await list.waitFor();
  const badges = await list.getByText("generated", { exact: true }).count();
  await shot(admin, pass, "05-admin-questions");
  return badges;
}

// ---------------------------------------------------------------------------
// The learner: pre-flight and the sheet
// ---------------------------------------------------------------------------

interface SheetItemLite {
  id: string;
  type: "coding" | "mcq" | "task";
  state: string;
  draft: unknown;
  task?: LearnerTaskLite;
}

async function ensureFullscreen(page: Page, c: Checks): Promise<void> {
  const gate = page.getByRole("button", { name: "Return to fullscreen" });
  if (await gate.isVisible().catch(() => false)) {
    await gate.click();
    await page.waitForTimeout(500);
  }
  const real = await page.evaluate(() => document.fullscreenElement !== null);
  if (!real && (await gate.isVisible().catch(() => false))) {
    // Headless Chromium may refuse the Fullscreen API; stand in for it so the sheet renders.
    await page.evaluate(() => {
      Object.defineProperty(Document.prototype, "fullscreenElement", { configurable: true, get: () => document.documentElement });
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    c.note("Fullscreen API unavailable here; fullscreenElement was shimmed so the sheet renders");
  }
  await gate.waitFor({ state: "hidden", timeout: 10_000 });
}

async function passPreflight(page: Page, request: APIRequestContext, assessmentId: string, pass: string, c: Checks): Promise<void> {
  step("pre-flight");
  await page.getByRole("heading", { name: "Before you start" }).waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: "I agree, check my camera" }).click();
  await page.getByRole("heading", { name: "Camera check" }).waitFor({ timeout: 15_000 });
  const cont = page.getByRole("button", { name: "Continue", exact: true });
  const calibrated = await cont.isEnabled().then(async (enabled) => {
    if (enabled) return true;
    try {
      await page.waitForFunction(
        () => [...document.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Continue" && !b.disabled),
        undefined,
        { timeout: 15_000 },
      );
      return true;
    } catch {
      return false;
    }
  });
  if (calibrated) {
    await cont.click();
    await page.getByRole("button", { name: "Play the warning tone" }).click();
    await page.getByRole("button", { name: "I heard it" }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: /Enter fullscreen and start/ }).click();
  } else {
    // The fake camera shows no face, so calibration cannot finish: consent + start over the API,
    // with the learner's own session, exactly as the page would.
    c.note("camera calibration cannot pass with Chromium's fake device (no face); consent/start sent via API");
    const permissions = { camera: true, microphone: false, fullscreen: true, tabMonitoring: true };
    await sendJson(request, "post", `/api/assessment/${assessmentId}/consent`, { agreed: true, permissions });
    await sendJson(request, "post", `/api/assessment/${assessmentId}/start`, {});
    await page.goto(`${BASE}/assessment`, { waitUntil: "networkidle" });
  }
  await page.waitForSelector("text=/Question \\d+ of \\d+|Return to fullscreen/", { timeout: 30_000 });
  await ensureFullscreen(page, c);
  // The header reads "Question 1 of 25" followed by "About 26 minutes" (v4.1).
  await page.getByText(/^Question \d+ of \d+/).waitFor({ timeout: 20_000 });
  await shot(page, pass, "07-sheet-open");
}

const chip = (page: Page, index: number) => page.getByRole("navigation", { name: "Questions" }).getByRole("button", { name: new RegExp(`^Question ${index + 1}:`) });

async function goTo(page: Page, index: number, total: number): Promise<void> {
  await chip(page, index).click();
  await page.getByText(new RegExp(`^Question ${index + 1} of ${total}(\\D|$)`)).waitFor();
}

async function chipLabel(page: Page, index: number): Promise<string> {
  return (await chip(page, index).getAttribute("aria-label")) ?? "";
}

async function readSheet(request: APIRequestContext, assessmentId: string): Promise<SheetItemLite[]> {
  return (await getJson<{ items: SheetItemLite[] }>(request, `/api/assessment/${assessmentId}/sheet`)).items;
}

const article = (page: Page): Locator => page.locator("article").first();

/** A formula for an editable cell: the sum of the numbers above it in its column. */
function formulaFor(ref: string): string {
  const col = ref[0];
  const row = Number(ref.slice(1));
  return row > 2 ? `=SUM(${col}2:${col}${row - 1})` : `=SUM(${col}${row + 1}:${col}${row + 3})`;
}

async function finishSheet(page: Page, pass: string, c: Checks): Promise<void> {
  step("Finish");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const dialog = page.getByRole("alertdialog").or(page.getByRole("dialog")).filter({ hasText: "Finish the assessment?" });
  await dialog.waitFor({ timeout: 10_000 });
  await shot(page, pass, "11-finish-confirm");
  await dialog.getByRole("button", { name: "Finish and hand in" }).click();
  await page.getByText(/Your answers are handed in|Your assessment is done/).first().waitFor({ timeout: 30_000 });
  c.ok(true, "sheet handed in");
  await shot(page, pass, "12-after-finish");
}

// ---------------------------------------------------------------------------
// Path
// ---------------------------------------------------------------------------

interface PathItem {
  courseTitle: string;
  position: number;
  partNumber: number | null;
  targetSkill: string | null;
  reason: string;
}

async function waitForPath(admin: Page, userId: string, pass: string, c: Checks): Promise<PathItem[]> {
  step("wait for evaluation");
  await poll("assessment completed", JOB_TIMEOUT_MS, async () => {
    const { assessments } = await getJson<{ assessments: { status: string }[] }>(admin.request, `/api/admin/users/${userId}/assessments`);
    if (assessments[0]?.status === "failed") throw new Error("assessment evaluation failed");
    return assessments[0]?.status === "completed" ? true : null;
  }, 3000);
  c.ok(true, "assessment completed");
  step("wait for the path");
  const data = await poll("path ready", JOB_TIMEOUT_MS, async () => {
    const g = await getJson<{ path: { status: string; failureReason: string | null; items: PathItem[] } | null }>(admin.request, `/api/admin/users/${userId}/gaps`);
    if (g.path?.status === "failed" || g.path?.status === "budget_reached") return g;
    return g.path?.status === "ready" ? g : null;
  }, 3000);
  c.ok(data.path!.status === "ready", `path status ready (got ${data.path!.status}${data.path!.failureReason ? `: ${data.path!.failureReason}` : ""})`);
  await admin.goto(`${BASE}/admin/people/${userId}?tab=path`, { waitUntil: "networkidle" });
  await admin.getByRole("heading", { name: "Learning path" }).waitFor();
  await shot(admin, pass, "13-admin-path-tab");
  return [...data.path!.items].sort((x, y) => x.position - y.position);
}

// ---------------------------------------------------------------------------
// PM pass
// ---------------------------------------------------------------------------

async function runPm(browser: Browser, admin: Page, stamp: string): Promise<Checks> {
  const c = new Checks("Project Management (personalised)");
  console.log(`\n=== ${c.name} ===`);
  const spec: OnboardSpec = { key: "pm", department: "Project Management", track: /^Agile Delivery PM/, stack: "Jira", experience: /^3–5/, description: PM_DESCRIPTION };
  const username = `e2e41-pm-${stamp}`;
  let learnerCtx: BrowserContext | null = null;
  try {
    step("onboard on /admin/onboard");
    await openOnboarding(admin, spec, username);

    step("default PM sliders are prefilled");
    await admin.getByText(/Suggested defaults for Project Management/).waitFor({ timeout: 10_000 });
    for (const d of PM_DEFAULTS) {
      const value = await sliderValue(admin, d.name);
      c.ok(value === SLIDER_LABEL[d.slider], `default ${d.name} = ${SLIDER_LABEL[d.slider]} (got ${value ?? "missing"})`);
    }
    await shot(admin, "pm", "01-defaults-prefilled");

    step("raise the description's skills to Critical");
    for (const name of PM_CRITICAL) {
      const before = PM_DEFAULTS.find((d) => d.name === name)!.slider;
      await raiseSlider(admin, name, before, 5);
      c.ok((await sliderValue(admin, name)) === "Critical", `${name} slider reads Critical`);
    }
    for (const name of [...PM_CRITICAL].reverse()) await moveToTop(admin, name, "Critical");

    step("read the understanding panel");
    const text = await readUnderstanding(admin, (t) => t.includes("Excel for PMs") && /client calls/i.test(t) && /Critical for the admin: .*Excel for PMs/.test(t));
    c.ok(/client (calls|meetings|update meetings)/i.test(text), "understanding mentions client calls/meetings");
    c.ok(/Excel/.test(text), "understanding mentions Excel");
    c.ok(!/Rules only/.test(text), "understanding came from the AI (not rules only)");
    c.fact(`understanding: ${text.slice(0, 400)}`);
    await shot(admin, "pm", "02-understanding");

    const { userId, tempPassword, assessmentId } = await createAndAssign(admin, spec, username, c);

    step("check the personalised sheet");
    const detail = await adminDetail(admin, assessmentId);
    const report = detail.config.personalisation;
    c.ok(report?.understandingSource === "ai", `personalisation read by the AI (got ${report?.understandingSource})`);
    c.ok(!report?.fallbackReason, `no bank-only fallback${report?.fallbackReason ? ` (${report.fallbackReason})` : ""}`);
    c.ok((report?.themes ?? []).some((t) => /client calls/i.test(t)) && (report?.themes ?? []).some((t) => /excel/i.test(t)), `themes carry the description (${(report?.themes ?? []).join(", ")})`);
    const items = detail.items;
    c.ok(items.length === 25, `25 questions (got ${items.length})`);
    const est = items.reduce((s, i) => s + (i.estSeconds ?? 0), 0);
    c.fact(`estimate ${est} s = ${(est / 60).toFixed(1)} min (report ${report?.estSeconds} s); reused ${report?.reused}, generated ${report?.generated}, from bank after failures ${report?.fromBankAfterFailures}`);
    c.ok(est >= 26 * 60 && est <= 32 * 60, `sheet estimate ${(est / 60).toFixed(1)} min is within 26–32`);

    const mix = describeMix(items);
    c.fact(`mix by skill: ${[...mix.entries()].map(([k, v]) => `${k} ${v}`).join("; ")}`);
    c.fact(`kinds: ${items.map(kindOf).join(", ")}`);
    const stressed = PM_STRESSED.map((s) => mix.get(s) ?? 0);
    const others = [...mix.entries()].filter(([k]) => !PM_STRESSED.includes(k) && k !== "Client management");
    const otherMax = Math.max(0, ...others.map(([, v]) => v));
    const avgStressed = stressed.reduce((a, b) => a + b, 0) / stressed.length;
    const avgOthers = others.reduce((a, [, v]) => a + v, 0) / Math.max(1, others.length);
    c.ok(stressed.every((n) => n >= otherMax), `each of meetings/email/Excel has at least as many items as any other PM skill (${stressed.join("/")} vs max ${otherMax})`);
    c.ok(avgStressed > avgOthers, `meetings/email/Excel average more items per skill than the other PM skills (${avgStressed.toFixed(2)} vs ${avgOthers.toFixed(2)})`);
    const themed = items.filter((i) => /meeting|call|email|excel|spreadsheet/i.test(`${i.skillName} ${i.prompt}`) || ["excel", "write/email", "sim"].includes(kindOf(i)));
    c.fact(`${themed.length} of 25 items are about meetings, email or Excel by skill, prompt or task kind`);
    c.ok(themed.length > items.length - themed.length, `meeting/email/Excel items outnumber the rest (${themed.length} vs ${items.length - themed.length})`);
    const generated = items.filter((i) => i.origin === "generated");
    c.ok(generated.length > 0, `generated items on the sheet (${generated.length})`);
    const offContext = generated.filter((i) => !/overseas clients?|client calls?|Excel|Jira/i.test(i.prompt));
    c.ok(offContext.length === 0, `every generated item is set in the description's context${offContext.length ? ` (not: ${offContext.map((i) => `${i.skillName}: ${i.prompt.slice(0, 90)}`).join(" | ")})` : ""}`);
    const badges = await adminQuestionList(admin, userId, "pm");
    c.ok(badges === generated.length, `admin V4 detail shows ${badges} "generated" badges (expected ${generated.length})`);

    // ---- The learner ----
    learnerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["camera", "microphone"] });
    const page = await learnerCtx.newPage();
    page.on("pageerror", (error) => console.log(`    [learner pageerror] ${error.message}`));
    step(`learner ${username} signs in`);
    await signIn(page, username, tempPassword, LEARNER_NEW);
    await page.goto(`${BASE}/assessment`, { waitUntil: "networkidle" });
    await shot(page, "pm", "06-learner-assessment");
    await passPreflight(page, learnerCtx.request, assessmentId, "pm", c);
    const sheet = await readSheet(learnerCtx.request, assessmentId);
    const total = sheet.length;
    const find = (pred: (i: SheetItemLite) => boolean) => sheet.findIndex(pred);
    const excel = find((i) => i.task?.kind === "excel");
    const email = find((i) => i.task?.kind === "write" && i.task.variant === "email");
    const explain = find((i) => i.task?.kind === "write" && i.task.variant === "explain");
    c.ok(excel >= 0, "an Excel task is on the sheet");
    c.ok(email >= 0, "an email write task is on the sheet");
    c.ok(explain >= 0, "an explain-it write task is on the sheet");

    const plan: { index: number; label: string; run: () => Promise<void> }[] = [];
    if (excel >= 0) {
      plan.push({
        index: excel,
        label: "excel",
        run: async () => {
          const ref = sheet[excel].task!.editable![0];
          const formula = formulaFor(ref);
          step(`Excel Q${excel + 1}: type ${formula} into ${ref}`);
          const cell = article(page).getByLabel(new RegExp(`^Cell ${ref}(,|$)`));
          await cell.click();
          await cell.fill(formula);
          await cell.press("Enter");
          await page.waitForTimeout(300);
          c.ok((await chipLabel(page, excel)).includes("answered"), `Q${excel + 1} (Excel) answered`);
          await shot(page, "pm", "08-excel");
        },
      });
    }
    if (email >= 0) {
      plan.push({
        index: email,
        label: "email",
        run: async () => {
          step(`email Q${email + 1}`);
          c.ok(await article(page).getByLabel("Subject").isVisible(), "email task shows an email composer (Subject field)");
          await article(page).getByLabel("Subject").fill("Release date: new plan");
          await article(page).locator("textarea").first().fill("Hi Sarah, the build slipped after payment testing found a bug. New date is Wednesday. I will share the test link on Tuesday.");
          await page.waitForTimeout(300);
          c.ok((await chipLabel(page, email)).includes("answered"), `Q${email + 1} (email) answered`);
          await shot(page, "pm", "09-email");
        },
      });
    }
    if (explain >= 0) {
      plan.push({
        index: explain,
        label: "explain",
        run: async () => {
          step(`explain-it Q${explain + 1}`);
          c.ok(await article(page).getByText("Your explanation").isVisible(), "explain task asks for an explanation");
          await article(page).locator("textarea").first().fill("An API is how our app asks another system for data, like a waiter taking an order to the kitchen. Theirs changed, so we adapt before release.");
          await page.waitForTimeout(300);
          c.ok((await chipLabel(page, explain)).includes("answered"), `Q${explain + 1} (explain) answered`);
          await shot(page, "pm", "10-explain");
        },
      });
    }
    // One MCQ answered quickly; everything else is left for "unanswered".
    const mcq = find((i) => i.type === "mcq");
    if (mcq >= 0) plan.push({ index: mcq, label: "mcq", run: async () => void (await article(page).locator('input[type="radio"]').first().check()) });
    plan.sort((a, b) => a.index - b.index);
    for (const entry of plan) {
      await goTo(page, entry.index, total);
      await entry.run();
    }
    // Moving off the last one flushes its draft.
    await goTo(page, plan[0].index === 0 ? 1 : 0, total);

    const drafts = await poll("drafts saved", 15_000, async () => {
      const s = await readSheet(learnerCtx!.request, assessmentId);
      const ok = plan.every((p) => s[p.index].draft !== null);
      return ok ? s : null;
    }, 500).catch(() => null);
    c.ok(drafts !== null, "server: every answered item has a draft");
    if (drafts && excel >= 0) {
      const cells = (drafts[excel].draft as { task?: { cells?: Record<string, string> } } | null)?.task?.cells ?? {};
      c.ok(Object.values(cells).some((v) => v.startsWith("=SUM(")), `server: the Excel draft holds the typed formula (${JSON.stringify(cells)})`);
    }
    if (drafts && email >= 0) c.ok(/new date is wednesday/i.test(JSON.stringify(drafts[email].draft)), "server: the email body was saved");

    await finishSheet(page, "pm", c);

    // ---- The path ----
    const path = await waitForPath(admin, userId, "pm", c);
    const lines = path.map((i) => `[P${i.partNumber}] ${i.courseTitle} <- ${i.targetSkill ?? "-"}`);
    console.log(lines.map((l) => `      ${l}`).join("\n"));
    c.fact(`path: ${lines.join(" | ")}`);
    c.ok(/Improving your existing PM skills/i.test(`${path[0]?.courseTitle} ${path[0]?.reason}`), `the path opens with the diagnostic refresh (got "${path[0]?.courseTitle}")`);
    const part1 = path.filter((i) => i.partNumber === 1);
    c.ok(part1.some((i) => sameSkill(i.targetSkill, "Client update meetings & presenting") || sameSkill(i.targetSkill, "Client management")), "client meetings/management is in Part 1");
    c.ok(part1.some((i) => sameSkill(i.targetSkill, "Excel for PMs")), "Excel for PMs is in Part 1");
    /* v4.3 (D7): a critically weak core skill the admin did not set as a goal (Jira, Kanban: the
       sheet's learner skips them) is a must-have early on the path, and its lessons live in the PM
       foundations module; so the theory course is found by what it serves, not by the module title. */
    const theory = path.map((i, index) => ({ i, index })).filter(({ i }) => sameSkill(i.targetSkill, "PM foundations and advanced theory"));
    c.ok(theory.length > 0, "PM foundations and advanced theory is on the path");
    if (theory.length) {
      const first = theory[0].index;
      c.ok(path.slice(first).every((i) => sameSkill(i.targetSkill, "PM foundations and advanced theory") || /PM foundations/i.test(i.courseTitle)), "everything else comes before PM foundations and advanced theory");
    }
    c.ok(path.every((item, i) => i === 0 || (item.partNumber ?? 0) >= (path[i - 1].partNumber ?? 0)), "part numbers never go backwards");
  } catch (error) {
    c.failures.push(`aborted: ${(error as Error).message.split("\n")[0]}`);
    console.log(`    \u001b[31mABORT\u001b[0m ${(error as Error).stack ?? error}`);
    await shot(admin, "pm", "99-admin-at-failure");
    for (const p of learnerCtx?.pages() ?? []) await shot(p, "pm", "99-learner-at-failure");
  } finally {
    await learnerCtx?.close().catch(() => undefined);
  }
  return c;
}

// ---------------------------------------------------------------------------
// Engineering pass
// ---------------------------------------------------------------------------

async function runEng(admin: Page, stamp: string): Promise<Checks> {
  const c = new Checks("Engineering (personalised, PHP/Laravel)");
  console.log(`\n=== ${c.name} ===`);
  const spec: OnboardSpec = { key: "eng", department: "Engineering", track: /^Backend/, stack: "PHP/Laravel", experience: /^1–2/, description: ENG_DESCRIPTION };
  const username = `e2e41-eng-${stamp}`;
  try {
    step("onboard on /admin/onboard");
    await openOnboarding(admin, spec, username);
    // v4.3: priorities are goals now; a skill picked in the goal box is a skill goal at Medium.
    await admin.getByRole("button", { name: "What should they be able to do?", exact: true }).click();
    const search = admin.getByPlaceholder(/merge conflict/);
    for (const skill of ENG_SKILLS) {
      await search.fill(skill.name);
      const option = admin.getByRole("option").filter({ hasText: new RegExp(`^${escapeRegex(skill.name)}`) }).first();
      await option.waitFor({ timeout: 10_000 });
      await option.click();
    }
    await admin.keyboard.press("Escape");
    for (const skill of ENG_SKILLS) {
      await raiseSlider(admin, skill.name, 3, skill.slider);
      c.ok((await sliderValue(admin, skill.name)) === SLIDER_LABEL[skill.slider], `${skill.name} slider reads ${SLIDER_LABEL[skill.slider]}`);
    }

    step("read the understanding panel");
    const text = await readUnderstanding(admin, (t) => /Laravel APIs/.test(t) && /webhooks/i.test(t));
    c.ok(/Laravel/.test(text), "understanding mentions Laravel");
    c.ok(/webhooks/i.test(text), "understanding mentions webhooks");
    c.fact(`understanding: ${text.slice(0, 400)}`);
    await shot(admin, "eng", "02-understanding");

    const { userId, assessmentId } = await createAndAssign(admin, spec, username, c);
    const detail = await adminDetail(admin, assessmentId);
    const report = detail.config.personalisation;
    const themes = report?.themes ?? [];
    c.fact(`themes: ${themes.join(", ")}; reused ${report?.reused}, generated ${report?.generated}, from bank after failures ${report?.fromBankAfterFailures}`);
    c.ok(themes.some((t) => /laravel/i.test(t)), "themes mention Laravel");
    c.ok(themes.some((t) => /webhook/i.test(t)), "themes mention webhooks");
    const items = detail.items;
    const est = items.reduce((s, i) => s + (i.estSeconds ?? 0), 0);
    c.fact(`estimate ${(est / 60).toFixed(1)} min; kinds: ${items.map((i) => `${kindOf(i)}${i.language ? `:${i.language}` : i.snippetLanguage ? `:${i.snippetLanguage}` : ""}`).join(", ")}`);
    c.ok(est >= 26 * 60 && est <= 32 * 60, `sheet estimate ${(est / 60).toFixed(1)} min is within 26–32`);
    const generated = items.filter((i) => i.origin === "generated");
    c.ok(generated.length > 0, `generated items on the sheet (${generated.length})`);
    const php = generated.filter((i) => i.language === "php" || i.snippetLanguage === "php");
    c.ok(php.length > 0, `generated items use PHP (${php.length}: ${php.map(kindOf).join(", ")})`);
    c.ok(generated.every((i) => i.language === "php" || i.snippetLanguage === "php" || /Laravel|webhook|UK client/i.test(i.prompt)), "every generated item uses PHP or the description's context");
    c.ok(generated.filter((i) => i.type === "coding").every((i) => i.language === "php"), "generated coding items are in PHP");
    const badges = await adminQuestionList(admin, userId, "eng");
    c.ok(badges === generated.length, `admin V4 detail shows ${badges} "generated" badges (expected ${generated.length})`);
    const firstGenerated = admin.locator("ol[id^='v4-questions-'] > li").filter({ has: admin.getByText("generated", { exact: true }) }).first();
    c.ok(/Laravel|webhook|UK client/i.test(await firstGenerated.innerText()), "a generated question in the admin list reads in the learner's context");
  } catch (error) {
    c.failures.push(`aborted: ${(error as Error).message.split("\n")[0]}`);
    console.log(`    \u001b[31mABORT\u001b[0m ${(error as Error).stack ?? error}`);
    await shot(admin, "eng", "99-admin-at-failure");
  }
  return c;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<number> {
  const only = process.argv.slice(2).filter((a) => a === "pm" || a === "eng");
  const passes = only.length ? only : ["pm", "eng"];
  fs.mkdirSync(SHOTS, { recursive: true });
  const stamp = Date.now().toString(36);
  const dataDir = path.join(os.tmpdir(), `oyelearn-e2e41-${stamp}`);
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`data dir: ${dataDir}\nshots:    ${SHOTS}`);

  await startServer(dataDir);
  const browser = await chromium.launch({
    headless: !HEADED,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });
  const results: Checks[] = [];
  try {
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const admin = await adminCtx.newPage();
    admin.on("pageerror", (error) => console.log(`    [admin pageerror] ${error.message}`));
    console.log("\nsuperadmin signs in (first login changes the password)");
    await signIn(admin, SUPER_USER, SUPER_INITIAL, SUPER_NEW);
    await admin.waitForURL((u) => u.pathname.startsWith("/admin"), { timeout: 20_000 });
    await sendJson(admin.request, "put", "/api/admin/assessment-settings", { minFinishMinutes: null });

    if (passes.includes("pm")) results.push(await runPm(browser, admin, stamp));
    if (passes.includes("eng")) results.push(await runEng(admin, stamp));
  } finally {
    await browser.close().catch(() => undefined);
    stopServer();
  }

  console.log("\n=== Summary ===");
  for (const r of results) {
    const verdict = r.failures.length === 0 ? "\u001b[32mPASS\u001b[0m" : "\u001b[31mFAIL\u001b[0m";
    console.log(`${verdict}  ${r.name}${r.failures.length ? ` (${r.failures.length} failed)` : ""}`);
    for (const f of r.failures) console.log(`        - ${f}`);
    for (const f of r.facts) console.log(`        fact: ${f}`);
    for (const n of r.notes) console.log(`        note: ${n}`);
  }
  return results.length === passes.length && results.every((r) => r.failures.length === 0) ? 0 : 1;
}

main()
  .then((code) => {
    stopServer();
    process.exit(code);
  })
  .catch((error) => {
    console.error(error);
    stopServer();
    process.exit(1);
  });
