import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useReducer, useRef, useState } from "react";
import { Check, ExternalLink, Play } from "lucide-react";

import type { ServedVideo } from "@shared/content";
import {
  formatClock,
  SAMPLE_INTERVAL_SEC,
  UNPLAYABLE_ERROR_CODES,
  type TopicVideosResponse,
  type TopicVideoState,
  type VideoProgressRequest,
} from "@shared/video";

import { Button } from "@/components/ui/button";
import { sendProgressOnExit, videosApi } from "@/features/videos/api";
import type { TopicVideos } from "@/features/videos/useTopicVideos";
import { cn } from "@/lib/utils";
import { initialUpNext, nextIndexAfter, upNextReducer } from "./upNext";
import { useYouTubePlayer, YT_STATE } from "./useYouTubePlayer";
import { VideoPlayer } from "./VideoPlayer";

export interface VideoPlaylistHandle {
  /** Selects a video by its key and starts it (used by "Watch next" links elsewhere on the page). */
  play: (key: string) => void;
}

interface VideoPlaylistProps {
  topicId: string;
  videos: TopicVideos;
  /** The served videos, for a plain embed if the playlist state cannot be loaded. */
  fallback: { video: ServedVideo; alternates?: ServedVideo[] };
}

/**
 * The topic's videos as a Udemy-style playlist: the player on the left, "Videos in this topic" on
 * the right (below on small screens). Watching is sampled every 5 seconds and sent to the server,
 * which decides what counts (shared/video.ts). When a video ends, "Up next" counts down 5 seconds
 * and plays the next one, unless the learner turned autoplay off or pressed Cancel.
 */
export const VideoPlaylist = forwardRef<VideoPlaylistHandle, VideoPlaylistProps>(function VideoPlaylist({ topicId, videos, fallback }, ref) {
  if (videos.status === "error") {
    return <VideoPlayer video={fallback.video} alternates={fallback.alternates} />;
  }
  if (!videos.data) {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]" aria-busy="true">
        <div className="aspect-video animate-pulse rounded-md border bg-surface" />
        <div className="hidden h-40 animate-pulse rounded-md border bg-surface lg:block" />
      </div>
    );
  }
  if (videos.data.videos.length === 0) {
    return <VideoPlayer video={fallback.video} alternates={fallback.alternates} />;
  }
  return <Playlist ref={ref} topicId={topicId} data={videos.data} videos={videos} />;
});

function firstUnwatched(items: TopicVideoState[]): number {
  const index = items.findIndex((v) => v.status !== "watched" && v.status !== "unavailable");
  return index === -1 ? 0 : index;
}

const Playlist = forwardRef<VideoPlaylistHandle, { topicId: string; data: TopicVideosResponse; videos: TopicVideos }>(function Playlist(
  { topicId, data, videos },
  ref,
) {
  const items = data.videos;
  const [current, setCurrent] = useState(() => firstUnwatched(items));
  const [upNext, dispatch] = useReducer(upNextReducer, initialUpNext);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [playerDuration, setPlayerDuration] = useState<Record<string, number>>({});
  const [announcement, setAnnouncement] = useState("");
  const listId = useId();

  const hostRef = useRef<HTMLDivElement>(null);
  const playNowRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Latest values for the player callbacks, which are bound once.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const currentRef = useRef(current);
  currentRef.current = current;
  const autoplayRef = useRef(videos.prefs.autoplayNext);
  autoplayRef.current = videos.prefs.autoplayNext;
  const applyRef = useRef(videos.apply);
  applyRef.current = videos.apply;

  // Sampling state: where the last sample left off, on both clocks.
  const tracking = useRef(false);
  const lastPos = useRef(0);
  const lastWall = useRef(0);

  const first = items[current];
  const { playerRef, ready, failed } = useYouTubePlayer(hostRef, {
    videoId: first.videoId,
    start: first.resumeAt,
    end: first.segment.end,
    onStateChange: (state, player) => {
      if (state === YT_STATE.PLAYING) {
        setErrorCode(null);
        if (!tracking.current) {
          tracking.current = true;
          lastPos.current = player.getCurrentTime();
          lastWall.current = performance.now();
        }
        dispatch({ type: "reset" });
        const d = player.getDuration();
        const key = itemsRef.current[currentRef.current]?.key;
        if (d > 0 && key) setPlayerDuration((m) => (m[key] === d ? m : { ...m, [key]: d }));
        return;
      }
      if (state === YT_STATE.PAUSED || state === YT_STATE.BUFFERING || state === YT_STATE.ENDED) {
        if (tracking.current) flush(false);
        tracking.current = false;
      }
      if (state === YT_STATE.ENDED) {
        const next = nextIndexAfter(currentRef.current, itemsRef.current);
        dispatch({ type: "ended", nextIndex: next, autoplay: autoplayRef.current });
      }
    },
    onError: (code) => {
      setErrorCode(code);
      tracking.current = false;
      const entry = itemsRef.current[currentRef.current];
      if (entry && (UNPLAYABLE_ERROR_CODES as readonly number[]).includes(code)) {
        videosApi.error(topicId, entry.videoId, code).then(applyRef.current).catch(() => undefined);
      }
    },
  });

  /** Sends what was played since the last sample. The server decides what counts. */
  const flush = useCallback(
    (exiting: boolean) => {
      const player = playerRef.current;
      const entry = itemsRef.current[currentRef.current];
      if (!player || !entry) return;
      let position: number;
      let duration: number;
      try {
        position = player.getCurrentTime();
        duration = player.getDuration();
      } catch {
        return;
      }
      const wall = performance.now();
      const body: VideoProgressRequest = {
        from: lastPos.current,
        to: position,
        position,
        elapsed: Math.min(3600, Math.max(0, (wall - lastWall.current) / 1000)),
        ...(duration > 0 ? { duration } : {}),
      };
      lastPos.current = position;
      lastWall.current = wall;
      if (!(position >= 0)) return;
      if (exiting) sendProgressOnExit(topicId, entry.videoId, body);
      else videosApi.progress(topicId, entry.videoId, body).then(applyRef.current).catch(() => undefined);
    },
    [playerRef, topicId],
  );

  // Every 5 seconds while playing.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (tracking.current) flush(false);
    }, SAMPLE_INTERVAL_SEC * 1000);
    return () => window.clearInterval(timer);
  }, [flush]);

  // Leaving the page or the tab: one last sample that outlives the page.
  useEffect(() => {
    const onHide = () => {
      if (tracking.current) flush(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      onHide();
    };
  }, [flush]);

  const select = useCallback(
    (index: number, autoplay = true) => {
      const entry = itemsRef.current[index];
      const player = playerRef.current;
      if (!entry) return;
      if (tracking.current) flush(false);
      tracking.current = false;
      dispatch({ type: "reset" });
      setErrorCode(null);
      setCurrent(index);
      if (!player) return;
      const args = { videoId: entry.videoId, startSeconds: entry.resumeAt, ...(entry.segment.end ? { endSeconds: entry.segment.end } : {}) };
      if (autoplay) player.loadVideoById(args);
      else player.cueVideoById(args);
    },
    [flush, playerRef],
  );

  useImperativeHandle(
    ref,
    () => ({
      play: (key: string) => {
        const index = itemsRef.current.findIndex((v) => v.key === key);
        if (index >= 0) select(index);
        hostRef.current?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      },
    }),
    [select],
  );

  // The countdown.
  useEffect(() => {
    if (upNext.phase === "counting") {
      const timer = window.setTimeout(() => dispatch({ type: "tick" }), 1000);
      return () => window.clearTimeout(timer);
    }
    if (upNext.phase === "advance") {
      const fromOverlay = document.activeElement === playNowRef.current;
      select(upNext.nextIndex);
      if (fromOverlay) itemRefs.current[upNext.nextIndex]?.focus({ preventScroll: true });
    }
    return undefined;
  }, [upNext, select]);

  // Announce the overlay once, and move focus to Play now so the keyboard can act on it.
  const overlayOpen = upNext.phase === "counting" || upNext.phase === "waiting";
  const nextTitle = overlayOpen ? items[upNext.nextIndex]?.title : null;
  useEffect(() => {
    if (!overlayOpen || !nextTitle) return;
    setAnnouncement(
      upNext.phase === "counting" ? `Up next: ${nextTitle}. Plays in 5 seconds. Press Cancel to stay.` : `Up next: ${nextTitle}. Press Play now to start it.`,
    );
    playNowRef.current?.focus({ preventScroll: true });
    // Only when the overlay opens, not on every tick, hence the narrow dependencies.
  }, [overlayOpen, nextTitle]);

  // Announce a video becoming watched.
  const watchedKeys = useRef(new Set(items.filter((v) => v.watched).map((v) => v.key)));
  useEffect(() => {
    for (const v of items) {
      if (v.watched && !watchedKeys.current.has(v.key)) {
        watchedKeys.current.add(v.key);
        setAnnouncement(`Video ${v.order} watched. ${data.watchedCount} of ${data.total} videos watched.`);
      }
    }
  }, [items, data.watchedCount, data.total]);

  const cancel = () => {
    dispatch({ type: "cancel" });
    itemRefs.current[current]?.focus({ preventScroll: true });
  };

  const entry = items[current];
  const youtubeUrl = `https://www.youtube.com/watch?v=${entry.videoId}${entry.segment.start ? `&t=${entry.segment.start}s` : ""}`;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="min-w-0">
        <div
          className="relative aspect-video overflow-hidden rounded-md border bg-black"
          onKeyDown={(event) => {
            if (overlayOpen && event.key === "Escape") {
              event.stopPropagation();
              cancel();
            }
          }}
        >
          {failed ? (
            <iframe
              key={entry.key}
              src={`https://www.youtube.com/embed/${entry.videoId}?start=${entry.resumeAt}&rel=0`}
              title={entry.title}
              className="h-full w-full"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div ref={hostRef} className="h-full w-full" title={entry.title} />
          )}
          {!ready && !failed && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-white/70">Loading the player…</div>
          )}

          {overlayOpen && nextTitle && (
            <div
              role="group"
              aria-label="Up next"
              className="absolute inset-0 flex items-center justify-center bg-black/85 px-4 text-white motion-safe:animate-in motion-safe:fade-in"
            >
              <div className="max-w-sm text-center">
                <p className="text-xs text-white/70">Up next</p>
                <p className="mt-1 line-clamp-2 font-display text-lg font-semibold">{nextTitle}</p>
                {upNext.phase === "counting" && (
                  <p className="mt-1 font-mono text-sm text-white/80" aria-hidden="true">
                    in {upNext.secondsLeft}s
                  </p>
                )}
                <div className="mt-4 flex justify-center gap-2">
                  <Button ref={playNowRef} size="sm" onClick={() => dispatch({ type: "playNow" })}>
                    <Play aria-hidden="true" />
                    Play now
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancel} className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="sr-only" aria-live="polite" role="status">
          {announcement}
        </p>

        {errorCode !== null && (
          <p className="mt-2 rounded-md border border-destructive/40 px-3 py-2 text-sm">
            {(UNPLAYABLE_ERROR_CODES as readonly number[]).includes(errorCode)
              ? "This video can't be played inside Oyelearn (the owner may have turned off embedding, or it was removed). It no longer counts towards this topic. You can still try it on YouTube."
              : "The player hit a problem. Try again, or open the video on YouTube."}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
          <p className="min-w-0">
            <span className="font-medium">{entry.title}</span>
            <span className="text-muted-foreground"> by {entry.channel}</span>
          </p>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            Watch on YouTube
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab; watching there is not tracked)</span>
          </a>
        </div>
        {entry.segment.start > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Starts at {formatClock(entry.segment.start)}
            {entry.chapterLabel ? `, the "${entry.chapterLabel}" chapter of a longer course` : " in a longer course"}
            {entry.requiredSeconds ? `. This topic asks for ${formatClock(entry.requiredSeconds)} of it.` : "."}
          </p>
        )}
        {failed && (
          <p className="mt-1 text-xs text-muted-foreground">
            The YouTube player API didn't load, so watching can't be tracked right now. Reload the page to try again.
          </p>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 id={`${listId}-title`} className="min-w-0 text-sm font-semibold">
            Videos in this topic
          </h3>
          <AutoplayToggle checked={videos.prefs.autoplayNext} onChange={videos.setAutoplayNext} />
        </div>
        <ol aria-labelledby={`${listId}-title`} className="mt-2 space-y-1.5 lg:max-h-[24rem] lg:overflow-y-auto lg:pr-1">
          {items.map((item, index) => (
            <li key={item.key}>
              <PlaylistItem
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                item={item}
                current={index === current}
                fallbackDuration={playerDuration[item.key] ?? null}
                onSelect={() => select(index)}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
});

const statusText: Record<TopicVideoState["status"], string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  watched: "Watched",
  unavailable: "Unavailable",
};

const PlaylistItem = forwardRef<
  HTMLButtonElement,
  { item: TopicVideoState; current: boolean; fallbackDuration: number | null; onSelect: () => void }
>(function PlaylistItem({ item, current, fallbackDuration, onSelect }, ref) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const length = item.requiredSeconds ?? (fallbackDuration ? fallbackDuration - item.segment.start : null);
  const pct = Math.round(item.progress * 100);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      aria-current={current ? "true" : undefined}
      className={cn(
        "flex w-full gap-2.5 rounded-md border p-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
        current ? "border-trailmark/70 bg-trailmark/10" : "border-transparent hover:border-foreground/20 hover:bg-surface",
      )}
    >
      <span className="relative block aspect-video w-24 shrink-0 overflow-hidden rounded-[3px] bg-surface-sunken">
        {!thumbFailed && (
          <img
            src={`https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            onError={() => setThumbFailed(true)}
          />
        )}
        <span className="absolute left-1 top-1 rounded-[3px] bg-black/75 px-1 font-mono text-[10px] leading-4 text-white">{item.order}</span>
        {item.status === "watched" && (
          <span className="absolute inset-0 flex items-center justify-center bg-summit/55">
            <Check className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("line-clamp-2 text-xs leading-snug", current && "font-semibold")}>{item.title}</span>
        <span className="mt-1 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          {length ? <span>{formatClock(length)}</span> : null}
          <span className={cn(item.status === "watched" && "text-summit-strong", item.status === "in-progress" && "text-trailmark-strong")}>
            {item.status === "watched" ? "Watched ✓" : item.status === "in-progress" ? `${pct}%` : statusText[item.status]}
          </span>
          {current && <span className="sr-only">, playing now</span>}
        </span>
        {item.status === "in-progress" && (
          <span className="mt-1 block h-1 overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
            <span className="block h-full rounded-full bg-trailmark" style={{ width: `${pct}%` }} />
          </span>
        )}
        <span className="sr-only">{item.status === "in-progress" ? `, in progress, ${pct}% watched` : `, ${statusText[item.status]}`}</span>
      </span>
    </button>
  );
});

function AutoplayToggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-1 py-0.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
    >
      <span
        aria-hidden="true"
        className={cn("relative inline-block h-4 w-7 rounded-full transition-colors", checked ? "bg-trailmark" : "bg-foreground/20")}
      >
        <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform", checked ? "translate-x-3.5" : "translate-x-0.5")} />
      </span>
      Autoplay
    </button>
  );
}
