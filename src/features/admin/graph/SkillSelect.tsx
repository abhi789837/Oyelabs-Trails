import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { searchSkills, type Skill } from "@shared/catalog";

import { Command, CommandInput, CommandItem, CommandList, CommandMeta } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** How many matches the list renders. A search narrows it; nobody scrolls 270 rows. */
const LIMIT = 60;

export interface SkillSelectProps {
  skills: readonly Skill[];
  value: string | null;
  onChange: (skillId: string) => void;
  /** Visible and accessible name of the trigger when nothing is picked. */
  placeholder: string;
  label: string;
  disabled?: boolean;
  className?: string;
}

/** One skill, searched by name, alias or tag. Closes on pick (unlike the Setup picker). */
export function SkillSelect({ skills, value, onChange, placeholder, label, disabled, className }: SkillSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchSkills(skills, query).slice(0, LIMIT), [skills, query]);
  const selected = skills.find((s) => s.id === value) ?? null;

  return (
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
          disabled={disabled}
          aria-label={selected ? `${label}: ${selected.name}` : label}
          className={cn(
            "flex h-10 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-surface px-3 text-left text-sm transition-colors hover:bg-surface-sunken/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:opacity-50",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate">{selected?.name ?? placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(26rem,calc(100vw-2rem))] p-0">
        <Command shouldFilter={false} loop label={label}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search by name, alias or tag" />
          <CommandList>
            {results.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">No skill matches.</p>}
            {results.map((skill) => (
              <CommandItem
                key={skill.id}
                value={skill.id}
                onSelect={() => {
                  onChange(skill.id);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <Check className={cn("text-primary-strong", skill.id !== value && "invisible")} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{skill.name}</span>
                <CommandMeta>{skill.area}</CommandMeta>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
