import { useState } from "react";
import { ChevronDown, CircleAlert, Plus, RotateCw } from "lucide-react";
import { Link } from "react-router-dom";

import { PART_LABELS, type LearningPathView, type PathItemView, type SkillGapView } from "@shared/builder";
import { failedLine } from "@shared/connection";
import { OYELABS_BADGE } from "@shared/oyelabsCourses";
import { coverageView, laterGroupLabel, laterLabel, needsLine, splitPath, type PathCoverage } from "@shared/pathView";
import { SLIDER_LABELS, type Slider } from "@shared/setup";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  assessedLevel,
  COURSE_STATE_LABELS,
  courseState,
  truncateWords,
  type CourseState,
  type GroupedPath,
  type PriorityGroup,
} from "./pathHelpers";

/**
 * The path, as the admin's priority list.
 *
 * The spine on screen is the spine in the data: one row per priority, in slider order, with the
 * course under it and the refreshers it depends on under that. Everything the assessment found on
 * its own is one collapsed section at the bottom.
 *
 * The rule from the brief: every High or Critical priority shows a course, or a visible reason
 * with a button that does something about it. No row is ever silent.
 */

const PRIORITY_TONE: Record<Slider, { chip: string; bar: string }> = {
  5: { chip: "bg-destructive/10 text-destructive", bar: "bg-destructive" },
  4: { chip: "bg-trailmark/12 text-trailmark-strong", bar: "bg-trailmark" },
  3: { chip: "bg-primary/10 text-primary-strong", bar: "bg-primary" },
  2: { chip: "bg-foreground/[0.07] text-muted-foreground", bar: "bg-basalt" },
  1: { chip: "bg-foreground/[0.07] text-muted-foreground", bar: "bg-basalt" },
};

const STATE_VARIANT: Record<CourseState, "success" | "progress" | "outline"> = {
  matched: "success",
  module: "success",
  reused: "success",
  generated: "success",
  generating: "progress",
  needs_review: "progress",
  waiting_setup: "outline",
  not_made: "outline",
};

const START_LABELS = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } as const;

export interface PathByPriorityProps {
  path: LearningPathView | null;
  grouped: GroupedPath;
  busy: boolean;
  building: boolean;
  onRebuild: () => void;
  /** Sends a suggestion to the Setup tab, pre-selected at Medium. */
  onPromote: (skill: string) => void;
  onOpenSetup: () => void;
  /** v4.5: what the test measured per skill, or that a goal came after it. */
  coverage?: PathCoverage | null;
  /** v4.5: Retry on a new course that failed 5 times. */
  onRetry?: (jobId: string) => void;
}

export function PathByPriority({ path, grouped, busy, building, onRebuild, onPromote, onOpenSetup, coverage, onRetry }: PathByPriorityProps) {
  const { groups, others, suggestions } = grouped;

  return (
    <div className="space-y-3">
      {groups.length === 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed px-4 py-4">
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            No priorities are set, so the path only covers their track basics.
          </p>
          <Button size="sm" variant="outline" onClick={onOpenSetup}>
            Set priorities
          </Button>
        </div>
      ) : (
        <ol className="space-y-3" aria-label="Path by priority">
          {groups.map((group) => (
            <li key={group.priority.skillId}>
              <PriorityRow group={group} path={path} busy={busy} building={building} onRebuild={onRebuild} coverage={coverage} onRetry={onRetry} />
            </li>
          ))}
        </ol>
      )}

      {others.length > 0 && (
        <section aria-labelledby="path-others" className="rounded-md border">
          <h3 id="path-others" className="border-b px-4 py-3 text-sm font-medium">
            Other courses on the path
          </h3>
          <ul className="divide-y">
            {others.map((item) => (
              <li key={item.id} className="px-4 py-3">
                <CourseLine item={item} busy={busy} onRetry={onRetry} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {suggestions.length > 0 && <AlsoSuggested suggestions={suggestions} onPromote={onPromote} />}
    </div>
  );
}

function PriorityRow({
  group,
  path,
  busy,
  building,
  onRebuild,
  coverage,
  onRetry,
}: {
  group: PriorityGroup;
  path: LearningPathView | null;
  busy: boolean;
  building: boolean;
  onRebuild: () => void;
  coverage?: PathCoverage | null;
  onRetry?: (jobId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { priority, course, refreshers, gap } = group;
  const tone = PRIORITY_TONE[priority.slider];
  // v4.5: never "not assessed": measured, still being marked, or added after the test.
  const covered = coverageView(priority.skillId, coverage, course?.startLevel, assessedLevel(gap));
  const level = covered.kind === "level" ? covered.level : null;
  const reason = course?.reason ?? "";
  const shortReason = truncateWords(reason);
  const truncated = shortReason !== reason.trim().split(/\s+/).filter(Boolean).join(" ");
  const hasEvidence = Boolean(gap) || truncated;
  const panelId = `evidence-${priority.skillId}`;

  return (
    <section className="rounded-md border" aria-label={`${priority.skillName}, ${SLIDER_LABELS[priority.slider]}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <span className={cn("rounded-sm px-1.5 py-0.5 font-mono text-[11px] font-medium", tone.chip)}>
          {SLIDER_LABELS[priority.slider]}
        </span>
        <h3 className="min-w-0 font-medium">{priority.skillName}</h3>
        {level !== null ? (
          <LevelBar level={level} bar={tone.bar} />
        ) : (
          <span className="font-mono text-[11px] text-muted-foreground" data-testid="coverage-note">
            {covered.kind === "level" ? null : covered.text}
          </span>
        )}
        {course?.startLevel && level !== null && (
          <span className="font-mono text-[11px] text-muted-foreground">starts {START_LABELS[course.startLevel]}</span>
        )}
        {hasEvidence && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={panelId}
            className="ml-auto inline-flex items-center gap-1 rounded-sm font-mono text-[11px] text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
          >
            Evidence
            <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} aria-hidden="true" />
          </button>
        )}
      </div>

      {open && hasEvidence && (
        <div id={panelId} className="space-y-1.5 border-t bg-surface-sunken/40 px-4 py-3 text-sm text-muted-foreground">
          {gap && (
            <p>
              {gap.evidence.summary}
              {gap.evidence.asked > 0 && (
                <span className="ml-1 font-mono text-[11px]">
                  ({gap.evidence.missed} of {gap.evidence.asked} missed)
                </span>
              )}
            </p>
          )}
          {truncated && <p>{reason}</p>}
        </div>
      )}

      <div className="divide-y border-t">
        {course ? (
          <div className="px-4 py-3">
            <CourseLine item={course} busy={busy} onRetry={onRetry} />
          </div>
        ) : (
          <NoCourse path={path} busy={busy} building={building} onRebuild={onRebuild} />
        )}

        {refreshers.map((item) => (
          <div key={item.id} className="px-4 py-2.5 pl-8">
            <p className="font-mono text-[11px] text-muted-foreground">Learn first</p>
            <div className="mt-1">
              <CourseLine item={item} busy={busy} compact onRetry={onRetry} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** A priority with no course: always a reason, and an action whenever there is one to take. */
function NoCourse({
  path,
  busy,
  building,
  onRebuild,
}: {
  path: LearningPathView | null;
  busy: boolean;
  building: boolean;
  onRebuild: () => void;
}) {
  let message: string;
  let action: "build" | "retry" | "ai" | null = "build";
  if (busy) {
    message = "A course is being prepared in this build.";
    action = null;
  } else if (!path) {
    message = "Not built yet.";
  } else if (path.status === "failed" || path.status === "budget_reached") {
    message = path.status === "failed" ? "The last build failed before reaching this." : "The last build hit its budget first.";
    action = "retry";
  } else if (path.notice) {
    message = "Waiting for a research provider to write a course.";
    action = "ai";
  } else {
    message = "The last build attached no course.";
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <p className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
        <CircleAlert className="size-3.5 shrink-0 text-trailmark-strong" aria-hidden="true" />
        {message}
      </p>
      {action === "ai" ? (
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/ai">Set up AI connection</Link>
        </Button>
      ) : action ? (
        <Button size="sm" variant="outline" loading={building} onClick={onRebuild}>
          <RotateCw aria-hidden="true" />
          {action === "retry" ? "Retry" : path ? "Rebuild" : "Build path"}
        </Button>
      ) : null}
    </div>
  );
}

/** One course, its state, and its reason. Never more than a line and a half. */
function CourseLine({ item, busy, compact, onRetry }: { item: PathItemView; busy: boolean; compact?: boolean; onRetry?: (jobId: string) => void }) {
  const state = courseState(item, busy);
  const needs = needsLine(item);
  // v4.3: a goal's capstone: achieved once the learner passes it (or an admin marks it on Setup).
  if (item.goalId) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("font-medium", compact && "text-sm")}>{item.courseTitle}</span>
          <Badge variant={item.goalAchieved ? "success" : "outline"} className="text-[11px]">
            {item.goalAchieved ? "Goal achieved" : "Not passed yet"}
          </Badge>
        </div>
        {item.reason && <p className="mt-1 text-sm text-muted-foreground">{truncateWords(item.reason)}</p>}
      </>
    );
  }
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {item.moduleId && item.href ? (
          // A curriculum module opens where the learner reads it: there is no course editor for it.
          <Link
            to={item.href}
            className={cn("font-medium underline decoration-primary decoration-2 underline-offset-4", compact && "text-sm")}
          >
            {item.courseTitle}
          </Link>
        ) : item.courseId ? (
          <Link
            to={`/admin/courses/${item.courseId}`}
            className={cn("font-medium underline decoration-primary decoration-2 underline-offset-4", compact && "text-sm")}
          >
            {item.courseTitle}
          </Link>
        ) : (
          <span className={cn("font-medium", compact && "text-sm")}>{item.courseTitle}</span>
        )}
        {item.oyelabs && (
          <Badge variant="outline" className="text-[11px]">
            {OYELABS_BADGE}
          </Badge>
        )}
        <Badge variant={STATE_VARIANT[state]} className="text-[11px]">
          {COURSE_STATE_LABELS[state]}
        </Badge>
        {state === "needs_review" && (
          <Link
            to="/admin/generated"
            className="text-xs font-medium underline decoration-primary decoration-2 underline-offset-4"
          >
            Review
          </Link>
        )}
        {state === "not_made" && item.retryJobId && onRetry && (
          <Button size="sm" variant="outline" className="h-7" onClick={() => onRetry(item.retryJobId!)}>
            <RotateCw aria-hidden="true" />
            Retry
          </Button>
        )}
        <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular">
          {item.completedCount}/{item.topicCount} done
        </span>
      </div>
      {state === "not_made" && <p className="mt-1 text-sm text-destructive">{failedLine(item.problem)}</p>}
      {state === "waiting_setup" && item.problem && <p className="mt-1 text-sm text-muted-foreground">Blocked: {item.problem}.</p>}
      {needs && <p className="mt-1 font-mono text-[11px] text-muted-foreground">{needs}</p>}
      {item.reason && <p className="mt-1 text-sm text-muted-foreground">{truncateWords(item.reason)}</p>}
    </>
  );
}

/** The assessed level as a 0–5 bar. Five cells, because "3/5" is a shape before it is a number. */
function LevelBar({ level, bar }: { level: number; bar: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={cn("h-2.5 w-1.5 rounded-[1px]", n <= level ? bar : "bg-foreground/10")} />
        ))}
      </span>
      <span className="sr-only">Assessed {level} out of 5</span>
      <span className="font-mono text-[11px] text-muted-foreground tabular" aria-hidden="true">
        {level}/5
      </span>
    </span>
  );
}

/**
 * What the assessment found that nobody asked for. Collapsed, last, and optional. Promote does not
 * write anything: it opens Setup with the skill selected, where the admin decides its weight.
 */
function AlsoSuggested({ suggestions, onPromote }: { suggestions: readonly SkillGapView[]; onPromote: (skill: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-md border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-4 py-3 text-left hover:bg-surface-sunken/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong"
      >
        <span className="font-medium">Also suggested by the assessment</span>
        <span className="font-mono text-[11px] text-muted-foreground">{suggestions.length} optional</span>
        <ChevronDown className={cn("ml-auto size-4 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <ul className="divide-y border-t">
          {suggestions.map((gap) => (
            <li key={gap.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{gap.skill}</p>
                <p className="mt-1 text-sm text-muted-foreground">{truncateWords(gap.evidence.summary)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onPromote(gap.skill)}>
                <Plus aria-hidden="true" />
                Promote
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * v4.3: the path in the order the learner walks it, one line per step with the algorithm's reason.
 * The rows above group by priority; this is where a missing link or a boosted must-have shows up
 * in its place between them.
 */
export function PathInOrder({ path }: { path: LearningPathView | null }) {
  const [open, setOpen] = useState(false);
  const [laterOpen, setLaterOpen] = useState(false);
  const items = [...(path?.items ?? [])].sort((a, b) => (a.partNumber ?? 0) - (b.partNumber ?? 0) || a.position - b.position);
  if (items.length === 0) return null;
  const listId = "path-in-order";
  // v4.5: a long path shows its first steps; the rest fold under "Later (N more)", grouped by goal.
  const split = splitPath(items);
  return (
    <section className="rounded-md border" aria-label="The path in order">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={listId}
        className="flex w-full items-center gap-2 rounded-md px-4 py-3 text-left text-sm font-medium hover:bg-surface-sunken/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong"
      >
        <ChevronDown className={cn("size-4 transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden="true" />
        In the order they walk it ({items.length} step{items.length === 1 ? "" : "s"})
      </button>
      {open && (
        <>
        <ol id={listId} className="divide-y border-t">
          {split.first.map((item, index) => (
            <li key={item.id} className="flex gap-3 px-4 py-2.5">
              <span className="w-6 shrink-0 pt-0.5 text-right font-mono text-[11px] text-muted-foreground tabular">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{item.courseTitle}</span>
                  {item.oyelabs && (
                    <Badge variant="outline" className="text-[10px]">
                      {OYELABS_BADGE}
                    </Badge>
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Part {item.partNumber ?? 1}
                    {item.partType ? ` · ${PART_LABELS[item.partType]}` : ""}
                  </span>
                  {item.goalId && (
                    <Badge variant={item.goalAchieved ? "success" : "outline"} className="text-[10px]">
                      {item.goalAchieved ? "Goal achieved" : "Not passed yet"}
                    </Badge>
                  )}
                </p>
                {needsLine(item) && <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{needsLine(item)}</p>}
                {item.reason && <p className="mt-0.5 text-xs text-muted-foreground">{item.reason}</p>}
              </div>
            </li>
          ))}
        </ol>
        {split.laterCount > 0 && (
          <div className="border-t">
            <button
              type="button"
              onClick={() => setLaterOpen((v) => !v)}
              aria-expanded={laterOpen}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium hover:bg-surface-sunken/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong"
            >
              <ChevronDown className={cn("size-4 transition-transform motion-reduce:transition-none", laterOpen && "rotate-180")} aria-hidden="true" />
              {laterLabel(split.laterCount)}
            </button>
            {laterOpen &&
              split.later.map((group) => (
                <section key={group.goal ?? "other"} className="border-t px-4 py-2.5" aria-label={laterGroupLabel(group.goal)}>
                  <h4 className="font-mono text-[11px] text-muted-foreground">{laterGroupLabel(group.goal)}</h4>
                  <ul className="mt-1 space-y-1">
                    {group.items.map((item) => (
                      <li key={item.id} className="text-sm">
                        {item.courseTitle}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        )}
        </>
      )}
    </section>
  );
}
