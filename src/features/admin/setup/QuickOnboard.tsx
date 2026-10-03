import { useId, useMemo, useState, type FormEvent } from "react";
import { LoaderCircle, Sparkles, X } from "lucide-react";

import type { Catalog } from "@shared/catalog";
import type { OnboardSuggestion, SuggestedGoal } from "@shared/goals";
import { EXPERIENCE_BANDS, EXPERIENCE_LABELS, levelFromExperience, type ExperienceBand, type SaveSetupRequest, type Slider } from "@shared/setup";

import { ApiRequestError } from "@/api/client";
import { FormAlert, TextField } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";
import { GoalBox } from "./GoalBox";
import { addSuggestedGoal, type GoalRow } from "./goals";
import { goalsApi } from "./goalsApi";
import { initialSetupState, levelTarget, pickableSkills, toSaveRequest, withDepartmentDefaults, withGoals, type SetupState } from "./helpers";

/**
 * Quick onboarding (v4.3), the default on /admin/onboard: name, username, department and one line
 * about the person. **Suggest** fills in everything else in one cheap AI call (rules without AI);
 * **Save & assign assessment** creates the account and issues the assessment. "Edit details" opens
 * the full Setup form with whatever is here.
 */

/** "Priya Sharma" → "priya.sharma". */
export function usernameFrom(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 32);
}

/** The setup a suggestion describes, as the Setup form's state. */
export function stateFromSuggestion(suggestion: OnboardSuggestion, description: string, fallbackDepartment: string): SetupState {
  const base = initialSetupState(null, suggestion.departmentId || fallbackDepartment);
  const level = (suggestion.level ?? (suggestion.experienceBand ? levelFromExperience(suggestion.experienceBand) : null)) as Slider | null;
  const rows = suggestion.goals.reduce<GoalRow[]>((acc, g) => addSuggestedGoal(acc, g), []);
  return withGoals(
    {
      ...base,
      trackId: suggestion.trackId,
      stackIds: suggestion.stackIds,
      experienceBand: suggestion.experienceBand,
      level,
      levelTouched: level !== null,
      hoursPerWeek: suggestion.hoursPerWeek,
      description,
    },
    rows,
  );
}

export interface QuickOnboardProps {
  catalog: Catalog;
  username: string;
  displayName: string;
  onUsername: (value: string) => void;
  onDisplayName: (value: string) => void;
  usernameError?: string;
  /** The account exists already (a retry after a failed setup save): its fields are locked. */
  accountLocked: boolean;
  canSubmit: boolean;
  onSave: (request: SaveSetupRequest) => Promise<void>;
  onEditDetails: (state: SetupState, extras: SuggestedGoal[]) => void;
  /** Superadmin only: switch to creating an admin account. */
  onCreateAdmin?: () => void;
}

export function QuickOnboard({ catalog, username, displayName, onUsername, onDisplayName, usernameError, accountLocked, canSubmit, onSave, onEditDetails, onCreateAdmin }: QuickOnboardProps) {
  const uid = useId();
  const departments = useMemo(() => catalog.departments.filter((d) => !d.archived), [catalog]);
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "engineering");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [line, setLine] = useState("");
  const [state, setState] = useState<SetupState | null>(null);
  const [extras, setExtras] = useState<SuggestedGoal[]>([]);
  const [source, setSource] = useState<OnboardSuggestion["source"] | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const department = catalog.departments.find((d) => d.id === departmentId);
  const tracks = catalog.tracks.filter((t) => t.departmentId === departmentId && !t.archived);
  const stacks = catalog.stacks.filter((s) => s.departmentId === departmentId && !s.archived);
  const skills = useMemo(() => pickableSkills(catalog, departmentId), [catalog, departmentId]);
  const skillNames = useMemo(() => new Map(catalog.skills.map((s) => [s.id, s.name])), [catalog]);
  const track = state ? (tracks.find((t) => t.id === state.trackId) ?? null) : null;
  const update = (patch: Partial<SetupState>) => setState((s) => (s ? { ...s, ...patch } : s));
  const ids = { department: `${uid}-department`, goals: `${uid}-goals`, line: `${uid}-line` };

  const suggest = async (event?: FormEvent) => {
    event?.preventDefault();
    if (suggesting || line.trim().length < 3) return;
    setSuggesting(true);
    setError(null);
    try {
      const { suggestion } = await goalsApi.suggest({ departmentId, description: line.trim(), ...(displayName.trim() ? { name: displayName.trim() } : {}) });
      setState(stateFromSuggestion(suggestion, line.trim(), departmentId));
      setExtras(suggestion.extras);
      setSource(suggestion.source);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Suggest did not answer. Use Edit details to fill it in by hand.");
    } finally {
      setSuggesting(false);
    }
  };

  const save = async () => {
    if (!state || saving || !canSubmit) return;
    setSaving(true);
    setError(null);
    setFields({});
    try {
      await onSave(toSaveRequest(state, true));
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "That didn't save. Try again.");
      const errFields = (err as { fields?: Record<string, string> }).fields;
      if (errFields) setFields(errFields);
    } finally {
      setSaving(false);
    }
  };

  const editDetails = () => {
    const seed = state ?? withDepartmentDefaults({ ...initialSetupState(null, departmentId), description: line.trim() }, catalog);
    onEditDetails({ ...seed, description: line.trim() || seed.description }, extras);
  };

  const busy = suggesting || saving;
  const changeDepartment = (id: string) => {
    if (id === departmentId) return;
    setDepartmentId(id);
    // Goals and stacks belong to a department: the suggestion is for the old one.
    setState(null);
    setExtras([]);
    setSource(null);
  };

  return (
    <div className="max-w-3xl space-y-8">
      {error && <FormAlert>{error}</FormAlert>}

      <form onSubmit={(e) => void suggest(e)} noValidate className="space-y-5" aria-label="Who they are">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Full name"
            required
            value={displayName}
            disabled={busy || accountLocked}
            error={fields.displayName}
            placeholder="Priya Sharma"
            autoFocus
            onChange={(e) => {
              onDisplayName(e.target.value);
              if (!usernameTouched) onUsername(usernameFrom(e.target.value));
            }}
          />
          <TextField
            label="Username"
            required
            value={username}
            disabled={busy || accountLocked}
            error={fields.username ?? usernameError}
            spellCheck={false}
            autoCapitalize="none"
            hint={usernameError ? undefined : "A password is generated and shown once."}
            onChange={(e) => {
              setUsernameTouched(true);
              onUsername(e.target.value);
            }}
          />
        </div>

        <div>
          <p id={ids.department} className="mb-1.5 text-sm font-medium">
            Department
          </p>
          <Segmented labelledBy={ids.department} options={departments.map((d) => ({ value: d.id, label: d.name }))} value={departmentId} disabled={busy} onChange={changeDepartment} />
        </div>

        <div>
          <label htmlFor={ids.line} className="text-sm font-medium">
            Describe them in one line
          </label>
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
            <input
              id={ids.line}
              value={line}
              maxLength={600}
              disabled={busy}
              onChange={(e) => setLine(e.target.value)}
              placeholder="Frontend dev, 2 yrs React, weak on Git, we want him doing backend + AI-driven work"
              className="h-10 min-w-0 flex-1 rounded-md border border-input bg-surface px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:opacity-60"
            />
            <Button type="submit" variant={state ? "outline" : "default"} loading={suggesting} disabled={line.trim().length < 3 || busy}>
              {!suggesting && <Sparkles aria-hidden="true" />}
              {state ? "Suggest again" : "Suggest"}
            </Button>
          </div>
        </div>
      </form>

      {suggesting && !state && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Reading the description…
        </p>
      )}

      {state && (
        <section aria-label="Suggested setup" className="space-y-6 rounded-lg border bg-surface px-4 py-5 sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-base font-semibold">Suggested setup</h2>
            <span className="font-mono text-[11px] text-muted-foreground">{source === "ai" ? "read by AI" : "from the catalog rules"}</span>
          </div>

          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-4">
            <CompactSelect label="Track" value={state.trackId ?? ""} disabled={busy} onChange={(v) => update({ trackId: v || null })}>
              <option value="">No track</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </CompactSelect>
            <CompactSelect
              label="Experience"
              value={state.experienceBand ?? ""}
              disabled={busy}
              onChange={(v) => {
                const band = (v || null) as ExperienceBand | null;
                update({ experienceBand: band, level: state.levelTouched || !band ? state.level : levelFromExperience(band) });
              }}
            >
              <option value="">Not given</option>
              {EXPERIENCE_BANDS.map((b) => (
                <option key={b} value={b}>
                  {EXPERIENCE_LABELS[b]}
                </option>
              ))}
            </CompactSelect>
            <CompactSelect label="Level" value={state.level ? String(state.level) : ""} disabled={busy} onChange={(v) => update({ level: v ? (Number(v) as Slider) : null, levelTouched: true })}>
              <option value="">Not set</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "· new to it" : n === 5 ? "· could teach it" : ""}
                </option>
              ))}
            </CompactSelect>
            <CompactSelect label="Hours a week" value={String(state.hoursPerWeek ?? 15)} disabled={busy} onChange={(v) => update({ hoursPerWeek: Number(v) })}>
              {[...new Set([5, 10, 15, 20, 25, 30, 40, state.hoursPerWeek ?? 15])].sort((a, b) => a - b).map((h) => (
                <option key={h} value={h}>
                  {h} h
                </option>
              ))}
            </CompactSelect>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">{department?.assessmentFormat === "coding" ? "Stack" : "Tools"}</p>
            <ul className="flex flex-wrap gap-1.5" aria-label={department?.assessmentFormat === "coding" ? "Stack" : "Tools"}>
              {state.stackIds.map((id) => (
                <li key={id}>
                  <span className="inline-flex h-7 items-center gap-1 rounded-md border bg-surface-sunken/60 pl-2.5 pr-1 text-sm">
                    {stacks.find((s) => s.id === id)?.name ?? id}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => update({ stackIds: state.stackIds.filter((s) => s !== id) })}
                      className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-strong"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Remove {stacks.find((s) => s.id === id)?.name ?? id}</span>
                    </button>
                  </span>
                </li>
              ))}
              <li>
                <select
                  aria-label={`Add a ${department?.assessmentFormat === "coding" ? "stack" : "tool"}`}
                  value=""
                  disabled={busy}
                  onChange={(e) => e.target.value && update({ stackIds: [...state.stackIds, e.target.value] })}
                  className="h-7 rounded-md border border-dashed border-input bg-surface px-2 text-sm text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
                >
                  <option value="">+ Add</option>
                  {stacks
                    .filter((s) => !state.stackIds.includes(s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </li>
            </ul>
          </div>

          <div>
            <p id={ids.goals} className="font-display text-base font-semibold">
              What should they be able to do?
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">Ranked from the description. Move a slider or add more.</p>
            <div className="mt-3">
              <GoalBox
                departmentId={departmentId}
                skills={skills}
                skillNames={skillNames}
                track={track ? { id: track.id, name: track.name } : null}
                rows={state.goals}
                skip={state.skip}
                onChange={(goals) => setState((s) => (s ? withGoals(s, goals) : s))}
                extras={extras}
                extrasLabel={`Suggested for ${track ? `a ${track.name} ${department?.assessmentFormat === "coding" ? "dev" : "hire"}` : "them"} with your description`}
                disabled={busy}
                labelId={ids.goals}
                defaultTarget={levelTarget(state.level)}
              />
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" loading={saving} disabled={!state || !canSubmit || busy} onClick={() => void save()}>
          Save &amp; assign assessment
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={editDetails}>
          Edit details
        </Button>
        {onCreateAdmin && (
          <Button type="button" variant="link" className="h-auto px-0" disabled={busy || accountLocked} onClick={onCreateAdmin}>
            Create an admin account instead
          </Button>
        )}
      </div>
    </div>
  );
}

function CompactSelect({ label, value, onChange, disabled, children }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; children: React.ReactNode }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-xs text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-9 w-full rounded-md border border-input bg-surface px-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:opacity-60")}
      >
        {children}
      </select>
    </div>
  );
}
