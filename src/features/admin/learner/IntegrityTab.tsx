import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Camera, LoaderCircle } from "lucide-react";

import type { AssessmentSummary } from "@shared/assessment";
import type { Severity } from "@shared/enums";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge, statusMeta } from "@/components/ui/status-badge";
import { fadeUp, stagger, transition } from "@/lib/motion";
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

type SeverityFilter = "all" | Severity;

/**
 * The integrity timeline for one assessment (brief §13, §10.5).
 *
 * A vertical timeline rather than a list of cards, because the question an admin brings here is
 * almost always about *sequence*: three flags spread over an hour and three in the same ninety
 * seconds mean different things, and a list of equal-sized cards flattens that difference away. The
 * rail shows the gaps.
 *
 * Shows every event, counted or not — an uncounted one still tells you something, and hiding it
 * would make the counted total look arbitrary. Snapshots load through the authenticated route, so
 * they are never reachable by URL alone, and the lightbox keeps them that way: it enlarges the same
 * authenticated request rather than opening the image in a tab.
 *
 * Both the learner tab and `/admin/assessments/:id/integrity` render this, so there is one
 * implementation of the timeline rather than two that drift.
 */
export function IntegrityTimeline({ assessmentId }: { assessmentId: string }) {
  const [data, setData] = useState<IntegrityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [type, setType] = useState<string>("all");
  const [lightbox, setLightbox] = useState<IntegrityEvent | null>(null);

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

  const types = useMemo(() => Object.keys(data?.summary.byType ?? {}).sort(), [data]);

  const visible = useMemo(() => {
    const events = data?.events ?? [];
    return events.filter((e) => (severity === "all" || e.severity === severity) && (type === "all" || e.type === type));
  }, [data, severity, type]);

  if (error) return <FormAlert>{error}</FormAlert>;

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading…
      </div>
    );
  }

  const filtered = severity !== "all" || type !== "all";

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
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Chip active={severity === "all"} onClick={() => setSeverity("all")}>
              All severities
            </Chip>
            <Chip active={severity === "hard"} onClick={() => setSeverity("hard")} tone="danger">
              Hard ({data.summary.hard})
            </Chip>
            <Chip active={severity === "soft"} onClick={() => setSeverity("soft")}>
              Soft ({data.summary.soft})
            </Chip>

            {types.length > 1 && (
              <label className="ml-auto flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="rounded-md border border-input bg-surface px-2 py-1.5 text-sm"
                >
                  <option value="all">Everything</option>
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")} ({data.summary.byType[t]})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
            {visible.length} of {data.events.length} shown
            {filtered && (
              <Button
                variant="link"
                size="sm"
                className="ml-1 h-auto p-0 align-baseline"
                onClick={() => {
                  setSeverity("all");
                  setType("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </p>

          {visible.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">Nothing matches those filters.</p>
          ) : (
            /* The rail is a left border on the list; each event hangs a dot on it. One element
               rather than a line per row, so the gaps between entries are genuinely continuous. */
            <motion.ol
              variants={stagger(0.03)}
              initial="hidden"
              animate="visible"
              className="mt-6 ml-2 space-y-4 border-l pl-6"
            >
              {visible.map((event, index) => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  previous={visible[index - 1] ?? null}
                  onOpenSnapshot={() => setLightbox(event)}
                />
              ))}
            </motion.ol>
          )}
        </>
      )}

      <SnapshotLightbox event={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

function TimelineEvent({
  event,
  previous,
  onOpenSnapshot,
}: {
  event: IntegrityEvent;
  previous: IntegrityEvent | null;
  onOpenSnapshot: () => void;
}) {
  const hard = event.counted && event.severity === "hard";
  // The gap since the event above, which is the whole reason this is a timeline.
  const gapSeconds = previous ? Math.round(Math.abs(event.createdAt - previous.createdAt) / 1000) : null;

  return (
    <motion.li variants={fadeUp} transition={transition.fast} className="relative">
      <span
        className={cn(
          "absolute -left-[1.9375rem] top-1.5 size-2.5 rounded-full border-2 border-background",
          hard ? "bg-destructive" : event.severity === "hard" ? "bg-destructive/50" : "bg-trailmark",
        )}
        aria-hidden="true"
      />

      {gapSeconds !== null && gapSeconds >= 60 && (
        <p className="mb-2 font-mono text-[11px] text-muted-foreground/70">
          {gapSeconds >= 3600
            ? `${Math.round(gapSeconds / 3600)}h later`
            : `${Math.round(gapSeconds / 60)} min later`}
        </p>
      )}

      <div className={cn("rounded-md border px-4 py-3", hard && "border-destructive/50 bg-destructive/4")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm">{event.type.replace(/_/g, " ")}</span>
          <StatusBadge kind="severity" status={event.severity} />
          {event.counted ? (
            <Badge variant="outline">counted</Badge>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">not counted</span>
          )}
          <span className="ml-auto font-mono text-xs text-muted-foreground" title={formatTimestamp(event.createdAt)}>
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
          <button
            type="button"
            onClick={onOpenSnapshot}
            className="group mt-3 flex items-center gap-3 rounded-md border p-1.5 text-left transition-colors hover:bg-surface-sunken/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
          >
            <img
              src={`/api/admin/snapshots/${event.snapshotPath}`}
              alt=""
              className="h-14 w-20 rounded-sm border object-cover"
              loading="lazy"
            />
            <span className="flex items-center gap-1.5 pr-2 text-xs text-muted-foreground group-hover:text-foreground">
              <Camera className="size-3.5" aria-hidden="true" />
              Enlarge the frame captured when this fired
            </span>
          </button>
        )}
      </div>
    </motion.li>
  );
}

/**
 * The enlarged snapshot.
 *
 * A dialog rather than a new tab: the image comes from an authenticated route, and sending someone
 * to it in a tab would present a proctoring photograph of a colleague as a standalone page with no
 * context, no timestamp and no reason attached to it.
 */
function SnapshotLightbox({ event, onClose }: { event: IntegrityEvent | null; onClose: () => void }) {
  return (
    <Dialog open={event !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        {event && (
          <>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
              <span className="font-mono">{event.type.replace(/_/g, " ")}</span>
              <StatusBadge kind="severity" status={event.severity} />
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {formatTimestamp(event.createdAt)}
              </span>
            </DialogTitle>
            <img
              src={`/api/admin/snapshots/${event.snapshotPath}`}
              alt={`Camera frame captured when ${event.type.replace(/_/g, " ")} fired`}
              className="mt-4 w-full rounded-md border"
            />
            <p className="mt-3 text-xs text-muted-foreground">
              One frame, captured at the moment the signal fired. It is not continuous footage, and the camera signal
              that produced it is probabilistic.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Chip({
  children,
  active,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
        active
          ? tone === "danger"
            ? "border-destructive bg-destructive/10 font-medium text-destructive"
            : "border-foreground/30 bg-surface-sunken font-medium"
          : "border-dashed text-muted-foreground hover:bg-surface-sunken/60",
      )}
    >
      {children}
    </button>
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
        <h2 className="border-b pb-4 font-display text-lg font-semibold">Integrity</h2>
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
          <h2 className="font-display text-lg font-semibold">Integrity</h2>
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
