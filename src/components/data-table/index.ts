/**
 * The DataTable kit.
 *
 * One import for a screen that needs a table:
 *
 * ```tsx
 * const { query, setQuery } = useTableQueryState();
 * <DataTable
 *   data={users} columns={columns} fields={peopleFields} getRowId={(u) => u.id}
 *   query={query} onQueryChange={setQuery}
 *   tableKey="admin.people" accountId={me.id} builtInViews={peopleBuiltInViews}
 *   noun="learner" exportName="people"
 *   emptyState={{ title: "No one here yet", body: "…", action: <Button…/> }}
 *   renderDetail={(user) => <LearnerSummary user={user} />}
 *   mobileCard={(user) => <PersonCard user={user} />}
 * />
 * ```
 *
 * The pieces are exported individually as well, because a screen with an unusual shape is better
 * off assembling the toolbar and the pagination around its own layout than bending `DataTable`
 * into a shape it was not meant for.
 */

export { DataTable, type DataTableProps } from "./DataTable";
export { DataTableToolbar, type DataTableToolbarProps } from "./DataTableToolbar";
export { DataTablePagination, type DataTablePaginationProps } from "./DataTablePagination";
export { EmptyState, ErrorState, NoMatchesState, SkeletonRows } from "./DataTableStates";
export { BulkActionBar, type BulkActionBarProps } from "./BulkActionBar";
export { FilterDrawer, type FilterDrawerProps } from "./FilterDrawer";
export { SavedViews, type SavedViewsProps } from "./SavedViews";
export { ViewOptions, type ViewOptionsProps } from "./ViewOptions";

export { FacetedFilter, facetedConditions } from "./filters/FacetedFilter";
export {
  DateRangeFilter,
  DATE_PRESETS,
  dateRangeConditions,
  formatRange,
  rangeFromConditions,
} from "./filters/DateRangeFilter";
export {
  NumberRangeFilter,
  formatNumberRange,
  numberRangeConditions,
  numberRangeFromConditions,
  type NumberRange,
} from "./filters/NumberRangeFilter";
export { BooleanFilter, booleanConditions, booleanFromConditions } from "./filters/BooleanFilter";
export { AdvancedFilter } from "./filters/AdvancedFilter";
export { ActiveFilters } from "./filters/ActiveFilters";
export { QuickFilter, describeFieldFilter } from "./filters/QuickFilters";
export { FilterChip, FilterClearRow } from "./filters/FilterChip";

export {
  applyTableQuery,
  conditionMatches,
  conditionsForField,
  facetCounts,
  fieldValue,
  filterRows,
  findField,
  rowMatches,
  setFieldConditions,
  sortRows,
  type ClientTableResult,
} from "./query";
export { csvFileName, downloadCsv, escapeCsvCell, toCsv, type CsvColumn } from "./csv";
export { isSameView, loadViews, removeView, saveViews, upsertView, viewsStorageKey } from "./viewStorage";
export { useDebounced, useTablePreferences, useTableQueryState, type TablePreferences } from "./useTableQueryState";

export type {
  BuiltInView,
  BulkAction,
  EmptyStateCopy,
  FieldOption,
  SavedView,
  TableFieldDef,
  TableFieldType,
} from "./types";

export { peopleBuiltInViews, peopleFields } from "./presets/people";
