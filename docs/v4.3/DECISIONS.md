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

## D7. Topic tests live in `topic_test_items`; the content quiz is the seed and the fallback
- **Decision:**
  - At boot, static quiz questions are imported as `static` items. They keep their content question ids, so the served shape and stored attempts stay the same.
  - Only `active` items are served. If a topic has no active items, its content quiz is served instead, so the topic can always be completed.
  - Generated items need an exact quote from the topic's own passages.
  - **Gates:**
    - Hard: format, relevance, answerability and distractors.
    - Soft: not trivial and size.
  - The two answer-blind checks are separate Haiku calls, with and without the content, because a single call would already have read the content.
  - **Calibration:** only a learner's first exposure counts, and staff attempts never do.
    - **Flags:** more than 90% failing, or at least half of the strong learners failing.
    - **Retiring:** a flagged item is auto-retired at 20 attempts, but never below 5 active items per topic.
- **Why:**
  - This follows the item-writing and answerability research in RESEARCH.md §5.
  - It keeps existing learner progress intact.
  - The re-check over all 8,772 items costs about $23–57, so it is budget-capped ($25 per run, resumable), and it has not been run against real AI yet.

## D8. The goal path: blueprint, core skills, critically weak, parts (Phase 2b–2d)
- **Blueprint (assessment).** The 25 slots cover the Critical/High goals (the focus group, from the derived priorities), up to three **prerequisite probes** (the immediate `prerequisite`-edge parents of Critical/High goal skills that are not goals themselves) and the role's **core skills**; probes and core skills share the basics group and each gets at least one question (`planBlueprintMix`). Each Critical/High practical-case goal (at most two) turns one hands-on slot into an **outcome slot** of its capstone's task kind (180 s), which the generator writes from the shortened capstone (`outcomeTaskVariant`); if generation fails, the shortened capstone itself is the item. 25 items, 18/7, 26–32 min and bank reuse are unchanged. The bank-only assembler (`assembleInto`, the fallback) keeps the v4.2 mix.
- **Core skills** of the current role = `trackBasics` (beginner, non-AI skills of the department and track, stack-specific first, three). A measured core skill at 1/5 or below is critically weak, unless it is already a goal (then the admin's slider ranks it).
- **Critically weak and important** (D4 rule 2 boost): AI skills (`isAiSkill`) measured at 1/5 or below when the team is moving to AI-driven delivery (the learner has a goal with an AI skill, or the department pre-selects an AI skill at Medium or above); PM lifecycle courses measured at 3/5 or below (the v4.2 rule); core skills at 1/5 or below that are not goals.
- **Mastery.** Measured levels from the evaluation; an unmeasured prerequisite of a skill measured at 3/5 or more is inferred at 3/5 (KST). A low score implies nothing, so the prerequisite stays unmeasured and counts as 0 (D4). Stored on `evaluations.result` as `mastery`, `missingLinks` and `metGoals` (optional, backward compatible).
- **Path.** `runBuilder` orders by `shared/pathOrder.ts` over the goals (expanded with `goalsToTargets`; inside a goal the skill order breaks ties), the DB graph and the mastery. Prerequisites from the graph replace the FOUNDATIONS refreshers, which remain only in the v4.2 fallback used when a learner has no goal or priority at all. The PM department's goals keep v4.2's process order (lifecycle, terminology, meetings) as the admin order. The diagnostic refresh still opens a path when the assessment found gaps.
- **Parts are priority bands** along the path: Part 1 Critical/High (rank ≥ 4), Part 2 Medium, Part 3 Low/Optional. Ranks never increase along the path (a prerequisite inherits the rank of what it unblocks), so parts never go backwards. `partType` adds `prerequisite` (a missing link) and `capstone`.
- **Capstones** of case goals are the last item of that goal's run on the path; the item stores `goal:<goalId>` in `path_items.module_id` (no column added) and links to `/goals/:goalId`.
- **Week.** The week takes the next path lessons in path order that fit the hours; Do it now holds the top Part 1 items (at most four, half the week), Must know the short missing-link refreshers attached to an item in the week (that item `dependsOn` them), Medium and Low the rest by part.
