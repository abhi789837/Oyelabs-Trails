import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A month grid for picking a date range. Hand-written, and deliberately not a dependency.
 *
 * A calendar library is 40 kB of bundle and a second theming system to fight, for a control that
 * appears in exactly one place in this app: the date filter on an admin table. What it does need
 * is to be operable from the keyboard, which is the part calendars usually get wrong — so the
 * grid is a real `role="grid"` with roving focus, arrow keys moving a day at a time across month
 * boundaries, PageUp/PageDown moving a month, and Home/End jumping to the ends of the week.
 *
 * Dates in and out are **epoch milliseconds at local midnight**. The caller decides what the end
 * of a range means; `DateRangeFilter` pushes it to the last millisecond of the day, because
 * "up to the 5th" from a person means the 5th included.
 */

export interface DateRange {
  from: number | null;
  to: number | null;
}

export interface CalendarProps {
  /** The range being built. A `from` with no `to` is a half-made range, and renders as one. */
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** Month to show first, as epoch ms. Defaults to the month of `value.from`, else today. */
  defaultMonth?: number;
  /** Days outside this window are shown but not selectable. */
  min?: number;
  max?: number;
  className?: string;
  /** Names the grid for screen readers when the surrounding popover does not. */
  label?: string;
}

export function startOfDay(value: number | Date): number {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function endOfDay(value: number | Date): number {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

function startOfMonth(value: number): number {
  const date = new Date(value);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function addMonths(value: number, delta: number): number {
  const date = new Date(value);
  date.setDate(1);
  date.setMonth(date.getMonth() + delta);
  return date.getTime();
}

function addDays(value: number, delta: number): number {
  const date = new Date(value);
  date.setDate(date.getDate() + delta);
  return startOfDay(date.getTime());
}

/** Monday-first. Getting this from the locale is unreliable across browsers, and this is an
 * internal tool for one team — so it is a stated convention rather than a guess. */
function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const monthFormat = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** The six-week grid that always covers the month, so the popover never changes height. */
function monthGrid(month: number): number[] {
  const first = startOfMonth(month);
  const start = addDays(first, -weekdayIndex(new Date(first)));
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function Calendar({ value, onChange, defaultMonth, min, max, className, label = "Calendar" }: CalendarProps) {
  const today = startOfDay(Date.now());
  const [month, setMonth] = React.useState(() => startOfMonth(defaultMonth ?? value.from ?? today));
  const [focused, setFocused] = React.useState(() => value.from ?? today);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  /* Focus follows the arrow keys only after a key has been pressed. Without this the calendar
     would steal focus from the trigger the moment it opened. */
  const shouldFocus = React.useRef(false);

  React.useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>('[data-focused="true"]')?.focus();
  }, [focused, month]);

  const disabled = (day: number) => (min !== undefined && day < startOfDay(min)) || (max !== undefined && day > startOfDay(max));

  const moveFocus = (next: number) => {
    shouldFocus.current = true;
    setFocused(next);
    if (next < startOfMonth(month) || next >= addMonths(month, 1)) setMonth(startOfMonth(next));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in keys) {
      event.preventDefault();
      moveFocus(addDays(focused, keys[event.key]!));
      return;
    }
    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      moveFocus(addMonths(focused, event.key === "PageUp" ? -1 : 1));
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const offset = weekdayIndex(new Date(focused));
      moveFocus(addDays(focused, event.key === "Home" ? -offset : 6 - offset));
    }
  };

  /**
   * Click semantics: the first click starts a range, the second closes it, the third starts over.
   * Clicking before the start swaps the ends rather than refusing, because dragging backwards
   * through a calendar is what people actually do when they realise they went too far.
   */
  const select = (day: number) => {
    if (value.from === null || value.to !== null) {
      onChange({ from: day, to: null });
      return;
    }
    onChange(day < value.from ? { from: day, to: value.from } : { from: value.from, to: day });
  };

  const days = monthGrid(month);
  const monthStart = startOfMonth(month);
  const monthEnd = addMonths(month, 1);

  // While only one end is chosen, the hovered day stands in for the other, so the range the next
  // click would produce is visible before committing to it.
  const previewTo = value.from !== null && value.to === null && hovered !== null ? hovered : value.to;
  const rangeStart = value.from !== null && previewTo !== null ? Math.min(value.from, previewTo) : value.from;
  const rangeEnd = value.from !== null && previewTo !== null ? Math.max(value.from, previewTo) : value.to;

  return (
    <div className={cn("w-[17.5rem] select-none", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, -1))}
          aria-label="Previous month"
          className="rounded-md p-1.5 text-muted-foreground transition-colors duration-[120ms] hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <div aria-live="polite" className="font-brand text-sm font-semibold">
          {monthFormat.format(month)}
        </div>
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          aria-label="Next month"
          className="rounded-md p-1.5 text-muted-foreground transition-colors duration-[120ms] hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label={label}
        onKeyDown={handleKeyDown}
        onMouseLeave={() => setHovered(null)}
      >
        <div role="row" className="grid grid-cols-7">
          {WEEKDAYS.map((day) => (
            <div key={day} role="columnheader" aria-label={day} className="py-1 text-center font-mono text-[0.625rem] text-muted-foreground">
              {day.slice(0, 2)}
            </div>
          ))}
        </div>

        {Array.from({ length: 6 }, (_, week) => (
          <div role="row" key={week} className="grid grid-cols-7">
            {days.slice(week * 7, week * 7 + 7).map((day) => {
              const outside = day < monthStart || day >= monthEnd;
              const isFrom = day === value.from;
              const isTo = day === value.to;
              const inRange = rangeStart !== null && rangeEnd !== null && day > rangeStart && day < rangeEnd;
              const isEnd = rangeStart !== null && rangeEnd !== null && (day === rangeStart || day === rangeEnd);
              const isDisabled = disabled(day);

              return (
                <div role="gridcell" key={day} aria-selected={isEnd || inRange}>
                  <button
                    type="button"
                    data-focused={day === focused}
                    tabIndex={day === focused ? 0 : -1}
                    disabled={isDisabled}
                    onClick={() => select(day)}
                    onMouseEnter={() => setHovered(day)}
                    onFocus={() => setFocused(day)}
                    aria-label={dayFormat.format(day)}
                    aria-current={day === today ? "date" : undefined}
                    className={cn(
                      "relative flex h-9 w-full items-center justify-center text-sm tabular transition-colors duration-[120ms]",
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong",
                      outside && "text-muted-foreground/50",
                      isDisabled && "cursor-not-allowed opacity-40",
                      !isDisabled && !isEnd && "hover:bg-accent",
                      inRange && "bg-primary/15",
                      isFrom && "rounded-l-md",
                      isTo && "rounded-r-md",
                      isEnd && "bg-primary font-semibold text-primary-foreground",
                      day === today && !isEnd && "font-semibold text-primary-strong",
                    )}
                  >
                    {new Date(day).getDate()}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
