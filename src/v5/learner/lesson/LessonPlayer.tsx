import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { m } from "motion/react";
import { CheckCircle2, ChevronRight, Flag, Keyboard, Maximize2, MessageCircle, Minimize2, RotateCw } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import type { CodeAttemptResult, QuizAttemptResult, ServedTopic } from "@shared/content";
import {
  canOpenStep,
  lessonComplete,
  minutesLeft,
  shortcutFor,
  stepRequirement,
  videosCleared,
  type LessonStatePutResponse,
  type LessonStateView,
  type LessonStepId,
  type StepDone,
  type StepFacts,
} from "@shared/lessonCore";

import type { TopicVideos } from "@/features/videos/useTopicVideos";
import { api } from "@/api/client";
import { findTopic, topicNeighbors, type TopicMeta } from "@/content";
import { useProgressStore } from "@/store/progressStore";
import { cn } from "@/v5/design/cn";
import { Button } from "@/v5/design/components/Button";
import { LessonStepHeader, StatusLine } from "@/v5/design/components/Lesson";
import { SkeletonLayout } from "@/v5/design/components/States";
import { afterLoadIdle } from "@/v5/app/afterLoad";
import { useIsMobile } from "@/v5/design/hooks";
import { duration, easing } from "@/v5/design/motion";

import { WatchStep, type WatchControls } from "./steps/WatchStep";
import { planNextTopicId, resumePoint } from "./lessonLinks";
import { lessonToast } from "./toast";
import { useLessonSave } from "./useLessonSave";
import { plainTitle } from "@shared/plainTitle";

// Only Watch (the usual first step) is in the lesson's first download; every other step, the
// dialogs and Ask Oye load when they're first needed.
const ReadStep = lazy(() => import("./steps/ReadStep").then((mod) => ({ default: mod.ReadStep })));
const CheckStep = lazy(() => import("./steps/CheckStep").then((mod) => ({ default: mod.CheckStep })));
const QuickCheckDialog = lazy(() => import("./LessonDialogs").then((mod) => ({ default: mod.QuickCheckDialog })));
const ReportProblemDialog = lazy(() => import("./LessonDialogs").then((mod) => ({ default: mod.ReportProblemDialog })));
const ShortcutsDialog = lazy(() => import("./LessonDialogs").then((mod) => ({ default: mod.ShortcutsDialog })));
const Celebration = lazy(() => import("@/v5/design/components/Showcase").then((mod) => ({ default: mod.Celebration })));
const CodeDo = lazy(() => import("./steps/CodeDo"));
const TaskDo = lazy(() => import("./steps/TaskDo"));
const TutorDock = lazy(() => import("./TutorDock"));
const SpeakPracticeSection = lazy(() => import("@/components/tasks/SpeakPracticeSection").then((mod) => ({ default: mod.SpeakPracticeSection })));

const STEP_IDS = new Set<LessonStepId>(["watch", "read", "do", "check"]);

export interface LessonPlayerProps {
  topic: ServedTopic;
  initial: LessonStateView;
  videos: TopicVideos;
}

/**
 * The v5 lesson player (`/learn/lesson/:topicId?step=watch|read|do|check&t=<sec>`).
 *
 * One stepper for the topic's steps, a Next button that waits for each step's rule
 * (`shared/lesson.ts` `stepRequirement`), autosave and resume (`lesson_state`), focus mode, keyboard
 * shortcuts, "Report a problem", Ask Oye, a quick check after the video, and a short celebration
 * when the lesson is finished.
 */
export function LessonPlayer({ topic, initial, videos }: LessonPlayerProps) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState(initial);
  const available = view.available;
  // Phase 8: a step whose rule is met counts as done at once (Next opens), and rolls back if the
  // server doesn't save or doesn't agree. The server still checks every claim before any XP.
  const [optimistic, setOptimistic] = useState<Partial<StepDone>>({});
  const [saveFailed, setSaveFailed] = useState<LessonStepId | null>(null);
  const done = useMemo<StepDone>(() => ({ ...view.stepDone, ...optimistic }), [view.stepDone, optimistic]);
  const mobile = useIsMobile();

  const urlStep = params.get("step") as LessonStepId | null;
  const [step, setStep] = useState<LessonStepId>(() =>
    urlStep && STEP_IDS.has(urlStep) && canOpenStep(urlStep, available, done) ? urlStep : canOpenStep(view.step, available, done) ? view.step : available[0],
  );
  // `&video=` (note links) picks the video when a lesson has several; `&t=` the moment in it.
  const resume = useMemo(
    () => resumePoint({ video: params.get("video"), t: params.get("t") }, { videoId: view.videoId, positionSec: view.positionSec }),
    // The starting point is read once.
    [],
  );

  const [readToEnd, setReadToEnd] = useState(done.read);
  const [task, setTask] = useState({ passed: false, attempts: 0 });
  const [speakSent, setSpeakSent] = useState(false);
  const [focus, setFocus] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const quickSeen = useRef(false);
  const advanceAfterQuick = useRef(false);
  const [focusPassage, setFocusPassage] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const opened = useEverOpened({ quick: quickOpen, help: helpOpen, report: reportOpen, celebrate });
  const watchRef = useRef<WatchControls>(null);
  const codeRef = useRef<string | undefined>(undefined);
  const topRef = useRef<HTMLDivElement>(null);

  // XP for a step shows next to Next (Phase 8), not as a toast: a bottom-corner toast sat on top of
  // the Next button, and hovering it kept it there.
  const [stepXp, setStepXp] = useState<{ step: LessonStepId; xp: number } | null>(null);
  const onSaved = useCallback((res: LessonStatePutResponse) => {
    setView(res.state);
    const xp = res.awarded.reduce((sum, a) => sum + a.xp, 0);
    if (res.justCompleted) setCelebrate(true);
    else if (xp > 0) setStepXp({ step: res.state.step, xp });
  }, []);
  const { save } = useLessonSave(topic.id, onSaved);

  const hasQuiz = (topic.quiz?.length ?? 0) > 0;
  const isCode = topic.challengeType === "code" && Boolean(topic.codeChallenge);
  const facts: StepFacts = {
    videosCleared: videosCleared(videos.data),
    readToEnd,
    doPassed: isCode ? view.facts.codePassed : task.passed || view.facts.solutionTraded,
    doAttempts: isCode ? view.facts.codeAttempts : task.attempts,
    speakSent: !isCode && !topic.practice ? speakSent : false,
    checkPassed: view.facts.quizPassed,
  };
  const requirement = stepRequirement(step, facts);

  // Fetch the other steps' code once the page has loaded and the browser is idle, so Next doesn't
  // wait on a download. Phase 9 performance: only the steps this lesson has (a lesson without a Do
  // step used to pull the task kinds, the spreadsheet grid and zod into its first seconds), and only
  // after the load event, so they don't compete with the video poster.
  const hasRead = available.includes("read");
  const hasDo = available.includes("do");
  const hasCheck = available.includes("check");
  useEffect(() => {
    const warm = () => {
      if (hasRead) void import("./steps/ReadStep");
      if (hasDo) {
        if (isCode) void import("./steps/CodeDo");
        else void import("./steps/TaskDo");
      }
      if (hasCheck) void import("./steps/CheckStep");
    };
    return afterLoadIdle(warm, 4000);
  }, [isCode, hasRead, hasDo, hasCheck]);

  // When the current step's rule is met, tell the server (it checks again before any XP). The step
  // shows as done straight away; a failed save or a "no" from the server rolls it back.
  const requested = useRef(new Set<string>());
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (!requirement.met || done[step]) return;
    const key = `${step}:${JSON.stringify(facts)}`;
    if (requested.current.has(key)) return;
    requested.current.add(key);
    lastKey.current = key;
    const target = step;
    setOptimistic((o) => ({ ...o, [target]: true }));
    setSaveFailed(null);
    void save({ step, stepDone: { [step]: true }, ...(step === "do" && !isCode ? { doAttempts: task.attempts } : {}) }, true).then((res) => {
      setOptimistic((o) => {
        const next = { ...o };
        delete next[target];
        return next;
      });
      if (!res) {
        setSaveFailed(target);
        lessonToast.error("That step didn't save", "Check your connection, then press Try again.");
      } else if (!res.state.stepDone[target]) {
        lessonToast.info("We couldn't confirm this step yet", "Finish what the step asks for, then Next opens.");
      }
    });
  });
  const retrySave = () => {
    if (lastKey.current) requested.current.delete(lastKey.current);
    setSaveFailed(null);
  };

  const stepChanged = useRef(false);
  const goTo = useCallback(
    (next: LessonStepId) => {
      stepChanged.current = true;
      setStep(next);
      setParams(
        (p) => {
          const n = new URLSearchParams(p);
          n.set("step", next);
          n.delete("t");
          n.delete("video");
          return n;
        },
        { replace: true },
      );
      void save({ step: next }, true);
      const reduce = document.documentElement.dataset.motion === "reduce" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      topRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    },
    [save, setParams],
  );

  const order = available;
  const index = order.indexOf(step);
  const nextStepId = index >= 0 && index < order.length - 1 ? order[index + 1] : null;
  const complete = lessonComplete(available, done);
  const nextTopic = useNextTopic(topic.id);

  const advance = () => {
    if (!nextStepId) return;
    if (step === "watch" && hasQuiz && !quickSeen.current) {
      quickSeen.current = true;
      advanceAfterQuick.current = true;
      setQuickOpen(true);
      return;
    }
    goTo(nextStepId);
  };

  const onVideoEnded = (allWatched: boolean) => {
    if (allWatched && hasQuiz && !quickSeen.current) {
      quickSeen.current = true;
      setQuickOpen(true);
    }
  };

  const onCite = (passageId: string) => {
    if (!available.includes("read")) return;
    if (!canOpenStep("read", available, done)) {
      lessonToast.info("Finish the earlier step first", "Then the reading opens and you can see this part.");
      return;
    }
    setFocusPassage(null);
    goTo("read");
    requestAnimationFrame(() => setFocusPassage(passageId));
  };

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"]') && e.key !== "Escape") return;
      const target = e.target as HTMLElement | null;
      if (e.key === "Escape" && focus && !document.querySelector('[role="dialog"]')) {
        setFocus(false);
        return;
      }
      const action = shortcutFor(
        { key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, targetTag: target?.tagName, targetRole: target?.getAttribute("role"), targetEditable: target?.isContentEditable },
        step,
      );
      if (!action) return;
      e.preventDefault();
      switch (action) {
        case "help":
          setHelpOpen(true);
          break;
        case "focus":
          setFocus((f) => !f);
          break;
        case "togglePlay":
          watchRef.current?.togglePlay();
          break;
        case "back10":
          watchRef.current?.seekBy(-10);
          break;
        case "forward10":
          watchRef.current?.seekBy(10);
          break;
        case "back5":
          watchRef.current?.seekBy(-5);
          break;
        case "forward5":
          watchRef.current?.seekBy(5);
          break;
        case "note":
          watchRef.current?.noteNow();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, focus]);

  const onCodeChecked = useCallback(
    (result: CodeAttemptResult) => {
      setView((v) => ({ ...v, facts: { ...v.facts, codeAttempts: v.facts.codeAttempts + 1, codePassed: v.facts.codePassed || result.passed } }));
    },
    [],
  );
  const onQuizGraded = (result: QuizAttemptResult) => {
    if (result.passed) setView((v) => ({ ...v, facts: { ...v.facts, quizPassed: true } }));
  };

  const xpNote = stepXp && stepXp.step === step ? ` +${stepXp.xp} XP` : "";
  const secondsLeft = minutesLeft(topic.estMinutes, available, done) * 60;
  const isLast = nextStepId === null;
  const headerNext = isLast
    ? complete
      ? { label: nextTopic ? "Next lesson" : "Back to my plan", disabled: false, onNext: () => navigate(nextTopic ? `/learn/lesson/${encodeURIComponent(nextTopic.id)}` : "/learn/plan") }
      : { label: "Finish", disabled: true, onNext: () => undefined }
    : { label: "Next", disabled: !done[step], onNext: advance };

  const stepBody = () => {
    switch (step) {
      case "watch":
        return (
          <WatchStep
            ref={watchRef}
            topic={topic}
            videos={videos}
            resume={resume}
            onPosition={(videoId, seconds) => void save({ videoId, positionSec: Math.round(seconds * 10) / 10 })}
            onVideoEnded={onVideoEnded}
          />
        );
      case "read":
        return (
          <Suspense fallback={<SkeletonLayout variant="article" label="Loading the reading" />}>
            <ReadStep topic={topic} done={done.read} onReadToEnd={() => setReadToEnd(true)} focusPassage={focusPassage} />
          </Suspense>
        );
      case "do":
        return (
          <div className="flex flex-col gap-6">
            <Suspense fallback={<SkeletonLayout variant="lesson" label="Loading the practice" />}>
              {isCode && topic.codeChallenge ? (
                <CodeDo
                  topic={topic}
                  challenge={topic.codeChallenge}
                  facts={view.facts}
                  onChecked={onCodeChecked}
                  onSolutionTraded={() => setView((v) => ({ ...v, facts: { ...v.facts, solutionTraded: true } }))}
                  onCodeChange={(c) => {
                    codeRef.current = c;
                  }}
                />
              ) : topic.practice ? (
                <TaskDo
                  task={topic.practice}
                  done={done.do}
                  attempts={task.attempts}
                  traded={view.facts.solutionTraded}
                  onChecked={(passed, attempts) => setTask((t) => ({ passed: t.passed || passed, attempts }))}
                  onTrade={() => {
                    setView((v) => ({ ...v, facts: { ...v.facts, solutionTraded: true } }));
                    void save({ solutionTraded: true, stepDone: { do: true }, doAttempts: task.attempts }, true);
                  }}
                  onSelfDone={() => setTask((t) => ({ ...t, passed: true }))}
                />
              ) : null}
              {topic.speak ? (
                <section aria-labelledby="speak-heading" className="rounded-card border border-line-1 bg-surface-1 p-4">
                  <h2 id="speak-heading" className="font-display text-h4 font-semibold text-fg-1">
                    Say it out loud
                  </h2>
                  <p className="mt-1 text-small text-fg-2">Record your answer and get advice on how it lands. No microphone? Type it instead.</p>
                  <div className="mt-4">
                    <SpeakPracticeSection topicId={topic.id} practice={topic.speak} />
                  </div>
                  {!isCode && !topic.practice ? (
                    <Button className="mt-4" variant={done.do ? "secondary" : "primary"} disabled={done.do} onClick={() => setSpeakSent(true)}>
                      <CheckCircle2 aria-hidden="true" /> {done.do ? "Done" : "I've practised this"}
                    </Button>
                  ) : null}
                </section>
              ) : null}
            </Suspense>
          </div>
        );
      case "check":
        return (
          <Suspense fallback={<SkeletonLayout variant="article" label="Loading the test" />}>
            <CheckStep topic={topic} questions={topic.quiz ?? []} videos={videos.data} onGoWatch={() => goTo("watch")} onGraded={onQuizGraded} passedBefore={done.check} />
          </Suspense>
        );
    }
  };

  return (
    <div
      ref={topRef}
      // `[&_.bg-editor-gutter.border-b]`: the shared code block's language label is 11px; 12px in v5.
      className={cn("flex flex-col bg-surface-0 text-fg-1 [&_.bg-editor-gutter.border-b]:text-caption", focus ? "fixed inset-0 z-40 overflow-y-auto" : "min-h-full")}
      data-testid="v5-lesson"
      data-focus-mode={focus ? "on" : "off"}
      {...(focus ? { role: "region", "aria-label": "Lesson in focus mode" } : {})}
    >
      <LessonStepHeader
        className={cn("sticky z-20", focus ? "top-0" : "top-14")}
        title={plainTitle(topic.title)}
        current={step}
        done={done}
        available={available}
        secondsLeft={secondsLeft}
        onStep={(s) => (canOpenStep(s, available, done) ? goTo(s) : undefined)}
        // On a phone, Next lives in the bar at the bottom, where the thumb is.
        onNext={mobile ? undefined : headerNext.onNext}
        nextDisabled={headerNext.disabled}
        nextLabel={headerNext.label}
        nextHint={headerNext.disabled ? requirement.hint : undefined}
      />

      <div className="flex flex-wrap items-center gap-1 border-b border-line-1 bg-surface-1 px-4 py-1.5 max-md:px-2 max-md:py-1">
        <Button size="sm" variant="ghost" className="max-md:min-h-11" onClick={() => setTutorOpen(true)} aria-haspopup="dialog">
          <MessageCircle aria-hidden="true" /> Ask Oye
        </Button>
        <Button size="sm" variant="ghost" className="max-md:min-h-11" onClick={() => setFocus((f) => !f)} aria-pressed={focus}>
          {focus ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          {/* One inline span, so the button's flex gap doesn't add to the space before "mode" (UX review W3). */}
          <span>
            {focus ? "Leave focus" : "Focus"}
            <span className="sr-only md:not-sr-only"> mode</span>
          </span>
        </Button>
        {/* Keyboard shortcuts mean nothing on a touch screen. */}
        <Button size="sm" variant="ghost" className="max-md:hidden" onClick={() => setHelpOpen(true)}>
          <Keyboard aria-hidden="true" /> Shortcuts
        </Button>
        <Button size="sm" variant="ghost" className="ml-auto max-md:min-h-11" onClick={() => setReportOpen(true)}>
          <Flag aria-hidden="true" />
          <span>
            Report<span className="sr-only md:not-sr-only"> a problem</span>
          </span>
        </Button>
      </div>

      <m.div
        key={step}
        // The first step shows at once; changing step fades the new one in (Phase 9 performance).
        initial={stepChanged.current ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.quick, ease: [...easing.out] as [number, number, number, number] }}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-6"
      >
        {stepBody()}

        {mobile ? (
          <div
            data-testid="lesson-next-bar"
            data-sticky-bar
            className={cn(
              "sticky z-20 -mx-4 mt-6 flex items-center gap-3 border-t border-line-1 bg-surface-1/95 px-4 py-2.5 backdrop-blur",
              focus ? "bottom-0 pb-[calc(0.625rem+env(safe-area-inset-bottom))]" : "bottom-[calc(4rem+env(safe-area-inset-bottom))]",
            )}
          >
            {saveFailed === step ? (
              <>
                <p role="alert" className="min-w-0 flex-1 text-small font-medium text-danger-fg">
                  That step didn't save.
                </p>
                <Button variant="secondary" className="min-h-11 shrink-0" onClick={retrySave}>
                  <RotateCw aria-hidden="true" /> Try again
                </Button>
              </>
            ) : (
              <p className="min-w-0 flex-1 text-caption text-fg-2" aria-live="polite">
                {isLast && complete ? (nextTopic ? `Lesson finished. Up next: ${plainTitle(nextTopic.title)}.` : "Lesson finished.") : !done[step] ? requirement.hint : `Step done.${xpNote}`}
              </p>
            )}
            <Button variant="primary" className="min-h-11 shrink-0" onClick={headerNext.onNext} disabled={headerNext.disabled}>
              {headerNext.label} <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3 border-t border-line-1 pt-4">
            {saveFailed === step ? (
              <StatusLine
                tone="danger"
                action={
                  <Button variant="secondary" onClick={retrySave}>
                    <RotateCw aria-hidden="true" /> Try again
                  </Button>
                }
              >
                That step didn't save. Check your connection, then try again.
              </StatusLine>
            ) : null}
            {isLast && complete ? (
              <StatusLine
                tone="success"
                icon={<CheckCircle2 />}
                action={
                  <Button variant="primary" asChild>
                    <Link to={nextTopic ? `/learn/lesson/${encodeURIComponent(nextTopic.id)}` : "/learn/plan"}>
                      {nextTopic ? "Next lesson" : "Back to my plan"} <ChevronRight aria-hidden="true" />
                    </Link>
                  </Button>
                }
              >
                Lesson finished. {nextTopic ? `Up next: ${plainTitle(nextTopic.title)}.` : "That's everything in this part of your plan."}
              </StatusLine>
            ) : !isLast ? (
              <div className="flex flex-wrap items-center justify-end gap-3">
                <span className="text-small text-fg-2" aria-live="polite">
                  {!done[step] ? requirement.hint : xpNote ? `Step done.${xpNote}` : null}
                </span>
                <Button variant="primary" onClick={advance} disabled={!done[step]}>
                  Next <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </m.div>

      {/* Each dialog's chunk loads the first time it opens, and it stays mounted for its close animation. */}
      <Suspense fallback={null}>
        {opened.quick ? (
          <QuickCheckDialog
            open={quickOpen}
            onOpenChange={setQuickOpen}
            topicId={topic.id}
            onClosed={() => {
              if (advanceAfterQuick.current && nextStepId) {
                advanceAfterQuick.current = false;
                goTo(nextStepId);
              }
            }}
          />
        ) : null}
        {opened.help ? <ShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} /> : null}
        {opened.report ? <ReportProblemDialog open={reportOpen} onOpenChange={setReportOpen} topicId={topic.id} step={step} /> : null}
      </Suspense>
      {tutorOpen ? (
        <Suspense fallback={null}>
          <TutorDock open={tutorOpen} onOpenChange={setTutorOpen} topicId={topic.id} step={step} getCode={() => codeRef.current} onCite={onCite} />
        </Suspense>
      ) : null}
      {opened.celebrate ? (
        <Suspense fallback={null}>
          <Celebration open={celebrate} onDone={() => setCelebrate(false)} title="Lesson finished" detail={nextTopic ? `Next up: ${plainTitle(nextTopic.title)}` : "Nice work."} />
        </Suspense>
      ) : null}
    </div>
  );
}

/** Which of these have ever been true (a lazy dialog mounts on first open and then stays). */
function useEverOpened<K extends string>(flags: Record<K, boolean>): Record<K, boolean> {
  const seen = useRef({} as Record<K, boolean>);
  for (const key of Object.keys(flags) as K[]) if (flags[key]) seen.current[key] = true;
  return seen.current;
}

// The plan's topic order, read once per page load (it changes only when an admin republishes).
let planOrder: Promise<string[]> | null = null;
function loadPlanOrder(): Promise<string[]> {
  planOrder ??= api
    .get<{ plan: { topicIds: string[] } | null }>("/api/me/plan")
    .then((r) => r.plan?.topicIds ?? [])
    .catch(() => {
      planOrder = null;
      return [];
    });
  return planOrder;
}

/**
 * "Next lesson" follows the learner's plan (Phase 9.2). The track's order was used before, which
 * ended a lesson on "Back to my plan" whenever the plan's next topic came earlier in the track.
 * Outside the plan (a library lesson) it falls back to the track order.
 */
function useNextTopic(topicId: string): TopicMeta | undefined {
  const progress = useProgressStore((s) => s.progress);
  const [plan, setPlan] = useState<string[] | null>(null);
  useEffect(() => {
    let live = true;
    void loadPlanOrder().then((ids) => {
      if (live) setPlan(ids);
    });
    return () => {
      live = false;
    };
  }, []);
  return useMemo(() => {
    const fromPlan = plan ? planNextTopicId(plan, topicId, (id) => progress[id]?.status === "completed") : undefined;
    if (fromPlan === null) return undefined;
    if (fromPlan) return findTopic(fromPlan)?.topic ?? undefined;
    return topicNeighbors(topicId).next;
  }, [plan, progress, topicId]);
}
