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
- [x] 2a Research → `PM_RESEARCH.md` + verified sources
- [x] 2b Skills + courses (13 areas, B→I→A), generic theory relabelled and ranked last, default PM priorities
- [x] 2c Task components: Excel grid (formula engine), email, meeting, explain-it, Keka/Teams sim, Git PR, resource allocation
- [x] 2d PM bank items for new skills; personalisation applies to PMs
- [x] 2e Existing PM learners mapped; paths rebuilt with defaults unless sliders set
- [x] Checkpoint + commit `feat(v4.1-p2)`

## Phase 3: Tests, deploy, verify
- [x] Tests (1d, task graders, course schema + verification timestamps, PM defaults, PM path order)
- [x] Playwright e2e: PM with description; Engineering with description
- [ ] Deploy (one command) + smoke + AI usage check — the user runs `cd ~/oyelearn && git pull && docker compose up -d --build`; then check /admin/ai-usage
- [x] RESULTS.md + chat summary
- [x] Tag v4.1.0

## Needs Abhishek
- **Real AI cost per personalised assessment:** estimated ≈ $0.07 (target ≤ $0.15); read the actual on /admin/ai-usage after deploy.
- **56 `[Oyelabs SOP – admin to fill]` blocks** across the 13 agency PM courses (Keka timesheet/leave/PSA billing and rate cards, meeting cadence and MoM template, email templates and signature, support SLAs, time-zone overlap, AI tool rules). Fill them at **Admin → Company SOPs** (`/admin/sop`); learners see them on the topic.
- Keka PSA has no per-feature public videos; short screen recordings from our own Keka would improve those topics.
- Agency-specific material with no outside source (fixed-bid vs T&M wording, white-label resellers) is covered only through SOP blocks.

## Notes
- Phase 2: 13 agency PM courses, 90 topics, 691 quiz questions, 247 verified reading links and 183 verified videos (each with `verifiedAt`; all 1,644 curriculum videos pass oEmbed), 90 hands-on practices (excel 14, write 17, sim 13, spot 16, scenario 14, rank 7, calculate 7, allocate 2). 156 validated PM bank items for the 13 new skills. Spreadsheet engine gained MAX/MIN/COUNTA. Existing PM progress untouched: the old topics keep their ids and sit last on the trail as "PM foundations and advanced theory".
- Server for 1a/1b.6/1c done (preview endpoint, swap/regenerate, timing capture, calibration, est-vs-actual API); UI in progress.
- 2c server done: task kinds excel (fast-formula-parser + SUMIFS/COUNTIFS/AVERAGEIFS/XLOOKUP/MATCH), allocate, sim; write variants email/explain; graders tested. 2b catalog: 14 agency PM skills with default sliders; PM paths open with the diagnostic refresh; defaults applied once to PM learners with no sliders.
