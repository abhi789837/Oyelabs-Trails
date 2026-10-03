import crypto from "node:crypto";

import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { bulkOnboardRowSchema, MAX_BULK_ROWS, type BulkOnboardResult } from "../../../../shared/bulkOnboard";
import { onboardSuggestRequestSchema, type OnboardSuggestion } from "../../../../shared/goals";
import { suggestOnboarding } from "../../goals/suggest";
import { issueAssessment } from "../../assessment/issue";
import { generatePassword, hashPassword } from "../../auth/password";
import { requireStaff, staffOnly } from "../../auth/guards";
import { schema } from "../../db";
import { writeAudit } from "../../lib/audit";
import { fieldsFromZod, HttpError, parseOrThrow } from "../../lib/errors";
import { newId, now } from "../../lib/ids";
import { saveSetup } from "../../setup/repo";

const requestSchema = z.object({ rows: z.array(z.unknown()).min(1).max(MAX_BULK_ROWS) });
const suggestBatchSchema = z.object({ rows: z.array(z.unknown()).min(1).max(MAX_BULK_ROWS) });

/** How many Suggest calls run at once for a pasted list: quick, without bursting the provider. */
export const SUGGEST_CONCURRENCY = 4;

/** Runs `work` over `items` with at most `limit` in flight, keeping the order of the results. */
export async function mapLimited<T, R>(items: readonly T[], limit: number, work: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const lane = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await work(items[i]!, i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  return out;
}

/**
 * v4.3 Phase 6: bulk onboarding. The same three steps as quick onboarding — create the account,
 * save the setup, issue the assessment — once per row, each row on its own:
 * - a row that fails (a taken username, an unknown track) creates nothing and the others go on;
 * - the account and its setup are written in one transaction, so a bad setup leaves no account;
 * - the assessment is issued after the commit, as the single flow does. If issuing fails, the
 *   account still exists and the row says so; the learner page then offers "Assign assessment".
 *
 * Learners only: staff accounts are created one at a time on purpose.
 */
export async function registerAdminBulkOnboardRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  /**
   * Quick onboarding's Suggest for every pasted row in one request (the single Suggest is rate
   * limited per minute, which a 30-row paste would hit). Same function, per row, a few at a time;
   * a row that fails gets its error and the rest still come back.
   */
  app.post("/api/admin/onboard/suggest-batch", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request) => {
    requireStaff(request);
    const { rows } = parseOrThrow(suggestBatchSchema, request.body);
    const results = await mapLimited(rows, SUGGEST_CONCURRENCY, async (raw, index): Promise<{ index: number; suggestion?: OnboardSuggestion; error?: string }> => {
      const parsed = onboardSuggestRequestSchema.safeParse(raw);
      if (!parsed.success) return { index, error: Object.values(fieldsFromZod(parsed.error))[0] ?? "This row is not valid." };
      try {
        return { index, suggestion: await suggestOnboarding({ db: app.db, ai: app.ai }, parsed.data) };
      } catch (err) {
        return { index, error: err instanceof HttpError ? err.message : "Suggest did not answer for this row." };
      }
    });
    return { results, aiAvailable: app.ai.isConfigured() };
  });

  app.post("/api/admin/onboard/bulk", async (request) => {
    const actor = requireStaff(request);
    const { rows } = parseOrThrow(requestSchema, request.body);
    const seen = new Set<string>();
    const results: BulkOnboardResult[] = [];

    for (const [index, raw] of rows.entries()) {
      const parsed = bulkOnboardRowSchema.safeParse(raw);
      const label = (raw ?? {}) as { username?: unknown; displayName?: unknown };
      const echo = { index, username: String(label.username ?? ""), displayName: String(label.displayName ?? "") };
      if (!parsed.success) {
        const fields = fieldsFromZod(parsed.error);
        const [field, message] = Object.entries(fields)[0] ?? ["", "This row is not valid."];
        results.push({ ...echo, ok: false, error: message, field: field || undefined });
        continue;
      }
      const row = parsed.data;
      const out = { index, username: row.username, displayName: row.displayName };

      if (seen.has(row.username)) {
        results.push({ ...out, ok: false, error: "Used twice in this list.", field: "username" });
        continue;
      }
      seen.add(row.username);
      const taken = app.db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.username, row.username)).get();
      if (taken) {
        results.push({ ...out, ok: false, error: "That username is already taken.", field: "username" });
        continue;
      }

      const password = generatePassword((n) => crypto.randomBytes(n), 12);
      const passwordHash = await hashPassword(password);
      const id = newId();
      try {
        app.db.transaction(() => {
          app.db.insert(schema.users)
            .values({ id, username: row.username, displayName: row.displayName, passwordHash, role: "learner", status: "active", mustChangePassword: true, createdBy: actor.id, createdAt: now() })
            .run();
          /* Throws on an unknown department, track or skill: the transaction then drops the account
             too. One SQLite connection, so these writes (and saveSetup's own nested transaction, a
             savepoint) are inside this one. */
          saveSetup(app.db, id, row.setup, actor.id);
        });
      } catch (err) {
        const message = err instanceof HttpError ? err.message : "Could not save this row.";
        const field = err instanceof HttpError && err.fields ? Object.keys(err.fields)[0] : undefined;
        if (!(err instanceof HttpError)) request.log.error({ err }, "bulk onboarding row failed");
        results.push({ ...out, ok: false, error: message, field });
        continue;
      }

      writeAudit(app.db, {
        actorId: actor.id,
        action: "user.onboarded",
        targetType: "user",
        targetId: id,
        details: { username: row.username, role: "learner", bulk: true, goals: row.setup.goals?.length ?? 0, notesLength: row.setup.description?.length ?? 0 },
      });

      let issued: BulkOnboardResult["issued"] = null;
      let issueError: string | undefined;
      try {
        const r = issueAssessment(app, { userId: id, actorId: actor.id });
        issued = { assessmentId: r.assessmentId, status: r.status, ...(r.notice ? { notice: r.notice } : {}) };
      } catch (err) {
        issueError = err instanceof HttpError ? err.message : "The assessment was not issued.";
      }
      results.push({ ...out, ok: true, userId: id, temporaryPassword: password, issued, ...(issueError ? { issueError } : {}) });
    }

    return { results };
  });
}
