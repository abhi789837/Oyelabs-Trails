# v4.4 progress

Resume from the first unticked item. Decisions are in `DECISIONS.md`, research in `RESEARCH.md`, the shared contracts in `PLAN.md`.

## Step 0
- [x] Earlier progress checked: v4.1 and v4.2 deploys are done (the live site runs v4.3); nothing else open.
- [x] Checkpoint tag `pre-v4.4`
- [x] 0.1 Research notes (P1–P6) + code map → `RESEARCH.md`, `PLAN.md`

## Phase 1: Nothing in the description gets dropped
- [x] 1.1 Intent extraction: every intent with phrase, type, goal, skills, level, priority (Haiku, cached, mock)
- [x] 1.2 Bundles in the DB (admin-editable): "full stack" for frontend, "soft skills" for engineers, …
- [x] 1.3 Coverage check in code; unmapped phrase → closest catalog item or "We weren't sure…" with 2–3 options; blocks Save
- [x] 1.4 Downstream guarantees: every intent has ≥1 assessment item and ≥1 path item or a reason; reference-case test
- [x] 1.5 Checkpoint + commit `feat(v4.4-p1,p2)` (bulk Unsure answers + showing "Already strong" reasons → P6)

## Phase 2: Soft skills area and catalog
- [x] 2.1 Soft-skills area assignable to any department; 10 skills; spoken English levels A2→C1
- [x] 2.2 Courses per skill (verified readings + video, summary, doing-practice, grounded test, certificate); eng vs client examples
- [x] 2.3 Soft-skills practical cases in the library
- [x] 2.4 Checkpoint + commit `feat(v4.4-p2)`

## Phase 3: Speak and communication items
- [x] 3.1 Whisper container (internal, rate-limited) + transcription client + speed measured
- [x] 3.2 Speak item: prep 20 s, speak 60–90 s, one re-record, MediaRecorder upload, metrics, rubric → English level + pass
- [x] 3.3 Mic consent on the consent screen; written fallback flagged for admin; encrypted audio, admin-only, 30-day deletion job
- [x] 3.4 Other soft-skill item types (write, rewrite tone, explain simply, order the update, scenario); timing 2.5 min, ≤2 Speak
- [x] 3.5 Checkpoint + commit `feat(v4.4-p3)`

## Phase 4: Full marks when the answer is good
- [x] 4.1 Full / Not yet model for every item kind; core vs edge tests; lenient compare; grader instructions
- [x] 4.2 Skill levels from the full/not-yet pattern
- [x] 4.3 Request review + admin override to Full (logged, feeds calibration)
- [x] 4.4 Re-score job (history kept, counts reported) + Advanced setting Full-or-not-yet / Partial credit
- [x] 4.5 Checkpoint + commit `feat(v4.4-p4)`

## Phase 5: Missing courses are created automatically
- [x] 5.1 Gap detection on path build → generate → review → publish to the library + assign (auto-publish ON)
- [x] 5.2 Failed review → "Needs a look" with a plain reason, Fix automatically / Edit
- [x] 5.3 No duplicates (reuse or extend); queue when AI or research isn't set up, resume automatically
- [x] 5.4 Plain admin notification
- [x] 5.5 Checkpoint + commit `feat(v4.4-p5)`

## Phase 6: Plain-language onboarding
- [x] 6.1 `COPY_GUIDE.md` + banned-word test over admin UI strings; fix all admin screens since v4
- [x] 6.2 Suggest progress steps with ticks
- [x] 6.3 The summary card (plan for <name>, priority drop-down, Change something, Show details)
- [x] 6.4 Learner page status line + one main button; plain errors with Show details
- [x] 6.5 Checkpoint + commit `feat(v4.4-p6)`

## Phase 7: Tests, deploy, report
- [ ] 7.1 Unit and integration tests (the brief's list)
- [ ] 7.2 Reference-case e2e `scripts/e2e/v44-reference-case.ts`
- [ ] 7.3 Deploy (Whisper container, backup) + smoke — Abhishek runs it
- [ ] 7.4 RESULTS.md + chat summary
- [ ] 7.5 Tag v4.4.0

## Needs Abhishek
- Run `scripts/deploy/whisper-model.sh` once on the server (deploy-v4.sh also does it); first build compiles whisper (~4 min).
- Re-run the Whisper benchmark on the VPS (`docs/v4.4/research/whisper-benchmark.md`); local: 75 s clip ≈ 7–9 s on 3 threads.
- Confirm any staff admin may open any learner recording (same as proctoring snapshots).
