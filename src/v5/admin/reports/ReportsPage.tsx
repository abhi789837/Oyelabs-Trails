import { Download, Mail } from "lucide-react";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import { isoDay, RANGE_PRESETS, REPORT_DAY_COLUMNS, reportDayRows, toCsv, type ReportsResponse } from "@shared/reports";

import { Button, Card, CardHeader, ErrorState, Input, Skeleton, StatTile, cn, v5Toast } from "@/v5/design";

import { v5AdminApi } from "../api";
import { csvName, downloadText, Page, PageHeader, plainMessage, useLoad, useSlow } from "../parts/common";
import { ReportsSkeleton } from "../parts/Skeletons";

const SimpleBarChart = lazy(() => import("../parts/Charts").then((m) => ({ default: m.SimpleBarChart })));
const SimpleLineChart = lazy(() => import("../parts/Charts").then((m) => ({ default: m.SimpleLineChart })));
// Phase 6: the opt-in team board switch (super admins), next to the weekly email.
const LeaderboardSetting = lazy(() => import("@/v5/motivation/LeaderboardSetting"));

/** The summary rows that go above the day series in the CSV. */
export function reportSummaryCsv(report: ReportsResponse): string {
  const rows: [string, string | number][] = [
    ["From", report.days[0] ?? ""],
    ["To", report.days.at(-1) ?? ""],
    ["Lessons finished", report.completion.lessonsDone],
    ["People with a plan", report.completion.learnersWithPlan],
    ["Plan done on average (%)", report.completion.averagePlanDone],
    ["Plans finished", report.completion.plansFinished],
    ["Hours learned", report.time.hours],
    ["People who learned", report.time.activeLearners],
    ["Skill level-ups", report.skills.levelUps],
    ["Practical cases passed", report.skills.casesPassed],
    ["Topic tests taken", report.tests.topic.attempts],
    ["Topic tests passed", report.tests.topic.passed],
    ["Topic test average (%)", report.tests.topic.averageScore],
    ["Placement tests finished", report.tests.placement.finished],
    ["AI cost (USD)", report.ai.dollars],
  ];
  return toCsv(rows, [
    { label: "Measure", value: (r) => r[0] },
    { label: "Value", value: (r) => r[1] },
  ]);
}

function shortDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function Section({ id, title, description, children, action }: { id: string; title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader title={title} description={description} action={action} />
      {children}
    </Card>
  );
}

function Figure({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-fg-2">{label}</dt>
      <dd className="font-display text-h3 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

/** `/admin/reports`: completion, time, skill growth, test results and AI cost, for a date range. */
export default function ReportsPage() {
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const query = (() => {
    const out = new URLSearchParams();
    for (const k of ["days", "from", "to"]) {
      const v = params.get(k);
      if (v) out.set(k, v);
    }
    if (!out.toString()) out.set("days", "30");
    return out.toString();
  })();
  const report = useLoad((signal) => v5AdminApi.reports(query, signal), query);
  const slow = useSlow(report.loading && !report.data);
  const data = report.data;
  const preset = params.get("from") ? null : (params.get("days") ?? "30");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [emailOn, setEmailOn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!data) return;
    setFrom(data.days[0] ?? "");
    setTo(data.days.at(-1) ?? "");
    setEmailOn(data.weeklyEmail.on);
  }, [data]);

  useEffect(() => {
    if (!data || !hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [data, hash]);

  const setRange = (next: Record<string, string>) => setParams(new URLSearchParams(next), { replace: true });

  const exportCsv = () => {
    if (!data) return;
    const text = `${reportSummaryCsv(data)}\r\n${toCsv(reportDayRows(data), REPORT_DAY_COLUMNS)}`;
    downloadText(csvName(`report-${data.days[0] ?? isoDay(Date.now())}`), text);
  };

  const toggleEmail = async () => {
    const next = !emailOn;
    setEmailOn(next);
    try {
      const r = await v5AdminApi.setWeeklyEmail(next);
      v5Toast.success(r.on ? "You'll get this report by email every week." : "Weekly email turned off.");
    } catch (error) {
      setEmailOn(!next);
      v5Toast.error("That didn't work", plainMessage(error));
    }
  };

  const days = data?.days.map(shortDay) ?? [];

  return (
    <Page wide>
      <PageHeader
        title="Reports"
        description="How learning is going, for the dates you pick."
        actions={
          <>
            {data?.weeklyEmail.available ? (
              <Button variant="secondary" size="sm" onClick={() => void toggleEmail()} aria-pressed={emailOn ?? false} disabled={emailOn === null}>
                <Mail aria-hidden="true" />
                {emailOn ? "Weekly email: on" : "Email me this weekly"}
              </Button>
            ) : null}
            <Suspense fallback={null}>
              <LeaderboardSetting />
            </Suspense>
            <Button variant="primary" size="sm" onClick={exportCsv} disabled={!data}>
              <Download aria-hidden="true" />
              Download CSV
            </Button>
          </>
        }
      />

      <form
        className="mb-5 flex flex-wrap items-end gap-3"
        aria-label="Dates"
        onSubmit={(e) => {
          e.preventDefault();
          if (from && to) setRange({ from, to });
        }}
      >
        <div role="group" aria-label="Quick dates" className="flex gap-1 rounded-control border border-line-1 bg-surface-1 p-0.5">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={preset === String(p.days)}
              onClick={() => setRange({ days: String(p.days) })}
              className={cn("h-8 rounded-[6px] px-3 text-small font-medium", preset === String(p.days) ? "bg-brand text-on-brand" : "text-fg-2 hover:bg-sunken hover:text-fg-1")}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-small font-medium">
          From
          <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </label>
        <label className="flex flex-col gap-1 text-small font-medium">
          To
          <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </label>
        <Button type="submit" variant="secondary" size="md" disabled={!from || !to}>
          Show these dates
        </Button>
      </form>

      {report.error && !data ? (
        <ErrorState body={plainMessage(report.error)} onRetry={report.reload} />
      ) : !data ? (
        slow ? <ReportsSkeleton /> : null
      ) : (
        <div className="flex flex-col gap-(--v5-gap)" aria-busy={report.loading}>
          <ul className="grid grid-cols-1 gap-(--v5-gap) sm:grid-cols-2 xl:grid-cols-4">
            <li>
              <StatTile label="Lessons finished" value={data.completion.lessonsDone} detail={`${data.completion.plansFinished} plans finished`} />
            </li>
            <li>
              <StatTile label="Hours learned" value={data.time.hours} detail={`${data.time.activeLearners} people learned`} />
            </li>
            <li>
              <StatTile label="Skill level-ups" value={data.skills.levelUps} detail={`${data.skills.casesPassed} practical cases passed`} />
            </li>
            <li>
              <StatTile label="AI cost" value={`$${data.ai.dollars.toFixed(2)}`} detail={`${data.ai.calls} AI requests`} />
            </li>
          </ul>

          <h2 className="sr-only">Details</h2>
          <div className="grid gap-(--v5-gap) lg:grid-cols-2">
            <Section id="completion" title="Lessons finished" description={`Plans are ${data.completion.averagePlanDone}% done on average across ${data.completion.learnersWithPlan} people.`}>
              <Suspense fallback={<Skeleton className="h-[220px] w-full" />}>
                <SimpleBarChart title="Lessons finished" data={days.map((label, i) => ({ label, value: data.completion.perDay[i] ?? 0 }))} />
              </Suspense>
            </Section>
            <Section id="time" title="Hours learned" description="Worked out from the lessons people finished, using each lesson's expected time.">
              <Suspense fallback={<Skeleton className="h-[220px] w-full" />}>
                <SimpleLineChart title="Hours learned" unit="h" data={days.map((label, i) => ({ label, value: data.time.perDay[i] ?? 0 }))} />
              </Suspense>
            </Section>
            <Section id="skills" title="Skill growth" description={`${data.skills.levelUps} level-ups by ${data.skills.learners} people, from their latest tests.`}>
              {data.skills.bySkill.length ? (
                <ul className="flex flex-col gap-1.5 text-small">
                  {data.skills.bySkill.map((s) => (
                    <li key={s.skill} className="flex justify-between gap-3 border-b border-line-1 pb-1.5 last:border-0">
                      <span>{s.skill}</span>
                      <span className="tabular-nums text-fg-2">{s.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-small text-fg-2">No skill went up in these dates. Levels change when someone takes a new test.</p>
              )}
            </Section>
            <Section id="tests" title="Test results">
              <dl className="grid grid-cols-2 gap-3 text-small">
                <Figure label="Topic tests passed" value={`${data.tests.topic.passed} of ${data.tests.topic.attempts}`} />
                <Figure label="Pass rate" value={`${data.tests.topic.passRate}%`} />
                <Figure label="Average mark" value={`${data.tests.topic.averageScore}%`} />
                <Figure label="Placement tests finished" value={data.tests.placement.finished} />
              </dl>
            </Section>
            <Section id="ai" title="AI cost" description={`${data.ai.calls} requests, ${data.ai.failed} failed. Prices are list prices in US dollars.`}>
              {/* A zero state instead of an empty chart whose axis runs to $4 (UX review Rp1). */}
              {data.ai.perDay.some((v) => v > 0) ? (
                <Suspense fallback={<Skeleton className="h-[220px] w-full" />}>
                  <SimpleBarChart title="AI cost (USD)" unit="$" data={days.map((label, i) => ({ label, value: data.ai.perDay[i] ?? 0 }))} />
                </Suspense>
              ) : (
                <p className="text-small text-fg-2" data-testid="ai-cost-empty">
                  No AI cost in these dates.
                </p>
              )}
            </Section>
          </div>
        </div>
      )}
    </Page>
  );
}
