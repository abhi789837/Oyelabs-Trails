import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import type { TodayHero } from "@shared/today";
import { cn } from "@/v5/design/cn";

import { HERO_LANE, PRIMARY_LG, minutesLabel, stepLine } from "./format";

// ---------------------------------------------------------------------------
// Hero: "what should I do now?"
// ---------------------------------------------------------------------------

export function HeroCard({ hero }: { hero: TodayHero }) {
  const step = stepLine(hero.step, hero.positionSec);
  const lane = hero.lane ? HERO_LANE[hero.lane] : null;
  return (
    <section aria-labelledby="today-hero-title" className="relative overflow-hidden rounded-card border border-line-1 bg-surface-1 shadow-e2">
      <span className={cn("absolute inset-y-0 left-0 w-1.5", lane ? lane.stripe : "bg-brand")} aria-hidden="true" />
      <div className="flex flex-col gap-5 p-5 pl-7 sm:p-7 sm:pl-9 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-small font-medium text-fg-2">{hero.kind === "resume" ? "Pick up where you left off" : "Next in your plan"}</p>
          <h2 id="today-hero-title" className="mt-1 font-display text-h2 font-semibold text-balance text-fg-1">
            <span className="sr-only">Continue: </span>
            {hero.title}
          </h2>
          {hero.context ? <p className="mt-1 text-small text-fg-2">{hero.context}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {lane ? <span className={cn("rounded-full px-2 py-0.5 text-caption font-medium", lane.chip)}>{lane.label}</span> : null}
            {step ? (
              <span className="rounded-full bg-sunken px-2 py-0.5 text-caption font-medium text-fg-1">
                <span className="sr-only">Step: </span>
                {step}
              </span>
            ) : null}
            {hero.minutesLeft !== null ? (
              <span className="text-caption text-fg-2">
                {hero.minutesLeft < 1 ? "Under a minute left" : `${minutesLabel(hero.minutesLeft)} left`}
              </span>
            ) : null}
          </div>
        </div>
        <Link to={hero.href} aria-describedby="today-hero-title" data-testid="today-continue" className={cn(PRIMARY_LG, "w-full md:w-auto")}>
          Continue
          <ChevronRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
