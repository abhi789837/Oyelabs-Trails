import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The bare field, shared by every input in the app so heights line up in a toolbar.
 * `aria-invalid` drives the error border, which means the visual state and the state screen
 * readers announce can never disagree.
 */
export const inputClasses =
  "flex h-10 w-full rounded-md border border-input bg-surface px-3 py-2 text-base transition-[border-color] duration-[120ms] placeholder:text-muted-foreground aria-[invalid=true]:border-destructive disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

export interface InputProps extends React.ComponentProps<"input"> {
  /** Rendered inside the field on the left. An icon, or a short unit. Not interactive. */
  leading?: React.ReactNode;
  /** Rendered inside the field on the right. May be interactive — a toggle, a stepper. */
  trailing?: React.ReactNode;
  /** Adds a clear button once the field has a value. Controlled fields only. */
  onClear?: () => void;
  className?: string;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, containerClassName, type, leading, trailing, onClear, ...props }, ref) => {
    const showClear = Boolean(onClear) && String(props.value ?? "").length > 0 && !props.disabled;
    const addonCount = (showClear ? 1 : 0) + (trailing ? 1 : 0);

    const field = (
      <input
        type={type}
        className={cn(
          inputClasses,
          leading && "pl-9",
          addonCount === 1 && "pr-9",
          addonCount === 2 && "pr-16",
          className,
        )}
        ref={ref}
        {...props}
      />
    );

    /* No addons means no wrapper: the plain case stays a single element, so a caller that
       positions the field itself is not suddenly fighting an extra div. */
    if (!leading && !trailing && !onClear) return field;

    return (
      <div className={cn("relative", containerClassName)}>
        {leading && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground [&_svg]:size-4"
          >
            {leading}
          </span>
        )}
        {field}
        {addonCount > 0 && (
          <span className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 text-muted-foreground [&_svg]:size-4">
            {showClear && (
              <button
                type="button"
                onClick={onClear}
                aria-label="Clear"
                className="flex h-6 w-6 items-center justify-center rounded-sm transition-colors duration-[120ms] hover:bg-accent hover:text-foreground"
              >
                <X />
              </button>
            )}
            {trailing}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
