import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { localClock, RECAP_KIND, REMINDER_EMAIL_KIND, REMINDER_KIND, type LeaderboardResponse, type MotivationAdminSettings, type MotivationSummary } from "../../../../shared/motivation";
import { schema } from "../../db";
import { newId } from "../../lib/ids";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../../test/harness";
import { drainOutbox, emailConfigFromEnv, resolveAddress, type MailMessage } from "../email/sender";
import { emailSetupIssue } from "../email/setup";
import { awardXp } from "../xp/repo";
import { queueWeeklyRecaps, sendDueReminders } from "./jobs";
import { writePrefs } from "./prefs";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
});

afterEach(async () => {
  await ctx.close();
});

async function req<T>(method: "GET" | "PUT" | "POST", url: string, session: Session = learner.session, payload?: unknown): Promise<{ status: number; body: T }> {
  const res = await ctx.app.inject({ method, url, ...as(session), ...(payload !== undefined ? { payload: payload as object } : {}) });
  return { status: res.statusCode, body: res.json() as T };
}

function reminders(userId = learner.id) {
  return ctx.db.select().from(schema.notifications).where(and(eq(schema.notifications.recipientId, userId), eq(schema.notifications.kind, REMINDER_KIND))).all();
}

function outbox(kind?: string) {
  const rows = ctx.db.select().from(schema.emailOutbox).all();
  return kind ? rows.filter((r) => r.kind === kind) : rows;
}

/** A UTC instant whose clock in UTC reads hh:mm on 2026-10-06 (a Tuesday). */
const at = (hh: number, mm = 0, day = 6) => Date.UTC(2026, 9, day, hh, mm);

describe("GET /api/v5/motivation", () => {
  test("XP, unread count, prefs and the board switch in one call; new awards after `since`", async () => {
    const first = await req<MotivationSummary>("GET", "/api/v5/motivation");
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ xp: { total: 0, thisWeek: 0 }, events: [], leaderboards: false });
    expect(first.body.prefs).toMatchObject({ celebrations: true, reducedMotion: "system", weeklyGoalHours: null, leaderboardOptIn: false, welcomeDoneAt: null });

    awardXp(ctx.db, learner.id, "lesson_completed", "topic-a");
    const next = await req<MotivationSummary>("GET", `/api/v5/motivation?since=${first.body.serverTime - 1}`);
    expect(next.body.xp.total).toBe(30);
    expect(next.body.events).toEqual([expect.objectContaining({ kind: "lesson_completed", refId: "topic-a", xp: 30 })]);
  });

  test("needs a signed-in user", async () => {
    expect((await ctx.app.inject({ method: "GET", url: "/api/v5/motivation" })).statusCode).toBe(401);
  });
});

describe("PUT /api/v5/motivation/prefs", () => {
  test("sets the weekly goal, the welcome and the time zone; keeps other keys", async () => {
    writePrefs(ctx.db, learner.id, { uiV5: true, theme: "dark" });
    const saved = await req<{ prefs: MotivationSummary["prefs"] }>("PUT", "/api/v5/motivation/prefs", learner.session, { weeklyGoalHours: 3, welcomeDone: true, timeZone: "Asia/Kolkata" });
    expect(saved.status).toBe(200);
    expect(saved.body.prefs).toMatchObject({ weeklyGoalHours: 3, timeZone: "Asia/Kolkata" });
    expect(saved.body.prefs.welcomeDoneAt).toEqual(expect.any(Number));
    const data = ctx.db.select().from(schema.userPrefs).where(eq(schema.userPrefs.userId, learner.id)).get()!.data;
    expect(data).toMatchObject({ uiV5: true, theme: "dark", weeklyGoalHours: 3 });

    // Today's goal ring reads the same key.
    const today = await req<{ goal: { goalMinutes: number | null } }>("GET", "/api/v5/today");
    expect(today.body.goal.goalMinutes).toBe(180);

    const cleared = await req<{ prefs: MotivationSummary["prefs"] }>("PUT", "/api/v5/motivation/prefs", learner.session, { weeklyGoalHours: null, welcomeDone: false });
    expect(cleared.body.prefs).toMatchObject({ weeklyGoalHours: null, welcomeDoneAt: null });
  });

  test("rejects nonsense", async () => {
    expect((await req("PUT", "/api/v5/motivation/prefs", learner.session, { weeklyGoalHours: 100 })).status).toBe(400);
    expect((await req("PUT", "/api/v5/motivation/prefs", learner.session, { weeklyGoalHours: 1.3 })).status).toBe(400);
    expect((await req("PUT", "/api/v5/motivation/prefs", learner.session, { timeZone: "Mars/Base" })).status).toBe(400);
    expect((await req("PUT", "/api/v5/motivation/prefs", learner.session, { uiV5: false })).status).toBe(400);
  });
});

describe("team boards", () => {
  test("off by default; a super admin turns them on (audited); only opted-in learners show", async () => {
    const off = await req<LeaderboardResponse>("GET", "/api/v5/leaderboard");
    expect(off.body).toMatchObject({ enabled: false, board: null });

    expect((await req("PUT", "/api/admin/motivation/leaderboards", learner.session, { on: true })).status).toBe(403);
    const on = await req<{ leaderboards: boolean }>("PUT", "/api/admin/motivation/leaderboards", admin, { on: true });
    expect(on.body.leaderboards).toBe(true);
    const audit = ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "motivation.leaderboards")).all();
    expect(audit).toHaveLength(1);

    const other = await activeLearner(ctx, admin, "rahul.verma");
    awardXp(ctx.db, other.id, "lesson_completed", "x");
    awardXp(ctx.db, learner.id, "step_completed", "y:read");

    // Nobody opted in yet.
    expect((await req<LeaderboardResponse>("GET", "/api/v5/leaderboard")).body.board).toMatchObject({ entries: [], size: 0 });

    await req("PUT", "/api/v5/motivation/prefs", other.session, { leaderboardOptIn: true });
    const seen = await req<LeaderboardResponse>("GET", "/api/v5/leaderboard");
    expect(seen.body).toMatchObject({ enabled: true, optedIn: false });
    expect(seen.body.board!.entries).toEqual([{ firstName: expect.any(String), xp: 30, you: false }]);

    await req("PUT", "/api/v5/motivation/prefs", learner.session, { leaderboardOptIn: true });
    const joined = await req<LeaderboardResponse>("GET", "/api/v5/leaderboard");
    expect(joined.body.optedIn).toBe(true);
    expect(joined.body.board!.entries.map((e) => [e.xp, e.you])).toEqual([
      [30, false],
      [10, true],
    ]);

    const settings = await req<MotivationAdminSettings>("GET", "/api/admin/motivation", admin);
    expect(settings.body.leaderboards).toBe(true);
    expect((await req("GET", "/api/admin/motivation", learner.session)).status).toBe(403);
  });
});

describe("reminders", () => {
  beforeEach(() => {
    writePrefs(ctx.db, learner.id, { reminderTime: "18:00", timeZone: "UTC" });
  });

  test("at most one a day, enforced in code, with an email copy", () => {
    expect(sendDueReminders(ctx.db, ctx.content, "https://x.test", at(17, 59))[0].decision).toEqual({ send: false, reason: "too_early" });
    expect(sendDueReminders(ctx.db, ctx.content, "https://x.test", at(18, 5))[0].decision).toEqual({ send: true });
    expect(sendDueReminders(ctx.db, ctx.content, "https://x.test", at(19, 5))[0].decision).toEqual({ send: false, reason: "already_sent" });
    expect(sendDueReminders(ctx.db, ctx.content, "https://x.test", at(20, 5))[0].decision).toEqual({ send: false, reason: "already_sent" });
    expect(reminders()).toHaveLength(1);
    expect(outbox(REMINDER_EMAIL_KIND)).toHaveLength(1);
    // The next day is a new day.
    expect(sendDueReminders(ctx.db, ctx.content, "https://x.test", at(18, 30, 7))[0].decision).toEqual({ send: true });
    expect(reminders()).toHaveLength(2);
  });

  test("no reminder when they already learned today", () => {
    awardXp(ctx.db, learner.id, "step_completed", "t:read", { at: at(9) });
    expect(sendDueReminders(ctx.db, ctx.content, "https://x.test", at(18, 5))[0].decision).toEqual({ send: false, reason: "learned_today" });
    // Yesterday's learning doesn't count for today.
    expect(sendDueReminders(ctx.db, ctx.content, "https://x.test", at(18, 5, 7))[0].decision).toEqual({ send: true });
  });

  test("quiet hours hold it back; it goes out once they end", () => {
    writePrefs(ctx.db, learner.id, { quietHours: { from: "17:30", to: "19:00" } });
    expect(sendDueReminders(ctx.db, ctx.content, "https://x.test", at(18, 5))[0].decision).toEqual({ send: false, reason: "quiet_hours" });
    expect(sendDueReminders(ctx.db, ctx.content, "https://x.test", at(19, 5))[0].decision).toEqual({ send: true });
    expect(reminders()).toHaveLength(1);
  });

  test("the learner's own time zone decides the day and the time", () => {
    writePrefs(ctx.db, learner.id, { timeZone: "Asia/Kolkata" });
    const t = at(12, 35); // 18:05 in Kolkata
    expect(localClock(t, "Asia/Kolkata").minutes).toBe(18 * 60 + 5);
    expect(sendDueReminders(ctx.db, ctx.content, "https://x.test", t)[0].decision).toEqual({ send: true });
  });

  test("no time set, nothing sent", () => {
    writePrefs(ctx.db, learner.id, { reminderTime: null });
    expect(sendDueReminders(ctx.db, ctx.content, "https://x.test", at(18, 5))).toEqual([]);
  });
});

describe("weekly recaps", () => {
  test("queued once per learner per week, in the window, and not when turned off", () => {
    const monday = new Date(2026, 9, 12, 8, 30).getTime(); // Monday 12 Oct 2026, 08:30 local
    expect(queueWeeklyRecaps(ctx.db, ctx.content, { appUrl: "https://x.test", nowMs: monday - 3600_000 })).toBe(0);
    expect(queueWeeklyRecaps(ctx.db, ctx.content, { appUrl: "https://x.test", nowMs: monday })).toBe(1);
    expect(queueWeeklyRecaps(ctx.db, ctx.content, { appUrl: "https://x.test", nowMs: monday + 3600_000 })).toBe(0);
    const rows = outbox(RECAP_KIND);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ toUserId: learner.id, toAddress: learner.username, status: "queued" });
    expect(rows[0].text).toContain("Open Today: https://x.test/learn");
    expect(rows[0].html).toContain("<!doctype html>");

    // A week later: again. With the weekly email off: not.
    expect(queueWeeklyRecaps(ctx.db, ctx.content, { appUrl: "https://x.test", nowMs: monday + 7 * 86_400_000 })).toBe(1);
    writePrefs(ctx.db, learner.id, { weeklyEmail: false });
    expect(queueWeeklyRecaps(ctx.db, ctx.content, { appUrl: "https://x.test", nowMs: monday + 14 * 86_400_000 })).toBe(0);
  });

  test("the admin 'run now' forces recaps outside the window", async () => {
    const res = await req<{ recaps: number; email: { skipped: number } }>("POST", "/api/admin/motivation/run", admin, { recaps: true });
    expect(res.status).toBe(200);
    expect(res.body.recaps).toBe(1);
    expect((await req("POST", "/api/admin/motivation/run", learner.session, {})).status).toBe(403);
  });
});

describe("the email sender", () => {
  function queue(toAddress: string, kind = "admin.weekly_report") {
    ctx.db.insert(schema.emailOutbox).values({ id: newId(), toUserId: learner.id, toAddress, kind, subject: "Hello", html: "<p>Hi</p>", text: "Hi", status: "queued", createdAt: Date.now() }).run();
  }

  test("config from the environment", () => {
    expect(emailConfigFromEnv({}).ok).toBe(false);
    expect(emailConfigFromEnv({ SMTP_URL: "smtp://localhost:2525" })).toMatchObject({ ok: false, reason: expect.stringContaining("MAIL_FROM") });
    expect(emailConfigFromEnv({ SMTP_URL: "smtp://localhost:2525", MAIL_FROM: "Oyelearn <l@o.com>", MAIL_DOMAIN: "@oyelabs.com" })).toEqual({
      ok: true,
      config: { smtp: "smtp://localhost:2525", from: "Oyelearn <l@o.com>", domain: "oyelabs.com" },
    });
    expect(emailConfigFromEnv({ SMTP_HOST: "mail", SMTP_PORT: "465", SMTP_USER: "bot@o.com", SMTP_PASS: "pw" })).toEqual({
      ok: true,
      config: { smtp: { host: "mail", port: 465, secure: true, auth: { user: "bot@o.com", pass: "pw" } }, from: "bot@o.com", domain: null },
    });
    expect(resolveAddress("tara@x.com", null)).toBe("tara@x.com");
    expect(resolveAddress("tara.today", "oyelabs.com")).toBe("tara.today@oyelabs.com");
    expect(resolveAddress("tara.today", null)).toBeNull();
  });

  test("sends queued rows through the transport, including the admin weekly report", async () => {
    queue("admin");
    queue("tara@example.com", RECAP_KIND);
    const sent: MailMessage[] = [];
    const result = await drainOutbox(ctx.db, {
      config: { ok: true, config: { smtp: "smtp://fake", from: "Oyelearn <l@o.com>", domain: "oyelabs.com" } },
      transport: { sendMail: async (m) => void sent.push(m) },
    });
    expect(result).toEqual({ sent: 2, failed: 0, skipped: 0 });
    expect(sent.map((m) => m.to)).toEqual(["admin@oyelabs.com", "tara@example.com"]);
    expect(sent[0]).toMatchObject({ from: "Oyelearn <l@o.com>", subject: "Hello", text: "Hi", html: "<p>Hi</p>" });
    expect(outbox().every((r) => r.status === "sent" && r.sentAt !== null)).toBe(true);
    // Nothing left: a second drain does nothing.
    expect(await drainOutbox(ctx.db, { config: { ok: true, config: { smtp: "x", from: "a@b.co", domain: null } }, transport: { sendMail: async () => undefined } })).toEqual({ sent: 0, failed: 0, skipped: 0 });
  });

  test("without SMTP, rows are skipped with a plain reason and the admin inbox says so", async () => {
    expect(emailSetupIssue(ctx.db, Date.now(), {})).toBeNull();
    queue("admin");
    const result = await drainOutbox(ctx.db, { config: emailConfigFromEnv({}) });
    expect(result).toEqual({ sent: 0, failed: 0, skipped: 1 });
    expect(outbox()[0]).toMatchObject({ status: "skipped", error: expect.stringContaining("Email isn't set up yet") });
    expect(emailSetupIssue(ctx.db, Date.now(), {})).toMatchObject({ title: "Email isn't set up yet" });
    expect(emailSetupIssue(ctx.db, Date.now(), { SMTP_URL: "smtp://x", MAIL_FROM: "a@b.co" })).toBeNull();
  });

  test("a refused message is marked failed; an unknown address is skipped", async () => {
    queue("no-domain-user");
    queue("tara@example.com");
    const result = await drainOutbox(ctx.db, {
      config: { ok: true, config: { smtp: "x", from: "a@b.co", domain: null } },
      transport: {
        sendMail: async () => {
          throw new Error("550 mailbox unavailable");
        },
      },
    });
    expect(result).toEqual({ sent: 0, failed: 1, skipped: 1 });
    const rows = outbox();
    expect(rows.find((r) => r.toAddress === "no-domain-user")).toMatchObject({ status: "skipped", error: expect.stringContaining("MAIL_DOMAIN") });
    expect(rows.find((r) => r.toAddress === "tara@example.com")).toMatchObject({ status: "failed", error: expect.stringContaining("550") });
  });
});
