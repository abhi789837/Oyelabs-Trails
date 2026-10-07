import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";

import { isPathBusy, type LearningPathView, type SkillGapView } from "@shared/builder";
import type { IntentCoverageLine } from "@shared/intents";
import type { PathCoverage } from "@shared/pathView";
import type { LearnerSetup } from "@shared/setup";

import { PlainError } from "@/components/form/PlainError";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { builderApi } from "../builder/api";
import { setupApi } from "../setup/api";
import { PathByPriority, PathInOrder } from "./PathByPriority";
import { groupPath, pathCounts } from "./pathHelpers";
import { ViewAsLearner } from "./ViewAsLearner";

/** How often to re-read while a run is going. Generation is minutes, so this is not a hot loop. */
const POLL_MS = 5000;

function shortDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * The path, results only (v4 Phase 3). What the admin asked for now lives on the Setup tab; this
 * answers "did each thing I said matters get a course, and where does it start?"
 */
export function PathTab({
  userId,
  displayName,
  onPromote,
  onOpenSetup,
  refreshKey = 0,
}: {
  userId: string;
  displayName: string;
  /** Bumped by the page after a Setup save, so the priorities shown here are the saved ones. */
  refreshKey?: number;
  /** Opens Setup with this skill selected at Medium. */
  onPromote: (skill: string) => void;
  onOpenSetup: () => void;
}) {
  const [setup, setSetup] = useState<LearnerSetup | null>(null);
  const [gaps, setGaps] = useState<SkillGapView[]>([]);
  const [path, setPath] = useState<LearningPathView | null>(null);
  const [intents, setIntents] = useState<IntentCoverageLine[]>([]);
  const [coverage, setCoverage] = useState<PathCoverage | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loaded, setLoaded] = useState(false);
  const [building, setBuilding] = useState(false);
  const [viewing, setViewing] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [s, g] = await Promise.all([setupApi.get(userId, signal), builderApi.gaps(userId, signal)]);
        setSetup(s.setup);
        setGaps(g.gaps);
        setPath(g.path);
        setIntents(g.intents ?? []);
        setCoverage(g.coverage ?? null);
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err);
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
  }, [load, refreshKey]);

  /* Polls only while a run is actually going; a settled path never changes on its own. */
  const busy = path !== null && isPathBusy(path.status);
  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [busy, load]);

  const build = useCallback(async () => {
    setBuilding(true);
    try {
      await builderApi.buildPath(userId);
      notify.success("Building. It takes a few minutes and this page follows along.");
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBuilding(false);
    }
  }, [userId, load]);

  /* v4.5: courses still being made (or blocked) change on their own, so keep reading while any are. */
  const creating = path?.items.some((item) => item.creating === "working" || item.creating === "waiting_setup") ?? false;
  useEffect(() => {
    if (!creating || busy) return;
    const timer = setInterval(() => void load(), 15_000);
    return () => clearInterval(timer);
  }, [creating, busy, load]);

  const retry = useCallback(
    async (jobId: string) => {
      try {
        await builderApi.retryCourseJob(jobId);
        notify.success("Trying again now.");
        await load();
      } catch (err) {
        setError(err);
      }
    },
    [load],
  );

  const grouped = useMemo(
    () => groupPath(path, setup?.priorities ?? [], gaps, setup?.skip.map((s) => s.skillName) ?? []),
    [path, setup, gaps],
  );

  return (
    <section aria-labelledby="path-heading" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="path-heading" className="font-display text-lg font-semibold">
          Learning path
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setViewing(true)}>
            <Eye aria-hidden="true" />
            View as learner
          </Button>
          <Button size="sm" loading={building} disabled={busy || !loaded} onClick={() => void build()}>
            <Wand2 aria-hidden="true" />
            {path ? "Rebuild" : "Build path"}
          </Button>
        </div>
      </div>

      {error != null && <PlainError error={error} />}

      {loaded && (
        <>
          <StatusLine path={path} busy={busy} />
          <PathByPriority
            path={path}
            grouped={grouped}
            busy={busy}
            building={building}
            onRebuild={() => void build()}
            onPromote={onPromote}
            onOpenSetup={onOpenSetup}
            coverage={coverage}
            onRetry={(jobId) => void retry(jobId)}
          />
          <AskedFor lines={intents} />
          <PathInOrder path={path} />
        </>
      )}

      <ViewAsLearner userId={userId} displayName={displayName} open={viewing} onOpenChange={setViewing} />
    </section>
  );
}

/** Exactly one status line, and it never contradicts the rows under it. */
function StatusLine({ path, busy }: { path: LearningPathView | null; busy: boolean }) {
  if (!path) {
    return <p className="text-sm text-muted-foreground">Not built yet. It builds itself once their assessment is evaluated.</p>;
  }

  if (busy) {
    return (
      <p className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-4 py-2.5 text-sm">
        <Loader2 className="size-4 shrink-0 animate-spin text-primary-strong" aria-hidden="true" />
        {/* The server's own note, not a percentage: there is no honest denominator mid-run. */}
        <span aria-live="polite">Building: {path.progressNote || "working…"}</span>
      </p>
    );
  }

  if (path.status === "failed") {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm" role="status">
        Build failed{path.failureReason ? `: ${path.failureReason}` : "."}
      </p>
    );
  }

  if (path.status === "budget_reached") {
    return (
      <p className="rounded-md border border-trailmark/50 bg-trailmark/[0.06] px-4 py-2.5 text-sm" role="status">
        {path.failureReason ?? "The run stopped at its budget."} Raise the budget in AI connection, or lower the
        course cap in Setup.
      </p>
    );
  }

  const counts = pathCounts(path);
  const parts = [`${counts.courses} course${counts.courses === 1 ? "" : "s"}`];
  if (counts.generating > 0) parts.push(`${counts.generating} generating`);
  if (counts.needsReview > 0) parts.push(`${counts.needsReview} need${counts.needsReview === 1 ? "s" : ""} review`);

  return (
    <div className="space-y-2">
      <p className="text-sm">
        <span className="font-medium">Path built {shortDate(path.completedAt ?? path.createdAt)}</span>
        <span className="text-muted-foreground"> · {parts.join(" · ")}</span>
      </p>
      {path.addedLine && (
        <p className="rounded-md border border-summit/40 bg-summit/[0.06] px-4 py-2.5 text-sm" role="status" data-testid="path-added-line">
          {path.addedLine}
        </p>
      )}
      {path.notice && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-trailmark/50 bg-trailmark/[0.06] px-4 py-2.5 text-sm">
          <span className="min-w-0 flex-1">{path.notice}</span>
          {path.setupNeeded && (
            <Link to="/admin/ai" className="shrink-0 font-medium underline decoration-trailmark decoration-2 underline-offset-4">
              Check the connection
            </Link>
          )}
        </p>
      )}
    </div>
  );
}

/**
 * v4.4 P6: each thing the description asked for, and whether the path covers it. One that needs no
 * course says why ("Already strong: scored 5/5").
 */
function AskedFor({ lines }: { lines: readonly IntentCoverageLine[] }) {
  const shown = lines.filter((l) => l.type !== "constraint");
  if (shown.length === 0) return null;
  return (
    <div className="rounded-md border px-4 py-3 text-sm">
      <h3 className="font-medium">What you asked for</h3>
      <ul className="mt-1.5 space-y-1">
        {shown.map((line) => (
          <li key={line.intentId} className="flex flex-wrap gap-x-2">
            <span className="text-muted-foreground">&ldquo;{line.phrase}&rdquo;</span>
            <span aria-hidden="true">→</span>
            <span>{line.inPath ? "On the path" : (line.reason ?? "Not on the path yet")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
