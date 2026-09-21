import type { Topic, Track, TrackId } from "@/types/curriculum";
import { aiDrivenTrack } from "./ai-driven";
import { backendTrack } from "./backend";
import { frontendTrack } from "./frontend";
import { fullstackTrack } from "./fullstack";

export const allTracks: Track[] = [frontendTrack, backendTrack, fullstackTrack, aiDrivenTrack];

const topicIndex = new Map<string, Topic>(
  allTracks.flatMap((track) => track.topics.map((topic) => [topic.id, topic] as const)),
);

export function getTopicById(id: string): Topic | undefined {
  return topicIndex.get(id);
}

export function getTrackById(id: string | undefined): Track | undefined {
  return allTracks.find((track) => track.id === id);
}

export function isTrackId(id: string | undefined): id is TrackId {
  return allTracks.some((track) => track.id === id);
}

export function getTopicNeighbors(topic: Topic): { prev?: Topic; next?: Topic } {
  const track = getTrackById(topic.trackId);
  if (!track) return {};
  const index = track.topics.findIndex((t) => t.id === topic.id);
  return { prev: track.topics[index - 1], next: track.topics[index + 1] };
}

export function getTrackTotalMinutes(track: Track): number {
  return track.topics.reduce((sum, topic) => sum + topic.estMinutes, 0);
}
