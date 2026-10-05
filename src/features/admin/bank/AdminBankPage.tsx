import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useSearchParams } from "react-router-dom";
import { Calculator, CheckCircle2, LoaderCircle, Pencil, RotateCcw, Archive } from "lucide-react";

import { BANK_ITEM_TYPES, type BankItemRow, type BankItemType, type BankStatus } from "@shared/bank";
import { pageMetaOf } from "@shared/table";

import { ApiRequestError } from "@/api/client";
import { DataTable, useTableQueryState, type TableFieldDef } from "@/components/data-table";
import { FormAlert } from "@/components/form/Field";
import { useFormDialog } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { InfoTip } from "../catalog/InfoTip";
import { useCatalog } from "../catalog/useCatalog";
import { bankApi, type BankListResponse } from "./api";
import { AssessmentSettingsCard } from "./AssessmentSettingsCard";
import { BankItemPreview } from "./BankItemPreview";
import { CoverageTab } from "./CoverageTab";
import { BANK_TYPE_LABELS, formatDiscrimination, formatMeanScore, parseItemJson, toEditableItem } from "./helpers";

const STATUS_VARIANT: Record<BankStatus, "success" | "progress" | "outline"> = {
  active: "success",
  draft: "progress",
  retired: "outline",
};

const TABS = [
  { id: "items", label: "Items" },
  { id: "coverage", label: "Coverage" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/**
 * Admin → Question bank (v4 Phase 5).
 *
 * Department, skill, type, status and difficulty are plain selects rather than the table's faceted
 * chips: the server filters on exactly one value of each, and a multi-select chip would promise a
 * union it cannot deliver. The table still pages on the server, and its search box is the server's
 * `q` (prompt text or id).
 */
export default function AdminBankPage() {
  useDocumentTitle("Question library");
  const formDialog = useFormDialog();
  const { catalog, error: catalogError } = useCatalog();
  const { query, setQuery } = useTableQueryState();
  const [params, setParams] = useSearchParams();

  const departments = useMemo(() => (catalog?.departments ?? []).filter((d) => !d.archived), [catalog]);
  const departmentId = params.get("dept") ?? departments[0]?.id ?? "";
  const department = departments.find((d) => d.id === departmentId);
  const tab: TabId = params.get("tab") === "coverage" ? "coverage" : "items";
  const skillId = params.get("skill") ?? "";
  const type = (params.get("type") ?? "") as BankItemType | "";
  const status = (params.get("status") ?? "") as BankStatus | "";
  const difficulty = params.get("difficulty") ?? "";

  const skills = useMemo(
    () =>
      (catalog?.skills ?? [])
        .filter((s) => s.departmentId === departmentId && s.status !== "archived")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [catalog, departmentId],
  );
  const skillName = useCallback(
    (id: string) => catalog?.skills.find((s) => s.id === id)?.name ?? id,
    [catalog],
  );

  /** Writes one URL parameter (empty removes it) and sends the table back to page 1. */
  const setParam = (key: string, value: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "tab") next.delete("page");
        if (key === "dept") next.delete("skill");
        return next;
      },
      { replace: true },
    );
  };

  const [data, setData] = useState<BankListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!departmentId) return;
      setLoading(true);
      try {
        const result = await bankApi.list(
          {
            departmentId,
            skillId: skillId || undefined,
            type: type || undefined,
            status: status || undefined,
            difficulty: difficulty ? Number(difficulty) : undefined,
            q: query.q.trim() || undefined,
            limit: query.pageSize,
            offset: (query.page - 1) * query.pageSize,
          },
          signal,
        );
        setData(result);
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load the question library.");
      } finally {
        setLoading(false);
      }
    },
    [departmentId, skillId, type, status, difficulty, query.q, query.page, query.pageSize],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const meta = data ? pageMetaOf(data.total, query.page, query.pageSize) : undefined;

  const run = async (work: () => Promise<unknown>, success: string) => {
    try {
      await work();
      notify.success(success);
      await load();
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "That didn't work.");
    }
  };

  const edit = async (row: BankItemRow) => {
    const result = await formDialog({
      title: `Edit ${row.id}`,
      description: "The item as JSON. It is checked here, then re-validated on the server.",
      submitLabel: "Save item",
      body: ({ pending }) => (
        <div>
          <label htmlFor="bank-item-json" className="text-sm font-medium">
            Item JSON
          </label>
          <textarea
            id="bank-item-json"
            name="json"
            disabled={pending}
            defaultValue={JSON.stringify(toEditableItem(row), null, 2)}
            spellCheck={false}
            rows={18}
            className="mt-1.5 w-full rounded-md border border-input bg-surface px-3 py-2 font-mono text-xs leading-relaxed"
          />
        </div>
      ),
      onSubmit: async (form) => {
        const parsed = parseItemJson(String(form.get("json") ?? ""), row.id);
        if (!parsed.ok) throw new Error(parsed.errors.join(" · "));
        try {
          return await bankApi.save(parsed.item);
        } catch (err) {
          throw new Error(err instanceof ApiRequestError ? err.message : "Could not save the item.");
        }
      },
    });
    if (!result) return;
    if (result.problems.length) {
      notify.error("Saved as a draft: it does not validate yet.", { description: result.problems.join(" · ").slice(0, 400) });
    } else {
      notify.success(result.item.status === "retired" ? "Saved. It stays retired." : "Saved and live.");
    }
    await load();
  };

  const retire = async (row: BankItemRow) => {
    const done = await formDialog({
      title: `Retire ${row.id}?`,
      description: "Retired items are never put into a new assessment. You can restore it later.",
      submitLabel: "Retire item",
      destructive: true,
      body: ({ pending }) => (
        <div>
          <label htmlFor="retire-reason" className="text-sm font-medium">
            Reason
          </label>
          <input
            id="retire-reason"
            name="reason"
            maxLength={300}
            disabled={pending}
            placeholder="e.g. Ambiguous wording"
            className="mt-1.5 h-9 w-full rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
          />
        </div>
      ),
      onSubmit: async (form) => {
        try {
          await bankApi.setStatus(row.id, "retired", String(form.get("reason") ?? "").trim() || undefined);
          return true;
        } catch (err) {
          throw new Error(err instanceof ApiRequestError ? err.message : "Could not retire the item.");
        }
      },
    });
    if (!done) return;
    if (row.status === "active") {
      notify.undo(`Retired ${row.id}.`, {
        onUndo: () => {
          void bankApi
            .setStatus(row.id, "active")
            .then(() => load())
            .catch((err: unknown) => notify.error(err instanceof ApiRequestError ? err.message : "Could not restore the item."));
        },
      });
    } else notify.success("Retired.");
    await load();
  };

  const recompute = async () => {
    setRecomputing(true);
    try {
      const result = await bankApi.recompute();
      notify.success(
        `Stats updated for ${result.updated} item${result.updated === 1 ? "" : "s"}${result.retired.length ? `, ${result.retired.length} auto-retired` : ""}.`,
      );
      await load();
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "Could not recompute the stats.");
    } finally {
      setRecomputing(false);
    }
  };

  const fields = useMemo<TableFieldDef<BankItemRow>[]>(
    () => [
      { name: "q", label: "Prompt or id", type: "string", searchable: true, filterable: false, sortable: false },
      { name: "skillId", label: "Skill", type: "string", filterable: false, sortable: false, toCsv: (r) => skillName(r.skillId) },
      { name: "type", label: "Type", type: "string", filterable: false, sortable: false },
      { name: "difficulty", label: "Difficulty", type: "number", filterable: false, sortable: false },
      { name: "status", label: "Status", type: "string", filterable: false, sortable: false },
    ],
    [skillName],
  );

  const columns = useMemo<ColumnDef<BankItemRow, unknown>[]>(
    () => [
      {
        id: "id",
        header: "Item",
        size: 250,
        enableSorting: false,
        cell: ({ row }) => <span className="font-mono text-xs break-all">{row.original.id}</span>,
      },
      {
        id: "skillId",
        header: "Skill",
        size: 200,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm" title={skillName(row.original.skillId)}>
            {skillName(row.original.skillId)}
          </span>
        ),
      },
      { id: "type", header: "Type", size: 130, enableSorting: false, cell: ({ row }) => <span className="text-sm whitespace-nowrap">{BANK_TYPE_LABELS[row.original.type]}</span> },
      {
        id: "difficulty",
        header: "Diff.",
        size: 60,
        enableSorting: false,
        meta: { align: "right" },
        cell: ({ row }) => <span className="tabular text-sm">{row.original.difficulty}</span>,
      },
      {
        id: "status",
        header: "Status",
        size: 90,
        enableSorting: false,
        cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge>,
      },
      {
        id: "timesUsed",
        header: "Used",
        size: 64,
        enableSorting: false,
        meta: { align: "right" },
        cell: ({ row }) => <span className="tabular text-sm">{row.original.timesUsed}</span>,
      },
      {
        id: "meanScore",
        header: "Mean",
        size: 70,
        enableSorting: false,
        meta: { align: "right" },
        cell: ({ row }) => <span className="tabular text-sm">{formatMeanScore(row.original.meanScore)}</span>,
      },
      {
        id: "discrimination",
        header: "Discrim.",
        size: 84,
        enableSorting: false,
        meta: { align: "right" },
        cell: ({ row }) => <span className="tabular text-sm">{formatDiscrimination(row.original.discrimination)}</span>,
      },
      {
        id: "source",
        header: "Source",
        size: 84,
        enableSorting: false,
        cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.source}</span>,
      },
    ],
    [skillName],
  );

  const selectClass = "h-9 w-full rounded-md border border-input bg-surface px-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong";

  return (
    <div className="max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Question library</h1>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Validated items that assessments are assembled from, with how each one has performed.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" loading={recomputing} onClick={() => void recompute()}>
            <Calculator aria-hidden="true" />
            Recompute stats
          </Button>
          <InfoTip label="About recomputing stats">
            Recounts times used, mean score and discrimination from every graded sitting. Items that are almost always
            or almost never answered correctly after 20 uses are retired automatically.
          </InfoTip>
        </div>
      </div>

      <AssessmentSettingsCard className="mt-4" />

      {catalogError && <div className="mt-4"><FormAlert>{catalogError}</FormAlert></div>}

      {!catalog ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Loading…
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p id="bank-dept-label" className="mb-1.5 text-sm font-medium">
                Department
              </p>
              <Segmented
                labelledBy="bank-dept-label"
                size="sm"
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                value={departmentId}
                onChange={(value) => setParam("dept", value)}
              />
            </div>
            <dl className="flex gap-2" aria-label="Items by status">
              {(["active", "draft", "retired"] as const).map((s) => (
                <div key={s} className="rounded-md border px-3 py-1.5 text-center">
                  <dt className="text-xs text-muted-foreground capitalize">{s}</dt>
                  <dd className="font-display text-lg leading-tight font-semibold tabular">{data?.counts[s] ?? 0}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div role="tablist" aria-label="Question library views" className="mt-6 flex gap-1 border-b">
            {TABS.map((t) => {
              const selected = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`bank-tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls={`bank-panel-${t.id}`}
                  onClick={() => setParam("tab", t.id === "items" ? "" : t.id)}
                  className={cn(
                    "relative px-3 py-2 text-sm transition-colors",
                    selected ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                  {selected && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>

          {tab === "items" ? (
            <div role="tabpanel" id="bank-panel-items" aria-labelledby="bank-tab-items" className="mt-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <FilterSelect id="bank-skill" label="Skill" value={skillId} onChange={(v) => setParam("skill", v)} className={selectClass}>
                  <option value="">All skills</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSelect id="bank-type" label="Type" value={type} onChange={(v) => setParam("type", v)} className={selectClass}>
                  <option value="">All types</option>
                  {BANK_ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {BANK_TYPE_LABELS[t]}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSelect id="bank-status" label="Status" value={status} onChange={(v) => setParam("status", v)} className={selectClass}>
                  <option value="">Any status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="retired">Retired</option>
                </FilterSelect>
                <FilterSelect
                  id="bank-difficulty"
                  label="Difficulty"
                  value={difficulty}
                  onChange={(v) => setParam("difficulty", v)}
                  className={selectClass}
                >
                  <option value="">Any difficulty</option>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <option key={d} value={String(d)}>
                      {d}
                    </option>
                  ))}
                </FilterSelect>
              </div>

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
                  tableKey="admin.bank"
                  loading={loading}
                  error={error}
                  onRetry={() => void load()}
                  noun="item"
                  searchPlaceholder="Search prompt or id"
                  caption="Questions in the library for the selected department."
                  emptyState={{
                    title: "No items here",
                    body: "No question in the library matches these filters. The Coverage tab can ask the AI to fill the gap.",
                  }}
                  renderDetail={(row) => <BankItemPreview item={row} skillName={skillName(row.skillId)} />}
                  detailTitle={(row) => skillName(row.skillId)}
                  detailSubtitle={(row) => <span className="font-mono text-xs">{row.id}</span>}
                  detailFooter={(row) => (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => void edit(row)}>
                        <Pencil aria-hidden="true" />
                        Edit
                      </Button>
                      {row.status === "draft" && (
                        <Button size="sm" onClick={() => void run(() => bankApi.setStatus(row.id, "active"), "Approved and live.")}>
                          <CheckCircle2 aria-hidden="true" />
                          Approve
                        </Button>
                      )}
                      {row.status === "retired" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void run(() => bankApi.setStatus(row.id, "active"), "Restored.")}
                        >
                          <RotateCcw aria-hidden="true" />
                          Restore
                        </Button>
                      )}
                      {row.status !== "retired" && (
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
                        <span className="truncate text-sm font-medium">{skillName(row.skillId)}</span>
                        <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
                      </div>
                      <p className="truncate font-mono text-xs text-muted-foreground">{row.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {BANK_TYPE_LABELS[row.type]}, difficulty {row.difficulty}, used {row.timesUsed}×, mean {formatMeanScore(row.meanScore)}
                      </p>
                    </div>
                  )}
                />
              </div>
            </div>
          ) : (
            <div role="tabpanel" id="bank-panel-coverage" aria-labelledby="bank-tab-coverage" className="mt-5">
              {department && <CoverageTab department={department} skills={catalog.skills} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  className,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className: string;
  children: React.ReactNode;
}) {
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
