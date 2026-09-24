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
- [ ] U1 Foundation — framer-motion → motion, React 19, Tailwind v4, registries in components.json
- [ ] U2 Tokens and primitives — buttons, inputs, badges, cards, `src/lib/motion.ts`
- [ ] U3 Overlays — `useConfirm`, `useFormDialog`, `DetailSheet`, sonner, no-alert lint rule
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

_(nothing yet)_
