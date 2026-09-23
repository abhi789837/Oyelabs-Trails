import { desc, eq } from "drizzle-orm";

import { schema, type Db } from "../db";
import { newId, now } from "./ids";

export interface AuditEntry {
  actorId: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: unknown;
}

/**
 * Every admin mutation writes one of these (brief §6). Keep `details` free of secrets and of
 * anything that would re-expose a password: record what changed, not the new value.
 */
export function writeAudit(db: Db, entry: AuditEntry): void {
  db.insert(schema.auditLog)
    .values({
      id: newId(),
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      details: entry.details ?? null,
      createdAt: now(),
    })
    .run();
}

export function recentAudit(db: Db, limit = 100) {
  return db.select().from(schema.auditLog).orderBy(desc(schema.auditLog.createdAt)).limit(limit).all();
}

export function auditForTarget(db: Db, targetId: string, limit = 100) {
  return db
    .select()
    .from(schema.auditLog)
    .where(eq(schema.auditLog.targetId, targetId))
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(limit)
    .all();
}
