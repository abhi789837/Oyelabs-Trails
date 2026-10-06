import type { LearnerTask, Task, TaskResponse } from "@shared/tasks";

import { RichText } from "@/components/content/RichText";

import { AllocateTask } from "./AllocateTask";
import { CalculateTask } from "./CalculateTask";
import { CategorizeTask } from "./CategorizeTask";
import { ExcelTask } from "./ExcelTask";
import { FormTask } from "./FormTask";
import { RankTask } from "./RankTask";
import { RoleplayTask } from "./RoleplayTask";
import { ScenarioTask } from "./ScenarioTask";
import { SimTask } from "./SimTask";
import { SpeakTask } from "./SpeakTask";
import { SpotTask } from "./SpotTask";
import { TerminalTask } from "./TerminalTask";
import type { ResponseOf, TaskOf } from "./types";
import { WriteTask } from "./WriteTask";

export interface TaskViewProps {
  task: LearnerTask;
  value: TaskResponse | null;
  onChange: (value: TaskResponse) => void;
  readOnly?: boolean;
  /** The full task with answers: review mode (practice only). */
  answer?: Task | null;
  idPrefix: string;
  /** The caller already rendered this prompt (an assessment item's own prompt). */
  hidePrompt?: boolean;
  /** Inside an assessment sheet: a `roleplay` item's session is tied to this assessment and item. */
  assessment?: { assessmentId: string; itemId: string };
}

/** Renders any of the task kinds, controlled. */
export function TaskView({ task, value, onChange, readOnly, answer, idPrefix, hidePrompt, assessment }: TaskViewProps) {
  const same = <K extends TaskResponse["kind"]>(kind: K) => (value && value.kind === kind ? (value as ResponseOf<K>) : null);
  const review = <K extends Task["kind"]>(kind: K) => (answer && answer.kind === kind ? (answer as TaskOf<K>) : null);
  const common = { readOnly, idPrefix };

  return (
    <div className="space-y-5">
      {!hidePrompt && task.prompt && <RichText text={task.prompt} size="base" className="max-w-prose" />}
      {task.kind === "write" && <WriteTask task={task} value={same("write")} onChange={onChange} answer={review("write")} {...common} />}
      {task.kind === "rank" && <RankTask task={task} value={same("rank")} onChange={onChange} answer={review("rank")} {...common} />}
      {task.kind === "calculate" && (
        <CalculateTask task={task} value={same("calculate")} onChange={onChange} answer={review("calculate")} {...common} />
      )}
      {task.kind === "scenario" && (
        <ScenarioTask task={task} value={same("scenario")} onChange={onChange} answer={review("scenario")} {...common} />
      )}
      {task.kind === "spot" && <SpotTask task={task} value={same("spot")} onChange={onChange} answer={review("spot")} {...common} />}
      {task.kind === "excel" && <ExcelTask task={task} value={same("excel")} onChange={onChange} answer={review("excel")} {...common} />}
      {task.kind === "allocate" && (
        <AllocateTask task={task} value={same("allocate")} onChange={onChange} answer={review("allocate")} {...common} />
      )}
      {task.kind === "sim" && <SimTask task={task} value={same("sim")} onChange={onChange} answer={review("sim")} {...common} />}
      {task.kind === "categorize" && (
        <CategorizeTask task={task} value={same("categorize")} onChange={onChange} answer={review("categorize")} {...common} />
      )}
      {task.kind === "form" && <FormTask task={task} value={same("form")} onChange={onChange} answer={review("form")} {...common} />}
      {task.kind === "roleplay" && (
        <RoleplayTask task={task} value={same("roleplay")} onChange={onChange} answer={review("roleplay")} assessment={assessment} {...common} />
      )}
      {task.kind === "terminal" && (
        <TerminalTask task={task} value={same("terminal")} onChange={onChange} answer={review("terminal")} {...common} />
      )}
      {task.kind === "speak" && (
        <SpeakTask task={task} value={same("speak")} onChange={onChange} answer={review("speak")} assessment={assessment} {...common} />
      )}
    </div>
  );
}

/* Moved to its own module (v5 Phase 9 performance) so a caller can check an answer without importing
   every task kind; re-exported so existing imports are unchanged. */
export { hasTaskAnswer } from "./taskAnswer";
