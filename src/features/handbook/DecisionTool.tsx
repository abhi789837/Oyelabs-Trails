import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { ArrowLeft, Download, FileText, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { classify, nextQuestion, OUTCOMES, type DecisionAnswers, type DecisionOutcome, type DecisionQuestionId } from "@shared/decision";
import { LEGAL_NOTE, type HandbookEntry, type HandbookTemplate, type Rule } from "@shared/handbook";
import { handbookApi, templateDownloadUrl } from "./api";
import { answer, back, optionsFor, questionText, routeOf } from "./decisionFlow";
import { StatusChip } from "./StatusChip";
import { TermLink } from "./TermLink";

/**
 * "Bug, enhancement, change request or new feature?" One question at a time, with the route so far
 * always visible, ending in a result card whose billing line comes from the handbook rule: the
 * Oyelabs rule once an admin confirms it, otherwise the typical industry treatment, labelled so.
 */
export function DecisionTool({ request, className }: { request?: string; className?: string }) {
  const [answers, setAnswers] = useState<DecisionAnswers>({});
  const question = nextQuestion(answers);
  const outcome = classify(answers);
  const route = routeOf(answers);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Move focus to the new step so a screen reader announces it and the keyboard starts there.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [question, outcome?.classification]);

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {request && (
        <div className="border-b bg-surface-sunken px-4 py-3 sm:px-5">
          <p className="text-xs font-semibold text-muted-foreground">The client asks</p>
          <blockquote className="mt-1 text-[0.95rem] leading-relaxed">&ldquo;{request}&rdquo;</blockquote>
        </div>
      )}

      <div className="px-4 py-5 sm:px-5">
        <nav aria-label="Your answers so far" className="min-h-5">
          {route.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">Start with the first question.</p>
          ) : (
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-xs text-muted-foreground">
              {route.map((step, i) => (
                <li key={step.question} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden="true">→</span>}
                  <span>
                    {step.label} <span className="font-semibold text-foreground">{step.answer}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </nav>

        {question && (
          <QuestionStep
            key={question}
            headingRef={headingRef}
            questionId={question}
            stepNumber={route.length + 1}
            current={answers[question]}
            onAnswer={(value) => setAnswers((a) => answer(a, question, value))}
            onBack={route.length > 0 ? () => setAnswers((a) => back(a)) : undefined}
          />
        )}

        {outcome && (
          <div className="mt-5">
            <ResultCard outcome={outcome} headingRef={headingRef} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setAnswers((a) => back(a))}>
                <ArrowLeft aria-hidden="true" />
                Back
              </Button>
              <Button variant="ghost" onClick={() => setAnswers({})}>
                <RotateCcw aria-hidden="true" />
                Start over
              </Button>
            </div>
          </div>
        )}

        {question && route.length > 0 && (
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setAnswers({})}>
            <RotateCcw aria-hidden="true" />
            Start over
          </Button>
        )}
      </div>
    </div>
  );
}

function QuestionStep({
  headingRef,
  questionId,
  stepNumber,
  current,
  onAnswer,
  onBack,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  questionId: DecisionQuestionId;
  stepNumber: number;
  current?: string;
  onAnswer: (value: string) => void;
  onBack?: () => void;
}) {
  const [choice, setChoice] = useState<string | undefined>(current);
  const name = useId();
  const options = optionsFor(questionId);

  return (
    <form
      className="mt-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (choice) onAnswer(choice);
      }}
    >
      <fieldset>
        <legend className="contents">
          <span className="block font-mono text-xs text-muted-foreground">Question {stepNumber}</span>
          <h3 ref={headingRef} tabIndex={-1} className="mt-1 font-display text-lg font-semibold leading-snug focus:outline-hidden">
            {questionText(questionId)}
          </h3>
        </legend>
        <div className="mt-4 grid gap-2">
          {options.map((option) => {
            const checked = choice === option.value;
            return (
              <label
                key={option.value}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-[0.95rem] transition-colors",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-trailmark",
                  checked ? "border-primary bg-primary/8" : "bg-surface hover:bg-accent",
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={checked}
                  onChange={() => setChoice(option.value)}
                  // Double-click (or tap twice) answers straight away, for people who know the tree.
                  onDoubleClick={() => onAnswer(option.value)}
                  className="size-4 shrink-0 accent-[rgb(var(--primary))]"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-4 flex flex-wrap gap-2">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
        )}
        <Button type="submit" disabled={!choice}>
          Next
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

/** All seven billing rules, fetched together once per session. */
let rulesPromise: Promise<Map<string, Rule>> | null = null;
function loadRules(): Promise<Map<string, Rule>> {
  if (!rulesPromise) {
    const ids = [...new Set(Object.values(OUTCOMES).map((o) => o.billingRuleId))];
    rulesPromise = handbookApi
      .rules(ids)
      .then(({ rules }) => new Map(rules.map((r: HandbookEntry<"rule">) => [r.id, r.data])))
      .catch((error: unknown) => {
        rulesPromise = null;
        throw error;
      });
  }
  return rulesPromise;
}

let templatesPromise: Promise<Map<string, HandbookTemplate>> | null = null;
function loadTemplates(): Promise<Map<string, HandbookTemplate>> {
  if (!templatesPromise) {
    templatesPromise = handbookApi
      .templates()
      .then(({ templates }) => new Map(templates.map((t) => [t.id, t.data])))
      .catch((error: unknown) => {
        templatesPromise = null;
        throw error;
      });
  }
  return templatesPromise;
}

/** Tests: forget the cached rules and templates. */
export function resetDecisionCaches() {
  rulesPromise = null;
  templatesPromise = null;
}

/** What the billing line says: the confirmed Oyelabs rule, or the typical treatment. */
export function billingFor(outcome: DecisionOutcome, rule: Rule | undefined): { label: string; text: string; confirmed: boolean } {
  if (rule && rule.status === "confirmed") return { label: "Oyelabs rule", text: rule.statement, confirmed: true };
  return { label: "Typical — Oyelabs to confirm", text: outcome.typicalBilling, confirmed: false };
}

export function ResultCard({
  outcome,
  headingRef,
  initialRules,
  initialTemplates,
}: {
  outcome: DecisionOutcome;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  /** Tests and server rendering: skip the fetch. */
  initialRules?: Map<string, Rule>;
  initialTemplates?: Map<string, HandbookTemplate>;
}) {
  const [rules, setRules] = useState<Map<string, Rule> | null>(initialRules ?? null);
  const [templates, setTemplates] = useState<Map<string, HandbookTemplate> | null>(initialTemplates ?? null);

  useEffect(() => {
    let live = true;
    if (!initialRules) {
      loadRules()
        .then((r) => live && setRules(r))
        .catch(() => live && setRules(new Map()));
    }
    if (!initialTemplates && outcome.templateId) {
      loadTemplates()
        .then((t) => live && setTemplates(t))
        .catch(() => live && setTemplates(new Map()));
    }
    return () => {
      live = false;
    };
  }, [initialRules, initialTemplates, outcome.templateId]);

  const rule = rules?.get(outcome.billingRuleId);
  const billing = billingFor(outcome, rule);
  const template = outcome.templateId ? templates?.get(outcome.templateId) : undefined;
  const templateName = template?.name ?? outcome.templateId?.replace(/-/g, " ");

  return (
    <section aria-live="polite" className="rounded-md border-2 border-primary/40 bg-primary/5 px-4 py-4 sm:px-5" data-classification={outcome.classification}>
      <p className="font-mono text-xs text-muted-foreground">Result</p>
      <h3 ref={headingRef} tabIndex={-1} className="mt-0.5 font-display text-xl font-bold focus:outline-hidden">
        {outcome.label}
      </h3>
      <p className="mt-1 text-sm">
        Handbook term: <TermLink id={outcome.termId} />
      </p>

      <dl className="mt-4 space-y-4 text-[0.95rem] leading-relaxed">
        <div>
          <dt className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
            Billing
            <span className={cn("rounded-sm border px-1.5 py-px font-medium", billing.confirmed ? "border-summit/50 bg-summit/10 text-summit-strong" : "border-trailmark/50 bg-trailmark/10 text-trailmark-strong")}>
              {billing.label}
            </span>
          </dt>
          <dd className="mt-1">{rules === null ? <span className="text-muted-foreground">Loading the billing rule…</span> : billing.text}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">Next step</dt>
          <dd className="mt-1">{outcome.nextStep}</dd>
        </div>
        {outcome.templateId && (
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">Template</dt>
            <dd className="mt-1">
              <span className="flex flex-wrap items-center gap-2">
                <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium">{templateName}</span>
                {template && <StatusChip status={template.status} />}
              </span>
              <span className="mt-2 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={templateDownloadUrl(outcome.templateId, "blank")} download>
                    <Download aria-hidden="true" />
                    Blank<span className="sr-only"> {templateName}</span>
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={templateDownloadUrl(outcome.templateId, "filled")} download>
                    <Download aria-hidden="true" />
                    Filled example<span className="sr-only"> of {templateName}</span>
                  </a>
                </Button>
              </span>
            </dd>
          </div>
        )}
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">{LEGAL_NOTE}</p>
    </section>
  );
}
