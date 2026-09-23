# v3 build state

My memory across sessions. Resume from the first unchecked item. Update after every completed step.

Sources of truth: `docs/TRAILS_V3_BRIEF.md` (overrides `CLAUDE.md`), `docs/CLAUDE_CODE_PROMPTS.md`,
`docs/CODEBASE_CONTEXT.md`, `docs/CONTENT_GUIDE.md`, `docs/PROGRESS.md`.

## Answers given up front (do not re-ask)

1. Learners see **strictly their plan only**.
2. A terminated assessment **still gets an auto-generated plan**, flagged for admin review.
3. **No paste in code items** (admin config may enable it later).
4. Wave 1 order: PHP & Laravel → Mobile → Angular + Svelte camps (Frontend) → DevOps & Cloud.
5. P8 produces **deployment artifacts only**. Do not deploy anywhere.

## Environment

- `ANTHROPIC_API_KEY` is **not set** in this environment. A deterministic `MockProvider`
  (dev/test only, never selectable in production) backs the P3–P6 verification runs.
  **Real-AI verification is pending** and must be re-run by Abhishek with a real credential.
- Node v24.11.1, npm 11.6.2, Windows 11 + Git Bash. npm registry reachable.

## Phases

- [x] P0 Foundations — `server/` + `shared/` scaffold, Fastify, Drizzle + migrations, dev script, `/api/health`, Vite proxy
- [x] P1 Auth — users, sessions, seed superadmin, login/change-password, guards, AuthProvider, admin onboarding, audit log
- [x] P2 Content gating + progress — server content bundle, filtered manifest/content API, server quiz grading, sandboxed code verification, progress API, manual plan editor
- [x] P3 AI layer — crypto box, credentials CRUD + UI, four adapters, verify, `ai_calls` audit, job queue, model settings
- [x] P4 Assessment generation — blueprint → pools → critic → code validation; Issue assessment; admin pool preview
- [x] P5 Test taking + proctoring — pre-flight, item runner, adaptive selector, detectors, warnings, SSE live view, termination
- [x] P6 Evaluation + plans — explain grading, evaluation job, plan validation/publish, learner `/plan`, admin evaluation tab
- [x] P7 Admin console polish — overview, people table, learner detail tabs, usage reports, retention job, backups (`0487585`)
- [x] P8 Deploy artifacts — Dockerfile, compose, Caddyfile.example, `.env.example`, README (artifacts only, no deploy) (`f732c5c`)

## Curriculum Wave 1

### PHP & Laravel (`php`)
- [x] php-foundations — 10 topics, 94 questions (`4dd3a47`)
- [x] php-oop — 11 topics, 114 questions
- [x] php-modern — 12 topics, 120 questions
- [x] php-composer-psr — 12 topics, 124 questions
- [x] php-web — 12 topics, 129 questions
- [x] laravel-foundations — 14 topics, 150 questions
- [ ] laravel-eloquent
- [ ] laravel-auth
- [ ] laravel-apis
- [ ] laravel-queues-events
- [ ] laravel-testing
- [ ] laravel-ecosystem
- [ ] laravel-deploy
- [ ] php-wordpress

### Mobile (`mobile`)
- [ ] mobile-foundations
- [ ] mobile-react-native
- [ ] mobile-dart
- [ ] mobile-flutter
- [ ] mobile-kotlin-compose
- [ ] mobile-swift-swiftui
- [ ] mobile-cross-cutting

### Frontend additions
- [ ] fe-angular
- [ ] fe-svelte

### DevOps & Cloud (`devops`)
- [ ] devops-linux-shell
- [ ] devops-networking-tls
- [ ] devops-reverse-proxies
- [ ] devops-aws-core
- [ ] devops-terraform
- [ ] devops-kubernetes
- [ ] devops-observability

## Log

_(newest last: step, commit hash, known gaps)_

- **Session start.** Moved `TRAILS_V3_BRIEF.md` and `CLAUDE_CODE_PROMPTS.md` into `docs/`;
  renamed `docs/AI_CONTEXT.md` (written this session) to `docs/CODEBASE_CONTEXT.md` to match the
  paths the prompts reference. Created this file. Added the v3 pointer to the top of `CLAUDE.md`
  and a `## v3 decisions` section to `docs/PROGRESS.md`.

- **P0 done** — `17f087e` "v3 phase 0: server foundation".
  Built: `shared/` (enums, api, auth, profile zod schemas), `server/` (Fastify 5 app, `/api/health`,
  JSON error envelope, SPA static + deep-link fallback), the full §5 Drizzle schema (17 tables) with
  its generated migration, `env.ts`, `scripts/build-server.mjs` (esbuild), `vitest.config.ts` and a
  test harness using an in-memory DB + `fastify.inject`.
  Verified: `tsc -b` clean · 7/7 tests pass · `content:check` 37 modules / 293 topics / 0 errors /
  0 warnings · `npm run dev` serves the SPA and proxies `/api` · the production bundle serves both
  from one process (`/api/health` 200, deep link `/track/frontend/module/fe-js-core` 200 text/html).
  Verified from installed sources, not memory: Fastify 5.12.5 (`disableRequestLogging` is
  deprecated — dropped it), Drizzle 0.45.3 (`sqliteTable(name, cols, t => [...])` array form,
  `text({mode:'json'})`, `integer({mode:'boolean'})`), better-sqlite3 13.0.3 (loads natively on
  Windows/Node 24, no build step), zod 4.6.5 (has built-in `z.toJSONSchema()` — no
  `zod-to-json-schema` dependency needed for the P3 AI layer), drizzle-kit 0.31.11 `defineConfig`.
  Decisions: server code uses relative imports (not `@shared`) so tsx and esbuild need no alias
  plumbing; the server is bundled with esbuild rather than `tsc`-emitted, so `shared/` needs no
  `.js` extensions; tests are excluded from `tsconfig.app.json` (they need node types).
  Known gaps: none for P0. Vite picks 5174 when 5173 is already taken — expected.

- **P1 done** — `85462c5` "v3 phase 1: auth and onboarding".
  Built (server): argon2id hashing, password policy with a generated 1,572-entry common-password
  list, opaque SHA-256-stored sessions in an httpOnly cookie, login with per-account lockout and
  per-IP rate limit, forced password change, `requireUser`/`requireActiveUser`/`requireSuperadmin`,
  admin user CRUD (onboard, profile, reset password, disable, revoke sessions), audit log, Helmet
  CSP, and `app.routeTable`.
  Built (client): `AuthProvider`, `/login`, `/change-password`, `RequireAuth`/`RequireSuperadmin`,
  `/admin` console with People and Onboard, sign-out and an Admin link in the learner TopBar, and
  the existing app remounted behind the auth guard with relative routes.
  Verified: 52/52 tests · typecheck clean · `content:check` 0 errors · full HTTP run against the
  production bundle (seed prints the 20-char password once → admin blocked with
  `password_change_required` → change → admin allowed → onboard learner → learner logs in with the
  temporary password → learner gets 403 on every `/api/admin` route).
  Security tests that matter: a learner gets 403 on **every route in `app.routeTable`** starting
  `/api/admin` (self-extending), the audit row contains neither the password nor the notes, the
  people list contains no `$argon2id$` string, and unknown-username vs wrong-password responses are
  byte-identical.
  Decisions: the "password contains the username" rule only applies to usernames of 4+ characters
  (a 3-character username would reject too many good passphrases); login returns 401 for a
  malformed body rather than 400, so the endpoint cannot be used as a username validator.
  **Known gap:** `issueAssessment` from the onboarding form is accepted and audited but not acted
  on until P4 wires the blueprint job.

- **P2 done** — `d822436` "v3 phase 2: gated content and server progress".
  Built (server): `build-server-content.mjs` (+ `registry.json`), `ContentStore`, `filter.ts`
  (the single choke point for what a caller may see), `grade.ts`, the `isolated-vm` sandbox with a
  `worker_threads` development fallback, `/api/content/modules/:track/:module`, `/api/me/manifest`,
  `/api/me/progress`, `/api/me/plan`, `/api/topics/:id/attempt`, admin plan publish/read and admin
  progress read, plans and progress repositories.
  Built (client): `curriculumStore` (manifest + module fetching), rewritten `src/content/index.ts`
  with the same helper signatures, API-backed `progressStore`, `CurriculumProvider`,
  server-graded `QuizRunner`, two-step `CodeRunner` (visible tests locally, verdict from the
  server), and the admin learner page with a manual plan editor.
  Verified: 102/102 tests (27 new in `content.test.ts`, 23 in `sandbox.test.ts`) · typecheck clean ·
  `content:check` 0 errors · the 37 content chunks and the 4,116-line manifest are gone from the
  SPA build (7 JS chunks left; a grep for a manifest-only string finds nothing) · HTTP run against
  the production bundle confirmed empty-manifest-without-a-plan, 3-of-19 topics with a plan,
  `id/prompt/options/multi` only on a learner's quiz question, 404 on an unassigned module, full
  keys for the admin, and working grading.
  Verified from installed sources: `isolated-vm` 7.0.1 **builds and runs on Windows** from
  prebuilt binaries — no blocker, and production does not need the `worker_threads` fallback. A
  test asserts `require`, `process`, `fetch`, `Buffer` and `setTimeout` are all undefined inside
  the isolate.
  Decisions: learner-initiated progress reset was removed (progress is now a record the admin
  reviews, and letting a learner wipe their attempt history would undermine that); visible tests
  are the first half with a minimum of three; a hidden test reports only pass/fail, not even its
  description, because descriptions name the edge case; the certificate id still hashes an ISO
  timestamp, so the epoch milliseconds the server sends are converted at that one boundary.
  **Known gaps:** certificates still unlock per *track* rather than per *plan*, and the
  `/verify/:certificateId` page is not built — both are carried into P6, where plans become real.
  The README has a v3 banner and corrected sections but its full rewrite is P8.

- **P3 done** — `a1a31e2` "v3 phase 3: AI provider layer and job queue".
  Built: AES-256-GCM secret box, credentials repository + CRUD routes, four adapters
  (`anthropic-api`, `openai-api`, `claude-cli`, `codex-cli`) plus the deterministic
  `MockProvider`, `AiService` (concurrency cap of 2, jittered retries, `ai_calls` audit on every
  attempt), SQLite job queue + `JobWorker`, the `credential.verify` handler, model settings, and
  the Admin → AI connection page with the §8.1 policy warnings and the acknowledgement gate.
  Verified: 128/128 tests (26 new) · typecheck clean · `content:check` 0 errors · build clean.
  Security tests that matter: the secret appears in no response body, no database row and no audit
  entry; a tampered ciphertext fails to open; a subscription credential is refused without the
  acknowledgement even by a hand-crafted request; `provider: "mock"` is rejected by the API.
  Verified from installed sources (full notes in `docs/PROGRESS.md`): Anthropic
  `output_config.format`, OpenAI `response_format.json_schema`, `z.toJSONSchema`, the real
  `Model` union used for the suggested defaults.
  Decision: `providerFor` returns the mock when one is configured — a test caught that
  verification was otherwise building a real client and making live HTTPS calls during `npm test`.
  **Known gaps:** the `claude` and `codex` CLIs are not installed here, so those two adapters are
  written to the documented interface but have never been executed.

- **P4 done** — `88e220a` "v3 phase 4: assessment generation".
  Built: `shared/assessment.ts`, the three prompt files (with §9.2's item rules verbatim from one
  shared constant), the manifest/area digests, `validateGeneratedItem` + `verifyCodeItem`, the
  `assessment.blueprint` job, admin issue/list/pool/cancel routes, the admin pool preview page and
  the assessment section on the learner page, three sample learner profiles, `npm run dev:seed`,
  and `notify.ts`.
  Verified: 147/147 tests (19 new) · typecheck clean · `content:check` 0 errors · build clean ·
  `npm run dev:seed -- --issue` generates a ready assessment for all three sample learners.
  P4 acceptance (§17): all three reach `ready` with **6 areas and 78 kept items** (bar: ≥5 areas,
  ≥25 items); every kept item's topic tags are real; kept code items' reference solutions are
  re-run in the sandbox and pass while their starters fail; dropped items all carry a reason, and
  both rejection paths (unknown topic id, critic disagreement) fire on every run.
  Decision: the `MockProvider` gained hand-built fixtures for the four pipeline call shapes
  ("blueprint", "items", "explain_items", "critic" are reserved names). Generic synthesis is
  shape-valid but not semantically valid, so every item would be dropped and the run would prove
  nothing. A fixture that no longer matches its schema is a loud error, not a silent fallback.
  **Known gap:** the three sample results are identical, because the fixture does not vary by
  profile. Whether a blueprint genuinely reflects a particular set of notes can only be judged
  with a real credential — that is the first thing to check once one is added.

- **P5 done** — `f741112` "v3 phase 5: proctored assessment".
  Built (server): the adaptive selector, server-authoritative timing, the integrity rules
  (cooldown, soft→hard escalation, termination), the test-taking API, snapshot storage behind an
  authenticated route with a path-traversal check, the SSE live feed, and the minute sweeper.
  Built (client, proctor engine delegated to a subagent and integrated here): `types.ts`,
  `browserSignals.ts`, `cameraDetectors.ts`, `useProctor.ts`, `warnings.tsx`, `PreFlight.tsx`,
  plus `ItemRunner`, `AssessmentPage` and `docs/PROCTORING_TEST.md`.
  Verified: 208/208 tests (61 new) · typecheck clean · `content:check` 0 errors · build clean.
  Subagent's verified MediaPipe facts: `detectForVideo` is synchronous and needs strictly
  increasing timestamps; `Matrix.data` is a flat **column-major** array, so yaw/pitch come from a
  YXZ decomposition with a runtime layout check (a transposed rotation would silently swap them).
  Decisions made by the subagent and kept: copy and cut share one signal type so a Ctrl+C/Ctrl+X
  pair is one strike; right-click and text-selection are *split* because `selectstart` is noisy
  and would otherwise escalate on ordinary reading; sustained rules fire once per episode; a
  rAF-gap guard stops a backgrounded tab returning as an 8-second "no face".
  **Known gap:** the camera signals themselves have never been run against a real camera and a
  real person. `docs/PROCTORING_TEST.md` is the checklist for that.
- **P6 done** — `a3e9176` "v3 phase 6: evaluation, learning plans and the admin views".
  Built: the evaluation prompt and job, rubric grading of written answers, `planValidation.ts`
  (drop unknown, dedupe, curriculum order within AI module order, prerequisite fill, minimum size,
  starter-plan fallback), `/api/me/evaluation`, the learner `/plan` page, the admin evaluation
  view, plan diff against the AI version, integrity timeline with snapshots, and the live board.
  Verified: 14 new tests including a full round trip — generate → take → submit → evaluate →
  publish → the learner's filtered manifest matches the published plan exactly. A terminated
  assessment still produces a flagged plan (§18 answer 2).
  **Known gap:** every AI judgement in P4-P6 is the mock's. Whether a real model writes a good
  blueprint or a sensible plan is untested.

## Out-of-band work (not in the original phase list)

- **Renamed the platform to Oyelearn** (`64538e0`), then applied the supplied logo kit and the
  Oyelabs blue colour system (`e4d8912`). `primary`/`ring` are now `brand-600` #2067D3
  (`brand-400` #5F93E3 on dark); the trail accents stay, because they identify tracks and progress
  states rather than the brand. Sora replaced Space Grotesk, self-hosted via @fontsource.
  `scripts/woff2ttf.mjs` converts it for the certificate PDF.
  The GitHub remote is still named `Oyelabs-Trails`; renaming it is Abhishek's call.
  `docs/TRAILS_V3_BRIEF.md` keeps its filename on purpose — the build instructions point at it.
- **Deployment verified for real** (`4e40142`). Built the production image and ran it: 286 MB,
  isolated-vm loads, 350 topics, /api/health green, login works, CSP applied, the
  must-change-password gate holds. Two bugs fixed in the process:
  - **`.dockerignore` was missing**, so `COPY . .` overwrote the Linux `node_modules` with the
    host's. On a Windows or macOS checkout that produces an image whose native binaries cannot
    load. It also copied `data/` (database + dev keys) into the build stage.
  - `.vercelignore` was `*`, so a still-connected Vercel project failed with
    "vite: command not found". `vercel.json` now fails with a message explaining that v3 needs a
    persistent disk and a long-running process. **Vercel cannot host v3** — tell Abhishek to
    disconnect the project.
- **`npm run dev:password -- <username>`** added (`45671da`): the first-boot superadmin password is
  printed once and stored nowhere, so a dev database that outlives its terminal had no way back in.

## Blocked / needs Abhishek

- **Real AI credential.** No `ANTHROPIC_API_KEY` in the build environment, so every AI path was
  built and tested against the deterministic `MockProvider`. Add a real credential in
  Admin → AI connection and re-run the P4/P6 verification before trusting live output. The mock
  is only ever constructed outside production, and the admin page shows a banner while it is in
  use.
- **CLI adapters never executed.** Neither the `claude` nor the `codex` CLI is installed in this
  environment. `server/src/ai/adapters/claudeCli.ts` and `codexCli.ts` are written to the
  documented interfaces and their error handling and redaction are covered, but the actual
  invocation, the JSON envelope shapes and the token-usage fields need one live run each on a
  machine that has the CLIs. The Anthropic and OpenAI API adapters are the recommended path and do
  not have this caveat.
