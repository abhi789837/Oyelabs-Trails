import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Header,
  type RowData,
  type RowSelectionState,
  type Table as TanStackTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { motion } from "motion/react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import {
  MAX_SORT_FIELDS,
  isQueryEmpty,
  pageMetaOf,
  type PageMeta,
  type SortSpec,
  type TableQuery,
} from "@shared/table";

import { DetailSheet } from "@/components/overlays";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableCell, TableHead, TableHeader, TableScroller } from "@/components/ui/table";
import { fadeUp, stagger, transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { BulkActionBar } from "./BulkActionBar";
import { csvFileName, downloadCsv, toCsv, type CsvColumn } from "./csv";
import { DataTablePagination } from "./DataTablePagination";
import { EmptyState, ErrorState, NoMatchesState, SkeletonRows } from "./DataTableStates";
import { DataTableToolbar } from "./DataTableToolbar";
import { FilterDrawer } from "./FilterDrawer";
import { applyTableQuery, facetCounts } from "./query";
import { loadViews, removeView, saveViews, upsertView } from "./viewStorage";
import type { BulkAction, BuiltInView, EmptyStateCopy, SavedView, TableFieldDef } from "./types";
import { useTablePreferences } from "./useTableQueryState";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- both parameters are part of the base signature
  interface ColumnMeta<TData extends RowData, TValue> {
    /** The `TableFieldDef` name this column sorts by. Defaults to the column id. */
    field?: string;
    align?: "left" | "right";
    headerClassName?: string;
    cellClassName?: string;
    /** What this column writes into a CSV, when the cell renders something a string cannot carry. */
    exportValue?: (row: TData) => unknown;
    /** Formats the raw value for display; here mainly so `TValue` is a used parameter. */
    formatValue?: (value: TValue) => string;
  }
}

/**
 * One table, for every table in the admin console.
 *
 * ## The two modes
 *
 * `mode="client"` is given every row and does the filtering, sorting and paging itself. Right for
 * People, which is a few hundred rows that arrive in one response — filtering in the browser is
 * instant, and facet counts are only possible when the whole set is in hand.
 *
 * `mode="server"` is given one page and a `meta`, and simply renders it. Right for `audit_log` and
 * `ai_calls`, which grow without bound; the same `TableQuery` goes to the server, which compiles
 * it through the whitelist in `server/src/lib/tableQuery.ts`.
 *
 * Everything else — the toolbar, the URL sync, selection, the detail panel, keyboard navigation —
 * is identical either way, which is the point. A table that changes shape when it outgrows the
 * browser would mean rewriting the screen rather than flipping a prop.
 *
 * ## Keyboard
 *
 * The rows are a roving-tabindex list: one Tab stop for the whole body, then Up/Down to move,
 * Home/End for the ends, Enter to open, Space to tick. That is one tab stop instead of 300, which
 * is the difference between a table a keyboard user can pass through and one they cannot.
 */

export interface DataTableProps<TRow> {
  /** Every row (client mode) or the current page (server mode). */
  data: readonly TRow[];
  columns: ColumnDef<TRow, unknown>[];
  /** The field catalogue: filters, sorting, search and CSV all read from it. */
  fields: readonly TableFieldDef<TRow>[];
  getRowId: (row: TRow) => string;

  query: TableQuery;
  onQueryChange: (next: TableQuery, options?: { push?: boolean }) => void;
  mode?: "client" | "server";
  /** Required in server mode: the page the rows came from. */
  meta?: PageMeta;
  /** Applied when the query names no sort of its own. */
  defaultSort?: readonly SortSpec[];

  /** Namespaces the column/density preferences and the saved views in `localStorage`. */
  tableKey: string;
  /** Scopes saved views to the signed-in admin. */
  accountId?: string | null;
  builtInViews?: readonly BuiltInView[];

  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** Shown when the table has no rows at all — not when filters matched nothing. */
  emptyState: EmptyStateCopy;

  /** What one row is: "learner", "event". Used in the selection bar and announcements. */
  noun?: string;
  searchPlaceholder?: string;
  caption?: string;

  /** Opening a row slides this in. Leave out — and pass `onRowOpen` — to navigate instead. */
  renderDetail?: (row: TRow) => ReactNode;
  detailTitle?: (row: TRow) => ReactNode;
  detailSubtitle?: (row: TRow) => ReactNode;
  detailFooter?: (row: TRow) => ReactNode;
  /** Called on Enter or click when there is no `renderDetail`. */
  onRowOpen?: (row: TRow) => void;

  bulkActions?: readonly BulkAction<TRow>[];
  /** Turns on Export CSV, and names the file. */
  exportName?: string;
  /** The card a row becomes below 768px. Without it, the table scrolls horizontally instead. */
  mobileCard?: (row: TRow) => ReactNode;

  /** Caps the scroll container so the header can stick. A CSS length. */
  maxHeight?: string;
  className?: string;
}

const SELECT_COLUMN_ID = "__select";

/** Past this many rows on screen, the body fades in as one block instead of row by row. */
const MAX_STAGGERED_ROWS = 12;

export function DataTable<TRow>({
  data,
  columns,
  fields,
  getRowId,
  query,
  onQueryChange,
  mode = "client",
  meta: serverMeta,
  defaultSort = [],
  tableKey,
  accountId,
  builtInViews,
  loading = false,
  error = null,
  onRetry,
  emptyState,
  noun = "row",
  searchPlaceholder,
  caption,
  renderDetail,
  detailTitle,
  detailSubtitle,
  detailFooter,
  onRowOpen,
  bulkActions,
  exportName,
  mobileCard,
  maxHeight = "calc(100dvh - 20rem)",
  className,
}: DataTableProps<TRow>) {
  const { preferences, setPreferences } = useTablePreferences(tableKey);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const [savedViewList, setSavedViewList] = useState<SavedView[]>([]);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => setSavedViewList(loadViews(tableKey, accountId)), [tableKey, accountId]);

  // ---------------------------------------------------------------------
  // Rows
  // ---------------------------------------------------------------------

  /* Every dependency here is expected to be a stable reference: `data` from the caller's state,
     `query` from the URL, and `fields`/`defaultSort` from module scope. Pass an array literal for
     either of the last two and this recomputes on every render — which is correct, just not
     memoised. Filtering a few hundred rows is microseconds, so that is a performance note rather
     than a rule, and it is not worth a stringified dependency to avoid. */
  const client = useMemo(
    () => (mode === "client" ? applyTableQuery(data, query, fields, defaultSort) : null),
    [mode, data, query, fields, defaultSort],
  );

  const rows = client ? client.rows : ([...data] as TRow[]);
  const meta: PageMeta = client ? client.meta : (serverMeta ?? pageMetaOf(data.length, query.page, query.pageSize));

  /* Facet counts need the whole set, so they are a client-mode feature. On a server-paged table
     the faceted filter simply shows no numbers — better than showing the counts for page 3. */
  const facets = useMemo(() => {
    if (!client) return undefined;
    const map = new Map<string, Map<string, number>>();
    for (const field of fields) {
      if (field.quick && field.type === "enum") map.set(field.name, facetCounts(data, query, field.name, fields));
    }
    return map;
  }, [client, data, query, fields]);

  // ---------------------------------------------------------------------
  // Table model
  // ---------------------------------------------------------------------

  const selectable = Boolean(bulkActions?.length);

  const modelColumns = useMemo<ColumnDef<TRow, unknown>[]>(() => {
    if (!selectable) return columns;
    const select: ColumnDef<TRow, unknown> = {
      id: SELECT_COLUMN_ID,
      size: 40,
      enableResizing: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllRowsSelected() ? true : table.getIsSomeRowsSelected() ? "indeterminate" : false
          }
          onCheckedChange={(checked) => table.toggleAllRowsSelected(checked === true)}
          aria-label={`Select all ${noun}s on this page`}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          aria-label={`Select this ${noun}`}
          // The row's own click handler opens the detail panel; ticking must not also open it.
          onClick={(event) => event.stopPropagation()}
        />
      ),
    };
    return [select, ...columns];
  }, [columns, selectable, noun]);

  const table = useReactTable({
    data: rows,
    columns: modelColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => getRowId(row),
    // Filtering, sorting and paging are ours — TanStack here is the column model, visibility,
    // sizing and selection, and nothing else.
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
    enableRowSelection: selectable,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: {
      rowSelection,
      columnVisibility: preferences.columns as VisibilityState,
    },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === "function" ? updater(preferences.columns as VisibilityState) : updater;
      setPreferences({ columns: next });
    },
  });

  const leafColumns = table.getVisibleLeafColumns();

  // ---------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------

  const selectedIds = useMemo(() => Object.keys(rowSelection).filter((id) => rowSelection[id]), [rowSelection]);

  /**
   * The selected rows, resolved every render against the rows that currently match.
   *
   * Derived rather than stored, which settles two problems at once. A selection made on page 1
   * still names real records after paging to page 2, because the pool is every matching row and
   * not the page. And a row that a new filter excludes simply stops being counted — the action bar
   * can never offer to disable twelve learners while showing eight — without a synchronising
   * effect that has to guess when to prune.
   *
   * The consequence, which is deliberate: ticked ids are kept even while their rows are filtered
   * out, so undoing a filter brings the selection back rather than silently discarding it.
   */
  const selectedRows = useMemo(() => {
    const pool = client ? client.matched : rows;
    const wanted = new Set(selectedIds);
    return pool.filter((row) => wanted.has(getRowId(row)));
  }, [client, rows, selectedIds, getRowId]);

  // ---------------------------------------------------------------------
  // Sorting
  // ---------------------------------------------------------------------

  const activeSort = query.sort.length ? query.sort : defaultSort;

  const toggleSort = useCallback(
    (fieldName: string, additive: boolean) => {
      const current = activeSort.find((entry) => entry.field === fieldName);
      const others = additive ? activeSort.filter((entry) => entry.field !== fieldName) : [];

      // asc → desc → off. The third click is what makes a sort undoable without a reset button.
      let next: SortSpec[];
      if (!current) next = [...others, { field: fieldName, dir: "asc" }];
      else if (current.dir === "asc") next = [...others, { field: fieldName, dir: "desc" }];
      else next = others;

      onQueryChange({ ...query, sort: next.slice(0, MAX_SORT_FIELDS), page: 1 });
    },
    [activeSort, onQueryChange, query],
  );

  // ---------------------------------------------------------------------
  // Keyboard navigation
  // ---------------------------------------------------------------------

  const focusRow = useCallback((index: number) => {
    setFocusIndex(index);
    bodyRef.current?.querySelectorAll<HTMLTableRowElement>("tr[data-row]")[index]?.focus();
  }, []);

  const openRow = useCallback(
    (row: TRow) => {
      if (renderDetail) setOpenRowId(getRowId(row));
      else onRowOpen?.(row);
    },
    [getRowId, onRowOpen, renderDetail],
  );

  const handleRowKeyDown = (event: ReactKeyboardEvent<HTMLTableRowElement>, index: number, row: TRow) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusRow(Math.min(index + 1, rows.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        focusRow(Math.max(index - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        focusRow(0);
        break;
      case "End":
        event.preventDefault();
        focusRow(rows.length - 1);
        break;
      case "Enter":
        event.preventDefault();
        openRow(row);
        break;
      case " ":
        if (!selectable) return;
        event.preventDefault();
        table.getRow(getRowId(row))?.toggleSelected();
        break;
      default:
        break;
    }
  };

  // A new page means the old focus index may not exist any more.
  useEffect(() => setFocusIndex(0), [meta.page, meta.pageSize]);

  // ---------------------------------------------------------------------
  // First-render motion
  // ---------------------------------------------------------------------

  const hasAnimated = useRef(false);
  const shouldAnimate = !hasAnimated.current && rows.length > 0 && !loading;
  useEffect(() => {
    if (rows.length > 0 && !loading) hasAnimated.current = true;
  }, [rows.length, loading]);
  /* Row-by-row past a dozen rows stops being polish: the last row of a 100-row page would arrive
     four seconds after the first. Beyond the cap the body fades in as one block instead. */
  const staggerRows = shouldAnimate && rows.length <= MAX_STAGGERED_ROWS;

  // ---------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------

  const handleExport = useCallback(() => {
    const exportable: CsvColumn<TRow>[] = leafColumns
      .filter((column) => column.id !== SELECT_COLUMN_ID)
      .map((column) => {
        const columnMeta = column.columnDef.meta;
        const header = typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
        return {
          header,
          value: (row: TRow) => {
            if (columnMeta?.exportValue) return columnMeta.exportValue(row);
            const field = fields.find((entry) => entry.name === (columnMeta?.field ?? column.id));
            if (field?.toCsv) return field.toCsv(row);
            if (field?.accessor) return field.accessor(row);
            return (row as Record<string, unknown>)[columnMeta?.field ?? column.id];
          },
        };
      });

    // The selection wins when there is one — "export" after ticking twelve rows means those
    // twelve. Otherwise: everything matching in client mode, this page in server mode, which is
    // all a server-paged table has in hand.
    const source = selectedRows.length > 0 ? selectedRows : (client ? client.matched : rows);
    downloadCsv(toCsv(source, exportable), csvFileName(exportName ?? tableKey));
  }, [client, exportName, fields, leafColumns, rows, selectedRows, tableKey]);

  // ---------------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------------

  const handleSaveView = (name: string) => {
    const next = upsertView(savedViewList, name, query);
    setSavedViewList(next);
    saveViews(tableKey, accountId, next);
  };

  const handleDeleteView = (id: string) => {
    const next = removeView(savedViewList, id);
    setSavedViewList(next);
    saveViews(tableKey, accountId, next);
  };

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  const openRowRecord = openRowId
    ? ((client ? client.matched : rows).find((row) => getRowId(row) === openRowId) ?? null)
    : null;

  const filtered = !isQueryEmpty(query);
  const showEmpty = !loading && !error && rows.length === 0;

  return (
    <div className={cn("space-y-3", className)}>
      <DataTableToolbar
        table={table}
        fields={fields}
        query={query}
        onQueryChange={onQueryChange}
        facets={facets}
        density={preferences.density}
        onDensityChange={(density) => setPreferences({ density })}
        builtInViews={builtInViews}
        savedViews={savedViewList}
        onSaveView={builtInViews ? handleSaveView : undefined}
        onDeleteView={builtInViews ? handleDeleteView : undefined}
        onExport={exportName ? handleExport : undefined}
        exportLabel={mode === "server" && selectedRows.length === 0 ? "Export page" : "Export CSV"}
        searchPlaceholder={searchPlaceholder}
        onOpenFilters={() => setDrawerOpen(true)}
        activeFilterCount={query.filters.conditions.length}
      />

      <div className="rounded-lg border bg-surface" aria-busy={loading || undefined}>
        {error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : showEmpty ? (
          filtered ? (
            <NoMatchesState
              searched={query.q.trim()}
              onClear={() => onQueryChange({ ...query, q: "", filters: { combinator: "and", conditions: [] }, page: 1 })}
            />
          ) : (
            <EmptyState copy={emptyState} />
          )
        ) : (
          <>
            {/* Desktop: a real table. */}
            <TableScroller className={cn(mobileCard && "hidden md:block")} style={{ maxHeight }}>
              <Table density={preferences.density} fixed>
                {caption && <caption className="sr-only">{caption}</caption>}

                <TableHeader sticky>
                  {table.getHeaderGroups().map((group) => (
                    <tr key={group.id}>
                      {group.headers.map((header) => {
                        const columnMeta = header.column.columnDef.meta;
                        const fieldName = columnMeta?.field ?? header.column.id;
                        const field = fields.find((entry) => entry.name === fieldName);
                        const sortable = Boolean(field) && field!.sortable !== false;
                        const sort = activeSort.find((entry) => entry.field === fieldName);

                        return (
                          <TableHead
                            key={header.id}
                            style={{ width: header.getSize() }}
                            aria-sort={sort ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                            className={cn(columnMeta?.align === "right" && "text-right", columnMeta?.headerClassName)}
                          >
                            {header.isPlaceholder ? null : sortable ? (
                              <button
                                type="button"
                                onClick={(event) => toggleSort(fieldName, event.shiftKey)}
                                className="inline-flex items-center gap-1 rounded-sm transition-colors duration-[120ms] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {sort ? (
                                  sort.dir === "asc" ? (
                                    <ArrowUp aria-hidden="true" className="size-3" />
                                  ) : (
                                    <ArrowDown aria-hidden="true" className="size-3" />
                                  )
                                ) : (
                                  <ChevronsUpDown aria-hidden="true" className="size-3 opacity-40" />
                                )}
                              </button>
                            ) : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}

                            {header.column.getCanResize() && (
                              <ColumnResizeHandle header={header} label={String(header.column.id)} table={table} />
                            )}
                          </TableHead>
                        );
                      })}
                    </tr>
                  ))}
                </TableHeader>

                <motion.tbody
                  ref={bodyRef}
                  initial={shouldAnimate ? "hidden" : false}
                  animate="visible"
                  variants={staggerRows ? stagger() : fadeUp}
                  transition={transition.base}
                >
                  {loading && rows.length === 0 ? (
                    <SkeletonRows rows={Math.min(query.pageSize, 8)} columns={leafColumns.length} />
                  ) : (
                    table.getRowModel().rows.map((row, index) => (
                      <motion.tr
                        key={row.id}
                        data-row
                        variants={staggerRows ? fadeUp : undefined}
                        tabIndex={index === focusIndex ? 0 : -1}
                        onFocus={() => setFocusIndex(index)}
                        onKeyDown={(event) => handleRowKeyDown(event, index, row.original)}
                        onClick={() => openRow(row.original)}
                        data-state={row.getIsSelected() ? "selected" : undefined}
                        className={cn(
                          "transition-colors duration-[120ms] focus-visible:outline-none",
                          (renderDetail || onRowOpen) && "cursor-pointer hover:bg-surface-sunken/70",
                          row.getIsSelected() && "bg-primary/[0.07]",
                          "focus-visible:[&>td]:bg-primary/[0.06] focus-visible:[&>td:first-child]:shadow-[inset_2px_0_0_0_rgb(var(--ring))]",
                        )}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const columnMeta = cell.column.columnDef.meta;
                          return (
                            <TableCell
                              key={cell.id}
                              style={{ width: cell.column.getSize() }}
                              className={cn(
                                "truncate",
                                columnMeta?.align === "right" && "text-right",
                                columnMeta?.cellClassName,
                              )}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          );
                        })}
                      </motion.tr>
                    ))
                  )}
                </motion.tbody>
              </Table>
            </TableScroller>

            {/* Below 768px: one card per row, because eight columns on a phone is a horizontal
                scrollbar and a table nobody reads. */}
            {mobileCard && (
              <ul className="divide-y md:hidden">
                {loading && rows.length === 0
                  ? Array.from({ length: 4 }, (_, index) => (
                      <li key={index} className="p-4">
                        <div className="h-16 animate-pulse rounded-md bg-surface-sunken" />
                      </li>
                    ))
                  : rows.map((row) => (
                      <li key={getRowId(row)}>
                        <button
                          type="button"
                          onClick={() => openRow(row)}
                          className="w-full px-4 py-3 text-left transition-colors duration-[120ms] hover:bg-surface-sunken/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong"
                        >
                          {mobileCard(row)}
                        </button>
                      </li>
                    ))}
              </ul>
            )}
          </>
        )}
      </div>

      <DataTablePagination
        meta={meta}
        selectedCount={selectedRows.length}
        onPageChange={(page) => onQueryChange({ ...query, page })}
        onPageSizeChange={(pageSize) => onQueryChange({ ...query, pageSize, page: 1 })}
      />

      {bulkActions && bulkActions.length > 0 && (
        <BulkActionBar rows={selectedRows} actions={bulkActions} noun={noun} onClear={() => setRowSelection({})} />
      )}

      <FilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        fields={fields}
        query={query}
        onQueryChange={onQueryChange}
        resultCount={meta.total}
      />

      {renderDetail && (
        <DetailSheet
          open={openRowRecord !== null}
          onOpenChange={(next) => !next && setOpenRowId(null)}
          title={openRowRecord ? (detailTitle?.(openRowRecord) ?? "Details") : "Details"}
          subtitle={openRowRecord ? detailSubtitle?.(openRowRecord) : undefined}
          footer={openRowRecord ? detailFooter?.(openRowRecord) : undefined}
          size="lg"
        >
          {openRowRecord ? renderDetail(openRowRecord) : null}
        </DetailSheet>
      )}
    </div>
  );
}

/**
 * The drag handle between two columns — and, because a drag is not a keyboard interaction, a real
 * button that answers Left and Right.
 *
 * Column resizing is one of the most common places a data grid quietly becomes mouse-only. It
 * costs eight lines to avoid here.
 */
function ColumnResizeHandle<TRow>({
  header,
  label,
  table,
}: {
  header: Header<TRow, unknown>;
  label: string;
  table: TanStackTable<TRow>;
}) {
  const nudge = (delta: number) => {
    table.setColumnSizing((current) => ({
      ...current,
      [header.column.id]: Math.max(48, header.column.getSize() + delta),
    }));
  };

  return (
    <button
      type="button"
      aria-label={`Resize the ${label} column`}
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          nudge(-16);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          nudge(16);
        }
      }}
      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize touch-none select-none bg-transparent transition-colors duration-[120ms] hover:bg-primary/40 focus-visible:bg-primary/60 focus-visible:outline-none"
    />
  );
}
