import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check, LoaderCircle, Minus, X } from "lucide-react";

import type { QuizAttemptResult, QuizQuestionResult, ServedQuizQuestion, ServedTopic } from "@shared/content";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { InlineText, RichText } from "@/components/content/RichText";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { submitAttempt } from "@/features/challenge/api";
import { seededOrder } from "@/lib/shuffle";
import { cn, preferredScrollBehavior } from "@/lib/utils";
import { useProgressStore } from "@/store/progressStore";
import { ChallengeResult } from "./ChallengeResult";

type Answer = number[];

/**
 * The quiz.
 *
 * From v3 the answer key is never in the browser: options arrive without it, the learner's
 * choices go to the server as *original* option indices, and the server returns the score plus
 * the per-question key so the explanations can be shown afterwards (brief §7.4).
 *
 * The seeded shuffle stays client-side. It only affects display order, and reshuffling on every
 * retry is what stops answers being memorised by position.
 */
export function QuizRunner({ topic, questions }: { topic: ServedTopic; questions: ServedQuizQuestion[] }) {
  const applyAttempt = useProgressStore((s) => s.applyAttempt);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const orders = useMemo(
    () => Object.fromEntries(questions.map((q) => [q.id, seededOrder(q.options.length, `${q.id}:${round}`)])),
    [questions, round],
  );

  const resultsById = useMemo(() => {
    const map = new Map<string, QuizQuestionResult>();
    for (const entry of result?.perQuestion ?? []) map.set(entry.id, entry);
    return map;
  }, [result]);

  const answeredCount = questions.filter((q) => (answers[q.id]?.length ?? 0) > 0).length;
  const submitted = result !== null;

  const toggle = (question: ServedQuizQuestion, optionIndex: number) =>
    setAnswers((current) => {
      if (!question.multi) return { ...current, [question.id]: [optionIndex] };
      const chosen = new Set(current[question.id] ?? []);
      if (chosen.has(optionIndex)) chosen.delete(optionIndex);
      else chosen.add(optionIndex);
      return { ...current, [question.id]: [...chosen] };
    });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || submitted || answeredCount < questions.length) return;
    setSubmitting(true);
    setError(null);
    try {
      const graded = await submitAttempt(topic.id, { kind: "quiz", answers });
      if (graded.kind !== "quiz") throw new Error("The server graded this as a coding challenge.");
      setResult(graded);
      applyAttempt(topic.id, graded);
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "center" });
        resultRef.current?.focus({ preventScroll: true });
      });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Your answers couldn't be submitted. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setError(null);
    setRound((r) => r + 1);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "start" });
      formRef.current?.querySelector<HTMLElement>('button[role="radio"], input[type="checkbox"]')?.focus({ preventScroll: true });
    });
  };

  return (
    <div>
      <form ref={formRef} onSubmit={handleSubmit} className="scroll-mt-24" noValidate>
        <ol className="space-y-10">
          {questions.map((question, questionIndex) => {
            const answer = answers[question.id] ?? [];
            const graded = resultsById.get(question.id);
            const correctSet = new Set(graded?.correctIndices ?? []);
            const chosenSet = new Set(answer);
            const legendId = `${question.id}-legend`;
            const order = orders[question.id] ?? question.options.map((_, i) => i);

            return (
              <li key={question.id} className="scroll-mt-24">
                <fieldset>
                  <legend id={legendId} className="w-full">
                    <span className="flex items-baseline gap-2 font-mono text-xs text-muted-foreground">
                      <span>
                        Question {questionIndex + 1} of {questions.length}
                      </span>
                      {question.multi && <span className="text-trailmark-strong">Select all that apply</span>}
                      {graded && (
                        <span className={graded.correct ? "text-summit-strong" : "text-destructive"}>
                          {graded.correct ? "Correct" : "Incorrect"}
                        </span>
                      )}
                    </span>
                    <RichText text={question.prompt} className="mt-2 font-medium" />
                  </legend>

                  <div className="mt-4">
                    {question.multi ? (
                      <div className="space-y-2" role="group" aria-labelledby={legendId}>
                        {order.map((optionIndex) => (
                          <OptionRow
                            key={optionIndex}
                            submitted={submitted}
                            chosen={chosenSet.has(optionIndex)}
                            correct={correctSet.has(optionIndex)}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--trailmark))]"
                              checked={chosenSet.has(optionIndex)}
                              disabled={submitted}
                              onChange={() => toggle(question, optionIndex)}
                            />
                            <span className="min-w-0">
                              <InlineText text={question.options[optionIndex]} />
                            </span>
                          </OptionRow>
                        ))}
                      </div>
                    ) : (
                      <RadioGroup
                        aria-labelledby={legendId}
                        value={answer[0] === undefined ? "" : String(answer[0])}
                        onValueChange={(value) => toggle(question, Number(value))}
                        disabled={submitted}
                        className="space-y-2"
                      >
                        {order.map((optionIndex) => (
                          <OptionRow
                            key={optionIndex}
                            submitted={submitted}
                            chosen={chosenSet.has(optionIndex)}
                            correct={correctSet.has(optionIndex)}
                          >
                            <RadioGroupItem value={String(optionIndex)} id={`${question.id}-${optionIndex}`} className="mt-0.5 shrink-0" />
                            <span className="min-w-0">
                              <InlineText text={question.options[optionIndex]} />
                            </span>
                          </OptionRow>
                        ))}
                      </RadioGroup>
                    )}
                  </div>

                  {graded && (
                    <div className="mt-3 rounded-md border-l-2 border-basalt/40 bg-surface-sunken/40 px-3 py-2">
                      <RichText text={graded.explanation} className="text-sm text-muted-foreground" />
                    </div>
                  )}
                </fieldset>
              </li>
            );
          })}
        </ol>

        {error && <div className="mt-8"><FormAlert>{error}</FormAlert></div>}

        {!submitted && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={submitting || answeredCount < questions.length}>
              {submitting && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              {submitting ? "Checking…" : "Submit answers"}
            </Button>
            <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
              {answeredCount} of {questions.length} answered
            </p>
          </div>
        )}
      </form>

      {result && (
        <ChallengeResult
          ref={resultRef}
          className="mt-10"
          topic={topic}
          passed={result.passed}
          score={result.score}
          detail={`${result.correctCount} of ${result.total} correct`}
          onRetry={handleRetry}
          retryLabel="Try again"
        />
      )}
    </div>
  );
}

function OptionRow({
  submitted,
  chosen,
  correct,
  children,
}: {
  submitted: boolean;
  chosen: boolean;
  correct: boolean;
  children: ReactNode;
}) {
  const state = !submitted ? "open" : correct ? "correct" : chosen ? "wrong" : "neutral";

  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors",
        state === "open" && "hover:bg-surface-sunken/60",
        state === "correct" && "border-summit/60 bg-summit/[0.08]",
        state === "wrong" && "border-destructive/60 bg-destructive/[0.06]",
        state === "neutral" && "opacity-70",
        submitted && "cursor-default",
      )}
    >
      {children}
      {submitted && (
        <span className="ml-auto shrink-0 pl-2">
          {correct ? (
            <Check className="h-4 w-4 text-summit-strong" aria-label="Correct answer" />
          ) : chosen ? (
            <X className="h-4 w-4 text-destructive" aria-label="Your answer, incorrect" />
          ) : (
            <Minus className="h-4 w-4 text-transparent" aria-hidden="true" />
          )}
        </span>
      )}
    </label>
  );
}
