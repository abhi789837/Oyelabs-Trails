import { Check, X } from "lucide-react";

import { InlineText } from "@/components/content/RichText";
import { cn } from "@/lib/utils";

/**
 * One option as a large card: the whole card is the label, a real radio input inside it, and an
 * optional number shortcut shown on the card. Selection is carried by the border, a tint and the
 * filled number — never colour alone. In review mode the correct option gets a tick and a wrong
 * pick a cross, each with words for screen readers.
 */
export function ChoiceCard({
  name,
  id,
  checked,
  disabled,
  shortcut,
  text,
  review,
  onSelect,
}: {
  name: string;
  id: string;
  checked: boolean;
  disabled?: boolean;
  /** 1-based number shown on the card, when a number key picks it. */
  shortcut?: number;
  text: string;
  review?: "correct" | "wrong" | null;
  onSelect: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-start gap-3 rounded-md border px-4 py-3.5 text-sm transition-colors duration-[120ms]",
        "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-strong",
        disabled ? "cursor-default" : "cursor-pointer",
        review === "correct"
          ? "border-summit bg-summit/[0.08]"
          : review === "wrong"
            ? "border-destructive bg-destructive/[0.06]"
            : checked
              ? "border-primary bg-primary/[0.07]"
              : "border-border hover:border-basalt/60 hover:bg-surface-sunken/60",
      )}
    >
      <input
        type="radio"
        id={id}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--primary))]"
      />
      {shortcut !== undefined && (
        <span
          aria-hidden="true"
          className={cn(
            "mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded border font-mono text-[11px] tabular",
            checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted-foreground",
          )}
        >
          {shortcut}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <InlineText text={text} />
      </span>
      {review === "correct" && (
        <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-summit-strong">
          <Check className="h-4 w-4" aria-hidden="true" />
          Best answer
        </span>
      )}
      {review === "wrong" && (
        <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-destructive">
          <X className="h-4 w-4" aria-hidden="true" />
          Your pick
        </span>
      )}
    </label>
  );
}
