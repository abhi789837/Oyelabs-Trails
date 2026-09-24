import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A checkbox that can be indeterminate, which is the only reason this exists rather than a bare
 * `<input type="checkbox">`: the select-all box at the top of a table is genuinely a third state,
 * and a native checkbox can only be put into it from JavaScript after render, where a screen
 * reader has already announced it as unchecked.
 *
 * Pass `checked="indeterminate"` for that state. Radix sets `aria-checked="mixed"`, which is what
 * "some of these rows" actually means.
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input bg-surface transition-colors duration-[120ms]",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      {props.checked === "indeterminate" ? (
        <Minus className="size-3" strokeWidth={3} aria-hidden="true" />
      ) : (
        <Check className="size-3" strokeWidth={3} aria-hidden="true" />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
