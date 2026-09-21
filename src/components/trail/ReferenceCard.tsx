import { BookOpen, CirclePlay, ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TopicResource } from "@/types/curriculum-v1";

interface ReferenceCardProps {
  kind: "read" | "watch";
  resource: TopicResource;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Deliberately light: the references support the challenge, they aren't the main event. */
export function ReferenceCard({ kind, resource }: ReferenceCardProps) {
  const Icon = kind === "read" ? BookOpen : CirclePlay;
  const isSearch = resource.url.includes("youtube.com/results");

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-md border border-dashed px-4 py-3 transition-colors hover:border-solid hover:border-foreground/30 hover:bg-surface"
    >
      <Icon
        className={cn("mt-0.5 h-5 w-5 shrink-0", kind === "read" ? "text-glacier-strong" : "text-destructive")}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-muted-foreground">{kind === "read" ? "Read" : "Watch"}</span>
        <span className="mt-0.5 block text-sm font-medium leading-snug">{resource.label}</span>
        <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
          {isSearch ? "YouTube search" : hostOf(resource.url)}
        </span>
      </span>
      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
