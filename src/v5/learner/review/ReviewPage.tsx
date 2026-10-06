import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpenCheck, Check, Clock, CloudOff, Repeat, Shuffle, Sparkles, Wrench, X } from "lucide-react";
import { m } from "motion/react";
import { Link } from "react-router-dom";

import { api, ApiRequestError } from "@/api/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/v5/design/components/Button";
import { Card } from "@/v5/design/components/Card";
import { Badge, Kbd } from "@/v5/design/components/Primitives";
import { ProgressBar } from "@/v5/design/components/Progress";
import { EmptyState, ErrorState } from "@/v5/design/components/States";
import { cn } from "@/v5/design/cn";
import { RATINGS, ratingForKey } from "@/v5/design/lesson";
import { transitions } from "@/v5/design/motion";
import type { RateResponse, ReviewCardView, ReviewSession, ReviewSummary, SessionKind } from "@shared/review";

import { ReviewSkeleton } from "../skeletons";
import { PageFrame, V5Screen, useApiData, useDelayed } from "../me/page";
import { CardText } from "./CardText";
import { flushQueue, loadSavedSession, rateOrQueue, saveSession, useOnline, usePendingCount, type RateOutcome, type SavedSession } from "./offline";

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
  // P8 offline: the last session is kept on this device; ratings made offline sync when back online.
  const userId = useAuth().user?.id ?? null;
  const online = useOnline();
  const pending = usePendingCount(userId);
  const [saved, setSaved] = useState<SavedSession | null>(null);
  const reloadSummary = summary.reload;
  useEffect(() => {
    if (!userId) return;
    void loadSavedSession(userId).then(setSaved);
  }, [userId, session]);
  // "Offline" = the browser says so, or the server can't be reached (navigator.onLine stays true
  // on a dead Wi-Fi or a captive portal).
  const offline = !online || (isNetworkError(summary.error) && !summary.data);
  const failedRef = useRef(false);
  failedRef.current = Boolean(summary.error) && !summary.data;
  const hasPending = pending > 0;
  useEffect(() => {
    if (!userId) return;
    const tryFlush = () => {
      if (navigator.onLine === false) return;
      void flushQueue(userId).then((sent) => {
        if (sent > 0 || failedRef.current) void reloadSummary(true);
      });
    };
    tryFlush();
    window.addEventListener("online", tryFlush);
    // Back on the network without an "online" event (the server was down): try again now and then.
    const id = hasPending ? window.setInterval(tryFlush, 15_000) : undefined;
    return () => {
      window.removeEventListener("online", tryFlush);
      if (id) window.clearInterval(id);
    };
  }, [userId, hasPending, reloadSummary]);
  // Online with cards and nothing saved yet: fetch one session in the background, for offline use.
  const s0 = summary.data;
  useEffect(() => {
    if (!userId || !online || !s0 || saved || session) return;
    const kind: SessionKind | null = s0.dueCount > 0 ? "due" : s0.totalCards > 0 ? "mixed" : null;
    if (!kind) return;
    const ac = new AbortController();
    api
      .get<ReviewSession>(`/api/v5/review/session?kind=${kind}`, ac.signal)
      .then((next) => saveSession(userId, next).then(() => loadSavedSession(userId)).then(setSaved))
      .catch(() => undefined);
    return () => ac.abort();
  }, [userId, online, s0, saved, session]);

  const start = async (kind: SessionKind) => {
    setStarting(kind);
    setStartError(null);
    try {
      const next = await api.get<ReviewSession>(`/api/v5/review/session?kind=${kind}`);
      if (userId) void saveSession(userId, next);
      setSession(next);
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
      {offline || pending > 0 ? <OfflineBanner online={!offline} pending={pending} /> : null}
      {session ? (
        <SessionRunner
          userId={userId}
          key={session.id}
          session={session}
          onRated={(r) => s && summary.setData({ ...s, dueCount: r.dueCount, reviewedToday: s.reviewedToday + 1 })}
          onFinish={() => {
            setSession(null);
            void summary.reload(true);
          }}
        />
      ) : summary.error && !s && saved && offline ? (
        <OfflineStart saved={saved} onStart={() => setSession(saved.session)} />
      ) : summary.error && !s && offline ? (
        <EmptyState icon={<CloudOff />} title="Nothing saved on this device yet" body="Open Review once while you're online, and your next cards are kept here for offline use." />
      ) : summary.error && !s ? (
        <ErrorState title="We couldn't load your review deck" onRetry={() => void summary.reload()} retrying={summary.loading} />
      ) : !s ? (
        showSkeleton ? <ReviewSkeleton /> : null
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
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-fg-2 md:col-span-3">
            <Clock className="size-4" aria-hidden="true" /> Each session is about five minutes.
            {/* Keyboard keys only where there's likely a keyboard. */}
            <span className="max-sm:hidden">
              Keys: <Kbd>Space</Kbd> shows the answer, <Kbd>1</Kbd>–<Kbd>4</Kbd> rate it.
            </span>
          </p>
        </m.div>
      )}
    </PageFrame>
  );
}

// ---------------------------------------------------------------------------
// The session
// ---------------------------------------------------------------------------

function SessionRunner({ userId, session, onRated, onFinish }: { userId: string | null; session: ReviewSession; onRated: (r: RateResponse) => void; onFinish: () => void }) {
  // Optimistic (Phase 8): a rating moves to the next card at once and saves in the background. A
  // rating that doesn't save puts its card back at the front, face up, with a plain message.
  const [remaining, setRemaining] = useState<string[]>(() => session.cards.map((c) => c.id));
  const [flipped, setFlipped] = useState(false);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [last, setLast] = useState<string | null>(null);
  const flipRef = useRef<HTMLButtonElement>(null);
  const byId = useMemo(() => new Map(session.cards.map((c) => [c.id, c])), [session.cards]);
  const card = remaining.length ? (byId.get(remaining[0]) as ReviewCardView | undefined) : undefined;
  const done = remaining.length === 0;
  const index = session.cards.length - remaining.length;

  const rate = useCallback(
    (rating: 1 | 2 | 3 | 4) => {
      if (!card) return;
      const rated = card;
      setRemaining((r) => r.filter((id) => id !== rated.id));
      setFlipped(false);
      setError(null);
      setLast(`${RATINGS.find((r) => r.rating === rating)?.label}. Saving…`);
      setPending((n) => n + 1);
      // Offline (or a request that can't reach the server), the rating waits on this device and
      // syncs later (offline.ts, the app-wide group's); only a real refusal rolls back.
      const send: Promise<RateOutcome> = userId
        ? rateOrQueue(userId, rated.id, rating, session.id)
        : api.post<RateResponse>(`/api/v5/review/cards/${rated.id}/rate`, { rating, sessionId: session.id }).then((response) => ({ queued: false as const, response }));
      send
        .then((outcome) => {
          const label = RATINGS.find((r) => r.rating === rating)?.label;
          if (outcome.queued) {
            setLast(`${label}. Saved on this device; it syncs when you're back online.`);
            return;
          }
          const res = outcome.response;
          onRated(res);
          if (res.xpAwarded) setXp((x) => x + res.xpAwarded);
          setLast(`${label}. Back in ${res.nextIn}.`);
        })
        .catch((e: unknown) => {
          // Roll back: the card comes back first, showing its answer, so one tap rates it again.
          setRemaining((r) => [rated.id, ...r.filter((id) => id !== rated.id)]);
          setFlipped(true);
          setLast(null);
          const message = e instanceof ApiRequestError && e.status < 500 ? e.message : "That rating didn't save. Rate it again.";
          setError(message);
          void import("@/v5/design/components/Overlays").then(({ v5Toast }) => v5Toast.error("That rating didn't save", "The card is back. Rate it again.")).catch(() => undefined);
        })
        .finally(() => setPending((n) => n - 1));
    },
    [card, userId, session.id, onRated],
  );

  // Move focus to the new card so Space keeps working without the mouse.
  useEffect(() => {
    flipRef.current?.focus({ preventScroll: true });
  }, [card?.id]);

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
        rate(r as 1 | 2 | 3 | 4);
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
        <p className="min-h-5 text-small text-fg-2" role="status" aria-live="polite">
          {pending > 0 ? `Saving your last ${pending === 1 ? "rating" : "ratings"}…` : last}
        </p>
        {xp > 0 ? (
          <Badge tone="success">
            <Sparkles aria-hidden="true" /> +{xp} XP for a review session
          </Badge>
        ) : null}
        <Button variant="primary" onClick={onFinish} disabled={pending > 0}>
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

      {/* On a phone the answer buttons stay at the bottom of the screen, above the nav, in thumb reach. */}
      <div data-sticky-bar className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 border-t border-line-1 bg-surface-0/95 px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
      {flipped ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="How well did you know it?">
          {RATINGS.map(({ rating, label, key, hint }) => (
            <Button
              key={rating}
              variant={rating === 3 ? "primary" : "secondary"}
              onClick={() => rate(rating as 1 | 2 | 3 | 4)}
              className="h-auto min-h-11 flex-col gap-0.5 py-2"
              aria-label={`${label}: ${hint}. Back in ${card.intervals[String(rating) as "1"]}.`}
            >
              <span className="flex items-center gap-1.5">
                {label} <Kbd className={cn("max-sm:hidden", rating === 3 ? "border-on-brand/40 bg-transparent text-on-brand" : "")}>{key}</Kbd>
              </span>
              <span className="text-caption font-normal">{card.intervals[String(rating) as "1"]}</span>
            </Button>
          ))}
        </div>
      ) : (
        <Button variant="secondary" className="min-h-11 w-full sm:w-auto sm:self-center" onClick={() => setFlipped(true)}>
          Show answer <Kbd className="max-sm:hidden">Space</Kbd>
        </Button>
      )}
      </div>

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

// ---------------------------------------------------------------------------
// Offline (Phase 8, app-wide group)
// ---------------------------------------------------------------------------

function isNetworkError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 0;
}

function OfflineBanner({ online, pending }: { online: boolean; pending: number }) {
  return (
    <p role="status" data-testid="review-offline" className="flex items-center gap-2 rounded-control border border-line-1 bg-surface-1 px-4 py-3 text-small text-fg-1">
      <CloudOff className="size-4 shrink-0 text-fg-2" aria-hidden="true" />
      {online
        ? `Sending ${pending} ${pending === 1 ? "rating" : "ratings"} you made offline…`
        : "You're offline. Your ratings will sync when you're back."}
    </p>
  );
}

function OfflineStart({ saved, onStart }: { saved: SavedSession; onStart: () => void }) {
  const n = saved.session.cards.length;
  return (
    <Card className="flex flex-col items-start gap-3">
      <h2 className="font-display text-h4 font-semibold">Review on this device</h2>
      <p className="text-small text-fg-2">
        {n} {n === 1 ? "card is" : "cards are"} saved here from your last visit. You can rate them now. We'll save the ratings when you're back online.
      </p>
      <Button variant="primary" onClick={onStart}>
        Start review
      </Button>
    </Card>
  );
}
