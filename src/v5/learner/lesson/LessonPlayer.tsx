import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { m } from "motion/react";
import { CheckCircle2, ChevronRight, Flag, Keyboard, Maximize2, MessageCircle, Minimize2 } from "lucide-react";
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
  type StepFacts,
} from "@shared/lesson";

import type { TopicVideos } from "@/features/videos/useTopicVideos";
import { topicNeighbors } from "@/content";
import { Button, Celebration, LessonStepHeader, SkeletonLayout, StatusLine, cn, duration, easing, v5Toast } from "@/v5/design";

import { QuickCheckDialog, ReportProblemDialog, ShortcutsDialog } from "./LessonDialogs";
import { ReadStep } from "./steps/ReadStep";
import { CheckStep } from "./steps/CheckStep";
import { WatchStep, type WatchControls } from "./steps/WatchStep";
import { useLessonSave } from "./useLessonSave";

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
  const done = view.stepDone;

  const urlStep = params.get("step") as LessonStepId | null;
  const [step, setStep] = useState<LessonStepId>(() =>
    urlStep && STEP_IDS.has(urlStep) && canOpenStep(urlStep, available, done) ? urlStep : canOpenStep(view.step, available, done) ? view.step : available[0],
  );
  const urlT = Number(params.get("t"));
  const resume = useMemo(
    () => ({ videoId: view.videoId, seconds: Number.isFinite(urlT) && params.get("t") !== null ? urlT : view.positionSec }),
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
  const watchRef = useRef<WatchControls>(null);
  const codeRef = useRef<string | undefined>(undefined);
  const topRef = useRef<HTMLDivElement>(null);

  const onSaved = useCallback((res: LessonStatePutResponse) => {
    setView(res.state);
    const xp = res.awarded.reduce((sum, a) => sum + a.xp, 0);
    if (res.justCompleted) setCelebrate(true);
    else if (xp > 0) v5Toast.success(`+${xp} XP`, "Step done");
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

  // When the current step's rule is met, tell the server (it checks again before any XP).
  const requested = useRef(new Set<string>());
  useEffect(() => {
    if (!requirement.met || done[step]) return;
    const key = `${step}:${JSON.stringify(facts)}`;
    if (requested.current.has(key)) return;
    requested.current.add(key);
    void save({ step, stepDone: { [step]: true }, ...(step === "do" && !isCode ? { doAttempts: task.attempts } : {}) }, true);
  });

  const goTo = useCallback(
    (next: LessonStepId) => {
      setStep(next);
      setParams(
        (p) => {
          const n = new URLSearchParams(p);
          n.set("step", next);
          n.delete("t");
          return n;
        },
        { replace: true },
      );
      void save({ step: next }, true);
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      topRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    },
    [save, setParams],
  );

  const order = available;
  const index = order.indexOf(step);
  const nextStepId = index >= 0 && index < order.length - 1 ? order[index + 1] : null;
  const complete = lessonComplete(available, done);
  const nextTopic = topicNeighbors(topic.id).next;

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
      v5Toast.info("Finish the earlier step first", "Then the reading opens and you can see this part.");
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
        return <ReadStep topic={topic} done={done.read} onReadToEnd={() => setReadToEnd(true)} focusPassage={focusPassage} />;
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
        return <CheckStep topic={topic} questions={topic.quiz ?? []} videos={videos.data} onGoWatch={() => goTo("watch")} onGraded={onQuizGraded} />;
    }
  };

  return (
    <div
      ref={topRef}
      className={cn("flex flex-col bg-surface-0 text-fg-1", focus ? "fixed inset-0 z-40 overflow-y-auto" : "min-h-full")}
      data-testid="v5-lesson"
      data-focus-mode={focus ? "on" : "off"}
      {...(focus ? { role: "region", "aria-label": "Lesson in focus mode" } : {})}
    >
      <LessonStepHeader
        title={topic.title}
        current={step}
        done={done}
        available={available}
        secondsLeft={secondsLeft}
        onStep={(s) => (canOpenStep(s, available, done) ? goTo(s) : undefined)}
        onNext={headerNext.onNext}
        nextDisabled={headerNext.disabled}
        nextLabel={headerNext.label}
        nextHint={headerNext.disabled ? requirement.hint : undefined}
      />

      <div className="flex flex-wrap items-center gap-1 border-b border-line-1 bg-surface-1 px-4 py-1.5">
        <Button size="sm" variant="ghost" onClick={() => setTutorOpen(true)} aria-haspopup="dialog">
          <MessageCircle aria-hidden="true" /> Ask Oye
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setFocus((f) => !f)} aria-pressed={focus}>
          {focus ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          {focus ? "Leave focus mode" : "Focus mode"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setHelpOpen(true)}>
          <Keyboard aria-hidden="true" /> Shortcuts
        </Button>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setReportOpen(true)}>
          <Flag aria-hidden="true" /> Report a problem
        </Button>
      </div>

      <m.div
        key={step}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.quick, ease: [...easing.out] as [number, number, number, number] }}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-6"
      >
        {stepBody()}

        <div className="mt-8 flex flex-col gap-3 border-t border-line-1 pt-4">
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
              Lesson finished. {nextTopic ? `Up next: ${nextTopic.title}.` : "That's everything in this part of your plan."}
            </StatusLine>
          ) : !isLast ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              {!done[step] ? <span className="text-small text-fg-2">{requirement.hint}</span> : null}
              <Button variant="primary" onClick={advance} disabled={!done[step]}>
                Next <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </div>
      </m.div>

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
      <ShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <ReportProblemDialog open={reportOpen} onOpenChange={setReportOpen} topicId={topic.id} step={step} />
      {tutorOpen ? (
        <Suspense fallback={null}>
          <TutorDock open={tutorOpen} onOpenChange={setTutorOpen} topicId={topic.id} step={step} getCode={() => codeRef.current} onCite={onCite} />
        </Suspense>
      ) : null}
      <Celebration open={celebrate} onDone={() => setCelebrate(false)} title="Lesson finished" detail={nextTopic ? `Next up: ${nextTopic.title}` : "Nice work."} />
    </div>
  );
}
