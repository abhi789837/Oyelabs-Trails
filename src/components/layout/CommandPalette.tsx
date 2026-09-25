import { useCallback, useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import {
  Compass,
  Cpu,
  Radio,
  Route,
  ScrollText,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { UserSummary } from "@shared/admin";

import { StatusDot } from "@/components/trail/StatusDot";
import { Avatar } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandMeta,
} from "@/components/ui/command";
import { Kbd, modKeyLabel } from "@/components/ui/kbd";
import { modulePath, topicPath, useTracks } from "@/content";
import { adminApi } from "@/features/admin/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { accentClasses } from "@/lib/accent";
import { scaleIn, transition } from "@/lib/motion";
import { levelLabels } from "@/lib/track-meta";
import { cn } from "@/lib/utils";
import { useProgressStore, type TopicStatus } from "@/store/progressStore";
import type { TopicLevel } from "@/types/curriculum";
import {
  buildCurriculumIndex,
  groupResults,
  rankEntries,
  type CommandEntry,
  type GroupedResults,
} from "./commandIndex";
import { pushRecent, readRecents, writeRecents, type RecentEntry } from "./paletteRecents";

/**
 * The command palette.
 *
 * It replaces the topic search that used to live here, and it is the one place in the app where
 * everything is reachable by name: trails, camps, all 715 waypoints, and — for a superadmin — the
 * people on the platform and the console's own actions.
 *
 * The performance rule is in `commandIndex.ts`: the index is built once per manifest, matching is
 * a single pass, and the results are capped per group before React sees them. Nothing renders the
 * whole curriculum, at any point, including the empty state.
 */
const ACTION_ICONS: Record<string, LucideIcon> = {
  "action:dashboard": Compass,
  "action:plan": Route,
  "action:admin": ShieldCheck,
  "action:admin-people": Users,
  "action:admin-onboard": UserPlus,
  "action:go-to-learner": Users,
  "action:admin-live": Radio,
  "action:admin-ai": Cpu,
  "action:admin-audit": ScrollText,
  "action:learner-view": Compass,
};

/** The id that switches the palette into people mode rather than navigating. */
const GO_TO_LEARNER = "action:go-to-learner";

const EMPTY_RESULTS: GroupedResults = { trails: [], camps: [], topics: [], people: [], actions: [], total: 0 };

function buildActions(isSuperadmin: boolean, context: "learner" | "admin"): CommandEntry[] {
  const entry = (id: string, title: string, href: string, subtitle: string): CommandEntry => ({
    id,
    kind: "action",
    title,
    context: subtitle,
    href,
    haystack: `${title} ${subtitle}`.toLowerCase(),
  });

  if (!isSuperadmin) {
    return [
      entry("action:dashboard", "Dashboard", "/", "Your trails at a glance"),
      entry("action:plan", "Your plan", "/plan", "The waypoints assigned to you"),
    ];
  }

  const admin = [
    entry("action:admin-people", "People", "/admin/people", "Every learner on the platform"),
    entry("action:admin-onboard", "Onboard learner", "/admin/onboard", "Create an account and issue an assessment"),
    entry(GO_TO_LEARNER, "Go to learner…", "", "Search people by name or username"),
    entry("action:admin-live", "Live assessments", "/admin/live", "Who is sitting one right now"),
    entry("action:admin-ai", "AI connection", "/admin/ai", "Provider, credential and usage"),
    entry("action:admin-integrity", "Integrity events", "/admin/integrity", "Every proctoring signal, across everyone"),
    entry("action:admin-audit", "Audit log", "/admin/audit", "Everything anyone changed"),
    entry("action:admin-curriculum", "Curriculum", "/admin/curriculum", "Every topic, filterable"),
  ];

  return context === "admin"
    ? [entry("action:learner-view", "Learner view", "/", "The curriculum as a learner sees it"), ...admin]
    : [entry("action:admin", "Admin console", "/admin", "The superadmin dashboard"), ...admin];
}

function buildPeopleIndex(people: UserSummary[]): CommandEntry[] {
  return people.map((person) => ({
    id: `person:${person.id}`,
    kind: "person" as const,
    title: person.displayName,
    context: person.roleTitle ?? (person.role === "superadmin" ? "Superadmin" : "Learner"),
    href: `/admin/people/${person.id}`,
    haystack: `${person.displayName} ${person.username} ${person.roleTitle ?? ""}`.toLowerCase(),
    meta: person.status === "disabled" ? "disabled" : person.username,
  }));
}

export function CommandPalette({ context = "learner" }: { context?: "learner" | "admin" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const tracks = useTracks();
  const progress = useProgressStore((s) => s.progress);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  /** Non-null when the palette has been narrowed to one kind of thing. */
  const [mode, setMode] = useState<"people" | null>(null);
  const [people, setPeople] = useState<UserSummary[] | null>(null);
  const [recents, setRecents] = useState<RecentEntry[]>([]);

  const isSuperadmin = user?.role === "superadmin";
  /* Depend on the id, not the object: `AuthProvider.refresh()` hands back a fresh `user` for the
     same person, and an effect keyed on the object would clear a half-typed query underneath them. */
  const userId = user?.id ?? null;

  const curriculum = useMemo(
    () =>
      buildCurriculumIndex(tracks, {
        levelLabel: (level) => levelLabels[level as TopicLevel] ?? level,
        topicHref: topicPath,
        moduleHref: modulePath,
      }),
    [tracks],
  );
  const peopleIndex = useMemo(() => buildPeopleIndex(people ?? []), [people]);
  const actions = useMemo(() => buildActions(Boolean(isSuperadmin), context), [isSuperadmin, context]);

  const index = useMemo(
    () => [...actions, ...curriculum, ...peopleIndex],
    [actions, curriculum, peopleIndex],
  );

  const results = useMemo<GroupedResults>(() => {
    if (mode === "people") {
      const matches = query.trim()
        ? rankEntries(peopleIndex, query, { limit: 8 })
        : peopleIndex.slice(0, 8);
      return { ...EMPTY_RESULTS, people: matches, total: matches.length };
    }
    if (!query.trim()) return EMPTY_RESULTS;
    return groupResults(index, query);
  }, [mode, query, peopleIndex, index]);

  // Cmd/Ctrl-K from anywhere, including from inside an input, which is the whole point of it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Opening is a fresh start: the previous query is never what this one is about.
  useEffect(() => {
    if (open) {
      setQuery("");
      setMode(null);
      setRecents(userId ? readRecents(userId) : []);
    }
  }, [open, userId]);

  /* People are fetched once per session, on the first open, and only for a superadmin — a learner
     has no route that could use them and no permission to ask. */
  useEffect(() => {
    if (!open || !isSuperadmin || people !== null) return;
    const controller = new AbortController();
    adminApi
      .listUsers(controller.signal)
      .then((response) => setPeople(response.users))
      .catch(() => {
        /* The palette still works without people; it just will not find them. */
      });
    return () => controller.abort();
  }, [open, isSuperadmin, people]);

  const run = useCallback(
    (entry: CommandEntry) => {
      if (entry.id === GO_TO_LEARNER) {
        setMode("people");
        setQuery("");
        return;
      }
      if (userId) {
        const next = pushRecent(readRecents(userId), {
          id: entry.id,
          kind: entry.kind,
          title: entry.title,
          context: entry.context,
          href: entry.href,
        });
        writeRecents(userId, next);
        setRecents(next);
      }
      setOpen(false);
      navigate(entry.href);
    },
    [navigate, userId],
  );

  const showingRecents = mode === null && !query.trim();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-md border px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong sm:w-60"
        aria-label="Search and commands"
        aria-keyshortcuts="Meta+K Control+K"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="hidden flex-1 text-left sm:inline">Search or jump to…</span>
        <Kbd className="hidden sm:inline-flex">{modKeyLabel()} K</Kbd>
      </button>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal forceMount>
          <AnimatePresence>
            {open && (
              <>
                <DialogPrimitive.Overlay asChild forceMount>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={transition.fast}
                    className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[6px]"
                  />
                </DialogPrimitive.Overlay>

                <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center p-4 pt-[8vh] sm:pt-[12vh]">
                  <DialogPrimitive.Content asChild forceMount aria-describedby={undefined}>
                    <motion.div
                      variants={scaleIn}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-lg border bg-surface shadow-2xl"
                    >
                      <DialogPrimitive.Title className="sr-only">Search and commands</DialogPrimitive.Title>

                      <Command
                        shouldFilter={false}
                        loop
                        label="Search and commands"
                        className="bg-transparent"
                      >
                        <CommandInput
                          autoFocus
                          value={query}
                          onValueChange={setQuery}
                          placeholder={
                            mode === "people" ? "Find a learner by name or username" : "Search topics, camps, people…"
                          }
                          onKeyDown={(event) => {
                            // Backspace on an empty field steps back out of a narrowed palette,
                            // the way a chip in a filter bar does.
                            if (mode && event.key === "Backspace" && query === "") {
                              event.preventDefault();
                              setMode(null);
                            }
                          }}
                          leading={
                            mode === "people" ? (
                              <span className="flex shrink-0 items-center gap-1.5 rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary-strong">
                                <Users className="h-3 w-3" aria-hidden="true" />
                                People
                              </span>
                            ) : (
                              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            )
                          }
                        />

                        <CommandList>
                          <CommandEmpty>
                            {mode === "people"
                              ? people === null
                                ? "Loading people…"
                                : "Nobody matches that."
                              : query.trim()
                                ? `Nothing matches “${query.trim()}”.`
                                : "Start typing to search."}
                          </CommandEmpty>

                          {showingRecents && recents.length > 0 && (
                            <CommandGroup heading="Recent">
                              {recents.map((recent) => (
                                <Row
                                  key={recent.id}
                                  entry={{ ...recent, haystack: "" }}
                                  progressStatus={undefined}
                                  onSelect={run}
                                />
                              ))}
                            </CommandGroup>
                          )}

                          {showingRecents && (
                            <CommandGroup heading="Jump to">
                              {actions.slice(0, 5).map((entry) => (
                                <Row key={entry.id} entry={entry} onSelect={run} />
                              ))}
                            </CommandGroup>
                          )}

                          {showingRecents && (
                            <CommandGroup heading="Trails">
                              {curriculum
                                .filter((entry) => entry.kind === "trail")
                                .map((entry) => (
                                  <Row key={entry.id} entry={entry} onSelect={run} />
                                ))}
                            </CommandGroup>
                          )}

                          {results.actions.length > 0 && (
                            <CommandGroup heading="Actions">
                              {results.actions.map((entry) => (
                                <Row key={entry.id} entry={entry} onSelect={run} />
                              ))}
                            </CommandGroup>
                          )}

                          {results.topics.length > 0 && (
                            <CommandGroup heading="Topics">
                              {results.topics.map((entry) => (
                                <Row
                                  key={entry.id}
                                  entry={entry}
                                  progressStatus={entry.topicId ? progress[entry.topicId]?.status : undefined}
                                  onSelect={run}
                                />
                              ))}
                            </CommandGroup>
                          )}

                          {results.camps.length > 0 && (
                            <CommandGroup heading="Camps">
                              {results.camps.map((entry) => (
                                <Row key={entry.id} entry={entry} onSelect={run} />
                              ))}
                            </CommandGroup>
                          )}

                          {results.trails.length > 0 && (
                            <CommandGroup heading="Trails">
                              {results.trails.map((entry) => (
                                <Row key={entry.id} entry={entry} onSelect={run} />
                              ))}
                            </CommandGroup>
                          )}

                          {results.people.length > 0 && (
                            <CommandGroup heading="People">
                              {results.people.map((entry) => (
                                <Row key={entry.id} entry={entry} onSelect={run} />
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-3.5 py-2 text-[11px] text-muted-foreground">
                          <Hint keys={["↑", "↓"]} label="to move" />
                          <Hint keys={["↵"]} label="to open" />
                          {mode && <Hint keys={["⌫"]} label="to leave people" />}
                          <Hint keys={["Esc"]} label="to close" />
                        </div>
                      </Command>
                    </motion.div>
                  </DialogPrimitive.Content>
                </div>
              </>
            )}
          </AnimatePresence>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

function Hint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {keys.map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
      {label}
    </span>
  );
}

/** One row. The mark on the left says what kind of thing it is without a word for it. */
function Row({
  entry,
  progressStatus,
  onSelect,
}: {
  entry: CommandEntry;
  progressStatus?: TopicStatus;
  onSelect: (entry: CommandEntry) => void;
}) {
  const ActionIcon = entry.kind === "action" ? (ACTION_ICONS[entry.id] ?? Compass) : null;
  const accentBg = entry.accentToken ? accentClasses[entry.accentToken].bg : "bg-basalt";

  return (
    <CommandItem value={entry.id} onSelect={() => onSelect(entry)}>
      {ActionIcon ? (
        <ActionIcon className="text-muted-foreground" aria-hidden="true" />
      ) : entry.kind === "person" ? (
        <Avatar name={entry.title} size="sm" />
      ) : entry.kind === "topic" ? (
        <StatusDot status={progressStatus ?? "not-started"} />
      ) : (
        <span
          aria-hidden="true"
          className={cn("h-4 w-4 shrink-0", accentBg, entry.kind === "trail" ? "rounded-full" : "rounded-[4px]")}
        />
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{entry.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{entry.context}</span>
      </span>

      {entry.meta && <CommandMeta>{entry.meta}</CommandMeta>}
    </CommandItem>
  );
}
