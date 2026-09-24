import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Maximize, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { AnswerRequest, AssessmentStatusResponse, MyAssessment, NextItemResponse, ServedItem } from "@shared/assessment";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { useConfirm } from "@/components/overlays";
import { Logo } from "@/components/layout/Logo";
import { Contours } from "@/components/trail/Contours";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/features/auth/AuthProvider";
import { PreFlight } from "@/features/proctor/PreFlight";
import { HardWarningModal, SoftWarningToasts, StatusStrip, Watermark } from "@/features/proctor/warnings";
import { useProctor } from "@/features/proctor/useProctor";
import type { CalibrationPose } from "@/features/proctor/types";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/utils";
import { assessmentApi } from "./api";
import { ItemRunner } from "./ItemRunner";
import { JobStages } from "./JobStages";
import { waitHeading, waitStages } from "./stages";
import { formatClock } from "./TimerRing";

type Phase = "loading" | "preflight" | "taking" | "waiting" | "finished" | "error";

/**
 * The assessment, end to end (brief §9.5, §10, §12).
 *
 * The page owns the funnel — pre-flight, the item loop, the waiting screen — and the proctor hook
 * owns the monitoring. Two rules run through all of it:
 *
 * - **The server is authoritative.** The timer here is display only; `expiresAt` and `deadlineAt`
 *   come from the server on every request and the server re-checks both.
 * - **No feedback, ever.** Nothing on this page tells the learner whether an answer was right.
 */
export default function AssessmentPage() {
  useDocumentTitle("Placement assessment");
  const { user } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [assessment, setAssessment] = useState<MyAssessment | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [calibration, setCalibration] = useState<CalibrationPose | null>(null);

  const [next, setNext] = useState<NextItemResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSecondsLeft, setTotalSecondsLeft] = useState(0);

  const proctor = useProctor({
    assessmentId: assessment?.id ?? "",
    stream,
    calibration,
    enabled: phase === "taking",
    onTerminated: () => setPhase("waiting"),
  });

  // ---- Load, and route by status ----
  const load = useCallback(async () => {
    try {
      const { assessment: mine } = await assessmentApi.mine();
      setAssessment(mine);

      if (!mine) {
        navigate("/plan", { replace: true });
        return;
      }
      switch (mine.status) {
        case "ready":
          setPhase("preflight");
          break;
        case "in_progress":
          // A refresh mid-test: the server re-serves the item that was in flight.
          setPhase("taking");
          break;
        case "generating":
        // Written but not released. The learner waits exactly as they do during generation —
        // whether a person is reading it or a deadline is running out is not their business.
        case "awaiting_approval":
        case "submitted":
        case "evaluating":
          setPhase("waiting");
          break;
        case "completed":
          navigate("/plan", { replace: true });
          break;
        default:
          setPhase("finished");
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not load your assessment.");
      setPhase("error");
    }
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  // The waiting screen owns its own polling now: it needs the status route for the stage and the
  // server's own message anyway, so polling `/api/me/assessment` alongside it would be a second
  // request for an answer the first one already gave.

  // ---- Fetch the next item ----
  const fetchNext = useCallback(async () => {
    if (!assessment) return;
    try {
      const result = await assessmentApi.next(assessment.id);
      setNext(result);
      if (result.done) {
        setPhase("waiting");
        void load();
      }
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        void load();
        return;
      }
      setError(err instanceof ApiRequestError ? err.message : "Could not load the next question.");
    }
  }, [assessment, load]);

  useEffect(() => {
    if (phase === "taking" && !next) void fetchNext();
  }, [phase, next, fetchNext]);

  // ---- Display-only timers ----
  const pausedRef = useRef(proctor.paused);
  pausedRef.current = proctor.paused;

  useEffect(() => {
    if (phase !== "taking" || !next?.item) return;
    const tick = () => {
      // Paused while a warning modal is up; the server extends the deadline to match (§10.3).
      if (pausedRef.current) return;
      setSecondsLeft(Math.max(0, Math.round((next.item!.expiresAt - Date.now()) / 1000)));
      setTotalSecondsLeft(Math.max(0, Math.round((next.deadlineAt - Date.now()) / 1000)));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [phase, next]);

  const handleAnswer = async (answer: AnswerRequest) => {
    if (!assessment || !next?.item || submitting) return;
    setSubmitting(true);
    try {
      await assessmentApi.answer(assessment.id, next.item.id, answer);
      setNext(null);
      await fetchNext();
    } catch (err) {
      // A 409 means the server moved on — a timeout, or a refresh race. Resync rather than retry.
      if (err instanceof ApiRequestError && err.status === 409) {
        setNext(null);
        await fetchNext();
      } else {
        setError(err instanceof ApiRequestError ? err.message : "That answer could not be saved.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAll = async () => {
    if (!assessment) return;
    // `calm`: fade only, no spring, no flourish. Someone is walking away from an hour of work and
    // needs a plain stop — this is the one dialog in the app that must not perform.
    const ok = await confirm({
      calm: true,
      title: "Finish the assessment now?",
      body: "Your answers are submitted as they stand and the assessment closes. Anything you have not reached is left unanswered, and you cannot come back to it.",
      confirmLabel: "Finish and submit",
      cancelLabel: "Keep going",
    });
    if (!ok) return;
    await assessmentApi.submit(assessment.id);
    setPhase("waiting");
    void load();
  };

  // ---- Screens ----

  if (phase === "loading") return <Centered><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /></Centered>;

  if (phase === "error") {
    return (
      <Shell>
        <FormAlert>{error}</FormAlert>
        <Button className="mt-6" onClick={() => void load()}>
          Try again
        </Button>
      </Shell>
    );
  }

  if (!assessment) return null;

  if (phase === "preflight") {
    return (
      <PreFlight
        assessmentId={assessment.id}
        onCancel={() => navigate("/plan")}
        onReady={async (pose, mediaStream) => {
          setCalibration(pose);
          setStream(mediaStream);
          try {
            await assessmentApi.start(assessment.id);
            setPhase("taking");
          } catch (err) {
            setError(err instanceof ApiRequestError ? err.message : "The assessment could not be started.");
            setPhase("error");
          }
        }}
      />
    );
  }

  if (phase === "waiting") {
    return <WaitingScreen assessment={assessment} onRefresh={load} onDone={() => navigate("/plan")} />;
  }

  if (phase === "finished") {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">
          {assessment.status === "terminated" ? "Your assessment was ended" : "This assessment is closed"}
        </h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          {assessment.status === "terminated"
            ? "It ended after repeated warnings. Everything you answered has been saved and will still be reviewed. Speak to your administrator about what happens next."
            : "There is nothing left to do here."}
        </p>
        <Button className="mt-6" onClick={() => navigate("/plan")}>
          Go to my plan
        </Button>
      </Shell>
    );
  }

  // ---- Taking the test ----
  const answered = next?.progress.answered ?? 0;
  const target = next?.progress.target ?? 0;
  const progressPct = target > 0 ? Math.min(100, (answered / target) * 100) : 0;
  // Five minutes is when the clock stops being background information.
  const timeIsShort = totalSecondsLeft > 0 && totalSecondsLeft <= 300;

  return (
    <div className="relative min-h-dvh bg-background">
      {/* Kept in view for the whole hour rather than scrolled away at the top. Someone who is
          being watched should be able to see that they are being watched without hunting for it —
          and a camera that drops out is the one thing on this page worth noticing immediately.
          Solid, not translucent: no blur, nothing for the compositor to redo on every scroll. */}
      <div className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto max-w-3xl px-4 py-2.5 sm:px-8">
          <StatusStrip videoRef={proctor.videoRef} state={proctor.state} />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b pb-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {next?.progress.section === "written" ? "Written answers" : "Placement assessment"}
            </p>
            <p className="mt-1 font-display text-lg font-semibold">
              Question {answered + 1}
              {next?.progress.section === "adaptive" && target > 0 ? ` of about ${target}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className={cn("font-mono text-xl tabular", timeIsShort && "text-destructive")}>
              {formatClock(totalSecondsLeft)}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">time remaining</p>
          </div>
        </header>

        <Progress
          value={progressPct}
          className="mt-3 h-1.5"
          indicatorClassName="bg-summit"
          aria-label={`Assessment progress: ${answered} of about ${target} questions answered`}
        />

        {error && <div className="mt-6"><FormAlert>{error}</FormAlert></div>}

        {proctor.cameraError && (
          <div className="mt-6 flex gap-3 rounded-md border border-destructive/40 bg-destructive/6 px-4 py-3 text-sm">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <p>{proctor.cameraError}</p>
          </div>
        )}

        <div className="relative mt-8">
          {/* Deterrent watermark: a photographed question is traceable back to one person (§10.3). */}
          <Watermark
            name={user?.displayName ?? ""}
            username={user?.username ?? ""}
            assessmentId={assessment.id}
          />

          {proctor.needsFullscreen ? (
            <div className="rounded-md border border-trailmark/50 bg-trailmark/[0.07] px-5 py-6 text-center">
              <Maximize className="mx-auto h-6 w-6 text-trailmark-strong" aria-hidden="true" />
              <p className="mt-3 font-medium">Return to fullscreen to continue</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The question is hidden until you do. Leaving fullscreen has already been recorded.
              </p>
              <Button className="mt-4" onClick={() => void proctor.requestFullscreen()}>
                Return to fullscreen
              </Button>
            </div>
          ) : next?.item ? (
            <ItemRunner
              key={next.item.id}
              item={next.item as ServedItem}
              secondsLeft={secondsLeft}
              submitting={submitting}
              onSubmit={(answer) => void handleAnswer(answer)}
            />
          ) : (
            <Centered>
              <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            </Centered>
          )}
        </div>

        <footer className="mt-16 border-t pt-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => void handleSubmitAll()}>
            Finish the assessment now
          </Button>
        </footer>
      </div>

      {proctor.hardWarning && (
        <HardWarningModal
          warning={proctor.hardWarning}
          needsFullscreen={proctor.needsFullscreen}
          onAcknowledge={proctor.acknowledgeHardWarning}
          onReenterFullscreen={() => void proctor.requestFullscreen()}
        />
      )}
      <SoftWarningToasts warnings={proctor.softWarnings} onDismiss={proctor.dismissSoftWarning} />
    </div>
  );
}

/**
 * Shown while the server is generating or evaluating.
 *
 * It polls `/api/assessment/:id/status`, which is the only place a learner can be told what a job
 * is doing, and shows exactly what comes back: the stage list from `stages.ts` and the server's
 * own message. There is no artificial delay here or on the server (§11.1 step 6) — and, just as
 * deliberately, no artificial progress. Nothing on this screen moves faster than the job does.
 *
 * When the status changes it asks the page to reload the assessment, which is what moves the
 * funnel on. One request every five seconds does both jobs.
 */
function WaitingScreen({
  assessment,
  onRefresh,
  onDone,
}: {
  assessment: MyAssessment;
  onRefresh: () => Promise<void> | void;
  onDone: () => void;
}) {
  const [detail, setDetail] = useState<AssessmentStatusResponse | null>(null);
  const statusRef = useRef(assessment.status);
  statusRef.current = assessment.status;
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  useEffect(() => {
    if (assessment.status === "completed") onDone();
  }, [assessment.status, onDone]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const next = await assessmentApi.status(assessment.id);
        if (cancelled) return;
        setDetail(next);
        // The status the page is holding is stale — let it re-route.
        if (next.status !== statusRef.current) void refreshRef.current();
      } catch {
        // A failed status check must not strand the learner here: fall back to reloading the
        // assessment itself, which is the request that actually decides what screen they see.
        if (!cancelled) void refreshRef.current();
      }
    };

    void poll();
    const timer = setInterval(() => void poll(), 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [assessment.id]);

  const status = detail?.status ?? assessment.status;
  const stages = waitStages(status);
  const failed = status === "failed";

  return (
    <Shell>
      <h1 className="text-2xl font-bold">{waitHeading(status)}</h1>
      <p className="mt-3 max-w-prose text-muted-foreground">
        {detail?.failureReason ??
          detail?.message ??
          (status === "generating"
            ? "We are writing questions based on what your manager told us about you."
            : status === "awaiting_approval"
              ? "Your questions are written and are being checked over."
              : "Your answers are being read and turned into a learning plan.")}
      </p>

      {stages && (
        <div className="mt-8 flex justify-center">
          <JobStages stages={stages} />
        </div>
      )}

      {!failed && (
        <p className="mt-8 max-w-prose text-sm text-muted-foreground">
          {status === "evaluating" || status === "submitted"
            ? "You can close this page — your plan will be waiting for you."
            : "There is nothing you need to chase. This page opens the assessment as soon as it is released."}
        </p>
      )}
      <p className="mt-2 font-mono text-xs text-muted-foreground">This page checks again every few seconds.</p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-12 text-center">
      <Contours className="text-basalt/12" seed={7} rings={14} />
      <div className="relative flex flex-col items-center">
        <Logo variant="stacked" height={64} className="mb-8" />
        {children}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground" role="status">
      {children}
      <span className="sr-only">Loading</span>
    </div>
  );
}

