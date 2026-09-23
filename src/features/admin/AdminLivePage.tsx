import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, LoaderCircle, Radio, ShieldAlert, TimerReset } from "lucide-react";
import { Link } from "react-router-dom";

import type { Severity } from "@shared/enums";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/utils";

interface LiveRow {
  assessmentId: string;
  userId: string;
  displayName: string;
  username: string;
  status: string;
  answered: number;
  startedAt: number | null;
  deadlineAt: number | null;
  msLeft: number | null;
  hardWarnings: number;
  softWarnings: number;
  lastHeartbeatAt: number | null;
  recentEvents: { id: string; type: string; severity: Severity; counted: boolean; createdAt: number; snapshotPath: string | null }[];
}

/**
 * The live board (brief §10.5).
 *
 * The list is polled; individual events arrive over SSE, so a warning appears within a second
 * rather than at the next poll. The two together mean a dropped stream degrades to "a few seconds
 * late" rather than "silently stops working" — which for a monitoring screen matters more than
 * the latency does.
 */
export default function AdminLivePage() {
  useDocumentTitle("Live");

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

  const act = async (assessmentId: string, action: "terminate" | "extend") => {
    const confirmText =
      action === "terminate"
        ? "End this assessment now? Their answers are kept and still evaluated."
        : "Add ten minutes to this assessment?";
    if (!window.confirm(confirmText)) return;

    setBusy(assessmentId);
    try {
      await api.post(`/api/admin/assessments/${assessmentId}/${action}`);
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

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Live</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length === 0 ? "Nobody is taking an assessment right now." : `${rows.length} in progress.`}
          </p>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 font-mono text-xs",
            connected ? "text-summit-strong" : "text-muted-foreground",
          )}
        >
          <Radio className="h-3.5 w-3.5" aria-hidden="true" />
          {connected ? "live feed connected" : "reconnecting…"}
        </span>
      </div>

      {error && <div className="mt-6"><FormAlert>{error}</FormAlert></div>}

      <ul className="mt-8 space-y-4">
        {rows.map((row) => {
          const recentlyFlagged = flash[row.assessmentId] && Date.now() - flash[row.assessmentId] < 6000;
          const msLeft = row.deadlineAt ? Math.max(0, row.deadlineAt - Date.now()) : null;
          const heartbeatStale = row.lastHeartbeatAt !== null && Date.now() - row.lastHeartbeatAt > 30_000;

          return (
            <li
              key={row.assessmentId}
              className={cn(
                "rounded-md border px-4 py-3 transition-colors",
                recentlyFlagged && "border-destructive/60 bg-destructive/[0.05]",
              )}
            >
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={`/admin/people/${row.userId}`}
                  className="font-medium underline decoration-trailmark decoration-2 underline-offset-4"
                >
                  {row.displayName}
                </Link>
                <span className="font-mono text-xs text-muted-foreground">{row.username}</span>
                <Badge variant="outline">{row.status.replace("_", " ")}</Badge>

                <span className="font-mono text-xs text-muted-foreground tabular">{row.answered} answered</span>

                {msLeft !== null && (
                  <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground tabular">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {formatClock(Math.round(msLeft / 1000))}
                  </span>
                )}

                <span
                  className={cn(
                    "flex items-center gap-1 font-mono text-xs tabular",
                    row.hardWarnings > 0 ? "font-medium text-destructive" : "text-muted-foreground",
                  )}
                >
                  <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                  {row.hardWarnings}/3 hard · {row.softWarnings} soft
                </span>

                {heartbeatStale && (
                  <Badge variant="outline" className="border-destructive/50 text-destructive">
                    no heartbeat
                  </Badge>
                )}

                <div className="ml-auto flex gap-1.5">
                  {row.status === "in_progress" && (
                    <>
                      <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => void act(row.assessmentId, "extend")}>
                        <TimerReset aria-hidden="true" />
                        +10 min
                      </Button>
                      <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => void act(row.assessmentId, "terminate")}>
                        End
                      </Button>
                    </>
                  )}
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/admin/assessments/${row.assessmentId}/integrity`}>Events</Link>
                  </Button>
                </div>
              </div>

              {row.recentEvents.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {row.recentEvents.map((event) => (
                    <li
                      key={event.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-2 py-1 font-mono text-[11px]",
                        event.severity === "hard" ? "border-destructive/40 text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {event.snapshotPath && (
                        <img
                          src={`/api/admin/snapshots/${event.snapshotPath}`}
                          alt=""
                          className="h-8 w-10 rounded-sm object-cover"
                          loading="lazy"
                        />
                      )}
                      <span>
                        {event.type}
                        {!event.counted && " (not counted)"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatClock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}
