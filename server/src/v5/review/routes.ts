import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { rateRequestSchema, sessionQuerySchema, type RateResponse, type ReviewSession, type ReviewSummary } from "../../../../shared/review";
import { requireActiveUser } from "../../auth/guards";
import { parseOrThrow } from "../../lib/errors";
import { migrateHandbookFlashcards, syncAll } from "./cards";
import { buildSession, rateCard, reviewSummary } from "./repo";

/**
 * v5 Review (Phase 4). Learner routes only; every query is scoped to the signed-in user.
 * - GET  /api/v5/review/summary → { dueCount, mistakesCount, totalCards, reviewedToday } (Today reads this)
 * - GET  /api/v5/review/session?kind=due|mixed|mistakes → about five minutes of cards
 * - POST /api/v5/review/cards/:id/rate { rating 1–4, sessionId? }
 */
export async function registerV5ReviewRoutes(app: FastifyInstance): Promise<void> {
  // One-time bridge from the handbook's Leitner flashcards, guarded by app_meta.
  try {
    migrateHandbookFlashcards(app.db, app.content);
  } catch (error) {
    app.log.warn({ err: error }, "review: handbook flashcard migration failed; it will retry on the next start");
  }

  app.get("/api/v5/review/summary", async (request): Promise<ReviewSummary> => {
    const user = requireActiveUser(request);
    syncAll(app.db, app.content, user.id);
    return reviewSummary(app.db, user.id);
  });

  app.get("/api/v5/review/session", async (request): Promise<ReviewSession> => {
    const user = requireActiveUser(request);
    const { kind } = parseOrThrow(sessionQuerySchema, request.query ?? {}, "Choose due, mixed or mistakes.");
    syncAll(app.db, app.content, user.id, true);
    return buildSession(app.db, app.content, user.id, kind);
  });

  app.post("/api/v5/review/cards/:id/rate", async (request): Promise<RateResponse> => {
    const user = requireActiveUser(request);
    const { id } = parseOrThrow(z.object({ id: z.string().min(1).max(64) }), request.params, "Unknown card.");
    const { rating, sessionId } = parseOrThrow(rateRequestSchema, request.body ?? {}, "Rate the card from 1 (Again) to 4 (Easy).");
    return rateCard(app.db, user.id, id, rating as 1 | 2 | 3 | 4, sessionId);
  });
}
