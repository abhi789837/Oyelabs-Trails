import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CircleCheck, LoaderCircle, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { TERM_CATEGORY_LABELS, type TermCategory } from "@shared/handbook";
import type { FlashcardResult } from "./api";
import {
  advance,
  currentCard,
  flip,
  isFinished,
  isNewCard,
  loadDeck,
  progressLine,
  submitReview,
  type FlashcardState,
} from "./flashcardSession";
import { StatusChip } from "./StatusChip";
import { isPlaceholder, withoutMarker } from "./termLinks";
import { useGlossary } from "./useGlossary";

const GRADES: { result: FlashcardResult; label: string; hint: string; key: string }[] = [
  { result: "again", label: "Again", hint: "Didn't know it", key: "1" },
  { result: "good", label: "Good", hint: "Knew it, with effort", key: "2" },
  { result: "easy", label: "Easy", hint: "Knew it at once", key: "3" },
];

/** Typing in a field (a search box elsewhere on the page) must never flip or grade a card. */
function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

/**
 * Spaced repetition over handbook terms (Leitner boxes on the server). The front is the name; the
 * back is the definition and what it means at Oyelabs. Space flips, 1/2/3 grade.
 */
export function Flashcards({ category, className }: { category?: TermCategory; className?: string }) {
  const glossary = useGlossary();
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<FlashcardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState(null);
    setError(null);
    loadDeck({ category, limit: 20 }, controller.signal)
      .then(setState)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiRequestError ? err.message : "Your cards couldn't be loaded.");
      });
    return () => controller.abort();
  }, [category, attempt]);

  // Cards whose term has been archived since they were scheduled are skipped, not shown blank.
  useEffect(() => {
    if (!state || glossary.status !== "ready") return;
    const card = currentCard(state);
    if (card && !glossary.byId.has(card.termId)) setState((s) => (s ? { ...s, index: s.index + 1, flipped: false } : s));
  }, [state, glossary]);

  const grade = useCallback(
    async (result: FlashcardResult) => {
      if (!state || !state.flipped || saving) return;
      const card = currentCard(state);
      if (!card) return;
      setSaving(true);
      try {
        await submitReview(card.termId, result);
        setState((s) => (s ? advance(s, result) : s));
      } catch (err) {
        notify.error(err instanceof ApiRequestError ? err.message : "That review wasn't saved. Try again.");
      } finally {
        setSaving(false);
      }
    },
    [state, saving],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!state || isFinished(state) || isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === " ") {
        // A focused button handles Space itself; only take it when focus is elsewhere.
        if (event.target instanceof HTMLButtonElement) return;
        event.preventDefault();
        setState((s) => (s ? flip(s) : s));
        return;
      }
      const g = GRADES.find((x) => x.key === event.key);
      if (g && state.flipped) {
        event.preventDefault();
        void grade(g.result);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, grade]);

  if (error) {
    return (
      <div className={className}>
        <FormAlert>{error}</FormAlert>
        <Button variant="outline" className="mt-3" onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </Button>
      </div>
    );
  }
  if (!state || glossary.status === "loading" || glossary.status === "idle") {
    return (
      <p className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)} role="status">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Shuffling your cards…
      </p>
    );
  }

  const card = currentCard(state);
  const term = card ? glossary.byId.get(card.termId) : undefined;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
          {progressLine(state)}
        </p>
        {category && <p className="text-xs text-muted-foreground">{TERM_CATEGORY_LABELS[category]}</p>}
      </div>

      {isFinished(state) || !card ? (
        <div className="mt-3 rounded-lg border px-5 py-8 text-center">
          <CircleCheck className="mx-auto size-8 text-summit-strong" aria-hidden="true" />
          <p className="mt-3 font-display text-lg font-semibold">
            {state.reviewed > 0 ? "That's everything due for now." : "Nothing is due right now."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {state.reviewed > 0 ? `You reviewed ${state.reviewed} ${state.reviewed === 1 ? "card" : "cards"}. ` : ""}
            Cards come back as they fall due: the same day, then after 1, 3, 7 and 16 days.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
              <RotateCcw aria-hidden="true" />
              Check again
            </Button>
            <Button asChild variant="ghost">
              <Link to="/glossary">Open the glossary</Link>
            </Button>
          </div>
        </div>
      ) : term ? (
        <>
          <motion.div
            key={`${state.index}-${state.flipped ? "back" : "front"}`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotateX: -12 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, rotateX: 0 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.22, ease: "easeOut" }}
            className="mt-3 min-h-56 rounded-lg border bg-card px-5 py-6 sm:px-8"
            style={{ transformPerspective: 800 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted-foreground">{isNewCard(card) ? "New" : `Box ${card.box}`}</span>
              {state.flipped && <StatusChip status={term.status} />}
            </div>
            <p className="mt-4 text-center font-display text-2xl font-bold">{term.name}</p>
            {term.aka.length > 0 && <p className="mt-1 text-center font-mono text-sm text-muted-foreground">{term.aka.join(", ")}</p>}
            {state.flipped && (
              <dl className="mt-6 space-y-4 text-[0.95rem] leading-relaxed">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">Definition</dt>
                  <dd className="mt-1">{term.definition}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">At Oyelabs</dt>
                  <dd className="mt-1">
                    {isPlaceholder(term.oyelabsMeaning) ? (
                      <span className="text-muted-foreground">
                        <span className="font-medium text-trailmark-strong">To confirm. </span>
                        {withoutMarker(term.oyelabsMeaning)}
                      </span>
                    ) : (
                      term.oyelabsMeaning
                    )}
                  </dd>
                </div>
              </dl>
            )}
          </motion.div>

          {state.flipped ? (
            <div role="group" aria-label="How well did you know it?" className="mt-4 grid grid-cols-3 gap-2">
              {GRADES.map((g) => (
                <Button
                  key={g.result}
                  variant={g.result === "again" ? "outline" : g.result === "good" ? "default" : "outline"}
                  className="h-auto flex-col gap-0.5 py-2"
                  disabled={saving}
                  aria-keyshortcuts={g.key}
                  onClick={() => void grade(g.result)}
                >
                  <span>{g.label}</span>
                  <span className="text-[11px] font-normal opacity-80">{g.hint}</span>
                </Button>
              ))}
            </div>
          ) : (
            <Button className="mt-4 w-full" aria-keyshortcuts="Space" onClick={() => setState((s) => (s ? flip(s) : s))}>
              Show answer
            </Button>
          )}
          <p className="mt-3 hidden text-center text-xs text-muted-foreground sm:block">
            <Kbd>Space</Kbd> flips the card, <Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> grade it.
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          Loading…
        </p>
      )}
    </div>
  );
}
