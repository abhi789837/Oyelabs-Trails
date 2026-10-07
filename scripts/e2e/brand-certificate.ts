/**
 * Rebrand Phase 5: certificates, end to end.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh brand5)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/brand-certificate.ts
 *   bash scripts/e2e/snapshot-build.sh --remove brand5
 *
 * 1. Seed: superadmin, a v5 learner, and a short published course (one section, two lessons).
 * 2. The learner finishes the course (ticks both lessons): the server issues a course certificate
 *    with an 80-bit code (OYL-XXXX-XXXX-XXXX-XXXX) and the verify link on PUBLIC_ORIGIN.
 * 3. /learn/certificate/:id: the heading, the server's picture (3508 px wide), "Download PDF"
 *    (a vector A4 landscape PDF with Outfit embedded), "Download image" (3508 × 2480 PNG),
 *    "Copy verify link" (the clipboard holds the verify URL), "Add to LinkedIn" (name
 *    "Oyelearn – <Course>", Oyelabs, the credential URL); axe at 390 and 1440, light and dark.
 * 4. Me → Certificates lists it with its downloads.
 * 5. Logged out: /verify/:id says "This certificate is valid", the name, the course, the date and
 *    the preview picture (1754 px); the public PNG answers 200; axe in both themes and widths.
 * 6. Admin → Reports → Certificates: the signature setting, then Revoke from the list. Logged out,
 *    /verify/:id says "This certificate was revoked" with no name or picture, the public PNG is
 *    410, the learner's downloads stop; an unknown code says "Certificate not found".
 * Screenshots: %TEMP%/claude/e2e-shots-brand-certificate. Port 8967, throwaway DATA_DIR.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import { chromium, type APIRequestContext, type Browser, type BrowserContext, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.E2E_PORT ?? 8967);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Summit-Ring-4417-Qx!";
const LEARNER = "learner.cert";
const LEARNER_NEW = "Waypoint-Lantern-8824-Zk!";
const HOLDER = "Asha Learner";
const COURSE = "Shipping a release safely";
const WAIT = 20_000;
const SHOTS = path.join(os.tmpdir(), "claude", "e2e-shots-brand-certificate");

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

async function poll<T>(what: string, timeoutMs: number, fn: () => Promise<T | null | undefined>, everyMs = 300): Promise<T> {
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

async function call<T>(request: APIRequestContext, method: "get" | "post" | "put", url: string, data?: unknown): Promise<T> {
  const response = await request[method](`${BASE}${url}`, { ...(data === undefined ? {} : { data }), timeout: WAIT });
  if (!response.ok()) throw new Error(`${method.toUpperCase()} ${url} -> ${response.status()} ${await response.text()}`);
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
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
  if (process.platform === "win32" && pid) spawn("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
}
process.on("exit", stopServer);

async function startServer(dataDir: string): Promise<void> {
  for (const required of ["dist/index.html", "dist-server/index.js", "dist-server/assets/certificates/certificate-template-a4.svg"]) {
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
// Page helpers
// ---------------------------------------------------------------------------

async function themed(ctx: BrowserContext, theme: "light" | "dark"): Promise<void> {
  await ctx.addInitScript((t) => {
    try {
      window.localStorage.setItem("oyelabs-ui", JSON.stringify({ state: { theme: t, sidebarCollapsed: false }, version: 0 }));
    } catch {
      // ignore
    }
  }, theme);
}

async function axe(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  for (const v of bad) {
    console.log(`      ${v.impact} ${v.id}: ${v.help} (${v.nodes.length})`);
    for (const n of v.nodes.slice(0, 4)) console.log(`        ${n.target.join(" ")} :: ${n.failureSummary?.split("\n").slice(0, 2).join(" ")}`);
  }
  ok(bad.length === 0, `${label}: axe finds no serious or critical violations (${results.violations.length} total)`);
}

async function noSideways(page: Page, label: string): Promise<void> {
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(scroll <= 1, `${label}: no sideways scroll (${scroll}px)`);
}

async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true, animations: "disabled", timeout: WAIT }).catch((e: Error) => note(`screenshot ${name} failed: ${e.message.split("\n")[0]}`));
}

/** The width an <img> loaded at, once it has (0 if it failed). */
async function loadedWidth(page: Page, name: RegExp): Promise<number> {
  const img = page.getByRole("img", { name });
  await img.waitFor({ timeout: WAIT });
  return poll(
    "the picture to load",
    40_000,
    async () => (await img.evaluate((el: HTMLImageElement) => (el.complete && el.naturalWidth ? el.naturalWidth : 0))) || null,
    250,
  ).catch(() => 0);
}

function pngSize(buf: Buffer): [number, number] | null {
  if (buf.subarray(1, 4).toString() !== "PNG") return null;
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

// ---------------------------------------------------------------------------
// 1-2. Seed and finish a course
// ---------------------------------------------------------------------------

interface Seeded {
  admin: APIRequestContext;
  adminCtx: BrowserContext;
  adminStorage: string;
  learnerStorage: string;
  userId: string;
  courseId: string;
}

async function seed(browser: Browser, dataDir: string): Promise<Seeded> {
  step("1. seed: superadmin, a v5 learner, a short published course");
  const adminCtx = await browser.newContext();
  const admin = adminCtx.request;
  await call(admin, "post", "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
  await call(admin, "post", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });
  await call(admin, "put", "/api/me/ui", { v5: true }).catch(() => undefined);
  const adminStorage = path.join(dataDir, "admin.json");
  await adminCtx.storageState({ path: adminStorage });

  const created = await call<{ user: { id: string }; temporaryPassword: string }>(admin, "post", "/api/admin/users", {
    username: LEARNER,
    displayName: HOLDER,
    profile: { roleTitle: "Frontend Engineer", yearsExperience: 1, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
    issueAssessment: false,
  });
  const userId = created.user.id;
  await call(admin, "put", `/api/admin/users/${userId}/setup`, { departmentId: "engineering", priorities: [{ skillId: "eng-javascript", slider: 4 }] }).catch((e: Error) => note(`setup: ${e.message.slice(0, 120)}`));

  const learnerCtx = await browser.newContext();
  await call(learnerCtx.request, "post", "/api/auth/login", { username: LEARNER, password: created.temporaryPassword });
  await call(learnerCtx.request, "post", "/api/auth/change-password", { currentPassword: created.temporaryPassword, newPassword: LEARNER_NEW });
  await call(learnerCtx.request, "put", "/api/me/ui", { v5: true });
  const learnerStorage = path.join(dataDir, "learner.json");
  await learnerCtx.storageState({ path: learnerStorage });
  await learnerCtx.close();

  type CourseShape = { course: { id: string; sections: { id: string; topics: { id: string }[] }[] } };
  const course = await call<CourseShape>(admin, "post", "/api/admin/courses", { title: COURSE, summary: "Three habits for a calm release.", audience: "everyone", published: false });
  const courseId = course.course.id;
  const withSection = await call<CourseShape>(admin, "post", `/api/admin/courses/${courseId}/sections`, { title: "Before you ship" });
  const sectionId = withSection.course.sections[0]!.id;
  await call(admin, "post", `/api/admin/courses/sections/${sectionId}/topics`, { title: "Write the release note first", body: "Say what changes and who it affects.", estMinutes: 5 });
  await call(admin, "post", `/api/admin/courses/sections/${sectionId}/topics`, { title: "Roll back in one step", body: "Know the way back before you go.", estMinutes: 5 });
  await call(admin, "put", `/api/admin/courses/${courseId}`, { title: COURSE, summary: "Three habits for a calm release.", audience: "everyone", published: true });
  await call(admin, "put", `/api/admin/courses/${courseId}/assignees`, { userIds: [userId] }).catch((e: Error) => note(`assign: ${e.message.slice(0, 120)}`));
  return { admin, adminCtx, adminStorage, learnerStorage, userId, courseId };
}

interface Cert {
  id: string;
  kind: string;
  refId: string;
  title: string;
  holderName: string;
  verifyPath: string;
  verifyUrl: string;
}

async function finishCourse(browser: Browser, s: Seeded): Promise<Cert> {
  step("2. the learner finishes the course; the server issues the certificate");
  const ctx = await browser.newContext({ storageState: s.learnerStorage });
  try {
    const { course } = await call<{ course: { sections: { topics: { id: string }[] }[] } }>(ctx.request, "get", `/api/me/courses/${s.courseId}`);
    const topics = course.sections.flatMap((x) => x.topics.map((t) => t.id));
    ok(topics.length === 2, `the course has two lessons (${topics.length})`);
    for (const id of topics) await call(ctx.request, "post", `/api/me/courses/topics/${id}/complete`, { done: true });
    const mine = await call<{ certificates: Cert[]; newlyIssued: string[] }>(ctx.request, "get", "/api/v5/certificates");
    const cert = mine.certificates.find((c) => c.kind === "course" && c.refId === s.courseId);
    ok(cert && mine.newlyIssued.includes(cert.id), `a course certificate is issued (${cert?.id ?? "none"})`);
    if (!cert) throw new Error("no certificate");
    ok(/^OYL-[0-9A-Z]{4}(-[0-9A-Z]{4}){3}$/.test(cert.id), "its code is the 80-bit OYL-XXXX-XXXX-XXXX-XXXX");
    ok(cert.verifyUrl === `${BASE}/verify/${cert.id}`, `the verify link is on the configured origin (${cert.verifyUrl})`);
    const again = await call<{ newlyIssued: string[] }>(ctx.request, "get", "/api/v5/certificates");
    ok(again.newlyIssued.length === 0, "issuing is idempotent");
    return cert;
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// 3-4. The learner's certificate
// ---------------------------------------------------------------------------

async function learnerPage(browser: Browser, s: Seeded, cert: Cert, dataDir: string): Promise<void> {
  step("3. /learn/certificate/:id: picture, PDF, image, verify link, LinkedIn");
  const ctx = await browser.newContext({ storageState: s.learnerStorage, viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
  const page = await ctx.newPage();
  page.on("pageerror", (error) => note(`[pageerror] ${error.message}`));
  try {
    await page.goto(`${BASE}/learn/certificate/${cert.id}`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await page.getByRole("heading", { level: 1, name: COURSE }).waitFor({ timeout: WAIT });
    const width = await loadedWidth(page, /Certificate of completion: Asha Learner has completed Shipping a release safely/);
    ok(width === 3508, `the picture is the server's 2× PNG (${width} px)`);
    ok(await page.locator('[data-brand="seal-moment"]').isVisible(), "the ring seal shows next to the heading");
    await page.waitForTimeout(2300);
    await shot(page, "01-certificate-1440");

    const pdfDl = page.waitForEvent("download", { timeout: 60_000 });
    await page.getByRole("link", { name: "Download PDF" }).click();
    const pdf = await pdfDl;
    const pdfPath = path.join(dataDir, pdf.suggestedFilename());
    await pdf.saveAs(pdfPath);
    const raw = fs.readFileSync(pdfPath).toString("latin1");
    ok(raw.startsWith("%PDF-"), `the PDF downloads (${pdf.suggestedFilename()}, ${raw.length} bytes)`);
    ok(pdf.suggestedFilename() === `oyelearn-certificate-${cert.id}.pdf`, "with a readable file name");
    ok(raw.match(/\/MediaBox \[[^\]]*\]/)?.[0] === "/MediaBox [0 0 842 595]", "A4 landscape");
    ok(/\/BaseFont \/[A-Z]{6}\+Outfit-SemiBold/.test(raw) && raw.includes("/FontFile2") && !raw.includes("/Type3"), "Outfit is embedded as a font (vector text, not pictures of text)");
    ok(raw.includes(`/URI (${cert.verifyUrl})`), "the verify line is a link to the verify page");
    fs.copyFileSync(pdfPath, path.join(SHOTS, "02-certificate.pdf"));

    const pngDl = page.waitForEvent("download", { timeout: 60_000 });
    await page.getByRole("link", { name: "Download image" }).click();
    const png = await pngDl;
    const pngPath = path.join(dataDir, png.suggestedFilename());
    await png.saveAs(pngPath);
    const size = pngSize(fs.readFileSync(pngPath));
    ok(size?.[0] === 3508 && size?.[1] === 2480, `the image is 3508 × 2480 (${size?.join(" × ") ?? "not a PNG"})`);
    fs.copyFileSync(pngPath, path.join(SHOTS, "03-certificate@2x.png"));

    await page.getByRole("button", { name: "Copy verify link" }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
    ok(copied === cert.verifyUrl, `"Copy verify link" copies ${copied || "(nothing)"}`);

    const href = await page.getByRole("link", { name: /Add to LinkedIn/ }).getAttribute("href");
    const li = href ? new URL(href) : null;
    ok(li?.hostname === "www.linkedin.com", "LinkedIn opens its add-certification form");
    ok(li?.searchParams.get("name") === `Oyelearn – ${COURSE}`, `named "${li?.searchParams.get("name")}"`);
    ok(li?.searchParams.get("organizationName") === "Oyelabs", "from Oyelabs");
    ok(li?.searchParams.get("certUrl") === cert.verifyUrl && Boolean(li?.searchParams.get("issueYear")) && Boolean(li?.searchParams.get("issueMonth")), "with the issue date and the credential URL");

    for (const w of [390, 1440]) {
      for (const theme of ["light", "dark"] as const) {
        await page.setViewportSize({ width: w, height: w < 768 ? 844 : 900 });
        await page.evaluate((t) => document.documentElement.classList.toggle("dark", t === "dark"), theme);
        await page.waitForTimeout(250);
        await noSideways(page, `certificate ${w} ${theme}`);
        await axe(page, `certificate ${w} ${theme}`);
        await shot(page, `04-certificate-${w}-${theme}`);
      }
    }

    step("4. Me → Certificates");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/learn/me`, { waitUntil: "domcontentloaded", timeout: WAIT });
    const row = page.getByRole("link", { name: COURSE });
    await row.first().waitFor({ timeout: WAIT }).catch(() => undefined);
    ok(await row.first().isVisible().catch(() => false), "Me lists the certificate");
    const meLinks = await page.locator(`a[href*="/api/v5/certificates/${cert.id}/file."]`).count();
    ok(meLinks >= 2, `with its PDF and image downloads (${meLinks} links)`);
    await shot(page, "05-me-certificates");
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// 5-6. Verify, revoke, verify again
// ---------------------------------------------------------------------------

async function verifyValid(browser: Browser, cert: Cert): Promise<void> {
  step("5. /verify/:id logged out: valid, the name, the course, the date and the picture");
  const res = await fetch(`${BASE}/api/v5/certificates/${cert.id}/preview.png`);
  ok(res.status === 200 && res.headers.get("content-type") === "image/png", `the public PNG answers ${res.status}`);
  for (const width of [1440, 390]) {
    for (const theme of ["light", "dark"] as const) {
      const anon = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, colorScheme: theme });
      await themed(anon, theme);
      const p = await anon.newPage();
      try {
        await p.goto(`${BASE}/verify/${cert.id}`, { waitUntil: "domcontentloaded", timeout: WAIT });
        await p.getByRole("heading", { name: "This certificate is valid" }).waitFor({ timeout: WAIT });
        if (width === 1440 && theme === "light") {
          ok(p.url().includes(`/verify/${cert.id}`), "the page opens without signing in");
          ok(await p.locator('[data-brand="logo"]').first().isVisible(), "it shows the Oyelearn logo");
          ok(await p.getByText(HOLDER, { exact: true }).isVisible(), "the holder's name");
          ok(await p.getByText(COURSE, { exact: true }).isVisible(), "the course");
          ok((await p.locator("dd").allInnerTexts()).some((t) => /\d{1,2} \w+ 20\d\d/.test(t)), "the date");
          const w = await loadedWidth(p, /The certificate: Asha Learner/);
          ok(w === 1754, `the preview picture (${w} px)`);
        }
        await noSideways(p, `verify ${width} ${theme}`);
        await axe(p, `verify ${width} ${theme}`);
        await shot(p, `06-verify-${width}-${theme}`);
      } finally {
        await anon.close();
      }
    }
  }
}

async function adminRevoke(browser: Browser, s: Seeded, cert: Cert): Promise<void> {
  step("6. Admin → Reports → Certificates: signature setting, then revoke");
  const ctx = await browser.newContext({ storageState: s.adminStorage, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (error) => note(`[pageerror admin] ${error.message}`));
  try {
    await page.goto(`${BASE}/admin/reports#certificates`, { waitUntil: "domcontentloaded", timeout: WAIT });
    const section = page.locator("#certificates");
    await section.getByText(cert.id).waitFor({ timeout: WAIT });
    ok(true, "the certificate is listed in Reports → Certificates");
    ok(await section.getByText('"Oyelabs" over "Issued by"', { exact: false }).isVisible(), "the signature setting explains the neutral placeholder");
    await section.getByLabel("Name").fill("E2E Signatory");
    await section.getByLabel("Job title").fill("Test Lead");
    await section.getByRole("button", { name: "Save signature" }).click();
    const saved = await poll("signature saved", WAIT, async () => (await call<{ signature: { name: string } | null }>(s.admin, "get", "/api/admin/v5/certificates/signature")).signature);
    ok(saved.name === "E2E Signatory", "the signature saves");
    const adminPdf = await s.admin.get(`${BASE}/api/admin/v5/certificates/${cert.id}/file.pdf`);
    ok(adminPdf.status() === 200 && (await adminPdf.body()).subarray(0, 5).toString() === "%PDF-", "an admin can open the PDF");
    const report = await s.admin.get(`${BASE}/api/admin/v5/certificates/report.pdf`);
    ok(report.status() === 200 && (await report.body()).subarray(0, 5).toString() === "%PDF-", "the certificates list downloads as a branded PDF");
    // Back to the placeholder, so nothing invented is left behind.
    await call(s.admin, "put", "/api/admin/v5/certificates/signature", { name: "", title: "" });
    await shot(page, "07-admin-certificates");

    await page.reload({ waitUntil: "domcontentloaded" });
    await section.getByText(cert.id).waitFor({ timeout: WAIT });
    await section.getByRole("button", { name: new RegExp(`^Revoke ${HOLDER}`) }).click();
    await section.getByRole("button", { name: new RegExp(`^Yes, revoke`) }).click();
    await section.getByText("Revoked", { exact: true }).first().waitFor({ timeout: WAIT });
    ok(true, "Revoke → Yes, revoke marks it revoked");
    await shot(page, "08-admin-revoked");
  } finally {
    await ctx.close();
  }
}

async function verifyRevoked(browser: Browser, s: Seeded, cert: Cert): Promise<void> {
  step("6b. logged out after the revoke; and an unknown code");
  const anon = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await anon.newPage();
  try {
    await p.goto(`${BASE}/verify/${cert.id}`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await p.getByRole("heading", { name: "This certificate was revoked" }).waitFor({ timeout: WAIT });
    ok(true, "the check page says it was revoked");
    ok(!(await p.getByText(HOLDER).isVisible().catch(() => false)), "and no longer shows the name");
    ok((await p.locator('img[src*="preview.png"]').count()) === 0, "or the picture");
    await axe(p, "verify revoked");
    await shot(p, "09-verify-revoked");
    const res = await fetch(`${BASE}/api/v5/certificates/${cert.id}/preview.png`);
    ok(res.status === 410, `the public PNG is gone (${res.status})`);

    await p.goto(`${BASE}/verify/OYL-0000-0000-0000-0000`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await p.getByRole("heading", { name: "Certificate not found" }).waitFor({ timeout: WAIT });
    ok(true, "an unknown code says Certificate not found");
    await axe(p, "verify not found");
    await shot(p, "10-verify-not-found");
  } finally {
    await anon.close();
  }

  const learner = await browser.newContext({ storageState: s.learnerStorage });
  try {
    const dl = await learner.request.get(`${BASE}/api/v5/certificates/${cert.id}/file.pdf?download=1`);
    ok(dl.status() === 410, `the learner's download stops (${dl.status()})`);
    const page = await learner.newPage();
    await page.goto(`${BASE}/learn/certificate/${cert.id}`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await page.getByText(/This certificate was revoked on/).waitFor({ timeout: WAIT });
    ok((await page.getByRole("link", { name: "Download PDF" }).count()) === 0, "the learner's page says it was revoked, with no downloads");
    await shot(page, "11-certificate-revoked");
  } finally {
    await learner.close();
  }
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-brand5-"));
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: process.env.E2E_HEADED !== "1" });
  try {
    const seeded = await seed(browser, dataDir);
    const cert = await finishCourse(browser, seeded);
    await learnerPage(browser, seeded, cert, dataDir);
    await verifyValid(browser, cert);
    await adminRevoke(browser, seeded, cert);
    await verifyRevoked(browser, seeded, cert);
    await seeded.adminCtx.close();
  } finally {
    await browser.close();
    stopServer();
  }
  console.log(`\nscreenshots: ${SHOTS}`);
  if (notes.length) console.log(`${notes.length} note(s)`);
  if (failures.length) {
    console.log(`\u001b[31m${failures.length} failure(s)\u001b[0m`);
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("\u001b[32mall brand-certificate checks passed\u001b[0m");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
