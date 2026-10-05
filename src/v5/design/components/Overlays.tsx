import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { Search, X } from "lucide-react";
import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { Toaster, toast } from "sonner";

import { cn } from "../cn";

import { useIsMobile } from "../hooks";
import { Kbd } from "./Primitives";

// ---------------------------------------------------------------------------
// Focus return
// ---------------------------------------------------------------------------

/**
 * Radix returns focus to its own Trigger. A dialog opened from state (no Trigger) would drop focus
 * on <body>, so remember what had focus when it opened and go back there on close (WCAG 2.4.3).
 */
function useReturnFocus(open: boolean | undefined) {
  const opener = useRef<HTMLElement | null>(null);
  if (open && !opener.current && typeof document !== "undefined") opener.current = document.activeElement as HTMLElement | null;
  if (!open && opener.current && typeof document !== "undefined" && !document.body.contains(opener.current)) opener.current = null;
  return (event: Event) => {
    const el = opener.current;
    opener.current = null;
    if (el && document.body.contains(el)) {
      event.preventDefault();
      el.focus();
    }
  };
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons, right-aligned. The primary action goes last. */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  closeLabel?: string;
}

const DIALOG_WIDTH = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" } as const;

function CloseButton({ label }: { label: string }) {
  return (
    <DialogPrimitive.Close className="absolute right-3 top-3 grid size-8 place-items-center rounded-control text-fg-2 hover:bg-sunken hover:text-fg-1" aria-label={label}>
      <X className="size-4" aria-hidden="true" />
    </DialogPrimitive.Close>
  );
}

/** A centred dialog. Focus is trapped and returns to the trigger; Escape closes it. */
export function Dialog({ open, onOpenChange, trigger, title, description, children, footer, size = "md", closeLabel = "Close" }: DialogProps) {
  const onCloseAutoFocus = useReturnFocus(trigger ? undefined : open);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="v5-scrim fixed inset-0 z-50 bg-scrim/50" />
        <DialogPrimitive.Content
          className={cn(
            "v5-dialog fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
            "rounded-sheet border border-line-1 bg-surface-3 p-6 text-fg-1 shadow-e3",
            DIALOG_WIDTH[size],
          )}
          onCloseAutoFocus={onCloseAutoFocus}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <DialogPrimitive.Title className="pr-8 font-display text-h3 font-semibold">{title}</DialogPrimitive.Title>
          {description ? <DialogPrimitive.Description className="mt-1 text-small text-fg-2">{description}</DialogPrimitive.Description> : null}
          {children ? <div className="mt-4">{children}</div> : null}
          {footer ? <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div> : null}
          <CloseButton label={closeLabel} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// Sheet (right panel on desktop, bottom sheet on mobile; Radix Dialog, no Vaul)
// ---------------------------------------------------------------------------

export interface SheetProps extends Omit<DialogProps, "size"> {
  /** "auto": bottom below 768px, right above. */
  side?: "auto" | "right" | "bottom";
  width?: "sm" | "md" | "lg";
  /** Non-modal: the page behind stays usable (the tutor panel on desktop). */
  modal?: boolean;
}

const SHEET_WIDTH = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-2xl" } as const;

export function Sheet({ open, onOpenChange, trigger, title, description, children, footer, side = "auto", width = "md", modal = true, closeLabel = "Close" }: SheetProps) {
  const mobile = useIsMobile();
  const resolved = side === "auto" ? (mobile ? "bottom" : "right") : side;
  const onCloseAutoFocus = useReturnFocus(trigger ? undefined : open);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={modal}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        {modal ? <DialogPrimitive.Overlay className="v5-scrim fixed inset-0 z-50 bg-scrim/40" /> : null}
        <DialogPrimitive.Content
          onInteractOutside={modal ? undefined : (e) => e.preventDefault()}
          onCloseAutoFocus={onCloseAutoFocus}
          className={cn(
            "fixed z-50 flex flex-col border-line-1 bg-surface-3 text-fg-1 shadow-e3",
            resolved === "right"
              ? cn("v5-sheet-right inset-y-0 right-0 h-full w-full border-l", SHEET_WIDTH[width])
              : "v5-sheet-bottom inset-x-0 bottom-0 max-h-[88dvh] rounded-t-sheet border-t pb-[env(safe-area-inset-bottom)]",
          )}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          {resolved === "bottom" ? <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-line-2/60" aria-hidden="true" /> : null}
          <div className="shrink-0 border-b border-line-1 px-5 py-4 pr-12">
            <DialogPrimitive.Title className="font-display text-h4 font-semibold">{title}</DialogPrimitive.Title>
            {description ? <DialogPrimitive.Description className="mt-0.5 text-small text-fg-2">{description}</DialogPrimitive.Description> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer ? <div className="flex shrink-0 justify-end gap-2 border-t border-line-1 px-5 py-3">{footer}</div> : null}
          <CloseButton label={closeLabel} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// Toast (Sonner)
// ---------------------------------------------------------------------------

/** Mount once in the v5 tree. Bottom-centre on mobile (above the bottom nav), bottom-right on desktop. */
export function V5Toaster() {
  const mobile = useIsMobile();
  return (
    <Toaster
      position={mobile ? "top-center" : "bottom-right"}
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-card !border !border-line-1 !bg-surface-3 !text-fg-1 !shadow-e2 !font-sans",
          description: "!text-fg-2",
          actionButton: "!bg-brand !text-on-brand",
          closeButton: "!bg-surface-3 !text-fg-2 !border-line-1",
        },
      }}
    />
  );
}

/** Something that happened, briefly. Errors a person must act on belong on the page instead. */
export const v5Toast = {
  success: (message: string, description?: string) => toast.success(message, { description }),
  info: (message: string, description?: string) => toast.info(message, { description }),
  error: (message: string, description?: string) => toast.error(message, { description, duration: 8000 }),
  undo: (message: string, onUndo: () => void) => toast.success(message, { duration: 10_000, action: { label: "Undo", onClick: onUndo } }),
};

// ---------------------------------------------------------------------------
// CommandPalette (cmdk)
// ---------------------------------------------------------------------------

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon?: ReactNode;
  keywords?: string[];
  /** Display only, such as ["G", "P"]. Register the real shortcut yourself. */
  shortcut?: string[];
  onSelect: () => void;
}

export interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandGroup[];
  placeholder?: string;
  emptyText?: string;
  /** Pass false and filter yourself for big lists (the curriculum); cmdk's filter is fine under ~200 items. */
  shouldFilter?: boolean;
  value?: string;
  onValueChange?: (search: string) => void;
}

/** ⌘K / Ctrl+K opens it. `useCommandShortcut` wires the keys. */
export function CommandPalette({ open, onOpenChange, groups, placeholder = "Search or jump to…", emptyText = "Nothing matches that.", shouldFilter = true, value, onValueChange }: CommandPaletteProps) {
  const onCloseAutoFocus = useReturnFocus(open);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="v5-scrim fixed inset-0 z-50 bg-scrim/50" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onCloseAutoFocus={onCloseAutoFocus}
          className="v5-dialog fixed left-1/2 top-[18%] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-sheet border border-line-1 bg-surface-3 text-fg-1 shadow-e3"
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <Command label="Command palette" shouldFilter={shouldFilter} loop>
            <div className="flex items-center gap-2.5 border-b border-line-1 px-4">
              <Search className="size-4 text-fg-2" aria-hidden="true" />
              <Command.Input
                value={value}
                onValueChange={onValueChange}
                placeholder={placeholder}
                className="h-13 flex-1 bg-transparent text-body text-fg-1 outline-none placeholder:text-fg-3"
              />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain p-1.5">
              <Command.Empty className="px-3 py-8 text-center text-small text-fg-2">{emptyText}</Command.Empty>
              {groups.map((group) => (
                <Command.Group
                  key={group.heading}
                  heading={group.heading}
                  className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-fg-2"
                >
                  {group.items.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={`${item.label} ${item.id}`}
                      keywords={item.keywords}
                      onSelect={() => {
                        onOpenChange(false);
                        item.onSelect();
                      }}
                      className="flex min-h-10 cursor-pointer items-center gap-3 rounded-control px-2.5 py-2 text-small text-fg-1 data-[selected=true]:bg-brand-soft data-[selected=true]:text-brand-fg"
                    >
                      {item.icon ? <span className="text-fg-2 [&_svg]:size-4" aria-hidden="true">{item.icon}</span> : null}
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint ? <span className="truncate text-caption text-fg-2">{item.hint}</span> : null}
                      {item.shortcut ? (
                        <span className="flex gap-1" aria-hidden="true">
                          {item.shortcut.map((k, i) => (
                            <Fragment key={i}>
                              <Kbd>{k}</Kbd>
                            </Fragment>
                          ))}
                        </span>
                      ) : null}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** ⌘K / Ctrl+K toggles the palette (ignored while typing in another field is fine: it's a chord). */
export function useCommandShortcut(setOpen: (fn: (open: boolean) => boolean) => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);
}
