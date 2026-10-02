import { useState } from "react";
import { Calculator } from "lucide-react";

import { InlineText } from "@/components/content/RichText";
import { inputClasses } from "@/components/ui/input";
import { editorScopeProps } from "@/features/proctor/editorScope";
import { cn } from "@/lib/utils";

import { evaluateExpression, formatResult } from "./calculator";
import type { TaskComponentProps } from "./types";

/** "1,234.5" → 1234.5; "" → null; anything unparseable → null. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/**
 * Calculate: a data table, one numeric field per answer (with its unit), and a small calculator.
 *
 * Fields keep the learner's own text while they type ("12." is not yet a number) and report the
 * parsed number upward. The calculator is a safe little parser (`calculator.ts`), never `eval`.
 */
export function CalculateTask({ task, value, onChange, readOnly, answer, idPrefix }: TaskComponentProps<"calculate">) {
  const values = value?.values ?? {};
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(task.fields.map((f) => [f.id, values[f.id] == null ? "" : String(values[f.id])])),
  );

  const setField = (id: string, raw: string) => {
    setDrafts((current) => ({ ...current, [id]: raw }));
    const next = { ...Object.fromEntries(task.fields.map((f) => [f.id, values[f.id] ?? null])), [id]: parseAmount(raw) };
    onChange({ kind: "calculate", values: next });
  };

  return (
    <div className="space-y-6">
      {task.table && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[20rem] text-sm">
            <thead className="bg-surface-sunken">
              <tr>
                {task.table.columns.map((column) => (
                  <th key={column} scope="col" className="px-3 py-2 text-left font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {task.table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="px-3 py-2 tabular">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div {...editorScopeProps()} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <fieldset className="space-y-4">
          <legend className="sr-only">Your answers</legend>
          {task.fields.map((field) => {
            const id = `${idPrefix}-calc-${field.id}`;
            const expected = answer?.fields.find((f) => f.id === field.id);
            const got = values[field.id];
            const right = expected && typeof got === "number" && Math.abs(got - expected.answer) <= expected.tolerance + 1e-9;
            return (
              <div key={field.id}>
                <label htmlFor={id} className="text-sm font-medium">
                  <InlineText text={field.label} />
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    id={id}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={drafts[field.id] ?? ""}
                    readOnly={readOnly}
                    onChange={(event) => setField(field.id, event.target.value)}
                    aria-invalid={drafts[field.id] && parseAmount(drafts[field.id]) === null ? true : undefined}
                    className={cn(inputClasses, "max-w-[14rem] font-mono tabular read-only:opacity-90")}
                  />
                  {field.unit && <span className="font-mono text-sm text-muted-foreground">{field.unit}</span>}
                </div>
                {drafts[field.id] && parseAmount(drafts[field.id]) === null && (
                  <p className="mt-1 text-xs text-destructive">Enter a number, like 12.5</p>
                )}
                {expected && (
                  <p className={cn("mt-1 font-mono text-xs", right ? "text-summit-strong" : "text-muted-foreground")}>
                    {right ? "Correct" : `Expected ${expected.answer}${expected.unit ? ` ${expected.unit}` : ""}`}
                  </p>
                )}
              </div>
            );
          })}
        </fieldset>

        {!readOnly && <CalculatorPad idPrefix={idPrefix} />}
      </div>

      {answer?.explanation && <p className="text-sm text-muted-foreground">{answer.explanation}</p>}
    </div>
  );
}

function CalculatorPad({ idPrefix }: { idPrefix: string }) {
  const [expression, setExpression] = useState("");
  const result = expression.trim() ? evaluateExpression(expression) : null;
  const id = `${idPrefix}-calculator`;

  return (
    <div className="rounded-md border bg-surface-sunken/60 px-3 py-3">
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium">
        <Calculator className="h-4 w-4" aria-hidden="true" />
        Calculator
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="(1200 - 300) / 4"
        value={expression}
        onChange={(event) => setExpression(event.target.value)}
        aria-describedby={`${id}-result`}
        className={cn(inputClasses, "mt-2 font-mono")}
      />
      <p id={`${id}-result`} aria-live="polite" className="mt-2 min-h-5 font-mono text-sm tabular">
        {result === null ? (
          <span className="text-muted-foreground">+ − × ÷ and brackets</span>
        ) : result.ok ? (
          <>= {formatResult(result.value)}</>
        ) : (
          <span className="text-muted-foreground">{result.error}</span>
        )}
      </p>
    </div>
  );
}
