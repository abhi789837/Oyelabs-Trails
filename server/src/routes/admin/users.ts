import crypto from "node:crypto";

import { and, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import {
  listUsersResponseSchema,
  onboardLearnerRequestSchema,
  resetPasswordRequestSchema,
  setUserStatusRequestSchema,
  updateProfileRequestSchema,
  type LearnerDetail,
  type OnboardLearnerResponse,
  type UserSummary,
} from "../../../../shared/admin";
import { learnerProfileSchema, type LearnerProfile } from "../../../../shared/profile";
import { requireSuperadmin, superadminOnly } from "../../auth/guards";
import { checkPasswordPolicy, generatePassword, hashPassword } from "../../auth/password";
import { revokeUserSessions } from "../../auth/sessions";
import { schema, type Db } from "../../db";
import { writeAudit } from "../../lib/audit";
import { badRequest, conflict, notFound, parseOrThrow } from "../../lib/errors";
import { newId, now } from "../../lib/ids";

/**
 * Builds a People-table row. The assessment, evaluation and plan columns are filled in as those
 * phases land; until then they read as "not issued", which is the truth.
 */
function summarize(db: Db, user: typeof schema.users.$inferSelect): UserSummary {
  const profile = db.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, user.id)).get();

  const assessment = db
    .select({ status: schema.assessments.status, hardWarnings: schema.assessments.hardWarnings })
    .from(schema.assessments)
    .where(eq(schema.assessments.userId, user.id))
    .orderBy(desc(schema.assessments.attemptNo))
    .get();

  const plan = db
    .select({ topicIds: schema.learningPlans.topicIds })
    .from(schema.learningPlans)
    .where(eq(schema.learningPlans.userId, user.id))
    .orderBy(desc(schema.learningPlans.version))
    .get();

  const planTopicIds = plan?.topicIds ?? [];
  const completed = planTopicIds.length
    ? db
        .select({ topicId: schema.topicProgress.topicId })
        .from(schema.topicProgress)
        .where(and(eq(schema.topicProgress.userId, user.id), eq(schema.topicProgress.status, "completed")))
        .all()
        .filter((row) => planTopicIds.includes(row.topicId)).length
    : 0;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    roleTitle: profile?.roleTitle ?? null,
    yearsExperience: profile?.yearsExperience ?? null,
    assessmentStatus: assessment?.status ?? null,
    overallLevel: null,
    hardWarnings: assessment?.hardWarnings ?? 0,
    planTopicCount: planTopicIds.length,
    planCompletedCount: completed,
  };
}

function readProfile(db: Db, userId: string): LearnerProfile {
  const row = db.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).get();
  if (!row) {
    return { roleTitle: null, yearsExperience: null, adminNotes: "", claimedSkills: [], targetTracks: [] };
  }
  // The column is JSON, so `$type` is only a compile-time claim; validate what is actually there.
  return learnerProfileSchema.parse({
    roleTitle: row.roleTitle,
    yearsExperience: row.yearsExperience,
    adminNotes: row.adminNotes,
    claimedSkills: row.claimedSkills,
    targetTracks: row.targetTracks,
  });
}

function writeProfile(db: Db, userId: string, profile: LearnerProfile, actorId: string): void {
  const timestamp = now();
  const values = {
    userId,
    roleTitle: profile.roleTitle,
    yearsExperience: profile.yearsExperience,
    adminNotes: profile.adminNotes,
    claimedSkills: profile.claimedSkills,
    targetTracks: profile.targetTracks,
    updatedAt: timestamp,
    updatedBy: actorId,
  };
  db.insert(schema.learnerProfiles)
    .values(values)
    .onConflictDoUpdate({ target: schema.learnerProfiles.userId, set: values })
    .run();
}

export async function registerAdminUserRoutes(app: FastifyInstance): Promise<void> {
  // Everything under this plugin is superadmin-only. Registered as a hook rather than per route
  // so a new route cannot accidentally ship unguarded.
  app.addHook("preHandler", superadminOnly);

  app.get("/api/admin/users", async () => {
    const rows = app.db.select().from(schema.users).orderBy(desc(schema.users.createdAt)).all();
    return listUsersResponseSchema.parse({ users: rows.map((row) => summarize(app.db, row)) });
  });

  app.get("/api/admin/users/:id", async (request): Promise<LearnerDetail> => {
    const { id } = request.params as { id: string };
    const row = app.db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    if (!row) throw notFound("No such person.");
    return { user: summarize(app.db, row), profile: readProfile(app.db, id) };
  });

  app.post("/api/admin/users", async (request, reply): Promise<OnboardLearnerResponse> => {
    const actor = requireSuperadmin(request);
    const body = parseOrThrow(onboardLearnerRequestSchema, request.body);

    const taken = app.db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.username, body.username)).get();
    if (taken) throw conflict("That username is already taken.", { username: "Already taken." });

    const generated = body.password ? undefined : generatePassword((n) => crypto.randomBytes(n), 12);
    const password = body.password ?? generated;
    if (!password) throw badRequest("Could not determine a password.");

    if (body.password) {
      const problem = checkPasswordPolicy(body.password, body.username);
      if (problem) throw badRequest(problem.message, { password: problem.message });
    }

    const id = newId();
    app.db
      .insert(schema.users)
      .values({
        id,
        username: body.username,
        displayName: body.displayName,
        passwordHash: await hashPassword(password),
        role: "learner",
        status: "active",
        mustChangePassword: true,
        createdBy: actor.id,
        createdAt: now(),
      })
      .run();

    writeProfile(app.db, id, body.profile, actor.id);

    writeAudit(app.db, {
      actorId: actor.id,
      action: "user.onboarded",
      targetType: "user",
      targetId: id,
      // Never the password, and never the notes verbatim — just that they were set.
      details: { username: body.username, issueAssessment: body.issueAssessment, notesLength: body.profile.adminNotes.length },
    });

    const row = app.db.select().from(schema.users).where(eq(schema.users.id, id)).get()!;
    reply.status(201);
    return { user: summarize(app.db, row), ...(generated ? { temporaryPassword: generated } : {}) };
  });

  app.put("/api/admin/users/:id/profile", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = request.params as { id: string };
    const body = parseOrThrow(updateProfileRequestSchema, request.body);

    const row = app.db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, id)).get();
    if (!row) throw notFound("No such person.");

    writeProfile(app.db, id, body.profile, actor.id);
    writeAudit(app.db, { actorId: actor.id, action: "user.profile_updated", targetType: "user", targetId: id });
    return { profile: readProfile(app.db, id) };
  });

  app.post("/api/admin/users/:id/reset-password", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = request.params as { id: string };
    const body = parseOrThrow(resetPasswordRequestSchema, request.body ?? {});

    const row = app.db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    if (!row) throw notFound("No such person.");

    const generated = body.password ? undefined : generatePassword((n) => crypto.randomBytes(n), 12);
    const password = body.password ?? generated!;
    if (body.password) {
      const problem = checkPasswordPolicy(body.password, row.username);
      if (problem) throw badRequest(problem.message, { password: problem.message });
    }

    app.db
      .update(schema.users)
      .set({ passwordHash: await hashPassword(password), mustChangePassword: true, failedLogins: 0, lockedUntil: null })
      .where(eq(schema.users.id, id))
      .run();
    // A reset must invalidate whatever the old password was holding open.
    revokeUserSessions(app.db, id);

    writeAudit(app.db, { actorId: actor.id, action: "user.password_reset", targetType: "user", targetId: id });
    return { ...(generated ? { temporaryPassword: generated } : {}) };
  });

  app.post("/api/admin/users/:id/status", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = request.params as { id: string };
    const { status } = parseOrThrow(setUserStatusRequestSchema, request.body);

    const row = app.db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    if (!row) throw notFound("No such person.");
    if (row.id === actor.id) throw badRequest("You cannot disable your own account.");

    app.db.update(schema.users).set({ status }).where(eq(schema.users.id, id)).run();
    if (status === "disabled") revokeUserSessions(app.db, id);

    writeAudit(app.db, { actorId: actor.id, action: `user.${status}`, targetType: "user", targetId: id });
    return { user: summarize(app.db, { ...row, status }) };
  });

  app.post("/api/admin/users/:id/revoke-sessions", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = request.params as { id: string };
    const row = app.db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, id)).get();
    if (!row) throw notFound("No such person.");

    // When an admin revokes their own sessions, keep the one they are using, so the action does
    // not sign them out mid-task.
    const removed = revokeUserSessions(app.db, id, id === actor.id ? (request.sessionToken ?? undefined) : undefined);
    writeAudit(app.db, { actorId: actor.id, action: "user.sessions_revoked", targetType: "user", targetId: id, details: { removed } });
    return { removed };
  });
}
