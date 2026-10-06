import { useEffect, useState } from "react";
import { BookMarked, ChevronDown, Compass, List, Map as MapIcon, Telescope } from "lucide-react";
import { m } from "motion/react";
import { Link } from "react-router-dom";

import { api, ApiRequestError } from "@/api/client";
import { LANE_META } from "@/features/plan/laneMeta";
import { Button } from "@/v5/design/components/Button";
import { Card } from "@/v5/design/components/Card";
import { LaneChip } from "@/v5/design/components/LaneChip";
import { Badge } from "@/v5/design/components/Primitives";
import { ProgressBar } from "@/v5/design/components/Progress";
import { EmptyState, ErrorState } from "@/v5/design/components/States";
import { cn } from "@/v5/design/cn";
import { transitions } from "@/v5/design/motion";
import type { LearningPathView } from "@shared/builder";
import type { WeekItemView, WeekResponse, WeekView } from "@shared/weeklyPlan";
import { LANE_ORDER, formatRange, isWeekComplete, itemsInLane } from "@shared/weeklyPlanCore";

import { PlanSkeleton } from "../skeletons";
import { PageFrame, V5Screen, formatMinutes, useApiData, useDelayed } from "../me/page";
import { WHY_LABELS, nextStep, readView, saveView, v5Href, weekStats, type PlanView } from "./planLogic";
import { LaneLegend, OverviewTrail, WeekTrail } from "./PlanTrails";
import { plainTitle } from "@shared/plainTitle";

/**
 * `/learn/plan`, My plan: this week as one continuous trail (or as lanes, with the list toggle),
 * the next step with why it's there, and the whole route as a trail of milestones underneath.
 * Data: `/api/me/week` (built on demand) and `/api/me/path`, the same APIs as v4.3.
 */
export default function PlanPage() {
  return (
    <V5Screen>
      <PlanScreen />
    </V5Screen>
  );
}

function PlanScreen() {
  const week = useApiData<WeekResponse>("/api/me/week");
  const path = useApiData<{ path: LearningPathView | null }>("/api/me/path");
  // The lesson Today's Continue resumes; the card and the trail point at it too (Phase 9.2).
  const resume = useApiData<{ topicId: string; step: string | null } | null>("/api/v5/lessons/resume");
  const [view, setView] = useState<PlanView>(readView);
  const [selected, setSelected] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const showSkeleton = useDelayed(week.loading && !week.data);

  // Coming back from a lesson: refresh quietly so the "you are here" marker moves.
  const reloadWeek = week.reload;
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void reloadWeek(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reloadWeek]);

  const choose = (next: PlanView) => {
    setView(next);
    saveView(next);
  };

  const planNext = async () => {
    setPlanning(true);
    setPlanError(null);
    try {
      week.setData(await api.post<WeekResponse>("/api/me/week/next"));
    } catch (e) {
      setPlanError(e instanceof ApiRequestError ? e.message : "We couldn't plan your next week. Try again in a moment.");
    } finally {
      setPlanning(false);
    }
  };

  if (week.error && !week.data) {
    return (
      <PageFrame title="My plan">
        <ErrorState title="We couldn't load your plan" onRetry={() => void week.reload()} retrying={week.loading} />
      </PageFrame>
    );
  }
  if (!week.data) return <PageFrame title="My plan">{showSkeleton ? <PlanSkeleton /> : null}</PageFrame>;

  const w = week.data.week;
  if (!w) {
    return (
      <PageFrame title="My plan">
        <EmptyState
          icon={<Compass />}
          title="Nothing planned yet"
          body={week.data.reason ?? "Your admin is still setting up your plan. They'll send you a short test or pick your first lessons."}
          action={
            <Button asChild variant="primary">
              <Link to="/learn/library">Open the Library</Link>
            </Button>
          }
        />
      </PageFrame>
    );
  }

  const stats = weekStats(w);
  const resumeTopicId = resume.data?.topicId ?? null;
  const next = nextStep(w, resumeTopicId);
  const resumed = Boolean(next && resumeTopicId && next.topicId === resumeTopicId);
  const selectedItem = w.items.find((i) => i.id === selected) ?? null;

  return (
    <PageFrame
      title="My plan"
      lead={
        <>
          Week {w.weekNumber} · {formatRange(w.startDate, w.endDate)}
        </>
      }
      wide
    >
      <m.div className="flex flex-col gap-(--v5-gap) lg:gap-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={transitions.calm}>
        <Card className="flex flex-col gap-4">
          {w.summary ? <p className="max-w-prose text-lead text-fg-2">{w.summary}</p> : null}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-small text-fg-2">
            <span>
              <span className="font-display text-h4 font-semibold tabular-nums text-fg-1">
                {stats.done}/{stats.total}
              </span>{" "}
              done this week
            </span>
            <span>{formatMinutes(w.plannedMinutes)} planned</span>
            <Link to="/learn/library" className="inline-flex min-h-6 items-center gap-1 font-medium text-brand-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
              <BookMarked className="size-4" aria-hidden="true" /> {w.libraryLessonCount} lessons in your library
            </Link>
          </div>
          <ProgressBar value={stats.pct} label={`This week: ${stats.pct}% done`} tone={stats.pct === 100 ? "success" : "brand"} />
          {next ? <NextStep item={next} started={resumed || stats.done > 0} step={resumed ? (resume.data?.step ?? null) : null} /> : null}
          {isWeekComplete(w.items) ? (
            <div className="flex flex-wrap items-center gap-3 rounded-control bg-success-soft p-3">
              <p className="flex-1 text-body text-fg-1">You've cleared the important part of this week. Want the next one now?</p>
              <Button variant="success" onClick={() => void planNext()} loading={planning}>
                Plan my next week
              </Button>
            </div>
          ) : null}
          {planError ? (
            <p role="alert" className="text-small font-medium text-danger-fg">
              {planError}
            </p>
          ) : null}
        </Card>

        <section aria-labelledby="week-heading" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="week-heading" className="font-display text-h3 font-semibold">
                This week
              </h2>
              <p className="text-small text-fg-2">{view === "trail" ? "Your route through the week, in the order we suggest." : "The same week, grouped by how urgent it is."}</p>
            </div>
            <div role="group" aria-label="How to show this week" className="inline-flex items-center gap-1 rounded-control bg-sunken p-1 text-small">
              {(
                [
                  ["trail", "Trail", MapIcon],
                  ["list", "List", List],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={view === value}
                  onClick={() => choose(value)}
                  className={cn(
                    "inline-flex min-h-8 items-center gap-1.5 rounded-[calc(var(--v5-radius-control)-2px)] px-3 font-medium text-fg-2 transition-colors duration-120 hover:text-fg-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
                    view === value && "bg-surface-1 text-fg-1 shadow-e1",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {view === "trail" ? (
            <Card>
              <LaneLegend week={w} />
              <div className="mt-3">
                <WeekTrail week={w} hereId={resumed ? next!.id : null} selectedId={selected} onSelect={(item) => setSelected((cur) => (cur === item.id ? null : item.id))} />
              </div>
              <div id="week-item-detail" aria-live="polite">
                {selectedItem ? <ItemDetail item={selectedItem} onClose={() => setSelected(null)} /> : <p className="text-small text-fg-2">Pick a stop on the trail to see what it is and why it's here.</p>}
              </div>
            </Card>
          ) : (
            <LanesList week={w} />
          )}
        </section>

        {w.nextWeekPreview.length ? (
          <Disclosure icon={<Telescope className="size-4" aria-hidden="true" />} label="Coming up next week" hint={`${w.nextWeekPreview.length} likely, nothing scheduled yet`}>
            <ul className="flex flex-col gap-1.5 text-body text-fg-2">
              {w.nextWeekPreview.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Disclosure>
        ) : null}

        {path.data?.path && path.data.path.items.length ? (
          <section aria-labelledby="route-heading">
            <Card>
              <h2 id="route-heading" className="font-display text-h3 font-semibold">
                Your whole route
              </h2>
              <p className="mt-1 text-small text-fg-2">Every course on your path, in order. Week {w.weekNumber} is marked where it's working now.</p>
              <div className="mt-3">
                <OverviewTrail path={path.data.path} week={w} />
              </div>
            </Card>
          </section>
        ) : null}

        {w.roadmapNarrative.trim() ? (
          <Disclosure icon={<MapIcon className="size-4" aria-hidden="true" />} label="The longer view" hint="Where this week sits in the months ahead">
            <div className="flex max-w-prose flex-col gap-3 text-body text-fg-2">
              {w.roadmapNarrative.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Disclosure>
        ) : null}
      </m.div>
    </PageFrame>
  );
}

function WhyChip({ item }: { item: WeekItemView }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge tone="outline">Why: {WHY_LABELS[item.source]}</Badge>
      {item.carried ? <Badge tone="neutral">Carried over</Badge> : null}
    </span>
  );
}

function NextStep({ item, started, step }: { item: WeekItemView; started: boolean; step: string | null }) {
  return (
    <div className="flex flex-col gap-3 rounded-control border border-brand/30 bg-brand-soft p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-caption font-medium text-fg-2">{started ? "Pick up where you left off" : "Your first stop"}</p>
        <p className="mt-0.5 font-display text-h4 font-semibold text-fg-1">{plainTitle(item.title)}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-small text-fg-2">
          <LaneChip lane={item.lane} size="sm" />
          <span>{formatMinutes(item.minutes)}</span>
          <WhyChip item={item} />
        </div>
        {item.reason ? <p className="mt-2 max-w-prose text-small text-fg-2">{item.reason}</p> : null}
      </div>
      <Button asChild variant="primary" size="lg" className="shrink-0">
        <Link to={step ? `${v5Href(item)}?step=${encodeURIComponent(step)}` : v5Href(item)}>{started ? "Continue" : "Start"}</Link>
      </Button>
    </div>
  );
}

function ItemDetail({ item, onClose }: { item: WeekItemView; onClose: () => void }) {
  const done = item.status === "done";
  return (
    <div className="mt-2 flex flex-col gap-2 rounded-control border border-line-1 bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-h4 font-semibold">{plainTitle(item.title)}</p>
          <p className="text-small text-fg-2">{item.context}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-small text-fg-2">
        <LaneChip lane={item.lane} size="sm" />
        <span>{formatMinutes(item.minutes)}</span>
        <WhyChip item={item} />
        {done ? <Badge tone="success">Done</Badge> : null}
      </div>
      {item.reason ? <p className="max-w-prose text-small text-fg-1">{item.reason}</p> : null}
      {item.dependsOn.length ? <p className="text-small text-fg-2">Needs first: {item.dependsOn.map((d) => plainTitle(d.title)).join(", ")}</p> : null}
      <div>
        <Button asChild variant={done ? "secondary" : "primary"}>
          <Link to={v5Href(item)}>{done ? "Open it again" : "Start"}</Link>
        </Button>
      </div>
    </div>
  );
}

function LanesList({ week }: { week: WeekView }) {
  return (
    <div className="flex flex-col gap-(--v5-gap)" data-testid="week-lanes">
      {LANE_ORDER.map((lane) => {
        const items = itemsInLane(week, lane);
        if (items.length === 0) return null;
        return (
          <Card key={lane}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="sr-only">{LANE_META[lane].label}</h3>
              <LaneChip lane={lane} />
              <span className="text-small text-fg-2">{LANE_META[lane].hint}</span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {items.map((item) => {
                const done = item.status === "done";
                return (
                  <li key={item.id}>
                    <Link
                      to={v5Href(item)}
                      className="flex min-h-(--v5-row-h) flex-wrap items-center gap-x-3 gap-y-1 rounded-control border border-line-1 px-3 py-2 hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      <span className={cn("min-w-0 flex-1 text-body font-medium", done && "text-fg-2 line-through decoration-fg-3")}>
                        {plainTitle(item.title)}
                        {done ? <span className="sr-only"> (done)</span> : null}
                      </span>
                      <span className="text-caption text-fg-2">{WHY_LABELS[item.source]}</span>
                      <span className="text-small tabular-nums text-fg-2">{formatMinutes(item.minutes)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

function Disclosure({ icon, label, hint, children }: { icon: React.ReactNode; label: string; hint: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = `plan-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="rounded-card border border-line-1 bg-surface-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-(--v5-row-h) w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-card px-4 py-3 text-left hover:bg-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      >
        <span className="text-fg-2">{icon}</span>
        <span className="font-display font-semibold">{label}</span>
        <span className="text-caption text-fg-2">{hint}</span>
        <ChevronDown className={cn("ml-auto size-4 text-fg-2 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open ? (
        <div id={id} className="border-t border-line-1 px-4 pb-4 pt-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}
