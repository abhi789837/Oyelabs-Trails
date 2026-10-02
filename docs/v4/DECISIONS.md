# Oyelearn v4 — decisions

Each entry: the decision, the alternatives, and why. Newest last.

## D1. No production access from this machine → deploy is scripted, not run
- **Decision:** build and verify everything locally (Docker Desktop is available), and ship a
  deploy script + runbook. The production deploy itself is logged under "Needs Abhishek".
- **Alternatives:** guess credentials; skip deploy artifacts.
- **Why:** SSH to 169.58.125.156 (learn.oyegen.com) is refused for every user with the local key.
  The brief forbids breaking the shared Caddy setup, so an unverified remote change is worse than none.

## D2. `learner_priorities` keeps its name and becomes "learner settings"; slider rows go in a new table
- **Decision:** the brief's `learner_priorities(learner, skill, slider 1–5, order)` is implemented as a
  new table `learner_skill_priorities` plus `learner_skip`. The existing `learner_priorities` row
  (one per learner: hours, course cap, auto-publish, deadline, week start) stays as the learner's
  path settings.
- **Alternatives:** rename the existing table and create a new one under the old name.
- **Why:** migrations must be additive and reversible; renaming a live table that four readers use
  is neither. Same data model as the brief, one different table name.

## D3. The v4 assessment has no per-sitting approval gate
- **Decision:** a v4 sitting is assembled from validated bank items and goes straight to `ready`.
  The v3 `awaiting_approval` gate (and its 5-minute auto-approve) applies only to legacy sittings.
- **Alternatives:** keep the gate for every assessment.
- **Why:** the gate existed because each sitting was freshly written by a model. Bank items are
  reviewed once (validator + admin bank page) and reused, so a per-sitting review re-checks the
  same items every time and only delays the learner.

## D4. "Minimum time before Finish" is one global admin setting, off by default
- **Decision:** `app_meta` key `assessment.min_finish_minutes`, edited on the admin side; copied into
  each sitting's config when it is issued, so changing it never affects a test in progress.
- **Alternatives:** per learner; per assessment at issue time.
- **Why:** the brief asks for one admin setting; a per-sitting copy keeps a running test stable.

## D5. Engineering "hands-on" may be a task where code cannot test the skill
- **Decision:** engineering's 18 hands-on items are coding first, then `spot`/`rank`/`scenario` tasks
  for skills like Docker, Git, AWS and AI-diff review. PM/BD hands-on items are tasks only.
- **Why:** "18 coding problems" for Docker or reviewing an AI diff would force contrived code;
  a flawed Dockerfile to mark up is the practical 1–2 minute question.

## D6. Path order: Part 1, Part 2, then the rest — with the admin's priorities as the spine
- **Decision:** Part 1 "Strengthen your current role" = every **Critical** priority plus **High**
  priorities in the learner's own track, then own-track gaps the assessment found. Part 2 "AI-driven
  work for your role" = the admin's AI-skill priorities, or the department's AI skill for their
  track/stack when none was picked. Part 3+ = every remaining priority in slider order, each with its
  refreshers. AI-found gaps only ever appear in "Also suggested".
- **Alternatives:** all priorities before Parts 1/2 (the Phase 10 wording) or Parts 1/2 before any
  priority (the Phase 8 wording).
- **Why:** the brief states both orders. This satisfies both readings that matter: the path always
  opens with Parts 1 and 2, nothing the AI found ranks above a person's decision, and a Critical
  priority is never pushed behind anything.

## D7. Catalog modules and saved courses attach without a model call
- **Decision:** before the (Haiku) course-match call, a priority's catalog `content_modules` attach
  directly (`path_items.module_id`), then a published, library-saved generated course for the same
  skill is reused. Only then does matching or generation spend tokens.
- **Why:** the biggest course-generation saving is not generating; PM/BD now have curricula and
  engineering skills map to 75 existing modules.
