import { useState } from "react";
import { Check, Compass, RotateCcw, X } from "lucide-react";

import { classify, DECISION_OPTIONS, DECISION_QUESTIONS, nextQuestion, type DecisionAnswers, type DecisionQuestionId } from "@shared/decision";

import { InlineText } from "@/components/content/RichText";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";

import type { TaskComponentProps } from "./types";

/**
 * Categorise: one card per item with a segmented picker of the categories (a radio group: arrow
 * keys move, wraps on a phone). A classify-the-request task adds "Use the decision tool" per item:
 * the handbook's decision questions inline, which fill the pick when they reach an answer. Review
 * mode marks each card right or wrong with its explanation.
 */
export function CategorizeTask({ task, value, onChange, readOnly, answer, idPrefix }: TaskComponentProps<"categorize">) {
  const picks = value?.picks ?? {};
  const label = new Map(task.categories.map((c) => [c.id, c.label]));
  const options = task.categories.map((c) => ({ value: c.id, label: c.label }));
  const pick = (itemId: string, categoryId: string) => {
    if (readOnly) return;
    onChange({ kind: "categorize", picks: { ...picks, [itemId]: categoryId } });
  };
  const done = task.items.filter((i) => picks[i.id]).length;

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
        {done} of {task.items.length} sorted
      </p>
      <ol className="space-y-3">
        {task.items.map((item, index) => {
          const expected = answer?.answer[item.id];
          const explanation = answer?.items.find((i) => i.id === item.id)?.explanation;
          const picked = picks[item.id] ?? null;
          const review = answer ? (picked === expected ? "correct" : "wrong") : null;
          const labelId = `${idPrefix}-cat-${item.id}`;
          return (
            <li
              key={item.id}
              className={cn(
                "rounded-md border px-4 py-3.5",
                review === "correct" ? "border-summit bg-summit/[0.06]" : review === "wrong" ? "border-destructive/70 bg-destructive/[0.04]" : "border-border bg-surface",
              )}
            >
              <p id={labelId} className="text-sm">
                <span className="mr-2 font-mono text-xs text-muted-foreground">{index + 1}</span>
                <InlineText text={item.text} />
              </p>
              <Segmented
                labelledBy={labelId}
                options={options}
                value={picked}
                onChange={(next) => pick(item.id, next)}
                disabled={readOnly}
                size="sm"
                className="mt-3"
              />
              {task.mode === "classify-request" && !readOnly && (
                <DecisionHelper categories={task.categories.map((c) => c.id)} onPick={(id) => pick(item.id, id)} idPrefix={`${idPrefix}-dt-${item.id}`} />
              )}
              {review && (
                <div className="mt-3 text-sm">
                  <p className={cn("flex items-center gap-1.5 font-medium", review === "correct" ? "text-summit-strong" : "text-destructive")}>
                    {review === "correct" ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
                    {review === "correct"
                      ? "Correct"
                      : `It's ${label.get(expected ?? "") ?? expected}${picked ? `, not ${label.get(picked) ?? picked}` : "; nothing was picked"}`}
                  </p>
                  {explanation && <p className="mt-1 text-muted-foreground">{explanation}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * The decision tool, inline and small: one question at a time with its options as buttons. When
 * the answers decide it, the classification fills the pick if it is one of this task's categories.
 */
function DecisionHelper({ categories, onPick, idPrefix }: { categories: readonly string[]; onPick: (categoryId: string) => void; idPrefix: string }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<DecisionAnswers>({});
  const question = nextQuestion(answers);
  const outcome = classify(answers);
  const offered = outcome ? categories.includes(outcome.classification) : false;

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" className="mt-2 -ml-2 text-muted-foreground" onClick={() => setOpen(true)} aria-expanded={false}>
        <Compass aria-hidden="true" />
        Use the decision tool
      </Button>
    );
  }

  const answer = (q: DecisionQuestionId, v: string) => {
    const next = { ...answers, [q]: v } as DecisionAnswers;
    setAnswers(next);
    const result = classify(next);
    if (result && categories.includes(result.classification)) onPick(result.classification);
  };

  return (
    <div className="mt-3 rounded-md border border-dashed border-border bg-surface-sunken/60 px-3 py-3" role="group" aria-labelledby={`${idPrefix}-title`}>
      <div className="flex items-center justify-between gap-2">
        <p id={`${idPrefix}-title`} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Compass className="size-3.5" aria-hidden="true" />
          Decision tool
        </p>
        <div className="flex gap-1">
          {Object.keys(answers).length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setAnswers({})}>
              <RotateCcw aria-hidden="true" />
              Start over
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} aria-expanded>
            Close
          </Button>
        </div>
      </div>
      {question ? (
        <fieldset className="mt-2">
          <legend className="text-sm font-medium">{DECISION_QUESTIONS[question]}</legend>
          <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
            {DECISION_OPTIONS[question].map((option) => (
              <Button key={option.value} type="button" variant="outline" size="sm" className="h-auto justify-start py-1.5 text-left whitespace-normal" onClick={() => answer(question, option.value)}>
                {option.label}
              </Button>
            ))}
          </div>
        </fieldset>
      ) : outcome ? (
        <p className="mt-2 text-sm" role="status">
          <span className="font-medium">{outcome.label}.</span>{" "}
          {offered ? <span className="text-muted-foreground">Picked for you; change it if you disagree.</span> : <span className="text-muted-foreground">That is not one of the options here, so pick the closest.</span>}
        </p>
      ) : null}
    </div>
  );
}
