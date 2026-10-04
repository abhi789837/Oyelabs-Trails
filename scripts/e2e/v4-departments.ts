/**
 * Oyelearn v4 end-to-end check, one pass per department (Engineering, Project Management, Business
 * Development): superadmin onboards a learner through the real Setup UI, the learner sits the v4
 * sheet, and the superadmin checks the path that comes out of it.
 *
 *   npm run build          # once; this script serves dist/ + dist-server/ and does not rebuild
 *   npx tsx scripts/e2e/v4-departments.ts            # all three
 *   npx tsx scripts/e2e/v4-departments.ts pm bd      # a subset (eng | pm | bd)
 *
 * Needs a Piston at http://127.0.0.1:2000 (override with PISTON_URL). Uses a throwaway DATA_DIR
 * under %TEMP%, port 8799, and the deterministic mock AI provider (NODE_ENV=development).
 * Screenshots go to %TEMP%/claude/e2e-shots (override with E2E_SHOTS). Set E2E_HEADED=1 to watch.
 *
 * Exits non-zero when any assertion fails, and always stops the server it started.
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
const SHOTS = process.env.E2E_SHOTS ?? path.join(os.tmpdir(), "claude", "e2e-shots");
const HEADED = process.env.E2E_HEADED === "1";
const JOB_TIMEOUT_MS = Number(process.env.E2E_JOB_TIMEOUT_MS ?? 6 * 60_000);

type DeptKey = "eng" | "pm" | "bd";

interface DeptSpec {
  key: DeptKey;
  department: string;
  track: RegExp;
  stack: string;
  experience: RegExp;
  /** Picked in this order, then slid to Critical / High / Medium. */
  skills: { name: string; slider: 5 | 4 | 3 }[];
  coding: boolean;
}

const DEPTS: DeptSpec[] = [
  {
    key: "eng",
    department: "Engineering",
    track: /^Full-Stack/,
    stack: "React",
    experience: /^1–2/,
    skills: [
      { name: "TypeScript fundamentals", slider: 5 },
      { name: "React hooks", slider: 4 },
      { name: "Docker fundamentals", slider: 3 },
    ],
    coding: true,
  },
  {
    key: "pm",
    department: "Project Management",
    track: /^Agile Delivery PM/,
    stack: "Jira",
    experience: /^3–5/,
    skills: [
      { name: "Writing user stories", slider: 5 },
      { name: "Change requests", slider: 4 },
      { name: "Risk management", slider: 3 },
    ],
    coding: false,
  },
  {
    key: "bd",
    department: "Business Development",
    track: /^Agency BD/,
    stack: "HubSpot",
    experience: /^1–2/,
    skills: [
      { name: "Cold email", slider: 5 },
      { name: "Running discovery calls", slider: 4 },
      { name: "Objection handling", slider: 3 },
    ],
    coding: false,
  },
];

const SLIDER_LABEL: Record<number, string> = { 1: "Optional", 2: "Low", 3: "Medium", 4: "High", 5: "Critical" };

// ---------------------------------------------------------------------------
// Assertions and logging
// ---------------------------------------------------------------------------

class Checks {
  failures: string[] = [];
  notes: string[] = [];
  constructor(readonly dept: string) {}
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
}

function step(message: string): void {
  console.log(`  - ${message}`);
}

async function shot(page: Page, dept: string, name: string): Promise<void> {
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOTS, `${dept}-${name}.png`), fullPage: true }).catch(() => undefined);
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

async function onboard(admin: Page, spec: DeptSpec, username: string, c: Checks): Promise<{ userId: string; tempPassword: string }> {
  step("onboard on /admin/onboard");
  await admin.goto(`${BASE}/admin/onboard`, { waitUntil: "networkidle" });
  await admin.getByRole("heading", { name: "Onboard a learner" }).waitFor();
  await admin.getByRole("radiogroup", { name: "Department" }).waitFor({ timeout: 20_000 });

  await admin.getByLabel(/^username/i).fill(username);
  await admin.getByLabel(/^full name/i).fill(`E2E ${spec.department}`);

  await admin.getByRole("radiogroup", { name: "Department" }).getByRole("radio", { name: spec.department, exact: true }).click();
  // v4.3: onboarding opens on quick onboarding; "Edit details" opens the full Setup form this script drives.
  await admin.getByRole("button", { name: "Edit details" }).click();
  const track =admin.getByRole("radiogroup", { name: "Track" }).getByRole("radio", { name: spec.track });
  await track.click();
  c.ok((await track.getAttribute("aria-checked")) === "true", `track ${spec.track.source} selected`);

  // Stack / tools: a searchable multi-select.
  await admin.getByRole("button", { name: /Choose (stacks|tools)/ }).click();
  await admin.getByRole("option", { name: spec.stack, exact: true }).click();
  await admin.keyboard.press("Escape");
  c.ok(await admin.getByRole("list", { name: /Chosen (stacks|tools)/ }).getByRole("button", { name: `Remove ${spec.stack}`, exact: true }).isVisible(), `${spec.stack} chosen`);

  await admin.getByRole("radiogroup", { name: "Experience (years)" }).getByRole("radio", { name: spec.experience }).click();

  // Priorities: three skills through the goal box (v4.3: skills, cases and free text in one picker),
  // then their sliders. A department default may already hold a skill; the slider is set either way.
  for (const skill of spec.skills) {
    const thumb = admin.getByRole("slider", { name: `${skill.name} priority`, exact: true });
    if ((await thumb.count()) === 0) {
      // The results re-render while the department's cases load, so the option may not be stable:
      // reopen the picker when it closed, and click without waiting for stability.
      for (let attempt = 0; attempt < 4 && (await thumb.count()) === 0; attempt += 1) {
        const input = admin.getByPlaceholder(/Git, “merge conflict”/);
        // A skill pick leaves the picker open for the next one, so always search afresh.
        if (!(await input.isVisible().catch(() => false))) {
          await admin.locator("button", { hasText: "Add a skill, a practical case, or type a goal" }).first().click();
          await input.waitFor({ timeout: 5_000 });
        }
        await input.fill(skill.name);
        const option = admin.getByRole("option").filter({ hasText: new RegExp(`^${escapeRegex(skill.name)}`) }).first();
        await option.waitFor({ timeout: 10_000 });
        await option.click({ force: true, timeout: 5_000 }).catch(() => undefined);
        await thumb.waitFor({ timeout: 2_000 }).catch(() => undefined);
      }
      await thumb.waitFor({ timeout: 5_000 });
    }
    if (await admin.getByPlaceholder(/Git, “merge conflict”/).isVisible().catch(() => false)) {
      await admin.keyboard.press("Escape");
      await admin.getByPlaceholder(/Git, “merge conflict”/).waitFor({ state: "hidden", timeout: 5_000 });
    }
    await thumb.focus();
    await thumb.press("Home");
    for (let i = 1; i < skill.slider; i += 1) await thumb.press("ArrowRight");
    const value = await thumb.getAttribute("aria-valuetext");
    c.ok(value === SLIDER_LABEL[skill.slider], `${skill.name} slider reads ${SLIDER_LABEL[skill.slider]} (got ${value})`);
  }
  await shot(admin, spec.key, "01-onboard-filled");

  await admin.getByRole("button", { name: "Create & assign assessment" }).click();
  const notice = admin.getByRole("status").filter({ hasText: "Account created for" });
  await notice.waitFor({ timeout: 30_000 });
  const message = (await notice.locator("pre").textContent()) ?? "";
  const tempPassword = /Temporary password: (\S+)/.exec(message)?.[1] ?? "";
  c.ok(tempPassword.length >= 8, "temporary password captured from the notice");
  await shot(admin, spec.key, "02-onboard-created");

  const { users } = await getJson<{ users: { id: string; username: string }[] }>(admin.request, "/api/admin/users");
  const user = users.find((u) => u.username === username);
  if (!user) throw new Error(`created user ${username} not found in /api/admin/users`);

  // What was saved is what the sliders said.
  const { setup } = await getJson<{ setup: { priorities: { skillName: string; slider: number }[] } }>(admin.request, `/api/admin/users/${user.id}/setup`);
  for (const skill of spec.skills) {
    const saved = setup.priorities.find((p) => p.skillName === skill.name);
    c.ok(saved?.slider === skill.slider, `saved priority ${skill.name} = ${SLIDER_LABEL[skill.slider]} (got ${saved ? SLIDER_LABEL[saved.slider] : "missing"})`);
  }

  // v4.1: with AI available the assessment is personalised in a background job, so it starts as
  // "generating" and turns "ready" when the job finishes.
  let assessments: { id: string; status: string }[] = [];
  for (const deadline = Date.now() + JOB_TIMEOUT_MS; Date.now() < deadline; await new Promise((r) => setTimeout(r, 1000))) {
    ({ assessments } = await getJson<{ assessments: { id: string; status: string }[] }>(admin.request, `/api/admin/users/${user.id}/assessments`));
    if (assessments[0]?.status === "ready") break;
  }
  c.ok(assessments[0]?.status === "ready", `assessment issued and ready (got ${assessments[0]?.status})`);
  return { userId: user.id, tempPassword };
}

// ---------------------------------------------------------------------------
// The learner: pre-flight and the sheet
// ---------------------------------------------------------------------------

interface SheetItemLite {
  id: string;
  type: "coding" | "mcq" | "task";
  state: string;
  runsUsed: number;
  draft: unknown;
  snippet?: string | null;
  runsOn?: string | null;
  language?: string;
  task?: { kind: string };
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

async function passPreflight(page: Page, request: APIRequestContext, assessmentId: string, spec: DeptSpec, c: Checks): Promise<void> {
  step("pre-flight");
  await page.getByRole("heading", { name: "Before you start" }).waitFor({ timeout: 20_000 });
  await shot(page, spec.key, "03-preflight-consent");
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
  await shot(page, spec.key, "04-preflight-camera");

  if (calibrated) {
    await cont.click();
    await page.getByRole("button", { name: "Play the warning tone" }).click();
    await page.getByRole("button", { name: "I heard it" }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: /Enter fullscreen and start/ }).click();
    c.note("pre-flight passed through the UI");
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
  // v4.1: "About N minutes" follows the count directly in the header text.
  await page.getByText(/^Question \d+ of \d+(?!\d)/).waitFor({ timeout: 20_000 });
}

const chip = (page: Page, index: number) => page.getByRole("navigation", { name: "Questions" }).getByRole("button", { name: new RegExp(`^Question ${index + 1}:`) });

async function goTo(page: Page, index: number, total: number): Promise<void> {
  await chip(page, index).click();
  await page.getByText(new RegExp(`^Question ${index + 1} of ${total}(?!\\d)`)).waitFor();
}

async function chipLabel(page: Page, index: number): Promise<string> {
  return (await chip(page, index).getAttribute("aria-label")) ?? "";
}

async function readSheet(request: APIRequestContext, assessmentId: string): Promise<SheetItemLite[]> {
  const sheet = await getJson<{ items: SheetItemLite[] }>(request, `/api/assessment/${assessmentId}/sheet`);
  return sheet.items;
}

const article = (page: Page): Locator => page.locator("article").first();

async function editCode(page: Page): Promise<void> {
  const editor = article(page).locator(".monaco-editor").first();
  await editor.waitFor({ timeout: 20_000 });
  await editor.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type(" ");
  await page.waitForTimeout(200);
}

async function pressRun(page: Page, expectLeft: number): Promise<void> {
  const button = article(page).getByRole("button", { name: /^(Run|Run and submit)$/ });
  await button.click();
  await article(page).getByText(new RegExp(`Runs left: ${expectLeft}`)).waitFor({ timeout: 45_000 });
}

async function takeEngineering(page: Page, request: APIRequestContext, assessmentId: string, items: SheetItemLite[], c: Checks): Promise<void> {
  const total = items.length;
  const idx = (pred: (it: SheetItemLite) => boolean, skip: number[] = []) => items.findIndex((it, i) => !skip.includes(i) && pred(it));
  const browserCoding = (it: SheetItemLite) => it.type === "coding" && it.runsOn === "browser";
  let a = idx(browserCoding);
  if (a < 0) a = idx((it) => it.type === "coding");
  let b = idx(browserCoding, [a]);
  if (b < 0) b = idx((it) => it.type === "coding", [a]);
  const snip = idx((it) => it.type === "mcq" && Boolean(it.snippet) && Boolean(it.runsOn), [a, b]);
  const used = [a, b, snip].filter((i) => i >= 0);
  const plainMcq = idx((it) => it.type === "mcq", used);
  const task = idx((it) => it.type === "task", [...used, plainMcq]);
  const unknownIdx = idx(() => true, [...used, plainMcq, task]);

  c.ok(a >= 0 && b >= 0, `two coding items on the sheet (${items.filter((i) => i.type === "coding").length} coding, ${total} total)`);
  if (a < 0 || b < 0) return;

  const plan: { index: number; run: () => Promise<void> }[] = [];

  plan.push({
    index: a,
    run: async () => {
      step(`coding Q${a + 1}: run twice`);
      await editCode(page);
      await pressRun(page, 2);
      await pressRun(page, 1);
      c.ok(await article(page).getByRole("button", { name: "Run and submit" }).isEnabled(), `Q${a + 1} still open after two runs (next run submits)`);
      await shot(page, "eng", "05-coding-two-runs");
    },
  });
  plan.push({
    index: b,
    run: async () => {
      step(`coding Q${b + 1}: use all three runs`);
      await editCode(page);
      await pressRun(page, 2);
      await pressRun(page, 1);
      await pressRun(page, 0);
      await article(page).getByText("That was your third run").waitFor({ timeout: 15_000 });
      c.ok(await article(page).getByText("Submitted", { exact: true }).isVisible(), `Q${b + 1} shows Submitted after the third run`);
      c.ok(!(await article(page).getByRole("button", { name: /^(Run|Run and submit)$/ }).isEnabled()), `Q${b + 1} Run is disabled`);
      c.ok((await article(page).getByRole("button", { name: "Submit answer" }).count()) === 0, `Q${b + 1} has no Submit answer button (read-only)`);
      // Typing into a read-only Monaco changes nothing.
      const before = await article(page).locator(".monaco-editor .view-lines").innerText();
      await article(page).locator(".monaco-editor").first().click();
      await page.keyboard.type("zzz");
      const after = await article(page).locator(".monaco-editor .view-lines").innerText();
      c.ok(before === after, `Q${b + 1} editor is read-only`);
      c.ok((await chipLabel(page, b)).includes("submitted"), `navigator marks Q${b + 1} submitted`);
      await shot(page, "eng", "06-coding-three-runs-submitted");
    },
  });
  if (snip >= 0) {
    plan.push({
      index: snip,
      run: async () => {
        step(`MCQ with snippet Q${snip + 1}: run, then pick`);
        await pressRun(page, 2);
        await article(page).locator('input[type="radio"]').nth(1).check();
        c.ok((await chipLabel(page, snip)).includes("answered"), `Q${snip + 1} answered after Run + pick`);
        await shot(page, "eng", "07-mcq-snippet-run");
      },
    });
  } else {
    c.note("no MCQ with a runnable snippet was assembled on this sheet");
  }
  if (plainMcq >= 0) {
    plan.push({
      index: plainMcq,
      run: async () => {
        step(`MCQ Q${plainMcq + 1}: pick`);
        await article(page).locator('input[type="radio"]').first().check();
        c.ok((await chipLabel(page, plainMcq)).includes("answered"), `Q${plainMcq + 1} answered`);
      },
    });
  }
  if (task >= 0) {
    plan.push({
      index: task,
      run: async () => {
        step(`task Q${task + 1} (${items[task].task?.kind}): answer`);
        await answerTask(page, items[task].task?.kind ?? "");
        c.ok((await chipLabel(page, task)).includes("answered"), `Q${task + 1} answered`);
      },
    });
  }
  if (unknownIdx >= 0) {
    plan.push({
      index: unknownIdx,
      run: async () => {
        step(`Q${unknownIdx + 1}: I don't know yet`);
        await article(page).getByRole("button", { name: "I don't know yet" }).click();
        c.ok((await chipLabel(page, unknownIdx)).includes("I don't know yet"), `Q${unknownIdx + 1} marked "I don't know yet"`);
      },
    });
  }

  plan.sort((x, y) => x.index - y.index);
  for (const entry of plan) {
    await goTo(page, entry.index, total);
    await entry.run();
  }

  // Backwards with the navigator to the earliest item touched; its state must have survived.
  const first = plan[0].index;
  const last = plan[plan.length - 1].index;
  step(`navigator: back from Q${last + 1} to Q${first + 1}`);
  await goTo(page, first, total);
  c.ok(await page.getByText(new RegExp(`^Question ${first + 1} of ${total}(?!\\d)`)).isVisible(), `navigator moved back to Q${first + 1}`);
  await shot(page, "eng", "08-navigator-back");

  const sheet = await readSheet(request, assessmentId);
  c.ok(sheet[a].runsUsed === 2 && sheet[a].state !== "submitted", `server: Q${a + 1} runsUsed=2, open (got ${sheet[a].runsUsed}, ${sheet[a].state})`);
  c.ok(sheet[b].runsUsed === 3 && sheet[b].state === "submitted", `server: Q${b + 1} runsUsed=3, submitted (got ${sheet[b].runsUsed}, ${sheet[b].state})`);
  if (snip >= 0) c.ok(sheet[snip].runsUsed === 1, `server: snippet Q${snip + 1} runsUsed=1 (got ${sheet[snip].runsUsed})`);
}

async function answerTask(page: Page, kind: string): Promise<void> {
  const art = article(page);
  switch (kind) {
    case "rank":
      await art.getByRole("button", { name: /^Move ".*" down$/ }).first().click();
      break;
    case "calculate": {
      const inputs = art.locator('input[id*="-calc-"]');
      const count = await inputs.count();
      for (let i = 0; i < count; i += 1) await inputs.nth(i).fill(String(10 + i));
      break;
    }
    case "scenario": {
      const sets = art.locator("fieldset");
      const count = await sets.count();
      for (let i = 0; i < count; i += 1) await sets.nth(i).locator('input[type="radio"]').first().check();
      break;
    }
    case "spot":
      await art.locator("button[aria-pressed]").first().click();
      break;
    case "write":
      await art.locator("textarea").first().fill("Lead with the client's goal, confirm scope in writing, and agree the next step and owner before the call ends.");
      break;
    default:
      throw new Error(`unknown task kind ${kind}`);
  }
  await page.waitForTimeout(250);
}

async function takeTasks(page: Page, request: APIRequestContext, assessmentId: string, items: SheetItemLite[], spec: DeptSpec, c: Checks): Promise<void> {
  const total = items.length;
  const want = ["rank", "calculate", "scenario", "spot"] as const;
  const picks: { index: number; label: string }[] = [];
  for (const kind of want) {
    const index = items.findIndex((it, i) => it.type === "task" && it.task?.kind === kind && !picks.some((p) => p.index === i));
    if (index >= 0) picks.push({ index, label: kind });
    else c.note(`no ${kind} task was assembled on this sheet`);
  }
  const mcq = items.findIndex((it) => it.type === "mcq");
  c.ok(mcq >= 0, "an MCQ is on the sheet");
  // v4.1: a personalised sheet picks task kinds to fit the description (email, Excel, sims…), so
  // the check is variety, not a fixed set of kinds.
  const kinds = new Set(items.filter((i) => i.type === "task").map((i) => i.task?.kind));
  c.ok(kinds.size >= 3, `sheet has at least three task kinds (${items.map((i) => i.task?.kind ?? i.type).join(",")})`);
  if (mcq >= 0) picks.push({ index: mcq, label: "mcq" });
  picks.sort((x, y) => x.index - y.index);

  for (const pick of picks) {
    step(`${pick.label} Q${pick.index + 1}`);
    await goTo(page, pick.index, total);
    if (pick.label === "mcq") await article(page).locator('input[type="radio"]').first().check();
    else await answerTask(page, pick.label);
    c.ok((await chipLabel(page, pick.index)).includes("answered"), `Q${pick.index + 1} (${pick.label}) answered`);
    await shot(page, spec.key, `05-task-${pick.label}`);
  }

  if (mcq >= 0) {
    // Forward past it, then back with the navigator, and change the answer.
    const beyond = Math.min(total - 1, Math.max(...picks.map((p) => p.index)) + 1);
    await goTo(page, beyond, total);
    step(`navigator: back to Q${mcq + 1} and change the MCQ answer`);
    await goTo(page, mcq, total);
    const radios = article(page).locator('input[type="radio"]');
    c.ok(await radios.first().isChecked(), `Q${mcq + 1} kept its first answer`);
    await radios.nth(1).check();
    c.ok(await radios.nth(1).isChecked(), `Q${mcq + 1} changed to the second option`);
    await shot(page, spec.key, "06-navigator-changed");
    await goTo(page, beyond === mcq ? Math.max(0, mcq - 1) : beyond, total); // flushes the draft
    const sheet = await poll("changed MCQ draft saved", 10_000, async () => {
      const s = await readSheet(request, assessmentId);
      return (s[mcq].draft as { choice?: number } | null)?.choice === 1 ? s : null;
    }, 500).catch(() => null);
    c.ok(sheet !== null, `server: Q${mcq + 1} draft is the changed answer`);
  }
}

async function finishSheet(page: Page, spec: DeptSpec, c: Checks): Promise<void> {
  step("Finish");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const dialog = page.getByRole("alertdialog").or(page.getByRole("dialog")).filter({ hasText: "Finish the assessment?" });
  await dialog.waitFor({ timeout: 10_000 });
  await shot(page, spec.key, "09-finish-confirm");
  await dialog.getByRole("button", { name: "Finish and hand in" }).click();
  await page.getByText(/Your answers are handed in|Your assessment is done/).first().waitFor({ timeout: 30_000 });
  c.ok(true, "sheet handed in");
  await shot(page, spec.key, "10-after-finish");
}

// ---------------------------------------------------------------------------
// Path checks
// ---------------------------------------------------------------------------

interface PathItem {
  id: string;
  courseId: string | null;
  courseTitle: string;
  position: number;
  partNumber: number | null;
  targetSkill: string | null;
  moduleId?: string | null;
  partType?: string | null;
  reason: string;
}

interface GapsResponse {
  gaps: { skill: string; source: string; skipped: boolean }[];
  path: { status: string; failureReason: string | null; items: PathItem[] } | null;
}

async function checkPath(admin: Page, userId: string, spec: DeptSpec, c: Checks): Promise<void> {
  step("wait for evaluation");
  const assessment = await poll("assessment completed", JOB_TIMEOUT_MS, async () => {
    const { assessments } = await getJson<{ assessments: { status: string }[] }>(admin.request, `/api/admin/users/${userId}/assessments`);
    const status = assessments[0]?.status;
    if (status === "failed") throw new Error("assessment evaluation failed");
    return status === "completed" ? assessments[0] : null;
  }, 3000);
  c.ok(assessment.status === "completed", "assessment completed");
  await admin.goto(`${BASE}/admin/people/${userId}?tab=assessment`, { waitUntil: "networkidle" });
  await shot(admin, spec.key, "11-admin-assessment-tab");

  step("wait for the path");
  const data = await poll("path ready", JOB_TIMEOUT_MS, async () => {
    const g = await getJson<GapsResponse>(admin.request, `/api/admin/users/${userId}/gaps`);
    if (g.path?.status === "failed" || g.path?.status === "budget_reached") return g;
    return g.path?.status === "ready" ? g : null;
  }, 3000);
  const pathView = data.path!;
  c.ok(pathView.status === "ready", `path status ready (got ${pathView.status}${pathView.failureReason ? `: ${pathView.failureReason}` : ""})`);
  const items = [...pathView.items].sort((x, y) => x.position - y.position);
  c.ok(items.length > 0, `path has items (${items.length})`);
  console.log(
    items.map((i) => `      [P${i.partNumber}] ${i.courseTitle}  <- ${i.targetSkill ?? "-"}${i.moduleId ? ` (module ${i.moduleId})` : i.courseId ? " (course)" : ""}`).join("\n"),
  );

  // Part 1, then Part 2, then the rest — never going backwards.
  c.ok(items[0]?.partNumber === 1, `path opens with Part 1 (first item part ${items[0]?.partNumber})`);
  const firstTwo = items.findIndex((i) => i.partNumber === 2);
  c.ok(firstTwo > 0, "Part 2 follows Part 1");
  c.ok(firstTwo > 0 && items.slice(0, firstTwo).every((i) => i.partNumber === 1), "every item before Part 2 is Part 1");
  c.ok(items.every((item, i) => i === 0 || (item.partNumber ?? 0) >= (items[i - 1].partNumber ?? 0)), "part numbers never go backwards");

  // Every Critical/High priority: a course/module, or a visible reason on the Path tab.
  await admin.goto(`${BASE}/admin/people/${userId}?tab=path`, { waitUntil: "networkidle" });
  await admin.getByRole("heading", { name: "Learning path" }).waitFor();
  await admin.getByText(/Path built/).waitFor({ timeout: 20_000 });
  await shot(admin, spec.key, "12-admin-path-tab");

  for (const skill of spec.skills) {
    const covering = items.find((i) => sameSkill(i.targetSkill, skill.name));
    const section = admin.getByRole("region", { name: `${skill.name}, ${SLIDER_LABEL[skill.slider]}` });
    const visible = await section.isVisible().catch(() => false);
    c.ok(visible, `Path tab shows ${skill.name} as ${SLIDER_LABEL[skill.slider]}`);
    if (skill.slider < 4) continue;
    const hasCourse = Boolean(covering && (covering.moduleId || covering.courseId));
    const uiLink = visible ? (await section.getByRole("link").count()) > 0 : false;
    const uiReason = visible
      ? await section.getByText(/being prepared|Not built yet|failed before|hit its budget|Waiting for a research provider|attached no course/).isVisible().catch(() => false)
      : false;
    c.ok(hasCourse || uiReason, `${SLIDER_LABEL[skill.slider]} ${skill.name}: ${hasCourse ? `course/module "${covering!.courseTitle}"` : uiReason ? "visible reason" : "NO course and NO reason"}`);
    if (hasCourse) c.ok(uiLink, `${skill.name} course is a link on the Path tab`);
  }

  // AI-found extras: never a path item of their own, only under "Also suggested".
  // What was saved, not only what this script set: v4.1 pre-fills a PM's department defaults.
  const saved = await getJson<{ setup: { priorities: { skillName: string }[] } }>(admin.request, `/api/admin/users/${userId}/setup`);
  const priorityNames = [...new Set([...spec.skills.map((s) => s.name), ...saved.setup.priorities.map((p) => p.skillName)])];
  const extras = data.gaps.filter((g) => !g.skipped && !priorityNames.some((n) => sameSkill(g.skill, n)));
  const general = items.filter((i) => (i.partNumber ?? 0) >= 3);
  c.ok(general.every((i) => priorityNames.some((n) => sameSkill(i.targetSkill, n))), "every Part 3+ item serves an admin priority");
  /* v4.3 (D4, D8): the path algorithm itself may add a skill that is no priority: a graph
     prerequisite of one (a missing link, partType "prerequisite") or a core skill the evaluation
     found critically weak (a boosted must-have, "Moved up: the evaluation found …"). Those are the
     algorithm's own steps with a reason, not an AI-found gap leaking in, so they are reported. */
  const algorithmStep = (i: PathItem) => i.partType === "prerequisite" || /^(Moved up: the evaluation found|Before )/.test(i.reason);
  const added = items.filter((i) => i.targetSkill && !priorityNames.some((n) => sameSkill(i.targetSkill, n)) && algorithmStep(i));
  if (added.length) c.note(`path steps the algorithm added: ${[...new Set(added.map((i) => `${i.targetSkill} (${i.partType ?? "-"}: ${i.reason})`))].join("; ")}`);
  const leaked = items.filter((i) => i.targetSkill && !priorityNames.some((n) => sameSkill(i.targetSkill, n)) && extras.some((g) => sameSkill(i.targetSkill, g.skill)) && !algorithmStep(i));
  c.ok(leaked.length === 0, `no AI-found gap became a path target${leaked.length ? ` (${leaked.map((l) => l.targetSkill).join(", ")})` : ""}`);
  const also = admin.getByRole("button", { name: /Also suggested by the assessment/ });
  if (extras.length > 0) {
    c.ok(await also.isVisible(), `"Also suggested" lists ${extras.length} AI-found extra(s)`);
    await also.click();
    for (const g of extras.slice(0, 5)) {
      c.ok(await admin.getByRole("button", { name: "Promote" }).first().isVisible(), `"${g.skill}" offered under Also suggested`);
    }
    await shot(admin, spec.key, "13-admin-path-also-suggested");
  } else {
    c.ok((await also.count()) === 0, 'no "Also suggested" section when there are no extras');
  }
}

// ---------------------------------------------------------------------------
// One department
// ---------------------------------------------------------------------------

async function runDepartment(browser: Browser, admin: Page, spec: DeptSpec, stamp: string): Promise<Checks> {
  const c = new Checks(spec.department);
  console.log(`\n=== ${spec.department} ===`);
  const username = `e2e-${spec.key}-${stamp}`;
  let learnerCtx: BrowserContext | null = null;
  try {
    const { userId, tempPassword } = await onboard(admin, spec, username, c);

    learnerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["camera", "microphone"] });
    const page = await learnerCtx.newPage();
    page.on("pageerror", (error) => console.log(`    [learner pageerror] ${error.message}`));

    step(`learner ${username} signs in`);
    await signIn(page, username, tempPassword, LEARNER_NEW);
    c.ok(!page.url().includes("/change-password"), "learner changed the temporary password");
    await page.goto(`${BASE}/assessment`, { waitUntil: "networkidle" });

    const { assessment } = await getJson<{ assessment: { id: string; format: string } | null }>(learnerCtx.request, "/api/me/assessment");
    if (!assessment) throw new Error("learner has no assessment");
    c.ok(assessment.format === "v4", `assessment format v4 (got ${assessment.format})`);

    await passPreflight(page, learnerCtx.request, assessment.id, spec, c);
    const items = await readSheet(learnerCtx.request, assessment.id);
    c.ok(items.length > 0, `sheet loaded with ${items.length} questions`);
    await shot(page, spec.key, "04b-sheet-open");

    if (spec.coding) await takeEngineering(page, learnerCtx.request, assessment.id, items, c);
    else await takeTasks(page, learnerCtx.request, assessment.id, items, spec, c);

    const warnings = await getJson<{ assessments: { hardWarnings?: number; status: string }[] }>(admin.request, `/api/admin/users/${userId}/assessments`);
    c.ok(warnings.assessments[0]?.status === "in_progress", `still in progress before Finish (got ${warnings.assessments[0]?.status})`);

    await finishSheet(page, spec, c);
    await checkPath(admin, userId, spec, c);

    // The learner's own view once it is done.
    await page.goto(`${BASE}/assessment`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, spec.key, "14-learner-complete");
  } catch (error) {
    c.failures.push(`aborted: ${(error as Error).message.split("\n")[0]}`);
    console.log(`    \u001b[31mABORT\u001b[0m ${(error as Error).stack ?? error}`);
    await shot(admin, spec.key, "99-admin-at-failure");
    for (const p of learnerCtx?.pages() ?? []) await shot(p, spec.key, "99-learner-at-failure");
  } finally {
    await learnerCtx?.close().catch(() => undefined);
  }
  return c;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<number> {
  const only = process.argv.slice(2).filter((a): a is DeptKey => a === "eng" || a === "pm" || a === "bd");
  const depts = only.length ? DEPTS.filter((d) => only.includes(d.key)) : DEPTS;
  fs.mkdirSync(SHOTS, { recursive: true });
  const stamp = Date.now().toString(36);
  const dataDir = path.join(os.tmpdir(), `oyelearn-e2e-${stamp}`);
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
    // Off by default; made explicit so Finish is never time-locked in this run.
    await sendJson(admin.request, "put", "/api/admin/assessment-settings", { minFinishMinutes: null });

    for (const spec of depts) results.push(await runDepartment(browser, admin, spec, stamp));
  } finally {
    await browser.close().catch(() => undefined);
    stopServer();
  }

  console.log("\n=== Summary ===");
  for (const r of results) {
    const verdict = r.failures.length === 0 ? "\u001b[32mPASS\u001b[0m" : "\u001b[31mFAIL\u001b[0m";
    console.log(`${verdict}  ${r.dept}${r.failures.length ? ` (${r.failures.length} failed)` : ""}`);
    for (const f of r.failures) console.log(`        - ${f}`);
    for (const n of r.notes) console.log(`        note: ${n}`);
  }
  return results.every((r) => r.failures.length === 0) && results.length === depts.length ? 0 : 1;
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
