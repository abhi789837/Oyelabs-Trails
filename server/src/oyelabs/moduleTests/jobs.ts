import { eq } from "drizzle-orm";
import { z } from "zod";

import { MODULE_SOURCE_KINDS } from "../../../../shared/moduleTests";
import type { JobType } from "../../../../shared/enums";
import { schema } from "../../db";
import { enqueue } from "../../jobs/queue";
import type { JobHandler } from "../../jobs/worker";
import type { OyelabsJobDeps } from "../jobs";
import { generateModuleTest } from "./generate";
import { extractDoc, jobWaiting, moduleContext, syncInlineSources, transcribeVideoStep, type ExtractDeps } from "./sources";

/**
 * v4.5 Phase 3 (builder C): gathering module text and writing module tests.
 *
 *   oyelabs.text.extract            { sectionId, sourceKind, sourceId, force? }   one doc (or notes/description)
 *   oyelabs.transcribe              { videoId, startSec? }   YouTube captions, or one 10-minute Whisper chunk then re-enqueue
 *   oyelabs.module_test.generate    { sectionId, reason }    idempotent by content hash; defers while sources are read
 *
 * After a source's text changes, a generate for its module is queued (unless one is waiting), so a
 * doc edited on its own still refreshes that module's test, and only that module's.
 */

const extractPayload = z.object({ sectionId: z.string().min(1), sourceKind: z.enum(MODULE_SOURCE_KINDS), sourceId: z.string().min(1), force: z.boolean().optional() });
const transcribePayload = z.object({ videoId: z.string().min(1), startSec: z.number().min(0).optional() });
const generatePayload = z.object({ sectionId: z.string().min(1), reason: z.enum(["publish", "changed", "admin"]).default("publish") });

/** Seconds between Whisper chunks, so other jobs get a turn on the single worker. */
const CHUNK_GAP_MS = 2_000;

export interface ModuleTestJobOverrides {
  extract?: Partial<Omit<ExtractDeps, "db" | "env">>;
}

function queueGenerate(deps: OyelabsJobDeps, sectionId: string): void {
  if (jobWaiting(deps.db, "oyelabs.module_test.generate", "sectionId", sectionId)) return;
  enqueue(deps.db, { type: "oyelabs.module_test.generate", payload: { sectionId, reason: "changed" }, delayMs: 1_000 });
}

export function moduleTestJobHandlers(deps: OyelabsJobDeps, overrides: ModuleTestJobOverrides = {}): Partial<Record<JobType, JobHandler>> {
  const extractDeps: ExtractDeps = { db: deps.db, env: deps.env, log: deps.log, ...overrides.extract };
  return {
    "oyelabs.text.extract": async (job) => {
      const payload = extractPayload.parse(job.payload);
      if (payload.sourceKind === "note" || payload.sourceKind === "description") {
        const ctx = moduleContext(deps.db, payload.sectionId);
        if (ctx && syncInlineSources(deps.db, ctx)) queueGenerate(deps, payload.sectionId);
        return;
      }
      if (payload.sourceKind === "video") {
        enqueue(deps.db, { type: "oyelabs.transcribe", payload: { videoId: payload.sourceId } });
        return;
      }
      const outcome = await extractDoc(extractDeps, payload.sourceId, { force: payload.force ?? false });
      if (outcome === "changed" || outcome === "skipped") queueGenerate(deps, payload.sectionId);
    },
    "oyelabs.transcribe": async (job) => {
      const payload = transcribePayload.parse(job.payload);
      const step = await transcribeVideoStep(extractDeps, payload.videoId, payload.startSec ?? 0);
      if (step.outcome === "continue") {
        enqueue(deps.db, { type: "oyelabs.transcribe", payload: { videoId: payload.videoId, startSec: step.nextStartSec }, delayMs: CHUNK_GAP_MS });
        return;
      }
      if (step.outcome === "changed" || step.outcome === "skipped") {
        const sectionId = sectionOfVideo(deps, payload.videoId);
        if (sectionId) queueGenerate(deps, sectionId);
      }
    },
    "oyelabs.module_test.generate": async (job) => {
      const payload = generatePayload.parse(job.payload);
      await generateModuleTest({ db: deps.db, ai: deps.ai, log: deps.log }, payload.sectionId, payload.reason);
    },
  };
}

function sectionOfVideo(deps: OyelabsJobDeps, videoId: string): string | null {
  return deps.db.select({ s: schema.courseVideos.sectionId }).from(schema.courseVideos).where(eq(schema.courseVideos.id, videoId)).get()?.s ?? null;
}
