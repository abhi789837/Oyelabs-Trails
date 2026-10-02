import { eq } from "drizzle-orm";

import { SESSION_COOKIE } from "../../../../shared/auth";
import { beforeEach, describe, expect, test } from "vitest";

import { schema } from "../../db";
import { newId, now } from "../../lib/ids";
import {
  activeLearner,
  adminSession,
  as,
  createTestApp,
  login,
  publishPlanFor,
  sampleProfile,
  type Session,
  type TestContext,
} from "../../test/harness";

/**
 * Suspending, archiving and deleting.
 *
 * Deletion is the only action in this console with no undo, so the tests are written as the promises
 * the confirmation dialog makes: that the data is really gone, that catalogue courses really stay,
 * that the audit trail survives the account, and that the two refusals which keep the platform
 * reachable — no deleting yourself, no deleting the last super admin — actually hold on the server
 * rather than only in the menu that hides the button.
 */

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
});

const setStatus = (id: string, status: string, session = admin) =>
  ctx.app.inject({ method: "POST", url: `/api/admin/users/${id}/status`, ...as(session), payload: { status } });

const del = (id: string, confirmUsername: string, session = admin) =>
  ctx.app.inject({ method: "DELETE", url: `/api/admin/users/${id}`, ...as(session), payload: { confirmUsername } });

/** A course written for one learner, and the `generated_courses` row that says so. */
function seedGeneratedCourse(userId: string | null, scope: "learner" | "global"): string {
  const courseId = newId();
  ctx.db
    .insert(schema.courses)
    .values({
      id: courseId,
      title: `Course ${scope}`,
      summary: "",
      accent: "glacier",
      audience: "assigned",
      published: true,
      origin: "generated",
      position: 0,
      createdBy: null,
      createdAt: now(),
      updatedAt: now(),
    })
    .run();
  ctx.db
    .insert(schema.generatedCourses)
    .values({ courseId, skill: "cPanel deployment", userId, scope, status: "published", createdAt: now() })
    .run();
  return courseId;
}

describe("suspending and archiving", () => {
  test("a suspended learner cannot sign in, and their data is untouched", async () => {
    await publishPlanFor(ctx, admin, learner.id, ctx.content.orderedTopicIds.slice(0, 5));

    expect((await setStatus(learner.id, "disabled")).statusCode).toBe(200);

    const denied = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: learner.username, password: "waypoint-basalt-2291" },
    });
    expect(denied.statusCode).not.toBe(200);

    expect(ctx.db.select().from(schema.learningPlans).where(eq(schema.learningPlans.userId, learner.id)).all()).toHaveLength(1);
  });

  test("archiving signs them out and keeps everything", async () => {
    await publishPlanFor(ctx, admin, learner.id, ctx.content.orderedTopicIds.slice(0, 5));

    expect((await setStatus(learner.id, "archived")).statusCode).toBe(200);

    /* The live session goes with the status change rather than at its next expiry: "removed from the
       programme" taking effect whenever they happen to close a tab is not removal. */
    expect(ctx.db.select().from(schema.sessions).where(eq(schema.sessions.userId, learner.id)).all()).toHaveLength(0);
    expect(ctx.db.select().from(schema.users).where(eq(schema.users.id, learner.id)).get()!.status).toBe("archived");
    expect(ctx.db.select().from(schema.learningPlans).where(eq(schema.learningPlans.userId, learner.id)).all()).toHaveLength(1);
  });

  test("restoring lets them sign in again", async () => {
    await setStatus(learner.id, "archived");
    expect((await setStatus(learner.id, "active")).statusCode).toBe(200);

    const session = await login(ctx, learner.username, "waypoint-basalt-2291");
    expect(session.cookie).toBeTruthy();
  });

  test("both are written to the audit log", async () => {
    await setStatus(learner.id, "disabled");
    await setStatus(learner.id, "archived");

    const actions = ctx.db.select().from(schema.auditLog).all().map((row) => row.action);
    expect(actions).toContain("user.disabled");
    expect(actions).toContain("user.archived");
  });
});

describe("deleting", () => {
  test("removes the account and everything personal to it", async () => {
    await publishPlanFor(ctx, admin, learner.id, ctx.content.orderedTopicIds.slice(0, 5));
    ctx.db
      .insert(schema.topicProgress)
      .values({
        userId: learner.id,
        topicId: ctx.content.orderedTopicIds[0],
        status: "completed",
        bestScore: 90,
        attempts: 1,
        completedAt: now(),
        updatedAt: now(),
      })
      .run();

    const res = await del(learner.id, learner.username);
    expect(res.statusCode).toBe(200);
    expect(res.json().counts.progress).toBe(1);

    expect(ctx.db.select().from(schema.users).where(eq(schema.users.id, learner.id)).get()).toBeUndefined();
    expect(ctx.db.select().from(schema.sessions).where(eq(schema.sessions.userId, learner.id)).all()).toHaveLength(0);
    expect(ctx.db.select().from(schema.learningPlans).where(eq(schema.learningPlans.userId, learner.id)).all()).toHaveLength(0);
    expect(ctx.db.select().from(schema.topicProgress).where(eq(schema.topicProgress.userId, learner.id)).all()).toHaveLength(0);
    expect(ctx.db.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, learner.id)).all()).toHaveLength(0);
  });

  test("takes their assessment, its consent and its proctoring events with it", async () => {
    const issued = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${learner.id}/assessments`,
      ...as(admin),
      payload: { format: "legacy" },
    });
    const assessmentId: string = issued.json().assessmentId;
    await ctx.drainJobs();

    ctx.db
      .insert(schema.assessmentConsents)
      .values({ assessmentId, userId: learner.id, permissions: null, policyVersion: "v1", ip: null, userAgent: null, createdAt: now(), updatedAt: now() })
      .run();
    ctx.db
      .insert(schema.integrityEvents)
      .values({
        id: newId(),
        assessmentId,
        userId: learner.id,
        type: "tab_hidden",
        severity: "hard",
        counted: true,
        details: null,
        snapshotPath: null,
        clientTs: null,
        createdAt: now(),
      })
      .run();

    const res = await del(learner.id, learner.username);
    expect(res.statusCode).toBe(200);
    expect(res.json().counts.assessments).toBe(1);
    expect(res.json().counts.integrityEvents).toBe(1);

    expect(ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()).toBeUndefined();
    expect(ctx.db.select().from(schema.assessmentConsents).all()).toHaveLength(0);
    expect(ctx.db.select().from(schema.integrityEvents).all()).toHaveLength(0);
  });

  test("keeps a course that was saved to the library, and detaches it", async () => {
    /* The promise the dialog makes. A promoted course has other people's plans pointing at it, and
       deleting it because the person it was first written for has left would break their week. */
    const globalCourse = seedGeneratedCourse(learner.id, "global");
    const learnerCourse = seedGeneratedCourse(learner.id, "learner");

    const res = await del(learner.id, learner.username);
    expect(res.json().counts.keptGlobalCourses).toBe(1);
    expect(res.json().counts.generatedCourses).toBe(1);

    expect(ctx.db.select().from(schema.courses).where(eq(schema.courses.id, globalCourse)).get()).toBeDefined();
    expect(ctx.db.select().from(schema.generatedCourses).where(eq(schema.generatedCourses.courseId, globalCourse)).get()!.userId).toBeNull();

    expect(ctx.db.select().from(schema.courses).where(eq(schema.courses.id, learnerCourse)).get()).toBeUndefined();
  });

  test("leaves an audit row naming who did it and what went", async () => {
    await del(learner.id, learner.username);

    const entry = ctx.db.select().from(schema.auditLog).all().find((row) => row.action === "user.deleted");
    expect(entry).toBeDefined();
    expect(entry!.actorId).toBe(admin.user.id);
    expect(entry!.targetId).toBe(learner.id);
    expect((entry!.details as { username: string }).username).toBe(learner.username);
  });

  test("anonymises what the deleted account did, rather than erasing it", async () => {
    /* "An account that no longer exists suspended this learner in March" is still a true and useful
       sentence, and rewriting history is not the alternative on offer. */
    const other = await activeLearner(ctx, admin, "arjun.mehta");
    const staff = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/users",
      ...as(admin),
      payload: { username: "dept.lead", displayName: "Dept Lead", role: "admin", profile: sampleProfile, issueAssessment: false },
    });
    const leadId: string = staff.json().user.id;

    ctx.db
      .insert(schema.auditLog)
      .values({ id: newId(), actorId: leadId, action: "user.disabled", targetType: "user", targetId: other.id, details: null, createdAt: now() })
      .run();

    await del(leadId, "dept.lead");

    const entry = ctx.db
      .select()
      .from(schema.auditLog)
      .all()
      .find((row) => row.targetId === other.id && row.action === "user.disabled");
    expect(entry).toBeDefined();
    expect(entry!.actorId).toBeNull();
  });
});

describe("what deletion refuses", () => {
  test("a wrong username deletes nothing", async () => {
    const res = await del(learner.id, "not-their-username");
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/does not match/i);
    expect(ctx.db.select().from(schema.users).where(eq(schema.users.id, learner.id)).get()).toBeDefined();
  });

  test("an admin who is not a super admin cannot delete anyone", async () => {
    const staff = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/users",
      ...as(admin),
      payload: { username: "dept.lead", displayName: "Dept Lead", role: "admin", profile: sampleProfile, issueAssessment: false },
    });
    const temporary: string = staff.json().temporaryPassword;
    const first = await login(ctx, "dept.lead", temporary);
    const changed = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/change-password",
      ...as(first),
      payload: { currentPassword: temporary, newPassword: "camp-ridge-lichen-5512" },
    });
    const leadSession: Session = { cookie: changed.cookies.find((c) => c.name === SESSION_COOKIE)!.value, user: changed.json().user };

    const res = await del(learner.id, learner.username, leadSession);
    expect(res.statusCode).toBe(403);
    expect(ctx.db.select().from(schema.users).where(eq(schema.users.id, learner.id)).get()).toBeDefined();
  });

  test("you cannot delete the last super admin", async () => {
    /* Structural rather than cautionary: the console would have no way back in.

       The second superadmin is inserted directly, because `/api/admin/users` deliberately cannot mint
       one — see `onboardLearnerRequestSchema`, which is itself the right behaviour. */
    const spareId = newId();
    ctx.db
      .insert(schema.users)
      .values({
        id: spareId,
        username: "spare.super",
        displayName: "Spare Super",
        passwordHash: "not-a-real-hash",
        role: "superadmin",
        status: "active",
        mustChangePassword: false,
        failedLogins: 0,
        lockedUntil: null,
        createdBy: null,
        createdAt: now(),
        lastLoginAt: null,
      })
      .run();

    // Two exist, so the spare goes.
    expect((await del(spareId, "spare.super")).statusCode).toBe(200);
    expect(ctx.db.select().from(schema.users).where(eq(schema.users.role, "superadmin")).all()).toHaveLength(1);

    /* One left, and it is the caller. Both guards apply and the count answers first, because it is
       the one that says what to do about it. */
    const res = await del(admin.user.id, admin.user.username);
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/last super admin/i);
    expect(ctx.db.select().from(schema.users).where(eq(schema.users.id, admin.user.id)).get()).toBeDefined();
  });

  test("you cannot delete yourself while another super admin exists", async () => {
    /* With the count satisfied, the self-check is what refuses — and it is reachable only in this
       shape, which is why both guards exist rather than one. */
    ctx.db
      .insert(schema.users)
      .values({
        id: newId(),
        username: "spare.super",
        displayName: "Spare Super",
        passwordHash: "not-a-real-hash",
        role: "superadmin",
        status: "active",
        mustChangePassword: false,
        failedLogins: 0,
        lockedUntil: null,
        createdBy: null,
        createdAt: now(),
        lastLoginAt: null,
      })
      .run();

    const res = await del(admin.user.id, admin.user.username);
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/your own account/i);
  });

  test("a learner cannot delete anybody, including themselves", async () => {
    const res = await del(learner.id, learner.username, learner.session);
    expect(res.statusCode).toBe(403);
  });
});

describe("the export", () => {
  test("carries their record and names the file after them", async () => {
    await publishPlanFor(ctx, admin, learner.id, ctx.content.orderedTopicIds.slice(0, 3));

    const res = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${learner.id}/export`, ...as(admin) });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-disposition"]).toContain(learner.username);

    const body = res.json();
    expect(body.user.username).toBe(learner.username);
    expect(body.plans).toHaveLength(1);
    expect(body.profile).not.toBeNull();
  });

  test("does not carry the password hash or session tokens", async () => {
    const res = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${learner.id}/export`, ...as(admin) });
    const raw = res.body;
    expect(raw).not.toContain("passwordHash");
    expect(raw).not.toContain("password_hash");
    expect(raw.toLowerCase()).not.toContain('"sessions"');
  });

  test("a learner cannot export anybody, including themselves", async () => {
    const res = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${learner.id}/export`, ...as(learner.session) });
    expect(res.statusCode).toBe(403);
  });
});
