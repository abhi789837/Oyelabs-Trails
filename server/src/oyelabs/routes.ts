import type { FastifyInstance } from "fastify";

import { registerOyelabsAssignAdminRoutes } from "./assign/routes";
import { registerOyelabsEditorRoutes } from "./editor/routes";
import { registerOyelabsMediaAdminRoutes, registerOyelabsMediaLearnerRoutes } from "./media/routes";
import { registerModuleTestAdminRoutes, registerModuleTestLearnerRoutes } from "./moduleTests/routes";

/**
 * v4.5 Oyelabs courses: every route, registered from one place (app.ts calls this once).
 *
 * Owned by the architect and frozen: builders add routes inside their own files, not here.
 * Admin groups are encapsulated plugins with their own `staffOnly` hook (the same pattern as
 * routes/admin/*), so a learner gets 403 on all of them. Learner groups check the session per route.
 *
 *   A  editor/routes.ts        /api/admin/oyelabs/{drafts,courses,skills}
 *   B  media/routes.ts         /api/admin/oyelabs/{links,uploads,videos,docs}, /api/v5/oyelabs/{lessons/:topicId/playlist|videos|docs, media}
 *   C  moduleTests/routes.ts   /api/admin/oyelabs/modules/:sectionId/test*, /api/v5/oyelabs/lessons/:topicId/test*
 *   D  assign/routes.ts        /api/admin/oyelabs/{assignments,search,suggest}
 */
export async function registerOyelabsRoutes(app: FastifyInstance): Promise<void> {
  await app.register(registerOyelabsEditorRoutes);
  await app.register(registerOyelabsMediaAdminRoutes);
  await app.register(registerModuleTestAdminRoutes);
  await app.register(registerOyelabsAssignAdminRoutes);
  await app.register(registerOyelabsMediaLearnerRoutes);
  await app.register(registerModuleTestLearnerRoutes);
}
