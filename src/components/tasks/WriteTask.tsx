import { useState, type ReactNode } from "react";
import { CircleCheck, Mail, MessageCircle } from "lucide-react";

import { wordCount } from "@shared/tasks";

import { RichText } from "@/components/content/RichText";
import { editorScopeProps } from "@/features/proctor/editorScope";
import { inputClasses } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { TaskComponentProps } from "./types";

/**
 * Write: a short piece of writing against a word limit. The rubric's criteria are shown as a
 * checklist of what a strong answer covers — the labels only; how each is judged stays with the
 * grader. Review mode adds the sample answer and the criteria's descriptions.
 *
 * v4.1 variants change the frame, never the grading: `email` is an email composer (To and
 * Subject are for realism and are not marked; only the body is), `explain` asks for one or two
 * sentences a client would understand.
 */
export function WriteTask({ task, value, onChange, readOnly, answer, idPrefix }: TaskComponentProps<"write">) {
  const text = value?.text ?? "";
  const words = wordCount(text);
  const over = words > task.wordLimit;
  const fieldId = `${idPrefix}-write`;
  const countId = `${idPrefix}-write-count`;
  const variant = task.variant ?? "general";
  const counter = (
    <p id={countId} className={cn("mt-1 text-right font-mono text-xs tabular", over ? "text-warning-strong" : "text-muted-foreground")}>
      {words} / {task.wordLimit} words{over ? " (over the limit)" : ""}
    </p>
  );

  return (
    <div className="space-y-5">
      {task.context && (
        <figure className="rounded-md border-l-4 border-basalt/50 bg-surface-sunken/70 px-4 py-3">
          <figcaption className="mb-1.5 font-mono text-xs text-muted-foreground">
            {variant === "explain" ? "What you need to explain" : variant === "email" ? "What you are replying to" : "Context"}
          </figcaption>
          <RichText text={task.context} />
        </figure>
      )}

      {task.sourceText && (
        <figure className="rounded-md border border-trailmark/40 bg-trailmark/[0.05] px-4 py-3">
          <figcaption className="mb-1.5 font-mono text-xs text-muted-foreground">The message to rewrite</figcaption>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{task.sourceText}</p>
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

      {variant === "email" ? (
        <EmailComposer
          idPrefix={idPrefix}
          readOnly={readOnly}
          body={text}
          onBody={(body) => onChange({ kind: "write", text: body })}
          counter={counter}
          countId={countId}
        />
      ) : (
        <div {...editorScopeProps()}>
          {variant === "explain" && (
            <p className="mb-2 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/[0.06] px-3 py-2 text-sm">
              <MessageCircle className="mt-0.5 size-4 shrink-0 text-primary-strong" aria-hidden="true" />
              Explain this to the client in one or two sentences — plain words, no jargon.
            </p>
          )}
          <label htmlFor={fieldId} className="text-sm font-medium">
            {variant === "explain" ? "Your explanation" : "Your answer"}
          </label>
          <textarea
            id={fieldId}
            value={text}
            readOnly={readOnly}
            onChange={(event) => onChange({ kind: "write", text: event.target.value })}
            aria-describedby={countId}
            rows={variant === "explain" ? 4 : 9}
            className="mt-2 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm leading-relaxed read-only:opacity-90"
          />
          {counter}
        </div>
      )}

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

/** An email composer: To and Subject are presentational (kept locally, not marked); the body is the answer. */
function EmailComposer({
  idPrefix,
  readOnly,
  body,
  onBody,
  counter,
  countId,
}: {
  idPrefix: string;
  readOnly?: boolean;
  body: string;
  onBody: (body: string) => void;
  counter: ReactNode;
  countId: string;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const rowClass = "flex items-center gap-2 border-b px-3";
  const fieldClass = cn(inputClasses, "h-9 border-0 bg-transparent px-0 shadow-none focus-visible:outline-none focus-visible:ring-0");
  return (
    <div {...editorScopeProps()}>
      <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        <Mail className="size-4 text-primary-strong" aria-hidden="true" />
        Your email
      </p>
      <div className="overflow-hidden rounded-md border border-input bg-surface focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-primary-strong">
        <div className={rowClass}>
          <label htmlFor={`${idPrefix}-to`} className="w-14 shrink-0 text-xs text-muted-foreground">
            To
          </label>
          <input id={`${idPrefix}-to`} type="text" autoComplete="off" value={to} readOnly={readOnly} onChange={(e) => setTo(e.target.value)} placeholder="client@example.com" className={fieldClass} />
        </div>
        <div className={rowClass}>
          <label htmlFor={`${idPrefix}-subject`} className="w-14 shrink-0 text-xs text-muted-foreground">
            Subject
          </label>
          <input id={`${idPrefix}-subject`} type="text" autoComplete="off" value={subject} readOnly={readOnly} onChange={(e) => setSubject(e.target.value)} className={fieldClass} />
        </div>
        <label htmlFor={`${idPrefix}-write`} className="sr-only">
          Email body
        </label>
        <textarea
          id={`${idPrefix}-write`}
          value={body}
          readOnly={readOnly}
          onChange={(event) => onBody(event.target.value)}
          aria-describedby={countId}
          rows={10}
          placeholder="Hi …"
          className="block w-full resize-y bg-surface px-3 py-2.5 text-sm leading-relaxed outline-none read-only:opacity-90"
        />
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="mt-1 text-xs text-muted-foreground">Only the body is marked.</p>
        {counter}
      </div>
    </div>
  );
}
