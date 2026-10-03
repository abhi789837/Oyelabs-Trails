import { useEffect, useId, useState } from "react";
import { ArrowLeft, CircleCheck, LoaderCircle, RotateCcw } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { TARGET_LEVEL_LABELS } from "@shared/goals";
import { TASK_KIND_LABELS, type TaskResponse } from "@shared/tasks";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { hasTaskAnswer, TaskView } from "@/components/tasks/TaskView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { findTopic, topicPath } from "@/content";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/utils";
import { myGoalsApi, type CapstoneAttemptResult, type CapstoneView } from "./api";

/**
 * v4.3: a goal's capstone. A task is done here and graded on the server (passing achieves the goal);
 * a topic capstone links to the topic, whose own practice achieves it.
 */
export default function CapstonePage() {
  const { goalId = "" } = useParams();
  const [view, setView] = useState<CapstoneView | null>(null);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle(view ? view.capstone.title : "Capstone");

  useEffect(() => {
    const controller = new AbortController();
    myGoalsApi
      .capstone(goalId, controller.signal)
      .then(setView)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load this capstone.");
      });
    return () => controller.abort();
  }, [goalId]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trailmark">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Dashboard
      </Link>
      {error && (
        <div className="mt-6">
          <FormAlert>{error}</FormAlert>
        </div>
      )}
      {!view && !error && (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Loading the capstone…
        </p>
      )}
      {view && (
        <>
          <p className="mt-6 font-mono text-xs text-muted-foreground">
            Capstone · {view.goal.skillNames.join(", ")} · {TARGET_LEVEL_LABELS[view.goal.targetLevel]}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{view.capstone.title}</h1>
          <p className="mt-2 max-w-prose text-muted-foreground">{view.goal.outcome}</p>
          {view.goal.status === "achieved" && (
            <p className="mt-4 flex items-center gap-2 rounded-md border border-summit/40 bg-summit/10 px-4 py-3 text-sm">
              <CircleCheck className="size-4 text-summit-strong" aria-hidden="true" />
              Goal achieved. You can still practise it.
            </p>
          )}
          <div className="mt-8">{view.capstone.kind === "topic" ? <TopicCapstone topicId={view.capstone.topicId} /> : <TaskCapstone goalId={view.goal.id} view={view as Extract<CapstoneView, { capstone: { kind: "task" } }>} />}</div>
        </>
      )}
    </div>
  );
}

function TopicCapstone({ topicId }: { topicId: string }) {
  const found = findTopic(topicId);
  if (!found) return <p className="text-sm text-muted-foreground">This topic is not on your trail yet. Ask your admin to open it.</p>;
  return (
    <div className="rounded-md border bg-surface px-4 py-4">
      <p className="text-sm">Pass the practice on this topic to achieve the goal:</p>
      <Button asChild className="mt-3">
        <Link to={topicPath(found.topic)}>Open {found.topic.title}</Link>
      </Button>
    </div>
  );
}

function TaskCapstone({ goalId, view }: { goalId: string; view: Extract<CapstoneView, { capstone: { kind: "task" } }> }) {
  const idPrefix = useId().replace(/:/g, "");
  const [value, setValue] = useState<TaskResponse | null>(null);
  const [result, setResult] = useState<CapstoneAttemptResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const task = view.capstone.task;

  const submit = async () => {
    if (!value || pending) return;
    setPending(true);
    setError(null);
    try {
      setResult(await myGoalsApi.attempt(goalId, value));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "That did not submit. Try again.");
    } finally {
      setPending(false);
    }
  };

  const retry = () => {
    setValue(null);
    setResult(null);
    setRound((n) => n + 1);
  };

  const done = result?.passed ?? false;
  return (
    <div className="space-y-6">
      <Badge variant="outline">{TASK_KIND_LABELS[task.kind]}</Badge>
      <TaskView key={round} task={task} value={value} onChange={setValue} readOnly={done || pending} answer={done ? result?.review : null} idPrefix={idPrefix} />
      {error && <FormAlert>{error}</FormAlert>}
      {result && (
        <div role="status" className={cn("rounded-md border px-4 py-3 text-sm", result.passed ? "border-summit/50 bg-summit/[0.06]" : "border-border bg-surface-sunken/60")}>
          <p className="flex items-center gap-2 font-medium">
            {result.passed && <CircleCheck className="size-4 text-summit-strong" aria-hidden="true" />}
            {result.score === null ? (result.message ?? "Sent for review.") : result.passed ? (result.achieved ? "Passed. Goal achieved." : "Passed.") : `${Math.round(result.score * 100)}%: not there yet.`}
          </p>
          {result.feedback && <p className="mt-1 text-muted-foreground">{result.feedback}</p>}
          {result.detail.length > 0 && (
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {result.detail.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!done && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void submit()} loading={pending} disabled={!hasTaskAnswer(value)}>
            {result ? "Submit again" : "Submit"}
          </Button>
          {result && (
            <Button variant="outline" onClick={retry} disabled={pending}>
              <RotateCcw aria-hidden="true" />
              Start over
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
