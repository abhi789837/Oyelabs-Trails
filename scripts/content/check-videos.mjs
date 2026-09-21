#!/usr/bin/env node
// Re-verifies every video in the curriculum against YouTube oEmbed (exists + embeddable).
//
//   npm run content:videos
import { oembed } from "../research/yt.mjs";
import { loadCurriculum } from "./load.mjs";

const { loaded } = await loadCurriculum();
const videos = new Map();
for (const { mod } of loaded) {
  for (const t of mod.topics) {
    for (const v of [t.video, ...(t.alternateVideos ?? [])]) {
      const where = `${mod.id}/${t.id}`;
      if (!v.videoId) {
        console.log(`fallback  ${where}  ${v.url}`);
        continue;
      }
      videos.set(v.videoId, [...(videos.get(v.videoId) ?? []), where]);
    }
  }
}

let bad = 0;
const ids = [...videos.keys()];
for (let i = 0; i < ids.length; i += 8) {
  const batch = ids.slice(i, i + 8);
  const results = await Promise.all(batch.map((id) => oembed(id)));
  batch.forEach((id, j) => {
    if (!results[j].ok) {
      bad++;
      console.log(`BROKEN ${results[j].status}  ${id}  used by ${videos.get(id).join(", ")}`);
    }
  });
}
console.log(`\n${ids.length} unique videos checked, ${bad} broken or not embeddable.`);
if (bad) process.exitCode = 1;
