import { useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";

import type { Skill } from "@shared/catalog";

import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandMeta } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { pickerGroups } from "./helpers";

export interface SkillPickerProps {
  /** The department's active and pending skills. */
  skills: readonly Skill[];
  track: { id: string; name: string } | null;
  /** Already in this list: shown with a check and not offered again. */
  selectedIds: readonly string[];
  /** In the other list (priorities vs skip): picking moves it, and the row says so. */
  otherIds: readonly string[];
  otherLabel: string;
  onPick: (skill: Skill) => void;
  /** Opens the request dialog with whatever was typed. */
  onRequest: (query: string) => void;
  triggerLabel: string;
  disabled?: boolean;
}

/**
 * Select-only skill search: names, aliases and tags through `searchSkills`, grouped by area. Stays
 * open after a pick, because an admin adding priorities usually adds several in a row.
 */
export function SkillPicker({
  skills,
  track,
  selectedIds,
  otherIds,
  otherLabel,
  onPick,
  onRequest,
  triggerLabel,
  disabled,
}: SkillPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const groups = useMemo(() => pickerGroups(skills, query, track), [skills, query, track]);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const other = useMemo(() => new Set(otherIds), [otherIds]);
  const empty = groups.length === 0;

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
          className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-surface px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-surface-sunken/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:opacity-50"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{triggerLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(30rem,calc(100vw-2rem))] p-0">
        <Command shouldFilter={false} loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search by name, alias or tag"
            leading={<Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
          />
          <CommandList>
            {empty && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {query.trim() ? `No skill matches “${query.trim()}”.` : "This department has no skills yet."}
              </p>
            )}
            {groups.map((group) => (
              <CommandGroup key={group.key} heading={group.heading}>
                {group.skills.map((skill) => {
                  const isSelected = selected.has(skill.id);
                  return (
                    <CommandItem
                      key={`${group.key}:${skill.id}`}
                      value={`${group.key}:${skill.id}`}
                      disabled={isSelected}
                      onSelect={() => onPick(skill)}
                    >
                      <Check className={cn("text-primary-strong", !isSelected && "invisible")} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{skill.name}</span>
                      {skill.status === "pending" && <CommandMeta className="ml-0">pending</CommandMeta>}
                      {isSelected ? (
                        <CommandMeta>added</CommandMeta>
                      ) : other.has(skill.id) ? (
                        <CommandMeta>{otherLabel}</CommandMeta>
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
            {/* Last, below every result, so it reads as the way out rather than a first choice. */}
            <CommandGroup>
              <CommandItem
                value="__request"
                onSelect={() => {
                  setOpen(false);
                  onRequest(query.trim());
                  setQuery("");
                }}
                className="text-muted-foreground"
              >
                <Plus aria-hidden="true" />
                <span className="underline decoration-trailmark decoration-2 underline-offset-4">
                  Can't find it? Request a skill
                </span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
