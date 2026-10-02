# Oyelearn v4 — results

## AI tokens and cost: before and after (Phase 6)

**Method.** No real-provider usage exists in any database available to this build (every recorded
call is the mock), so both columns are computed the same way: measured prompt templates plus typical
injected context, priced with the list prices fetched on 2026-10-02 (Haiku 4.5 $1/$5, Sonnet 5.5
$2/$10, Opus 5.5 $4/$20 per million tokens; batches −50%; cache reads 0.1× input). Every v4 call is
now logged with its task, tokens, cache tokens and cost, so **Admin → AI usage** will show real numbers
from the first day a credential is used. Before = `AUDIT.md` baseline.

| Operation | Before: calls · tokens in/out · model | Before $ | After: calls · model | After $ |
| --- | --- | --- | --- | --- |
| Assessment generated | 13 · 48k / 37k · Sonnet | **$0.47** | **0** — assembled from the question bank by code | **$0.00** |
| Thin skill topped up (once, for everyone) | — | — | 1 batch call · ~3k / ~8k · Sonnet 5.5 via Batch API | ~$0.04 per skill/type, amortised over every later sitting |
| Assessment graded — engineering | 2 · 21k / 5.6k · Opus | **$0.20** | **0** — hidden tests + answer key | **$0.00** |
| Assessment graded — PM/BD | (same as above) | $0.20 | only written tasks: ≤ 4 × (~700 / ~120) · Haiku 4.5 | **≈ $0.005** |
| Path build: gap analysis | 1 · 7k / 1.5k · Sonnet | $0.03 | **0** — read off the v4 report by skill | $0.00 |
| Path build: course matching | 3 · 1.2k / 0.2k · Sonnet | $0.01 | 0 when a catalog module or saved course fits (D7); else Haiku | ≤ $0.002 |
| Course actually generated | 14 · 25k / 33k · Sonnet (+ review on Sonnet) | **$0.38** | 14 · same shape · Sonnet 5.5 writing, Opus 5.5 review, capped outputs, cached system prompts | ≈ $0.39 |
| Weekly plan refine | 1 · 4.4k / 1.2k · Sonnet | $0.02 | 1 · Haiku 4.5, 2k output cap | **$0.01** |

**Typical onboarding** (one assessment, its grading, a path with three courses):

- **Before:** $0.47 + $0.20 + $0.04 + 3 × $0.38 ≈ **$1.85**, ~250k tokens, every time.
- **After, engineering learner whose priorities have catalog modules:** $0 + $0 + $0 + 0 generated
  courses ≈ **$0.00–$0.01**.
- **After, a priority with no module and no saved course:** + ≈ $0.39 for that one course, once —
  "Save to library" then makes it free for the next learner with the same skill.
- **After, PM/BD learner:** ≈ **$0.005** (written-task rubrics) — both departments now have full
  four-level curricula, so their paths attach modules rather than generating.

**What did not get cheaper, honestly:** the cost of a course that really has to be written is about
the same (~$0.39): output tokens dominate and Sonnet 5.5 at $10/M is only modestly cheaper than the
old Sonnet, while the final review moved to Opus as the brief asks. The saving on courses comes from
generating far fewer of them. Lesson writing is not yet on the Batch API (bank fills are); moving it
there would halve that figure and is the next lever (noted in PROGRESS).

**Controls now in place:** a model and output cap per task (Admin → AI connection → Model routing);
models checked against the account's live model list with a Sonnet 5.5 fallback; cached system
prompts; the Message Batches API for bank fills; a monthly budget with an 80% warning and a 100%
pause of non-urgent jobs (deferred, not failed); spend per day, task and learner, and average cost
per assessment and per generated course on Admin → AI usage.

## What was built, phase by phase

| Phase | Commit | What landed |
| --- | --- | --- |
| 1 Audit & plan | `594fc02` | `AUDIT*.md`, `RESEARCH*.md`, `PLAN.md`, token baseline; Piston chosen and run locally (Judge0 needs cgroup v1) |
| 2 Departments | `5d7cd7c` | `departments`, `tracks`, `stacks`, `skills` (433 skills), course level + department, `/admin/departments`, department filters, learners moved to Engineering |
| 3 Setup | `2e07093` | One Setup screen (department → track → stacks → experience/level → skill picker with 1–5 sliders → skip → hours → sticky summary), tabs Setup · Assessment · Path · Library · Progress · Account, results-only Path tab, slider/skip tables as the single source |
| 4 Assessment | `0a1efca` | ≤25 items (18 hands-on + 7 MCQ), one sheet, free navigation, 50-min hard stop, optional minimum before Finish, "I don't know yet", Monaco + server-counted Run ×3 (third submits), hidden-test grading (isolated-vm / Piston), runnable MCQ snippets, proctoring whitelist for the editor, report by skill |
| 5 Question bank | `8b32b73` | `question_bank`, deterministic assembler, validated seed, `/admin/question-bank`, gap fill (Batch API), nightly stats + auto-retire |
| 6 AI cost | `315a158` | Router with a model + cap per task, live model list with fallback, prompt caching, Message Batches, cost logging, monthly budget (80% warn / 100% defer), Admin → AI usage |
| 7 PM & BD | `ce30301` | Two trails × 4 levels + an AI camp each (89 topics, verified sources), task components, bank items for every PM/BD skill |
| 8 Paths | `b20f443` | Part 1 / Part 2 / priorities for every department, gaps from the v4 report, catalog modules and saved courses attach without a model |
| 9 Users | `18f8b2b` | Bulk actions, typed bulk delete, anonymised deletion audit, sessions revoked on every action |
| 10 Ship | `67c5f18`, `c637a2b` | Migration rehearsal (test + script), faster test harness, 0.9 GB image, compose with the Piston sidecar, deploy + Piston install scripts, smoke test, e2e per department |

## Curriculum and bank (from `CURRICULUM.md`)

- **Engineering:** 270 skills, 7 trails / 67 camps / 715 topics; **1,950** active bank items (853 coding, 448 tasks, 649 MCQs) covering 54 core and major-stack skills at difficulties 1–4. The other 216 skills are thin: their questions go to the next skill and a one-off gap fill is queued (needs an AI credential).
- **Project Management:** 85 skills, 5 camps / 43 topics; **775** items; every skill covered.
- **Business Development:** 78 skills, 5 camps / 39 topics; **707** items; 77 of 78 skills covered.

## Tests

- `npx vitest run`: **75 files, 1,033 tests, all passing** (46 s). `tsc -b` and `eslint .` clean.
  Includes the priority rule (v3 + v4 cases), assembly (25 items, 18 + 7, weighting, own stack only,
  no repeats, determinism), the 3-run limit and auto-submit, the 50-minute deadline and free
  navigation, the proctoring whitelist, the multi-language runner (Python/PHP/Java/SQL/TS, network
  blocked, timeouts), PM/BD task graders, the AI router (task → model, `cache_control`, cost, budget
  pause and deferral), migrations on a v3 database, and user-deletion cleanup.
- **Piston note:** the Java case can time out while other processes hammer the local runner; it
  passes on its own, and production runs retry a run that timed out with no output.
- **Playwright e2e** (`scripts/e2e/v4-departments.ts`): **PASS** for Engineering, PM and BD —
  onboard through the Setup UI with three sliders, take the sheet (two runs on one problem, three on
  another with auto-submit, an MCQ answered after running its snippet; PM/BD tasks), Finish, then the
  Path opens with Part 1 and Part 2 and every High/Critical priority has a module. Consent/start go
  through the API in headless runs because Chromium's fake camera shows no face.

## Verification

- **Migration rehearsal on the real pre-v4 database** (`data/backups/oyelearn-2026-09-29T08-24-57-858Z.db`,
  13 migrations, 5 users incl. rakesh): 18 migrations after, **no personal table lost a row**, all 4
  learners in Engineering, targets carried into slider rows. Command: `npx tsx scripts/v4/rehearse-migration.ts <db>`.
- **Production image, run locally** with Piston attached: boots with isolated-vm, 9 trails / 797
  topics; `scripts/v4/smoke.ts` passes every check (catalog 433 skills, 3,432 active bank items,
  setup + assign → ready, 25-item sheet with 7 MCQs, Python graded in Piston, Finish → report with
  no raw score for the learner).
- **learn.oyegen.com:** not deployed from here — see "Needs Abhishek".

## Needs Abhishek

1. **Deploy.** This machine has no SSH access to 169.58.125.156. On the server, in the app folder:
   `./scripts/deploy/deploy-v4.sh` (checks cgroup v2, backs up the DB to the volume and to `./backups/`,
   pulls, builds, restarts — migrations run at boot — installs the code-runner languages once, smoke
   tests). It does not touch the shared Caddyfile. Then `SMOKE_URL=https://learn.oyegen.com SMOKE_PASSWORD=… npx tsx scripts/v4/smoke.ts`
   from any machine with the repo.
2. **Piston is a privileged container.** Required by its sandbox; it has no published port and sits
   on an internal network. Accept the risk or tell me to look at an alternative.
3. **Rebuild existing paths** after the deploy: People → … → Rebuild all paths (superadmin), or
   `POST /api/admin/paths/rebuild-all`. Progress, attempts and certificates are untouched. rakesh and
   abhishek will get Part 1 / Part 2 / their priorities under the new rules.
4. **AI credential + budget.** Add an Anthropic API key under Admin → AI connection (the model list is
   read from it automatically), and set a monthly budget on Admin → AI usage. Without a key: v4
   assessments, grading of everything except written PM/BD tasks, paths and catalog matching all
   work; written tasks wait for a rubric, gap fills and course generation wait.
5. **Haiku 4.5 may retire from 2026-10-15.** The router falls back to Sonnet 5.5 automatically; pick a
   newer Haiku on Model routing when one is listed.
6. **Oyelabs facts.** The BD "agency services" topic has a marked placeholder for your current service
   lines, case studies and white-label products — fill it in from the course editor or the content file.
7. **Thin engineering skills** (216): fine to leave to on-demand gap fills once a key is set, or ask
   for more seed files.
8. Local dev passwords were reset by the build agents (admin is `Trail-Shots-v4-Pass!2026` in
   `data/oyelearn.db`); production is unaffected.
