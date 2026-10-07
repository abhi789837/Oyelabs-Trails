import type { ReactNode } from "react";
import { Lock, TriangleAlert } from "lucide-react";

import type { TopicVideosResponse } from "@shared/video";
import { formatClock } from "@shared/video";

/**
 * Stands in front of the topic test.
 *
 * - Lock mode: the test is hidden until every video is watched, with what is left and a way to jump
 *   to it. The server refuses an attempt anyway (409 `videos_unwatched`); this only explains it.
 * - Warn mode: the test is there, with a warning above it.
 * - A completed topic, or a staff member, sees the test as before.
 *
 * While the video state is loading or failed to load, the test shows; the server still enforces.
 */
export function VideoGate({
  videos,
  onWatch,
  children,
}: {
  videos: TopicVideosResponse | null;
  onWatch: (key: string) => void;
  children: ReactNode;
}) {
  if (!videos || videos.exempt || videos.watchedCount >= videos.total) return <>{children}</>;

  const left = videos.videos.filter((v) => !v.watched && v.status !== "unavailable");
  const list = (
    <ul className="mt-3 space-y-1.5">
      {left.map((v) => {
        const remaining = v.requiredSeconds ? Math.max(0, v.requiredSeconds * 0.9 - v.watchedSeconds) : null;
        return (
          <li key={v.key} className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <button
              type="button"
              onClick={() => onWatch(v.key)}
              className="text-left font-medium underline decoration-primary decoration-2 underline-offset-4 hover:decoration-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
            >
              {v.order}. {v.title}
            </button>
            <span className="font-mono text-xs text-muted-foreground">
              {v.status === "in-progress" ? `${Math.round(v.progress * 100)}% watched` : "not started"}
              {remaining ? `, about ${formatClock(remaining)} to go` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );

  if (videos.lockMode === "lock") {
    return (
      <div className="rounded-md border border-dashed px-4 py-5" role="region" aria-label="Test locked">
        <p className="flex items-center gap-2 font-medium">
          <Lock className="h-4 w-4 text-trailmark-strong" aria-hidden="true" />
          Watch the videos to unlock this test
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {videos.watchedCount} of {videos.total} videos watched. A video counts once you've played at least 90% of it; skipping ahead
          doesn't count.
        </p>
        {list}
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 rounded-md border border-trailmark/50 bg-trailmark/10 px-4 py-3" role="note">
        <p className="flex items-center gap-2 text-sm font-medium">
          <TriangleAlert className="h-4 w-4 text-trailmark-strong" aria-hidden="true" />
          {videos.total - videos.watchedCount === 1 ? "1 video" : `${videos.total - videos.watchedCount} videos`} not watched yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground">You can take the test now, but it covers what the videos teach.</p>
        {list}
      </div>
      {children}
    </>
  );
}
