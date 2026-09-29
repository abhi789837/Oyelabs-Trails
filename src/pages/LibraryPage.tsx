import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, Flag, List, LoaderCircle, Map as MapIcon, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import type { MyEvaluation } from "@shared/assessment";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Contours } from "@/components/trail/Contours";
import { StatusDot } from "@/components/trail/StatusDot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { modulePath, topicPath, useTracks } from "@/content";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { summarizeModule } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { levelLabels } from "@/lib/track-meta";
import { cn, formatMinutes, formatMinutesCompact } from "@/lib/utils";
import { useCurriculumStore } from "@/store/curriculumStore";
import { useProgressStore } from "@/store/progressStore";

import { PlanFilterBar } from "./parts/PlanFilterBar";
import { SectionHeading, StatChip } from "./parts/Stats";
import { useStoredView, ViewToggle } from "./parts/ViewToggle";
import { EMPTY_PLAN_FILTERS, filterPlanRows, hasActiveFilters, type PlanRow } from "./planFilters";

/**
 * The library: everything unlocked for this learner.
 *
 * This is the page "My plan" used to be, and almost nothing about it has changed — the whole trail, in
 * curriculum order, grouped by camp, with the filterable list view beside it. What changed is its job.
 * It is no longer the answer to "what am I doing", because two hundred lessons was never an answer to
 * that; it is the answer to "what have I got access to", which is a question worth a page of its own
 * and is exactly what a library is.
 *
 * Nothing was removed from the unlocked set to make the weekly plan smaller. Every lesson the AI and
 * the admin decided was relevant is still here, still openable, in the same order as before.
 */
export default function LibraryPage() {
  useDocumentTitle("Library");
  const tracks = useTracks();
  const planTopicIds = useCurriculumStore((s) => s.planTopicIds);
  const progress = useProgressStore((s) => s.progress);

  const [evaluation, setEvaluation] = useState<MyEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useStoredView<"trail" | "list">("oyelearn.library.view", "trail", ["trail", "list"]);
  const [filters, setFilters] = useState(EMPTY_PLAN_FILTERS);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await api.get<{ evaluation: MyEvaluation | null }>("/api/me/evaluation");
        if (!cancelled) setEvaluation(result.evaluation);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load your library.");
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

  /* The library's own total, which is the whole unlocked set rather than the week's budget. Read off
     the manifest the server pruned, so it is what this learner can actually open. */
  const totalMinutes = useMemo(
    () =>
      tracks.reduce(
        (sum, track) => sum + track.modules.reduce((n, m) => n + m.topics.reduce((t, topic) => t + topic.estMinutes, 0), 0),
        0,
      ),
    [tracks],
  );

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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading your library</span>
      </div>
    );
  }

  if (planTopicIds.length === 0) {
    return (
      <div className="relative mx-auto flex min-h-[60vh] max-w-xl flex-col items-start justify-center px-4 sm:px-8">
        <h1 className="text-2xl font-bold">Nothing unlocked yet</h1>
        <p className="mt-3 text-muted-foreground">
          Your administrator hasn't set your plan yet. They'll either issue a placement assessment or assign topics
          directly.
        </p>
        <Button asChild variant="outline" className="mt-8">
          <Link to="/plan">Back to my plan</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b">
        <Contours className="text-foreground/6" seed={4} />
        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-8">
          <Link
            to="/plan"
            className="inline-flex items-center gap-1.5 rounded-md font-mono text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trailmark"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            My plan
          </Link>

          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Library</h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Everything unlocked for you, in curriculum order. Your weekly plan picks from this — nothing here is off
            limits, and you can work ahead whenever you want to.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <StatChip label="Unlocked" value={planTopicIds.length} format={(n) => `${n} lessons`} />
            <StatChip label="Done" value={completed} format={(n) => `${n} of ${planTopicIds.length}`} />
            <StatChip label="Total time" value={formatMinutes(totalMinutes)} icon={<Clock />} />
            {evaluation && <StatChip label="Level" value={evaluation.overallLevel} format={(n) => `${n}/5`} icon={<Sparkles />} />}
          </div>

          {error && (
            <div className="mt-6 max-w-prose">
              <FormAlert>{error}</FormAlert>
            </div>
          )}
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
              ? "Every camp on every trail you have access to."
              : "Every unlocked lesson in one list, in the same order."
          }
          actions={
            <ViewToggle
              label="How to show your library"
              value={view}
              onChange={setView}
              options={[
                { value: "trail", label: "Trail", icon: <MapIcon aria-hidden="true" /> },
                { value: "list", label: "List", icon: <List aria-hidden="true" /> },
              ]}
            />
          }
        >
          Your trails
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
                    : "There is nothing in your library yet."}
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
                    <LibraryRow row={row} />
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

function LibraryRow({ row }: { row: PlanRow }) {
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
