# Oyelearn v3 — Build Brief

> Hand this file to Claude Code together with `docs/CODEBASE_CONTEXT.md` (the v2 briefing) and the
> existing `CLAUDE.md`. v3 turns Trails from a client-only SPA into a small full-stack app with
> accounts, an AI placement assessment with proctoring, AI-assigned learning plans, a super-admin
> console, and a much larger curriculum.
>
> Everything in the v2 brief that this file does not change still holds: the trail metaphor, the
> design system, the content data contract (§5), the quality gate, and the content bar.

---

## 0. Rules for the builder (Claude Code)

1. Work **phase by phase** (§17). Finish a phase's acceptance criteria before starting the next one.
   Commit at least once per phase, with a message like `v3 phase N: <what>`.
2. Log every decision you make that this brief does not settle in `docs/PROGRESS.md` under a
   `## v3 decisions` heading.
3. **Never break the content pipeline.** `npm run content:check` must still pass with 0 errors after
   every phase.
4. **Topic ids stay permanent.** Do not rename existing ids. Progress rows reference them.
5. Verify library APIs against the installed version's docs before you use them, especially for
   MediaPipe, Anthropic SDK, OpenAI SDK, Codex CLI, Fastify, and Drizzle. Do not code from memory.
6. Windows is the dev machine (Git Bash). Scripts must work there. Linux (Docker) is production.
7. TypeScript strict everywhere, including the server. Share types and zod schemas through `shared/`.

---

## 1. Goals and non-goals

### Goals

- **Two roles.** `superadmin` has full access. `learner` accounts are created by the super admin
  with a username and password. There is no self-signup.
- **AI connection.** The super admin connects an AI provider from the dashboard. The server stores
  the credential encrypted, and every AI feature uses it.
- **Onboarding notes.** When onboarding a learner, the super admin writes free-text notes about them
  (what they know, how they perform, their background) and fills in a structured skills form.
- **Placement assessment.** On first login, the learner takes an AI-generated, adaptive placement
  assessment built from those notes plus the curriculum. The questions must discriminate between
  levels, not test trivia.
- **Proctoring.** During the assessment the app watches for:
  - copy attempts, tab switches, focus loss, and leaving fullscreen
  - camera signals: no face, multiple faces, looking away, a phone in frame, or the camera covered
    or stopped

  Soft warnings are logged. Hard warnings play a sound, and the third hard warning terminates the
  test. The super admin is notified live of every warning.
- **Evaluation and learning plan.** After submission, an async AI evaluation (target under 10
  minutes) combines the notes, the answers, timings and the integrity record. It produces a skills
  report and a **learning plan**: the subset of existing curriculum topics this learner must
  complete, in order.
- **Restricted view.** Learners can see and study **only** their assigned topics. Progress is stored
  on the server.
- **Super-admin visibility.** The super admin sees everything about everyone: notes, assessment,
  every answer, integrity events with snapshots, the AI evaluation, the plan, progress, and
  attempts. The super admin can edit plans and re-issue assessments.
- **Bigger curriculum.** Add PHP/Laravel, mobile, and the other major development technologies at
  the existing content bar (§14).

### Non-goals (v3)

- Public signup, multi-tenant organisations, payments.
- Email or SMS notifications. In-app notifications are enough for now. Keep a notifier interface so
  email can be added later.
- Continuous video recording. Only event snapshots are stored (§10.6).
- A native desktop app. The browser cannot block OS screenshots, and §10.7 says so honestly.

---

## 2. Decisions made up front

| # | Decision | Why |
|---|---|---|
| D1 | **Fastify + Drizzle ORM + better-sqlite3**, in `server/` in the same repo | Small, fast, typed. SQLite is enough for an internal team. Drizzle keeps a path to Postgres later. |
| D2 | **Password hashing: `@node-rs/argon2`** (argon2id) | Prebuilt binaries, so there is no native build pain on Windows. |
| D3 | **Sessions: opaque session id in an `httpOnly`, `SameSite=Lax`, `Secure` (prod) cookie**, stored in SQLite | Simpler and revocable, unlike JWT for a same-origin app. |
| D4 | **One Node process serves `/api/*` and the built SPA** in production. In dev, Vite proxies `/api` to `:8787`. | One deployable. Same origin, so no CORS. |
| D5 | **Deploy to a VPS with Docker and Caddy, not Vercel** | SQLite, snapshot files and a background job loop need a persistent disk and a long-running process. Vercel serverless has neither. `vercel.json` gets retired. |
| D6 | **Module content moves behind the API** (§7) | Today every content chunk ships to the browser. "A learner can only view assigned topics" and "answer keys stay secret" are impossible unless the server serves content filtered per user. |
| D7 | **Quiz grading moves to the server.** Quiz answer keys never reach the learner. | Same reason as D6. |
| D8 | **AI provider layer with adapters.** The default and recommended adapter is an **Anthropic API key**. Supported adapters: Anthropic API key, OpenAI API key, Claude Code CLI with a subscription token, Codex CLI with ChatGPT `auth.json`. | See §8.1 for the policy constraints on subscription tokens. |
| D9 | **Structured AI output only**: a JSON schema, validated with zod, with one automatic repair retry. The adapter fails loudly on bad output. | The assessment and plan must be machine-checkable. |
| D10 | **SQLite-backed job queue** (a `jobs` table plus an in-process worker loop) | Blueprint generation and evaluation run asynchronously and survive restarts. No Redis needed. |
| D11 | **Proctoring runs in the browser with `@mediapipe/tasks-vision`**: FaceLandmarker for face count and head pose, ObjectDetector (EfficientDet-Lite, COCO labels) for "cell phone". `@tensorflow-models/coco-ssd` is a fallback if ObjectDetector is inadequate. | One package, WASM + GPU delegate, maintained by Google, runs locally with no video leaving the device. |
| D12 | **Server-sent events** for the admin's live integrity feed | One-way, simple, works through Caddy. |
| D13 | **Server-side hidden tests for assessment code items** run in `isolated-vm` in production (Linux). Dev on Windows may fall back to `worker_threads` with a timeout, behind a `DEV_UNSAFE_RUNNER=1` flag. | Assessment code tests must not ship to the client. |

---

## 3. Target architecture

```
Browser (React SPA, existing v2 app + new screens)
 ├─ /login, /change-password
 ├─ learner: /assessment (proctored), /plan, existing trail pages (filtered to plan)
 ├─ superadmin: /admin/* (people, onboarding, AI settings, live integrity, reports)
 └─ proctor engine (MediaPipe in-browser) ──► integrity events + snapshots ──┐
                                                                              │
Node (Fastify, :8787)                                                         ▼
 ├─ /api/auth/*           sessions, password change, rate-limited login
 ├─ /api/admin/*          users, notes, AI credentials, plans, reports, SSE feed
 ├─ /api/me/*             my plan, my progress, filtered manifest
 ├─ /api/content/*        module content filtered to the caller's plan, answer keys stripped
 ├─ /api/topics/:id/attempt   server-side quiz grading, code result recording
 ├─ /api/assessment/*     start, next-item, answer, heartbeat, events, submit
 ├─ job worker            blueprint.generate, assessment.evaluate, credential.verify
 ├─ AI provider layer     anthropic-api | openai-api | claude-cli | codex-cli
 └─ static               dist/ (SPA) with SPA fallback
        │
        ▼
 /data (persistent volume)
   oyelearn.db (SQLite, WAL)   snapshots/<assessmentId>/<eventId>.jpg   content/ (built module JSON)
```

---

## 4. Repo layout changes

```
learning path/
├─ src/                      existing SPA (adds: auth, admin, assessment, proctor)
│  ├─ api/                   typed fetch client (uses shared/ schemas)
│  ├─ features/auth/
│  ├─ features/admin/
│  ├─ features/assessment/
│  └─ features/proctor/      camera, detectors, event bus, warning UI, sound
├─ shared/                   zod schemas + TS types used by both sides
├─ server/
│  ├─ src/
│  │  ├─ index.ts            Fastify bootstrap, static serving, SPA fallback
│  │  ├─ db/                 drizzle schema, migrations, seed
│  │  ├─ auth/               argon2, sessions, guards (requireUser, requireSuperadmin)
│  │  ├─ routes/             auth, admin, me, content, topics, assessment, events(SSE)
│  │  ├─ ai/                 provider adapters, prompt builders, schemas, audit
│  │  ├─ assessment/         blueprint, item pool, adaptive selector, grading, evaluation
│  │  ├─ content/            loads built module JSON, filters by plan, strips keys
│  │  ├─ jobs/               queue + worker loop
│  │  ├─ crypto/             AES-256-GCM secret box
│  │  └─ sandbox/            isolated-vm runner (+ dev fallback)
│  └─ tsconfig.json
├─ scripts/content/build-server-content.mjs   NEW: emits module JSON for the server
├─ Dockerfile, docker-compose.yml, Caddyfile.example
└─ .env.example
```

`npm run dev` must start both the Vite app and the server (use `concurrently`).
`npm run build` builds the manifest, the SPA, the server, and the server content bundle.

---

## 5. Data model (Drizzle / SQLite)

All ids are `text` (ULID). All timestamps are integer epoch ms. JSON columns are `text` validated by
zod on read and write.

```
users
  id, username (unique, lowercase), display_name, password_hash,
  role ('superadmin'|'learner'), status ('active'|'disabled'),
  must_change_password (bool), created_by (users.id), created_at, last_login_at

sessions
  id (random 32 bytes, stored as sha256), user_id, created_at, expires_at,
  last_seen_at, ip, user_agent

learner_profiles
  user_id (pk), role_title, years_experience, admin_notes (text),
  claimed_skills json  -- [{ area: string, level: 1..5, note?: string }]
  target_tracks json   -- TrackId[] the admin wants the learner on
  updated_at, updated_by

ai_credentials
  id, provider ('anthropic-api'|'openai-api'|'claude-cli'|'codex-cli'),
  label, secret_ciphertext, secret_iv, secret_tag, secret_hint (e.g. "…a9F2"),
  status ('unverified'|'verified'|'failed'), last_verified_at, last_error,
  shared_use_acknowledged (bool), created_by, created_at

ai_settings (single row)
  active_credential_id, model_generation, model_evaluation, model_critic,
  monthly_budget_note, updated_at

ai_calls  (audit + attribution)
  id, credential_id, provider, model, purpose ('blueprint'|'item_critic'|'evaluation'|'verify'),
  subject_user_id, assessment_id, input_tokens, output_tokens, latency_ms, ok, error, created_at

assessments
  id, user_id, attempt_no, status
    ('generating'|'awaiting_approval'|'ready'|'in_progress'|'submitted'|'evaluating'
     |'completed'|'terminated'|'failed'),
  blueprint json, config json (time limit, warning limits, areas),
  started_at, deadline_at, submitted_at, terminated_reason, hard_warnings, soft_warnings,
  consent_at, created_by, created_at,
  awaiting_approval_since, approved_at, approved_by
  -- awaiting_approval was added after the original spec, at Abhishek's request: generation lands
  -- there rather than in ready, the superadmin approves, and the sweeper releases it anyway five
  -- minutes later. approved_by is null on an automatic release, which is how "nobody reviewed
  -- this" stays distinguishable from "someone approved it".

assessment_items
  id, assessment_id, area, difficulty (1..5), kind
    ('mcq'|'multi'|'predict_output'|'find_bug'|'code'|'explain'),
  topic_ids json, payload json (what the learner sees),
  key json (server-only: correct indices, expected output, hidden tests, rubric),
  critic_verdict json, status ('pool'|'served'|'answered'|'skipped'|'dropped'),
  served_at, answered_at, time_ms, response json, auto_score (0..1|null), ai_score, ai_feedback

integrity_events
  id, assessment_id, user_id, type, severity ('soft'|'hard'), counted (bool),
  details json, snapshot_path, client_ts, created_at

evaluations
  id, assessment_id, result json (§11 schema), model, created_at

learning_plans
  id, user_id, version, source ('ai'|'admin'), assessment_id,
  topic_ids json (ordered), rationale json, published_at, published_by

topic_progress
  user_id, topic_id, status, best_score, attempts, completed_at   (pk: user_id+topic_id)

topic_attempts
  id, user_id, topic_id, kind ('quiz'|'code'), score, passed, answers json, code text, created_at

notifications
  id, recipient_id, kind, title, body, link, read_at, created_at

jobs
  id, type, payload json, status ('queued'|'running'|'done'|'failed'),
  attempts, max_attempts, run_after, locked_at, last_error, created_at, finished_at

audit_log
  id, actor_id, action, target_type, target_id, details json, created_at
```

Enable WAL mode and foreign keys. Add indexes on the lookup columns.

---

## 6. Auth and roles

- **Seed.** On first boot, if no superadmin exists, create one:
  - Username: `SUPERADMIN_USERNAME`, default `admin`.
  - Password: `SUPERADMIN_PASSWORD` from env. If that is missing, generate a 20-char random password
    and **print it once to the server log**.
  - Always set `must_change_password = true`. Document this in the README and `.env.example`.
    Never commit a real default password.
- **Password policy.** Minimum 10 characters. Reject the username itself and the 1,000 most common
  passwords (bundle a small list).
- **Login.** Rate-limit by IP and by username (`@fastify/rate-limit`). Lock the account for 15
  minutes after 8 failures. Always return a generic "invalid username or password".
- **Session.**
  - 12 h sliding expiry, with an absolute cap of 7 days.
  - Rotate the session id on login and on password change.
  - Logout deletes the row.
  - The superadmin can revoke all sessions of a user.
- **Onboarding a learner.** The superadmin enters a username, display name and temporary password
  (or has one generated), plus the profile (§5 `learner_profiles`). The learner must change the
  password on first login.
- **Guards.**
  - `requireUser` and `requireSuperadmin` on every route.
  - A learner hitting any admin route gets a 403.
  - A learner requesting unassigned content gets a 404 (not 403), so the route does not reveal that
    the content exists.
- **Client.**
  - An `AuthProvider` loads `/api/auth/me`, and route guards redirect accordingly.
  - Learner flow: `/change-password` if required, then `/assessment` if there is no completed
    assessment, then `/plan`.
  - The superadmin lands on `/admin`.
- **Audit.** Every admin mutation writes to `audit_log`.

---

## 7. Content gating and server-side progress

1. **Build step.** `build-server-content.mjs` reuses `scripts/content/load.mjs` to emit
   `server/content/<trackId>/<moduleId>.json` (the full module) during `npm run build`. The SPA
   **stops bundling module content**: remove the `import.meta.glob` loaders and point
   `loadModule()` at `GET /api/content/modules/:trackId/:moduleId`.
2. **Filtering.**
   - For a learner, the server returns only the topics in their latest published plan.
   - Each `quiz[]` question is stripped to `{ id, prompt, options, multi: boolean }`. There is no
     `correctIndex`, no `correctIndices` and no `explanation` until after they submit.
   - Code challenges keep `instructions`, `starterCode`, `functionName` and **visible** test cases.
     Mark the first half of the tests (at least 3) as visible and keep the rest hidden on the
     server.
   - The superadmin gets everything unfiltered.
3. **Manifest.** `GET /api/me/manifest` returns the manifest filtered to the plan: modules with zero
   assigned topics are omitted, and topics are pruned. The sidebar, trail maps, search, dashboard
   and neighbours (`topicNeighbors`) all operate on this filtered manifest. The superadmin sees the
   full one. Keep `manifest.generated.ts` for the superadmin and build tooling, but learners' UI
   must not import it directly.
4. **Quiz grading.**
   - `POST /api/topics/:id/attempt` with `{ answers }` returns
     `{ score, passed, perQuestion: [{ correct, correctIndices, explanation }] }`.
   - The 80% threshold is now enforced on the server.
   - Keep the seeded shuffle client-side. The server maps shuffled answers back to option indices,
     so send original option indices, not positions.
5. **Code grading.**
   - The learner runs visible tests in the existing Worker for fast feedback.
   - On submit, the server runs **all** tests (visible and hidden) in the sandbox (D13) and decides
     pass or fail.
6. **Progress.**
   - Replace `localStorage` persistence in `progressStore` with the API, and keep its action
     surface (`markInProgress`, `recordAttempt`, and so on) so components barely change.
   - Keep the "a later failed retry never un-completes a topic" rule on the server.
   - Keep the code drafts in `localStorage` (per user: `oyelabs-draft:<userId>:<topicId>`).
7. **Certificates.**
   - A learner's certificate unlocks when **their plan** is complete, not the whole track. It
     becomes a "plan certificate" per track touched.
   - Now that there is a server, store issued certificates and add a public
     `GET /verify/:certificateId` page.

---

## 8. AI layer

### 8.1 Providers and the credential policy

The super admin adds credentials on **Admin → AI connection**. Each card shows the provider, the
label, a masked hint, the status, "last verified", and **Verify / Set active / Delete**.

| Adapter | Secret the admin pastes | How the server calls it |
|---|---|---|
| `anthropic-api` **(recommended default)** | `sk-ant-api03-…` from a company Console account with a spending cap | `@anthropic-ai/sdk` Messages API, tool/JSON-schema output |
| `openai-api` | `sk-…` | `openai` SDK, JSON-schema structured output |
| `claude-cli` | the `sk-ant-oat01-…` token from `claude setup-token` | spawns the official `claude -p --output-format json` with `CLAUDE_CODE_OAUTH_TOKEN` in the child env only |
| `codex-cli` | the full contents of `~/.codex/auth.json` from `codex login --device-auth` | writes it to a private `CODEX_HOME` dir (mode 0700) and spawns `codex exec` in JSON mode |

**Policy notes. Show these in the UI and do not remove them.**

- **Claude subscription tokens.** Anthropic's Claude Code legal and compliance docs restrict
  Free/Pro/Max OAuth tokens to Anthropic's own apps. Anthropic does not permit routing requests
  through plan credentials on behalf of other users. Anthropic has enforced this server-side since
  early 2026, and doing it anyway risks the account.
  - **Build the `claude-cli` adapter behind an explicit acknowledgement checkbox** (the
    `shared_use_acknowledged` column).
  - Show the "everyone on this deployment shares this credential…" warning text.
  - Recommend the API key.
  - The adapter must surface the error "This credential is only authorized for use with Claude Code"
    clearly if Anthropic rejects the token.
- **Codex / ChatGPT `auth.json`.** OpenAI's docs call API keys the right default for automation.
  They treat `auth.json` like a password and position ChatGPT-managed auth for trusted runners.
  Apply the same acknowledgement and warning.
- **Shared credentials have two consequences.** All learners share one usage limit, so when it is
  hit, everyone stops at once. And the provider cannot attribute usage per person. Our own
  `ai_calls` table does the per-person attribution.

**Secret handling.**

- Encrypt secrets with AES-256-GCM using a 32-byte `APP_MASTER_KEY` from env. Refuse to start
  without it in production.
- Never return a secret to the client after save. Only the hint (last 4 characters) goes back.
- Never log secrets. Redact env from child-process error output.
- For CLI adapters, the secret lives only in the spawned process's env or its temp `CODEX_HOME`.
  Delete the temp dir after each call, or reuse a single locked dir.

**Verify.** Make a tiny structured call ("return `{ ok: true }`") and record the status, latency and
error.

### 8.2 Provider interface

```ts
interface AiProvider {
  id: ProviderId;
  generateJson<T>(req: {
    purpose: AiPurpose;
    system: string;
    user: string;
    schema: ZodType<T>;          // converted to JSON Schema for the provider
    model?: string;
    maxOutputTokens?: number;
    timeoutMs?: number;          // default 120_000; evaluation up to 480_000
    meta: { subjectUserId?: string; assessmentId?: string };
  }): Promise<{ data: T; usage: { input: number; output: number }; latencyMs: number }>;
  verify(): Promise<void>;
}
```

- **Output validation.** Validate with zod. On failure, send one repair turn containing the
  validation errors. If that still fails, throw an `AiOutputError`, record it in `ai_calls`, and
  fail the job with a visible reason.
- **Models.** Models are admin-configurable in `ai_settings`. Suggested defaults for Anthropic:
  `claude-sonnet-5` for generation and critique, and `claude-opus-5-5` for evaluation. Check the
  current model list at build time, and do not hard-code beyond defaults.
- **Retries.** Retry 429/5xx with exponential backoff and jitter, up to 3 times.
- **Concurrency.** Cap concurrent AI calls at 2 (a simple semaphore) so one shared credential is not
  hammered.

### 8.3 Job queue

- `jobs` table plus one worker loop (a 1 s tick). It claims a job with `UPDATE … WHERE status='queued'
  AND run_after<=now … RETURNING`.
- `max_attempts=3` with backoff. On boot, reset `running` jobs older than 15 min to `queued`.
- Job types:
  - `credential.verify`
  - `assessment.blueprint` (generate, critique, finalise the pool)
  - `assessment.evaluate` (evaluate, build the plan, publish, notify)
- Report status through `GET /api/assessment/:id/status` (the learner polls every 5 s) and through
  the admin SSE feed.

---

## 9. The placement assessment

### 9.1 Principles

- **Measure level, don't quiz trivia.** Items test understanding:
  - predicting output
  - picking the correct fix for a bug
  - choosing between approaches in a realistic scenario
  - explaining a tradeoff
  - writing a small function

  Recalling API names alone is not allowed.
- **Adaptive.** Items get harder while the learner succeeds and easier when they miss, per skill
  area, so the result places each area on a 1–5 level.
- **Grounded in our curriculum.** Every item is tagged with 1–3 real topic ids from the manifest.
  The server validates the tags and drops items with unknown ids. The level scale is anchored to
  the curriculum's `beginner / intermediate / advanced / expert` levels plus a 5th "can teach it"
  level.
- **No AI latency mid-test.** The whole item pool is generated **before** the learner starts.
  During the test, the server only selects items.
- **Secrets stay on the server.** Items are served one at a time, with no back-navigation. Answer
  keys, hidden tests and rubrics never leave the server.

### 9.2 Blueprint job (`assessment.blueprint`)

Queued when the admin clicks **Issue assessment**, which is the default at onboarding.

1. **Build the input:**
   - the learner profile (admin notes, claimed skills, years of experience, role, target tracks)
   - a compact manifest digest: for each module, its id, name, and the topic ids with titles and
     levels (only for tracks relevant to the target tracks and claimed skills, plus the
     fundamentals modules)
2. **AI call 1, the blueprint.** It returns:
   - `areas[]`: 5–9 skill areas. Each area has a name, the modules it covers, a hypothesis level
     (1–5) and a rationale taken from the notes.
   - Always include 1 fundamentals area, even if the notes skip it.
   - Include 1 "probe" area adjacent to the claimed skills, to find hidden strengths.
   - The time limit (default 60 min) and the target item count (25–40).
3. **AI call 2, per area (sequential, to respect the concurrency cap).** It generates a pool of
   items across difficulties 1–5, roughly 2–3 per level. Kinds by difficulty:
   - Difficulty 1–2: `mcq`, `multi`, `predict_output`.
   - Difficulty 3–5: `find_bug`, `multi`, `predict_output`, `code`. Include at most 1 `code` item
     per area and at most 3 in the whole test.
   - Also generate 3–4 `explain` items for the whole assessment. These are free-text, graded later
     by rubric, and placed at the end.
4. **AI call 3, the critic** (a different system prompt, and ideally the same or a stronger model).
   For each item it:
   - independently answers it
   - checks that exactly the keyed options are correct
   - checks for ambiguity, option-position references, leaked answers in the prompt, and trivia

   Items the critic disagrees with or flags are `dropped`. If an area/level cell drops to zero,
   regenerate that cell once.
5. For `code` items, run the reference solution against all tests in the sandbox. Drop the item if
   it fails. Also drop it if the starter code passes.
6. Set the status to `ready` and notify the admin.

**Item quality rules** (put these verbatim in the generation prompt):

- Code snippets are 25 lines or fewer, in a real language for the area (JS/TS, PHP, Python, SQL,
  Dart, Kotlin, and so on).
- Distractors are plausible mistakes a real developer makes, not jokes.
- Never refer to option positions ("A", "the first option"). Options are shuffled.
- One unambiguous correct answer for `mcq`. For `multi`, 2 or more correct but not all of them.
- `predict_output` has exactly one correct output string. Also include a normalisation rule (trim,
  collapse whitespace).
- Difficulty 4–5 items must require reasoning about an edge case, a tradeoff, performance, or
  failure behaviour.
- Each item carries `rationale`: what a correct answer demonstrates. Admins see this in the report.

### 9.3 Item payload schema (shared/)

```ts
type ItemKind = "mcq" | "multi" | "predict_output" | "find_bug" | "code" | "explain";
interface ItemPayload {           // sent to learner
  prompt: string;                 // same Markdown subset as content (RichText)
  options?: string[];             // mcq/multi/find_bug
  language?: string;              // for code blocks and code items
  starterCode?: string;           // code
  functionName?: string;          // code
  visibleTests?: { args: unknown[]; expected: unknown; description: string }[];
  maxChars?: number;              // explain (default 1200)
  timeLimitSec: number;           // per item: 90 mcq, 150 predict/find_bug, 600 code, 300 explain
}
interface ItemKey {               // server only
  correctIndices?: number[];
  expectedOutput?: string;
  hiddenTests?: { args: unknown[]; expected: unknown; description: string }[];
  referenceSolution?: string;
  rubric?: { point: string; weight: number }[];  // explain
  rationale: string;
}
```

### 9.4 Adaptive selection (server, per request, with no AI involved)

- **State per area:** the current level `θ` (initialised to the blueprint hypothesis, clamped to
  2..4), the items asked, and the number of reversals.
- **Visit order:** areas are visited round-robin, so fatigue is spread across them.
- **Next item:** pick an unserved `pool` item in the current area at difficulty `θ`. If none exists,
  take the nearest difficulty.
- **Scoring:** the item is auto-scored (mcq, multi, predict_output and find_bug are exact; code
  counts all tests passing as correct). Then:
  - A correct answer, or a partial score of 0.5 or more on a code item, gives `θ = min(5, θ+1)`.
  - Otherwise, `θ = max(1, θ-1)`.
  - A time-out counts as wrong.
- **An area stops** when it has had 6 items, or 2 reversals between the same two adjacent levels,
  or it runs out of items.
- **The test ends** when all areas are stopped, the item target is reached, or the deadline passes.
  Then serve the `explain` items (a separate 15-minute budget).
- **Provisional level:** the highest difficulty answered correctly at least twice, or answered
  correctly once plus a miss one level higher. Store it; the evaluation job refines it.
- **Time.** The server is authoritative for time. `deadline_at` is enforced on every request. The
  client timer is display-only.

### 9.5 Test-taking API

```
POST /api/assessment/:id/consent            (camera + monitoring consent, stores consent_at)
POST /api/assessment/:id/start              -> { deadlineAt, config }
GET  /api/assessment/:id/next               -> { item: {id, kind, payload}, progress } | { done }
POST /api/assessment/:id/items/:itemId      { response }  -> { accepted: true }   (no correctness!)
POST /api/assessment/:id/heartbeat          every 10s: { visible, fullscreen, faceState, cameraLive }
POST /api/assessment/:id/events             integrity event (+ optional snapshot, multipart, ≤150 KB)
POST /api/assessment/:id/submit
GET  /api/assessment/:id/status             learner polling during evaluation
```

- Never tell the learner during the test whether an answer was right.
- Reject answers to an item that was not the last one served, or that arrive after the item's time
  limit plus a 5 s grace period.

---

## 10. Proctoring

### 10.1 Pre-flight screen (before `start`)

1. **Consent.** Plain language:
   - what is monitored
   - that video is processed **on the device**
   - that only still snapshots are uploaded, and only when a warning fires
   - who sees them (the super admin)
   - how long they are kept (§10.6)

   Show "I agree" or "Cancel". This is needed under India's DPDP Act for employee monitoring, and it
   is also simply fair.
2. **Camera check.** `getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } })`. Show
   a preview. Require exactly 1 face, centred, for 3 s. Record a calibration head pose.
3. **Sound check.** Play the warning tone once. The learner confirms they heard it.
4. **Environment check.**
   - Desktop only: if the pointer is coarse or the viewport is under 1024 px, block with an
     explanation.
   - Warn if `screen.isExtended === true` (Window Management API, where supported). This is a soft
     warning at the start.
5. **Enter fullscreen** (`document.documentElement.requestFullscreen()`). Then call `start`.

### 10.2 Detectors (browser, `src/features/proctor/`)

**MediaPipe setup.**

- `FaceLandmarker` with `numFaces: 3` and `outputFacialTransformationMatrixes: true`, running in
  video mode at about 5 fps.
- `ObjectDetector` (EfficientDet-Lite0, `scoreThreshold 0.5`, `categoryAllowlist: ["cell phone",
  "book", "laptop"]`) at about 1 fps.
- Self-host the WASM and `.task` model files under `public/mediapipe/` rather than loading them from
  a CDN at test time.
- If the GPU delegate fails, fall back to the CPU.

**Debouncing.** Detection is noisy, so every camera signal needs a sustained-duration rule before it
becomes an event.

| Signal | Source | Rule | Severity |
|---|---|---|---|
| Tab hidden | `visibilitychange` → `hidden` | immediate | **hard** |
| Window blur | `blur` on window | lasting > 2 s (catches alt-tab and OS overlays) | **hard** |
| Left fullscreen | `fullscreenchange` | immediate; show a re-enter button and block questions until back | **hard** |
| Copy / cut attempt | `copy`, `cut` on document (preventDefault) | immediate | **hard** |
| Paste attempt | `paste` in the answer inputs (preventDefault; paste is allowed in code items only if the admin config enables it) | immediate | **hard** |
| PrintScreen key | `keyup` `PrintScreen` (clear the clipboard best-effort) | immediate | **hard** |
| Phone in frame | ObjectDetector "cell phone" | score ≥ 0.6 in 3 of the last 5 frames | **hard** + snapshot |
| Multiple faces | FaceLandmarker count ≥ 2 | sustained ≥ 3 s | **hard** + snapshot |
| No face | count = 0 | sustained ≥ 8 s | **hard** + snapshot |
| Camera lost | track `ended`/`mute`, or a black frame (mean luma < 12) sustained ≥ 5 s | immediate / sustained | **hard** |
| Heartbeat missing | server side: no heartbeat for 30 s during `in_progress` | server-created | **hard** |
| Looking away | head yaw beyond ±30° or pitch beyond ±25° vs calibration | sustained ≥ 4 s | soft (+ snapshot) |
| Book / laptop in frame | ObjectDetector | 3 of 5 frames | soft + snapshot |
| Right-click / text-selection attempt | `contextmenu`, `selectstart` (prevented) | immediate | soft |
| Mouse left window | `mouseleave` on document | lasting > 3 s | soft |
| DevTools heuristic | window outer/inner size delta | best-effort | soft |
| Extended display | `screen.isExtended` | at start or on change | soft |

**Escalation** (configurable per assessment):

- 3 soft warnings of the same type within 5 minutes become 1 hard warning.
- `hardLimit = 3`. The **third** counted hard warning terminates the test: the status becomes
  `terminated`, the answers so far are kept, evaluation still runs, and the report is flagged.
- Cooldown: the same hard type cannot count again within 10 s, so one alt-tab does not produce
  three strikes.

### 10.3 Warning UX

- **Hard warning.**
  - Show a full-screen modal: "Warning 2 of 3: you switched tabs. One more warning ends the
    assessment." It has an "I understand" button.
  - Pause the item timer while the modal shows. The server extends `deadline_at` by the pause,
    capped at 60 s per warning.
  - Play a tone generated with the Web Audio API (two 880 Hz / 660 Hz beeps, 0.25 s each), so there
    is no audio asset.
- **Soft warning.** Show a toast in the corner with a short chime, and no count.
- **Status strip.** A persistent strip shows: the camera thumbnail (mirrored, small), "Monitoring
  on", and a warnings counter (hard).
- **Deterrent watermark.** Draw the learner's name, username, assessment id and time as a faint,
  repeating diagonal watermark over the question area. It deters photographing questions and makes
  any leaked photo traceable.
- CSS `user-select: none` on item content, and a disabled context menu.

### 10.4 Event transport

- Send each event to `POST …/events` immediately. Snapshots are JPEGs taken from the video frame at
  320 px width, quality 0.7.
- If a request fails, queue the event in memory and retry. Include `client_ts`.
- The server:
  - validates the event
  - applies the cooldown and escalation rules authoritatively (the client count is display-only)
  - updates `hard_warnings`
  - pushes an SSE message to all connected superadmins
  - creates a `notifications` row
  - on the 3rd hard warning, terminates the assessment and responds with `{ terminated: true }`

### 10.5 Admin live view

- `/admin/live` lists the in-progress assessments with learner, progress, time left, the hard/soft
  counts, the last camera state, and the last events with snapshot thumbnails.
- The admin can **terminate** or **add 10 min** from there.
- The notification bell in the admin top bar shows unread warnings.

### 10.6 Storage and retention

- Store snapshots under `/data/snapshots/<assessmentId>/`. Serve them only to the superadmin
  (streamed through an authenticated route, never from a public static path).
- Retention defaults to 90 days, configurable. A daily job deletes expired snapshots and sets
  `snapshot_path = null`.

### 10.7 Limits, stated honestly in the admin UI

- A browser **cannot block OS screenshots**, screen-sharing tools, or a second device outside the
  camera's view. We detect the traces we can: focus loss, PrintScreen, a phone visible in frame, and
  looking away.
- Camera signals are probabilistic. Lighting, glasses and camera angle cause false positives. That
  is why they are debounced and why snapshots exist.
- **An integrity flag is evidence for a human, not a verdict.** The AI evaluation reports integrity
  separately and never downgrades skill scores on integrity alone. The super admin decides on
  re-testing.

---

## 11. Evaluation and the learning plan

### 11.1 The `assessment.evaluate` job

It is queued on `submit`, on `terminated`, or on deadline expiry (a sweeper job checks every
minute).

1. **Grade the `explain` items with an AI rubric** (batched): a score per rubric point, a total from
   0 to 1, and one line of feedback per item.
2. **Build the evaluation input:**
   - the profile
   - the blueprint
   - every served item with its payload, key, response, auto score, time taken and the level it
     tested
   - the per-area provisional levels
   - the integrity summary (counts by type, and whether the test was terminated)
   - the manifest digest for the relevant tracks, with topic id, title, level and module
3. **AI call.** The output must match this schema:

```ts
interface EvaluationResult {
  summary: string;                         // 4-8 sentences, for the admin
  overallLevel: 1|2|3|4|5;
  areas: {
    area: string; level: 1|2|3|4|5; confidence: "low"|"medium"|"high";
    evidence: string[];                    // cite item ids
    strengths: string[]; gaps: string[];
  }[];
  notesVsReality: string;                  // where admin notes and results agree/disagree
  integrity: { assessment: "clean"|"minor_concerns"|"serious_concerns"; explanation: string };
  plan: {
    topicIds: string[];                    // ORDERED; only ids from the digest
    skipRationale: { moduleId: string; reason: string }[];   // modules skipped as already mastered
    milestones: string[];                  // subset of topicIds to emphasise
    estimatedHours: number;
    rationale: string;
  };
}
```

4. **Server validation of the plan:**
   - drop unknown ids
   - dedupe
   - re-sort into curriculum trail order within each module, while keeping the AI's **module**
     order
   - add prerequisites: if the plan includes an advanced topic in a module, include that module's
     preceding topics at the same or lower level that the learner did not demonstrate mastery of
   - make sure it is non-empty (a minimum of 5 topics)
5. Store the evaluation. Create `learning_plans` version N with `source: "ai"` and publish it
   immediately. Notify the learner ("Your plan is ready") and the admin.
6. **Timing.** The job must finish well under 10 minutes. The learner sees an "Evaluating your
   assessment… this can take up to 10 minutes" screen that polls status. **Do not add artificial
   delay.**

### 11.2 Admin control of plans

- The plan editor lets the admin add or remove topics or whole modules, reorder modules, and
  publish, which creates a new version with `source: "admin"`. It shows a diff against the AI
  version.
- **Progress survives edits.** Completed topics stay completed even if they are removed from a plan.
- **Re-issue assessment** creates a new attempt (`attempt_no + 1`). The admin chooses whether its
  result replaces the plan or only appends missing topics.

---

## 12. Learner UX

- **First login:** change password, then the pre-flight (§10.1), then the assessment, then the
  "evaluating" screen, then **My plan**.
- **`/plan`:**
  - estimated hours
  - progress
  - a "continue" link to the next topic
  - the modules and topics in plan order, using the existing trail visuals over the filtered
    manifest
  - the AI summary written **for the learner**: strengths and focus areas. Do not show integrity
    details or the admin notes.
- **Existing pages** work unchanged on top of the filtered manifest and filtered content. The
  dashboard shows only the tracks that have assigned topics.
- **Search** covers only assigned topics.
- **Certificates** are per plan-track (§7.7).

---

## 13. Super-admin UX (`/admin`)

- **Overview:**
  - counts: learners, active, assessments in progress, awaiting evaluation, flagged
  - recent integrity events
  - AI status (the active credential, whether it is verified, and calls/tokens over the last 7
    days)
- **People.** A table with username, name, status, assessment status, overall level, plan
  progress %, hard warnings, and last active. It has filters and search.
- **Onboard learner.** A form covering the account, profile notes, claimed skills (an area picker
  plus a 1–5 slider), target tracks, and an **Issue assessment now** option.
- **Learner detail**, with these tabs:
  - **Profile:** edit notes and skills.
  - **Assessment:** every item with prompt, options, the learner's answer, the key, the score,
    time, difficulty, area and rationale. Also the adaptive path per area, drawn as a small chart of
    level over items.
  - **Integrity:** a timeline of events with snapshots.
  - **Evaluation:** the AI result in full.
  - **Plan:** the editor from §11.2.
  - **Progress:** per topic, with attempts and scores, and quiz answers and code submissions viewable.
  - **Account:** reset password, disable, revoke sessions.
- **Live** (§10.5).
- **AI connection** (§8.1). Also the model settings and a usage table from `ai_calls`, grouped by
  purpose and learner.
- **Curriculum.** Read-only browsing of all tracks, with no filter (the superadmin can study
  everything).
- **Audit log.**

Keep the v2 design system: trail tokens, typography, and the one-motion-moment rule. Admin tables
use plain, dense, readable layouts. Do not use generic dashboard templates.

---

## 14. Curriculum expansion

### 14.1 Principle

The same bar as v2: every topic has a verified embeddable video, 2–4 verified references with docs
first, a senior-level summary, and a hard challenge that passes `content:check`. **"Everything"
cannot be done in one pass at this bar.** The existing 293 topics were a large effort. Expand in
waves, prioritised by what Oyelabs actually delivers and hires for.

### 14.2 Registry and type changes

- Extend `TrackId`, `registry.ts`, `lib/track-meta.ts` (icons and 2-letter certificate codes), and
  `lib/certificate.ts`.
- Add new accent tokens in `index.css` for both themes, each with a text-safe `-strong` variant
  (4.5:1 or better), and check the contrast. Suggested terrain names: `canyon`, `moss`, `tundra`,
  `scree`, `alpenglow`, `lichen`. Pick hues distinct from the existing five.
- **Challenges in non-JS languages.** The code runner only executes JavaScript. For PHP, Dart,
  Kotlin, Swift, Java, Go and C#, topics use **quiz** challenges, including
  `predict_output`-style questions written as quiz items. JavaScript/TypeScript code challenges stay
  as they are. Record this as a v3 decision. A multi-language runner is a later project.
- `CONTENT_GUIDE.md` §10 (the current-facts sheet) gets a new section for each new technology.
  **Verify the current versions at authoring time.** Do not trust memory.

### 14.3 Waves (proposed; confirm with Abhishek before starting a wave)

**Wave 1: agency core**

- **PHP & Laravel** (new track `php`, code `PH`). Camps:
  - PHP Foundations
  - PHP OOP (classes, interfaces, traits, enums, readonly)
  - Modern PHP 8.x
  - Composer & PSR standards
  - PHP on the Web (sessions, PDO, SQLi/XSS/CSRF)
  - Laravel Foundations (routing, controllers, Blade, container, facades, request lifecycle)
  - Eloquent & Migrations (relationships, eager loading, N+1)
  - Laravel Auth & Authorization (starter kits, Sanctum, policies, gates)
  - Laravel APIs (resources, validation, rate limiting)
  - Queues, Events & Scheduling (Horizon, notifications)
  - Testing with Pest/PHPUnit
  - Laravel Ecosystem (Livewire, Inertia, Filament, Octane)
  - Deploying Laravel
  - WordPress Development (themes, plugins, hooks, REST API)
- **Mobile Development** (new track `mobile`, code `MO`). Camps:
  - Mobile Foundations (native vs cross-platform, lifecycle, store release)
  - React Native & Expo (deepen, and link from the existing `bonus-react-native`)
  - Dart Language
  - Flutter UI & State (widgets, Riverpod/Bloc, navigation, platform channels)
  - Kotlin & Jetpack Compose
  - Swift & SwiftUI
  - Mobile Cross-Cutting (offline/sync, push, deep links, auth, testing, CI/CD with EAS/Fastlane)
- **Frontend additions:** an Angular camp and a Svelte/SvelteKit camp.
- **DevOps & Cloud** (new track `devops`, code `DV`). Camps:
  - Linux & Shell
  - Networking, DNS & TLS
  - Reverse Proxies (Nginx, Caddy)
  - AWS Core (IAM, EC2, S3, RDS, Lambda)
  - Infrastructure as Code (Terraform)
  - Kubernetes in Depth
  - Observability (logs, metrics, traces, OpenTelemetry)

**Wave 2**

- **Java & Spring Boot** (`java`, `JV`): Java core, collections & streams, concurrency and virtual
  threads, JVM internals, Spring Boot core, Spring Data JPA, Spring Security, REST, testing,
  microservices.
- **CS Fundamentals** (`cs`, `CS`): data structures, algorithms, complexity, OS concepts,
  networking theory, SOLID and clean code, design patterns. This track is valuable for assessment
  anchoring.
- **QA & Test Automation** (`qa`, `QA`): test strategy, Playwright, Cypress, API testing, contract
  testing, performance testing (k6), accessibility testing.

**Wave 3**

- **Go** (`go`, `GO`)
- **.NET & C#** (`dotnet`, `DN`)
- **Ruby on Rails**, as a Backend camp
- **Message brokers** (Kafka, RabbitMQ), as a Backend camp

### 14.4 Process per module (unchanged from v2, restated)

1. Research the videos with `scripts/research/yt.mjs`. Never guess ids.
2. Check the references with `check-urls.mjs`.
3. Write `src/content/<track>/<module>.ts`, the solutions, and
   `docs/research-notes/<module>.md`.
4. Run `npm run content:check -- --module <id>` until it shows 0 errors.
5. Run `npm run content:embeds` and `content:videos`.
6. Commit with `content: <module name>`.

Use subagents to work several modules in parallel, but commit one module at a time.

**The assessment depends on the curriculum.** The blueprint can only place learners into topics
that exist. When a new track lands, it automatically becomes available to assessments through the
manifest digest.

---

## 15. Security checklist

- [ ] No answer keys, hidden tests, rubrics or other learners' data reachable by a learner. Write
      integration tests that assert this for every learner-facing route.
- [ ] All inputs validated with zod. Body size limits: 64 KB JSON, 200 KB snapshot.
- [ ] `@fastify/helmet`, with a CSP that allows only self, the MediaPipe assets (self-hosted), and
      the YouTube embed and thumbnail origins, plus the reference-preview iframe origins, which
      means `frame-src` needs the embeddable reference hosts. Derive the list from
      `embeds.generated.ts` or allow `https:` for `frame-src` only.
- [ ] Rate limits on login, events and answers.
- [ ] Secrets encrypted at rest. `APP_MASTER_KEY` and the session secret are required in production.
- [ ] Child processes (CLI adapters) get a minimal env, a timeout, and killed process trees.
- [ ] Snapshots and uploads are served only through auth-checked routes.
- [ ] SQLite backups: a nightly `VACUUM INTO` to `/data/backups`, keeping 14 (optionally Litestream
      later).
- [ ] The sandbox runs assessment code under `isolated-vm` with a memory limit and a timeout.

---

## 16. Deployment

- **`Dockerfile`** (multi-stage). Build with Node 24. The runtime image contains `node`, the
  `claude` CLI and the `codex` CLI (only if those adapters are used; make them build args), and
  runs as a non-root user. `VOLUME /data`.
- **`docker-compose.yml`:** the app service, with the `/data` volume, an env file, and a healthcheck
  on `GET /api/health`.
- **`Caddyfile.example`:** reverse proxy to `:8787` with automatic HTTPS. Disable buffering for SSE
  (`flush_interval -1`).
- **`.env.example`:** `APP_MASTER_KEY`, `SESSION_SECRET`, `SUPERADMIN_USERNAME`,
  `SUPERADMIN_PASSWORD`, `DATA_DIR`, `PUBLIC_ORIGIN`, `SNAPSHOT_RETENTION_DAYS`.
- Update the README with a "Deploying v3 (VPS)" section, and remove or mark obsolete the Vercel
  instructions.

---

## 17. Phases and acceptance criteria

| Phase | Scope | Done when |
|---|---|---|
| **P0 Foundations** | `server/` and `shared/` scaffold, Fastify, Drizzle + migrations, the dev script running both processes, `/api/health`, the Vite proxy | `npm run dev` serves the SPA and the API; typecheck clean; `content:check` still 0 errors |
| **P1 Auth** | users, sessions, seed superadmin, login/logout/change-password, guards, client AuthProvider and route guards, admin onboarding (account and profile), audit log | Seeded admin must change password; can create a learner; learner can log in and is forced to change password; learner gets 403 on `/api/admin/*` (tested) |
| **P2 Content gating + progress** | server content bundle, filtered manifest and content API, server quiz grading, server code verification (sandbox), progress API behind the unchanged store surface, admin full view; plans table with a manual admin plan editor (the AI comes later) | A learner with a manual plan sees only those topics everywhere (sidebar, search, direct URL → 404); no `correctIndex` in any learner response (tested); v2 behaviours intact |
| **P3 AI layer** | crypto box, credentials CRUD and UI, four adapters, verify, `ai_calls` audit, job queue, model settings, policy warnings with acknowledgement | Admin adds an Anthropic API key, verifies it, sets it active; a test job makes a structured call and logs usage; secrets are never returned to the client (tested) |
| **P4 Assessment generation** | blueprint → pools → critic → code validation job; admin "Issue assessment"; admin preview of the pool | For a sample profile, a ready assessment exists with ≥ 25 validated items across ≥ 5 areas, all topic ids valid, and dropped items recorded with reasons |
| **P5 Test taking + proctoring** | pre-flight, consent, item runner for all kinds, adaptive selector, server timing, all detectors, warnings, sound, watermark, event pipeline, SSE live view, notifications, termination | Manual test script in `docs/PROCTORING_TEST.md` passes: each hard signal produces a counted warning plus an admin live event; the 3rd terminates; no correctness leaks mid-test |
| **P6 Evaluation + plans** | explain grading, evaluation job, plan validation and publish, learner evaluating screen and `/plan`, admin evaluation tab and plan diff, re-issue | Submitting a test produces an evaluation and a published plan in < 10 min; the learner sees only plan topics; the admin sees the full evaluation |
| **P7 Admin console polish** | overview, people table, learner detail tabs, usage reports, retention job, backups | Every item in §13 exists and works on 1280 px and 1440 px |
| **P8 Deploy** | Dockerfile, compose, Caddy example, README | `docker compose up` on a clean Linux VPS gives a working HTTPS app with persisted data across restarts |
| **C1…Cn Curriculum waves** | §14. Can run in parallel with P3 onward in separate sessions | Each module passes `content:check` with 0 errors and is committed |

---

## 18. Open questions (ask Abhishek; do not guess)

1. Should a learner be able to see the **full** curriculum read-only (with only plan topics
   completable), or strictly only the plan? This brief assumes **strictly the plan**, as requested.
2. Should a terminated assessment still produce a plan automatically, or wait for admin review?
   This brief assumes it produces one, with a flag.
3. Should paste be allowed inside `code` items (for example, pasting their own snippets from the
   same editor)? The default is **no**.
4. Which Wave 1 tracks come first?
5. Is the domain or VPS ready for P8?
