import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { inputClasses } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type" | "min" | "max" | "step"> {
  /** `null` is an empty field, which is different from 0 and has to stay tellable apart. */
  value: number | null;
  onChange: (next: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  containerClassName?: string;
}

/**
 * A number field with its own steppers. The native `<input type="number">` spinners are hidden:
 * they are two different sizes across browsers, they disappear entirely until hover on some, and
 * they are too small to hit on a touch screen.
 *
 * The buttons are `tabIndex={-1}` on purpose — the field already answers ArrowUp and ArrowDown, so
 * putting the steppers in the tab order would add two stops that do nothing new.
 */
const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, min, max, step = 1, className, containerClassName, disabled, onBlur, ...props }, ref) => {
    const clamp = (n: number) => Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, n));
    const nudge = (direction: 1 | -1) => onChange(clamp((value ?? min ?? 0) + direction * step));

    const atMax = max !== undefined && value !== null && value >= max;
    const atMin = min !== undefined && value !== null && value <= min;
    const stepperClass =
      "flex h-4 w-6 items-center justify-center rounded-[3px] text-muted-foreground transition-colors duration-[120ms] hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

    return (
      <div className={cn("relative", containerClassName)}>
        {/* Spread first: the handlers below are the component's own contract and a caller must not
            replace them by passing `onChange`. `onBlur` is chained rather than overwritten. */}
        <input
          {...props}
          ref={ref}
          type="number"
          inputMode="numeric"
          value={value ?? ""}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange(null);
            const parsed = Number(raw);
            if (!Number.isNaN(parsed)) onChange(parsed);
          }}
          onBlur={(e) => {
            // Clamp on the way out, not on every keystroke: typing "12" into a max-of-60 field
            // passes through "1", and snapping that to the minimum makes the field unusable.
            if (value !== null) onChange(clamp(value));
            onBlur?.(e);
          }}
          className={cn(
            inputClasses,
            "pr-9 tabular [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            className,
          )}
        />
        <span className="absolute right-1.5 top-1/2 flex -translate-y-1/2 flex-col gap-0.5">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            disabled={disabled || atMax}
            onClick={() => nudge(1)}
            className={stepperClass}
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            disabled={disabled || atMin}
            onClick={() => nudge(-1)}
            className={stepperClass}
          >
            <ChevronDown className="size-3.5" />
          </button>
        </span>
      </div>
    );
  },
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
