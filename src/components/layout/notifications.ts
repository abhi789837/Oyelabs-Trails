import type { AppNotification, NotificationsResponse } from "@shared/notifications";

import { api } from "@/api/client";

/**
 * The notification centre's data layer, kept free of React so the grouping and the wording can be
 * tested without a DOM (there is no jsdom in this repo's vitest setup — see `vitest.config.ts`).
 */

export const NOTIFICATION_LIMIT = 30;

export function fetchNotifications(signal?: AbortSignal): Promise<NotificationsResponse> {
  return api.get<NotificationsResponse>(`/api/me/notifications?limit=${NOTIFICATION_LIMIT}`, signal);
}

export function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return api.post<{ ok: boolean }>("/api/me/notifications/read");
}

export interface NotificationGroups {
  today: AppNotification[];
  earlier: AppNotification[];
}

/**
 * Two buckets, not five.
 *
 * "Today" is the calendar day the reader is in, in their own timezone — not "the last 24 hours",
 * which puts yesterday evening under Today and reads as wrong at 9am. Everything else is
 * "Earlier"; a bell holding at most 30 rows does not need a month divider.
 */
export function groupNotifications(items: AppNotification[], now: number = Date.now()): NotificationGroups {
  const todayStamp = new Date(now).toDateString();
  const today: AppNotification[] = [];
  const earlier: AppNotification[] = [];
  for (const item of items) {
    (new Date(item.createdAt).toDateString() === todayStamp ? today : earlier).push(item);
  }
  return { today, earlier };
}

export function countUnread(items: AppNotification[]): number {
  return items.reduce((n, item) => n + (item.readAt === null ? 1 : 0), 0);
}

/** "9+" past the point where an exact count stops being useful and starts being a wide badge. */
export function unreadBadgeLabel(count: number): string {
  return count > 9 ? "9+" : String(count);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * A short age, for the right-hand side of a row. Deliberately coarse: the exact minute is in the
 * `title` attribute, and a list of five "2 minutes ago"s is harder to scan than five "2m"s.
 */
export function relativeTime(timestamp: number, now: number = Date.now()): string {
  const elapsed = now - timestamp;
  if (elapsed < 0) return "now";
  if (elapsed < MINUTE) return "now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`;
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d`;
  return new Date(timestamp).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function absoluteTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * What a notification *is*, from its kind.
 *
 * `kind` is a dotted string the server can extend at any time (`shared/notifications.ts` says
 * why), so this maps the family — the part before the dot, then the whole string for the ones
 * worth calling out — and anything unrecognised still gets a sensible icon rather than nothing.
 */
export type NotificationTone = "attention" | "progress" | "good" | "bad" | "neutral";

export function notificationTone(kind: string): NotificationTone {
  switch (kind) {
    case "assessment.ready":
    case "assessment.awaiting_approval":
      return "attention";
    case "assessment.auto_approved":
      return "progress";
    case "assessment.failed":
    case "evaluation.failed":
    case "assessment.terminated":
      return "bad";
    case "plan.published":
    case "evaluation.ready":
      return "good";
    default:
      return kind.startsWith("assessment.") || kind.startsWith("evaluation.") ? "progress" : "neutral";
  }
}

/** The group heading a kind belongs under if it is ever grouped by subject rather than by day. */
export function notificationFamily(kind: string): string {
  const [family] = kind.split(".");
  return family || "general";
}
