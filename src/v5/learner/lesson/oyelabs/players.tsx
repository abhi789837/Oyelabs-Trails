import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { VideoProgressRequest } from "@shared/video";
import { SAMPLE_INTERVAL_SEC } from "@shared/videoCore";
import type { ActiveTimeSample, ModulePlaylistEntry } from "@shared/videoSourcesCore";

import { useYouTubePlayer, YT_STATE } from "@/components/trail/useYouTubePlayer";
import { VideoPlayerFrame } from "@/v5/design/components/Lesson";

import { useActiveTime } from "./useActiveTime";

/**
 * v4.5 Phase 2: the module lesson's players. All of them load nothing heavy until Play:
 * - YouTube: the Phase 9 facade, then the IFrame API (exact);
 * - Vimeo: a facade, then the Player SDK from player.vimeo.com (exact);
 * - HTML5 for uploads, Dropbox and direct files; `.m3u8` through hls.js, imported only then (exact);
 * - any other embed in an iframe, with active-time counting (estimated).
 */

export interface ExactProps {
  entry: ModulePlaylistEntry;
  autoplay: boolean;
  onSample: (body: VideoProgressRequest, exiting: boolean) => void;
  onEnded: () => void;
}

/** Reads a playhead every `SAMPLE_INTERVAL_SEC` while playing and reports the span played (v4.3). */
function useExactSampler(read: () => { position: number; duration: number } | null, onSample: ExactProps["onSample"]) {
  const playing = useRef(false);
  const lastPos = useRef(0);
  const lastWall = useRef(0);
  const readRef = useRef(read);
  readRef.current = read;
  const sampleRef = useRef(onSample);
  sampleRef.current = onSample;

  const flush = useCallback((exiting: boolean) => {
    const now = readRef.current();
    if (!now || !(now.position >= 0)) return;
    const wall = performance.now();
    const body: VideoProgressRequest = {
      from: lastPos.current,
      to: now.position,
      position: now.position,
      elapsed: Math.min(3600, Math.max(0, (wall - lastWall.current) / 1000)),
      ...(now.duration > 0 && Number.isFinite(now.duration) ? { duration: now.duration } : {}),
    };
    lastPos.current = now.position;
    lastWall.current = wall;
    sampleRef.current(body, exiting);
  }, []);

  const start = useCallback((position: number) => {
    playing.current = true;
    lastPos.current = position;
    lastWall.current = performance.now();
  }, []);
  const stop = useCallback(() => {
    if (playing.current) flush(false);
    playing.current = false;
  }, [flush]);
  /** A seek: what was played before it is sent, and counting restarts at the new position. */
  const jumped = useCallback(
    (position: number) => {
      if (playing.current) {
        flush(false);
        lastPos.current = position;
        lastWall.current = performance.now();
      }
    },
    [flush],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (playing.current) flush(false);
    }, SAMPLE_INTERVAL_SEC * 1000);
    const onHide = () => {
      if (playing.current && document.visibilityState === "hidden") flush(true);
    };
    const onPageHide = () => {
      if (playing.current) flush(true);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      if (playing.current) flush(true);
      playing.current = false;
    };
  }, [flush]);

  return useMemo(() => ({ start, stop, jumped }), [start, stop, jumped]);
}

// ---------------------------------------------------------------------------
// HTML5 (uploads, Dropbox, direct files, HLS)
// ---------------------------------------------------------------------------

export function Html5Player({ entry, autoplay, onSample, onEnded }: ExactProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const sampler = useExactSampler(() => (video.current ? { position: video.current.currentTime, duration: video.current.duration } : null), onSample);

  useEffect(() => {
    const el = video.current;
    const src = entry.playbackUrl;
    if (!el || !src) return undefined;
    let destroy: (() => void) | null = null;
    let cancelled = false;
    if (entry.playerKind === "hls" && !el.canPlayType("application/vnd.apple.mpegurl")) {
      void import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) return setFailed(true);
        const hls = new Hls({ enableWorker: false });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) setFailed(true);
        });
        hls.loadSource(src);
        hls.attachMedia(el);
        destroy = () => hls.destroy();
      }, () => setFailed(true));
    } else {
      el.src = src;
    }
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [entry.playbackUrl, entry.playerKind]);

  return (
    <VideoPlayerFrame title={entry.title}>
      <video
        ref={video}
        className="absolute inset-0 size-full bg-black"
        controls
        playsInline
        preload="metadata"
        autoPlay={autoplay}
        aria-label={entry.title}
        data-testid="oyelabs-html5"
        onLoadedMetadata={(e) => {
          if (entry.resumeAt > 1 && entry.resumeAt < e.currentTarget.duration - 5) e.currentTarget.currentTime = entry.resumeAt;
        }}
        onPlaying={(e) => sampler.start(e.currentTarget.currentTime)}
        onPause={() => sampler.stop()}
        onSeeked={(e) => sampler.jumped(e.currentTarget.currentTime)}
        onRateChange={(e) => {
          // Faster than 2× doesn't count (v4.3 MAX_PLAYBACK_RATE), so the player doesn't offer it.
          if (e.currentTarget.playbackRate > 2) e.currentTarget.playbackRate = 2;
        }}
        onEnded={() => {
          sampler.stop();
          onEnded();
        }}
        onError={() => setFailed(true)}
      />
      {failed ? (
        <div className="absolute inset-x-0 bottom-0 bg-black/80 px-3 py-2 text-small text-white" role="alert">
          This video couldn't load. Check your connection and reload the page. If it keeps happening, tell your admin.
        </div>
      ) : null}
    </VideoPlayerFrame>
  );
}

// ---------------------------------------------------------------------------
// YouTube (facade, then the IFrame API)
// ---------------------------------------------------------------------------

export function YouTubeModulePlayer({ entry, autoplay, onSample, onEnded }: ExactProps) {
  const host = useRef<HTMLDivElement>(null);
  const [activated, setActivated] = useState(autoplay);
  const sampler = useExactSampler(() => {
    const p = playerRef.current;
    try {
      return p ? { position: p.getCurrentTime(), duration: p.getDuration() } : null;
    } catch {
      return null;
    }
  }, onSample);
  const id = /\/embed\/([\w-]{11})/.exec(entry.embedUrl ?? "")?.[1] ?? "";
  const { playerRef, failed } = useYouTubePlayer(host, {
    enabled: activated,
    videoId: id,
    start: entry.resumeAt,
    playerVars: { cc_load_policy: 1, cc_lang_pref: "en", hl: "en" },
    onReady: (p) => {
      try {
        p.playVideo();
      } catch {
        // the player's own button still works
      }
    },
    onStateChange: (state, p) => {
      if (state === YT_STATE.PLAYING) sampler.start(p.getCurrentTime());
      else if (state === YT_STATE.PAUSED || state === YT_STATE.BUFFERING || state === YT_STATE.ENDED) sampler.stop();
      if (state === YT_STATE.ENDED) onEnded();
    },
  });
  return (
    <VideoPlayerFrame title={entry.title} ready={activated} poster={entry.thumbnailUrl ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`} onPlay={() => setActivated(true)}>
      {failed ? (
        <iframe className="absolute inset-0 size-full" src={`https://www.youtube.com/embed/${id}?rel=0&autoplay=1`} title={entry.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      ) : (
        <div ref={host} className="absolute inset-0" title={entry.title} />
      )}
    </VideoPlayerFrame>
  );
}

// ---------------------------------------------------------------------------
// Vimeo (facade, then the Player SDK)
// ---------------------------------------------------------------------------

interface VimeoPlayer {
  on(event: string, cb: (data: { seconds: number; duration: number }) => void): void;
  getCurrentTime(): Promise<number>;
  getDuration(): Promise<number>;
  setCurrentTime(s: number): Promise<number>;
  destroy(): Promise<void>;
}
declare global {
  interface Window {
    Vimeo?: { Player: new (el: HTMLIFrameElement) => VimeoPlayer };
  }
}

let vimeoSdk: Promise<void> | null = null;
function loadVimeoSdk(): Promise<void> {
  if (window.Vimeo) return Promise.resolve();
  vimeoSdk ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://player.vimeo.com/api/player.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      vimeoSdk = null;
      reject(new Error("vimeo sdk"));
    };
    document.head.appendChild(s);
  });
  return vimeoSdk;
}

export function VimeoModulePlayer({ entry, autoplay, onSample, onEnded }: ExactProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [activated, setActivated] = useState(autoplay);
  const state = useRef({ position: 0, duration: 0 });
  const sampler = useExactSampler(() => state.current, onSample);
  const endedRef = useRef(onEnded);
  endedRef.current = onEnded;

  useEffect(() => {
    if (!activated || !frame.current) return undefined;
    let player: VimeoPlayer | null = null;
    let cancelled = false;
    loadVimeoSdk().then(
      () => {
        if (cancelled || !frame.current || !window.Vimeo) return;
        player = new window.Vimeo.Player(frame.current);
        player.on("timeupdate", (d) => {
          state.current = { position: d.seconds, duration: d.duration };
        });
        player.on("play", (d) => {
          state.current = { position: d.seconds, duration: d.duration };
          sampler.start(d.seconds);
        });
        player.on("pause", () => sampler.stop());
        player.on("seeked", (d) => {
          state.current = { position: d.seconds, duration: d.duration };
          sampler.jumped(d.seconds);
        });
        player.on("ended", () => {
          sampler.stop();
          endedRef.current();
        });
        if (entry.resumeAt > 1) void player.setCurrentTime(entry.resumeAt).catch(() => undefined);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
      void player?.destroy().catch(() => undefined);
    };
  }, [activated, entry.resumeAt, sampler]);

  const src = entry.embedUrl ? `${entry.embedUrl}${entry.embedUrl.includes("?") ? "&" : "?"}autoplay=1&dnt=1` : "";
  return (
    <VideoPlayerFrame title={entry.title} ready={activated} poster={entry.thumbnailUrl ?? undefined} onPlay={() => setActivated(true)}>
      <iframe ref={frame} className="absolute inset-0 size-full" src={src} title={entry.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
    </VideoPlayerFrame>
  );
}

// ---------------------------------------------------------------------------
// Any other embed (estimated)
// ---------------------------------------------------------------------------

export function EmbedPlayer({ entry, onSample }: { entry: ModulePlaylistEntry; onSample: (sample: ActiveTimeSample, exiting: boolean) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [activated, setActivated] = useState(false);
  useActiveTime(frame, activated, onSample);
  return (
    <VideoPlayerFrame title={entry.title} ready={activated} poster={entry.thumbnailUrl ?? undefined} onPlay={() => setActivated(true)} playLabel={`Open the player for ${entry.title}`}>
      <iframe
        ref={frame}
        className="absolute inset-0 size-full"
        src={entry.embedUrl ?? "about:blank"}
        title={entry.title}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        data-testid="oyelabs-embed"
      />
    </VideoPlayerFrame>
  );
}
