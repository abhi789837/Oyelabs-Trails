import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useReducer, useRef, useState } from "react";
import { Captions, CaptionsOff, ExternalLink, NotebookPen, Play } from "lucide-react";

import type { ServedTopic } from "@shared/content";
import { formatClock, SAMPLE_INTERVAL_SEC, UNPLAYABLE_ERROR_CODES, type TopicVideoState } from "@shared/videoCore";
import type { VideoProgressRequest } from "@shared/video";

import { initialUpNext, nextIndexAfter, upNextReducer } from "@/components/trail/upNext";
import { useYouTubePlayer, YT_STATE, type YTPlayer } from "@/components/trail/useYouTubePlayer";
import { sendProgressOnExit, videosApi } from "@/features/videos/api";
import type { TopicVideos } from "@/features/videos/useTopicVideos";
import { cn } from "@/v5/design/cn";
import { Button } from "@/v5/design/components/Button";
import { PlaylistSidebar, StatusLine, VideoPlayerFrame, type PlaylistEntry } from "@/v5/design/components/Lesson";

import { posterUrl } from "@/v5/app/routePlan";

import { NotesPanel, type NotesPanelHandle } from "../NotesPanel";

export const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
/** Captions on unless the learner turned them off (a per-browser convenience). */
const CAPTIONS_KEY = "oyelearn-v5-captions";

function readCaptionsPref(): boolean {
  try {
    return localStorage.getItem(CAPTIONS_KEY) !== "off";
  } catch {
    return true;
  }
}

/** The IFrame API calls the hook's interface leaves out. */
type FullPlayer = YTPlayer & {
  setPlaybackRate?: (rate: number) => void;
  loadModule?: (name: string) => void;
  unloadModule?: (name: string) => void;
  setOption?: (module: string, option: string, value: unknown) => void;
};

export interface WatchControls {
  togglePlay: () => void;
  seekBy: (seconds: number) => void;
  noteNow: () => void;
}

export interface WatchStepProps {
  topic: ServedTopic;
  videos: TopicVideos;
  /** Where to start: from `?t=` or the saved state. */
  resume: { videoId: string | null; seconds: number | null };
  onPosition: (videoId: string, seconds: number) => void;
  /** A video ended (natural break): the parent may show the quick check. */
  onVideoEnded: (allWatched: boolean) => void;
  /** Optional transcript, by video id. None exist for YouTube today; the panel shows only when one does. */
  transcripts?: Record<string, { at: number; text: string }[]>;
}

function firstUnwatched(items: TopicVideoState[]): number {
  const i = items.findIndex((v) => v.status !== "watched" && v.status !== "unavailable");
  return i === -1 ? 0 : i;
}

/**
 * The Watch step: the v4.3 playlist (watch tracking, ticks, autoplay-next countdown) in the v5
 * player frame, with captions on, speed, chapters, timestamped notes and the keyboard controls the
 * lesson player sends through `WatchControls`.
 */
export const WatchStep = forwardRef<WatchControls, WatchStepProps>(function WatchStep(props, ref) {
  const { videos, topic } = props;
  if (videos.status === "error" || (videos.data && videos.data.videos.length === 0)) {
    return <PlainEmbed topic={topic} />;
  }
  if (!videos.data) {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-busy="true">
        <div className="aspect-video animate-pulse rounded-card bg-sunken" />
        <div className="hidden h-48 animate-pulse rounded-card bg-sunken lg:block" />
      </div>
    );
  }
  return <Player ref={ref} {...props} />;
});

const Player = forwardRef<WatchControls, WatchStepProps>(function Player({ topic, videos, resume, onPosition, onVideoEnded, transcripts }, ref) {
  const data = videos.data!;
  const items = data.videos;
  const [current, setCurrent] = useState(() => {
    const saved = resume.videoId ? items.findIndex((v) => v.videoId === resume.videoId) : -1;
    return saved >= 0 ? saved : firstUnwatched(items);
  });
  const [upNext, dispatch] = useReducer(upNextReducer, initialUpNext);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [speed, setSpeed] = useState(1);
  const [captions, setCaptions] = useState(readCaptionsPref);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [now, setNow] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const hostRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<NotesPanelHandle>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const currentRef = useRef(current);
  currentRef.current = current;
  const autoplayRef = useRef(videos.prefs.autoplayNext);
  autoplayRef.current = videos.prefs.autoplayNext;
  const applyRef = useRef(videos.apply);
  applyRef.current = videos.apply;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const onPositionRef = useRef(onPosition);
  onPositionRef.current = onPosition;
  const onEndedRef = useRef(onVideoEnded);
  onEndedRef.current = onVideoEnded;

  const tracking = useRef(false);
  const lastPos = useRef(0);
  const lastWall = useRef(0);

  /*
   * Phase 9 performance: a facade. Until someone presses Play (or seeks from a chapter, a note or the
   * transcript, or presses K), the lesson shows the video's thumbnail and a Play button instead of
   * the YouTube player, whose ~1.3 MB of code used to load with every lesson. The player is then
   * created at the chosen moment and starts playing. A link with `?t=` (a note's time) asks for a
   * moment, so it creates the player straight away, as before.
   */
  const [activated, setActivated] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).has("t");
    } catch {
      return false;
    }
  });
  const pendingStart = useRef<number | null>(null);
  const autoplayOnReady = useRef(false);
  const activatedRef = useRef(activated);
  activatedRef.current = activated;

  const first = items[current];
  const resumeAt = resume.videoId === first.videoId && resume.seconds !== null ? Math.max(first.segment.start, resume.seconds) : first.resumeAt;
  const startAt = pendingStart.current ?? resumeAt;
  const { playerRef, ready, failed } = useYouTubePlayer(hostRef, {
    enabled: activated,
    videoId: first.videoId,
    start: startAt,
    end: first.segment.end,
    playerVars: captions ? { cc_load_policy: 1, cc_lang_pref: "en", hl: "en" } : { hl: "en" },
    onReady: (player) => {
      try {
        (player as FullPlayer).setPlaybackRate?.(speedRef.current);
      } catch {
        // ignore
      }
      if (autoplayOnReady.current) {
        autoplayOnReady.current = false;
        try {
          player.playVideo();
        } catch {
          // The browser may refuse; the player's own play button still works.
        }
      }
    },
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
        if (d > 0 && key) setDurations((m) => (m[key] === d ? m : { ...m, [key]: d }));
        return;
      }
      if (state === YT_STATE.PAUSED || state === YT_STATE.BUFFERING || state === YT_STATE.ENDED) {
        if (tracking.current) flush(false);
        tracking.current = false;
      }
      if (state === YT_STATE.ENDED) {
        const next = nextIndexAfter(currentRef.current, itemsRef.current);
        dispatch({ type: "ended", nextIndex: next, autoplay: autoplayRef.current });
        const rest = itemsRef.current.filter((v, i) => i !== currentRef.current && !v.watched && v.status !== "unavailable");
        onEndedRef.current(rest.length === 0);
      }
    },
    onError: (code) => {
      setErrorCode(code);
      tracking.current = false;
      const entry = itemsRef.current[currentRef.current];
      if (entry && (UNPLAYABLE_ERROR_CODES as readonly number[]).includes(code)) {
        videosApi.error(topic.id, entry.videoId, code).then(applyRef.current).catch(() => undefined);
      }
    },
  });

  /** Sends what was played since the last sample; the server decides what counts. */
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
      onPositionRef.current(entry.videoId, position);
      if (exiting) sendProgressOnExit(topic.id, entry.videoId, body);
      else videosApi.progress(topic.id, entry.videoId, body).then(applyRef.current).catch(() => undefined);
    },
    [playerRef, topic.id],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (tracking.current) flush(false);
      try {
        const t = playerRef.current?.getCurrentTime();
        if (typeof t === "number" && Number.isFinite(t)) setNow(t);
      } catch {
        // not ready
      }
    }, SAMPLE_INTERVAL_SEC * 1000);
    return () => window.clearInterval(timer);
  }, [flush, playerRef]);

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

  /** Creates the player (the facade's Play): at `at` seconds, or where this video would resume. */
  const activate = useCallback((at?: number) => {
    if (at !== undefined) pendingStart.current = Math.max(0, at);
    autoplayOnReady.current = true;
    setActivated(true);
  }, []);

  const select = useCallback(
    (index: number, autoplay = true, at?: number) => {
      const entry = itemsRef.current[index];
      const player = playerRef.current;
      if (!entry) return;
      if (tracking.current) flush(false);
      tracking.current = false;
      dispatch({ type: "reset" });
      setErrorCode(null);
      setCurrent(index);
      if (!player) {
        // Still the facade: picking a video (or a chapter) starts it there.
        if (!activatedRef.current) {
          pendingStart.current = at ?? null;
          if (autoplay) {
            activate(at ?? entry.resumeAt);
            onPositionRef.current(entry.videoId, at ?? entry.resumeAt);
          }
        }
        return;
      }
      const args = { videoId: entry.videoId, startSeconds: at ?? entry.resumeAt, ...(entry.segment.end ? { endSeconds: entry.segment.end } : {}) };
      if (autoplay) player.loadVideoById(args);
      else player.cueVideoById(args);
      onPositionRef.current(entry.videoId, args.startSeconds);
    },
    [activate, flush, playerRef],
  );

  // Before the player exists, "now" is where it would start (a note taken on the facade gets that time).
  const startAtRef = useRef(startAt);
  startAtRef.current = startAt;
  const currentTime = useCallback((): number => {
    try {
      return playerRef.current?.getCurrentTime() ?? (activatedRef.current ? 0 : startAtRef.current);
    } catch {
      return 0;
    }
  }, [playerRef]);

  const seekTo = useCallback(
    (seconds: number) => {
      const player = playerRef.current;
      if (!player) {
        // On the facade, a seek (a chapter, a note, the transcript) creates the player there.
        if (!activatedRef.current) {
          activate(seconds);
          setNow(seconds);
        }
        return;
      }
      if (tracking.current) flush(false);
      player.seekTo(Math.max(0, seconds), true);
      lastPos.current = Math.max(0, seconds);
      lastWall.current = performance.now();
      setNow(seconds);
    },
    [activate, flush, playerRef],
  );

  useImperativeHandle(
    ref,
    () => ({
      togglePlay: () => {
        const player = playerRef.current;
        if (!player) {
          if (!activatedRef.current) activate();
          return;
        }
        if (player.getPlayerState() === YT_STATE.PLAYING) player.pauseVideo();
        else player.playVideo();
      },
      seekBy: (delta: number) => {
        seekTo(currentTime() + delta);
        setAnnouncement(`${delta > 0 ? "Forward" : "Back"} ${Math.abs(delta)} seconds`);
      },
      noteNow: () => notesRef.current?.startNote(currentTime()),
    }),
    [currentTime, playerRef, seekTo],
  );

  // Countdown to the next video.
  useEffect(() => {
    if (upNext.phase === "counting") {
      const timer = window.setTimeout(() => dispatch({ type: "tick" }), 1000);
      return () => window.clearTimeout(timer);
    }
    if (upNext.phase === "advance") select(upNext.nextIndex);
    return undefined;
  }, [upNext, select]);

  const overlayOpen = upNext.phase === "counting" || upNext.phase === "waiting";
  const nextTitle = overlayOpen ? items[upNext.nextIndex]?.title : null;
  useEffect(() => {
    if (overlayOpen && nextTitle) setAnnouncement(upNext.phase === "counting" ? `Up next: ${nextTitle}. Plays in 5 seconds.` : `Up next: ${nextTitle}.`);
    // Only when the overlay opens.
  }, [overlayOpen, nextTitle]);

  const watchedKeys = useRef(new Set(items.filter((v) => v.watched).map((v) => v.key)));
  useEffect(() => {
    for (const v of items) {
      if (v.watched && !watchedKeys.current.has(v.key)) {
        watchedKeys.current.add(v.key);
        setAnnouncement(`Video ${v.order} watched. ${data.watchedCount} of ${data.total} videos watched.`);
      }
    }
  }, [items, data.watchedCount, data.total]);

  const changeSpeed = (rate: number) => {
    setSpeed(rate);
    try {
      (playerRef.current as FullPlayer | null)?.setPlaybackRate?.(rate);
    } catch {
      // ignore
    }
  };

  const toggleCaptions = () => {
    const next = !captions;
    setCaptions(next);
    try {
      localStorage.setItem(CAPTIONS_KEY, next ? "on" : "off");
    } catch {
      // ignore
    }
    const player = playerRef.current as FullPlayer | null;
    try {
      if (next) {
        player?.loadModule?.("captions");
        player?.setOption?.("captions", "track", { languageCode: "en" });
      } else {
        player?.unloadModule?.("captions");
      }
    } catch {
      // ignore
    }
  };

  const entry = items[current];
  const resuming = startAt > entry.segment.start + 1;
  const youtubeUrl = `https://www.youtube.com/watch?v=${entry.videoId}${entry.segment.start ? `&t=${Math.floor(entry.segment.start)}s` : ""}`;
  const entries: PlaylistEntry[] = items.map((v) => ({
    id: v.key,
    title: v.title,
    durationSec: v.requiredSeconds ?? (durations[v.key] ? durations[v.key] - v.segment.start : undefined),
    thumbnail: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
    watched: v.watched,
    progress: v.progress,
  }));
  const chapters = useMemo(
    () => items.map((v, i) => ({ v, i })).filter(({ v }) => v.videoId === entry.videoId && (v.segment.start > 0 || v.chapterLabel)),
    [items, entry.videoId],
  );
  const transcript = transcripts?.[entry.videoId];

  const controls = (
    <>
      <label className="flex items-center gap-2 text-small text-fg-2">
        Speed
        <select
          value={speed}
          onChange={(e) => changeSpeed(Number(e.target.value))}
          className="h-8 rounded-control border border-line-2 bg-surface-1 px-2 text-small text-fg-1"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </label>
      <Button size="sm" variant="ghost" onClick={toggleCaptions} aria-pressed={captions}>
        {captions ? <Captions aria-hidden="true" /> : <CaptionsOff aria-hidden="true" />}
        Captions {captions ? "on" : "off"}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => notesRef.current?.startNote(currentTime())}>
        <NotebookPen aria-hidden="true" /> Add a note
      </Button>
      <button
        type="button"
        role="switch"
        aria-checked={videos.prefs.autoplayNext}
        onClick={() => videos.setAutoplayNext(!videos.prefs.autoplayNext)}
        className="inline-flex min-h-8 items-center gap-2 rounded-control px-2 text-small text-fg-2 hover:text-fg-1"
      >
        <span aria-hidden="true" className={cn("relative inline-block h-4 w-7 shrink-0 rounded-full transition-colors", videos.prefs.autoplayNext ? "bg-brand" : "bg-line-2")}>
          <span className={cn("absolute left-0 top-0.5 size-3 rounded-full bg-white transition-transform", videos.prefs.autoplayNext ? "translate-x-3.5" : "translate-x-0.5")} />
        </span>
        Play the next video
      </button>
      <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex min-h-8 items-center gap-1 text-small text-fg-2 hover:text-fg-1">
        Watch on YouTube <ExternalLink className="size-3.5" aria-hidden="true" />
        <span className="sr-only">(opens in a new tab; watching there isn't counted)</span>
      </a>
    </>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="relative">
          <VideoPlayerFrame
            title={entry.title}
            ready={activated}
            poster={posterUrl(entry.videoId)}
            onPlay={() => activate()}
            playLabel={resuming ? `Play from ${formatClock(startAt)}, ${entry.title}` : `Play ${entry.title}`}
            posterNote={resuming ? `Resume at ${formatClock(startAt)}` : null}
            controls={controls}
          >
            {failed ? (
              <iframe
                key={entry.key}
                src={`https://www.youtube.com/embed/${entry.videoId}?start=${Math.floor(startAt)}&rel=0&autoplay=1&cc_load_policy=${captions ? 1 : 0}&cc_lang_pref=en`}
                title={entry.title}
                className="absolute inset-0 size-full"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div ref={hostRef} className="absolute inset-0" title={entry.title} />
            )}
          </VideoPlayerFrame>
          {activated && !ready && !failed ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 grid aspect-video place-items-center text-small text-white/70">Loading the player…</div>
          ) : null}
          {overlayOpen && nextTitle ? (
            <div role="group" aria-label="Up next" className="absolute inset-x-0 top-0 grid aspect-video place-items-center rounded-card bg-black/85 px-4 text-white">
              <div className="max-w-sm text-center">
                <p className="text-caption text-white/70">Up next</p>
                <p className="mt-1 line-clamp-2 font-display text-h4 font-semibold">{nextTitle}</p>
                {upNext.phase === "counting" ? (
                  <p className="mt-1 font-mono text-small text-white/80" aria-hidden="true">
                    in {upNext.secondsLeft}s
                  </p>
                ) : null}
                <div className="mt-4 flex justify-center gap-2">
                  <Button size="sm" variant="primary" onClick={() => dispatch({ type: "playNow" })}>
                    <Play aria-hidden="true" /> Play now
                  </Button>
                  <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => dispatch({ type: "cancel" })}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <p className="sr-only" aria-live="polite" role="status">
          {announcement}
        </p>

        {errorCode !== null ? (
          <StatusLine tone="warning">
            {(UNPLAYABLE_ERROR_CODES as readonly number[]).includes(errorCode)
              ? "This video can't play inside Oyelearn (it may be private or removed). It no longer counts towards this lesson. You can still try it on YouTube."
              : "The player hit a problem. Try again, or open the video on YouTube."}
          </StatusLine>
        ) : null}
        {failed ? <StatusLine tone="info">The YouTube player didn't load fully, so watching can't be counted right now. Reload the page to try again.</StatusLine> : null}

        <div>
          <p className="font-medium text-fg-1">{entry.title}</p>
          <p className="text-small text-fg-2">
            {entry.channel}
            {entry.segment.start > 0 ? ` · starts at ${formatClock(entry.segment.start)}${entry.requiredSeconds ? `, about ${formatClock(entry.requiredSeconds)} long` : ""}` : ""}
          </p>
        </div>

        {chapters.length > 0 ? (
          <section aria-labelledby="lesson-chapters" className="rounded-card border border-line-1 bg-surface-1 p-3">
            <h2 id="lesson-chapters" className="font-display text-small font-semibold text-fg-1">
              Chapters in this video
            </h2>
            <ol className="mt-2 flex flex-col gap-1">
              {chapters.map(({ v, i }) => (
                <li key={v.key}>
                  <button
                    type="button"
                    onClick={() => (i === current ? seekTo(v.segment.start) : select(i, true, v.segment.start))}
                    aria-current={i === current ? "true" : undefined}
                    className="flex min-h-8 w-full items-center gap-3 rounded-control px-2 text-left text-small hover:bg-sunken aria-[current=true]:bg-brand-soft"
                  >
                    <span className="font-mono text-caption text-fg-2">{formatClock(v.segment.start)}</span>
                    <span className="text-fg-1">{v.chapterLabel ?? v.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {transcript?.length ? (
          <section aria-labelledby="lesson-transcript" className="max-h-72 overflow-auto rounded-card border border-line-1 bg-surface-1 p-3">
            <h2 id="lesson-transcript" className="font-display text-small font-semibold text-fg-1">
              Transcript
            </h2>
            <ol className="mt-2 flex flex-col gap-1">
              {transcript.map((line, i) => {
                const active = now >= line.at && (transcript[i + 1]?.at ?? Infinity) > now;
                return (
                  <li key={i}>
                    <button type="button" onClick={() => seekTo(line.at)} aria-current={active ? "true" : undefined} className="flex w-full gap-3 rounded-control px-2 py-1 text-left text-small hover:bg-sunken aria-[current=true]:bg-brand-soft">
                      <span className="font-mono text-caption text-fg-2">{formatClock(line.at)}</span>
                      <span>{line.text}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        <NotesPanel
          ref={notesRef}
          topicId={topic.id}
          videoId={entry.videoId}
          onSeek={(note) => {
            if (note.atSec === null) return;
            const index = note.videoId ? items.findIndex((v) => v.videoId === note.videoId) : current;
            if (index >= 0 && index !== current) select(index, true, note.atSec);
            else seekTo(note.atSec);
          }}
        />
      </div>

      <div className="min-w-0">
        <PlaylistSidebar entries={entries} currentId={entry.key} onSelect={(id) => select(items.findIndex((v) => v.key === id))} />
        <p className="mt-2 px-1 text-caption text-fg-2">
          {data.watchedCount} of {data.total} watched.{" "}
          {data.exempt ? "" : data.lockMode === "lock" ? "Watch them all to go on." : "Watching them all is recommended."}
        </p>
      </div>
    </div>
  );
});

/** When the playlist can't load: the topic's video as a plain embed (watching isn't counted). */
function PlainEmbed({ topic }: { topic: ServedTopic }) {
  const video = topic.video;
  if (!video?.videoId) return null;
  return (
    <VideoPlayerFrame title={video.title}>
      <iframe
        src={`https://www.youtube.com/embed/${video.videoId}?start=${Math.floor(video.startSeconds ?? 0)}&rel=0&cc_load_policy=1&cc_lang_pref=en`}
        title={video.title}
        className="absolute inset-0 size-full"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </VideoPlayerFrame>
  );
}
