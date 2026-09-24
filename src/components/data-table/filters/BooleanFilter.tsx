import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import type { FilterCondition } from "@shared/table";

import { cn } from "@/lib/utils";
import type { TableFieldDef } from "../types";

/**
 * A yes/no/either filter, as three chips.
 *
 * Not a switch. A switch has two positions and this filter has three — yes, no, and *not
 * filtering at all* — and a two-state control cannot express the third without a second control
 * beside it to turn the first one off. Three chips in a radio group say it in one row, and the
 * middle one is the default rather than a hidden state.
 *
 * `role="radiogroup"` because the three are mutually exclusive: arrow keys move between them and
 * only the chosen one is in the tab order, which is what a keyboard user expects of a choice.
 */

export interface BooleanFilterProps<TRow> {
  field: TableFieldDef<TRow>;
  /** `null` is "either" — the filter is off. */
  value: boolean | null;
  onChange: (next: boolean | null) => void;
}

export function booleanConditions(field: string, value: boolean | null): FilterCondition[] {
  if (value === null) return [];
  return [{ field, operator: "eq", value }];
}

export function booleanFromConditions(conditions: readonly FilterCondition[]): boolean | null {
  const match = conditions.find((condition) => condition.operator === "eq" && typeof condition.value === "boolean");
  if (!match || match.operator !== "eq" || typeof match.value !== "boolean") return null;
  return match.value;
}

export function BooleanFilter<TRow>({ field, value, onChange }: BooleanFilterProps<TRow>) {
  const choices: { id: string; label: string; value: boolean | null }[] = [
    { id: "any", label: "Either", value: null },
    { id: "yes", label: field.trueLabel ?? "Yes", value: true },
    { id: "no", label: field.falseLabel ?? "No", value: false },
  ];

  const index = choices.findIndex((choice) => choice.value === value);

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = choices[(index + delta + choices.length) % choices.length]!;
    onChange(next.value);
    // Moving the selection moves focus with it, which is how a radio group behaves natively.
    (event.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-choice="${next.id}"]`)?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={field.label}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex h-8 items-center gap-0.5 rounded-md border p-0.5",
        value === null ? "border-dashed border-input" : "border-primary/40 bg-primary/5",
      )}
    >
      <span className="px-1.5 text-xs font-medium text-muted-foreground">{field.label}</span>
      {choices.map((choice) => {
        const checked = choice.value === value;
        return (
          <button
            key={choice.id}
            type="button"
            role="radio"
            data-choice={choice.id}
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(choice.value)}
            className={cn(
              "rounded-[4px] px-2 py-1 text-xs transition-colors duration-[120ms]",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-strong",
              checked ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}
