# v4.5 results: "Add an Oyelabs course"

v4.5 delivered two things:
- **Phase 0:** the "web search isn't connected" fix.
- **Phases 1–4:** Oyelabs' own courses, with videos from any drive, AI questions written from each module's material, and a place in learners' paths.
- **Phase 5:** this file, the tests and the deploy steps.

The detail is in `DECISIONS.md` and the contracts are in `PLAN.md`. The deploy steps are in `DEPLOY.md`.

## Phase 0: "web search isn't connected" when it is

**Root cause.** One rule decided whether a new course could be made, and it needed three saved settings:
1. a search service picked;
2. its key;
3. **a YouTube Data API key.**

Whichever one was missing, the message was always "the web search isn't connected". The AI connection page showed the search key as stored, and the YouTube field never said it was required, so it looked set up. Course jobs parked in `waiting_setup` were woken on save, re-checked against the same rule, and parked again. Missing courses were never made after an assessment.

A second way in: a key saved without clicking a provider card (`provider: null`) gave the same line.

**Fix:**
- One `getResearchProvider()` / `getAIProvider()`, read fresh on every call.
- Only the search service and its key are required. The YouTube key is optional (lessons just have no video).
- A Tavily key saved without a provider is recognised as Tavily.
- The **Test** button runs one real search and reports the status in plain words.
- Blocked jobs are woken on save, on Test and every 10 minutes. Retries back off, and after 5 tries the job shows "Failed: … Retry".
- After an assessment the missing courses are made automatically. The banner says "We added 1 new course…".
- Tavily now sends `Authorization: Bearer` (the current API docs).

**Commands for Abhishek (production, read-only, after `git pull`):**

```bash
# 1. Saved research settings, the newest course jobs, and one real search with the saved key
docker compose exec -T oyelearn node - < scripts/deploy/research-check.cjs
# 2. What the worker logged about course jobs
docker compose logs oyelearn --since 168h | grep -E "course.generate|waiting for setup|new course|re-check"
```

- **Expected before the deploy:** `youtube_key: MISSING` (or `provider: null` with a key saved), and course jobs in `waiting_setup`.
- **Part 3** shows the HTTP status of a real search: 200 means the key is good; 401/403 means rejected; 432/433 means quota; "CAN'T REACH IT" means network.
- **After the deploy:** Admin → AI connection → Research → **Test** says "Connected ✓ — test search returned … results". Waiting courses start at once, or within 10 minutes.

## Supported video sources

| Source | Paste | Player | Tracking | Length | Private-link check and fix |
| --- | --- | --- | --- | --- | --- |
| YouTube | watch, youtu.be, shorts, embed, live | YouTube player | exact | YouTube API / player | oEmbed 401/403 → "Set visibility to Unlisted or Public, allow embedding" |
| Vimeo | vimeo.com/ID (+ unlisted hash), player URL | Vimeo player | exact | oEmbed | oEmbed 403 → "Settings → Privacy → Anyone / private link, allow embedding" |
| Loom | share or embed link | Loom embed | estimated | oEmbed | oEmbed 401/403 → "Anyone with the link can view, no password" |
| Google Drive | `file/d/…/view`, `open?id=` | Drive preview | estimated | typed by the admin | sign-in redirect → "Share → General access → Anyone with the link → Viewer" |
| OneDrive / SharePoint | 1drv.ms (expanded), onedrive.live.com, `:v:` links | embed form | estimated | typed by the admin | Microsoft sign-in redirect → "Anyone with the link can view" |
| Dropbox | `dl=0` / `dl=1` / `scl` links (folders refused) | our HTML5 player (`raw=1`) | exact | probe (ffprobe) or the player | sign-in / 401 / not a video → "Create link, Anyone with the link" |
| Box | `app.box.com/s/…` (file pages refused) | Box embed | estimated | typed by the admin | Box sign-in → "Shared link → People with the link" |
| Direct file | `.mp4`, `.webm`, `.m3u8`, S3/R2/CDN, presigned | our HTML5 player (hls.js for .m3u8) | exact | probe or the player | 401/403, wrong type, **expired presigned link** (caught with no request) |
| Upload | MP4, M4V, WebM, MOV, MKV, AVI up to 1 GB | our HTML5 player (HTTP Range) | exact | ffprobe at upload | n/a. MOV/MKV/AVI and non-H.264 MP4 are converted with ffmpeg |
| Any other page | any https page | iframe | estimated | typed by the admin | sign-in → private; `X-Frame-Options` / `frame-ancestors` → "doesn't allow other sites to show it" |

**How "watched" is decided:**
- **Exact:** 90% of the video actually played. This is the v4.3 rule, and seeking past a part doesn't count it.
- **Estimated:**
  - 80% of the length in **active** time: the tab is visible, the window has focus, and there was input in the last 2 minutes;
  - each sample is capped by the wall clock;
  - plus the learner's "I've watched this" click.

  With no length, the click stays off, and the admin is asked to add the length.

**Rechecks.** Every link is checked again daily. A link that breaks shows in the admin inbox, and a link that works again clears itself.

**Documents read for questions:** PDF (OCR for scanned pages), DOCX, PPTX, XLSX, TXT/MD, Google Docs/Sheets/Slides exports, and public Drive, Dropbox and OneDrive files. Notion, Confluence and other pages are read through Readability.

**Transcripts:** YouTube captions, and Whisper for uploads, Dropbox and direct files (10-minute chunks). Drive, OneDrive, Box, Loom and embeds give no transcript; their questions come from the docs and notes.

## Cost per module (an estimate)

These are **estimates** from `estimateModuleCostUsd` at today's default prices: Sonnet writes the questions, then three Haiku checks run. They have not been measured against a live key yet; the tests use the mock AI.

| Module material | Estimated cost per generation |
| --- | --- |
| 3,000 characters | $0.036 |
| 6,000 characters | $0.039 |
| 12,000 characters | $0.045 |
| 20,000 characters (the cap) | $0.053 |

- A second writing round, when the gates drop too many questions, adds about $0.01–0.02. The material is a cache read.
- The target is about $0.05 per module (`MODULE_TEST_COST_TARGET_USD`).
- Only modules whose material changed are regenerated, so editing one module costs one module.
- The real spend per run is stored in `course_module_tests.cost_micros`, from the `ai_calls` rows with `course_id`.

## Test results (2026-10-07)

| Gate | Result |
| --- | --- |
| `npx tsc -b` | clean |
| `npx eslint .` | clean |
| `npm test` | 203 files, 2,855 passed, 6 skipped |
| `npm run build` | clean |
| `npm run size` | **2 budgets over by about 0.3 KB:** lesson player 200.29 / 200 KB and /design 230.27 / 230 KB. They come from the rebrand agent's in-progress edits to shared entry files (`App.tsx`, `RouteFallback`, `RouteErrorBoundary`, `useDocumentTitle`, the /design brand section), not from v4.5. All other budgets pass. Recheck once the rebrand phases land. |

**End to end,** on a private snapshot of this tree (`p45fin`, removed afterwards). Every script below passed (exit 0):
- `v45-oyelabs-flow`;
- `v45-oyelabs-editor`;
- `v45-video-sources`;
- `v5-admin`;
- `v5-lesson`;
- `v5-design` (incl. "the v5 tokens are not loaded in the old UI");
- `v44-reference-case` (`UI_V5_DEFAULT=off`);
- `v4-departments` (`UI_V5_DEFAULT=off`, Engineering, PM and BD; BD has Part 2 again).

**`v45-oyelabs-flow` (new):**
1. The admin builds a PM course in the real editor:
   - module 1: a Drive video (length typed) and an uploaded PDF SOP;
   - module 2: a Dropbox video, a Google Doc link and notes.
2. Save & publish. Both modules reach Ready with no further clicks, at "8 questions created from 1 doc and your notes". Every question cites its source ("Kick-off SOP.pdf, page 1/2", "Handover checklist", the notes, the course description).
3. The PM learner sees the course in the Library with the Oyelabs badge.
   - Drive: active time counts; "I've watched this" appears only after 80%; the click makes it watched.
   - Dropbox: plays to the end in our HTML5 player (exact).
   - Both tests are passed in the UI, and each answer shows its source.
4. The course certificate is issued, the public check says valid, and `/verify/<id>` shows it.

Everything is offline: the `OYELABS_FETCH_STUB` stub plus Playwright routes, with mock AI.

**Unit and integration coverage for the brief** (file → what it proves):

| What | Where |
| --- | --- |
| The resolver for every source | `media/parse.test.ts` (the full link table) |
| Private-link detection with its plain fix for every source | `media/resolve.test.ts` |
| Drive estimated tracking (80% + confirm, idle/hidden doesn't count, wall-clock cap) | `shared/videoSourcesCore.test.ts`, `media/media.test.ts` |
| Dropbox/direct exact tracking; an uploaded video plays (Range 206) | `media/media.test.ts` |
| Text extraction: PDF (+OCR), DOCX, PPTX, XLSX, MD/TXT, Google Docs export, Readability | `extract/extract.test.ts` |
| Whisper transcription of an uploaded video (10-minute chunks, cited by time) | `moduleTests/moduleTests.test.ts` |
| Gates pass and every item cites its source | `moduleTests/moduleTests.test.ts` |
| In the library with the badge, chosen departments only; drafts invisible | `editor/editor.test.ts` |
| Manual assignment, department-wide required (first 2 weeks, prerequisites first), the path builder preferring Oyelabs courses | `assign/assign.test.ts` |
| Editing one module regenerates only that module's questions | `moduleTests/moduleTests.test.ts` |
| Phase 5 regressions: BD keeps Part 2; the old UI never imports the v5 design | `builder/connection.test.ts`; `v5-design.ts` e2e |

## Needs Abhishek

- **Storage size of `/data/uploads`:**
  - docs up to 50 MB and videos up to 1 GB each;
  - converting a 1 GB video needs about another 1 GB free while it runs;
  - check `df -h` before and after the deploy, and keep at least 5 GB free;
  - orphaned uploads are deleted after 7 days.
- **Backups of `/data/uploads`.** The nightly backup copies only the database. Add the uploads folder to whatever copies backups off the host, e.g. `docker compose cp oyelearn:/data/uploads ./uploads`.
- **ffmpeg image size.** The runtime image now installs Debian's `ffmpeg`, about +150–250 MB on today's ~286 MB. Note the new size (`docker images | grep oyelearn`). The boot log must not say "Video conversion isn't available".
- **nginx body size** (only if the site is behind nginx, not Caddy). Add `client_max_body_size 1100m` (plus `proxy_request_buffering off; proxy_read_timeout 600s;`) on `location /api/admin/oyelabs/uploads`, from `docs/DEPLOY_BRIEF.md` §5.2. Otherwise every upload fails with 413. With Caddy, the `request_body` block in `Caddyfile.example` is optional.
- **Google Workspace sharing for Drive videos.**
  - Our link check is anonymous, so a Drive video shared as "Oyelabs only" looks private to it and shows "This Drive video is private."
  - Either share training videos as "Anyone with the link → Viewer", or upload internal-only videos instead. The editor says so next to the field.
  - If the Workspace admin blocks "Anyone with the link" sharing, uploads are the only option for Drive-hosted videos.
- **After the deploy, run `research-check.cjs`** (the commands above) and press Test on Admin → AI connection → Research. Waiting courses should start within 10 minutes.
- **Deploy steps:** `DEPLOY.md`. Back up to `pre-v4.5-<stamp>.db`, let migration 0026 run, run `deploy-v4.sh`, check Caddy, then run the smoke test on learn.oyegen.com.
- **Tag `v4.5.0`** after the deploy is confirmed (PROGRESS 5.4).
