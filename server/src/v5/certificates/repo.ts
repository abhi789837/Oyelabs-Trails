import { createHash, randomBytes } from "node:crypto";

import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import {
  certificateCode,
  certificateHashInput,
  MIN_TRACK_TOPICS,
  normalizeHolderName,
  verifyPathFor,
  type AdminCertificate,
  type CertificateKind,
  type CertificateStatus,
  type MyCertificate,
  type PublicCertificate,
} from "../../../../shared/certificates";
import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import { now } from "../../lib/ids";
import { notify } from "../../lib/notify";
import { allowedTopicIdsFor } from "../../plans/repo";
import { awardXpSafely } from "../xp/repo";

/**
 * v5 certificates: the server decides, once, that something is complete, and issues a row.
 *
 * Before v5 the certificate page worked it out in the browser from the progress store and printed a
 * deterministic id that no server knew about. Now `syncCertificates` reads the record (topic
 * progress, course progress, achieved goals) and inserts what is missing. The unique index
 * (user_id, kind, ref_id) makes it idempotent: running it twice, or from two requests at once,
 * issues one certificate. A revoked certificate keeps its row, so it is never quietly re-issued.
 *
 * It runs on reads (`GET /api/v5/certificates`, the Me profile), so it needs no hook in every place
 * that can complete something (lesson player, old topic page, course ticks, an admin marking a goal
 * achieved). Each issue awards the `certificate` XP once and sends the learner one notification.
 */

type CertRow = typeof schema.certificates.$inferSelect;

const HOLDER_NAME_PREF = "certificateName";

export function hashOf(row: Pick<CertRow, "id" | "kind" | "refId" | "title" | "learnerName" | "issuedAt">): string {
  return createHash("sha256")
    .update(certificateHashInput({ id: row.id, kind: row.kind, refId: row.refId, title: row.title, holderName: row.learnerName, issuedAt: row.issuedAt }))
    .digest("hex");
}

function newCertificateId(db: Db): string {
  for (let i = 0; i < 8; i++) {
    const id = certificateCode(randomBytes(5));
    if (!db.select({ id: schema.certificates.id }).from(schema.certificates).where(eq(schema.certificates.id, id)).get()) return id;
  }
  throw new Error("could not find a free certificate id");
}

// ---------------------------------------------------------------------------
// Holder name
// ---------------------------------------------------------------------------

/** The name printed on new certificates: the one they set, else their display name. */
export function holderNameFor(db: Db, userId: string): string {
  const prefs = db.select({ data: schema.userPrefs.data }).from(schema.userPrefs).where(eq(schema.userPrefs.userId, userId)).get()?.data;
  const chosen = typeof prefs?.[HOLDER_NAME_PREF] === "string" ? normalizeHolderName(prefs[HOLDER_NAME_PREF] as string) : "";
  if (chosen) return chosen;
  return normalizeHolderName(db.select({ n: schema.users.displayName }).from(schema.users).where(eq(schema.users.id, userId)).get()?.n ?? "");
}

/**
 * Sets the name for new certificates and corrects it on the learner's current ones (a spelling fix
 * is theirs to make). The hash is recomputed so /verify keeps saying "valid". Revoked ones are left
 * exactly as they were.
 */
export function setHolderName(db: Db, userId: string, name: string): string {
  const clean = normalizeHolderName(name);
  const at = now();
  const existing = db.select().from(schema.userPrefs).where(eq(schema.userPrefs.userId, userId)).get();
  const data = { ...(existing?.data ?? {}), [HOLDER_NAME_PREF]: clean };
  db.insert(schema.userPrefs)
    .values({ userId, data, updatedAt: at })
    .onConflictDoUpdate({ target: schema.userPrefs.userId, set: { data, updatedAt: at } })
    .run();
  const holder = holderNameFor(db, userId);
  for (const row of db.select().from(schema.certificates).where(and(eq(schema.certificates.userId, userId), isNull(schema.certificates.revokedAt))).all()) {
    const next = { ...row, learnerName: holder };
    db.update(schema.certificates).set({ learnerName: holder, hash: hashOf(next) }).where(eq(schema.certificates.id, row.id)).run();
  }
  return holder;
}

// ---------------------------------------------------------------------------
// What is complete
// ---------------------------------------------------------------------------

interface Candidate {
  kind: CertificateKind;
  refId: string;
  title: string;
  trackId: string;
  topicIds: string[];
  averageScore: number | null;
  /** When it was completed: the issue date. */
  at: number;
}

function trackCandidates(db: Db, content: ContentStore, userId: string, role: string): Candidate[] {
  const allowed = allowedTopicIdsFor(db, { id: userId, role } as Parameters<typeof allowedTopicIdsFor>[1]);
  const progress = new Map(
    db
      .select()
      .from(schema.topicProgress)
      .where(and(eq(schema.topicProgress.userId, userId), eq(schema.topicProgress.status, "completed")))
      .all()
      .map((p) => [p.topicId, p]),
  );
  if (progress.size === 0) return [];
  const out: Candidate[] = [];
  for (const track of content.manifest) {
    const topicIds = track.modules.filter((m) => m.available).flatMap((m) => m.topics.map((t) => t.id)).filter((id) => allowed === null || allowed.has(id));
    if (topicIds.length < MIN_TRACK_TOPICS) continue;
    if (!topicIds.every((id) => progress.has(id))) continue;
    const scores = topicIds.map((id) => progress.get(id)?.bestScore).filter((s): s is number => typeof s === "number");
    out.push({
      kind: "track",
      refId: track.id,
      title: track.name,
      trackId: track.id,
      topicIds,
      averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      at: Math.max(...topicIds.map((id) => progress.get(id)?.completedAt ?? 0)) || now(),
    });
  }
  return out;
}

function courseCandidates(db: Db, userId: string): Candidate[] {
  const done = db.select().from(schema.courseProgress).where(eq(schema.courseProgress.userId, userId)).all();
  if (done.length === 0) return [];
  const courseIds = [...new Set(done.map((d) => d.courseId))];
  const courses = db.select().from(schema.courses).where(and(inArray(schema.courses.id, courseIds), eq(schema.courses.published, true))).all();
  const topics = db.select({ id: schema.courseTopics.id, courseId: schema.courseTopics.courseId }).from(schema.courseTopics).where(inArray(schema.courseTopics.courseId, courseIds)).all();
  const doneAt = new Map(done.map((d) => [d.topicId, d.completedAt]));
  const out: Candidate[] = [];
  for (const course of courses) {
    const ids = topics.filter((t) => t.courseId === course.id).map((t) => t.id);
    if (ids.length === 0 || !ids.every((id) => doneAt.has(id))) continue;
    out.push({ kind: "course", refId: course.id, title: course.title, trackId: "", topicIds: ids, averageScore: null, at: Math.max(...ids.map((id) => doneAt.get(id) ?? 0)) });
  }
  return out;
}

function goalCandidates(db: Db, userId: string): Candidate[] {
  const goals = db
    .select()
    .from(schema.learnerGoals)
    .where(and(eq(schema.learnerGoals.userId, userId), eq(schema.learnerGoals.status, "achieved")))
    .all();
  if (goals.length === 0) return [];
  const outcomes = new Map(db.select({ id: schema.practicalOutcomes.id, title: schema.practicalOutcomes.title }).from(schema.practicalOutcomes).all().map((o) => [o.id, o.title]));
  return goals.map((g) => ({
    kind: "goal" as const,
    refId: g.id,
    title: (g.caseId ? outcomes.get(g.caseId) : undefined) ?? g.outcome,
    trackId: "",
    topicIds: [],
    averageScore: null,
    at: g.achievedAt ?? g.updatedAt,
  }));
}

// ---------------------------------------------------------------------------
// Issuing
// ---------------------------------------------------------------------------

/** Issues one certificate if (user, kind, ref) has none yet. Returns the new id, or null. */
export function issueCertificate(db: Db, userId: string, candidate: Candidate): string | null {
  const id = newCertificateId(db);
  const holder = holderNameFor(db, userId);
  const row = {
    id,
    userId,
    trackId: candidate.trackId,
    learnerName: holder,
    topicIds: candidate.topicIds,
    planId: null,
    averageScore: candidate.averageScore,
    issuedAt: candidate.at,
    kind: candidate.kind,
    refId: candidate.refId,
    title: candidate.title,
    revokedAt: null,
  };
  const result = db
    .insert(schema.certificates)
    .values({ ...row, hash: hashOf(row) })
    .onConflictDoNothing()
    .run();
  if (result.changes === 0) return null;
  awardXpSafely(db, userId, "certificate", id, { at: Math.min(candidate.at, now()) });
  try {
    notify(db, {
      recipientId: userId,
      kind: "certificate.issued",
      title: `You earned a certificate: ${candidate.title}`,
      body: "It has your name, the date and a link anyone can use to check it.",
      link: `/learn/certificate/${encodeURIComponent(id)}`,
    });
  } catch {
    // A notification is a nicety; the certificate is issued either way.
  }
  return id;
}

/** Reads what is complete and issues what is missing. Never throws: returns the new ids. */
export function syncCertificates(db: Db, content: ContentStore, user: { id: string; role: string }): string[] {
  try {
    const existing = new Set(
      db
        .select({ kind: schema.certificates.kind, refId: schema.certificates.refId })
        .from(schema.certificates)
        .where(eq(schema.certificates.userId, user.id))
        .all()
        .map((c) => `${c.kind}:${c.refId}`),
    );
    const candidates = [...trackCandidates(db, content, user.id, user.role), ...courseCandidates(db, user.id), ...goalCandidates(db, user.id)].filter(
      (c) => !existing.has(`${c.kind}:${c.refId}`),
    );
    const issued: string[] = [];
    for (const candidate of candidates) {
      const id = issueCertificate(db, user.id, candidate);
      if (id) issued.push(id);
    }
    return issued;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

function titleOf(row: CertRow, content: ContentStore): string {
  return row.title || content.manifest.find((t) => t.id === row.trackId)?.name || row.trackId;
}

export function toMine(row: CertRow, content: ContentStore): MyCertificate {
  return {
    id: row.id,
    kind: row.kind,
    refId: row.refId,
    title: titleOf(row, content),
    holderName: row.learnerName,
    issuedAt: row.issuedAt,
    trackId: row.trackId,
    topicCount: row.topicIds.length,
    averageScore: row.averageScore,
    revokedAt: row.revokedAt ?? null,
    verifyPath: verifyPathFor(row.id),
  };
}

export function myCertificates(db: Db, content: ContentStore, userId: string): MyCertificate[] {
  return db
    .select()
    .from(schema.certificates)
    .where(eq(schema.certificates.userId, userId))
    .orderBy(desc(schema.certificates.issuedAt))
    .all()
    .map((row) => toMine(row, content));
}

export function certificateRow(db: Db, id: string): CertRow | undefined {
  return db.select().from(schema.certificates).where(eq(schema.certificates.id, id)).get();
}

/** Valid, revoked, or "changed" when the stored hash no longer matches the record. */
export function statusOf(row: CertRow): CertificateStatus {
  if (row.revokedAt) return "revoked";
  // Rows from before v5 have no hash; they are checked by the record alone.
  if (row.hash && row.hash !== hashOf(row)) return "changed";
  return "valid";
}

export function publicView(row: CertRow, content: ContentStore): PublicCertificate {
  return {
    id: row.id,
    holderName: row.learnerName,
    title: titleOf(row, content),
    kind: row.kind,
    issuedAt: row.issuedAt,
    status: statusOf(row),
    revokedAt: row.revokedAt ?? null,
  };
}

export function adminCertificates(db: Db, content: ContentStore, userId?: string): AdminCertificate[] {
  return db
    .select()
    .from(schema.certificates)
    .where(userId ? eq(schema.certificates.userId, userId) : undefined)
    .orderBy(desc(schema.certificates.issuedAt))
    .limit(500)
    .all()
    .map((row) => ({ ...toMine(row, content), userId: row.userId }));
}

/** Revoke (or restore). Returns the updated row, or null when there is no such certificate. */
export function setRevoked(db: Db, id: string, revoked: boolean): CertRow | null {
  const row = certificateRow(db, id);
  if (!row) return null;
  db.update(schema.certificates)
    .set({ revokedAt: revoked ? (row.revokedAt ?? now()) : null })
    .where(eq(schema.certificates.id, id))
    .run();
  return certificateRow(db, id) ?? null;
}
