import { useId } from "react";
import { Sparkles, Target } from "lucide-react";

import type { MyEvaluation } from "@shared/assessment";
import { BUCKET_LABELS } from "@shared/setup";

import { cn } from "@/lib/utils";

type Report = NonNullable<MyEvaluation["v4"]>;

const PRIORITY: Record<"high" | "medium" | "low", { label: string; className: string }> = {
  high: { label: `${BUCKET_LABELS.high} priority`, className: "border-primary/50 bg-primary/10 text-primary-strong" },
  medium: { label: `${BUCKET_LABELS.medium} priority`, className: "border-trailmark/50 bg-trailmark/10 text-trailmark-strong" },
  low: { label: `${BUCKET_LABELS.low} priority`, className: "border-border text-muted-foreground" },
};

const LEVEL_WORDS = ["Just starting", "Beginner", "Getting there", "Solid", "Strong", "Expert"];

/**
 * The learner's v4 result: one row per skill with its priority, a 0–5 level bar, what they are
 * already strong in, and what the path starts with. Deliberately no overall percentage — a single
 * number turns a map of where to start into a grade.
 */
export function SkillReport({
  report,
  className,
  title = "Where you are, skill by skill",
  subtitle = "Levels run from 0 to 5. This is a starting point for your path, not a grade.",
}: {
  report: Report;
  className?: string;
  /** The admin view reuses this about someone else, so the copy can be overridden. */
  title?: string;
  subtitle?: string;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={cn("rounded-lg border bg-surface", className)}>
      <div className="border-b px-4 py-3 sm:px-5">
        <h2 id={headingId} className="font-display text-base font-semibold">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <ul className="divide-y">
        {report.skills.map((skill) => {
          const level = skill.level;
          return (
            <li key={skill.skillName} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-center sm:gap-4 sm:px-5">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-medium">{skill.skillName}</span>
                {skill.priority && (
                  <span className={cn("rounded-sm border px-1.5 py-0.5 font-mono text-[11px]", PRIORITY[skill.priority].className)}>
                    {PRIORITY[skill.priority].label}
                  </span>
                )}
                <span className="font-mono text-xs text-muted-foreground">
                  {skill.asked} {skill.asked === 1 ? "question" : "questions"}
                </span>
              </div>
              {level === null ? (
                <p className="font-mono text-xs text-muted-foreground">Not assessed yet</p>
              ) : (
                <div className="flex items-center gap-3">
                  <div
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={5}
                    aria-valuenow={level}
                    aria-valuetext={`Level ${level} of 5, ${LEVEL_WORDS[level] ?? ""}`}
                    aria-label={`${skill.skillName} level`}
                    className="grid flex-1 grid-cols-5 gap-1"
                  >
                    {[1, 2, 3, 4, 5].map((step) => (
                      <span key={step} className={cn("h-2 rounded-[2px]", step <= level ? "bg-summit" : "bg-surface-sunken ring-1 ring-inset ring-border")} />
                    ))}
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-xs tabular">{level}/5</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="grid gap-4 border-t px-4 py-4 sm:grid-cols-2 sm:px-5">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-summit-strong" aria-hidden="true" />
            Strengths
          </h3>
          {report.strengths.length ? (
            <ul className="mt-1.5 space-y-0.5 text-sm">
              {report.strengths.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-sm text-muted-foreground">Nothing at level 4 or above yet. That is what the path is for.</p>
          )}
        </div>
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Target className="h-4 w-4 text-primary" aria-hidden="true" />
            What we'll focus on first
          </h3>
          {report.focusFirst.length ? (
            <ol className="mt-1.5 list-inside list-decimal space-y-0.5 text-sm">
              {report.focusFirst.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ol>
          ) : (
            <p className="mt-1.5 text-sm text-muted-foreground">Your path builds on what you already know.</p>
          )}
        </div>
      </div>
    </section>
  );
}
