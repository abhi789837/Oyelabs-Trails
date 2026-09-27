import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * The learner pages' numbers.
 *
 * Two shapes and no more: a **chip** for a number that sits in a row above the fold, and a
 * **card** for the dashboard's headline grid. Both count up to their value, which is the one
 * flourish these pages get — a number that lands is the cheapest way to make a page feel alive
 * without adding a background effect or a per-element fade.
 *
 * Nothing here is used on the assessment runner or the proctoring screens. Those stay still.
 */

const COUNT_MS = 550;

/** Read directly rather than through the hook, so the *initial* state can depend on it. */
function prefersReducedMotion(): boolean {
  try {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Counts from whatever is on screen to the next value.
 *
 * Three behaviours worth knowing about:
 *
 * - It starts at zero on mount, so the number arrives rather than simply being there. Under
 *   reduced motion it starts — and stays — at the real value, which is why the initial state
 *   reads the media query directly instead of waiting for a hook to settle: a frame of "0" for
 *   someone who asked for no motion is exactly the flicker they asked to avoid.
 * - An interrupted count continues from where it got to, not from where the last one began.
 * - It freezes while the tab is hidden. A background rAF is throttled to a crawl and then resumes
 *   mid-way, which reads as broken; holding the frame and carrying on from it does not.
 */
export function useCountUp(value: number, durationMs = COUNT_MS): number {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0));
  const shownRef = useRef(shown);
  const frame = useRef(0);

  useEffect(() => {
    if (reduceMotion || typeof requestAnimationFrame !== "function") {
      shownRef.current = value;
      setShown(value);
      return;
    }

    const start = shownRef.current;
    if (start === value) return;

    let previous: number | null = null;
    let elapsed = 0;

    const step = (now: number) => {
      if (document.hidden) {
        previous = null;
        frame.current = requestAnimationFrame(step);
        return;
      }
      previous ??= now;
      elapsed += now - previous;
      previous = now;

      const t = Math.min(1, elapsed / durationMs);
      // Ease out: the number decelerates into its final value instead of stopping dead.
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(start + (value - start) * eased);
      shownRef.current = next;
      setShown(next);
      if (t < 1) frame.current = requestAnimationFrame(step);
      else shownRef.current = value;
    };

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [value, durationMs, reduceMotion]);

  return shown;
}

export interface AnimatedNumberProps {
  value: number;
  /** Renders the counted number. Defaults to the plain integer. */
  format?: (value: number) => string;
  className?: string;
}

/**
 * The counted number itself.
 *
 * The animating text is hidden from assistive technology and the final value is given beside it in
 * a `sr-only` span, so a screen reader reads the destination rather than whichever intermediate
 * frame it happened to catch. (An `aria-label` on a plain span would not reliably do this — a
 * generic element has no role to hang a name on.)
 */
export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const shown = useCountUp(value);
  const render = format ?? ((n: number) => String(n));
  return (
    <span className={cn("tabular", className)}>
      <span aria-hidden="true">{render(shown)}</span>
      <span className="sr-only">{render(value)}</span>
    </span>
  );
}

export interface StatChipProps {
  label: string;
  /** A number counts up; a string is shown as-is (a duration, a date, "3 of 12"). */
  value: number | string;
  format?: (value: number) => string;
  icon?: ReactNode;
  className?: string;
}

/** A compact pill for a row of numbers above the fold. */
export function StatChip({ label, value, format, icon, className }: StatChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border bg-surface py-1.5 pl-3 pr-4",
        className,
      )}
    >
      {icon && (
        <span className="text-muted-foreground [&_svg]:size-3.5" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
      <span className="font-display text-sm font-semibold">
        {typeof value === "number" ? <AnimatedNumber value={value} format={format} /> : <span className="tabular">{value}</span>}
      </span>
    </div>
  );
}

export interface StatCardProps {
  label: string;
  value: number | string;
  format?: (value: number) => string;
  /** One short line under the number. Context, not a second number. */
  hint?: ReactNode;
  className?: string;
}

/**
 * A headline number.
 *
 * Flat by design: four of these sit side by side, and four shadowed cards in a row is exactly the
 * generic-AI-app look the design system rules out (brief §3). They separate with a left border and
 * their own weight instead.
 *
 * It carries no left padding of its own. Which cells in a grid need one depends on where the
 * borders fall at each breakpoint, and only the caller knows that — baking in a `first:pl-0` here
 * leaves the second row of a two-column grid indented past the first.
 */
export function StatCard({ label, value, format, hint, className }: StatCardProps) {
  return (
    <div className={cn("flex flex-col-reverse gap-1 py-4 pr-4", className)}>
      <dt className="text-xs text-muted-foreground sm:text-sm">
        {label}
        {hint && <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground/80">{hint}</span>}
      </dt>
      <dd className="font-display text-xl font-semibold sm:text-2xl">
        {typeof value === "number" ? <AnimatedNumber value={value} format={format} /> : <span className="tabular">{value}</span>}
      </dd>
    </div>
  );
}

export interface SectionHeadingProps {
  id?: string;
  /** A small mark to the left — a trail blaze, an accent bar, an icon. */
  mark?: ReactNode;
  children: ReactNode;
  /** One line under the heading. */
  description?: ReactNode;
  /** Controls that belong to this section: a view toggle, a link. */
  actions?: ReactNode;
  as?: "h2" | "h3";
  className?: string;
}

/**
 * One section header, used by every learner page so they agree with each other.
 *
 * No ALL-CAPS eyebrow, no 01/02/03 numbering and no arrow on the action — all three are called out
 * as house-forbidden in the brief. The rule is a heading, an optional line, and the controls that
 * act on what follows, on the same baseline.
 */
export function SectionHeading({
  id,
  mark,
  children,
  description,
  actions,
  as: Tag = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0">
        <Tag id={id} className={cn("flex items-center gap-2.5 font-display font-semibold", Tag === "h2" ? "text-lg" : "text-base")}>
          {mark}
          <span className="min-w-0">{children}</span>
        </Tag>
        {description && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
