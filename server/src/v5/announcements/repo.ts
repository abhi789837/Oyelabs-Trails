import { desc, eq } from "drizzle-orm";

import {
  announcementVisibleTo,
  type AdminAnnouncementView,
  type AnnouncementInput,
  type AnnouncementPatch,
  type AnnouncementView,
} from "../../../../shared/today";
import { schema, type Db } from "../../db";
import { newId, now } from "../../lib/ids";

/**
 * v5 announcements: short messages from an admin, pinned on learners' Today screens. The audience
 * (everyone, some departments, some people) is resolved when a learner reads, so somebody who
 * joins a department next week still sees what's live for it.
 */

type Row = typeof schema.announcements.$inferSelect;

/** Live and pinned first, then newest. Learners see at most this many. */
export const LEARNER_ANNOUNCEMENT_LIMIT = 5;

function authorNames(db: Db, rows: readonly Row[]): Map<string, string> {
  const ids = [...new Set(rows.map((r) => r.createdBy).filter((id): id is string => id !== null))];
  const out = new Map<string, string>();
  for (const id of ids) {
    const user = db.select({ name: schema.users.displayName }).from(schema.users).where(eq(schema.users.id, id)).get();
    if (user) out.set(id, user.name);
  }
  return out;
}

function toView(row: Row, names: Map<string, string>): AnnouncementView {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    pinned: row.pinned,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    author: row.createdBy ? (names.get(row.createdBy) ?? null) : null,
  };
}

function toAdminView(row: Row, names: Map<string, string>, nowMs: number): AdminAnnouncementView {
  return {
    ...toView(row, names),
    audience: row.audience as AdminAnnouncementView["audience"],
    createdBy: row.createdBy,
    expired: row.expiresAt !== null && row.expiresAt <= nowMs,
  };
}

/** Clean an audience before storing it: drop empty lists, keep `all` only when true. */
function cleanAudience(audience: AnnouncementInput["audience"]): Row["audience"] {
  if (audience.all === true) return { all: true };
  const out: Row["audience"] = {};
  if (audience.departmentIds?.length) out.departmentIds = [...new Set(audience.departmentIds)];
  if (audience.userIds?.length) out.userIds = [...new Set(audience.userIds)];
  return out;
}

export function listForLearner(db: Db, userId: string, nowMs = now()): AnnouncementView[] {
  const departmentId =
    db.select({ d: schema.learnerProfiles.departmentId }).from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).get()?.d ?? null;
  const rows = db
    .select()
    .from(schema.announcements)
    .orderBy(desc(schema.announcements.createdAt))
    .limit(200)
    .all()
    .filter((row) => announcementVisibleTo(row, { userId, departmentId }, nowMs))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt)
    .slice(0, LEARNER_ANNOUNCEMENT_LIMIT);
  const names = authorNames(db, rows);
  return rows.map((row) => toView(row, names));
}

export function listForAdmin(db: Db, nowMs = now()): AdminAnnouncementView[] {
  const rows = db.select().from(schema.announcements).orderBy(desc(schema.announcements.createdAt)).all();
  const names = authorNames(db, rows);
  return rows.map((row) => toAdminView(row, names, nowMs));
}

export function getAnnouncement(db: Db, id: string): Row | null {
  return db.select().from(schema.announcements).where(eq(schema.announcements.id, id)).get() ?? null;
}

export function adminView(db: Db, row: Row, nowMs = now()): AdminAnnouncementView {
  return toAdminView(row, authorNames(db, [row]), nowMs);
}

export function createAnnouncement(db: Db, actorId: string, input: AnnouncementInput): Row {
  const row: Row = {
    id: newId(),
    title: input.title,
    body: input.body,
    audience: cleanAudience(input.audience),
    pinned: input.pinned,
    createdBy: actorId,
    createdAt: now(),
    expiresAt: input.expiresAt,
  };
  db.insert(schema.announcements).values(row).run();
  return row;
}

export function updateAnnouncement(db: Db, id: string, patch: AnnouncementPatch): Row | null {
  const existing = getAnnouncement(db, id);
  if (!existing) return null;
  const set: Partial<Row> = {};
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.body !== undefined) set.body = patch.body;
  if (patch.audience !== undefined) set.audience = cleanAudience(patch.audience);
  if (patch.pinned !== undefined) set.pinned = patch.pinned;
  if (patch.expiresAt !== undefined) set.expiresAt = patch.expiresAt;
  db.update(schema.announcements).set(set).where(eq(schema.announcements.id, id)).run();
  return { ...existing, ...set };
}

export function deleteAnnouncement(db: Db, id: string): boolean {
  return db.delete(schema.announcements).where(eq(schema.announcements.id, id)).run().changes > 0;
}
