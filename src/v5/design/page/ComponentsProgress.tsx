import { useState } from "react";

import { Button } from "../components/Button";
import { LANES, LaneChip } from "../components/LaneChip";
import { ProgressBar, ProgressRing } from "../components/Progress";
import { SkillMeter, StreakFlame, XPCounter } from "../components/Stats";
import { Trail } from "../components/Trail";
import type { TrailStop } from "../trail";
import { Demo, Preview } from "./scaffold";

const STOPS: TrailStop[] = [
  { id: "t1", title: "How JavaScript runs your code", meta: "Must know · 20 min", lane: "must_know", done: true },
  { id: "t2", title: "Closures", meta: "Do it now · 25 min", lane: "do_now", done: true },
  { id: "t3", title: "The event loop", meta: "Must know · 40 min", lane: "must_know", done: false },
  { id: "t4", title: "Promises in depth", meta: "Medium · 30 min", lane: "medium", done: false },
  { id: "t5", title: "Generators", meta: "Low · 15 min", lane: "low", done: false },
];

const HISTORY = [
  { week: "2026-W33", met: true },
  { week: "2026-W34", met: true },
  { week: "2026-W35", met: false },
  { week: "2026-W36", met: true },
  { week: "2026-W37", met: false, frozen: true },
  { week: "2026-W38", met: true },
  { week: "2026-W39", met: true },
  { week: "2026-W40", met: true },
];

function XpDemo() {
  const [xp, setXp] = useState(1240);
  const [gained, setGained] = useState<number | undefined>();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <XPCounter value={xp} gained={gained} />
      <Button
        size="sm"
        onClick={() => {
          setXp((v) => v + 30);
          setGained(30);
        }}
      >
        Finish a lesson (+30)
      </Button>
    </div>
  );
}

export default function ComponentsProgress() {
  return (
    <>
      <Demo id="c-progress" name="ProgressRing and ProgressBar" use="The ring is for one goal (this week's hours). The bar is for a count (3 of 8 videos). Both announce their value; the fill animates once.">
        <Preview>
          <div className="flex flex-wrap items-center gap-6 pt-4">
            <ProgressRing value={70} label="Weekly goal" />
            <ProgressRing value={100} tone="success" size={72} stroke={6} label="Module done">
              <span className="text-small">Done</span>
            </ProgressRing>
            <div className="flex min-w-48 flex-1 flex-col gap-3">
              <ProgressBar value={3} max={8} label="Videos watched" showValue="3 of 8" />
              <ProgressBar value={45} tone="warning" label="Test time used" showValue size="sm" />
            </div>
          </div>
        </Preview>
      </Demo>

      <Demo id="c-lane" name="LaneChip" use="Plan lanes, same names and meaning as before: Do it now (blocking), Must know, Medium, Low. Always the word, never just the colour.">
        <Preview>
          <div className="flex flex-wrap gap-2 pt-4">
            {LANES.map((lane) => (
              <LaneChip key={lane} lane={lane} />
            ))}
            {LANES.map((lane) => (
              <LaneChip key={`${lane}-sm`} lane={lane} size="sm" />
            ))}
          </div>
        </Preview>
      </Demo>

      <Demo id="c-skill" name="SkillMeter" use="A skill level from 0 to 5, with its name (Aware, Learning, Working, Strong, Expert). An outlined segment marks the level we're aiming for.">
        <Preview>
          <div className="flex max-w-sm flex-col gap-4 pt-4">
            <SkillMeter label="React" level={3.5} target={4} />
            <SkillMeter label="SQL" level={1} target={3} />
            <SkillMeter label="Git" level={5} />
          </div>
        </Preview>
      </Demo>

      <Demo id="c-streak" name="StreakFlame and XPCounter" use="The streak is weekly, so a weekend off never breaks it. One freeze a month is used on its own. XP ticks up when it changes.">
        <Preview>
          <div className="flex flex-col gap-5 pt-4">
            <StreakFlame current={4} best={6} freezesLeft={1} history={HISTORY} />
            <XpDemo />
          </div>
        </Preview>
      </Demo>

      <Demo
        id="c-trail"
        name="Trail and Waypoint"
        use="The plan as a trail: one continuous path from start to summit, waypoints in plan order, the walked part drawn over the same line. It is also an ordered list for screen readers. Below 768 px it zig-zags down the left."
      >
        <Preview>
          <div className="pt-4">
            <Trail stops={STOPS} label="This week's trail" />
          </div>
        </Preview>
      </Demo>
    </>
  );
}
