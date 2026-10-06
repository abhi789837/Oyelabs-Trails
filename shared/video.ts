import { z } from "zod";

import { VIDEO_LOCK_MODES } from "./videoCore";

/**
 * v4.3 topic video playlist: the request schemas (zod). The watch-tracking rules live in the
 * zod-free `./videoCore` and are re-exported here, so existing imports of `@shared/video` keep
 * working; client code in the lesson's first download imports values from `@shared/videoCore`.
 */
export * from "./videoCore";

export const videoIdSchema = z.string().regex(/^[A-Za-z0-9_-]{6,20}$/, "Not a YouTube video id.");

export const videoProgressRequestSchema = z.object({
  from: z.number().min(0).max(86_400),
  to: z.number().min(0).max(86_400),
  position: z.number().min(0).max(86_400),
  /** Wall seconds since the previous sample. Defaults to one sampling interval. */
  elapsed: z.number().min(0).max(3600).optional(),
  /** What the player reports as the video's length (0 until metadata loads, so 0 is ignored). */
  duration: z.number().min(0).max(86_400).optional(),
});

export type VideoProgressRequest = z.infer<typeof videoProgressRequestSchema>;

export const videoErrorRequestSchema = z.object({ code: z.number().int() });

export const videoPrefsSchema = z.object({ autoplayNext: z.boolean() });

export const videoLockModeSchema = z.object({ lockMode: z.enum(VIDEO_LOCK_MODES) });
