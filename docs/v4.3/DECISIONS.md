# v4.3 decisions

## D1. One additive migration for the whole release
- **Decision:** every v4.3 table is in `0023_v43_goals_graph_video_tests.sql`. It creates new tables and adds one column, and it changes nothing that already exists. The schema was designed up front, before the phase work.
- **Why:**
  - The phases run in parallel. If several of them each generated their own Drizzle migration, the journal and snapshots would collide.
  - A purely additive migration cannot touch learner progress or watch history.
  - The boot backup (`backupBeforeMigrating`) still runs, because there is an unapplied journal entry.

## D2. Goals are the input, and skill priorities are derived from them
- **Decision:** `learner_goals` is what the admin edits. The skill sliders in `learner_skill_priorities` are recomputed from the goals: each linked skill takes the highest slider of any goal that links it.
- **Why:** the assessment mix, the AI understanding, the path builder and the weekly plan all read priorities. Deriving the priorities keeps those parts working unchanged and makes goals the single place an admin edits. Existing priorities become `skill` goals once, at boot.

## D3. Capstones reuse task kinds, plus a simulated `terminal`
- **Decision:** a capstone is either a task (any existing kind, or the new `terminal` kind: a scripted fake shell plus a small file editor, graded by code) or an existing topic whose practice already proves the outcome.
- **Why:** we cannot give learners a real shell. A scripted terminal graded by regular-expression patterns tests the actual commands, such as resolving a merge conflict and opening a PR, at no risk and no cost.

## D4. Path-order rules (shared/pathOrder.ts)
- **Decision:**
  - A prerequisite must reach the lower of the goal's level and 3. The whole chain of prerequisites is walked.
  - A skill that has never been measured counts as level 0.
  - A must-have is Critical if it blocks a Critical or High goal at any depth, and otherwise High.
  - The order comes from Kahn's algorithm with a priority queue. A skill is ready only when every prerequisite it needs that is in the plan, at any depth, is already scheduled.
  - Among the skills that are ready, the next one is picked by these rules in turn:
    1. The higher of its own priority and the priority of anything it unblocks.
    2. A boosted must-have goes first.
    3. Admin order.
    4. The skill that unblocks the most targets.
    5. The skill id.
- **Why:** rule 2 sits ahead of the brief's admin-order tie-break. Without it, the worked example would put async JS before the boosted AI fundamentals, and the brief requires the opposite. A missing link takes its scheduling rank from what it unblocks, so "Critical" means "not optional", not "jump the queue".

## D5. A deleted skill-graph edge stays deleted
- **Decision:** the seed records every edge it has created in `app_meta` and never re-adds one an admin removed. It never overwrites edges an admin has edited. Deleting an edge offers Undo instead of a confirmation dialog, following the codebase's `notify.undo` rule.

## D6. Video watch rules
- **Decision:**
  - A video counts as watched once 90% of it has actually been played. Playback counts at up to 2× speed. Seeking forward and replaying add nothing.
  - Every video on a topic is required, including the alternate videos.
  - A topic that uses one chapter of a long course only needs that chapter. The chapter runs from its start to the next chapter of the same video used anywhere in the curriculum, capped at 60 minutes.
  - Videos YouTube reports as unplayable (errors 100, 101 and 150) stop counting. Admins see the list and can restore a video.
  - The lock never applies to topics a learner has already completed, and never to admins. In `warn` mode the test opens with a warning instead of the lock.
- **Why:**
  - The brief says no video should be missed.
  - Without a cap, a chapter topic that uses a 9-hour course could demand hours of watching.
  - A broken embed must not lock a topic forever. A learner could fake the unplayable report, which is an accepted risk on an internal platform.
  - Learners' existing progress stays intact.
