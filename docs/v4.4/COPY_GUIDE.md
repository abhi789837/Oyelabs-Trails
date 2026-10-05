# Admin copy guide (v4.4)

Who reads admin screens: a busy manager onboarding a new person between meetings. They know their
team. They do not know how Oyelearn works inside, and they should never have to.

## How to write

- **Reading level:** grade 6–8 (reading age 11–14). If a 12-year-old would stumble, rewrite it.
- **Short sentences.** 20 words or fewer. One idea per sentence. Paragraphs of 3 sentences at most.
- **Active voice, present tense, "you" and "we".** "We'll send the test", not "The assessment will be issued".
- **Say what happens next.** A status or an error ends with what the person can do, or what we do on our own.
- **Name people.** Use the person's name, or "they". Never guess "he" or "she".
- **Plain word first.** If a technical word is unavoidable, explain it the first time it appears.
- **Errors:** near the thing that failed, plain words, say what went wrong and how to fix it, never blame the reader,
  keep what they typed. No error codes unless "Show details" is open (use `PlainError`).
- **Waiting:** under 1 s show nothing; 2–10 s a short line with a spinner; over 10 s a step list with ticks and the
  time so far.
- **Buttons say what they do.** "Looks good — send the test", not "Submit".

## Banned words in admin-facing text

These words are about how the system is built, not about the person being trained. They must not appear
in admin screens (`src/features/admin/**`), the shared label maps admin screens show, admin error messages
from the server, or notifications written for staff. `src/features/admin/copyGuide.test.ts` enforces it.

| Don't say | Say instead |
|-----------|-------------|
| blueprint | test plan (for an assessment), course plan (for a path) |
| slot | question |
| mastery | skill level |
| prerequisite, prerequisite graph | what to learn first, comes before, "learn first" links |
| topological (order) | learning order |
| intent extraction | reading your description |
| bank, question bank | question library |
| rubric | marking guide |
| calibration, calibrate | question fine-tuning, checking question difficulty |
| token(s) | AI usage (in/out); "words read / written" when a count is shown |
| model | AI engine, AI version |
| slider value | priority |
| CEFR | English level |
| core tests / edge tests | main checks / extra checks |
| assessment (in onboarding copy) | test |
| intent | what you want (or "what you said") |

Words such as "AI", "test", "course", "skill" and "level" are fine.

## Technical data inside "Show details"

Some screens keep a collapsed **Show details** with the raw numbers (skill ids, the priority as a number, a model
id from the provider). Those values are data, not copy. When a banned word has to appear there, put
`// copy-ok: <reason>` (or `{/* copy-ok: <reason> */}` in JSX) on the line above. The reason is required. The
same comment works for a provider's own name for something (a model id like `claude-haiku-...`).

## What the scanner checks and skips

Checked: string literals, template text and JSX text in `src/features/admin/**` (not tests), the shared label maps
(`TASK_DEFAULTS` labels and notes, `SLIDER_LABELS`, `TARGET_LEVEL_LABELS`, `TASK_KIND_LABELS`, `PART_LABELS`,
`PERSONALISATION_LABELS`, `SCORING_MODE_LABELS`, `VERDICT_LABELS` and the other `*_LABELS` maps),
`shared/nextAction.ts`, server error messages (`badRequest`, `notFound`, `conflict`, ...) and `notify({ title, body })`
texts in the server folders admin screens read from.

Skipped: imports, comments, identifiers, object keys, type literals, CSS class strings, route paths and URLs,
values compared against (`kind === "bank"`), and data-ish properties and attributes (`key`, `id`, `queryKey`,
`value`, `kind`, `status`, ...). Words inside other words don't count ("tokenizer", "modelling").

## Examples

| Before | After |
|--------|-------|
| Question bank | Question library |
| The bank could not fill every slot | We didn't have enough ready questions for every part of the test |
| Model routing | Which AI engine does what |
| Input tokens / Output tokens | AI usage in / AI usage out |
| Rubric | Marking guide |
| Prerequisites | Learn first |
| Suggested setup | Here's the plan for Rahul |
| Save & assign assessment | Looks good — send the test |
| 400: Unsure phrase | We weren't sure what you meant by 'X'. Pick one. |
