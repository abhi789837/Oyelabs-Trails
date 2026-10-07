/**
 * Fails when a heavy library (Monaco, Recharts, Tiptap, confetti, MediaPipe, ExcelJS) is in
 * the first download of the v5 learner landing or of /design. Run after `npm run build`.
 */

import { DESIGN_CHUNKS, HEAVY, LEARNER_CHUNKS, routeFiles } from "./chunks.mjs";

let failed = false;
for (const [label, chunks] of [
  ["v5 learner /learn", LEARNER_CHUNKS],
  ["/design", DESIGN_CHUNKS],
]) {
  const { files, missing } = routeFiles(chunks);
  if (missing.length) {
    console.log(`${label}: chunk(s) not found in dist: ${missing.join(", ")} (built before the v5 routes existed?)`);
    failed = true;
    continue;
  }
  const heavy = files.filter((f) => HEAVY.test(f));
  if (heavy.length) {
    console.log(`${label}: heavy chunk(s) in the first download: ${heavy.join(", ")}`);
    failed = true;
  } else console.log(`${label}: ${files.length} files, no heavy libraries`);
}
process.exit(failed ? 1 : 0);
