import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { spring, transition } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A controlled modal dialog, for content the learner or admin can walk away from — unlike
 * `AlertDialog`, clicking the backdrop closes it. `useFormDialog` is the main consumer.
 */
function Dialog({
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
        <DialogPrimitive.Root open onOpenChange={onOpenChange}>
          {children}
        </DialogPrimitive.Root>
      ) : null}
    </AnimatePresence>
  );
}

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Hides the corner close button, for dialogs whose own footer is the only way out. */
  hideClose?: boolean;
  closeLabel?: string;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideClose = false, closeLabel = "Close", ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay asChild>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition.fast}
        className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[6px]"
      />
    </DialogPrimitive.Overlay>
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
      <DialogPrimitive.Content ref={ref} asChild {...props}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          transition={spring}
          className={cn(
            // The panel scrolls, not the wrapper: Radix hands the content element to RemoveScroll as a
            // shard, so a tall dialog on a short screen is the one thing still allowed to move.
            "pointer-events-auto relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border bg-surface p-6 text-foreground shadow-2xl",
            className,
          )}
        >
          {children}
          {!hideClose && (
            <DialogPrimitive.Close className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{closeLabel}</span>
            </DialogPrimitive.Close>
          )}
        </motion.div>
      </DialogPrimitive.Content>
    </div>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("font-display text-lg font-semibold", className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("mt-2 text-sm leading-relaxed text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

const DialogClose = DialogPrimitive.Close;

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle };
