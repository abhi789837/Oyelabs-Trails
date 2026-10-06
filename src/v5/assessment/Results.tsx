import { ArrowRight, Check, ChevronDown, CircleDashed, Undo2 } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { AssessmentResultsResponse, GoalLevels, ReviewItem } from "@shared/assessmentResults";

import { ApiRequestError } from "@/api/client";
import { RichText } from "@/components/content/RichText";
import { Button } from "@/v5/design/components/Button";
import { Card } from "@/v5/design/components/Card";
import { Field, Textarea } from "@/v5/design/components/Field";
import { Dialog } from "@/v5/design/components/Overlays";
import { Badge } from "@/v5/design/components/Primitives";
import { SkillMeter } from "@/v5/design/components/Stats";
import { ContourBackground, ErrorState } from "@/v5/design/components/States";
import { Logo } from "@/v5/design/components/Showcase";
import { cn } from "@/v5/design/cn";
import { usePrefersReducedMotion } from "@/v5/design/hooks";

import { resultsApi } from "./api";
import { Spinner } from "./Frame";
import { answerWords, plainReasonSentence, reviewCounts, storyFrom, VERDICT_WORDS } from "./story";

/**
 * The results: a short story ("You're strong at X. We'll start with Y because Z."), skill levels by
 * goal, every question to look back over (when the admin allows it), "Request review" on Not-yet
 * answers, and one clear next step: "Your plan is ready".
 */
export default function Results() {
  const [data, setData] = useState<AssessmentResultsResponse | null>(null);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setFailed(false);
    resultsApi
      .results()
      .then(setData)
      .catch(() => setFailed(true));
  };
  useEffect(load, []);

  if (failed) {
    return (
      <Page>
        <ErrorState title="We couldn't load your results" body="Check your connection and try again." onRetry={load} />
      </Page>
    );
  }
  if (!data) {
    return (
      <Page>
        <Spinner label="Loading your results" />
      </Page>
    );
  }
  if (!data.released || !data.result) {
    return (
      <Page>
        <h1 className="font-display text-h2 font-semibold">Your results are nearly ready</h1>
        <p className="mt-2 text-body text-fg-2">We're still marking a few answers. This page will have them soon.</p>
        <PlanReadyButton />
      </Page>
    );
  }
  return <ResultsBody data={data} onChanged={setData} />;
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-surface-0 text-fg-1">
      <ContourBackground seed={11} className="-z-10 h-[28rem] opacity-70" />
      <div className="mx-auto flex w-full max-w-4xl flex-col px-4 pb-20 pt-8 sm:px-6 md:pt-12">
        <Logo className="mb-10 h-8" />
        {children}
      </div>
    </main>
  );
}

function finishedLine(seconds: number | null): string | null {
  if (!seconds) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `You finished in about ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
}

function ResultsBody({ data, onChanged }: { data: AssessmentResultsResponse; onChanged: (next: AssessmentResultsResponse) => void }) {
  const story = storyFrom(data)!;
  const result = data.result!;
  const finished = finishedLine(data.assessment?.finishedSeconds ?? null);

  return (
    <Page>
      <section aria-labelledby="results-title">
        <p className="text-small font-medium text-brand-fg">Your test results</p>
        <h1 id="results-title" className="mt-1 font-display text-h1 font-semibold text-fg-1">
          {story.sentences[0]}
        </h1>
        <p className="mt-3 max-w-prose text-lead text-fg-2">{story.sentences[1]}</p>
        {finished ? <p className="mt-2 text-small text-fg-2">{finished}</p> : null}
        <PlanReadyButton />
      </section>

      {data.firstSteps.length ? (
        <section aria-labelledby="first-steps" className="mt-12">
          <h2 id="first-steps" className="font-display text-h3 font-semibold">
            Your first steps
          </h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            {data.firstSteps.map((s, i) => (
              <li key={`${s.title}-${i}`}>
                <Card className="h-full">
                  <p className="text-caption font-medium text-fg-2">Step {i + 1}</p>
                  <p className="mt-1 font-display text-h4 font-semibold text-fg-1">{s.title}</p>
                  {s.reason ? <p className="mt-1 text-small text-fg-2">{plainReasonSentence(s.reason)}</p> : null}
                </Card>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="levels" className="mt-12">
        <h2 id="levels" className="font-display text-h3 font-semibold">
          Your skill levels
        </h2>
        <p className="mt-1 text-small text-fg-2">Levels go from 0 to 5. The outline shows the level each goal needs.</p>
        <GoalSkills goals={data.goals} result={result} />
      </section>

      <section aria-labelledby="answers" className="mt-12">
        <h2 id="answers" className="font-display text-h3 font-semibold">
          Look back at your answers
        </h2>
        {data.items ? (
          <AnswerList items={data.items} onReviewed={(id) => onChanged({ ...data, items: data.items!.map((i) => (i.id === id ? { ...i, reviewStatus: "requested", canRequestReview: false } : i)) })} />
        ) : (
          <p className="mt-2 text-small text-fg-2">{data.itemsHidden ? "Your company keeps the questions private, so only your levels are shown." : "Your answers show here once they're marked."}</p>
        )}
      </section>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// Skill levels by goal
// ---------------------------------------------------------------------------

function GoalSkills({ goals, result }: { goals: GoalLevels[]; result: NonNullable<AssessmentResultsResponse["result"]> }) {
  const withSkills = goals.filter((g) => g.skills.length);
  if (!withSkills.length) {
    const skills = result.skills.filter((s) => s.level !== null);
    return (
      <Card className="mt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {skills.map((s) => (
            <SkillMeter key={s.skillId} label={s.skillName} level={s.level ?? 0} />
          ))}
        </div>
      </Card>
    );
  }
  return (
    <div className="mt-4 grid gap-4">
      {withSkills.map((goal) => (
        <Card key={goal.id}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-h4 font-semibold text-fg-1">{goal.title}</h3>
            {goal.achieved ? (
              <Badge tone="success">
                <Check aria-hidden="true" />
                Reached
              </Badge>
            ) : (
              <Badge tone="outline">Aim: level {goal.targetLevel}</Badge>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {goal.skills.map((s) =>
              s.level === null ? (
                <div key={s.skillId} className="flex flex-col gap-1.5 text-small">
                  <span className="font-medium text-fg-1">{s.name}</span>
                  <span className="text-fg-2">Not measured in this test</span>
                </div>
              ) : (
                <SkillMeter key={s.skillId} label={s.source === "inferred" ? `${s.name} (estimated)` : s.name} level={s.level} target={goal.targetLevel} />
              ),
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------

const VERDICT_TONE = { full: "success", not_yet: "warning", waiting: "neutral" } as const;

function AnswerList({ items, onReviewed }: { items: ReviewItem[]; onReviewed: (id: string) => void }) {
  const [onlyNotYet, setOnlyNotYet] = useState(false);
  const [requesting, setRequesting] = useState<ReviewItem | null>(null);
  const counts = reviewCounts(items);
  const shown = onlyNotYet ? items.filter((i) => i.verdict === "not_yet") : items;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-fg-2">
          {counts.full} full marks, {counts.notYet} not yet{counts.waiting ? `, ${counts.waiting} still being marked` : ""}.
        </p>
        <div role="group" aria-label="Show" className="flex gap-1">
          {[
            { id: false, label: "All" },
            { id: true, label: "Not yet only" },
          ].map((f) => (
            <button
              key={String(f.id)}
              type="button"
              aria-pressed={onlyNotYet === f.id}
              onClick={() => setOnlyNotYet(f.id)}
              className={cn(
                "min-h-8 rounded-full border px-3 text-small font-medium",
                onlyNotYet === f.id ? "border-brand bg-brand-soft text-brand-fg" : "border-line-1 text-fg-2 hover:bg-sunken hover:text-fg-1",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <ol className="mt-4 flex flex-col gap-3" aria-label="Your answers">
        {shown.map((item) => (
          <AnswerRow key={item.id} item={item} onRequest={() => setRequesting(item)} />
        ))}
      </ol>
      <RequestReviewDialog
        item={requesting}
        onClose={() => setRequesting(null)}
        onDone={(id) => {
          onReviewed(id);
          setRequesting(null);
        }}
      />
    </div>
  );
}

function AnswerRow({ item, onRequest }: { item: ReviewItem; onRequest: () => void }) {
  const [open, setOpen] = useState(false);
  const panelId = `answer-${item.id}`;
  return (
    <li className="rounded-card border border-line-1 bg-surface-1 shadow-e1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-card px-4 py-3 text-left hover:bg-sunken/60"
      >
        <span className="font-mono text-small tabular-nums text-fg-2">{item.number}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-small font-medium text-fg-1">{item.skillName}</span>
          <span className="block text-caption text-fg-2">{item.kindLabel}</span>
        </span>
        <Badge tone={VERDICT_TONE[item.verdict]}>{VERDICT_WORDS[item.verdict]}</Badge>
        <ChevronDown className={cn("size-4 shrink-0 text-fg-2 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
        <span className="sr-only">{open ? "Hide" : "Show"} question {item.number}</span>
      </button>
      {open ? (
        <div id={panelId} className="border-t border-line-1 px-4 pb-4 pt-3">
          <RichText text={item.prompt} size="sm" className="max-w-prose text-fg-1" />
          {item.options ? (
            <ul className="mt-3 flex flex-col gap-1.5" aria-label="Options">
              {item.options.map((option, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-start gap-2 rounded-control border px-3 py-2 text-small",
                    i === item.correct ? "border-success/40 bg-success-soft" : i === item.chosen ? "border-warning/40 bg-warning-soft" : "border-line-1",
                  )}
                >
                  <span className="min-w-0 flex-1">{option}</span>
                  {i === item.correct ? <span className="shrink-0 text-caption font-medium text-success-fg">Right answer</span> : null}
                  {i === item.chosen ? <span className="shrink-0 text-caption font-medium text-fg-1">Your answer</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3">
              <p className="text-caption font-medium text-fg-2">Your answer</p>
              <p className={cn("mt-1 whitespace-pre-wrap rounded-control bg-sunken px-3 py-2 text-small text-fg-1", item.type === "coding" && "font-mono")}>{answerWords(item)}</p>
            </div>
          )}
          {item.options && (item.unknown || item.unanswered) ? <p className="mt-2 text-small text-fg-2">{answerWords(item)}</p> : null}
          {item.explanation ? (
            <div className="mt-3">
              <p className="text-caption font-medium text-fg-2">Why</p>
              <p className="mt-1 text-small text-fg-1">{item.explanation}</p>
            </div>
          ) : null}
          {item.tip ? <p className="mt-2 text-small text-fg-2">Tip: {item.tip}</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {item.canRequestReview ? (
              <Button variant="secondary" size="sm" onClick={onRequest}>
                Request review
              </Button>
            ) : null}
            {item.reviewStatus === "requested" ? (
              <span role="status" className="inline-flex items-center gap-1 text-small text-fg-2">
                <CircleDashed className="size-4" aria-hidden="true" />
                Review requested. We'll tell you the outcome.
              </span>
            ) : null}
            {item.reviewStatus === "overridden" ? <span className="text-small text-success-fg">Reviewed: changed to Full marks.</span> : null}
            {item.reviewStatus === "upheld" ? <span className="text-small text-fg-2">Reviewed: stays Not yet.</span> : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

function RequestReviewDialog({ item, onClose, onDone }: { item: ReviewItem | null; onClose: () => void; onDone: (id: string) => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setNote("");
    setError(null);
  }, [item?.id]);

  const send = async () => {
    if (!item || busy) return;
    setBusy(true);
    setError(null);
    try {
      await resultsApi.requestReview(item.id, note.trim());
      onDone(item.id);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "That didn't send. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={item ? `Ask for a review of question ${item.number}` : ""}
      description="A person from your team reads your answer again. If they agree with you, it becomes Full marks and your levels update."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            <Undo2 aria-hidden="true" />
            Cancel
          </Button>
          <Button variant="primary" loading={busy} onClick={() => void send()}>
            Send the request
          </Button>
        </>
      }
    >
      <Field label="Why you think it deserves full marks" optional error={error ?? undefined}>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} rows={3} />
      </Field>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// "Your plan is ready"
// ---------------------------------------------------------------------------

/**
 * The one call to action. It draws a short trail up to a summit, then opens the plan. Under reduced
 * motion it goes straight there. Skippable: a second press (or Escape) navigates at once.
 */
function PlanReadyButton() {
  const navigate = useNavigate();
  const reduce = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);
  const go = useMemo(() => () => navigate("/learn/plan"), [navigate]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(go, 1100);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") go();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [playing, go]);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="primary" size="lg" onClick={() => (reduce || playing ? go() : setPlaying(true))}>
          Your plan is ready
          <ArrowRight aria-hidden="true" />
        </Button>
        <span className="text-small text-fg-2">Opens your trail, step by step.</span>
      </div>
      <AnimatePresence>
        {playing ? (
          <m.div
            className="fixed inset-0 z-50 grid place-items-center bg-surface-0/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
            onClick={go}
            data-testid="plan-ready-animation"
          >
            <div className="flex flex-col items-center gap-4 px-6 text-center">
              <svg viewBox="0 0 240 120" className="h-28 w-60" aria-hidden="true">
                <m.path
                  d="M10 110 C 60 105, 70 70, 110 72 S 170 40, 200 22"
                  fill="none"
                  className="stroke-brand"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray="1 9"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <m.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.7, duration: 0.3 }} style={{ transformOrigin: "205px 20px" }}>
                  <circle cx="205" cy="20" r="14" className="fill-success" />
                </m.g>
              </svg>
              <p className="font-display text-h2 font-semibold text-fg-1">Your plan is ready</p>
              <p className="text-small text-fg-2">Opening your trail…</p>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
