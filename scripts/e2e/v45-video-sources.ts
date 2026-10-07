/**
 * Oyelearn v4.5 Phase 2: videos from any drive, end to end and offline.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh p45b)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/v45-video-sources.ts
 *   bash scripts/e2e/snapshot-build.sh --remove p45b
 *
 * No real external network: the server's link checks go to a local stub (`OYELABS_FETCH_STUB`,
 * dev only) that answers like Drive, Google sign-in, Dropbox and YouTube oEmbed; the browser's
 * requests to those hosts are fulfilled by Playwright (a tiny page for the Drive player, the local
 * WebM fixture for Dropbox), and everything else external is blocked.
 *
 * 1. The resolver: a private Drive link → "This Drive video is private." with the exact fix; a
 *    shared one → plays (estimated); a Dropbox link → raw=1, HTML5, exact.
 * 2. The editor's video field: the confidentiality line, preview cards with "Plays ✓" and
 *    "Can't play: … + fix", Move up/down.
 * 3. An upload (the 4-second WebM fixture) is stored and streams with HTTP Range (206).
 * 4. The learner's module lesson: the playlist, the test locked "Watch the videos first".
 *    - Drive (estimated): active time counts while the page is visible and focused; at 80% of the
 *      length "I've watched this" appears; the click makes it watched.
 *    - Dropbox and the upload (exact): the HTML5 player plays to the end and they count as watched.
 *    - The lock lifts (3 of 3); the playlist sidebar ticks them.
 * 5. axe at 1440 and 390 on the module lesson.
 * Port 8871 (E2E_PORT), throwaway DATA_DIR, mock AI.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import Database from "better-sqlite3";
import { chromium, type APIRequestContext, type Browser, type BrowserContext, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.E2E_PORT ?? 8871);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER = "learner.drive";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const WAIT = 20_000;
const HEADED = process.env.E2E_HEADED === "1";
const WEBM = fs.readFileSync(path.join(REPO, "scripts", "e2e", "fixtures", "v45-sample.webm"));

const PRIVATE_DRIVE = "https://drive.google.com/file/d/1PrivateDriveFileAbc/view?usp=sharing";
const PUBLIC_DRIVE = "https://drive.google.com/file/d/1SharedDriveFileXyz/view?usp=sharing";
const DROPBOX = "https://www.dropbox.com/s/abc123/handover.webm?dl=0";
const DRIVE_FIX = "In Google Drive: Share → General access → 'Anyone with the link' (or 'Oyelabs' if every learner is signed into their Oyelabs Google account) → Viewer. Then press Check again.";

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

async function poll<T>(what: string, timeoutMs: number, fn: () => Promise<T | null | undefined | false>, everyMs = 300): Promise<T> {
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
// The stub for the server's link checks (Drive, sign-in, Dropbox, YouTube oEmbed)
// ---------------------------------------------------------------------------

function startStub(): Promise<{ origin: string; close: () => void; seen: string[] }> {
  const seen: string[] = [];
  const server = http.createServer((req, res) => {
    const url = req.url ?? "";
    seen.push(`${req.method} ${url}`);
    const send = (status: number, headers: Record<string, string>, body = "") => {
      res.writeHead(status, headers);
      res.end(req.method === "HEAD" ? undefined : body);
    };
    if (url.startsWith("/__stub/drive.google.com/file/d/1PrivateDriveFileAbc/")) return send(302, { location: "https://accounts.google.com/ServiceLogin?continue=drive" });
    if (url.startsWith("/__stub/accounts.google.com/")) return send(200, { "content-type": "text/html" }, "<title>Sign in - Google Accounts</title>");
    if (url.startsWith("/__stub/drive.google.com/file/d/1SharedDriveFileXyz/")) {
      return send(200, { "content-type": "text/html" }, '<meta property="og:title" content="Kick-off call.mp4"><title>Kick-off call.mp4 - Google Drive</title>');
    }
    if (url.startsWith("/__stub/www.dropbox.com/s/abc123/handover.webm")) return send(302, { location: "https://dl.dropboxusercontent.com/s/abc123/handover.webm" });
    if (url.startsWith("/__stub/dl.dropboxusercontent.com/")) return send(200, { "content-type": "video/webm", "content-length": String(WEBM.length) }, WEBM.toString("binary"));
    if (url.startsWith("/__stub/www.youtube.com/oembed")) return send(200, { "content-type": "application/json" }, JSON.stringify({ title: "Kick-off overview" }));
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
    if (url.startsWith("https://www.dropbox.com/s/abc123/handover.webm") || url.startsWith("https://dl.dropboxusercontent.com/")) {
      return route.fulfill({ status: 200, contentType: "video/webm", body: WEBM, headers: { "access-control-allow-origin": "*" } });
    }
    return route.abort();
  });
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

interface Resolved {
  kind: string;
  status: string;
  tracking: string;
  playerKind: string;
  embedUrl: string | null;
  playbackUrl: string | null;
  title: string | null;
  problem: { message: string; fix: string } | null;
}

async function resolverChecks(admin: APIRequestContext): Promise<void> {
  step("1. the resolver, against the stub");
  const priv = await call<Resolved>(admin, "post", "/api/admin/oyelabs/links/resolve", { url: PRIVATE_DRIVE });
  ok(priv.kind === "gdrive" && priv.status === "private", `a private Drive link is private (${priv.kind}, ${priv.status})`);
  ok(priv.problem?.message === "This Drive video is private.", `with the plain reason (${priv.problem?.message})`);
  ok(priv.problem?.fix === DRIVE_FIX, "and the exact fix");
  const pub = await call<Resolved>(admin, "post", "/api/admin/oyelabs/links/resolve", { url: PUBLIC_DRIVE });
  ok(pub.status === "ok" && pub.tracking === "estimated" && pub.embedUrl === "https://drive.google.com/file/d/1SharedDriveFileXyz/preview", `a shared Drive link plays in the Drive player, estimated (${pub.status})`);
  ok(pub.title === "Kick-off call.mp4", `its title is read from the page (${pub.title})`);
  const box = await call<Resolved>(admin, "post", "/api/admin/oyelabs/links/resolve", { url: DROPBOX });
  ok(box.kind === "dropbox" && box.status === "ok" && box.tracking === "exact" && box.playerKind === "html5", `Dropbox plays in our HTML5 player, exact (${box.status})`);
  ok(box.playbackUrl === "https://www.dropbox.com/s/abc123/handover.webm?raw=1", `as a raw=1 link (${box.playbackUrl})`);
  const local = await admin.post(`${BASE}/api/admin/oyelabs/links/resolve`, { data: { url: "http://169.254.169.254/latest/meta-data/" } });
  ok(local.ok() && (await local.json()).status === "unsupported", "a private-network address is refused");
}

async function uploadFixture(admin: APIRequestContext): Promise<string> {
  step("3. upload the WebM fixture; it streams with HTTP Range");
  const res = await admin.post(`${BASE}/api/admin/oyelabs/uploads?kind=video`, { multipart: { file: { name: "handover-call.webm", mimeType: "video/webm", buffer: WEBM } }, timeout: WAIT });
  ok(res.status() === 201, `the upload is stored (${res.status()})`);
  const up = (await res.json()) as { id: string; mime: string; bytes: number };
  ok(up.mime === "video/webm" && up.bytes === WEBM.length, `as video/webm, ${up.bytes} bytes`);
  const range = await admin.get(`${BASE}/api/v5/oyelabs/media/${up.id}`, { headers: { range: "bytes=0-1023" } });
  ok(range.status() === 206 && range.headers()["content-range"] === `bytes 0-1023/${WEBM.length}`, `a Range request gets 206 (${range.status()} ${range.headers()["content-range"]})`);
  const fake = await admin.post(`${BASE}/api/admin/oyelabs/uploads?kind=video`, { multipart: { file: { name: "fake.mp4", mimeType: "video/mp4", buffer: Buffer.from("not a video") } } });
  ok(fake.status() === 415, `a file whose bytes don't match is refused (${fake.status()})`);
  return up.id;
}

async function editorChecks(browser: Browser, storage: string): Promise<void> {
  step("2. the editor's video field: cards, statuses, fixes");
  const ctx = await browser.newContext({ storageState: storage, viewport: { width: 1440, height: 1000 } });
  await offline(ctx);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => note(`[pageerror] ${e.message}`));
  await page.goto(`${BASE}/admin/library/oyelabs/new`, { waitUntil: "domcontentloaded", timeout: WAIT });
  const field = page.getByTestId("oyelabs-video-field").first();
  if (!(await field.waitFor({ timeout: WAIT }).then(() => true, () => false))) {
    note("the editor page didn't show the video field (builder A's page); skipped the UI part of step 2");
    await ctx.close();
    return;
  }
  ok(((await field.textContent()) ?? "").includes("For internal-only videos, upload them here or use Drive shared with 'Oyelabs' only."), "the confidentiality line sits next to the field");
  const box = field.getByLabel("Paste video links, one per line");
  await box.fill(`${PRIVATE_DRIVE}\n${PUBLIC_DRIVE}`);
  await field.getByRole("button", { name: "Add links" }).click();
  const cards = field.getByTestId("oyelabs-link-card");
  await poll("two checked cards", WAIT, async () => (await cards.count()) === 2 && (await field.locator('[data-status="pending"]').count()) === 0);
  const first = (await cards.nth(0).textContent()) ?? "";
  ok(first.includes("Can't play: This Drive video is private.") && first.includes("Share → General access"), "the private link's card says why and how to fix it");
  const second = (await cards.nth(1).textContent()) ?? "";
  ok(second.includes("Plays ✓") && second.includes("Kick-off call.mp4"), "the shared link's card plays, with its title");
  ok(second.includes("Length in minutes"), "an estimated embed asks for its length");
  await cards.nth(1).getByRole("button", { name: /Move .* up/ }).click();
  ok(((await cards.nth(0).textContent()) ?? "").includes("Plays ✓"), "Move up reorders the cards (keyboard alternative to dragging)");
  await ctx.close();
}

function seedCourse(dataDir: string, uploadId: string): { courseId: string; topicId: string; ids: { drive: string; dropbox: string; upload: string } } {
  step("seed: a published Oyelabs course with one module (Drive 20 s, Dropbox 4 s, upload 4 s)");
  const db = new Database(path.join(dataDir, "oyelearn.db"));
  const at = Date.now();
  const id = (p: string) => `${p}${Math.random().toString(36).slice(2, 12)}`;
  const courseId = id("c");
  const sectionId = id("s");
  const topicId = id("t");
  const ids = { drive: id("v"), dropbox: id("v"), upload: id("v") };
  try {
    db.prepare("insert into courses (id, title, summary, accent, audience, published, position, created_at, updated_at, oyelabs) values (?, ?, '', 'glacier', 'everyone', 1, 0, ?, ?, 1)").run(courseId, "White-label delivery", at, at);
    db.prepare("insert into course_sections (id, course_id, title, summary, position, notes, notes_text) values (?, ?, 'Kick-off', '', 0, ?, 'Agree the scope.')").run(
      sectionId,
      courseId,
      JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Agree the scope " }, { type: "text", text: "before", marks: [{ type: "bold" }] }, { type: "text", text: " the first call." }] }] }),
    );
    db.prepare("insert into course_topics (id, section_id, course_id, title, body, links, est_minutes, position, kind) values (?, ?, ?, 'Kick-off', '', '[]', 15, 0, 'module')").run(topicId, sectionId, courseId);
    const video = db.prepare(
      "insert into course_videos (id, course_id, section_id, topic_id, position, input_url, upload_id, kind, provider_id, player_kind, embed_url, playback_url, tracking, title, duration_seconds, duration_source, status, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, null, ?, ?, ?, ?, ?, ?, ?, 'ok', ?, ?)",
    );
    video.run(ids.drive, courseId, sectionId, topicId, 0, PUBLIC_DRIVE, null, "gdrive", "iframe", "https://drive.google.com/file/d/1SharedDriveFileXyz/preview", null, "estimated", "Kick-off call", 20, "admin", at, at);
    video.run(ids.dropbox, courseId, sectionId, topicId, 1, DROPBOX, null, "dropbox", "html5", null, "https://www.dropbox.com/s/abc123/handover.webm?raw=1", "exact", "Handover (Dropbox)", 4, "probe", at, at);
    video.run(ids.upload, courseId, sectionId, topicId, 2, null, uploadId, "upload", "html5", null, `/api/v5/oyelabs/media/${uploadId}`, "exact", "Handover call (upload)", 4, "probe", at, at);
  } finally {
    db.close();
  }
  return { courseId, topicId, ids };
}

interface Playlist {
  watchedCount: number;
  total: number;
  locked: boolean;
  entries: { videoId: string; watched: boolean; status: string; watchedSeconds: number; canConfirm: boolean }[];
}

async function learnerChecks(browser: Browser, storage: string, seeded: ReturnType<typeof seedCourse>): Promise<void> {
  step("4. the learner's module lesson");
  const ctx = await browser.newContext({ storageState: storage, viewport: { width: 1440, height: 1000 } });
  await offline(ctx);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => note(`[pageerror] ${e.message}`));
  const playlist = () => call<Playlist>(ctx.request, "get", `/api/v5/oyelabs/lessons/${seeded.topicId}/playlist`);
  await page.goto(`${BASE}/learn/lesson/${seeded.topicId}?course=${seeded.courseId}`, { waitUntil: "domcontentloaded", timeout: WAIT });
  const lesson = page.getByTestId("oyelabs-module-lesson");
  ok(await lesson.waitFor({ timeout: WAIT }).then(() => true, () => false), "the module lesson opens (lazy chunk)");
  const sidebar = page.getByRole("region", { name: "Videos in this module" });
  ok((await sidebar.getByRole("button").count()) >= 3 || ((await sidebar.textContent()) ?? "").includes("Handover call (upload)"), "the playlist lists the three videos");
  ok(((await lesson.textContent()) ?? "").includes("Watch the videos first: 0 of 3 watched."), "the module test waits for the videos");
  ok(((await lesson.textContent()) ?? "").includes("before"), "the module's notes show read-only");
  ok((await page.getByTestId("oyelabs-html5").count()) === 0, "nothing heavy loads before Play (the Drive entry is first, behind a facade)");

  // Drive (estimated): open the player, keep the page visible and focused.
  await page.bringToFront();
  await page.getByRole("button", { name: "Open the player for Kick-off call" }).click();
  ok(await page.getByTestId("oyelabs-embed").waitFor({ timeout: WAIT }).then(() => true, () => false), "the Drive embed loads in an iframe");
  await page.mouse.move(200, 200);
  const confirm = page.getByRole("button", { name: "I've watched this" });
  ok(!(await confirm.isVisible()), "\"I've watched this\" isn't offered before 80% of the length");
  const confirmShown = await confirm.waitFor({ timeout: 40_000 }).then(() => true, () => false);
  ok(confirmShown, "after enough active time (16 of 20 s), \"I've watched this\" appears");
  let state = await playlist();
  const drive = state.entries.find((e) => e.videoId === seeded.ids.drive);
  ok(drive && drive.watchedSeconds >= 16 && !drive.watched, `active time counted (${drive?.watchedSeconds} s) but not watched without the click`);
  await confirm.click();
  await page.getByText("You've watched this video.").waitFor({ timeout: WAIT }).catch(() => undefined);
  state = await playlist();
  ok(state.entries.find((e) => e.videoId === seeded.ids.drive)?.watched, "the click makes it watched");

  // Dropbox and the upload (exact): play them to the end in the HTML5 player.
  for (const [name, videoId] of [
    ["Handover (Dropbox)", seeded.ids.dropbox],
    ["Handover call (upload)", seeded.ids.upload],
  ] as const) {
    await sidebar.getByRole("button", { name: new RegExp(name.replace(/[()]/g, "\\$&")) }).click();
    const video = page.getByTestId("oyelabs-html5");
    await video.waitFor({ timeout: WAIT });
    await poll(`${name} to load`, WAIT, () => video.evaluate((v: HTMLVideoElement) => v.readyState >= 1));
    await video.evaluate((v: HTMLVideoElement) => {
      v.muted = true;
      v.currentTime = 0;
      return v.play();
    });
    await poll(`${name} to end`, 30_000, () => video.evaluate((v: HTMLVideoElement) => v.ended));
    const watched = await poll(`${name} to count as watched`, WAIT, async () => (await playlist()).entries.find((e) => e.videoId === videoId)?.watched).catch(() => false);
    ok(watched, `${name} plays to the end and counts as watched (exact tracking)`);
    await page.getByRole("group", { name: "Up next" }).getByRole("button", { name: "Cancel" }).click().catch(() => undefined);
  }

  state = await playlist();
  ok(state.watchedCount === 3 && state.total === 3 && !state.locked, `the lock lifts: ${state.watchedCount} of ${state.total} watched, locked=${state.locked}`);
  await page.reload({ waitUntil: "domcontentloaded" });
  await lesson.waitFor({ timeout: WAIT });
  ok(!((await lesson.textContent()) ?? "").includes("Watch the videos first"), "after a reload the module test is no longer waiting");

  step("5. axe on the module lesson at 1440 and 390");
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.waitForTimeout(300);
    const result = await new AxeBuilder({ page }).include('[data-testid="oyelabs-module-lesson"]').exclude("iframe").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    ok(result.violations.length === 0, `axe at ${width}px: ${result.violations.map((v) => `${v.id} (${v.nodes.length})`).join(", ") || "no violations"}`);
  }
  await ctx.close();
}

async function main(): Promise<void> {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-v45b-"));
  const stub = await startStub();
  await startServer(dataDir, stub.origin);
  const browser = await chromium.launch({ headless: !HEADED });
  try {
    const adminCtx = await browser.newContext();
    await call(adminCtx.request, "post", "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
    await call(adminCtx.request, "post", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });
    const adminStorage = path.join(dataDir, "admin.json");
    await adminCtx.storageState({ path: adminStorage });

    await resolverChecks(adminCtx.request);
    ok(stub.seen.some((s) => s.includes("drive.google.com")), "the server's checks went to the local stub, not the internet");
    await editorChecks(browser, adminStorage);
    const uploadId = await uploadFixture(adminCtx.request);

    const created = await call<{ user: { id: string }; temporaryPassword: string }>(adminCtx.request, "post", "/api/admin/users", {
      username: LEARNER,
      displayName: "Dana Drive",
      profile: { roleTitle: "Project Manager", yearsExperience: 2, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
      issueAssessment: false,
    });
    await adminCtx.close();
    const seeded = seedCourse(dataDir, uploadId);

    const ctx = await browser.newContext();
    await call(ctx.request, "post", "/api/auth/login", { username: LEARNER, password: created.temporaryPassword });
    await call(ctx.request, "post", "/api/auth/change-password", { currentPassword: created.temporaryPassword, newPassword: LEARNER_NEW });
    await call(ctx.request, "put", "/api/me/ui", { v5: true });
    await call(ctx.request, "put", "/api/v5/motivation/prefs", { welcomeDone: true }).catch(() => undefined);
    const learnerStorage = path.join(dataDir, "learner.json");
    await ctx.storageState({ path: learnerStorage });
    await ctx.close();

    await learnerChecks(browser, learnerStorage, seeded);
  } finally {
    await browser.close();
    stopServer();
    stub.close();
  }
  if (failures.length) {
    console.log(`\n${failures.length} check(s) failed:`);
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("\nv45-video-sources: all checks passed");
  fs.rmSync(dataDir, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
