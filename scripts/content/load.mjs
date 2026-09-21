// Shared loader for content scripts. Node 22.18+ strips TypeScript types natively, and the
// content files only use `import type`, so they import directly.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const CONTENT_DIR = path.join(ROOT, "src", "content");
export const SOLUTIONS_DIR = path.join(ROOT, "content-tests", "solutions");

export async function loadRegistry() {
  const { registry } = await import(pathToFileURL(path.join(CONTENT_DIR, "registry.ts")).href);
  return registry;
}

export function moduleFile(trackId, moduleId) {
  return path.join(CONTENT_DIR, trackId, `${moduleId}.ts`);
}

/** Loads every module file that exists, in registry order. Missing modules are listed separately. */
export async function loadCurriculum({ only } = {}) {
  const registry = await loadRegistry();
  const loaded = [];
  const missing = [];
  for (const track of registry) {
    for (const entry of track.modules) {
      if (only?.length && !only.includes(entry.id)) continue;
      const file = moduleFile(track.id, entry.id);
      if (!fs.existsSync(file)) {
        missing.push({ trackId: track.id, moduleId: entry.id, name: entry.name });
        continue;
      }
      const mod = (await import(pathToFileURL(file).href)).default;
      loaded.push({ track, entry, file, mod });
    }
  }
  return { registry, loaded, missing };
}
