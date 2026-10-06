import { AlertTriangle, BookOpen, ClipboardCheck, FileWarning, Inbox, MessageSquareWarning, Settings2, ShieldAlert, UserX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { agoLabel, isReversible, UNDO_MS, withoutItem, type InboxAction, type InboxGroup, type InboxGroupId, type InboxItem } from "@shared/adminInbox";

import { Badge, Button, EmptyState, ErrorState, SkeletonLayout, v5Toast } from "@/v5/design";

import { v5AdminApi } from "../api";
import { Page, PageHeader, plainMessage, useLoad, useSlow } from "../parts/common";
import { createDeferredQueue } from "../parts/deferred";
import { useAdminShell } from "../shell/AdminShell";

const GROUP_ICON: Record<InboxGroupId, ReactNode> = {
  tests: <ClipboardCheck />,
  reviews: <MessageSquareWarning />,
  courses: <BookOpen />,
  problems: <FileWarning />,
  stuck: <UserX />,
  integrity: <ShieldAlert />,
  setup: <Settings2 />,
};

/** Hides items the admin just acted on, keeping each group's count right. */
export function visibleGroups(groups: readonly InboxGroup[], hidden: ReadonlySet<string>): InboxGroup[] {
  let out = [...groups];
  for (const id of hidden) out = withoutItem(out, id);
  return out;
}

/** What the toast says after an action. */
function doneMessage(item: InboxItem, action: InboxAction): string {
  switch (action.kind) {
    case "approve-test":
    case "send-test":
      return "Test sent.";
    case "full-marks":
      return "Full marks given. We told them.";
    case "fix-course":
      return "Fixing it now. It comes back here if it still needs a look.";
    case "publish-course":
      return "Course published.";
    case "resolve-problem":
      return "Marked fixed.";
    case "nudge":
      return "Reminder sent.";
    case "dismiss":
      return "Marked as checked.";
    case "open":
      return item.title;
  }
}

async function send(action: InboxAction): Promise<unknown> {
  switch (action.kind) {
    case "approve-test":
      return v5AdminApi.approveTest(action.assessmentId);
    case "send-test":
      return v5AdminApi.sendTest(action.userId);
    case "full-marks":
      return v5AdminApi.fullMarks(action.reviewId);
    case "fix-course":
      return v5AdminApi.fixCourse(action.courseId);
    case "publish-course":
      return v5AdminApi.publishCourse(action.courseId);
    case "resolve-problem":
      return v5AdminApi.resolveProblem(action.problemId);
    case "nudge":
      return v5AdminApi.nudge([action.userId]);
    case "dismiss":
      return v5AdminApi.dismiss(action.key);
    case "open":
      return undefined;
  }
}

/** `/admin`: "Needs your attention". Grouped, one line per item, one primary button each. */
export default function InboxPage() {
  const navigate = useNavigate();
  const { setInboxCount } = useAdminShell();
  const inbox = useLoad((signal) => v5AdminApi.inbox(signal));
  const slow = useSlow(inbox.loading && !inbox.data);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const queue = useRef(createDeferredQueue(UNDO_MS));

  // Whatever is still waiting for its Undo window goes out when the page closes.
  useEffect(() => {
    const q = queue.current;
    const flush = () => void q.flush();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  const groups = useMemo(() => visibleGroups(inbox.data?.groups ?? [], hidden), [inbox.data, hidden]);
  const total = groups.reduce((n, g) => n + g.total, 0);
  useEffect(() => {
    if (inbox.data) setInboxCount(total);
  }, [inbox.data, total, setInboxCount]);
  useEffect(() => () => setInboxCount(null), [setInboxCount]);

  const hide = (id: string) => setHidden((h) => new Set(h).add(id));
  const unhide = (id: string) =>
    setHidden((h) => {
      const next = new Set(h);
      next.delete(id);
      return next;
    });

  const act = useCallback(
    async (item: InboxItem, action: InboxAction) => {
      if (action.kind === "open") {
        navigate(action.href);
        return;
      }
      hide(item.id);
      if (isReversible(action)) {
        queue.current.schedule(item.id, () => send(action), (error) => {
          unhide(item.id);
          v5Toast.error("That didn't work", plainMessage(error));
        });
        v5Toast.undo(doneMessage(item, action), () => {
          if (queue.current.cancel(item.id)) unhide(item.id);
        });
        return;
      }
      setBusy(item.id);
      try {
        await send(action);
        v5Toast.success(doneMessage(item, action));
      } catch (error) {
        unhide(item.id);
        v5Toast.error("That didn't work", plainMessage(error));
      } finally {
        setBusy(null);
      }
    },
    [navigate],
  );

  return (
    <Page>
      <PageHeader
        title="Needs your attention"
        description={inbox.data && total > 0 ? `${total} ${total === 1 ? "thing" : "things"} waiting. Each one has one button that deals with it.` : "Everything that needs a person shows up here."}
        actions={
          <Button variant="ghost" size="sm" onClick={inbox.reload} loading={inbox.loading && Boolean(inbox.data)}>
            Refresh
          </Button>
        }
      />

      {inbox.error && !inbox.data ? (
        <ErrorState body={plainMessage(inbox.error)} onRetry={inbox.reload} />
      ) : !inbox.data ? (
        slow ? <SkeletonLayout variant="list" rows={6} label="Loading the inbox" /> : null
      ) : groups.length === 0 ? (
        <EmptyState className="motion-safe:animate-in motion-safe:fade-in" icon={<Inbox />} title="All caught up 🎉" body="Nothing needs you right now. New things appear here as they happen." />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`inbox-${group.id}`} className="flex flex-col gap-2">
              <h2 id={`inbox-${group.id}`} className="flex items-center gap-2 font-display text-h4 font-semibold text-fg-1">
                <span className="text-fg-2 [&_svg]:size-4" aria-hidden="true">
                  {GROUP_ICON[group.id]}
                </span>
                {group.label}
                <Badge tone="neutral">
                  {group.total}
                  <span className="sr-only"> waiting</span>
                </Badge>
              </h2>
              <ul className="flex flex-col divide-y divide-line-1 overflow-hidden rounded-card border border-line-1 bg-surface-1">
                {group.items.map((item) => (
                  <InboxRow key={item.id} item={item} busy={busy === item.id} onAct={act} />
                ))}
              </ul>
              {group.total > group.items.length ? (
                <p className="text-small text-fg-2">
                  {group.total - group.items.length} more not shown. {moreLink(group.id)}
                </p>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}

function moreLink(group: InboxGroupId): ReactNode {
  const to: Partial<Record<InboxGroupId, [string, string]>> = {
    reviews: ["/admin/reviews", "See them all"],
    courses: ["/admin/library", "Open the library"],
    problems: ["/admin/problems", "See them all"],
    stuck: ["/admin/people?view=stuck", "See them in People"],
    tests: ["/admin/people?view=test-pending", "See them in People"],
    integrity: ["/admin/integrity", "See them all"],
  };
  const link = to[group];
  return link ? (
    <Link className="font-medium text-brand-fg underline-offset-4 hover:underline" to={link[0]}>
      {link[1]}
    </Link>
  ) : null;
}

function InboxRow({ item, busy, onAct }: { item: InboxItem; busy: boolean; onAct: (item: InboxItem, action: InboxAction) => void }) {
  const ago = agoLabel(item.at, Date.now());
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4" data-inbox-item={item.id}>
      <div className="min-w-0 flex-1">
        <p className="text-small font-medium text-fg-1">{item.title}</p>
        <p className="mt-0.5 text-small text-fg-2">
          {item.detail}
          {ago ? <span className="text-fg-2"> · {ago}</span> : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.secondary ? (
          <Button variant="ghost" size="sm" onClick={() => onAct(item, item.secondary!)} aria-label={`${item.secondary.label}: ${item.title}`}>
            {item.secondary.label}
          </Button>
        ) : null}
        <Button variant="primary" size="sm" loading={busy} onClick={() => onAct(item, item.action)} aria-label={`${item.action.label}: ${item.title}`}>
          {item.action.kind === "open" && item.group === "setup" ? <AlertTriangle aria-hidden="true" /> : null}
          {item.action.label}
        </Button>
      </div>
    </li>
  );
}
