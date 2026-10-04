/**
 * Oyelearn v4.3 end-to-end check: the topic video playlist and the video lock.
 *
 *   npm run build          # once; this script serves dist/ + dist-server/ and does not rebuild
 *   npx tsx scripts/e2e/v43-video.ts
 *
 * 1. The superadmin onboards a learner (API) and publishes a plan holding `lv-api-exceptions`, a
 *    real topic with three short videos and an 11-question quiz.
 * 2. The learner opens the topic: the playlist lists 3 videos with i.ytimg.com thumbnails, one is
 *    current, the header says "Videos 0 of 3 watched", and the quiz is locked (the attempt API
 *    answers 409 `videos_unwatched`).
 * 3. Leaving with unwatched videos shows the "You have 3 videos left" prompt once.
 * 4. Real playback, when the sandbox can reach YouTube: play video 1 for a few seconds and check the
 *    server recorded progress, then jump to the end and check the "Up next" overlay (Play now,
 *    Cancel). Without network this is noted, not failed; the overlay's state machine is unit-tested
 *    in src/components/trail/upNext.test.ts.
 * 5. Watching is then simulated through the progress API exactly as the client samples it (20 s of
 *    video per 10 s of wall time, i.e. 2x). After a reload every entry shows "Watched ✓", the header
 *    says 3 of 3, the quiz is there and the attempt API accepts a submission.
 * 6. The camp page shows total and watched video time; the admin curriculum page has the lock switch.
 *
 * Throwaway DATA_DIR under %TEMP%, port 8802, mock AI (NODE_ENV=development). Screenshots go to
 * %TEMP%/claude/e2e-shots-v43 (override with E2E_SHOTS). E2E_HEADED=1 to watch. Exits non-zero
 * when any assertion fails, and always stops its server.
 *
 * Helpers are copied from v42-pm-processes.ts on purpose, so neither script's changes can break the other.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type APIRequestContext, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PORT = Number(process.env.E2E_PORT ?? 8802);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const SHOTS = process.env.E2E_SHOTS ?? path.join(os.tmpdir(), "claude", "e2e-shots-v43");
const HEADED = process.env.E2E_HEADED === "1";

const TOPIC = "lv-api-exceptions";
const TOPIC_URL = `/track/php/module/laravel-apis/topic/${TOPIC}`;
const MODULE_URL = "/track/php/module/laravel-apis";

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
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true }).catch(() => undefined);
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
      // Durations come from the content labels or the player, as in a deployment without a key.
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

// ---------------------------------------------------------------------------
// Auth
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

// ---------------------------------------------------------------------------
// The checks
// ---------------------------------------------------------------------------

interface VideoStateLite {
  key: string;
  videoId: string;
  title: string;
  durationSeconds: number | null;
  requiredSeconds: number | null;
  watchedSeconds: number;
  status: string;
  watched: boolean;
  segment: { start: number; end: number | null };
}
interface TopicVideosLite {
  videos: VideoStateLite[];
  watchedCount: number;
  total: number;
  locked: boolean;
  lockMode: string;
}

const playlist = (page: Page) => page.getByRole("list", { name: "Videos in this topic" });

async function run(admin: Page, stamp: string, c: Checks): Promise<void> {
  const browser = admin.context().browser()!;
  const username = `e2e.video.${stamp}`;

  step("onboard a learner and publish a plan with the topic");
  const created = await sendJson<{ user: { id: string }; temporaryPassword: string }>(admin.request, "post", "/api/admin/users", {
    username,
    displayName: "E2E v4.3 Video",
    issueAssessment: false,
    profile: {
      roleTitle: "Backend Engineer",
      yearsExperience: 2,
      adminNotes: "Video playlist end-to-end check.",
      claimedSkills: [{ area: "PHP", level: 2 }],
      targetTracks: ["php"],
    },
  });
  await sendJson(admin.request, "put", `/api/admin/users/${created.user.id}/plan`, { topicIds: [TOPIC] });
  const settings = await getJson<{ lockMode: string }>(admin.request, "/api/admin/video-settings");
  c.ok(settings.lockMode === "lock", `the lock mode defaults to lock (got ${settings.lockMode})`);

  const learnerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await learnerCtx.newPage();
  page.on("pageerror", (error) => console.log(`    [learner pageerror] ${error.message}`));
  try {
    await signIn(page, username, created.temporaryPassword, LEARNER_NEW);

    // ---- 2. The playlist and the lock ----
    step("open the topic");
    await page.goto(`${BASE}${TOPIC_URL}`, { waitUntil: "domcontentloaded" });
    await playlist(page).waitFor({ timeout: 30_000 });
    const items = playlist(page).getByRole("listitem");
    c.ok((await items.count()) === 3, `the playlist shows 3 entries (got ${await items.count()})`);
    const thumbs = await playlist(page).locator("img").evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).getAttribute("src") ?? ""));
    c.ok(thumbs.length === 3 && thumbs.every((s) => /^https:\/\/i\.ytimg\.com\/vi\/[\w-]+\/mqdefault\.jpg$/.test(s)), `each entry has an i.ytimg.com thumbnail (${thumbs.length})`);
    const alts = await playlist(page).locator("img").evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt")));
    c.ok(alts.every((a) => a === ""), "thumbnails are decorative (alt=\"\")");
    c.ok((await playlist(page).locator('button[aria-current="true"]').count()) === 1, "exactly one entry is current (aria-current)");
    c.ok(await page.getByText("Videos 0 of 3 watched").isVisible(), "header: Videos 0 of 3 watched");
    const lockedRegion = page.getByRole("region", { name: "Test locked" });
    c.ok(await lockedRegion.isVisible(), "the quiz is locked behind the videos");
    c.ok((await lockedRegion.getByRole("button").count()) === 3, "the lock lists the 3 videos left, each a button to play it");
    const blocked = await page.request.post(`${BASE}/api/topics/${TOPIC}/attempt`, { data: { kind: "quiz", answers: {} } });
    const blockedBody = (await blocked.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
    c.ok(blocked.status() === 409 && blockedBody.error?.code === "videos_unwatched", `the attempt API refuses: ${blocked.status()} ${blockedBody.error?.code} "${blockedBody.error?.message}"`);
    await shot(page, "01-topic-locked");

    // Autoplay preference toggle.
    const autoplay = page.getByRole("switch", { name: "Autoplay" });
    c.ok((await autoplay.getAttribute("aria-checked")) === "true", "autoplay next is on by default");
    await autoplay.click();
    const prefsOff = await poll("prefs saved", 10_000, async () => {
      const p = await getJson<{ autoplayNext: boolean }>(page.request, "/api/me/prefs");
      return p.autoplayNext === false ? p : null;
    }, 300).catch(() => null);
    c.ok(prefsOff !== null, "turning autoplay off is saved for the learner");
    await autoplay.click();

    // ---- 3. Leaving with videos left ----
    step("try to leave the topic");
    const leaveLink = page.getByRole("navigation", { name: "Topic navigation" }).getByRole("link").last();
    await leaveLink.click();
    const prompt = page.getByRole("alertdialog");
    c.ok(await prompt.isVisible().catch(() => false), "a leave prompt appears");
    c.ok(/You have 3 videos left/.test((await prompt.textContent().catch(() => "")) ?? ""), "it says: You have 3 videos left");
    c.ok(page.url().endsWith(TOPIC_URL), "still on the topic");
    await shot(page, "02-leave-prompt");
    await page.getByRole("button", { name: "Stay and watch" }).click();
    c.ok(!(await prompt.isVisible().catch(() => false)), "Stay and watch closes it");

    // ---- 4. Real playback when YouTube is reachable ----
    step("real playback (needs network)");
    const frame = page.frameLocator('iframe[src*="youtube.com/embed"]');
    const iframeUp = await page
      .locator('iframe[src*="youtube.com/embed"]')
      .waitFor({ timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    if (!iframeUp) {
      c.note("the YouTube IFrame API did not load (no network?); real playback skipped");
    } else {
      c.ok(true, "the YouTube IFrame Player API created the player (enablejsapi)");
      const src = (await page.locator('iframe[src*="youtube.com/embed"]').getAttribute("src")) ?? "";
      c.ok(/enablejsapi=1/.test(src) && src.includes(`origin=${encodeURIComponent(BASE)}`), "the embed URL has enablejsapi=1 and the origin");
      const played = await (async () => {
        await frame.locator(".ytp-large-play-button, button[aria-label*='Play']").first().click({ timeout: 15_000 });
        return poll("server-side progress from real playback", 40_000, async () => {
          const s = await getJson<TopicVideosLite>(page.request, `/api/me/topics/${TOPIC}/videos`);
          return s.videos[0].watchedSeconds > 0 ? s : null;
        }, 2000);
      })().catch((error: Error) => {
        c.note(`real playback did not produce progress (${error.message.split("\n")[0]}); falling back to the API`);
        return null;
      });
      if (played) {
        c.ok(true, `real playback was sampled and recorded (${played.videos[0].watchedSeconds}s of video 1)`);
        // Jump near the end: the seek is not counted, and ENDED brings up the overlay.
        const iframeEl = await page.locator('iframe[src*="youtube.com/embed"]').elementHandle();
        const inner = await iframeEl?.contentFrame();
        await inner?.evaluate(() => {
          const video = document.querySelector("video");
          if (video) video.currentTime = Math.max(0, video.duration - 2);
        });
        const overlay = page.getByRole("group", { name: "Up next" });
        const shown = await overlay.waitFor({ timeout: 20_000 }).then(() => true).catch(() => false);
        if (c.ok(shown, "the Up next overlay appears when the video ends")) {
          c.ok(await overlay.getByRole("button", { name: "Play now" }).isVisible(), "it offers Play now");
          c.ok(/in \ds/.test((await overlay.textContent()) ?? ""), "it counts down");
          c.ok(await page.evaluate(() => document.activeElement?.textContent?.includes("Play now") ?? false), "focus moved to Play now");
          await shot(page, "03-up-next");
          await overlay.getByRole("button", { name: "Cancel" }).click();
          c.ok(!(await overlay.isVisible().catch(() => false)), "Cancel dismisses it");
        }
        const afterSeek = await getJson<TopicVideosLite>(page.request, `/api/me/topics/${TOPIC}/videos`);
        c.ok(!afterSeek.videos[0].watched, `jumping to the end did not mark video 1 watched (${afterSeek.videos[0].watchedSeconds}s counted)`);
      }
    }

    // ---- 5. Simulated watching through the progress API ----
    step("watch all three videos (progress samples through the API)");
    let state = await getJson<TopicVideosLite>(page.request, `/api/me/topics/${TOPIC}/videos`);
    for (const v of state.videos) {
      const end = v.requiredSeconds ?? v.durationSeconds ?? 0;
      c.ok(end > 0, `video ${v.videoId} has a known length (${end}s)`);
      for (let t = v.segment.start; t < v.segment.start + end; t += 20) {
        const to = Math.min(v.segment.start + end, t + 20);
        state = await sendJson<TopicVideosLite>(page.request, "post", `/api/me/topics/${TOPIC}/videos/${v.videoId}/progress`, {
          from: t,
          to,
          position: to,
          elapsed: 10,
        });
      }
    }
    c.ok(state.watchedCount === 3 && !state.locked, `server: 3 of 3 watched, unlocked (${state.watchedCount}/${state.total}, locked=${state.locked})`);

    await page.reload({ waitUntil: "domcontentloaded" });
    await playlist(page).waitFor({ timeout: 30_000 });
    const watchedMarks = await playlist(page).getByText("Watched ✓").count();
    c.ok(watchedMarks === 3, `every entry shows Watched ✓ (${watchedMarks})`);
    c.ok(await page.getByText("Videos 3 of 3 watched").isVisible(), "header: Videos 3 of 3 watched");
    c.ok(!(await page.getByRole("region", { name: "Test locked" }).isVisible().catch(() => false)), "the lock is gone");
    c.ok(await page.getByRole("heading", { name: "Checkpoint quiz" }).isVisible(), "the quiz is there");
    const allowed = await page.request.post(`${BASE}/api/topics/${TOPIC}/attempt`, { data: { kind: "quiz", answers: {} } });
    c.ok(allowed.status() === 200, `the attempt API accepts a submission now (${allowed.status()})`);
    await shot(page, "04-topic-unlocked");

    // Leaving now asks nothing.
    await page.getByRole("navigation", { name: "Topic navigation" }).getByRole("link").first().click();
    await page.waitForTimeout(500);
    c.ok(!(await page.getByRole("alertdialog").isVisible().catch(() => false)), "leaving after watching everything asks nothing");

    // ---- 6. Camp totals and the admin switch ----
    step("camp totals and the admin switch");
    await page.goto(`${BASE}${MODULE_URL}`, { waitUntil: "domcontentloaded" });
    const totals = page.getByText(/of video \(3 videos\), .* watched/);
    const totalsShown = await totals.waitFor({ timeout: 15_000 }).then(() => true).catch(() => false);
    c.ok(totalsShown, `the camp page shows total and watched video time${totalsShown ? `: "${await totals.textContent()}"` : ""}`);
    await shot(page, "05-camp-totals");

    await admin.goto(`${BASE}/admin/curriculum`, { waitUntil: "domcontentloaded" });
    // v4.3 Phase 6 collapsed this rarely changed site-wide setting into a <details> section.
    const summary = admin.locator("summary", { hasText: "Topic videos" });
    await summary.waitFor({ timeout: 20_000 });
    const summaryText = await poll("the video settings to load", 15_000, async () => {
      const text = (await summary.textContent()) ?? "";
      return text.includes("…") ? null : text;
    }, 300).catch(() => "");
    c.ok(/Lock the test/.test(summaryText), `the collapsed section's summary shows the current choice ("${summaryText.trim()}")`);
    await summary.click();
    const lockRadio = admin.getByRole("radio", { name: /Lock the test/ });
    const lockVisible = await lockRadio.waitFor({ timeout: 20_000 }).then(() => true).catch(() => false);
    c.ok(lockVisible && (await lockRadio.getAttribute("aria-checked")) === "true", "admin curriculum: the lock switch shows Lock the test");
    if (lockVisible) {
      await admin.getByRole("radio", { name: /Warn only/ }).click();
      const saved = await poll("warn saved", 10_000, async () => {
        const s = await getJson<{ lockMode: string }>(admin.request, "/api/admin/video-settings");
        return s.lockMode === "warn" ? s : null;
      }, 300).catch(() => null);
      c.ok(saved !== null, "switching to Warn only is saved");
      await sendJson(admin.request, "put", "/api/admin/video-settings", { lockMode: "lock" });
    }
    await shot(admin, "06-admin-switch");
  } catch (error) {
    c.failures.push(`aborted: ${(error as Error).message.split("\n")[0]}`);
    console.log(`    \u001b[31mABORT\u001b[0m ${(error as Error).stack ?? error}`);
    await shot(page, "99-learner-at-failure");
  } finally {
    await learnerCtx.close().catch(() => undefined);
  }
}

async function main(): Promise<number> {
  fs.mkdirSync(SHOTS, { recursive: true });
  const stamp = Date.now().toString(36);
  const dataDir = path.join(os.tmpdir(), `oyelearn-e2e43v-${stamp}`);
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`data dir: ${dataDir}\nshots:    ${SHOTS}`);

  await startServer(dataDir);
  const browser = await chromium.launch({ headless: !HEADED, args: ["--autoplay-policy=no-user-gesture-required"] });
  const c = new Checks("Topic video playlist and lock (v4.3)");
  try {
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const admin = await adminCtx.newPage();
    admin.on("pageerror", (error) => console.log(`    [admin pageerror] ${error.message}`));
    console.log("\nsuperadmin signs in (first login changes the password)");
    await signIn(admin, SUPER_USER, SUPER_INITIAL, SUPER_NEW);
    console.log(`\n=== ${c.name} ===`);
    await run(admin, stamp, c);
  } finally {
    await browser.close().catch(() => undefined);
    stopServer();
  }

  console.log("\n=== Summary ===");
  const verdict = c.failures.length === 0 ? "\u001b[32mPASS\u001b[0m" : "\u001b[31mFAIL\u001b[0m";
  console.log(`${verdict}  ${c.name}${c.failures.length ? ` (${c.failures.length} failed)` : ""}`);
  for (const f of c.failures) console.log(`        - ${f}`);
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
