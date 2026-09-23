# Oyelearn

The internal training platform for the Oyelabs dev team.

Four long **trails** (Frontend, Backend, Full-Stack, AI-Driven Development), each made of **camps**
(modules) along the way, each camp made of **topics** (waypoints). It is built to be deep enough
for an engineer's first year and their tenth; working through a whole trail properly takes months.

From v3 it is a small full-stack app. The super admin creates accounts, writes down what they know
about each person, and issues an AI-generated **placement assessment**. The assessment is proctored
in the browser, graded on the server, and turned into a **learning plan**: the subset of the
curriculum that person should actually work through. Learners see their plan and nothing else.

Every topic has:
- an embedded, playable YouTube video, deep-linked to the right chapter when it is part of a longer course
- 2–4 verified references (official docs or spec, a deep-dive article and, where relevant, an interview-prep repo)
- a senior-level summary covering why the concept exists, its tradeoffs, when to reach for it and its gotchas
- a hard graded challenge

| Trail | Camps | Topics | Material |
| --- | --- | --- | --- |
| Frontend | 14 | 149 | ~182 h |
| Backend | 12 | 92 | ~102 h |
| Full-Stack | 5 | 22 | ~36 h |
| AI-Driven Development | 6 | 30 | ~28 h |
| **Total** | **37** | **293** | **~347 h** |

That is 2,163 quiz questions and 86 coding challenges. Every video was verified with YouTube's
embed API, every reference URL was checked, and every challenge's reference solution runs in the
same sandbox that grades submissions.

## Stack

**Client** Vite 8, React 18, TypeScript, Tailwind CSS 3 with shadcn/ui (New York), Framer Motion,
React Router 7, Zustand, `@react-pdf/renderer`. Fonts self-hosted: Space Grotesk, IBM Plex Sans,
IBM Plex Mono.

**Server** Fastify 5, Drizzle ORM on better-sqlite3 (WAL), argon2id password hashing, `isolated-vm`
for grading submitted code, `@mediapipe/tasks-vision` in the browser for proctoring.

One Node process serves `/api/*` and the built SPA in production, so there is no CORS and the
session cookie is first-party. In development Vite proxies `/api` to the API on `:8787`.

## Running it

Requires **Node.js 22.18+** (24 LTS recommended). The content scripts import TypeScript directly
using Node's built-in type stripping.

```bash
npm install                  # also fetches the MediaPipe proctoring assets (~46 MB)
npm run dev                  # Vite on :5173 and the API on :8787, together
npm run build                # manifest + server content + typecheck + SPA + server bundle
npm start                    # run the production bundle from dist-server/
```

On first boot the server creates a super admin. If `SUPERADMIN_PASSWORD` is not set it generates a
password and prints it **once** to the log. Either way that account must change its password at
first sign-in.

```bash
npm run dev:seed             # three sample learners with realistic profiles
npm run dev:seed -- --issue  # …and generate a placement assessment for each
```

Development runs against a deterministic mock AI provider unless `OYELEARN_MOCK_AI=0`. It produces
structurally valid, semantically meaningless output — enough to exercise the pipeline, never enough
to judge content quality. The admin console says so while it is in use, and it is never available
in production.

### Other commands

```bash
npm run test                 # server + shared tests (vitest, in-memory SQLite, fastify.inject)
npm run typecheck            # tsc -b across the SPA, the server and the build tooling
npm run db:generate          # regenerate SQL migrations after editing the Drizzle schema
npm run mediapipe            # re-fetch the proctoring WASM and models

npm run content:check                         # the content quality gate
npm run content:check -- --module fe-js-core  # one camp
npm run content:types                         # TypeScript check of the content files
npm run content:manifest                      # regenerate the manifest
npm run content:server                        # regenerate the server content bundle
npm run content:embeds                        # re-check which reference sites allow iframe previews
npm run content:videos                        # re-verify every video still exists and is embeddable
```

## How the content is organised

```
src/content/
  registry.ts                 order of tracks and camps, with each camp's topic-id prefix
  <trackId>/<moduleId>.ts     one file per camp: `export default { ... } satisfies Module`
  manifest.generated.ts       light table of contents (build tooling only; generated)
  embeds.generated.ts         which reference URLs allow iframe previews (generated)
  index.ts                    lookups and paths, backed by the manifest the API serves
server/content/               module JSON the server serves (generated; not committed)
content-tests/solutions/      a reference solution for every code challenge
docs/CONTENT_GUIDE.md         the authoring guide and quality bar — read this before writing content
docs/research-notes/          per-camp notes: videos chosen, fallbacks, facts verified
scripts/research/             YouTube search/info/chapters and URL checkers
scripts/content/              quality gate, manifest and server-content generators, re-checkers
```

**The SPA no longer bundles content.** The server owns it and filters it per person, because
"a learner may only see their assigned topics" and "answer keys never reach the client" are
otherwise impossible.

### Adding a topic or a camp

Read `docs/CONTENT_GUIDE.md` first — it has the exact format, the research protocol and two fully
worked exemplars.

**New topic:** add it to the right `src/content/<trackId>/<moduleId>.ts` in trail order. Topic ids
are kebab-case, unique across the whole curriculum and **permanent** — they are URL slugs, progress
keys and plan entries. Start them with the camp's `idPrefix` from the registry.

**Finding a video.** Never guess an id:

```bash
node scripts/research/yt.mjs search "postgres explain analyze hussein nasser"
node scripts/research/yt.mjs info <videoId> --chapters
```

`info` confirms the video exists and allows embedding, and lists chapter timestamps for
deep-linking a topic into a longer course.

**Checking references:** `node scripts/research/check-urls.mjs <url>...`, using the final URL after
any redirect.

**New camp:** add it to `registry.ts`, create its module file, then
`npm run content:check -- --module <id>`.

**The quality gate** enforces 2–4 references including the official docs or spec; valid video URLs
with matching ids and integer chapter starts; summaries with real depth; quiz size by level with at
least two interview-level questions and one multi-select; and code challenges with 5+ tests, 2+ edge
cases, a reference solution that passes and starter code that fails.

## How the app works

### Roles and accounts

Two roles, no self-signup. `superadmin` has full access; `learner` accounts are created by the
super admin with a username and a temporary password. Sessions are an opaque 256-bit token in an
`httpOnly`, `SameSite=Lax` cookie, stored as its SHA-256 with a 12-hour sliding expiry capped at
seven days, rotated on login and on password change.

### Routes

| Route | Who | What |
| --- | --- | --- |
| `/login`, `/change-password` | anyone | Full-page, no app chrome |
| `/plan` | learner | Their plan, and the funnel into the assessment |
| `/assessment` | learner | The proctored placement assessment, fullscreen |
| `/track/:trackId` … `/topic/:topicId` | learner | The trail, filtered to their plan |
| `/report/:trackId` | learner | Certificate |
| `/admin/*` | superadmin | Overview, people, onboarding, live, AI connection, audit |

### The assessment

The whole item pool is generated **before** the learner starts, so nothing waits on a model
mid-test. During the test the server only selects: a staircase per skill area that goes up on a
pass and down on a miss, visiting areas round-robin, stopping an area after six items or two
reversals.

The server is authoritative for everything a browser cannot be trusted with — the clock, the
warning count, and which item was served. The client timer is display only.

### Proctoring

The browser watches for tab switches, window blur, leaving fullscreen, copy/cut/paste, PrintScreen,
and camera signals: no face, multiple faces, looking away, a phone in frame, and a covered or
stopped camera. Video is processed **on the device**; only still JPEG snapshots are uploaded, and
only when a warning fires. They are served exclusively through an authenticated super-admin route
and deleted after `SNAPSHOT_RETENTION_DAYS` (90 by default).

Soft warnings are logged. Hard warnings play a tone and show a modal; the third counted one ends
the assessment, keeping every answer — and the evaluation still runs, flagged for review.

**What this cannot do.** A browser cannot block an OS screenshot, screen sharing, or a second
device out of the camera's view. Camera signals are probabilistic; lighting, glasses and camera
angle cause false positives, which is why they are debounced and why snapshots exist. **An
integrity flag is evidence for a human, not a verdict** — the AI evaluation reports integrity
separately and never lowers a skill score because of it.

`docs/PROCTORING_TEST.md` is the manual checklist: every signal, how to trigger it, and what should
happen.

### Grading

- **Quizzes** are graded on the server, the only place the answer key exists. Single-select is
  graded on the chosen option; multi-select is all-or-nothing. Options reshuffle on every retry —
  client-side, display only, with answers sent as original option indices. 80% passes.
- **Code challenges** let the learner run the *visible* tests in a Web Worker in their own browser
  for fast feedback. Submitting sends the code to the server, which runs every test — visible and
  hidden — in a fresh V8 isolate with a memory cap and a timeout, and decides pass or fail. Hidden
  tests never reach the browser, so passing the visible ones is not enough.

### AI

The super admin connects a provider under **Admin → AI connection**. An **Anthropic API key on a
company account with a spending cap** is the recommended option. OpenAI API keys work too. The two
CLI adapters (Claude Code, Codex) use subscription credentials and sit behind an explicit
acknowledgement, because both providers restrict that use — the warnings are shown in full on that
page and are not there for decoration.

Credentials are encrypted with AES-256-GCM using `APP_MASTER_KEY` and are never returned to the
client after saving; only the last four characters are. Every call is recorded in `ai_calls`, which
is the only way to attribute usage per person when everyone shares one credential.

### Progress and certificates

Progress is stored per account, so it follows a person between devices. Opening a topic marks it in
progress; passing marks it complete, and a later failed retry never un-completes it. Only two
things still live in `localStorage`: the theme, and an unsent code draft keyed by user and topic.

Certificates unlock when the topics in a person's plan for a track are complete.

## Deploying v3 (VPS)

v3 needs a persistent disk and a long-running process — SQLite in WAL mode, snapshot files, a
background job worker and an SSE feed. Serverless has none of those, so **the Vercel deployment
from v2 is retired**.

### 1. Prepare the host

Any small Linux VPS with Docker and Caddy. Two vCPU and 2 GB of RAM is comfortable for a team of
this size; the memory matters because grading a code submission spins up a V8 isolate.

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin caddy
```

### 2. Configure

```bash
git clone <your-remote> trails && cd trails
cp .env.example .env
openssl rand -base64 32     # → APP_MASTER_KEY
openssl rand -base64 32     # → SESSION_SECRET
$EDITOR .env
```

`APP_MASTER_KEY` encrypts the stored AI credentials. **If it changes, every saved credential
becomes unreadable and has to be re-entered.** Back it up somewhere other than the server.

Leave `SUPERADMIN_PASSWORD` empty to have one generated and printed once at first boot.

### 3. Build and run

```bash
docker compose up -d --build
docker compose logs -f trails     # the generated super-admin password is in here, once
```

The image runs as a non-root user, keeps its state on the `oyelearn-data` volume, and binds only to
`127.0.0.1:8787` — Caddy is the only thing that reaches it.

To use a CLI AI adapter, build with `--build-arg INSTALL_CLAUDE_CLI=1` or `INSTALL_CODEX_CLI=1`. An
API key needs neither.

### 4. Reverse proxy

```bash
sudo cp Caddyfile.example /etc/caddy/Caddyfile
sudo $EDITOR /etc/caddy/Caddyfile     # set the domain and the email
sudo systemctl reload caddy
```

Caddy handles certificates automatically. The one setting that is load-bearing is
`flush_interval -1` on `/api/admin/live/stream`: without it the admin's live integrity feed is
buffered and warnings arrive in a batch, minutes late.

### 5. Check

```bash
curl -fsS https://oyelearn.example.com/api/health
docker compose ps       # the healthcheck should read healthy
```

Sign in as the super admin, change the password, add an AI credential, verify it, set it active,
then onboard a learner.

### Backups

A nightly job writes `VACUUM INTO /data/backups/trails-<timestamp>.db` and keeps the newest 14.
`VACUUM INTO` produces a consistent copy without stopping writes, which a file copy of a WAL
database cannot promise. Copy `/data/backups` off the host on your own schedule — a backup on the
same disk is not a backup.

```bash
docker compose exec trails ls -lh /data/backups
docker compose cp trails:/data/backups ./backups
```

### Upgrading

```bash
git pull && docker compose up -d --build
```

Migrations run at boot. Take a backup first; there is no automatic down-migration.

## Design notes

The design follows a trail metaphor: topics are waypoints, modules are camps, tracks are trails and
a finished track is a summit. Colour tokens live in `src/index.css` as RGB channels, so Tailwind
opacity modifiers work and dark mode only swaps variables. The `*-strong` variants are text-safe;
focus rings use the stronger trailmark shade to clear 3:1 on both themes. Full-Stack uses an added
`glacier` accent, because the brief reserves `ridge` for AI-Driven.

Each page has one deliberate motion moment — the trail draws itself in, the elevation profiles draw
in, a checkmark scales in when you pass — and everything respects `prefers-reduced-motion`.

## Documentation

| File | What |
| --- | --- |
| `docs/TRAILS_V3_BRIEF.md` | The v3 specification. Overrides `CLAUDE.md` where they differ. |
| `docs/V3_STATE.md` | Build state, decisions, and everything still blocked or unverified. |
| `docs/CODEBASE_CONTEXT.md` | A single-file briefing on the whole repository. |
| `docs/CONTENT_GUIDE.md` | The content authoring bar, with worked exemplars. |
| `docs/PROCTORING_TEST.md` | The manual proctoring checklist. |
| `docs/EMBEDDING.md` | Which reference sites allow inline previews, and why the rest do not. |
| `docs/PROGRESS.md` | Module-by-module build tracker and the decisions log. |
