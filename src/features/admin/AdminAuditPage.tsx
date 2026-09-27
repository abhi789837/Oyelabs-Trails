import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";

import { writeTableQuery, type PageMeta, type TableQuery } from "@shared/table";

import { api, ApiRequestError } from "@/api/client";
import {
  DataTable,
  conditionsForField,
  setFieldConditions,
  useTableQueryState,
  type TableFieldDef,
} from "@/components/data-table";
import { relativeTime } from "@/components/layout/notifications";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn, formatTimestamp } from "@/lib/utils";

interface AuditEntry {
  id: string;
  actorId: string | null;
  actorUsername: string | null;
  actorName: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: unknown;
  createdAt: number;
}

/**
 * The audit log (brief §13, last bullet).
 *
 * Deliberately a flat, dense table with no grouping and no charts: the question this page answers
 * is "who did what, and when" — anything that summarises it away is working against that.
 *
 * **Server-paged**, through `auditTableSpec`. It used to load the newest 200 and filter them in the
 * browser, which quietly answered a different question than the one being asked: "no results" meant
 * "not in the last 200", not "never happened", and there was no way to tell those apart.
 *
 * The action vocabulary is **not** a fixed list here. New actions get written by new code, and a
 * hardcoded facet would silently stop showing them. The families below are the stable part — the
 * prefix before the dot — and they filter with `startsWith`, so an action added tomorrow appears
 * under its family without this file changing.
 */
const FAMILIES: { id: string; label: string }[] = [
  { id: "user", label: "People" },
  { id: "assessment", label: "Assessments" },
  { id: "plan", label: "Plans" },
  { id: "ai", label: "AI" },
  { id: "auth", label: "Sign-in" },
];

export default function AdminAuditPage() {
  useDocumentTitle("Audit log");
  const me = useCurrentUser();
  const { query, setQuery } = useTableQueryState();

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [meta, setMeta] = useState<PageMeta | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (q: TableQuery, signal?: AbortSignal) => {
      setLoading(true);
      try {
        const search = writeTableQuery(q).toString();
        const result = await api.get<{ meta: PageMeta; entries: AuditEntry[] }>(
          `/api/admin/audit${search ? `?${search}` : ""}`,
          signal,
        );
        setEntries(result.entries);
        setMeta(result.meta);
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load the audit log.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(query, controller.signal);
    return () => controller.abort();
  }, [load, query]);

  const fields = useMemo<TableFieldDef<AuditEntry>[]>(
    () => [
      { name: "action", label: "Action", type: "string", searchable: true },
      { name: "targetId", label: "Target id", type: "string", searchable: true },
      {
        name: "targetType",
        label: "Target",
        type: "enum",
        quick: true,
        options: [
          { value: "user", label: "Person" },
          { value: "assessment", label: "Assessment" },
          { value: "plan", label: "Plan" },
          { value: "ai_credential", label: "AI credential" },
        ],
      },
      { name: "actorId", label: "Actor id", type: "string" },
      { name: "createdAt", label: "When", type: "date", quick: true },
    ],
    [],
  );

  const columns = useMemo<ColumnDef<AuditEntry, unknown>[]>(
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
        id: "actorId",
        header: "Actor",
        meta: { exportValue: (e) => e.actorUsername ?? "system" },
        cell: ({ row }) =>
          row.original.actorUsername ? (
            <>
              <span className="block">{row.original.actorName}</span>
              <span className="font-mono text-xs text-muted-foreground">{row.original.actorUsername}</span>
            </>
          ) : (
            // Not an omission: jobs and the boot-time seeder write entries with no actor.
            <span className="text-muted-foreground">system</span>
          ),
      },
      { id: "action", header: "Action", cell: ({ row }) => <span className="font-mono text-xs">{row.original.action}</span> },
      {
        id: "targetId",
        header: "Target",
        cell: ({ row }) =>
          row.original.targetId ? (
            <div className="font-mono text-xs text-muted-foreground">
              <span className="block">{row.original.targetType ?? "—"}</span>
              {row.original.targetType === "user" ? (
                <Link
                  to={`/admin/people/${row.original.targetId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="underline decoration-trailmark decoration-2 underline-offset-4"
                >
                  {row.original.targetId}
                </Link>
              ) : (
                <span>{row.original.targetId}</span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "details",
        header: "Details",
        enableSorting: false,
        meta: { field: "action", exportValue: (e) => describe(e.details) },
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-muted-foreground">{describe(row.original.details)}</span>
        ),
      },
    ],
    [],
  );

  /* The family chips write a `startsWith` on `action`, which the whitelist grants. They live beside
     the table rather than inside the toolbar because they are one field's shortcut, not a filter
     kind the kit knows about. */
  const activeFamily = useMemo(() => {
    const conditions = conditionsForField(query, "action");
    const prefix = conditions.find((c) => c.operator === "startsWith");
    return prefix && typeof prefix.value === "string" ? prefix.value.replace(/\.$/, "") : null;
  }, [query]);

  const setFamily = (family: string | null) =>
    setQuery(
      setFieldConditions(
        { ...query, page: 1 },
        "action",
        family === null ? [] : [{ field: "action", operator: "startsWith", value: `${family}.` }],
      ),
    );

  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold">Audit log</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Every admin action, newest first. Entries record what changed rather than the new value, so
        nothing here re-exposes a password or someone's notes.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <FamilyChip active={activeFamily === null} onClick={() => setFamily(null)}>
          Everything
        </FamilyChip>
        {FAMILIES.map((family) => (
          <FamilyChip key={family.id} active={activeFamily === family.id} onClick={() => setFamily(family.id)}>
            {family.label}
          </FamilyChip>
        ))}
      </div>

      <div className="mt-4">
        <DataTable
          data={entries}
          columns={columns}
          fields={fields}
          getRowId={(entry) => entry.id}
          query={query}
          onQueryChange={setQuery}
          mode="server"
          meta={meta}
          tableKey="admin.audit"
          accountId={me.id}
          loading={loading}
          error={error}
          onRetry={() => void load(query)}
          noun="entry"
          exportName="audit-log"
          searchPlaceholder="Search action or target id"
          caption="Every recorded admin action."
          emptyState={{
            title: "Nothing recorded yet",
            body: "Actions appear here as they happen — onboarding someone, approving an assessment, changing a credential.",
          }}
        />
      </div>
    </div>
  );
}

function FamilyChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
        active ? "border-foreground/30 bg-surface-sunken font-medium" : "border-dashed text-muted-foreground hover:bg-surface-sunken/60",
      )}
    >
      {children}
    </button>
  );
}

/** Flat `key: value` pairs read better in a dense row than pretty-printed JSON does. */
function describe(details: unknown): string {
  if (details === null || details === undefined) return "—";
  if (typeof details !== "object") return String(details);
  const entries = Object.entries(details as Record<string, unknown>);
  if (entries.length === 0) return "—";
  return entries.map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`).join(" · ");
}
