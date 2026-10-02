# Oyelearn v4 — progress

Spec: `OYELEARN_V4_MASTER_PROMPT.md` (repo root). Resume from the first unticked item.
Decisions: `docs/v4/DECISIONS.md`. Audit: `docs/v4/AUDIT.md`. Plan: `docs/v4/PLAN.md`.

## Phase 1: Audit and plan
- [x] 1.1 AUDIT.md: routes/pages, data model, AI calls, assessment, courses, proctoring, weekly plan, builder, deploy
- [x] 1.2 Token baseline in AUDIT.md
- [x] 1.3 RESEARCH.md: sandbox (Piston vs Judge0), Anthropic cost controls, PM/BD sources
- [x] 1.4 PLAN.md
- [x] 1.5 Checkpoint + commit `feat(v4-p1)`

## Phase 2: Departments foundation
- [x] 2.1 Schema: departments, tracks, skills (+ course level, skill links), migration
- [x] 2.2 Seed Engineering/PM/BD + their tracks; migrate learners to Engineering
- [x] 2.3 Learner department + track; department-aware wording
- [x] 2.4 Department filter on People, Curriculum, Courses, Generated
- [x] 2.5 /admin/departments (add, rename, reorder, archive departments/tracks/skills)
- [x] 2.6 Checkpoint + commit `feat(v4-p2)`

## Phase 3: Admin learner setup
- [x] 3.1 learner_priorities (slider 1–5, order) + learner_skip; migrate builder settings + targets
- [x] 3.2 Setup tab / onboard screen (pickers, stack/tools, experience/level, skill picker + sliders, skip, hours, summary)
- [x] 3.3 Skill request (pending skill) flow
- [x] 3.4 Tabs merged: Setup · Assessment · Path · Library · Progress · Account
- [x] 3.5 Path tab results-only
- [x] 3.6 Priority rule enforced + tests
- [x] 3.7 Checkpoint + commit `feat(v4-p3)`

## Phase 4: New assessment format
- [x] 4.1 Shape: ≤25 (18 hands-on + 7 MCQ), 30 min target, 50 min hard cap, auto-submit, free nav, navigator, clock
- [x] 4.2 Min-time-before-finish admin setting (off)
- [x] 4.3 "I don't know yet" on every question
- [x] 4.4 Monaco editor (lazy), Run (3 max, server-enforced), auto-submit on 3rd run, autosave
- [x] 4.5 Hidden-test grading with partial credit (no LLM)
- [x] 4.6 Multi-language execution: JS/TS worker; sandbox service for Python/PHP/SQL/Java/Dart
- [x] 4.7 MCQ code snippets runnable (shared counter)
- [x] 4.8 Proctoring whitelist for editor; outside paste flagged; tests
- [x] 4.9 Results by priority skill
- [x] 4.10 Checkpoint + commit `feat(v4-p4)`

## Phase 5: Question bank
- [x] 5.1 question_bank table + migration
- [x] 5.2 Deterministic assembler (no LLM)
- [x] 5.3 Engineering seed (subagents) + sandbox validation
- [x] 5.4 Gap-fill background job
- [x] 5.5 /admin/question-bank
- [x] 5.6 Auto-retire by stats
- [x] 5.7 Checkpoint + commit `feat(v4-p5)`

## Phase 6: AI cost control
- [x] 6.1 server/ai/router with task types + admin-configurable models
- [x] 6.2 Model IDs read from API at startup
- [x] 6.3 Prompt caching, max_tokens caps, compact context
- [x] 6.4 Batch API for bulk jobs
- [x] 6.5 Call log with tokens/cost; Admin → AI usage page; budget 80% warn / 100% pause
- [ ] 6.6 RESULTS.md before/after
- [ ] 6.7 Checkpoint + commit `feat(v4-p6)`

## Phase 7: PM and BD curricula
- [x] 7.1 Research + verified sources (RESEARCH.md)
- [ ] 7.2 Task components: Write, Rank, Calculate, Scenario, Spot the issue (+ graders)
- [x] 7.3 PM skills + courses (4 levels)
- [x] 7.4 BD skills + courses (4 levels)
- [ ] 7.5 PM/BD question bank + tasks
- [ ] 7.6 CURRICULUM.md
- [ ] 7.7 Checkpoint + commit `feat(v4-p7)`

## Phase 8: Path, plan, generation for all departments
- [x] 8.1 Part 1 / Part 2 / rest ordering per department
- [x] 8.2 Builder + weekly plan department-aware
- [ ] 8.3 Generated courses same blueprint; Save to library
- [ ] 8.4 Checkpoint + commit `feat(v4-p8)`

## Phase 9: User management
- [x] 9.1 Audit existing suspend/archive/delete; fill gaps
- [x] 9.2 Export before delete, anonymised audit, last-superadmin guard
- [ ] 9.3 Bulk actions on People; sessions revoked on every action
- [ ] 9.4 Checkpoint + commit `feat(v4-p9)`

## Phase 10: Polish, tests, deploy
- [ ] 10.1 Test suite items (see spec)
- [ ] 10.2 Playwright e2e per department
- [ ] 10.3 UI pass (light/dark, 390/1440, reduced motion)
- [ ] 10.4 Deploy (backup, migrate, code-runner container)
- [ ] 10.5 Rebuild existing learners' paths
- [ ] 10.6 RESULTS.md + chat summary
- [ ] 10.7 Tag v4.0.0

## Needs Abhishek
- **No SSH access to the production server** (169.58.125.156 / learn.oyegen.com): publickey denied for root/ubuntu/abhishek from this machine. Deploy steps are prepared as a script; running them needs server access.

## Notes
- P1: PM/BD source research (`RESEARCH_PM_BD.md`, `sources-pm-bd.json`) still running in a subagent at commit time; it is consumed in Phase 7 and committed then.
- Piston test container `piston_test` runs locally on 127.0.0.1:2000 (volume `piston_packages`) — used by bank validation and e2e.
- P2: department/catalog server + client done. The People/Curriculum/Courses/Generated filters ship; the AI calls table filter waits for Phase 6 (it needs a server param). Skill catalog: engineering 270, PM 85, BD 78 skills.
- P2 commit also carries Phase 3 server groundwork (slider + skip tables, migration 0014, setup repo + routes, `issueAssessment` extraction, `shared/setup.ts` mix allocator, `shared/tasks.ts`) because boot depends on it; Phase 3 client follows.
- P3 done: Setup screen shared by onboarding and the learner page; tabs Setup · Assessment · Path · Library · Progress · Account; results-only Path tab; slider/skip single source with v3 readers as projections (fixes the weekly plan reading stale `must_have`); priority rule tests in `builder/priorityRule.v4.test.ts`.
- P3 commit also carries the Phase 4 server engine (bank schema 0015, assembler, polyglot runner + Piston, v4 sheet/run/submit/finish routes, deterministic evaluation) and the first validated bank files; v4 client + remaining bank seeds follow in P4/P5.
- `server/src/sandbox/polyglot.test.ts` Java case can time out while other processes load the local Piston; passes alone.
- Server status (mid-run): v4 engine, bank, router/batches/budget, department-aware path (D6/D7), bulk user actions and anonymised deletion are implemented with tests. Client work in flight: v4 assessment UI + task components + proctoring (4.4, 4.7, 4.8, 4.9), admin bank/AI-usage/routing pages (5.5, 6.5 UI). Bank seeding: engineering 27 skills, PM 42+ skills, BD 37+ skills validated so far.
- Course generation is still synchronous per lesson (routed, capped, cached); only bank fills use the Batch API. See RESULTS.md for the cost consequence.
- P4 committed: v4 sheet UI (navigator, one clock, Monaco + Run x3, runnable MCQ snippets, task components, "I don't know yet"), Monaco-aware proctoring whitelist with tests, report by skill. The same commit carries the server work already done for P5 (bank admin API, stats, fill job), P6 (router, batches, budget, usage), P8 (department-aware parts, catalog attach) and P9 (bulk actions, anonymised deletion), plus the admin bank/usage/routing pages and the PM/BD curricula; the per-phase commits that follow add what remains of each.
- P5 committed: validated seed bank — engineering 37 skills (core + Java/Dart), PM all 85 skills (775 items), BD all 78 skills (707 items). Java grading retries a run that timed out with no output (busy-runner JVM start). A further 24 engineering major-stack skills are being seeded and land with Phase 7/10.
