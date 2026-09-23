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
- [ ] P2 Content gating + progress — server content bundle, filtered manifest/content API, server quiz grading, sandboxed code verification, progress API, manual plan editor
- [ ] P3 AI layer — crypto box, credentials CRUD + UI, four adapters, verify, `ai_calls` audit, job queue, model settings
- [ ] P4 Assessment generation — blueprint → pools → critic → code validation; Issue assessment; admin pool preview
- [ ] P5 Test taking + proctoring — pre-flight, item runner, adaptive selector, detectors, warnings, SSE live view, termination
- [ ] P6 Evaluation + plans — explain grading, evaluation job, plan validation/publish, learner `/plan`, admin evaluation tab
- [ ] P7 Admin console polish — overview, people table, learner detail tabs, usage reports, retention job, backups
- [ ] P8 Deploy artifacts — Dockerfile, compose, Caddyfile.example, `.env.example`, README (artifacts only, no deploy)

## Curriculum Wave 1

### PHP & Laravel (`php`)
- [ ] php-foundations
- [ ] php-oop
- [ ] php-modern
- [ ] php-composer-psr
- [ ] php-web
- [ ] laravel-foundations
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

## Blocked / needs Abhishek

- **Real AI credential.** No `ANTHROPIC_API_KEY` in the build environment, so every AI path was
  built and tested against the deterministic `MockProvider`. Add a real credential in
  Admin → AI connection and re-run the P4/P6 verification before trusting live output.
