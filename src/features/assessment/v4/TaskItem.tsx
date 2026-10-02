import type { TaskSheetItem } from "@shared/assessmentV4";
import { TASK_KIND_LABELS } from "@shared/tasks";

import { TaskView } from "@/components/tasks/TaskView";
import { Badge } from "@/components/ui/badge";

import type { ItemComponentProps } from "./types";

/** A hands-on task (Write, Rank, Calculate, Scenario, Spot) inside the sheet. No answers, ever. */
export function TaskItem({ assessmentId, item, response, onResponse }: ItemComponentProps<TaskSheetItem>) {
  const value = response && "task" in response ? response.task : null;
  return (
    <div className="space-y-4">
      <Badge variant="outline">{TASK_KIND_LABELS[item.task.kind]}</Badge>
      <TaskView
        task={item.task}
        value={value}
        onChange={(task) => onResponse({ task })}
        readOnly={item.state === "submitted"}
        idPrefix={`item-${item.id}`}
        hidePrompt={item.task.prompt.trim() === item.prompt.trim()}
        assessment={{ assessmentId, itemId: item.id }}
      />
    </div>
  );
}
