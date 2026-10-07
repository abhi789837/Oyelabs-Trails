# v4.5 decisions

## Architecture

These are the decisions from step 0.1. The full design is in `PLAN.md`.

- **An Oyelabs course is a normal course with extra fields: `courses.oyelabs`, plus side tables.**
  - The library, paths, weekly plans, progress and certificates keep working on `courses` / `course_topics` / `course_progress` unchanged.
  - We rejected a separate "oyelabs_courses" tree. It would have needed a second copy of every consumer.
- **Each module is a `course_sections` row and owns exactly one managed lesson (`course_topics.kind = 'module'`).**
  - That lesson holds the module's playlist, docs and notes, and is finished by passing the module test.
  - Its id is stable across edits, so progress, watch time and attempts survive new versions.
  - One lesson per module, rather than one per video, is what makes the v4.3 rule "playlist → lock → test" apply per module, as the brief asks.
- **Module tests reuse the v4.3 tables and pipeline.**
  - Items are `topic_test_items`, grounding is `topic_grounding` (both keyed by the managed lesson id), and attempts are `topic_attempts` with the new `course_id` column.
  - Only status, summary and hashes are new (`course_module_tests`). Regeneration retires old items and never deletes them, so past results stay readable.
- **A module lesson's `course_progress` row is written only by passing the module test.**
  - The certificate rule ("every lesson has progress") therefore needs no change.
  - The tick route refuses module lessons.
- **Versions reuse `content_versions`.** We did not add a new versions table.
  - `courses.published_version` records what learners see.
  - Autosave writes to `course_drafts`, so the live course changes only on Save.
  - Restoring an Oyelabs version opens it as a draft.
- **Departments use `course_departments` (no rows = all).**
  - "Everyone in this department" is a lazily read rule (`course_department_rules`), like `audience = everyone`, so new learners are covered without a backfill.
  - "Assign to a department now" expands into `course_assignments` rows (`source = 'department'`).
- **One visibility rule (`server/src/oyelabs/visibility.ts`) for the library, `mayOpenCourse`, weekly candidates and the builder.**
  - It also fixes two existing gaps: `mayOpenCourse` and the weekly candidates ignored `courses.department_id`.
- **Estimated tracking lives in `video_progress`** (`tracking`, `active_seconds`, `confirmed_at`). For Oyelabs entries, `video_id` = the `course_videos.id`.
  - Watched = 80% active time + the "I've watched this" click.
  - The server caps each sample by wall-clock time.
- **Only optional fields were added to `shared/courses.ts`** (`kind?: "module"`, `oyelabs?: true`), so existing version snapshots compare equal and saving an unchanged course creates no version.
- **Jobs are new types, wired through `server/src/oyelabs/jobs.ts`.** index.ts has one spread and one scheduler.
  - The worker runs one job at a time, so transcription and test generation must be resumable in slices.
  - `module_test.generate` is idempotent, keyed by a content hash. The editor can queue it for every module on publish without knowing what changed.
- **AI cost:**
  - New tasks are `module_test_write` (Sonnet 5.5), `module_test_relevance` / `module_test_answer` (Haiku) and `course_skill_suggest` (Haiku). They are separate from `topic_test_*`, so module tests don't spend the topic-test recheck budget and show up on their own in usage.
  - Logged in `ai_calls.course_id`. Target about $0.05 per module.
- **Embeddings:**
  - OpenAI `text-embedding-3-small` when an OpenAI credential exists. Otherwise a deterministic local hashed-n-gram embedder (`local-hash-v1`).
  - Vectors are compared only within a model.
  - Anthropic has no embeddings endpoint, and requiring a new vendor key for the feature to work was rejected.
- **Libraries (not installed yet):**
  - `unpdf` (MIT), `@napi-rs/canvas` (MIT), `tesseract.js` v7 (Apache-2.0), `mammoth` (BSD-2), `officeparser` 6 (MIT), `exceljs` (already present), `@mozilla/readability` (Apache-2.0) + `linkedom` (ISC), and optionally `hls.js` (Apache-2.0).
  - ffmpeg comes from Debian apt in the runtime image. It runs as a separate process, so there are no GPL linking concerns. It is not in the image today.
- **YouTube transcripts:** public caption tracks, best effort. There is no OAuth and no third-party scraper library.
  - We do not run Whisper over YouTube, Drive, OneDrive, Box or Loom, because the files cannot be fetched reliably or within their terms.
  - Those videos are "not used for questions", as in v4.3.
  - Whisper (`STT_BASE_URL`) handles uploads, direct files and Dropbox, in 10-minute chunks.
- **Uploads:**
  - Stored in `DATA_DIR/uploads` on the existing `/data` volume, unencrypted. Access is checked on the route.
  - Limits: docs 50 MB, videos 1 GB. Files are streamed to disk and deduplicated by sha256.
  - Caddy has no body limit by default; the example adds an explicit 1100 MB cap on the upload route.
  - **nginx needs `client_max_body_size`** (its default is 1 MB).
  - Backups must copy `/data/uploads` too.
- **Schema is frozen at migration 0026** (generated by `drizzle-kit generate`, additive only). Further columns go into a new `0027_v45_*`, recorded here.
- **The contract stubs return 501 "Not built yet (v4.5 builder X)" behind the real guards.**
  - The admin 403 sweep in `routes/admin/users.test.ts` covers them from day one.
  - `server/src/oyelabs/stub.ts` is deleted once no stub is left.
- **Known pre-existing test failure:** `server/src/v5/notify/notify.test.ts` › "at most one a day" fails from 2026-10-07 onward and is unrelated to v4.5.
  - The test pins its clock to 2026-10-06, but the reminder rows it counts are stamped with the real clock.
  - It needs a fix in the notify code or the test (inject the clock), outside v4.5's file map.

## Main session: reminder clock fix (2026-10-07)
`notify()` always stamped `createdAt` with the real clock. The reminder job decides "already sent today" from the last reminder's `createdAt`, so its scheduled clock (`nowMs`) and the stored time could disagree; the unit test started failing once the real date moved past its fixed date. `NotificationInput` now takes an optional `at`, and the reminder job passes `nowMs`. In production the two clocks are the same, so behaviour there doesn't change.

## Phase 0

### Root cause

**One rule decided "can we make a new course?", and it asked for three things but named only one.**

- Every check went through `setupProblem` (`server/src/builder/autoCourse.ts`) and then `researchClients` (`server/src/builder/settings.ts`). This covered the path builder (`requestCourse`), the `course.generate` worker, the 5-minute wake and, through the stored job line, the banners.
- `researchClients` returned "not ok" unless **all three** of these were saved:
  1. a search service was picked (`research_settings.provider`);
  2. its key was saved;
  3. **a YouTube Data API key** was saved.
- Whichever one was missing, `setupProblem` said the same thing: **"the web search isn't connected"**.

**Why the admin thought it was set up.**
- The AI connection page showed the search key as stored ("One is stored (…abcd)").
- The YouTube field said it was only "used to check a video exists". It never said that, without it, no course would be made at all.
- The only warning was a general amber "Not set up" box. It didn't say which part was missing.
- The course pipeline already treats a video as optional: `findVideo` swallows a failed video search, and the lesson simply has no video. So the YouTube requirement didn't need to block anything.

**How the course stayed blocked forever.**
1. `requestCourse` parked the job in `waiting_setup` with that line in `jobs.last_error`.
2. Saving the settings woke the job. The handler checked again, found the same gap, and parked it again with the same line.
3. The 5-minute `wakeIfReady` only wakes jobs once `setupProblem` is null, which never happened.
4. The path banner (`currentPath` → `setupNeededMessage`) and the status line (`nextActionFacts.courses.problem`) both read that stored line. That gives exactly the two strings Priyanka's pages showed.

**Because the job never runs, missing courses are never made from the assessment result.**
- `evaluateV4` does queue `path.build` with no click.
- `runBuilder` → `requestCourse` does queue `course.generate`.
- The job just waits.

**A second way to hit the same line.** The provider radio starts with nothing selected, and `PUT /api/admin/research` accepted a key with `provider: null`. A key saved without clicking a provider card gave the same "isn't connected" message.

**What we ruled out:**

| Suspect | Why it isn't the cause |
|---|---|
| The web routes and the worker read different settings | One process. `docker-compose.yml` has one app service, and `index.ts` starts the worker in the same process as the routes. Both read the same `research_settings` row (`id = 'singleton'`) through the same function. |
| Stale cache | Nothing is cached. The row is read on every call. |
| Decryption in the worker | Same process, same `APP_MASTER_KEY`. A failed decrypt would also have thrown a different error, not this line. |
| No wake trigger | Triggers existed: saving research or AI settings, plus the 5-minute interval. They woke the job, but the re-check could never pass. |
| Provider errors labelled "not connected" | They weren't. Instead, each failed search was swallowed per query. The course failed as "research" and was retried 3 times, then shown as "couldn't be made". That is a separate mislabel, also fixed below. |
| The worker doesn't run in production | It does. `index.ts` builds `JobWorker` with the `course.generate` handler unconditionally. |

**Provider docs check (October 2026):**
- **Tavily:** the API reference documents only `Authorization: Bearer tvly-…` on `POST https://api.tavily.com/search`, with `max_results` ≤ 20. Our client sent `api_key` in the JSON body, which the current docs don't mention. It now sends the Bearer header and keeps the key out of the body.
- **Brave:** `X-Subscription-Token` on `/res/v1/web/search` (count ≤ 20) is correct.
- **Serper:** `X-API-KEY` on `google.serper.dev/search` is correct.

**What only production can confirm.** Run `scripts/deploy/research-check.cjs` (see "Needs Abhishek" in PROGRESS).
- We expect `youtube_key: MISSING`, or `provider: null` with a search key saved.
- We expect the course jobs to be `waiting_setup` with "the web search isn't connected".
- The script also runs one real search with the saved key, so a key or network problem shows up straight away.

**Found on the way.** `saveGoals` and `syncSkillGoalsFromPriorities` reset `learner_goals.created_at` on every save. We fixed it (kept across saves) because "Added after the test" depends on it. Goals saved before this fix carry their last-save time.

### The fix

**One source of truth.** Both functions read the saved settings fresh on every call and decrypt them:
- `getResearchProvider(db, env)` lives in `settings.ts`. `researchClients` is kept as an alias.
- `getAIProvider(ai)` lives in `builder/connection.ts`.

They are used by the path builder, the worker, `recheckBlocked`, the Test route, the research settings view, the inbox and the banners (through the job line).
- **What's required:** only the search service and its key.
- **The YouTube key is optional.** Without it, `NO_VIDEO_CLIENT` is used and lessons have no video.
- **A key saved with no service picked:**
  - a Tavily key (`tvly-…`) is recognised as Tavily;
  - any other key is refused with "Pick which search service this key is for…".
- **A key that can't be decrypted** reads as "not set up", with "Enter the key again" on the admin page.

**Plain states** (`shared/connection.ts`):
- not set up, key rejected, quota used up, can't reach it from our server, temporary error;
- each has its own clause, e.g. "the web search key was rejected", and its own "what happens next" tail, e.g. "after the key is fixed";
- "isn't connected" is no longer written anywhere for the web search. Old stored lines still read as "not set up".

**Errors are classified at the provider** (`providers.ts`, `ProviderError`, `classifyStatus`, `classifyThrown`) using each provider's documented codes:

| What happened | State |
|---|---|
| 401, or 403 without quota words | key rejected |
| 402, 432, 433, or 400/403 with quota or credit words | quota used up |
| 429 rate limit | temporary |
| 5xx | temporary |
| DNS, refused, reset or timeout | can't reach it from our server |

**How the job reacts.** `watchSearch` wraps the job's search client. When no search worked, the job reports the first failure instead of building a course from no sources:
- key rejected or quota → `waiting_setup` with that line (blocked);
- can't reach or temporary → the job fails and is retried.

**Test** (`POST /api/admin/research/test`, superadmin, audited):
- Runs one real search from the server ("JavaScript closures explained", 5 results).
- When a YouTube key is saved, also does one `videos.list` lookup, which costs 1 quota unit.
- The result is stored in `app_meta` `research.last_check` and shown on the page and in the inbox, e.g. "Connected ✓ — test search returned 5 results. No YouTube key is saved, so new lessons won't have a video."
- A failure gets its own sentence that ends with what to do.
- A pass wakes every blocked job.
- The page runs Test automatically after a key is saved.

**Waking:**
- Saving research or AI settings re-queues every blocked job at once (as before), and the next queue tick runs them.
- `recheckBlocked` runs at boot and **every 10 minutes**, reading the settings fresh:
  - nothing blocked → nothing to do;
  - still not set up → the blocked lines are rewritten to today's reason;
  - blocked by a rejected key or quota → one real test search first, and wake only on a pass;
  - otherwise → wake them all.
- Blocked path items are worked out from the jobs, so they clear on their own.

**Retries.**
- `course.generate` jobs get `maxAttempts = 5` (`COURSE_JOB_MAX_ATTEMPTS`), with backoff of 30 s, 1, 2 and 4 min. Other job types keep 5 s, 10 s and 20 s.
- After 5 tries the job is `failed` with the plain reason. The path item shows `creating: "failed"`, `problem` and `retryJobId`, and the UI shows "Failed: <reason>" with **Retry**.
- Retry is `POST /api/admin/course-jobs/:jobId/retry` (staff, audited, 409 if the job isn't failed). It puts the job back with fresh tries.
- Older jobs created with 3 attempts keep 3.

**After an assessment.**
- Nothing new was needed to queue generation: `evaluateV4` → `path.build` → `requestCourse` already does it.
- An integration test now proves it with no admin click.
- The path view gains `added` and `addedLine` ("We added 1 new course for Priyanka: <title>", first name). The admin Path tab shows it.

**The status line agrees with the banners:**
- `nextActionFacts.courses` is now counted from the learner's current path, item by item, with `creatingInfo` — exactly how the banners count. Before, it counted jobs whose payload `userId` was this learner, so learners who joined someone else's job weren't counted.
- The titles now say "Test done":
  - "Test done · 1 course being created (about 3 min)"
  - "Test done · 1 new course blocked: <reason>. We'll finish it on our own <tail>." with the button "Set it up" or "Check the connection"
  - "Test done · 1 new course couldn't be made. Failed: <reason>." (new kind `courses-failed`; the button opens the Path tab)
- The old learner page header used to show the assessment badge "Completed". It now shows `testStatusLabel` from the bar's facts, e.g. "Test done · 1 course blocked".
- The v5 People side sheet shows the same next action, so it agrees automatically.
- The v5 inbox (`server/src/v5/admin/inbox.ts`):
  - setup item: "N new courses blocked: <reason>", using the fresh provider check;
  - one "couldn't be made" item per failed course, with **Retry** (new inbox action `retry-course`).

### Path screens

- **One course, one item.** `onePerCourse` (`builder/repo.ts`, inside `currentPath`, so every screen and the learner API get it) drops a repeat of a course already on the path. A repeat counts when it's the same course id, module, course being made, capstone or (for anything else) title.
  - A repeat serving another goal becomes `needs: [{title, itemId}]` on that goal's item. It shows as "Needs: React Fundamentals (earlier in your path)".
  - A repeat inside the same goal is simply dropped.
  - Stored `path_items` are untouched. The weekly plan picks by topic and already de-duplicates, so it still pulls in order.
- **Long paths** (`shared/pathView.ts` `splitPath`):
  - The first 8 steps show, or up to 3 past the current one. The rest go under "Later (N more)", grouped by goal ("For your goal: forms in React") and collapsed.
  - Used in v5 My plan (`PlanTrails.tsx` OverviewTrail), the old plan page (`features/plan/OverviewTrail.tsx`) and the admin "In the order they walk it" list.
- **Natural reasons** (`shared/pathReasons.ts`):
  - `goalPhrase` lowers the first letter unless the first word is a name or acronym. It checks a list (React, Node.js, Excel, SQL…) and any capital inside the word (AI, API, GitHub, JavaScript).
  - The templates are: "Next step towards your goal: build a validated form in React.", "Comes before your goal: backend. It needs …", "Moved up: X comes first for your goal: …" and "Critical goal: … You're at … and it needs …/5."
  - `naturalReason` rewrites reasons stored by older builds when they're read (in `currentPath`).
  - The v5 results story (`src/v5/assessment/story.ts`) also parses the new forms.
- **Never "not assessed".**
  - The gaps API adds `coverage` (`builder/coverage.ts`): the levels the latest evaluation measured, the test's time, and the skills that are only on goals created after it.
  - The admin row shows the level bar, "Added after the test · starts at Beginner", or (rare) "Still being marked · starts at …".
  - The old "Must know first" label is now "Learn first".

### No schema change

- No migration was needed (`0027_v45_p0_*` was not used).
- States are plain lines in `jobs.last_error`, and the last check lives in `app_meta`.
- No change requests for `shared/courses.ts`.

### Tests

New files:
- `shared/connection.test.ts`
- `shared/pathReasons.test.ts`
- `shared/pathView.test.ts`
- `server/src/builder/connection.test.ts`

v4.5 blocks added to `server/src/builder/autoCourse.test.ts`:
- **The root cause:** a saved Tavily key and no YouTube key is enough, through the real settings and the real worker with no client override, and the Bearer header is checked.
- **Key without a service:** a Tavily key with no service picked is accepted; any other key is refused.
- **Failure states:** key rejected, quota, and network with 5 tries, backoff, Failed and Retry.
- **10-minute re-check:** wakes when setup is complete, and proves a rejected key with a test search first.
- **Test endpoint:** plain lines.
- **After an assessment:** an evaluation queues the missing course with no click, and the header, bar and banner agree.

Updated expectations:
- `shared/nextAction.test.ts`
- `shared/pathOrder.test.ts`
- `server/src/builder/run.goals.test.ts`
- `src/v5/assessment/assessment.test.ts`
- `scripts/e2e/v44-reference-case.ts`, which now accepts "isn't set up".
