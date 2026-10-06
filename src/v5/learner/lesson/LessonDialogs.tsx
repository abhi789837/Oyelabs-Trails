import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

import { LESSON_SHORTCUTS, PROBLEM_MESSAGE_MAX, type LessonStepId, type QuickCheckQuestion, type QuickCheckResult } from "@shared/lesson";

import { ApiRequestError } from "@/api/client";
import { Button, Dialog, Field, Kbd, Textarea, cn, v5Toast } from "@/v5/design";

import { lessonApi } from "./api";
import { LessonMarkdown } from "./LessonRich";

const STEP_NAMES: Record<LessonStepId, string> = { watch: "Watch", read: "Read", do: "Do", check: "Check" };

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Keyboard shortcuts" description="They don't work while you're typing in a box." size="sm">
      <dl className="flex flex-col gap-2">
        {LESSON_SHORTCUTS.map((s) => (
          <div key={s.action} className="flex items-center justify-between gap-4 text-small">
            <dt className="text-fg-1">
              {s.label}
              {s.watchOnly ? <span className="ml-1 text-caption text-fg-2">(Watch)</span> : null}
            </dt>
            <dd className="flex gap-1">
              {s.keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}

export function ReportProblemDialog({ open, onOpenChange, topicId, step }: { open: boolean; onOpenChange: (open: boolean) => void; topicId: string; step: LessonStepId }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const send = async () => {
    if (message.trim().length < 3) {
      setError("Tell us a little more: what went wrong?");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await lessonApi.report(topicId, step, message.trim());
      setMessage("");
      onOpenChange(false);
      v5Toast.success("Thanks. We've told the team.", "Someone will look at it and fix it.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "We couldn't send that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Report a problem with this step"
      description={`You're on the ${STEP_NAMES[step]} step. A video that won't play, a wrong answer, a broken link: tell us and we'll fix it.`}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void send()} loading={busy}>
            Send the report
          </Button>
        </>
      }
    >
      <Field label="What's wrong?" error={error ?? undefined} hint="A sentence or two is plenty.">
        <Textarea value={message} maxLength={PROBLEM_MESSAGE_MAX} onChange={(e) => setMessage(e.target.value)} placeholder="The second video stops at 2:10." />
      </Field>
    </Dialog>
  );
}

/**
 * The quick check: one or two of the lesson's questions after the video (retrieval practice). It
 * never decides whether the lesson is done; passing it earns a little XP.
 */
export function QuickCheckDialog({ open, onOpenChange, topicId, onClosed }: { open: boolean; onOpenChange: (open: boolean) => void; topicId: string; onClosed?: () => void }) {
  const [questions, setQuestions] = useState<QuickCheckQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [result, setResult] = useState<QuickCheckResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || questions) return;
    const controller = new AbortController();
    lessonApi
      .quickCheck(topicId, controller.signal)
      .then((res) => setQuestions(res.questions))
      .catch(() => setQuestions([]));
    return () => controller.abort();
  }, [open, questions, topicId]);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) onClosed?.();
  };

  const send = async () => {
    setBusy(true);
    try {
      const res = await lessonApi.answerQuickCheck(topicId, answers);
      setResult(res);
      const xp = res.awarded.reduce((s, a) => s + a.xp, 0);
      if (xp) v5Toast.success(`+${xp} XP`, "Quick check passed");
    } catch {
      v5Toast.error("We couldn't check that. You can skip it.");
    } finally {
      setBusy(false);
    }
  };

  const byId = new Map(result?.results.map((r) => [r.id, r]) ?? []);
  const ready = questions?.length ? questions.every((q) => (answers[q.id]?.length ?? 0) > 0) : false;

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="Quick check"
      description="Two quick questions on what you just watched. They don't count towards finishing; they help it stick."
      size="md"
      footer={
        result ? (
          <Button variant="primary" onClick={() => close(false)}>
            Continue
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={() => close(false)}>
              Skip for now
            </Button>
            <Button variant="primary" onClick={() => void send()} loading={busy} disabled={!ready}>
              Check my answers
            </Button>
          </>
        )
      }
    >
      {!questions ? (
        <p className="text-small text-fg-2">Loading…</p>
      ) : questions.length === 0 ? (
        <p className="text-small text-fg-2">This lesson has no quick check.</p>
      ) : (
        <ol className="flex flex-col gap-5" data-testid="quick-check">
          {questions.map((q, qi) => {
            const graded = byId.get(q.id);
            const chosen = new Set(answers[q.id] ?? []);
            return (
              <li key={q.id}>
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-small font-medium text-fg-1">
                    <span className="sr-only">Question {qi + 1}: </span>
                    <LessonMarkdown text={q.prompt} />
                  </legend>
                  {q.options.map((opt, oi) => {
                    const right = graded?.correctIndices.includes(oi);
                    return (
                      <label
                        key={oi}
                        className={cn(
                          "flex min-h-10 cursor-pointer items-start gap-2 rounded-control border px-3 py-2 text-small",
                          !graded && (chosen.has(oi) ? "border-brand bg-brand-soft" : "border-line-1 hover:bg-sunken"),
                          graded && right && "border-success bg-success-soft",
                          graded && !right && chosen.has(oi) && "border-danger bg-danger-soft",
                          graded && !right && !chosen.has(oi) && "border-line-1",
                        )}
                      >
                        <input
                          type={q.multi ? "checkbox" : "radio"}
                          name={`qc-${q.id}`}
                          className="mt-0.5 size-4 accent-[rgb(var(--v5-brand))]"
                          checked={chosen.has(oi)}
                          disabled={Boolean(graded)}
                          onChange={() =>
                            setAnswers((cur) => {
                              if (!q.multi) return { ...cur, [q.id]: [oi] };
                              const s = new Set(cur[q.id] ?? []);
                              if (s.has(oi)) s.delete(oi);
                              else s.add(oi);
                              return { ...cur, [q.id]: [...s] };
                            })
                          }
                        />
                        <span className="flex-1">
                          <LessonMarkdown text={opt} />
                        </span>
                        {graded && right ? <Check className="size-4 text-success-fg" aria-label="Right answer" /> : graded && chosen.has(oi) ? <X className="size-4 text-danger-fg" aria-label="Not right" /> : null}
                      </label>
                    );
                  })}
                  {graded ? (
                    <div className="rounded-control bg-sunken px-3 py-2 text-small text-fg-1">
                      <p className="font-medium">{graded.correct ? "Right." : "Not quite."}</p>
                      <LessonMarkdown text={graded.explanation} className="mt-1" />
                    </div>
                  ) : null}
                </fieldset>
              </li>
            );
          })}
        </ol>
      )}
    </Dialog>
  );
}
