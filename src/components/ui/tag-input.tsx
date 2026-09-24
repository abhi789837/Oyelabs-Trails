import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  /**
   * Supplying suggestions turns the field into a multi-select: the list filters as you type and
   * only listed values can be added, unless `allowCustom` says otherwise.
   */
  suggestions?: string[];
  allowCustom?: boolean;
  placeholder?: string;
  max?: number;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/**
 * Tags in, tags out. One field covers free-text tags and a filtered multi-select, because the two
 * only differ in whether a typed value that is not on the list is allowed through.
 *
 * The focus ring sits on the wrapper rather than the inner input (`has-[:focus-visible]`), so
 * keyboard focus outlines the whole control — including the chips — instead of a thin strip
 * between them.
 */
export function TagInput({
  value,
  onChange,
  suggestions,
  allowCustom = suggestions === undefined,
  placeholder,
  max,
  id,
  disabled,
  className,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: TagInputProps) {
  const listId = React.useId();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const full = max !== undefined && value.length >= max;

  const options = React.useMemo(() => {
    if (!suggestions) return [];
    const q = query.trim().toLowerCase();
    return suggestions
      .filter((s) => !value.includes(s))
      .filter((s) => q === "" || s.toLowerCase().includes(q))
      .slice(0, 8);
  }, [suggestions, value, query]);

  const add = (raw: string) => {
    const tag = raw.trim();
    setQuery("");
    setActive(-1);
    if (!tag || full || value.includes(tag)) return;
    if (suggestions && !allowCustom && !suggestions.includes(tag)) return;
    onChange([...value, tag]);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || (event.key === "," && allowCustom)) {
      event.preventDefault();
      add(active >= 0 && options[active] ? options[active]! : query);
      return;
    }
    if (event.key === "Backspace" && query === "" && value.length > 0) {
      onChange(value.slice(0, -1));
      return;
    }
    if (event.key === "ArrowDown" && options.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1 >= options.length ? 0 : i + 1));
      return;
    }
    if (event.key === "ArrowUp" && options.length > 0) {
      event.preventDefault();
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
      return;
    }
    if (event.key === "Escape") setOpen(false);
  };

  const showList = open && options.length > 0;

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-surface px-2 py-1.5 transition-[border-color] duration-[120ms]",
          "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-strong",
          invalid && "border-destructive",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-sm border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-xs"
          >
            {tag}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              className="text-muted-foreground transition-colors duration-[120ms] hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}

        <input
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          disabled={disabled || full}
          value={query}
          placeholder={value.length === 0 ? placeholder : undefined}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          className="h-6 min-w-24 flex-1 bg-transparent text-base placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed md:text-sm"
        />
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-sm shadow-ink/10 dark:shadow-black/40"
        >
          {options.map((option, index) => (
            <li
              key={option}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              /* Keep focus in the input so the list does not close before the click lands. */
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(option)}
              onMouseEnter={() => setActive(index)}
              className={cn(
                "cursor-pointer px-2.5 py-1.5 text-sm",
                index === active && "bg-surface-sunken text-foreground",
              )}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
