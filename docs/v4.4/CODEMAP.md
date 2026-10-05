# v4.4 code map (as of `pre-v4.4`, 6b2b235)

Read this before changing code. Line numbers drift; search by name.

## Key gaps v4.4 must close
- Free-text clauses get dropped in two places: `server/src/goals/rules.ts` skips "now" clauses (`rulesProfile`), and `validateAiGoals` (`server/src/goals/suggest.ts`) silently drops any AI goal left with no known skill. Nobody tells the admin.
- Skills belong to exactly one department (`skills.departmentId` NOT NULL). `validateGoals` (`server/src/goals/repo.ts`) rejects skills from another department, and `blueprintInputs` (`server/src/assessment/personalise/blueprint.ts`) skips such prerequisites.
- There is no request-review or score override anywhere.
- The mic is never requested: `PreFlight.tsx` calls `getUserMedia({video})`, so `permissions.microphone` is always false.
- When research is not configured, `runBuilder` skips the gap (`waitingForResearch` + a notice) and never retries it.

## 1. Onboarding, Suggest and goals

**Client**
- `src/features/admin/AdminOnboardPage.tsx`
- `setup/QuickOnboard.tsx` (`suggest`, then `stateFromSuggestion` in `setup/suggestion.ts`; Save & assign suggests first when there is no suggestion yet; just a loading button today)
- `setup/GoalBox.tsx` (`GoalBox`, `interpret` → `PendingGoal` chip, `GoalPicker`, `GoalEditor`, `GoalRows`)
- `setup/BulkOnboard.tsx`, `setup/goalsApi.ts`, `setup/SetupForm.tsx` (Advanced `<details>` holds the per-learner settings), `setup/UnderstandingPanel.tsx`
- `learner/LearnerGoals.tsx`, `learner/GoalSuggestions.tsx`

**API**
- `server/src/routes/admin/goals.ts`: `GET /api/admin/outcomes`, `POST /api/admin/onboard/suggest` (30/min), `POST /api/admin/goals/interpret`, `GET/PUT /api/admin/users/:userId/goals`, achieve, suggestion add/dismiss/restore
- `routes/admin/onboardBulk.ts`: `suggest-batch` (concurrency 4), `bulk`
- `routes/admin/setup.ts`: `POST /api/admin/setup/understand`, `GET/PUT /api/admin/users/:userId/setup`

**AI**
- `server/src/goals/suggest.ts`: `SUGGEST_SYSTEM`, `INTERPRET_SYSTEM`, `onboardSuggestResponseSchema`, `catalogPrompt` (the department catalog after `CATALOG_MARKER`, cached in `system`), `validateAiGoals`, `suggestOnboarding` (Haiku task `onboard_suggest`), `interpretGoal` (task `goal_interpret`). Any AI failure falls back to the rules.
- Rules: `server/src/goals/rules.ts`: `clauses` (tags weak/want/now), `rulesProfile`, `progressionExtras`, `rulesInterpret`, `catalogFromPrompt`.
- Mock: `server/src/ai/adapters/mockGoals.ts`, dispatched by `schemaName` in `server/src/ai/adapters/mock.ts` `fixtureFor`.

**Schemas**
- `shared/goals.ts`: `GOAL_TYPES`, `goalInputSchema` (skillIds 1–6, targetLevel 1–5, slider 1–5), `LearnerGoal`, `deriveSkillPriorities`, `OnboardSuggestion` {departmentId, trackId, stackIds, experienceBand, level, hoursPerWeek, goals, extras, source}, `GoalInterpretResult`
- `shared/setup.ts`: `setupAdvancedSchema` (autoPublish, courseCap, …), `setupSchema`, `saveSetupRequestSchema`, `planBlueprintMix`
- `shared/bulkOnboard.ts`

**Storage**
- Goals are saved in `learnerGoals` by `saveGoals` (`server/src/goals/repo.ts`): validate, delete and re-insert, then `writeDerivedPriorities`.
- `saveSetup` is in `server/src/setup/repo.ts`.

**Catalog**
- `shared/catalog.ts`: `Department` (`assessmentFormat` coding|tasks), `JobTrack`, `StackOption`, `Skill` (departmentId, area string, aliases, levelMin/Max, trackIds, prerequisites, contentModules, isAiSkill, defaultSlider), `searchSkills`, `trackBasics`
- Seeds: `server/src/catalog/seed/{engineering,pm,pmAgency,pmProcess,bd,bdProcess}.ts` + `index.ts`, `types.ts` (`SeedSkill`), `edges.ts`
- The practical-case library is in `server/src/goals/seed/{engineering,pm,bd}.ts` (`ensureOutcomeSeed`).
- There is no soft-skills area or CEFR anywhere today.

## 2. Assessment generation

- **Pipeline** (`server/src/assessment/personalise/`):
  - `understand.ts` (`UNDERSTAND_SYSTEM`)
  - `pipeline.ts` (`personalise`, `GENERATE_SYSTEM` Sonnet `item_generate`, `CHECK_SYSTEM`, `outcomeFallbackItem`, `inTimeWindow`)
  - `blueprint.ts` (`blueprintInputs`: core = track basics, probes = one-hop prerequisites of slider ≥ 4, max 3, outcome cases; `blueprintMix`)
  - `job.ts` (job `assessment.personalise`)
- **Rules:**
  - `shared/setup.ts`: `planBlueprintMix`, `planAssessmentMix`, 25 = 18 + 7, `MAX_PER_SKILL=8`, `GROUP_SHARE` focus 15 / other 6 / basics 4
  - `shared/personalise.ts`: `Slot`, `SLOT_SUBTYPES`, `enforceBlueprint` (the model never picks counts), `withOutcomeSlots` (`MAX_OUTCOME_SLOTS=2`, `OUTCOME_SLOT_SEC=180`), `ROLEPLAY_SLOT_SEC=100`
- **Timing** (`shared/timing.ts`): `DEFAULT_TIMING`, a 26–32 min window, `shapeOf` (per-kind switch), `estimateSeconds`, `sizeProblems`. Calibration is in `server/src/bank/timing.ts` and `calibrate.ts`.
- **Task kinds** (`shared/tasks.ts`): `TASK_KINDS`, `TASK_KIND_LABELS`, `taskSchema` union, `LearnerTask`/`toLearnerTask`, `taskResponseSchema`, `gradeTask`, `AI_GRADED_KINDS` = write, form, roleplay, `checkTask`. Every kind grades 0..1 with partial credit:

| Kind | How it is graded |
|------|------------------|
| write | AI rubric (score is null until graded) |
| rank | Exact position = 1, one place off = 0.5 |
| calculate | Share of fields within tolerance |
| scenario | Share of steps right |
| spot | F1 |
| excel, allocate, categorize | Their own graders |
| sim | Its own grader |
| form | Code checks + AI rubric |
| roleplay | AI |
| terminal | Steps + file checks (`TERMINAL_PASS=0.8`) |

- **Adding a new kind touches:**
  1. `TASK_KINDS`, the schema union, the response schema, `gradeTask` (returns null for AI-graded kinds), `AI_GRADED_KINDS` and `checkTask`
  2. `SLOT_SUBTYPES` and `enforceBlueprint`
  3. the `UNDERSTAND_SYSTEM` and `GENERATE_SYSTEM` prompts
  4. `shapeOf`
  5. the grader step in `evaluateV4` (`server/src/assessment/evaluateV4.ts`, next to `gradeWritten`), with a new AI task in `shared/aiRouting.ts` (`AI_TASKS`, `TASK_DEFAULTS`) and a mock fixture
  6. the client: `src/components/tasks/<Kind>Task.tsx`, the `TaskView.tsx` switch, `hasTaskAnswer`, `src/features/assessment/v4/TaskItem.tsx`, and the admin preview `src/features/admin/bank/BankItemPreview.tsx`
- The learner v4 routes are in `server/src/routes/assessmentV4.ts`.

## 3. Scoring

- **v4 items:** `gradeResponse` (`server/src/assessment/v4.ts`):
  - "I don't know yet" = 0
  - code = passed / total
  - MCQ = 0/1
  - tasks = `gradeTask`
- **Storage:** `submitItem` writes `assessment_items.score` (0..1) and the bank stats.
- **Results:**
  - `computeResult` takes the difficulty-weighted mean per skill and passes it to `levelFrom` (`shared/assessmentV4.ts`) = `round(score*(avgDifficulty+1))`, clamped to 0–5.
  - `V4Result` holds skills, strengths, focusFirst, rawScore, pendingWritten, mastery, missingLinks and metGoals.
- **`evaluateV4`:**
  1. Rubric-grades write and form items (`gradeWritten`, `gradeForm`, `RUBRIC_SYSTEM` criteria 0–3, Haiku `grade_written`).
  2. Scores roleplays.
  3. Runs `analyseEvaluation` (`server/src/builder/goalPath.ts`).
  4. Writes the `evaluations` row and publishes the plan.
  5. Enqueues `path.build`, refreshes suggestions and notifies.
- **Topic tests:** `gradeTopicQuiz` (`server/src/topicTests/repo.ts`) calls `gradeQuiz` (`server/src/content/grade.ts`). Each question is all-or-nothing, and the test passes at 80%. A code challenge needs every test to pass (`gradeCode`). The route is `/api/topics/:topicId/attempt`; attempts go to `topic_attempts`. The client is `QuizRunner.tsx` and `ChallengeResult.tsx`.
- **Tables:** `assessments`, `assessment_items` (response, draft, score, aiScore, aiFeedback, bankItemId, origin, activeMs), `evaluations`, `roleplay_sessions`, `topic_attempts`.
- There is no review, override or re-score today. Admin can only drop an item (`POST /api/admin/assessments/:id/items/:itemId/drop`) or mark a goal achieved by hand.

## 4. Path and course generation

- **Ordering and planning:**
  - `shared/pathOrder.ts`: `orderPath`, `goalsToTargets`, `estimateMastery`
  - `server/src/builder/goalPath.ts`: `planGoalPath`, `assertPathOrder`, `progressionCandidates`, `analyseEvaluation`
- **`runBuilder`** (`server/src/builder/run.ts`) tries these per part, in order:
  1. capstone
  2. the skill's content modules (`campsFor`)
  3. `savedCourseFor`
  4. `matchExisting` (`course_match`)
  5. if research is not configured: skip it and count it as `waitingForResearch`
  6. `buildCourse` (`server/src/builder/pipeline.ts`: plan, search, verify, write, review; `REVIEW_PASS_SCORE=4` in `shared/builder.ts`)
  7. `persistCourse` (`server/src/builder/repo.ts`). The status is `published` (autoPublish and passed), `pending_review` (passed) or `needs_review` (failed). The course is assigned to this learner only.
  8. `notifyStaff` sends "<title> needs a look"
- `autoPublish` (default false) and `courseCap` (5) are per-learner fields in `learner_priorities`.
- **Jobs:** `buildPathHandler` (job `path.build`), `server/src/jobs/queue.ts` (`enqueue`, `claimNext`, `failJob`, `deferJob`), `worker.ts` (1 s tick; handlers wired in `server/src/index.ts`), `jobTypeSchema` in `shared/enums.ts`.
- **Admin:** `src/features/admin/builder/AdminGeneratedPage.tsx` with routes `/api/admin/generated-courses`, decision and promote (`server/src/routes/admin/builder.ts`), plus `ResearchSettings.tsx`. Per-learner course states are in `learner/pathHelpers.ts` and `PathByPriority.tsx`.
- **Tables:** `generated_courses`, `course_sources`.
- **Docs:** `docs/ai-course-builder.md`.

## 5. Consent, uploads, crypto, retention

- **Consent:** `src/features/proctor/PreFlight.tsx` runs consent → camera → sound → environment → fullscreen.
  - `ConsentStep` is the first step. `ConsentPermissions` already has `microphone`.
  - `CONSENT_POLICY_VERSION` lives in `shared/assessment.ts`; bumping it asks everyone again.
  - Server: `POST/GET /api/assessment/:id/consent` (`server/src/routes/assessment.ts`), table `assessment_consents`.
- **Uploads:** multipart is registered in `server/src/app.ts` and used only by the proctoring snapshot (`saveSnapshot`, which writes plain JPEGs under `env.snapshotsDir`). Admins get them at `GET /api/admin/snapshots/*`.
- **Crypto:** `server/src/crypto/secretBox.ts` `seal`/`open` (AES-256-GCM with `env.masterKey`), strings only.
- **Retention:** `server/src/maintenance/retention.ts` (`runSnapshotRetention`, `startDailyMaintenance`).

## 6. Admin learner page, notifications, settings

- **Learner page:** `AdminLearnerPage.tsx` (tabs setup / assessment / path) and `learner/NextActionBar.tsx`.
  - Rules live in `shared/nextAction.ts` (`NextActionFacts`, the `NextAction.kind` union, `nextAction`, first match wins).
  - Server: `GET /api/admin/users/:userId/next-action`.
- **Notifications:** `shared/notifications.ts` (free dotted `kind`), written by `server/src/lib/notify.ts` (`notify`, `staffIds`) into table `notifications`.
- **Global settings pages:** `AdminAiPage.tsx`, `ModelRouting.tsx`, `builder/ResearchSettings.tsx`, `bank/AssessmentSettingsCard.tsx`.
- **`app_meta`** is a key/value table.

## 7. Admin copy

- Strings are inline in `src/features/admin/**`; there is no copy file.
- Some labels come from shared: `TASK_DEFAULTS.label`, `SLIDER_LABELS`, `TARGET_LEVEL_LABELS`, `TASK_KIND_LABELS`.
- Approximate banned-word counts:

| Word | Count | Where |
|------|-------|-------|
| model | 16 | mostly AI settings |
| bank | 14–16 | |
| token | 13 | |
| rubric | 5 | |
| prerequisite | 3–4 | skill graph page |
| slider | 3 | |
| blueprint | 2 | |
| slot | 1 | |

- Mastery and intents are rendered as data in `V4Results.tsx` and `UnderstandingPanel.tsx`.

## 8. Migrations

- The latest is `0023`.
- **Creating one:** `npm run db:generate` (drizzle-kit, schema `server/src/db/schema.ts`) with a name.
- **Applying them:** `openDb` (`server/src/db/index.ts`) does three things at boot:
  1. backs up the database
  2. migrates
  3. runs the idempotent seeds and data migrations: `ensureCatalogSeed`, `ensureSkillEdgesSeed`, …, `ensureOutcomeSeed`, `migrateV43Goals`. The one-time ones are guarded by `app_meta` keys.

## 9. AI router

- **A call passes** `{purpose, task, system, user, schema, schemaName, meta, model?, maxOutputTokens?}` to `AiService.generateJson` (`server/src/ai/service.ts`).
- **Routing:** `routeFor` (`router.ts`) picks the model per task. The defaults are in `shared/aiRouting.ts` (`HAIKU`, `SONNET`, `TASK_DEFAULTS`, `PRICES`).
- **Caching:** the whole `system` string is cached, so stable content goes in `system`.
- **Mock:** the `MockProvider` (`server/src/ai/adapters/mock.ts`) is used in dev and tests and dispatches by `schemaName`.

## 10. Tests and e2e

- **Vitest:**
  - It covers `server/**`, `shared/**` and `src/**` with the node environment and no jsdom, so client tests are pure functions only.
  - Tests sit next to the code they test.
- **Server harness** (`server/src/test/harness.ts`):
  - `createTestApp(overrides, {noAi?, provider?})` gives an in-memory DB cloned from a migrated template, the mock AI, and `drainJobs()`.
  - Helpers: `adminSession`, `activeLearner`, `onboardLearner`, `as(session)`, `approveAssessment`. Requests go through `ctx.app.inject`.
- **E2E** (`scripts/e2e/*.ts`):
  - Run `npm run build`, then `npx tsx scripts/e2e/<name>.ts`.
  - Each script spawns `dist-server` with a throwaway `DATA_DIR` and its own port, using the mock AI and Playwright.
  - Helpers are copied into each script.
