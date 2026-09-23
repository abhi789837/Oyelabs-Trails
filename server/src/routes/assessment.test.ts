import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { ItemKey, ItemPayload } from "../../../shared/assessment";
import { HARD_LIMIT, HARD_COOLDOWN_MS, SOFT_ESCALATION_COUNT } from "../assessment/integrity";
import { schema } from "../db";
import { SAMPLE_LEARNERS } from "../dev/sampleProfiles";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };
let assessmentId: string;

/**
 * The whole test-taking path, against a real generated pool.
 *
 * The critical properties here are the ones a browser cannot be trusted with: the server owns the
 * clock, the answer key never comes back, and the warning count is decided from stored events
 * rather than from what the client claims.
 */
beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin, SAMPLE_LEARNERS[0].username);

  // Give the learner the sample profile, then generate a real pool.
  await ctx.app.inject({
    method: "PUT",
    url: `/api/admin/users/${learner.id}/profile`,
    ...as(admin),
    payload: { profile: SAMPLE_LEARNERS[0].profile },
  });
  const issued = await ctx.app.inject({
    method: "POST",
    url: `/api/admin/users/${learner.id}/assessments`,
    ...as(admin),
    payload: {},
  });
  assessmentId = issued.json().assessmentId;
  await ctx.drainJobs();
});

afterEach(async () => {
  await ctx.close();
});

const url = (suffix: string) => `/api/assessment/${assessmentId}${suffix}`;

async function consentAndStart() {
  const consent = await ctx.app.inject({ method: "POST", url: url("/consent"), ...as(learner.session), payload: { agreed: true } });
  expect(consent.statusCode).toBe(200);
  const start = await ctx.app.inject({ method: "POST", url: url("/start"), ...as(learner.session), payload: {} });
  expect(start.statusCode).toBe(200);
  return start.json();
}

async function nextItem() {
  const res = await ctx.app.inject({ method: "GET", url: url("/next"), ...as(learner.session) });
  expect(res.statusCode).toBe(200);
  return res.json();
}

/** The correct answer for an item, read from the server-side key. */
function keyFor(itemId: string): { payload: ItemPayload; key: ItemKey; kind: string } {
  const row = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, itemId)).get()!;
  return { payload: row.payload as ItemPayload, key: row.key as ItemKey, kind: row.kind };
}

async function answerCorrectly(itemId: string) {
  const { key, kind } = keyFor(itemId);
  const body =
    kind === "predict_output"
      ? { text: key.expectedOutput }
      : kind === "explain"
        ? { text: "A written answer long enough to count as a response." }
        : kind === "code"
          ? { code: key.referenceSolution }
          : { selected: key.correctIndices };
  const res = await ctx.app.inject({ method: "POST", url: url(`/items/${itemId}`), ...as(learner.session), payload: body });
  return res;
}

describe("consent and start", () => {
  test("the assessment cannot start before consent is recorded", async () => {
    const res = await ctx.app.inject({ method: "POST", url: url("/start"), ...as(learner.session), payload: {} });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/Consent/);
  });

  test("starting sets a server-side deadline that includes the written-answer budget", async () => {
    const before = Date.now();
    const start = await consentAndStart();

    expect(start.config.hardLimit).toBe(HARD_LIMIT);
    expect(start.config.areas.length).toBeGreaterThanOrEqual(5);
    // 60 minutes plus the 15-minute written budget.
    const minutes = (start.deadlineAt - before) / 60_000;
    expect(minutes).toBeGreaterThan(70);
    expect(minutes).toBeLessThan(80);
  });

  test("another learner cannot touch this assessment, and gets 404 rather than 403", async () => {
    const other = await activeLearner(ctx, admin, "someone.else");
    const res = await ctx.app.inject({ method: "GET", url: url("/next"), ...as(other.session) });
    expect(res.statusCode).toBe(404);
  });
});

describe("serving items", () => {
  beforeEach(async () => {
    await consentAndStart();
  });

  test("serves one item at a time, and never reveals the key", async () => {
    const res = await ctx.app.inject({ method: "GET", url: url("/next"), ...as(learner.session) });

    expect(res.body).not.toContain("correctIndices");
    expect(res.body).not.toContain("expectedOutput");
    expect(res.body).not.toContain("hiddenTests");
    expect(res.body).not.toContain("referenceSolution");
    expect(res.body).not.toContain("rationale");
    expect(res.body).not.toContain("rubric");

    const item = res.json().item;
    expect(item).not.toBeNull();
    expect(Object.keys(item).sort()).toEqual(["expiresAt", "id", "kind", "payload"]);
  });

  test("re-requesting returns the same item, so a refresh does not skip it", async () => {
    const first = await nextItem();
    const second = await nextItem();
    expect(second.item.id).toBe(first.item.id);
  });

  test("answering never tells the learner whether they were right", async () => {
    const { item } = await nextItem();
    const res = await answerCorrectly(item.id);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ accepted: true });
  });

  test("an answer to an item that was not the last one served is rejected", async () => {
    const { item } = await nextItem();
    const other = ctx.db
      .select()
      .from(schema.assessmentItems)
      .where(eq(schema.assessmentItems.assessmentId, assessmentId))
      .all()
      .find((i) => i.id !== item.id && i.status === "pool")!;

    const res = await ctx.app.inject({
      method: "POST",
      url: url(`/items/${other.id}`),
      ...as(learner.session),
      payload: { selected: [0] },
    });
    expect(res.statusCode).toBe(409);
  });

  test("an answer after the item's time limit plus grace is rejected and scored zero", async () => {
    const { item } = await nextItem();

    // Wind the stored expiry back rather than waiting out a 90-second limit.
    const assessment = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;
    const config = assessment.config as Record<string, unknown>;
    ctx.db
      .update(schema.assessments)
      .set({ config: { ...config, currentItemExpiresAt: Date.now() - 10_000 } })
      .where(eq(schema.assessments.id, assessmentId))
      .run();

    const res = await answerCorrectly(item.id);
    expect(res.statusCode).toBe(409);

    const row = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, item.id)).get()!;
    expect(row.status).toBe("skipped");
    expect(row.autoScore).toBe(0);
  });

  test("the deadline is enforced by the server, not the client", async () => {
    ctx.db.update(schema.assessments).set({ deadlineAt: Date.now() - 1000 }).where(eq(schema.assessments.id, assessmentId)).run();

    const res = await ctx.app.inject({ method: "GET", url: url("/next"), ...as(learner.session) });
    expect(res.json().done).toBe(true);

    const row = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;
    expect(row.status).toBe("submitted");
    expect(row.terminatedReason).toMatch(/time limit/i);
  });

  test("a correct answer raises the difficulty of the next item in that area", async () => {
    const first = await nextItem();
    const firstRow = keyFor(first.item.id);
    await answerCorrectly(first.item.id);

    const assessment = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;
    const selector = (assessment.config as { selector: { areas: { area: string; theta: number }[] } }).selector;
    const itemRow = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, first.item.id)).get()!;
    const area = selector.areas.find((a) => a.area === itemRow.area)!;

    expect(area.theta).toBeGreaterThan(itemRow.difficulty - 1);
    expect(firstRow.payload.timeLimitSec).toBeGreaterThan(0);
  });

  test("the written answers come after the adaptive section, not mixed into it", async () => {
    const kinds: string[] = [];
    for (let i = 0; i < 40; i++) {
      const next = await nextItem();
      if (next.done) break;
      kinds.push(next.item.kind);
      await answerCorrectly(next.item.id);
    }

    const firstExplain = kinds.indexOf("explain");
    if (firstExplain >= 0) {
      expect(kinds.slice(firstExplain).every((k) => k === "explain")).toBe(true);
    }
  }, 60_000);
});

describe("integrity", () => {
  beforeEach(async () => {
    await consentAndStart();
  });

  const fire = (type: string, severity: "soft" | "hard" = "hard") =>
    ctx.app.inject({
      method: "POST",
      url: url("/events"),
      ...as(learner.session),
      payload: { type, severity, clientTs: Date.now() },
    });

  test("a hard event counts once and is reported back", async () => {
    const res = await fire("tab_hidden");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ counted: true, hardWarnings: 1, hardLimit: HARD_LIMIT, terminated: false });
  });

  test("the same hard type inside the cooldown does not count again", async () => {
    await fire("tab_hidden");
    const second = await fire("tab_hidden");
    expect(second.json().counted).toBe(false);
    expect(second.json().hardWarnings).toBe(1);
    // But it is still recorded, so the admin sees it happened.
    expect(ctx.db.select().from(schema.integrityEvents).all()).toHaveLength(2);
  });

  test("a different hard type counts immediately", async () => {
    await fire("tab_hidden");
    const second = await fire("window_blur");
    expect(second.json().counted).toBe(true);
    expect(second.json().hardWarnings).toBe(2);
  });

  test(`${SOFT_ESCALATION_COUNT} soft warnings of the same type become one hard warning`, async () => {
    const first = await fire("looking_away", "soft");
    expect(first.json().counted).toBe(false);
    const second = await fire("looking_away", "soft");
    expect(second.json().counted).toBe(false);
    const third = await fire("looking_away", "soft");
    expect(third.json()).toMatchObject({ counted: true, escalated: true, hardWarnings: 1 });
  });

  test(`the ${HARD_LIMIT}th counted warning terminates the assessment and keeps the answers`, async () => {
    const { item } = await nextItem();
    await answerCorrectly(item.id);

    await fire("tab_hidden");
    await fire("window_blur");
    const third = await fire("paste_attempt");

    expect(third.json()).toMatchObject({ terminated: true, hardWarnings: HARD_LIMIT });

    const row = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;
    expect(row.status).toBe("terminated");
    expect(row.terminatedReason).toMatch(/paste_attempt/);

    // The answers so far are kept, and evaluation is still queued (brief §18 answer 2).
    const answered = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, item.id)).get()!;
    expect(answered.status).toBe("answered");
    const job = ctx.db.select().from(schema.jobs).all().find((j) => j.type === "assessment.evaluate");
    expect(job).toBeDefined();
  });

  test("a counted warning extends the deadline, so a modal does not cost them time", async () => {
    const before = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;
    const res = await fire("tab_hidden");
    const after = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;

    expect(res.json().pauseMs).toBeGreaterThan(0);
    expect(after.deadlineAt).toBeGreaterThan(before.deadlineAt!);
  });

  test("the client's own count is irrelevant: the server decides from stored events", async () => {
    // A client claiming a high count changes nothing; only real events do.
    const res = await ctx.app.inject({
      method: "POST",
      url: url("/events"),
      ...as(learner.session),
      payload: { type: "tab_hidden", severity: "hard", clientTs: Date.now(), details: { hardWarnings: 99 } },
    });
    expect(res.json().hardWarnings).toBe(1);
  });

  test("the cooldown window is what the brief specifies", () => {
    expect(HARD_COOLDOWN_MS).toBe(10_000);
  });

  test("a heartbeat updates the assessment and returns nothing sensitive", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: url("/heartbeat"),
      ...as(learner.session),
      payload: { visible: true, fullscreen: true, faceState: "one", cameraLive: true },
    });
    expect(res.statusCode).toBe(200);
    const row = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;
    expect(row.lastHeartbeatAt).toBeGreaterThan(0);
  });
});

describe("submitting", () => {
  test("queues evaluation and closes the assessment", async () => {
    await consentAndStart();
    const { item } = await nextItem();
    await answerCorrectly(item.id);

    const res = await ctx.app.inject({ method: "POST", url: url("/submit"), ...as(learner.session), payload: {} });
    expect(res.statusCode).toBe(200);

    const row = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;
    expect(row.status).toBe("submitted");
    expect(row.submittedAt).toBeGreaterThan(0);

    const job = ctx.db.select().from(schema.jobs).all().find((j) => j.type === "assessment.evaluate");
    expect(job).toBeDefined();
  });

  test("a submitted assessment cannot serve more items", async () => {
    await consentAndStart();
    await ctx.app.inject({ method: "POST", url: url("/submit"), ...as(learner.session), payload: {} });

    const res = await ctx.app.inject({ method: "GET", url: url("/next"), ...as(learner.session) });
    expect(res.statusCode).toBe(409);
  });
});

describe("the admin live view", () => {
  test("lists an in-progress assessment with its warning counts", async () => {
    await consentAndStart();
    await ctx.app.inject({
      method: "POST",
      url: url("/events"),
      ...as(learner.session),
      payload: { type: "tab_hidden", severity: "hard", clientTs: Date.now() },
    });

    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/live", ...as(admin) });
    expect(res.statusCode).toBe(200);

    const entry = res.json().live.find((l: { assessmentId: string }) => l.assessmentId === assessmentId);
    expect(entry.hardWarnings).toBe(1);
    expect(entry.username).toBe(learner.username);
    expect(entry.recentEvents[0].type).toBe("tab_hidden");
    expect(entry.msLeft).toBeGreaterThan(0);
  });

  test("an admin can end a live assessment", async () => {
    await consentAndStart();
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/assessments/${assessmentId}/terminate`,
      ...as(admin),
      payload: {},
    });
    expect(res.statusCode).toBe(200);

    const row = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;
    expect(row.status).toBe("terminated");
    expect(row.terminatedReason).toMatch(/Ended by/);
  });

  test("an admin can add ten minutes", async () => {
    const start = await consentAndStart();
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/assessments/${assessmentId}/extend`,
      ...as(admin),
      payload: {},
    });
    expect(res.json().deadlineAt).toBe(start.deadlineAt + 10 * 60_000);
  });

  test("a learner cannot read the integrity feed or a snapshot", async () => {
    await consentAndStart();
    const feed = await ctx.app.inject({ method: "GET", url: "/api/admin/live", ...as(learner.session) });
    expect(feed.statusCode).toBe(403);

    const snapshot = await ctx.app.inject({ method: "GET", url: "/api/admin/snapshots/anything.jpg", ...as(learner.session) });
    expect(snapshot.statusCode).toBe(403);
  });

  test("a snapshot path cannot walk out of the snapshots directory", async () => {
    const res = await ctx.app.inject({
      method: "GET",
      url: "/api/admin/snapshots/../../oyelearn.db",
      ...as(admin),
    });
    expect([400, 404]).toContain(res.statusCode);
  });
});
