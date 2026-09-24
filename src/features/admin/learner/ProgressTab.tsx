import { useEffect, useMemo, useState } from "react";
import { ChevronRight, LoaderCircle } from "lucide-react";

import type { ServedModule, ServedTopic, TopicProgressValue } from "@shared/content";
import type { AttemptKind } from "@shared/enums";
import type { PlanResponse } from "@shared/plans";

import { api, ApiRequestError } from "@/api/client";
import { RichText } from "@/components/content/RichText";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCachedModule, loadModule, useTracks } from "@/content";
import { levelLabels } from "@/lib/track-meta";
import { cn, formatTimestamp } from "@/lib/utils";

interface TopicAttempt {
  id: string;
  topicId: string;
  kind: AttemptKind;
  score: number;
  passed: boolean;
  /** Quiz: the chosen original option indices, keyed by question id. */
  answers: Record<string, number[]> | null;
  code: string | null;
  createdAt: number;
}

interface Row {
  topicId: string;
  title: string;
  trackId: string;
  trackName: string;
  moduleId: string;
  moduleName: string;
  level: string;
  inPlan: boolean;
  progress: TopicProgressValue | undefined;
}

/**
 * Per-topic progress with the submitted work behind it (brief §13).
 *
 * A score on its own says whether they passed; it does not say whether they understood. Expanding
 * a row fetches that camp's content — which for a superadmin comes back with the answer keys — so
 * a wrong answer can be read next to the right one and a code submission can simply be read.
 */
export function ProgressTab({
  userId,
  progress,
  plan,
}: {
  userId: string;
  progress: Record<string, TopicProgressValue>;
  plan: PlanResponse | null;
}) {
  const tracks = useTracks();
  const [attempts, setAttempts] = useState<TopicAttempt[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [onlyStarted, setOnlyStarted] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ attempts: TopicAttempt[] }>(`/api/admin/users/${userId}/attempts`)
      .then((result) => !cancelled && setAttempts(result.attempts))
      .catch(
        (err) => !cancelled && setError(err instanceof ApiRequestError ? err.message : "Could not load their attempts."),
      );
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const planIds = useMemo(() => new Set(plan?.plan?.topicIds ?? []), [plan]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const track of tracks) {
      for (const module of track.modules) {
        for (const topic of module.topics) {
          const inPlan = planIds.has(topic.id);
          const value = progress[topic.id];
          // Topics outside the plan still appear when they have history: removing a topic from a
          // plan must not erase the evidence that it was done (§11.2).
          if (!inPlan && !value) continue;
          out.push({
            topicId: topic.id,
            title: topic.title,
            trackId: track.id,
            trackName: track.name,
            moduleId: module.id,
            moduleName: module.name,
            level: levelLabels[topic.level],
            inPlan,
            progress: value,
          });
        }
      }
    }
    return out;
  }, [tracks, planIds, progress]);

  const visible = onlyStarted ? rows.filter((row) => row.progress && row.progress.status !== "not-started") : rows;
  const byTopic = useMemo(() => {
    const map = new Map<string, TopicAttempt[]>();
    for (const attempt of attempts ?? []) {
      const list = map.get(attempt.topicId) ?? [];
      list.push(attempt);
      map.set(attempt.topicId, list);
    }
    return map;
  }, [attempts]);

  const completed = rows.filter((row) => row.progress?.status === "completed").length;

  return (
    <section aria-label="Progress">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-lg font-semibold">Progress</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {completed} of {rows.length} topic{rows.length === 1 ? "" : "s"} completed
            {attempts ? ` · ${attempts.length} attempt${attempts.length === 1 ? "" : "s"} recorded` : ""}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyStarted}
            onChange={(e) => setOnlyStarted(e.target.checked)}
            className="h-4 w-4 accent-[rgb(var(--trailmark))]"
          />
          Only topics they've opened
        </label>
      </div>

      {error && (
        <div className="mt-4">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          {rows.length === 0 ? "No plan published yet, and nothing completed." : "Nothing started yet."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-md border">
          <table className="w-full min-w-208 border-collapse text-sm">
            <thead>
              <tr className="border-b bg-surface-sunken/50 text-left">
                <Th>Topic</Th>
                <Th>Camp</Th>
                <Th>Status</Th>
                <Th className="text-right">Attempts</Th>
                <Th className="text-right">Best score</Th>
                <Th>Completed</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const topicAttempts = byTopic.get(row.topicId) ?? [];
                const expandable = topicAttempts.length > 0;
                const expanded = open === row.topicId;
                return (
                  <ProgressRow
                    key={row.topicId}
                    row={row}
                    attempts={topicAttempts}
                    expandable={expandable}
                    expanded={expanded}
                    onToggle={() => setOpen(expanded ? null : row.topicId)}
                    loading={attempts === null}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ProgressRow({
  row,
  attempts,
  expandable,
  expanded,
  onToggle,
  loading,
}: {
  row: Row;
  attempts: TopicAttempt[];
  expandable: boolean;
  expanded: boolean;
  onToggle: () => void;
  loading: boolean;
}) {
  const status = row.progress?.status ?? "not-started";

  return (
    <>
      <tr className={cn("border-b hover:bg-surface-sunken/30", expanded && "bg-surface-sunken/30")}>
        <Td>
          {expandable ? (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              className="flex items-start gap-1.5 text-left font-medium"
            >
              <ChevronRight
                className={cn("mt-0.5 h-3.5 w-3.5 shrink-0 transition-transform", expanded && "rotate-90")}
                aria-hidden="true"
              />
              <span>
                {row.title}
                <span className="mt-0.5 block font-mono text-[11px] font-normal text-muted-foreground">
                  {row.topicId} · {row.level}
                </span>
              </span>
            </button>
          ) : (
            <span className="block pl-5 font-medium">
              {row.title}
              <span className="mt-0.5 block font-mono text-[11px] font-normal text-muted-foreground">
                {row.topicId} · {row.level}
              </span>
            </span>
          )}
        </Td>
        <Td className="text-muted-foreground">
          {row.moduleName}
          <span className="mt-0.5 block text-xs">{row.trackName}</span>
          {!row.inPlan && (
            <Badge variant="outline" className="mt-1">
              not in plan
            </Badge>
          )}
        </Td>
        <Td>
          <StatusBadge kind="topic" status={status} />
        </Td>
        <Td className="text-right tabular">{row.progress?.attempts ?? 0}</Td>
        <Td className="text-right tabular">
          {row.progress?.bestScore === null || row.progress?.bestScore === undefined ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            `${row.progress.bestScore}%`
          )}
        </Td>
        <Td className="whitespace-nowrap text-muted-foreground">
          {row.progress?.completedAt ? formatTimestamp(row.progress.completedAt) : loading ? "" : "—"}
        </Td>
      </tr>

      {expanded && (
        <tr className="border-b bg-surface-sunken/20">
          <td colSpan={6} className="px-3 py-4">
            <TopicAttempts row={row} attempts={attempts} />
          </td>
        </tr>
      )}
    </>
  );
}

function TopicAttempts({ row, attempts }: { row: Row; attempts: TopicAttempt[] }) {
  const [module, setModule] = useState<ServedModule | null>(() => getCachedModule(row.trackId, row.moduleId) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (module) return;
    let cancelled = false;
    loadModule(row.trackId, row.moduleId)
      .then((result) => !cancelled && setModule(result))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [module, row.trackId, row.moduleId]);

  const topic = module?.topics.find((t) => t.id === row.topicId);

  return (
    <div className="space-y-4">
      {!module && !failed && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading the questions…
        </p>
      )}
      {failed && (
        <p className="text-sm text-muted-foreground">
          The camp's content could not be loaded, so answers are shown as raw indices below.
        </p>
      )}

      <ol className="space-y-4">
        {attempts.map((attempt, index) => (
          <li key={attempt.id} className="rounded-md border bg-surface px-4 py-3">
            <p className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
              <span>
                Attempt {attempts.length - index} of {attempts.length}
              </span>
              <span>{formatTimestamp(attempt.createdAt)}</span>
              <Badge variant={attempt.passed ? "success" : "outline"}>
                {attempt.passed ? "passed" : "failed"} · {attempt.score}%
              </Badge>
            </p>

            {attempt.kind === "quiz" ? (
              <QuizAnswers answers={attempt.answers} topic={topic} />
            ) : (
              <pre className="mt-3 overflow-x-auto rounded-md border bg-editor px-3 py-2 font-mono text-xs leading-relaxed text-editor-foreground">
                <code>{attempt.code ?? "(nothing submitted)"}</code>
              </pre>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function QuizAnswers({
  answers,
  topic,
}: {
  answers: Record<string, number[]> | null;
  topic: ServedTopic | undefined;
}) {
  if (!answers || Object.keys(answers).length === 0) {
    return <p className="mt-2 text-sm text-muted-foreground">No answers recorded for this attempt.</p>;
  }

  const questions = topic?.quiz;
  if (!questions) {
    return (
      <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
        {Object.entries(answers).map(([questionId, chosen]) => (
          <li key={questionId}>
            {questionId}: [{chosen.join(", ")}]
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ol className="mt-3 space-y-4">
      {questions.map((question) => {
        const chosen = new Set(answers[question.id] ?? []);
        const correct = new Set(question.correctIndices ?? []);
        // The key is only absent if the content served without it, which would make a "wrong"
        // label a guess rather than a fact.
        const right = question.correctIndices
          ? chosen.size === correct.size && [...chosen].every((i) => correct.has(i))
          : null;
        return (
          <li key={question.id}>
            <p className="flex items-baseline gap-2">
              <span
                className={cn(
                  "font-mono text-xs",
                  right === null ? "text-muted-foreground" : right ? "text-summit-strong" : "text-destructive",
                )}
              >
                {right === null ? "not graded here" : right ? "correct" : "wrong"}
              </span>
              {question.multi && <span className="font-mono text-xs text-muted-foreground">multi-select</span>}
            </p>
            <RichText text={question.prompt} className="mt-1" />
            <ul className="mt-2 space-y-1 text-sm">
              {question.options.map((option, i) => {
                const isCorrect = correct.has(i);
                const picked = chosen.has(i);
                if (!isCorrect && !picked) return null;
                return (
                  <li
                    key={i}
                    className={cn(
                      "rounded-sm px-1.5 py-0.5",
                      isCorrect ? "text-summit-strong" : "bg-destructive/[0.07] text-destructive",
                    )}
                  >
                    {option}
                    <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                      {picked && isCorrect ? "they chose this, correct" : picked ? "they chose this" : "correct answer"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

// Sentence case, not the usual ALL-CAPS table header: the design system rules that out.
function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={cn("px-3 py-2 text-xs font-semibold text-muted-foreground", className)}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-3 align-top", className)}>{children}</td>;
}
