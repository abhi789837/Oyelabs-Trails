import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import { api, ApiRequestError } from "@/api/client";
import { Input } from "@/components/ui/input";
import { SopCard } from "@/features/curriculum/SopBlocks";
import { findTopic, topicPath } from "@/content";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type { SopListRow } from "@shared/sop";

/**
 * v4.1: every `[Oyelabs SOP – admin to fill]` block in the curriculum, in one place, so the company's
 * own procedures (Keka policy, meeting and email templates, SLAs) can be written once.
 */
export default function AdminSopPage() {
  useDocumentTitle("Company SOPs");
  const [rows, setRows] = useState<SopListRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [show, setShow] = useState<"all" | "todo" | "done">("all");

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<{ rows: SopListRow[] }>("/api/admin/sop", controller.signal)
      .then((res) => setRows(res.rows))
      .catch((e) => {
        if (!controller.signal.aborted) setError(e instanceof ApiRequestError ? e.message : "The SOP list couldn't be loaded.");
      });
    return () => controller.abort();
  }, []);

  const byModule = useMemo(() => {
    const groups = new Map<string, SopListRow[]>();
    const needle = q.trim().toLowerCase();
    const visible = (rows ?? []).filter(
      (r) =>
        (show === "all" || (show === "todo" ? !r.body : Boolean(r.body))) &&
        (!needle || `${r.title} ${r.topicTitle} ${r.prompt} ${r.body ?? ""}`.toLowerCase().includes(needle)),
    );
    for (const row of visible) groups.set(row.moduleId, [...(groups.get(row.moduleId) ?? []), row]);
    return [...groups.entries()];
  }, [rows, q, show]);
  const toFill = rows?.filter((r) => !r.body).length ?? 0;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Company SOPs</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Our own procedures, written once; learners see them on the topic.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onClear={() => setQ("")}
          leading={<Search aria-hidden="true" />}
          placeholder="Search SOPs or topics"
          aria-label="Search SOPs or topics"
          containerClassName="w-full sm:max-w-xs"
        />
        <select
          aria-label="Show"
          value={show}
          onChange={(e) => setShow(e.target.value as "all" | "todo" | "done")}
          className="h-10 rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
        >
          <option value="all">All blocks</option>
          <option value="todo">Still to fill</option>
          <option value="done">Filled</option>
        </select>
      </div>
      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}
      {rows && (
        <p className="mt-4 text-sm">
          {toFill === 0 ? "Every SOP block is filled." : `${toFill} of ${rows.length} blocks still to fill.`}
        </p>
      )}
      {rows && byModule.length === 0 && <p className="mt-6 text-sm text-muted-foreground">Nothing matches those filters.</p>}
      {byModule.map(([moduleId, list]) => {
        const moduleName = findTopic(list[0].topicId)?.module.name ?? moduleId;
        return (
          <section key={moduleId} className="mt-8" aria-label={moduleName}>
            <h2 className="text-lg font-semibold">{moduleName}</h2>
            <div className="mt-3 space-y-4">
              {list.map((row) => {
                const found = findTopic(row.topicId);
                return (
                  <div key={`${row.topicId}-${row.index}`}>
                    <p className="mb-1 text-xs text-muted-foreground">
                      Topic:{" "}
                      {found ? (
                        <Link className="underline underline-offset-4" to={topicPath(found.topic)}>
                          {row.topicTitle}
                        </Link>
                      ) : (
                        row.topicTitle
                      )}
                    </p>
                    <SopCard
                      topicId={row.topicId}
                      block={row}
                      canEdit
                      onSaved={(next) => setRows((all) => all?.map((r) => (r.topicId === row.topicId && r.index === next.index ? { ...r, ...next } : r)) ?? null)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
