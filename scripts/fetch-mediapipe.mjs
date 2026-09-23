#!/usr/bin/env node
// Self-hosts the MediaPipe assets the proctor engine needs, under public/mediapipe/ (brief §10.2).
//
//   node scripts/fetch-mediapipe.mjs
//
// They are not committed: ~46 MB of WASM and model binaries that npm and Google already host.
// The WASM is copied from the installed package, so it always matches the installed version; the
// two models are downloaded once. Loading them from a CDN at test time is explicitly ruled out —
// a proctored assessment must not depend on a third-party origin being up.
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "public", "mediapipe");

const MODELS = [
  {
    name: "face_landmarker.task",
    url: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  },
  {
    name: "efficientdet_lite0.tflite",
    url: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
  },
];

const wasmSource = path.join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
if (!existsSync(wasmSource)) {
  console.error("@mediapipe/tasks-vision is not installed. Run `npm install` first.");
  process.exit(1);
}

await fs.mkdir(path.join(target, "wasm"), { recursive: true });
await fs.mkdir(path.join(target, "models"), { recursive: true });
await fs.cp(wasmSource, path.join(target, "wasm"), { recursive: true });
console.log(`wasm: copied from the installed package`);

for (const model of MODELS) {
  const file = path.join(target, "models", model.name);
  if (existsSync(file)) {
    console.log(`${model.name}: already present`);
    continue;
  }
  const response = await fetch(model.url);
  if (!response.ok) throw new Error(`${response.status} fetching ${model.url}`);
  await fs.writeFile(file, Buffer.from(await response.arrayBuffer()));
  const { size } = await fs.stat(file);
  console.log(`${model.name}: downloaded (${(size / 1024 / 1024).toFixed(1)} MB)`);
}

console.log("\nMediaPipe assets are in public/mediapipe/.");
