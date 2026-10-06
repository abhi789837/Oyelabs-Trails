import { speakAnswered, type TaskResponse } from "@shared/tasks";

/**
 * Whether a task response says anything yet. Pure, and apart from `TaskView` so that checking an
 * answer doesn't pull in every task kind's component (v5 Phase 9 performance). An untouched rank
 * order says nothing yet.
 */
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
    case "categorize":
      return Object.keys(value.picks).length > 0;
    case "form":
      return Object.values(value.values).some((v) => v.trim() !== "");
    case "roleplay":
      return value.transcript.some((turn) => turn.role === "pm" && turn.text.trim() !== "");
    case "terminal":
      return value.commands.length > 0 || Object.keys(value.files).length > 0;
    case "speak":
      return speakAnswered(value);
  }
}
