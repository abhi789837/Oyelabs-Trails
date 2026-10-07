# v4.5 progress

Resume from the first unticked item. Decisions are in `DECISIONS.md`; contracts are in `PLAN.md`. v5 is in place, so every new screen uses the v5 design system (`src/v5/**`).

## Step 0
- [x] Earlier PROGRESS files finished (v5 9.5 deploy done by Abhishek); tag `pre-v4.5`
- [x] 0.1 PLAN.md: schema, contracts and file ownership for Phases 1–4 (migration 0026); contracts, stubs and `contracts.test.ts` in the tree

## Phase 0: "web search isn't connected" when it is
- [x] 0.a Root cause found and written up
- [x] 0.b One `getResearchProvider()` / `getAIProvider()`; real-search Test with plain status; precise failure states
- [x] 0.c Wake the queue on save/test + 10-minute re-check; retries with backoff; "Failed: … Retry" after 5
- [x] 0.d Auto-generation after an assessment; banner "We added 1 new course…"; header status agrees with banners
- [x] 0.e Path screen: no duplicates ("Needs: … earlier in your path"), grouped and collapsed "Later (N more)", natural reasons, "not assessed" → covered or "Added after the test"
- [x] 0.f Tests; gates (commit `feat(v4.5-p0)` by the main session). tsc -b, eslint, build green; npm test green except the known notify clock test (fixed separately by the main session); v44-reference-case (UI_V5_DEFAULT=off) passes; v5-admin passes except "the lesson kept its video" (course editor, Phase 1 area, not touched by P0)

## Phase 1: "Add an Oyelabs course" page
- [ ] 1.1 Schema and API (departments, level, skills, modules with videos/docs/notes, versions, Oyelabs badge, drafts)
- [ ] 1.2 One-page editor with autosave (v5 admin), skill suggestions, publish/draft
- [ ] 1.3 Gates + commit `feat(v4.5-p1)`

## Phase 2: Videos from any drive
- [ ] 2.1 Link resolver (YouTube, Vimeo, Loom, Drive, OneDrive/SharePoint, Dropbox, Box, direct files, generic embed) + sharing check with plain fixes + daily re-check to the inbox
- [ ] 2.2 Uploads (limits, ffmpeg transcode if needed)
- [ ] 2.3 Players: HTML5 for direct/Dropbox/uploads (exact), embeds with estimated tracking (80% active time + "I've watched this"), playlist/countdown/lock
- [ ] 2.4 Gates + commit `feat(v4.5-p2)`

## Phase 3: AI questions from module content
- [ ] 3.1 Content gathering: PDF/DOCX/PPTX/XLSX/TXT/MD (+ OCR), Google export, readable text, notes; transcripts (YouTube captions, Whisper for reachable files)
- [ ] 3.2 Module test generation with citations, gates, auto-save "Ready", summary, preview/edit/remove/add/regenerate; per-module regeneration on change; cost logged
- [ ] 3.3 Gates + commit `feat(v4.5-p3)`

## Phase 4: Oyelabs courses in paths
- [ ] 4.1 Manual add (learner, department, everyone-in-department incl. new learners) with priority
- [ ] 4.2 Catalog skills + embedding; path builder prefers Oyelabs courses; onboarding suggestions; plain reasons
- [ ] 4.3 "Required for everyone in this department" → Do it now in first weeks, respecting progression
- [ ] 4.4 Gates + commit `feat(v4.5-p4)`

## Phase 5: Tests, deploy and report
- [ ] 5.1 Unit/integration tests per the brief
- [ ] 5.2 Playwright e2e: PM course with 2 modules → questions → learner watches → module test → certificate
- [ ] 5.3 Deploy (Abhishek runs it; upload storage + limits; Caddy body size)
- [ ] 5.4 RESULTS.md + chat summary; tag `v4.5.0`

## Needs Abhishek

### Phase 0: confirm the root cause on production (read-only)
Run from the repo folder on the server, after `git pull` (the script is read from the host, run inside the container):

1. Saved research settings, the newest course jobs, and one real search with the saved key:
   ```
   docker compose exec -T oyelearn node - < scripts/deploy/research-check.cjs
   ```
   Expected: `youtube_key: MISSING` (or `provider: null` with a search key saved), and the course jobs in `waiting_setup` with "the web search isn't connected". Part 3 shows the HTTP status of a real search with the saved key (200 = key good; 401/403 = rejected; 432/433 = quota; "CAN'T REACH IT" = network/firewall).
2. What the worker logged about course jobs:
   ```
   docker compose logs oyelearn --since 168h | grep -E "course.generate|waiting for setup|new course|re-check"
   ```
3. After deploying v4.5 P0: Admin → AI connection → Research → **Test**. It should say "Connected ✓ — test search returned 5 results…". Priyanka's waiting course starts at once (or within 10 minutes). No YouTube key is needed any more; add one only if lessons should get videos.

