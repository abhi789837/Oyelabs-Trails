/**
 * Oyelearn v4.5 Phase 5: an Oyelabs course from the admin's first click to the learner's
 * certificate, end to end and offline.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh p45flow)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/v45-oyelabs-flow.ts
 *   bash scripts/e2e/snapshot-build.sh --remove p45flow
 *
 * 1. The admin creates "White-label delivery" for Project Management in the real editor, with two
 *    modules:
 *    - "Kick-off": a Drive video link (estimated tracking; its length typed in) and an uploaded
 *      PDF SOP;
 *    - "Handover": a Dropbox video (exact tracking) and a Google Doc link.
 * 2. Save & publish. The questions are made with no further clicks (text extraction, transcripts,
 *    mock AI, gates); both module tests reach Ready with "N questions created from …", and every
 *    item cites its source.
 * 3. A PM learner sees the course in their Library with the Oyelabs badge. Module 1: the Drive
 *    video counts active time, offers "I've watched this" at 80%, and the click makes it watched;
 *    the test unlocks and they pass it. Module 2: the Dropbox video plays to the end in our HTML5
 *    player (exact); they pass that test too.
 * 4. The course certificate is issued and verifies (API and the public /verify page).
 *
 * No real external network: the server's link checks and document reads go to a local stub
 * (`OYELABS_FETCH_STUB`, dev only) that answers like Drive, Dropbox and Google Docs; the browser's
 * requests to those hosts are fulfilled by Playwright (a tiny page for the Drive player, the local
 * WebM fixture for Dropbox) and everything else external is blocked. Throwaway DATA_DIR, mock AI,
 * port 8877 (E2E_PORT). Helpers are copied from v45-video-sources.ts and v45-oyelabs-editor.ts on
 * purpose, so no script's changes can break another. Exits non-zero when any check fails.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import { chromium, type APIRequestContext, type Browser, type BrowserContext, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.E2E_PORT ?? 8877);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER = "pm.flow";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const WAIT = 20_000;
const JOBS_WAIT = Number(process.env.E2E_JOB_TIMEOUT_MS ?? 4 * 60_000);
const HEADED = process.env.E2E_HEADED === "1";
const SHOTS = process.env.E2E_SHOTS ?? path.join(os.tmpdir(), "claude", "e2e-shots-v45-oyelabs-flow");
const WEBM = fs.readFileSync(path.join(REPO, "scripts", "e2e", "fixtures", "v45-sample.webm"));
const SOP_PDF = fs.readFileSync(path.join(REPO, "server", "src", "oyelabs", "extract", "fixtures", "process-2-pages.pdf"));

const TITLE = "White-label delivery";
const DRIVE = "https://drive.google.com/file/d/1KickoffCallOyelabs/view?usp=sharing";
const DRIVE_TITLE = "Kick-off call";
const DROPBOX = "https://www.dropbox.com/s/hndovr42/handover-walkthrough.webm?dl=0";
const DROPBOX_TITLE = "Handover walkthrough";
const GDOC = "https://docs.google.com/document/d/1HandoverChecklistDoc/edit?usp=sharing";

const DESCRIPTION =
  "How Oyelabs delivers white-label apps for agency partners: the kick-off call, brand assets, store accounts, milestone sign-off, the QA regression run, the handover pack and the thirty-day support window after launch.";

const NOTES_1 = [
  "The project manager owns the kick-off. Book the call within two working days of the signed contract and send the agenda one day before it.",
  "On the call, confirm the brand assets (logo files, colours, fonts), the app store accounts and who signs off each milestone. Write the names of the sign-off people in the project tracker the same day.",
  "If the client has no developer account for the App Store or Google Play, walk them through creating one on the call; publishing waits for it, so it is the first risk to raise.",
  "Agree the white-label scope in writing: which screens change colour and copy only, and which need new work. Anything outside the scope goes through a change request with a price and a date, never as a favour.",
  "Close the call by reading back the dates for the first build, the review round and the handover, and send the minutes within one working day.",
].join("\n\n");

const GDOC_TEXT = [
  "Handover checklist",
  "Before handover the QA lead runs the full regression suite on the release build and records the results in the client's tracker. A build with an open critical bug is never handed over.",
  "The project manager sends the handover pack: the source repository link, the build credentials vault entry, the store listing texts and screenshots, and the support contact for the first thirty days.",
  "Credentials are shared only through the vault. Never paste passwords into email, chat or the tracker; if a client asks for them in email, reply with the vault link instead.",
  "The handover call walks the client through the admin panel, the release process and how to report a bug. Record the call and attach the recording to the handover pack.",
  "Support window",
  "For thirty days after launch, bugs in the delivered scope are fixed at no charge. New features in that window go through a change request with a price and a date.",
  "At the end of the window the account manager offers a maintenance retainer. If the client declines, the project is archived and the vault access is handed over to the client's own admin.",
  "Store release",
  "The first store release is submitted from the client's own developer account, never from ours. The project manager checks the listing texts, the privacy policy link and the age rating with the client before the build is sent for review.",
  "If the store rejects the build, the lead developer reads the rejection, fixes what it names and resubmits within two working days, and the project manager tells the client the new date the same day.",
].join("\n\n");

const NOTES_2 = "Book the handover call once QA has signed off the release build. Send the handover pack the day before the call, so the client can read it first.";

const failures: string[] = [];
function ok(cond: unknown, message: string): boolean {
  console.log(`    ${cond ? "\u001b[32mok\u001b[0m  " : "\u001b[31mFAIL\u001b[0m"} ${message}`);
  if (!cond) failures.push(message);
  return Boolean(cond);
}
function note(message: string): void {
  console.log(`    \u001b[33mnote\u001b[0m ${message}`);
}
function step(message: string): void {
  console.log(`  - ${message}`);
}

async function poll<T>(what: string, timeoutMs: number, fn: () => Promise<T | null | undefined | false>, everyMs = 500): Promise<T> {
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

async function shot(page: Page, name: string): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true }).catch(() => undefined);
}

function sql(dataDir: string, fn: (db: Database.Database) => void): void {
  const db = new Database(path.join(dataDir, "oyelearn.db"));
  try {
    db.pragma("busy_timeout = 5000");
    fn(db);
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// The stub for the server's link checks and document reads (Drive, Dropbox, Google Docs)
// ---------------------------------------------------------------------------

function startStub(): Promise<{ origin: string; close: () => void; seen: string[] }> {
  const seen: string[] = [];
  const server = http.createServer((req, res) => {
    const url = req.url ?? "";
    seen.push(`${req.method} ${url}`);
    const send = (status: number, headers: Record<string, string>, body: string | Buffer = "") => {
      res.writeHead(status, headers);
      res.end(req.method === "HEAD" ? undefined : body);
    };
    if (url.startsWith("/__stub/drive.google.com/file/d/1KickoffCallOyelabs/")) {
      return send(200, { "content-type": "text/html" }, '<meta property="og:title" content="Kick-off call.mp4"><title>Kick-off call.mp4 - Google Drive</title>');
    }
    if (url.startsWith("/__stub/www.dropbox.com/s/hndovr42/handover-walkthrough.webm")) return send(302, { location: "https://dl.dropboxusercontent.com/s/hndovr42/handover-walkthrough.webm" });
    if (url.startsWith("/__stub/dl.dropboxusercontent.com/")) return send(200, { "content-type": "video/webm", "content-length": String(WEBM.length) }, WEBM);
    if (url.startsWith("/__stub/docs.google.com/document/d/1HandoverChecklistDoc/export")) return send(200, { "content-type": "text/plain; charset=utf-8" }, GDOC_TEXT);
    if (url.startsWith("/__stub/docs.google.com/document/d/1HandoverChecklistDoc/")) {
      return send(200, { "content-type": "text/html" }, "<title>Handover checklist - Google Docs</title><body>Handover checklist</body>");
    }
    send(404, { "content-type": "text/plain" }, "not found");
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({ origin: `http://127.0.0.1:${port}`, close: () => server.close(), seen });
    });
  });
}

// ---------------------------------------------------------------------------
// The app server
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

async function startServer(dataDir: string, stubOrigin: string): Promise<void> {
  for (const required of ["dist/index.html", "dist-server/index.js"]) {
    if (!fs.existsSync(path.join(APP, required))) throw new Error(`${required} is missing in ${APP}. Build a snapshot first (see the top of this file).`);
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
      PUBLIC_ORIGIN: BASE,
      YOUTUBE_API_KEY: "",
      OYELABS_FETCH_STUB: stubOrigin,
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
  });
}

/** Offline browser: Drive's player is a tiny local page, Dropbox serves the fixture, the rest is blocked. */
async function offline(ctx: BrowserContext): Promise<void> {
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, async (route) => {
    const url = route.request().url();
    if (url.startsWith("https://drive.google.com/file/d/") && url.includes("/preview")) {
      return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Drive player</title><body style='background:#111;color:#fff'>Drive player (stub)</body>" });
    }
    if (url.startsWith("https://www.dropbox.com/s/hndovr42/") || url.startsWith("https://dl.dropboxusercontent.com/")) {
      return route.fulfill({ status: 200, contentType: "video/webm", body: WEBM, headers: { "access-control-allow-origin": "*" } });
    }
    return route.abort();
  });
}

// ---------------------------------------------------------------------------
// Shapes read from the API
// ---------------------------------------------------------------------------

interface CourseView {
  id: string;
  published: boolean;
  version: number;
  modules: { id: string; topicId: string; title: string; videos: unknown[]; docs: unknown[] }[];
}

interface ModuleTestView {
  status: string;
  summary: string;
  items: { id: string; options: string[]; correctIndices: number[]; citationLabel: string | null }[];
}

interface ServedTest {
  locked: boolean;
  items: { id: string; prompt: string; options: string[]; multi: boolean }[];
}

interface Playlist {
  watchedCount: number;
  total: number;
  locked: boolean;
  entries: { videoId: string; watched: boolean; watchedSeconds: number }[];
}

// ---------------------------------------------------------------------------
// 1–2. The admin builds and publishes the course
// ---------------------------------------------------------------------------

async function waitForCard(page: Page, cards: ReturnType<Page["getByTestId"]>, text: RegExp, what: string): Promise<boolean> {
  return poll(what, WAIT, async () => (await cards.count()) > 0 && text.test((await cards.last().textContent()) ?? "")).then(
    () => true,
    () => false,
  );
}

async function buildCourse(browser: Browser, storage: string): Promise<string> {
  step("1. the admin creates the course in the editor");
  const ctx = await browser.newContext({ storageState: storage, viewport: { width: 1440, height: 1000 } });
  await offline(ctx);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => note(`[pageerror] ${e.message}`));
  try {
    await page.goto(`${BASE}/admin/library`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await page.getByRole("link", { name: "Add Oyelabs course" }).click({ timeout: WAIT });
    await page.waitForURL(/\/admin\/library\/oyelabs\/new/, { timeout: WAIT });
    await page.getByRole("heading", { level: 1, name: "Add an Oyelabs course" }).waitFor({ timeout: WAIT });

    await page.getByRole("group", { name: "Who it's for" }).getByRole("button", { name: "Project Management" }).click({ timeout: WAIT });
    await page.getByLabel("Title", { exact: true }).fill(TITLE);
    await page.getByLabel(/Short description/).fill(DESCRIPTION);
    await page.getByRole("radio", { name: "Intermediate" }).check({ timeout: WAIT });
    const modules = page.getByTestId("oyelabs-module");

    // Module 1: a Drive video and an uploaded PDF SOP.
    const m1 = modules.nth(0);
    await m1.getByLabel("Module title").fill("Kick-off");
    const v1 = m1.getByTestId("oyelabs-video-field");
    await v1.getByLabel("Paste video links, one per line").fill(DRIVE);
    await v1.getByRole("button", { name: "Add links" }).click();
    const v1Cards = v1.getByTestId("oyelabs-link-card");
    ok(await waitForCard(page, v1Cards, /Plays ✓/, "the Drive card"), "module 1: the Drive link plays (\"Plays ✓\")");
    await v1Cards.first().getByLabel("Title learners see").fill(DRIVE_TITLE);
    // The shortest length the editor takes is 1 minute, so "I've watched this" comes after 48 s of active time.
    await v1Cards.first().getByLabel("Length in minutes").fill("1");
    await m1.getByTestId("oyelabs-upload-doc").setInputFiles({ name: "Kick-off SOP.pdf", mimeType: "application/pdf", buffer: SOP_PDF });
    const d1 = m1.getByTestId("oyelabs-docs-field");
    ok(await poll("the PDF card", WAIT, async () => ((await d1.textContent()) ?? "").includes("Kick-off SOP")).then(() => true, () => false), "module 1: the PDF SOP is uploaded");
    await m1.getByRole("textbox", { name: /Notes/ }).click();
    await page.keyboard.insertText(NOTES_1);

    // Module 2: a Dropbox video and a Google Doc link.
    await page.getByRole("button", { name: "Add module" }).click();
    const m2 = modules.nth(1);
    await m2.getByLabel("Module title").fill("Handover");
    const v2 = m2.getByTestId("oyelabs-video-field");
    await v2.getByLabel("Paste video links, one per line").fill(DROPBOX);
    await v2.getByRole("button", { name: "Add links" }).click();
    const v2Cards = v2.getByTestId("oyelabs-link-card");
    ok(await waitForCard(page, v2Cards, /Plays ✓/, "the Dropbox card"), "module 2: the Dropbox link plays (\"Plays ✓\")");
    await v2Cards.first().getByLabel("Title learners see").fill(DROPBOX_TITLE);
    const d2 = m2.getByTestId("oyelabs-docs-field");
    await d2.getByLabel("Paste a document link").fill(GDOC);
    await d2.getByRole("button", { name: "Add link" }).click();
    ok(await poll("the Google Doc card", WAIT, async () => /Handover checklist|Google Docs/.test((await d2.textContent()) ?? "")).then(() => true, () => false), "module 2: the Google Doc link is added");
    await m2.getByRole("textbox", { name: /Notes/ }).click();
    await page.keyboard.insertText(NOTES_2);
    await shot(page, "01-editor-filled");

    step("2. Save & publish: the questions are made by themselves");
    await page.getByRole("button", { name: "Save & publish" }).click();
    await page.waitForURL(/\/admin\/library\/[^/]+\/oyelabs$/, { timeout: WAIT });
    const courseId = decodeURIComponent(new URL(page.url()).pathname.split("/")[3]!);
    const course = await call<CourseView>(ctx.request, "get", `/api/admin/oyelabs/courses/${courseId}`);
    ok(course.published && course.modules.length === 2, `published with ${course.modules.length} modules`);
    ok(course.modules[0]?.videos.length === 1 && course.modules[0]?.docs.length === 1, "module 1 has the Drive video and the PDF");
    ok(course.modules[1]?.videos.length === 1 && course.modules[1]?.docs.length === 1, "module 2 has the Dropbox video and the Google Doc");

    for (const [i, mod] of course.modules.entries()) {
      const test = await poll(
        `module ${i + 1}'s test`,
        JOBS_WAIT,
        async () => {
          const t = await call<ModuleTestView>(ctx.request, "get", `/api/admin/oyelabs/modules/${mod.id}/test`);
          if (t.status === "failed" || t.status === "needs_content") throw new Error(`${t.status}: ${t.summary}`);
          return t.status === "ready" ? t : null;
        },
        1500,
      ).catch((error: unknown) => {
        ok(false, `module ${i + 1}'s test is Ready (${String(error)})`);
        return null;
      });
      if (!test) continue;
      ok(true, `module ${i + 1}'s test is Ready: "${test.summary}"`);
      ok(test.items.length >= 6 && test.items.length <= 10, `module ${i + 1}: ${test.items.length} questions (6–10)`);
      ok(/questions created from/.test(test.summary), "the summary says what they were made from");
      ok(test.items.every((item) => item.citationLabel), `module ${i + 1}: every question cites its source (${[...new Set(test.items.map((t) => t.citationLabel))].join("; ")})`);
    }
    const labels = (await Promise.all(course.modules.map((m) => call<ModuleTestView>(ctx.request, "get", `/api/admin/oyelabs/modules/${m.id}/test`)))).flatMap((t) => t.items.map((i) => i.citationLabel ?? ""));
    ok(labels.some((l) => /Kick-off SOP.*page \d/.test(l)), "module 1 cites the PDF by page");
    ok(labels.some((l) => /^Handover checklist/.test(l)), "module 2 cites the Google Doc by its title");

    await page.reload({ waitUntil: "domcontentloaded" });
    const panels = page.getByTestId("module-test-panel");
    await panels.first().waitFor({ timeout: WAIT });
    const panelText = (await panels.allTextContents()).join(" | ");
    ok((panelText.match(/Ready/g) ?? []).length >= 2 && /questions created from/.test(panelText), "the editor shows both module tests as Ready");
    await shot(page, "02-editor-ready");
    return courseId;
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// 3. The learner
// ---------------------------------------------------------------------------

async function answerAndPass(page: Page, request: APIRequestContext, admin: APIRequestContext, topicId: string, sectionId: string, label: string): Promise<void> {
  const served = await call<ServedTest>(request, "get", `/api/v5/oyelabs/lessons/${topicId}/test`);
  ok(!served.locked && served.items.length >= 6, `${label}: the test is open with ${served.items.length} questions`);
  ok(served.items.every((i) => !("correctIndices" in i)), `${label}: the questions come without the answers`);
  const key = new Map((await call<ModuleTestView>(admin, "get", `/api/admin/oyelabs/modules/${sectionId}/test`)).items.map((i) => [i.id, i.correctIndices]));

  const form = page.getByTestId("module-test");
  await form.waitFor({ timeout: WAIT });
  const fieldsets = form.locator("fieldset");
  await poll(`${label}: the questions`, WAIT, async () => (await fieldsets.count()) === served.items.length);
  for (const [qi, item] of served.items.entries()) {
    for (const ci of key.get(item.id) ?? []) {
      await fieldsets.nth(qi).getByText(item.options[ci]!, { exact: true }).first().click();
    }
  }
  await page.getByRole("button", { name: "Send my answers" }).click();
  const passed = await page.getByText(/Passed\. This module is done\./).waitFor({ timeout: WAIT }).then(() => true, () => false);
  ok(passed, `${label}: "Passed. This module is done."`);
  ok((await page.getByTestId("module-test-source").count()) > 0, `${label}: each answer shows where in the material it came from`);
}

async function learnerJourney(browser: Browser, storage: string, admin: APIRequestContext, courseId: string): Promise<void> {
  const course = await call<CourseView>(admin, "get", `/api/admin/oyelabs/courses/${courseId}`);
  const [mod1, mod2] = course.modules;
  const ctx = await browser.newContext({ storageState: storage, viewport: { width: 1440, height: 1000 } });
  await offline(ctx);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => note(`[pageerror] ${e.message}`));
  try {
    step("3. the PM learner: the Library shows the course with the Oyelabs badge");
    await page.goto(`${BASE}/learn/library`, { waitUntil: "domcontentloaded", timeout: WAIT });
    const card = page.getByTestId("library-card").filter({ hasText: TITLE });
    ok(await card.first().waitFor({ timeout: WAIT }).then(() => true, () => false), "the course is in the PM learner's Library");
    ok(await card.first().getByTestId("oyelabs-badge").isVisible().catch(() => false), "with the Oyelabs badge");
    await shot(page, "03-learner-library");

    step("module 1: the Drive video (estimated) and the test");
    const playlist = (topicId: string) => call<Playlist>(ctx.request, "get", `/api/v5/oyelabs/lessons/${topicId}/playlist`);
    await page.goto(`${BASE}/learn/lesson/${mod1!.topicId}?course=${courseId}`, { waitUntil: "domcontentloaded", timeout: WAIT });
    const lesson = page.getByTestId("oyelabs-module-lesson");
    ok(await lesson.waitFor({ timeout: WAIT }).then(() => true, () => false), "the module lesson opens");
    ok(((await lesson.textContent()) ?? "").includes("Watch the videos first: 0 of 1 watched."), "the test waits for the video");
    ok(((await lesson.textContent()) ?? "").includes("Kick-off SOP"), "the PDF SOP is listed under Documents");
    await page.bringToFront();
    await page.getByRole("button", { name: `Open the player for ${DRIVE_TITLE}` }).click({ timeout: WAIT });
    ok(await page.getByTestId("oyelabs-embed").waitFor({ timeout: WAIT }).then(() => true, () => false), "the Drive player loads in an iframe");
    await page.mouse.move(200, 200);
    const confirm = page.getByRole("button", { name: "I've watched this" });
    ok(!(await confirm.isVisible()), "\"I've watched this\" isn't offered before 80% of the length");
    ok(await confirm.waitFor({ timeout: 100_000 }).then(() => true, () => false), "after enough active time, \"I've watched this\" appears");
    let state = await playlist(mod1!.topicId);
    ok(state.entries[0] && state.entries[0].watchedSeconds >= 48 && !state.entries[0].watched, `active time counted (${state.entries[0]?.watchedSeconds} s of 60) but not watched without the click`);
    await confirm.click();
    state = await poll("the Drive video to count as watched", WAIT, async () => {
      const s = await playlist(mod1!.topicId);
      return s.entries[0]?.watched ? s : null;
    }).catch(() => state);
    ok(state.entries[0]?.watched && !state.locked, "the click makes it watched and lifts the lock");
    await page.reload({ waitUntil: "domcontentloaded" });
    await lesson.waitFor({ timeout: WAIT });
    await answerAndPass(page, ctx.request, admin, mod1!.topicId, mod1!.id, "module 1");
    await shot(page, "04-module-1-passed");

    step("module 2: the Dropbox video (exact) and the test");
    await page.goto(`${BASE}/learn/lesson/${mod2!.topicId}?course=${courseId}`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await lesson.waitFor({ timeout: WAIT });
    ok(((await lesson.textContent()) ?? "").includes("Handover checklist") || ((await lesson.textContent()) ?? "").includes("Google Doc"), "the Google Doc is listed under Documents");
    const video = page.getByTestId("oyelabs-html5");
    ok(await video.waitFor({ timeout: WAIT }).then(() => true, () => false), "the Dropbox video plays in our HTML5 player");
    await poll("the Dropbox video to load", WAIT, () => video.evaluate((v: HTMLVideoElement) => v.readyState >= 1));
    await video.evaluate((v: HTMLVideoElement) => {
      v.muted = true;
      v.currentTime = 0;
      return v.play();
    });
    await poll("the Dropbox video to end", 30_000, () => video.evaluate((v: HTMLVideoElement) => v.ended));
    const watched = await poll("the Dropbox video to count as watched", WAIT, async () => (await playlist(mod2!.topicId)).entries[0]?.watched).catch(() => false);
    ok(watched, "it plays to the end and counts as watched (exact tracking)");
    await page.reload({ waitUntil: "domcontentloaded" });
    await lesson.waitFor({ timeout: WAIT });
    await answerAndPass(page, ctx.request, admin, mod2!.topicId, mod2!.id, "module 2");
    await shot(page, "05-module-2-passed");

    step("4. the course certificate");
    const cert = await poll("the course certificate", WAIT, async () => {
      const mine = await call<{ certificates: { id: string; kind: string; refId: string; title: string; verifyPath: string }[] }>(ctx.request, "get", "/api/v5/certificates");
      return mine.certificates.find((c) => c.kind === "course" && c.refId === courseId) ?? null;
    }).catch(() => null);
    ok(cert, `a course certificate is issued (${cert?.id ?? "none"})`);
    if (cert) {
      ok(cert.title.includes(TITLE), `for "${cert.title}"`);
      const pub = await call<{ certificate: { status: string; title: string } }>(ctx.request, "get", `/api/v5/certificates/${cert.id}/public`);
      ok(pub.certificate.status === "valid", `the public check says ${pub.certificate.status}`);
      await page.goto(`${BASE}${cert.verifyPath}`, { waitUntil: "domcontentloaded", timeout: WAIT });
      const shown = await page.getByText(TITLE).first().waitFor({ timeout: WAIT }).then(() => true, () => false);
      ok(shown, `the public ${cert.verifyPath} page shows the course`);
      await shot(page, "06-verify");
    }
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  fs.rmSync(SHOTS, { recursive: true, force: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v45flow-"));
  const stub = await startStub();
  await startServer(dataDir, stub.origin);
  const browser = await chromium.launch({ headless: !HEADED });
  let adminCtx: BrowserContext | null = null;
  try {
    adminCtx = await browser.newContext();
    await call(adminCtx.request, "post", "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
    await call(adminCtx.request, "post", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });
    await call(adminCtx.request, "put", "/api/me/ui", { v5: true });
    const adminStorage = path.join(dataDir, "admin.json");
    await adminCtx.storageState({ path: adminStorage });

    const created = await call<{ user: { id: string }; temporaryPassword: string }>(adminCtx.request, "post", "/api/admin/users", {
      username: LEARNER,
      displayName: "Meera Joshi",
      profile: { roleTitle: "Project Manager", yearsExperience: 2, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
      issueAssessment: false,
    });
    sql(dataDir, (db) => {
      db.prepare("UPDATE learner_profiles SET department_id = 'pm' WHERE user_id = ?").run(created.user.id);
    });

    const courseId = await buildCourse(browser, adminStorage);
    ok(stub.seen.some((s) => s.includes("drive.google.com")) && stub.seen.some((s) => s.includes("export")), "the server's checks and the Google Doc read went to the local stub");

    const learnerCtx = await browser.newContext();
    await call(learnerCtx.request, "post", "/api/auth/login", { username: LEARNER, password: created.temporaryPassword });
    await call(learnerCtx.request, "post", "/api/auth/change-password", { currentPassword: created.temporaryPassword, newPassword: LEARNER_NEW });
    await call(learnerCtx.request, "put", "/api/me/ui", { v5: true });
    await call(learnerCtx.request, "put", "/api/v5/motivation/prefs", { welcomeDone: true }).catch(() => undefined);
    const learnerStorage = path.join(dataDir, "learner.json");
    await learnerCtx.storageState({ path: learnerStorage });
    await learnerCtx.close();

    await learnerJourney(browser, learnerStorage, adminCtx.request, courseId);
  } finally {
    await adminCtx?.close().catch(() => undefined);
    await browser.close();
    stopServer();
    stub.close();
  }
  console.log(`screenshots: ${SHOTS}`);
  if (failures.length) {
    console.log(`\n${failures.length} check(s) failed:`);
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("\nv45-oyelabs-flow: all checks passed");
  fs.rmSync(dataDir, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
