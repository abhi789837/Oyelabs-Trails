import { desc, eq } from "drizzle-orm";

import type { AssessmentResultsResponse, FirstStep, GoalLevels, ReviewItem, ReviewVerdict } from "../../../../shared/assessmentResults";
import { SHOW_ITEMS_AFTER_KEY } from "../../../../shared/assessmentResults";
import type { ItemResponseV4, V4Result } from "../../../../shared/assessmentV4";
import { TASK_KIND_LABELS, type TaskKind } from "../../../../shared/tasks";
import { isV4, itemsOf, keyOf } from "../../assessment/v4";
import { currentPath } from "../../builder/repo";
import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import { now } from "../../lib/ids";

/**
 * v5 results (Phase 5): what the learner sees after their test.
 *
 * **Their own questions, after results are out.** v4.4 showed learners levels only, to protect the
 * question library. v5 shows each learner their own questions (prompt, their answer, the verdict,
 * the explanation) once the evaluation exists, behind the admin setting `assessment.show_items_after`
 * (default on). The library is still protected for this learner: `seenItemIds` already keeps every
 * item they were served out of their later tests. What remains is that a learner could pass a
 * question on to a colleague; see DECISIONS Phase 5 for the trade-off.
 */

type ItemRow = ReturnType<typeof itemsOf>[number];

export function showItemsAfter(db: Db): boolean {
  const row = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, SHOW_ITEMS_AFTER_KEY)).get();
  return row?.value !== "off";
}

export function setShowItemsAfter(db: Db, on: boolean): void {
  const value = on ? "on" : "off";
  db.insert(schema.appMeta)
    .values({ key: SHOW_ITEMS_AFTER_KEY, value, updatedAt: now() })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: now() } })
    .run();
}

function feedbackOf(item: ItemRow): Record<string, unknown> | null {
  if (!item.aiFeedback) return null;
  try {
    const parsed = JSON.parse(item.aiFeedback) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function verdictOf(item: ItemRow): ReviewVerdict {
  if (item.verdict === "full" || item.verdict === "not_yet") return item.verdict;
  return "waiting";
}

function explain(item: ItemRow, response: ItemResponseV4 | null): { explanation: string | null; tip: string | null } {
  const key = keyOf(item);
  if (key.mcq) return { explanation: key.mcq.explanation || null, tip: null };
  const detail = feedbackOf(item);
  const tip = typeof detail?.tip === "string" && detail.tip ? detail.tip : null;
  if (typeof detail?.reason === "string" && detail.reason) return { explanation: detail.reason, tip };
  if (Array.isArray(detail?.tests)) {
    const tests = detail.tests as { passed?: boolean }[];
    const passed = tests.filter((t) => t.passed).length;
    return { explanation: `${passed} of ${tests.length} checks passed.`, tip };
  }
  if (typeof detail?.passed === "number" && typeof detail.total === "number") {
    const compile = typeof detail.compileError === "string" && detail.compileError ? ` The code didn't run: ${detail.compileError}` : "";
    return { explanation: `${detail.passed} of ${detail.total} checks passed.${compile}`, tip };
  }
  if (Array.isArray(detail?.lines) && detail.lines.length) return { explanation: (detail.lines as unknown[]).map(String).join(" "), tip };
  if (item.verdictNote) return { explanation: item.verdictNote, tip };
  if (!response) return { explanation: "No answer was given.", tip: null };
  return { explanation: null, tip };
}

function answerTextOf(response: ItemResponseV4 | null): { text: string | null; recorded: boolean } {
  if (!response || "unknown" in response || "choice" in response) return { text: null, recorded: false };
  if ("code" in response) return { text: response.code, recorded: false };
  const t = response.task as Record<string, unknown>;
  if (t.kind === "speak") {
    const typed = typeof t.fallbackText === "string" && t.fallbackText ? t.fallbackText : null;
    return { text: typed, recorded: typeof t.recordingId === "string" };
  }
  if (typeof t.text === "string") return { text: t.text, recorded: false };
  if (Array.isArray(t.order)) return { text: (t.order as unknown[]).map((v, i) => `${i + 1}. ${String(v)}`).join("\n"), recorded: false };
  if (t.values && typeof t.values === "object") {
    return {
      text: Object.entries(t.values as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join("\n"),
      recorded: false,
    };
  }
  return { text: null, recorded: false };
}

export function reviewItems(items: ItemRow[]): ReviewItem[] {
  return items.map((item, index) => {
    const payload = item.payload as { type?: string; prompt?: string; skillName?: string; options?: string[]; task?: { kind?: string } };
    const response = (item.response ?? item.draft ?? null) as ItemResponseV4 | null;
    const key = keyOf(item);
    const type = (payload.type ?? key.type) as ReviewItem["type"];
    const kindLabel = type === "mcq" ? "Multiple choice" : type === "coding" ? "Coding" : (TASK_KIND_LABELS[(payload.task?.kind ?? key.task?.kind) as TaskKind] ?? "Task");
    const unknown = Boolean(response && "unknown" in response);
    const answer = answerTextOf(response);
    const chosen = response && "choice" in response ? response.choice : null;
    const unanswered = !response || (!unknown && chosen === null && !answer.text && !answer.recorded);
    const verdict = verdictOf(item);
    const { explanation, tip } = explain(item, response);
    const reviewStatus = item.reviewStatus ?? null;
    return {
      id: item.id,
      number: index + 1,
      skillName: payload.skillName ?? key.skillName,
      type,
      kindLabel,
      prompt: payload.prompt ?? "",
      options: type === "mcq" ? (payload.options ?? []) : null,
      chosen,
      correct: key.mcq ? key.mcq.correctIndex : null,
      answerText: answer.text,
      recorded: answer.recorded,
      unknown,
      unanswered,
      verdict,
      explanation,
      tip,
      reviewStatus,
      canRequestReview: verdict === "not_yet" && !unknown && !unanswered && reviewStatus === null && item.lockedAt != null,
    };
  });
}

function firstSteps(db: Db, userId: string, content: ContentStore): FirstStep[] {
  const path = currentPath(db, userId, content);
  if (!path) return [];
  return [...path.items]
    .sort((a, b) => a.position - b.position)
    .filter((i) => i.completedCount < Math.max(1, i.topicCount))
    .slice(0, 3)
    .map((i) => ({
      title: i.courseTitle,
      reason: i.reason,
      href: i.courseId && i.available ? `/learn/library/${encodeURIComponent(i.courseId)}` : null,
    }));
}

function goalLevels(db: Db, userId: string, result: V4Result | null): GoalLevels[] {
  const goals = db.select().from(schema.learnerGoals).where(eq(schema.learnerGoals.userId, userId)).all().sort((a, b) => a.position - b.position);
  const mastery = new Map((result?.mastery ?? []).map((m) => [m.skillId, m]));
  const measured = new Map((result?.skills ?? []).map((s) => [s.skillId, s]));
  const names = new Map(db.select({ id: schema.skills.id, name: schema.skills.name }).from(schema.skills).all().map((s) => [s.id, s.name]));
  return goals.map((g) => ({
    id: g.id,
    title: g.outcome,
    targetLevel: g.targetLevel,
    achieved: g.status === "achieved",
    skills: g.skillIds.map((skillId) => {
      const m = mastery.get(skillId);
      const s = measured.get(skillId);
      return {
        skillId,
        name: m?.skillName ?? s?.skillName ?? names.get(skillId) ?? skillId,
        level: m ? m.level : (s?.level ?? null),
        source: m ? m.source : s?.level != null ? ("measured" as const) : null,
      };
    }),
  }));
}

export function buildResults(db: Db, content: ContentStore, userId: string, assessmentId?: string): AssessmentResultsResponse {
  const assessment = assessmentId
    ? db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()
    : db.select().from(schema.assessments).where(eq(schema.assessments.userId, userId)).orderBy(desc(schema.assessments.attemptNo)).get();
  const empty: AssessmentResultsResponse = { assessment: null, released: false, result: null, goals: [], firstSteps: [], items: null, itemsHidden: false };
  if (!assessment || assessment.userId !== userId || !isV4(assessment)) return empty;

  const evaluation = db
    .select()
    .from(schema.evaluations)
    .where(eq(schema.evaluations.assessmentId, assessment.id))
    .orderBy(desc(schema.evaluations.createdAt))
    .get();
  const v4 = (evaluation?.result as V4Result | undefined)?.format === "v4" ? (evaluation!.result as V4Result) : null;
  const released = assessment.status === "completed" && v4 !== null;
  const header = {
    id: assessment.id,
    label: assessment.label ?? null,
    status: assessment.status,
    submittedAt: assessment.submittedAt ?? null,
    finishedSeconds: v4?.finishedSeconds ?? null,
    estSeconds: v4?.estSeconds ?? null,
  };
  if (!released || !v4) return { ...empty, assessment: header };

  const show = showItemsAfter(db);
  return {
    assessment: header,
    released,
    result: {
      // Admin-only numbers (rawScore, score) stay out.
      skills: v4.skills.map((s) => ({ skillId: s.skillId, skillName: s.skillName, level: s.level, asked: s.asked, priority: s.priority })),
      strengths: v4.strengths,
      focusFirst: v4.focusFirst,
      mastery: v4.mastery ?? [],
      missingLinks: v4.missingLinks ?? [],
      metGoals: v4.metGoals ?? [],
    },
    goals: goalLevels(db, userId, v4),
    firstSteps: firstSteps(db, userId, content),
    items: show ? reviewItems(itemsOf(db, assessment.id)) : null,
    itemsHidden: !show,
  };
}
