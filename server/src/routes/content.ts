import type { FastifyInstance } from "fastify";

import type { ServedModule } from "../../../shared/content";
import { servedModuleParamsSchema } from "../../../shared/content";
import { requireActiveUser } from "../auth/guards";
import { toServedModule } from "../content/filter";
import { allowedTopicIdsFor } from "../plans/repo";
import { notFound, parseOrThrow } from "../lib/errors";
import { servedQuizFor } from "../topicTests/repo";

export async function registerContentRoutes(app: FastifyInstance): Promise<void> {
  /**
   * One module's content, filtered to what this caller may see and stripped of answer keys.
   *
   * A learner asking for a module with no assigned topics gets 404, not 403, so the response
   * cannot be used to enumerate what exists (brief §6).
   */
  app.get("/api/content/modules/:trackId/:moduleId", async (request): Promise<ServedModule> => {
    const user = requireActiveUser(request);
    const { trackId, moduleId } = parseOrThrow(servedModuleParamsSchema, request.params, "Unknown module.");

    const mod = app.content.getModule(trackId, moduleId);
    if (!mod) throw notFound("That camp doesn't exist.");

    const served = toServedModule(mod, {
      allowedTopicIds: allowedTopicIdsFor(app.db, user),
      includeKeys: user.role === "superadmin",
    });
    if (!served) throw notFound("That camp isn't part of your plan.");

    // v4.3: a quiz is served from the topic's active test items, in the same shape as before.
    const includeKeys = user.role === "superadmin";
    for (const topic of served.topics) {
      if (topic.challengeType !== "quiz") continue;
      const authored = mod.topics.find((t) => t.id === topic.id);
      if (!authored) continue;
      const quiz = servedQuizFor(app.db, authored, includeKeys);
      if (quiz) topic.quiz = quiz;
    }

    return served;
  });
}
