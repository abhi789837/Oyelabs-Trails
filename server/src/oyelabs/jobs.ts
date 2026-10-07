import type { JobType } from "../../../shared/enums";
import type { AiService } from "../ai/service";
import type { Db } from "../db";
import type { Env } from "../env";
import type { JobHandler } from "../jobs/worker";
import { assignJobHandlers } from "./assign/jobs";
import { mediaJobHandlers, startLinkRecheck } from "./media/jobs";
import { moduleTestJobHandlers } from "./moduleTests/jobs";

/**
 * v4.5 Oyelabs courses: every job handler, merged into the worker's map in index.ts with one spread.
 *
 * Owned by the architect and frozen: builders change their own `*\/jobs.ts`, not this file.
 *   B  media/jobs.ts        oyelabs.link.check, oyelabs.links.recheck, oyelabs.upload.transcode
 *   C  moduleTests/jobs.ts  oyelabs.text.extract, oyelabs.transcribe, oyelabs.module_test.generate
 *   D  assign/jobs.ts       oyelabs.course.embed
 */
export interface OyelabsJobDeps {
  db: Db;
  env: Env;
  ai: AiService;
  log: (message: string) => void;
}

export function oyelabsJobHandlers(deps: OyelabsJobDeps): Partial<Record<JobType, JobHandler>> {
  return { ...mediaJobHandlers(deps), ...moduleTestJobHandlers(deps), ...assignJobHandlers(deps) };
}

/** Timers (the daily link re-check). Returns a stop function for shutdown. */
export function startOyelabsSchedulers(deps: OyelabsJobDeps): () => void {
  const stops = [startLinkRecheck(deps)];
  return () => {
    for (const stop of stops) stop();
  };
}
