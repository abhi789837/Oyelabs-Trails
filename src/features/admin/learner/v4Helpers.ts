import type { ItemResponseV4, SheetItem, V4Result } from "@shared/assessmentV4";
import type { LearnerTask, Task, TaskResponse } from "@shared/tasks";

/**
 * Pure helpers for the admin's view of a v4 sitting (`GET /api/admin/assessments/:id/v4`).
 */

/** One question as the admin route returns it: the sheet item plus the answer, key and score. */
export type V4AdminItem = SheetItem & {
  difficulty: number;
  bankItemId: string | null;
  response: ItemResponseV4 | null;
  /** 0..1 with partial credit; null until graded (a written task waits for its rubric). */
  score: number | null;
  /** Grader notes: rubric feedback as text, or the auto-grader's detail as JSON. */
  feedback: string | null;
  answer: { correctIndex: number; explanation: string } | { task: Task } | null;
};

export interface V4Shortfall {
  skillId: string;
  type: string;
  missing: number;
}

export interface V4Detail {
  config: { format: "v4"; shortfalls?: V4Shortfall[] } & Record<string, unknown>;
  result: V4Result;
  items: V4AdminItem[];
}

/** "75%", "pending" for a submitted item still waiting on a grade, "not submitted" otherwise. */
export function formatItemScore(score: number | null, state: SheetItem["state"]): string {
  if (score === null) return state === "submitted" ? "pending" : "not submitted";
  return `${Math.round(Math.max(0, Math.min(1, score)) * 100)}%`;
}

/**
 * Grader notes as readable lines. The auto-grader stores its detail as JSON (tests passed, "I don't
 * know yet", per-part task notes); the rubric grader stores plain text. Unknown JSON falls back to
 * the raw string rather than being hidden.
 */
export function describeFeedback(feedback: string | null): string[] {
  if (!feedback || !feedback.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(feedback);
  } catch {
    return [feedback.trim()];
  }
  if (Array.isArray(parsed)) return parsed.map(String);
  if (!parsed || typeof parsed !== "object") return [feedback.trim()];
  const detail = parsed as Record<string, unknown>;
  const lines: string[] = [];
  if (detail.unknown === true) lines.push("Answered \"I don't know yet\".");
  if (detail.unknown === false) lines.push("No answer was submitted.");
  if (typeof detail.passed === "number" && typeof detail.total === "number") {
    lines.push(`${detail.passed} of ${detail.total} hidden tests passed.`);
  }
  if (typeof detail.compileError === "string" && detail.compileError) lines.push(`Compile error: ${detail.compileError}`);
  if (detail.timedOut === true) lines.push("The run timed out.");
  if (typeof detail.runnerUnavailable === "string") lines.push(`Not graded: ${detail.runnerUnavailable}`);
  if (detail.mismatched === true) lines.push("The answer did not match the question type.");
  if (Array.isArray(detail.lines)) lines.push(...detail.lines.map(String));
  return lines.length ? lines : [feedback.trim()];
}

/** What the learner did on a task, one short line per part. */
export function summariseTaskResponse(task: LearnerTask, response: TaskResponse): string[] {
  switch (response.kind) {
    case "write": {
      const words = response.text.trim().split(/\s+/).filter(Boolean).length;
      return [`${words} word${words === 1 ? "" : "s"} written.`];
    }
    case "rank": {
      if (task.kind !== "rank") return [];
      const label = new Map(task.items.map((i) => [i.id, i.label]));
      return response.order.map((id, n) => `${n + 1}. ${label.get(id) ?? id}`);
    }
    case "calculate": {
      if (task.kind !== "calculate") return [];
      return task.fields.map((field) => {
        const value = response.values[field.id];
        return `${field.label}: ${value === null || value === undefined ? "blank" : `${value}${field.unit ? ` ${field.unit}` : ""}`}`;
      });
    }
    case "scenario": {
      if (task.kind !== "scenario") return [];
      return task.steps.map((step) => {
        const choice = response.choices[step.id];
        return `${step.question} → ${choice === undefined ? "no answer" : (step.options[choice] ?? `option ${choice + 1}`)}`;
      });
    }
    case "spot": {
      if (task.kind !== "spot") return [];
      const text = new Map(task.segments.map((s) => [s.id, s.text]));
      const lines = [`Marked ${response.marked.length} segment${response.marked.length === 1 ? "" : "s"}.`];
      lines.push(...response.marked.map((id) => `• ${text.get(id) ?? id}`));
      if (response.explanation.trim()) lines.push(`Why: ${response.explanation.trim()}`);
      return lines;
    }
  }
}

/** The key for a task, where it has one a person can read at a glance. Written tasks have a rubric instead. */
export function expectedTaskAnswer(task: Task): string[] {
  switch (task.kind) {
    case "rank": {
      const label = new Map(task.items.map((i) => [i.id, i.label]));
      return task.correctOrder.map((id, n) => `${n + 1}. ${label.get(id) ?? id}`);
    }
    case "calculate":
      return task.fields.map((f) => `${f.label}: ${f.answer}${f.unit ? ` ${f.unit}` : ""} (±${f.tolerance})`);
    case "scenario":
      return task.steps.map((s) => `${s.question} → ${s.options[s.correctIndex] ?? `option ${s.correctIndex + 1}`}`);
    case "spot":
      return task.segments.filter((s) => s.issue).map((s) => `• ${s.text} — ${s.issue}`);
    case "write":
      return task.rubric.map((r) => `${r.label} (×${r.weight})`);
  }
}

/** Shortfalls as "AWS · coding · 2 missing", with the skill's name where the result knows it. */
export function describeShortfalls(shortfalls: readonly V4Shortfall[], result: Pick<V4Result, "skills">): string[] {
  const names = new Map(result.skills.map((s) => [s.skillId, s.skillName]));
  return shortfalls.map((s) => `${names.get(s.skillId) ?? s.skillId} · ${s.type} · ${s.missing} missing`);
}
