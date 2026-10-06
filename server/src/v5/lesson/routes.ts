import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { SessionUser } from "../../../../shared/auth";
import {
  SOLUTION_MIN_ATTEMPTS,
  availableSteps,
  lessonStatePutSchema,
  quickCheckAnswerSchema,
  runRequestSchema,
  type RunChecksResponse,
  type RunSnippetResponse,
  solutionCostsXp,
  solutionRequestSchema,
  type LessonResume,
  type LessonStatePutResponse,
  type LessonStateView,
  type QuickCheckResponse,
  type QuickCheckResult,
  type SolutionResponse,
} from "../../../../shared/lesson";
import { requireActiveUser } from "../../auth/guards";
import { correctIndicesOf, isMultiSelect, visibleTestCount } from "../../content/filter";
import type { AuthoredQuizQuestion, AuthoredTopic } from "../../content/store";
import { badRequest, conflict, notFound, parseOrThrow } from "../../lib/errors";
import { allowedTopicIdsFor } from "../../plans/repo";
import { getRow, lessonFacts, markSolutionTraded, resumeFor, saveState, solutionWasTraded, toView } from "./repo";
import { SNIPPET_FN, snippetResult, wrapSnippet } from "./run";
import { checkedSolution } from "./solution";
import { awardQuickCheck } from "./xp";

const topicParams = z.object({ topicId: z.string().min(1).max(120) });

/** The topic, when this person may open it. Same wording as the v4 topic routes. */
export function lessonTopic(app: FastifyInstance, user: SessionUser, topicId: string): AuthoredTopic {
  const allowed = allowedTopicIdsFor(app.db, user);
  if (allowed !== null && !allowed.has(topicId)) throw notFound("That lesson isn't part of your plan.");
  const found = app.content.getTopic(topicId);
  if (!found) throw notFound("That lesson doesn't exist.");
  return found.topic;
}

/** FNV-1a, for a stable per-learner pick of quick-check questions. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * One or two of the topic's own quiz questions, the same ones each time for a learner (so the pop-in
 * after the video and a later visit agree). Single-answer questions first: a quick check should be
 * quick.
 */
export function quickCheckQuestions(topic: AuthoredTopic, userId: string): AuthoredQuizQuestion[] {
  const quiz = topic.quiz ?? [];
  if (!quiz.length) return [];
  const single = quiz.filter((q) => !isMultiSelect(q));
  const pool = single.length >= 2 ? single : quiz;
  const start = hash(`${userId}:${topic.id}`) % pool.length;
  const picked = [pool[start]];
  if (pool.length > 1) picked.push(pool[(start + Math.max(1, Math.floor(pool.length / 2))) % pool.length]);
  return picked;
}

export async function registerLessonRoutes(app: FastifyInstance): Promise<void> {
  /** For Today: the lesson to continue, or null. Registered before `/:topicId` routes. */
  app.get("/api/v5/lessons/resume", async (request): Promise<LessonResume | null> => {
    const user = requireActiveUser(request);
    return resumeFor(app.db, app.content, user);
  });

  app.get("/api/v5/lessons/:topicId/state", async (request): Promise<LessonStateView> => {
    const user = requireActiveUser(request);
    const { topicId } = parseOrThrow(topicParams, request.params, "Unknown lesson.");
    const topic = lessonTopic(app, user, topicId);
    const row = getRow(app.db, user.id, topicId);
    return toView(topic, row, lessonFacts(app.db, user.id, topicId, solutionWasTraded(app.db, user.id, topicId)));
  });

  /** Autosave: the step, the steps done (checked here before any XP), the video and its position. */
  app.put(
    "/api/v5/lessons/:topicId/state",
    { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } },
    async (request): Promise<LessonStatePutResponse> => {
      const user = requireActiveUser(request);
      const { topicId } = parseOrThrow(topicParams, request.params, "Unknown lesson.");
      const body = parseOrThrow(lessonStatePutSchema, request.body ?? {});
      const topic = lessonTopic(app, user, topicId);
      return saveState(app.db, app.content, user, topic, body);
    },
  );

  app.get("/api/v5/lessons/:topicId/quick-check", async (request): Promise<QuickCheckResponse> => {
    const user = requireActiveUser(request);
    const { topicId } = parseOrThrow(topicParams, request.params, "Unknown lesson.");
    const topic = lessonTopic(app, user, topicId);
    return {
      questions: quickCheckQuestions(topic, user.id).map((q) => ({ id: q.id, prompt: q.prompt, options: q.options, multi: isMultiSelect(q) })),
    };
  });

  /** Retrieval practice: graded here, never counted towards completing the topic. */
  app.post(
    "/api/v5/lessons/:topicId/quick-check",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request): Promise<QuickCheckResult> => {
      const user = requireActiveUser(request);
      const { topicId } = parseOrThrow(topicParams, request.params, "Unknown lesson.");
      const { answers } = parseOrThrow(quickCheckAnswerSchema, request.body);
      const topic = lessonTopic(app, user, topicId);
      const questions = quickCheckQuestions(topic, user.id);
      if (!questions.length) throw badRequest("This lesson has no quick check.");
      const results = questions.map((q) => {
        const key = correctIndicesOf(q);
        const given = [...new Set(answers[q.id] ?? [])].sort((a, b) => a - b);
        const correct = given.length === key.length && given.every((v, i) => v === key[i]);
        return { id: q.id, correct, correctIndices: key, explanation: q.explanation };
      });
      const passed = results.every((r) => r.correct);
      const award = passed ? awardQuickCheck(app.db, user.id, topic.id) : null;
      return { passed, results, awarded: award ? [award] : [] };
    },
  );

  /** Runs learner code in the server sandbox: a Read-step snippet, or a Do step's visible checks. */
  app.post(
    "/api/v5/lessons/:topicId/run",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request): Promise<RunSnippetResponse | RunChecksResponse> => {
      const user = requireActiveUser(request);
      const { topicId } = parseOrThrow(topicParams, request.params, "Unknown lesson.");
      const body = parseOrThrow(runRequestSchema, request.body);
      const topic = lessonTopic(app, user, topicId);
      if (body.mode === "snippet") {
        const run = await app.sandbox.run({ code: wrapSnippet(body.code), functionName: SNIPPET_FN, testCases: [{ args: [], expected: null, description: "run" }], timeoutMs: 3000 });
        return snippetResult(run);
      }
      const challenge = topic.codeChallenge;
      if (topic.challengeType !== "code" || !challenge) throw badRequest("This lesson has no coding practice.");
      const visible = challenge.testCases.slice(0, visibleTestCount(challenge.testCases.length));
      const run = await app.sandbox.run({ code: body.code, functionName: challenge.functionName, testCases: visible });
      return {
        results: visible.map((t, i) => {
          const o = run.outcomes.find((x) => x.index === i);
          return { description: t.description, passed: Boolean(o?.passed), isEdgeCase: Boolean(t.isEdgeCase), expected: o?.expected, actual: o?.actual, error: o?.error ?? (o ? undefined : run.timedOut ? "Timed out" : "Not run") };
        }),
        passedCount: run.passedCount,
        total: visible.length,
        ...(run.compileError ? { compileError: run.compileError } : {}),
        timedOut: run.timedOut,
      };
    },
  );

  /**
   * The worked solution for a coding Do step. Free after three checks; earlier only with
   * `trade: true`, which halves the step's XP (the client says so before asking).
   */
  app.post(
    "/api/v5/lessons/:topicId/solution",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request): Promise<SolutionResponse> => {
      const user = requireActiveUser(request);
      const { topicId } = parseOrThrow(topicParams, request.params, "Unknown lesson.");
      const { trade } = parseOrThrow(solutionRequestSchema, request.body ?? {});
      const topic = lessonTopic(app, user, topicId);
      if (!availableSteps(topic).includes("do") || topic.challengeType !== "code" || !topic.codeChallenge) {
        throw badRequest("This lesson has no coding practice.");
      }
      const facts = lessonFacts(app.db, user.id, topicId);
      const early = solutionCostsXp(facts.codeAttempts) && !facts.codePassed;
      if (early && !trade && !solutionWasTraded(app.db, user.id, topicId)) {
        throw conflict(`The solution opens after ${SOLUTION_MIN_ATTEMPTS} checks. You can see it now for half the points of this step.`);
      }
      const solution = await checkedSolution({ db: app.db, ai: app.ai, sandbox: app.sandbox }, topic, user.id);
      // Only charge the trade when there was something to show.
      if (early && trade && solution) markSolutionTraded(app.db, user.id, topic);
      return {
        code: solution?.code ?? null,
        explanation: solution?.explanation ?? null,
        message: solution ? null : "We don't have a checked solution for this one yet. Try the hints, or Ask Oye for a nudge.",
        traded: solutionWasTraded(app.db, user.id, topicId),
      };
    },
  );
}
