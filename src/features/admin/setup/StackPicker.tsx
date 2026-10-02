import { useId, useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { normaliseSkillText, type StackOption } from "@shared/catalog";

import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Name or alias contains every word of the query. Stacks are a dozen rows, so no ranking needed. */
function matchesStack(stack: StackOption, query: string): boolean {
  const q = normaliseSkillText(query);
  if (!q) return true;
  const haystack = [stack.name, ...stack.aliases].map(normaliseSkillText).join(" ");
  return q.split(" ").every((word) => haystack.includes(word));
}

/**
 * A searchable multi-select for a department's stacks (engineering) or tools (PM, BD). Picked items
 * show as chips under the trigger, each with its own remove button.
 */
export function StackPicker({
  stacks,
  value,
  onChange,
  noun,
  labelId,
  disabled,
}: {
  stacks: readonly StackOption[];
  value: readonly string[];
  onChange: (next: string[]) => void;
  /** "stack" or "tool", for the copy. */
  noun: string;
  labelId: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const textId = useId();
  const visible = useMemo(() => stacks.filter((s) => matchesStack(s, query)), [stacks, query]);
  const picked = value.map((id) => stacks.find((s) => s.id === id)).filter((s): s is StackOption => Boolean(s));

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="space-y-2">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled || stacks.length === 0}
            aria-labelledby={`${labelId} ${textId}`}
            className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-surface px-3 text-left text-sm transition-colors hover:bg-surface-sunken/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:opacity-50 sm:w-80"
          >
            <span id={textId} className={cn("min-w-0 flex-1 truncate", picked.length === 0 && "text-muted-foreground")}>
              {stacks.length === 0
                ? `No ${noun}s in this department`
                : picked.length === 0
                  ? `Choose ${noun}s`
                  : `${picked.length} ${noun}${picked.length === 1 ? "" : "s"} chosen`}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-0">
          <Command shouldFilter={false} loop>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder={`Search ${noun}s`}
              leading={<Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
            />
            <CommandList>
              {visible.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No {noun} matches that.</p>
              )}
              <CommandGroup>
                {visible.map((stack) => {
                  const checked = value.includes(stack.id);
                  return (
                    <CommandItem key={stack.id} value={stack.id} onSelect={() => toggle(stack.id)} aria-checked={checked}>
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                          checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
                        )}
                        aria-hidden="true"
                      >
                        {checked && <Check className="size-3" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{stack.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {picked.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={`Chosen ${noun}s`}>
          {picked.map((stack) => (
            <li key={stack.id}>
              <span className="inline-flex h-7 items-center gap-1 rounded-md border bg-surface-sunken/60 pl-2.5 pr-1 text-sm">
                {stack.name}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggle(stack.id)}
                  className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-strong"
                >
                  <X className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">Remove {stack.name}</span>
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
