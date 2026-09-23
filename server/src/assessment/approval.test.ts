import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { AUTO_APPROVE_AFTER_MS } from "../../../shared/assessment";
import { schema } from "../db";
import { SAMPLE_LEARNERS } from "../dev/sampleProfiles";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";
import { sweepOnce } from "./sweeper";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };
let assessmentId: string;

/**
 * The approval gate (§9.2, the review step between generation and the learner).
 *
 * Two properties matter and pull against each other: nothing reaches a learner before it has been
 * seen *or* waited out, and nobody is blocked indefinitely by an admin who never looked. The
 * second is why the deadline exists; the first is why an automatic release is recorded as one.
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
}, 60_000);

afterEach(async () => {
  await ctx.close();
});

const row = () => ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;

const auditFor = (action: string) =>
  ctx.db
    .select()
    .from(schema.auditLog)
    .where(eq(schema.auditLog.targetId, assessmentId))
    .all()
    .filter((entry) => entry.action === action);

/** Backdates the wait so the deadline has passed, without making the test sleep for it. */
function pretendItHasBeenWaiting(ms: number): void {
  ctx.db
    .update(schema.assessments)
    .set({ awaitingApprovalSince: Date.now() - ms })
    .where(eq(schema.assessments.id, assessmentId))
    .run();
}

const approve = (session: Session) =>
  ctx.app.inject({
    method: "POST",
    url: `/api/admin/assessments/${assessmentId}/approve`,
    ...as(session),
    payload: {},
  });

describe("generation stops at the gate", () => {
  test("a generated assessment waits for approval and records when the wait started", () => {
    const assessment = row();
    expect(assessment.status).toBe("awaiting_approval");
    expect(assessment.awaitingApprovalSince).toBeGreaterThan(0);
    expect(assessment.approvedAt).toBeNull();
    expect(assessment.approvedBy).toBeNull();
  });

  test("the admin is told it is waiting, not that it is ready to take", () => {
    const notifications = ctx.db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.recipientId, admin.user.id))
      .all();
    expect(notifications.some((n) => n.kind === "assessment.awaiting_approval")).toBe(true);
  });

  test("re-issuing is still refused while one waits for approval", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${learner.id}/assessments`,
      ...as(admin),
      payload: {},
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.message).toMatch(/awaiting approval/);
  });
});

describe("the learner cannot get in early", () => {
  test("consent is refused while it is awaiting approval", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/assessment/${assessmentId}/consent`,
      ...as(learner.session),
      payload: { agreed: true },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.message).toMatch(/not been released/i);
  });

  test("starting is refused, and no clock is set", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/assessment/${assessmentId}/start`,
      ...as(learner.session),
      payload: {},
    });
    expect(res.statusCode).toBe(409);

    const assessment = row();
    expect(assessment.startedAt).toBeNull();
    expect(assessment.deadlineAt).toBeNull();
  });

  test("the status route says something true without naming who is holding it", async () => {
    const res = await ctx.app.inject({
      method: "GET",
      url: `/api/assessment/${assessmentId}/status`,
      ...as(learner.session),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("awaiting_approval");
    expect(res.json().message).toBeTruthy();
  });

  test("a learner cannot approve their own assessment", async () => {
    const res = await approve(learner.session);
    expect(res.statusCode).toBe(403);
    expect(row().status).toBe("awaiting_approval");
  });
});

describe("the superadmin approves", () => {
  test("approving makes it ready and stamps who did it", async () => {
    const res = await approve(admin);
    expect(res.statusCode).toBe(200);
    expect(res.json().assessment.status).toBe("ready");

    const assessment = row();
    expect(assessment.status).toBe("ready");
    expect(assessment.approvedBy).toBe(admin.user.id);
    expect(assessment.approvedAt).toBeGreaterThan(0);
  });

  test("the learner can start it once approved", async () => {
    await approve(admin);
    const consent = await ctx.app.inject({
      method: "POST",
      url: `/api/assessment/${assessmentId}/consent`,
      ...as(learner.session),
      payload: { agreed: true },
    });
    expect(consent.statusCode).toBe(200);

    const start = await ctx.app.inject({
      method: "POST",
      url: `/api/assessment/${assessmentId}/start`,
      ...as(learner.session),
      payload: {},
    });
    expect(start.statusCode).toBe(200);
  });

  test("approving twice is a conflict, not a silent no-op", async () => {
    expect((await approve(admin)).statusCode).toBe(200);

    const second = await approve(admin);
    expect(second.statusCode).toBe(409);
    expect(second.json().error.message).toMatch(/already been approved/i);
    // And it wrote one approval, not two.
    expect(auditFor("assessment.approved")).toHaveLength(1);
  });

  test("approving something that was never waiting is a conflict", async () => {
    ctx.db
      .update(schema.assessments)
      .set({ status: "in_progress" })
      .where(eq(schema.assessments.id, assessmentId))
      .run();

    const res = await approve(admin);
    expect(res.statusCode).toBe(409);
    expect(res.json().error.message).toMatch(/in progress/);
  });
});

describe("the deadline approves what nobody looked at", () => {
  test("the sweeper leaves it alone before the deadline", () => {
    pretendItHasBeenWaiting(AUTO_APPROVE_AFTER_MS - 30_000);

    const result = sweepOnce({ db: ctx.db });
    expect(result.autoApproved).toBe(0);
    expect(row().status).toBe("awaiting_approval");
  });

  test("the sweeper releases it once the deadline has passed", () => {
    pretendItHasBeenWaiting(AUTO_APPROVE_AFTER_MS + 1000);

    const result = sweepOnce({ db: ctx.db });
    expect(result.autoApproved).toBe(1);

    const assessment = row();
    expect(assessment.status).toBe("ready");
    expect(assessment.approvedAt).toBeGreaterThan(0);
  });

  test("the admin UI can tell an automatic release from a human one", async () => {
    pretendItHasBeenWaiting(AUTO_APPROVE_AFTER_MS + 1000);
    sweepOnce({ db: ctx.db });

    const res = await ctx.app.inject({
      method: "GET",
      url: `/api/admin/users/${learner.id}/assessments`,
      ...as(admin),
    });
    const summary = res.json().assessments[0];
    expect(summary.status).toBe("ready");
    // Approved, but by nobody — which is what the console renders differently.
    expect(summary.approvedAt).toBeGreaterThan(0);
    expect(summary.approvedBy).toBeNull();
    expect(summary.awaitingApprovalSince).toBeGreaterThan(0);
  });

  test("approving after the deadline already released it says so rather than pretending", async () => {
    pretendItHasBeenWaiting(AUTO_APPROVE_AFTER_MS + 1000);
    sweepOnce({ db: ctx.db });

    const res = await approve(admin);
    expect(res.statusCode).toBe(409);
    expect(res.json().error.message).toMatch(/nobody approved it in time/i);
  });

  test("the audit log distinguishes an automatic release from a human one", async () => {
    pretendItHasBeenWaiting(AUTO_APPROVE_AFTER_MS + 1000);
    sweepOnce({ db: ctx.db });

    expect(auditFor("assessment.approved")).toHaveLength(0);
    const auto = auditFor("assessment.auto_approved");
    expect(auto).toHaveLength(1);
    // No actor at all: the audit log should not be able to imply a person read it.
    expect(auto[0].actorId).toBeNull();
    expect(auto[0].details).toMatchObject({ reviewed: false, afterMs: AUTO_APPROVE_AFTER_MS });
  });

  test("a human approval names the actor and says it was reviewed", async () => {
    await approve(admin);

    expect(auditFor("assessment.auto_approved")).toHaveLength(0);
    const entries = auditFor("assessment.approved");
    expect(entries).toHaveLength(1);
    expect(entries[0].actorId).toBe(admin.user.id);
    expect(entries[0].details).toMatchObject({ reviewed: true, userId: learner.id });
  });

  test("the sweeper does not re-approve something already released", () => {
    pretendItHasBeenWaiting(AUTO_APPROVE_AFTER_MS + 1000);
    expect(sweepOnce({ db: ctx.db }).autoApproved).toBe(1);
    expect(sweepOnce({ db: ctx.db }).autoApproved).toBe(0);
    expect(auditFor("assessment.auto_approved")).toHaveLength(1);
  });

  test("an automatic release tells the admins nobody reviewed it", () => {
    pretendItHasBeenWaiting(AUTO_APPROVE_AFTER_MS + 1000);
    sweepOnce({ db: ctx.db });

    const admins = ctx.db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.recipientId, admin.user.id))
      .all();
    expect(admins.some((n) => n.kind === "assessment.auto_approved")).toBe(true);

    // And the learner is told it is theirs to take, however it was released.
    const theirs = ctx.db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.recipientId, learner.id))
      .all();
    expect(theirs.some((n) => n.kind === "assessment.ready")).toBe(true);
  });
});

describe("the admin overview", () => {
  test("counts what is waiting on the admin personally", async () => {
    const before = await ctx.app.inject({ method: "GET", url: "/api/admin/overview", ...as(admin) });
    expect(before.json().assessments.awaitingApproval).toBe(1);

    await approve(admin);

    const after = await ctx.app.inject({ method: "GET", url: "/api/admin/overview", ...as(admin) });
    expect(after.json().assessments.awaitingApproval).toBe(0);
  });
});
