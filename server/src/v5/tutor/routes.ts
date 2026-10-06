import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { ERROR_CODES } from "../../../../shared/api";
import {
  TUTOR_CAP_KEY,
  capLeft,
  dayStartUtc,
  parseCap,
  tutorAskSchema,
  tutorRatingSchema,
  type LessonStepId,
  type TutorAnswerResponse,
  type TutorCitation,
  type TutorMessageView,
  type TutorQualityReport,
  type TutorStatus,
} from "../../../../shared/lesson";
import { requireActiveUser, requireStaff, staffOnly } from "../../auth/guards";
import { schema, type Db } from "../../db";
import { HttpError, notFound, parseOrThrow } from "../../lib/errors";
import { newId, now } from "../../lib/ids";
import { lessonTopic } from "../lesson/routes";
import { readMeta } from "../lesson/meta";
import { checkedCitations, limitCode, tutorAnswerSchema, tutorSystem, tutorUser } from "./tutor";

const topicParams = z.object({ topicId: z.string().min(1).max(120) });
const messageParams = z.object({ messageId: z.string().min(1).max(64) });

export const NOT_SET_UP = "Ask Oye isn't set up yet. An admin needs to connect an AI service first.";
export const OFF_IN_TEST = "Ask Oye is off during tests, so the result is all yours. It's back when you finish.";

type Row = typeof schema.tutorMessages.$inferSelect;

export function dailyCap(db: Db): number {
  return parseCap(readMeta(db, TUTOR_CAP_KEY));
}

export function usedToday(db: Db, userId: string, nowMs = now()): number {
  return Number(
    db
      .select({ n: sql<number>`count(*)` })
      .from(schema.tutorMessages)
      .where(and(eq(schema.tutorMessages.userId, userId), gte(schema.tutorMessages.createdAt, dayStartUtc(nowMs))))
      .get()?.n ?? 0,
  );
}

/** True while the learner is sitting an assessment: the tutor is off for all lessons then. */
export function inAssessment(db: Db, userId: string): boolean {
  return Boolean(
    db
      .select({ id: schema.assessments.id })
      .from(schema.assessments)
      .where(and(eq(schema.assessments.userId, userId), eq(schema.assessments.status, "in_progress")))
      .get(),
  );
}

function toView(row: Row): TutorMessageView {
  const rating = row.rating === 1 ? 1 : row.rating === -1 ? -1 : 0;
  return {
    id: row.id,
    step: (row.step as LessonStepId | null) ?? null,
    question: row.question,
    answer: row.answer,
    citations: (Array.isArray(row.citations) ? row.citations : []) as TutorCitation[],
    rating,
    createdAt: row.createdAt,
  };
}

function history(db: Db, userId: string, topicId: string, limit: number): Row[] {
  return db
    .select()
    .from(schema.tutorMessages)
    .where(and(eq(schema.tutorMessages.userId, userId), eq(schema.tutorMessages.topicId, topicId)))
    .orderBy(desc(schema.tutorMessages.createdAt))
    .limit(limit)
    .all()
    .reverse();
}

export async function registerTutorRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v5/lessons/:topicId/tutor", async (request): Promise<TutorStatus> => {
    const user = requireActiveUser(request);
    const { topicId } = parseOrThrow(topicParams, request.params, "Unknown lesson.");
    lessonTopic(app, user, topicId);
    const cap = dailyCap(app.db);
    const used = usedToday(app.db, user.id);
    const available = app.ai.isConfigured();
    const reason = !available ? NOT_SET_UP : inAssessment(app.db, user.id) ? OFF_IN_TEST : null;
    return { available, reason, cap, usedToday: used, left: capLeft(used, cap), messages: history(app.db, user.id, topicId, 20).map(toView) };
  });

  app.post(
    "/api/v5/lessons/:topicId/tutor",
    { config: { rateLimit: { max: 12, timeWindow: "1 minute" } } },
    async (request): Promise<TutorAnswerResponse> => {
      const user = requireActiveUser(request);
      const { topicId } = parseOrThrow(topicParams, request.params, "Unknown lesson.");
      const body = parseOrThrow(tutorAskSchema, request.body);
      const topic = lessonTopic(app, user, topicId);

      if (body.step === "check" || inAssessment(app.db, user.id)) throw new HttpError(403, ERROR_CODES.FORBIDDEN, OFF_IN_TEST);
      if (!app.ai.isConfigured()) throw new HttpError(503, ERROR_CODES.AI_NOT_CONFIGURED, NOT_SET_UP);

      const cap = dailyCap(app.db);
      const used = usedToday(app.db, user.id);
      if (used >= cap) {
        throw new HttpError(429, ERROR_CODES.RATE_LIMITED, `You've asked ${cap} questions today, which is the daily limit. Ask Oye is back tomorrow.`);
      }

      const turns = history(app.db, user.id, topicId, 3).map((r) => ({ question: r.question, answer: r.answer }));
      let answer: string;
      let citations: TutorCitation[];
      try {
        const { data } = await app.ai.generateJson({
          purpose: "tutor",
          task: "tutor_answer",
          system: tutorSystem(topic),
          user: tutorUser({ step: body.step, question: body.question, code: body.step === "do" ? body.code : undefined, history: turns }),
          schema: tutorAnswerSchema,
          schemaName: "tutor_answer",
          meta: { subjectUserId: user.id },
          timeoutMs: 45_000,
        });
        answer = limitCode(data.answer.trim(), body.step);
        citations = checkedCitations(topic, data.citations);
      } catch (error) {
        request.log.warn({ err: error }, "tutor answer failed");
        throw new HttpError(502, ERROR_CODES.INTERNAL, "Oye couldn't answer just now. Try again in a minute. This question didn't count towards today's limit.");
      }

      const row: Row = {
        id: newId(),
        userId: user.id,
        topicId,
        step: body.step,
        question: body.question,
        answer,
        citations,
        rating: 0,
        createdAt: now(),
      };
      app.db.insert(schema.tutorMessages).values(row).run();
      return { message: toView(row), left: capLeft(used + 1, cap) };
    },
  );

  app.post("/api/v5/tutor/messages/:messageId/rating", async (request): Promise<{ message: TutorMessageView }> => {
    const user = requireActiveUser(request);
    const { messageId } = parseOrThrow(messageParams, request.params, "Unknown answer.");
    const { rating } = parseOrThrow(tutorRatingSchema, request.body);
    const row = app.db
      .select()
      .from(schema.tutorMessages)
      .where(and(eq(schema.tutorMessages.id, messageId), eq(schema.tutorMessages.userId, user.id)))
      .get();
    if (!row) throw notFound("That answer doesn't exist.");
    app.db.update(schema.tutorMessages).set({ rating }).where(eq(schema.tutorMessages.id, messageId)).run();
    return { message: toView({ ...row, rating }) };
  });
}

/** Staff only: how helpful Ask Oye is, and every answer marked unhelpful. */
export async function registerAdminTutorRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  app.get("/api/admin/v5/tutor-quality", async (request): Promise<TutorQualityReport> => {
    requireStaff(request);
    const counts = app.db
      .select({
        total: sql<number>`count(*)`,
        helpful: sql<number>`coalesce(sum(case when ${schema.tutorMessages.rating} = 1 then 1 else 0 end), 0)`,
        unhelpful: sql<number>`coalesce(sum(case when ${schema.tutorMessages.rating} = -1 then 1 else 0 end), 0)`,
        last7: sql<number>`coalesce(sum(case when ${schema.tutorMessages.createdAt} >= ${now() - 7 * 24 * 3600 * 1000} then 1 else 0 end), 0)`,
      })
      .from(schema.tutorMessages)
      .get();
    const down = app.db
      .select()
      .from(schema.tutorMessages)
      .where(eq(schema.tutorMessages.rating, -1))
      .orderBy(desc(schema.tutorMessages.createdAt))
      .limit(100)
      .all();
    const ids = [...new Set(down.map((r) => r.userId))];
    const names = new Map(
      ids.length ? app.db.select({ id: schema.users.id, name: schema.users.displayName }).from(schema.users).where(inArray(schema.users.id, ids)).all().map((u) => [u.id, u.name] as const) : [],
    );
    const total = Number(counts?.total ?? 0);
    const helpful = Number(counts?.helpful ?? 0);
    const unhelpful = Number(counts?.unhelpful ?? 0);
    return {
      total,
      helpful,
      unhelpful,
      unrated: total - helpful - unhelpful,
      last7Days: Number(counts?.last7 ?? 0),
      unhelpfulAnswers: down.map((r) => ({
        id: r.id,
        topicId: r.topicId,
        topicTitle: app.content.getTopic(r.topicId)?.topic.title ?? r.topicId,
        learnerName: names.get(r.userId) ?? "Someone",
        step: r.step,
        question: r.question,
        answer: r.answer,
        createdAt: r.createdAt,
      })),
    };
  });
}
