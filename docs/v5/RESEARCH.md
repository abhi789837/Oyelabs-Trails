# Oyelearn v5: research (step 0.1)

Researched 2026-10-05. Every link below was fetched and loaded during this research, unless it is marked **(unverified)**.
Version and date figures come straight from the npm registry (`registry.npmjs.org/<pkg>`) and the GitHub REST API (`api.github.com/repos/<repo>`), both queried on 2026-10-05.
Gzip sizes come from bundlephobia (`bundlephobia.com/api/size`). Where bundlephobia rate-limited the request (429), the size is marked "n/m" (not measured).

## 0. Before reading: the brief's stack description is out of date

The brief describes the stack as "React 18, Tailwind 3, framer-motion". The repo (`package.json` and `node_modules`, checked today) is actually on:

| Item | Brief says | Repo actually has |
|---|---|---|
| React | 18 | **19.3.0** |
| Tailwind | 3.4 | **4.3.3** (`@tailwindcss/postcss`) |
| Animation | framer-motion | **`motion` 13.4.2**, with 46 imports from `motion/react` (framer-motion is only a transitive dependency) |
| Router / Vite | RR7 | react-router-dom 7.18.4, **Vite 8.3**, Vitest 5 |
| Editor | Monaco | raw **`monaco-editor` 0.57** with Vite `?worker` imports (not `@monaco-editor/react`) |
| Table | TanStack Table v8 | `@tanstack/react-table` ^8.21.3 (v9 is now stable) |
| Already present | — | cmdk 1.1.1, sonner 2.0.8, lucide-react 1.47, Radix primitives, `tailwindcss-animate` 1.0.7, fontsource Sora + IBM Plex Sans/Mono, own YouTube IFrame API hook (`src/components/trail/useYouTubePlayer.ts`), shadcn `sheet.tsx` and `command.tsx` |

As a result, the brief's "stay on Tailwind 3 or move to 4?" and "is the framer-motion to motion move just a rename?" questions are already settled; see section 6.

---

## 1. Platform patterns

| Platform | Evidence (fetched) | What learners love | What they hate | What we copy, adapted for Oyelearn |
|---|---|---|---|---|
| **Duolingo** | [Duolingo blog: streak](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) | Streaks drive habit through loss aversion. Streak Freezes ("slack" in the goal) are *more* motivating than rigid rules. Measured results: +1.7% D7 retention from streak animations; learners who reach a 7-day streak are 3.6x more likely to complete the course. | Streak anxiety and guilt-trip notifications (well known, not sourced here) | A **weekly** streak with freezes rather than a daily one (a work tool shouldn't punish weekends), plus a short milestone celebration and at most 1 notification a day. |
| **Brilliant** | [brilliant.org/about](https://brilliant.org/about/) | "We pretest on the material, letting the learner try to find a solution before learning the procedure". One concept per lesson, visual and interactive. | Price; shallow for experts (unsourced) | Open each lesson with a **Check-first pre-question** (try it, then learn), and keep to one concept per step. |
| **Scrimba** | [SurviveJS interview](https://survivejs.com/blog/scrimba-interview/) | "Pause and edit the code at any given time… play around with the code until you understand it" | Limited catalogue outside the web stack (unsourced) | In Watch, a **"Try this now"** button at chapter marks that opens the Do split view with the code at that point. We keep YouTube, so this links out to the code rather than editing inside the video. |
| **Codecademy** | [SkillScouter review](https://skillscouter.com/codecademy-review/) | Short explanation, then immediate practice in a browser editor that checks each step; no setup | "Limited advanced content"; the jump from the guided environment to real projects feels large | **Per-test feedback in Do**, plus a final *unguided* project step in each module (the "case") so learners don't stay stuck at the guided level. |
| **Khan Academy** | Help-centre article 5548760867853 **(unverified: 403 to fetcher)**. Content taken from search snippet only. | Mastery levels Attempted / Familiar / Proficient / Mastered, with 50/80/100 points per skill. Mastered needs a unit test or course challenge. | — | A **per-skill level meter** that rises only through retrieval (the Check step and spaced Review), never from watching. |
| **Educative** | [educative.io](https://www.educative.io/) | "Learn by building, not watching… no setup, no config, no passive learning"; text-first is faster to skim | No video, which is a con for some learners ([review](https://learnopoly.com/educative-review/) **(unverified: 403)**) | The **Read step is a first-class article view** with runnable snippets, so a lesson can be done entirely without video. |
| **Udemy / Coursera** (now merged per [Coursera About](https://www.coursera.org/about)) | [MentorCruise comparison](https://mentorcruise.com/blog/coursera-vs-udemy-which-platform-actually-fits-your-goals-9f0dd/), [Harvard D3 on Udemy](https://d3.harvard.edu/platform-digit/submission/udemy-heading-towards-the-perfect-storm/), [dev.to "finished none"](https://dev.to/legacyking/i-tried-every-coding-course-i-finished-none-of-them-13nm) | Loves: cheap, huge catalogue, lifetime access, self-paced (Udemy); vetted curriculum and deadlines (Coursera) | Hates: inconsistent quality, "lack of accountability… low completion rates", "Courses end, and you're left alone"; learners hop between platforms when it gets hard | **Exact-step Continue**, a plan with due weeks, and a "next step" after every finish. Admins see learners who have stalled ("Needs your attention"). Use "last verified" stamps to counter quality drift. |
| **Boot.dev / Exercism** | [Coddy on Boot.dev](https://coddy.tech/vs/boot-dev), [Exercism mentoring docs](https://exercism.org/docs/mentoring) | Boot.dev: XP, quests, streaks, and real code in the browser. Exercism: make the tests pass, then a mentor discussion about what good code looks like. | Boot.dev: paywall, game mechanics feel distracting to some. Exercism: volunteer mentors are slow. | **XP that weights cases and Do steps highest**, with game elements kept opt-in. After a pass, show an **"exemplar / what good looks like"** reveal plus AI-tutor reflection in place of human mentors. |
| **Docebo / TalentLMS / 360Learning** (admin side) | [SelectHub TalentLMS vs Docebo](https://www.selecthub.com/lms-software/talentlms-vs-docebo/), [SoftwareAdvice Docebo vs 360Learning](https://www.softwareadvice.com.au/compare/4847/32204/docebo-lms/vs/360learning) | TalentLMS: "intuitive interface", quick adoption. Docebo: AI automation (tagging, recommendations), integrations. Both: reporting, skills tracking. | TalentLMS: users must "switch back to legacy for reports". Docebo: progress-tracking lag; harder setup and steeper learning curve per comparison write-ups (G2 page 403, so partly **unverified**). | Automation that **proposes** and an admin who approves (inbox), reports one click from every tile with CSV export, **no settings maze**: sensible defaults, onboarding in 3 steps. |

---

## 2. Learning science, mapped to UI patterns

| Principle | Evidence (fetched) | UI pattern in v5 |
|---|---|---|
| **Retrieval practice** | [retrievalpractice.org (Agarwal): why it works](https://www.retrievalpractice.org/why-it-works). "A learning strategy, not an assessment strategy"; struggle is a desirable difficulty. | Low-stakes **quick-check pop-ins in Watch**, "recall before reveal" flashcards, and Check steps that teach through their explanations. Don't put a grade on practice. |
| **Spacing** | [Carpenter, Pan & Butler 2022, *Nat Rev Psychol* 1:496–511](https://profiles.wustl.edu/en/publications/the-science-of-effective-learning-with-spacing-and-retrieval-prac/). [Optimal spacing](https://retrievalpractice.org/strategies/optimal-spacing): "no single optimal spacing interval"; any spacing beats cramming. | A **daily FSRS Review** card on Today (section 5). Plan pacing spreads a module over weeks. |
| **Interleaving** | [Rohrer et al. 2020 briefing](https://www.structural-learning.com/research-briefings/mix-it-up): 61% vs 38% one month later, d = 0.83, 787 students, but only *after* each method had first been learned on its own. | **Mixed practice in Review** pulls items across modules the learner has already finished. Never interleave first-exposure lessons. |
| **Worked examples, then faded practice** | [Worked-example effect (Sweller; Renkl fading; expertise reversal)](https://en.wikipedia.org/wiki/Worked-example_effect) | **Hint ladder** in Do: full worked example, then partial steps, then a blank editor. Experienced users (per the skill meter) can skip straight to blank, which avoids the expertise reversal effect. |
| **Cognitive load** | Same source (CLT: reduce extraneous load, avoid split attention) | One concept per step, a 4-step stepper (Watch / Read / Do / Check), focus mode, and code next to its explanation (split view) rather than on another page. |
| **Immediate, specific feedback** | [Wichita State summary of Shute 2008 and Hattie & Timperley 2007](https://www.wichita.edu/services/mrc/OIR/Pedagogy/Feedback/research.php): non-evaluative, supportive, timely, specific. "Where am I going / how am I going / where to next". Immediate feedback helps procedures; delayed feedback can help transfer. | **Per-test feedback** in Do and **per-option explanations** in Check. Results pages answer the three questions: level per goal, what was missed, and "Your plan is ready". |

---

## 3. Usability and accessibility

### Nielsen's 10 heuristics ([nngroup](https://www.nngroup.com/articles/ten-usability-heuristics/)), applied
1. **Visibility of system status**: autosave indicator, "saved 2 s ago", progress per step.
2. **Match with the real world**: plain-language labels ("My plan", not "Enrollment").
3. **User control and freedom**: undo on bulk admin actions, skippable celebrations and tours.
4. **Consistency and standards**: one shadcn component per job, one icon set (Lucide).
5. **Error prevention**: confirm destructive actions, disable Submit until required fields are filled.
6. **Recognition over recall**: ⌘K shows recent items, chips show *why* something is "Up next".
7. **Flexibility and efficiency**: keyboard shortcuts plus a `?` sheet; saved views for admins.
8. **Aesthetic and minimalist design**: a calm admin UI (section 4), one motion moment per page.
9. **Recover from errors**: test failures show expected vs actual and a hint, not a stack dump.
10. **Help and documentation**: a help entry in the same place on every page (also WCAG 3.2.6).

### WCAG 2.2: new criteria ([W3C "What's new in 2.2"](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/))
| SC | Level | Oyelearn rule |
|---|---|---|
| 2.4.11 Focus Not Obscured (Min) | AA | Sticky headers, the mobile bottom nav, toasts and the tutor panel must not cover the focused element. Use `scroll-padding` equal to header/nav height. |
| 2.5.7 Dragging Movements | AA | Every dnd-kit reorder (admin plan builder, Tiptap blocks) also gets "Move up/down" buttons or a menu. Resizable panels get keyboard handles. |
| 2.5.8 Target Size (Min) | AA | Targets at least **24×24 CSS px** or properly spaced. Design-system minimum: 32 px desktop, 44 px touch. |
| 3.2.6 Consistent Help | A | "Ask Oye" and help live in the same spot on every page. |
| 3.3.7 Redundant Entry | A | Don't ask again for info already given (onboarding to profile; assessment autosave restores answers). |
| 3.3.8 Accessible Authentication (Min) | AA | No cognitive tests at login. Allow paste and password managers in `password-input.tsx`, and add no CAPTCHA puzzles. |
| 4.1.1 Parsing | — | Removed in 2.2 (obsolete). |

### Motion
- **Material 3 tokens** ([M3 motion tokens, material-components-android](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md); the m3.material.io page is JS-rendered and did not load): durations short1–4 = **50/100/150/200 ms**, medium1–4 = **250/300/350/400 ms**, long1–4 = 450–600 ms, extra-long = 700–1000 ms. Easing: standard `cubic-bezier(0.2,0,0,1)`, emphasized-decelerate `(0.05,0.7,0.1,1)`, emphasized-accelerate `(0.3,0,0.8,0.15)`.
  **Oyelearn tokens:** `fast 150`, `base 250`, `slow 400`, `celebrate ≤ 2000`; enter = emphasized-decelerate, exit = emphasized-accelerate.
- **Apple HIG motion** ([JSON of HIG Motion](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/motion.json)): "Add motion purposefully", "Make motion optional", "brevity and precision in feedback animations", "avoid adding motion to UI interactions that occur frequently", "**Let people cancel motion**".
  **Haptics** ([HIG Playing haptics JSON](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/playing-haptics.json)): use them consistently, pair them with visuals, don't overuse them, make them optional. For the web this means `navigator.vibrate` only on Android, only for a pass or a streak, and behind a setting.
- **prefers-reduced-motion** ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)): Baseline since Jan 2020. Replace transforms and scale with opacity or colour. In Motion, use `<MotionConfig reducedMotion="user">` at the root. Confetti uses `disableForReducedMotion: true`.

---

## 4. Calm admin dashboards

| Pattern | Source (fetched) | Oyelearn admin |
|---|---|---|
| **Triage inbox** | [Linear Triage](https://linear.app/docs/triage): Accept `1` / Decline `2` / Duplicate `3` / Snooze `H`; incoming work waits in triage before it enters the workflow | **"Needs your attention"** inbox: review requests, stalled learners, broken sources and AI drafts. Each item gets one-key actions (Approve / Dismiss / Snooze / Open). |
| **Notification inbox** | [Linear Inbox](https://linear.app/docs/inbox): `J`/`K` navigation, `U` read toggle, `H` snooze, Priority tab | The same keys in the admin inbox and in the learner notifications list. |
| **Saved views** | [Linear custom views](https://linear.app/docs/custom-views): save the current filters (`Alt+V`), share at workspace/team level, favourite to the sidebar, copy the URL | People table: filters live in the URL. "Save view" makes it personal or shared, and it can be pinned to the sidebar. |
| **Command palette** | [Vercel Geist Command Menu](https://vercel.com/geist/command-menu): ⌘K/Ctrl+K, imperative item names ("Deploy Project"), keep the query between pages, trap and restore focus, show recents when empty, announce result counts | ⌘K built on the existing `cmdk`. Items read as verbs ("Send reminder", "Open Alex's plan"). Show recents when the box is empty. |
| **Side sheets / drawers** | [Stripe Apps design](https://docs.stripe.com/stripe-apps/design): `ContextView` sits *beside* the page so the user keeps context; `FocusView` adds a blocking backdrop only for start-to-finish tasks; "default to ContextView" | Clicking a row in People or Library opens a **non-modal side sheet** that keeps the list visible. Multi-step tasks (onboard, send assessment) use a **focus sheet** with a backdrop. |
| **Empty states** | [NN/g empty states](https://www.nngroup.com/articles/empty-state-interface-design/) (status, learning cue, direct path to action). [Geist Empty State](https://vercel.com/geist/empty-state) (blank slate / informational / educational; never auto-launch tours, always offer Skip). | Every table and tile has a designed empty state that gives one-line status, one primary action and a "Learn more" link. |

The Vercel dashboard itself was not studied beyond the Geist docs, and Stripe's own dashboard only via its Apps guidance. Treat any further "Vercel/Stripe does X" claims as **unverified**.

---

## 5. FSRS (spaced repetition)

**Model** ([awesome-fsrs wiki: The Algorithm](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm); the ts-fsrs typings confirm the same definitions):
- **Retrievability R**: the probability of recall right now. In FSRS-6 it decays along the power curve `R(t,S) = (1 + factor·t/S)^(−w20)`, scaled so that R(S,S) = 0.9.
- **Stability S**: the interval (in days) at which R falls to 90%. A successful review increases S, and a lapse shrinks it.
- **Difficulty D**: ranges from 1 to 10. A higher D means S grows more slowly.
- **Desired retention**: the R at which the next review is scheduled. The ts-fsrs default is **`default_request_retention = 0.9`**. Raising it means more reviews; lowering it means more forgetting.

**ts-fsrs** ([GitHub](https://github.com/open-spaced-repetition/ts-fsrs); npm **5.4.2**, published 2026-09-01; **MIT**; Node ≥ 20; ESM/CJS/UMD; ~7 kB gz; implements FSRS v6):
```ts
import { createEmptyCard, fsrs, generatorParameters, Rating } from 'ts-fsrs'
const f = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: true }))
const card = createEmptyCard(new Date())
const preview = f.repeat(card, new Date())               // all 4 outcomes, for showing intervals on buttons
const { card: next, log } = f.next(card, new Date(), Rating.Good) // apply the chosen rating
f.get_retrievability(next, new Date(), false)            // number 0..1
// Rating: Again=1, Hard=2, Good=3, Easy=4. Also: rollback(card, log), forget(card, now)
```
Defaults (from `index.d.ts`): `maximum_interval 36500`, `enable_fuzz false`, `enable_short_term true` (learning steps).

**Recommendations:**
- Store `Card` fields and `ReviewLog` rows in SQLite on the server, and run scheduling on the server so the clock can be trusted.
- Turn fuzz on so reviews don't all land on the same day.
- Optimise parameters later with `@open-spaced-repetition/binding` once there are 1,000+ reviews.

---

## 6. Library status (2026-10-05)

Columns: npm latest (publish date) · last push to the GitHub repo · licence · React 18/19 peer · gzip size · verdict.

| Library | npm latest | Repo last push / archived | Licence | React peer | gz | Verdict and alternative |
|---|---|---|---|---|---|---|
| **shadcn/ui** (CLI `shadcn`) | 4.21.2 (2026-10-05) | 2026-10-05 / no | MIT | n/a (copy-in) | n/a | **Keep.** Since **3 Jul 2026 the default primitive layer for new projects is Base UI**; Radix "stays fully supported, updates ship for both" ([OpenReplay](https://blog.openreplay.com/shadcn-ui-radix-base-ui-switch/)). Add new components with `-b radix` so we stay consistent. Shadcn now recommends `tw-animate-css` in place of `tailwindcss-animate`, and has deprecated toast in favour of Sonner ([shadcn Tailwind v4 page](https://ui.shadcn.com/docs/tailwind-v4)). |
| **Radix primitives** | `@radix-ui/react-dialog` 1.1.23 (2026-07-24); `radix-ui` 1.6.7 | 2026-08-08 / no | MIT | 16.8–19 | dialog ~12 kB | **Keep.** Development has slowed since the WorkOS acquisition, but it is still released. Don't migrate to Base UI (`@base-ui/react` 1.8.0, MIT, ~143 kB gz for the full package) in v5. The silent behaviour changes (Tabs, menus) carry real risk. |
| **Tailwind CSS** | 4.3.3 (2026-07-16); `v3-lts` tag 3.4.19 | 2026-09-25 / no | MIT | n/a | n/a | **Already on v4. Stay.** v4 needs Safari 16.4+, Chrome 111+, Firefox 128+ ([upgrade guide](https://tailwindcss.com/docs/upgrade-guide)), which is fine for an internal tool. To do: swap `tailwindcss-animate` for **`tw-animate-css`** 1.4.0. |
| **Motion** (motion.dev) | `motion` **14.0.0** (2026-10-02); `framer-motion` 14.0.0 also published | 2026-10-05 / no | MIT | 18/19 | ~46 kB | **Already migrated** (`motion/react`). The migration *is* a rename (uninstall framer-motion, install motion, change imports). v12: no breaking changes. v13: dropped `@emotion/is-prop-valid` (only matters for CSS-in-JS). v14: no breaking changes ([upgrade guide](https://motion.dev/docs/react-upgrade-guide)). Bump 13.4 to 14 at low risk. Use `LazyMotion` + `m` to cut size. |
| **Rive** `@rive-app/react-canvas` | 4.36.0 (2026-09-30) | 2026-09-30 / no | MIT | 16.8–19 | JS ~63 kB, plus **rive.wasm ~805 kB gz** (measured) | **Avoid for v5.** Its state machines are best-in-class, but the wasm cost is high and we have no Rive designer. |
| **lottie-react** | 3.1.2 (2026-09-07) | 2026-09-07 / no | MIT | 18.2/19 | ~191 kB (lottie-web) | Avoid (heavy). |
| **@lottiefiles/dotlottie-react** | 0.19.16 (2026-08-28) | 2026-09-16 / no | MIT | 17–19 | JS ~33 kB, plus **wasm ~486 kB gz** (measured) | **Only if a designer supplies assets**, and then lazy-loaded on the celebration only. dotLottie files are "80% smaller than .json", and native state machines arrived late 2025 ([LottieFiles vs Rive](https://lottiefiles.com/blog/lottie-animations/lottiefiles-or-rive)). Default: Motion + canvas-confetti. |
| **cmdk** | 1.1.1 (**2025-03-14**) | repo moved to `dip/cmdk`, last push 2025-10-29 / no | MIT | 18/19 | ~15 kB | **Keep** (already used; shadcn Command wraps it). Releases are slow but it is stable. No better alternative. |
| **Sonner** | 2.0.8 (2026-08-09) | 2026-08-10 / no | MIT | 18/19 | ~9 kB | **Keep.** It is shadcn's toast. |
| **Vaul** | 1.1.2 (**2024-12-14**) | 2025-10-03 / not archived, but the README says: *"This repo is unmaintained… not in the near future"* ([GitHub](https://github.com/emilkowalski/vaul)) | MIT | ≤19 | ~18 kB | **Do not adopt.** shadcn Drawer has moved from Vaul to Base UI ([shadcn Drawer](https://ui.shadcn.com/docs/components/drawer)). **Alternative:** our existing Radix-Dialog `sheet.tsx` with `side="bottom"`, plus a CSS/Motion slide for mobile sheets. Skip swipe-to-dismiss. |
| **react-resizable-panels** | **4.14.2** (2026-10-02) | 2026-10-02 / no | MIT | 18/19 | n/m (~10 kB, unverified) | **Adopt** for the Do split view. v4 API: `Group` / `Panel` / `Separator` ([GitHub](https://github.com/bvaughn/react-resizable-panels)). Older shadcn `resizable.tsx` used `PanelGroup` / `PanelResizeHandle`, so regenerate it. |
| **Monaco** | `monaco-editor` 0.57.0 (2026-09-24); `@monaco-editor/react` 4.7.0 (2025-02-13) | monaco-react 2026-04-20 / no | MIT | wrapper 16.8–19 | wrapper ~5 kB; Monaco itself is large (lazy only) | **Keep raw `monaco-editor` with Vite workers**, as now. The wrapper loads Monaco "from CDN by default" ([README](https://github.com/suren-atoyan/monaco-react)). That would add a CDN dependency, and we already self-host. Keep it lazy-loaded behind the Do step. |
| **Sandpack** `@codesandbox/sandpack-react` | 2.20.0 (**2025-02-14**) | last commit to main **2025-02-14** / not archived | Apache-2.0 | 16.8–19 | n/m | **Avoid.** No releases for about 20 months, and the bundler depends on CodeSandbox-hosted infrastructure. We already run code in `isolated-vm` on the server and in a Web Worker, so keep that. |
| **Video.js 10** `@videojs/react` | **10.0.1** (2026-10-02); **10.0.0 GA on 2026-10-01** | `videojs/v10` 2026-10-05 / no | Apache-2.0 | 18/19 | n/m (blog claims a 25 kB default) | **Not yet.** It is a from-scratch rebuild by the Video.js, Vidstack, Plyr and Media Chrome teams, "not merging codebases" ([Mux blog](https://mux.com/blog/five-players-one-future-how-we-re-building-video-js-v10); [v10 repo](https://github.com/videojs/v10) says "stable"). A **`@videojs/youtube-video` 10.0.1** adapter exists on npm, but it is 4 days old. `@vidstack/react` latest is 0.6.15 with a `next` of 1.15.6, so the Vidstack line is effectively superseded. **Keep our YouTube IFrame API hook** (chapters, speed, captions and resume all work through the IFrame API) and re-evaluate v10 in about Q1 2027. |
| **Tiptap** | `@tiptap/react` **3.31.4** (2026-09-30) | 2026-10-02 / no | **MIT core** | 17–19 | ~9 kB (react pkg; core + ProseMirror is more) | **Adopt v3** (v2 is the previous major). The open-source editor is MIT; collaboration, comments, history, AI and tracked changes are **paid platform features** ([pricing](https://tiptap.dev/pricing)). We need only StarterKit, the free extensions and our own block nodes. Version history goes in our own DB. |
| **dnd-kit** | `@dnd-kit/core` 6.3.1 (**2024-12-05**); `@dnd-kit/react` **0.5.0** (2026-06-11), beta 2026-09-12 | 2026-09-12 / no | MIT | core ≥16.8; react 18/19 | core ~14 kB | **Use `@dnd-kit/react` 0.5** for new code. Development has moved there (all 0.5.0 releases are new-architecture packages, per [releases](https://github.com/clauderic/dnd-kit/releases)), while core has had no release in about 22 months. It is still pre-1.0, so pin it. Always pair it with non-drag buttons (WCAG 2.5.7). |
| **TanStack Query** | v5 **5.104.1** (2026-10-02) | 2026-10-05 / no | MIT | 18/19 | ~13 kB | **Adopt** for server state in v5 screens (caching, optimistic updates for autosave and approvals). Zustand stays for UI state. |
| **TanStack Table** | **9.2.6** (2026-10-04). v9 stable since **4 Aug 2026** ([announcement](https://tanstack.com/blog/announcing-tanstack-table-v9)) | 2026-10-04 / no | MIT | ≥18 | v9 ~31 kB (full); tree-shaken tables "~6–7 kB vs 15–20 kB in v8" | **Stay on v8.21 for v5.** 12 files use it already, and v9 rebuilds state on TanStack Store. Plan the v9 move as separate work after v5. |
| **Recharts** | **3.10.1** (2026-07-25) | 2026-10-05 / no | MIT | 16.8–19 | ~148 kB (lazy, admin only) | **Adopt v3.** `accessibilityLayer` is on by default; v3 removed `CategoricalChartState` and `Customized` internals ([3.0 migration](https://github.com/recharts/recharts/wiki/3.0-migration-guide)). Load it only on admin chart routes. |
| **Tremor** | `@tremor/react` 3.18.7 (**2025-01-13**) | npm repo last push 2025-01-13; copy-paste repo 2025-10-10 | Apache-2.0 | **18 only** | n/m | **Avoid.** Vercel acquired it on 22 Jan 2025 ([Vercel blog](https://vercel.com/blog/vercel-acquires-tremor)) and made the Blocks free, but the npm package hasn't been published since, and its peer dependency excludes React 19. At most, borrow ideas from Tremor's copy-paste chart styling built on Recharts. |
| **Lucide** `lucide-react` | 1.52.0 (2026-10-04) | 2026-10-04 / no | ISC | 16.5–19 | tree-shaken per icon (189 kB is the full barrel) | **Keep.** Import named icons only. |
| **ts-fsrs** | 5.4.2 (2026-09-01) | 2026-10-03 / no | MIT | n/a | ~7 kB | **Adopt** (section 5). |
| **canvas-confetti** | 1.9.4 (2025-10-25) | 2025-10-25 / no | ISC | n/a | ~4 kB | **Adopt**, lazy-loaded, with `disableForReducedMotion: true`. Stable and finished. |
| **size-limit** | 14.1.0 (2026-09-27) | 2026-10-05 / no | MIT | n/a | dev | **Adopt** to enforce bundle budgets in CI. |
| **@lhci/cli** | 0.15.1 (**2025-06-25**) | 2026-03-27 / no | Apache-2.0 | n/a | dev | **Adopt, with a caveat.** It is still the standard Lighthouse CI, but it ships slowly and may lag the newest Lighthouse versions. Use it for budgets (`assert`) only. Run axe separately. |
| **@axe-core/playwright** | 4.13.0 (2026-08-11) | 2026-10-02 / no | **MPL-2.0** | n/a | dev | **Adopt.** MPL is fine for dev-only tooling. We already have Playwright. |
| **vite-plugin-pwa** | **2.0.0** (2026-10-03); peer `vite ^3…^8`, Workbox 7.4 | 2026-10-04 / no | MIT | n/a | SW only | **Optional, later.** It works with Vite 8. A service worker on an authenticated app with live data needs care (cache only static assets and fonts), so leave it out of v5 scope unless offline review is wanted. |

### Fonts (all on Google Fonts; CSS API returned 200 for each; all OFL-1.1)
| Font | Licence source | Package | Note |
|---|---|---|---|
| **Sora** (display) | [sora-xor/sora-font](https://github.com/sora-xor/sora-font) OFL-1.1 | `@fontsource/sora` 5.3.0 (already installed) | Keep for headings. |
| **Geist Sans / Geist Mono** | [vercel/geist-font](https://github.com/vercel/geist-font): "SIL Open Font License, Version 1.1" | `geist` 1.7.2, `@fontsource-variable/geist` 5.3.0 | Good, but it is strongly tied to Vercel's look. |
| **Plus Jakarta Sans** | tokotype/PlusJakartaSans OFL-1.1 (GitHub API) | `@fontsource/plus-jakarta-sans` 5.3.0 | Geometric like Sora, so too similar in tone to give contrast in body text. |
| **JetBrains Mono** | JetBrains/JetBrainsMono OFL-1.1 (GitHub API) | `@fontsource/jetbrains-mono` 5.3.0 | Excellent for code, with clear `0/O` and `1/l` and optional ligatures. |
| IBM Plex Sans / Mono | installed today | `@fontsource/ibm-plex-*` | Current body and mono fonts. |

**Recommendation:**
- **Body: Geist Sans (variable).** Neutral and highly legible at UI sizes, and it pairs cleanly under Sora.
- **Mono: JetBrains Mono (variable).** Use it in Monaco and code blocks.
- If the brand feel matters more than novelty, keeping IBM Plex Sans is an acceptable fallback (zero migration).
- Self-host every font through `@fontsource-variable/*` (no Google CDN, so nothing is sent to a third party). Preload only the weights used above the fold.

---

## 7. Recommendations (final picks)

| Need | Pick | Why |
|---|---|---|
| Primitives | **Radix (keep)**, add shadcn components with `-b radix` | Fully supported; a Base UI move carries silent behaviour risk with no user benefit in v5 |
| Styling | **Tailwind 4.3 (already)** + **tw-animate-css** (replacing `tailwindcss-animate`) | Shadcn's v4 path |
| Motion | **motion 14** (`motion/react`, `LazyMotion`, `MotionConfig reducedMotion="user"`) | Already used; v14 has no breaking changes |
| Celebrations | **Motion + canvas-confetti**. Rive and Lottie: avoid (wasm ~0.5–0.8 MB gz) | ≤2 s, skippable, cheap |
| Command palette | **cmdk** (keep) | Stable; shadcn Command |
| Toasts | **Sonner** (keep) | shadcn default |
| Mobile sheet / drawer | **Existing Radix `sheet.tsx`** (bottom side). **Not Vaul.** | Vaul is unmaintained |
| Split view | **react-resizable-panels v4** | Active; keyboard-accessible Separator |
| Code editor | **raw monaco-editor 0.57** (keep, lazy) | Self-hosted workers; no CDN |
| Live code sandbox | **Our Worker + isolated-vm**. **Not Sandpack.** | Sandpack is stagnant |
| Video | **Own YouTube IFrame API hook** (keep). Revisit Video.js 10 + `@videojs/youtube-video` in 2027. | v10 is 4 days old |
| Rich text (admin) | **Tiptap v3, MIT parts only** | Paid features not needed |
| Drag and drop | **@dnd-kit/react 0.5** (pinned) + button alternatives | New architecture; core is stale |
| Server state | **TanStack Query v5** | Caching and optimistic updates |
| Tables | **TanStack Table v8** now; v9 later | Avoid churn mid-rebuild |
| Charts | **Recharts 3** (lazy, admin only). **Not Tremor.** | Tremor npm is stale and React 18 only |
| Icons | **Lucide** (named imports) | Already used |
| Spaced repetition | **ts-fsrs 5.4** (server-side scheduling, retention 0.9, fuzz on) | MIT, FSRS-6 |
| Fonts | **Sora** (display) + **Geist Sans** (body) + **JetBrains Mono** (code), via `@fontsource-variable` | All OFL |
| Quality gates | **size-limit**, **@lhci/cli** (budgets), **@axe-core/playwright** | All active |
| PWA | **vite-plugin-pwa 2**: defer | Not needed for v5 |

**Avoid:** Vaul, Sandpack, `@tremor/react`, lottie-react, Rive (for now), `@monaco-editor/react` (CDN loader), `@dnd-kit/core` for new code, an unplanned Base UI migration, and a TanStack Table v9 migration during v5.

**Unverified items to re-check by hand:**
- Khan Academy help-centre mastery article (403)
- the Educative review (403)
- the G2 Docebo/360Learning page (403)
- sizes for react-resizable-panels, Sandpack and `@videojs/react` (bundlephobia 429)
- m3.material.io (JS-rendered; tokens taken from material-components-android docs instead)
