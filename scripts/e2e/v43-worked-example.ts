/**
 * Oyelearn v4.3 end-to-end check: the brief's worked example, through the real UI.
 *
 *   npm run build          # once; this script serves dist/ + dist-server/ and does not rebuild
 *   npx tsx scripts/e2e/v43-worked-example.ts
 *
 * 1. Quick onboarding: the superadmin types a name and one line ("Frontend dev, 2 yrs React, weak on
 *    Git, we want him doing backend + AI-driven work"), presses Suggest and Save & assign. The default
 *    path is counted and must be ≤ 3 clicks after typing. Before saving, the goals are brought to the
 *    worked example (Git Critical, Backend High, AI-driven development Medium) in the goal box; those
 *    adjustment clicks are counted and reported separately, because the mock Suggest proposes a
 *    slightly different set (Git Critical, Node and AI goals at High).
 * 2. A free-text goal ("should be able to fix production bugs on our Laravel projects without help")
 *    is typed into the goal box and its interpretation chip is checked before it is added.
 * 3. The learner takes the assessment through the real UI. MCQs are answered against the key (read
 *    from the admin detail): wrong on purpose for Git, AI and async JavaScript and for the other goal
 *    skills, right for everything else; hands-on items are left unanswered (they score 0). No DB
 *    state is written by the script. The evaluation's measured levels are then asserted (Git ≤ 2,
 *    AI skills ≤ 1, async JS ≤ 1 when measured) and reported.
 * 4. The path order: the worked example's skills appear as a subsequence in the brief's order (2c),
 *    no prerequisite edge of the skill graph is ever violated, and the full order is reported.
 * 5. Week 1 on /plan: one continuous `<path data-testid=week-trail-path>` with a single M.
 * 6. A topic on the learner's plan with three videos: the playlist shows them, real playback runs in
 *    headless Chromium and autoplay moves to the next video after the countdown, and the test stays
 *    locked until all three are watched (the remainder is posted through the progress API exactly as
 *    the client samples it).
 * 7. The topic test (D9): before the re-check the result says "Source: awaiting re-check" for static
 *    items; the admin runs "Run re-check" for that one topic on the Test items page (mock AI); then
 *    every active item has a citation and every served question shows "From: <section>" after submit.
 *
 * Throwaway DATA_DIR under %TEMP%, port 8803, the deterministic mock AI (NODE_ENV=development).
 * Screenshots go to %TEMP%/claude/e2e-shots-v43 (override with E2E_SHOTS). E2E_HEADED=1 to watch.
 * Exits non-zero when any assertion fails, and always stops its server.
 *
 * Helpers are copied from v42-pm-processes.ts and v43-video.ts on purpose, so no script's changes can
 * break another.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type APIRequestContext, type Browser, type Locator, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PORT = Number(process.env.E2E_PORT ?? 8803);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const SHOTS = process.env.E2E_SHOTS ?? path.join(os.tmpdir(), "claude", "e2e-shots-v43");
const HEADED = process.env.E2E_HEADED === "1";
const JOB_TIMEOUT_MS = Number(process.env.E2E_JOB_TIMEOUT_MS ?? 6 * 60_000);

const LINE = "Frontend dev, 2 yrs React, weak on Git, we want him doing backend + AI-driven work";
const FREE_TEXT = "should be able to fix production bugs on our Laravel projects without help";

/** The worked example's goals as the goal box should hold them (D2: one skill goal per catalog skill). */
const GIT = ["eng-git", "eng-github-flow"];
const BACKEND = ["eng-node-runtime", "eng-express", "eng-sql", "eng-auth-sessions-jwt", "eng-paas-deploy"];
const AI = ["eng-ai-prompting-for-code", "eng-ai-context-files", "eng-ai-reusable-skills"];
const ASYNC = "eng-js-async";
const NAMES: Record<string, string> = {
  "eng-git": "Git fundamentals",
  "eng-github-flow": "GitHub pull request workflow",
  "eng-node-runtime": "Node.js runtime & core modules",
  "eng-node-streams": "Node streams, buffers & event emitters",
  "eng-express": "Express.js",
  "eng-sql": "SQL fundamentals",
  "eng-auth-sessions-jwt": "Authentication: sessions & JWT",
  "eng-paas-deploy": "Deploying to Vercel, Netlify, Render & Railway",
  "eng-ai-prompting-for-code": "Prompting for code",
  "eng-ai-context-files": "Context files (CLAUDE.md, AGENTS.md, Cursor rules)",
  "eng-ai-reusable-skills": "Reusable prompts, skills & AI workflows",
};
/** run.goals.test.ts's mapping of the brief's 2c order onto catalog ids. */
const EXPECTED_ORDER = [
  "eng-git",
  "eng-github-flow",
  "eng-ai-prompting-for-code",
  "eng-js-async",
  "eng-node-runtime",
  "eng-express",
  "eng-sql",
  "eng-auth-sessions-jwt",
  "eng-paas-deploy",
  "eng-ai-context-files",
  "eng-ai-reusable-skills",
];
const SLIDER_LABEL: Record<number, string> = { 1: "Optional", 2: "Low", 3: "Medium", 4: "High", 5: "Critical" };

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

async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOTS, `we-${name}.png`), fullPage: true }).catch(() => undefined);
}

async function poll<T>(what: string, timeoutMs: number, fn: () => Promise<T | null | undefined>, everyMs = 1000): Promise<T> {
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

/** Every mouse click on the admin's onboarding goes through one of these counters. */
class ClickCounter {
  count = 0;
  log: string[] = [];
  async click(locator: Locator, what: string): Promise<void> {
    this.count += 1;
    this.log.push(what);
    await locator.click();
  }
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
  await poll("/api/health", 60_000, async () => {
    if (server?.exitCode !== null) throw new Error(`server exited early (${server?.exitCode}); see ${logPath}`);
    const res = await fetch(`${BASE}/api/health`).catch(() => null);
    return res?.ok ? true : null;
  }, 500);
}

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
// 1 and 2. Quick onboarding and the goal box
// ---------------------------------------------------------------------------

interface GoalLite {
  type: string;
  skillIds: string[];
  slider: number;
  targetLevel: number;
  caseId: string | null;
  originalText: string;
  outcome: string;
}

const goalSlider = (admin: Page, name: string) => admin.getByRole("slider", { name: `${name} priority`, exact: true });

async function sliderOf(admin: Page, name: string): Promise<string | null> {
  const thumb = goalSlider(admin, name);
  if ((await thumb.count()) === 0) return null;
  return thumb.getAttribute("aria-valuetext");
}

/** Moves a goal's slider: one click on the thumb (counted), then keys, which are not clicks. */
async function setSlider(admin: Page, counter: ClickCounter, name: string, value: number): Promise<void> {
  const thumb = goalSlider(admin, name);
  await counter.click(thumb, `${name} slider`);
  await thumb.press("Home");
  for (let v = 1; v < value; v += 1) await thumb.press("ArrowRight");
  await poll(`${name} at ${SLIDER_LABEL[value]}`, 5_000, async () => ((await sliderOf(admin, name)) === SLIDER_LABEL[value] ? true : null), 100);
}

const goalPickerTrigger = (admin: Page) => admin.getByRole("button", { name: /Add a skill, a practical case, or type a goal/ }).or(admin.locator("button", { hasText: "Add a skill, a practical case, or type a goal" })).first();

async function addSkillGoal(admin: Page, counter: ClickCounter, name: string, search: string): Promise<void> {
  await counter.click(goalPickerTrigger(admin), "goal picker");
  await admin.getByPlaceholder(/Git, “merge conflict”/).fill(search);
  const option = admin.getByRole("option", { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }).first();
  await counter.click(option, `pick ${name}`);
  await goalSlider(admin, name).waitFor({ timeout: 5_000 });
}

async function onboard(admin: Page, c: Checks): Promise<{ userId: string; username: string; tempPassword: string }> {
  await admin.goto(`${BASE}/admin/onboard`, { waitUntil: "networkidle" });
  await admin.getByRole("radiogroup", { name: "Department" }).waitFor({ timeout: 20_000 });

  // ---- The default path: type, Suggest, Save & assign. ----
  const defaults = new ClickCounter();
  step("type the name and the one line, press Suggest");
  await admin.getByLabel("Full name").fill("Arjun Mehta");
  await admin.getByLabel("Describe them in one line").fill(LINE);
  await defaults.click(admin.getByRole("button", { name: "Suggest", exact: true }), "Suggest");
  await admin.getByRole("region", { name: /^Here's the plan/ }).waitFor({ timeout: 30_000 });
  // v4.4 P6: the editor sits behind "Change something"; this script inspects it (not a default-path click).
  await admin.getByRole("button", { name: "Change something" }).click();
  await admin.getByRole("region", { name: "Change the plan" }).waitFor({ timeout: 10_000 });
  await goalSlider(admin, NAMES["eng-git"]).waitFor({ timeout: 15_000 });
  const suggested: string[] = [];
  for (const [id, name] of Object.entries(NAMES)) {
    const v = await sliderOf(admin, name);
    if (v) suggested.push(`${id}=${v}`);
  }
  c.fact(`Suggest proposed: ${suggested.join(", ")}`);
  c.ok((await sliderOf(admin, NAMES["eng-git"])) === "Critical", "Suggest puts Git fundamentals at Critical");
  await shot(admin, "01-suggested");

  // ---- Adjustments to the worked example (counted separately). ----
  step("bring the goals to the worked example: Git Critical, Backend High, AI-driven Medium");
  const adjust = new ClickCounter();
  // Not part of the worked example.
  for (const extra of ["eng-node-streams"]) {
    if (await sliderOf(admin, NAMES[extra])) await adjust.click(admin.getByRole("button", { name: `Remove ${NAMES[extra]}`, exact: true }), `remove ${NAMES[extra]}`);
  }
  // Git: fundamentals and the PR workflow, both Critical.
  if (!(await sliderOf(admin, NAMES["eng-github-flow"]))) await addSkillGoal(admin, adjust, NAMES["eng-github-flow"], "GitHub pull request");
  if ((await sliderOf(admin, NAMES["eng-github-flow"])) !== "Critical") await setSlider(admin, adjust, NAMES["eng-github-flow"], 5);
  // Backend: Node → Express → SQL → auth → deploy, all High.
  const searches: Record<string, string> = { "eng-node-runtime": "Node.js runtime", "eng-express": "Express.js", "eng-sql": "SQL fundamentals", "eng-auth-sessions-jwt": "Authentication: sessions", "eng-paas-deploy": "Deploying to Vercel" };
  for (const id of BACKEND) {
    if (!(await sliderOf(admin, NAMES[id]))) await addSkillGoal(admin, adjust, NAMES[id], searches[id]);
    if ((await sliderOf(admin, NAMES[id])) !== "High") await setSlider(admin, adjust, NAMES[id], 4);
  }
  // AI-driven development: prompting → context files → reusable workflows, all Medium.
  for (const id of AI) {
    if (!(await sliderOf(admin, NAMES[id]))) {
      const chip = admin.getByRole("list", { name: "Suggested goals" }).getByRole("button", { name: new RegExp(`^${NAMES[id].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) });
      if (await chip.count()) await adjust.click(chip.first(), `+ ${NAMES[id]} (suggested)`);
      else await addSkillGoal(admin, adjust, NAMES[id], NAMES[id].split(" ")[0]);
      await goalSlider(admin, NAMES[id]).waitFor({ timeout: 5_000 });
    }
    if ((await sliderOf(admin, NAMES[id])) !== "Medium") await setSlider(admin, adjust, NAMES[id], 3);
  }
  for (const id of GIT) c.ok((await sliderOf(admin, NAMES[id])) === "Critical", `${NAMES[id]} is Critical in the goal box`);
  for (const id of BACKEND) c.ok((await sliderOf(admin, NAMES[id])) === "High", `${NAMES[id]} is High in the goal box`);
  for (const id of AI) c.ok((await sliderOf(admin, NAMES[id])) === "Medium", `${NAMES[id]} is Medium in the goal box`);
  await shot(admin, "02-worked-example-goals");

  // ---- 2. A free-text goal (counted separately). ----
  step("add a free-text goal and read its interpretation");
  const text = new ClickCounter();
  await text.click(goalPickerTrigger(admin), "goal picker");
  await admin.getByPlaceholder(/Git, “merge conflict”/).fill(FREE_TEXT);
  await text.click(admin.getByRole("option", { name: /^Use “should be able to fix production bugs/ }), "Use … as a goal");
  const pending = admin.getByRole("group", { name: "New goal" });
  await pending.waitFor({ timeout: 10_000 });
  await poll("the goal to be read", 30_000, async () => ((await pending.getByRole("status").count()) === 0 ? true : null), 300);
  const chipText = ((await pending.locator("p.font-mono").first().textContent().catch(() => "")) ?? "").trim();
  c.ok(/Laravel/i.test(chipText), `the interpretation chip names the skills and level: "${chipText}"`);
  await shot(admin, "03-free-text-reading");
  await text.click(pending.getByRole("button", { name: "Add goal" }), "Add goal");
  const textRow = admin.getByRole("list", { name: "Goals, highest first" }).getByRole("listitem").filter({ hasText: FREE_TEXT });
  await textRow.waitFor({ timeout: 5_000 });
  c.ok(/Laravel/i.test((await textRow.textContent()) ?? ""), "the added goal row shows its interpretation (Laravel)");

  // ---- Save & assign: the default path's last click. ----
  await defaults.click(admin.getByRole("button", { name: "Looks good — send the test" }), "Looks good — send the test");
  const notice = admin.getByRole("status").filter({ hasText: "Account created for Arjun Mehta" });
  await notice.waitFor({ timeout: 30_000 });
  const message = (await notice.locator("pre").textContent()) ?? "";
  const tempPassword = /Temporary password: (\S+)/.exec(message)?.[1] ?? "";
  const username = /Username: (\S+)/.exec(message)?.[1] ?? "arjun.mehta";
  c.ok(tempPassword.length >= 8, "temporary password captured from the notice");
  await shot(admin, "04-onboarded");

  c.ok(defaults.count <= 3, `quick onboarding, default path: ${defaults.count} clicks after typing (${defaults.log.join(" → ")}); target ≤ 3`);
  c.fact(`clicks: default path ${defaults.count} (${defaults.log.join(", ")}); adjustments to the worked example ${adjust.count} (${adjust.log.join(", ")}); free-text goal ${text.count} (${text.log.join(", ")})`);

  const { users } = await getJson<{ users: { id: string; username: string; displayName: string }[] }>(admin.request, "/api/admin/users");
  const user = users.find((u) => u.username === username) ?? users.find((u) => u.displayName === "Arjun Mehta");
  if (!user) throw new Error(`created user ${username} not found`);

  const { setup } = await getJson<{ setup: { goals: GoalLite[]; trackId: string | null } }>(admin.request, `/api/admin/users/${user.id}/setup`);
  const sliderFor = (id: string) => Math.max(0, ...setup.goals.filter((g) => g.skillIds.includes(id)).map((g) => g.slider));
  c.ok(GIT.every((id) => sliderFor(id) === 5), `saved: Git goals Critical (${GIT.map(sliderFor).join(",")})`);
  c.ok(BACKEND.every((id) => sliderFor(id) === 4), `saved: Backend goals High (${BACKEND.map(sliderFor).join(",")})`);
  c.ok(AI.every((id) => sliderFor(id) === 3), `saved: AI-driven goals Medium (${AI.map(sliderFor).join(",")})`);
  const textGoal = setup.goals.find((g) => g.type === "text");
  c.ok(textGoal && textGoal.skillIds.some((id) => id.startsWith("eng-laravel")), `saved: the free-text goal reads as ${textGoal?.skillIds.join(", ")} at ${textGoal?.targetLevel}/5, outcome "${textGoal?.outcome}"`);
  c.ok(textGoal && /^Can fix production bugs/.test(textGoal.outcome), `the free-text outcome reads naturally ("${textGoal?.outcome}")`);
  c.fact(`saved goals: ${setup.goals.map((g) => `${g.type}:${g.skillIds.join("+")}@${g.slider}`).join(" | ")}`);
  return { userId: user.id, username: user.username, tempPassword };
}

// ---------------------------------------------------------------------------
// 3. The assessment
// ---------------------------------------------------------------------------

interface SheetItemLite {
  id: string;
  type: "coding" | "mcq" | "task";
  skillId: string;
  skillName: string;
  draft: unknown;
}
interface AdminItemLite extends SheetItemLite {
  difficulty: number;
  answer: { correctIndex?: number } | null;
  options?: string[];
}
interface SkillResultLite {
  skillId: string;
  skillName: string;
  group: string;
  level: number | null;
  asked: number;
}
interface AdminDetail {
  result: { skills: SkillResultLite[]; mastery?: { skillId: string; level: number; source: string }[]; missingLinks?: unknown[] } | null;
  items: AdminItemLite[];
}

async function ensureFullscreen(page: Page, c: Checks): Promise<void> {
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
      await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Continue" && !b.disabled), undefined, { timeout: 15_000 });
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
    c.note("camera calibration cannot pass with Chromium's fake device (no face); consent/start sent via API with the learner's session, as the page would");
    const permissions = { camera: true, microphone: false, fullscreen: true, tabMonitoring: true };
    await sendJson(request, "post", `/api/assessment/${assessmentId}/consent`, { agreed: true, permissions });
    await sendJson(request, "post", `/api/assessment/${assessmentId}/start`, {});
    await page.goto(`${BASE}/assessment`, { waitUntil: "networkidle" });
  }
  await page.waitForSelector("text=/Question \\d+ of \\d+|Return to fullscreen/", { timeout: 30_000 });
  await ensureFullscreen(page, c);
  await page.getByText(/^Question \d+ of \d+/).waitFor({ timeout: 20_000 });
}

const chip = (page: Page, index: number) => page.getByRole("navigation", { name: "Questions" }).getByRole("button", { name: new RegExp(`^Question ${index + 1}:`) });
const article = (page: Page): Locator => page.locator("article").first();

async function goTo(page: Page, index: number, total: number): Promise<void> {
  await chip(page, index).click();
  await page.getByText(new RegExp(`^Question ${index + 1} of ${total}(\\D|$)`)).waitFor();
}

/** Skills whose MCQs are answered wrong on purpose: the weak areas and the goals still to learn. */
const WRONG_ON_PURPOSE = new Set([...AI, ASYNC, ...BACKEND, "eng-github-flow"]);

/**
 * Git basics should come out near 2/5 (never 3, which would make it met): answer the Git MCQs right
 * only while the predicted level, with hands-on items unanswered (0), stays at 2 or below.
 */
function gitRightAnswers(items: AdminItemLite[]): Set<string> {
  const git = items.filter((i) => i.skillId === "eng-git");
  const mcqs = git.filter((i) => i.type === "mcq").sort((a, b) => a.difficulty - b.difficulty);
  const right = new Set<string>();
  const level = (set: Set<string>) => {
    const weight = git.reduce((s, i) => s + i.difficulty, 0);
    const score = git.reduce((s, i) => s + (set.has(i.id) ? 1 : 0) * i.difficulty, 0) / (weight || 1);
    return Math.round(score * (weight / Math.max(1, git.length) + 1));
  };
  for (const m of mcqs) {
    const next = new Set([...right, m.id]);
    if (level(next) <= 2) right.add(m.id);
  }
  return right;
}

async function takeAssessment(browser: Browser, admin: Page, who: { userId: string; username: string; tempPassword: string }, c: Checks): Promise<{ learner: Page; detail: AdminDetail }> {
  step("wait for the personalised assessment");
  const assessment = await poll("assessment ready", JOB_TIMEOUT_MS, async () => {
    const { assessments } = await getJson<{ assessments: { id: string; status: string }[] }>(admin.request, `/api/admin/users/${who.userId}/assessments`);
    if (assessments[0]?.status === "failed") throw new Error("assessment generation failed");
    return assessments[0]?.status === "ready" ? assessments[0] : null;
  }, 2000);
  const before = await getJson<AdminDetail>(admin.request, `/api/admin/assessments/${assessment.id}/v4`);
  const asked = new Map<string, number>();
  for (const i of before.items) asked.set(i.skillId, (asked.get(i.skillId) ?? 0) + 1);
  c.fact(`sheet: ${[...asked].map(([id, n]) => `${id}×${n}`).join(", ")}`);
  c.ok(GIT.concat(BACKEND).every((id) => asked.has(id)), "the sheet covers every Critical/High goal skill");
  c.ok(AI.some((id) => asked.has(id)), "the sheet asks about the AI-driven goals");

  const learnerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["camera", "microphone"] });
  const page = await learnerCtx.newPage();
  page.on("pageerror", (error) => console.log(`    [learner pageerror] ${error.message}`));
  step(`learner ${who.username} signs in`);
  await signIn(page, who.username, who.tempPassword, LEARNER_NEW);
  await page.goto(`${BASE}/assessment`, { waitUntil: "networkidle" });
  await passPreflight(page, learnerCtx.request, assessment.id, c);
  const sheet = (await getJson<{ items: SheetItemLite[] }>(learnerCtx.request, `/api/assessment/${assessment.id}/sheet`)).items;
  const keyed = new Map(before.items.map((i) => [i.id, i]));
  const gitRight = gitRightAnswers(before.items);

  step("answer every MCQ through the UI against the key; hands-on items stay unanswered");
  const plan: string[] = [];
  for (const [index, item] of sheet.entries()) {
    if (item.type !== "mcq") continue;
    const key = keyed.get(item.id)?.answer?.correctIndex;
    if (typeof key !== "number") throw new Error(`no key for MCQ ${index + 1}`);
    const right = item.skillId === "eng-git" ? gitRight.has(item.id) : !WRONG_ON_PURPOSE.has(item.skillId);
    await goTo(page, index, sheet.length);
    const radios = article(page).locator('input[type="radio"]');
    const n = await radios.count();
    await radios.nth(right ? key : (key + 1) % n).check();
    plan.push(`Q${index + 1} ${item.skillId}: ${right ? "right" : "wrong"}`);
  }
  // Moving off the last one flushes its draft.
  await goTo(page, 0, sheet.length);
  c.fact(`answers: ${plan.join("; ")}`);
  const mcqIds = sheet.filter((i) => i.type === "mcq").map((i) => i.id);
  const saved = await poll("drafts saved", 15_000, async () => {
    const s = (await getJson<{ items: SheetItemLite[] }>(learnerCtx.request, `/api/assessment/${assessment.id}/sheet`)).items;
    return s.filter((i) => mcqIds.includes(i.id)).every((i) => i.draft !== null) ? s : null;
  }, 500).catch(() => null);
  c.ok(saved !== null, `server: every MCQ answered in the UI has a draft (${mcqIds.length})`);
  await shot(page, "05-sheet");

  step("Finish and hand in");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const dialog = page.getByRole("alertdialog").or(page.getByRole("dialog")).filter({ hasText: "Finish the assessment?" });
  await dialog.waitFor({ timeout: 10_000 });
  await dialog.getByRole("button", { name: "Finish and hand in" }).click();
  await page.getByText(/Your answers are handed in|Your assessment is done/).first().waitFor({ timeout: 30_000 });
  c.ok(true, "sheet handed in");

  step("wait for the evaluation");
  await poll("assessment completed", JOB_TIMEOUT_MS, async () => {
    const { assessments } = await getJson<{ assessments: { status: string }[] }>(admin.request, `/api/admin/users/${who.userId}/assessments`);
    if (assessments[0]?.status === "failed") throw new Error("assessment evaluation failed");
    return assessments[0]?.status === "completed" ? true : null;
  }, 3000);
  const detail = await poll("the evaluation result", JOB_TIMEOUT_MS, async () => {
    const d = await getJson<AdminDetail>(admin.request, `/api/admin/assessments/${assessment.id}/v4`);
    return d.result?.mastery ? d : null;
  }, 3000).catch(async () => getJson<AdminDetail>(admin.request, `/api/admin/assessments/${assessment.id}/v4`));
  const level = (id: string) => detail.result?.skills.find((s) => s.skillId === id)?.level ?? null;
  c.fact(`measured: ${(detail.result?.skills ?? []).map((s) => `${s.skillId}=${s.level ?? "-"}`).join(", ")}`);
  const git = level("eng-git");
  c.ok(git !== null && git <= 2, `Git basics measured at ${git}/5 (worked example ~2/5; must stay below the goal's 3/5)`);
  if (git !== null && git !== 2) c.note(`Git basics came out at ${git}/5, not exactly 2/5: the sheet's Git items left no MCQ subset that predicts 2 with hands-on items unanswered`);
  const aiMeasured = AI.filter((id) => level(id) !== null);
  c.ok(aiMeasured.length > 0 && aiMeasured.every((id) => (level(id) ?? 9) <= 1), `AI skills measured critically weak: ${aiMeasured.map((id) => `${id}=${level(id)}`).join(", ")}`);
  const asyncLevel = level(ASYNC);
  if (asyncLevel === null) c.note("async JS was not asked; unmeasured counts as 0 (D4), so it is a missing link all the same");
  else c.ok(asyncLevel <= 1, `async JS measured at ${asyncLevel}/5`);
  return { learner: page, detail };
}

// ---------------------------------------------------------------------------
// 4. The path
// ---------------------------------------------------------------------------

interface PathItemLite {
  position: number;
  partNumber: number | null;
  partType: string | null;
  skillId?: string | null;
  targetSkill: string | null;
  courseTitle: string;
  reason: string;
}

async function checkPath(admin: Page, userId: string, c: Checks): Promise<PathItemLite[]> {
  step("wait for the path");
  const data = await poll("path ready", JOB_TIMEOUT_MS, async () => {
    const g = await getJson<{ path: { status: string; failureReason: string | null; items: PathItemLite[] } | null }>(admin.request, `/api/admin/users/${userId}/gaps`);
    if (g.path?.status === "failed" || g.path?.status === "budget_reached") return g;
    return g.path?.status === "ready" ? g : null;
  }, 3000);
  c.ok(data.path!.status === "ready", `path status ready (got ${data.path!.status}${data.path!.failureReason ? `: ${data.path!.failureReason}` : ""})`);
  const items = [...data.path!.items].sort((a, b) => a.position - b.position);
  const order = [...new Set(items.map((i) => i.skillId).filter((id): id is string => Boolean(id)))];
  console.log(items.map((i) => `      [P${i.partNumber}${i.partType ? ` ${i.partType}` : ""}] ${i.skillId ?? "-"}  ${i.courseTitle}  — ${i.reason}`).join("\n"));
  c.fact(`path skill order: ${order.join(" → ")}`);

  // The worked example's order, as a subsequence.
  const at = EXPECTED_ORDER.map((id) => order.indexOf(id));
  const missing = EXPECTED_ORDER.filter((_, k) => at[k] < 0);
  c.ok(missing.length === 0, `every worked-example skill is on the path${missing.length ? ` (missing ${missing.join(", ")})` : ""}`);
  const present = at.filter((i) => i >= 0);
  c.ok(present.every((v, k) => k === 0 || v > present[k - 1]), `the path keeps the brief's order: ${EXPECTED_ORDER.map((id, k) => `${id}@${at[k]}`).join(" < ")}`);
  const extras = order.filter((id) => !EXPECTED_ORDER.includes(id));
  c.fact(`extra skills and where the algorithm put them: ${extras.map((id) => `${id}@${order.indexOf(id)}`).join(", ") || "none"}`);

  // No prerequisite edge is ever violated.
  const graph = await getJson<{ edges: { from: string; to: string; type: string }[] }>(admin.request, "/api/admin/skill-graph?departmentId=engineering");
  const pos = new Map(order.map((id, i) => [id, i]));
  const violated = graph.edges.filter((e) => e.type === "prerequisite" && pos.has(e.from) && pos.has(e.to) && pos.get(e.from)! > pos.get(e.to)!);
  c.ok(violated.length === 0, `no prerequisite comes after the skill that needs it${violated.length ? `: ${violated.map((e) => `${e.from}→${e.to}`).join(", ")}` : ""}`);
  c.ok(items.every((item, i) => i === 0 || (item.partNumber ?? 0) >= (items[i - 1].partNumber ?? 0)), "part numbers never go backwards");
  const asyncItem = items.find((i) => i.skillId === ASYNC);
  c.ok(asyncItem?.partType === "prerequisite", `async JS is a missing link (partType ${asyncItem?.partType}): "${asyncItem?.reason}"`);
  const aiItem = items.find((i) => i.skillId === "eng-ai-prompting-for-code");
  c.ok(/^Moved up/.test(aiItem?.reason ?? ""), `AI fundamentals moved up: "${aiItem?.reason}"`);
  await admin.goto(`${BASE}/admin/people/${userId}?tab=path`, { waitUntil: "networkidle" });
  await shot(admin, "06-admin-path");
  return items;
}

// ---------------------------------------------------------------------------
// 5. Week 1
// ---------------------------------------------------------------------------

async function checkWeek(page: Page, c: Checks): Promise<void> {
  step("open week 1 on My plan");
  await page.goto(`${BASE}/plan`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.setItem("oyelearn.plan.view", "trail"));
  await page.reload({ waitUntil: "networkidle" });
  const trail = page.locator("[data-testid=week-trail-path]");
  await trail.first().waitFor({ timeout: 30_000 });
  c.ok((await trail.count()) === 1, `exactly one week-trail-path (found ${await trail.count()})`);
  const d = (await trail.first().getAttribute("d")) ?? "";
  const commands = d.match(/[A-Za-z]/g) ?? [];
  c.ok(commands[0] === "M" && commands.filter((x) => x === "M" || x === "m").length === 1 && commands.slice(1).every((x) => x === "C" || x === "L"), `the week trail is one path: a single M, then only C/L (${commands.length} commands)`);
  const week = await getJson<{ week: { items: unknown[] } | null }>(page.request, "/api/me/week");
  const markers = await page.locator("[data-testid=week-trail-waypoint]").count();
  c.ok((week.week?.items.length ?? 0) > 0 && markers === week.week!.items.length, `one waypoint per week item (${markers} of ${week.week?.items.length ?? 0})`);
  await shot(page, "07-week-trail");
}

// ---------------------------------------------------------------------------
// 6. Videos
// ---------------------------------------------------------------------------

interface VideoStateLite {
  videoId: string;
  durationSeconds: number | null;
  requiredSeconds: number | null;
  watchedSeconds: number;
  watched: boolean;
  segment: { start: number; end: number | null };
}
interface TopicVideosLite {
  videos: VideoStateLite[];
  watchedCount: number;
  total: number;
  locked: boolean;
}
interface ManifestLite {
  tracks: { id: string; modules: { id: string; topics: { id: string; challengeType?: string }[] }[] }[];
}

const playlist = (page: Page) => page.getByRole("list", { name: "Videos in this topic" });

/** A quiz topic on the learner's plan with exactly three videos, preferring one from the path. */
async function findTopic(page: Page, c: Checks): Promise<{ topicId: string; url: string; trackId: string; moduleId: string }> {
  const manifest = await getJson<ManifestLite>(page.request, "/api/me/manifest");
  const candidates = manifest.tracks.flatMap((t) => t.modules.flatMap((m) => m.topics.map((topic) => ({ topic, trackId: t.id, moduleId: m.id }))));
  c.fact(`the learner's plan holds ${candidates.length} topics`);
  for (const { topic, trackId, moduleId } of candidates) {
    if (topic.challengeType && topic.challengeType !== "quiz") continue;
    const res = await page.request.get(`${BASE}/api/me/topics/${topic.id}/videos`);
    if (!res.ok()) continue;
    const state = (await res.json()) as TopicVideosLite;
    if (state.total === 3 && state.watchedCount === 0 && state.locked) return { topicId: topic.id, url: `/track/${trackId}/module/${moduleId}/topic/${topic.id}`, trackId, moduleId };
  }
  throw new Error("no quiz topic with three videos on the learner's plan");
}

async function checkVideos(page: Page, c: Checks): Promise<{ topicId: string; url: string; trackId: string; moduleId: string }> {
  const topic = await findTopic(page, c);
  c.fact(`topic with three videos: ${topic.topicId}`);
  step(`open ${topic.topicId}`);
  await page.goto(`${BASE}${topic.url}`, { waitUntil: "domcontentloaded" });
  await playlist(page).waitFor({ timeout: 30_000 });
  c.ok((await playlist(page).getByRole("listitem").count()) === 3, "the playlist shows the 3 videos");
  c.ok(await page.getByText("Videos 0 of 3 watched").isVisible(), "header: Videos 0 of 3 watched");
  c.ok(await page.getByRole("region", { name: "Test locked" }).isVisible(), "the test is locked behind the videos");
  const autoplay = page.getByRole("switch", { name: "Autoplay" });
  c.ok((await autoplay.getAttribute("aria-checked")) === "true", "autoplay next is on");
  const currentTitle = async () => (await playlist(page).locator('button[aria-current="true"]').textContent().catch(() => "")) ?? "";
  const first = await currentTitle();

  step("real playback and autoplay to the next video");
  const iframe = page.locator('iframe[src*="youtube.com/embed"]');
  const iframeUp = await iframe.waitFor({ timeout: 20_000 }).then(() => true).catch(() => false);
  if (!iframeUp) {
    c.note("the YouTube IFrame API did not load (no network?); real playback and autoplay skipped");
  } else {
    const frame = page.frameLocator('iframe[src*="youtube.com/embed"]');
    const played = await (async () => {
      await frame.locator(".ytp-large-play-button, button[aria-label*='Play']").first().click({ timeout: 15_000 });
      return poll("server-side progress from real playback", 40_000, async () => {
        const s = await getJson<TopicVideosLite>(page.request, `/api/me/topics/${topic.topicId}/videos`);
        return s.videos.some((v) => v.watchedSeconds > 0) ? s : null;
      }, 2000);
    })().catch((error: Error) => {
      c.note(`real playback did not produce progress (${error.message.split("\n")[0]})`);
      return null;
    });
    if (played) {
      c.ok(true, "real playback was sampled and recorded by the server");
      const inner = await (await iframe.elementHandle())?.contentFrame();
      await inner?.evaluate(() => {
        const video = document.querySelector("video");
        if (video) video.currentTime = Math.max(0, video.duration - 2);
      });
      const overlay = page.getByRole("group", { name: "Up next" });
      const shown = await overlay.waitFor({ timeout: 25_000 }).then(() => true).catch(() => false);
      if (c.ok(shown, "the Up next overlay appears when the video ends")) {
        await shot(page, "08-up-next");
        // Let the 5 s countdown run out: autoplay moves on by itself.
        const moved = await poll("autoplay to the next video", 15_000, async () => {
          const now = await currentTitle();
          return now && now !== first ? now : null;
        }, 300).catch(() => null);
        c.ok(moved !== null, `autoplay moved to the next video by itself ("${(moved ?? "").slice(0, 60)}")`);
      }
      const after = await getJson<TopicVideosLite>(page.request, `/api/me/topics/${topic.topicId}/videos`);
      c.ok(!after.videos.some((v) => v.watched), "jumping to the end did not count any video as watched");
    }
  }

  step("the test stays locked until all three are watched");
  let state = await getJson<TopicVideosLite>(page.request, `/api/me/topics/${topic.topicId}/videos`);
  for (const [k, v] of state.videos.entries()) {
    const end = v.requiredSeconds ?? v.durationSeconds ?? 0;
    for (let t = v.segment.start; t < v.segment.start + end; t += 20) {
      const to = Math.min(v.segment.start + end, t + 20);
      state = await sendJson<TopicVideosLite>(page.request, "post", `/api/me/topics/${topic.topicId}/videos/${v.videoId}/progress`, { from: t, to, position: to, elapsed: 10 });
    }
    if (k < state.videos.length - 1) {
      c.ok(state.locked, `still locked with ${state.watchedCount} of 3 watched`);
      const blocked = await page.request.post(`${BASE}/api/topics/${topic.topicId}/attempt`, { data: { kind: "quiz", answers: {} } });
      c.ok(blocked.status() === 409, `the attempt API refuses with ${state.watchedCount} of 3 watched (${blocked.status()})`);
    }
  }
  c.ok(state.watchedCount === 3 && !state.locked, `3 of 3 watched, unlocked (${state.watchedCount}/${state.total})`);
  await page.reload({ waitUntil: "domcontentloaded" });
  await playlist(page).waitFor({ timeout: 30_000 });
  c.ok(await page.getByText("Videos 3 of 3 watched").isVisible(), "header: Videos 3 of 3 watched");
  c.ok(!(await page.getByRole("region", { name: "Test locked" }).isVisible().catch(() => false)), "the lock is gone");
  return topic;
}

// ---------------------------------------------------------------------------
// 7. The topic test and its citations
// ---------------------------------------------------------------------------

interface TestItemRowLite {
  id: string;
  origin: string;
  status: string;
  item: { citation?: { passageId: string; quote: string } | null };
  citedPassage: { id: string; heading: string } | null;
}

/** Answers every served question (first option) and submits; returns the per-question source lines. */
async function takeTopicTest(page: Page, url: string): Promise<{ questions: number; sources: string[]; pending: number }> {
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
  const submit = page.getByRole("button", { name: "Submit answers" });
  await submit.waitFor({ timeout: 30_000 });
  const fieldsets = page.locator("form fieldset");
  const questions = await fieldsets.count();
  for (let i = 0; i < questions; i += 1) {
    const fs = fieldsets.nth(i);
    const radio = fs.getByRole("radio").first();
    if (await radio.count()) await radio.click();
    else await fs.locator('input[type="checkbox"]').first().check();
  }
  await submit.click();
  await page.getByText(/of \d+ correct/).first().waitFor({ timeout: 30_000 });
  const sources = await page.locator("[data-testid=quiz-source]").allTextContents();
  const pending = await page.locator("[data-testid=quiz-source-pending]").count();
  return { questions, sources: sources.map((s) => s.replace(/\s+/g, " ").trim()), pending };
}

async function checkTopicTest(admin: Page, page: Page, topic: { topicId: string; url: string; trackId: string; moduleId: string }, c: Checks): Promise<void> {
  step("the topic test before the re-check");
  const first = await takeTopicTest(page, topic.url);
  const before = await getJson<{ items: TestItemRowLite[] }>(admin.request, `/api/admin/topic-tests/items?topicId=${topic.topicId}&status=active&limit=200`);
  const uncitedBefore = before.items.filter((i) => !i.item.citation).length;
  c.fact(`before the re-check: ${before.items.length} active items, ${uncitedBefore} without a citation (static, awaiting re-check); the learner saw ${first.sources.length} "From:" and ${first.pending} "awaiting re-check"`);
  c.ok(first.sources.length + first.pending === first.questions, `every served question shows its source or says it awaits the re-check (${first.sources.length} + ${first.pending} of ${first.questions})`);
  c.ok(first.pending === uncitedBefore, `"awaiting re-check" exactly for the uncited items (${first.pending} = ${uncitedBefore})`);
  await shot(page, "09-test-before-recheck");

  step("the admin runs the re-check for this one topic (mock AI)");
  await admin.goto(`${BASE}/admin/curriculum/test-items?track=${topic.trackId}&module=${topic.moduleId}&topic=${topic.topicId}`, { waitUntil: "networkidle" });
  await admin.getByRole("button", { name: "Run re-check" }).click();
  const dialog = admin.getByRole("dialog").filter({ hasText: "Run re-check" });
  await dialog.waitFor({ timeout: 10_000 });
  c.ok(((await dialog.textContent()) ?? "").includes(`this topic (${topic.topicId})`), "the re-check is scoped to this one topic");
  await dialog.getByRole("button", { name: "Start re-check" }).click();
  const run = await poll("re-check done", JOB_TIMEOUT_MS, async () => {
    const s = await getJson<{ run: { status: string; counts: Record<string, number> } | null }>(admin.request, "/api/admin/topic-tests/summary");
    return s.run && s.run.status !== "running" ? s.run : null;
  }, 1500);
  c.ok(run.status === "done", `re-check finished (${run.status}): ${JSON.stringify(run.counts)}`);
  await admin.reload({ waitUntil: "networkidle" });
  await shot(admin, "10-admin-test-items");

  const after = await getJson<{ items: TestItemRowLite[] }>(admin.request, `/api/admin/topic-tests/items?topicId=${topic.topicId}&status=active&limit=200`);
  c.ok(after.items.length >= 5, `the topic keeps at least 5 active items (${after.items.length})`);
  const uncited = after.items.filter((i) => !i.item.citation || !i.citedPassage);
  c.ok(uncited.length === 0, `every active item cites a passage of the topic after the re-check (${after.items.length - uncited.length} of ${after.items.length})`);

  step("the topic test after the re-check");
  const second = await takeTopicTest(page, topic.url);
  c.ok(second.questions === after.items.length, `the learner is served the ${after.items.length} active items (${second.questions})`);
  c.ok(second.pending === 0, `no question awaits the re-check any more (${second.pending})`);
  c.ok(second.sources.length === second.questions && second.sources.every((s) => /^From: \S/.test(s)), `every question shows "From: <section>" (${second.sources.length} of ${second.questions}; e.g. "${second.sources[0] ?? ""}")`);
  const headings = new Set(after.items.map((i) => i.citedPassage?.heading));
  c.ok(second.sources.every((s) => headings.has(s.replace(/^From: /, ""))), "each source names the section its item cites");
  await shot(page, "11-test-after-recheck");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run(browser: Browser, admin: Page, c: Checks): Promise<void> {
  let learner: Page | null = null;
  try {
    console.log("\n1-2. quick onboarding and goals");
    const who = await onboard(admin, c);
    console.log("\n3. the assessment");
    const taken = await takeAssessment(browser, admin, who, c);
    learner = taken.learner;
    console.log("\n4. the path");
    await checkPath(admin, who.userId, c);
    console.log("\n5. week 1");
    await checkWeek(learner, c);
    console.log("\n6. videos");
    const topic = await checkVideos(learner, c);
    console.log("\n7. the topic test");
    await checkTopicTest(admin, learner, topic, c);
  } catch (error) {
    c.failures.push(`aborted: ${(error as Error).message.split("\n")[0]}`);
    console.log(`    \u001b[31mABORT\u001b[0m ${(error as Error).stack ?? error}`);
    await shot(admin, "99-admin-at-failure");
    if (learner) await shot(learner, "99-learner-at-failure");
  } finally {
    await learner?.context().close().catch(() => undefined);
  }
}

async function main(): Promise<number> {
  fs.mkdirSync(SHOTS, { recursive: true });
  const stamp = Date.now().toString(36);
  const dataDir = path.join(os.tmpdir(), `oyelearn-e2e43w-${stamp}`);
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`data dir: ${dataDir}\nshots:    ${SHOTS}`);

  await startServer(dataDir);
  const browser = await chromium.launch({
    headless: !HEADED,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
  });
  const c = new Checks("The worked example, end to end (v4.3)");
  try {
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const admin = await adminCtx.newPage();
    admin.on("pageerror", (error) => console.log(`    [admin pageerror] ${error.message}`));
    console.log("\nsuperadmin signs in (first login changes the password)");
    await signIn(admin, SUPER_USER, SUPER_INITIAL, SUPER_NEW);
    await sendJson(admin.request, "put", "/api/admin/assessment-settings", { minFinishMinutes: null });
    console.log(`\n=== ${c.name} ===`);
    await run(browser, admin, c);
  } finally {
    await browser.close().catch(() => undefined);
    stopServer();
  }

  console.log("\n=== Summary ===");
  const verdict = c.failures.length === 0 ? "\u001b[32mPASS\u001b[0m" : "\u001b[31mFAIL\u001b[0m";
  console.log(`${verdict}  ${c.name}${c.failures.length ? ` (${c.failures.length} failed)` : ""}`);
  for (const f of c.failures) console.log(`        - ${f}`);
  for (const f of c.facts) console.log(`        fact: ${f}`);
  for (const n of c.notes) console.log(`        note: ${n}`);
  return c.failures.length === 0 ? 0 : 1;
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
