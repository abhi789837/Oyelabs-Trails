import { BookOpen, Check, CheckCircle2, ChevronRight, Lightbulb, Lock, PenLine, Play, PlayCircle, TriangleAlert, XCircle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../cn";

import { LESSON_STEPS, formatClock, stepStates, type LessonStep } from "../lesson";
import { timeLeftLabel } from "../progress";
import { Button } from "./Button";

// ---------------------------------------------------------------------------
// StatusLine — plain-language status + one primary button
// ---------------------------------------------------------------------------

export interface StatusLineProps {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  icon?: ReactNode;
  /** One sentence: what is true now. */
  children: ReactNode;
  /** The one thing to do next. */
  action?: ReactNode;
  className?: string;
}

const STATUS_TONE = {
  neutral: "border-line-1 bg-surface-1",
  success: "border-success/30 bg-success-soft",
  warning: "border-warning/40 bg-warning-soft",
  danger: "border-danger/30 bg-danger-soft",
  info: "border-info/30 bg-info-soft",
} as const;

export function StatusLine({ tone = "neutral", icon, children, action, className }: StatusLineProps) {
  return (
    <div role="status" className={cn("flex flex-col gap-3 rounded-card border px-4 py-3 sm:flex-row sm:items-center", STATUS_TONE[tone], className)}>
      {icon ? <span className="shrink-0 text-fg-1 [&_svg]:size-5" aria-hidden="true">{icon}</span> : null}
      <p className="flex-1 text-small text-fg-1">{children}</p>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LessonStepHeader — Watch / Read / Do / Check
// ---------------------------------------------------------------------------

const STEP_ICON: Record<LessonStep, typeof Play> = { watch: PlayCircle, read: BookOpen, do: PenLine, check: CheckCircle2 };

export interface LessonStepHeaderProps {
  title: string;
  current: LessonStep;
  done: Partial<Record<LessonStep, boolean>>;
  available?: LessonStep[];
  secondsLeft?: number;
  onStep?: (step: LessonStep) => void;
  onNext?: () => void;
  /** Next stays disabled until the current step is done; say why in `nextHint`. */
  nextDisabled?: boolean;
  nextLabel?: string;
  nextHint?: string;
  className?: string;
}

export function LessonStepHeader({ title, current, done, available, secondsLeft, onStep, onNext, nextDisabled, nextLabel = "Next", nextHint, className }: LessonStepHeaderProps) {
  const states = stepStates(current, done, available);
  return (
    <header className={cn("flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line-1 bg-surface-1 px-4 py-3", className)}>
      <div className="min-w-48 flex-1">
        <h1 className="truncate font-display text-h4 font-semibold text-fg-1 md:text-h3">{title}</h1>
        {secondsLeft !== undefined ? <p className="text-caption text-fg-2">{timeLeftLabel(secondsLeft)}</p> : null}
      </div>
      <nav aria-label="Lesson steps">
        <ol className="flex items-center gap-1">
          {LESSON_STEPS.map(({ id, label }, i) => {
            const state = states[id];
            if (state === "absent") return null;
            const Icon = state === "done" ? Check : state === "locked" ? Lock : STEP_ICON[id];
            return (
              <li key={id} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight className="hidden size-3.5 text-fg-3 sm:block" aria-hidden="true" /> : null}
                  <button
                    type="button"
                    disabled={state === "locked" || !onStep}
                    onClick={() => onStep?.(id)}
                    aria-current={id === current ? "step" : undefined}
                    className={cn(
                      "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-small font-medium transition-colors duration-120",
                      state === "current" && "bg-brand text-on-brand",
                      state === "done" && "bg-success-soft text-success-fg",
                      state === "todo" && "text-fg-1 hover:bg-sunken",
                      state === "locked" && "cursor-not-allowed text-fg-3",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {/* On a phone only the current step keeps its visible label; the rest stay named for screen readers. */}
                    <span className={id === current ? undefined : "sr-only sm:not-sr-only"}>{label}</span>
                    <span className="sr-only">{state === "done" ? " (done)" : state === "locked" ? " (finish the earlier steps first)" : ""}</span>
                  </button>
              </li>
            );
          })}
        </ol>
      </nav>
      {onNext ? (
        <div className="flex items-center gap-2">
          {nextDisabled && nextHint ? <span className="text-caption text-fg-2">{nextHint}</span> : null}
          <Button variant="primary" onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </header>
  );
}

// ---------------------------------------------------------------------------
// VideoPlayerFrame + PlaylistSidebar (presentational; the lesson agent wires the YouTube hook)
// ---------------------------------------------------------------------------

export interface VideoPlayerFrameProps {
  title: string;
  /** The player element (the YouTube iframe host). Until it's ready, a poster + play button shows. */
  children?: ReactNode;
  poster?: string;
  ready?: boolean;
  onPlay?: () => void;
  /** Under the player: speed, captions, notes. */
  controls?: ReactNode;
  className?: string;
}

export function VideoPlayerFrame({ title, children, poster, ready = true, onPlay, controls, className }: VideoPlayerFrameProps) {
  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <div className="relative aspect-video w-full overflow-hidden rounded-card bg-[rgb(9_12_17)] shadow-e2">
        {ready && children ? children : null}
        {!ready || !children ? (
          <div className="absolute inset-0 grid place-items-center">
            {poster ? <img src={poster} alt="" className="absolute inset-0 size-full object-cover opacity-70" /> : null}
            {onPlay ? (
              <button
                type="button"
                onClick={onPlay}
                className="relative grid size-16 place-items-center rounded-full bg-white/95 text-[rgb(17_24_39)] shadow-e3 transition-transform duration-120 hover:scale-105"
                aria-label={`Play ${title}`}
              >
                <Play className="ml-1 size-7" fill="currentColor" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <figcaption className="sr-only">{title}</figcaption>
      {controls ? <div className="flex flex-wrap items-center gap-2">{controls}</div> : null}
    </figure>
  );
}

export interface PlaylistEntry {
  id: string;
  title: string;
  durationSec?: number;
  thumbnail?: string;
  watched?: boolean;
  /** 0–1 for a partly watched video. */
  progress?: number;
}

export function PlaylistSidebar({ entries, currentId, onSelect, label = "Videos in this lesson", className }: { entries: PlaylistEntry[]; currentId?: string; onSelect?: (id: string) => void; label?: string; className?: string }) {
  const watched = entries.filter((e) => e.watched).length;
  return (
    <section aria-label={label} className={cn("flex flex-col rounded-card border border-line-1 bg-surface-1", className)}>
      <div className="flex items-baseline justify-between border-b border-line-1 px-4 py-3">
        <h2 className="font-display text-small font-semibold text-fg-1">{label}</h2>
        <span className="text-caption text-fg-2">
          {watched} of {entries.length} watched
        </span>
      </div>
      <ol className="flex flex-col gap-0.5 p-1.5">
        {entries.map((e, i) => {
          const current = e.id === currentId;
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onSelect?.(e.id)}
                aria-current={current ? "true" : undefined}
                className={cn("flex w-full items-center gap-3 rounded-control p-2 text-left transition-colors duration-120", current ? "bg-brand-soft" : "hover:bg-sunken")}
              >
                <span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-sunken">
                  {e.thumbnail ? <img src={e.thumbnail} alt="" className="size-full object-cover" loading="lazy" /> : null}
                  {e.progress && !e.watched ? (
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
                      <span className="block h-full bg-brand" style={{ width: `${Math.round(e.progress * 100)}%` }} />
                    </span>
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("line-clamp-2 text-small font-medium", current ? "text-brand-fg" : "text-fg-1")}>
                    <span className="sr-only">{i + 1}. </span>
                    {e.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-caption text-fg-2">
                    {e.durationSec ? formatClock(e.durationSec) : null}
                    {e.watched ? (
                      <span className="inline-flex items-center gap-0.5 text-success-fg">
                        <Check className="size-3" aria-hidden="true" /> Watched
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FeedbackPanel — what's right, what to fix, why
// ---------------------------------------------------------------------------

export interface FeedbackPanelProps {
  verdict: "pass" | "almost" | "fail";
  right?: ReactNode[];
  fix?: ReactNode[];
  why?: ReactNode;
  action?: ReactNode;
  className?: string;
}

const VERDICT = {
  pass: { title: "That works", tone: "border-success/40 bg-success-soft", icon: CheckCircle2, iconCls: "text-success-fg" },
  almost: { title: "Nearly there", tone: "border-warning/50 bg-warning-soft", icon: TriangleAlert, iconCls: "text-warning-fg" },
  fail: { title: "Not yet", tone: "border-danger/40 bg-danger-soft", icon: XCircle, iconCls: "text-danger-fg" },
} as const;

export function FeedbackPanel({ verdict, right = [], fix = [], why, action, className }: FeedbackPanelProps) {
  const v = VERDICT[verdict];
  const Icon = v.icon;
  return (
    <section aria-live="polite" aria-label="Feedback" className={cn("rounded-card border p-(--v5-card-pad)", v.tone, className)}>
      <h3 className="flex items-center gap-2 font-display text-h4 font-semibold text-fg-1">
        <Icon className={cn("size-5", v.iconCls)} aria-hidden="true" />
        {v.title}
      </h3>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {right.length ? (
          <div>
            <h4 className="text-small font-semibold text-success-fg">What's right</h4>
            <ul className="mt-1 flex flex-col gap-1 text-small text-fg-1">
              {right.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success-fg" aria-hidden="true" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {fix.length ? (
          <div>
            <h4 className="text-small font-semibold text-danger-fg">What to fix</h4>
            <ul className="mt-1 flex flex-col gap-1 text-small text-fg-1">
              {fix.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      {why ? (
        <div className="mt-4 rounded-control bg-surface-1/70 p-3">
          <h4 className="flex items-center gap-1.5 text-small font-semibold text-fg-1">
            <Lightbulb className="size-4 text-warning-fg" aria-hidden="true" /> Why
          </h4>
          <div className="mt-1 text-small text-fg-1">{why}</div>
        </div>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
