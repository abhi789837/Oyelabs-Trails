import { useEffect, useState } from "react";
import { Plus, SlidersHorizontal, X } from "lucide-react";

import {
  MAX_FILTER_CONDITIONS,
  OPERATOR_LABELS,
  operatorArity,
  type FilterCombinator,
  type FilterCondition,
  type FilterOperator,
  type FilterSet,
} from "@shared/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TagInput } from "@/components/ui/tag-input";
import { cn } from "@/lib/utils";
import type { TableFieldDef, TableFieldType } from "../types";

/**
 * `field · operator · value` rows, joined by All or Any.
 *
 * The quick chips answer the questions the table was designed around. This answers the ones it
 * was not — "learners with no last login who are still active" — without needing a new chip, a new
 * prop and a deploy. It is deliberately the second-class citizen of the toolbar: one button, off
 * to the side, opening into a form rather than sitting in the chip row.
 *
 * It edits a **draft** and commits on Apply. Live editing would run a filter against a half-typed
 * condition on every keystroke, and "field chosen, operator chosen, value still empty" is a state
 * that means nothing yet.
 */

export interface AdvancedFilterProps<TRow> {
  fields: readonly TableFieldDef<TRow>[];
  value: FilterSet;
  onChange: (next: FilterSet) => void;
}

const OPERATORS_BY_TYPE: Record<TableFieldType, FilterOperator[]> = {
  string: ["contains", "notContains", "eq", "ne", "startsWith", "endsWith", "in", "notIn", "isNull", "isNotNull"],
  number: ["eq", "ne", "gt", "gte", "lt", "lte", "between", "isNull", "isNotNull"],
  date: ["gte", "lte", "gt", "lt", "between", "isNull", "isNotNull"],
  boolean: ["eq", "ne", "isNull", "isNotNull"],
  enum: ["eq", "ne", "in", "notIn", "isNull", "isNotNull"],
};

function operatorsFor<TRow>(field: TableFieldDef<TRow>): FilterOperator[] {
  const allowed = OPERATORS_BY_TYPE[field.type];
  return field.operators ? allowed.filter((operator) => field.operators!.includes(operator)) : allowed;
}

/** A fresh row for a field, with a value shaped for the operator it starts on. */
function blankCondition<TRow>(field: TableFieldDef<TRow>, operator: FilterOperator): FilterCondition {
  switch (operatorArity(operator)) {
    case "none":
      return { field: field.name, operator } as FilterCondition;
    case "list":
      return { field: field.name, operator, value: [] } as unknown as FilterCondition;
    case "range":
      return { field: field.name, operator, value: [null, null] } as unknown as FilterCondition;
    default: {
      const empty = field.type === "boolean" ? true : field.type === "number" || field.type === "date" ? 0 : "";
      return { field: field.name, operator, value: empty } as FilterCondition;
    }
  }
}

/**
 * A row is ready when its value says something. An empty text box or an empty `in` list is a row
 * the admin started and did not finish — dropping it on Apply is kinder than filtering by "".
 */
function isComplete(condition: FilterCondition): boolean {
  switch (operatorArity(condition.operator)) {
    case "none":
      return true;
    case "list":
      return Array.isArray(condition.value) && condition.value.length > 0;
    case "range":
      return Array.isArray(condition.value) && (condition.value[0] !== null || condition.value[1] !== null);
    default:
      return condition.value !== "" && condition.value !== undefined && condition.value !== null;
  }
}

const DATE_INPUT_FORMAT = (value: unknown): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export function AdvancedFilter<TRow>({ fields, value, onChange }: AdvancedFilterProps<TRow>) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterSet>(value);

  // Reopening shows what is actually applied, not what was abandoned last time.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const usable = fields.filter((field) => field.filterable !== false);
  if (usable.length === 0) return null;

  const setCondition = (index: number, next: FilterCondition) => {
    setDraft((current) => ({
      ...current,
      conditions: current.conditions.map((condition, position) => (position === index ? next : condition)),
    }));
  };

  const addRow = () => {
    const field = usable[0]!;
    setDraft((current) => ({
      ...current,
      conditions: [...current.conditions, blankCondition(field, operatorsFor(field)[0]!)],
    }));
  };

  const removeRow = (index: number) => {
    setDraft((current) => ({ ...current, conditions: current.conditions.filter((_, position) => position !== index) }));
  };

  const apply = () => {
    onChange({ combinator: draft.combinator, conditions: draft.conditions.filter(isComplete) });
    setOpen(false);
  };

  const activeCount = value.conditions.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={activeCount ? `Advanced filter, ${activeCount} conditions. Edit` : "Advanced filter"}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors duration-[120ms]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
            activeCount
              ? "border-primary/40 bg-primary/10 text-primary-strong"
              : "border-dashed border-input text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <SlidersHorizontal aria-hidden="true" className="size-3.5" />
          Advanced
          {activeCount > 0 && <span className="font-mono tabular">{activeCount}</span>}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[min(34rem,calc(100vw-2rem))] p-3">
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span id="advanced-combinator-label">Match</span>
          <div role="radiogroup" aria-labelledby="advanced-combinator-label" className="inline-flex rounded-md border p-0.5">
            {(["and", "or"] as FilterCombinator[]).map((combinator) => (
              <button
                key={combinator}
                type="button"
                role="radio"
                aria-checked={draft.combinator === combinator}
                tabIndex={draft.combinator === combinator ? 0 : -1}
                onClick={() => setDraft((current) => ({ ...current, combinator }))}
                className={cn(
                  "rounded-[4px] px-2 py-0.5 transition-colors duration-[120ms]",
                  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-strong",
                  draft.combinator === combinator
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-foreground",
                )}
              >
                {combinator === "and" ? "all" : "any"}
              </button>
            ))}
          </div>
          <span>of the following</span>
        </div>

        <div className="space-y-2">
          {draft.conditions.length === 0 && (
            <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
              No conditions yet.
            </p>
          )}

          {draft.conditions.map((condition, index) => {
            const field = usable.find((entry) => entry.name === condition.field) ?? usable[0]!;
            const operators = operatorsFor(field);
            const arity = operatorArity(condition.operator);

            return (
              <div key={index} className="flex flex-wrap items-center gap-1.5">
                <select
                  aria-label={`Field for condition ${index + 1}`}
                  value={field.name}
                  onChange={(event) => {
                    const next = usable.find((entry) => entry.name === event.target.value)!;
                    setCondition(index, blankCondition(next, operatorsFor(next)[0]!));
                  }}
                  className={selectClasses}
                >
                  {usable.map((entry) => (
                    <option key={entry.name} value={entry.name}>
                      {entry.label}
                    </option>
                  ))}
                </select>

                <select
                  aria-label={`Operator for condition ${index + 1}`}
                  value={condition.operator}
                  onChange={(event) => setCondition(index, blankCondition(field, event.target.value as FilterOperator))}
                  className={selectClasses}
                >
                  {operators.map((operator) => (
                    <option key={operator} value={operator}>
                      {OPERATOR_LABELS[operator]}
                    </option>
                  ))}
                </select>

                <div className="min-w-[8rem] flex-1">
                  <ValueEditor
                    field={field}
                    condition={condition}
                    index={index}
                    onChange={(next) => setCondition(index, next)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  aria-label={`Remove condition ${index + 1}`}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors duration-[120ms] hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
                {arity === "none" && <span className="sr-only">This condition needs no value.</span>}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addRow}
            disabled={draft.conditions.length >= MAX_FILTER_CONDITIONS}
          >
            <Plus aria-hidden="true" />
            Add condition
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDraft({ combinator: "and", conditions: [] })}
              disabled={draft.conditions.length === 0}
            >
              Clear
            </Button>
            <Button type="button" size="sm" onClick={apply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const selectClasses =
  "h-8 rounded-md border border-input bg-surface px-2 text-xs transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong";

/** The right control for the operator's arity and the field's type. */
function ValueEditor<TRow>({
  field,
  condition,
  index,
  onChange,
}: {
  field: TableFieldDef<TRow>;
  condition: FilterCondition;
  index: number;
  onChange: (next: FilterCondition) => void;
}) {
  const label = `Value for condition ${index + 1}`;
  const arity = operatorArity(condition.operator);

  if (arity === "none") {
    return <span className="block text-xs text-muted-foreground">—</span>;
  }

  if (arity === "range") {
    const [from, to] = condition.value as [number | null, number | null];
    const set = (next: [number | null, number | null]) => onChange({ ...condition, value: next } as FilterCondition);

    if (field.type === "date") {
      return (
        <div className="flex items-center gap-1.5">
          <DateBox label={`${label}, from`} value={from} onChange={(next) => set([next, to])} />
          <DateBox label={`${label}, to`} value={to} onChange={(next) => set([from, next])} />
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <NumberInput value={from} onChange={(next) => set([next, to])} aria-label={`${label}, from`} className="h-8 text-xs" containerClassName="min-w-0 flex-1" />
        <NumberInput value={to} onChange={(next) => set([from, next])} aria-label={`${label}, to`} className="h-8 text-xs" containerClassName="min-w-0 flex-1" />
      </div>
    );
  }

  if (arity === "list") {
    const values = (condition.value as string[]) ?? [];
    const id = `advanced-value-${index}`;
    return (
      <>
        {/* `TagInput` labels its inner field by `id`, so the label has to be real — hidden, but
            present, or the control reads out as "edit text" with nothing attached. */}
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <TagInput
          id={id}
          value={values}
          onChange={(next) => onChange({ ...condition, value: next } as FilterCondition)}
          suggestions={field.options?.map((option) => option.value)}
          placeholder="Add a value"
          max={20}
          className="min-h-8 text-xs"
        />
      </>
    );
  }

  if (field.type === "enum") {
    return (
      <select
        aria-label={label}
        value={String(condition.value ?? "")}
        onChange={(event) => onChange({ ...condition, value: event.target.value } as FilterCondition)}
        className={cn(selectClasses, "w-full")}
      >
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "boolean") {
    return (
      <select
        aria-label={label}
        value={condition.value === true ? "true" : "false"}
        onChange={(event) => onChange({ ...condition, value: event.target.value === "true" } as FilterCondition)}
        className={cn(selectClasses, "w-full")}
      >
        <option value="true">{field.trueLabel ?? "Yes"}</option>
        <option value="false">{field.falseLabel ?? "No"}</option>
      </select>
    );
  }

  if (field.type === "date") {
    return (
      <DateBox
        label={label}
        value={typeof condition.value === "number" ? condition.value : null}
        onChange={(next) => onChange({ ...condition, value: next ?? 0 } as FilterCondition)}
      />
    );
  }

  if (field.type === "number") {
    return (
      <NumberInput
        value={typeof condition.value === "number" ? condition.value : null}
        onChange={(next) => onChange({ ...condition, value: next ?? 0 } as FilterCondition)}
        aria-label={label}
        className="h-8 text-xs"
        containerClassName="min-w-0"
      />
    );
  }

  return (
    <Input
      value={String(condition.value ?? "")}
      onChange={(event) => onChange({ ...condition, value: event.target.value } as FilterCondition)}
      aria-label={label}
      placeholder="Value"
      className="h-8 text-xs"
    />
  );
}

/**
 * The native date input, on purpose: it is keyboard-operable, localised, and already has a picker
 * every browser ships. A second hand-written calendar inside a popover inside a popover would be
 * worse in every way that matters.
 */
function DateBox({ label, value, onChange }: { label: string; value: number | null; onChange: (next: number | null) => void }) {
  return (
    <input
      type="date"
      aria-label={label}
      value={DATE_INPUT_FORMAT(value)}
      onChange={(event) => {
        if (!event.target.value) return onChange(null);
        // `new Date("2026-01-05")` is UTC midnight; splitting keeps it local, which is what the
        // rest of the app compares against.
        const [year, month, day] = event.target.value.split("-").map(Number);
        onChange(new Date(year!, month! - 1, day!).getTime());
      }}
      className={cn(selectClasses, "w-full")}
    />
  );
}
