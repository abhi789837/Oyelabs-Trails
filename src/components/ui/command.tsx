import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";

import { cn } from "@/lib/utils";

/**
 * The command-menu primitive, on `cmdk`.
 *
 * One house rule comes with it: callers pass `shouldFilter={false}` and render a *capped* set of
 * results they filtered themselves. cmdk's built-in filter scores every mounted item on every
 * keystroke, and the curriculum is 715 topics — rendering them all and letting the library hide
 * most of them is the difference between a palette that opens instantly and one that stutters.
 * See `commandIndex.ts` for the matcher, which is where the ranking lives and is tested.
 */
const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn("flex h-full w-full flex-col overflow-hidden rounded-lg bg-surface text-foreground", className)}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

/**
 * The query field. `leading` is the search icon or a mode chip; the row is the element that draws
 * the border, so the chip sits inside the field rather than above it.
 */
const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & { leading?: React.ReactNode; trailing?: React.ReactNode }
>(({ className, leading, trailing, ...props }, ref) => (
  <div className="flex items-center gap-2.5 border-b px-3.5">
    {leading}
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "h-13 flex-1 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground disabled:opacity-50",
        className,
      )}
      {...props}
    />
    {trailing}
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      "max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain p-1.5",
      "[scrollbar-color:rgb(var(--basalt)/0.45)_transparent] [scrollbar-width:thin]",
      "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-basalt/40",
      className,
    )}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty ref={ref} className={cn("px-3 py-8 text-center text-sm text-muted-foreground", className)} {...props} />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden text-foreground",
      // Sentence case, not an ALL-CAPS eyebrow.
      "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className,
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-3 rounded-md px-2.5 py-2 text-sm outline-hidden",
      "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
      "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      "[&_svg]:size-4 [&_svg]:shrink-0",
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator ref={ref} className={cn("-mx-1.5 my-1 h-px bg-border", className)} {...props} />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

/** Right-aligned trailing text on a row: a level, a status, a shortcut. */
function CommandMeta({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ml-auto shrink-0 font-mono text-[11px] text-muted-foreground", className)} {...props} />;
}

export { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandMeta, CommandSeparator };
