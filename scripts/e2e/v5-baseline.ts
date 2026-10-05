/**
 * Oyelearn v5 Step 0.2: the "before" baseline of the current (v4.4) UI.
 *
 *   npm run build          # once; this script serves dist/ + dist-server/ and does not rebuild
 *   npx tsx scripts/e2e/v5-baseline.ts
 *
 * Once v5 work is in this checkout, serve the pre-v5 build from a worktree instead:
 *   git worktree add --detach %TEMP%/oyelearn-v44-baseline pre-v5   (link node_modules, npm run build)
 *   E2E_APP_DIR=%TEMP%/oyelearn-v44-baseline npx tsx scripts/e2e/v5-baseline.ts
 *
 * 1. Seeds a realistic state through the real UI: the superadmin onboards the reference learner
 *    ("frontend engineer with 1 year of experience and also want him to move to the full stack and
 *    also improve the soft skills"), the learner takes the test (MCQs against the key, right for the
 *    frontend basics and wrong elsewhere; spoken answers typed; one good email), the path is built and
 *    the next topic is partly watched. The learner asks for a review on a topic test.
 * 2. Full-page screenshots of every main screen, light and dark, 390 and 1440 px, as JPEG into
 *    docs/v5/shots/before/<screen>-<width>-<theme>.jpg (downscaled when large; total kept < ~15 MB).
 * 3. Click counts (every mouse click goes through one counter): learner "/" → inside the next step;
 *    admin home → onboard one learner + send the test; admin home → give full marks on a review.
 * 4. axe (@axe-core/playwright) on each main route, violations by impact; JS transferred (encoded
 *    bytes of script responses, as served) and LCP for the learner home and a topic page.
 * 5. Writes docs/v5/BASELINE.md.
 *
 * Throwaway DATA_DIR under %TEMP%, port 8810, the deterministic mock AI (NODE_ENV=development).
 * Exits non-zero when a required step fails, and always stops its server.
 *
 * Helpers are copied from v44-reference-case.ts on purpose, so no script's changes can break another.
 */
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

import AxeBuilder from "@axe-core/playwright";
import { chromium, type APIRequestContext, type Browser, type BrowserContext, type Locator, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
/**
 * The app to serve. Defaults to this checkout; point E2E_APP_DIR at a built worktree of the
 * pre-v5 commit when this checkout already holds v5 work (outputs still go to this repo's docs/).
 */
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.E2E_PORT ?? 8810);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const SHOTS = path.join(REPO, "docs", "v5", "shots", "before");
const REPORT = path.join(REPO, "docs", "v5", "BASELINE.md");
const HEADED = process.env.E2E_HEADED === "1";
const JOB_TIMEOUT_MS = Number(process.env.E2E_JOB_TIMEOUT_MS ?? 6 * 60_000);
const WIDTHS = [390, 1440] as const;
const THEMES = ["light", "dark"] as const;
type Theme = (typeof THEMES)[number];
/** Shots above this are re-encoded smaller in a canvas. */
const SHOT_SOFT_LIMIT = 140_000;

const REFERENCE = "frontend engineer with 1 year of experience and also want him to move to the full stack and also improve the soft skills";
const FULLSTACK = ["eng-http", "eng-node-runtime", "eng-express", "eng-sql", "eng-auth-sessions-jwt", "eng-paas-deploy", "eng-fullstack-delivery"];

// ---------------------------------------------------------------------------
// Logging, polling, HTTP
// ---------------------------------------------------------------------------

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

const oneLine = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------
// The one click counter
// ---------------------------------------------------------------------------

interface Journey {
  name: string;
  start: string;
  clicks: { what: string; url: string }[];
  end: string;
}

class ClickCounter {
  journey: Journey | null = null;
  begin(name: string, page: Page): void {
    this.journey = { name, start: new URL(page.url()).pathname, clicks: [], end: "" };
  }
  async click(locator: Locator, what: string): Promise<void> {
    await locator.click();
    if (this.journey) this.journey.clicks.push({ what, url: "" });
  }
  finish(page: Page): Journey {
    const j = this.journey!;
    j.end = new URL(page.url()).pathname + new URL(page.url()).search;
    this.journey = null;
    return j;
  }
}
const counter = new ClickCounter();
const journeys: Journey[] = [];

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
    if (!fs.existsSync(path.join(APP, required))) throw new Error(`${required} is missing. Run \`npm run build\` first.`);
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
// Screenshots
// ---------------------------------------------------------------------------

const shotFiles: { file: string; bytes: number }[] = [];
let shrinker: Page | null = null;

/** Re-encodes a large JPEG at a smaller scale and quality in a canvas (no image library needed). */
async function shrink(buffer: Buffer): Promise<Buffer> {
  if (!shrinker) return buffer;
  let out = buffer;
  // Quality first, then scale, never below 60 % so text stays legible.
  for (const [scale, quality] of [[1, 0.5], [1, 0.4], [0.85, 0.4], [0.7, 0.4], [0.6, 0.35]] as const) {
    if (out.length <= SHOT_SOFT_LIMIT) break;
    const b64 = buffer.toString("base64");
    const result = (await shrinker.evaluate(
      `(async () => {
        const img = new Image();
        img.src = "data:image/jpeg;base64,${b64}";
        await img.decode();
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * ${scale});
        c.height = Math.round(img.naturalHeight * ${scale});
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL("image/jpeg", ${quality}).split(",")[1];
      })()`,
    )) as string;
    out = Buffer.from(result, "base64");
  }
  return out;
}

async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate(
    `(() => {
      try {
        const raw = localStorage.getItem("oyelabs-ui");
        const v = raw ? JSON.parse(raw) : { state: { sidebarCollapsed: false }, version: 0 };
        v.state = { ...(v.state || {}), theme: "${theme}" };
        localStorage.setItem("oyelabs-ui", JSON.stringify(v));
      } catch {}
      document.documentElement.classList.toggle("dark", ${theme === "dark"});
    })()`,
  );
}

interface CaptureOptions {
  /** Runs before each variant (e.g. re-open a menu). */
  prepare?: (page: Page) => Promise<void>;
  /** Screenshot just this element instead of the full page. */
  element?: (page: Page) => Locator;
  /** Viewport only (for an open menu or panel, where the page behind is not the subject). */
  viewportOnly?: boolean;
}

/** Four shots: 390 and 1440 wide, light and dark. Leaves the page at 1440 light. */
async function capture(page: Page, screen: string, opts: CaptureOptions = {}): Promise<void> {
  for (const width of WIDTHS) {
    try {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    } catch (error) {
      note(`${screen} at ${width}: could not resize (${(error as Error).message.split("\n")[0]})`);
      continue;
    }
    for (const theme of THEMES) {
      const file = `${screen}-${width}-${theme}.jpg`;
      try {
        await setTheme(page, theme);
        if (opts.prepare) await opts.prepare(page);
        await page.waitForTimeout(450);
        const raw = opts.element
          ? await opts.element(page).screenshot({ type: "jpeg", quality: 62, animations: "disabled", timeout: 20_000 })
          : await page.screenshot({ type: "jpeg", quality: 62, fullPage: !opts.viewportOnly, animations: "disabled", timeout: 30_000 });
        const buf = await shrink(raw);
        fs.writeFileSync(path.join(SHOTS, file), buf);
        shotFiles.push({ file, bytes: buf.length });
      } catch (error) {
        note(`screenshot ${file} failed: ${(error as Error).message.split("\n")[0]}`);
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 }).catch(() => undefined);
  await setTheme(page, "light");
}

/**
 * Headless Chromium cannot resize a window in real fullscreen, so for the sheet's screenshots the
 * page leaves real fullscreen and gets a shim that reports fullscreen (as v44 does when the API is
 * missing), with requestFullscreen a no-op so "Return to fullscreen" does not re-enter it.
 */
async function fakeFullscreen(page: Page): Promise<void> {
  await page.evaluate(`(async () => {
    if (document.fullscreenElement && !window.__fsShim) await document.exitFullscreen().catch(() => {});
    window.__fsShim = true;
    Object.defineProperty(Document.prototype, "fullscreenElement", { configurable: true, get: () => document.documentElement });
    Element.prototype.requestFullscreen = function () { return Promise.resolve(); };
    document.dispatchEvent(new Event("fullscreenchange"));
  })()`);
  await page.waitForTimeout(300);
  const gate = page.getByRole("button", { name: "Return to fullscreen" });
  if (await gate.isVisible().catch(() => false)) await gate.click();
  await gate.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => undefined);
}

async function settle(page: Page, ms = 600): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(ms);
}

/** Topic pages embed YouTube, which can keep the network busy, so "idle" is waited for but not required. */
async function visit(page: Page, url: string): Promise<void> {
  await page.goto(`${BASE}${url}`, { waitUntil: "load", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(800);
}

// ---------------------------------------------------------------------------
// axe and performance
// ---------------------------------------------------------------------------

interface AxeRow {
  route: string;
  total: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  rules: string[];
}
const axeRows: AxeRow[] = [];

async function axe(page: Page, route: string, label = route): Promise<void> {
  try {
    if (route) await visit(page, route);
    // Third-party iframes (the YouTube player) are excluded: axe hangs injecting into them, and they
    // are not this app's markup. A hard timeout keeps one bad page from stalling the run.
    await page.evaluate(`document.querySelectorAll("iframe").forEach((f) => { try { if (new URL(f.src, location.href).origin !== location.origin) f.remove(); } catch { f.remove(); } })`);
    const result = await Promise.race([
      new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).exclude("iframe").analyze(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("axe timed out after 90 s")), 90_000)),
    ]);
    const row: AxeRow = { route: label, total: 0, critical: 0, serious: 0, moderate: 0, minor: 0, rules: [] };
    for (const v of result.violations) {
      const impact = (v.impact ?? "minor") as "critical" | "serious" | "moderate" | "minor";
      // Counted per affected element, which is what "violations" means on a page.
      row[impact] += v.nodes.length;
      row.total += v.nodes.length;
      row.rules.push(`${v.id} (${impact}, ${v.nodes.length})`);
    }
    axeRows.push(row);
    console.log(`    axe ${label}: ${row.total} (${row.critical} critical, ${row.serious} serious, ${row.moderate} moderate, ${row.minor} minor)`);
  } catch (error) {
    note(`axe on ${label} failed: ${(error as Error).message.split("\n")[0]}`);
  }
}

interface PerfRow {
  route: string;
  label: string;
  scripts: number;
  encodedBytes: number;
  decodedBytes: number;
  /** gzip -9 of the same files from dist/, for comparison when the server sends them uncompressed. */
  gzipBytes: number;
  encodings: string;
  lcpMs: number | null;
}
const perfRows: PerfRow[] = [];

async function measure(browser: Browser, storage: Awaited<ReturnType<BrowserContext["storageState"]>>, route: string, label: string): Promise<void> {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storage });
  await ctx.addInitScript(
    `(() => {
      window.__lcp = null;
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) window.__lcp = e.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
      } catch {}
    })()`,
  );
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  const scripts = new Map<string, { encoding: string; url: string }>();
  let encoded = 0;
  let decoded = 0;
  const encodings = new Set<string>();
  cdp.on("Network.responseReceived", (e: { requestId: string; type: string; response: { url: string; headers: Record<string, string> } }) => {
    if (e.type !== "Script") return;
    const h = Object.fromEntries(Object.entries(e.response.headers).map(([k, v]) => [k.toLowerCase(), v]));
    scripts.set(e.requestId, { encoding: h["content-encoding"] ?? "identity", url: e.response.url });
  });
  cdp.on("Network.dataReceived", (e: { requestId: string; dataLength: number }) => {
    if (scripts.has(e.requestId)) decoded += e.dataLength;
  });
  cdp.on("Network.loadingFinished", (e: { requestId: string; encodedDataLength: number }) => {
    const s = scripts.get(e.requestId);
    if (!s) return;
    encoded += e.encodedDataLength;
    encodings.add(s.encoding);
  });
  try {
    await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60_000 });
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
    await page.waitForTimeout(2500);
    // LCP is final once the user interacts; a key press stands in for that without changing the page.
    const lcp = (await page.evaluate("window.__lcp")) as number | null;
    let gzipBytes = 0;
    for (const { url } of scripts.values()) {
      const u = new URL(url);
      const file = path.join(APP, "dist", decodeURIComponent(u.pathname));
      if (u.origin === BASE && fs.existsSync(file)) gzipBytes += zlib.gzipSync(fs.readFileSync(file), { level: 9 }).length;
    }
    perfRows.push({ route, label, scripts: scripts.size, encodedBytes: encoded, decodedBytes: decoded, gzipBytes, encodings: [...encodings].join(", "), lcpMs: lcp === null ? null : Math.round(lcp) });
    console.log(`    perf ${label}: ${scripts.size} scripts, ${(encoded / 1024).toFixed(0)} KB transferred (${(decoded / 1024).toFixed(0)} KB decoded, ~${(gzipBytes / 1024).toFixed(0)} KB gzipped, ${[...encodings].join(", ")}), LCP ${lcp === null ? "n/a" : Math.round(lcp) + " ms"}`);
  } catch (error) {
    note(`perf on ${label} failed: ${(error as Error).message.split("\n")[0]}`);
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// Seeding: onboarding (also journey b)
// ---------------------------------------------------------------------------

async function onboard(admin: Page): Promise<{ userId: string; username: string; tempPassword: string }> {
  await visit(admin, "/admin");
  counter.begin("Admin: onboard one learner and send the test (from the admin home; typing not counted)", admin);
  await counter.click(admin.getByRole("link", { name: "Onboard learner" }).first(), 'Sidebar "Onboard learner"');
  await admin.getByRole("radiogroup", { name: "Department" }).waitFor({ timeout: 20_000 });
  await admin.getByLabel("Full name").fill("Rahul Verma");
  const eng = admin.getByRole("radiogroup", { name: "Department" }).getByRole("radio", { name: "Engineering", exact: true });
  if ((await eng.getAttribute("aria-checked")) !== "true") await counter.click(eng, 'Department "Engineering"');
  await admin.getByLabel("Describe them in one line").fill(REFERENCE);
  await counter.click(admin.getByRole("button", { name: "Suggest", exact: true }), '"Suggest"');
  const card = admin.getByRole("region", { name: /^Here's the plan/ });
  await card.waitFor({ timeout: 60_000 });
  await poll("the test preview", 30_000, async () => ((await card.innerText()).includes("Working it out") ? null : true), 300);
  // Not part of the journey: the screenshots of the plan card.
  await capture(admin, "admin-onboarding-card");
  await counter.click(card.getByRole("button", { name: "Looks good — send the test" }), '"Looks good — send the test"');
  const notice = admin.getByRole("status").filter({ hasText: "Account created for Rahul Verma" });
  await notice.waitFor({ timeout: 60_000 });
  journeys.push(counter.finish(admin));
  const message = (await notice.locator("pre").textContent()) ?? "";
  const tempPassword = /Temporary password: (\S+)/.exec(message)?.[1] ?? "";
  const username = /Username: (\S+)/.exec(message)?.[1] ?? "rahul.verma";
  ok(tempPassword.length >= 8, "temporary password captured from the notice");
  await capture(admin, "admin-onboarded");
  const { users } = await getJson<{ users: { id: string; username: string; displayName: string }[] }>(admin.request, "/api/admin/users");
  const user = users.find((u) => u.username === username) ?? users.find((u) => u.displayName === "Rahul Verma");
  if (!user) throw new Error(`created user ${username} not found`);
  return { userId: user.id, username: user.username, tempPassword };
}

// ---------------------------------------------------------------------------
// Seeding: the test
// ---------------------------------------------------------------------------

interface SheetItemLite {
  id: string;
  type: "coding" | "mcq" | "task";
  skillId: string;
  draft: unknown;
  task?: { kind: string; criteria?: { label: string }[]; lookFor?: string[] };
}
interface AdminItemLite extends SheetItemLite {
  answer: { correctIndex?: number; task?: { rubric?: { label: string; description: string }[] } } | null;
}
const kindOf = (i: SheetItemLite) => (i.type === "task" ? (i.task?.kind ?? "task") : i.type);
const isSoft = (id: string) => id.startsWith("ss-");

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

const chip = (page: Page, index: number) => page.getByRole("navigation", { name: "Questions" }).getByRole("button", { name: new RegExp(`^Question ${index + 1}:`) });
const article = (page: Page): Locator => page.locator("article").first();
async function goTo(page: Page, index: number, total: number): Promise<void> {
  await chip(page, index).click();
  await page.getByText(new RegExp(`^Question ${index + 1} of ${total}(\\D|$)`)).waitFor();
}

function goodWrittenAnswer(item: AdminItemLite): string {
  const lines = item.answer?.task?.rubric?.map((r) => `${r.label}: ${r.description}`) ?? item.task?.criteria?.map((r) => r.label) ?? item.task?.lookFor ?? [];
  const body = lines.map((l) => `I will make sure of this: ${l.replace(/\.$/, "").toLowerCase()}.`).join(" ");
  return `Hi Sam,\n\nThanks for your patience. ${body} I will send you a short update by 5 pm today so you always know where things stand, and I am happy to jump on a call if that helps.\n\nBest regards,\nRahul`;
}

async function takeTest(learner: Page, admin: Page, who: { userId: string }): Promise<string> {
  step("wait for the test to be written");
  const assessment = await poll("assessment ready", JOB_TIMEOUT_MS, async () => {
    const { assessments } = await getJson<{ assessments: { id: string; status: string }[] }>(admin.request, `/api/admin/users/${who.userId}/assessments`);
    if (assessments[0]?.status === "failed") throw new Error("assessment generation failed");
    return assessments[0]?.status === "ready" ? assessments[0] : null;
  }, 2000);
  const keyed = new Map((await getJson<{ items: AdminItemLite[] }>(admin.request, `/api/admin/assessments/${assessment.id}/v4`)).items.map((i) => [i.id, i]));

  step("pre-flight (consent and start through the API, as v44 does: the fake camera has no face)");
  await visit(learner, "/assessment");
  await learner.getByRole("heading", { name: "Before you start" }).waitFor({ timeout: 20_000 });
  await capture(learner, "learner-assessment-preflight");
  const permissions = { camera: true, microphone: true, fullscreen: true, tabMonitoring: true };
  await sendJson(learner.request, "post", `/api/assessment/${assessment.id}/consent`, { agreed: true, permissions });
  await sendJson(learner.request, "post", `/api/assessment/${assessment.id}/start`, {});
  await learner.goto(`${BASE}/assessment`, { waitUntil: "networkidle" });
  await learner.waitForSelector("text=/Question \\d+ of \\d+|Return to fullscreen/", { timeout: 30_000 });
  await ensureFullscreen(learner);
  await learner.getByText(/^Question \d+ of \d+/).waitFor({ timeout: 20_000 });

  step("answer quickly");
  const sheet = (await getJson<{ items: SheetItemLite[] }>(learner.request, `/api/assessment/${assessment.id}/sheet`)).items;
  let wrote = false;
  for (const [index, item] of sheet.entries()) {
    const kind = kindOf(item);
    if (kind === "mcq") {
      const key = keyed.get(item.id)?.answer?.correctIndex;
      if (typeof key !== "number") continue;
      const right = !isSoft(item.skillId) && !FULLSTACK.includes(item.skillId) && !/^eng-(node|express|sql|rest|auth|cors|paas|fullstack)/.test(item.skillId);
      await goTo(learner, index, sheet.length);
      const radios = article(learner).locator('input[type="radio"]');
      const n = await radios.count();
      await radios.nth(right ? key : (key + 1) % n).check();
    } else if (kind === "speak") {
      await goTo(learner, index, sheet.length);
      const box = article(learner);
      await box.getByRole("button", { name: "Type your answer instead" }).click();
      await box.getByLabel("Your answer, typed").fill(
        "Hi everyone. Yesterday I finished the signup form and fixed two bugs in the cart page. Today I am wiring the order history screen to the new API. " +
          "One blocker: the staging payment keys are not working, so I will ask the backend team for new ones right after this.",
      );
    } else if (kind === "write" && !wrote) {
      await goTo(learner, index, sheet.length);
      await article(learner).locator("textarea").first().fill(goodWrittenAnswer(keyed.get(item.id)!));
      wrote = true;
    }
  }
  // The sheet on an MCQ for the screenshots.
  const firstMcq = sheet.findIndex((i) => kindOf(i) === "mcq");
  await goTo(learner, Math.max(0, firstMcq), sheet.length);
  await learner.waitForTimeout(1500);
  await fakeFullscreen(learner);
  await capture(learner, "learner-assessment-sheet", { prepare: fakeFullscreen });
  const codingIdx = sheet.findIndex((i) => kindOf(i) === "coding");
  if (codingIdx >= 0) {
    await goTo(learner, codingIdx, sheet.length);
    await capture(learner, "learner-assessment-coding", { prepare: fakeFullscreen });
  }

  step("Finish and hand in");
  await fakeFullscreen(learner);
  await learner.getByRole("button", { name: "Finish", exact: true }).click();
  const dialog = learner.getByRole("alertdialog").or(learner.getByRole("dialog")).filter({ hasText: "Finish the assessment?" });
  await dialog.waitFor({ timeout: 10_000 });
  await dialog.getByRole("button", { name: "Finish and hand in" }).click();
  await learner.getByText(/Your answers are handed in|Your assessment is done/).first().waitFor({ timeout: 30_000 });

  step("wait for the evaluation and the path");
  await poll("assessment completed", JOB_TIMEOUT_MS, async () => {
    const { assessments } = await getJson<{ assessments: { status: string }[] }>(admin.request, `/api/admin/users/${who.userId}/assessments`);
    if (assessments[0]?.status === "failed") throw new Error("assessment evaluation failed");
    return assessments[0]?.status === "completed" ? true : null;
  }, 2000);
  const gaps = await poll("path ready", JOB_TIMEOUT_MS, async () => {
    const g = await getJson<{ path: { status: string; failureReason: string | null } | null }>(admin.request, `/api/admin/users/${who.userId}/gaps`);
    if (g.path?.status === "failed" || g.path?.status === "budget_reached") return g;
    return g.path?.status === "ready" ? g : null;
  }, 2000);
  ok(gaps.path?.status === "ready", `path ready (${gaps.path?.status}${gaps.path?.failureReason ? `: ${gaps.path.failureReason}` : ""})`);
  return assessment.id;
}

// ---------------------------------------------------------------------------
// Learner helpers
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

/** Posts the progress the player would. `share` of 1 watches everything; less leaves it partly done. */
async function watch(request: APIRequestContext, topicId: string, share: number): Promise<TopicVideosLite> {
  let state = await getJson<TopicVideosLite>(request, `/api/me/topics/${topicId}/videos`);
  const videos = share >= 1 ? state.videos : state.videos.slice(0, 1);
  for (const v of videos) {
    const full = v.requiredSeconds ?? v.durationSeconds ?? 0;
    const end = share >= 1 ? full : Math.floor(full * share);
    for (let t = v.segment.start; t < v.segment.start + end; t += 20) {
      const to = Math.min(v.segment.start + end, t + 20);
      // The route allows 120 samples a minute; a long video needs more, so wait out a 429.
      for (;;) {
        const res = await request.post(`${BASE}/api/me/topics/${topicId}/videos/${v.videoId}/progress`, { data: { from: t, to, position: to, elapsed: 10 } });
        if (res.status() === 429) {
          const wait = Number(/retry in (\d+) seconds/.exec(await res.text())?.[1] ?? 30);
          console.log(`    video progress rate-limited; waiting ${wait} s`);
          await new Promise((r) => setTimeout(r, (wait + 1) * 1000));
          continue;
        }
        if (!res.ok()) throw new Error(`POST video progress -> ${res.status()} ${await res.text()}`);
        state = (await res.json()) as TopicVideosLite;
        break;
      }
    }
  }
  return state;
}

function topicFromHref(href: string): { trackId: string; moduleId: string; topicId: string } | null {
  const m = /^\/track\/([^/]+)\/module\/([^/]+)\/topic\/([^/?#]+)/.exec(href);
  return m ? { trackId: m[1]!, moduleId: m[2]!, topicId: m[3]! } : null;
}

// ---------------------------------------------------------------------------
// Main flow
// ---------------------------------------------------------------------------

interface Ctx {
  browser: Browser;
  admin: Page;
  learner: Page;
  who: { userId: string; username: string; tempPassword: string };
  nextHref: string;
  codeHref: string | null;
  reviewTopicHref: string | null;
}

async function learnerJourney(ctx: Ctx): Promise<void> {
  const { learner } = ctx;
  step('journey (a): learner opens the app at "/" and gets inside the next step');
  await learner.setViewportSize({ width: 1440, height: 900 });
  await visit(learner, "/");
  counter.begin('Learner: open the app ("/") to inside the next step', learner);
  const nextPath = ctx.nextHref.split(/[?#]/)[0]!;
  const h1 = learner.getByRole("heading", { level: 1 }).first();
  if (!(await h1.waitFor({ timeout: 20_000 }).then(() => true).catch(() => false))) {
    note('the home page rendered nothing within 20 s; reloaded once (not counted as a click)');
    await visit(learner, "/");
    await h1.waitFor({ timeout: 30_000 });
  }
  const direct = learner.locator(`main a[href="${ctx.nextHref}"], main a[href="${nextPath}"]`).first();
  // The home page's resume line renders once progress has loaded.
  await direct.waitFor({ state: "visible", timeout: 10_000 }).catch(() => undefined);
  if (await direct.isVisible().catch(() => false)) {
    await counter.click(direct, `"${oneLine(await direct.innerText()).slice(0, 60)}" on the home page`);
  } else {
    // The home page has no link to the plan's next step: the sidebar's "My plan", then the next-step card.
    const planLink = learner.getByRole("link", { name: "My plan", exact: true }).first();
    await counter.click(planLink, 'Sidebar "My plan"');
    await learner.waitForURL((u) => u.pathname === "/plan", { timeout: 20_000 });
    const go = learner.locator("main").getByRole("link", { name: /^(Continue|Start)$/ }).first();
    await go.waitFor({ timeout: 20_000 });
    await counter.click(go, `"${oneLine(await go.innerText())}" on the next-step card`);
  }
  await learner.waitForURL((u) => u.pathname === nextPath, { timeout: 20_000 });
  await settle(learner);
  // "Inside" the step = the first piece of content visible on screen without another click.
  const inside = await learner
    .locator("main iframe, main video, main [data-testid='video-gate'], main button:has-text('Watch')")
    .first()
    .isVisible()
    .catch(() => false);
  const j = counter.finish(learner);
  journeys.push(j);
  ok(j.end.startsWith(nextPath), `landed on the next step ${nextPath} after ${j.clicks.length} click(s)`);
  if (!inside) note("on the topic page, no video/player was visible without another click (counted as inside the step anyway)");
}

async function learnerScreens(ctx: Ctx): Promise<void> {
  const { learner } = ctx;
  step("learner screenshots");
  await visit(learner, "/");
  await capture(learner, "learner-home");
  await visit(learner, "/plan");
  await capture(learner, "learner-plan");
  await capture(learner, "learner-plan-overview", { element: (p) => p.locator('section[aria-labelledby="route-heading"]').first() });
  await capture(learner, "learner-plan-week-trail", { element: (p) => p.locator('section[aria-labelledby="week-heading"]').first() });
  await visit(learner, "/library");
  await capture(learner, "learner-library");
  await visit(learner, ctx.nextHref);
  await capture(learner, "learner-topic");
  if (ctx.codeHref) {
    await visit(learner, ctx.codeHref);
    await capture(learner, "learner-topic-code");
  }
  const t = topicFromHref(ctx.nextHref);
  if (t) {
    await visit(learner, `/track/${t.trackId}/module/${t.moduleId}`);
    await capture(learner, "learner-module");
    await visit(learner, `/report/${t.trackId}`);
    await capture(learner, "learner-certificate");
  }
  await visit(learner, "/assessment");
  await capture(learner, "learner-results");
  await visit(learner, "/plan");
  const menu = async (p: Page) => {
    const content = p.getByRole("menu");
    if (!(await content.isVisible().catch(() => false))) {
      await p.getByRole("button", { name: /^Account:/ }).first().click();
      await content.waitFor({ timeout: 5000 });
    }
  };
  await capture(learner, "learner-profile-menu", { prepare: menu, viewportOnly: true });
  await learner.keyboard.press("Escape");
}

async function notificationsShot(learner: Page): Promise<void> {
  await visit(learner, "/plan");
  const open = async (p: Page) => {
    const panel = p.getByLabel("Notifications").last();
    if (!(await panel.isVisible().catch(() => false)) || (await panel.evaluate((el) => el.tagName === "BUTTON").catch(() => true))) {
      await p.getByRole("button", { name: /^Notifications/ }).first().click();
      await p.waitForTimeout(500);
    }
  };
  await capture(learner, "learner-notifications", { prepare: open, viewportOnly: true });
  await learner.keyboard.press("Escape");
}

async function reviewFlow(ctx: Ctx): Promise<void> {
  const { learner, admin } = ctx;
  if (!ctx.reviewTopicHref) throw new Error("no soft-skills quiz topic for the review");
  step("the learner gets a topic test wrong and asks for a review");
  await visit(learner, ctx.reviewTopicHref);
  const submit = learner.getByRole("button", { name: "Submit answers" });
  await submit.waitFor({ timeout: 30_000 });
  await capture(learner, "learner-topic-quiz");
  const fieldsets = learner.locator("form fieldset");
  const n = await fieldsets.count();
  for (let i = 0; i < n; i += 1) {
    const f = fieldsets.nth(i);
    const radio = f.getByRole("radio").first();
    if (await radio.count()) await radio.click();
    else await f.locator('input[type="checkbox"]').first().check();
  }
  await submit.click();
  await learner.getByText(/of \d+ correct/).first().waitFor({ timeout: 30_000 });
  const ask = learner.getByRole("button", { name: "Request review" });
  if (!ok((await ask.count()) > 0, "some answers are Not yet and offer Request review")) return;
  await ask.first().click();
  await learner.getByTestId("review-requested").first().waitFor({ timeout: 15_000 });
  await capture(learner, "learner-topic-quiz-result");

  step("admin review screenshots, then journey (c)");
  await visit(admin, "/admin/reviews");
  await admin.getByRole("button", { name: "Give full marks" }).first().waitFor({ timeout: 20_000 });
  await capture(admin, "admin-reviews");
  await visit(admin, "/admin");
  counter.begin("Admin: give full marks on a review request (from the admin home)", admin);
  await counter.click(admin.getByRole("link", { name: "Review requests" }).first(), 'Sidebar "Review requests"');
  const give = admin.getByRole("button", { name: "Give full marks" });
  await give.first().waitFor({ timeout: 20_000 });
  await counter.click(give.first(), '"Give full marks"');
  await admin.getByText(/^Full marks given\./).first().waitFor({ timeout: 20_000 });
  journeys.push(counter.finish(admin));
  ok(true, "full marks given");
}

async function adminScreens(ctx: Ctx): Promise<void> {
  const { admin, who } = ctx;
  step("admin screenshots");
  for (const [route, name] of [
    ["/admin", "admin-overview"],
    ["/admin/people", "admin-people"],
    ["/admin/generated", "admin-generated"],
    ["/admin/ai", "admin-ai-settings"],
    ["/admin/skill-graph", "admin-skill-graph"],
    ["/admin/courses", "admin-courses"],
  ] as const) {
    await visit(admin, route);
    await capture(admin, name);
  }
  for (const tab of ["setup", "assessment", "path", "library", "progress", "account"]) {
    await visit(admin, `/admin/people/${who.userId}?tab=${tab}`);
    await capture(admin, `admin-learner-${tab}`);
  }
  step("bulk onboarding (suggested, not sent)");
  await visit(admin, "/admin/onboard");
  await admin.getByRole("radio", { name: "Several people" }).click();
  await admin
    .getByLabel(/One person per line/)
    .fill(["Name, Username, Department, Description", "Anna Lee, anna.lee, Engineering, Laravel dev, 3 yrs, weak on Docker", "Ben Ode, , PM, new PM, never ran a sprint", "Cara Moss, , BD, Sales lead who should write proposals"].join("\n"));
  await admin.getByRole("button", { name: "Suggest all" }).click();
  await admin.getByRole("button", { name: /Looks good — send the tests \(3\)/ }).waitFor({ timeout: 90_000 });
  await settle(admin);
  await capture(admin, "admin-bulk");
}

async function axeAll(ctx: Ctx): Promise<void> {
  const { learner, admin, who } = ctx;
  step("axe");
  await learner.setViewportSize({ width: 1440, height: 900 });
  await admin.setViewportSize({ width: 1440, height: 900 });
  const t = topicFromHref(ctx.nextHref);
  for (const r of ["/", "/plan", "/library", ctx.nextHref, ...(ctx.codeHref ? [ctx.codeHref] : []), ...(ctx.reviewTopicHref ? [ctx.reviewTopicHref] : []), ...(t ? [`/track/${t.trackId}/module/${t.moduleId}`, `/report/${t.trackId}`] : []), "/assessment"]) {
    const label = r === ctx.nextHref ? `${r} (topic)` : r === ctx.codeHref ? `${r} (code topic)` : r === ctx.reviewTopicHref ? `${r} (quiz topic)` : r === "/assessment" ? "/assessment (results)" : r;
    await axe(learner, r, `learner ${label}`);
  }
  for (const r of [
    "/admin",
    "/admin/people",
    `/admin/people/${who.userId}`,
    `/admin/people/${who.userId}?tab=assessment`,
    `/admin/people/${who.userId}?tab=path`,
    `/admin/people/${who.userId}?tab=progress`,
    "/admin/onboard",
    "/admin/reviews",
    "/admin/generated",
    "/admin/ai",
    "/admin/skill-graph",
  ]) {
    await axe(admin, r, `admin ${r.replace(who.userId, ":id")}`);
  }
}

async function main(): Promise<number> {
  fs.rmSync(SHOTS, { recursive: true, force: true });
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = path.join(os.tmpdir(), `oyelearn-e2e-v5base-${Date.now().toString(36)}`);
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`data dir: ${dataDir}\nshots:    ${SHOTS}`);
  await startServer(dataDir);
  const browser = await chromium.launch({
    headless: !HEADED,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
  });
  shrinker = await (await browser.newContext()).newPage();
  let aborted = false;
  try {
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const admin = await adminCtx.newPage();
    admin.on("pageerror", (error) => console.log(`    [admin pageerror] ${error.message}`));
    console.log("\nsuperadmin signs in");
    await signIn(admin, SUPER_USER, SUPER_INITIAL, SUPER_NEW);
    await sendJson(admin.request, "put", "/api/admin/assessment-settings", { minFinishMinutes: null });

    console.log("\n1. onboarding (journey b)");
    const who = await onboard(admin);

    console.log("\n2. the learner takes the test");
    const learnerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["camera", "microphone"] });
    const learner = await learnerCtx.newPage();
    learner.on("pageerror", (error) => console.log(`    [learner pageerror] ${error.message}`));
    learner.on("console", (m) => { if (m.type() === "error") console.log(`    [learner console] ${m.text().slice(0, 300)}`); });
    learner.on("requestfailed", (r) => console.log(`    [learner requestfailed] ${r.url().slice(0, 120)} ${r.failure()?.errorText}`));
    await signIn(learner, who.username, who.tempPassword, LEARNER_NEW);
    await takeTest(learner, admin, who);

    console.log("\n3. the plan, a partly done topic");
    const week = await getJson<{ week: { items: { href: string; title: string; status: string; topicId: string | null; position: number; lane: string }[] } | null }>(learner.request, "/api/me/week");
    if (!week.week) throw new Error("no week was built");
    await visit(learner, "/plan");
    const nextLink = learner.locator("main").getByRole("link", { name: /^(Continue|Start)$/ }).first();
    await nextLink.waitFor({ timeout: 20_000 });
    const firstHref = (await nextLink.getAttribute("href")) ?? "";
    const firstTopic = topicFromHref(firstHref);
    if (!firstTopic) throw new Error(`the next step is not a topic: ${firstHref}`);
    const partial = await watch(learner.request, firstTopic.topicId, 0.5);
    console.log(`    next step ${firstHref}: watched part of the first video (${partial.watchedCount}/${partial.total} videos complete)`);
    await sendJson(learner.request, "post", "/api/me/progress/start", { topicId: firstTopic.topicId }).catch(() => note("POST /api/me/progress/start was not accepted; partial video progress only"));
    await visit(learner, "/plan");
    const nextHref = (await learner.locator("main").getByRole("link", { name: /^(Continue|Start)$/ }).first().getAttribute("href")) ?? firstHref;

    const manifest = await getJson<ManifestLite>(learner.request, "/api/me/manifest");
    const all = manifest.tracks.flatMap((t) => t.modules.flatMap((m) => m.topics.map((x) => ({ trackId: t.id, moduleId: m.id, ...x }))));
    const code = all.find((x) => x.challengeType === "code");
    let codeHref: string | null = null;
    if (code) {
      await watch(learner.request, code.id, 1);
      codeHref = `/track/${code.trackId}/module/${code.moduleId}/topic/${code.id}`;
    } else note("no code-challenge topic is unlocked for this learner");
    const soft = all.find((x) => x.trackId === "soft" && (!x.challengeType || x.challengeType === "quiz"));
    let reviewTopicHref: string | null = null;
    if (soft) {
      await watch(learner.request, soft.id, 1);
      reviewTopicHref = `/track/soft/module/${soft.moduleId}/topic/${soft.id}`;
    }
    const ctx: Ctx = { browser, admin, learner, who, nextHref, codeHref, reviewTopicHref };

    console.log("\n4. journey (a)");
    await learnerJourney(ctx);

    console.log("\n5. learner screens");
    await learnerScreens(ctx);

    console.log("\n6. review (journey c)");
    await reviewFlow(ctx);
    await notificationsShot(learner);

    console.log("\n7. admin screens");
    await adminScreens(ctx);

    console.log("\n8. axe");
    await axeAll(ctx);

    console.log("\n9. performance");
    const storage = await learnerCtx.storageState();
    await measure(browser, storage, "/", "learner home");
    await measure(browser, storage, "/plan", "My plan");
    await measure(browser, storage, nextHref, "topic page");
  } catch (error) {
    aborted = true;
    failures.push(`aborted: ${(error as Error).message.split("\n")[0]}`);
    console.log(`    \u001b[31mABORT\u001b[0m ${(error as Error).stack ?? error}`);
    for (const [i, p] of browser.contexts().flatMap((c) => c.pages()).entries()) {
      const file = path.join(os.tmpdir(), `v5-baseline-failure-${i}.png`);
      await p.screenshot({ path: file, fullPage: true }).catch(() => undefined);
      console.log(`    failure shot ${i}: ${p.url()} -> ${file}`);
    }
  } finally {
    await browser.close().catch(() => undefined);
    stopServer();
  }
  writeReport(aborted);
  console.log(`\n${failures.length ? `\u001b[31mFAIL\u001b[0m ${failures.length}: ${failures.join("; ")}` : "\u001b[32mPASS\u001b[0m"}`);
  const total = shotFiles.reduce((n, f) => n + f.bytes, 0);
  console.log(`${shotFiles.length} screenshots, ${(total / 1024 / 1024).toFixed(1)} MB; report: ${REPORT}`);
  return failures.length ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function writeReport(aborted: boolean): void {
  const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;
  const total = shotFiles.reduce((n, f) => n + f.bytes, 0);
  const lines: string[] = [];
  lines.push("# v5 baseline: the current UI, before the rebuild");
  lines.push("");
  lines.push(`Captured ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC from the v4.4 build (commit \`${gitHead()}\`) by \`scripts/e2e/v5-baseline.ts\`.`);
  lines.push("Seeded state: superadmin; one learner onboarded with the reference line (Engineering), test taken (MCQs right on frontend basics, wrong on backend and soft skills; spoken answers typed; one good email), path built, the next topic partly watched, one review requested and approved. Mock AI (NODE_ENV=development), Chromium, 1440×900 unless noted.");
  if (aborted || failures.length) lines.push(`\n**Run had problems:** ${failures.join("; ")}`);
  lines.push("");
  lines.push("## Click counts");
  lines.push("");
  lines.push("Every mouse click goes through one counter; typing and waiting are not counted.");
  for (const j of journeys) {
    lines.push("");
    lines.push(`### ${j.name}: **${j.clicks.length} click${j.clicks.length === 1 ? "" : "s"}**`);
    lines.push("");
    lines.push(`Start \`${j.start}\` → end \`${j.end}\``);
    lines.push("");
    j.clicks.forEach((c, i) => lines.push(`${i + 1}. ${c.what}`));
  }
  const onboarding = journeys.find((j) => j.name.startsWith("Admin: onboard"));
  if (onboarding) {
    const fromPage = onboarding.clicks.filter((c) => !c.what.startsWith("Sidebar")).length;
    lines.push("");
    lines.push(`From the onboarding page itself (after typing) it is ${fromPage} click${fromPage === 1 ? "" : "s"}.`);
  }
  lines.push("");
  lines.push("## Accessibility (axe-core, WCAG 2.0/2.1/2.2 A+AA + best practices, 1440 light)");
  lines.push("");
  lines.push("Counts are affected elements (nodes), grouped by the rule's impact. Third-party iframes (the YouTube player) are removed before the scan: axe cannot inject into them and they are not this app's markup.");
  lines.push("");
  lines.push("| Route | Total | Critical | Serious | Moderate | Minor | Rules |");
  lines.push("|---|---:|---:|---:|---:|---:|---|");
  for (const r of axeRows) lines.push(`| \`${r.route}\` | ${r.total} | ${r.critical} | ${r.serious} | ${r.moderate} | ${r.minor} | ${r.rules.join(", ") || "—"} |`);
  const sum = axeRows.reduce((a, r) => ({ total: a.total + r.total, critical: a.critical + r.critical, serious: a.serious + r.serious }), { total: 0, critical: 0, serious: 0 });
  lines.push(`| **All** | **${sum.total}** | **${sum.critical}** | **${sum.serious}** | | | |`);
  lines.push("");
  lines.push("## Performance (cold load, cache disabled, local server)");
  lines.push("");
  lines.push("JS transferred = encoded bytes of every script response as served (incl. headers). LCP from a PerformanceObserver on a cold load; local loopback, so it shows render cost, not network.");
  lines.push("");
  lines.push("The local server sends the app's JS uncompressed (`identity`), so the gzip column is `gzip -9` of the same files from `dist/` — what a compressing proxy would send.");
  lines.push("");
  lines.push("| Page | Route | Scripts | JS transferred | JS decoded | JS gzipped (est.) | Encoding | LCP |");
  lines.push("|---|---|---:|---:|---:|---:|---|---:|");
  for (const p of perfRows) lines.push(`| ${p.label} | \`${p.route}\` | ${p.scripts} | ${kb(p.encodedBytes)} | ${kb(p.decodedBytes)} | ${kb(p.gzipBytes)} | ${p.encodings} | ${p.lcpMs === null ? "n/a" : `${p.lcpMs} ms`} |`);
  lines.push("");
  lines.push(`## Screenshots (${shotFiles.length} files, ${(total / 1024 / 1024).toFixed(1)} MB)`);
  lines.push("");
  lines.push("In `docs/v5/shots/before/`, named `<screen>-<width>-<theme>.jpg` (JPEG, full page unless the screen is one section; large ones downscaled).");
  lines.push("");
  const screens = new Map<string, string[]>();
  for (const f of shotFiles) {
    const m = /^(.*)-(390|1440)-(light|dark)\.jpg$/.exec(f.file);
    const key = m?.[1] ?? f.file;
    screens.set(key, [...(screens.get(key) ?? []), f.file]);
  }
  for (const [screen, files] of screens) lines.push(`- **${screen}**: ${files.map((f) => `\`${f}\``).join(", ")}`);
  if (notes.length) {
    lines.push("");
    lines.push("## Notes");
    lines.push("");
    for (const n of notes) lines.push(`- ${n}`);
  }
  lines.push("");
  fs.writeFileSync(REPORT, lines.join("\n"));
}

function gitHead(): string {
  const r = spawnSync("git", ["-C", APP, "rev-parse", "--short", "HEAD"], { encoding: "utf8", timeout: 10_000 });
  return r.status === 0 ? r.stdout.trim() : "unknown";
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
