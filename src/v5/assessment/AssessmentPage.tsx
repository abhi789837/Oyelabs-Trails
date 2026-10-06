import { Check, Circle, CircleDot, X } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { AssessmentStatusResponse, MyAssessment } from "@shared/assessment";

import { ApiRequestError } from "@/api/client";
import { assessmentApi } from "@/features/assessment/api";
import { waitHeading, waitStages, type StageState } from "@/features/assessment/stages";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import "@/v5/design/styles";
import { Button } from "@/v5/design/components/Button";
import { cn } from "@/v5/design/cn";
import { useV5Root } from "@/v5/design/useV5Root";
import { V5MotionProvider } from "@/v5/design/V5MotionProvider";

import { CalmPage, Spinner } from "./Frame";

/** MediaPipe, the proctor and the editor: only once the test is actually being taken. */
const Sitting = lazy(() => import("./Sitting"));
const Results = lazy(() => import("./Results"));
/** Sittings from before v4 (one question at a time) keep their own page. */
const LegacyAssessmentPage = lazy(() => import("@/features/assessment/AssessmentPage"));

type Phase = "loading" | "preflight" | "taking" | "waiting" | "complete" | "closed" | "error" | "legacy";

function phaseFor(mine: MyAssessment): Phase {
  if (mine.format !== "v4") return "legacy";
  switch (mine.status) {
    case "ready":
      return "preflight";
    case "in_progress":
      return "taking";
    case "generating":
    case "awaiting_approval":
    case "submitted":
    case "evaluating":
    case "failed":
      return "waiting";
    case "completed":
      return "complete";
    default:
      return "closed";
  }
}

/**
 * `/assessment` in the v5 design: calm and spacious, the same API and rules as v4.
 *
 * Loading → pre-flight → the sheet → waiting → results. The server is the authority on every step;
 * this page only routes by the status it is given.
 */
export default function AssessmentPage() {
  useV5Root();
  useDocumentTitle("Your test");
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<MyAssessment | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { assessment: mine } = await assessmentApi.mine();
      if (!mine) {
        navigate("/learn/plan", { replace: true });
        return;
      }
      setAssessment(mine);
      setPhase(phaseFor(mine));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "We couldn't load your test.");
      setPhase("error");
    }
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  let body: React.ReactNode;
  if (phase === "loading") body = <CalmPage><Spinner /></CalmPage>;
  else if (phase === "error")
    body = (
      <CalmPage title="Something went wrong" actions={<Button variant="primary" onClick={() => void load()}>Try again</Button>}>
        <p role="alert">{error}</p>
      </CalmPage>
    );
  else if (!assessment) body = null;
  else if (phase === "legacy") body = <LegacyAssessmentPage />;
  else if (phase === "preflight" || phase === "taking")
    body = (
      <Sitting
        assessment={assessment}
        startTaking={phase === "taking"}
        onStarted={() => setPhase("taking")}
        onTerminated={() => setPhase("waiting")}
        onFinished={(reason) => {
          setNotice(reason === "deadline" ? "Time's up, so your answers were handed in as they stood." : "Your answers are handed in.");
          setPhase("waiting");
          void load();
        }}
      />
    );
  else if (phase === "waiting") body = <Waiting assessment={assessment} notice={notice} onRefresh={load} />;
  else if (phase === "complete") body = <Results />;
  else
    body = (
      <CalmPage
        title={assessment.status === "terminated" ? "Your test was ended" : "This test is closed"}
        actions={<Button variant="primary" onClick={() => navigate("/learn/plan")}>Go to my plan</Button>}
      >
        <p>
          {assessment.status === "terminated"
            ? "It ended after repeated warnings. Everything you answered is saved and will still be marked. Your manager will talk to you about what happens next."
            : "There's nothing left to do here."}
        </p>
      </CalmPage>
    );

  return (
    <V5MotionProvider>
      <Suspense fallback={<CalmPage><Spinner /></CalmPage>}>{body}</Suspense>
    </V5MotionProvider>
  );
}

const STAGE_ICON: Record<StageState, typeof Check> = { done: Check, current: CircleDot, pending: Circle, failed: X };
const STAGE_WORD: Record<StageState, string> = { done: "done", current: "now", pending: "next", failed: "stopped" };

/**
 * While the questions are written or the answers marked. It polls the status every 5 s and shows
 * the server's own stage, never invented progress.
 */
function Waiting({ assessment, notice, onRefresh }: { assessment: MyAssessment; notice: string | null; onRefresh: () => Promise<void> | void }) {
  const [detail, setDetail] = useState<AssessmentStatusResponse | null>(null);
  const statusRef = useRef(assessment.status);
  statusRef.current = assessment.status;
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const next = await assessmentApi.status(assessment.id);
        if (cancelled) return;
        setDetail(next);
        if (next.status !== statusRef.current) void refreshRef.current();
      } catch {
        if (!cancelled) void refreshRef.current();
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [assessment.id]);

  const status = detail?.status ?? assessment.status;
  const stages = waitStages(status);
  const marking = status === "submitted" || status === "evaluating";

  return (
    <CalmPage title={marking ? "Thanks, we're marking your answers" : waitHeading(status)}>
      {notice ? (
        <p role="status" className="mb-3 font-medium text-fg-1">
          {notice}
        </p>
      ) : null}
      <p>
        {detail?.failureReason ??
          detail?.message ??
          (status === "generating"
            ? "We're writing questions that fit what your manager told us about you."
            : status === "awaiting_approval"
              ? "Your questions are written and being checked."
              : "Then we'll turn them into your plan.")}
      </p>
      {stages ? (
        <ol className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-2 text-left" aria-label="Where things are">
          {stages.map((stage) => {
            const Icon = STAGE_ICON[stage.state];
            return (
              <li
                key={stage.id}
                className={cn(
                  "flex items-center gap-3 rounded-card border px-4 py-3 text-small",
                  stage.state === "current" ? "border-brand/40 bg-brand-soft text-fg-1" : stage.state === "failed" ? "border-danger/30 bg-danger-soft text-fg-1" : "border-line-1 bg-surface-1 text-fg-2",
                )}
              >
                <Icon className={cn("size-4 shrink-0", stage.state === "done" && "text-success-fg", stage.state === "current" && "text-brand-fg")} aria-hidden="true" />
                <span className="flex-1">{stage.label}</span>
                <span className="text-caption text-fg-2">{STAGE_WORD[stage.state]}</span>
              </li>
            );
          })}
        </ol>
      ) : null}
      {status !== "failed" ? (
        <p className="mt-8 text-small text-fg-2">{marking ? "You can close this page. Your results and plan will be waiting." : "Nothing to chase. This page opens the test as soon as it's ready."}</p>
      ) : null}
    </CalmPage>
  );
}
