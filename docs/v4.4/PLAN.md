# v4.4 plan and shared contracts

The one map every phase agent shares. Read the brief's summary in `PROGRESS.md`, the code map in `CODEMAP.md`, and the research in `research/`. Record your own decisions in `DECISIONS.md`, appending under your phase heading. Never rewrite another phase's entries.

## Rules for every agent
- **Migrations:** the main session made migration `0024_v44_*` from the schema below. Don't run `drizzle-kit generate`. If you need a column that isn't listed, add it to `schema.ts` and record it under "Schema requests" in `DECISIONS.md`. The main session then makes `0025`.
- **AI calls:**
  - Every new AI task goes in `shared/aiRouting.ts` (`AI_TASKS`, `TASK_DEFAULTS`) with Haiku as the default.
  - Every new AI task has a deterministic mock fixture, dispatched by `schemaName`.
  - Every new AI task has a rules or code fallback when AI is off.
- **Admin copy:** follow `COPY_GUIDE.md`. It's written in Phase 6, but the banned words below apply now: blueprint, slot, mastery, prerequisite graph, topological, intent extraction, bank, rubric, calibration, token, model, slider value, CEFR (say "English level"), core/edge tests.
- **Tests:** add tests next to the code. Keep the existing 1,775 tests green. `npm run lint`, `npm run typecheck` and `npm test` must pass before you report back.
- **Don't commit.** The main session commits per phase.

## The reference case
> "frontend engineer with 1 year of experience and also want him to move to the full stack and also improve the soft skills"

The department is Engineering, and the expected intents are:

| # | Type | Phrase | Meaning | Skills | Priority |
|---|------|--------|---------|--------|----------|
| 1 | `current_role` | "frontend engineer with 1 year of experience" | Frontend, 1–2 years | Core: frontend track basics | — |
| 2 | `move_role` | "move to the full stack" | Bundle `eng-fullstack-from-frontend` | — | High (4) |
| 3 | `improve_area` | "improve the soft skills" | Bundle `soft-skills-engineer` | The 10 `ss-*` skills | Important (3) by default, ranked below the role move |

## Soft skills (Phase 2): skill ids are fixed now

- **The department.** A new department with id `soft` and name "Soft skills" has `kind: "area"` (a new column on `departments`, default `"role"`). An area department is never chosen as a learner's department. Its skills can be used by a learner in **any** department: goals, the test, path and courses.
- **The helper.** `shared/catalog.ts` gets `isAreaDepartment(id)` and `skillUsableBy(skill, departmentId)`, which is true when the skill is from the same department or from an area department. Use it in `validateGoals`, `blueprintInputs` probes, `searchSkills` for pickers, `catalogPrompt` and the rules.

| id | Name | Levels |
|----|------|--------|
| `ss-spoken-english` | Spoken English at work | levelMin 1, levelMax 5. Mapping to English levels: 1 = A2, 2 = B1, 3 = B2, 4 = C1, 5 = C1+ |
| `ss-workplace-writing` | Workplace writing (email, chat, docs) | |
| `ss-explain-simply` | Explaining technical work simply | |
| `ss-standup-updates` | Stand-ups and status updates | |
| `ss-client-team-communication` | Client and team communication | |
| `ss-listening-questions` | Listening and asking good questions | |
| `ss-presenting-demoing` | Presenting and demoing | |
| `ss-ownership-time` | Ownership and time management | |
| `ss-feedback` | Giving and receiving feedback | |
| `ss-teamwork` | Teamwork and collaboration | |

- **Graph edges, seeded:**
  - `ss-spoken-english` → `ss-standup-updates`, `ss-presenting-demoing`, `ss-client-team-communication` (prerequisite)
  - `ss-workplace-writing` → `ss-client-team-communication` (recommended)
  - `ss-listening-questions` → `ss-client-team-communication` (recommended)
  - `ss-explain-simply` → `ss-presenting-demoing` (recommended)
- **`englishLevelFor(level0to5)`** in `shared/softSkills.ts` returns "below A2" | "A2" | "B1" | "B2" | "C1". The UI says "English level", never "CEFR".

## Bundles (Phase 1): table `skill_bundles`, editable by admins

```ts
SkillBundle {
  id: string;                 // "eng-fullstack-from-frontend"
  name: string;               // "Full-stack developer"
  departmentId: string | null;// null = any department
  fromTrackIds: string[];     // [] = any current track; ["frontend"] = only when the current role is frontend
  phrases: string[];          // lower-case triggers: "full stack", "full-stack", "fullstack"
  skillIds: string[];         // ordered; the graph still decides the final order
  targetLevel: 1..5;
  active: boolean;
}
```

Seeded bundles:
- `eng-fullstack-from-frontend`:
  - phrases: full stack / full-stack / fullstack / backend
  - from the frontend track
  - skills: the existing backend progression (HTTP → Node runtime → Express → SQL → auth → deploy, plus the connecting-frontend-and-backend skill if one exists). Use the real `eng-*` ids from the catalog.
- `eng-backend-from-any`: the same progression, for "backend".
- `soft-skills-engineer`:
  - phrases: soft skills, communication, communication skills, people skills
  - department `eng`
  - all 10 `ss-*`
- `soft-skills-client`: the same list, for PM and BD (client examples).
- `spoken-english`:
  - phrases: english, spoken english, speaking, fluency
  - any department
  - skills: `ss-spoken-english`, `ss-standup-updates`
- `ai-driven-dev`:
  - phrases: ai-driven, ai driven, claude code, ai coding
  - `eng`
  - the existing AI progression ids

## Intents (Phase 1): `shared/intents.ts`

```ts
INTENT_TYPES = ["current_role", "move_role", "improve_area", "case", "constraint"]
Intent {
  id: string;            // "i1", "i2", … (stable within one description)
  phrase: string;        // EXACT substring of the description (checked in code)
  type: IntentType;
  statement: string;     // plain English: "Become a full-stack developer"
  skillIds: string[];    // catalog ids, may include ss-*; [] only for constraint
  bundleId?: string;
  caseId?: string;
  targetLevel: 1..5;
  slider: 1..5;          // suggested priority; current_role and constraint use 0 (none)
  trackId?: string;      // current_role: the job track; move_role: the target track
  years?: number;        // current_role
  constraint?: { hoursPerWeek?: number; deadlineWeeks?: number };
}
Unsure { phrase: string; options: { label: string; skillIds: string[]; bundleId?: string }[] /* 2–3 */ }
coverageCheck(description, intents) → { uncovered: string[] }   // code, not AI
```

`coverageCheck` splits the description into meaningful phrases, using clauses split on `,` `;` `.` `and also` `also` `and` `but` `plus` `+`, with filler words removed ("want him to", "I want", "should", articles). A phrase is covered when it overlaps (by token) the `phrase` of an intent whose status is mapped. Each uncovered phrase is either:
- mapped to the closest catalog item, through a bundle phrase, skill alias or `searchSkills`, with score ≥ threshold, giving a `mapped` intent marked `autoMapped: true`; or
- turned into an `Unsure` with 2–3 options.

`OnboardSuggestion` gains `intents: Intent[]` and `unsure: Unsure[]`. Goals are built from the intents:
- `move_role` and `improve_area` → one `text` goal each, with `originalText` = the phrase, `outcome` = the statement and `skillIds` = the bundle's skills (`goalInputSchema` allows up to 6 skill ids, so raise the limit to 12 for bundle goals);
- `case` → a `case` goal;
- `current_role` → the track, experience and core skills, not a goal;
- `constraint` → hours or deadline.

`learner_goals` gains `intent_id` (nullable). The saved intents go in `learner_priorities.intents` (JSON), with `description`.

**Save is blocked** while `unsure.length > 0`, enforced both server-side (400 with a plain message) and client-side.

**Downstream guarantees** (`shared/intents.ts` `intentCoverage(intents, blueprintSkills, pathSkills, mastery)`):
- every non-constraint intent has ≥ 1 assessment slot on one of its skills (`current_role` → core skills);
- every non-constraint intent has ≥ 1 path item, or a reason ("Already strong: scored 5/5").

These are enforced in `blueprintInputs` and `planGoalPath`, and covered by a test on the reference case.

## Speak (Phase 3)

The new task kind is `speak`:

```ts
{ kind: "speak", title, prompt (≤600), audience: "team"|"client"|"manager"|"interview",
  prepSec: 20, maxSec: 60..90, lookFor: string[] (2–5, what a good answer covers),
  writtenFallback: string (the same task as a written prompt), explanation }
```

- **Response:** `{ kind: "speak", recordingId?: string, durationSec?: number, fallbackText?: string, usedFallback: boolean, reRecorded: boolean }`.
- **Table `audio_recordings`:** id, userId, assessmentId (nullable), itemId (nullable), topicId (nullable, for practice), mime, bytes, durationSec, encPath (relative to `DATA_DIR/audio`), transcript (nullable), words (JSON, nullable: [{w,start,end}]), metrics (JSON, nullable: {wpm, pauses, longestPauseSec, fillers}), sttStatus ("pending"|"done"|"failed"|"unavailable"), createdAt, audioDeletedAt (nullable).
- **Storage:** audio is encrypted with AES-256-GCM (a Buffer variant of `secretBox`) and served only to admins. Learners can re-listen only before submitting.
- **Transcription:**
  - env `STT_BASE_URL` (default `http://whisper:8080` in compose; unset in dev means a mock transcript), an OpenAI-shaped `/v1/audio/transcriptions` call with `verbose_json`
  - job `speech.transcribe`, rate-limited to one at a time
- **Grading:**
  - AI task `grade_speak` (Haiku) with an English-level rubric
  - returns `{ met: boolean, englishLevel: "A2"|"B1"|"B2"|"C1", reason (one line), tip (one line), criteria: {task, clarity, range, accuracy, fluency, audience} each 0–3 }`
  - accent is never penalised
- **Mic fallback:** when there's no mic, the learner types the answer to `writtenFallback`, which is graded with the same grader in text mode and flagged for the admin.
- **Timing:** a Speak item counts as 150 s, with at most 2 per assessment (`enforceBlueprint`). It counts as hands-on.
- **Retention:** `app_meta` key `audio.retention_days` (default 30). A daily job deletes audio files older than that and sets `audioDeletedAt`. Transcripts are kept.
- **Consent:** `CONSENT_POLICY_VERSION` is bumped. The consent text covers the mic. The camera step requests audio too, but only when the assessment has a Speak item. If audio is denied, the session continues with the written fallback.

## Scoring (Phase 4)

- **Setting:** `app_meta` key `scoring.mode`: `"full"` (the default) | `"partial"`.
- **`shared/scoring.ts`** has `verdictFor(kind, item, response, raw) → { full: boolean, score: 0|1, note?: string }`:
  - MCQ: correct
  - code: all **core** tests pass. A test is core unless it's marked `edge` (the content's `isEdgeCase`, or bank `tests[].tier`). Failed edge tests become the note.
  - deterministic tasks: raw ≥ `MET_THRESHOLD` (0.8). `rank` accepts any order listed in `acceptOrders`.
  - AI-graded tasks: the grader's `met`
- **Grader prompts** must include the brief's sentence: *if the answer does the job well, give full marks; don't deduct for style differences, alternative valid approaches, or minor slips that don't affect the result.*
- **`assessment_items` new columns:** `raw_score` (real), `verdict` ("full"|"not_yet"|null), `verdict_note`, `score_history` (JSON array of {score, mode, at}), `review_status` (null|"requested"|"upheld"|"overridden"), `review_note`, `reviewed_by`, `reviewed_at`.
- **Table `review_requests`:** id, userId, source ("assessment_item"|"topic_item"), refId, attemptId (nullable), status, learnerNote, createdAt, resolvedBy, resolvedAt, resolution. Overrides go in the audit log and feed calibration (an override counts as a pass).
- **Re-score:** job `scoring.rescore` (resumable). It pushes the old score into `score_history`, recomputes, and writes the counts to `app_meta` `scoring.rescore.report`.

## Auto courses (Phase 5)

- **Settings:** global `app_meta` `builder.auto_publish` defaults to **true**. The per-learner `autoPublish` stays as an override (null means use the global setting). `generated_courses` gains `library` (boolean: visible to everyone) and `department_id`.
- **Job `course.generate`:** {userId, skillId or caseId, reason}. When AI or research isn't set up, the job waits in `waiting_setup` status. Saving AI or research settings wakes every waiting job.
- **Failed reviews:** a course that fails review goes to "Needs a look", with a plain reason and **Fix automatically**, which regenerates the failed parts.
- **Notification kind:** `courses.added`, in plain text.

## Plain language (Phase 6)
- Files: `docs/v4.4/COPY_GUIDE.md` and the test `src/features/admin/copyGuide.test.ts`. The test scans string literals and JSX text in `src/features/admin/**` and the shared label maps. A per-line `// copy-ok: <reason>` comment exempts the next line, for model ids shown as data inside "Show details".
- Suggest runs as steps: `POST /api/admin/onboard/suggest` returns `{ suggestion, preview }`, where `preview` = { testChecks: string[], firstSteps: string[], newCourses: string[] }. The client shows the 4 ticked steps while it works.

## Agent waves
1. **Schema (main session):** `0024` with everything above.
2. **Wave A (parallel):**
   - P1: intents, bundles, coverage and Suggest
   - P2: the soft-skills catalog, courses and cases; content seeding runs in sub-batches
   - P3a: the Whisper container, transcription, audio storage, retention
3. **Wave B:**
   - P3b: the Speak item and other soft-skill item kinds, plus the grader
   - P4: scoring, which shares `evaluateV4` with P3b, so it runs after P3b
4. **Wave C:**
   - P5: auto courses
   - P6: plain language and the summary card, which builds on P1's preview
5. **P7:** tests, the e2e script and the report.
