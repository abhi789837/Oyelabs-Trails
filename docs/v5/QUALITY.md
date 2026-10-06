# v5 quality gates (Phase 9.1)

Measured on 6 October 2026 on a private snapshot (`scripts/e2e/snapshot-build.sh p9q`), taken after the 9.2 fixes and the main session's budget fixes, once product code was stable. Every server was a throwaway `DATA_DIR` with the mock AI. No packages were installed.

## How to run

```bash
APP=$(bash scripts/e2e/snapshot-build.sh p9q)
E2E_APP_DIR="$APP" npx tsx scripts/e2e/v5-journeys.ts           # port 8840
E2E_APP_DIR="$APP" npx tsx scripts/e2e/v5-visual.ts             # port 8841; --update rewrites the baselines
E2E_APP_DIR="$APP" node scripts/perf/lighthouse-v5.mjs          # ports 8842 + 8942 (proxy); LH_PROXY=h2 for TLS + HTTP/2 like Caddy
SIZE_DIST="$APP/dist" npm run size
bash scripts/e2e/snapshot-build.sh --remove p9q
```

## Click counts

Counted by `scripts/e2e/v5-journeys.ts`. Every mouse click in the counted stretch goes through one counter. Typing and waiting aren't counted, which is the same rule as `BASELINE.md`.

| Task | Target | Before (old UI, `BASELINE.md`) | v5 | Clicks |
|---|---|---|---|---|
| Learner: open the app → inside the next step | 1 | 1 | **1** | Today: Continue (lands on `/learn/lesson/js-call-stack?step=watch`, inside Watch) |
| Admin: onboard someone and send the test | ≤ 3 after typing | 3 from the admin home | **2 after typing** (3 from the inbox) | Inbox nav: Onboard → *(type name and one line)* → Suggest → Looks good — send the test |
| Admin: approve a review request | 1 | 2 | **1** | Inbox: Give full marks |

## Journeys (`scripts/e2e/v5-journeys.ts`): all checks pass

- **Learner.** The run opens the app at `/` and lands on Today. Continue takes it into Watch. Read runs the "Try it" block ("depth 100"). On Do it opens a nudge, Checks a wrong answer ("Not yet", check by check), then a right one ("That works"), and the lesson finishes. Next lesson opens js-hoisting. There the quick check pops in after the video and explains its answers. After Read comes the topic test on Check: 10 of 10, Passed. Next lesson then opens js-scope-chain. No page errors.
  - The learner has opened js-call-stack once before, so Continue resumes it. See product bug 2 for why this is needed.
- **Admin.** "Give full marks" (1 click) is decided on the server as `overridden`. Onboarding plus send creates the account, and the test is `generating`. A People row opens the side sheet, `?person=id` is kept, and Recent activity and "Open full page" are shown. An editor block is edited and saved: the message says "Saved. This is version N", and the server has the text. Reports "Download CSV" gives `oyelearn-report-<from>-<to>.csv`, which has the summary and the day rows.
- Screenshots: `%TEMP%/claude/e2e-shots-v5-journeys`.

## Visual snapshots (`scripts/e2e/v5-visual.ts`)

The script covers 22 screens at 390, 768, 1280 and 1440, light and dark: 176 full-page baselines in `docs/v5/shots/v5/<screen>-<width>-<theme>.png`.
- **Learner screens:** today, plan, library, course, review, me, lesson-watch/read/do/check, assessment-preflight, assessment-results, certificate, verify.
- **Admin screens:** admin-inbox, admin-overview, admin-people, admin-people-sheet, admin-onboard, admin-library, admin-editor, admin-reports.

How the shots stay deterministic:
- **Theme.** The theme is written to `oyelabs-ui` before every load, and each shot asserts `<html class="dark">` matches.
- **Clock.** The server runs on a fake clock that starts at Mon 5 Oct 2026 09:00 UTC. It is a `--require` preload written into the throwaway DATA_DIR, with `TZ=UTC`. The browser's `Date` is fixed two hours later, in UTC.
- **Motion.** Animations are off, motion is reduced and the caret is hidden. Fonts and images finish loading before each shot.
- **Outside requests.** Requests to other sites (YouTube) are blocked, and frames are masked.
- **Random data.** The certificate code is replaced on the page and the QR is masked.
- **First visits.** An unshot warm-up pass runs over every screen first, so whatever the server works out on a first visit is in place.

Comparison:
- A pixel counts as different when a channel moves by more than 24 of 255. A screen fails when more than 0.05 % of its pixels differ, or when its size changes.
- PNGs are decoded with `node:zlib` inside the script, because pixelmatch and pngjs aren't installed.
- Diffs (changed pixels in red) and the current shots go to `%TEMP%/claude/e2e-shots-v5-visual`.

Result on the final snapshot:
- `--update` wrote all 176 baselines.
- A second, separate run (fresh server and data) matched all 176: 0 changed, 0 resized and 0 errors.
- One shot (today-390-light) matched only on the script's single re-shoot one second later.

Stabilised while building this:
- **No `isMobile` at 390.** Chromium's mobile full-page capture moved the fixed bottom nav and cut content differently on each run. A 390 px touch viewport gives the same layout.
- **The browser's `navigator.onLine` is pinned.** Headless Chromium on Windows sometimes reported offline.
- **One retry** for `net::ERR_NO_BUFFER_SPACE`.
- **One re-shoot** after a second before a mismatch counts.

The older scripts now really shoot dark. The fix:
- `v5-admin.ts` now writes the theme before each load (`themedContext`) and asserts `html.dark` in its axe sweeps. Before, its 768/1440/390 "dark" passes ran in light.
- `v5-lesson.ts`, `v5-learner-pages.ts` and `v5-a11y.ts` already wrote the theme, and now also assert it on every page. `v5-today.ts` already asserted it.
- On the final snapshot these all pass: `v5-admin` (ports moved with `E2E_PORT`, since another agent held 8832), `v5-lesson`, `v5-learner-pages` and `v5-a11y` (112 axe views, 0 serious or critical).

## Lighthouse (mobile profile)

Measured with `scripts/perf/lighthouse-v5.mjs`. It uses Lighthouse 12.6 (installed with `@lhci/cli`) in Playwright's Chromium with the default config: Moto G Power emulation, simulated slow 4G and a 4× CPU slowdown. It takes the median of 3 runs.
- **Login.** The script seeds a staff user (role admin) on the new design, with the welcome done and a three-lesson plan.
- **Proxy.** Production runs behind Caddy (`Caddyfile.example`: `encode zstd gzip`, immutable hashed assets). The Node server doesn't compress, so the headline numbers go through a local proxy that does the same.
- **INP.** INP can't be measured in a navigation run, so Total Blocking Time is its lab stand-in.

### Production-like (gzip proxy): the headline

| Route | Perf | A11y | Best practices | LCP | TBT (INP stand-in) | CLS | FCP | Sent |
|---|---|---|---|---|---|---|---|---|
| `/learn` | **75** ✗ | 100 | 93 | **5.79 s** ✗ | 189 ms | 0 | 1.78 s | 512 KB |
| `/learn/lesson/js-closures` | **63** ✗ | 100 | 93 | **8.55 s** ✗ | 402 ms | 0 | 1.76 s | 1,913 KB (≈1.3 MB YouTube) |
| `/learn/review` | **79** ✗ | 98 | 93 | **5.12 s** ✗ | 102 ms | 0 | 2.07 s | 448 KB |
| `/admin` | **70** ✗ | 100 | 93 | **6.56 s** ✗ | 281 ms | 0 | 1.72 s | 551 KB |

Medians of runs that agreed within 4 points. An earlier run on the pre-9.2 snapshot was a few points better (78 / 71 / 81 / 76, LCP 5.3 / 6.2 / 4.8 / 6.2 s). Other agents were running e2e on the same machine at the time, and Lantern's CPU estimate moves with that, so treat about ±5 points as noise. The over-budget picture is the same in both runs.

Budgets: perf ≥ 90 ✗ on all four. A11y ≥ 90 ✓ on all four. LCP < 2.5 s ✗ on all four. CLS is 0 everywhere.

### Bare Node server, no compression (1 run, for comparison)

| Route | Perf | LCP | FCP | Sent |
|---|---|---|---|---|
| `/learn` | 55 | 9.21 s | 3.57 s | 1,112 KB |
| `/learn/lesson/js-closures` | 52 | 11.44 s | 3.69 s | 2,959 KB |
| `/learn/review` | 64 | 8.52 s | 4.23 s | 1,068 KB |
| `/admin` | 61 | 10.37 s | 3.67 s | 1,254 KB |

### Why LCP is over budget

- Without throttling, LCP is about 1.2 s on `/learn`. Under the mobile simulation, LCP's **render delay is 4.7–8.1 s** while TTFB is under 0.5 s. The LCP element is text that appears only after a chain of round trips. On `/learn` that element is the hero `h2#today-hero-title`; on Review and the inbox it's a `p`.
- The `/learn` waterfall, unthrottled ms:
  1. HTML (4)
  2. entry + `react-3` vendor (99–120)
  3. `/api/auth/me` (148)
  4. `V5App` plus about 40 small chunks (155–238)
  5. `/api/me/manifest`, progress, motivation, settings (465–480)
  6. `TodayPage` chunk, only after the manifest (487)
  7. `TodayDetails` plus about 15 icon and part chunks (522–551)
  8. `/api/v5/today` (799)
  9. LCP (1181)
- Each of those 7 sequential steps costs a simulated round trip of 150 ms plus CPU time.
- Render-blocking CSS: `index-*.css` is 190 KB raw and 28 KB gzipped. It carries both designs, which costs about 620 ms.
- Six font files load before LCP: IBM Plex Sans 400/500/600 (the old UI's body font, loaded app-wide), Geist, Sora 600 and JetBrains Mono.
- Unused JS: `react-3-*.js`, 34 of 81 KB gzipped.

## Performance fixes needed

None of these were done here (product code). In order of effect:

1. **Break the request waterfall on every v5 route.**
   - `src/v5/app/V5CurriculumProvider.tsx` and `src/v5/app/V5App.tsx`: don't gate the route's lazy chunk on `/api/me/manifest`. Start `import()` of the matched route (TodayPage, LessonPage, ReviewPage, InboxPage) at the same time as the manifest. Review already skips the manifest gate.
   - Start the page's main query (`/api/v5/today`, `/api/v5/review/summary`, the inbox) at route match. Today it starts only after the page chunk has mounted. A module-level prefetch promise that the page then reads would do it.
   - `src/App.tsx`: `V5App` is imported only after `/api/auth/me` answers. Cache the last `ui.v5` value (the `uiFlag` chunk already exists) and start `import("./v5/app/V5App")` in parallel with `/api/auth/me`. If the guess was wrong, the other tree loads as now.
   - Expected effect: LCP moves 3–4 round trips earlier, about 1.5–2.5 s on the mobile profile.
2. **Fewer, larger chunks on the first load.** About 60 JS requests come before LCP on `/learn`: one per lucide icon, many small Radix `dist-*` chunks and per-component parts. Group them in `vite.config.ts` (`build.rollupOptions.output.manualChunks` / rolldown `advancedChunks`), for example `v5-icons`, `v5-radix` and `v5-shell`. HTTP/2 behind Caddy softens this, but the chain depth stays.
3. **Split the CSS per design.** `src/index.css` (Tailwind 4) ships the old UI's and v5's rules in one render-blocking file. Load the v5 layer from `V5App`, or at least move the old UI's component CSS out of the entry.
4. **Fonts.** `src/main.tsx` imports Sora 400/600/700/800, IBM Plex Sans (4 files) and IBM Plex Mono for both designs.
   - In v5, move the old fonts to `LegacyRoutes`, so v5 loads only Geist (and the mono font when code is shown).
   - Preload the v5 body font in `index.html`.
5. **Lesson: don't warm steps the lesson doesn't have.**
   - `src/v5/learner/lesson/LessonPlayer.tsx` (the `warm` effect) preloads `TaskDo` on every non-code lesson, js-closures included, which has no Do step. That pulls `src/components/tasks/TaskView.tsx` → `ExcelTask` → `sheetGrid` (305 KB raw, 90 KB gzipped, 224 KB unused) and `schemas` (zod) into the measured window.
   - Fix: warm only `availableSteps(topic)`. Also lazy-load `ExcelTask` (and the other heavy task kinds) inside the v5 `TaskDo`, not through `TaskView`'s static import.
6. **Lesson: a YouTube facade.** The embedded player costs about 1.3 MB and over 800 ms of main thread (`base.js` 472 KB, `ytembeds` 378 KB) before anyone presses play. Render a thumbnail plus a Play button and create the iframe on click. The thumbnail is `i.ytimg.com`, which is already allowed by the CSP. This goes in the v5 Watch step (`src/v5/learner/lesson/steps/WatchStep.tsx`, and `CourseLesson.tsx` for course lessons). Keep `iframe_api` for tracking once it's playing.
7. **Keep zod out of learner first loads.** *Done by the main session after this report flagged it:* `shared/weeklyPlanCore.ts`, `shared/meCore.ts`, and Tooltip moved out of Primitives. The lesson still pulls `schemas` (21 of 26 KB unused) through the `TaskDo` warm-up (fix 5).
8. **Compression in front of Node.** Production relies on Caddy's `encode`. If the app is ever served without it (Docker on its own, or another proxy), every number gets worse by the bare-Node table above. `@fastify/compress`, or precompressed `.br`/`.gz` assets with `@fastify/static`'s `preCompressed: true`, would make it independent of the proxy.

## Bundle sizes (`npm run size`, gzipped, on the snapshot)

| Entry | Limit | Size | |
|---|---|---|---|
| `/learn` (Today) | 200 KB | 162.9 KB | ✓ |
| `/learn/lesson/:id` | 200 KB | 191.4 KB | ✓ |
| `/learn/plan` *(new)* | 200 KB | 188.5 KB | ✓ (230.5 before the zod split) |
| `/learn/library` *(new)* | 200 KB | 181.6 KB | ✓ (223.3 before) |
| `/learn/library/:courseId` *(new)* | 200 KB | 187.0 KB | ✓ (228.7 before) |
| `/learn/review` *(new)* | 200 KB | 184.2 KB | ✓ (199.2 before) |
| `/learn/me` *(new)* | 200 KB | 185.7 KB | ✓ (227.4 before) |
| `/admin` inbox *(new)* | 290 KB | 271.0 KB | ✓ |
| `/design` | 230 KB | 221.6 KB | ✓ |
| Shared entry | 185 KB | 93.2 KB | ✓ |

- `.size-limit.js` covered only `/learn` and the lesson. It now lists every v5 learner route under the PLAN's 200 KB budget, plus `/admin`.
- Admin is staff-only and mostly used on a desktop, so it gets a guard rather than a budget: today's size plus about 10 %.
- The new entries first flagged My plan, Library, the course page and Me as 23–31 KB over budget. The main session then split zod out (fix 7), and **`npm run size` is green**. The budgets stay in.
- `check-heavy.mjs` passes: no Monaco, charts, Tiptap, PDF or MediaPipe in `/learn` or `/design`.
- `lighthouserc.cjs` / `npm run lhci` now default to the mobile profile and to the same four routes (`LHCI_PRESET=desktop` for the old setting).

## Product bugs found

1. **CSP blocks the theme script on Windows-built deployments** (medium). Code: `server/src/lib/csp.ts` `inlineScriptHashes`.
   - Steps: build on a Windows checkout (`core.autocrlf=true`, so `dist/index.html` has CRLF), start the server and open any page.
   - Expected: the inline theme script in `index.html` runs before first paint.
   - Actual: the console shows "Executing inline script violates … script-src … 'sha256-xN7o…'", and the script is blocked. Browsers normalise CRLF to LF before hashing, so they want `sha256-BtAM8w…`. The server hashes the raw CRLF text. Dark-theme users get a light flash until React applies the class, and Lighthouse best practices drops to 93 (`errors-in-console`). A Docker build from a Windows working tree would ship this.
   - Fix: hash `body.replace(/\r\n?/g, "\n")`.
   - Evidence: `%TEMP%/claude/lighthouse-v5/learn.report.json`, audit `errors-in-console`.
2. **"Next lesson" follows the track order, not the learner's plan** (medium, needs a decision). Code: `src/v5/learner/lesson/LessonPlayer.tsx` uses `topicNeighbors` from `src/content`.
   - Steps: plan js-call-stack, js-hoisting, js-scope-chain, js-closures for a fresh learner. Open the app. Today's Continue (this week's order) starts at js-hoisting. Finish it, then js-scope-chain, then js-closures, each through "Next lesson".
   - Expected: after js-closures, "Next lesson" goes to the plan's unfinished js-call-stack.
   - Actual: "Back to my plan" and "That's everything in this part of your plan.", although js-call-stack is unfinished. Today and "Next lesson" also disagree on order.
   - Found by the first `v5-journeys.ts` run. The journey now seeds a resumed js-call-stack so it runs in track order. No screenshot was kept.
3. **Review: heading order** (low, best practice). On `/learn/review` the entry cards' titles are `h3` straight after the page `h1`. Lighthouse `heading-order` gives a11y 98. Use `h2`, or add a visually hidden `h2` ("Ways to review"), in `src/v5/learner/review/ReviewPage.tsx`.
4. **Not a product bug, noted:** headless Chromium on Windows sometimes reported `navigator.onLine = false` mid-run. Review then showed "You're offline…" while the server answered. `v5-visual.ts` pins the browser's flag. Review's own "server can't be reached" path is untouched. If real users report a false offline banner, look at `useOnline` (`src/v5/learner/review/offline.ts`).

## Performance after fixes (Phase 9 performance)

Measured on 6 October 2026 with `scripts/perf/lighthouse-v5.mjs` (mobile profile, median of 3 runs). Two private snapshots were used, both removed afterwards:
- `p9perf-base`: the working tree before this pass.
- `p9perf`: after it.

What changed is in DECISIONS.md, "Phase 9 performance".

Other agents ran e2e on the same machine during the runs. That moves Total Blocking Time (TBT) a lot: the same build gave 100–470 ms on `/admin` from one run to the next, and the score with it. LCP and FCP were steady within about 0.1 s. Read TBT and perf to about ±6 points.

### HTTP/1.1 gzip proxy (the 9.1 setup; directly comparable with the 9.1 table above)

| Route | Perf before → after | LCP before → after | FCP before → after | TBT after | A11y | Best practices |
|---|---|---|---|---|---|---|
| `/learn` | 75 → **84** (89 in a quieter run) | 5.70 → **3.64 s** | 1.78 → 1.79 s | 259 ms (10–35 ms in quieter runs) | 100 | 93 → **100** |
| `/learn/lesson/js-closures` | 65 → **80** | 7.20 → **4.66 s** | 1.88 → 2.48 s | 52 ms | 100 | 93 → **100** |
| `/learn/review` | 79 → **84** | 5.13 → **4.11 s** | 1.87 → 2.37 s | 11 ms | 98 → **100** | 93 → **100** |
| `/admin` | 73 → **69–77** | 6.56 → **5.23–5.40 s** | 1.88 → 2.45 s | 87–344 ms | 100 | 93 → **100** |

"Before" is the `p9perf-base` run at the start of this pass (75/65/79/73). The 9.1 table above was 75/63/79/70.

### HTTP/2 + TLS + gzip proxy (`LH_PROXY=h2`; what Caddy serves in production)

| Route | Perf before → after | LCP before → after | FCP before → after | TBT after |
|---|---|---|---|---|
| `/learn` | 86 → **92** ✓ | 3.49 → **2.33 s** ✓ | 1.62 → 1.64 s | 259 ms |
| `/learn/lesson/js-closures` | 73 → **90** ✓ | 5.20 → **3.10 s** ✗ | 1.60 → 1.74 s | 208 ms |
| `/learn/review` | 94 → **94** ✓ | 2.93 → **2.46 s** ✓ | 1.64 → 1.70 s | 177 ms |
| `/admin` | 89–91 → **82–95** | 3.07–3.10 → **2.78–2.99 s** ✗ | 1.72 → 1.58–1.68 s | 100–469 ms |

- Admin was re-run before/after/before/after to check a drop: 91, 82, 89, 95. The spread is all TBT; LCP improved in every run.
- A11y is 100 on all four, and best practices is 100 (93 before: the CSP bug).

### Bare Node, no proxy (1 run): fix 8, precompressed assets

| Route | Perf before → after | LCP before → after | FCP before → after |
|---|---|---|---|
| `/learn` | 57 → **71** | 9.69 → **4.88 s** | 3.65 → 1.80 s |
| `/learn/lesson/js-closures` | 48 → **73** | 12.91 → **4.76 s** | 3.67 → 1.76 s |
| `/learn/review` | 66 → **83** | 8.28 → **4.02 s** | 4.03 → 2.30 s |
| `/admin` | 63 → **68** | 10.37 → **5.39 s** | 3.70 → 2.40 s |

Without a proxy, the Node server now sends brotli/gzip copies of the assets itself, so the bare numbers are close to the proxied ones.

### Budgets: where each route stands, and why

- **`/learn` and `/learn/review` meet perf ≥ 90 and LCP < 2.5 s under HTTP/2,** which is how production serves them.
  - On the HTTP/1.1 proxy they reach 84–89 and 3.6–4.1 s.
  - Lantern models HTTP/1.1 as 6 connections per origin. The app's ~45–80 first-load files then cost several extra round trips. The bytes before LCP are about 350–430 KB.
- **The lesson** reaches perf 90 under HTTP/2, but LCP is 3.1 s.
  - Its largest element is the video poster, a 35 KB image from `i.ytimg.com`. That's a second origin with its own connection, and it can only start once the lesson's state and playlist are known.
  - It now starts as soon as those arrive, from the inline script, and the 1.3 MB player loads only on Play.
  - Getting under 2.5 s would need a lighter poster (the 18 KB `mqdefault`, blurry on wide screens), no poster at all, or serving it from our own origin. Those are product decisions, not taken here.
- **`/admin`** is 82–95 under HTTP/2 and 69–77 on HTTP/1.1, with LCP 2.8–3.0 s and 5.2–5.4 s. What's left:
  - React's main-thread work for the shell and inbox, with TBT 100–470 ms under 4× CPU slowdown. Admin is staff-only and mostly used on a desktop;
  - the 71-file / 235 KB first download: the shell's command palette, dialogs and the old dialog providers.
  - Next step if wanted: lazy-load the command palette and help dialog until first opened.
- **Common to all routes:**
  - The entry is about 96 KB gzipped, mostly `react-3`, with 34 KB of it unused. The render-blocking CSS is 27 KB.
  - Neither can shrink without dropping React Router's eager parts or splitting Tailwind per design, and the CSS split would change the old UI's look (DECISIONS).
