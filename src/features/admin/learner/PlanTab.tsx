import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check, ChevronDown, ChevronRight, Minus, Plus, Search } from "lucide-react";

import type { TopicProgressValue } from "@shared/content";
import type { PlanResponse } from "@shared/plans";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useTracks, type ModuleMeta, type TopicMeta, type TrackMeta } from "@/content";
import { accentClasses, type AccentClasses } from "@/lib/accent";
import { levelLabels, trackIcons } from "@/lib/track-meta";
import { transition } from "@/lib/motion";
import { cn, formatMinutes, formatMinutesCompact, formatTimestamp } from "@/lib/utils";

/**
 * The plan editor (brief §11.2).
 *
 * Publishing is append-only: every save creates a new version rather than editing the current
 * one, so the AI's original proposal stays on the record and the diff against it below stays
 * meaningful. The server rejects unknown topic ids and that message is surfaced verbatim —
 * silently dropping them would publish a plan the admin did not assemble.
 *
 * The picker is a two-level drill-down rather than one list. At 7 trails, 67 camps and 715
 * topics, a flat list ran to thousands of pixels and a full-width row per topic wasted the
 * screen. Level one is a trailhead board: one card per trail, carrying the number that actually
 * matters when you are assembling a plan — how much weight this trail already has in it. Level
 * two is that trail's camps, each a grid of compact waypoints four across, so a camp's worth of
 * choices fits in one glance instead of one scroll.
 */
export function PlanTab({
  userId,
  displayName,
  plan,
  progress,
  onPublished,
}: {
  userId: string;
  displayName: string;
  plan: PlanResponse | null;
  progress: Record<string, TopicProgressValue>;
  onPublished: () => Promise<void>;
}) {
  const tracks = useTracks();
  const reduceMotion = useReducedMotion();

  const [selected, setSelected] = useState<Set<string>>(() => new Set(plan?.plan?.topicIds ?? []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [openTrackId, setOpenTrackId] = useState<string | null>(null);
  // Remembered past the Back, so the board can hand focus to the card you came out of.
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(null);
  const [collapsedCamps, setCollapsedCamps] = useState<Set<string>>(() => new Set());

  const published = useMemo(() => new Set(plan?.plan?.topicIds ?? []), [plan]);

  /* The AI's own proposal, for the per-topic diff. Publishing is append-only, so the original is
     still in the history and is found by source rather than by position — a later admin version
     does not displace it, and there is no AI version at all on a plan an admin assembled by hand.
     Null in that case, which is what turns every diff marker off rather than marking the whole
     plan as "added". */
  const aiBaseline = useMemo(() => {
    const aiVersion = plan?.history.find((p) => p.source === "ai");
    if (!aiVersion || !plan?.plan || plan.plan.id === aiVersion.id) return null;
    return { version: aiVersion.version, topicIds: new Set(aiVersion.topicIds) };
  }, [plan]);

  // A fresh publish elsewhere (or the first load landing after this tab mounted) re-seeds the
  // selection, so the editor never sits on a stale baseline.
  useEffect(() => {
    setSelected(new Set(plan?.plan?.topicIds ?? []));
  }, [plan]);

  const dirty = useMemo(
    () => selected.size !== published.size || [...selected].some((id) => !published.has(id)),
    [selected, published],
  );

  const added = [...selected].filter((id) => !published.has(id)).length;
  const removed = [...published].filter((id) => !selected.has(id)).length;

  const estimatedMinutes = useMemo(() => {
    let total = 0;
    for (const track of tracks) {
      for (const module of track.modules) {
        for (const topic of module.topics) if (selected.has(topic.id)) total += topic.estMinutes;
      }
    }
    return total;
  }, [tracks, selected]);

  const toggleTopic = (topicId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });

  /**
   * Add-all / remove-all for a camp. It works on the topics currently on screen, so with a filter
   * running it never silently changes something the admin cannot see; with no filter that is the
   * whole camp, exactly as before.
   */
  const toggleMany = (topics: TopicMeta[]) =>
    setSelected((current) => {
      const next = new Set(current);
      const all = topics.every((t) => next.has(t.id));
      for (const topic of topics) {
        if (all) next.delete(topic.id);
        else next.add(topic.id);
      }
      return next;
    });

  const handlePublish = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api.put<{ plan: PlanResponse["plan"] }>(`/api/admin/users/${userId}/plan`, {
        topicIds: [...selected],
      });
      await onPublished();
      setSelected(new Set(result.plan?.topicIds ?? []));
      setNotice(`Published version ${result.plan?.version}. ${displayName} sees these topics now.`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not publish that plan.");
    } finally {
      setSaving(false);
    }
  };

  const query = filter.trim().toLowerCase();
  const completedInPlan = [...selected].filter((id) => progress[id]?.status === "completed").length;

  const trackViews = useMemo(() => buildTrackViews(tracks, selected, query), [tracks, selected, query]);
  const openView = trackViews.find((view) => view.track.id === openTrackId) ?? null;

  // The manifest can arrive (or change) after a track was opened. Falling back to the trailhead
  // board beats stranding the admin on a panel with nothing in it.
  useEffect(() => {
    if (openTrackId && !trackViews.some((view) => view.track.id === openTrackId)) setOpenTrackId(null);
  }, [openTrackId, trackViews]);

  const matchesHere = openView
    ? openView.matchCount
    : trackViews.reduce((n, view) => n + view.matchCount, 0);

  const toggleCamp = (moduleId: string) =>
    setCollapsedCamps((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });

  return (
    <section aria-labelledby="plan-heading">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div>
          <h2 id="plan-heading" className="text-lg font-semibold">
            Learning plan
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {plan?.plan
              ? `Version ${plan.plan.version}, ${plan.plan.source === "ai" ? "generated" : "set by an admin"} on ${formatTimestamp(plan.plan.publishedAt)}.`
              : "No plan published yet. This person currently sees nothing."}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm tabular">
            {selected.size} topic{selected.size === 1 ? "" : "s"} · {formatMinutes(estimatedMinutes)}
          </p>
          {plan?.plan && (
            <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular">{completedInPlan} completed</p>
          )}
        </div>
      </div>

      {aiBaseline &&
        (() => {
          /* Measured against the **current selection**, not the published version, so the line
             tracks edits as they are made rather than only after a publish. */
          const addedSinceAi = [...selected].filter((id) => !aiBaseline.topicIds.has(id)).length;
          const removedSinceAi = [...aiBaseline.topicIds].filter((id) => !selected.has(id)).length;
          if (addedSinceAi === 0 && removedSinceAi === 0) return null;
          return (
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              Against the AI's version {aiBaseline.version}:{" "}
              {addedSinceAi > 0 && <span className="text-summit-strong">+{addedSinceAi} added</span>}
              {addedSinceAi > 0 && removedSinceAi > 0 && " · "}
              {removedSinceAi > 0 && <span className="text-destructive">−{removedSinceAi} dropped</span>}
              <span className="ml-1 text-muted-foreground/70">· marked on each topic below</span>
            </p>
          );
        })()}

      {plan?.plan && selected.size > 0 && (
        <Progress
          value={Math.round((completedInPlan / selected.size) * 100)}
          className="mt-3 h-1.5"
          indicatorClassName="bg-summit"
          aria-label="Plan progress"
        />
      )}

      {notice && (
        <p className="mt-4 rounded-md border border-summit/40 bg-summit/[0.07] px-3 py-2 text-sm" role="status">
          {notice}
        </p>
      )}
      {error && (
        <div className="mt-4">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      <div className="sticky top-14 z-10 -mx-4 mt-4 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <Input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onClear={() => setFilter("")}
          leading={<Search />}
          placeholder={openView ? `Filter ${openView.track.name} topics` : "Filter topics"}
          aria-label={openView ? `Filter topics in ${openView.track.name}` : "Filter topics across every track"}
          containerClassName="max-w-xs"
        />
        <Button loading={saving} onClick={() => void handlePublish()} disabled={!dirty || selected.size === 0}>
          Publish plan
        </Button>
        {dirty && (
          <>
            <span className="font-mono text-xs text-muted-foreground">
              {added > 0 && `+${added}`}
              {added > 0 && removed > 0 && " "}
              {removed > 0 && `−${removed}`} vs published
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(published))}>
              Discard changes
            </Button>
          </>
        )}
        {query && (
          <span className="font-mono text-xs text-muted-foreground tabular" role="status">
            {matchesHere} match{matchesHere === 1 ? "" : "es"}
            {openView ? ` in ${openView.track.name}` : " across all trails"}
          </span>
        )}
      </div>

      {/* The tab's one deliberate motion moment: the board hands over to the trail and back. It
          lifts rather than slides — a horizontal offset would flash a scrollbar on the way in. */}
      <AnimatePresence mode="wait" initial={false}>
        {openView ? (
          <motion.div
            key={openView.track.id}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={transition.base}
          >
            <TrackPanel
              view={openView}
              selected={selected}
              published={published}
              aiTopicIds={aiBaseline?.topicIds ?? null}
              progress={progress}
              query={query}
              collapsedCamps={collapsedCamps}
              onToggleCamp={toggleCamp}
              onToggleTopic={toggleTopic}
              onToggleMany={toggleMany}
              onBack={() => setOpenTrackId(null)}
              onClearFilter={() => setFilter("")}
            />
          </motion.div>
        ) : (
          <motion.div
            key="trailhead"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={transition.base}
          >
            <TrackBoard
              views={trackViews}
              query={query}
              totalMatches={matchesHere}
              lastOpenedId={lastOpenedId}
              onOpen={(trackId) => {
                setLastOpenedId(trackId);
                setOpenTrackId(trackId);
              }}
              onClearFilter={() => setFilter("")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

interface CampView {
  module: ModuleMeta;
  /** The camp's topics that survive the filter; all of them when the filter is empty. */
  visible: TopicMeta[];
  selectedCount: number;
}

interface TrackView {
  track: TrackMeta;
  /** Only camps with at least one visible topic. */
  camps: CampView[];
  campCount: number;
  topicCount: number;
  selectedCount: number;
  /** Minutes of this track's selected topics, so a card says what it costs the learner. */
  selectedMinutes: number;
  matchCount: number;
}

/** Same match rule as the old flat list: topic title, topic id, or the camp it sits in. */
function matchesQuery(topic: TopicMeta, moduleName: string, query: string): boolean {
  if (!query) return true;
  return (
    topic.title.toLowerCase().includes(query) ||
    topic.id.includes(query) ||
    moduleName.toLowerCase().includes(query)
  );
}

function buildTrackViews(tracks: TrackMeta[], selected: Set<string>, query: string): TrackView[] {
  return tracks.map((track) => {
    const available = track.modules.filter((m) => m.available);
    const camps: CampView[] = [];
    let topicCount = 0;
    let selectedCount = 0;
    let selectedMinutes = 0;
    let matchCount = 0;

    for (const module of available) {
      const visible: TopicMeta[] = [];
      let campSelected = 0;
      for (const topic of module.topics) {
        topicCount += 1;
        if (selected.has(topic.id)) {
          selectedCount += 1;
          campSelected += 1;
          selectedMinutes += topic.estMinutes;
        }
        if (matchesQuery(topic, module.name, query)) {
          visible.push(topic);
          matchCount += 1;
        }
      }
      if (visible.length > 0) camps.push({ module, visible, selectedCount: campSelected });
    }

    return { track, camps, campCount: available.length, topicCount, selectedCount, selectedMinutes, matchCount };
  });
}

// ---------------------------------------------------------------------------
// Level 1 — the trailhead board
// ---------------------------------------------------------------------------

function TrackBoard({
  views,
  query,
  totalMatches,
  lastOpenedId,
  onOpen,
  onClearFilter,
}: {
  views: TrackView[];
  query: string;
  totalMatches: number;
  lastOpenedId: string | null;
  onOpen: (trackId: string) => void;
  onClearFilter: () => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);

  // Coming back from a trail, focus lands on the card you came out of rather than at the top of
  // the tab. The list only ever mounts after a Back, so this runs once, on mount.
  useEffect(() => {
    if (!lastOpenedId) return;
    boardRef.current?.querySelector<HTMLButtonElement>(`[data-track-card="${lastOpenedId}"]`)?.focus();
  }, []);

  return (
    <div ref={boardRef} className="mt-6">
      <h3 className="text-sm font-medium">Pick a trail</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {query
          ? `Counts below are for “${query}”. Open a trail to add its matching topics.`
          : "Open one to add its topics. The plan can draw on as many trails as you like."}
      </p>

      <ul className="mt-4 grid list-none grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {views.map((view) => (
          <li key={view.track.id} className="min-w-0">
            <TrackCard view={view} query={query} onOpen={() => onOpen(view.track.id)} />
          </li>
        ))}
      </ul>

      {query && totalMatches === 0 && (
        <p className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          Nothing matches “{query}” on any trail.
          <Button variant="outline" size="sm" onClick={onClearFilter}>
            Clear filter
          </Button>
        </p>
      )}
    </div>
  );
}

function TrackCard({ view, query, onOpen }: { view: TrackView; query: string; onOpen: () => void }) {
  const accent = accentClasses[view.track.accentToken];
  const Icon = trackIcons[view.track.id];
  const pct = view.topicCount === 0 ? 0 : Math.round((view.selectedCount / view.topicCount) * 100);
  const blocked = query !== "" && view.matchCount === 0;

  return (
    /* Surface and border classes go on Card, not on the button: Slot joins the two class strings
       without running them through twMerge, so a conflicting pair would be decided by stylesheet
       order instead of by intent. */
    <Card
      asChild
      className={cn(
        "h-full transition-colors",
        blocked ? "opacity-50" : "hover:border-foreground/20 hover:bg-surface-sunken/50",
      )}
    >
      <button
        type="button"
        data-track-card={view.track.id}
        disabled={blocked}
        onClick={onOpen}
        className="group flex h-full w-full flex-col gap-3 p-4 text-left"
      >
        <span className="flex items-center gap-2.5">
          {/* A trail blaze: the painted mark that tells hikers which trail they're on. */}
          <span aria-hidden="true" className={cn("h-7 w-1.5 shrink-0 rounded-[2px]", accent.bg)} />
          <Icon className={cn("h-4 w-4 shrink-0", accent.text)} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate font-brand text-base font-semibold">{view.track.name}</span>
          <ChevronRight
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          />
        </span>

        <span className="block font-mono text-xs text-muted-foreground tabular">
          {view.campCount} camps, {view.topicCount} topics
        </span>

        <span className="mt-auto block">
          <span className="flex flex-wrap items-baseline justify-between gap-x-2">
            <span
              className={cn(
                "font-mono text-sm font-medium tabular",
                view.selectedCount > 0 ? accent.text : "text-muted-foreground",
              )}
            >
              {view.selectedCount} in plan
            </span>
            {view.selectedCount > 0 && (
              <span className="font-mono text-xs text-muted-foreground tabular">
                {formatMinutesCompact(view.selectedMinutes)}
              </span>
            )}
          </span>
          {/* A plain span bar rather than <Progress>: a <div> is not valid inside a <button>. */}
          <span aria-hidden="true" className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-foreground/10">
            <span className={cn("block h-full rounded-full transition-[width] duration-500", accent.bg)} style={{ width: `${pct}%` }} />
          </span>
        </span>

        {query !== "" && (
          <span className="block font-mono text-xs tabular">
            {blocked ? (
              <span className="text-muted-foreground">No matches for “{query}”</span>
            ) : (
              <span className={accent.text}>
                {view.matchCount} match{view.matchCount === 1 ? "" : "es"} for “{query}”
              </span>
            )}
          </span>
        )}
      </button>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Level 2 — one trail's camps
// ---------------------------------------------------------------------------

function TrackPanel({
  view,
  selected,
  published,
  aiTopicIds,
  progress,
  query,
  collapsedCamps,
  onToggleCamp,
  onToggleTopic,
  onToggleMany,
  onBack,
  onClearFilter,
}: {
  view: TrackView;
  selected: Set<string>;
  published: Set<string>;
  /** The AI's original proposal, or null when there is nothing to diff against. */
  aiTopicIds: Set<string> | null;
  progress: Record<string, TopicProgressValue>;
  query: string;
  collapsedCamps: Set<string>;
  onToggleCamp: (moduleId: string) => void;
  onToggleTopic: (topicId: string) => void;
  onToggleMany: (topics: TopicMeta[]) => void;
  onBack: () => void;
  onClearFilter: () => void;
}) {
  const accent = accentClasses[view.track.accentToken];
  const Icon = trackIcons[view.track.id];
  const backRef = useRef<HTMLButtonElement>(null);

  // Drilling in is a navigation, so focus goes with it — to the way out.
  useEffect(() => {
    backRef.current?.focus();
  }, []);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button ref={backRef} variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          All trails
        </Button>
        <span aria-hidden="true" className={cn("h-6 w-1.5 shrink-0 rounded-[2px]", accent.bg)} />
        <Icon className={cn("h-4 w-4 shrink-0", accent.text)} aria-hidden="true" />
        <h3 className="font-brand text-base font-semibold">{view.track.name}</h3>
        <span className="font-mono text-xs text-muted-foreground tabular">
          {view.selectedCount} of {view.topicCount} in plan
        </span>
      </div>

      {view.camps.length === 0 ? (
        <p className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          No topic on this trail matches “{query}”.
          <Button variant="outline" size="sm" onClick={onClearFilter}>
            Clear filter
          </Button>
        </p>
      ) : (
        <div className="mt-5 space-y-6">
          {view.camps.map((camp) => (
            <Camp
              key={camp.module.id}
              camp={camp}
              accent={accent}
              selected={selected}
              published={published}
              aiTopicIds={aiTopicIds}
              progress={progress}
              filtering={query !== ""}
              /* A filter has to show what it found, so a hit re-opens a camp the admin closed. */
              open={query !== "" || !collapsedCamps.has(camp.module.id)}
              onToggleOpen={() => onToggleCamp(camp.module.id)}
              onToggleTopic={onToggleTopic}
              onToggleMany={onToggleMany}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Camp({
  camp,
  accent,
  selected,
  published,
  aiTopicIds,
  progress,
  filtering,
  open,
  onToggleOpen,
  onToggleTopic,
  onToggleMany,
}: {
  camp: CampView;
  accent: AccentClasses;
  selected: Set<string>;
  published: Set<string>;
  aiTopicIds: Set<string> | null;
  progress: Record<string, TopicProgressValue>;
  filtering: boolean;
  open: boolean;
  onToggleOpen: () => void;
  onToggleTopic: (topicId: string) => void;
  onToggleMany: (topics: TopicMeta[]) => void;
}) {
  const { module, visible, selectedCount } = camp;
  const allVisibleSelected = visible.every((t) => selected.has(t.id));
  const headingId = `plan-camp-${module.id}`;
  const panelId = `plan-camp-topics-${module.id}`;

  return (
    <section aria-labelledby={headingId}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-2">
        {/* Collapsing is off while a filter runs: the filter decides what shows, and a camp the
            admin closed earlier must not swallow a hit. So there is no control to mislead them. */}
        {filtering ? (
          <span id={headingId} className="min-w-0 truncate text-sm font-medium">
            {module.name}
          </span>
        ) : (
          <button
            type="button"
            onClick={onToggleOpen}
            aria-expanded={open}
            aria-controls={panelId}
            className="flex min-w-0 items-center gap-2 rounded-sm text-left"
          >
            <ChevronDown
              aria-hidden="true"
              className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", !open && "-rotate-90")}
            />
            <span id={headingId} className="truncate text-sm font-medium">
              {module.name}
            </span>
          </button>
        )}
        <span className="font-mono text-xs text-muted-foreground tabular">
          {selectedCount}/{module.topics.length} selected
        </span>
        {selectedCount > 0 && selectedCount < module.topics.length && (
          <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", accent.bg)} />
        )}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => onToggleMany(visible)}>
          {allVisibleSelected ? <Minus aria-hidden="true" /> : <Plus aria-hidden="true" />}
          {allVisibleSelected
            ? filtering
              ? `Remove ${visible.length} shown`
              : "Remove camp"
            : filtering
              ? `Add ${visible.length} shown`
              : "Add camp"}
          <span className="sr-only"> in {module.name}</span>
        </Button>
      </div>

      <div id={panelId}>
        {open && (
          <ul className="mt-3 grid list-none grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((topic) => (
              <li key={topic.id} className="min-w-0">
                <TopicCell
                  topic={topic}
                  accent={accent}
                  isSelected={selected.has(topic.id)}
                  wasPublished={published.has(topic.id)}
                  aiDiff={aiDiffOf(aiTopicIds, topic.id, selected.has(topic.id))}
                  progressValue={progress[topic.id]}
                  onToggle={() => onToggleTopic(topic.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/**
 * How one topic differs from the AI's original proposal.
 *
 * `null` covers two different situations that need the same answer — there is no AI version to
 * compare against, and this topic is exactly where the AI left it — because in both cases there is
 * nothing to mark. Marking every unchanged topic "unchanged" would bury the handful that moved.
 */
function aiDiffOf(aiTopicIds: Set<string> | null, topicId: string, isSelected: boolean): "added" | "dropped" | null {
  if (!aiTopicIds) return null;
  const inAi = aiTopicIds.has(topicId);
  if (isSelected && !inAi) return "added";
  if (!isSelected && inAi) return "dropped";
  return null;
}

function TopicCell({
  topic,
  accent,
  isSelected,
  wasPublished,
  aiDiff,
  progressValue,
  onToggle,
}: {
  topic: TopicMeta;
  accent: AccentClasses;
  isSelected: boolean;
  wasPublished: boolean;
  aiDiff: "added" | "dropped" | null;
  progressValue: TopicProgressValue | undefined;
  onToggle: () => void;
}) {
  const status = progressValue?.status;
  const touched = status === "completed" || status === "in-progress";
  /** Published, now unticked: this topic leaves the learner's plan on the next publish. */
  const dropping = wasPublished && !isSelected;

  return (
    <Card
      asChild
      className={cn(
        "h-full transition-colors",
        isSelected ? cn(accent.border, accent.soft) : "hover:bg-surface-sunken/50",
        dropping && "border-destructive/60 bg-destructive/6",
        /* A left edge for the AI diff, so it reads without competing with the selection state the
           border and fill already carry. The two are different questions — "is this in the plan"
           and "did a person change this" — and they need different channels. */
        aiDiff === "added" && "border-l-2 border-l-summit",
        aiDiff === "dropped" && "border-l-2 border-l-destructive",
      )}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={onToggle}
        className="flex h-full w-full flex-col gap-1.5 p-3 text-left"
      >
        <span className="flex items-start gap-2">
          <span className="min-w-0 flex-1 text-sm font-medium leading-snug">{topic.title}</span>
          <span
            aria-hidden="true"
            className={cn(
              "mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border",
              isSelected ? cn(accent.bg, accent.border, accent.fg) : "border-input",
            )}
          >
            {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
        </span>

        <span className="block truncate font-mono text-[11px] text-muted-foreground">{topic.id}</span>

        <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 font-mono text-[11px] text-muted-foreground tabular">
          <span>{levelLabels[topic.level]}</span>
          <span>{formatMinutesCompact(topic.estMinutes)}</span>
        </span>

        {(touched || dropping || aiDiff !== null) && (
          <span className="flex flex-wrap items-center gap-1.5">
            {aiDiff !== null && (
              <span
                className={cn(
                  "font-mono text-[10px]",
                  aiDiff === "added" ? "text-summit-strong" : "text-destructive",
                )}
              >
                {aiDiff === "added" ? "+ added by an admin" : "− dropped from the AI's plan"}
              </span>
            )}
            {status === "completed" && (
              <StatusBadge kind="topic" status="completed">
                <span className="sr-only"> — the learner has completed this topic</span>
              </StatusBadge>
            )}
            {status === "in-progress" && (
              <StatusBadge kind="topic" status="in-progress">
                <span className="sr-only"> — the learner has work in progress here</span>
              </StatusBadge>
            )}
            {dropping && (
              <Badge variant="danger">
                removing
                <span className="sr-only">
                  {touched
                    ? " — this topic leaves the plan on publish, and the learner has already worked on it"
                    : " — this topic leaves the plan on publish"}
                </span>
              </Badge>
            )}
          </span>
        )}
      </button>
    </Card>
  );
}
