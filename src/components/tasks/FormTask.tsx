import { Check, Download, FileText, Mail, MessagesSquare, Table2, X } from "lucide-react";

import { formCheckPasses, type FormVariant } from "@shared/tasks";

import { RichText } from "@/components/content/RichText";
import { inputClasses } from "@/components/ui/input";
import { editorScopeProps } from "@/features/proctor/editorScope";
import { templateDownloadUrl } from "@/features/handbook/api";
import { cn } from "@/lib/utils";

import type { LearnerTaskOf, TaskComponentProps } from "./types";

const CONTEXT_FRAME: Record<FormVariant, { title: string; icon: typeof Mail }> = {
  cr: { title: "The client's email", icon: Mail },
  mom: { title: "Meeting transcript", icon: MessagesSquare },
  status: { title: "Board export", icon: Table2 },
  template: { title: "What you have to go on", icon: FileText },
};

const FORM_TITLE: Record<FormVariant, string> = {
  cr: "Change request",
  mom: "Minutes of meeting",
  status: "Status report",
  template: "Template",
};

/**
 * Fill the form: the context (an email, a transcript, a board export) as a styled panel, then the
 * labelled fields. Fields marked "exact" are checked by code; the rest are judged against the
 * rubric. Review mode shows the sample answer under each field and each exact check's result.
 */
export function FormTask({ task, value, onChange, readOnly, answer, idPrefix }: TaskComponentProps<"form">) {
  const values = value?.values ?? {};
  const exact = new Set(task.checks.map((c) => c.fieldId));
  const set = (fieldId: string, next: string) => {
    if (readOnly) return;
    onChange({ kind: "form", values: { ...values, [fieldId]: next } });
  };
  const frame = CONTEXT_FRAME[task.variant];

  return (
    <div className="space-y-5">
      {task.context.trim() && (
        <figure className={cn("overflow-hidden rounded-md border bg-surface-sunken/70", task.variant === "cr" && "border-l-4 border-l-basalt/50")}>
          <figcaption className="flex items-center gap-1.5 border-b px-4 py-2 font-mono text-xs text-muted-foreground">
            <frame.icon className="size-3.5" aria-hidden="true" />
            {frame.title}
          </figcaption>
          <div className="px-4 py-3">
            <ContextBody text={task.context} />
          </div>
        </figure>
      )}

      <div>
        <p className="text-sm font-medium">A strong answer covers</p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {task.rubric.map((criterion) => (
            <li key={criterion.label} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-summit-strong" aria-hidden="true" />
              {criterion.label}
            </li>
          ))}
        </ul>
      </div>

      <section aria-labelledby={`${idPrefix}-form-title`} className="rounded-md border bg-surface" {...editorScopeProps()}>
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
          <h3 id={`${idPrefix}-form-title`} className="text-sm font-semibold">
            {FORM_TITLE[task.variant]}
          </h3>
          {task.templateId && (
            <a
              href={templateDownloadUrl(task.templateId, "blank")}
              download
              className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-primary-strong underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
            >
              <Download className="size-3.5" aria-hidden="true" />
              Blank template
            </a>
          )}
        </header>
        <div className="space-y-4 px-4 py-4">
          {task.fields.map((field) => {
            const check = answer?.checks.find((c) => c.fieldId === field.id);
            const passed = check ? formCheckPasses(check, values[field.id]) : null;
            const sample = answer?.sampleAnswer[field.id];
            return (
              <FormField
                key={field.id}
                field={field}
                id={`${idPrefix}-f-${field.id}`}
                value={values[field.id] ?? ""}
                onChange={(next) => set(field.id, next)}
                readOnly={readOnly}
                exact={exact.has(field.id)}
                review={answer ? { passed, expected: check ? String(check.expected) : null, sample: sample ?? null } : null}
              />
            );
          })}
        </div>
      </section>

      {answer && (
        <div className="rounded-md border border-summit/40 bg-summit/[0.05] px-4 py-4">
          <p className="text-sm font-semibold">How the rest is judged</p>
          <dl className="mt-1.5 space-y-2 text-sm">
            {answer.rubric.map((criterion) => (
              <div key={criterion.label}>
                <dt className="font-medium">
                  {criterion.label} <span className="font-mono text-xs font-normal text-muted-foreground">{criterion.points} pt</span>
                </dt>
                {criterion.description && <dd className="text-muted-foreground">{criterion.description}</dd>}
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function FormField({
  field,
  id,
  value,
  onChange,
  readOnly,
  exact,
  review,
}: {
  field: LearnerTaskOf<"form">["fields"][number];
  id: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  exact: boolean;
  review: { passed: boolean | null; expected: string | null; sample: string | null } | null;
}) {
  const hintId = `${id}-hint`;
  const invalid = review?.passed === false;
  const common = {
    id,
    value,
    readOnly,
    required: field.required,
    "aria-describedby": exact || review ? hintId : undefined,
    "aria-invalid": invalid || undefined,
  };
  return (
    <div>
      <label htmlFor={id} className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium">
        {field.label}
        {field.required && <span className="text-xs font-normal text-muted-foreground">required</span>}
        {exact && <span className="rounded border px-1 font-mono text-[11px] font-normal text-muted-foreground">exact</span>}
      </label>
      <div className="mt-1.5">
        {field.input === "textarea" ? (
          <textarea {...common} rows={4} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm leading-relaxed read-only:opacity-90 aria-[invalid=true]:border-destructive" />
        ) : field.input === "select" ? (
          <select {...common} disabled={readOnly} onChange={(e) => onChange(e.target.value)} className={cn(inputClasses, "pr-8")}>
            <option value="">Choose…</option>
            {(field.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            {...common}
            type={field.input === "date" ? "date" : "text"}
            inputMode={field.input === "number" ? "decimal" : undefined}
            autoComplete="off"
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={cn(inputClasses, "read-only:opacity-90", field.input === "number" && "tabular max-w-48")}
          />
        )}
      </div>
      {(exact || review) && (
        <div id={hintId} className="mt-1.5 space-y-1 text-xs">
          {review?.passed === true && (
            <p className="flex items-center gap-1 font-medium text-summit-strong">
              <Check className="size-3.5" aria-hidden="true" />
              Correct
            </p>
          )}
          {review?.passed === false && (
            <p className="flex items-center gap-1 font-medium text-destructive">
              <X className="size-3.5" aria-hidden="true" />
              Expected {review.expected}
            </p>
          )}
          {!review && exact && <p className="text-muted-foreground">Checked exactly.</p>}
          {review?.sample && review.passed === null && (
            <div className="rounded border border-summit/30 bg-summit/[0.05] px-2.5 py-1.5 text-sm">
              <span className="font-mono text-[11px] text-muted-foreground">Sample</span>
              <RichText text={review.sample} className="mt-0.5" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Markdown with pipe tables (a board export) as real tables; everything else through RichText. */
function ContextBody({ text }: { text: string }) {
  const parts: { kind: "text" | "table"; lines: string[] }[] = [];
  for (const line of text.split("\n")) {
    const kind = /^\s*\|.*\|\s*$/.test(line) ? "table" : "text";
    const last = parts[parts.length - 1];
    if (last && last.kind === kind) last.lines.push(line);
    else parts.push({ kind, lines: [line] });
  }
  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        if (part.kind === "text") return part.lines.join("\n").trim() ? <RichText key={i} text={part.lines.join("\n")} /> : null;
        const rows = part.lines
          .map((l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()))
          .filter((cells) => !cells.every((c) => /^:?-{2,}:?$/.test(c)));
        const [head, ...body] = rows;
        if (!head) return null;
        return (
          <div key={i} className="overflow-x-auto rounded border bg-surface">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-surface-sunken/60 text-left">
                  {head.map((cell, c) => (
                    <th key={c} scope="col" className="px-2.5 py-1.5 font-semibold whitespace-nowrap">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, r) => (
                  <tr key={r} className="border-b last:border-0">
                    {row.map((cell, c) => (
                      <td key={c} className="px-2.5 py-1.5 tabular">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
