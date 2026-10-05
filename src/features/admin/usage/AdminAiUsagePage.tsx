import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";

import type { BudgetStatus, UsageReport } from "@shared/aiRouting";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Progress } from "@/components/ui/progress";
import { Segmented } from "@/components/ui/segmented";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { InfoTip } from "../catalog/InfoTip";
import { budgetTone, fillDays, formatUsd, taskLabel } from "./helpers";
import { RoleplayUsageSection } from "./RoleplayUsageSection";
import { TimingChart } from "./TimingChart";

const PERIODS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
] as const;
type Period = (typeof PERIODS)[number]["value"];

/**
 * Admin → AI usage (v4 Phase 6). What the AI is costing, where it goes and who it is spent on.
 * Every staff member can read it; only the superadmin sets the monthly budget.
 */
export default function AdminAiUsagePage() {
  useDocumentTitle("AI usage");
  const me = useCurrentUser();
  const [period, setPeriod] = useState<Period>("30");
  const [report, setReport] = useState<UsageReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (days: Period, signal?: AbortSignal) => {
    setLoading(true);
    try {
      setReport(await api.get<UsageReport>(`/api/admin/ai/usage?days=${days}`, signal));
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof ApiRequestError ? err.message : "Could not load AI usage.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(period, controller.signal);
    return () => controller.abort();
  }, [load, period]);

  return (
    <div className="max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI usage</h1>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">Spend by day, by task and by learner, from our own call log.</p>
        </div>
        <Segmented label="Period" size="sm" options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      {error && <div className="mt-6"><FormAlert>{error}</FormAlert></div>}

      {!report ? (
        loading && (
          <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Loading…
          </p>
        )
      ) : (
        <div className={cn("transition-opacity", loading && "opacity-60")} aria-busy={loading}>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <BudgetTile budget={report.budget} />
            <StatTile label={`Total, last ${period} days`} value={formatUsd(report.totalUsd)} />
            <StatTile
              label="Per assessment"
              value={formatUsd(report.perAssessment.avgUsd)}
              hint={`${report.perAssessment.count} assessment${report.perAssessment.count === 1 ? "" : "s"}`}
            />
            <StatTile
              label="Per generated course"
              value={formatUsd(report.perCourse.avgUsd)}
              hint={`${report.perCourse.count} course${report.perCourse.count === 1 ? "" : "s"}`}
            />
          </div>

          {me.role === "superadmin" && <BudgetForm budget={report.budget} onSaved={() => void load(period)} />}

          <DailyChart days={report.days} count={Number(period)} />

          <TimingChart days={Number(period)} />

          <RoleplayUsageSection canEdit={me.role === "superadmin"} />

          <Section title="By task" id="usage-task">
            {report.byTask.length === 0 ? (
              <Empty />
            ) : (
              <Table
                head={["Task", "Calls", "AI usage in", "AI usage out", "Cache reads", "Cost"]}
                rows={report.byTask.map((t) => ({
                  key: t.task,
                  cells: [
                    taskLabel(t.task),
                    t.calls.toLocaleString(),
                    t.inputTokens.toLocaleString(),
                    t.outputTokens.toLocaleString(),
                    t.cacheReadTokens.toLocaleString(),
                    formatUsd(t.usd),
                  ],
                }))}
              />
            )}
          </Section>

          <Section title="By learner (top 20)" id="usage-learner">
            {report.byLearner.length === 0 ? (
              <Empty />
            ) : (
              <Table
                head={["Learner", "Calls", "Cost"]}
                rows={report.byLearner.map((l) => ({
                  key: l.userId,
                  cells: [
                    <Link
                      key="name"
                      to={`/admin/people/${l.userId}`}
                      className="underline decoration-primary/60 decoration-2 underline-offset-4 hover:decoration-primary"
                    >
                      {l.displayName}
                    </Link>,
                    l.calls.toLocaleString(),
                    formatUsd(l.usd),
                  ],
                }))}
              />
            )}
          </Section>
        </div>
      )}
    </div>
  );
}

function Tile({ children, tone }: { children: ReactNode; tone?: "warn" | "over" }) {
  return (
    <div
      className={cn(
        "flex h-full min-w-0 flex-col rounded-lg border bg-background p-3 sm:p-4",
        tone === "warn" && "border-trailmark/60 bg-trailmark/[0.05]",
        tone === "over" && "border-destructive/50 bg-destructive/[0.05]",
      )}
    >
      {children}
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Tile>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl leading-none font-semibold tabular sm:text-3xl">{value}</p>
      {hint && <p className="mt-auto pt-2 font-mono text-[11px] text-muted-foreground">{hint}</p>}
    </Tile>
  );
}

function BudgetTile({ budget }: { budget: BudgetStatus }) {
  const tone = budgetTone(budget.share);
  const pct = budget.share === null ? 0 : Math.min(100, Math.round(budget.share * 100));
  return (
    <Tile tone={tone === "warn" || tone === "over" ? tone : undefined}>
      <p className="text-sm text-muted-foreground">This month</p>
      <p className="mt-2 font-display text-2xl leading-none font-semibold tabular sm:text-3xl">{formatUsd(budget.spentUsd)}</p>
      {budget.monthlyBudgetUsd === null ? (
        <p className="mt-auto pt-2 text-xs text-muted-foreground">No monthly budget set.</p>
      ) : (
        <div className="mt-auto pt-3">
          <Progress
            value={pct}
            aria-label={`${pct}% of the monthly budget used`}
            indicatorClassName={cn(tone === "over" ? "bg-destructive" : tone === "warn" ? "bg-trailmark" : "bg-primary")}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            of {formatUsd(budget.monthlyBudgetUsd)} ({Math.round((budget.share ?? 0) * 100)}%)
          </p>
          {budget.paused && (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-destructive">
              <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              Non-urgent AI jobs are paused
            </p>
          )}
        </div>
      )}
    </Tile>
  );
}

function BudgetForm({ budget, onSaved }: { budget: BudgetStatus; onSaved: () => void }) {
  const [value, setValue] = useState<number | null>(budget.monthlyBudgetUsd);
  const [saving, setSaving] = useState(false);
  useEffect(() => setValue(budget.monthlyBudgetUsd), [budget.monthlyBudgetUsd]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/api/admin/ai/budget", { monthlyBudgetUsd: value });
      notify.success(value === null ? "Budget removed." : `Budget set to ${formatUsd(value)} a month.`);
      onSaved();
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "Could not save the budget.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border px-4 py-3">
      <div>
        <div className="flex items-center gap-1">
          <label htmlFor="monthly-budget" className="text-sm font-medium">
            Monthly budget (USD)
          </label>
          <InfoTip label="About the monthly budget">
            At 80% you get a warning. At 100%, non-urgent jobs (gap fills, course writing) wait until the month turns over or
            the budget is raised; grading and credential checks still run. Leave empty for no budget.
          </InfoTip>
        </div>
        <NumberInput
          id="monthly-budget"
          value={value}
          onChange={setValue}
          min={0}
          max={100_000}
          step={10}
          placeholder="No budget"
          containerClassName="mt-1.5 w-40"
        />
      </div>
      <Button size="sm" variant="outline" loading={saving} disabled={value === budget.monthlyBudgetUsd} onClick={() => void save()}>
        Save
      </Button>
    </div>
  );
}

function DailyChart({ days, count }: { days: UsageReport["days"]; count: number }) {
  const series = useMemo(() => fillDays(days, count), [days, count]);
  const max = Math.max(...series.map((d) => d.usd), 0);
  const total = series.reduce((s, d) => s + d.usd, 0);
  const peak = series.reduce((best, d) => (d.usd > best.usd ? d : best), series[0]);
  const mid = series[Math.floor(series.length / 2)];

  return (
    <Section title="Daily spend" id="usage-daily">
      {max === 0 ? (
        series.some((d) => d.calls > 0) ? (
          <p className="text-sm text-muted-foreground">
            {series.reduce((s, d) => s + d.calls, 0).toLocaleString()} calls, none billable (mock and subscription providers are priced at $0).
          </p>
        ) : (
          <Empty />
        )
      ) : (
        <figure className="rounded-lg border p-4">
          <figcaption className="sr-only">
            Daily AI spend over the last {count} days: {formatUsd(total)} in total, the highest day {peak.day} at {formatUsd(peak.usd)}.
          </figcaption>
          <div className="flex gap-2" aria-hidden="true">
            <div className="flex w-14 shrink-0 flex-col justify-between text-right font-mono text-[11px] text-muted-foreground">
              <span>{formatUsd(max)}</span>
              <span>$0</span>
            </div>
            <div className="flex h-40 min-w-0 flex-1 items-end gap-px border-b border-l border-border">
              {series.map((d) => (
                <div
                  key={d.day}
                  title={`${d.day}: ${formatUsd(d.usd)}, ${d.calls} call${d.calls === 1 ? "" : "s"}`}
                  className="min-w-0 flex-1 rounded-t-[2px] bg-primary/80 hover:bg-primary"
                  style={{ height: d.usd > 0 ? `${Math.max(2, (d.usd / max) * 100)}%` : 0 }}
                />
              ))}
            </div>
          </div>
          <div className="ml-16 mt-1 flex justify-between font-mono text-[11px] text-muted-foreground" aria-hidden="true">
            <span>{series[0].day.slice(5)}</span>
            <span>{mid.day.slice(5)}</span>
            <span>{series[series.length - 1].day.slice(5)}</span>
          </div>
          <p className="ml-16 mt-1 text-center text-xs text-muted-foreground" aria-hidden="true">
            Day (month-day), cost in USD
          </p>
        </figure>
      )}
    </Section>
  );
}

function Section({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <section className="mt-10" aria-labelledby={id}>
      <h2 id={id} className="font-display text-lg font-semibold">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">No AI calls in this period.</p>;
}

function Table({ head, rows }: { head: string[]; rows: { key: string; cells: ReactNode[] }[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-surface-sunken/50">
            {head.map((h, i) => (
              <th
                key={h}
                scope="col"
                className={cn("px-3 py-2 text-xs font-semibold whitespace-nowrap text-muted-foreground", i === 0 ? "min-w-40 text-left" : "text-right")}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b last:border-0">
              {row.cells.map((cell, i) => (
                <td key={i} className={cn("px-3 py-2", i === 0 ? "text-left" : "text-right tabular whitespace-nowrap")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
