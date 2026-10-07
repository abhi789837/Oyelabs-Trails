import { asc, eq } from "drizzle-orm";

import { schema, type Db } from "../../db";

/**
 * v4.5: how long one Oyelabs module takes, for its managed lesson's `est_minutes` (PLAN.md §4.1).
 *
 * Videos count their real length when it is known. A video whose length we don't know yet counts
 * as `UNKNOWN_VIDEO_MINUTES`, so a module of embeds doesn't show "0 min". Each document adds
 * `DOC_MINUTES` and the module test adds `TEST_MINUTES`.
 */
export const UNKNOWN_VIDEO_MINUTES = 5;
export const DOC_MINUTES = 5;
export const TEST_MINUTES = 10;

/** Pure: the estimate from the video lengths (seconds, null = unknown) and the number of docs. */
export function estimateModuleMinutes(videoSeconds: readonly (number | null)[], docCount: number): number {
  const videos = videoSeconds.reduce<number>((sum, s) => sum + (s != null && s > 0 ? s / 60 : UNKNOWN_VIDEO_MINUTES), 0);
  return Math.max(1, Math.min(600, Math.round(videos + docCount * DOC_MINUTES + TEST_MINUTES)));
}

/**
 * Recomputes a module lesson's `est_minutes` from its videos and docs and stores it. Returns the
 * new value, or null when `topicId` is not a module lesson. Builder B calls this after a video's
 * length is found; the editor calls it on every save.
 */
export function moduleMinutes(db: Db, topicId: string): number | null {
  const topic = db.select({ sectionId: schema.courseTopics.sectionId, kind: schema.courseTopics.kind }).from(schema.courseTopics).where(eq(schema.courseTopics.id, topicId)).get();
  if (!topic || topic.kind !== "module") return null;
  const videos = db
    .select({ seconds: schema.courseVideos.durationSeconds })
    .from(schema.courseVideos)
    .where(eq(schema.courseVideos.topicId, topicId))
    .orderBy(asc(schema.courseVideos.position))
    .all();
  const docs = db.select({ id: schema.courseDocs.id }).from(schema.courseDocs).where(eq(schema.courseDocs.sectionId, topic.sectionId)).all();
  const minutes = estimateModuleMinutes(
    videos.map((v) => v.seconds),
    docs.length,
  );
  db.update(schema.courseTopics).set({ estMinutes: minutes }).where(eq(schema.courseTopics.id, topicId)).run();
  return minutes;
}
