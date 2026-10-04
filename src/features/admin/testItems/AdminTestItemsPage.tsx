import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link, useSearchParams } from "react-router-dom";
import { Archive, Pencil, RefreshCw, RotateCcw, Sparkles } from "lucide-react";

import type { RecheckScope, TestItemGates, TestItemRow, TestItemsSummary, TestItemStatus } from "@shared/topicTests";
import { pageMetaOf } from "@shared/table";

import { ApiRequestError } from "@/api/client";
import { DataTable, useTableQueryState, type TableFieldDef } from "@/components/data-table";
import { FormAlert } from "@/components/form/Field";
import { useFormDialog } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTracks } from "@/content";
import { useAuth } from "@/features/auth/AuthProvider";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { notify } from "@/lib/toast";
import { testItemsApi } from "./api";

const STATUS_VARIANT: Record<TestItemStatus, "success" | "progress" | "outline" | "danger"> = {
  active: "success",
  flagged: "danger",
  draft: "progress",
  retired: "outline",
};

const GATE_LABELS: Record<string, string> = {
  format: "Format",
  relevanceCode: "Quote in passage",
  relevanceAi: "Passage supports key",
  answerable: "Answerable from content",
  notTrivial: "Not trivial",
  distractors: "Distractor rationales",
  size: "Size",
  testLevel: "Test-level cues",
};

const selectClass = "h-9 w-full rounded-md border border-input bg-surface px-2 text-sm";

function percent(value: number | null): string {
  return value === null ? "–" : `${Math.round(value * 100)}%`;
}

/**
 * Admin → Curriculum → Test items (v4.3 Phase 5).
 *
 * Every topic test item with its status, origin, pass rate, flags, gate results and the passage it
 * cites, plus the re-check run. Filters are URL parameters so a topic's view can be linked to.
 */
export default function AdminTestItemsPage() {
  useDocumentTitle("Test items");
  const formDialog = useFormDialog();
  const tracks = useTracks();
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const { query, setQuery } = useTableQueryState();
  const [params, setParams] = useSearchParams();

  const trackId = params.get("track") ?? "";
  const moduleId = params.get("module") ?? "";
  const topicId = params.get("topic") ?? "";
  const status = (params.get("status") ?? "") as TestItemStatus | "";
  const origin = params.get("origin") ?? "";
  const flagged = params.get("flagged") === "1";

  const setParam = (key: string, value: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        next.delete("page");
        if (key === "track") {
          next.delete("module");
          next.delete("topic");
        }
        if (key === "module") next.delete("topic");
        return next;
      },
      { replace: true },
    );
  };

  const modules = useMemo(() => tracks.find((t) => t.id === trackId)?.modules ?? [], [tracks, trackId]);
  const topics = useMemo(() => modules.find((m) => m.id === moduleId)?.topics ?? [], [modules, moduleId]);

  const [data, setData] = useState<{ items: TestItemRow[]; total: number; counts: Partial<Record<TestItemStatus, number>> } | null>(null);
  const [summary, setSummary] = useState<TestItemsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const [list, sum] = await Promise.all([
          testItemsApi.list(
            {
              topicId: topicId || undefined,
              moduleId: !topicId ? moduleId || undefined : undefined,
              trackId: !topicId && !moduleId ? trackId || undefined : undefined,
              status: status || undefined,
              origin: (origin || undefined) as "static" | "generated" | undefined,
              flagged: flagged ? "1" : undefined,
              q: query.q.trim() || undefined,
              limit: query.pageSize,
              offset: (query.page - 1) * query.pageSize,
            },
            signal,
          ),
          testItemsApi.summary(signal),
        ]);
        setData(list);
        setSummary(sum);
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load the test items.");
      } finally {
        setLoading(false);
      }
    },
    [topicId, moduleId, trackId, status, origin, flagged, query.q, query.page, query.pageSize],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // While a re-check runs, refresh the summary every few seconds.
  const running = summary?.run?.status === "running";
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => void testItemsApi.summary().then(setSummary).catch(() => undefined), 4000);
    return () => clearInterval(timer);
  }, [running]);

  const run = async (work: () => Promise<unknown>, success: string) => {
    try {
      await work();
      notify.success(success);
      await load();
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "That didn't work.");
    }
  };

  const retire = async (row: TestItemRow) => {
    const done = await formDialog({
      title: `Retire item ${row.id}?`,
      description: "Retired items are not served. A replacement is written if the topic drops below its target.",
      submitLabel: "Retire item",
      destructive: true,
      body: ({ pending }) => (
        <div>
          <label htmlFor="tt-retire-reason" className="text-sm font-medium">
            Reason
          </label>
          <input id="tt-retire-reason" name="reason" maxLength={300} disabled={pending} placeholder="e.g. Ambiguous wording" className="mt-1.5 h-9 w-full rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong" />
        </div>
      ),
      onSubmit: async (form) => {
        try {
          await testItemsApi.retire(row.id, String(form.get("reason") ?? "").trim() || undefined);
          return true;
        } catch (err) {
          throw new Error(err instanceof ApiRequestError ? err.message : "Could not retire the item.");
        }
      },
    });
    if (done) {
      if (row.status === "active") {
        notify.undo(`Retired ${row.id}.`, {
          onUndo: () => void run(() => testItemsApi.restore(row.id), "Restored."),
        });
      } else notify.success("Retired.");
      await load();
    }
  };

  const edit = async (row: TestItemRow) => {
    const keys = row.item.correctIndices && row.item.correctIndices.length > 1 ? row.item.correctIndices : [row.item.correctIndex];
    const done = await formDialog({
      title: "Edit test item",
      description: "One option per line. Its stats start again, because it is a new version of the question.",
      submitLabel: "Save",
      body: ({ pending }) => (
        <div className="space-y-3">
          <Field id="tt-prompt" label="Question">
            <textarea id="tt-prompt" name="prompt" rows={3} disabled={pending} defaultValue={row.item.prompt} className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm" />
          </Field>
          <Field id="tt-options" label="Options (one per line)">
            <textarea id="tt-options" name="options" rows={5} disabled={pending} defaultValue={row.item.options.join("\n")} className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm" />
          </Field>
          <Field id="tt-keys" label="Correct option numbers (comma-separated, starting at 1)">
            <input id="tt-keys" name="keys" disabled={pending} defaultValue={keys.map((k) => k + 1).join(", ")} className="h-9 w-full rounded-md border border-input bg-surface px-3 text-sm" />
          </Field>
          <Field id="tt-explanation" label="Explanation">
            <textarea id="tt-explanation" name="explanation" rows={3} disabled={pending} defaultValue={row.item.explanation} className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm" />
          </Field>
        </div>
      ),
      onSubmit: async (form) => {
        const options = String(form.get("options") ?? "").split("\n").map((o) => o.trim()).filter(Boolean);
        const correctIndices = String(form.get("keys") ?? "")
          .split(/[,\s]+/)
          .filter(Boolean)
          .map((k) => Number(k) - 1);
        if (correctIndices.some((k) => !Number.isInteger(k) || k < 0 || k >= options.length)) throw new Error("Each correct number must match an option.");
        try {
          await testItemsApi.edit(row.id, {
            prompt: String(form.get("prompt") ?? "").trim(),
            options,
            correctIndices,
            explanation: String(form.get("explanation") ?? "").trim(),
          });
          return true;
        } catch (err) {
          throw new Error(err instanceof ApiRequestError ? err.message : "Could not save the item.");
        }
      },
    });
    if (done) {
      notify.success("Saved.");
      await load();
    }
  };

  const startRecheck = async () => {
    const defaultScope: RecheckScope = topicId ? { kind: "topic", id: topicId } : moduleId ? { kind: "module", id: moduleId } : trackId ? { kind: "track", id: trackId } : { kind: "all" };
    const label = defaultScope.kind === "all" ? "the whole curriculum" : `this ${defaultScope.kind} (${defaultScope.id})`;
    const done = await formDialog({
      title: "Run re-check",
      description: `Puts every active item in ${label} through the quality gates, retires failures and writes replacements. It spends AI budget and stops at the cap (currently $${summary?.budgetUsd ?? "?"}). Narrow the filters above to re-check less.`,
      submitLabel: "Start re-check",
      body: () => <p className="text-sm text-muted-foreground">Estimated full-curriculum cost: ${summary?.estimate.totalUsd ?? "?"} ({summary?.estimate.basis}).</p>,
      onSubmit: async () => {
        try {
          await testItemsApi.recheck(defaultScope);
          return true;
        } catch (err) {
          throw new Error(err instanceof ApiRequestError ? err.message : "Could not start the re-check.");
        }
      },
    });
    if (done) {
      notify.success("Re-check started. It runs in the background.");
      await load();
    }
  };

  const fields = useMemo<TableFieldDef<TestItemRow>[]>(
    () => [
      { name: "q", label: "Question, topic or id", type: "string", searchable: true, filterable: false, sortable: false },
      { name: "topicId", label: "Topic", type: "string", filterable: false, sortable: false },
      { name: "status", label: "Status", type: "string", filterable: false, sortable: false },
      { name: "origin", label: "Origin", type: "string", filterable: false, sortable: false },
    ],
    [],
  );

  const columns = useMemo<ColumnDef<TestItemRow, unknown>[]>(
    () => [
      {
        id: "prompt",
        header: "Question",
        size: 380,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="min-w-0">
            <span className="line-clamp-2 text-sm">{row.original.item.prompt}</span>
            <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">{row.original.topicId}</span>
          </div>
        ),
      },
      { id: "status", header: "Status", size: 90, enableSorting: false, cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge> },
      { id: "origin", header: "Origin", size: 90, enableSorting: false, cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.origin}</span> },
      { id: "passRate", header: "Pass", size: 64, enableSorting: false, meta: { align: "right" }, cell: ({ row }) => <span className="tabular text-sm">{percent(row.original.passRate)}</span> },
      { id: "attempts", header: "Tries", size: 64, enableSorting: false, meta: { align: "right" }, cell: ({ row }) => <span className="tabular text-sm">{row.original.attempts}</span> },
      {
        id: "gates",
        header: "Gates",
        size: 90,
        enableSorting: false,
        cell: ({ row }) => {
          const gates = row.original.gates;
          if (!gates) return <span className="text-xs text-muted-foreground">not checked</span>;
          return <Badge variant={gates.passed ? "success" : "danger"}>{gates.passed ? "passed" : `${gates.failures.length} failed`}</Badge>;
        },
      },
      {
        id: "flag",
        header: "Flag",
        size: 160,
        enableSorting: false,
        cell: ({ row }) => <span className="line-clamp-2 text-xs text-muted-foreground">{row.original.flagReason ?? row.original.retiredReason ?? ""}</span>,
      },
    ],
    [],
  );

  const meta = data ? pageMetaOf(data.total, query.page, query.pageSize) : undefined;
  const runState = summary?.run;

  return (
    <div className="max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link to="/admin/curriculum" className="underline-offset-2 hover:underline">
              Curriculum
            </Link>
          </p>
          <h1 className="text-2xl font-bold">Test items</h1>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Each topic's test items; only active ones are served, and each quotes the passage it tests.
          </p>
        </div>
        {isSuperadmin && (
          <Button size="sm" onClick={() => void startRecheck()} disabled={running}>
            <RefreshCw aria-hidden="true" />
            Run re-check
          </Button>
        )}
      </div>

      {summary && (
        <div className="mt-4 rounded-md border p-4 text-sm">
          <dl className="flex flex-wrap gap-x-6 gap-y-2">
            {(["active", "retired", "draft"] as const).map((s) => (
              <div key={s}>
                <dt className="text-xs text-muted-foreground capitalize">{s}</dt>
                <dd className="font-display text-lg font-semibold tabular">{summary.counts[s] ?? 0}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs text-muted-foreground">Flagged (live)</dt>
              <dd className="font-display text-lg font-semibold tabular">{summary.flagged}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Generated (live)</dt>
              <dd className="font-display text-lg font-semibold tabular">{summary.byOrigin.generated ?? 0}</dd>
            </div>
          </dl>
          {runState && (
            <div className="mt-3 border-t pt-3">
              <p>
                Re-check ({runState.scope.kind}
                {runState.scope.id ? `: ${runState.scope.id}` : ""}): <strong>{runState.status.replace("_", " ")}</strong>, {runState.cursor} of{" "}
                {runState.topicIds.length} topics, ${runState.spentUsd.toFixed(2)} of ${runState.budgetUsd} budget.
              </p>
              <p className="mt-1 text-muted-foreground">
                Checked {runState.counts.checked}, retired {runState.counts.retired}, regenerated {runState.counts.regenerated}, dropped{" "}
                {runState.counts.dropped}, kept to hold the minimum {runState.counts.keptBelowMinimum}
                {runState.counts.withdrawnUncited ? `, withdrawn with no supporting passage ${runState.counts.withdrawnUncited}` : ""}
                {runState.counts.codeChecked ? `, code solutions checked ${runState.counts.codeChecked} (${runState.counts.codeFailed} failing)` : ""}.
                {runState.lastError ? ` Last error: ${runState.lastError}` : ""}
              </p>
              {isSuperadmin && (
                <div className="mt-2 flex gap-2">
                  {runState.status === "running" && (
                    <Button variant="outline" size="sm" onClick={() => void run(() => testItemsApi.cancel(), "Cancelled.")}>
                      Cancel
                    </Button>
                  )}
                  {(runState.status === "paused_budget" || runState.status === "failed") && (
                    <Button variant="outline" size="sm" onClick={() => void run(() => testItemsApi.resume(), "Resumed.")}>
                      Resume
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <FilterSelect id="tt-track" label="Trail" value={trackId} onChange={(v) => setParam("track", v)}>
          <option value="">All trails</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect id="tt-module" label="Camp" value={moduleId} onChange={(v) => setParam("module", v)}>
          <option value="">All camps</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect id="tt-topic" label="Topic" value={topicId} onChange={(v) => setParam("topic", v)}>
          <option value="">All topics</option>
          {topicId && !topics.some((t) => t.id === topicId) && <option value={topicId}>{topicId}</option>}
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect id="tt-status" label="Status" value={status} onChange={(v) => setParam("status", v)}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="retired">Retired</option>
          <option value="draft">Draft</option>
          <option value="flagged">Flagged</option>
        </FilterSelect>
        <FilterSelect id="tt-origin" label="Origin" value={origin} onChange={(v) => setParam("origin", v)}>
          <option value="">Any origin</option>
          <option value="static">Static (content file)</option>
          <option value="generated">Generated</option>
        </FilterSelect>
        <FilterSelect id="tt-flagged" label="Flags" value={flagged ? "1" : ""} onChange={(v) => setParam("flagged", v)}>
          <option value="">All</option>
          <option value="1">Flagged only</option>
        </FilterSelect>
      </div>

      {error && !data && <div className="mt-4"><FormAlert>{error}</FormAlert></div>}

      <div className="mt-4">
        <DataTable
          data={data?.items ?? []}
          columns={columns}
          fields={fields}
          getRowId={(row) => row.id}
          query={query}
          onQueryChange={setQuery}
          mode="server"
          meta={meta}
          tableKey="admin.testItems"
          loading={loading}
          error={error}
          onRetry={() => void load()}
          noun="item"
          searchPlaceholder="Search question, topic or id"
          caption="Topic test items."
          emptyState={{ title: "No items here", body: "Nothing matches these filters. A topic's static questions appear the first time it is opened or served." }}
          renderDetail={(row) => <ItemDetail row={row} />}
          detailTitle={(row) => row.topicTitle}
          detailSubtitle={(row) => <span className="font-mono text-xs">{row.servedId}</span>}
          detailFooter={(row) => (
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => void edit(row)}>
                <Pencil aria-hidden="true" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => void run(() => testItemsApi.regenerate(row.id), "A replacement is queued.")}>
                <Sparkles aria-hidden="true" />
                Regenerate
              </Button>
              {row.status === "retired" ? (
                <Button variant="outline" size="sm" onClick={() => void run(() => testItemsApi.restore(row.id), "Restored.")}>
                  <RotateCcw aria-hidden="true" />
                  Restore
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => void retire(row)}>
                  <Archive aria-hidden="true" />
                  Retire
                </Button>
              )}
            </div>
          )}
          mobileCard={(row) => (
            <div className="min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{row.topicTitle}</span>
                <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{row.item.prompt}</p>
              <p className="text-xs text-muted-foreground">
                {row.origin}, pass {percent(row.passRate)} of {row.attempts}
              </p>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function ItemDetail({ row }: { row: TestItemRow }) {
  const keys = new Set(row.item.correctIndices && row.item.correctIndices.length > 1 ? row.item.correctIndices : [row.item.correctIndex]);
  const gates = row.gates;
  return (
    <div className="space-y-4 text-sm">
      <p className="whitespace-pre-wrap">{row.item.prompt}</p>
      <ol className="space-y-1.5">
        {row.item.options.map((option, i) => (
          <li key={i} className={keys.has(i) ? "font-medium text-summit-strong" : ""}>
            {String.fromCharCode(65 + i)}. {option}
            {keys.has(i) ? " (correct)" : ""}
            {!keys.has(i) && row.item.distractorRationales?.[i] && (
              <span className="block text-xs font-normal text-muted-foreground">Misconception: {row.item.distractorRationales[i]}</span>
            )}
          </li>
        ))}
      </ol>
      <div>
        <p className="text-xs font-medium text-muted-foreground">Explanation</p>
        <p className="mt-1">{row.item.explanation}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">Cited passage</p>
        {row.citedPassage ? (
          <blockquote className="mt-1 border-l-2 border-basalt/40 pl-3 text-muted-foreground">
            <span className="block font-mono text-[11px]">
              {row.citedPassage.id}, {row.citedPassage.heading}
            </span>
            {row.citedPassage.text}
            {row.item.citation && <span className="mt-1 block text-foreground">Quote: "{row.item.citation.quote}"</span>}
          </blockquote>
        ) : (
          <p className="mt-1 text-muted-foreground">None yet{row.origin === "static" ? " (static items get one from the re-check)" : ""}.</p>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">Stats</p>
        <p className="mt-1">
          {row.attempts} attempts, pass rate {percent(row.passRate)}; strong learners {row.strongFails} wrong of {row.strongAttempts}.
          {row.item.band ? ` Band: ${row.item.band.replace("_", " ")}.` : ""}
        </p>
        {row.flagReason && <p className="mt-1 text-destructive">Flag: {row.flagReason}</p>}
        {row.retiredReason && <p className="mt-1 text-muted-foreground">Retired: {row.retiredReason}</p>}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">Quality gates</p>
        {gates ? <GateList gates={gates} /> : <p className="mt-1 text-muted-foreground">Not checked yet. Run a re-check.</p>}
      </div>
    </div>
  );
}

function GateList({ gates }: { gates: TestItemGates }) {
  return (
    <ul className="mt-1 space-y-1">
      {Object.entries(GATE_LABELS).map(([key, label]) => {
        const check = gates[key as keyof TestItemGates] as { ok: boolean; skipped?: boolean; detail?: string } | undefined;
        if (!check || typeof check !== "object") return null;
        return (
          <li key={key} className="flex gap-2">
            <Badge variant={check.ok ? "success" : check.skipped ? "outline" : "danger"}>{check.ok ? "ok" : check.skipped ? "skipped" : "failed"}</Badge>
            <span>
              {label}
              {check.detail ? <span className="text-muted-foreground">: {check.detail}</span> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function FilterSelect({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        {children}
      </select>
    </div>
  );
}
