import { useId, useState } from "react";
import { CircleCheck, RotateCcw } from "lucide-react";

import { gradeTask, TASK_KIND_LABELS, type Task, type TaskResponse } from "@shared/tasks";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { hasTaskAnswer, TaskView } from "./TaskView";

export const PRACTICE_CHECKS = 3;

/**
 * Course practice with a hands-on task (PM/BD). Formative: answer, **Check** up to three times with
 * feedback lines from `gradeTask`, and after the third check (or a perfect one) the answer is shown.
 * A `write` task has no auto score — its first check reveals the sample answer and the rubric so the
 * learner can compare their own.
 */
export function PracticeTask({ task }: { task: Task }) {
  const idPrefix = useId().replace(/:/g, "");
  const [value, setValue] = useState<TaskResponse | null>(null);
  const [checks, setChecks] = useState(0);
  const [feedback, setFeedback] = useState<{ score: number | null; lines: string[]; hint: string[] } | null>(null);
  // Bumped on "Try it again" so fields with their own typing state start clean.
  const [round, setRound] = useState(0);

  const perfect = feedback?.score === 1;
  // Write and form tasks need a model for (part of) their score, so one check shows the sample answer.
  const selfCompare = task.kind === "write" || task.kind === "form";
  const revealed = checks >= PRACTICE_CHECKS || perfect || (selfCompare && checks > 0);
  const left = PRACTICE_CHECKS - checks;

  const check = () => {
    if (revealed || !hasTaskAnswer(value)) return;
    const grade = gradeTask(task, value);
    setChecks((n) => n + 1);
    setFeedback({ score: grade.score, lines: grade.detail, hint: hintFor(task, value) });
  };

  const reset = () => {
    setValue(null);
    setChecks(0);
    setFeedback(null);
    setRound((n) => n + 1);
  };

  // A client conversation scores itself on the server when it finishes; there is nothing to Check.
  if (task.kind === "roleplay") {
    return (
      <div className="space-y-6">
        <Badge variant="outline">{TASK_KIND_LABELS[task.kind]}</Badge>
        <TaskView task={task} value={value} onChange={setValue} idPrefix={idPrefix} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Badge variant="outline">{TASK_KIND_LABELS[task.kind]}</Badge>
      <TaskView
        key={round}
        task={task}
        value={value}
        onChange={setValue}
        readOnly={revealed}
        answer={revealed ? task : null}
        idPrefix={idPrefix}
      />

      {feedback && (
        <div
          role="status"
          className={cn(
            "rounded-md border px-4 py-3 text-sm",
            perfect ? "border-summit/50 bg-summit/[0.06]" : "border-border bg-surface-sunken/60",
          )}
        >
          <p className="flex items-center gap-2 font-medium">
            {perfect && <CircleCheck className="h-4 w-4 text-summit-strong" aria-hidden="true" />}
            {feedback.score === null
              ? feedback.lines.length
                ? "The exact parts are checked below; compare the rest with the sample answers and the criteria."
                : "Compare your answer with the sample and the criteria below."
              : perfect
                ? "All correct."
                : `${Math.round(feedback.score * 100)}% right${revealed ? "" : " so far"}.`}
          </p>
          {(revealed ? feedback.lines : feedback.hint).length > 0 && (feedback.score !== null || revealed) && (
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {(revealed ? feedback.lines : feedback.hint).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {!revealed ? (
          <>
            <Button onClick={check} disabled={!hasTaskAnswer(value)}>
              Check
            </Button>
            <span className="font-mono text-xs text-muted-foreground">
              {left} {left === 1 ? "check" : "checks"} left
              {selfCompare ? "" : ", then the answer is shown"}
            </span>
          </>
        ) : (
          <Button variant="outline" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Try it again
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Feedback before the answer is shown: how much is right, never which way it should go — the full
 * `gradeTask` lines name the correct order and values, so they wait for the reveal.
 */
function hintFor(task: Task, value: TaskResponse | null): string[] {
  if (!value || value.kind !== task.kind) return [];
  switch (task.kind) {
    case "rank": {
      const order = (value as Extract<TaskResponse, { kind: "rank" }>).order;
      const right = task.correctOrder.filter((id, i) => order[i] === id).length;
      return [`${right} of ${task.correctOrder.length} in exactly the right place`];
    }
    case "calculate": {
      const values = (value as Extract<TaskResponse, { kind: "calculate" }>).values;
      const right = task.fields.filter((f) => {
        const v = values[f.id];
        return typeof v === "number" && Math.abs(v - f.answer) <= f.tolerance + 1e-9;
      }).length;
      return [`${right} of ${task.fields.length} answers correct`];
    }
    case "scenario": {
      const choices = (value as Extract<TaskResponse, { kind: "scenario" }>).choices;
      const right = task.steps.filter((s) => choices[s.id] === s.correctIndex).length;
      return [`${right} of ${task.steps.length} decisions are the best call`];
    }
    case "spot":
      return gradeTask(task, value).detail;
    case "excel": {
      // The full lines name the expected values, so before the reveal only the count.
      const detail = gradeTask(task, value).detail;
      return [`${detail.filter((d) => d.endsWith("correct")).length} of ${task.checks.length} checked cells right`];
    }
    case "allocate":
      // Totals against capacity and need: nothing the grid does not already show.
      return gradeTask(task, value).detail;
    case "sim": {
      const sim = value as Extract<TaskResponse, { kind: "sim" }>;
      const lines: string[] = [];
      const issues = task.rows.filter((r) => r.issue);
      if (issues.length) {
        const found = issues.filter((r) => sim.flagged.includes(r.id)).length;
        const wrong = sim.flagged.filter((id) => !issues.some((r) => r.id === id)).length;
        lines.push(`${found} of ${issues.length} problem rows flagged${wrong ? `, ${wrong} flagged that ${wrong === 1 ? "was" : "were"} fine` : ""}`);
      }
      if (task.questions.length) {
        const right = task.questions.filter((q) => sim.answers[q.id] === q.correctIndex).length;
        lines.push(`${right} of ${task.questions.length} questions right`);
      }
      return lines;
    }
    case "categorize": {
      const picks = (value as Extract<TaskResponse, { kind: "categorize" }>).picks;
      const right = task.items.filter((i) => picks[i.id] === task.answer[i.id]).length;
      return [`${right} of ${task.items.length} in the right category`];
    }
    default:
      return [];
  }
}
