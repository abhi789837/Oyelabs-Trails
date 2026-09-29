import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";

import {
  EMPTY_PRIORITIES,
  isPathBusy,
  type LearnerPriorities,
  type LearningPathView,
  type SkillGapView,
} from "@shared/builder";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { fadeUp, stagger, transition } from "@/lib/motion";
import { notify } from "@/lib/toast";
import { cn, formatTimestamp } from "@/lib/utils";
import { adminWeekApi } from "@/features/plan/api";
import { builderApi } from "../builder/api";
import { PrioritiesFields } from "../builder/PrioritiesFields";

/** How often to re-read while a run is going. Generation is minutes, so this is not a hot loop. */
const POLL_MS = 5000;

/**
 * One learner's gap map and the path built from it.
 *
 * Three things on one tab because they are one story: what the admin asked for, what the assessment
 * found, and what the builder did about it. Splitting them would mean checking whether a course
 * appeared because of a priority or because of a result — which is the only question anybody asks
 * here.
 */
export function PathTab({ userId, displayName }: { userId: string; displayName: string }) {
  useDocumentTitle(`${displayName} · path`);

  const [priorities, setPriorities] = useState<LearnerPriorities>(EMPTY_PRIORITIES);
  const [weekStale, setWeekStale] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [gaps, setGaps] = useState<SkillGapView[]>([]);
  const [path, setPath] = useState<LearningPathView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [p, g] = await Promise.all([builderApi.getPriorities(userId, signal), builderApi.gaps(userId, signal)]);
        setPriorities(p.priorities);
        setGaps(g.gaps);
        setPath(g.path);
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load the path.");
      } finally {
        setLoaded(true);
      }
    },
    [userId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  /* Polls only while a run is actually going. A finished path never changes on its own, and a timer
     that keeps firing against a settled page is a request every five seconds forever. */
  const busy = path !== null && isPathBusy(path.status);
  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [busy, load]);

  const save = async () => {
    setSaving(true);
    try {
      const result = await builderApi.setPriorities(userId, {
        ...priorities,
        mustHave: priorities.mustHave.filter((entry) => entry.skill.trim().length > 0),
      });
      notify.success("Priorities saved.");
      setWeekStale(result.weekNeedsRegeneration);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not save those priorities.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Rebuilds their current week against the priorities just saved.
   *
   * In place, keeping the week's number and dates — an admin adjusting a weight on a Wednesday has not
   * started a new week for them. Rules-only, because the lanes are what changed; the prose does not
   * need re-writing and a model call would make a button press take fifteen seconds.
   */
  const rebuildWeek = async () => {
    setRebuilding(true);
    try {
      await adminWeekApi.regenerate(userId, { rulesOnly: true });
      notify.success("Their week has been rebuilt against the new priorities.");
      setWeekStale(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not rebuild their week.");
    } finally {
      setRebuilding(false);
    }
  };

  const build = async () => {
    setBuilding(true);
    try {
      await builderApi.buildPath(userId);
      notify.success("Building. It takes a few minutes — this page follows along.");
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not start a build.");
    } finally {
      setBuilding(false);
    }
  };

  return (
    <section aria-label="Learning path" className="space-y-10">
      <div className="border-b pb-4">
        <h2 className="font-display text-lg font-semibold">Learning path</h2>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          What you want them to learn, what their assessment showed they are missing, and what the
          builder did about it.
        </p>
      </div>

      {error && <FormAlert>{error}</FormAlert>}

      <div>
        <h3 className="text-sm font-semibold">Priorities</h3>
        <div className="mt-4 max-w-2xl">
          <PrioritiesFields value={priorities} onChange={setPriorities} disabled={saving} />
          {weekStale && (
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-warning/40 bg-warning/[0.07] px-4 py-3">
              <p className="min-w-0 flex-1 text-sm">
                Their current week was built from the old priorities.
              </p>
              <Button size="sm" loading={rebuilding} onClick={() => void rebuildWeek()}>
                Rebuild their week
              </Button>
              <Button size="sm" variant="ghost" disabled={rebuilding} onClick={() => setWeekStale(false)}>
                Leave it
              </Button>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="outline" loading={saving} onClick={() => void save()}>
              Save priorities
            </Button>
            <Button loading={building} disabled={busy} onClick={() => void build()}>
              <Wand2 aria-hidden="true" />
              {path ? "Rebuild the path" : "Build the path"}
            </Button>
          </div>
        </div>
      </div>

      {loaded && <PathPanel path={path} busy={busy} />}
      {loaded && gaps.length > 0 && <GapMap gaps={gaps} />}
    </section>
  );
}

function PathPanel({ path, busy }: { path: LearningPathView | null; busy: boolean }) {
  if (!path) {
    return (
      <div>
        <h3 className="text-sm font-semibold">The path</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing built yet. It runs by itself once their assessment is evaluated, or you can start
          it now.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">The path</h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          {path.completedAt ? `built ${formatTimestamp(path.completedAt)}` : `started ${formatTimestamp(path.createdAt)}`}
        </span>
      </div>

      {busy && (
        <p className="mt-3 flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
          <Loader2 className="size-4 shrink-0 animate-spin text-primary-strong" aria-hidden="true" />
          {/* The server's own note, not a percentage: there is no honest denominator until the plan
              is written, and a fake bar would be the only lie on the page. */}
          <span aria-live="polite">{path.progressNote || "Working…"}</span>
        </p>
      )}

      {path.status === "failed" && path.failureReason && (
        <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
          {path.failureReason}
        </p>
      )}

      {path.status === "budget_reached" && (
        <p className="mt-3 rounded-md border border-trailmark/50 bg-trailmark/[0.06] px-4 py-3 text-sm">
          {path.failureReason ?? "The run stopped at its budget."} Raise the budget under Admin → AI
          connection, or lower the course cap above.
        </p>
      )}

      {path.items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {busy ? "Nothing on it yet." : "Nothing was added — no gap needed a course."}
        </p>
      ) : (
        <motion.ol variants={stagger(0.04)} initial="hidden" animate="visible" className="mt-4 space-y-3">
          {path.items.map((item) => (
            <motion.li
              key={item.id}
              variants={fadeUp}
              transition={transition.base}
              className="rounded-md border px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground tabular">{item.position + 1}</span>
                {item.courseId ? (
                  <Link
                    to={`/admin/courses/${item.courseId}`}
                    className="font-medium underline decoration-trailmark decoration-2 underline-offset-4"
                  >
                    {item.courseTitle}
                  </Link>
                ) : (
                  <span className="font-medium">{item.courseTitle}</span>
                )}
                <SourceBadge source={item.source} />
                {!item.available && <Badge variant="outline">not published yet</Badge>}
                <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular">
                  {item.completedCount}/{item.topicCount}
                </span>
              </div>
              <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">{item.reason}</p>
            </motion.li>
          ))}
        </motion.ol>
      )}
    </div>
  );
}

/** Where a course came from. Worth showing: it is the difference between free and expensive. */
function SourceBadge({ source }: { source: "unlock" | "reuse" | "generated" }) {
  if (source === "generated") {
    return (
      <Badge variant="brand" className="gap-1">
        <Sparkles className="size-3" aria-hidden="true" />
        written for them
      </Badge>
    );
  }
  return <Badge variant="outline">{source === "reuse" ? "reused" : "from the catalogue"}</Badge>;
}

/**
 * The gap map.
 *
 * A bar per skill rather than a chart library — one number between 0 and 1 per row is a bar, and a
 * charting dependency to draw it would bring its own palette into a page built from tokens.
 */
function GapMap({ gaps }: { gaps: SkillGapView[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">Skill gaps</h3>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Ordered the way the builder ordered them: what the admin listed first, then what the
        assessment found, each weighted by how much the role needs it.
      </p>

      <ul className="mt-4 space-y-3">
        {gaps.map((gap) => (
          <li key={gap.id} className={cn("rounded-md border px-4 py-3", gap.skipped && "border-dashed opacity-70")}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{gap.skill}</span>
              <Badge variant={gap.source === "ai_detected" ? "outline" : "brand"}>
                {gap.source === "both" ? "you and the test agreed" : gap.source === "admin_priority" ? "your priority" : "found by the test"}
              </Badge>
              {/* Recorded, deliberately not taught — different from never having looked. */}
              {gap.skipped && <Badge variant="outline">skipped on purpose</Badge>}
              <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular">
                score {gap.priorityScore.toFixed(2)}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <Progress
                value={Math.round(gap.severity * 100)}
                className="h-1.5 max-w-xs"
                indicatorClassName={gap.severity >= 0.66 ? "bg-destructive" : gap.severity >= 0.33 ? "bg-trailmark" : "bg-summit"}
                aria-label={`${gap.skill} severity`}
              />
              <span className="font-mono text-[11px] text-muted-foreground tabular">
                {Math.round(gap.severity * 100)}% missing
              </span>
            </div>

            <p className="mt-2 max-w-prose text-sm text-muted-foreground">{gap.evidence.summary}</p>
            {gap.evidence.asked > 0 && (
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {gap.evidence.missed} of {gap.evidence.asked} items missed
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
