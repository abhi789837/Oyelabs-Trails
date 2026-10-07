import { useMemo } from "react";
import { Check, Flag, Signpost } from "lucide-react";
import { Link } from "react-router-dom";

import { PART_LABELS, type LearningPathView, type PartType, type PathItemView } from "@shared/builder";
import { laterGroupLabel, laterLabel, needsLine, splitPath } from "@shared/pathView";
import type { WeekHistoryEntry, WeekView } from "@shared/weeklyPlan";

import { useElementWidth } from "@/hooks/useElementWidth";
import { cn } from "@/lib/utils";
import { computeTrail, estimateLabelHeight, pointAlong, type TrailWaypoint } from "./trailGeometry";

/**
 * The whole route: one milestone per course or module on the learner's path, in path order, with
 * the weeks marked along it.
 *
 * Same geometry and the same single-path rule as the weekly trail (`data-testid="overview-trail-path"`).
 * The milestones come from `/api/me/path` (part, then position); a milestone is walked when every
 * lesson in it is done, and the solid line runs to the furthest walked one.
 *
 * Weeks: the current week sits on the stretch leading into the first milestone it has work from
 * (matched by module id from each item's link, or course id). Past weeks carry no item list in the
 * history, so they are spaced evenly between the trailhead and the current week — a timeline, not a
 * claim about which course each one covered.
 */

const PART_VAR: Record<PartType, string> = { track: "--trailmark", ai_dev: "--ridge", general: "--basalt", prerequisite: "--trailmark", capstone: "--summit" };

/** v4.3: the path's one-line reason, in roughly the lines it takes under the title (11px text). */
function reasonLines(reason: string, width: number): number {
  return reason ? Math.max(1, Math.ceil((reason.length * 6.2) / Math.max(40, width))) : 0;
}

function partColor(part: PartType | null, alpha = 1): string {
  const cssVar = PART_VAR[part ?? "general"];
  return alpha === 1 ? `rgb(var(${cssVar}))` : `rgb(var(${cssVar}) / ${alpha})`;
}

export function sortPathItems(items: readonly PathItemView[]): PathItemView[] {
  return [...items].sort((a, b) => (a.partNumber ?? 0) - (b.partNumber ?? 0) || a.position - b.position);
}

const moduleOf = (href: string) => /\/module\/([^/]+)/.exec(href)?.[1] ?? null;

/** Which milestone the week is walking toward: its first unfinished item's milestone, else its first. */
export function currentMilestoneIndex(milestones: readonly PathItemView[], week: WeekView): number {
  const matchFor = (item: WeekView["items"][number]) =>
    milestones.findIndex(
      (m) => (m.courseId !== null && m.courseId === item.courseId) || (m.moduleId != null && m.moduleId === moduleOf(item.href)),
    );
  const open = week.items.filter((item) => item.status !== "done").map(matchFor).filter((i) => i >= 0);
  if (open.length) return Math.min(...open);
  const any = week.items.map(matchFor).filter((i) => i >= 0);
  if (any.length) return Math.min(...any);
  const firstOpen = milestones.findIndex((m) => !(m.topicCount > 0 && m.completedCount >= m.topicCount));
  return firstOpen >= 0 ? firstOpen : Math.max(0, milestones.length - 1);
}

export function OverviewTrail({ path, week, history }: { path: LearningPathView; week: WeekView; history: WeekHistoryEntry[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const all = useMemo(() => sortPathItems(path.items), [path.items]);
  /* v4.5: a long path draws its first weeks; the rest fold under "Later (N more)", by goal. */
  const split = useMemo(() => splitPath(all, currentMilestoneIndex(all, week) + 3), [all, week]);
  const milestones = split.first;

  const geometry = useMemo(() => {
    if (width <= 0) return null;
    return computeTrail({
      width,
      compact: true,
      startLabelHeight: 36,
      endLabelHeight: 36,
      items: milestones.map((m) => ({
        id: m.id,
        tone: m.partType ?? "general",
        done: m.topicCount > 0 && m.completedCount >= m.topicCount,
        labelHeight: (w: number) =>
          estimateLabelHeight({ title: m.courseTitle, meta: `Part ${m.partNumber ?? 1}  ${m.completedCount}/${m.topicCount} lessons`, compact: true, extraLines: reasonLines(m.reason, w) }, w),
      })),
    });
  }, [milestones, width]);

  const current = currentMilestoneIndex(milestones, week);
  const currentPos = current + 0.5;
  const past = history.filter((entry) => entry.id !== week.id && entry.weekNumber < week.weekNumber).sort((a, b) => a.weekNumber - b.weekNumber);

  return (
    <>
    <div ref={ref} className="relative w-full" style={{ height: geometry ? geometry.height : 240 }}>
      {geometry && (
        <>
          <svg width={geometry.width} height={geometry.height} className="absolute inset-0" aria-hidden="true">
            <path d={geometry.d} fill="none" stroke="rgb(var(--foreground) / 0.06)" strokeWidth={10} strokeLinecap="round" />
            {geometry.segments.map((s) => (
              <path
                key={s.index}
                d={s.d}
                fill="none"
                stroke={s.tone === "summit" ? "rgb(var(--summit) / 0.3)" : partColor(s.tone as PartType, 0.3)}
                strokeWidth={5}
                strokeLinecap="butt"
              />
            ))}
            <path
              data-testid="overview-trail-path"
              d={geometry.d}
              fill="none"
              stroke="rgb(var(--basalt) / 0.85)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="5 6"
            />
            {geometry.progressD && <path d={geometry.progressD} fill="none" stroke="rgb(var(--primary))" strokeWidth={3.5} strokeLinecap="round" />}
          </svg>

          <Endpoint waypoint={geometry.waypoints[0]} title="Start" hint={`${milestones.length} milestones`} icon="start" />

          <ol className="contents" aria-label="Your route, milestone by milestone">
            {milestones.map((m, i) => (
              <Milestone key={m.id} item={m} waypoint={geometry.waypoints[i + 1]} current={i === current} weekNumber={week.weekNumber} />
            ))}
          </ol>

          {past.map((entry, j) => {
            const point = pointAlong(geometry, (currentPos * (j + 1)) / (past.length + 1));
            return (
              <span
                key={entry.id}
                aria-hidden="true"
                title={`Week ${entry.weekNumber}: ${entry.doneCount}/${entry.totalCount} done`}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-background px-1.5 py-px font-mono text-[10px] text-muted-foreground"
                style={{ left: point.x, top: point.y }}
              >
                W{entry.weekNumber}
              </span>
            );
          })}

          {(() => {
            const point = pointAlong(geometry, currentPos);
            return (
              <a
                href="#week-heading"
                data-testid="overview-current-week"
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-trailmark px-2.5 py-0.5 font-mono text-[11px] font-semibold text-trailmark-foreground shadow-sm ring-2 ring-background hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
                style={{ left: point.x, top: point.y }}
              >
                Week {week.weekNumber}
                <span className="sr-only">, this week: open its trail</span>
              </a>
            );
          })()}

          <Endpoint
            waypoint={geometry.waypoints[geometry.waypoints.length - 1]}
            title={geometry.summitReached ? "Route complete" : "Route summit"}
            hint={PART_LABELS[milestones[milestones.length - 1]?.partType ?? "general"]}
            icon="end"
            reached={geometry.summitReached}
          />
        </>
      )}
    </div>
    {split.laterCount > 0 && (
      <details className="mt-3 rounded-md border" data-testid="path-later">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong">
          {laterLabel(split.laterCount)}
        </summary>
        <div className="divide-y border-t">
          {split.later.map((group) => (
            <section key={group.goal ?? "other"} className="px-4 py-2.5" aria-label={laterGroupLabel(group.goal)}>
              <h3 className="font-mono text-[11px] text-muted-foreground">{laterGroupLabel(group.goal)}</h3>
              <ul className="mt-1 space-y-0.5 text-sm">
                {group.items.map((item) => (
                  <li key={item.id}>{item.courseTitle}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </details>
    )}
    </>
  );
}

function Endpoint({
  waypoint,
  title,
  hint,
  icon,
  reached = false,
}: {
  waypoint: TrailWaypoint;
  title: string;
  hint: string;
  icon: "start" | "end";
  reached?: boolean;
}) {
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md",
          icon === "start" ? "border-2 border-foreground/70 bg-background" : reached ? "rounded-full bg-summit text-summit-foreground" : "rounded-full border-2 border-dashed border-basalt bg-background text-muted-foreground",
        )}
        style={{ left: waypoint.point.x, top: waypoint.point.y }}
      >
        {icon === "start" ? <Signpost className="h-3.5 w-3.5" /> : <Flag className="h-3.5 w-3.5" />}
      </span>
      <div aria-hidden="true" className="absolute -translate-y-1/2" style={{ left: waypoint.label.left, top: waypoint.point.y, width: waypoint.label.width }}>
        <p className="font-display text-sm font-semibold">{title}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </>
  );
}

function Milestone({
  item,
  waypoint,
  current,
  weekNumber,
}: {
  item: PathItemView;
  waypoint: TrailWaypoint;
  current: boolean;
  weekNumber: number;
}) {
  const done = item.topicCount > 0 && item.completedCount >= item.topicCount;
  const left = waypoint.label.side === "left";
  const href = item.available ? (item.href ?? (item.courseId ? `/courses/${item.courseId}` : null)) : null;
  const markerClass = cn(
    "absolute z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-background",
    done && "border-transparent bg-summit text-summit-foreground",
    current && !done && "ring-2 ring-trailmark ring-offset-2 ring-offset-background",
  );
  const markerStyle = { left: waypoint.point.x, top: waypoint.point.y, borderColor: done ? undefined : partColor(item.partType) };

  return (
    <li>
      <span aria-hidden="true" className={markerClass} style={markerStyle}>
        {done && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <div className={cn("absolute -translate-y-1/2", left ? "text-right" : "text-left")} style={{ left: waypoint.label.left, top: waypoint.point.y, width: waypoint.label.width }}>
        {href ? (
          <Link
            to={href}
            className={cn(
              "rounded-sm font-display text-[13px] font-semibold leading-snug hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
              done && "text-muted-foreground",
            )}
          >
            {item.courseTitle}
          </Link>
        ) : (
          <p className={cn("font-display text-[13px] font-semibold leading-snug", done && "text-muted-foreground")}>{item.courseTitle}</p>
        )}
        <p className="font-mono text-[11px] text-muted-foreground">
          <span style={{ color: partColor(item.partType) }}>Part {item.partNumber ?? 1}</span>{" "}
          {item.goalId ? (item.goalAchieved ? "Goal achieved" : "Pass it to achieve the goal") : `${item.completedCount}/${item.topicCount} lessons`}
          {current && <span className="sr-only">, week {weekNumber} is working on this</span>}
        </p>
        {needsLine(item) && <p className="text-[11px] leading-snug text-muted-foreground">{needsLine(item)}</p>}
        {item.reason && <p className="text-[11px] leading-snug text-muted-foreground">{item.reason}</p>}
      </div>
    </li>
  );
}
