import { Circle, CircleCheck, CircleHelp, Flag, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ChipState, SheetCounts } from "./clock";

export interface NavigatorEntry {
  id: string;
  number: number;
  state: ChipState;
  flagged: boolean;
}

const STATE_META: Record<ChipState, { label: string; icon: typeof Circle; className: string }> = {
  unanswered: { label: "not answered", icon: Circle, className: "border-border bg-surface text-foreground" },
  answered: { label: "answered", icon: CircleCheck, className: "border-primary/50 bg-primary/[0.08] text-foreground" },
  unknown: { label: "I don't know yet", icon: CircleHelp, className: "border-basalt/60 bg-surface-sunken text-foreground" },
  submitted: { label: "submitted", icon: Lock, className: "border-summit/60 bg-summit/[0.1] text-foreground" },
};

/**
 * The question navigator: one numbered chip per question, its state shown by an icon *and* a tint
 * (never colour alone), a flag in the corner when flagged. Free movement in both directions.
 */
export function Navigator({
  entries,
  current,
  onSelect,
  counts,
}: {
  entries: NavigatorEntry[];
  current: number;
  onSelect: (index: number) => void;
  counts: SheetCounts;
}) {
  return (
    <nav aria-label="Questions">
      <ol className="grid grid-cols-5 gap-1.5">
        {entries.map((entry, index) => {
          const meta = STATE_META[entry.state];
          const Icon = meta.icon;
          const active = index === current;
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-current={active ? "step" : undefined}
                aria-label={`Question ${entry.number}: ${meta.label}${entry.flagged ? ", flagged" : ""}`}
                className={cn(
                  "relative flex h-11 w-full flex-col items-center justify-center rounded-md border font-mono text-xs tabular transition-colors duration-[120ms]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
                  meta.className,
                  active && "ring-2 ring-foreground ring-offset-1 ring-offset-background",
                )}
              >
                <span className="font-semibold">{entry.number}</span>
                <Icon className="h-3 w-3 opacity-80" aria-hidden="true" />
                {entry.flagged && (
                  <Flag className="absolute right-0.5 top-0.5 h-3 w-3 fill-warning text-warning-strong" aria-hidden="true" />
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <dl className="mt-4 grid gap-y-1.5 text-xs text-muted-foreground">
        <Legend icon={CircleCheck} label="Answered" value={counts.answered} />
        <Legend icon={Circle} label="Not answered" value={counts.unanswered} />
        <Legend icon={CircleHelp} label="Don't know yet" value={counts.unknown} />
        <Legend icon={Lock} label="Submitted" value={counts.submitted} />
        <Legend icon={Flag} label="Flagged" value={counts.flagged} />
      </dl>
    </nav>
  );
}

function Legend({ icon: Icon, label, value }: { icon: typeof Circle; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <dt>{label}</dt>
      <dd className="ml-auto font-mono tabular text-foreground">{value}</dd>
    </div>
  );
}
