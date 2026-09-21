# Oyelabs Trails

The internal training platform for the Oyelabs dev team. It teaches four tracks (**Frontend**, **Backend**, **Full-Stack** and **AI-Driven Development**) as trails of topics. Every topic has a real docs link, a real YouTube video, a short summary and a graded challenge (a quiz or a coding exercise). Passing the challenge completes the topic. Completing every topic on a trail unlocks a downloadable certificate.

Everything runs in the browser. There's no backend yet, so progress lives in each person's browser (see [Adding a backend later](#adding-a-backend-later)).

## Stack

Vite 8, React 18, TypeScript, Tailwind CSS 3 with shadcn/ui (New York) components, Framer Motion, React Router 7, Zustand (persisted to `localStorage`) and `@react-pdf/renderer` for certificates. Fonts are self-hosted through `@fontsource`: Space Grotesk for headings, IBM Plex Sans for body text and IBM Plex Mono for code, topic IDs and status tags.

## Running it

Requires Node.js 20.19+ (22 LTS or newer recommended).

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # type-check + production build into dist/
npm run preview        # serve dist/ locally
npm run check:content  # validate the curriculum data
```

## Project layout

```
src/
  data/tracks/          frontend.ts, backend.ts, fullstack.ts, ai-driven.ts, index.ts
  types/curriculum.ts   Track, Topic, QuizQuestion, CodeChallenge
  store/                progressStore (topic progress), uiStore (theme, sidebar), profileStore (certificate name)
  pages/                Dashboard, Track (trail map), Topic, Certificate, NotFound
  components/
    layout/             app shell, sidebar, mobile nav, top bar
    trail/              TrailMap, ElevationProfile, Contours, StatusDot, reference cards
    challenge/          ChallengeRunner, QuizRunner, CodeRunner, CodeEditor, ChallengeResult
    certificate/        CertificateView (screen), generateCertificatePdf (lazy PDF), Seal
    ui/                 shadcn/ui primitives
  lib/                  codeRunner (sandboxed worker), certificate IDs, geometry, accents
scripts/check-content.mjs   structural checks for the curriculum
```

## Adding a topic

1. Open the track file in `src/data/tracks/` and add a `Topic` to its `topics` array, in the order learners should take it. The array order is the trail order.
2. Fill in every field:
   - `id`: kebab-case and unique across all tracks. It's used in URLs and as the progress key, so don't rename it once people have progress on it.
   - `trackId`: must match the track.
   - `level`: `beginner`, `intermediate` or `advanced`. The dashboard's elevation profile uses this, so harder topics sit higher on the trail.
   - `estMinutes`: the time estimate in minutes.
   - `isMilestone`: optional; milestones get a larger marker on the map.
   - `webRef` / `videoRef`: `{ label, url }`. Use official docs for `webRef`. For `videoRef`, use a real `https://www.youtube.com/watch?v=...` URL you've checked. You can confirm a video exists with `curl "https://www.youtube.com/oembed?url=<watch-url>&format=json"`, which returns its title and channel, or "Not Found".
   - `challengeType` plus either `quiz` or `codeChallenge` (see below).
3. Run `npm run check:content`. It catches duplicate IDs, missing fields, quiz questions without exactly 4 options, out-of-range answers, and code challenges whose starter code doesn't declare the named function.

**Quizzes** (`challengeType: "quiz"`): give each question an `id`, a `prompt`, 4 `options`, a `correctIndex` and a one-sentence `explanation`. Options are shuffled on every attempt, so write them to stand alone (no "all of the above").

**Code challenges** (`challengeType: "code"`) have four parts:
- `instructions`: a small Markdown subset (paragraphs, `- ` bullets and `` `inline code` ``).
- `starterCode`: must declare `functionName`.
- `functionName`: the function the tests call.
- `testCases`: an array of `{ args, expected, description }`. The tests call `functionName(...args)`. `args` and `expected` must be plain JSON-like data.

To test behaviour that needs a callback (like memoization), include a small driver function in the starter code and name *it* as `functionName`; `js-advanced` does this. Before shipping a challenge, write a reference solution and make sure it passes, and that the untouched starter code fails.

**Adding a track** means adding a file that exports a `Track`, registering it in `src/data/tracks/index.ts`, and extending `TrackId` in `src/types/curriculum.ts`. Each track needs an `accentToken`, an icon in `src/lib/track-meta.ts` and a short code for certificate IDs.

## How challenges work

`ChallengeRunner` switches on `challengeType`, and both paths write results through `recordAttempt(topicId, passed, score)`.

- **Quiz:** single-choice questions graded in the browser, with score = correct / total × 100. You pass at **80%**. After submitting you see which answers were right or wrong, with an explanation for each. Retaking a quiz clears the answers and reshuffles the options.
- **Code:** the editor is a `<textarea>` with a line-number gutter. Tab indents; press Esc then Tab to move focus out. Drafts are saved per topic in `localStorage`. **Run tests** starts a throwaway Web Worker from an inline Blob URL (`src/lib/codeRunner.ts`). The worker compiles the code, finds `functionName` and runs each test with deep-equality checks. There's a 3-second limit, after which the worker is terminated. You see pass/fail for each test, with expected vs received on failures. Score = passed / total × 100, and the topic only completes when every test passes.
- **Security:** this sandbox is fine for an internal tool used by a trusted team. It is **not** safe for code from the public. A worker can't touch the DOM or storage, but it can still make network requests until it's killed.

## How progress works

Everything is kept in `localStorage` under these keys:

| Key | Contents |
| --- | --- |
| `oyelabs-progress` | `{ [topicId]: { status, bestScore, completedAt, attempts } }` |
| `oyelabs-ui` | theme and sidebar state (also read by the inline script in `index.html` to avoid a theme flash) |
| `oyelabs-profile` | the name printed on certificates |
| `oyelabs-draft:<topicId>` | unsaved code for a code challenge |

- **Starting a topic:** opening a topic marks it `in-progress`.
- **Passing:** marks it `completed` with a timestamp and your best score. A later failed retry never un-completes it.
- **Resetting:** the topic page can reset a single topic, and the dashboard footer can reset everything.

## How certificates work

`/report/:trackId` shows an honest locked state, listing the topics that are left, until every topic on the trail is complete. Once the trail is complete:

- **Name:** you enter the name to print. It's saved in this browser.
- **Certificate:** it renders on screen from a fixed A4-landscape canvas, so the preview matches the PDF exactly.
- **Certificate ID:** a deterministic hash of the track, the normalised name and the time the trail was completed, e.g. `OYL-FS-YA4E-WT09`. The same inputs always give the same ID.
- **Seal:** drawn in the track's accent colour.
- **PDF:** made by `@react-pdf/renderer`, which only loads when someone clicks **Download PDF**, so it stays out of the main bundle. It uses TTF copies of the brand fonts from `src/assets/fonts/`, because fontkit can't parse the IBM Plex Mono WOFF files.

The certificate isn't verified by a server: anyone could edit their `localStorage`, and nobody else can check the ID. The certificate page says so.

## Design notes

- **Theme:** a trail. Topics are waypoints, tracks are trails and finishing a track means reaching the summit.
- **Tokens:** CSS variables in `src/index.css`, wired into `tailwind.config.ts`: `paper`, `ink`, `trailmark` (in progress), `summit` (completed), `basalt` (not started, borders) and `ridge` (AI-Driven only). `*-strong` variants are the text-safe shades.
- **Full-Stack accent:** the brief gave Full-Stack `ridge` but also reserved `ridge` for the AI-Driven track. Full-Stack uses an added `glacier` (steel blue) accent so all four tracks stay distinguishable.
- **Focus rings:** they use the stronger trailmark shade, because the raw amber is only about 2.5:1 on light paper and focus indicators need 3:1.
- **Motion:** used once per page. The trail draws itself on load on the map, elevation profiles draw on the dashboard, and a checkmark appears when you pass a challenge. The route cross-fade takes 150 ms. All motion respects `prefers-reduced-motion`.

## Deploying to Vercel

`vercel.json` already sets the Vite build, the `dist` output, an SPA rewrite so deep links like `/track/frontend` work, and long-lived caching for hashed assets. No environment variables are needed.

**From this folder with the CLI:**

```bash
npm i -g vercel        # or use `npx vercel` for each command below
vercel login
vercel                 # first run: pick your scope, create a new project, accept the detected settings. You get a preview URL.
vercel --prod          # deploys to production
```

**Or through Git:** push this repo to GitHub, GitLab or Bitbucket. Then in the Vercel dashboard choose **Add New... > Project**, import the repo, keep the detected Vite settings and click **Deploy**. Every push to the default branch then deploys to production, and other branches get preview URLs.

To keep the platform internal, turn on **Deployment Protection** (Vercel Authentication or password protection) in the project settings.

## Adding a backend later

To get shared team progress and certificates that can be verified:

1. **Sign-in:** add Google Workspace or GitHub SSO so progress belongs to a person, not a browser.
2. **Progress API:** add a small progress API (for example Postgres on Supabase or Neon behind Vercel Functions). Keep `progressStore`'s actions and swap the persistence layer, so the UI doesn't change.
3. **Server-side grading:** grade on the server. Keep quiz answer keys off the client, and run code tests in isolated containers instead of a browser worker.
4. **Certificates:** issue them on the server, with IDs signed by a private key (for example Ed25519). Add a public `/verify/:id` page that checks the signature and the stored record.
5. **Team dashboard:** add a view where leads can see team progress by track.

## Content maintenance

All 29 docs links and videos were checked on **2026-09-21**: docs pages returned HTTP 200, and every YouTube ID passed an oEmbed lookup. These links changed from the brief:

| Topic | Change |
| --- | --- |
| `ai-coding-tools` | `roadmap.sh/ai/vibe-coding` returned 404; now `roadmap.sh/vibe-coding` |
| `context-engineering` | same 404; now Anthropic's context-engineering article |
| `llm-fundamentals` | `docs.claude.com` redirects; now `platform.claude.com/docs` |
| `react-router-state` | `reactrouter.com/en/main` ends in a 404; now `reactrouter.com/home` |
| `nextjs-fullstack` | the old Next.js data-fetching URL redirects; now `/docs/app/getting-started/fetching-data` |
| MDN Learn, MDN Closures, MongoDB MERN, Express routing, OWASP Top 10 | now point at their current addresses after redirects |

These videos cover their topic only partly and are worth swapping when better ones appear:

| Topic | Gap |
| --- | --- |
| `html-css-foundations` | CSS only |
| `react-router-state` | React Router v7, routing only |
| `nextjs-app-router`, `nextjs-fullstack` | share one Next.js 16 course, which uses MongoDB rather than Prisma or Auth.js |
| `t3-stack` | 2023, Pages Router |
| `auth-security` | a 100-second overview |
| `node-express` | teaches Express 4 |
| `ai-agents` | predates MCP |
