import { useState } from "react";
import { Check, ChevronDown, Clock, Pin } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";

import type { PlanLane, WeekItemView, WeekView } from "@shared/weeklyPlan";
import { LANE_ORDER, itemsInLane } from "@shared/weeklyPlanCore";

import { Button } from "@/components/ui/button";
import { useIsNarrow } from "@/hooks/useMediaQuery";
import { levelLabels } from "@/lib/track-meta";
import { fadeUp, stagger } from "@/lib/motion";
import { cn, formatMinutes, formatMinutesCompact } from "@/lib/utils";
import { LANE_META } from "./laneMeta";

/**
 * The four lanes as a list.
 *
 * The same data as the trail, read a different way: the map answers "where am I", the list answers
 * "what have I actually got left". Both are first-class — the toggle between them is remembered — and
 * neither is a fallback for the other.
 *
 * An empty lane is not rendered. A box that says "nothing here" is worse than the absence of a box,
 * because it takes up the space of real work and has to be read to be dismissed.
 */
export function Lanes({ week }: { week: WeekView }) {
  const present = LANE_ORDER.filter((lane) => week.items.some((item) => item.lane === lane));

  return (
    <div className="space-y-4">
      {present.map((lane) => (
        <Lane key={lane} lane={lane} items={itemsInLane(week, lane)} />
      ))}
    </div>
  );
}

function Lane({ lane, items }: { lane: PlanLane; items: WeekItemView[] }) {
  const meta = LANE_META[lane];
  const narrow = useIsNarrow();
  const reduceMotion = useReducedMotion();

  /* Red is always open — it is the reason the page exists. The others collapse, and start collapsed on
     a phone, where four expanded lanes is a page nobody scrolls to the bottom of. */
  const [open, setOpen] = useState(() => !meta.collapsible || !narrow);

  const minutes = items.reduce((sum, item) => sum + item.minutes, 0);
  const done = items.filter((item) => item.status === "done").length;
  const Icon = meta.icon;
  const headingId = `lane-${lane}`;

  return (
    <motion.section
      aria-labelledby={headingId}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={fadeUp}
      className={cn("overflow-hidden rounded-lg border", meta.border, meta.soft)}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
        <Icon className={cn("h-4 w-4 shrink-0", meta.text)} aria-hidden="true" />
        <h3 id={headingId} className="font-display font-semibold">
          {meta.label}
        </h3>
        <p className="font-mono text-[11px] text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"} <span aria-hidden="true">·</span> {formatMinutes(minutes)}
          {done > 0 && (
            <>
              {" "}
              <span aria-hidden="true">·</span> {done} done
            </>
          )}
        </p>

        {meta.collapsible && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={`${headingId}-items`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
          >
            {open ? "Hide" : "Show"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
          </button>
        )}
      </div>

      <p className="px-4 pb-3 text-sm text-muted-foreground">{meta.hint}</p>

      {open && (
        <motion.ul
          id={`${headingId}-items`}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={stagger(0.035)}
          className="divide-y border-t bg-surface"
        >
          {items.map((item) => (
            <motion.li key={item.id} variants={fadeUp}>
              <LaneRow item={item} lane={lane} />
            </motion.li>
          ))}
        </motion.ul>
      )}
    </motion.section>
  );
}

function LaneRow({ item, lane }: { item: WeekItemView; lane: PlanLane }) {
  const meta = LANE_META[lane];
  const done = item.status === "done";

  return (
    <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-4">
      <span
        aria-hidden="true"
        className={cn(
          "mt-1 hidden h-5 w-5 shrink-0 items-center justify-center sm:flex",
          lane === "must_know" ? "rounded-[3px]" : "rounded-full",
          done ? "bg-summit text-summit-foreground" : meta.dot,
        )}
      >
        {done && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn("font-medium leading-snug", done && "text-muted-foreground line-through decoration-summit/60")}>
          {item.title}
          {item.pinned && <Pin className="ml-1.5 inline h-3 w-3 -translate-y-0.5 text-destructive" aria-label="Pinned by your administrator" />}
        </p>

        <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-muted-foreground">
          <span className="min-w-0 truncate">{item.context}</span>
          {item.level && <span>{levelLabels[item.level]}</span>}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {formatMinutesCompact(item.minutes)}
          </span>
          {done && <span className="text-summit-strong">done</span>}
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Why: </span>
          {item.reason}
        </p>

        {item.dependsOn.length > 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            <span className="font-medium">Needs: </span>
            {item.dependsOn.map((dependency, index) => (
              <span key={dependency.key}>
                {/* An in-page jump rather than a route: the thing it needs is on this screen. */}
                <a href={`#lane-must_know`} className="underline decoration-dotted underline-offset-2 hover:text-foreground">
                  {dependency.title}
                </a>
                {index < item.dependsOn.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
      </div>

      <Button asChild variant={lane === "do_now" && !done ? "default" : "outline"} size="sm" className="shrink-0 self-start">
        <Link to={item.href}>{done ? "Revisit" : item.status === "skipped" ? "Pick up" : "Start"}</Link>
      </Button>
    </div>
  );
}
