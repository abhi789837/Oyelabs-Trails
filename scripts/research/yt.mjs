#!/usr/bin/env node
// YouTube research helper for curriculum authors. It reads YouTube's own pages (never an
// aggregator site), so every id it prints is real at the time you run it.
//
//   node scripts/research/yt.mjs search "react useEffect cleanup" [--max 12]
//   node scripts/research/yt.mjs info <videoId|url> [--chapters]
//
// `search` lists videos with channel, duration, views and age.
// `info` confirms a video exists and allows embedding (via oEmbed), and prints its title,
// channel, duration and, with --chapters, the chapter timestamps from its description
// (use them for `video.startSeconds`).

import { pathToFileURL } from "node:url";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const headers = { "user-agent": UA, "accept-language": "en-US,en;q=0.9" };

function extractJson(html, marker) {
  const start = html.indexOf(marker);
  if (start < 0) return null;
  let i = html.indexOf("{", start);
  let depth = 0;
  let inString = false;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (inString) {
      if (c === "\\") j++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return JSON.parse(html.slice(i, j + 1));
  }
  return null;
}

const text = (runs) => (runs?.simpleText ?? runs?.runs?.map((r) => r.text).join("") ?? "").trim();

export function parseVideoId(input) {
  const m = String(input).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/) ?? String(input).match(/^([\w-]{11})$/);
  return m?.[1] ?? null;
}

export function formatSeconds(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function parseTimestamp(ts) {
  return ts.split(":").map(Number).reduce((acc, n) => acc * 60 + n, 0);
}

export async function search(query, max = 12) {
  const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`, { headers });
  const data = extractJson(await res.text(), "var ytInitialData");
  const out = [];
  const walk = (node) => {
    if (!node || typeof node !== "object" || out.length >= max) return;
    if (node.videoRenderer) {
      const v = node.videoRenderer;
      out.push({
        videoId: v.videoId,
        title: text(v.title),
        channel: text(v.ownerText),
        duration: text(v.lengthText),
        views: text(v.viewCountText),
        published: text(v.publishedTimeText),
      });
      return;
    }
    for (const value of Object.values(node)) walk(value);
  };
  walk(data);
  return out;
}

export async function oembed(videoId) {
  const res = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
    { headers },
  );
  if (!res.ok) return { ok: false, status: res.status };
  const j = await res.json();
  return { ok: true, title: j.title, channel: j.author_name };
}

export async function info(videoId, withChapters = false) {
  const embed = await oembed(videoId);
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers });
  const html = await res.text();
  const player = extractJson(html, "var ytInitialPlayerResponse");
  const details = player?.videoDetails ?? {};
  const lengthSeconds = Number(details.lengthSeconds ?? 0);
  const result = {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    embeddable: embed.ok && player?.playabilityStatus?.playableInEmbed !== false,
    oembedStatus: embed.ok ? 200 : embed.status,
    title: embed.title ?? details.title,
    channel: embed.channel ?? details.author,
    lengthSeconds,
    durationLabel: lengthSeconds ? formatSeconds(lengthSeconds) : undefined,
    views: details.viewCount ? Number(details.viewCount) : undefined,
    published: player?.microformat?.playerMicroformatRenderer?.publishDate,
  };
  if (withChapters) {
    // Description timestamps first (often prefixed with emoji or brackets)...
    const lines = String(details.shortDescription ?? "").split("\n");
    let chapters = lines
      .map((line) => {
        const m = line.match(/^[^\w]*?((?:\d{1,2}:)?\d{1,2}:\d{2})[)\]]?\s*[-–—:|]?\s*(.+)$/);
        return m ? { start: m[1], startSeconds: parseTimestamp(m[1]), title: m[2].trim() } : null;
      })
      .filter(Boolean);
    // ...then YouTube's own chapter markers.
    if (chapters.length === 0) {
      const initial = extractJson(html, "var ytInitialData");
      const found = [];
      const walk = (node) => {
        if (!node || typeof node !== "object") return;
        if (node.chapterRenderer) {
          const c = node.chapterRenderer;
          const startSeconds = Math.round(Number(c.timeRangeStartMillis ?? 0) / 1000);
          found.push({ start: formatSeconds(startSeconds), startSeconds, title: text(c.title) });
          return;
        }
        for (const value of Object.values(node)) walk(value);
      };
      walk(initial);
      chapters = found;
    }
    result.chapters = chapters;
  }
  return result;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const [cmd, arg, ...rest] = isMain ? process.argv.slice(2) : [];
if (cmd === "search" && arg) {
  const maxIdx = rest.indexOf("--max");
  const max = maxIdx >= 0 ? Number(rest[maxIdx + 1]) : 12;
  for (const v of await search(arg, max)) {
    console.log(`${v.videoId}  ${v.duration.padStart(8)}  ${v.views.padEnd(18)} ${v.published.padEnd(14)} ${v.channel} | ${v.title}`);
  }
} else if (cmd === "info" && arg) {
  const id = parseVideoId(arg);
  if (!id) throw new Error("Couldn't find a video id in " + arg);
  console.log(JSON.stringify(await info(id, rest.includes("--chapters")), null, 2));
} else if (isMain) {
  console.log(
    ['Usage:', '  node scripts/research/yt.mjs search "query" [--max 12]', "  node scripts/research/yt.mjs info <videoId|url> [--chapters]"].join("\n"),
  );
}
