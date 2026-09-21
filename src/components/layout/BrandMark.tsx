import { cn } from "@/lib/utils";

/** A dotted trail between two waypoints: the app's mark. */
/** `onPaper` keeps the dark tile on light "printed" surfaces like the certificate, regardless of theme. */
export function BrandMark({ className, onPaper = false }: { className?: string; onPaper?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-7 w-7", className)}>
      <rect width="32" height="32" rx="7" className={onPaper ? "fill-ink" : "fill-ink dark:fill-foreground/10"} />
      <path
        d="M9 26c0-6 14-5 14-11S14 9 14 5"
        fill="none"
        stroke="rgb(var(--basalt))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="0.1 4"
      />
      <circle cx="9" cy="25" r="3.2" fill="rgb(var(--summit))" />
      <circle cx="14" cy="6.5" r="3.6" fill="rgb(var(--trailmark))" />
    </svg>
  );
}
