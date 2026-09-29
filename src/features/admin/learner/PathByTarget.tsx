import { useState } from "react";
import { ChevronDown, CircleAlert, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import type { LearningPathView, PathItemView, SkillGapView } from "@shared/builder";
import { PRIORITY_LABELS, type LearnerTarget, type TargetPriority } from "@shared/targets";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The path, as the admin's target list.
 *
 * The old tab was a flat list of gaps with a paragraph each, which answered "what did the model
 * notice" — a question the admin had not asked. This answers theirs: *did the things I said matter
 * get a course, and where does each one start?*
 *
 * So the spine on screen is the spine in the data. One row per target, in the admin's order, with
 * the course under it and the refreshers that target depends on under that. Everything the model
 * found on its own is one collapsed section at the bottom, marked optional.
 *
 * Reasons are capped at 20 words by the builder. The full evidence lives behind an expander,
 * because "which questions did they miss" is a real question and a rare one, and putting its answer
 * inline is what pushed the next target off the screen.
 */

const PRIORITY_STYLES: Record<TargetPriority, { chip: string; dot: string }> = {
  high: { chip: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  medium: { chip: "bg-warning/10 text-warning-strong", dot: "bg-warning" },
  low: { chip: "bg-basalt/10 text-basalt-strong", dot: "bg-basalt" },
};

const START_LABELS = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } as const;

export interface PathByTargetProps {
  path: LearningPathView;
  targets: readonly LearnerTarget[];
  gaps: readonly SkillGapView[];
  /** Turns one of the model's suggestions into a target. */
  onPromote: (skill: string) => void | Promise<void>;
  promoting: string | null;
}

export function PathByTarget({ path, targets, gaps, onPromote, promoting }: PathByTargetProps) {
  /* Grouped by the target each item was built for. Items with no target — an older path, or the
     two fixed foundation parts for a learner with no targets at all — fall into `orphans` and are
     shown as a plain list, which is what they were. */
  const byTarget = new Map<string, PathItemView[]>();
  const orphans: PathItemView[] = [];

  for (const item of [...path.items].sort((a, b) => a.position - b.position)) {
    if (!item.targetSkill) {
      orphans.push(item);
      continue;
    }
    const list = byTarget.get(item.targetSkill) ?? [];
    list.push(item);
    byTarget.set(item.targetSkill, list);
  }

  /** Gaps the model found that were not attached to any target. */
  const suggestions = gaps.filter(
    (gap) => !gap.skipped && !targets.some((target) => matches(gap.skill, target.skill)),
  );

  return (
    <div className="space-y-3">
      {targets.map((target) => (
        <TargetRow
          key={`${target.priority}-${target.skill}`}
          target={target}
          items={byTarget.get(target.skill) ?? []}
          gap={gaps.find((entry) => matches(entry.skill, target.skill)) ?? null}
          waiting={Boolean(path.notice) && (byTarget.get(target.skill) ?? []).length === 0}
        />
      ))}

      {orphans.length > 0 && (
        <ul className="space-y-2">
          {orphans.map((item) => (
            <li key={item.id} className="rounded-md border px-4 py-3">
              <CourseLine item={item} />
            </li>
          ))}
        </ul>
      )}

      {suggestions.length > 0 && (
        <AlsoSuggested suggestions={suggestions} onPromote={onPromote} promoting={promoting} />
      )}
    </div>
  );
}

function TargetRow({
  target,
  items,
  gap,
  waiting,
}: {
  target: LearnerTarget;
  items: PathItemView[];
  gap: SkillGapView | null;
  waiting: boolean;
}) {
  const [showEvidence, setShowEvidence] = useState(false);
  const style = PRIORITY_STYLES[target.priority];

  /* The course *for* this target, and the refreshers it depends on. The first item is the target's
     own course because that is the order the builder writes them in. */
  const [course, ...prerequisites] = items;
  /* Only a gap with questions behind it is a measurement. A target the assessment never covered is
     stored at severity 0.5, and turning that into "3/5" would put a number on screen that nobody
     measured. "Not assessed" is shorter and true. */
  const assessed = gap && gap.evidence.asked > 0 ? Math.max(0, Math.round((1 - gap.severity) * 5)) : null;
  const startLevel = course?.startLevel ?? null;

  return (
    <section className="rounded-md border">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-3">
        <span className={cn("rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase", style.chip)}>
          {PRIORITY_LABELS[target.priority]}
        </span>
        <h4 className="min-w-0 font-medium">{target.skill}</h4>

        {assessed !== null ? (
          <LevelBar level={assessed} dot={style.dot} />
        ) : (
          <span className="font-mono text-[11px] text-muted-foreground">not assessed</span>
        )}

        {startLevel && (
          <span className="font-mono text-[11px] text-muted-foreground">starts {START_LABELS[startLevel]}</span>
        )}

        {gap && (
          <button
            type="button"
            onClick={() => setShowEvidence((value) => !value)}
            aria-expanded={showEvidence}
            className="ml-auto inline-flex items-center gap-1 rounded-sm font-mono text-[11px] text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trailmark"
          >
            Evidence
            <ChevronDown className={cn("h-3 w-3 transition-transform", showEvidence && "rotate-180")} aria-hidden="true" />
          </button>
        )}
      </div>

      {showEvidence && gap && (
        <p className="border-b bg-surface-sunken/40 px-4 py-3 text-sm text-muted-foreground">
          {gap.evidence.summary}
          {gap.evidence.asked > 0 && (
            <span className="ml-1 font-mono text-[11px]">
              ({gap.evidence.missed} of {gap.evidence.asked} missed)
            </span>
          )}
        </p>
      )}

      <div className="divide-y">
        {course ? (
          <div className="px-4 py-3">
            <CourseLine item={course} />
          </div>
        ) : (
          <p className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
            <CircleAlert className="h-3.5 w-3.5 shrink-0 text-trailmark-strong" aria-hidden="true" />
            {waiting ? "Waiting for a research provider." : "No course yet. Rebuild the path."}
          </p>
        )}

        {prerequisites.map((item) => (
          <div key={item.id} className="px-4 py-2.5 pl-8">
            <p className="font-mono text-[11px] text-muted-foreground">Must know first</p>
            <div className="mt-1">
              <CourseLine item={item} compact />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** One course, its status, and its reason. Never more than a line and a half. */
function CourseLine({ item, compact }: { item: PathItemView; compact?: boolean }) {
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

        <Badge variant="outline" className="font-mono text-[10px]">
          {item.source}
        </Badge>
        {!item.available && <Badge variant="outline">not published yet</Badge>}

        <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular">
          {item.completedCount}/{item.topicCount}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
    </>
  );
}

/** The assessed level as a 0–5 bar. Five cells, because "3/5" is a shape before it is a number. */
function LevelBar({ level, dot }: { level: number; dot: string }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={`Assessed ${level}/5`}>
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={cn("h-2.5 w-1.5 rounded-[1px]", n <= level ? dot : "bg-foreground/10")} />
        ))}
      </span>
      <span className="sr-only">Assessed {level} out of 5</span>
      <span className="font-mono text-[11px] text-muted-foreground tabular">{level}/5</span>
    </span>
  );
}

/**
 * What the model found that nobody asked for.
 *
 * Collapsed, last, and explicitly optional — these are real findings and they are not decisions.
 * The one action is Promote, which turns a suggestion into a target and therefore into something
 * the spine will build a course for on the next rebuild.
 */
function AlsoSuggested({
  suggestions,
  onPromote,
  promoting,
}: {
  suggestions: readonly SkillGapView[];
  onPromote: (skill: string) => void | Promise<void>;
  promoting: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-md border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-surface-sunken/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-trailmark"
      >
        <span className="font-medium">Also suggested by the assessment</span>
        <span className="font-mono text-[11px] text-muted-foreground">{suggestions.length} · optional</span>
        <ChevronDown className={cn("ml-auto h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <ul className="divide-y border-t">
          {suggestions.map((gap) => (
            <li key={gap.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{gap.skill}</p>
                <p className="mt-1 text-sm text-muted-foreground">{gap.evidence.summary}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                loading={promoting === gap.skill}
                disabled={promoting !== null}
                onClick={() => void onPromote(gap.skill)}
              >
                <Plus aria-hidden="true" />
                Promote to target
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Same loose match the builder uses, so the tab groups exactly the way the path was built. */
function matches(a: string, b: string): boolean {
  const left = a.trim().toLowerCase().replace(/\s+/g, " ");
  const right = b.trim().toLowerCase().replace(/\s+/g, " ");
  if (left === right) return true;
  const shorter = left.length <= right.length ? left : right;
  if (shorter.length < 3) return false;
  return left.includes(right) || right.includes(left);
}
