import { useEffect, useState } from "react";
import { AlertTriangle, Check, LoaderCircle, X } from "lucide-react";
import { Link } from "react-router-dom";

import type { AiPurpose, Severity } from "@shared/enums";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn, formatTimestamp } from "@/lib/utils";

interface Overview {
  people: { learners: number; active: number; awaitingFirstSignIn: number; disabled: number };
  assessments: { inProgress: number; generating: number; awaitingEvaluation: number; completed: number; flagged: number };
  plans: { published: number; learnersWithoutPlan: number };
  ai: {
    configured: boolean;
    provider: string | null;
    label: string | null;
    status: string | null;
    lastError: string | null;
    usingMock: boolean;
    usage7d: { purpose: AiPurpose; calls: number; inputTokens: number; outputTokens: number; failures: number }[];
  };
  jobs: { queued: number; running: number; failed: number };
  recentEvents: {
    id: string;
    assessmentId: string;
    userId: string;
    displayName: string;
    type: string;
    severity: Severity;
    counted: boolean;
    snapshotPath: string | null;
    createdAt: number;
  }[];
}

/**
 * The admin landing screen (brief §13, first bullet).
 *
 * Built around what needs attention rather than what looks impressive: things that are stuck or
 * flagged come first, and a number that is zero is shown as zero rather than hidden, so "nothing
 * needs me" is a state you can read at a glance.
 */
export default function AdminOverviewPage() {
  useDocumentTitle("Overview");

  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await api.get<Overview>("/api/admin/overview");
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load the overview.");
      }
    };
    void load();
    const timer = setInterval(() => void load(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (error) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <FormAlert>{error}</FormAlert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading…
      </div>
    );
  }

  const needsAttention =
    data.assessments.flagged > 0 ||
    data.jobs.failed > 0 ||
    data.plans.learnersWithoutPlan > 0 ||
    !data.ai.configured ||
    data.ai.status === "failed";

  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {needsAttention ? "A few things need you." : "Nothing needs your attention right now."}
      </p>

      {/* What is wrong, first. */}
      {needsAttention && (
        <ul className="mt-6 space-y-2">
          {!data.ai.configured && (
            <Attention to="/admin/ai" label="No AI credential is set up, so assessments cannot be generated." />
          )}
          {data.ai.status === "failed" && (
            <Attention to="/admin/ai" label={`The active AI credential failed: ${data.ai.lastError ?? "unknown error"}`} />
          )}
          {data.jobs.failed > 0 && (
            <Attention to="/admin/audit" label={`${data.jobs.failed} background job${data.jobs.failed === 1 ? "" : "s"} failed.`} />
          )}
          {data.assessments.flagged > 0 && (
            <Attention
              to="/admin"
              label={`${data.assessments.flagged} assessment${data.assessments.flagged === 1 ? "" : "s"} ended early or carried warnings.`}
            />
          )}
          {data.plans.learnersWithoutPlan > 0 && (
            <Attention
              to="/admin"
              label={`${data.plans.learnersWithoutPlan} learner${data.plans.learnersWithoutPlan === 1 ? " has" : "s have"} no plan yet, so they see nothing.`}
            />
          )}
        </ul>
      )}

      {data.ai.usingMock && (
        <div className="mt-6 flex gap-3 rounded-md border border-trailmark/50 bg-trailmark/[0.07] px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-trailmark-strong" aria-hidden="true" />
          <p>
            A development mock is standing in for a real AI provider. Generated assessments and plans are structurally
            valid and semantically meaningless.
          </p>
        </div>
      )}

      <section aria-labelledby="counts-heading" className="mt-8">
        <h2 id="counts-heading" className="sr-only">
          Counts
        </h2>
        <dl className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Learners" value={data.people.learners} hint={`${data.people.active} active`} />
          <Stat label="Awaiting first sign-in" value={data.people.awaitingFirstSignIn} />
          <Stat label="Assessments in progress" value={data.assessments.inProgress} to="/admin/live" />
          <Stat label="Awaiting evaluation" value={data.assessments.awaitingEvaluation} />
          <Stat label="Being generated" value={data.assessments.generating} />
          <Stat label="Completed" value={data.assessments.completed} />
          <Stat label="Flagged" value={data.assessments.flagged} tone={data.assessments.flagged > 0 ? "warn" : undefined} />
          <Stat label="Plans published" value={data.plans.published} />
        </dl>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="events-heading">
          <div className="flex items-center justify-between gap-4">
            <h2 id="events-heading" className="text-lg font-semibold">
              Recent integrity events
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/live">Live view</Link>
            </Button>
          </div>

          {data.recentEvents.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nothing in the last seven days.</p>
          ) : (
            <ul className="mt-3 divide-y rounded-md border">
              {data.recentEvents.map((event) => (
                <li key={event.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  {event.snapshotPath && (
                    <img
                      src={`/api/admin/snapshots/${event.snapshotPath}`}
                      alt=""
                      className="h-8 w-10 shrink-0 rounded-sm border object-cover"
                      loading="lazy"
                    />
                  )}
                  <Link
                    to={`/admin/people/${event.userId}`}
                    className="shrink-0 underline decoration-trailmark decoration-2 underline-offset-4"
                  >
                    {event.displayName}
                  </Link>
                  <span className={cn("font-mono text-xs", event.severity === "hard" ? "text-destructive" : "text-muted-foreground")}>
                    {event.type}
                    {!event.counted && " (not counted)"}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                    {formatTimestamp(event.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="ai-heading">
          <div className="flex items-center justify-between gap-4">
            <h2 id="ai-heading" className="text-lg font-semibold">
              AI
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/ai">Settings</Link>
            </Button>
          </div>

          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {data.ai.configured ? (
              <>
                <Badge variant={data.ai.status === "verified" ? "success" : "outline"}>
                  {data.ai.status === "verified" ? (
                    <Check className="mr-1 h-3 w-3" aria-hidden="true" />
                  ) : data.ai.status === "failed" ? (
                    <X className="mr-1 h-3 w-3" aria-hidden="true" />
                  ) : null}
                  {data.ai.status ?? "unverified"}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  {data.ai.label} · {data.ai.provider}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Not configured.</span>
            )}
          </p>

          {data.ai.usage7d.length > 0 && (
            <table className="mt-4 w-full border-collapse text-sm">
              <caption className="pb-2 text-left text-xs text-muted-foreground">Last seven days</caption>
              <thead>
                <tr className="border-b text-left">
                  <th scope="col" className="py-1.5 text-xs font-semibold text-muted-foreground">Purpose</th>
                  <th scope="col" className="py-1.5 text-right text-xs font-semibold text-muted-foreground">Calls</th>
                  <th scope="col" className="py-1.5 text-right text-xs font-semibold text-muted-foreground">Tokens</th>
                  <th scope="col" className="py-1.5 text-right text-xs font-semibold text-muted-foreground">Failures</th>
                </tr>
              </thead>
              <tbody>
                {data.ai.usage7d.map((row) => (
                  <tr key={row.purpose} className="border-b last:border-0">
                    <td className="py-1.5">{row.purpose}</td>
                    <td className="py-1.5 text-right tabular">{row.calls}</td>
                    <td className="py-1.5 text-right tabular">{(row.inputTokens + row.outputTokens).toLocaleString()}</td>
                    <td className={cn("py-1.5 text-right tabular", row.failures > 0 && "text-destructive")}>{row.failures}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Jobs: {data.jobs.queued} queued · {data.jobs.running} running
            {data.jobs.failed > 0 && <span className="text-destructive"> · {data.jobs.failed} failed</span>}
          </p>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  to,
  tone,
}: {
  label: string;
  value: number;
  hint?: string;
  to?: string;
  tone?: "warn";
}) {
  const body = (
    <div className={cn("bg-background px-4 py-4", to && "transition-colors hover:bg-surface-sunken/50")}>
      <dd className={cn("font-display text-2xl font-semibold tabular", tone === "warn" && value > 0 && "text-destructive")}>
        {value}
      </dd>
      <dt className="mt-1 text-sm text-muted-foreground">{label}</dt>
      {hint && <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function Attention({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-start gap-3 rounded-md border border-trailmark/50 bg-trailmark/[0.06] px-4 py-3 text-sm transition-colors hover:bg-trailmark/[0.1]"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-trailmark-strong" aria-hidden="true" />
        {label}
      </Link>
    </li>
  );
}
