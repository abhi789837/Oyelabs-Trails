import { z } from "zod";

/**
 * In-app notifications, as both sides see them.
 *
 * The rows come from the `notifications` table that `server/src/lib/notify.ts` writes to. `kind`
 * is a free-form dotted string rather than an enum on purpose: the server adds new kinds as
 * features land, and the shell must keep rendering the ones it has never heard of instead of
 * failing to parse them. The UI maps known kinds to an icon and falls back for the rest.
 */
export const notificationSchema = z.object({
  id: z.string(),
  recipientId: z.string(),
  kind: z.string(),
  title: z.string(),
  body: z.string(),
  /** An in-app path, e.g. "/plan". Null when there is nowhere useful to go. */
  link: z.string().nullable(),
  /** Epoch ms, or null while unread. */
  readAt: z.number().nullable(),
  createdAt: z.number(),
});
export type AppNotification = z.infer<typeof notificationSchema>;

export const notificationsResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  unread: z.number(),
});
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>;
