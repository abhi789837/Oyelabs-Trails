import type { TextBlock } from "./passages";
import { safeFetch, type SafeFetchOptions } from "./fetch";

/**
 * YouTube transcripts from the public caption tracks a watch page lists (PLAN §4.3, DECISIONS:
 * "public caption tracks, best effort; no OAuth and no third-party scraper library").
 *
 * The watch page embeds `"captionTracks":[…]`. We prefer a human-written English track, then the
 * auto-generated English one, then the first track, and read it as `fmt=json3` (timed events),
 * falling back to the XML format. Anything unexpected returns null: the video is then "not used
 * for questions" and the module test uses the docs and notes instead.
 */

interface CaptionTrack {
  baseUrl: string;
  languageCode?: string;
  kind?: string;
}

export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, n: string) => String.fromCodePoint(Number(n)));
}

export function captionTracksFrom(html: string): CaptionTrack[] {
  const at = html.indexOf('"captionTracks":');
  if (at < 0) return [];
  const start = html.indexOf("[", at);
  let depth = 0;
  for (let i = start; i < html.length && i < start + 200_000; i++) {
    if (html[i] === "[") depth++;
    else if (html[i] === "]" && --depth === 0) {
      try {
        const tracks = JSON.parse(html.slice(start, i + 1)) as CaptionTrack[];
        return tracks.filter((t) => typeof t.baseUrl === "string");
      } catch {
        return [];
      }
    }
  }
  return [];
}

export function pickTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  const english = (t: CaptionTrack) => (t.languageCode ?? "").toLowerCase().startsWith("en");
  return tracks.find((t) => english(t) && t.kind !== "asr") ?? tracks.find(english) ?? tracks[0] ?? null;
}

export function parseJson3(body: string): CaptionSegment[] {
  const data = JSON.parse(body) as { events?: { tStartMs?: number; dDurationMs?: number; segs?: { utf8?: string }[] }[] };
  const out: CaptionSegment[] = [];
  for (const e of data.events ?? []) {
    const text = (e.segs ?? []).map((s) => s.utf8 ?? "").join("").replace(/\s+/g, " ").trim();
    if (!text) continue;
    const start = (e.tStartMs ?? 0) / 1000;
    out.push({ start, end: start + (e.dDurationMs ?? 0) / 1000, text });
  }
  return out;
}

export function parseXmlCaptions(body: string): CaptionSegment[] {
  const out: CaptionSegment[] = [];
  for (const m of body.matchAll(/<text start="([\d.]+)"(?: dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g)) {
    const text = decodeEntities(decodeEntities(m[3].replace(/<[^>]+>/g, ""))).replace(/\s+/g, " ").trim();
    if (!text) continue;
    const start = Number(m[1]);
    out.push({ start, end: start + Number(m[2] ?? 0), text });
  }
  return out;
}

/** Caption segments as blocks with their start/end second. */
export function segmentBlocks(segments: CaptionSegment[], offsetSec = 0): TextBlock[] {
  return segments.map((s) => ({ text: s.text, locator: { startSec: s.start + offsetSec, endSec: s.end + offsetSec } }));
}

export async function youtubeCaptions(videoId: string, options: SafeFetchOptions = {}): Promise<CaptionSegment[] | null> {
  try {
    const page = await safeFetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&hl=en`, { ...options, maxBytes: 8 * 1024 * 1024 });
    if (page.status !== 200) return null;
    const track = pickTrack(captionTracksFrom(page.body.toString("utf8")));
    if (!track) return null;
    const base = track.baseUrl.replace(/\\u0026/g, "&");
    const json = await safeFetch(`${base}${base.includes("?") ? "&" : "?"}fmt=json3`, { ...options, maxBytes: 8 * 1024 * 1024 });
    if (json.status === 200 && json.body.length > 0) {
      try {
        const segments = parseJson3(json.body.toString("utf8"));
        if (segments.length) return segments;
      } catch {
        // Not JSON: try the XML form below.
      }
    }
    const xml = await safeFetch(base, { ...options, maxBytes: 8 * 1024 * 1024 });
    if (xml.status !== 200) return null;
    const segments = parseXmlCaptions(xml.body.toString("utf8"));
    return segments.length ? segments : null;
  } catch {
    return null;
  }
}
