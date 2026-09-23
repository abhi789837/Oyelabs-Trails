import { useCurriculumStore } from "@/store/curriculumStore";
import type { ModuleMeta, TopicMeta, TrackMeta } from "@shared/content";

/**
 * Curriculum access for the app.
 *
 * In v2 this module owned a generated manifest and lazily imported bundled content. From v3 both
 * come from the server, filtered to the signed-in person (brief §7), and live in
 * `curriculumStore`. The helper signatures below are unchanged, so every page and component that
 * used them still works — they just read from the store instead of a bundled constant.
 *
 * `getTracks()` is the non-reactive read, for effects and plain functions. Components that should
 * re-render when the manifest arrives use `useTracks()`.
 */

export type { ModuleMeta, TopicMeta, TrackMeta } from "@shared/content";
export { getCachedModule, loadModule } from "@/store/curriculumStore";

export function getTracks(): TrackMeta[] {
  return useCurriculumStore.getState().tracks;
}

/** Reactive form of `getTracks()`. */
export function useTracks(): TrackMeta[] {
  return useCurriculumStore((s) => s.tracks);
}

export function getTrack(id: string | undefined): TrackMeta | undefined {
  return getTracks().find((t) => t.id === id);
}

export function getModule(trackId: string | undefined, moduleId: string | undefined): ModuleMeta | undefined {
  return getTrack(trackId)?.modules.find((m) => m.id === moduleId);
}

/**
 * Rebuilt whenever the manifest changes rather than on every lookup: `findTopic` is called on
 * every topic render and every search keystroke, and a linear scan of ~300 topics each time adds
 * up.
 */
let indexedTracks: TrackMeta[] | null = null;
let topicIndex = new Map<string, { track: TrackMeta; module: ModuleMeta; topic: TopicMeta }>();

function index() {
  const tracks = getTracks();
  if (indexedTracks === tracks) return topicIndex;
  const next = new Map<string, { track: TrackMeta; module: ModuleMeta; topic: TopicMeta }>();
  for (const track of tracks) {
    for (const module of track.modules) {
      for (const topic of module.topics) next.set(topic.id, { track, module, topic });
    }
  }
  indexedTracks = tracks;
  topicIndex = next;
  return topicIndex;
}

export function findTopic(topicId: string | undefined) {
  return topicId ? index().get(topicId) : undefined;
}

/** All topics of a track in trail order (modules in order, topics in order). */
export function trackTopics(track: TrackMeta): TopicMeta[] {
  return track.modules.flatMap((m) => m.topics);
}

export function allTopics(): TopicMeta[] {
  return getTracks().flatMap(trackTopics);
}

export function topicPath(topic: Pick<TopicMeta, "trackId" | "moduleId" | "id">): string {
  return `/track/${topic.trackId}/module/${topic.moduleId}/topic/${topic.id}`;
}

export function modulePath(module: Pick<ModuleMeta, "trackId" | "id">): string {
  return `/track/${module.trackId}/module/${module.id}`;
}

/** Previous/next topic along the whole track, crossing module boundaries. */
export function topicNeighbors(topicId: string): { prev?: TopicMeta; next?: TopicMeta } {
  const found = findTopic(topicId);
  if (!found) return {};
  const list = trackTopics(found.track);
  const i = list.findIndex((t) => t.id === topicId);
  return { prev: list[i - 1], next: list[i + 1] };
}

export function moduleNeighbors(trackId: string, moduleId: string): { prev?: ModuleMeta; next?: ModuleMeta } {
  const track = getTrack(trackId);
  if (!track) return {};
  const available = track.modules.filter((m) => m.available);
  const i = available.findIndex((m) => m.id === moduleId);
  return i < 0 ? {} : { prev: available[i - 1], next: available[i + 1] };
}

export function trackMinutes(track: TrackMeta): number {
  return trackTopics(track).reduce((sum, t) => sum + t.estMinutes, 0);
}

export function moduleMinutes(module: ModuleMeta): number {
  return module.topics.reduce((sum, t) => sum + t.estMinutes, 0);
}
