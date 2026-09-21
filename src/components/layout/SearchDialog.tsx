import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { StatusDot } from "@/components/trail/StatusDot";
import { modulePath, topicPath, tracks } from "@/content";
import { accentClasses } from "@/lib/accent";
import { levelLabels } from "@/lib/track-meta";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/store/progressStore";

interface Entry {
  key: string;
  kind: "topic" | "camp";
  title: string;
  context: string;
  href: string;
  haystack: string;
  accentBg: string;
  topicId?: string;
  level?: string;
}

function buildIndex(): Entry[] {
  const entries: Entry[] = [];
  for (const track of tracks) {
    const accentBg = accentClasses[track.accentToken].bg;
    for (const module of track.modules) {
      if (!module.available) continue;
      entries.push({
        key: `camp:${module.id}`,
        kind: "camp",
        title: module.name,
        context: `${track.name} camp, ${module.topics.length} topics`,
        href: modulePath(module),
        haystack: `${module.name} ${track.name}`.toLowerCase(),
        accentBg,
      });
      for (const topic of module.topics) {
        entries.push({
          key: `topic:${topic.id}`,
          kind: "topic",
          title: topic.title,
          context: `${track.name} / ${module.name}`,
          href: topicPath(topic),
          haystack: `${topic.title} ${topic.id} ${module.name} ${track.name}`.toLowerCase(),
          accentBg,
          topicId: topic.id,
          level: levelLabels[topic.level],
        });
      }
    }
  }
  return entries;
}

/** Every query word must appear somewhere; titles that start with the query rank first. */
function search(index: Entry[], query: string): Entry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/);
  return index
    .filter((e) => words.every((w) => e.haystack.includes(w)))
    .sort((a, b) => {
      const as = a.title.toLowerCase().startsWith(q) ? 0 : 1;
      const bs = b.title.toLowerCase().startsWith(q) ? 0 : 1;
      return as - bs || (a.kind === b.kind ? 0 : a.kind === "camp" ? -1 : 1);
    })
    .slice(0, 12);
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const progress = useProgressStore((s) => s.progress);
  const index = useMemo(buildIndex, []);
  const results = useMemo(() => search(index, query), [index, query]);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setActive(0), [query]);

  const go = (entry: Entry) => {
    setOpen(false);
    setQuery("");
    navigate(entry.href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  };

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-md border px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:w-56"
          aria-label="Search topics"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="hidden flex-1 text-left sm:inline">Search topics</span>
          <kbd className="hidden rounded-sm border px-1 font-mono text-[10px] sm:inline">Ctrl K</kbd>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg border bg-background shadow-2xl"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Search topics and camps</Dialog.Title>
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKey}
              placeholder="Search topics and camps, e.g. closures, indexes, RAG"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="search-results"
              aria-activedescendant={results[active] ? `search-${results[active].key}` : undefined}
              aria-label="Search topics and camps"
            />
          </div>
          {query.trim() && (
            <ul ref={listRef} id="search-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-1.5">
              {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No topics match "{query}".</li>}
              {results.map((entry, i) => (
                <li
                  key={entry.key}
                  id={`search-${entry.key}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(entry)}
                  className={cn("flex cursor-pointer items-center gap-3 rounded-md px-3 py-2", i === active && "bg-accent")}
                >
                  {entry.kind === "topic" ? (
                    <StatusDot status={progress[entry.topicId!]?.status ?? "not-started"} />
                  ) : (
                    <span aria-hidden="true" className={cn("h-4 w-4 shrink-0 rounded-[4px]", entry.accentBg)} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{entry.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{entry.context}</span>
                  </span>
                  {entry.level && <span className="font-mono text-[11px] text-muted-foreground">{entry.level}</span>}
                </li>
              ))}
            </ul>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
