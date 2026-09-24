import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, LoaderCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import type { AssessmentSummary, EvaluationResult } from "@shared/assessment";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatTimestamp } from "@/lib/utils";

interface EvaluationResponse {
  evaluation: { result: EvaluationResult & { serverWarnings?: string[]; terminated?: boolean }; model: string; createdAt: number } | null;
  assessment: AssessmentSummary;
}

/**
 * The admin's view of an evaluation (brief §13).
 *
 * Everything the model concluded and why, including the parts the learner never sees: where the
 * onboarding notes were wrong, the integrity assessment, and the evidence behind each area. The
 * integrity verdict is shown next to the skill levels but visibly separate from them — it never
 * moved a score, and the page should not suggest it did.
 */
export function AdminEvaluationView({ assessmentId, userId }: { assessmentId: string; userId: string }) {
  const [data, setData] = useState<EvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<EvaluationResponse>(`/api/admin/assessments/${assessmentId}/evaluation`)
      .then((result) => !cancelled && setData(result))
      .catch((err) => !cancelled && setError(err instanceof ApiRequestError ? err.message : "Could not load the evaluation."));
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  if (error) return <FormAlert>{error}</FormAlert>;

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading the evaluation…
      </div>
    );
  }

  if (!data.evaluation) {
    return (
      <p className="text-sm text-muted-foreground">
        No evaluation yet. One is produced automatically once the assessment is submitted or ends.
      </p>
    );
  }

  const { result, model, createdAt } = data.evaluation;
  const integrityTone =
    result.integrity.assessment === "clean"
      ? "border-summit/40 bg-summit/6"
      : result.integrity.assessment === "minor_concerns"
        ? "border-trailmark/50 bg-trailmark/[0.07]"
        : "border-destructive/50 bg-destructive/6";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="success">Overall level {result.overallLevel}/5</Badge>
        {result.terminated && (
          <Badge variant="outline" className="border-destructive/50 text-destructive">
            The assessment was terminated — review before relying on this
          </Badge>
        )}
        <span className="font-mono text-xs text-muted-foreground">
          {model} · {formatTimestamp(createdAt)}
        </span>
      </div>

      {result.serverWarnings && result.serverWarnings.length > 0 && (
        <div className="rounded-md border border-trailmark/50 bg-trailmark/6 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-trailmark-strong" aria-hidden="true" />
            The server changed the proposed plan
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {result.serverWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <section aria-labelledby="summary-heading">
        <h3 id="summary-heading" className="text-sm font-semibold">
          Summary
        </h3>
        <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm leading-relaxed">{result.summary}</p>
      </section>

      <section aria-labelledby="notes-heading">
        <h3 id="notes-heading" className="text-sm font-semibold">
          Your notes vs. the results
        </h3>
        <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {result.notesVsReality}
        </p>
      </section>

      <section aria-labelledby="areas-heading">
        <div className="flex items-center justify-between gap-4">
          <h3 id="areas-heading" className="text-sm font-semibold">
            By area
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowEvidence((v) => !v)}>
            <ChevronDown className={cn("transition-transform", showEvidence && "rotate-180")} aria-hidden="true" />
            {showEvidence ? "Hide evidence" : "Show evidence"}
          </Button>
        </div>

        <ul className="mt-3 space-y-3">
          {result.areas.map((area) => (
            <li key={area.area} className="rounded-md border px-4 py-3">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {area.area}
                <Badge variant="outline">{area.level}/5</Badge>
                <span
                  className={cn(
                    "font-mono text-xs",
                    area.confidence === "high"
                      ? "text-summit-strong"
                      : area.confidence === "low"
                        ? "text-destructive"
                        : "text-muted-foreground",
                  )}
                >
                  {area.confidence} confidence
                </span>
              </p>

              {area.strengths.length > 0 && (
                <p className="mt-2 text-sm">
                  <span className="font-medium text-summit-strong">Strengths: </span>
                  <span className="text-muted-foreground">{area.strengths.join("; ")}</span>
                </p>
              )}
              {area.gaps.length > 0 && (
                <p className="mt-1 text-sm">
                  <span className="font-medium text-trailmark-strong">Gaps: </span>
                  <span className="text-muted-foreground">{area.gaps.join("; ")}</span>
                </p>
              )}

              {showEvidence && area.evidence.length > 0 && (
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  Evidence: {area.evidence.join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="integrity-heading">
        <h3 id="integrity-heading" className="text-sm font-semibold">
          Integrity
        </h3>
        <div className={cn("mt-2 rounded-md border px-4 py-3", integrityTone)}>
          <p className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {result.integrity.assessment.replace("_", " ")}
          </p>
          <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">{result.integrity.explanation}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Reported separately and never used to lower a skill score. A flag is evidence for you to
            weigh, not a verdict — deciding on a re-test is your call.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="mt-2">
          <Link to={`/admin/assessments/${assessmentId}/integrity`}>See every event and snapshot</Link>
        </Button>
      </section>

      <section aria-labelledby="plan-reasoning-heading">
        <h3 id="plan-reasoning-heading" className="text-sm font-semibold">
          Why this plan
        </h3>
        <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {result.plan.rationale}
        </p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {result.plan.topicIds.length} topics proposed · about {Math.round(result.plan.estimatedHours)} hours
        </p>

        {result.plan.skipRationale.length > 0 && (
          <>
            <h4 className="mt-4 text-sm font-medium">Skipped, and why</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {result.plan.skipRationale.map((entry) => (
                <li key={entry.moduleId}>
                  <span className="font-mono text-xs">{entry.moduleId}</span> — {entry.reason}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="learner-copy-heading">
        <h3 id="learner-copy-heading" className="text-sm font-semibold">
          What the learner sees
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          This is the only part of the evaluation shown on their plan. It carries no integrity detail
          and does not quote your notes.
        </p>
        <p className="mt-2 max-w-prose whitespace-pre-wrap rounded-md border bg-surface-sunken/30 px-4 py-3 text-sm leading-relaxed">
          {result.learnerSummary}
        </p>
      </section>

      <p className="font-mono text-xs text-muted-foreground">
        Learner id {userId} · assessment {assessmentId}
      </p>
    </div>
  );
}
