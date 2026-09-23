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

- [ ] P0 Foundations — `server/` + `shared/` scaffold, Fastify, Drizzle + migrations, dev script, `/api/health`, Vite proxy
- [ ] P1 Auth — users, sessions, seed superadmin, login/change-password, guards, AuthProvider, admin onboarding, audit log
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
  paths the prompts reference. Created this file.

## Blocked / needs Abhishek

- **Real AI credential.** No `ANTHROPIC_API_KEY` in the build environment, so every AI path was
  built and tested against the deterministic `MockProvider`. Add a real credential in
  Admin → AI connection and re-run the P4/P6 verification before trusting live output.
