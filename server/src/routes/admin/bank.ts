import { and, asc, eq, like, or, sql, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { bankItemSchema, bankItemTypeSchema, bankStatusSchema } from "../../../../shared/bank";
import { requireStaff, staffOnly } from "../../auth/guards";
import { queueBankFill } from "../../bank/fill";
import { fromRow, toColumns } from "../../bank/repo";
import { bankCoverage, recomputeBankStats } from "../../bank/stats";
import { validateBankItem } from "../../bank/validate";
import { schema } from "../../db";
import { writeAudit } from "../../lib/audit";
import { badRequest, conflict, notFound, parseOrThrow } from "../../lib/errors";
import { now } from "../../lib/ids";
import { runnerDeps } from "../../assessment/v4";

const idParams = z.object({ id: z.string().min(1).max(100) });

const listQuery = z.object({
  departmentId: z.string().optional(),
  skillId: z.string().optional(),
  type: bankItemTypeSchema.optional(),
  status: bankStatusSchema.optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  q: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * `/admin/question-bank` (v4 Phase 5): filter, preview, edit, retire and approve items, see each
 * item's stats, and ask for a gap fill. An edit re-validates the item; a coding item that no
 * longer validates drops to `draft` rather than staying live with a broken key.
 */
export async function registerAdminBankRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  app.get("/api/admin/question-bank", async (request) => {
    const q = parseOrThrow(listQuery, request.query);
    const t = schema.questionBank;
    const where: SQL[] = [];
    if (q.departmentId) where.push(eq(t.departmentId, q.departmentId));
    if (q.skillId) where.push(eq(t.skillId, q.skillId));
    if (q.type) where.push(eq(t.type, q.type));
    if (q.status) where.push(eq(t.status, q.status));
    if (q.difficulty) where.push(eq(t.difficulty, q.difficulty));
    if (q.q) where.push(or(like(t.prompt, `%${q.q}%`), like(t.id, `%${q.q}%`))!);
    const condition = where.length ? and(...where) : undefined;
    const total = app.db.select({ n: sql<number>`count(*)` }).from(t).where(condition).get()?.n ?? 0;
    const rows = app.db.select().from(t).where(condition).orderBy(asc(t.skillId), asc(t.difficulty), asc(t.id)).limit(q.limit).offset(q.offset).all();
    const counts = app.db
      .select({ status: t.status, n: sql<number>`count(*)` })
      .from(t)
      .where(q.departmentId ? eq(t.departmentId, q.departmentId) : undefined)
      .groupBy(t.status)
      .all();
    return { items: rows.map(fromRow), total, counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) };
  });

  app.get("/api/admin/question-bank/coverage", async (request) => {
    const { departmentId } = parseOrThrow(z.object({ departmentId: z.string().min(1) }), request.query);
    return { coverage: Object.fromEntries(bankCoverage(app.db, departmentId)) };
  });

  app.get("/api/admin/question-bank/:id", async (request) => {
    const { id } = parseOrThrow(idParams, request.params);
    const row = app.db.select().from(schema.questionBank).where(eq(schema.questionBank.id, id)).get();
    if (!row) throw notFound("No such item.");
    return { item: fromRow(row) };
  });

  /** Create or replace an item. It goes live only if it validates; otherwise it is a draft with the reasons. */
  app.put("/api/admin/question-bank/:id", async (request) => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params);
    const item = parseOrThrow(bankItemSchema, { ...(request.body as object), id });
    const existing = app.db.select().from(schema.questionBank).where(eq(schema.questionBank.id, id)).get();
    const problems = await validateBankItem(runnerDeps(app), item);
    const status: "draft" | "active" | "retired" = problems.length ? "draft" : existing?.status === "retired" ? "retired" : "active";
    const at = now();
    const values = { ...toColumns(item), status, validatedAt: problems.length ? null : at, updatedAt: at, retiredReason: problems.length ? `invalid: ${problems.join("; ").slice(0, 300)}` : (existing?.retiredReason ?? null) };
    if (existing) app.db.update(schema.questionBank).set(values).where(eq(schema.questionBank.id, id)).run();
    else app.db.insert(schema.questionBank).values({ ...values, source: "admin", createdAt: at }).run();
    writeAudit(app.db, { actorId: actor.id, action: existing ? "bank.item_updated" : "bank.item_created", targetType: "bank_item", targetId: id, details: { status, problems: problems.length } });
    return { item: fromRow(app.db.select().from(schema.questionBank).where(eq(schema.questionBank.id, id)).get()!), problems };
  });

  /** Approve a draft (re-validated first), retire an item, or restore a retired one. */
  app.post("/api/admin/question-bank/:id/status", async (request) => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params);
    const { status, reason } = parseOrThrow(z.object({ status: z.enum(["active", "retired"]), reason: z.string().max(300).optional() }), request.body);
    const row = app.db.select().from(schema.questionBank).where(eq(schema.questionBank.id, id)).get();
    if (!row) throw notFound("No such item.");
    if (status === "active") {
      const parsed = bankItemSchema.safeParse({ ...fromRow(row) });
      if (!parsed.success) throw badRequest("This item is not well-formed; edit it first.");
      const problems = await validateBankItem(runnerDeps(app), parsed.data);
      if (problems.length) throw conflict(`It does not validate yet: ${problems.join("; ").slice(0, 300)}`);
    }
    app.db
      .update(schema.questionBank)
      .set({ status, retiredReason: status === "retired" ? (reason ?? "retired by an admin") : null, validatedAt: status === "active" ? now() : row.validatedAt, updatedAt: now() })
      .where(eq(schema.questionBank.id, id))
      .run();
    writeAudit(app.db, { actorId: actor.id, action: `bank.item_${status === "active" ? "approved" : "retired"}`, targetType: "bank_item", targetId: id });
    return { item: fromRow(app.db.select().from(schema.questionBank).where(eq(schema.questionBank.id, id)).get()!) };
  });

  app.post("/api/admin/question-bank/fill", async (request) => {
    const actor = requireStaff(request);
    const body = parseOrThrow(z.object({ departmentId: z.string().min(1), skillId: z.string().min(1), type: bankItemTypeSchema, missing: z.number().int().min(1).max(20).default(6) }), request.body);
    const queued = queueBankFill(app.db, body.departmentId, [{ skillId: body.skillId, type: body.type, missing: body.missing }]);
    writeAudit(app.db, { actorId: actor.id, action: "bank.fill_requested", targetType: "skill", targetId: body.skillId, details: { type: body.type, queued } });
    return { queued };
  });

  app.post("/api/admin/question-bank/recompute", async (request) => {
    const actor = requireStaff(request);
    const result = recomputeBankStats(app.db);
    writeAudit(app.db, { actorId: actor.id, action: "bank.stats_recomputed", details: { updated: result.updated, retired: result.retired.length } });
    return result;
  });
}
