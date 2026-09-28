import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  moveItemRequestSchema,
  regenerateWeekRequestSchema,
  type WeekResponse,
} from "../../../../shared/weeklyPlan";
import { requireStaff, staffOnly } from "../../auth/guards";
import { schema } from "../../db";
import { writeAudit } from "../../lib/audit";
import { notFound, parseOrThrow } from "../../lib/errors";
import { generateWeek } from "../../plans/weekly/generate";
import { activeWeek, updateItem, weekHistory, weekView } from "../../plans/weekly/repo";

/**
 * The admin's side of the weekly plan.
 *
 * Everything here is an override, and every one of them is written to the audit log. That is the point:
 * the week is generated from the admin's own priorities, so an admin reaching past that to move a single
 * item is saying the generation got something wrong — which is worth recording, both so the next person
 * can see it happened and so a pattern of the same override every week is visible as a signal that the
 * priorities themselves need editing.
 */
export async function registerAdminWeekRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  const learner = (id: string) => {
    const user = app.db
      .select({ id: schema.users.id, role: schema.users.role, displayName: schema.users.displayName })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .get();
    if (!user) throw notFound("No such person.");
    return user;
  };

  /** This person's current week, plus the history, exactly as the learner sees it. */
  app.get("/api/admin/users/:id/week", async (request): Promise<WeekResponse> => {
    const { id } = parseOrThrow(z.object({ id: z.string().min(1).max(64) }), request.params);
    learner(id);

    const row = activeWeek(app.db, id);
    return {
      week: row ? weekView(app.db, app.content, id, row) : null,
      history: weekHistory(app.db, id),
      reason: row ? null : "No week has been generated yet. It is built the first time they open their plan.",
    };
  });

  /**
   * Rebuild the week.
   *
   * `advance` starts the next one and carries unfinished work forward; without it the current week is
   * reshaped in place, keeping its number and dates — an admin moving two items on a Wednesday has not
   * started a new week. `rulesOnly` skips the model, which is the fast, free answer when the lanes are
   * what needs fixing rather than the prose.
   */
  app.post("/api/admin/users/:id/week/regenerate", async (request) => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(z.object({ id: z.string().min(1).max(64) }), request.params);
    const body = parseOrThrow(regenerateWeekRequestSchema, request.body ?? {});
    learner(id);

    const result = await generateWeek(
      { db: app.db, content: app.content, ai: app.ai, log: (message) => app.log.info(message) },
      { userId: id, rulesOnly: body.rulesOnly, advance: body.advance, generatedBy: actor.id },
    );

    writeAudit(app.db, {
      actorId: actor.id,
      action: "week.regenerated",
      targetType: "user",
      targetId: id,
      details: {
        weekNumber: result.weekNumber,
        source: result.source,
        advance: body.advance,
        rulesOnly: body.rulesOnly,
        adjustments: result.adjustments.length,
      },
    });

    const row = activeWeek(app.db, id);
    return {
      week: row ? weekView(app.db, app.content, id, row) : null,
      history: weekHistory(app.db, id),
      reason: result.reason,
    };
  });

  /**
   * Move one item between lanes, or pin it to Do it now.
   *
   * A pin survives regeneration, which is the whole reason it exists rather than just a lane change:
   * "this person needs to do this, this week" should not be undone by Sunday's rollover.
   */
  app.patch("/api/admin/users/:id/week/items/:itemId", async (request): Promise<WeekResponse> => {
    const actor = requireStaff(request);
    const { id, itemId } = parseOrThrow(
      z.object({ id: z.string().min(1).max(64), itemId: z.string().min(1).max(64) }),
      request.params,
    );
    const patch = parseOrThrow(moveItemRequestSchema, request.body ?? {});
    learner(id);

    const row = activeWeek(app.db, id);
    if (!row) throw notFound("They have no current week to edit.");

    const item = app.db.select().from(schema.weeklyPlanItems).where(eq(schema.weeklyPlanItems.id, itemId)).get();
    // Not "not yours to edit": whether an item id exists in someone else's week is not worth leaking.
    if (!item || item.planId !== row.id) throw notFound("No such item in their current week.");

    const updated = updateItem(app.db, itemId, patch);
    if (!updated) throw notFound("No such item in their current week.");

    writeAudit(app.db, {
      actorId: actor.id,
      action: "week.item.moved",
      targetType: "user",
      targetId: id,
      details: {
        itemId,
        from: item.lane,
        to: updated.lane,
        pinned: updated.pinned,
        topicId: item.topicId,
        lessonId: item.lessonId,
      },
    });

    return { week: weekView(app.db, app.content, id, row), history: weekHistory(app.db, id), reason: null };
  });
}
