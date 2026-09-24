import { useEffect, useRef, useState } from "react";
import type { Table } from "@tanstack/react-table";
import { Download, Filter, RotateCcw, Search } from "lucide-react";

import { EMPTY_TABLE_QUERY, isQueryEmpty, type TableQuery } from "@shared/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TableDensity } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ActiveFilters } from "./filters/ActiveFilters";
import { AdvancedFilter } from "./filters/AdvancedFilter";
import { QuickFilter } from "./filters/QuickFilters";
import { SavedViews } from "./SavedViews";
import type { BuiltInView, SavedView, TableFieldDef } from "./types";
import { useDebounced } from "./useTableQueryState";
import { ViewOptions } from "./ViewOptions";

/**
 * Everything above the table: search, filters, views, columns, export.
 *
 * Two rules it follows that are easy to get wrong.
 *
 * **The search box owns its own text.** It is a local `useState` that pushes into the query after
 * 250 ms of quiet, rather than reading from the URL on every keystroke. Driving an input from a
 * debounced round trip means the caret jumps whenever the state lands a frame late, and it is the
 * most common way a search box ends up feeling broken.
 *
 * **`/` focuses it**, the way it does in every tool an engineer already uses — but only when they
 * are not already typing somewhere. A shortcut that eats a slash in a text field is worse than no
 * shortcut.
 */

export interface DataTableToolbarProps<TRow> {
  table: Table<TRow>;
  fields: readonly TableFieldDef<TRow>[];
  query: TableQuery;
  onQueryChange: (next: TableQuery, options?: { push?: boolean }) => void;
  /** Value → row count, per quick-faceted field. Empty on a server-paged table. */
  facets?: Map<string, Map<string, number>>;
  density: TableDensity;
  onDensityChange: (density: TableDensity) => void;
  builtInViews?: readonly BuiltInView[];
  savedViews?: readonly SavedView[];
  onSaveView?: (name: string) => void;
  onDeleteView?: (id: string) => void;
  /** Absent hides the export button — a server-paged table cannot export what it has not fetched. */
  onExport?: () => void;
  exportLabel?: string;
  searchPlaceholder?: string;
  /** Opens the bottom drawer instead of showing chips inline. Set by `DataTable` below 768px. */
  onOpenFilters?: () => void;
  /** How many filters are on, for the mobile button's badge. */
  activeFilterCount?: number;
  compact?: boolean;
  className?: string;
}

export function DataTableToolbar<TRow>({
  table,
  fields,
  query,
  onQueryChange,
  facets,
  density,
  onDensityChange,
  builtInViews,
  savedViews,
  onSaveView,
  onDeleteView,
  onExport,
  exportLabel = "Export CSV",
  searchPlaceholder = "Search",
  onOpenFilters,
  activeFilterCount = 0,
  compact = false,
  className,
}: DataTableToolbarProps<TRow>) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState(query.q);
  const debounced = useDebounced(term, 250);

  /* The URL is still the source of truth: a back navigation, a saved view or a Reset changes `q`
     without the box knowing, and this puts the text back in sync when that happens. The guard
     stops it fighting the debounce on the way out. */
  useEffect(() => {
    setTerm((current) => (current.trim() === query.q.trim() ? current : query.q));
  }, [query.q]);

  /* The settled term is pushed into the URL, and only the settled term triggers the push.
     `query` is read through a ref rather than listed as a dependency, because depending on it
     would re-run this every time any *other* part of the query changed — a filter chip, a page —
     and re-push a search term the URL already has. The guard makes that harmless, but the ref
     makes the dependency list honest, which is the version that keeps being true. */
  const latestQuery = useRef(query);
  latestQuery.current = query;

  useEffect(() => {
    const current = latestQuery.current;
    if (debounced.trim() === current.q.trim()) return;
    onQueryChange({ ...current, q: debounced, page: 1 });
  }, [debounced, onQueryChange]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      event.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const searchable = fields.some((field) => field.searchable);
  const quickFields = fields.filter((field) => field.quick && field.type !== "string");
  const dirty = !isQueryEmpty(query) || query.sort.length > 0;

  const reset = () => {
    setTerm("");
    onQueryChange({ ...EMPTY_TABLE_QUERY, pageSize: query.pageSize }, { push: true });
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {searchable && (
          <div className="min-w-0 flex-1 sm:max-w-xs">
            <label htmlFor="data-table-search" className="sr-only">
              {searchPlaceholder}
            </label>
            <Input
              id="data-table-search"
              ref={searchRef}
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              onClear={() => setTerm("")}
              leading={<Search />}
              placeholder={searchPlaceholder}
              className="h-8 text-sm"
            />
          </div>
        )}

        {/* Below the breakpoint the chips are hidden and this opens the drawer instead. */}
        {onOpenFilters && (
          <Button variant="outline" size="sm" onClick={onOpenFilters} className="gap-1.5 md:hidden">
            <Filter aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 font-mono text-xs tabular text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}

        {!compact && (
          <div className="hidden flex-wrap items-center gap-1.5 md:flex">
            {quickFields.map((field) => (
              <QuickFilter
                key={field.name}
                field={field}
                query={query}
                onChange={onQueryChange}
                counts={facets?.get(field.name)}
              />
            ))}
            <AdvancedFilter
              fields={fields}
              value={query.filters}
              onChange={(filters) => onQueryChange({ ...query, filters, page: 1 })}
            />
          </div>
        )}

        <div className="ms-auto flex items-center gap-2">
          {dirty && (
            <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
              <RotateCcw aria-hidden="true" />
              Reset
            </Button>
          )}

          {builtInViews && onSaveView && onDeleteView && (
            <SavedViews
              builtIn={builtInViews}
              saved={savedViews ?? []}
              query={query}
              onApply={(next) => onQueryChange(next, { push: true })}
              onSave={onSaveView}
              onDelete={onDeleteView}
            />
          )}

          <ViewOptions table={table} density={density} onDensityChange={onDensityChange} />

          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5">
              <Download aria-hidden="true" />
              <span className="hidden sm:inline">{exportLabel}</span>
              <span className="sr-only sm:hidden">{exportLabel}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="hidden md:block">
        <ActiveFilters
          fields={fields}
          query={query}
          onChange={onQueryChange}
          shown={quickFields.map((field) => field.name)}
        />
      </div>
    </div>
  );
}
