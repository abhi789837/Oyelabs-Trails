import type { FastifyInstance } from "fastify";

import type { MyXpResponse } from "../../../../shared/xp";
import { requireActiveUser } from "../../auth/guards";
import { myXp, syncMilestoneXp } from "./repo";

export async function registerV5XpRoutes(app: FastifyInstance): Promise<void> {
  /** The learner's XP: total, this ISO week, and the 10 newest awards. */
  app.get("/api/v5/me/xp", async (request): Promise<MyXpResponse> => {
    const user = requireActiveUser(request);
    syncMilestoneXp(app.db, user.id);
    return myXp(app.db, user.id);
  });
}
