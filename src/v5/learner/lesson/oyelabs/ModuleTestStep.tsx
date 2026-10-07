import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Check, Lock, RotateCcw, X } from "lucide-react";

import type { GradedModuleTest, ServedModuleTest, ServedModuleTestItem } from "@shared/moduleTests";

import { api, ApiRequestError } from "@/api/client";
import { seededOrder } from "@/lib/shuffle";
import { cn } from "@/v5/design/cn";
import { Button } from "@/v5/design/components/Button";
import { StatusLine } from "@/v5/design/components/Lesson";

/**
 * v4.5 Phase 3 (builder C): an Oyelabs module's test, inside B's module lesson.
 *
 * Questions come from the module's own docs, notes and videos. Each is "Full marks" or "Not yet"
 * (no part marks); 80% of them right passes, marks the module done and, after the last module,
 * issues the course certificate (the server decides). After answering, every question shows why,
 * and where in the material it came from ("Process.pdf, page 2", "Kick-off call, 12:40").
 * While `locked`, the questions wait for the videos.
 */
export interface ModuleTestStepProps {
  topicId: string;
  courseId: string;
  locked: boolean;
  onPassed: () => void;
}

const base = (topicId: string) => `/api/v5/oyelabs/lessons/${encodeURIComponent(topicId)}/test`;

export function ModuleTestStep({ topicId, locked, onPassed }: ModuleTestStepProps) {
  const [test, setTest] = useState<ServedModuleTest | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [result, setResult] = useState<GradedModuleTest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      setTest(await api.get<ServedModuleTest>(base(topicId), signal));
      setLoadError(null);
    } catch (err) {
      if (signal?.aborted) return;
      setLoadError(err instanceof ApiRequestError ? err.message : "We couldn't load the test. Try again in a moment.");
    }
  }, [topicId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, locked]);

  const items = useMemo(() => test?.items ?? [], [test]);
  const orders = useMemo(() => Object.fromEntries(items.map((q) => [q.id, seededOrder(q.options.length, `${q.id}:${round}`)])), [items, round]);
  const byId = useMemo(() => new Map((result?.results ?? []).map((r) => [r.itemId, r])), [result]);

  if (locked || test?.locked) {
    return (
      <StatusLine tone="neutral" icon={<Lock />}>
        The questions open once you've watched the videos above.
      </StatusLine>
    );
  }
  if (loadError) {
    return (
      <StatusLine tone="danger" action={<Button onClick={() => void load()}>Try again</Button>}>
        {loadError}
      </StatusLine>
    );
  }
  if (!test) return <p className="text-small text-fg-2">Loading the test…</p>;
  if (items.length === 0) {
    return <StatusLine tone="info">The questions for this module are still being written. Check back soon.</StatusLine>;
  }

  const answered = items.filter((q) => (answers[q.id]?.length ?? 0) > 0).length;
  const need = Math.ceil((items.length * test.passPercent) / 100);
  const right = result ? result.results.filter((r) => r.verdict === "full").length : 0;

  const toggle = (q: ServedModuleTestItem, option: number) =>
    setAnswers((cur) => {
      if (!q.multi) return { ...cur, [q.id]: [option] };
      const set = new Set(cur[q.id] ?? []);
      if (set.has(option)) set.delete(option);
      else set.add(option);
      return { ...cur, [q.id]: [...set] };
    });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || result || answered < items.length) return;
    setBusy(true);
    setError(null);
    try {
      const graded = await api.post<GradedModuleTest>(`${base(topicId)}/attempt`, { answers });
      setResult(graded);
      if (graded.passed && graded.completed) onPassed();
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
    void load();
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>("input")?.focus());
  };

  return (
    <div className="flex flex-col gap-6" data-testid="module-test">
      <p className="text-small text-fg-2">
        {items.length} questions from this module's docs, notes and videos. Get {need} right to finish the module. Each question is right or not yet; there are no part marks.
      </p>

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
            {result.passed ? "Passed. This module is done. " : "Not yet. "}
            {right} of {items.length} right{result.passed ? "." : `; you need ${need}. Read why below and check the sources, then try again.`}
          </StatusLine>
        </div>
      ) : null}

      <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-8">
        <ol className="flex flex-col gap-8">
          {items.map((q, qi) => {
            const graded = byId.get(q.id);
            const chosen = new Set(answers[q.id] ?? []);
            const correct = new Set(graded?.correctIndices ?? []);
            const legend = `${q.id}-legend`;
            return (
              <li key={q.id}>
                <fieldset aria-labelledby={legend} className="flex flex-col gap-3">
                  <div id={legend}>
                    <p className="flex flex-wrap items-center gap-2 text-caption text-fg-2">
                      Question {qi + 1} of {items.length}
                      {q.multi ? <span className="font-medium text-warning-fg">Pick every right answer</span> : null}
                      {graded ? (
                        <span className={graded.verdict === "full" ? "font-medium text-success-fg" : "font-medium text-danger-fg"}>{graded.verdict === "full" ? "Full marks" : "Not yet"}</span>
                      ) : null}
                    </p>
                    <p className="mt-1 whitespace-pre-line font-medium text-fg-1">{q.prompt}</p>
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
                          <span className="min-w-0 flex-1">{q.options[oi]}</span>
                          {state === "right" ? (
                            <Check className="size-4 shrink-0 text-success-fg" aria-label="Right answer" />
                          ) : state === "wrong" ? (
                            <X className="size-4 shrink-0 text-danger-fg" aria-label="Your answer, not right" />
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                  {graded ? (
                    <div className="rounded-card border-l-4 border-line-2 bg-sunken px-3 py-2">
                      <p className="text-caption font-semibold text-fg-1">Why</p>
                      <p className="mt-1 text-small text-fg-1">{graded.explanation}</p>
                      {graded.source ? (
                        <p className="mt-1.5 text-caption text-fg-2" data-testid="module-test-source">
                          From the material: <span className="font-medium text-fg-1">{graded.source}</span>
                        </p>
                      ) : null}
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
            <Button type="submit" variant="primary" loading={busy} disabled={answered < items.length}>
              Send my answers
            </Button>
            <span className="text-caption text-fg-2" aria-live="polite">
              {answered} of {items.length} answered
            </span>
          </div>
        ) : null}
      </form>
    </div>
  );
}
