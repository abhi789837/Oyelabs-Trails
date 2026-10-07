import { and, eq } from "drizzle-orm";

import type { SessionUser } from "../../../../shared/auth";
import { QUIZ_PASS_THRESHOLD } from "../../../../shared/contentConstants";
import {
  citationLabel,
  type GradedModuleTest,
  type ModuleTestItemInput,
  type ModuleTestItemView,
  type ModuleTestView,
  type ServedModuleTest,
} from "../../../../shared/moduleTests";
import type { TestItemGates, TopicGroundingContent } from "../../../../shared/topicTests";
import { isStaffRole } from "../../../../shared/uiFlag";
import type { AuthoredTopic, ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import { badRequest, conflict, notFound } from "../../lib/errors";
import { newId, now } from "../../lib/ids";
import { calibrateAttempt, previouslyAnswered } from "../../topicTests/calibrate";
import { formatProblems, keyIndices } from "../../topicTests/gates";
import { citationProblem } from "../../topicTests/grounding";
import { editPayload } from "../../topicTests/repo";
import { syncCertificates } from "../../v5/certificates/repo";
import { assertModuleVideosWatched, modulePlaylist, type ModuleLesson } from "../media/tracking";
import {
  getTestRow,
  insertItem,
  itemPayload,
  moduleItems,
  refreshSummary,
  retireItem,
  type ItemRow,
  type ModuleItemPayload,
} from "./generate";
import { moduleContext, type ModuleContext } from "./sources";

/**
 * Module tests in the database (v4.5 Phase 3): the admin preview and edits, the served test (never
 * any keys) and grading. Items are v4.3 `topic_test_items` keyed by the module's managed lesson.
 */

function groundingOf(db: Db, topicId: string): TopicGroundingContent | null {
  const row = db.select().from(schema.topicGrounding).where(eq(schema.topicGrounding.topicId, topicId)).get();
  return row ? (row.content as unknown as TopicGroundingContent) : null;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export function adminContext(db: Db, sectionId: string): ModuleContext {
  const ctx = moduleContext(db, sectionId);
  if (!ctx) throw notFound("No such module. Save the course first.");
  return ctx;
}

const GATE_WORDS: Record<string, string> = {
  format: "The question's format",
  relevanceCode: "The quote",
  relevanceAi: "The material doesn't clearly support the answer",
  answerable: "The answer can't be found from the material alone",
  notTrivial: "It can be answered without the material",
  distractors: "The wrong answers",
  size: "The length",
  testLevel: "Too many right answers are the longest option",
};

function gateNotes(gates: TestItemGates | null): string[] {
  if (!gates || gates.passed) return [];
  return gates.failures.slice(0, 4).map((f) => {
    const [name, ...rest] = f.split(":");
    return `${GATE_WORDS[name.trim()] ?? name}: ${rest.join(":").trim()}`.slice(0, 300);
  });
}

export function itemView(row: ItemRow): ModuleTestItemView {
  const p = itemPayload(row);
  const citation = p.moduleCitation ?? null;
  return {
    id: row.id,
    origin: p.moduleOrigin === "admin" ? "admin" : "generated",
    status: row.status,
    kind: p.moduleKind ?? "scenario",
    prompt: p.prompt,
    options: p.options,
    correctIndices: keyIndices(p),
    explanation: p.explanation,
    citation,
    citationLabel: citation ? citationLabel(citation) : null,
    gateNotes: gateNotes(row.gates as unknown as TestItemGates | null),
  };
}

export function moduleTestView(db: Db, ctx: ModuleContext): ModuleTestView {
  const row = getTestRow(db, ctx.section.id);
  const items = moduleItems(db, ctx.topic.id, ["active", "flagged", "draft"]).map(itemView);
  return {
    sectionId: ctx.section.id,
    topicId: ctx.topic.id,
    courseId: ctx.course.id,
    status: row?.status ?? "empty",
    summary: row?.summary || (row?.status === "gathering" || row?.status === "generating" ? "Writing questions from this module's material…" : "Questions are written when you save the course."),
    sources: row?.sourceSummary ?? { docs: 0, videos: 0, notes: false, skipped: [] },
    items,
    stale: Boolean(row && row.generatedHash && row.contentHash && row.generatedHash !== row.contentHash),
    generatedAt: row?.generatedAt ?? null,
  };
}

const DEFAULT_ADMIN_EXPLANATION = "This is the answer the course admin marked as right.";

function checkCitation(db: Db, topicId: string, input: ModuleTestItemInput): ModuleItemPayload["moduleCitation"] {
  if (!input.citation) return null;
  const grounding = groundingOf(db, topicId);
  const problem = grounding ? citationProblem(grounding, input.citation) : "no material yet";
  if (problem) throw badRequest("That quote isn't in this module's material. Copy it exactly, or leave the source empty.", { citation: "Copy the quote exactly from the material." });
  return input.citation;
}

function payloadFrom(input: ModuleTestItemInput, base: Partial<ModuleItemPayload>, citation: ModuleItemPayload["moduleCitation"]): ModuleItemPayload {
  const keys = [...new Set(input.correctIndices)].sort((a, b) => a - b);
  const payload: ModuleItemPayload = {
    ...(base as ModuleItemPayload),
    prompt: input.prompt,
    options: input.options,
    correctIndex: keys[0],
    explanation: input.explanation || DEFAULT_ADMIN_EXPLANATION,
    citation: citation ? { passageId: citation.passageId, quote: citation.quote } : null,
    moduleKind: input.kind,
    moduleCitation: citation,
    moduleOrigin: base.moduleOrigin ?? "admin",
    generation: base.generation ?? 0,
  };
  if (keys.length > 1) payload.correctIndices = keys;
  else delete payload.correctIndices;
  return payload;
}

function assertFormat(payload: ModuleItemPayload): void {
  const problems = formatProblems(payload);
  if (problems.length) throw badRequest(`Not saved: ${problems.join("; ")}.`);
}

export function addAdminItem(db: Db, ctx: ModuleContext, input: ModuleTestItemInput): ModuleTestItemView {
  const citation = checkCitation(db, ctx.topic.id, input);
  const payload = payloadFrom(input, { moduleOrigin: "admin", editedAt: now() }, citation);
  assertFormat(payload);
  const id = insertItem(db, ctx.topic.id, payload, null, null);
  ensureTestRowForEdit(db, ctx);
  refreshSummary(db, ctx.section.id);
  return itemView(db.select().from(schema.topicTestItems).where(eq(schema.topicTestItems.id, id)).get()!);
}

function itemOf(db: Db, ctx: ModuleContext, itemId: string): ItemRow {
  const row = db.select().from(schema.topicTestItems).where(eq(schema.topicTestItems.id, itemId)).get();
  if (!row || row.topicId !== ctx.topic.id || row.status === "retired") throw notFound("No such question.");
  return row;
}

/** Edit: a new version of the item, so its stats start again (v4.3). The admin owns it from now on. */
export function editAdminItem(db: Db, ctx: ModuleContext, itemId: string, input: ModuleTestItemInput): ModuleTestItemView {
  const row = itemOf(db, ctx, itemId);
  const old = itemPayload(row);
  const citation = input.citation ? checkCitation(db, ctx.topic.id, input) : old.moduleCitation;
  const edited = editPayload(old, { prompt: input.prompt, options: input.options, correctIndices: input.correctIndices, explanation: input.explanation || old.explanation || DEFAULT_ADMIN_EXPLANATION });
  const next: ModuleItemPayload = {
    ...(edited as ModuleItemPayload),
    moduleKind: input.kind,
    moduleCitation: citation ?? null,
    citation: citation ? { passageId: citation.passageId, quote: citation.quote } : null,
  };
  assertFormat(next);
  db.update(schema.topicTestItems)
    .set({ item: next as unknown as Record<string, unknown>, attempts: 0, passes: 0, strongAttempts: 0, strongFails: 0, flagReason: null, status: "active", updatedAt: now() })
    .where(eq(schema.topicTestItems.id, row.id))
    .run();
  refreshSummary(db, ctx.section.id);
  return itemView(db.select().from(schema.topicTestItems).where(eq(schema.topicTestItems.id, row.id)).get()!);
}

/** Remove = retire: past attempts keep pointing at it. */
export function removeAdminItem(db: Db, ctx: ModuleContext, itemId: string): void {
  const row = itemOf(db, ctx, itemId);
  retireItem(db, row.id, "removed by an admin");
  refreshSummary(db, ctx.section.id);
}

function ensureTestRowForEdit(db: Db, ctx: ModuleContext): void {
  if (getTestRow(db, ctx.section.id)) return;
  db.insert(schema.courseModuleTests).values({ sectionId: ctx.section.id, courseId: ctx.course.id, topicId: ctx.topic.id, updatedAt: now() }).onConflictDoNothing().run();
}

// ---------------------------------------------------------------------------
// Learner
// ---------------------------------------------------------------------------

export function servedTest(db: Db, user: SessionUser, lesson: ModuleLesson): ServedModuleTest {
  const items = moduleItems(db, lesson.topicId, ["active"]).map((row) => {
    const p = itemPayload(row);
    return { id: row.id, prompt: p.prompt, options: p.options, multi: keyIndices(p).length > 1 };
  });
  return { topicId: lesson.topicId, items, passPercent: QUIZ_PASS_THRESHOLD, locked: modulePlaylist(db, user, lesson).locked };
}

/**
 * The calibration code takes a curriculum topic; for a module lesson only the id matters. It is
 * given `challengeType: "code"` so a retirement never queues a v4.3 `topic_tests.fill` for a lesson
 * that isn't in the curriculum (module tests are refilled by Regenerate).
 */
function calibrationTopic(topicId: string): AuthoredTopic {
  return { id: topicId, challengeType: "code", level: "intermediate", quiz: [] } as unknown as AuthoredTopic;
}

function sameSet(a: number[], b: number[]): boolean {
  const x = [...new Set(a)].sort((p, q) => p - q);
  const y = [...new Set(b)].sort((p, q) => p - q);
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

export function gradeModuleTest(db: Db, content: ContentStore, user: SessionUser, lesson: ModuleLesson, answers: Record<string, number[]>): GradedModuleTest {
  assertModuleVideosWatched(db, user, lesson.topicId);
  const all = moduleItems(db, lesson.topicId);
  // Every live item, plus any retired one the learner answered (it was live when they loaded the test).
  const rows = all.filter((r) => r.status === "active" || (r.id in answers && r.status !== "draft"));
  if (rows.length === 0) throw conflict("This module's test isn't ready yet. Check back soon.");

  const results = rows.map((row) => {
    const p = itemPayload(row);
    const keys = keyIndices(p);
    const correct = sameSet(answers[row.id] ?? [], keys);
    return {
      row,
      correct,
      result: {
        itemId: row.id,
        verdict: correct ? ("full" as const) : ("not_yet" as const),
        correctIndices: keys,
        explanation: p.explanation,
        source: p.moduleCitation ? citationLabel(p.moduleCitation) : null,
      },
    };
  });
  const right = results.filter((r) => r.correct).length;
  const score = Math.round((right / results.length) * 100);
  const passed = score >= QUIZ_PASS_THRESHOLD;
  const at = now();

  const staff = isStaffRole(user.role);
  const seen = staff ? new Set<string>() : previouslyAnswered(db, user.id, lesson.topicId);
  db.insert(schema.topicAttempts)
    .values({ id: newId(), userId: user.id, topicId: lesson.topicId, kind: "quiz", score, passed, answers, createdAt: at, courseId: lesson.courseId })
    .run();
  if (!staff) {
    calibrateAttempt(
      db,
      calibrationTopic(lesson.topicId),
      results.map((r) => ({ rowId: r.row.id, servedId: r.row.id, correct: r.correct })),
      { skipServedIds: seen },
    );
  }

  let completed = false;
  if (passed) {
    db.insert(schema.courseProgress).values({ userId: user.id, topicId: lesson.topicId, courseId: lesson.courseId, completedAt: at }).onConflictDoNothing().run();
    syncCertificates(db, content, user);
  }
  completed = Boolean(
    db
      .select({ t: schema.courseProgress.topicId })
      .from(schema.courseProgress)
      .where(and(eq(schema.courseProgress.userId, user.id), eq(schema.courseProgress.topicId, lesson.topicId)))
      .get(),
  );
  return { score, passed, results: results.map((r) => r.result), completed: passed && completed };
}
