import { type LearnerPriorities } from "@shared/builder";

import { Field } from "@/components/form/Field";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * The course builder's own settings. Not the learner's priorities — those are `TargetsFields`.
 *
 * ## What came out of here, and why
 *
 * This used to carry a target role, a weighted must-have list, a skills-to-skip list and the weekly
 * hours. Every one of those is now on the targets form, which meant the learner page showed two
 * overlapping forms: skills-to-skip twice, hours twice, priorities and weights twice. An admin had
 * to know which copy the system actually read.
 *
 * Worse, by the end it read neither: the path builder overlays `learner_targets` over `mustHave`, so
 * the must-have list on screen was doing nothing at all while looking exactly like it was. Fields
 * that appear to work and do not are worse than missing ones.
 *
 * So what is left is the four things that are genuinely about *the builder* rather than about the
 * person: how many courses it may write, whether they publish themselves, when the week starts, and
 * a deadline. Most admins never open this.
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

  return (
    <div className="space-y-5">
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
          checked={value.weekStartsMonday}
          disabled={disabled}
          onCheckedChange={(checked) => set("weekStartsMonday", checked === true)}
          className="mt-0.5"
        />
        <span>
          <span className="font-medium">Weeks start on Monday</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            Off by default, so somebody who finishes on a Wednesday is given work that day.
          </span>
        </span>
      </label>

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
            Off by default. A course still only reaches them if it passed its own review.
          </span>
        </span>
      </label>
    </div>
  );
}

/** A one-line summary for the onboarding review step. */
export function PrioritiesSummary({ value }: { value: LearnerPriorities }) {
  return (
    <p className="font-mono text-[11px] text-muted-foreground">
      up to {value.courseCap} generated
      {value.autoPublish ? " · auto-publish on" : ""}
      {value.weekStartsMonday ? " · weeks start Monday" : ""}
      {value.deadlineWeeks ? ` · ${value.deadlineWeeks} week deadline` : ""}
    </p>
  );
}
