import type { LearnerTask, Task, TaskResponse } from "@shared/tasks";

import { RichText } from "@/components/content/RichText";

import { AllocateTask } from "./AllocateTask";
import { CalculateTask } from "./CalculateTask";
import { ExcelTask } from "./ExcelTask";
import { RankTask } from "./RankTask";
import { ScenarioTask } from "./ScenarioTask";
import { SimTask } from "./SimTask";
import { SpotTask } from "./SpotTask";
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
}

/** Renders any of the task kinds, controlled. */
export function TaskView({ task, value, onChange, readOnly, answer, idPrefix, hidePrompt }: TaskViewProps) {
  const same = <K extends TaskResponse["kind"]>(kind: K) => (value && value.kind === kind ? (value as ResponseOf<K>) : null);
  const review = <K extends Task["kind"]>(kind: K) => (answer && answer.kind === kind ? (answer as TaskOf<K>) : null);
  const common = { readOnly, idPrefix };

  return (
    <div className="space-y-5">
      {!hidePrompt && <RichText text={task.prompt} size="base" className="max-w-prose" />}
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
    </div>
  );
}

/** Whether a response says anything yet (an untouched rank order does not). */
export function hasTaskAnswer(value: TaskResponse | null): boolean {
  if (!value) return false;
  switch (value.kind) {
    case "write":
      return value.text.trim().length > 0;
    case "rank":
      return value.order.length > 0;
    case "calculate":
      return Object.values(value.values).some((v) => v !== null);
    case "scenario":
      return Object.keys(value.choices).length > 0;
    case "spot":
      return value.marked.length > 0 || value.explanation.trim().length > 0;
    case "excel":
      return Object.values(value.cells).some((v) => v.trim() !== "");
    case "allocate":
      return Object.values(value.hours).some((v) => v > 0);
    case "sim":
      return value.flagged.length > 0 || Object.keys(value.answers).length > 0;
  }
}
