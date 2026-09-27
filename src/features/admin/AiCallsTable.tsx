import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";

import { PROVIDER_COPY } from "@shared/ai";
import { selectableProviderIds } from "@shared/enums";
import { writeTableQuery, type PageMeta, type TableQuery } from "@shared/table";

import { api, ApiRequestError } from "@/api/client";
import { DataTable, useTableQueryState, type TableFieldDef } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/utils";

/** One row of `/api/admin/ai/calls`. No prompt, no response, no credential — see the route. */
interface AiCall {
  id: string;
  provider: string;
  model: string;
  purpose: string;
  subjectUserId: string | null;
  subjectName: string | null;
  subjectUsername: string | null;
  assessmentId: string | null;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number | null;
  ok: boolean;
  error: string | null;
  createdAt: number;
}

/**
 * Every provider call, server-paged through `aiCallsTableSpec`.
 *
 * The seven-day aggregate on the AI page answers "what is this costing"; this answers "what
 * happened at 14:02". One generation writes a dozen rows or more, so it pages on the server — the
 * browser never holds the whole table, and "no results" means no results rather than "not in the
 * newest fifty".
 *
 * Nothing in a row can leak a secret: `ai_calls` stores the provider, the model, token counts and
 * an already-redacted error string. The prompt and the response are never written to it at all.
 */
export function AiCallsTable() {
  const { query, setQuery } = useTableQueryState();
  const [calls, setCalls] = useState<AiCall[]>([]);
  const [meta, setMeta] = useState<PageMeta | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: TableQuery, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const search = writeTableQuery(q).toString();
      const result = await api.get<{ meta: PageMeta; calls: AiCall[] }>(
        `/api/admin/ai/calls${search ? `?${search}` : ""}`,
        signal,
      );
      setCalls(result.calls);
      setMeta(result.meta);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof ApiRequestError ? err.message : "Could not load the call log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(query, controller.signal);
    return () => controller.abort();
  }, [load, query]);

  const fields = useMemo<TableFieldDef<AiCall>[]>(
    () => [
      {
        name: "purpose",
        label: "Purpose",
        type: "enum",
        quick: true,
        options: [
          { value: "blueprint", label: "Blueprint" },
          { value: "items", label: "Items" },
          { value: "critic", label: "Critic" },
          { value: "grade", label: "Grade" },
          { value: "evaluation", label: "Evaluation" },
          { value: "verify", label: "Verify" },
        ],
      },
      {
        name: "provider",
        label: "Provider",
        type: "enum",
        quick: true,
        options: selectableProviderIds.map((id) => ({ value: id, label: PROVIDER_COPY[id]?.name ?? id })),
      },
      { name: "model", label: "Model", type: "string", searchable: true },
      { name: "ok", label: "Result", type: "boolean", quick: true, trueLabel: "Succeeded", falseLabel: "Failed" },
      { name: "error", label: "Error", type: "string", searchable: true },
      // Filterable by id, not by name: a display name is not unique and an id is.
      { name: "subjectUserId", label: "Learner id", type: "string" },
      { name: "assessmentId", label: "Assessment id", type: "string" },
      { name: "inputTokens", label: "Input tokens", type: "number", min: 0, max: 200_000 },
      { name: "outputTokens", label: "Output tokens", type: "number", min: 0, max: 64_000 },
      { name: "latencyMs", label: "Latency", type: "number", min: 0, max: 900_000, unit: "ms" },
      { name: "createdAt", label: "When", type: "date", quick: true },
    ],
    [],
  );

  const columns = useMemo<ColumnDef<AiCall, unknown>[]>(
    () => [
      {
        id: "createdAt",
        header: "When",
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
            {formatTimestamp(row.original.createdAt)}
          </span>
        ),
      },
      { id: "purpose", header: "Purpose", cell: ({ row }) => <span className="text-sm">{row.original.purpose}</span> },
      {
        id: "model",
        header: "Model",
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            <span className="block">{row.original.model}</span>
            <span className="text-muted-foreground">{row.original.provider}</span>
          </div>
        ),
      },
      {
        id: "subjectUserId",
        header: "Learner",
        meta: { exportValue: (c) => c.subjectUsername ?? "" },
        cell: ({ row }) =>
          row.original.subjectUserId ? (
            <Link
              to={`/admin/people/${row.original.subjectUserId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm underline decoration-trailmark decoration-2 underline-offset-4"
            >
              {row.original.subjectName ?? row.original.subjectUsername}
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "inputTokens",
        header: "Tokens",
        meta: { align: "right", exportValue: (c) => c.inputTokens + c.outputTokens },
        cell: ({ row }) => (
          <span className="tabular text-xs">
            {(row.original.inputTokens + row.original.outputTokens).toLocaleString()}
          </span>
        ),
      },
      {
        id: "latencyMs",
        header: "Latency",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="tabular text-xs text-muted-foreground">
            {row.original.latencyMs === null ? "—" : `${(row.original.latencyMs / 1000).toFixed(1)}s`}
          </span>
        ),
      },
      {
        id: "ok",
        header: "Result",
        cell: ({ row }) =>
          row.original.ok ? (
            <Badge variant="success">ok</Badge>
          ) : (
            <Badge variant="danger" title={row.original.error ?? undefined}>
              failed
            </Badge>
          ),
      },
    ],
    [],
  );

  return (
    <section className="mt-12" aria-labelledby="calls-heading">
      <h2 id="calls-heading" className="font-display text-lg font-semibold">
        Every call
      </h2>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        One row per provider request. Prompts and responses are never stored, so what is here is the
        metadata: which model, how many tokens, how long, and the redacted error if it failed.
      </p>

      <div className="mt-4">
        <DataTable
          data={calls}
          columns={columns}
          fields={fields}
          getRowId={(call) => call.id}
          query={query}
          onQueryChange={setQuery}
          mode="server"
          meta={meta}
          tableKey="admin.ai.calls"
          loading={loading}
          error={error}
          onRetry={() => void load(query)}
          noun="call"
          exportName="ai-calls"
          searchPlaceholder="Search model or error"
          caption="Every AI provider call this deployment has made."
          emptyState={{
            title: "No calls yet",
            body: "Rows appear here as soon as an assessment is generated or evaluated.",
          }}
          renderDetail={(call) => <CallDetail call={call} />}
          detailTitle={(call) => call.purpose}
          detailSubtitle={(call) => <span className="font-mono text-xs">{call.model}</span>}
        />
      </div>
    </section>
  );
}

function CallDetail({ call }: { call: AiCall }) {
  return (
    <div className="space-y-4 text-sm">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Detail label="Provider">{call.provider}</Detail>
        <Detail label="Model">
          <span className="font-mono text-xs">{call.model}</span>
        </Detail>
        <Detail label="Input tokens">{call.inputTokens.toLocaleString()}</Detail>
        <Detail label="Output tokens">{call.outputTokens.toLocaleString()}</Detail>
        <Detail label="Latency">{call.latencyMs === null ? "—" : `${(call.latencyMs / 1000).toFixed(2)}s`}</Detail>
        <Detail label="When">{formatTimestamp(call.createdAt)}</Detail>
      </dl>

      {call.subjectUserId && (
        <p>
          <Link
            to={`/admin/people/${call.subjectUserId}`}
            className="underline decoration-trailmark decoration-2 underline-offset-4"
          >
            {call.subjectName ?? call.subjectUsername}
          </Link>{" "}
          <span className="text-muted-foreground">was the subject of this call.</span>
        </p>
      )}

      {call.error && (
        <div>
          <p className="font-mono text-xs text-muted-foreground">Error, as recorded</p>
          <pre className="mt-1 overflow-x-auto rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 font-mono text-xs whitespace-pre-wrap">
            {call.error}
          </pre>
          <p className="mt-1 text-xs text-muted-foreground">
            Already redacted on the way in — the AI layer strips anything that looks like a key before it writes here.
          </p>
        </div>
      )}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
