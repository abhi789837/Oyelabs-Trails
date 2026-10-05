/**
 * v4.4: fluency metrics from a timestamped transcript (docs/v4.4/research §D).
 *
 * Advisory only. Nothing here decides a pass: Whisper drops many fillers and mis-hears accented
 * speech, so these numbers coach, they do not grade.
 */

export interface TimedWord {
  w: string;
  start: number;
  end: number;
}

export interface SpeechMetrics {
  /** Words per minute between the first word's start and the last word's end. */
  wpm: number;
  /** Gaps of at least PAUSE_SEC between consecutive words. */
  pauses: number;
  longestPauseSec: number;
  /** Approximate: the transcriber drops many of them. */
  fillers: number;
}

export const PAUSE_SEC = 1.0;

/** Single-word fillers. "like", "actually" and "basically" are often not fillers, hence approximate. */
const FILLER_WORDS = new Set(["um", "umm", "uh", "uhh", "er", "erm", "like", "basically", "actually"]);
/** Two-word fillers, matched on consecutive normalised words. */
const FILLER_PAIRS: [string, string][] = [["you", "know"]];

/** Lowercase and strip punctuation, so "Um," and "um" match. Apostrophes inside words are kept. */
export function normaliseWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^\p{L}\p{N}']+/gu, "")
    .replace(/^'+|'+$/g, "");
}

/** Drops empty tokens and anything with impossible timings, and sorts by start. */
export function cleanWords(words: readonly TimedWord[]): TimedWord[] {
  return words
    .filter((x) => normaliseWord(x.w) !== "" && Number.isFinite(x.start) && Number.isFinite(x.end) && x.end >= x.start && x.start >= 0)
    .slice()
    .sort((a, b) => a.start - b.start);
}

export function wordsPerMinute(words: readonly TimedWord[]): number {
  const clean = cleanWords(words);
  if (clean.length < 2) return 0;
  const span = clean[clean.length - 1]!.end - clean[0]!.start;
  if (span <= 0) return 0;
  return Math.round((clean.length / span) * 60);
}

export function pauseGaps(words: readonly TimedWord[], thresholdSec = PAUSE_SEC): number[] {
  const clean = cleanWords(words);
  const gaps: number[] = [];
  for (let i = 1; i < clean.length; i += 1) {
    // Rounded first, so the pause count and the longest pause (also rounded) never disagree.
    const gap = round1(clean[i]!.start - clean[i - 1]!.end);
    if (gap >= thresholdSec) gaps.push(gap);
  }
  return gaps;
}

export function longestPause(words: readonly TimedWord[]): number {
  const clean = cleanWords(words);
  let longest = 0;
  for (let i = 1; i < clean.length; i += 1) longest = Math.max(longest, clean[i]!.start - clean[i - 1]!.end);
  return round1(longest);
}

export function countFillers(text: string | readonly TimedWord[]): number {
  const tokens = (typeof text === "string" ? text.split(/\s+/) : text.map((x) => x.w)).map(normaliseWord).filter(Boolean);
  let count = 0;
  for (let i = 0; i < tokens.length; i += 1) {
    if (FILLER_WORDS.has(tokens[i]!)) {
      count += 1;
      continue;
    }
    if (FILLER_PAIRS.some(([a, b]) => tokens[i] === a && tokens[i + 1] === b)) {
      count += 1;
      i += 1;
    }
  }
  return count;
}

export function computeMetrics(words: readonly TimedWord[], transcript?: string): SpeechMetrics {
  return {
    wpm: wordsPerMinute(words),
    pauses: pauseGaps(words).length,
    longestPauseSec: longestPause(words),
    // Words are the better source when present (the transcript may be the same text joined);
    // the transcript is a fallback for a transcriber that returns no timings.
    fillers: countFillers(words.length ? words : (transcript ?? "")),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
