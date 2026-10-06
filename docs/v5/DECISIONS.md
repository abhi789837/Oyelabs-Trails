# v5 decisions

## Phase 0

Foundation agent (step 0.3 and migration 0025).

### Migration 0025 (`server/drizzle/0025_v5_learner_experience.sql`)
- **New tables:** review_cards, review_logs, xp_events, weekly_streaks, lesson_state, lesson_notes, problem_reports, tutor_messages, announcements, content_versions, email_outbox. It is additive only: no DROP, and no table is rebuilt.
- **`certificates` is extended, not created.** A `certificates` table already exists (v3: id, user_id, track_id, learner_name, topic_ids, plan_id, average_score, issued_at).
  - 0025 adds `kind` (default "track"), `ref_id` (default ""), `title` (default ""), `hash`, `revoked_at`, plus the unique index (user_id, kind, ref_id).
  - `learner_name` is the plan's `holder_name`. `track_id` and `topic_ids` are still NOT NULL, so P5 sets `track_id` to the course's or goal's track ("" when none) and `topic_ids` to `[]` when not relevant.
  - **Hand-added SQL:** one UPDATE before the unique index backfills old rows. `ref_id` becomes `track_id` for the newest row per (user, track), and an older duplicate gets `legacy:<id>`, so the index can't fail on existing data. `title` becomes `track_id`. This was tested on a database with duplicates.
- **Foreign keys and plain ids:**
  - `user_id` / `to_user_id` cascade on user delete.
  - `review_logs.card_id` cascades from `review_cards`.
  - `announcements.created_by` is set to null on delete.
  - `problem_reports.resolved_by` and `content_versions.created_by` are plain ids, so the record survives the staff account.
- **Columns beyond the plan's list:**
  - Indexes: review_logs (user_id, reviewed_at) and (card_id), xp_events (user_id, created_at), lesson_notes (user_id, topic_id), problem_reports (status, created_at) and (topic_id), announcements (created_at), email_outbox (status, created_at) and (to_user_id).
  - Defaults: weekly_streaks starts with `freezes_left` = 1; lesson_state starts on step "watch" with every step not done; tutor_messages has `rating` = 0 and `citations` = [].
- `review_cards.fsrs`, `front`, `back` and `review_logs.review` are typed `Record<string, unknown>`. ts-fsrs isn't installed (P1 owns dependencies). P4 should validate them with zod and tighten the `$type` once ts-fsrs is added.

### The ui_v5 flag
- `shared/ui.ts` holds the zod schemas plus `effectiveUiV5(pref, default)`, `uiV5PrefFrom(data)` and `parseUiOverride`.
- **Server routes:** `server/src/routes/ui.ts`.
  - `GET` / `PUT /api/me/ui`.
  - `PUT` with `{v5: null}` deletes the key, so the person follows the global default again. It merges into `user_prefs.data`, so `autoplayNext` is kept, and the existing `PUT /api/me/prefs` keeps `uiV5` too.
  - `GET /api/admin/settings/ui` is staff; `PUT` is superadmin only.
  - **Audit actions:** `ui.v5_toggle` `{from, to}` with the target set to the user, and `ui.v5_default` `{from, to}`.
- **Where `ui: {v5}` is returned:** `/api/auth/me`, and also the login and change-password responses. That way the client knows the design right after sign-in without a second request. Responses with no user omit it.
- **Client:**
  - `AuthProvider` has a new `uiV5` field.
  - `src/v5/app/designFlag.ts` applies the staff `?ui=v5|old` override, kept in sessionStorage for the tab and never saved. Learners' overrides are ignored.
  - `chooseDesign()` does the PUT, then a full page load to the landing page.

### App.tsx and the old tree
- **The old route tree moved, unchanged, from App.tsx to `src/LegacyRoutes.tsx`, which is lazy.** Without this, every v5 learner would download all old pages: the old main chunk was about 1.8 MB and included MediaPipe. The paths are now relative descendant routes under App's `*`, which is equivalent.
  - App.tsx keeps the providers, `/login`, `/change-password` and the public `/verify/:certId` (a lazy `src/v5/learner/certificate/VerifyPage`).
  - Everything else goes through `RequireAuth` and then `DesignSwitch`, which renders `LegacyRoutes` or `V5App`.
  - The Suspense fallback is the same markup as the old `Pending` spinner.
- **Old UserMenu:** a "Try the new design" item (Sparkles icon) above "Sign out", shown only when `uiV5 === false`.

### V5App (`src/v5/app/`)
- Every route is lazy. Old pages are reached only through `legacyPages.ts`, which is all `lazy()`, so nothing old is in the v5 initial load.
- **Temporary shells (`shells.tsx`):**
  - Learner shell: a top bar with the logo, a side nav from `md` up, and a bottom nav on phones (Today · My plan · Library · Review · Me).
  - Admin shell: a side nav for Inbox, Overview, People, Onboard, Library and Reports; an "Older pages" list; "Learner view"; and "Use previous design" in the top bar.
  - P1 replaces both shells.
- **Old URLs:**
  - `/` → `/learn`; `/plan` → `/learn/plan`; `/library` and `/courses` → `/learn/library`; `/courses/:id` → `/learn/library/:id`.
  - Both old topic URL shapes → `/learn/lesson/:topicId`. Other `/track/*` URLs → `/learn/plan`.
  - The query string is kept on the simple redirects.
- **Old learner pages with no v5 screen yet** render unchanged inside the v5 learner shell: glossary (and its practice and term pages), tools/classify, practice/roleplay, report/:trackId and goals/:goalId.
- **Admin:**
  - New placeholders: index (Inbox), overview, people, library and reports.
  - `/admin/library/:courseId/edit` uses the old course editor.
  - Onboard, `people/:userId` and every other old page render unchanged inside the v5 admin shell. `ai` keeps `RequireSuperadmin`.
- **`/assessment` (v5 placeholder):** it renders the old AssessmentPage lazily until P5 replaces it, so a learner on v5 can still take the placement test. MediaPipe loads only there.
- **Placeholders:** each owning group's placeholder file renders an `h1`, using `src/v5/app/ScreenPlaceholder.tsx`. The Me placeholder has the "Use previous design" button. `src/v5/design/DesignPage.tsx` didn't exist when the routes were wired, so it got a placeholder; P1 overwrites it.

### Bundle: what /learn loads (v5-foundation e2e, gzip -9 of each file)
- **Total:** 14 files, 760 kB raw and **238 kB gzip**.
  - react (react-dom + router): 81
  - "ui" vendor group: 59
  - "motion" vendor group: 40
  - zod + api client: 27
  - index: 22
  - V5App: 5
  - the rest: < 3
- **No LegacyRoutes chunk and no MediaPipe.** Before, the main chunk alone was 1.8 MB raw.
- **What's still over the 200 kB budget comes from `vite.config.ts` codeSplitting groups, not from src/v5.**
  - The `ui` group puts every lucide icon, radix primitive and floating-ui module the app uses into one chunk; the `motion` group does the same for motion.
  - A probe build without those two groups gave 218 kB gzip. The rest is sonner + overlays + the eager login pages in index (≈ 20 kB), zod (≈ 27 kB, from `shared/*` value imports) and `motion/react` for `MotionConfig`.
  - **Suggestion for P1, who owns size-limit:**
    - drop or narrow the `ui` and `motion` groups;
    - lazy-load `/login` and `/change-password`;
    - move `OverlayProvider` (sonner) behind the trees that use it.
  - None of this was changed here, because vite.config.ts and the shared providers are outside P0's files.

## Phase 1

Design-system agent. Files: `src/v5/design/**`, `package.json` dependencies, `.size-limit.js`, `lighthouserc.cjs`, `scripts/perf/**`, `scripts/e2e/v5-design.ts`. Outside that: one `@import` line in `src/index.css`, and the vendor groups in `vite.config.ts` (P0 asked for that below).

### How scoping works (the old UI cannot see v5)
- **Values** live in `src/v5/design/tokens.css`. Every rule is under `[data-ui="v5"]` or a `.v5-*` class, and `tokens.test.ts` fails if a rule isn't.
  - It's imported only through `src/v5/design/styles.ts`, which the barrel and `DesignPage` import, so Vite puts it, and the Geist and JetBrains Mono fonts, in the lazy v5 CSS.
  - The e2e confirms that the old UI loads no Geist and that its `<html>` has no `data-ui`.
- **Tailwind names** live in `src/v5/design/theme.css`, pulled in by one line in `src/index.css`: `@import './v5/design/theme.css'`.
  - It is all `@theme inline` with new names only, so nothing is added to `:root`.
  - A v5 utility such as `bg-surface-1` resolves to `rgb(var(--v5-surface-1))`, which is undefined outside the scope.
  - **Checked by compiling `index.css` with and without the import:** no existing rule changed, and only new utilities were added. Their names appear in old files only inside quiz text.
- **Do not add `--spacing-*` theme keys.** That was tried first: it changed tailwindcss-animate's bare `slide-out-to-bottom` from 100% to 0.25rem in the old sheets.
  - Density sizes use Tailwind 4's variable syntax instead: `h-(--v5-control-h)`, `h-(--v5-row-h)`, `p-(--v5-card-pad)`, `gap-(--v5-gap)`.
- **Old variable names are repointed inside the scope only.** These are `--background`, `--foreground`, `--surface`, `--border`, `--primary`, `--ring` and similar, plus the old `@theme` aliases `--color-card`, `--color-foreground`, `--color-muted-foreground`, `--color-success`, `--color-warning` and similar. That way a reused old component (the admin DataTable, Radix popovers) gets the v5 look.
  - **Why the aliases too:** they're resolved once on `:root`, so without re-declaring them a nested light or dark pane showed the wrong colours. axe caught this.
- **Theme** uses the existing `.dark` class on `<html>`, which `uiStore` sets.
  - A `.dark` or `.v5-light` element inside the scope forces a theme for its subtree; `/design` uses this for side-by-side previews.
  - v5 components never use Tailwind's `dark:` variant; the tokens carry the theme.
- **`useV5Root({ density?, reducedMotion? })`** sets `data-ui="v5"` on `<html>`, plus `data-density` and `data-motion="reduce"` when those options are passed.
  - It sets `data-ui` in the first render as well as in an effect. Children's layout effects run before their parent's, so a token read on mount saw no values otherwise.
  - Only the outermost caller removes the attribute on unmount, so nested calls are safe.
  - **For the foundation:** call `useV5Root({ density, reducedMotion: prefs.reducedMotion })` at the top of `V5App`, and wrap the tree in `<V5MotionProvider reducedMotion=…>` and `<TooltipProvider>` (both from `@/v5/design`), and mount `<V5Toaster/>` once. Swap the temporary shells for `AppShell`, passing a `link` adapter for react-router's `Link`/`NavLink`.

### Tokens
- **Brand:** the existing `--brand-50…950` (brand-600 = #2067D3), shared with the old UI. The v5 brand fill is brand-600 in light and brand-400 in dark.
- **Surfaces 0–3 plus sunken:** in light, elevation comes from the shadows `shadow-e1…e3`; in dark, surfaces get lighter as they rise.
- **Semantic colours:** success, warning, danger and info, plus neutral (the Low lane's grey). Each has a fill, `-fg` (the text-safe shade), `on-` (text on the fill) and `-soft` (a tint).
- **Lanes:** `lane-now` = danger, `lane-must` = brand, `lane-medium` = warning, `lane-low` = neutral, which is the v4.3 meaning. Labels and icons come from `LANE_META`.
- **Contrast:** `contrast.ts` `TOKEN_PAIRS` has 103 pairs per theme (text 4.5:1; focus, input border and meaningful fills 3:1 against surfaces and the progress track). `tokens.test.ts` checks them from the CSS, and `/design` shows the same numbers live.
  - The dark `line-2` border was raised to 112 123 142 after the test caught 2.93:1 on surface-3.
- **Type:**
  - Sora for display and headings (already loaded globally), Geist Sans Variable for body text, JetBrains Mono Variable for code.
  - Scale: `text-caption`/`small`/`body`/`lead`/`h4`/`h3`/`h2`/`h1`/`display`.
  - Article measure 68ch (`max-w-article`, `.v5-article`).
- **Motion** (`motion.ts`, mirrored in CSS and test-compared):
  - 120, 200, 320 and 500 ms (instant, quick, calm, story).
  - Easing curves out, in, inOut and emphasis.
  - Springs snappy, gentle and sheet (damping ratio ≥ 0.7).
  - `motionConfigFor(pref)`; celebrations are capped at 2 s.
  - v5 uses `LazyMotion` with `m.*`, never `motion.*`.
- **Density:** comfortable 40/48/20/16 px and compact 32/36/12/10 px (control, row, card padding, gap). Both stay above the 24 px target.

### Libraries (exact versions)
- **Installed:** motion 14.0.0 (was 13.4.2), react-resizable-panels 4.14.2, @tiptap/react, starter-kit and pm 3.31.4, @dnd-kit/react 0.5.0, @tanstack/react-query 5.104.1, recharts 3.10.1, ts-fsrs 5.4.2, canvas-confetti 1.9.4, @radix-ui/react-tabs 1.1.21, @fontsource-variable/geist 5.3.0, @fontsource-variable/jetbrains-mono 5.3.0.
- **Dev:** size-limit 14.1.0 with @size-limit/file, @lhci/cli 0.15.1, @types/canvas-confetti.
- **Kept:** cmdk, sonner, lucide, Radix, the raw `monaco-editor`, and @axe-core/playwright (already present).
- **The motion 14 bump was checked:** typecheck is clean and the old `v43-video` and `v43-trail-visual` e2e scripts pass.
- **tw-animate-css was NOT adopted.** Its `animate-in` sets a full `animation` shorthand with a 0.15 s default, where tailwindcss-animate sets only `animation-name`. Compiled side by side, the old UI's dialog and sheet animations would change.
- **Not used by P1 but installed for later phases:** Tiptap (P7), dnd-kit (P4/P7), Query, Recharts (P7, lazy), ts-fsrs (P4).
  - **P4:** tighten the `review_cards.fsrs` `$type` now that ts-fsrs is installed.
- **canvas-confetti** is a dynamic `import()` inside `Celebration`, and only when not reduced. No heavy library is in the `/learn` or `/design` first load (`scripts/perf/check-heavy.mjs`).

### Components (`src/v5/design/components`, exported from `@/v5/design`)
- **The list:**
  - AppShell (top bar, sidebar, mobile bottom nav; container queries; router-agnostic `link` prop)
  - Button, Field/Input/Textarea, Tabs, Tooltip, Kbd, Badge, Avatar, Card, StatTile
  - ProgressRing, ProgressBar, SkillMeter, StreakFlame, XPCounter, LaneChip, Trail and Waypoint (built on `features/plan/trailGeometry`: one `M`, the walked part is a prefix of the path)
  - EmptyState, ErrorState, Skeleton/SkeletonLayout (card, list, stat-row, table, lesson, article), ContourBackground
  - Dialog, Sheet (right, bottom, or auto; Radix; no Vaul), V5Toaster and `v5Toast`, CommandPalette with `useCommandShortcut`
  - StatusLine, LessonStepHeader, VideoPlayerFrame, PlaylistSidebar, ReadingView with Callout and Takeaways, SplitView (Group/Panel/Separator; tabs on a phone), FeedbackPanel, HintLadder, TutorPanel, Flashcard
  - CertificatePreview, Celebration, Logo
  - `V5DataTable`, imported from `@/v5/design/components/DataTable` (kept out of the barrel)
- **Use `cn` from `@/v5/design` in v5 code, not `@/lib/utils`.** Plain tailwind-merge reads `text-small` as a colour and dropped `text-on-brand`, which gave dark text on the primary button (found by axe).
- **Dialogs opened from state return focus to whatever had it** (`useReturnFocus`). ReadingView makes scrollable `<pre>` blocks focusable.
- **Pure helpers, all tested:** `progress.ts`, `lesson.ts` (step states, hint gate: all 3 hints plus 2 checks, ratings 1–4, interval and clock labels), `trail.ts`, `density.ts`, `contrast.ts`.

### /design
- `DesignPage` uses the lazy route the foundation already set up (staff only).
- **Seven lazy sections** mount near the viewport; `?all=1` mounts them all.
  - Colour: the brand scale plus every token in light and dark with live contrast, and the full pair table.
  - Type, space and motion, with demos.
  - Every component with light and dark previews side by side, a density toggle, and plain usage notes.

### Budgets
- **`npm run size`** runs `check-heavy.mjs` and then size-limit (`.size-limit.js`). The file lists come from `dist/` (entry, preloads, and the route's lazy chunks with their static imports).
  - Limits: `/learn` 200 KB, `/design` first load 230 KB, shared entry 185 KB.
- **`npm run lhci`** runs `scripts/perf/lhci.mjs` with `lighthouserc.cjs`: performance ≥ 0.9, accessibility ≥ 0.9, LCP < 2.5 s.
  - It needs a running server. Set `LHCI_BASE_URL` (default http://127.0.0.1:8787), plus `LHCI_USERNAME` and `LHCI_PASSWORD` (a staff account, for `?ui=v5` and `/design`).
  - It signs in through the API and passes the cookie as an extra header (no puppeteer). Reports go to `.lighthouseci/` (gitignored).
  - Not run in this phase (it needs a seeded server).
- **`vite.config.ts`:** removed the forced `motion` and `ui` vendor groups, as P0 suggested. Every route had been downloading all of Radix, all Lucide icons and all of Motion. `/learn` went from 246.3 to 224.7 KB gzipped, and `/design` from 261.5 to 247.2.
- **Still over 200 KB.** The rest is the shared entry (215 KB), which is the foundation's: `App.tsx` imports `MotionConfig` (the full Motion runtime, 38.6 KB) and zod sits in the entry (`schemas`, 25.9 KB).
  - **Request to P0:** move `MotionConfig` into `LegacyRoutes`, since v5 has `V5MotionProvider`; keep zod schemas out of the entry path (or lazy-load `/login` and `/change-password`); move `OverlayProvider` into the trees. That should bring `/learn` under 200 KB.

### Tests
- **Vitest:** `src/v5/design/tokens.test.ts` (contrast in both themes, light and dark declare the same tokens, every rule is scoped) and `helpers.test.ts` (motion CSS/TS parity, springs, density parity and grid, trail one-path rule, progress, lesson, contrast and `cn` helpers). `src/lib/contrast.test.ts` still passes.
- **`scripts/e2e/v5-design.ts`** (port 8812) covers:
  - `/design` at 390 and 1440 in light and dark: scope, fonts, sections, swatches resolved, no failing pair, no horizontal scroll, and the trail drawn.
  - axe (WCAG 2.2 AA tags): 0 violations in all four views.
  - Dialog focus trap, Escape and focus return; palette filtering; flashcard flip and key rating; the hint gate.
  - The celebration closes itself under reduced motion within 2 s, with no canvas.
  - `?ui=old` has no scope and no v5 fonts.

## Phase 1 follow-up (main session): first-load budget
- `App.tsx` now holds only the router, `AuthProvider`, the public routes (all lazy) and the design switch. `MotionConfig`, `TooltipProvider` and `OverlayProvider` moved into each tree (`LegacyRoutes`, `V5App`, `AuthPages`), so the old UI gets exactly the same providers, but motion (pulled in by the old `Button` via `OverlayProvider`) is no longer in every page's first download.
- zod left the first download: zod-free helper modules `shared/uiFlag.ts` (flag rules, `isStaffRole`), `shared/apiCodes.ts` (`ERROR_CODES`) and `shared/contentConstants.ts` (`QUIZ_PASS_THRESHOLD`), each re-exported from its original module so no caller changes.
- Result (`npm run size`, gzipped): `/learn` 193 KB (limit 200), `/design` 216 KB (230), shared entry 92 KB (185; was 209).

## Phase 2

Today agent. Files: `src/v5/learner/today/**`, `server/src/v5/{today,streak,xp,announcements}/**`, `shared/{today,xp,streak}.ts` (+ tests), `scripts/e2e/v5-today.ts`. Outside that, one-line hooks: route registration in `server/src/app.ts`, the nightly pass in `server/src/index.ts`, XP hooks in `server/src/progress/repo.ts` (`recordAttempt`) and `server/src/goals/repo.ts` (`achieveGoal`). `server/src/v5/today/` is new (the aggregator); no one else owns it.

### XP (`shared/xp.ts`, `server/src/v5/xp/repo.ts`)
- **For other agents:** `awardXp(db, userId, kind, refId, { at?, xp? })` → `{ awarded, xp }`; `awardXpSafely` never throws. Idempotent on (user, kind, ref). `xp` overrides the table amount (Lesson's half award); a reduced award can't later be topped up. Ref shapes: `stepRef(topicId, step)`, `levelUpRef(skillId, level)`, review session = session id (Review uses it).
- Kinds: `step_completed, quick_check_passed, lesson_completed, topic_test_passed, review_session, case_passed, skill_level_up, certificate`.
- **Milestones are awarded twice-safe:** a hook where it happens (topic test passed, goal achieved) plus `syncMilestoneXp`, which reads topic_attempts (first pass per topic), achieved goals, unrevoked certificates and evaluations back. It runs on `/api/v5/today`, `/api/v5/me/xp` and nightly, reads first and only writes what's missing. So P5 needn't call anything for certificates (calling `awardXp(…, "certificate", certId)` is still fine), admin-achieved goals count, and pre-v5 history gets XP with its original dates.
- **Skill level up:** across a learner's evaluations, oldest first; the first is the baseline (placement isn't a level up); each new highest level counts once (`skillId:level`). v4 `mastery` (measured only) when present, else `skills[].level`.
- `GET /api/v5/me/xp` → `{ total, thisWeek (ISO week, UTC), recent[10] }`.

### Weekly streak (`shared/streak.ts`, `server/src/v5/streak/repo.ts`)
- ISO weeks in UTC, `YYYY-Www`. A freeze belongs to the month of the week's Thursday; 1 per month, not carried over, spent automatically on a missed week, never on a streak of 0. The running week counts once met and is never a miss.
- **Recomputed from the record** on every Today read (and nightly, `startNightlyStreaks`, 24 h, unref'd), walking at most 260 weeks from the account's creation week; stored in `weekly_streaks` (history = last 26 weeks; `best` never goes down).
- **Time logged per week:** completed topics count their `estMinutes`, ticked course lessons their `est_minutes`, and video watched on not-yet-completed topics its watched seconds in the week it was last played (video_progress has no per-day log). **Steps:** `step_completed` XP + topic/lesson completions.
- **Goal:** `user_prefs.weeklyGoalHours` → admin's `learner_priorities.hours_per_week` → active week budget → none (3 steps rule). The same goal applies to past weeks (no per-week goal history exists).

### `GET /api/v5/today` (`shared/today.ts` `TodayResponse`)
- One call: hero, week (trail stops: done first, then lane order), goal, streak (last 8 weeks), up next (3, with `why` chip "Must know for Backend" — lane phrase + track name, or course title — and the plan's reason), review, wins, announcements, XP totals.
- **Resume and review are read through their owners' endpoints in-process** (`app.inject` with the caller's cookie): `GET /api/v5/lessons/resume` (bare object or `{resume}`; `null`/404/error → plan fallback) and `GET /api/v5/review/summary` (404 → `{dueCount: 0}`, other errors → `review: null`, card hidden). Both exist now and are used.
- Hero link: `/learn/lesson/:topicId?step=…&t=…` (`t` only on Watch). Plan fallback: first pending item in lane order, `?step=watch`; course lessons go to `/learn/library/:courseId`.
- Speed: e2e median warm round trip 25–28 ms (the first read, which builds the week, ~50 ms).
- Wins link: certificate → `/learn/certificate/:id`, case → `/goals/:goalId` (old page in the v5 shell), level up → `/learn/me`.

### Announcements
- Learner `GET /api/v5/announcements` (Today embeds the same list): live (not expired) and for them (all / their `learner_profiles.department_id` / their id), pinned first, newest, max 5.
- Admin `GET/POST/PUT/DELETE /api/admin/announcements[/:id]`, `requireStaff`, audited `announcement.create|update|delete`. Schemas `announcementInputSchema` / `announcementPatchSchema` and `AdminAnnouncementView` live in `shared/today.ts` (P7: import from there). Audience must name someone; empty lists are dropped on save.

### Front end
- **Budget:** `/learn` was at ~190 KB before Today (V5App + shared vendor chunks). To fit 200 KB, only the header, hero and skeleton are in the first download (199.5 KB measured). Everything under the hero (trail, ring, streak, cards, and the design system's EmptyState/ErrorState) is `TodayDetails`, a lazy chunk requested when TodayPage's module runs, in parallel with the data. The hero's Continue uses the primary-lg button classes as a string (`PRIMARY_LG`, test-checked equal to `buttonVariants`) and its lane chip a local label map (test-checked against `LANE_META`), so cva/Slot and the lane icon set stay out. **Headroom is ~0.5 KB:** any growth of V5App's shared chunks will push `/learn` over; P1/P9 should look at the `Logo-*` shared chunk (54 KB gz: motion + sonner + more, shared with /design).
- TodayPage calls `useV5Root()` and wraps itself in `V5MotionProvider` (V5App still uses the temporary shell). One entrance (opacity + 8 px), MotionConfig handles reduced motion.
- Skeleton appears after 300 ms; quiet refresh on tab focus keeps the old data (nothing on Today is mutated, so nothing optimistic beyond that). Error: design ErrorState with Try again (a plain fallback if its chunk can't load).
- Mobile grids use `minmax(0,1fr)` columns: plain `grid` let truncated titles widen the page by 69 px at 390.
- The shell's bottom nav (Today · My plan · Library · Review · Me) works; not touched.

### Tests
- Vitest: `shared/streak.test.ts` (ISO keys incl. 53-week years, met rule, new user, freeze used, second miss breaks, month rollover, cap), `shared/xp.test.ts` (table, refs, why chips, lesson links, audience), `src/v5/learner/today/format.test.ts`, `server/src/v5/today/today.test.ts` (today with/without plan, trail/ring/streak after completions, 3-step rule, wins, hero resume href, XP idempotency + hooks + level ups, announcements visibility/CRUD/audit/403).
- `scripts/e2e/v5-today.ts` (port 8821, `E2E_APP_DIR`): all checks pass, axe 0 violations at 390/1440 light/dark, screenshots in `%TEMP%/claude/e2e-shots-v5-today`. The shared `snapshot-build.sh` failed on another agent's type error (`server/src/v5/admin/admin.test.ts`), so the run used a private copy built with `vite build` + `build-server.mjs` (same output, no `tsc -b`).

## Phase 3

Lesson agent. Files: `src/v5/learner/lesson/**`, `server/src/v5/{lesson,notes,tutor,problems}/**`, `shared/lesson.ts` (+ test), `scripts/e2e/v5-lesson.ts`. Small edits outside: one import + one call in `server/src/app.ts` (`registerV5LessonRoutes`), tasks `tutor_answer` / `tutor_solution` in `shared/aiRouting.ts`, purpose `tutor` in `shared/enums.ts` (`taskForPurpose` needs it), `server/src/ai/adapters/mockTutor.ts` + two `case` lines in `mock.ts`, and an optional, additive `playerVars` option on `src/components/trail/useYouTubePlayer.ts` (old callers unchanged) for captions on by default.

### Steps and gating (`shared/lesson.ts`)
- **Which steps:** Watch if the topic has a video; Read always; Do for a coding challenge, a practice task or a spoken practice; Check for a quiz test. A coding topic is Watch → Read → Do and a quiz topic Watch → Read → Check (no topic has both a code challenge and a quiz).
- **Next rules:** Watch = the v4.3 rule (`videosCleared`: all watched, warn mode, or exempt); Read = end of article seen (IntersectionObserver) or "Mark as read"; Do = passed or 3 checks; Check = test passed. When a rule is met the client saves `stepDone`; **the server re-checks every claim** (Watch against `topicVideosView`, coding Do against `topic_attempts`, Check against a passed quiz attempt or completed progress; Read and hands-on practice are trusted, being formative) before any XP. Done flags never go back. Next stays disabled until the server agrees.
- **XP** through the Today agent's `awardXp` (`step_completed` per `stepRef`, `lesson_completed` per topic, `quick_check_passed` per topic). One exception, in `server/src/v5/lesson/xp.ts`: a Do step finished after an early solution trade earns **5** (half). `awardXp` has no amount override, so that one row is inserted directly with the same kind/ref and `on conflict do nothing`. **Request to P2:** add `options.xp` to `awardXp`; then swap the adapter's direct insert for it.

### Server API
- `GET /api/v5/lessons/resume` → `{topicId, title, step, positionSec, minutesLeft, lane}|null`: the newest unfinished `lesson_state` row in the plan; `positionSec` only when the step is Watch; `lane` from the active weekly plan.
- `GET|PUT /api/v5/lessons/:topicId/state` (PUT returns `{state, awarded, justCompleted}`); `GET|POST …/quick-check` (1–2 of the topic's authored quiz questions, stable per learner, single-answer first; never an attempt); `POST …/solution {trade}`; `POST …/run {mode: snippet|checks}`.
- Notes: `GET|POST /api/v5/lessons/:topicId/notes`, `PATCH|DELETE /api/v5/notes/:noteId` (owner only, 404 otherwise; 200 per lesson). P4's `/api/v5/me/notes` reads the same table.
- Problems: `POST /api/v5/lessons/:topicId/problems` (notifies every staff member, kind `lesson.problem_reported`, link `/admin`); staff plugin `GET /api/admin/v5/problems?status=open|resolved|all` → `{problems, openCount}`, `POST /api/admin/v5/problems/:id/resolve` (audit `lesson.problem_resolved`).
- Tutor: `GET|POST /api/v5/lessons/:topicId/tutor`, `POST /api/v5/tutor/messages/:id/rating`; staff plugin `GET /api/admin/v5/tutor-quality` → `{total, helpful, unhelpful, unrated, last7Days, unhelpfulAnswers[]}`.

### Ask Oye
- Grounded like the v4.3 topic tests: `system` = rules + the lesson's `buildPassages` lines (`[sum.p1] {Summary} text`) + the practice task, so it is cached per lesson; `user` = step, code (Do only), last 3 turns, question. Citations are kept only if `citationProblem` passes. The page renders passages with the same ids (`passageChunks` mirrors `paragraphs`; a test checks the ids match), so a citation jumps to and focuses the passage.
- Socratic on Do: the prompt says hint, not solve; `limitCode` also cuts any code block on the Do step to 3 lines.
- Refused (403) on the Check step and while the learner has an `in_progress` assessment; 503 without AI ("Ask Oye isn't set up yet"); daily cap from app_meta `tutor.daily_cap` (default 30), counted per UTC day from `tutor_messages`; a failed AI call isn't stored or counted.

### Do step and solutions
- The content has **no reference solutions or hints**. Hints are built in code (`codeHints`): nudge (the first failing check), the idea (first sentence of the summary), part of the code (starter + a commented plan from the check names). The design `HintLadder` shows the three rungs without its own solution gate; the solution has its own box.
- **Solution:** written once per challenge by the AI (`tutor_solution`), then **run against every test in the server sandbox**; only a passing one is shown, cached in app_meta `lesson.solution:<topicId>` under the challenge hash (a failure is remembered for a day). Free after 3 checks; earlier with `trade: true` (half XP, said plainly), charged only if there was something to show. The mock's solution never passes, so dev shows "We don't have a checked solution for this one yet".
- Practice tasks reuse `TaskView` + `gradeTask` in the same split layout with `FeedbackPanel`; "See the answer now" = half XP and the step counts as done. Role-play: "I've finished the conversation". Spoken practice reuses `SpeakPracticeSection`; when it is the only Do content, "I've practised this".

### Running code: on the server, not in the browser
- **Found:** the production CSP has no `'unsafe-eval'`, and `lib/codeRunner.ts` builds functions from strings inside its blob Worker, so in a production build the browser runner throws `EvalError`. This also affects the old topic page's "Run visible tests" and v4 snippet runs (not changed here; worth a look in P8/P9). The lesson's "Try it" and the Do step's "Run" call `POST …/run` instead: a snippet is wrapped as one function returning its captured `console` lines (`server/src/v5/lesson/run.ts`) and run in `app.sandbox`; Do "Run" runs only the visible checks and records nothing (its Console tab shows what the code prints for the first check). TypeScript is stripped client-side with sucrase (no eval). HTML/CSS previews are an iframe `srcdoc` with `sandbox=""` (no scripts). The editor is the existing lightweight textarea `CodeEditor`, not Monaco (small, works in the split view and on phones).

### Watch, Read, Check
- Watch reimplements the `VideoPlaylist` tracking loop (same 5 s samples, keepalive on exit, `upNext` reducer, unplayable reporting) in the v5 frame with `PlaylistSidebar`, speed 0.75–2×, captions (`cc_load_policy=1`, `cc_lang_pref=en`; the toggle is kept in localStorage), chapters (playlist entries sharing a video id with a start or chapter label), notes (N), and the quick check when the last video ends or on the first Next. The transcript panel renders only when a transcript is passed in (none exist for YouTube).
- Read: one pass (`article.ts`) builds the article tree, so glossary tooltips mark only the first occurrence in reading order (handbook glossary names + aka, whole words, plus existing `[[term:id]]` links). Paragraphs starting "Tip:", "Watch out:", "At Oyelabs:" or "Note:" become callouts; filled SOP blocks show as "At Oyelabs" callouts; "Sources last checked" uses the newest `webRefs[].verifiedAt` and is omitted when there is none.
- Check: a calm form over `submitAttempt` (passes at 80%, each question right or not yet), every answer explained with its source, `RequestReview` on wrong ones; the v4.3 video lock shows a "Go to the videos" status instead of the form.
- Focus mode is a fixed full-viewport layer over the shell (the shell isn't P3's), toggled with F or the button; Escape leaves it. Shortcuts ignore typing targets, modifier keys, and Space on pressable controls.

### Schema requests
- `lesson_state.solution_traded_at` (int, nullable). Until then the trade flag rides in the `step_done` JSON as an extra `solution: true` key, read tolerantly (`server/src/v5/lesson/repo.ts`).

### Size
- `npm run size` (snapshot build): `/learn` 199.55 KB (limit 200), shared entry 92.7 KB. **The lesson route's first load is about 291 KB gzip** (76 files: the shared ~200 KB plus `LessonPage` 20 KB, the design `Learning` chunk 16 KB, zod 26 KB through `@shared/video` / `@shared/lesson` value imports). CodeDo 3.8, TaskDo 1.8 (+ task kinds), TryIt 1.2 and TutorDock 1.6 KB load on demand. Splitting `shared/lesson.ts` schemas out wouldn't help while `@shared/video` (needed by the player) imports zod.

### Tests
- Vitest: `shared/lesson.test.ts` (steps, gating, time left, hint ladder, shortcut map, passages/takeaways/callouts, glossary matching, reading time, cap counting, notes sort), `server/src/v5/tutor/tutor.test.ts` (passage ids match grounding, cached system vs user, citation checking, code limit), `server/src/v5/lesson/lesson.test.ts` (state + claim checks + XP once + halving, resume, quick check, run, notes CRUD/ownership, problems + admin + 403, tutor grounding/citation, refusal on Check and during an assessment, cap from app_meta, ratings + quality report, no-AI state).
- `scripts/e2e/v5-lesson.ts` (port 8822, `E2E_APP_DIR`, a content copy with one js block added): all checks pass; axe 0 violations at 390/1440 light/dark on Watch, Read, Do and Check; screenshots in `%TEMP%/claude/e2e-shots-v5-lesson`.
- Full suite: lint clean; vitest 2388/2389 (the one failure, `polyglot.test.ts` java on Piston, is flaky under load and passes alone); `tsc -b` clean except `server/src/v5/admin/admin.test.ts` (P7's file).

## Phase 7

Admin agent. Files: `src/v5/admin/**`, `server/src/v5/admin/**`, `shared/{adminInbox,reports}.ts`, `scripts/e2e/v5-admin.ts`. Outside that: one import + one `app.register` line in `server/src/app.ts`; the admin part of `src/v5/app/V5App.tsx` (lazy `AdminShell` from `src/v5/admin/shell`, new routes); `src/features/admin/copyGuide.test.ts` now also scans `src/v5/admin/**`, `server/src/v5/admin/**`, `shared/adminInbox.ts` and `shared/reports.ts`.

### Shell
- `src/v5/admin/shell/AdminShell.tsx` replaces P0's temporary admin shell (still in `shells.tsx`, now unused by V5App). It is `lazy()`, so learners never load it; it calls `useV5Root({ density: "compact" })` and wraps itself in `V5MotionProvider` (the design components use `m.*`). No second Toaster: `v5Toast` renders in the `OverlayProvider` toaster V5App already mounts (two Sonner toasters would show every toast twice).
- Nav: Inbox, People, Onboard, Library, Overview, Reports (the first five are the phone's bottom bar); "More" (Announcements, Problems reported, Tutor answers) and a collapsed "Older pages" list. The inbox count shows as a nav badge.
- ⌘K / Ctrl+K: verbs ("Onboard someone", "Create course", "Open AI usage", "Write an announcement"…), every page, and people (read 1.5 s after the console opens, so a name typed straight away is found). **Own matching, not cmdk's** (`shell/palette.ts`): every typed word must start a word of the label, hint or keywords; people come first when something is typed. cmdk's fuzzy score let "Tutor answers" (keyword "helpful") beat "Rahul Verma" for "rahul".
- Shortcuts (`shell/keys.ts`, pure): `g i/o/p/n/l/r`, `?` opens the list. Ignored while typing or while a dialog is open.

### Server (`/api/admin/v5`, staff only, one plugin)
- `GET inbox`: groups built from existing tables in a fixed order, oldest first, 5 per group with the full count. Tests (`awaiting_approval` → "Send the test" = the existing approve; goals set but no test → "Send the test" = the existing issue), review requests (`listReviewRequests` → "Give full marks" = the existing decision endpoint), generated courses `needs_review` ("Fix automatically" while attempts are left, else "Edit it") / `pending_review` ("Publish" = the existing decision), open `problem_reports` ("Mark fixed" = P3's resolve), stuck learners ("Remind <name>"), tests with hard warnings or ended early in the last 30 days ("Look now"), setup (AI not connected or failing, skipped with the mock; web search not set up; STT missing in production).
- **Stuck rule** (`shared/adminInbox.ts` `isStuck`): active learner, a plan with lessons, not all done, and no learning activity for 7 days; someone who never started counts from the day the plan reached them. "Activity" = topic progress, course lessons, video progress, topic attempts, lesson_state, review logs, test submitted; not sign-ins.
- "Mark as checked": `POST inbox/dismiss|undismiss {key}` in app_meta `v5.inbox.dismissed` (`{key: ms}`, pruned after 90 days). A checked stuck learner comes back after 7 days if still stuck; a checked test warning stays checked.
- `POST people/nudge {userIds}`: a notification (kind `admin.nudge`) to active learners; audited `learner.nudged`. `GET people` (signals added to `/api/admin/users`), `GET people/:id/activity` (timeline + plan summary).
- `GET overview`, `GET reports?days=|from=&to=` (max 366 days), `PUT reports/weekly-email {on}`. Hours learned = the expected minutes of lessons finished in the range (a lesson left open doesn't count). Skill level-ups compare each evaluation with the learner's previous one. Practical cases = achieved case goals ∪ `case_passed` XP, unique per (learner, ref).
- **Weekly email:** app_meta `v5.reports.weekly_email` = on/off, `…_to` = the admin who turned it on, `…_last` = last queued. No timer: `maybeQueueWeeklyReport` runs on inbox/reports reads and queues at most one per 7 days into `email_outbox` (kind `admin.weekly_report`, status `queued`, `to_address` = their username, since users have no email column). The Phase 6 sender delivers it.
- `GET library`: status (live / being created / needs a look / draft / not used), lessons, link health from `course_sources` (total, broken, last checked), saved versions, and the number of `course.generate` jobs still running.
- **Versions** (`content_versions`, entity "course"): `POST courses/:id/versions` after every editor save stores the whole `getCourse` shape; identical to the latest means not stored again. `GET …/versions`, `GET …/versions/:n`, `POST …/versions/:n/restore`: snapshots the current state first ("Before restoring"), then matches sections and lessons by id (updated in place so learner progress stays; missing ones recreated with their old ids; newer ones removed), then stores the result as a new version. So a restore is undone by restoring the version before it (the UI's Undo does that). Practice tasks and tests on a lesson are not part of a version and are left alone.

### Screens
- Inbox: each item = one line + one primary button (+ a quieter second choice). Reversible actions (mark as checked, reminders, mark fixed) leave at once and are sent when the 6 s Undo window closes (`parts/deferred.ts`; anything still waiting is sent on leave). Decisions (full marks, send the test, publish, fix) are sent at once and leave optimistically; an error puts them back. Empty: "All caught up 🎉".
- People: the existing DataTable kit through `V5DataTable` (compact, sticky header, CSV, personal saved views) with built-in views Everyone on the programme / Stuck / Test pending / Learned this week / Suspended / one per department; `?view=` applies one (links from the inbox and overview). Bulk: Send a reminder, Suspend (Undo = activate), Archive (Undo = restore). A row opens a non-modal side sheet (`?person=id`): `nextAction` status line with its one button (assign / enable / build run here; the rest open the full page), plan, goals, recent activity, "Open full page".
- Onboard: `QuickOnboard`, `BulkOnboard`, `SetupForm` and the same two calls (create the account, then save the setup that sends the test) as the older page; `?mode=bulk`. Creating an admin stays on the older page at `/admin/onboard/classic`.
- Library + editor `/admin/library/:id/edit` (Tiptap core/react/starter-kit/pm, all MIT, lazy with the route): one lesson at a time, saved through `PUT /api/admin/courses/topics/:id`. `blocks.ts` maps the document to that shape: video → `video`/`videoTitle` (one per lesson, shown first), reading → the RichText Markdown subset, code → a fenced block, **quick check → a ```` ```quiz ```` fence with `{question, options, correct, why}` and task → a ```` ```task ```` fence with `{instructions, doneWhen}`** in `body`. Blocks move with Move up/down buttons (no dragging); new blocks go after the current top-level block, never inside a list item. "Make it live / a draft", add a lesson / part, remove a lesson (Undo restores the version saved just before).
- Reports: presets 7/30/90 days or From/To, five sections (completion, time, skill growth, test results, AI cost), Recharts only in `parts/Charts.tsx` (lazy), CSV = summary rows + one row per day (`toCsv` defuses `= + - @` cells). Overview: four tiles (each links to its detail), plan-done-by-join-month chart, departments table, CSV.
- Announcements (P2's API), Problems reported and Tutor answers (P3's APIs) show a "coming soon" empty state on a 404. Problems have no "reopen" endpoint, so their Undo is the delay before sending.
- Filters are button groups with `aria-pressed`, not Radix tabs: a tab with no tab panel fails axe (`aria-valid-attr-value`, critical).

### For other phases
- **P4 (learner course page):** render ```` ```quiz ```` and ```` ```task ```` fences in an admin course lesson as a quick check and a task (JSON shapes above; `correct` holds option indexes). The older `RichText` shows them as code. "Preview as learner" opens `/learn/library/:courseId?preview=1`.
- **P1 / main session: the v5 type scale is not generated.** `src/index.css` imports `theme.css` and then has its own `@theme { --text-*: initial; … }`, which wipes `--text-caption/small/body/lead/h1–h4/display`. So `text-small`, `text-h2` etc. produce no CSS anywhere in v5 (checked with a `@tailwindcss/node` compile and in `dist/`); all v5 text renders at 16 px. Moving the import doesn't help (imports are hoisted). A fix that leaves the old UI alone: declare the v5 sizes in `theme.css` as `@utility text-small { … }` etc., or drop the `--text-*: initial` reset after checking that no old class (`text-4xl`…) starts generating. Not changed here (not P7's files).

### Tests and results
- Vitest: `src/v5/admin/admin.test.ts` (grouping, removal, reversibility, dismiss expiry, stuck rule, ranges, buckets, level-ups, test outcomes, unique cases, weekly email due, CSV escaping, block (de)serialisation round trip checked against the real Tiptap schema, blocks nested in lists, the Undo queue, shortcuts, palette matching) and `server/src/v5/admin/admin.test.ts` (inbox groups + actions through existing endpoints + dismiss/undo + 403, people signals/timeline/nudge, overview and report numbers, weekly email queueing, version snapshot/dedupe/preview/restore/undo, library link health). Full suite 2390/2390; `tsc -b` and lint clean.
- `scripts/e2e/v5-admin.ts` (port 8824, `E2E_APP_DIR`): all checks pass. Give full marks: **1 click** from the inbox (baseline 2). Onboard + send the test from the inbox: **3 clicks** after typing (baseline 3; 2 from the onboard page). axe 0 serious/critical on 11 routes at 768 and 1440 in light and dark, plus the palette and the announcement dialog, and the inbox + people sheet at 390 (no sideways scroll). Screenshots in `%TEMP%/claude/e2e-shots-v5-admin`.
- `npm run size` on the snapshot: `/learn` 199.57 KB (limit 200), shared entry 92.7 KB; the admin shell, Tiptap (`CourseEditPage` chunk) and Recharts (`Charts` chunk) load only on their routes.

## Phase 4

Plan, Library, Review and Me agent. Files: `src/v5/learner/{plan,library,review,me}/**`, `server/src/v5/{review,me}/**`, `shared/{review,me}.ts` (+ tests), `scripts/e2e/v5-learner-pages.ts`. Outside them: two route lines in `server/src/app.ts`, and one hook line in `recordAttempt` (`server/src/progress/repo.ts`).

### Review (FSRS)
- **Scheduler** `server/src/v5/review/scheduler.ts`: ts-fsrs 5.4.2, `request_retention` 0.9, fuzz on. Cards are stored as JSON with dates as epoch ms (`storedCardSchema`, zod-validated on read); `due` is copied to its column. The schema's loose `$type` was left alone (the foundation's file); the zod schema is the real check.
- **Card sources** (`cards.ts`), all idempotent through the unique (user, source, ref) index:
  - `mistake`: every wrong answer in `topic_attempts` (quiz), keyed by the `topic_test_items` row id. Front = question and options; back = key, explanation and what they chose.
  - `topic_point`: up to 3 key points (first summary paragraph and the first paragraph of two sections, from `topic_grounding`) of topics completed in the last 30 days.
  - `glossary`: terms practised in the handbook flashcards, plus `[[term:…]]` terms in completed topics.
  - `quiz_item` (correct answers) is **not** generated: re-drilling what they got right adds cards for little gain. Mixed practice interleaves the other three.
- **Hooks**: `onTopicAttemptSafely` runs inside `recordAttempt` (every graded attempt, from any route; never throws). A throttled `syncAll` (once a minute per learner) runs on summary, and a forced one on session; it also backfills history from before v5.
- **Handbook bridge**: `migrateHandbookFlashcards` runs once at route registration, guarded by `app_meta` `v5.review.handbook_flashcards_migrated`.
  - Leitner box n > 1 becomes an FSRS Review card with stability = the box interval and the same due date; box 1 becomes a new card.
  - `handbook_flashcards` rows are kept for the old design. Rating a glossary card in v5 also moves its Leitner box (1 → again, 2/3 → good, 4 → easy), so both designs show the same deck.
  - A term practised later in the old design gets its card on the next sync. Later old-design ratings don't flow back into FSRS (accepted).
- **Sessions**: `composeSession` in `shared/review.ts` (pure, tested).
  - `due` = due cards, most overdue first. `mistakes` = mistake cards, due first. `mixed` = due first, then soonest, interleaved across topics.
  - Capped at 300 estimated seconds (`estimateCardSeconds`: about 4 words a second plus think time, 8–60 s) and 30 cards.
  - The payload is self-contained (fronts, backs, interval labels per rating), ready for P8 offline.
- **XP**: the rate request's `sessionId` is stored in the log JSON. When 5 distinct cards of a session are rated, `awardXp(…, "review_session", sessionId)` (Today's `server/src/v5/xp/repo.ts`) pays once.
- **APIs**: `GET /api/v5/review/summary` → `{dueCount, mistakesCount, totalCards, reviewedToday}`; `GET /api/v5/review/session?kind=due|mixed|mistakes`; `POST /api/v5/review/cards/:id/rate {rating 1–4, sessionId?}` → `{card, nextIn, dueCount, xpAwarded, ratedInSession}`.
- **UI**: our own card, not the design `Flashcard`. Mistake cards need option lists with "Right answer" / "You chose this" marks, and Space must work page-wide (the design one flips only when focused).
  - Space flips unless a button or link has focus (then that control handles it). Focus moves to the next card after each rating. 1–4 rate.
  - Quiz text gets a tiny fenced-code / inline-code renderer (`CardText.tsx`); no HTML is injected.

### Me
- **Settings** `GET/PUT /api/v5/me/settings`: `updateSettingsSchema` (zod, partial, `.strict()`) over theme, reminderTime, quietHours, captions, autoplayNext, reducedMotion, celebrations and weeklyEmail.
  - Autoplay is the existing `autoplayNext` key the player reads, so it's one setting in both designs.
  - PUT merges into `user_prefs.data`; uiV5, welcomeDoneAt and every other key are kept. Unknown keys are a 400.
- The theme applies at once and is written to `uiStore` (`oyelabs-ui`), which index.html reads before first paint.
- Reduced motion applies to the Me screen through `V5Screen`. **Request to P0/P8**: read `/api/v5/me/settings` once in `V5App` and pass `reducedMotion` to `useV5Root`/`V5MotionProvider` for every screen.
- **Profile** `GET /api/v5/me/profile`:
  - skill levels from the latest v4 evaluation (`mastery`, measured and inferred; else the measured levels);
  - practical cases = achieved `case` goals; certificates = non-revoked `certificates` rows;
  - XP = Today's `xpTotals` plus 8 ISO-week buckets read from `xp_events`; streak = Today's `refreshStreak`.
- **Notes** `GET /api/v5/me/notes?q=`: reads `lesson_notes` (newest first, at most 500). Links are `/learn/lesson/:topicId?step=watch&t=<sec>&video=<id>`. The lesson player reads `step` and `t` today; **request to P3**: read `video` too, so the right video opens when a lesson has several.
- **Certificates**: "Download PDF" reuses `generateCertificatePdf` (lazy). "Add to LinkedIn" uses `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name&organizationName=Oyelabs&issueYear&issueMonth&certUrl=<origin>/verify/<id>&certId`. LinkedIn's help page (a528030) only says the button is a static URL that opens the certification form, without documenting parameters, so this is the widely used format, unverified.
- "Use previous design" (PUT /api/me/ui {v5:false}; the text says it stays for two more weeks) and "Replay the welcome" (`/learn?welcome=1`) are under Settings. Tabs keep `?tab=`.

### Library
- `GET /api/v5/me/library` and `/:id` live in `server/src/v5/me/library.ts`. Items: curriculum modules the plan allows (id `module:<track>:<module>`) and `coursesFor` courses (admin courses and v4.4 library courses, which are published `everyone` courses).
- **Outcomes**: milestones first, then topic titles (modules) or section titles (courses), turned into "You'll be able to…" lines by `outcomeLine`. A leading verb is kept; otherwise Explain / Use / Apply / Reason about by level. Titles aren't lower-cased (proper nouns).
- **Format**: video-heavy, reading-heavy or mixed, from the share of lessons with a video and words per lesson (`formatOf`). The filter offers video and reading.
- **"Recommended for you"** (`recommendation`, shared): on the path first; else it teaches a skill that an active goal (or a priority of 3 or more) needs and the learner is below the goal's target (default 3). Never on finished items.
- **Prerequisite ticks**: the skills' `prerequisites` minus the course's own skills; "you have it" from level 2 (`HAVE_LEVEL`).
- Course lessons open `/learn/lesson/<courseTopicId>?course=<courseId>`. **Request to P3**: course lessons aren't curriculum topics, so the player needs to handle `?course=`; until then they land on the player's not-found state.
- **Search and filters** run on the client (`libraryLogic.ts`, tested). Every word must match. Scores: title start 10, word in title 8, in title 6, skill 5, outcome 3, summary 1. Ties: recommended, then in progress, then title.

### My plan
- Same APIs as v4.3 (`/api/me/week`, `/api/me/path`, `POST /api/me/week/next`).
- Trails are drawn in `PlanTrails.tsx` from `features/plan/trailGeometry`, not with the design `Trail` (it has its own test id). Kept test ids: `week-trail-path` (one `M`), `week-trail-progress`, `week-trail-waypoint`, `overview-trail-path`.
- A waypoint opens an inline detail (lane, "Why:" chip from the item source, reason, "Needs first"), not a popover.
- List view = lanes (`week-lanes`); the choice is kept in localStorage `oyelearn.v5.plan.view`. Items link to the lesson player (`v5Href`).

### Found, not fixed (outside my files)
- **The v5 type scale isn't generated.** `src/index.css` imports `theme.css` on line 2, then its own `@theme` block sets `--text-*: initial`, which wipes `--text-caption` … `--text-display`. So `text-h1`, `text-small`, `text-body` and the rest produce no CSS (checked in `dist`: no `.text-small`, no `.text-h1`), and every v5 heading renders at body size. Likely fix (P1 or main session): move the `@import './v5/design/theme.css'` below the old `@theme` block, then recompile and compare as P1 did.
- `npm run build` currently fails on other groups' in-progress type errors (`LessonRich.tsx`, `admin.test.ts`, `today.test.ts`). So the e2e ran on a private copy built with `vite build` + `build-server.mjs` (no `tsc -b`) instead of `snapshot-build.sh`.

### Tests
- **Vitest**:
  - `shared/review.test.ts`, `shared/me.test.ts`;
  - `server/src/v5/review/review.test.ts`: scheduler wrapper, a mistake card from a real wrong attempt, idempotent hooks, key points, due count drop, five-minute cap and interleaving, XP once, ownership, Leitner migration and bridge;
  - `server/src/v5/me/me.test.ts`: settings merge and validation, notes and search, profile, library and course page, 404s;
  - `src/v5/learner/{plan/planLogic,library/libraryLogic,review/CardText}.test.ts`.
- **`scripts/e2e/v5-learner-pages.ts`** (port 8823, `E2E_APP_DIR`): every check passes. axe finds 0 serious or critical issues on 9 views × 390/1440 × light/dark, with no sideways scroll. Screenshots are in `%TEMP%/claude/e2e-shots-v5-learner`.

## Wave 2 follow-up (main session)
- **v5 text sizes produced no CSS.** `index.css`'s `@theme` reset (`--text-*: initial`, `--font-*: initial`) came after the imported `theme.css`, wiping the v5 sizes. The resets moved to the top of `theme.css` (reset → v5 sizes → old fonts and sizes). The compiled CSS diff shows only added `.text-{display,h1..h4,lead,body,small,caption}` rules; every old rule is unchanged. v5 screenshots taken before this were at 16 px everywhere; Phase 8/9 re-check layouts.
- **Snapshot builds skip `tsc -b`** (`scripts/e2e/snapshot-build.sh`), so one agent's unfinished types don't block another's e2e. CI-equivalent `npm run build` still type-checks.

## Phase 5 (written up on resume, 2026-10-06)
The previous session stopped after the Phase 5 code was in place but before this write-up. Summary from the code:
- **Assessment UI** (`src/v5/assessment/**`): `Sitting` (the sheet), `QuestionNavigator` (answered / flagged / unanswered filters, `navigator.ts` pure + tested), overall clock only, an autosave line, the 3-run counter, Speak with "Type your answer instead", calm proctoring words (`Proctor.tsx`). Sittings from before v4 keep their own page.
- **Results** (`server/src/v5/assessment/results.ts`, `shared/assessmentResults.ts`, `story.ts`): the story ("You're strong at… / We'll start with… because…"), levels per goal, and every question reviewable once the evaluation exists. This is behind the admin setting `assessment.show_items_after` (default on). Items a learner has seen are already kept out of their later tests (`seenItemIds`). Also "Request review" (v4.4 flow) and "Your plan is ready" → the animation → `/learn/plan`.
- **Certificates** (`server/src/v5/certificates/**`, `shared/certificates.ts`): the server issues a row once, when a goal, course or track is complete. The id is a short public code and the hash is over the normalised holder name. The page shows the art, a QR to `/verify/:id`, a PDF (lazy) and a 1200×630 share image. Admins can revoke one, and the verify page then says "withdrawn".
- e2e: `scripts/e2e/v5-assessment.ts` passes (sheet, results, certificate, verify; axe 0 serious at 390/1440 light/dark).

## Phase 6 (written up on resume, 2026-10-06)
- **XP and streak**: rules as in PLAN (cases weighted highest); `shared/motivation.ts` (tested). The weekly goal is a pref (`weeklyGoalHours`, 0.5–40 h).
- **Celebrations** (`src/v5/motivation/celebrate.ts`, `HostImpl.tsx`): queued, shown on the next navigation, and skippable. With `celebrations` off there's an XP chip only. With reduced motion there's a static badge and no confetti. The weekly summit celebrates once.
- **Notifications** (`server/src/v5/notify/**`): an hourly scheduler (`startMotivationScheduler`) sends the bell's in-app items, an optional reminder at the learner's time (outside quiet hours, at most 1 a day) and the weekly recap. The email outbox is drained by `server/src/v5/email/sender.ts` (nodemailer). Without SMTP, rows are marked `skipped` with a plain reason.
- **Team board** (`server/src/v5/leaderboard/repo.ts`): off by default. The super admin turns it on from Reports, and it shows only learners who opted in (first names + XP).
- **Welcome**: 3 steps, once on Today (`welcomeDoneAt`), skippable, and replayed with `/learn?welcome=1` (from Me).
- e2e: `scripts/e2e/v5-motivation.ts` passes.

## Phase 8.0 (written up on resume, 2026-10-06)
- **Code runner vs. production CSP**: learner code no longer runs in the app page. `src/lib/sandboxRunner.ts` + `public/runner.html` run it in a `sandbox="allow-scripts"` iframe (opaque origin), which spawns a Worker. Only `/runner.html` gets a CSP that allows eval (`buildRunnerCsp`, no network); the app CSP keeps no `'unsafe-eval'`. A run's clock starts when the frame is ready, and a frame that never loads fails after 10 s with a plain message. Unit tests: `sandboxRunner.test.ts` and `csp.test.ts`.
- **Lesson budget**: Read, Do, Check, the dialogs and Ask Oye are lazy. Pure helpers were split from React files (`shared/lessonCore.ts`, `shared/videoCore.ts`, `shared/handbookText.ts`, `markdownCore.tsx`) so the lesson's first download doesn't pull them in. `/learn/lesson/:id` went from 291 KB to 187 KB gzipped and is now a size-limit budget (200 KB). To keep "Next" instant, the player preloads the other steps' code when the browser is idle.
- **Resume fixes**: the older e2e scripts were stale after P4, P6 and P7. They now mark the welcome as seen (`v5-today`, `v5-foundation`), use Me → Settings for "Use previous design" and the heading "Needs your attention", and wait for lazy steps or for a run to finish (`v5-lesson`, `v4-departments`). No product behaviour changed for these.
