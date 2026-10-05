import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { reviewDecisionSchema, reviewRequestBodySchema, scoringModeSchema, SCORING_MODE_LABELS } from "../../../shared/scoring";
import { createReviewRequest, decideReviewRequest, listReviewRequests, myReviewRequests } from "../assessment/reviews";
import { getRescoreReport, queueRescore, rescoreRunning } from "../assessment/rescoreJob";
import { getScoringMode, setScoringMode } from "../assessment/scoring";
import { requireActiveUser, requireStaff, requireSuperadmin } from "../auth/guards";
import { writeAudit } from "../lib/audit";
import { parseOrThrow } from "../lib/errors";

/**
 * v4.4 Phase 4: review requests (learner asks, admin decides), the scoring setting and the
 * re-score job. Admin copy is plain: "Give full marks" / "Keep Not yet".
 */
export async function registerReviewRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/review-requests", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (request) => {
    const user = requireActiveUser(request);
    const body = parseOrThrow(reviewRequestBodySchema, request.body);
    const row = createReviewRequest(app.db, { id: user.id }, body);
    return { id: row.id, status: row.status };
  });

  app.get("/api/review-requests", async (request) => {
    const user = requireActiveUser(request);
    return { requests: myReviewRequests(app.db, user.id) };
  });

  app.get("/api/admin/review-requests", async (request) => {
    requireStaff(request);
    const query = parseOrThrow(z.object({ status: z.enum(["open", "all"]).default("open"), userId: z.string().max(64).optional() }), request.query);
    return { requests: listReviewRequests(app.db, app.content, query) };
  });

  app.post("/api/admin/review-requests/:id/decision", async (request) => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(z.object({ id: z.string().min(1).max(64) }), request.params);
    const body = parseOrThrow(reviewDecisionSchema, request.body);
    return decideReviewRequest(app.db, app.content, actor, id, body.decision, body.note);
  });

  const scoringView = () => {
    const mode = getScoringMode(app.db);
    return { mode, label: SCORING_MODE_LABELS[mode], report: getRescoreReport(app.db), rescoring: rescoreRunning(app.db) };
  };

  app.get("/api/admin/settings/scoring", async (request) => {
    requireSuperadmin(request);
    return scoringView();
  });

  app.put("/api/admin/settings/scoring", async (request) => {
    const actor = requireSuperadmin(request);
    const { mode } = parseOrThrow(z.object({ mode: scoringModeSchema }), request.body);
    const before = getScoringMode(app.db);
    if (mode !== before) {
      setScoringMode(app.db, mode);
      writeAudit(app.db, { actorId: actor.id, action: "scoring.mode_changed", details: { from: before, to: mode } });
      // Every stored answer follows the new setting.
      queueRescore(app.db, "the scoring setting changed");
    }
    return scoringView();
  });

  app.get("/api/admin/scoring/rescore", async (request) => {
    requireSuperadmin(request);
    return scoringView();
  });

  app.post("/api/admin/scoring/rescore", async (request) => {
    const actor = requireSuperadmin(request);
    const queued = queueRescore(app.db, "started by an admin");
    if (queued) writeAudit(app.db, { actorId: actor.id, action: "scoring.rescore_started" });
    return { queued, ...scoringView() };
  });
}
