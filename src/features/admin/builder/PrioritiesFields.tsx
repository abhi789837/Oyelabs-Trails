import { Minus, Plus } from "lucide-react";

import { type LearnerPriorities, type MustHaveSkill, type SkillWeight } from "@shared/builder";

import { Field, TextField } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import { cn } from "@/lib/utils";

/**
 * Learning priorities: what this person is being trained *for*.
 *
 * The half of the gap map that no assessment can produce. A test can show that somebody cannot
 * deploy anything; only a person knows this hire was brought in to do Laravel and that DevOps is
 * what matters this quarter. Everything here feeds the builder's scoring directly — the weights are
 * multipliers, and the skip list is honoured as "recorded, deliberately not taught".
 *
 * Controlled rather than uncontrolled, unlike the rest of the onboarding form: the weight buttons
 * and the skill rows need to re-render as they change, and reading a repeating structure back out
 * of `FormData` would be worse than holding it in state.
 */
export function PrioritiesFields({
  value,
  onChange,
  disabled,
}: {
  value: LearnerPriorities;
  onChange: (next: LearnerPriorities) => void;
  disabled?: boolean;
}) {
  const set = <K extends keyof LearnerPriorities>(key: K, next: LearnerPriorities[K]) =>
    onChange({ ...value, [key]: next });

  const setSkill = (index: number, patch: Partial<MustHaveSkill>) =>
    set(
      "mustHave",
      value.mustHave.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    );

  return (
    <div className="space-y-5">
      <TextField
        label="Target role"
        value={value.targetRole}
        disabled={disabled}
        maxLength={120}
        placeholder="Backend Engineer – Laravel"
        hint="What they are being trained towards. The builder weighs every gap against this."
        onChange={(event) => set("targetRole", event.target.value)}
      />

      <Field
        label="Must-have skills"
        hint="Weighted. High counts for the full score, Medium 60%, Low 30% — a skill the assessment finds on its own sits between Medium and Low."
      >
        {() => (
          <div className="space-y-2">
            {value.mustHave.length === 0 && (
              <p className="text-sm text-muted-foreground">
                None yet. Without any, the builder works from the assessment alone.
              </p>
            )}

            <ul className="space-y-2">
              {value.mustHave.map((entry, index) => (
                <li key={index} className="flex flex-wrap items-center gap-2">
                  <Input
                    value={entry.skill}
                    disabled={disabled}
                    placeholder="Deployment and hosting"
                    aria-label={`Skill ${index + 1}`}
                    containerClassName="min-w-0 flex-1"
                    onChange={(event) => setSkill(index, { skill: event.target.value })}
                  />
                  <WeightPicker
                    value={entry.weight}
                    disabled={disabled}
                    label={entry.skill || `skill ${index + 1}`}
                    onChange={(weight) => setSkill(index, { weight })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    onClick={() => set("mustHave", value.mustHave.filter((_, i) => i !== index))}
                  >
                    <Minus aria-hidden="true" />
                    <span className="sr-only">Remove {entry.skill || "this skill"}</span>
                  </Button>
                </li>
              ))}
            </ul>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || value.mustHave.length >= 20}
              onClick={() => set("mustHave", [...value.mustHave, { skill: "", weight: "high" }])}
            >
              <Plus aria-hidden="true" />
              Add a skill
            </Button>
          </div>
        )}
      </Field>

      <Field
        label="Skills to skip"
        hint="Still recorded as gaps if the assessment finds them — just never turned into a course. Saying nothing here is different from saying 'not this'."
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Deadline" hint="Optional. Weeks from now.">
          {({ id }) => (
            <input
              id={id}
              type="number"
              min={1}
              max={104}
              disabled={disabled}
              value={value.deadlineWeeks ?? ""}
              onChange={(event) => set("deadlineWeeks", event.target.value === "" ? null : Number(event.target.value))}
              className="w-28 rounded-md border border-input bg-surface px-3 py-2 text-sm tabular focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
            />
          )}
        </Field>

        <Field label="Most courses to generate" hint="Guards their time as much as the AI bill.">
          {({ id }) => (
            <input
              id={id}
              type="number"
              min={1}
              max={20}
              disabled={disabled}
              value={value.courseCap}
              onChange={(event) => set("courseCap", Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
              className="w-28 rounded-md border border-input bg-surface px-3 py-2 text-sm tabular focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
            />
          )}
        </Field>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
        <Checkbox
          checked={value.autoPublish}
          disabled={disabled}
          onCheckedChange={(checked) => set("autoPublish", checked === true)}
          className="mt-0.5"
        />
        <span>
          <span className="font-medium">Publish generated courses automatically</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            Off by default. With it on, a course still only reaches them if it passed its own review —
            this is a statement about trusting the process, not an instruction to ship whatever comes out.
          </span>
        </span>
      </label>
    </div>
  );
}

const WEIGHTS: { value: SkillWeight; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Med" },
  { value: "low", label: "Low" },
];

/** Three buttons rather than a select: three options, and the weight is worth seeing at a glance. */
function WeightPicker({
  value,
  onChange,
  disabled,
  label,
}: {
  value: SkillWeight;
  onChange: (weight: SkillWeight) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-md border" role="group" aria-label={`Priority for ${label}`}>
      {WEIGHTS.map((weight) => (
        <button
          key={weight.value}
          type="button"
          disabled={disabled}
          aria-pressed={value === weight.value}
          onClick={() => onChange(weight.value)}
          className={cn(
            "px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong",
            value === weight.value ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-surface-sunken",
          )}
        >
          {weight.label}
        </button>
      ))}
    </div>
  );
}

/** A one-line summary for the onboarding review step. */
export function PrioritiesSummary({ value }: { value: LearnerPriorities }) {
  if (!value.targetRole && value.mustHave.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        None set. The builder will work from the assessment alone.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {value.targetRole && <p className="text-sm">{value.targetRole}</p>}
      {value.mustHave.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.mustHave
            .filter((entry) => entry.skill.trim().length > 0)
            .map((entry, index) => (
              <li key={index}>
                <Badge variant={entry.weight === "high" ? "brand" : "outline"}>
                  {entry.skill} · {entry.weight}
                </Badge>
              </li>
            ))}
        </ul>
      )}
      <p className="font-mono text-[11px] text-muted-foreground">
        up to {value.courseCap} generated{value.skip.length > 0 && ` · skipping ${value.skip.length}`}
        {value.autoPublish ? " · auto-publish on" : ""}
      </p>
    </div>
  );
}
