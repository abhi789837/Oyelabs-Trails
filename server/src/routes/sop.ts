import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import { saveSopRequestSchema, sopParamsSchema, sopTopicParamsSchema, type SopBlock, type SopListRow } from "../../../shared/sop";
import { requireActiveUser, requireStaff } from "../auth/guards";
import type { ContentStore } from "../content/store";
import type { Db } from "../db";
import { schema } from "../db";
import { writeAudit } from "../lib/audit";
import { notFound, parseOrThrow } from "../lib/errors";
import { allowedTopicIdsFor } from "../plans/repo";

function blocksFor(db: Db, content: ContentStore, topicId: string): SopBlock[] | null {
  const found = content.getTopic(topicId);
  if (!found) return null;
  const sop = found.topic.sop ?? [];
  const rows = db.select().from(schema.sopEntries).where(eq(schema.sopEntries.topicId, topicId)).all();
  return sop.map((block, index) => {
    const row = rows.find((r) => r.blockIndex === index);
    return { index, title: block.title, prompt: block.prompt, body: row?.body || null, updatedAt: row?.updatedAt ?? null };
  });
}

/**
 * v4.1 SOP blocks. Learners read them on the topic; staff write them. Any staff member may write
 * one: these are delivery procedures the department leads own, not credentials (decision D5).
 */
export async function registerSopRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/content/topics/:topicId/sop", async (request): Promise<{ blocks: SopBlock[] }> => {
    const user = requireActiveUser(request);
    const { topicId } = parseOrThrow(sopTopicParamsSchema, request.params, "Unknown topic.");
    const allowed = allowedTopicIdsFor(app.db, user);
    if (allowed && !allowed.has(topicId)) throw notFound("That topic isn't part of your plan.");
    const blocks = blocksFor(app.db, app.content, topicId);
    if (!blocks) throw notFound("That topic doesn't exist.");
    return { blocks };
  });

  app.get("/api/admin/sop", async (request): Promise<{ rows: SopListRow[] }> => {
    requireStaff(request);
    const rows: SopListRow[] = [];
    for (const topicId of app.content.orderedTopicIds) {
      const found = app.content.getTopic(topicId);
      if (!found?.topic.sop?.length) continue;
      for (const block of blocksFor(app.db, app.content, topicId) ?? []) {
        rows.push({ ...block, topicId, topicTitle: found.topic.title, trackId: found.module.trackId, moduleId: found.module.id });
      }
    }
    return { rows };
  });

  app.put("/api/admin/sop/:topicId/:index", async (request): Promise<{ block: SopBlock }> => {
    const actor = requireStaff(request);
    const { topicId, index } = parseOrThrow(sopParamsSchema, request.params, "Unknown SOP block.");
    const { body } = parseOrThrow(saveSopRequestSchema, request.body, "That SOP text is not valid.");
    const found = app.content.getTopic(topicId);
    if (!found || !found.topic.sop?.[index]) throw notFound("That SOP block doesn't exist.");
    const where = and(eq(schema.sopEntries.topicId, topicId), eq(schema.sopEntries.blockIndex, index));
    if (!body) app.db.delete(schema.sopEntries).where(where).run();
    else {
      const values = { topicId, blockIndex: index, body, updatedBy: actor.id, updatedAt: Date.now() };
      app.db
        .insert(schema.sopEntries)
        .values(values)
        .onConflictDoUpdate({ target: [schema.sopEntries.topicId, schema.sopEntries.blockIndex], set: { body, updatedBy: actor.id, updatedAt: values.updatedAt } })
        .run();
    }
    writeAudit(app.db, { actorId: actor.id, action: "sop.save", targetType: "topic", targetId: topicId, details: { index, cleared: !body } });
    return { block: blocksFor(app.db, app.content, topicId)![index] };
  });
}
