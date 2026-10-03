/**
 * Oyelearn v4.3 visual check: the weekly trail on "My plan" is one continuous path at every width.
 *
 *   npm run build          # once; this script serves dist/ + dist-server/ and does not rebuild
 *   npx tsx scripts/e2e/v43-trail-visual.ts
 *
 * 1. Starts the built server on a throwaway DATA_DIR (port 8801, mock AI via NODE_ENV=development).
 * 2. The superadmin signs in through the UI, then over the API creates a learner (no assessment)
 *    and publishes a 40-topic plan for them, so the first GET /api/me/week builds a rules-only week.
 * 3. The learner signs in (first login changes the password) and /plan is opened at 390, 768, 1280
 *    and 1440px, light and dark. At each: exactly one `[data-testid=week-trail-path]`, whose `d` has a
 *    single `M` followed only by `C`/`L` commands; one waypoint button per week item; the overview
 *    path (when the learner has a builder path) obeys the same rule. Full-page screenshots are saved.
 *
 * Screenshots go to %TEMP%/claude/e2e-shots-v43 (override with E2E_SHOTS). E2E_HEADED=1 to watch.
 * Exits non-zero when any assertion fails, and always stops its server.
 *
 * Helpers are copied from v42-pm-processes.ts on purpose, so neither script's changes break the other.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Browser, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PORT = Number(process.env.E2E_PORT ?? 8801);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER_INITIAL = "Trail-Initial-4471-Hp!";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const SHOTS = process.env.E2E_SHOTS ?? path.join(os.tmpdir(), "claude", "e2e-shots-v43");
const HEADED = process.env.E2E_HEADED === "1";
const WIDTHS = [390, 768, 1280, 1440];

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

const failures: string[] = [];

function check(ok: boolean, message: string): boolean {
  console.log(`    ${ok ? "\u001b[32mok\u001b[0m  " : "\u001b[31mFAIL\u001b[0m"} ${message}`);
  if (!ok) failures.push(message);
  return ok;
}

function note(message: string): void {
  console.log(`    \u001b[33mnote\u001b[0m ${message}`);
}

/** The same rule the unit tests assert: one M, then only C or L. */
function singleMove(d: string | null): { ok: boolean; detail: string } {
  if (!d) return { ok: false, detail: "no d attribute" };
  const ops = d.match(/[MmLlCcSsQqTtHhVvAaZz]/g) ?? [];
  const moves = ops.filter((op) => op === "M" || op === "m").length;
  const ok = ops[0] === "M" && moves === 1 && ops.slice(1).every((op) => op === "C" || op === "L");
  return { ok, detail: `${ops.length} commands, ${moves} M, ops {${[...new Set(ops)].join(",")}}` };
}

async function poll<T>(what: string, timeoutMs: number, fn: () => Promise<T | null | undefined>, everyMs = 1000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await fn();
    if (value !== null && value !== undefined) return value;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((resolve) => setTimeout(resolve, everyMs));
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
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.pipe(log);
  server.stderr?.pipe(log);
  console.log(`server log: ${logPath}`);
  await poll("/api/health", 60_000, async () => {
    if (server?.exitCode !== null) throw new Error(`server exited early (${server?.exitCode}); see ${logPath}`);
    const res = await fetch(`${BASE}/api/health`).catch(() => null);
    return res?.ok ? true : null;
  }, 500);
}

// ---------------------------------------------------------------------------
// Auth and seeding
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

async function api<T>(page: Page, method: "get" | "post" | "put", url: string, data?: unknown): Promise<T> {
  const response = await page.request[method](`${BASE}${url}`, data === undefined ? {} : { data });
  if (!response.ok()) throw new Error(`${method.toUpperCase()} ${url} -> ${response.status()} ${await response.text()}`);
  return (await response.json()) as T;
}

interface ManifestLite {
  tracks: { modules: { topics: { id: string }[] }[] }[];
}

/** A learner with a published 40-topic plan and no assessment: the week is built on first read. */
async function seedLearner(admin: Page, username: string): Promise<void> {
  const manifest = await api<ManifestLite>(admin, "get", "/api/me/manifest");
  const topicIds = manifest.tracks.flatMap((t) => t.modules.flatMap((m) => m.topics.map((topic) => topic.id))).slice(0, 40);
  if (topicIds.length < 5) throw new Error(`only ${topicIds.length} topics in the manifest`);

  const created = await api<{ user: { id: string } }>(admin, "post", "/api/admin/users", {
    username,
    displayName: "E2E v4.3 Trail",
    password: LEARNER_INITIAL,
    role: "learner",
    issueAssessment: false,
    profile: { roleTitle: "Frontend Engineer", yearsExperience: 2, adminNotes: "", claimedSkills: [], targetTracks: [] },
  });
  await api(admin, "put", `/api/admin/users/${created.user.id}/plan`, { topicIds });
  console.log(`  learner ${username} (${created.user.id}) with ${topicIds.length} topics`);
}

async function setTheme(page: Page, theme: "light" | "dark"): Promise<void> {
  await page.evaluate((t) => {
    localStorage.setItem("oyelabs-ui", JSON.stringify({ state: { theme: t }, version: 0 }));
    document.documentElement.classList.toggle("dark", t === "dark");
  }, theme);
}

// ---------------------------------------------------------------------------
// The check
// ---------------------------------------------------------------------------

async function checkPlan(page: Page, width: number, theme: "light" | "dark"): Promise<void> {
  console.log(`\n  ${width}px ${theme}`);
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${BASE}/plan`, { waitUntil: "networkidle" });
  await setTheme(page, theme);
  await page.evaluate(() => localStorage.setItem("oyelearn.plan.view", "trail"));
  await page.reload({ waitUntil: "networkidle" });

  const trail = page.locator("[data-testid=week-trail-path]");
  await trail.first().waitFor({ timeout: 30_000 });
  check((await trail.count()) === 1, `exactly one week-trail-path (found ${await trail.count()})`);

  const d = await trail.first().getAttribute("d");
  const parsed = singleMove(d);
  check(parsed.ok, `week trail d has a single M then only C/L (${parsed.detail})`);

  const week = await api<{ week: { items: unknown[] } | null }>(page, "get", "/api/me/week");
  const items = week.week?.items.length ?? 0;
  const markers = await page.locator("[data-testid=week-trail-waypoint]").count();
  check(markers === items, `one waypoint button per item (${markers} / ${items})`);

  // Every marker sits inside the trail container.
  const box = await trail.first().evaluate((el) => {
    const svg = el.ownerSVGElement!;
    return { width: svg.width.baseVal.value, height: svg.height.baseVal.value };
  });
  const outside = await page.locator("[data-testid=week-trail-waypoint]").evaluateAll(
    (els, size) =>
      els.filter((el) => {
        const left = parseFloat((el as HTMLElement).style.left);
        const top = parseFloat((el as HTMLElement).style.top);
        return !(left >= 0 && left <= size.width && top >= 0 && top <= size.height);
      }).length,
    box,
  );
  check(outside === 0, `all waypoints inside the ${Math.round(box.width)}×${Math.round(box.height)} trail`);

  const overview = page.locator("[data-testid=overview-trail-path]");
  const overviewCount = await overview.count();
  if (overviewCount === 0) note("no overview trail (this learner has no builder path; a hand-published plan has none)");
  else {
    check(overviewCount === 1, `exactly one overview-trail-path (found ${overviewCount})`);
    const o = singleMove(await overview.first().getAttribute("d"));
    check(o.ok, `overview trail d has a single M then only C/L (${o.detail})`);
  }

  // Keyboard: the first waypoint takes focus and opens its card.
  if (markers > 0) {
    const first = page.locator("[data-testid=week-trail-waypoint]").first();
    await first.focus();
    await page.keyboard.press("Enter");
    const opened = await page.getByRole("link", { name: /^(Start|Continue|Revisit)/ }).first().isVisible().catch(() => false);
    check(opened, "Enter on a waypoint opens its detail card");
    await page.screenshot({ path: path.join(SHOTS, `plan-${width}-${theme}-open.png`) }).catch(() => undefined);
    await page.keyboard.press("Escape");
  }

  await page.waitForTimeout(1300); // let the walked line finish drawing
  await page.screenshot({ path: path.join(SHOTS, `plan-${width}-${theme}.png`), fullPage: true }).catch(() => undefined);
}

async function main(): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v43-"));
  console.log(`DATA_DIR: ${dataDir}\nscreenshots: ${SHOTS}`);
  await startServer(dataDir);

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: !HEADED });

    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const admin = await adminCtx.newPage();
    console.log("\nsuperadmin signs in and seeds a learner");
    await signIn(admin, SUPER_USER, SUPER_INITIAL, SUPER_NEW);
    const username = `trail.e2e.${Date.now().toString(36)}`;
    await seedLearner(admin, username);

    const learnerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await learnerCtx.newPage();
    page.on("pageerror", (error) => console.log(`    [learner pageerror] ${error.message}`));
    console.log(`\nlearner ${username} signs in`);
    await signIn(page, username, LEARNER_INITIAL, LEARNER_NEW);

    for (const width of WIDTHS) {
      for (const theme of ["light", "dark"] as const) await checkPlan(page, width, theme);
    }
  } catch (error) {
    failures.push(`aborted: ${(error as Error).message.split("\n")[0]}`);
    console.log(`\n\u001b[31maborted\u001b[0m ${(error as Error).stack}`);
  } finally {
    await browser?.close().catch(() => undefined);
    stopServer();
  }

  console.log(`\n${failures.length === 0 ? "\u001b[32mall checks passed\u001b[0m" : `\u001b[31m${failures.length} failed\u001b[0m`}`);
  for (const failure of failures) console.log(`  - ${failure}`);
  console.log(`screenshots in ${SHOTS}`);
  process.exit(failures.length === 0 ? 0 : 1);
}

void main();
