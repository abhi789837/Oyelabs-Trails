import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Pencil, Plus, Search } from "lucide-react";

import {
  HANDBOOK_KINDS,
  HANDBOOK_STATUS_LABELS,
  PROJECT_TYPES,
  TERM_CATEGORIES,
  TERM_CATEGORY_LABELS,
  type HandbookEntry,
  type HandbookKind,
  type HandbookStatus,
} from "@shared/handbook";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { resetGlossary } from "@/features/handbook/useGlossary";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { handbookApi } from "./api";
import { EntrySheet, KIND_LABELS, type SavedResult } from "./EntrySheet";

const statusOf = (e: HandbookEntry) => e.data.status as HandbookStatus;
const nameOf = (e: HandbookEntry) => String(e.data.name ?? e.id);

/** The one line under an entry's name in the list. */
function summaryOf(e: HandbookEntry): string {
  const d = e.data as Record<string, unknown>;
  return String(d.definition ?? d.statement ?? d.purpose ?? "");
}

function metaOf(e: HandbookEntry): string[] {
  const d = e.data as Record<string, unknown>;
  const out: string[] = [];
  if (typeof d.category === "string") out.push(TERM_CATEGORY_LABELS[d.category as keyof typeof TERM_CATEGORY_LABELS] ?? d.category);
  if (typeof d.projectType === "string") out.push(`${d.projectType === "whitelabel" ? "White-label" : "Custom"} · stage ${String(d.order)}`);
  if (Array.isArray(d.projectTypes)) out.push((d.projectTypes as string[]).map((p) => (p === "whitelabel" ? "White-label" : "Custom")).join(", "));
  if (typeof d.format === "string") out.push(`.${d.format}${e.hasUpload ? " (uploaded)" : ""}`);
  return out;
}

function savedMessage(result: SavedResult, confirmed: boolean): { title: string; description?: string } {
  const n = result.revalidating ?? 0;
  const title = result.created ? "Added to the handbook." : confirmed ? "Confirmed." : "Saved.";
  if (n === 0) return { title };
  return { title, description: `Re-checking ${n} question-bank item${n === 1 ? "" : "s"} that cite${n === 1 ? "s" : ""} it. They are drafts until the check passes.` };
}

/**
 * Admin → Handbook (v4.2): the Oyelabs Process Handbook every course, the glossary, tooltips, the
 * decision tool and assessment items read. Entries still "to confirm" come first: confirming one
 * (or editing it first) is what turns an industry-standard default into Oyelabs' own process.
 */
export default function AdminHandbookPage() {
  useDocumentTitle("Handbook");
  const [params, setParams] = useSearchParams();
  const kind = (HANDBOOK_KINDS as readonly string[]).includes(params.get("tab") ?? "") ? (params.get("tab") as HandbookKind) : "term";
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const projectType = params.get("projectType") ?? "";
  const status = params.get("status") ?? "";
  const archived = params.get("archived") === "1";

  const setParam = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key === "tab") next.delete("category");
        return next;
      },
      { replace: true },
    );

  const [entries, setEntries] = useState<HandbookEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ open: boolean; entry: HandbookEntry | null }>({ open: false, entry: null });

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await handbookApi.list(signal);
      setEntries(res.entries);
      setError(null);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof ApiRequestError ? e.message : "The handbook couldn't be loaded.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const ofKind = useMemo(() => (entries ?? []).filter((e) => e.kind === kind), [entries, kind]);
  const counts = useMemo(() => {
    const out = {} as Record<HandbookKind, number>;
    for (const k of HANDBOOK_KINDS) out[k] = (entries ?? []).filter((e) => e.kind === k && !e.archived).length;
    return out;
  }, [entries]);
  const idsByKind = useMemo(() => {
    const out = {} as Record<HandbookKind, string[]>;
    for (const k of HANDBOOK_KINDS) out[k] = (entries ?? []).filter((e) => e.kind === k && !e.archived).map((e) => e.id).sort();
    return out;
  }, [entries]);
  const toConfirm = ofKind.filter((e) => !e.archived && statusOf(e) === "to-confirm").length;

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ofKind
      .filter((e) => e.archived === archived)
      .filter((e) => !status || statusOf(e) === status)
      .filter((e) => !category || (e.data as { category?: string }).category === category)
      .filter((e) => {
        if (!projectType) return true;
        const d = e.data as { projectType?: string; projectTypes?: string[] };
        return d.projectType === projectType || Boolean(d.projectTypes?.includes(projectType));
      })
      .filter((e) => {
        if (!needle) return true;
        const d = e.data as Record<string, unknown>;
        const aka = Array.isArray(d.aka) ? (d.aka as string[]).join(" ") : "";
        return `${e.id} ${nameOf(e)} ${aka} ${summaryOf(e)}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => Number(statusOf(a) === "confirmed") - Number(statusOf(b) === "confirmed") || nameOf(a).localeCompare(nameOf(b)));
  }, [ofKind, archived, status, category, projectType, q]);

  /**
   * Swaps one entry in place, so a save never reorders the list under the person's eyes until reload.
   * Also drops the session glossary, so tooltips and the glossary page in this tab reload the edit.
   */
  const replace = (next: HandbookEntry) => {
    resetGlossary();
    setEntries((all) => (all?.some((e) => e.kind === next.kind && e.id === next.id) ? all.map((e) => (e.kind === next.kind && e.id === next.id ? next : e)) : [...(all ?? []), next]));
  };

  const confirm = async (entry: HandbookEntry) => {
    setBusyId(entry.id);
    try {
      const res = await handbookApi.save(entry.kind, entry.id, entry.data, true);
      replace(res.entry);
      const msg = savedMessage(res, true);
      notify.success(`${nameOf(res.entry)}: ${msg.title.toLowerCase()}`, msg.description ? { description: msg.description } : undefined);
    } catch (e) {
      notify.error(e instanceof ApiRequestError ? e.message : "That didn't confirm. Open it to check the fields.");
    } finally {
      setBusyId(null);
    }
  };

  const onSaved = (result: SavedResult) => {
    replace(result.entry);
    const confirmed = statusOf(result.entry) === "confirmed" && (!sheet.entry || statusOf(sheet.entry) !== "confirmed");
    const archivedChanged = sheet.entry && sheet.entry.archived !== result.entry.archived;
    if (archivedChanged && result.entry.archived) {
      const archivedEntry = result.entry;
      notify.undo(`${nameOf(archivedEntry)} archived. Learners no longer see it.`, {
        onUndo: () => {
          void handbookApi
            .setArchived(archivedEntry.kind, archivedEntry.id, false)
            .then((res) => replace(res.entry))
            .catch((e: unknown) => notify.error(e instanceof ApiRequestError ? e.message : "Could not unarchive it."));
        },
      });
    } else if (archivedChanged) notify.success("Unarchived.");
    else {
      const msg = savedMessage(result, confirmed);
      notify.success(msg.title, msg.description ? { description: msg.description } : undefined);
    }
    setSheet({ open: false, entry: null });
  };

  const selectClass = "h-9 w-full rounded-md border border-input bg-surface px-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong";
  const hasCategory = kind === "term" || kind === "rule";
  const hasProjectType = kind !== "template";
  const label = KIND_LABELS[kind];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Handbook</h1>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Oyelabs’ process terms, stages, rules and templates; a change here shows up everywhere.
          </p>
        </div>
        <Button type="button" onClick={() => setSheet({ open: true, entry: null })}>
          <Plus className="size-4" /> Add {label.one}
        </Button>
      </div>

      <div role="tablist" aria-label="Handbook sections" className="mt-6 flex gap-1 overflow-x-auto border-b">
        {HANDBOOK_KINDS.map((k) => {
          const selected = k === kind;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              id={`handbook-tab-${k}`}
              aria-selected={selected}
              aria-controls="handbook-panel"
              onClick={() => setParam("tab", k === "term" ? "" : k)}
              className={cn("relative shrink-0 px-3 py-2 text-sm transition-colors", selected ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {KIND_LABELS[k].many}
              <span className="ml-1.5 font-mono text-xs text-muted-foreground">{entries ? counts[k] : "–"}</span>
              {selected && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id="handbook-panel" aria-labelledby={`handbook-tab-${kind}`} className="mt-5">
        {toConfirm > 0 && !archived && (
          <div className="mb-4 rounded-md border border-trailmark/40 bg-trailmark/10 px-4 py-3 text-sm">
            <strong className="font-semibold">{toConfirm}</strong> {toConfirm === 1 ? `${label.one} is` : `${label.many.toLowerCase()} are`} industry standard and still to confirm. Confirm Oyelabs’ meaning, or edit it first.
            {status !== "to-confirm" && (
              <Button type="button" variant="link" size="sm" className="ml-1 h-auto px-1" onClick={() => setParam("status", "to-confirm")}>
                Show only these
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="col-span-2">
            <label htmlFor="handbook-q" className="mb-1 block text-xs font-medium text-muted-foreground">
              Search
            </label>
            <Input
              id="handbook-q"
              className="h-9"
              leading={<Search className="size-4" />}
              placeholder={`Name, id or text`}
              value={q}
              onChange={(e) => setParam("q", e.target.value)}
              onClear={() => setParam("q", "")}
            />
          </div>
          {hasCategory && (
            <Filter id="handbook-category" label="Category" value={category} onChange={(v) => setParam("category", v)} className={selectClass}>
              <option value="">All categories</option>
              {TERM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {TERM_CATEGORY_LABELS[c]}
                </option>
              ))}
            </Filter>
          )}
          {hasProjectType && (
            <Filter id="handbook-project" label="Project type" value={projectType} onChange={(v) => setParam("projectType", v)} className={selectClass}>
              <option value="">Both</option>
              {PROJECT_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p === "whitelabel" ? "White-label" : "Custom"}
                </option>
              ))}
            </Filter>
          )}
          <Filter id="handbook-status" label="Status" value={status} onChange={(v) => setParam("status", v)} className={selectClass}>
            <option value="">Any status</option>
            <option value="to-confirm">To confirm</option>
            <option value="confirmed">Confirmed</option>
          </Filter>
          <Filter id="handbook-archived" label="Showing" value={archived ? "1" : ""} onChange={(v) => setParam("archived", v)} className={selectClass}>
            <option value="">In use</option>
            <option value="1">Archived</option>
          </Filter>
        </div>

        {error && (
          <div className="mt-5">
            <FormAlert>{error}</FormAlert>
          </div>
        )}

        {!entries && !error && (
          <div className="mt-5 space-y-2" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {entries && (
          <>
            <p className="mt-5 text-xs text-muted-foreground" aria-live="polite">
              {visible.length} of {ofKind.filter((e) => e.archived === archived).length} {label.many.toLowerCase()}
            </p>
            {visible.length === 0 ? (
              <p className="mt-6 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                {ofKind.length === 0 ? `No ${label.many.toLowerCase()} yet. Seeds load at the next server start, or add one.` : "Nothing matches these filters."}
              </p>
            ) : (
              <ul className="mt-2 divide-y rounded-md border">
                {visible.map((e) => {
                  const st = statusOf(e);
                  return (
                    <li key={e.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:gap-4 sm:p-4">
                      <button type="button" className="min-w-0 flex-1 rounded-sm text-left" onClick={() => setSheet({ open: true, entry: e })}>
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{nameOf(e)}</span>
                          <Badge variant={st === "confirmed" ? "success" : "progress"}>{st === "confirmed" ? "Confirmed" : "To confirm"}</Badge>
                          {e.archived && <Badge variant="outline">Archived</Badge>}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                          {e.id}
                          {metaOf(e).map((m) => ` · ${m}`)}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{summaryOf(e)}</span>
                      </button>
                      <div className="flex shrink-0 gap-2">
                        {st === "to-confirm" && !e.archived && (
                          <Button
                            type="button"
                            size="sm"
                            variant="summit"
                            loading={busyId === e.id}
                            disabled={busyId !== null}
                            title={HANDBOOK_STATUS_LABELS.confirmed}
                            aria-label={`Confirm ${nameOf(e)}`}
                            onClick={() => void confirm(e)}
                          >
                            <Check className="size-4" /> Confirm
                          </Button>
                        )}
                        <Button type="button" size="sm" variant="outline" aria-label={`Edit ${nameOf(e)}`} onClick={() => setSheet({ open: true, entry: e })}>
                          <Pencil className="size-4" /> Edit
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      <EntrySheet
        kind={sheet.entry?.kind ?? kind}
        entry={sheet.entry}
        open={sheet.open}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
        onSaved={onSaved}
        onFileChanged={(next) => {
          replace(next);
          setSheet({ open: true, entry: next });
        }}
        idsByKind={idsByKind}
      />
    </div>
  );
}

function Filter({ id, label, value, onChange, className, children }: { id: string; label: string; value: string; onChange: (v: string) => void; className: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={className}>
        {children}
      </select>
    </div>
  );
}
