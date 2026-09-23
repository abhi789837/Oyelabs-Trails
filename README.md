# Oyelabs Trails

> **v3 is in progress.** The app now has a server: accounts, server-side grading, per-person
> learning plans and an admin console. Parts of this README still describe v2 — the sections on
> running it and on the content pipeline are current, the ones on progress storage and on
> deploying to Vercel are not. `docs/TRAILS_V3_BRIEF.md` is the spec, `docs/V3_STATE.md` is the
> build state, and this file gets its full rewrite in phase P8.

The internal training platform for the Oyelabs dev team: four long **trails** (Frontend, Backend, Full-Stack, AI-Driven Development), each made of **camps** (modules) along the way, each camp made of **topics** (waypoints). It's built to be deep enough for an engineer's first year and their tenth. Working through a whole trail properly takes months.

Every topic has:
- an embedded, playable YouTube video, deep-linked to the right chapter when it's part of a longer course
- 2–4 verified references (official docs or spec, a deep-dive article and, where relevant, an interview-prep repo)
- a senior-level summary covering why the concept exists, its tradeoffs, when to reach for it and its gotchas
- a hard graded challenge

Challenges come in two kinds. A **quiz** has 8–12 questions, including interview-level edge cases and multi-select questions, and passes at 80%. A **coding exercise** has 5+ tests, including edge cases, and passes only when every test passes. Passing completes the topic; finishing every topic in a camp triggers a "camp complete" notification, and finishing every camp unlocks the trail's certificate.

| Trail | Camps | Topics | Material |
| --- | --- | --- | --- |
| Frontend | 14 | 149 | ~182 h |
| Backend | 12 | 92 | ~102 h |
| Full-Stack | 5 | 22 | ~36 h |
| AI-Driven Development | 6 | 30 | ~28 h |
| **Total** | **37** | **293** | **~347 h** |

That's 2,163 quiz questions and 86 coding challenges in all. Every video was verified with YouTube's embed API, every reference URL was checked, and every challenge's reference solution runs in CI-style checks and in the browser runner.

From v3 there is a server (Fastify + SQLite). Learners sign in, see only the topics assigned to
them, and their progress and grades are stored server-side. Answer keys and hidden tests never
reach the browser.

## Stack

Vite 8, React 18, TypeScript, Tailwind CSS 3 with shadcn/ui (New York) components, Framer Motion, React Router 7, Zustand (persisted to `localStorage`) and `@react-pdf/renderer` for certificates. Fonts are self-hosted: Space Grotesk, IBM Plex Sans and IBM Plex Mono.

## Running it

Requires Node.js 22.18+ (Node 24 LTS recommended). The content scripts import TypeScript files directly using Node's built-in type stripping.

```bash
npm install
npm run dev            # http://localhost:5173 (regenerates the content manifest first)
npm run build          # manifest + type-check + production build into dist/
npm run preview        # serve dist/ locally
```

Content tooling:

```bash
npm run content:check                         # quality gate for all modules (see below)
npm run content:check -- --module fe-js-core  # one module
npm run content:types                         # TypeScript check of the content files
npm run content:manifest                      # regenerate src/content/manifest.generated.ts
npm run content:embeds                        # re-check which reference sites allow iframe previews
npm run content:videos                        # re-verify every video still exists and is embeddable
```

## How the content is organised

```
src/content/
  registry.ts                 order of tracks and camps (modules), with each module's topic-id prefix
  <trackId>/<moduleId>.ts     one file per camp: `export default { ... } satisfies Module`
  manifest.generated.ts       light table of contents (always loaded; generated)
  embeds.generated.ts         which reference URLs allow iframe previews (generated)
  index.ts                    lookups, paths, and lazy loading of module files
src/types/curriculum.ts       Track > Module > Topic, quiz and code challenge types
content-tests/solutions/      a reference solution for every code challenge
docs/CONTENT_GUIDE.md         the authoring guide and quality bar (read this before writing content)
docs/research-notes/          per-module notes: videos chosen, fallbacks, facts verified
docs/EMBEDDING.md             which reference sites allow inline previews, and why the others don't
docs/PROGRESS.md              build tracker and decisions log
scripts/research/             YouTube search/info/chapters and URL/embeddability checkers
scripts/content/              quality gate, manifest generator, embed and video re-checkers
```

The app always loads the manifest, which is small, and code-splits each module file. A camp's full content (summaries, questions, references) only downloads when someone opens one of its topics.

## Adding a topic or a camp

Read `docs/CONTENT_GUIDE.md` first. It has the exact format, the research protocol and two fully worked exemplars.

**New topic:** add it to the right `src/content/<trackId>/<moduleId>.ts`, in trail order. Topic ids are kebab-case, unique across the whole curriculum and permanent (they're URL slugs and progress keys). Start them with the module's `idPrefix` from the registry.

**Finding a video.** Never guess an id. Use the helpers, which read youtube.com itself:

```bash
node scripts/research/yt.mjs search "postgres explain analyze hussein nasser"
node scripts/research/yt.mjs info <videoId> --chapters
```

`info` confirms the video exists and allows embedding, gives the exact title, channel and duration, and lists chapter timestamps. For a topic covered by one chapter of a long course, set `startSeconds` and `chapterLabel`.

**Checking references:** `node scripts/research/check-urls.mjs <url>...`. Use the final URL after any redirect.

**Reference solutions:** code challenges need one in `content-tests/solutions/<topicId>.js`.

**New camp:** add it to `registry.ts`, create its module file, and run `npm run content:check -- --module <id>`.

**The quality gate** (`npm run content:check`) enforces:
- 2–4 references per topic, including the official docs or spec
- valid video URLs, where the id matches and chapter starts are integers
- summaries with real depth
- quiz size by level (4–12 for beginner topics, 8–12 otherwise), at least 2 interview-level questions, and at least 1 multi-select question for non-beginner topics
- code challenges with 5+ tests, 2+ of them edge cases, plain-data arguments, a reference solution that passes every test, and starter code that fails at least one

## How the app works

- **Routes:** `/` dashboard, `/track/:trackId` trail of camps, `/track/:trackId/module/:moduleId` a camp's trail of topics, `/track/:trackId/module/:moduleId/topic/:topicId` topic, `/report/:trackId` certificate. Old v1 links (`/track/:trackId/topic/:topicId`) redirect.
- **Quizzes:** graded on the server, which is the only place the answer key exists. Single-select questions are graded on the chosen option; multi-select questions are all-or-nothing. Options reshuffle on every retry (client-side, display only — answers are sent as original option indices). Explanations come back with the grade.
- **Code challenges:** the learner can run the *visible* tests in a Web Worker in their own browser for fast feedback. Submitting sends the code to the server, which runs every test — visible and hidden — in an isolated V8 (`isolated-vm`) with a memory cap and a timeout, and decides pass or fail. Hidden tests never reach the browser, so passing the visible ones is not enough.
- **Reference previews:**
  - **Blocked sites:** many docs sites (MDN, GitHub, javascript.info, roadmap.sh…) forbid being shown inside other sites with `X-Frame-Options` or CSP `frame-ancestors`. Browsers still fire `load` for those blocked frames, so the app can't detect this at runtime. Instead, `npm run content:embeds` records each site's headers ahead of time, and blocked sites get a link card.
  - **Allowed sites:** these get an inline preview. The first one opens by default, and any preview falls back to the link card if it errors or doesn't load within 8 seconds.
- **Progress:** stored on the server, per account, so it follows a person between devices. Opening a topic marks it in progress; passing marks it complete with the time and best score, and a later failed retry never un-completes it. Only two things still live in `localStorage`:

  | Key | Contents |
  | --- | --- |
  | `oyelabs-ui` | theme and sidebar state |
  | `oyelabs-draft:<userId>:<topicId>` | unsaved code for a code challenge |
- **Certificates:** unlock when every topic in a trail is complete. You get an on-screen certificate and a PDF (lazy-loaded) with a deterministic ID made from the track, the name and the completion time. Nothing is verified by a server, and the page says so.

## Design notes

The design follows a trail metaphor: topics are waypoints, modules are camps, tracks are trails and a finished track is a summit. Colour tokens live in `src/index.css`; the `*-strong` variants are text-safe shades. Full-Stack uses an added `glacier` accent, because the brief reserves `ridge` for AI-Driven. Focus rings use the stronger trailmark shade to meet 3:1 contrast.

Each page has one deliberate motion moment:
- **trail pages:** the trail draws itself in
- **dashboard:** the elevation profiles draw in
- **topic pages:** a checkmark scales in when you pass

Everything respects `prefers-reduced-motion`.

## Deploying to Vercel

`vercel.json` sets the Vite build, the `dist` output, an SPA rewrite for deep links, and long-lived caching for hashed assets. No environment variables are needed.

```bash
npm i -g vercel        # or prefix each command with npx
vercel login
vercel                 # first run: pick a scope, create a new project and accept the detected settings. You get a preview URL.
vercel --prod          # production
```

Or push the repo to GitHub, GitLab or Bitbucket, then choose **Add New... > Project** in the Vercel dashboard, import the repo and click **Deploy**. To keep it internal, enable **Deployment Protection** in the project settings.

## Adding a backend later

1. **Sign-in:** add Google Workspace or GitHub SSO so progress follows a person, not a browser.
2. **Progress API:** add one (e.g. Postgres on Supabase or Neon behind Vercel Functions). Keep the progress store's actions and swap its persistence layer.
3. **Server-side grading:** keep quiz answer keys off the client, and run code tests in isolated containers.
4. **Certificates:** issue them on the server with signed IDs (e.g. Ed25519), and add a public `/verify/:id` page.
5. **Team dashboard:** add one where leads can see progress by trail and camp.
