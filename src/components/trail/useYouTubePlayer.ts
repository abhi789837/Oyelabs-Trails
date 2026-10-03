import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * One YouTube IFrame Player per mount, created through the IFrame Player API so the page can read
 * the position and react to "ended". The API script (`https://www.youtube.com/iframe_api`) is loaded
 * once per page, however many players mount.
 *
 * The player replaces a DOM node it is given. React must never own that node, so the hook creates
 * it imperatively inside `hostRef` and removes it on unmount.
 */

/** The small part of the IFrame Player API this app uses. */
export interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getPlaybackRate(): number;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  loadVideoById(args: { videoId: string; startSeconds?: number; endSeconds?: number }): void;
  cueVideoById(args: { videoId: string; startSeconds?: number; endSeconds?: number }): void;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    options: {
      videoId: string;
      host?: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: Record<string, (event: { data: number; target: YTPlayer }) => void>;
    },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Player states from the API reference. */
export const YT_STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const;

const API_SRC = "https://www.youtube.com/iframe_api";
const API_TIMEOUT_MS = 12_000;
let apiPromise: Promise<YTNamespace> | null = null;

function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      apiPromise = null;
      reject(new Error("The YouTube player API did not load."));
    }, API_TIMEOUT_MS);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      window.clearTimeout(timer);
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("The YouTube player API loaded without a Player."));
    };
    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = API_SRC;
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timer);
        apiPromise = null;
        script.remove();
        reject(new Error("The YouTube player API could not be reached."));
      };
      document.head.appendChild(script);
    }
  });
  return apiPromise;
}

export interface PlayerHandlers {
  onReady?: (player: YTPlayer) => void;
  onStateChange?: (state: number, player: YTPlayer) => void;
  onError?: (code: number, player: YTPlayer) => void;
  onAutoplayBlocked?: () => void;
}

export interface YouTubePlayerOptions extends PlayerHandlers {
  /** The first video. Later videos are switched with `loadVideoById`, not by remounting. */
  videoId: string;
  start?: number;
  end?: number | null;
}

export interface YouTubePlayerHandle {
  playerRef: RefObject<YTPlayer | null>;
  ready: boolean;
  /** True when the API could not load (offline, blocked); the caller shows a plain embed instead. */
  failed: boolean;
}

export function useYouTubePlayer(hostRef: RefObject<HTMLDivElement | null>, options: YouTubePlayerOptions): YouTubePlayerHandle {
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const handlers = useRef<PlayerHandlers>(options);
  handlers.current = options;
  // Only the first video is used to construct the player.
  const initial = useRef({ videoId: options.videoId, start: options.start, end: options.end });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    const mount = document.createElement("div");
    mount.className = "h-full w-full";
    host.appendChild(mount);

    loadApi()
      .then((YT) => {
        if (cancelled) return;
        const { videoId, start, end } = initial.current;
        const playerVars: Record<string, string | number> = {
          enablejsapi: 1,
          origin: window.location.origin,
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
        };
        if (start) playerVars.start = Math.floor(start);
        if (end) playerVars.end = Math.ceil(end);
        playerRef.current = new YT.Player(mount, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars,
          events: {
            onReady: (event) => {
              if (cancelled) return;
              setReady(true);
              handlers.current.onReady?.(event.target);
            },
            onStateChange: (event) => handlers.current.onStateChange?.(event.data, event.target),
            onError: (event) => handlers.current.onError?.(event.data, event.target),
            onAutoplayBlocked: () => handlers.current.onAutoplayBlocked?.(),
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        // already gone
      }
      playerRef.current = null;
      host.replaceChildren();
    };
  }, [hostRef]);

  return { playerRef, ready, failed };
}
