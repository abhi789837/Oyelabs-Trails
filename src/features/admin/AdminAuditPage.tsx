import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Input } from "@/components/ui/input";
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
 * is "who did what, and when" — anything that summarises it away is working against that. The
 * newest 200 entries, because this is a recent-activity view rather than an archive.
 */
export default function AdminAuditPage() {
  useDocumentTitle("Audit log");

  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<{ entries: AuditEntry[] }>("/api/admin/audit", controller.signal)
      .then((result) => setEntries(result.entries))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load the audit log.");
      });
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    if (!entries) return null;
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (entry) =>
        entry.action.toLowerCase().includes(q) ||
        (entry.actorUsername ?? "").toLowerCase().includes(q) ||
        (entry.actorName ?? "").toLowerCase().includes(q) ||
        (entry.targetType ?? "").toLowerCase().includes(q) ||
        (entry.targetId ?? "").toLowerCase().includes(q),
    );
  }, [entries, query]);

  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Audit log</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Every admin action, newest first. Entries record what changed rather than the new value, so
        nothing here re-exposes a password or someone's notes.
      </p>

      {error && (
        <div className="mt-6">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery("")}
        leading={<Search />}
        placeholder="Search action, actor or target"
        aria-label="Search the audit log"
        containerClassName="mt-6 max-w-xs"
      />

      {!filtered ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading the log…
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          {query ? "Nothing matches that search." : "Nothing has been recorded yet."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-md border">
          <table className="w-full min-w-240 border-collapse text-sm">
            <thead>
              <tr className="border-b bg-surface-sunken/50 text-left">
                <Th className="w-44">Time</Th>
                <Th className="w-48">Actor</Th>
                <Th className="w-56">Action</Th>
                <Th className="w-64">Target</Th>
                <Th>Details</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0 align-top hover:bg-surface-sunken/30">
                  <Td className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {formatTimestamp(entry.createdAt)}
                  </Td>
                  <Td>
                    {entry.actorUsername ? (
                      <>
                        <span className="block">{entry.actorName}</span>
                        <span className="font-mono text-xs text-muted-foreground">{entry.actorUsername}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">system</span>
                    )}
                  </Td>
                  <Td className="font-mono text-xs">{entry.action}</Td>
                  <Td className="font-mono text-xs text-muted-foreground">
                    {entry.targetId ? (
                      <>
                        <span className="block">{entry.targetType ?? "—"}</span>
                        {entry.targetType === "user" ? (
                          <Link
                            to={`/admin/people/${entry.targetId}`}
                            className="underline decoration-trailmark decoration-2 underline-offset-4"
                          >
                            {entry.targetId}
                          </Link>
                        ) : (
                          <span>{entry.targetId}</span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td className="font-mono text-[11px] text-muted-foreground">{describe(entry.details)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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

// Sentence case, not the usual ALL-CAPS table header: the design system rules that out.
function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={cn("px-3 py-2 text-xs font-semibold text-muted-foreground", className)}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-3 align-top", className)}>{children}</td>;
}
