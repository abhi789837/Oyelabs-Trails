import { getTrackTotalMinutes } from "@/data/tracks";
import { hashString } from "@/lib/shuffle";
import { trackCodes } from "@/lib/track-meta";
import type { TopicProgress } from "@/store/progressStore";
import type { AccentToken, Track, TrackId } from "@/types/curriculum";

/** Brand hexes for places without CSS variables (the PDF). Keep in sync with index.css. */
export const accentHex: Record<AccentToken, string> = {
  trailmark: "#D98E2B",
  summit: "#2F6E5B",
  ridge: "#6C5CE7",
  glacier: "#2E7DA8",
  basalt: "#6B7280",
};

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encode(n: number, length: number): string {
  let out = "";
  let value = n >>> 0;
  for (let i = 0; i < length; i++) {
    out += CROCKFORD[value & 31];
    value >>>= 5;
  }
  return out;
}

/** Scale factor for the name on the certificate so long names fit on one line. */
export function nameScale(name: string): number {
  const length = normalizeName(name).length;
  if (length <= 22) return 1;
  if (length <= 30) return 0.8;
  if (length <= 40) return 0.64;
  return 0.54;
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/**
 * Deterministic ID from the track, the learner's name and the track completion time.
 * The same inputs always give the same ID, e.g. OYL-FE-7K2Q-M9XD. It is NOT a
 * verifiable credential: there's no server holding a record of it (see README).
 */
export function certificateId(trackId: TrackId, name: string, completedAt: string): string {
  const input = `${trackId}|${normalizeName(name).toLowerCase()}|${completedAt}`;
  return `OYL-${trackCodes[trackId]}-${encode(hashString(input), 4)}-${encode(hashString(`${input}|2`), 4)}`;
}

export interface CertificateData {
  name: string;
  trackId: TrackId;
  trackName: string;
  accentHex: string;
  topicsCount: number;
  milestoneCount: number;
  totalMinutes: number;
  averageScore: number | null;
  completedAt: string;
  certificateId: string;
}

export function buildCertificateData(
  track: Track,
  progress: Record<string, TopicProgress>,
  name: string,
  completedAt: string,
): CertificateData {
  const scores = track.topics
    .map((t) => progress[t.id]?.bestScore)
    .filter((s): s is number => typeof s === "number");
  return {
    name: normalizeName(name),
    trackId: track.id,
    trackName: track.name,
    accentHex: accentHex[track.accentToken],
    topicsCount: track.topics.length,
    milestoneCount: track.topics.filter((t) => t.isMilestone).length,
    totalMinutes: getTrackTotalMinutes(track),
    averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    completedAt,
    certificateId: certificateId(track.id, name, completedAt),
  };
}
