import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, useState, type ComponentPropsWithoutRef, type HTMLAttributes } from "react";

import { cn } from "../cn";

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("inline-flex items-center gap-1 rounded-control bg-sunken p-1 text-small", className)}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-[calc(var(--v5-radius-control)-2px)] px-3 font-medium text-fg-2",
      "transition-colors duration-120 hover:text-fg-1",
      "data-[state=active]:bg-surface-1 data-[state=active]:text-fg-1 data-[state=active]:shadow-e1",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("mt-3 focus-visible:outline-none", className)} {...props} />
));
TabsContent.displayName = "TabsContent";


// ---------------------------------------------------------------------------
// Kbd
// ---------------------------------------------------------------------------

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-1 border-b-2 bg-surface-1 px-1 font-mono text-[0.6875rem] font-medium text-fg-2",
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium [&_svg]:size-3", {
  variants: {
    tone: {
      neutral: "bg-neutral-soft text-neutral-fg",
      brand: "bg-brand-soft text-brand-fg",
      success: "bg-success-soft text-success-fg",
      warning: "bg-warning-soft text-warning-fg",
      danger: "bg-danger-soft text-danger-fg",
      info: "bg-info-soft text-info-fg",
      outline: "border border-line-1 text-fg-2",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

/** A status word. Colour is never the only signal: the word itself says it. */
export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_SIZE = { sm: "size-7 text-[0.6875rem]", md: "size-9 text-caption", lg: "size-12 text-small" } as const;

/** A photo when there is one, initials otherwise. Decorative next to a visible name (`alt=""`). */
export function Avatar({ name, src, size = "md", className, decorative = false }: { name: string; src?: string | null; size?: keyof typeof AVATAR_SIZE; className?: string; decorative?: boolean }) {
  const [failed, setFailed] = useState(false);
  const label = decorative ? undefined : name;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft font-semibold text-brand-fg", AVATAR_SIZE[size], className)}
      role={decorative ? undefined : "img"}
      aria-label={label}
      aria-hidden={decorative || undefined}
    >
      {src && !failed ? <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} /> : initialsOf(name)}
    </span>
  );
}
