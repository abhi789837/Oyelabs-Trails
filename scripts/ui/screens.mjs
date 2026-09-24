#!/usr/bin/env node
/**
 * Screenshots every route, as both roles, in both themes, at desktop and phone width.
 *
 *   node scripts/ui/screens.mjs before     → docs/ui-audit/before/
 *   node scripts/ui/screens.mjs after      → docs/ui-audit/after/
 *
 * This exists for one job: proving the UI overhaul did not regress the screens that were already
 * good. The trail visuals and the topic page are the ones to watch — they should look equivalent
 * before and after, while everything else changes.
 *
 * It needs the dev server running (`npm run dev`) and the sample learners seeded
 * (`npm run dev:seed`). Both admin and learner passwords come from the environment, because the
 * seeder prints them once and they are not stored anywhere:
 *
 *   UI_ADMIN_PASSWORD=... UI_LEARNER_USERNAME=... UI_LEARNER_PASSWORD=... node scripts/ui/screens.mjs before
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const phase = process.argv[2];
if (phase !== "before" && phase !== "after") {
  console.error("usage: node scripts/ui/screens.mjs <before|after>");
  process.exit(1);
}

const BASE = process.env.UI_BASE_URL ?? "http://localhost:5173";
const OUT = path.join("docs", "ui-audit", phase);

const ADMIN = { username: process.env.UI_ADMIN_USERNAME ?? "admin", password: process.env.UI_ADMIN_PASSWORD };
const LEARNER = { username: process.env.UI_LEARNER_USERNAME, password: process.env.UI_LEARNER_PASSWORD };

/** Desktop first: it is where most of the work shows. 375 catches the layouts that break. */
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 1000 },
  { name: "375", width: 375, height: 812 },
];

const ADMIN_ROUTES = [
  ["admin-overview", "/admin"],
  ["admin-people", "/admin/people"],
  ["admin-onboard", "/admin/onboard"],
  ["admin-live", "/admin/live"],
  ["admin-ai", "/admin/ai"],
  ["admin-audit", "/admin/audit"],
];

/** The two that must not regress, plus the learner chrome around them. */
const LEARNER_ROUTES = [
  ["dashboard", "/"],
  ["plan", "/plan"],
];

const ok = (s) => `\u001b[32m${s}\u001b[0m`;
const bad = (s) => `\u001b[31m${s}\u001b[0m`;

async function signIn(page, who) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel(/username/i).fill(who.username);
  await page.getByLabel(/password/i).fill(who.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15_000 });
  if (page.url().includes("/change-password")) {
    throw new Error(`${who.username} must change its password first — do that once by hand, then re-run.`);
  }
}

/** The theme lives in localStorage under the key index.html reads before first paint. */
async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem("oyelabs-ui", JSON.stringify({ state: { theme: t }, version: 0 }));
    document.documentElement.classList.toggle("dark", t === "dark");
  }, theme);
}

/** Discovers the routes that need an id, so the audit covers real records rather than guesses. */
async function discoverIds(page) {
  const ids = { trackId: null, moduleId: null, topicId: null, userId: null };
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const trackHref = await page.locator('a[href^="/track/"]').first().getAttribute("href").catch(() => null);
  if (trackHref) {
    const parts = trackHref.split("/").filter(Boolean);
    ids.trackId = parts[1] ?? null;
    await page.goto(`${BASE}${trackHref}`, { waitUntil: "networkidle" });
    const moduleHref = await page.locator('a[href*="/module/"]').first().getAttribute("href").catch(() => null);
    if (moduleHref) {
      ids.moduleId = moduleHref.split("/module/")[1]?.split("/")[0] ?? null;
      await page.goto(`${BASE}${moduleHref}`, { waitUntil: "networkidle" });
      const topicHref = await page.locator('a[href*="/topic/"]').first().getAttribute("href").catch(() => null);
      if (topicHref) ids.topicId = topicHref.split("/topic/")[1]?.split("/")[0] ?? null;
    }
  }
  return ids;
}

async function shoot(page, dir, name, route) {
  try {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 20_000 });
    // Let one-shot entrance motion settle, or the shot catches a half-faded page.
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
    console.log(`  ${ok("✓")} ${name}`);
    return true;
  } catch (err) {
    console.log(`  ${bad("✗")} ${name} — ${err.message.split("\n")[0]}`);
    return false;
  }
}

async function run() {
  if (!ADMIN.password) throw new Error("UI_ADMIN_PASSWORD is not set.");

  const browser = await chromium.launch();
  let shots = 0;
  let failures = 0;

  for (const viewport of VIEWPORTS) {
    for (const theme of ["light", "dark"]) {
      const dir = path.join(OUT, `${viewport.name}-${theme}`);
      fs.mkdirSync(dir, { recursive: true });
      console.log(`\n${viewport.name}px ${theme}`);

      // --- admin ---
      const adminCtx = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const adminPage = await adminCtx.newPage();
      await signIn(adminPage, ADMIN);
      await setTheme(adminPage, theme);

      for (const [name, route] of ADMIN_ROUTES) {
        (await shoot(adminPage, dir, name, route)) ? shots++ : failures++;
      }

      // A real learner row, so the detail page and its tabs are exercised.
      await adminPage.goto(`${BASE}/admin/people`, { waitUntil: "networkidle" });
      const personHref = await adminPage.locator('a[href^="/admin/people/"]').first().getAttribute("href").catch(() => null);
      if (personHref) {
        for (const tab of ["profile", "assessment", "integrity", "evaluation", "plan", "progress", "account"]) {
          (await shoot(adminPage, dir, `admin-learner-${tab}`, `${personHref}?tab=${tab}`)) ? shots++ : failures++;
        }
      }
      await adminCtx.close();

      // --- learner ---
      if (LEARNER.username && LEARNER.password) {
        const ctx = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
        const page = await ctx.newPage();
        await signIn(page, LEARNER);
        await setTheme(page, theme);

        for (const [name, route] of LEARNER_ROUTES) {
          (await shoot(page, dir, name, route)) ? shots++ : failures++;
        }

        // The screens that must look the same afterwards.
        const ids = await discoverIds(page);
        if (ids.trackId) (await shoot(page, dir, "track", `/track/${ids.trackId}`)) ? shots++ : failures++;
        if (ids.moduleId) (await shoot(page, dir, "module", `/track/${ids.trackId}/module/${ids.moduleId}`)) ? shots++ : failures++;
        if (ids.topicId)
          (await shoot(page, dir, "topic", `/track/${ids.trackId}/module/${ids.moduleId}/topic/${ids.topicId}`)) ? shots++ : failures++;
        if (ids.trackId) (await shoot(page, dir, "certificate", `/report/${ids.trackId}`)) ? shots++ : failures++;
        await ctx.close();
      } else {
        console.log("  (skipping learner routes — UI_LEARNER_USERNAME / UI_LEARNER_PASSWORD not set)");
      }

      // Auth screens need no session.
      const anonCtx = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const anon = await anonCtx.newPage();
      await anon.goto(`${BASE}/login`, { waitUntil: "networkidle" });
      await setTheme(anon, theme);
      (await shoot(anon, dir, "login", "/login")) ? shots++ : failures++;
      await anonCtx.close();
    }
  }

  await browser.close();
  console.log(`\n${shots} screenshot(s) into ${OUT}${failures ? `, ${bad(`${failures} failed`)}` : ""}`);
  if (failures) process.exitCode = 1;
}

run().catch((err) => {
  console.error(bad(err.message));
  process.exit(1);
});
