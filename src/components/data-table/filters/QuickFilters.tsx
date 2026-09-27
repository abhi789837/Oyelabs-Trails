import type { FilterCondition, TableQuery } from "@shared/table";

import { conditionsForField, setFieldConditions } from "../query";
import type { TableFieldDef } from "../types";
import { BooleanFilter, booleanConditions, booleanFromConditions } from "./BooleanFilter";
import { DateRangeFilter, dateRangeConditions, formatRange, rangeFromConditions } from "./DateRangeFilter";
import { FacetedFilter, facetedConditions } from "./FacetedFilter";
import {
  NumberRangeFilter,
  formatNumberRange,
  numberRangeConditions,
  numberRangeFromConditions,
} from "./NumberRangeFilter";

/**
 * Turns a field marked `quick` into the right control, by type.
 *
 * The mapping is fixed rather than configurable: an enum is always a faceted list, a date is
 * always a range with presets, a number is always a slider plus inputs, a boolean is always three
 * chips. A table that could choose a different control for the same kind of field would end up
 * with two tables that filter dates differently, and the admin would have to learn both.
 */

export interface QuickFilterProps<TRow> {
  field: TableFieldDef<TRow>;
  query: TableQuery;
  onChange: (next: TableQuery) => void;
  /** Option counts for a faceted field. Omitted on a server-paged table. */
  counts?: Map<string, number>;
}

export function QuickFilter<TRow>({ field, query, onChange, counts }: QuickFilterProps<TRow>) {
  const current = conditionsForField(query, field.name);
  const set = (conditions: FilterCondition[]) => onChange(setFieldConditions(query, field.name, conditions));

  switch (field.type) {
    case "enum": {
      const selected = current.flatMap((condition) =>
        condition.operator === "in" ? condition.value.map(String) : condition.operator === "eq" ? [String(condition.value)] : [],
      );
      return (
        <FacetedFilter
          field={field}
          selected={selected}
          counts={counts}
          onChange={(values) => set(facetedConditions(field.name, values))}
        />
      );
    }

    case "date":
      return (
        <DateRangeFilter
          field={field}
          value={rangeFromConditions(current)}
          onChange={(range) => set(dateRangeConditions(field.name, range))}
        />
      );

    case "number":
      return (
        <NumberRangeFilter
          field={field}
          value={numberRangeFromConditions(current)}
          onChange={(range) => set(numberRangeConditions(field.name, range))}
        />
      );

    case "boolean":
      return (
        <BooleanFilter
          field={field}
          value={booleanFromConditions(current)}
          onChange={(next) => set(booleanConditions(field.name, next))}
        />
      );

    default:
      // A free-text field has no useful quick control — the search box already covers it, and a
      // second text box beside it would just be a worse search box.
      return null;
  }
}

/**
 * One short phrase describing what a field's conditions currently do, for the removable summary
 * chips and for the mobile drawer's collapsed rows.
 */
export function describeFieldFilter<TRow>(field: TableFieldDef<TRow>, conditions: readonly FilterCondition[]): string | null {
  if (conditions.length === 0) return null;

  switch (field.type) {
    case "enum": {
      const values = conditions.flatMap((condition) =>
        condition.operator === "in" ? condition.value.map(String) : condition.operator === "eq" ? [String(condition.value)] : [],
      );
      if (values.length === 0) return null;
      const labels = values.map(
        (value) => field.options?.find((option) => option.value === value)?.label ?? value,
      );
      return labels.length <= 2 ? labels.join(" or ") : `${labels.length} selected`;
    }
    case "date":
      return formatRange(rangeFromConditions(conditions)) ?? null;
    case "number":
      return formatNumberRange(numberRangeFromConditions(conditions), field.unit) ?? null;
    case "boolean": {
      const value = booleanFromConditions(conditions);
      if (value === null) return null;
      return value ? (field.trueLabel ?? "Yes") : (field.falseLabel ?? "No");
    }
    default:
      return `${conditions.length} condition${conditions.length === 1 ? "" : "s"}`;
  }
}
