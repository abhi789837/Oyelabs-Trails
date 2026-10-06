import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpenCheck, Check, Clock, Repeat, Shuffle, Sparkles, Wrench, X } from "lucide-react";
import { m } from "motion/react";
import { Link } from "react-router-dom";

import { api, ApiRequestError } from "@/api/client";
import { Button } from "@/v5/design/components/Button";
import { Card } from "@/v5/design/components/Card";
import { Badge, Kbd } from "@/v5/design/components/Primitives";
import { ProgressBar } from "@/v5/design/components/Progress";
import { EmptyState, ErrorState, SkeletonLayout } from "@/v5/design/components/States";
import { cn } from "@/v5/design/cn";
import { RATINGS, ratingForKey } from "@/v5/design/lesson";
import { transitions } from "@/v5/design/motion";
import type { RateResponse, ReviewCardView, ReviewSession, ReviewSummary, SessionKind } from "@shared/review";

import { PageFrame, V5Screen, useApiData, useDelayed } from "../me/page";
import { CardText } from "./CardText";

/**
 * `/learn/review`: five-minute review sessions (FSRS, server-scheduled).
 *
 * Three ways in: what's due now, mixed practice (interleaved across topics you've met), and "Fix my
 * mistakes" (questions you got wrong). A session is self-contained: one GET brings every card with
 * its answer and interval labels, then each rating is one POST. Keyboard: Space flips, 1–4 rate.
 */
export default function ReviewPage() {
  return (
    <V5Screen>
      <ReviewScreen />
    </V5Screen>
  );
}

const KINDS: { kind: SessionKind; label: string; hint: string; icon: typeof Repeat }[] = [
  { kind: "due", label: "Due now", hint: "Cards the schedule says you're about to forget.", icon: Repeat },
  { kind: "mixed", label: "Mixed practice", hint: "A mix across the topics you've finished. Harder, and it sticks better.", icon: Shuffle },
  { kind: "mistakes", label: "Fix my mistakes", hint: "Questions you got wrong in a test, until they feel easy.", icon: Wrench },
];

function ReviewScreen() {
  const summary = useApiData<ReviewSummary>("/api/v5/review/summary");
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [starting, setStarting] = useState<SessionKind | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const showSkeleton = useDelayed(summary.loading && !summary.data);

  const start = async (kind: SessionKind) => {
    setStarting(kind);
    setStartError(null);
    try {
      setSession(await api.get<ReviewSession>(`/api/v5/review/session?kind=${kind}`));
    } catch (e) {
      setStartError(e instanceof ApiRequestError ? e.message : "We couldn't start the session. Try again in a moment.");
    } finally {
      setStarting(null);
    }
  };

  const s = summary.data;
  return (
    <PageFrame
      title="Review"
      lead="Five minutes of recall keeps what you learned. We bring each card back just before you'd forget it."
      actions={
        s ? (
          <p className="text-small text-fg-2">
            <span data-testid="review-due-count" className="font-display text-h4 font-semibold tabular-nums text-fg-1">
              {s.dueCount}
            </span>{" "}
            due now · {s.reviewedToday} reviewed today
          </p>
        ) : null
      }
    >
      {session ? (
        <SessionRunner
          key={session.id}
          session={session}
          onRated={(r) => s && summary.setData({ ...s, dueCount: r.dueCount, reviewedToday: s.reviewedToday + 1 })}
          onFinish={() => {
            setSession(null);
            void summary.reload(true);
          }}
        />
      ) : summary.error && !s ? (
        <ErrorState title="We couldn't load your review deck" onRetry={() => void summary.reload()} retrying={summary.loading} />
      ) : !s ? (
        showSkeleton ? <SkeletonLayout variant="card" label="Loading your review deck" /> : null
      ) : s.totalCards === 0 ? (
        <EmptyState
          icon={<BookOpenCheck />}
          title="Nothing to review yet"
          body="Cards appear here after you finish lessons and take their tests. Wrong answers come back here too, so you can fix them."
          action={
            <Button asChild variant="primary">
              <Link to="/learn/plan">Go to my plan</Link>
            </Button>
          }
        />
      ) : (
        <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={transitions.calm} className="grid gap-(--v5-gap) md:grid-cols-3">
          {KINDS.map(({ kind, label, hint, icon: Icon }) => {
            const count = kind === "due" ? s.dueCount : kind === "mistakes" ? s.mistakesCount : s.totalCards;
            const empty = count === 0;
            return (
              <Card key={kind} className={cn("flex flex-col gap-3", kind === "due" && !empty && "border-brand/40")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand-fg" aria-hidden="true">
                    <Icon className="size-5" />
                  </span>
                  <Badge tone={empty ? "neutral" : kind === "mistakes" ? "warning" : "brand"}>
                    {count} {count === 1 ? "card" : "cards"}
                  </Badge>
                </div>
                <div>
                  <h2 className="font-display text-h4 font-semibold">{label}</h2>
                  <p className="mt-1 text-small text-fg-2">{hint}</p>
                </div>
                <Button
                  variant={kind === "due" && !empty ? "primary" : "secondary"}
                  className="mt-auto"
                  disabled={empty || starting !== null}
                  loading={starting === kind}
                  onClick={() => void start(kind)}
                >
                  {empty ? (kind === "due" ? "All caught up" : "Nothing here yet") : `Start ${label.toLowerCase()}`}
                </Button>
              </Card>
            );
          })}
          {startError ? (
            <p role="alert" className="text-small font-medium text-danger-fg md:col-span-3">
              {startError}
            </p>
          ) : null}
          <p className="flex items-center gap-2 text-small text-fg-2 md:col-span-3">
            <Clock className="size-4" aria-hidden="true" /> Each session is about five minutes. Keys: <Kbd>Space</Kbd> shows the answer, <Kbd>1</Kbd>–<Kbd>4</Kbd> rate it.
          </p>
        </m.div>
      )}
    </PageFrame>
  );
}

// ---------------------------------------------------------------------------
// The session
// ---------------------------------------------------------------------------

function SessionRunner({ session, onRated, onFinish }: { session: ReviewSession; onRated: (r: RateResponse) => void; onFinish: () => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [last, setLast] = useState<string | null>(null);
  const flipRef = useRef<HTMLButtonElement>(null);
  const card = session.cards[index] as ReviewCardView | undefined;
  const done = index >= session.cards.length;

  const rate = useCallback(
    async (rating: 1 | 2 | 3 | 4) => {
      if (!card || saving) return;
      setSaving(true);
      setError(null);
      try {
        const res = await api.post<RateResponse>(`/api/v5/review/cards/${card.id}/rate`, { rating, sessionId: session.id });
        onRated(res);
        if (res.xpAwarded) setXp((x) => x + res.xpAwarded);
        setLast(`${RATINGS.find((r) => r.rating === rating)?.label}. Back in ${res.nextIn}.`);
        setFlipped(false);
        setIndex((i) => i + 1);
      } catch (e) {
        setError(e instanceof ApiRequestError ? e.message : "That rating didn't save. Try again.");
      } finally {
        setSaving(false);
      }
    },
    [card, saving, session.id, onRated],
  );

  // Move focus to the new card so Space keeps working without the mouse.
  useEffect(() => {
    flipRef.current?.focus({ preventScroll: true });
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || done) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      if (e.key === " " || e.key === "Spacebar") {
        // A focused button handles its own Space (the card's flip button included).
        if (tag === "BUTTON" || tag === "A") return;
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      const r = ratingForKey(e.key, flipped);
      if (r) {
        e.preventDefault();
        void rate(r as 1 | 2 | 3 | 4);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, rate, done]);

  if (done) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-success-soft text-success-fg" aria-hidden="true">
          <Check className="size-6" />
        </span>
        <h2 className="font-display text-h3 font-semibold">Session done</h2>
        <p className="max-w-prose text-body text-fg-2">
          You reviewed {session.cards.length} {session.cards.length === 1 ? "card" : "cards"}. Each one comes back when it's due.
        </p>
        {xp > 0 ? (
          <Badge tone="success">
            <Sparkles aria-hidden="true" /> +{xp} XP for a review session
          </Badge>
        ) : null}
        <Button variant="primary" onClick={onFinish}>
          Back to Review
        </Button>
      </Card>
    );
  }
  if (!card) return null;

  const position = `Card ${index + 1} of ${session.cards.length}`;
  return (
    <section aria-label="Review session" className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <ProgressBar value={index} max={session.cards.length} label={position} size="sm" className="flex-1" />
        <span className="shrink-0 text-small tabular-nums text-fg-2" aria-hidden="true">
          {position}
        </span>
        <Button variant="ghost" size="sm" onClick={onFinish}>
          Stop
        </Button>
      </div>

      <m.div key={card.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={transitions.quick}>
        <button
          ref={flipRef}
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-pressed={flipped}
          data-testid="review-card"
          className={cn(
            "flex min-h-56 w-full flex-col gap-3 rounded-sheet border p-6 text-left shadow-e2 transition-colors duration-200",
            flipped ? "border-brand/30 bg-surface-1" : "border-line-1 bg-surface-1",
          )}
        >
          <span className="sr-only">{flipped ? "Showing the answer. " : "Press to show the answer. "}</span>
          <span className="flex flex-wrap items-center gap-2 text-caption font-medium text-fg-2">
            <SourceBadge source={card.source} />
            {card.topicTitle ?? card.front.context ?? null}
          </span>
          <CardText text={card.front.prompt} className="block font-display text-h3 font-semibold text-fg-1" />
          {card.front.kind === "text" && card.front.context && card.topicTitle !== card.front.context ? (
            <span className="block text-small text-fg-2">{card.front.context}</span>
          ) : null}
          {card.front.kind === "choice" ? (
            <span className="flex flex-col gap-1.5">
              {card.front.multi ? <span className="text-small text-fg-2">More than one is right.</span> : null}
              {card.front.options.map((option, i) => {
                const right = flipped && card.back.correctIndices?.includes(i);
                const yours = flipped && card.back.yourIndices?.includes(i) && !right;
                return (
                  <span
                    key={i}
                    className={cn(
                      "flex items-start gap-2 rounded-control border px-3 py-2 text-body",
                      right ? "border-success bg-success-soft text-fg-1" : yours ? "border-danger/60 bg-danger-soft text-fg-1" : "border-line-1",
                    )}
                  >
                    <span className="font-mono text-small text-fg-2">{String.fromCharCode(65 + i)}</span>
                    <CardText text={option} className="min-w-0 flex-1" />
                    {right ? (
                      <span className="flex items-center gap-1 text-caption font-semibold text-success-fg">
                        <Check className="size-3.5" aria-hidden="true" /> Right answer
                      </span>
                    ) : yours ? (
                      <span className="flex items-center gap-1 text-caption font-semibold text-danger-fg">
                        <X className="size-3.5" aria-hidden="true" /> You chose this
                      </span>
                    ) : null}
                  </span>
                );
              })}
            </span>
          ) : null}
          {flipped ? (
            <span className="block border-t border-line-1 pt-3" data-testid="review-answer">
              <span className="mb-1 block text-caption font-medium text-brand-fg">Answer</span>
              {card.front.kind === "text" ? <CardText text={card.back.answer} className="block text-body text-fg-1" /> : null}
              {card.back.explanation ? <CardText text={card.back.explanation} className="mt-2 block text-small text-fg-2" /> : null}
            </span>
          ) : null}
        </button>
      </m.div>

      {flipped ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="How well did you know it?">
          {RATINGS.map(({ rating, label, key, hint }) => (
            <Button
              key={rating}
              variant={rating === 3 ? "primary" : "secondary"}
              onClick={() => void rate(rating as 1 | 2 | 3 | 4)}
              disabled={saving}
              className="h-auto flex-col gap-0.5 py-2"
              aria-label={`${label}: ${hint}. Back in ${card.intervals[String(rating) as "1"]}.`}
            >
              <span className="flex items-center gap-1.5">
                {label} <Kbd className={rating === 3 ? "border-on-brand/40 bg-transparent text-on-brand" : ""}>{key}</Kbd>
              </span>
              <span className="text-caption font-normal">{card.intervals[String(rating) as "1"]}</span>
            </Button>
          ))}
        </div>
      ) : (
        <Button variant="secondary" className="self-center" onClick={() => setFlipped(true)}>
          Show answer <Kbd>Space</Kbd>
        </Button>
      )}

      <p className="min-h-5 text-center text-small text-fg-2" role="status" aria-live="polite">
        {error ? <span className="font-medium text-danger-fg">{error}</span> : last}
      </p>
    </section>
  );
}

function SourceBadge({ source }: { source: ReviewCardView["source"] }) {
  if (source === "mistake") return <Badge tone="warning">A mistake to fix</Badge>;
  if (source === "glossary") return <Badge tone="info">Term</Badge>;
  if (source === "topic_point") return <Badge tone="brand">Key point</Badge>;
  return <Badge tone="neutral">Question</Badge>;
}
