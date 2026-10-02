import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, X } from "lucide-react";

import { cellRef, colName, parseRef, type CellValue } from "@shared/sheet";
import { gradeTask } from "@shared/tasks";

import { editorScopeProps } from "@/features/proctor/editorScope";
import { cn } from "@/lib/utils";

import {
  evaluateWithEntries,
  formatCellValue,
  isErrorValue,
  keyToMove,
  looksLikeHeader,
  moveInSheet,
  ragOf,
  sheetShape,
  type Rag,
} from "./sheetGrid";
import type { TaskComponentProps } from "./types";

const RAG_CLASSES: Record<Rag, string> = {
  red: "bg-destructive/[0.16] font-medium",
  amber: "bg-warning/[0.24] font-medium",
  green: "bg-summit/[0.18] font-medium",
};

/**
 * Excel: a little spreadsheet. Data cells are read-only and muted; editable cells are inputs that
 * show their computed value until focused, when they show what was typed (a value or a formula).
 * The formula bar above says which cell is active and holds its formula, as in Excel.
 *
 * Arrow keys, Tab and Enter move between editable cells (left/right only at the text's edge so the
 * caret still moves inside a formula). The grid scrolls sideways inside its own box, never the page.
 */
export function ExcelTask({ task, value, onChange, readOnly, answer, idPrefix }: TaskComponentProps<"excel">) {
  const cells = useMemo(() => value?.cells ?? {}, [value]);
  const editable = useMemo(() => new Set(task.editable.map((ref) => normalise(ref))), [task.editable]);
  const { rows, cols } = sheetShape(task.grid, task.editable);
  const { values, errors } = useMemo(() => evaluateWithEntries(task.grid, task.editable, cells), [task.grid, task.editable, cells]);
  const solved = useMemo(
    () => (answer ? evaluateWithEntries(answer.grid, answer.editable, answer.solution) : null),
    [answer],
  );
  const grade = useMemo(() => (answer ? gradeTask(answer, value ?? { kind: "excel", cells: {} }) : null), [answer, value]);
  const header = looksLikeHeader(task.grid[0]);

  const [active, setActive] = useState<string>(() => normalise(task.editable[0] ?? "A1"));
  const [focused, setFocused] = useState<string | null>(null);
  const [barFocused, setBarFocused] = useState(false);
  const inputs = useRef(new Map<string, HTMLInputElement>());

  const rawOf = (ref: string) => {
    if (editable.has(ref)) return cells[ref] ?? "";
    const at = parseRef(ref);
    return at ? (task.grid[at.row]?.[at.col] ?? "") : "";
  };
  const valueOf = (ref: string): CellValue => {
    const at = parseRef(ref);
    return at ? (values[at.row]?.[at.col] ?? null) : null;
  };

  const setCell = (ref: string, raw: string) => {
    if (readOnly) return;
    onChange({ kind: "excel", cells: { ...cells, [ref]: raw } });
  };

  const focusCell = (ref: string) => {
    const el = inputs.current.get(ref);
    if (!el) return;
    el.focus();
    el.select();
  };

  const onKeyDown = (ref: string) => (event: KeyboardEvent<HTMLInputElement>) => {
    const el = event.currentTarget;
    const move = keyToMove(event.key, event.shiftKey, { start: el.selectionStart, end: el.selectionEnd, length: el.value.length });
    if (!move) return;
    const to = moveInSheet(task.editable, ref, move);
    if (!to) return; // Tab past the last cell leaves the grid as usual.
    event.preventDefault();
    focusCell(to);
  };

  const activeRaw = rawOf(active);
  const activeValue = valueOf(active);
  const activeEditable = editable.has(active);
  const checkCells = new Set(task.checks.map((c) => normalise(c.cell)));
  const checkResult = useMemo(() => {
    if (!answer || !grade) return new Map<string, boolean>();
    return new Map(answer.checks.map((c, i) => [normalise(c.cell), grade.detail[i]?.endsWith("correct") ?? false]));
  }, [answer, grade]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Fill the {task.editable.length === 1 ? "editable cell" : `${task.editable.length} editable cells`} — a value or a formula
        starting with <span className="font-mono">=</span>. Arrow keys, Tab and Enter move between them.
      </p>

      <div {...editorScopeProps()} className="overflow-hidden rounded-md border bg-surface">
        {/* Formula bar */}
        <div className="flex items-stretch border-b bg-surface-sunken/60 text-sm">
          <span
            className="flex w-14 shrink-0 items-center justify-center border-r font-mono text-xs font-medium"
            aria-hidden="true"
          >
            {active}
          </span>
          <span className="flex shrink-0 items-center px-2 font-mono text-xs italic text-muted-foreground" aria-hidden="true">
            fx
          </span>
          <label htmlFor={`${idPrefix}-fx`} className="sr-only">
            Formula bar, cell {active}
          </label>
          <input
            id={`${idPrefix}-fx`}
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={activeRaw}
            readOnly={readOnly || !activeEditable}
            onFocus={() => setBarFocused(true)}
            onBlur={() => setBarFocused(false)}
            onChange={(event) => setCell(active, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                focusCell(active);
              }
            }}
            className="min-w-0 flex-1 bg-transparent px-2 py-1.5 font-mono text-xs read-only:text-muted-foreground focus-visible:bg-surface focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong"
          />
          <span
            className={cn(
              "flex max-w-[40%] shrink-0 items-center truncate border-l px-2 font-mono text-xs tabular",
              isErrorValue(activeValue) ? "text-destructive" : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {activeRaw.startsWith("=") ? `= ${formatCellValue(activeValue)}` : ""}
          </span>
        </div>

        {/* Grid */}
        <div className="relative max-w-full overflow-x-auto">
          <table className="w-max min-w-full border-collapse text-sm" aria-label="Spreadsheet">
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-10 w-9 border-b border-r bg-surface-sunken px-1 py-1">
                  <span className="sr-only">Row</span>
                </th>
                {Array.from({ length: cols }, (_, c) => (
                  <th
                    key={c}
                    scope="col"
                    className={cn(
                      "border-b border-r bg-surface-sunken px-2 py-1 text-center font-mono text-xs font-normal text-muted-foreground last:border-r-0",
                      parseRef(active)?.col === c && "bg-primary/[0.12] text-foreground",
                    )}
                  >
                    {colName(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, r) => (
                <tr key={r}>
                  <th
                    scope="row"
                    className={cn(
                      "sticky left-0 z-10 border-r border-b bg-surface-sunken px-1 py-1 text-center font-mono text-xs font-normal text-muted-foreground",
                      parseRef(active)?.row === r && "bg-primary/[0.12] text-foreground",
                    )}
                  >
                    {r + 1}
                  </th>
                  {Array.from({ length: cols }, (_, c) => {
                    const ref = cellRef(r, c);
                    const v = values[r]?.[c] ?? null;
                    const shown = formatCellValue(v);
                    const error = Boolean(errors[ref]) || isErrorValue(v);
                    const rag = ragOf(v);
                    const isEditable = editable.has(ref);
                    const result = checkResult.get(ref);
                    const numeric = typeof v === "number";

                    if (!isEditable) {
                      return (
                        <td
                          key={c}
                          title={(task.grid[r]?.[c] ?? "").startsWith("=") ? `${ref} ${task.grid[r][c]}` : undefined}
                          className={cn(
                            "max-w-[14rem] truncate border-r border-b px-2 py-1.5 whitespace-nowrap last:border-r-0",
                            "bg-surface-sunken/40 text-muted-foreground",
                            numeric && "text-right tabular",
                            header && r === 0 && "font-medium text-foreground",
                            rag && cn(RAG_CLASSES[rag], "text-foreground"),
                            error && "text-destructive",
                          )}
                        >
                          {shown}
                        </td>
                      );
                    }

                    const showRaw = focused === ref || (barFocused && active === ref);
                    return (
                      <td
                        key={c}
                        className={cn(
                          "relative border-r border-b p-0 last:border-r-0",
                          rag && !showRaw ? RAG_CLASSES[rag] : "bg-surface",
                          result === true && "outline-2 -outline-offset-2 outline-summit",
                          result === false && "outline-2 -outline-offset-2 outline-destructive",
                        )}
                      >
                        <input
                          ref={(el) => {
                            if (el) inputs.current.set(ref, el);
                            else inputs.current.delete(ref);
                          }}
                          type="text"
                          autoComplete="off"
                          spellCheck={false}
                          aria-label={`Cell ${ref}${checkCells.has(ref) ? ", checked" : ""}`}
                          aria-description={!showRaw && cells[ref]?.startsWith("=") ? `Formula ${cells[ref]}` : undefined}
                          aria-invalid={error || undefined}
                          value={showRaw ? (cells[ref] ?? "") : shown}
                          readOnly={readOnly}
                          onFocus={() => {
                            setFocused(ref);
                            setActive(ref);
                          }}
                          onBlur={() => setFocused((f) => (f === ref ? null : f))}
                          onChange={(event) => setCell(ref, event.target.value)}
                          onKeyDown={onKeyDown(ref)}
                          className={cn(
                            "block w-28 min-w-full bg-transparent px-2 py-1.5",
                            "focus:outline-solid focus:outline-2 focus:-outline-offset-2 focus:outline-primary-strong",
                            showRaw ? "font-mono text-xs" : numeric && "text-right tabular",
                            !showRaw && error && "text-destructive",
                          )}
                        />
                        {result !== undefined && (
                          <span className="sr-only">{result ? "Correct" : "Not correct"}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {Object.keys(errors).some((ref) => editable.has(ref)) && !answer && (
        <p className="text-xs text-destructive">
          {Object.entries(errors)
            .filter(([ref]) => editable.has(ref))
            .map(([ref, err]) => `${ref} gives ${err}`)
            .join(" · ")}
          {" — check the formula's names and ranges."}
        </p>
      )}

      {answer && grade && (
        <div className="space-y-4 rounded-md border border-summit/40 bg-summit/[0.05] px-4 py-4 text-sm">
          <div>
            <p className="font-semibold">Checks</p>
            <ul className="mt-1.5 space-y-1">
              {grade.detail.map((line, i) => {
                const ok = line.endsWith("correct");
                return (
                  <li key={i} className="flex items-start gap-2">
                    {ok ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-summit-strong" aria-hidden="true" />
                    ) : (
                      <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                    )}
                    <span>
                      <span className="sr-only">{ok ? "Passed: " : "Failed: "}</span>
                      {line}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <p className="font-semibold">A solution</p>
            <dl className="mt-1.5 space-y-1">
              {answer.editable.map((ref) => {
                const formula = answer.solution[ref] ?? "";
                const at = parseRef(ref);
                const result = at && solved ? formatCellValue(solved.values[at.row]?.[at.col] ?? null) : "";
                return (
                  <div key={ref} className="flex flex-wrap items-baseline gap-x-2 font-mono text-xs">
                    <dt className="font-medium">{ref}</dt>
                    <dd className="break-all">
                      {formula}
                      {formula.startsWith("=") && result !== "" && <span className="text-muted-foreground"> → {result}</span>}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
          {answer.explanation && <p className="text-muted-foreground">{answer.explanation}</p>}
        </div>
      )}
    </div>
  );
}

function normalise(ref: string): string {
  const at = parseRef(ref);
  return at ? cellRef(at.row, at.col) : ref.toUpperCase();
}
