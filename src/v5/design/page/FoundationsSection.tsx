import { m } from "motion/react";
import { useState } from "react";

import { Button } from "../components/Button";
import { densityPx } from "../density";
import { usePrefersReducedMotion } from "../hooks";
import { cubicBezier, durationMs, easing, springs, type DurationName, type EasingName } from "../motion";
import { Preview } from "./scaffold";

const TYPE_SCALE = [
  { cls: "text-display font-display font-semibold", name: "display", spec: "34–44 px fluid, Sora 600", use: "One per page at most: the Today greeting, a summit." },
  { cls: "text-h1 font-display font-semibold", name: "h1", spec: "32 / 40, Sora 600", use: "Page titles." },
  { cls: "text-h2 font-display font-semibold", name: "h2", spec: "24 / 32, Sora 600", use: "Section titles." },
  { cls: "text-h3 font-display font-semibold", name: "h3", spec: "20 / 28, Sora 600", use: "Card and dialog titles." },
  { cls: "text-h4 font-display font-semibold", name: "h4", spec: "17 / 24, Sora 600", use: "Small headings inside cards." },
  { cls: "text-lead", name: "lead", spec: "18 / 28, Geist", use: "The first line under a page title." },
  { cls: "text-body", name: "body", spec: "16 / 26, Geist", use: "Everything you read." },
  { cls: "text-small", name: "small", spec: "14 / 22, Geist", use: "Labels, table cells, buttons." },
  { cls: "text-caption", name: "caption", spec: "12 / 18, Geist", use: "Meta lines, timestamps. Never for sentences." },
  { cls: "font-mono text-small", name: "mono", spec: "14, JetBrains Mono", use: "Code, IDs, keyboard keys." },
];

const SPACING = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];

/** Literal class names (Tailwind only sees whole strings). */
const ELEVATIONS = [
  { name: "shadow-e1", radius: "rounded-control", cls: "bg-surface-1 shadow-e1 rounded-control" },
  { name: "shadow-e2", radius: "rounded-card", cls: "bg-surface-2 shadow-e2 rounded-card" },
  { name: "shadow-e3", radius: "rounded-sheet", cls: "bg-surface-3 shadow-e3 rounded-sheet" },
];

function TypeScale() {
  return (
    <div>
      <h3 className="font-display text-h3 font-semibold text-fg-1">Type</h3>
      <p className="mt-1 max-w-article text-small text-fg-2">
        Sora for headings, Geist Sans for reading and UI, JetBrains Mono for code. All three are self-hosted and load only in the new design.
      </p>
      <ul className="mt-4 divide-y divide-line-1 rounded-card border border-line-1 bg-surface-1">
        {TYPE_SCALE.map((t) => (
          <li key={t.name} className="grid gap-1 p-4 md:grid-cols-[10rem_1fr] md:items-baseline md:gap-6">
            <span className="text-caption text-fg-2">
              <span className="font-mono text-fg-1">text-{t.name}</span>
              <br />
              {t.spec}
            </span>
            <span>
              <span className={`${t.cls} block text-fg-1`}>Reach the summit, one waypoint at a time</span>
              <span className="mt-1 block text-caption text-fg-2">{t.use}</span>
            </span>
          </li>
        ))}
      </ul>
      <h4 className="mt-8 text-small font-semibold text-fg-1">Article measure: 68 characters</h4>
      <p className="mt-2 max-w-article rounded-card border border-dashed border-line-2 p-4 text-body text-fg-1">
        Reading text stops at 68ch (<span className="font-mono">max-w-article</span>), inside the 65–75 character range where long lines stay easy to follow. This
        paragraph is exactly that wide, so you can see where a lesson's text would wrap on a big screen.
      </p>
    </div>
  );
}

function Spacing() {
  return (
    <div>
      <h3 className="font-display text-h3 font-semibold text-fg-1">Spacing, radius, elevation</h3>
      <p className="mt-1 max-w-article text-small text-fg-2">Everything sits on a 4 px grid: Tailwind's spacing step is 4 px, so p-4 is 16 px.</p>
      <ul className="mt-4 flex flex-col gap-1.5">
        {SPACING.map((n) => (
          <li key={n} className="flex items-center gap-3 text-caption">
            <span className="w-24 font-mono text-fg-1">
              {n} = {n * 4} px
            </span>
            <span className="h-3 rounded-sm bg-brand" style={{ width: n * 4 }} />
          </li>
        ))}
      </ul>
      <h4 className="mt-6 text-small font-semibold text-fg-1">Density</h4>
      <table className="mt-2 w-full max-w-xl text-left text-small">
        <caption className="sr-only">Sizes per density mode</caption>
        <thead className="text-fg-2">
          <tr>
            <th scope="col" className="py-1 font-medium">Token</th>
            <th scope="col" className="py-1 font-medium">Comfortable</th>
            <th scope="col" className="py-1 font-medium">Compact</th>
          </tr>
        </thead>
        <tbody className="font-mono text-fg-1">
          {(
            [
              ["h-(--v5-control-h)", "control"],
              ["h-(--v5-row-h)", "row"],
              ["p-(--v5-card-pad)", "cardPad"],
              ["gap-(--v5-gap)", "gap"],
            ] as const
          ).map(([cls, key]) => (
            <tr key={cls} className="border-t border-line-1">
              <td className="py-1">{cls}</td>
              <td className="py-1">{densityPx.comfortable[key]} px</td>
              <td className="py-1">{densityPx.compact[key]} px</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6">
        <Preview>
          <div className="flex flex-wrap gap-4 pt-4">
            {ELEVATIONS.map((e) => (
              <div key={e.name} className={`grid h-20 w-32 place-items-center border border-line-1 text-caption ${e.cls}`}>
                <span className="text-center font-mono text-fg-1">
                  {e.name}
                  <br />
                  {e.radius}
                </span>
              </div>
            ))}
          </div>
        </Preview>
      </div>
    </div>
  );
}

function MotionDemo() {
  const reduce = usePrefersReducedMotion();
  const [on, setOn] = useState(false);
  const DURS = Object.keys(durationMs) as DurationName[];
  const EASES = Object.keys(easing) as EasingName[];
  return (
    <div>
      <h3 className="font-display text-h3 font-semibold text-fg-1">Motion</h3>
      <p className="mt-1 max-w-article text-small text-fg-2">
        Four durations and four curves. Move only transform and opacity. Celebrations last 2 s at most and can be skipped. With reduced motion on, things appear in
        place instead of moving{reduce ? " (it is on now, so the dots below jump)" : ""}.
      </p>
      <Button className="mt-4" onClick={() => setOn((v) => !v)} aria-pressed={on}>
        {on ? "Move them back" : "Play the motion demo"}
      </Button>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="text-small font-semibold text-fg-1">Durations (ease out)</h4>
          <ul className="mt-2 flex flex-col gap-2">
            {DURS.map((d) => (
              <li key={d} className="flex items-center gap-3">
                <span className="w-32 font-mono text-caption text-fg-1">
                  {d} {durationMs[d]} ms
                </span>
                <span className="relative h-6 flex-1 rounded-full bg-sunken">
                  <m.span
                    className="absolute left-1 top-1 size-4 rounded-full bg-brand"
                    animate={{ x: on ? 160 : 0 }}
                    transition={{ duration: durationMs[d] / 1000, ease: easing.out }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-small font-semibold text-fg-1">Curves (320 ms)</h4>
          <ul className="mt-2 flex flex-col gap-2">
            {EASES.map((e) => (
              <li key={e} className="flex items-center gap-3">
                <span className="w-32 font-mono text-caption text-fg-1" title={cubicBezier(e)}>
                  {e}
                </span>
                <span className="relative h-6 flex-1 rounded-full bg-sunken">
                  <m.span className="absolute left-1 top-1 size-4 rounded-full bg-success" animate={{ x: on ? 160 : 0 }} transition={{ duration: 0.32, ease: easing[e] }} />
                </span>
              </li>
            ))}
            {(Object.keys(springs) as (keyof typeof springs)[]).map((s) => (
              <li key={s} className="flex items-center gap-3">
                <span className="w-32 font-mono text-caption text-fg-1">spring.{s}</span>
                <span className="relative h-6 flex-1 rounded-full bg-sunken">
                  <m.span className="absolute left-1 top-1 size-4 rounded-full bg-warning" animate={{ x: on ? 160 : 0 }} transition={springs[s]} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function FoundationsSection() {
  return (
    <div className="flex flex-col gap-12">
      <TypeScale />
      <Spacing />
      <MotionDemo />
    </div>
  );
}
