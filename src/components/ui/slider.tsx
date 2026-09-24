import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

/**
 * A range slider. Give `value` two numbers and it grows two thumbs.
 *
 * Every thumb needs its own name. Radix cannot invent one, and "slider, slider" read out twice is
 * useless, so `thumbLabels` is required rather than optional — a two-handled range whose ends are
 * both called "Minimum" is a control a screen-reader user cannot operate.
 *
 * A slider alone is never the whole filter: it is approximate by nature and impossible to hit an
 * exact value with on a trackpad. `NumberRangeFilter` pairs it with two number inputs, which is
 * where an exact bound gets typed.
 */
export interface SliderProps extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, "aria-label"> {
  /** One label per thumb, in order. */
  thumbLabels: readonly string[];
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, thumbLabels, ...props }, ref) => (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center py-2", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-sunken">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {thumbLabels.map((label) => (
        <SliderPrimitive.Thumb
          key={label}
          aria-label={label}
          className="block size-4 rounded-full border-2 border-primary bg-surface shadow-sm transition-transform duration-[120ms] hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  ),
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
