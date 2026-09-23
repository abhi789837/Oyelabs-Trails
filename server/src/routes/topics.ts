import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AttemptResult } from "../../../shared/content";
import { attemptRequestSchema } from "../../../shared/content";
import { requireActiveUser } from "../auth/guards";
import { gradeCode, gradeQuiz } from "../content/grade";
import { badRequest, notFound, parseOrThrow } from "../lib/errors";
import { allowedTopicIdsFor } from "../plans/repo";
import { recordAttempt } from "../progress/repo";

const paramsSchema = z.object({ topicId: z.string().min(1).max(120) });

export async function registerTopicRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Grades an attempt and records it (brief §7.4, §7.5).
   *
   * This is the only route that returns correct answers, and only for the topic just submitted —
   * so a learner learns from their mistakes without being able to fetch a key beforehand.
   */
  app.post(
    "/api/topics/:topicId/attempt",
    {
      // Grading a code submission spins up a fresh V8 isolate, so this is also a cheap guard
      // against someone using the grader as a compute service.
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    },
    async (request): Promise<AttemptResult> => {
      const user = requireActiveUser(request);
      const { topicId } = parseOrThrow(paramsSchema, request.params, "Unknown waypoint.");
      const body = parseOrThrow(attemptRequestSchema, request.body);

      const allowed = allowedTopicIdsFor(app.db, user);
      if (allowed !== null && !allowed.has(topicId)) throw notFound("That waypoint isn't part of your plan.");

      const found = app.content.getTopic(topicId);
      if (!found) throw notFound("That waypoint doesn't exist.");
      const { topic } = found;

      if (body.kind === "quiz") {
        if (topic.challengeType !== "quiz" || !topic.quiz?.length) {
          throw badRequest("This waypoint doesn't have a quiz.");
        }
        const result = gradeQuiz(topic.quiz, body.answers);
        recordAttempt(app.db, {
          userId: user.id,
          topicId,
          kind: "quiz",
          score: result.score,
          passed: result.passed,
          answers: body.answers,
        });
        return result;
      }

      if (topic.challengeType !== "code" || !topic.codeChallenge) {
        throw badRequest("This waypoint doesn't have a coding challenge.");
      }
      const result = await gradeCode(topic.codeChallenge, body.code, app.sandbox);
      recordAttempt(app.db, {
        userId: user.id,
        topicId,
        kind: "code",
        score: result.score,
        passed: result.passed,
        code: body.code,
      });
      return result;
    },
  );
}
