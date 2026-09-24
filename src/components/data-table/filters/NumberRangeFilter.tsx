import { useEffect, useState } from "react";

import type { FilterCondition } from "@shared/table";

import { NumberInput } from "@/components/ui/number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import type { TableFieldDef } from "../types";
import { FilterChip, FilterClearRow } from "./FilterChip";

/**
 * A numeric range: a two-handled slider for the shape of it, two inputs for the exact value.
 *
 * Both, not one. A slider alone cannot be set to exactly 3 on a trackpad and cannot express "at
 * least 1" on a scale that runs to 400; two inputs alone give no sense of where the values
 * actually lie. They edit the same range, and each redraws the other.
 *
 * An end left empty is an open end. `null` here means "no bound", never zero — a filter reading
 * "0 to 5" excludes nothing and means something quite different from "up to 5".
 */

export interface NumberRange {
  min: number | null;
  max: number | null;
}

export interface NumberRangeFilterProps<TRow> {
  field: TableFieldDef<TRow>;
  value: NumberRange;
  onChange: (range: NumberRange) => void;
}

export function numberRangeConditions(field: string, range: NumberRange): FilterCondition[] {
  if (range.min === null && range.max === null) return [];
  return [{ field, operator: "between", value: [range.min, range.max] }];
}

export function numberRangeFromConditions(conditions: readonly FilterCondition[]): NumberRange {
  const between = conditions.find((condition) => condition.operator === "between");
  if (!between || between.operator !== "between") return { min: null, max: null };
  const [min, max] = between.value;
  return { min: typeof min === "number" ? min : null, max: typeof max === "number" ? max : null };
}

export function formatNumberRange(range: NumberRange, unit?: string): string | undefined {
  const suffix = unit ? ` ${unit}` : "";
  if (range.min === null && range.max === null) return undefined;
  if (range.min !== null && range.max === null) return `${range.min}${suffix} or more`;
  if (range.min === null && range.max !== null) return `up to ${range.max}${suffix}`;
  if (range.min === range.max) return `${range.min}${suffix}`;
  return `${range.min} – ${range.max}${suffix}`;
}

export function NumberRangeFilter<TRow>({ field, value, onChange }: NumberRangeFilterProps<TRow>) {
  const [open, setOpen] = useState(false);
  const bounds = { min: field.min ?? 0, max: field.max ?? 100 };

  /* The slider is continuous and fires on every pixel of a drag, so it drives local state and
     only commits on release. Without that, dragging one handle across a 300-row table would run
     the filter — and rewrite the URL — a hundred times. */
  const [draft, setDraft] = useState<[number, number]>([value.min ?? bounds.min, value.max ?? bounds.max]);
  useEffect(() => {
    setDraft([value.min ?? bounds.min, value.max ?? bounds.max]);
  }, [value.min, value.max, bounds.min, bounds.max]);

  const commitSlider = ([low, high]: number[]) => {
    // Back at a bound means "no bound", so dragging a handle all the way out clears that end
    // rather than pinning the filter to the extreme value.
    onChange({
      min: low === bounds.min ? null : (low ?? null),
      max: high === bounds.max ? null : (high ?? null),
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FilterChip label={field.label} summary={formatNumberRange(value, field.unit)} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <Slider
          value={draft}
          min={bounds.min}
          max={bounds.max}
          step={field.step ?? 1}
          minStepsBetweenThumbs={0}
          onValueChange={(next) => setDraft([next[0]!, next[1]!])}
          onValueCommit={commitSlider}
          thumbLabels={[`Minimum ${field.label.toLowerCase()}`, `Maximum ${field.label.toLowerCase()}`]}
        />

        <div className="mt-3 flex items-center gap-2">
          <NumberInput
            value={value.min}
            onChange={(next) => onChange({ ...value, min: next })}
            min={bounds.min}
            max={bounds.max}
            step={field.step ?? 1}
            placeholder={String(bounds.min)}
            aria-label={`Minimum ${field.label.toLowerCase()}`}
            className="h-8"
            containerClassName="min-w-0 flex-1"
          />
          <span aria-hidden="true" className="text-xs text-muted-foreground">
            to
          </span>
          <NumberInput
            value={value.max}
            onChange={(next) => onChange({ ...value, max: next })}
            min={bounds.min}
            max={bounds.max}
            step={field.step ?? 1}
            placeholder={String(bounds.max)}
            aria-label={`Maximum ${field.label.toLowerCase()}`}
            className="h-8"
            containerClassName="min-w-0 flex-1"
          />
        </div>

        <FilterClearRow
          onClear={() => onChange({ min: null, max: null })}
          disabled={value.min === null && value.max === null}
        />
      </PopoverContent>
    </Popover>
  );
}
