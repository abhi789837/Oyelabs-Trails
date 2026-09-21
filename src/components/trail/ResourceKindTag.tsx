import { BookOpen, FolderGit2, MessagesSquare, Newspaper, ScrollText, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ResourceKind } from "@/types/curriculum";

const kinds: Record<ResourceKind, { label: string; icon: LucideIcon; className: string }> = {
  docs: { label: "Docs", icon: BookOpen, className: "text-glacier-strong" },
  spec: { label: "Spec", icon: ScrollText, className: "text-ridge-strong" },
  article: { label: "Article", icon: Newspaper, className: "text-trailmark-strong" },
  "interview-prep": { label: "Interview prep", icon: MessagesSquare, className: "text-summit-strong" },
  repo: { label: "Repo", icon: FolderGit2, className: "text-basalt-strong" },
};

export function ResourceKindTag({ kind, compact = false }: { kind: ResourceKind; compact?: boolean }) {
  const k = kinds[kind];
  const Icon = k.icon;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 font-mono text-[11px] font-medium", k.className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {compact ? <span className="sr-only">{k.label}</span> : k.label}
    </span>
  );
}
