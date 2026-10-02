import { useMemo, useState } from "react";
import { Ban, Check, X } from "lucide-react";

import { gradeTask } from "@shared/tasks";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { editorScopeProps } from "@/features/proctor/editorScope";
import { cn } from "@/lib/utils";

import { allocationTotals, allocKey, isBlocked, parseHours, setHours } from "./allocation";
import type { TaskComponentProps } from "./types";

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/**
 * Allocate: people down the side, projects across the top, hours in each cell. Row totals compare
 * with each person's capacity (red past it); column totals with each project's need (amber when
 * short or over by more than the slack, green when covered). Blocked pairs are disabled, with the
 * reason in a tooltip. The table scrolls sideways inside its box on a phone.
 */
export function AllocateTask({ task, value, onChange, readOnly, answer, idPrefix }: TaskComponentProps<"allocate">) {
  const hours = useMemo(() => value?.hours ?? {}, [value]);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(hours).map(([k, v]) => [k, String(v)])),
  );
  const totals = useMemo(() => allocationTotals(task, hours), [task, hours]);
  const grade = useMemo(() => (answer ? gradeTask(answer, value ?? { kind: "allocate", hours: {} }) : null), [answer, value]);
  const slackPct = Math.round(task.slack * 100);

  const edit = (key: string, raw: string) => {
    const parsed = parseHours(raw);
    if (parsed === undefined) return;
    setDrafts((d) => ({ ...d, [key]: raw }));
    onChange({ kind: "allocate", hours: setHours(hours, key, parsed) });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Hours this week. Keep everyone within capacity and cover each project's need
        {slackPct > 0 ? ` (up to ${slackPct}% over is fine)` : ""}.
      </p>

      <div {...editorScopeProps()} className="relative max-w-full overflow-x-auto rounded-md border bg-surface">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface-sunken">
              <th scope="col" className="sticky left-0 z-10 min-w-[9rem] border-b border-r bg-surface-sunken px-3 py-2 text-left font-medium">
                Person
              </th>
              {task.projects.map((project) => (
                <th key={project.id} scope="col" className="min-w-[7.5rem] border-b border-r px-3 py-2 text-left align-bottom font-medium">
                  {project.name}
                  <span className="block font-mono text-xs font-normal text-muted-foreground">needs {fmt(project.need)} h</span>
                </th>
              ))}
              <th scope="col" className="min-w-[6.5rem] border-b px-3 py-2 text-right align-bottom font-medium">
                Total / capacity
              </th>
            </tr>
          </thead>
          <tbody>
            {task.people.map((person, i) => {
              const total = totals.people[i];
              return (
                <tr key={person.id} className="border-b">
                  <th scope="row" className="sticky left-0 z-10 border-r bg-surface px-3 py-2 text-left align-top font-medium">
                    {person.name}
                    {person.note && <span className="block max-w-[12rem] text-xs font-normal text-muted-foreground">{person.note}</span>}
                    {/* On a phone the totals column is off to the right; the person's total rides along here. */}
                    <span
                      className={cn("block font-mono text-xs font-normal tabular sm:hidden", total.over ? "text-destructive" : "text-muted-foreground")}
                      aria-hidden="true"
                    >
                      {fmt(total.sum)} / {fmt(total.capacity)} h{total.over ? " — over" : ""}
                    </span>
                  </th>
                  {task.projects.map((project) => {
                    const key = allocKey(person.id, project.id);
                    const id = `${idPrefix}-alloc-${person.id}-${project.id}`;
                    const label = `${person.name} on ${project.name}, hours`;
                    if (isBlocked(task, person.id, project.id)) {
                      const given = task.blocked.find((b) => b.person === person.id && b.project === project.id)?.reason ?? person.note;
                      const reason = given
                        ? `${person.name} can't work on ${project.name}: ${given}`
                        : `${person.name} can't work on ${project.name}.`;
                      return (
                        <td key={project.id} className="border-r bg-surface-sunken/60 px-3 py-2 align-top">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                tabIndex={0}
                                role="img"
                                aria-label={reason}
                                className="inline-flex items-center gap-1.5 rounded px-1 py-1 text-xs text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary-strong"
                              >
                                <Ban className="size-3.5" aria-hidden="true" />
                                Blocked
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{reason}</TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    }
                    return (
                      <td key={project.id} className="border-r px-2 py-1.5 align-top">
                        <label htmlFor={id} className="sr-only">
                          {label}
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            id={id}
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            placeholder="0"
                            value={drafts[key] ?? (hours[key] ? String(hours[key]) : "")}
                            readOnly={readOnly}
                            onChange={(event) => edit(key, event.target.value)}
                            className="h-8 w-16 rounded-md border border-input bg-surface px-2 text-right font-mono text-sm tabular read-only:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-strong"
                          />
                          <span className="font-mono text-xs text-muted-foreground" aria-hidden="true">
                            h
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  <td
                    className={cn(
                      "px-3 py-2 text-right align-top font-mono text-sm tabular",
                      total.over ? "font-medium text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {fmt(total.sum)} / {fmt(total.capacity)}
                    {total.over && <span className="block text-xs">over by {fmt(total.sum - total.capacity)}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-surface-sunken/60">
              <th scope="row" className="sticky left-0 z-10 border-r bg-surface-sunken px-3 py-2 text-left font-medium">
                Covered / need
              </th>
              {totals.projects.map((p) => (
                <td
                  key={p.id}
                  className={cn(
                    "border-r px-3 py-2 font-mono text-sm tabular",
                    p.state === "covered" ? "bg-summit/[0.12] text-summit-strong" : "bg-warning/[0.14] text-warning-strong",
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {p.state === "covered" && <Check className="size-3.5" aria-hidden="true" />}
                    {fmt(p.sum)} / {fmt(p.need)}
                  </span>
                  <span className="block text-xs">
                    {p.state === "covered" ? "covered" : p.state === "short" ? `short ${fmt(p.need - p.sum)} h` : "over-staffed"}
                  </span>
                </td>
              ))}
              <td className="px-3 py-2" />
            </tr>
          </tfoot>
        </table>
      </div>

      {answer && grade && (
        <div className="space-y-3 rounded-md border border-summit/40 bg-summit/[0.05] px-4 py-4 text-sm">
          <p className="font-semibold">How it was checked</p>
          <ul className="space-y-1">
            {grade.detail.map((line, i) => {
              const ok = !line.includes(" — ");
              return (
                <li key={i} className="flex items-start gap-2">
                  {ok ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-summit-strong" aria-hidden="true" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                  )}
                  <span>
                    <span className="sr-only">{ok ? "Fine: " : "Problem: "}</span>
                    {line}
                  </span>
                </li>
              );
            })}
          </ul>
          {answer.explanation && <p className="text-muted-foreground">{answer.explanation}</p>}
        </div>
      )}
    </div>
  );
}
