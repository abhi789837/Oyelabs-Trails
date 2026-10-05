import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { normaliseSkillText, type Skill } from "@shared/catalog";
import type { SkillEdgeRow, SkillEdgeType, SkillGraphResponse } from "@shared/skillGraph";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useCatalog } from "../catalog/useCatalog";
import { skillGraphApi } from "./api";
import { GraphView } from "./GraphView";
import { SkillSelect } from "./SkillSelect";

const selectClass = "h-10 rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong";
const TYPE_LABEL: Record<SkillEdgeType, string> = { prerequisite: "learn first", recommended: "recommended" };
/** Rows rendered before "Show all": Engineering has a few hundred edges. */
const PAGE = 150;

const message = (err: unknown, fallback: string) => (err instanceof ApiRequestError ? err.message : fallback);

/**
 * v4.3 skill graph: which skills come before which, per department.
 *
 * A list editor on one side and a read-only drawing of one skill's neighbourhood on the other.
 * The server keeps the graph acyclic, so a loop comes back as a message that names it.
 */
export default function AdminSkillGraphPage() {
  useDocumentTitle("Skill graph");
  const me = useCurrentUser();
  const canEdit = me.role === "superadmin";
  const { catalog, departmentOptions, error: catalogError } = useCatalog();
  const [params, setParams] = useSearchParams();
  const departmentId = params.get("department") ?? departmentOptions[0]?.value ?? null;
  const focusParam = params.get("skill");

  const [graph, setGraph] = useState<SkillGraphResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<SkillEdgeType | "all">("all");
  const [showAll, setShowAll] = useState(false);
  const [depth, setDepth] = useState(2);
  const [draft, setDraft] = useState<{ from: string | null; to: string | null; type: SkillEdgeType }>({ from: null, to: null, type: "prerequisite" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!departmentId) return;
      try {
        setGraph(await skillGraphApi.get(departmentId, signal));
        setLoadError(null);
      } catch (err) {
        if (!signal?.aborted) setLoadError(message(err, "Could not load the skill graph."));
      }
    },
    [departmentId],
  );

  useEffect(() => {
    const controller = new AbortController();
    setGraph(null);
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const setParam = (key: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key === "department") next.delete("skill");
        return next;
      },
      { replace: true },
    );

  // Pickers search the full catalog rows (aliases, tags); names come from the graph so archived
  // skills an edge still names are labelled too.
  const pickable: Skill[] = useMemo(
    () => (catalog?.skills ?? []).filter((s) => s.departmentId === departmentId && s.status !== "archived"),
    [catalog, departmentId],
  );
  const names = useMemo(() => new Map((graph?.skills ?? []).map((s) => [s.id, s.name])), [graph]);
  const nameOf = useCallback((id: string) => names.get(id) ?? id, [names]);

  const edges = useMemo(() => graph?.edges ?? [], [graph]);
  const filtered = useMemo(() => {
    const q = normaliseSkillText(query);
    const rows = edges.filter(
      (e) => (typeFilter === "all" || e.type === typeFilter) && (!q || normaliseSkillText(`${nameOf(e.from)} ${nameOf(e.to)}`).includes(q)),
    );
    return [...rows].sort((a, b) => nameOf(a.from).localeCompare(nameOf(b.from)) || nameOf(a.to).localeCompare(nameOf(b.to)));
  }, [edges, query, typeFilter, nameOf]);
  const shown = showAll ? filtered : filtered.slice(0, PAGE);

  const linked = useMemo(() => new Set(edges.flatMap((e) => [e.from, e.to])), [edges]);
  const focus = focusParam && names.has(focusParam) ? focusParam : (pickable.find((s) => linked.has(s.id))?.id ?? null);

  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.from || !draft.to) {
      setFormError("Pick both skills.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await skillGraphApi.add({ from: draft.from, to: draft.to, type: draft.type });
      notify.success(`Added ${nameOf(draft.from)} → ${nameOf(draft.to)}.`);
      setParam("skill", draft.to);
      setDraft((d) => ({ ...d, from: null, to: null }));
      await load();
    } catch (err) {
      setFormError(message(err, "Could not add that link."));
    } finally {
      setBusy(false);
    }
  };

  const setType = async (edge: SkillEdgeRow, type: SkillEdgeType) => {
    try {
      await skillGraphApi.setType({ from: edge.from, to: edge.to, type });
      await load();
    } catch (err) {
      notify.error(message(err, "Could not change that link."));
    }
  };

  const remove = async (edge: SkillEdgeRow) => {
    try {
      await skillGraphApi.remove(edge.from, edge.to);
      await load();
      notify.undo(`Removed ${nameOf(edge.from)} → ${nameOf(edge.to)}.`, {
        onUndo: () => {
          void skillGraphApi
            .add({ from: edge.from, to: edge.to, type: edge.type })
            .then(() => load())
            .catch((err: unknown) => notify.error(message(err, "Could not put that link back.")));
        },
      });
    } catch (err) {
      notify.error(message(err, "Could not remove that link."));
    }
  };

  const error = loadError ?? catalogError;

  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold">Skill graph</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        "Learn first" links set the order of every learner's path. Recommended links only suggest what's next.
        {!canEdit && " Only the superadmin can change them."}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Department" className="flex flex-wrap gap-1 rounded-md border p-1">
          {departmentOptions.map((d) => (
            <button
              key={d.value}
              type="button"
              aria-pressed={d.value === departmentId}
              onClick={() => {
                setParam("department", d.value);
                setShowAll(false);
              }}
              className={cn(
                "rounded px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
                d.value === departmentId ? "bg-surface-sunken font-medium" : "text-muted-foreground hover:bg-surface-sunken/60",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
          leading={<Search aria-hidden="true" />}
          placeholder="Search links by skill"
          aria-label="Search links by skill"
          containerClassName="w-full sm:max-w-xs"
        />
        <select
          aria-label="Link type filter"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as SkillEdgeType | "all")}
          className={selectClass}
        >
          <option value="all">All link types</option>
          <option value="prerequisite">Learn first</option>
          <option value="recommended">Recommended</option>
        </select>
      </div>

      {error && (
        <div className="mt-6">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      {graph === null ? (
        !error && (
          <p className="mt-10 text-sm text-muted-foreground" role="status">
            Loading…
          </p>
        )
      ) : (
        <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <section aria-labelledby="graph-links-heading" className="min-w-0">
            <h2 id="graph-links-heading" className="font-display text-lg font-semibold">
              Links <span className="font-mono text-sm font-normal text-muted-foreground">{filtered.length}</span>
            </h2>

            {canEdit && (
              <form onSubmit={(event) => void add(event)} className="mt-3 space-y-2 rounded-md border p-3" aria-label="Add a link">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                  <SkillSelect skills={pickable} value={draft.from} onChange={(from) => setDraft((d) => ({ ...d, from }))} placeholder="Learn first…" label="Learn first" />
                  <span aria-hidden="true" className="hidden text-muted-foreground sm:block">
                    →
                  </span>
                  <SkillSelect skills={pickable} value={draft.to} onChange={(to) => setDraft((d) => ({ ...d, to }))} placeholder="Then…" label="Then" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Link type"
                    value={draft.type}
                    onChange={(event) => setDraft((d) => ({ ...d, type: event.target.value as SkillEdgeType }))}
                    className={selectClass}
                  >
                    <option value="prerequisite">Learn first</option>
                    <option value="recommended">Recommended</option>
                  </select>
                  <Button type="submit" loading={busy}>
                    <Plus aria-hidden="true" />
                    Add link
                  </Button>
                </div>
                {formError && <FormAlert>{formError}</FormAlert>}
              </form>
            )}

            {filtered.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">{query || typeFilter !== "all" ? "No link matches those filters." : "This department has no links yet."}</p>
            ) : (
              <ul className="mt-3 divide-y rounded-md border">
                {shown.map((edge) => (
                  <li key={`${edge.from}->${edge.to}`} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setParam("skill", edge.to)}
                      className="min-w-0 flex-1 rounded text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
                      aria-label={`Show ${nameOf(edge.from)} then ${nameOf(edge.to)} in the graph`}
                    >
                      <span className="break-words">{nameOf(edge.from)}</span>
                      <span aria-hidden="true" className="px-1.5 text-muted-foreground">
                        →
                      </span>
                      <span className="break-words">{nameOf(edge.to)}</span>
                      {edge.updatedBy && <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">edited</span>}
                    </button>
                    {canEdit ? (
                      <>
                        <select
                          aria-label={`Type of ${nameOf(edge.from)} → ${nameOf(edge.to)}`}
                          value={edge.type}
                          onChange={(event) => void setType(edge, event.target.value as SkillEdgeType)}
                          className="h-8 rounded-md border border-input bg-surface px-2 font-mono text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
                        >
                          <option value="prerequisite">learn first</option>
                          <option value="recommended">recommended</option>
                        </select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void remove(edge)}
                          aria-label={`Remove ${nameOf(edge.from)} → ${nameOf(edge.to)}`}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">{TYPE_LABEL[edge.type]}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!showAll && filtered.length > PAGE && (
              <Button type="button" variant="link" className="mt-2 px-0" onClick={() => setShowAll(true)}>
                Show all {filtered.length}
              </Button>
            )}
          </section>

          <section aria-labelledby="graph-view-heading" className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="graph-view-heading" className="mr-auto font-display text-lg font-semibold">
                Around one skill
              </h2>
              <SkillSelect
                skills={pickable}
                value={focus}
                onChange={(id) => setParam("skill", id)}
                placeholder="Pick a skill"
                label="Skill to show"
                className="w-full sm:w-64"
              />
              <select aria-label="Depth" value={depth} onChange={(event) => setDepth(Number(event.target.value))} className={selectClass}>
                <option value={1}>1 step each way</option>
                <option value={2}>2 steps each way</option>
                <option value={99}>Whole chain</option>
              </select>
            </div>
            <div className="mt-3">
              {focus ? (
                <GraphView edges={edges} focus={focus} depth={depth} nameOf={nameOf} onFocus={(id) => setParam("skill", id)} />
              ) : (
                <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Pick a skill to see what it needs and what builds on it.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
