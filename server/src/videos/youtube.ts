import { inArray } from "drizzle-orm";

import { parseIsoDuration } from "../../../shared/video";
import { schema, type Db } from "../db";
import { now } from "../lib/ids";

/**
 * Video lengths from the YouTube Data API v3 (`videos.list?part=contentDetails`, 1 quota unit per
 * call of up to 50 ids), cached for good in `video_meta` with source `data-api`.
 *
 * Optional: without `YOUTUBE_API_KEY` nothing here runs and the playlist falls back to the length
 * the player reports (source `player`) or the content's duration label. A failure never breaks a
 * request; it is logged and retried after an hour.
 */

const ENDPOINT = "https://www.googleapis.com/youtube/v3/videos";
const BATCH = 50;
const RETRY_AFTER_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 4000;

/** Ids the API was asked about recently and did not answer for (failed, private or deleted). */
const recentlyTried = new Map<string, number>();

export function youtubeApiKey(): string | null {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  return key ? key : null;
}

/** Test hook: forget which ids were tried. */
export function resetYouTubeCache(): void {
  recentlyTried.clear();
}

/**
 * Makes sure every id has a `data-api` duration when a key is configured. Returns how many rows were
 * written. Never throws.
 */
export async function ensureDataApiDurations(db: Db, videoIds: readonly string[], log?: (msg: string) => void): Promise<number> {
  const key = youtubeApiKey();
  if (!key) return 0;
  const unique = [...new Set(videoIds.filter(Boolean))];
  if (unique.length === 0) return 0;

  const known = new Set(
    db
      .select({ videoId: schema.videoMeta.videoId, source: schema.videoMeta.source })
      .from(schema.videoMeta)
      .where(inArray(schema.videoMeta.videoId, unique))
      .all()
      .filter((r) => r.source === "data-api")
      .map((r) => r.videoId),
  );
  const at = Date.now();
  const missing = unique.filter((id) => !known.has(id) && !((recentlyTried.get(id) ?? 0) > at - RETRY_AFTER_MS));
  if (missing.length === 0) return 0;

  let written = 0;
  for (let i = 0; i < missing.length; i += BATCH) {
    const ids = missing.slice(i, i + BATCH);
    for (const id of ids) recentlyTried.set(id, at);
    try {
      const url = `${ENDPOINT}?part=contentDetails&id=${encodeURIComponent(ids.join(","))}&key=${encodeURIComponent(key)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) {
        log?.(`youtube data api: HTTP ${res.status}`);
        continue;
      }
      const body = (await res.json()) as { items?: { id?: string; contentDetails?: { duration?: string } }[] };
      for (const item of body.items ?? []) {
        const seconds = parseIsoDuration(item.contentDetails?.duration);
        if (!item.id || !seconds) continue;
        const timestamp = now();
        db.insert(schema.videoMeta)
          .values({ videoId: item.id, durationSeconds: seconds, source: "data-api", updatedAt: timestamp })
          .onConflictDoUpdate({ target: schema.videoMeta.videoId, set: { durationSeconds: seconds, source: "data-api", updatedAt: timestamp } })
          .run();
        recentlyTried.delete(item.id);
        written++;
      }
    } catch (error) {
      log?.(`youtube data api: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return written;
}
