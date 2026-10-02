# Oyelearn v4.1 — progress

Spec: `OYELEARN_V4_1_PROMPT.md`. Decisions: `DECISIONS.md`. Resume from the first unticked item.

## Step 0: v4 status
- [x] v4 phases 1–9 and 10.1–10.3/10.6/10.7 done (`v4.0.0`). 10.4 deploy + 10.5 path rebuild are on the server (no SSH from this machine); the one-command deploy was handed over and run by Abhishek.

## Phase 1: AI-personalised assessments
- [x] 1a Description field (≤600 chars) on Setup + "How the AI understood this" (intent bullets + planned split) + Regenerate
- [x] 1b.1 Intent call (Haiku, cached system prompt) → intent, themes, 25-slot blueprint; allocation enforced in code
- [x] 1b.2 Bank reuse per slot (skill/type/language/difficulty/context tags, unseen); personalisation High/Balanced/Low
- [x] 1b.3 Generation (Sonnet, 2–3 batched calls, cached prompts, learner context)
- [x] 1b.4 Validation: coding tests, MCQ snippet output, text-MCQ Haiku check, task keys/calculations, timing; ≤2 regenerations then bank
- [x] 1b.5 Save on attempt, add validated items to bank with tags, cost per stage logged
- [x] 1b.6 Admin preview: est. minutes + AI cost; swap/regenerate one item
- [x] 1c Timing: size limits, deterministic estimate, 26–32 min total, real-time capture, calibration job, admin est-vs-actual chart, "Finished in (est.)"
- [x] 1d Tests (allocation, skip, broken key, timing, reuse ratio, cost log, AI-unavailable fallback)
- [x] Checkpoint + commit `feat(v4.1-p1)`

## Phase 2: Agency PM curriculum
- [ ] 2a Research → `PM_RESEARCH.md` + verified sources
- [ ] 2b Skills + courses (13 areas, B→I→A), generic theory relabelled and ranked last, default PM priorities
- [ ] 2c Task components: Excel grid (formula engine), email, meeting, explain-it, Keka/Teams sim, Git PR, resource allocation
- [ ] 2d PM bank items for new skills; personalisation applies to PMs
- [ ] 2e Existing PM learners mapped; paths rebuilt with defaults unless sliders set
- [ ] Checkpoint + commit `feat(v4.1-p2)`

## Phase 3: Tests, deploy, verify
- [ ] Tests (1d, task graders, course schema + verification timestamps, PM defaults, PM path order)
- [ ] Playwright e2e: PM with description; Engineering with description
- [ ] Deploy (one command) + smoke + AI usage check
- [ ] RESULTS.md + chat summary
- [ ] Tag v4.1.0

## Needs Abhishek

## Notes
- Server for 1a/1b.6/1c done (preview endpoint, swap/regenerate, timing capture, calibration, est-vs-actual API); UI in progress.
- 2c server done: task kinds excel (fast-formula-parser + SUMIFS/COUNTIFS/AVERAGEIFS/XLOOKUP/MATCH), allocate, sim; write variants email/explain; graders tested. 2b catalog: 14 agency PM skills with default sliders; PM paths open with the diagnostic refresh; defaults applied once to PM learners with no sliders.
