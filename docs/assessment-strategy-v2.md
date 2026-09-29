# Assessment strategy v2 — plan

What is being changed, why, and in what order. Written before the build, from a read of the existing
users, onboarding, assessment, proctoring, builder and course code.

---

## What is already here

Worth stating, because most of this brief is a change to something that exists rather than a new
system, and the cheapest failure would be building a second one beside it.

| | Where | State |
| --- | --- | --- |
| Roles, sessions, status | `users.status` is `active \| disabled`; `revokeUserSessions()` | Suspend exists. Archive and delete do not. |
| Onboarding profile | `learner_profiles` (role, years, notes, claimed skills, target tracks) | No track/stack field, no ordered targets, no target dates. |
| Admin priorities | `learner_priorities` — `mustHave[{skill, weight}]`, `skip`, `hoursPerWeek` | Weighted, but unordered and dateless. This is what `learner_targets` replaces. |
| Assessment | Blueprint → item pool → adaptive staircase → evaluation | **No sections.** One flat round-robin over 3–6 areas. |
| Adaptive selector | `assessment/selector.ts`, pure and tested | Starts at the *hypothesis* level (2–4). Needs to start easy. |
| Difficulty | 1–5, `TIME_LIMIT_SEC` per kind | Per-item timers. Brief wants per-section. |
| Item kinds | `mcq`, `multi`, `predict_output`, `find_bug`, `code`, `explain` | Close to what §3 asks for. No "I don't know". |
| Code grading | `sandbox/` — isolated-vm in prod, worker_threads in dev | **Server-side, JS only.** No editor; the learner types into a plain textarea. |
| Proctoring | `proctor/browserSignals.ts` | Blocks paste everywhere, explicitly including code items. |
| Course schema | `courses` → `course_sections` → `course_topics` | Already has body, video, links, practice, test, estMinutes. |
| Generated courses | `generated_courses`, `course_sources`, research + verify pipeline | Already verifies URLs and videos. `scope` is `learner \| global`. |
| Learning path | `learning_paths`, `path_items` with `source` and `reason` | **No parts.** Flat ordered list. |
| Weekly plan | `weekly_plans`, four lanes | Ready to take Part 1 and Part 2 into week 1's red lane. |

**Two things found while reading, both fixed before starting:**

- `on(window, "blur-sm", …)` — window-blur proctoring has been dead since the Tailwind v4 migration
  renamed the `blur` utility class. Fixed in `5ad3592` with a guard test.
- `learner_priorities.mustHave` and `learner_profiles.claimedSkills` overlap. v2 makes
  `learner_targets` the one ordered, dated, prioritised list and leaves the other two as they are
  until the migration is proven.

---

## What changes, in order

The order is a dependency order, not a preference. Targets have to exist before the assessment can
be weighted by them, and the assessment has to report per-skill levels before the path can be split
into parts.

### 1. User lifecycle — `feat(admin): user suspend/archive/delete`

`users.status` gains `archived`; `deleted_at` is **not** added, because delete here means delete.

| Action | Who | Effect |
| --- | --- | --- |
| Suspend | admin | Cannot sign in. Everything kept. Reversible. |
| Archive | admin | Hidden from active lists, progress frozen, data kept. Reversible. |
| Delete | **superadmin only** | Hard delete, in one transaction. |

Delete requires typing the username (`ConfirmProvider` already supports `confirmPhrase`), offers a
JSON export first, and leaves one anonymised `audit_log` row: who, which id, when. **Courses promoted
to the global catalogue survive** — they stopped belonging to one learner when they were promoted.
Learner-scoped generated courses go.

Refused: deleting yourself, and deleting the last superadmin. Every action revokes sessions.

### 2. Targets — `feat(onboarding): tracks, stacks and prioritised targets`

New `learner_targets` (skill, priority, position, target date) and `learner_tracks` (track, stack).
The stack string is what makes Part 2 specific — "AI-driven development" as a course is useless;
"prompting for a Laravel controller with validation" is not.

Priority drives three things, and each is enforced in code rather than in a prompt:

- **assessment** — 50 / 30 / 20 of the target question budget, High asked first;
- **course generation** — High handled first;
- **weekly plan** — High into "Do it now" first.

### 3. The assessment — `feat(assessment): priority-weighted adaptive assessment`

The current one is too hard, and the shape of why is specific: it starts at the *hypothesis* level
rather than easy, has no sections, and has no way to say "I don't know" that is distinguishable from
a guess.

**Five sections, in this order**, each with an intro screen and its own timer:

1. Current track basics — always included
2. High-priority targets — ~50% of the target budget
3. Medium and Low — ~30% / ~20%
4. Working with AI — scenarios, scored gently
5. Hands-on — 1–3 short coding tasks

~25–35 items, ~45 minutes. `MAX_TOTAL_MIN` goes 30 → 45.

**Adaptive changes:** start every section at easy or medium; up one after **2 correct in a row**,
down one after **one wrong**; stop a section at 3 correct at a level or 2 wrong at a level. The
existing staircase is close — it steps up after *one* correct and stops on reversals. The new rule
is gentler on the way up and quicker to settle.

**"I don't know yet"** on every question: recorded as `unknown`, not wrong. It does not move the
staircase down, it does not count toward "2 wrong", and it is evidence of a gap rather than of a
failure. No negative marking.

**Scoring** becomes per-skill: level 0–5, confidence, and the item ids behind it (`skill_levels`).
The learner sees a summary **by part** — strengths, gaps, what we will focus on first. No single
percentage.

### 4. The code editor — `feat(assessment): in-page code editor`

**CodeMirror 6, not Monaco.** Monaco is ~2 MB gzipped and wants a worker-per-language; CodeMirror 6
is ~120 KB for the languages here and composes as plain ES modules. Lazy-loaded, so it costs nothing
on a non-coding question.

Languages: JS/TS, PHP, Python, SQL, and HTML/CSS with a live preview.

**Running it:**

| Language | Where | Boundary |
| --- | --- | --- |
| JS / TS | Browser Web Worker, with a timeout | Already how the dev sandbox works |
| HTML / CSS | Sandboxed iframe | `sandbox="allow-scripts"`, no same-origin |
| PHP / Python / SQL | **Server-side runner container** | CPU, memory, wall-clock limits, no network |

The runner is a separate container beside the app, reached over the internal Docker network only —
never exposed through Caddy. Grading stays server-side regardless of where the learner pressed Run:
the browser worker is for *feedback*, the server for the *mark*.

**Proctoring must stop fighting the editor.** Today `paste` is blocked everywhere, code items
explicitly included. That was defensible when the answer box was a textarea. With an editor it is
not: typing, copying, pasting, undo and selection **inside the editor** are normal work. The rule
becomes:

- events whose target is inside the editor root → ignored entirely;
- a paste whose content did not originate in this page → still flagged;
- Run, the output panel, and focus moving between question and editor → not a tab switch.

Autosave per question, so a refresh does not lose work.

### 5. Path in parts — `feat(path): part-based learning path and course library saving`

`learning_parts` (number, type: `track | ai_dev | general`). The order is enforced in code:

- **Part 1** — strengthen the current track, 3–6 h, built only from real gaps in *their own* stack.
- **Part 2** — AI-driven development for that stack, 3–5 h.
- **Part 3+** — the rest, by admin priority then AI-detected gap severity.

Parts 1 and 2 go into week 1's "Do it now" lane. Everything relevant stays unlocked in the library.

### 6–7. Course conformance, review and the resource library

Generated courses already use the real course schema. What is missing is the **review surface** and
the **reuse**:

- "Suggested for this learner" on the learner page: part, reason, status, quality score, with
  preview / edit / remove / regenerate-one-topic / **Save to system library**;
- a global "AI suggested courses" page with filters and bulk save;
- `resources` + `course_resources`: every verified link and video from a saved course, with skill,
  tags and last-verified date, **searched before the web is**;
- de-duplication: a saved course for the same skill suggests a merge rather than a second copy.

---

## What landed, and what did not

Written after the build rather than before it, so it is a record instead of a promise.

### Landed

| | Commit | Notes |
| --- | --- | --- |
| Window-blur proctoring fix | `5ad3592` | Found while reading. Dead since the Tailwind v4 migration. |
| §1 Suspend / archive / delete / export | `af17e31` | 17 tests. Found and fixed a dead last-super-admin guard. |
| §2 Tracks, stacks, prioritised targets | `7e13ca2` | Migration 0009 with a backfill; 25 tests. |
| §2 The targets editor | `0949772` | Onboarding step and the learner's AI-path tab. |
| §3 Fairer staircase, five sections, "I don't know" | `7010f1f` | 29 selector tests. 45 min, 25–35 items. |
| §4 Editor whitelist and autosave | `d6e99a5` | The live bug: editing fluently could terminate a sitting. |
| §5 Part-based path | `5bf5cdf` | Migration 0010; 18 tests on the ordering. |
| §5 Parts 1–2 into week one's red lane | `5652cf2` | 40 weekly-plan tests. |

### Not landed

Stated plainly rather than left to be discovered:

- **§3's client shell.** The server serves sections and the learner can answer "I don't know", but
  there are no per-section intro screens, no per-section timers and no question flagging. The
  progress strip carries the part on the wire (`progress.part`) and the UI does not yet show it.
- **§3's by-part results screen.** The evaluation still produces one summary rather than strengths
  and gaps per part.
- **§4's editor upgrade.** Still the existing textarea with a line gutter, auto-indent and
  bracket-aware Enter — not CodeMirror. No Run/Reset panel for non-JS, and no language support
  beyond JavaScript.
- **§4's multi-language runner.** Designed below and not built. PHP, Python and SQL have no runner.
- **§6 and §7 in full.** Generated courses already use the real course schema and the verified
  research pipeline, so §6 is largely already true; the **review surface** (§7) — "Suggested for
  this learner", the global suggested-courses page, `resources` / `course_resources`, and
  de-duplication on save — is not built.

### The code runner, as designed

Not built, and it is the one item here that is infrastructure rather than application code, so it is
written down rather than half-done:

- its own container beside the app, on the internal Docker network only, never through Caddy;
- `--network=none`, a read-only root, a tmpfs work directory, `--memory=256m`, `--cpus=0.5`, and a
  wall-clock kill at 10 s;
- one POST endpoint taking `{ language, code, tests }` and returning outcomes, with no filesystem
  and no environment inherited from the host;
- the browser worker stays the path for *feedback* on JS/TS; the server is the path for the *mark*,
  in every language, so a learner cannot grade themselves by editing what runs.

Until it exists, a PHP/Python/SQL question would have to be answered without being runnable, which
is why the hands-on section currently generates JavaScript tasks only.

---

## Sequencing, honestly

Sections 1–3 and 5 are application code and land in this pass. Section 4 splits:

- the editor, the JS/TS worker path, the HTML/CSS preview, autosave and the proctoring whitelist are
  application code and land here;
- the **PHP / Python / SQL runner is infrastructure**. The container, its compose service and its
  limits are written and documented, but I cannot provision or smoke-test it on the production host
  from here. Until it is deployed, those languages degrade honestly: the editor still opens and the
  question is still answerable, and the server records the submission and grades it when the runner
  is reachable, rather than pretending to run it.

Anything not verifiably working gets said so in the report rather than ticked off.

---

## Rules being kept

- No parallel systems. New behaviour extends `selector.ts`, the course schema and the weekly plan
  rather than sitting beside them.
- Every AI output shape in zod, and every budget and ordering rule enforced in code afterwards —
  the same split the weekly plan uses, for the same reason.
- Learners see only their own data. User management and library actions are staff-only, delete is
  superadmin-only.
- Back up the SQLite database before migrating in production.
