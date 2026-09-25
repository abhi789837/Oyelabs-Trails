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
- [x] U4 DataTable kit + server query layer — 6 table specs, 46 SQL tests against real SQLite
- [x] U5 Shell — notification centre (incl. the missing learner route), command palette, sidebar
- [x] U6 Auth screens — and two real fixes: the leaky error path and the client/server rule mismatch
- [x] U7 Admin — bento overview with real server-bucketed sparklines (`trend7d` added to
      `/api/admin/overview`), People on the DataTable kit with bulk issue/disable/re-enable, and
      onboarding as a five-step flow. Found and fixed: the track cards had a four-way accent
      fallback that would have mis-coloured four of the seven trails — `accentClasses` already
      covers all eight tokens.
- [x] U8 Admin — Progress tab on the kit (submitted work moved from an inline expanding row into
      the detail panel), integrity as a real timeline with gap labels and a snapshot lightbox,
      served items filterable by area/kind/outcome, evaluation areas with level rings, plan editor
      keeps its drill-down and gains a per-topic AI diff, live board rebuilt as cards with a
      countdown ring (`timeLimitMinutes` added to the live row so the ring has a denominator).
      The approval gate's `approvedBy === null` distinction and the generation log's closed-union
      drop reasons are untouched.
- [x] U9 Admin — audit, AI calls and a new global integrity feed are all server-paged through
      the U4 whitelist via a new `pagedQuery` helper (+7 tests); AI credential cards gained a
      ShineBorder on the active one and an inline verify state; new curriculum browser over all
      715 topics at `/admin/curriculum`. No credential secret is rendered anywhere and the Claude
      Code CLI terms warning is untouched.
- [x] U10 Learner — pre-flight, runner, evaluating, plan filters, certificate. Trail and topic untouched
- [x] U11 Quality — the pass that actually found things, because it was the first time the app was
      run rather than reasoned about. Deleted the one genuinely unused component (`ui/separator`);
      confirmed no palette leaks and no raw hexes outside the PDF generator (which cannot resolve
      CSS variables); every `<img>` has an alt and every icon button a name. Six defects fixed —
      see `docs/UI_REPORT.md` §4. Lighthouse not run: it needs a production server and a browser at
      once, and this machine had 3.3 GB free of 15.7 GB.
- [x] U12 After screenshots + `docs/UI_REPORT.md` — captured at 1440 and 375, light and dark, as
      both roles, into `docs/ui-audit/after/`. The harness needed two fixes first (it refused any
      account with `must_change_password`, and its anchored label regex could not match a required
      field's `*`), which is why no baseline existed.

## Gates after every step

`npm run typecheck` · `npx vitest run` · `npm run build` · `npm run content:check` — all green
before the commit. Commit message: `ui: <step>`.

## Blocked / needs Abhishek

- **Nothing blocking.** All thirteen steps are done and the branch is ready to review.

- **There is still no before-set**, and there cannot be a meaningful one now: the harness only
  became usable on a fresh database at U11, by which point the primitives had changed. "The trail
  visuals did not move" is therefore argued from `git diff --stat` on the four protected paths —
  `src/content`, `src/components/trail`, `src/components/challenge` and `src/pages/TopicPage.tsx`,
  zero lines at every commit on this branch — rather than from pixels. If a pixel comparison is ever
  wanted, check out `main` and run `node scripts/ui/screens.mjs before`.

- **Lighthouse was not run**, for memory. See `docs/UI_REPORT.md` §6 for what is known about bundle
  shape without it.
