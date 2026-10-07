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

## Phase 3 (C)

- **Fetching links uses B's `safeFetch`** (`oyelabs/media/safeFetch.ts`) through a thin adapter, `oyelabs/extract/fetch.ts`. The adapter adds the PLAN §4.3 document caps: 50 MB (a bigger file is refused, not half-read) and 20 s. It also inherits B's `OYELABS_FETCH_STUB`, so e2e can run offline. ffmpeg fetches direct and Dropbox files by itself, so each of those URLs is checked first with `assertPublicUrl`.
- **Extraction libraries are loaded at run time** (`extract/runtime.ts`, an `import()` whose specifier esbuild can't see). Without this, esbuild would try to bundle the native `@napi-rs/canvas` and tesseract's worker scripts. `node_modules` is already copied into the runtime image. `scripts/build-server.mjs` is unchanged.
- **officeparser v8, not v6:** `OfficeParser.parseOffice(buffer, { fileType: "pptx", ocr: false })` returns an AST. Each `slide` node has `metadata.slideNumber` and paragraph children. Speaker notes are appended as "Speaker notes: …".
- **Passage ids:** `<doc|vid|note|desc><4 hex of sha256(kind:sourceId)>.<n>`, for example `doc3fa2.4`. The id uses a hash of the source, not its position, so reordering docs in the editor never renumbers citations. Ids stay stable while the text is unchanged.
- **Per-source hashes:**
  - Uploaded docs use the upload's sha256.
  - Linked docs use the sha256 of the fetched body. They are read again when the doc row changes and on Regenerate, which re-fetches every link.
  - Videos use the hash of their input: the upload sha, the file URL, or the YouTube id. B's daily link checks therefore never cause a new Whisper run.
  - Notes and the description use the hash of their text.
  - The module hash is the sha256 over the sorted hashes of the sources that gave text, plus a generator version.
- **Generation** (`moduleTests/generate.ts`) reuses `writeItems` and `runGates`. Each now takes an optional last `overrides` argument (task, purpose, schema name, system/user prompt, `meta.courseId`). The defaults are unchanged.
  - The module material goes in the **system prompt**, so it is the cached prefix for rounds 2–3 and for regenerations.
  - The material is capped at 20,000 characters, taken round-robin across sources so one long PDF can't crowd out the notes or a video. The description is capped at 1,200 characters.
  - The writer is asked for target + 1 items (9). Up to 2 regeneration rounds then cover what the gates drop.
  - Item kinds come from the objective ids: `scn` = scenario, `rec` = recall, `hands` = hands-on. Hands-on is offered only when the material looks like code: at least 25% of passages are code fences or code-like lines.
- **Items** are `topic_test_items` keyed by the managed lesson. The payload adds `moduleKind`, `moduleOrigin`, `moduleCitation` and `generation`.
  - Admin-added items are stored with origin `static` and `moduleOrigin: "admin"`.
  - Admin-added and admin-edited items are the admin's: Regenerate never retires them.
  - Regeneration retires the earlier generations' other items; it never deletes them. If a round produces nothing, only items whose quote is gone are retired, so learners keep a test.
  - Fewer than 6 live items → `needs_content` with a plain line ("Only N questions passed our checks…"). The items stay live.
  - No live items → the attempt route answers 409 "This module's test isn't ready yet."
- **Learner side:**
  - Access and the video lock are B's: `moduleLessonFor` and `assertModuleVideosWatched`, the latter returning 409 `videos_unwatched`.
  - Grading is per item, full or not yet. A pass needs ≥ 80% (`QUIZ_PASS_THRESHOLD`).
  - Each attempt goes into `topic_attempts` with `course_id` set.
  - Calibration counts first exposures only and never staff. It is given a pseudo-topic with `challengeType: "code"`, so a retirement never queues a v4.3 `topic_tests.fill` for a non-curriculum lesson.
  - A pass inserts `course_progress`, then `syncCertificates` issues the course certificate after the last module.
  - `POST /api/me/courses/topics/:topicId/complete` answers 409 for module lessons, for both tick and un-tick.
- **Jobs:**
  - `module_test.generate` syncs notes and the description inline and drops text rows of removed sources.
  - It queues `text.extract` / `transcribe` for stale sources and defers itself (20 s, `JobDeferredError`) until they settle. Every read records `done`, `failed` or `skipped`, so the deferral always ends.
  - When a source's text changes, a `generate` is queued for that module only, unless one is already waiting.
  - Whisper runs one 600 s chunk per job (ffmpeg → mono 16 kHz Opus → `STT_BASE_URL`). The partial transcript is kept as `pending` passages, and the job re-enqueues itself with `{ videoId, startSec }`, an additive payload field.
  - Drive, OneDrive, Box, Loom, Vimeo and embedded videos are `skipped` with "Questions use the docs and notes for this video." A YouTube video without readable captions gets the same note.
  - `text.extract` may also carry `force: true`, which Regenerate sets for links.
- **Cost per module:** `estimateModuleCostUsd`, at default prices, for one write round plus 3 Haiku checks:

  | Material | Estimated cost |
  | --- | --- |
  | 3,000 characters | $0.036 |
  | 6,000 characters | $0.039 |
  | 12,000 characters | $0.045 |
  | 20,000 characters (the cap) | $0.053 |

  - A second round adds about $0.01–0.02. Its material is a cache read, but the gates run again.
  - The measured spend per run is in `course_module_tests.cost_micros`, summed from `ai_calls` rows with `course_id` and the `module_test_*` tasks. It is not measured against a live key yet, because tests use the mock.
  - With the 20,000-character cap, a typical module lands at about $0.04–0.06.
- **Not done here:**
  - `server/src/oyelabs/stub.ts` no longer has callers in C's files. It belongs to the architect and should be deleted.
  - Known gate failures outside C's files at hand-off:
    - `ai.test.ts` "revealSecret has exactly one caller" fails because of D's `oyelabs/assign/embed.ts`.
    - `npm run size` is 23.8 KB over on "/learn/plan". C's code isn't in that chunk.
    - `tsc -b` errors are in A's `editor.test.ts` and in B's `learner/lesson/oyelabs/{api,ModuleLesson,players}`.

## Phase 1 (A)

Builder A: the "Add an Oyelabs course" page and its course API.

- **Routes are built** in `server/src/oyelabs/editor/` (drafts, save, read model, skill suggest). The files are `repo.ts` (save), `drafts.ts`, `payload.ts` (read model and version payload), `skills.ts`, `minutes.ts` and `provisional.ts`.
  - **Additive route:** `GET /api/admin/oyelabs/drafts` lists this admin's unsaved *new* courses. "Add Oyelabs course" uses it to offer "Continue it / Start a new one". Without it, a new course's draft could be reached only through its `?draft=` URL.
  - Editor JSON routes have a 1 MB `bodyLimit`. Draft PUT is limited to 120/min, save to 30/min and suggest to 30/min.
- **Save** follows PLAN §4.1. Two choices go beyond it:
  - **Ids:** an id the editor sends is reused when the course owns it. It is recreated when it no longer exists anywhere (a restored version), and replaced when another course owns it.
  - **Removed content:** videos, docs and modules the editor no longer sends are deleted. Module lessons are deleted with their module (cascade), which takes that module's progress with them; the confirm dialog says so.
- **"Save as draft" sets `published = false`, also on a live course.** The live rows are the only copy, so a draft that left the course visible would publish half-finished edits. On a live course the footer says that saving as a draft hides it until the next publish, and that progress stays.
- **Publish compares against the published version** (`published_version`'s stored payload), not the current rows. So changes made through draft saves still queue `text.extract` / `transcribe`, and still count in `regenerating`.
  - `link.check` is queued against the current rows, on draft and publish, only for new or changed links.
  - `module_test.generate` is queued for every module, as PLAN says.
- **Provisional video and doc fields before the link check:** the editor uses B's pure `parseVideoLink` / `parseDocLink` (`media/parse.ts`, no network) for kind, player, embed URL, link kind and fetch URL, with status `pending`. B's `link.check` fills in the rest.
  - Uploads start as `upload` / `html5` / `ok`, with `/api/v5/oyelabs/media/:id` as the playback URL.
- **`moduleMinutes(db, topicId)`** (`editor/minutes.ts`, for B) recomputes and stores `est_minutes`, and returns the new value. The estimate is:
  - each video's length when known, else 5 min;
  - plus 5 min per doc;
  - plus 10 min for the test.
- **Versions** (`v5/admin/versions.ts`):
  - An Oyelabs version also stores `oyelabs: OyelabsCourseInput` with every id.
  - It compares on that payload plus `published`, not on lesson minutes. A length found later by the link check therefore doesn't make the next unchanged Save a new version.
  - `restoreVersion` on an Oyelabs course writes no rows. It creates a draft and returns `draftId`, an additive field on the existing restore response. The editor's Versions dialog opens that draft.
- **Additive contract changes in `shared/oyelabsCourses.ts`:**
  - Plain zod messages on the course and module input.
  - `oyelabsSaveProblems`, `draftToCourseInput` and `draftFromCourseView`, shared by the page and the server.
  - Optional `titleLocked` (video/doc views) and `durationSource` (video view). Without them, re-saving would lock titles and lengths that the resolver had filled in.
- **Zod and learner bundles:** importing `shared/oyelabsCourses.ts` from a learner page pulls zod into its first load (about 24 KB gzipped; that was the "/learn/plan" overrun).
  - D's `shared/oyelabsCore.ts` (zod-free, D's file) holds `OYELABS_BADGE_TEXT`. The learner library card imports the badge text from there.
  - `oyelabsCourses.ts` keeps `OYELABS_BADGE`, the levels and the labels for admin code.
- **Visibility:** `coursesFor` and `mayOpenCourse` use `isCourseVisible` / `learnerVisibilityFacts`, so `mayOpenCourse` now respects departments.
- **Library:**
  - `LibraryCourse` has `oyelabs` and `departmentIds`. The admin card shows the badge, and Edit goes to `/admin/library/:id/oyelabs`. `src/v5/admin/api.ts` belongs to another phase, so the page widens the type locally.
  - `LibraryItem` has optional `oyelabs` and `departments`. A multi-department course files under the learner's own department.
  - The learner card and course page show the badge. Syllabus `hasVideo` counts `course_videos`.
- **Skill suggest** (`course_skill_suggest`):
  - The answer schema's `skillId` is a `z.enum` of the candidate ids: active skills of the chosen departments, plus skill areas. So a real model can only name real skills, and the mock's schema synthesiser picks real ids. That makes the enum the mock fixture, with no dispatch line in C's `mock.ts`.
  - With no AI, an AI error or an empty answer, it falls back to name/alias word matching.
- **Editor UI** (`src/v5/admin/library/oyelabs/`), on one page:
  - Department chips with "All departments".
  - Level as native radios.
  - The existing `SkillPicker`, plus "Suggest skills".
  - Module cards: B's `VideoLinksField` / `DocsField`, Tiptap notes with `lessonStarterKit`, and C's `ModuleTestPanel`. They reorder by `@dnd-kit/react` drag or by Move up / Move down buttons.
  - A sticky footer with the autosave line. It sits above the mobile tab bar.
  - Autosave is debounced 1.5 s. It creates the draft on the first change, writes `?draft=` for new courses, and retries after 5 s on failure.
- **Frozen file touched:** `server/src/oyelabs/contracts.test.ts`. Its "stub routes … 501" check used A's `GET /courses/x`, which is now a real 404. The assertion was changed to 404, and the test was renamed to "the Oyelabs routes are guarded".
- **Not done here:**
  - The lesson-header badge: `src/v5/learner/lesson/**` is B's (`ModuleLesson`). B can use `OYELABS_BADGE_TEXT` from `@shared/oyelabsCore` for it.
  - axe reports one *moderate* `landmark-unique` on C's `ModuleTestPanel` (every module's `aria-label="Module test"` is the same). Adding the module name to the label would fix it.

## Phase 2 (B)

Videos from any drive: the link resolver, the sharing check, uploads, the players and watch tracking.

### Resolver (`server/src/oyelabs/media/`)
- **Two halves.** `parse.ts` is pure (`parseVideoLink`, `parseDocLink`): it matches host + path on the parsed URL, never substrings, so `evil.example/?u=drive.google.com/…` is a generic page. `resolve.ts` adds the no-credentials check, title, thumbnail and length. A's `provisional.ts` could call `parseVideoLink` instead of its own guess (it's offline and free); not changed, A's file.
- **Per source:** YouTube/Vimeo/Loom by oEmbed (401/403 → private, 404 → not found; Vimeo/Loom give the length); Drive by an anonymous GET of `/file/d/<id>/view` (a sign-in redirect → private); OneDrive/SharePoint by GET (login.microsoftonline/login.live → private; `1drv.ms` is expanded by following its redirect, then re-parsed to the `onedrive.live.com/embed?…` form); SharePoint share links embed with `action=embedview` (best effort; couldn't be verified offline); Dropbox `dl=0/1` → `raw=1`, HEAD (Range GET fallback) must be `video/*`; Box `app.box.com/s/<x>` → `/embed/s/<x>` (Box's own `/file/<id>` page needs sign-in → "unsupported" with the fix); direct `.mp4/.m4v/.webm/.mov` → HTML5, `.m3u8` → hls; presigned S3/R2/GCS/CloudFront expiry is read from the query and an expired link is caught without a request; any other page → iframe, `X-Frame-Options`/CSP `frame-ancestors` → `not_embeddable`.
- **Fix texts** are fixed strings in `fixes.ts` (kind × status), e.g. "This Drive video is private." + "In Google Drive: Share → General access → 'Anyone with the link' (or 'Oyelabs' if every learner is signed into their Oyelabs Google account) → Viewer. Then press Check again."
- **Loom stays estimated.** Its embed SDK gives no reliable playhead events, so `TRACKING_FOR_KIND.loom` is unchanged.
- **"Private" Drive/OneDrive/Box can be on purpose** ("shared with Oyelabs only" looks private to an anonymous check). Such entries still play for learners (the iframe works when they are signed in) and still count towards the lock; other broken links become `unavailable` and don't block. The inbox line has "Mark as checked" for exactly this case.
- **Network blips:** `unreachable` only sets `broken_since` on the second failed check in a row, so one bad minute doesn't reach the inbox. A link that works again clears it.

### `safeFetch` (shared with C)
- Every hop: http(s) only, no userinfo, the host resolved with `dns.lookup(all)` and refused when **any** address is private/loopback/link-local/CGNAT/multicast/reserved (IPv4, IPv6, v4-mapped and NAT64 forms); `localhost`/`.local`/`.internal` names refused; redirects by hand (max 5); one time budget for the chain (8 s); body capped (1 MB default). `credentials: "omit"`, no cookies.
- **Residual risk accepted:** the check runs before `fetch` connects, so a host whose DNS changes in between could slip through (no undici dispatcher without a new package). Only staff paste links and the result is a status and a title. ffprobe on a remote URL (`probeDuration`) is not wired by default for the same reason; lengths of Dropbox/direct files come from the player's first sample.
- **Offline e2e/dev stub:** `OYELABS_FETCH_STUB=http://127.0.0.1:<port>` (never in production; loopback origins only) sends every request to `<stub>/__stub/<host><path>?<query>`. Names aren't resolved then, but literal private addresses are still refused. This is the "dev-only env flag" PLAN §8 asks B to provide for the Phase 5 Playwright run. Read from `process.env` in `safeFetch.ts` (env.ts isn't B's file).

### Uploads and transcoding
- `POST /api/admin/oyelabs/uploads?kind=doc|video` (or a `kind` field before the file), `bodyLimit` 1 GB + 1 MB, rate 30/min. Streamed through sha256 into `uploads/tmp/<id>.part`, then renamed to `uploads/<yyyy>/<mm>/<id>.<ext>`. Extension **and** first bytes must agree (`%PDF`, `PK\x03\x04`, the `ftyp` box for MP4/MOV/M4V, EBML for WebM/MKV, `RIFF…AVI `, UTF-8 without NULs for TXT/MD) → else 415; over the kind's limit → 413 with plain copy; an identical file (sha256 + kind) is reused (200 instead of 201). The display name is cleaned (`../../x.md` → `x.md`); stored paths never come from it.
- MP4/WebM play at once (`transcode_status = none`) and are still probed; MOV/MKV/AVI start `pending`. The `oyelabs.upload.transcode` job (fake runner in tests) probes the length (spread to every `course_videos` row using the upload, then A's `moduleMinutes`), and converts anything browsers can't play (non-H.264/AV1 MP4, non-VP8/VP9/AV1 WebM, other containers) with `libx264 veryfast crf 23 + aac + faststart` to `<id>.play.mp4`, timeboxed at 1 h. Without ffmpeg: MP4/WebM stay playable, others fail with "Video conversion isn't available on this server." The boot log says so (from `startLinkRecheck`, since index.ts is frozen).
- Streaming `GET /api/v5/oyelabs/media/:uploadId`: Range → 206/416, `Accept-Ranges`, `Cache-Control: private`, `nosniff`. Staff always; a learner only when a module video of a course they may open uses the upload; anything else 404.
- **Orphans:** the daily sweep deletes uploads older than 7 days that no video/doc row uses **and that no autosave draft or saved course version mentions** (so restoring a version never finds its file gone). The row stays with `deleted_at`.

### Tracking, lock and the playlist (`tracking.ts`)
- **Access** (`mayOpenOyelabsCourse`): staff always; learners need `mayOpenCourse` **and** `isCourseVisible` (so the department rule holds even before/independently of A's wiring).
- **Exact** (YouTube, Vimeo, HTML5): v4.3 `addPlayedInterval` ranges, watched at 90% (`WATCHED_RATIO`); the first real length a player reports fills an unknown `course_videos.duration_seconds` (`player`) and refreshes the module's minutes.
- **Estimated:** the server credits `min(sample, wall clock since the previous sample + 2 s, 30 s)`; hidden or unfocused samples count 0; every sample restarts the clock (time away is never banked); the first sample is capped at one interval. `I've watched this` → 409 under 80% ("Keep watching: … about N more minutes") or with no length ("Ask your admin to add the video's length"). Watched = 80% **and** the click.
- **Client active time** (`useActiveTime`): counts while the tab is visible, the iframe is ≥ 50% on screen (IntersectionObserver), `document.hasFocus()` (stays true while the learner uses the player inside the iframe), and not idle (page input within 120 s, **or focus inside this embed**, since clicks inside a cross-origin iframe never reach the page). A 0-second sample on start sets the server's clock.
- **Lock for C:** `assertModuleVideosWatched(db, user, topicId)` throws the v4.3 409 `videos_unwatched` ("Watch the 2 remaining videos of this module first (0 of 2 watched)."). `warn` mode, staff and completed modules are exempt; `unavailable` entries (broken links, uploads not playable yet) don't block. C's attempt path already calls it (`moduleTests/repo.ts`).
- `GET …/playlist` returns `ModuleLessonResponse` (additive, `shared/videoSourcesCore.ts`): the playlist + `docs` (uploads via the download route, links as is) + `notes` (Tiptap JSON), so the lesson loads with one request. `ModulePlaylistResponse` gained optional `lockMode`; `ModulePlaylistEntry` optional `unavailableReason`.

### Contract changes (additive)
- `shared/videoSources.ts` is now split: the names, types, constants and pure rules moved to the zod-free **`shared/videoSourcesCore.ts`** (re-exported, so every `shared/videoSources` import still works); the schemas stay. Added: `isBrokenStatus`, `activeIncrement`, `creditedActiveSeconds`, `estimatedProgress`, `ESTIMATED_SAMPLE_TOLERANCE_SEC`, `LINK_RECHECK_AFTER_MS`, `ModuleDocEntry`, `ModuleLessonResponse`.
- **`CONFIDENTIALITY_NOTE` is now the brief's wording:** "For internal-only videos, upload them here or use Drive shared with 'Oyelabs' only." (The 0.1 placeholder was longer.)

### Players (`src/v5/learner/lesson/oyelabs/`)
- `CourseLesson.tsx` lazily imports `ModuleLesson` for `kind === "module"` (its own chunk; the course lesson's initial JS is unchanged), widens the column for the sidebar, hides "Mark as done" for modules ("You've passed this module's test." once done).
- Everything heavy waits for Play: YouTube keeps the Phase 9 facade (`useYouTubePlayer({ enabled })`); Vimeo has a facade, then loads `player.vimeo.com/api/player.js`; embeds have a facade; `hls.js` is a dynamic import only for `.m3u8` where the browser has no native HLS. HTML5 caps the rate at 2× (faster wouldn't count).
- Playlist sidebar, the 5-second "Up next" countdown (v4.3 `upNextReducer`, the learner's autoplay preference) for players we can read, and a "Next video" button for embeds. Notes render read-only from the Tiptap JSON without loading Tiptap. `ModuleTestStep` (C) sits under the playlist with `locked`.
- Staff previews (`?preview=1`) never send samples.

### Editor fields (`src/v5/admin/library/oyelabs/media/`)
- `VideoLinksField`: the confidentiality line, a paste box (one link per line; pasting into the empty box adds at once), "Upload a video" (XHR for progress), one card per video (thumbnail, provider, title box, "Plays ✓" or "Can't play: reason" + fix, "Check again", a "Length in minutes" box for estimated embeds), drag (dnd-kit) **or** Move up/down. Unsaved links are resolved for the preview (cached per page); saved ones use A's `saved` views and "Check again" re-checks the row. Uploads follow their conversion state. `DocsField` is the same for documents.

### CSP (`server/src/lib/csp.ts`)
- `script-src` + `https://player.vimeo.com`; `img-src` + `i.vimeocdn.com`, `cdn.loom.com`, `drive.google.com`, `*.googleusercontent.com`, `*.boxcdn.net`; `media-src` + `https:` (direct/Dropbox/R2); `connect-src` + `https:` (hls.js segments). `frame-src https:` already covered every embed. Still no `'unsafe-eval'`; `csp.test.ts` pins it.

### Inbox
- Phase 0 is committed (32058f0), so the one line is in `server/src/v5/admin/inbox.ts`: `items.push(...brokenLinkInboxItems(db, dismissed, now))`. One line per course in "courses": `1 link in "White-label delivery" stopped working` / the first reason / "Fix the link" → `/admin/library/<id>/oyelabs`; secondary "Mark as checked" (its key carries the newest break, so a new break shows again).

### Tests
- `parse.test.ts` (36: every source of PLAN §8 incl. YouTube watch/short/shorts/embed/live, Vimeo unlisted, Loom, Drive view/open, 1drv.ms, SharePoint `:v:`, Dropbox dl=0/dl=1/scl/folder, Box, mp4/webm/m3u8, S3/R2 presigned, a generic page, garbage), `resolve.test.ts` (14: private Drive + exact fix, 404, XFO DENY, SSRF 127.0.0.1/169.254.169.254/::1/10.x, DNS to private, redirect to private, too many redirects, oEmbed, Dropbox, expiry, 1drv.ms expansion, SharePoint sign-in), `media.test.ts` (18: uploads 201/dedupe/413/415/403/traversal, Range 206/416, learner outside the department 404, doc download, transcode with a fake runner, estimated wall-clock cap / hidden / unfocused / confirm under 80% / unknown length / watched needs both, exact ranges, the lock incl. warn/staff/unavailable/completed, recheck → broken_since + inbox → cleared, blip rule, sweep + orphans, Check again), `shared/videoSourcesCore.test.ts`, `fieldLogic.test.ts`, `csp.test.ts`.
- e2e `scripts/e2e/v45-video-sources.ts` (port 8871; local stub + Playwright routes, no external network; fixture `scripts/e2e/fixtures/v45-sample.webm`, 4 s VP8, 20 KB, made with Playwright's own ffmpeg): resolver, editor cards, upload + 206, learner module lesson (Drive estimated → "I've watched this" → watched; Dropbox and the upload play to the end → watched; lock lifts), axe at 1440/390.
- Gates: `tsc -b`, `eslint .`, `npm run build`, `npm run size` green (lesson 198 KB: `ModuleLesson` and `CourseLesson` are their own chunks). `npm test`: everything of mine passes; two unrelated failures at the time of the full run (`ai.test.ts` "revealSecret has exactly one caller" now sees D's `oyelabs/assign/embed.ts`; `intents.test.ts` timed out under load and passes alone). On snapshot `p45b` (removed): v45-video-sources, v5-lesson, v5-pwa and v43-video (`UI_V5_DEFAULT=off`, run from the snapshot's copy since it has no `E2E_APP_DIR`) pass.

## Phase 4 (D)

### What was built
- **Assignments** (`server/src/oyelabs/assign/repo.ts`, `routes.ts`):
  - learner → one `course_assignments` row (`source = admin`) with the priority; adding again changes the priority, never duplicates;
  - department now → one row per learner in it (`source = department`; an `admin` or `path` row keeps its source);
  - everyone in the department → a `course_department_rules` row (optional `required`), read lazily, so people who join later have it with no backfill;
  - "Most important" or "Required" rebuilds the current week (rules only, pins kept) of up to 50 people it reaches, so it shows this week;
  - removing a department removes the rule and the `department` rows of the people in it; rows added for one person by name stay.
- **Additive routes and contract** (Phase 4 section of `shared/oyelabsCourses.ts`):
  - `GET /api/admin/oyelabs/learners/:userId` → `LearnerCoursesView` (their department and what they have), for the dialog's targets;
  - `GET …/search` returns `{ courses: CourseSearchHit[] }` (an object, like the other list routes), with an optional `userId` that marks `assigned`, plus `published`;
  - `AssignCourseResponse` (counts and a plain toast line), `PickedCourse`, `PRIORITY_FOR_CHOICE`;
  - generated courses are left out of search, because they belong to paths.
- **Legacy `PUT /api/admin/courses/:courseId/assignees`** now diffs the set. Kept rows keep their `priority`, `source` and date.
- **"Add a course" UI** (`src/v5/admin/people/AddCourse.tsx`): one picker, two looks.
  - `AddCourse` is the v5 People sheet version. `ClassicAddCourse` is used in the old learner page header and the onboarding card.
  - It has priority radios, the three targets, the "Required for everyone in this department" box, Oyelabs courses first with the badge, and "Has it: Important" / Update.
  - The old learner page (`AdminLearnerPage.tsx`, Phase 0's file) got **one line** rendering `ClassicAddCourse`.
- **Onboarding**:
  - The preview's `path` step adds `oyelabsCourses`: description phrases and shared skills, matched against Oyelabs courses in the department; top 3, with plain reasons.
  - The plan card shows "Courses they'll get". It lists suggested Oyelabs courses ("Add it") and any course found through search, each with a priority.
  - The courses are given after the account and setup save: `QuickOnboard` looks the new user up by username. A failure shows as a toast and never undoes the save.
  - Bulk onboarding doesn't show the section.
  - `uncoveredSkills` no longer lists a skill that an Oyelabs course covers under "New courses we'll add".
- **Embeddings** (`assign/embed.ts`, job `oyelabs.course.embed`):
  - The embedded text is the title, description, skill names and aliases, module titles and the start of the notes.
  - Skipped when the text hash and model are unchanged.
  - **The OpenAI key is decrypted only in `AiService.embedTexts`** (new, additive, in `ai/service.ts`). `ai.test.ts` allows exactly one decrypting file (`ai/service.ts`), and a first version that decrypted in `embed.ts` broke it.
  - With the mock provider or no OpenAI credential, the local embedder is used. A failing remote call also falls back to local.
  - Vectors are compared only within one model (`cosine` throws when the lengths differ).
  - When the stored vector comes from another model, the course is compared locally on the fly (`local-hash-v1` takes microseconds). So synchronous callers (the preview, the weekly plan) never wait on the network.
- **Thresholds differ from PLAN §4.4** (which had 0.80 for skills and 0.75 for descriptions).
  - Calibrated on our own course texts: a matching phrase scores 0.41–0.61 locally, an unrelated one under 0.1.
  - Now `MATCH_THRESHOLDS`: local 0.45 for a skill / 0.40 for a phrase; OpenAI 0.60 / 0.50.
  - The course's own skills (`course_skills`) are the main signal and always count.
  - Descriptions are split into phrases (at commas, "and", "who", "that", …), because one long sentence dilutes every phrase in it.
- **Path builder** (`builder/run.ts`, after `feat(v4.5-p0)`):
  - **Placement:** one call to `oyelabsCourseForPath`, **before the curriculum modules**, not just before `libraryCourseFor` as PLAN said. The brief asks that the company's own course be preferred over generic ones, and curriculum modules are generic too.
  - **When a course fits:**
    - the path item gets `source = unlock`;
    - its reason is `oyelabsReason(course)`, e.g. "Added because it's Oyelabs' own process for white-label projects.";
    - a `course_assignments` row is added with `source = path`;
    - nothing is generated.
  - **Eligible courses:** published, Oyelabs, and in the learner's department. That means no `course_departments` rows, one of them, or a rule for the department.
  - **Badge:** `PathItemView.oyelabs?: true` (shared/builder.ts) is set by **one line** in `currentPath` (Phase 0's `builder/repo.ts`). The badge shows in `PathByPriority.tsx` (both lists) and in v5 `PlanTrails.tsx` (the milestone label).
  - `shared/pathReasons.ts` re-exports `oyelabsReason`, and `naturalReason` leaves it unchanged.
- **Zod-free core:** `shared/oyelabsCore.ts` holds `OYELABS_BADGE_TEXT` and `oyelabsCourseReason`, re-exported by `oyelabsCourses.ts` and `pathReasons.ts`. Importing `oyelabsCourses.ts` into `PlanTrails` had put zod in `/learn/plan` (223.8 KB, over the 200 KB budget); it is now 195.4 KB.
- **Weekly plan** (`plans/weekly/candidates.ts`, `builder.ts`, `types.ts`; the rules are in `oyelabs/assign/weekRules.ts`):
  - **Visibility:** candidates use `isCourseVisible`. This fixes the old gap where departments were ignored.
  - **What each course lesson carries:**
    - `assignedPriority`: the more important of the assignment and the department rule;
    - `required`;
    - `prereqKeys`: unfinished lessons that teach a `prerequisite` skill of the course, from courses tagged with that skill or curriculum topics in its content modules, up to 2 per skill.
  - **Before the path:**
    - Required courses in weeks 1–2 (`REQUIRED_WEEKS`) go to Do it now in module order, within the half-week cap.
    - Then Most important: up to 2 lessons per course, with at most 4 items in the red lane.
  - **After the path:**
    - Important goes to **Medium**. PLAN said Must know, but Must know is the checklist of prerequisites of 45 minutes or less, and `enforce` moves anything longer out of it.
    - Nice to have goes to Low.
  - **Progression:**
    - Lessons are taken strictly in course order: one that doesn't fit holds back the rest.
    - Unmet prerequisites come first, in Must know (or in the same lane when over 45 minutes), and the module lists them in `dependsOn`.
    - A prerequisite that fits nowhere holds the course back.
  - **"Unmet"** means some lesson teaching the prerequisite skill is unfinished. The learner's measured skill level is not consulted yet; that is a later refinement.

### Files touched outside D's folders (one line, or additive)
- `server/src/ai/service.ts`: `embedTexts` (additive).
- `server/src/builder/repo.ts`: one spread line in `currentPath` (the `oyelabs` flag).
- `src/features/admin/AdminLearnerPage.tsx`: one import and one JSX line.
- `src/features/admin/setup/PlanCard.tsx`: the courses section sits **above** "New courses we'll add to the library", because `v44-reference-case.ts` reads the card's text up to the next known heading.
- `shared/oyelabsCore.ts`: D created it while A was also moving the badge there. D's version is the one on disk. A's `OYELABS_BADGE_TEXT` import resolves against it and `tsc -b` is clean, but A should check that nothing else of theirs was meant to live there.

### Tests
- `server/src/oyelabs/assign/assign.test.ts` (17 tests):
  - **assignments:** learner with priority, re-prioritise, 400/403; department now vs everyone, where a learner who joins later sees it with no row, another department doesn't, and removal works; the legacy PUT keeps priority;
  - **search:** Oyelabs first, the badge, `assigned`, generated courses left out;
  - **weekly plan:** a required course goes to Do it now in weeks 1–2 in module order, with the prerequisite first in Must know and in `dependsOn`, and to Medium in week 3; the progression hold-back; the priority lanes;
  - **embeddings:** the local embedder is deterministic and ranks correctly; other models are never compared; the OpenAI embedder works with an injected fetch; the embed job writes, skips and falls back;
  - **reasons and onboarding:** plain reasons; the onboarding suggestion through both the endpoint and the preview;
  - **path builder:** it picks the Oyelabs course with the reason, queues no `course.generate`, assigns the course, and the view has `oyelabs: true`.
- `src/v5/admin/people/courseAssign.test.ts` (the pure helpers).
- **Gates:** `tsc -b`, `eslint .`, `npm test` (201 files), `npm run build` and `npm run size` are green. On snapshot `p45d` (removed afterwards), `v5-admin.ts` and `v44-reference-case.ts` (`UI_V5_DEFAULT=off`) pass.

## Phase 5

### Regression 1: the old UI loaded the v5 design CSS
**Cause.** Phase 4's `ClassicAddCourse` lived in `src/v5/admin/people/AddCourse.tsx`, and that file imports `@/v5/design`. The old learner page (`AdminLearnerPage.tsx`) and the onboarding card (`PlanCard.tsx`) imported it, and `QuickOnboard.tsx` imported `@/v5/admin/people/courseAssign`. So `?ui=old` pulled in the v5 tokens CSS chunk, and the v5-design check "the v5 tokens are not loaded in the old UI" failed.

**Fix.** The old UI never imports anything under `src/v5/**` that reaches the design system.
- **`src/features/courses/assign/courseAssign.ts`** holds the shared, design-free part: the API calls, `assignRequest`, `courseSizeLine`, `withPicked`, `assignPicked` and a new `assignErrorMessage`. It was moved with `git mv`, together with its test.
- **`src/features/courses/assign/ClassicAddCourse.tsx`** is the old-design picker. It is built only from `src/components/ui` (Button, Input, Badge, Dialog) and has its own small fetch and debounce hooks.
- **`src/v5/admin/people/AddCourse.tsx`** keeps only the v5 look. The two-look `LOOK` table is gone, and it imports the shared logic from the new place.
- **The three old-UI files** now import from `@/features/courses/assign/…`.

The two pickers share no JSX. That costs about 150 duplicated lines, and it is what keeps the designs apart.

### Regression 2: Business Development lost "Part 2" (v4-departments, `UI_V5_DEFAULT=off`)
**Cause.** Phase 0's `onePerCourse` (`server/src/builder/repo.ts`, inside `currentPath`).
- BD maps most of its catalog skills onto two curriculum modules, `bd-beginner` and `bd-intermediate`.
- Part 1 (Cold email → `bd-beginner`, Running discovery calls → `bd-intermediate`) already used both modules. Every later item (Objection handling → `bd-intermediate`, and the rest) pointed at one of them again.
- `onePerCourse` treated every later mention of a module as a repeat and dropped it, so the path read `[P1] BD Foundations, [P1] Winning Deals`, with no Part 2.
- After the fix it reads `[P1] BD Foundations, [P1] Winning Deals, [P2] Winning Deals ← Objection handling`.
- Engineering and PM have enough distinct modules that it never showed there.

**Ruled out:** Phase 4's `oyelabsCourseForPath` in `builder/run.ts`. The e2e database has no Oyelabs course, so it returns null.

**Fix (product code, the test is unchanged).** `onePerCourse` now keeps **every part**.
- When all of a part's items are repeats, the part's first item stays, in its place. So the path still reads Part 1 → Part 2 → the rest, and the parts keep their order.
- Repeats inside a part that has an item of its own are still dropped or turned into "Needs: …", as Phase 0 designed.
- Stored `path_items` were never touched, so existing paths heal on the next read.

**Test:** `connection.test.ts`, "a part made only of repeats keeps its first item (Business Development)". It uses the BD shape, plus a mixed case where the repeat in Part 2 is still dropped because Part 2 has its own item.

### Tests added for the brief (PLAN §8 checked against the code)
Most were already there per builder.

**The gap:** the private-link check was asserted only for Drive (with the exact fix), Vimeo and SharePoint (status only). `resolve.test.ts` now has a table with one case per source: YouTube, Vimeo, Loom, Drive, OneDrive, SharePoint, Dropbox, Box, a direct file and any other page. Each case checks:
- the sign-in redirect or 401/403 gives `private`;
- the plain message for that source;
- that source's own fix, ending "Then press Check again."

**Small product fix found by the e2e.** `pageTitle` now also removes " - Google Docs / Sheets / Slides", so a Google Doc link is titled "Handover checklist", not "Handover checklist - Google Docs". Module tests cite the doc by that title. A case was added to the helpers test.

### Playwright: `scripts/e2e/v45-oyelabs-flow.ts`
- **Name.** PLAN §8 called it `v45-oyelabs-course.ts`. The brief for Phase 5 names it `v45-oyelabs-flow.ts`, and that name is used.
- **Scope.** Its steps 6 and 11 (assignment from People, the edit-and-regenerate pass) are covered by `assign.test.ts`, `moduleTests.test.ts` and `v45-oyelabs-editor.ts`, so the e2e stays on the one journey the brief lists.
- **The real editor:**
  - Drive link + typed length + uploaded PDF;
  - Dropbox link + Google Doc link + notes;
  - Save & publish.
- **Automatic questions** with no clicks: both modules Ready with 8 questions, and every item cited, including "Kick-off SOP.pdf, page N" and "Handover checklist".
- **The learner:**
  - the Library badge;
  - Drive active time, with "I've watched this" at 80% and then the click;
  - Dropbox played to the end (exact);
  - both tests passed through the UI, using the admin preview's key;
  - the certificate is issued, `public` says valid, and `/verify/<id>` shows it.
- **Offline.** The `OYELABS_FETCH_STUB` stub answers for Drive, Dropbox and Google Docs (`/edit` and `/export?format=txt`). The browser's Drive player and Dropbox file are fulfilled by Playwright.
- **Test data, not a product change.**
  - The editor's shortest video length is 1 minute (`minutesToSeconds` floors at 60 s), so the Drive step waits about 50 s of active time.
  - Each module needs at least 1,500 characters of material (`MODULE_TEST_MIN_SOURCE_CHARS`). The first run's module 2 had 1,330 and correctly showed "needs content", so the Google Doc text and the notes were made longer.
  - The local machine has no ffmpeg, so the Dropbox video's transcript is "not used for questions". That is the designed fallback.

### Size budget
`npm run size` was over by about 0.3 KB on "lesson player initial JS" (200.29 KB) and "/design first load" (230.27 KB) while this phase ran.
- Both come from the rebrand agent's in-progress edits to shared entry files, not from v4.5: `App.tsx`, `RouteFallback`, `RouteErrorBoundary`, `useDocumentTitle` and the `/design` brand section.
- Phase 5's front-end changes touch only the old admin pages and the v5 People sheet, which are not in those chunks.
- Recheck after the rebrand phases land.
