// Curriculum access for the app. Navigation and progress use the light manifest; full module
// content (summaries, references, videos, challenges) is code-split and loaded on demand.
import type { Module, TrackId } from "@/types/curriculum";
import { manifest } from "./manifest.generated";
import type { ModuleMeta, TopicMeta, TrackMeta } from "./manifest-types";

export type { ModuleMeta, TopicMeta, TrackMeta } from "./manifest-types";

export const tracks: TrackMeta[] = manifest;

const topicIndex = new Map<string, { track: TrackMeta; module: ModuleMeta; topic: TopicMeta }>();
for (const track of tracks) {
  for (const module of track.modules) {
    for (const topic of module.topics) topicIndex.set(topic.id, { track, module, topic });
  }
}

export function getTrack(id: string | undefined): TrackMeta | undefined {
  return tracks.find((t) => t.id === id);
}

export function getModule(trackId: string | undefined, moduleId: string | undefined): ModuleMeta | undefined {
  return getTrack(trackId)?.modules.find((m) => m.id === moduleId);
}

export function findTopic(topicId: string | undefined) {
  return topicId ? topicIndex.get(topicId) : undefined;
}

/** All topics of a track in trail order (modules in order, topics in order). */
export function trackTopics(track: TrackMeta): TopicMeta[] {
  return track.modules.flatMap((m) => m.topics);
}

export function allTopics(): TopicMeta[] {
  return tracks.flatMap(trackTopics);
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

export function moduleNeighbors(trackId: TrackId, moduleId: string): { prev?: ModuleMeta; next?: ModuleMeta } {
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

// ---- Lazy module content ----

const loaders = import.meta.glob<{ default: Module }>([
  "./frontend/*.ts",
  "./backend/*.ts",
  "./fullstack/*.ts",
  "./ai-driven/*.ts",
]);

const cache = new Map<string, Module>();
const pending = new Map<string, Promise<Module>>();

export function getCachedModule(trackId: string, moduleId: string): Module | undefined {
  return cache.get(`${trackId}/${moduleId}`);
}

export function loadModule(trackId: string, moduleId: string): Promise<Module> {
  const key = `${trackId}/${moduleId}`;
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const inflight = pending.get(key);
  if (inflight) return inflight;
  const loader = loaders[`./${trackId}/${moduleId}.ts`];
  if (!loader) return Promise.reject(new Error(`No content for module ${key}`));
  const promise = loader()
    .then((m) => {
      cache.set(key, m.default);
      return m.default;
    })
    .finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}
