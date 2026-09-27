import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { levelLabels } from "@/lib/track-meta";
import { cn } from "@/lib/utils";

import {
  activeFilterCount,
  EMPTY_PLAN_FILTERS,
  planLevelOptions,
  planModuleOptions,
  type PlanFilters,
  type PlanRow,
} from "../planFilters";

/**
 * The list view's filters.
 *
 * Native `<select>`s on purpose. A custom listbox would need its own focus trap, typeahead and
 * mobile behaviour to match what the platform already does for free, and five of them on one row
 * is five chances to get that wrong. The control that earns a custom treatment here is the search
 * field, which gets the shared `Input` with its clear button.
 *
 * Every option is built from the rows the learner actually has, so the dropdowns cannot hint at a
 * camp or a level that is not in their plan (brief §12).
 */

export interface PlanFilterBarProps {
  rows: readonly PlanRow[];
  filters: PlanFilters;
  onChange: (filters: PlanFilters) => void;
  /** How many rows survive, for the count beside the controls. */
  shown: number;
}

export function PlanFilterBar({ rows, filters, onChange, shown }: PlanFilterBarProps) {
  const modules = planModuleOptions(rows);
  const levels = planLevelOptions(rows);
  const active = activeFilterCount(filters);

  const set = <K extends keyof PlanFilters>(key: K, value: PlanFilters[K]) => onChange({ ...filters, [key]: value });

  return (
    <div className="rounded-lg border bg-surface-sunken/50 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          value={filters.query}
          onChange={(event) => set("query", event.target.value)}
          onClear={() => set("query", "")}
          leading={<Search aria-hidden="true" />}
          placeholder="Search your plan"
          aria-label="Search your plan"
          containerClassName="sm:max-w-xs"
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(value) => set("status", value as PlanFilters["status"])}
            options={[
              { value: "all", label: "Any status" },
              { value: "not-started", label: "Not started" },
              { value: "in-progress", label: "In progress" },
              { value: "completed", label: "Completed" },
            ]}
          />
          <FilterSelect
            label="Level"
            value={filters.level}
            onChange={(value) => set("level", value as PlanFilters["level"])}
            options={[{ value: "all", label: "Any level" }, ...levels.map((level) => ({ value: level, label: levelLabels[level] }))]}
          />
          <FilterSelect
            label="Camp"
            value={filters.moduleId}
            onChange={(value) => set("moduleId", value)}
            options={[
              { value: "all", label: "Any camp" },
              ...modules.map((module) => ({ value: module.id, label: `${module.name} (${module.count})` })),
            ]}
          />
          <FilterSelect
            label="Challenge"
            value={filters.challengeType}
            onChange={(value) => set("challengeType", value as PlanFilters["challengeType"])}
            options={[
              { value: "all", label: "Any challenge" },
              { value: "quiz", label: "Quiz" },
              { value: "code", label: "Code" },
            ]}
          />

          <label
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors duration-[120ms]",
              filters.milestonesOnly ? "border-trailmark bg-trailmark/[0.09] text-foreground" : "border-input bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            <input
              type="checkbox"
              checked={filters.milestonesOnly}
              onChange={(event) => set("milestonesOnly", event.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--trailmark))]"
            />
            Milestones only
          </label>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3">
        <p className="font-mono text-xs text-muted-foreground tabular" aria-live="polite">
          {shown} of {rows.length} {rows.length === 1 ? "topic" : "topics"}
        </p>
        {active > 0 && (
          <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_PLAN_FILTERS)}>
            <X aria-hidden="true" />
            Clear {active} {active === 1 ? "filter" : "filters"}
          </Button>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const narrowed = value !== "all";
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(event) => onChange(event.target.value)}
      /* Capped: a native select is as wide as its widest option, and a camp name can be long
         enough to push the row past a 375px viewport on its own. */
      className={cn(
        "h-9 max-w-[11rem] truncate rounded-md border bg-surface px-2 text-sm transition-colors duration-[120ms]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
        narrowed ? "border-trailmark text-foreground" : "border-input text-muted-foreground",
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
