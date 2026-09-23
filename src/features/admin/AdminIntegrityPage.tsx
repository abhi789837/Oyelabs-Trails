import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import type { Severity } from "@shared/enums";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/utils";

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

/**
 * The integrity timeline for one assessment (brief §13, §10.5).
 *
 * Shows every event, counted or not — an uncounted one still tells you something, and hiding it
 * would make the counted total look arbitrary. Snapshots load through the authenticated route, so
 * they are never reachable by URL alone.
 */
export default function AdminIntegrityPage() {
  const { assessmentId = "" } = useParams();
  const [data, setData] = useState<IntegrityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useDocumentTitle("Integrity");

  useEffect(() => {
    let cancelled = false;
    api
      .get<IntegrityResponse>(`/api/admin/assessments/${assessmentId}/integrity`)
      .then((result) => !cancelled && setData(result))
      .catch((err) => !cancelled && setError(err instanceof ApiRequestError ? err.message : "Could not load the events."));
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  if (error) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <FormAlert>{error}</FormAlert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-4xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin">
          <ArrowLeft aria-hidden="true" />
          People
        </Link>
      </Button>

      <h1 className="mt-4 text-2xl font-bold">Integrity events</h1>
      <p className="mt-1 font-mono text-sm text-muted-foreground">
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
                event.counted && event.severity === "hard" && "border-destructive/50 bg-destructive/[0.04]",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm">{event.type}</span>
                <Badge variant="outline" className={event.severity === "hard" ? "border-destructive/50 text-destructive" : ""}>
                  {event.severity}
                </Badge>
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
