import * as React from "react";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Read out after the label, e.g. a track's one-line description. */
  description?: string;
}

export interface SegmentedProps<T extends string> {
  /** The group's accessible name. Pass `labelledBy` instead when a visible label already exists. */
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  options: readonly SegmentedOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
}

/**
 * A single choice from a short list, shown all at once: department, track, experience, level.
 *
 * A `radiogroup` with a roving tab stop — Tab enters on the selected option (or the first), the
 * arrow keys move and select, Home and End jump. Options wrap rather than scroll, so a department
 * with seven tracks still fits a 390px screen without a hidden overflow.
 */
function Segmented<T extends string>({
  label,
  labelledBy,
  describedBy,
  options,
  value,
  onChange,
  disabled,
  size = "default",
  className,
}: SegmentedProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const tabStop = selectedIndex >= 0 ? selectedIndex : 0;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || options.length === 0) return;
    const current = refs.current.findIndex((node) => node === document.activeElement);
    const from = current >= 0 ? current : tabStop;
    let next = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (from + 1) % options.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (from - 1 + options.length) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    if (next < 0) return;
    event.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-disabled={disabled || undefined}
      onKeyDown={handleKeyDown}
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={index === tabStop ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md border text-sm transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:pointer-events-none disabled:opacity-50",
              size === "sm" ? "h-8 min-w-9 px-2.5" : "h-9 px-3",
              checked
                ? "border-primary bg-primary font-medium text-primary-foreground"
                : "border-input bg-surface text-foreground hover:bg-surface-sunken",
            )}
          >
            {option.label}
            {option.description && <span className="sr-only">. {option.description}</span>}
          </button>
        );
      })}
    </div>
  );
}

export { Segmented };
