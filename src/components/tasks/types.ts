import type { LearnerTask, Task, TaskKind, TaskResponse } from "@shared/tasks";

export type LearnerTaskOf<K extends TaskKind> = Extract<LearnerTask, { kind: K }>;
export type TaskOf<K extends TaskKind> = Extract<Task, { kind: K }>;
export type ResponseOf<K extends TaskKind> = Extract<TaskResponse, { kind: K }>;

/**
 * Every task component is controlled: the parent owns the response (an assessment autosaves it, a
 * practice section checks it). `answer` switches on review mode — the full task with its answers,
 * shown after a practice check. Never passed during an assessment.
 */
export interface TaskComponentProps<K extends TaskKind> {
  task: LearnerTaskOf<K>;
  value: ResponseOf<K> | null;
  onChange: (value: ResponseOf<K>) => void;
  readOnly?: boolean;
  answer?: TaskOf<K> | null;
  /** Unique per rendered task, for ids and labels. */
  idPrefix: string;
}
