import fs from "node:fs";
import path from "node:path";

import { desc, eq, inArray } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";

import type { GenerationLogLine } from "../../../../shared/assessment";
import type { Severity } from "../../../../shared/enums";
import { requireSuperadmin, superadminOnly } from "../../auth/guards";
import { integrityEventsFor, integritySummary } from "../../assessment/integrity";
import { finishAndEvaluate } from "../assessment";
import { schema } from "../../db";
import { writeAudit } from "../../lib/audit";
import { badRequest, notFound, parseOrThrow } from "../../lib/errors";
import { notify } from "../../lib/notify";
import { now } from "../../lib/ids";

/**
 * The admin's live view (brief §10.5) over server-sent events (D12).
 *
 * SSE rather than websockets: this is strictly one-way, it survives a reverse proxy without an
 * upgrade, and a dropped connection reconnects by itself. Caddy needs `flush_interval -1` so
 * events are not buffered — the Caddyfile example says so.
 */

export interface LiveIntegrityEvent {
  assessmentId: string;
  userId: string;
  type: string;
  severity: Severity;
  counted: boolean;
  hardWarnings: number;
  terminated: boolean;
  snapshotPath: string | null;
  at: number;
}

type Subscriber = { id: number; reply: FastifyReply };

const subscribers = new Map<FastifyInstance, Set<Subscriber>>();
let nextSubscriberId = 1;

/** Called from the event route. Never throws: a failing feed must not fail the learner's request. */
export function publishIntegrityEvent(app: FastifyInstance, event: LiveIntegrityEvent): void {
  const set = subscribers.get(app);
  if (!set || set.size === 0) return;

  const frame = `event: integrity\ndata: ${JSON.stringify(event)}\n\n`;
  for (const subscriber of [...set]) {
    try {
      subscriber.reply.raw.write(frame);
    } catch {
      set.delete(subscriber);
    }
  }
}

/**
 * Called from the blueprint job as each generation log line is stored.
 *
 * Same stream, a second event name: the admin console already holds one connection open, and a
 * second one per watched assessment would be a connection per open tab for no gain. Never throws
 * — a failing feed must not fail a generation — and the line is already redacted by the time it
 * gets here.
 */
export function publishGenerationLine(app: FastifyInstance, line: GenerationLogLine): void {
  try {
    const set = subscribers.get(app);
    if (!set || set.size === 0) return;

    const frame = `event: generation\ndata: ${JSON.stringify(line)}\n\n`;
    for (const subscriber of [...set]) {
      try {
        subscriber.reply.raw.write(frame);
      } catch {
        set.delete(subscriber);
      }
    }
  } catch {
    /* the feed is best-effort */
  }
}

const assessmentParams = z.object({ assessmentId: z.string().min(1).max(64) });

export async function registerAdminLiveRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", superadminOnly);

  if (!subscribers.has(app)) subscribers.set(app, new Set());
  app.addHook("onClose", async () => {
    const set = subscribers.get(app);
    for (const subscriber of set ?? []) subscriber.reply.raw.end();
    subscribers.delete(app);
  });

  /** In-progress assessments, for the live board. */
  app.get("/api/admin/live", async () => {
    const rows = app.db
      .select()
      .from(schema.assessments)
      .where(
        inArray(schema.assessments.status, [
          "in_progress",
          "submitted",
          "evaluating",
          "generating",
          "awaiting_approval",
        ]),
      )
      .orderBy(desc(schema.assessments.startedAt))
      .all();

    const userIds = [...new Set(rows.map((r) => r.userId))];
    const users = userIds.length
      ? app.db.select().from(schema.users).where(inArray(schema.users.id, userIds)).all()
      : [];
    const byId = new Map(users.map((u) => [u.id, u]));

    return {
      live: rows.map((row) => {
        const config = (row.config as { selector?: { servedCount?: number }; timeLimitMinutes?: number } | null) ?? {};
        const events = integrityEventsFor(app.db, row.id).slice(0, 5);
        return {
          assessmentId: row.id,
          userId: row.userId,
          displayName: byId.get(row.userId)?.displayName ?? "Unknown",
          username: byId.get(row.userId)?.username ?? "",
          status: row.status,
          answered: config.selector?.servedCount ?? 0,
          startedAt: row.startedAt,
          deadlineAt: row.deadlineAt,
          msLeft: row.deadlineAt ? Math.max(0, row.deadlineAt - now()) : null,
          hardWarnings: row.hardWarnings,
          softWarnings: row.softWarnings,
          lastHeartbeatAt: row.lastHeartbeatAt,
          recentEvents: events.map((e) => ({
            id: e.id,
            type: e.type,
            severity: e.severity,
            counted: e.counted,
            createdAt: e.createdAt,
            snapshotPath: e.snapshotPath,
          })),
        };
      }),
    };
  });

  /**
   * The event stream. Held open; a comment frame every 20 s keeps proxies from closing it.
   */
  app.get("/api/admin/live/stream", async (request, reply) => {
    requireSuperadmin(request);

    reply.raw.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // Tells nginx not to buffer; Caddy is configured with flush_interval instead.
      "x-accel-buffering": "no",
    });
    reply.raw.write(": connected\n\n");

    const subscriber: Subscriber = { id: nextSubscriberId++, reply };
    const set = subscribers.get(app) ?? new Set();
    set.add(subscriber);
    subscribers.set(app, set);

    const keepAlive = setInterval(() => {
      try {
        reply.raw.write(": ping\n\n");
      } catch {
        clearInterval(keepAlive);
      }
    }, 20_000);
    keepAlive.unref?.();

    request.raw.on("close", () => {
      clearInterval(keepAlive);
      set.delete(subscriber);
    });

    // Never resolves: the reply stays open until the client disconnects.
    return reply;
  });

  app.get("/api/admin/assessments/:assessmentId/integrity", async (request) => {
    const { assessmentId } = parseOrThrow(assessmentParams, request.params);
    const assessment = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
    if (!assessment) throw notFound("No such assessment.");

    return {
      summary: integritySummary(app.db, assessmentId),
      events: integrityEventsFor(app.db, assessmentId),
    };
  });

  /**
   * Serves a snapshot to the superadmin only (§10.6). Never from a static path: these are
   * pictures of people taken during a test, and a guessable URL would be a leak.
   */
  app.get("/api/admin/snapshots/*", async (request, reply) => {
    requireSuperadmin(request);
    const relative = (request.params as Record<string, string>)["*"] ?? "";

    // Resolve and confirm the result is still inside the snapshots directory, so "../" cannot
    // walk out of it.
    const full = path.resolve(app.env.snapshotsDir, relative);
    if (!full.startsWith(path.resolve(app.env.snapshotsDir) + path.sep)) throw notFound("No such snapshot.");
    if (!fs.existsSync(full)) throw notFound("No such snapshot.");

    return reply.type("image/jpeg").header("cache-control", "private, max-age=300").send(fs.createReadStream(full));
  });

  app.post("/api/admin/assessments/:assessmentId/terminate", async (request) => {
    const actor = requireSuperadmin(request);
    const { assessmentId } = parseOrThrow(assessmentParams, request.params);

    const assessment = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
    if (!assessment) throw notFound("No such assessment.");
    if (assessment.status !== "in_progress") throw badRequest("That assessment is not in progress.");

    app.db
      .update(schema.assessments)
      .set({ terminatedReason: `Ended by ${actor.username}.` })
      .where(eq(schema.assessments.id, assessmentId))
      .run();
    finishAndEvaluate(app, assessmentId, "terminated");

    notify(app.db, {
      recipientId: assessment.userId,
      kind: "assessment.terminated",
      title: "Your assessment was ended",
      body: "An administrator ended your assessment. Speak to them about what happens next.",
      link: "/plan",
    });

    writeAudit(app.db, {
      actorId: actor.id,
      action: "assessment.terminated",
      targetType: "assessment",
      targetId: assessmentId,
      details: { userId: assessment.userId },
    });
    return { ok: true };
  });

  /** Adds ten minutes to a live assessment (§10.5). */
  app.post("/api/admin/assessments/:assessmentId/extend", async (request) => {
    const actor = requireSuperadmin(request);
    const { assessmentId } = parseOrThrow(assessmentParams, request.params);

    const assessment = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
    if (!assessment) throw notFound("No such assessment.");
    if (assessment.status !== "in_progress" || !assessment.deadlineAt) {
      throw badRequest("That assessment is not in progress.");
    }

    const deadlineAt = assessment.deadlineAt + 10 * 60_000;
    app.db.update(schema.assessments).set({ deadlineAt }).where(eq(schema.assessments.id, assessmentId)).run();

    writeAudit(app.db, {
      actorId: actor.id,
      action: "assessment.extended",
      targetType: "assessment",
      targetId: assessmentId,
      details: { minutes: 10 },
    });
    return { deadlineAt };
  });
}
