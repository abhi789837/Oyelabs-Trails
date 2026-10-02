import { useState, type ReactNode } from "react";
import { Check, Circle, Flag, GitBranch, Inbox, MessageSquare, Table2, Timer, Users, X } from "lucide-react";

import { InlineText } from "@/components/content/RichText";
import { cn } from "@/lib/utils";

import { ChoiceCard } from "./ChoiceCard";
import {
  branchesOf,
  columnIndex,
  initials,
  participantsOf,
  SIM_APP_LABELS,
  SIM_FLAG_LABELS,
  statusTone,
  type SimApp,
  type StatusTone,
} from "./simScreen";
import type { LearnerTaskOf, TaskComponentProps } from "./types";

type Row = LearnerTaskOf<"sim">["rows"][number];

const APP_ICON: Record<SimApp, typeof Timer> = {
  "keka-timesheets": Timer,
  "keka-psa": Table2,
  teams: Users,
  "github-pr": GitBranch,
  outlook: Inbox,
  generic: Table2,
};

/**
 * Screen check: a lightweight look-alike of the tool (no logos or names) with rows to flag and up
 * to three questions. Each row's flag is a real labelled checkbox; each question a radio group.
 */
export function SimTask({ task, value, onChange, readOnly, answer, idPrefix }: TaskComponentProps<"sim">) {
  const flagged = new Set(value?.flagged ?? []);
  const answers = value?.answers ?? {};
  const [announcement, setAnnouncement] = useState("");
  const issues = answer ? new Map(answer.rows.map((r) => [r.id, r.issue])) : null;
  const hasRows = task.rows.length > 0;

  const emit = (nextFlagged: Set<string>, nextAnswers: Record<string, number>) =>
    onChange({ kind: "sim", flagged: task.rows.map((r) => r.id).filter((id) => nextFlagged.has(id)), answers: nextAnswers });

  const toggle = (row: Row) => {
    if (readOnly) return;
    const next = new Set(flagged);
    if (next.has(row.id)) next.delete(row.id);
    else next.add(row.id);
    emit(next, answers);
    setAnnouncement(`${row.cells[0] || "Row"} ${next.has(row.id) ? "flagged" : "unflagged"}. ${next.size} flagged.`);
  };

  const flagControl = (row: Row, index: number) => {
    const id = `${idPrefix}-sim-${row.id}`;
    const isFlagged = flagged.has(row.id);
    return (
      <label
        htmlFor={id}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded px-1.5 py-1 text-xs whitespace-nowrap",
          "focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-primary-strong",
          readOnly ? "cursor-default" : "cursor-pointer",
          isFlagged ? "font-medium text-warning-strong" : "text-muted-foreground",
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={isFlagged}
          disabled={readOnly}
          onChange={() => toggle(row)}
          className="size-4 accent-[rgb(var(--trailmark-strong))]"
        />
        <span className="max-sm:sr-only">{SIM_FLAG_LABELS[task.app]}</span>
        <span className="sr-only">: row {index + 1}, {row.cells.filter(Boolean).slice(0, 2).join(", ")}</span>
      </label>
    );
  };

  const review = (row: Row) => {
    if (!issues) return null;
    const issue = issues.get(row.id);
    const isFlagged = flagged.has(row.id);
    if (!issue && !isFlagged) return null;
    return (
      <p className={cn("mt-1 text-xs", issue ? "text-summit-strong" : "text-muted-foreground")}>
        {issue ? `${isFlagged ? "Found" : "Missed"}: ${issue}` : "This one was fine."}
      </p>
    );
  };

  const Icon = APP_ICON[task.app];
  const screen = { task, flagged, flagControl, review, idPrefix };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border bg-surface shadow-sm">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b bg-surface-sunken px-3 py-2">
          <span className="flex gap-1" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-basalt/40" />
            <span className="size-2.5 rounded-full bg-basalt/40" />
            <span className="size-2.5 rounded-full bg-basalt/40" />
          </span>
          <Icon className="ml-1 size-4 text-primary-strong" aria-hidden="true" />
          <span className="truncate text-xs font-medium text-muted-foreground">{SIM_APP_LABELS[task.app]}</span>
        </div>
        <div className="space-y-3 px-3 py-3 sm:px-4">
          {task.app === "github-pr" ? <PrHeader title={task.title} /> : <h3 className="text-base font-semibold">{task.title}</h3>}
          {hasRows && (
            <>
              {task.app === "keka-timesheets" && <TimesheetScreen {...screen} />}
              {task.app === "keka-psa" && <TableScreen {...screen} chips />}
              {task.app === "generic" && <TableScreen {...screen} />}
              {task.app === "teams" && <TeamsScreen {...screen} />}
              {task.app === "github-pr" && <PrScreen {...screen} />}
              {task.app === "outlook" && <InboxScreen {...screen} />}
            </>
          )}
        </div>
      </div>
      {hasRows && (
        <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
          <span className="sr-only">{announcement} </span>
          {flagged.size} flagged
        </p>
      )}

      {task.questions.map((q, qi) => {
        const correct = answer?.questions.find((x) => x.id === q.id);
        return (
          <fieldset key={q.id}>
            <legend className="text-sm font-semibold">
              <span className="mr-2 font-mono text-xs text-muted-foreground">Question {qi + 1}</span>
              <InlineText text={q.question} />
            </legend>
            <div className="mt-3 space-y-2">
              {q.options.map((option, oi) => (
                <ChoiceCard
                  key={oi}
                  name={`${idPrefix}-simq-${q.id}`}
                  id={`${idPrefix}-simq-${q.id}-${oi}`}
                  checked={answers[q.id] === oi}
                  disabled={readOnly}
                  text={option}
                  review={correct ? (correct.correctIndex === oi ? "correct" : answers[q.id] === oi ? "wrong" : null) : null}
                  onSelect={() => emit(flagged, { ...answers, [q.id]: oi })}
                />
              ))}
            </div>
            {correct?.explanation && <p className="mt-2 text-sm text-muted-foreground">{correct.explanation}</p>}
          </fieldset>
        );
      })}
    </div>
  );
}

interface ScreenProps {
  task: LearnerTaskOf<"sim">;
  flagged: Set<string>;
  flagControl: (row: Row, index: number) => ReactNode;
  review: (row: Row) => ReactNode;
  idPrefix: string;
}

function ToneChip({ text, tone }: { text: string; tone: StatusTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tone === "ok" && "border-summit/40 bg-summit/[0.1] text-summit-strong",
        tone === "bad" && "border-destructive/40 bg-destructive/[0.08] text-destructive",
        tone === "pending" && "border-warning/50 bg-warning/[0.12] text-warning-strong",
        tone === null && "border-border bg-surface-sunken text-muted-foreground",
      )}
    >
      {text}
    </span>
  );
}

function ToneIcon({ tone }: { tone: StatusTone }) {
  if (tone === "ok") return <Check className="size-4 shrink-0 text-summit-strong" aria-label="Passed" />;
  if (tone === "bad") return <X className="size-4 shrink-0 text-destructive" aria-label="Failed" />;
  return <Circle className="size-3.5 shrink-0 text-warning-strong" aria-label="Pending" />;
}

/** An approvals table: the columns, a status chip and a "don't approve" checkbox per row. */
function TimesheetScreen({ task, flagged, flagControl, review }: ScreenProps) {
  const statusCol = columnIndex(task.columns, /status/i);
  return (
    <div className="relative max-w-full overflow-x-auto rounded-md border">
      <table className="w-max min-w-full text-sm">
        <thead className="bg-surface-sunken/70 text-left text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="w-0 px-2 py-2">
              <span className="sr-only">Flag</span>
            </th>
            {task.columns.map((c, i) =>
              i === statusCol ? null : (
                <th key={c} scope="col" className="px-3 py-2 font-medium">
                  {c}
                </th>
              ),
            )}
            <th scope="col" className="px-3 py-2 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {task.rows.map((row, ri) => {
            const isFlagged = flagged.has(row.id);
            const status = statusCol >= 0 ? row.cells[statusCol] : "";
            return (
              <tr key={row.id} className={cn("align-top", isFlagged && "bg-warning/[0.08]")}>
                <td className="px-2 py-1.5">{flagControl(row, ri)}</td>
                {row.cells.map((cell, ci) =>
                  ci === statusCol ? null : (
                    <td key={ci} className={cn("px-3 py-2", ci === 0 ? "font-medium" : "text-muted-foreground", /^\d+(\.\d+)?$/.test(cell) && "tabular")}>
                      {cell || <span className="text-muted-foreground/60">—</span>}
                      {ci === 0 && review(row)}
                    </td>
                  ),
                )}
                <td className="px-3 py-2">
                  <ToneChip text={isFlagged ? "Flagged" : status || "Pending"} tone={isFlagged ? "bad" : statusTone(status || "pending")} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** A plain table (generic) or an allocation table whose billing/type/status column reads as chips (keka-psa). */
function TableScreen({ task, flagged, flagControl, review, chips }: ScreenProps & { chips?: boolean }) {
  return (
    <div className="relative max-w-full overflow-x-auto rounded-md border">
      <table className="w-max min-w-full text-sm">
        <thead className="bg-surface-sunken/70 text-left text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="w-0 px-2 py-2">
              <span className="sr-only">Flag</span>
            </th>
            {task.columns.map((c) => (
              <th key={c} scope="col" className="px-3 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {task.rows.map((row, ri) => (
            <tr key={row.id} className={cn("align-top", flagged.has(row.id) && "bg-warning/[0.08]")}>
              <td className="px-2 py-1.5">{flagControl(row, ri)}</td>
              {row.cells.map((cell, ci) => {
                const billing = chips && /bill|type|status/i.test(task.columns[ci] ?? "") && cell.trim() !== "" && cell.length < 30;
                return (
                  <td key={ci} className={cn("px-3 py-2", ci === 0 ? "font-medium" : "text-muted-foreground")}>
                    {billing ? <ToneChip text={cell} tone={/non-billable|bench|internal|unbilled/i.test(cell) ? null : (statusTone(cell) ?? "ok")} /> : cell}
                    {ci === 0 && review(row)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A meeting panel: participants down the side, the chat as lines (first column is the speaker). */
function TeamsScreen({ task, flagged, flagControl, review }: ScreenProps) {
  const timeCol = columnIndex(task.columns, /time|when|at$/i);
  const people = participantsOf(task.rows);
  return (
    <div className="grid gap-3 md:grid-cols-[11rem_minmax(0,1fr)]">
      <section aria-label="Participants" className="rounded-md border bg-surface-sunken/40 px-3 py-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Users className="size-3.5" aria-hidden="true" />
          Participants ({people.length})
        </p>
        <ul className="mt-2 flex flex-wrap gap-2 md:block md:space-y-1.5">
          {people.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/[0.14] text-[10px] font-semibold text-primary-strong"
                aria-hidden="true"
              >
                {initials(p)}
              </span>
              {p}
            </li>
          ))}
        </ul>
      </section>
      <section aria-label="Meeting chat" className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MessageSquare className="size-3.5" aria-hidden="true" />
          Chat
        </p>
        <ol className="space-y-2">
          {task.rows.map((row, ri) => {
            const author = row.cells[0] ?? "";
            const time = timeCol > 0 ? row.cells[timeCol] : "";
            const message = row.cells
              .map((cell, ci) => ({ cell, ci }))
              .filter(({ cell, ci }) => ci !== 0 && ci !== timeCol && cell.trim())
              .map(({ cell, ci }, _n, all) => (all.length > 1 ? `${task.columns[ci]}: ${cell}` : cell));
            return (
              <li
                key={row.id}
                className={cn("flex gap-2.5 rounded-md border px-3 py-2", flagged.has(row.id) ? "border-warning/50 bg-warning/[0.08]" : "border-border")}
              >
                <span
                  className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/[0.14] text-[11px] font-semibold text-primary-strong"
                  aria-hidden="true"
                >
                  {initials(author)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs">
                    <span className="font-semibold">{author}</span>
                    {time && <span className="ml-2 font-mono text-muted-foreground">{time}</span>}
                  </p>
                  {message.map((m, i) => (
                    <p key={i} className="text-sm break-words">
                      {m}
                    </p>
                  ))}
                  {review(row)}
                </div>
                {flagControl(row, ri)}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function PrHeader({ title }: { title: string }) {
  const branches = branchesOf(title);
  const heading = branches ? title.replace(/\s*\(?[\w./-]+\s*(?:→|->|into)\s*[\w./-]+\)?\s*/, " ").trim() || title : title;
  return (
    <div className="space-y-1.5">
      <h3 className="text-base font-semibold">{heading}</h3>
      <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span className="rounded-full border border-summit/40 bg-summit/[0.1] px-2 py-0.5 font-medium text-summit-strong">Open</span>
        {branches && (
          <>
            wants to merge
            <code className="rounded bg-primary/[0.1] px-1.5 py-0.5 font-mono text-primary-strong">{branches.head}</code>
            into
            <code className="rounded bg-primary/[0.1] px-1.5 py-0.5 font-mono text-primary-strong">{branches.base}</code>
          </>
        )}
      </p>
    </div>
  );
}

/** Checks and reviews as rows with a ✓/✗ from whichever cell reads like a status. */
function PrScreen({ task, flagged, flagControl, review }: ScreenProps) {
  return (
    <section aria-label="Checks and reviews" className="rounded-md border">
      <p className="border-b bg-surface-sunken/60 px-3 py-2 text-xs font-medium text-muted-foreground">
        {task.columns.join(" · ")}
      </p>
      <ul className="divide-y">
        {task.rows.map((row, ri) => {
          const statusAt = row.cells.findIndex((c, i) => i > 0 && statusTone(c) !== null);
          const tone = statusAt >= 0 ? statusTone(row.cells[statusAt]) : statusTone(row.cells[0] ?? "");
          return (
            <li key={row.id} className={cn("flex items-start gap-2.5 px-3 py-2", flagged.has(row.id) && "bg-warning/[0.08]")}>
              <span className="mt-0.5">
                <ToneIcon tone={tone} />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium break-words">{row.cells[0]}</p>
                <p className="text-xs break-words text-muted-foreground">
                  {row.cells
                    .slice(1)
                    .filter((c) => c.trim())
                    .join(" · ")}
                </p>
                {review(row)}
              </div>
              {flagControl(row, ri)}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** An inbox list: sender, subject, a preview and the time. */
function InboxScreen({ task, flagged, flagControl, review }: ScreenProps) {
  const timeCol = columnIndex(task.columns, /time|received|date|when/i);
  const subjectCol = Math.max(1, columnIndex(task.columns, /subject/i));
  return (
    <ul className="divide-y rounded-md border">
      {task.rows.map((row, ri) => {
        const rest = row.cells.filter((_, i) => i !== 0 && i !== subjectCol && i !== timeCol && row.cells[i].trim());
        return (
          <li key={row.id} className={cn("flex items-start gap-2.5 px-3 py-2.5", flagged.has(row.id) && "bg-warning/[0.08]")}>
            <Flag
              className={cn("mt-1 size-3.5 shrink-0", flagged.has(row.id) ? "text-warning-strong" : "text-transparent")}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-semibold">{row.cells[0]}</span>
                {timeCol >= 0 && <span className="shrink-0 font-mono text-xs text-muted-foreground">{row.cells[timeCol]}</span>}
              </p>
              {row.cells[subjectCol] && <p className="text-sm break-words">{row.cells[subjectCol]}</p>}
              {rest.length > 0 && <p className="text-xs break-words text-muted-foreground">{rest.join(" · ")}</p>}
              {review(row)}
            </div>
            {flagControl(row, ri)}
          </li>
        );
      })}
    </ul>
  );
}

