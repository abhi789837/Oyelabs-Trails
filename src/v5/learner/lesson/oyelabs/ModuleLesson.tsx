import { CircleCheck, Download, ExternalLink, Play, SkipForward } from "lucide-react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import type { VideoProgressRequest } from "@shared/video";
import { formatClock, formatSpan } from "@shared/videoCore";
import type { ActiveTimeSample, ModuleLessonResponse, ModulePlaylistEntry, ModulePlaylistResponse } from "@shared/videoSourcesCore";

import { ApiRequestError } from "@/api/client";
import { initialUpNext, nextIndexAfter, upNextReducer } from "@/components/trail/upNext";
import { cn } from "@/v5/design/cn";
import { Button } from "@/v5/design/components/Button";
import { PlaylistSidebar, StatusLine, type PlaylistEntry } from "@/v5/design/components/Lesson";
import { ErrorState } from "@/v5/design/components/States";

import { moduleApi, sendOnExit } from "./api";
import { ModuleTestStep } from "./ModuleTestStep";
import { NotesView } from "./NotesView";
import { EmbedPlayer, Html5Player, VimeoModulePlayer, YouTubeModulePlayer } from "./players";

const span = (sec: number) => (sec < 60 ? `${Math.round(sec)} sec` : formatSpan(sec));

/**
 * v4.5 Phase 2: an Oyelabs module in the lesson player (CourseLesson branches here for
 * `kind === "module"`, behind a lazy import).
 *
 * The playlist (with the v4.3 sidebar, ticks and the autoplay countdown for players we can read; a
 * "Next video" button for embeds), the module's documents and notes, then the module test (builder
 * C's `ModuleTestStep`), which waits for the videos under the v4.3 lock.
 */
export default function ModuleLesson({ topicId, courseId, preview, onPassed }: { topicId: string; courseId: string; preview: boolean; onPassed: () => void }) {
  const [data, setData] = useState<ModuleLessonResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [autoplayNext, setAutoplayNext] = useState(true);

  const load = useCallback(() => {
    setError(null);
    moduleApi.lesson(topicId).then(setData, setError);
  }, [topicId]);
  useEffect(() => {
    load();
    moduleApi.prefs().then((p) => setAutoplayNext(p.autoplayNext), () => undefined);
  }, [load]);

  const apply = useCallback((next: ModulePlaylistResponse) => setData((d) => (d ? { ...d, ...next } : d)), []);

  if (error && !data) {
    const missing = error instanceof ApiRequestError && error.status === 404;
    return <ErrorState title={missing ? "This module isn't open to you" : "This module couldn't be loaded"} body={missing ? "Ask your admin to share the course with you." : "Check your connection and try again."} onRetry={load} />;
  }
  if (!data) return <div className="aspect-video animate-pulse rounded-card bg-sunken" aria-busy="true" aria-label="Loading the module" />;

  return (
    <div className="flex flex-col gap-6" data-testid="oyelabs-module-lesson">
      {data.entries.length ? (
        <Playlist
          data={data}
          topicId={topicId}
          preview={preview}
          apply={apply}
          autoplayNext={autoplayNext}
          setAutoplayNext={(v) => {
            setAutoplayNext(v);
            moduleApi.setPrefs(v).catch(() => undefined);
          }}
        />
      ) : null}

      {data.docs.length ? (
        <section aria-labelledby="module-docs" className="flex flex-col gap-2">
          <h2 id="module-docs" className="font-display text-h4 font-semibold">
            Documents
          </h2>
          <ul className="flex flex-col gap-1.5">
            {data.docs.map((d) => (
              <li key={d.docId}>
                <a
                  href={d.href}
                  {...(d.source === "upload" ? { download: "" } : { target: "_blank", rel: "noreferrer noopener" })}
                  className="inline-flex min-h-6 items-center gap-1.5 rounded-sm text-body text-brand-fg underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {d.source === "upload" ? <Download className="size-4" aria-hidden="true" /> : <ExternalLink className="size-3.5" aria-hidden="true" />}
                  {d.title}
                  {d.source === "link" ? <span className="sr-only">(opens in a new tab)</span> : null}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.notes?.content.length ? (
        <section aria-labelledby="module-notes" className="flex flex-col gap-2">
          <h2 id="module-notes" className="font-display text-h4 font-semibold">
            Notes
          </h2>
          <NotesView doc={data.notes} />
        </section>
      ) : null}

      <section aria-labelledby="module-test" className="flex flex-col gap-2 border-t border-line-1 pt-4">
        <h2 id="module-test" className="font-display text-h4 font-semibold">
          Module test
        </h2>
        {data.locked ? (
          <StatusLine tone="info">
            Watch the videos first: {data.watchedCount} of {data.total} watched.
          </StatusLine>
        ) : data.lockMode === "warn" && data.watchedCount < data.total && !data.exempt ? (
          <StatusLine tone="warning">Watching every video first is recommended ({data.watchedCount} of {data.total} watched).</StatusLine>
        ) : null}
        <ModuleTestStep
          topicId={topicId}
          courseId={courseId}
          locked={data.locked}
          onPassed={() => {
            load();
            onPassed();
          }}
        />
      </section>
    </div>
  );
}

function firstUnwatched(entries: readonly ModulePlaylistEntry[]): number {
  const i = entries.findIndex((e) => e.status !== "watched" && e.status !== "unavailable");
  return i === -1 ? 0 : i;
}

function Playlist({
  data,
  topicId,
  preview,
  apply,
  autoplayNext,
  setAutoplayNext,
}: {
  data: ModuleLessonResponse;
  topicId: string;
  preview: boolean;
  apply: (next: ModulePlaylistResponse) => void;
  autoplayNext: boolean;
  setAutoplayNext: (v: boolean) => void;
}) {
  const entries = data.entries;
  const [current, setCurrent] = useState(() => firstUnwatched(entries));
  const [autoplay, setAutoplay] = useState(false);
  const [upNext, dispatch] = useReducer(upNextReducer, initialUpNext);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const entry = entries[current] ?? entries[0]!;
  const autoplayRef = useRef(autoplayNext);
  autoplayRef.current = autoplayNext;

  const select = useCallback((index: number, play = true) => {
    dispatch({ type: "reset" });
    setConfirmError(null);
    setAutoplay(play);
    setCurrent(index);
  }, []);

  useEffect(() => {
    if (upNext.phase === "counting") {
      const t = window.setTimeout(() => dispatch({ type: "tick" }), 1000);
      return () => window.clearTimeout(t);
    }
    if (upNext.phase === "advance") select(upNext.nextIndex);
    return undefined;
  }, [upNext, select]);

  const watchedIds = useRef(new Set(entries.filter((e) => e.watched).map((e) => e.videoId)));
  useEffect(() => {
    for (const e of entries) {
      if (e.watched && !watchedIds.current.has(e.videoId)) {
        watchedIds.current.add(e.videoId);
        setAnnouncement(`Video ${e.order} watched. ${data.watchedCount} of ${data.total} videos watched.`);
      }
    }
  }, [entries, data.watchedCount, data.total]);

  // Staff previews read the lesson but never record watching.
  const exactSample = useCallback(
    (videoId: string) => (body: VideoProgressRequest, exiting: boolean) => {
      if (preview) return;
      if (exiting) sendOnExit(topicId, videoId, body);
      else moduleApi.exact(topicId, videoId, body).then(apply, () => undefined);
    },
    [apply, preview, topicId],
  );
  const activeSample = useCallback(
    (videoId: string) => (body: ActiveTimeSample, exiting: boolean) => {
      if (preview) return;
      if (exiting) sendOnExit(topicId, videoId, body);
      else moduleApi.active(topicId, videoId, body).then(apply, () => undefined);
    },
    [apply, preview, topicId],
  );
  const ended = useCallback(() => {
    dispatch({ type: "ended", nextIndex: nextIndexAfter(current, entries), autoplay: autoplayRef.current });
  }, [current, entries]);

  const confirm = async () => {
    setConfirming(true);
    setConfirmError(null);
    try {
      apply(await moduleApi.watched(topicId, entry.videoId));
    } catch (e) {
      setConfirmError(e instanceof ApiRequestError ? e.message : "That didn't save. Try again.");
    } finally {
      setConfirming(false);
    }
  };

  const nextIndex = nextIndexAfter(current, entries);
  const overlayOpen = upNext.phase === "counting" || upNext.phase === "waiting";
  const nextTitle = overlayOpen ? entries[upNext.nextIndex]?.title : null;
  const sidebar: PlaylistEntry[] = entries.map((e) => ({
    id: e.videoId,
    title: e.status === "unavailable" ? `${e.title} (can't play)` : e.title,
    durationSec: e.durationSeconds ?? undefined,
    thumbnail: e.thumbnailUrl ?? undefined,
    watched: e.watched,
    progress: e.progress,
  }));

  const player =
    entry.status === "unavailable" ? (
      <div className="grid aspect-video place-items-center rounded-card bg-sunken p-6 text-center text-small text-fg-2" role="status">
        {entry.unavailableReason ?? "This video can't play right now."} It doesn't count towards this module.
      </div>
    ) : entry.playerKind === "html5" || entry.playerKind === "hls" ? (
      <Html5Player key={entry.videoId} entry={entry} autoplay={autoplay} onSample={exactSample(entry.videoId)} onEnded={ended} />
    ) : entry.playerKind === "youtube" ? (
      <YouTubeModulePlayer key={entry.videoId} entry={entry} autoplay={autoplay} onSample={exactSample(entry.videoId)} onEnded={ended} />
    ) : entry.playerKind === "vimeo" ? (
      <VimeoModulePlayer key={entry.videoId} entry={entry} autoplay={autoplay} onSample={exactSample(entry.videoId)} onEnded={ended} />
    ) : (
      <EmbedPlayer key={entry.videoId} entry={entry} onSample={activeSample(entry.videoId)} />
    );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="relative">
          {player}
          {overlayOpen && nextTitle ? (
            <div role="group" aria-label="Up next" className="absolute inset-0 grid place-items-center rounded-card bg-black/85 px-4 text-white">
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

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-fg-1">{entry.title}</p>
            <p className="text-small text-fg-2">
              {entry.durationSeconds ? formatClock(entry.durationSeconds) : "Length not known yet"}
              {entry.watched ? " · Watched" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={autoplayNext}
              onClick={() => setAutoplayNext(!autoplayNext)}
              className="inline-flex min-h-8 items-center gap-2 rounded-control px-2 text-small text-fg-2 hover:text-fg-1"
            >
              <span aria-hidden="true" className={cn("relative inline-block h-4 w-7 shrink-0 rounded-full transition-colors", autoplayNext ? "bg-brand" : "bg-line-2")}>
                <span className={cn("absolute left-0 top-0.5 size-3 rounded-full bg-white transition-transform", autoplayNext ? "translate-x-3.5" : "translate-x-0.5")} />
              </span>
              Play the next video
            </button>
            {entry.tracking === "estimated" && nextIndex !== null ? (
              <Button size="sm" variant="secondary" onClick={() => select(nextIndex, false)}>
                <SkipForward aria-hidden="true" /> Next video
              </Button>
            ) : null}
          </div>
        </div>

        {entry.tracking === "estimated" && entry.status !== "unavailable" ? (
          <EstimatedPanel entry={entry} preview={preview} confirming={confirming} error={confirmError} onConfirm={() => void confirm()} />
        ) : null}
      </div>

      <div className="min-w-0">
        <PlaylistSidebar entries={sidebar} currentId={entry.videoId} onSelect={(id) => select(entries.findIndex((e) => e.videoId === id))} label="Videos in this module" />
        <p className="mt-2 px-1 text-caption text-fg-2">
          {data.watchedCount} of {data.total} watched. {data.exempt ? "" : data.lockMode === "warn" ? "Watching them all is recommended." : "Watch them all to unlock the module test."}
        </p>
      </div>
    </div>
  );
}

/** Estimated entries: time counted so far, and "I've watched this" once 80% of the length is reached. */
function EstimatedPanel({ entry, preview, confirming, error, onConfirm }: { entry: ModulePlaylistEntry; preview: boolean; confirming: boolean; error: string | null; onConfirm: () => void }) {
  if (entry.watched) {
    return (
      <StatusLine tone="success" icon={<CircleCheck />}>
        You've watched this video.
      </StatusLine>
    );
  }
  if (entry.requiredSeconds === null) {
    return <StatusLine tone="info">This video plays in its own player, so we count time spent watching it here. Ask your admin to add the video's length so it can count as watched.</StatusLine>;
  }
  const left = Math.max(0, entry.requiredSeconds - entry.watchedSeconds);
  return (
    <div className="flex flex-col gap-2 rounded-card border border-line-1 bg-surface-1 p-3" data-testid="oyelabs-estimated">
      <p className="text-small text-fg-2">
        This video plays in its own player, so we count time while this page is open and you're watching. {span(entry.watchedSeconds)} counted
        {left > 0 ? `; about ${span(left)} to go.` : "."}
      </p>
      {entry.canConfirm ? (
        <Button variant="primary" size="sm" className="self-start" onClick={onConfirm} disabled={confirming || preview}>
          <CircleCheck aria-hidden="true" /> I've watched this
        </Button>
      ) : null}
      {error ? (
        <p role="alert" className="text-small text-danger-fg">
          {error}
        </p>
      ) : null}
    </div>
  );
}
