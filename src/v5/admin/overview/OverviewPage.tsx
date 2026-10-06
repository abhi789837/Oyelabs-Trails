import { Clock, Download, GraduationCap, TrendingUp, Trophy, Users } from "lucide-react";
import { lazy, Suspense, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { toCsv, type DepartmentRow, type OverviewTile, type OverviewTileId } from "@shared/reports";

import { Button, Card, CardHeader, ErrorState, Skeleton, StatTile } from "@/v5/design";

import { v5AdminApi } from "../api";
import { csvName, downloadText, Page, PageHeader, plainMessage, useLoad, useSlow } from "../parts/common";
import { OverviewSkeleton } from "../parts/Skeletons";

const SimpleBarChart = lazy(() => import("../parts/Charts").then((m) => ({ default: m.SimpleBarChart })));

const TILE_ICON: Record<OverviewTileId, ReactNode> = {
  active: <Users />,
  hours: <Clock />,
  skills: <TrendingUp />,
  cases: <Trophy />,
};

/** "3 more than last week", "same as last week". */
export function trendLine(tile: Pick<OverviewTile, "value" | "previous">): { text: string; trend: "up" | "down" | "flat" } {
  const diff = Math.round((tile.value - tile.previous) * 10) / 10;
  if (diff === 0) return { text: "Same as the week before", trend: "flat" };
  return diff > 0 ? { text: `${diff} more than the week before`, trend: "up" } : { text: `${-diff} fewer than the week before`, trend: "down" };
}

const DEPARTMENT_COLUMNS = [
  { label: "Department", value: (d: DepartmentRow) => d.name },
  { label: "Learners", value: (d: DepartmentRow) => d.learners },
  { label: "Learned this week", value: (d: DepartmentRow) => d.activeThisWeek },
  { label: "Plan done on average (%)", value: (d: DepartmentRow) => d.averageDone },
  { label: "Stuck", value: (d: DepartmentRow) => d.stuck },
];

/** `/admin/overview`: four numbers, a cohort chart and departments at a glance. */
export default function OverviewPage() {
  const overview = useLoad((signal) => v5AdminApi.overview(signal));
  const slow = useSlow(overview.loading && !overview.data);
  const data = overview.data;

  return (
    <Page wide>
      <PageHeader
        title="Overview"
        description="This week across everyone. Every number opens the details."
        actions={
          data ? (
            <Button variant="secondary" size="sm" onClick={() => downloadText(csvName("departments"), toCsv(data.departments, DEPARTMENT_COLUMNS))}>
              <Download aria-hidden="true" />
              Download CSV
            </Button>
          ) : null
        }
      />
      {overview.error && !data ? (
        <ErrorState body={plainMessage(overview.error)} onRetry={overview.reload} />
      ) : !data ? (
        slow ? <OverviewSkeleton /> : null
      ) : (
        <div className="flex flex-col gap-(--v5-gap)">
          <ul className="grid grid-cols-1 gap-(--v5-gap) sm:grid-cols-2 xl:grid-cols-4">
            {data.tiles.map((tile) => {
              const t = trendLine(tile);
              return (
                <li key={tile.id}>
                  <Link to={tile.href} className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" aria-label={`${tile.label}: ${tile.value}. ${t.text}. Open the details.`}>
                    <StatTile label={tile.label} value={tile.value} detail={t.text} trend={t.trend} icon={TILE_ICON[tile.id]} className="h-full transition-shadow duration-200 hover:shadow-e2" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <h2 className="sr-only">Progress and departments</h2>
          <div className="grid gap-(--v5-gap) lg:grid-cols-2">
            <Card>
              <CardHeader title="Plan done, by the month people joined" description="The average share of their plan each group has finished." />
              {data.cohorts.length ? (
                <>
                  <Suspense fallback={<Skeleton className="h-[220px] w-full" />}>
                    <SimpleBarChart title="Plan done (%)" unit="%" data={data.cohorts.map((c) => ({ label: c.label, value: c.averageDone }))} />
                  </Suspense>
                  <p className="sr-only">
                    {data.cohorts.map((c) => `${c.label}: ${c.learners} people, ${c.averageDone}% done.`).join(" ")}
                  </p>
                </>
              ) : (
                <p className="text-small text-fg-2">No one has joined yet.</p>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Departments at a glance"
                action={
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/people">
                      <GraduationCap aria-hidden="true" />
                      People
                    </Link>
                  </Button>
                }
              />
              {data.departments.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-small">
                    <caption className="sr-only">Learners per department, who learned this week, plan done and who is stuck</caption>
                    <thead>
                      <tr className="border-b border-line-1 text-left text-fg-2">
                        <th scope="col" className="py-2 pr-3 font-medium">Department</th>
                        <th scope="col" className="py-2 pr-3 text-right font-medium">Learners</th>
                        <th scope="col" className="py-2 pr-3 text-right font-medium">This week</th>
                        <th scope="col" className="py-2 pr-3 text-right font-medium">Plan done</th>
                        <th scope="col" className="py-2 text-right font-medium">Stuck</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.departments.map((d) => (
                        <tr key={d.id || "none"} className="border-b border-line-1 last:border-0">
                          <th scope="row" className="py-2 pr-3 text-left font-medium">
                            {d.id ? (
                              <Link className="text-brand-fg underline-offset-4 hover:underline" to={`/admin/people?view=dept-${d.id}`}>
                                {d.name}
                              </Link>
                            ) : (
                              d.name
                            )}
                          </th>
                          <td className="py-2 pr-3 text-right tabular-nums">{d.learners}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{d.activeThisWeek}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{d.averageDone}%</td>
                          <td className="py-2 text-right tabular-nums">
                            {d.stuck > 0 ? (
                              <Link className="text-brand-fg underline-offset-4 hover:underline" to="/admin/people?view=stuck">
                                {d.stuck}
                              </Link>
                            ) : (
                              0
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-small text-fg-2">No departments yet.</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </Page>
  );
}
