import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";

import { scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A menu hung off a button — the user menu, and anything else that is a short list of commands
 * rather than a form.
 *
 * Controlled, like `Dialog` and unlike Radix's default, because the open state is what drives the
 * enter and exit animation: the content is `forceMount`ed inside an `AnimatePresence` so motion
 * owns the unmount. The root itself always stays mounted, since the trigger lives inside it.
 */
const OpenContext = React.createContext(false);

function DropdownMenu({
  open,
  onOpenChange,
  modal = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Radix's default traps the page behind the menu; a menu this small does not need that. */
  modal?: boolean;
  children: React.ReactNode;
}) {
  return (
    <OpenContext.Provider value={open}>
      <DropdownMenuPrimitive.Root open={open} onOpenChange={onOpenChange} modal={modal}>
        {children}
      </DropdownMenuPrimitive.Root>
    </OpenContext.Provider>
  );
}

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, children, sideOffset = 8, align = "end", ...props }, ref) => {
  const open = React.useContext(OpenContext);
  return (
    <DropdownMenuPrimitive.Portal forceMount>
      <AnimatePresence>
        {open && (
          <DropdownMenuPrimitive.Content
            ref={ref}
            asChild
            forceMount
            sideOffset={sideOffset}
            align={align}
            {...props}
          >
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              /* Grows out of the corner it is anchored to rather than its own middle. */
              style={{ transformOrigin: "var(--radix-dropdown-menu-content-transform-origin)" }}
              className={cn(
                "z-50 min-w-56 rounded-lg border bg-popover p-1 text-popover-foreground shadow-xl",
                className,
              )}
            >
              {children}
            </motion.div>
          </DropdownMenuPrimitive.Content>
        )}
      </AnimatePresence>
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

/**
 * One row. `tone="danger"` is for the row a person regrets clicking — it is never the first item
 * and it always sits below a separator.
 */
const itemClasses =
  "relative flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-hidden transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { tone?: "default" | "danger" }
>(({ className, tone = "default", ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      itemClasses,
      tone === "danger" &&
        "text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive [&_svg]:text-destructive",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem ref={ref} className={cn(itemClasses, "pr-8", className)} {...props}>
    {children}
    {/* The tick sits on the right so the icon column stays the icon column. */}
    <DropdownMenuPrimitive.ItemIndicator className="absolute right-2.5 flex items-center">
      <Check className="h-4 w-4 text-summit-strong" aria-hidden="true" />
    </DropdownMenuPrimitive.ItemIndicator>
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-2.5 py-1.5 text-xs font-medium text-muted-foreground", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
