import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, LoaderCircle, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import type { MyAssessment, MyEvaluation } from "@shared/assessment";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Contours } from "@/components/trail/Contours";
import { StatusDot } from "@/components/trail/StatusDot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { findTopic, modulePath, topicPath, useTracks } from "@/content";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { summarizeModule } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { levelLabels } from "@/lib/track-meta";
import { cn, formatMinutes } from "@/lib/utils";
import { useCurriculumStore } from "@/store/curriculumStore";
import { useProgressStore } from "@/store/progressStore";

interface PlanRationale {
  summary?: string;
  learnerSummary?: string;
  milestones?: string[];
  estimatedHours?: number;
}

/**
 * My plan (brief §12).
 *
 * The learner's home. It shows what they have been assigned and why, and nothing else — the
 * curriculum they cannot see is not hinted at, and the parts of the evaluation meant for their
 * manager (integrity, the onboarding notes) are not on this page at all.
 */
export default function PlanPage() {
  useDocumentTitle("My plan");
  const navigate = useNavigate();
  const tracks = useTracks();
  const planTopicIds = useCurriculumStore((s) => s.planTopicIds);
  const progress = useProgressStore((s) => s.progress);

  const [assessment, setAssessment] = useState<MyAssessment | null>(null);
  const [evaluation, setEvaluation] = useState<MyEvaluation | null>(null);
  const [rationale, setRationale] = useState<PlanRationale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [mine, evaluationResult, plan] = await Promise.all([
          api.get<{ assessment: MyAssessment | null }>("/api/me/assessment"),
          api.get<{ evaluation: MyEvaluation | null }>("/api/me/evaluation"),
          api.get<{ plan: { rationale: PlanRationale | null } | null }>("/api/me/plan"),
        ]);
        if (cancelled) return;
        setAssessment(mine.assessment);
        setEvaluation(evaluationResult.evaluation);
        setRationale(plan.plan?.rationale ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load your plan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const completed = planTopicIds.filter((id) => progress[id]?.status === "completed").length;
  const pct = planTopicIds.length ? Math.round((completed / planTopicIds.length) * 100) : 0;

  // `findTopic` already knows which track and camp a topic belongs to, so the plan page does not
  // need its own lookup.
  const nextTopic = useMemo(
    () => findTopic(planTopicIds.find((id) => progress[id]?.status !== "completed")),
    [planTopicIds, progress],
  );

  const totalMinutes = useMemo(
    () =>
      tracks.reduce(
        (sum, track) => sum + track.modules.reduce((n, m) => n + m.topics.reduce((t, topic) => t + topic.estMinutes, 0), 0),
        0,
      ),
    [tracks],
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading your plan</span>
      </div>
    );
  }

  // Still in the funnel: send them to the assessment rather than an empty plan.
  if (
    assessment &&
    ["ready", "in_progress", "generating", "awaiting_approval", "submitted", "evaluating"].includes(assessment.status)
  ) {
    return (
      <EmptyState
        title={assessment.status === "ready" ? "Your placement assessment is ready" : "We're still working on your plan"}
        body={
          assessment.status === "ready"
            ? "It takes about an hour and decides what you'll be assigned. Find a quiet hour before you start — it is monitored, and it cannot be paused once it begins."
            : "Your assessment is being prepared or evaluated. This page will have your plan when it's done."
        }
        action={
          assessment.status === "ready"
            ? { label: "Start the assessment", onClick: () => navigate("/assessment") }
            : { label: "Check progress", onClick: () => navigate("/assessment") }
        }
      />
    );
  }

  if (planTopicIds.length === 0) {
    return (
      <EmptyState
        title="Nothing assigned yet"
        body="Your administrator hasn't set your plan yet. They'll either issue a placement assessment or assign topics directly."
      />
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b">
        <Contours className="text-foreground/[0.06]" seed={4} />
        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-8">
          <h1 className="text-2xl font-bold sm:text-3xl">My plan</h1>

          {(rationale?.learnerSummary || evaluation?.learnerSummary) && (
            <p className="mt-4 max-w-prose text-lg leading-relaxed text-muted-foreground">
              {rationale?.learnerSummary ?? evaluation?.learnerSummary}
            </p>
          )}

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            <Stat label="Topics" value={`${completed} of ${planTopicIds.length}`} />
            <Stat label="Estimated time" value={formatMinutes(totalMinutes)} />
            {evaluation && <Stat label="Overall level" value={`${evaluation.overallLevel}/5`} />}
          </dl>

          <Progress value={pct} className="mt-5 h-2 max-w-xl" indicatorClassName="bg-summit" aria-label={`Plan progress: ${pct}%`} />

          {nextTopic && (
            <div className="mt-6">
              <Button asChild>
                <Link to={topicPath(nextTopic.topic)}>
                  {completed === 0 ? "Start" : "Continue"}: {nextTopic.topic.title}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}

          {error && <div className="mt-6 max-w-prose"><FormAlert>{error}</FormAlert></div>}
        </div>
      </section>

      {evaluation && evaluation.areas.length > 0 && (
        <section aria-labelledby="areas-heading" className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
          <h2 id="areas-heading" className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-4 w-4 text-trailmark-strong" aria-hidden="true" />
            Where you are now
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {evaluation.areas.map((area) => (
              <li key={area.area} className="rounded-md border px-4 py-3">
                <p className="flex items-center justify-between gap-3 font-medium">
                  {area.area}
                  <Badge variant="outline">{area.level}/5</Badge>
                </p>
                {area.strengths.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-summit-strong">Strong: </span>
                    {area.strengths.join("; ")}
                  </p>
                )}
                {area.gaps.length > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-trailmark-strong">To work on: </span>
                    {area.gaps.join("; ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="camps-heading" className="mx-auto max-w-5xl px-4 pb-16 sm:px-8">
        <h2 id="camps-heading" className="text-lg font-semibold">
          Your trail
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">In the order we suggest working through them.</p>

        <div className="mt-6 space-y-8">
          {tracks.map((track) => {
            const accent = accentClasses[track.accentToken];
            return (
              <div key={track.id}>
                <h3 className="flex items-center gap-2.5 text-base font-semibold">
                  <span aria-hidden="true" className={cn("h-5 w-1.5 rounded-[2px]", accent.bg)} />
                  {track.name}
                </h3>

                <ul className="mt-3 space-y-3">
                  {track.modules.map((module) => {
                    const summary = summarizeModule(module, progress);
                    return (
                      <li key={module.id} className="rounded-md border">
                        <Link
                          to={modulePath(module)}
                          className="flex flex-wrap items-center gap-3 border-b px-4 py-3 hover:bg-surface-sunken/40"
                        >
                          <span className="font-medium">{module.name}</span>
                          <span className="font-mono text-xs text-muted-foreground tabular">
                            {summary.completed}/{summary.total}
                          </span>
                          <span className="ml-auto flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {formatMinutes(module.topics.reduce((n, t) => n + t.estMinutes, 0))}
                          </span>
                        </Link>

                        <ul className="divide-y">
                          {module.topics.map((topic) => (
                            <li key={topic.id}>
                              <Link
                                to={topicPath(topic)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-sunken/40"
                              >
                                <StatusDot status={progress[topic.id]?.status ?? "not-started"} />
                                <span className="min-w-0 flex-1 truncate">{topic.title}</span>
                                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                                  {levelLabels[topic.level]}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</dt>
      <dd className="font-display text-xl font-semibold tabular">{value}</dd>
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="relative mx-auto flex min-h-[60vh] max-w-xl flex-col items-start justify-center px-4 sm:px-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-3 text-muted-foreground">{body}</p>
      {action && (
        <Button className="mt-8" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}


