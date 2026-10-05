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
