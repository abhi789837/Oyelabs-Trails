# Oyelearn v4 — audit of what exists (Phase 1)

Detail lives in two companion files, written from a full read of the code:

- `AUDIT_SERVER.md` — every table, every route (≈105), every AI call site with prompt sizes, the
  assessment pipeline, courses/builder, weekly plan, user management, jobs, tests, deployment.
- `AUDIT_CLIENT.md` — every route and page, the admin learner tabs, onboarding, the assessment UI,
  proctoring, the design system and UI primitives, API conventions.

This file is the summary and the **token baseline** that Phase 6 is measured against.

## State at the start of v4 (`main` @ `8d1c6b0`, tag `pre-v4`)

- **Stack:** Fastify 5 + Drizzle + SQLite (WAL) server, React 19 + Vite 8 + Tailwind v4 SPA, one
  origin. 13 migrations. Job queue in SQLite with one sequential worker. isolated-vm sandbox for JS.
- **Content:** 7 engineering trails, 67 modules, 715 topics (static TS → JSON bundle), plus
  admin-authored and AI-generated `courses` (sections → topics with practice/test).
- **Tests:** 51 files, 853 tests, all passing. `tsc -b` and `eslint .` clean.
- **Deployment:** Docker image (node:24-bookworm-slim) on `127.0.0.1:8787`, Caddy in front, named
  volume `/data`. Live at learn.oyegen.com. No SSH access from this machine (see PROGRESS "Needs Abhishek").

## What v4 can reuse

| Area | Exists | v4 gap |
| --- | --- | --- |
| Priority spine | `builder/priorityPath.ts` (`buildSpine`/`assertSpine`): targets first, every High gets a course, prereqs ≤20%, tested | 1–5 slider, skill ids, `learner_skip`; weekly plan still reads stale `must_have` (`plans/weekly/generate.ts:147`) |
| Setup | `PUT /admin/users/:id/targets`, TargetsFields, PrioritiesFields, Slider, Popover+Command, TagInput | Two saves overwrite each other; onboarding never saves builder settings; blank stack → 400 |
| Departments | — | No departments/tracks/skills tables; `learnerTrackSchema` is a closed enum |
| Assessment | Lifecycle, consent, integrity, heartbeat, sweeper, `gradeItem` partial credit, "I don't know" | Adaptive one-at-a-time with per-item timers and 45-min cap; ≤3 code items; JS-only; unlimited client-side runs; no run endpoint |
| Question bank | `validateGeneratedItem`, `verifyCodeItem`, critic prompt | Items generated per sitting by LLM (~13 calls each) |
| AI | `AiService.generateJson` is a single choke point with `ai_calls` logging | 3 model buckets, hard-coded ids (`claude-sonnet-5` is not a real id), no caching, no batches, no cost, budget is a free-text note |
| Proctoring | `editorScope.ts` exempts in-editor copy/paste via `document.getSelection()` | Needs Monaco-aware selection; Firefox textarea gap |
| User management | Super-admin delete with typed username, one transaction, keeps global courses, guards self/last superadmin; export; status; revoke | `user.deleted` audit keeps username/display name (not anonymised); no bulk delete/revoke; reactivation doesn't revoke |

## Token baseline (before v4)

There is **no real-provider usage on record**: the 14 `ai_calls` rows in the dev DB are all from the
mock provider. The baseline is therefore estimated from the measured prompt templates and typical
injected context (method in `AUDIT_SERVER.md` §4), priced with the **verified** list prices from
`RESEARCH_SANDBOX_AI.md` (Sonnet 5.5 $2/$10, Opus 5.5 $4/$20, Haiku 4.5 $1/$5 per MTok).

| Operation | LLM calls | Tokens in | Tokens out | Model today | USD |
| --- | --- | --- | --- | --- | --- |
| Assessment generated (blueprint + 5 item batches + explain + 6 critic passes) | 13 | ~48k | ~37k | Sonnet | **~$0.47** |
| Assessment graded/evaluated (explain grader + evaluation/plan) | 2 | ~21k | ~5.6k | Opus | **~$0.20** |
| Path build (gap analysis + 3 matches) | 4 | ~11k | ~2k | Sonnet | ~$0.04 |
| Course generated (outline + 12 lessons + review) | 14 | ~25k | ~33k | Sonnet | **~$0.38** |
| Weekly plan refine | 1 | ~4.4k | ~1.2k | Sonnet | ~$0.02 |

A typical onboarding (one assessment, its evaluation, a path with three generated courses) is
**~$1.85 and ~250k tokens**, ~75% of the cost in output tokens. Excluded: repair turns (≈2× that
call's input), retries, and search/YouTube API calls.
