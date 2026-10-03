import type { ModuleVideoTotals, TopicVideosResponse, VideoLockMode, VideoPrefs, VideoProgressRequest } from "@shared/video";

import { api } from "@/api/client";

const topicBase = (topicId: string) => `/api/me/topics/${encodeURIComponent(topicId)}/videos`;

export interface VideoSettings {
  lockMode: VideoLockMode;
  unplayable: { videoId: string; code: number; at: number }[];
}

export const videosApi = {
  topic: (topicId: string, signal?: AbortSignal) => api.get<TopicVideosResponse>(topicBase(topicId), signal),
  progress: (topicId: string, videoId: string, body: VideoProgressRequest) =>
    api.post<TopicVideosResponse>(`${topicBase(topicId)}/${encodeURIComponent(videoId)}/progress`, body),
  error: (topicId: string, videoId: string, code: number) =>
    api.post<TopicVideosResponse>(`${topicBase(topicId)}/${encodeURIComponent(videoId)}/error`, { code }),
  moduleTotals: (trackId: string, moduleId: string, signal?: AbortSignal) =>
    api.get<ModuleVideoTotals>(`/api/me/modules/${trackId}/${moduleId}/videos`, signal),
  prefs: (signal?: AbortSignal) => api.get<VideoPrefs>("/api/me/prefs", signal),
  savePrefs: (prefs: Partial<VideoPrefs>) => api.put<VideoPrefs>("/api/me/prefs", prefs),
  settings: (signal?: AbortSignal) => api.get<VideoSettings>("/api/admin/video-settings", signal),
  saveSettings: (lockMode: VideoLockMode) => api.put<VideoSettings>("/api/admin/video-settings", { lockMode }),
  clearUnplayable: (videoId: string) => api.del<VideoSettings>(`/api/admin/video-settings/unplayable/${encodeURIComponent(videoId)}`),
};

/**
 * A last sample sent while the page is going away. `keepalive` lets the request outlive the page,
 * like sendBeacon, but keeps the JSON content type and the same-origin cookie.
 */
export function sendProgressOnExit(topicId: string, videoId: string, body: VideoProgressRequest): void {
  try {
    void fetch(`${topicBase(topicId)}/${encodeURIComponent(videoId)}/progress`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // The page is closing; there is nobody to tell.
  }
}
