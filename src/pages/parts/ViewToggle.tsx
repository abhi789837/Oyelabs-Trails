import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A two-or-more-way view switch.
 *
 * Built as a radio group rather than a row of toggle buttons: "trail view or list view" is one
 * choice with several answers, not several independent switches, and a radio group is the role
 * that says so. That also buys the arrow-key behaviour people expect from a segmented control —
 * one Tab stop for the whole thing, arrows to move within it — which a row of buttons does not
 * have unless it is written by hand anyway.
 */

export interface ViewOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export interface ViewToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly ViewOption<T>[];
  /** Names the group for assistive technology, e.g. "How to show your plan". */
  label: string;
  className?: string;
}

export function ViewToggle<T extends string>({ value, onChange, options, label, className }: ViewToggleProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (from: number, delta: number) => {
    const next = (from + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex items-center gap-0.5 rounded-md border bg-surface-sunken p-0.5", className)}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                move(index, 1);
              } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                move(index, -1);
              }
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-sm font-medium transition-colors duration-[120ms]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
              "[&_svg]:size-3.5 [&_svg]:shrink-0",
              selected ? "bg-surface text-foreground shadow-sm shadow-ink/5" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Remembers a view choice in this browser.
 *
 * A per-viewer convenience and nothing more: which way someone likes to read their own plan is not
 * worth a server round trip, and it must survive a blocked or cleared `localStorage` without
 * taking the page down with it.
 */
export function useStoredView<T extends string>(key: string, fallback: T, allowed: readonly T[]): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored && (allowed as readonly string[]).includes(stored) ? (stored as T) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Private window, blocked site data. The choice just does not outlive the page.
    }
  }, [key, value]);

  return [value, useCallback((next: T) => setValue(next), [])];
}
