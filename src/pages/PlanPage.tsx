import { useEffect, useMemo, useState } from "react";
import { Clock, Flag, List, LoaderCircle, Map as MapIcon, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import type { MyEvaluation } from "@shared/assessment";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Contours } from "@/components/trail/Contours";
import { StatusDot } from "@/components/trail/StatusDot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { findTopic, modulePath, topicPath, useTracks } from "@/content";
import { isPendingAssessment } from "@/features/assessment/funnel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { summarizeModule } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { levelLabels } from "@/lib/track-meta";
import { cn, formatMinutes, formatMinutesCompact } from "@/lib/utils";
import { useMyAssessmentStore } from "@/store/assessmentStore";
import { useCurriculumStore } from "@/store/curriculumStore";
import { useProgressStore } from "@/store/progressStore";

import { PlanFilterBar } from "./parts/PlanFilterBar";
import { SectionHeading, StatChip } from "./parts/Stats";
import { useStoredView, ViewToggle } from "./parts/ViewToggle";
import { EMPTY_PLAN_FILTERS, filterPlanRows, hasActiveFilters, type PlanRow } from "./planFilters";

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
 *
 * Two ways to read the same plan. **Trail view** is the camps-and-waypoints list this page has
 * always had, and it is deliberately untouched: it is the page's spine, and the ordering it shows
 * is the plan's own. **List view** flattens it and adds filters, for the days when the question is
 * "what have I got left that is a code challenge" rather than "where am I on the trail". Filtering
 * lives only in the list view — hiding a waypoint would break a path that means something.
 */
export default function PlanPage() {
  useDocumentTitle("My plan");
  const navigate = useNavigate();
  const tracks = useTracks();
  const planTopicIds = useCurriculumStore((s) => s.planTopicIds);
  const progress = useProgressStore((s) => s.progress);

  // The assessment is fetched once by the shell, for the banner that now carries this same
  // message everywhere else. Re-fetching it here would be a second request for one answer.
  const assessment = useMyAssessmentStore((s) => s.assessment);
  const assessmentStatus = useMyAssessmentStore((s) => s.status);
  const assessmentError = useMyAssessmentStore((s) => s.error);

  const [evaluation, setEvaluation] = useState<MyEvaluation | null>(null);
  const [rationale, setRationale] = useState<PlanRationale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useStoredView<"trail" | "list">("oyelearn.plan.view", "trail", ["trail", "list"]);
  const [filters, setFilters] = useState(EMPTY_PLAN_FILTERS);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [evaluationResult, plan] = await Promise.all([
          api.get<{ evaluation: MyEvaluation | null }>("/api/me/evaluation"),
          api.get<{ plan: { rationale: PlanRationale | null } | null }>("/api/me/plan"),
        ]);
        if (cancelled) return;
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

  // The assessment fetch used to be one of this page's own three, so its failure was reported
  // here. It still is, even though the request now belongs to the shell.
  const pageError = error ?? assessmentError;

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

  /** The list view's rows: every assigned topic, in trail order, with its camp and trail attached. */
  const rows = useMemo<PlanRow[]>(() => {
    const all: PlanRow[] = [];
    for (const track of tracks) {
      for (const module of track.modules) {
        for (const topic of module.topics) {
          all.push({
            topic,
            module,
            track,
            status: progress[topic.id]?.status ?? "not-started",
            position: all.length + 1,
          });
        }
      }
    }
    return all;
  }, [tracks, progress]);

  const visibleRows = useMemo(() => filterPlanRows(rows, filters), [rows, filters]);

  // Wait for the shared assessment too: rendering the plan before it has settled would flash the
  // trail at someone whose funnel branch is about to replace it.
  if (loading || assessmentStatus === "idle" || assessmentStatus === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading your plan</span>
      </div>
    );
  }

  // Still in the funnel: send them to the assessment rather than an empty plan.
  if (assessment && isPendingAssessment(assessment)) {
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
        <Contours className="text-foreground/6" seed={4} />
        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-8">
          <h1 className="text-2xl font-bold sm:text-3xl">My plan</h1>

          {(rationale?.learnerSummary || evaluation?.learnerSummary) && (
            <p className="mt-4 max-w-prose text-lg leading-relaxed text-muted-foreground">
              {rationale?.learnerSummary ?? evaluation?.learnerSummary}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-2">
            <StatChip label="Done" value={completed} format={(n) => `${n} of ${planTopicIds.length}`} />
            <StatChip label="Progress" value={pct} format={(n) => `${n}%`} />
            <StatChip label="Time" value={formatMinutes(totalMinutes)} icon={<Clock />} />
            {evaluation && <StatChip label="Level" value={evaluation.overallLevel} format={(n) => `${n}/5`} icon={<Sparkles />} />}
          </div>

          <Progress value={pct} className="mt-5 h-2 max-w-xl" indicatorClassName="bg-summit" aria-label={`Plan progress: ${pct}%`} />

          {nextTopic && <ContinueCard found={nextTopic} started={completed > 0} />}

          {pageError && <div className="mt-6 max-w-prose"><FormAlert>{pageError}</FormAlert></div>}
        </div>
      </section>

      {evaluation && evaluation.areas.length > 0 && (
        <section aria-labelledby="areas-heading" className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
          <SectionHeading
            id="areas-heading"
            mark={<Sparkles className="h-4 w-4 shrink-0 text-trailmark-strong" aria-hidden="true" />}
            description="From your placement assessment. It is a starting point, not a verdict."
          >
            Where you are now
          </SectionHeading>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
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
        <SectionHeading
          id="camps-heading"
          description={
            view === "trail"
              ? "In the order we suggest working through them."
              : "Every assigned topic in one list, in the same order."
          }
          actions={
            <ViewToggle
              label="How to show your plan"
              value={view}
              onChange={setView}
              options={[
                { value: "trail", label: "Trail", icon: <MapIcon aria-hidden="true" /> },
                { value: "list", label: "List", icon: <List aria-hidden="true" /> },
              ]}
            />
          }
        >
          Your trail
        </SectionHeading>

        {view === "trail" ? (
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
        ) : (
          <div className="mt-6">
            <PlanFilterBar rows={rows} filters={filters} onChange={setFilters} shown={visibleRows.length} />

            {visibleRows.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed px-6 py-10 text-center">
                <p className="font-medium">Nothing matches those filters</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasActiveFilters(filters)
                    ? "Widen one of them, or clear them all and start again."
                    : "There is nothing in your plan yet."}
                </p>
                {hasActiveFilters(filters) && (
                  <Button variant="outline" className="mt-5" onClick={() => setFilters(EMPTY_PLAN_FILTERS)}>
                    Clear the filters
                  </Button>
                )}
              </div>
            ) : (
              <ul className="mt-5 divide-y rounded-lg border">
                {visibleRows.map((row) => (
                  <li key={row.topic.id}>
                    <PlanListRow row={row} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * The one card on this page with a tint and a filled button: where to go next.
 *
 * It repeats what the trail below already says, which is the point — the plan is long, and the
 * answer to "what now" should not require reading a list of two hundred things to find the first
 * one without a tick.
 */
function ContinueCard({
  found,
  started,
}: {
  found: NonNullable<ReturnType<typeof findTopic>>;
  started: boolean;
}) {
  const { topic, module, track } = found;
  const accent = accentClasses[track.accentToken];

  return (
    <Card tone="progress" density="cozy" className="mt-7 max-w-2xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-muted-foreground">
            {started ? "Pick up where you left off" : "Your first waypoint"}
          </p>
          <p className="mt-1.5 font-display text-lg font-semibold">{topic.title}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground">
            <span aria-hidden="true" className={cn("h-3.5 w-1 rounded-[2px]", accent.bg)} />
            <span className="min-w-0 truncate">{module.name}</span>
            <span className="font-mono text-xs">{levelLabels[topic.level]}</span>
            <span className="font-mono text-xs">{formatMinutesCompact(topic.estMinutes)}</span>
            {topic.isMilestone && (
              <span className="inline-flex items-center gap-1 font-mono text-xs text-trailmark-strong">
                <Flag className="h-3 w-3" aria-hidden="true" />
                milestone
              </span>
            )}
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link to={topicPath(topic)}>{started ? "Continue" : "Start"}</Link>
        </Button>
      </div>
    </Card>
  );
}

function PlanListRow({ row }: { row: PlanRow }) {
  const { topic, module, status, position } = row;
  return (
    <Link
      to={topicPath(topic)}
      className="flex items-center gap-3 px-4 py-3 transition-colors duration-[120ms] hover:bg-surface-sunken/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong"
    >
      <span className="w-7 shrink-0 font-mono text-[11px] text-muted-foreground tabular">{position}</span>
      <StatusDot status={status} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="min-w-0 truncate text-sm font-medium">{topic.title}</span>
          {topic.isMilestone && <Flag className="h-3 w-3 shrink-0 text-trailmark-strong" aria-label="Milestone" />}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{module.name}</span>
      </span>
      <span className="hidden shrink-0 items-center gap-4 font-mono text-[11px] text-muted-foreground sm:flex">
        <span className="w-24 text-right">{levelLabels[topic.level]}</span>
        <span className="w-10 text-right">{topic.challengeType}</span>
        <span className="w-12 text-right">{formatMinutesCompact(topic.estMinutes)}</span>
      </span>
    </Link>
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
