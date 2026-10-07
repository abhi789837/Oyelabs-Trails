import { z } from "zod";

import type { JobType } from "../../../../shared/enums";
import type { JobHandler } from "../../jobs/worker";
import type { OyelabsJobDeps } from "../jobs";
import { embedCourse, resolveEmbedder } from "./embed";

const payloadSchema = z.object({ courseId: z.string().min(1).max(64) });

/**
 * v4.5 Phase 4 (builder D): catalog embeddings.
 *
 * Payload: oyelabs.course.embed { courseId }. Queued by A on every publish of an Oyelabs course.
 * Skips when the course text and the embedder are unchanged; a deleted course is a no-op.
 */
export function assignJobHandlers(deps: OyelabsJobDeps): Partial<Record<JobType, JobHandler>> {
  return {
    "oyelabs.course.embed": async (job) => {
      const { courseId } = payloadSchema.parse(job.payload);
      const result = await embedCourse(deps.db, resolveEmbedder(deps.db, deps.ai), courseId, deps.log);
      deps.log(`course embed ${courseId}: ${result}`);
    },
  };
}
