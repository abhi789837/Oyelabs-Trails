import { and, desc, eq, inArray, isNotNull, like, or, sql, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  recheckScopeSchema,
  testItemEditSchema,
  testItemListQuerySchema,
  type GroundingPassage,
  type TestItemGates,
  type TestItemRow,
  type TestItemsSummary,
  type TopicGroundingContent,
} from "../../../../shared/topicTests";
import { requireStaff, requireSuperadmin, staffOnly } from "../../auth/guards";
import { schema } from "../../db";
import { writeAudit } from "../../lib/audit";
import { badRequest, conflict, notFound, parseOrThrow } from "../../lib/errors";
import { now } from "../../lib/ids";
import { cancelRun, estimateCost, getBudgetUsd, getRun, resumeRun, setBudgetUsd, startRun, topicsInScope } from "../../topicTests/engine";
import { formatProblems } from "../../topicTests/gates";
import {
  activeCount,
  editPayload,
  ensureTopicTests,
  getGrounding,
  minimumFor,
  payloadOf,
  queueFillIfShort,
  retireRow,
  servedIdOf,
  type TestItemRowDb,
} from "../../topicTests/repo";

const idParams = z.object({ id: z.string().min(1).max(100) });
const topicParams = z.object({ topicId: z.string().min(1).max(120) });

/**
 * Admin → Curriculum → Test items (v4.3 Phase 5). Any staff member may review, retire, restore, edit
 * and regenerate; starting a re-check spends AI budget, so that is superadmin only.
 */
export async function registerAdminTopicTestRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  const groundingCache = () => {
    const cache = new Map<string, TopicGroundingContent | null>();
    return (topicId: string) => {
      if (!cache.has(topicId)) cache.set(topicId, getGrounding(app.db, topicId));
      return cache.get(topicId)!;
    };
  };

  const toRow = (row: TestItemRowDb, grounding: (id: string) => TopicGroundingContent | null): TestItemRow => {
    const location = app.content.topicIndex.get(row.topicId);
    const payload = payloadOf(row);
    const citation = payload.citation;
    const passage: GroundingPassage | null = citation ? (grounding(row.topicId)?.passages.find((p) => p.id === citation.passageId) ?? null) : null;
    return {
      id: row.id,
      servedId: servedIdOf(row),
      topicId: row.topicId,
      topicTitle: location?.meta.title ?? row.topicId,
      moduleId: location?.moduleId ?? "",
      trackId: location?.trackId ?? "",
      origin: row.origin,
      status: row.status,
      item: payload,
      gates: (row.gates as unknown as TestItemGates | null) ?? null,
      attempts: row.attempts,
      passes: row.passes,
      passRate: row.attempts ? row.passes / row.attempts : null,
      strongAttempts: row.strongAttempts,
      strongFails: row.strongFails,
      flagReason: row.flagReason,
      retiredReason: row.retiredReason,
      citedPassage: passage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  };

  const loadTopic = (topicId: string) => {
    const found = app.content.getTopic(topicId);
    if (!found) throw notFound("No such topic.");
    return found.topic;
  };

  app.get("/api/admin/topic-tests/items", async (request) => {
    const q = parseOrThrow(testItemListQuerySchema, request.query);
    const t = schema.topicTestItems;
    const where: SQL[] = [];
    let scopeIds: string[] | null = null;
    if (q.topicId) {
      // Make sure the topic's static items exist before listing them.
      const found = app.content.getTopic(q.topicId);
      if (found) ensureTopicTests(app.db, found.topic);
      scopeIds = [q.topicId];
    } else if (q.moduleId) scopeIds = topicsInScope(app.content, { kind: "module", id: q.moduleId });
    else if (q.trackId) scopeIds = topicsInScope(app.content, { kind: "track", id: q.trackId });
    if (scopeIds) where.push(scopeIds.length ? inArray(t.topicId, scopeIds) : sql`0`);
    const scopeCondition = where.length ? and(...where) : undefined;
    if (q.status) where.push(eq(t.status, q.status));
    if (q.origin) where.push(eq(t.origin, q.origin));
    if (q.flagged === "1") where.push(isNotNull(t.flagReason));
    if (q.q) where.push(or(sql`${t.item} like ${`%${q.q}%`}`, like(t.id, `%${q.q}%`), like(t.topicId, `%${q.q}%`), like(t.sourceId, `%${q.q}%`))!);
    const condition = where.length ? and(...where) : undefined;
    const total = app.db.select({ n: sql<number>`count(*)` }).from(t).where(condition).get()?.n ?? 0;
    const rows = app.db.select().from(t).where(condition).orderBy(t.topicId, desc(t.status), t.createdAt).limit(q.limit).offset(q.offset).all();
    const counts = app.db.select({ status: t.status, n: sql<number>`count(*)` }).from(t).where(scopeCondition).groupBy(t.status).all();
    const grounding = groundingCache();
    return { items: rows.map((r) => toRow(r, grounding)), total, counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) };
  });

  app.get("/api/admin/topic-tests/topics/:topicId", async (request) => {
    const { topicId } = parseOrThrow(topicParams, request.params);
    const topic = loadTopic(topicId);
    const grounding = ensureTopicTests(app.db, topic);
    return { grounding, active: activeCount(app.db, topicId), minimum: minimumFor(topic) };
  });

  const getRow = (id: string) => {
    const row = app.db.select().from(schema.topicTestItems).where(eq(schema.topicTestItems.id, id)).get();
    if (!row) throw notFound("No such test item.");
    return row;
  };

  app.post("/api/admin/topic-tests/items/:id/retire", async (request) => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params);
    const { reason } = parseOrThrow(z.object({ reason: z.string().trim().max(300).optional() }), request.body ?? {});
    const row = getRow(id);
    if (row.status === "retired") return { item: toRow(row, groundingCache()) };
    const topic = loadTopic(row.topicId);
    if (row.status === "active" && activeCount(app.db, row.topicId) - 1 < 1) {
      throw conflict("This is the topic's last active item. Restore or regenerate another first.");
    }
    retireRow(app.db, id, `admin: ${reason || "retired"}`);
    queueFillIfShort(app.db, topic, "admin retired an item");
    writeAudit(app.db, { actorId: actor.id, action: "topic_test.retire", targetType: "topic_test_item", targetId: id, details: { topicId: row.topicId, reason: reason ?? null } });
    return { item: toRow(getRow(id), groundingCache()) };
  });

  app.post("/api/admin/topic-tests/items/:id/restore", async (request) => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params);
    const row = getRow(id);
    const problems = formatProblems(payloadOf(row));
    if (problems.length) throw badRequest(`It can't go live as it is: ${problems.join("; ")}. Edit it first.`);
    app.db.update(schema.topicTestItems).set({ status: "active", retiredReason: null, flagReason: null, updatedAt: now() }).where(eq(schema.topicTestItems.id, id)).run();
    writeAudit(app.db, { actorId: actor.id, action: "topic_test.restore", targetType: "topic_test_item", targetId: id, details: { topicId: row.topicId } });
    return { item: toRow(getRow(id), groundingCache()) };
  });

  /** Edit the simple fields. A new version: its stats start again (RESEARCH §5: keep stats clean). */
  app.put("/api/admin/topic-tests/items/:id", async (request) => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params);
    const edit = parseOrThrow(testItemEditSchema, request.body);
    const row = getRow(id);
    if (edit.correctIndices.some((i) => i >= edit.options.length)) throw badRequest("A correct answer points at no option.");
    const next = editPayload(payloadOf(row), edit);
    const problems = formatProblems(next);
    if (problems.length) throw badRequest(`Not saved: ${problems.join("; ")}.`);
    app.db
      .update(schema.topicTestItems)
      .set({ item: next as unknown as Record<string, unknown>, attempts: 0, passes: 0, strongAttempts: 0, strongFails: 0, flagReason: null, updatedAt: now() })
      .where(eq(schema.topicTestItems.id, id))
      .run();
    writeAudit(app.db, {
      actorId: actor.id,
      action: "topic_test.edit",
      targetType: "topic_test_item",
      targetId: id,
      details: { topicId: row.topicId, previousStats: { attempts: row.attempts, passes: row.passes } },
    });
    return { item: toRow(getRow(id), groundingCache()) };
  });

  /** Retire this item and write a replacement (queued). */
  app.post("/api/admin/topic-tests/items/:id/regenerate", async (request) => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params);
    const row = getRow(id);
    const topic = loadTopic(row.topicId);
    if (row.status === "active") {
      app.db.update(schema.topicTestItems).set({ flagReason: "admin asked to regenerate; retire pending replacement", updatedAt: now() }).where(eq(schema.topicTestItems.id, id)).run();
    }
    const queued = queueFillIfShort(app.db, topic, "retire pending");
    writeAudit(app.db, { actorId: actor.id, action: "topic_test.regenerate", targetType: "topic_test_item", targetId: id, details: { topicId: row.topicId } });
    return { queued };
  });

  app.post("/api/admin/topic-tests/topics/:topicId/fill", async (request) => {
    requireStaff(request);
    const { topicId } = parseOrThrow(topicParams, request.params);
    const topic = loadTopic(topicId);
    ensureTopicTests(app.db, topic);
    return { queued: queueFillIfShort(app.db, topic, "retire pending") };
  });

  app.get("/api/admin/topic-tests/summary", async (): Promise<TestItemsSummary> => {
    const t = schema.topicTestItems;
    const counts = app.db.select({ status: t.status, n: sql<number>`count(*)` }).from(t).groupBy(t.status).all();
    const byOrigin = app.db.select({ origin: t.origin, n: sql<number>`count(*)` }).from(t).where(eq(t.status, "active")).groupBy(t.origin).all();
    const flagged = app.db.select({ n: sql<number>`count(*)` }).from(t).where(and(eq(t.status, "active"), isNotNull(t.flagReason))).get()?.n ?? 0;
    // Estimate over the whole curriculum's quiz topics, from the content (not the DB, which may still be importing).
    let topics = 0;
    let items = 0;
    for (const track of app.content.manifest) {
      for (const mod of track.modules) {
        for (const topic of mod.topics) {
          if (topic.challengeType !== "quiz") continue;
          topics += 1;
          items += Math.max(topic.challengeSize, 5);
        }
      }
    }
    return {
      counts: Object.fromEntries(counts.map((c) => [c.status, c.n])),
      byOrigin: Object.fromEntries(byOrigin.map((c) => [c.origin, c.n])),
      flagged,
      run: getRun(app.db),
      budgetUsd: getBudgetUsd(app.db),
      estimate: estimateCost(topics, items),
    };
  });

  app.post("/api/admin/topic-tests/recheck", async (request) => {
    const actor = requireSuperadmin(request);
    const scope = parseOrThrow(recheckScopeSchema, request.body);
    if (scope.kind !== "all" && !scope.id) throw badRequest("Pick what to re-check.");
    if (topicsInScope(app.content, scope).length === 0) throw notFound("Nothing in that scope.");
    if (!app.ai.isConfigured()) throw conflict("Set up an AI connection first.");
    try {
      const run = startRun(app.db, app.content, scope);
      writeAudit(app.db, { actorId: actor.id, action: "topic_test.recheck", targetType: "topic_tests", targetId: run.runId, details: { scope, topics: run.topicIds.length, budgetUsd: run.budgetUsd } });
      return { run };
    } catch (error) {
      throw conflict(error instanceof Error ? error.message : "Could not start the re-check.");
    }
  });

  app.post("/api/admin/topic-tests/recheck/cancel", async (request) => {
    requireSuperadmin(request);
    return { run: cancelRun(app.db) };
  });

  app.post("/api/admin/topic-tests/recheck/resume", async (request) => {
    requireSuperadmin(request);
    return { run: resumeRun(app.db) };
  });

  app.put("/api/admin/topic-tests/budget", async (request) => {
    const actor = requireSuperadmin(request);
    const { budgetUsd } = parseOrThrow(z.object({ budgetUsd: z.number().min(0.5).max(10_000) }), request.body);
    setBudgetUsd(app.db, budgetUsd);
    writeAudit(app.db, { actorId: actor.id, action: "topic_test.budget", targetType: "topic_tests", details: { budgetUsd } });
    return { budgetUsd };
  });
}
