import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import {
  evaluationResultSchema,
  explainGradeSchema,
  type Blueprint,
  type ItemKey,
  type ItemPayload,
} from "../../../shared/assessment";
import { learnerProfileSchema, type LearnerProfile } from "../../../shared/profile";
import {
  buildEvaluationUser,
  buildExplainGraderUser,
  EVALUATION_SYSTEM,
  EXPLAIN_GRADER_SYSTEM,
  type EvaluationInput,
} from "../ai/prompts/evaluation";
import type { AiService } from "../ai/service";
import { EVALUATION_TIMEOUT_MS } from "../ai/types";
import type { ContentStore } from "../content/store";
import { schema, type Db } from "../db";
import type { Job } from "../jobs/queue";
import { newId, now } from "../lib/ids";
import { notify } from "../lib/notify";
import { publishPlan } from "../plans/repo";
import { getProgress } from "../progress/repo";
import { buildManifestDigest } from "./digest";
import { integritySummary } from "./integrity";
import { fallbackPlan, validatePlan } from "./planValidation";
import { provisionalLevel, type SelectorState } from "./selector";

const payloadSchema = z.object({ assessmentId: z.string(), reason: z.string().optional() });

export interface EvaluateDeps {
  db: Db;
  ai: AiService;
  content: ContentStore;
  log?: (message: string) => void;
}

/**
 * `assessment.evaluate` (brief §11.1).
 *
 * Grades the written answers, reads the whole assessment, and produces a skills report plus a
 * learning plan which is then validated and published.
 *
 * It must finish well under ten minutes, and it does not sleep: the learner watches a status
 * screen while this runs, and adding artificial delay to "feel thorough" would be a lie told to
 * someone waiting.
 */
export function evaluateHandler(deps: EvaluateDeps) {
  return async (job: Job): Promise<void> => {
    const { assessmentId } = payloadSchema.parse(job.payload);
    const { db, ai, content } = deps;

    const assessment = db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
    if (!assessment) return;
    if (!["submitted", "terminated", "evaluating"].includes(assessment.status)) {
      deps.log?.(`assessment ${assessmentId} is ${assessment.status}; nothing to evaluate`);
      return;
    }

    const user = db.select().from(schema.users).where(eq(schema.users.id, assessment.userId)).get();
    if (!user) return;

    const wasTerminated = assessment.status === "terminated";
    db.update(schema.assessments).set({ status: "evaluating" }).where(eq(schema.assessments.id, assessmentId)).run();

    try {
      const profile = readProfile(db, assessment.userId);
      const items = db
        .select()
        .from(schema.assessmentItems)
        .where(and(eq(schema.assessmentItems.assessmentId, assessmentId), inArray(schema.assessmentItems.status, ["answered", "skipped"])))
        .all();

      if (items.length === 0) {
        throw new Error("No items were answered, so there is nothing to evaluate.");
      }

      // ---- Step 1: grade the written answers against their rubrics ----
      await gradeExplainItems(deps, assessmentId, assessment.userId, items);

      // Re-read so the AI scores written above are part of the evaluation input.
      const graded = db
        .select()
        .from(schema.assessmentItems)
        .where(and(eq(schema.assessmentItems.assessmentId, assessmentId), inArray(schema.assessmentItems.status, ["answered", "skipped"])))
        .all();

      // ---- Step 2: build the input ----
      const blueprint = assessment.blueprint as Blueprint | null;
      const config = (assessment.config as { selector?: SelectorState } | null) ?? {};
      const digest = buildManifestDigest(content, profile);

      const input: EvaluationInput = {
        displayName: user.displayName,
        roleTitle: profile.roleTitle,
        yearsExperience: profile.yearsExperience,
        adminNotes: profile.adminNotes,
        claimedSkills: profile.claimedSkills,
        blueprintSummary: blueprint?.summary ?? "(no blueprint summary)",
        areas: (blueprint?.areas ?? []).map((area) => {
          const areaState = config.selector?.areas.find((a) => a.area === area.name);
          const difficulties = areaState
            ? areaState.served.map((id) => (graded.find((i) => i.id === id)?.difficulty ?? 3) as 1 | 2 | 3 | 4 | 5)
            : [];
          return {
            name: area.name,
            hypothesisLevel: area.hypothesisLevel,
            rationale: area.rationale,
            provisionalLevel: areaState && areaState.outcomes.length > 0 ? provisionalLevel(areaState, difficulties) : null,
            itemsAnswered: areaState?.served.length ?? 0,
          };
        }),
        items: graded.map((item) => {
          const payload = item.payload as ItemPayload;
          const key = item.key as ItemKey;
          return {
            id: item.id,
            area: item.area,
            kind: item.kind,
            difficulty: item.difficulty,
            prompt: payload.prompt,
            ...(payload.options ? { options: payload.options } : {}),
            ...(key.correctIndices ? { correct: key.correctIndices.map((i) => `[${i}]`).join(" ") } : {}),
            ...(key.expectedOutput !== undefined ? { correct: key.expectedOutput } : {}),
            response: describeResponse(item.response, payload),
            autoScore: item.autoScore,
            aiScore: item.aiScore,
            aiFeedback: item.aiFeedback,
            timeMs: item.timeMs,
            rationale: key.rationale,
          };
        }),
        integrity: { ...integritySummary(db, assessmentId), terminated: wasTerminated },
        digest: digestTopics(content, digest.topicIds),
      };

      // ---- Step 3: the evaluation call ----
      const result = await ai.generateJson({
        purpose: "evaluation",
        system: EVALUATION_SYSTEM,
        user: buildEvaluationUser(input),
        schema: evaluationResultSchema,
        schemaName: "evaluation",
        timeoutMs: EVALUATION_TIMEOUT_MS,
        maxOutputTokens: 24_000,
        meta: { subjectUserId: assessment.userId, assessmentId },
      });

      // ---- Step 4: validate the plan ----
      const progress = getProgress(db, assessment.userId);
      const completed = new Set(Object.entries(progress).filter(([, p]) => p.status === "completed").map(([id]) => id));
      const mastered = new Set(
        result.data.areas
          .filter((area) => area.level >= 4)
          .flatMap((area) => blueprint?.areas.find((a) => a.name === area.area)?.moduleIds ?? []),
      );

      const validated = validatePlan({
        content,
        topicIds: result.data.plan.topicIds,
        completedTopicIds: completed,
        masteredModuleIds: mastered,
      });

      let topicIds = validated.topicIds;
      const warnings = [...validated.warnings];
      if (topicIds.length < 5) {
        topicIds = fallbackPlan(content, profile.targetTracks);
        warnings.push("The proposed plan was too small after validation, so a starter plan was published instead.");
      }

      // ---- Step 5: store and publish ----
      db.insert(schema.evaluations)
        .values({
          id: newId(),
          assessmentId,
          result: { ...result.data, serverWarnings: warnings, terminated: wasTerminated },
          model: result.model,
          createdAt: now(),
        })
        .run();

      const plan = publishPlan(db, content, {
        userId: assessment.userId,
        topicIds,
        source: "ai",
        assessmentId,
        rationale: {
          summary: result.data.plan.rationale,
          milestones: result.data.plan.milestones,
          skipRationale: result.data.plan.skipRationale,
          estimatedHours: result.data.plan.estimatedHours,
          learnerSummary: result.data.learnerSummary,
          serverWarnings: warnings,
        },
        publishedBy: null,
      });

      db.update(schema.assessments).set({ status: "completed" }).where(eq(schema.assessments.id, assessmentId)).run();

      notify(db, {
        recipientId: assessment.userId,
        kind: "plan.published",
        title: "Your learning plan is ready",
        body: `${plan.topicIds.length} topics, about ${Math.round(result.data.plan.estimatedHours)} hours.`,
        link: "/plan",
      });

      for (const admin of db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, "superadmin")).all()) {
        notify(db, {
          recipientId: admin.id,
          kind: "evaluation.ready",
          title: `${user.displayName}'s evaluation is ready`,
          body: `Overall level ${result.data.overallLevel}/5 · ${plan.topicIds.length} topics${
            wasTerminated ? " · the assessment was terminated, so review before relying on it" : ""
          }${result.data.integrity.assessment !== "clean" ? ` · integrity: ${result.data.integrity.assessment.replace("_", " ")}` : ""}`,
          link: `/admin/people/${assessment.userId}`,
        });
      }

      deps.log?.(`assessment ${assessmentId} evaluated: level ${result.data.overallLevel}, ${plan.topicIds.length} topics`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      db.update(schema.assessments)
        .set({ status: "failed", terminatedReason: message.slice(0, 500) })
        .where(eq(schema.assessments.id, assessmentId))
        .run();

      for (const admin of db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, "superadmin")).all()) {
        notify(db, {
          recipientId: admin.id,
          kind: "evaluation.failed",
          title: `${user.displayName}'s evaluation failed`,
          body: message.slice(0, 300),
          link: `/admin/people/${assessment.userId}`,
        });
      }
      throw error;
    }
  };
}

/** Grades every answered `explain` item in one batched call (§11.1 step 1). */
async function gradeExplainItems(
  deps: EvaluateDeps,
  assessmentId: string,
  subjectUserId: string,
  items: (typeof schema.assessmentItems.$inferSelect)[],
): Promise<void> {
  const explainItems = items.filter((item) => item.kind === "explain" && item.aiScore === null);
  if (explainItems.length === 0) return;

  const forGrading = explainItems.map((item) => {
    const payload = item.payload as ItemPayload;
    const key = item.key as ItemKey;
    const response = (item.response as { text?: string } | null) ?? {};
    return { id: item.id, prompt: payload.prompt, answer: response.text ?? "", rubric: key.rubric ?? [] };
  });

  try {
    const result = await deps.ai.generateJson({
      purpose: "evaluation",
      system: EXPLAIN_GRADER_SYSTEM,
      user: buildExplainGraderUser(forGrading),
      schema: explainGradeSchema,
      schemaName: "explain_grades",
      meta: { subjectUserId, assessmentId },
    });

    for (const grade of result.data.grades) {
      if (!explainItems.some((item) => item.id === grade.itemId)) continue;
      deps.db
        .update(schema.assessmentItems)
        .set({ aiScore: Math.round(grade.score * 100), aiFeedback: grade.feedback })
        .where(eq(schema.assessmentItems.id, grade.itemId))
        .run();
    }
  } catch (error) {
    // Not fatal: the evaluation can still read the raw answers, and losing the whole report
    // because a rubric pass failed would be worse than losing the rubric scores.
    deps.log?.(`rubric grading failed, continuing without it: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function readProfile(db: Db, userId: string): LearnerProfile {
  const row = db.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).get();
  if (!row) throw new Error("This learner has no profile.");
  return learnerProfileSchema.parse({
    roleTitle: row.roleTitle,
    yearsExperience: row.yearsExperience,
    adminNotes: row.adminNotes,
    claimedSkills: row.claimedSkills,
    targetTracks: row.targetTracks,
  });
}

function describeResponse(response: unknown, payload: ItemPayload): string {
  if (!response || typeof response !== "object") return "";
  const value = response as { selected?: number[]; text?: string; code?: string };
  if (value.selected?.length) {
    return value.selected.map((i) => `[${i}] ${payload.options?.[i] ?? ""}`).join(" | ");
  }
  if (value.text) return value.text.slice(0, 3000);
  if (value.code) return value.code.slice(0, 4000);
  return "";
}

function digestTopics(content: ContentStore, topicIds: Set<string>) {
  const out: { id: string; title: string; level: string; module: string; track: string }[] = [];
  for (const track of content.manifest) {
    for (const module of track.modules) {
      for (const topic of module.topics) {
        if (topicIds.has(topic.id)) {
          out.push({ id: topic.id, title: topic.title, level: topic.level, module: module.name, track: track.name });
        }
      }
    }
  }
  return out;
}
