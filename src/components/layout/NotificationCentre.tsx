import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Bell, CircleCheck, Clock, Flag, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import type { AppNotification } from "@shared/notifications";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  absoluteTime,
  groupNotifications,
  notificationTone,
  relativeTime,
  unreadBadgeLabel,
  type NotificationTone,
} from "./notifications";
import { useNotifications } from "./useNotifications";

/**
 * The bell.
 *
 * Everything in it is a row the server wrote through `notify()` — an assessment released, a plan
 * published, an evaluation that failed. Nothing is synthesised in the browser, so an empty bell
 * genuinely means nothing has happened.
 *
 * Read state is per-person and whole-list: the API offers "mark all read" and nothing finer, so a
 * row stays unread until someone says so. Marking read on open would be a lie the moment a panel
 * is opened by accident, and there is no per-row endpoint to do better honestly.
 */
const TONE_ICON: Record<NotificationTone, LucideIcon> = {
  attention: Flag,
  progress: Clock,
  good: CircleCheck,
  bad: TriangleAlert,
  neutral: Info,
};

const TONE_CLASS: Record<NotificationTone, string> = {
  attention: "text-trailmark-strong",
  progress: "text-basalt-strong",
  good: "text-summit-strong",
  bad: "text-destructive",
  neutral: "text-muted-foreground",
};

export function NotificationCentre() {
  const [open, setOpen] = useState(false);
  const { items, unread, loading, error, reload, markAllRead } = useNotifications();
  const groups = useMemo(() => groupNotifications(items), [items]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    // Opening is the moment the list should be current; it costs one request per open at most.
    if (next) reload();
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell aria-hidden="true" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-trailmark px-1 font-mono text-[10px] font-semibold leading-none text-trailmark-foreground"
            >
              {unreadBadgeLabel(unread)}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      {/* `align="end"` because the bell lives at the right edge of the bar; the primitive's own
          default is start-aligned, which would hang the panel off the screen. */}
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] p-0" aria-label="Notifications">
        <div className="flex items-center gap-2 border-b px-3.5 py-2.5">
          <h2 className="font-brand text-sm font-semibold">Notifications</h2>
          {unread > 0 && (
            <span className="font-mono text-[11px] text-muted-foreground">{unread} unread</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 px-2 text-xs text-muted-foreground"
            onClick={markAllRead}
            disabled={unread === 0}
          >
            Mark all read
          </Button>
        </div>

        <ScrollArea className="max-h-[min(24rem,60vh)]">
          {error ? (
            <div className="px-3.5 py-8 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={reload}>
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              {loading ? "Loading…" : "Nothing yet. Anything the platform needs you for lands here."}
            </p>
          ) : (
            <motion.div variants={stagger(0.03)} initial="hidden" animate="visible" className="py-1.5">
              <Section title="Today" items={groups.today} onNavigate={() => setOpen(false)} />
              <Section title="Earlier" items={groups.earlier} onNavigate={() => setOpen(false)} />
            </motion.div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function Section({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: AppNotification[];
  onNavigate: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title}>
      <h3 className="px-3.5 pb-1 pt-2 text-xs font-medium text-muted-foreground">{title}</h3>
      <ul className="px-1.5">
        {items.map((item) => (
          <motion.li key={item.id} variants={fadeUp}>
            <Row item={item} onNavigate={onNavigate} />
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

function Row({ item, onNavigate }: { item: AppNotification; onNavigate: () => void }) {
  const tone = notificationTone(item.kind);
  const Icon = TONE_ICON[tone];
  const unread = item.readAt === null;

  const body = (
    <>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", TONE_CLASS[tone])} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={cn("min-w-0 flex-1 text-sm leading-snug", unread ? "font-medium" : "text-muted-foreground")}>
            {item.title}
          </span>
          <time
            dateTime={new Date(item.createdAt).toISOString()}
            title={absoluteTime(item.createdAt)}
            className="shrink-0 font-mono text-[11px] text-muted-foreground"
          >
            {relativeTime(item.createdAt)}
          </time>
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.body}</span>
      </span>
      {unread && <span className="sr-only">Unread</span>}
    </>
  );

  const classes = cn(
    "flex w-full gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
    unread && "bg-trailmark/6",
  );

  if (!item.link) return <div className={classes}>{body}</div>;

  return (
    <Link to={item.link} onClick={onNavigate} className={cn(classes, "hover:bg-accent")}>
      {body}
    </Link>
  );
}
