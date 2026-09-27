import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AnimatePresence, motion } from "motion/react";

import { spring, transition } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A controlled alert dialog: a question the app cannot continue past.
 *
 * Two departures from the stock shadcn version, both deliberate:
 *
 * - There is no trigger. Every use is imperative, through `useConfirm`, because the call sites are
 *   event handlers that need an answer before they do anything, not components that own open state.
 * - `AnimatePresence` wraps Radix's root rather than `forceMount` wrapping its content. With
 *   `forceMount` the focus scope stays trapped after close; this way Radix mounts and unmounts
 *   normally — so focus returns to whatever was focused before — and the exit animation still runs.
 */
function AlertDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <AlertDialogPrimitive.Root open onOpenChange={onOpenChange}>
          {children}
        </AlertDialogPrimitive.Root>
      ) : null}
    </AnimatePresence>
  );
}

interface AlertDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> {
  /**
   * Drops the scale/slide, leaving only the fade. The assessment runner uses it: a learner being
   * stopped mid-question needs a clear stop, not a flourish.
   */
  calm?: boolean;
}

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  AlertDialogContentProps
>(({ className, calm = false, children, ...props }, ref) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogPrimitive.Overlay asChild>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition.fast}
        className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[6px]"
      />
    </AlertDialogPrimitive.Overlay>
    {/* The panel is centred by this wrapper rather than by a transform, so Motion owns `transform`
        outright and the two never fight over it. */}
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
      <AlertDialogPrimitive.Content ref={ref} asChild {...props}>
        <motion.div
          initial={calm ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={calm ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 6 }}
          transition={calm ? transition.fast : spring}
          className={cn(
            // The panel scrolls, not the wrapper: Radix hands the content element to RemoveScroll as a
            // shard, so a tall dialog on a short screen is the one thing still allowed to move.
            "pointer-events-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border bg-surface p-6 text-foreground shadow-2xl",
            className,
          )}
        >
          {children}
        </motion.div>
      </AlertDialogPrimitive.Content>
    </div>
  </AlertDialogPrimitive.Portal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("font-display text-lg font-semibold", className)}
    {...props}
  />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("mt-2 text-sm leading-relaxed text-muted-foreground", className)}
    {...props}
  />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

/** The buttons. Stacked on a phone, right-aligned and reversed from a small screen up. */
function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

const AlertDialogCancel = AlertDialogPrimitive.Cancel;

export {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
};
