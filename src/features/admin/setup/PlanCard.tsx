import { useId } from "react";
import { HelpCircle } from "lucide-react";

import type { Catalog } from "@shared/catalog";
import { choiceForSlider, PRIORITY_CHOICE_LABELS, PRIORITY_CHOICES, type OnboardPreview, type PriorityChoice } from "@shared/onboardPreview";
import type { UnsureOption } from "@shared/intents";

import { Button } from "@/components/ui/button";
import { PlainError } from "@/components/form/PlainError";
import { cn } from "@/lib/utils";

import { openUnsure, type SetupState } from "./helpers";
import { currentRoleLine, planTitle, wantedItems, type WantedItem } from "./planSummary";

/**
 * v4.4 Phase 6: the one card an admin reviews after Suggest. Who they are now, what you want (each
 * with a Most important / Important / Nice to have drop-down), what the test will check, what comes
 * first after it, and the courses we'll add. Unsure phrases sit above the button, which waits for
 * them. "Show details" keeps the numbers for anyone who wants them.
 *
 * `compact` is the bulk onboarding row's version: the same content, tighter, with no main buttons.
 */
export interface PlanCardProps {
  displayName: string;
  state: SetupState;
  catalog: Pick<Catalog, "tracks" | "departments" | "skills">;
  preview: OnboardPreview | null;
  previewError?: unknown;
  previewLoading?: boolean;
  disabled?: boolean;
  onPriority: (item: WantedItem, choice: PriorityChoice) => void;
  onAnswer: (index: number, option: UnsureOption) => void;
  /** Absent in compact mode. */
  onSend?: () => void;
  sending?: boolean;
  /** The send button waits (the name or username is not ready, say). */
  sendDisabled?: boolean;
  onChange?: () => void;
  /** "Change something" is open. */
  changing?: boolean;
  sendLabel?: string;
  compact?: boolean;
}

export function PlanCard({
  displayName,
  state,
  catalog,
  preview,
  previewError,
  previewLoading,
  disabled,
  onPriority,
  onAnswer,
  onSend,
  sending,
  sendDisabled,
  onChange,
  changing,
  sendLabel,
  compact,
}: PlanCardProps) {
  const uid = useId();
  const now = currentRoleLine(state, catalog);
  const wanted = wantedItems(state);
  const unsure = state.unsure ?? [];
  const open = openUnsure(state);
  const skillName = (id: string) => catalog.skills.find((s) => s.id === id)?.name ?? id;
  const heading = cn("font-medium", compact ? "text-xs text-muted-foreground" : "text-sm");
  const minutes = preview?.minutes ?? 30;

  return (
    <section aria-label={planTitle(displayName)} className={cn("space-y-4 rounded-lg border bg-surface", compact ? "px-3 py-3 text-sm" : "px-4 py-5 sm:px-5")}>
      {!compact && <h2 className="font-display text-base font-semibold">{planTitle(displayName)}</h2>}

      {now && (
        <div>
          <p className={heading}>What they do now</p>
          <p className="mt-0.5">{now}</p>
        </div>
      )}

      <div>
        <p className={heading} id={`${uid}-want`}>
          What you want
        </p>
        {wanted.length === 0 ? (
          <p className="mt-0.5 text-muted-foreground">Nothing yet. Use Change something to add a goal.</p>
        ) : (
          <ol className="mt-1 space-y-1.5" aria-labelledby={`${uid}-want`}>
            {wanted.map((item, i) => (
              <li key={item.key} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span>
                  {i + 1}. {item.statement}
                </span>
                <select
                  aria-label={`How important: ${item.statement}`}
                  value={choiceForSlider(item.slider)}
                  disabled={disabled}
                  onChange={(e) => onPriority(item, e.target.value as PriorityChoice)}
                  className="h-8 rounded-md border border-input bg-surface px-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:opacity-60"
                >
                  {PRIORITY_CHOICES.map((c) => (
                    <option key={c} value={c}>
                      {PRIORITY_CHOICE_LABELS[c]}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ol>
        )}
      </div>

      {previewError != null && !preview ? (
        <PlainError error={previewError} fallback="We couldn't work out the test and the first steps. You can still send the test." />
      ) : (
        <>
          <div>
            <p className={heading}>What the test will check (about {minutes} min)</p>
            {preview ? (
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {preview.testChecks.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-0.5 text-muted-foreground">{previewLoading ? "Working it out…" : "Not worked out yet."}</p>
            )}
          </div>
          {preview && preview.firstSteps.length > 0 && (
            <div>
              <p className={heading}>What they&rsquo;ll learn first (after the test)</p>
              <p className="mt-0.5">{preview.firstSteps.join(" → ")}</p>
              <p className="text-xs text-muted-foreground">(We&rsquo;ll fine-tune this after the test.)</p>
            </div>
          )}
          {preview && preview.newCourses.length > 0 && (
            <p>
              <span className={heading}>New courses we&rsquo;ll add to the library: </span>
              {preview.newCourses.join(", ")}
            </p>
          )}
        </>
      )}

      {unsure.length > 0 &&
        open > 0 &&
        unsure.map((question, index) => (
          <div key={`${question.phrase}-${index}`} role="group" aria-label={`Not sure about ${question.phrase}`} className="rounded-md border border-trailmark/50 bg-trailmark/6 px-3 py-2.5">
            <p className="flex items-start gap-2">
              <HelpCircle className="mt-0.5 size-4 shrink-0 text-trailmark-strong" aria-hidden="true" />
              <span>
                We weren&rsquo;t sure what you meant by &lsquo;{question.phrase}
                &rsquo;. Pick one:
              </span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2 pl-6">
              {question.options.map((option) => (
                <Button key={option.label} type="button" size="sm" variant={option.leaveOut ? "ghost" : "outline"} disabled={disabled} onClick={() => onAnswer(index, option)}>
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        ))}

      {!compact && onSend && (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" loading={sending} disabled={disabled || sendDisabled || open > 0} onClick={onSend}>
            {sendLabel ?? "Looks good — send the test"}
          </Button>
          {onChange && (
            <Button type="button" variant="outline" disabled={disabled} aria-expanded={changing ?? false} onClick={onChange}>
              {changing ? "Done changing" : "Change something"}
            </Button>
          )}
          {open > 0 && <span className="text-sm text-muted-foreground">Answer the question{open > 1 ? "s" : ""} above first.</span>}
        </div>
      )}

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">Show details</summary>
        <div className="mt-2 space-y-3">
          {(state.intents ?? []).length > 0 && (
            <div>
              <p className="font-medium text-foreground">What we read in your description</p>
              <ul className="mt-1 space-y-1">
                {(state.intents ?? []).map((intent) => (
                  <li key={intent.id}>
                    &ldquo;{intent.phrase}&rdquo; → {intent.status === "left_out" ? "left out" : intent.statement}
                    {intent.autoMapped ? " (closest match)" : ""}
                    {intent.skillIds.length > 0 && <span className="font-mono"> [{intent.skillIds.join(", ")}]</span>}
                    {intent.slider > 0 && <span> · priority {intent.slider}/5</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {state.priorities.length > 0 && (
            <div>
              <p className="font-medium text-foreground">Skills and their priority (1 to 5)</p>
              <ul className="mt-1 columns-1 sm:columns-2">
                {state.priorities.map((p) => (
                  <li key={p.skillId}>
                    {skillName(p.skillId)} <span className="font-mono">({p.skillId})</span>: {p.slider}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {preview?.questions && preview.questions.length > 0 && (
            <div>
              <p className="font-medium text-foreground">Questions per skill</p>
              <ul className="mt-1 columns-1 sm:columns-2">
                {preview.questions.map((q) => (
                  <li key={q.skillId}>
                    {q.skillName}: {q.count}
                    {q.spoken > 0 ? ` (${q.spoken} spoken)` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </section>
  );
}
