import { and, desc, eq, isNull } from "drizzle-orm";

import { schema, type Db } from "../db";
import { newId, now } from "./ids";

/**
 * In-app notifications (brief §1, non-goals).
 *
 * Email and SMS are explicitly out of scope for v3, but the shape stays behind this one function
 * so adding a notifier later means changing here and nowhere else.
 */
export interface NotificationInput {
  recipientId: string;
  kind: string;
  title: string;
  body: string;
  link?: string | null;
}

export function notify(db: Db, input: NotificationInput): string {
  const id = newId();
  db.insert(schema.notifications)
    .values({
      id,
      recipientId: input.recipientId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      createdAt: now(),
    })
    .run();
  return id;
}

export function listNotifications(db: Db, recipientId: string, limit = 50) {
  return db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.recipientId, recipientId))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit)
    .all();
}

export function unreadCount(db: Db, recipientId: string): number {
  return db
    .select({ id: schema.notifications.id })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.recipientId, recipientId), isNull(schema.notifications.readAt)))
    .all().length;
}

export function markAllRead(db: Db, recipientId: string): void {
  db.update(schema.notifications)
    .set({ readAt: now() })
    .where(and(eq(schema.notifications.recipientId, recipientId), isNull(schema.notifications.readAt)))
    .run();
}
