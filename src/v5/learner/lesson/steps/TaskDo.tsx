import { useId, useState } from "react";
import { CheckCheck, RotateCcw } from "lucide-react";

import { DO_MAX_ATTEMPTS } from "@shared/lessonCore";
import { TASK_KIND_LABELS, gradeTask, type Task, type TaskResponse } from "@shared/tasks";

import { hasTaskAnswer, TaskView } from "@/components/tasks/TaskView";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/v5/design/components/Button";
import { FeedbackPanel, StatusLine } from "@/v5/design/components/Lesson";
import { Badge } from "@/v5/design/components/Primitives";
import { SplitView } from "@/v5/design/components/SplitView";

import { LessonMarkdown } from "../LessonRich";

export interface TaskDoProps {
  task: Task;
  done: boolean;
  /** Checks run so far in this lesson (kept in the lesson state). */
  attempts: number;
  traded: boolean;
  onChecked: (passed: boolean, attempts: number) => void;
  /** The learner asked for the worked answer before their third check: half the step's points. */
  onTrade: () => void;
  /** Kinds with no automatic check (a role-play): the learner says when they're done. */
  onSelfDone: () => void;
}

/**
 * A hands-on Do step (writing, ranking, spreadsheets, role-play and the other task kinds), in the
 * same split layout as coding: the task on the left, the work area and feedback on the right.
 * Checked in the browser with `gradeTask` (practice is formative). After three checks, or a perfect
 * one, the worked answer is shown.
 */
export default function TaskDo({ task, done, attempts: initialAttempts, traded, onChecked, onTrade, onSelfDone }: TaskDoProps) {
  const idPrefix = useId().replace(/:/g, "");
  const [value, setValue] = useState<TaskResponse | null>(null);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [feedback, setFeedback] = useState<{ score: number | null; detail: string[] } | null>(null);
  const [round, setRound] = useState(0);
  const [confirmTrade, setConfirmTrade] = useState(false);
  const [revealedEarly, setRevealedEarly] = useState(traded);

  const selfCompare = task.kind === "write" || task.kind === "form";
  const perfect = feedback?.score === 1;
  const revealed = revealedEarly || attempts >= DO_MAX_ATTEMPTS || perfect || (selfCompare && attempts > 0);
  const left = Math.max(0, DO_MAX_ATTEMPTS - attempts);
  const prompt = (task as { prompt?: string }).prompt ?? "";

  const check = () => {
    if (revealed || !hasTaskAnswer(value)) return;
    const grade = gradeTask(task, value);
    const n = attempts + 1;
    setAttempts(n);
    setFeedback({ score: grade.score, detail: grade.detail });
    onChecked(grade.score === 1 || (selfCompare && grade.score === null), n);
  };

  const verdict = !feedback ? null : feedback.score === null ? "almost" : feedback.score === 1 ? "pass" : feedback.score >= 0.6 ? "almost" : "fail";

  const leftPane = (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Badge tone="brand">{TASK_KIND_LABELS[task.kind]}</Badge>
      </div>
      <section aria-labelledby="task-prompt">
        <h2 id="task-prompt" className="font-display text-h4 font-semibold text-fg-1">
          Your task
        </h2>
        {prompt ? <LessonMarkdown text={prompt} className="mt-2 text-small text-fg-1" /> : null}
      </section>
      {task.kind === "roleplay" ? (
        <p className="text-small text-fg-2">This is a conversation. It's marked when you finish it; when you're done, mark the step as done.</p>
      ) : (
        <p className="text-small text-fg-2">
          Check your answer up to {DO_MAX_ATTEMPTS} times. After that, or a perfect check, we show the worked answer.
        </p>
      )}
      {!revealed && task.kind !== "roleplay" ? (
        <section aria-label="See the answer early" className="rounded-card border border-line-1 bg-surface-1 p-3">
          {confirmTrade ? (
            <div className="flex flex-col gap-2">
              <p className="text-small text-fg-1">Seeing the answer now halves the points for this step (5 instead of 10). The step then counts as done.</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setRevealedEarly(true);
                    setConfirmTrade(false);
                    onTrade();
                  }}
                >
                  Show the answer for half the points
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmTrade(false)}>
                  Keep trying
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirmTrade(true)}>
              See the answer now
            </Button>
          )}
        </section>
      ) : null}
    </div>
  );

  const rightPane = (
    <div className="flex flex-col gap-4 p-4">
      {/* Some task kinds use the older Radix tooltips, which need a provider (V5App has none). */}
      <TooltipProvider delayDuration={150}>
        <TaskView key={round} task={task} value={value} onChange={setValue} readOnly={revealed} answer={revealed ? task : null} idPrefix={idPrefix} hidePrompt />
      </TooltipProvider>
      {task.kind === "roleplay" ? (
        <div>
          <Button variant="primary" onClick={onSelfDone} disabled={done}>
            <CheckCheck aria-hidden="true" /> {done ? "Done" : "I've finished the conversation"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {!revealed ? (
            <>
              <Button variant="primary" onClick={check} disabled={!hasTaskAnswer(value)}>
                Check
              </Button>
              <span className="text-caption text-fg-2">
                {left} {left === 1 ? "check" : "checks"} left
              </span>
            </>
          ) : (
            <Button
              onClick={() => {
                setValue(null);
                setFeedback(null);
                setRound((n) => n + 1);
                setRevealedEarly(false);
                setAttempts(0);
              }}
            >
              <RotateCcw aria-hidden="true" /> Try it again
            </Button>
          )}
        </div>
      )}
      {verdict && feedback ? (
        <FeedbackPanel
          verdict={verdict}
          right={feedback.score !== null ? [`${Math.round(feedback.score * 100)}% right${revealed ? "" : " so far"}`] : ["Compare your answer with the sample below."]}
          fix={revealed ? feedback.detail.filter((d) => !/correct$/i.test(d)).slice(0, 5) : []}
          why={revealed ? "The worked answer is shown in the task. Compare it with yours." : "Look again at the parts you weren't sure of, then check again."}
        />
      ) : null}
      {revealedEarly && !feedback ? <StatusLine tone="info">The worked answer is shown in the task above.</StatusLine> : null}
    </div>
  );

  return <SplitView id="v5-lesson-task" left={leftPane} right={rightPane} leftLabel="Task" rightLabel="Your answer" className="min-h-[28rem]" />;
}
