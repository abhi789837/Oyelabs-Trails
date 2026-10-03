/**
 * Oyelearn v4.2 end-to-end check: the Agency PM Processes Academy, through the real UI.
 *
 *   npm run build          # once; this script serves dist/ + dist-server/ and does not rebuild
 *   npx tsx scripts/e2e/v42-pm-processes.ts
 *   npx tsx scripts/e2e/v42-pm-processes.ts handbook   # step 4 only
 *
 * 1. The superadmin onboards a PM on the Setup screen with the description "handles white-label
 *    clients, confuses CRs and enhancements", checks the v4.2 default sliders were prefilled (the
 *    four process courses Critical, templates High), and assigns. The personalised sheet must hold a
 *    classify-the-request item and a white-label item and fit 26–32 minutes.
 * 2. The learner answers a classification (categorize) item and a mini role-play (the mock AI plays
 *    the client) through the real UI, and hands in.
 * 3. The path: Part 1 opens with the diagnostic refresh (if present), then the lifecycle courses,
 *    terminology and client meetings, before every other skill.
 * 4. The superadmin opens a course topic that links [[term:change-request]] (the tooltip reads "to
 *    confirm"), goes to /admin/handbook in the same tab, edits and confirms the term, comes back:
 *    the tooltip and the glossary show the confirmed status and the new text.
 *
 * Uses a throwaway DATA_DIR under %TEMP%, port 8800 and the deterministic mock AI provider
 * (NODE_ENV=development). Screenshots go to %TEMP%/claude/e2e-shots-v42 (override with E2E_SHOTS).
 * Set E2E_HEADED=1 to watch. Exits non-zero when any assertion fails, and always stops its server.
 *
 * Helpers are copied from v41-personalise.ts on purpose, so neither script's changes can break the other.
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
const PORT = Number(process.env.E2E_PORT ?? 8800);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const SHOTS = process.env.E2E_SHOTS ?? path.join(os.tmpdir(), "claude", "e2e-shots-v42");
const HEADED = process.env.E2E_HEADED === "1";
const JOB_TIMEOUT_MS = Number(process.env.E2E_JOB_TIMEOUT_MS ?? 6 * 60_000);

const SLIDER_LABEL: Record<number, string> = { 1: "Optional", 2: "Low", 3: "Medium", 4: "High", 5: "Critical" };

const DESCRIPTION = "handles white-label clients, confuses CRs and enhancements";

/** What the PM department pre-selects in v4.2 (server/src/catalog/seed/pmProcess.ts + pmAgency.ts). */
const PM_DEFAULTS: { name: string; slider: number }[] = [
  { name: "Custom project lifecycle", slider: 5 },
  { name: "White-label project lifecycle", slider: 5 },
  { name: "Project terminology mastery", slider: 5 },
  { name: "Handling every client meeting", slider: 5 },
  { name: "Process templates in practice", slider: 4 },
  { name: "Client management", slider: 4 },
  { name: "Excel for PMs", slider: 4 },
  { name: "Agency resource management", slider: 4 },
  { name: "Tech terms in plain language", slider: 4 },
  { name: "The SDLC in an agency", slider: 4 },
  { name: "Client update meetings & presenting", slider: 3 },
  { name: "Email etiquette & professional writing", slider: 3 },
  { name: "Microsoft Teams for PMs", slider: 3 },
  { name: "Word & PowerPoint for PMs", slider: 3 },
  { name: "Keka for PMs", slider: 3 },
  { name: "Git & GitHub for PMs", slider: 3 },
  { name: "AI for PMs (Copilot & Claude)", slider: 3 },
  { name: "PM foundations and advanced theory", slider: 2 },
];

const LIFECYCLE = ["Custom project lifecycle", "White-label project lifecycle"];
/** v4.3: graph prerequisites of the lifecycle courses (server/src/catalog/seed/edges.ts). */
const LIFECYCLE_PREREQS = ["The SDLC in an agency"];
const TERMS = "Project terminology mastery";
const MEETINGS = "Handling every client meeting";

/** A course topic whose text links [[term:change-request]]. */
const TERM_ID = "change-request";
const TERM_TEXT = "Change request";
const TOPIC_URL = "/track/pm/module/pmp-a09/topic/pmp-a09-classifying-requests";

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

/** An in-app navigation (what a link click does): same document, so in-memory caches survive. */
async function spaNavigate(page: Page, to: string): Promise<void> {
  await page.evaluate((url) => {
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
  }, to);
  await page.waitForURL((u) => `${u.pathname}${u.search}` === to, { timeout: 10_000 });
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

async function openOnboarding(admin: Page, username: string): Promise<void> {
  await admin.goto(`${BASE}/admin/onboard`, { waitUntil: "networkidle" });
  await admin.getByRole("heading", { name: "Onboard a learner" }).waitFor();
  await admin.getByRole("radiogroup", { name: "Department" }).waitFor({ timeout: 20_000 });
  await admin.getByLabel(/^username/i).fill(username);
  await admin.getByLabel(/^full name/i).fill("E2E v4.2 Project Management");
  await admin.getByRole("radiogroup", { name: "Department" }).getByRole("radio", { name: "Project Management", exact: true }).click();
  // v4.3: onboarding opens on quick onboarding; "Edit details" opens the full Setup form this script drives.
  await admin.getByRole("button", { name: "Edit details" }).click();
  await admin.getByRole("radiogroup", { name: "Track" }).getByRole("radio", { name: /^Agile Delivery PM/ }).click();
  await admin.getByRole("button", { name: /Choose (stacks|tools)/ }).click();
  await admin.getByRole("option", { name: "Jira", exact: true }).click();
  await admin.keyboard.press("Escape");
  await admin.getByRole("radiogroup", { name: "Experience (years)" }).getByRole("radio", { name: /^3–5/ }).click();
  await admin.getByLabel("About this person and what you want").fill(DESCRIPTION);
}

const sliderOf = (admin: Page, skill: string) => admin.getByRole("slider", { name: `${skill} priority`, exact: true });

async function sliderValue(admin: Page, skill: string): Promise<string | null> {
  const thumb = sliderOf(admin, skill);
  if ((await thumb.count()) === 0) return null;
  return thumb.getAttribute("aria-valuetext");
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

async function createAndAssign(admin: Page, username: string, c: Checks): Promise<{ userId: string; tempPassword: string; assessmentId: string }> {
  await admin.getByRole("button", { name: "Create & assign assessment" }).click();
  const notice = admin.getByRole("status").filter({ hasText: "Account created for" });
  await notice.waitFor({ timeout: 30_000 });
  const message = (await notice.locator("pre").textContent()) ?? "";
  const tempPassword = /Temporary password: (\S+)/.exec(message)?.[1] ?? "";
  c.ok(tempPassword.length >= 8, "temporary password captured from the notice");
  await shot(admin, "pm", "03-onboard-created");

  const { users } = await getJson<{ users: { id: string; username: string }[] }>(admin.request, "/api/admin/users");
  const user = users.find((u) => u.username === username);
  if (!user) throw new Error(`created user ${username} not found in /api/admin/users`);

  const { setup } = await getJson<{ setup: { description: string; priorities: { skillId: string; slider: number }[] } }>(admin.request, `/api/admin/users/${user.id}/setup`);
  c.ok(setup.description === DESCRIPTION, "the description was saved with the setup");
  const saved = new Map(setup.priorities.map((p) => [p.skillId, p.slider]));
  c.ok(
    ["pm-proc-custom", "pm-proc-whitelabel", "pm-proc-terms", "pm-proc-meetings"].every((id) => saved.get(id) === 5) && saved.get("pm-proc-templates") === 4,
    "saved priorities: the four process courses Critical, templates High",
  );

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
  mode?: string;
  categories?: { id: string; label: string }[];
  items?: { id: string; text: string }[];
  maxTurns?: number;
}

interface V4AdminItemLite {
  id: string;
  position: number;
  type: "coding" | "mcq" | "task";
  skillName: string;
  prompt: string;
  origin: "bank" | "generated" | "fallback" | null;
  estSeconds?: number;
  task?: LearnerTaskLite;
}

interface V4Detail {
  config: { personalisation?: { understandingSource: "ai" | "rules"; themes: string[]; reused: number; generated: number; fallbackReason: string | null } };
  items: V4AdminItemLite[];
}

const kindOf = (i: { type: string; task?: LearnerTaskLite }) => (i.task ? `${i.task.kind}${i.task.variant ? `/${i.task.variant}` : ""}${i.task.mode ? `/${i.task.mode}` : ""}` : i.type);

const isClassify = (task: LearnerTaskLite | undefined) => task?.kind === "categorize" && (task.mode === "classify-request" || (task.categories ?? []).some((cat) => cat.id === "change-request"));

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

async function passPreflight(page: Page, request: APIRequestContext, assessmentId: string, c: Checks): Promise<void> {
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
  await page.getByText(/^Question \d+ of \d+/).waitFor({ timeout: 20_000 });
  await shot(page, "pm", "07-sheet-open");
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

async function finishSheet(page: Page, c: Checks): Promise<void> {
  step("Finish");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const dialog = page.getByRole("alertdialog").or(page.getByRole("dialog")).filter({ hasText: "Finish the assessment?" });
  await dialog.waitFor({ timeout: 10_000 });
  await shot(page, "pm", "11-finish-confirm");
  await dialog.getByRole("button", { name: "Finish and hand in" }).click();
  await page.getByText(/Your answers are handed in|Your assessment is done/).first().waitFor({ timeout: 30_000 });
  c.ok(true, "sheet handed in");
  await shot(page, "pm", "12-after-finish");
}

/** Sorts every request of a categorize item through its segmented pickers; one through the decision tool. */
async function answerCategorize(page: Page, item: SheetItemLite, index: number, c: Checks): Promise<void> {
  const task = item.task!;
  const groups = article(page).getByRole("radiogroup");
  const count = await groups.count();
  c.ok(count === (task.items ?? []).length, `classification Q${index + 1}: one picker per request (${count} of ${(task.items ?? []).length})`);
  const tool = article(page).getByRole("button", { name: "Use the decision tool" });
  c.ok((await tool.count()) === count, `classification Q${index + 1}: every request offers the decision tool`);
  // The first request through the decision tool: keep answering its first option until it decides.
  await tool.first().click();
  const helper = article(page).getByRole("group", { name: "Decision tool" }).first();
  await helper.waitFor();
  for (let guard = 0; guard < 6; guard += 1) {
    const outcome = helper.getByRole("status");
    if (await outcome.isVisible().catch(() => false)) break;
    await helper.locator("fieldset button").first().click();
    await page.waitForTimeout(100);
  }
  const decided = (await helper.getByRole("status").textContent().catch(() => null)) ?? "";
  c.fact(`decision tool for request 1: ${decided.trim()}`);
  const firstChecked = await groups.first().getByRole("radio", { checked: true }).count();
  if (!firstChecked) await groups.first().getByRole("radio").first().click();
  for (let i = 1; i < count; i += 1) {
    const radios = groups.nth(i).getByRole("radio");
    await radios.nth(i % (await radios.count())).click();
  }
  await page.waitForTimeout(300);
  const sorted = (await article(page).getByText(/^\d+ of \d+ sorted$/).textContent()) ?? "";
  c.ok(sorted.startsWith(`${count} of ${count}`), `classification Q${index + 1}: all ${count} requests sorted ("${sorted}")`);
  c.ok((await chipLabel(page, index)).includes("answered"), `Q${index + 1} (classification) answered`);
  await shot(page, "pm", "08-classification");
}

/** Holds the short client conversation: two replies, the mock AI client answers each, then finish. */
async function answerRoleplay(page: Page, item: SheetItemLite, index: number, c: Checks): Promise<void> {
  const turns = item.task?.maxTurns ?? 2;
  c.ok(turns >= 2 && turns <= 3, `role-play Q${index + 1} allows ${turns} replies (2-3)`);
  await article(page).getByRole("button", { name: "Start the conversation" }).click();
  const log = article(page).getByRole("log", { name: "Conversation" });
  await log.waitFor({ timeout: 20_000 });
  const replies = [
    "Thanks for flagging this. What you describe changes the flow we agreed and signed off, so it is a change request, not a bug. I will write it up with the impact on time and cost.",
    "I will send the change request form with the estimate by tomorrow 5 pm your time. Once you approve it, we plan it into the next sprint without moving the current release.",
  ];
  for (let t = 0; t < turns; t += 1) {
    const before = await log.locator("li").count();
    const box = article(page).getByLabel(/^Your reply to /);
    await box.waitFor({ timeout: 10_000 });
    await box.fill(replies[t % replies.length]);
    await article(page).getByRole("button", { name: "Send", exact: true }).click();
    await poll(`client reply ${t + 1}`, 30_000, async () => {
      const typing = await log.getByText(/is typing/).count();
      return !typing && (await log.locator("li").count()) >= before + 2 ? true : null;
    }, 300);
  }
  const lines = await log.locator("li").allInnerTexts();
  c.ok(lines.length >= turns * 2, `role-play: ${turns} PM replies and the client's answers are in the log (${lines.length} lines)`);
  c.fact(`role-play transcript: ${lines.map((l) => l.replace(/\s+/g, " ").slice(0, 90)).join(" | ")}`);
  await article(page).getByRole("region", { name: "Finish" }).getByRole("button", { name: "Finish the conversation" }).click();
  await article(page).getByText("Conversation finished.", { exact: false }).waitFor({ timeout: 20_000 });
  c.ok(true, "role-play finished (scored with the rest at hand-in)");
  c.ok((await chipLabel(page, index)).includes("answered"), `Q${index + 1} (role-play) answered`);
  await shot(page, "pm", "09-roleplay");
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

async function waitForPath(admin: Page, userId: string, c: Checks): Promise<PathItem[]> {
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
  await shot(admin, "pm", "13-admin-path-tab");
  return [...data.path!.items].sort((x, y) => x.position - y.position);
}

/** 0 lifecycle, 1 terminology, 2 meetings, 3 anything else. */
function part1Rank(targetSkill: string): number {
  if (LIFECYCLE.some((n) => sameSkill(targetSkill, n))) return 0;
  if (sameSkill(targetSkill, TERMS)) return 1;
  if (sameSkill(targetSkill, MEETINGS)) return 2;
  return 3;
}

// ---------------------------------------------------------------------------
// Handbook: confirm a term, see it in the course tooltip and the glossary
// ---------------------------------------------------------------------------

/** Hovers the first inline link for the term and returns the card's text. */
async function termCard(page: Page): Promise<string> {
  const link = page.locator("main").getByRole("button", { name: /^(change request|change requests|CR|CRs)$/i }).first();
  await link.waitFor({ timeout: 20_000 });
  await link.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await link.hover();
  const card = page.getByRole("dialog").filter({ hasText: "Open in glossary" }).filter({ hasText: TERM_TEXT }).first();
  await card.waitFor({ timeout: 10_000 });
  const text = (await card.innerText()).replace(/\s+/g, " ");
  await page.mouse.move(0, 0);
  await page.keyboard.press("Escape");
  await card.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => undefined);
  return text;
}

async function runHandbook(admin: Page, stamp: string, c: Checks): Promise<void> {
  const meaning = `At Oyelabs a change request is any change to signed-off scope; the PM raises it with the CR form within one working day (e2e ${stamp}).`;

  step(`open a course topic that links [[term:${TERM_ID}]]`);
  await admin.goto(`${BASE}${TOPIC_URL}`, { waitUntil: "networkidle" });
  const before = await termCard(admin);
  c.ok(/Industry standard – to confirm/.test(before), `before: the tooltip reads "to confirm" (${before.slice(0, 120)})`);
  c.ok(!before.includes(meaning), "before: the tooltip does not have the new text yet");
  await shot(admin, "pm", "14-tooltip-before");

  step("in the same tab, Admin → Handbook: edit and confirm the term");
  await spaNavigate(admin, `/admin/handbook?q=${TERM_ID}`);
  await admin.getByRole("heading", { name: "Handbook", exact: true }).waitFor({ timeout: 20_000 });
  const row = admin.locator("li").filter({ has: admin.getByRole("button", { name: /^Edit Change request$/i }) });
  await row.waitFor({ timeout: 20_000 });
  c.ok(await row.getByText("To confirm", { exact: true }).isVisible(), "the term is listed as To confirm");
  c.ok(await row.getByRole("button", { name: /^Confirm Change request$/i }).isVisible(), "a one-click Confirm is offered");
  await row.getByRole("button", { name: /^Edit Change request$/i }).click();
  const field = admin.getByLabel(/^What it means at Oyelabs/);
  await field.waitFor({ timeout: 10_000 });
  await field.fill(meaning);
  await shot(admin, "pm", "15-handbook-edit");
  await admin.getByRole("button", { name: "Save & confirm", exact: true }).click();
  await field.waitFor({ state: "hidden", timeout: 15_000 });
  await row.getByText("Confirmed", { exact: true }).waitFor({ timeout: 10_000 });
  c.ok(true, "the list shows the term Confirmed");
  await shot(admin, "pm", "16-handbook-confirmed");

  const { terms } = await getJson<{ terms: { id: string; status: string; oyelabsMeaning: string }[] }>(admin.request, "/api/handbook/glossary");
  const saved = terms.find((t) => t.id === TERM_ID);
  c.ok(saved?.status === "confirmed" && saved.oyelabsMeaning === meaning, "server: the glossary API serves the confirmed term with the new text");

  step("back to the topic in the same tab: the tooltip shows the confirmed entry");
  await spaNavigate(admin, TOPIC_URL);
  const after = await termCard(admin);
  c.ok(/Confirmed by Oyelabs/.test(after), `after (same tab): the tooltip reads "Confirmed by Oyelabs" (${after.slice(0, 120)})`);
  c.ok(after.includes(meaning), "after (same tab): the tooltip shows the new Oyelabs meaning");
  await shot(admin, "pm", "17-tooltip-after");

  step("after a reload too");
  await admin.goto(`${BASE}${TOPIC_URL}`, { waitUntil: "networkidle" });
  const reloaded = await termCard(admin);
  c.ok(/Confirmed by Oyelabs/.test(reloaded) && reloaded.includes(meaning), "after reload: the tooltip shows the confirmed entry and the new text");

  step("the glossary");
  await admin.goto(`${BASE}/glossary/${TERM_ID}`, { waitUntil: "networkidle" });
  const main = admin.locator("main");
  await main.getByText(meaning).first().waitFor({ timeout: 20_000 });
  c.ok(await main.getByText(meaning).first().isVisible(), "the glossary entry shows the new Oyelabs meaning");
  c.ok((await main.getByText("Confirmed by Oyelabs").count()) > 0, "the glossary shows Confirmed by Oyelabs");
  await shot(admin, "pm", "18-glossary");
}

// ---------------------------------------------------------------------------
// The pass
// ---------------------------------------------------------------------------

async function runPm(browser: Browser, admin: Page, stamp: string): Promise<Checks> {
  const c = new Checks("PM processes academy (v4.2)");
  console.log(`\n=== ${c.name} ===`);
  const username = `e2e42-pm-${stamp}`;
  let learnerCtx: BrowserContext | null = null;
  try {
    // ---- 1. Onboarding ----
    step("onboard on /admin/onboard");
    await openOnboarding(admin, username);

    step("v4.2 default PM sliders are prefilled");
    await admin.getByText(/Suggested defaults for Project Management/).waitFor({ timeout: 10_000 });
    for (const d of PM_DEFAULTS) {
      const value = await sliderValue(admin, d.name);
      c.ok(value === SLIDER_LABEL[d.slider], `default ${d.name} = ${SLIDER_LABEL[d.slider]} (got ${value ?? "missing"})`);
    }
    await shot(admin, "pm", "01-defaults-prefilled");

    step("read the understanding panel");
    const text = await readUnderstanding(admin, (t) => /white-label/i.test(t) && /Custom project lifecycle/.test(t));
    c.ok(/white-label/i.test(text), "understanding carries the description (white-label)");
    c.ok(!/Rules only/.test(text), "understanding came from the AI (not rules only)");
    c.fact(`understanding: ${text.slice(0, 400)}`);
    await shot(admin, "pm", "02-understanding");

    const { userId, tempPassword, assessmentId } = await createAndAssign(admin, username, c);

    step("check the personalised sheet");
    const detail = await getJson<V4Detail>(admin.request, `/api/admin/assessments/${assessmentId}/v4`);
    const report = detail.config.personalisation;
    c.ok(report?.understandingSource === "ai", `personalisation read by the AI (got ${report?.understandingSource})`);
    c.ok(!report?.fallbackReason, `no bank-only fallback${report?.fallbackReason ? ` (${report.fallbackReason})` : ""}`);
    const items = detail.items;
    c.ok(items.length === 25, `25 questions (got ${items.length})`);
    const est = items.reduce((s, i) => s + (i.estSeconds ?? 0), 0);
    c.fact(`estimate ${est} s = ${(est / 60).toFixed(1)} min; reused ${report?.reused}, generated ${report?.generated}; themes: ${(report?.themes ?? []).join(", ")}`);
    c.ok(est >= 26 * 60 && est <= 32 * 60, `sheet estimate ${(est / 60).toFixed(1)} min is within 26–32`);
    c.fact(`kinds: ${items.map((i) => `${i.skillName.split(" ")[0]}:${kindOf(i)}`).join(", ")}`);
    const classifyItems = items.filter((i) => isClassify(i.task));
    c.ok(classifyItems.length > 0, `a classify-the-request item is on the sheet (${classifyItems.length})`);
    const whiteLabel = items.filter((i) => sameSkill(i.skillName, "White-label project lifecycle") || /white[- ]label/i.test(JSON.stringify([i.prompt, i.task ?? null])));
    c.ok(whiteLabel.length > 0, `a white-label item is on the sheet (${whiteLabel.length})`);
    c.ok(items.some((i) => i.task?.kind === "roleplay"), "a mini role-play is on the sheet");

    // ---- 2. The learner ----
    learnerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["camera", "microphone"] });
    const page = await learnerCtx.newPage();
    page.on("pageerror", (error) => console.log(`    [learner pageerror] ${error.message}`));
    step(`learner ${username} signs in`);
    await signIn(page, username, tempPassword, LEARNER_NEW);
    await page.goto(`${BASE}/assessment`, { waitUntil: "networkidle" });
    await shot(page, "pm", "06-learner-assessment");
    await passPreflight(page, learnerCtx.request, assessmentId, c);
    const sheet = await readSheet(learnerCtx.request, assessmentId);
    const total = sheet.length;
    const categorize = sheet.findIndex((i) => isClassify(i.task));
    const roleplay = sheet.findIndex((i) => i.task?.kind === "roleplay");
    c.ok(categorize >= 0, "learner sheet: a classification (categorize) item is present");
    c.ok(roleplay >= 0, "learner sheet: a role-play item is present");

    const plan: { index: number; run: () => Promise<void> }[] = [];
    if (categorize >= 0) plan.push({ index: categorize, run: () => answerCategorize(page, sheet[categorize], categorize, c) });
    if (roleplay >= 0) plan.push({ index: roleplay, run: () => answerRoleplay(page, sheet[roleplay], roleplay, c) });
    const mcq = sheet.findIndex((i) => i.type === "mcq");
    if (mcq >= 0) plan.push({ index: mcq, run: async () => void (await article(page).locator('input[type="radio"]').first().check()) });
    plan.sort((a, b) => a.index - b.index);
    for (const entry of plan) {
      await goTo(page, entry.index, total);
      await entry.run();
    }
    // Moving off the last one flushes its draft.
    await goTo(page, plan[0].index === 0 ? 1 : 0, total);

    const drafts = await poll("drafts saved", 15_000, async () => {
      const s = await readSheet(learnerCtx!.request, assessmentId);
      return plan.every((p) => s[p.index].draft !== null) ? s : null;
    }, 500).catch(() => null);
    c.ok(drafts !== null, "server: every answered item has a draft");
    if (drafts && categorize >= 0) {
      const picks = (drafts[categorize].draft as { task?: { picks?: Record<string, string> } } | null)?.task?.picks ?? {};
      c.ok(Object.keys(picks).length === (sheet[categorize].task?.items ?? []).length, `server: the classification draft has every pick (${JSON.stringify(picks)})`);
    }
    if (drafts && roleplay >= 0) {
      const draft = (drafts[roleplay].draft as { task?: { sessionId?: string; transcript?: unknown[] } } | null)?.task;
      c.ok(Boolean(draft?.sessionId) && (draft?.transcript?.length ?? 0) >= 4, `server: the role-play draft points at its session with the transcript (${draft?.transcript?.length ?? 0} lines)`);
    }

    await finishSheet(page, c);

    // ---- 3. The path ----
    const pathItems = await waitForPath(admin, userId, c);
    const lines = pathItems.map((i) => `[P${i.partNumber}] ${i.courseTitle} <- ${i.targetSkill ?? "-"}`);
    console.log(lines.map((l) => `      ${l}`).join("\n"));
    c.fact(`path: ${lines.join(" | ")}`);
    const refreshAt = pathItems.findIndex((i) => /Improving your existing PM skills/i.test(`${i.courseTitle} ${i.targetSkill ?? ""}`) && !LIFECYCLE.some((n) => sameSkill(i.targetSkill, n)));
    if (refreshAt >= 0) c.ok(refreshAt === 0, `the diagnostic refresh opens the path (at ${refreshAt})`);
    else c.note("no diagnostic refresh on this path (the assessment found no gaps for it)");
    /* v4.3 (D4, D7): the skill graph makes the agency SDLC a prerequisite of both lifecycle courses,
       and a path never schedules a skill before its prerequisites, so when the SDLC is needed it comes
       right before them. The process order is checked on the rest of Part 1. */
    const part1 = pathItems.filter((i) => i.partNumber === 1 && i.targetSkill && !LIFECYCLE_PREREQS.some((n) => sameSkill(i.targetSkill, n)));
    const prereqAt = pathItems.findIndex((i) => LIFECYCLE_PREREQS.some((n) => sameSkill(i.targetSkill, n)));
    const firstLifecycleAt = pathItems.findIndex((i) => LIFECYCLE.some((n) => sameSkill(i.targetSkill, n)));
    if (prereqAt >= 0) c.ok(prereqAt < firstLifecycleAt, `the lifecycle courses' prerequisite comes before them (${prereqAt} < ${firstLifecycleAt})`);
    const firstOf = (pred: (name: string) => boolean) => part1.findIndex((i) => pred(i.targetSkill!));
    const lifecycleAt = firstOf((n) => part1Rank(n) === 0);
    const termsAt = firstOf((n) => part1Rank(n) === 1);
    const meetingsAt = firstOf((n) => part1Rank(n) === 2);
    const otherAt = firstOf((n) => part1Rank(n) === 3);
    c.ok(LIFECYCLE.every((n) => part1.some((i) => sameSkill(i.targetSkill, n))), "both lifecycle courses (custom, white-label) are in Part 1");
    c.ok(termsAt >= 0 && meetingsAt >= 0, "terminology and client meetings are in Part 1");
    c.ok(lifecycleAt === 0, `Part 1 starts with a lifecycle course (got "${part1[0]?.targetSkill}")`);
    c.ok(lifecycleAt < termsAt && termsAt < meetingsAt, `lifecycle (${lifecycleAt}) < terminology (${termsAt}) < meetings (${meetingsAt}) in Part 1`);
    c.ok(otherAt < 0 || meetingsAt < otherAt, `every other skill comes after the process courses in Part 1 (first other at ${otherAt})`);
    const ranks = part1.map((i) => part1Rank(i.targetSkill!));
    c.ok(ranks.every((r, i) => i === 0 || r >= ranks[i - 1]), `Part 1 never goes back to an earlier process group (${ranks.join(",")})`);
    c.ok(pathItems.every((item, i) => i === 0 || (item.partNumber ?? 0) >= (pathItems[i - 1].partNumber ?? 0)), "part numbers never go backwards");

    // ---- 4. Handbook ----
    await runHandbook(admin, stamp, c);
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
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<number> {
  fs.mkdirSync(SHOTS, { recursive: true });
  const stamp = Date.now().toString(36);
  const dataDir = path.join(os.tmpdir(), `oyelearn-e2e42-${stamp}`);
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
    if (process.argv.includes("handbook")) {
      // Step 4 alone, for quick iteration on the handbook checks.
      const c = new Checks("Handbook confirm, tooltip and glossary (v4.2)");
      console.log(`\n=== ${c.name} ===`);
      await runHandbook(admin, stamp, c).catch(async (error: Error) => {
        c.failures.push(`aborted: ${error.message.split("\n")[0]}`);
        console.log(`    \u001b[31mABORT\u001b[0m ${error.stack ?? error}`);
        await shot(admin, "pm", "99-admin-at-failure");
      });
      results.push(c);
    } else results.push(await runPm(browser, admin, stamp));
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
  return results.length === 1 && results.every((r) => r.failures.length === 0) ? 0 : 1;
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
