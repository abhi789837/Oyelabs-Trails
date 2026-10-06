import { useEffect, useState } from "react";
import { BookOpen, ThumbsDown, ThumbsUp } from "lucide-react";

import type { LessonStepId, TutorMessageView, TutorStatus } from "@shared/lessonCore";

import { ApiRequestError } from "@/api/client";
import { cn } from "@/v5/design/cn";
import { TutorPanel, type TutorMessage } from "@/v5/design/components/Learning";

import { lessonApi } from "./api";
import { LessonMarkdown } from "./LessonRich";

export interface TutorDockProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
  step: LessonStepId;
  /** The learner's current code on a coding Do step. */
  getCode: () => string | undefined;
  /** Jump to the passage an answer came from. */
  onCite: (passageId: string) => void;
}

/**
 * "Ask Oye" (lazy). Answers come from the lesson's own text, each with a link to the passage it
 * used. Off on the Check step and during any assessment; a plain "isn't set up yet" without AI.
 * Every answer has 👍/👎, which the admin quality report reads.
 */
export default function TutorDock({ open, onOpenChange, topicId, step, getCode, onCite }: TutorDockProps) {
  const [status, setStatus] = useState<TutorStatus | null>(null);
  const [messages, setMessages] = useState<TutorMessageView[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    lessonApi
      .tutor(topicId, controller.signal)
      .then((s) => {
        setStatus(s);
        setMessages(s.messages);
      })
      .catch(() => setStatus({ available: false, reason: "Ask Oye couldn't load. Try again in a minute.", cap: 0, usedToday: 0, left: 0, messages: [] }));
    return () => controller.abort();
  }, [open, topicId]);

  const ask = async (question: string) => {
    setPending(question);
    setError(null);
    try {
      const res = await lessonApi.ask(topicId, { question, step, ...(step === "do" ? { code: getCode() } : {}) });
      setMessages((m) => [...m, res.message]);
      setStatus((s) => (s ? { ...s, left: res.left, usedToday: s.usedToday + 1 } : s));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Oye couldn't answer just now. Try again.");
    } finally {
      setPending(null);
    }
  };

  const rate = async (id: string, value: -1 | 1) => {
    const current = messages.find((m) => m.id === id)?.rating ?? 0;
    const next = current === value ? 0 : value;
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, rating: next } : x)));
    try {
      await lessonApi.rate(id, next);
    } catch {
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, rating: current } : x)));
    }
  };

  const view: TutorMessage[] = [];
  for (const m of messages) {
    view.push({ id: `${m.id}-q`, role: "learner", body: m.question });
    view.push({
      id: m.id,
      role: "tutor",
      body: (
        <div className="flex flex-col gap-2" data-testid="tutor-answer">
          <LessonMarkdown text={m.answer} />
          {m.citations.length ? (
            <ul className="flex flex-col gap-1" aria-label="Where this comes from in the lesson">
              {m.citations.map((c) => (
                <li key={c.passageId}>
                  <button
                    type="button"
                    onClick={() => onCite(c.passageId)}
                    className="inline-flex min-h-6 items-start gap-1 text-left text-caption text-brand-fg underline-offset-4 hover:underline"
                  >
                    <BookOpen className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                    <span>
                      From the lesson ({c.heading}): “{c.quote}”
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex items-center gap-1" role="group" aria-label="Was this helpful?">
            {([1, -1] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={m.rating === v}
                aria-label={v === 1 ? "Helpful" : "Not helpful"}
                onClick={() => void rate(m.id, v)}
                className={cn("grid size-7 place-items-center rounded-control text-fg-2 hover:bg-sunken", m.rating === v && "bg-brand-soft text-brand-fg")}
              >
                {v === 1 ? <ThumbsUp className="size-3.5" aria-hidden="true" /> : <ThumbsDown className="size-3.5" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>
      ),
    });
  }
  if (pending) view.push({ id: "pending", role: "learner", body: pending });
  if (error) view.push({ id: "error", role: "tutor", body: <span className="text-danger-fg">{error}</span> });

  const disabledReason =
    step === "check"
      ? "Ask Oye is off during tests, so the result is all yours. It's back when you finish."
      : status && !status.available
        ? (status.reason ?? "Ask Oye isn't set up yet.")
        : status?.reason
          ? status.reason
          : status && status.left === 0
            ? `You've used today's ${status.cap} questions. Ask Oye is back tomorrow.`
            : undefined;

  return (
    <TutorPanel
      open={open}
      onOpenChange={onOpenChange}
      messages={view}
      onAsk={(q) => void ask(q)}
      busy={pending !== null}
      disabledReason={disabledReason}
      footnote={status && status.available ? `${status.left} of ${status.cap} questions left today` : undefined}
    />
  );
}
