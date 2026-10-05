
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
