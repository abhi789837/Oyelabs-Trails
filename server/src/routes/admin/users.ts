import crypto from "node:crypto";

import { and, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import {
  bulkUserActionSchema,
  listUsersResponseSchema,
  type BulkUserResult,
  onboardLearnerRequestSchema,
  resetPasswordRequestSchema,
  deleteUserRequestSchema,
  setUserStatusRequestSchema,
  updateProfileRequestSchema,
  type LearnerDetail,
  type OnboardLearnerResponse,
  type UserSummary,
} from "../../../../shared/admin";
import { learnerProfileSchema, type LearnerProfile } from "../../../../shared/profile";
import { deleteUserCompletely, exportUser } from "../../admin/deleteUser";
import { requireStaff, requireSuperadmin, staffOnly } from "../../auth/guards";
import { checkPasswordPolicy, generatePassword, hashPassword } from "../../auth/password";
import { revokeUserSessions } from "../../auth/sessions";
import { schema, type Db } from "../../db";
import { writeAudit } from "../../lib/audit";
import { badRequest, conflict, forbidden, notFound, parseOrThrow } from "../../lib/errors";
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
    departmentId: profile?.departmentId ?? (user.role === "learner" ? "engineering" : null),
    trackId: profile?.trackId ?? profile?.track ?? null,
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

/**
 * Refuses an action aimed at a staff account unless the actor is the superadmin.
 *
 * An `admin` manages learners. Letting one reset another admin's password, disable them, or revoke
 * their sessions would make the role self-escalating in practice: three admins who can disable each
 * other are not three restricted accounts, they are three superadmins with extra steps.
 */
function assertMayActOn(actor: { id: string; role: string }, target: { id: string; role: string }): void {
  if (target.role === "learner") return;
  if (actor.role === "superadmin") return;
  if (actor.id === target.id) return; // Your own account is always yours.
  throw forbidden();
}

export async function registerAdminUserRoutes(app: FastifyInstance): Promise<void> {
  // Everything under this plugin is superadmin-only. Registered as a hook rather than per route
  // so a new route cannot accidentally ship unguarded.
  app.addHook("preHandler", staffOnly);

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
    const actor = requireStaff(request);
    const body = parseOrThrow(onboardLearnerRequestSchema, request.body);

    /* Creating staff is the superadmin's alone — see `assertMayActOn`. An admin onboarding a
       learner is the ordinary case and needs no extra right. */
    if (body.role !== "learner" && actor.role !== "superadmin") throw forbidden();

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
        role: body.role,
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
      details: {
        username: body.username,
        role: body.role,
        issueAssessment: body.issueAssessment,
        notesLength: body.profile.adminNotes.length,
      },
    });

    const row = app.db.select().from(schema.users).where(eq(schema.users.id, id)).get()!;
    reply.status(201);
    return { user: summarize(app.db, row), ...(generated ? { temporaryPassword: generated } : {}) };
  });

  app.put("/api/admin/users/:id/profile", async (request) => {
    const actor = requireStaff(request);
    const { id } = request.params as { id: string };
    const body = parseOrThrow(updateProfileRequestSchema, request.body);

    const row = app.db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, id)).get();
    if (!row) throw notFound("No such person.");

    writeProfile(app.db, id, body.profile, actor.id);
    writeAudit(app.db, { actorId: actor.id, action: "user.profile_updated", targetType: "user", targetId: id });
    return { profile: readProfile(app.db, id) };
  });

  app.post("/api/admin/users/:id/reset-password", async (request) => {
    const actor = requireStaff(request);
    const { id } = request.params as { id: string };
    const body = parseOrThrow(resetPasswordRequestSchema, request.body ?? {});

    const row = app.db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    if (!row) throw notFound("No such person.");
    assertMayActOn(actor, row);

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
    const actor = requireStaff(request);
    const { id } = request.params as { id: string };
    const { status } = parseOrThrow(setUserStatusRequestSchema, request.body);

    const row = app.db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    if (!row) throw notFound("No such person.");
    if (row.id === actor.id) throw badRequest("You cannot disable your own account.");
    assertMayActOn(actor, row);

    app.db.update(schema.users).set({ status }).where(eq(schema.users.id, id)).run();
    /* Every status change signs them out of every device (v4). Archiving somebody mid-session and
       leaving that session alive would mean "removed" took effect whenever they next closed a tab;
       and a reactivated account starts from a fresh sign-in rather than a session from before. */
    revokeUserSessions(app.db, id);

    writeAudit(app.db, { actorId: actor.id, action: `user.${status}`, targetType: "user", targetId: id });
    return { user: summarize(app.db, { ...row, status }) };
  });

  /**
   * Everything the platform holds about one person, as a file.
   *
   * Offered before a deletion and downloadable on its own. Staff only — a learner's own export is a
   * separate question with a separate answer, and this one is reached from the People table.
   */
  app.get("/api/admin/users/:id/export", async (request, reply) => {
    const actor = requireStaff(request);
    const { id } = request.params as { id: string };

    const row = app.db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    if (!row) throw notFound("No such person.");
    assertMayActOn(actor, row);

    const data = exportUser(app.db, id, actor.username);
    if (!data) throw notFound("No such person.");

    writeAudit(app.db, { actorId: actor.id, action: "user.exported", targetType: "user", targetId: id });

    // Named so the file in a downloads folder still says who it is about a month from now.
    const stamp = new Date().toISOString().slice(0, 10);
    void reply
      .header("content-type", "application/json; charset=utf-8")
      .header("content-disposition", `attachment; filename="oyelearn-${row.username}-${stamp}.json"`);
    return data;
  });

  /**
   * Deletes a person and everything personal to them.
   *
   * **Superadmin only**, and the only action in the console with no undo. Three things stand between
   * an admin and an accident: the role check, typing the username, and the fact that the confirmation
   * dialog lists what is about to go. Two further refusals are structural rather than cautionary —
   * you cannot delete yourself, and you cannot delete the last superadmin, because either would
   * leave the platform without a way back in.
   *
   * See `admin/deleteUser.ts` for what survives: catalogue courses, and an anonymised audit trail.
   */
  /**
   * Bulk actions (v4 Phase 9), each person handled on their own with a result per id, so one
   * refusal (yourself, the last super admin) does not stop the rest. Every action revokes sessions.
   */
  app.post("/api/admin/users/bulk", async (request) => {
    const actor = requireStaff(request);
    const body = parseOrThrow(bulkUserActionSchema, request.body);
    if (body.action === "delete") {
      if (actor.role !== "superadmin") throw forbidden("Only a super admin can delete people.");
      if ((body.confirm ?? "").trim().toLowerCase() !== `delete ${body.ids.length}`) {
        throw badRequest("Type the confirmation exactly. Nothing was deleted.", { confirm: `Type delete ${body.ids.length}` });
      }
    }
    const statusFor = { disable: "disabled", activate: "active", archive: "archived", restore: "active" } as const;
    const results: BulkUserResult[] = [];
    for (const id of [...new Set(body.ids)]) {
      const row = app.db.select().from(schema.users).where(eq(schema.users.id, id)).get();
      if (!row) {
        results.push({ id, ok: false, error: "Not found" });
        continue;
      }
      if (row.id === actor.id) {
        results.push({ id, ok: false, error: "That is your own account" });
        continue;
      }
      try {
        assertMayActOn(actor, row);
      } catch {
        results.push({ id, ok: false, error: "Not allowed" });
        continue;
      }
      if (body.action === "revoke") {
        revokeUserSessions(app.db, id);
        writeAudit(app.db, { actorId: actor.id, action: "user.sessions_revoked", targetType: "user", targetId: id, details: { bulk: true } });
      } else if (body.action === "delete") {
        if (row.role === "superadmin") {
          const supers = app.db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, "superadmin")).all();
          if (supers.length <= 1) {
            results.push({ id, ok: false, error: "The last super admin" });
            continue;
          }
        }
        const { counts } = deleteUserCompletely(app.db, app.env, id);
        writeAudit(app.db, { actorId: actor.id, action: "user.deleted", targetType: "user", targetId: id, details: { role: row.role, bulk: true, counts } });
      } else {
        const status = statusFor[body.action];
        app.db.update(schema.users).set({ status }).where(eq(schema.users.id, id)).run();
        revokeUserSessions(app.db, id);
        writeAudit(app.db, { actorId: actor.id, action: `user.${status}`, targetType: "user", targetId: id, details: { bulk: true } });
      }
      results.push({ id, ok: true });
    }
    return { results };
  });

  app.delete("/api/admin/users/:id", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = request.params as { id: string };
    const body = parseOrThrow(deleteUserRequestSchema, request.body ?? {});

    const row = app.db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    if (!row) throw notFound("No such person.");

    /* The last-super-admin check comes **first**, and the order is the whole point.

       Only a superadmin can reach this route, so a superadmin target that is not the caller implies
       at least two exist — which means with the self-check first, the count could never fire. It was
       written that way and was dead code. Reversed, it is reachable by the case that actually
       happens: the only superadmin on the deployment trying to delete themselves. They get the
       message that tells them what to do about it rather than the one that only says no. */
    if (row.role === "superadmin") {
      const remaining = app.db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.role, "superadmin"))
        .all();
      if (remaining.length <= 1) {
        throw badRequest("That is the last super admin. Promote somebody else first, or the console becomes unreachable.");
      }
    }
    if (row.id === actor.id) {
      throw badRequest("You cannot delete your own account. Ask another super admin.");
    }

    if (body.confirmUsername.trim().toLowerCase() !== row.username.toLowerCase()) {
      throw badRequest("That username does not match. Nothing was deleted.", {
        confirmUsername: `Type ${row.username} exactly.`,
      });
    }

    const { counts, fileErrors } = deleteUserCompletely(app.db, app.env, id);

    /* The audit row is written after the delete and names the account by the values it had, since
       there is no longer a row to join to. This is the entry the brief asks for: who, which id, when. */
    writeAudit(app.db, {
      actorId: actor.id,
      action: "user.deleted",
      targetType: "user",
      targetId: id,
      /* Anonymised (v4): which role and how much was removed, never who. The target id is the only
         link back, and it now points at nothing. */
      details: {
        role: row.role,
        reasonGiven: Boolean(body.reason),
        counts,
        ...(fileErrors.length ? { snapshotErrors: fileErrors.length } : {}),
      },
    });

    if (fileErrors.length > 0) {
      app.log.warn({ userId: id, fileErrors }, "deleted a user but could not remove every proctoring snapshot");
    }

    return { deleted: { id, username: row.username, displayName: row.displayName }, counts };
  });

  app.post("/api/admin/users/:id/revoke-sessions", async (request) => {
    const actor = requireStaff(request);
    const { id } = request.params as { id: string };
    const row = app.db
      .select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .get();
    if (!row) throw notFound("No such person.");
    assertMayActOn(actor, row);

    // When an admin revokes their own sessions, keep the one they are using, so the action does
    // not sign them out mid-task.
    const removed = revokeUserSessions(app.db, id, id === actor.id ? (request.sessionToken ?? undefined) : undefined);
    writeAudit(app.db, { actorId: actor.id, action: "user.sessions_revoked", targetType: "user", targetId: id, details: { removed } });
    return { removed };
  });
}
