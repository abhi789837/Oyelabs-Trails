import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AssessmentResultsResponse, AssessmentReviewSetting } from "../../../../shared/assessmentResults";
import { requireActiveUser, requireStaff } from "../../auth/guards";
import { writeAudit } from "../../lib/audit";
import { parseOrThrow } from "../../lib/errors";
import { buildResults, setShowItemsAfter, showItemsAfter } from "./results";

/**
 * v5 results (Phase 5).
 *
 * - `GET /api/v5/assessment/results?assessmentId=`: the learner's latest (or named) test.
 * - `GET|PUT /api/admin/v5/assessment/review-setting {showItemsAfter}`: whether learners see their
 *   own questions after results are out (staff; audited).
 */
export async function registerV5AssessmentRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v5/assessment/results", async (request): Promise<AssessmentResultsResponse> => {
    const user = requireActiveUser(request);
    const { assessmentId } = parseOrThrow(z.object({ assessmentId: z.string().min(1).max(64).optional() }), request.query);
    return buildResults(app.db, app.content, user.id, assessmentId);
  });

  app.get("/api/admin/v5/assessment/review-setting", async (request): Promise<AssessmentReviewSetting> => {
    requireStaff(request);
    return { showItemsAfter: showItemsAfter(app.db) };
  });

  app.put("/api/admin/v5/assessment/review-setting", async (request): Promise<AssessmentReviewSetting> => {
    const staff = requireStaff(request);
    const { showItemsAfter: on } = parseOrThrow(z.object({ showItemsAfter: z.boolean() }), request.body);
    const before = showItemsAfter(app.db);
    setShowItemsAfter(app.db, on);
    writeAudit(app.db, { actorId: staff.id, action: "assessment.show_items_after", details: { from: before, to: on } });
    return { showItemsAfter: on };
  });
}
