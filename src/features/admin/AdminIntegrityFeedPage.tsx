import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";

import type { Severity } from "@shared/enums";
import { writeTableQuery, type PageMeta, type TableQuery } from "@shared/table";

import { api, ApiRequestError } from "@/api/client";
import { DataTable, useTableQueryState, type TableFieldDef } from "@/components/data-table";
import { relativeTime } from "@/components/layout/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatTimestamp } from "@/lib/utils";

interface FeedEvent {
  id: string;
  assessmentId: string;
  userId: string;
  displayName: string;
  username: string;
  type: string;
  severity: Severity;
  counted: boolean;
  details: Record<string, unknown> | null;
  snapshotPath: string | null;
  createdAt: number;
}

/**
 * Every integrity event, across every learner and every attempt.
 *
 * A different question from the per-assessment timeline at
 * `/admin/assessments/:id/integrity`, which is why it is a different screen rather than a filter on
 * that one. The timeline asks "what happened during this sitting" and answers it with sequence and
 * spacing; this asks "is this happening" and answers it with counts across time, which is a table.
 *
 * Server-paged through `integrityEventsTableSpec`. `snapshotPath` is rendered but is deliberately
 * not filterable — the whitelist leaves it out so this cannot become a way to enumerate the
 * snapshot directory.
 */
export default function AdminIntegrityFeedPage() {
  useDocumentTitle("Integrity events");
  const me = useCurrentUser();
  const { query, setQuery } = useTableQueryState();

  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [meta, setMeta] = useState<PageMeta | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: TableQuery, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const search = writeTableQuery(q).toString();
      const result = await api.get<{ meta: PageMeta; events: FeedEvent[] }>(
        `/api/admin/integrity/events${search ? `?${search}` : ""}`,
        signal,
      );
      setEvents(result.events);
      setMeta(result.meta);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof ApiRequestError ? err.message : "Could not load the events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(query, controller.signal);
    return () => controller.abort();
  }, [load, query]);

  const fields = useMemo<TableFieldDef<FeedEvent>[]>(
    () => [
      { name: "type", label: "Type", type: "string", searchable: true },
      {
        name: "severity",
        label: "Severity",
        type: "enum",
        quick: true,
        options: [
          { value: "hard", label: "Hard" },
          { value: "soft", label: "Soft" },
        ],
      },
      {
        name: "counted",
        label: "Counted",
        type: "boolean",
        quick: true,
        trueLabel: "Counted against them",
        falseLabel: "Recorded only",
      },
      { name: "userId", label: "Learner id", type: "string" },
      { name: "assessmentId", label: "Assessment id", type: "string" },
      { name: "createdAt", label: "When", type: "date", quick: true },
    ],
    [],
  );

  const columns = useMemo<ColumnDef<FeedEvent, unknown>[]>(
    () => [
      {
        id: "createdAt",
        header: "When",
        cell: ({ row }) => (
          <span
            className="whitespace-nowrap font-mono text-xs text-muted-foreground"
            title={formatTimestamp(row.original.createdAt)}
          >
            {relativeTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "userId",
        header: "Learner",
        meta: { exportValue: (e) => e.username },
        cell: ({ row }) => (
          <Link
            to={`/admin/people/${row.original.userId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm underline decoration-trailmark decoration-2 underline-offset-4"
          >
            {row.original.displayName}
          </Link>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.type.replace(/_/g, " ")}</span>,
      },
      {
        id: "severity",
        header: "Severity",
        cell: ({ row }) => <StatusBadge kind="severity" status={row.original.severity} />,
      },
      {
        id: "counted",
        header: "Counted",
        cell: ({ row }) =>
          row.original.counted ? (
            <Badge variant="outline">counted</Badge>
          ) : (
            // An uncounted event still happened. It is shown, not hidden, or the counted total
            // would look arbitrary.
            <span className="font-mono text-xs text-muted-foreground">recorded only</span>
          ),
      },
      {
        id: "snapshotPath",
        header: "Snapshot",
        enableSorting: false,
        meta: { field: "type", exportValue: () => "" },
        cell: ({ row }) =>
          row.original.snapshotPath ? (
            <img
              src={`/api/admin/snapshots/${row.original.snapshotPath}`}
              alt=""
              className="h-8 w-12 rounded-sm border object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    [],
  );

  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold">Integrity events</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Every proctoring signal recorded, across everyone. Camera signals are probabilistic —
        lighting, glasses and camera angle all cause false positives — so a flag is evidence to
        weigh rather than a verdict. For one sitting in sequence, open that assessment's timeline.
      </p>

      <div className="mt-6">
        <DataTable
          data={events}
          columns={columns}
          fields={fields}
          getRowId={(event) => event.id}
          query={query}
          onQueryChange={setQuery}
          mode="server"
          meta={meta}
          tableKey="admin.integrity"
          accountId={me.id}
          loading={loading}
          error={error}
          onRetry={() => void load(query)}
          noun="event"
          exportName="integrity-events"
          searchPlaceholder="Search event type"
          caption="Every proctoring event recorded by this deployment."
          emptyState={{
            title: "Nothing recorded",
            body: "Events appear here while assessments are being taken. An empty table is the good outcome.",
          }}
          renderDetail={(event) => <EventDetail event={event} />}
          detailTitle={(event) => event.type.replace(/_/g, " ")}
          detailSubtitle={(event) => <span className="font-mono text-xs">{event.username}</span>}
          detailFooter={(event) => (
            <Button asChild variant="outline">
              <Link to={`/admin/assessments/${event.assessmentId}/integrity`}>Open the full timeline</Link>
            </Button>
          )}
        />
      </div>
    </div>
  );
}

function EventDetail({ event }: { event: FeedEvent }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge kind="severity" status={event.severity} />
        {event.counted ? (
          <Badge variant="outline">counted against them</Badge>
        ) : (
          <Badge variant="outline">recorded only</Badge>
        )}
        <span className="font-mono text-xs text-muted-foreground">{formatTimestamp(event.createdAt)}</span>
      </div>

      {event.snapshotPath && (
        <div>
          <img
            src={`/api/admin/snapshots/${event.snapshotPath}`}
            alt={`Camera frame captured when ${event.type.replace(/_/g, " ")} fired`}
            className="w-full rounded-md border"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            One frame, captured at the moment the signal fired. Not continuous footage.
          </p>
        </div>
      )}

      {event.details && Object.keys(event.details).length > 0 && (
        <div>
          <p className="font-mono text-xs text-muted-foreground">What the detector reported</p>
          <ul className="mt-1 space-y-0.5 font-mono text-xs">
            {Object.entries(event.details).map(([key, value]) => (
              <li key={key}>
                <span className="text-muted-foreground">{key}: </span>
                {JSON.stringify(value)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p>
        <Link
          to={`/admin/people/${event.userId}`}
          className="underline decoration-trailmark decoration-2 underline-offset-4"
        >
          {event.displayName}
        </Link>{" "}
        <span className="text-muted-foreground">was taking the assessment at the time.</span>
      </p>
    </div>
  );
}
