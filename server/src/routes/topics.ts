import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AttemptResult } from "../../../shared/content";
import { attemptRequestSchema } from "../../../shared/content";
import { requireActiveUser } from "../auth/guards";
import { gradeCode } from "../content/grade";
import { ERROR_CODES } from "../../../shared/api";
import { badRequest, HttpError, notFound, parseOrThrow } from "../lib/errors";
import { allowedTopicIdsFor } from "../plans/repo";
import { recordAttempt } from "../progress/repo";
import { topicVideosView } from "../videos/repo";
import { isStaff } from "../../../shared/enums";
import { calibrateAttempt, previouslyAnswered } from "../topicTests/calibrate";
import { gradeTopicQuiz } from "../topicTests/repo";
import { getScoringMode } from "../assessment/scoring";
import { newId } from "../lib/ids";

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

      // v4.3: in lock mode a topic's test waits until every video is watched. Never applies to a
      // topic the learner already completed (a retry is still allowed) or to staff.
      const videos = topicVideosView(app.db, app.content, user, topic);
      if (videos.locked) {
        const left = videos.total - videos.watchedCount;
        throw new HttpError(
          409,
          ERROR_CODES.VIDEOS_UNWATCHED,
          `Watch the ${left === 1 ? "last video" : `${left} remaining videos`} of this topic first (${videos.watchedCount} of ${videos.total} watched).`,
        );
      }

      if (body.kind === "quiz") {
        if (topic.challengeType !== "quiz" || !topic.quiz?.length) {
          throw badRequest("This waypoint doesn't have a quiz.");
        }
        // v4.3: graded against the stored test items (only active ones are served), and each
        // item's result feeds calibration — first exposure only, never staff.
        const { result, itemResults } = gradeTopicQuiz(app.db, topic, body.answers);
        const seen = previouslyAnswered(app.db, user.id, topicId);
        const attemptId = newId();
        result.attemptId = attemptId;
        const rowIds = new Map(itemResults.map((r) => [r.servedId, r.rowId]));
        result.perQuestion = result.perQuestion.map((q) => (rowIds.has(q.id) ? { ...q, itemId: rowIds.get(q.id) } : q));
        recordAttempt(app.db, {
          id: attemptId,
          userId: user.id,
          topicId,
          kind: "quiz",
          score: result.score,
          passed: result.passed,
          answers: body.answers,
        });
        if (!isStaff(user.role)) {
          try {
            calibrateAttempt(app.db, topic, itemResults, { skipServedIds: seen });
          } catch (error) {
            request.log.warn({ err: error }, "topic test calibration failed");
          }
        }
        return result;
      }

      if (topic.challengeType !== "code" || !topic.codeChallenge) {
        throw badRequest("This waypoint doesn't have a coding challenge.");
      }
      const result = await gradeCode(topic.codeChallenge, body.code, app.sandbox, getScoringMode(app.db));
      result.attemptId = newId();
      recordAttempt(app.db, {
        id: result.attemptId,
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
