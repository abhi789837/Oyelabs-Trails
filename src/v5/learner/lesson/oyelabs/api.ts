import type { VideoProgressRequest } from "@shared/video";
import type { ActiveTimeSample, ModuleLessonResponse, ModulePlaylistResponse } from "@shared/videoSourcesCore";

import { api } from "@/api/client";

/** v4.5 Phase 2: the module lesson's calls (playlist, watch samples, "I've watched this"). */

const base = (topicId: string) => `/api/v5/oyelabs/lessons/${encodeURIComponent(topicId)}`;

export const moduleApi = {
  lesson: (topicId: string) => api.get<ModuleLessonResponse>(`${base(topicId)}/playlist`),
  exact: (topicId: string, videoId: string, body: VideoProgressRequest) => api.post<ModulePlaylistResponse>(`${base(topicId)}/videos/${encodeURIComponent(videoId)}/progress`, body),
  active: (topicId: string, videoId: string, body: ActiveTimeSample) => api.post<ModulePlaylistResponse>(`${base(topicId)}/videos/${encodeURIComponent(videoId)}/progress`, body),
  watched: (topicId: string, videoId: string) => api.post<ModulePlaylistResponse>(`${base(topicId)}/videos/${encodeURIComponent(videoId)}/watched`),
  prefs: () => api.get<{ autoplayNext: boolean }>("/api/me/prefs"),
  setPrefs: (autoplayNext: boolean) => api.put<{ autoplayNext: boolean }>("/api/me/prefs", { autoplayNext }),
};

/** A last sample while the page goes away: keepalive, never throws. */
export function sendOnExit(topicId: string, videoId: string, body: VideoProgressRequest | ActiveTimeSample): void {
  try {
    void fetch(`${base(topicId)}/videos/${encodeURIComponent(videoId)}/progress`, {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => undefined);
  } catch {
    // ignore
  }
}
