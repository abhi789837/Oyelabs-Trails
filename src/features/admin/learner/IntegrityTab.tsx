import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

import type { AssessmentSummary } from "@shared/assessment";
import type { Severity } from "@shared/enums";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, statusMeta } from "@/components/ui/status-badge";
import { cn, formatTimestamp } from "@/lib/utils";

interface IntegrityEvent {
  id: string;
  type: string;
  severity: Severity;
  counted: boolean;
  details: Record<string, unknown> | null;
  snapshotPath: string | null;
  clientTs: number | null;
  createdAt: number;
}

interface IntegrityResponse {
  summary: { byType: Record<string, number>; hard: number; soft: number };
  events: IntegrityEvent[];
}

/** Statuses that mean the proctor actually ran, so there could be events to show. */
const PROCTORED = ["in_progress", "submitted", "evaluating", "completed", "terminated"];

/**
 * The integrity timeline for one assessment (brief §13, §10.5).
 *
 * Shows every event, counted or not — an uncounted one still tells you something, and hiding it
 * would make the counted total look arbitrary. Snapshots load through the authenticated route, so
 * they are never reachable by URL alone.
 *
 * Both the learner tab and `/admin/assessments/:id/integrity` render this, so there is one
 * implementation of the timeline rather than two that drift.
 */
export function IntegrityTimeline({ assessmentId }: { assessmentId: string }) {
  const [data, setData] = useState<IntegrityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    api
      .get<IntegrityResponse>(`/api/admin/assessments/${assessmentId}/integrity`)
      .then((result) => !cancelled && setData(result))
      .catch(
        (err) => !cancelled && setError(err instanceof ApiRequestError ? err.message : "Could not load the events."),
      );
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  if (error) return <FormAlert>{error}</FormAlert>;

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <p className="font-mono text-sm text-muted-foreground">
        {data.summary.hard} hard · {data.summary.soft} soft · {data.events.length} recorded
      </p>

      <p className="mt-4 max-w-prose text-sm text-muted-foreground">
        A browser cannot block an OS screenshot, screen sharing, or a second device out of frame.
        These are the traces it can see, and camera signals are probabilistic — lighting, glasses
        and camera angle all cause false positives. Treat a flag as evidence to weigh, not a verdict.
      </p>

      {data.events.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Nothing was recorded during this assessment.</p>
      ) : (
        <ol className="mt-8 space-y-3">
          {data.events.map((event) => (
            <li
              key={event.id}
              className={cn(
                "rounded-md border px-4 py-3",
                event.counted && event.severity === "hard" && "border-destructive/50 bg-destructive/4",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm">{event.type}</span>
                <StatusBadge kind="severity" status={event.severity} />
                {event.counted ? (
                  <Badge variant="outline">counted</Badge>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">not counted</span>
                )}
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {new Date(event.createdAt).toLocaleTimeString()}
                </span>
              </div>

              {event.details && Object.keys(event.details).length > 0 && (
                <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                  {Object.entries(event.details)
                    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                    .join(" · ")}
                </p>
              )}

              {event.snapshotPath && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setOpen(open === event.id ? null : event.id)}
                    className="rounded-md border px-2.5 py-1 text-xs hover:bg-surface-sunken/60"
                  >
                    {open === event.id ? "Hide snapshot" : "Show snapshot"}
                  </button>
                  {open === event.id && (
                    <img
                      src={`/api/admin/snapshots/${event.snapshotPath}`}
                      alt={`Camera frame captured when ${event.type} fired`}
                      className="mt-2 max-w-sm rounded-md border"
                      loading="lazy"
                    />
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * The learner-detail version: the same timeline, plus an attempt picker when someone has sat more
 * than one assessment.
 */
export function IntegrityTab({ assessments }: { assessments: AssessmentSummary[] }) {
  const proctored = assessments.filter((a) => PROCTORED.includes(a.status));
  const [selected, setSelected] = useState<string | null>(null);
  const current = proctored.find((a) => a.id === selected) ?? proctored[0];

  if (!current) {
    return (
      <section aria-label="Integrity">
        <h2 className="border-b pb-4 text-lg font-semibold">Integrity</h2>
        <p className="mt-6 text-sm text-muted-foreground">
          Nothing to show yet. Events are recorded while an assessment is being taken.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Integrity">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-lg font-semibold">Integrity</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Attempt {current.attemptNo}, {statusMeta("assessment", current.status).label.toLowerCase()} ·{" "}
            {formatTimestamp(current.startedAt ?? current.createdAt)}
          </p>
        </div>
        {proctored.length > 1 && (
          <label className="flex items-center gap-2 text-sm">
            Attempt
            <select
              value={current.id}
              onChange={(e) => setSelected(e.target.value)}
              className="rounded-md border border-input bg-surface px-2 py-1.5 text-sm"
            >
              {proctored.map((attempt) => (
                <option key={attempt.id} value={attempt.id}>
                  {attempt.attemptNo} — {formatTimestamp(attempt.createdAt)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-6">
        <IntegrityTimeline assessmentId={current.id} />
      </div>
    </section>
  );
}
