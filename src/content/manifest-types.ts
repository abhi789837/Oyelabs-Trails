import type { AccentToken, ChallengeType, TopicLevel, TopicResource, TrackId } from "@/types/curriculum";

/** Lightweight topic metadata, always loaded. Full content (quiz, refs, video) is lazy-loaded per module. */
export interface TopicMeta {
  id: string;
  moduleId: string;
  trackId: TrackId;
  title: string;
  level: TopicLevel;
  estMinutes: number;
  isMilestone?: boolean;
  challengeType: ChallengeType;
  /** Quiz question count or code test count. */
  challengeSize: number;
}

export interface ModuleMeta {
  id: string;
  trackId: TrackId;
  name: string;
  description: string;
  refs?: TopicResource[];
  topics: TopicMeta[];
  /** False while a module in the registry hasn't been written yet. */
  available: boolean;
}

export interface TrackMeta {
  id: TrackId;
  name: string;
  tagline: string;
  accentToken: AccentToken;
  modules: ModuleMeta[];
}
