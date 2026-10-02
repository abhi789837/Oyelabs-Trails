# Oyelearn v4 — plan

Concrete approach per phase, written after the audit (`AUDIT.md`) and research (`RESEARCH.md`).
Rules that hold throughout: additive migrations only; reuse before build; no invented links; every
phase ends lint + typecheck + tests + build green and one `feat(v4-pN)` commit.

## Phase 2 — Departments

**Schema (migration 0013, additive).**
- `departments` (id slug, name, icon, colour, assessment_format `coding|tasks`, practice_noun, position, archived_at)
- `tracks` (id, department_id, name, description, position, archived_at) — *job* tracks, distinct
  from the content trails in `TRACK_IDS`. Engineering keeps the existing ids (`frontend`, `backend`,
  `fullstack`, `mobile`, `devops`, `ai-ml`) so learner rows map 1:1.
- `stacks` (id, department_id, name, kind `stack|tool`, language, aliases, position, archived_at)
- `skills` (id, department_id, name, area, aliases, tags, level_min, level_max, track_ids,
  prerequisites, stack_ids, language, content_modules, is_ai_skill, status `active|pending|archived`,
  requested_by, position)
- `course_skills` (course_id, skill_id); `courses.level`, `courses.department_id`
- `learner_profiles.department_id`, `.track_id`, `.stack_ids`, `.experience_band`

**Seed.** `server/src/catalog/seed/*` (data, tested) is inserted at boot *if absent by id* — admin
edits are never overwritten. The migration itself inserts the three department rows and moves every
existing learner to Engineering with `track_id = track` (`other` → `fullstack`, logged).

**API.** `GET /api/admin/catalog` (staff), CRUD + reorder + archive under `/api/admin/departments`,
`/tracks`, `/skills`, `/stacks` (superadmin for mutations). `/api/me` carries the department so the
learner UI can say "Task workspace" instead of "Code".

**UI.** `/admin/departments` (three panes: departments, tracks, skills/stacks with search, pending
requests). A `department` quick filter on People, Curriculum, Courses and Generated.

## Phase 3 — One setup screen

**Schema.** `learner_skill_priorities (user_id, skill_id, skill_name, slider 1–5, position)` and
`learner_skip (user_id, skill_id, skill_name)` — see D2. A one-time, idempotent boot migration copies
`learner_targets` + `learner_priorities.must_have/skip` into them, matching free text to catalog
names/aliases; anything unmatched becomes an active custom skill in the learner's department (the
admin already chose it, so it is not "pending").

**One reader.** `targets/repo.ts:getTargets()` is re-pointed at the slider table and keeps returning
the `LearnerTarget` shape (`5,4 → high`, `3 → medium`, `2,1 → low`; position = slider-sorted order),
so the builder spine, the weekly plan (which currently reads the stale `must_have` — fixed here) and
scoring all read the same data without signature changes.

**API.** `GET/PUT /api/admin/users/:id/setup` replaces `/targets` + `/priorities` (both kept as thin
wrappers for one release). `PUT` accepts `assign: true` to save and issue the assessment in one call,
in that order. `POST /api/admin/skills/requests` creates a pending skill.

**UI.** `SetupForm` used by both `/admin/onboard` and the Setup tab: department/track segmented
pickers → stacks/tools multi-select → experience + level chips → skill picker (Popover + cmdk,
grouped by area, alias/tag search, track pre-suggestions, "request a skill" at the bottom) → slider
rows auto-sorted (stable for ties, keyboard move for fine-tuning) → skip picker → hours → collapsed
advanced → sticky summary computed by the same shared function the assembler uses.

**Tabs.** Setup · Assessment (results + integrity + evaluation sections) · Path (path results + this
week, with the admin's pin/move overrides) · Library · Progress · Account. Path tab is results only.

**Priority rule** stays in `priorityPath.ts` (pure, `assertSpine`), extended with the slider, skip and
department; tests cover every case in the brief.

## Phase 4 — The new assessment

**Format v4** (`assessments.config.format = "v4"`): ≤25 items = 18 hands-on (coding or task) + 7 MCQ,
assembled once at issue, served as one sheet. `deadline_at = started_at + 50 min`; the sweeper and the
client both auto-submit at the deadline. No per-item timer. Free navigation with a navigator
(answered / flagged / unanswered). Optional `minFinishMinutes` (off by default). "I don't know yet" on
every item, scored 0 with no penalty. Legacy (adaptive) assessments keep their code path until they
finish; new issues are v4.

**Items** gain `bank_item_id`, `position`, `runs_used`, `flagged`, `draft`, `locked_at`.
Endpoints: `GET /api/assessment/:id/sheet`, `PUT …/items/:itemId/draft` (autosave),
`POST …/items/:itemId/run` (server counter, max 3, the 3rd auto-submits), `POST …/items/:itemId/submit`,
`POST /api/assessment/:id/submit`.

**Execution.** JS/TS sample runs in the browser worker (TS stripped with `sucrase`), after the server
has counted the run. Python/PHP/SQL/Java/Dart run in **Piston** via `server/src/sandbox/piston.ts`
(stdin = JSON test cases, harness per language prints one JSON line per case). Grading always runs the
hidden tests on the server (isolated-vm for JS/TS, Piston for the rest), partial credit per test, no LLM.
Runs are rate-limited per user on the server as well as capped per item.

**Editor.** `monaco-editor` lazy-loaded, language from the item. The proctoring scope reads Monaco's
own selection for copy, so in-editor copy/paste/undo/select never warn; paste from outside the page
is still flagged.

**Results** are deterministic: per priority skill, a 0–5 level from difficulty-weighted scores,
strengths, and "what we'll focus on first". Raw score shown to admins only.

## Phase 5 — Question bank

`question_bank` table with the brief's fields plus `reference_solution`, `harness`, `source`.
Seed files `server/bank/<department>/<skill>.json` are written by subagents, validated by
`scripts/bank/validate.mjs` (runs every reference solution against its hidden tests in Piston /
isolated-vm, and checks every starter *fails*), and only passing items ship as `active`. Boot inserts
absent ids. The assembler (`server/src/bank/assemble.ts`) is pure: weights 60/25/15, difficulty band
from level/experience, own-stack basics only, seen-item exclusion, seeded shuffle. Thin skills enqueue
`bank.fill` once (Sonnet via Batch, validated before insert). `/admin/question-bank` for filter,
preview, edit, retire, approve. Nightly stats recompute; auto-retire at ≥95% or ≤5% correct after ≥20 uses.

## Phase 6 — AI router

`server/src/ai/router.ts`: every call names a `task` (`grade_written`, `skill_tagging`,
`bank_fill`, `course_outline`, `course_write`, `course_review`, `week_plan`, `planning`, …);
`ai_task_routes` table holds the admin's model + `max_tokens` per task with the brief's defaults.
Model ids are read from `GET /v1/models` at boot and cached; an unavailable model falls back to
Sonnet 5.5 with a warning. Anthropic adapter adds `cache_control` on the system block, honours
per-task caps, and a `batches` path. `ai_calls` gains `task`, `cache_read_tokens`,
`cache_write_tokens`, `cost_micros`, `course_id`, `batch`. Admin → AI usage page: spend per day /
task / learner, average per assessment and per course, monthly budget (80% banner, 100% pauses
non-urgent jobs). Before/after in `RESULTS.md`.

## Phase 7 — PM and BD

Two new content trails (`pm`, `bd`) in the existing curriculum format, four camps each (Beginner,
Intermediate, Advanced, Super advanced), every topic with verified refs, an oEmbed-checked video, a
summary, a practice task and a graded quiz, so certificates work unchanged. Task components (Write,
Rank, Calculate, Scenario, Spot the issue) shared by assessments and course practice. Bank items for
both departments. Written by subagents from `sources-pm-bd.json`; gated by `content:check`.

## Phase 8 — Paths for every department

`builder/parts.ts` parameterised by department: Part 1 "Strengthen your current role" (own-track
gaps), Part 2 "AI-driven work for your role" (the department's `is_ai_skill` skills), then everything
else by admin priority. Gap analysis becomes deterministic from per-skill results (no LLM).
Generated courses keep the same blueprint and Save to library.

## Phase 9 — User management

Fill the gaps: anonymised `user.deleted` audit, bulk status/revoke/delete with per-row results,
sessions revoked on every status/role change, reactivation semantics, tests.

## Phase 10 — Ship

Tests listed in the brief; Playwright e2e per department against a local production build with
Piston; UI pass at 390/1440 light/dark; deploy script + runbook (production run is "Needs Abhishek":
no server access); path rebuild script for existing learners; `RESULTS.md`; tag `v4.0.0`.
