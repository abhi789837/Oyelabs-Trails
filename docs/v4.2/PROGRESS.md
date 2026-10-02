# v4.2 progress: Agency PM Processes Academy

Resume from the first unticked item. Plan: `docs/v4.2/PLAN.md`. Decisions: `docs/v4.2/DECISIONS.md`.

## Step 0
- [x] Earlier progress checked. v4: 9.3 had been built and tested (box ticked), and 10.4/10.5 were done by Abhishek. v4.1: only the deploy is left, which Abhishek runs.
- [x] Checkpoint tag `pre-v4.2`

## Phase 1: Research and ingest
- [x] 1.1 Ingest `docs/oyelabs-process/`. The folder is missing, so this is logged under Needs Abhishek.
- [x] 1.2 External research → `RESEARCH.md` + `sources-*.json` (verified links and videos per topic)

## Phase 2: Process Handbook
- [x] 2.1 Shared schema + DB (terms, stages, rules, templates) + seed loader
- [x] 2.2 Seed ≥150 terms (all fields), stages, rules, templates
- [x] 2.3 Admin editor `/admin/handbook` (unconfirmed first, confirm, edit, add, archive)
- [x] 2.4 Glossary page + term tooltips in course content (`[[term:id]]`)
- [x] 2.5 Decision tool (bug / enhancement / CR / new feature / support), standalone + in courses
- [x] 2.6 Checkpoint + commit `feat(v4.2-p2)`

## Phase 3: Courses A–E
- [x] 3.1 Course A (custom lifecycle), 16 modules
- [x] 3.2 Course B (white-label)
- [x] 3.3 Course C (terminology) + flashcards, 8 modules incl. the 20-request drill
- [x] 3.4 Course D (meetings)
- [x] 3.5 Course E (templates) + DOCX/XLSX template library
- [x] 3.6 Registry, catalog skills, checkpoint + commit `feat(v4.2-p3)`

## Phase 4: Simulations
- [x] 4.1 AI client role-play (personas, scenarios, 8 turns, Haiku, rubric, cost cap)
- [x] 4.2 Task kinds: classify, order (rank), CR form, MoM from transcript, status report, spot-the-gap, gap analysis
- [x] 4.3 Checkpoint + commit `feat(v4.2-p4)`

## Phase 5: Assessment, priorities, paths
- [x] 5.1 New PM default priorities
- [x] 5.2 Bank items for new skills with handbook citations; re-validation when a term changes
- [x] 5.3 Generation grounded in the handbook (citations required)
- [x] 5.4 PM path order + Advanced unlock; BD optional catalog
- [x] 5.5 Checkpoint + commit `feat(v4.2-p5)`

## Phase 6: Tests, deploy, report
- [x] 6.1 Tests (handbook end-to-end, decision table ≥30, simulations, role-play caps, schema, ≥150 terms, defaults, path, PM assessment)
- [x] 6.2 Playwright e2e
- [ ] 6.3 Deploy (Abhishek runs the one command) + smoke — Needs Abhishek
- [x] 6.4 RESULTS.md + chat summary
- [x] 6.5 Tag v4.2.0

## Session 2 (resume) notes
- PROGRESS was behind the code: research, Course B/D/E, role-play, bank (70 cited items), grounding, re-validation, path order and Advanced unlock were already built but unticked and uncommitted. Audited and ticked.
- Fixed: 16 form fields missing `required` (type errors in pmp-a11, a12, c06); two stale tests (v4.1 trail order now has the academy first; grounded role-play may come from the seeded bank).
- `polyglot.test.ts` java case times out only under full-suite load on the local Piston; passes alone. Not a v4.2 change.

## Needs Abhishek
- Deploy and smoke-test (RESULTS.md → Deploy), then push tag `v4.2.0`.
- Confirm the top-20 handbook items listed in RESULTS.md.
- `docs/oyelabs-process/` does not exist, so no Oyelabs material was ingested. Every handbook entry starts as "industry standard – to confirm". Add the documents and re-run Phase 1.1, or confirm and edit the entries at `/admin/handbook`.

## Notes
- Handbook: 151 terms, 25 stages, 22 rules, 13 templates, all `to-confirm`, with verified sources. Admin editor at /admin/handbook; glossary, tooltips, decision tool (33-case table), flashcards, live stage/rule/template cards on topics (`handbook` field) and guide `sections` on topics.
- Research done for A/C (pending), B and D/E (`sources-*.json`, `research-*.md`).
- New PM defaults and a one-time migration (`applyV42PmDefaults`) for untouched v4.1 learners.
