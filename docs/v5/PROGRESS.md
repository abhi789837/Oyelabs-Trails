# v5 progress

Resume from the first unticked item. Decisions are in `DECISIONS.md` and research in `RESEARCH.md`.

## Step 0
- [x] v4.4 finished: Phase 7 tests, RESULTS.md, tag `v4.4.0` (deploy = Needs Abhishek)
- [x] Checkpoint tag `pre-v5`
- [x] 0.1 Research (extend the brief's table; verified links; library status, licences, alternatives) → `RESEARCH.md`
- [x] 0.2 Baseline: screenshots + click counts of the current UI (learner open → inside next step; admin onboard+send; approve review)
- [x] 0.3 `ui_v5` feature flag (per user + global) and the v5 route shell, old UI untouched

## Phase 1: Design system v2 and `/design`
- [x] 1.1 Tokens: brand 50–950, semantic, lanes, surfaces (light/dark), Sora + body + mono fonts, type scale, spacing, radius, shadows, motion, density
- [x] 1.2 Libraries installed and lazy-loaded per the research
- [x] 1.3 Components (shell, nav, cards, tiles, progress, trail, lane chip, skill meter, streak, XP, states, toasts, dialogs, sheets, palette, table, status line, lesson parts, tutor panel, flashcard, certificate preview)
- [x] 1.4 `/design` living style guide (admins only)
- [x] 1.5 Performance budgets enforced (size-limit, Lighthouse CI config)
- [x] 1.6 Gates + commit `feat(v5-p1)`

## Phase 2: Learner home "Today" (`/learn`)
- [x] 2.1 Hero Continue (exact step + video position), this week mini trail, goal ring, weekly streak with freezes
- [x] 2.2 Up next (3, with why chips), daily review (FSRS), recent wins, pinned notes
- [x] 2.3 Mobile bottom nav: Today · My plan · Library · Review · Me
- [x] 2.4 Gates + commit `feat(v5-p2)`

## Phase 3: Lesson experience
- [x] 3.1 Lesson player + stepper (Watch, Read, Do, Check), Next gating, autosave/resume, focus mode, shortcuts, report a problem
- [x] 3.2 Watch: playlist, chapters, transcript, captions, speed, timestamped notes, quick check pop-in
- [x] 3.3 Read: article view, takeaways, callouts, glossary tooltips, runnable code, last verified
- [x] 3.4 Do: split view, hint ladder, Check with per-test feedback; non-code Do steps
- [x] 3.5 Check: grounded topic test in the calm UI with explanations
- [x] 3.6 Ask Oye tutor (grounded, Socratic, off in assessments, Haiku, cached, daily cap, 👍/👎 to admin report)
- [x] 3.7 Gates + commit `feat(v5-p3)`

## Phase 4: My plan, Library, Review, Me
- [x] 4.1 My plan polish
- [x] 4.2 Library + course page (outcomes first, prerequisites ticks, last verified)
- [x] 4.3 Review: FSRS flashcards, interleaved practice, Fix my mistakes
- [x] 4.4 Me: skill levels, cases, certificates (PDF, LinkedIn), XP/streak history, notes, settings
- [x] 4.5 Gates + commit `feat(v5-p4)`

## Phase 5: Assessments, results, certificates
- [x] 5.1 Assessment UI (navigator, overall clock, autosave, runs, Speak/writing, calm proctoring) at 390 and 1440
- [x] 5.2 Results story, per-goal levels, reviewable questions, Request review, "Your plan is ready"
- [x] 5.3 Certificate redesign with verification URL/QR, PDF + share image
- [x] 5.4 Gates + commit `feat(v5-p5)`

## Phase 6: Motivation
- [x] 6.1 XP rules (cases highest), weekly goal + streak + freezes, opt-in leaderboards (admin, off by default)
- [x] 6.2 Celebrations (≤2 s, skippable, reduced motion)
- [x] 6.3 Notifications: in-app, weekly email recap, optional reminder, quiet hours, ≤1/day
- [x] 6.4 First-run welcome (3 steps, skippable, revisit from Me)
- [x] 6.5 Gates + commit `feat(v5-p6)`

## Phase 7: Admin
- [x] 7.1 Shell + ⌘K + shortcuts
- [x] 7.2 "Needs your attention" inbox
- [x] 7.3 Overview tiles + cohort chart + CSV
- [x] 7.4 People table with saved views, bulk, side sheet
- [x] 7.5 Library & content: status, preview as learner, source health, Tiptap block editor, version history
- [x] 7.6 Reports + CSV + optional weekly email
- [x] 7.7 Gates + commit `feat(v5-p7)`

## Phase 8: Mobile, accessibility, polish
- [x] 8.0 Fix the browser code runner blocked by the production CSP (old topic "Run visible tests" and v4 snippet runs are broken live); lesson route over budget (291 KB gz) and the shared 54 KB vendor chunk
- [x] 8.1 Mobile: learner screens, coding tabs + "send to my email", admin tablet/phone
- [x] 8.2 WCAG 2.2 AA + axe on every main route
- [x] 8.3 Skeletons, optimistic updates, error boundary, icons, installable PWA with offline Review
- [x] 8.4 Gates + commit `feat(v5-p8)`

## Phase 9: Quality gates, switch-on, report
- [x] 9.1 Playwright journeys (learner + admin), visual snapshots 390/768/1280/1440 light+dark, axe, Lighthouse CI, bundle limits
- [x] 9.2 Heuristic review → `UX_REVIEW.md`; fix high/medium
- [x] 9.3 Click counts before/after
- [x] 9.4 `ui_v5` on by default; "Use previous design" for 2 weeks (logged)
- [x] 9.5 Deploy + smoke (Abhishek ran it, 2026-10-06; v5.0.1 pushed after)
- [x] 9.6 RESULTS.md + chat summary; tag `v5.0.0`

## Needs Abhishek
- Lighthouse CI is configured (`npm run lhci`, `lighthouserc.cjs`) but needs a running server and a staff login (`LHCI_BASE_URL`, `LHCI_USERNAME`, `LHCI_PASSWORD`); it runs in Phase 9 locally.
