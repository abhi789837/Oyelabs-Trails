import { useState } from "react";
import { ChevronDown, CircleAlert, Plus, RotateCw } from "lucide-react";
import { Link } from "react-router-dom";

import type { LearningPathView, PathItemView, SkillGapView } from "@shared/builder";
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
  reused: "success",
  generated: "success",
  generating: "progress",
  needs_review: "progress",
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
}

export function PathByPriority({ path, grouped, busy, building, onRebuild, onPromote, onOpenSetup }: PathByPriorityProps) {
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
              <PriorityRow group={group} path={path} busy={busy} building={building} onRebuild={onRebuild} />
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
                <CourseLine item={item} busy={busy} />
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
}: {
  group: PriorityGroup;
  path: LearningPathView | null;
  busy: boolean;
  building: boolean;
  onRebuild: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { priority, course, refreshers, gap } = group;
  const tone = PRIORITY_TONE[priority.slider];
  const level = assessedLevel(gap);
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
          <span className="font-mono text-[11px] text-muted-foreground">not assessed</span>
        )}
        {course?.startLevel && (
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
            <CourseLine item={course} busy={busy} />
          </div>
        ) : (
          <NoCourse path={path} busy={busy} building={building} onRebuild={onRebuild} />
        )}

        {refreshers.map((item) => (
          <div key={item.id} className="px-4 py-2.5 pl-8">
            <p className="font-mono text-[11px] text-muted-foreground">Must know first</p>
            <div className="mt-1">
              <CourseLine item={item} busy={busy} compact />
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
function CourseLine({ item, busy, compact }: { item: PathItemView; busy: boolean; compact?: boolean }) {
  const state = courseState(item, busy);
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {item.courseId ? (
          <Link
            to={`/admin/courses/${item.courseId}`}
            className={cn("font-medium underline decoration-trailmark decoration-2 underline-offset-4", compact && "text-sm")}
          >
            {item.courseTitle}
          </Link>
        ) : (
          <span className={cn("font-medium", compact && "text-sm")}>{item.courseTitle}</span>
        )}
        <Badge variant={STATE_VARIANT[state]} className="text-[11px]">
          {COURSE_STATE_LABELS[state]}
        </Badge>
        {state === "needs_review" && (
          <Link
            to="/admin/generated"
            className="text-xs font-medium underline decoration-trailmark decoration-2 underline-offset-4"
          >
            Review
          </Link>
        )}
        <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular">
          {item.completedCount}/{item.topicCount} done
        </span>
      </div>
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
