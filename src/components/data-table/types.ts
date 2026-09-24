import type { ReactNode } from "react";

import type { FilterOperator, TableQuery } from "@shared/table";

/**
 * The kit's field catalogue — the client-side mirror of a server table spec.
 *
 * One list drives four things: which quick-filter chips the toolbar grows, what the advanced
 * builder offers, how a client-side table filters and sorts, and what Export CSV writes. Keeping
 * them in one place is the whole reason this type exists; the alternative is a `filters` prop, a
 * `columns` prop and a `csv` prop that agree until someone edits one of them.
 *
 * It mirrors `server/src/lib/tableSpecs.ts` but is not the same list. A client field list may
 * include **derived** columns — `planCompletedCount`, `hardWarnings` — that exist on the response
 * shape but not as columns in the database. Those are filterable client-side and simply are not
 * offered on a server-paged table. The reverse is never safe: a field the server spec does not
 * grant will be refused if the client sends it, which is the intended direction of failure.
 */

export type TableFieldType = "string" | "number" | "boolean" | "date" | "enum";

export interface FieldOption {
  value: string;
  label: string;
  /** A small mark shown before the label in the faceted list — a status dot, an icon. */
  icon?: ReactNode;
}

export interface TableFieldDef<TRow> {
  /** Must match the server spec's key when the table is server-paged. */
  name: string;
  label: string;
  type: TableFieldType;
  /** Required for `type: "enum"`. Also what the faceted filter lists. */
  options?: readonly FieldOption[];
  /** Reads the value off a row. Defaults to `row[name]`. */
  accessor?: (row: TRow) => unknown;
  /** Narrows what the advanced builder offers. Defaults to everything the type allows. */
  operators?: readonly FilterOperator[];
  /** Included in the global search box. Text-shaped fields only. */
  searchable?: boolean;
  /** Give this field a chip in the toolbar, next to the search box. */
  quick?: boolean;
  /** Excluded from the advanced builder — a display-only column. Default true. */
  filterable?: boolean;
  /** Default true. */
  sortable?: boolean;
  /** `number` fields: the slider's bounds and step. Without them the slider is not offered. */
  min?: number;
  max?: number;
  step?: number;
  /** Appended after a number in the filter's summary: "under 20 min". */
  unit?: string;
  /** `boolean` fields: what the two chips say. Defaults to "Yes" / "No". */
  trueLabel?: string;
  falseLabel?: string;
  /** Overrides how the value is written into a CSV cell. Defaults to the raw value. */
  toCsv?: (row: TRow) => string | number | boolean | null | undefined;
}

// ---------------------------------------------------------------------------
// Saved views
// ---------------------------------------------------------------------------

/** A view the admin saved themselves. Lives in their browser, keyed by table and by account. */
export interface SavedView {
  id: string;
  name: string;
  query: TableQuery;
  /** Epoch ms, for ordering the list by most recently saved. */
  savedAt: number;
}

/**
 * A view the app ships. A **function**, not a stored query, because the useful ones are relative:
 * "Inactive 14 days or more" written down as an absolute timestamp is correct on the day it is
 * written and quietly wrong every day after.
 */
export interface BuiltInView {
  id: string;
  name: string;
  description?: string;
  build: (now: number) => TableQuery;
}

// ---------------------------------------------------------------------------
// Bulk actions
// ---------------------------------------------------------------------------

export interface BulkAction<TRow> {
  id: string;
  label: string;
  icon?: ReactNode;
  /** `destructive` turns the button red and is expected to confirm first. */
  tone?: "default" | "destructive";
  /** Rejecting leaves the selection intact so it can be retried. Resolve to clear it. */
  run: (rows: TRow[]) => void | Promise<void>;
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

export interface EmptyStateCopy {
  title: string;
  body: string;
  /** The way out of an empty table: "Onboard someone". Omitted on a nothing-matched state, which
   * offers "Clear filters" instead. */
  action?: ReactNode;
}
