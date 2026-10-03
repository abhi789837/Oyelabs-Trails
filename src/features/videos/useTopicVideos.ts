import { useCallback, useEffect, useState } from "react";

import type { TopicVideosResponse, VideoPrefs } from "@shared/video";
import { DEFAULT_VIDEO_PREFS } from "@shared/video";

import { videosApi } from "./api";

export interface TopicVideos {
  data: TopicVideosResponse | null;
  status: "loading" | "ready" | "error";
  /** Replaces the state with a fresher one from a progress response. */
  apply: (next: TopicVideosResponse) => void;
  prefs: VideoPrefs;
  setAutoplayNext: (value: boolean) => void;
}

/** The topic's playlist state and the learner's autoplay preference, loaded once per topic visit. */
export function useTopicVideos(topicId: string): TopicVideos {
  const [data, setData] = useState<TopicVideosResponse | null>(null);
  const [status, setStatus] = useState<TopicVideos["status"]>("loading");
  const [prefs, setPrefs] = useState<VideoPrefs>(DEFAULT_VIDEO_PREFS);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    videosApi
      .topic(topicId, controller.signal)
      .then((result) => {
        setData(result);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
      });
    videosApi
      .prefs(controller.signal)
      .then(setPrefs)
      .catch(() => undefined);
    return () => controller.abort();
  }, [topicId]);

  const apply = useCallback(
    (next: TopicVideosResponse) => {
      if (next.topicId === topicId) setData(next);
    },
    [topicId],
  );

  const setAutoplayNext = useCallback((value: boolean) => {
    setPrefs((p) => ({ ...p, autoplayNext: value }));
    videosApi
      .savePrefs({ autoplayNext: value })
      .then(setPrefs)
      .catch(() => undefined);
  }, []);

  return { data, status, apply, prefs, setAutoplayNext };
}
