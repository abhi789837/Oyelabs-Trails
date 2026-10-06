/**
 * Bundle budgets (`npm run size`, after `npm run build`).
 *
 * Budget from docs/v5/PLAN.md: under 200 KB gzipped of initial JS for learner routes (every v5
 * learner route is listed since Phase 9.1), plus a size guard on the admin frame. The file
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
    name: "v5 lesson player initial JS (/learn/lesson/:id)",
    path: routeFiles(["V5App", "LessonPage"]).files,
    limit: "200 KB",
    gzip: true,
  },
  // Phase 9.1: the other learner routes, under the same 200 KB budget (docs/v5/PLAN.md rule 2).
  ...[
    ["My plan (/learn/plan)", "PlanPage"],
    ["Library (/learn/library)", "LibraryPage"],
    ["Course page (/learn/library/:courseId)", "CoursePage"],
    ["Review (/learn/review)", "ReviewPage"],
    ["Me (/learn/me)", "MePage"],
  ].map(([label, chunk]) => ({
    name: `v5 learner initial JS: ${label}`,
    path: routeFiles(["V5App", chunk]).files,
    limit: "200 KB",
    gzip: true,
  })),
  {
    // Staff only and mostly on a desktop, so no learner budget: the limit is today's size plus about
    // 10 %, to catch a heavy library landing in the admin frame (264 KB gzipped at Phase 9.1).
    name: "v5 admin initial JS (/admin inbox)",
    path: routeFiles(["V5App", "AdminShell", "InboxPage"]).files,
    limit: "290 KB",
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
