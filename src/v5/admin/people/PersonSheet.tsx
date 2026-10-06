import { ArrowUpRight, CalendarClock, CheckCircle2, CircleDot, Flag, LogIn, MessageSquare, RotateCw, Sparkles, Trophy, UserPlus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { agoLabel } from "@shared/adminInbox";
import type { NextAction, NextActionTone } from "@shared/nextAction";

import { adminApi } from "@/features/admin/api";
import { builderApi } from "@/features/admin/builder/api";
import { nextActionApi } from "@/features/admin/learner/nextAction";
import { Avatar, Badge, Button, ProgressBar, Sheet, Skeleton, StatusLine, useIsMobile, useMediaQuery, v5Toast } from "@/v5/design";

import { v5AdminApi } from "../api";
import { formatDate, plainMessage, useLoad } from "../parts/common";
import { AddCourse } from "./AddCourse";
import type { PersonRow } from "./views";

const TONE: Record<NextActionTone, "info" | "success" | "neutral" | "danger"> = { todo: "info", done: "success", waiting: "neutral", blocked: "danger" };

const EVENT_ICON: Record<string, ReactNode> = {
  lesson: <CheckCircle2 />,
  "course-lesson": <CheckCircle2 />,
  test: <Flag />,
  placement: <Flag />,
  review: <MessageSquare />,
  win: <Trophy />,
  "sign-in": <LogIn />,
  joined: <UserPlus />,
};

/** The "full page" tab a next-action button opens. */
function fullPageHref(id: string, action: NextAction): string {
  const b = action.button;
  if (b?.action === "open") return `/admin/people/${id}?tab=${b.tab}${b.anchor ? `#${b.anchor}` : ""}`;
  if (b?.action === "link") return b.to;
  return `/admin/people/${id}`;
}

/**
 * The People side sheet: who they are in one status line, the one next thing to do (the same rule
 * as the full learner page, `shared/nextAction.ts`), their plan, and what they did lately. It sits
 * beside the list (non-modal), and the URL keeps `?person=id`, so a link opens it straight away.
 */
export function PersonSheet({ person, onClose, onChanged }: { person: PersonRow | null; onClose: () => void; onChanged: () => void }) {
  const open = person !== null;
  // Phone: the whole screen, as a modal (there's no list beside it to use). Tablet: a narrower
  // panel over the list. From 1024 px: the usual width, and from 1280 px the list makes room for it.
  const phone = useIsMobile();
  const roomy = useMediaQuery("(min-width: 1024px)");
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      modal={phone}
      side="right"
      width={roomy ? "md" : "sm"}
      title={person?.displayName ?? "Person"}
      description={person ? person.username : undefined}
      footer={
        person ? (
          <Button variant="secondary" size="sm" asChild>
            <Link to={`/admin/people/${person.id}`}>
              Open full page
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        ) : null
      }
    >
      {person ? <PersonBody key={person.id} person={person} onChanged={onChanged} /> : null}
    </Sheet>
  );
}

function PersonBody({ person, onChanged }: { person: PersonRow; onChanged: () => void }) {
  const navigate = useNavigate();
  const learner = person.role === "learner";
  const next = useLoad((signal) => (learner ? nextActionApi.get(person.id, signal) : Promise.resolve(null)), person.id);
  const activity = useLoad((signal) => v5AdminApi.activity(person.id, signal), person.id);
  const [busy, setBusy] = useState(false);
  const action = next.data?.action ?? null;

  const run = async () => {
    if (!action?.button) return;
    const b = action.button;
    if (b.action === "open" || b.action === "link" || b.action === "invite" || b.action === "week" || b.action === "advance-week") {
      navigate(fullPageHref(person.id, action));
      return;
    }
    setBusy(true);
    try {
      if (b.action === "assign") await adminApi.issueAssessment(person.id);
      else if (b.action === "enable") await adminApi.setStatus(person.id, "active");
      else if (b.action === "build") await builderApi.buildPath(person.id);
      v5Toast.success("Done.");
      next.reload();
      onChanged();
    } catch (error) {
      v5Toast.error("That didn't work", plainMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Avatar name={person.displayName} decorative />
        <div className="min-w-0 text-small">
          <p className="truncate text-fg-1">{person.roleTitle ?? (learner ? "Learner" : "Staff")}</p>
          <p className="text-fg-2">Joined {formatDate(person.createdAt)}</p>
        </div>
        <div className="ml-auto flex flex-wrap justify-end gap-1">
          {person.stuck ? <Badge tone="warning">Stuck</Badge> : null}
          {person.status !== "active" ? <Badge tone="neutral">{person.status === "disabled" ? "Suspended" : "Archived"}</Badge> : null}
        </div>
      </div>

      {learner ? (
        next.data === null && next.loading ? (
          <Skeleton className="h-14 w-full rounded-card" />
        ) : next.error && !next.data ? (
          <StatusLine tone="neutral" action={<RetryButton onClick={next.reload} />}>
            {plainMessage(next.error, "We couldn't work out the next step.")}
          </StatusLine>
        ) : action ? (
          <StatusLine
            tone={TONE[action.tone]}
            icon={<CircleDot />}
            action={
              action.button ? (
                <Button variant="primary" size="sm" loading={busy} onClick={() => void run()}>
                  {action.button.label}
                </Button>
              ) : null
            }
          >
            {action.title}
          </StatusLine>
        ) : null
      ) : (
        <StatusLine tone="neutral">Staff account: nothing to assign.</StatusLine>
      )}

      {learner ? (
        <div className="flex flex-wrap items-center gap-2">
          <AddCourse userId={person.id} name={person.displayName} />
        </div>
      ) : null}

      {learner ? (
        <section aria-labelledby="sheet-plan">
          <h3 id="sheet-plan" className="mb-2 font-display text-h4 font-semibold">
            Plan
          </h3>
          {activity.data ? (
            activity.data.plan.topicCount > 0 ? (
              <div className="flex flex-col gap-2 text-small">
                <ProgressBar value={activity.data.plan.completed} max={activity.data.plan.topicCount} label={`${activity.data.plan.completed} of ${activity.data.plan.topicCount} lessons done`} />
                {activity.data.plan.nextTopic ? (
                  <p className="text-fg-2">
                    Next: <span className="text-fg-1">{activity.data.plan.nextTopic}</span>
                  </p>
                ) : null}
                <p className="text-fg-2">
                  <CalendarClock className="mr-1 inline size-4 align-text-bottom" aria-hidden="true" />
                  {person.lastActivityAt ? `Last learned ${agoLabel(person.lastActivityAt, Date.now())}` : "Hasn't started yet"}
                </p>
              </div>
            ) : (
              <p className="text-small text-fg-2">No plan yet. It's made after their test.</p>
            )
          ) : activity.error ? (
            <LoadFailed message={plainMessage(activity.error)} onRetry={activity.reload} />
          ) : (
            <div className="flex flex-col gap-2" aria-hidden="true">
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
          {activity.data?.plan.goals.length ? (
            <ul className="mt-3 flex flex-col gap-1 text-small">
              {activity.data.plan.goals.map((g) => (
                <li key={g} className="flex gap-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-fg-2" aria-hidden="true" />
                  {g}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="sheet-activity">
        <h3 id="sheet-activity" className="mb-2 font-display text-h4 font-semibold">
          Recent activity
        </h3>
        {activity.data ? (
          <ol className="flex flex-col gap-2.5">
            {activity.data.events.map((e, i) => (
              <li key={`${e.at}-${i}`} className="flex gap-3 text-small">
                <span className="mt-0.5 text-fg-2 [&_svg]:size-4" aria-hidden="true">
                  {EVENT_ICON[e.kind] ?? <CircleDot />}
                </span>
                <span className="min-w-0 flex-1 text-fg-1">{e.text}</span>
                <time className="shrink-0 text-fg-2" dateTime={new Date(e.at).toISOString()}>
                  {formatDate(e.at)}
                </time>
              </li>
            ))}
          </ol>
        ) : activity.error ? (
          learner ? null : <LoadFailed message={plainMessage(activity.error)} onRetry={activity.reload} />
        ) : (
          <ul className="flex flex-col gap-2.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-3">
                <Skeleton className="size-4 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </li>
            ))}
          </ul>
        )}
        {activity.data && activity.data.events.length === 0 ? <p className="text-small text-fg-2">Nothing yet. Their first lesson shows up here.</p> : null}
      </section>
    </div>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="secondary" size="sm" onClick={onClick}>
      <RotateCw aria-hidden="true" />
      Try again
    </Button>
  );
}

function LoadFailed({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 text-small text-fg-2">
      <span className="min-w-0 flex-1">{message}</span>
      <RetryButton onClick={onRetry} />
    </div>
  );
}
