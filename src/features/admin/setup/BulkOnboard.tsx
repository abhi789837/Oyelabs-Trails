import { useId, useMemo, useState } from "react";
import { Check, ClipboardCopy, LoaderCircle, Sparkles, Trash2, X } from "lucide-react";

import type { BulkOnboardResult } from "@shared/bulkOnboard";
import { MAX_BULK_ROWS } from "@shared/bulkOnboard";
import type { Catalog } from "@shared/catalog";
import type { OnboardSuggestion } from "@shared/goals";
import type { Slider } from "@shared/setup";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { useConfirm } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { goalsApi } from "./goalsApi";
import { withGoals } from "./helpers";
import { sortedGoals } from "./goals";
import { applyResults, credentialsCsv, readyRows, rowErrors, rowsFromText, toBulkRequest, withSuggestion, type BulkRow } from "./bulkRows";

const bulkApi = {
  suggest: (rows: { departmentId: string; description: string; name?: string }[]) =>
    api.post<{ results: { index: number; suggestion?: OnboardSuggestion; error?: string }[]; aiAvailable: boolean }>("/api/admin/onboard/suggest-batch", { rows }),
  create: (body: ReturnType<typeof toBulkRequest>) => api.post<{ results: BulkOnboardResult[] }>("/api/admin/onboard/bulk", body),
};

const PLACEHOLDER = `Priya Sharma, priya.sharma, Engineering, Frontend dev, 2 yrs React, weak on Git
Ravi Kumar, , PM, New PM from client services, never ran a sprint
Anna Lee	anna	BD	Sales lead who should write proposals`;

const cellInput =
  "h-8 w-full min-w-0 rounded-md border border-input bg-surface px-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:opacity-60 aria-[invalid=true]:border-destructive";

/**
 * Bulk onboarding (v4.3 P6): paste rows, Suggest all, review in one table, Create & assign all.
 * Each row is the same as quick onboarding — Suggest, then create + setup + assessment — so a row
 * that fails (a taken username) does not stop the others.
 */
export function BulkOnboard({ catalog, taken, onCreated }: { catalog: Catalog; taken: ReadonlySet<string>; onCreated: (usernames: string[]) => void }) {
  const uid = useId();
  const confirm = useConfirm();
  const departments = useMemo(() => catalog.departments.filter((d) => !d.archived).map((d) => ({ id: d.id, name: d.name })), [catalog]);
  const defaultDepartment = departments[0]?.id ?? "engineering";
  const [text, setText] = useState("");
  const [rows, setRows] = useState<BulkRow[] | null>(null);
  const [busy, setBusy] = useState<"suggest" | "create" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const preview = useMemo(() => rowsFromText(text, departments, defaultDepartment, taken), [text, departments, defaultDepartment, taken]);
  const errors = useMemo(() => (rows ? rowErrors(rows, taken) : []), [rows, taken]);
  const ready = useMemo(() => (rows ? readyRows(rows, errors) : []), [rows, errors]);
  const created = rows?.filter((r) => r.status === "created") ?? [];
  const pending = rows?.filter((r) => r.status !== "created") ?? [];
  const blocked = pending.length - ready.length;

  const patch = (key: string, change: Partial<BulkRow> | ((row: BulkRow) => BulkRow)) =>
    setRows((current) => current?.map((r) => (r.key === key ? (typeof change === "function" ? change(r) : { ...r, ...change, ...(r.status === "failed" ? { status: "suggested" as const, message: undefined, errorField: undefined } : {}) }) : r)) ?? null);

  const suggestAll = async () => {
    if (preview.length === 0 || busy) return;
    if (preview.length > MAX_BULK_ROWS) {
      setError(`At most ${MAX_BULK_ROWS} people at a time. Split the list.`);
      return;
    }
    const start = preview.map((r) => ({ ...r, status: "suggesting" as const }));
    setRows(start);
    setBusy("suggest");
    setError(null);
    try {
      const askable = start.filter((r) => r.departmentId && r.description.trim().length >= 3);
      const { results } = askable.length
        ? await bulkApi.suggest(askable.map((r) => ({ departmentId: r.departmentId!, description: r.description, ...(r.name ? { name: r.name } : {}) })))
        : { results: [] };
      const byKey = new Map(askable.map((r, i) => [r.key, results.find((x) => x.index === i)]));
      setRows(start.map((r) => (byKey.has(r.key) ? withSuggestion(r, byKey.get(r.key) ?? {}) : { ...r, status: "new" })));
    } catch (err) {
      setRows(start.map((r) => ({ ...r, status: "new" })));
      setError(err instanceof ApiRequestError ? err.message : "Suggest did not answer. Try again.");
    } finally {
      setBusy(null);
    }
  };

  /** A changed department needs that row's goals read again: they belong to a department. */
  const resuggest = async (row: BulkRow, departmentId: string) => {
    patch(row.key, (r) => ({ ...r, departmentId, departmentInput: "", state: null, status: "suggesting", message: undefined, errorField: undefined }));
    if (row.description.trim().length < 3) {
      patch(row.key, (r) => ({ ...r, status: "new" }));
      return;
    }
    try {
      const { suggestion } = await goalsApi.suggest({ departmentId, description: row.description, ...(row.name ? { name: row.name } : {}) });
      patch(row.key, (r) => withSuggestion({ ...r, departmentId }, { suggestion }));
    } catch (err) {
      patch(row.key, (r) => withSuggestion(r, { error: err instanceof ApiRequestError ? err.message : undefined }));
    }
  };

  const createAll = async () => {
    if (!rows || ready.length === 0 || busy) return;
    setBusy("create");
    setError(null);
    try {
      const { results } = await bulkApi.create(toBulkRequest(ready));
      const next = applyResults(rows, ready, results);
      setRows(next);
      const ok = results.filter((r) => r.ok);
      onCreated(ok.map((r) => r.username));
      const failed = results.length - ok.length;
      if (ok.length) notify.success(`${ok.length} ${ok.length === 1 ? "person" : "people"} created and assigned. Copy their passwords now: they are shown once.`);
      if (failed) notify.error(`${failed} ${failed === 1 ? "row" : "rows"} not created. Fix the highlighted fields and press Create again.`);
      const noAssessment = ok.filter((r) => r.issueError).length;
      if (noAssessment) notify.info(`${noAssessment} created without an assessment. Their learner page offers Assign assessment.`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Nothing was created. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const copyAll = async () => {
    if (!rows) return;
    try {
      await navigator.clipboard.writeText(credentialsCsv(rows, window.location.origin));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error("Could not copy. Select the table and copy it instead.");
    }
  };

  const startOver = async () => {
    if (created.length && !copied) {
      const ok = await confirm({
        title: `Clear ${created.length} generated ${created.length === 1 ? "password" : "passwords"}?`,
        body: "They are not shown again. Copy all first if you still need them.",
        confirmLabel: "Clear the list",
        variant: "destructive",
      });
      if (!ok) return;
    }
    setRows(null);
    setText("");
    setError(null);
    setCopied(false);
  };

  return (
    <div className="space-y-6">
      {error && <FormAlert>{error}</FormAlert>}

      {!rows ? (
        <div className="max-w-3xl space-y-3">
          <label htmlFor={`${uid}-paste`} className="text-sm font-medium">
            One person per line: name, username, department, one line about them
          </label>
          <textarea
            id={`${uid}-paste`}
            aria-describedby={`${uid}-paste-hint`}
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            spellCheck={false}
            className="w-full rounded-md border border-input bg-surface px-3 py-2 font-mono text-xs leading-relaxed placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
          />
          <p id={`${uid}-paste-hint`} className="text-xs text-muted-foreground">
            Paste from a sheet or type. Username is optional; department can be a name like PM.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" disabled={preview.length === 0} loading={busy === "suggest"} onClick={() => void suggestAll()}>
              {busy !== "suggest" && <Sparkles aria-hidden="true" />}
              Suggest all
            </Button>
            <span className="font-mono text-xs text-muted-foreground" aria-live="polite">
              {preview.length === 0 ? "No rows yet" : `${preview.length} ${preview.length === 1 ? "person" : "people"}`}
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-surface">
            <table className="w-full min-w-[960px] text-sm">
              <caption className="sr-only">People to onboard. Edit any cell before creating.</caption>
              <thead className="border-b bg-surface-sunken/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Name</th>
                  <th scope="col" className="px-3 py-2 font-medium">Username</th>
                  <th scope="col" className="px-3 py-2 font-medium">Department</th>
                  <th scope="col" className="px-3 py-2 font-medium">Track</th>
                  <th scope="col" className="w-20 px-3 py-2 font-medium">Level</th>
                  <th scope="col" className="w-20 px-3 py-2 font-medium">Hours</th>
                  <th scope="col" className="px-3 py-2 font-medium">Top goals</th>
                  <th scope="col" className="w-10 px-2 py-2"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <BulkRowView
                    key={row.key}
                    row={row}
                    errors={errors[i] ?? {}}
                    catalog={catalog}
                    departments={departments}
                    disabled={busy === "create"}
                    onChange={(change) => patch(row.key, change)}
                    onDepartment={(id) => void resuggest(row, id)}
                    onRetry={() => row.departmentId && void resuggest(row, row.departmentId)}
                    onRemove={() => {
                      setRows((current) => current?.filter((r) => r.key !== row.key) ?? null);
                      notify.undo(`${row.name || `Line ${row.line}`} removed from the list.`, {
                        onUndo: () => setRows((current) => (current ? [...current.slice(0, i), row, ...current.slice(i)] : current)),
                      });
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" disabled={ready.length === 0 || busy !== null} loading={busy === "create"} onClick={() => void createAll()}>
              Create &amp; assign all{ready.length ? ` (${ready.length})` : ""}
            </Button>
            {created.length > 0 && (
              <Button type="button" variant="outline" onClick={() => void copyAll()}>
                {copied ? <Check aria-hidden="true" /> : <ClipboardCopy aria-hidden="true" />}
                {copied ? "Copied" : `Copy all (${created.length})`}
              </Button>
            )}
            <Button type="button" variant="ghost" disabled={busy !== null} onClick={() => void startOver()}>
              Start over
            </Button>
            <span className="font-mono text-xs text-muted-foreground" role="status" aria-live="polite">
              {busy === "suggest"
                ? "Reading descriptions…"
                : [created.length ? `${created.length} created` : null, blocked > 0 ? `${blocked} need a fix` : null].filter(Boolean).join(" · ")}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function BulkRowView({
  row,
  errors,
  catalog,
  departments,
  disabled,
  onChange,
  onDepartment,
  onRetry,
  onRemove,
}: {
  row: BulkRow;
  errors: Record<string, string>;
  catalog: Catalog;
  departments: { id: string; name: string }[];
  disabled: boolean;
  onChange: (change: Partial<BulkRow> | ((row: BulkRow) => BulkRow)) => void;
  onDepartment: (id: string) => void;
  onRetry: () => void;
  onRemove: () => void;
}) {
  const id = useId();
  const done = row.status === "created";
  const locked = disabled || done || row.status === "suggesting";
  const state = row.state;
  const tracks = catalog.tracks.filter((t) => t.departmentId === row.departmentId && !t.archived);
  const goals = state ? sortedGoals(state.goals) : [];
  const updateState = (patch: Partial<NonNullable<BulkRow["state"]>>) => onChange((r) => (r.state ? { ...r, state: { ...r.state, ...patch } } : r));
  const err = (field: string) =>
    errors[field] ? (
      <p id={`${id}-${field}`} className="mt-1 text-xs text-destructive">
        {errors[field]}
      </p>
    ) : null;
  const invalid = (field: string) => (errors[field] ? { "aria-invalid": true as const, "aria-describedby": `${id}-${field}` } : {});

  return (
    <tr className={cn("border-b align-top last:border-b-0", done && "bg-summit/[0.05]", row.status === "failed" && "bg-destructive/[0.04]")}>
      <td className="px-3 py-2">
        <input aria-label={`Name, line ${row.line}`} value={row.name} disabled={locked} onChange={(e) => onChange({ name: e.target.value })} className={cellInput} {...invalid("name")} />
        {err("name")}
        <input
          aria-label={`One line about them, line ${row.line}`}
          value={row.description}
          disabled={locked}
          maxLength={600}
          placeholder="One line about them"
          title={row.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className={cn(cellInput, "mt-1 h-7 text-xs text-muted-foreground")}
          {...invalid("description")}
        />
        {err("description")}
      </td>
      <td className="px-3 py-2">
        <input
          aria-label={`Username, line ${row.line}`}
          value={row.username}
          disabled={locked}
          spellCheck={false}
          autoCapitalize="none"
          onChange={(e) => onChange({ username: e.target.value.trim().toLowerCase(), usernameAuto: false })}
          className={cn(cellInput, "font-mono")}
          {...invalid("username")}
        />
        {err("username")}
        {done && row.password && (
          <p className="mt-1 font-mono text-xs">
            <span className="text-muted-foreground">password </span>
            <span className="select-all">{row.password}</span>
          </p>
        )}
      </td>
      <td className="px-3 py-2">
        <select
          aria-label={`Department, line ${row.line}`}
          value={row.departmentId ?? ""}
          disabled={locked}
          onChange={(e) => e.target.value && onDepartment(e.target.value)}
          className={cellInput}
          {...invalid("department")}
        >
          {!row.departmentId && <option value="">{row.departmentInput || "Pick one"}</option>}
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        {err("department")}
      </td>
      {row.status === "suggesting" ? (
        <td colSpan={4} className="px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5" role="status">
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            Reading the description…
          </span>
        </td>
      ) : !state ? (
        <td colSpan={4} className="px-3 py-2 text-xs">
          <span className={row.message ? "text-destructive" : "text-muted-foreground"}>{row.message ?? (errors.description || errors.department ? "Fix the row, then Suggest." : "Not suggested yet.")}</span>{" "}
          {row.departmentId && row.description.trim().length >= 3 && (
            <Button type="button" variant="link" size="sm" className="h-auto px-0" disabled={disabled} onClick={onRetry}>
              {row.status === "suggest-failed" ? "Try again" : "Suggest"}
            </Button>
          )}
        </td>
      ) : (
        <>
          <td className="px-3 py-2">
            <select aria-label={`Track, line ${row.line}`} value={state.trackId ?? ""} disabled={locked} onChange={(e) => updateState({ trackId: e.target.value || null })} className={cellInput} {...invalid("trackId")}>
              <option value="">No track</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {err("trackId")}
          </td>
          <td className="px-3 py-2">
            <select
              aria-label={`Level, line ${row.line}`}
              value={state.level ? String(state.level) : ""}
              disabled={locked}
              onChange={(e) => updateState({ level: e.target.value ? (Number(e.target.value) as Slider) : null, levelTouched: true })}
              className={cellInput}
            >
              <option value="">–</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </td>
          <td className="px-3 py-2">
            <select aria-label={`Hours a week, line ${row.line}`} value={String(state.hoursPerWeek ?? 15)} disabled={locked} onChange={(e) => updateState({ hoursPerWeek: Number(e.target.value) })} className={cellInput}>
              {[...new Set([5, 10, 15, 20, 25, 30, 40, state.hoursPerWeek ?? 15])].sort((a, b) => a - b).map((h) => (
                <option key={h} value={h}>
                  {h} h
                </option>
              ))}
            </select>
          </td>
          <td className="px-3 py-2">
            <ul className="flex max-w-80 flex-wrap gap-1" aria-label={`Goals, line ${row.line}`}>
              {goals.slice(0, 3).map((g) => (
                <li key={g.key}>
                  <span className="inline-flex max-w-60 items-center gap-1 rounded-md border bg-surface-sunken/60 py-0.5 pl-2 pr-0.5 text-xs" title={g.outcome}>
                    <span className="truncate">{g.outcome.replace(/^Can /, "")}</span>
                    {!locked && goals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onChange((r) => (r.state ? { ...r, state: withGoals(r.state, r.state.goals.filter((x) => x.key !== g.key)) } : r))}
                        className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-strong"
                      >
                        <X className="size-3" aria-hidden="true" />
                        <span className="sr-only">Remove goal {g.outcome}</span>
                      </button>
                    )}
                  </span>
                </li>
              ))}
              {goals.length > 3 && <li className="self-center font-mono text-[11px] text-muted-foreground">+{goals.length - 3}</li>}
            </ul>
            {done && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-summit-strong">
                <Check className="size-3.5" aria-hidden="true" />
                {row.issueError ? "Created. Assessment not issued." : "Created and assigned"}
              </p>
            )}
            {row.status === "failed" && errors.row && <p className="mt-1 text-xs text-destructive">{errors.row}</p>}
          </td>
        </>
      )}
      <td className="px-2 py-2">
        {!done && (
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            <span className="sr-only">Remove {row.name || `line ${row.line}`} from the list</span>
          </button>
        )}
      </td>
    </tr>
  );
}
