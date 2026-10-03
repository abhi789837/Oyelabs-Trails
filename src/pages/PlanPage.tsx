import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  ChevronDown,
  Clock,
  List,
  Map as MapIcon,
  Sparkles,
  Telescope,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";

import type { MyEvaluation } from "@shared/assessment";
import type { LearningPathView } from "@shared/builder";
import {
  LANE_ORDER,
  formatRange,
  isWeekComplete,
  itemsInLane,
  type WeekItemView,
  type WeekResponse,
  type WeekView,
} from "@shared/weeklyPlan";

import { api, ApiRequestError } from "@/api/client";
import { SkillReport } from "@/components/assessment/SkillReport";
import { FormAlert } from "@/components/form/Field";
import { Contours } from "@/components/trail/Contours";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { isPendingAssessment } from "@/features/assessment/funnel";
import { weekApi } from "@/features/plan/api";
import { LANE_META } from "@/features/plan/laneMeta";
import { Lanes } from "@/features/plan/Lanes";
import { SummitCelebration } from "@/features/plan/SummitCelebration";
import { OverviewTrail } from "@/features/plan/OverviewTrail";
import { LaneLegend, WeekTrail, type NextWeekLink } from "@/features/plan/WeekTrail";
import { WeekSkeleton } from "@/features/plan/WeekSkeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { fadeUp } from "@/lib/motion";
import { cn, formatMinutes, formatMinutesCompact } from "@/lib/utils";
import { useMyAssessmentStore } from "@/store/assessmentStore";
import { useProgressStore } from "@/store/progressStore";

import { SectionHeading, StatChip } from "./parts/Stats";
import { useStoredView, ViewToggle } from "./parts/ViewToggle";

/**
 * My plan — one week of it.
 *
 * ## What changed, and why
 *
 * This page used to show the whole unlocked library at once: "0 of 204 lessons · 190 h 50 min", under a
 * 450-word paragraph that walked through the next several months. All of it was true and none of it was
 * usable, because the question somebody opens this page with is "what am I doing today", and a
 * six-month journey is not an answer to it.
 *
 * So the two have been separated. The **library** is unchanged and lives at `/library` — every lesson
 * the AI and the admin decided was relevant, still unlocked, still browsable, nothing removed. **This**
 * page is one week, built to the hours the admin said this person actually has, split into four lanes
 * by what is blocking them. The long narrative is still here, at the bottom, collapsed.
 *
 * ## The two views
 *
 * Trail is the default and the one this product is about: a week as a route, with waypoints, a "you are
 * here" marker and a summit at the end. List is the same week as four lanes, for when the question is
 * "what is left" rather than "where am I". The choice is remembered per browser.
 */
export default function PlanPage() {
  useDocumentTitle("My plan");
  const navigate = useNavigate();
  const progress = useProgressStore((s) => s.progress);

  const assessment = useMyAssessmentStore((s) => s.assessment);
  const assessmentStatus = useMyAssessmentStore((s) => s.status);
  const assessmentError = useMyAssessmentStore((s) => s.error);

  const [response, setResponse] = useState<WeekResponse | null>(null);
  const [evaluation, setEvaluation] = useState<MyEvaluation | null>(null);
  const [path, setPath] = useState<LearningPathView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [view, setView] = useStoredView<"trail" | "list">("oyelearn.plan.view", "trail", ["trail", "list"]);

  const load = useCallback(async (signal?: AbortSignal) => {
    const [week, evaluationResult, pathResult] = await Promise.all([
      weekApi.mine(signal),
      api.get<{ evaluation: MyEvaluation | null }>("/api/me/evaluation", signal),
      // The overview trail is a nice-to-have: a path that fails to load must not take the week with it.
      api.get<{ path: LearningPathView | null }>("/api/me/path", signal).catch(() => ({ path: null })),
    ]);
    return { week, evaluation: evaluationResult.evaluation, path: pathResult.path };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    const run = async () => {
      try {
        const result = await load(controller.signal);
        if (!alive) return;
        setResponse(result.week);
        setEvaluation(result.evaluation);
        setPath(result.path);
      } catch (err) {
        if (!alive || controller.signal.aborted) return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load your plan.");
      } finally {
        if (alive) setLoading(false);
      }
    };
    void run();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [load]);

  /**
   * Re-reads the week when the learner comes back from finishing something.
   *
   * The progress store is the honest signal here. Completing a topic happens on another page entirely —
   * the challenge engine knows nothing about weekly plans — and the server reconciles the week's item
   * statuses from `topic_progress` on every read. So watching the store and re-fetching is what makes
   * the "you are here" marker walk forward without either side having to know about the other.
   */
  const completedCount = useMemo(
    () => Object.values(progress).filter((entry) => entry.status === "completed").length,
    [progress],
  );
  const lastSeen = useRef(completedCount);
  useEffect(() => {
    if (completedCount === lastSeen.current) return;
    lastSeen.current = completedCount;
    if (!response?.week) return;
    let alive = true;
    void weekApi
      .mine()
      .then((week) => {
        if (alive) setResponse(week);
      })
      .catch(() => {
        // A stale week is better than an error banner over a page that is otherwise fine.
      });
    return () => {
      alive = false;
    };
  }, [completedCount, response?.week]);

  const planNextWeek = async () => {
    setPlanning(true);
    setPlanError(null);
    try {
      setResponse(await weekApi.planNext());
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setPlanError(err instanceof ApiRequestError ? err.message : "Could not plan your next week.");
    } finally {
      setPlanning(false);
    }
  };

  if (loading || assessmentStatus === "idle" || assessmentStatus === "loading") return <WeekSkeleton />;

  // Still in the funnel: send them to the assessment rather than to an empty week.
  if (assessment && isPendingAssessment(assessment)) {
    return (
      <EmptyState
        title={assessment.status === "ready" ? "Your placement assessment is ready" : "We're still working on your plan"}
        body={
          assessment.status === "ready"
            ? "It takes about half an hour and decides what you'll be assigned. Find a quiet slot before you start — it is monitored, and it cannot be paused once it begins."
            : "Your assessment is being prepared or evaluated. This page will have your first week when it's done."
        }
        action={{ label: assessment.status === "ready" ? "Start the assessment" : "Check progress", onClick: () => navigate("/assessment") }}
      />
    );
  }

  const week = response?.week ?? null;
  const pageError = error ?? assessmentError;

  if (!week) {
    return (
      <EmptyState
        title="Nothing planned yet"
        body={response?.reason ?? "Your administrator hasn't set your plan yet. They'll either issue a placement assessment or assign topics directly."}
        action={response && response.history.length > 0 ? { label: "See your past weeks", onClick: () => navigate("/library") } : undefined}
      />
    );
  }

  return (
    <div>
      <WeekHeader
        week={week}
        evaluation={evaluation}
        error={pageError}
        planError={planError}
        onPlanNext={planNextWeek}
        planning={planning}
      />

      <section aria-labelledby="week-heading" className="mx-auto max-w-5xl px-4 pb-6 sm:px-8">
        <SectionHeading
          id="week-heading"
          description={
            view === "trail" ? "Your route through the week, in the order we suggest." : "The same week, grouped by priority."
          }
          actions={
            <ViewToggle
              label="How to show this week"
              value={view}
              onChange={setView}
              options={[
                { value: "trail", label: "Trail", icon: <MapIcon aria-hidden="true" /> },
                { value: "list", label: "List", icon: <List aria-hidden="true" /> },
              ]}
            />
          }
        >
          This week
        </SectionHeading>

        {view === "trail" ? (
          <div className="mt-5">
            <LaneLegend week={week} />
            <WeekTrail week={week} />
          </div>
        ) : (
          <div className="mt-6">
            <Lanes week={week} />
          </div>
        )}
      </section>

      <ComingUp week={week} />
      <Roadmap week={week} path={path} history={response?.history ?? []} />
      <WeekHistory week={week} history={response?.history ?? []} />
    </div>
  );
}

/**
 * The header: what week it is, three sentences, this week's numbers, and where to go next.
 *
 * The stats are **this week's**, not the library's, which is the single most important change on the
 * page — and the link to the library is right beside them, saying exactly how much is behind it, so
 * narrowing the week never reads as having taken something away.
 */
function WeekHeader({
  week,
  evaluation,
  error,
  planError,
  onPlanNext,
  planning,
}: {
  week: WeekView;
  evaluation: MyEvaluation | null;
  error: string | null;
  planError: string | null;
  onPlanNext: () => void;
  planning: boolean;
}) {
  const done = week.items.filter((item) => item.status === "done").length;
  const pct = week.items.length ? Math.round((done / week.items.length) * 100) : 0;
  const complete = isWeekComplete(week.items);

  /* The first unfinished item from the highest lane, which is what "your next step" means when the
     lanes are ordered by urgency. */
  const next = LANE_ORDER.flatMap((lane) => itemsInLane(week, lane)).find((item) => item.status !== "done");

  return (
    <section className="relative overflow-hidden border-b">
      <Contours className="text-foreground/6" seed={4} />
      <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-8">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">My plan</h1>
          <p className="font-mono text-sm text-muted-foreground">
            Week {week.weekNumber} <span aria-hidden="true">·</span> {formatRange(week.startDate, week.endDate)}
          </p>
        </div>

        {week.summary && <p className="mt-4 max-w-prose text-lg leading-relaxed text-muted-foreground">{week.summary}</p>}

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <StatChip label="This week" value={done} format={(n) => `${n} / ${week.items.length} done`} />
          <StatChip label="Progress" value={pct} format={(n) => `${n}%`} />
          <StatChip label="Time" value={formatMinutes(week.plannedMinutes)} icon={<Clock />} />
          {/* v4 reports by skill below instead of one overall number. */}
          {evaluation && !evaluation.v4 && (
            <StatChip label="Level" value={evaluation.overallLevel} format={(n) => `${n}/5`} icon={<Sparkles />} />
          )}
        </div>

        <Progress
          value={pct}
          className="mt-5 h-2 max-w-xl"
          indicatorClassName="bg-summit"
          aria-label={`This week: ${pct}% done`}
        />

        <Link
          to="/library"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md font-mono text-xs text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trailmark"
        >
          <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
          {week.libraryLessonCount} lessons unlocked in your library
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>

        {next && <NextStepCard item={next} started={done > 0} />}

        {evaluation?.v4 && <SkillReport report={evaluation.v4} className="mt-8 max-w-3xl" />}

        <div className="mt-6 space-y-4">
          <SummitCelebration
            reached={complete}
            weekNumber={week.weekNumber}
            minutes={week.plannedMinutes}
            onPlanNext={onPlanNext}
            planning={planning}
          />
          {planError && (
            <div className="max-w-prose">
              <FormAlert>{planError}</FormAlert>
            </div>
          )}
          {error && (
            <div className="max-w-prose">
              <FormAlert>{error}</FormAlert>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * "Your next step" — the one card on this page with a tint and a filled button.
 *
 * It repeats what the lanes below already say, which is the point: the answer to "what now" should not
 * require reading four lanes to find the first thing without a tick.
 */
function NextStepCard({ item, started }: { item: WeekItemView; started: boolean }) {
  const meta = LANE_META[item.lane];
  const Icon = meta.icon;

  return (
    <Card tone="progress" density="cozy" className="mt-7 max-w-2xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-muted-foreground">
            {started ? "Pick up where you left off" : "Your first waypoint"}
          </p>
          <p className="mt-1.5 font-display text-lg font-semibold">{item.title}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground">
            <span className={cn("inline-flex items-center gap-1.5 font-mono text-xs font-medium", meta.text)}>
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {meta.label}
            </span>
            <span className="min-w-0 truncate">{item.context}</span>
            <span className="font-mono text-xs">{formatMinutesCompact(item.minutes)}</span>
          </p>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">{item.reason}</p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link to={item.href}>{started ? "Continue" : "Start"}</Link>
        </Button>
      </div>
    </Card>
  );
}

/** "Coming up next week" — titles only, collapsed. Nothing is scheduled from it. */
function ComingUp({ week }: { week: WeekView }) {
  const [open, setOpen] = useState(false);
  if (week.nextWeekPreview.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 pb-4 sm:px-8">
      <Disclosure
        open={open}
        onToggle={() => setOpen((value) => !value)}
        icon={<Telescope className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
        label="Coming up next week"
        hint={`${week.nextWeekPreview.length} likely, nothing scheduled yet`}
        id="coming-up"
      >
        <ul className="mt-3 space-y-1.5">
          {week.nextWeekPreview.map((title) => (
            <li key={title} className="flex items-baseline gap-2.5 text-sm text-muted-foreground">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-basalt/60" />
              {title}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          A preview from your library, in the order we would pick next. It will change as your scores do.
        </p>
      </Disclosure>
    </section>
  );
}

/**
 * The long view: the whole route as one trail of milestones, with this week marked on it, and the
 * long narrative (the old 450-word paragraph) behind a disclosure underneath.
 */
function Roadmap({ week, path, history }: { week: WeekView; path: LearningPathView | null; history: WeekResponse["history"] }) {
  const [open, setOpen] = useState(false);
  const hasRoute = path !== null && path.items.length > 0;
  const hasNarrative = week.roadmapNarrative.trim() !== "";
  if (!hasRoute && !hasNarrative) return null;

  return (
    <section aria-labelledby="route-heading" className="mx-auto max-w-5xl px-4 pb-4 sm:px-8">
      {hasRoute && (
        <div className="mb-4 rounded-lg border px-4 pb-2 pt-4">
          <h2 id="route-heading" className="font-display font-semibold">
            Your whole route
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Every course on your path, in order. Week {week.weekNumber} is marked where it is working now.
          </p>
          <div className="mt-3">
            <OverviewTrail path={path} week={week} history={history} />
          </div>
        </div>
      )}
      {hasNarrative && (
        <Disclosure
          open={open}
          onToggle={() => setOpen((value) => !value)}
          icon={<MapIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
          label="Long-term roadmap"
          hint="Where this week sits in the months ahead"
          id="roadmap"
        >
          <div className="mt-3 max-w-prose space-y-3 text-sm leading-relaxed text-muted-foreground">
            {week.roadmapNarrative.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </Disclosure>
      )}
    </section>
  );
}

/**
 * Past weeks, as "Week 1 · 11/12 done". Each row opens that week as its own small, read-only trail,
 * fetched the first time it is opened.
 */
function WeekHistory({ week, history }: { week: WeekView; history: WeekResponse["history"] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Record<string, WeekView | "error">>({});
  const past = history.filter((entry) => entry.id !== week.id);

  const show = (id: string) => {
    setExpanded((current) => (current === id ? null : id));
    if (loaded[id]) return;
    weekApi
      .byId(id)
      .then((result) => setLoaded((value) => ({ ...value, [id]: result.week })))
      .catch(() => setLoaded((value) => ({ ...value, [id]: "error" })));
  };

  if (past.length === 0) return <div className="pb-16" />;

  /** The week after `n`: the current one (an in-page link) or another past one (opens it here). */
  const nextOf = (weekNumber: number): NextWeekLink | null => {
    if (week.weekNumber === weekNumber + 1) return { label: `Next: week ${week.weekNumber}`, href: "#week-heading" };
    const following = past.find((entry) => entry.weekNumber === weekNumber + 1);
    return following ? { label: `Next: week ${following.weekNumber}`, onClick: () => show(following.id) } : null;
  };

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-8">
      <Disclosure
        open={open}
        onToggle={() => setOpen((value) => !value)}
        icon={<ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
        label="Past weeks"
        hint={`${past.length} behind you`}
        id="history"
      >
        <ul className="mt-3 divide-y rounded-md border">
          {past.map((entry) => {
            const isOpen = expanded === entry.id;
            const data = loaded[entry.id];
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => show(entry.id)}
                  aria-expanded={isOpen}
                  aria-controls={`past-week-${entry.id}`}
                  className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-left transition-colors duration-[120ms] hover:bg-surface-sunken/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-trailmark"
                >
                  <span className="font-medium">Week {entry.weekNumber}</span>
                  <span className="font-mono text-[11px] text-muted-foreground tabular">
                    {entry.doneCount}/{entry.totalCount} done
                  </span>
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                    {formatRange(entry.startDate, entry.endDate)}
                  </span>
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div id={`past-week-${entry.id}`} className="border-t px-3 pb-3 pt-2">
                    {data === undefined ? (
                      <p role="status" className="py-4 text-sm text-muted-foreground">
                        Loading week {entry.weekNumber}…
                      </p>
                    ) : data === "error" ? (
                      <p className="py-4 text-sm text-muted-foreground">Could not load this week.</p>
                    ) : (
                      <WeekTrail week={data} compact next={nextOf(entry.weekNumber)} />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Disclosure>
    </section>
  );
}

/**
 * A collapsed section.
 *
 * Three of these sit at the bottom of the page — coming up, the roadmap, past weeks — and they are all
 * the same shape: a row you press, and content that is genuinely absent until you do. Absent rather
 * than hidden, so a screen reader is not walking three hundred words of roadmap to reach the footer.
 */
function Disclosure({
  open,
  onToggle,
  icon,
  label,
  hint,
  id,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
  id: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left transition-colors duration-[120ms] hover:bg-surface-sunken/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-trailmark"
      >
        {icon}
        <span className="font-display font-semibold">{label}</span>
        <span className="font-mono text-[11px] text-muted-foreground">{hint}</span>
        <ChevronDown
          className={cn("ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open && (
        <motion.div
          id={`${id}-panel`}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={fadeUp}
          className="border-t px-4 pb-4 pt-1"
        >
          {children}
        </motion.div>
      )}
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
