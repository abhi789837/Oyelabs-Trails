/**
 * Oyelearn v4.4 end-to-end check: the brief's reference case, through the real UI.
 *
 *   npm run build          # once; this script serves dist/ + dist-server/ and does not rebuild
 *   npx tsx scripts/e2e/v44-reference-case.ts
 *
 * 1. Quick onboarding (Engineering) with the exact line "frontend engineer with 1 year of experience
 *    and also want him to move to the full stack and also improve the soft skills". The ticked
 *    Suggest steps show; the plan card names the three things said (current role "Frontend engineer
 *    · about 1 year", full-stack, soft skills incl. spoken English); "What the test will check"
 *    covers frontend, backend first steps, spoken English and work emails; the default path is
 *    ≤ 3 clicks after typing (Suggest → Looks good — send the test).
 * 2. A second line with a phrase nobody can place ("… and also handle the zorblax pipeline") shows
 *    "We weren't sure what you meant by '…zorblax…'" and the send button stays disabled until an
 *    option is picked. That second person is not sent.
 * 3. The test plan includes frontend, backend first steps and soft-skill questions, with ≥ 1 Speak
 *    and ≥ 1 writing question. The learner takes it in Chromium: one Speak question is recorded with
 *    the fake microphone (a SAPI speech WAV when it can be made), uploaded and transcribed (mock STT
 *    unless STT_BASE_URL is set); the other Speak question uses "Type your answer instead"; a
 *    writing question gets a good answer in its own words; MCQs are answered against the key, wrong
 *    on purpose for backend and soft skills so gaps appear.
 * 4. After evaluation the admin sees the spoken answer with what they said and an English level
 *    (never "CEFR"); every question's verdict reads Full marks or Not yet (no fractions); the good
 *    written answer gets Full marks (mock grader).
 * 5. The path holds the full-stack progression in learning order (no "learn first" link broken) and
 *    soft-skills courses; the first 8 items are reported. Auto courses: before onboarding the
 *    superadmin empties one soft skill's course list in the catalog (a real admin edit), so that
 *    skill has no course. The plan card lists it under new courses, and the path shows it as being
 *    made. v4.5.1: no search service is saved in this e2e, and that no longer blocks anything: with
 *    only the AI credential the course is researched by the AI (here the mock, which has no web
 *    search, so AI-only mode) and is shown as being made, never "isn't set up". The mock can't write
 *    a real course, so it isn't published here; publishing and the "We added N new course(s)…"
 *    notice are covered by server/src/builder/autoCourse.test.ts.
 * 6. Review: the learner requests a review on a Not-yet topic test answer; the admin gives Full marks
 *    in one click on Review requests; the learner sees it in their notifications.
 * 7. Copy: the visible text of the admin pages visited has none of COPY_GUIDE.md's banned words.
 *
 * Throwaway DATA_DIR under %TEMP%, port 8804, the deterministic mock AI (NODE_ENV=development).
 * Screenshots go to %TEMP%/claude/e2e-shots-v44 (override with E2E_SHOTS). E2E_HEADED=1 to watch.
 * STT_BASE_URL (optional) points the server at a real whisper server for the recording.
 * Exits non-zero when any assertion fails, and always stops its server.
 *
 * Helpers are copied from v43-worked-example.ts on purpose, so no script's changes can break another.
 */
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type APIRequestContext, type Browser, type Locator, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PORT = Number(process.env.E2E_PORT ?? 8804);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const SHOTS = process.env.E2E_SHOTS ?? path.join(os.tmpdir(), "claude", "e2e-shots-v44");
const HEADED = process.env.E2E_HEADED === "1";
const JOB_TIMEOUT_MS = Number(process.env.E2E_JOB_TIMEOUT_MS ?? 6 * 60_000);

const REFERENCE = "frontend engineer with 1 year of experience and also want him to move to the full stack and also improve the soft skills";
const ZORBLAX = `${REFERENCE} and also handle the zorblax pipeline`;
/** The soft skill whose course list the superadmin empties, so it has no course yet. */
const UNCOVERED_SKILL = "ss-teamwork";
/** The full-stack group's progression, in the order it should be learned. */
const FULLSTACK_ORDER = ["eng-http", "eng-node-runtime", "eng-express", "eng-sql", "eng-auth-sessions-jwt", "eng-paas-deploy", "eng-fullstack-delivery"];

/** COPY_GUIDE.md's banned words (whole words, plurals, any case). */
const BANNED = /\b(blueprints?|slots?|mastery|prerequisites?|prerequisite graph|topological|intent extraction|banks?|question banks?|rubrics?|calibrat(?:e|es|ed|ing|ion|ions)|tokens?|models?|slider values?|cefr|core tests?|edge tests?)\b/gi;
/** In onboarding copy, "assessment" and "intent" are banned too. */
const BANNED_ONBOARDING = /\b(assessments?|intents?)\b/gi;

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
  await page.screenshot({ path: path.join(SHOTS, `ref-${name}.png`), fullPage: true }).catch(() => undefined);
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

class ClickCounter {
  count = 0;
  log: string[] = [];
  async click(locator: Locator, what: string): Promise<void> {
    this.count += 1;
    this.log.push(what);
    await locator.click();
  }
}

const oneLine = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

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

/** A short spoken status update as a 16 kHz WAV, made with Windows SAPI; null when it can't be made. */
function speechWav(dir: string): string | null {
  const file = path.join(dir, "speech.wav");
  if (fs.existsSync(file) && fs.statSync(file).size > 10_000) return file;
  if (process.platform !== "win32") return null;
  const text =
    "Hi team, quick update. Yesterday I finished the login page and fixed the bug in the checkout form. Today I will start on the order history screen. " +
    "I am blocked on the payments API, because the staging keys do not work yet, so I will ask Priya for new ones after this call. That is all from me, thanks.";
  const script = [
    "Add-Type -AssemblyName System.Speech",
    "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer",
    "$f = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)",
    `$s.SetOutputToWaveFile('${file.replace(/'/g, "''")}', $f)`,
    `$s.Speak('${text.replace(/'/g, "''")}')`,
    "$s.Dispose()",
  ].join("; ");
  const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], { stdio: "ignore", timeout: 60_000 });
  return r.status === 0 && fs.existsSync(file) ? file : null;
}

// ---------------------------------------------------------------------------
// Copy scan
// ---------------------------------------------------------------------------

const copyHits: string[] = [];

/**
 * The visible text of the page, minus content that is data rather than copy: ids and numbers in
 * mono type, a learner's answers and question text (pre-wrapped blocks), closed "Show details".
 */
async function scanCopy(page: Page, where: string, c: Checks, onboarding = false): Promise<void> {
  // A string, not a function: tsx's name-keeping helper does not exist inside the page.
  const chunks = (await page.evaluate(`(() => {
    const out = [];
    const skip = (el) => {
      for (let e = el; e; e = e.parentElement) {
        if (e.matches("script, style, pre, code, textarea, input, select option, .font-mono, .whitespace-pre-wrap, [aria-hidden='true']")) return true;
        if (e.tagName === "DETAILS" && !e.open && e.firstElementChild?.tagName !== "SUMMARY") return true;
      }
      return false;
    };
    const root = document.querySelector("main") ?? document.body;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || skip(el)) continue;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (!el.offsetParent && style.position !== "fixed") continue;
      const t = (n.textContent ?? "").trim();
      if (t) out.push(t);
    }
    // Controls' accessible names count as copy too.
    for (const b of root.querySelectorAll("[aria-label]")) if (!skip(b)) out.push(b.getAttribute("aria-label") ?? "");
    return out;
  })()`)) as string[];
  const hits: string[] = [];
  for (const chunk of chunks) {
    for (const re of onboarding ? [BANNED, BANNED_ONBOARDING] : [BANNED]) {
      re.lastIndex = 0;
      for (const m of chunk.matchAll(re)) hits.push(`"${m[0]}" in "${chunk.slice(0, 120)}"`);
    }
  }
  copyHits.push(...hits.map((h) => `${where}: ${h}`));
  c.ok(hits.length === 0, `copy: no banned words on ${where} (${chunks.length} text pieces)${hits.length ? `: ${hits.slice(0, 5).join("; ")}` : ""}`);
}

// ---------------------------------------------------------------------------
// 1-2. Onboarding
// ---------------------------------------------------------------------------

interface Facts {
  intents: string[];
  testMix: string;
  first8: string[];
  clicks: string;
  autoCourses: string;
  checks: string[];
}
const facts: Facts = { intents: [], testMix: "", first8: [], clicks: "", autoCourses: "", checks: [] };

async function watchSteps(admin: Page): Promise<void> {
  await admin.evaluate(`(() => {
    window.__steps = [];
    const read = () => {
      const ul = document.querySelector('ul[aria-label="Working on the plan"]');
      if (!ul) return;
      const snap = [...ul.querySelectorAll("li")].map((li) => (li.textContent ?? "").trim()).join(" | ");
      if (window.__steps.at(-1) !== snap) window.__steps.push(snap);
    };
    new MutationObserver(read).observe(document.body, { subtree: true, childList: true, characterData: true });
  })()`);
}

async function departmentIsEngineering(admin: Page, counter: ClickCounter): Promise<void> {
  const radio = admin.getByRole("radiogroup", { name: "Department" }).getByRole("radio", { name: "Engineering", exact: true });
  if ((await radio.getAttribute("aria-checked")) !== "true") await counter.click(radio, "Engineering");
}

async function onboardReference(admin: Page, c: Checks): Promise<{ userId: string; username: string; tempPassword: string }> {
  await admin.goto(`${BASE}/admin/onboard`, { waitUntil: "networkidle" });
  await admin.getByRole("radiogroup", { name: "Department" }).waitFor({ timeout: 20_000 });
  const clicks = new ClickCounter();
  step("type the name and the reference line, press Suggest");
  await admin.getByLabel("Full name").fill("Rahul Verma");
  await departmentIsEngineering(admin, clicks);
  await admin.getByLabel("Describe them in one line").fill(REFERENCE);
  await watchSteps(admin);
  await clicks.click(admin.getByRole("button", { name: "Suggest", exact: true }), "Suggest");
  const card = admin.getByRole("region", { name: /^Here's the plan/ });
  await card.waitFor({ timeout: 60_000 });
  // The preview fills in after the card shows.
  await poll("the test preview", 30_000, async () => ((await card.innerText()).includes("Working it out") ? null : true), 300);
  await shot(admin, "01-plan-card");

  const snaps = ((await admin.evaluate("window.__steps")) as string[]).map(oneLine);
  const labels = ["Reading your description", "Choosing what to check in the test", "Writing a 30-minute test", "Planning the first weeks"];
  c.fact(`Suggest steps seen: ${snaps.length} states; last: ${snaps.at(-1) ?? "none"}`);
  c.ok(labels.every((l) => snaps.some((s) => s.includes(l))), "the four Suggest steps were shown");
  // Each step reads "<label>(done)" once ticked (the state is screen-reader text right after it).
  const ticked = labels.filter((l) => snaps.some((s) => s.split(" | ").some((part) => part.startsWith(l) && part.endsWith("(done)"))));
  c.ok(ticked.length >= 3, `the steps ticked as they finished (${ticked.length} of 4 seen ticked: ${ticked.join(", ")})`);

  const text = oneLine(await card.innerText());
  c.fact(`plan card: ${text.slice(0, 700)}`);
  c.ok(/What they do now Frontend engineer · about 1 year\b/.test(text), 'current role: "Frontend engineer · about 1 year"');
  const wants = await card.getByRole("list").first().getByRole("listitem").allInnerTexts();
  const wantLines = wants.map((w) => oneLine(w).replace(/(Most important|Important|Nice to have)/g, "").trim());
  facts.intents = [`current role: Frontend engineer · about 1 year`, ...wantLines.map((w, i) => `want ${i + 1}: ${w}`)];
  c.ok(wantLines.length === 2, `two wants (${wantLines.join(" / ")})`);
  c.ok(/full[- ]stack/i.test(wantLines[0] ?? ""), `want 1 is the full-stack move ("${wantLines[0]}")`);
  c.ok(/soft skills/i.test(wantLines[1] ?? ""), `want 2 is the soft skills ("${wantLines[1]}")`);
  const priorities = await card.locator("select").evaluateAll((els) => els.map((e) => (e as HTMLSelectElement).selectedOptions[0]?.textContent ?? ""));
  c.ok(priorities[0] === "Most important" && priorities[1] === "Important", `priorities: the role move above the soft skills (${priorities.join(", ")})`);

  const checks = await card.locator("p", { hasText: "What the test will check" }).locator("xpath=following-sibling::ul[1]/li").allInnerTexts();
  facts.checks = checks.map(oneLine);
  c.fact(`what the test will check: ${facts.checks.join(" | ")}`);
  c.ok(facts.checks.some((l) => /frontend/i.test(l)), "the test checks frontend");
  c.ok(facts.checks.some((l) => /first steps of backend|backend/i.test(l)), "the test checks the first steps of backend work");
  c.ok(facts.checks.some((l) => /spoken english/i.test(l) && /work emails/i.test(l)), "the test checks spoken English and work emails");

  // Show details: the soft-skills goal includes spoken English.
  await card.locator("summary", { hasText: "Show details" }).click();
  const details = oneLine(await card.locator("details").innerText());
  c.ok(/soft skills.*ss-spoken-english/i.test(details), "the soft-skills want includes spoken English (ss-spoken-english in Show details)");
  const newCourses = /New courses we’ll add to the library: ([^.]*?)(?: Looks good| We weren| Show details|$)/.exec(text)?.[1] ?? "";
  c.ok(/teamwork/i.test(newCourses), `the card lists the course we'll add for the skill with none ("${newCourses}")`);
  await card.locator("summary", { hasText: "Show details" }).click();

  await scanCopy(admin, "/admin/onboard (plan card)", c, true);

  await clicks.click(card.getByRole("button", { name: "Looks good — send the test" }), "Looks good — send the test");
  const notice = admin.getByRole("status").filter({ hasText: "Account created for Rahul Verma" });
  await notice.waitFor({ timeout: 60_000 });
  const message = (await notice.locator("pre").textContent()) ?? "";
  const tempPassword = /Temporary password: (\S+)/.exec(message)?.[1] ?? "";
  const username = /Username: (\S+)/.exec(message)?.[1] ?? "rahul.verma";
  c.ok(tempPassword.length >= 8, "temporary password captured from the notice");
  c.ok(clicks.count <= 3, `default path: ${clicks.count} clicks after typing (${clicks.log.join(" → ")}); target ≤ 3`);
  facts.clicks = `${clicks.count} (${clicks.log.join(" → ")})`;
  await shot(admin, "02-onboarded");

  const { users } = await getJson<{ users: { id: string; username: string; displayName: string }[] }>(admin.request, "/api/admin/users");
  const user = users.find((u) => u.username === username) ?? users.find((u) => u.displayName === "Rahul Verma");
  if (!user) throw new Error(`created user ${username} not found`);
  return { userId: user.id, username: user.username, tempPassword };
}

async function zorblax(admin: Page, c: Checks): Promise<void> {
  await admin.goto(`${BASE}/admin/onboard`, { waitUntil: "networkidle" });
  await admin.getByRole("radiogroup", { name: "Department" }).waitFor({ timeout: 20_000 });
  await admin.getByLabel("Full name").fill("Zara Khan");
  await departmentIsEngineering(admin, new ClickCounter());
  await admin.getByLabel("Describe them in one line").fill(ZORBLAX);
  await admin.getByRole("button", { name: "Suggest", exact: true }).click();
  const card = admin.getByRole("region", { name: /^Here's the plan/ });
  await card.waitFor({ timeout: 60_000 });
  const question = card.getByRole("group", { name: /^Not sure about .*zorblax/ });
  await question.waitFor({ timeout: 10_000 });
  const said = oneLine(await question.innerText());
  c.ok(/We weren[’']t sure what you meant by [‘'][^’']*zorblax[^’']*[’']/.test(said), `the card asks: "${said.slice(0, 140)}"`);
  const send = card.getByRole("button", { name: "Looks good — send the test" });
  c.ok(await send.isDisabled(), "send is disabled while the question is open");
  await shot(admin, "03-zorblax-question");
  const options = await question.getByRole("button").allInnerTexts();
  c.fact(`zorblax options: ${options.join(" | ")}`);
  await question.getByRole("button").last().click();
  await poll("send enabled", 10_000, async () => ((await send.isEnabled()) ? true : null), 200);
  c.ok(await send.isEnabled(), `send is enabled after picking "${options.at(-1)}"`);
  // Zara is not sent: the check is the question, not a second learner.
}

// ---------------------------------------------------------------------------
// 3-4. The test
// ---------------------------------------------------------------------------

interface SheetItemLite {
  id: string;
  position: number;
  type: "coding" | "mcq" | "task";
  skillId: string;
  skillName: string;
  draft: unknown;
  task?: { kind: string; variant?: string; lookFor?: string[]; criteria?: { label: string }[]; prompt?: string; title?: string };
}
interface AdminItemLite extends SheetItemLite {
  difficulty: number;
  answer: { correctIndex?: number; task?: { rubric?: { label: string; description: string }[]; sampleAnswer?: string } } | null;
  score: number | null;
  verdict: "full" | "not_yet" | null;
  rawScore: number | null;
  feedback: string | null;
  response: { task?: { kind: string; recordingId?: string; usedFallback?: boolean } } | null;
}
interface AdminDetail {
  result: { skills: { skillId: string; level: number | null }[]; mastery?: unknown } | null;
  items: AdminItemLite[];
}

const kindOf = (i: SheetItemLite) => (i.type === "task" ? (i.task?.kind ?? "task") : i.type);
const isSoft = (id: string) => id.startsWith("ss-");
const isFrontendBasic = (id: string) => /^eng-(js|html|css|react|typescript|javascript|dom|web|a11y|accessib|browser|git|frontend)/.test(id);

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
  const consentText = oneLine(await page.locator("body").innerText());
  c.ok(/microphone/i.test(consentText), "the consent text covers the microphone");
  await page.getByRole("button", { name: "I agree, check my camera" }).click();
  await page.getByRole("heading", { name: "Camera check" }).waitFor({ timeout: 15_000 });
  const calibrated = await page
    .waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Continue" && !b.disabled), undefined, { timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  if (calibrated) {
    c.note("camera calibration passed with the fake device; the rest of the pre-flight is skipped through the API");
  } else {
    c.note("camera calibration cannot pass with Chromium's fake device (no face); consent/start sent via API with the learner's session, as the page would");
  }
  const permissions = { camera: true, microphone: true, fullscreen: true, tabMonitoring: true };
  await sendJson(request, "post", `/api/assessment/${assessmentId}/consent`, { agreed: true, permissions });
  await sendJson(request, "post", `/api/assessment/${assessmentId}/start`, {});
  await page.goto(`${BASE}/assessment`, { waitUntil: "networkidle" });
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

/** A good answer in its own words: one sentence per thing the marking guide looks for. */
function goodWrittenAnswer(item: AdminItemLite): string {
  const lines = item.answer?.task?.rubric?.map((r) => `${r.label}: ${r.description}`) ?? item.task?.criteria?.map((r) => r.label) ?? item.task?.lookFor ?? [];
  const body = lines.map((l) => `I will make sure of this: ${l.replace(/\.$/, "").toLowerCase()}.`).join(" ");
  return `Hi Sam,\n\nThanks for your patience. ${body} I will send you a short update by 5 pm today so you always know where things stand, and I am happy to jump on a call if that helps.\n\nBest regards,\nRahul`;
}

async function takeTest(browser: Browser, admin: Page, who: { userId: string; username: string; tempPassword: string }, c: Checks, wav: string | null): Promise<{ learner: Page; assessmentId: string; detail: AdminDetail; writeId: string | null }> {
  step("wait for the test to be written");
  const assessment = await poll("assessment ready", JOB_TIMEOUT_MS, async () => {
    const { assessments } = await getJson<{ assessments: { id: string; status: string }[] }>(admin.request, `/api/admin/users/${who.userId}/assessments`);
    if (assessments[0]?.status === "failed") throw new Error("assessment generation failed");
    return assessments[0]?.status === "ready" ? assessments[0] : null;
  }, 2000);
  const before = await getJson<AdminDetail>(admin.request, `/api/admin/assessments/${assessment.id}/v4`);
  const byKind = new Map<string, number>();
  for (const i of before.items) byKind.set(kindOf(i), (byKind.get(kindOf(i)) ?? 0) + 1);
  facts.testMix = [...byKind].map(([k, n]) => `${k}×${n}`).join(", ") + ` (${before.items.length} questions)`;
  c.fact(`test mix by kind: ${facts.testMix}`);
  c.fact(`test skills: ${[...new Set(before.items.map((i) => i.skillId))].join(", ")}`);
  c.ok(before.items.some((i) => isFrontendBasic(i.skillId)), "the test has frontend questions");
  c.ok(before.items.some((i) => FULLSTACK_ORDER.includes(i.skillId) || /^eng-(node|express|sql|rest|auth|cors)/.test(i.skillId)), "the test has backend first-step questions");
  c.ok(before.items.some((i) => isSoft(i.skillId)), "the test has soft-skill questions");
  const speak = before.items.filter((i) => kindOf(i) === "speak");
  const write = before.items.filter((i) => kindOf(i) === "write");
  c.ok(speak.length >= 1 && speak.length <= 2, `1–2 Speak questions (${speak.length})`);
  c.ok(write.length >= 1, `≥ 1 writing question (${write.length})`);

  const learnerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["camera", "microphone"] });
  const page = await learnerCtx.newPage();
  page.on("pageerror", (error) => console.log(`    [learner pageerror] ${error.message}`));
  step(`learner ${who.username} signs in`);
  await signIn(page, who.username, who.tempPassword, LEARNER_NEW);
  await page.goto(`${BASE}/assessment`, { waitUntil: "networkidle" });
  await passPreflight(page, learnerCtx.request, assessment.id, c);
  const sheet = (await getJson<{ items: SheetItemLite[] }>(learnerCtx.request, `/api/assessment/${assessment.id}/sheet`)).items;
  const keyed = new Map(before.items.map((i) => [i.id, i]));

  step("answer: MCQs against the key, a recording, a typed spoken answer, an email");
  const plan: string[] = [];
  let recorded = false;
  let typedSpeak = false;
  let writeId: string | null = null;
  for (const [index, item] of sheet.entries()) {
    const kind = kindOf(item);
    if (kind === "mcq") {
      const key = keyed.get(item.id)?.answer?.correctIndex;
      if (typeof key !== "number") throw new Error(`no key for MCQ ${index + 1}`);
      // Right for the frontend basics; wrong for backend and soft skills, so gaps appear.
      const right = !isSoft(item.skillId) && !FULLSTACK_ORDER.includes(item.skillId) && !/^eng-(node|express|sql|rest|auth|cors|paas|fullstack)/.test(item.skillId);
      await goTo(page, index, sheet.length);
      const radios = article(page).locator('input[type="radio"]');
      const n = await radios.count();
      await radios.nth(right ? key : (key + 1) % n).check();
      plan.push(`Q${index + 1} ${item.skillId}: ${right ? "right" : "wrong"}`);
      continue;
    }
    if (kind === "speak" && !recorded) {
      await goTo(page, index, sheet.length);
      const box = article(page);
      await box.getByRole("button", { name: /^Start: \d+ seconds to get ready/ }).click();
      await box.getByRole("button", { name: "I'm ready" }).click();
      await box.getByText("Recording", { exact: true }).waitFor({ timeout: 15_000 });
      await page.waitForTimeout(6_000);
      await box.getByRole("button", { name: "Stop" }).click();
      const upload = page.waitForResponse((r) => r.url().includes("/api/recordings") && r.request().method() === "POST", { timeout: 30_000 });
      await box.getByRole("button", { name: "Use this recording" }).click();
      const res = await upload;
      c.ok(res.ok(), `the recording uploaded (${res.status()}, ${wav ? "SAPI speech WAV" : "Chromium's fake tone"} as the microphone)`);
      await box.getByText(/Your recording is saved/).first().waitFor({ timeout: 30_000 });
      recorded = true;
      plan.push(`Q${index + 1} ${item.skillId}: recorded`);
      continue;
    }
    if (kind === "speak") {
      await goTo(page, index, sheet.length);
      const box = article(page);
      await box.getByRole("button", { name: "Type your answer instead" }).click();
      await box.getByLabel("Your answer, typed").fill(
        "Hi everyone. Yesterday I finished the signup form and fixed two bugs in the cart page. Today I am wiring the order history screen to the new API. " +
          "One blocker: the staging payment keys are not working, so I will ask the backend team for new ones right after this. If that slips, I will tell the client by noon and give a new date.",
      );
      typedSpeak = true;
      plan.push(`Q${index + 1} ${item.skillId}: typed instead of spoken`);
      continue;
    }
    if (kind === "write" && !writeId) {
      await goTo(page, index, sheet.length);
      const answer = goodWrittenAnswer(keyed.get(item.id)!);
      await article(page).locator("textarea").first().fill(answer);
      writeId = item.id;
      plan.push(`Q${index + 1} ${item.skillId}: a good written answer`);
      continue;
    }
    plan.push(`Q${index + 1} ${item.skillId} (${kind}): left`);
  }
  await goTo(page, 0, sheet.length);
  c.fact(`answers: ${plan.join("; ")}`);
  c.ok(recorded, "one Speak question was recorded");
  if (speak.length >= 2) c.ok(typedSpeak, 'the other Speak question used "Type your answer instead"');
  else c.note("the test has one Speak question, so the typed-instead path was not used here");
  const answeredIds = sheet.filter((i) => kindOf(i) === "mcq" || kindOf(i) === "speak" || i.id === writeId).map((i) => i.id);
  const saved = await poll("drafts saved", 20_000, async () => {
    const s = (await getJson<{ items: SheetItemLite[] }>(learnerCtx.request, `/api/assessment/${assessment.id}/sheet`)).items;
    return s.filter((i) => answeredIds.includes(i.id)).every((i) => i.draft !== null) ? s : null;
  }, 500).catch(() => null);
  c.ok(saved !== null, `server: every answer given in the UI has a draft (${answeredIds.length})`);
  await shot(page, "04-sheet");

  step("Finish and hand in");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const dialog = page.getByRole("alertdialog").or(page.getByRole("dialog")).filter({ hasText: "Finish the assessment?" });
  await dialog.waitFor({ timeout: 10_000 });
  await dialog.getByRole("button", { name: "Finish and hand in" }).click();
  await page.getByText(/Your answers are handed in|Your assessment is done/).first().waitFor({ timeout: 30_000 });
  const handedIn = Date.now();

  step("wait for the evaluation");
  await poll("assessment completed", JOB_TIMEOUT_MS, async () => {
    const { assessments } = await getJson<{ assessments: { status: string }[] }>(admin.request, `/api/admin/users/${who.userId}/assessments`);
    if (assessments[0]?.status === "failed") throw new Error("assessment evaluation failed");
    return assessments[0]?.status === "completed" ? true : null;
  }, 2000);
  const detail = await poll("the evaluation result", JOB_TIMEOUT_MS, async () => {
    const d = await getJson<AdminDetail>(admin.request, `/api/admin/assessments/${assessment.id}/v4`);
    return d.result?.mastery ? d : null;
  }, 2000).catch(async () => getJson<AdminDetail>(admin.request, `/api/admin/assessments/${assessment.id}/v4`));
  c.fact(`evaluation done ${Math.round((Date.now() - handedIn) / 1000)} s after hand-in${process.env.STT_BASE_URL ? ` (real STT at ${process.env.STT_BASE_URL})` : " (mock STT)"}`);
  return { learner: page, assessmentId: assessment.id, detail, writeId };
}

async function checkResults(admin: Page, userId: string, assessmentId: string, detail: AdminDetail, writeId: string | null, c: Checks): Promise<void> {
  step("the recording was transcribed");
  const spoken = detail.items.find((i) => kindOf(i) === "speak" && i.response?.task?.recordingId);
  const recordingId = spoken?.response?.task?.recordingId;
  if (recordingId) {
    const rec = await getJson<{ recording: { sttStatus: string; transcript: string | null; durationSec: number | null } }>(admin.request, `/api/admin/recordings/${recordingId}`);
    c.ok(rec.recording.sttStatus === "done" && (rec.recording.transcript ?? "").length > 0, `transcription done (${rec.recording.sttStatus}): "${(rec.recording.transcript ?? "").slice(0, 120)}"`);
  } else {
    c.ok(false, "the recorded Speak answer is stored with its recording");
  }

  step("verdicts: Full marks or Not yet only");
  const verdicts = detail.items.map((i) => i.verdict);
  c.ok(verdicts.every((v) => v === "full" || v === "not_yet"), `every question has a verdict (${verdicts.filter((v) => v === "full").length} Full marks, ${verdicts.filter((v) => v === "not_yet").length} Not yet, ${verdicts.filter((v) => !v).length} none)`);
  c.ok(detail.items.every((i) => i.score === 0 || i.score === 1), "full-marks mode stores 0 or 1 only");
  if (writeId) {
    const w = detail.items.find((i) => i.id === writeId);
    c.ok(w?.verdict === "full", `the good written answer in its own words gets Full marks (verdict ${w?.verdict}, grader ${w?.rawScore})`);
  }
  const speakItems = detail.items.filter((i) => kindOf(i) === "speak");
  c.fact(`speak verdicts: ${speakItems.map((i) => `${i.skillId}=${i.verdict}${i.response?.task?.usedFallback ? " (typed)" : ""}`).join(", ")}`);

  step("the admin's results page");
  await admin.goto(`${BASE}/admin/people/${userId}?tab=assessment`, { waitUntil: "networkidle" });
  await scanCopy(admin, "learner page, assessment tab", c);
  const showAll = admin.getByRole("button", { name: /^Show all \d+ questions and answers/ });
  await showAll.waitFor({ timeout: 20_000 });
  await showAll.click();
  await admin.getByText("What they said").first().waitFor({ timeout: 20_000 });
  const main = oneLine(await admin.locator("main").innerText());
  c.ok(/What they said/.test(main), "a spoken answer shows what they said");
  const level = /English level (A2|B1|B2|C1|below A2)/.exec(main)?.[1];
  c.ok(Boolean(level), `a spoken answer shows an English level (${level ?? "none"})`);
  c.ok(!/cefr/i.test(main), 'no "CEFR" anywhere on the results');
  const scores = await admin.locator("main li span.ml-auto.tabular").allInnerTexts();
  const fractions = scores.filter((s) => !/^(Full marks|Not yet)$/.test(s.trim()));
  c.ok(scores.length > 0 && fractions.length === 0, `item verdicts read Full marks / Not yet only (${scores.length} items${fractions.length ? `; others: ${fractions.slice(0, 5).join(", ")}` : ""})`);
  await shot(admin, "05-admin-results");
}

// ---------------------------------------------------------------------------
// 5. The path and new courses
// ---------------------------------------------------------------------------

interface PathItemLite {
  position: number;
  partNumber: number | null;
  partType: string | null;
  skillId?: string | null;
  courseTitle: string;
  reason: string;
  moduleId?: string | null;
  creating?: string | null;
}

async function checkPath(admin: Page, userId: string, c: Checks): Promise<void> {
  step("wait for the path");
  const data = await poll("path ready", JOB_TIMEOUT_MS, async () => {
    const g = await getJson<{ path: { status: string; failureReason: string | null; setupNeeded?: string | null; notice: string | null; items: PathItemLite[] } | null }>(admin.request, `/api/admin/users/${userId}/gaps`);
    if (g.path?.status === "failed" || g.path?.status === "budget_reached") return g;
    return g.path?.status === "ready" ? g : null;
  }, 2000);
  const p = data.path!;
  c.ok(p.status === "ready", `path status ready (got ${p.status}${p.failureReason ? `: ${p.failureReason}` : ""})`);
  const items = [...p.items].sort((a, b) => a.position - b.position);
  facts.first8 = items.slice(0, 8).map((i, k) => `${k + 1}. [P${i.partNumber}${i.partType ? ` ${i.partType}` : ""}] ${i.skillId ?? "-"} — ${i.courseTitle}${i.creating ? ` (being made: ${i.creating})` : ""}`);
  console.log(items.map((i) => `      [P${i.partNumber}${i.partType ? ` ${i.partType}` : ""}] ${i.skillId ?? "-"}  ${i.courseTitle}${i.creating ? ` [${i.creating}]` : ""}  — ${i.reason}`).join("\n"));
  const order = [...new Set(items.map((i) => i.skillId).filter((id): id is string => Boolean(id)))];
  c.fact(`path skill order: ${order.join(" → ")}`);

  const fullstack = FULLSTACK_ORDER.filter((id) => order.includes(id));
  c.ok(fullstack.length >= 5, `the full-stack progression is on the path (${fullstack.length}/${FULLSTACK_ORDER.length}: ${fullstack.join(", ")})`);
  const at = fullstack.map((id) => order.indexOf(id));
  c.ok(at.every((v, k) => k === 0 || v > at[k - 1]!), `in learning order: ${fullstack.map((id, k) => `${id}@${at[k]}`).join(" < ")}`);
  const soft = order.filter(isSoft);
  c.ok(soft.length >= 3, `soft-skills courses are on the path (${soft.length}: ${soft.join(", ")})`);
  // Spoken English joins the path only when the spoken answers were Not yet; this learner's got
  // Full marks (mock grader), so it is measured strong and left off.
  c.fact(`spoken English ${soft.includes("ss-spoken-english") ? "is on the path" : "is not on the path (both spoken answers got Full marks)"}`);

  const graphs = await Promise.all(["engineering", "soft"].map((d) => getJson<{ edges: { from: string; to: string; type: string }[] }>(admin.request, `/api/admin/skill-graph?departmentId=${d}`)));
  const pos = new Map(order.map((id, i) => [id, i]));
  const violated = graphs.flatMap((g) => g.edges).filter((e) => e.type === "prerequisite" && pos.has(e.from) && pos.has(e.to) && pos.get(e.from)! > pos.get(e.to)!);
  c.ok(violated.length === 0, `no "learn first" link is broken${violated.length ? `: ${violated.map((e) => `${e.from}→${e.to}`).join(", ")}` : ""}`);

  step("the skill with no course");
  const made = items.filter((i) => i.creating);
  const uncovered = items.filter((i) => i.skillId === UNCOVERED_SKILL);
  c.ok(uncovered.length > 0 && uncovered.every((i) => i.creating), `${UNCOVERED_SKILL} is on the path as a course being made (${uncovered.map((i) => i.creating).join(", ") || "not on the path"})`);
  c.ok(uncovered.every((i) => i.creating !== "waiting_setup"), `with only the AI credential it is not blocked (${uncovered.map((i) => i.creating).join(", ")})`);
  const otherMissing = items.filter((i) => !i.creating && !i.moduleId && !i.courseTitle);
  c.ok(otherMissing.length === 0, "every other path item has a course");
  c.ok(!p.setupNeeded && !/research provider|web search isn[’']t/i.test(p.notice ?? ""), `no "not set up" banner without a search service (setupNeeded: "${p.setupNeeded ?? ""}", notice: "${p.notice ?? ""}")`);
  facts.autoCourses = `${made.length} requested (${[...new Set(made.map((i) => `${i.skillId}: ${i.creating}`))].join(", ")}); made automatically with only the AI credential (AI-only research; mock AI, so not published in this e2e)`;

  await admin.goto(`${BASE}/admin/people/${userId}?tab=path`, { waitUntil: "networkidle" });
  const bar = admin.getByRole("region", { name: "Next action" });
  await bar.waitFor({ timeout: 20_000 });
  const kind = await bar.getAttribute("data-next-action");
  c.fact(`next action on the learner page: ${kind} — "${oneLine(await bar.innerText()).slice(0, 200)}"`);
  c.ok(kind !== "courses-waiting", `nothing is blocked on setup (${kind})`);
  c.ok(kind === "courses-creating" || kind === "courses-failed" || kind === "listen" || kind === "reviews", `the next action points at what's next (${kind})`);
  await scanCopy(admin, "learner page, path tab", c);
  await shot(admin, "06-admin-path");
}

// ---------------------------------------------------------------------------
// 6. Review
// ---------------------------------------------------------------------------

interface ManifestLite {
  tracks: { id: string; modules: { id: string; topics: { id: string; challengeType?: string }[] }[] }[];
}
interface TopicVideosLite {
  videos: { videoId: string; durationSeconds: number | null; requiredSeconds: number | null; segment: { start: number; end: number | null } }[];
  watchedCount: number;
  total: number;
  locked: boolean;
}

async function review(admin: Page, learner: Page, c: Checks): Promise<void> {
  step("find a soft-skills topic on the learner's plan");
  const manifest = await getJson<ManifestLite>(learner.request, "/api/me/manifest");
  const soft = manifest.tracks.find((t) => t.id === "soft");
  const found = soft?.modules.flatMap((m) => m.topics.filter((t) => !t.challengeType || t.challengeType === "quiz").map((t) => ({ topicId: t.id, moduleId: m.id })))[0];
  if (!found) throw new Error("no soft-skills quiz topic on the learner's plan");
  const url = `/track/soft/module/${found.moduleId}/topic/${found.topicId}`;
  c.fact(`topic for the review: ${found.topicId}`);

  // The test unlocks after the videos; post the progress the player would (as v43 does).
  let state = await getJson<TopicVideosLite>(learner.request, `/api/me/topics/${found.topicId}/videos`);
  for (const v of state.videos) {
    const end = v.requiredSeconds ?? v.durationSeconds ?? 0;
    for (let t = v.segment.start; t < v.segment.start + end; t += 20) {
      const to = Math.min(v.segment.start + end, t + 20);
      state = await sendJson<TopicVideosLite>(learner.request, "post", `/api/me/topics/${found.topicId}/videos/${v.videoId}/progress`, { from: t, to, position: to, elapsed: 10 });
    }
  }
  c.ok(!state.locked, `the topic test is unlocked (${state.watchedCount}/${state.total} videos)`);

  step("the learner takes the topic test and gets one wrong on purpose");
  await learner.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
  const submit = learner.getByRole("button", { name: "Submit answers" });
  await submit.waitFor({ timeout: 30_000 });
  const fieldsets = learner.locator("form fieldset");
  const n = await fieldsets.count();
  for (let i = 0; i < n; i += 1) {
    const fs = fieldsets.nth(i);
    const radio = fs.getByRole("radio").first();
    if (await radio.count()) await radio.click();
    else await fs.locator('input[type="checkbox"]').first().check();
  }
  await submit.click();
  await learner.getByText(/of \d+ correct/).first().waitFor({ timeout: 30_000 });
  const askButtons = learner.getByRole("button", { name: "Request review" });
  const wrong = await askButtons.count();
  c.ok(wrong > 0, `some answers are Not yet and offer "Request review" (${wrong})`);
  if (wrong === 0) return;
  await askButtons.first().click();
  await learner.getByTestId("review-requested").first().waitFor({ timeout: 15_000 });
  c.ok(true, "Review requested");
  await shot(learner, "07-review-requested");

  step("the admin gives full marks in one click");
  await admin.goto(`${BASE}/admin/reviews`, { waitUntil: "networkidle" });
  await scanCopy(admin, "/admin/reviews", c);
  const give = admin.getByRole("button", { name: "Give full marks" });
  await give.first().waitFor({ timeout: 20_000 });
  const adminClicks = new ClickCounter();
  await adminClicks.click(give.first(), "Give full marks");
  // The toast confirms it; the decided request leaves the open list.
  await admin.getByText(/^Full marks given\./).first().waitFor({ timeout: 20_000 });
  c.ok(adminClicks.count === 1, `the review took ${adminClicks.count} admin click`);
  await shot(admin, "08-admin-review");

  step("the learner sees it");
  await learner.goto(`${BASE}/plan`, { waitUntil: "networkidle" });
  const bell = learner.getByRole("button", { name: /^Notifications/ });
  await bell.click();
  const panel = learner.getByLabel("Notifications").last();
  await panel.getByText("Your answer now has full marks").waitFor({ timeout: 20_000 });
  c.ok(true, 'the learner\'s notifications say "Your answer now has full marks"');
  await shot(learner, "09-learner-notification");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run(browser: Browser, admin: Page, c: Checks, wav: string | null): Promise<void> {
  let learner: Page | null = null;
  try {
    console.log("\n0. a soft skill with no course (a real catalog edit)");
    await sendJson(admin.request, "put", `/api/admin/skills/${UNCOVERED_SKILL}`, { contentModules: [] });
    c.ok(true, `${UNCOVERED_SKILL}'s course list emptied in the catalog`);
    console.log("\n1. quick onboarding, the reference line");
    const who = await onboardReference(admin, c);
    console.log("\n2. a phrase nobody can place");
    await zorblax(admin, c);
    console.log("\n3. the test");
    const taken = await takeTest(browser, admin, who, c, wav);
    learner = taken.learner;
    console.log("\n4. results");
    await checkResults(admin, who.userId, taken.assessmentId, taken.detail, taken.writeId, c);
    console.log("\n5. the path");
    await checkPath(admin, who.userId, c);
    console.log("\n6. review");
    await review(admin, learner, c);
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
  const dataDir = path.join(os.tmpdir(), `oyelearn-e2e44r-${stamp}`);
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`data dir: ${dataDir}\nshots:    ${SHOTS}`);
  const wav = speechWav(path.dirname(SHOTS));
  console.log(`microphone: ${wav ?? "Chromium's built-in fake tone"}`);

  await startServer(dataDir);
  const browser = await chromium.launch({
    headless: !HEADED,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required", ...(wav ? [`--use-file-for-fake-audio-capture=${wav}`] : [])],
  });
  const c = new Checks("The reference case, end to end (v4.4)");
  try {
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const admin = await adminCtx.newPage();
    admin.on("pageerror", (error) => console.log(`    [admin pageerror] ${error.message}`));
    console.log("\nsuperadmin signs in (first login changes the password)");
    await signIn(admin, SUPER_USER, SUPER_INITIAL, SUPER_NEW);
    await sendJson(admin.request, "put", "/api/admin/assessment-settings", { minFinishMinutes: null });
    console.log(`\n=== ${c.name} ===`);
    await run(browser, admin, c, wav);
  } finally {
    await browser.close().catch(() => undefined);
    stopServer();
  }

  console.log("\n=== Summary ===");
  const verdict = c.failures.length === 0 ? "\u001b[32mPASS\u001b[0m" : "\u001b[31mFAIL\u001b[0m";
  console.log(`${verdict}  ${c.name}${c.failures.length ? ` (${c.failures.length} failed)` : ""}`);
  for (const f of c.failures) console.log(`        - ${f}`);
  console.log("\n  Facts");
  console.log(`    intents:        ${facts.intents.join(" | ")}`);
  console.log(`    test checks:    ${facts.checks.join(" | ")}`);
  console.log(`    test mix:       ${facts.testMix}`);
  console.log(`    clicks:         ${facts.clicks}`);
  console.log(`    auto courses:   ${facts.autoCourses}`);
  console.log("    first 8 path items:");
  for (const line of facts.first8) console.log(`      ${line}`);
  console.log(`    copy hits:      ${copyHits.length ? copyHits.join("; ") : "none"}`);
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
