/**
 * Bundle budgets (`npm run size`, after `npm run build`).
 *
 * Budget from docs/v5/PLAN.md: under 200 KB gzipped of initial JS for learner routes. The file
 * lists come from the built output (scripts/perf/chunks.mjs): the entry, its preloads, and the
 * route's lazy chunks with their static imports. Dynamic imports are not counted: they are
 * exactly what code splitting deferred.
 */
import { DESIGN_CHUNKS, LEARNER_CHUNKS, entryFiles, routeFiles } from "./scripts/perf/chunks.mjs";
import path from "node:path";

const rel = (f) => path.relative(process.cwd(), f).split(path.sep).join("/");

export default [
  {
    name: "v5 learner initial JS (/learn)",
    path: routeFiles(LEARNER_CHUNKS).files,
    limit: "200 KB",
    gzip: true,
  },
  {
    name: "/design first load (sections lazy)",
    path: routeFiles(DESIGN_CHUNKS).files,
    limit: "230 KB",
    gzip: true,
  },
  {
    name: "Shared app entry (both designs)",
    path: [...entryFiles()].map(rel),
    limit: "185 KB",
    gzip: true,
  },
];
