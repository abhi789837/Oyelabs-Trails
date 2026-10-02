import type { ItemResponseV4, SheetItem, V4Result } from "@shared/assessmentV4";
import type { Personalisation } from "@shared/personalise";
import { parseRef } from "@shared/sheet";
import type { LearnerTask, Task, TaskResponse } from "@shared/tasks";

import { allocationTotals, allocKey } from "@/components/tasks/allocation";
import { evaluateWithEntries, formatCellValue } from "@/components/tasks/sheetGrid";
import { estMinutes, formatCostMicros } from "@/lib/timing";

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
  /** v4.1: the designed time for this item, seconds (from the payload). */
  estSeconds?: number | null;
  /** v4.1: where it came from. Only present once the admin route exposes it. */
  origin?: ItemOrigin | null;
  /** v4.1: time the learner actually spent on it. Only present once the admin route exposes it. */
  activeMs?: number | null;
};

export type ItemOrigin = "bank" | "generated" | "fallback";

/** Mirror of `PersonaliseReport` (server/src/assessment/personalise/pipeline.ts). */
export interface PersonaliseReport {
  level: Personalisation;
  understandingSource: "ai" | "rules";
  intent: string[];
  themes: string[];
  reused: number;
  generated: number;
  fromBankAfterFailures: number;
  regenerations: number;
  rejected: { slot: number; reason: string }[];
  estSeconds: number;
  fallbackReason: string | null;
  costMicros: number;
}

export interface V4Shortfall {
  skillId: string;
  type: string;
  missing: number;
}

export interface V4Detail {
  config: { format: "v4"; shortfalls?: V4Shortfall[]; personalisation?: PersonaliseReport } & Record<string, unknown>;
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
    case "excel": {
      if (task.kind !== "excel") return Object.entries(response.cells).filter(([, v]) => v.trim()).map(([ref, v]) => `${ref}: ${v}`);
      const { values } = evaluateWithEntries(task.grid, task.editable, response.cells);
      return task.editable.map((ref) => {
        const raw = (response.cells[ref] ?? "").trim();
        if (!raw) return `${ref}: blank`;
        const at = parseRef(ref);
        const shown = at ? formatCellValue(values[at.row]?.[at.col] ?? null) : "";
        return raw.startsWith("=") ? `${ref}: ${raw} → ${shown || "(empty)"}` : `${ref}: ${raw}`;
      });
    }
    case "allocate": {
      if (task.kind !== "allocate") return Object.entries(response.hours).filter(([, v]) => v > 0).map(([k, v]) => `${k}: ${v} h`);
      const totals = allocationTotals(task, response.hours);
      return task.people.map((person, i) => {
        const parts = task.projects
          .map((p) => ({ name: p.name, h: response.hours[allocKey(person.id, p.id)] ?? 0 }))
          .filter((x) => x.h > 0)
          .map((x) => `${x.name} ${x.h} h`);
        const t = totals.people[i];
        return `${person.name}: ${parts.length ? parts.join(", ") : "nothing"} (${t.sum}/${t.capacity} h${t.over ? ", over" : ""})`;
      });
    }
    case "sim": {
      if (task.kind !== "sim") return [`Flagged ${response.flagged.length} row(s)`, ...Object.entries(response.answers).map(([q, a]) => `${q}: option ${a + 1}`)];
      const rowName = new Map(task.rows.map((r) => [r.id, r.cells.filter(Boolean).slice(0, 2).join(" · ")]));
      const lines = [`Flagged ${response.flagged.length} of ${task.rows.length} row${task.rows.length === 1 ? "" : "s"}.`];
      lines.push(...response.flagged.map((id) => `• ${rowName.get(id) ?? id}`));
      for (const q of task.questions) {
        const a = response.answers[q.id];
        lines.push(`${q.question} → ${a === undefined ? "no answer" : (q.options[a] ?? `option ${a + 1}`)}`);
      }
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
    case "excel":
      return Object.entries(task.solution).map(([ref, v]) => `${ref}: ${v}`);
    case "allocate": {
      const slack = Math.round(task.slack * 100);
      return [
        ...task.projects.map((p) => `${p.name}: ${p.need} h${slack ? ` (up to ${Math.round(p.need * (1 + task.slack) * 10) / 10} h)` : ""}`),
        ...task.people.map((p) => `${p.name}: at most ${p.capacity} h`),
        ...task.blocked.map((b) => `${task.people.find((p) => p.id === b.person)?.name ?? b.person} not on ${task.projects.find((p) => p.id === b.project)?.name ?? b.project}`),
      ];
    }
    case "sim":
      return [
        ...task.rows.filter((r) => r.issue).map((r) => `Flag: ${r.cells.filter(Boolean).slice(0, 2).join(" · ")} — ${r.issue}`),
        ...task.questions.map((q) => `${q.question} → ${q.options[q.correctIndex]}`),
      ];
  }
}

/** Shortfalls as "AWS · coding · 2 missing", with the skill's name where the result knows it. */
export function describeShortfalls(shortfalls: readonly V4Shortfall[], result: Pick<V4Result, "skills">): string[] {
  const names = new Map(result.skills.map((s) => [s.skillId, s.skillName]));
  return shortfalls.map((s) => `${names.get(s.skillId) ?? s.skillId} · ${s.type} · ${s.missing} missing`);
}

// ---------------------------------------------------------------------------
// v4.1: the header line, the personalisation summary, per-item origin
// ---------------------------------------------------------------------------

const STATUS_WORDS: Record<string, string> = {
  generating: "Writing the assessment…",
  ready: "Assessment ready",
  in_progress: "In progress",
  submitted: "Submitted",
  evaluating: "Being graded",
  completed: "Completed",
  terminated: "Ended early",
  awaiting_approval: "Awaiting approval",
  failed: "Failed",
};

/** The designed length: the report's total, else the sum of the items' estimates. */
export function designedSeconds(detail: Pick<V4Detail, "config" | "items">): number {
  const fromItems = detail.items.reduce((sum, item) => sum + (item.estSeconds ?? 0), 0);
  return fromItems || detail.config.personalisation?.estSeconds || 0;
}

/** "Assessment ready · 25 items · est. 29 min · AI cost $0.03". */
export function assessmentHeadline(input: { status: string; items: number; estSeconds: number; costMicros: number | null | undefined }): string {
  if (input.status === "generating") return STATUS_WORDS.generating;
  const parts = [STATUS_WORDS[input.status] ?? input.status.replace(/_/g, " ")];
  if (input.items > 0) parts.push(`${input.items} item${input.items === 1 ? "" : "s"}`);
  const est = estMinutes(input.estSeconds);
  if (est) parts.push(est);
  if (input.costMicros !== null && input.costMicros !== undefined) parts.push(`AI cost ${formatCostMicros(input.costMicros)}`);
  return parts.join(" · ");
}

/** "13 written for them · 12 reused from the bank · 2 from the bank after failed checks". */
export function personalisationCounts(report: PersonaliseReport): string {
  const parts: string[] = [];
  parts.push(`${report.generated} written for them`);
  parts.push(`${report.reused} reused from the bank`);
  if (report.fromBankAfterFailures > 0) parts.push(`${report.fromBankAfterFailures} from the bank after failed checks`);
  return parts.join(" · ");
}

export const ORIGIN_LABELS: Record<ItemOrigin, string> = { bank: "bank", generated: "generated", fallback: "fallback" };

/** Swap and Regenerate are for questions the learner has not submitted, on a sheet still open. */
export function canReplace(status: string, item: Pick<V4AdminItem, "state">): boolean {
  return (status === "ready" || status === "in_progress") && item.state !== "submitted";
}
