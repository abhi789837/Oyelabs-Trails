import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HeartPulse, LoaderCircle, Radio, ShieldAlert, TimerReset, Users } from "lucide-react";
import { Link } from "react-router-dom";

import type { AssessmentStatus, Severity } from "@shared/enums";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { relativeTime } from "@/components/layout/notifications";
import { useConfirm } from "@/components/overlays";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { TimerRing } from "@/features/assessment/TimerRing";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { fadeUp, spring, stagger, transition } from "@/lib/motion";
import { notify } from "@/lib/toast";
import { cn, formatTimestamp } from "@/lib/utils";
import { AnimatedNumber } from "@/pages/parts/Stats";

interface LiveRow {
  assessmentId: string;
  userId: string;
  displayName: string;
  username: string;
  status: AssessmentStatus;
  answered: number;
  startedAt: number | null;
  deadlineAt: number | null;
  msLeft: number | null;
  /** The attempt's own budget, for the ring. Null on an attempt whose config predates the field. */
  timeLimitMinutes: number | null;
  hardWarnings: number;
  softWarnings: number;
  lastHeartbeatAt: number | null;
  recentEvents: { id: string; type: string; severity: Severity; counted: boolean; createdAt: number; snapshotPath: string | null }[];
}

/** A heartbeat older than this means the tab is closed, asleep, or the network went. */
const HEARTBEAT_STALE_MS = 30_000;
/** How long a card stays highlighted after an event arrives over the stream. */
const FLASH_MS = 6000;

/** "about 12 minutes" / "under a minute" — for confirmation copy, not for the timer. */
function minutesLeftLabel(msLeft: number | null): string {
  if (msLeft === null) return "an unknown amount of time";
  const minutes = Math.round(msLeft / 60_000);
  if (minutes <= 0) return "under a minute";
  return `about ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/**
 * The live board (brief §10.5).
 *
 * The list is polled; individual events arrive over SSE, so a warning appears within a second
 * rather than at the next poll. The two together mean a dropped stream degrades to "a few seconds
 * late" rather than "silently stops working" — which for a monitoring screen matters more than
 * the latency does.
 *
 * ## What this screen is not
 *
 * It is not a camera feed. The thumbnails are **snapshots already captured with an integrity
 * event**, served from an auth-checked route, and each one is labelled with the event and the time
 * it belongs to. A grid of stills that updated on its own would read as surveillance-in-progress,
 * which is not what the system does, and would imply a freshness the data does not have.
 *
 * Cards rather than table rows: each attempt carries a countdown, two warning counters, a snapshot
 * and an event feed, and that is more than a row can hold without a horizontal scrollbar. This is
 * also the one screen where a pulsing dot is right — the thing being shown genuinely is live.
 */
export default function AdminLivePage() {
  useDocumentTitle("Live");
  const confirm = useConfirm();

  const [rows, setRows] = useState<LiveRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [flash, setFlash] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const sourceRef = useRef<EventSource | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await api.get<{ live: LiveRow[] }>("/api/admin/live");
      setRows(result.live);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not load the live view.");
    }
  }, []);

  useEffect(() => {
    void load();
    const poll = setInterval(() => void load(), 15_000);
    // A local clock so "time left" counts down between polls instead of jumping.
    const clock = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [load]);

  useEffect(() => {
    const source = new EventSource("/api/admin/live/stream");
    sourceRef.current = source;

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.addEventListener("integrity", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as { assessmentId: string };
      setFlash((current) => ({ ...current, [data.assessmentId]: Date.now() }));
      void load();
    });

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [load]);

  const act = async (row: LiveRow, action: "terminate" | "extend") => {
    // Ending a live assessment is destructive to the *learner*, not to the admin: it takes away the
    // rest of an hour they are sitting through right now. The wording says that rather than asking
    // an abstract "are you sure".
    const ok = await confirm(
      action === "terminate"
        ? {
            title: `End ${row.displayName}'s assessment now?`,
            body: `They are mid-question with ${minutesLeftLabel(row.msLeft)} left and ${row.answered} answer${
              row.answered === 1 ? "" : "s"
            } in. The test closes on them immediately, they cannot resume it, and everything still unanswered stays unanswered. What they have already answered is kept and still evaluated. Re-issuing the assessment is the only way back.`,
            confirmLabel: "End the assessment",
            variant: "destructive",
          }
        : {
            title: `Give ${row.displayName} ten more minutes?`,
            body: "The clock moves out by ten minutes for this attempt. They are not interrupted and are not told — the time left simply grows.",
            confirmLabel: "Add ten minutes",
          },
    );
    if (!ok) return;

    setBusy(row.assessmentId);
    try {
      await api.post(`/api/admin/assessments/${row.assessmentId}/${action}`);
      notify.success(
        action === "terminate"
          ? `Ended ${row.displayName}'s assessment.`
          : `Added ten minutes for ${row.displayName}.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "That didn't work.");
    } finally {
      setBusy(null);
    }
  };

  if (!rows) {
    return (
      <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading…
      </div>
    );
  }

  const flagged = rows.filter((r) => r.hardWarnings > 0).length;

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Live</h1>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {rows.length === 0
              ? "Nobody is taking an assessment right now."
              : `${rows.length} in progress${flagged > 0 ? `, ${flagged} carrying hard warnings` : ""}.`}
          </p>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 font-mono text-xs",
            connected ? "text-summit-strong" : "text-muted-foreground",
          )}
        >
          <Radio className={cn("h-3.5 w-3.5", connected && "animate-status-pulse")} aria-hidden="true" />
          {connected ? "live feed connected" : "reconnecting…"}
        </span>
      </div>

      {error && (
        <div className="mt-6">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed px-6 py-16 text-center">
          <Users className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-display font-semibold">Nothing live</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            This board fills as soon as someone starts their assessment. It updates on its own — there is nothing to
            refresh.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-5">
            <Link to="/admin/people">See everyone</Link>
          </Button>
        </div>
      ) : (
        <motion.ul
          variants={stagger(0.04)}
          initial="hidden"
          animate="visible"
          className="mt-8 grid gap-4 lg:grid-cols-2"
        >
          <AnimatePresence initial={false}>
            {rows.map((row) => (
              <LiveCard
                key={row.assessmentId}
                row={row}
                flashedAt={flash[row.assessmentId] ?? null}
                busy={busy === row.assessmentId}
                disabled={busy !== null}
                onAct={act}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}

function LiveCard({
  row,
  flashedAt,
  busy,
  disabled,
  onAct,
}: {
  row: LiveRow;
  flashedAt: number | null;
  busy: boolean;
  disabled: boolean;
  onAct: (row: LiveRow, action: "terminate" | "extend") => void | Promise<void>;
}) {
  const now = Date.now();
  const recentlyFlagged = flashedAt !== null && now - flashedAt < FLASH_MS;
  const secondsLeft = row.deadlineAt ? Math.max(0, Math.round((row.deadlineAt - now) / 1000)) : null;
  const totalSeconds = row.timeLimitMinutes !== null ? row.timeLimitMinutes * 60 : null;
  const heartbeatStale = row.lastHeartbeatAt !== null && now - row.lastHeartbeatAt > HEARTBEAT_STALE_MS;
  const live = row.status === "in_progress";
  // The newest snapshot we hold, which came with an event — not a camera frame.
  const lastSnapshot = row.recentEvents.find((e) => e.snapshotPath !== null) ?? null;

  return (
    <motion.li
      layout
      variants={fadeUp}
      exit={{ opacity: 0, scale: 0.98, transition: transition.exit }}
      transition={spring}
      className={cn(
        "rounded-lg border p-4 transition-colors duration-500",
        recentlyFlagged ? "border-destructive/60 bg-destructive/5" : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={row.displayName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/admin/people/${row.userId}`}
              className="truncate font-medium underline decoration-trailmark decoration-2 underline-offset-4"
            >
              {row.displayName}
            </Link>
            {live && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-summit-strong">
                <span className="size-1.5 rounded-full bg-summit animate-status-pulse" aria-hidden="true" />
                live
              </span>
            )}
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground">{row.username}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge kind="assessment" status={row.status} live={live} />
            {heartbeatStale && (
              <Badge variant="danger" className="gap-1">
                <HeartPulse className="size-3" aria-hidden="true" />
                no heartbeat for {Math.round((now - (row.lastHeartbeatAt ?? now)) / 1000)}s
              </Badge>
            )}
          </div>
        </div>

        {/* The countdown. Without the attempt's budget there is no fraction to draw, so it degrades
            to the number rather than drawing a ring against a guessed total. */}
        {secondsLeft !== null &&
          (totalSeconds !== null ? (
            <TimerRing secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
          ) : (
            <span className="shrink-0 font-mono text-sm tabular text-muted-foreground">
              {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
            </span>
          ))}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 rounded-md bg-surface-sunken/50 px-3 py-2.5">
        <Counter label="Answered" value={row.answered} />
        <Counter label="Hard" value={row.hardWarnings} suffix="/3" tone={row.hardWarnings > 0 ? "danger" : undefined} />
        <Counter label="Soft" value={row.softWarnings} />
      </dl>

      {lastSnapshot && (
        <div className="mt-4 flex items-start gap-3">
          <img
            src={`/api/admin/snapshots/${lastSnapshot.snapshotPath}`}
            alt={`Snapshot captured with a ${lastSnapshot.severity} ${lastSnapshot.type.replace(/_/g, " ")} event`}
            className="h-16 w-24 shrink-0 rounded-sm border object-cover"
            loading="lazy"
          />
          <p className="text-xs text-muted-foreground">
            Last snapshot, captured with a{" "}
            <span className="font-mono">{lastSnapshot.type.replace(/_/g, " ")}</span> event{" "}
            <span title={formatTimestamp(lastSnapshot.createdAt)}>{relativeTime(lastSnapshot.createdAt)}</span>. Not a
            live camera view.
          </p>
        </div>
      )}

      {row.recentEvents.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {row.recentEvents.map((event) => (
            <li key={event.id} className="flex items-center gap-2 text-xs">
              {/* This feed is live, so a hard warning is allowed to pulse here. The historical list
                  on the integrity tab passes no `live` and stays still. */}
              <StatusBadge kind="severity" status={event.severity} live={live} />
              <span className="truncate font-mono text-muted-foreground">
                {event.type.replace(/_/g, " ")}
                {!event.counted && " (not counted)"}
              </span>
              <span
                className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground"
                title={formatTimestamp(event.createdAt)}
              >
                {relativeTime(event.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3">
        {live && (
          <>
            <Button variant="outline" size="sm" loading={busy} disabled={disabled} onClick={() => void onAct(row, "extend")}>
              <TimerReset aria-hidden="true" />
              +10 min
            </Button>
            <Button
              variant="ghost"
              size="sm"
              loading={busy}
              disabled={disabled}
              onClick={() => void onAct(row, "terminate")}
              className="text-destructive hover:text-destructive"
            >
              <ShieldAlert aria-hidden="true" />
              End now
            </Button>
          </>
        )}
        <Button asChild variant="ghost" size="sm" className="ml-auto">
          <Link to={`/admin/assessments/${row.assessmentId}/integrity`}>All events</Link>
        </Button>
      </div>
    </motion.li>
  );
}

function Counter({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: "danger";
}) {
  return (
    <div>
      <dd className={cn("font-display text-lg leading-none font-semibold", tone === "danger" && "text-destructive")}>
        <AnimatedNumber value={value} />
        {suffix && <span className="text-xs font-normal text-muted-foreground">{suffix}</span>}
      </dd>
      <dt className="mt-1 text-[11px] text-muted-foreground">{label}</dt>
    </div>
  );
}
