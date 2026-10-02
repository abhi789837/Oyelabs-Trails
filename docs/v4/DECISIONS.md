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
