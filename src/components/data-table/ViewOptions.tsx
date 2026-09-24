import type { Table } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TableDensity } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Column visibility and row density.
 *
 * A popover rather than a menu, because a menu closes on every click and hiding four columns is
 * four round trips through a button. Here the panel stays open and the table redraws behind it,
 * which is also how you find out you hid the wrong one.
 *
 * Neither setting goes in the URL: they are how this person likes to read the table, not part of
 * the question the table is answering (see `useTableQueryState`).
 */

export interface ViewOptionsProps<TRow> {
  table: Table<TRow>;
  density: TableDensity;
  onDensityChange: (density: TableDensity) => void;
}

const DENSITIES: { value: TableDensity; label: string }[] = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

export function ViewOptions<TRow>({ table, density, onDensityChange }: ViewOptionsProps<TRow>) {
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide() && typeof column.columnDef.header !== "function");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings2 aria-hidden="true" />
          View
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-56 p-2">
        <fieldset>
          <legend className="px-2 pb-1 font-mono text-xs text-muted-foreground">Density</legend>
          <div role="radiogroup" aria-label="Row density" className="mb-2 flex gap-1 px-1">
            {DENSITIES.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={density === option.value}
                tabIndex={density === option.value ? 0 : -1}
                onClick={() => onDensityChange(option.value)}
                className={cn(
                  "flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors duration-[120ms]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
                  density === option.value
                    ? "border-primary/40 bg-primary/10 font-medium text-primary-strong"
                    : "border-transparent bg-surface-sunken text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="border-t pt-2">
          <p className="px-2 pb-1 font-mono text-xs text-muted-foreground" id="column-visibility-label">
            Columns
          </p>
          <ul aria-labelledby="column-visibility-label" className="max-h-56 space-y-0.5 overflow-y-auto">
            {columns.map((column) => {
              const id = `column-toggle-${column.id}`;
              const label = String(column.columnDef.header ?? column.id);
              return (
                <li key={column.id}>
                  <label
                    htmlFor={id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-[120ms] hover:bg-accent"
                  >
                    <Checkbox
                      id={id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(checked) => column.toggleVisibility(checked === true)}
                    />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
