# v4.4 results

All seven phases are built and tested. The deploy is the one step left, and Abhishek runs it (see **Deploy**).

**Checks on the final commit:**
- lint: clean
- typecheck: clean
- `npm test`: **1,975 passed** (143 files)
- `npm run build`: clean
- **all 8 end-to-end scripts pass:** `v44-reference-case`, `v43-clicks`, `v43-worked-example`, `v43-video`, `v43-trail-visual`, `v42-pm-processes`, `v4-departments`, `v41-personalise`

## What changed

1. **Nothing in the description gets dropped.**
   - Suggest returns every distinct intent, each tied to its exact phrase: current role, role move, area to improve, practical case, or constraint.
   - Broad phrases expand through **skill groups**, which admins can edit at Admin → Skill groups. For example, "full stack" for a frontend developer becomes the backend progression, and "soft skills" becomes the 10 soft skills.
   - A check in code makes sure every phrase is covered. An unclear phrase asks "We weren't sure what you meant by '…'. Pick one:", with near matches plus "Leave it out", and sending is blocked until it's answered.
   - Every intent reaches the test and the path, or gets a reason ("Already strong: scored 5/5").
2. **Soft skills.**
   - A **Soft skills** area that every department can use.
   - **10 skills.** Spoken English is mapped to English levels A2 to C1.
   - **10 courses**, with 20 verified videos, 21 readings, practice by doing and 90 grounded quiz questions.
   - **25 soft-skill practical cases.**
3. **Speak items.**
   - The learner gets 20 s to prepare, speaks for up to 90 s, and can re-record once.
   - Audio is recorded in the browser, stored encrypted, and transcribed by our own **Whisper** container, which isn't reachable from the internet.
   - A Haiku grader gives an English level and Full or Not yet. Accent is never marked down.
   - When there's no microphone, the learner can type the answer instead, and the admin is told.
   - Audio is deleted after 30 days (a setting); transcripts are kept.
   - There are at most 2 Speak items per test, each counting as 2.5 min.
   - Other soft-skill item types: rewrite for tone, explain simply, order the update, scenarios.
4. **Full marks or Not yet.**
   - Every item gets one or the other.
   - Code passes when its main tests pass. A missed edge case only becomes a note.
   - Outputs are compared leniently, and ordering items accept every equally valid order.
   - The AI grader has the "does the job well → full marks" instruction and example answers.
   - Learners can **request a review**, and the admin can give full marks in one click. That recomputes the result, is logged, and feeds the question stats.
   - A background re-score job keeps the old scores in history.
   - "Partial credit" is available under Advanced.
5. **Missing courses are created automatically.**
   - Generation runs in the background, checks the library first so there are no duplicates, and publishes passing courses to the **library for everyone**. Auto-publish is now on by default.
   - Failed courses go to **Needs a look**, with a plain reason and **Fix automatically**.
   - When the web search or AI isn't set up, the work waits and resumes by itself once it is.
   - Admins get one plain notice per learner.
6. **Plain-language onboarding.**
   - `COPY_GUIDE.md`, plus a test that fails on banned words in admin copy. There were 69 before and 0 after.
   - Suggest shows real ticked steps, then the **"Here's the plan for <name>"** card. Priorities are Most important, Important or Nice to have, and technical detail sits behind "Show details".
   - Bulk rows can answer the "not sure" questions.
   - The learner page has a plain status line with one main button.
   - Spoken answers that need a listen can be marked in one click.
   - Errors are in plain words, with codes only under "Show details".

## The reference case

> "frontend engineer with 1 year of experience and also want him to move to the full stack and also improve the soft skills"

**What we understood:**
- **What he does now:** Frontend engineer, about 1 year.
- **Want 1:** become a full-stack developer (Most important).
- **Want 2:** get better at soft skills, including spoken English (Important).

**The test (25 questions, about 30 min):**

| Kind | Count |
|------|-------|
| Multiple choice | 7 |
| Coding | 4 |
| Scenario | 4 |
| Writing | 4 |
| Order | 3 |
| Speak | 2 |
| Spot the issue | 1 |

It checks frontend basics, the first steps of backend work, JavaScript async, spoken English and work emails.

**The first 8 path items**, after a simulated attempt with backend and soft-skill gaps:
1. JavaScript execution context
2. HTTP
3. Node runtime
4. Express
5. REST API design (two modules)
6. SQL
7. Auth

The full-stack steps follow learning order. Seven soft-skill courses follow by priority. Spoken English was skipped because both spoken answers got Full marks.

**Clicks after typing:** 2 (Suggest, then Looks good — send the test).

**Auto-created courses:**
- The e2e removed one skill's course to force a gap. The card listed it as a new course, and the path showed it waiting for the web search.
- Publishing isn't possible inside e2e, because there's no web search and the mock can't write courses. `server/src/builder/autoCourse.test.ts` covers publish, assign, reuse with no duplicate, held then **Fix automatically**, waiting for setup, and the exact notice text.
- On the live site, every reference-case skill is already covered by a course, so nothing would be generated for this case.

## Numbers

**Attempts re-scored: not run yet.** The re-score job runs once by itself after the deploy. Its counts (items, changed, results changed) appear in Admin → Assessment settings → Scoring. The local test databases hold no real attempts.

**Courses auto-created: 0 on the live site so far.** The job only runs when a path needs a skill that nothing covers. The tests above prove the flow.

**Transcription speed on this dev machine** (i5-12500H; container limited to 3 CPUs and 1 GB):

| Clip | Time |
|------|------|
| 30 s | ~4.7 s |
| 75 s | ~9 s (with the filler prompt) |

- In the e2e with real Whisper, evaluation finished 4 s after hand-in.
- **The speed on the VPS hasn't been measured yet** (Needs Abhishek).

## Deploy

The migration `0024_v44_*` only adds tables and columns. The app backs up the database before it migrates, and `deploy-v4.sh` also backs it up first.

On the server:

```bash
cd ~/oyelearn && git pull --ff-only && bash scripts/deploy/deploy-v4.sh
```

What the script does:
- Downloads the Whisper model into its volume and checks its hash. This runs once and is safe to re-run.
- Builds the Whisper image. The first build compiles it, which takes about 4 minutes.
- Starts Whisper on an internal network only.
- Leaves the shared Caddy setup untouched.

Then:
1. Re-run the benchmark (`docs/v4.4/research/whisper-benchmark.md`, one command). If a 75 s clip takes more than about 30 s, raise the CPU limit or use the smaller `base.en-q5_1` model.
2. Smoke-test https://learn.oyegen.com:
   1. Quick-onboard the reference description and check the plan card shows 3 wants.
   2. Send the test, and record a real 30-second spoken answer as the learner.
   3. Check the transcript and English level on the admin results page.
   4. Check that Admin → Assessment settings shows the re-score report.

## Needs Abhishek

1. **Deploy and smoke-test** as above, then push.
2. **Whisper benchmark on the VPS** (see above).
3. **Recordings and admins:** any staff admin can open any learner's recording, the same as proctoring snapshots. Confirm that's acceptable.
4. **Unclear phrases:** a phrase with no overlap with anything in the catalog only offers "Leave it out". Phrases with near matches offer two of them as well.
5. **Duplicate PM skills:** "Excel for PMs" and "Spreadsheets for PMs" are near-duplicates. Consider merging them.
6. **Old auto-publish setting:** existing learners now follow the new global auto-publish default (on). The old per-learner "off" couldn't be told apart from "never set".
7. **Review requests on assessments:** learners can't request a review of individual assessment questions, because they never see the questions one by one and showing them would leak test questions. The API supports it if you want a screen for it.
