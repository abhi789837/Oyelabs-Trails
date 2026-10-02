import { InlineText } from "@/components/content/RichText";

import { ChoiceCard } from "./ChoiceCard";
import type { TaskComponentProps } from "./types";

/**
 * Scenario: the case (the task prompt, rendered by the caller), then 2–3 linked decisions, each a
 * radio group of option cards. Each later step assumes the case as written, not the learner's
 * earlier pick — so a wrong first call does not cascade.
 */
export function ScenarioTask({ task, value, onChange, readOnly, answer, idPrefix }: TaskComponentProps<"scenario">) {
  const choices = value?.choices ?? {};

  return (
    <div className="space-y-7">
      {task.steps.map((step, stepIndex) => {
        const correct = answer?.steps.find((s) => s.id === step.id);
        return (
          <fieldset key={step.id}>
            <legend className="text-sm font-semibold">
              <span className="mr-2 font-mono text-xs text-muted-foreground">Decision {stepIndex + 1}</span>
              <InlineText text={step.question} />
            </legend>
            <div className="mt-3 space-y-2">
              {step.options.map((option, optionIndex) => (
                <ChoiceCard
                  key={optionIndex}
                  name={`${idPrefix}-${step.id}`}
                  id={`${idPrefix}-${step.id}-${optionIndex}`}
                  checked={choices[step.id] === optionIndex}
                  disabled={readOnly}
                  text={option}
                  review={
                    correct
                      ? correct.correctIndex === optionIndex
                        ? "correct"
                        : choices[step.id] === optionIndex
                          ? "wrong"
                          : null
                      : null
                  }
                  onSelect={() => onChange({ kind: "scenario", choices: { ...choices, [step.id]: optionIndex } })}
                />
              ))}
            </div>
            {correct?.explanation && <p className="mt-2 text-sm text-muted-foreground">{correct.explanation}</p>}
          </fieldset>
        );
      })}
    </div>
  );
}
