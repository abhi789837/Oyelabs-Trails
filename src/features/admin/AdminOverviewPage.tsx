import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, ArrowRight, LoaderCircle, Radio } from "lucide-react";
import { Link } from "react-router-dom";

import { AUTO_APPROVE_AFTER_MS } from "@shared/assessment";
import type { AiPurpose, CredentialStatus, Severity } from "@shared/enums";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { relativeTime } from "@/components/layout/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { fadeUp, stagger, transition } from "@/lib/motion";
import { cn, formatTimestamp } from "@/lib/utils";
import { AnimatedNumber } from "@/pages/parts/Stats";
import { MiniBar, Sparkline } from "./parts/Sparkline";

interface Overview {
  people: { learners: number; active: number; awaitingFirstSignIn: number; disabled: number };
  assessments: {
    inProgress: number;
    generating: number;
    awaitingApproval: number;
    awaitingEvaluation: number;
    completed: number;
    flagged: number;
  };
  plans: { published: number; learnersWithoutPlan: number };
  ai: {
    configured: boolean;
    provider: string | null;
    label: string | null;
    status: CredentialStatus | null;
    lastError: string | null;
    usingMock: boolean;
    usage7d: { purpose: AiPurpose; calls: number; inputTokens: number; outputTokens: number; failures: number }[];
  };
  jobs: { queued: number; running: number; failed: number };
  /** Seven daily buckets, oldest first, each counted from a real timestamp column. */
  trend7d: {
    days: number[];
    onboarded: number[];
    submitted: number[];
    events: number[];
    aiCalls: number[];
    aiFailures: number[];
  };
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
 *
 * The layout is a bento grid — tiles of deliberately different weights — rather than a row of
 * identical cards, because the numbers here are not of equal importance and a uniform grid says
 * they are. "Awaiting your approval" is the only figure on the page with a deadline attached, and
 * it gets the space to say so.
 *
 * Every sparkline is bucketed server-side from real rows (`trend7d`). There is no smoothing and no
 * synthetic series; a quiet week draws a flat line, which is the honest picture of a quiet week.
 */
const autoApproveMinutes = Math.round(AUTO_APPROVE_AFTER_MS / 60_000);

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
    data.assessments.awaitingApproval > 0 ||
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
          {/* First, because it is the only line here with a deadline attached to it. */}
          {data.assessments.awaitingApproval > 0 && (
            <Attention
              to="/admin/people"
              label={`${data.assessments.awaitingApproval} generated assessment${
                data.assessments.awaitingApproval === 1 ? " is" : "s are"
              } waiting for your approval. Unapproved, ${
                data.assessments.awaitingApproval === 1 ? "it goes" : "they go"
              } out on ${data.assessments.awaitingApproval === 1 ? "its" : "their"} own after ${autoApproveMinutes} minutes.`}
            />
          )}
          {data.jobs.failed > 0 && (
            <Attention to="/admin/audit" label={`${data.jobs.failed} background job${data.jobs.failed === 1 ? "" : "s"} failed.`} />
          )}
          {data.assessments.flagged > 0 && (
            <Attention
              to="/admin/people"
              label={`${data.assessments.flagged} assessment${data.assessments.flagged === 1 ? "" : "s"} ended early or carried warnings.`}
            />
          )}
          {data.plans.learnersWithoutPlan > 0 && (
            <Attention
              to="/admin/people"
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

      {/* One entrance for the whole grid, staggered by tile — not a fade per element. */}
      <motion.div
        variants={stagger(0.04)}
        initial="hidden"
        animate="visible"
        className="mt-8 grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Tile span="lg:col-span-2" to="/admin/people" ariaLabel="Learners">
          <TileHead label="Learners" hint={`${data.people.active} active · ${data.people.disabled} disabled`} />
          <div className="mt-2 flex items-end justify-between gap-4">
            <BigNumber value={data.people.learners} />
            <div className="w-32 text-primary sm:w-40">
              <Sparkline values={data.trend7d.onboarded} noun="onboarded" label="Learners onboarded" />
            </div>
          </div>
          {data.people.awaitingFirstSignIn > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {data.people.awaitingFirstSignIn} {data.people.awaitingFirstSignIn === 1 ? "has" : "have"} not signed in yet.
            </p>
          )}
        </Tile>

        <Tile
          span="lg:col-span-2"
          to="/admin/people"
          tone={data.assessments.awaitingApproval > 0 ? "warn" : undefined}
          ariaLabel="Assessments awaiting your approval"
        >
          <TileHead
            label="Awaiting your approval"
            hint={
              data.assessments.generating > 0
                ? `${data.assessments.generating} still generating`
                : `released on their own after ${autoApproveMinutes} min`
            }
          />
          <div className="mt-2 flex items-end justify-between gap-4">
            <BigNumber value={data.assessments.awaitingApproval} tone={data.assessments.awaitingApproval > 0 ? "warn" : undefined} />
            <div className="w-32 text-summit sm:w-40">
              <Sparkline values={data.trend7d.submitted} noun="submitted" label="Assessments submitted" />
            </div>
          </div>
        </Tile>

        <Tile to="/admin/live" ariaLabel="Assessments in progress">
          <TileHead label="In progress" />
          <div className="mt-2 flex items-center gap-2">
            <BigNumber value={data.assessments.inProgress} />
            {data.assessments.inProgress > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-summit-strong">
                <Radio className="h-3 w-3 animate-status-pulse" aria-hidden="true" />
                live
              </span>
            )}
          </div>
        </Tile>

        <Tile ariaLabel="Assessments awaiting evaluation">
          <TileHead label="Awaiting evaluation" />
          <BigNumber className="mt-2" value={data.assessments.awaitingEvaluation} />
        </Tile>

        <Tile ariaLabel="Completed assessments">
          <TileHead label="Completed" />
          <BigNumber className="mt-2" value={data.assessments.completed} />
        </Tile>

        <Tile to="/admin/people" tone={data.assessments.flagged > 0 ? "warn" : undefined} ariaLabel="Flagged assessments">
          <TileHead label="Flagged" />
          <BigNumber className="mt-2" value={data.assessments.flagged} tone={data.assessments.flagged > 0 ? "warn" : undefined} />
        </Tile>

        {/* The plan funnel, as one tile rather than two competing numbers. */}
        <Tile span="sm:col-span-2 lg:col-span-2" ariaLabel="Learning plans">
          <TileHead label="Plans published" hint={`of ${data.people.learners} learner${data.people.learners === 1 ? "" : "s"}`} />
          <div className="mt-2 flex items-end gap-4">
            <BigNumber value={data.plans.published} />
            {data.plans.learnersWithoutPlan > 0 && (
              <Badge variant="progress" className="mb-1.5">
                {data.plans.learnersWithoutPlan} without a plan
              </Badge>
            )}
          </div>
          <MiniBar
            className="mt-3"
            tone="summit"
            value={data.plans.published}
            max={Math.max(data.people.learners, data.plans.published)}
          />
        </Tile>

        <Tile span="sm:col-span-2 lg:col-span-2" to="/admin/ai" ariaLabel="AI provider">
          <TileHead
            label="AI"
            hint={
              data.ai.configured
                ? `${data.ai.label ?? "credential"} · ${data.ai.provider ?? ""}`.trim()
                : "no credential configured"
            }
          />
          <div className="mt-2 flex items-end justify-between gap-4">
            <div className="flex items-center gap-2">
              {data.ai.configured ? (
                <StatusBadge kind="credential" status={data.ai.status ?? "unverified"} />
              ) : (
                <Badge variant="outline">Not configured</Badge>
              )}
              <span className="tabular text-sm text-muted-foreground">
                <AnimatedNumber value={data.trend7d.aiCalls.reduce((a, b) => a + b, 0)} /> calls / 7d
              </span>
            </div>
            <div
              className={cn(
                "w-32 sm:w-40",
                data.trend7d.aiFailures.some((n) => n > 0) ? "text-destructive" : "text-primary",
              )}
            >
              <Sparkline values={data.trend7d.aiCalls} noun="calls" label="AI calls" />
            </div>
          </div>
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Jobs: {data.jobs.queued} queued · {data.jobs.running} running
            {data.jobs.failed > 0 && <span className="text-destructive"> · {data.jobs.failed} failed</span>}
          </p>
        </Tile>
      </motion.div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <IntegritySection data={data} />
        <UsageSection data={data} />
      </div>
    </div>
  );
}

function IntegritySection({ data }: { data: Overview }) {
  const total = data.trend7d.events.reduce((a, b) => a + b, 0);
  return (
    <section aria-labelledby="events-heading">
      <div className="flex items-center justify-between gap-4">
        <h2 id="events-heading" className="font-display text-lg font-semibold">
          Recent integrity events
        </h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/integrity">All events</Link>
        </Button>
      </div>

      {total > 0 && (
        <div className="mt-3 w-full text-trailmark">
          <Sparkline values={data.trend7d.events} noun="events" label="Integrity events" height={24} />
        </div>
      )}

      {data.recentEvents.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing in the last seven days.</p>
      ) : (
        <motion.ul variants={stagger(0.03)} initial="hidden" animate="visible" className="mt-3 divide-y rounded-md border">
          {data.recentEvents.map((event) => (
            <motion.li
              key={event.id}
              variants={fadeUp}
              transition={transition.fast}
              className="flex items-center gap-3 px-3 py-2 text-sm"
            >
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
              <StatusBadge kind="severity" status={event.severity} />
              <span className="truncate font-mono text-xs text-muted-foreground">
                {event.type}
                {!event.counted && " (not counted)"}
              </span>
              <span
                className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground"
                title={formatTimestamp(event.createdAt)}
              >
                {relativeTime(event.createdAt)}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </section>
  );
}

function UsageSection({ data }: { data: Overview }) {
  const rows = data.ai.usage7d;
  // One shared scale across the rows, or the bars would compare each row against itself.
  const maxCalls = useMemo(() => Math.max(1, ...rows.map((r) => r.calls)), [rows]);

  return (
    <section aria-labelledby="ai-heading">
      <div className="flex items-center justify-between gap-4">
        <h2 id="ai-heading" className="font-display text-lg font-semibold">
          AI usage
        </h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/ai">Settings</Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No provider calls in the last seven days.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((row) => (
            <li key={row.purpose}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{row.purpose.replace(/_/g, " ")}</span>
                <span className="tabular text-xs text-muted-foreground">
                  {row.calls} call{row.calls === 1 ? "" : "s"} · {(row.inputTokens + row.outputTokens).toLocaleString()} tokens
                  {row.failures > 0 && <span className="text-destructive"> · {row.failures} failed</span>}
                </span>
              </div>
              <MiniBar className="mt-1.5" value={row.calls} max={maxCalls} tone={row.failures > 0 ? "danger" : "brand"} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * One bento tile.
 *
 * `to` makes the whole tile a link; without it the tile is inert. The tile is a `motion.div` and the
 * link is inside it rather than the other way round, because animating a link's transform fights
 * the hover transition on the same element.
 */
function Tile({
  children,
  span,
  to,
  tone,
  ariaLabel,
}: {
  children: React.ReactNode;
  span?: string;
  to?: string;
  tone?: "warn";
  ariaLabel: string;
}) {
  const shell = cn(
    "relative flex h-full flex-col rounded-lg border bg-background p-4",
    tone === "warn" ? "border-trailmark/50 bg-trailmark/[0.04]" : "border-border",
    to && "transition-colors hover:bg-surface-sunken/60",
  );

  return (
    <motion.div variants={fadeUp} transition={transition.base} className={span}>
      {to ? (
        <Link to={to} aria-label={ariaLabel} className={cn(shell, "group")}>
          {children}
          <ArrowRight
            className="absolute right-3 top-3 h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </Link>
      ) : (
        <div className={shell}>{children}</div>
      )}
    </motion.div>
  );
}

function TileHead({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="min-w-0 pr-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      {hint && <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

function BigNumber({ value, tone, className }: { value: number; tone?: "warn"; className?: string }) {
  return (
    <AnimatedNumber
      value={value}
      className={cn("font-display text-3xl leading-none font-semibold", tone === "warn" && value > 0 && "text-destructive", className)}
    />
  );
}

function Attention({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-start gap-3 rounded-md border border-trailmark/50 bg-trailmark/6 px-4 py-3 text-sm transition-colors hover:bg-trailmark/10"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-trailmark-strong" aria-hidden="true" />
        {label}
      </Link>
    </li>
  );
}
