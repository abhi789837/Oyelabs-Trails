import { useMemo, useRef, useState, type FormEvent } from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { seededOrder } from "@/lib/shuffle";
import { cn, preferredScrollBehavior } from "@/lib/utils";
import { QUIZ_PASS_THRESHOLD, useProgressStore } from "@/store/progressStore";
import type { QuizQuestion, Topic } from "@/types/curriculum-v1";
import { ChallengeResult } from "./ChallengeResult";

interface QuizRunnerProps {
  topic: Topic;
  questions: QuizQuestion[];
}

export function QuizRunner({ topic, questions }: QuizRunnerProps) {
  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  // Each retry reshuffles the options so the answer isn't remembered by position.
  const [round, setRound] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const orders = useMemo(
    () => Object.fromEntries(questions.map((q) => [q.id, seededOrder(q.options.length, `${q.id}:${round}`)])),
    [questions, round],
  );

  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
  const correctCount = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= QUIZ_PASS_THRESHOLD;

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
      formRef.current?.querySelector<HTMLButtonElement>('button[role="radio"]')?.focus({ preventScroll: true });
    });
  };

  return (
    <div>
      <form ref={formRef} onSubmit={handleSubmit} className="scroll-mt-24" noValidate>
        <ol className="space-y-8">
          {questions.map((q, qi) => {
            const chosen = answers[q.id];
            const isCorrect = chosen === q.correctIndex;
            return (
              <li key={q.id}>
                <fieldset disabled={submitted}>
                  <legend className="flex gap-3 font-medium leading-snug">
                    <span className="font-mono text-sm text-muted-foreground tabular">{qi + 1}.</span>
                    <span>{q.prompt}</span>
                  </legend>

                  <RadioGroup
                    value={chosen === undefined ? "" : String(chosen)}
                    onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: Number(v) }))}
                    className="mt-3 gap-2 pl-0 sm:pl-7"
                    aria-label={q.prompt}
                  >
                    {orders[q.id].map((optionIndex) => {
                      const id = `${q.id}-opt-${optionIndex}`;
                      const selected = chosen === optionIndex;
                      const showCorrect = submitted && optionIndex === q.correctIndex;
                      const showWrong = submitted && selected && !isCorrect;
                      return (
                        <div
                          key={optionIndex}
                          className={cn(
                            "relative flex items-start gap-3 rounded-md border px-3 py-2.5 transition-colors",
                            !submitted && "hover:border-foreground/30 hover:bg-surface",
                            !submitted && selected && "border-foreground/50 bg-surface",
                            showCorrect && "border-summit/60 bg-summit/10",
                            showWrong && "border-destructive/60 bg-destructive/10",
                          )}
                        >
                          <RadioGroupItem value={String(optionIndex)} id={id} className="mt-[3px]" />
                          {/* The label's ::after stretches over the whole row, so the row is the click target. */}
                          <Label
                            htmlFor={id}
                            className={cn(
                              "flex-1 text-sm font-normal leading-snug after:absolute after:inset-0",
                              !submitted && "cursor-pointer",
                            )}
                          >
                            {q.options[optionIndex]}
                          </Label>
                          {showCorrect && (
                            <span className="flex items-center gap-1 text-xs font-medium text-summit-strong">
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              {selected ? "Your answer, correct" : "Correct answer"}
                            </span>
                          )}
                          {showWrong && (
                            <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                              Your answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>

                  {submitted && (
                    <p
                      className={cn(
                        "mt-3 flex gap-2 text-sm sm:pl-7",
                        isCorrect ? "text-summit-strong" : "text-foreground",
                      )}
                    >
                      <span className="font-medium">{isCorrect ? "Correct." : "Incorrect."}</span>
                      <span className="text-muted-foreground">{q.explanation}</span>
                    </p>
                  )}
                </fieldset>
              </li>
            );
          })}
        </ol>

        {!submitted && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
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
