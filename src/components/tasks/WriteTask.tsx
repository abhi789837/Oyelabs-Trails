import { CircleCheck } from "lucide-react";

import { wordCount } from "@shared/tasks";

import { RichText } from "@/components/content/RichText";
import { editorScopeProps } from "@/features/proctor/editorScope";
import { cn } from "@/lib/utils";

import type { TaskComponentProps } from "./types";

/**
 * Write: a short piece of writing against a word limit. The rubric's criteria are shown as a
 * checklist of what a strong answer covers — the labels only; how each is judged stays with the
 * grader. Review mode adds the sample answer and the criteria's descriptions.
 */
export function WriteTask({ task, value, onChange, readOnly, answer, idPrefix }: TaskComponentProps<"write">) {
  const text = value?.text ?? "";
  const words = wordCount(text);
  const over = words > task.wordLimit;
  const fieldId = `${idPrefix}-write`;
  const countId = `${idPrefix}-write-count`;

  return (
    <div className="space-y-5">
      {task.context && (
        <figure className="rounded-md border-l-4 border-basalt/50 bg-surface-sunken/70 px-4 py-3">
          <figcaption className="mb-1.5 font-mono text-xs text-muted-foreground">Context</figcaption>
          <RichText text={task.context} />
        </figure>
      )}

      <div>
        <p className="text-sm font-medium">A strong answer covers</p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {task.rubric.map((criterion) => (
            <li key={criterion.label} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-summit-strong" aria-hidden="true" />
              {criterion.label}
            </li>
          ))}
        </ul>
      </div>

      <div {...editorScopeProps()}>
        <label htmlFor={fieldId} className="text-sm font-medium">
          Your answer
        </label>
        <textarea
          id={fieldId}
          value={text}
          readOnly={readOnly}
          onChange={(event) => onChange({ kind: "write", text: event.target.value })}
          aria-describedby={countId}
          rows={9}
          className="mt-2 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm leading-relaxed read-only:opacity-90"
        />
        <p
          id={countId}
          className={cn("mt-1 text-right font-mono text-xs tabular", over ? "text-warning-strong" : "text-muted-foreground")}
        >
          {words} / {task.wordLimit} words{over ? " (over the limit)" : ""}
        </p>
      </div>

      {answer && (
        <div className="space-y-4 rounded-md border border-summit/40 bg-summit/[0.05] px-4 py-4">
          {answer.sampleAnswer && (
            <div>
              <p className="text-sm font-semibold">A sample answer</p>
              <RichText text={answer.sampleAnswer} className="mt-1.5" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold">How it is judged</p>
            <dl className="mt-1.5 space-y-2 text-sm">
              {answer.rubric.map((criterion) => (
                <div key={criterion.id}>
                  <dt className="font-medium">{criterion.label}</dt>
                  <dd className="text-muted-foreground">{criterion.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
