#!/usr/bin/env node
// Emits server/content/<trackId>/<moduleId>.json: the full curriculum, for the server to serve.
//
// In v2 every module's content was bundled into the SPA. From v3 the server owns it, because
// "a learner may only see their assigned topics" and "answer keys never reach the client" are
// both impossible when the whole curriculum ships to the browser (brief §7).
//
// Runs automatically before `dev` and `build`. Safe to run repeatedly: files are only rewritten
// when their content actually changes, so a watcher does not see spurious updates.
import fs from "node:fs";
import path from "node:path";

import { loadCurriculum, ROOT } from "./load.mjs";

const outDir = path.join(ROOT, "server", "content");

const { registry, loaded, missing } = await loadCurriculum();

/**
 * The track and module ordering, emitted as data so the server never has to import SPA source
 * (which would drag the `@/` alias and the curriculum types into the server bundle).
 */
fs.mkdirSync(outDir, { recursive: true });
const registryJson =
  JSON.stringify(
    registry.map((track) => ({
      id: track.id,
      name: track.name,
      tagline: track.tagline,
      accentToken: track.accentToken,
      modules: track.modules.map((m) => ({ id: m.id, name: m.name })),
    })),
    null,
    2,
  ) + "\n";
const registryFile = path.join(outDir, "registry.json");
if (!fs.existsSync(registryFile) || fs.readFileSync(registryFile, "utf8") !== registryJson) {
  fs.writeFileSync(registryFile, registryJson);
}

let written = 0;
let unchanged = 0;
const seen = new Set();

for (const { track, mod } of loaded) {
  const dir = path.join(outDir, track.id);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${mod.id}.json`);
  seen.add(path.relative(outDir, file));

  // Pretty-printed: these files are read by a human when debugging a content bug, and gzip makes
  // the size difference irrelevant over the wire.
  const json = JSON.stringify(mod, null, 2) + "\n";
  const previous = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (previous === json) {
    unchanged += 1;
    continue;
  }
  fs.writeFileSync(file, json);
  written += 1;
}

// Remove JSON for modules that no longer exist, so a renamed module cannot keep serving.
let removed = 0;
if (fs.existsSync(outDir)) {
  for (const trackDir of fs.readdirSync(outDir)) {
    const full = path.join(outDir, trackDir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const name of fs.readdirSync(full)) {
      if (!name.endsWith(".json")) continue;
      if (seen.has(path.join(trackDir, name))) continue;
      fs.unlinkSync(path.join(full, name));
      removed += 1;
    }
  }
}

const parts = [`server content: ${loaded.length} modules`];
if (written) parts.push(`${written} written`);
if (unchanged) parts.push(`${unchanged} unchanged`);
if (removed) parts.push(`${removed} removed`);
if (missing.length) parts.push(`${missing.length} not written yet`);
console.log(parts.join(", "));
