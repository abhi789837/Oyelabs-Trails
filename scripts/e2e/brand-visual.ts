/**
 * Rebrand Phase 7: visual snapshots of the branded screens.
 *
 *   APP=$(bash scripts/e2e/snapshot-build.sh brand7)
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/brand-visual.ts             # compare with the baselines
 *   E2E_APP_DIR="$APP" npx tsx scripts/e2e/brand-visual.ts --update    # write new baselines
 *   bash scripts/e2e/snapshot-build.sh --remove brand7
 *
 * Screens: the sign-in page (desktop 1440 and mobile 390), learner Today, My plan and a lesson, the
 * admin inbox, the learner's certificate page (the server's picture), /design's certificate sample,
 * the public verify page, and the 404 page (the previous design's; v5 redirects unknown paths). Each
 * at 390 and 1440 px, light and dark.
 *
 * Certificate pictures are answered with the fixed server-drawn sample (each run has a new random
 * code and QR). Baselines: docs/branding/shots/<screen>-<width>-<theme>.png (in the repo). The theme is set
 * explicitly (localStorage `oyelabs-ui` before every load, and Playwright's colorScheme), and every
 * shot asserts that <html> has the `dark` class exactly when the shot is dark. Comparison, the fake
 * clocks, masking and scrubbing work as in v5-visual.ts (copied on purpose: no script imports
 * another): a screen fails when more than E2E_VISUAL_MAX_DIFF (0.05 %) of its pixels differ by more
 * than E2E_VISUAL_CHANNEL (24 of 255), or its size changed. Current shots and diffs go to
 * %TEMP%/claude/e2e-shots-brand-visual. E2E_VISUAL_ONLY=login,verify limits the screens;
 * E2E_VISUAL_WIDTHS=390 the widths.
 *
 * Port 8968, throwaway DATA_DIR, the mock AI.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

import Database from "better-sqlite3";
import { chromium, type APIRequestContext, type Browser, type BrowserContext, type Locator, type Page } from "playwright";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = path.resolve(process.env.E2E_APP_DIR ?? REPO);
const PORT = Number(process.env.E2E_PORT ?? 8968);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPER_USER = "admin";
const SUPER_INITIAL = "E2e-Super-Pass-2026!";
const SUPER_NEW = "Ridge-Camp-7319-Qv!";
const LEARNER_NEW = "Waypoint-Lantern-5824-Zk!";
const WAIT = 30_000;
const HEADED = process.env.E2E_HEADED === "1";
const UPDATE = process.argv.includes("--update");
const BASELINES = path.join(REPO, "docs", "branding", "shots");
const OUT = path.join(process.env.TEMP ?? os.tmpdir(), "claude", "e2e-shots-brand-visual");
const CHANNEL = Number(process.env.E2E_VISUAL_CHANNEL ?? 24);
const MAX_DIFF = Number(process.env.E2E_VISUAL_MAX_DIFF ?? 0.0005);
const ONLY = (process.env.E2E_VISUAL_ONLY ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const WIDTHS = (process.env.E2E_VISUAL_WIDTHS ?? "390,1440").split(",").map(Number);
const HEIGHT: Record<number, number> = { 390: 844, 768: 1024, 1280: 800, 1440: 900 };
const THEMES = ["light", "dark"] as const;
type Theme = (typeof THEMES)[number];

/** Server clock start (Monday 5 October 2026, 09:00 UTC); the browser sits two hours later. */
const FAKE_START = Date.UTC(2026, 9, 5, 9, 0, 0);
const CLIENT_NOW = FAKE_START + 2 * 3_600_000;
const DAY = 86_400_000;

const PLAN = ["js-closures", "js-hoisting", "js-call-stack"];
const QUIZ_TOPIC = "js-closures";

/** The fixed certificate picture the shots use (see openContext). */
const CERTIFICATE_SAMPLE = fs.readFileSync(path.join(APP, "public", "brand", "certificate", "certificate-sample.png"));

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

async function call<T>(request: APIRequestContext, method: "get" | "post" | "put", url: string, data?: unknown): Promise<T> {
  const response = await request[method](`${BASE}${url}`, { ...(data === undefined ? {} : { data }), timeout: WAIT });
  if (!response.ok()) throw new Error(`${method.toUpperCase()} ${url} -> ${response.status()} ${await response.text()}`);
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

// ---------------------------------------------------------------------------
// PNG decode / encode (8-bit RGB or RGBA, not interlaced: what Chromium writes)
// ---------------------------------------------------------------------------

interface Rgba {
  width: number;
  height: number;
  data: Uint8Array;
}

function decodePng(buf: Buffer): Rgba {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("latin1", pos + 4, pos + 8);
    const body = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      const depth = body[8];
      colorType = body[9];
      if (depth !== 8 || body[12] !== 0 || (colorType !== 2 && colorType !== 6)) throw new Error(`unsupported PNG (depth ${depth}, colour ${colorType}, interlace ${body[12]})`);
    } else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const pixels = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? pixels[dst + x - bpp] : 0;
      const b = y > 0 ? pixels[dst - stride + x] : 0;
      const c = x >= bpp && y > 0 ? pixels[dst - stride + x - bpp] : 0;
      let v = raw[src + x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      pixels[dst + x] = v & 0xff;
    }
  }
  if (bpp === 4) return { width, height, data: pixels };
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0, j = 0; i < pixels.length; i += 3, j += 4) {
    rgba[j] = pixels[i];
    rgba[j + 1] = pixels[i + 1];
    rgba[j + 2] = pixels[i + 2];
    rgba[j + 3] = 255;
  }
  return { width, height, data: rgba };
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function encodePng(img: Rgba): Buffer {
  const stride = img.width * 4;
  const raw = Buffer.alloc((stride + 1) * img.height);
  for (let y = 0; y < img.height; y++) Buffer.from(img.data.buffer, img.data.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  const chunk = (type: string, body: Buffer) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(body.length, 0);
    head.write(type, 4, "latin1");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
    return Buffer.concat([head, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.width, 0);
  ihdr.writeUInt32BE(img.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

/** Changed pixels, and a diff image: changed pixels red over a faded copy of the baseline. */
function compare(base: Rgba, cur: Rgba): { changed: number; total: number; diff: Rgba } {
  const diff = new Uint8Array(base.data.length);
  let changed = 0;
  for (let i = 0; i < base.data.length; i += 4) {
    const d = Math.max(Math.abs(base.data[i] - cur.data[i]), Math.abs(base.data[i + 1] - cur.data[i + 1]), Math.abs(base.data[i + 2] - cur.data[i + 2]), Math.abs(base.data[i + 3] - cur.data[i + 3]));
    if (d > CHANNEL) {
      changed++;
      diff[i] = 255;
      diff[i + 1] = 0;
      diff[i + 2] = 0;
    } else {
      const g = 200 + ((base.data[i] + base.data[i + 1] + base.data[i + 2]) / 3) * (55 / 255);
      diff[i] = diff[i + 1] = diff[i + 2] = g;
    }
    diff[i + 3] = 255;
  }
  return { changed, total: base.width * base.height, diff: { width: base.width, height: base.height, data: diff } };
}

// ---------------------------------------------------------------------------
// Server (on a fake clock)
// ---------------------------------------------------------------------------

/** A preload for the server: Date starts at FAKE_START and runs on from there. */
function writeClockPreload(dir: string): string {
  const file = path.join(dir, "fake-clock.cjs");
  fs.writeFileSync(
    file,
    `// Written by scripts/e2e/brand-visual.ts: a fake server clock for deterministic screenshots.
const RealDate = Date;
const offset = Number(process.env.E2E_FAKE_START) - RealDate.now();
class FakeDate extends RealDate {
  constructor(...args) { if (args.length === 0) super(RealDate.now() + offset); else super(...args); }
  static now() { return RealDate.now() + offset; }
}
globalThis.Date = FakeDate;
`,
  );
  return file;
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
    if (!fs.existsSync(path.join(APP, required))) throw new Error(`${required} is missing in ${APP}. Build a snapshot first (see the top of this file).`);
  }
  const logPath = path.join(dataDir, "server.log");
  const log = fs.createWriteStream(logPath);
  console.log(`serving:  ${APP}`);
  server = spawn(process.execPath, ["--require", writeClockPreload(dataDir), "dist-server/index.js"], {
    cwd: APP,
    env: {
      ...process.env,
      NODE_ENV: "development",
      TZ: "UTC",
      E2E_FAKE_START: String(FAKE_START),
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
  console.log(`server log: ${logPath}`);
  await poll("/api/health", 90_000, async () => {
    if (server?.exitCode !== null) throw new Error(`server exited early (${server?.exitCode}); see ${logPath}`);
    const res = await fetch(`${BASE}/api/health`).catch(() => null);
    return res?.ok ? true : null;
  });
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

interface QuizQ {
  id: string;
  options: string[];
  correctIndex: number;
  correctIndices?: number[];
}

interface Seeded {
  learnerStorage: string;
  adminStorage: string;
  personId: string;
  courseId: string;
  certId: string | null;
  /** Strings that differ per run and reach the screen, with what to show instead. */
  scrub: [string, string][];
}

async function newLearner(admin: APIRequestContext, browser: Browser, username: string, displayName: string, plan: string[] | null): Promise<{ id: string; ctx: BrowserContext }> {
  const created = await call<{ user: { id: string }; temporaryPassword: string }>(admin, "post", "/api/admin/users", {
    username,
    displayName,
    profile: { roleTitle: "Frontend Engineer", yearsExperience: 1, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] },
    issueAssessment: false,
  });
  if (plan) await call(admin, "put", `/api/admin/users/${created.user.id}/plan`, { topicIds: plan });
  const ctx = await browser.newContext();
  await call(ctx.request, "post", "/api/auth/login", { username, password: created.temporaryPassword });
  await call(ctx.request, "post", "/api/auth/change-password", { currentPassword: created.temporaryPassword, newPassword: LEARNER_NEW });
  await call(ctx.request, "put", "/api/me/ui", { v5: true });
  await call(ctx.request, "put", "/api/v5/motivation/prefs", { welcomeDone: true });
  return { id: created.user.id, ctx };
}

async function seed(browser: Browser, dataDir: string): Promise<Seeded> {
  step("seed: superadmin, a learner with a plan, notes, a mistake and a certificate, inbox items");
  const adminCtx = await browser.newContext();
  const admin = adminCtx.request;
  await call(admin, "post", "/api/auth/login", { username: SUPER_USER, password: SUPER_INITIAL });
  await call(admin, "post", "/api/auth/change-password", { currentPassword: SUPER_INITIAL, newPassword: SUPER_NEW });
  await call(admin, "put", "/api/me/ui", { v5: true });
  await call(admin, "put", "/api/v5/motivation/prefs", { welcomeDone: true }).catch(() => undefined);
  await call(admin, "put", "/api/admin/video-settings", { lockMode: "warn" });

  const learner = await newLearner(admin, browser, "priya.visual", "Priya Learner", PLAN);

  // Admin data: a course, people, an open review request, a stuck learner, a reported problem.
  const PROFILE = { roleTitle: "Frontend Engineer", yearsExperience: 2, adminNotes: "", claimedSkills: [], targetTracks: ["frontend"] };
  await call(admin, "post", "/api/admin/users", { username: "rahul.verma", displayName: "Rahul Verma", profile: PROFILE, issueAssessment: false });
  await call(admin, "post", "/api/admin/users", { username: "sana.iqbal", displayName: "Sana Iqbal", profile: PROFILE, issueAssessment: false });
  const { users } = await call<{ users: { id: string; username: string }[] }>(admin, "get", "/api/admin/users");
  const rahulId = users.find((u) => u.username === "rahul.verma")!.id;
  const stuckId = users.find((u) => u.username === "sana.iqbal")!.id;
  const course = (await call<{ course: { id: string } }>(admin, "post", "/api/admin/courses", { title: "How we ship", summary: "Our release steps.", accent: "glacier", audience: "everyone", published: false })).course;
  const withSection = (await call<{ course: { sections: { id: string }[] } }>(admin, "post", `/api/admin/courses/${course.id}/sections`, { title: "Basics", summary: "" })).course;
  await call(admin, "post", `/api/admin/courses/sections/${withSection.sections[0]!.id}/topics`, { title: "Release day", body: "We ship on **Tuesdays**.\n\n- Tag the build\n- Tell the team", links: [], estMinutes: 10 });

  // The learner: one wrong answer on a topic test (a mistake to fix), the code lesson opened to Do,
  // the hoisting lesson opened to Check.
  const lr = learner.ctx.request;
  const mod = JSON.parse(fs.readFileSync(path.join(APP, "server", "content", "frontend", "fe-js-core.json"), "utf8")) as { topics: { id: string; quiz?: QuizQ[] }[] };
  const quiz = mod.topics.find((t) => t.id === QUIZ_TOPIC)!.quiz!;
  const answers: Record<string, number[]> = {};
  for (const q of quiz) answers[q.id] = q.correctIndices && q.correctIndices.length > 1 ? q.correctIndices : [q.correctIndex];
  answers[quiz[0].id] = [quiz[0].options.findIndex((_, i) => !(answers[quiz[0].id] ?? []).includes(i))];
  await call(lr, "post", `/api/topics/${QUIZ_TOPIC}/attempt`, { kind: "quiz", answers });
  await call(lr, "put", "/api/v5/lessons/js-call-stack/state", { step: "do", stepDone: { watch: true, read: true } });
  await call(lr, "put", "/api/v5/lessons/js-hoisting/state", { step: "check", stepDone: { watch: true, read: true } });

  const db = new Database(path.join(dataDir, "oyelearn.db"));
  try {
    db.pragma("busy_timeout = 5000");
    // The server's clock is fake; rows written here use the same fake "now".
    const at = FAKE_START + 5 * 60_000;
    const insert = db.prepare("insert into lesson_notes (id, user_id, topic_id, video_id, at_sec, body, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?)");
    insert.run("e2e-n1", learner.id, "js-closures", "qikxEIxsXco", 125, "Closures keep the outer scope alive after the function returns.", at, at);
    insert.run("e2e-n2", learner.id, "js-hoisting", null, null, "let and const sit in the temporal dead zone.", at, at + 1);
    db.prepare(
      "insert into learner_goals (id, user_id, type, original_text, outcome, skill_ids, target_level, slider, position, status, achieved_at, source, created_at, updated_at) values (?, ?, 'text', ?, ?, ?, 3, 4, 99, 'achieved', ?, 'admin', ?, ?)",
    ).run("e2e-goal-1", learner.id, "Give a clear stand-up update", "Give a clear stand-up update", JSON.stringify(["ss-standup-updates"]), at, at, at);
    db.prepare("INSERT INTO review_requests (id, user_id, source, ref_id, status, learner_note, created_at) VALUES (?, ?, 'assessment_item', 'e2e-missing-item', 'open', 'I think my answer was right', ?)").run("e2e-review-1", rahulId, at - 3 * DAY);
    db.prepare("INSERT INTO learning_plans (id, user_id, version, source, topic_ids, published_at) VALUES (?, ?, 1, 'admin', ?, ?)").run(`e2e-plan-${stuckId}`, stuckId, JSON.stringify(["js-execution-context", "js-call-stack", "js-hoisting"]), at - 20 * DAY);
    db.prepare("INSERT INTO topic_progress (user_id, topic_id, status, attempts, completed_at, updated_at) VALUES (?, 'js-execution-context', 'completed', 1, ?, ?)").run(stuckId, at - 10 * DAY, at - 10 * DAY);
    db.prepare("INSERT INTO problem_reports (id, user_id, topic_id, step, message, status, created_at) VALUES (?, ?, 'js-call-stack', 'watch', 'The video stops halfway.', 'open', ?)").run("e2e-problem-1", stuckId, at - DAY);
  } finally {
    db.close();
  }
  const mine = await call<{ certificates: { id: string }[] }>(lr, "get", "/api/v5/certificates").catch(() => ({ certificates: [] as { id: string }[] }));
  const certId = mine.certificates[0]?.id ?? null;
  ok(certId, `a certificate was issued (${certId})`);

  const learnerStorage = path.join(dataDir, "learner.json");
  await learner.ctx.storageState({ path: learnerStorage });
  await learner.ctx.close();
  const adminStorage = path.join(dataDir, "admin.json");
  await adminCtx.storageState({ path: adminStorage });
  await adminCtx.close();
  const scrub: [string, string][] = certId ? [[certId, "C".repeat(certId.length)]] : [];
  return { learnerStorage, adminStorage, personId: rahulId, courseId: course.id, certId, scrub };
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

type Who = "learner" | "anon" | "admin";

interface Screen {
  name: string;
  who: Who;
  url: string;
  ready: (page: Page) => Promise<void>;
  /** Extra settling for charts that animate in JavaScript. */
  settleMs?: number;
  /** Shoot only this element (a /design demo), not the full page. */
  element?: (page: Page) => Locator;
}

const h1 = (name: RegExp | string = /./) => async (p: Page) => void (await p.getByRole("heading", { level: 1, name }).first().waitFor({ timeout: WAIT }));
const lesson = (extra?: (p: Page) => Locator) => async (p: Page) => {
  await p.getByTestId("v5-lesson").waitFor({ timeout: WAIT });
  if (extra) await extra(p).first().waitFor({ timeout: WAIT });
};

function screens(s: Seeded): Screen[] {
  const list: Screen[] = [
    // Desktop split screen and the phone's single column (brand guidelines p11).
    { name: "login", who: "anon", url: "/login", ready: h1("Welcome back") },
    { name: "today", who: "learner", url: "/learn", ready: async (p) => void (await p.getByTestId("today-continue").waitFor({ timeout: WAIT })) },
    { name: "plan", who: "learner", url: "/learn/plan", ready: h1("My plan") },
    { name: "lesson", who: "learner", url: `/learn/lesson/${QUIZ_TOPIC}?step=read`, ready: lesson((p) => p.getByRole("region", { name: "Key takeaways" })) },
  ];
  if (s.certId) {
    list.push({ name: "certificate", who: "learner", url: `/learn/certificate/${s.certId}`, ready: async (p) => {
      await h1()(p);
      // The certificate picture (answered with the fixed sample, see openContext).
      await p.locator('img[width="1754"]').first().waitFor({ timeout: WAIT });
    }, settleMs: 2500 });
    list.push({ name: "verify", who: "anon", url: `/verify/${s.certId}`, ready: async (p) => void (await p.getByRole("heading", { name: "This certificate is valid" }).waitFor({ timeout: WAIT })) });
  }
  list.push(
    { name: "admin-inbox", who: "admin", url: "/admin", ready: h1("Needs your attention") },
    // /design's CertificatePreview: the server-drawn sample (public/brand/certificate).
    { name: "design-certificate", who: "admin", url: "/design?ui=v5&all=1", element: (p) => p.locator("#c-certificate"), ready: async (p) => {
      const demo = p.locator("#c-certificate");
      await demo.waitFor({ timeout: WAIT });
      await demo.scrollIntoViewIfNeeded();
      await demo.locator("img").first().waitFor({ timeout: WAIT });
      await demo.locator("img").first().evaluate((img: HTMLImageElement) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })));
    } },
    // The previous design's 404, which staff can force with ?ui=old (v5 sends unknown paths home, so it has no 404).
    { name: "not-found", who: "admin", url: "/no-such-page?ui=old", ready: h1("This page isn't here") },
  );
  return ONLY.length ? list.filter((x) => ONLY.includes(x.name)) : list;
}

// ---------------------------------------------------------------------------
// Taking and comparing a shot
// ---------------------------------------------------------------------------

async function openContext(browser: Browser, storage: string | undefined, width: number, theme: Theme): Promise<BrowserContext> {
  const ctx = await browser.newContext({
    storageState: storage,
    viewport: { width, height: HEIGHT[width] ?? 900 },
    colorScheme: theme,
    reducedMotion: "reduce",
    timezoneId: "UTC",
    locale: "en-US",
    serviceWorkers: "block",
    // No isMobile: Chromium's full-page capture with mobile emulation resizes the viewport mid-shot,
    // which moves the fixed bottom nav and cuts content differently on each run. A 390 px viewport with
    // touch gives the same layout (the app has no user-agent checks).
    ...(width < 768 ? { hasTouch: true } : {}),
  });
  // The saved theme wins over colorScheme, so write it before every load.
  await ctx.addInitScript((t) => {
    try {
      window.localStorage.setItem("oyelabs-ui", JSON.stringify({ state: { theme: t, sidebarCollapsed: false }, version: 0 }));
    } catch {
      // ignore
    }
  }, theme);
  await ctx.clock.setFixedTime(new Date(CLIENT_NOW));
  // Headless Chromium on Windows sometimes reports navigator.onLine = false (seen on Review, which then
  // shows its offline banner while the server answers). The app's own "server unreachable" path is
  // untouched; only the browser's flag is pinned.
  // A string, not a function: tsx would wrap a function's arrows in its __name helper, which the page lacks.
  await ctx.addInitScript(`Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: function () { return true; } });
window.addEventListener("offline", function (e) { e.stopImmediatePropagation(); }, true);`);
  // Nothing outside the app (YouTube frames and thumbnails): the same blank every run.
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  // The server's certificate pictures print this run's random code and its QR. To keep the shots
  // stable (and still show a real certificate rather than a mask), they are answered with the
  // server-drawn sample /design uses (scripts/brand/certificate-sample.ts), at the same size.
  await ctx.route(/\/api\/v5\/certificates\/[^/]+\/(?:file|preview)\.png/, (route) => route.fulfill({ status: 200, contentType: "image/png", body: CERTIFICATE_SAMPLE }));
  return ctx;
}

async function settle(page: Page, extraMs = 0): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: WAIT }).catch(() => undefined);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; })));
  });
  await page.waitForTimeout(500 + extraMs);
}

async function scrubPage(page: Page, pairs: [string, string][]): Promise<void> {
  await page.evaluate((list) => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    window.scrollTo(0, 0);
    if (!list.length) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      let text = n.nodeValue ?? "";
      for (const [from, to] of list) if (text.includes(from)) text = text.split(from).join(to);
      if (text !== n.nodeValue) n.nodeValue = text;
    }
  }, pairs);
}

interface Row {
  name: string;
  status: "new" | "same" | "changed" | "size" | "missing" | "error";
  detail: string;
}
const rows: Row[] = [];

async function capture(page: Page, name: string, theme: Theme, s: Seeded, settleMs: number, element?: Locator): Promise<void> {
  await settle(page, settleMs);
  const dark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  if (!ok(dark === (theme === "dark"), `${name}: the page is in ${theme} mode`)) return;
  await scrubPage(page, s.scrub);
  const masks = [page.locator("iframe"), page.locator('svg[shape-rendering="crispEdges"]')];
  const take = () => (element ? element.screenshot({ animations: "disabled", caret: "hide", mask: masks, timeout: WAIT }) : page.screenshot({ fullPage: true, animations: "disabled", caret: "hide", mask: masks, timeout: WAIT }));
  let png = await take();
  const baseline = path.join(BASELINES, `${name}.png`);
  if (UPDATE) {
    fs.writeFileSync(baseline, png);
    rows.push({ name, status: "new", detail: "baseline written" });
    return;
  }
  if (!fs.existsSync(baseline)) {
    fs.writeFileSync(path.join(OUT, `${name}.png`), png);
    rows.push({ name, status: "missing", detail: "no baseline (run with --update)" });
    ok(false, `${name}: has a baseline`);
    return;
  }
  const base = decodePng(fs.readFileSync(baseline));
  let cur = decodePng(png);
  const matches = (c: Rgba) => c.width === base.width && c.height === base.height && compare(base, c).changed / (base.width * base.height) <= MAX_DIFF;
  if (!matches(cur)) {
    // One more look after a second: a late request or a timer can still be settling (seen once on the
    // phone inbox). A real change shows in both shots.
    await page.waitForTimeout(1000);
    png = await take();
    cur = decodePng(png);
    if (matches(cur)) note(`${name}: matched on the second shot`);
  }
  if (base.width !== cur.width || base.height !== cur.height) {
    fs.writeFileSync(path.join(OUT, `${name}.png`), png);
    rows.push({ name, status: "size", detail: `${base.width}×${base.height} → ${cur.width}×${cur.height}` });
    ok(false, `${name}: same size as the baseline (${base.width}×${base.height} → ${cur.width}×${cur.height})`);
    return;
  }
  const { changed, total, diff } = compare(base, cur);
  const share = changed / total;
  if (share > MAX_DIFF) {
    fs.writeFileSync(path.join(OUT, `${name}.png`), png);
    fs.writeFileSync(path.join(OUT, `${name}.diff.png`), encodePng(diff));
  }
  rows.push({ name, status: share > MAX_DIFF ? "changed" : "same", detail: `${changed} px (${(share * 100).toFixed(3)} %)` });
  ok(share <= MAX_DIFF, `${name}: matches the baseline (${changed} px differ, ${(share * 100).toFixed(3)} %)`);
}

/**
 * One unshot pass over every screen first, so whatever the server works out on a first visit (the
 * week plan, lazily awarded XP, review cards) is in place before any baseline is taken.
 */
async function warmUp(browser: Browser, s: Seeded, list: Screen[], storageFor: Record<Who, string | undefined>): Promise<void> {
  step("warm-up pass (not shot)");
  for (const who of ["learner", "anon", "admin"] as Who[]) {
    const mine = list.filter((x) => x.who === who);
    if (!mine.length) continue;
    const ctx = await openContext(browser, storageFor[who], 1440, "light");
    const page = await ctx.newPage();
    try {
      for (const screen of mine) {
        await page.goto(`${BASE}${screen.url}`, { waitUntil: "domcontentloaded", timeout: WAIT }).catch(() => undefined);
        await screen.ready(page).catch(() => undefined);
        await page.waitForLoadState("networkidle", { timeout: WAIT }).catch(() => undefined);
      }
    } finally {
      await ctx.close();
    }
  }
  await new Promise((r) => setTimeout(r, 2000));
}

async function run(browser: Browser, s: Seeded): Promise<void> {
  const list = screens(s);
  const storageFor: Record<Who, string | undefined> = { learner: s.learnerStorage, anon: undefined, admin: s.adminStorage };
  await warmUp(browser, s, list, storageFor);
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      step(`${width} ${theme}`);
      for (const who of ["learner", "anon", "admin"] as Who[]) {
        const mine = list.filter((x) => x.who === who);
        if (!mine.length) continue;
        const ctx = await openContext(browser, storageFor[who], width, theme);
        const page = await ctx.newPage();
        page.on("pageerror", (error) => note(`[pageerror ${width}/${theme}] ${error.message.split("\n")[0]}`));
        try {
          for (const screen of mine) {
            const name = `${screen.name}-${width}-${theme}`;
            try {
              // One retry: Windows can briefly run out of socket buffers (net::ERR_NO_BUFFER_SPACE) under load.
              await page.goto(`${BASE}${screen.url}`, { waitUntil: "domcontentloaded", timeout: WAIT }).catch(async () => {
                await page.waitForTimeout(2000);
                await page.goto(`${BASE}${screen.url}`, { waitUntil: "domcontentloaded", timeout: WAIT });
              });
              await screen.ready(page);
              await capture(page, name, theme, s, screen.settleMs ?? 0, screen.element?.(page));
            } catch (error) {
              rows.push({ name, status: "error", detail: String(error).split("\n")[0] });
              ok(false, `${name}: the screen opens (${String(error).split("\n")[0]})`);
              await page.screenshot({ path: path.join(OUT, `${name}.error.png`), fullPage: true }).catch(() => undefined);
            }
          }
        } finally {
          await ctx.close();
        }
      }
    }
  }
}

async function main(): Promise<void> {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(BASELINES, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-e2e-brandvisual-"));
  await startServer(dataDir);
  const browser = await chromium.launch({ headless: !HEADED });
  try {
    const s = await seed(browser, dataDir);
    await run(browser, s);
  } finally {
    await browser.close();
    stopServer();
  }
  const by = (st: Row["status"]) => rows.filter((r) => r.status === st);
  console.log(`\n${rows.length} shots: ${by("new").length} new, ${by("same").length} same, ${by("changed").length} changed, ${by("size").length} resized, ${by("missing").length} without a baseline, ${by("error").length} errors`);
  for (const r of rows.filter((x) => x.status !== "same" && x.status !== "new")) console.log(`  ${r.status.padEnd(8)} ${r.name}: ${r.detail}`);
  console.log(`baselines: ${BASELINES}`);
  console.log(`current shots and diffs: ${OUT}`);
  if (notes.length) console.log(`${notes.length} note(s)`);
  if (failures.length) {
    console.log(`\u001b[31m${failures.length} failure(s)\u001b[0m`);
    process.exit(1);
  }
  console.log("\u001b[32mall checks passed\u001b[0m");
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
