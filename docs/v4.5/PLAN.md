# v4.5 plan: "Add an Oyelabs course" (Phases 1–4)

Status: contracts implemented (step 0.1). Migration `0026_v45_oyelabs_courses`, shared types, and route/job stubs are in the tree and compile. Builders A–D can start in parallel. Phase 0 (research provider, queue, path builder and plan UI) is a separate stream. §6 says what D may touch after Phase 0 lands.

## 1. The one idea

**An Oyelabs course is a normal course with extra fields. It is not a parallel system.**

| Concept in the brief | Where it lives | Why |
| --- | --- | --- |
| The course | `courses` row with `oyelabs = true` | The library, `coursesFor`, the weekly-plan candidates, `path_items.course_id`, `course_progress` and course certificates already work on `courses`. |
| Level | `courses.level` (existing; `expert` is shown as "Super advanced") | Already there since v4. |
| Departments (several, or "All") | `course_departments` (no rows = All); `courses.department_id` is left null | The legacy column can hold only one department. |
| Skills | `course_skills` (existing table, never written until now) | Already read by `v5/me/library.ts`. |
| Module | `course_sections` row, plus `notes` / `notes_text` | A module is a section. |
| The module's learning unit | **one managed `course_topics` row per module, `kind = 'module'`** | It holds the playlist, docs, notes and module test. Its id is stable across edits, so `course_progress`, `video_progress` and test attempts survive new versions. Weekly plans schedule it as an ordinary lesson (`lesson_id`). Certificates count it as an ordinary lesson. |
| Videos | `course_videos` (resolved kind, player, tracking, duration, status, last check) | One row per video, in order. The row id is the `video_progress.video_id`. |
| Docs | `course_docs` (upload or link) | |
| Uploaded files | `media_uploads` (path, size, mime, sha256, transcode status) | |
| Versions | `content_versions` (entity `course`), the v5 table already used by the editor | `courses.published_version` records what learners see. |
| Autosave | `course_drafts` | The live rows stay untouched until Save. |
| Module test items | `topic_test_items` with `topic_id` = the managed lesson id; grounding in `topic_grounding` (same id) | This reuses the v4.3 pipeline: gates, calibration, edit, retire. |
| Module test status, summary and hashes | `course_module_tests` (one per section) | |
| Extracted text and passages | `course_module_texts` (one per source) | |
| Test attempts | `topic_attempts` with `course_id` set | The same table as topic tests. `course_id` lets curriculum reports exclude these rows. |
| Estimated tracking | `video_progress.tracking / active_seconds / confirmed_at` | The same table as exact tracking. |
| Assignment priority | `course_assignments.priority / source` | |
| "Everyone in this department" (also covers new learners) | `course_department_rules` (`required` flag) | Read lazily like `audience = everyone`, so there is never a backfill. |
| Embedding | `course_embeddings` (Float32 blob, model, text hash) | |

A course finishes the way every course finishes: every lesson has a `course_progress` row. That makes `courseCandidates` in `v5/certificates/repo.ts` issue the certificate with no change. A module lesson gets its row **only by passing the module test** (C), never by ticking it.

## 2. Schema: migration `0026_v45_oyelabs_courses`

Generated with `npm run db:generate -- --name v45_oyelabs_courses` (`drizzle-kit generate` from `server/src/db/schema.ts`), as every migration since 0000. The migration file, `meta/0026_snapshot.json` and the journal entry are in the tree. It is **additive only**: 9 `CREATE TABLE` statements and 11 `ALTER TABLE … ADD` statements with defaults. Nothing is renamed or dropped. The app applies it at boot (`openDb` → `migrate`, after the pre-migration backup). The test harness runs it on every fresh database, and `server/src/oyelabs/contracts.test.ts` writes a row to every new table.

New columns on existing tables:

| Table | Column | Notes |
| --- | --- | --- |
| `courses` | `oyelabs` bool default false; `published_version` int | |
| `course_sections` | `notes` json (Tiptap) ; `notes_text` text default '' | |
| `course_topics` | `kind` text default 'lesson' (`lesson`/`module`) | |
| `course_assignments` | `priority` (`most_important`/`important`/`nice_to_have`); `source` default 'admin' (`admin`/`department`/`path`) | |
| `video_progress` | `tracking` default 'exact'; `active_seconds` default 0; `confirmed_at` | |
| `topic_attempts` | `course_id` | |

New tables:

- `course_departments(course_id, department_id)`
- `course_department_rules(course_id, department_id, priority, required, created_by, created_at)`
- `course_drafts(id, course_id?, data json, created_by, updated_by, created_at, updated_at)`
- `media_uploads(id, kind doc|video, rel_path, original_name, mime, bytes, sha256, transcode_status, playback_rel_path, playback_mime, duration_seconds, error, created_by, created_at, deleted_at)`
- `course_videos(id, course_id, section_id, topic_id, position, input_url, upload_id, kind, provider_id, player_kind, embed_url, playback_url, tracking, title, title_locked, thumbnail_url, duration_seconds, duration_source, status, problem json, last_checked_at, broken_since, transcript_status, created_at, updated_at)`
- `course_docs(id, course_id, section_id, position, source upload|link, upload_id, url, link_kind, fetch_url, title, title_locked, status, problem json, last_checked_at, broken_since, text_status, created_at, updated_at)`
- `course_module_texts(id, course_id, section_id, source_kind, source_id, title, status, method, passages json, chars, content_hash, error, updated_at)`, unique on (section, kind, source)
- `course_module_tests(section_id PK, course_id, topic_id, status, summary, source_summary json, content_hash, generated_hash, item_count, generation, cost_micros, model, error, generated_at, updated_at)`
- `course_embeddings(course_id PK, model, dims, vector blob, text_hash, updated_at)`

Everything is cascade-deleted with its course or section, except `media_uploads`, which outlives the rows that reference it. Its sha256 deduplicates repeat uploads. B cleans up orphans in the daily job.

**Schema is frozen at 0026 for v4.5.** A builder who needs another column writes it up in DECISIONS.md and adds `0027_v45_<what>`, one at a time, after checking that nobody else is generating. Never edit 0026 once anyone has run it.

## 3. Contracts (implemented now)

### 3.1 Shared files

| File | Owner | Holds |
| --- | --- | --- |
| `shared/oyelabsCourses.ts` | A (the Phase 4 section is D's) | Levels, priorities, upload limits/types, the editor input (`oyelabsCourseInputSchema`, `saveOyelabsCourseRequestSchema`), the loose autosave shape (`oyelabsDraftDataSchema`), read views (`OyelabsCourseView`…), skill suggestion, assignment/search/suggestion schemas |
| `shared/videoSources.ts` | B | Source kinds, tracking per kind (`TRACKING_FOR_KIND`), player kinds, link statuses, `LinkProblem` (message + fix), `ResolvedVideo`, `ResolvedDocLink`, estimated-tracking constants and `activeTimeSampleSchema`, `ModulePlaylistResponse`, `CONFIDENTIALITY_NOTE`. **Types only**; the resolver is B's server code. |
| `shared/moduleTests.ts` | C | Source kinds, extraction methods, passage/locator/citation schemas, `citationLabel`, statuses, sizes (6–10, target 8), cost target, `moduleTestSummaryLine`, admin item input, served/attempt/graded shapes |
| `shared/courses.ts` | (existing) | Added `CourseTopic.kind?: "module"` and `Course.oyelabs?: true`. Both are optional and present only when set, so version snapshots of existing courses do not change. |
| `shared/enums.ts` | (existing) | 7 job types and 3 AI purposes added (below) |
| `shared/aiRouting.ts` | (existing) | Tasks `module_test_write` (Sonnet 5.5), `module_test_relevance`, `module_test_answer` (Haiku), `course_skill_suggest` (Haiku, urgent) |

Contract changes after today are **additive only**. Record each one in DECISIONS.md and tell the builders who read it.

### 3.2 API surface

Admin routes are encapsulated plugins with `staffOnly`, so the users.test 403 sweep covers them. Learner routes check `requireActiveUser` and the course access rule (§3.4). Every route below exists as a 501 stub with a `TODO(<owner>)`.

**A: editor** (`server/src/oyelabs/editor/routes.ts`)

| Route | Body → result |
| --- | --- |
| `POST /api/admin/oyelabs/drafts` | `{courseId|null}` → `OyelabsDraftView` |
| `GET / PUT / DELETE /api/admin/oyelabs/drafts/:draftId` | PUT `putOyelabsDraftRequestSchema`, bodyLimit 1 MB, rate-limited 120/min |
| `POST /api/admin/oyelabs/courses` | `saveOyelabsCourseRequestSchema` → `SaveOyelabsCourseResponse` (new course) |
| `PUT /api/admin/oyelabs/courses/:courseId` | same; creates a new version |
| `GET /api/admin/oyelabs/courses/:courseId` | → `OyelabsCourseView` |
| `POST /api/admin/oyelabs/skills/suggest` | `suggestSkillsRequestSchema` → `SuggestSkillsResponse` |

**B: media** (`server/src/oyelabs/media/routes.ts`)

| Route | Body → result |
| --- | --- |
| `POST /api/admin/oyelabs/links/resolve` | `{url}` → `ResolvedVideo` (synchronous, 8 s budget; the editor's preview card) |
| `POST /api/admin/oyelabs/docs/resolve` | `{url}` → `ResolvedDocLink` |
| `POST /api/admin/oyelabs/uploads` | multipart: `kind` field + `file` → `UploadView` (streamed to disk) |
| `GET /api/admin/oyelabs/uploads/:uploadId` | → `UploadView` (transcode progress) |
| `POST /api/admin/oyelabs/videos/:videoId/check` and `POST /api/admin/oyelabs/docs/:docId/check` | "Check again" |
| `GET /api/v5/oyelabs/lessons/:topicId/playlist` | → `ModulePlaylistResponse` |
| `POST /api/v5/oyelabs/lessons/:topicId/videos/:videoId/progress` | exact: `videoProgressRequestSchema` (shared/video.ts); estimated: `activeTimeSampleSchema` |
| `POST /api/v5/oyelabs/lessons/:topicId/videos/:videoId/watched` | the "I've watched this" click |
| `GET /api/v5/oyelabs/lessons/:topicId/docs/:docId` | uploaded doc download |
| `GET /api/v5/oyelabs/media/:uploadId` | video stream, HTTP Range |

**C: module tests** (`server/src/oyelabs/moduleTests/routes.ts`)

| Route | Body → result |
| --- | --- |
| `GET /api/admin/oyelabs/modules/:sectionId/test` | → `ModuleTestView` |
| `POST …/test/regenerate` | regenerates this module only |
| `POST …/test/items`, `PUT …/test/items/:itemId`, `DELETE …/test/items/:itemId` | `moduleTestItemInputSchema`; delete = retire |
| `GET /api/v5/oyelabs/lessons/:topicId/test` | → `ServedModuleTest` (no keys) |
| `POST /api/v5/oyelabs/lessons/:topicId/test/attempt` | `moduleTestAttemptSchema` → `GradedModuleTest` |

**D: assignments** (`server/src/oyelabs/assign/routes.ts`)

| Route | Body → result |
| --- | --- |
| `POST /api/admin/oyelabs/assignments` | `assignCourseRequestSchema` |
| `GET /api/admin/oyelabs/courses/:courseId/assignments` | → `CourseAssignmentsView` |
| `DELETE …/assignments/learners/:userId`, `DELETE …/assignments/departments/:departmentId` | |
| `GET /api/admin/oyelabs/search?q=` | → `CourseSearchHit[]` |
| `POST /api/admin/oyelabs/suggest` | `suggestCoursesRequestSchema` → `SuggestCoursesResponse` |

Registration: `server/src/oyelabs/routes.ts` (`registerOyelabsRoutes`, called once from app.ts after the v5 admin routes). It is frozen; builders add routes inside their own files.

### 3.3 Job kinds

These are registered through `server/src/oyelabs/jobs.ts` (one spread in index.ts's handler map, plus `startOyelabsSchedulers` and its stop on shutdown). The worker runs one job at a time, so every long job must be **resumable in slices**: do one unit, then re-enqueue with a short delay, the same pattern as `topic_tests.recheck`.

| Job | Owner | Payload | Notes |
| --- | --- | --- | --- |
| `oyelabs.link.check` | B | `{videoId}` or `{docId}` | Resolve + no-credentials sharing check. Sets `status/problem/last_checked_at/broken_since`. Updates the duration and the managed lesson's `est_minutes` (via A's `moduleMinutes`). |
| `oyelabs.links.recheck` | B | `{}` | Daily (`LINK_RECHECK_INTERVAL_MS`). Queues `link.check` for every link older than 20 h. Newly broken → admin inbox. |
| `oyelabs.upload.transcode` | B | `{uploadId}` | ffprobe, then ffmpeg to MP4 when not playable. Queued by the upload route. |
| `oyelabs.text.extract` | C | `{sectionId, sourceKind, sourceId}` | Skips when `content_hash` is unchanged |
| `oyelabs.transcribe` | C | `{videoId}` | YouTube captions or Whisper. One 10-minute chunk per run, then re-enqueue. |
| `oyelabs.module_test.generate` | C | `{sectionId, reason: "publish"|"changed"|"admin"}` | **Idempotent.** No-op when `content_hash == generated_hash` (unless reason is admin). Defers itself (`JobDeferredError`) until the module's texts are done. |
| `oyelabs.course.embed` | D | `{courseId}` | Skips when `text_hash` is unchanged |

Who queues what:

- A, on Save & publish:
  - `module_test.generate` for **every** module (C decides what changed);
  - `link.check` for each new or changed video/doc;
  - `text.extract` for each new or changed doc, and for notes/description when their text changed;
  - `transcribe` for each new video;
  - `course.embed` once.
- A, on Save as draft: only `link.check`, so the editor shows statuses. No test generation is spent on drafts.
- B queues `transcode` on upload, and `link.check` from "Check again" and from the daily sweep.

### 3.4 Visibility (one rule)

`server/src/oyelabs/visibility.ts`, `isCourseVisible(course, facts)`: published, and

- assigned to the learner, **or**
- a department rule covers the learner's department, **or**
- `audience = everyone` and the department matches. With `course_departments` rows, the learner's department must be one of them; with none, the legacy `department_id` must be null or equal.

`learnerVisibilityFacts(db, userId)` reads the facts. A wires it into `courses/repo.ts` (`coursesFor`, `mayOpenCourse`; today `mayOpenCourse` ignores departments, which is a bug this fixes). D wires it into `plans/weekly/candidates.ts` (today that ignores departments too).

## 4. Design per phase

### 4.1 Phase 1 (A): editor + course API

- **Page:** Admin → Library → "+ Add Oyelabs course" opens `/admin/library/oyelabs/new`. Editing uses `/admin/library/:courseId/oyelabs`. The library list sends Oyelabs courses there instead of the block editor. It is one page with no wizard, in this order:
  1. Departments (multi-select with "All")
  2. Title, short description, level (4 chips)
  3. Skills: the existing picker + "Suggest" (task `course_skill_suggest`, cached catalog prompt)
  4. Module cards: title, `<VideoLinksField>` (B), `<DocsField>` (B), notes (Tiptap, reusing the `lessonStarterKit` config), `<ModuleTestPanel>` (C, once saved). Modules can be reordered by drag (`@dnd-kit/react`, already a dependency).
  5. Sticky footer: "Save & publish" / "Save as draft" + autosave state ("Saved 10:42").
- **Autosave:** debounced 1.5 s PUT of the whole draft. Survives reloads. On open, "You have unsaved changes from 10:42 — Keep / Discard" when a draft is newer than the course.
- **Save (one transaction):**
  1. Upsert the course (`oyelabs=true`, `audience='everyone'`, `department_id=null`).
  2. Replace `course_departments` and `course_skills`.
  3. For each module: upsert the section (notes, `notes_text` from Tiptap text) and ensure exactly one managed `course_topics` row (`kind='module'`, title = module title, `est_minutes` from durations, ~5 min per doc, +10 for the test).
  4. Upsert `course_videos` / `course_docs` by id, delete removed ones, and write positions.
  5. Remove deleted modules (cascade).
  6. Then `snapshotCourse` (extend the stored version with `oyelabs: OyelabsCourseInput` incl. ids). Set `published_version` on publish, delete the draft, and queue the jobs (§3.3).
- **Progress:** Ids sent back by the editor are reused, so edits never touch `course_progress` / `video_progress` / attempts. Removing a module removes its lesson and therefore that progress; say so in the confirm dialog.
- **Restore** of an Oyelabs version opens it as a draft in the editor. `restoreVersion`'s section/topic restore is not used for Oyelabs courses.
- **Badge:** `LibraryCourse.oyelabs` (v5 admin library), the learner library card and course page (`shared/me.ts` types, `v5/me/library.ts`), and the lesson header. Text: "Oyelabs".

### 4.2 Phase 2 (B): resolver, uploads, players, tracking

- **Resolver** (`server/src/oyelabs/media/resolve.ts`): a pure `parseVideoLink(url)` → kind + provider id + embed/playback URL; then a network `checkSharing(parsed, fetchImpl)` with `credentials: omit`, no cookies, 8 s timeout, redirects followed manually (SSRF guard: refuse private/loopback/link-local IPs after DNS lookup).

  | Kind | Embed / playback | Duration | Sharing check |
  | --- | --- | --- | --- |
  | YouTube | IFrame API (existing) | existing `ensureDataApiDurations` / player | oEmbed 401/403 → private, 404 → not found |
  | Vimeo | Player SDK (`player.vimeo.com/api/player.js`) | oEmbed `duration` | oEmbed 403 → private/domain-restricted, with the fix |
  | Loom | `loom.com/embed/<id>`, estimated | oEmbed `duration` | oEmbed |
  | Google Drive | `drive.google.com/file/d/<id>/preview`, estimated | admin-entered unless thumbnail/metadata gives it | anonymous GET of `/file/d/<id>/view`: a sign-in redirect (accounts.google.com) → private, fix "Share → General access → Anyone with the link → Viewer" |
  | OneDrive / SharePoint | `…/embed?…` form (1drv.ms is expanded by following the redirect), estimated | admin-entered | anonymous GET; login.microsoftonline.com redirect → private, fix "Share → Anyone with the link can view" |
  | Dropbox | `dl=0` → `raw=1` (or `dl.dropboxusercontent.com`), HTML5, exact | probe (ffprobe over HTTP range) | HEAD/GET status + content-type `video/*` |
  | Box | `app.box.com/embed/s/<shared>`, estimated | admin-entered | anonymous GET |
  | Direct (`.mp4 .webm .m3u8`, S3/R2/CDN, presigned) | HTML5; `.m3u8` via hls.js, exact | ffprobe on the URL | HEAD (Range GET fallback), content-type, and the presigned URL's expiry |
  | Upload | `/api/v5/oyelabs/media/:uploadId`, exact | ffprobe at upload | n/a |
  | Any other page | generic iframe, estimated | admin-entered | anonymous GET; `X-Frame-Options`/CSP `frame-ancestors` forbids → `not_embeddable` |

  Fix texts are fixed strings per kind × status in `server/src/oyelabs/media/fixes.ts`.
- **Daily re-check:** `startLinkRecheck` queues `oyelabs.links.recheck` once a minute after boot, then every 24 h. A new break sets `broken_since` and appears in the admin inbox "courses" group as "1 link in *Course* stopped working: *reason*", opening the editor. B writes `brokenLinkInboxItems(db)` in its own file and adds **one line** to `v5/admin/inbox.ts` **after Phase 0 lands** (Phase 0 is editing inbox.ts now). A link that works again clears `broken_since`.
- **Uploads:**
  - `@fastify/multipart` stream (`request.file({ limits: { fileSize } })`) is piped through sha256 into `uploads/tmp/<id>`, then renamed to `uploads/<yyyy>/<mm>/<id>.<ext>`. `file.truncated` → 413 with plain copy.
  - Limits: docs 50 MB (`DOC_UPLOAD_MAX_BYTES`), videos 1 GB (`VIDEO_UPLOAD_MAX_BYTES`).
  - MIME is checked by extension **and** magic bytes (`%PDF`, `PK\x03\x04` for OOXML, the `ftyp` box for MP4/MOV, `1A45DFA3` for WebM/MKV).
  - A sha256 match reuses the existing upload.
  - Rate limit: 30 per minute.
- **Transcode:** not-playable videos (mov/mkv/avi, or mp4 with non-H.264) → `ffmpeg -c:v libx264 -preset veryfast -crf 23 -c:a aac -movflags +faststart`, timeboxed, with status shown on the card. Streaming: `Range` → 206 with `Accept-Ranges`, `Cache-Control: private`.
- **Players** (`src/v5/learner/lesson/oyelabs/`):
  - `ModuleLesson.tsx` renders: the playlist (existing playlist UI patterns and countdown "Next video"; for embeds a "Next video" button), docs (download / open link), notes (read-only Tiptap), then `<ModuleTestStep>` (C).
  - `CourseLesson.tsx` branches to it when `lesson.kind === "module"`.
  - HTML5 player (exact, the same sampling as v4.3: `SAMPLE_INTERVAL_SEC`, max rate 2×, ranges merged server-side by `addPlayedInterval`).
  - Vimeo player (exact via SDK `timeupdate`).
  - Embed player (estimated): a `useActiveTime` hook counts only while `document.visibilityState === "visible"`, the window has focus, and there was input/pointer activity within `ESTIMATED_IDLE_AFTER_SEC`; one sample per `ESTIMATED_SAMPLE_INTERVAL_SEC`.
  - The server caps each sample by wall-clock time since the previous sample and by `ESTIMATED_MAX_SAMPLE_SEC`.
  - "I've watched this" is enabled at 80% of the duration (unknown duration → disabled, with "Ask your admin to add the video's length").
  - Watched = 80% active + confirmed.
- **Lock:** the module test is refused (409 `videos_unwatched`, existing code) until every available entry is watched, honouring `videos.lock_mode` (lock/warn) and the staff/completed exemptions, like v4.3. Broken (`unavailable`) entries do not block.
- **CSP** (`server/src/lib/csp.ts`):
  - `media-src 'self' blob: https:` (direct/Dropbox/R2);
  - `img-src` adds the thumbnail hosts (`i.vimeocdn.com`, `cdn.loom.com`, `*.googleusercontent.com`, `*.dropboxusercontent.com`) or B proxies thumbnails;
  - `script-src` adds `https://player.vimeo.com`;
  - `connect-src https:` only if hls.js is used.
  - `frame-src https:` is already allowed.

### 4.3 Phase 3 (C): text, transcripts, module tests

- **Sources per module:**
  - docs (uploads and links);
  - notes (`notes_text`);
  - the course description (as `description`, shared by every module);
  - video transcripts.
- **Extraction** (`server/src/oyelabs/extract/`): one function per method, each returning `ModulePassage[]` with locators (libraries are in §5).

  | Source | Method | Locator / notes |
  | --- | --- | --- |
  | PDF | `unpdf.extractText` per page | page |
  | Scanned PDF (< 200 chars per page average) | render pages with `unpdf.renderPageAsImage` + `@napi-rs/canvas`, then `tesseract.js` (eng) | at most 40 pages |
  | DOCX | `mammoth.convertToHtml` | section = nearest heading |
  | PPTX | `officeparser` | slide |
  | XLSX | `exceljs` (already a dependency); rows rendered as "Header: value" lines, at most 2,000 rows per sheet | sheet |
  | TXT/MD | as is | headings as sections |
  | Google Docs/Sheets/Slides | export endpoints `/export?format=txt` (docs), `csv` (sheets, per-sheet `gid`), `pdf` (slides → the PDF path) | |
  | Drive files | `uc?export=download&id=` (public only) | |
  | Dropbox | `raw=1` | |
  | OneDrive | `download=1` | |
  | Notion/Confluence/any page | fetch, then `@mozilla/readability` over `linkedom` | headings as sections |

  Every fetch is no-credentials, SSRF-guarded (shared helper from B: `safeFetch`), size-capped at 50 MB and 20 s.
- **Passages:** split on paragraphs at about 800–1,200 chars, without breaking code blocks. Ids are `<doc|vid|note|desc><position>.<n>`, stable for unchanged text. Per-source `content_hash` = sha256 of the input bytes (or the transcript text), so an unchanged source is never re-read.
- **Transcripts:**
  - YouTube: public caption tracks from the watch page's `captionTracks` (no OAuth, no third-party library; best effort).
  - Uploads / direct / Dropbox: ffmpeg extracts mono 16 kHz Opus, in 10-minute chunks → Whisper (`STT_BASE_URL`, the existing v4.4 `HttpSttClient`) → passages with `startSec/endSec`.
  - Drive/OneDrive/Box/Loom/embeds: no transcript. These are recorded as "not used for questions" (the v4.3 wording).
  - Long videos are resumable one chunk per job run.
- **Module test generation** (`server/src/oyelabs/moduleTests/`):
  - Module `content_hash` = sha256 over the sorted per-source hashes.
  - Build a v4.3-compatible `TopicGroundingContent` (passages with `heading = citationLabel`), store it in `topic_grounding` (id = managed lesson id), then call `writeItems` and `runGates` from `server/src/topicTests/` with the module tasks (C may add an **optional** tasks/system parameter to those two functions; defaults unchanged).
  - Prompt: 6–10 items (target 8), about 60% scenario, `hands_on` for code material. Every item cites `{passageId, quote}`, checked by `citationProblem`; the item's `moduleCitation` holds the doc/page/section or timestamp.
  - The system prompt + module passages are the cached prefix (the adapter already sends `cache_control` on the system prompt). Costs are logged by `AiService.recordCall` with `course_id`, target about $0.05 per module (`MODULE_TEST_COST_TARGET_USD`).
  - Items that pass the gates are inserted `active`, and the status is set to `ready` with the summary line. **There is no approval step.**
  - Under `MODULE_TEST_MIN_SOURCE_CHARS` → `needs_content`, with what to add.
  - Regeneration retires (never deletes) the old items, so past attempts and review requests still resolve. `generation` increments. Only modules whose hash moved are regenerated.
- **Admin preview:** list, edit (`editPayload` path), remove (retire), add own (`origin: "admin"`, citation optional), regenerate.
- **Learner test:** served without keys. Grading is per item "Full marks / Not yet", and a pass needs ≥ 80% (`QUIZ_PASS_THRESHOLD`). The attempt goes into `topic_attempts` (`course_id` set) and runs `calibrateAttempt`. **A pass inserts `course_progress`** for the managed lesson, then `syncCertificates` issues the course certificate when it was the last module. C also makes `POST /api/me/courses/topics/:topicId/complete` refuse module lessons ("Pass the module test to finish this module").

### 4.4 Phase 4 (D): manual add, catalog, paths, required

- **Manual add:**
  - The People sheet "Add a course" (`src/v5/admin/people/AddCourse.tsx`) and the onboarding summary get search incl. Oyelabs courses (badge) and a priority picker.
  - Target: this learner / a department (expanded to `course_assignments` rows with `source='department'`) / everyone in a department (`course_department_rules`, with an optional `required`).
  - The legacy `PUT /api/admin/courses/:courseId/assignees` must keep `priority/source` of rows it keeps.
- **Catalog:** an Oyelabs course is in the catalog through `course_skills` + `course_embeddings`.
  - **Embedder:** OpenAI `text-embedding-3-small` when an OpenAI credential is configured. Otherwise a deterministic local hashed-n-gram embedder (`local-hash-v1`, 512 dims), so matching always works offline and in tests. Vectors are compared only within the same `model`.
- **Path builder:** before `libraryCourseFor` / `matchExisting` / `requestCourse` in `builder/run.ts`, an Oyelabs course whose `course_skills` covers the skill (or whose embedding cosine ≥ 0.80 against the skill name + aliases) is taken with source `unlock`. Nothing is generated when one fits. Reason: "Added because it's Oyelabs' own process for white-label projects." This is the course description's first clause, through a reason helper in `shared/pathReasons.ts` (Phase 0's new file).
- **Onboarding suggestions:** `onboardPreview` adds `oyelabsCourses` (embedding of the description vs courses in the learner's department, top 3 ≥ 0.75) with plain reasons, shown in `PlanCard`.
- **Weekly plans:** `candidates.ts` uses `isCourseVisible` (assignments + rules + departments).
  - `priority` maps to lanes: most_important → `do_now`, important → `must_know`, nice_to_have → `low`.
  - **Required rules:** in the learner's first 2 weeks the managed lessons go to `do_now` in module order. If a course skill has unmet prerequisites (skill graph `skill_edges`), the prerequisite items come first, as `must_know` with `dependsOn`. This "respects progression", the same mechanism as v4.3.

## 5. Libraries (checked October 2026; none installed yet)

| Need | Choice | License | Maintained | Notes |
| --- | --- | --- | --- | --- |
| PDF text (+ page render for OCR) | `unpdf` (unjs) | MIT | active (1.x, 2026) | Bundles a serverless pdf.js build; `extractText` per page; `renderPageAsImage` needs a canvas |
| Canvas for page rendering | `@napi-rs/canvas` | MIT | active | Prebuilt binaries incl. linux-x64-gnu (bookworm), no system deps |
| OCR | `tesseract.js` v7 | Apache-2.0 | active (v7 just released) | `eng` data cached under `DATA_DIR/ocr` on first use (the container has internet); worker reused; at most 40 pages |
| DOCX | `mammoth` | BSD-2-Clause | active (1.12) | HTML keeps headings for section locators |
| PPTX (and fallback for odd OOXML) | `officeparser` 6.x | MIT | active (6.1, Apr 2026) | Per-slide text; its own OCR stays off |
| XLSX | `exceljs` | MIT | already a dependency | No new install |
| HTML readability | `@mozilla/readability` + `linkedom` | Apache-2.0 + ISC | readability 0.6 (main active in 2026); linkedom active | linkedom over jsdom: no native deps, far lighter |
| HLS playback | `hls.js` (B, only if `.m3u8` is needed) | Apache-2.0 | active | Video.js is not needed; native `<video>` + hls.js is enough |
| Video probe / transcode / audio for Whisper | Debian `ffmpeg` (apt, runtime stage) | LGPL/GPL binary, invoked as a separate process (no linking) | Debian security updates | **Not in the image today** (runtime stage installs only `ca-certificates curl`; only the whisper container has ffmpeg). B adds `ffmpeg` with `--no-install-recommends` to the runtime stage (roughly +150–250 MB on top of today's ~286 MB). Code checks `ffmpeg -version` at boot and reports "Video conversion isn't available" instead of failing. |
| Transcription | existing Whisper service (`STT_BASE_URL`, v4.4) | n/a | n/a | OpenAI-shaped `/v1/audio/transcriptions`; 10-minute chunks |

Sources:

- [unjs/unpdf](https://github.com/unjs/unpdf)
- [@napi-rs/canvas](https://openapps.pro/packages/napi-rs-canvas)
- [tesseract.js](https://github.com/naptha/tesseract.js), [v7.0.0 release](https://newreleases.io/project/npm/tesseract.js/release/7.0.0)
- [mammoth](https://depscope.dev/pkg/npm/mammoth)
- [officeParser](https://github.com/harshankur/officeParser)
- [Mozilla Readability review](https://thunderbit.com/blog/mozilla-readability-review)
- [linkedom](https://cdn.jsdelivr.net/npm/linkedom@0.18.13/README.md)

## 6. File ownership

**Shared, frozen (the architect's; changes go through DECISIONS.md):**

- `server/src/db/schema.ts` (v4.5 section) and `server/drizzle/0026_*`
- `server/src/oyelabs/routes.ts`, `server/src/oyelabs/jobs.ts`, `server/src/oyelabs/stub.ts` (delete when no stub is left), `server/src/oyelabs/contracts.test.ts`
- The registration lines in `server/src/app.ts` and `server/src/index.ts`
- The job types in `shared/enums.ts`, the AI tasks in `shared/aiRouting.ts`, and `shared/courses.ts` `kind`/`oyelabs`

**A: Phase 1 editor + course API**

- `server/src/oyelabs/editor/**`, including:
  - `repo.ts` (save/version/draft);
  - `minutes.ts`, exporting `moduleMinutes(db, topicId)` for B.
- `server/src/oyelabs/visibility.ts` (owns it from now; keep the rule in §3.4).
- `server/src/courses/repo.ts`: wire visibility into `coursesFor` / `mayOpenCourse`.
- `server/src/v5/admin/library.ts` (`oyelabs` on `LibraryCourse`) and `server/src/v5/admin/versions.ts` (snapshot includes the Oyelabs payload; restore → draft).
- `server/src/v5/me/library.ts` + the library types in `shared/me.ts` (badge, departments).
- `shared/oyelabsCourses.ts` (except the Phase 4 section).
- `src/v5/admin/library/oyelabs/**` (except `media/**` and `test/**`); `src/v5/admin/library/LibraryAdminPage.tsx`; `src/v5/app/V5App.tsx` (the two admin routes).
- `src/v5/learner/library/**` (badge on card and course page).
- Do **not** edit `src/v5/admin/api.ts` (Phase 0 has it open). Put the client calls in `src/v5/admin/library/oyelabs/api.ts`.

**B: Phase 2 resolver + uploads + players + tracking**

- `server/src/oyelabs/media/**`: resolver, fixes, `safeFetch` (exported for C), storage, uploads, stream, tracking, `inboxItems.ts`.
- `shared/videoSources.ts`.
- `server/src/lib/csp.ts`.
- `src/v5/admin/library/oyelabs/media/**` (`VideoLinksField`, `DocsField`, upload widget, preview cards).
- `src/v5/learner/lesson/oyelabs/**` except `ModuleTestStep.tsx`; `src/v5/learner/lesson/CourseLesson.tsx` (branch to `ModuleLesson` for `kind === "module"`).
- `Dockerfile` (ffmpeg), `Caddyfile.example`, `docs/DEPLOY_BRIEF.md` (upload section).
- After Phase 0 lands: one line in `server/src/v5/admin/inbox.ts`.

**C: Phase 3 extraction + transcription + module question generation**

- `server/src/oyelabs/extract/**`, `server/src/oyelabs/moduleTests/**`.
- `shared/moduleTests.ts`.
- `server/src/topicTests/gates.ts` and `generate.ts`: **additive optional parameters only**, defaults unchanged.
- `server/src/ai/adapters/mock.ts` (one dispatch line) + new `server/src/ai/adapters/mockModuleTests.ts`.
- `server/src/routes/me.ts`: the complete route refuses module lessons.
- `src/v5/admin/library/oyelabs/test/**`, `src/v5/learner/lesson/oyelabs/ModuleTestStep.tsx`.
- Test fixtures under `server/src/oyelabs/extract/fixtures/`.

**D: Phase 4 path / catalog / assignment**

- Start now (not Phase 0 files):
  - `server/src/oyelabs/assign/**` (routes, jobs, `embed.ts`, `match.ts`, `suggest.ts`, `weekRules.ts`);
  - the Phase 4 section of `shared/oyelabsCourses.ts`;
  - `src/v5/admin/people/AddCourse.tsx`;
  - `server/src/routes/admin/courses.ts` (assignees PUT keeps priority/source);
  - `server/src/plans/weekly/candidates.ts` and `server/src/plans/weekly/builder.ts` (visibility, priority lanes, required rules in the first 2 weeks with prerequisites first);
  - onboarding: `server/src/goals/preview.ts`, `shared/onboardPreview.ts`, `src/features/admin/setup/PlanCard.tsx` / `QuickOnboard.tsx`.
- **Only after Phase 0 has committed `feat(v4.5-p0)`** (check `git log`):
  - `server/src/builder/run.ts`: one call to `oyelabsCourseFor(db, skill)` from `assign/match.ts` before `libraryCourseFor`, plus the reason;
  - `shared/pathReasons.ts`: an `oyelabsReason(course)` helper;
  - `shared/pathView.ts` / `shared/builder.ts`: an optional `oyelabs` flag on the path item view, if the badge should show there;
  - `src/features/admin/learner/PathTab.tsx` / `PathByPriority.tsx` and `src/v5/learner/plan/PlanTrails.tsx`: badge only.
- **Never** touches:
  - `builder/autoCourse.ts`, `builder/settings.ts`, `builder/providers.ts`, `builder/connection.ts`, `builder/coverage.ts`;
  - `jobs/queue.ts`, `jobs/worker.ts`;
  - the research/AI settings UI.

**Phase 0 (other agent):**

- `server/src/builder/{settings,providers,autoCourse,repo,connection,coverage}.ts`, `server/src/jobs/{queue,worker}.ts`;
- `server/src/routes/admin/{builder,ai,nextAction}.ts`, `server/src/v5/admin/inbox.ts`, `shared/adminInbox.ts`;
- `shared/{builder,pathOrder,pathReasons,pathView,connection,nextAction}.ts`;
- `src/features/admin/**` path/research screens, `src/features/plan/**`, `src/v5/learner/plan/**`, `src/v5/admin/api.ts`, `src/v5/admin/inbox/**`.

If two owners need the same file, the later one adds a single call into a function that lives in their own folder, and notes it in DECISIONS.md.

## 7. Uploads, storage and the proxy

- **Where:** `DATA_DIR/uploads` (production: the `/data` volume, `oyelearn-data`). There is no new volume. Files are stored unencrypted, like the handbook templates; the access check is on the route.
  - The nightly `VACUUM INTO` backup covers only the database, so `docs/DEPLOY_BRIEF.md` must add "copy `/data/uploads` off the host too".
  - Disk budget: one 1 GB video can need 2 GB while transcoding.
  - Orphans (no referencing video/doc for 7 days) are deleted by B's daily job.
- **Limits:**

  | What | Limit |
  | --- | --- |
  | Docs | 50 MB |
  | Videos | 1 GB |
  | Draft and save JSON | 1 MB route `bodyLimit` (the global stays 64 KB) |
  | Multipart (per request, `request.file({ limits })`) | files 1, fields 4; the global 200 KB snapshot default is untouched |

- **Caddy:** Caddy sets **no request-body limit by default**, so 50 MB docs pass the example as it stands. Reverse proxy timeouts are also unlimited by default. B adds an explicit, documented cap to `Caddyfile.example` so a 1 GB upload is a deliberate allowance:

  ```caddy
  @uploads path /api/admin/oyelabs/uploads
  request_body @uploads {
      max_size 1100MB
  }
  ```

  Nothing else is needed (`flush_interval` is irrelevant for uploads).
- **nginx** (the alternative in DEPLOY_BRIEF §5.2) **defaults to 1 MB** (`client_max_body_size`). Without this, every doc upload fails with 413:

  ```nginx
  location /api/admin/oyelabs/uploads {
      client_max_body_size 1100m;
      proxy_request_buffering off;
      proxy_read_timeout 600s;
      proxy_pass http://127.0.0.1:8787;
  }
  ```

  The JSON routes stay under 1 MB.

## 8. Tests each builder adds

All must keep `npx tsc -b`, `npx eslint .` and `npm test` green. Mock AI and injected `fetchImpl` only; no network in tests.

**A**

- `editor.test.ts`: draft autosave round-trip and loose validation.
- Publish creates the course, sections, exactly one managed lesson per module, videos and docs with positions.
- Validation messages are plain (a module without a title; a video without a link or upload).
- Editing keeps lesson, video and doc ids, and existing `course_progress` and `video_progress` rows survive. Version increments; an identical save creates no version.
- Removing a module removes only its lesson.
- Departments: visible for a chosen department, hidden for another, "All" visible to everyone. A draft is invisible. `mayOpenCourse` respects departments.
- Skill suggest (mock).
- The jobs queued per §3.3 (publish vs draft).
- Library `oyelabs` flag.
- Front-end pure tests: editor state, the draft↔input mapping, the dirty/"newer draft" logic.

**B**

- Pure `parseVideoLink` table:
  - YouTube watch/short/shorts/embed/live;
  - Vimeo incl. unlisted hash;
  - Loom share/embed;
  - Drive `file/d/…/view`, `open?id=`;
  - OneDrive `1drv.ms`, SharePoint `:v:`;
  - Dropbox `dl=0`/`dl=1`/`scl`;
  - Box shared;
  - `.mp4/.webm/.m3u8`, S3/R2 presigned;
  - a generic page;
  - garbage.
- Sharing check with injected fetch: private Drive (sign-in redirect) → `private` + the exact fix text; 404; `X-Frame-Options: DENY` → `not_embeddable`; SSRF refusal of `127.0.0.1` / `169.254.169.254`.
- Daily recheck: sets `broken_since` + inbox item; clears it when fixed.
- Uploads: 413 over the limit; 415 for a bad magic; sha dedupe; path traversal refused; Range 206; a learner outside the department → 404.
- Transcode with a fake runner.
- Estimated tracking:
  - wall-clock cap;
  - hidden/unfocused samples ignored;
  - confirm refused under 80%;
  - watched needs both.
- Exact tracking reuses ranges.
- Lock: 409 until watched; `warn` mode; staff exempt; unavailable entries don't block.

**C**

- Extraction fixtures (tiny files committed): 2-page PDF → page locators; scanned PDF → OCR path (mocked tesseract); DOCX headings → sections; PPTX slides; XLSX sheets; MD/TXT; Google export URL mapping; readability on an HTML fixture.
- Stable passage ids; an unchanged hash → no re-extraction.
- Generation (mock):
  - 6–10 items, each with a citation that passes `citationProblem`;
  - gates run;
  - status `ready` with "N questions created from …";
  - `needs_content` path;
  - cost row in `ai_calls` with `course_id`.
- Change one doc in module 2 → only module 2 regenerates; old items retired; an old attempt still reads.
- Admin edit/add/remove.
- Served test has no keys.
- Grading: full/not_yet; 80% pass → `course_progress` → certificate after the last module.
- The tick route refuses a module lesson.

**D**

- Assign learner / department / everyone, with priority.
- A learner who joins the department later sees the rule course (no backfill).
- The legacy assignees PUT keeps priority.
- Required rule → first 2 weeks `do_now` in module order, with a prerequisite first when the skill graph says so.
- Path builder: an Oyelabs course covering a skill is chosen over a generated/library course, and no `course.generate` is queued; the reason is in plain words.
- Local embedder is deterministic; cosine ranking; different models are never compared.
- Onboarding suggestions; search includes Oyelabs courses with the badge.

**Phase 5 Playwright** (`scripts/e2e/v45-oyelabs-course.ts`, alongside the v4.4 e2e script; dev server, mock AI, resolver fetch stubbed by a dev-only env flag that B provides, so the run is offline). Steps:

1. Admin opens Library → "+ Add Oyelabs course", picks *Project Management*, title "White-label delivery", level Intermediate, accepts a suggested skill.
2. Module 1 "Kick-off": pastes a YouTube link and a Drive link (preview cards: one "Plays ✓"; the Drive one is private and shows the fix, then a public one), uploads a 2-page PDF, types notes.
3. Module 2 "Handover": uploads a small MP4, pastes a Google Doc link.
4. Reloads the page mid-way: the autosave restores everything.
5. Save & publish. Both modules reach "N questions created from …" (≥ 6 each), and Preview shows citations ("Process.pdf, page 2").
6. On the People sheet, assigns it to the PM learner as *Most important* and adds "Required for everyone in Project Management".
7. The learner logs in. Today shows the course in Do it now with the Oyelabs badge.
8. Module 1: YouTube is watched (test hook seeks through), and the Drive entry accumulates active time with `page.clock`, then "I've watched this". The test unlocks: fail once (Not yet + sources), then pass.
9. Module 2: the HTML5 video plays to the end, and the test passes.
10. The course certificate appears and verifies at `/verify/:id`.
11. Back as admin: edit the Google Doc link in module 2, Save & publish. Only module 2 shows "Regenerating". The learner's progress and certificate remain.

## 9. Order and handoffs

1. All four builders start now against the stubs. A and B coordinate only through the props of `VideoLinksField` / `DocsField`, and B and C only through `ModuleTestStep` props. All of these stubs are already in the tree.
2. B ships `safeFetch` early (C needs it for link extraction); until then C uses an injected fetch.
3. A ships `moduleMinutes` early (B calls it after a duration resolves).
4. D waits for `feat(v4.5-p0)` before the `builder/run.ts` hook, path reasons and path UI badge. Everything else in §6 D can do now.
5. Gates per phase: tsc, eslint, tests, then `feat(v4.5-p1..p4)` commits (by the coordinator, not the builders).
