# UI overhaul state

My memory across sessions for the UI modernisation. Resume from the first unchecked step.
Update after every completed step with what was done, the commit hash, and known gaps.

Branch: **`ui-overhaul`** (cut from `main` at `2e402f6`). `main` is what the live deployment at
`learn.oyegen.com` runs, so nothing here reaches it until the branch is merged deliberately.

## What must not regress

The trail visuals (`TrailMap`, `ElevationProfile`, `Contours`, camps and waypoints) and the topic
learning screen (video, summary, references, challenge) are **good and stay as they are**. Only the
shared primitives underneath them get refreshed. Screenshot both before and after every step.

The **assessment runner and proctoring screen stay calm**: functional transitions only, no
background effects, no confetti. MediaPipe needs the CPU and the learner needs focus.

## Baseline (recorded at U0)

| | Version |
| --- | --- |
| React | 18.3.1 |
| Tailwind | 3.4.19 (+ tailwindcss-animate 1.0.7) |
| Motion | framer-motion 13.4.0 |
| Vite | 8.3.0 |
| Radix packages | 7 |
| Tests | 289 passing |

Not yet installed: `@tanstack/react-table`, `@dnd-kit/*`, `cmdk`, `sonner`, `recharts`,
`date-fns`, `react-day-picker`, Playwright.

## Steps

- [x] U0 Audit — inventory written to `docs/UI_COMPONENTS.md`; `scripts/ui/screens.mjs` written.
      **Before-screenshots not yet captured** — they need the dev server plus seeded learners, and
      the two local dev servers were reaped for low memory earlier in the session. Capture them
      before U2 starts changing primitives, or the baseline is lost.
      **This did not happen — U2 ran without them.** The U12 after-shots therefore have no
      before-shot to compare against; capture a set from `main` if a true diff is ever needed.
- [x] U1 Foundation — done in three commits: `0d03d33` motion, `1f5a3cb` React 19, Tailwind v4.
      Registries still to add to components.json when U2 first needs one.
- [x] U2 Tokens and primitives — `src/lib/motion.ts` (durations, easings, one spring, `fadeUp` /
      `scaleIn` / `fieldMessage` / `stagger`); `Button` gained `loading` (fixed width), a press
      scale, two icon sizes and `-strong` focus rings; `Badge` gained `danger` and `brand`; **one
      `StatusBadge`** covering all eight status enums replaced a dozen ad-hoc pills across 10
      files; `Card` gained two elevations, tones and density; `Input` gained addons and a clear
      button, plus new `PasswordInput` (strength meter + toggle), `NumberInput` and `TagInput`.
      Gates green: typecheck, **300 tests** (289 + 11 new), build, content:check.
      Known gaps: **no before-screenshots existed**, so "the trail did not move" is argued from the
      diff rather than proven — `components/trail/` has one changed file (`TopicStatusBadge`, whose
      class output is byte-identical) plus a `StatusDot` label dedupe, and `src/pages/` is
      untouched. `TagInput` has no call site yet, and `ChallengeResult`'s spring was deliberately
      left un-migrated so the topic page's checkmark keeps its overshoot (see PROGRESS.md).
- [x] U3 Overlays — `useConfirm`/`useFormDialog`/`DetailSheet`, sonner, eslint `no-alert`. All nine native dialogs gone; zero `window.confirm` left in app code.
- [ ] U4 DataTable kit + server query layer, with tests
- [ ] U5 Shell — top bar, notification centre, user menu, command palette, sidebar
- [ ] U6 Auth screens
- [ ] U7 Admin — overview, people, onboarding
- [ ] U8 Admin — learner detail tabs, assessments, live
- [ ] U9 Admin — AI connection, integrity, audit, curriculum browser
- [ ] U10 Learner — pre-flight, runner, evaluating, plan filters, dashboard, certificate
- [ ] U11 Quality — accessibility, responsive, dark mode, performance, Lighthouse, delete superseded components
- [ ] U12 After screenshots + `docs/UI_REPORT.md`

## Gates after every step

`npm run typecheck` · `npx vitest run` · `npm run build` · `npm run content:check` — all green
before the commit. Commit message: `ui: <step>`.

## Blocked / needs Abhishek

- **Before-screenshots not captured.** The harness (`scripts/ui/screens.mjs`) and Playwright are
  installed and ready, but this machine had **1.3 GB free of 16.9 GB (8%)** when U0 finished, and
  two dev servers had already been reaped for memory pressure. Chromium plus Vite plus the API
  would not survive. Run it when the machine is quiet:

  ```
  npm run dev                       # one terminal
  npm run dev:seed                  # note a learner's username and password
  UI_ADMIN_PASSWORD=... UI_LEARNER_USERNAME=... UI_LEARNER_PASSWORD=...     node scripts/ui/screens.mjs before
  ```

  **Do this before U2 changes primitives**, or the baseline that proves the trail visuals did not
  regress is gone. Until then, "did the trail page move?" is unanswerable.
