import fs from "node:fs";
import path from "node:path";

import { and, desc, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import { BODY_LIMIT_SNAPSHOT } from "../../../shared/api";
import {
  answerRequestSchema,
  CONSENT_POLICY_VERSION,
  consentRequestSchema,
  startRequestSchema,
  type ConsentRequest,
  type ConsentStatus,
  DEFAULT_TIME_LIMIT_MIN,
  EXPLAIN_BUDGET_MIN,
  heartbeatRequestSchema,
  integrityEventRequestSchema,
  type Blueprint,
  type ItemKey,
  type ItemPayload,
  type MyAssessment,
  type NextItemResponse,
  type StartResponse,
} from "../../../shared/assessment";
import type { Difficulty } from "../../../shared/assessment";
import type { ItemKind } from "../../../shared/enums";
import { requireActiveUser } from "../auth/guards";
import { autoScoreItem, hasResponse } from "../assessment/gradeItem";
import { HARD_LIMIT, MAX_PAUSE_PER_WARNING_MS, recordIntegrityEvent } from "../assessment/integrity";
import {
  currentSection,
  initSelectorState,
  normaliseState,
  recordOutcome,
  selectNext,
  type PoolItemRef,
  type SelectorState,
} from "../assessment/selector";
import { schema } from "../db";
import { enqueue } from "../jobs/queue";
import { SECTION_ORDER } from "../../../shared/sections";
import { badRequest, conflict, forbidden, notFound, parseOrThrow } from "../lib/errors";
import { newId, now } from "../lib/ids";
import { publishIntegrityEvent } from "./admin/live";

const idParams = z.object({ id: z.string().min(1).max(64) });
const itemParams = z.object({ id: z.string().min(1).max(64), itemId: z.string().min(1).max(64) });

/** An answer arriving slightly after its limit is accepted; anything later is not (§9.5). */
const GRACE_MS = 5000;

interface StoredConfig {
  timeLimitMinutes?: number;
  areas?: string[];
  selector?: SelectorState;
  /** Accumulated pause from warning modals, added to the deadline. */
  pausedMs?: number;
  /** The item currently served, so a late or out-of-order answer can be rejected. */
  currentItemId?: string | null;
  currentItemExpiresAt?: number | null;
  currentAreaIndex?: number | null;
  /** True once the adaptive section has finished and the written answers begin. */
  writtenSection?: boolean;
}

export async function registerAssessmentRoutes(app: FastifyInstance): Promise<void> {
  /** The assessment this learner should be taking, if any. Drives the §12 funnel. */
  app.get("/api/me/assessment", async (request): Promise<{ assessment: MyAssessment | null }> => {
    const user = requireActiveUser(request);
    /* With several assessments open at once, "the latest" is the wrong answer: issuing a second one
       would silently switch the learner away from the one they had already started. Pick by what
       they should act on — the sitting already underway first, then the oldest one waiting for
       them, then anything the server is still working on — and only fall back to the newest when
       nothing is pending at all. */
    const rows = app.db
      .select()
      .from(schema.assessments)
      .where(eq(schema.assessments.userId, user.id))
      .orderBy(desc(schema.assessments.attemptNo))
      .all();
    if (rows.length === 0) return { assessment: null };

    const oldestFirst = [...rows].reverse();
    const row =
      oldestFirst.find((a) => a.status === "in_progress") ??
      oldestFirst.find((a) => a.status === "ready") ??
      oldestFirst.find((a) => ["generating", "awaiting_approval", "submitted", "evaluating"].includes(a.status)) ??
      rows[0];

    const config = (row.config as StoredConfig | null) ?? {};
    return {
      assessment: {
        id: row.id,
        status: row.status,
        attemptNo: row.attemptNo,
        label: row.label,
        consentAt: row.consentAt,
        deadlineAt: row.deadlineAt,
        hardWarnings: row.hardWarnings,
        hardLimit: HARD_LIMIT,
        timeLimitMinutes: config.timeLimitMinutes ?? DEFAULT_TIME_LIMIT_MIN,
      },
    };
  });

  app.get("/api/assessment/:id/status", async (request) => {
    const { assessment } = load(app, request, "any");
    return {
      status: assessment.status,
      message: statusMessage(assessment.status),
      failureReason: assessment.status === "failed" ? assessment.terminatedReason : null,
    };
  });

  /**
   * Consent (§10.1). Recorded before anything is monitored, because that is the point of it —
   * and because India's DPDP Act requires it for employee monitoring.
   */
  app.post("/api/assessment/:id/consent", async (request) => {
    const { assessment, user } = load(app, request, "ready");
    const body = parseOrThrow(consentRequestSchema, request.body);

    recordConsent(app, request, assessment.id, user.id, body);
    return { ok: true, userId: user.id, policyVersion: CONSENT_POLICY_VERSION };
  });

  /**
   * Whether this learner has already consented to this attempt, and whether it still counts.
   *
   * So the pre-flight screen can say "Consent recorded" after a reload instead of asking a learner
   * to agree to the same thing twice — and so it asks again, honestly, when the wording has
   * changed underneath a record they gave months ago.
   */
  app.get("/api/assessment/:id/consent", async (request): Promise<ConsentStatus> => {
    const { assessment } = load(app, request, "any");
    const row = app.db
      .select()
      .from(schema.assessmentConsents)
      .where(eq(schema.assessmentConsents.assessmentId, assessment.id))
      .get();

    if (!row) return { recorded: false, policyVersion: null, recordedAt: null, stale: false };
    const stale = row.policyVersion !== CONSENT_POLICY_VERSION;
    return { recorded: !stale, policyVersion: row.policyVersion, recordedAt: row.updatedAt, stale };
  });

  /**
   * Starts the clock. The server is authoritative for time from here on: the client timer is
   * display only, and every later request re-checks the deadline (§9.4).
   */
  app.post("/api/assessment/:id/start", async (request): Promise<StartResponse> => {
    const { assessment, user } = load(app, request, "ready");

    /* Two ways to have consented, and the second one exists because of how this route broke: the
       client shipped without ever calling `/consent`, and a `start` that only reads a stored flag
       has no way to tell "they refused" from "the caller forgot". Accepting the payload inline
       means a single call works, and a future client that forgets cannot reproduce the bug. */
    const inline = parseOrThrow(startRequestSchema, request.body ?? {}).consent;
    if (inline) recordConsent(app, request, assessment.id, user.id, inline);

    if (!hasCurrentConsent(app, assessment)) throw badRequest("Consent is required before starting.");

    const blueprint = assessment.blueprint as Blueprint | null;
    if (!blueprint) throw badRequest("This assessment has no blueprint and cannot be started.");

    const config = (assessment.config as StoredConfig | null) ?? {};
    const timeLimitMinutes = config.timeLimitMinutes ?? blueprint.timeLimitMinutes;
    const startedAt = now();
    // The written-answer section gets its own budget on top of the adaptive time (§9.4).
    const deadlineAt = startedAt + (timeLimitMinutes + EXPLAIN_BUDGET_MIN) * 60_000;

    const selector = initSelectorState(blueprint.areas.map((a) => ({ name: a.name, hypothesisLevel: a.hypothesisLevel, section: a.section })));

    app.db
      .update(schema.assessments)
      .set({
        status: "in_progress",
        startedAt,
        deadlineAt,
        lastHeartbeatAt: startedAt,
        config: { ...config, timeLimitMinutes, selector, pausedMs: 0, currentItemId: null, writtenSection: false },
      })
      .where(eq(schema.assessments.id, assessment.id))
      .run();

    return {
      deadlineAt,
      config: { timeLimitMinutes, hardLimit: HARD_LIMIT, areas: blueprint.areas.map((a) => a.name) },
    };
  });

  /**
   * The next item. One at a time, with no way back (§9.1): re-serving an item would let someone
   * revisit an answer after seeing what came next.
   */
  app.get("/api/assessment/:id/next", async (request): Promise<NextItemResponse> => {
    const { assessment } = load(app, request, "in_progress");
    const config = (assessment.config as StoredConfig | null) ?? {};
    const blueprint = assessment.blueprint as Blueprint;

    if (expired(assessment)) {
      finishAndEvaluate(app, assessment.id, "deadline");
      return emptyNext(assessment.deadlineAt ?? now(), assessment.hardWarnings);
    }

    // Re-serving the item already in flight, so a refresh does not lose it or skip ahead.
    if (config.currentItemId) {
      const current = app.db
        .select()
        .from(schema.assessmentItems)
        .where(eq(schema.assessmentItems.id, config.currentItemId))
        .get();
      if (current && current.status === "served") {
        return {
          item: {
            id: current.id,
            kind: current.kind,
            payload: current.payload as ItemPayload,
            expiresAt: config.currentItemExpiresAt ?? now() + (current.payload as ItemPayload).timeLimitSec * 1000,
          },
          done: false,
          progress: progressOf(config, blueprint),
          deadlineAt: assessment.deadlineAt ?? now(),
          hardWarnings: assessment.hardWarnings,
        };
      }
    }

    /* Normalised on read: an assessment that was in flight when the sectioned selector shipped has a
       state with boolean outcomes and no sections. Upgrading it in place is the difference between
       somebody finishing their test and somebody restarting it. */
    const selector = config.selector
      ? normaliseState(config.selector)
      : initSelectorState(blueprint.areas.map((a) => ({ name: a.name, hypothesisLevel: a.hypothesisLevel, section: a.section })));
    const pool = poolFor(app, assessment.id);

    let writtenSection = config.writtenSection ?? false;
    let chosen = selectNext(selector, pool, { targetItemCount: blueprint.targetItemCount, includeExplain: writtenSection });

    // The adaptive section is over: move on to the written answers.
    if (!chosen && !writtenSection) {
      writtenSection = true;
      chosen = selectNext(selector, pool, { targetItemCount: blueprint.targetItemCount, includeExplain: true });
    }

    if (!chosen) {
      // The pool is exhausted or the item target is met: the test is finished normally.
      finishAndEvaluate(app, assessment.id, "submitted");
      return emptyNext(assessment.deadlineAt ?? now(), assessment.hardWarnings);
    }

    const payload = payloadOf(app, chosen.item.id);
    const expiresAt = now() + payload.timeLimitSec * 1000;

    app.db
      .update(schema.assessmentItems)
      .set({ status: "served", servedAt: now() })
      .where(eq(schema.assessmentItems.id, chosen.item.id))
      .run();

    app.db
      .update(schema.assessments)
      .set({
        config: {
          ...config,
          selector,
          writtenSection,
          currentItemId: chosen.item.id,
          currentItemExpiresAt: expiresAt,
          currentAreaIndex: chosen.areaIndex,
        },
      })
      .where(eq(schema.assessments.id, assessment.id))
      .run();

    return {
      item: { id: chosen.item.id, kind: chosen.item.kind as ItemKind, payload, expiresAt },
      done: false,
      progress: progressOf({ ...config, selector, writtenSection }, blueprint),
      deadlineAt: assessment.deadlineAt ?? now(),
      hardWarnings: assessment.hardWarnings,
    };
  });

  /**
   * Records an answer. The response is deliberately `{ accepted: true }` and nothing else — the
   * learner is never told whether they were right (§9.5).
   */
  app.post("/api/assessment/:id/items/:itemId", async (request) => {
    const { assessment } = load(app, request, "in_progress");
    const { itemId } = parseOrThrow(itemParams, request.params);
    const body = parseOrThrow(answerRequestSchema, request.body);
    const config = (assessment.config as StoredConfig | null) ?? {};

    if (config.currentItemId !== itemId) {
      throw conflict("That is not the item you were asked. Reload to continue.");
    }
    if (config.currentItemExpiresAt && now() > config.currentItemExpiresAt + GRACE_MS) {
      // Time-out counts as wrong (§9.4), so it is recorded rather than rejected outright.
      await finishItem(app, assessment.id, itemId, {}, config, true);
      throw conflict("That item's time ran out.");
    }

    await finishItem(app, assessment.id, itemId, body, config, false);
    return { accepted: true };
  });

  app.post(
    "/api/assessment/:id/heartbeat",
    { config: { rateLimit: { max: 40, timeWindow: "1 minute" } } },
    async (request) => {
      const { assessment } = load(app, request, "in_progress");
      const body = parseOrThrow(heartbeatRequestSchema, request.body);

      app.db
        .update(schema.assessments)
        .set({ lastHeartbeatAt: now() })
        .where(eq(schema.assessments.id, assessment.id))
        .run();

      return { ok: true, hardWarnings: assessment.hardWarnings, state: body.faceState };
    },
  );

  /**
   * An integrity event, optionally with a snapshot.
   *
   * The counting rules are applied here, not in the browser: the client's count is display only.
   * Snapshots are written under DATA_DIR and are only ever served through an authenticated
   * superadmin route (§10.6).
   */
  app.post(
    "/api/assessment/:id/events",
    {
      config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
      bodyLimit: BODY_LIMIT_SNAPSHOT,
    },
    async (request) => {
      const { assessment, user } = load(app, request, "in_progress");

      let event: z.infer<typeof integrityEventRequestSchema>;
      let snapshotPath: string | null = null;

      if (request.isMultipart()) {
        const parts = request.parts();
        let raw: Record<string, unknown> = {};
        for await (const part of parts) {
          if (part.type === "file" && part.fieldname === "snapshot") {
            snapshotPath = await saveSnapshot(app, assessment.id, await part.toBuffer());
          } else if (part.type === "field" && part.fieldname === "event") {
            raw = JSON.parse(String(part.value)) as Record<string, unknown>;
          }
        }
        event = parseOrThrow(integrityEventRequestSchema, raw);
      } else {
        event = parseOrThrow(integrityEventRequestSchema, request.body);
      }

      const result = recordIntegrityEvent({
        db: app.db,
        assessmentId: assessment.id,
        userId: user.id,
        type: event.type,
        severity: event.severity,
        details: event.details,
        snapshotPath,
        clientTs: event.clientTs ?? null,
      });

      // Extend the deadline by the paused time, capped, so a warning modal does not cost them
      // their remaining time (§10.3).
      if (result.counted && assessment.deadlineAt) {
        const config = (assessment.config as StoredConfig | null) ?? {};
        const pausedMs = (config.pausedMs ?? 0) + MAX_PAUSE_PER_WARNING_MS;
        app.db
          .update(schema.assessments)
          .set({ deadlineAt: assessment.deadlineAt + MAX_PAUSE_PER_WARNING_MS, config: { ...config, pausedMs } })
          .where(eq(schema.assessments.id, assessment.id))
          .run();
      }

      if (result.terminated) {
        enqueue(app.db, { type: "assessment.evaluate", payload: { assessmentId: assessment.id, reason: "terminated" } });
      }

      publishIntegrityEvent(app, {
        assessmentId: assessment.id,
        userId: user.id,
        type: event.type,
        severity: event.severity,
        counted: result.counted,
        hardWarnings: result.hardWarnings,
        terminated: result.terminated,
        snapshotPath,
        at: now(),
      });

      return {
        counted: result.counted,
        escalated: result.escalated,
        hardWarnings: result.hardWarnings,
        hardLimit: HARD_LIMIT,
        terminated: result.terminated,
        pauseMs: result.counted ? MAX_PAUSE_PER_WARNING_MS : 0,
      };
    },
  );

  app.post("/api/assessment/:id/submit", async (request) => {
    const { assessment } = load(app, request, "in_progress");
    finishAndEvaluate(app, assessment.id, "submitted");
    return { ok: true, status: "submitted" };
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Loads the assessment and checks it belongs to this learner and is in an acceptable state.
 *
 * Someone else's assessment is a 404, not a 403 — the same rule as content (§6): the response
 * must not confirm that an id exists.
 */
/**
 * Writes a consent record, and the denormalised flag beside it.
 *
 * Idempotent: consenting twice updates the row rather than failing, because a learner who reloads
 * the pre-flight screen and agrees again has not done anything wrong.
 */
function recordConsent(
  app: FastifyInstance,
  request: FastifyRequest,
  assessmentId: string,
  userId: string,
  body: ConsentRequest,
): void {
  const timestamp = now();
  const values = {
    permissions: body.permissions ?? null,
    policyVersion: body.policyVersion ?? CONSENT_POLICY_VERSION,
    // `trustProxy` is set in production, so this is the learner's address rather than Caddy's.
    ip: request.ip,
    userAgent: String(request.headers["user-agent"] ?? "").slice(0, 400),
    updatedAt: timestamp,
  };

  app.db
    .insert(schema.assessmentConsents)
    .values({ assessmentId, userId, createdAt: timestamp, ...values })
    .onConflictDoUpdate({ target: schema.assessmentConsents.assessmentId, set: values })
    .run();

  app.db
    .update(schema.assessments)
    .set({ consentAt: timestamp })
    .where(eq(schema.assessments.id, assessmentId))
    .run();
}

/**
 * Whether there is a consent that still counts.
 *
 * A record at an older policy version does not, because the learner agreed to different wording.
 * `consent_at` alone is accepted for attempts consented to before this table existed — refusing
 * those would lock out anyone mid-flow at the moment of the deploy, to enforce a version they were
 * never shown.
 */
function hasCurrentConsent(app: FastifyInstance, assessment: typeof schema.assessments.$inferSelect): boolean {
  const row = app.db
    .select()
    .from(schema.assessmentConsents)
    .where(eq(schema.assessmentConsents.assessmentId, assessment.id))
    .get();
  if (row) return row.policyVersion === CONSENT_POLICY_VERSION;
  return assessment.consentAt !== null;
}

function load(app: FastifyInstance, request: Parameters<typeof requireActiveUser>[0], expect: "ready" | "in_progress" | "any") {
  const user = requireActiveUser(request);
  const { id } = parseOrThrow(idParams, request.params);

  const assessment = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, id)).get();
  if (!assessment) throw notFound("No such assessment.");

  if (assessment.userId !== user.id) {
    // A superadmin reading a learner's assessment goes through /api/admin, not this route.
    if (user.role === "superadmin") throw forbidden("Use the admin routes to view someone else's assessment.");
    throw notFound("No such assessment.");
  }

  if (expect !== "any" && assessment.status !== expect) {
    // Called out rather than left to the generic message: "this assessment is awaiting approval"
    // reads like an error on the learner's side, and consent/start are exactly the calls the gate
    // exists to hold back.
    if (assessment.status === "awaiting_approval") {
      throw conflict("This assessment has not been released yet. Your administrator is reviewing it.");
    }
    throw conflict(`This assessment is ${assessment.status.replace("_", " ")}.`);
  }

  return { assessment, user };
}

function expired(assessment: typeof schema.assessments.$inferSelect): boolean {
  return assessment.deadlineAt !== null && now() > assessment.deadlineAt;
}

function emptyNext(deadlineAt: number, hardWarnings: number): NextItemResponse {
  return {
    item: null,
    done: true,
    progress: { answered: 0, target: 0, section: "written" },
    deadlineAt,
    hardWarnings,
  };
}

function progressOf(config: StoredConfig, blueprint: Blueprint): NextItemResponse["progress"] {
  const selector = config.selector;
  const part = selector ? currentSection(selector) : null;

  return {
    answered: selector?.servedCount ?? 0,
    target: blueprint.targetItemCount,
    section: config.writtenSection ? "written" : "adaptive",
    /* Which of the five parts they are on, and how far through it. The old strip could only say
       "12 of 20", which is a number with no shape — "Part 2 of 5, 3 of 8" is a place. */
    ...(part
      ? {
          part,
          partIndex: SECTION_ORDER.filter((id) => selector!.areas.some((area) => area.section === id)).indexOf(part) + 1,
          partCount: SECTION_ORDER.filter((id) => selector!.areas.some((area) => area.section === id)).length,
          partAnswered: selector?.sectionCounts?.[part] ?? 0,
        }
      : {}),
  };
}

/**
 * Did the learner press "I don't know yet"?
 *
 * Carried as an explicit flag on the response rather than inferred from an empty answer: a blank
 * text box is somebody who ran out of time, and treating the two the same would put "did not reach
 * it" and "has not met it" in the same bucket. They mean opposite things to the course builder.
 */
function saidUnknown(response: unknown): boolean {
  return typeof response === "object" && response !== null && (response as { unknown?: unknown }).unknown === true;
}

function poolFor(app: FastifyInstance, assessmentId: string): PoolItemRef[] {
  return app.db
    .select({
      id: schema.assessmentItems.id,
      area: schema.assessmentItems.area,
      difficulty: schema.assessmentItems.difficulty,
      kind: schema.assessmentItems.kind,
    })
    .from(schema.assessmentItems)
    .where(and(eq(schema.assessmentItems.assessmentId, assessmentId), eq(schema.assessmentItems.status, "pool")))
    .all()
    .map((row) => ({ ...row, difficulty: row.difficulty as PoolItemRef["difficulty"] }));
}

function payloadOf(app: FastifyInstance, itemId: string): ItemPayload {
  const row = app.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, itemId)).get();
  if (!row) throw notFound("That item no longer exists.");
  return row.payload as ItemPayload;
}

/** Scores an answer, folds it into the selector, and clears the in-flight item. */
async function finishItem(
  app: FastifyInstance,
  assessmentId: string,
  itemId: string,
  response: { selected?: number[]; text?: string; code?: string },
  config: StoredConfig,
  timedOut: boolean,
): Promise<void> {
  const row = app.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, itemId)).get();
  if (!row) throw notFound("That item no longer exists.");

  const payload = row.payload as ItemPayload;
  const key = row.key as ItemKey;

  const answered = !timedOut && hasResponse(row.kind, response);
  const score = answered ? await autoScoreItem(row.kind, payload, key, response, app.sandbox) : timedOut ? 0 : null;

  app.db
    .update(schema.assessmentItems)
    .set({
      status: answered ? "answered" : "skipped",
      answeredAt: now(),
      timeMs: row.servedAt ? now() - row.servedAt : null,
      response,
      // Stored as 0..100 because the column is an integer; the selector works in 0..1.
      autoScore: score === null ? null : Math.round(score * 100),
    })
    .where(eq(schema.assessmentItems.id, itemId))
    .run();

  const selector = config.selector ? normaliseState(config.selector) : undefined;
  const nextSelector =
    selector && config.currentAreaIndex !== undefined && config.currentAreaIndex !== null
      ? recordOutcome(selector, config.currentAreaIndex, itemId, score ?? 0, {
          /* Passed separately from the score, because they are different facts. A score of 0 means
             they tried and were wrong; `unknown` means they told us they have not met this. The
             staircase treats them differently and so does the gap map. */
          unknown: saidUnknown(response),
          difficulty: row.difficulty as Difficulty,
        })
      : selector;

  app.db
    .update(schema.assessments)
    .set({
      config: { ...config, selector: nextSelector, currentItemId: null, currentItemExpiresAt: null, currentAreaIndex: null },
    })
    .where(eq(schema.assessments.id, assessmentId))
    .run();
}

/** Marks the assessment finished and queues evaluation. Safe to call more than once. */
export function finishAndEvaluate(app: FastifyInstance, assessmentId: string, reason: "submitted" | "deadline" | "terminated"): void {
  const assessment = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
  if (!assessment || !["in_progress", "ready"].includes(assessment.status)) return;

  app.db
    .update(schema.assessments)
    .set({
      status: reason === "terminated" ? "terminated" : "submitted",
      submittedAt: now(),
      ...(reason === "deadline" ? { terminatedReason: "The time limit was reached." } : {}),
    })
    .where(eq(schema.assessments.id, assessmentId))
    .run();

  enqueue(app.db, { type: "assessment.evaluate", payload: { assessmentId, reason } });
}

async function saveSnapshot(app: FastifyInstance, assessmentId: string, buffer: Buffer): Promise<string | null> {
  if (buffer.length === 0 || buffer.length > BODY_LIMIT_SNAPSHOT) return null;
  // JPEG magic number: anything else is not a frame from our canvas.
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  const dir = path.join(app.env.snapshotsDir, assessmentId);
  await fs.promises.mkdir(dir, { recursive: true });
  const name = `${newId()}.jpg`;
  await fs.promises.writeFile(path.join(dir, name), buffer);
  // Stored relative to the snapshots directory, so moving DATA_DIR does not invalidate rows.
  return path.posix.join(assessmentId, name);
}

function statusMessage(status: string): string | null {
  switch (status) {
    case "generating":
      return "Building your assessment. This usually takes a few minutes.";
    case "awaiting_approval":
      // Truthful without being an invitation to chase anyone: it is released either way.
      return "Your assessment is written and is being checked over. It will open shortly.";
    case "ready":
      return "Your assessment is ready.";
    case "evaluating":
    case "submitted":
      return "Evaluating your assessment. This can take up to 10 minutes.";
    case "failed":
      return "Something went wrong generating this assessment. Your administrator has been notified.";
    default:
      return null;
  }
}
