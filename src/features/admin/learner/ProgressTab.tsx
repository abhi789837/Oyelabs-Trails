import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { LoaderCircle } from "lucide-react";

import type { ServedModule, ServedTopic, TopicProgressValue } from "@shared/content";
import type { AttemptKind } from "@shared/enums";
import type { PlanResponse } from "@shared/plans";

import { api, ApiRequestError } from "@/api/client";
import { RichText } from "@/components/content/RichText";
import { DataTable, useTableQueryState, type TableFieldDef } from "@/components/data-table";
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
  /** Flattened off `progress` so the catalogue can filter and sort on them directly. */
  status: TopicProgressValue["status"];
  attempts: number;
  bestScore: number | null;
  completedAt: number | null;
  attemptCount: number;
}

/**
 * Per-topic progress with the submitted work behind it (brief §13).
 *
 * A score on its own says whether they passed; it does not say whether they understood. Opening a
 * row fetches that camp's content — which for a superadmin comes back with the answer keys — so a
 * wrong answer can be read next to the right one and a code submission can simply be read.
 *
 * On the DataTable kit in `mode="client"`: the rows are assembled here from the curriculum manifest
 * and one progress record, so every row is already in hand and client mode can count facets. The
 * `topicAttemptsTableSpec` on the server is for a paged view of the raw attempts, which is a
 * different question from this one.
 *
 * The submitted work moved from an inline expanding row into the kit's detail panel. An attempt with
 * a dozen quiz questions in it is taller than the table, and expanding one used to push every row
 * below it off the screen — the thing being compared against.
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
  const { query, setQuery } = useTableQueryState();
  const [attempts, setAttempts] = useState<TopicAttempt[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const byTopic = useMemo(() => {
    const map = new Map<string, TopicAttempt[]>();
    for (const attempt of attempts ?? []) {
      const list = map.get(attempt.topicId) ?? [];
      list.push(attempt);
      map.set(attempt.topicId, list);
    }
    return map;
  }, [attempts]);

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
            status: value?.status ?? "not-started",
            attempts: value?.attempts ?? 0,
            bestScore: value?.bestScore ?? null,
            completedAt: value?.completedAt ?? null,
            attemptCount: byTopic.get(topic.id)?.length ?? 0,
          });
        }
      }
    }
    return out;
  }, [tracks, planIds, progress, byTopic]);

  /* Options come from this learner's own rows, not the whole curriculum: a filter listing 67 camps
     when they have topics in four of them is a worse control than one listing four. */
  const fields = useMemo<TableFieldDef<Row>[]>(() => {
    const distinct = (pick: (row: Row) => string) =>
      [...new Set(rows.map(pick))].sort().map((value) => ({ value, label: value }));

    return [
      { name: "title", label: "Topic", type: "string", searchable: true },
      { name: "topicId", label: "Topic id", type: "string", searchable: true },
      { name: "trackName", label: "Trail", type: "string", ...enumOf(distinct((r) => r.trackName)), quick: true },
      { name: "moduleName", label: "Camp", type: "string", ...enumOf(distinct((r) => r.moduleName)), quick: true },
      { name: "level", label: "Level", type: "string", ...enumOf(distinct((r) => r.level)) },
      {
        name: "status",
        label: "Status",
        type: "enum",
        quick: true,
        options: [
          { value: "completed", label: "Completed" },
          { value: "in-progress", label: "In progress" },
          { value: "not-started", label: "Not started" },
        ],
      },
      { name: "attempts", label: "Attempts", type: "number", min: 0, max: 20, quick: true },
      { name: "bestScore", label: "Best score", type: "number", min: 0, max: 100, unit: "%", quick: true },
      { name: "completedAt", label: "Completed", type: "date" },
      { name: "inPlan", label: "In their plan", type: "boolean", trueLabel: "In the plan", falseLabel: "Outside it" },
    ];
  }, [rows]);

  const columns = useMemo<ColumnDef<Row, unknown>[]>(
    () => [
      {
        id: "title",
        header: "Topic",
        cell: ({ row }) => (
          <div className="min-w-0">
            <span className="block font-medium">{row.original.title}</span>
            <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
              {row.original.topicId} · {row.original.level}
            </span>
          </div>
        ),
      },
      {
        id: "moduleName",
        header: "Camp",
        cell: ({ row }) => (
          <div className="text-muted-foreground">
            {row.original.moduleName}
            <span className="mt-0.5 block text-xs">{row.original.trackName}</span>
            {!row.original.inPlan && (
              <Badge variant="outline" className="mt-1">
                not in plan
              </Badge>
            )}
          </div>
        ),
      },
      { id: "status", header: "Status", cell: ({ row }) => <StatusBadge kind="topic" status={row.original.status} /> },
      { id: "attempts", header: "Attempts", meta: { align: "right" }, cell: ({ row }) => <span className="tabular">{row.original.attempts}</span> },
      {
        id: "bestScore",
        header: "Best score",
        meta: { align: "right" },
        cell: ({ row }) =>
          row.original.bestScore === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="tabular">{row.original.bestScore}%</span>
          ),
      },
      {
        id: "completedAt",
        header: "Completed",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.completedAt === null ? "—" : formatTimestamp(row.original.completedAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const completed = rows.filter((row) => row.status === "completed").length;

  return (
    <section aria-label="Progress">
      <div className="border-b pb-4">
        <h2 className="font-display text-lg font-semibold">Progress</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {completed} of {rows.length} topic{rows.length === 1 ? "" : "s"} completed
          {attempts ? ` · ${attempts.length} attempt${attempts.length === 1 ? "" : "s"} recorded` : ""}
        </p>
      </div>

      {error && (
        <div className="mt-4">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      <div className="mt-6">
        <DataTable
          data={rows}
          columns={columns}
          fields={fields}
          getRowId={(row) => row.topicId}
          query={query}
          onQueryChange={setQuery}
          mode="client"
          defaultSort={[{ field: "completedAt", dir: "desc" }]}
          tableKey="admin.learner.progress"
          loading={attempts === null}
          noun="topic"
          exportName={`progress-${userId}`}
          searchPlaceholder="Search topic or id"
          caption="Every topic in their plan, plus anything they completed outside it."
          emptyState={{
            title: "Nothing to show yet",
            body: "Once a plan is published, its topics appear here with whatever they have attempted.",
          }}
          renderDetail={(row) => <TopicAttempts row={row} attempts={byTopic.get(row.topicId) ?? []} />}
          detailTitle={(row) => row.title}
          detailSubtitle={(row) => (
            <span className="font-mono text-xs">
              {row.topicId} · {row.moduleName}
            </span>
          )}
          mobileCard={(row) => (
            <div className="space-y-2">
              <span className="block font-medium">{row.title}</span>
              <span className="block font-mono text-[11px] text-muted-foreground">
                {row.moduleName} · {row.level}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge kind="topic" status={row.status} />
                {row.bestScore !== null && <Badge variant="outline">{row.bestScore}%</Badge>}
                {row.attempts > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {row.attempts} attempt{row.attempts === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
          )}
        />
      </div>
    </section>
  );
}

/**
 * Turns a distinct-value list into the `enum` half of a field definition.
 *
 * Only when there is something to list: a faceted filter with zero options is a dead control, and
 * one with a single option cannot change the result set, so both stay a plain string field.
 */
function enumOf(options: { value: string; label: string }[]) {
  return options.length > 1 ? ({ type: "enum", options } as const) : {};
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

  if (attempts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {row.status === "not-started"
          ? "They have not opened this topic yet."
          : "They have opened this topic but not submitted the challenge."}
      </p>
    );
  }

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
