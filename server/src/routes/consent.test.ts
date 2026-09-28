import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { CONSENT_POLICY_VERSION } from "../../../shared/assessment";
import { schema } from "../db";
import { SAMPLE_LEARNERS } from "../dev/sampleProfiles";
import {
  activeLearner,
  adminSession,
  approveAssessment,
  as,
  createTestApp,
  type Session,
  type TestContext,
} from "../test/harness";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };
let assessmentId: string;

/**
 * Consent, and starting.
 *
 * These exist because of a bug that made the product unusable: the client never called the consent
 * endpoint at all, so every learner who reached the Start button got
 * "Consent is required before starting." for ever. See `docs/bugs/assessment-consent.md`.
 *
 * The tests are therefore written around the two shapes of that failure — a start with nothing
 * recorded, and a start that carries its own consent — plus the cases where a consent record exists
 * but must not count.
 */
beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin, SAMPLE_LEARNERS[0].username);

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
  await approveAssessment(ctx, admin, assessmentId);
});

const PERMISSIONS = { camera: true, microphone: true, fullscreen: true, tabMonitoring: true };

async function consent(
  session: Session,
  id = assessmentId,
  payload: object = { agreed: true, permissions: PERMISSIONS, policyVersion: CONSENT_POLICY_VERSION },
) {
  return await ctx.app.inject({ method: "POST", url: `/api/assessment/${id}/consent`, ...as(session), payload });
}

async function start(session: Session, id = assessmentId, payload: object = {}) {
  return await ctx.app.inject({ method: "POST", url: `/api/assessment/${id}/start`, ...as(session), payload });
}

function consentRow(id = assessmentId) {
  return ctx.db.select().from(schema.assessmentConsents).where(eq(schema.assessmentConsents.assessmentId, id)).get();
}

describe("start without consent", () => {
  test("is refused, and nothing is started", async () => {
    const res = await start(learner.session);
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/consent is required/i);

    const row = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;
    expect(row.status).toBe("ready");
    expect(row.startedAt).toBeNull();
  });
});

describe("consent then start", () => {
  test("starts the assessment", async () => {
    // The flow the client was missing, and the one it now performs.
    expect((await consent(learner.session)).statusCode).toBe(200);

    const res = await start(learner.session);
    expect(res.statusCode).toBe(200);
    expect(res.json().deadlineAt).toBeGreaterThan(Date.now());

    const row = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;
    expect(row.status).toBe("in_progress");
    expect(row.startedAt).not.toBeNull();
  });

  test("records what was granted, with the policy version and the agent", async () => {
    await consent(learner.session);
    const row = consentRow()!;
    expect(row.userId).toBe(learner.id);
    expect(row.permissions).toEqual(PERMISSIONS);
    expect(row.policyVersion).toBe(CONSENT_POLICY_VERSION);
    expect(row.ip).toBeTruthy();
  });

  test("consenting twice updates rather than failing", async () => {
    // A learner who reloads the pre-flight screen and agrees again has done nothing wrong.
    await consent(learner.session);
    const first = consentRow()!;
    const again = await consent(learner.session, assessmentId, { agreed: true, permissions: { ...PERMISSIONS, microphone: false } });
    expect(again.statusCode).toBe(200);

    const second = consentRow()!;
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.permissions).toMatchObject({ microphone: false });
    expect(ctx.db.select().from(schema.assessmentConsents).all()).toHaveLength(1);
  });

  test("the status endpoint lets the screen say 'recorded' after a reload", async () => {
    const before = await ctx.app.inject({
      method: "GET",
      url: `/api/assessment/${assessmentId}/consent`,
      ...as(learner.session),
    });
    expect(before.json()).toMatchObject({ recorded: false, stale: false });

    await consent(learner.session);
    const after = await ctx.app.inject({
      method: "GET",
      url: `/api/assessment/${assessmentId}/consent`,
      ...as(learner.session),
    });
    expect(after.json()).toMatchObject({ recorded: true, stale: false, policyVersion: CONSENT_POLICY_VERSION });
  });
});

describe("start with consent inline", () => {
  test("a single call is enough", async () => {
    /* The belt-and-braces path. A client that forgets to consent first cannot reproduce the
       original bug, because the payload it sends here is sufficient on its own. */
    const res = await start(learner.session, assessmentId, {
      consent: { agreed: true, permissions: PERMISSIONS, policyVersion: CONSENT_POLICY_VERSION },
    });
    expect(res.statusCode).toBe(200);
    expect(consentRow()).toBeDefined();
  });

  test("the inline consent is recorded, not just accepted", async () => {
    await start(learner.session, assessmentId, {
      consent: { agreed: true, permissions: PERMISSIONS, policyVersion: CONSENT_POLICY_VERSION },
    });
    expect(consentRow()!.permissions).toEqual(PERMISSIONS);
  });
});

describe("what does not count as consent", () => {
  test("a wrong field name is rejected by the schema", async () => {
    // The field names live in one shared schema precisely so they cannot drift apart again.
    const res = await consent(learner.session, assessmentId, { accepted: true });
    expect(res.statusCode).toBe(400);
    expect(consentRow()).toBeUndefined();
  });

  test("`agreed: false` is not consent", async () => {
    const res = await consent(learner.session, assessmentId, { agreed: false });
    expect(res.statusCode).toBe(400);
    expect(consentRow()).toBeUndefined();
  });

  test("another learner's consent does not unlock this assessment", async () => {
    const other = await activeLearner(ctx, admin, "arjun.mehta");
    // They cannot even see it: whether somebody else's assessment exists is not theirs to learn.
    expect((await consent(other.session)).statusCode).toBe(404);
    expect((await start(other.session)).statusCode).toBe(404);
  });

  test("consent for one assessment does not start another", async () => {
    const second = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${learner.id}/assessments`,
      ...as(admin),
      payload: { label: "Second" },
    });
    const secondId: string = second.json().assessmentId;
    await ctx.drainJobs();
    await approveAssessment(ctx, admin, secondId);

    await consent(learner.session, assessmentId);
    const res = await start(learner.session, secondId);
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/consent is required/i);
  });

  test("a record at an older policy version does not count", async () => {
    /* The learner agreed to different wording. Asking again is the only honest option, and it is
       the reason the version is stored rather than assumed. */
    await consent(learner.session);
    ctx.db
      .update(schema.assessmentConsents)
      .set({ policyVersion: "2024-something-older" })
      .where(eq(schema.assessmentConsents.assessmentId, assessmentId))
      .run();

    const status = await ctx.app.inject({
      method: "GET",
      url: `/api/assessment/${assessmentId}/consent`,
      ...as(learner.session),
    });
    expect(status.json()).toMatchObject({ recorded: false, stale: true });

    const res = await start(learner.session);
    expect(res.statusCode).toBe(400);
  });

  test("an attempt consented to before this table existed still starts", async () => {
    /* The deploy must not lock out anyone mid-flow by enforcing a version they were never shown.
       `consent_at` with no record is accepted exactly once, for those rows. */
    ctx.db
      .update(schema.assessments)
      .set({ consentAt: Date.now() })
      .where(eq(schema.assessments.id, assessmentId))
      .run();
    expect(consentRow()).toBeUndefined();

    const res = await start(learner.session);
    expect(res.statusCode).toBe(200);
  });
});

describe("errors that are not about consent", () => {
  test("an assessment awaiting approval says so, rather than blaming consent", async () => {
    const fresh = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${learner.id}/assessments`,
      ...as(admin),
      payload: { label: "Waiting" },
    });
    const freshId: string = fresh.json().assessmentId;
    await ctx.drainJobs();

    const res = await consent(learner.session, freshId);
    expect(res.statusCode).toBe(409);
    expect(res.json().error.message).toMatch(/not been released/i);
  });

  test("an assessment already in progress cannot be started twice", async () => {
    await consent(learner.session);
    expect((await start(learner.session)).statusCode).toBe(200);

    const second = await start(learner.session);
    expect(second.statusCode).toBe(409);
    expect(second.json().error.message).toMatch(/in progress/i);
  });

  test("no session is a 401, not a consent error", async () => {
    const res = await ctx.app.inject({ method: "POST", url: `/api/assessment/${assessmentId}/start`, payload: {} });
    expect(res.statusCode).toBe(401);
  });
});
