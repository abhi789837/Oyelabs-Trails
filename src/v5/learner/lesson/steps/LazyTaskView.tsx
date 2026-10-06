import { lazy, Suspense, type ComponentType } from "react";

import type { LearnerTask, Task, TaskKind, TaskResponse } from "@shared/tasks";

import type { ResponseOf, TaskOf } from "@/components/tasks/types";
import { Skeleton } from "@/v5/design/components/States";

/**
 * The v5 Do step's task area: the same components as the shared `TaskView`, but each task kind is
 * its own lazy chunk, so a lesson downloads only the kind it uses (Phase 9 performance: the
 * spreadsheet grid alone is about 90 KB gzipped). `TaskView` itself is unchanged for the old UI and
 * the assessment. The prompt is rendered by the caller (TaskDo), as with `hidePrompt`.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each kind's props differ; the switch below pairs them.
type AnyTaskComponent = ComponentType<any>;

const kind = (load: () => Promise<Record<string, unknown>>, name: string) =>
  lazy(() => load().then((mod) => ({ default: mod[name] as AnyTaskComponent })));

const KINDS: Record<TaskKind, AnyTaskComponent> = {
  write: kind(() => import("@/components/tasks/WriteTask"), "WriteTask"),
  rank: kind(() => import("@/components/tasks/RankTask"), "RankTask"),
  calculate: kind(() => import("@/components/tasks/CalculateTask"), "CalculateTask"),
  scenario: kind(() => import("@/components/tasks/ScenarioTask"), "ScenarioTask"),
  spot: kind(() => import("@/components/tasks/SpotTask"), "SpotTask"),
  excel: kind(() => import("@/components/tasks/ExcelTask"), "ExcelTask"),
  allocate: kind(() => import("@/components/tasks/AllocateTask"), "AllocateTask"),
  sim: kind(() => import("@/components/tasks/SimTask"), "SimTask"),
  categorize: kind(() => import("@/components/tasks/CategorizeTask"), "CategorizeTask"),
  form: kind(() => import("@/components/tasks/FormTask"), "FormTask"),
  roleplay: kind(() => import("@/components/tasks/RoleplayTask"), "RoleplayTask"),
  terminal: kind(() => import("@/components/tasks/TerminalTask"), "TerminalTask"),
  speak: kind(() => import("@/components/tasks/SpeakTask"), "SpeakTask"),
};

export interface LazyTaskViewProps {
  task: LearnerTask;
  value: TaskResponse | null;
  onChange: (value: TaskResponse) => void;
  readOnly?: boolean;
  answer?: Task | null;
  idPrefix: string;
}

export function LazyTaskView({ task, value, onChange, readOnly, answer, idPrefix }: LazyTaskViewProps) {
  const Component = KINDS[task.kind];
  const same = value && value.kind === task.kind ? (value as ResponseOf<typeof task.kind>) : null;
  const review = answer && answer.kind === task.kind ? (answer as TaskOf<typeof task.kind>) : null;
  return (
    <div className="space-y-5">
      <Suspense
        fallback={
          <div className="space-y-3" role="status" aria-label="Loading the task">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        }
      >
        <Component task={task} value={same} onChange={onChange} answer={review} readOnly={readOnly} idPrefix={idPrefix} />
      </Suspense>
    </div>
  );
}
