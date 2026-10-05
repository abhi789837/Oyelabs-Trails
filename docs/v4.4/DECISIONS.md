
## Phase 3a

Whisper container, transcription, audio storage and retention.

- **Own whisper image, not the upstream one.** `ghcr.io/ggml-org/whisper.cpp:main` is built with
  `GGML_NATIVE=ON` and crashed with SIGILL on the dev CPU (AVX2, no AVX-512). Compose builds
  `scripts/deploy/whisper/Dockerfile`: the same pinned upstream image's source, recompiled with
  `GGML_NATIVE=OFF GGML_BACKEND_DL=ON GGML_CPU_ALL_VARIANTS=ON` (runtime CPU dispatch), copied back
  into the upstream image (which has ffmpeg). Runs as uid 10001, `read_only` with a 256 MB `/tmp`
  tmpfs for `--convert`, model volume mounted read-only.
- **Network:** new `stt_net` with `internal: true` (unlike `code_net`, whisper never needs egress
  after the model is in). Only `oyelearn` and `whisper` are on it; no published port. Verified: the
  app-side network reaches `http://whisper:8080`, whisper cannot reach the internet.
- **Model download:** a `whisper-model` one-shot service (profile `setup`, default network, root,
  same volume) runs `download-model.sh` baked into the image: curl from Hugging Face, SHA-256
  check, idempotent. Wrapped by `scripts/deploy/whisper-model.sh`; `deploy-v4.sh` runs it before
  `up -d`. Without the model the whisper container logs a plain message and restarts every 60 s.
- **Word timestamps:** whisper.cpp's `verbose_json` already includes `segments[].words[]`; no flag
  needed. The client reads both that and OpenAI's top-level `words`, dropping punctuation-only
  tokens and `[_…_]` specials.
- **Filler prompt** is always sent: measured that it brings back an "um" Whisper otherwise drops.
- **STT client** (`server/src/speech/stt.ts`): `STT_BASE_URL` (+ `STT_TIMEOUT_MS`, default 120 s).
  Unset → deterministic `MockSttClient` in dev/test, `unavailable` in production. 4xx from the
  server is not retried; 5xx/429/network/timeout are retried by the job queue (3 attempts, 5 s/10 s
  backoff), and the row becomes `failed` (with `stt_error`) only on the last attempt.
- **One at a time** comes from the existing single-job worker; no extra lock. Trade-off: a
  transcription (seconds, up to 120 s) holds the queue for that long, same as an AI evaluation.
- **Audio at rest:** `sealBuffer`/`openBuffer` in `secretBox.ts`, layout `iv(12) | tag(16) | ct`,
  same master key. Files at `DATA_DIR/audio/<userId>/<id>.bin` (mode 0600), `enc_path` relative to
  `env.audioDir`, resolved with a containment check.
- **Upload checks** (`POST /api/recordings`): multipart field `audio`; codec parameters stripped
  from the mime; allowlist webm/ogg/mp4/mpeg/wav → 415 otherwise; a magic-byte sniff (EBML, OggS,
  RIFF/WAVE, ftyp, ID3/MPEG sync) → 415 for a disguised file; 6 MB per-request multipart limit → 413
  (the global multipart default stays at the 200 KB snapshot size); 20/min keyed by user id.
  Exactly one of `assessmentId+itemId` or `topicId` (query or form fields). Someone else's
  assessment or an item not in it → 404; not `in_progress` → 409; unknown topic → 404. The item's
  kind is not checked yet (the `speak` kind arrives in P3b).
- **Learner never gets audio or the transcript back** from the server: status only. Re-listening
  before submit uses the browser's Blob.
- **Admin access:** `GET /api/admin/recordings/:id` and `/audio` use `requireStaff` (no department
  scoping, same as snapshots). Deleted audio → 410 with a plain message; transcript still served.
- **Retention:** `runAudioRetention` in the daily maintenance (not the `audio.retention` job type
  the schema agent added, which stays unused for now). `app_meta` `audio.retention_days`, default
  30, valid 1–3650; `GET/PUT /api/admin/settings/audio-retention` (superadmin) returns
  `{ days, summary }` with a plain-language sentence.
- **Metrics:** `wpm` over first-word-start → last-word-end; pauses = gaps ≥ 1.0 s, rounded to 0.1 s
  before comparing so the count never disagrees with `longestPauseSec`; fillers = um/uh/er (+umm,
  uhh, erm), like, basically, actually, "you know". Advisory only.

## Phase 1

- **Seed department kind.** `SeedDepartment` (server/src/catalog/seed/types.ts) has `kind?: "role" | "area"`
  (omitted = role); `ensureCatalogSeed` writes it. `Department` (shared/catalog.ts) now always carries
  `kind`. Helpers: `isAreaDepartment(departmentOrId, departments?)` (a row is read by its `kind`; a bare
  id falls back to `KNOWN_AREA_DEPARTMENT_IDS = ["soft"]` unless the departments are passed),
  `skillUsableBy(skill, departmentId, departments?)`, `usableSkills(...)`.
- **`getCatalog(..., { departmentId, withAreas: true })`** also returns the area departments and their
  skills. Used by every learner-side reader (evaluate, personalise/understand, v4 assembly, goal path,
  path builder, setup previews). The admin catalog route is unchanged.
- **Area departments are never a learner's department:** Suggest and `saveSetup` answer 400.
- **Bundles = "Skill groups" in the UI.** Department ids are the real ones (`engineering`, `pm`, `bd`);
  PLAN's `eng` means `engineering`. One row has one department, so "soft-skills-client for PM and BD"
  is two rows: `soft-skills-client` (pm) and `soft-skills-client-bd` (bd).
  - `eng-fullstack-from-frontend`: eng-http, eng-node-runtime, eng-express, eng-rest-api-design, eng-sql,
    eng-auth-sessions-jwt, eng-cors (the frontend↔backend join), eng-paas-deploy, eng-fullstack-delivery.
  - `eng-backend-from-any`: the first seven of the same progression (no CORS / full-stack delivery).
  - `ai-driven-dev`: eng-ai-prompting-for-code, eng-ai-claude-code, eng-ai-context-files,
    eng-ai-reusable-skills, eng-ai-reviewing-diffs, eng-ai-antipatterns (the graph's AI progression).
  - Matching: whole words; the more specific group wins (own department > any; a current-track limit
    > any track), then the longer phrase. So "doing backend" for a frontend developer → the full-stack
    group, as PLAN lists "backend" among its phrases.
  - `ensureBundleSeed` (boot, after the outcome seed) inserts missing ids only; a deleted seed group is
    remembered in `app_meta` `bundles.deleted_seed_ids` so it does not come back. Skill ids are checked
    when a group is used (unknown or unusable ids are not offered) and on every admin save (400).
  - Admin API `GET/POST /api/admin/bundles`, `PUT/DELETE /api/admin/bundles/:id` (staff, audited).
    Page `/admin/skill-groups`, nav "Skill groups" next to "Skill graph".
- **The setup's track is the current role.** With a `current_role` intent, `trackId` is its track
  (frontend in the reference case), so the core skills are that role's basics; the target role is a
  `move_role` goal. The v4.3 test that expected `backend` for "Frontend dev, … doing backend" now
  expects `frontend`. Without a current role, the wanted track is used as before.
- **Goals from intents are `text` goals** (originalText = the exact phrase, outcome = the statement),
  even with one skill, so the phrase is never replaced by a catalog name. `goalInputSchema.skillIds`
  max is 12 (`MAX_GOAL_SKILLS`); goals carry `intentId` (saved in `learner_goals.intent_id`).
- **Coverage check (shared/intents.ts, code only).** Phrases = clauses split on `, ; . \n`, ` + `,
  ` & `, "and also", "also", "and", "but", "plus", "while", with leading filler removed. Content words
  drop articles, pronouns, helpers, generic change verbs (improve, move, learn, become…), experience
  words (year, experience) and weekdays. A phrase is covered when ≥ 2/3 of its content words fall
  inside an intent's quoted span **by position** (so "frontend" in the role does not cover "frontend
  testing" elsewhere). Left-out answers cover their phrase.
- **Unsure.** Options = the 1–2 best catalog candidates (skill groups, skills by name/alias/word
  overlap, cases) with ≥ 1/3 word overlap, plus always **"Leave it out"** (stored as an intent with
  `status: "left_out"`: covers the phrase, makes no goal, carries no promise). A nonsense phrase with no
  candidate therefore has one option. Auto-map (no question) only when one candidate is verbatim in the
  phrase (or covers every word) and nothing ties with it; exact matches score by how much of the phrase
  they span ("Docker Compose" beats the alias "compose"), a case just below a verbatim skill name.
- **Save blocking** lives in `saveSetup` (covers setup PUT, quick onboarding, bulk rows): an open
  Unsure → 400 "We weren't sure what you meant by '…'. Pick an option first." Intents sent with the
  description must also cover it (same message). Intents not sent → kept while the description is
  unchanged, cleared when it changed. `learner_priorities.description` and `.intents` are written.
- **Suggest response** (`onboard_suggest`): `{checklist{current_role, role_move, skill_areas, cases,
  constraints}, intents[], trackId, stackIds, experienceBand, level, hoursPerWeek}`; no `goals` (they
  are built from intents). AI intents are used when at least one survives the checks, else the rules'.
  The mock adds an unknown skill id and an ungrounded quote to every answer; both are dropped.
- **Current role intent skills** = `trackBasics` of its track (the core skills); `intentCoverage` also
  takes `coreSkillIds`.
- **Downstream guarantees.** `planBlueprintMix(..., intents)` → `ensureIntentSlots`: an intent with no
  question takes one from the biggest line (never below 1), keeping 25, 18/7 and MAX_PER_SKILL.
  `planGoalPath` appends the weakest skill of any intent with neither a path item nor a reason, with
  the reason "From the description, "<phrase>": <statement>."; `GoalPathPlan.intents` (lines with
  `reason`, e.g. "Already strong: scored 5/5") is stored in the path audit's `order` step next to the
  per-step reasons.
- **TODO (P2/P5):** in the reference-case test the soft-skills path items are asserted as planned parts;
  whether they become real courses is P2's content and P5's auto courses.
- **Rules fallback** now quotes phrases too: consecutive "now" clauses with role evidence (role words,
  years, a track or stack) form one `current_role` intent (no longer skipped); want/weak clauses map
  through skill groups → cases → named skills → a named track → an area; hours and "in N weeks/months"
  become `constraint` intents. A clause with nothing that matches makes no intent (coverage asks).

## Phase 2

- **Catalog.** `server/src/catalog/seed/softSkills.ts`: department `soft` ("Soft skills", `kind: "area"`,
  `assessmentFormat: "tasks"`, position 3) with one track `soft-every-role` ("Every role"), because the
  catalog requires every skill to sit on a track of its own department. The 10 fixed `ss-*` skills,
  areas Speaking / Writing / Working with people / Ownership, levels beginner→expert (behaviour, not
  years), `isAiSkill: false`, **no `defaultSlider`** (they arrive through goals and bundles). Admin-made
  skills in the area get the `ss-` prefix (`catalog/repo.ts`). `ensureCatalogSeed` already inserts
  missing rows by id, so the live DB gets the department, track and skills at boot.
- **Edges** in `edges.ts` (`SOFT`): the three `ss-spoken-english` prerequisites and the three recommended
  edges from PLAN.md; the prerequisites are also in the skills' own `prerequisites` arrays (deduped by
  `buildSeedEdges`). Graph stays acyclic (seed + graph tests).
- **English levels.** `shared/softSkills.ts`: `englishLevelFor` (0 → below A2, 1 A2, 2 B1, 3 B2, 4–5 C1;
  fractions round, out of range clamps), `skillLevelForEnglish`, `ENGLISH_LEVEL_DESCRIPTORS` (one plain
  summary plus range/accuracy/fluency/interaction/coherence/clarity per level; clarity = listener effort,
  never accent; the framework's name never appears), `SOFT_SKILL_IDS`.
- **Not a learner department.** Pickers filter `kind !== "area"` (QuickOnboard, SetupForm, BulkOnboard,
  so bulk `matchDepartment` never sees it). Server side, P1's `isAreaDepartment` guard in `saveSetup`
  covers it (I removed my duplicate). Filters (people, curriculum, generated courses) still list it.
- **Content: a new trail `soft`** (TrackId/TRACK_IDS, icon `MessagesSquare`, code `SS`, accent
  `alpenglow`, `trailDepartment("soft") = "soft"`). **One camp per skill, one full topic per camp**
  (`soft-*` module ids = skill id with `ss-` → `soft-`; `contentModules` points there). One topic per
  camp because there are exactly two verified videos per skill (primary + alternate); a second topic
  would have reused the same videos. `campsFor` attaches the whole camp, so each skill = one course.
  Certificate: the trail's own (all topics complete), as for PM/BD.
- **Each topic:** primary video + alternate (`alternateVideos`), the two readings from the research note
  (listening has a third, Mind Tools, so a `docs` ref exists), summary written for agency engineers,
  sections "For engineers" / "For PMs and BD" / a worked example or checklist, 9 quiz questions
  (intermediate: ≥2 edge, ≥1 multi), every answer grounded in the summary/sections (topic-test passages).
- **Practice.** `practice` uses existing kinds: write (6: English intro script, angry-email rewrite,
  API in 3 sentences, stand-up script, clarifying questions, SBI PR comment), rank (demo order, busy-day
  priorities), scenario (delay to client, new-team teamwork). `content:check` now requires a practice on
  `soft` topics.
- **Speak spec for Phase 3.** New optional topic field `speak?: SpeakPractice` (`shared/softSkills.ts`
  `speakPracticeSchema`, the PLAN's speak task shape: kind, title, prompt ≤600, audience, prepSec 20,
  maxSec 60–90, lookFor 2–5, writtenFallback, explanation). On 4 topics: spoken English (intro),
  stand-up, client delay, demo. Typed in `Topic` and `AuthoredTopic`; **not served yet**
  (`toServedTopic` ignores it) — P3 wires it and can reuse the schema in `taskSchema`. The written
  `practice` is the fallback that works today. `content:check` validates the spec.
- **Cases.** `server/src/goals/seed/soft.ts`: 25 cases (department `soft`, levels 1–5, every skill
  covered), 10 with topic capstones (the soft topics), 15 with task capstones (10 write, 1 rank,
  4 scenario), all passing `checkTask`. New `listUsableOutcomes(db, dept)` = own department's cases then
  every area's; used by `GET /api/admin/outcomes`, the goal capstone route, `goalPathContext` and the
  goals repo (views, capstone kinds, topic achievement, next-level and gap suggestions). P1's Suggest
  already merges area cases itself, so `listOutcomes` is unchanged.
- **Verification (2026-10-05).** All 20 videos re-checked through oEmbed (and `content:videos`: 0 broken).
  Readings: 19/21 return 200 with a browser UA. British Council LearnEnglish timed out from here and
  Lucid returns 403 (bot wall) to curl; both were loaded in the research pass and kept. `content:embeds`
  gets 403 from rm.coe.int (the CEFR PDF), which loads in a browser. None of the soft readings can be
  framed except hbr.org, ccl.org, GitLab, Scrum Guide and re:Work; the rest use the link card.

## Phase 4

- **Verdict layer.** `shared/scoring.ts`: `verdictFor(input)` takes a discriminated input
  (`unanswered | mcq | code{outcomes,compileError} | task{task,response,raw,met,tip,checkScore}`)
  rather than four positional args, so it can be built from stored rows (`verdictInputFor` in
  `server/src/assessment/scoring.ts`) and the re-score never calls a grader. Returns null while an
  answer waits for its grader. `scoreFor(mode, verdict, raw)`: 0/1 in full mode, raw in partial mode.
  The verdict (Full marks / Not yet) is stored in both modes; only `score` differs.
- **Per kind.** calculate = raw 1 (every field in tolerance); rank = exact or any `acceptOrders`
  (new optional field on rank tasks, checked as full permutations; `gradeTask` also scores an accepted
  order 1); terminal = `TERMINAL_PASS`; other deterministic kinds ≥ `MET_THRESHOLD` 0.8. AI-graded
  (`AI_GRADED_KINDS` plus `speak`, and any kind whose `ai_feedback` JSON has a boolean `met`) = `met`;
  a form also needs its exact checks ≥ 0.8. Rows without `met` (pre-v4.4): rubric share ≥ 0.7
  (`LEGACY_MET_THRESHOLD`; for forms `ai_score/100`, the rubric part).
- **Code tiers.** Bank tests take optional `tier: "core"|"edge"` (all three test schemas); content uses
  `isEdgeCase`. Untiered = core; a key with only edge tests counts every test. Graded code stores
  `tests: [{passed, tier}]` in `ai_feedback` so a re-score needs no re-run; older rows know only
  passed/total and count all as core. `GENERATE_SYSTEM` and `BANK_FILL_SYSTEM` now ask for a tier on
  every test (≥ 2 core); the personalise mock marks its empty-list test edge.
- **Lenient compare.** `looselyEqual` (trim + collapse whitespace, numbers within relative 1e-9 and
  across formats "1,000"/"2.50", token by token inside text, key order ignored, arrays ordered;
  "1,5" is not a number). Used for **program-mode stdout** (Piston), where exactness of spacing and
  number format is never the point. Function and SQL modes keep structural compare (key order already
  ignored); the JS runtime (`runtime.ts`) and the browser runner now compare numbers within 1e-9 like
  `compare.ts`. Strings in function mode stay exact on purpose: trim/whitespace challenges exist.
- **Assessment flow.** `submitItem` → `applyVerdict` (raw_score, score, verdict, verdict_note) and
  bank stats count the stored (verdict) score. `evaluateV4` graders now write `raw_score` and JSON
  `ai_feedback` `{met, reason, tip, ...}`; a generic step 2c applies verdicts to every locked item still
  without one (so P3b's speak step is covered with no special case) and counts it in bank stats (AI-graded
  answers were not counted before). `computeResult`/`levelFrom` unchanged (levels from 0/1 × difficulty).
- **Grader prompts.** `RUBRIC_SYSTEM` is a met/not-yet judge: observations → criteria (kept for partial
  mode) → met → reason → tip, the brief's sentence verbatim (`FULL_MARKS_RULE`), three anchors incl. a
  borderline met. New fields are optional in the schema so an older or partial reply still parses
  (fallback: rubric share ≥ 0.7). Roleplay `SCORE_SYSTEM` gets the same sentence and optional
  `met/reason/tip` (`RoleplayScore` gains them). Mocks: new `rubric_grade` fixture (`mockScoring.ts`:
  covers a rubric line when it shares a content-word stem with it; met at ≥ half the lines, ≥ 5 words),
  roleplay mock returns `met`. The roleplay test whose scripted scorer gives no `met` now expects
  raw 0.5 → Not yet → score 0.
- **Topic tests.** `gradeCode(..., mode)`: in full mode a challenge passes when every core test passes
  (score shown 100), missed edge tests become `notes` (hidden ones described without data). Partial mode
  keeps "every test". Quizzes unchanged. Results now carry `attemptId`, and quiz questions `itemId`
  (the topic test item row) for review requests. Content validation (`topicTests/engine.ts`) still uses
  the strict bar (reference solutions must pass everything).
- **Reviews.** `POST/GET /api/review-requests`, `GET /api/admin/review-requests?status=&userId=`,
  `POST /api/admin/review-requests/:id/decision {override|uphold, note}` (staff). Refs: assessment item
  id; topic test item id + attemptId (quiz); **topic id + attemptId for a code challenge** (no item row
  exists). Only your own Not-yet answer, one open request per (learner, source, ref). Override: item
  full/1/`overridden`, bank `scoreSum += 1 - old`, `recomputeEvaluation` (new evaluations row only when a
  level changed on the learner's latest assessment, which makes the path stale through the existing
  "a newer evaluation" rule; otherwise updated in place), audit `review.overridden`, learner notified.
  Topic override: item `passes + 1` (calibration), attempt re-graded with overridden questions right,
  topic completed if it now passes (goal achievement too). Staff get a `review.requested` notification.
- **Learner UI.** "Request review" on wrong quiz answers and failed code attempts (topic tests), then
  "Review requested". Learners never see assessment items one by one (only levels), so there is no
  learner button for assessment items; the API supports it. Showing past questions would leak bank
  items, so I did not add an item list for learners.
- **Admin UI.** "Review requests" page (`/admin/reviews`, nav under Assessments) and the same list,
  filtered, in a collapsed section of the learner's assessment tab: question, answer, why Not yet,
  **Give full marks** / **Keep "Not yet"** with an optional note. Item list shows Full marks / Not yet.
  Scoring setting: Advanced `<details>` in the assessment settings card (question bank page),
  superadmin only, with "Check past answers again" and the last report in plain words.
- **Re-score.** `scoring.rescore` (`rescoreJob.ts`): batches of 200 by item id, progress in app_meta
  `scoring.rescore.progress` (resumes after a crash; restarts if the mode changed mid-run), pushes
  `{score, mode, at}` (mode = last run's mode, or "legacy" for pre-verdict rows) then re-applies;
  overrides stay full; recomputes touched results; report in `scoring.rescore.report`
  `{items, changed, resultsChanged, topicAttempts: 0, topicChanged: 0, mode, at}`. Topic attempts are
  not re-scored (no per-test record is stored and re-running learner code in bulk isn't worth it).
  Boot enqueues it once (`scoring.rescore.boot_v44` guard, in `index.ts`, not the test harness).
  `PUT /api/admin/settings/scoring` (superadmin, audited) re-queues it on change;
  `GET/POST /api/admin/scoring/rescore` shows / starts it. No bank-stat recompute on re-score.
- **Schema:** no new columns needed.

## Phase 3b

The Speak item, the other soft-skill item kinds, and the Speak grader.

- **`speak` task kind** (`shared/tasks.ts`): PLAN's shape (`prepSec` is the literal 20, `SPEAK_PREP_SEC`;
  audience reuses `SPEAK_AUDIENCES` from `shared/softSkills.ts`). The learner sees everything but
  `explanation`; `lookFor` is shown like a write task's criteria ("A good answer covers"). In
  `AI_GRADED_KINDS`. `gradeTask` → null when there is a recording or typed text (`speakAnswered`),
  **0 for no answer** (unlike write: nothing to wait for). `checkTask`: duplicate lookFor lines.
- **`write.sourceText`** (optional, ≤1500): the "rewrite for tone" original, shown above the answer
  box and in the admin preview; counted in `shapeOf` reading time.
- **Slots.** `SLOT_SUBTYPES` + `speak`; `enforceBlueprint` caps Speak at `MAX_SPEAK_SLOTS = 2` per sheet
  (model proposals included); a third falls to `afterSpeakCap` (the skill's first non-speak kind).
  Speak slots get `SPEAK_SLOT_SEC = 150` and count as hands-on. `defaultHandsOn(skillId, nth)` now
  takes the slot's index so soft skills rotate kinds (`SOFT_SKILL_TASK_KINDS` in softSkills.ts:
  speaking skills speak first; writing = write; explain simply = write `explain`; stand-up/presenting/
  ownership can be rank; feedback/teamwork/listening scenario). `softSubtypeAllowed`: soft skills only
  speak/write/rank/scenario, Speak only for the four speaking skills, never Speak elsewhere.
- **Timing:** `shapeOf` sets `speakSec`; `estimateSeconds` returns exactly 150 for a Speak item.
- **Prompts:** UNDERSTAND and GENERATE list speak with guidance (stand-up, 2-day delay to a client,
  intro + last project, demo opening; lookFor 2–5; writtenFallback). Soft slots carry `soft: true`.
- **Bank across departments.** Soft items live under department `soft`. `activeItems(db, dept,
  otherSkillIds)` also returns other departments' items for the sheet's own skills (pipeline, swap,
  bank assembly). Bank assembly caps Speak at 2 too. Seeds: `server/bank/soft/` (5 files, 9 items:
  4 speak, 2 write incl. one rewrite-for-tone, 1 explain, 1 rank "order the update", 1 scenario),
  validated.
- **Mock:** the plan proposes soft kinds for `ss-*`; the item writer makes valid speak / soft write
  (rewrite, email, explain, review comment) / rank / scenario items for soft slots. The reference case
  yields 1–2 Speak and ≥1 write item (test).
- **Grader** `server/src/speech/grade.ts`, AI task `grade_speak` (Haiku, urgent, 700 tokens), schema
  `speak_grade`, mock `mockSpeak.ts` (by answer length; "NOT YET" forces not met). Calls use purpose
  `grade_written` (no new `AiPurpose`) with task `grade_speak`. Prompt: the brief's full-marks
  sentence, "being understood" as the measure, accent and transcription slips never judged, metrics
  advice-only, observations → 6 criteria 0–3 → met → English level (A2–C1) → reason → tip, three
  anchors incl. a borderline pass. `met` = task, clarity, audience ≥ 2 (model decides). Stored score
  = met ? 1 : rubric fraction (fluency left out for typed answers); `rawScore` the same; aiFeedback
  JSON `{kind:"speak", mode, met, englishLevel, reason, tip, criteria, recordingId?, metrics?,
  usedFallback?, needsListen?}` so Phase 4's verdict layer reads `met`.
- **evaluateV4:** step 1b defers the job (`JobDeferredError` in jobs/queue.ts; the worker calls
  `deferJob`, 15 s; `evaluateJob` rethrows it without failing the sitting) while a Speak recording is
  `pending`, for up to 10 min from the recording's creation. Step 2a `gradeSpeakItems`. The recording
  must belong to the learner, sitting and item. Failed / unavailable / still pending after 10 min →
  "needs a listen": score stays null (pending, not a fail), aiFeedback `needsListen`, and staff get
  `assessment.speak_needs_listen` in plain words. Marking it by hand is Phase 4's override.
- **Upload route** now checks the item is a Speak question (400) and not yet submitted (409); a topic
  upload needs the topic to have a speak practice (400). The 3a tests were adjusted for that.
- **Consent:** `CONSENT_POLICY_VERSION = "2026-10-proctoring-v2-microphone"`; the consent text explains
  the microphone (only on speaking questions, recordings up to 30 days by default, admins only,
  text kept, typing allowed). `MyAssessment.hasSpeak` drives PreFlight's `needsMicrophone`: the mic is
  asked separately after the camera (a "no" never blocks), its track stopped at once, and
  `permissions.microphone` records the real answer.
- **Client:** `SpeakTask.tsx` (`SpeakRecorder`: prompt + audience, 20 s prep with "I'm ready",
  timer + level meter, Stop, listen back, one re-record, upload, "Type your answer instead"; aria-live
  announcements at start / 10 s left / end; reduced motion drops the pulse and meter transition).
  Pure helpers in `speakRecorder.ts` (mime order webm/opus → ogg/opus → mp4, plain mic errors).
  Admin: `SpeakReview.tsx` (player or "Recording deleted after 30 days", what they said, English
  level, met, approximate fluency numbers, "Typed instead of spoken", "Needs a listen"); reason and
  tip in the Feedback box.
- **Topic practice:** `speak` is now served on topics; TopicPage "Say it out loud" section;
  `POST /api/topics/:topicId/speak-feedback` (pending while transcribing; never returns audio or the
  transcript; advice only, never gates completion, like the existing practice).

## Phase 5

Auto courses: a skill no catalog course covers gets a course made, checked and put in the library.

- **Code.** `server/src/builder/autoCourse.ts` (settings, keys, duplicate check, `requestCourse`,
  job `course.generate` handler, `publishToLibrary`, Fix automatically, `libraryResources`);
  tests in `autoCourse.test.ts` (11). Pipeline gained exported `reviewCourse` and `rebuildTopic`;
  `repo.ts` gained `creatingInfo`, `topicContent`, `writeTopicSources`, `persistCourse({extraDetail,
  departmentId})`. No schema change beyond 0024.
- **Auto-publish.** `app_meta` `builder.auto_publish` (absent = on); superadmin
  `GET/PUT /api/admin/builder/settings`; checkbox on AI connection → Research. Effective value =
  `learner_priorities.auto_publish_override` ("on"/"off") else global. Setup → Advanced now shows a
  three-way select (same as everyone / on / off) bound to `advanced.autoPublishOverride` (optional in
  `setupAdvancedSchema`; omitted = keep stored). **Migration choice:** the old `auto_publish` column
  is kept and still saved but read by nothing; every existing learner starts with override null, so
  the global ON applies to all. A stored `false` cannot be told apart from "never touched" (it was
  the NOT NULL default), so honouring it would have kept the old default for everyone.
- **Path item while a course is made.** No new column: `path_items.module_id = "newcourse:<key>"`
  (`NEW_COURSE_ITEM_PREFIX`), key = `skill:<id>` | `case:<id>` | `name:<normalised skill>`.
  `currentPath` renders it as `creating: working | waiting_setup | held | failed`, title = the skill
  name (a held course's title is never shown), never openable. When the course publishes, every item
  with that marker (any learner, any path) gets the `course_id` and the learner an assignment. Weekly
  plan candidates skip marker ids (`isMarkerModuleId`).
- **Duplicates.** Before any job: published library course (`library` or `scope=global`) with the
  same key or same normalised skill → reuse; a held course for the same key → wait on it (no new
  job); then the existing `course_match` AI match; then a word-overlap check (Jaccard ≥ 0.6 on skill
  or title, plurals folded) → reuse; then an active job for the key → join it. One job per key.
  **"Extend" is not done:** adding sections to a library course other learners are mid-way through
  changes it under them; similar courses are reused instead. The key is stored as
  `review_detail.autoKey` (with skillId/caseId), so held and published courses are found again.
- **Cases.** `runBuilder` only produces skill targets (cases are capstones linked to goal pages), so
  the job takes `caseId` (key `case:<id>`) but nothing enqueues one yet.
- **Library.** Published auto courses: `courses.audience=everyone`, `courses.department_id=null`
  (visible to every department, as the brief's "available to everyone"), `generated_courses.library
  = true`, `scope=global`, `department_id` = the skill's department. Shared resources list: new
  `GET /api/me/resources` (every library source once, dead links dropped); no learner UI yet.
- **Waiting for setup.** `requestCourse` enqueues then sets `waiting_setup` with the plain problem in
  `jobs.last_error` ("the AI isn't connected" / "the web search isn't connected"). The handler checks
  again and throws `JobWaitingSetupError` → worker `parkJob` (no attempt counted). Woken by
  `PUT /api/admin/research`, `POST /api/admin/ai/credentials`, `PUT /api/admin/ai/settings`, and a
  5-minute `wakeIfReady` interval in `index.ts` (plus once at boot). The path's `notice` /
  `setupNeeded` is computed from the jobs, not stored, so it disappears on its own;
  `setupNeededMessage` wording: "We couldn't create the course because the web search isn't
  connected. We'll finish automatically after it's set up." with a **Set up** link.
- **Failed review.** `needs_review`, `review_reason` = `plainReviewReason` (weakest of the six checks
  in words, plus "in N lessons"). Hidden from learners. AdminGeneratedPage gets a "Needs a look"
  section (reason, **Fix automatically**, **Edit** → course editor); status label "Needs a look".
  Fix = `POST /api/admin/generated-courses/:id/fix` → `course.generate {mode:"fix"}`: rewrites the
  lessons the review named (all when it named none) with fresh search + link check, re-reviews,
  `fix_attempts+1`, publishes on a pass. Max 2 (400 with a plain message after).
- **Auto-publish off.** A passing course goes `pending_review` (staff told "waiting for your OK"),
  the path item shows held; approving it publishes to the library and resolves waiting learners.
- **Notification** `courses.added`, one per learner per path build, sent when no course for that path
  is still being made; announced course ids are kept in `ai_audit_log` (step `announce`) so a later
  fix announces only its own course. Text from `coursesAddedMessage`.
- **courseCap** still guards: at most `courseCap` new-course requests (new or joined) per run.
- **Soft skills (reference case):** `ss-*` path items attach the `soft-*` content modules via
  `contentModules`; nothing is generated (tested).
- **Changed test:** `run.goals.test.ts` "no gap" now expects the module-less step (code review) on
  the path as a course being made instead of missing from it.

## Phase 6

Plain-language onboarding: the copy guide and its test, Suggest steps, the plan card, the learner
page's status line, hand-marking spoken answers, plain errors.

- **Copy guide** (`docs/v4.4/COPY_GUIDE.md`) and its test (`src/features/admin/copyGuide.test.ts`,
  TypeScript AST, not regex over files). Banned: blueprint, slot, mastery, prerequisite(s) (stricter
  than PLAN's "prerequisite graph", to match the replacement table), topological, intent extraction,
  bank, rubric, calibration/calibrate, token, model, slider value, CEFR, core/edge tests; whole word,
  plurals, case-insensitive; "tokenizer"/"modelling" don't count. "Slider" alone is allowed (it names
  a control the admin sees). Scope: every string/template/JSX text in `src/features/admin/**` (not
  tests), the shared `*_LABELS` maps plus `TASK_DEFAULTS` label/note, `shared/nextAction.ts`, server
  error messages (`badRequest`/`notFound`/`conflict`/...) and `notify({title, body})` in the server
  folders admin screens read. Skipped: imports, keys, types, comparisons, `case` labels, element
  access, class strings (`className`, `cn()`), paths/URLs, identifier-like tokens, and data-ish props
  (`key`, `id`, `queryKey`, `value`, `kind`, ...). `// copy-ok: <reason>` exempts the next line (one
  use: the secrets-file JSON sample on the AI page). Counts: **69 before, 0 after**.
- **Suggest is split for honest ticks.** `POST /api/admin/onboard/suggest` still returns
  `{ suggestion }` (PLAN said `{ suggestion, preview }`); the new `POST /api/admin/onboard/preview`
  (staff, 120/min, no AI, no writes) takes the unsaved setup (`setupSchema` + `step`). The client
  calls suggest → preview `checks` (the mix: `blueprintInputs` + `planBlueprintMix`) → `test`
  (`enforceBlueprint` with the rules' kinds + `withOutcomeSlots`; minutes = sum of question times)
  → `path` (`planGoalPath` via the new `goalPathContextFor(db, setup, null)`), ticking each step on
  its response. "Writing a 30-minute test" is the question plan and timing; the test itself is
  still written after Send, as before. After 10 s the list shows the time so far.
- **Wording rules** (`shared/onboardPreview.ts`, pure): checks are one line per intent in the
  admin's order (current role → "<Track> basics used every day"; move role → "The first steps of
  <most common area> work"; soft-only → "Spoken English (N short recordings), work emails and how
  they handle everyday team situations", from the real speak/write/other counts; others → the
  statement); questions no intent asked for become "<Track> basics" or up to three skill names.
  First steps: "<Track> gaps" first (the test decides them), then one label per intent in path
  order; a skill nobody asked for belongs to the next intent it leads to; at most 4, then "…".
  Reference case: "Frontend gaps → Backend basics → Speaking & writing at work".
- **New courses** = path skills with no available curriculum module and no published library
  equivalent by Phase 5's `libraryCourseFor(courseKey(...))`. In the reference case every soft
  skill has a camp, so the list is empty; the test empties one skill's modules to show the line.
- **Priority drop-down:** Most important = 5, Important = **3**, Nice to have = 2; display maps
  4–5 → Most important, 3 → Important, 1–2 → Nice to have. Important is 3, not 4, because the test
  planner groups 4 and 5 together; with 4, "Important" and "Most important" would plan the same test.
  A change sets the line's goals and intent and re-runs the whole preview.
- **The card** (`setup/PlanCard.tsx`, helpers in `setup/planSummary.ts`): "Here's the plan for
  <first name>" (else "Here's the plan"; never a pronoun), "What they do now" from the current-role
  intent (track + "engineer" for coding departments, "about N years"), numbered wants, checks,
  first steps, new courses, Unsure questions above the button (disabled until answered), "Show
  details" (phrases, skill ids, priorities 1–5, questions per skill). "Change something" opens the
  existing editor below ("Change the plan"; edits re-run the preview after 600 ms). The bottom
  "Save & assign" button is gone: the path is Suggest → Looks good — send the test (2 clicks).
  `IntentList` stays (SetupForm uses it) but quick onboarding no longer shows it.
- **Bulk:** each suggested row has "Show the plan" (the same card, compact, preview fetched when
  opened); a row with an open Unsure opens itself and is blocked (`rowErrors` → `unsure`) until
  answered there. The create button reads "Looks good — send the tests (N)". e2e scripts
  `v43-clicks` and `v43-worked-example` updated to the new labels.
- **Next action:** facts gain `name`, `speakToListen`, `openReviews`, `courses {creating,
  waitingSetup, problem}` (course.generate jobs whose payload `userId` is this learner; joined
  learners are not counted). New kinds `listen` (also while evaluating), `reviews`, `courses-waiting`
  (blocked, button `link` → `/admin/ai`, "Connect it"), `courses-creating` (about 3 min per course,
  polled). Order: listen → reviews before the path; courses after the path exists, before
  suggestions. Existing titles rewritten in plain words ("Test sent · waiting for Rahul", "Test
  done · plan ready", "Send the test", "Build the path"); kinds unchanged.
- **Hand-marking spoken answers:** `POST /api/admin/assessments/:assessmentId/items/:itemId/mark`
  `{mark: "full"|"not_yet", note?}` (staff; speak items only → 400; before hand-in → 409). Full =
  Phase 4 override (`review_status overridden`, score 1); Not yet = `upheld`, score 0; `ai_feedback`
  gets `met`/`markedByHand`/`needsListen: false` so a re-score agrees; bank stats counted (or moved);
  an open review request on the item is closed with the same decision; `recomputeEvaluation`;
  audit `assessment.speak_marked`. UI: "Needs a listen" box at the top of the results
  (`#needs-listen`, player + Full marks / Not yet). The bar's anchors open a collapsed `<details>`.
- **"Already strong" reasons:** `GET /api/admin/users/:userId/gaps` also returns the path's intent
  lines (latest `order` audit step); the Path tab shows "What you asked for": phrase → "On the path"
  or the reason.
- **Plain errors:** `PlainError` + `plainError()` (`src/components/form/`): server messages as they
  are (already plain), network/429/5xx/AI-not-connected rewritten with what to do next, status and
  code only under "Show details". Used in quick onboarding, the onboard page, SetupForm, Setup tab,
  Path tab, the plan card's preview, ListenAndMark, the generated-courses page and research settings;
  the next-action bar's toasts use `plainError().message`.
