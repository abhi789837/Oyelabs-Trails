# v4.3 progress

Resume from the first unticked item. Decisions are in `DECISIONS.md` and research is in `RESEARCH.md`.

## Step 0
- [x] Earlier progress checked. In v4.1 and v4.2, only the deploys are left, and Abhishek runs those. Nothing else is open.
- [x] Checkpoint tag `pre-v4.3`

## Phase 1: Two-click onboarding and practical priorities
- [x] 1.0 Research note (outcomes, free text → skills)
- [ ] 1.1 `learner_goals` table + shared schema (skill / case / text, outcome, skills, level, slider, order)
- [ ] 1.2 Practical outcomes library: at least 40 per department, linked to skills, levels and a capstone
- [ ] 1.3 AI: Suggest (quick onboarding prefill) + interpret free text → outcome, skills, level (Haiku, cached prompt, mock)
- [ ] 1.4 Quick onboarding screen (default on `/admin/onboard`); full Setup as "Edit details"
- [ ] 1.5 The "What should they be able to do?" box on Setup and quick onboarding (skill, case, text chips + slider)
- [ ] 1.6 Suggestions: at onboarding (+ Add), and "Suggested next" after the assessment and weekly (Add / Dismiss, auto-add toggle off by default)
- [ ] 1.7 Goals drive the assessment (outcome tasks), course capstones and goal achievement
- [ ] 1.8 Checkpoint + commit `feat(v4.3-p1)`

## Phase 2: Missing links and proper progression
- [x] 2.0 Research note (prerequisite graphs, progressions)
- [x] 2.1 `skill_edges` table + seeded graph for every department + acyclic validation
- [x] 2.2 Admin skill-graph page (list editor + read-only graph)
- [ ] 2.3 Assessment blueprint covers goals + their immediate prerequisites + core role skills; output mastery 0–5 + missing links
- [ ] 2.4 Priority-aware topological path order with must-have boosts, tie-breaks, skipping mastered skills, and a reason per step
- [ ] 2.5 No-gap continuation; the weekly plan takes the next items in order (Do it now / Must know)
- [ ] 2.6 Worked-example test and property tests
- [ ] 2.7 Checkpoint + commit `feat(v4.3-p2)`

## Phase 3: Continuous trail
- [x] 3.1 Trail geometry module (waypoints from item order, Catmull-Rom → Bézier, desktop curve and mobile zig-zag)
- [x] 3.2 Weekly trail: one `<path>`, lane colours on markers and segments, solid progress then dashed, "You are here", link to next week, past weeks
- [x] 3.3 My plan overview: one milestone trail with weeks marked
- [x] 3.4 Continuity tests at 390, 768, 1280 and 1440 px × 1, 5, 12 and 20 items, with collapsed lanes
- [x] 3.5 Checkpoint + commit `feat(v4.3-p3)`

## Phase 4: Video playlist
- [x] 4.1 `video_progress` table + API (seconds actually watched, last position, duration cache)
- [x] 4.2 Player with the IFrame API: playlist sidebar, thumbnails, states, autoplay next with a 5 s countdown + cancel, a remembered preference
- [x] 4.3 Topic lock until every video is watched (admin can relax it to a warning), "Videos x of y watched", leave prompt, course video totals
- [ ] 4.4 Tests + checkpoint + commit `feat(v4.3-p4)`

## Phase 5: Fair course tests
- [ ] 5.1 Grounding source per topic (summary, sections, notes, transcript status)
- [ ] 5.2 Generator (Sonnet 5.5) with citations and objectives + quality gates (relevance, answerability, not trivial, distractors, code, timing)
- [ ] 5.3 Item calibration (pass rates, flags, auto-retire) + admin Course → Test items
- [ ] 5.4 Background re-check of existing tests (retire + regenerate, counts)
- [ ] 5.5 Tests + checkpoint + commit `feat(v4.3-p5)`

## Phase 6: Admin simplicity
- [ ] 6.1 Learner page top bar: status, next action, one primary button
- [ ] 6.2 Bulk onboarding by paste, with AI prefill in a review table
- [ ] 6.3 Advanced sections, duplicate fields removed, help text kept to one line, search and filters, confirm and Undo
- [ ] 6.4 Click counts before and after
- [ ] 6.5 Checkpoint + commit `feat(v4.3-p6)`

## Phase 7: Tests, deploy, report
- [ ] 7.1 Unit and integration tests (the list in the brief)
- [ ] 7.2 Playwright e2e `scripts/e2e/v43-*.ts`
- [ ] 7.3 Deploy + smoke (Abhishek runs the one command)
- [ ] 7.4 RESULTS.md + chat summary
- [ ] 7.5 Tag v4.3.0

## Needs Abhishek
- The deploys for v4.1 and v4.2 are still outstanding.
