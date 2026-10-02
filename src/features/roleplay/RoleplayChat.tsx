import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CircleCheck, Info, Mail, MessageSquare, Quote, Send } from "lucide-react";

import { ROLEPLAY_EMAIL_MAX, ROLEPLAY_MESSAGE_MAX, type RoleplayScore, type RoleplaySessionView } from "@shared/roleplay";

import { ApiRequestError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { editorScopeProps } from "@/features/proctor/editorScope";
import { cn } from "@/lib/utils";

import { roleplayApi } from "./api";

export interface RoleplayChatProps {
  /** The conversation, once started. */
  session: RoleplaySessionView;
  onSession: (session: RoleplaySessionView) => void;
  /** What the learner must achieve. Defaults to the scenario's objective. */
  brief?: string;
  /** Ask for the follow-up email at the end. */
  followUp: boolean;
  readOnly?: boolean;
  idPrefix: string;
}

const messageOf = (error: unknown) => (error instanceof ApiRequestError ? error.message : "Something went wrong. Try again.");

/** Initials in a circle: the client's avatar, or "You" for the PM. */
export function Avatar({ initials, tone }: { initials: string; tone: "client" | "pm" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold",
        tone === "client" ? "bg-ridge/15 text-ridge-strong dark:bg-ridge/25" : "bg-trailmark/15 text-trailmark-strong dark:bg-trailmark/25",
      )}
    >
      {initials}
    </span>
  );
}

/**
 * The conversation itself: the brief, the chat, the composer with its turn and character counters,
 * then the follow-up email and the result. Shared by the practice page and the `roleplay` task.
 */
export function RoleplayChat({ session, onSession, brief, followUp, readOnly, idPrefix }: RoleplayChatProps) {
  const [draft, setDraft] = useState("");
  const [email, setEmail] = useState(session.followUpEmail ?? "");
  const [step, setStep] = useState<"chat" | "email">(session.status === "active" ? "chat" : "email");
  const [busy, setBusy] = useState<"send" | "finish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLOListElement>(null);

  const { persona, scenario } = session;
  const active = session.status === "active" && !readOnly;
  const turnsLeft = session.maxTurns - session.turns;
  const canSend = active && step === "chat" && turnsLeft > 0 && draft.trim().length > 0 && draft.length <= ROLEPLAY_MESSAGE_MAX && busy === null;
  const firstName = persona.name.split(" ")[0];

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [session.transcript.length, busy]);

  // Out of turns: the email step is next.
  useEffect(() => {
    if (session.status === "active" && turnsLeft <= 0) setStep("email");
  }, [session.status, turnsLeft]);

  const send = async () => {
    if (!canSend) return;
    setBusy("send");
    setError(null);
    try {
      const { session: next } = await roleplayApi.turn(session.id, draft.trim());
      setDraft("");
      onSession(next);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(null);
    }
  };

  const finish = async () => {
    setBusy("finish");
    setError(null);
    try {
      const { session: next } = await roleplayApi.finish(session.id, followUp ? email.trim() || undefined : undefined);
      onSession(next);
      if (next.scoreError) setError(next.scoreError);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(null);
    }
  };

  const onKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  };

  const shownTurn = Math.min(session.maxTurns, session.turns + (active && step === "chat" ? 1 : 0));

  return (
    <div className="space-y-5">
      {session.mode === "scripted" && (
        <p role="note" className="flex items-start gap-2 rounded-md border border-trailmark/40 bg-trailmark/[0.07] px-3 py-2 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-trailmark-strong" aria-hidden="true" />
          <span>
            <span className="font-medium">Practice mode — the AI client is not connected.</span> The client follows a fixed script, and there
            is no score: check yourself against the list at the end.
          </span>
        </p>
      )}

      <section aria-label="Your brief" className="rounded-md border bg-surface-sunken/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar initials={persona.initials} tone="client" />
          <div className="min-w-0">
            <p className="font-medium leading-tight">{persona.name}</p>
            <p className="text-xs text-muted-foreground">{persona.role}</p>
          </div>
        </div>
        <p className="mt-3 text-sm">
          <span className="font-medium">Your brief: </span>
          {brief || scenario.objective}
        </p>
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">The project</summary>
          <p className="mt-1.5 text-muted-foreground">{scenario.context}</p>
        </details>
      </section>

      <div className="rounded-md border">
        <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <MessageSquare className="size-4 text-muted-foreground" aria-hidden="true" />
            {scenario.title}
          </p>
          <p className="font-mono text-xs tabular text-muted-foreground" aria-live="polite">
            Turn {Math.max(1, shownTurn)} of {session.maxTurns}
          </p>
        </div>

        <ol ref={logRef} role="log" aria-live="polite" aria-label="Conversation" className="max-h-[26rem] space-y-3 overflow-y-auto px-3 py-4">
          {session.transcript.map((line, index) => (
            <li key={index} className={cn("flex items-end gap-2", line.role === "pm" && "flex-row-reverse")}>
              <Avatar initials={line.role === "pm" ? "You" : persona.initials} tone={line.role} />
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm leading-relaxed",
                  line.role === "pm" ? "rounded-br-sm bg-trailmark/12 dark:bg-trailmark/20" : "rounded-bl-sm bg-surface-sunken",
                )}
              >
                <span className="sr-only">{line.role === "pm" ? "You: " : `${persona.name}: `}</span>
                {line.text}
              </div>
            </li>
          ))}
          {busy === "send" && (
            <li className="flex items-end gap-2 text-sm text-muted-foreground">
              <Avatar initials={persona.initials} tone="client" />
              <span className="animate-pulse motion-reduce:animate-none">{firstName} is typing…</span>
            </li>
          )}
        </ol>

        {active && step === "chat" && (
          <div className="border-t px-3 py-3" {...editorScopeProps()}>
            <label htmlFor={`${idPrefix}-message`} className="sr-only">
              Your reply to {persona.name}
            </label>
            <textarea
              id={`${idPrefix}-message`}
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, ROLEPLAY_MESSAGE_MAX + 50))}
              onKeyDown={onKey}
              rows={3}
              maxLength={ROLEPLAY_MESSAGE_MAX}
              aria-describedby={`${idPrefix}-count`}
              placeholder={`Reply to ${firstName}…`}
              disabled={busy !== null}
              className="block w-full resize-y rounded-md border border-input bg-surface px-3 py-2 text-sm leading-relaxed"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p id={`${idPrefix}-count`} className={cn("font-mono text-xs tabular", draft.length >= ROLEPLAY_MESSAGE_MAX ? "text-warning-strong" : "text-muted-foreground")}>
                {draft.length} / {ROLEPLAY_MESSAGE_MAX}
                <span className="sr-only"> characters. {turnsLeft} {turnsLeft === 1 ? "message" : "messages"} left.</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep("email")} disabled={busy !== null || session.turns === 0}>
                  {followUp ? "Finish and write the follow-up email" : "Finish the conversation"}
                </Button>
                <Button size="sm" onClick={() => void send()} disabled={!canSend} loading={busy === "send"}>
                  <Send aria-hidden="true" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {active && step === "email" && (
        <section aria-label="Finish" className="space-y-3" {...editorScopeProps()}>
          {followUp ? (
            <>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Mail className="size-4 text-primary-strong" aria-hidden="true" />
                The follow-up email to {persona.name}
              </p>
              <p className="text-sm text-muted-foreground">Confirm what was agreed, the options or decision, and who does what by when.</p>
              <label htmlFor={`${idPrefix}-email`} className="sr-only">
                Follow-up email
              </label>
              <textarea
                id={`${idPrefix}-email`}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={ROLEPLAY_EMAIL_MAX}
                rows={8}
                placeholder={`Hi ${firstName},`}
                className="block w-full resize-y rounded-md border border-input bg-surface px-3 py-2 text-sm leading-relaxed"
              />
              <p className="text-right font-mono text-xs tabular text-muted-foreground">
                {email.length} / {ROLEPLAY_EMAIL_MAX}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Finish when you have agreed the next step with the client.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {turnsLeft > 0 && (
              <Button variant="outline" onClick={() => setStep("chat")} disabled={busy !== null}>
                Back to the chat
              </Button>
            )}
            <Button onClick={() => void finish()} loading={busy === "finish"}>
              {session.context === "assessment" ? "Finish the conversation" : session.mode === "ai" ? "Finish and get feedback" : "Finish"}
            </Button>
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {session.status !== "active" && <Outcome session={session} onRetry={() => void finish()} busy={busy === "finish"} />}
    </div>
  );
}

function Outcome({ session, onRetry, busy }: { session: RoleplaySessionView; onRetry: () => void; busy: boolean }) {
  if (session.context === "assessment") {
    return (
      <p role="status" className="flex items-center gap-2 rounded-md border border-summit/40 bg-summit/[0.06] px-4 py-3 text-sm">
        <CircleCheck className="size-4 text-summit-strong" aria-hidden="true" />
        Conversation finished. It is scored with the rest of your answers when you submit.
      </p>
    );
  }
  if (session.mode === "scripted") return <SelfCheck items={session.selfCheck} />;
  if (session.score) return <ScorePanel score={session.score} />;
  return (
    <div role="status" className="space-y-2 rounded-md border px-4 py-3 text-sm">
      <p>The conversation is saved, but the feedback is not ready.</p>
      <Button size="sm" variant="outline" onClick={onRetry} loading={busy}>
        Try the feedback again
      </Button>
    </div>
  );
}

export function ScorePanel({ score }: { score: RoleplayScore }) {
  const pct = Math.round(score.pct * 100);
  return (
    <section aria-label="Feedback" className="space-y-4 rounded-md border border-summit/40 bg-summit/[0.05] px-4 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold">Feedback</p>
        <p className="font-mono text-sm tabular">
          {score.total} / {score.max} <span className="text-muted-foreground">({pct}%)</span>
        </p>
      </div>
      <ul className="space-y-4">
        {score.dimensions.map((d) => {
          const share = d.points ? Math.round((d.score / d.points) * 100) : 0;
          return (
            <li key={d.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{d.label}</span>
                <span className="font-mono text-xs tabular text-muted-foreground">
                  {d.score} / {d.points}
                </span>
              </div>
              <Progress
                value={share}
                className="mt-1.5 h-2"
                indicatorClassName={share >= 67 ? "bg-summit" : share >= 34 ? "bg-trailmark" : "bg-basalt"}
                aria-label={`${d.label}: ${d.score} of ${d.points}`}
              />
              {d.evidence && (
                <blockquote className="mt-2 flex gap-1.5 text-sm text-muted-foreground">
                  <Quote className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span>“{d.evidence}”</span>
                </blockquote>
              )}
            </li>
          );
        })}
      </ul>
      {score.tips.length > 0 && (
        <div>
          <p className="text-sm font-semibold">To do better next time</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm">
            {score.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function SelfCheck({ items }: { items: string[] }) {
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  return (
    <section aria-label="Self-check" className="rounded-md border px-4 py-4">
      <p className="font-semibold">Check yourself</p>
      <p className="mt-1 text-sm text-muted-foreground">There is no score without the AI client. Tick what you did.</p>
      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li key={item}>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-summit"
                checked={ticked.has(index)}
                onChange={() =>
                  setTicked((prev) => {
                    const next = new Set(prev);
                    if (next.has(index)) next.delete(index);
                    else next.add(index);
                    return next;
                  })
                }
              />
              {item}
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-3 font-mono text-xs text-muted-foreground">
        {ticked.size} of {items.length}
      </p>
    </section>
  );
}
