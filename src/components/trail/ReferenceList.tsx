import { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";

import { embedVerdicts } from "@/content/embeds.generated";
import { cn } from "@/lib/utils";
import type { TopicResource } from "@/types/curriculum";
import { ResourceKindTag } from "./ResourceKindTag";

const PREVIEW_TIMEOUT_MS = 8000;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * The topic's reading list. Many docs sites (MDN, GitHub, javascript.info…) send
 * X-Frame-Options or CSP frame-ancestors headers that forbid being framed, and browsers still
 * fire `load` for those blocked frames, so we can't detect blocking at runtime. Instead
 * `npm run content:embeds` records each site's headers ahead of time: blocked sites get a link
 * card, allowed sites get an inline preview (the first one opens by default), and sites that
 * haven't been checked can be tried on demand. Any preview falls back to the link card if it
 * errors or doesn't load within a few seconds.
 */
export function ReferenceList({ refs }: { refs: TopicResource[] }) {
  // Only open a preview by default when the site is known to allow framing.
  const firstPreviewable = refs.findIndex((r) => embedVerdicts[r.url] === 1);
  return (
    <ul className="divide-y rounded-md border">
      {refs.map((ref, i) => (
        <ReferenceItem key={ref.url} resource={ref} defaultOpen={i === firstPreviewable} />
      ))}
    </ul>
  );
}

function ReferenceItem({ resource, defaultOpen }: { resource: TopicResource; defaultOpen: boolean }) {
  const verdict = embedVerdicts[resource.url];
  const blocked = verdict === 0;
  const unchecked = verdict === undefined;
  const [open, setOpen] = useState(defaultOpen && !blocked);
  const panelId = `preview-${resource.url.replace(/[^a-z0-9]/gi, "").slice(-40)}`;

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <ResourceKindTag kind={resource.kind} />
        <div className="min-w-0 flex-1 basis-56">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium leading-snug underline-offset-4 hover:underline"
          >
            {resource.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">{hostOf(resource.url)}</span>
        </div>
        <div className="flex items-center gap-1">
          {!blocked && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={panelId}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {open ? "Hide preview" : unchecked ? "Try preview" : "Show preview"}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
            </button>
          )}
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Open in new tab
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
      {blocked && (
        <p className="mt-2 text-xs text-muted-foreground">
          {hostOf(resource.url)} doesn't allow its pages to be shown inside other sites, so there's no preview here. Open it
          in a new tab instead.
        </p>
      )}
      {open && <PreviewFrame id={panelId} resource={resource} />}
    </li>
  );
}

function PreviewFrame({ id, resource }: { id: string; resource: TopicResource }) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    timer.current = window.setTimeout(() => setState((s) => (s === "loading" ? "failed" : s)), PREVIEW_TIMEOUT_MS);
    return () => window.clearTimeout(timer.current);
  }, []);

  if (state === "failed") {
    return (
      <div id={id} className="mt-3 rounded-md border border-dashed px-4 py-5 text-sm">
        <p className="font-medium">The preview didn't load</p>
        <p className="mt-1 text-muted-foreground">
          The page may be slow or may block embedding. It's one click away:{" "}
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            open {hostOf(resource.url)} in a new tab
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div id={id} className="relative mt-3 overflow-hidden rounded-md border bg-surface">
      {state === "loading" && (
        <p className="absolute inset-x-0 top-4 text-center text-xs text-muted-foreground" aria-live="polite">
          Loading preview of {hostOf(resource.url)}…
        </p>
      )}
      <iframe
        src={resource.url}
        title={`Preview: ${resource.label}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
        className={cn("relative h-[26rem] w-full bg-white", state === "loading" && "opacity-0")}
        onLoad={() => {
          window.clearTimeout(timer.current);
          setState("loaded");
        }}
        onError={() => setState("failed")}
      />
    </div>
  );
}
