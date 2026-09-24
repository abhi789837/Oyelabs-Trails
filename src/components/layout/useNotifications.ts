import { useCallback, useEffect, useRef, useState } from "react";

import type { AppNotification } from "@shared/notifications";

import { ApiRequestError } from "@/api/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { countUnread, fetchNotifications, markAllNotificationsRead } from "./notifications";

/** How often the bell re-checks while the tab is in front. Nothing polls in a hidden tab. */
const POLL_MS = 60_000;

export interface NotificationsState {
  items: AppNotification[];
  unread: number;
  loading: boolean;
  error: string | null;
  reload: () => void;
  markAllRead: () => void;
}

/**
 * The bell's data.
 *
 * Polling rather than the SSE feed on purpose: `/api/admin/events` is the superadmin's live
 * integrity stream, it is superadmin-only, and holding a second EventSource open for every
 * learner just to learn about a notification an hour from now would cost a connection each for no
 * benefit. A minute of latency on "your plan is ready" is invisible; an idle tab costing a socket
 * is not.
 */
export function useNotifications(): NotificationsState {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Guards against a response for the previous account landing after a switch. */
  const requestedFor = useRef<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!userId) return;
      requestedFor.current = userId;
      setLoading(true);
      try {
        const result = await fetchNotifications(signal);
        if (requestedFor.current !== userId) return;
        setItems(result.notifications);
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load notifications.");
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setError(null);
      return;
    }
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [userId, load]);

  useEffect(() => {
    if (!userId) return;
    const tick = () => {
      if (document.visibilityState === "visible") void load();
    };
    const timer = setInterval(tick, POLL_MS);
    // A tab that has been in the background for an hour should be current the moment it is looked
    // at again, rather than up to a minute stale.
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [userId, load]);

  const markAllRead = useCallback(() => {
    const stamp = Date.now();
    // Optimistic: the dot going out is the feedback, and a failed write only means it comes back
    // on the next poll rather than something being lost.
    setItems((current) => current.map((item) => (item.readAt === null ? { ...item, readAt: stamp } : item)));
    void markAllNotificationsRead().catch(() => void load());
  }, [load]);

  return {
    items,
    unread: countUnread(items),
    loading,
    error,
    reload: useCallback(() => void load(), [load]),
    markAllRead,
  };
}
