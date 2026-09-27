import { useState } from "react";

import type { FilterCondition } from "@shared/table";

import { Calendar, endOfDay, startOfDay, type DateRange } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TableFieldDef } from "../types";
import { FilterChip, FilterClearRow } from "./FilterChip";

/**
 * A date range, as presets plus a calendar.
 *
 * The presets are not a shortcut to the calendar — they are what almost everyone actually wants.
 * "Last 7 days" is four words and one click; the same range picked on a grid is two clicks, a
 * month boundary and a chance to be off by one. The calendar is there for the other ten percent.
 *
 * **Ends are inclusive.** "1st to the 5th" from a person means the whole of the 5th, so `to` is
 * pushed to 23:59:59.999 before it becomes a filter. Without that, a range ending today silently
 * excludes everything that happened today, which reads as data loss.
 */

export interface DateRangeFilterProps<TRow> {
  field: TableFieldDef<TRow>;
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const DAY = 86_400_000;

export interface DatePreset {
  id: string;
  label: string;
  range: (now: number) => DateRange;
}

export const DATE_PRESETS: DatePreset[] = [
  { id: "today", label: "Today", range: (now) => ({ from: startOfDay(now), to: endOfDay(now) }) },
  { id: "7d", label: "Last 7 days", range: (now) => ({ from: startOfDay(now - 6 * DAY), to: endOfDay(now) }) },
  { id: "30d", label: "Last 30 days", range: (now) => ({ from: startOfDay(now - 29 * DAY), to: endOfDay(now) }) },
  {
    id: "month",
    label: "This month",
    range: (now) => {
      const start = new Date(now);
      start.setDate(1);
      return { from: startOfDay(start.getTime()), to: endOfDay(now) };
    },
  },
];

/** A range compiles to one `between`, with either end able to be open. */
export function dateRangeConditions(field: string, range: DateRange): FilterCondition[] {
  if (range.from === null && range.to === null) return [];
  return [{ field, operator: "between", value: [range.from, range.to === null ? null : endOfDay(range.to)] }];
}

/** Reads a `between` condition back into a range the calendar can show. */
export function rangeFromConditions(conditions: readonly FilterCondition[]): DateRange {
  const between = conditions.find((condition) => condition.operator === "between");
  if (!between || between.operator !== "between") return { from: null, to: null };
  const [from, to] = between.value;
  return {
    from: typeof from === "number" ? from : null,
    // Stored as the end of the day; shown as the day itself.
    to: typeof to === "number" ? startOfDay(to) : null,
  };
}

const formatter = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });

export function formatRange(range: DateRange): string | undefined {
  if (range.from === null && range.to === null) return undefined;
  if (range.from !== null && range.to === null) return `from ${formatter.format(range.from)}`;
  if (range.from === null && range.to !== null) return `until ${formatter.format(range.to)}`;
  if (range.from === range.to) return formatter.format(range.from!);
  return `${formatter.format(range.from!)} – ${formatter.format(range.to!)}`;
}

function matchesPreset(range: DateRange, preset: DatePreset, now: number): boolean {
  const candidate = preset.range(now);
  return range.from === candidate.from && range.to !== null && startOfDay(range.to) === startOfDay(candidate.to!);
}

export function DateRangeFilter<TRow>({ field, value, onChange }: DateRangeFilterProps<TRow>) {
  const [open, setOpen] = useState(false);
  const now = Date.now();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FilterChip label={field.label} summary={formatRange(value)} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <div role="group" aria-label={`${field.label} presets`} className="mb-2 grid grid-cols-2 gap-1">
          {DATE_PRESETS.map((preset) => {
            const isCurrent = matchesPreset(value, preset, now);
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={isCurrent}
                onClick={() => {
                  onChange(preset.range(now));
                  setOpen(false);
                }}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors duration-[120ms]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
                  isCurrent
                    ? "border-primary/40 bg-primary/10 text-primary-strong"
                    : "border-transparent bg-surface-sunken text-muted-foreground hover:text-foreground",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <Calendar
          value={value}
          onChange={onChange}
          label={`${field.label} range`}
          // Nothing in this app happens in the future, so offering next month is offering an
          // empty result.
          max={now}
        />

        <FilterClearRow
          onClear={() => onChange({ from: null, to: null })}
          disabled={value.from === null && value.to === null}
        />
      </PopoverContent>
    </Popover>
  );
}
