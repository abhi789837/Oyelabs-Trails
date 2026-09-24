import { X } from "lucide-react";

import { OPERATOR_LABELS, operatorArity, type FilterCondition, type TableQuery } from "@shared/table";

import { findField, setFieldConditions } from "../query";
import type { TableFieldDef } from "../types";
import { describeFieldFilter } from "./QuickFilters";

/**
 * Removable chips for the filters that have no control of their own on screen.
 *
 * A quick filter shows its own state on its chip, so repeating it here would be noise. What does
 * need saying is everything else: a condition built in the advanced popover, or one that arrived
 * in a shared link or a saved view, is otherwise invisible — the table shows four rows out of
 * three hundred and nothing on the page explains why. These chips are that explanation, and each
 * one is also the way out of it.
 */

export interface ActiveFiltersProps<TRow> {
  fields: readonly TableFieldDef<TRow>[];
  query: TableQuery;
  onChange: (next: TableQuery) => void;
  /** Fields that already have a visible chip in the toolbar, and so are skipped here. */
  shown: readonly string[];
}

function describeCondition(condition: FilterCondition): string {
  const operator = OPERATOR_LABELS[condition.operator] ?? condition.operator;
  switch (operatorArity(condition.operator)) {
    case "none":
      return operator;
    case "list":
      return `${operator} ${(condition.value as unknown[]).length} values`;
    case "range": {
      const [from, to] = condition.value as [unknown, unknown];
      return `${operator} ${from ?? "…"} and ${to ?? "…"}`;
    }
    default:
      return `${operator} ${String(condition.value)}`;
  }
}

export function ActiveFilters<TRow>({ fields, query, onChange, shown }: ActiveFiltersProps<TRow>) {
  const hiddenFields = [...new Set(query.filters.conditions.map((condition) => condition.field))].filter(
    (name) => !shown.includes(name),
  );

  if (hiddenFields.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {hiddenFields.map((name) => {
        const field = findField(fields, name);
        const conditions = query.filters.conditions.filter((condition) => condition.field === name);
        const label = field?.label ?? name;
        const summary = field
          ? (describeFieldFilter(field, conditions) ?? conditions.map(describeCondition).join(", "))
          : conditions.map(describeCondition).join(", ");

        return (
          <li key={name}>
            <button
              type="button"
              onClick={() => onChange(setFieldConditions(query, name, []))}
              aria-label={`Remove filter: ${label} ${summary}`}
              className="inline-flex h-8 max-w-[18rem] items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 text-xs font-medium text-primary-strong transition-colors duration-[120ms] hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
            >
              <span className="shrink-0">{label}</span>
              <span aria-hidden="true" className="h-4 w-px shrink-0 bg-current opacity-30" />
              <span className="truncate font-normal">{summary}</span>
              <X aria-hidden="true" className="size-3.5 shrink-0" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
