import { inArray } from "drizzle-orm";
import { z } from "zod";
import type { FastifyInstance } from "fastify";

import {
  createCredentialRequestSchema,
  requiresSharedUseAcknowledgement,
  updateAiSettingsRequestSchema,
  type AiStatusResponse,
} from "../../../../shared/ai";
import { SUGGESTED_MODELS } from "../../ai/types";
import {
  createCredential,
  deleteCredential,
  getCredential,
  getSettings,
  listCredentials,
  updateSettings,
} from "../../ai/credentials";
import { usageByPurpose } from "../../ai/service";
import { requireSuperadmin, superadminOnly } from "../../auth/guards";
import { schema } from "../../db";
import { enqueue } from "../../jobs/queue";
import { writeAudit } from "../../lib/audit";
import { badRequest, notFound, parseOrThrow } from "../../lib/errors";
import { pagedQuery } from "../../lib/pagedRoute";
import { aiCallsTableSpec } from "../../lib/tableSpecs";

const idParams = z.object({ id: z.string().min(1).max(64) });

export async function registerAdminAiRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", superadminOnly);

  app.get("/api/admin/ai", async (): Promise<AiStatusResponse> => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      credentials: listCredentials(app.db),
      settings: getSettings(app.db),
      usage7d: usageByPurpose(app.db, sevenDaysAgo),
      suggestedModels: SUGGESTED_MODELS,
      usingMockProvider: app.usingMockProvider,
    };
  });

  /**
   * Provider usage, server-paged through `aiCallsTableSpec`.
   *
   * One assessment generation writes a dozen rows or more, so this outgrows a "newest 50" list
   * within a day of real use. The learner name is joined on for display only — `subjectUserId` is
   * what the whitelist filters by, because a name is not unique and an id is.
   *
   * Nothing here can return a secret: `ai_calls` stores the provider, the model, token counts and
   * a redacted error string, and never the prompt, the response or the credential.
   */
  app.get("/api/admin/ai/calls", async (request) => {
    const { meta, apply } = pagedQuery(app.db, aiCallsTableSpec, schema.aiCalls, request.query);
    const rows = apply(app.db.select().from(schema.aiCalls).$dynamic()).all();

    const subjectIds = [...new Set(rows.map((r) => r.subjectUserId).filter((v): v is string => v !== null))];
    const subjects = subjectIds.length
      ? app.db
          .select({ id: schema.users.id, displayName: schema.users.displayName, username: schema.users.username })
          .from(schema.users)
          .where(inArray(schema.users.id, subjectIds))
          .all()
      : [];
    const byId = new Map(subjects.map((u) => [u.id, u]));

    return {
      meta,
      calls: rows.map((row) => ({
        ...row,
        subjectName: row.subjectUserId ? (byId.get(row.subjectUserId)?.displayName ?? null) : null,
        subjectUsername: row.subjectUserId ? (byId.get(row.subjectUserId)?.username ?? null) : null,
      })),
    };
  });

  /**
   * Saves a credential. The plaintext is encrypted immediately and never leaves the server again;
   * the response carries only the last four characters.
   */
  app.post("/api/admin/ai/credentials", async (request, reply) => {
    const actor = requireSuperadmin(request);
    const body = parseOrThrow(createCredentialRequestSchema, request.body);

    // Belt and braces: the schema enforces this too, but the acknowledgement is the one thing
    // that must not be bypassable by a hand-crafted request.
    if (requiresSharedUseAcknowledgement(body.provider) && !body.sharedUseAcknowledged) {
      throw badRequest("A subscription credential needs the shared-use acknowledgement.", {
        sharedUseAcknowledged: "Required for this provider.",
      });
    }

    const credential = createCredential(app.db, app.env, {
      provider: body.provider,
      label: body.label,
      secret: body.secret,
      sharedUseAcknowledged: body.sharedUseAcknowledged,
      createdBy: actor.id,
    });

    // Verify asynchronously: a CLI adapter can take a while, and the admin should not wait on it.
    enqueue(app.db, { type: "credential.verify", payload: { credentialId: credential.id } });

    writeAudit(app.db, {
      actorId: actor.id,
      action: "ai.credential_added",
      targetType: "ai_credential",
      targetId: credential.id,
      // The provider and the hint, never the secret.
      details: { provider: credential.provider, label: credential.label, hint: credential.secretHint },
    });

    reply.status(201);
    return { credential };
  });

  app.post("/api/admin/ai/credentials/:id/verify", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = parseOrThrow(idParams, request.params);
    if (!getCredential(app.db, id)) throw notFound("No such credential.");

    const jobId = enqueue(app.db, { type: "credential.verify", payload: { credentialId: id } });
    writeAudit(app.db, { actorId: actor.id, action: "ai.credential_verify", targetType: "ai_credential", targetId: id });
    return { jobId };
  });

  app.delete("/api/admin/ai/credentials/:id", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = parseOrThrow(idParams, request.params);
    const credential = getCredential(app.db, id);
    if (!credential) throw notFound("No such credential.");

    deleteCredential(app.db, id);
    writeAudit(app.db, {
      actorId: actor.id,
      action: "ai.credential_deleted",
      targetType: "ai_credential",
      targetId: id,
      details: { provider: credential.provider, label: credential.label },
    });
    return { ok: true };
  });

  app.put("/api/admin/ai/settings", async (request) => {
    const actor = requireSuperadmin(request);
    const body = parseOrThrow(updateAiSettingsRequestSchema, request.body);

    if (body.activeCredentialId) {
      const credential = getCredential(app.db, body.activeCredentialId);
      if (!credential) throw badRequest("That credential no longer exists.", { activeCredentialId: "Unknown credential." });
      if (requiresSharedUseAcknowledgement(credential.provider) && !credential.sharedUseAcknowledged) {
        throw badRequest("That credential is missing its shared-use acknowledgement.");
      }
    }

    const settings = updateSettings(app.db, body);
    writeAudit(app.db, {
      actorId: actor.id,
      action: "ai.settings_updated",
      targetType: "ai_settings",
      targetId: "singleton",
      details: body,
    });
    return { settings };
  });
}
