import { Award, ChevronRight, Compass, Pin, Snowflake, Trophy, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import type { AnnouncementView, TodayGoal, TodayResponse, TodayStreak, TodayUpNextItem, TodayWeek, TodayWin } from "@shared/today";
import { Button } from "@/v5/design/components/Button";
import { Card, CardHeader } from "@/v5/design/components/Card";
import { LANE_CLASSES } from "@/v5/design/components/LaneChip";
import { ProgressRing } from "@/v5/design/components/Progress";
import { EmptyState, ErrorState } from "@/v5/design/components/States";
import { StreakFlame } from "@/v5/design/components/Stats";
import { Trail } from "@/v5/design/components/Trail";
import { cn } from "@/v5/design/cn";
import { celebrate, openProgress } from "@/v5/motivation/celebrate";
import { freezeNotice } from "@/v5/motivation/logic";

import { hoursLabel, minutesLabel, shortDate, trailWindow, weekRange } from "./format";

// ---------------------------------------------------------------------------
// This week: mini trail, goal ring, streak
// ---------------------------------------------------------------------------

export function GoalRing({ goal }: { goal: TodayGoal }) {
  const byHours = goal.goalMinutes !== null;
  const value = byHours ? goal.loggedMinutes : goal.steps;
  const max = byHours ? goal.goalMinutes! : 3;
  const label = byHours ? `Weekly goal: ${hoursLabel(goal.loggedMinutes)} of ${hoursLabel(goal.goalMinutes!)} hours` : `Weekly goal: ${goal.steps} of 3 steps`;
  return (
    <div className="flex items-center gap-4">
      <ProgressRing value={value} max={max} label={label} tone={goal.met ? "success" : "brand"} size={88}>
        <span className="flex flex-col items-center leading-tight">
          <span className="text-h4">{byHours ? `${hoursLabel(goal.loggedMinutes)} h` : goal.steps}</span>
          <span className="font-sans text-caption font-normal text-fg-2">of {byHours ? `${hoursLabel(goal.goalMinutes!)} h` : "3 steps"}</span>
        </span>
      </ProgressRing>
      <div className="min-w-0">
        <p className="font-display text-h4 font-semibold text-fg-1">Weekly goal</p>
        <p className="text-small text-fg-2">
          {goal.met
            ? "Goal met. Nice work."
            : byHours
              ? `${minutesLabel(Math.max(0, goal.goalMinutes! - goal.loggedMinutes))} to go this week.`
              : `${Math.max(0, 3 - goal.steps)} more ${3 - goal.steps === 1 ? "step" : "steps"} this week.`}
        </p>
        {/* Phase 6: the weekly goal is the learner's to set (the "Your progress" panel). */}
        <Button variant="link" size="sm" className="mt-1" onClick={openProgress} data-testid="today-change-goal">
          Change my goal
        </Button>
      </div>
    </div>
  );
}

export function StreakBlock({ streak, week }: { streak: TodayStreak; week?: string }) {
  const frozen = week ? freezeNotice(streak.history, week) : null;
  return (
    <div>
      <p className="mb-2 font-display text-h4 font-semibold text-fg-1">Weekly streak</p>
      {frozen ? (
        <p className="mb-2 flex items-center gap-2 rounded-control bg-info-soft px-3 py-2 text-small font-medium text-info-fg" data-testid="today-freeze-used">
          <Snowflake className="size-4 shrink-0" aria-hidden="true" />
          {frozen}
        </p>
      ) : null}
      <StreakFlame current={streak.current} best={streak.best} freezesLeft={streak.freezesLeft} history={streak.history} />
      <p className="mt-2 text-caption text-fg-2">Meet your goal each week to keep it going. You get 1 freeze a month for a busy week.</p>
    </div>
  );
}

export function WeekCard({ week, goal, streak }: { week: TodayWeek | null; goal: TodayGoal; streak: TodayStreak }) {
  const navigate = useNavigate();
  const slice = week ? trailWindow(week.stops) : null;
  return (
    <Card>
      <CardHeader
        title="This week"
        description={week ? `Week ${week.weekNumber} · ${week.doneCount} of ${week.totalCount} done · ${weekRange(week.startDate, week.endDate)}` : "Your week shows here once your plan is ready."}
        action={
          <Button asChild variant="link" size="sm">
            <Link to="/learn/plan">See my plan</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
        <div className="min-w-0">
          {slice && slice.stops.length > 0 ? (
            <>
              {slice.hiddenBefore > 0 ? <p className="mb-1 text-caption text-fg-2">{slice.hiddenBefore} done before this</p> : null}
              <Trail
                compact
                label="This week's trail"
                startLabel="Start of week"
                summitLabel="Week done"
                stops={slice.stops.map((s) => ({ id: s.id, title: s.title, meta: minutesLabel(s.minutes), lane: s.lane, done: s.done }))}
                onSelect={(stop) => {
                  const target = week?.stops.find((s) => s.id === stop.id);
                  if (target) navigate(target.href);
                }}
              />
              {slice.hiddenAfter > 0 ? <p className="mt-1 text-caption text-fg-2">{slice.hiddenAfter} more in your plan</p> : null}
            </>
          ) : (
            <p className="text-small text-fg-2">Nothing planned yet.</p>
          )}
        </div>
        <div className="flex flex-col gap-6 border-line-1 lg:border-l lg:pl-6">
          <GoalRing goal={goal} />
          <StreakBlock streak={streak} week={goal.week} />
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Up next, daily review
// ---------------------------------------------------------------------------

export function UpNext({ items }: { items: TodayUpNextItem[] }) {
  return (
    <Card>
      <CardHeader title="Up next" description={items.length ? "After this, in the order that helps most." : undefined} />
      {items.length === 0 ? (
        <p className="text-small text-fg-2">Nothing else this week. Well done.</p>
      ) : (
        <ol className="flex flex-col gap-2" aria-label="Up next">
          {items.map((item) => {
            const lane = LANE_CLASSES[item.lane];
            return (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className="group flex min-h-(--v5-row-h) items-center gap-3 rounded-control border border-line-1 px-3 py-2.5 hover:bg-sunken"
                >
                  <span className={cn("size-2.5 shrink-0 rounded-full", lane.dot)} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-fg-1">{item.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-caption font-medium", lane.soft, lane.fg)} title={item.reason || undefined}>
                        {item.why}
                      </span>
                      <span className="text-caption text-fg-2">{minutesLabel(item.minutes)}</span>
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-fg-2 group-hover:text-fg-1" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

export function ReviewCard({ dueCount }: { dueCount: number }) {
  return (
    <Card>
      <CardHeader title="Daily review" description="About 5 minutes. Short recall keeps what you learned." />
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-h3 font-semibold tabular-nums text-fg-1">
          {dueCount === 0 ? "All caught up" : `${dueCount} ${dueCount === 1 ? "card" : "cards"} due`}
        </p>
        <Button asChild variant={dueCount > 0 ? "secondary" : "ghost"}>
          <Link to="/learn/review">{dueCount > 0 ? "Start review" : "Open Review"}</Link>
        </Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Pinned by your admin, recent wins
// ---------------------------------------------------------------------------

export function Announcements({ items }: { items: AnnouncementView[] }) {
  return (
    <section aria-labelledby="today-pinned">
      <h2 id="today-pinned" className="mb-3 font-display text-h4 font-semibold text-fg-1">
        Pinned by your admin
      </h2>
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {items.map((a) => (
          <li key={a.id} className="rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad)">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-fg" aria-hidden="true">
                <Pin className="size-4" />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-body font-semibold text-fg-1">{a.title}</h3>
                <p className="mt-1 whitespace-pre-line text-small text-fg-1">{a.body}</p>
                <p className="mt-2 text-caption text-fg-2">
                  {a.author ? `From ${a.author}, ` : ""}
                  {shortDate(a.createdAt)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const WIN_ICON = { certificate: Award, case_passed: Trophy, skill_level_up: TrendingUp } as const;

export function RecentWins({ wins }: { wins: TodayWin[] }) {
  return (
    <Card>
      <CardHeader title="Recent wins" />
      {wins.length === 0 ? (
        <p className="text-small text-fg-2">Your wins show up here: a practical case passed, a skill level up or a certificate.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {wins.map((w) => {
            const Icon = WIN_ICON[w.kind];
            const body = (
              <>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-success-soft text-success-fg" aria-hidden="true">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-fg-1">{w.title}</span>
                  <span className="block text-caption text-fg-2">
                    {w.label}, {shortDate(w.at)}
                  </span>
                </span>
                <span className="shrink-0 text-caption font-semibold tabular-nums text-success-fg">+{w.xp} XP</span>
              </>
            );
            return (
              <li key={`${w.kind}-${w.at}-${w.title}`}>
                {w.href ? (
                  <Link to={w.href} className="flex min-h-(--v5-row-h) items-center gap-3 rounded-control px-2 py-1.5 hover:bg-sunken">
                    {body}
                  </Link>
                ) : (
                  <div className="flex min-h-(--v5-row-h) items-center gap-3 px-2 py-1.5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Everything under the hero, as one lazy chunk (see TodayPage)
// ---------------------------------------------------------------------------

export default function TodayDetails({ data }: { data: TodayResponse }) {
  // Phase 6: reaching the weekly goal is the "weekly summit" moment, once per week.
  const { met, week } = data.goal;
  const streakWeeks = data.streak.current;
  useEffect(() => {
    if (!met) return;
    celebrate("weekly_summit", {
      ref: week,
      once: `summit:${week}`,
      detail: streakWeeks > 1 ? `Your streak is ${streakWeeks} weeks.` : "See you next week.",
    });
  }, [met, week, streakWeeks]);
  return (
    <>
      {data.hero ? null : (
        <EmptyState
          icon={<Compass />}
          title="Your plan isn't ready yet"
          body="Your admin is setting up what you'll learn first. You can look around the Library while you wait."
          action={
            <Button asChild variant="primary">
              <Link to="/learn/library">Open the Library</Link>
            </Button>
          }
        />
      )}

      {data.announcements.length > 0 ? <Announcements items={data.announcements} /> : null}

      <WeekCard week={data.week} goal={data.goal} streak={data.streak} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-(--v5-gap) lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
        <UpNext items={data.upNext} />
        <div className="flex flex-col gap-(--v5-gap) lg:gap-6">
          {data.review ? <ReviewCard dueCount={data.review.dueCount} /> : null}
          <RecentWins wins={data.wins} />
        </div>
      </div>
    </>
  );
}

/** The page's error state (the design system's ErrorState), loaded with this chunk. */
export function TodayError({ onRetry, retrying, details }: { onRetry: () => void; retrying: boolean; details?: string }) {
  return (
    <ErrorState
      title="We couldn't load Today"
      body="It's probably a short network hiccup. Your progress is saved."
      onRetry={onRetry}
      retrying={retrying}
      details={details}
    />
  );
}
