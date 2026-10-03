import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { LoaderCircle, X } from "lucide-react";

import type { Catalog, Skill } from "@shared/catalog";
import { DESCRIPTION_MAX, PERSONALISATION_LABELS, PERSONALISATION_LEVELS, type Personalisation } from "@shared/personalise";
import { MAX_GOALS, type SuggestedGoal } from "@shared/goals";
import {
  EXPERIENCE_BANDS,
  EXPERIENCE_LABELS,
  levelFromExperience,
  type ExperienceBand,
  type LearnerSetup,
  type SaveSetupRequest,
  type Slider as SliderValue,
} from "@shared/setup";

import { Field, FormAlert, TextField } from "@/components/form/Field";
import { useFormDialog } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberInput } from "@/components/ui/number-input";
import { Segmented } from "@/components/ui/segmented";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { catalogApi } from "../catalog/api";
import { InfoTip } from "../catalog/InfoTip";
import { refreshCatalog, useCatalog } from "../catalog/useCatalog";
import {
  changeDepartmentWithDefaults,
  findSkillToAdd,
  focusNames,
  hoursPerDayHint,
  initialSetupState,
  levelTarget,
  listNames,
  pickableSkills,
  pickPriority,
  pickSkip,
  previewMix,
  sameSetup,
  toSaveRequest,
  toUnderstandRequest,
  understandingKey,
  understandingReady,
  withDepartmentDefaults,
  withGoals,
  type SetupState,
} from "./helpers";
import { GoalBox } from "./GoalBox";
import { SkillPicker } from "./SkillPicker";
import { StackPicker } from "./StackPicker";
import { UnderstandingPanel, useUnderstanding } from "./UnderstandingPanel";

export interface SetupFormContext {
  /** Server field errors, keyed the way the server names them. */
  fields: Record<string, string>;
  pending: boolean;
}

export interface SetupFormProps {
  /** The learner, when there is one: lets the server log the understanding call against them. */
  userId?: string;
  /** The saved setup, or null for a new learner. Remount (change `key`) to reset after a save. */
  initial: LearnerSetup | null;
  /** Throw to keep the form as it is and show the message; an `ApiRequestError`'s fields land inline. */
  onSave: (request: SaveSetupRequest) => Promise<void>;
  primaryLabel: string;
  secondaryLabel: string;
  /** Rendered above the setup sections, inside the same form — onboarding's account fields. */
  leading?: (context: SetupFormContext) => ReactNode;
  /** Rendered below the setup sections, inside the same form. */
  trailing?: (context: SetupFormContext) => ReactNode;
  /** False disables both buttons, e.g. while onboarding's username is missing. */
  canSubmit?: boolean;
  /** A skill id or name to select at Medium once the catalog is in (the Path tab's Promote). */
  addSkill?: string | null;
  onAddHandled?: () => void;
  /** Whether to say "Unsaved changes" — meaningful for an existing learner only. */
  showDirty?: boolean;
  /** v4.3: a new learner's state to start from (quick onboarding's "Edit details"). */
  seed?: SetupState | null;
  /** v4.3: onboarding's "Suggested for ..." goals, each with + Add. */
  extras?: readonly SuggestedGoal[];
  extrasLabel?: string;
  /** Reports every change, so a parent (quick onboarding) can keep what was edited here. */
  onStateChange?: (state: SetupState) => void;
}

/**
 * The admin's Setup: who a learner is and what they are for, on one calm screen (v4 Phase 3).
 *
 * Used by onboarding and by the learner page's Setup tab, so there is one form and one save path.
 * Department and track come first because they decide what every picker below may offer.
 */
export function SetupForm(props: SetupFormProps) {
  const { catalog, error } = useCatalog();

  if (!catalog) {
    return error ? (
      <FormAlert>{error}</FormAlert>
    ) : (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Loading departments and skills…
      </p>
    );
  }
  return <SetupFormInner {...props} catalog={catalog} />;
}

function fieldError(fields: Record<string, string>, prefix: string): string | undefined {
  const key = Object.keys(fields).find((k) => k === prefix || k.startsWith(`${prefix}.`));
  return key ? fields[key] : undefined;
}

function SetupFormInner({
  catalog,
  initial,
  onSave,
  primaryLabel,
  secondaryLabel,
  leading,
  trailing,
  canSubmit = true,
  addSkill,
  onAddHandled,
  showDirty,
  userId,
  seed,
  extras,
  extrasLabel,
  onStateChange,
}: SetupFormProps & { catalog: Catalog }) {
  const formDialog = useFormDialog();
  const uid = useId();
  const departments = useMemo(() => catalog.departments.filter((d) => !d.archived), [catalog]);
  const fallbackDepartment = departments[0]?.id ?? "engineering";
  const baseline = useMemo(() => initialSetupState(initial, fallbackDepartment), [initial, fallbackDepartment]);
  // A new learner starts from their department's suggested priorities (v4.1); a saved setup is never touched.
  const [state, setState] = useState<SetupState>(() => (initial ? baseline : (seed ?? withDepartmentDefaults(baseline, catalog))));
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);
  const [pending, setPending] = useState<"save" | "assign" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const department = catalog.departments.find((d) => d.id === state.departmentId) ?? departments[0];
  const isCoding = department?.assessmentFormat === "coding";
  const tracks = catalog.tracks.filter((t) => t.departmentId === state.departmentId && !t.archived);
  const track = tracks.find((t) => t.id === state.trackId) ?? null;
  const stacks = catalog.stacks.filter((s) => s.departmentId === state.departmentId && !s.archived);
  const skills = useMemo(() => pickableSkills(catalog, state.departmentId), [catalog, state.departmentId]);
  const skillNames = useMemo(() => new Map(catalog.skills.map((s) => [s.id, s.name])), [catalog]);
  const skillById = useMemo(() => new Map(catalog.skills.map((s) => [s.id, s])), [catalog]);
  const mix = useMemo(() => previewMix(state, catalog), [state, catalog]);
  const focus = useMemo(() => focusNames(state, catalog), [state, catalog]);
  const dirty = !sameSetup(state, baseline);
  const priorityIds = state.priorities.map((p) => p.skillId);
  const trackRef = track ? { id: track.id, name: track.name } : null;

  const update = (patch: Partial<SetupState>) => setState((s) => ({ ...s, ...patch }));

  const ready = understandingReady(state);
  const understandKey = understandingKey(state);
  /* Rebuilt only when the content (the key) changes, so the debounce is not reset by re-renders. */
  const understandRequest = useMemo(
    () => ({ ...(JSON.parse(understandKey) as ReturnType<typeof toUnderstandRequest>), ...(userId ? { userId } : {}) }),
    [understandKey, userId],
  );
  const understanding = useUnderstanding(understandRequest, understandKey, ready);

  /* `?add=` from the Path tab's Promote: select it once, at Medium, and say so. Handled even when
     nothing matches, so a stale link does not keep retrying. */
  const handledAdd = useRef<string | null>(null);
  useEffect(() => {
    if (!addSkill || handledAdd.current === addSkill) return;
    handledAdd.current = addSkill;
    const skill = findSkillToAdd(skills, addSkill);
    if (skill) {
      setState((s) => pickPriority(s, skill.id));
      notify.success(`${skill.name} added at Medium. Save to keep it.`);
    } else {
      notify.error(`“${addSkill}” is not in the ${department?.name ?? ""} catalog. Request it from the priority picker.`);
    }
    onAddHandled?.();
  }, [addSkill, skills, department, onAddHandled]);

  const requestSkill = async (query: string, into: "priority" | "skip") => {
    const departmentId = state.departmentId;
    const skill = await formDialog<Skill>({
      title: "Request a skill",
      description: "It is usable for this learner straight away, marked pending until a superadmin approves it.",
      submitLabel: "Request and add",
      body: ({ pending: busy }) => (
        <TextField name="name" label="Skill name" defaultValue={query} required autoFocus disabled={busy} maxLength={80} />
      ),
      onSubmit: async (data) => {
        const name = String(data.get("name") ?? "").trim();
        if (name.length < 2) throw new Error("Give it a name of at least two characters.");
        const result = await catalogApi.requestSkill(departmentId, name);
        await refreshCatalog();
        return result.skill;
      },
    });
    if (!skill) return;
    setState((s) => (into === "priority" ? pickPriority(s, skill.id) : pickSkip(s, skill.id)));
    notify.success(skill.status === "pending" ? `${skill.name} requested and added.` : `${skill.name} added.`);
  };

  const submit = async (assign: boolean) => {
    if (pending || !canSubmit) return;
    setPending(assign ? "assign" : "save");
    setError(null);
    setFields({});
    try {
      await onSave(toSaveRequest(state, assign));
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "That didn't save. Try again.";
      setError(message);
      const errFields = (err as { fields?: Record<string, string> }).fields;
      if (errFields) setFields(errFields);
    } finally {
      setPending(null);
    }
  };

  const context: SetupFormContext = { fields, pending: pending !== null };
  const busy = pending !== null;
  const hoursHint = hoursPerDayHint(state.hoursPerWeek);
  const ids = {
    department: `${uid}-department`,
    track: `${uid}-track`,
    stack: `${uid}-stack`,
    experience: `${uid}-experience`,
    level: `${uid}-level`,
    description: `${uid}-description`,
    descriptionCount: `${uid}-description-count`,
    goals: `${uid}-goals`,
    personalisation: `${uid}-personalisation`,
  };
  const descriptionLength = state.description.length;
  const descriptionError = fieldError(fields, "description");

  return (
    <form
      onSubmit={(event: FormEvent) => event.preventDefault()}
      noValidate
      className="lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-10"
    >
      <div className="min-w-0 space-y-10">
        {error && <FormAlert>{error}</FormAlert>}
        {leading?.(context)}

        <Section title="Department and track" hint="Everything below is filtered to the department.">
          <div className="space-y-4">
            <div>
              <p id={ids.department} className="mb-1.5 text-sm font-medium">
                Department
              </p>
              <Segmented
                labelledBy={ids.department}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                value={state.departmentId}
                disabled={busy}
                onChange={(id) => setState((s) => changeDepartmentWithDefaults(s, catalog, id))}
              />
              <FieldMessage error={fieldError(fields, "departmentId")} />
            </div>
            <div>
              <p id={ids.track} className="mb-1.5 text-sm font-medium">
                Track
              </p>
              {tracks.length > 0 ? (
                <Segmented
                  labelledBy={ids.track}
                  options={tracks.map((t) => ({ value: t.id, label: t.name, description: t.description }))}
                  value={state.trackId}
                  disabled={busy}
                  onChange={(id) => update({ trackId: id })}
                />
              ) : (
                <p className="text-sm text-muted-foreground">This department has no tracks yet.</p>
              )}
              <FieldMessage error={fieldError(fields, "trackId")} />
            </div>
          </div>
        </Section>

        <div>
          <div className="flex items-center gap-1.5">
            <label htmlFor={ids.description} className="font-display text-base font-semibold">
              About this person and what you want
            </label>
            <InfoTip label="About the description">
              The AI reads this to write questions in their world: their clients, their tools, what you want them to own.
              Facts beat adjectives. It is saved as their profile notes; the learner never sees it.
            </InfoTip>
            <span
              id={ids.descriptionCount}
              className={cn(
                "ml-auto font-mono text-[11px] tabular",
                descriptionLength > DESCRIPTION_MAX ? "text-trailmark-strong" : "text-muted-foreground",
              )}
            >
              {descriptionLength}/{DESCRIPTION_MAX}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">Where they are now, what they handle, what you want next.</p>
          <textarea
            id={ids.description}
            aria-describedby={ids.descriptionCount}
            aria-invalid={descriptionError ? true : undefined}
            rows={4}
            maxLength={2000}
            value={state.description}
            disabled={busy}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Joined 2 weeks ago from a small agency. Handles 3 client projects. Weak on client calls and Excel trackers. Wants to own sprint planning by next month."
            className={cn(
              "mt-3 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:opacity-60",
              descriptionError && "border-destructive",
            )}
          />
          {descriptionLength > DESCRIPTION_MAX && (
            <p className="mt-1 text-xs text-trailmark-strong">Over {DESCRIPTION_MAX} characters: shorter reads better.</p>
          )}
          <FieldMessage error={descriptionError} />
        </div>

        <UnderstandingPanel state={understanding} ready={ready} className="lg:hidden" />

        <Section
          title={isCoding ? "Stack" : "Tools"}
          titleId={ids.stack}
          hint={isCoding ? "What they build with. Basics questions stay inside it." : "The tools they use day to day."}
          error={fieldError(fields, "stackIds")}
        >
          <StackPicker
            stacks={stacks}
            value={state.stackIds}
            onChange={(stackIds) => update({ stackIds })}
            noun={isCoding ? "stack" : "tool"}
            labelId={ids.stack}
            disabled={busy}
          />
        </Section>

        <Section title="Experience and level">
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <p id={ids.experience} className="mb-1.5 text-sm font-medium">
                Experience (years)
              </p>
              <Segmented<ExperienceBand>
                labelledBy={ids.experience}
                size="sm"
                options={EXPERIENCE_BANDS.map((band) => ({
                  value: band,
                  label: band === "0" ? "0" : band.replace("-", "–"),
                  description: EXPERIENCE_LABELS[band],
                }))}
                value={state.experienceBand}
                disabled={busy}
                onChange={(band) =>
                  setState((s) => ({ ...s, experienceBand: band, level: s.levelTouched ? s.level : levelFromExperience(band) }))
                }
              />
              <FieldMessage error={fieldError(fields, "experienceBand")} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-1">
                <p id={ids.level} className="text-sm font-medium">
                  Level
                </p>
                <InfoTip label="About level">
                  1 is new to the work, 5 could teach it. It sets where the assessment opens, nothing more. Filled in
                  from experience until you choose one.
                </InfoTip>
              </div>
              <Segmented<`${SliderValue}`>
                labelledBy={ids.level}
                size="sm"
                options={(["1", "2", "3", "4", "5"] as const).map((n) => ({ value: n, label: n }))}
                value={state.level === null ? null : (String(state.level) as `${SliderValue}`)}
                disabled={busy}
                onChange={(n) => update({ level: Number(n) as SliderValue, levelTouched: true })}
              />
              <FieldMessage error={fieldError(fields, "level")} />
            </div>
          </div>
        </Section>

        <Section
          title="What should they be able to do?"
          titleId={ids.goals}
          hint="Skills, practical cases or your own words. Each gets a slider."
          info={
            <>
              Critical and High are <strong>Do it now</strong>: their skills get a course on the path and about 60% of the
              assessment, asked first. Each skill takes the highest slider of any goal that needs it.
            </>
          }
          error={fieldError(fields, "goals") ?? fieldError(fields, "priorities")}
          aside={
            <span className="font-mono text-[11px] text-muted-foreground tabular">
              {state.goals.length}/{MAX_GOALS}
            </span>
          }
        >
          <div className="space-y-3">
            {state.prefilledFrom === state.departmentId && state.goals.length > 0 && (
              <p className="text-xs text-muted-foreground">Suggested defaults for {department?.name ?? "this department"}: adjust any slider.</p>
            )}
            <GoalBox
              departmentId={state.departmentId}
              skills={skills}
              skillNames={skillNames}
              track={trackRef}
              rows={state.goals}
              skip={state.skip}
              onChange={(goals) => setState((s) => withGoals(s, goals))}
              onRequestSkill={(query) => void requestSkill(query, "priority")}
              extras={extras}
              extrasLabel={extrasLabel}
              userId={userId}
              disabled={busy}
              labelId={ids.goals}
              defaultTarget={levelTarget(state.level)}
            />
          </div>
        </Section>

        <Section title="Don't include" hint="Never tested and never given a course." error={fieldError(fields, "skip")}>
          <div className="space-y-3">
            <SkillPicker
              skills={skills}
              track={trackRef}
              selectedIds={state.skip}
              otherIds={priorityIds}
              otherLabel="priority"
              triggerLabel="Add a skill to leave out"
              disabled={busy}
              onPick={(skill) => setState((s) => pickSkip(s, skill.id))}
              onRequest={(query) => void requestSkill(query, "skip")}
            />
            {state.skip.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Left out">
                {state.skip.map((id) => {
                  const name = skillById.get(id)?.name ?? id;
                  return (
                    <li key={id}>
                      <span className="inline-flex h-7 items-center gap-1 rounded-md border bg-surface-sunken/60 pl-2.5 pr-1 text-sm">
                        {name}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => update({ skip: state.skip.filter((s) => s !== id) })}
                          className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-strong"
                        >
                          <X className="size-3.5" aria-hidden="true" />
                          <span className="sr-only">Include {name} again</span>
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Section>

        <Field label="Hours per week" hint={hoursHint ?? "What their weekly plan is built to fit."} error={fieldError(fields, "hoursPerWeek")}>
          {({ id, describedBy, invalid }) => (
            <NumberInput
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              min={1}
              max={60}
              value={state.hoursPerWeek}
              disabled={busy}
              onChange={(hoursPerWeek) => update({ hoursPerWeek })}
              containerClassName="w-32"
            />
          )}
        </Field>

        <details className="group rounded-md border" open={Object.keys(fields).some((k) => k.startsWith("advanced")) || undefined}>
          <summary className="cursor-pointer rounded-md px-4 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong">
            Advanced settings
          </summary>
          <div className="grid gap-5 border-t p-4 sm:grid-cols-2">
            <CheckRow
              label="Weeks start on Monday"
              info="Off: a week starts the day it is planned. On: it starts on that week's Monday."
              checked={state.advanced.weekStartsMonday}
              disabled={busy}
              onChange={(weekStartsMonday) => update({ advanced: { ...state.advanced, weekStartsMonday } })}
            />
            <CheckRow
              label="Add suggested goals automatically"
              info="Off: suggested next goals wait for your Add. On: they are added as soon as they are found."
              checked={state.advanced.autoAddSuggestions}
              disabled={busy}
              onChange={(autoAddSuggestions) => update({ advanced: { ...state.advanced, autoAddSuggestions } })}
            />
            <CheckRow
              label="Auto-publish generated courses"
              info="Off: a course the AI writes waits for your review before the learner sees it."
              checked={state.advanced.autoPublish}
              disabled={busy}
              onChange={(autoPublish) => update({ advanced: { ...state.advanced, autoPublish } })}
            />
            <Field label="Deadline (weeks)" hint="Empty means no deadline." error={fieldError(fields, "advanced.deadlineWeeks")}>
              {({ id, describedBy }) => (
                <NumberInput
                  id={id}
                  aria-describedby={describedBy}
                  min={1}
                  max={104}
                  value={state.advanced.deadlineWeeks}
                  disabled={busy}
                  placeholder="None"
                  onChange={(deadlineWeeks) => update({ advanced: { ...state.advanced, deadlineWeeks } })}
                  containerClassName="w-32"
                />
              )}
            </Field>
            <div className="sm:col-span-2">
              <div className="mb-1.5 flex items-center gap-1">
                <label htmlFor={ids.personalisation} className="text-sm font-medium">
                  Personalisation
                </label>
                <InfoTip label="About personalisation">
                  How much of the assessment the AI writes fresh for this person. The rest is reused from the question
                  bank: items already checked, cheaper and quicker. High reuses up to 20%, Balanced up to 40%, Low up to
                  80%. Without an AI key everything comes from the bank.
                </InfoTip>
              </div>
              <select
                id={ids.personalisation}
                value={state.advanced.personalisation}
                disabled={busy}
                onChange={(e) => update({ advanced: { ...state.advanced, personalisation: e.target.value as Personalisation } })}
                className="h-9 w-full max-w-sm rounded-md border border-input bg-surface px-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
              >
                {PERSONALISATION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {PERSONALISATION_LABELS[level]}
                  </option>
                ))}
              </select>
              <FieldMessage error={fieldError(fields, "advanced.personalisation")} />
            </div>
            <Field label="Most AI-generated courses" hint="Per path build. 0 turns generation off." error={fieldError(fields, "advanced.courseCap")}>
              {({ id, describedBy }) => (
                <NumberInput
                  id={id}
                  aria-describedby={describedBy}
                  min={0}
                  max={20}
                  value={state.advanced.courseCap}
                  disabled={busy}
                  onChange={(courseCap) => update({ advanced: { ...state.advanced, courseCap: courseCap ?? 0 } })}
                  containerClassName="w-32"
                />
              )}
            </Field>
          </div>
        </details>

        {trailing?.(context)}
      </div>

      {/* `contents` on a phone keeps the summary a sticky bottom bar; on a desktop the column sticks. */}
      <div className="contents lg:sticky lg:top-6 lg:block lg:max-h-[calc(100dvh-3rem)] lg:space-y-4 lg:overflow-y-auto">
        <SummaryCard
        total={mix.total}
        handsOn={mix.handsOn}
        mcq={mix.mcq}
        targetMinutes={mix.targetMinutes}
        maxMinutes={mix.maxMinutes}
        handsOnNoun={isCoding ? "coding" : "tasks"}
        focus={focus}
        priorityCount={state.priorities.length}
        skipCount={state.skip.length}
        dirty={showDirty ? dirty : false}
        pending={pending}
        canSubmit={canSubmit}
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel}
        onSubmit={(assign) => void submit(assign)}
        />
        <UnderstandingPanel state={understanding} ready={ready} className="hidden lg:block" />
      </div>
    </form>
  );
}

function Section({
  title,
  titleId,
  hint,
  info,
  error,
  aside,
  children,
}: {
  title: string;
  titleId?: string;
  hint?: string;
  info?: ReactNode;
  error?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  const fallbackId = useId();
  const id = titleId ?? fallbackId;
  return (
    <section aria-labelledby={id}>
      <div className="flex items-center gap-1.5">
        <h2 id={id} className="font-display text-base font-semibold">
          {title}
        </h2>
        {info && <InfoTip label={`About ${title.toLowerCase()}`}>{info}</InfoTip>}
        {aside && <span className="ml-auto">{aside}</span>}
      </div>
      {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
      <FieldMessage error={error} />
    </section>
  );
}

function FieldMessage({ error }: { error: string | undefined }) {
  if (!error) return null;
  return <p className="mt-1.5 text-xs font-medium text-destructive">{error}</p>;
}

function CheckRow({
  label,
  info,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  info: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2.5">
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={(on) => onChange(on === true)} />
      <label htmlFor={id} className="cursor-pointer text-sm">
        {label}
      </label>
      <InfoTip label={`About ${label.toLowerCase()}`}>{info}</InfoTip>
    </div>
  );
}

/**
 * What this setup will produce, live: the right column on a desktop, a sticky bar on a phone. The
 * numbers come from `planAssessmentMix`, the function the server's assembler uses.
 */
function SummaryCard({
  total,
  handsOn,
  mcq,
  targetMinutes,
  maxMinutes,
  handsOnNoun,
  focus,
  priorityCount,
  skipCount,
  dirty,
  pending,
  canSubmit,
  primaryLabel,
  secondaryLabel,
  onSubmit,
}: {
  total: number;
  handsOn: number;
  mcq: number;
  targetMinutes: number;
  maxMinutes: number;
  handsOnNoun: string;
  focus: string[];
  priorityCount: number;
  skipCount: number;
  dirty: boolean;
  pending: "save" | "assign" | null;
  canSubmit: boolean;
  primaryLabel: string;
  secondaryLabel: string;
  onSubmit: (assign: boolean) => void;
}) {
  return (
    <aside
      aria-label="Summary"
      className={cn(
        "sticky bottom-0 z-20 -mx-4 mt-10 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6",
        "lg:static lg:mx-0 lg:mt-0 lg:rounded-lg lg:border lg:bg-surface lg:p-5 lg:backdrop-blur-none",
      )}
    >
      {/* Phone: one line, so the bar stays a bar. */}
      <p className="mb-2.5 text-sm lg:hidden">
        <span className="font-medium">{total} questions</span>
        <span className="text-muted-foreground">
          {" "}
          · ~{targetMinutes} min · {handsOn} {handsOnNoun} · {priorityCount} priorit{priorityCount === 1 ? "y" : "ies"}
        </span>
      </p>

      <div className="hidden lg:block">
        <h2 className="font-display text-base font-semibold">Assessment</h2>
        <dl className="mt-3 space-y-2.5 text-sm">
          <SummaryRow term="Questions">
            {total} <span className="text-muted-foreground">({handsOn} {handsOnNoun}, {mcq} multiple choice)</span>
          </SummaryRow>
          <SummaryRow term="Time">
            ~{targetMinutes} min <span className="text-muted-foreground">(max {maxMinutes})</span>
          </SummaryRow>
          <SummaryRow term="Weighted to">
            {focus.length > 0 ? (
              listNames(focus)
            ) : (
              <span className="text-muted-foreground">No Critical or High picks, so spread evenly.</span>
            )}
          </SummaryRow>
          <SummaryRow term="Priorities">
            {priorityCount}
            {skipCount > 0 && <span className="text-muted-foreground"> ({skipCount} left out)</span>}
          </SummaryRow>
        </dl>
      </div>

      <div className="flex gap-2 lg:mt-5 lg:flex-col">
        <Button
          type="button"
          className="flex-1 lg:order-1 lg:w-full lg:flex-none"
          loading={pending === "assign"}
          disabled={!canSubmit || pending !== null}
          onClick={() => onSubmit(true)}
        >
          {primaryLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="lg:order-2 lg:w-full"
          loading={pending === "save"}
          disabled={!canSubmit || pending !== null}
          onClick={() => onSubmit(false)}
        >
          {secondaryLabel}
        </Button>
      </div>
      {dirty && (
        <p className="mt-2 text-center font-mono text-[11px] text-trailmark-strong" role="status">
          Unsaved changes
        </p>
      )}
    </aside>
  );
}

function SummaryRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{term}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
