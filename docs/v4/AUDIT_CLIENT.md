# Oyelearn v4 — client audit

Scope: `src/` only (React 19, Vite 8, Tailwind v4, Radix/shadcn primitives, `motion`, Zustand, react-router-dom 7).
Read-only audit, as of commit `8d1c6b0`. Line numbers are from that commit.

Health: `npx tsc -b` exit 0, no errors. `npx eslint .` exit 0, no findings. The only output was npm's
"new version available" notice.

---

## 1. Routing

### Top level: `src/App.tsx`
Providers, outermost first: `BrowserRouter` > `MotionConfig reducedMotion="user"` > `TooltipProvider` > `OverlayProvider` > `AuthProvider`.
Theme: `useUiStore().theme` toggles the `.dark` class on `<html>` (App.tsx:34-36).

| Path | Element | Guard |
|---|---|---|
| `/login` | `LoginPage` | public |
| `/change-password` | `ChangePasswordPage` | public (page handles session itself) |
| `/admin/*` | `AdminLayout` (Outlet) in `CurriculumProvider` | `RequireStaff` (superadmin, admin) |
| `/assessment` | `AssessmentPage` in `CurriculumProvider`, fullscreen with no shell | `RequireAuth` |
| `/*` | `AppShell` in `CurriculumProvider` | `RequireAuth` |

Guards are in `src/features/auth/guards.tsx`:
- `RequireAuth` (24): no user goes to `/login` with `state.from`; `mustChangePassword` goes to `/change-password`.
- `RequireRole` (43): if the role is wrong, an admin goes to `/admin` and anyone else goes to `landingPathFor(user)`.
- `RequireStaff` and `RequireSuperadmin` (59, 64) wrap `RequireRole`.
- The server enforces the same rules on its own.

### Admin child routes (App.tsx:59-81)
| Path | Page | Extra guard |
|---|---|---|
| `/admin` (index) | `AdminOverviewPage` | |
| `people` | `AdminPeoplePage` | |
| `onboard` | `AdminOnboardPage` | |
| `people/:userId` | `AdminLearnerPage` | |
| `ai` | `AdminAiPage` | `RequireSuperadmin` |
| `live` | `AdminLivePage` | |
| `audit` | `AdminAuditPage` | |
| `integrity` | `AdminIntegrityFeedPage` | |
| `curriculum` | `AdminCurriculumPage` | |
| `courses` | `AdminCoursesPage` | |
| `courses/:courseId` | `AdminCourseEditorPage` | |
| `generated` | `builder/AdminGeneratedPage` | |
| `assessments/:assessmentId` | `AdminPoolPage` | |
| `assessments/:assessmentId/integrity` | `AdminIntegrityPage` | |
| `*` | `<Navigate to="/admin">` | |

Admin nav is in `AdminLayout.tsx:49-76`. Groups:
- (none): Overview
- People: People, Onboard learner
- Assessments: Live, Integrity events
- System: AI connection (`superadminOnly`), Audit log, Curriculum, Courses, Generated

Navigation is a left nav at `md` and up (137) and a horizontal scroll strip on mobile (182). There is no Departments, Question bank or AI-usage entry yet.

### Learner routes: `src/components/layout/AppShell.tsx:116-130`
These sit inside `AnimatedRoutes`, the app's one route transition: a 150 ms opacity cross-fade keyed on pathname.

| Path | Page |
|---|---|
| `/` | `DashboardPage` |
| `/plan` | `PlanPage` (one week) |
| `/library` | `LibraryPage` (everything unlocked) |
| `/track/:trackId` | `TrackPage` |
| `/track/:trackId/module/:moduleId` | `ModulePage` |
| `/track/:trackId/module/:moduleId/topic/:topicId` | `TopicPage` |
| `/track/:trackId/topic/:topicId` | `LegacyTopicRedirect` |
| `/courses`, `/courses/:courseId` | `CoursesPage`, `CoursePage` |
| `/report/:trackId` | `CertificatePage` |
| `*` | `NotFoundPage` |

Shell chrome:
- `AssessmentBanner` (AppShell:44) polls `/api/me/assessment` through `store/assessmentStore.ts` and `features/assessment/funnel.ts`.
- `CompletionWatcher` (49).
- `TopBar` holds `CommandPalette` (cmdk) and `NotificationCentre` (`/api/me/notifications`, plus SSE `/api/admin/events` for staff in `useNotifications.ts:24`).
- Learner nav (`TrackNav.tsx:57-78`): Dashboard `/`, Courses `/courses`, My plan `/plan`, Library `/library`, then the tracks.

---

## 2. Admin learner page: `src/features/admin/AdminLearnerPage.tsx`

**Shell (292 lines).**
- Loads four things in parallel on mount (87-92):
  - `GET /api/admin/users/:id` via `adminApi.getUser`
  - `GET /api/admin/users/:id/plan`
  - `GET /api/admin/users/:id/progress`
  - `GET /api/admin/users/:id/assessments`
- Header: avatar, name, then a mono meta line of username, role title, years and `level n/5`. Badges show disabled, awaiting first sign-in, hard-warnings count and assessment status.
- Tabs are an ARIA `tablist` with arrow, Home and End keys. The active tab is stored in `?tab=`, and `profile` is the default with no param.
- Panels mount on first visit and **stay mounted** (`visited` set, 74). This protects unsaved PlanTab edits.
- The active tab has a sliding underline via `motion.span layoutId` (242). This is the page's one motion moment.

**Current `TABS` (32-42), 9 tabs:** Profile, Assessment, Integrity, Evaluation, This week (`week`), Library (`plan`), AI path (`path`), Progress, Account.

| Tab | Component (props) | Renders | API |
|---|---|---|---|
| Profile | `learner/ProfileTab` (`userId, profile, onSaved`) | Who (role title, years). Notes ("What you know about them", the blueprint's main input). Claimed skills (area via `<datalist>` plus native `input type=range` 1-5 with `LEVEL_LABELS` Aware to Can teach). Target trails (track chips, `profile.targetTracks`). | `PUT /api/admin/users/:id/profile` |
| Assessment | `learner/AssessmentTab` (`userId, assessments, onChanged`) | Issue form via FormDialog (label "What is it for", `timeLimitMinutes`). Per attempt: StatusBadge, approve (`ApprovalBanner` from `ApprovalGate.tsx`), View pool link to `/admin/assessments/:id`, delete unstarted, `GenerationLog` (polls plus SSE `/api/admin/live/stream`), `AttemptAnswers` (346) with filters Area, Kind, Outcome (`FilterSelect` 494) and `ServedItemCard` (524), and `AdaptivePath` (an inline SVG staircase per area, 424). | `POST /users/:id/assessments`, `DELETE /assessments/:id`, `POST /assessments/:id/approve`, `GET /assessments/:id/generation-log`, `GET /assessments/:id/answers` |
| Integrity | `learner/IntegrityTab` (`assessments`) | `IntegrityTimeline` (54): event chips, snapshot lightbox (271). | `GET /api/admin/assessments/:id/integrity`, `GET /api/admin/snapshots/:path` |
| Evaluation | `learner/EvaluationTab` then `AdminEvaluationView` | Evaluation for the latest attempt. | `GET /api/admin/assessments/:id/evaluation` |
| This week | `learner/WeekTab` (`userId, displayName`) | Lanes (`AdminLane` 165) with pin and move (`MoveMenu` 238). Reshape is rules-only; "advance" plans the next week. `WeekHistoryList` (275). | `GET /users/:id/week`, `POST /week/regenerate {rulesOnly, advance}`, `PATCH /week/items/:itemId {pinned or lane}` |
| Library | `learner/PlanTab` (`userId, displayName, plan, progress, onPublished`), 811 lines | Append-only plan editor. `TrackBoard` (381) shows trail cards, which drill into `TrackPanel` camps (515), then `Camp` (599) and `TopicCell` (712) toggles. Shows a diff against the AI proposal. | `PUT /api/admin/users/:id/plan` |
| AI path | `learner/PathTab` (`userId, displayName`) | See below. | see below |
| Progress | `learner/ProgressTab` (`userId, progress, plan`) | Topic table with `TopicAttempts` (299) and `QuizAnswers` (367). | `GET /api/admin/users/:id/attempts` |
| Account | `learner/AccountTab` (`user, onChanged`) | `ActionRow`s: reset password (shows `TemporaryPasswordNotice`), suspend or reactivate (confirm), revoke sessions. | `POST /reset-password`, `POST /status`, `POST /revoke-sessions` |

### "AI path" tab (`learner/PathTab.tsx`) mixes setup with results
On mount it loads three things (65-69):
- `GET /users/:id/priorities`
- `GET /users/:id/gaps`, which returns `{gaps, path}`
- `GET /users/:id/targets`, which returns `{focus}`

It merges `priorities.skip` and `priorities.hoursPerWeek` into the targets form state (76-84). While `isPathBusy(path.status)` is true it polls every 5 s (104-109).

The page renders top to bottom (209-287):
1. **Setup form.** "Targets" with `<TargetsFields>` (229) and a **Save targets** button. Calls `PUT /users/:id/targets`.
2. "Week stale" banner. **Rebuild their week** calls `POST /week/regenerate {rulesOnly:true}`. **Leave it** dismisses.
3. **Build or Rebuild the path** button. Calls `POST /users/:id/path`, which returns `{jobId}`.
4. **Setup form 2.** A `<details>` labelled "Advanced settings" contains `<PrioritiesFields>` and a **Save settings** button. Calls `PUT /users/:id/priorities`.
5. **Results.** `PathPanel` (291) shows a progress note, failure, budget or notice banners (the notice links to `/admin/ai`), then `PathByTarget` (`learner/PathByTarget.tsx`). That shows one `TargetRow` per target with `CourseLine` and `LevelBar`, evidence behind an expander, and an `AlsoSuggested` section (238) with a **promote** action. Promote appends a Low target and immediately calls `PUT /targets`.

Issues to carry into v4:
- Setup and results sit on one scroll, with three different save buttons.
- `hoursPerWeek` and `skip` are edited in TargetsFields but loaded from `priorities`. TargetsFields saves through `/targets`, while "Save settings" sends the `priorities` state, which holds the skip and hours values loaded at mount. Check on the server whether `PUT /priorities` still writes skip and hours. If it does, that is a silent overwrite.
- `yearsExperience` is edited in two places: ProfileTab ("Years of experience") and TargetsFields. The track is also in two places: `profile.targetTracks` chips in ProfileTab and the onboarding "Trails" step, and `targets.track` in TargetsFields.

### Course builder settings form (`src/features/admin/builder/*`)
- **`TargetsFields.tsx`** (`value: TargetsRequest, onChange, disabled`). Fields:
  - Track: native `<select>` over `LEARNER_TRACK_LABELS` (frontend, backend, fullstack, mobile, devops, ai-ml, other).
  - Main stack: free-text `TextField`. `stackSchema` is min 2, max 120.
  - Years: native number input.
  - "Your read of their level": a 5-button segmented group (`role=group`).
  - Hours a week: native number input.
  - Targets: grouped by `PRIORITY_ORDER` high, medium, low. Each row has up and down arrow buttons (reorder within its band only), a skill `Input`, a 3-button `PriorityPicker`, a native `date` input and a remove button. Up to `MAX_TARGETS = 20`.
  - Skip: `TagInput`, max 20.
  - Also exports `TargetsSummary` (334).
  - Priority is 3-level. The budget split is High 50 / Med 30 / Low 20 (`shared/targets.ts:112`). There are no sliders.
- **`PrioritiesFields.tsx`** (`value: LearnerPriorities`). Fields:
  - Deadline in weeks (native number).
  - Most courses to generate, `courseCap` 1-20.
  - Checkbox: weeks start Monday.
  - Checkbox: auto-publish.
  - Also exports `PrioritiesSummary`.
  - Lives in a `<details>`: "Advanced settings" on PathTab, "Course builder settings" on onboarding.
- **`ResearchSettings.tsx`** is *not* per learner. It is mounted on `AdminAiPage` (line 280). It holds the provider (tavily, brave or serper), search and YouTube keys, and token and search budgets. Calls `GET/PUT /api/admin/research` and `POST /api/admin/research/check-links`.

---

## 3. Onboard page: `src/features/admin/AdminOnboardPage.tsx` (907 lines)

There are six steps (`STEPS`, 55-62): account, profile, skills, trails, priorities ("Targets"), review. Each panel slides in with an x-offset (`AnimatePresence`, 289). Only the account step gates moving forward: username and display name are required, and the username must not be taken (`canAdvance`, 150). Taken usernames are checked client-side against `adminApi.listUsers()`.

- **account**:
  - Username and Full name.
  - Role radio, learner or admin. Shown only to a superadmin (`mayCreateStaff`).
  - Password mode, generate or set. "Set" uses `PasswordField` with `passwordStrength`.
- **profile**: Role title, Years (`NumberField`), Notes (aim about 400 characters).
- **skills**: claimed skills. Area `Input` with module-name suggestions, plus a Radix `Slider` 1-5 (460) labelled with `LEVEL_LABELS`.
- **trails**: `TrackCard` toggles over `useTracks()`, written to `profile.targetTracks`.
- **priorities**: `<TargetsFields>`, then a `<details>` "Course builder settings" with `<PrioritiesFields>`.
- **review**: summaries plus a **Checkbox "issue assessment"** (default true).

Track, stack, experience, level and targets are all captured by `TargetsFields`, defaulting to `track:"backend"`, `stack:""` and `hoursPerWeek:15` (104-112). Experience is *also* captured in the profile step.

Submit (`handleSubmit`, 158) makes three sequential calls:
1. `POST /api/admin/users` with `{username, displayName, role, password?, profile:{roleTitle, yearsExperience, adminNotes, claimedSkills, targetTracks}, issueAssessment}`.
2. `PUT /api/admin/users/:id/priorities`. This only runs if `priorities.targetRole` or `mustHave` is non-empty (187). The form no longer edits either field, so **this call never runs and the onboarding "Course builder settings" are silently discarded.** This is a bug.
3. `PUT /api/admin/users/:id/targets`. A failure only raises a toast. Because `stackSchema` is min 2, **leaving Stack blank makes this call return 400**, and the account is created without targets.

A further issue: with `issueAssessment:true`, the blueprint is queued by call 1 *before* the targets from call 3 are saved. Verify on the server whether generation waits for targets. If it doesn't, the first assessment can be built with no targets.

On success the page shows `TemporaryPasswordNotice`, or navigates to `/admin/people`.

---

## 4. Assessment UI: `src/features/assessment/*`

The flow, in `AssessmentPage.tsx` (485 lines). `Phase` is one of `loading`, `preflight`, `taking`, `waiting`, `finished`, `error`.

1. `GET /api/me/assessment` routes by status:
   - `ready` goes to preflight.
   - `in_progress` goes to taking, and the server re-serves the item that was in flight.
   - `generating`, `awaiting_approval`, `submitted` and `evaluating` go to waiting.
   - `completed` goes to `/plan`.
   - Anything else goes to finished (including terminated).
2. **Pre-flight**: `<PreFlight>` (see section 5). Its `onReady` makes two calls:
   - `POST /api/assessment/:id/consent {agreed, permissions, policyVersion}`, awaited.
   - Then `POST /api/assessment/:id/start {consent}`.
   - Errors keep the learner on the pre-flight screen.
3. **Taking**: `GET /api/assessment/:id/next` returns a `NextItemResponse`:
   - `item` carries `expiresAt`.
   - `deadlineAt`.
   - `progress {answered, target, section: "adaptive"|"written"}`.
   - `done`.
   - **One item at a time, forward-only, server-chosen** (an adaptive staircase). There is no question navigator and no going back.
   - The overall clock is shown in the header (`formatClock(totalSecondsLeft)`) and turns red at 5 minutes or less.
   - **Per-item timer**: a `TimerRing` per question. Budgets are `TIME_LIMIT_SEC` in `shared/assessment.ts:23`: mcq 75 s, multi 90, predict_output 120, find_bug 120, code 360, explain 180.
   - The total is `MAX_TOTAL_MIN = 45`, with a 6-minute written block at the end.
   - Timers are display-only and pause while `proctor.paused` is true. The server is authoritative.
4. **Answer**: `POST /api/assessment/:id/items/:itemId` with `{selected[]} | {code} | {text} | {unknown:true}`. A 409 triggers a resync rather than a retry.
5. **"Finish now"**: a `confirm({calm:true})` dialog, then `POST /api/assessment/:id/submit`.
6. **Waiting**: `WaitingScreen` polls `GET /api/assessment/:id/status` every 5 s and renders `JobStages`. Stages come from `stages.ts`, with no fake percentage.

The sticky top `StatusStrip` shows the camera preview and the warning count. Also on screen: `Watermark` (name, username and id overlay), `HardWarningModal`, `SoftWarningToasts`, and a "Return to fullscreen" gate that hides the question.

`ItemRunner.tsx` (360 lines) renders per kind (`itemKindSchema`: mcq, multi, predict_output, find_bug, code, explain):
- **mcq, multi, find_bug** (options):
  - `OptionCard` rows, seeded-shuffled with `seededOrder(n, item.id)`. The original indices are sent to the server.
  - Number keys 1-6 pick an option (ignored while typing in a field).
  - mcq uses Radix `RadioGroup`; multi uses checkboxes.
  - **There is no code-snippet runner.** Code appears in the prompt only as `RichText`.
- **predict_output**: a textarea, with paste blocked by `onPaste`.
- **explain**: a textarea with `maxChars` (default 1200) and a counter. Paste is blocked.
- **code**:
  - Uses `<CodeEditor>`, a **plain textarea** (section 6). JavaScript only. The file name is `${functionName}.js`.
  - **"Run the example tests"** calls `runVisibleTests` (a local Web Worker) and shows pass or fail plus the description. It does not show actual vs expected or console output.
  - There is **no run limit**, and running makes no server call.
  - Paste is not blocked on the element (proctor rules apply; see section 5).
- **"I don't know yet"** is a separate outline button that sends `{unknown:true}`. Copy says it is not marked down.
- `answered` gating: code must be non-empty and differ from the starter; options need at least one selection; text must be non-empty.

`draftStore.ts`: a per-item draft (`{code, text, selected}`) in **sessionStorage**, written on a 400 ms debounce, restored on re-serve and cleared on submit. Every access is wrapped in try/catch.

`funnel.ts`: `PENDING_ASSESSMENT_STATUSES` and `TRANSIENT_ASSESSMENT_STATUSES`. Shared with `AssessmentBanner` and `PlanPage`, and tested.

`stages.ts` and `JobStages.tsx`: the waiting-stage list, derived only from the server status.

Heartbeat: `useProctor.ts:397` sends `POST /api/assessment/:id/heartbeat` every `HEARTBEAT_INTERVAL_MS = 10 s`.

---

## 5. Proctoring: `src/features/proctor/*`

**PreFlight.tsx** (773 lines). The steps are `consent`, `camera`, `sound`, `environment`, `fullscreen` (36-45).
- Consent copy covers what is watched, what leaves the device, retention (`SNAPSHOT_RETENTION_DAYS = 90`) and limits. The policy is DPDP-aware.
- The camera step calls `getUserMedia` and runs MediaPipe calibration (`startCalibration`, holding for `CALIBRATION_HOLD_MS = 3 s`).
- The environment step requires a viewport of at least `MIN_VIEWPORT_PX = 1024`.
- The fullscreen step calls `requestFullscreen()`.
- `onReady(calibration, stream, permissions)`. Permissions are read from the real track state and `fullscreenElement`, not from the checkboxes.

**Signals and severity** (`types.ts:175-193`, `SIGNAL_SEVERITY`):
- **hard**: tab_hidden, window_blur (sustained 2 s), fullscreen_exit, copy_cut_attempt, paste_attempt, printscreen, phone_in_frame, multiple_faces (3 s), no_face (8 s), camera_lost (5 s), heartbeat_missing.
- **soft**: looking_away (yaw over 30 or pitch over 25 degrees, for 4 s), book_or_laptop_in_frame, context_menu_attempt, text_selection_attempt, mouse_left_window (3 s), devtools_suspected (size-delta heuristic, polled every 1 s), extended_display.
- Snapshots are taken for phone, multiple_faces, no_face, looking_away and book_or_laptop (`SNAPSHOT_SIGNALS`).
- `HARD_LIMIT = 3` terminates the attempt. `HARD_COOLDOWN_MS = 10 s` is mirrored client-side.
- Events are posted to `POST /api/assessment/:id/events`: JSON, or multipart when there is a snapshot (`postIntegrityEvent`, api.ts).
- Camera detectors (`cameraDetectors.ts`): MediaPipe face landmarker every 200 ms, EfficientDet object detection every 1 s. Assets live under `/mediapipe/...`, fetched by the `postinstall` script.

**Editor exemption** (`editorScope.ts` plus `browserSignals.ts:136-196`):
- The editor root carries `data-proctor-editor="true"` (`editorScopeProps()`). `isInsideEditor(target)` is `closest('[data-proctor-editor]')`, walking up from text nodes.
- **copy and cut** inside the editor are not prevented and not reported. The selected text is fingerprinted: `rememberCopiedText(String(document.getSelection()))`, which is FNV-1a over normalised text plus its length, in a ring buffer of 16. Copy and cut anywhere else are prevented and emit a hard `copy_cut_attempt`.
- **paste** is allowed only if **both** conditions hold: the target is inside the editor, and `wasCopiedFromPage(clipboardData text)` is true. Otherwise it is prevented and emits a hard `paste_attempt {into, inEditor, chars}`.
- **selectstart** is allowed inside the editor and inside input, textarea, contenteditable or `[data-proctor-allow-select]`. Otherwise it is prevented and emits a soft event.
- `resetCopiedText()` runs when the sitting ends.
- **Risk:** the fingerprint uses `document.getSelection()`. Firefox (and spec-strict engines) return `""` for a selection inside a textarea. If they do, nothing is remembered, and pasting your own code back in raises a hard warning.
- **Monaco note:** Monaco copies through its own hidden textarea. The exemption must use the editor model's selection, or `event.clipboardData` after Monaco writes it, not `document.getSelection()`. The `data-proctor-editor` wrapper approach itself carries over.

**warnings.tsx** exports:
- `HardWarningModal` (pauses the timer; "Warning n of 3" with the observed reason from `SIGNAL_REASON`)
- `SoftWarningToasts` (keeps the last 3)
- `StatusStrip`
- `Watermark`
- `playWarningTone` and `playSoftChime`

---

## 6. Code execution on the client

`src/lib/codeRunner.ts`:
- `runVisibleTests(code, challenge, timeoutMs = RUN_TIMEOUT_MS = 3000)` builds a throwaway Worker from a Blob URL.
- It runs `new Function(code + "return <functionName>")`, then awaits `fn(...args)` for each visible test.
- It compares with `deepEqual` (NaN-equal, Date-aware) and returns `{results[{passed, expected, actual?, error?}], passedCount, total, score, compileError?, timedOut}`.
- The worker is terminated on timeout.
- **JS only, no console capture, no stdout or stdin model.** It decides nothing; grading happens on the server.

`src/components/challenge/*` (learner topic challenges, not the assessment):
- `ChallengeRunner` (`topic`) dispatches to `QuizRunner` or `CodeRunner`.
- `QuizRunner` (`topic, questions`): single and multi select. Submits `POST /api/topics/:id/attempt {kind:"quiz", answers}` and shows `correctIndices` and explanations only after grading.
- `CodeRunner` (`topic, challenge`): **Run** executes the visible tests locally; **Submit** sends `POST /api/topics/:id/attempt {kind:"code", code}`, and the server runs visible and hidden tests in `isolated-vm`. It shows "N tests: x visible, y hidden".
- `CodeEditor` (`value, onChange, fileName?, describedBy?`, forwardRef to the textarea):
  - A textarea with a line-number gutter (scroll-synced) and `bg-editor` tokens.
  - Tab inserts 2 spaces via `execCommand("insertText")` to keep undo.
  - Esc then Tab leaves the editor.
  - Enter auto-indents.
  - The header label is hard-coded to "JavaScript".
  - No syntax highlighting.
- `ChallengeResult`: the result card.

---

## 7. Admin pages and filters

`components/data-table/*` is a full kit:
- `DataTable` with `mode: "client" | "server"`.
- `fields: TableFieldDef[]` drives the filters: string, enum, number, boolean and date types, with `quick` filters, `searchable` and `options`.
- `FacetedFilter` (with counts), `DateRangeFilter`, `NumberRangeFilter`, `BooleanFilter`, `AdvancedFilter`, `ActiveFilters`.
- `SavedViews`: built-in views plus per-account views in localStorage (`viewStorage.ts`).
- `ViewOptions` (column visibility).
- `BulkActionBar` and `bulkActions`.
- CSV export (`csv.ts`).
- `useTableQueryState`: the query lives in the URL.
- A detail sheet (`renderDetail`) and `mobileCard`.

**No admin page has a department filter.** Track exists only on Curriculum ("Trail"). People has no track filter.

| Page | Data | Filters | Bulk / actions |
|---|---|---|---|
| Overview `AdminOverviewPage` | `GET /api/admin/overview` | none | Tiles: Learners, Awaiting approval, In progress, Awaiting evaluation, Completed, Flagged, Plans published, AI provider. `Sparkline`s show the 7-day trend. Also `IntegritySection` and `UsageSection`. |
| People `AdminPeoplePage` + `presets/people.ts` | `GET /api/admin/users` (client mode) | Name, username, role title (search). Account role, status, assessment status (faceted). Experience (number, quick), overall level, hard warnings, temp password, onboarded (date, quick), last seen, plan progress. Built-in views. Archived rows are hidden unless status is filtered. | **Bulk actions present** (341-425): issue assessment (`POST /users/:id/assessments` per learner), disable, enable, archive (`POST /status`). Row actions: reset password, status, export JSON (`/users/:id/export`), delete (superadmin, with a typed username). |
| Curriculum `AdminCurriculumPage` | `useTracks()` manifest (no fetch) | Topic, id. **Trail** (enum, quick), Camp (enum, quick), level, estimated time, questions or tests, milestone, written. | read-only |
| Courses `AdminCoursesPage` | `GET /api/admin/courses` | A text search box only (132). | Create via FormDialog (`POST /api/admin/courses`). |
| Course editor `AdminCourseEditorPage` | `coursesApi.*` | none | Sections and topics CRUD, reorder, assignees (`PUT /courses/:id/assignees`), progress. |
| Generated `builder/AdminGeneratedPage` | `GET /api/admin/generated-courses` (client) | Course, skill, learner (search). Status, scope. Review score, dead links, lessons, written date. | Approve or reject (`POST .../decision`), promote to global (`POST .../promote`). |
| AI `AdminAiPage` (superadmin) | `GET /api/admin/ai` | none | Credentials list plus verify (`POST /ai/credentials/:id/verify`) and delete. **Usage (7d) table by purpose**: calls, input and output tokens, failures. No cost, no per-learner or per-department breakdown. `AddCredentialForm` (`POST /ai/credentials`), `ModelSettings` (generation, critic, evaluation models, budget note; `PUT /ai/settings`), `<ResearchSettings>`, `<AiCallsTable>`. |
| `AiCallsTable` | `GET /api/admin/ai/calls?…` (**server mode**) | Model, error (search). Result (bool, quick). Learner id, assessment id. Input and output tokens, latency, date. | none |
| Pool `AdminPoolPage` | `GET /api/admin/assessments/:id/pool` | Hand-rolled `<select>`s: area, kind, difficulty. Search box. Show-dropped toggle. | Drop or restore an item (`POST .../items/:itemId/drop`). `ApprovalBanner`, `GenerationLog`. |
| Live `AdminLivePage` | `GET /api/admin/live` plus **SSE** `/api/admin/live/stream` | none | `LiveCard`: terminate, or extend by 10 min (`POST /assessments/:id/terminate|extend`). Last snapshot. |
| Audit `AdminAuditPage` | `GET /api/admin/audit?…` (server) | Action, target id (search). Actor id, date. | none |
| Integrity feed `AdminIntegrityFeedPage` | `GET /api/admin/integrity/events?…` (server) | Type (search), severity, counted, learner id, assessment id, date. | Snapshot lightbox |
| Integrity (one attempt) `AdminIntegrityPage` | `IntegrityTimeline` | none | none |

---

## 8. Learner pages

- **Dashboard** (`pages/DashboardPage.tsx`, 189 lines): per-track overview with `ElevationProfile` (143). Uses the progress and curriculum stores.
- **Plan** (`pages/PlanPage.tsx`, 539 lines): **one week**.
  - Loads `GET /api/me/week` and `GET /api/me/evaluation` in parallel.
  - The server generates the week if none exists.
  - Gates on the pending assessment (`isPendingAssessment`), with a CTA to `/assessment`.
  - `ViewToggle` switches between trail and list (stored in `oyelearn.plan.view`).
  - `WeekTrail` (`features/plan/WeekTrail.tsx`, 437 lines) is an SVG trail with `LaneLegend` and `TrailStartButton`.
  - `Lanes` (`features/plan/Lanes.tsx`) shows lanes from `LANE_META`: `do_now`, `must_know`, `medium`, `low`.
  - `WeekItemDetail`, `WeekSkeleton`.
  - "Plan my next week" calls `POST /api/me/week/next` (400 while blocking lanes are outstanding).
  - `SummitCelebration`.
- **Library** (`pages/LibraryPage.tsx`, 329 lines): everything unlocked. Trail view or list view with `PlanFilterBar` (`pages/planFilters.ts`). Uses `GET /api/me/evaluation`.
- **Courses** (`CoursesPage`): `GET /api/me/courses` plus `GET /api/me/path` (generated path).
- **CoursePage**:
  - `GET /api/me/courses/:id`.
  - All lessons on one page.
  - "I have read this" calls `POST /api/me/courses/topics/:topicId/complete`.
- **Track, Module, Topic**:
  - `TrackPage` uses `TrailMap` for module camps.
  - `ModulePage` uses `TrailMap` for topic waypoints. Lazy content comes from `GET /api/content/modules/:track/:module` via `curriculumStore`.
  - `TopicPage` shows `ChallengeRunner`, `VideoPlayer` (YouTube embed plus alternates) and `ReferenceList` (iframe-attempt with fallback).
  - `GET /api/me/manifest` supplies the manifest.
  - Progress uses `GET /api/me/progress` and `POST /api/me/progress/start`.
- **Certificate** (`CertificatePage`): `CertificateView`, `generateCertificatePdf` (`@react-pdf/renderer`), `Confetti`, `Seal`. The "already celebrated" flag is kept in localStorage.

---

## 9. Design system

`src/index.css` (373 lines):
- Tailwind v4 `@import 'tailwindcss'`.
- **Dark mode** is `@custom-variant dark (&:is(.dark *))` (line 5), with the `.dark {}` overrides at 276. The class is toggled in App.tsx from `uiStore.theme`. `index.html` applies the saved or system theme before first paint.
- `@theme` (12-140):
  - Fonts: `--font-brand` and `--font-display` are **Sora**; `--font-sans` is IBM Plex Sans; `--font-mono` is IBM Plex Mono. Fonts are self-hosted via `@fontsource` and `src/assets/fonts`.
  - Type scale xs to xl.
  - Colours are `rgb(var(--x))`.
- `:root` (195+):
  - `--brand-50..950` is a hue-216 ramp. **brand-600 = #2067D3** is `--primary` and `--ring`. brand-700 is `--primary-strong`, and brand-400 is the dark-mode primary. Contrast ratios are documented.
  - Paper/ink backgrounds, surface and surface-sunken, border, input, popover, destructive.
  - Trail palette: trailmark, summit, ridge, glacier, basalt, canyon, alpenglow, lichen, each with `-strong` and `-foreground`.
  - Editor tokens: `--editor`, `--editor-gutter`, `--editor-foreground`.
- Semantic aliases: success is summit, warning is trailmark, muted and accent are surface-sunken.
- `--radius: 0.375rem`.
- Animations: `waypoint-pulse`, `status-pulse`.

`src/components/ui/*` primitives:
- alert-dialog, avatar (`initialsOf`), badge (variants include `brand`, `progress`, `danger`, `outline`), button (`loading` prop, `icon-sm` size), calendar
- card, checkbox, **command (cmdk; callers pass `shouldFilter={false}`)**, dialog, dropdown-menu
- input (`inputClasses`, `containerClassName`), kbd, label, number-input, password-input
- **popover (Radix)**, progress (`indicatorClassName`), radio-group, scroll-area, sheet, shine-border
- skeleton, **slider (Radix; required `thumbLabels[]`)**, status-badge (`statusMeta`)
- table (`TableScroller`)
- **tag-input** (`value, onChange, suggestions?, allowCustom?, max?, placeholder?`). This is already a filtered multi-select when `allowCustom=false`.
- tooltip

**Not present:** tabs primitive (the learner page hand-rolls its tablist), select or combobox (native `<select>` is used everywhere), segmented control (hand-rolled `role=group` button rows), switch, accordion (native `<details>`), toggle-group.

Form helpers, in `components/form/Field.tsx`:
- `Field({label, error, hint, required, className, children: ({id}) => node})` as a render prop.
- `TextField`, `PasswordField`, `NumberField`, `FormAlert`.

Overlays (`components/overlays`), all wrapped by `OverlayProvider`:
- `useConfirm()` takes `{title, body, confirmLabel, cancelLabel, variant, confirmPhrase, onConfirm, calm}` and returns a `Promise<boolean>`.
- `useFormDialog()` takes `{title, description, submitLabel, destructive, body({pending}), onSubmit(FormData)}`.
- `DetailSheet`, `CompletionToast`, `AppToaster` (sonner).

Toasts: `lib/toast.ts` `notify.success | error (8 s) | info | undo | promise` wraps sonner. `store/toastStore.ts` also exists (module-complete toasts).

Motion: `lib/motion.ts` (`spring`, `duration`, `transition`). `MotionConfig reducedMotion="user"` is global.

---

## 10. API client conventions

`src/api/client.ts`:
- `apiFetch<T>(path, {method, body, signal})` uses same-origin `fetch` with `credentials:"same-origin"` (cookie session; Vite proxies `/api` in dev). JSON body.
- A 204 returns `undefined`.
- A non-2xx response with an `{error:{code, message, fields?}}` envelope throws `ApiRequestError(status, code, message, fields)`. It has `isUnauthenticated` and `needsPasswordChange` getters.
- Other failures throw `ApiRequestError(status, INTERNAL, "Request failed (n)")`.
- A network failure becomes status 0. An `AbortError` is rethrown untouched.
- `api.get/post/put/patch/del`. `del` may carry a body.

Call-site pattern:
- `try { … } catch (err) { setError(err instanceof ApiRequestError ? err.message : "…") }`.
- Form field errors map from `err.fields` (onboarding jumps back to the owning step via `stepForField`).
- `AbortController` is used in effects.
- No query library (no TanStack Query); data lives in local state or Zustand stores (`curriculumStore`, `progressStore`, `assessmentStore`, `profileStore`, `uiStore`, `toastStore`).

Per-feature API modules:
- `features/admin/api.ts` (`adminApi`)
- `features/admin/builder/api.ts` (`builderApi`)
- `features/admin/courses/api.ts` (`coursesApi`)
- `features/assessment/api.ts` (`assessmentApi`, `postIntegrityEvent`)
- `features/plan/api.ts` (`weekApi`, `adminWeekApi`)
- `features/challenge/api.ts` (`submitAttempt`)

Several pages still call `api.get` inline, for example AdminLearnerPage, AdminAiPage, AdminLivePage and the Overview page. `postIntegrityEvent` and the proctor heartbeat use raw `fetch`. Request and response types come from `@shared/*` (zod schemas shared with the server).

---

## 11. Editor dependency

`package.json` has **neither Monaco nor CodeMirror** (`monaco-editor`, `@monaco-editor/react` and `@codemirror/*` are all absent). The only editor is the textarea `CodeEditor`.

Related dependencies present: `isolated-vm` (server grading), `cmdk`, `@radix-ui/react-slider`, `@radix-ui/react-popover`, `@tanstack/react-table`, `sonner`, `motion`, `@mediapipe/tasks-vision`.

There is no Piston or Judge0 client.

---

## 12. Type and lint status

- `npx tsc -b` exits 0 with no diagnostics.
- `npx eslint .` exits 0 with no diagnostics.

---

## v4 gaps & reuse notes

**New learner tabs (Setup · Assessment · Path · Library · Progress · Account)**
- Reuse the `AdminLearnerPage` tab shell as-is: query-param tab, keyboard tablist, keep-mounted panels, `layoutId` marker. Replace `TABS` (32-42).
- **Merge into Setup:**
  - ProfileTab: notes, role title, claimed skills. Drop its years and target trails.
  - TargetsFields and PrioritiesFields from PathTab.
- **Fold into Assessment:**
  - Integrity becomes a section via `IntegrityTimeline`, which is already exported.
  - Evaluation becomes a section via `AdminEvaluationView`.
- **Library** is the current `PlanTab` (it is already labelled "Library").
- **"This week" (`WeekTab`)** must go somewhere: Path or Progress. Decide, and don't drop the admin's pin and lane overrides.
- Progress and Account stay unchanged.
- Consolidate the inline `api.get` calls in `AdminLearnerPage` into `adminApi`.

**Setup screen**
- **Department and track segmented pickers:** no segmented primitive exists. Extract the `role=group` button row from `TargetsFields` level picker (134) and `PriorityPicker` (301) into `ui/segmented.tsx`. Track options are hard-coded in `shared/targets.ts` `learnerTrackSchema`, so they must become DB-driven per department.
- **Searchable multi-select of stacks and tools:** `TagInput` with `suggestions` and `allowCustom=false` covers it. Alternatively build it from `Popover` plus `Command` (both exist). `stack` is currently one free-text string (`stackSchema`), so the schema must change.
- **Experience and level chips:** use the segmented primitive. Years is currently a number input; level is the 5-button group.
- **Searchable skill picker with 5-stop priority sliders that auto-sort:**
  - `Slider` exists, with `thumbLabels` required and `step={1}`, `min 1`, `max 5`.
  - The picker is `Popover` plus `Command`.
  - Replace the 3-level `PriorityPicker`, the up and down arrows, and `PRIORITY_BUDGET` (`shared/targets.ts:112`, 50/30/20). Auto-sort replaces `move()`.
  - The onboarding claimed-skills step already uses `Slider` 1-5; reuse that row layout.
- **Skip list:** `TagInput` already exists (TargetsFields:280). Feed it skill `suggestions`.
- **Hours:** a `NumberInput` primitive exists.
- **Sticky summary card:** `TargetsSummary` and `PrioritiesSummary` already exist (onboarding review). Make them a `sticky top-*` aside.
- **Collapsed advanced settings:** keep `<details>` around `PrioritiesFields`, or add an accordion.
- **Use one save path.** The current double save (`/targets` plus `/priorities`) causes the skip and hours overwrite risk.
- **Fix the onboarding bugs:** the `hasPriorities` guard means builder settings are never saved; a blank stack makes `/targets` fail with a 400; and `issueAssessment` runs before targets are saved.
- `AdminOnboardPage` should render the same Setup component, so it no longer has duplicate fields.

**Results-only Path tab**
- Remove `TargetsFields`, `PrioritiesFields` and both save buttons from `PathTab`.
- Keep `PathPanel`, `PathByTarget`, the "Build or Rebuild path" button, 5 s polling while busy, and the week-stale banner.
- `promote` currently writes `/targets` directly. In v4 it should open or deep-link to the Setup slider for that skill.

**New assessment UI**
- Today: forward-only, one server-chosen item, a per-item `TimerRing`, a 45-minute total including a 6-minute written block, a textarea editor, unlimited local JS-only runs, and no MCQ snippet runner.
- **Question navigator and free navigation:** needs a new API that returns the whole served set with an answered or flagged state and allows re-answering. The adaptive staircase (`next` endpoint) is incompatible, so this is server work.
  - Keep `draftStore` (make it per item, which it already is).
  - Keep the `OptionCard` and number keys, and the "I don't know yet" `{unknown:true}` contract.
- **Overall 50-minute clock:** the header clock already exists (`formatClock(totalSecondsLeft)`). Drop `TimerRing` and the per-item `expiresAt`. Change `MAX_TOTAL_MIN` and `EXPLAIN_BUDGET_MIN` in `shared/assessment.ts`. Keep pause-while-warning.
- **Monaco per coding problem:**
  - Add `@monaco-editor/react` (lazy chunk).
  - Wrap it in a `div {...editorScopeProps()}`.
  - **Rewrite `rememberCopiedText` to use Monaco's `editor.getModel().getValueInRange(selection)`** (or `onDidCopy`-style hooks), not `document.getSelection()`. Check that Monaco's hidden-textarea `selectstart` and `paste` events resolve inside the scope.
  - The existing `CodeEditor` stays for learner topics, or is swapped there too.
- **Run (3 max) plus an output panel:**
  - `runVisibleTests` returns `actual`, `expected` and `error` but `ItemRunner` discards them. Render them.
  - A 3-run cap needs server enforcement (a client-only counter is bypassable). Also add a `POST /api/assessment/:id/items/:itemId/run` if runs go to a sandbox (Piston or Judge0) for non-JS languages.
  - Console capture needs a worker change (patch `console.*` in `WORKER_SOURCE`).
- **Runnable MCQ snippets:** `RichText` renders code read-only. Add a "Run snippet" affordance that runs the same worker in a mode with no function name, capturing console output. Gate it under proctoring (it must stay inside the editor scope if editable).

**Department filters on admin pages**
- Every table is driven by `TableFieldDef`. Adding `{name:"department", type:"enum", quick:true, options}` to:
  - `presets/people.ts`
  - `AdminCurriculumPage` fields (82)
  - `AdminGeneratedPage` fields (105)
  - `AiCallsTable` (server mode, so a server query param is also needed)

  is a small client change once the row types carry a `department`. `UserSummary` (`shared/admin.ts:31`) has no department today.
- Courses has only a text search (`AdminCoursesPage:57`) and needs either a DataTable conversion or a `<select>`.
- Pool, Live and Overview have no filter infrastructure.

**/admin/departments**
- New route in `App.tsx` and a nav item in `AdminLayout` (System or People group).
- Reorderable lists can copy the `orderSections` and `orderTopics` up/down pattern in `AdminCourseEditorPage` (keyboard-safe, no drag). CRUD dialogs use `useFormDialog`; archive uses `useConfirm`.

**/admin/question-bank**
- New route and nav. Reuse `AdminPoolPage` item rendering and filters (area, kind, difficulty, search, drop or restore) and `ServedItemCard` from `AssessmentTab:524`. Use `DataTable` in server mode for scale. There is no bank API in the client today; items exist only per assessment pool.

**/admin AI usage page**
- Today's usage lives in two places:
  - The superadmin-only `AdminAiPage` usage-7d table (by purpose, tokens, no cost).
  - `AiCallsTable` (server-mode `GET /api/admin/ai/calls`), with filters for learner id, assessment id, model, result, tokens and latency.
- Split both into `/admin/ai-usage`, decide whether admins (not only superadmins) can see it, and add cost and department or learner breakdowns.
- Reuse `Sparkline` (`features/admin/parts/Sparkline.tsx`) and the Overview `Tile` and `BigNumber` components.
- `AdminOverviewPage` `UsageSection` (383) already summarises usage and should link there.
