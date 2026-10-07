/**
 * Oyelearn v5 Phase 1 end-to-end check: the `/design` living style guide.
 *
 *   npm run build          # once; this script serves dist/ + dist-server/ and does not rebuild
 *   npx tsx scripts/e2e/v5-design.ts
 *
 * 1. The superadmin signs in (API) and opens /design?ui=v5&all=1 (every section mounted).
 * 2. At 390 and 1440 px, in light and dark: <html> carries data-ui="v5", the body font is Outfit,
 *    every section heading is there, the colour swatches resolved, and axe (WCAG 2.2 AA tags)
 *    finds **no serious or critical** violations. Moderate/minor ones are listed as notes.
 * 3. Interactions: the dialog opens, traps focus and closes on Escape; the command palette opens
 *    and filters; the flashcard flips and rates with a key; the celebration closes itself within
 *    2 s (with reduced motion emulated).
 * 4. Scoping: with ?ui=old the same account gets the old UI and <html> has no data-ui.
 *
 * Throwaway DATA_DIR under %TEMP%, port 8812, mock AI. Screenshots go to
 * %TEMP%/claude/e2e-shots-v5-design (override with E2E_SHOTS). E2E_HEADED=1 to watch. Every wait
 * has a timeout. Exits non-zero when an assertion fails, and always stops its server.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import { chromium, type APIRequestContext, type Browser, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PORT = Number(process.env.E2E_PORT ?? 8812);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const SHOTS = process.env.E2E_SHOTS ?? path.join(os.tmpdir(), "claude", "e2e-shots-v5-design");
const HEADED = process.env.E2E_HEADED === "1";
const WAIT = 30_000;

const SECTION_TITLES = ["Brand", "Colour", "Type, space and motion", "Basics", "Progress and the trail", "Status, states and overlays", "Lesson parts", "Shell and tables"];

const failures: string[] = [];
const notes: string[] = [];
function ok(cond: unknown, message: string): boolean {
  if (cond) console.log(`    \u001b[32mok\u001b[0m   ${message}`);
  else {
    console.log(`    \u001b[31mFAIL\u001b[0m ${message}`);
    failures.push(message);
  }
  return Boolean(cond);
}
function note(message: string): void {
  console.log(`    \u001b[33mnote\u001b[0m ${message}`);
  notes.push(message);
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

async function sendJson(request: APIRequestContext, url: string, data: unknown): Promise<void> {
  const response = await request.post(`${BASE}${url}`, { data, timeout: WAIT });
  if (!response.ok()) throw new Error(`POST ${url} -> ${response.status()} ${await response.text()}`);
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
  });
}

// ---------------------------------------------------------------------------
// Page helpers
// ---------------------------------------------------------------------------

async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true, timeout: WAIT }).catch((e: Error) => note(`screenshot ${name} failed: ${e.message.split("\n")[0]}`));
}

async function openDesign(browser: Browser, storage: string, width: number, theme: "light" | "dark", reducedMotion: "reduce" | "no-preference" = "no-preference"): Promise<Page> {
  const ctx = await browser.newContext({ storageState: storage, viewport: { width, height: width < 768 ? 844 : 900 }, reducedMotion, colorScheme: theme });
  await ctx.addInitScript((t) => {
    try {
      window.localStorage.setItem("oyelabs-ui", JSON.stringify({ state: { theme: t, sidebarCollapsed: false }, version: 0 }));
    } catch {
      // ignore
    }
  }, theme);
  const page = await ctx.newPage();
  page.on("pageerror", (error) => note(`[pageerror ${width}/${theme}] ${error.message}`));
  await page.goto(`${BASE}/design?ui=v5&all=1`, { waitUntil: "domcontentloaded", timeout: WAIT });
  await page.getByRole("heading", { level: 1, name: "Oyelearn design system" }).waitFor({ timeout: WAIT });
  // Every lazy section has mounted and its content rendered.
  await poll("every section to load", WAIT, async () => {
    const pending = await page.locator('[role="status"][aria-label^="Loading "]:not([aria-label*="example"])').count();
    const table = await page.getByRole("heading", { name: "DataTable" }).count();
    return pending === 0 && table > 0 ? true : null;
  });
  await poll("colour swatches to resolve", WAIT, async () => ((await page.getByText("#2067D3").count()) > 0 ? true : null));
  return page;
}

async function axe(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  for (const v of bad) {
    console.log(`      ${v.impact} ${v.id}: ${v.help} (${v.nodes.length})`);
    for (const n of v.nodes.slice(0, 4)) console.log(`        ${n.target.join(" ")} :: ${n.failureSummary?.split("\n").slice(0, 2).join(" ")}`);
  }
  ok(bad.length === 0, `${label}: axe finds no serious or critical violations (${results.violations.length} total, ${results.passes.length} rules pass)`);
  for (const v of results.violations.filter((x) => !bad.includes(x))) note(`${label}: ${v.impact} ${v.id} (${v.nodes.length})`);
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

async function checkPage(page: Page, label: string): Promise<void> {
  const dataUi = await page.evaluate(() => document.documentElement.getAttribute("data-ui"));
  ok(dataUi === "v5", `${label}: <html data-ui="v5">`);
  const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  ok(/Outfit/.test(font), `${label}: body font is Outfit (${font.split(",")[0]})`);
  const headingFont = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily);
  ok(/Outfit/.test(headingFont), `${label}: headings use Outfit`);
  for (const title of SECTION_TITLES) {
    const n = await page.getByRole("heading", { level: 2, name: title, exact: true }).count();
    if (!ok(n === 1, `${label}: section "${title}"`)) break;
  }
  const unresolved = await page.locator("#colour").getByText(/^… ·/).count();
  ok(unresolved === 0, `${label}: every colour swatch read its token (${unresolved} unresolved)`);
  const failing = await page.getByText(/\d+ failing\)/).count();
  ok(failing === 0, `${label}: the colour tables report no failing contrast pair`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (!ok(overflow <= 1, `${label}: no horizontal page scroll (${overflow}px)`)) {
    const wide = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const out: string[] = [];
      for (const el of document.querySelectorAll("body *")) {
        if (el.getBoundingClientRect().right <= vw + 1 || getComputedStyle(el).position === "fixed") continue;
        let clippedBy = false;
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const o = getComputedStyle(p);
          if (o.overflowX !== "visible" || o.position === "fixed") {
            clippedBy = true;
            break;
          }
        }
        if (!clippedBy) out.push(`${el.tagName.toLowerCase()}#${el.id}.${String(el.getAttribute("class") ?? "").slice(0, 90)} right=${Math.round(el.getBoundingClientRect().right)}`);
        if (out.length >= 8) break;
      }
      return out;
    });
    for (const w of wide) console.log(`      too wide: ${w}`);
  }
  const trailMs = await page.locator('[data-testid="v5-trail-path"] path').count();
  ok(trailMs >= 2, `${label}: the trail drew its path and the walked overlay (${trailMs} paths)`);
}

async function interactions(page: Page): Promise<void> {
  step("interactions at 1440 light");
  const overlays = page.locator("#c-overlays");
  await overlays.scrollIntoViewIfNeeded({ timeout: WAIT });

  const opener = overlays.getByRole("button", { name: "Open a dialog" }).first();
  await opener.click({ timeout: WAIT });
  const dialog = page.getByRole("dialog", { name: "Leave this lesson?" });
  ok(await dialog.isVisible({ timeout: WAIT }).catch(() => false), "the dialog opens with its title as its name");
  const focusInside = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')));
  ok(focusInside, "focus moves into the dialog");
  await shot(page, "10-dialog");
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: WAIT }).catch(() => undefined);
  ok(!(await dialog.isVisible().catch(() => false)), "Escape closes it");
  ok(await opener.evaluate((el) => el === document.activeElement), "focus returns to the button that opened it");

  await overlays.getByRole("button", { name: "Open search" }).first().click({ timeout: WAIT });
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await palette.waitFor({ timeout: WAIT });
  await page.keyboard.type("event", { delay: 20 });
  const options = palette.getByRole("option");
  await poll("palette to filter", WAIT, async () => ((await options.count()) === 1 ? true : null)).catch(() => undefined);
  ok((await options.count()) === 1 && /event loop/i.test((await options.first().textContent()) ?? ""), `typing "event" leaves one result (${await options.count()})`);
  await shot(page, "11-command-palette");
  await page.keyboard.press("Escape");
  await palette.waitFor({ state: "hidden", timeout: WAIT }).catch(() => undefined);

  const card = page.locator("#c-flashcard");
  await card.scrollIntoViewIfNeeded({ timeout: WAIT });
  await card.getByRole("button", { name: /Showing the question/ }).click({ timeout: WAIT });
  ok(await card.getByRole("group", { name: "How well did you know it?" }).isVisible({ timeout: WAIT }).catch(() => false), "the flashcard flips and shows the four ratings");
  await page.keyboard.press("3");
  ok(await card.getByText("Rated Good").isVisible({ timeout: WAIT }).catch(() => false), "key 3 rates Good");

  const hints = page.locator("#c-hints");
  await hints.scrollIntoViewIfNeeded({ timeout: WAIT });
  const solution = hints.getByRole("button", { name: "Show the solution" }).first();
  ok(await solution.isDisabled(), "the solution starts locked");
  for (let i = 0; i < 3; i++) await hints.getByRole("button", { name: /^Show (a nudge|the idea behind it|part of the code)$/ }).first().click({ timeout: WAIT });
  await hints.getByRole("button", { name: "Run the checks" }).first().click({ timeout: WAIT });
  await hints.getByRole("button", { name: "Run the checks" }).first().click({ timeout: WAIT });
  ok(await solution.isEnabled(), "it opens after three hints and two checks");
}

async function celebration(browser: Browser, storage: string): Promise<void> {
  step("celebration under reduced motion");
  const page = await openDesign(browser, storage, 1440, "light", "reduce");
  try {
    const button = page.locator("#c-overlays").getByRole("button", { name: "Celebrate" }).first();
    await button.scrollIntoViewIfNeeded({ timeout: WAIT });
    await button.click({ timeout: WAIT });
    const status = page.getByText("Lesson done", { exact: true });
    ok(await status.isVisible({ timeout: WAIT }).catch(() => false), "the celebration shows");
    const started = Date.now();
    await status.waitFor({ state: "hidden", timeout: 5000 }).catch(() => undefined);
    const took = Date.now() - started;
    ok(!(await status.isVisible().catch(() => false)) && took <= 2600, `it closes itself within about 2 s (${took} ms)`);
    const canvasPixels = await page.evaluate(() => {
      const c = document.querySelector("canvas");
      return c ? c.width * c.height : 0;
    });
    ok(canvasPixels === 0, "no confetti canvas is left behind with reduced motion");
  } finally {
    await page.context().close();
  }
}

async function oldUiUntouched(browser: Browser, storage: string): Promise<void> {
  step("?ui=old: the old UI, no v5 scope");
  const ctx = await browser.newContext({ storageState: storage, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/admin?ui=old`, { waitUntil: "networkidle", timeout: WAIT });
    const dataUi = await page.evaluate(() => document.documentElement.getAttribute("data-ui"));
    ok(dataUi === null, `the old UI's <html> has no data-ui (${dataUi})`);
    const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    // Rebrand Phase 1: both designs use the brand face, Outfit.
    ok(/Outfit/.test(font), `the old UI uses the brand font Outfit (${font.split(",")[0]})`);
    const v5TokensLoaded = await page.evaluate(() => [...document.styleSheets].some((s) => {
      try {
        // tokens.css's scoped blocks (src/index.css only names the Tailwind aliases that point at them).
        return [...s.cssRules].some((r) => r instanceof CSSStyleRule && r.selectorText.includes("data-ui") && r.style.getPropertyValue("--v5-surface-0") !== "");
      } catch {
        return false;
      }
    }));
    ok(!v5TokensLoaded, "the v5 tokens are not loaded in the old UI");
    await shot(page, "20-old-admin");
  } finally {
    await ctx.close();
  }
}

async function main(): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v5d-"));
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: !HEADED });
  try {
    step("sign in as the superadmin");
    const adminCtx = await browser.newContext();
    await sendJson(adminCtx.request, "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
    await sendJson(adminCtx.request, "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });
    const storage = path.join(dataDir, "storage.json");
    await adminCtx.storageState({ path: storage });
    await adminCtx.close();

    for (const width of [390, 1440]) {
      for (const theme of ["light", "dark"] as const) {
        const label = `${width} ${theme}`;
        step(`/design at ${label}`);
        const page = await openDesign(browser, storage, width, theme);
        try {
          await checkPage(page, label);
          await axe(page, label);
          await shot(page, `0${width === 390 ? 1 : 2}-design-${width}-${theme}`);
          if (width === 1440 && theme === "light") await interactions(page);
        } finally {
          await page.context().close();
        }
      }
    }
    await celebration(browser, storage);
    await oldUiUntouched(browser, storage);
  } finally {
    await browser.close();
    stopServer();
  }

  console.log("");
  console.log(`screenshots: ${SHOTS}`);
  if (notes.length) console.log(`${notes.length} note(s)`);
  if (failures.length) {
    console.log(`\u001b[31m${failures.length} failure(s)\u001b[0m`);
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("\u001b[32mall checks passed\u001b[0m");
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
