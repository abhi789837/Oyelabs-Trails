import type { FastifyInstance } from "fastify";

import { registerNoteRoutes } from "../notes/routes";
import { registerAdminProblemRoutes, registerProblemRoutes } from "../problems/routes";
import { registerAdminTutorRoutes, registerTutorRoutes } from "../tutor/routes";
import { registerLessonRoutes } from "./routes";

/**
 * v5 Phase 3, the lesson player's API: lesson state and resume, quick checks and solutions, notes,
 * problem reports and the Ask Oye tutor. The two staff route groups are plugins, so their guard is
 * scoped to them.
 */
export async function registerV5LessonRoutes(app: FastifyInstance): Promise<void> {
  await registerLessonRoutes(app);
  await registerNoteRoutes(app);
  await registerProblemRoutes(app);
  await registerTutorRoutes(app);
  await app.register(registerAdminProblemRoutes);
  await app.register(registerAdminTutorRoutes);
}
