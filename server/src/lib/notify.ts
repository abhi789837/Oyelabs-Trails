import { and, desc, eq, isNull } from "drizzle-orm";

import { isStaff } from "../../../shared/enums";
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

/**
 * Everyone who should hear about something that needs a person in the console.
 *
 * Both staff roles, not just the superadmin. An admin who issues an assessment and is never told
 * it finished generating would be watching a status badge for several minutes, and the approval
 * deadline would expire on someone who was never notified there was anything to approve.
 */
export function staffIds(db: Db): string[] {
  return db
    .select({ id: schema.users.id, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.status, "active"))
    .all()
    .filter((u) => isStaff(u.role))
    .map((u) => u.id);
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
