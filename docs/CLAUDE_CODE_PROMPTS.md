# Claude Code prompts: Trails v3

Setup, once: put `TRAILS_V3_BRIEF.md` and the codebase briefing (`CODEBASE_CONTEXT.md`) into
`docs/`. Add this line at the top of `CLAUDE.md`:

> v3 is in progress. The spec is `docs/TRAILS_V3_BRIEF.md`. It overrides anything in this file that
> it contradicts.

Run each prompt in a fresh Claude Code session (`/clear` between phases). Use plan mode for the
first message of each phase, review the plan, then let it build.

---

## Kickoff (P0)

```
Read docs/TRAILS_V3_BRIEF.md fully, then docs/CODEBASE_CONTEXT.md, then skim CLAUDE.md and
docs/PROGRESS.md. Do not write code yet.

1. Summarise the v3 goals and the 13 up-front decisions (D1–D13) in your own words.
2. List every open question in §18 plus anything else that's genuinely ambiguous, and ask me.
3. Then plan Phase P0 only (§17): server/ + shared/ scaffold, Fastify, Drizzle + better-sqlite3
   with migrations for the full §5 schema, concurrently-driven `npm run dev`, Vite proxy,
   /api/health, tsconfig wiring. Verify current APIs of Fastify, Drizzle and better-sqlite3 from
   their docs before using them. Windows (Git Bash) must work.

Acceptance: §17 P0 row. Finish with `npm run typecheck`, `npm run content:check`, and a commit
"v3 phase 0: server foundation". Add a "## v3 decisions" section to docs/PROGRESS.md.
```

## P1: Auth and onboarding

```
Implement Phase P1 of docs/TRAILS_V3_BRIEF.md (§6, plus the onboarding form from §13 and the
learner_profiles table). Use @node-rs/argon2, opaque DB-backed sessions in an httpOnly cookie,
@fastify/rate-limit, and a seed that follows §6 exactly (never commit a real password; print a
generated one once if SUPERADMIN_PASSWORD is unset; must_change_password=true).

Client: AuthProvider, /login, /change-password, route guards, a minimal /admin shell with
"People" and "Onboard learner". Keep the v2 design system.

Write integration tests (vitest + fastify.inject) for: login success/failure/lockout, forced
password change, learner → 403 on every /api/admin route, session revocation.
Acceptance: §17 P1. Commit "v3 phase 1: auth and onboarding".
```

## P2: Content gating and server progress

```
Implement Phase P2 (§7). This is the riskiest refactor, so plan it carefully first.

- scripts/content/build-server-content.mjs reusing load.mjs; wire into build and dev.
- Remove client bundling of module content; loadModule() calls the API; keep caching/de-dupe.
- /api/me/manifest filtered by the learner's latest published plan; all nav/search/neighbour
  logic uses it. Superadmin gets the full manifest.
- Quiz grading moves server-side (send original option indices). Strip keys for learners.
- Code challenges: visible vs hidden tests; server verifies with the §2 D13 sandbox.
- progressStore keeps its action surface but persists through the API.
- Admin plan editor (manual) so P2 is testable before AI exists.

Tests: a learner response never contains correctIndex/correctIndices/explanation (before submit)
or hidden tests; unassigned topic → 404 via API and via direct URL in the UI.
Acceptance: §17 P2. content:check 0 errors. Commit "v3 phase 2: gated content and server progress".
```

## P3: AI layer

```
Implement Phase P3 (§8). Before coding, read the current docs for @anthropic-ai/sdk (structured
output / tool use with JSON schema), the openai SDK (structured outputs), `claude -p
--output-format json` and `CLAUDE_CODE_OAUTH_TOKEN`, and `codex exec` JSON output + CODEX_HOME.
Note what you verified in docs/PROGRESS.md.

Build the AES-256-GCM secret box, credentials CRUD + Admin → AI connection page, the four
adapters behind the AiProvider interface, verify(), the ai_calls audit, the SQLite job queue,
model settings. Anthropic API key is the recommended default. The claude-cli and codex-cli
adapters require the shared-use acknowledgement and show the policy warnings from §8.1 verbatim
in spirit. Secrets never leave the server (test it).
Acceptance: §17 P3. Commit "v3 phase 3: AI provider layer and job queue".
```

## P4: Assessment generation

```
Implement Phase P4 (§9.1–9.3). Write the blueprint, item-generation and critic prompts as
separate files under server/src/ai/prompts/ with the item quality rules from §9.2 included
verbatim. Validate every AI output with zod; validate topic ids against the manifest; run code
items' reference solutions in the sandbox; record dropped items with reasons.

Add an admin "Issue assessment" action and an admin pool preview (items grouped by area and
difficulty, with key, rationale and critic verdict). Create 3 realistic sample learner profiles in
a dev seed (a junior React dev, a mid Laravel dev, a senior Node/NestJS dev) and generate an
assessment for each; paste a summary of the results into docs/PROGRESS.md.
Acceptance: §17 P4. Commit "v3 phase 4: assessment generation".
```

## P5: Test taking and proctoring

```
Implement Phase P5 (§9.4, §9.5, §10). Verify the current @mediapipe/tasks-vision API
(FaceLandmarker with facial transformation matrixes, ObjectDetector with EfficientDet-Lite0 and
categoryAllowlist) and self-host the wasm + .task files under public/mediapipe/.

Build in this order: server adaptive selector + timing (unit-test the selector), item runner UI
for every kind, pre-flight (consent, camera + calibration, sound check, desktop check,
fullscreen), browser event detectors, camera detectors with the debounce table in §10.2, the
server-authoritative warning/escalation/termination rules, Web Audio tones, watermark, event
upload with snapshots, SSE admin live view, notifications.

Also write docs/PROCTORING_TEST.md: a manual checklist that triggers every hard and soft signal
and states the expected warning and admin event. Run through what you can and report.
Acceptance: §17 P5. Commit "v3 phase 5: proctored assessment".
```

## P6: Evaluation and plans

```
Implement Phase P6 (§11, §12). Explain-item rubric grading, the evaluation job with the exact
EvaluationResult schema, server-side plan validation (unknown ids, dedupe, trail order,
prerequisite fill, minimum size), publish + notify, the learner "evaluating" and /plan screens,
admin Evaluation tab, plan diff, re-issue assessment. No artificial delays.
Run the 3 sample profiles end to end and record timings in docs/PROGRESS.md.
Acceptance: §17 P6. Commit "v3 phase 6: evaluation and learning plans".
```

## P7 and P8

```
Implement Phase P7 (§13 complete: overview, people table, learner detail tabs, usage reports,
snapshot retention job, nightly SQLite backup) and then Phase P8 (§16: Dockerfile, compose,
Caddyfile.example with SSE flushing, .env.example, README "Deploying v3"). Walk the §15 security
checklist and report each item as done / not done with evidence.
Commit per phase.
```

---

## Curriculum wave prompt (run once per module, in separate sessions or subagents)

```
We are adding the <TRACK NAME> track (docs/TRAILS_V3_BRIEF.md §14). First, if the track does
not exist yet: add it to TrackId, registry.ts (with modules and idPrefixes I approve), track-meta,
certificate codes, and a new accent token with a text-safe -strong variant in both themes
(check contrast). Record decisions in docs/PROGRESS.md.

Then write the module <MODULE ID> following docs/CONTENT_GUIDE.md exactly:
- verify current versions of the technology from official sources and add them to the
  CONTENT_GUIDE §10 current-facts sheet;
- videos only via scripts/research/yt.mjs (never guess ids), chapter deep-links where a long
  course covers the topic;
- 2–4 references, docs first, checked with scripts/research/check-urls.mjs;
- non-JS technologies use quiz challenges (include predict-the-output questions); JS/TS topics
  may use code challenges with reference solutions;
- write docs/research-notes/<MODULE ID>.md.
Loop `npm run content:check -- --module <MODULE ID>` to 0 errors, run content:embeds and
content:videos, then commit "content: <module name>".
```
