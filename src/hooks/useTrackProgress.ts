import type { Track } from "@/types/curriculum";

export interface TrackProgressSummary {
  completed: number;
  total: number;
  pct: number;
  isComplete: boolean;
}

// Placeholder until the progress store lands (phase 4).
export function useTrackProgress(track: Track): TrackProgressSummary {
  return { completed: 0, total: track.topics.length, pct: 0, isComplete: false };
}
