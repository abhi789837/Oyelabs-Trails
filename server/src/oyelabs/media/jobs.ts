import { z } from "zod";

import { LINK_RECHECK_INTERVAL_MS } from "../../../../shared/videoSources";
import type { JobType } from "../../../../shared/enums";
import { enqueue } from "../../jobs/queue";
import type { JobHandler } from "../../jobs/worker";
import type { OyelabsJobDeps } from "../jobs";
import { checkDoc, checkVideo, linksDueForCheck, sweepOrphanUploads } from "./check";
import type { ResolveDeps } from "./resolve";
import { systemMediaTools, transcodeUpload, type MediaTools } from "./transcode";

/**
 * v4.5 Phase 2 (builder B): link checks, the daily re-check and upload transcoding.
 *
 *   oyelabs.link.check        { videoId } | { docId }
 *   oyelabs.links.recheck     {}           queues one oyelabs.link.check per link due, and sweeps orphan uploads
 *   oyelabs.upload.transcode  { uploadId }
 */

const linkCheckPayload = z.union([z.object({ videoId: z.string().min(1) }), z.object({ docId: z.string().min(1) })]);
const transcodePayload = z.object({ uploadId: z.string().min(1) });

/** Spacing between the sweep's checks, so a big library doesn't hit one provider all at once. */
const RECHECK_SPACING_MS = 3_000;

export function mediaJobHandlers(deps: OyelabsJobDeps, options: { resolve?: ResolveDeps; tools?: MediaTools } = {}): Partial<Record<JobType, JobHandler>> {
  return {
    "oyelabs.link.check": async (job) => {
      const payload = linkCheckPayload.parse(job.payload);
      if ("videoId" in payload) await checkVideo(deps.db, payload.videoId, options.resolve);
      else await checkDoc(deps.db, payload.docId, options.resolve);
    },
    "oyelabs.links.recheck": async () => {
      const due = linksDueForCheck(deps.db);
      let delay = 0;
      for (const videoId of due.videoIds) enqueue(deps.db, { type: "oyelabs.link.check", payload: { videoId }, delayMs: (delay += RECHECK_SPACING_MS) });
      for (const docId of due.docIds) enqueue(deps.db, { type: "oyelabs.link.check", payload: { docId }, delayMs: (delay += RECHECK_SPACING_MS) });
      const removed = sweepOrphanUploads(deps.db, deps.env);
      if (due.videoIds.length + due.docIds.length + removed > 0) {
        deps.log(`oyelabs: re-checking ${due.videoIds.length} video and ${due.docIds.length} doc link(s); removed ${removed} unused upload(s)`);
      }
    },
    "oyelabs.upload.transcode": async (job) => {
      const { uploadId } = transcodePayload.parse(job.payload);
      await transcodeUpload(deps.db, deps.env, uploadId, options.tools ?? systemMediaTools, deps.log);
    },
  };
}

/**
 * The daily re-check timer: once about a minute after boot, then every 24 h. Unref'd, so it never
 * holds the process open. Also reports at boot when ffmpeg is missing (uploads of MOV/MKV/AVI then
 * can't be converted; MP4/WebM still play). Returns a stop function.
 */
export function startLinkRecheck(deps: OyelabsJobDeps): () => void {
  const queue = () => {
    try {
      enqueue(deps.db, { type: "oyelabs.links.recheck", payload: {} });
    } catch (error) {
      deps.log(`oyelabs: could not queue the link re-check: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const first = setTimeout(queue, 60_000);
  first.unref?.();
  const timer = setInterval(queue, LINK_RECHECK_INTERVAL_MS);
  timer.unref?.();
  if (deps.env.nodeEnv !== "test") {
    void systemMediaTools.available().then((ok) => {
      if (!ok) deps.log("Video conversion isn't available (ffmpeg not found). MP4 and WebM uploads still play; other formats can't be converted.");
    });
  }
  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}
