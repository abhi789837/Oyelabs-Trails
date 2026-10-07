/**
 * Rebrand Phase 3: the branded sign-in, end to end.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh brand)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/brand-auth.ts
 *   bash scripts/e2e/snapshot-build.sh --remove brand
 *
 * 1. Favicons, app icons, the OG images and the manifest all answer 200 with the right type; the
 *    manifest is valid (name, start_url /learn, scope /, standalone, theme #2067D3, PNG icons of their
 *    stated size); the icons get a cache header and the manifest stays no-cache.
 * 2. /login at desktop (1440) and mobile (390) × light and dark: "Welcome back", the Username and
 *    Password fields by label, the Sign in button, the right logo files for the surface (on-blue or
 *    dark in the panel, light or dark on the form side, endorsed on a phone), the blue panel on
 *    desktop and the slim band on a phone, no horizontal scroll, axe with no serious or critical
 *    violation. A screenshot of each.
 * 3. The first sign-in (temporary password) lands on the same frame: "Set your password", axe clean.
 * Port 8966, throwaway DATA_DIR.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import { chromium, type Browser, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.E2E_PORT ?? 8966);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const WAIT = 20_000;
const SHOTS = path.join(os.tmpdir(), "claude", "e2e-shots-brand-auth");

const failures: string[] = [];
function ok(cond: unknown, message: string): boolean {
  console.log(`    ${cond ? "\u001b[32mok\u001b[0m  " : "\u001b[31mFAIL\u001b[0m"} ${message}`);
  if (!cond) failures.push(message);
  return Boolean(cond);
}
function step(message: string): void {
  console.log(`  - ${message}`);
}

async function poll<T>(what: string, timeoutMs: number, fn: () => Promise<T | null | undefined>): Promise<T> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Timed out waiting for ${what}`);
}

let server: ChildProcess | null = null;
function stopServer(): void {
  if (!server || server.exitCode !== null) return;
  const pid = server.pid;
  try {
    server.kill();
  } catch {
    // ignore
  }
  if (process.platform === "win32" && pid) spawn("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
}
process.on("exit", stopServer);

async function startServer(dataDir: string): Promise<void> {
  for (const required of ["dist/index.html", "dist-server/index.js"]) {
    if (!fs.existsSync(path.join(APP, required))) throw new Error(`${required} is missing in ${APP}. Build a snapshot first (see the top of this file).`);
  }
  const log = fs.createWriteStream(path.join(dataDir, "server.log"));
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
      PUBLIC_ORIGIN: BASE,
      YOUTUBE_API_KEY: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.pipe(log);
  server.stderr?.pipe(log);
  await poll("/api/health", 60_000, async () => {
    if (server?.exitCode !== null) throw new Error(`server exited early (${server?.exitCode})`);
    const res = await fetch(`${BASE}/api/health`).catch(() => null);
    return res?.ok ? true : null;
  });
}

// ---------------------------------------------------------------------------
// 1. Icons and manifest
// ---------------------------------------------------------------------------

function pngSize(buf: Buffer): string | null {
  if (buf.subarray(1, 4).toString() !== "PNG") return null;
  return `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`;
}

async function assetChecks(): Promise<void> {
  step("1. favicons, icons, OG images and the manifest");
  const html = await (await fetch(`${BASE}/login`)).text();
  const linked = [...html.matchAll(/<link rel="(?:icon|apple-touch-icon|manifest)" href="([^"]+)"/g)].map((m) => m[1]);
  ok(linked.length >= 6, `index.html links the favicons, apple-touch icon and manifest (${linked.join(", ")})`);
  ok(/<meta name="theme-color" content="#2067D3" media="\(prefers-color-scheme: light\)"/.test(html), "theme-color #2067D3 for light");
  ok(/<meta name="theme-color" content="#0A1428" media="\(prefers-color-scheme: dark\)"/.test(html), "theme-color #0A1428 for dark");
  ok(/<meta property="og:image" content="https:\/\/[^"]+\/og-image\.png/.test(html) && /twitter:card" content="summary_large_image"/.test(html), "Open Graph and Twitter tags point at the OG image");

  const expected: [string, RegExp, string?][] = [
    ["/favicon.ico", /image\/(x-icon|vnd\.microsoft\.icon)/],
    ["/favicon.svg", /image\/svg\+xml/],
    ["/favicon-16x16.png", /image\/png/, "16x16"],
    ["/favicon-32x32.png", /image\/png/, "32x32"],
    ["/favicon-48x48.png", /image\/png/, "48x48"],
    ["/apple-touch-icon.png", /image\/png/, "180x180"],
    ["/icon-192.png", /image\/png/, "192x192"],
    ["/icon-512.png", /image\/png/, "512x512"],
    ["/icon-maskable-512.png", /image\/png/, "512x512"],
    ["/og-image.png", /image\/png/, "1200x630"],
    ["/og-image-dark.png", /image\/png/, "1200x630"],
    ["/brand/loader.svg", /image\/svg\+xml/],
    ["/brand/logo/oyelearn-light.svg", /image\/svg\+xml/],
    ["/brand/logo/oyelearn-on-blue.svg", /image\/svg\+xml/],
  ];
  for (const href of linked) if (!expected.some(([p]) => href.split("?")[0] === p) && !href.startsWith("/site.webmanifest")) expected.push([href.split("?")[0], /./]);
  for (const [url, type, size] of expected) {
    const res = await fetch(`${BASE}${url}?v=2`);
    const buf = Buffer.from(await res.arrayBuffer());
    const got = pngSize(buf);
    ok(res.status === 200 && type.test(res.headers.get("content-type") ?? "") && (!size || got === size), `${url}: ${res.status} ${res.headers.get("content-type")}${size ? ` ${got}` : ""}`);
    if (url === "/favicon.svg") {
      ok(/max-age=86400/.test(res.headers.get("cache-control") ?? ""), `icons are cached for a day (${res.headers.get("cache-control")})`);
      ok(buf.toString().includes("prefers-color-scheme:dark"), "favicon.svg switches for dark mode");
    }
  }

  const res = await fetch(`${BASE}/site.webmanifest`);
  ok(res.status === 200 && /manifest\+json|application\/json/.test(res.headers.get("content-type") ?? ""), `the manifest is served (${res.status} ${res.headers.get("content-type")})`);
  ok((res.headers.get("cache-control") ?? "").includes("no-cache"), "the manifest is revalidated");
  let m: { name?: string; short_name?: string; start_url?: string; scope?: string; display?: string; theme_color?: string; background_color?: string; icons?: { src: string; sizes: string; type: string; purpose?: string }[] } = {};
  try {
    m = (await res.json()) as typeof m;
    ok(true, "the manifest is valid JSON");
  } catch {
    ok(false, "the manifest is valid JSON");
  }
  ok(m.name === "Oyelearn" && m.short_name === "Oyelearn", "name and short_name are Oyelearn");
  ok(m.start_url === "/learn" && m.scope === "/" && m.display === "standalone", "start_url /learn, scope /, standalone (the v5 PWA settings)");
  ok(m.theme_color?.toUpperCase() === "#2067D3" && m.background_color?.toUpperCase() === "#FFFFFF", "theme #2067D3, background #FFFFFF");
  ok(Boolean(m.icons?.some((i) => i.purpose?.includes("maskable"))), "a maskable icon");
  for (const icon of m.icons ?? []) {
    const r = await fetch(`${BASE}${icon.src}`);
    const got = pngSize(Buffer.from(await r.arrayBuffer()));
    ok(r.status === 200 && got === icon.sizes, `manifest icon ${icon.src}: ${r.status} ${got}`);
  }
}

// ---------------------------------------------------------------------------
// 2. The sign-in page
// ---------------------------------------------------------------------------

async function openLogin(browser: Browser, width: number, theme: "light" | "dark"): Promise<Page> {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, colorScheme: theme });
  await ctx.addInitScript((t) => {
    try {
      window.localStorage.setItem("oyelabs-ui", JSON.stringify({ state: { theme: t, sidebarCollapsed: false }, version: 0 }));
    } catch {
      // ignore
    }
  }, theme);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`      [pageerror] ${e.message}`));
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: WAIT });
  await page.getByRole("heading", { level: 1, name: "Welcome back" }).waitFor({ timeout: WAIT });
  return page;
}

async function axe(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  for (const v of bad) console.log(`      ${v.impact} ${v.id}: ${v.help} :: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
  ok(bad.length === 0, `${label}: axe finds no serious or critical violations (${results.violations.length} total)`);
}

/** The `src` of every logo image the person can see. */
async function visibleLogos(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLImageElement>('[data-brand="logo"] img')]
      .filter((img) => img.getBoundingClientRect().width > 0 && getComputedStyle(img).visibility !== "hidden")
      .map((img) => new URL(img.src).pathname),
  );
}

async function signInPage(browser: Browser, width: number, theme: "light" | "dark"): Promise<void> {
  const label = `${width} ${theme}`;
  step(`2. /login at ${label}`);
  const page = await openLogin(browser, width, theme);
  try {
    ok(await page.evaluate((t) => document.documentElement.classList.contains("dark") === (t === "dark"), theme), `${label}: the page is in ${theme} mode`);
    ok(await page.getByLabel(/username/i).isVisible(), `${label}: the Username field, by its label`);
    ok(await page.getByLabel(/password/i).isVisible(), `${label}: exactly one Password field, by its label`);
    ok(await page.getByRole("button", { name: /sign in/i }).isVisible(), `${label}: the Sign in button`);
    ok(await page.getByText("Sign in to continue your plan.").isVisible(), `${label}: "Sign in to continue your plan."`);
    const font = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily);
    ok(/Outfit/.test(font), `${label}: the heading is set in Outfit`);

    const logos = await visibleLogos(page);
    const desktop = width >= 1024;
    if (desktop) {
      ok(await page.getByTestId("auth-brand-panel").isVisible(), `${label}: the brand panel`);
      ok(await page.getByText("Learning never closes.").isVisible(), `${label}: "Learning never closes."`);
      ok(await page.getByText("Your plan, your pace — built for the Oyelabs team.").isVisible(), `${label}: the panel's second line`);
      const panel = theme === "dark" ? "/brand/logo/oyelearn-dark.svg" : "/brand/logo/oyelearn-on-blue.svg";
      const form = `/brand/logo/oyelearn-${theme}.svg`;
      ok(logos.includes(panel) && logos.includes(form) && logos.length === 2, `${label}: logos ${panel} and ${form} (${logos.join(", ")})`);
      const panelWidth = await page.getByTestId("auth-brand-panel").evaluate((el) => el.getBoundingClientRect().width / window.innerWidth);
      ok(panelWidth > 0.4 && panelWidth < 0.5, `${label}: the panel is about 45% wide (${Math.round(panelWidth * 100)}%)`);
      const bg = await page.getByTestId("auth-brand-panel").evaluate((el) => getComputedStyle(el).backgroundColor);
      ok(bg === (theme === "dark" ? "rgb(10, 20, 40)" : "rgb(32, 103, 211)"), `${label}: the panel is ${theme === "dark" ? "Night" : "Oyelabs Blue"} (${bg})`);
    } else {
      ok(await page.getByTestId("auth-brand-band").isVisible(), `${label}: the slim blue band`);
      ok(!(await page.getByTestId("auth-brand-panel").isVisible()), `${label}: no side panel on a phone`);
      ok(logos.length === 1 && logos[0] === `/brand/logo/oyelearn-by-oyelabs-${theme}.svg`, `${label}: the endorsed ${theme} logo (${logos.join(", ")})`);
    }
    ok(!logos.some((l) => /horizontal|stacked|-mode\.svg/.test(l)), `${label}: no old logo`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(overflow <= 1, `${label}: no horizontal scroll (${overflow}px)`);
    await axe(page, label);
    await page.screenshot({ path: path.join(SHOTS, `login-${width}-${theme}.png`), fullPage: true });
  } finally {
    await page.context().close();
  }
}

// ---------------------------------------------------------------------------
// 3. First sign-in: set a password, same frame
// ---------------------------------------------------------------------------

async function firstPassword(browser: Browser): Promise<void> {
  step("3. the first sign-in lands on the same branded frame");
  const page = await openLogin(browser, 1440, "light");
  try {
    await page.getByLabel(/username/i).fill("admin");
    await page.getByLabel(/password/i).fill(SUPER_INITIAL);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL((u) => u.pathname === "/change-password", { timeout: WAIT });
    await page.getByRole("heading", { level: 1, name: "Set your password" }).waitFor({ timeout: WAIT });
    ok(await page.getByTestId("auth-brand-panel").isVisible(), "the brand panel is there too");
    ok(await page.getByLabel(/^(temporary|current) password\*?$/i).isVisible(), "the temporary password field, by its label");
    ok(await page.getByLabel(/^new password\*?$/i).isVisible() && (await page.getByLabel(/^confirm new password\*?$/i).isVisible()), "the new and confirm fields, by their labels");
    ok(await page.getByRole("button", { name: /save password/i }).isVisible(), "the Save password button");
    ok((await page.title()) === "Set your password · Oyelearn", `the title follows "<Page> · Oyelearn" (${await page.title()})`);
    await axe(page, "change-password 1440 light");
    await page.screenshot({ path: path.join(SHOTS, "change-password-1440-light.png"), fullPage: true });
  } finally {
    await page.context().close();
  }
}

async function main(): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-brand-"));
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: process.env.E2E_HEADED !== "1" });
  try {
    await assetChecks();
    for (const width of [1440, 390]) for (const theme of ["light", "dark"] as const) await signInPage(browser, width, theme);
    await firstPassword(browser);
  } finally {
    await browser.close();
    stopServer();
  }
  console.log(`\nscreenshots: ${SHOTS}`);
  if (failures.length) {
    console.log(`\u001b[31m${failures.length} failure(s)\u001b[0m`);
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("\u001b[32mall brand-auth checks passed\u001b[0m");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
