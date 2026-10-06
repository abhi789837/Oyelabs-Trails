import { Building2, Info, Lightbulb, Lock, MessageCircle, RotateCcw, Send, Sparkles, TriangleAlert, Unlock } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "../cn";

import { HINT_LABELS, HINT_LEVELS, RATINGS, nextHint, ratingForKey, solutionUnlocked, type HintLevel, type Rating } from "../lesson";
import { Button } from "./Button";
import { Textarea } from "./Field";
import { Sheet } from "./Overlays";
import { Kbd } from "./Primitives";

// ---------------------------------------------------------------------------
// ReadingView
// ---------------------------------------------------------------------------

export type CalloutKind = "tip" | "warning" | "oyelabs" | "note";

const CALLOUT = {
  tip: { title: "Tip", icon: Lightbulb, cls: "border-success/40 bg-success-soft", iconCls: "text-success-fg" },
  warning: { title: "Watch out", icon: TriangleAlert, cls: "border-warning/50 bg-warning-soft", iconCls: "text-warning-fg" },
  oyelabs: { title: "At Oyelabs", icon: Building2, cls: "border-brand/40 bg-brand-soft", iconCls: "text-brand-fg" },
  note: { title: "Note", icon: Info, cls: "border-info/40 bg-info-soft", iconCls: "text-info-fg" },
} as const;

export function Callout({ kind = "tip", title, children }: { kind?: CalloutKind; title?: string; children: ReactNode }) {
  const c = CALLOUT[kind];
  const Icon = c.icon;
  return (
    <aside className={cn("not-prose my-6 rounded-card border-l-4 border p-4", c.cls)} aria-label={title ?? c.title}>
      <p className="flex items-center gap-2 text-small font-semibold text-fg-1">
        <Icon className={cn("size-4", c.iconCls)} aria-hidden="true" />
        {title ?? c.title}
      </p>
      <div className="mt-1.5 text-small leading-relaxed text-fg-1">{children}</div>
    </aside>
  );
}

export function Takeaways({ items, title = "Key takeaways" }: { items: ReactNode[]; title?: string }) {
  return (
    <section aria-label={title} className="rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad) shadow-e1">
      <h2 className="font-display text-h4 font-semibold text-fg-1">{title}</h2>
      <ol className="mt-3 flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-small text-fg-1">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft font-mono text-caption font-semibold text-brand-fg" aria-hidden="true">
              {i + 1}
            </span>
            <span className="pt-0.5">{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export interface ReadingViewProps {
  title: string;
  /** "Last checked 3 Oct 2026", "8 min read". */
  meta?: ReactNode;
  takeaways?: ReactNode[];
  /** The article body. Plain HTML elements get article typography (68ch measure). */
  children: ReactNode;
  className?: string;
}

export function ReadingView({ title, meta, takeaways, children, className }: ReadingViewProps) {
  const body = useRef<HTMLDivElement>(null);
  // Code blocks scroll sideways, so keyboard users must be able to focus them (WCAG 2.1.1).
  useEffect(() => {
    body.current?.querySelectorAll("pre").forEach((pre) => {
      if (!pre.hasAttribute("tabindex")) pre.setAttribute("tabindex", "0");
    });
  });
  return (
    <article className={cn("mx-auto flex w-full max-w-article flex-col gap-6", className)}>
      <header>
        <h1 className="font-display text-h1 font-semibold text-fg-1">{title}</h1>
        {meta ? <p className="mt-2 text-small text-fg-2">{meta}</p> : null}
      </header>
      {takeaways?.length ? <Takeaways items={takeaways} /> : null}
      <div ref={body} className="v5-article">
        {children}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// HintLadder — nudge, concept, partial code, then the solution gate
// ---------------------------------------------------------------------------

export interface HintLadderProps {
  hints: Record<HintLevel, ReactNode>;
  /** Checks the learner has run; the solution needs at least `minAttempts`. */
  attempts: number;
  minAttempts?: number;
  solution?: ReactNode;
  /** Controlled count of revealed hints (persist it); uncontrolled when omitted. */
  revealed?: number;
  onReveal?: (count: number) => void;
  className?: string;
}

export function HintLadder({ hints, attempts, minAttempts = 2, solution, revealed: revealedProp, onReveal, className }: HintLadderProps) {
  const [inner, setInner] = useState(0);
  const revealed = revealedProp ?? inner;
  const [showSolution, setShowSolution] = useState(false);
  const next = nextHint(revealed);
  const unlocked = solutionUnlocked(revealed, attempts, minAttempts);
  const reveal = () => {
    const n = revealed + 1;
    setInner(n);
    onReveal?.(n);
  };
  return (
    <section aria-label="Hints" className={cn("flex flex-col gap-3", className)}>
      <ol className="flex flex-col gap-2">
        {HINT_LEVELS.map((level, i) => {
          const open = i < revealed;
          return (
            <li key={level} className={cn("rounded-card border p-3", open ? "border-line-1 bg-surface-1" : "border-dashed border-line-1 bg-transparent")}>
              <p className="flex items-center gap-2 text-small font-medium text-fg-1">
                <span className="grid size-6 place-items-center rounded-full bg-sunken font-mono text-caption text-fg-2" aria-hidden="true">
                  {i + 1}
                </span>
                {HINT_LABELS[level]}
                {!open ? <span className="text-caption font-normal text-fg-2">(hidden)</span> : null}
              </p>
              {open ? <div className="mt-2 text-small text-fg-1">{hints[level]}</div> : null}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-2">
        {next ? (
          <Button onClick={reveal}>
            <Lightbulb aria-hidden="true" /> Show {HINT_LABELS[next].toLowerCase()}
          </Button>
        ) : null}
        {solution ? (
          <Button variant="ghost" disabled={!unlocked} onClick={() => setShowSolution((s) => !s)} aria-expanded={showSolution}>
            {unlocked ? <Unlock aria-hidden="true" /> : <Lock aria-hidden="true" />}
            {showSolution ? "Hide the solution" : "Show the solution"}
          </Button>
        ) : null}
        {solution && !unlocked ? (
          <span className="text-caption text-fg-2">
            Opens after all 3 hints and {minAttempts} checks ({Math.min(attempts, minAttempts)} of {minAttempts} so far).
          </span>
        ) : null}
      </div>
      {showSolution && unlocked ? <div className="rounded-card border border-line-1 bg-sunken p-3 text-small">{solution}</div> : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// TutorPanel shell
// ---------------------------------------------------------------------------

export interface TutorMessage {
  id: string;
  role: "learner" | "tutor";
  body: ReactNode;
}

export interface TutorPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: TutorMessage[];
  onAsk?: (question: string) => void;
  busy?: boolean;
  /** Shown when the tutor is off (in a test). */
  disabledReason?: string;
  /** Under the box: "3 questions left today". */
  footnote?: ReactNode;
}

/** "Ask Oye": a side panel on desktop (page stays usable), a bottom sheet on a phone. */
export function TutorPanel({ open, onOpenChange, messages, onAsk, busy, disabledReason, footnote }: TutorPanelProps) {
  const [draft, setDraft] = useState("");
  const send = () => {
    const q = draft.trim();
    if (!q || !onAsk) return;
    onAsk(q);
    setDraft("");
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false} title="Ask Oye" description="Hints and explanations about this lesson. It won't hand you the answer." closeLabel="Close Ask Oye">
      <div className="flex min-h-full flex-col gap-3">
        <ol className="flex flex-1 flex-col gap-3" aria-live="polite">
          {messages.length === 0 ? (
            <li className="rounded-card bg-sunken p-3 text-small text-fg-2">
              <MessageCircle className="mb-1 size-4" aria-hidden="true" />
              Ask about anything in this lesson. Try "Why does this need a key?"
            </li>
          ) : null}
          {messages.map((msg) => (
            <li
              key={msg.id}
              className={cn("max-w-[90%] rounded-card px-3 py-2 text-small", msg.role === "learner" ? "self-end bg-brand text-on-brand" : "self-start border border-line-1 bg-surface-1 text-fg-1")}
            >
              <span className="sr-only">{msg.role === "learner" ? "You: " : "Oye: "}</span>
              {msg.body}
            </li>
          ))}
          {busy ? (
            <li className="self-start rounded-card border border-line-1 bg-surface-1 px-3 py-2 text-small text-fg-2">
              <Sparkles className="mr-1 inline size-4 animate-pulse" aria-hidden="true" />
              Thinking…
            </li>
          ) : null}
        </ol>
        {disabledReason ? (
          <p className="rounded-card bg-sunken p-3 text-small text-fg-2">{disabledReason}</p>
        ) : (
          <form
            className="sticky bottom-0 flex flex-col gap-2 bg-surface-3 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <label htmlFor="v5-tutor-q" className="sr-only">
              Your question
            </label>
            <Textarea
              id="v5-tutor-q"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask a question"
              className="min-h-20"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-caption text-fg-2">{footnote}</span>
              <Button type="submit" variant="primary" size="sm" loading={busy} disabled={!draft.trim()}>
                <Send aria-hidden="true" /> Ask
              </Button>
            </div>
          </form>
        )}
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Flashcard
// ---------------------------------------------------------------------------

export interface FlashcardProps {
  front: ReactNode;
  back: ReactNode;
  onRate: (rating: Rating) => void;
  /** Interval labels per rating from the scheduler: { 1: "10 min", 3: "3 days" }. */
  intervals?: Partial<Record<Rating, string>>;
  /** "Card 3 of 12". */
  position?: string;
  className?: string;
}

/**
 * Space or Enter flips; 1–4 rate once flipped. The flip is a cross-fade with a slight turn, flat
 * under reduced motion. Both faces stay in the DOM order a screen reader expects.
 */
export function Flashcard({ front, back, onRate, intervals, position, className }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    setFlipped(false);
  }, [front]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const r = ratingForKey(e.key, flipped);
      if (r) {
        e.preventDefault();
        onRate(r);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, onRate]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {position ? <p className="text-center text-caption text-fg-2">{position}</p> : null}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        aria-label={flipped ? "Showing the answer. Press to see the question again." : "Showing the question. Press to see the answer."}
        className="group relative min-h-56 w-full rounded-sheet text-left [perspective:1200px]"
      >
        <span
          className={cn(
            "absolute inset-0 flex flex-col justify-center rounded-sheet border border-line-1 bg-surface-1 p-6 shadow-e2 transition-[opacity,transform] duration-320 ease-move [backface-visibility:hidden]",
            flipped ? "pointer-events-none opacity-0 [transform:rotateY(-12deg)]" : "opacity-100",
          )}
          aria-hidden={flipped}
        >
          <span className="mb-2 text-caption font-medium text-fg-2">Question</span>
          <span className="font-display text-h3 font-semibold text-fg-1">{front}</span>
        </span>
        <span
          className={cn(
            "flex min-h-56 flex-col justify-center rounded-sheet border border-brand/30 bg-brand-soft p-6 shadow-e2 transition-[opacity,transform] duration-320 ease-move",
            flipped ? "opacity-100" : "opacity-0 [transform:rotateY(12deg)]",
          )}
          aria-hidden={!flipped}
        >
          <span className="mb-2 text-caption font-medium text-brand-fg">Answer</span>
          <span className="text-body text-fg-1">{back}</span>
        </span>
      </button>
      {flipped ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="How well did you know it?">
          {RATINGS.map(({ rating, label, key }) => (
            <Button key={rating} variant={rating === 3 ? "primary" : "secondary"} onClick={() => onRate(rating)} className="h-auto flex-col gap-0.5 py-2">
              <span className="flex items-center gap-1.5">
                {label} <Kbd className={rating === 3 ? "border-on-brand/40 bg-transparent text-on-brand" : ""}>{key}</Kbd>
              </span>
              {intervals?.[rating] ? <span className="text-caption font-normal">{intervals[rating]}</span> : null}
            </Button>
          ))}
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setFlipped(true)} className="self-center">
          <RotateCcw aria-hidden="true" /> Show answer <Kbd>Space</Kbd>
        </Button>
      )}
    </div>
  );
}
