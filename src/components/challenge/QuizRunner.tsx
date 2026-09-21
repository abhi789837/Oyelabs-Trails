import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check, Minus, X } from "lucide-react";

import { InlineText, RichText } from "@/components/content/RichText";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { seededOrder } from "@/lib/shuffle";
import { cn, preferredScrollBehavior } from "@/lib/utils";
import { QUIZ_PASS_THRESHOLD, useProgressStore } from "@/store/progressStore";
import type { QuizQuestion, Topic } from "@/types/curriculum";
import { ChallengeResult } from "./ChallengeResult";

type Answer = number | number[];

const isMulti = (q: QuizQuestion) => Array.isArray(q.correctIndices) && q.correctIndices.length > 1;

/** Single-select: the chosen option. Multi-select: exactly the set of correct options (all-or-nothing). */
export function isCorrect(q: QuizQuestion, answer: Answer | undefined): boolean {
  if (answer === undefined) return false;
  if (isMulti(q)) {
    const chosen = new Set(answer as number[]);
    const correct = q.correctIndices!;
    return chosen.size === correct.length && correct.every((i) => chosen.has(i));
  }
  return answer === q.correctIndex;
}

function isAnswered(q: QuizQuestion, answer: Answer | undefined): boolean {
  return isMulti(q) ? Array.isArray(answer) && answer.length > 0 : answer !== undefined;
}

export function QuizRunner({ topic, questions }: { topic: Topic; questions: QuizQuestion[] }) {
  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitted, setSubmitted] = useState(false);
  // Each retry reshuffles the options so answers aren't remembered by position.
  const [round, setRound] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const orders = useMemo(
    () => Object.fromEntries(questions.map((q) => [q.id, seededOrder(q.options.length, `${q.id}:${round}`)])),
    [questions, round],
  );

  const answeredCount = questions.filter((q) => isAnswered(q, answers[q.id])).length;
  const correctCount = questions.filter((q) => isCorrect(q, answers[q.id])).length;
  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= QUIZ_PASS_THRESHOLD;

  const toggle = (q: QuizQuestion, optionIndex: number) =>
    setAnswers((a) => {
      const current = new Set((a[q.id] as number[] | undefined) ?? []);
      if (current.has(optionIndex)) current.delete(optionIndex);
      else current.add(optionIndex);
      return { ...a, [q.id]: [...current] };
    });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (answeredCount < questions.length || submitted) return;
    setSubmitted(true);
    recordAttempt(topic.id, passed, score);
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "center" });
      resultRef.current?.focus({ preventScroll: true });
    });
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
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
          {questions.map((q, qi) => {
            const multi = isMulti(q);
            const answer = answers[q.id];
            const correct = isCorrect(q, answer);
            const correctSet = new Set(multi ? q.correctIndices : [q.correctIndex]);
            const chosenSet = new Set(multi ? ((answer as number[] | undefined) ?? []) : answer === undefined ? [] : [answer as number]);
            const legendId = `${q.id}-legend`;
            return (
              <li key={q.id}>
                <fieldset disabled={submitted} aria-labelledby={legendId}>
                  <div id={legendId} className="flex gap-3">
                    <span className="pt-px font-mono text-sm text-muted-foreground tabular">{qi + 1}.</span>
                    <div className="min-w-0 flex-1">
                      {(multi || q.isEdgeCaseOrInterviewQuestion) && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {multi && <span className="rounded-sm bg-foreground/10 px-1.5 py-0.5 font-mono text-[11px]">Select all that apply</span>}
                          {q.isEdgeCaseOrInterviewQuestion && (
                            <span className="rounded-sm border border-trailmark/40 px-1.5 py-0.5 font-mono text-[11px] text-trailmark-strong">
                              Interview-level
                            </span>
                          )}
                        </div>
                      )}
                      <RichText text={q.prompt} size="base" className="font-medium" />
                    </div>
                  </div>

                  <div className="mt-3 sm:pl-7">
                    {multi ? (
                      <div className="grid gap-2" role="group" aria-labelledby={legendId}>
                        {orders[q.id].map((optionIndex) => (
                          <OptionRow
                            key={optionIndex}
                            id={`${q.id}-opt-${optionIndex}`}
                            text={q.options[optionIndex]}
                            selected={chosenSet.has(optionIndex)}
                            submitted={submitted}
                            isCorrectOption={correctSet.has(optionIndex)}
                            control={
                              <input
                                type="checkbox"
                                id={`${q.id}-opt-${optionIndex}`}
                                checked={chosenSet.has(optionIndex)}
                                onChange={() => toggle(q, optionIndex)}
                                className="mt-[3px] h-4 w-4 shrink-0 accent-trailmark"
                              />
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <RadioGroup
                        value={answer === undefined ? "" : String(answer)}
                        onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: Number(v) }))}
                        className="gap-2"
                        aria-labelledby={legendId}
                      >
                        {orders[q.id].map((optionIndex) => (
                          <OptionRow
                            key={optionIndex}
                            id={`${q.id}-opt-${optionIndex}`}
                            text={q.options[optionIndex]}
                            selected={chosenSet.has(optionIndex)}
                            submitted={submitted}
                            isCorrectOption={correctSet.has(optionIndex)}
                            control={<RadioGroupItem value={String(optionIndex)} id={`${q.id}-opt-${optionIndex}`} className="mt-[3px]" />}
                          />
                        ))}
                      </RadioGroup>
                    )}

                    {submitted && (
                      <div className={cn("mt-3 flex gap-2 text-sm", correct ? "text-summit-strong" : "text-foreground")}>
                        <span className="shrink-0 font-medium">{correct ? "Correct." : "Incorrect."}</span>
                        <span className="text-muted-foreground">
                          <InlineText text={q.explanation} />
                        </span>
                      </div>
                    )}
                  </div>
                </fieldset>
              </li>
            );
          })}
        </ol>

        {!submitted && (
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={answeredCount < questions.length}>
              Submit answers
            </Button>
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {answeredCount < questions.length
                ? `${answeredCount} of ${questions.length} answered. Answer every question to submit.`
                : "All questions answered."}
            </span>
          </div>
        )}
      </form>

      {submitted && (
        <div className="mt-8">
          <ChallengeResult
            ref={resultRef}
            topic={topic}
            passed={passed}
            score={score}
            detail={`${correctCount} of ${questions.length} correct`}
            retryLabel="Retake the quiz"
            onRetry={handleRetry}
          />
        </div>
      )}
    </div>
  );
}

function OptionRow({
  id,
  text,
  selected,
  submitted,
  isCorrectOption,
  control,
}: {
  id: string;
  text: string;
  selected: boolean;
  submitted: boolean;
  isCorrectOption: boolean;
  control: ReactNode;
}) {
  const markCorrect = submitted && isCorrectOption;
  const markWrong = submitted && selected && !isCorrectOption;
  const missed = markCorrect && !selected;
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-md border px-3 py-2.5 transition-colors",
        !submitted && "hover:border-foreground/30 hover:bg-surface",
        !submitted && selected && "border-foreground/50 bg-surface",
        markCorrect && (missed ? "border-trailmark/60 bg-trailmark/10" : "border-summit/60 bg-summit/10"),
        markWrong && "border-destructive/60 bg-destructive/10",
      )}
    >
      {control}
      {/* The label's ::after stretches over the whole row, so the row is the click target. */}
      <label htmlFor={id} className={cn("flex-1 text-sm leading-snug after:absolute after:inset-0", !submitted && "cursor-pointer")}>
        <InlineText text={text} />
      </label>
      {markCorrect && (
        <span className={cn("flex shrink-0 items-center gap-1 text-xs font-medium", missed ? "text-trailmark-strong" : "text-summit-strong")}>
          {missed ? <Minus className="h-3.5 w-3.5" aria-hidden="true" /> : <Check className="h-3.5 w-3.5" aria-hidden="true" />}
          {missed ? "Missed: this one was correct" : selected ? "Your answer, correct" : "Correct answer"}
        </span>
      )}
      {markWrong && (
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-destructive">
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Your answer
        </span>
      )}
    </div>
  );
}
