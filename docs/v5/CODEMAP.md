# v5 front-end code map (as of `pre-v5`)

Search by name; line numbers drift. The server side is mapped in `docs/v4.4/CODEMAP.md`.

## Routing and auth
- **Entry.** `src/main.tsx` renders `src/App.tsx`, wrapped in: `BrowserRouter` › `MotionConfig reducedMotion="user"` › `TooltipProvider` › `OverlayProvider` › `AuthProvider` › `Routes`.
- **Public routes:** `/login` and `/change-password`, both in `AuthLayout`.
- **`/admin`.** Guarded by `RequireStaff`, then `CurriculumProvider`, then `AdminLayout` (with an `Outlet`):
  - overview, people, onboard, departments, `people/:userId` (tabs via `?tab=`: setup, assessment, path, library, progress, account)
  - ai (superadmin), question-bank, ai-usage, live, audit, reviews, sop, handbook, integrity
  - curriculum, curriculum/test-items, skill-graph, skill-groups, courses, `courses/:courseId`, generated
  - `assessments/:id`, `assessments/:id/integrity`
- **`/assessment`.** Fullscreen `AssessmentPage`, with no shell.
- **`/*`.** `AppShell`, with nested routes: `/` Dashboard, `plan`, `library`, `track/…/module/…/topic/…` (TopicPage), `courses`, `courses/:id`, `glossary`, `glossary/practice`, `tools/classify`, `practice/roleplay`, `report/:trackId` (certificate), `goals/:goalId`, and a 404.
- **No route is lazy.** The initial JS is about 2.6 MB raw. The main chunk is 1.8 MB and includes `@mediapipe/tasks-vision`, which is imported statically by `PreFlight` and `useProctor`.
- **Auth.** `features/auth/AuthProvider.tsx` → `useAuth()` returns `{user, department, …}`, filled from `GET /api/auth/me` (`meResponseSchema` in `shared/auth.ts`).
  - Roles are superadmin, admin and learner; `isStaff(role)` tells them apart.
  - Guards live in `features/auth/guards.tsx`.

## Styling
- **`src/index.css`** uses Tailwind 4 `@theme` and has no config file.
  - Fonts today: Sora for brand and display, IBM Plex Sans for body text, IBM Plex Mono for code.
  - Colours: `brand-50…950` (brand-600 = #2067D3); surfaces paper, ink, background, foreground, surface, surface-sunken, border, muted-foreground, popover and destructive; editor colours.
  - Lane and accent colours: trailmark (warning), summit (success), ridge, glacier, basalt, canyon, alpenglow, lichen.
  - Dark mode is class-based. An inline script in `index.html` reads localStorage `oyelabs-ui`, and `uiStore` sets the theme.
- **Helpers:** `lib/utils.ts` `cn`, `lib/accent.ts`, and `lib/motion.ts` (duration, easing, spring presets).
- **Logos:** `public/brand/oyelearn-{horizontal,mark,stacked}-{light,dark}-mode.svg`, plus the source kit in `Oyelearn-Logo-Kit/`. `public/` holds the icons and `site.webmanifest`.
- **`src/lib/contrast.test.ts`** parses `index.css` `:root` and `.dark`, so keep those blocks parseable.

## Learner screens (old UI)
- **Shell.** `components/layout/AppShell` contains TopBar, Sidebar (TrackNav), CommandPalette, NotificationCentre and UserMenu.
- **Dashboard:** `pages/DashboardPage`.
- **My plan:** `pages/PlanPage` (622 lines), built from `features/plan/{WeekTrail, OverviewTrail, Lanes, trailGeometry (pure), laneMeta}`.
- **Library:** `pages/LibraryPage`.
- **Topic:** `pages/TopicPage`, built from:
  - videos: `VideoPlaylist` (471), which uses `components/trail/useYouTubePlayer.ts`
  - reading: `RichText`
  - references: `ReferenceList`
  - challenge: `ChallengeRunner` → `QuizRunner` | `CodeRunner`, plus `ChallengeResult` and `RequestReview`
  - practice: `PracticeTask` → `TaskView` → `components/tasks/*` (Speak, Sim, Excel, Form, Terminal, Allocate, Calculate, Categorize, Rank, Write, Spot, Scenario, Roleplay)
  - speaking practice: `SpeakPracticeSection`
  - video gating: `VideoGate` and `LeaveTopicPrompt`
- **Assessment:** `features/assessment/AssessmentPage` → `proctor/PreFlight` (813 lines) → `v4/V4Sheet` (Navigator, McqItem, CodingItem, TaskItem, autosave, run, clock) → waiting and complete screens.
- **Certificate:** `pages/CertificatePage` (`CertificateView`, a PDF made on demand, `profileStore`).
- **Other screens:** glossary and flashcards (`features/handbook`), role-play, goals (`CapstonePage`), notifications.
- **No profile or settings page exists.**
- **Editor:** `components/editor/CodeEditorMonaco` loads lazily.

## Admin screens (old UI)
- **`AdminLayout`** has a grouped nav and `CommandPalette context="admin"`.
- **Learner page:** `AdminLearnerPage` with `learner/*` tabs and `NextActionBar`.
- **Data table:** `components/data-table/DataTable` (TanStack Table v8) with saved views (localStorage), filters, CSV export and bulk actions.

## Data layer
- **Fetching.** `src/api/client.ts` `api.{get,post,put,patch,del}` throws `ApiRequestError`. There is no query library: pages fetch in `useEffect`.
- **API objects per feature:** `features/*/api.ts`.
- **Zustand stores:**
  - `curriculumStore`: the manifest and lazily loaded modules
  - `progressStore`: progress, with optimistic updates
  - `assessmentStore`
  - `uiStore` and `profileStore`, both persisted
- **Endpoints learners use:**
  - `/api/me/{manifest,progress,plan,path,evaluation,week,courses,goals,notifications,prefs,resources}`
  - `/api/content/modules/:t/:m`
  - `/api/topics/:id/{attempt,speak-feedback}`
  - `/api/me/topics/:id/videos`
  - `/api/handbook/*`, `/api/roleplay/*`, `/api/review-requests`, `/api/recordings`

## Preferences and flags
- `user_prefs` (userId, data JSON) has only `GET/PUT /api/me/prefs`, and it validates only `{autoplayNext}`.
- `app_meta` is a key/value store for global switches.
- No flag system exists yet.

## E2E scripts depend on these labels (keep them working while the old UI is the default)
- **Auth:** username and password labels, the "Sign in" button.
- **Plan:** `data-testid` week-trail-waypoint, week-trail-path, overview-trail-path.
- **Topic:**
  - landmarks: "Topic navigation", the list "Videos in this topic", the switch "Autoplay", the group "Up next", the heading "Checkpoint quiz", the region "Test locked"
  - test ids: quiz-source, quiz-source-pending
- **Assessment:** "Continue", "Question N of M", the Monaco view-lines, Run / Run and submit, "Runs left: N".
- **Admin onboarding:** "Suggest", "Looks good — send the test", the region "Here's the plan…", sliders "<skill> priority".
- Each v5 e2e test gets its own selectors. The old tests keep running against the old UI, with the flag off, until Phase 9.
