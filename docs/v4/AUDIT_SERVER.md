# Oyelearn v4 — server audit

Scope: `server/src/**`, `server/drizzle/**`, `shared/**`, deploy files. Snapshot of `main` @ `8d1c6b0` (2026-10-02).
No source was modified. Line numbers are as of this commit.

Size: 103 non-test `.ts` files under `server/src` (~30k lines incl. tests); 32 server test files, 3 shared, 16 client.

---

## 1. Data model

### 1.1 Migrations and boot

- Drizzle schema: `server/src/db/schema.ts` (1036 lines, 35 tables). Conventions: ULID text ids, epoch-ms integer timestamps, JSON = `text({mode:"json"})` + zod on read/write in repos.
- `server/src/db/index.ts`
  - `migrationsFolder()` (l.22) probes `server/drizzle`, `dist-server/drizzle`, `cwd/server/drizzle`.
  - `openDb()` (l.48): pragmas `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000`, `synchronous=NORMAL`; then `migrate(db, {migrationsFolder})` **on every boot** unless `runMigrations:false`. Tests use `:memory:`.
- Migrations in `server/drizzle/` (journal in `meta/`):

| File | Change |
|---|---|
| 0000_steady_oracle | ai_calls, ai_credentials, ai_settings, assessment_items, assessments, audit_log, certificates, evaluations, integrity_events, jobs, learner_profiles, learning_plans, notifications, sessions, topic_attempts, topic_progress, users |
| 0001_luxuriant_baron_strucker | assessments + awaiting_approval_since, approved_at, approved_by |
| 0002_bored_ben_urich | generation_log |
| 0003_long_blockbuster | assessments + label |
| 0004_clever_rocket_racer | courses, course_sections, course_topics, course_assignments, course_progress |
| 0005_lean_genesis | ai_audit_log, course_sources, generated_courses, learner_priorities, learning_paths, path_items, skill_gaps; course_topics + practice, test; courses + origin |
| 0006_smiling_carlie_cooper | research_settings |
| 0007_thankful_malcolm_colcord | assessment_consents |
| 0008_weekly_plan | weekly_plans, weekly_plan_items; learner_priorities + hours_per_week, days_per_week, week_starts_monday |
| 0009_learner_targets | learner_targets; learner_profiles + track, stack, self_level |
| 0010_path_parts | path_items + part_number, part_type |
| 0011_path_notice | learning_paths + notice |
| 0012_path_target | path_items + target_skill, start_level |

### 1.2 Tables (JSON columns marked `{json}`)

**Accounts**
- `users` (l.23): id, username (lowercase, unique), display_name, password_hash, role (`superadmin|admin|learner`), status (`active|disabled|archived`), must_change_password, failed_logins, locked_until, created_by, created_at, last_login_at.
- `sessions` (l.44): id (sha256 of token), user_id→users cascade, created_at, expires_at (sliding), absolute_expires_at, last_seen_at, ip, user_agent.
- `learner_profiles` (l.63): user_id PK→users cascade, role_title, years_experience, admin_notes, claimed_skills `{json ClaimedSkill[]}`, target_tracks `{json string[]}`, **track**, **stack** (free text), **self_level** (1–5), updated_at, updated_by.
- `learner_targets` (l.104): id, user_id→cascade, skill (free text), priority (`high|medium|low`), position (rank within priority), target_date (yyyy-mm-dd), created_at. Index (user_id, priority, position).

**AI config & audit**
- `ai_credentials` (l.126): id, provider (`anthropic-api|openai-api|claude-cli|codex-cli|mock`), label, secret_ciphertext/iv/tag (AES-256-GCM with APP_MASTER_KEY), secret_hint, status, last_verified_at, last_error, shared_use_acknowledged, created_by, created_at.
- `ai_settings` (l.150, singleton): active_credential_id, model_generation, model_evaluation, model_critic, monthly_budget_note (free text, **not enforced**), updated_at.
- `ai_calls` (l.160): id, credential_id, provider, model, purpose, subject_user_id, assessment_id, input_tokens, output_tokens, latency_ms, ok, error, created_at. **No cached-token, cost, course_id or task-id columns.**
- `ai_audit_log` (l.838): id, path_id→cascade, course_id→set null, step, prompt_version, model, detail `{json}`, input_tokens, output_tokens, actor_id, created_at (builder steps).
- `research_settings` (l.869, singleton): provider (`tavily|brave|serper`), search_* and youtube_* sealed keys + hints, budget_tokens (default 400 000 / run), budget_searches (default 60 / run), updated_by, updated_at.

**Assessment**
- `assessments` (l.189): id, user_id→cascade, attempt_no (unique per user), label, status (`generating|awaiting_approval|ready|in_progress|submitted|evaluating|…|terminated|failed`), blueprint `{json}`, config `{json}` (timeLimitMinutes, areas, selector state, pausedMs, currentItemId, currentItemExpiresAt, writtenSection), started_at, deadline_at, submitted_at, terminated_reason, hard_warnings, soft_warnings, consent_at, awaiting_approval_since, approved_at, approved_by, last_heartbeat_at, created_by, created_at.
- `assessment_items` (l.232): id, assessment_id→cascade, area, difficulty (1–5), kind (`mcq|multi|predict_output|find_bug|code|explain`), topic_ids `{json}`, payload `{json ItemPayload}`, key `{json ItemKey}` (server-only), critic_verdict `{json}`, status (`pool|served|answered|skipped|dropped`), drop_reason, served_at, answered_at, time_ms, response `{json}`, auto_score, ai_score, ai_feedback. **Items are per-assessment; there is no reusable bank.**
- `integrity_events` (l.267): id, assessment_id→cascade, user_id, type, severity (`soft|hard`), counted, details `{json}`, snapshot_path, client_ts, created_at.
- `evaluations` (l.291): id, assessment_id→cascade, result `{json EvaluationResult}`, model, created_at.
- `generation_log` (l.452): id, assessment_id→cascade, seq, stage, level, message, input_tokens, output_tokens, elapsed_ms, created_at (≤400 lines/assessment).
- `assessment_consents` (l.905): assessment_id, user_id, permissions `{json}`, policy_version, ip, user_agent, created_at, updated_at.

**Plans & progress**
- `learning_plans` (l.309): id, user_id, version, source, assessment_id, topic_ids `{json}`, rationale `{json}`, published_at, published_by.
- `topic_progress` (l.331): PK(user_id, topic_id), status, best_score, attempts, completed_at, updated_at.
- `topic_attempts` (l.347): id, user_id, topic_id, kind, score, passed, answers `{json}`, code, created_at.
- `certificates` (l.367): id (OYL-…), user_id, track_id, learner_name, topic_ids `{json}`, plan_id, average_score, issued_at.

**Infra**
- `notifications` (l.389), `jobs` (l.406: id, type, payload `{json}`, status, attempts, max_attempts=3, run_after, locked_at, last_error, created_at, finished_at), `audit_log` (l.424: id, actor_id, action, target_type, target_id, details `{json}`, created_at).

**Courses (admin-authored + generated)**
- `courses` (l.487): id, title, summary, accent, audience (`everyone|assigned`), published, origin (`manual|generated`), position, created_by, created_at, updated_at. **No level, department, or skill link.**
- `course_sections` (l.515): id, course_id, title, summary, position.
- `course_topics` (l.537): id, section_id, course_id, title, body (markdown), video_id, video_title, links `{json}`, practice `{json}`, test `{json}`, est_minutes, position.
- `course_assignments` (l.581), `course_progress` (l.597).
- `generated_courses` (l.780): course_id, skill, user_id→set null, scope (`learner|global`), status (`draft|pending_review|published|rejected|needs_review`), review_score, review_detail `{json}`, prompt_version, approved_by, approved_at, created_at.
- `course_sources` (l.813): id, course_id, topic_id, url, kind, title, http_status, verified_at, dead_since.

**Builder / path**
- `learner_priorities` (l.626, one row/learner): user_id, target_role, must_have `{json {skill,weight}[]}` (legacy, replaced by learner_targets), skip `{json string[]}`, deadline_weeks, course_cap (5), auto_publish, hours_per_week (15), days_per_week (5), week_starts_monday, updated_by, updated_at.
- `skill_gaps` (l.666): id, user_id, assessment_id, skill, severity, evidence `{json}`, source, priority_score, skipped, created_at.
- `learning_paths` (l.696): id, user_id, assessment_id, status (`analysing|researching|writing|reviewing|ready|failed|budget_reached`), progress_note, failure_reason, notice, current, tokens_used, search_calls, created_at, completed_at.
- `path_items` (l.731): id, path_id, course_id, gap_id, position, source (`unlock|reuse|generated`), part_number, part_type (`track|ai_dev|general`), target_skill, start_level, reason.
- `weekly_plans` (l.948): id, user_id, week_number, start_date, end_date, budget_minutes, summary, roadmap_narrative, next_week_preview `{json}`, status (`active|completed|superseded`), source (`ai|rules|admin`), generated_by, created_at, completed_at.
- `weekly_plan_items` (l.1001): id, plan_id, topic_id, course_id, lesson_id, lane (`do_now|must_know|medium|low`), position, minutes, reason, source, depends_on `{json}`, status, carried_from, skip_count, pinned, completed_at.

### 1.3 Where learner focus data lives today (and who reads/writes it)

| Data | Storage | Written by | Read by |
|---|---|---|---|
| track (enum `frontend|backend|fullstack|mobile|devops|ai-ml|other`, `shared/targets.ts:33`), stack (free text), years, self_level | `learner_profiles.track/stack/years_experience/self_level` | `targets/repo.ts:setFocus` (l.118) via `PUT /api/admin/users/:userId/targets` (`routes/admin/builder.ts:99`); profile via `PUT /api/admin/users/:id/profile` | `getFocus` (`targets/repo.ts:45`) → blueprint prompt (`blueprintJob.ts:143`), `builder/run.ts`, `builder/parts.ts` |
| target_tracks (curriculum trails) | `learner_profiles.target_tracks` | onboarding / profile | `assessment/digest.ts:buildManifestDigest` (which modules get tested), plan fallback |
| ordered priorities (High/Med/Low + rank + date) | `learner_targets` | `setTargets` (`targets/repo.ts:63`, delete+reinsert in a tx) | blueprint prompt, `builder/run.ts:190-199` (overlays targets onto `mustHave` shape), `priorityPath.buildSpine` |
| must_have (legacy) | `learner_priorities.must_have` | `setPriorities` (`builder/repo.ts:48`) via `PUT /api/admin/users/:userId/priorities` | **still read by** `plans/weekly/generate.ts:147` → `buildWeek` (`plans/weekly/builder.ts:88`), `gapsFromPrioritiesOnly` (generate.ts:106), `week_plan` prompt (generate.ts:231), `scoring.ts:83/102/157` when not overlaid |
| skip list | `learner_priorities.skip` | both the priorities PUT and the targets PUT (write-through, `routes/admin/builder.ts:116`) | blueprint prompt ("Do not test"), `buildSpine`, `buildWeek` (`isSkipped`), scoring |
| hours/days per week, week start | `learner_priorities.hours_per_week/days_per_week/week_starts_monday` | priorities PUT; targets PUT writes hoursPerWeek | `plans/weekly/repo.ts:budgetFor` (l.48), `fitPrerequisites` |
| course_cap, auto_publish, deadline_weeks, target_role | `learner_priorities` | priorities PUT ("Course builder settings" form) | `builder/run.ts` (cap, autoPublish), gap prompt (targetRole) |
| weights | constants `WEIGHT_VALUE`, `AI_ONLY_WEIGHT=0.5` in `shared/builder.ts:38` | — | `builder/scoring.ts:priorityScore = severity × roleRelevance × weight` |
| research/search budget | `research_settings` (`builder/settings.ts`) | `PUT /api/admin/research` (superadmin) | `builder/run.ts:121-174` |

**Drift risk:** the targets form updates `learner_targets` but NOT `must_have`; the weekly plan builder reads only `must_have`. A learner whose priorities were set with the new targets form gets a week whose Do-it-now lane is driven by Parts 1/2 and stale/empty `must_have`, not by their targets. v4's single `learner_priorities(learner, skill, slider, order)` model fixes this.

---

## 2. API routes

Guards (`server/src/auth/guards.ts`): `requireUser` (any session), `requireActiveUser` (+ password changed), `requireStaff` (admin|superadmin), `requireSuperadmin`; hook forms `staffOnly`/`superadminOnly`. Admin route files are registered as encapsulated plugins (`app.ts:174-182`) with a file-level `preHandler`. Rate limits via `@fastify/rate-limit` (global:false, per route).

**Public / auth** — `routes/health.ts`, `routes/auth.ts`
- GET `/api/health` — none
- GET `/api/auth/me` — none (returns currentUser or null)
- POST `/api/auth/login` — none, 20/min/IP + per-account lock
- POST `/api/auth/logout` — session
- POST `/api/auth/change-password` — requireUser, 10/5 min

**Learner** — `routes/me.ts`, `routes/content.ts`, `routes/topics.ts` (all requireActiveUser)
- GET `/api/me/manifest`, `/api/me/courses`, `/api/me/path`, `/api/me/courses/:courseId`, `/api/me/progress`, `/api/me/evaluation`, `/api/me/notifications`, `/api/me/week`, `/api/me/plan`
- POST `/api/me/courses/topics/:topicId/complete`, `/api/me/progress/start`, `/api/me/notifications/read`, `/api/me/week/next` (**calls the model inline**, `me.ts:240`, not `rulesOnly`)
- GET `/api/content/modules/:trackId/:moduleId` (plan-filtered)
- POST `/api/topics/:topicId/attempt` (60/min; server-graded quiz/code via `content/grade.ts` + sandbox)

**Assessment (learner)** — `routes/assessment.ts` (requireActiveUser, owner check in `load()` l.482)
- GET `/api/me/assessment`; GET `/api/assessment/:id/status`
- POST/GET `/api/assessment/:id/consent`
- POST `/api/assessment/:id/start` (sets deadline)
- GET `/api/assessment/:id/next` (adaptive select)
- POST `/api/assessment/:id/items/:itemId` (answer; auto-scored inline)
- POST `/api/assessment/:id/heartbeat` (40/min)
- POST `/api/assessment/:id/events` (120/min, snapshot body limit)
- POST `/api/assessment/:id/submit`
- No server "run code" endpoint — run-visible-tests happens client-side (`src/lib/codeRunner.ts`, Web Worker), unlimited.

**Admin: users** — `routes/admin/users.ts` (staffOnly; `assertMayActOn` l.117: admins may act only on learners or themselves)
- GET `/api/admin/users`, GET `/api/admin/users/:id`
- POST `/api/admin/users` (onboard; creating staff = superadmin only)
- PUT `/api/admin/users/:id/profile`
- POST `/api/admin/users/:id/reset-password` (revokes sessions)
- POST `/api/admin/users/:id/status` (active|disabled|archived; revokes sessions if not active)
- GET `/api/admin/users/:id/export` (JSON download)
- DELETE `/api/admin/users/:id` — **superadmin**
- POST `/api/admin/users/:id/revoke-sessions`

**Admin: plans / week** — `routes/admin/plans.ts`, `routes/admin/week.ts` (staffOnly)
- GET/PUT `/api/admin/users/:id/plan`; GET `/api/admin/users/:id/progress`, `/attempts`; GET `/api/admin/audit`
- GET `/api/admin/users/:id/week`; POST `/api/admin/users/:id/week/regenerate` (inline model unless `rulesOnly`); PATCH `/api/admin/users/:id/week/items/:itemId`

**Admin: AI** — `routes/admin/ai.ts` (**superadminOnly**)
- GET `/api/admin/ai` (status + usageByPurpose), GET `/api/admin/ai/calls`
- POST `/api/admin/ai/credentials`, POST `/api/admin/ai/credentials/:id/verify`, DELETE `/api/admin/ai/credentials/:id`
- PUT `/api/admin/ai/settings` (active credential, 3 model overrides, budget note)

**Admin: builder** — `routes/admin/builder.ts` (staffOnly; research = superadmin)
- GET/PUT `/api/admin/users/:userId/priorities` (legacy "Course builder settings")
- GET/PUT `/api/admin/users/:userId/targets` (track/stack/level/targets + skip/hours write-through)
- GET `/api/admin/users/:userId/gaps`; POST `/api/admin/users/:userId/path` (enqueue path.build)
- GET `/api/admin/generated-courses`, GET `/:courseId`, POST `/:courseId/decision`, POST `/:courseId/promote` ("Save to library": scope→global, audience→everyone)
- GET/PUT `/api/admin/research` — **superadmin**; POST `/api/admin/research/check-links`

**Admin: courses** — `routes/admin/courses.ts` (staffOnly): GET/POST `/api/admin/courses`, GET/PUT/DELETE `/api/admin/courses/:courseId`, POST `/:courseId/sections`, PUT/DELETE `/sections/:sectionId`, POST `/sections/:sectionId/topics`, PUT/DELETE `/topics/:topicId`, POST `/:courseId/sections/order`, POST `/sections/:sectionId/topics/order`, PUT/GET `/:courseId/assignees`, GET `/:courseId/progress`.

**Admin: assessments** — `routes/admin/assessments.ts` (staffOnly): POST/GET `/api/admin/users/:id/assessments` (issue = enqueue `assessment.blueprint`; 409 if one in progress), GET `/api/admin/assessments/:id/generation-log`, `/pool`, `/evaluation`, `/answers`; POST `/:id/approve`, POST `/:id/items/:itemId/drop`, DELETE `/:id`.

**Admin: live/integrity** — `routes/admin/live.ts` (staffOnly): GET `/api/admin/live`, GET `/api/admin/live/stream` (SSE), GET `/api/admin/integrity/events`, GET `/api/admin/assessments/:id/integrity`, GET `/api/admin/snapshots/*`, POST `/:id/terminate`, POST `/:id/extend`.

**Admin: overview** — `routes/admin/overview.ts` (staffOnly): GET `/api/admin/overview`, GET `/api/admin/notifications`, POST `/api/admin/notifications/read`.

Totals: ~105 routes; superadmin-only = all of `/api/admin/ai/*`, `/api/admin/research` GET/PUT, DELETE user. Approve assessment is staff (not superadmin-only, despite comments).

---

## 3. AI calls

### 3.1 Plumbing

- `server/src/ai/service.ts` `AiService.generateJson()` (l.171) is the only entry point. Resolves active credential (`ai_settings.active_credential_id`), global `Semaphore(2)` (l.61), 3 attempts with exp. backoff+jitter on retryable `AiProviderError` (429/5xx/timeouts), writes one `ai_calls` row **per attempt** (`recordCall` l.229). On failure the row has 0 tokens.
- Adapters (`server/src/ai/adapters/`): `anthropicApi.ts` (SDK `messages.create`, `output_config.format = json_schema`, `maxRetries:0`), `openaiApi.ts`, `claudeCli.ts` (`claude -p --output-format json --model X`), `codexCli.ts`, `mock.ts` (dev default; `index.ts:46` uses mock unless production or `OYELEARN_MOCK_AI=0`).
- Every adapter does **one repair turn** on zod failure (re-sends the full conversation + issues list → doubles input cost on failure, `anthropicApi.ts:84`).
- **Model selection:** `request.model ?? provider.defaultModel(purpose)` → `ai_settings.model_critic` for `item_critic`, `model_evaluation` for `evaluation`, `model_generation` for everything else; fallback `SUGGESTED_MODELS` (`ai/types.ts:109`): anthropic = generation `claude-sonnet-5`, critic `claude-sonnet-5`, evaluation `claude-opus-5-5`. No call site passes `model`. Model IDs are hard-coded, not discovered from the API (verify `claude-sonnet-5` is a valid id).
- `max_tokens`: `DEFAULT_MAX_OUTPUT_TOKENS = 16 000` unless overridden. Timeout `DEFAULT_TIMEOUT_MS = 900 000` (env `AI_TIMEOUT_MS`), evaluation 480 000.
- **Prompt caching: not used anywhere** (no `cache_control` in repo). **Batch API: not used.** All calls are structured JSON (zod → JSON Schema via `ai/jsonSchema.ts`).
- Purposes (`shared/enums.ts:60`): `blueprint, item_critic, evaluation, verify, gap_analysis, course_match, course_plan, course_write, course_review, week_plan`. Item and explain batches are logged as `blueprint`, so usage cannot separate blueprint from item generation (generation_log does, by stage).

### 3.2 Call sites (system prompt sizes measured: chars → ~tokens at /4)

| # | Site | Purpose | Model (default) | max_tokens | Input est. | Output est. |
|---|---|---|---|---|---|---|
| A1 | `assessment/blueprintJob.ts:156` blueprint | blueprint | generation → Sonnet | 16k | sys 3 173 ch (~800) + profile/targets/notes (~400) + module list (16–30 modules × ~90 ch ≈ 400–700) + schema (~300) ≈ **1.9k** | areas 3–6 + summary ≈ **1k** |
| A2 | `blueprintJob.ts:226` item batch per area (3–6 areas, sequential; `requestItemBatch` up to 2 attempts) | blueprint | Sonnet | 16k | `ITEMS_SYSTEM` 2 633 ch (~660) + area topics (8 modules max; 30–80 topics × ~90 ch ≈ 0.7–1.8k) + strict item schema (~800) ≈ **3k** | ~15 items (3 per level × 5) incl. code/options/rationale ≈ **5k** |
| A3 | `blueprintJob.ts:296` explain batch (4 items) | blueprint | Sonnet | 16k | `EXPLAIN_SYSTEM` 1 338 ch + area list + ≤120 topic ids ≈ **1.3k** | **1.2k** |
| A4 | `blueprintJob.ts:443` critic per batch (areas + explain) | item_critic | critic → Sonnet | 16k | `CRITIC_SYSTEM` 1 826 ch (~460) + full serialized items (~5k) ≈ **5.5k** | ~120/item ≈ **1.8k** |
| E1 | `evaluateJob.ts:271` explain grader (1 batch) | evaluation | evaluation → **Opus** | 16k | 478 ch sys + 4 × (prompt+rubric+answer) ≈ **2.6k** | **0.6k** |
| E2 | `evaluateJob.ts:142` evaluation + plan | evaluation | **Opus** | 24k, 480 s | `EVALUATION_SYSTEM` 3 122 ch (~780) + ~30 items (prompt ≤1200 ch, answer, key) ≈ 9–11k + topic digest (relevant tracks: 140–360 topics × ~100 ch ≈ 3.5–9k) + profile/integrity ≈ **15–22k** | areas + plan.topicIds (≤400 ids) + summaries ≈ **5k** |
| B1 | `builder/run.ts:220` gap analysis | gap_analysis | Sonnet | 16k | `GAP_SYSTEM` 915 ch + evaluation + item outcomes + mustHave ≈ **6–8k** | **1.5k** |
| B2 | `builder/run.ts:490` match existing (per target) | course_match | Sonnet | 16k | 654 ch + ≤12 candidate courses ≈ **1.2k** | **0.2k** |
| B3 | `builder/pipeline.ts:115` course outline | course_plan | Sonnet | 16k | 1 316 ch + skill/evidence ≈ **0.8k** | 2–5 sections × 2–6 lessons + queries ≈ **2k** |
| B4 | `builder/pipeline.ts:299` write lesson (×N lessons, ~12) | course_write | Sonnet | 16k | 1 422 ch + ~5 sources × (url+title+500 ch snippet) + schema ≈ **1.9k** | lesson body + concepts + quiz ≈ **2.5k** |
| B5 | `builder/pipeline.ts:203` review | course_review | Sonnet | 16k | 831 ch + lesson summaries ≈ **1.8k** | **0.8k** |
| W1 | `plans/weekly/generate.ts:226` week revise | week_plan | Sonnet | **8k**, 45 s | `WEEK_PLAN_SYSTEM` 2 449 ch (~610) + ≤80 candidates (~2.4k) + mustHave/gaps/draft (~1k) + schema ≈ **4.4k** | lanes + summary + narrative ≈ **1.2k** |
| V | adapters `verify()` | verify | generation | 64 | tiny | tiny |

Week refine triggers: `week.refine` job after `ensureWeek` (`generate.ts:341`), admin regenerate (inline), learner `POST /api/me/week/next` (inline).

### 3.3 How usage is logged

- `ai_calls`: one row per attempt with provider, model, purpose, subject_user_id, assessment_id, input/output tokens, latency, ok/error. `usageByPurpose()` (`service.ts:281`) feeds `GET /api/admin/ai`.
- `generation_log`: per-stage tokens for assessment generation. `ai_audit_log` + `learning_paths.tokens_used` for builder runs (per-run budget enforced in `pipeline.ts` `Budget`).
- Missing for v4: cost (USD), cached-token counts, course_id on ai_calls, per-day/learner rollups, monthly budget enforcement (only a free-text note).

---

## 4. Token baseline

### 4.1 Local dev DB (`data/oyelearn.db`, opened read-only)

| provider | model | purpose | calls | ok | avg in | avg out | sum in | sum out |
|---|---|---|---|---|---|---|---|---|
| mock | mock-1 | blueprint | 7 | 7 | 1 447 | 512 | 10 126 | 3 584 |
| mock | mock-1 | item_critic | 6 | 6 | 1 262 | 512 | 7 570 | 3 072 |
| mock | mock-1 | week_plan | 1 | 0 | 0 | 0 | 0 | 0 |

- 14 rows total, **all mock**. Mock token counts = `user.length/4` input (excludes system prompt and schema), fixed 512/256 output (`mock.ts:61`) — useful only as a size check of the user portion: blueprint user ≈ 743 tok, item user ≈ 1 700 tok/area, critic user ≈ 1 262 tok (mock items are small).
- generation_log: blueprint 743/512, items 5 calls 8 499/2 560, explain 884/512, critic 6 calls 7 570/3 072. One assessment, status `failed`.
- `ai_credentials` has one `claude-cli` credential (verified); `ai_settings` model overrides all null → suggested defaults. `ai_audit_log`: 7 `generate` rows with 0 tokens (no research provider). 5 users (1 superadmin, 4 learners); 2 ready paths with 0 tokens.
- **There is no real-provider baseline.** The estimates below are derived from measured prompt templates + schema caps.

### 4.2 Estimates per operation

Prices (assumptions to verify): Haiku 4.5 $1/$5, Sonnet 5.5 $3/$15, Opus 5.5 $5/$25 per MTok. "Default today" = the model the code would pick with the anthropic-api adapter and no overrides.

| Operation | Calls | Tokens in | Tokens out | Default today | USD @ default | @ Haiku | @ Sonnet | @ Opus |
|---|---|---|---|---|---|---|---|---|
| (a) Assessment generated (5 areas: A1 + 5×A2 + A3 + 6×A4) | 13 | ~48k | ~37k | Sonnet (gen + critic) | **~$0.70** | $0.23 | $0.70 | $1.17 |
| (b) Assessment evaluated (E1 + E2) | 2 | ~21k | ~5.6k | **Opus** | **~$0.25** | $0.05 | $0.15 | $0.25 |
| (b′) + automatic path.build gap analysis + matches (B1 + 3×B2) | 4 | ~11k | ~2k | Sonnet | ~$0.06 | $0.02 | $0.06 | $0.11 |
| (c) Course generated (B3 + 12×B4 + B5; excl. match) | 14 | ~25k | ~33k | Sonnet | **~$0.57** | $0.19 | $0.57 | $0.95 |
| (d) Weekly plan refine (W1) | 1 | ~4.4k | ~1.2k | Sonnet | **~$0.03** | $0.01 | $0.03 | $0.05 |

Multipliers not in the table: repair turns (re-send = ~2× input of that call), `requestItemBatch` second attempt, `AiService` retries, and up to 60 search + YouTube API calls per course run. A typical onboarding (assessment + eval + path with 3 generated courses) ≈ **$2.70 at defaults**, ~75% of it output tokens. Output dominates, so prompt caching alone saves little; the v4 question bank (no generation per assessment) and Haiku for grading/matching are the big levers.

---

## 5. Assessment

### 5.1 Generation (`assessment/blueprintJob.ts`, job `assessment.blueprint`)
1. Load profile, `getFocus`, `getPriorities().skip`; `buildManifestDigest` (`digest.ts:39`) picks modules from `target_tracks` + fundamentals (`fe-js-core`, `fe-js-advanced`, `be-foundations`, `fe-html-css`) + name matches of claimed skills.
2. **A1 blueprint** → `blueprintSchema` (`shared/assessment.ts:94`): 3–6 areas (≤8 modules each, hypothesisLevel, rationale, section), `timeLimitMinutes` 10–39, `targetItemCount` 25–35. `sanitiseBlueprint` drops unknown module ids.
3. Per area sequentially: **A2 item batch** (`ITEMS_PER_LEVEL=3`, `MIN_USABLE_BATCH_ITEMS=3`, `MAX_BATCH_ATTEMPTS=2`); `splitItemBatch` keeps valid items, stores malformed as `dropped`.
4. **A4 critic** per batch (`critique()`, non-fatal on failure → `critic_verdict` null).
5. `storeItem` → `validateGeneratedItem` (`validateItem.ts:121`: topic ids known, option/index rules, plain-JSON tests, kind/difficulty rules) and for `code`: `verifyCodeItem` (l.254) runs reference solution (must pass all) and starter (must not) in the sandbox. `MAX_CODE_ITEMS = 3` per assessment.
6. **A3 explain batch** (4 items, `minUsable:1`) + critic.
7. `< MIN_SERVABLE_ITEMS (6)` → failed; else status `awaiting_approval` + notify staff.

### 5.2 Item shape (`shared/assessment.ts`)
- Generated: `generatedItemSchema` (l.126) kind, difficulty, topicIds 1–3, prompt ≤4000, options 3–6, correctIndices, expectedOutput, language, starterCode, functionName, referenceSolution, visibleTests ≤6, hiddenTests ≤8, rubric 2–6, maxChars, rationale.
- Stored: `ItemPayload` (l.195; learner-visible incl. `timeLimitSec`) / `ItemKey` (l.207; correctIndices, expectedOutput, hiddenTests, referenceSolution, rubric, rationale).
- Kinds: mcq, multi, predict_output, find_bug, code (**JS only**, prompt says so), explain.

### 5.3 Selection (`assessment/selector.ts`, pure)
- Staircase per area, areas grouped into 5 sections (`shared/sections.ts`): track_basics 30% / 10 min, high_targets 40% / 14, other_targets 20% / 8, ai_working 10% / 6, hands_on 1–3 tasks / 20 min. Target 25–35 items (TARGET 30).
- Start at difficulty 1–2 (`START_CEILING=2`), up after 2 correct (`CORRECT_TO_ADVANCE`), down after a miss, `unknown` ("I don't know") stops the climb without penalty. Stop rules: 3 correct or 2 wrong at a level, `MAX_ITEMS_PER_AREA=6`, `MAX_REVERSALS=2`. Code ≥0.5 counts correct. `provisionalLevel()` l.379.
- Strictly forward, one item at a time (`GET /next`); **no free navigation/back, no flagging.**

### 5.4 Timing
- Per-item timers: `TIME_LIMIT_SEC` (l.23): mcq 75 s, multi 90, predict_output 120, find_bug 120, code 360, explain 180; `config.currentItemExpiresAt` enforced server-side, timed-out items scored 0 (`routes/assessment.ts` finishItem ~l.590).
- Total: `deadline_at = start + (timeLimitMinutes + EXPLAIN_BUDGET_MIN 6) min`, `MAX_TOTAL_MIN = 45`. Re-checked on every request; sweeper auto-submits past deadline. Integrity pauses extend up to `MAX_PAUSE_PER_WARNING_MS=60s`; admin `/extend`.

### 5.5 Grading
- `assessment/gradeItem.ts:autoScoreItem` — no LLM: mcq/find_bug exact, multi all-or-nothing, predict_output normalised string compare, code = passed/total of visible+hidden tests in the sandbox, explain → null.
- `assessment/evaluateJob.ts` (job `assessment.evaluate`): **E1** LLM rubric grading of explain items (non-fatal), **E2** LLM evaluation (areas, levels, strengths, gaps, plan topicIds, learnerSummary) → `validatePlan` (`planValidation.ts:39`) / `fallbackPlan` → `publishPlan` → enqueue `path.build` (l.209).

### 5.6 Approval, sweeper, integrity
- `assessment/approval.ts`: `approveAssessment` (human) and `autoApproveDue` (after `AUTO_APPROVE_AFTER_MS = 5 min`).
- `assessment/sweeper.ts:sweepOnce` every 60 s (`index.ts:85`): expire in-progress past deadline → submit + evaluate; `checkHeartbeats` (30 s timeout → event); auto-approve. `requeueOrphanedEvaluations` at boot.
- `assessment/integrity.ts`: client posts `{type, severity}` (severity is **client-classified**); server applies `HARD_COOLDOWN_MS=10s`, soft escalation (3 same-type soft in 5 min → counted), `HARD_LIMIT=3` counted → status `terminated`. Snapshots stored under `DATA_DIR/snapshots`, served via staff route, 90-day retention (`maintenance/retention.ts`). Consent recorded in `assessment_consents` (`CONSENT_POLICY_VERSION`).

### 5.7 Sandbox (`server/src/sandbox/*`)
- `createSandbox()` (`index.ts`): `isolated-vm` (`IsolatedVmSandbox`, 128 MB isolate, 5 s timeout, runtime in `runtime.ts` exposing `__runTests`) — required in production; `WorkerSandbox` (worker_threads, not a security boundary) only in dev / `DEV_UNSAFE_RUNNER=1`.
- **JavaScript only.** No TS transpile, no Python/PHP/SQL/Java/Dart. Interface: `run({code, functionName, testCases, timeoutMs}) → {outcomes, passedCount, total, compileError, timedOut}` — function-call style tests, not stdin/stdout.
- Used by: content topic attempts, item validation at generation, item grading at answer time.

---

## 6. Courses & curriculum

- **Static curriculum bundle** `server/content/` (≈30 MB JSON): `registry.json` + `<track>/<module>.json`. 7 tracks, **67 modules, 715 topics** (frontend 16/179, backend 12/92, fullstack 5/22, ai-driven 6/30, php 14/178, mobile 7/107, devops 7/107). Generated by `npm run content:server` from `src/data`.
- `content/store.ts` `ContentStore.load()` (l.~120): reads all modules at boot to build `manifest`, `topicIndex`, `orderedTopicIds`; then an LRU of 8 modules re-read on demand. `content/filter.ts` strips answer keys (`toServedTopic`) and filters by plan; `content/grade.ts` grades topic attempts.
- **Admin-authored courses** (`courses/repo.ts`, `routes/admin/courses.ts`): courses → sections → topics (markdown body, one YouTube id, links, practice/test JSON), audience everyone/assigned, `course_assignments`, `course_progress`. `coursesFor()` l.95, `mayOpenCourse()` l.152.
- **AI course builder** (`server/src/builder/*`), job `path.build` (`jobs/handlers/buildPath.ts` → `runBuilder`, `builder/run.ts:179`):
  1. `gap_analysis` (B1) from the evaluation → `scoring.scoreGaps` (`severity × roleRelevance × weight`) → `replaceGaps` (`skill_gaps`).
  2. Spine: `priorityPath.buildSpine` (l.176) — admin targets in order are the spine; every High gets a course; assessment only sets `startLevelFor` (l.109); prerequisites attach under a target, `PREREQ_TIME_SHARE=0.2`, `fitPrerequisites` l.305; `assertSpine` checks invariants. `parts.planParts` only when there are no targets.
  3. For each item: `matchExisting` (B2, threshold `MATCH_CONFIDENCE_THRESHOLD=0.75`, ≤12 candidates) → unlock/reuse; else if research configured → `pipeline.buildCourse` (B3 plan → per lesson `gatherSources` (search) + `verifyLinks` (`research.ts:178`, host allow/block lists, gate detection) + `findVideo` (YouTube API, `pickVideo`: 5–60 min, ≥5k views, ≥10k subs) → B4 write → `citations.enforceCitations` (`MIN_REFERENCES=2`) → B5 review) under a per-run `Budget` (tokens/searches) → `persistCourse` (`repo.ts:290`) writes courses/sections/topics/course_sources/generated_courses, status published only if `autoPublish` and review passes.
  4. Without a research provider the run still finishes `ready` with matched courses and a `notice`.
- `builder/settings.ts`: research provider + sealed keys + budgets (`getResearchSettings`, `updateResearchSettings`, `researchClients`).
- **"Save to library"** = `POST /api/admin/generated-courses/:courseId/promote` (`routes/admin/builder.ts:275`): `generated_courses.scope='global', user_id=null`, `courses.audience='everyone'`. Sources live in `course_sources`. `links.check` job re-verifies weekly.
- No research-result cache: identical searches across learners/runs are repeated.

---

## 7. Weekly plan & path job

- `plans/weekly/generate.ts:generateWeek` (l.127): `gatherLibrary` (`candidates.ts:37`: published plan topics + openable course lessons, with `partNumber/partType` from the current path) → `priorities = getPriorities()` (legacy `must_have`!) → gaps from `skill_gaps` or `gapsFromPrioritiesOnly` → `buildWeek` (pure, `builder.ts:118`) → optional `revise()` (W1, `week_plan`) accepted only if `goodEnough` → `enforce` (`enforce.ts:46`) → `saveWeek`.
- Lane fill order (`builder.ts`): 1 carried-over (keeps lane, ignores budget) → 2 admin-pinned → 2b **Parts 1 and 2 of the path into `do_now`** (cap `doNowCeiling`) → 3 admin must-haves by weight (High→do_now, Medium→medium, Low→low) then assessment gaps (Medium/Low only, never do_now) → 4 prerequisites into `must_know` (≤25% budget, ≤6 items, ≤2 per item, lookback 6) → 5 filler in trail order → 6 shape/preview (3–5 titles).
- Budget: `hours_per_week × 60` minutes (`repo.ts:budgetFor`), within ~10%.
- `ensureWeek` (l.330) is rules-only then enqueues `week.refine` (`jobs/handlers/refineWeek.ts`, skips plans older than 10 min).
- `builder/parts.ts:planParts` (l.70): Part 1 "strengthen your current track" from up to 3 track gaps or `TRACK_FOUNDATIONS[track]` fallback (3–6 h); Part 2 "AI-driven development for <stack>" (3–5 h); 3+ by priority then severity; `assertPartOrder` l.194. Engineering-specific wording/foundations only.
- `buildPath.ts`: runs `runBuilder`; marks failed only if nothing was added and something failed.

---

## 8. User management (vs v4 Phase 9)

| v4 requirement | Today | Gap |
|---|---|---|
| Suspend/reactivate, archive/restore | `POST /users/:id/status` (`active|disabled|archived`), cannot target self | Exists. No "restore" semantic distinct from setting active. |
| Delete: superadmin only + typed username | `DELETE /users/:id` (`users.ts:297`) `requireSuperadmin` + `confirmUsername` match | Done |
| Optional export first | `GET /users/:id/export` (`deleteUser.ts:exportUser` l.159) | Done (separate call; UI must offer it) |
| Single-transaction cleanup | `deleteUserCompletely` (`admin/deleteUser.ts:46`) one `db.transaction`; snapshot files removed after commit | Done. Not cleared: `ai_calls.subject_user_id`, `ai_audit_log.actor_id`, `jobs.payload` userIds, `audit_log.target_id`. `learner_targets` goes by FK cascade. |
| Keep global saved courses | global `generated_courses` detached (user_id null) and kept; learner-scoped deleted | Done |
| Anonymised audit | actor_id nulled on prior rows, but the new `user.deleted` row stores **username + displayName** in `details` (`users.ts:338`) | Not anonymised; decide and fix |
| Bulk actions | none | Missing (no bulk endpoints) |
| Revoke sessions on every action | status≠active, reset-password, delete (rows deleted), explicit revoke | Missing on reactivation/profile/role changes (debatable), no bulk |
| Cannot delete self / last superadmin | both checked (last-superadmin first) | Done |
| Role change | no endpoint to promote/demote | Missing (needed to resolve "promote somebody else first") |

---

## 9. Jobs

- `jobs/queue.ts`: SQLite `jobs` table; `enqueue` (l.23), `claimNext` (l.47, conditional UPDATE), `completeJob`, `failJob` (backoff `5 s × 2^(attempts-1)`, max 3), `requeueStaleJobs` (15 min), `requeueAllRunning` at start.
- `jobs/worker.ts`: `JobWorker` polls every 1 s, **one job at a time** (sequential drain). A 5-minute assessment generation blocks every other job (week refine, path builds).
- Handlers (`index.ts:60`): `credential.verify` (`verifyCredential.ts`), `assessment.blueprint` (`blueprintHandler`), `assessment.evaluate` (`evaluateHandler`), `path.build` (`buildPath.ts`), `links.check` (`checkLinks.ts`, weekly interval), `week.refine` (`refineWeek.ts`).
- Timers outside the queue: sweeper 60 s, weekly link check, daily maintenance (snapshot retention + `VACUUM INTO` backup, keeps 14).

---

## 10. Tests

- Vitest (`vitest.config.ts`): node env, `pool: threads`, includes `server/**`, `shared/**`, `src/**` `*.test.ts`. 51 test files (32 server, 3 shared, 16 client pure-logic).
- `server/src/test/harness.ts`: `createTestApp()` (l.50) builds the real Fastify app on `:memory:` SQLite with migrations, a small test `ContentStore`, mock AI provider, worker sandbox; helpers `seedAdmin`, `login`, `as(session)` (cookies), `onboardLearner`, `adminSession`, `approveAssessment`, `publishPlanFor`, `activeLearner`. Routes tested via `app.inject` (no port).
- Current run (`npx vitest run`): **51 files passed, 853 tests passed, 0 failed**, 65 s.

---

## 11. Deployment

- `Dockerfile`: 2-stage `node:24-bookworm-slim`; build installs python3/make/g++ (isolated-vm), `npm ci`, fetch mediapipe, `npm run build`, `content:check`, prune. Runtime optional `INSTALL_CLAUDE_CLI`/`INSTALL_CODEX_CLI`, `/data` volume, user `node`, port 8787, healthcheck `/api/health`, `CMD node dist-server/index.js`.
- `docker-compose.yml`: one service `oyelearn`, `env_file: .env`, bound to `127.0.0.1:8787`, volume `oyelearn-data:/data`, `mem_limit: 2g`, `no-new-privileges`. No sandbox sidecar.
- `Caddyfile.example`: TLS site, immutable caching for hashed assets, SSE route with `flush_interval -1`, reverse proxy to 127.0.0.1:8787, rolling logs.
- `.env.example`: NODE_ENV, PORT, HOST, DATA_DIR, PUBLIC_ORIGIN, APP_MASTER_KEY, SESSION_SECRET, SUPERADMIN_USERNAME/PASSWORD, INSTALL_*_CLI, AI_TIMEOUT_MS, SNAPSHOT_RETENTION_DAYS, DEV_UNSAFE_RUNNER. No AI key env vars (credentials live encrypted in DB).
- `docs/DEPLOY_BRIEF.md` (274 lines) summary:
  - Deploying onto a server already running another project; steps that can break it are marked STOP.
  - Single Fastify process serving SPA + API; needs a persistent disk and long-running process (SQLite WAL, snapshots, job worker, SSE, nightly backups, isolated-vm). Not Vercel/serverless.
  - Container contract, build needs native toolchain; env table; HTTPS mandatory (camera + secure cookies).
  - Coexistence: survey ports/proxy first, integrate into existing reverse proxy, bind to localhost, unique names, firewall unchanged.
  - Deploy: `.env` with master key/secret/origin, `docker compose up -d --build`, read the one-time superadmin password from logs.
  - Verification checklist, operations (backups, logs, upgrades), known gotchas, post-deploy admin setup (AI credential, research keys).

---

## v4 gaps & reuse notes

### Phase 2 — Departments
- Reuse: `learner_profiles` (add `department_id`, keep `track`), `shared/targets.ts:learnerTrackSchema` → replace enum with `tracks` table rows; content registry already has 7 tracks (all engineering).
- Missing: `departments`, `tracks`, `skills` (aliases, tags, level band, prereqs), course↔skill link, `courses.level`, department filters in admin list routes (`lib/tableSpecs.ts` / `tableQuery.ts` are the place), `/api/admin/departments` CRUD. Migration to put existing learners in Engineering mapping `learner_profiles.track`. `TRACK_FOUNDATIONS` and Part-2 wording in `builder/parts.ts` are engineering-only.

### Phase 3 — Simplified setup with priority sliders
- Reuse: `PUT /api/admin/users/:userId/targets` (already one form for track/stack/level/targets/skip/hours) and `learner_targets` (has `position`); `priorityPath.buildSpine/assertSpine` already implement "admin targets are the spine, assessment sets start level, prereqs ≤20%"; tests in `priorityPath.test.ts`.
- Missing: slider 1–5 (Optional…Critical) column + mapping to high/medium/low; skill FK instead of free text; `learner_skip` table; pending-skill request flow; removal of `GET/PUT /priorities` and migration of `must_have`/`skip`/hours/cap/autoPublish/deadline into the new model. **Fix the drift first:** `plans/weekly/generate.ts:147` and `scoring.ts` read `must_have`, not targets.

### Phase 4 — New assessment format (18 coding + 7 MCQ, 50-min cap, 3-run limit, multi-language)
- Reuse: assessment lifecycle/statuses, consent, integrity, heartbeat, sweeper deadline auto-submit (`sweeper.ts:28`), approval gate, `gradeItem.ts` code partial credit (`passed/total`), `verifyCodeItem`, `ItemPayload/ItemKey` split, "I don't know" (`Outcome = unknown`).
- Change: `MAX_TOTAL_MIN=45`→50 hard cap, drop per-item `TIME_LIMIT_SEC`/`currentItemExpiresAt`, replace adaptive one-at-a-time `GET /next` with a fixed assembled set + free navigation (new `GET /items`, `PUT /items/:id` autosave, flags), `MAX_CODE_ITEMS=3`→18, section weights (60/25/15 instead of 40/20+30/10).
- Missing: `POST /api/assessment/:id/items/:itemId/run` with a server-enforced counter (new column e.g. `assessment_items.runs_used`, shared by MCQ snippet runs; auto-submit on 3rd), rate limit; sandbox language field + stdin/stdout or per-language harness; Piston/Judge0 sidecar in compose (none today; `sandbox/types.ts` interface can front it); TS transpile; per-skill results report; client-side paste whitelist (server only sees client-classified severity).

### Phase 5 — Question bank
- Reuse: `generatedItemSchema`, `validateGeneratedItem`, `verifyCodeItem` (run reference solution), critic prompt, `assessment_items` shape for per-sitting copies; job queue for gap-fill jobs.
- Missing: `question_bank` table (department, skill, track, language, type, difficulty, tests, options, rubric, est minutes, times_used, discrimination, status), deterministic assembler (replaces `blueprintJob` A1–A4 entirely → ~$0.70/assessment → ~$0), seen-item exclusion, seed scripts, `/api/admin/question-bank` CRUD, auto-retire on stats. The blueprint job can become the "fill bank gaps once" job.

### Phase 6 — AI router / cost control
- Reuse: `AiService.generateJson` is already a single choke point with semaphore, retries and `ai_calls` logging; `modelFor()`/`defaultModel()` is a 3-bucket router.
- Missing: per-task-type model map (10 purposes → table `ai_model_routes`), split `blueprint` purpose into blueprint/items/explain, model discovery via Models API at startup, `cache_control` on system prompts + schemas (adapter `anthropicApi.ts:52`), per-task `max_tokens` (today 16k default everywhere), Message Batches for bank seeding/course generation, `ai_calls` columns: cache_read/cache_write tokens, cost_usd, course_id, task; price table; `/api/admin/ai/usage` aggregates (per day/task/learner, per assessment/course); enforced monthly budget (80% warn, 100% pause non-urgent jobs — needs job priority/urgency in `jobs`). Default evaluation model is Opus today; v4 routes most of it to Haiku/Sonnet. Research result cache missing.

### Phase 7/8 — PM/BD curricula, path for all departments
- Reuse: content bundle format and `ContentStore`, builder pipeline, `planParts` (parameterise Part 1/2 per department), weekly builder (department-agnostic already except wording).
- Missing: PM/BD content, task-type items (rubric-graded, Haiku), department-aware `TRACK_FOUNDATIONS`/AI-part skill strings, worker concurrency (single sequential worker will bottleneck course generation queues).

### Phase 9 — User management
- Reuse: everything in §8 (delete, export, status, revoke).
- Missing: bulk endpoints (status/revoke/delete with per-item results), anonymise the `user.deleted` audit details, null `ai_calls.subject_user_id` (or keep as opaque id by decision), role change endpoint, revoke sessions on reactivation/role change, explicit restore semantics.

### Other findings worth fixing along the way
- `POST /api/me/week/next` makes an inline model call (`me.ts:240`) — the same latency bug fixed for `GET /api/me/week`.
- Approve-assessment is staff-level although comments describe a superadmin gate.
- `SUGGESTED_MODELS` uses `claude-sonnet-5` / `claude-opus-5-5`; verify against the live Models API.
- Sequential job worker + `Semaphore(2)` means one learner's generation delays all other AI work.
