# Oyelabs Trails — Complete Codebase Context

> **Purpose of this file.** This is a self-contained briefing on the whole repository, written to be
> pasted into another AI assistant so it can discuss, review, plan or extend this project without
> having the source. It describes the architecture, data model, conventions and constraints
> accurately as of the current `main` (commit `f2fc44d`, 55 commits, working tree clean).
> It is a *map*, not a dump: the repo is ~66,000 lines, ~59,000 of which are curriculum data files
> that all follow the one schema documented in §5.
>
> **Related files in-repo:** `CLAUDE.md` (the original build brief/spec, ~49 KB),
> `README.md` (user-facing), `docs/CONTENT_GUIDE.md` (content authoring bar),
> `docs/PROGRESS.md` (build tracker + decisions log), `docs/EMBEDDING.md` (iframe-embeddability map),
> `docs/research-notes/*.md` (per-module research provenance).

**Contents:** 1 What this is · 2 Status · 3 Stack · 4 Repo map · 5 Data contract ·
6 Content pipeline · 7 Curriculum inventory · 8 Routing · 9 State · 10 Challenge engine ·
11 Certificates · 12 Reference previews · 13 Video embedding · 14 Design system ·
15 Content rules & quality gate · 16 Commands · 17 Build & deploy · 18 Decisions & gotchas ·
19 Common changes · 20 Glossary

---

## 1. What this project is

**Oyelabs Trails** is an internal training platform for the Oyelabs dev team. It is deliberately
*not* a beginner bootcamp — it is built so that both a 1-year and a 10-year engineer find real depth,
and working through one track properly takes months.

It is a **100% client-side React SPA**. There is no backend, no API, no database, no auth. All
progress lives in the visitor's `localStorage`.

### The trail metaphor (used consistently in code, copy and UI)

| Domain concept | Metaphor | Code term |
| --- | --- | --- |
| Learning track | Trail | `Track` |
| Thematic group of topics | Camp / stage along the trail | `Module` |
| A single concept | Waypoint | `Topic` |
| Finishing a track | Reaching the summit | `isTrackComplete` |
| Track accent colours | Terrain names | `trailmark`, `summit`, `ridge`, `glacier`, `basalt` |

### Four tracks

| Track | `id` | Accent | Camps | Topics | Material |
| --- | --- | --- | --- | --- | --- |
| Frontend | `frontend` | `trailmark` (amber) | 14 | 149 | ~182 h |
| Backend | `backend` | `summit` (green) | 12 | 92 | ~102 h |
| Full-Stack | `fullstack` | `glacier` (blue) | 5 | 22 | ~36 h |
| AI-Driven Development | `ai-driven` | `ridge` (violet) | 6 | 30 | ~28 h |
| **Total** | | | **37** | **293** | **~347 h** |

### What every topic contains

1. An **embedded, in-app-playable YouTube video** (via `youtube.com/embed/`), deep-linked to a
   specific chapter (`startSeconds`) when the topic is one chapter of a long course.
2. **2–4 verified web references** — always the official docs/spec first, then a deep-dive article,
   plus an interview-prep repo where relevant.
3. A **senior-level summary** (120–300 words): why the thing exists, its tradeoffs, when to reach
   for it vs. an alternative, and a gotcha experienced people still hit. Not a tutorial recap.
4. A **hard graded challenge**, which is either:
   - a **quiz**: 8–12 questions (4–6 only for genuinely simple beginner topics), at least 2 marked as
     edge-case/interview questions, at least 1 multi-select. Passes at **80%**.
   - a **code challenge**: 5+ test cases, 2+ edge cases, run in a Web Worker. Passes only when
     **every** test passes.

Passing the challenge completes the topic. Completing every topic in a module fires a
"camp complete" toast. Completing every topic in a track unlocks a downloadable PDF certificate.

### Content scale (verified, not estimated)

- **293 topics**, **2,163 quiz questions**, **86 code challenges** (each with a reference solution).
- **547 videos** (including `alternateVideos`), all verified as existing and embeddable via YouTube oEmbed.
- **1,091 reference URLs** checked: 0 broken; 542 allow iframe preview, 549 block framing.
- Level distribution: **8 beginner · 84 intermediate · 161 advanced · 40 expert**.
  Topics were levelled by the real difficulty of their *challenge*, not the module's nominal range.

---

## 2. Status

The build is **complete**. All 12 phases of the original brief are done, all 37 modules are written
and committed (one commit per module), and `npm run content:check` reports **0 errors, 0 warnings**.
`npm run build` is clean. Not yet deployed to Vercel (config is ready).

Commit history shape: `v2 foundation` → `app: migrate to the v2 module structure` → 37 ×
`content: <module name>` → `verify: full-curriculum checks…` → `docs: mark v2 build complete`.

---

## 3. Stack

| Layer | Choice | Version |
| --- | --- | --- |
| Build | Vite (Rolldown-based) | ^8.3.0 |
| Framework | React | ^18.3.1 |
| Language | TypeScript (strict, `noUnusedLocals`, `noUnusedParameters`) | ~5.9.3 |
| Styling | Tailwind CSS 3 (`darkMode: "class"`) | ^3.4.19 |
| Components | shadcn/ui, "new-york" style, on Radix primitives | — |
| Animation | Framer Motion | ^13.4.0 |
| Routing | React Router (`react-router-dom`) | ^7.18.4 |
| State | Zustand + `persist` middleware → `localStorage` | ^5.0.15 |
| PDF | `@react-pdf/renderer` (lazy-loaded) | ^4.9.0 |
| Icons | `lucide-react` | ^1.47.0 |
| Fonts | `@fontsource` — Space Grotesk, IBM Plex Sans, IBM Plex Mono (self-hosted) | ^5.3.0 |

Also: `clsx` + `tailwind-merge` (the `cn()` helper), `class-variance-authority`,
`tailwindcss-animate`.

**Node 22.18+ required** (24 LTS recommended) — the content scripts import `.ts` files directly
using Node's built-in type stripping. Local dev is on Node v24.11.1.

Only nine shadcn/ui primitives are vendored in `src/components/ui/`: `badge`, `button`, `input`,
`label`, `progress`, `radio-group`, `separator`, `sheet`, `tooltip`. Everything else is bespoke.

---

## 4. Repo map

```
learning path/
├─ CLAUDE.md                     The original v2 build brief/spec (~49 KB). Source of truth for intent.
├─ README.md                     User-facing: running, authoring, deploying, "add a backend later".
├─ index.html                    Vite entry. Inline script applies saved theme before first paint.
├─ package.json                  Scripts + deps. predev/prebuild regenerate the content manifest.
├─ vite.config.ts                "@" alias to src; manual vendor chunks (react/motion/ui/curriculum-index).
├─ tailwind.config.ts            Design tokens as CSS vars, type scale, accent colour families.
├─ tsconfig.json / .app.json / .node.json / .content.json
├─ vercel.json                   Vite framework, SPA rewrite, immutable caching for /assets/*.
├─ components.json               shadcn/ui config (new-york, cssVariables, lucide).
├─ frontend.pdf, full-stack.pdf  Original source material the brief was derived from. Not built.
│
├─ src/
│  ├─ main.tsx                   Root render; imports the self-hosted font CSS + index.css.
│  ├─ App.tsx                    BrowserRouter + MotionConfig(reducedMotion:"user") + TooltipProvider + AppShell.
│  ├─ index.css                  ALL design tokens (light + dark), base styles, focus rings, reduced motion.
│  │
│  ├─ types/curriculum.ts        THE core data contract (see §5). Track > Module > Topic.
│  │
│  ├─ content/                   The curriculum (~59k lines).
│  │  ├─ registry.ts             Ordered list of tracks + their modules (id, name, idPrefix). Hand-written.
│  │  ├─ <trackId>/<moduleId>.ts 37 module files, each `export default {...} satisfies Module`.
│  │  ├─ manifest-types.ts       TrackMeta / ModuleMeta / TopicMeta — the lightweight metadata shapes.
│  │  ├─ manifest.generated.ts   GENERATED table of contents, always loaded (4,116 lines).
│  │  ├─ embeds.generated.ts     GENERATED url → 0|1 iframe-embeddability verdicts.
│  │  └─ index.ts                Lookups, path builders, neighbours, and lazy module loading.
│  │
│  ├─ store/
│  │  ├─ progressStore.ts        Per-topic progress. Persisted as `oyelabs-progress`.
│  │  ├─ uiStore.ts              theme + sidebarCollapsed. Persisted as `oyelabs-ui`.
│  │  ├─ profileStore.ts         learnerName for certificates. Persisted as `oyelabs-profile`.
│  │  └─ toastStore.ts           Ephemeral camp/summit completion toasts (not persisted).
│  │
│  ├─ hooks/
│  │  ├─ useModuleContent.ts     Loads + caches one module's full content (code-split).
│  │  ├─ useTrackProgress.ts     summarizeTrack/summarizeModule + useTrackProgress/useModuleProgress/useTopicProgress.
│  │  ├─ useDocumentTitle.ts     "<title> | Oyelabs Trails".
│  │  └─ useElementWidth.ts      ResizeObserver width, for the responsive SVG trail map.
│  │
│  ├─ lib/
│  │  ├─ utils.ts                cn(), formatMinutes(), formatMinutesCompact(), formatDate(), preferredScrollBehavior().
│  │  ├─ accent.ts               accentClasses: literal Tailwind class names per accent (Tailwind needs full names).
│  │  ├─ codeRunner.ts           The Web Worker sandbox for code challenges (see §10).
│  │  ├─ certificate.ts          Deterministic certificate IDs, accent hexes, CertificateData assembly.
│  │  ├─ shuffle.ts              FNV-1a hash + mulberry32 PRNG + seededOrder() for quiz option shuffling.
│  │  ├─ track-meta.ts           Track icons, 2-letter codes, level labels/ordering/elevation.
│  │  ├─ geometry.ts             smoothPath(): Catmull-Rom to cubic Bézier, for the trail SVG.
│  │  └─ contours.ts             contourPaths(): deterministic topographic decoration rings.
│  │
│  ├─ pages/
│  │  ├─ DashboardPage.tsx       "/" — aggregate stats, resume link, per-track sections + elevation profiles.
│  │  ├─ TrackPage.tsx           "/track/:trackId" — the trail of camps (modules).
│  │  ├─ ModulePage.tsx          "/track/:trackId/module/:moduleId" — the waypoint trail of topics.
│  │  ├─ TopicPage.tsx           ".../topic/:topicId" — video, summary, references, challenge, prev/next.
│  │  │                          Also exports LegacyTopicRedirect for old v1 URLs.
│  │  ├─ CertificatePage.tsx     "/report/:trackId" — locked state or certificate + PDF download.
│  │  └─ NotFoundPage.tsx        Catch-all.
│  │
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ AppShell.tsx         Skip link, TopBar, Sidebar, <main>, CompletionWatcher, Toaster, AnimatedRoutes.
│  │  │  ├─ Sidebar.tsx          Desktop nav wrapper (collapsible).
│  │  │  ├─ TrackNav.tsx         Track + module tree with progress, shared by sidebar and mobile nav.
│  │  │  ├─ MobileNav.tsx        Sheet-based nav under the md breakpoint.
│  │  │  ├─ TopBar.tsx           Brand, search trigger, theme toggle, mobile nav trigger.
│  │  │  ├─ SearchDialog.tsx     Cmd/Ctrl-K topic palette over the manifest (all-words match, prefix ranking).
│  │  │  ├─ Breadcrumbs.tsx      Dashboard > Track > Camp > Topic.
│  │  │  ├─ CompletionWatcher.tsx Subscribes to the progress store; fires camp/summit toasts on transitions.
│  │  │  ├─ Toaster.tsx          Renders toastStore entries.
│  │  │  ├─ ThemeToggle.tsx      Light/dark switch.
│  │  │  └─ BrandMark.tsx        Logo mark.
│  │  ├─ trail/
│  │  │  ├─ TrailMap.tsx         The winding SVG switchback path with waypoints/endpoints. Draws itself in.
│  │  │  ├─ ElevationProfile.tsx Track difficulty as terrain; each camp is a point, height from avg level.
│  │  │  ├─ Contours.tsx         Decorative topographic rings behind hero areas.
│  │  │  ├─ VideoPlayer.tsx      YouTube iframe embed + alternate-video selector.
│  │  │  ├─ ReferenceList.tsx    Reference cards with inline iframe preview or link-card fallback (§12).
│  │  │  ├─ ResourceKindTag.tsx  Icon-coded docs/article/interview-prep/spec/repo tag.
│  │  │  ├─ StatusDot.tsx        Inline version of the waypoint marker.
│  │  │  └─ TopicStatusBadge.tsx Not started / In progress / Completed badge.
│  │  ├─ challenge/
│  │  │  ├─ ChallengeRunner.tsx  Dispatches to QuizRunner or CodeRunner by challengeType.
│  │  │  ├─ QuizRunner.tsx       Grading, shuffling, multi-select, post-submit explanations.
│  │  │  ├─ CodeRunner.tsx       Editor + run + results; drafts in localStorage.
│  │  │  ├─ CodeEditor.tsx       Styled <textarea> with a line-number gutter; Tab indents, Esc then Tab exits.
│  │  │  └─ ChallengeResult.tsx  Shared pass/fail panel.
│  │  ├─ certificate/
│  │  │  ├─ CertificateView.tsx  On-screen certificate on a fixed 1000x707 canvas, scaled to fit.
│  │  │  ├─ generateCertificatePdf.tsx  @react-pdf/renderer document (lazy-loaded on download).
│  │  │  └─ Seal.tsx             Shared 132x132 summit-seal geometry for screen + PDF.
│  │  ├─ content/RichText.tsx    The curriculum's small Markdown subset + a tiny JS syntax highlighter.
│  │  └─ ui/                     9 vendored shadcn/ui primitives.
│  │
│  └─ assets/fonts/              Self-hosted TTFs for the PDF renderer (+ licences).
│
├─ content-tests/solutions/      86 reference solutions, one per code challenge: <topicId>.js
│
├─ scripts/
│  ├─ content/
│  │  ├─ load.mjs                Shared loader: reads registry.ts + every module .ts via type stripping.
│  │  ├─ check.mjs               THE QUALITY GATE (see §15). Runs reference solutions in worker_threads.
│  │  ├─ build-manifest.mjs      Generates manifest.generated.ts. Auto-runs on predev/prebuild.
│  │  ├─ check-embeds.mjs        Probes every reference URL's framing headers, writes embeds.generated.ts.
│  │  └─ check-videos.mjs        Re-verifies every video exists + is embeddable, via oEmbed.
│  └─ research/
│     ├─ yt.mjs                  "search" / "info --chapters". Reads youtube.com itself, never aggregators.
│     └─ check-urls.mjs          Status + final-URL checker for reference links.
│
└─ docs/
   ├─ CONTENT_GUIDE.md           The authoring bar + two fully worked exemplars. Read before writing content.
   ├─ PROGRESS.md                Module checklist + decisions log.
   ├─ EMBEDDING.md               Per-site iframe verdicts and the blocking header for each.
   └─ research-notes/<moduleId>.md   37 files: videos chosen, why, fallbacks, version-sensitive facts verified.
```

---

## 5. The core data contract

`src/types/curriculum.ts` — every content file conforms to this, verbatim:

```ts
export type ChallengeType = "code" | "quiz";
export type TopicLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type TrackId = "frontend" | "backend" | "fullstack" | "ai-driven";

/**
 * `glacier` extends the brief's tokens: the brief assigns `ridge` to both Full-Stack and
 * AI-Driven while also reserving it for AI-Driven only, so Full-Stack gets its own accent.
 */
export type AccentToken = "trailmark" | "summit" | "ridge" | "glacier" | "basalt";
export type ResourceKind = "docs" | "article" | "interview-prep" | "spec" | "repo";

export interface TopicResource {
  label: string;              // "MDN: Closures", "javascript.info: Closure"
  url: string;
  kind: ResourceKind;
}

export interface VideoResource {
  title: string;              // exact YouTube title
  channel: string;
  url: string;                // https://www.youtube.com/watch?v=<id> — no extra params
  videoId: string;            // "" only for flagged search-URL fallbacks
  startSeconds?: number;      // chapter deep-link
  chapterLabel?: string;      // shown when startSeconds is set
  durationLabel?: string;     // "19:11" or "7:44:20", display only
}

export interface QuizQuestion {
  id: string;                 // `${topicId}-q1`, -q2, ...
  prompt: string;             // Markdown subset: inline code, fenced blocks, "- " bullets
  options: string[];          // 3-6, shuffled at runtime -> never refer to positions
  correctIndex: number;       // for multi-select this mirrors correctIndices[0]
  correctIndices?: number[];  // present only for multi-select (2+ correct)
  explanation: string;
  isEdgeCaseOrInterviewQuestion?: boolean;
}

export interface CodeTestCase {
  args: unknown[];            // must be plain, structured-cloneable data
  expected: unknown;
  description: string;
  isEdgeCase?: boolean;
}

export interface CodeChallenge {
  instructions: string;
  starterCode: string;        // must declare `functionName`
  functionName: string;       // what the tests call
  testCases: CodeTestCase[];
}

export interface Topic {
  id: string;                 // kebab-case, globally unique, permanent (URL slug + progress key)
  moduleId: string;
  trackId: TrackId;
  title: string;
  summary: string;            // senior-level; paragraphs split by blank lines
  level: TopicLevel;
  estMinutes: number;
  isMilestone?: boolean;
  webRefs: TopicResource[];   // 2-4; first is normally docs/spec
  video: VideoResource;
  alternateVideos?: VideoResource[];
  challengeType: ChallengeType;
  quiz?: QuizQuestion[];
  codeChallenge?: CodeChallenge;
}

export interface Module {
  id: string;
  trackId: TrackId;
  name: string;
  description: string;
  refs?: TopicResource[];     // module-level reading list
  topics: Topic[];
}

export interface Track {
  id: TrackId;
  name: string;
  tagline: string;
  accentToken: AccentToken;
  modules: Module[];
}
```

### The lightweight mirror (`src/content/manifest-types.ts`)

Navigation and progress never need summaries, quizzes or references, so a generated manifest holds
only this, and it is always in the bundle:

```ts
export interface TopicMeta {
  id; moduleId; trackId; title; level; estMinutes; isMilestone?; challengeType;
  challengeSize: number;   // quiz question count OR code test count
}
export interface ModuleMeta {
  id; trackId; name; description; refs?; topics: TopicMeta[];
  available: boolean;      // false when a registry module has no file yet
}
export interface TrackMeta { id; name; tagline; accentToken; modules: ModuleMeta[]; }
```

---

## 6. The content pipeline

```
src/content/registry.ts          hand-written: track order, module order, topic-id prefixes
        |
        +--> src/content/<trackId>/<moduleId>.ts     37 hand-written module files
        |            |
        |            +--> scripts/content/build-manifest.mjs  --> manifest.generated.ts (always loaded)
        |            +--> scripts/content/check.mjs           --> pass/fail quality gate
        |            +--> scripts/content/check-embeds.mjs    --> embeds.generated.ts
        |            +--> scripts/content/check-videos.mjs    --> oEmbed re-verification
        |
        +--> src/content/index.ts   lookups over the manifest + import.meta.glob lazy loaders
```

**Key design decision: two-tier loading.** `manifest.generated.ts` (~4,100 lines) ships in a
dedicated `curriculum-index` vendor chunk and powers the dashboard, sidebar, trail maps, search and
all progress maths. A module's *full* content — summaries, 2,163 quiz questions, references, videos —
is code-split per module via `import.meta.glob` and only downloads when someone opens one of its
topics. `loadModule()` caches by `${trackId}/${moduleId}` and de-duplicates in-flight requests.

**`src/content/index.ts` public surface:**

| Export | Purpose |
| --- | --- |
| `tracks` | The manifest, as `TrackMeta[]` |
| `getTrack(id)` / `getModule(trackId, moduleId)` / `findTopic(topicId)` | Lookups (topic lookup is a prebuilt `Map`) |
| `trackTopics(track)` / `allTopics()` | Flattened topic lists in trail order |
| `topicPath(topic)` / `modulePath(module)` | URL builders |
| `topicNeighbors(topicId)` | prev/next **across module boundaries** within a track |
| `moduleNeighbors(trackId, moduleId)` | prev/next among *available* modules |
| `trackMinutes` / `moduleMinutes` | Sum of `estMinutes` |
| `getCachedModule` / `loadModule` | Lazy content access |

**Registry note:** `registry.ts` also carries an `idPrefix` per module (e.g. `js-`, `react-adv-`,
`fscap-`) that authors follow for topic ids. Two modules intentionally share a prefix
(`fe-js-core` and `fe-js-advanced` both use `js-`); ids are still globally unique.

---

## 7. Curriculum inventory

Format: `module-id | name | topics | quiz/code split | milestones | material`

### Frontend (`trailmark`, 14 camps, 149 topics)
```
fe-tooling             Dev Environment & Tooling               6   5q/1code   3 milestones  ~10h
fe-html-css            HTML & CSS Foundations                 13  11q/2code   3             ~15h
fe-js-core             JavaScript Core (Namaste JS S1)        19  15q/4code   2             ~15h
fe-js-advanced         JavaScript Advanced & Interview-Level  21  11q/10code  3             ~21h
fe-typescript          TypeScript                             16  13q/3code   3             ~20h
fe-tailwind            Tailwind CSS                            7   6q/1code   2              ~7h
fe-react-fundamentals  React Fundamentals                      9   6q/3code   2              ~9h
fe-react-hooks         React Hooks & Advanced Patterns        16  11q/5code   3             ~17h
fe-react-ecosystem     React Ecosystem                         9   6q/3code   3             ~12h
fe-react-projects      React Practice Projects                 3   0q/3code   3             ~21h
fe-nextjs              Next.js                                11   8q/3code   3             ~11h
fe-vue                 Vue.js                                 11   7q/4code   3             ~13h
fe-meta-mobile         Meta-Frameworks, Mobile & Bonus         3   2q/1code   1              ~5h
fe-security-perf       Frontend Security & Performance         5   4q/1code   2              ~5h
```

### Backend (`summit`, 12 camps, 92 topics)
```
be-foundations         Web & Backend Foundations               4   4q/0code   1              ~5h
be-node-core           Node.js Core                           10   7q/3code   2             ~11h
be-express             Express.js                              9   5q/4code   1             ~12h
be-sql                 SQL & Relational Databases             10   7q/3code   3             ~10h
be-nosql               NoSQL & Caching                         6   4q/2code   1              ~6h
be-auth-security       Authentication & Security               8   5q/3code   2              ~8h
be-api-design          API Design                              8   5q/3code   2              ~8h
be-nestjs              NestJS                                  9   6q/3code   3              ~9h
be-python              Python Backend                          8   6q/2code   3              ~9h
be-docker              Docker & Containers                     8   6q/2code   1              ~9h
be-system-design       System Design Fundamentals              8   5q/3code   2             ~10h
be-testing-ops         Backend Testing & Ops                   4   4q/0code   1              ~5h
```

### Full-Stack (`glacier`, 5 camps, 22 topics)
```
fs-mern                MERN End-to-End                         5   3q/2code   1              ~7h
fs-nextjs              Next.js Full-Stack                      5   4q/1code   1              ~5h
fs-t3                  The T3 Stack & End-to-End Type Safety   4   3q/1code   2              ~5h
fs-graphql             GraphQL Full-Stack                      3   2q/1code   0              ~3h
fs-capstone            Full-Stack Capstone & Deployment        5   2q/3code   1             ~16h
```

### AI-Driven Development (`ridge`, 6 camps, 30 topics)
```
ai-tools               The AI Coding Tools Landscape           5   5q/0code   1              ~4h
ai-prompting           Prompt Engineering                      5   5q/0code   1              ~3h
ai-context             Context Engineering & AI Pair Prog.     5   5q/0code   2              ~4h
ai-llm                 LLM Fundamentals                        5   3q/2code   2              ~5h
ai-rag                 Retrieval-Augmented Generation          5   2q/3code   1              ~6h
ai-agents              AI Agents                               5   4q/1code   1              ~6h
```

### Full topic-id inventory

Legend: `[B]` beginner · `[I]` intermediate · `[A]` advanced · `[X]` expert · `*` milestone

#### Frontend

**`fe-tooling` — Dev Environment & Tooling** (6)  
tooling-vscode-productivity[I] · tooling-git-fundamentals[A*] · tooling-github-collaboration[A] · tooling-npm-packages[A*] · tooling-vite[A] · tooling-devtools[A*]

**`fe-html-css` — HTML & CSS Foundations** (13)  
html-semantic-structure[I] · html-forms-validation[I] · html-accessibility-fundamentals[A*] · html-tables-media[I] · css-box-model[I] · css-selectors-specificity[A*] · css-flexbox[I] · css-grid[A*] · css-responsive-media-queries[A] · css-custom-properties[A] · css-transitions-animations[I] · css-architecture-bem-utility[A] · css-bootstrap-sass[I]

**`fe-js-core` — JavaScript Core** (19)  
js-execution-context[B] · js-call-stack[I] · js-hoisting[I] · js-functions-variable-env[I] · js-window-this[B] · js-undefined-vs-not-defined[B] · js-scope-chain[I] · js-let-const-tdz[I] · js-block-scope-shadowing[I] · js-closures[A*] · js-settimeout-closures-interview[I] · js-closures-crazy-interview[A] · js-first-class-functions[I] · js-callbacks-event-listeners[I] · js-event-loop[X*] · js-engine-v8[X] · js-settimeout-trust-issues[A] · js-higher-order-functions[I] · js-array-methods-map-filter-reduce[A]

**`fe-js-advanced` — JavaScript Advanced & Interview-Level** (21)  
js-promises[A] · js-promise-combinators[A] · js-async-await[X*] · js-generators-iterators[A] · js-currying[A] · js-debounce-throttle[A] · js-prototypes[A] · js-this-call-apply-bind[A] · js-classes-oop[A] · js-modules-cjs-esm[X] · js-fetch-ajax[A] · js-json[A] · js-event-delegation[A] · js-web-storage[I] · js-error-handling[A] · js-weakmap-weakset[A] · js-symbols[A] · js-regex[A] · js-design-patterns[A] · js-lru-cache[A*] · js-promise-all-from-scratch[X*]

**`fe-typescript` — TypeScript** (16)  
ts-basic-types[B] · ts-interfaces-vs-type-aliases[I] · ts-functions-inference[I] · ts-union-intersection[I] · ts-narrowing-type-guards[A*] · ts-generics-fundamentals[I] · ts-generic-constraints-defaults[A] · ts-utility-types[A] · ts-enums-literal-types[I] · ts-classes-access-modifiers[I] · ts-modules-namespaces[A] · ts-conditional-types[X*] · ts-mapped-types[A] · ts-template-literal-types[A] · ts-tsconfig-strictness[A] · ts-react-components-hooks[A*]

**`fe-tailwind` — Tailwind CSS** (7)  
tw-utility-first[I] · tw-responsive-variants[I] · tw-state-variants[A] · tw-dark-mode[I] · tw-theme-customization[A*] · tw-apply-vs-components[A*] · tw-plugins[A]

**`fe-react-fundamentals` — React Fundamentals** (9)  
react-jsx-rendering[I] · react-components-props[I] · react-usestate[A*] · react-event-handling[I] · react-conditional-rendering[I] · react-lists-keys[A*] · react-controlled-forms[A] · react-lifting-state-up[A] · react-composition[I]

**`fe-react-hooks` — React Hooks & Advanced Patterns** (16)  
react-adv-use-effect[A*] · react-adv-use-context[A] · react-adv-use-reducer[I] · react-adv-use-ref[I] · react-adv-memo-callback[A] · react-adv-custom-hooks[A] · react-adv-react-memo[A] · react-adv-error-boundaries[A] · react-adv-portals[I] · react-adv-ref-forwarding[I] · react-adv-compound-components[A] · react-adv-render-props-hocs[A] · react-adv-lazy-suspense[A] · react-adv-concurrent[X*] · react-adv-server-components[X] · react-adv-reconciliation[X*]

**`fe-react-ecosystem` — React Ecosystem** (9)  
react-eco-router-fundamentals[I] · react-eco-protected-routes[A] · react-eco-data-loaders-actions[A*] · react-eco-redux-toolkit[A*] · react-eco-zustand[I] · react-eco-tanstack-query[A*] · react-eco-forms[I] · react-eco-testing-rtl[A] · react-eco-e2e-testing[A]

**`fe-react-projects` — React Practice Projects** (3)  
react-capstone-ecommerce[A*] · react-capstone-quiz-app-ts[A*] · react-capstone-todoist-clone[A*]

**`fe-nextjs` — Next.js** (11)  
next-app-router-routing[I] · next-server-client-components[A] · next-data-fetching-caching[X*] · next-server-actions[A*] · next-route-handlers[I] · next-proxy-middleware[A] · next-rendering-strategies[A] · next-metadata-seo[I] · next-image-font-optimization[I] · next-authentication[A*] · next-deploy-vercel[A]

**`fe-vue` — Vue.js** (11)  
vue-reactivity-fundamentals[A*] · vue-template-directives[I] · vue-computed-watchers[A] · vue-lifecycle-hooks[A] · vue-props-emits[I] · vue-slots[I] · vue-provide-inject[I] · vue-composables[A] · vue-router[A*] · vue-pinia[A*] · vue-typescript[A]

**`fe-meta-mobile` — Meta-Frameworks, Mobile & Bonus** (3)  
bonus-astro-islands[A] · bonus-react-native[A] · bonus-pwa[A*]

**`fe-security-perf` — Frontend Security & Performance** (5)  
feperf-xss-csrf-csp[A*] · feperf-core-web-vitals[A*] · feperf-code-splitting[A] · feperf-lazy-loading[I] · feperf-a11y-auditing[A]

#### Backend

**`be-foundations` — Web & Backend Foundations** (4)  
web-how-internet-works[B] · web-http-methods-status-headers[A*] · web-client-server[B] · web-rest-rpc-graphql[I]

**`be-node-core` — Node.js Core** (10)  
node-runtime-libuv[A] · node-modules-cjs-esm[A] · node-fs-path-os[I] · node-npm-semver[I] · node-event-loop[X*] · node-event-emitter[A] · node-streams-buffers[A*] · node-http-server[I] · node-child-worker[A] · node-debugging-inspect[I]

**`be-express` — Express.js** (9)  
express-routing-fundamentals[A] · express-middleware-pipeline[A] · express-app-use-ordering[I] · express-params-query[I] · express-http-methods[I] · express-error-handling[A] · express-static-templating[I] · express-file-uploads-multer[A] · express-crud-rest-api[X*]

**`be-sql` — SQL & Relational Databases** (10)  
sql-normalization[I] · sql-select-filtering[I] · sql-joins[A] · sql-aggregation-group-by[I] · sql-subqueries-ctes[A] · sql-indexes-explain[X*] · sql-transactions-isolation[X*] · sql-postgres-features[A] · sql-orms[A] · sql-n-plus-one[A*]

**`be-nosql` — NoSQL & Caching** (6)  
nosql-document-modeling[A] · nosql-mongoose-schemas[I] · nosql-aggregation-pipeline[A] · nosql-sql-vs-nosql[A] · nosql-redis-caching[I] · nosql-cache-invalidation[X*]

**`be-auth-security` — Authentication & Security** (8)  
auth-password-hashing[A] · auth-sessions-vs-jwt[A] · auth-oauth2-oidc[X*] · auth-refresh-token-rotation[A] · auth-rbac-abac[A] · auth-cors[A] · auth-rate-limiting[A] · auth-owasp-api-top10[X*]

**`be-api-design` — API Design** (8)  
api-rest-resource-design[I] · api-pagination-filtering-sorting[A] · api-idempotency-safe-methods[A] · api-graphql-schema-queries-mutations[I] · api-graphql-resolvers-dataloader[X*] · api-openapi-swagger[I] · api-webhooks-event-driven[A] · api-rest-vs-graphql[A*]

**`be-nestjs` — NestJS** (9)  
nest-modules-di[A] · nest-controllers-routing[I] · nest-providers-injectable[A*] · nest-dto-validation-pipes[I] · nest-guards[A] · nest-interceptors[A] · nest-exception-filters[A*] · nest-typeorm-prisma[A] · nest-microservices[X*]

**`be-python` — Python Backend** (8)  
py-essentials[I] · py-fastapi-pydantic[I] · py-fastapi-di-async[A] · py-django-orm[A*] · py-django-views-templates[I] · py-drf[I] · py-celery-redis[A*] · py-fastapi-vs-django[A*]

**`be-docker` — Docker & Containers** (8)  
docker-why-containers[I] · docker-images-containers[I] · docker-dockerfiles[A] · docker-multi-stage-builds[A] · docker-compose[I] · docker-volumes-networking[A] · docker-ci-cd[A] · docker-kubernetes-intro[A*]

**`be-system-design` — System Design Fundamentals** (8)  
sd-scaling[A] · sd-load-balancing[A] · sd-caching[X] · sd-replication-sharding[X] · sd-message-queues[X] · sd-cdn-edge[A] · sd-rate-limiter[X*] · sd-url-shortener[X*]

**`be-testing-ops` — Backend Testing & Ops** (4)  
ops-unit-testing[I] · ops-integration-testing[A] · ops-ci-cd-github-actions[A*] · ops-logging-monitoring[A]

#### Full-Stack

**`fs-mern` — MERN End-to-End** (5)  
mern-architecture[A] · mern-react-express[A] · mern-mongoose[A] · mern-jwt-auth[X] · mern-deploy[X*]

**`fs-nextjs` — Next.js Full-Stack** (5)  
fsnext-server-actions[A] · fsnext-route-handlers[A] · fsnext-prisma[A] · fsnext-auth[X] · fsnext-vercel-deploy[X*]

**`fs-t3` — The T3 Stack & End-to-End Type Safety** (4)  
t3-trpc-fundamentals[A*] · t3-prisma-schema-migrations[A] · t3-end-to-end-type-safety[X*] · t3-when-to-use[A]

**`fs-graphql` — GraphQL Full-Stack** (3)  
fsgql-schema-first[A] · fsgql-apollo[X] · fsgql-vs-rest[X]

**`fs-capstone` — Full-Stack Capstone & Deployment** (5)  
fscap-env-secrets[A] · fscap-cicd[X] · fscap-monitoring[X] · fscap-scaling[X] · fscap-capstone[X*]

#### AI-Driven Development

**`ai-tools` — The AI Coding Tools Landscape** (5)  
aitools-accelerator-vs-delegator[I] · aitools-copilot-fundamentals[B] · aitools-cursor-workflow[I] · aitools-claude-code-workflow[A*] · aitools-app-builders[I]

**`ai-prompting` — Prompt Engineering** (5)  
prompt-zero-few-shot[B] · prompt-chain-of-thought[A] · prompt-role-persona[I] · prompt-scoped-coding[I] · prompt-debugging-bad-prompt[A*]

**`ai-context` — Context Engineering & AI Pair Programming** (5)  
ctx-context-files[I] · ctx-resetting-context[A] · ctx-reviewing-ai-code[A*] · ctx-reusable-skills[I] · ctx-anti-patterns[X*]

**`ai-llm` — LLM Fundamentals** (5)  
llm-tokens-context-windows[X*] · llm-structured-output-tool-calling[A] · llm-sampling-parameters[A] · llm-model-families[I] · llm-calling-api-directly[A*]

**`ai-rag` — Retrieval-Augmented Generation** (5)  
rag-embeddings-similarity[A] · rag-vector-databases[A] · rag-chunking-strategies[A] · rag-retrieval-reranking[A] · rag-full-pipeline[X*]

**`ai-agents` — AI Agents** (5)  
agents-tool-calling-fundamentals[A] · agents-react-pattern[A] · agents-multi-agent-orchestration[X] · agents-mcp[A] · agents-eval-sandboxing[X*]

---

## 8. Routing and pages

Routes are declared in `src/components/layout/AppShell.tsx`:

| Route | Page | Notes |
| --- | --- | --- |
| `/` | `DashboardPage` | Aggregate stats, "resume where you left off", a section per track with its elevation profile |
| `/track/:trackId` | `TrackPage` | The trail of **camps** — one node per module with its own completion %, topic count, level range |
| `/track/:trackId/module/:moduleId` | `ModulePage` | The winding **waypoint path** of that camp's topics (5–21 of them, so it stays usable) |
| `/track/:trackId/module/:moduleId/topic/:topicId` | `TopicPage` | Video, summary, references, challenge, prev/next |
| `/track/:trackId/topic/:topicId` | `LegacyTopicRedirect` | v1 URLs → 301-style client redirect to the module-scoped path |
| `/report/:trackId` | `CertificatePage` | Locked until the track is complete; then certificate + PDF |
| `*` | `NotFoundPage` | |

**Why the extra level exists:** the original design had one flat winding trail per track. With 293
topics, 149 of them in Frontend alone, a single path would be unusable — so the track page renders
modules as camps, and each camp opens into the original per-topic trail visual.

**Shell structure** (`AppShell`): skip link → `TopBar` → (`Sidebar` | `<main id="main" tabIndex={-1}>`)
→ `CompletionWatcher` (renders nothing) → `Toaster`.

**Page transition:** exactly one motion moment — `AnimatePresence mode="wait"` keyed on
`location.pathname`, a ~150 ms cross-fade, `duration: 0` under reduced motion, and
`onExitComplete` scrolls to top.

**TopicPage specifics:**
- `findTopic(topicId)` resolves the topic from the manifest. If `trackId`/`moduleId` in the URL
  don't match the topic's real ones, it `<Navigate replace>`s to the canonical path.
- `<TopicScreen key={topic.id}>` — keyed so switching topics fully remounts (fresh challenge state).
- `markInProgress(topic.id)` fires on mount.
- Full content arrives via `useModuleContent`, with loading / error / ready states rendered inline.
- Header shows "Waypoint N of M in <camp>", the topic id in mono, level, est. minutes, milestone
  badge and status badge.
- Footer nav is boundary-aware: it says "Next camp begins with …" when the next topic is in a
  different module, and falls back to the trail map / certificate at the ends.

---

## 9. State (Zustand, persisted to localStorage)

| Store | localStorage key | Shape |
| --- | --- | --- |
| `progressStore` | `oyelabs-progress` (version 1) | `{ [topicId]: { status, bestScore?, completedAt?, attempts } }` |
| `uiStore` | `oyelabs-ui` | `{ theme, sidebarCollapsed }` |
| `profileStore` | `oyelabs-profile` | `{ learnerName }` |
| `toastStore` | *(not persisted)* | `{ toasts: Toast[] }` |
| *(CodeRunner)* | `oyelabs-draft:<topicId>` | raw editor text, written directly (not Zustand) |

### `progressStore` semantics

```ts
type TopicStatus = "not-started" | "in-progress" | "completed";
export const QUIZ_PASS_THRESHOLD = 80;   // quizzes; code challenges require 100%
```

- `markInProgress(topicId)` — no-op if the topic is already in-progress or completed.
- `recordAttempt(topicId, passed, score?)` — increments `attempts`, keeps the **max** `bestScore`,
  and **once completed, a later failed retry never un-completes the topic**. `completedAt` is set
  once and preserved.
- `resetTopic` / `resetAll`.
- `getTrackCompletionPct(topicIds)` and `getModuleCompletionPct(moduleId, topicIds)` both delegate to
  the same `completionPct` helper — `moduleId` is in the signature because the brief specified it and
  it keeps call sites self-describing.
- `isTrackComplete(topicIds)` — every topic completed, and the list is non-empty.

### Derived progress (`hooks/useTrackProgress.ts`)

`summarize()` produces `{ completed, total, pct, isComplete, nextTopic, started, completedAt }`.
`nextTopic` is the first topic in trail order that isn't complete — that's what powers "continue".
Exposed as `summarizeTrack` / `summarizeModule` (pure) and `useTrackProgress` / `useModuleProgress` /
`useTopicProgress` (hooks, memoised on the progress object).

### Completion toasts (`CompletionWatcher`)

Subscribes directly to the store outside React render. On mount it snapshots which modules/tracks are
*already* complete, so **loading saved progress never fires toasts**. On each change it diffs and
pushes at most one toast per newly-completed camp or track. A track toast suppresses its module
toasts for that track in the same tick. Camp toasts name the next camp and link to it; summit toasts
link to the certificate. `toastStore.push` keeps a max of 3 toasts.

---

## 10. The challenge engine

`ChallengeRunner` dispatches on `topic.challengeType`.

### Quizzes (`QuizRunner.tsx`)

- **Single-select** grading: `answer === correctIndex`.
- **Multi-select** grading (`correctIndices`, 2+ entries): **all-or-nothing** — the chosen set must
  equal the correct set exactly. Rendered as checkboxes; single-select uses a Radix `RadioGroup`.
- **Option shuffling:** `seededOrder(q.options.length, `${q.id}:${round}`)` — deterministic per
  question per attempt, reshuffled on every retry so answers can't be memorised by position. This is
  why content must never say "options A and C".
- Submit is blocked until every question is answered. On submit: score = correct/total × 100, pass at
  **80%**, `recordAttempt` is called, and the result panel is scrolled to and focused.
- Explanations render only after submit, with correct/chosen/missed states marked by icon.
- Retry clears answers, bumps `round` (reshuffle), scrolls back and focuses the first control.

### Code challenges (`CodeRunner.tsx` + `lib/codeRunner.ts`)

- Editor is a styled `<textarea>` (`CodeEditor`) with a line-number gutter, dark in both themes.
  Tab indents; Esc then Tab escapes the editor for keyboard users.
- Drafts autosave to `localStorage` under `oyelabs-draft:<topicId>`, and are cleared when the code
  equals the starter code again. All storage access is try/caught.
- **Execution sandbox:** a throwaway `Worker` created from a `Blob` URL containing a
  plain-JavaScript source string. The worker:
  1. builds the function via `new Function(code + "; return typeof fn === 'function' ? fn : undefined")`
  2. reports a `compile-error` if that throws or the named function is missing
  3. `await`s `fn(...args)` for each test case (so async solutions work), posting a result per test
  4. compares with a custom `deepEqual` — key-order-insensitive, `NaN === NaN`, `Date` aware,
     array/object distinction enforced
  5. formats values with a JSON replacer that preserves `undefined`, functions and `Infinity`/`NaN`
- **3-second global timeout** (`RUN_TIMEOUT_MS`). On timeout the worker is terminated, the blob URL
  revoked, and un-run tests are reported as "Timed out … look for an infinite loop."
- Passing requires **every** test to pass; `score` (passed/total × 100) is still recorded.
- `functionName` is validated against `/^[A-Za-z_$][\w$]*$/` before building the worker.

> **Security note, stated in code and README:** this sandbox is right for an internal tool used by a
> trusted team. A worker has no DOM, cookies or `localStorage` access and is killed on timeout, but
> code inside it can still make network requests and burn CPU. Running untrusted public code would
> need a real isolation boundary (sandboxed cross-origin iframe with strict CSP, or server-side
> containers).

### Code-challenge authoring patterns

- `args`/`expected` must be **plain structured-cloneable data** — no functions, Dates, Maps or class
  instances crossing the worker boundary.
- Challenges needing callbacks, timers or classes ship a **driver function** in the starter code
  (marked `// ---- Test driver (leave as is) ----`), and `functionName` names the *driver*. The
  driver builds the scenario, calls the learner's function, and returns plain data.
- **No real time:** debounce/throttle/retry/rate-limiter challenges inject a deterministic fake clock
  (`createFakeClock()` with `setTimeout`/`clearTimeout`/`at`/`runUntil`) via the driver.
- No `Math.random`, `Date.now` or network — every run is deterministic.

---

## 11. Certificates

Unlock when `isTrackComplete` for the track. Until then the page shows a locked state listing what's
left, per camp.

- Learner types their name once; it persists in `profileStore` (`oyelabs-profile`).
- **Deterministic certificate ID:** `OYL-<FE|BE|FS|AI>-XXXX-XXXX`, built from
  `trackId | normalizedLowercaseName | completedAt` hashed with FNV-1a and Crockford-base32 encoded
  (two 4-char groups from two different salts). Same inputs always produce the same ID.
- `CertificateData` carries name, track, accent hex, topic count, camp count, milestone count, total
  minutes, average best score across the track, completion timestamp and the ID.
- **On screen:** `CertificateView` lays out on a fixed 1000×707 canvas and scales to fit, so the
  composition matches the PDF at any width. It stays paper-coloured in dark mode, like a printed
  document. The seal (`Seal.tsx`, a 132×132 summit mark) is filled with the track's accent.
- **PDF:** `@react-pdf/renderer`, **lazy-imported only when Download is clicked** (it's a ~1.2 MB
  chunk — the reason `chunkSizeWarningLimit` is raised to 1300 in `vite.config.ts`). Fonts are the
  self-hosted TTFs in `src/assets/fonts/`.
- The page states honestly that there is **no server-side verification** — nothing records the ID.

---

## 12. Reference previews (iframe-or-fallback)

The brief asked for in-app previews of each reference. The real constraint:

**Many documentation sites forbid being framed** via `X-Frame-Options` or CSP `frame-ancestors`
(MDN, GitHub, javascript.info, roadmap.sh, Next.js, PostgreSQL, web.dev, TanStack, Prisma, Supabase,
Docker, Django, OWASP, learn.microsoft.com, …). Critically, **browsers still fire the iframe's `load`
event for blocked frames**, so a runtime load/timeout check cannot detect blocking.

**The solution:** embeddability is **precomputed at build/author time**. `npm run content:embeds`
issues requests for all 1,091 reference URLs, reads their framing headers, and writes
`src/content/embeds.generated.ts` as a `url → 0 | 1` map. At runtime `ReferenceList`:

- `1` (allows framing) → inline `<iframe>` preview; the **first** such reference opens by default.
- `0` (blocks framing) → a rich link card (title, `kind` tag, source domain, "Open in new tab").
- `undefined` (never checked) → collapsed, previewable on demand.
- Any open preview still falls back to the link card if it errors or hasn't loaded within **8 s**.

Current split: **542 previewable, 549 blocked, 0 broken.** `docs/EMBEDDING.md` lists every site with
its verdict and the exact blocking header — useful evidence when someone asks "why isn't MDN showing
inline?".

Four sites are **mixed per page** (`cursor.com`, `redis.io`, `vercel.com`, `vitest.dev`) — the
verdict map is per-URL, not per-domain, which handles that.

---

## 13. Video embedding

- Rendered as `<iframe src="https://www.youtube.com/embed/{videoId}?start={startSeconds ?? 0}" …>`.
  YouTube's embed player is built for third-party embedding, so this is the one preview type that
  reliably works.
- **Chapter-splitting** is used heavily: where one long course covers a topic in a single chapter, the
  topic points at that course with `startSeconds` (from the video's real chapter markers) and a
  human-readable `chapterLabel`. Different topics can share a course at different start times.
- `alternateVideos` powers a selector above the player — used mainly by `fe-react-projects`, where
  learners pick which full project walkthrough to build.
- **Video research never guesses IDs.** `scripts/research/yt.mjs` reads youtube.com itself
  (search results page, watch page, oEmbed). `info <id> --chapters` confirms existence *and*
  embeddability (oEmbed success proves it) and prints exact title, channel, duration and chapters.
- A topic that genuinely has no good embeddable video may use a flagged fallback:
  `{ title: "Search: …", channel: "YouTube search", url: "https://www.youtube.com/results?search_query=…", videoId: "" }`.
  The quality gate **warns** on these. There are currently **zero** in the curriculum.

---

## 14. Design system

All tokens live in `src/index.css` as **space-separated RGB channels** on `:root` and `.dark`, so
Tailwind opacity modifiers (`bg-summit/15`) work and dark mode only swaps variables.
`tailwind.config.ts` maps them through a `token()` helper.

### Colour tokens

| Token | Light | Dark | Meaning |
| --- | --- | --- | --- |
| `paper` / `background` | `#F5F6F2` | `#12151C` | page background |
| `ink` / `foreground` | `#1B1F27` | `#EDEFF3` | body text |
| `surface` / `surface-sunken` | near-paper | near-slate | cards, wells |
| `trailmark` | `#D98E2B` | — | Frontend accent; also **in-progress** state |
| `summit` | `#2F6E5B` | — | Backend accent; also **completed** state |
| `ridge` | `#6C5CE7` | — | AI-Driven accent |
| `glacier` | `#2E7DA8` | — | Full-Stack accent (**added** beyond the brief) |
| `basalt` | `#6B7280` | `#7B8496` | locked / muted |
| `editor` / `editor-gutter` / `editor-foreground` | dark in both themes | | the code editor |

Each accent has a `-strong` variant that is **text-safe (≥4.5:1)** on the page background; the base
accent is for fills, strokes and markers. The raw `trailmark` is only 2.5:1 on paper, which is why
**focus rings use `--trailmark-strong`** (≥3:1 both themes, per WCAG 1.4.11).

> **Why `glacier` exists:** the brief assigned `ridge` to both Full-Stack and AI-Driven while also
> reserving `ridge` for AI-Driven. Rather than duplicate an accent, Full-Stack got its own.

### Typography

- Headings: **Space Grotesk** (`font-display`), `text-wrap: balance`
- Body/UI: **IBM Plex Sans** (`font-sans`), `text-wrap: pretty`
- Code, topic IDs, status tags: **IBM Plex Mono** (`font-mono`)
- Type scale: 12 / 14 / 16 / 18 / 24 / 32 / 48 px with tightening letter-spacing at the top end
- `max-w-prose` is `68ch`; `.tabular` utility for tabular numerals

### Motion — one deliberate moment per page

| Page | The moment |
| --- | --- |
| Track / Module | the trail path draws itself in |
| Dashboard | the elevation profiles draw in |
| Topic | a checkmark scales in when you pass |
| Everywhere | a single ~150 ms route cross-fade |

`MotionConfig reducedMotion="user"` at the root, a global `@media (prefers-reduced-motion: reduce)`
block that flattens animations/transitions/scroll, and `preferredScrollBehavior()` for JS-driven
scrolling (which ignores the CSS rule).

### Accessibility

Skip link; `<main tabIndex={-1}>`; visible `trailmark-strong` focus rings everywhere; `fieldset
{ min-width: 0 }` so wide code blocks in quiz questions can't push the page wider than the viewport;
focus moves to results after grading; `role="status"` on loading regions; responsive at 375 / 768 /
1280 / 1440 px.

### Theming mechanics

`index.html` runs an inline script **before first paint** that reads the persisted `oyelabs-ui` key
(or the system preference) and adds `.dark` — no flash. `uiStore` seeds its initial theme by reading
that class back, and `App.tsx` keeps the class in sync afterwards.

### Deliberately avoided

Generic AI-app defaults: cream+terracotta, near-black+neon, identical shadowed cards everywhere,
ALL-CAPS eyebrows, middle-dot meta text, arrows on buttons, arbitrary 01/02/03 numbering.

---

## 15. Content authoring rules and the quality gate

Full rules live in `docs/CONTENT_GUIDE.md` (with two complete worked exemplars: `js-closures` for a
quiz topic and `js-debounce-throttle` for a code topic with a fake clock). Summary:

**Files an author writes for one module:**
1. `src/content/<trackId>/<moduleId>.ts` — `export default { … } satisfies Module;`
   (`satisfies`, not a type annotation, so literal types stay checked)
2. `content-tests/solutions/<topicId>.js` — one per code topic
3. `docs/research-notes/<moduleId>.md` — videos chosen and why, fallbacks, facts verified

**`npm run content:check` enforces (errors fail; warnings are informational):**

*Structure*
- module id/trackId match the registry and the file name; description present; topics non-empty
- topic ids kebab-case, globally unique, matching `moduleId`/`trackId`

*Summaries* — 350–2400 characters (under 350 is an error, over 2400 a warning)

*References* — 2–4 per topic, all `https:`, no duplicate URLs, valid `kind`, **at least one
`docs` or `spec`**

*Videos* — exact `https://www.youtube.com/watch?v=<11-char id>` with **no extra params**;
`videoId` must match the URL; `startSeconds` a non-negative integer; `durationLabel` matching
`(H)H:MM:SS` or `MM:SS`; `startSeconds` without `chapterLabel` warns; search-URL fallbacks must have
`videoId: ""` and produce a warning

*Quizzes* — 8–12 questions (4–12 for beginner topics); question ids `<topicId>-qN`, unique;
3–6 options, no duplicates; `correctIndex` in range; `correctIndices` needs ≥2 entries, no dupes,
in range, not all options, and must include `correctIndex`; explanation required;
**≥2 `isEdgeCaseOrInterviewQuestion`**; **non-beginner quizzes need ≥1 multi-select**

*Code challenges* — valid identifier `functionName`, declared in `starterCode`; **≥5 test cases**;
**≥2 `isEdgeCase`**; every test has a description; args are arrays and args/expected are
structured-cloneable; the **reference solution must pass every test**; and the **untouched starter
code must fail at least one test**

*Cross-checks* — a quiz topic must not also carry a `codeChallenge` and vice versa; milestones
outside advanced/expert warn.

**Content Markdown subset** (`RichText.tsx`): blank-line paragraphs, `- ` bullets, `1. ` numbered
lists, `` `inline code` ``, `**bold**`, and fenced ```` ```lang ```` blocks with a hand-rolled
JS/TS/JSX highlighter (comments, strings, numbers, keywords). Nothing else — no tables, links or
images inside content strings.

**`docs/CONTENT_GUIDE.md` §10 is a "current-facts sheet"** (verified ~September 2026) covering
React 19.3, React Router v8, Next.js 16, TypeScript 7.0, Tailwind v4.3, Vite 8, Vue 3.5/Pinia 4,
Node 24, Express 5, NestJS 12, PostgreSQL 18, OWASP Top 10:2025, Docker Compose v2, OpenAPI 3.2,
current Claude models and MCP spec, plus known URL redirects. Content quizzes are written against
these, not against older assumptions.

> Note the deliberate gap: the *curriculum content* teaches current versions (React Router v8,
> Tailwind v4), while the *app itself* runs React 18 / React Router 7 / Tailwind 3. That's
> intentional, not drift.

---

## 16. Commands

```bash
npm install
npm run dev            # regenerates the manifest, then vite dev on :5173
npm run build          # manifest -> tsc -b -> vite build -> dist/
npm run typecheck      # tsc -b
npm run preview        # serve dist/

npm run content:check                          # the full quality gate
npm run content:check -- --module fe-js-core   # one module (repeatable flag)
npm run content:check -- --no-solutions        # skip running reference solutions
npm run content:types                          # tsc over the content files only
npm run content:manifest                       # regenerate manifest.generated.ts
npm run content:embeds                         # re-probe iframe embeddability -> embeds.generated.ts
npm run content:videos                         # re-verify every video via oEmbed

node scripts/research/yt.mjs search "postgres explain analyze" --max 10
node scripts/research/yt.mjs info <videoId> --chapters
node scripts/research/check-urls.mjs <url> [url...]
```

`predev` and `prebuild` hooks run `build-manifest.mjs` automatically, so the manifest is never stale.

---

## 17. Build and deploy

**Chunking** (`vite.config.ts`, Rolldown `codeSplitting.groups`):
`react` (react/react-dom/scheduler/react-router) · `motion` (framer-motion) · `ui` (radix,
floating-ui, lucide, cva, clsx, tailwind-merge, zustand) · `curriculum-index`
(`manifest.generated.ts` + `embeds.generated.ts`). Each of the 37 module content files is its own
lazy chunk. `@react-pdf/renderer` (~1.2 MB) is deferred until a PDF download is requested.

**Vercel** (`vercel.json`): framework `vite`, build `npm run build`, output `dist`, SPA rewrite
`/(.*) → /index.html` (needed for deep links), and `Cache-Control: public, max-age=31536000, immutable`
on `/assets/*`. **No environment variables.**

```bash
npm i -g vercel
vercel login
vercel          # preview
vercel --prod   # production
```

Or import the repo in the Vercel dashboard. To keep it internal, enable **Deployment Protection**.
`.vercelignore` excludes `*.pdf` and `CLAUDE.md` from the upload.

---

## 18. Decisions, constraints and known gotchas

**Architectural decisions (from `docs/PROGRESS.md`):**
1. Full-Stack uses an added `glacier` accent (the brief double-booked `ridge`).
2. Content lives in per-module `.ts` files; a generated manifest holds light metadata and module
   content is lazy-loaded. This is what makes 293 topics viable in a client-only SPA.
3. Video research reads youtube.com directly rather than third-party aggregators; oEmbed success
   doubles as proof of embeddability.
4. Reference-preview embeddability is precomputed from response headers, because browsers fire
   `load` even for blocked frames.
5. Topics are levelled by their challenge's real difficulty, which is why levels skew advanced.
6. A v1 `curriculum-v1.ts` type file existed during the migration; both it and the v1 app are gone.

**Constraints inherent to the design:**
- **No backend** → progress is per-browser, quiz answer keys ship to the client, code grading is
  client-side, certificates are unverifiable. All acknowledged in-product and in the README.
- **Topic ids are permanent** — they are URL slugs *and* progress keys. Renaming one silently
  orphans learners' progress.
- **Quiz options are shuffled at runtime** — content must never reference option positions.
- **The code sandbox is a Web Worker**, adequate for a trusted internal team, not for public input.
- **Content files are the bulk of the repo.** Any tool reading this codebase should treat
  `src/content/**` as data conforming to §5, not as logic to read line by line.

**Research-era caveats worth knowing:**
- YouTube throttled watch-page scraping (HTTP 429 / captcha) late in the content build. Existence and
  embeddability were verified via oEmbed throughout (and re-verified for all 547 videos at the end);
  some durations and chapter starts came from YouTube's player data rather than the watch page.
- Several videos the brief listed as "verified" have different real durations (OWASP course 1:27:00,
  GraphQL course 1:28:59, Redux Toolkit 14:11:42, React Native 4:40:39, Bootstrap/Sass 5:02:23).
  The content uses YouTube's real values, not the brief's.
- Three `apollographql.com` URLs timed out during the embeddability sweep and were re-checked by
  hand (200, framing allowed).

**Nothing is currently flagged as needing a manual pick** — there are no search-URL video fallbacks
and no broken reference URLs.

---

## 19. How to make common changes

| Task | Where |
| --- | --- |
| Add a topic | Append to `src/content/<trackId>/<moduleId>.ts` in trail order; id must start with the module's `idPrefix` and be globally unique. Add `content-tests/solutions/<topicId>.js` if it's a code topic. Run `npm run content:check -- --module <id>`. |
| Add a camp (module) | Add an entry to `src/content/registry.ts`, create `src/content/<trackId>/<moduleId>.ts`, then check it. Until the file exists the manifest marks it `available: false` and the UI shows it as not-yet-written. |
| Add a track | Add a `TrackEntry` to `registry.ts` and extend `TrackId` in `src/types/curriculum.ts`, plus `trackIcons`/`trackCodes` in `lib/track-meta.ts`. |
| Change a colour | `src/index.css` only (both `:root` and `.dark`). Add a matching entry in `lib/accent.ts` and `lib/certificate.ts`'s `accentHex` if it's a new accent. |
| Change quiz pass mark | `QUIZ_PASS_THRESHOLD` in `src/store/progressStore.ts`. |
| Change the code timeout | `RUN_TIMEOUT_MS` in `src/lib/codeRunner.ts`. |
| Change what the quality gate enforces | `scripts/content/check.mjs`, and mirror it in `docs/CONTENT_GUIDE.md`. |
| Refresh embeddability verdicts | `npm run content:embeds` (rewrites `embeds.generated.ts` and should be mirrored into `docs/EMBEDDING.md`). |
| Re-verify all videos | `npm run content:videos`. |
| Add a backend | README's "Adding a backend later": SSO → progress API (keep the store's action surface, swap persistence) → server-side grading (keep answer keys off the client) → signed certificates with a `/verify/:id` page → a team dashboard. |

**Never hand-edit:** `src/content/manifest.generated.ts`, `src/content/embeds.generated.ts`.

---

## 20. Glossary

| Term | Meaning |
| --- | --- |
| **Trail** | A track (Frontend / Backend / Full-Stack / AI-Driven) |
| **Camp** | A module — a thematic group of 3–21 topics |
| **Waypoint** | A topic |
| **Summit** | Track completion; also the green accent token |
| **Milestone** | A capstone-worthy topic (usually 1–3 per camp, generally advanced/expert) |
| **Manifest** | The generated lightweight table of contents, always in the bundle |
| **Quality gate** | `npm run content:check` — the pass/fail standard for all content |
| **Chapter-splitting** | Pointing several topics at one long course at different `startSeconds` |
| **Edge-case question** | A quiz question marked `isEdgeCaseOrInterviewQuestion: true` |
| **Reference solution** | `content-tests/solutions/<topicId>.js` — must pass every test in CI-style checks |
