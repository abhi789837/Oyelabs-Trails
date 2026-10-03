import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { SessionUser } from "../../../shared/auth";
import { servedModuleParamsSchema } from "../../../shared/content";
import {
  UNPLAYABLE_ERROR_CODES,
  videoErrorRequestSchema,
  videoIdSchema,
  videoLockModeSchema,
  videoPrefsSchema,
  videoProgressRequestSchema,
  type ModuleVideoTotals,
  type TopicVideosResponse,
  type VideoPrefs,
} from "../../../shared/video";
import { requireActiveUser, requireStaff, staffOnly } from "../auth/guards";
import type { AuthoredTopic } from "../content/store";
import { writeAudit } from "../lib/audit";
import { badRequest, notFound, parseOrThrow } from "../lib/errors";
import { allowedTopicIdsFor } from "../plans/repo";
import {
  clearUnplayable,
  getVideoLockMode,
  getVideoPrefs,
  listUnplayable,
  markUnplayable,
  moduleVideoTotals,
  playlistEntries,
  recordVideoSample,
  setVideoLockMode,
  setVideoPrefs,
  topicVideosView,
} from "../videos/repo";
import { ensureDataApiDurations } from "../videos/youtube";

const topicParams = z.object({ topicId: z.string().min(1).max(120) });
const videoParams = topicParams.extend({ videoId: videoIdSchema });

/** The topic, when this caller may open it. Same 404 wording as the attempt route. */
function topicFor(app: FastifyInstance, user: SessionUser, topicId: string): AuthoredTopic {
  const allowed = allowedTopicIdsFor(app.db, user);
  if (allowed !== null && !allowed.has(topicId)) throw notFound("That waypoint isn't part of your plan.");
  const found = app.content.getTopic(topicId);
  if (!found) throw notFound("That waypoint doesn't exist.");
  return found.topic;
}

/**
 * v4.3 topic video playlist: per-video watch progress, the autoplay preference, module totals, and
 * the admin's lock switch. The rules live in shared/video.ts; the lock itself is enforced in
 * routes/topics.ts on the attempt endpoint.
 */
export async function registerVideoRoutes(app: FastifyInstance): Promise<void> {
  const log = (msg: string) => app.log.warn(msg);

  app.get("/api/me/topics/:topicId/videos", async (request): Promise<TopicVideosResponse> => {
    const user = requireActiveUser(request);
    const { topicId } = parseOrThrow(topicParams, request.params, "Unknown waypoint.");
    const topic = topicFor(app, user, topicId);
    await ensureDataApiDurations(app.db, playlistEntries(app.content, topic).map((e) => e.video.videoId), log);
    return topicVideosView(app.db, app.content, user, topic);
  });

  /**
   * One player sample, sent every 5 s while playing and on pause, end and leaving the page. Returns
   * the topic's whole state so the playlist and the lock update from one response.
   */
  app.post(
    "/api/me/topics/:topicId/videos/:videoId/progress",
    { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } },
    async (request): Promise<TopicVideosResponse> => {
      const user = requireActiveUser(request);
      const { topicId, videoId } = parseOrThrow(videoParams, request.params, "Unknown video.");
      const body = parseOrThrow(videoProgressRequestSchema, request.body);
      const topic = topicFor(app, user, topicId);
      if (!playlistEntries(app.content, topic).some((e) => e.video.videoId === videoId)) {
        throw notFound("That video isn't part of this waypoint.");
      }
      recordVideoSample(app.db, app.content, user.id, topic, videoId, body);
      return topicVideosView(app.db, app.content, user, topic);
    },
  );

  /** The player could not play this video at all (100 not found, 101/150 embedding disabled). */
  app.post(
    "/api/me/topics/:topicId/videos/:videoId/error",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request): Promise<TopicVideosResponse> => {
      const user = requireActiveUser(request);
      const { topicId, videoId } = parseOrThrow(videoParams, request.params, "Unknown video.");
      const { code } = parseOrThrow(videoErrorRequestSchema, request.body);
      const topic = topicFor(app, user, topicId);
      if (!playlistEntries(app.content, topic).some((e) => e.video.videoId === videoId)) {
        throw notFound("That video isn't part of this waypoint.");
      }
      if (!(UNPLAYABLE_ERROR_CODES as readonly number[]).includes(code)) throw badRequest("That error is not permanent.");
      markUnplayable(app.db, videoId, code, user.id);
      return topicVideosView(app.db, app.content, user, topic);
    },
  );

  /** Watched and total video time for one module, for the camp page. */
  app.get("/api/me/modules/:trackId/:moduleId/videos", async (request): Promise<ModuleVideoTotals> => {
    const user = requireActiveUser(request);
    const { trackId, moduleId } = parseOrThrow(servedModuleParamsSchema, request.params, "Unknown module.");
    const mod = app.content.getModule(trackId, moduleId);
    if (!mod) throw notFound("That camp doesn't exist.");
    const allowed = allowedTopicIdsFor(app.db, user);
    if (allowed !== null && !mod.topics.some((t) => allowed.has(t.id))) throw notFound("That camp isn't part of your plan.");
    const ids = mod.topics.filter((t) => allowed === null || allowed.has(t.id)).flatMap((t) => playlistEntries(app.content, t).map((e) => e.video.videoId));
    await ensureDataApiDurations(app.db, ids, log);
    return moduleVideoTotals(app.db, app.content, user.id, mod, allowed);
  });

  app.get("/api/me/prefs", async (request): Promise<VideoPrefs> => {
    const user = requireActiveUser(request);
    return getVideoPrefs(app.db, user.id);
  });

  app.put("/api/me/prefs", async (request): Promise<VideoPrefs> => {
    const user = requireActiveUser(request);
    const body = parseOrThrow(videoPrefsSchema.partial(), request.body ?? {});
    return setVideoPrefs(app.db, user.id, body);
  });
}

/** Staff: the lock switch, and the videos players reported as unplayable. */
export async function registerAdminVideoRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  app.get("/api/admin/video-settings", async () => ({ lockMode: getVideoLockMode(app.db), unplayable: listUnplayable(app.db) }));

  app.put("/api/admin/video-settings", async (request) => {
    const actor = requireStaff(request);
    const { lockMode } = parseOrThrow(videoLockModeSchema, request.body);
    setVideoLockMode(app.db, lockMode);
    writeAudit(app.db, { actorId: actor.id, action: "videos.lock_mode_updated", details: { lockMode } });
    return { lockMode: getVideoLockMode(app.db), unplayable: listUnplayable(app.db) };
  });

  /** An admin checked the video and it plays again: count it towards the lock once more. */
  app.delete("/api/admin/video-settings/unplayable/:videoId", async (request) => {
    const actor = requireStaff(request);
    const { videoId } = parseOrThrow(z.object({ videoId: videoIdSchema }), request.params);
    clearUnplayable(app.db, videoId);
    writeAudit(app.db, { actorId: actor.id, action: "videos.unplayable_cleared", targetType: "video", targetId: videoId });
    return { lockMode: getVideoLockMode(app.db), unplayable: listUnplayable(app.db) };
  });
}
