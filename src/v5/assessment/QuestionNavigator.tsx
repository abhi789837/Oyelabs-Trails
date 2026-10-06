import { Circle, CircleCheck, CircleHelp, Flag, Lock } from "lucide-react";
import { useState } from "react";

import { cn } from "@/v5/design/cn";

import { filterEntries, navLabel, navSummary, type ChipState, type NavEntry, type NavFilter, type SheetCounts } from "./navigator";

const STATE_LOOK: Record<ChipState, { icon: typeof Circle; className: string }> = {
  unanswered: { icon: Circle, className: "border-line-2 bg-surface-1 text-fg-1" },
  answered: { icon: CircleCheck, className: "border-brand/50 bg-brand-soft text-fg-1" },
  unknown: { icon: CircleHelp, className: "border-line-2 bg-sunken text-fg-1" },
  submitted: { icon: Lock, className: "border-success/50 bg-success-soft text-fg-1" },
};

const FILTERS: { id: NavFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unanswered", label: "Not answered" },
  { id: "flagged", label: "Flagged" },
];

/**
 * The question navigator: one chip per question with its state as an icon and a tint (never colour
 * alone), a flag in the corner, and filters for "Not answered" and "Flagged" (button group with
 * aria-pressed, not tabs).
 */
export function QuestionNavigator({ entries, current, counts, onSelect }: { entries: NavEntry[]; current: number; counts: SheetCounts; onSelect: (index: number) => void }) {
  const [filter, setFilter] = useState<NavFilter>("all");
  const shown = filterEntries(entries, filter);
  return (
    <nav aria-label="Questions" className="flex flex-col gap-3">
      <p className="text-small text-fg-2" aria-live="polite">
        {navSummary(counts, entries.length)}
      </p>
      <div role="group" aria-label="Show" className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "min-h-7 rounded-full border px-2.5 text-caption font-medium transition-colors duration-120",
              filter === f.id ? "border-brand bg-brand-soft text-brand-fg" : "border-line-1 text-fg-2 hover:bg-sunken hover:text-fg-1",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {shown.length ? (
        <ol className="grid grid-cols-5 gap-1.5">
          {shown.map((entry) => {
            const look = STATE_LOOK[entry.state];
            const Icon = look.icon;
            const active = entry.index === current;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onSelect(entry.index)}
                  aria-current={active ? "step" : undefined}
                  aria-label={navLabel(entry)}
                  className={cn(
                    "relative flex h-11 w-full flex-col items-center justify-center rounded-control border font-mono text-caption tabular-nums transition-colors duration-120",
                    look.className,
                    active && "ring-2 ring-fg-1 ring-offset-2 ring-offset-surface-0",
                  )}
                >
                  <span className="font-semibold">{entry.number}</span>
                  <Icon className="size-3 opacity-80" aria-hidden="true" />
                  {entry.flagged ? <Flag className="absolute right-0.5 top-0.5 size-3 fill-warning text-warning-fg" aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-control bg-sunken px-3 py-2 text-small text-fg-2">{filter === "flagged" ? "Nothing flagged." : "Every question has an answer."}</p>
      )}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-caption text-fg-2">
        <Legend icon={CircleCheck} label="Answered" />
        <Legend icon={Circle} label="Not answered" />
        <Legend icon={CircleHelp} label="Don't know yet" />
        <Legend icon={Lock} label="Handed in" />
        <Legend icon={Flag} label="Flagged" />
      </ul>
    </nav>
  );
}

function Legend({ icon: Icon, label }: { icon: typeof Circle; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {label}
    </li>
  );
}
