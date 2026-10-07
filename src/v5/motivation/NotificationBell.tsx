import * as Popover from "@radix-ui/react-popover";
import { Award, Bell, ChevronRight, TrendingUp } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/v5/design/cn";
import type { AppNotification } from "@shared/notifications";

import { motivationApi } from "./api";
import { timeAgo } from "./logic";

/**
 * What a notification wins: certificates and level-ups wear amber (rebrand Phase 6, "Amber
 * celebrates"); everything else is a quiet blue bell. Kinds are free-form (shared/notifications.ts),
 * so anything unknown falls back to the bell.
 */
function kindBadge(kind: string): { icon: ReactNode; win: boolean } {
  if (kind.startsWith("certificate.")) return { icon: <Award />, win: true };
  if (/level[_-]?up/i.test(kind)) return { icon: <TrendingUp />, win: true };
  return { icon: <Bell />, win: false };
}

/**
 * The bell in the learner top bar: the existing notifications (`/api/me/notifications`), newest
 * first. Opening it marks them read. Reminders and admin nudges land here too. Brand tokens: the new
 * count and unread dots are Oyelabs Blue (an unread count isn't an error), wins are amber.
 */
export function NotificationBell({ unread, onRead }: { unread: number; onRead: () => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    setError(false);
    motivationApi
      .notifications(ac.signal)
      .then((res) => {
        setItems(res.notifications);
        if (res.unread > 0) void motivationApi.markRead().then(onRead, () => undefined);
      })
      .catch(() => {
        if (!ac.signal.aborted) setError(true);
      });
    return () => ac.abort();
  }, [open, onRead]);

  const label = unread > 0 ? `Notifications, ${unread} new` : "Notifications";
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          data-testid="v5-bell"
          className="relative grid size-10 place-items-center rounded-control text-fg-2 hover:bg-sunken hover:text-fg-1"
        >
          <Bell className="size-5" aria-hidden="true" />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 grid min-w-4.5 place-items-center rounded-full bg-brand px-1 text-[11px] font-semibold leading-4.5 text-on-brand ring-2 ring-surface-1" aria-hidden="true">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          collisionPadding={12}
          aria-label="Notifications"
          className="z-50 flex max-h-[70dvh] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-card border border-line-1 bg-surface-3 text-fg-1 shadow-e3"
        >
          <h2 className="border-b border-line-1 px-4 py-3 font-display text-h4 font-semibold">Notifications</h2>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {error ? (
              <p className="px-4 py-6 text-small text-fg-2">We couldn't load your notifications. Close this and try again.</p>
            ) : items === null ? (
              <p className="px-4 py-6 text-small text-fg-2">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-small text-fg-2">Nothing new. We'll let you know when something needs you.</p>
            ) : (
              <ul className="divide-y divide-line-1" data-testid="v5-notification-list">
                {items.map((n) => {
                  const badge = kindBadge(n.kind);
                  const unreadItem = n.readAt === null;
                  const body = (
                    <>
                      <span className="flex items-start justify-between gap-3">
                        <span className={cn("text-small text-fg-1", unreadItem && "font-semibold")}>
                          {unreadItem ? <span className="mr-1.5 inline-block size-2 rounded-full bg-brand align-middle" aria-hidden="true" /> : null}
                          {n.title}
                        </span>
                        <span className="shrink-0 text-caption text-fg-2">{timeAgo(n.createdAt)}</span>
                      </span>
                      <span className="mt-0.5 block text-small text-fg-2">{n.body}</span>
                    </>
                  );
                  const icon = (
                    <span
                      className={cn(
                        "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full [&_svg]:size-4",
                        badge.win ? "bg-progress-soft text-progress-fg" : "bg-brand-soft text-brand-fg",
                      )}
                      aria-hidden="true"
                      data-win={badge.win || undefined}
                    >
                      {badge.icon}
                    </span>
                  );
                  return (
                    <li key={n.id} className={cn(badge.win && "border-l-2 border-l-progress")}>
                      {n.link ? (
                        // A chevron marks the ones that go somewhere (UX review B1).
                        <Link to={n.link} onClick={() => setOpen(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-sunken">
                          {icon}
                          <span className="block min-w-0 flex-1">{body}</span>
                          <ChevronRight className="mt-1 size-4 shrink-0 text-fg-2" aria-hidden="true" />
                        </Link>
                      ) : (
                        <div className="flex items-start gap-3 px-4 py-3">
                          {icon}
                          <span className="block min-w-0 flex-1">{body}</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
