import { useMemo, useRef, useState, type FormEvent } from "react";
import { Check, Lock, RotateCcw, X } from "lucide-react";

import type { QuizAttemptResult, QuizQuestionResult, ServedQuizQuestion, ServedTopic } from "@shared/content";
import { QUIZ_PASS_THRESHOLD } from "@shared/contentConstants";
import type { TopicVideosResponse } from "@shared/videoCore";

import { ApiRequestError } from "@/api/client";
import { RequestReview } from "@/components/challenge/RequestReview";
import { submitAttempt } from "@/features/challenge/api";
import { seededOrder } from "@/lib/shuffle";
import { useProgressStore } from "@/store/progressStore";
import { cn } from "@/v5/design/cn";
import { Button } from "@/v5/design/components/Button";
import { StatusLine } from "@/v5/design/components/Lesson";

import { LessonMarkdown } from "../LessonRich";

export interface CheckStepProps {
  topic: ServedTopic;
  questions: ServedQuizQuestion[];
  videos: TopicVideosResponse | null;
  onGoWatch: () => void;
  onGraded: (result: QuizAttemptResult) => void;
}

/**
 * The Check step: the grounded topic test (v4.3) in a calm, one-column form. Each question is right
 * or not yet (no part marks, v4.4), every answer is explained afterwards with the part of the lesson
 * it came from, and a "Not yet" answer can be sent to a person for review. Ask Oye is off here.
 */
export function CheckStep({ topic, questions, videos, onGoWatch, onGraded }: CheckStepProps) {
  const applyAttempt = useProgressStore((s) => s.applyAttempt);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const orders = useMemo(() => Object.fromEntries(questions.map((q) => [q.id, seededOrder(q.options.length, `${q.id}:${round}`)])), [questions, round]);
  const byId = useMemo(() => new Map<string, QuizQuestionResult>((result?.perQuestion ?? []).map((r) => [r.id, r])), [result]);
  const answered = questions.filter((q) => (answers[q.id]?.length ?? 0) > 0).length;
  const need = Math.ceil((questions.length * QUIZ_PASS_THRESHOLD) / 100);

  const locked = videos && !videos.exempt && videos.locked;
  if (locked) {
    const left = videos.total - videos.watchedCount;
    return (
      <StatusLine
        tone="warning"
        icon={<Lock />}
        action={
          <Button variant="primary" onClick={onGoWatch}>
            Go to the videos
          </Button>
        }
      >
        The test opens once you've watched every video. {left === 1 ? "One video is left." : `${left} videos are left.`}
      </StatusLine>
    );
  }

  const toggle = (q: ServedQuizQuestion, option: number) =>
    setAnswers((cur) => {
      if (!q.multi) return { ...cur, [q.id]: [option] };
      const set = new Set(cur[q.id] ?? []);
      if (set.has(option)) set.delete(option);
      else set.add(option);
      return { ...cur, [q.id]: [...set] };
    });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || result || answered < questions.length) return;
    setBusy(true);
    setError(null);
    try {
      const graded = await submitAttempt(topic.id, { kind: "quiz", answers });
      if (graded.kind !== "quiz") throw new Error("unexpected");
      setResult(graded);
      applyAttempt(topic.id, graded);
      onGraded(graded);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "We couldn't send your answers. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
    setRound((r) => r + 1);
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>("input")?.focus());
  };

  return (
    <div className="mx-auto flex w-full max-w-article flex-col gap-6">
      <header>
        <h2 className="font-display text-h2 font-semibold text-fg-1">Check what you know</h2>
        <p className="mt-1 text-small text-fg-2">
          {questions.length} questions. Get {need} right to finish the lesson. Each question is right or not yet; there are no part marks. Ask Oye is off during the test.
        </p>
      </header>

      {result ? (
        <div ref={resultRef} tabIndex={-1} className="outline-none">
          <StatusLine
            tone={result.passed ? "success" : "warning"}
            action={
              result.passed ? undefined : (
                <Button onClick={retry}>
                  <RotateCcw aria-hidden="true" /> Try again
                </Button>
              )
            }
          >
            {result.passed ? "Passed. " : "Not yet. "}
            {result.correctCount} of {result.total} right{result.passed ? "." : `; you need ${need}. Read the explanations below, then try again.`}
          </StatusLine>
        </div>
      ) : null}

      <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-8">
        <ol className="flex flex-col gap-8">
          {questions.map((q, qi) => {
            const graded = byId.get(q.id);
            const chosen = new Set(answers[q.id] ?? []);
            const correct = new Set(graded?.correctIndices ?? []);
            const legend = `${q.id}-legend`;
            return (
              <li key={q.id}>
                <fieldset aria-labelledby={legend} className="flex flex-col gap-3">
                  <div id={legend}>
                    <p className="flex flex-wrap items-center gap-2 text-caption text-fg-2">
                      Question {qi + 1} of {questions.length}
                      {q.multi ? <span className="font-medium text-warning-fg">Pick every right answer</span> : null}
                      {graded ? <span className={graded.correct ? "font-medium text-success-fg" : "font-medium text-danger-fg"}>{graded.correct ? "Right" : "Not yet"}</span> : null}
                    </p>
                    <LessonMarkdown text={q.prompt} className="mt-1 font-medium text-fg-1" />
                  </div>
                  <div className="flex flex-col gap-2" role={q.multi ? "group" : "radiogroup"} aria-labelledby={legend}>
                    {(orders[q.id] ?? q.options.map((_, i) => i)).map((oi) => {
                      const state = !graded ? "open" : correct.has(oi) ? "right" : chosen.has(oi) ? "wrong" : "plain";
                      return (
                        <label
                          key={oi}
                          className={cn(
                            "flex min-h-11 cursor-pointer items-start gap-3 rounded-control border px-3 py-2.5 text-small text-fg-1 transition-colors duration-120",
                            state === "open" && (chosen.has(oi) ? "border-brand bg-brand-soft" : "border-line-1 hover:bg-sunken"),
                            state === "right" && "border-success bg-success-soft",
                            state === "wrong" && "border-danger bg-danger-soft",
                            state === "plain" && "border-line-1 opacity-80",
                            graded && "cursor-default",
                          )}
                        >
                          <input
                            type={q.multi ? "checkbox" : "radio"}
                            name={`${q.id}-${round}`}
                            className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--v5-brand))]"
                            checked={chosen.has(oi)}
                            disabled={Boolean(graded)}
                            onChange={() => toggle(q, oi)}
                          />
                          <span className="min-w-0 flex-1">
                            <LessonMarkdown text={q.options[oi]} />
                          </span>
                          {state === "right" ? <Check className="size-4 shrink-0 text-success-fg" aria-label="Right answer" /> : state === "wrong" ? <X className="size-4 shrink-0 text-danger-fg" aria-label="Your answer, not right" /> : null}
                        </label>
                      );
                    })}
                  </div>
                  {graded ? (
                    <div className="rounded-card border-l-4 border-line-2 bg-sunken px-3 py-2">
                      <p className="text-caption font-semibold text-fg-1">Why</p>
                      <LessonMarkdown text={graded.explanation} className="mt-1 text-small text-fg-1" />
                      {graded.source ? (
                        <p className="mt-1.5 text-caption text-fg-2" data-testid="quiz-source">
                          From the lesson: <span className="font-medium text-fg-1">{graded.source}</span>
                        </p>
                      ) : graded.sourcePending ? (
                        <p className="mt-1.5 text-caption text-fg-2" data-testid="quiz-source-pending">
                          Source: waiting for a check
                        </p>
                      ) : null}
                      {!graded.correct && graded.itemId && result?.attemptId ? <RequestReview className="mt-2" source="topic_item" refId={graded.itemId} attemptId={result.attemptId} /> : null}
                    </div>
                  ) : null}
                </fieldset>
              </li>
            );
          })}
        </ol>

        {error ? <StatusLine tone="danger">{error}</StatusLine> : null}
        {!result ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="primary" loading={busy} disabled={answered < questions.length}>
              Send my answers
            </Button>
            <span className="text-caption text-fg-2" aria-live="polite">
              {answered} of {questions.length} answered
            </span>
          </div>
        ) : null}
      </form>
    </div>
  );
}
