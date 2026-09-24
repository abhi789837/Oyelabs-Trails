import { useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Check, Search } from "lucide-react";

import type { FilterCondition } from "@shared/table";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FieldOption, TableFieldDef } from "../types";
import { FilterChip, FilterClearRow } from "./FilterChip";

/**
 * Multi-select over a known set of values, with a count beside each one.
 *
 * The counts are the point. A status filter without them is a guess; with them it is a summary of
 * the table — "6 active, 2 disabled" answers the question before the filter is even applied. They
 * are computed against every *other* part of the query (see `facetCounts`), so ticking one option
 * does not zero the rest and make the list look like a dead end.
 *
 * Searchable past eight options, because a list you have to scan is a list you have to read, and
 * below eight there is nothing to search.
 */

export interface FacetedFilterProps<TRow> {
  field: TableFieldDef<TRow>;
  /** Currently selected values. */
  selected: readonly string[];
  onChange: (values: string[]) => void;
  /** Value → matching rows. Absent for a server-paged table, where the chip just omits counts. */
  counts?: Map<string, number>;
}

/** The condition a faceted selection compiles to: one `in` over the chosen values. */
export function facetedConditions(field: string, values: readonly string[]): FilterCondition[] {
  if (values.length === 0) return [];
  return [{ field, operator: "in", value: [...values] }];
}

const SEARCH_THRESHOLD = 8;

export function FacetedFilter<TRow>({ field, selected, onChange, counts }: FacetedFilterProps<TRow>) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const options = field.options ?? [];
  const searchable = options.length > SEARCH_THRESHOLD;

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, term]);

  const selectedSet = new Set(selected);
  const summary =
    selected.length === 1
      ? (options.find((option) => option.value === selected[0])?.label ?? selected[0])
      : undefined;

  const toggle = (option: FieldOption) => {
    const next = new Set(selectedSet);
    if (next.has(option.value)) next.delete(option.value);
    else next.add(option.value);
    // Kept in the catalogue's order rather than click order, so the chip summary and the URL are
    // stable however the admin got there.
    onChange(options.filter((entry) => next.has(entry.value)).map((entry) => entry.value));
  };

  const move = (delta: number) => {
    setActive((current) => {
      if (visible.length === 0) return 0;
      const next = (current + delta + visible.length) % visible.length;
      listRef.current?.querySelectorAll<HTMLElement>('[role="option"]')[next]?.scrollIntoView({ block: "nearest" });
      return next;
    });
  };

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Enter" || (event.key === " " && !searchable)) {
      const option = visible[active];
      if (option) {
        event.preventDefault();
        toggle(option);
      }
    }
  };

  const listId = `facet-${field.name}-list`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FilterChip label={field.label} summary={summary} count={selected.length} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2" onKeyDown={handleKeyDown}>
        {searchable && (
          <Input
            autoFocus
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setActive(0);
            }}
            leading={<Search />}
            placeholder={`Search ${field.label.toLowerCase()}`}
            aria-label={`Search ${field.label} options`}
            aria-controls={listId}
            className="h-8 text-sm"
            containerClassName="mb-2"
          />
        )}

        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={field.label}
          className="max-h-64 space-y-0.5 overflow-y-auto"
        >
          {visible.length === 0 && <p className="px-2 py-3 text-center text-xs text-muted-foreground">No matches.</p>}

          {visible.map((option, index) => {
            const isSelected = selectedSet.has(option.value);
            const count = counts?.get(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                data-active={index === active || undefined}
                onMouseEnter={() => setActive(index)}
                onClick={() => toggle(option)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-[120ms]",
                  index === active && "bg-accent",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-[120ms]",
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input",
                  )}
                >
                  {isSelected && <Check className="size-3" strokeWidth={3} />}
                </span>
                {option.icon}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {count !== undefined && (
                  <span className="shrink-0 font-mono text-xs tabular text-muted-foreground">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <FilterClearRow onClear={() => onChange([])} disabled={selected.length === 0} />
      </PopoverContent>
    </Popover>
  );
}
