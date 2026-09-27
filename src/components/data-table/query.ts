import {
  pageMetaOf,
  type FilterCondition,
  type FilterScalar,
  type PageMeta,
  type SortSpec,
  type TableQuery,
} from "@shared/table";

import type { TableFieldDef, TableFieldType } from "./types";

/**
 * The client-side half of the query language.
 *
 * Small tables (People, at a few hundred rows) filter in the browser; unbounded ones
 * (`audit_log`, `ai_calls`) go to the server. Both are handed the same `TableQuery`, so the two
 * evaluators have to agree about what it means — otherwise the same saved view shows different
 * rows depending on which table it was saved on, and nobody would ever trust it again.
 *
 * Where the two could drift, this file follows **SQLite**, because that is the one whose
 * behaviour is not up for discussion:
 *
 * - `=` on text is **case-sensitive**; `LIKE` is **case-insensitive** for ASCII. So `eq` compares
 *   exactly and `contains` lowercases both sides. This looks inconsistent and is correct.
 * - Every comparison against `NULL` is `NULL`, which is not true, so a row whose value is missing
 *   fails every operator except `isNull`. Not even `ne` matches it.
 * - `NULL` sorts first ascending, last descending.
 */

// ---------------------------------------------------------------------------
// Reading values
// ---------------------------------------------------------------------------

export function fieldValue<TRow>(row: TRow, field: TableFieldDef<TRow>): unknown {
  if (field.accessor) return field.accessor(row);
  return (row as Record<string, unknown>)[field.name];
}

export function findField<TRow>(fields: readonly TableFieldDef<TRow>[], name: string): TableFieldDef<TRow> | undefined {
  return fields.find((field) => field.name === name);
}

/** Missing is missing: `null`, `undefined` and `NaN` all behave as SQL NULL here. */
function isMissing(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "number" && Number.isNaN(value));
}

function asComparable(value: unknown, type: TableFieldType): string | number | boolean | null {
  if (isMissing(value)) return null;
  if (type === "date") {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const parsed = Date.parse(String(value));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (type === "number") {
    const numeric = typeof value === "number" ? value : Number(value);
    // Unparseable is missing, not zero — the same call the server's `coerceValue` makes.
    return Number.isFinite(numeric) ? numeric : null;
  }
  if (type === "boolean") return Boolean(value);
  return String(value);
}

function normaliseFilterValue(value: FilterScalar, type: TableFieldType): string | number | boolean | null {
  return asComparable(value, type);
}

// ---------------------------------------------------------------------------
// One condition
// ---------------------------------------------------------------------------

export function conditionMatches<TRow>(row: TRow, condition: FilterCondition, field: TableFieldDef<TRow>): boolean {
  const raw = fieldValue(row, field);

  switch (condition.operator) {
    case "isNull":
      return isMissing(raw);
    case "isNotNull":
      return !isMissing(raw);
  }

  // Past this point every operator is a comparison, and SQL comparisons against NULL are never true.
  if (isMissing(raw)) return false;

  const left = asComparable(raw, field.type);
  if (left === null) return false;

  switch (condition.operator) {
    case "in":
    case "notIn": {
      const set = condition.value.map((entry) => normaliseFilterValue(entry, field.type));
      const hit = set.some((entry) => entry === left);
      return condition.operator === "in" ? hit : !hit;
    }

    case "between": {
      const [rawFrom, rawTo] = condition.value;
      const from = rawFrom === null ? null : normaliseFilterValue(rawFrom, field.type);
      const to = rawTo === null ? null : normaliseFilterValue(rawTo, field.type);
      if (from !== null && left < from) return false;
      if (to !== null && left > to) return false;
      return true;
    }

    case "contains":
    case "notContains":
    case "startsWith":
    case "endsWith": {
      // LIKE is case-insensitive in SQLite for ASCII, so the client lowercases to match it.
      const haystack = String(left).toLowerCase();
      const needle = String(condition.value).toLowerCase();
      if (condition.operator === "startsWith") return haystack.startsWith(needle);
      if (condition.operator === "endsWith") return haystack.endsWith(needle);
      const found = haystack.includes(needle);
      return condition.operator === "contains" ? found : !found;
    }

    default: {
      const right = normaliseFilterValue(condition.value, field.type);
      if (right === null) return false;
      switch (condition.operator) {
        // `=` is case-sensitive in SQLite. Deliberately not lowercased.
        case "eq":
          return left === right;
        case "ne":
          return left !== right;
        case "lt":
          return left < right;
        case "lte":
          return left <= right;
        case "gt":
          return left > right;
        case "gte":
          return left >= right;
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// A whole query
// ---------------------------------------------------------------------------

function matchesSearch<TRow>(row: TRow, term: string, fields: readonly TableFieldDef<TRow>[]): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  const searchable = fields.filter((field) => field.searchable);
  if (searchable.length === 0) return false;
  return searchable.some((field) => {
    const value = fieldValue(row, field);
    return !isMissing(value) && String(value).toLowerCase().includes(needle);
  });
}

/**
 * A condition naming a field the catalogue does not have matches nothing.
 *
 * Client-side this is the safe direction: a stale saved view referring to a removed column shows
 * an empty table with its filter chip visible, which is a state someone can see and clear. The
 * alternative — skipping the condition — would silently widen the view instead.
 */
export function rowMatches<TRow>(row: TRow, query: TableQuery, fields: readonly TableFieldDef<TRow>[]): boolean {
  if (!matchesSearch(row, query.q, fields)) return false;

  const { conditions, combinator } = query.filters;
  if (conditions.length === 0) return true;

  const results = conditions.map((condition) => {
    const field = findField(fields, condition.field);
    return field ? conditionMatches(row, condition, field) : false;
  });

  return combinator === "or" ? results.some(Boolean) : results.every(Boolean);
}

export function filterRows<TRow>(rows: readonly TRow[], query: TableQuery, fields: readonly TableFieldDef<TRow>[]): TRow[] {
  return rows.filter((row) => rowMatches(row, query, fields));
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

function compare(a: string | number | boolean | null, b: string | number | boolean | null): number {
  // NULL first ascending, as SQLite does.
  if (a === null && b === null) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  if (typeof a === "string" && typeof b === "string") return a < b ? -1 : a > b ? 1 : 0;
  return Number(a) - Number(b);
}

export function sortRows<TRow>(
  rows: readonly TRow[],
  sort: readonly SortSpec[],
  fields: readonly TableFieldDef<TRow>[],
): TRow[] {
  if (sort.length === 0) return [...rows];
  const keys = sort
    .map((entry) => ({ entry, field: findField(fields, entry.field) }))
    .filter((pair): pair is { entry: SortSpec; field: TableFieldDef<TRow> } => Boolean(pair.field));
  if (keys.length === 0) return [...rows];

  // `toSorted` is not available on the oldest browser this app supports, and a copy keeps the
  // caller's array — usually React state — untouched.
  return [...rows].sort((left, right) => {
    for (const { entry, field } of keys) {
      const result = compare(asComparable(fieldValue(left, field), field.type), asComparable(fieldValue(right, field), field.type));
      if (result !== 0) return entry.dir === "desc" ? -result : result;
    }
    return 0;
  });
}

// ---------------------------------------------------------------------------
// Facet counts
// ---------------------------------------------------------------------------

/**
 * How many rows each option of a faceted field would match.
 *
 * Counted against the rows that pass **every other** part of the query but not this field's own
 * conditions. That is what makes a facet useful: once "Disabled" is ticked, the count beside
 * "Active" still says how many you would get by ticking it too, rather than dropping to zero and
 * looking like a dead end.
 */
export function facetCounts<TRow>(
  rows: readonly TRow[],
  query: TableQuery,
  fieldName: string,
  fields: readonly TableFieldDef<TRow>[],
): Map<string, number> {
  const field = findField(fields, fieldName);
  const counts = new Map<string, number>();
  if (!field) return counts;

  const others: TableQuery = {
    ...query,
    filters: {
      ...query.filters,
      conditions: query.filters.conditions.filter((condition) => condition.field !== fieldName),
    },
  };

  for (const row of rows) {
    if (!rowMatches(row, others, fields)) continue;
    const value = fieldValue(row, field);
    if (isMissing(value)) continue;
    const key = String(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

// ---------------------------------------------------------------------------
// The whole pipeline
// ---------------------------------------------------------------------------

export interface ClientTableResult<TRow> {
  /** The rows for the current page. */
  rows: TRow[];
  /** Everything matching the query, unpaged — what Export CSV writes and the count announces. */
  matched: TRow[];
  meta: PageMeta;
}

/**
 * Filter, sort, then page — in that order, and never a different one.
 *
 * Paging before filtering would page the wrong set; sorting after paging would sort 25 rows out
 * of 300 and look like a bug the first time someone clicked a header on page 2.
 */
export function applyTableQuery<TRow>(
  rows: readonly TRow[],
  query: TableQuery,
  fields: readonly TableFieldDef<TRow>[],
  defaultSort: readonly SortSpec[] = [],
): ClientTableResult<TRow> {
  const matched = filterRows(rows, query, fields);
  const sorted = sortRows(matched, query.sort.length ? query.sort : defaultSort, fields);
  const meta = pageMetaOf(sorted.length, query.page, query.pageSize);
  const start = (meta.page - 1) * meta.pageSize;
  return { rows: sorted.slice(start, start + meta.pageSize), matched: sorted, meta };
}

// ---------------------------------------------------------------------------
// Editing a filter set
// ---------------------------------------------------------------------------

/** Replaces every condition on one field. Passing none removes the field's filter entirely. */
export function setFieldConditions(query: TableQuery, field: string, conditions: FilterCondition[]): TableQuery {
  const others = query.filters.conditions.filter((condition) => condition.field !== field);
  return {
    ...query,
    // Any change to the filters means page 1: staying on page 7 of a result that is now two pages
    // long shows an empty table and reads as "there is nothing here".
    page: 1,
    filters: { ...query.filters, conditions: [...others, ...conditions] },
  };
}

export function conditionsForField(query: TableQuery, field: string): FilterCondition[] {
  return query.filters.conditions.filter((condition) => condition.field === field);
}
