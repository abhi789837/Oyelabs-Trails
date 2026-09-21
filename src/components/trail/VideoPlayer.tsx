import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type { VideoResource } from "@/types/curriculum";

function formatStart(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** YouTube's embed player, the one kind of in-page preview that reliably works. */
export function VideoPlayer({ video, alternates = [] }: { video: VideoResource; alternates?: VideoResource[] }) {
  const options = [video, ...alternates];
  const [selected, setSelected] = useState(0);
  const current = options[selected];

  return (
    <div>
      {options.length > 1 && (
        <div role="tablist" aria-label="Choose a video" className="mb-3 flex flex-wrap gap-2">
          {options.map((v, i) => (
            <button
              key={`${v.videoId}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === selected}
              onClick={() => setSelected(i)}
              className={cn(
                "max-w-72 rounded-md border px-3 py-1.5 text-left text-xs transition-colors",
                i === selected ? "border-foreground/60 bg-surface font-medium" : "text-muted-foreground hover:border-foreground/30",
              )}
            >
              <span className="line-clamp-1">{v.title}</span>
              {v.durationLabel && <span className="font-mono text-[11px] text-muted-foreground">{v.durationLabel}</span>}
            </button>
          ))}
        </div>
      )}

      {current.videoId ? (
        <div className="overflow-hidden rounded-md border bg-black">
          <iframe
            key={`${current.videoId}-${current.startSeconds ?? 0}`}
            src={`https://www.youtube.com/embed/${current.videoId}?start=${current.startSeconds ?? 0}&rel=0`}
            title={current.title}
            className="aspect-video w-full"
            loading="lazy"
            // YouTube's player needs the embedding page's origin as referrer.
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="rounded-md border border-dashed px-5 py-6">
          <p className="font-medium">No video has been picked for this topic yet</p>
          <p className="mt-1 text-sm text-muted-foreground">A curated video is still to come. Until then, search YouTube for it.</p>
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-surface"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Search YouTube
          </a>
        </div>
      )}

      {current.videoId && (
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
          <p className="min-w-0">
            <span className="font-medium">{current.title}</span>
            <span className="text-muted-foreground"> by {current.channel}</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
            {current.durationLabel && <span>{current.durationLabel}</span>}
            <a
              href={current.startSeconds ? `${current.url}&t=${current.startSeconds}s` : current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              Watch on YouTube
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
      {current.startSeconds ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Starts at {formatStart(current.startSeconds)}
          {current.chapterLabel ? `, the "${current.chapterLabel}" chapter of a longer course.` : " in a longer course."}
        </p>
      ) : null}
    </div>
  );
}
