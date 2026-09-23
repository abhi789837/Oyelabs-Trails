import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

import { TOPIC_LEVELS, TRACK_IDS } from "./enums";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * `shared/enums.ts` mirrors the curriculum's `TrackId` and `TopicLevel` unions so the server can
 * validate them at runtime, which a TypeScript type cannot do. These tests are the guard against
 * the two drifting: adding a track in one place and not the other fails here instead of silently
 * rejecting valid input in production.
 *
 * The unions are read out of the source text, so reformatting that declaration will fail this
 * test. That is deliberate — a loud failure is better than a check that quietly stops checking.
 */
function unionMembers(source: string, typeName: string): string[] {
  const match = new RegExp(`export type ${typeName} =([^;]+);`).exec(source);
  if (!match) throw new Error(`Could not find "export type ${typeName} = …;" in src/types/curriculum.ts`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

const curriculumSource = fs.readFileSync(path.join(root, "src/types/curriculum.ts"), "utf8");

test("TRACK_IDS matches TrackId in src/types/curriculum.ts", () => {
  expect([...TRACK_IDS].sort()).toEqual(unionMembers(curriculumSource, "TrackId").sort());
});

test("TOPIC_LEVELS matches TopicLevel in src/types/curriculum.ts", () => {
  expect([...TOPIC_LEVELS].sort()).toEqual(unionMembers(curriculumSource, "TopicLevel").sort());
});

test("TRACK_IDS matches the tracks the generated manifest actually contains", async () => {
  const { manifest } = (await import("../src/content/manifest.generated")) as {
    manifest: { id: string }[];
  };
  const inManifest = manifest.map((t) => t.id).sort();
  // Every manifest track must be a known id. The reverse is allowed while a new track's first
  // module is still being written.
  expect(inManifest.filter((id) => !(TRACK_IDS as readonly string[]).includes(id))).toEqual([]);
});
