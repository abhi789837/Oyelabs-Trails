/**
 * Oyelearn v4.3 Phase 6: counts the clicks to onboard and assign learners through the real UI
 * (docs/v4.3/CLICKS.md). Typing is not counted; every mouse click goes through `click()`, which
 * counts it.
 *
 *   npm run build                         # once; this serves dist/ + dist-server/
 *   npx tsx scripts/e2e/v43-clicks.ts
 *
 * 1. Quick, default department: type name + one line, Suggest, Looks good. Expect 2 clicks.
 * 2. Quick, another department, reviewing the plan first: department, Suggest, Looks good.
 *    Expect 3 clicks.
 * 3. Bulk, 3 people: Several people, Suggest all, Looks good — send the tests, Copy all. Expect 4 clicks
 *    (3 without the password handover).
 * 4. The learner page shows the next action with one primary button.
 *
 * Throwaway DATA_DIR under %TEMP%, port 8797, the deterministic mock AI (NODE_ENV=development).
 * Exits non-zero when an assertion fails, and always stops its server.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Locator, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PORT = Number(process.env.E2E_PORT ?? 8797);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";

const failures: string[] = [];
function ok(cond: unknown, message: string): void {
  console.log(`    ${cond ? "\u001b[32mok\u001b[0m  " : "\u001b[31mFAIL\u001b[0m"} ${message}`);
  if (!cond) failures.push(message);
}

let clicks = 0;
async function click(locator: Locator): Promise<void> {
  clicks += 1;
  await locator.click();
}
function counted<T>(fn: () => Promise<T>): Promise<{ result: T; clicks: number }> {
  const start = clicks;
  return fn().then((result) => ({ result, clicks: clicks - start }));
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

async function poll(what: string, timeoutMs: number, fn: () => Promise<boolean>): Promise<void> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (await fn().catch(() => false)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${what}`);
}

async function startServer(dataDir: string): Promise<void> {
  for (const required of ["dist/index.html", "dist-server/index.js"]) {
    if (!fs.existsSync(path.join(REPO, required))) throw new Error(`${required} is missing. Run \`npm run build\` first.`);
  }
  const log = fs.createWriteStream(path.join(dataDir, "server.log"));
  server = spawn(process.execPath, ["dist-server/index.js"], {
    cwd: REPO,
    env: { ...process.env, NODE_ENV: "development", DATA_DIR: dataDir, PORT: String(PORT), HOST: "127.0.0.1", CLIENT_DIST: path.join(REPO, "dist"), SUPERADMIN_PASSWORD: SUPER_INITIAL, PUBLIC_ORIGIN: BASE },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.pipe(log);
  server.stderr?.pipe(log);
  await poll("/api/health", 60_000, async () => (await fetch(`${BASE}/api/health`)).ok);
}

async function signIn(page: Page): Promise<void> {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel(/username/i).fill("admin");
  await page.getByLabel(/password/i).fill(SUPER_INITIAL);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20_000 });
  if (page.url().includes("/change-password")) {
    await page.getByLabel(/^(temporary|current) password\*?$/i).fill(SUPER_INITIAL);
    await page.getByLabel(/^new password\*?$/i).fill(SUPER_NEW);
    await page.getByLabel(/^confirm new password\*?$/i).fill(SUPER_NEW);
    await page.getByRole("button", { name: /save password/i }).click();
    await page.waitForURL((u) => !u.pathname.startsWith("/change-password"), { timeout: 20_000 });
  }
}

async function main(): Promise<void> {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-clicks-"));
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: process.env.E2E_HEADED !== "1" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  try {
    await signIn(page);
    await page.goto(`${BASE}/admin/onboard`, { waitUntil: "networkidle" });
    await page.getByRole("radiogroup", { name: "Department" }).waitFor({ timeout: 20_000 });

    console.log("  - quick onboarding, default department, no review");
    const one = await counted(async () => {
      await page.getByLabel("Full name").fill("Priya Sharma");
      await page.getByLabel("Describe them in one line").fill("Frontend dev, 2 yrs React, weak on Git, we want him doing backend + AI-driven work");
      // v4.4 P6: Suggest, then the plan card's "Looks good — send the test".
      await click(page.getByRole("button", { name: "Suggest", exact: true }));
      await click(page.getByRole("button", { name: "Looks good — send the test" }));
      await page.getByRole("status").filter({ hasText: "Account created for Priya Sharma" }).waitFor({ timeout: 30_000 });
    });
    ok(one.clicks <= 3, `quick onboarding took ${one.clicks} click(s) after typing (target ≤ 3)`);

    console.log("  - quick onboarding, another department, reviewing the suggestion");
    const two = await counted(async () => {
      await page.getByLabel("Full name").fill("Ravi Kumar");
      await click(page.getByRole("radiogroup", { name: "Department" }).getByRole("radio", { name: "Project Management", exact: true }));
      await page.getByLabel("Describe them in one line").fill("New PM from client services, weak on Excel and client calls");
      await click(page.getByRole("button", { name: "Suggest", exact: true }));
      await page.getByRole("region", { name: /^Here's the plan/ }).waitFor({ timeout: 30_000 });
      await click(page.getByRole("button", { name: "Looks good — send the test" }));
      await page.getByRole("status").filter({ hasText: "Account created for Ravi Kumar" }).waitFor({ timeout: 30_000 });
    });
    ok(two.clicks <= 3, `quick onboarding with department and review took ${two.clicks} click(s) (target ≤ 3)`);

    console.log("  - bulk onboarding, 3 people");
    const bulk = await counted(async () => {
      await click(page.getByRole("radio", { name: "Several people" }));
      await page
        .getByLabel(/One person per line/)
        .fill(
          [
            "Name, Username, Department, Description",
            "Anna Lee, anna.lee, Engineering, Laravel dev, 3 yrs, weak on Docker",
            "Ben Ode, , PM, new PM, never ran a sprint",
            "Cara Moss\t\tBD\tSales lead who should write proposals",
          ].join("\n"),
        );
      await click(page.getByRole("button", { name: "Suggest all" }));
      await page.getByRole("button", { name: /Looks good — send the tests \(3\)/ }).waitFor({ timeout: 60_000 });
      await click(page.getByRole("button", { name: /Looks good — send the tests/ }));
      await page.getByRole("button", { name: /Copy all \(3\)/ }).waitFor({ timeout: 60_000 });
      await click(page.getByRole("button", { name: /Copy all/ }));
    });
    ok(bulk.clicks <= 4, `bulk onboarding of 3 took ${bulk.clicks} clicks including Copy all`);
    const csv = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
    ok(csv.split("\n").length === 4 && csv.includes("ben.ode"), "Copy all put a header and 3 rows of credentials on the clipboard");

    console.log("  - the learner page's next action");
    const users = (await (await page.request.get(`${BASE}/api/admin/users`)).json()) as { users: { id: string; username: string }[] };
    const anna = users.users.find((u) => u.username === "anna.lee");
    ok(anna, "the bulk learner exists");
    if (anna) {
      await page.goto(`${BASE}/admin/people/${anna.id}`, { waitUntil: "networkidle" });
      const bar = page.getByRole("region", { name: "Next action" });
      await bar.waitFor({ timeout: 20_000 });
      const kind = await bar.getAttribute("data-next-action");
      ok(kind && ["writing", "approve", "invite"].includes(kind), `next action after onboarding is "${kind}"`);
      ok((await bar.getByRole("button").count()) <= 1, "at most one primary button");
    }
  } finally {
    await browser.close();
    stopServer();
  }
  console.log(failures.length ? `\n${failures.length} failure(s)` : "\nall checks passed");
  process.exit(failures.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
