import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, LoaderCircle, Pencil, Plus, Search, Sparkles, X } from "lucide-react";

import type { Skill } from "@shared/catalog";
import { asOutcome, MAX_GOALS, TARGET_LEVEL_LABELS, type GoalInterpretation, type OutcomeOption, type SuggestedGoal } from "@shared/goals";
import { SLIDER_LABELS, SLIDER_VALUES, type Slider as SliderValue } from "@shared/setup";

import { ApiRequestError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandMeta } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Segmented } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  addCaseGoal,
  addSkillGoal,
  addSuggestedGoal,
  addTextGoal,
  canMoveGoal,
  interpretationLine,
  moveGoal,
  removeGoal,
  searchCases,
  sortedGoals,
  updateGoal,
  type GoalRow,
} from "./goals";
import { goalsApi } from "./goalsApi";
import { pickerGroups } from "./helpers";
import { SkillPicker } from "./SkillPicker";

const TONE: Record<SliderValue, string> = {
  5: "bg-destructive/10 text-destructive",
  4: "bg-trailmark/12 text-trailmark-strong",
  3: "bg-primary/10 text-primary-strong",
  2: "bg-foreground/[0.07] text-muted-foreground",
  1: "bg-foreground/[0.07] text-muted-foreground",
};

const TYPE_LABEL: Record<GoalRow["type"], string> = { skill: "skill", case: "case", text: "goal" };

/** Practical cases per department, fetched once per page. */
const caseCache = new Map<string, Promise<OutcomeOption[]>>();
export function useCases(departmentId: string): OutcomeOption[] {
  const [cases, setCases] = useState<OutcomeOption[]>([]);
  useEffect(() => {
    let live = true;
    if (!caseCache.has(departmentId)) {
      caseCache.set(
        departmentId,
        goalsApi.outcomes(departmentId).then((r) => r.outcomes).catch(() => {
          caseCache.delete(departmentId);
          return [];
        }),
      );
    }
    void caseCache.get(departmentId)!.then((list) => live && setCases(list));
    return () => {
      live = false;
    };
  }, [departmentId]);
  return cases;
}

export interface GoalBoxProps {
  departmentId: string;
  /** The department's pickable skills. */
  skills: readonly Skill[];
  skillNames: ReadonlyMap<string, string>;
  track: { id: string; name: string } | null;
  rows: readonly GoalRow[];
  skip: readonly string[];
  onChange: (rows: GoalRow[]) => void;
  /** "Can't find it? Request a skill", with what was typed. */
  onRequestSkill?: (query: string) => void;
  /** Onboarding's "Suggested for …" chips, each with + Add. */
  extras?: readonly SuggestedGoal[];
  extrasLabel?: string;
  userId?: string;
  disabled?: boolean;
  labelId?: string;
  /** A new skill goal's target level: a step above their level. */
  defaultTarget?: number;
}

/**
 * "What should they be able to do?" (v4.3): one box for skills from the catalog, practical cases from
 * the department's library, and free text the AI reads into an outcome, skills and a level. Every
 * entry gets the same five-stop slider; rows sort themselves highest first, like priorities did.
 */
export function GoalBox({ departmentId, skills, skillNames, track, rows, skip, onChange, onRequestSkill, extras, extrasLabel, userId, disabled, labelId, defaultTarget = 3 }: GoalBoxProps) {
  const cases = useCases(departmentId);
  const [pending, setPending] = useState<{ text: string; reading: GoalInterpretation | null; message?: string; busy: boolean } | null>(null);
  const full = rows.length >= MAX_GOALS;

  const interpret = async (text: string) => {
    setPending({ text, reading: null, busy: true });
    try {
      const result = await goalsApi.interpret({ departmentId, text, ...(userId ? { userId } : {}) });
      setPending({ text, reading: result.interpretation, message: result.message, busy: false });
    } catch (err) {
      setPending({ text, reading: null, message: err instanceof ApiRequestError ? err.message : "Could not read that goal. Pick the skills it needs.", busy: false });
    }
  };

  const visibleExtras = (extras ?? []).filter((e) => (e.caseId ? !rows.some((r) => r.caseId === e.caseId) : !e.skillIds.every((id) => rows.some((r) => r.skillIds.includes(id)))));

  return (
    <div className="space-y-3">
      <GoalPicker
        skills={skills}
        cases={cases}
        track={track}
        rows={rows}
        skip={skip}
        disabled={disabled || full}
        labelId={labelId}
        onSkill={(skill) => onChange(addSkillGoal(rows, skill.id, 3, defaultTarget))}
        onCase={(c) => onChange(addCaseGoal(rows, c))}
        onText={(text) => void interpret(text)}
        onRequest={onRequestSkill}
      />

      {pending && (
        <PendingGoal
          pending={pending}
          skills={skills}
          skillNames={skillNames}
          track={track}
          onCancel={() => setPending(null)}
          onAccept={(reading) => {
            onChange(addTextGoal(rows, pending.text, reading));
            setPending(null);
          }}
        />
      )}

      {visibleExtras.length > 0 && (
        <div className="rounded-md border border-dashed px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-ridge-strong" aria-hidden="true" />
            {extrasLabel ?? "Suggested"}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Suggested goals">
            {visibleExtras.map((e) => (
              <li key={`${e.caseId ?? e.skillIds.join("+")}`}>
                <button
                  type="button"
                  disabled={disabled || full}
                  title={e.reason}
                  onClick={() => onChange(addSuggestedGoal(rows, e))}
                  className="inline-flex h-7 items-center gap-1 rounded-md border bg-surface px-2 text-sm transition-colors hover:border-foreground/30 hover:bg-surface-sunken/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trailmark disabled:opacity-50"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  <span>{e.caseId || e.type === "text" ? e.originalText : (skillNames.get(e.skillIds[0]) ?? e.originalText)}</span>
                  <span className="sr-only">: add as a goal</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">No goals yet. The assessment then covers their track basics only.</p>
      ) : (
        <GoalRows rows={rows} skills={skills} skillNames={skillNames} track={track} disabled={disabled} onChange={onChange} />
      )}
    </div>
  );
}

/** The one search box: skills, then practical cases, then "use what I typed as a goal". */
function GoalPicker({
  skills,
  cases,
  track,
  rows,
  skip,
  disabled,
  labelId,
  onSkill,
  onCase,
  onText,
  onRequest,
}: {
  skills: readonly Skill[];
  cases: readonly OutcomeOption[];
  track: { id: string; name: string } | null;
  rows: readonly GoalRow[];
  skip: readonly string[];
  disabled?: boolean;
  labelId?: string;
  onSkill: (skill: Skill) => void;
  onCase: (c: OutcomeOption) => void;
  onText: (text: string) => void;
  onRequest?: (query: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim();
  const skillGroups = useMemo(() => pickerGroups(skills, query, q ? null : track), [skills, query, q, track]);
  const caseMatches = useMemo(() => searchCases(cases, query).slice(0, q ? 8 : 6), [cases, query, q]);
  const picked = new Set(rows.filter((r) => r.type === "skill").map((r) => r.skillIds[0]));
  const pickedCases = new Set(rows.map((r) => r.caseId).filter(Boolean));
  const skipped = new Set(skip);
  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-labelledby={labelId}
          className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-surface px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-surface-sunken/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:opacity-50"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Add a skill, a practical case, or type a goal</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(34rem,calc(100vw-2rem))] p-0">
        <Command shouldFilter={false} loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Git, “merge conflict”, or “debug Laravel queues in production”"
            leading={<Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
          />
          <CommandList>
            {q.length >= 3 && (
              <CommandGroup heading="Your words">
                <CommandItem
                  value="__text"
                  onSelect={() => {
                    onText(q);
                    close();
                  }}
                >
                  <Sparkles className="text-ridge-strong" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">Use “{q}” as a goal</span>
                  <CommandMeta>AI reads it</CommandMeta>
                </CommandItem>
              </CommandGroup>
            )}
            {caseMatches.length > 0 && (
              <CommandGroup heading="Practical cases">
                {caseMatches.map((c) => (
                  <CommandItem key={c.id} value={`case:${c.id}`} disabled={pickedCases.has(c.id)} onSelect={() => onCase(c)}>
                    <Check className={cn("text-primary-strong", !pickedCases.has(c.id) && "invisible")} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{c.title}</span>
                    <CommandMeta>{TARGET_LEVEL_LABELS[c.level]}</CommandMeta>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {skillGroups.map((group) => (
              <CommandGroup key={group.key} heading={group.key === "suggested" ? group.heading : `Skills · ${group.heading}`}>
                {group.skills.map((skill) => (
                  <CommandItem key={`${group.key}:${skill.id}`} value={`${group.key}:${skill.id}`} disabled={picked.has(skill.id)} onSelect={() => onSkill(skill)}>
                    <Check className={cn("text-primary-strong", !picked.has(skill.id) && "invisible")} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{skill.name}</span>
                    {skill.status === "pending" && <CommandMeta className="ml-0">pending</CommandMeta>}
                    {picked.has(skill.id) ? <CommandMeta>added</CommandMeta> : skipped.has(skill.id) ? <CommandMeta>left out</CommandMeta> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {onRequest && (
              <CommandGroup>
                <CommandItem
                  value="__request"
                  onSelect={() => {
                    close();
                    onRequest(q);
                  }}
                  className="text-muted-foreground"
                >
                  <Plus aria-hidden="true" />
                  <span className="underline decoration-trailmark decoration-2 underline-offset-4">Can't find a skill? Request one</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** A typed goal, read by the AI: accept it as read, or edit the skills and level first. */
function PendingGoal({
  pending,
  skills,
  skillNames,
  track,
  onCancel,
  onAccept,
}: {
  pending: { text: string; reading: GoalInterpretation | null; message?: string; busy: boolean };
  skills: readonly Skill[];
  skillNames: ReadonlyMap<string, string>;
  track: { id: string; name: string } | null;
  onCancel: () => void;
  onAccept: (reading: GoalInterpretation) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<GoalInterpretation | null>(pending.reading);
  useEffect(() => {
    setDraft(pending.reading ?? (pending.busy ? null : { outcome: asOutcome(pending.text), skillIds: [], targetLevel: 3, caseId: null }));
    setEditing(!pending.busy && !pending.reading);
  }, [pending]);

  return (
    <div className="rounded-md border border-ridge/40 bg-ridge/[0.04] px-3 py-3" role="group" aria-label="New goal">
      <p className="text-sm font-medium">“{pending.text}”</p>
      {pending.busy ? (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          Reading it…
        </p>
      ) : (
        draft && (
          <>
            {draft.skillIds.length > 0 && <p className="mt-1 font-mono text-xs text-muted-foreground">{interpretationLine(draft.skillIds, draft.targetLevel, skillNames)}</p>}
            {pending.message && <p className="mt-1 text-xs text-trailmark-strong">{pending.message}</p>}
            {editing && <GoalEditor value={draft} onChange={setDraft} skills={skills} skillNames={skillNames} track={track} />}
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={draft.skillIds.length === 0} onClick={() => onAccept(draft)}>
                <Check aria-hidden="true" />
                Add goal
              </Button>
              {!editing && (
                <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <Pencil aria-hidden="true" />
                  Edit
                </Button>
              )}
              <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </>
        )
      )}
    </div>
  );
}

/** Skills (chips + picker) and the target level of a case or text goal. */
function GoalEditor({
  value,
  onChange,
  skills,
  skillNames,
  track,
}: {
  value: { skillIds: string[]; targetLevel: number };
  onChange: (next: GoalInterpretation) => void;
  skills: readonly Skill[];
  skillNames: ReadonlyMap<string, string>;
  track: { id: string; name: string } | null;
}) {
  const levelId = useId();
  const patch = (p: Partial<GoalInterpretation>) => onChange({ outcome: "", caseId: null, ...value, ...p } as GoalInterpretation);
  return (
    <div className="mt-2.5 space-y-2.5">
      <ul className="flex flex-wrap gap-1.5" aria-label="Skills it needs">
        {value.skillIds.map((id) => (
          <li key={id}>
            <span className="inline-flex h-7 items-center gap-1 rounded-md border bg-surface pl-2.5 pr-1 text-sm">
              {skillNames.get(id) ?? id}
              <button
                type="button"
                onClick={() => patch({ skillIds: value.skillIds.filter((s) => s !== id) })}
                className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-strong"
              >
                <X className="size-3.5" aria-hidden="true" />
                <span className="sr-only">Remove {skillNames.get(id) ?? id}</span>
              </button>
            </span>
          </li>
        ))}
      </ul>
      {value.skillIds.length < 6 && (
        <SkillPicker
          skills={skills}
          track={track}
          selectedIds={value.skillIds}
          otherIds={[]}
          otherLabel=""
          triggerLabel="Add a skill it needs"
          onPick={(skill) => patch({ skillIds: [...value.skillIds, skill.id] })}
          onRequest={() => {}}
        />
      )}
      <div>
        <p id={levelId} className="mb-1 text-xs text-muted-foreground">
          Target level
        </p>
        <Segmented<`${number}`>
          labelledBy={levelId}
          size="sm"
          options={[1, 2, 3, 4, 5].map((n) => ({ value: `${n}` as `${number}`, label: TARGET_LEVEL_LABELS[n] }))}
          value={`${value.targetLevel}` as `${number}`}
          onChange={(n) => patch({ targetLevel: Number(n) })}
        />
      </div>
    </div>
  );
}

/**
 * The goals, highest slider first. As with priorities: the order holds while a thumb is dragged,
 * focus returns to the control in use after a re-sort, and arrows reorder goals that share a level.
 */
function GoalRows({
  rows,
  skills,
  skillNames,
  track,
  disabled,
  onChange,
}: {
  rows: readonly GoalRow[];
  skills: readonly Skill[];
  skillNames: ReadonlyMap<string, string>;
  track: { id: string; name: string } | null;
  disabled?: boolean;
  onChange: (rows: GoalRow[]) => void;
}) {
  const [held, setHeld] = useState<string[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const refocus = useRef<{ key: string; control: string } | null>(null);
  const sorted = sortedGoals(rows);
  const display = held ? [...held.map((k) => rows.find((r) => r.key === k)).filter((r): r is GoalRow => Boolean(r)), ...sorted.filter((r) => !held.includes(r.key))] : sorted;

  useEffect(() => {
    if (!held) return;
    const release = () => setHeld(null);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [held]);

  useLayoutEffect(() => {
    const target = refocus.current;
    if (!target || !listRef.current) return;
    refocus.current = null;
    const row = listRef.current.querySelector<HTMLElement>(`[data-goal-row="${CSS.escape(target.key)}"]`);
    let control = row?.querySelector<HTMLElement>(target.control) ?? null;
    if (control instanceof HTMLButtonElement && control.disabled) control = row?.querySelector<HTMLElement>('[role="slider"]') ?? null;
    if (control && document.activeElement !== control) control.focus();
  });

  return (
    <ol ref={listRef} className="divide-y rounded-md border" aria-label="Goals, highest first">
      {display.map((row) => {
        const name = row.type === "skill" ? (skillNames.get(row.skillIds[0]) ?? row.originalText) : row.type === "case" ? row.originalText : row.originalText;
        const slider = row.slider as SliderValue;
        return (
          <li key={row.key} data-goal-row={row.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_15rem_auto]">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="min-w-0 break-words font-medium">{name}</span>
                {row.type !== "skill" && <span className="rounded-sm border px-1.5 font-mono text-[10px] text-muted-foreground">{TYPE_LABEL[row.type]}</span>}
                {row.status === "achieved" && <span className="rounded-sm border border-summit/50 px-1.5 font-mono text-[10px] text-summit-strong">achieved</span>}
              </p>
              {row.type !== "skill" && <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{interpretationLine(row.skillIds, row.targetLevel, skillNames)}</p>}
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span className={cn("rounded-sm px-1.5 py-px font-mono text-[11px] font-medium", TONE[slider])}>{SLIDER_LABELS[slider]}</span>
                {row.slider >= 4 && <span>Do it now</span>}
              </p>
            </div>

            <div className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
              <Slider
                min={1}
                max={5}
                step={1}
                value={[row.slider]}
                disabled={disabled}
                thumbLabels={[`${name} priority`]}
                valueText={(value) => SLIDER_LABELS[value as SliderValue]}
                onPointerDown={() => setHeld(sorted.map((r) => r.key))}
                onValueChange={([value]) => {
                  refocus.current = { key: row.key, control: '[role="slider"]' };
                  onChange(updateGoal(rows, row.key, { slider: value }));
                }}
                onValueCommit={() => setHeld(null)}
              />
              <div className="mt-0.5 grid grid-cols-5 text-[10px] leading-tight text-muted-foreground" aria-hidden="true">
                {SLIDER_VALUES.map((value) => (
                  <span key={value} className={cn("truncate", value === 1 ? "text-left" : value === 5 ? "text-right" : "text-center", value === row.slider && "font-medium text-foreground")}>
                    {SLIDER_LABELS[value]}
                  </span>
                ))}
              </div>
            </div>

            <div className="col-start-2 row-start-1 flex items-center gap-0.5 sm:col-start-3">
              {row.type !== "skill" && (
                <RowButton label={`Edit ${name}`} disabled={disabled} aria-expanded={editing === row.key} onClick={() => setEditing((k) => (k === row.key ? null : row.key))}>
                  <Pencil aria-hidden="true" />
                </RowButton>
              )}
              <RowButton
                label={`Move ${name} up within ${SLIDER_LABELS[slider]}`}
                disabled={disabled || !canMoveGoal(rows, row.key, -1)}
                data-control="up"
                onClick={() => {
                  refocus.current = { key: row.key, control: '[data-control="up"]' };
                  onChange(moveGoal(rows, row.key, -1));
                }}
              >
                <ArrowUp aria-hidden="true" />
              </RowButton>
              <RowButton
                label={`Move ${name} down within ${SLIDER_LABELS[slider]}`}
                disabled={disabled || !canMoveGoal(rows, row.key, 1)}
                data-control="down"
                onClick={() => {
                  refocus.current = { key: row.key, control: '[data-control="down"]' };
                  onChange(moveGoal(rows, row.key, 1));
                }}
              >
                <ArrowDown aria-hidden="true" />
              </RowButton>
              <RowButton
                label={`Remove ${name}`}
                disabled={disabled}
                onClick={() => {
                  const before = rows;
                  onChange(removeGoal(rows, row.key));
                  notify.undo(`Removed ${name}.`, { onUndo: () => onChange([...before]) });
                }}
              >
                <X aria-hidden="true" />
              </RowButton>
            </div>

            {editing === row.key && row.type !== "skill" && (
              <div className="col-span-2 sm:col-span-3">
                <GoalEditor
                  value={row}
                  skills={skills}
                  skillNames={skillNames}
                  track={track}
                  onChange={(next) => next.skillIds.length > 0 && onChange(updateGoal(rows, row.key, { skillIds: next.skillIds, targetLevel: next.targetLevel }))}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function RowButton({ label, children, ...props }: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement> & { "data-control"?: string }) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-strong disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-4"
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
