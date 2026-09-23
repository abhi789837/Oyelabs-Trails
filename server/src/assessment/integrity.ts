import { and, desc, eq, gte } from "drizzle-orm";

import type { Severity } from "../../../shared/enums";
import { schema, type Db } from "../db";
import { newId, now } from "../lib/ids";

/**
 * The integrity rules (brief §10.2 escalation, §10.4).
 *
 * The **server** decides what counts. The client shows a number, but it is display only: a
 * browser that is being tampered with is exactly the browser whose counter cannot be trusted.
 * Everything here — cooldowns, escalation, the termination threshold — is applied on the server
 * from the stored event history.
 */

export const HARD_LIMIT = 3;
/** The same hard type cannot count twice within this window, so one alt-tab is one strike. */
export const HARD_COOLDOWN_MS = 10_000;
/** Three soft warnings of the same type inside this window become one hard warning. */
export const SOFT_ESCALATION_WINDOW_MS = 5 * 60 * 1000;
export const SOFT_ESCALATION_COUNT = 3;
/** No heartbeat for this long during an in-progress assessment is itself a hard signal. */
export const HEARTBEAT_TIMEOUT_MS = 30_000;
/** Each hard warning pauses the clock while the modal is up, capped so it cannot be farmed. */
export const MAX_PAUSE_PER_WARNING_MS = 60_000;

export interface RecordEventInput {
  db: Db;
  assessmentId: string;
  userId: string;
  type: string;
  severity: Severity;
  details?: unknown;
  snapshotPath?: string | null;
  clientTs?: number | null;
}

export interface RecordEventResult {
  eventId: string;
  /** Whether this event incremented the hard count. */
  counted: boolean;
  /** True when a run of soft warnings was promoted to a hard one. */
  escalated: boolean;
  hardWarnings: number;
  softWarnings: number;
  terminated: boolean;
}

/**
 * Stores an event and applies the counting rules.
 *
 * Returns what the client needs to show (the count, whether this one counted, whether the test is
 * over) and nothing it could use to game the rules.
 */
export function recordIntegrityEvent(input: RecordEventInput): RecordEventResult {
  const { db, assessmentId, userId } = input;
  const timestamp = now();

  const assessment = db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
  if (!assessment) throw new Error("No such assessment.");

  let counted = false;
  let escalated = false;

  if (input.severity === "hard") {
    counted = !withinCooldown(db, assessmentId, input.type, timestamp);
  } else {
    // A soft event never counts by itself, but a run of the same type does (§10.2).
    const recentSame = countRecent(db, assessmentId, input.type, "soft", timestamp - SOFT_ESCALATION_WINDOW_MS);
    // recentSame excludes the event being stored now, hence the -1.
    if (recentSame + 1 >= SOFT_ESCALATION_COUNT && !withinCooldown(db, assessmentId, `${input.type}:escalated`, timestamp)) {
      counted = true;
      escalated = true;
    }
  }

  const eventId = newId();
  db.insert(schema.integrityEvents)
    .values({
      id: eventId,
      assessmentId,
      userId,
      type: escalated ? `${input.type}:escalated` : input.type,
      severity: input.severity,
      counted,
      details: input.details ?? null,
      snapshotPath: input.snapshotPath ?? null,
      clientTs: input.clientTs ?? null,
      createdAt: timestamp,
    })
    .run();

  const hardWarnings = assessment.hardWarnings + (counted ? 1 : 0);
  const softWarnings = assessment.softWarnings + (input.severity === "soft" ? 1 : 0);

  const terminated = hardWarnings >= HARD_LIMIT && assessment.status === "in_progress";

  db.update(schema.assessments)
    .set({
      hardWarnings,
      softWarnings,
      ...(terminated
        ? {
            status: "terminated" as const,
            terminatedReason: `Reached ${HARD_LIMIT} counted warnings. The last was: ${input.type}.`,
            submittedAt: timestamp,
          }
        : {}),
    })
    .where(eq(schema.assessments.id, assessmentId))
    .run();

  return { eventId, counted, escalated, hardWarnings, softWarnings, terminated };
}

function withinCooldown(db: Db, assessmentId: string, type: string, timestamp: number): boolean {
  const last = db
    .select({ createdAt: schema.integrityEvents.createdAt })
    .from(schema.integrityEvents)
    .where(
      and(
        eq(schema.integrityEvents.assessmentId, assessmentId),
        eq(schema.integrityEvents.type, type),
        eq(schema.integrityEvents.counted, true),
      ),
    )
    .orderBy(desc(schema.integrityEvents.createdAt))
    .get();

  return Boolean(last && timestamp - last.createdAt < HARD_COOLDOWN_MS);
}

function countRecent(db: Db, assessmentId: string, type: string, severity: Severity, since: number): number {
  return db
    .select({ id: schema.integrityEvents.id })
    .from(schema.integrityEvents)
    .where(
      and(
        eq(schema.integrityEvents.assessmentId, assessmentId),
        eq(schema.integrityEvents.type, type),
        eq(schema.integrityEvents.severity, severity),
        gte(schema.integrityEvents.createdAt, since),
      ),
    )
    .all().length;
}

export function integrityEventsFor(db: Db, assessmentId: string) {
  return db
    .select()
    .from(schema.integrityEvents)
    .where(eq(schema.integrityEvents.assessmentId, assessmentId))
    .orderBy(desc(schema.integrityEvents.createdAt))
    .all();
}

/** Counts by type, for the evaluation input and the admin's integrity summary. */
export function integritySummary(db: Db, assessmentId: string): { byType: Record<string, number>; hard: number; soft: number } {
  const events = integrityEventsFor(db, assessmentId);
  const byType: Record<string, number> = {};
  let hard = 0;
  let soft = 0;
  for (const event of events) {
    byType[event.type] = (byType[event.type] ?? 0) + 1;
    if (event.severity === "hard") hard += 1;
    else soft += 1;
  }
  return { byType, hard, soft };
}

/**
 * A missing heartbeat is a server-side signal: the client cannot report that it stopped reporting
 * (§10.2). Called from the sweeper.
 */
export function checkHeartbeats(db: Db): number {
  const cutoff = now() - HEARTBEAT_TIMEOUT_MS;
  const stale = db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.status, "in_progress"))
    .all()
    .filter((a) => a.lastHeartbeatAt !== null && a.lastHeartbeatAt < cutoff);

  for (const assessment of stale) {
    recordIntegrityEvent({
      db,
      assessmentId: assessment.id,
      userId: assessment.userId,
      type: "heartbeat_missing",
      severity: "hard",
      details: { lastHeartbeatAt: assessment.lastHeartbeatAt, timeoutMs: HEARTBEAT_TIMEOUT_MS },
    });
    // Bump the timestamp so one silent client does not generate a strike per sweep.
    db.update(schema.assessments).set({ lastHeartbeatAt: now() }).where(eq(schema.assessments.id, assessment.id)).run();
  }

  return stale.length;
}
