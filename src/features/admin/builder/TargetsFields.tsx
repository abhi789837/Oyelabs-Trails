import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";

import {
  LEARNER_TRACK_LABELS,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  MAX_TARGETS,
  type LearnerTarget,
  type LearnerTrack,
  type TargetPriority,
  type TargetsRequest,
} from "@shared/targets";

import { Field, TextField } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import { cn } from "@/lib/utils";

/**
 * What this person is being trained *for*.
 *
 * Everything downstream reads this: the assessment weights its questions by priority and asks High
 * first, the course builder handles High first, and the weekly plan fills "Do it now" from High
 * first. So the form is shaped like the decision rather than like the table — a track, a stack, and
 * a list somebody can put in the order they actually mean.
 *
 * The **stack** is the field that does the most work and looks like the least. "AI-driven
 * development" as a course is useless; "prompting for a Laravel controller with validation" is not,
 * and the difference between them is this string.
 *
 * Reordering is arrow buttons rather than drag-and-drop. Dragging is nicer with a mouse and worse
 * with everything else — keyboard, touch, screen reader — and this list is rarely more than six
 * items long. Two buttons that always work beat one gesture that mostly does.
 */
export function TargetsFields({
  value,
  onChange,
  disabled,
}: {
  value: TargetsRequest;
  onChange: (next: TargetsRequest) => void;
  disabled?: boolean;
}) {
  const set = <K extends keyof TargetsRequest>(key: K, next: TargetsRequest[K]) => onChange({ ...value, [key]: next });

  const setTarget = (index: number, patch: Partial<LearnerTarget>) =>
    set(
      "targets",
      value.targets.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    );

  /**
   * Moves a target within its own priority.
   *
   * Within, not across: the arrows reorder, and the priority buttons re-band. Letting an arrow carry
   * something from the bottom of High into Medium would make one control do two jobs, and the one it
   * did would depend on where the item happened to be sitting.
   */
  const move = (index: number, direction: -1 | 1) => {
    const target = value.targets[index];
    const siblings = value.targets
      .map((entry, i) => ({ entry, i }))
      .filter(({ entry }) => entry.priority === target.priority);
    const at = siblings.findIndex(({ i }) => i === index);
    const swapWith = siblings[at + direction];
    if (!swapWith) return;

    const next = [...value.targets];
    next[index] = swapWith.entry;
    next[swapWith.i] = target;
    set("targets", next);
  };

  const grouped = PRIORITY_ORDER.map((priority) => ({
    priority,
    entries: value.targets.map((entry, index) => ({ entry, index })).filter(({ entry }) => entry.priority === priority),
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Current track" hint="What they do day to day. Required — the assessment's first part is the fundamentals of this.">
          {({ id }) => (
            <select
              id={id}
              value={value.track}
              disabled={disabled}
              onChange={(event) => set("track", event.target.value as LearnerTrack)}
              className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
            >
              {(Object.keys(LEARNER_TRACK_LABELS) as LearnerTrack[]).map((track) => (
                <option key={track} value={track}>
                  {LEARNER_TRACK_LABELS[track]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <TextField
          label="Main stack"
          value={value.stack}
          disabled={disabled}
          maxLength={120}
          placeholder="PHP + Laravel"
          hint="The one field that makes everything else specific. Generated courses use it by name."
          onChange={(event) => set("stack", event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Years of experience" hint="Roughly.">
          {({ id }) => (
            <input
              id={id}
              type="number"
              min={0}
              max={60}
              step={0.5}
              disabled={disabled}
              value={value.yearsExperience ?? ""}
              onChange={(event) => set("yearsExperience", event.target.value === "" ? null : Number(event.target.value))}
              className="w-28 rounded-md border border-input bg-surface px-3 py-2 text-sm tabular focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
            />
          )}
        </Field>

        <Field label="Your read of their level" hint="1–5. Decides whether the test opens easy or medium, nothing more.">
          {() => (
            <div className="flex overflow-hidden rounded-md border" role="group" aria-label="Self level">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  disabled={disabled}
                  aria-pressed={value.selfLevel === level}
                  onClick={() => set("selfLevel", value.selfLevel === level ? null : (level as 1 | 2 | 3 | 4 | 5))}
                  className={cn(
                    "w-9 py-1.5 text-sm tabular transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong",
                    value.selfLevel === level ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-surface-sunken",
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label="Hours a week" hint="What their weekly plan is built to fit.">
          {({ id }) => (
            <input
              id={id}
              type="number"
              min={1}
              max={60}
              disabled={disabled}
              value={value.hoursPerWeek}
              onChange={(event) => set("hoursPerWeek", Math.max(1, Math.min(60, Number(event.target.value) || 15)))}
              className="w-24 rounded-md border border-input bg-surface px-3 py-2 text-sm tabular focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
            />
          )}
        </Field>
      </div>

      <Field
        label="Targets"
        hint="What they should be able to do, most important first. High takes about half the assessment, Medium 30%, Low 20% — and High is asked first."
      >
        {() => (
          <div className="space-y-4">
            {value.targets.length === 0 && (
              <p className="text-sm text-muted-foreground">
                None yet. Without any, the assessment works from your notes and the track alone.
              </p>
            )}

            {grouped.map(({ priority, entries }) =>
              entries.length === 0 ? null : (
                <div key={priority}>
                  <p className="mb-1.5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full", priorityDot[priority])} aria-hidden="true" />
                    {PRIORITY_LABELS[priority]}
                    <span>
                      {entries.length} item{entries.length === 1 ? "" : "s"}
                    </span>
                  </p>

                  <ul className="space-y-2">
                    {entries.map(({ entry, index }, within) => (
                      <li key={index} className="flex flex-wrap items-center gap-2">
                        <span className="flex shrink-0 flex-col">
                          <button
                            type="button"
                            disabled={disabled || within === 0}
                            onClick={() => move(index, -1)}
                            aria-label={`Move ${entry.skill || "this target"} up`}
                            className="rounded-t-sm border px-1 text-muted-foreground hover:bg-surface-sunken disabled:opacity-30 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong"
                          >
                            <ChevronUp className="h-3 w-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            disabled={disabled || within === entries.length - 1}
                            onClick={() => move(index, 1)}
                            aria-label={`Move ${entry.skill || "this target"} down`}
                            className="rounded-b-sm border border-t-0 px-1 text-muted-foreground hover:bg-surface-sunken disabled:opacity-30 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong"
                          >
                            <ChevronDown className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </span>

                        <Input
                          value={entry.skill}
                          disabled={disabled}
                          placeholder="Docker deployment"
                          aria-label={`Target ${index + 1}`}
                          containerClassName="min-w-0 flex-1"
                          onChange={(event) => setTarget(index, { skill: event.target.value })}
                        />

                        <PriorityPicker
                          value={entry.priority}
                          disabled={disabled}
                          label={entry.skill || `target ${index + 1}`}
                          onChange={(next) => setTarget(index, { priority: next })}
                        />

                        <input
                          type="date"
                          disabled={disabled}
                          value={entry.targetDate ?? ""}
                          aria-label={`Target date for ${entry.skill || `target ${index + 1}`}`}
                          onChange={(event) => setTarget(index, { targetDate: event.target.value || null })}
                          className="w-36 rounded-md border border-input bg-surface px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={disabled}
                          onClick={() => set("targets", value.targets.filter((_, i) => i !== index))}
                        >
                          <Minus aria-hidden="true" />
                          <span className="sr-only">Remove {entry.skill || "this target"}</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || value.targets.length >= MAX_TARGETS}
              onClick={() =>
                set("targets", [...value.targets, { skill: "", priority: "high", position: value.targets.length, targetDate: null }])
              }
            >
              <Plus aria-hidden="true" />
              Add a target
            </Button>
          </div>
        )}
      </Field>

      <Field
        label="Skills to skip"
        hint="Never tested and never turned into a course. Saying nothing here is different from saying 'not this'."
      >
        {({ id }) => (
          <TagInput
            id={id}
            value={value.skip}
            disabled={disabled}
            max={20}
            placeholder="Add a skill to skip"
            onChange={(next) => set("skip", next)}
          />
        )}
      </Field>
    </div>
  );
}

const priorityDot: Record<TargetPriority, string> = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-basalt",
};

/** Three buttons rather than a select: three options, and the priority is worth seeing at a glance. */
function PriorityPicker({
  value,
  onChange,
  disabled,
  label,
}: {
  value: TargetPriority;
  onChange: (priority: TargetPriority) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-md border" role="group" aria-label={`Priority for ${label}`}>
      {PRIORITY_ORDER.map((priority) => (
        <button
          key={priority}
          type="button"
          disabled={disabled}
          aria-pressed={value === priority}
          onClick={() => onChange(priority)}
          className={cn(
            "px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong",
            value === priority ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-surface-sunken",
          )}
        >
          {PRIORITY_LABELS[priority].slice(0, priority === "medium" ? 3 : 4)}
        </button>
      ))}
    </div>
  );
}

/** A one-line summary for the onboarding review step. */
export function TargetsSummary({ value }: { value: TargetsRequest }) {
  const high = value.targets.filter((t) => t.priority === "high" && t.skill.trim()).length;

  return (
    <div className="space-y-2">
      <p className="text-sm">
        {LEARNER_TRACK_LABELS[value.track]}
        {value.stack.trim() && <span className="text-muted-foreground"> · {value.stack}</span>}
      </p>

      {value.targets.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.targets
            .filter((entry) => entry.skill.trim().length > 0)
            .map((entry, index) => (
              <li key={index}>
                <Badge variant={entry.priority === "high" ? "brand" : "outline"}>
                  {entry.skill} · {PRIORITY_LABELS[entry.priority]}
                </Badge>
              </li>
            ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No targets set — the assessment works from your notes alone.</p>
      )}

      <p className="font-mono text-[11px] text-muted-foreground">
        {value.hoursPerWeek} h/week
        {high > 0 && ` · ${high} High, about half the assessment`}
        {value.skip.length > 0 && ` · skipping ${value.skip.length}`}
      </p>
    </div>
  );
}
